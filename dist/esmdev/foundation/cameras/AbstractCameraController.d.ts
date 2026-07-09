import type { CameraComponent } from '../components/Camera/CameraComponent';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { Vector3 } from '../math/Vector3';
/**
 * AbstractCameraController is an abstract class that defines the interface for camera controllers.
 *
 * @internal
 */
export declare abstract class AbstractCameraController {
    zNearMax: number;
    zFarScalingFactor: number;
    autoCalculateZNearAndZFar: boolean;
    protected abstract __targetEntities: ISceneGraphEntity[];
    /**
     * Calculates the near clipping plane (zNear) for the camera based on the target entities' bounding boxes.
     * This method is used when autoCalculateZNearAndZFar is enabled and there are target entities.
     * @param camera - The camera component to update.
     * @param eyePosition - The position of the camera's eye in world space.
     * @param eyeDirection - The direction the camera is facing.
     */
    protected _calcZNearInner(camera: CameraComponent, eyePosition: Vector3, eyeDirection: Vector3): void;
    /**
     * Calculates the far clipping plane (zFar) for the camera based on the near clipping plane and a scaling factor.
     * This method is used when autoCalculateZNearAndZFar is enabled.
     * @param camera - The camera component to update.
     */
    protected _calcZFarInner(camera: CameraComponent): void;
    abstract setTarget(targetEntity: ISceneGraphEntity): void;
    abstract setTargets(targetEntities: ISceneGraphEntity[]): void;
    abstract getTargets(): ISceneGraphEntity[];
}
