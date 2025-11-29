import type { SceneGraphComponent } from '../../components/SceneGraph/SceneGraphComponent';
import type { IdentityMatrix44 } from '../../math/IdentityMatrix44';
import { Matrix44 } from '../../math/Matrix44';
import { MutableMatrix44 } from '../../math/MutableMatrix44';
import { MutableVector3 } from '../../math/MutableVector3';
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
  private __baseSceneGraph: SceneGraphComponent;

  private __worldMatrix: MutableMatrix44 = MutableMatrix44.dummy();
  private __worldHead = MutableVector3.zero();
  private __worldTailOffset = MutableVector3.zero();
  private __lengthSqCapsule = 0;

  private static __tmp_vec3_0 = MutableVector3.zero();
  private static __tmp_vec3_1 = MutableVector3.zero();

  constructor(position: Vector3, radius: number, tail: Vector3, baseSceneGraph: SceneGraphComponent) {
    this.__position = position;
    this.__radius = radius;
    this.__tail = tail;
    this.__baseSceneGraph = baseSceneGraph;
  }

  /**
   * Updates cached world positions for the capsule.
   * Should be called once per frame before collision checks.
   */
  updateWorldState() {
    this.__worldMatrix = this.__baseSceneGraph.matrixInner;
    this.__worldMatrix.multiplyVector3To(this.__position, this.__worldHead);
    this.__worldMatrix.multiplyVector3To(this.__tail, this.__worldTailOffset);
    Vector3.subtractTo(this.__worldTailOffset, this.__worldHead, this.__worldTailOffset);
    this.__lengthSqCapsule = this.__worldTailOffset.lengthSquared();
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
    const spherePosWorld = this.__worldHead;
    const tailPosWorld = this.__worldTailOffset;
    let direction = Vector3.subtractTo(bonePosition, spherePosWorld, CapsuleCollider.__tmp_vec3_0);
    const dot = tailPosWorld.dot(direction);

    if (dot <= 0.0) {
      // if bone is near from the head
      // do nothing
    } else if (this.__lengthSqCapsule <= dot) {
      // if bone is near from the tail
      direction = Vector3.subtractTo(direction, tailPosWorld, CapsuleCollider.__tmp_vec3_0);
    } else {
      // if bone is between two ends
      Vector3.multiplyTo(tailPosWorld, dot / this.__lengthSqCapsule, CapsuleCollider.__tmp_vec3_1);
      direction = Vector3.subtractTo(direction, CapsuleCollider.__tmp_vec3_1, CapsuleCollider.__tmp_vec3_0);
    }

    const radius = this.__radius + boneRadius;
    const distance = direction.length() - radius;
    direction = Vector3.normalizeTo(direction, direction);

    return { direction, distance };
  }

  get baseSceneGraph(): SceneGraphComponent {
    return this.__baseSceneGraph;
  }
}
