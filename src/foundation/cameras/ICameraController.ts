import CameraComponent from '../components/CameraComponent';
import {IGroupEntity} from '../helpers/EntityHelper';

export default interface ICameraController {
  logic(cameraComponent: CameraComponent): void;
  registerEventListeners(eventTargetDom: any): void;
  unregisterEventListeners(): void;
  setTarget(targetEntity: IGroupEntity): void;
  getTarget(): IGroupEntity | undefined;
}
