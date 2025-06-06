import type { SceneGraphComponent } from '../../components/SceneGraph/SceneGraphComponent';
import { MutableVector3 } from '../../math/MutableVector3';
import { Vector3 } from '../../math/Vector3';

/**
 * A sphere collider used for VRM spring bone physics simulation.
 * This collider represents a spherical collision volume that can interact with bones
 * to prevent them from penetrating through solid objects.
 */
export class SphereCollider {
  /** The local position of the sphere collider relative to its base scene graph node */
  public position = Vector3.zero();

  /** The radius of the sphere collider */
  public radius = 0;

  /** The base scene graph component that defines the transform space for this collider */
  baseSceneGraph?: SceneGraphComponent;

  private static __tmp_vec3_0 = MutableVector3.zero();
  private static __tmp_vec3_1 = MutableVector3.zero();
  private static __tmp_vec3_2 = MutableVector3.zero();

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
    const spherePosWorld = this.baseSceneGraph!.getWorldPositionOfTo(this.position, SphereCollider.__tmp_vec3_0);
    const delta = Vector3.subtractTo(bonePosition, spherePosWorld, SphereCollider.__tmp_vec3_1);
    const direction = Vector3.normalizeTo(delta, SphereCollider.__tmp_vec3_2);
    const radius = this.radius + boneRadius;
    const distance = delta.length() - radius;

    return { direction, distance };
  }
}
