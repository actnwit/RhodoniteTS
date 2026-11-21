/**
 * A cull group: the instances of one mesh drawn with one view (camera) in one render bundle.
 *
 * The group owns the instance slots `[rangeBase, rangeBase + instanceCount)`. The culling compute shader tests the
 * instances stored in those slots and writes the visible ones, compacted and in their original order, to the same
 * slots of the visible instance buffer. Every draw of the mesh in the bundle (each primitive, and the depth prepass)
 * binds that range as its instance vertex buffer and takes its instance count from the group.
 */
export interface GpuCullingGroup {
    /** The slot of the group in the group table. */
    readonly index: number;
    /** The first instance slot of the group. */
    readonly rangeBase: number;
    /** The number of instance slots of the group. */
    readonly instanceCount: number;
    /** The view (camera frustum) the instances are culled with. */
    readonly viewIndex: number;
    /**
     * The first chunk slot of the group. The instances are culled in chunks of `GpuCullingChunkSize` consecutive
     * instances, one workgroup per chunk, so that a group with many instances is culled in parallel.
     */
    readonly chunkBase: number;
    /** The number of chunk slots of the group (`ceil(instanceCount / GpuCullingChunkSize)`). */
    readonly chunkCount: number;
}
/** The number of instances culled by one workgroup. */
export declare const GpuCullingChunkSize = 64;
/** The allocations released by `releaseRetired`, so that the caller can clear their GPU table entries. */
export interface GpuCullingReleased {
    groups: GpuCullingGroup[];
    draws: number[];
}
/** The capacities of the registry tables. */
export interface GpuCullingCapacities {
    /** The number of instance slots. */
    instances: number;
    /** The number of cull groups. */
    groups: number;
    /** The number of indirect draw slots. */
    draws: number;
    /** The number of chunk slots (see `GpuCullingGroup.chunkBase`). */
    chunks: number;
}
/**
 * The CPU bookkeeping of the WebGPU GPU culling: instance slot ranges, cull groups and indirect draw slots.
 *
 * The allocations are owned by the render bundles that record the indirect draws referencing them:
 * - `beginRecording` / `finishRecording` collect the allocations made while a bundle is being recorded.
 * - A bundle that is dropped (bundle cache clear) or replaced (re-recorded) retires its allocations. A retired bundle
 *   may still have been executed in the current frame, so its allocations are released only by `releaseRetired`,
 *   which the caller invokes after the frame's commands were submitted.
 * - When a table is full, the allocation fails (the caller draws without culling) and the registry records the
 *   capacity it would have needed. The caller then grows its buffers, calls `reset`, and re-records the bundles.
 *
 * It does not touch any GPU resource, so it can be unit tested.
 */
export declare class GpuCullingRegistry {
    private __capacities;
    private __instanceAllocator;
    private __chunkAllocator;
    private __chunkHighWater;
    private __usedChunkSlots;
    private __freeGroups;
    private __groupHighWater;
    private __freeDraws;
    private __drawHighWater;
    private __bundles;
    private __recording?;
    /** The groups of the bundle being recorded, by key object (the mesh) and view. */
    private __recordingGroups;
    private __retired;
    private __overflowed;
    /** The demand of the failed allocations since the last reset. */
    private __failedDemand;
    private __usedInstanceSlots;
    private __version;
    /**
     * @param capacities - The initial capacities of the tables
     */
    constructor(capacities: GpuCullingCapacities);
    /** The capacities of the tables. */
    get capacities(): Readonly<GpuCullingCapacities>;
    /** One past the highest group slot that was ever allocated since the last reset (the dispatch size). */
    get groupHighWater(): number;
    /** One past the highest chunk slot that was ever allocated since the last reset (the dispatch size). */
    get chunkHighWater(): number;
    /** One past the highest draw slot that was ever allocated since the last reset (the dispatch size). */
    get drawHighWater(): number;
    /** The number of the live (not released) groups. */
    get liveGroupCount(): number;
    /** Incremented whenever an allocation is made or released, so that the GPU tables are known to be stale. */
    get version(): number;
    /** Whether an allocation failed because a table was full since the last reset. */
    get isOverflowed(): boolean;
    /** Whether a bundle is being recorded. */
    get isRecording(): boolean;
    /**
     * The capacities needed by the allocations that are not released yet plus the failed allocations.
     * Call it after `releaseRetired` to size the tables for a re-recording of the live bundles.
     */
    get requiredCapacities(): GpuCullingCapacities;
    /**
     * Starts collecting the allocations of a render bundle being recorded.
     * A recording that was not finished is retired first.
     */
    beginRecording(): void;
    /**
     * Gets the group of `key` (the mesh) and `viewIndex` in the bundle being recorded, or allocates it.
     * @param key - The object identifying the instances (the mesh)
     * @param viewIndex - The view the instances are culled with
     * @param instanceCount - The number of instances of the mesh
     * @returns The group, or undefined when no bundle is being recorded or a table is full
     */
    getOrAllocateGroup(key: object, viewIndex: number, instanceCount: number): GpuCullingGroup | undefined;
    /**
     * Allocates an indirect draw slot in the bundle being recorded.
     * @returns The draw slot, or -1 when no bundle is being recorded or the draw table is full
     */
    allocateDraw(): number;
    /**
     * Finishes the recording of a bundle.
     * @param bundleKey - The key the bundle is cached with. The allocations of the bundle previously cached with the
     *   same key are retired. When undefined (the bundle is not cached), the allocations are retired at once: the bundle
     *   is executed in the current frame only.
     */
    finishRecording(bundleKey: string | undefined): void;
    /**
     * Retires the recording in progress (the bundle encoder was dropped without being finished).
     */
    abortRecording(): void;
    /**
     * Retires the allocations of a cached bundle (the bundle was dropped).
     * @param bundleKey - The key of the bundle
     */
    retireBundle(bundleKey: string): void;
    /**
     * Retires the allocations of all the cached bundles (the bundle cache was cleared).
     */
    retireAllBundles(): void;
    /**
     * Releases the retired allocations. Call it after the commands of the frame were submitted: the retired bundles
     * may have been executed in that frame.
     * @returns The released groups and draws (to clear their GPU table entries), or undefined when nothing was released
     */
    releaseRetired(): GpuCullingReleased | undefined;
    /**
     * Drops every allocation and resizes the tables. The caller must drop every bundle recorded with the previous
     * allocations (their slots are reused).
     * @param capacities - The new capacities
     */
    reset(capacities: GpuCullingCapacities): void;
    private __recordOverflow;
}
