import type { ComponentTypeEnum } from '../foundation/definitions/ComponentType';
import type { CompositionTypeEnum } from '../foundation/definitions/CompositionType';
import type { PrimitiveModeEnum } from '../foundation/definitions/PrimitiveMode';
import { VertexAttribute, type VertexAttributeSemanticsJoinedString } from '../foundation/definitions/VertexAttribute';
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
export class MultiDrawGroup {
  static __uidCount = 0;
  uid: number;
  key: string;
  sourceBuffer: Buffer;
  indexed: boolean;
  primitiveMode: PrimitiveModeEnum;
  attributes: MultiDrawAttribute[];
  entries: MultiDrawEntry[] = [];
  totalVertexCount = 0;
  totalIndexCount = 0;
  vertexHandles?: VertexHandles;
  /** WebGL handle of the per-vertex instanceBase buffer (bound separately from vboHandles). */
  instanceBaseVboHandle?: number;
  /** WebGL handle of the per-vertex materialSID buffer. */
  materialSidVboHandle?: number;
  /** CPU mirror of the per-vertex materialSID buffer (for change detection). */
  materialSids?: Uint32Array;
  /** VAO variant with the materialSID attribute disabled (for material-override passes). */
  genericMaterialSidVaoHandle?: number;
  version = 0;
  // WebGL scratch arrays reused by the strategy.
  counts?: Int32Array;
  offsets?: Int32Array;
  instanceCounts?: Int32Array;
  firsts?: Int32Array;
  vertexCounts?: Int32Array;

  constructor({
    key,
    sourceBuffer,
    indexed,
    primitiveMode,
    attributes,
  }: {
    key: string;
    sourceBuffer: Buffer;
    indexed: boolean;
    primitiveMode: PrimitiveModeEnum;
    attributes: MultiDrawAttribute[];
  }) {
    this.uid = ++MultiDrawGroup.__uidCount;
    this.key = key;
    this.sourceBuffer = sourceBuffer;
    this.indexed = indexed;
    this.primitiveMode = primitiveMode;
    this.attributes = attributes;
  }
}

/** Returned from buildMultiDrawGroups: the merged CPU data to upload. */
export type MergedMultiDrawGroup = {
  group: MultiDrawGroup;
  attributeBytes: Uint8Array[];
  mergedIndices?: Uint32Array;
  instanceBases: Uint32Array;
  materialSids: Uint32Array;
};

const __bufferIds = new WeakMap<Buffer, number>();
let __bufferIdCount = 0;

/** Stable numeric id for a CPU Buffer (used in group keys). */
export function getBufferId(buffer: Buffer): number {
  let id = __bufferIds.get(buffer);
  if (id == null) {
    id = ++__bufferIdCount;
    __bufferIds.set(buffer, id);
  }
  return id;
}

const __getAttributeBuffer = (primitive: Primitive, i: number): Buffer => {
  return primitive.attributeAccessors[i].bufferView.buffer;
};

/**
 * Returns the group key of a primitive when it can participate in multi-draw,
 * or null when it must keep the legacy per-primitive path.
 */
export function makeMultiDrawGroupKey(primitive: Primitive): string | null {
  if (primitive.targets.length > 0 || primitive.mesh == null) {
    return null;
  }
  const accessors = primitive.attributeAccessors;
  if (accessors.length === 0) {
    return null;
  }
  // Group by the position accessor's source Buffer. Other attributes (e.g. auto-generated
  // normals) may live in different Buffers; their data is copied into the merged VBOs.
  const sourceBuffer = __getAttributeBuffer(primitive, 0);
  const indicesAccessor = primitive.indicesAccessor;

  const vertexCount = primitive.getVertexCountAsVerticesBased();
  if (vertexCount === 0) {
    return null;
  }
  for (const accessor of accessors) {
    if (accessor.elementCount !== vertexCount) {
      return null;
    }
  }

  const semantics = primitive.attributeSemantics;
  let signature = '';
  for (let i = 0; i < accessors.length; i++) {
    const accessor = accessors[i];
    signature += `${semantics[i]}#${accessor.componentType.index}#${accessor.compositionType.index}#${
      accessor.normalized ? 1 : 0
    }#${accessor.actualByteStride},`;
  }

  const indexed = indicesAccessor != null;
  return `${getBufferId(sourceBuffer)}#${indexed ? 1 : 0}#${primitive.primitiveMode.index}#${accessors.length}#${signature}`;
}

