import type { Mesh } from '../foundation/geometry/Mesh';
import type { Engine } from '../foundation/system/Engine';
import { type MultiDrawGroup } from './MultiDraw';
/**
 * Owns the engine-wide multi-draw groups.
 *
 * The groups are rebuilt lazily at the start of a frame. Building them on demand
 * (once per changed Buffer) would rebuild the whole Buffer for every Mesh added
 * during loading, so dirty changes are coalesced into one rebuild per frame.
 */
export declare class MultiDrawRepository {
    private __engine;
    private __groups;
    private __dirty;
    private __version;
    /** Meshes whose vertex data must be refreshed during the next rebuild. */
    private __dirtyMeshes;
    /** Set when the whole structure changed and every primitive must be refreshed. */
    private __forceFullRebuild;
    constructor(engine: Engine);
    /** Incremented on every rebuild; render sort caches can use it for invalidation. */
    get version(): number;
    /** Whether the given VAO handle is owned by a current multi-draw group. */
    hasVaoHandle(vaoHandle: number): boolean;
    get groups(): ReadonlyMap<string, MultiDrawGroup>;
    /** Marks all groups for a rebuild at the next frame start. */
    markDirty(): void;
    /** Marks the groups that may contain primitives of the given mesh for a rebuild. */
    markDirtyForMesh(mesh: Mesh): void;
    /**
     * Rebuilds the multi-draw groups if any structural change was recorded.
     * Called at the start of the WebGL render phase, before sort_$render().
     */
    rebuildDirtyGroups(): void;
    /** Releases every group and detaches its primitives. */
    invalidateAll(): void;
    private __deleteAllGroups;
    private __createGroupResources;
}
