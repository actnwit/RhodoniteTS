import { CameraComponent } from '../components/Camera/CameraComponent';
import {ISceneGraphEntity} from '../helpers/EntityHelper';

export default interface ICameraController {
  logic(cameraComponent: CameraComponent): void;
  registerEventListeners(eventTargetDom: any): void;
  unregisterEventListeners(): void;
  setTarget(targetEntity: ISceneGraphEntity): void;
  getTarget(): ISceneGraphEntity | undefined;
}
