import { Mesh } from '../foundation/geometry/Mesh';
import type { Primitive } from '../foundation/geometry/Primitive';
import type { Engine } from '../foundation/system/Engine';
import { GpuCullingRegistry } from './GpuCullingRegistry';
import type { WebGpuGpuTimer } from './WebGpuGpuTimer';
import { type GpuDeformMorphBuffers, WebGpuVertexDeformer } from './WebGpuVertexDeformer';
/** The byte size of the indirect arguments of a draw (drawIndexedIndirect uses 5 u32, drawIndirect 4 u32). */
export declare const GpuCullingArgsByteSize = 20;
/** An indirect draw registered for GPU culling. */
export interface GpuCulledDraw {
    /** The range of the visible instance buffer to bind as the instance vertex buffer (slot 0). */
    readonly instanceVertexBuffer: {
        buffer: GPUBuffer;
        offset: number;
        size: number;
    };
    /** The indirect buffer of the draw. */
    readonly indirectBuffer: GPUBuffer;
    /** The byte offset of the draw's arguments in `indirectBuffer`. */
    readonly indirectOffset: number;
    /**
     * For a mesh deformed by the compute shader (WebGpuVertexDeformer): the index of the first deformed vertex of the
     * primitive among the deformed vertices of an instance (`UniformDrawParameters.deformedVertexOffset`).
     */
    readonly deformedVertexOffset?: number;
}
/**
 * GPU-driven frustum culling of the instances for WebGPU, with indirect draws recorded in render bundles.
 *
 * This follows the "object culling" pattern of the render bundle best practices (toji.dev): the bundles record one
 * indirect draw per primitive with fixed bindings, and one compute pass per frame decides how many instances each
 * draw renders. The bundles therefore do not change when the camera moves or the visible set changes.
 *
 * - While a bundle is recorded, `registerDraw` allocates a cull group per mesh and view, writes the per-instance
 *   records (instance data, local AABB and the storage indices of the transform) and an indirect draw slot.
 *   The draw binds the group's range of the visible instance buffer as the instance vertex buffer, which has the
 *   same layout as the mesh's variation VBO, so the vertex shaders do not change.
 * - `encode` (from flush) uploads the changed tables and the view frusta and records the compute pass, when anything
 *   changed since the last one. The command buffer is submitted before the frame's render commands.
 * - `afterSubmit` releases the allocations of the bundles that were dropped, and grows the buffers when an
 *   allocation failed (the failed draws were drawn without culling). Growing replaces the buffers bound in the
 *   bundles, so the caller must clear the bundle cache then.
 */
