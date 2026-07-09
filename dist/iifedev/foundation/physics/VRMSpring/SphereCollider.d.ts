import type { SceneGraphComponent } from '../../components/SceneGraph/SceneGraphComponent';
import { SphereColliderGizmo } from '../../gizmos/SphereColliderGizmo';
import { Vector3 } from '../../math/Vector3';
import type { Engine } from '../../system';
/**
 * A sphere collider used for VRM spring bone physics simulation.
 * This collider represents a spherical collision volume that can interact with bones
 * to prevent them from penetrating through solid objects.
 */
export declare class SphereCollider {
    private __engine;
    /** The local position of the sphere collider relative to its base scene graph node */
    private __position;
    /** The radius of the sphere collider */
    private __radius;
    /** The base scene graph component that defines the transform space for this collider */
    private __baseSceneGraph;
    private __worldPosition;
    /** The gizmo used to visualize this collider */
    private __gizmo?;
    private static __tmp_vec3_1;
    constructor(engine: Engine, position: Vector3, radius: number, baseSceneGraph: SceneGraphComponent);
    /**
     * Updates the cached world position of the collider.
     * Should be called once per frame before collision checks.
     */
    updateWorldState(): void;
    /**
     * Calculates collision information between this sphere collider and a bone.
     *
     * @param bonePosition - The world position of the bone
     * @param boneRadius - The radius of the bone for collision detection
     * @returns An object containing the collision direction and penetration distance
     *   - direction: The normalized vector pointing from the sphere center to the bone
     *   - distance: The penetration distance (negative if penetrating, positive if separated)
     */
    collision(bonePosition: Vector3, boneRadius: number): {
        distance: number;
        delta: import("../..").IMutableVector3;
        length: number;
    };
    /**
     * Gets the local position of the collider.
     * @returns The local position vector
     */
    get position(): Vector3;
    /**
     * Gets the world position of the collider.
     * @returns The world position vector
     */
    get worldPosition(): Vector3;
    /**
     * Gets the radius of the collider.
     * @returns The radius value
     */
    get radius(): number;
    /**
     * Gets the base scene graph component.
     * @returns The base scene graph component
     */
    get baseSceneGraph(): SceneGraphComponent;
    /**
     * Gets the gizmo used to visualize this collider.
     * @returns The gizmo instance, or undefined if not set
     */
    get gizmo(): SphereColliderGizmo | undefined;
    /**
     * Sets the gizmo used to visualize this collider.
     * @param gizmo - The gizmo instance to set
     */
    set gizmo(gizmo: SphereColliderGizmo | undefined);
    /**
     * Sets the visibility of the collider's gizmo.
     * If the gizmo exists, it will be shown or hidden accordingly.
     * @param visible - Whether the gizmo should be visible
     */
    setGizmoVisible(visible: boolean): void;
    /**
     * Gets whether the gizmo is currently visible.
     * @returns True if the gizmo exists and is visible
     */
    get isGizmoVisible(): boolean;
    /**
     * Destroys the gizmo if it exists.
     */
    destroyGizmo(): void;
}
