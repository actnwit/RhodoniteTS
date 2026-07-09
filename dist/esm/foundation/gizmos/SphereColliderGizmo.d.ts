import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import type { SphereCollider } from '../physics/VRMSpring/SphereCollider';
import type { Engine } from '../system/Engine';
import { Gizmo } from './Gizmo';
/**
 * SphereColliderGizmo renders a sphere collider visualization for debugging purposes.
 * The visualization is a semi-transparent green sphere that shows the collider's bounds.
 * Uses instanced rendering for efficient drawing of multiple sphere colliders.
 */
export declare class SphereColliderGizmo extends Gizmo {
    protected __topEntity?: ISceneGraphEntity;
    private __sphereCollider;
    private __sphereEntity?;
    /** Shared mesh per Engine for instanced rendering */
    private static __sharedMeshMap;
    /**
     * Creates a new SphereColliderGizmo instance
     * @param engine - The engine instance
     * @param sphereCollider - The sphere collider to visualize
     */
    constructor(engine: Engine, sphereCollider: SphereCollider);
    get isSetup(): boolean;
    _setup(): void;
    _update(): void;
    _destroy(): void;
    /**
     * Gets existing shared mesh for the engine or creates a new one.
     * This enables instanced rendering by sharing the same mesh across all SphereColliderGizmo instances.
     */
    private static __getOrCreateSharedMesh;
    /**
     * Gets the sphere collider being visualized.
     * @returns The sphere collider instance
     */
    get sphereCollider(): SphereCollider;
}
