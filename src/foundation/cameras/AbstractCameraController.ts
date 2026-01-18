import type { CameraComponent } from '../components/Camera/CameraComponent';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { AABB } from '../math/AABB';
import { Vector3 } from '../math/Vector3';
import { Is } from '../misc/Is';

/**
 * AbstractCameraController is an abstract class that defines the interface for camera controllers.
 *
 * @internal
 */
export abstract class AbstractCameraController {
  public zNearMax = 0.1;
  public zFarScalingFactor = 100000;
  public autoCalculateZNearAndZFar = true;
  protected abstract __targetEntities: ISceneGraphEntity[];

  /**
   * Calculates the near clipping plane (zNear) for the camera based on the target entities' bounding boxes.
   * This method is used when autoCalculateZNearAndZFar is enabled and there are target entities.
   * @param camera - The camera component to update.
   * @param eyePosition - The position of the camera's eye in world space.
   * @param eyeDirection - The direction the camera is facing.
   */
  protected _calcZNearInner(camera: CameraComponent, eyePosition: Vector3, eyeDirection: Vector3) {
    if (this.autoCalculateZNearAndZFar && this.__targetEntities.length > 0) {
      const aabb = new AABB();
      for (const targetEntity of this.__targetEntities) {
        aabb.mergeAABB(targetEntity.getSceneGraph().worldMergedAABBWithSkeletal);
      }
      const targetAABB = aabb;
      const lengthOfCenterToEye = Vector3.lengthBtw(eyePosition, targetAABB.centerPoint);

      // calc cos between eyeToTarget and eye direction
      const eyeToTargetDirectionX = targetAABB.centerPoint.x - eyePosition.x;
      const eyeToTargetDirectionY = targetAABB.centerPoint.y - eyePosition.y;
      const eyeToTargetDirectionZ = targetAABB.centerPoint.z - eyePosition.z;
      const cos =
        (eyeToTargetDirectionX * eyeDirection.x +
          eyeToTargetDirectionY * eyeDirection.y +
          eyeToTargetDirectionZ * eyeDirection.z) /
        (Math.hypot(eyeToTargetDirectionX, eyeToTargetDirectionY, eyeToTargetDirectionZ) * eyeDirection.length());

      camera.zNearInner = Math.max(
        Math.min(lengthOfCenterToEye * cos - targetAABB.lengthCenterToCorner, this.zNearMax),
        0.01
      );
    } else {
      camera.zNearInner = camera.zNear;
    }
  }

  /**
   * Calculates the far clipping plane (zFar) for the camera based on the near clipping plane and a scaling factor.
   * This method is used when autoCalculateZNearAndZFar is enabled.
   * @param camera - The camera component to update.
   */
  protected _calcZFarInner(camera: CameraComponent) {
    if (this.autoCalculateZNearAndZFar) {
      camera.zFarInner = camera.zNearInner * this.zFarScalingFactor;
    } else {
      camera.zNearInner = camera.zFar;
    }
  }

  abstract setTarget(targetEntity: ISceneGraphEntity): void;
  abstract setTargets(targetEntities: ISceneGraphEntity[]): void;
  abstract getTargets(): ISceneGraphEntity[];
}
