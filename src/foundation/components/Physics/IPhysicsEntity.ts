import {EntityUID} from '../../../types/CommonTypes';
import {MixinBase} from '../../../types/TypeGenerators';
import Component from '../../core/Component';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import PhysicsComponent from './PhysicsComponent';

export interface IPhysicsEntityMethods {
  getPhysics(): PhysicsComponent;
}

export function addPhysics<EntityBaseClass extends MixinBase>(
  baseClass: EntityBaseClass,
  components: typeof Component[]
) {
  const Derived = class PhysicsEntity extends (baseClass as any) {
    __physicsComponent?: PhysicsComponent;

    constructor(entityUID: EntityUID, isAlive: Boolean) {
      super(entityUID, isAlive);
    }

    /**
     * Get the PhysicsComponent of the entity.
     * It's a shortcut method of getComponent(PhysicsComponent).
     */
    getPhysics(): PhysicsComponent {
      if (this.__physicsComponent == null) {
        this.__physicsComponent = this.getComponentByComponentTID(
          WellKnownComponentTIDs.PhysicsComponentTID
        ) as PhysicsComponent;
      }
      return this.__physicsComponent;
    }
  };

  components.push(PhysicsComponent);

  return {
    entityClass: Derived,
    components,
  };
}
