import { CameraComponent } from '../components/Camera/CameraComponent';
import { ISceneGraphEntity } from '../helpers/EntityHelper';

export interface ICameraController {
  logic(cameraComponent: CameraComponent): void;
  registerEventListeners(eventTargetDom: any): void;
  unregisterEventListeners(): void;
  setTarget(targetEntity: ISceneGraphEntity): void;
  setTargets(targetEntities: ISceneGraphEntity[]): void;
  getTargets(): ISceneGraphEntity[];
}
