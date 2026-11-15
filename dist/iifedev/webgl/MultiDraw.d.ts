import type { ComponentTypeEnum } from '../foundation/definitions/ComponentType';
import type { CompositionTypeEnum } from '../foundation/definitions/CompositionType';
import type { PrimitiveModeEnum } from '../foundation/definitions/PrimitiveMode';
import { type VertexAttributeSemanticsJoinedString } from '../foundation/definitions/VertexAttribute';
import type { Mesh } from '../foundation/geometry/Mesh';
import type { Primitive } from '../foundation/geometry/Primitive';
import type { Material } from '../foundation/materials/core/Material';
import type { Buffer } from '../foundation/memory/Buffer';
import type { PrimitiveUID } from '../types/CommonTypes';
import type { VertexHandles } from './WebGLResourceRepository';
/** One vertex attribute layout of a multi-draw group. */
export type MultiDrawAttribute = {
    semantic: VertexAttributeSemanticsJoinedString;
    slot: number;
    componentType: ComponentTypeEnum;
    compositionType: CompositionTypeEnum;
    normalized: boolean;
    byteStride: number;
    /** Whether the shader input for this semantic is an integer type (uvec4/uint). */
    isIntegerType: boolean;
};
/** One primitive (draw) inside a multi-draw group. */
export type MultiDrawEntry = {
    primitive: Primitive;
    primitiveUid: PrimitiveUID;
    mesh: Mesh;
    /** First vertex in the merged vertex buffers. */
    vertexOffset: number;
    vertexCount: number;
    /** Number of indices (indexed) or vertices (non-indexed). */
    indexCount: number;
    /** Byte offset of this primitive's indices in the merged index buffer. */
    indexByteOffset: number;
    /** materialSID baked into the per-vertex materialSID buffer. */
    materialSid: number;
};
/**
 * A set of primitives that share the same source CPU Buffer and vertex layout,
 * merged into one set of GPU vertex/index buffers and one VAO.
 */
export declare class MultiDrawGroup {
    static __uidCount: number;
    uid: number;
    key: string;
    sourceBuffer: Buffer;
    indexed: boolean;
    primitiveMode: PrimitiveModeEnum;
    attributes: MultiDrawAttribute[];
    entries: MultiDrawEntry[];
    totalVertexCount: number;
    totalIndexCount: number;
    vertexHandles?: VertexHandles;
    /** WebGL handle of the per-vertex instanceBase buffer (bound separately from vboHandles). */
    instanceBaseVboHandle?: number;
    /** WebGL handle of the per-vertex materialSID buffer. */
    materialSidVboHandle?: number;
    /** CPU mirror of the per-vertex materialSID buffer (for change detection). */
    materialSids?: Uint32Array;
    /** VAO variant with the materialSID attribute disabled (for material-override passes). */
    genericMaterialSidVaoHandle?: number;
    version: number;
    counts?: Int32Array;
    offsets?: Int32Array;
    instanceCounts?: Int32Array;
    firsts?: Int32Array;
    vertexCounts?: Int32Array;
    constructor({ key, sourceBuffer, indexed, primitiveMode, attributes, }: {
        key: string;
        sourceBuffer: Buffer;
        indexed: boolean;
        primitiveMode: PrimitiveModeEnum;
        attributes: MultiDrawAttribute[];
    });
}
/** Returned from buildMultiDrawGroups: the merged CPU data to upload. */
export type MergedMultiDrawGroup = {
    group: MultiDrawGroup;
    attributeBytes: Uint8Array[];
    mergedIndices?: Uint32Array;
    instanceBases: Uint32Array;
    materialSids: Uint32Array;
};
/** Stable numeric id for a CPU Buffer (used in group keys). */
export declare function getBufferId(buffer: Buffer): number;
/**
 * Returns the group key of a primitive when it can participate in multi-draw,
 * or null when it must keep the legacy per-primitive path.
 */