/** Extracts the attribute layout of the first primitive of a group. */
export function getMultiDrawAttributes(primitive: Primitive): MultiDrawAttribute[] {
  const attributes: MultiDrawAttribute[] = [];
  const accessors = primitive.attributeAccessors;
  const semantics = primitive.attributeSemantics;
  for (let i = 0; i < accessors.length; i++) {
    const accessor = accessors[i];
    const semanticAttribute = VertexAttribute.fromString(semantics[i].split('.')[0]);
    attributes.push({
      semantic: semantics[i],
      slot: i,
      componentType: accessor.componentType,
      compositionType: accessor.compositionType,
      normalized: accessor.normalized,
      byteStride: accessor.actualByteStride,
      isIntegerType: semanticAttribute.isIntegerType,
    });
  }
  return attributes;
}

/**
 * Builds the merged CPU-side vertex/index data for groups of compatible primitives.
 * Groups with fewer than two primitives are returned as-is without merging.
 */
export function buildMultiDrawGroups(primitives: Primitive[]): MergedMultiDrawGroup[] {
  const grouped = new Map<string, Primitive[]>();
  for (const primitive of primitives) {
    const key = makeMultiDrawGroupKey(primitive);
    if (key == null) {
      continue;
    }
    let list = grouped.get(key);
    if (list == null) {
      list = [];
      grouped.set(key, list);
    }
    list.push(primitive);
  }

  const result: MergedMultiDrawGroup[] = [];
  for (const [key, list] of grouped) {
    if (list.length < 2) {
      continue;
    }
    const first = list[0];
    const indexed = first.indicesAccessor != null;
    const attributes = getMultiDrawAttributes(first);
    const sourceBuffer = __getAttributeBuffer(first, 0);
    const group = new MultiDrawGroup({
      key,
      sourceBuffer,
      indexed,
      primitiveMode: first.primitiveMode,
      attributes,
    });

    // Compute total sizes.
    let totalVertexCount = 0;
    let totalIndexCount = 0;
    for (const primitive of list) {
      totalVertexCount += primitive.getVertexCountAsVerticesBased();
      if (indexed) {
        totalIndexCount += primitive.indicesAccessor!.elementCount;
      }
    }
    if (totalVertexCount > 0xffff_ffff) {
      continue;
    }

    const attributeBytes = attributes.map(attribute => {
      return new Uint8Array(totalVertexCount * attribute.byteStride);
    });
    const mergedIndices = indexed ? new Uint32Array(totalIndexCount) : undefined;
    const instanceBases = new Uint32Array(totalVertexCount);
    const materialSids = new Uint32Array(totalVertexCount);

    let vertexOffset = 0;
    let indexOffset = 0;
    for (const primitive of list) {
      const mesh = primitive.mesh as Mesh;
      const instanceBase = mesh._ensureInstanceSidBase();
      const vertexCount = primitive.getVertexCountAsVerticesBased();
      const accessors = primitive.attributeAccessors;
      for (let i = 0; i < accessors.length; i++) {
        const attribute = attributes[i];
        const src = accessors[i].getUint8Array();
        const dstOffset = vertexOffset * attribute.byteStride;
        const copyLength = Math.min(src.length, vertexCount * attribute.byteStride);
        attributeBytes[i].set(src.subarray(0, copyLength), dstOffset);
      }
      instanceBases.fill(instanceBase, vertexOffset, vertexOffset + vertexCount);
      const materialSid = primitive.material.materialSID;
      materialSids.fill(materialSid, vertexOffset, vertexOffset + vertexCount);

      const indicesAccessor = primitive.indicesAccessor;
      const indexCount = indexed ? indicesAccessor!.elementCount : 0;
      if (indexed && mergedIndices != null) {
        for (let k = 0; k < indexCount; k++) {
          mergedIndices[indexOffset + k] = indicesAccessor!.getScalar(k, {}) + vertexOffset;
        }
      }

      const entry: MultiDrawEntry = {
        primitive,
        primitiveUid: primitive.primitiveUid,
        mesh,
        vertexOffset,
        vertexCount,
        indexCount,
        indexByteOffset: indexOffset * 4,
        materialSid,
      };
      group.entries.push(entry);

      vertexOffset += vertexCount;
      indexOffset += indexCount;
    }

    group.totalVertexCount = totalVertexCount;
    group.totalIndexCount = totalIndexCount;
    group.counts = new Int32Array(group.entries.length);
    group.offsets = new Int32Array(group.entries.length);
    group.instanceCounts = new Int32Array(group.entries.length);
    group.firsts = new Int32Array(group.entries.length);
    group.vertexCounts = new Int32Array(group.entries.length);
    group.materialSids = materialSids;

    result.push({ group, attributeBytes, mergedIndices, instanceBases, materialSids });
  }

  return result;
}

