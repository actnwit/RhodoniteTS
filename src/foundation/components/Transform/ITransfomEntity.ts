import Component from '../../core/Component';
import {EntityUID} from '../../../types/CommonTypes';
import TransformComponent from '../TransformComponent';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import {MixinBase} from '../../../types/TypeGenerators';
import {IEntity} from '../../core/Entity';

export interface ITranformEntity extends IEntity {
  getTransform(): TransformComponent;
}

export function addTransform<EntityBaseClass extends MixinBase>(
  baseClass: EntityBaseClass,
  components: typeof Component[]
) {
  const Derived = class TransformEntity extends (baseClass as any) {
    constructor(entityUID: EntityUID, isAlive: Boolean) {
      super(entityUID, isAlive);
    }

    /**
     * Get the TransformComponent of the entity.
     * It's a shortcut method of getComponent(TransformComponent).
     */
    getTransform(): TransformComponent {
      if (this.__transformComponent == null) {
        this.__transformComponent = this.getComponentByComponentTID(
          WellKnownComponentTIDs.TransformComponentTID
        ) as TransformComponent;
      }
      return this.__transformComponent;
    }
  };

  components.push(TransformComponent);

  return {
    entityClass: Derived,
    components,
  };
}