export declare class WebGpuGpuCulling {
    private __device;
    private __registry;
    private __passes;
    /** The storage buffer of the GPU instance data bound in the cull bind group. */
    private __cullBindGroupStorageBuffer?;
    /** The deformed bounding box buffer bound in the cull bind group. */
    private __cullBindGroupBoundsBuffer?;
    /** The vertex deformation (skinning, blend shapes) of the deformed meshes (Config.isComputeSkinningEnabled). */
    private __deformer;
    private __paramsBuffer;
    private __paramsArray;
    private __recordsBuffer;
    private __groupsBuffer;
    private __visibleIdsBuffer;
    private __visibleCountsBuffer;
    private __drawGroupsBuffer;
    private __argsBuffer;
    private __chunksBuffer;
    private __chunkCountsBuffer;
    private __chunkOffsetsBuffer;
    private __scratchIdsBuffer;
    private __viewsBuffer?;
    private __viewsCapacity;
    private __recordsArrayBuffer;
    private __recordsU32;
    private __recordsF32;
    private __groupsU32;
    private __drawGroupsU32;
    private __argsU32;
    private __chunksU32;
    private __viewsF32;
    private __uploadedViewsF32;
    private __recordsDirty;
    private __groupsDirty;
    private __drawGroupsDirty;
    private __argsDirty;
    private __chunksDirty;
    /**
     * The live group of each group slot, with the vertex buffer range of its visible instances and the source of its
     * records. `positionUpdateCount` is the mesh's `primitivePositionUpdateCount` the local AABB was written for.
     */
    private __groupVertexRanges;
    private __views;
    private __viewIndexOfCamera;
    private __inputsDirty;
    /** `Mesh._primitivePositionUpdateVersion` when the records were last revalidated. */
    private __lastPositionUpdateVersion;
    private __lastEncodedRegistryVersion;
    constructor(device: GPUDevice);
    /** The bookkeeping of the allocations (exposed for tests and statistics). */
    get registry(): GpuCullingRegistry;
    /** The vertex deformation of the deformed meshes (exposed for tests and statistics). */
    get deformer(): WebGpuVertexDeformer;
    /** The deformed vertices, bound at group 0, binding 4 of the draws (see processGeometry). */
    get deformedVerticesBuffer(): GPUBuffer;
    /** Starts a render bundle recording. See GpuCullingRegistry.beginRecording. */
    beginRecording(): void;
    /** Whether a render bundle recording is in progress. */
    get isRecording(): boolean;
    /** Finishes a render bundle recording. See GpuCullingRegistry.finishRecording. */
    finishRecording(bundleKey: string | undefined): void;
    /** Drops the render bundle recording in progress. See GpuCullingRegistry.abortRecording. */
    abortRecording(): void;
    /** Retires the allocations of all the cached render bundles (the bundle cache is cleared). */
    retireAllBundles(): void;
    /**
     * Marks the inputs of the culling (the GPU instance data: transforms, visibility, cameras) as changed, so the
     * next `encode` dispatches the culling.
     */
    markInputsDirty(): void;
    /**
     * Registers an indirect draw of a primitive of `mesh` in the render bundle being recorded.
     *
     * @param engine - The engine
     * @param mesh - The mesh drawn (its instances are culled)
     * @param primitive - The primitive drawn
     * @param cameraSID - The camera the draw renders with; its frustum is used for the culling
     * @param elementCount - The index count (indexed draw) or the vertex count of the primitive
     * @returns The draw, or undefined when the draw cannot be culled on the GPU (draw it without culling)
     */
    registerDraw(engine: Engine, mesh: Mesh, primitive: Primitive, cameraSID: number, elementCount: number): GpuCulledDraw | undefined;
    /**
     * Records the culling compute pass when its inputs changed since the last one.
     * Submit the returned command buffer before the render commands that execute the culled draws.
     *
     * The vertex deformation of the deformed meshes is recorded first in the same command buffer, when its inputs
     * changed (the GPU instance data holds the bone data).
     *
     * @param storageBuffer - The storage buffer of the GPU instance data
     * @param gpuTimer - When set (and a frame is being measured), measures the culling as the 'GpuCulling' pass and
     *   the deformation as the 'GpuSkinning' pass
     * @param morphBuffers - The buffers of the morph targets, read by the deformation
     * @returns The command buffer, or undefined when nothing has to be dispatched
     */
    encode(storageBuffer: GPUBuffer | undefined, gpuTimer?: WebGpuGpuTimer, morphBuffers?: GpuDeformMorphBuffers): GPUCommandBuffer | undefined;
    private __createBindGroup;
    /**
     * Call after the frame's commands were submitted. Releases the allocations of the dropped bundles, and grows the
     * tables when an allocation failed.
     *
     * @returns True when the tables were recreated: every render bundle recorded before must be dropped
     */
    afterSubmit(): boolean;
    /**
     * The capacities the culling tables must grow to after an allocation failed, or undefined when they did not
     * overflow or cannot grow (the device limits are reached).
     */
    private __getGrownCapacities;
    /**
     * Releases the GPU resources.
     */
    destroy(): void;
    private __createTables;
    private __resetBindGroups;
    private __destroyTables;
    private __uploadDirty;
    /**
     * Rewrites the records of the groups whose mesh vertex positions were updated after the records were written
     * (the local AABB changed while the render bundles stayed valid).
     */
    private __refreshChangedBounds;
    /**
     * Writes the group table entry and the per-instance records of a group.
     * The records of a deformed group point to the deformed vertices (instance ids w) and bounding box of each instance.
     */
    private __writeGroup;
    private __getOrCreateView;
    /**
     * Computes the frusta of the views from their cameras and uploads them when they changed.
     * @returns True when a view changed
     */
    private __updateViews;
}