/**
 * Numeric version of the mesh renderer fingerprint. Fingerprints are interned to ids by
 * `MeshRendererComponent`, so comparing ids is equivalent to comparing the strings and
 * avoids building/compare work in the per-frame planning loops.
 */
export function getPrimitiveMeshRendererFingerPrintId(primitive: Primitive): number {
  const mesh = primitive.mesh as Mesh | undefined;
  const entity = mesh?.meshEntitiesInner[0];
  return entity?.getMeshRenderer()?.getFingerPrintId() ?? 0;
}

/**
 * Key used to decide whether two consecutive primitives can be drawn with one
 * multi-draw call. Material parameters are read through the per-vertex materialSID,
 * so different materials can share a run as long as their render state (program,
 * pipeline state, texture bindings, IBL cube maps) is identical.
 *
 * `null` means the primitive must use the legacy draw path.
 */
export function makeMultiDrawRenderStateKey(
  primitive: Primitive,
  material: Material,
  meshRendererFingerPrintId: number
): string | null {
  const group = primitive._multiDrawGroup;
  if (group == null) {
    return null;
  }
  const isPerVertexMaterial = material === primitive.material;
  const materialPart = isPerVertexMaterial
    ? material._getMultiDrawStateKey()
    : // A material override uses the group VAO with a generic materialSID, so the whole
      // run must use the same override material.
      `${material.materialUID}|${material._getMultiDrawStateKey()}`;
  return `${group.uid}|${isPerVertexMaterial ? 1 : 0}|${materialPart}|${meshRendererFingerPrintId}|${
    primitive.primitiveMode.index
  }|${primitive.getRenderIndexBitSize()}|${primitive.hasIndices() ? 1 : 0}`;
}

type MultiDrawKeyCacheEntry = {
  groupUid: number;
  materialUid: number;
  materialStateVersion: number;
  meshRendererFingerPrintId: number;
  mode: number;
  indexBitSize: 'uint16' | 'uint32';
  indexed: boolean;
  isPerVertexMaterial: boolean;
  keyId: number;
  generation: number;
};

