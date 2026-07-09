import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { Gizmo } from './Gizmo';
/**
 * JointGizmo renders skeleton joints and their connections for debugging purposes.
 * Each joint pair is visualized using the Joint primitive to highlight skeletal hierarchies.
 * Uses instanced rendering for efficient drawing of multiple joints.
 */
export declare class JointGizmo extends Gizmo {
    protected __topEntity?: ISceneGraphEntity;
    private __jointVisuals;
    /** Shared mesh per Engine for instanced rendering */
    private static __sharedMeshMap;
    private static readonly __unitY;
    private static readonly __origin;
    private static readonly __tmpJointPosition;
    private static readonly __tmpParentPosition;
    private static readonly __tmpDirection;
    private static readonly __tmpScale;
    private static readonly __tmpQuaternion;
    get isSetup(): boolean;
    _setup(): void;
    _update(): void;
    _destroy(): void;
    private __collectJointPairs;
    /**
     * Gets existing shared mesh for the engine or creates a new one.
     * This enables instanced rendering by sharing the same mesh across all JointGizmo instances.
     */
    private static __getOrCreateSharedMesh;
    private __createJointVisual;
}
