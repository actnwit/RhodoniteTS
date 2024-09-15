import { Component } from '../../core/Component';
import { ComponentRepository } from '../../core/ComponentRepository';
import { applyMixins, EntityRepository } from '../../core/EntityRepository';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';
import { ProcessStage } from '../../definitions/ProcessStage';
import { ComponentTID, ComponentSID, EntityUID } from '../../../types/CommonTypes';
import { PhysicsStrategy } from '../../physics/PhysicsStrategy';
import { IEntity } from '../../core/Entity';
import { ComponentToComponentMethods } from '../ComponentTypes';
import { OimoPhysicsStrategy } from '../../physics/Oimo/OimoPhysicsStrategy';
import { IPhysicsEntity } from '../../helpers/EntityHelper';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';

export class PhysicsComponent extends Component {
  private __strategy?: PhysicsStrategy;

  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityComponent: EntityRepository,
    isReUse: boolean
  ) {
    super(entityUid, componentSid, entityComponent, isReUse);

    this.moveStageTo(ProcessStage.Logic);
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.PhysicsComponentTID;
  }

  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.PhysicsComponentTID;
  }

  setStrategy(strategy: PhysicsStrategy) {
    this.__strategy = strategy;
  }

  get strategy() {
    return this.__strategy;
  }

  static common_$logic() {
    OimoPhysicsStrategy.update();
  }

  $logic() {
    this.__strategy?.update();
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
    class PhysicsEntity extends (base.constructor as any) {
      constructor(
        entityUID: EntityUID,
        isAlive: boolean,
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
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}

ComponentRepository.registerComponentClass(PhysicsComponent);

export function createPhysicsEntity(): IPhysicsEntity {
  const entity = createGroupEntity();
  const entityAddedComponent = EntityRepository.addComponentToEntity(PhysicsComponent, entity);
  return entityAddedComponent;
}
