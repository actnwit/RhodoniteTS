import { Mesh } from '../foundation/geometry/Mesh';
import { Primitive } from '../foundation/geometry/Primitive';
import type { Engine } from '../foundation/system/Engine';
import { type GpuDeformCapacities, type GpuDeformEntry, GpuDeformRegistry } from './GpuDeformRegistry';
import type { WebGpuGpuTimer } from './WebGpuGpuTimer';
/** The byte size of a deformed vertex (2 vec4). */
export declare const DeformedVertexByteSize = 32;
/** The byte size of the bounding box of an instance (2 x vec4<u32>). */
export declare const DeformBoundsByteSize = 32;
/** The buffers of the morph targets (owned by WebGpuResourceRepository), undefined when not created yet. */
export interface GpuDeformMorphBuffers {
    blendShapeData?: GPUBuffer;
    morphOffsets?: GPUBuffer;
    morphWeights?: GPUBuffer;
}
/**
 * The vertex deformation (blend shapes, then skinning) of the meshes culled on the GPU (WebGpuGpuCulling).
 *
 * The vertices of every instance of a deformed mesh are deformed once per frame by a compute pass into the deformed
 * vertex buffer, which the vertex shaders read (bound at group 0, binding 4; see processGeometry) instead of deforming
 * the vertices in every render pass. The pass also computes the bounding box of each deformed instance, which the
 * culling tests instead of the static local bounding box of the mesh.
 *
 * Each cull group of a deformed mesh acquires the deformation entry of the mesh's instance variation data (shared by
 * the views and render bundles that draw the mesh) and releases it with the group.
 */
export declare class WebGpuVertexDeformer {
    private __device;
    private __registry;
    private __stage;
    private __paramsBuffer;
    private __paramsArray;
    private __dummyBuffer;
    private __sourcesBuffer;
    private __chunksBuffer;
    private __deformedBuffer;
    private __boundsBuffer;
    private __sourcesU32;
    private __sourcesF32;
    private __chunksU32;
    private __sourcesDirty;
    private __chunksDirty;
    private __entryInfos;
    private __version;
    private __lastDispatchedVersion;
    private __resetRequested;
    /** `Mesh._primitivePositionUpdateVersion` when the sources were last revalidated. */
    private __lastPositionUpdateVersion;
    constructor(device: GPUDevice);
    /** The bookkeeping of the allocations (exposed for tests and statistics). */
    get registry(): GpuDeformRegistry;
    /** The deformed vertices, read by the vertex shaders (group 0, binding 4). */
    get deformedVerticesBuffer(): GPUBuffer;
    /** The bounding boxes of the deformed instances, read by the culling. */
    get boundsBuffer(): GPUBuffer;
    /** Whether any entry is alive. */
    get hasEntries(): boolean;
    /** Whether the tables changed since the last dispatch (the deformation must run again). */
    get isChanged(): boolean;
    /** Whether an allocation failed since the last reset (the tables must grow). */
    get isOverflowed(): boolean;
    /**
     * Whether the entries can no longer be updated in place (the vertex counts of a mesh changed): every entry must be
     * dropped with `reset`.
     */
    get isResetRequested(): boolean;
    /** The current capacities of the tables. */
    get capacities(): Readonly<GpuDeformCapacities>;
    /**
     * Gets the deformation of the instances of a mesh, allocating and writing its tables on first use.
     *
     * @param engine - The engine
     * @param mesh - The mesh (`Mesh._needsComputeDeformation`)
     * @param entityInfo - The instance variation data of the mesh (`Mesh._variationEntityInfo`), which identifies the
     *   deformation: a new array (instances added or removed) is a new deformation
     * @returns The entry, or undefined when the tables are full (draw the mesh without the GPU culling)
     */
    acquire(engine: Engine, mesh: Mesh, entityInfo: Uint32Array): GpuDeformEntry | undefined;
    /**
     * Removes the reference of a cull group to an entry (after the commands that used it were submitted).
     */
    release(entry: GpuDeformEntry): void;
    /**
     * The index of the first deformed vertex of a primitive among the deformed vertices of an instance
     * (`UniformDrawParameters.deformedVertexOffset`), or undefined when the primitive is not one of the entry's mesh.
     */
    getPrimitiveOffset(entry: GpuDeformEntry, primitive: Primitive): number | undefined;
    /** The index of the first deformed vertex of an instance (the w of its instance ids minus 1). */
    getInstanceDeformedBase(entry: GpuDeformEntry, instanceIndex: number): number;
    /** The bounding box slot of an instance. */
    getInstanceBoundsSlot(entry: GpuDeformEntry, instanceIndex: number): number;
    /**
     * Rewrites the tables that depend on data changed since they were written: the sources of the meshes whose vertex
     * positions were updated, and the chunks when the layout of the morph targets changed. Call once per frame before
     * `encode`.
     */
    refresh(): void;
    /**
     * Records the deformation compute pass (after clearing the bounding boxes) when there is anything to deform.
     *
     * @param encoder - The command encoder, submitted before the commands that draw the deformed vertices
     * @param storageBuffer - The storage buffer of the GPU instance data (the bone data)
     * @param morphBuffers - The buffers of the morph targets
     * @param gpuTimer - When set (and a frame is being measured), measures the pass as 'GpuSkinning'
     * @returns True when the pass was recorded
     */
    encode(encoder: GPUCommandEncoder, storageBuffer: GPUBuffer, morphBuffers: GpuDeformMorphBuffers, gpuTimer?: WebGpuGpuTimer): boolean;
    /**
     * The capacities the tables must grow to after an allocation failed, or undefined when they did not overflow or
     * cannot grow (the device limits are reached; the failed draws stay unculled).
     */
    getGrownCapacities(): GpuDeformCapacities | undefined;
    /**
     * Drops every entry and recreates the tables. The cull groups that referenced the entries must be dropped as well,
     * and the render bundles that bound the deformed vertex buffer.
     */
    reset(capacities: GpuDeformCapacities): void;
    /** Releases the GPU resources. */
    destroy(): void;
    private __createTables;
    private __destroyTables;
    private __uploadDirty;
    /**
     * Writes the undeformed vertices of the primitives of an entry's mesh.
     */
    private __writeSources;
    /**
     * Writes the chunks of an entry: the source and destination ranges, the skeleton and the morph targets applied to
     * each primitive of each instance.
     */
    private __writeChunks;
    /**
     * Rewrites the sources of the meshes whose vertex positions were updated. When the vertex counts changed, the entry
     * layout is no longer valid and a reset is requested.
     */
    private __refreshChangedSources;
    /**
     * Rewrites the chunks of the entries when the morph target or blend shape weight layouts changed (primitives with
     * morph targets or blend shape components were created or destroyed).
     */
    private __refreshMorphLayouts;
}
