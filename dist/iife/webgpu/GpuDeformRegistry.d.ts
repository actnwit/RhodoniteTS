/** The number of vertices deformed by one workgroup of the deformation compute shader. */
export declare const GpuDeformChunkSize = 64;
/** The capacities of the deformation tables. */
export interface GpuDeformCapacities {
    /** The number of source vertex slots (the undeformed vertices of the meshes, shared by their instances). */
    sourceVertices: number;
    /** The number of deformed vertex slots (the vertices of every instance). */
    deformedVertices: number;
    /** The number of bounding box slots (one per instance). */
    bounds: number;
    /** The number of chunk slots (one per GpuDeformChunkSize vertices of a primitive of an instance). */
    chunks: number;
}
/**
 * The deformation of the instances of a mesh, shared by the cull groups of the mesh (one per view and render bundle).
 *
 * The deformed vertices of instance `i` start at `deformedBase + i * vertexCount`, followed by the vertices of the
 * primitives of the mesh in order (see `primitiveOffsets`).
 */
export interface GpuDeformEntry {
    /** The object identifying the deformation (the instance variation data of the mesh). */
    readonly key: object;
    /** The vertex counts of the primitives of the mesh. */
    readonly primitiveVertexCounts: readonly number[];
    /** The index of the first vertex of each primitive among the vertices of the mesh. */
    readonly primitiveOffsets: readonly number[];
    /** The number of chunks of each primitive (`ceil(vertexCount / GpuDeformChunkSize)`). */
    readonly primitiveChunkCounts: readonly number[];
    /** The number of vertices of the mesh (the sum of the primitive vertex counts). */
    readonly vertexCount: number;
    /** The number of chunks of one instance (the sum of the primitive chunk counts). */
    readonly chunkCountPerInstance: number;
    readonly instanceCount: number;
    readonly sourceBase: number;
    readonly deformedBase: number;
    readonly boundsBase: number;
    readonly chunkBase: number;
    readonly chunkCount: number;
    /** The number of the cull groups that use the deformation. */
    refCount: number;
}
/**
 * The bookkeeping of the vertex deformation tables of the WebGPU GPU culling (WebGpuVertexDeformer), without GPU
 * resources.
 *
 * An entry is acquired by each cull group of a deformed mesh and released with the group, after the commands that
 * used it were submitted (GpuCullingRegistry). The ranges of an entry are allocated when it is first acquired and
 * freed when its last group is released. When a table is full, the allocation fails and records the demand, so that
 * the owner grows the tables (`requiredCapacities`) and starts over with `reset`.
 */
export declare class GpuDeformRegistry {
    private __capacities;
    private __sourceAllocator;
    private __deformedAllocator;
    private __boundsAllocator;
    private __chunkAllocator;
    private __entries;
    private __boundsHighWater;
    private __chunkHighWater;
    private __overflowed;
    private __failedDemand;
    private __version;
    /**
     * @param capacities - The capacities of the tables
     */
    constructor(capacities: GpuDeformCapacities);
    /** The capacities of the tables. */
    get capacities(): Readonly<GpuDeformCapacities>;
    /** The live entries. */
    get entries(): IterableIterator<GpuDeformEntry>;
    /** The number of the live entries. */
    get entryCount(): number;
    /** One past the highest bounds slot allocated since the last reset (the range to clear before deforming). */
    get boundsHighWater(): number;
    /** One past the highest chunk slot allocated since the last reset (the dispatch size). */
    get chunkHighWater(): number;
    /** Incremented whenever an entry is allocated or freed. */
    get version(): number;
    /** Whether an allocation failed because a table was full since the last reset. */
    get isOverflowed(): boolean;
    /** The capacities needed by the live entries plus the allocations that failed since the last reset. */
    get requiredCapacities(): GpuDeformCapacities;
    /**
     * Gets the entry of `key` and adds a reference to it, allocating it on first use.
     *
     * @param key - The object identifying the deformation; a new key (new instance variation data) is a new entry
     * @param primitiveVertexCounts - The vertex counts of the primitives of the mesh
     * @param instanceCount - The number of instances
     * @returns The entry and whether it was just allocated, or undefined when a table is full
     */
    acquire(key: object, primitiveVertexCounts: readonly number[], instanceCount: number): {
        entry: GpuDeformEntry;
        isNew: boolean;
    } | undefined;
    /**
     * Removes a reference to an entry, freeing its ranges when it was the last one.
     *
     * @returns True when the entry was freed (the caller clears its table slots)
     */
    release(entry: GpuDeformEntry): boolean;
    /**
     * Drops every entry and replaces the tables (e.g. with larger capacities).
     */
    reset(capacities: GpuDeformCapacities): void;
}
/**
 * Encodes a float as a u32 whose unsigned order is the order of the floats, so that the bounding boxes can be
 * computed with atomicMax (must match encodeOrderedFloat in WebGpuVertexDeformer and decodeOrderedFloat in the
 * culling shader). The encoding of a non-NaN float is never 0, which marks an empty bound.
 */
export declare function encodeOrderedFloat(bits: number): number;
/** Decodes a float encoded by `encodeOrderedFloat` (returns its bits). */
export declare function decodeOrderedFloat(encoded: number): number;
