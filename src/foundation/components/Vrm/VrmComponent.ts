import type { ComponentSID, ComponentTID, EntityUID, Index } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { applyMixins, type EntityRepository } from '../../core/EntityRepository';
import { ProcessStage } from '../../definitions/ProcessStage';
import { Is } from '../../misc';
import type { Engine } from '../../system/Engine';
import { BlendShapeComponent } from '../BlendShape/BlendShapeComponent';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export type VrmExpressionName = string;
export type VrmExpressionMorphBind = {
  entityIdx: Index; //
  blendShapeIdx: Index; // morph target index in primitive
  weight: number; // [0,1]
};
export type VrmExpression = {
  name: VrmExpressionName;
  isBinary: boolean;
  binds: VrmExpressionMorphBind[];
};

/**
 * Reverse index entry for one morph target: every expression that contributes to it.
 * Used to recompute a morph target from scratch without iterating all expressions and binds.
 */
type MorphTargetContributors = {
  entityIdx: Index;
  blendShapeIdx: Index;
  contributions: Array<{ expressionName: VrmExpressionName; weight: number }>;
};

/**
 * VrmComponent is a component that manages VRM model expressions and their associated blend shapes.
 * This component handles the mapping between VRM expressions and the underlying blend shape components,
 * allowing for facial expressions and other morphing effects in VRM models.
 */
export class VrmComponent extends Component {
  private __expressions: Map<VrmExpressionName, VrmExpression> = new Map();
  private __weights: Map<VrmExpressionName, number> = new Map();
  /** morph target key -> expressions that contribute to it (rebuilt when expressions change). */
  private __morphTargetContributors: Map<string, MorphTargetContributors> = new Map();
  /** expression name -> morph target keys it affects (rebuilt when expressions change). */
  private __expressionMorphTargetKeys: Map<VrmExpressionName, string[]> = new Map();
  /** Reused scratch set of morph target keys affected by the current update. */
  private __changedMorphTargetKeys: Set<string> = new Set();
  /** True until all morph targets have been written once after the expression set changed. */
  private __needsFullMorphTargetUpdate = true;
  /**
   * BlendShapeComponent.updateCount observed after the last morph target application.
   * If the counter moved without this component writing, another writer (a weights animation
   * channel, an editor slider, ...) changed morph weights and they must be recomputed.
   */
  private __lastAppliedBlendShapeUpdateCount = -1;

  public _version = '';

  /**
   * Creates a new VrmComponent instance.
   * @param engine - The engine instance
   * @param entityUid - Unique identifier for the entity this component belongs to
   * @param componentSid - Unique identifier for this component instance
   * @param entityComponent - The entity repository managing this component
   * @param isReUse - Whether this component is being reused from a pool
   */
  constructor(
    engine: Engine,
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityComponent: EntityRepository,
    isReUse: boolean
  ) {
    super(engine, entityUid, componentSid, entityComponent, isReUse);
    this.moveStageTo(ProcessStage.Logic);
  }

  /**
   * Gets the component type identifier for VrmComponent.
   * @returns The component type ID for VrmComponent
   */
  static get componentTID() {
    return WellKnownComponentTIDs.VrmComponentTID;
  }

