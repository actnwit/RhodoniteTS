import type { ComponentTypeEnum } from '../foundation/definitions/ComponentType';
import type { CompositionTypeEnum } from '../foundation/definitions/CompositionType';
import type { PrimitiveModeEnum } from '../foundation/definitions/PrimitiveMode';
import type { VertexAttributeSemanticsJoinedString } from '../foundation/definitions/VertexAttribute';
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
    attributes.push({
      semantic: semantics[i],
      slot: i,
      componentType: accessor.componentType,
      compositionType: accessor.compositionType,
      normalized: accessor.normalized,
      byteStride: accessor.actualByteStride,
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

    result.push({ group, attributeBytes, mergedIndices, instanceBases });
  }

  return result;
}

/**
 * Key used to decide whether two consecutive primitives can be drawn with one
 * multi-draw call. `null` means the primitive must use the legacy draw path.
 */
export function makeMultiDrawRunKey(primitive: Primitive, material: Material, shaderProgramUid: number): string | null {
  const group = primitive._multiDrawGroup;
  if (group == null) {
    return null;
  }
  return `${group.uid}|${material.materialUID}|${material.stateVersion}|${shaderProgramUid}|${
    primitive.primitiveMode.index
  }|${primitive.getRenderIndexBitSize()}|${primitive.hasIndices() ? 1 : 0}`;
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

export type MultiDrawRun = {
  /** First primitive index in iteration order. */
  startIndex: number;
  /** Number of primitives in the run. */
  count: number;
  /** 1 or -1, matching the iteration direction of the bucket. */
  step: 1 | -1;
  /** Shared key, or null when the run must use legacy draws. */
  key: string | null;
};

/**
 * Splits a bucket range into consecutive runs sharing the same run key.
 * `getKey` returns null for primitives that must use the legacy path.
 */
export function planMultiDrawRuns(
  start: number,
  end: number,
  step: 1 | -1,
  getKey: (index: number) => string | null
): MultiDrawRun[] {
  const runs: MultiDrawRun[] = [];
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
