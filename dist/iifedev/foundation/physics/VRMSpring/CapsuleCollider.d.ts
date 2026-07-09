import type { SceneGraphComponent } from '../../components/SceneGraph/SceneGraphComponent';
import { CapsuleColliderGizmo } from '../../gizmos/CapsuleColliderGizmo';
import { Vector3 } from '../../math/Vector3';
import type { Engine } from '../../system/Engine';
/**
 * A capsule-shaped collider used for VRM spring bone physics simulation.
 * The capsule is defined by a position (head), tail position, and radius.
 * It can detect collisions with spherical objects like bones.
 */
export declare class CapsuleCollider {
    private __engine;
    /** The position of the capsule's head in local space */
    private __position;
    /** The radius of the capsule */
    private __radius;
    /** The position of the capsule's tail in local space */
    private __tail;
    /** The base scene graph component used for world space transformations */
    private __baseSceneGraph;
    private __worldMatrix;
    private __worldHead;
    private __worldTailOffset;
    private __lengthSqCapsule;
    /** The gizmo used to visualize this collider */
    private __gizmo?;
    private static __tmp_vec3_0;
    private static __tmp_vec3_1;
    constructor(engine: Engine, position: Vector3, radius: number, tail: Vector3, baseSceneGraph: SceneGraphComponent);
    /**
     * Updates cached world positions for the capsule.
     * Should be called once per frame before collision checks.
     */
    updateWorldState(): void;
    /**
     * Calculates collision information between this capsule collider and a spherical bone.
     *
     * @param bonePosition - The world position of the bone
     * @param boneRadius - The radius of the bone sphere
     * @returns An object containing the collision direction vector and penetration distance.
     *          If distance is negative, the bone is penetrating the capsule.
     *          The direction points from the capsule surface towards the bone center.
     */
    collision(bonePosition: Vector3, boneRadius: number): {
        direction: import("../..").IMutableVector3;
        distance: number;
    };
    /**
     * Gets the local position of the capsule's head.
     * @returns The local position vector
     */
    get position(): Vector3;
    /**
     * Gets the local position of the capsule's tail.
     * @returns The local tail position vector
     */
    get tail(): Vector3;
    /**
     * Gets the radius of the capsule.
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
    get gizmo(): CapsuleColliderGizmo | undefined;
    /**
     * Sets the gizmo used to visualize this collider.
     * @param gizmo - The gizmo instance to set
     */
    set gizmo(gizmo: CapsuleColliderGizmo | undefined);
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
