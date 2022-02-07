import {EntityUID} from '../../../types/CommonTypes';
import {MixinBase} from '../../../types/TypeGenerators';
import Component from '../../core/Component';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import LightComponent from './LightComponent';

export interface ILightEntityMethods {
  getLight(): LightComponent;
}

export function addLight<EntityBaseClass extends MixinBase>(
  baseClass: EntityBaseClass,
  components: typeof Component[]
) {
  const Derived = class LightEntity extends (baseClass as any) {
    _lightComponent?: LightComponent;

    constructor(entityUID: EntityUID, isAlive: Boolean) {
      super(entityUID, isAlive);
    }

    /**
     * Get the CameraComponent of the entity.
     * It's a shortcut method of getComponent(CameraComponent).
     */
    getLight(): LightComponent {
      if (this.__lightComponent == null) {
        this.__lightComponent = this.getComponentByComponentTID(
          WellKnownComponentTIDs.LightComponentTID
        ) as LightComponent;
      }
      return this.__lightComponent;
    }
  };

  components.push(LightComponent);

  return {
    entityClass: Derived,
    components,
  };
}
