import Component from '../../core/Component';
import {EntityUID} from '../../../types/CommonTypes';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import {MixinBase} from '../../../types/TypeGenerators';
import CameraControllerComponent from './CameraControllerComponent';

export interface ICameraControllerEntityMethods {
  getCameraController(): CameraControllerComponent;
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
     * Get the CameraControllerComponent of the entity.
     * It's a shortcut method of getComponent(CameraControllerComponent).
     */
    getCameraController(): CameraControllerComponent {
      if (this.__cameraComponent == null) {
        this.__cameraComponent = this.getComponentByComponentTID(
          WellKnownComponentTIDs.CameraControllerComponentTID
        ) as CameraControllerComponent;
      }
      return this.__cameraComponent;
    }
  };

  components.push(CameraControllerComponent);

  return {
    entityClass: Derived,
    components,
  };
}
