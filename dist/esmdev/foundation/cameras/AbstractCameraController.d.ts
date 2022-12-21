import { CameraComponent } from '../components/Camera/CameraComponent';
import { ISceneGraphEntity } from '../helpers/EntityHelper';
import { Vector3 } from '../math/Vector3';
export declare abstract class AbstractCameraController {
    zNearMax: number;
    zFarScalingFactor: number;
    autoCalculateZNearAndZFar: boolean;
    protected abstract __targetEntity?: ISceneGraphEntity;
    constructor();
    protected _calcZNearInner(camera: CameraComponent, eyePosition: Vector3, eyeDirection: Vector3): void;
    protected _calcZFarInner(camera: CameraComponent): void;
    abstract setTarget(targetEntity: ISceneGraphEntity): void;
    abstract getTarget(): ISceneGraphEntity | undefined;
}
