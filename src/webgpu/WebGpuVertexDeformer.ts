import { BlendShapeComponent } from '../foundation/components/BlendShape/BlendShapeComponent';
import { SkeletalComponent } from '../foundation/components/Skeletal/SkeletalComponent';
import { Component } from '../foundation/core/Component';
import { ComponentType } from '../foundation/definitions/ComponentType';
import { Mesh } from '../foundation/geometry/Mesh';
import { Primitive } from '../foundation/geometry/Primitive';
import type { Accessor } from '../foundation/memory/Accessor';
import type { Engine } from '../foundation/system/Engine';
import { DirtyRange } from './DirtyRange';
import {
  type GpuDeformCapacities,
  GpuDeformChunkSize,
  type GpuDeformEntry,
  GpuDeformRegistry,
} from './GpuDeformRegistry';
import { boneDecodeWgsl } from './shaderity_shaders/common/boneDecode';
import type { WebGpuGpuTimer } from './WebGpuGpuTimer';

/**
 * The deformation compute shader. One workgroup deforms one chunk: up to 64 consecutive vertices of a primitive of an
 * instance. Each vertex is morphed (blend shapes) and then skinned, exactly as `processGeometry` (WGSL) does in the
 * vertex shaders, and written in the local space of the mesh. The workgroup reduces the bounding box of its vertices
 * and merges it into the bounding box of the instance with atomics (the order-preserving float encoding).
 */
