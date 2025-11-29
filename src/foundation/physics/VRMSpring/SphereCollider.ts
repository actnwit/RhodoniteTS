import type { SceneGraphComponent } from '../../components/SceneGraph/SceneGraphComponent';
import { SphereColliderGizmo } from '../../gizmos/SphereColliderGizmo';
import { MutableVector3 } from '../../math/MutableVector3';
import { Vector3 } from '../../math/Vector3';
import { Is } from '../../misc/Is';

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
  private __baseSceneGraph: SceneGraphComponent;

  private __worldPosition = MutableVector3.zero();

  /** The gizmo used to visualize this collider */
  private __gizmo?: SphereColliderGizmo;

  private static __tmp_vec3_1 = MutableVector3.zero();

  constructor(position: Vector3, radius: number, baseSceneGraph: SceneGraphComponent) {
    this.__position = position;
    this.__radius = radius;
    this.__baseSceneGraph = baseSceneGraph;
  }

  /**
   * Updates the cached world position of the collider.
   * Should be called once per frame before collision checks.
   */
  updateWorldState() {
    const baseMatrix = this.__baseSceneGraph.matrixInner;
    baseMatrix.multiplyVector3To(this.__position, this.__worldPosition);
    if (Is.exist(this.__gizmo) && this.__gizmo.isVisible) {
      this.__gizmo._update();
    }
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
    const delta = Vector3.subtractTo(bonePosition, this.__worldPosition, SphereCollider.__tmp_vec3_1);
    const length = delta.length();
    const radius = this.__radius + boneRadius;
    const distance = length - radius;

    return { distance, delta: delta, length };
  }

  /**
   * Gets the local position of the collider.
   * @returns The local position vector
   */
  get position(): Vector3 {
    return this.__position;
  }

  /**
   * Gets the world position of the collider.
   * @returns The world position vector
   */
  get worldPosition(): Vector3 {
    return this.__worldPosition;
  }

  /**
   * Gets the radius of the collider.
   * @returns The radius value
   */
  get radius(): number {
    return this.__radius;
  }

  /**
   * Gets the base scene graph component.
   * @returns The base scene graph component
   */
  get baseSceneGraph(): SceneGraphComponent {
    return this.__baseSceneGraph;
  }

  /**
   * Gets the gizmo used to visualize this collider.
   * @returns The gizmo instance, or undefined if not set
   */
  get gizmo(): SphereColliderGizmo | undefined {
    return this.__gizmo;
  }

  /**
   * Sets the gizmo used to visualize this collider.
   * @param gizmo - The gizmo instance to set
   */
  set gizmo(gizmo: SphereColliderGizmo | undefined) {
    this.__gizmo = gizmo;
  }

  /**
   * Sets the visibility of the collider's gizmo.
   * If the gizmo exists, it will be shown or hidden accordingly.
   * @param visible - Whether the gizmo should be visible
   */
  setGizmoVisible(visible: boolean): void {
    if (this.__gizmo == null) {
      this.__gizmo = new SphereColliderGizmo(this);
      this.__gizmo._setup();
    }
    this.__gizmo.isVisible = visible;
  }

  /**
   * Gets whether the gizmo is currently visible.
   * @returns True if the gizmo exists and is visible
   */
  get isGizmoVisible(): boolean {
    return this.__gizmo?.isVisible ?? false;
  }

  /**
   * Destroys the gizmo if it exists.
   */
  destroyGizmo(): void {
    if (this.__gizmo != null) {
      this.__gizmo._destroy();
      this.__gizmo = undefined;
    }
  }
}
