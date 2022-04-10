import { Component } from '../../core/Component';
import { ComponentRepository } from '../../core/ComponentRepository';
import { applyMixins, EntityRepository } from '../../core/EntityRepository';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import {ProcessStage} from '../../definitions/ProcessStage';
import {
  ComponentTID,
  ComponentSID,
  EntityUID,
} from '../../../types/CommonTypes';
import VRMSpringBonePhysicsStrategy from '../../physics/VRMSpringBonePhysicsStrategy';
import PhysicsStrategy from '../../physics/PhysicsStrategy';
import { IEntity } from '../../core/Entity';
import { ComponentToComponentMethods } from '../ComponentTypes';

export default class PhysicsComponent extends Component {
  private __strategy: PhysicsStrategy = new VRMSpringBonePhysicsStrategy();

  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityComponent: EntityRepository
  ) {
    super(entityUid, componentSid, entityComponent);

    this.moveStageTo(ProcessStage.Logic);
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.PhysicsComponentTID;
  }

  get strategy() {
    return this.__strategy;
  }

  static common_$logic() {
    VRMSpringBonePhysicsStrategy.update();
  }

  $logic() {}

  /**
   * @override
   * Add this component to the entity
   * @param base the target entity
   * @param _componentClass the component class to add
   */
  addThisComponentToEntity<
    EntityBase extends IEntity,
    SomeComponentClass extends typeof Component
  >(base: EntityBase, _componentClass: SomeComponentClass) {
    class PhysicsEntity extends (base.constructor as any) {
      constructor(
        entityUID: EntityUID,
        isAlive: Boolean,
        components?: Map<ComponentTID, Component>
      ) {
        super(entityUID, isAlive, components);
      }

      getPhysics() {
        return this.getComponentByComponentTID(
          WellKnownComponentTIDs.PhysicsComponentTID
        ) as PhysicsComponent;
      }
    }
    applyMixins(base, PhysicsEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> &
      EntityBase;
  }
}

ComponentRepository.registerComponentClass(PhysicsComponent);