const deformWgsl = /* wgsl */ `
${boneDecodeWgsl.code}

struct DeformChunk {
  srcBase: u32,               // the index of the first source vertex of the chunk
  vertexCount: u32,           // the number of vertices of the chunk (0 for an unused chunk slot)
  dstBase: u32,               // the index of the first deformed vertex of the chunk
  boundsSlot: u32,            // the bounding box of the instance
  boneDataLocationIndex: u32, // vec4 index of the boneDataLocation of the skeleton in data, or INVALID
  boneDataInfoIndex: u32,     // vec4 index of the boneDataInfo of the skeleton in data
  morphOffsetBase: u32,       // index of the morph target offsets of the primitive in morphOffsets
  morphTargetCount: u32,      // the number of morph targets applied (0: no morphing)
  morphWeightBase: u32,       // index of the weights of the blend shape component in morphWeights
  pad0: u32,
  pad1: u32,
  pad2: u32,
}

struct Params {
  chunkCount: u32,
  chunksPerRow: u32,
  pad0: u32,
  pad1: u32,
}

@group(0) @binding(0) var<storage, read> data: array<vec4<f32>>;
@group(0) @binding(1) var<uniform> params: Params;
// 4 vec4 per vertex: [position.xyz, morph vertex index (u32)], [normal.xyz, 0], [joints (u32)], [weights]
@group(0) @binding(2) var<storage, read> sources: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read> chunks: array<DeformChunk>;
// The buffers of the morph targets, shared with the vertex shaders (uniformMorphOffsets, uniformMorphWeights)
@group(0) @binding(4) var<storage, read> blendShapeData: array<f32>;
@group(0) @binding(5) var<storage, read> morphOffsets: array<u32>;
@group(0) @binding(6) var<storage, read> morphWeights: array<f32>;
// 2 vec4 per vertex: [the skinned position (with the w of the skinning matrix product)], [normal.xyz, 0]
@group(0) @binding(7) var<storage, read_write> deformed: array<vec4<f32>>;
// 8 u32 per instance: [~min.xyz, 0, max.xyz, 0] encoded by encodeOrderedFloat
@group(0) @binding(8) var<storage, read_write> bounds: array<atomic<u32>>;

const INVALID: u32 = 0xffffffffu;
const LOCATION_RADIX: u32 = ${Component._variableLengthLocationRadix}u;

var<workgroup> localBounds: array<atomic<u32>, 6>;

// A u32 whose unsigned order is the order of the floats (GpuDeformRegistry.encodeOrderedFloat)
fn encodeOrderedFloat(value: f32) -> u32 {
  let bits = bitcast<u32>(value);
  return select(bits | 0x80000000u, ~bits, (bits & 0x80000000u) != 0u);
}

fn boneMatrix(boneDataBase: u32, jointIdx: u32, boneDataType: i32, boneDataInfo: vec4<f32>) -> mat4x4<f32> {
  let chunkCount = boneDataChunkCountOfJoint(boneDataType);
  let base = boneDataBase + jointIdx * chunkCount;
  let c0 = data[base];
  var c1 = vec4<f32>(0.0);
  var c2 = vec4<f32>(0.0);
  if (chunkCount >= 2u) {
    c1 = data[base + 1u];
  }
  if (chunkCount >= 3u) {
    c2 = data[base + 2u];
  }
  return decodeBoneMatrix(boneDataType, c0, c1, c2, boneDataInfo);
}

@compute @workgroup_size(64)
fn deform(@builtin(workgroup_id) workgroupId: vec3<u32>, @builtin(local_invocation_index) lid: u32) {
  // c is uniform in the workgroup, so this return keeps the barrier below in uniform control flow.
  let c = workgroupId.y * params.chunksPerRow + workgroupId.x;
  if (c >= params.chunkCount) {
    return;
  }
  let chunk = chunks[c];
  if (lid < chunk.vertexCount) {
    let src = (chunk.srcBase + lid) * 4u;
    let source0 = sources[src];
    var positionInLocal = source0.xyz;
    var normal = sources[src + 1u].xyz;

    // The morphing of get_position (WebGpuStrategyBasic)
    let vertexId = bitcast<u32>(source0.w);
    for (var i = 0u; i < chunk.morphTargetCount; i = i + 1u) {
      let base = morphOffsets[chunk.morphOffsetBase + i] * 4u + 3u * vertexId;
      let delta = vec3<f32>(blendShapeData[base], blendShapeData[base + 1u], blendShapeData[base + 2u]);
      positionInLocal += delta * morphWeights[chunk.morphWeightBase + i];
    }

    // The skinning of processGeometry
    var position = vec4<f32>(positionInLocal, 1.0);
    if (chunk.boneDataLocationIndex != INVALID) {
      let location = data[chunk.boneDataLocationIndex];
      let boneDataBase = u32(location.x) * LOCATION_RADIX + u32(location.y);
      let boneDataInfo = data[chunk.boneDataInfoIndex];
      let boneDataType = i32(boneDataInfo.w + 0.5);
      let joint = bitcast<vec4<u32>>(sources[src + 2u]);
      let weight = sources[src + 3u];
      var skinMat: mat4x4<f32> = weight.x * boneMatrix(boneDataBase, joint.x, boneDataType, boneDataInfo);
      skinMat += weight.y * boneMatrix(boneDataBase, joint.y, boneDataType, boneDataInfo);
      skinMat += weight.z * boneMatrix(boneDataBase, joint.z, boneDataType, boneDataInfo);
      skinMat += weight.w * boneMatrix(boneDataBase, joint.w, boneDataType, boneDataInfo);
      position = skinMat * position;
      normal = toNormalMatrix(skinMat) * normal;
    }

    let dst = (chunk.dstBase + lid) * 2u;
    deformed[dst] = position;
    deformed[dst + 1u] = vec4<f32>(normal, 0.0);

    // The vertex shaders transform the homogeneous position, so the bounds are those of the projected point.
    let point = select(position.xyz, position.xyz / position.w, position.w != 0.0);
    atomicMax(&localBounds[0], ~encodeOrderedFloat(point.x));
    atomicMax(&localBounds[1], ~encodeOrderedFloat(point.y));
    atomicMax(&localBounds[2], ~encodeOrderedFloat(point.z));
    atomicMax(&localBounds[3], encodeOrderedFloat(point.x));
    atomicMax(&localBounds[4], encodeOrderedFloat(point.y));
    atomicMax(&localBounds[5], encodeOrderedFloat(point.z));
  }
  workgroupBarrier();
  if (lid < 6u && chunk.vertexCount > 0u) {
    let slot = chunk.boundsSlot * 8u + select(lid, lid + 1u, lid >= 3u);
    atomicMax(&bounds[slot], atomicLoad(&localBounds[lid]));
  }
}
`;

const MaxWorkgroupsPerDimension = 65535;
/** The byte size of a source vertex (4 vec4). */
const SourceVertexByteSize = 64;
const SourceVertexWordSize = SourceVertexByteSize / 4;
/** The byte size of a deformed vertex (2 vec4). */
export const DeformedVertexByteSize = 32;
/** The byte size of the bounding box of an instance (2 x vec4<u32>). */
export const DeformBoundsByteSize = 32;
/** The byte size of a DeformChunk. */
const ChunkByteSize = 48;
const ChunkWordSize = ChunkByteSize / 4;
const ParamsByteSize = 16;
const Invalid = 0xffffffff;

