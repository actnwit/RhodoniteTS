import type { ComponentSID, ComponentTID, EntityUID, Index } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository, applyMixins } from '../../core/EntityRepository';
import { ProcessStage } from '../../definitions/ProcessStage';
import { Is } from '../../misc';
import type { Engine } from '../../system/Engine';
import type { BlendShapeComponent } from '../BlendShape/BlendShapeComponent';
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
 * VrmComponent is a component that manages VRM model expressions and their associated blend shapes.
 * This component handles the mapping between VRM expressions and the underlying blend shape components,
 * allowing for facial expressions and other morphing effects in VRM models.
 */
export class VrmComponent extends Component {
  private __expressions: Map<VrmExpressionName, VrmExpression> = new Map();
  private __weights: Map<VrmExpressionName, number> = new Map();

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
  static get componentTID(): ComponentTID {
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
  }

  /**
   * Sets the weight for a specific VRM expression.
   * This method updates the expression weight and applies it to all associated blend shape binds.
   * @param expressionName - The name of the expression to modify
   * @param weight - The weight value to apply (typically between 0 and 1)
   */
  public setExpressionWeight(expressionName: VrmExpressionName, weight: number): void {
    const expression = this.__expressions.get(expressionName);
    if (Is.not.exist(expression)) {
      return;
    }
    this.__weights.set(expressionName, weight);
    for (const bind of expression.binds) {
      const entity = this.__engine.entityRepository.getEntity(bind.entityIdx);
      const blendShapeComponent = entity.tryToGetBlendShape();
      if (Is.exist(blendShapeComponent)) {
        blendShapeComponent.setWeightByIndex(bind.blendShapeIdx, weight);
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
