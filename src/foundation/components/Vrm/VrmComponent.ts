import { ComponentSID, ComponentTID, EntityUID, Index } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import { ComponentRepository } from '../../core/ComponentRepository';
import { IEntity } from '../../core/Entity';
import { applyMixins, EntityRepository } from '../../core/EntityRepository';
import { ProcessStage } from '../../definitions/ProcessStage';
import { Is } from '../../misc';
import { BlendShapeComponent } from '../BlendShape/BlendShapeComponent';
import { ComponentToComponentMethods } from '../ComponentTypes';
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

export class VrmComponent extends Component {
  private __expressions: Map<VrmExpressionName, VrmExpression> = new Map();
  private __weights: Map<VrmExpressionName, number> = new Map();
  private __blendShapeComponent?: BlendShapeComponent;
  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository) {
    super(entityUid, componentSid, entityComponent);
    this.moveStageTo(ProcessStage.Logic);
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.VrmComponentTID;
  }

  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.VrmComponentTID;
  }

  public setVrmExpressions(expressions: VrmExpression[]) {
    for (const exp of expressions) {
      this.__expressions.set(exp.name, exp);
      this.__weights.set(exp.name, 0);
    }
  }

  public setExpressionWeight(expressionName: VrmExpressionName, weight: number): void {
    const expression = this.__expressions.get(expressionName);
    if (Is.not.exist(expression)) {
      return;
    }
    this.__weights.set(expressionName, weight);
    for (const bind of expression.binds) {
      const entity = EntityRepository.getEntity(bind.entityIdx);
      const blendShapeComponent = entity.tryToGetBlendShape();
      if (Is.exist(blendShapeComponent)) {
        blendShapeComponent.setWeightByIndex(bind.blendShapeIdx, weight);
      }
    }
  }

  public getExpressionWeight(expressionName: VrmExpressionName): number | undefined {
    return this.__weights.get(expressionName);
  }

  public getExpressionNames(): string[] {
    return Array.from(this.__expressions.keys());
  }

  /**
   * @override
   * Add this component to the entity
   * @param base the target entity
   * @param _componentClass the component class to add
   */
  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class VrmEntity extends (base.constructor as any) {
      private __vrmComponent?: VrmComponent;
      constructor(
        entityUID: EntityUID,
        isAlive: boolean,
        components?: Map<ComponentTID, Component>
      ) {
        super(entityUID, isAlive, components);
      }

      getVrm() {
        if (this.__vrmComponent === undefined) {
          this.__vrmComponent = this.getComponentByComponentTID(
            WellKnownComponentTIDs.VrmComponentTID
          ) as VrmComponent;
        }
        return this.__vrmComponent;
      }
    }
    applyMixins(base, VrmEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}
ComponentRepository.registerComponentClass(VrmComponent);
