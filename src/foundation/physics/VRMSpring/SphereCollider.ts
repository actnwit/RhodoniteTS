import type { SceneGraphComponent } from '../../components/SceneGraph/SceneGraphComponent';
import type { IdentityMatrix44 } from '../../math/IdentityMatrix44';
import { Matrix44 } from '../../math/Matrix44';
import { MutableMatrix44 } from '../../math/MutableMatrix44';
import { MutableVector3 } from '../../math/MutableVector3';
import { Vector3 } from '../../math/Vector3';

/**
 * A sphere collider used for VRM spring bone physics simulation.
 * This collider represents a spherical collision volume that can interact with bones
 * to prevent them from penetrating through solid objects.
 */
export class SphereCollider {
  /** The local position of the sphere collider relative to its base scene graph node */
  private __position = Vector3.zero();

  /** The radius of the sphere collider */
  private __radius = 0;

  /** The base scene graph component that defines the transform space for this collider */
  private __baseSceneGraph?: SceneGraphComponent;

  private __worldMatrix: MutableMatrix44 | IdentityMatrix44 = MutableMatrix44.dummy();

  private static __tmp_vec3_0 = MutableVector3.zero();
  private static __tmp_vec3_1 = MutableVector3.zero();
  private static __tmp_vec3_2 = MutableVector3.zero();

  constructor(position: Vector3, radius: number, baseSceneGraph?: SceneGraphComponent) {
    this.__position = position;
    this.__radius = radius;
    this.__baseSceneGraph = baseSceneGraph;
  }

  /**
   * Calculates collision information between this sphere collider and a bone.
   *
   * @param bonePosition - The world position of the bone
   * @param boneRadius - The radius of the bone for collision detection
   * @returns An object containing the collision direction and penetration distance
   *   - direction: The normalized vector pointing from the sphere center to the bone
   *   - distance: The penetration distance (negative if penetrating, positive if separated)
   */
  collision(bonePosition: Vector3, boneRadius: number) {
    this.__worldMatrix = this.__baseSceneGraph?.matrixInner ?? MutableMatrix44.identity();
    const spherePosWorld = this.__worldMatrix.multiplyVector3(this.__position);
    const delta = Vector3.subtractTo(bonePosition, spherePosWorld, SphereCollider.__tmp_vec3_1);
    const length = delta.length();
    const direction = Vector3.divideTo(delta, length, SphereCollider.__tmp_vec3_2);
    const radius = this.__radius + boneRadius;
    const distance = length - radius;

    return { direction, distance };
  }
}
