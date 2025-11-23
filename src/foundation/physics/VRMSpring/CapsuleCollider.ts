import type { SceneGraphComponent } from '../../components/SceneGraph/SceneGraphComponent';
import type { IdentityMatrix44 } from '../../math/IdentityMatrix44';
import { MutableMatrix44 } from '../../math/MutableMatrix44';
import { Vector3 } from '../../math/Vector3';

/**
 * A capsule-shaped collider used for VRM spring bone physics simulation.
 * The capsule is defined by a position (head), tail position, and radius.
 * It can detect collisions with spherical objects like bones.
 */
export class CapsuleCollider {
  /** The position of the capsule's head in local space */
  private __position = Vector3.zero();

  /** The radius of the capsule */
  private __radius = 0;

  /** The position of the capsule's tail in local space */
  private __tail = Vector3.zero();

  /** The base scene graph component used for world space transformations */
  private __baseSceneGraph?: SceneGraphComponent;

  private __worldMatrix: MutableMatrix44 | IdentityMatrix44 = MutableMatrix44.dummy();

  constructor(position: Vector3, radius: number, tail: Vector3, baseSceneGraph?: SceneGraphComponent) {
    this.__position = position;
    this.__radius = radius;
    this.__tail = tail;
    this.__baseSceneGraph = baseSceneGraph;
    this.__worldMatrix = baseSceneGraph?.matrixInner ?? MutableMatrix44.identity();
  }

  /**
   * Calculates collision information between this capsule collider and a spherical bone.
   *
   * @param bonePosition - The world position of the bone
   * @param boneRadius - The radius of the bone sphere
   * @returns An object containing the collision direction vector and penetration distance.
   *          If distance is negative, the bone is penetrating the capsule.
   *          The direction points from the capsule surface towards the bone center.
   */
  collision(bonePosition: Vector3, boneRadius: number) {
    const spherePosWorld = this.__worldMatrix.multiplyVector3(this.__position);
    let tailPosWorld = this.__worldMatrix.multiplyVector3(this.__tail);
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

    const radius = this.__radius + boneRadius;
    const distance = direction.length() - radius;
    direction = Vector3.normalize(direction);

    return { direction, distance };
  }
}
