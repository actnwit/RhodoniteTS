import type { SphereCollider } from './SphereCollider';
import type { CapsuleCollider } from './CapsuleCollider';

/**
 * A group of colliders used in VRM spring bone physics simulation.
 * This class manages collections of sphere and capsule colliders that can interact
 * with spring bones to provide collision detection and response.
 */
export class VRMColliderGroup {
  /**
   * Array of sphere colliders in this group.
   * Sphere colliders are used for simple spherical collision detection.
   */
  sphereColliders: SphereCollider[] = [];

  /**
   * Array of capsule colliders in this group.
   * Capsule colliders are used for cylindrical collision detection with rounded ends.
   */
  capsuleColliders: CapsuleCollider[] = [];
}
