import CameraComponent from "../components/CameraComponent";
import Entity from "../core/Entity";

export default interface ICameraController {
  logic(cameraComponent: CameraComponent): void;
  registerEventListeners(eventTargetDom: any): void;
  unregisterEventListeners(): void;
  setTarget(targetEntity: Entity): void;
  getTarget(): Entity | undefined;
}