const InitialCapacities: GpuDeformCapacities = {
  sourceVertices: 8192,
  deformedVertices: 16384,
  bounds: 256,
  chunks: 1024,
};

/** The source of the records of an entry. */
type EntryInfo = {
  engine: Engine;
  mesh: Mesh;
  entityInfo: Uint32Array;
  primitives: Primitive[];
  /** `mesh.primitivePositionUpdateCount` the sources were written for. */
  positionUpdateCount: number;
  /** The morph layout the chunks were written for (see `__refreshMorphLayouts`). */
  morphPrimitiveCount: number;
  blendShapeOffsets: readonly number[];
};

const EmptyAccessOption = {};

/** The buffers of the morph targets (owned by WebGpuResourceRepository), undefined when not created yet. */
export interface GpuDeformMorphBuffers {
  blendShapeData?: GPUBuffer;
  morphOffsets?: GPUBuffer;
  morphWeights?: GPUBuffer;
}

/**
 * Finds the attribute accessor of a primitive by the attribute name (e.g. 'POSITION', 'JOINTS_0').
 */
function findAttribute(primitive: Primitive, name: string): Accessor | undefined {
  for (const semantic of primitive.attributeSemantics) {
    if (semantic.split('.')[0] === name) {
      return primitive.getAttribute(semantic);
    }
  }
  return undefined;
}

/**
 * Reads the components of the vertex attributes as the vertex fetch of the GPU does
 * (WebGpuResourceRepository.__getVertexFormat): a normalized 8 or 16 bit accessor with 2 or 4 components is
 * converted to [0, 1] / [-1, 1], the other values are read as they are. The missing components are (0, 0, 0, 1).
 */
class AttributeReader {
  private __accessor?: Accessor;
  private __componentCount = 0;
  private __byteSize = 4;
  private __scale = 1;
  private __isSigned = false;
  private __isNormalized = false;

  constructor(accessor: Accessor | undefined) {
    this.__accessor = accessor;
    if (accessor === undefined) {
      return;
    }
    this.__componentCount = Math.min(accessor.numberOfComponents, 4);
    this.__byteSize = accessor.componentSizeInBytes;
    const componentType = accessor.componentType;
    const hasNormalizedFormat = accessor.numberOfComponents === 2 || accessor.numberOfComponents === 4;
    if (accessor.normalized && hasNormalizedFormat) {
      if (componentType === ComponentType.UnsignedByte) {
        this.__isNormalized = true;
        this.__scale = 255;
      } else if (componentType === ComponentType.Byte) {
        this.__isNormalized = true;
        this.__scale = 127;
        this.__isSigned = true;
      } else if (componentType === ComponentType.UnsignedShort) {
        this.__isNormalized = true;
        this.__scale = 65535;
      } else if (componentType === ComponentType.Short) {
        this.__isNormalized = true;
        this.__scale = 32767;
        this.__isSigned = true;
      }
    }
  }

  get exists() {
    return this.__accessor !== undefined;
  }

  /** Reads the component `c` of the element `i`. */
  read(i: number, c: number): number {
    const accessor = this.__accessor;
    if (accessor === undefined || c >= this.__componentCount) {
      return c === 3 ? 1 : 0;
    }
    const value = accessor.getScalarAt(i, c * this.__byteSize, EmptyAccessOption);
    if (!this.__isNormalized) {
      return value;
    }
    const normalized = value / this.__scale;
    return this.__isSigned ? Math.max(normalized, -1) : normalized;
  }
}

/** A compute stage and its bind group. */
type DeformStage = {
  layout: GPUBindGroupLayout;
  pipeline: GPUComputePipeline;
  bindGroup?: GPUBindGroup;
  bindGroupBuffers: (GPUBuffer | undefined)[];
};

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
export class WebGpuVertexDeformer {
  private __device: GPUDevice;
  private __registry: GpuDeformRegistry;
  private __stage: DeformStage;
  private __paramsBuffer: GPUBuffer;
  private __paramsArray = new Uint32Array(ParamsByteSize / 4);
  private __dummyBuffer: GPUBuffer;

  private __sourcesBuffer!: GPUBuffer;
  private __chunksBuffer!: GPUBuffer;
  private __deformedBuffer!: GPUBuffer;
  private __boundsBuffer!: GPUBuffer;
  private __sourcesU32!: Uint32Array;
  private __sourcesF32!: Float32Array;
  private __chunksU32!: Uint32Array;
  private __sourcesDirty = new DirtyRange();
  private __chunksDirty = new DirtyRange();

