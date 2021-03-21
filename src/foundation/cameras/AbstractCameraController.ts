import CameraComponent from '../components/CameraComponent';
import Entity from '../core/Entity';
import Vector3 from '../math/Vector3';

export default abstract class AbstractCameraController {
  public zNearLimitFactor = 10; // must be more than 0
  public zFarScalingFactor = 10000;
  public autoCalculateZNearAndZFar = true;
  protected abstract __targetEntity?: Entity;

  constructor() {}

  protected _calcZNearInner(
    camera: CameraComponent,
    eyePosition: Vector3,
    eyeDirection: Vector3
  ) {
    if (this.autoCalculateZNearAndZFar && this.__targetEntity != null) {
      const targetAABB = this.__targetEntity.getSceneGraph().worldAABB;
      const lengthOfCenterToEye = Vector3.lengthBtw(
        eyePosition,
        targetAABB.centerPoint
      );
      const sizeMin = Math.min(
        targetAABB.sizeX,
        targetAABB.sizeY,
        targetAABB.sizeZ
      );

      // avoid minLimit equals to 0
      const halfSizeMinNon0 =
        sizeMin > 0
          ? sizeMin / 2
          : Math.min(
              targetAABB.sizeX > 0 ? targetAABB.sizeX : Infinity,
              targetAABB.sizeY > 0 ? targetAABB.sizeY : Infinity,
              targetAABB.sizeZ > 0 ? targetAABB.sizeZ : Infinity
            ) / 2;

      const minLimit = halfSizeMinNon0 / this.zNearLimitFactor;

      if (lengthOfCenterToEye - targetAABB.lengthCenterToCorner < minLimit) {
        camera.zNearInner = minLimit;
        return;
      }

      // calc cos between eyeToTarget and eye direction
      const eyeToTargetDirectionX =
        targetAABB.centerPoint.x - eyePosition.x;
      const eyeToTargetDirectionY =
        targetAABB.centerPoint.y - eyePosition.y;
      const eyeToTargetDirectionZ =
        targetAABB.centerPoint.z - eyePosition.z;
      const cos =
        (eyeToTargetDirectionX * eyeDirection.x +
          eyeToTargetDirectionY * eyeDirection.y +
          eyeToTargetDirectionZ * eyeDirection.z) /
        (Math.hypot(
          eyeToTargetDirectionX,
          eyeToTargetDirectionY,
          eyeToTargetDirectionZ
        ) *
          eyeDirection.length());

      camera.zNearInner = Math.max(
        lengthOfCenterToEye * cos - targetAABB.lengthCenterToCorner,
        minLimit
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

  abstract setTarget(targetEntity: Entity): void;
  abstract getTarget(): Entity | undefined;
}
