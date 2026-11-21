import { CameraComponent } from '../foundation/components/Camera/CameraComponent';
import { SceneGraphComponent } from '../foundation/components/SceneGraph/SceneGraphComponent';
import { Component } from '../foundation/core/Component';
import { Mesh } from '../foundation/geometry/Mesh';
import type { Primitive } from '../foundation/geometry/Primitive';
import type { Engine } from '../foundation/system/Engine';
import { DirtyRange } from './DirtyRange';
import {
  type GpuCullingCapacities,
  GpuCullingChunkSize,
  type GpuCullingGroup,
  GpuCullingRegistry,
} from './GpuCullingRegistry';
import type { GpuDeformEntry } from './GpuDeformRegistry';
import type { WebGpuGpuTimer } from './WebGpuGpuTimer';
import { type GpuDeformMorphBuffers, WebGpuVertexDeformer } from './WebGpuVertexDeformer';

/**
 * The WGSL shared by the culling passes.
 *
 * The instances of a cull group are processed in chunks of 64 consecutive instances (GpuCullingChunkSize), one
 * workgroup per chunk, so that a mesh with many instances is culled in parallel:
 * 1. `cullChunks`: each chunk tests its instances and compacts the visible ones to the front of its own slots of
 *    `scratchIds` with a workgroup prefix sum, and writes its visible count to `chunkCounts`.
 * 2. `prefixGroups`: one invocation per group sums the counts of its chunks in order, writing the output offset of
 *    each chunk to `chunkOffsets` and the visible count of the group to `visibleCounts`.
 * 3. `scatter`: each chunk copies its compacted instances to `visibleIds` at the group's range plus its offset.
 * 4. `finalize`: one invocation per indirect draw writes the visible count of the draw's group as its instance count.
 *
 * The compaction keeps the original instance order and uses no atomics, so the drawing order (and blending) is
 * deterministic.
 */
const commonWgsl = /* wgsl */ `
struct CullGroup {
  rangeBase: u32,     // the first instance slot of the group
  instanceCount: u32, // the number of instances (0 for an unused group slot)
  viewIndex: u32,     // the view the instances are culled with
  chunkBase: u32,     // the first chunk slot of the group
}

struct Params {
  groupCount: u32,
  drawCount: u32,
  chunkCount: u32,
  chunksPerRow: u32,
}

const CHUNK_SIZE: u32 = 64u;
const INVALID: u32 = 0xffffffffu;
`;

/**
 * Pass 1: the visibility test and the compaction within each chunk.
 *
 * The visibility test is the one of Frustum.culling (CPU): the world AABB is outside of a frustum plane (tested with
 * its "positive vertex"), or all the frustum corners are outside of one of its faces. The world AABB is computed from
 * the local AABB of the mesh and the world matrix read from the GPU instance data, so the culling follows the
 * transforms that were uploaded for the frame without any CPU work per instance.
 */