  /**
   * Gets the component type identifier for this VrmComponent instance.
   * @returns The component type ID for VrmComponent
   */
  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.VrmComponentTID;
  }

  /**
   * Sets the VRM expressions for this component.
   * This method initializes the expressions map and sets initial weights to 0.
   * @param expressions - Array of VRM expressions to register
   */
  public setVrmExpressions(expressions: VrmExpression[]) {
    for (const exp of expressions) {
      this.__expressions.set(exp.name, exp);
      this.__weights.set(exp.name, 0);
    }
    this.__rebuildMorphTargetContributors();
    this.__needsFullMorphTargetUpdate = true;
  }

  /**
   * Builds the reverse index used for differential morph target updates.
   * Called only when the expression set changes, never per frame.
   */
  private __rebuildMorphTargetContributors() {
    this.__morphTargetContributors.clear();
    this.__expressionMorphTargetKeys.clear();
    for (const [expressionName, expression] of this.__expressions) {
      const keys: string[] = [];
      for (const bind of expression.binds) {
        const key = `${bind.entityIdx}:${bind.blendShapeIdx}`;
        let target = this.__morphTargetContributors.get(key);
        if (target === undefined) {
          target = { entityIdx: bind.entityIdx, blendShapeIdx: bind.blendShapeIdx, contributions: [] };
          this.__morphTargetContributors.set(key, target);
        }
        target.contributions.push({ expressionName, weight: bind.weight });
        keys.push(key);
      }
      this.__expressionMorphTargetKeys.set(expressionName, keys);
    }
  }

  /**
   * Sets the weight for a specific VRM expression.
   * This method clamps the input, applies binary-expression behavior, and updates
   * all associated blend shape binds using the accumulated contribution from every expression.
   * @param expressionName - The name of the expression to modify
   * @param weight - The weight value to apply (typically between 0 and 1)
   */
  public setExpressionWeight(expressionName: VrmExpressionName, weight: number): void {
    const changedKeys = this.__changedMorphTargetKeys;
    changedKeys.clear();
    const isFullUpdate =
      this.__needsFullMorphTargetUpdate || this.__lastAppliedBlendShapeUpdateCount !== BlendShapeComponent.updateCount;
    if (isFullUpdate) {
      for (const key of this.__morphTargetContributors.keys()) {
        changedKeys.add(key);
      }
    }
    this.__setExpressionWeight(expressionName, weight, changedKeys);
    if (changedKeys.size > 0) {
      this.__applyMorphTargets(changedKeys);
    }
    this.__lastAppliedBlendShapeUpdateCount = BlendShapeComponent.updateCount;
    if (this.__needsFullMorphTargetUpdate) {
      this.__needsFullMorphTargetUpdate = false;
    }
    changedKeys.clear();
  }

  /**
   * Sets multiple VRM expression weights and updates only the morph targets whose total changed.
   * This is used when several expression animation channels are evaluated together.
   * @param expressionWeights - Expression names and their evaluated weights
   */
  public setExpressionWeights(expressionWeights: ReadonlyMap<VrmExpressionName, number>): void {
    const changedKeys = this.__changedMorphTargetKeys;
    changedKeys.clear();
    const isFullUpdate =
      this.__needsFullMorphTargetUpdate || this.__lastAppliedBlendShapeUpdateCount !== BlendShapeComponent.updateCount;
    if (isFullUpdate) {
      for (const key of this.__morphTargetContributors.keys()) {
        changedKeys.add(key);
      }
    }
    for (const [expressionName, weight] of expressionWeights) {
      this.__setExpressionWeight(expressionName, weight, changedKeys);
    }

    if (changedKeys.size > 0) {
      this.__applyMorphTargets(changedKeys);
    }
    this.__lastAppliedBlendShapeUpdateCount = BlendShapeComponent.updateCount;
    if (this.__needsFullMorphTargetUpdate) {
      this.__needsFullMorphTargetUpdate = false;
    }
    changedKeys.clear();
  }

  /**
   * Applies one expression weight.
   * @param expressionName - The expression to update
   * @param weight - The requested weight
   * @param changedKeys - Receives the morph target keys affected by a change
   * @returns True when the applied weight actually changed
   */
  private __setExpressionWeight(expressionName: VrmExpressionName, weight: number, changedKeys: Set<string>): boolean {
    const expression = this.__expressions.get(expressionName);
    if (Is.not.exist(expression)) {
      return false;
    }
    const clampedWeight = Math.min(1, Math.max(0, weight));
    const appliedWeight = expression.isBinary ? (clampedWeight > 0.5 ? 1 : 0) : clampedWeight;
    if (this.__weights.get(expressionName) === appliedWeight) {
      return false;
    }
    this.__weights.set(expressionName, appliedWeight);

    const affectedKeys = this.__expressionMorphTargetKeys.get(expressionName);
    if (affectedKeys !== undefined) {
      for (let i = 0; i < affectedKeys.length; i++) {
        changedKeys.add(affectedKeys[i]);
      }
    }
    return true;
  }

  /**
   * Recomputes the given morph targets from all expression contributions.
   *
   * Multiple VRM expressions may bind the same morph target. Applying each expression directly
   * would make the result depend on map insertion order, so contributions are accumulated first.
   * The total is recomputed from the contributing expressions (not accumulated as a delta) to avoid
   * floating point drift.
   *
   * @param morphTargetKeys - Keys of the morph targets to recompute
   */
  private __applyMorphTargets(morphTargetKeys: ReadonlySet<string>): void {
    for (const key of morphTargetKeys) {
      const target = this.__morphTargetContributors.get(key);
      if (target === undefined) {
        continue;
      }
      let totalWeight = 0;
      for (let i = 0; i < target.contributions.length; i++) {
        const contribution = target.contributions[i];
        const expressionWeight = this.__weights.get(contribution.expressionName) ?? 0;
        totalWeight += expressionWeight * contribution.weight;
      }

      const entity = this.__engine.entityRepository.getEntity(target.entityIdx);
      const blendShapeComponent = entity.tryToGetBlendShape();
      if (Is.exist(blendShapeComponent)) {
        blendShapeComponent.setWeightByIndex(target.blendShapeIdx, totalWeight);
      }
    }
  }

  /**
   * Gets the current weight of a specific VRM expression.
   * @param expressionName - The name of the expression to query
   * @returns The current weight of the expression, or undefined if the expression doesn't exist
   */
  public getExpressionWeight(expressionName: VrmExpressionName): number | undefined {
    return this.__weights.get(expressionName);
  }

  /**
   * Gets all available expression names registered in this component.
   * @returns An array of all expression names
   */
  public getExpressionNames(): string[] {
    return Array.from(this.__expressions.keys());
  }

  /**
   * Creates a shallow copy of this component from another VrmComponent.
   * This method copies the expressions, weights, and version information.
   * @param component - The source component to copy from
   * @protected
   */
  _shallowCopyFrom(component: Component): void {
    const vrmComponent = component as VrmComponent;
    this.__expressions = new Map(vrmComponent.__expressions);
    this.__weights = new Map(vrmComponent.__weights);
    this._version = vrmComponent._version;
    this.__rebuildMorphTargetContributors();
    this.__needsFullMorphTargetUpdate = true;
  }

  /**
   * Destroys this component and cleans up resources.
   * @protected
   */
  _destroy(): void {
    super._destroy();
  }

  /**
   * Adds this VrmComponent to an entity by extending the entity with VRM-specific methods.
   * This method uses mixins to add a getVrm() method to the target entity.
   * @param base - The target entity to extend
   * @param _componentClass - The component class being added
   * @returns The extended entity with VRM functionality
   * @template EntityBase - The base entity type
   * @template SomeComponentClass - The component class type
   */
  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class VrmEntity extends (base.constructor as any) {
      private __vrmComponent?: VrmComponent;

      /**
       * Gets the VrmComponent associated with this entity.
       * @returns The VrmComponent instance
       */
      getVrm() {
        if (this.__vrmComponent === undefined) {
          this.__vrmComponent = this.getComponentByComponentTID(WellKnownComponentTIDs.VrmComponentTID) as VrmComponent;
        }
        return this.__vrmComponent;
      }
    }
    applyMixins(base, VrmEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}
