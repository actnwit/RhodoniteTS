import { Component } from '../../core/Component';
import { EntityUID, ComponentSID, ComponentTID } from '../../../types/CommonTypes';
import { applyMixins, EntityRepository } from '../../core/EntityRepository';
import { ComponentRepository } from '../../core/ComponentRepository';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';
import { OrbitCameraController } from '../../cameras/OrbitCameraController';
import { ICameraController } from '../../cameras/ICameraController';
import { WalkThroughCameraController } from '../../cameras/WalkThroughCameraController';
import {
  CameraControllerTypeEnum,
  CameraControllerType,
} from '../../definitions/CameraControllerType';
import { IEntity } from '../../core/Entity';
import { ComponentToComponentMethods } from '../ComponentTypes';
import { ProcessStage } from '../../definitions';

/**
 * The Component that controls camera posture.
 */
export class CameraControllerComponent extends Component {
  private __cameraController: ICameraController;
  private static __updateCount = 0;

  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository,
    isReUse: boolean
  ) {
    super(entityUid, componentSid, entityRepository, isReUse);
    this.__cameraController = new OrbitCameraController(this);
  }

  set type(type: CameraControllerTypeEnum) {
    this.__cameraController.unregisterEventListeners();
    if (type === CameraControllerType.Orbit) {
      this.__cameraController = new OrbitCameraController(this);
    } else if (type === CameraControllerType.WalkThrough) {
      this.__cameraController = new WalkThroughCameraController(this);
    } else {
      console.warn('Not support type!');
    }
  }

  get type() {
    if (this.__cameraController instanceof OrbitCameraController) {
      return CameraControllerType.Orbit;
    } else {
      return CameraControllerType.WalkThrough;
    }
  }

  get controller() {
    return this.__cameraController;
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.CameraControllerComponentTID;
  }

  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.CameraControllerComponentTID;
  }

  $load() {
    this.moveStageTo(ProcessStage.Logic);
  }

  $logic() {
    if (this.__cameraController) {
      this.__cameraController.logic(this.entity.tryToGetCamera()!);
    }
  }

  _updateCount(count: number) {
    CameraControllerComponent.__updateCount = count;
  }

  static get updateCount() {
    return CameraControllerComponent.__updateCount;
  }

  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class CameraControllerEntity extends (base.constructor as any) {
      constructor(
        entityUID: EntityUID,
        isAlive: boolean,
        components?: Map<ComponentTID, Component>
      ) {
        super(entityUID, isAlive, components);
      }

      getCameraController() {
        return this.getComponentByComponentTID(
          WellKnownComponentTIDs.CameraControllerComponentTID
        ) as CameraControllerComponent;
      }
    }
    applyMixins(base, CameraControllerEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}
ComponentRepository.registerComponentClass(CameraControllerComponent);