const cullChunksWgsl = /* wgsl */ `
${commonWgsl}
struct CullRecord {
  ids: vec4<u32>,             // the instance variation data (sceneGraphSID, skeletalSID, blendShapeSID, 0)
  center: vec3<f32>,          // the center of the local AABB of the mesh
  worldMatrixIndex: u32,      // vec4 index of the world matrix of the instance in data
  extent: vec3<f32>,          // the half size of the local AABB of the mesh
  isVisibleIndex: u32,        // float index of the isVisible flag of the instance in data
  isBillboardIndex: u32,      // float index of the isBillboard flag of the instance in data
  flags: u32,                 // bit 0: always visible (not culled), bit 1: deformed (the AABB is in bounds)
  boundsSlot: u32,            // the deformed bounding box of the instance (WebGpuVertexDeformer)
  pad1: u32,
}

struct CullView {
  header: vec4<f32>,             // x: 1 if the view culls
  planes: array<vec4<f32>, 6>,   // top, bottom, right, left, near, far (as Frustum.getPlane)
  corners: array<vec4<f32>, 8>,  // the frustum corners in world space
}

@group(0) @binding(0) var<storage, read> data: array<vec4<f32>>;
@group(0) @binding(1) var<uniform> params: Params;
@group(0) @binding(2) var<storage, read> records: array<CullRecord>;
@group(0) @binding(3) var<storage, read> groups: array<CullGroup>;
@group(0) @binding(4) var<storage, read> views: array<CullView>;
// (group index, index of the chunk's first instance in the group), or (INVALID, 0) for an unused chunk slot
@group(0) @binding(5) var<storage, read> chunks: array<vec2<u32>>;
@group(0) @binding(6) var<storage, read_write> scratchIds: array<vec4<u32>>;
@group(0) @binding(7) var<storage, read_write> chunkCounts: array<u32>;
// The local bounding boxes of the deformed instances (2 vec4 per instance: ~min.xyz and max.xyz, encoded by
// encodeOrderedFloat in WebGpuVertexDeformer; all 0 before the first deformation)
@group(0) @binding(8) var<storage, read> bounds: array<vec4<u32>>;

const ALWAYS_VISIBLE: u32 = 1u;
const DEFORMED: u32 = 2u;

fn decodeOrderedFloat(encoded: vec3<u32>) -> vec3<f32> {
  return bitcast<vec3<f32>>(select(~encoded, encoded & vec3<u32>(0x7fffffffu), (encoded & vec3<u32>(0x80000000u)) != vec3<u32>(0u)));
}

var<workgroup> scan: array<u32, 64>;

fn fetchScalar(floatIndex: u32) -> f32 {
  let value = data[floatIndex / 4u];
  return value[floatIndex % 4u];
}

fn isInstanceVisible(record: CullRecord, view: CullView) -> bool {
  if ((record.flags & ALWAYS_VISIBLE) != 0u) {
    return true;
  }
  // The same rule as the CPU culling (SceneGraphComponent.isVisible) and the vertex shaders (get_isVisible).
  if (fetchScalar(record.isVisibleIndex) <= 0.5) {
    return false;
  }
  if (view.header.x < 0.5) {
    return true;
  }
  // A billboard is rotated toward the camera in the vertex shader, so its world AABB is not known here.
  if (fetchScalar(record.isBillboardIndex) > 0.5) {
    return true;
  }
  var localCenter = record.center;
  var localExtent = record.extent;
  if ((record.flags & DEFORMED) != 0u) {
    let encodedMax = bounds[record.boundsSlot * 2u + 1u];
    if (encodedMax.x == 0u) {
      // Not deformed yet.
      return true;
    }
    let localMin = decodeOrderedFloat(~bounds[record.boundsSlot * 2u].xyz);
    let localMax = decodeOrderedFloat(encodedMax.xyz);
    localCenter = (localMin + localMax) * 0.5;
    localExtent = (localMax - localMin) * 0.5;
  }
  let m = mat4x4<f32>(
    data[record.worldMatrixIndex],
    data[record.worldMatrixIndex + 1u],
    data[record.worldMatrixIndex + 2u],
    data[record.worldMatrixIndex + 3u]
  );
  // The world AABB of the transformed local AABB (the same box as transforming its 8 corners).
  let center = (m * vec4<f32>(localCenter, 1.0)).xyz;
  let extent = abs(m[0].xyz) * localExtent.x + abs(m[1].xyz) * localExtent.y + abs(m[2].xyz) * localExtent.z;
  let minPoint = center - extent;
  let maxPoint = center + extent;

  // The box is completely outside of a plane exactly when its corner farthest along the plane normal is.
  for (var i = 0u; i < 6u; i = i + 1u) {
    let plane = view.planes[i];
    let farthest = select(minPoint, maxPoint, plane.xyz >= vec3<f32>(0.0));
    if (dot(plane.xyz, farthest) + plane.w < 0.0) {
      return false;
    }
  }

  // The frustum is completely outside of one of the box faces.
  var outMax = vec3<u32>(0u);
  var outMin = vec3<u32>(0u);
  for (var i = 0u; i < 8u; i = i + 1u) {
    let corner = view.corners[i].xyz;
    outMax = outMax + select(vec3<u32>(0u), vec3<u32>(1u), corner > maxPoint);
    outMin = outMin + select(vec3<u32>(0u), vec3<u32>(1u), corner < minPoint);
  }
  if (any(outMax == vec3<u32>(8u)) || any(outMin == vec3<u32>(8u))) {
    return false;
  }
  return true;
}

@compute @workgroup_size(64)
fn cullChunks(@builtin(workgroup_id) workgroupId: vec3<u32>, @builtin(local_invocation_index) lid: u32) {
  // c is uniform in the workgroup, so this return keeps the barriers below in uniform control flow.
  let c = workgroupId.y * params.chunksPerRow + workgroupId.x;
  if (c >= params.chunkCount) {
    return;
  }
  let chunk = chunks[c];
  var visible = 0u;
  var ids = vec4<u32>(0u);
  var chunkSlotBase = 0u;
  if (chunk.x != INVALID) {
    let group = groups[chunk.x];
    chunkSlotBase = group.rangeBase + chunk.y;
    if (chunk.y + lid < group.instanceCount) {
      let record = records[chunkSlotBase + lid];
      ids = record.ids;
      if (isInstanceVisible(record, views[group.viewIndex])) {
        visible = 1u;
      }
    }
  }
  // Inclusive prefix sum of the visibility (Hillis-Steele).
  scan[lid] = visible;
  workgroupBarrier();
  for (var offset = 1u; offset < CHUNK_SIZE; offset = offset << 1u) {
    var addend = 0u;
    if (lid >= offset) {
      addend = scan[lid - offset];
    }
    workgroupBarrier();
    scan[lid] = scan[lid] + addend;
    workgroupBarrier();
  }
  if (visible == 1u) {
    scratchIds[chunkSlotBase + scan[lid] - 1u] = ids;
  }
  if (lid == CHUNK_SIZE - 1u) {
    chunkCounts[c] = scan[lid];
  }
}
`;

/** Pass 2: the output offset of each chunk and the visible count of each group. */
const prefixGroupsWgsl = /* wgsl */ `
${commonWgsl}
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> groups: array<CullGroup>;
@group(0) @binding(2) var<storage, read> chunkCounts: array<u32>;
@group(0) @binding(3) var<storage, read_write> chunkOffsets: array<u32>;
@group(0) @binding(4) var<storage, read_write> visibleCounts: array<u32>;

@compute @workgroup_size(64)
fn prefixGroups(@builtin(global_invocation_id) id: vec3<u32>) {
  let g = id.x;
  if (g >= params.groupCount) {
    return;
  }
  let group = groups[g];
  let chunkCount = (group.instanceCount + CHUNK_SIZE - 1u) / CHUNK_SIZE;
  var sum = 0u;
  for (var k = 0u; k < chunkCount; k = k + 1u) {
    chunkOffsets[group.chunkBase + k] = sum;
    sum = sum + chunkCounts[group.chunkBase + k];
  }
  visibleCounts[g] = sum;
}
`;

/** Pass 3: the copy of the compacted instances of each chunk to the visible instance buffer. */
const scatterWgsl = /* wgsl */ `
${commonWgsl}
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> groups: array<CullGroup>;
@group(0) @binding(2) var<storage, read> chunks: array<vec2<u32>>;
@group(0) @binding(3) var<storage, read> chunkCounts: array<u32>;
@group(0) @binding(4) var<storage, read> chunkOffsets: array<u32>;
@group(0) @binding(5) var<storage, read> scratchIds: array<vec4<u32>>;
@group(0) @binding(6) var<storage, read_write> visibleIds: array<vec4<u32>>;

@compute @workgroup_size(64)
fn scatter(@builtin(workgroup_id) workgroupId: vec3<u32>, @builtin(local_invocation_index) lid: u32) {
  let c = workgroupId.y * params.chunksPerRow + workgroupId.x;
  if (c >= params.chunkCount) {
    return;
  }
  let chunk = chunks[c];
  if (chunk.x == INVALID || lid >= chunkCounts[c]) {
    return;
  }
  let rangeBase = groups[chunk.x].rangeBase;
  visibleIds[rangeBase + chunkOffsets[c] + lid] = scratchIds[rangeBase + chunk.y + lid];
}
`;

