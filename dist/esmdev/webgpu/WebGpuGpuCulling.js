// src/webgpu/WebGpuGpuCulling.ts
import { CameraComponent } from "../foundation/components/Camera/CameraComponent.js";
import { SceneGraphComponent } from "../foundation/components/SceneGraph/SceneGraphComponent.js";
import { Component } from "../foundation/core/Component.js";
import { Mesh } from "../foundation/geometry/Mesh.js";
import { DirtyRange } from "./DirtyRange.js";
import {
  GpuCullingChunkSize,
  GpuCullingRegistry
} from "./GpuCullingRegistry.js";
import { WebGpuVertexDeformer } from "./WebGpuVertexDeformer.js";
var commonWgsl = (
  /* wgsl */
  `
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
`
);
var cullChunksWgsl = (
  /* wgsl */
  `
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
`
);
var prefixGroupsWgsl = (
  /* wgsl */
  `
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
`
);
var scatterWgsl = (
  /* wgsl */
  `
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
`
);
var finalizeWgsl = (
  /* wgsl */
  `
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
`
);
var WorkgroupSize = 64;
var MaxWorkgroupsPerDimension = 65535;
var RecordByteSize = 64;
var RecordWordSize = RecordByteSize / 4;
var GroupByteSize = 16;
var ViewWordSize = 15 * 4;
var ViewByteSize = ViewWordSize * 4;
var GpuCullingArgsByteSize = 20;
var ArgsWordSize = GpuCullingArgsByteSize / 4;
var InstanceByteSize = 16;
var ParamsByteSize = 16;
var InvalidGroup = 4294967295;
var FlagAlwaysVisible = 1;
var FlagDeformed = 2;
var ChunkByteSize = 8;
var InitialCapacities = { instances: 8192, groups: 2048, draws: 4096, chunks: 4096 };
var WebGpuGpuCulling = class {
  constructor(device) {
    this.sH = new Uint32Array(ParamsByteSize / 4);
    this.IG = 0;
    this.kH = new Float32Array(0);
    this.lH = new Float32Array(0);
    this.bH = new DirtyRange();
    this.PG = new DirtyRange();
    this.QG = new DirtyRange();
    this.gH = new DirtyRange();
    this.RG = new DirtyRange();
    /**
     * The live group of each group slot, with the vertex buffer range of its visible instances and the source of its
     * records. `positionUpdateCount` is the mesh's `primitivePositionUpdateCount` the local AABB was written for.
     */
    this.JG = [];
    this.hH = [];
    this.mH = /* @__PURE__ */ new Map();
    this.SG = true;
    /** `Mesh._primitivePositionUpdateVersion` when the records were last revalidated. */
    this.nH = -1;
    this.oH = -1;
    this.xG = device;
    this.DG = new GpuCullingRegistry(InitialCapacities);
    this.EG = new WebGpuVertexDeformer(device);
    const createStage = (label, code, entryPoint, types) => {
      const layout = device.createBindGroupLayout({
        label: `GpuCulling.${label}`,
        entries: types.map((type, binding) => ({ binding, visibility: GPUShaderStage.COMPUTE, buffer: { type } }))
      });
      const pipeline = device.createComputePipeline({
        label: `GpuCulling.${label}`,
        layout: device.createPipelineLayout({ bindGroupLayouts: [layout] }),
        compute: { module: device.createShaderModule({ label: `GpuCulling.${label}`, code }), entryPoint }
      });
      return { layout, pipeline };
    };
    const r = "read-only-storage";
    const w = "storage";
    const u = "uniform";
    this.UG = {
      cull: createStage("cullChunks", cullChunksWgsl, "cullChunks", [r, u, r, r, r, r, w, w, r]),
      prefix: createStage("prefixGroups", prefixGroupsWgsl, "prefixGroups", [u, r, r, w, w]),
      scatter: createStage("scatter", scatterWgsl, "scatter", [u, r, r, r, r, r, w]),
      finalize: createStage("finalize", finalizeWgsl, "finalize", [u, r, r, w])
    };
    this.FG = device.createBuffer({
      label: "GpuCulling.params",
      size: ParamsByteSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.pH(InitialCapacities);
  }
  /** The bookkeeping of the allocations (exposed for tests and statistics). */
  get registry() {
    return this.DG;
  }
  /** The vertex deformation of the deformed meshes (exposed for tests and statistics). */
  get deformer() {
    return this.EG;
  }
  /** The deformed vertices, bound at group 0, binding 4 of the draws (see processGeometry). */
  get deformedVerticesBuffer() {
    return this.EG.deformedVerticesBuffer;
  }
  /** Starts a render bundle recording. See GpuCullingRegistry.beginRecording. */
  beginRecording() {
    this.DG.beginRecording();
  }
  /** Whether a render bundle recording is in progress. */
  get isRecording() {
    return this.DG.isRecording;
  }
  /** Finishes a render bundle recording. See GpuCullingRegistry.finishRecording. */
  finishRecording(bundleKey) {
    this.DG.finishRecording(bundleKey);
  }
  /** Drops the render bundle recording in progress. See GpuCullingRegistry.abortRecording. */
  abortRecording() {
    this.DG.abortRecording();
  }
  /** Retires the allocations of all the cached render bundles (the bundle cache is cleared). */
  retireAllBundles() {
    this.DG.retireAllBundles();
  }
  /**
   * Marks the inputs of the culling (the GPU instance data: transforms, visibility, cameras) as changed, so the
   * next `encode` dispatches the culling.
   */
  markInputsDirty() {
    this.SG = true;
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
  registerDraw(engine, mesh, primitive, cameraSID, elementCount) {
    const registry = this.DG;
    if (!registry.isRecording) {
      return void 0;
    }
    const entityInfo = mesh._variationEntityInfo;
    const instanceCount = mesh.meshEntitiesInner.length;
    if (entityInfo === void 0 || entityInfo.length !== instanceCount * 4 || instanceCount === 0) {
      return void 0;
    }
    const viewIndex = this.tH(engine, cameraSID);
    if (viewIndex < 0) {
      return void 0;
    }
    const group = registry.getOrAllocateGroup(mesh, viewIndex, instanceCount);
    if (group === void 0) {
      return void 0;
    }
    let groupEntry = this.JG[group.index];
    if (groupEntry === void 0 || groupEntry.group !== group) {
      const needsDeformation = mesh._needsComputeDeformation;
      const deform = needsDeformation ? this.EG.acquire(engine, mesh, entityInfo) : void 0;
      groupEntry = {
        group,
        range: {
          buffer: this.WG,
          offset: group.rangeBase * InstanceByteSize,
          size: instanceCount * InstanceByteSize
        },
        engine,
        mesh,
        entityInfo,
        positionUpdateCount: mesh.primitivePositionUpdateCount,
        deform,
        isDeformFailed: needsDeformation && deform === void 0
      };
      this.JG[group.index] = groupEntry;
      this.qH(engine, mesh, group, entityInfo, deform);
    }
    if (groupEntry.isDeformFailed) {
      return void 0;
    }
    let deformedVertexOffset;
    if (groupEntry.deform !== void 0) {
      deformedVertexOffset = this.EG.getPrimitiveOffset(groupEntry.deform, primitive);
      if (deformedVertexOffset === void 0) {
        return void 0;
      }
    }
    const slot = registry.allocateDraw();
    if (slot < 0) {
      return void 0;
    }
    const args = this.fH;
    const argsBase = slot * ArgsWordSize;
    args[argsBase] = elementCount;
    args[argsBase + 1] = 0;
    args[argsBase + 2] = 0;
    args[argsBase + 3] = 0;
    args[argsBase + 4] = 0;
    this.gH.add(slot, slot + 1);
    this.aH[slot] = group.index;
    this.QG.add(slot, slot + 1);
    return {
      instanceVertexBuffer: groupEntry.range,
      indirectBuffer: this.LG,
      indirectOffset: slot * GpuCullingArgsByteSize,
      deformedVertexOffset
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
  encode(storageBuffer, gpuTimer, morphBuffers = {}) {
    var _a, _b, _c, _d, _e, _f;
    const registry = this.DG;
    const groupCount = registry.groupHighWater;
    const drawCount = registry.drawHighWater;
    if (storageBuffer == null || groupCount === 0) {
      return void 0;
    }
    const viewsChanged = this.uH();
    const positionUpdateVersion = Mesh._primitivePositionUpdateVersion;
    if (positionUpdateVersion !== this.nH) {
      this.nH = positionUpdateVersion;
      this.vH();
    }
    const deformer = this.EG;
    deformer.refresh();
    const needsDeformation = deformer.hasEntries && (this.SG || deformer.isChanged || this.KG !== storageBuffer);
    if (!this.SG && !needsDeformation && this.bH.isEmpty && !viewsChanged && registry.version === this.oH && this.KG === storageBuffer) {
      return void 0;
    }
    this.SG = false;
    this.oH = registry.version;
    const device = this.xG;
    this.TG(this.VG, this.eH, this.bH, RecordWordSize);
    this.TG(this.HG, this.$G, this.PG, GroupByteSize / 4);
    this.TG(this.MG, this.OG, this.RG, ChunkByteSize / 4);
    this.TG(this.YG, this.aH, this.QG, 1);
    this.TG(this.LG, this.fH, this.gH, ArgsWordSize);
    const chunkCount = registry.chunkHighWater;
    const chunksPerRow = Math.max(1, Math.min(chunkCount, MaxWorkgroupsPerDimension));
    const params = this.sH;
    params[0] = groupCount;
    params[1] = drawCount;
    params[2] = chunkCount;
    params[3] = chunksPerRow;
    device.queue.writeBuffer(this.FG, 0, params);
    const passes = this.UG;
    if (passes.cull.bindGroup == null || this.KG !== storageBuffer || this.iH !== deformer.boundsBuffer) {
      passes.cull.bindGroup = this.cH(passes.cull, [
        storageBuffer,
        this.FG,
        this.VG,
        this.HG,
        this.GG,
        this.MG,
        this._G,
        this.NG,
        deformer.boundsBuffer
      ]);
      this.KG = storageBuffer;
      this.iH = deformer.boundsBuffer;
    }
    (_b = (_a = passes.prefix).bindGroup) != null ? _b : _a.bindGroup = this.cH(passes.prefix, [
      this.FG,
      this.HG,
      this.NG,
      this.ZG,
      this.XG
    ]);
    (_d = (_c = passes.scatter).bindGroup) != null ? _d : _c.bindGroup = this.cH(passes.scatter, [
      this.FG,
      this.HG,
      this.MG,
      this.NG,
      this.ZG,
      this._G,
      this.WG
    ]);
    (_f = (_e = passes.finalize).bindGroup) != null ? _f : _e.bindGroup = this.cH(passes.finalize, [
      this.FG,
      this.XG,
      this.YG,
      this.LG
    ]);
    const encoder = device.createCommandEncoder({ label: "GpuCulling" });
    if (needsDeformation) {
      deformer.encode(encoder, storageBuffer, morphBuffers, gpuTimer);
    }
    const passDescriptor = { label: "GpuCulling" };
    const timestampWrites = gpuTimer == null ? void 0 : gpuTimer.getTimestampWrites("GpuCulling");
    if (timestampWrites != null) {
      passDescriptor.timestampWrites = timestampWrites;
    }
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
  cH(stage, buffers) {
    return this.xG.createBindGroup({
      label: stage.pipeline.label,
      layout: stage.layout,
      entries: buffers.map((buffer, binding) => ({ binding, resource: { buffer } }))
    });
  }
  /**
   * Call after the frame's commands were submitted. Releases the allocations of the dropped bundles, and grows the
   * tables when an allocation failed.
   *
   * @returns True when the tables were recreated: every render bundle recorded before must be dropped
   */
  afterSubmit() {
    const registry = this.DG;
    const released = registry.releaseRetired();
    if (released !== void 0) {
      const groups = this.$G;
      for (const group of released.groups) {
        groups[group.index * 4 + 1] = 0;
        this.PG.add(group.index, group.index + 1);
        const chunks = this.OG;
        for (let k = 0; k < group.chunkCount; k++) {
          chunks[(group.chunkBase + k) * 2] = InvalidGroup;
          chunks[(group.chunkBase + k) * 2 + 1] = 0;
        }
        this.RG.add(group.chunkBase, group.chunkBase + group.chunkCount);
        const groupEntry = this.JG[group.index];
        if ((groupEntry == null ? void 0 : groupEntry.group) === group) {
          if (groupEntry.deform !== void 0) {
            this.EG.release(groupEntry.deform);
          }
          this.JG[group.index] = void 0;
        }
      }
      const drawGroups = this.aH;
      for (const draw of released.draws) {
        drawGroups[draw] = InvalidGroup;
        this.QG.add(draw, draw + 1);
      }
    }
    const deformer = this.EG;
    const cullingCapacities = this.wH();
    const deformCapacities = deformer.getGrownCapacities();
    if (cullingCapacities === void 0 && deformCapacities === void 0 && !deformer.isResetRequested) {
      return false;
    }
    const capacities = cullingCapacities != null ? cullingCapacities : { ...registry.capacities };
    this.rH();
    this.pH(capacities);
    registry.reset(capacities);
    deformer.reset(deformCapacities != null ? deformCapacities : { ...deformer.capacities });
    this.JG.length = 0;
    this.SG = true;
    return true;
  }
  /**
   * The capacities the culling tables must grow to after an allocation failed, or undefined when they did not
   * overflow or cannot grow (the device limits are reached).
   */
  wH() {
    const registry = this.DG;
    if (!registry.isOverflowed) {
      return void 0;
    }
    const required = registry.requiredCapacities;
    const current = registry.capacities;
    const limits = this.xG.limits;
    const maxBytes = Math.min(limits.maxStorageBufferBindingSize, limits.maxBufferSize);
    const grow = (capacity, needed, bytesPerSlot) => {
      let next = capacity;
      while (next < needed * 1.25) {
        next *= 2;
      }
      return Math.max(capacity, Math.min(next, Math.floor(maxBytes / bytesPerSlot)));
    };
    const capacities = {
      instances: grow(current.instances, required.instances, RecordByteSize),
      groups: grow(current.groups, required.groups, GroupByteSize),
      draws: grow(current.draws, required.draws, GpuCullingArgsByteSize),
      chunks: grow(current.chunks, required.chunks, ChunkByteSize)
    };
    if (capacities.instances === current.instances && capacities.groups === current.groups && capacities.draws === current.draws && capacities.chunks === current.chunks) {
      return void 0;
    }
    return capacities;
  }
  /**
   * Releases the GPU resources.
   */
  destroy() {
    var _a;
    this.rH();
    this.EG.destroy();
    this.FG.destroy();
    (_a = this.GG) == null ? void 0 : _a.destroy();
    this.GG = void 0;
  }
  pH(capacities) {
    const device = this.xG;
    const usage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;
    this.VG = device.createBuffer({
      label: "GpuCulling.records",
      size: capacities.instances * RecordByteSize,
      usage
    });
    this.HG = device.createBuffer({
      label: "GpuCulling.groups",
      size: capacities.groups * GroupByteSize,
      usage
    });
    this.XG = device.createBuffer({
      label: "GpuCulling.visibleCounts",
      size: capacities.groups * 4,
      usage: GPUBufferUsage.STORAGE
    });
    this.YG = device.createBuffer({
      label: "GpuCulling.drawGroups",
      size: capacities.draws * 4,
      usage
    });
    this.WG = device.createBuffer({
      label: "GpuCulling.visibleIds",
      size: capacities.instances * InstanceByteSize,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE
    });
    this.MG = device.createBuffer({
      label: "GpuCulling.chunks",
      size: capacities.chunks * ChunkByteSize,
      usage
    });
    this.NG = device.createBuffer({
      label: "GpuCulling.chunkCounts",
      size: capacities.chunks * 4,
      usage: GPUBufferUsage.STORAGE
    });
    this.ZG = device.createBuffer({
      label: "GpuCulling.chunkOffsets",
      size: capacities.chunks * 4,
      usage: GPUBufferUsage.STORAGE
    });
    this._G = device.createBuffer({
      label: "GpuCulling.scratchIds",
      size: capacities.instances * InstanceByteSize,
      usage: GPUBufferUsage.STORAGE
    });
    this.LG = device.createBuffer({
      label: "GpuCulling.args",
      size: capacities.draws * GpuCullingArgsByteSize,
      // COPY_SRC lets tests and tools read back the culled instance counts.
      usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
    });
    this.dH = new ArrayBuffer(capacities.instances * RecordByteSize);
    this.eH = new Uint32Array(this.dH);
    this.jH = new Float32Array(this.dH);
    this.$G = new Uint32Array(capacities.groups * 4);
    this.aH = new Uint32Array(capacities.draws).fill(InvalidGroup);
    this.fH = new Uint32Array(capacities.draws * ArgsWordSize);
    this.OG = new Uint32Array(capacities.chunks * 2);
    for (let i = 0; i < capacities.chunks; i++) {
      this.OG[i * 2] = InvalidGroup;
    }
    this.bH.clear();
    this.PG.clear();
    this.PG.add(0, capacities.groups);
    this.QG.clear();
    this.QG.add(0, capacities.draws);
    this.gH.clear();
    this.RG.clear();
    this.RG.add(0, capacities.chunks);
    this.xH();
  }
  xH() {
    const passes = this.UG;
    passes.cull.bindGroup = void 0;
    passes.prefix.bindGroup = void 0;
    passes.scatter.bindGroup = void 0;
    passes.finalize.bindGroup = void 0;
    this.KG = void 0;
  }
  rH() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    (_a = this.VG) == null ? void 0 : _a.destroy();
    (_b = this.HG) == null ? void 0 : _b.destroy();
    (_c = this.XG) == null ? void 0 : _c.destroy();
    (_d = this.YG) == null ? void 0 : _d.destroy();
    (_e = this.WG) == null ? void 0 : _e.destroy();
    (_f = this.LG) == null ? void 0 : _f.destroy();
    (_g = this.MG) == null ? void 0 : _g.destroy();
    (_h = this.NG) == null ? void 0 : _h.destroy();
    (_i = this.ZG) == null ? void 0 : _i.destroy();
    (_j = this._G) == null ? void 0 : _j.destroy();
  }
  TG(buffer, mirror, dirty, wordsPerSlot) {
    if (dirty.isEmpty) {
      return;
    }
    const begin = dirty.min * wordsPerSlot;
    const end = Math.min(dirty.max * wordsPerSlot, mirror.length);
    this.xG.queue.writeBuffer(buffer, begin * 4, mirror, begin, end - begin);
    dirty.clear();
  }
  /**
   * Rewrites the records of the groups whose mesh vertex positions were updated after the records were written
   * (the local AABB changed while the render bundles stayed valid).
   */
  vH() {
    const entries = this.JG;
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry === void 0 || entry.mesh.primitivePositionUpdateCount === entry.positionUpdateCount) {
        continue;
      }
      entry.positionUpdateCount = entry.mesh.primitivePositionUpdateCount;
      this.qH(entry.engine, entry.mesh, entry.group, entry.entityInfo, entry.deform);
    }
  }
  /**
   * Writes the group table entry and the per-instance records of a group.
   * The records of a deformed group point to the deformed vertices (instance ids w) and bounding box of each instance.
   */
  qH(engine, mesh, group, entityInfo, deform) {
    var _a, _b, _c, _d, _e;
    const groups = this.$G;
    const g = group.index * 4;
    groups[g] = group.rangeBase;
    groups[g + 1] = group.instanceCount;
    groups[g + 2] = group.viewIndex;
    groups[g + 3] = group.chunkBase;
    this.PG.add(group.index, group.index + 1);
    const chunks = this.OG;
    for (let k = 0; k < group.chunkCount; k++) {
      chunks[(group.chunkBase + k) * 2] = group.index;
      chunks[(group.chunkBase + k) * 2 + 1] = k * GpuCullingChunkSize;
    }
    this.RG.add(group.chunkBase, group.chunkBase + group.chunkCount);
    const countPerBufferView = (_a = Component.getComponentCountPerBufferView(engine).get(SceneGraphComponent)) != null ? _a : 1;
    const worldMatrixOffsets = Component.getLocationOffsetOfMemberOfComponent(
      engine,
      SceneGraphComponent,
      "worldMatrix"
    );
    const isVisibleOffsets = Component.getLocationOffsetOfMemberOfComponent(engine, SceneGraphComponent, "isVisible");
    const isBillboardOffsets = Component.getLocationOffsetOfMemberOfComponent(
      engine,
      SceneGraphComponent,
      "isBillboard"
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
    const u32 = this.eH;
    const f32 = this.jH;
    const entities = mesh.meshEntitiesInner;
    const deformer = this.EG;
    for (let i = 0; i < group.instanceCount; i++) {
      const r = (group.rangeBase + i) * RecordWordSize;
      const sid = entityInfo[4 * i];
      const bufferViewIndex = Math.floor(sid / countPerBufferView);
      const indexInBufferView = sid % countPerBufferView;
      u32[r] = sid;
      u32[r + 1] = entityInfo[4 * i + 1];
      u32[r + 2] = entityInfo[4 * i + 2];
      u32[r + 3] = deform !== void 0 ? deformer.getInstanceDeformedBase(deform, i) + 1 : entityInfo[4 * i + 3];
      f32[r + 4] = cx;
      f32[r + 5] = cy;
      f32[r + 6] = cz;
      u32[r + 7] = ((_b = worldMatrixOffsets[bufferViewIndex]) != null ? _b : 0) + 4 * indexInBufferView;
      f32[r + 8] = ex;
      f32[r + 9] = ey;
      f32[r + 10] = ez;
      u32[r + 11] = ((_c = isVisibleOffsets[bufferViewIndex]) != null ? _c : 0) * 4 + indexInBufferView;
      u32[r + 12] = ((_d = isBillboardOffsets[bufferViewIndex]) != null ? _d : 0) * 4 + indexInBufferView;
      const isBackgroundAsset = ((_e = entities[i]) == null ? void 0 : _e.getTagValue("type")) === "background-assets";
      if (deform !== void 0) {
        u32[r + 13] = FlagDeformed | (isBackgroundAsset ? FlagAlwaysVisible : 0);
        u32[r + 14] = deformer.getInstanceBoundsSlot(deform, i);
      } else {
        u32[r + 13] = !isAabbValid || isBackgroundAsset ? FlagAlwaysVisible : 0;
        u32[r + 14] = 0;
      }
      u32[r + 15] = 0;
    }
    this.bH.add(group.rangeBase, group.rangeBase + group.instanceCount);
  }
  tH(engine, cameraSID) {
    if (cameraSID < 0) {
      return -1;
    }
    const camera = engine.componentRepository.getComponent(CameraComponent, cameraSID);
    if (camera == null) {
      return -1;
    }
    let viewIndex = this.mH.get(camera);
    if (viewIndex === void 0) {
      viewIndex = this.hH.length;
      this.hH.push({ camera });
      this.mH.set(camera, viewIndex);
    }
    return viewIndex;
  }
  /**
   * Computes the frusta of the views from their cameras and uploads them when they changed.
   * @returns True when a view changed
   */
  uH() {
    var _a;
    const views = this.hH;
    const viewCount = views.length;
    if (viewCount === 0) {
      return false;
    }
    let resized = false;
    if (this.GG == null || this.IG < viewCount) {
      (_a = this.GG) == null ? void 0 : _a.destroy();
      this.IG = Math.max(8, this.IG * 2, viewCount);
      this.GG = this.xG.createBuffer({
        label: "GpuCulling.views",
        size: this.IG * ViewByteSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
      });
      this.kH = new Float32Array(this.IG * ViewWordSize);
      this.lH = new Float32Array(this.IG * ViewWordSize);
      this.UG.cull.bindGroup = void 0;
      resized = true;
    }
    const data = this.kH;
    for (let v = 0; v < viewCount; v++) {
      const camera = views[v].camera;
      const base = v * ViewWordSize;
      if (!camera._isAlive) {
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
    const uploaded = this.lH;
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
      this.xG.queue.writeBuffer(this.GG, 0, data, 0, usedLength);
      uploaded.set(data.subarray(0, usedLength));
    }
    return changed;
  }
};
export {
  GpuCullingArgsByteSize,
  WebGpuGpuCulling
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vc3JjL3dlYmdwdS9XZWJHcHVHcHVDdWxsaW5nLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBDYW1lcmFDb21wb25lbnQgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvbXBvbmVudHMvQ2FtZXJhL0NhbWVyYUNvbXBvbmVudCc7XG5pbXBvcnQgeyBTY2VuZUdyYXBoQ29tcG9uZW50IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9jb21wb25lbnRzL1NjZW5lR3JhcGgvU2NlbmVHcmFwaENvbXBvbmVudCc7XG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvcmUvQ29tcG9uZW50JztcbmltcG9ydCB7IE1lc2ggfSBmcm9tICcuLi9mb3VuZGF0aW9uL2dlb21ldHJ5L01lc2gnO1xuaW1wb3J0IHR5cGUgeyBQcmltaXRpdmUgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2dlb21ldHJ5L1ByaW1pdGl2ZSc7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgeyBEaXJ0eVJhbmdlIH0gZnJvbSAnLi9EaXJ0eVJhbmdlJztcbmltcG9ydCB7XG4gIHR5cGUgR3B1Q3VsbGluZ0NhcGFjaXRpZXMsXG4gIEdwdUN1bGxpbmdDaHVua1NpemUsXG4gIHR5cGUgR3B1Q3VsbGluZ0dyb3VwLFxuICBHcHVDdWxsaW5nUmVnaXN0cnksXG59IGZyb20gJy4vR3B1Q3VsbGluZ1JlZ2lzdHJ5JztcbmltcG9ydCB0eXBlIHsgR3B1RGVmb3JtRW50cnkgfSBmcm9tICcuL0dwdURlZm9ybVJlZ2lzdHJ5JztcbmltcG9ydCB0eXBlIHsgV2ViR3B1R3B1VGltZXIgfSBmcm9tICcuL1dlYkdwdUdwdVRpbWVyJztcbmltcG9ydCB7IHR5cGUgR3B1RGVmb3JtTW9ycGhCdWZmZXJzLCBXZWJHcHVWZXJ0ZXhEZWZvcm1lciB9IGZyb20gJy4vV2ViR3B1VmVydGV4RGVmb3JtZXInO1xuXG4vKipcbiAqIFRoZSBXR1NMIHNoYXJlZCBieSB0aGUgY3VsbGluZyBwYXNzZXMuXG4gKlxuICogVGhlIGluc3RhbmNlcyBvZiBhIGN1bGwgZ3JvdXAgYXJlIHByb2Nlc3NlZCBpbiBjaHVua3Mgb2YgNjQgY29uc2VjdXRpdmUgaW5zdGFuY2VzIChHcHVDdWxsaW5nQ2h1bmtTaXplKSwgb25lXG4gKiB3b3JrZ3JvdXAgcGVyIGNodW5rLCBzbyB0aGF0IGEgbWVzaCB3aXRoIG1hbnkgaW5zdGFuY2VzIGlzIGN1bGxlZCBpbiBwYXJhbGxlbDpcbiAqIDEuIGBjdWxsQ2h1bmtzYDogZWFjaCBjaHVuayB0ZXN0cyBpdHMgaW5zdGFuY2VzIGFuZCBjb21wYWN0cyB0aGUgdmlzaWJsZSBvbmVzIHRvIHRoZSBmcm9udCBvZiBpdHMgb3duIHNsb3RzIG9mXG4gKiAgICBgc2NyYXRjaElkc2Agd2l0aCBhIHdvcmtncm91cCBwcmVmaXggc3VtLCBhbmQgd3JpdGVzIGl0cyB2aXNpYmxlIGNvdW50IHRvIGBjaHVua0NvdW50c2AuXG4gKiAyLiBgcHJlZml4R3JvdXBzYDogb25lIGludm9jYXRpb24gcGVyIGdyb3VwIHN1bXMgdGhlIGNvdW50cyBvZiBpdHMgY2h1bmtzIGluIG9yZGVyLCB3cml0aW5nIHRoZSBvdXRwdXQgb2Zmc2V0IG9mXG4gKiAgICBlYWNoIGNodW5rIHRvIGBjaHVua09mZnNldHNgIGFuZCB0aGUgdmlzaWJsZSBjb3VudCBvZiB0aGUgZ3JvdXAgdG8gYHZpc2libGVDb3VudHNgLlxuICogMy4gYHNjYXR0ZXJgOiBlYWNoIGNodW5rIGNvcGllcyBpdHMgY29tcGFjdGVkIGluc3RhbmNlcyB0byBgdmlzaWJsZUlkc2AgYXQgdGhlIGdyb3VwJ3MgcmFuZ2UgcGx1cyBpdHMgb2Zmc2V0LlxuICogNC4gYGZpbmFsaXplYDogb25lIGludm9jYXRpb24gcGVyIGluZGlyZWN0IGRyYXcgd3JpdGVzIHRoZSB2aXNpYmxlIGNvdW50IG9mIHRoZSBkcmF3J3MgZ3JvdXAgYXMgaXRzIGluc3RhbmNlIGNvdW50LlxuICpcbiAqIFRoZSBjb21wYWN0aW9uIGtlZXBzIHRoZSBvcmlnaW5hbCBpbnN0YW5jZSBvcmRlciBhbmQgdXNlcyBubyBhdG9taWNzLCBzbyB0aGUgZHJhd2luZyBvcmRlciAoYW5kIGJsZW5kaW5nKSBpc1xuICogZGV0ZXJtaW5pc3RpYy5cbiAqL1xuY29uc3QgY29tbW9uV2dzbCA9IC8qIHdnc2wgKi8gYFxuc3RydWN0IEN1bGxHcm91cCB7XG4gIHJhbmdlQmFzZTogdTMyLCAgICAgLy8gdGhlIGZpcnN0IGluc3RhbmNlIHNsb3Qgb2YgdGhlIGdyb3VwXG4gIGluc3RhbmNlQ291bnQ6IHUzMiwgLy8gdGhlIG51bWJlciBvZiBpbnN0YW5jZXMgKDAgZm9yIGFuIHVudXNlZCBncm91cCBzbG90KVxuICB2aWV3SW5kZXg6IHUzMiwgICAgIC8vIHRoZSB2aWV3IHRoZSBpbnN0YW5jZXMgYXJlIGN1bGxlZCB3aXRoXG4gIGNodW5rQmFzZTogdTMyLCAgICAgLy8gdGhlIGZpcnN0IGNodW5rIHNsb3Qgb2YgdGhlIGdyb3VwXG59XG5cbnN0cnVjdCBQYXJhbXMge1xuICBncm91cENvdW50OiB1MzIsXG4gIGRyYXdDb3VudDogdTMyLFxuICBjaHVua0NvdW50OiB1MzIsXG4gIGNodW5rc1BlclJvdzogdTMyLFxufVxuXG5jb25zdCBDSFVOS19TSVpFOiB1MzIgPSA2NHU7XG5jb25zdCBJTlZBTElEOiB1MzIgPSAweGZmZmZmZmZmdTtcbmA7XG5cbi8qKlxuICogUGFzcyAxOiB0aGUgdmlzaWJpbGl0eSB0ZXN0IGFuZCB0aGUgY29tcGFjdGlvbiB3aXRoaW4gZWFjaCBjaHVuay5cbiAqXG4gKiBUaGUgdmlzaWJpbGl0eSB0ZXN0IGlzIHRoZSBvbmUgb2YgRnJ1c3R1bS5jdWxsaW5nIChDUFUpOiB0aGUgd29ybGQgQUFCQiBpcyBvdXRzaWRlIG9mIGEgZnJ1c3R1bSBwbGFuZSAodGVzdGVkIHdpdGhcbiAqIGl0cyBcInBvc2l0aXZlIHZlcnRleFwiKSwgb3IgYWxsIHRoZSBmcnVzdHVtIGNvcm5lcnMgYXJlIG91dHNpZGUgb2Ygb25lIG9mIGl0cyBmYWNlcy4gVGhlIHdvcmxkIEFBQkIgaXMgY29tcHV0ZWQgZnJvbVxuICogdGhlIGxvY2FsIEFBQkIgb2YgdGhlIG1lc2ggYW5kIHRoZSB3b3JsZCBtYXRyaXggcmVhZCBmcm9tIHRoZSBHUFUgaW5zdGFuY2UgZGF0YSwgc28gdGhlIGN1bGxpbmcgZm9sbG93cyB0aGVcbiAqIHRyYW5zZm9ybXMgdGhhdCB3ZXJlIHVwbG9hZGVkIGZvciB0aGUgZnJhbWUgd2l0aG91dCBhbnkgQ1BVIHdvcmsgcGVyIGluc3RhbmNlLlxuICovXG5jb25zdCBjdWxsQ2h1bmtzV2dzbCA9IC8qIHdnc2wgKi8gYFxuJHtjb21tb25XZ3NsfVxuc3RydWN0IEN1bGxSZWNvcmQge1xuICBpZHM6IHZlYzQ8dTMyPiwgICAgICAgICAgICAgLy8gdGhlIGluc3RhbmNlIHZhcmlhdGlvbiBkYXRhIChzY2VuZUdyYXBoU0lELCBza2VsZXRhbFNJRCwgYmxlbmRTaGFwZVNJRCwgMClcbiAgY2VudGVyOiB2ZWMzPGYzMj4sICAgICAgICAgIC8vIHRoZSBjZW50ZXIgb2YgdGhlIGxvY2FsIEFBQkIgb2YgdGhlIG1lc2hcbiAgd29ybGRNYXRyaXhJbmRleDogdTMyLCAgICAgIC8vIHZlYzQgaW5kZXggb2YgdGhlIHdvcmxkIG1hdHJpeCBvZiB0aGUgaW5zdGFuY2UgaW4gZGF0YVxuICBleHRlbnQ6IHZlYzM8ZjMyPiwgICAgICAgICAgLy8gdGhlIGhhbGYgc2l6ZSBvZiB0aGUgbG9jYWwgQUFCQiBvZiB0aGUgbWVzaFxuICBpc1Zpc2libGVJbmRleDogdTMyLCAgICAgICAgLy8gZmxvYXQgaW5kZXggb2YgdGhlIGlzVmlzaWJsZSBmbGFnIG9mIHRoZSBpbnN0YW5jZSBpbiBkYXRhXG4gIGlzQmlsbGJvYXJkSW5kZXg6IHUzMiwgICAgICAvLyBmbG9hdCBpbmRleCBvZiB0aGUgaXNCaWxsYm9hcmQgZmxhZyBvZiB0aGUgaW5zdGFuY2UgaW4gZGF0YVxuICBmbGFnczogdTMyLCAgICAgICAgICAgICAgICAgLy8gYml0IDA6IGFsd2F5cyB2aXNpYmxlIChub3QgY3VsbGVkKSwgYml0IDE6IGRlZm9ybWVkICh0aGUgQUFCQiBpcyBpbiBib3VuZHMpXG4gIGJvdW5kc1Nsb3Q6IHUzMiwgICAgICAgICAgICAvLyB0aGUgZGVmb3JtZWQgYm91bmRpbmcgYm94IG9mIHRoZSBpbnN0YW5jZSAoV2ViR3B1VmVydGV4RGVmb3JtZXIpXG4gIHBhZDE6IHUzMixcbn1cblxuc3RydWN0IEN1bGxWaWV3IHtcbiAgaGVhZGVyOiB2ZWM0PGYzMj4sICAgICAgICAgICAgIC8vIHg6IDEgaWYgdGhlIHZpZXcgY3VsbHNcbiAgcGxhbmVzOiBhcnJheTx2ZWM0PGYzMj4sIDY+LCAgIC8vIHRvcCwgYm90dG9tLCByaWdodCwgbGVmdCwgbmVhciwgZmFyIChhcyBGcnVzdHVtLmdldFBsYW5lKVxuICBjb3JuZXJzOiBhcnJheTx2ZWM0PGYzMj4sIDg+LCAgLy8gdGhlIGZydXN0dW0gY29ybmVycyBpbiB3b3JsZCBzcGFjZVxufVxuXG5AZ3JvdXAoMCkgQGJpbmRpbmcoMCkgdmFyPHN0b3JhZ2UsIHJlYWQ+IGRhdGE6IGFycmF5PHZlYzQ8ZjMyPj47XG5AZ3JvdXAoMCkgQGJpbmRpbmcoMSkgdmFyPHVuaWZvcm0+IHBhcmFtczogUGFyYW1zO1xuQGdyb3VwKDApIEBiaW5kaW5nKDIpIHZhcjxzdG9yYWdlLCByZWFkPiByZWNvcmRzOiBhcnJheTxDdWxsUmVjb3JkPjtcbkBncm91cCgwKSBAYmluZGluZygzKSB2YXI8c3RvcmFnZSwgcmVhZD4gZ3JvdXBzOiBhcnJheTxDdWxsR3JvdXA+O1xuQGdyb3VwKDApIEBiaW5kaW5nKDQpIHZhcjxzdG9yYWdlLCByZWFkPiB2aWV3czogYXJyYXk8Q3VsbFZpZXc+O1xuLy8gKGdyb3VwIGluZGV4LCBpbmRleCBvZiB0aGUgY2h1bmsncyBmaXJzdCBpbnN0YW5jZSBpbiB0aGUgZ3JvdXApLCBvciAoSU5WQUxJRCwgMCkgZm9yIGFuIHVudXNlZCBjaHVuayBzbG90XG5AZ3JvdXAoMCkgQGJpbmRpbmcoNSkgdmFyPHN0b3JhZ2UsIHJlYWQ+IGNodW5rczogYXJyYXk8dmVjMjx1MzI+PjtcbkBncm91cCgwKSBAYmluZGluZyg2KSB2YXI8c3RvcmFnZSwgcmVhZF93cml0ZT4gc2NyYXRjaElkczogYXJyYXk8dmVjNDx1MzI+PjtcbkBncm91cCgwKSBAYmluZGluZyg3KSB2YXI8c3RvcmFnZSwgcmVhZF93cml0ZT4gY2h1bmtDb3VudHM6IGFycmF5PHUzMj47XG4vLyBUaGUgbG9jYWwgYm91bmRpbmcgYm94ZXMgb2YgdGhlIGRlZm9ybWVkIGluc3RhbmNlcyAoMiB2ZWM0IHBlciBpbnN0YW5jZTogfm1pbi54eXogYW5kIG1heC54eXosIGVuY29kZWQgYnlcbi8vIGVuY29kZU9yZGVyZWRGbG9hdCBpbiBXZWJHcHVWZXJ0ZXhEZWZvcm1lcjsgYWxsIDAgYmVmb3JlIHRoZSBmaXJzdCBkZWZvcm1hdGlvbilcbkBncm91cCgwKSBAYmluZGluZyg4KSB2YXI8c3RvcmFnZSwgcmVhZD4gYm91bmRzOiBhcnJheTx2ZWM0PHUzMj4+O1xuXG5jb25zdCBBTFdBWVNfVklTSUJMRTogdTMyID0gMXU7XG5jb25zdCBERUZPUk1FRDogdTMyID0gMnU7XG5cbmZuIGRlY29kZU9yZGVyZWRGbG9hdChlbmNvZGVkOiB2ZWMzPHUzMj4pIC0+IHZlYzM8ZjMyPiB7XG4gIHJldHVybiBiaXRjYXN0PHZlYzM8ZjMyPj4oc2VsZWN0KH5lbmNvZGVkLCBlbmNvZGVkICYgdmVjMzx1MzI+KDB4N2ZmZmZmZmZ1KSwgKGVuY29kZWQgJiB2ZWMzPHUzMj4oMHg4MDAwMDAwMHUpKSAhPSB2ZWMzPHUzMj4oMHUpKSk7XG59XG5cbnZhcjx3b3JrZ3JvdXA+IHNjYW46IGFycmF5PHUzMiwgNjQ+O1xuXG5mbiBmZXRjaFNjYWxhcihmbG9hdEluZGV4OiB1MzIpIC0+IGYzMiB7XG4gIGxldCB2YWx1ZSA9IGRhdGFbZmxvYXRJbmRleCAvIDR1XTtcbiAgcmV0dXJuIHZhbHVlW2Zsb2F0SW5kZXggJSA0dV07XG59XG5cbmZuIGlzSW5zdGFuY2VWaXNpYmxlKHJlY29yZDogQ3VsbFJlY29yZCwgdmlldzogQ3VsbFZpZXcpIC0+IGJvb2wge1xuICBpZiAoKHJlY29yZC5mbGFncyAmIEFMV0FZU19WSVNJQkxFKSAhPSAwdSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIC8vIFRoZSBzYW1lIHJ1bGUgYXMgdGhlIENQVSBjdWxsaW5nIChTY2VuZUdyYXBoQ29tcG9uZW50LmlzVmlzaWJsZSkgYW5kIHRoZSB2ZXJ0ZXggc2hhZGVycyAoZ2V0X2lzVmlzaWJsZSkuXG4gIGlmIChmZXRjaFNjYWxhcihyZWNvcmQuaXNWaXNpYmxlSW5kZXgpIDw9IDAuNSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAodmlldy5oZWFkZXIueCA8IDAuNSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIC8vIEEgYmlsbGJvYXJkIGlzIHJvdGF0ZWQgdG93YXJkIHRoZSBjYW1lcmEgaW4gdGhlIHZlcnRleCBzaGFkZXIsIHNvIGl0cyB3b3JsZCBBQUJCIGlzIG5vdCBrbm93biBoZXJlLlxuICBpZiAoZmV0Y2hTY2FsYXIocmVjb3JkLmlzQmlsbGJvYXJkSW5kZXgpID4gMC41KSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgdmFyIGxvY2FsQ2VudGVyID0gcmVjb3JkLmNlbnRlcjtcbiAgdmFyIGxvY2FsRXh0ZW50ID0gcmVjb3JkLmV4dGVudDtcbiAgaWYgKChyZWNvcmQuZmxhZ3MgJiBERUZPUk1FRCkgIT0gMHUpIHtcbiAgICBsZXQgZW5jb2RlZE1heCA9IGJvdW5kc1tyZWNvcmQuYm91bmRzU2xvdCAqIDJ1ICsgMXVdO1xuICAgIGlmIChlbmNvZGVkTWF4LnggPT0gMHUpIHtcbiAgICAgIC8vIE5vdCBkZWZvcm1lZCB5ZXQuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgbGV0IGxvY2FsTWluID0gZGVjb2RlT3JkZXJlZEZsb2F0KH5ib3VuZHNbcmVjb3JkLmJvdW5kc1Nsb3QgKiAydV0ueHl6KTtcbiAgICBsZXQgbG9jYWxNYXggPSBkZWNvZGVPcmRlcmVkRmxvYXQoZW5jb2RlZE1heC54eXopO1xuICAgIGxvY2FsQ2VudGVyID0gKGxvY2FsTWluICsgbG9jYWxNYXgpICogMC41O1xuICAgIGxvY2FsRXh0ZW50ID0gKGxvY2FsTWF4IC0gbG9jYWxNaW4pICogMC41O1xuICB9XG4gIGxldCBtID0gbWF0NHg0PGYzMj4oXG4gICAgZGF0YVtyZWNvcmQud29ybGRNYXRyaXhJbmRleF0sXG4gICAgZGF0YVtyZWNvcmQud29ybGRNYXRyaXhJbmRleCArIDF1XSxcbiAgICBkYXRhW3JlY29yZC53b3JsZE1hdHJpeEluZGV4ICsgMnVdLFxuICAgIGRhdGFbcmVjb3JkLndvcmxkTWF0cml4SW5kZXggKyAzdV1cbiAgKTtcbiAgLy8gVGhlIHdvcmxkIEFBQkIgb2YgdGhlIHRyYW5zZm9ybWVkIGxvY2FsIEFBQkIgKHRoZSBzYW1lIGJveCBhcyB0cmFuc2Zvcm1pbmcgaXRzIDggY29ybmVycykuXG4gIGxldCBjZW50ZXIgPSAobSAqIHZlYzQ8ZjMyPihsb2NhbENlbnRlciwgMS4wKSkueHl6O1xuICBsZXQgZXh0ZW50ID0gYWJzKG1bMF0ueHl6KSAqIGxvY2FsRXh0ZW50LnggKyBhYnMobVsxXS54eXopICogbG9jYWxFeHRlbnQueSArIGFicyhtWzJdLnh5eikgKiBsb2NhbEV4dGVudC56O1xuICBsZXQgbWluUG9pbnQgPSBjZW50ZXIgLSBleHRlbnQ7XG4gIGxldCBtYXhQb2ludCA9IGNlbnRlciArIGV4dGVudDtcblxuICAvLyBUaGUgYm94IGlzIGNvbXBsZXRlbHkgb3V0c2lkZSBvZiBhIHBsYW5lIGV4YWN0bHkgd2hlbiBpdHMgY29ybmVyIGZhcnRoZXN0IGFsb25nIHRoZSBwbGFuZSBub3JtYWwgaXMuXG4gIGZvciAodmFyIGkgPSAwdTsgaSA8IDZ1OyBpID0gaSArIDF1KSB7XG4gICAgbGV0IHBsYW5lID0gdmlldy5wbGFuZXNbaV07XG4gICAgbGV0IGZhcnRoZXN0ID0gc2VsZWN0KG1pblBvaW50LCBtYXhQb2ludCwgcGxhbmUueHl6ID49IHZlYzM8ZjMyPigwLjApKTtcbiAgICBpZiAoZG90KHBsYW5lLnh5eiwgZmFydGhlc3QpICsgcGxhbmUudyA8IDAuMCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8vIFRoZSBmcnVzdHVtIGlzIGNvbXBsZXRlbHkgb3V0c2lkZSBvZiBvbmUgb2YgdGhlIGJveCBmYWNlcy5cbiAgdmFyIG91dE1heCA9IHZlYzM8dTMyPigwdSk7XG4gIHZhciBvdXRNaW4gPSB2ZWMzPHUzMj4oMHUpO1xuICBmb3IgKHZhciBpID0gMHU7IGkgPCA4dTsgaSA9IGkgKyAxdSkge1xuICAgIGxldCBjb3JuZXIgPSB2aWV3LmNvcm5lcnNbaV0ueHl6O1xuICAgIG91dE1heCA9IG91dE1heCArIHNlbGVjdCh2ZWMzPHUzMj4oMHUpLCB2ZWMzPHUzMj4oMXUpLCBjb3JuZXIgPiBtYXhQb2ludCk7XG4gICAgb3V0TWluID0gb3V0TWluICsgc2VsZWN0KHZlYzM8dTMyPigwdSksIHZlYzM8dTMyPigxdSksIGNvcm5lciA8IG1pblBvaW50KTtcbiAgfVxuICBpZiAoYW55KG91dE1heCA9PSB2ZWMzPHUzMj4oOHUpKSB8fCBhbnkob3V0TWluID09IHZlYzM8dTMyPig4dSkpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5AY29tcHV0ZSBAd29ya2dyb3VwX3NpemUoNjQpXG5mbiBjdWxsQ2h1bmtzKEBidWlsdGluKHdvcmtncm91cF9pZCkgd29ya2dyb3VwSWQ6IHZlYzM8dTMyPiwgQGJ1aWx0aW4obG9jYWxfaW52b2NhdGlvbl9pbmRleCkgbGlkOiB1MzIpIHtcbiAgLy8gYyBpcyB1bmlmb3JtIGluIHRoZSB3b3JrZ3JvdXAsIHNvIHRoaXMgcmV0dXJuIGtlZXBzIHRoZSBiYXJyaWVycyBiZWxvdyBpbiB1bmlmb3JtIGNvbnRyb2wgZmxvdy5cbiAgbGV0IGMgPSB3b3JrZ3JvdXBJZC55ICogcGFyYW1zLmNodW5rc1BlclJvdyArIHdvcmtncm91cElkLng7XG4gIGlmIChjID49IHBhcmFtcy5jaHVua0NvdW50KSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGxldCBjaHVuayA9IGNodW5rc1tjXTtcbiAgdmFyIHZpc2libGUgPSAwdTtcbiAgdmFyIGlkcyA9IHZlYzQ8dTMyPigwdSk7XG4gIHZhciBjaHVua1Nsb3RCYXNlID0gMHU7XG4gIGlmIChjaHVuay54ICE9IElOVkFMSUQpIHtcbiAgICBsZXQgZ3JvdXAgPSBncm91cHNbY2h1bmsueF07XG4gICAgY2h1bmtTbG90QmFzZSA9IGdyb3VwLnJhbmdlQmFzZSArIGNodW5rLnk7XG4gICAgaWYgKGNodW5rLnkgKyBsaWQgPCBncm91cC5pbnN0YW5jZUNvdW50KSB7XG4gICAgICBsZXQgcmVjb3JkID0gcmVjb3Jkc1tjaHVua1Nsb3RCYXNlICsgbGlkXTtcbiAgICAgIGlkcyA9IHJlY29yZC5pZHM7XG4gICAgICBpZiAoaXNJbnN0YW5jZVZpc2libGUocmVjb3JkLCB2aWV3c1tncm91cC52aWV3SW5kZXhdKSkge1xuICAgICAgICB2aXNpYmxlID0gMXU7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8vIEluY2x1c2l2ZSBwcmVmaXggc3VtIG9mIHRoZSB2aXNpYmlsaXR5IChIaWxsaXMtU3RlZWxlKS5cbiAgc2NhbltsaWRdID0gdmlzaWJsZTtcbiAgd29ya2dyb3VwQmFycmllcigpO1xuICBmb3IgKHZhciBvZmZzZXQgPSAxdTsgb2Zmc2V0IDwgQ0hVTktfU0laRTsgb2Zmc2V0ID0gb2Zmc2V0IDw8IDF1KSB7XG4gICAgdmFyIGFkZGVuZCA9IDB1O1xuICAgIGlmIChsaWQgPj0gb2Zmc2V0KSB7XG4gICAgICBhZGRlbmQgPSBzY2FuW2xpZCAtIG9mZnNldF07XG4gICAgfVxuICAgIHdvcmtncm91cEJhcnJpZXIoKTtcbiAgICBzY2FuW2xpZF0gPSBzY2FuW2xpZF0gKyBhZGRlbmQ7XG4gICAgd29ya2dyb3VwQmFycmllcigpO1xuICB9XG4gIGlmICh2aXNpYmxlID09IDF1KSB7XG4gICAgc2NyYXRjaElkc1tjaHVua1Nsb3RCYXNlICsgc2NhbltsaWRdIC0gMXVdID0gaWRzO1xuICB9XG4gIGlmIChsaWQgPT0gQ0hVTktfU0laRSAtIDF1KSB7XG4gICAgY2h1bmtDb3VudHNbY10gPSBzY2FuW2xpZF07XG4gIH1cbn1cbmA7XG5cbi8qKiBQYXNzIDI6IHRoZSBvdXRwdXQgb2Zmc2V0IG9mIGVhY2ggY2h1bmsgYW5kIHRoZSB2aXNpYmxlIGNvdW50IG9mIGVhY2ggZ3JvdXAuICovXG5jb25zdCBwcmVmaXhHcm91cHNXZ3NsID0gLyogd2dzbCAqLyBgXG4ke2NvbW1vbldnc2x9XG5AZ3JvdXAoMCkgQGJpbmRpbmcoMCkgdmFyPHVuaWZvcm0+IHBhcmFtczogUGFyYW1zO1xuQGdyb3VwKDApIEBiaW5kaW5nKDEpIHZhcjxzdG9yYWdlLCByZWFkPiBncm91cHM6IGFycmF5PEN1bGxHcm91cD47XG5AZ3JvdXAoMCkgQGJpbmRpbmcoMikgdmFyPHN0b3JhZ2UsIHJlYWQ+IGNodW5rQ291bnRzOiBhcnJheTx1MzI+O1xuQGdyb3VwKDApIEBiaW5kaW5nKDMpIHZhcjxzdG9yYWdlLCByZWFkX3dyaXRlPiBjaHVua09mZnNldHM6IGFycmF5PHUzMj47XG5AZ3JvdXAoMCkgQGJpbmRpbmcoNCkgdmFyPHN0b3JhZ2UsIHJlYWRfd3JpdGU+IHZpc2libGVDb3VudHM6IGFycmF5PHUzMj47XG5cbkBjb21wdXRlIEB3b3JrZ3JvdXBfc2l6ZSg2NClcbmZuIHByZWZpeEdyb3VwcyhAYnVpbHRpbihnbG9iYWxfaW52b2NhdGlvbl9pZCkgaWQ6IHZlYzM8dTMyPikge1xuICBsZXQgZyA9IGlkLng7XG4gIGlmIChnID49IHBhcmFtcy5ncm91cENvdW50KSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGxldCBncm91cCA9IGdyb3Vwc1tnXTtcbiAgbGV0IGNodW5rQ291bnQgPSAoZ3JvdXAuaW5zdGFuY2VDb3VudCArIENIVU5LX1NJWkUgLSAxdSkgLyBDSFVOS19TSVpFO1xuICB2YXIgc3VtID0gMHU7XG4gIGZvciAodmFyIGsgPSAwdTsgayA8IGNodW5rQ291bnQ7IGsgPSBrICsgMXUpIHtcbiAgICBjaHVua09mZnNldHNbZ3JvdXAuY2h1bmtCYXNlICsga10gPSBzdW07XG4gICAgc3VtID0gc3VtICsgY2h1bmtDb3VudHNbZ3JvdXAuY2h1bmtCYXNlICsga107XG4gIH1cbiAgdmlzaWJsZUNvdW50c1tnXSA9IHN1bTtcbn1cbmA7XG5cbi8qKiBQYXNzIDM6IHRoZSBjb3B5IG9mIHRoZSBjb21wYWN0ZWQgaW5zdGFuY2VzIG9mIGVhY2ggY2h1bmsgdG8gdGhlIHZpc2libGUgaW5zdGFuY2UgYnVmZmVyLiAqL1xuY29uc3Qgc2NhdHRlcldnc2wgPSAvKiB3Z3NsICovIGBcbiR7Y29tbW9uV2dzbH1cbkBncm91cCgwKSBAYmluZGluZygwKSB2YXI8dW5pZm9ybT4gcGFyYW1zOiBQYXJhbXM7XG5AZ3JvdXAoMCkgQGJpbmRpbmcoMSkgdmFyPHN0b3JhZ2UsIHJlYWQ+IGdyb3VwczogYXJyYXk8Q3VsbEdyb3VwPjtcbkBncm91cCgwKSBAYmluZGluZygyKSB2YXI8c3RvcmFnZSwgcmVhZD4gY2h1bmtzOiBhcnJheTx2ZWMyPHUzMj4+O1xuQGdyb3VwKDApIEBiaW5kaW5nKDMpIHZhcjxzdG9yYWdlLCByZWFkPiBjaHVua0NvdW50czogYXJyYXk8dTMyPjtcbkBncm91cCgwKSBAYmluZGluZyg0KSB2YXI8c3RvcmFnZSwgcmVhZD4gY2h1bmtPZmZzZXRzOiBhcnJheTx1MzI+O1xuQGdyb3VwKDApIEBiaW5kaW5nKDUpIHZhcjxzdG9yYWdlLCByZWFkPiBzY3JhdGNoSWRzOiBhcnJheTx2ZWM0PHUzMj4+O1xuQGdyb3VwKDApIEBiaW5kaW5nKDYpIHZhcjxzdG9yYWdlLCByZWFkX3dyaXRlPiB2aXNpYmxlSWRzOiBhcnJheTx2ZWM0PHUzMj4+O1xuXG5AY29tcHV0ZSBAd29ya2dyb3VwX3NpemUoNjQpXG5mbiBzY2F0dGVyKEBidWlsdGluKHdvcmtncm91cF9pZCkgd29ya2dyb3VwSWQ6IHZlYzM8dTMyPiwgQGJ1aWx0aW4obG9jYWxfaW52b2NhdGlvbl9pbmRleCkgbGlkOiB1MzIpIHtcbiAgbGV0IGMgPSB3b3JrZ3JvdXBJZC55ICogcGFyYW1zLmNodW5rc1BlclJvdyArIHdvcmtncm91cElkLng7XG4gIGlmIChjID49IHBhcmFtcy5jaHVua0NvdW50KSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGxldCBjaHVuayA9IGNodW5rc1tjXTtcbiAgaWYgKGNodW5rLnggPT0gSU5WQUxJRCB8fCBsaWQgPj0gY2h1bmtDb3VudHNbY10pIHtcbiAgICByZXR1cm47XG4gIH1cbiAgbGV0IHJhbmdlQmFzZSA9IGdyb3Vwc1tjaHVuay54XS5yYW5nZUJhc2U7XG4gIHZpc2libGVJZHNbcmFuZ2VCYXNlICsgY2h1bmtPZmZzZXRzW2NdICsgbGlkXSA9IHNjcmF0Y2hJZHNbcmFuZ2VCYXNlICsgY2h1bmsueSArIGxpZF07XG59XG5gO1xuXG4vKipcbiAqIFBhc3MgNDogdGhlIGluc3RhbmNlIGNvdW50IG9mIGVhY2ggaW5kaXJlY3QgZHJhdywgdGhlIHZpc2libGUgY291bnQgb2YgdGhlIGRyYXcncyBncm91cC5cbiAqIFNldmVyYWwgZHJhd3Mgc2hhcmUgYSBncm91cCAodGhlIHByaW1pdGl2ZXMgb2YgYSBtZXNoIGFuZCB0aGUgZGVwdGggcHJlcGFzcykuXG4gKi9cbmNvbnN0IGZpbmFsaXplV2dzbCA9IC8qIHdnc2wgKi8gYFxuJHtjb21tb25XZ3NsfVxuQGdyb3VwKDApIEBiaW5kaW5nKDApIHZhcjx1bmlmb3JtPiBwYXJhbXM6IFBhcmFtcztcbkBncm91cCgwKSBAYmluZGluZygxKSB2YXI8c3RvcmFnZSwgcmVhZD4gdmlzaWJsZUNvdW50czogYXJyYXk8dTMyPjtcbkBncm91cCgwKSBAYmluZGluZygyKSB2YXI8c3RvcmFnZSwgcmVhZD4gZHJhd0dyb3VwczogYXJyYXk8dTMyPjtcbkBncm91cCgwKSBAYmluZGluZygzKSB2YXI8c3RvcmFnZSwgcmVhZF93cml0ZT4gYXJnczogYXJyYXk8dTMyPjtcblxuQGNvbXB1dGUgQHdvcmtncm91cF9zaXplKDY0KVxuZm4gZmluYWxpemUoQGJ1aWx0aW4oZ2xvYmFsX2ludm9jYXRpb25faWQpIGlkOiB2ZWMzPHUzMj4pIHtcbiAgbGV0IGQgPSBpZC54O1xuICBpZiAoZCA+PSBwYXJhbXMuZHJhd0NvdW50KSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGxldCBnID0gZHJhd0dyb3Vwc1tkXTtcbiAgdmFyIGNvdW50ID0gMHU7XG4gIGlmIChnICE9IElOVkFMSUQpIHtcbiAgICBjb3VudCA9IHZpc2libGVDb3VudHNbZ107XG4gIH1cbiAgLy8gVGhlIGluZGlyZWN0IGFyZ3VtZW50cyBhcmUgW2luZGV4Q291bnQgb3IgdmVydGV4Q291bnQsIGluc3RhbmNlQ291bnQsIC4uLl0uXG4gIGFyZ3NbZCAqIDV1ICsgMXVdID0gY291bnQ7XG59XG5gO1xuXG5jb25zdCBXb3JrZ3JvdXBTaXplID0gNjQ7XG5jb25zdCBNYXhXb3JrZ3JvdXBzUGVyRGltZW5zaW9uID0gNjU1MzU7XG4vKiogVGhlIGJ5dGUgc2l6ZSBvZiBhIEN1bGxSZWNvcmQuICovXG5jb25zdCBSZWNvcmRCeXRlU2l6ZSA9IDY0O1xuY29uc3QgUmVjb3JkV29yZFNpemUgPSBSZWNvcmRCeXRlU2l6ZSAvIDQ7XG4vKiogVGhlIGJ5dGUgc2l6ZSBvZiBhIEN1bGxHcm91cC4gKi9cbmNvbnN0IEdyb3VwQnl0ZVNpemUgPSAxNjtcbi8qKiBUaGUgYnl0ZSBzaXplIG9mIGEgQ3VsbFZpZXcgKDEgaGVhZGVyICsgNiBwbGFuZXMgKyA4IGNvcm5lcnMpLiAqL1xuY29uc3QgVmlld1dvcmRTaXplID0gMTUgKiA0O1xuY29uc3QgVmlld0J5dGVTaXplID0gVmlld1dvcmRTaXplICogNDtcbi8qKiBUaGUgYnl0ZSBzaXplIG9mIHRoZSBpbmRpcmVjdCBhcmd1bWVudHMgb2YgYSBkcmF3IChkcmF3SW5kZXhlZEluZGlyZWN0IHVzZXMgNSB1MzIsIGRyYXdJbmRpcmVjdCA0IHUzMikuICovXG5leHBvcnQgY29uc3QgR3B1Q3VsbGluZ0FyZ3NCeXRlU2l6ZSA9IDIwO1xuY29uc3QgQXJnc1dvcmRTaXplID0gR3B1Q3VsbGluZ0FyZ3NCeXRlU2l6ZSAvIDQ7XG4vKiogVGhlIGJ5dGUgc2l6ZSBvZiBhIHZpc2libGUgaW5zdGFuY2UgKHRoZSBpbnN0YW5jZSB2YXJpYXRpb24gZGF0YSwgdWludDMyeDQpLiAqL1xuY29uc3QgSW5zdGFuY2VCeXRlU2l6ZSA9IDE2O1xuY29uc3QgUGFyYW1zQnl0ZVNpemUgPSAxNjtcbmNvbnN0IEludmFsaWRHcm91cCA9IDB4ZmZmZmZmZmY7XG5jb25zdCBGbGFnQWx3YXlzVmlzaWJsZSA9IDE7XG5jb25zdCBGbGFnRGVmb3JtZWQgPSAyO1xuXG4vKiogVGhlIGJ5dGUgc2l6ZSBvZiBhIGNodW5rIHRhYmxlIGVudHJ5IChncm91cCBpbmRleCwgZmlyc3QgaW5zdGFuY2UgaW4gdGhlIGdyb3VwKS4gKi9cbmNvbnN0IENodW5rQnl0ZVNpemUgPSA4O1xuXG5jb25zdCBJbml0aWFsQ2FwYWNpdGllczogR3B1Q3VsbGluZ0NhcGFjaXRpZXMgPSB7IGluc3RhbmNlczogODE5MiwgZ3JvdXBzOiAyMDQ4LCBkcmF3czogNDA5NiwgY2h1bmtzOiA0MDk2IH07XG5cbi8qKiBBbiBpbmRpcmVjdCBkcmF3IHJlZ2lzdGVyZWQgZm9yIEdQVSBjdWxsaW5nLiAqL1xuZXhwb3J0IGludGVyZmFjZSBHcHVDdWxsZWREcmF3IHtcbiAgLyoqIFRoZSByYW5nZSBvZiB0aGUgdmlzaWJsZSBpbnN0YW5jZSBidWZmZXIgdG8gYmluZCBhcyB0aGUgaW5zdGFuY2UgdmVydGV4IGJ1ZmZlciAoc2xvdCAwKS4gKi9cbiAgcmVhZG9ubHkgaW5zdGFuY2VWZXJ0ZXhCdWZmZXI6IHsgYnVmZmVyOiBHUFVCdWZmZXI7IG9mZnNldDogbnVtYmVyOyBzaXplOiBudW1iZXIgfTtcbiAgLyoqIFRoZSBpbmRpcmVjdCBidWZmZXIgb2YgdGhlIGRyYXcuICovXG4gIHJlYWRvbmx5IGluZGlyZWN0QnVmZmVyOiBHUFVCdWZmZXI7XG4gIC8qKiBUaGUgYnl0ZSBvZmZzZXQgb2YgdGhlIGRyYXcncyBhcmd1bWVudHMgaW4gYGluZGlyZWN0QnVmZmVyYC4gKi9cbiAgcmVhZG9ubHkgaW5kaXJlY3RPZmZzZXQ6IG51bWJlcjtcbiAgLyoqXG4gICAqIEZvciBhIG1lc2ggZGVmb3JtZWQgYnkgdGhlIGNvbXB1dGUgc2hhZGVyIChXZWJHcHVWZXJ0ZXhEZWZvcm1lcik6IHRoZSBpbmRleCBvZiB0aGUgZmlyc3QgZGVmb3JtZWQgdmVydGV4IG9mIHRoZVxuICAgKiBwcmltaXRpdmUgYW1vbmcgdGhlIGRlZm9ybWVkIHZlcnRpY2VzIG9mIGFuIGluc3RhbmNlIChgVW5pZm9ybURyYXdQYXJhbWV0ZXJzLmRlZm9ybWVkVmVydGV4T2Zmc2V0YCkuXG4gICAqL1xuICByZWFkb25seSBkZWZvcm1lZFZlcnRleE9mZnNldD86IG51bWJlcjtcbn1cblxuLyoqIEEgY29tcHV0ZSBwaXBlbGluZSBvZiB0aGUgY3VsbGluZyBhbmQgaXRzIGJpbmQgZ3JvdXAuICovXG50eXBlIENvbXB1dGVTdGFnZSA9IHtcbiAgbGF5b3V0OiBHUFVCaW5kR3JvdXBMYXlvdXQ7XG4gIHBpcGVsaW5lOiBHUFVDb21wdXRlUGlwZWxpbmU7XG4gIGJpbmRHcm91cD86IEdQVUJpbmRHcm91cDtcbn07XG5cbi8qKiBUaGUgdmlldyAoY2FtZXJhKSBhIGdyb3VwIGlzIGN1bGxlZCB3aXRoLiAqL1xudHlwZSBDdWxsVmlldyA9IHtcbiAgY2FtZXJhOiBDYW1lcmFDb21wb25lbnQ7XG59O1xuXG4vKipcbiAqIEdQVS1kcml2ZW4gZnJ1c3R1bSBjdWxsaW5nIG9mIHRoZSBpbnN0YW5jZXMgZm9yIFdlYkdQVSwgd2l0aCBpbmRpcmVjdCBkcmF3cyByZWNvcmRlZCBpbiByZW5kZXIgYnVuZGxlcy5cbiAqXG4gKiBUaGlzIGZvbGxvd3MgdGhlIFwib2JqZWN0IGN1bGxpbmdcIiBwYXR0ZXJuIG9mIHRoZSByZW5kZXIgYnVuZGxlIGJlc3QgcHJhY3RpY2VzICh0b2ppLmRldik6IHRoZSBidW5kbGVzIHJlY29yZCBvbmVcbiAqIGluZGlyZWN0IGRyYXcgcGVyIHByaW1pdGl2ZSB3aXRoIGZpeGVkIGJpbmRpbmdzLCBhbmQgb25lIGNvbXB1dGUgcGFzcyBwZXIgZnJhbWUgZGVjaWRlcyBob3cgbWFueSBpbnN0YW5jZXMgZWFjaFxuICogZHJhdyByZW5kZXJzLiBUaGUgYnVuZGxlcyB0aGVyZWZvcmUgZG8gbm90IGNoYW5nZSB3aGVuIHRoZSBjYW1lcmEgbW92ZXMgb3IgdGhlIHZpc2libGUgc2V0IGNoYW5nZXMuXG4gKlxuICogLSBXaGlsZSBhIGJ1bmRsZSBpcyByZWNvcmRlZCwgYHJlZ2lzdGVyRHJhd2AgYWxsb2NhdGVzIGEgY3VsbCBncm91cCBwZXIgbWVzaCBhbmQgdmlldywgd3JpdGVzIHRoZSBwZXItaW5zdGFuY2VcbiAqICAgcmVjb3JkcyAoaW5zdGFuY2UgZGF0YSwgbG9jYWwgQUFCQiBhbmQgdGhlIHN0b3JhZ2UgaW5kaWNlcyBvZiB0aGUgdHJhbnNmb3JtKSBhbmQgYW4gaW5kaXJlY3QgZHJhdyBzbG90LlxuICogICBUaGUgZHJhdyBiaW5kcyB0aGUgZ3JvdXAncyByYW5nZSBvZiB0aGUgdmlzaWJsZSBpbnN0YW5jZSBidWZmZXIgYXMgdGhlIGluc3RhbmNlIHZlcnRleCBidWZmZXIsIHdoaWNoIGhhcyB0aGVcbiAqICAgc2FtZSBsYXlvdXQgYXMgdGhlIG1lc2gncyB2YXJpYXRpb24gVkJPLCBzbyB0aGUgdmVydGV4IHNoYWRlcnMgZG8gbm90IGNoYW5nZS5cbiAqIC0gYGVuY29kZWAgKGZyb20gZmx1c2gpIHVwbG9hZHMgdGhlIGNoYW5nZWQgdGFibGVzIGFuZCB0aGUgdmlldyBmcnVzdGEgYW5kIHJlY29yZHMgdGhlIGNvbXB1dGUgcGFzcywgd2hlbiBhbnl0aGluZ1xuICogICBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IG9uZS4gVGhlIGNvbW1hbmQgYnVmZmVyIGlzIHN1Ym1pdHRlZCBiZWZvcmUgdGhlIGZyYW1lJ3MgcmVuZGVyIGNvbW1hbmRzLlxuICogLSBgYWZ0ZXJTdWJtaXRgIHJlbGVhc2VzIHRoZSBhbGxvY2F0aW9ucyBvZiB0aGUgYnVuZGxlcyB0aGF0IHdlcmUgZHJvcHBlZCwgYW5kIGdyb3dzIHRoZSBidWZmZXJzIHdoZW4gYW5cbiAqICAgYWxsb2NhdGlvbiBmYWlsZWQgKHRoZSBmYWlsZWQgZHJhd3Mgd2VyZSBkcmF3biB3aXRob3V0IGN1bGxpbmcpLiBHcm93aW5nIHJlcGxhY2VzIHRoZSBidWZmZXJzIGJvdW5kIGluIHRoZVxuICogICBidW5kbGVzLCBzbyB0aGUgY2FsbGVyIG11c3QgY2xlYXIgdGhlIGJ1bmRsZSBjYWNoZSB0aGVuLlxuICovXG5leHBvcnQgY2xhc3MgV2ViR3B1R3B1Q3VsbGluZyB7XG4gIHByaXZhdGUgX19kZXZpY2U6IEdQVURldmljZTtcbiAgcHJpdmF0ZSBfX3JlZ2lzdHJ5OiBHcHVDdWxsaW5nUmVnaXN0cnk7XG4gIHByaXZhdGUgX19wYXNzZXM6IHtcbiAgICBjdWxsOiBDb21wdXRlU3RhZ2U7XG4gICAgcHJlZml4OiBDb21wdXRlU3RhZ2U7XG4gICAgc2NhdHRlcjogQ29tcHV0ZVN0YWdlO1xuICAgIGZpbmFsaXplOiBDb21wdXRlU3RhZ2U7XG4gIH07XG4gIC8qKiBUaGUgc3RvcmFnZSBidWZmZXIgb2YgdGhlIEdQVSBpbnN0YW5jZSBkYXRhIGJvdW5kIGluIHRoZSBjdWxsIGJpbmQgZ3JvdXAuICovXG4gIHByaXZhdGUgX19jdWxsQmluZEdyb3VwU3RvcmFnZUJ1ZmZlcj86IEdQVUJ1ZmZlcjtcbiAgLyoqIFRoZSBkZWZvcm1lZCBib3VuZGluZyBib3ggYnVmZmVyIGJvdW5kIGluIHRoZSBjdWxsIGJpbmQgZ3JvdXAuICovXG4gIHByaXZhdGUgX19jdWxsQmluZEdyb3VwQm91bmRzQnVmZmVyPzogR1BVQnVmZmVyO1xuICAvKiogVGhlIHZlcnRleCBkZWZvcm1hdGlvbiAoc2tpbm5pbmcsIGJsZW5kIHNoYXBlcykgb2YgdGhlIGRlZm9ybWVkIG1lc2hlcyAoQ29uZmlnLmlzQ29tcHV0ZVNraW5uaW5nRW5hYmxlZCkuICovXG4gIHByaXZhdGUgX19kZWZvcm1lcjogV2ViR3B1VmVydGV4RGVmb3JtZXI7XG5cbiAgcHJpdmF0ZSBfX3BhcmFtc0J1ZmZlcjogR1BVQnVmZmVyO1xuICBwcml2YXRlIF9fcGFyYW1zQXJyYXkgPSBuZXcgVWludDMyQXJyYXkoUGFyYW1zQnl0ZVNpemUgLyA0KTtcbiAgcHJpdmF0ZSBfX3JlY29yZHNCdWZmZXIhOiBHUFVCdWZmZXI7XG4gIHByaXZhdGUgX19ncm91cHNCdWZmZXIhOiBHUFVCdWZmZXI7XG4gIHByaXZhdGUgX192aXNpYmxlSWRzQnVmZmVyITogR1BVQnVmZmVyO1xuICBwcml2YXRlIF9fdmlzaWJsZUNvdW50c0J1ZmZlciE6IEdQVUJ1ZmZlcjtcbiAgcHJpdmF0ZSBfX2RyYXdHcm91cHNCdWZmZXIhOiBHUFVCdWZmZXI7XG4gIHByaXZhdGUgX19hcmdzQnVmZmVyITogR1BVQnVmZmVyO1xuICBwcml2YXRlIF9fY2h1bmtzQnVmZmVyITogR1BVQnVmZmVyO1xuICBwcml2YXRlIF9fY2h1bmtDb3VudHNCdWZmZXIhOiBHUFVCdWZmZXI7XG4gIHByaXZhdGUgX19jaHVua09mZnNldHNCdWZmZXIhOiBHUFVCdWZmZXI7XG4gIHByaXZhdGUgX19zY3JhdGNoSWRzQnVmZmVyITogR1BVQnVmZmVyO1xuICBwcml2YXRlIF9fdmlld3NCdWZmZXI/OiBHUFVCdWZmZXI7XG4gIHByaXZhdGUgX192aWV3c0NhcGFjaXR5ID0gMDtcblxuICBwcml2YXRlIF9fcmVjb3Jkc0FycmF5QnVmZmVyITogQXJyYXlCdWZmZXI7XG4gIHByaXZhdGUgX19yZWNvcmRzVTMyITogVWludDMyQXJyYXk7XG4gIHByaXZhdGUgX19yZWNvcmRzRjMyITogRmxvYXQzMkFycmF5O1xuICBwcml2YXRlIF9fZ3JvdXBzVTMyITogVWludDMyQXJyYXk7XG4gIHByaXZhdGUgX19kcmF3R3JvdXBzVTMyITogVWludDMyQXJyYXk7XG4gIHByaXZhdGUgX19hcmdzVTMyITogVWludDMyQXJyYXk7XG4gIHByaXZhdGUgX19jaHVua3NVMzIhOiBVaW50MzJBcnJheTtcbiAgcHJpdmF0ZSBfX3ZpZXdzRjMyID0gbmV3IEZsb2F0MzJBcnJheSgwKTtcbiAgcHJpdmF0ZSBfX3VwbG9hZGVkVmlld3NGMzIgPSBuZXcgRmxvYXQzMkFycmF5KDApO1xuXG4gIHByaXZhdGUgX19yZWNvcmRzRGlydHkgPSBuZXcgRGlydHlSYW5nZSgpO1xuICBwcml2YXRlIF9fZ3JvdXBzRGlydHkgPSBuZXcgRGlydHlSYW5nZSgpO1xuICBwcml2YXRlIF9fZHJhd0dyb3Vwc0RpcnR5ID0gbmV3IERpcnR5UmFuZ2UoKTtcbiAgcHJpdmF0ZSBfX2FyZ3NEaXJ0eSA9IG5ldyBEaXJ0eVJhbmdlKCk7XG4gIHByaXZhdGUgX19jaHVua3NEaXJ0eSA9IG5ldyBEaXJ0eVJhbmdlKCk7XG5cbiAgLyoqXG4gICAqIFRoZSBsaXZlIGdyb3VwIG9mIGVhY2ggZ3JvdXAgc2xvdCwgd2l0aCB0aGUgdmVydGV4IGJ1ZmZlciByYW5nZSBvZiBpdHMgdmlzaWJsZSBpbnN0YW5jZXMgYW5kIHRoZSBzb3VyY2Ugb2YgaXRzXG4gICAqIHJlY29yZHMuIGBwb3NpdGlvblVwZGF0ZUNvdW50YCBpcyB0aGUgbWVzaCdzIGBwcmltaXRpdmVQb3NpdGlvblVwZGF0ZUNvdW50YCB0aGUgbG9jYWwgQUFCQiB3YXMgd3JpdHRlbiBmb3IuXG4gICAqL1xuICBwcml2YXRlIF9fZ3JvdXBWZXJ0ZXhSYW5nZXM6IChcbiAgICB8IHtcbiAgICAgICAgZ3JvdXA6IEdwdUN1bGxpbmdHcm91cDtcbiAgICAgICAgcmFuZ2U6IEdwdUN1bGxlZERyYXdbJ2luc3RhbmNlVmVydGV4QnVmZmVyJ107XG4gICAgICAgIGVuZ2luZTogRW5naW5lO1xuICAgICAgICBtZXNoOiBNZXNoO1xuICAgICAgICBlbnRpdHlJbmZvOiBVaW50MzJBcnJheTtcbiAgICAgICAgcG9zaXRpb25VcGRhdGVDb3VudDogbnVtYmVyO1xuICAgICAgICAvKiogVGhlIGRlZm9ybWF0aW9uIG9mIHRoZSBpbnN0YW5jZXMsIGZvciBhIGRlZm9ybWVkIG1lc2guICovXG4gICAgICAgIGRlZm9ybTogR3B1RGVmb3JtRW50cnkgfCB1bmRlZmluZWQ7XG4gICAgICAgIC8qKiBXaGV0aGVyIHRoZSBtZXNoIG5lZWRzIGEgZGVmb3JtYXRpb24gdGhhdCBjb3VsZCBub3QgYmUgYWxsb2NhdGVkIChpdHMgZHJhd3MgYXJlIG5vdCBjdWxsZWQpLiAqL1xuICAgICAgICBpc0RlZm9ybUZhaWxlZDogYm9vbGVhbjtcbiAgICAgIH1cbiAgICB8IHVuZGVmaW5lZFxuICApW10gPSBbXTtcbiAgcHJpdmF0ZSBfX3ZpZXdzOiBDdWxsVmlld1tdID0gW107XG4gIHByaXZhdGUgX192aWV3SW5kZXhPZkNhbWVyYSA9IG5ldyBNYXA8Q2FtZXJhQ29tcG9uZW50LCBudW1iZXI+KCk7XG5cbiAgcHJpdmF0ZSBfX2lucHV0c0RpcnR5ID0gdHJ1ZTtcbiAgLyoqIGBNZXNoLl9wcmltaXRpdmVQb3NpdGlvblVwZGF0ZVZlcnNpb25gIHdoZW4gdGhlIHJlY29yZHMgd2VyZSBsYXN0IHJldmFsaWRhdGVkLiAqL1xuICBwcml2YXRlIF9fbGFzdFBvc2l0aW9uVXBkYXRlVmVyc2lvbiA9IC0xO1xuICBwcml2YXRlIF9fbGFzdEVuY29kZWRSZWdpc3RyeVZlcnNpb24gPSAtMTtcblxuICBjb25zdHJ1Y3RvcihkZXZpY2U6IEdQVURldmljZSkge1xuICAgIHRoaXMuX19kZXZpY2UgPSBkZXZpY2U7XG4gICAgdGhpcy5fX3JlZ2lzdHJ5ID0gbmV3IEdwdUN1bGxpbmdSZWdpc3RyeShJbml0aWFsQ2FwYWNpdGllcyk7XG4gICAgLy8gQ3JlYXRlZCB1cCBmcm9udCwgc28gdGhhdCB0aGUgZGVmb3JtZWQgdmVydGV4IGJ1ZmZlciBleGlzdHMgYmVmb3JlIHRoZSBmaXJzdCBkcmF3IGJpbmRzIGdyb3VwIDAuXG4gICAgdGhpcy5fX2RlZm9ybWVyID0gbmV3IFdlYkdwdVZlcnRleERlZm9ybWVyKGRldmljZSk7XG4gICAgY29uc3QgY3JlYXRlU3RhZ2UgPSAobGFiZWw6IHN0cmluZywgY29kZTogc3RyaW5nLCBlbnRyeVBvaW50OiBzdHJpbmcsIHR5cGVzOiBHUFVCdWZmZXJCaW5kaW5nVHlwZVtdKSA9PiB7XG4gICAgICBjb25zdCBsYXlvdXQgPSBkZXZpY2UuY3JlYXRlQmluZEdyb3VwTGF5b3V0KHtcbiAgICAgICAgbGFiZWw6IGBHcHVDdWxsaW5nLiR7bGFiZWx9YCxcbiAgICAgICAgZW50cmllczogdHlwZXMubWFwKCh0eXBlLCBiaW5kaW5nKSA9PiAoeyBiaW5kaW5nLCB2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLCBidWZmZXI6IHsgdHlwZSB9IH0pKSxcbiAgICAgIH0pO1xuICAgICAgY29uc3QgcGlwZWxpbmUgPSBkZXZpY2UuY3JlYXRlQ29tcHV0ZVBpcGVsaW5lKHtcbiAgICAgICAgbGFiZWw6IGBHcHVDdWxsaW5nLiR7bGFiZWx9YCxcbiAgICAgICAgbGF5b3V0OiBkZXZpY2UuY3JlYXRlUGlwZWxpbmVMYXlvdXQoeyBiaW5kR3JvdXBMYXlvdXRzOiBbbGF5b3V0XSB9KSxcbiAgICAgICAgY29tcHV0ZTogeyBtb2R1bGU6IGRldmljZS5jcmVhdGVTaGFkZXJNb2R1bGUoeyBsYWJlbDogYEdwdUN1bGxpbmcuJHtsYWJlbH1gLCBjb2RlIH0pLCBlbnRyeVBvaW50IH0sXG4gICAgICB9KTtcbiAgICAgIHJldHVybiB7IGxheW91dCwgcGlwZWxpbmUgfSBhcyBDb21wdXRlU3RhZ2U7XG4gICAgfTtcbiAgICBjb25zdCByID0gJ3JlYWQtb25seS1zdG9yYWdlJztcbiAgICBjb25zdCB3ID0gJ3N0b3JhZ2UnO1xuICAgIGNvbnN0IHUgPSAndW5pZm9ybSc7XG4gICAgdGhpcy5fX3Bhc3NlcyA9IHtcbiAgICAgIGN1bGw6IGNyZWF0ZVN0YWdlKCdjdWxsQ2h1bmtzJywgY3VsbENodW5rc1dnc2wsICdjdWxsQ2h1bmtzJywgW3IsIHUsIHIsIHIsIHIsIHIsIHcsIHcsIHJdKSxcbiAgICAgIHByZWZpeDogY3JlYXRlU3RhZ2UoJ3ByZWZpeEdyb3VwcycsIHByZWZpeEdyb3Vwc1dnc2wsICdwcmVmaXhHcm91cHMnLCBbdSwgciwgciwgdywgd10pLFxuICAgICAgc2NhdHRlcjogY3JlYXRlU3RhZ2UoJ3NjYXR0ZXInLCBzY2F0dGVyV2dzbCwgJ3NjYXR0ZXInLCBbdSwgciwgciwgciwgciwgciwgd10pLFxuICAgICAgZmluYWxpemU6IGNyZWF0ZVN0YWdlKCdmaW5hbGl6ZScsIGZpbmFsaXplV2dzbCwgJ2ZpbmFsaXplJywgW3UsIHIsIHIsIHddKSxcbiAgICB9O1xuICAgIHRoaXMuX19wYXJhbXNCdWZmZXIgPSBkZXZpY2UuY3JlYXRlQnVmZmVyKHtcbiAgICAgIGxhYmVsOiAnR3B1Q3VsbGluZy5wYXJhbXMnLFxuICAgICAgc2l6ZTogUGFyYW1zQnl0ZVNpemUsXG4gICAgICB1c2FnZTogR1BVQnVmZmVyVXNhZ2UuVU5JRk9STSB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuICAgIH0pO1xuICAgIHRoaXMuX19jcmVhdGVUYWJsZXMoSW5pdGlhbENhcGFjaXRpZXMpO1xuICB9XG5cbiAgLyoqIFRoZSBib29ra2VlcGluZyBvZiB0aGUgYWxsb2NhdGlvbnMgKGV4cG9zZWQgZm9yIHRlc3RzIGFuZCBzdGF0aXN0aWNzKS4gKi9cbiAgZ2V0IHJlZ2lzdHJ5KCk6IEdwdUN1bGxpbmdSZWdpc3RyeSB7XG4gICAgcmV0dXJuIHRoaXMuX19yZWdpc3RyeTtcbiAgfVxuXG4gIC8qKiBUaGUgdmVydGV4IGRlZm9ybWF0aW9uIG9mIHRoZSBkZWZvcm1lZCBtZXNoZXMgKGV4cG9zZWQgZm9yIHRlc3RzIGFuZCBzdGF0aXN0aWNzKS4gKi9cbiAgZ2V0IGRlZm9ybWVyKCk6IFdlYkdwdVZlcnRleERlZm9ybWVyIHtcbiAgICByZXR1cm4gdGhpcy5fX2RlZm9ybWVyO1xuICB9XG5cbiAgLyoqIFRoZSBkZWZvcm1lZCB2ZXJ0aWNlcywgYm91bmQgYXQgZ3JvdXAgMCwgYmluZGluZyA0IG9mIHRoZSBkcmF3cyAoc2VlIHByb2Nlc3NHZW9tZXRyeSkuICovXG4gIGdldCBkZWZvcm1lZFZlcnRpY2VzQnVmZmVyKCk6IEdQVUJ1ZmZlciB7XG4gICAgcmV0dXJuIHRoaXMuX19kZWZvcm1lci5kZWZvcm1lZFZlcnRpY2VzQnVmZmVyO1xuICB9XG5cbiAgLyoqIFN0YXJ0cyBhIHJlbmRlciBidW5kbGUgcmVjb3JkaW5nLiBTZWUgR3B1Q3VsbGluZ1JlZ2lzdHJ5LmJlZ2luUmVjb3JkaW5nLiAqL1xuICBiZWdpblJlY29yZGluZygpIHtcbiAgICB0aGlzLl9fcmVnaXN0cnkuYmVnaW5SZWNvcmRpbmcoKTtcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIGEgcmVuZGVyIGJ1bmRsZSByZWNvcmRpbmcgaXMgaW4gcHJvZ3Jlc3MuICovXG4gIGdldCBpc1JlY29yZGluZygpIHtcbiAgICByZXR1cm4gdGhpcy5fX3JlZ2lzdHJ5LmlzUmVjb3JkaW5nO1xuICB9XG5cbiAgLyoqIEZpbmlzaGVzIGEgcmVuZGVyIGJ1bmRsZSByZWNvcmRpbmcuIFNlZSBHcHVDdWxsaW5nUmVnaXN0cnkuZmluaXNoUmVjb3JkaW5nLiAqL1xuICBmaW5pc2hSZWNvcmRpbmcoYnVuZGxlS2V5OiBzdHJpbmcgfCB1bmRlZmluZWQpIHtcbiAgICB0aGlzLl9fcmVnaXN0cnkuZmluaXNoUmVjb3JkaW5nKGJ1bmRsZUtleSk7XG4gIH1cblxuICAvKiogRHJvcHMgdGhlIHJlbmRlciBidW5kbGUgcmVjb3JkaW5nIGluIHByb2dyZXNzLiBTZWUgR3B1Q3VsbGluZ1JlZ2lzdHJ5LmFib3J0UmVjb3JkaW5nLiAqL1xuICBhYm9ydFJlY29yZGluZygpIHtcbiAgICB0aGlzLl9fcmVnaXN0cnkuYWJvcnRSZWNvcmRpbmcoKTtcbiAgfVxuXG4gIC8qKiBSZXRpcmVzIHRoZSBhbGxvY2F0aW9ucyBvZiBhbGwgdGhlIGNhY2hlZCByZW5kZXIgYnVuZGxlcyAodGhlIGJ1bmRsZSBjYWNoZSBpcyBjbGVhcmVkKS4gKi9cbiAgcmV0aXJlQWxsQnVuZGxlcygpIHtcbiAgICB0aGlzLl9fcmVnaXN0cnkucmV0aXJlQWxsQnVuZGxlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIE1hcmtzIHRoZSBpbnB1dHMgb2YgdGhlIGN1bGxpbmcgKHRoZSBHUFUgaW5zdGFuY2UgZGF0YTogdHJhbnNmb3JtcywgdmlzaWJpbGl0eSwgY2FtZXJhcykgYXMgY2hhbmdlZCwgc28gdGhlXG4gICAqIG5leHQgYGVuY29kZWAgZGlzcGF0Y2hlcyB0aGUgY3VsbGluZy5cbiAgICovXG4gIG1hcmtJbnB1dHNEaXJ0eSgpIHtcbiAgICB0aGlzLl9faW5wdXRzRGlydHkgPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBhbiBpbmRpcmVjdCBkcmF3IG9mIGEgcHJpbWl0aXZlIG9mIGBtZXNoYCBpbiB0aGUgcmVuZGVyIGJ1bmRsZSBiZWluZyByZWNvcmRlZC5cbiAgICpcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmVcbiAgICogQHBhcmFtIG1lc2ggLSBUaGUgbWVzaCBkcmF3biAoaXRzIGluc3RhbmNlcyBhcmUgY3VsbGVkKVxuICAgKiBAcGFyYW0gcHJpbWl0aXZlIC0gVGhlIHByaW1pdGl2ZSBkcmF3blxuICAgKiBAcGFyYW0gY2FtZXJhU0lEIC0gVGhlIGNhbWVyYSB0aGUgZHJhdyByZW5kZXJzIHdpdGg7IGl0cyBmcnVzdHVtIGlzIHVzZWQgZm9yIHRoZSBjdWxsaW5nXG4gICAqIEBwYXJhbSBlbGVtZW50Q291bnQgLSBUaGUgaW5kZXggY291bnQgKGluZGV4ZWQgZHJhdykgb3IgdGhlIHZlcnRleCBjb3VudCBvZiB0aGUgcHJpbWl0aXZlXG4gICAqIEByZXR1cm5zIFRoZSBkcmF3LCBvciB1bmRlZmluZWQgd2hlbiB0aGUgZHJhdyBjYW5ub3QgYmUgY3VsbGVkIG9uIHRoZSBHUFUgKGRyYXcgaXQgd2l0aG91dCBjdWxsaW5nKVxuICAgKi9cbiAgcmVnaXN0ZXJEcmF3KFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIG1lc2g6IE1lc2gsXG4gICAgcHJpbWl0aXZlOiBQcmltaXRpdmUsXG4gICAgY2FtZXJhU0lEOiBudW1iZXIsXG4gICAgZWxlbWVudENvdW50OiBudW1iZXJcbiAgKTogR3B1Q3VsbGVkRHJhdyB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgcmVnaXN0cnkgPSB0aGlzLl9fcmVnaXN0cnk7XG4gICAgaWYgKCFyZWdpc3RyeS5pc1JlY29yZGluZykge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgY29uc3QgZW50aXR5SW5mbyA9IG1lc2guX3ZhcmlhdGlvbkVudGl0eUluZm87XG4gICAgY29uc3QgaW5zdGFuY2VDb3VudCA9IG1lc2gubWVzaEVudGl0aWVzSW5uZXIubGVuZ3RoO1xuICAgIGlmIChlbnRpdHlJbmZvID09PSB1bmRlZmluZWQgfHwgZW50aXR5SW5mby5sZW5ndGggIT09IGluc3RhbmNlQ291bnQgKiA0IHx8IGluc3RhbmNlQ291bnQgPT09IDApIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGNvbnN0IHZpZXdJbmRleCA9IHRoaXMuX19nZXRPckNyZWF0ZVZpZXcoZW5naW5lLCBjYW1lcmFTSUQpO1xuICAgIGlmICh2aWV3SW5kZXggPCAwKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBjb25zdCBncm91cCA9IHJlZ2lzdHJ5LmdldE9yQWxsb2NhdGVHcm91cChtZXNoLCB2aWV3SW5kZXgsIGluc3RhbmNlQ291bnQpO1xuICAgIGlmIChncm91cCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBsZXQgZ3JvdXBFbnRyeSA9IHRoaXMuX19ncm91cFZlcnRleFJhbmdlc1tncm91cC5pbmRleF07XG4gICAgaWYgKGdyb3VwRW50cnkgPT09IHVuZGVmaW5lZCB8fCBncm91cEVudHJ5Lmdyb3VwICE9PSBncm91cCkge1xuICAgICAgLy8gVGhlIGRlZm9ybWF0aW9uIGlzIHNoYXJlZCBieSB0aGUgZ3JvdXBzIG9mIHRoZSBtZXNoICh2aWV3cywgcmVuZGVyIGJ1bmRsZXMpIGFuZCByZWxlYXNlZCB3aXRoIGVhY2ggZ3JvdXAuXG4gICAgICBjb25zdCBuZWVkc0RlZm9ybWF0aW9uID0gbWVzaC5fbmVlZHNDb21wdXRlRGVmb3JtYXRpb247XG4gICAgICBjb25zdCBkZWZvcm0gPSBuZWVkc0RlZm9ybWF0aW9uID8gdGhpcy5fX2RlZm9ybWVyLmFjcXVpcmUoZW5naW5lLCBtZXNoLCBlbnRpdHlJbmZvKSA6IHVuZGVmaW5lZDtcbiAgICAgIGdyb3VwRW50cnkgPSB7XG4gICAgICAgIGdyb3VwLFxuICAgICAgICByYW5nZToge1xuICAgICAgICAgIGJ1ZmZlcjogdGhpcy5fX3Zpc2libGVJZHNCdWZmZXIsXG4gICAgICAgICAgb2Zmc2V0OiBncm91cC5yYW5nZUJhc2UgKiBJbnN0YW5jZUJ5dGVTaXplLFxuICAgICAgICAgIHNpemU6IGluc3RhbmNlQ291bnQgKiBJbnN0YW5jZUJ5dGVTaXplLFxuICAgICAgICB9LFxuICAgICAgICBlbmdpbmUsXG4gICAgICAgIG1lc2gsXG4gICAgICAgIGVudGl0eUluZm8sXG4gICAgICAgIHBvc2l0aW9uVXBkYXRlQ291bnQ6IG1lc2gucHJpbWl0aXZlUG9zaXRpb25VcGRhdGVDb3VudCxcbiAgICAgICAgZGVmb3JtLFxuICAgICAgICBpc0RlZm9ybUZhaWxlZDogbmVlZHNEZWZvcm1hdGlvbiAmJiBkZWZvcm0gPT09IHVuZGVmaW5lZCxcbiAgICAgIH07XG4gICAgICB0aGlzLl9fZ3JvdXBWZXJ0ZXhSYW5nZXNbZ3JvdXAuaW5kZXhdID0gZ3JvdXBFbnRyeTtcbiAgICAgIHRoaXMuX193cml0ZUdyb3VwKGVuZ2luZSwgbWVzaCwgZ3JvdXAsIGVudGl0eUluZm8sIGRlZm9ybSk7XG4gICAgfVxuICAgIGlmIChncm91cEVudHJ5LmlzRGVmb3JtRmFpbGVkKSB7XG4gICAgICAvLyBUaGUgZGVmb3JtYXRpb24gdGFibGVzIGFyZSBmdWxsOiB0aGUgZHJhdyBkZWZvcm1zIGluIHRoZSB2ZXJ0ZXggc2hhZGVyIHdpdGhvdXQgY3VsbGluZywgdW50aWwgdGhleSBncm93LlxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgbGV0IGRlZm9ybWVkVmVydGV4T2Zmc2V0OiBudW1iZXIgfCB1bmRlZmluZWQ7XG4gICAgaWYgKGdyb3VwRW50cnkuZGVmb3JtICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGRlZm9ybWVkVmVydGV4T2Zmc2V0ID0gdGhpcy5fX2RlZm9ybWVyLmdldFByaW1pdGl2ZU9mZnNldChncm91cEVudHJ5LmRlZm9ybSwgcHJpbWl0aXZlKTtcbiAgICAgIGlmIChkZWZvcm1lZFZlcnRleE9mZnNldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHNsb3QgPSByZWdpc3RyeS5hbGxvY2F0ZURyYXcoKTtcbiAgICBpZiAoc2xvdCA8IDApIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGNvbnN0IGFyZ3MgPSB0aGlzLl9fYXJnc1UzMjtcbiAgICBjb25zdCBhcmdzQmFzZSA9IHNsb3QgKiBBcmdzV29yZFNpemU7XG4gICAgLy8gW2luZGV4Q291bnQgfCB2ZXJ0ZXhDb3VudCwgaW5zdGFuY2VDb3VudCAod3JpdHRlbiBieSB0aGUgY3VsbGluZyksIGZpcnN0SW5kZXggfCBmaXJzdFZlcnRleCxcbiAgICAvLyAgYmFzZVZlcnRleCB8IGZpcnN0SW5zdGFuY2UsIGZpcnN0SW5zdGFuY2VdLiBUaGUgdmVydGV4IGFuZCBpbmRleCBidWZmZXJzIGFyZSBib3VuZCB3aXRoIG9mZnNldHMsIHNvIHRoZVxuICAgIC8vIG90aGVyIGZpZWxkcyBhcmUgMCAoYSBub24temVybyBmaXJzdEluc3RhbmNlIHdvdWxkIHJlcXVpcmUgdGhlICdpbmRpcmVjdC1maXJzdC1pbnN0YW5jZScgZmVhdHVyZSkuXG4gICAgYXJnc1thcmdzQmFzZV0gPSBlbGVtZW50Q291bnQ7XG4gICAgYXJnc1thcmdzQmFzZSArIDFdID0gMDtcbiAgICBhcmdzW2FyZ3NCYXNlICsgMl0gPSAwO1xuICAgIGFyZ3NbYXJnc0Jhc2UgKyAzXSA9IDA7XG4gICAgYXJnc1thcmdzQmFzZSArIDRdID0gMDtcbiAgICB0aGlzLl9fYXJnc0RpcnR5LmFkZChzbG90LCBzbG90ICsgMSk7XG4gICAgdGhpcy5fX2RyYXdHcm91cHNVMzJbc2xvdF0gPSBncm91cC5pbmRleDtcbiAgICB0aGlzLl9fZHJhd0dyb3Vwc0RpcnR5LmFkZChzbG90LCBzbG90ICsgMSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIGluc3RhbmNlVmVydGV4QnVmZmVyOiBncm91cEVudHJ5LnJhbmdlLFxuICAgICAgaW5kaXJlY3RCdWZmZXI6IHRoaXMuX19hcmdzQnVmZmVyLFxuICAgICAgaW5kaXJlY3RPZmZzZXQ6IHNsb3QgKiBHcHVDdWxsaW5nQXJnc0J5dGVTaXplLFxuICAgICAgZGVmb3JtZWRWZXJ0ZXhPZmZzZXQsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWNvcmRzIHRoZSBjdWxsaW5nIGNvbXB1dGUgcGFzcyB3aGVuIGl0cyBpbnB1dHMgY2hhbmdlZCBzaW5jZSB0aGUgbGFzdCBvbmUuXG4gICAqIFN1Ym1pdCB0aGUgcmV0dXJuZWQgY29tbWFuZCBidWZmZXIgYmVmb3JlIHRoZSByZW5kZXIgY29tbWFuZHMgdGhhdCBleGVjdXRlIHRoZSBjdWxsZWQgZHJhd3MuXG4gICAqXG4gICAqIFRoZSB2ZXJ0ZXggZGVmb3JtYXRpb24gb2YgdGhlIGRlZm9ybWVkIG1lc2hlcyBpcyByZWNvcmRlZCBmaXJzdCBpbiB0aGUgc2FtZSBjb21tYW5kIGJ1ZmZlciwgd2hlbiBpdHMgaW5wdXRzXG4gICAqIGNoYW5nZWQgKHRoZSBHUFUgaW5zdGFuY2UgZGF0YSBob2xkcyB0aGUgYm9uZSBkYXRhKS5cbiAgICpcbiAgICogQHBhcmFtIHN0b3JhZ2VCdWZmZXIgLSBUaGUgc3RvcmFnZSBidWZmZXIgb2YgdGhlIEdQVSBpbnN0YW5jZSBkYXRhXG4gICAqIEBwYXJhbSBncHVUaW1lciAtIFdoZW4gc2V0IChhbmQgYSBmcmFtZSBpcyBiZWluZyBtZWFzdXJlZCksIG1lYXN1cmVzIHRoZSBjdWxsaW5nIGFzIHRoZSAnR3B1Q3VsbGluZycgcGFzcyBhbmRcbiAgICogICB0aGUgZGVmb3JtYXRpb24gYXMgdGhlICdHcHVTa2lubmluZycgcGFzc1xuICAgKiBAcGFyYW0gbW9ycGhCdWZmZXJzIC0gVGhlIGJ1ZmZlcnMgb2YgdGhlIG1vcnBoIHRhcmdldHMsIHJlYWQgYnkgdGhlIGRlZm9ybWF0aW9uXG4gICAqIEByZXR1cm5zIFRoZSBjb21tYW5kIGJ1ZmZlciwgb3IgdW5kZWZpbmVkIHdoZW4gbm90aGluZyBoYXMgdG8gYmUgZGlzcGF0Y2hlZFxuICAgKi9cbiAgZW5jb2RlKFxuICAgIHN0b3JhZ2VCdWZmZXI6IEdQVUJ1ZmZlciB8IHVuZGVmaW5lZCxcbiAgICBncHVUaW1lcj86IFdlYkdwdUdwdVRpbWVyLFxuICAgIG1vcnBoQnVmZmVyczogR3B1RGVmb3JtTW9ycGhCdWZmZXJzID0ge31cbiAgKTogR1BVQ29tbWFuZEJ1ZmZlciB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgcmVnaXN0cnkgPSB0aGlzLl9fcmVnaXN0cnk7XG4gICAgY29uc3QgZ3JvdXBDb3VudCA9IHJlZ2lzdHJ5Lmdyb3VwSGlnaFdhdGVyO1xuICAgIGNvbnN0IGRyYXdDb3VudCA9IHJlZ2lzdHJ5LmRyYXdIaWdoV2F0ZXI7XG4gICAgaWYgKHN0b3JhZ2VCdWZmZXIgPT0gbnVsbCB8fCBncm91cENvdW50ID09PSAwKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBjb25zdCB2aWV3c0NoYW5nZWQgPSB0aGlzLl9fdXBkYXRlVmlld3MoKTtcbiAgICBjb25zdCBwb3NpdGlvblVwZGF0ZVZlcnNpb24gPSBNZXNoLl9wcmltaXRpdmVQb3NpdGlvblVwZGF0ZVZlcnNpb247XG4gICAgaWYgKHBvc2l0aW9uVXBkYXRlVmVyc2lvbiAhPT0gdGhpcy5fX2xhc3RQb3NpdGlvblVwZGF0ZVZlcnNpb24pIHtcbiAgICAgIHRoaXMuX19sYXN0UG9zaXRpb25VcGRhdGVWZXJzaW9uID0gcG9zaXRpb25VcGRhdGVWZXJzaW9uO1xuICAgICAgdGhpcy5fX3JlZnJlc2hDaGFuZ2VkQm91bmRzKCk7XG4gICAgfVxuICAgIGNvbnN0IGRlZm9ybWVyID0gdGhpcy5fX2RlZm9ybWVyO1xuICAgIGRlZm9ybWVyLnJlZnJlc2goKTtcbiAgICAvLyBUaGUgZGVmb3JtYXRpb24gaW5wdXRzIGFyZSB0aGUgYm9uZSBkYXRhIGFuZCB0aGUgYmxlbmQgc2hhcGUgd2VpZ2h0cyAoYm90aCBtYXJrZWQgYXMgaW5wdXRzKSwgYW5kIHRoZSB0YWJsZXMuXG4gICAgY29uc3QgbmVlZHNEZWZvcm1hdGlvbiA9XG4gICAgICBkZWZvcm1lci5oYXNFbnRyaWVzICYmXG4gICAgICAodGhpcy5fX2lucHV0c0RpcnR5IHx8IGRlZm9ybWVyLmlzQ2hhbmdlZCB8fCB0aGlzLl9fY3VsbEJpbmRHcm91cFN0b3JhZ2VCdWZmZXIgIT09IHN0b3JhZ2VCdWZmZXIpO1xuICAgIGlmIChcbiAgICAgICF0aGlzLl9faW5wdXRzRGlydHkgJiZcbiAgICAgICFuZWVkc0RlZm9ybWF0aW9uICYmXG4gICAgICB0aGlzLl9fcmVjb3Jkc0RpcnR5LmlzRW1wdHkgJiZcbiAgICAgICF2aWV3c0NoYW5nZWQgJiZcbiAgICAgIHJlZ2lzdHJ5LnZlcnNpb24gPT09IHRoaXMuX19sYXN0RW5jb2RlZFJlZ2lzdHJ5VmVyc2lvbiAmJlxuICAgICAgdGhpcy5fX2N1bGxCaW5kR3JvdXBTdG9yYWdlQnVmZmVyID09PSBzdG9yYWdlQnVmZmVyXG4gICAgKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB0aGlzLl9faW5wdXRzRGlydHkgPSBmYWxzZTtcbiAgICB0aGlzLl9fbGFzdEVuY29kZWRSZWdpc3RyeVZlcnNpb24gPSByZWdpc3RyeS52ZXJzaW9uO1xuXG4gICAgY29uc3QgZGV2aWNlID0gdGhpcy5fX2RldmljZTtcbiAgICB0aGlzLl9fdXBsb2FkRGlydHkodGhpcy5fX3JlY29yZHNCdWZmZXIsIHRoaXMuX19yZWNvcmRzVTMyLCB0aGlzLl9fcmVjb3Jkc0RpcnR5LCBSZWNvcmRXb3JkU2l6ZSk7XG4gICAgdGhpcy5fX3VwbG9hZERpcnR5KHRoaXMuX19ncm91cHNCdWZmZXIsIHRoaXMuX19ncm91cHNVMzIsIHRoaXMuX19ncm91cHNEaXJ0eSwgR3JvdXBCeXRlU2l6ZSAvIDQpO1xuICAgIHRoaXMuX191cGxvYWREaXJ0eSh0aGlzLl9fY2h1bmtzQnVmZmVyLCB0aGlzLl9fY2h1bmtzVTMyLCB0aGlzLl9fY2h1bmtzRGlydHksIENodW5rQnl0ZVNpemUgLyA0KTtcbiAgICB0aGlzLl9fdXBsb2FkRGlydHkodGhpcy5fX2RyYXdHcm91cHNCdWZmZXIsIHRoaXMuX19kcmF3R3JvdXBzVTMyLCB0aGlzLl9fZHJhd0dyb3Vwc0RpcnR5LCAxKTtcbiAgICB0aGlzLl9fdXBsb2FkRGlydHkodGhpcy5fX2FyZ3NCdWZmZXIsIHRoaXMuX19hcmdzVTMyLCB0aGlzLl9fYXJnc0RpcnR5LCBBcmdzV29yZFNpemUpO1xuXG4gICAgY29uc3QgY2h1bmtDb3VudCA9IHJlZ2lzdHJ5LmNodW5rSGlnaFdhdGVyO1xuICAgIGNvbnN0IGNodW5rc1BlclJvdyA9IE1hdGgubWF4KDEsIE1hdGgubWluKGNodW5rQ291bnQsIE1heFdvcmtncm91cHNQZXJEaW1lbnNpb24pKTtcbiAgICBjb25zdCBwYXJhbXMgPSB0aGlzLl9fcGFyYW1zQXJyYXk7XG4gICAgcGFyYW1zWzBdID0gZ3JvdXBDb3VudDtcbiAgICBwYXJhbXNbMV0gPSBkcmF3Q291bnQ7XG4gICAgcGFyYW1zWzJdID0gY2h1bmtDb3VudDtcbiAgICBwYXJhbXNbM10gPSBjaHVua3NQZXJSb3c7XG4gICAgZGV2aWNlLnF1ZXVlLndyaXRlQnVmZmVyKHRoaXMuX19wYXJhbXNCdWZmZXIsIDAsIHBhcmFtcyk7XG5cbiAgICBjb25zdCBwYXNzZXMgPSB0aGlzLl9fcGFzc2VzO1xuICAgIGlmIChcbiAgICAgIHBhc3Nlcy5jdWxsLmJpbmRHcm91cCA9PSBudWxsIHx8XG4gICAgICB0aGlzLl9fY3VsbEJpbmRHcm91cFN0b3JhZ2VCdWZmZXIgIT09IHN0b3JhZ2VCdWZmZXIgfHxcbiAgICAgIHRoaXMuX19jdWxsQmluZEdyb3VwQm91bmRzQnVmZmVyICE9PSBkZWZvcm1lci5ib3VuZHNCdWZmZXJcbiAgICApIHtcbiAgICAgIHBhc3Nlcy5jdWxsLmJpbmRHcm91cCA9IHRoaXMuX19jcmVhdGVCaW5kR3JvdXAocGFzc2VzLmN1bGwsIFtcbiAgICAgICAgc3RvcmFnZUJ1ZmZlcixcbiAgICAgICAgdGhpcy5fX3BhcmFtc0J1ZmZlcixcbiAgICAgICAgdGhpcy5fX3JlY29yZHNCdWZmZXIsXG4gICAgICAgIHRoaXMuX19ncm91cHNCdWZmZXIsXG4gICAgICAgIHRoaXMuX192aWV3c0J1ZmZlciEsXG4gICAgICAgIHRoaXMuX19jaHVua3NCdWZmZXIsXG4gICAgICAgIHRoaXMuX19zY3JhdGNoSWRzQnVmZmVyLFxuICAgICAgICB0aGlzLl9fY2h1bmtDb3VudHNCdWZmZXIsXG4gICAgICAgIGRlZm9ybWVyLmJvdW5kc0J1ZmZlcixcbiAgICAgIF0pO1xuICAgICAgdGhpcy5fX2N1bGxCaW5kR3JvdXBTdG9yYWdlQnVmZmVyID0gc3RvcmFnZUJ1ZmZlcjtcbiAgICAgIHRoaXMuX19jdWxsQmluZEdyb3VwQm91bmRzQnVmZmVyID0gZGVmb3JtZXIuYm91bmRzQnVmZmVyO1xuICAgIH1cbiAgICBwYXNzZXMucHJlZml4LmJpbmRHcm91cCA/Pz0gdGhpcy5fX2NyZWF0ZUJpbmRHcm91cChwYXNzZXMucHJlZml4LCBbXG4gICAgICB0aGlzLl9fcGFyYW1zQnVmZmVyLFxuICAgICAgdGhpcy5fX2dyb3Vwc0J1ZmZlcixcbiAgICAgIHRoaXMuX19jaHVua0NvdW50c0J1ZmZlcixcbiAgICAgIHRoaXMuX19jaHVua09mZnNldHNCdWZmZXIsXG4gICAgICB0aGlzLl9fdmlzaWJsZUNvdW50c0J1ZmZlcixcbiAgICBdKTtcbiAgICBwYXNzZXMuc2NhdHRlci5iaW5kR3JvdXAgPz89IHRoaXMuX19jcmVhdGVCaW5kR3JvdXAocGFzc2VzLnNjYXR0ZXIsIFtcbiAgICAgIHRoaXMuX19wYXJhbXNCdWZmZXIsXG4gICAgICB0aGlzLl9fZ3JvdXBzQnVmZmVyLFxuICAgICAgdGhpcy5fX2NodW5rc0J1ZmZlcixcbiAgICAgIHRoaXMuX19jaHVua0NvdW50c0J1ZmZlcixcbiAgICAgIHRoaXMuX19jaHVua09mZnNldHNCdWZmZXIsXG4gICAgICB0aGlzLl9fc2NyYXRjaElkc0J1ZmZlcixcbiAgICAgIHRoaXMuX192aXNpYmxlSWRzQnVmZmVyLFxuICAgIF0pO1xuICAgIHBhc3Nlcy5maW5hbGl6ZS5iaW5kR3JvdXAgPz89IHRoaXMuX19jcmVhdGVCaW5kR3JvdXAocGFzc2VzLmZpbmFsaXplLCBbXG4gICAgICB0aGlzLl9fcGFyYW1zQnVmZmVyLFxuICAgICAgdGhpcy5fX3Zpc2libGVDb3VudHNCdWZmZXIsXG4gICAgICB0aGlzLl9fZHJhd0dyb3Vwc0J1ZmZlcixcbiAgICAgIHRoaXMuX19hcmdzQnVmZmVyLFxuICAgIF0pO1xuXG4gICAgY29uc3QgZW5jb2RlciA9IGRldmljZS5jcmVhdGVDb21tYW5kRW5jb2Rlcih7IGxhYmVsOiAnR3B1Q3VsbGluZycgfSk7XG4gICAgaWYgKG5lZWRzRGVmb3JtYXRpb24pIHtcbiAgICAgIC8vIFRoZSBkZWZvcm1lZCBib3VuZGluZyBib3hlcyBhcmUgd3JpdHRlbiBiZWZvcmUgdGhlIGN1bGxpbmcgcmVhZHMgdGhlbSAoYSBzZXBhcmF0ZSBwYXNzKS5cbiAgICAgIGRlZm9ybWVyLmVuY29kZShlbmNvZGVyLCBzdG9yYWdlQnVmZmVyLCBtb3JwaEJ1ZmZlcnMsIGdwdVRpbWVyKTtcbiAgICB9XG4gICAgY29uc3QgcGFzc0Rlc2NyaXB0b3I6IEdQVUNvbXB1dGVQYXNzRGVzY3JpcHRvciA9IHsgbGFiZWw6ICdHcHVDdWxsaW5nJyB9O1xuICAgIGNvbnN0IHRpbWVzdGFtcFdyaXRlcyA9IGdwdVRpbWVyPy5nZXRUaW1lc3RhbXBXcml0ZXMoJ0dwdUN1bGxpbmcnKTtcbiAgICBpZiAodGltZXN0YW1wV3JpdGVzICE9IG51bGwpIHtcbiAgICAgIHBhc3NEZXNjcmlwdG9yLnRpbWVzdGFtcFdyaXRlcyA9IHRpbWVzdGFtcFdyaXRlcztcbiAgICB9XG4gICAgLy8gT25lIGNvbXB1dGUgcGFzczogdGhlIGRpc3BhdGNoZXMgcnVuIGluIG9yZGVyLCBhbmQgdGhlIHdyaXRlcyBvZiBhIGRpc3BhdGNoIGFyZSB2aXNpYmxlIHRvIHRoZSBuZXh0IG9uZS5cbiAgICBjb25zdCBwYXNzID0gZW5jb2Rlci5iZWdpbkNvbXB1dGVQYXNzKHBhc3NEZXNjcmlwdG9yKTtcbiAgICBjb25zdCBjaHVua1Jvd3MgPSBNYXRoLmNlaWwoY2h1bmtDb3VudCAvIGNodW5rc1BlclJvdyk7XG4gICAgaWYgKGNodW5rQ291bnQgPiAwKSB7XG4gICAgICBwYXNzLnNldFBpcGVsaW5lKHBhc3Nlcy5jdWxsLnBpcGVsaW5lKTtcbiAgICAgIHBhc3Muc2V0QmluZEdyb3VwKDAsIHBhc3Nlcy5jdWxsLmJpbmRHcm91cCk7XG4gICAgICBwYXNzLmRpc3BhdGNoV29ya2dyb3VwcyhjaHVua3NQZXJSb3csIGNodW5rUm93cyk7XG4gICAgfVxuICAgIHBhc3Muc2V0UGlwZWxpbmUocGFzc2VzLnByZWZpeC5waXBlbGluZSk7XG4gICAgcGFzcy5zZXRCaW5kR3JvdXAoMCwgcGFzc2VzLnByZWZpeC5iaW5kR3JvdXApO1xuICAgIHBhc3MuZGlzcGF0Y2hXb3JrZ3JvdXBzKE1hdGguY2VpbChncm91cENvdW50IC8gV29ya2dyb3VwU2l6ZSkpO1xuICAgIGlmIChjaHVua0NvdW50ID4gMCkge1xuICAgICAgcGFzcy5zZXRQaXBlbGluZShwYXNzZXMuc2NhdHRlci5waXBlbGluZSk7XG4gICAgICBwYXNzLnNldEJpbmRHcm91cCgwLCBwYXNzZXMuc2NhdHRlci5iaW5kR3JvdXApO1xuICAgICAgcGFzcy5kaXNwYXRjaFdvcmtncm91cHMoY2h1bmtzUGVyUm93LCBjaHVua1Jvd3MpO1xuICAgIH1cbiAgICBpZiAoZHJhd0NvdW50ID4gMCkge1xuICAgICAgcGFzcy5zZXRQaXBlbGluZShwYXNzZXMuZmluYWxpemUucGlwZWxpbmUpO1xuICAgICAgcGFzcy5zZXRCaW5kR3JvdXAoMCwgcGFzc2VzLmZpbmFsaXplLmJpbmRHcm91cCk7XG4gICAgICBwYXNzLmRpc3BhdGNoV29ya2dyb3VwcyhNYXRoLmNlaWwoZHJhd0NvdW50IC8gV29ya2dyb3VwU2l6ZSkpO1xuICAgIH1cbiAgICBwYXNzLmVuZCgpO1xuICAgIHJldHVybiBlbmNvZGVyLmZpbmlzaCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2NyZWF0ZUJpbmRHcm91cChzdGFnZTogQ29tcHV0ZVN0YWdlLCBidWZmZXJzOiBHUFVCdWZmZXJbXSk6IEdQVUJpbmRHcm91cCB7XG4gICAgcmV0dXJuIHRoaXMuX19kZXZpY2UuY3JlYXRlQmluZEdyb3VwKHtcbiAgICAgIGxhYmVsOiBzdGFnZS5waXBlbGluZS5sYWJlbCxcbiAgICAgIGxheW91dDogc3RhZ2UubGF5b3V0LFxuICAgICAgZW50cmllczogYnVmZmVycy5tYXAoKGJ1ZmZlciwgYmluZGluZykgPT4gKHsgYmluZGluZywgcmVzb3VyY2U6IHsgYnVmZmVyIH0gfSkpLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGwgYWZ0ZXIgdGhlIGZyYW1lJ3MgY29tbWFuZHMgd2VyZSBzdWJtaXR0ZWQuIFJlbGVhc2VzIHRoZSBhbGxvY2F0aW9ucyBvZiB0aGUgZHJvcHBlZCBidW5kbGVzLCBhbmQgZ3Jvd3MgdGhlXG4gICAqIHRhYmxlcyB3aGVuIGFuIGFsbG9jYXRpb24gZmFpbGVkLlxuICAgKlxuICAgKiBAcmV0dXJucyBUcnVlIHdoZW4gdGhlIHRhYmxlcyB3ZXJlIHJlY3JlYXRlZDogZXZlcnkgcmVuZGVyIGJ1bmRsZSByZWNvcmRlZCBiZWZvcmUgbXVzdCBiZSBkcm9wcGVkXG4gICAqL1xuICBhZnRlclN1Ym1pdCgpOiBib29sZWFuIHtcbiAgICBjb25zdCByZWdpc3RyeSA9IHRoaXMuX19yZWdpc3RyeTtcbiAgICBjb25zdCByZWxlYXNlZCA9IHJlZ2lzdHJ5LnJlbGVhc2VSZXRpcmVkKCk7XG4gICAgaWYgKHJlbGVhc2VkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGdyb3VwcyA9IHRoaXMuX19ncm91cHNVMzI7XG4gICAgICBmb3IgKGNvbnN0IGdyb3VwIG9mIHJlbGVhc2VkLmdyb3Vwcykge1xuICAgICAgICAvLyBBbiB1bnVzZWQgZ3JvdXAgc2xvdCBjdWxscyBub3RoaW5nIGFuZCByZXBvcnRzIDAgdmlzaWJsZSBpbnN0YW5jZXMuXG4gICAgICAgIGdyb3Vwc1tncm91cC5pbmRleCAqIDQgKyAxXSA9IDA7XG4gICAgICAgIHRoaXMuX19ncm91cHNEaXJ0eS5hZGQoZ3JvdXAuaW5kZXgsIGdyb3VwLmluZGV4ICsgMSk7XG4gICAgICAgIGNvbnN0IGNodW5rcyA9IHRoaXMuX19jaHVua3NVMzI7XG4gICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgZ3JvdXAuY2h1bmtDb3VudDsgaysrKSB7XG4gICAgICAgICAgY2h1bmtzWyhncm91cC5jaHVua0Jhc2UgKyBrKSAqIDJdID0gSW52YWxpZEdyb3VwO1xuICAgICAgICAgIGNodW5rc1soZ3JvdXAuY2h1bmtCYXNlICsgaykgKiAyICsgMV0gPSAwO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX19jaHVua3NEaXJ0eS5hZGQoZ3JvdXAuY2h1bmtCYXNlLCBncm91cC5jaHVua0Jhc2UgKyBncm91cC5jaHVua0NvdW50KTtcbiAgICAgICAgY29uc3QgZ3JvdXBFbnRyeSA9IHRoaXMuX19ncm91cFZlcnRleFJhbmdlc1tncm91cC5pbmRleF07XG4gICAgICAgIGlmIChncm91cEVudHJ5Py5ncm91cCA9PT0gZ3JvdXApIHtcbiAgICAgICAgICBpZiAoZ3JvdXBFbnRyeS5kZWZvcm0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5fX2RlZm9ybWVyLnJlbGVhc2UoZ3JvdXBFbnRyeS5kZWZvcm0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLl9fZ3JvdXBWZXJ0ZXhSYW5nZXNbZ3JvdXAuaW5kZXhdID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCBkcmF3R3JvdXBzID0gdGhpcy5fX2RyYXdHcm91cHNVMzI7XG4gICAgICBmb3IgKGNvbnN0IGRyYXcgb2YgcmVsZWFzZWQuZHJhd3MpIHtcbiAgICAgICAgZHJhd0dyb3Vwc1tkcmF3XSA9IEludmFsaWRHcm91cDtcbiAgICAgICAgdGhpcy5fX2RyYXdHcm91cHNEaXJ0eS5hZGQoZHJhdywgZHJhdyArIDEpO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBkZWZvcm1lciA9IHRoaXMuX19kZWZvcm1lcjtcbiAgICBjb25zdCBjdWxsaW5nQ2FwYWNpdGllcyA9IHRoaXMuX19nZXRHcm93bkNhcGFjaXRpZXMoKTtcbiAgICBjb25zdCBkZWZvcm1DYXBhY2l0aWVzID0gZGVmb3JtZXIuZ2V0R3Jvd25DYXBhY2l0aWVzKCk7XG4gICAgaWYgKGN1bGxpbmdDYXBhY2l0aWVzID09PSB1bmRlZmluZWQgJiYgZGVmb3JtQ2FwYWNpdGllcyA9PT0gdW5kZWZpbmVkICYmICFkZWZvcm1lci5pc1Jlc2V0UmVxdWVzdGVkKSB7XG4gICAgICAvLyBOb3RoaW5nIG92ZXJmbG93ZWQsIG9yIHRoZSBkZXZpY2UgbGltaXRzIGFyZSByZWFjaGVkOiBrZWVwIHRoZSB0YWJsZXM7IHRoZSBkcmF3cyB0aGF0IGRvIG5vdCBmaXQgc3RheSB1bmN1bGxlZC5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gVGhlIGN1bGwgZ3JvdXBzIHJlZmVyIHRvIHRoZSBkZWZvcm1hdGlvbiBlbnRyaWVzIChhbmQgdGhlIGJ1bmRsZXMgdG8gYm90aCksIHNvIGJvdGggc3RhcnQgb3Zlci5cbiAgICBjb25zdCBjYXBhY2l0aWVzID0gY3VsbGluZ0NhcGFjaXRpZXMgPz8geyAuLi5yZWdpc3RyeS5jYXBhY2l0aWVzIH07XG4gICAgdGhpcy5fX2Rlc3Ryb3lUYWJsZXMoKTtcbiAgICB0aGlzLl9fY3JlYXRlVGFibGVzKGNhcGFjaXRpZXMpO1xuICAgIHJlZ2lzdHJ5LnJlc2V0KGNhcGFjaXRpZXMpO1xuICAgIGRlZm9ybWVyLnJlc2V0KGRlZm9ybUNhcGFjaXRpZXMgPz8geyAuLi5kZWZvcm1lci5jYXBhY2l0aWVzIH0pO1xuICAgIHRoaXMuX19ncm91cFZlcnRleFJhbmdlcy5sZW5ndGggPSAwO1xuICAgIHRoaXMuX19pbnB1dHNEaXJ0eSA9IHRydWU7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogVGhlIGNhcGFjaXRpZXMgdGhlIGN1bGxpbmcgdGFibGVzIG11c3QgZ3JvdyB0byBhZnRlciBhbiBhbGxvY2F0aW9uIGZhaWxlZCwgb3IgdW5kZWZpbmVkIHdoZW4gdGhleSBkaWQgbm90XG4gICAqIG92ZXJmbG93IG9yIGNhbm5vdCBncm93ICh0aGUgZGV2aWNlIGxpbWl0cyBhcmUgcmVhY2hlZCkuXG4gICAqL1xuICBwcml2YXRlIF9fZ2V0R3Jvd25DYXBhY2l0aWVzKCk6IEdwdUN1bGxpbmdDYXBhY2l0aWVzIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCByZWdpc3RyeSA9IHRoaXMuX19yZWdpc3RyeTtcbiAgICBpZiAoIXJlZ2lzdHJ5LmlzT3ZlcmZsb3dlZCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgY29uc3QgcmVxdWlyZWQgPSByZWdpc3RyeS5yZXF1aXJlZENhcGFjaXRpZXM7XG4gICAgY29uc3QgY3VycmVudCA9IHJlZ2lzdHJ5LmNhcGFjaXRpZXM7XG4gICAgY29uc3QgbGltaXRzID0gdGhpcy5fX2RldmljZS5saW1pdHM7XG4gICAgY29uc3QgbWF4Qnl0ZXMgPSBNYXRoLm1pbihsaW1pdHMubWF4U3RvcmFnZUJ1ZmZlckJpbmRpbmdTaXplLCBsaW1pdHMubWF4QnVmZmVyU2l6ZSk7XG4gICAgLy8gT25seSB0aGUgdGFibGVzIHRoYXQgYXJlIHRvbyBzbWFsbCBncm93IChieSBwb3dlcnMgb2YgdHdvLCB3aXRoIHNvbWUgaGVhZHJvb20pLlxuICAgIGNvbnN0IGdyb3cgPSAoY2FwYWNpdHk6IG51bWJlciwgbmVlZGVkOiBudW1iZXIsIGJ5dGVzUGVyU2xvdDogbnVtYmVyKSA9PiB7XG4gICAgICBsZXQgbmV4dCA9IGNhcGFjaXR5O1xuICAgICAgd2hpbGUgKG5leHQgPCBuZWVkZWQgKiAxLjI1KSB7XG4gICAgICAgIG5leHQgKj0gMjtcbiAgICAgIH1cbiAgICAgIHJldHVybiBNYXRoLm1heChjYXBhY2l0eSwgTWF0aC5taW4obmV4dCwgTWF0aC5mbG9vcihtYXhCeXRlcyAvIGJ5dGVzUGVyU2xvdCkpKTtcbiAgICB9O1xuICAgIGNvbnN0IGNhcGFjaXRpZXM6IEdwdUN1bGxpbmdDYXBhY2l0aWVzID0ge1xuICAgICAgaW5zdGFuY2VzOiBncm93KGN1cnJlbnQuaW5zdGFuY2VzLCByZXF1aXJlZC5pbnN0YW5jZXMsIFJlY29yZEJ5dGVTaXplKSxcbiAgICAgIGdyb3VwczogZ3JvdyhjdXJyZW50Lmdyb3VwcywgcmVxdWlyZWQuZ3JvdXBzLCBHcm91cEJ5dGVTaXplKSxcbiAgICAgIGRyYXdzOiBncm93KGN1cnJlbnQuZHJhd3MsIHJlcXVpcmVkLmRyYXdzLCBHcHVDdWxsaW5nQXJnc0J5dGVTaXplKSxcbiAgICAgIGNodW5rczogZ3JvdyhjdXJyZW50LmNodW5rcywgcmVxdWlyZWQuY2h1bmtzLCBDaHVua0J5dGVTaXplKSxcbiAgICB9O1xuICAgIGlmIChcbiAgICAgIGNhcGFjaXRpZXMuaW5zdGFuY2VzID09PSBjdXJyZW50Lmluc3RhbmNlcyAmJlxuICAgICAgY2FwYWNpdGllcy5ncm91cHMgPT09IGN1cnJlbnQuZ3JvdXBzICYmXG4gICAgICBjYXBhY2l0aWVzLmRyYXdzID09PSBjdXJyZW50LmRyYXdzICYmXG4gICAgICBjYXBhY2l0aWVzLmNodW5rcyA9PT0gY3VycmVudC5jaHVua3NcbiAgICApIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiBjYXBhY2l0aWVzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbGVhc2VzIHRoZSBHUFUgcmVzb3VyY2VzLlxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLl9fZGVzdHJveVRhYmxlcygpO1xuICAgIHRoaXMuX19kZWZvcm1lci5kZXN0cm95KCk7XG4gICAgdGhpcy5fX3BhcmFtc0J1ZmZlci5kZXN0cm95KCk7XG4gICAgdGhpcy5fX3ZpZXdzQnVmZmVyPy5kZXN0cm95KCk7XG4gICAgdGhpcy5fX3ZpZXdzQnVmZmVyID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2NyZWF0ZVRhYmxlcyhjYXBhY2l0aWVzOiBHcHVDdWxsaW5nQ2FwYWNpdGllcykge1xuICAgIGNvbnN0IGRldmljZSA9IHRoaXMuX19kZXZpY2U7XG4gICAgY29uc3QgdXNhZ2UgPSBHUFVCdWZmZXJVc2FnZS5TVE9SQUdFIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1Q7XG4gICAgdGhpcy5fX3JlY29yZHNCdWZmZXIgPSBkZXZpY2UuY3JlYXRlQnVmZmVyKHtcbiAgICAgIGxhYmVsOiAnR3B1Q3VsbGluZy5yZWNvcmRzJyxcbiAgICAgIHNpemU6IGNhcGFjaXRpZXMuaW5zdGFuY2VzICogUmVjb3JkQnl0ZVNpemUsXG4gICAgICB1c2FnZSxcbiAgICB9KTtcbiAgICB0aGlzLl9fZ3JvdXBzQnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG4gICAgICBsYWJlbDogJ0dwdUN1bGxpbmcuZ3JvdXBzJyxcbiAgICAgIHNpemU6IGNhcGFjaXRpZXMuZ3JvdXBzICogR3JvdXBCeXRlU2l6ZSxcbiAgICAgIHVzYWdlLFxuICAgIH0pO1xuICAgIHRoaXMuX192aXNpYmxlQ291bnRzQnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG4gICAgICBsYWJlbDogJ0dwdUN1bGxpbmcudmlzaWJsZUNvdW50cycsXG4gICAgICBzaXplOiBjYXBhY2l0aWVzLmdyb3VwcyAqIDQsXG4gICAgICB1c2FnZTogR1BVQnVmZmVyVXNhZ2UuU1RPUkFHRSxcbiAgICB9KTtcbiAgICB0aGlzLl9fZHJhd0dyb3Vwc0J1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuICAgICAgbGFiZWw6ICdHcHVDdWxsaW5nLmRyYXdHcm91cHMnLFxuICAgICAgc2l6ZTogY2FwYWNpdGllcy5kcmF3cyAqIDQsXG4gICAgICB1c2FnZSxcbiAgICB9KTtcbiAgICAvLyBCb3VuZCBpbiB0aGUgcmVuZGVyIGJ1bmRsZXM6IHJlcGxhY2luZyB0aGVtIHJlcXVpcmVzIHJlLXJlY29yZGluZyB0aGUgYnVuZGxlcy5cbiAgICB0aGlzLl9fdmlzaWJsZUlkc0J1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuICAgICAgbGFiZWw6ICdHcHVDdWxsaW5nLnZpc2libGVJZHMnLFxuICAgICAgc2l6ZTogY2FwYWNpdGllcy5pbnN0YW5jZXMgKiBJbnN0YW5jZUJ5dGVTaXplLFxuICAgICAgdXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlZFUlRFWCB8IEdQVUJ1ZmZlclVzYWdlLlNUT1JBR0UsXG4gICAgfSk7XG4gICAgdGhpcy5fX2NodW5rc0J1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuICAgICAgbGFiZWw6ICdHcHVDdWxsaW5nLmNodW5rcycsXG4gICAgICBzaXplOiBjYXBhY2l0aWVzLmNodW5rcyAqIENodW5rQnl0ZVNpemUsXG4gICAgICB1c2FnZSxcbiAgICB9KTtcbiAgICB0aGlzLl9fY2h1bmtDb3VudHNCdWZmZXIgPSBkZXZpY2UuY3JlYXRlQnVmZmVyKHtcbiAgICAgIGxhYmVsOiAnR3B1Q3VsbGluZy5jaHVua0NvdW50cycsXG4gICAgICBzaXplOiBjYXBhY2l0aWVzLmNodW5rcyAqIDQsXG4gICAgICB1c2FnZTogR1BVQnVmZmVyVXNhZ2UuU1RPUkFHRSxcbiAgICB9KTtcbiAgICB0aGlzLl9fY2h1bmtPZmZzZXRzQnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG4gICAgICBsYWJlbDogJ0dwdUN1bGxpbmcuY2h1bmtPZmZzZXRzJyxcbiAgICAgIHNpemU6IGNhcGFjaXRpZXMuY2h1bmtzICogNCxcbiAgICAgIHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5TVE9SQUdFLFxuICAgIH0pO1xuICAgIHRoaXMuX19zY3JhdGNoSWRzQnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG4gICAgICBsYWJlbDogJ0dwdUN1bGxpbmcuc2NyYXRjaElkcycsXG4gICAgICBzaXplOiBjYXBhY2l0aWVzLmluc3RhbmNlcyAqIEluc3RhbmNlQnl0ZVNpemUsXG4gICAgICB1c2FnZTogR1BVQnVmZmVyVXNhZ2UuU1RPUkFHRSxcbiAgICB9KTtcbiAgICB0aGlzLl9fYXJnc0J1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuICAgICAgbGFiZWw6ICdHcHVDdWxsaW5nLmFyZ3MnLFxuICAgICAgc2l6ZTogY2FwYWNpdGllcy5kcmF3cyAqIEdwdUN1bGxpbmdBcmdzQnl0ZVNpemUsXG4gICAgICAvLyBDT1BZX1NSQyBsZXRzIHRlc3RzIGFuZCB0b29scyByZWFkIGJhY2sgdGhlIGN1bGxlZCBpbnN0YW5jZSBjb3VudHMuXG4gICAgICB1c2FnZTogR1BVQnVmZmVyVXNhZ2UuSU5ESVJFQ1QgfCBHUFVCdWZmZXJVc2FnZS5TVE9SQUdFIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QgfCBHUFVCdWZmZXJVc2FnZS5DT1BZX1NSQyxcbiAgICB9KTtcblxuICAgIHRoaXMuX19yZWNvcmRzQXJyYXlCdWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIoY2FwYWNpdGllcy5pbnN0YW5jZXMgKiBSZWNvcmRCeXRlU2l6ZSk7XG4gICAgdGhpcy5fX3JlY29yZHNVMzIgPSBuZXcgVWludDMyQXJyYXkodGhpcy5fX3JlY29yZHNBcnJheUJ1ZmZlcik7XG4gICAgdGhpcy5fX3JlY29yZHNGMzIgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMuX19yZWNvcmRzQXJyYXlCdWZmZXIpO1xuICAgIHRoaXMuX19ncm91cHNVMzIgPSBuZXcgVWludDMyQXJyYXkoY2FwYWNpdGllcy5ncm91cHMgKiA0KTtcbiAgICB0aGlzLl9fZHJhd0dyb3Vwc1UzMiA9IG5ldyBVaW50MzJBcnJheShjYXBhY2l0aWVzLmRyYXdzKS5maWxsKEludmFsaWRHcm91cCk7XG4gICAgdGhpcy5fX2FyZ3NVMzIgPSBuZXcgVWludDMyQXJyYXkoY2FwYWNpdGllcy5kcmF3cyAqIEFyZ3NXb3JkU2l6ZSk7XG4gICAgdGhpcy5fX2NodW5rc1UzMiA9IG5ldyBVaW50MzJBcnJheShjYXBhY2l0aWVzLmNodW5rcyAqIDIpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2FwYWNpdGllcy5jaHVua3M7IGkrKykge1xuICAgICAgdGhpcy5fX2NodW5rc1UzMltpICogMl0gPSBJbnZhbGlkR3JvdXA7XG4gICAgfVxuICAgIC8vIFRoZSBuZXcgYnVmZmVycyBhcmUgdW5pbml0aWFsaXplZDogdXBsb2FkIHRoZSB3aG9sZSBkcmF3IGdyb3VwIHRhYmxlIChhbGwgaW52YWxpZCkgYW5kIHRoZSBncm91cCB0YWJsZSAoYWxsXG4gICAgLy8gdW51c2VkKSBvbmNlLCBzbyB0aGUgZGlzcGF0Y2hlcyBuZXZlciByZWFkIGdhcmJhZ2UuXG4gICAgdGhpcy5fX3JlY29yZHNEaXJ0eS5jbGVhcigpO1xuICAgIHRoaXMuX19ncm91cHNEaXJ0eS5jbGVhcigpO1xuICAgIHRoaXMuX19ncm91cHNEaXJ0eS5hZGQoMCwgY2FwYWNpdGllcy5ncm91cHMpO1xuICAgIHRoaXMuX19kcmF3R3JvdXBzRGlydHkuY2xlYXIoKTtcbiAgICB0aGlzLl9fZHJhd0dyb3Vwc0RpcnR5LmFkZCgwLCBjYXBhY2l0aWVzLmRyYXdzKTtcbiAgICB0aGlzLl9fYXJnc0RpcnR5LmNsZWFyKCk7XG4gICAgdGhpcy5fX2NodW5rc0RpcnR5LmNsZWFyKCk7XG4gICAgdGhpcy5fX2NodW5rc0RpcnR5LmFkZCgwLCBjYXBhY2l0aWVzLmNodW5rcyk7XG4gICAgdGhpcy5fX3Jlc2V0QmluZEdyb3VwcygpO1xuICB9XG5cbiAgcHJpdmF0ZSBfX3Jlc2V0QmluZEdyb3VwcygpIHtcbiAgICBjb25zdCBwYXNzZXMgPSB0aGlzLl9fcGFzc2VzO1xuICAgIHBhc3Nlcy5jdWxsLmJpbmRHcm91cCA9IHVuZGVmaW5lZDtcbiAgICBwYXNzZXMucHJlZml4LmJpbmRHcm91cCA9IHVuZGVmaW5lZDtcbiAgICBwYXNzZXMuc2NhdHRlci5iaW5kR3JvdXAgPSB1bmRlZmluZWQ7XG4gICAgcGFzc2VzLmZpbmFsaXplLmJpbmRHcm91cCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fY3VsbEJpbmRHcm91cFN0b3JhZ2VCdWZmZXIgPSB1bmRlZmluZWQ7XG4gIH1cblxuICBwcml2YXRlIF9fZGVzdHJveVRhYmxlcygpIHtcbiAgICB0aGlzLl9fcmVjb3Jkc0J1ZmZlcj8uZGVzdHJveSgpO1xuICAgIHRoaXMuX19ncm91cHNCdWZmZXI/LmRlc3Ryb3koKTtcbiAgICB0aGlzLl9fdmlzaWJsZUNvdW50c0J1ZmZlcj8uZGVzdHJveSgpO1xuICAgIHRoaXMuX19kcmF3R3JvdXBzQnVmZmVyPy5kZXN0cm95KCk7XG4gICAgdGhpcy5fX3Zpc2libGVJZHNCdWZmZXI/LmRlc3Ryb3koKTtcbiAgICB0aGlzLl9fYXJnc0J1ZmZlcj8uZGVzdHJveSgpO1xuICAgIHRoaXMuX19jaHVua3NCdWZmZXI/LmRlc3Ryb3koKTtcbiAgICB0aGlzLl9fY2h1bmtDb3VudHNCdWZmZXI/LmRlc3Ryb3koKTtcbiAgICB0aGlzLl9fY2h1bmtPZmZzZXRzQnVmZmVyPy5kZXN0cm95KCk7XG4gICAgdGhpcy5fX3NjcmF0Y2hJZHNCdWZmZXI/LmRlc3Ryb3koKTtcbiAgfVxuXG4gIHByaXZhdGUgX191cGxvYWREaXJ0eShidWZmZXI6IEdQVUJ1ZmZlciwgbWlycm9yOiBVaW50MzJBcnJheSwgZGlydHk6IERpcnR5UmFuZ2UsIHdvcmRzUGVyU2xvdDogbnVtYmVyKSB7XG4gICAgaWYgKGRpcnR5LmlzRW1wdHkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgYmVnaW4gPSBkaXJ0eS5taW4gKiB3b3Jkc1BlclNsb3Q7XG4gICAgY29uc3QgZW5kID0gTWF0aC5taW4oZGlydHkubWF4ICogd29yZHNQZXJTbG90LCBtaXJyb3IubGVuZ3RoKTtcbiAgICB0aGlzLl9fZGV2aWNlLnF1ZXVlLndyaXRlQnVmZmVyKGJ1ZmZlciwgYmVnaW4gKiA0LCBtaXJyb3IsIGJlZ2luLCBlbmQgLSBiZWdpbik7XG4gICAgZGlydHkuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXdyaXRlcyB0aGUgcmVjb3JkcyBvZiB0aGUgZ3JvdXBzIHdob3NlIG1lc2ggdmVydGV4IHBvc2l0aW9ucyB3ZXJlIHVwZGF0ZWQgYWZ0ZXIgdGhlIHJlY29yZHMgd2VyZSB3cml0dGVuXG4gICAqICh0aGUgbG9jYWwgQUFCQiBjaGFuZ2VkIHdoaWxlIHRoZSByZW5kZXIgYnVuZGxlcyBzdGF5ZWQgdmFsaWQpLlxuICAgKi9cbiAgcHJpdmF0ZSBfX3JlZnJlc2hDaGFuZ2VkQm91bmRzKCkge1xuICAgIGNvbnN0IGVudHJpZXMgPSB0aGlzLl9fZ3JvdXBWZXJ0ZXhSYW5nZXM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbnRyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbnRyeSA9IGVudHJpZXNbaV07XG4gICAgICBpZiAoZW50cnkgPT09IHVuZGVmaW5lZCB8fCBlbnRyeS5tZXNoLnByaW1pdGl2ZVBvc2l0aW9uVXBkYXRlQ291bnQgPT09IGVudHJ5LnBvc2l0aW9uVXBkYXRlQ291bnQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBlbnRyeS5wb3NpdGlvblVwZGF0ZUNvdW50ID0gZW50cnkubWVzaC5wcmltaXRpdmVQb3NpdGlvblVwZGF0ZUNvdW50O1xuICAgICAgdGhpcy5fX3dyaXRlR3JvdXAoZW50cnkuZW5naW5lLCBlbnRyeS5tZXNoLCBlbnRyeS5ncm91cCwgZW50cnkuZW50aXR5SW5mbywgZW50cnkuZGVmb3JtKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogV3JpdGVzIHRoZSBncm91cCB0YWJsZSBlbnRyeSBhbmQgdGhlIHBlci1pbnN0YW5jZSByZWNvcmRzIG9mIGEgZ3JvdXAuXG4gICAqIFRoZSByZWNvcmRzIG9mIGEgZGVmb3JtZWQgZ3JvdXAgcG9pbnQgdG8gdGhlIGRlZm9ybWVkIHZlcnRpY2VzIChpbnN0YW5jZSBpZHMgdykgYW5kIGJvdW5kaW5nIGJveCBvZiBlYWNoIGluc3RhbmNlLlxuICAgKi9cbiAgcHJpdmF0ZSBfX3dyaXRlR3JvdXAoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgbWVzaDogTWVzaCxcbiAgICBncm91cDogR3B1Q3VsbGluZ0dyb3VwLFxuICAgIGVudGl0eUluZm86IFVpbnQzMkFycmF5LFxuICAgIGRlZm9ybTogR3B1RGVmb3JtRW50cnkgfCB1bmRlZmluZWRcbiAgKSB7XG4gICAgY29uc3QgZ3JvdXBzID0gdGhpcy5fX2dyb3Vwc1UzMjtcbiAgICBjb25zdCBnID0gZ3JvdXAuaW5kZXggKiA0O1xuICAgIGdyb3Vwc1tnXSA9IGdyb3VwLnJhbmdlQmFzZTtcbiAgICBncm91cHNbZyArIDFdID0gZ3JvdXAuaW5zdGFuY2VDb3VudDtcbiAgICBncm91cHNbZyArIDJdID0gZ3JvdXAudmlld0luZGV4O1xuICAgIGdyb3Vwc1tnICsgM10gPSBncm91cC5jaHVua0Jhc2U7XG4gICAgdGhpcy5fX2dyb3Vwc0RpcnR5LmFkZChncm91cC5pbmRleCwgZ3JvdXAuaW5kZXggKyAxKTtcbiAgICBjb25zdCBjaHVua3MgPSB0aGlzLl9fY2h1bmtzVTMyO1xuICAgIGZvciAobGV0IGsgPSAwOyBrIDwgZ3JvdXAuY2h1bmtDb3VudDsgaysrKSB7XG4gICAgICBjaHVua3NbKGdyb3VwLmNodW5rQmFzZSArIGspICogMl0gPSBncm91cC5pbmRleDtcbiAgICAgIGNodW5rc1soZ3JvdXAuY2h1bmtCYXNlICsgaykgKiAyICsgMV0gPSBrICogR3B1Q3VsbGluZ0NodW5rU2l6ZTtcbiAgICB9XG4gICAgdGhpcy5fX2NodW5rc0RpcnR5LmFkZChncm91cC5jaHVua0Jhc2UsIGdyb3VwLmNodW5rQmFzZSArIGdyb3VwLmNodW5rQ291bnQpO1xuXG4gICAgLy8gVGhlIHN0b3JhZ2UgbG9jYXRpb25zIG9mIHRoZSBTY2VuZUdyYXBoQ29tcG9uZW50IG1lbWJlcnMsIHdpdGggdGhlIHNhbWUgZm9ybXVsYSBhcyB0aGUgZ2V0dGVycyBnZW5lcmF0ZWQgYnlcbiAgICAvLyBXZWJHcHVTdHJhdGVneUJhc2ljLmdldFZlcnRleFNoYWRlck1ldGhvZERlZmluaXRpb25zX3N0b3JhZ2VCdWZmZXIuXG4gICAgY29uc3QgY291bnRQZXJCdWZmZXJWaWV3ID0gQ29tcG9uZW50LmdldENvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldyhlbmdpbmUpLmdldChTY2VuZUdyYXBoQ29tcG9uZW50KSA/PyAxO1xuICAgIGNvbnN0IHdvcmxkTWF0cml4T2Zmc2V0cyA9IENvbXBvbmVudC5nZXRMb2NhdGlvbk9mZnNldE9mTWVtYmVyT2ZDb21wb25lbnQoXG4gICAgICBlbmdpbmUsXG4gICAgICBTY2VuZUdyYXBoQ29tcG9uZW50LFxuICAgICAgJ3dvcmxkTWF0cml4J1xuICAgICk7XG4gICAgY29uc3QgaXNWaXNpYmxlT2Zmc2V0cyA9IENvbXBvbmVudC5nZXRMb2NhdGlvbk9mZnNldE9mTWVtYmVyT2ZDb21wb25lbnQoZW5naW5lLCBTY2VuZUdyYXBoQ29tcG9uZW50LCAnaXNWaXNpYmxlJyk7XG4gICAgY29uc3QgaXNCaWxsYm9hcmRPZmZzZXRzID0gQ29tcG9uZW50LmdldExvY2F0aW9uT2Zmc2V0T2ZNZW1iZXJPZkNvbXBvbmVudChcbiAgICAgIGVuZ2luZSxcbiAgICAgIFNjZW5lR3JhcGhDb21wb25lbnQsXG4gICAgICAnaXNCaWxsYm9hcmQnXG4gICAgKTtcblxuICAgIGNvbnN0IGFhYmIgPSBtZXNoLkFBQkI7XG4gICAgY29uc3QgaXNBYWJiVmFsaWQgPSAhYWFiYi5pc1ZhbmlsbGEoKTtcbiAgICBjb25zdCBtaW5Qb2ludCA9IGFhYmIubWluUG9pbnQuX3Y7XG4gICAgY29uc3QgbWF4UG9pbnQgPSBhYWJiLm1heFBvaW50Ll92O1xuICAgIGNvbnN0IGN4ID0gKG1pblBvaW50WzBdICsgbWF4UG9pbnRbMF0pICogMC41O1xuICAgIGNvbnN0IGN5ID0gKG1pblBvaW50WzFdICsgbWF4UG9pbnRbMV0pICogMC41O1xuICAgIGNvbnN0IGN6ID0gKG1pblBvaW50WzJdICsgbWF4UG9pbnRbMl0pICogMC41O1xuICAgIGNvbnN0IGV4ID0gKG1heFBvaW50WzBdIC0gbWluUG9pbnRbMF0pICogMC41O1xuICAgIGNvbnN0IGV5ID0gKG1heFBvaW50WzFdIC0gbWluUG9pbnRbMV0pICogMC41O1xuICAgIGNvbnN0IGV6ID0gKG1heFBvaW50WzJdIC0gbWluUG9pbnRbMl0pICogMC41O1xuXG4gICAgY29uc3QgdTMyID0gdGhpcy5fX3JlY29yZHNVMzI7XG4gICAgY29uc3QgZjMyID0gdGhpcy5fX3JlY29yZHNGMzI7XG4gICAgY29uc3QgZW50aXRpZXMgPSBtZXNoLm1lc2hFbnRpdGllc0lubmVyO1xuICAgIGNvbnN0IGRlZm9ybWVyID0gdGhpcy5fX2RlZm9ybWVyO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ3JvdXAuaW5zdGFuY2VDb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCByID0gKGdyb3VwLnJhbmdlQmFzZSArIGkpICogUmVjb3JkV29yZFNpemU7XG4gICAgICBjb25zdCBzaWQgPSBlbnRpdHlJbmZvWzQgKiBpXTtcbiAgICAgIGNvbnN0IGJ1ZmZlclZpZXdJbmRleCA9IE1hdGguZmxvb3Ioc2lkIC8gY291bnRQZXJCdWZmZXJWaWV3KTtcbiAgICAgIGNvbnN0IGluZGV4SW5CdWZmZXJWaWV3ID0gc2lkICUgY291bnRQZXJCdWZmZXJWaWV3O1xuICAgICAgdTMyW3JdID0gc2lkO1xuICAgICAgdTMyW3IgKyAxXSA9IGVudGl0eUluZm9bNCAqIGkgKyAxXTtcbiAgICAgIHUzMltyICsgMl0gPSBlbnRpdHlJbmZvWzQgKiBpICsgMl07XG4gICAgICAvLyAxICsgdGhlIGZpcnN0IGRlZm9ybWVkIHZlcnRleCBvZiB0aGUgaW5zdGFuY2UsIHJlYWQgYnkgcHJvY2Vzc0dlb21ldHJ5ICgwOiBkZWZvcm1lZCBpbiB0aGUgdmVydGV4IHNoYWRlcikuXG4gICAgICB1MzJbciArIDNdID0gZGVmb3JtICE9PSB1bmRlZmluZWQgPyBkZWZvcm1lci5nZXRJbnN0YW5jZURlZm9ybWVkQmFzZShkZWZvcm0sIGkpICsgMSA6IGVudGl0eUluZm9bNCAqIGkgKyAzXTtcbiAgICAgIGYzMltyICsgNF0gPSBjeDtcbiAgICAgIGYzMltyICsgNV0gPSBjeTtcbiAgICAgIGYzMltyICsgNl0gPSBjejtcbiAgICAgIHUzMltyICsgN10gPSAod29ybGRNYXRyaXhPZmZzZXRzW2J1ZmZlclZpZXdJbmRleF0gPz8gMCkgKyA0ICogaW5kZXhJbkJ1ZmZlclZpZXc7XG4gICAgICBmMzJbciArIDhdID0gZXg7XG4gICAgICBmMzJbciArIDldID0gZXk7XG4gICAgICBmMzJbciArIDEwXSA9IGV6O1xuICAgICAgdTMyW3IgKyAxMV0gPSAoaXNWaXNpYmxlT2Zmc2V0c1tidWZmZXJWaWV3SW5kZXhdID8/IDApICogNCArIGluZGV4SW5CdWZmZXJWaWV3O1xuICAgICAgdTMyW3IgKyAxMl0gPSAoaXNCaWxsYm9hcmRPZmZzZXRzW2J1ZmZlclZpZXdJbmRleF0gPz8gMCkgKiA0ICsgaW5kZXhJbkJ1ZmZlclZpZXc7XG4gICAgICAvLyBUaGUgc2FtZSBleGNlcHRpb24gYXMgdGhlIENQVSBjdWxsaW5nIChNZXNoUmVuZGVyZXJDb21wb25lbnQuX19jdWxsaW5nV2l0aFZpZXdGcnVzdHVtKS5cbiAgICAgIGNvbnN0IGlzQmFja2dyb3VuZEFzc2V0ID0gZW50aXRpZXNbaV0/LmdldFRhZ1ZhbHVlKCd0eXBlJykgPT09ICdiYWNrZ3JvdW5kLWFzc2V0cyc7XG4gICAgICBpZiAoZGVmb3JtICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gVGhlIGJvdW5kaW5nIGJveCBvZiB0aGUgZGVmb3JtZWQgdmVydGljZXMgaXMgY29tcHV0ZWQgb24gdGhlIEdQVS5cbiAgICAgICAgdTMyW3IgKyAxM10gPSBGbGFnRGVmb3JtZWQgfCAoaXNCYWNrZ3JvdW5kQXNzZXQgPyBGbGFnQWx3YXlzVmlzaWJsZSA6IDApO1xuICAgICAgICB1MzJbciArIDE0XSA9IGRlZm9ybWVyLmdldEluc3RhbmNlQm91bmRzU2xvdChkZWZvcm0sIGkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdTMyW3IgKyAxM10gPSAhaXNBYWJiVmFsaWQgfHwgaXNCYWNrZ3JvdW5kQXNzZXQgPyBGbGFnQWx3YXlzVmlzaWJsZSA6IDA7XG4gICAgICAgIHUzMltyICsgMTRdID0gMDtcbiAgICAgIH1cbiAgICAgIHUzMltyICsgMTVdID0gMDtcbiAgICB9XG4gICAgdGhpcy5fX3JlY29yZHNEaXJ0eS5hZGQoZ3JvdXAucmFuZ2VCYXNlLCBncm91cC5yYW5nZUJhc2UgKyBncm91cC5pbnN0YW5jZUNvdW50KTtcbiAgfVxuXG4gIHByaXZhdGUgX19nZXRPckNyZWF0ZVZpZXcoZW5naW5lOiBFbmdpbmUsIGNhbWVyYVNJRDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBpZiAoY2FtZXJhU0lEIDwgMCkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICBjb25zdCBjYW1lcmEgPSBlbmdpbmUuY29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnQoQ2FtZXJhQ29tcG9uZW50LCBjYW1lcmFTSUQpIGFzIENhbWVyYUNvbXBvbmVudCB8IHVuZGVmaW5lZDtcbiAgICBpZiAoY2FtZXJhID09IG51bGwpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgbGV0IHZpZXdJbmRleCA9IHRoaXMuX192aWV3SW5kZXhPZkNhbWVyYS5nZXQoY2FtZXJhKTtcbiAgICBpZiAodmlld0luZGV4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHZpZXdJbmRleCA9IHRoaXMuX192aWV3cy5sZW5ndGg7XG4gICAgICB0aGlzLl9fdmlld3MucHVzaCh7IGNhbWVyYSB9KTtcbiAgICAgIHRoaXMuX192aWV3SW5kZXhPZkNhbWVyYS5zZXQoY2FtZXJhLCB2aWV3SW5kZXgpO1xuICAgIH1cbiAgICByZXR1cm4gdmlld0luZGV4O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXB1dGVzIHRoZSBmcnVzdGEgb2YgdGhlIHZpZXdzIGZyb20gdGhlaXIgY2FtZXJhcyBhbmQgdXBsb2FkcyB0aGVtIHdoZW4gdGhleSBjaGFuZ2VkLlxuICAgKiBAcmV0dXJucyBUcnVlIHdoZW4gYSB2aWV3IGNoYW5nZWRcbiAgICovXG4gIHByaXZhdGUgX191cGRhdGVWaWV3cygpOiBib29sZWFuIHtcbiAgICBjb25zdCB2aWV3cyA9IHRoaXMuX192aWV3cztcbiAgICBjb25zdCB2aWV3Q291bnQgPSB2aWV3cy5sZW5ndGg7XG4gICAgaWYgKHZpZXdDb3VudCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBsZXQgcmVzaXplZCA9IGZhbHNlO1xuICAgIGlmICh0aGlzLl9fdmlld3NCdWZmZXIgPT0gbnVsbCB8fCB0aGlzLl9fdmlld3NDYXBhY2l0eSA8IHZpZXdDb3VudCkge1xuICAgICAgdGhpcy5fX3ZpZXdzQnVmZmVyPy5kZXN0cm95KCk7XG4gICAgICB0aGlzLl9fdmlld3NDYXBhY2l0eSA9IE1hdGgubWF4KDgsIHRoaXMuX192aWV3c0NhcGFjaXR5ICogMiwgdmlld0NvdW50KTtcbiAgICAgIHRoaXMuX192aWV3c0J1ZmZlciA9IHRoaXMuX19kZXZpY2UuY3JlYXRlQnVmZmVyKHtcbiAgICAgICAgbGFiZWw6ICdHcHVDdWxsaW5nLnZpZXdzJyxcbiAgICAgICAgc2l6ZTogdGhpcy5fX3ZpZXdzQ2FwYWNpdHkgKiBWaWV3Qnl0ZVNpemUsXG4gICAgICAgIHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5TVE9SQUdFIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXG4gICAgICB9KTtcbiAgICAgIHRoaXMuX192aWV3c0YzMiA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5fX3ZpZXdzQ2FwYWNpdHkgKiBWaWV3V29yZFNpemUpO1xuICAgICAgdGhpcy5fX3VwbG9hZGVkVmlld3NGMzIgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMuX192aWV3c0NhcGFjaXR5ICogVmlld1dvcmRTaXplKTtcbiAgICAgIHRoaXMuX19wYXNzZXMuY3VsbC5iaW5kR3JvdXAgPSB1bmRlZmluZWQ7XG4gICAgICByZXNpemVkID0gdHJ1ZTtcbiAgICB9XG4gICAgY29uc3QgZGF0YSA9IHRoaXMuX192aWV3c0YzMjtcbiAgICBmb3IgKGxldCB2ID0gMDsgdiA8IHZpZXdDb3VudDsgdisrKSB7XG4gICAgICBjb25zdCBjYW1lcmEgPSB2aWV3c1t2XS5jYW1lcmE7XG4gICAgICBjb25zdCBiYXNlID0gdiAqIFZpZXdXb3JkU2l6ZTtcbiAgICAgIGlmICghY2FtZXJhLl9pc0FsaXZlKSB7XG4gICAgICAgIC8vIEEgZGVhZCBjYW1lcmEgZG9lcyBub3QgY3VsbCAoaXRzIGJ1bmRsZXMgYXJlIGRyb3BwZWQgd2l0aCB0aGUgY2FtZXJhKS5cbiAgICAgICAgZGF0YVtiYXNlXSA9IDA7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY2FtZXJhLnVwZGF0ZUZydXN0dW0oKTtcbiAgICAgIGNvbnN0IGZydXN0dW0gPSBjYW1lcmEuZnJ1c3R1bTtcbiAgICAgIGRhdGFbYmFzZV0gPSAxO1xuICAgICAgZGF0YVtiYXNlICsgMV0gPSAwO1xuICAgICAgZGF0YVtiYXNlICsgMl0gPSAwO1xuICAgICAgZGF0YVtiYXNlICsgM10gPSAwO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA2OyBpKyspIHtcbiAgICAgICAgY29uc3QgcGxhbmUgPSBmcnVzdHVtLmdldFBsYW5lKGkpLl92O1xuICAgICAgICBjb25zdCBwID0gYmFzZSArIDQgKyBpICogNDtcbiAgICAgICAgZGF0YVtwXSA9IHBsYW5lWzBdO1xuICAgICAgICBkYXRhW3AgKyAxXSA9IHBsYW5lWzFdO1xuICAgICAgICBkYXRhW3AgKyAyXSA9IHBsYW5lWzJdO1xuICAgICAgICBkYXRhW3AgKyAzXSA9IHBsYW5lWzNdO1xuICAgICAgfVxuICAgICAgY29uc3QgY29ybmVycyA9IGZydXN0dW0uY29ybmVycztcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgODsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNvcm5lciA9IGNvcm5lcnNbaV0uX3Y7XG4gICAgICAgIGNvbnN0IHAgPSBiYXNlICsgMjggKyBpICogNDtcbiAgICAgICAgZGF0YVtwXSA9IGNvcm5lclswXTtcbiAgICAgICAgZGF0YVtwICsgMV0gPSBjb3JuZXJbMV07XG4gICAgICAgIGRhdGFbcCArIDJdID0gY29ybmVyWzJdO1xuICAgICAgICBkYXRhW3AgKyAzXSA9IDE7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHVzZWRMZW5ndGggPSB2aWV3Q291bnQgKiBWaWV3V29yZFNpemU7XG4gICAgY29uc3QgdXBsb2FkZWQgPSB0aGlzLl9fdXBsb2FkZWRWaWV3c0YzMjtcbiAgICBsZXQgY2hhbmdlZCA9IHJlc2l6ZWQ7XG4gICAgaWYgKCFjaGFuZ2VkKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHVzZWRMZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZGF0YVtpXSAhPT0gdXBsb2FkZWRbaV0pIHtcbiAgICAgICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgdGhpcy5fX2RldmljZS5xdWV1ZS53cml0ZUJ1ZmZlcih0aGlzLl9fdmlld3NCdWZmZXIhLCAwLCBkYXRhLCAwLCB1c2VkTGVuZ3RoKTtcbiAgICAgIHVwbG9hZGVkLnNldChkYXRhLnN1YmFycmF5KDAsIHVzZWRMZW5ndGgpKTtcbiAgICB9XG4gICAgcmV0dXJuIGNoYW5nZWQ7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBQSxTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLDJCQUEyQjtBQUNwQyxTQUFTLGlCQUFpQjtBQUMxQixTQUFTLFlBQVk7QUFHckIsU0FBUyxrQkFBa0I7QUFDM0I7QUFBQSxFQUVFO0FBQUEsRUFFQTtBQUFBLE9BQ0s7QUFHUCxTQUFxQyw0QkFBNEI7QUFpQmpFLElBQU07QUFBQTtBQUFBLEVBQXdCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBMkI5QixJQUFNO0FBQUE7QUFBQSxFQUE0QjtBQUFBLEVBQ2hDLFVBQVU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFB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QyxJQUFJLE9BQU8sQ0FBQztBQUN0QixhQUFLLElBQUksQ0FBQyxJQUFJLE9BQU8sQ0FBQztBQUN0QixhQUFLLElBQUksQ0FBQyxJQUFJO0FBQUEsTUFDaEI7QUFBQSxJQUNGO0FBQ0EsVUFBTSxhQUFhLFlBQVk7QUFDL0IsVUFBTSxXQUFXLEtBQUtDO0FBQ3RCLFFBQUksVUFBVTtBQUNkLFFBQUksQ0FBQyxTQUFTO0FBQ1osZUFBUyxJQUFJLEdBQUcsSUFBSSxZQUFZLEtBQUs7QUFDbkMsWUFBSSxLQUFLLENBQUMsTUFBTSxTQUFTLENBQUMsR0FBRztBQUMzQixvQkFBVTtBQUNWO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQ0EsUUFBSSxTQUFTO0FBQ1gsV0FBS1ksR0FBUyxNQUFNLFlBQVksS0FBS3lCLElBQWdCLEdBQUcsTUFBTSxHQUFHLFVBQVU7QUFDM0UsZUFBUyxJQUFJLEtBQUssU0FBUyxHQUFHLFVBQVUsQ0FBQztBQUFBLElBQzNDO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFDRjsiLAogICJuYW1lcyI6IFsiX19wYXJhbXNBcnJheSIsICJfX3ZpZXdzQ2FwYWNpdHkiLCAiX192aWV3c0YzMiIsICJfX3VwbG9hZGVkVmlld3NGMzIiLCAiX19yZWNvcmRzRGlydHkiLCAiX19ncm91cHNEaXJ0eSIsICJfX2RyYXdHcm91cHNEaXJ0eSIsICJfX2FyZ3NEaXJ0eSIsICJfX2NodW5rc0RpcnR5IiwgIl9fZ3JvdXBWZXJ0ZXhSYW5nZXMiLCAiX192aWV3cyIsICJfX3ZpZXdJbmRleE9mQ2FtZXJhIiwgIl9faW5wdXRzRGlydHkiLCAiX19sYXN0UG9zaXRpb25VcGRhdGVWZXJzaW9uIiwgIl9fbGFzdEVuY29kZWRSZWdpc3RyeVZlcnNpb24iLCAiX19kZXZpY2UiLCAiX19yZWdpc3RyeSIsICJfX2RlZm9ybWVyIiwgIl9fcGFzc2VzIiwgIl9fcGFyYW1zQnVmZmVyIiwgIl9fY3JlYXRlVGFibGVzIiwgIl9fZ2V0T3JDcmVhdGVWaWV3IiwgIl9fdmlzaWJsZUlkc0J1ZmZlciIsICJfX3dyaXRlR3JvdXAiLCAiX19hcmdzVTMyIiwgIl9fZHJhd0dyb3Vwc1UzMiIsICJfX2FyZ3NCdWZmZXIiLCAiX191cGRhdGVWaWV3cyIsICJfX3JlZnJlc2hDaGFuZ2VkQm91bmRzIiwgIl9fY3VsbEJpbmRHcm91cFN0b3JhZ2VCdWZmZXIiLCAiX191cGxvYWREaXJ0eSIsICJfX3JlY29yZHNCdWZmZXIiLCAiX19yZWNvcmRzVTMyIiwgIl9fZ3JvdXBzQnVmZmVyIiwgIl9fZ3JvdXBzVTMyIiwgIl9fY2h1bmtzQnVmZmVyIiwgIl9fY2h1bmtzVTMyIiwgIl9fZHJhd0dyb3Vwc0J1ZmZlciIsICJfX2N1bGxCaW5kR3JvdXBCb3VuZHNCdWZmZXIiLCAiX19jcmVhdGVCaW5kR3JvdXAiLCAiX192aWV3c0J1ZmZlciIsICJfX3NjcmF0Y2hJZHNCdWZmZXIiLCAiX19jaHVua0NvdW50c0J1ZmZlciIsICJfX2NodW5rT2Zmc2V0c0J1ZmZlciIsICJfX3Zpc2libGVDb3VudHNCdWZmZXIiLCAiX19nZXRHcm93bkNhcGFjaXRpZXMiLCAiX19kZXN0cm95VGFibGVzIiwgIl9fcmVjb3Jkc0FycmF5QnVmZmVyIiwgIl9fcmVjb3Jkc0YzMiIsICJfX3Jlc2V0QmluZEdyb3VwcyJdCn0K
