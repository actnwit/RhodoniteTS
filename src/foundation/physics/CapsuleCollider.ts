import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { Vector3 } from '../math/Vector3';

export class CapsuleCollider {
  public position = Vector3.zero();
  public radius = 0;
  public tail = Vector3.zero();
  baseSceneGraph?: SceneGraphComponent;

  collision(bonePosition: Vector3, boneRadius: number) {
    const spherePosWorld = this.baseSceneGraph!.getWorldPositionOf(this.position);
    let tailPosWorld = this.baseSceneGraph!.getWorldPositionOf(this.tail);
    tailPosWorld = Vector3.subtract(tailPosWorld, spherePosWorld);
    const lengthSqCapsule = tailPosWorld.lengthSquared();
    let direction = Vector3.subtract(bonePosition, spherePosWorld);
    const dot = tailPosWorld.dot(direction);

    if (dot <= 0.0) {
      // if bone is near from the head
      // do nothing
    } else if (lengthSqCapsule <= dot) {
      // if bone is near from the tail
      direction = Vector3.subtract(direction, tailPosWorld);
    } else {
      // if bone is between two ends
      tailPosWorld = Vector3.multiply(tailPosWorld, dot / lengthSqCapsule);
      direction = Vector3.subtract(direction, tailPosWorld);
    }

    const radius = this.radius + boneRadius;
    const distance = direction.length() - radius;
    direction = Vector3.normalize(direction);

    return { direction, distance };
  }
}
