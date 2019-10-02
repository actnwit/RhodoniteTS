import CameraComponent from "../components/CameraComponent";
export default interface ICameraController {
    logic(cameraComponent: CameraComponent): void;
}
