import Component from '../../core/Component';
import {EntityUID} from '../../../types/CommonTypes';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import {MixinBase} from '../../../types/TypeGenerators';
import CameraComponent from '../CameraComponent';

export interface ICameraEntityMethods {
  getCamera(): CameraComponent;
}

export function addCamera<EntityBaseClass extends MixinBase>(
  baseClass: EntityBaseClass,
  components: typeof Component[]
) {
  const Derived = class SceneGraphEntity extends (baseClass as any) {
    constructor(entityUID: EntityUID, isAlive: Boolean) {
      super(entityUID, isAlive);
    }

    /**
     * Get the CameraComponent of the entity.
     * It's a shortcut method of getComponent(CameraComponent).
     */
    getCamera(): CameraComponent {
      if (this.__cameraComponent == null) {
        this.__cameraComponent = this.getComponentByComponentTID(
          WellKnownComponentTIDs.CameraComponentTID
        ) as CameraComponent;
      }
      return this.__cameraComponent;
    }
  };

  components.push(CameraComponent);

  return {
    entityClass: Derived,
    components,
  };
}
