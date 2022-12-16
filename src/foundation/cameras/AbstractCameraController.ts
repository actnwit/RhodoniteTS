import { CameraComponent } from '../components/Camera/CameraComponent';
import { ISceneGraphEntity } from '../helpers/EntityHelper';
import { Vector3 } from '../math/Vector3';
import { Is } from '../misc/Is';

export abstract class AbstractCameraController {
  public zNearMax = 0.1;
  public zFarScalingFactor = 100000;
  public autoCalculateZNearAndZFar = true;
  protected abstract __targetEntity?: ISceneGraphEntity;

  constructor() {}

  protected _calcZNearInner(camera: CameraComponent, eyePosition: Vector3, eyeDirection: Vector3) {
    if (this.autoCalculateZNearAndZFar && Is.exist(this.__targetEntity)) {
      const targetAABB = this.__targetEntity.getSceneGraph().worldAABB;
      const lengthOfCenterToEye = Vector3.lengthBtw(eyePosition, targetAABB.centerPoint);

      // calc cos between eyeToTarget and eye direction
      const eyeToTargetDirectionX = targetAABB.centerPoint.x - eyePosition.x;
      const eyeToTargetDirectionY = targetAABB.centerPoint.y - eyePosition.y;
      const eyeToTargetDirectionZ = targetAABB.centerPoint.z - eyePosition.z;
      const cos =
        (eyeToTargetDirectionX * eyeDirection.x +
          eyeToTargetDirectionY * eyeDirection.y +
          eyeToTargetDirectionZ * eyeDirection.z) /
        (Math.hypot(eyeToTargetDirectionX, eyeToTargetDirectionY, eyeToTargetDirectionZ) *
          eyeDirection.length());

      camera.zNearInner = Math.max(
        Math.min(lengthOfCenterToEye * cos - targetAABB.lengthCenterToCorner, this.zNearMax),
        0.01
      );
    } else {
      camera.zNearInner = camera.zNear;
    }
  }

  protected _calcZFarInner(camera: CameraComponent) {
    if (this.autoCalculateZNearAndZFar) {
      camera.zFarInner = camera.zNearInner * this.zFarScalingFactor;
    } else {
      camera.zNearInner = camera.zFar;
    }
  }

  abstract setTarget(targetEntity: ISceneGraphEntity): void;
  abstract getTarget(): ISceneGraphEntity | undefined;
}