/**
 * Pass 4: the instance count of each indirect draw, the visible count of the draw's group.
 * Several draws share a group (the primitives of a mesh and the depth prepass).
 */
const finalizeWgsl = /* wgsl */ `
${commonWgsl}
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> visibleCounts: array<u32>;
@group(0) @binding(2) var<storage, read> drawGroups: array<u32>;
@group(0) @binding(3) var<storage, read_write> args: array<u32>;

@compute @workgroup_size(64)
fn finalize(@builtin(global_invocation_id) id: vec3<u32>) {
  let d = id.x;
  if (d >= params.drawCount) {
    return;
  }
  let g = drawGroups[d];
  var count = 0u;
  if (g != INVALID) {
    count = visibleCounts[g];
  }
  // The indirect arguments are [indexCount or vertexCount, instanceCount, ...].
  args[d * 5u + 1u] = count;
}
`;

const WorkgroupSize = 64;
const MaxWorkgroupsPerDimension = 65535;
/** The byte size of a CullRecord. */
const RecordByteSize = 64;
const RecordWordSize = RecordByteSize / 4;
/** The byte size of a CullGroup. */
const GroupByteSize = 16;
/** The byte size of a CullView (1 header + 6 planes + 8 corners). */
const ViewWordSize = 15 * 4;
const ViewByteSize = ViewWordSize * 4;
/** The byte size of the indirect arguments of a draw (drawIndexedIndirect uses 5 u32, drawIndirect 4 u32). */
export const GpuCullingArgsByteSize = 20;
const ArgsWordSize = GpuCullingArgsByteSize / 4;
/** The byte size of a visible instance (the instance variation data, uint32x4). */
const InstanceByteSize = 16;
const ParamsByteSize = 16;
const InvalidGroup = 0xffffffff;
const FlagAlwaysVisible = 1;
const FlagDeformed = 2;

/** The byte size of a chunk table entry (group index, first instance in the group). */
const ChunkByteSize = 8;

const InitialCapacities: GpuCullingCapacities = { instances: 8192, groups: 2048, draws: 4096, chunks: 4096 };

/** An indirect draw registered for GPU culling. */
export interface GpuCulledDraw {
  /** The range of the visible instance buffer to bind as the instance vertex buffer (slot 0). */
  readonly instanceVertexBuffer: { buffer: GPUBuffer; offset: number; size: number };
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

/** A compute pipeline of the culling and its bind group. */
type ComputeStage = {
  layout: GPUBindGroupLayout;
  pipeline: GPUComputePipeline;
  bindGroup?: GPUBindGroup;
};

/** The view (camera) a group is culled with. */
type CullView = {
  camera: CameraComponent;
};

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
export class WebGpuGpuCulling {
  private __device: GPUDevice;
  private __registry: GpuCullingRegistry;
  private __passes: {
    cull: ComputeStage;
    prefix: ComputeStage;
    scatter: ComputeStage;
    finalize: ComputeStage;
  };
  /** The storage buffer of the GPU instance data bound in the cull bind group. */
  private __cullBindGroupStorageBuffer?: GPUBuffer;
  /** The deformed bounding box buffer bound in the cull bind group. */
  private __cullBindGroupBoundsBuffer?: GPUBuffer;
  /** The vertex deformation (skinning, blend shapes) of the deformed meshes (Config.isComputeSkinningEnabled). */
  private __deformer: WebGpuVertexDeformer;

  private __paramsBuffer: GPUBuffer;
  private __paramsArray = new Uint32Array(ParamsByteSize / 4);
  private __recordsBuffer!: GPUBuffer;
  private __groupsBuffer!: GPUBuffer;
  private __visibleIdsBuffer!: GPUBuffer;
  private __visibleCountsBuffer!: GPUBuffer;
  private __drawGroupsBuffer!: GPUBuffer;
  private __argsBuffer!: GPUBuffer;
  private __chunksBuffer!: GPUBuffer;
  private __chunkCountsBuffer!: GPUBuffer;
  private __chunkOffsetsBuffer!: GPUBuffer;
  private __scratchIdsBuffer!: GPUBuffer;
  private __viewsBuffer?: GPUBuffer;
  private __viewsCapacity = 0;

  private __recordsArrayBuffer!: ArrayBuffer;
  private __recordsU32!: Uint32Array;
  private __recordsF32!: Float32Array;
  private __groupsU32!: Uint32Array;
  private __drawGroupsU32!: Uint32Array;
  private __argsU32!: Uint32Array;
  private __chunksU32!: Uint32Array;
  private __viewsF32 = new Float32Array(0);
  private __uploadedViewsF32 = new Float32Array(0);

  private __recordsDirty = new DirtyRange();
  private __groupsDirty = new DirtyRange();
  private __drawGroupsDirty = new DirtyRange();
  private __argsDirty = new DirtyRange();
  private __chunksDirty = new DirtyRange();

  /**
   * The live group of each group slot, with the vertex buffer range of its visible instances and the source of its
   * records. `positionUpdateCount` is the mesh's `primitivePositionUpdateCount` the local AABB was written for.
   */
  private __groupVertexRanges: (
    | {
        group: GpuCullingGroup;
        range: GpuCulledDraw['instanceVertexBuffer'];
        engine: Engine;
        mesh: Mesh;
        entityInfo: Uint32Array;
        positionUpdateCount: number;
        /** The deformation of the instances, for a deformed mesh. */
        deform: GpuDeformEntry | undefined;
        /** Whether the mesh needs a deformation that could not be allocated (its draws are not culled). */
        isDeformFailed: boolean;
      }
    | undefined
  )[] = [];
  private __views: CullView[] = [];
  private __viewIndexOfCamera = new Map<CameraComponent, number>();