  private __entryInfos = new Map<GpuDeformEntry, EntryInfo>();
  private __version = 0;
  private __lastDispatchedVersion = -1;
  private __resetRequested = false;
  /** `Mesh._primitivePositionUpdateVersion` when the sources were last revalidated. */
  private __lastPositionUpdateVersion = -1;

  constructor(device: GPUDevice) {
    this.__device = device;
    this.__registry = new GpuDeformRegistry(InitialCapacities);
    const r = 'read-only-storage';
    const types: GPUBufferBindingType[] = [r, 'uniform', r, r, r, r, r, 'storage', 'storage'];
    const layout = device.createBindGroupLayout({
      label: 'GpuSkinning.deform',
      entries: types.map((type, binding) => ({ binding, visibility: GPUShaderStage.COMPUTE, buffer: { type } })),
    });
    const pipeline = device.createComputePipeline({
      label: 'GpuSkinning.deform',
      layout: device.createPipelineLayout({ bindGroupLayouts: [layout] }),
      compute: {
        module: device.createShaderModule({ label: 'GpuSkinning.deform', code: deformWgsl }),
        entryPoint: 'deform',
      },
    });
    this.__stage = { layout, pipeline, bindGroupBuffers: [] };
    this.__paramsBuffer = device.createBuffer({
      label: 'GpuSkinning.params',
      size: ParamsByteSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.__dummyBuffer = device.createBuffer({
      label: 'GpuSkinning.dummy',
      size: 16,
      usage: GPUBufferUsage.STORAGE,
    });
    this.__createTables(InitialCapacities);
  }

  /** The bookkeeping of the allocations (exposed for tests and statistics). */
  get registry(): GpuDeformRegistry {
    return this.__registry;
  }

  /** The deformed vertices, read by the vertex shaders (group 0, binding 4). */
  get deformedVerticesBuffer(): GPUBuffer {
    return this.__deformedBuffer;
  }

  /** The bounding boxes of the deformed instances, read by the culling. */
  get boundsBuffer(): GPUBuffer {
    return this.__boundsBuffer;
  }

  /** Whether any entry is alive. */
  get hasEntries(): boolean {
    return this.__registry.entryCount > 0;
  }

  /** Whether the tables changed since the last dispatch (the deformation must run again). */
  get isChanged(): boolean {
    return this.__version !== this.__lastDispatchedVersion;
  }

  /** Whether an allocation failed since the last reset (the tables must grow). */
  get isOverflowed(): boolean {
    return this.__registry.isOverflowed;
  }

  /**
   * Whether the entries can no longer be updated in place (the vertex counts of a mesh changed): every entry must be
   * dropped with `reset`.
   */
  get isResetRequested(): boolean {
    return this.__resetRequested;
  }

  /** The current capacities of the tables. */
  get capacities(): Readonly<GpuDeformCapacities> {
    return this.__registry.capacities;
  }

  /**
   * Gets the deformation of the instances of a mesh, allocating and writing its tables on first use.
   *
   * @param engine - The engine
   * @param mesh - The mesh (`Mesh._needsComputeDeformation`)
   * @param entityInfo - The instance variation data of the mesh (`Mesh._variationEntityInfo`), which identifies the
   *   deformation: a new array (instances added or removed) is a new deformation
   * @returns The entry, or undefined when the tables are full (draw the mesh without the GPU culling)
   */
  acquire(engine: Engine, mesh: Mesh, entityInfo: Uint32Array): GpuDeformEntry | undefined {
    const primitives: Primitive[] = [];
    const vertexCounts: number[] = [];
    const primitiveNumber = mesh.getPrimitiveNumber();
    for (let i = 0; i < primitiveNumber; i++) {
      const primitive = mesh.getPrimitiveAt(i);
      const position = findAttribute(primitive, 'POSITION');
      if (position === undefined) {
        return undefined;
      }
      primitives.push(primitive);
      vertexCounts.push(position.elementCount);
    }
    const result = this.__registry.acquire(entityInfo, vertexCounts, entityInfo.length / 4);
    if (result === undefined) {
      return undefined;
    }
    if (result.isNew) {
      const info: EntryInfo = {
        engine,
        mesh,
        entityInfo,
        primitives,
        positionUpdateCount: mesh.primitivePositionUpdateCount,
        morphPrimitiveCount: -1,
        blendShapeOffsets: [],
      };
      this.__entryInfos.set(result.entry, info);
      this.__writeSources(result.entry, info);
      this.__writeChunks(result.entry, info);
      this.__version++;
    }
    return result.entry;
  }

  /**
   * Removes the reference of a cull group to an entry (after the commands that used it were submitted).
   */
  release(entry: GpuDeformEntry) {
    if (!this.__registry.release(entry)) {
      return;
    }
    this.__entryInfos.delete(entry);
    const chunks = this.__chunksU32;
    for (let k = 0; k < entry.chunkCount; k++) {
      // An unused chunk slot deforms no vertex.
      chunks[(entry.chunkBase + k) * ChunkWordSize + 1] = 0;
    }
    this.__chunksDirty.add(entry.chunkBase, entry.chunkBase + entry.chunkCount);
    this.__version++;
  }

  /**
   * The index of the first deformed vertex of a primitive among the deformed vertices of an instance
   * (`UniformDrawParameters.deformedVertexOffset`), or undefined when the primitive is not one of the entry's mesh.
   */
  getPrimitiveOffset(entry: GpuDeformEntry, primitive: Primitive): number | undefined {
    const info = this.__entryInfos.get(entry);
    if (info === undefined) {
      return undefined;
    }
    const index = info.primitives.indexOf(primitive);
    return index < 0 ? undefined : entry.primitiveOffsets[index];
  }

  /** The index of the first deformed vertex of an instance (the w of its instance ids minus 1). */
  getInstanceDeformedBase(entry: GpuDeformEntry, instanceIndex: number): number {
    return entry.deformedBase + instanceIndex * entry.vertexCount;
  }

  /** The bounding box slot of an instance. */
  getInstanceBoundsSlot(entry: GpuDeformEntry, instanceIndex: number): number {
    return entry.boundsBase + instanceIndex;
  }

  /**
   * Rewrites the tables that depend on data changed since they were written: the sources of the meshes whose vertex
   * positions were updated, and the chunks when the layout of the morph targets changed. Call once per frame before
   * `encode`.
   */
  refresh() {
    const positionUpdateVersion = Mesh._primitivePositionUpdateVersion;
    if (positionUpdateVersion !== this.__lastPositionUpdateVersion) {
      this.__lastPositionUpdateVersion = positionUpdateVersion;
      this.__refreshChangedSources();
    }
    this.__refreshMorphLayouts();
  }

  /**
   * Records the deformation compute pass (after clearing the bounding boxes) when there is anything to deform.
   *
   * @param encoder - The command encoder, submitted before the commands that draw the deformed vertices
   * @param storageBuffer - The storage buffer of the GPU instance data (the bone data)
   * @param morphBuffers - The buffers of the morph targets
   * @param gpuTimer - When set (and a frame is being measured), measures the pass as 'GpuSkinning'
   * @returns True when the pass was recorded
   */
  encode(
    encoder: GPUCommandEncoder,
    storageBuffer: GPUBuffer,
    morphBuffers: GpuDeformMorphBuffers,
    gpuTimer?: WebGpuGpuTimer
  ): boolean {
    const registry = this.__registry;
    if (registry.entryCount === 0) {
      return false;
    }
    const device = this.__device;
    this.__uploadDirty(this.__sourcesBuffer, this.__sourcesU32, this.__sourcesDirty, SourceVertexWordSize);
    this.__uploadDirty(this.__chunksBuffer, this.__chunksU32, this.__chunksDirty, ChunkWordSize);

    const chunkCount = registry.chunkHighWater;
    const chunksPerRow = Math.max(1, Math.min(chunkCount, MaxWorkgroupsPerDimension));
    const params = this.__paramsArray;
    params[0] = chunkCount;
    params[1] = chunksPerRow;
    device.queue.writeBuffer(this.__paramsBuffer, 0, params);

    const stage = this.__stage;
    const buffers = [
      storageBuffer,
      this.__paramsBuffer,
      this.__sourcesBuffer,
      this.__chunksBuffer,
      morphBuffers.blendShapeData ?? this.__dummyBuffer,
      morphBuffers.morphOffsets ?? this.__dummyBuffer,
      morphBuffers.morphWeights ?? this.__dummyBuffer,
      this.__deformedBuffer,
      this.__boundsBuffer,
    ];
    let isBindGroupValid = stage.bindGroup != null;
    for (let i = 0; i < buffers.length && isBindGroupValid; i++) {
      isBindGroupValid = stage.bindGroupBuffers[i] === buffers[i];
    }
    if (!isBindGroupValid) {
      stage.bindGroup = device.createBindGroup({
        label: 'GpuSkinning.deform',
        layout: stage.layout,
        entries: buffers.map((buffer, binding) => ({ binding, resource: { buffer } })),
      });
      stage.bindGroupBuffers = buffers;
    }

    // The bounding boxes are merged with atomicMax, from 0 (empty).
    encoder.clearBuffer(this.__boundsBuffer, 0, registry.boundsHighWater * DeformBoundsByteSize);
    const passDescriptor: GPUComputePassDescriptor = { label: 'GpuSkinning' };
    const timestampWrites = gpuTimer?.getTimestampWrites('GpuSkinning');
    if (timestampWrites != null) {
      passDescriptor.timestampWrites = timestampWrites;
    }
    const pass = encoder.beginComputePass(passDescriptor);
    if (chunkCount > 0) {
      pass.setPipeline(stage.pipeline);
      pass.setBindGroup(0, stage.bindGroup!);
      pass.dispatchWorkgroups(chunksPerRow, Math.ceil(chunkCount / chunksPerRow));
    }
    pass.end();
    this.__lastDispatchedVersion = this.__version;
    return true;
  }

  /**
   * The capacities the tables must grow to after an allocation failed, or undefined when they did not overflow or
   * cannot grow (the device limits are reached; the failed draws stay unculled).
   */
  getGrownCapacities(): GpuDeformCapacities | undefined {
    const registry = this.__registry;
    if (!registry.isOverflowed) {
      return undefined;
    }
    const required = registry.requiredCapacities;
    const current = registry.capacities;
    const limits = this.__device.limits;
    const maxBytes = Math.min(limits.maxStorageBufferBindingSize, limits.maxBufferSize);
    const grow = (capacity: number, needed: number, bytesPerSlot: number) => {
      let next = capacity;
      while (next < needed * 1.25) {
        next *= 2;
      }
      return Math.max(capacity, Math.min(next, Math.floor(maxBytes / bytesPerSlot)));
    };
    const capacities: GpuDeformCapacities = {
      sourceVertices: grow(current.sourceVertices, required.sourceVertices, SourceVertexByteSize),
      deformedVertices: grow(current.deformedVertices, required.deformedVertices, DeformedVertexByteSize),
      bounds: grow(current.bounds, required.bounds, DeformBoundsByteSize),
      chunks: grow(current.chunks, required.chunks, ChunkByteSize),
    };
    if (
      capacities.sourceVertices === current.sourceVertices &&
      capacities.deformedVertices === current.deformedVertices &&
      capacities.bounds === current.bounds &&
      capacities.chunks === current.chunks
    ) {
      return undefined;
    }
    return capacities;
  }

  /**
   * Drops every entry and recreates the tables. The cull groups that referenced the entries must be dropped as well,
   * and the render bundles that bound the deformed vertex buffer.
   */
  reset(capacities: GpuDeformCapacities) {
    this.__destroyTables();
    this.__createTables(capacities);
    this.__registry.reset(capacities);
    this.__entryInfos.clear();
    this.__resetRequested = false;
    this.__version++;
  }

  /** Releases the GPU resources. */
  destroy() {
    this.__destroyTables();
    this.__paramsBuffer.destroy();
    this.__dummyBuffer.destroy();
  }

  private __createTables(capacities: GpuDeformCapacities) {
    const device = this.__device;
    this.__sourcesBuffer = device.createBuffer({
      label: 'GpuSkinning.sources',
      size: capacities.sourceVertices * SourceVertexByteSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.__chunksBuffer = device.createBuffer({
      label: 'GpuSkinning.chunks',
      size: capacities.chunks * ChunkByteSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    // Bound in group 0 of the draws: replacing it requires re-recording the render bundles.
    this.__deformedBuffer = device.createBuffer({
      label: 'GpuSkinning.deformedVertices',
      size: capacities.deformedVertices * DeformedVertexByteSize,
      // COPY_SRC lets tests and tools read back the deformed vertices.
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    this.__boundsBuffer = device.createBuffer({
      label: 'GpuSkinning.bounds',
      size: capacities.bounds * DeformBoundsByteSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    });
    const sources = new ArrayBuffer(capacities.sourceVertices * SourceVertexByteSize);
    this.__sourcesU32 = new Uint32Array(sources);
    this.__sourcesF32 = new Float32Array(sources);
    this.__chunksU32 = new Uint32Array(capacities.chunks * ChunkWordSize);
    this.__sourcesDirty.clear();
    // The new chunk buffer is uninitialized: upload it whole (all unused) once.
    this.__chunksDirty.clear();
    this.__chunksDirty.add(0, capacities.chunks);
    this.__stage.bindGroup = undefined;
    this.__stage.bindGroupBuffers = [];
  }

  private __destroyTables() {
    this.__sourcesBuffer?.destroy();
    this.__chunksBuffer?.destroy();
    this.__deformedBuffer?.destroy();
    this.__boundsBuffer?.destroy();
  }

  private __uploadDirty(buffer: GPUBuffer, mirror: Uint32Array, dirty: DirtyRange, wordsPerSlot: number) {
    if (dirty.isEmpty) {
      return;
    }
    const begin = dirty.min * wordsPerSlot;
    const end = Math.min(dirty.max * wordsPerSlot, mirror.length);
    this.__device.queue.writeBuffer(buffer, begin * 4, mirror, begin, end - begin);
    dirty.clear();
  }

  /**
   * Writes the undeformed vertices of the primitives of an entry's mesh.
   */
  private __writeSources(entry: GpuDeformEntry, info: EntryInfo) {
    const u32 = this.__sourcesU32;
    const f32 = this.__sourcesF32;
    for (let p = 0; p < info.primitives.length; p++) {
      const primitive = info.primitives[p];
      const position = new AttributeReader(findAttribute(primitive, 'POSITION'));
      const normal = new AttributeReader(findAttribute(primitive, 'NORMAL'));
      const joints = new AttributeReader(findAttribute(primitive, 'JOINTS_0'));
      const weights = new AttributeReader(findAttribute(primitive, 'WEIGHTS_0'));
      const baryCentricCoord = new AttributeReader(findAttribute(primitive, 'BARY_CENTRIC_COORD'));
      const base = entry.sourceBase + entry.primitiveOffsets[p];
      const vertexCount = entry.primitiveVertexCounts[p];
      for (let v = 0; v < vertexCount; v++) {
        const w = (base + v) * SourceVertexWordSize;
        f32[w] = position.read(v, 0);
        f32[w + 1] = position.read(v, 1);
        f32[w + 2] = position.read(v, 2);
        // The vertex index of the morph targets, as processGeometry reads it from the barycentric coordinate.
        u32[w + 3] = baryCentricCoord.exists ? Math.max(0, Math.trunc(baryCentricCoord.read(v, 3))) : v;
        if (normal.exists) {
          f32[w + 4] = normal.read(v, 0);
          f32[w + 5] = normal.read(v, 1);
          f32[w + 6] = normal.read(v, 2);
        } else {
          f32[w + 4] = 0;
          f32[w + 5] = 0;
          f32[w + 6] = 0;
        }
        f32[w + 7] = 0;
        for (let c = 0; c < 4; c++) {
          u32[w + 8 + c] = joints.exists ? Math.max(0, Math.trunc(joints.read(v, c))) : 0;
          f32[w + 12 + c] = weights.exists ? weights.read(v, c) : 0;
        }
      }
    }
    this.__sourcesDirty.add(entry.sourceBase, entry.sourceBase + entry.vertexCount);
  }

  /**
   * Writes the chunks of an entry: the source and destination ranges, the skeleton and the morph targets applied to
   * each primitive of each instance.
   */
  private __writeChunks(entry: GpuDeformEntry, info: EntryInfo) {
    const engine = info.engine;
    const entityInfo = info.entityInfo;
    info.morphPrimitiveCount = Primitive.getPrimitiveCountHasMorph();
    info.blendShapeOffsets = BlendShapeComponent.getOffsetsInUniform(engine);
    const morphOffsets = Primitive.getMorphUniformDataOffsets();
    const blendShapeOffsets = info.blendShapeOffsets;

    // The storage locations of the SkeletalComponent members, with the same formula as the getters generated by
    // WebGpuStrategyBasic.getVertexShaderMethodDefinitions_storageBuffer (Vec4 members).
    const countPerBufferView = Component.getComponentCountPerBufferView(engine).get(SkeletalComponent) ?? 1;
    const locationOffsets = Component.getLocationOffsetOfMemberOfComponent(
      engine,
      SkeletalComponent,
      Component._getVariableLengthLocationMemberName('boneData')
    );
    const infoOffsets = Component.getLocationOffsetOfMemberOfComponent(engine, SkeletalComponent, 'boneDataInfo');

    const chunks = this.__chunksU32;
    for (let i = 0; i < entry.instanceCount; i++) {
      const skeletalSID = entityInfo[4 * i + 1];
      const blendShapeSID = entityInfo[4 * i + 2];
      let boneDataLocationIndex = Invalid;
      let boneDataInfoIndex = 0;
      if (skeletalSID !== Invalid) {
        const bufferViewIndex = Math.floor(skeletalSID / countPerBufferView);
        const indexInBufferView = skeletalSID % countPerBufferView;
        boneDataLocationIndex = (locationOffsets[bufferViewIndex] ?? 0) + indexInBufferView;
        boneDataInfoIndex = (infoOffsets[bufferViewIndex] ?? 0) + indexInBufferView;
      }
      const instanceDeformedBase = this.getInstanceDeformedBase(entry, i);
      const boundsSlot = this.getInstanceBoundsSlot(entry, i);
      let chunkIndex = entry.chunkBase + i * entry.chunkCountPerInstance;
      for (let p = 0; p < info.primitives.length; p++) {
        const primitive = info.primitives[p];
        // The same condition as the vertex shaders (RN_IS_MORPHING and uniformDrawParameters.morphTargetNumber), for
        // the instances with a blend shape component.
        let morphOffsetBase = 0;
        let morphTargetCount = 0;
        let morphWeightBase = 0;
        const targetCount = primitive.targets.length;
        const morphIndex = Primitive.getPrimitiveIdxHasMorph(primitive.primitiveUid);
        if (targetCount > 0 && blendShapeSID !== Invalid && morphIndex !== undefined) {
          const weightBase = blendShapeOffsets[blendShapeSID];
          if (weightBase !== undefined) {
            morphOffsetBase = morphOffsets[morphIndex] ?? 0;
            morphTargetCount = targetCount;
            morphWeightBase = weightBase;
          }
        }
        const primitiveOffset = entry.primitiveOffsets[p];
        const vertexCount = entry.primitiveVertexCounts[p];
        for (let k = 0; k < entry.primitiveChunkCounts[p]; k++) {
          const first = k * GpuDeformChunkSize;
          const w = chunkIndex * ChunkWordSize;
          chunks[w] = entry.sourceBase + primitiveOffset + first;
          chunks[w + 1] = Math.min(GpuDeformChunkSize, vertexCount - first);
          chunks[w + 2] = instanceDeformedBase + primitiveOffset + first;
          chunks[w + 3] = boundsSlot;
          chunks[w + 4] = boneDataLocationIndex;
          chunks[w + 5] = boneDataInfoIndex;
          chunks[w + 6] = morphOffsetBase;
          chunks[w + 7] = morphTargetCount;
          chunks[w + 8] = morphWeightBase;
          chunks[w + 9] = 0;
          chunks[w + 10] = 0;
          chunks[w + 11] = 0;
          chunkIndex++;
        }
      }
    }
    this.__chunksDirty.add(entry.chunkBase, entry.chunkBase + entry.chunkCount);
  }

  /**
   * Rewrites the sources of the meshes whose vertex positions were updated. When the vertex counts changed, the entry
   * layout is no longer valid and a reset is requested.
   */
  private __refreshChangedSources() {
    for (const [entry, info] of this.__entryInfos) {
      const mesh = info.mesh;
      if (mesh.primitivePositionUpdateCount === info.positionUpdateCount) {
        continue;
      }
      info.positionUpdateCount = mesh.primitivePositionUpdateCount;
      let isLayoutValid = mesh.getPrimitiveNumber() === info.primitives.length;
      for (let p = 0; p < info.primitives.length && isLayoutValid; p++) {
        const primitive = mesh.getPrimitiveAt(p);
        const position = findAttribute(primitive, 'POSITION');
        isLayoutValid =
          primitive === info.primitives[p] &&
          position !== undefined &&
          position.elementCount === entry.primitiveVertexCounts[p];
      }
      if (!isLayoutValid) {
        this.__resetRequested = true;
        continue;
      }
      this.__writeSources(entry, info);
      this.__version++;
    }
  }

  /**
   * Rewrites the chunks of the entries when the morph target or blend shape weight layouts changed (primitives with
   * morph targets or blend shape components were created or destroyed).
   */
  private __refreshMorphLayouts() {
    const morphPrimitiveCount = Primitive.getPrimitiveCountHasMorph();
    for (const [entry, info] of this.__entryInfos) {
      if (
        info.morphPrimitiveCount === morphPrimitiveCount &&
        info.blendShapeOffsets === BlendShapeComponent.getOffsetsInUniform(info.engine)
      ) {
        continue;
      }
      this.__writeChunks(entry, info);
      this.__version++;
    }
  }
}