const __multiDrawKeyCache = new WeakMap<Primitive, MultiDrawKeyCacheEntry>();
const __multiDrawKeyIds = new Map<string, number>();
let __multiDrawKeyIdCount = 0;
/** Incremented when the id map is cleared; invalidates all per-primitive cache entries. */
let __multiDrawKeyIdGeneration = 0;
/** Upper bound for the shared id map (animated material states could grow it forever). */
const MAX_MULTI_DRAW_KEY_IDS = 65536;

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
export function getMultiDrawStateKeyId(
  primitive: Primitive,
  material: Material,
  meshRendererFingerPrintId: number
): number | null {
  const group = primitive._multiDrawGroup;
  if (group == null) {
    return null;
  }
  const isPerVertexMaterial = material === primitive.material;
  const mode = primitive.primitiveMode.index;
  const indexBitSize = primitive.getRenderIndexBitSize();
  const indexed = primitive.hasIndices();

  const cached = __multiDrawKeyCache.get(primitive);
  if (
    cached != null &&
    cached.generation === __multiDrawKeyIdGeneration &&
    cached.groupUid === group.uid &&
    cached.materialUid === material.materialUID &&
    cached.materialStateVersion === material.stateVersion &&
    cached.meshRendererFingerPrintId === meshRendererFingerPrintId &&
    cached.mode === mode &&
    cached.indexBitSize === indexBitSize &&
    cached.indexed === indexed &&
    cached.isPerVertexMaterial === isPerVertexMaterial
  ) {
    return cached.keyId;
  }

  const key = makeMultiDrawRenderStateKey(primitive, material, meshRendererFingerPrintId);
  if (key == null) {
    __multiDrawKeyCache.delete(primitive);
    return null;
  }
  let keyId = __multiDrawKeyIds.get(key);
  if (keyId == null) {
    if (__multiDrawKeyIds.size >= MAX_MULTI_DRAW_KEY_IDS) {
      __multiDrawKeyIds.clear();
      __multiDrawKeyIdGeneration++;
    }
    keyId = ++__multiDrawKeyIdCount;
    __multiDrawKeyIds.set(key, keyId);
  }
  __multiDrawKeyCache.set(primitive, {
    groupUid: group.uid,
    materialUid: material.materialUID,
    materialStateVersion: material.stateVersion,
    meshRendererFingerPrintId,
    mode,
    indexBitSize,
    indexed,
    isPerVertexMaterial,
    keyId,
    generation: __multiDrawKeyIdGeneration,
  });
  return keyId;
}

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
export function planMultiDrawRuns<T = string>(
  start: number,
  end: number,
  step: 1 | -1,
  getKey: (index: number) => T | null
): MultiDrawRun<T>[] {
  const runs: MultiDrawRun<T>[] = [];
  if ((step > 0 && start > end) || (step < 0 && start < end)) {
    return runs;
  }
  let index = start;
  while (true) {
    const key = getKey(index);
    let count = 1;
    let next = index + step;
    while (step > 0 ? next <= end : next >= end) {
      const nextKey = getKey(next);
      if (nextKey !== key) {
        break;
      }
      count++;
      next += step;
    }
    runs.push({ startIndex: index, count, step, key });
    if ((step > 0 && next > end) || (step < 0 && next < end)) {
      break;
    }
    index = next;
  }
  return runs;
}

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
export function planMultiDrawRunsInto(
  start: number,
  end: number,
  step: 1 | -1,
  getKey: (index: number) => number | null,
  out: MultiDrawRunPlan
): MultiDrawRunPlan {
  out.count = 0;
  if ((step > 0 && start > end) || (step < 0 && start < end)) {
    return out;
  }
  const maxRuns = Math.abs(end - start) + 1;
  if (out.starts.length < maxRuns) {
    let capacity = Math.max(out.starts.length * 2, 64);
    while (capacity < maxRuns) {
      capacity *= 2;
    }
    out.starts = new Int32Array(capacity);
    out.counts = new Int32Array(capacity);
    out.keys = new Int32Array(capacity);
  }

  let runStart = start;
  let currentKey = getKey(start) ?? -1;
  let runCount = 1;
  for (let i = start + step; step > 0 ? i <= end : i >= end; i += step) {
    const key = getKey(i) ?? -1;
    if (key === currentKey) {
      runCount++;
      continue;
    }
    out.starts[out.count] = runStart;
    out.counts[out.count] = runCount;
    out.keys[out.count] = currentKey;
    out.count++;
    runStart = i;
    currentKey = key;
    runCount = 1;
  }
  out.starts[out.count] = runStart;
  out.counts[out.count] = runCount;
  out.keys[out.count] = currentKey;
  out.count++;
  return out;
}
