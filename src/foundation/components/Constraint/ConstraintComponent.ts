import { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { IVrmConstraint } from '../../constraints/IVrmConstraint';
import { VrmRollConstraint } from '../../constraints/VrmRollConstraint';
import { Component } from '../../core/Component';
import { ComponentRepository } from '../../core/ComponentRepository';
import { IEntity } from '../../core/Entity';
import { EntityRepository, applyMixins } from '../../core/EntityRepository';
import { ProcessStage } from '../../definitions/ProcessStage';
import { IConstraintEntity } from '../../helpers/EntityHelper';
import { ComponentToComponentMethods } from '../ComponentTypes';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export class ConstraintComponent extends Component {
  private __vrmConstraint?: IVrmConstraint;

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository) {
    super(entityUid, componentSid, entityComponent);
    this.moveStageTo(ProcessStage.Logic);
  }
  /**
   * get the entity which has this component.
   * @returns the entity which has this component
   */
  get entity(): IConstraintEntity {
    return EntityRepository.getEntity(this.__entityUid) as unknown as IConstraintEntity;
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.ConstraintComponentTID;
  }

  $logic() {
    if (this.__vrmConstraint) {
      this.__vrmConstraint.update();
    }
  }

  setConstraint(constraint: IVrmConstraint) {
    this.__vrmConstraint = constraint;
  }

  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class ConstraintEntity extends (base.constructor as any) {
      constructor(
        entityUID: EntityUID,
        isAlive: boolean,
        components?: Map<ComponentTID, Component>
      ) {
        super(entityUID, isAlive, components);
      }

      getConstraint() {
        return this.getComponentByComponentTID(
          WellKnownComponentTIDs.ConstraintComponentTID
        ) as ConstraintComponent;
      }
    }
    applyMixins(base, ConstraintEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}
ComponentRepository.registerComponentClass(ConstraintComponent);