export declare function makeMultiDrawGroupKey(primitive: Primitive): string | null;
/** Extracts the attribute layout of the first primitive of a group. */
export declare function getMultiDrawAttributes(primitive: Primitive): MultiDrawAttribute[];
/**
 * Builds the merged CPU-side vertex/index data for groups of compatible primitives.
 * Groups with fewer than two primitives are returned as-is without merging.
 */
export declare function buildMultiDrawGroups(primitives: Primitive[]): MergedMultiDrawGroup[];
/**
 * Numeric version of the mesh renderer fingerprint. Fingerprints are interned to ids by
 * `MeshRendererComponent`, so comparing ids is equivalent to comparing the strings and
 * avoids building/compare work in the per-frame planning loops.
 */
export declare function getPrimitiveMeshRendererFingerPrintId(primitive: Primitive): number;
/**
 * Key used to decide whether two consecutive primitives can be drawn with one
 * multi-draw call. Material parameters are read through the per-vertex materialSID,
 * so different materials can share a run as long as their render state (program,
 * pipeline state, texture bindings, IBL cube maps) is identical.
 *
 * `null` means the primitive must use the legacy draw path.
 */
export declare function makeMultiDrawRenderStateKey(primitive: Primitive, material: Material, meshRendererFingerPrintId: number): string | null;
/**
 * Returns a numeric id for the full multi-draw render state key.
 *
 * Sorting and run splitting only need equality/grouping, and comparing the long key
 * strings for 10k primitives every frame dominated the frame time while the camera
 * moves (the sort cache is invalidated every frame). The id is shared by every
 * primitive with the same render state, so numeric comparisons preserve the batching
 * groups without rebuilding strings. The material's state key is cached by
 * `Material.stateVersion`, so a cache hit costs a WeakMap lookup plus field compares.
 */
export declare function getMultiDrawStateKeyId(primitive: Primitive, material: Material, meshRendererFingerPrintId: number): number | null;
/** Draw arguments filled by WebGLStrategyDataTexture when a draw is deferred into a batch. */
export type DeferredMultiDraw = {
    primitive: Primitive;
    mesh: Mesh;
    indexed: boolean;
    mode: number;
    indexBitSize: 'uint16' | 'uint32';
    /** Index count (indexed) or vertex count (non-indexed). */
    count: number;
    /** Index byte offset (indexed) or first vertex (non-indexed). */
    offset: number;
    instanceCount: number;
};
export type MultiDrawRun<T = string> = {
    /** First primitive index in iteration order. */
    startIndex: number;
    /** Number of primitives in the run. */
    count: number;
    /** 1 or -1, matching the iteration direction of the bucket. */
    step: 1 | -1;
    /** Shared key, or null when the run must use legacy draws. */
    key: T | null;
};
/**
 * Splits a bucket range into consecutive runs sharing the same run key.
 * `getKey` returns null for primitives that must use the legacy path.
 */
export declare function planMultiDrawRuns<T = string>(start: number, end: number, step: 1 | -1, getKey: (index: number) => T | null): MultiDrawRun<T>[];
/** Reusable numeric run plan used by the per-frame multi-draw batching. */
export type MultiDrawRunPlan = {
    starts: Int32Array;
    counts: Int32Array;
    /** Render state key ids. -1 means the run must use the legacy draw path. */
    keys: Int32Array;
    /** Number of valid entries. */
    count: number;
};
/**
 * Splits a bucket range into consecutive runs sharing the same numeric key.
 *
 * Same semantics as `planMultiDrawRuns`, but each primitive's key is evaluated once and the
 * result is written into reusable typed arrays, so a frame does not allocate one object per
 * run (10k single-primitive runs per bucket in material-heavy scenes).
 */
export declare function planMultiDrawRunsInto(start: number, end: number, step: 1 | -1, getKey: (index: number) => number | null, out: MultiDrawRunPlan): MultiDrawRunPlan;