  private __inputsDirty = true;
  /** `Mesh._primitivePositionUpdateVersion` when the records were last revalidated. */
  private __lastPositionUpdateVersion = -1;
  private __lastEncodedRegistryVersion = -1;

  constructor(device: GPUDevice) {
    this.__device = device;
    this.__registry = new GpuCullingRegistry(InitialCapacities);
    // Created up front, so that the deformed vertex buffer exists before the first draw binds group 0.
    this.__deformer = new WebGpuVertexDeformer(device);
    const createStage = (label: string, code: string, entryPoint: string, types: GPUBufferBindingType[]) => {
      const layout = device.createBindGroupLayout({
        label: `GpuCulling.${label}`,
        entries: types.map((type, binding) => ({ binding, visibility: GPUShaderStage.COMPUTE, buffer: { type } })),
      });
      const pipeline = device.createComputePipeline({
        label: `GpuCulling.${label}`,
        layout: device.createPipelineLayout({ bindGroupLayouts: [layout] }),
        compute: { module: device.createShaderModule({ label: `GpuCulling.${label}`, code }), entryPoint },
      });
      return { layout, pipeline } as ComputeStage;
    };
    const r = 'read-only-storage';
    const w = 'storage';
    const u = 'uniform';
    this.__passes = {
      cull: createStage('cullChunks', cullChunksWgsl, 'cullChunks', [r, u, r, r, r, r, w, w, r]),
      prefix: createStage('prefixGroups', prefixGroupsWgsl, 'prefixGroups', [u, r, r, w, w]),
      scatter: createStage('scatter', scatterWgsl, 'scatter', [u, r, r, r, r, r, w]),
      finalize: createStage('finalize', finalizeWgsl, 'finalize', [u, r, r, w]),
    };
    this.__paramsBuffer = device.createBuffer({
      label: 'GpuCulling.params',
      size: ParamsByteSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.__createTables(InitialCapacities);
  }

  /** The bookkeeping of the allocations (exposed for tests and statistics). */
  get registry(): GpuCullingRegistry {
    return this.__registry;
  }

  /** The vertex deformation of the deformed meshes (exposed for tests and statistics). */
  get deformer(): WebGpuVertexDeformer {
    return this.__deformer;
  }

  /** The deformed vertices, bound at group 0, binding 4 of the draws (see processGeometry). */
  get deformedVerticesBuffer(): GPUBuffer {
    return this.__deformer.deformedVerticesBuffer;
  }

  /** Starts a render bundle recording. See GpuCullingRegistry.beginRecording. */
  beginRecording() {
    this.__registry.beginRecording();
  }

  /** Whether a render bundle recording is in progress. */
  get isRecording() {
    return this.__registry.isRecording;
  }

  /** Finishes a render bundle recording. See GpuCullingRegistry.finishRecording. */
  finishRecording(bundleKey: string | undefined) {
    this.__registry.finishRecording(bundleKey);
  }

  /** Drops the render bundle recording in progress. See GpuCullingRegistry.abortRecording. */
  abortRecording() {
    this.__registry.abortRecording();
  }

  /** Retires the allocations of all the cached render bundles (the bundle cache is cleared). */
  retireAllBundles() {
    this.__registry.retireAllBundles();
  }

  /**
   * Marks the inputs of the culling (the GPU instance data: transforms, visibility, cameras) as changed, so the
   * next `encode` dispatches the culling.
   */
  markInputsDirty() {
    this.__inputsDirty = true;
  }

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
  registerDraw(
    engine: Engine,
    mesh: Mesh,
    primitive: Primitive,
    cameraSID: number,
    elementCount: number
  ): GpuCulledDraw | undefined {
    const registry = this.__registry;
    if (!registry.isRecording) {
      return undefined;
    }
    const entityInfo = mesh._variationEntityInfo;
    const instanceCount = mesh.meshEntitiesInner.length;
    if (entityInfo === undefined || entityInfo.length !== instanceCount * 4 || instanceCount === 0) {
      return undefined;
    }
    const viewIndex = this.__getOrCreateView(engine, cameraSID);
    if (viewIndex < 0) {
      return undefined;
    }
    const group = registry.getOrAllocateGroup(mesh, viewIndex, instanceCount);
    if (group === undefined) {
      return undefined;
    }
    let groupEntry = this.__groupVertexRanges[group.index];
    if (groupEntry === undefined || groupEntry.group !== group) {
      // The deformation is shared by the groups of the mesh (views, render bundles) and released with each group.
      const needsDeformation = mesh._needsComputeDeformation;
      const deform = needsDeformation ? this.__deformer.acquire(engine, mesh, entityInfo) : undefined;
      groupEntry = {
        group,
        range: {
          buffer: this.__visibleIdsBuffer,
          offset: group.rangeBase * InstanceByteSize,
          size: instanceCount * InstanceByteSize,
        },
        engine,
        mesh,
        entityInfo,
        positionUpdateCount: mesh.primitivePositionUpdateCount,
        deform,
        isDeformFailed: needsDeformation && deform === undefined,
      };
      this.__groupVertexRanges[group.index] = groupEntry;
      this.__writeGroup(engine, mesh, group, entityInfo, deform);
    }
    if (groupEntry.isDeformFailed) {
      // The deformation tables are full: the draw deforms in the vertex shader without culling, until they grow.
      return undefined;
    }
    let deformedVertexOffset: number | undefined;
    if (groupEntry.deform !== undefined) {
      deformedVertexOffset = this.__deformer.getPrimitiveOffset(groupEntry.deform, primitive);
      if (deformedVertexOffset === undefined) {
        return undefined;
      }
    }
    const slot = registry.allocateDraw();
    if (slot < 0) {
      return undefined;
    }
    const args = this.__argsU32;
    const argsBase = slot * ArgsWordSize;
    // [indexCount | vertexCount, instanceCount (written by the culling), firstIndex | firstVertex,
    //  baseVertex | firstInstance, firstInstance]. The vertex and index buffers are bound with offsets, so the
    // other fields are 0 (a non-zero firstInstance would require the 'indirect-first-instance' feature).
    args[argsBase] = elementCount;
    args[argsBase + 1] = 0;
    args[argsBase + 2] = 0;
    args[argsBase + 3] = 0;
    args[argsBase + 4] = 0;
    this.__argsDirty.add(slot, slot + 1);
    this.__drawGroupsU32[slot] = group.index;
    this.__drawGroupsDirty.add(slot, slot + 1);
    return {
      instanceVertexBuffer: groupEntry.range,
      indirectBuffer: this.__argsBuffer,
      indirectOffset: slot * GpuCullingArgsByteSize,
      deformedVertexOffset,
    };
  }

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
  encode(
    storageBuffer: GPUBuffer | undefined,
    gpuTimer?: WebGpuGpuTimer,
    morphBuffers: GpuDeformMorphBuffers = {}
  ): GPUCommandBuffer | undefined {
    const registry = this.__registry;
    const groupCount = registry.groupHighWater;
    const drawCount = registry.drawHighWater;
    if (storageBuffer == null || groupCount === 0) {
      return undefined;
    }
    const viewsChanged = this.__updateViews();
    const positionUpdateVersion = Mesh._primitivePositionUpdateVersion;
    if (positionUpdateVersion !== this.__lastPositionUpdateVersion) {
      this.__lastPositionUpdateVersion = positionUpdateVersion;
      this.__refreshChangedBounds();
    }
    const deformer = this.__deformer;
    deformer.refresh();
    // The deformation inputs are the bone data and the blend shape weights (both marked as inputs), and the tables.
    const needsDeformation =
      deformer.hasEntries &&
      (this.__inputsDirty || deformer.isChanged || this.__cullBindGroupStorageBuffer !== storageBuffer);
    if (
      !this.__inputsDirty &&
      !needsDeformation &&
      this.__recordsDirty.isEmpty &&
      !viewsChanged &&
      registry.version === this.__lastEncodedRegistryVersion &&
      this.__cullBindGroupStorageBuffer === storageBuffer
    ) {
      return undefined;
    }
    this.__inputsDirty = false;
    this.__lastEncodedRegistryVersion = registry.version;

    const device = this.__device;
    this.__uploadDirty(this.__recordsBuffer, this.__recordsU32, this.__recordsDirty, RecordWordSize);
    this.__uploadDirty(this.__groupsBuffer, this.__groupsU32, this.__groupsDirty, GroupByteSize / 4);
    this.__uploadDirty(this.__chunksBuffer, this.__chunksU32, this.__chunksDirty, ChunkByteSize / 4);
    this.__uploadDirty(this.__drawGroupsBuffer, this.__drawGroupsU32, this.__drawGroupsDirty, 1);
    this.__uploadDirty(this.__argsBuffer, this.__argsU32, this.__argsDirty, ArgsWordSize);

    const chunkCount = registry.chunkHighWater;
    const chunksPerRow = Math.max(1, Math.min(chunkCount, MaxWorkgroupsPerDimension));
    const params = this.__paramsArray;
    params[0] = groupCount;
    params[1] = drawCount;
    params[2] = chunkCount;
    params[3] = chunksPerRow;
    device.queue.writeBuffer(this.__paramsBuffer, 0, params);

    const passes = this.__passes;
    if (
      passes.cull.bindGroup == null ||
      this.__cullBindGroupStorageBuffer !== storageBuffer ||
      this.__cullBindGroupBoundsBuffer !== deformer.boundsBuffer
    ) {
      passes.cull.bindGroup = this.__createBindGroup(passes.cull, [
        storageBuffer,
        this.__paramsBuffer,
        this.__recordsBuffer,
        this.__groupsBuffer,
        this.__viewsBuffer!,
        this.__chunksBuffer,
        this.__scratchIdsBuffer,
        this.__chunkCountsBuffer,
        deformer.boundsBuffer,
      ]);
      this.__cullBindGroupStorageBuffer = storageBuffer;
      this.__cullBindGroupBoundsBuffer = deformer.boundsBuffer;
    }
    passes.prefix.bindGroup ??= this.__createBindGroup(passes.prefix, [
      this.__paramsBuffer,
      this.__groupsBuffer,
      this.__chunkCountsBuffer,
      this.__chunkOffsetsBuffer,
      this.__visibleCountsBuffer,
    ]);
    passes.scatter.bindGroup ??= this.__createBindGroup(passes.scatter, [
      this.__paramsBuffer,
      this.__groupsBuffer,
      this.__chunksBuffer,
      this.__chunkCountsBuffer,
      this.__chunkOffsetsBuffer,
      this.__scratchIdsBuffer,
      this.__visibleIdsBuffer,
    ]);
    passes.finalize.bindGroup ??= this.__createBindGroup(passes.finalize, [
      this.__paramsBuffer,
      this.__visibleCountsBuffer,
      this.__drawGroupsBuffer,
      this.__argsBuffer,
    ]);

    const encoder = device.createCommandEncoder({ label: 'GpuCulling' });
    if (needsDeformation) {
      // The deformed bounding boxes are written before the culling reads them (a separate pass).
      deformer.encode(encoder, storageBuffer, morphBuffers, gpuTimer);
    }
    const passDescriptor: GPUComputePassDescriptor = { label: 'GpuCulling' };
    const timestampWrites = gpuTimer?.getTimestampWrites('GpuCulling');
    if (timestampWrites != null) {
      passDescriptor.timestampWrites = timestampWrites;
    }
    // One compute pass: the dispatches run in order, and the writes of a dispatch are visible to the next one.
    const pass = encoder.beginComputePass(passDescriptor);
    const chunkRows = Math.ceil(chunkCount / chunksPerRow);
    if (chunkCount > 0) {
      pass.setPipeline(passes.cull.pipeline);
      pass.setBindGroup(0, passes.cull.bindGroup);
      pass.dispatchWorkgroups(chunksPerRow, chunkRows);
    }
    pass.setPipeline(passes.prefix.pipeline);
    pass.setBindGroup(0, passes.prefix.bindGroup);
    pass.dispatchWorkgroups(Math.ceil(groupCount / WorkgroupSize));
    if (chunkCount > 0) {
      pass.setPipeline(passes.scatter.pipeline);
      pass.setBindGroup(0, passes.scatter.bindGroup);
      pass.dispatchWorkgroups(chunksPerRow, chunkRows);
    }
    if (drawCount > 0) {
      pass.setPipeline(passes.finalize.pipeline);
      pass.setBindGroup(0, passes.finalize.bindGroup);
      pass.dispatchWorkgroups(Math.ceil(drawCount / WorkgroupSize));
    }
    pass.end();
    return encoder.finish();
  }

  private __createBindGroup(stage: ComputeStage, buffers: GPUBuffer[]): GPUBindGroup {
    return this.__device.createBindGroup({
      label: stage.pipeline.label,
      layout: stage.layout,
      entries: buffers.map((buffer, binding) => ({ binding, resource: { buffer } })),
    });
  }

  /**
   * Call after the frame's commands were submitted. Releases the allocations of the dropped bundles, and grows the
   * tables when an allocation failed.
   *
   * @returns True when the tables were recreated: every render bundle recorded before must be dropped
   */
  afterSubmit(): boolean {
    const registry = this.__registry;
    const released = registry.releaseRetired();
    if (released !== undefined) {
      const groups = this.__groupsU32;
      for (const group of released.groups) {
        // An unused group slot culls nothing and reports 0 visible instances.
        groups[group.index * 4 + 1] = 0;
        this.__groupsDirty.add(group.index, group.index + 1);
        const chunks = this.__chunksU32;
        for (let k = 0; k < group.chunkCount; k++) {
          chunks[(group.chunkBase + k) * 2] = InvalidGroup;
          chunks[(group.chunkBase + k) * 2 + 1] = 0;
        }
        this.__chunksDirty.add(group.chunkBase, group.chunkBase + group.chunkCount);
        const groupEntry = this.__groupVertexRanges[group.index];
        if (groupEntry?.group === group) {
          if (groupEntry.deform !== undefined) {
            this.__deformer.release(groupEntry.deform);
          }
          this.__groupVertexRanges[group.index] = undefined;
        }
      }
      const drawGroups = this.__drawGroupsU32;
      for (const draw of released.draws) {
        drawGroups[draw] = InvalidGroup;
        this.__drawGroupsDirty.add(draw, draw + 1);
      }
    }
    const deformer = this.__deformer;
    const cullingCapacities = this.__getGrownCapacities();
    const deformCapacities = deformer.getGrownCapacities();
    if (cullingCapacities === undefined && deformCapacities === undefined && !deformer.isResetRequested) {
      // Nothing overflowed, or the device limits are reached: keep the tables; the draws that do not fit stay unculled.
      return false;
    }
    // The cull groups refer to the deformation entries (and the bundles to both), so both start over.
    const capacities = cullingCapacities ?? { ...registry.capacities };
    this.__destroyTables();
    this.__createTables(capacities);
    registry.reset(capacities);
    deformer.reset(deformCapacities ?? { ...deformer.capacities });
    this.__groupVertexRanges.length = 0;
    this.__inputsDirty = true;
    return true;
  }

  /**
   * The capacities the culling tables must grow to after an allocation failed, or undefined when they did not
   * overflow or cannot grow (the device limits are reached).
   */
  private __getGrownCapacities(): GpuCullingCapacities | undefined {
    const registry = this.__registry;
    if (!registry.isOverflowed) {
      return undefined;
    }
    const required = registry.requiredCapacities;
    const current = registry.capacities;
    const limits = this.__device.limits;
    const maxBytes = Math.min(limits.maxStorageBufferBindingSize, limits.maxBufferSize);
    // Only the tables that are too small grow (by powers of two, with some headroom).
    const grow = (capacity: number, needed: number, bytesPerSlot: number) => {
      let next = capacity;
      while (next < needed * 1.25) {
        next *= 2;
      }
      return Math.max(capacity, Math.min(next, Math.floor(maxBytes / bytesPerSlot)));
    };
    const capacities: GpuCullingCapacities = {
      instances: grow(current.instances, required.instances, RecordByteSize),
      groups: grow(current.groups, required.groups, GroupByteSize),
      draws: grow(current.draws, required.draws, GpuCullingArgsByteSize),
      chunks: grow(current.chunks, required.chunks, ChunkByteSize),
    };
    if (
      capacities.instances === current.instances &&
      capacities.groups === current.groups &&
      capacities.draws === current.draws &&
      capacities.chunks === current.chunks
    ) {
      return undefined;
    }
    return capacities;
  }

  /**
   * Releases the GPU resources.
   */
  destroy() {
    this.__destroyTables();
    this.__deformer.destroy();
    this.__paramsBuffer.destroy();
    this.__viewsBuffer?.destroy();
    this.__viewsBuffer = undefined;
  }

  private __createTables(capacities: GpuCullingCapacities) {
    const device = this.__device;
    const usage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;
    this.__recordsBuffer = device.createBuffer({
      label: 'GpuCulling.records',
      size: capacities.instances * RecordByteSize,
      usage,
    });
    this.__groupsBuffer = device.createBuffer({
      label: 'GpuCulling.groups',
      size: capacities.groups * GroupByteSize,
      usage,
    });
    this.__visibleCountsBuffer = device.createBuffer({
      label: 'GpuCulling.visibleCounts',
      size: capacities.groups * 4,
      usage: GPUBufferUsage.STORAGE,
    });
    this.__drawGroupsBuffer = device.createBuffer({
      label: 'GpuCulling.drawGroups',
      size: capacities.draws * 4,
      usage,
    });
    // Bound in the render bundles: replacing them requires re-recording the bundles.
    this.__visibleIdsBuffer = device.createBuffer({
      label: 'GpuCulling.visibleIds',
      size: capacities.instances * InstanceByteSize,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE,
    });
    this.__chunksBuffer = device.createBuffer({
      label: 'GpuCulling.chunks',
      size: capacities.chunks * ChunkByteSize,
      usage,
    });
    this.__chunkCountsBuffer = device.createBuffer({
      label: 'GpuCulling.chunkCounts',
      size: capacities.chunks * 4,
      usage: GPUBufferUsage.STORAGE,
    });
    this.__chunkOffsetsBuffer = device.createBuffer({
      label: 'GpuCulling.chunkOffsets',
      size: capacities.chunks * 4,
      usage: GPUBufferUsage.STORAGE,
    });
    this.__scratchIdsBuffer = device.createBuffer({
      label: 'GpuCulling.scratchIds',
      size: capacities.instances * InstanceByteSize,
      usage: GPUBufferUsage.STORAGE,
    });
    this.__argsBuffer = device.createBuffer({
      label: 'GpuCulling.args',
      size: capacities.draws * GpuCullingArgsByteSize,
      // COPY_SRC lets tests and tools read back the culled instance counts.
      usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    });

    this.__recordsArrayBuffer = new ArrayBuffer(capacities.instances * RecordByteSize);
    this.__recordsU32 = new Uint32Array(this.__recordsArrayBuffer);
    this.__recordsF32 = new Float32Array(this.__recordsArrayBuffer);
    this.__groupsU32 = new Uint32Array(capacities.groups * 4);
    this.__drawGroupsU32 = new Uint32Array(capacities.draws).fill(InvalidGroup);
    this.__argsU32 = new Uint32Array(capacities.draws * ArgsWordSize);
    this.__chunksU32 = new Uint32Array(capacities.chunks * 2);
    for (let i = 0; i < capacities.chunks; i++) {
      this.__chunksU32[i * 2] = InvalidGroup;
    }
    // The new buffers are uninitialized: upload the whole draw group table (all invalid) and the group table (all
    // unused) once, so the dispatches never read garbage.
    this.__recordsDirty.clear();
    this.__groupsDirty.clear();
    this.__groupsDirty.add(0, capacities.groups);
    this.__drawGroupsDirty.clear();
    this.__drawGroupsDirty.add(0, capacities.draws);
    this.__argsDirty.clear();
    this.__chunksDirty.clear();
    this.__chunksDirty.add(0, capacities.chunks);
    this.__resetBindGroups();
  }

  private __resetBindGroups() {
    const passes = this.__passes;
    passes.cull.bindGroup = undefined;
    passes.prefix.bindGroup = undefined;
    passes.scatter.bindGroup = undefined;
    passes.finalize.bindGroup = undefined;
    this.__cullBindGroupStorageBuffer = undefined;
  }

  private __destroyTables() {
    this.__recordsBuffer?.destroy();
    this.__groupsBuffer?.destroy();
    this.__visibleCountsBuffer?.destroy();
    this.__drawGroupsBuffer?.destroy();
    this.__visibleIdsBuffer?.destroy();
    this.__argsBuffer?.destroy();
    this.__chunksBuffer?.destroy();
    this.__chunkCountsBuffer?.destroy();
    this.__chunkOffsetsBuffer?.destroy();
    this.__scratchIdsBuffer?.destroy();
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
   * Rewrites the records of the groups whose mesh vertex positions were updated after the records were written
   * (the local AABB changed while the render bundles stayed valid).
   */
  private __refreshChangedBounds() {
    const entries = this.__groupVertexRanges;
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry === undefined || entry.mesh.primitivePositionUpdateCount === entry.positionUpdateCount) {
        continue;
      }
      entry.positionUpdateCount = entry.mesh.primitivePositionUpdateCount;
      this.__writeGroup(entry.engine, entry.mesh, entry.group, entry.entityInfo, entry.deform);
    }
  }

  /**
   * Writes the group table entry and the per-instance records of a group.
   * The records of a deformed group point to the deformed vertices (instance ids w) and bounding box of each instance.
   */
  private __writeGroup(
    engine: Engine,
    mesh: Mesh,
    group: GpuCullingGroup,
    entityInfo: Uint32Array,
    deform: GpuDeformEntry | undefined
  ) {
    const groups = this.__groupsU32;
    const g = group.index * 4;
    groups[g] = group.rangeBase;
    groups[g + 1] = group.instanceCount;
    groups[g + 2] = group.viewIndex;
    groups[g + 3] = group.chunkBase;
    this.__groupsDirty.add(group.index, group.index + 1);
    const chunks = this.__chunksU32;
    for (let k = 0; k < group.chunkCount; k++) {
      chunks[(group.chunkBase + k) * 2] = group.index;
      chunks[(group.chunkBase + k) * 2 + 1] = k * GpuCullingChunkSize;
    }
    this.__chunksDirty.add(group.chunkBase, group.chunkBase + group.chunkCount);

    // The storage locations of the SceneGraphComponent members, with the same formula as the getters generated by
    // WebGpuStrategyBasic.getVertexShaderMethodDefinitions_storageBuffer.
    const countPerBufferView = Component.getComponentCountPerBufferView(engine).get(SceneGraphComponent) ?? 1;
    const worldMatrixOffsets = Component.getLocationOffsetOfMemberOfComponent(
      engine,
      SceneGraphComponent,
      'worldMatrix'
    );
    const isVisibleOffsets = Component.getLocationOffsetOfMemberOfComponent(engine, SceneGraphComponent, 'isVisible');
    const isBillboardOffsets = Component.getLocationOffsetOfMemberOfComponent(
      engine,
      SceneGraphComponent,
      'isBillboard'
    );

    const aabb = mesh.AABB;
    const isAabbValid = !aabb.isVanilla();
    const minPoint = aabb.minPoint._v;
    const maxPoint = aabb.maxPoint._v;
    const cx = (minPoint[0] + maxPoint[0]) * 0.5;
    const cy = (minPoint[1] + maxPoint[1]) * 0.5;
    const cz = (minPoint[2] + maxPoint[2]) * 0.5;
    const ex = (maxPoint[0] - minPoint[0]) * 0.5;
    const ey = (maxPoint[1] - minPoint[1]) * 0.5;
    const ez = (maxPoint[2] - minPoint[2]) * 0.5;

    const u32 = this.__recordsU32;
    const f32 = this.__recordsF32;
    const entities = mesh.meshEntitiesInner;
    const deformer = this.__deformer;
    for (let i = 0; i < group.instanceCount; i++) {
      const r = (group.rangeBase + i) * RecordWordSize;
      const sid = entityInfo[4 * i];
      const bufferViewIndex = Math.floor(sid / countPerBufferView);
      const indexInBufferView = sid % countPerBufferView;
      u32[r] = sid;
      u32[r + 1] = entityInfo[4 * i + 1];
      u32[r + 2] = entityInfo[4 * i + 2];
      // 1 + the first deformed vertex of the instance, read by processGeometry (0: deformed in the vertex shader).
      u32[r + 3] = deform !== undefined ? deformer.getInstanceDeformedBase(deform, i) + 1 : entityInfo[4 * i + 3];
      f32[r + 4] = cx;
      f32[r + 5] = cy;
      f32[r + 6] = cz;
      u32[r + 7] = (worldMatrixOffsets[bufferViewIndex] ?? 0) + 4 * indexInBufferView;
      f32[r + 8] = ex;
      f32[r + 9] = ey;
      f32[r + 10] = ez;
      u32[r + 11] = (isVisibleOffsets[bufferViewIndex] ?? 0) * 4 + indexInBufferView;
      u32[r + 12] = (isBillboardOffsets[bufferViewIndex] ?? 0) * 4 + indexInBufferView;
      // The same exception as the CPU culling (MeshRendererComponent.__cullingWithViewFrustum).
      const isBackgroundAsset = entities[i]?.getTagValue('type') === 'background-assets';
      if (deform !== undefined) {
        // The bounding box of the deformed vertices is computed on the GPU.
        u32[r + 13] = FlagDeformed | (isBackgroundAsset ? FlagAlwaysVisible : 0);
        u32[r + 14] = deformer.getInstanceBoundsSlot(deform, i);
      } else {
        u32[r + 13] = !isAabbValid || isBackgroundAsset ? FlagAlwaysVisible : 0;
        u32[r + 14] = 0;
      }
      u32[r + 15] = 0;
    }
    this.__recordsDirty.add(group.rangeBase, group.rangeBase + group.instanceCount);
  }

  private __getOrCreateView(engine: Engine, cameraSID: number): number {
    if (cameraSID < 0) {
      return -1;
    }
    const camera = engine.componentRepository.getComponent(CameraComponent, cameraSID) as CameraComponent | undefined;
    if (camera == null) {
      return -1;
    }
    let viewIndex = this.__viewIndexOfCamera.get(camera);
    if (viewIndex === undefined) {
      viewIndex = this.__views.length;
      this.__views.push({ camera });
      this.__viewIndexOfCamera.set(camera, viewIndex);
    }
    return viewIndex;
  }

  /**
   * Computes the frusta of the views from their cameras and uploads them when they changed.
   * @returns True when a view changed
   */
  private __updateViews(): boolean {
    const views = this.__views;
    const viewCount = views.length;
    if (viewCount === 0) {
      return false;
    }
    let resized = false;
    if (this.__viewsBuffer == null || this.__viewsCapacity < viewCount) {
      this.__viewsBuffer?.destroy();
      this.__viewsCapacity = Math.max(8, this.__viewsCapacity * 2, viewCount);
      this.__viewsBuffer = this.__device.createBuffer({
        label: 'GpuCulling.views',
        size: this.__viewsCapacity * ViewByteSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
      this.__viewsF32 = new Float32Array(this.__viewsCapacity * ViewWordSize);
      this.__uploadedViewsF32 = new Float32Array(this.__viewsCapacity * ViewWordSize);
      this.__passes.cull.bindGroup = undefined;
      resized = true;
    }
    const data = this.__viewsF32;
    for (let v = 0; v < viewCount; v++) {
      const camera = views[v].camera;
      const base = v * ViewWordSize;
      if (!camera._isAlive) {
        // A dead camera does not cull (its bundles are dropped with the camera).
        data[base] = 0;
        continue;
      }
      camera.updateFrustum();
      const frustum = camera.frustum;
      data[base] = 1;
      data[base + 1] = 0;
      data[base + 2] = 0;
      data[base + 3] = 0;
      for (let i = 0; i < 6; i++) {
        const plane = frustum.getPlane(i)._v;
        const p = base + 4 + i * 4;
        data[p] = plane[0];
        data[p + 1] = plane[1];
        data[p + 2] = plane[2];
        data[p + 3] = plane[3];
      }
      const corners = frustum.corners;
      for (let i = 0; i < 8; i++) {
        const corner = corners[i]._v;
        const p = base + 28 + i * 4;
        data[p] = corner[0];
        data[p + 1] = corner[1];
        data[p + 2] = corner[2];
        data[p + 3] = 1;
      }
    }
    const usedLength = viewCount * ViewWordSize;
    const uploaded = this.__uploadedViewsF32;
    let changed = resized;
    if (!changed) {
      for (let i = 0; i < usedLength; i++) {
        if (data[i] !== uploaded[i]) {
          changed = true;
          break;
        }
      }
    }
    if (changed) {
      this.__device.queue.writeBuffer(this.__viewsBuffer!, 0, data, 0, usedLength);
      uploaded.set(data.subarray(0, usedLength));
    }
    return changed;
  }
}
