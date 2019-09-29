import Component from "../core/Component";
import { EntityUID, ComponentSID, ComponentTID } from "../../types/CommonTypes";
import EntityRepository from "../core/EntityRepository";
import CameraComponent from "./CameraComponent";
import { ProcessStage } from "../definitions/ProcessStage";
import ComponentRepository from "../core/ComponentRepository";
import { WellKnownComponentTIDs } from "./WellKnownComponentTIDs";
import OrbitCameraController from "../cameras/OrbitCameraController";
import ICameraController from "../cameras/ICameraController";

export default class CameraControllerComponent extends Component {
  private __cameraComponent?: CameraComponent;
  private __cameraController: ICameraController;

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);
    this.__cameraController = new OrbitCameraController();
  }

  setCameraController() {}

  $create() {
    this.__cameraComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, CameraComponent) as CameraComponent;

    this.moveStageTo(ProcessStage.Logic);
  }

  $logic() {
    if (this.__cameraController) {
      this.__cameraController.logic(this.__cameraComponent!);
    }
  }

  get controller() {
    return this.__cameraController;
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.CameraControllerComponentTID;
  }
}
ComponentRepository.registerComponentClass(CameraControllerComponent);
