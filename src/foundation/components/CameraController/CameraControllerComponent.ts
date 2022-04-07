import Component from '../../core/Component';
import {
  EntityUID,
  ComponentSID,
  ComponentTID,
} from '../../../types/CommonTypes';
import EntityRepository, {applyMixins} from '../../core/EntityRepository';
import CameraComponent from '../Camera/CameraComponent';
import {ProcessStage} from '../../definitions/ProcessStage';
import ComponentRepository from '../../core/ComponentRepository';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import OrbitCameraController from '../../cameras/OrbitCameraController';
import ICameraController from '../../cameras/ICameraController';
import WalkThroughCameraController from '../../cameras/WalkThroughCameraController';
import {
  CameraControllerTypeEnum,
  CameraControllerType,
} from '../../definitions/CameraControllerType';
import {IEntity} from '../../core/Entity';
import {ComponentToComponentMethods} from '../ComponentTypes';

export default class CameraControllerComponent extends Component {
  private __cameraComponent?: CameraComponent;
  private __cameraController: ICameraController;

  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository
  ) {
    super(entityUid, componentSid, entityRepository);
    this.__cameraController = new OrbitCameraController();
  }

  set type(type: CameraControllerTypeEnum) {
    this.__cameraController.unregisterEventListeners();
    if (type === CameraControllerType.Orbit) {
      this.__cameraController = new OrbitCameraController();
    } else if (type === CameraControllerType.WalkThrough) {
      this.__cameraController = new WalkThroughCameraController();
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

  $create() {
    this.__cameraComponent = EntityRepository.getComponentOfEntity(
      this.__entityUid,
      CameraComponent
    ) as CameraComponent;

    this.moveStageTo(ProcessStage.Logic);
  }

  $logic() {
    if (this.__cameraController) {
      this.__cameraController.logic(this.__cameraComponent!);
    }
  }

  addThisComponentToEntity<
    EntityBase extends IEntity,
    SomeComponentClass extends typeof Component
  >(base: EntityBase, _componentClass: SomeComponentClass) {
    class CameraControllerEntity extends (base.constructor as any) {
      constructor(
        entityUID: EntityUID,
        isAlive: Boolean,
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
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> &
      EntityBase;
  }
}
ComponentRepository.registerComponentClass(CameraControllerComponent);
