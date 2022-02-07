import LightComponent from '../components/Camera/CameraComponent';
import {IGroupEntity} from '../helpers/EntityHelper';

export default interface ICameraController {
  logic(cameraComponent: LightComponent): void;
  registerEventListeners(eventTargetDom: any): void;
  unregisterEventListeners(): void;
  setTarget(targetEntity: IGroupEntity): void;
  getTarget(): IGroupEntity | undefined;
}
