// src/webgpu/WebGpuVertexDeformer.ts
import { BlendShapeComponent } from "../foundation/components/BlendShape/BlendShapeComponent.js";
import { SkeletalComponent } from "../foundation/components/Skeletal/SkeletalComponent.js";
import { Component } from "../foundation/core/Component.js";
import { ComponentType } from "../foundation/definitions/ComponentType.js";
import { Mesh } from "../foundation/geometry/Mesh.js";
import { Primitive } from "../foundation/geometry/Primitive.js";
import { DirtyRange } from "./DirtyRange.js";
import {
  GpuDeformChunkSize,
  GpuDeformRegistry
} from "./GpuDeformRegistry.js";
import { boneDecodeWgsl } from "./shaderity_shaders/common/boneDecode.js";
var deformWgsl = (
  /* wgsl */
  `
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
`
);
var MaxWorkgroupsPerDimension = 65535;
var SourceVertexByteSize = 64;
var SourceVertexWordSize = SourceVertexByteSize / 4;
var DeformedVertexByteSize = 32;
var DeformBoundsByteSize = 32;
var ChunkByteSize = 48;
var ChunkWordSize = ChunkByteSize / 4;
var ParamsByteSize = 16;
var Invalid = 4294967295;
var InitialCapacities = {
  sourceVertices: 8192,
  deformedVertices: 16384,
  bounds: 256,
  chunks: 1024
};
var EmptyAccessOption = {};
function findAttribute(primitive, name) {
  for (const semantic of primitive.attributeSemantics) {
    if (semantic.split(".")[0] === name) {
      return primitive.getAttribute(semantic);
    }
  }
  return void 0;
}
var AttributeReader = class {
  constructor(accessor) {
    this.NJ = 0;
    this.OJ = 4;
    this.It = 1;
    this.JJ = false;
    this.DJ = false;
    this.Zl = accessor;
    if (accessor === void 0) {
      return;
    }
    this.NJ = Math.min(accessor.numberOfComponents, 4);
    this.OJ = accessor.componentSizeInBytes;
    const componentType = accessor.componentType;
    const hasNormalizedFormat = accessor.numberOfComponents === 2 || accessor.numberOfComponents === 4;
    if (accessor.normalized && hasNormalizedFormat) {
      if (componentType === ComponentType.UnsignedByte) {
        this.DJ = true;
        this.It = 255;
      } else if (componentType === ComponentType.Byte) {
        this.DJ = true;
        this.It = 127;
        this.JJ = true;
      } else if (componentType === ComponentType.UnsignedShort) {
        this.DJ = true;
        this.It = 65535;
      } else if (componentType === ComponentType.Short) {
        this.DJ = true;
        this.It = 32767;
        this.JJ = true;
      }
    }
  }
  get exists() {
    return this.Zl !== void 0;
  }
  /** Reads the component `c` of the element `i`. */
  read(i, c) {
    const accessor = this.Zl;
    if (accessor === void 0 || c >= this.NJ) {
      return c === 3 ? 1 : 0;
    }
    const value = accessor.getScalarAt(i, c * this.OJ, EmptyAccessOption);
    if (!this.DJ) {
      return value;
    }
    const normalized = value / this.It;
    return this.JJ ? Math.max(normalized, -1) : normalized;
  }
};
var WebGpuVertexDeformer = class {
  constructor(device) {
    this.IG = new Uint32Array(ParamsByteSize / 4);
    this.LJ = new DirtyRange();
    this.fG = new DirtyRange();
    this.CJ = /* @__PURE__ */ new Map();
    this.du = 0;
    this.QJ = -1;
    this.MJ = false;
    /** `Mesh._primitivePositionUpdateVersion` when the sources were last revalidated. */
    this.DG = -1;
    this.NF = device;
    this.TF = new GpuDeformRegistry(InitialCapacities);
    const r = "read-only-storage";
    const types = [r, "uniform", r, r, r, r, r, "storage", "storage"];
    const layout = device.createBindGroupLayout({
      label: "GpuSkinning.deform",
      entries: types.map((type, binding) => ({ binding, visibility: GPUShaderStage.COMPUTE, buffer: { type } }))
    });
    const pipeline = device.createComputePipeline({
      label: "GpuSkinning.deform",
      layout: device.createPipelineLayout({ bindGroupLayouts: [layout] }),
      compute: {
        module: device.createShaderModule({ label: "GpuSkinning.deform", code: deformWgsl }),
        entryPoint: "deform"
      }
    });
    this.GJ = { layout, pipeline, bindGroupBuffers: [] };
    this.VF = device.createBuffer({
      label: "GpuSkinning.params",
      size: ParamsByteSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.EJ = device.createBuffer({
      label: "GpuSkinning.dummy",
      size: 16,
      usage: GPUBufferUsage.STORAGE
    });
    this.FG(InitialCapacities);
  }
  /** The bookkeeping of the allocations (exposed for tests and statistics). */
  get registry() {
    return this.TF;
  }
  /** The deformed vertices, read by the vertex shaders (group 0, binding 4). */
  get deformedVerticesBuffer() {
    return this.IJ;
  }
  /** The bounding boxes of the deformed instances, read by the culling. */
  get boundsBuffer() {
    return this.FJ;
  }
  /** Whether any entry is alive. */
  get hasEntries() {
    return this.TF.entryCount > 0;
  }
  /** Whether the tables changed since the last dispatch (the deformation must run again). */
  get isChanged() {
    return this.du !== this.QJ;
  }
  /** Whether an allocation failed since the last reset (the tables must grow). */
  get isOverflowed() {
    return this.TF.isOverflowed;
  }
  /**
   * Whether the entries can no longer be updated in place (the vertex counts of a mesh changed): every entry must be
   * dropped with `reset`.
   */
  get isResetRequested() {
    return this.MJ;
  }
  /** The current capacities of the tables. */
  get capacities() {
    return this.TF.capacities;
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
  acquire(engine, mesh, entityInfo) {
    const primitives = [];
    const vertexCounts = [];
    const primitiveNumber = mesh.getPrimitiveNumber();
    for (let i = 0; i < primitiveNumber; i++) {
      const primitive = mesh.getPrimitiveAt(i);
      const position = findAttribute(primitive, "POSITION");
      if (position === void 0) {
        return void 0;
      }
      primitives.push(primitive);
      vertexCounts.push(position.elementCount);
    }
    const result = this.TF.acquire(entityInfo, vertexCounts, entityInfo.length / 4);
    if (result === void 0) {
      return void 0;
    }
    if (result.isNew) {
      const info = {
        engine,
        mesh,
        entityInfo,
        primitives,
        positionUpdateCount: mesh.primitivePositionUpdateCount,
        morphPrimitiveCount: -1,
        blendShapeOffsets: []
      };
      this.CJ.set(result.entry, info);
      this.RJ(result.entry, info);
      this.SJ(result.entry, info);
      this.du++;
    }
    return result.entry;
  }
  /**
   * Removes the reference of a cull group to an entry (after the commands that used it were submitted).
   */
  release(entry) {
    if (!this.TF.release(entry)) {
      return;
    }
    this.CJ.delete(entry);
    const chunks = this.cG;
    for (let k = 0; k < entry.chunkCount; k++) {
      chunks[(entry.chunkBase + k) * ChunkWordSize + 1] = 0;
    }
    this.fG.add(entry.chunkBase, entry.chunkBase + entry.chunkCount);
    this.du++;
  }
  /**
   * The index of the first deformed vertex of a primitive among the deformed vertices of an instance
   * (`UniformDrawParameters.deformedVertexOffset`), or undefined when the primitive is not one of the entry's mesh.
   */
  getPrimitiveOffset(entry, primitive) {
    const info = this.CJ.get(entry);
    if (info === void 0) {
      return void 0;
    }
    const index = info.primitives.indexOf(primitive);
    return index < 0 ? void 0 : entry.primitiveOffsets[index];
  }
  /** The index of the first deformed vertex of an instance (the w of its instance ids minus 1). */
  getInstanceDeformedBase(entry, instanceIndex) {
    return entry.deformedBase + instanceIndex * entry.vertexCount;
  }
  /** The bounding box slot of an instance. */
  getInstanceBoundsSlot(entry, instanceIndex) {
    return entry.boundsBase + instanceIndex;
  }
  /**
   * Rewrites the tables that depend on data changed since they were written: the sources of the meshes whose vertex
   * positions were updated, and the chunks when the layout of the morph targets changed. Call once per frame before
   * `encode`.
   */
  refresh() {
    const positionUpdateVersion = Mesh._primitivePositionUpdateVersion;
    if (positionUpdateVersion !== this.DG) {
      this.DG = positionUpdateVersion;
      this.TJ();
    }
    this.UJ();
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
  encode(encoder, storageBuffer, morphBuffers, gpuTimer) {
    var _a, _b, _c;
    const registry = this.TF;
    if (registry.entryCount === 0) {
      return false;
    }
    const device = this.NF;
    this.hG(this.HJ, this.KJ, this.LJ, SourceVertexWordSize);
    this.hG(this.aG, this.cG, this.fG, ChunkWordSize);
    const chunkCount = registry.chunkHighWater;
    const chunksPerRow = Math.max(1, Math.min(chunkCount, MaxWorkgroupsPerDimension));
    const params = this.IG;
    params[0] = chunkCount;
    params[1] = chunksPerRow;
    device.queue.writeBuffer(this.VF, 0, params);
    const stage = this.GJ;
    const buffers = [
      storageBuffer,
      this.VF,
      this.HJ,
      this.aG,
      (_a = morphBuffers.blendShapeData) != null ? _a : this.EJ,
      (_b = morphBuffers.morphOffsets) != null ? _b : this.EJ,
      (_c = morphBuffers.morphWeights) != null ? _c : this.EJ,
      this.IJ,
      this.FJ
    ];
    let isBindGroupValid = stage.bindGroup != null;
    for (let i = 0; i < buffers.length && isBindGroupValid; i++) {
      isBindGroupValid = stage.bindGroupBuffers[i] === buffers[i];
    }
    if (!isBindGroupValid) {
      stage.bindGroup = device.createBindGroup({
        label: "GpuSkinning.deform",
        layout: stage.layout,
        entries: buffers.map((buffer, binding) => ({ binding, resource: { buffer } }))
      });
      stage.bindGroupBuffers = buffers;
    }
    encoder.clearBuffer(this.FJ, 0, registry.boundsHighWater * DeformBoundsByteSize);
    const passDescriptor = { label: "GpuSkinning" };
    const timestampWrites = gpuTimer == null ? void 0 : gpuTimer.getTimestampWrites("GpuSkinning");
    if (timestampWrites != null) {
      passDescriptor.timestampWrites = timestampWrites;
    }
    const pass = encoder.beginComputePass(passDescriptor);
    if (chunkCount > 0) {
      pass.setPipeline(stage.pipeline);
      pass.setBindGroup(0, stage.bindGroup);
      pass.dispatchWorkgroups(chunksPerRow, Math.ceil(chunkCount / chunksPerRow));
    }
    pass.end();
    this.QJ = this.du;
    return true;
  }
  /**
   * The capacities the tables must grow to after an allocation failed, or undefined when they did not overflow or
   * cannot grow (the device limits are reached; the failed draws stay unculled).
   */
  getGrownCapacities() {
    const registry = this.TF;
    if (!registry.isOverflowed) {
      return void 0;
    }
    const required = registry.requiredCapacities;
    const current = registry.capacities;
    const limits = this.NF.limits;
    const maxBytes = Math.min(limits.maxStorageBufferBindingSize, limits.maxBufferSize);
    const grow = (capacity, needed, bytesPerSlot) => {
      let next = capacity;
      while (next < needed * 1.25) {
        next *= 2;
      }
      return Math.max(capacity, Math.min(next, Math.floor(maxBytes / bytesPerSlot)));
    };
    const capacities = {
      sourceVertices: grow(current.sourceVertices, required.sourceVertices, SourceVertexByteSize),
      deformedVertices: grow(current.deformedVertices, required.deformedVertices, DeformedVertexByteSize),
      bounds: grow(current.bounds, required.bounds, DeformBoundsByteSize),
      chunks: grow(current.chunks, required.chunks, ChunkByteSize)
    };
    if (capacities.sourceVertices === current.sourceVertices && capacities.deformedVertices === current.deformedVertices && capacities.bounds === current.bounds && capacities.chunks === current.chunks) {
      return void 0;
    }
    return capacities;
  }
  /**
   * Drops every entry and recreates the tables. The cull groups that referenced the entries must be dropped as well,
   * and the render bundles that bound the deformed vertex buffer.
   */
  reset(capacities) {
    this.HG();
    this.FG(capacities);
    this.TF.reset(capacities);
    this.CJ.clear();
    this.MJ = false;
    this.du++;
  }
  /** Releases the GPU resources. */
  destroy() {
    this.HG();
    this.VF.destroy();
    this.EJ.destroy();
  }
  FG(capacities) {
    const device = this.NF;
    this.HJ = device.createBuffer({
      label: "GpuSkinning.sources",
      size: capacities.sourceVertices * SourceVertexByteSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    this.aG = device.createBuffer({
      label: "GpuSkinning.chunks",
      size: capacities.chunks * ChunkByteSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    this.IJ = device.createBuffer({
      label: "GpuSkinning.deformedVertices",
      size: capacities.deformedVertices * DeformedVertexByteSize,
      // COPY_SRC lets tests and tools read back the deformed vertices.
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });
    this.FJ = device.createBuffer({
      label: "GpuSkinning.bounds",
      size: capacities.bounds * DeformBoundsByteSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
    });
    const sources = new ArrayBuffer(capacities.sourceVertices * SourceVertexByteSize);
    this.KJ = new Uint32Array(sources);
    this.PJ = new Float32Array(sources);
    this.cG = new Uint32Array(capacities.chunks * ChunkWordSize);
    this.LJ.clear();
    this.fG.clear();
    this.fG.add(0, capacities.chunks);
    this.GJ.bindGroup = void 0;
    this.GJ.bindGroupBuffers = [];
  }
  HG() {
    var _a, _b, _c, _d;
    (_a = this.HJ) == null ? void 0 : _a.destroy();
    (_b = this.aG) == null ? void 0 : _b.destroy();
    (_c = this.IJ) == null ? void 0 : _c.destroy();
    (_d = this.FJ) == null ? void 0 : _d.destroy();
  }
  hG(buffer, mirror, dirty, wordsPerSlot) {
    if (dirty.isEmpty) {
      return;
    }
    const begin = dirty.min * wordsPerSlot;
    const end = Math.min(dirty.max * wordsPerSlot, mirror.length);
    this.NF.queue.writeBuffer(buffer, begin * 4, mirror, begin, end - begin);
    dirty.clear();
  }
  /**
   * Writes the undeformed vertices of the primitives of an entry's mesh.
   */
  RJ(entry, info) {
    const u32 = this.KJ;
    const f32 = this.PJ;
    for (let p = 0; p < info.primitives.length; p++) {
      const primitive = info.primitives[p];
      const position = new AttributeReader(findAttribute(primitive, "POSITION"));
      const normal = new AttributeReader(findAttribute(primitive, "NORMAL"));
      const joints = new AttributeReader(findAttribute(primitive, "JOINTS_0"));
      const weights = new AttributeReader(findAttribute(primitive, "WEIGHTS_0"));
      const baryCentricCoord = new AttributeReader(findAttribute(primitive, "BARY_CENTRIC_COORD"));
      const base = entry.sourceBase + entry.primitiveOffsets[p];
      const vertexCount = entry.primitiveVertexCounts[p];
      for (let v = 0; v < vertexCount; v++) {
        const w = (base + v) * SourceVertexWordSize;
        f32[w] = position.read(v, 0);
        f32[w + 1] = position.read(v, 1);
        f32[w + 2] = position.read(v, 2);
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
    this.LJ.add(entry.sourceBase, entry.sourceBase + entry.vertexCount);
  }
  /**
   * Writes the chunks of an entry: the source and destination ranges, the skeleton and the morph targets applied to
   * each primitive of each instance.
   */
  SJ(entry, info) {
    var _a, _b, _c, _d;
    const engine = info.engine;
    const entityInfo = info.entityInfo;
    info.morphPrimitiveCount = Primitive.getPrimitiveCountHasMorph();
    info.blendShapeOffsets = BlendShapeComponent.getOffsetsInUniform(engine);
    const morphOffsets = Primitive.getMorphUniformDataOffsets();
    const blendShapeOffsets = info.blendShapeOffsets;
    const countPerBufferView = (_a = Component.getComponentCountPerBufferView(engine).get(SkeletalComponent)) != null ? _a : 1;
    const locationOffsets = Component.getLocationOffsetOfMemberOfComponent(
      engine,
      SkeletalComponent,
      Component._getVariableLengthLocationMemberName("boneData")
    );
    const infoOffsets = Component.getLocationOffsetOfMemberOfComponent(engine, SkeletalComponent, "boneDataInfo");
    const chunks = this.cG;
    for (let i = 0; i < entry.instanceCount; i++) {
      const skeletalSID = entityInfo[4 * i + 1];
      const blendShapeSID = entityInfo[4 * i + 2];
      let boneDataLocationIndex = Invalid;
      let boneDataInfoIndex = 0;
      if (skeletalSID !== Invalid) {
        const bufferViewIndex = Math.floor(skeletalSID / countPerBufferView);
        const indexInBufferView = skeletalSID % countPerBufferView;
        boneDataLocationIndex = ((_b = locationOffsets[bufferViewIndex]) != null ? _b : 0) + indexInBufferView;
        boneDataInfoIndex = ((_c = infoOffsets[bufferViewIndex]) != null ? _c : 0) + indexInBufferView;
      }
      const instanceDeformedBase = this.getInstanceDeformedBase(entry, i);
      const boundsSlot = this.getInstanceBoundsSlot(entry, i);
      let chunkIndex = entry.chunkBase + i * entry.chunkCountPerInstance;
      for (let p = 0; p < info.primitives.length; p++) {
        const primitive = info.primitives[p];
        let morphOffsetBase = 0;
        let morphTargetCount = 0;
        let morphWeightBase = 0;
        const targetCount = primitive.targets.length;
        const morphIndex = Primitive.getPrimitiveIdxHasMorph(primitive.primitiveUid);
        if (targetCount > 0 && blendShapeSID !== Invalid && morphIndex !== void 0) {
          const weightBase = blendShapeOffsets[blendShapeSID];
          if (weightBase !== void 0) {
            morphOffsetBase = (_d = morphOffsets[morphIndex]) != null ? _d : 0;
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
    this.fG.add(entry.chunkBase, entry.chunkBase + entry.chunkCount);
  }
  /**
   * Rewrites the sources of the meshes whose vertex positions were updated. When the vertex counts changed, the entry
   * layout is no longer valid and a reset is requested.
   */
  TJ() {
    for (const [entry, info] of this.CJ) {
      const mesh = info.mesh;
      if (mesh.primitivePositionUpdateCount === info.positionUpdateCount) {
        continue;
      }
      info.positionUpdateCount = mesh.primitivePositionUpdateCount;
      let isLayoutValid = mesh.getPrimitiveNumber() === info.primitives.length;
      for (let p = 0; p < info.primitives.length && isLayoutValid; p++) {
        const primitive = mesh.getPrimitiveAt(p);
        const position = findAttribute(primitive, "POSITION");
        isLayoutValid = primitive === info.primitives[p] && position !== void 0 && position.elementCount === entry.primitiveVertexCounts[p];
      }
      if (!isLayoutValid) {
        this.MJ = true;
        continue;
      }
      this.RJ(entry, info);
      this.du++;
    }
  }
  /**
   * Rewrites the chunks of the entries when the morph target or blend shape weight layouts changed (primitives with
   * morph targets or blend shape components were created or destroyed).
   */
  UJ() {
    const morphPrimitiveCount = Primitive.getPrimitiveCountHasMorph();
    for (const [entry, info] of this.CJ) {
      if (info.morphPrimitiveCount === morphPrimitiveCount && info.blendShapeOffsets === BlendShapeComponent.getOffsetsInUniform(info.engine)) {
        continue;
      }
      this.SJ(entry, info);
      this.du++;
    }
  }
};
export {
  DeformBoundsByteSize,
  DeformedVertexByteSize,
  WebGpuVertexDeformer
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vc3JjL3dlYmdwdS9XZWJHcHVWZXJ0ZXhEZWZvcm1lci50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgQmxlbmRTaGFwZUNvbXBvbmVudCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vY29tcG9uZW50cy9CbGVuZFNoYXBlL0JsZW5kU2hhcGVDb21wb25lbnQnO1xuaW1wb3J0IHsgU2tlbGV0YWxDb21wb25lbnQgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvbXBvbmVudHMvU2tlbGV0YWwvU2tlbGV0YWxDb21wb25lbnQnO1xuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9jb3JlL0NvbXBvbmVudCc7XG5pbXBvcnQgeyBDb21wb25lbnRUeXBlIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9Db21wb25lbnRUeXBlJztcbmltcG9ydCB7IE1lc2ggfSBmcm9tICcuLi9mb3VuZGF0aW9uL2dlb21ldHJ5L01lc2gnO1xuaW1wb3J0IHsgUHJpbWl0aXZlIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9nZW9tZXRyeS9QcmltaXRpdmUnO1xuaW1wb3J0IHR5cGUgeyBBY2Nlc3NvciB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWVtb3J5L0FjY2Vzc29yJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB7IERpcnR5UmFuZ2UgfSBmcm9tICcuL0RpcnR5UmFuZ2UnO1xuaW1wb3J0IHtcbiAgdHlwZSBHcHVEZWZvcm1DYXBhY2l0aWVzLFxuICBHcHVEZWZvcm1DaHVua1NpemUsXG4gIHR5cGUgR3B1RGVmb3JtRW50cnksXG4gIEdwdURlZm9ybVJlZ2lzdHJ5LFxufSBmcm9tICcuL0dwdURlZm9ybVJlZ2lzdHJ5JztcbmltcG9ydCB7IGJvbmVEZWNvZGVXZ3NsIH0gZnJvbSAnLi9zaGFkZXJpdHlfc2hhZGVycy9jb21tb24vYm9uZURlY29kZSc7XG5pbXBvcnQgdHlwZSB7IFdlYkdwdUdwdVRpbWVyIH0gZnJvbSAnLi9XZWJHcHVHcHVUaW1lcic7XG5cbi8qKlxuICogVGhlIGRlZm9ybWF0aW9uIGNvbXB1dGUgc2hhZGVyLiBPbmUgd29ya2dyb3VwIGRlZm9ybXMgb25lIGNodW5rOiB1cCB0byA2NCBjb25zZWN1dGl2ZSB2ZXJ0aWNlcyBvZiBhIHByaW1pdGl2ZSBvZiBhblxuICogaW5zdGFuY2UuIEVhY2ggdmVydGV4IGlzIG1vcnBoZWQgKGJsZW5kIHNoYXBlcykgYW5kIHRoZW4gc2tpbm5lZCwgZXhhY3RseSBhcyBgcHJvY2Vzc0dlb21ldHJ5YCAoV0dTTCkgZG9lcyBpbiB0aGVcbiAqIHZlcnRleCBzaGFkZXJzLCBhbmQgd3JpdHRlbiBpbiB0aGUgbG9jYWwgc3BhY2Ugb2YgdGhlIG1lc2guIFRoZSB3b3JrZ3JvdXAgcmVkdWNlcyB0aGUgYm91bmRpbmcgYm94IG9mIGl0cyB2ZXJ0aWNlc1xuICogYW5kIG1lcmdlcyBpdCBpbnRvIHRoZSBib3VuZGluZyBib3ggb2YgdGhlIGluc3RhbmNlIHdpdGggYXRvbWljcyAodGhlIG9yZGVyLXByZXNlcnZpbmcgZmxvYXQgZW5jb2RpbmcpLlxuICovXG5jb25zdCBkZWZvcm1XZ3NsID0gLyogd2dzbCAqLyBgXG4ke2JvbmVEZWNvZGVXZ3NsLmNvZGV9XG5cbnN0cnVjdCBEZWZvcm1DaHVuayB7XG4gIHNyY0Jhc2U6IHUzMiwgICAgICAgICAgICAgICAvLyB0aGUgaW5kZXggb2YgdGhlIGZpcnN0IHNvdXJjZSB2ZXJ0ZXggb2YgdGhlIGNodW5rXG4gIHZlcnRleENvdW50OiB1MzIsICAgICAgICAgICAvLyB0aGUgbnVtYmVyIG9mIHZlcnRpY2VzIG9mIHRoZSBjaHVuayAoMCBmb3IgYW4gdW51c2VkIGNodW5rIHNsb3QpXG4gIGRzdEJhc2U6IHUzMiwgICAgICAgICAgICAgICAvLyB0aGUgaW5kZXggb2YgdGhlIGZpcnN0IGRlZm9ybWVkIHZlcnRleCBvZiB0aGUgY2h1bmtcbiAgYm91bmRzU2xvdDogdTMyLCAgICAgICAgICAgIC8vIHRoZSBib3VuZGluZyBib3ggb2YgdGhlIGluc3RhbmNlXG4gIGJvbmVEYXRhTG9jYXRpb25JbmRleDogdTMyLCAvLyB2ZWM0IGluZGV4IG9mIHRoZSBib25lRGF0YUxvY2F0aW9uIG9mIHRoZSBza2VsZXRvbiBpbiBkYXRhLCBvciBJTlZBTElEXG4gIGJvbmVEYXRhSW5mb0luZGV4OiB1MzIsICAgICAvLyB2ZWM0IGluZGV4IG9mIHRoZSBib25lRGF0YUluZm8gb2YgdGhlIHNrZWxldG9uIGluIGRhdGFcbiAgbW9ycGhPZmZzZXRCYXNlOiB1MzIsICAgICAgIC8vIGluZGV4IG9mIHRoZSBtb3JwaCB0YXJnZXQgb2Zmc2V0cyBvZiB0aGUgcHJpbWl0aXZlIGluIG1vcnBoT2Zmc2V0c1xuICBtb3JwaFRhcmdldENvdW50OiB1MzIsICAgICAgLy8gdGhlIG51bWJlciBvZiBtb3JwaCB0YXJnZXRzIGFwcGxpZWQgKDA6IG5vIG1vcnBoaW5nKVxuICBtb3JwaFdlaWdodEJhc2U6IHUzMiwgICAgICAgLy8gaW5kZXggb2YgdGhlIHdlaWdodHMgb2YgdGhlIGJsZW5kIHNoYXBlIGNvbXBvbmVudCBpbiBtb3JwaFdlaWdodHNcbiAgcGFkMDogdTMyLFxuICBwYWQxOiB1MzIsXG4gIHBhZDI6IHUzMixcbn1cblxuc3RydWN0IFBhcmFtcyB7XG4gIGNodW5rQ291bnQ6IHUzMixcbiAgY2h1bmtzUGVyUm93OiB1MzIsXG4gIHBhZDA6IHUzMixcbiAgcGFkMTogdTMyLFxufVxuXG5AZ3JvdXAoMCkgQGJpbmRpbmcoMCkgdmFyPHN0b3JhZ2UsIHJlYWQ+IGRhdGE6IGFycmF5PHZlYzQ8ZjMyPj47XG5AZ3JvdXAoMCkgQGJpbmRpbmcoMSkgdmFyPHVuaWZvcm0+IHBhcmFtczogUGFyYW1zO1xuLy8gNCB2ZWM0IHBlciB2ZXJ0ZXg6IFtwb3NpdGlvbi54eXosIG1vcnBoIHZlcnRleCBpbmRleCAodTMyKV0sIFtub3JtYWwueHl6LCAwXSwgW2pvaW50cyAodTMyKV0sIFt3ZWlnaHRzXVxuQGdyb3VwKDApIEBiaW5kaW5nKDIpIHZhcjxzdG9yYWdlLCByZWFkPiBzb3VyY2VzOiBhcnJheTx2ZWM0PGYzMj4+O1xuQGdyb3VwKDApIEBiaW5kaW5nKDMpIHZhcjxzdG9yYWdlLCByZWFkPiBjaHVua3M6IGFycmF5PERlZm9ybUNodW5rPjtcbi8vIFRoZSBidWZmZXJzIG9mIHRoZSBtb3JwaCB0YXJnZXRzLCBzaGFyZWQgd2l0aCB0aGUgdmVydGV4IHNoYWRlcnMgKHVuaWZvcm1Nb3JwaE9mZnNldHMsIHVuaWZvcm1Nb3JwaFdlaWdodHMpXG5AZ3JvdXAoMCkgQGJpbmRpbmcoNCkgdmFyPHN0b3JhZ2UsIHJlYWQ+IGJsZW5kU2hhcGVEYXRhOiBhcnJheTxmMzI+O1xuQGdyb3VwKDApIEBiaW5kaW5nKDUpIHZhcjxzdG9yYWdlLCByZWFkPiBtb3JwaE9mZnNldHM6IGFycmF5PHUzMj47XG5AZ3JvdXAoMCkgQGJpbmRpbmcoNikgdmFyPHN0b3JhZ2UsIHJlYWQ+IG1vcnBoV2VpZ2h0czogYXJyYXk8ZjMyPjtcbi8vIDIgdmVjNCBwZXIgdmVydGV4OiBbdGhlIHNraW5uZWQgcG9zaXRpb24gKHdpdGggdGhlIHcgb2YgdGhlIHNraW5uaW5nIG1hdHJpeCBwcm9kdWN0KV0sIFtub3JtYWwueHl6LCAwXVxuQGdyb3VwKDApIEBiaW5kaW5nKDcpIHZhcjxzdG9yYWdlLCByZWFkX3dyaXRlPiBkZWZvcm1lZDogYXJyYXk8dmVjNDxmMzI+Pjtcbi8vIDggdTMyIHBlciBpbnN0YW5jZTogW35taW4ueHl6LCAwLCBtYXgueHl6LCAwXSBlbmNvZGVkIGJ5IGVuY29kZU9yZGVyZWRGbG9hdFxuQGdyb3VwKDApIEBiaW5kaW5nKDgpIHZhcjxzdG9yYWdlLCByZWFkX3dyaXRlPiBib3VuZHM6IGFycmF5PGF0b21pYzx1MzI+PjtcblxuY29uc3QgSU5WQUxJRDogdTMyID0gMHhmZmZmZmZmZnU7XG5jb25zdCBMT0NBVElPTl9SQURJWDogdTMyID0gJHtDb21wb25lbnQuX3ZhcmlhYmxlTGVuZ3RoTG9jYXRpb25SYWRpeH11O1xuXG52YXI8d29ya2dyb3VwPiBsb2NhbEJvdW5kczogYXJyYXk8YXRvbWljPHUzMj4sIDY+O1xuXG4vLyBBIHUzMiB3aG9zZSB1bnNpZ25lZCBvcmRlciBpcyB0aGUgb3JkZXIgb2YgdGhlIGZsb2F0cyAoR3B1RGVmb3JtUmVnaXN0cnkuZW5jb2RlT3JkZXJlZEZsb2F0KVxuZm4gZW5jb2RlT3JkZXJlZEZsb2F0KHZhbHVlOiBmMzIpIC0+IHUzMiB7XG4gIGxldCBiaXRzID0gYml0Y2FzdDx1MzI+KHZhbHVlKTtcbiAgcmV0dXJuIHNlbGVjdChiaXRzIHwgMHg4MDAwMDAwMHUsIH5iaXRzLCAoYml0cyAmIDB4ODAwMDAwMDB1KSAhPSAwdSk7XG59XG5cbmZuIGJvbmVNYXRyaXgoYm9uZURhdGFCYXNlOiB1MzIsIGpvaW50SWR4OiB1MzIsIGJvbmVEYXRhVHlwZTogaTMyLCBib25lRGF0YUluZm86IHZlYzQ8ZjMyPikgLT4gbWF0NHg0PGYzMj4ge1xuICBsZXQgY2h1bmtDb3VudCA9IGJvbmVEYXRhQ2h1bmtDb3VudE9mSm9pbnQoYm9uZURhdGFUeXBlKTtcbiAgbGV0IGJhc2UgPSBib25lRGF0YUJhc2UgKyBqb2ludElkeCAqIGNodW5rQ291bnQ7XG4gIGxldCBjMCA9IGRhdGFbYmFzZV07XG4gIHZhciBjMSA9IHZlYzQ8ZjMyPigwLjApO1xuICB2YXIgYzIgPSB2ZWM0PGYzMj4oMC4wKTtcbiAgaWYgKGNodW5rQ291bnQgPj0gMnUpIHtcbiAgICBjMSA9IGRhdGFbYmFzZSArIDF1XTtcbiAgfVxuICBpZiAoY2h1bmtDb3VudCA+PSAzdSkge1xuICAgIGMyID0gZGF0YVtiYXNlICsgMnVdO1xuICB9XG4gIHJldHVybiBkZWNvZGVCb25lTWF0cml4KGJvbmVEYXRhVHlwZSwgYzAsIGMxLCBjMiwgYm9uZURhdGFJbmZvKTtcbn1cblxuQGNvbXB1dGUgQHdvcmtncm91cF9zaXplKDY0KVxuZm4gZGVmb3JtKEBidWlsdGluKHdvcmtncm91cF9pZCkgd29ya2dyb3VwSWQ6IHZlYzM8dTMyPiwgQGJ1aWx0aW4obG9jYWxfaW52b2NhdGlvbl9pbmRleCkgbGlkOiB1MzIpIHtcbiAgLy8gYyBpcyB1bmlmb3JtIGluIHRoZSB3b3JrZ3JvdXAsIHNvIHRoaXMgcmV0dXJuIGtlZXBzIHRoZSBiYXJyaWVyIGJlbG93IGluIHVuaWZvcm0gY29udHJvbCBmbG93LlxuICBsZXQgYyA9IHdvcmtncm91cElkLnkgKiBwYXJhbXMuY2h1bmtzUGVyUm93ICsgd29ya2dyb3VwSWQueDtcbiAgaWYgKGMgPj0gcGFyYW1zLmNodW5rQ291bnQpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgbGV0IGNodW5rID0gY2h1bmtzW2NdO1xuICBpZiAobGlkIDwgY2h1bmsudmVydGV4Q291bnQpIHtcbiAgICBsZXQgc3JjID0gKGNodW5rLnNyY0Jhc2UgKyBsaWQpICogNHU7XG4gICAgbGV0IHNvdXJjZTAgPSBzb3VyY2VzW3NyY107XG4gICAgdmFyIHBvc2l0aW9uSW5Mb2NhbCA9IHNvdXJjZTAueHl6O1xuICAgIHZhciBub3JtYWwgPSBzb3VyY2VzW3NyYyArIDF1XS54eXo7XG5cbiAgICAvLyBUaGUgbW9ycGhpbmcgb2YgZ2V0X3Bvc2l0aW9uIChXZWJHcHVTdHJhdGVneUJhc2ljKVxuICAgIGxldCB2ZXJ0ZXhJZCA9IGJpdGNhc3Q8dTMyPihzb3VyY2UwLncpO1xuICAgIGZvciAodmFyIGkgPSAwdTsgaSA8IGNodW5rLm1vcnBoVGFyZ2V0Q291bnQ7IGkgPSBpICsgMXUpIHtcbiAgICAgIGxldCBiYXNlID0gbW9ycGhPZmZzZXRzW2NodW5rLm1vcnBoT2Zmc2V0QmFzZSArIGldICogNHUgKyAzdSAqIHZlcnRleElkO1xuICAgICAgbGV0IGRlbHRhID0gdmVjMzxmMzI+KGJsZW5kU2hhcGVEYXRhW2Jhc2VdLCBibGVuZFNoYXBlRGF0YVtiYXNlICsgMXVdLCBibGVuZFNoYXBlRGF0YVtiYXNlICsgMnVdKTtcbiAgICAgIHBvc2l0aW9uSW5Mb2NhbCArPSBkZWx0YSAqIG1vcnBoV2VpZ2h0c1tjaHVuay5tb3JwaFdlaWdodEJhc2UgKyBpXTtcbiAgICB9XG5cbiAgICAvLyBUaGUgc2tpbm5pbmcgb2YgcHJvY2Vzc0dlb21ldHJ5XG4gICAgdmFyIHBvc2l0aW9uID0gdmVjNDxmMzI+KHBvc2l0aW9uSW5Mb2NhbCwgMS4wKTtcbiAgICBpZiAoY2h1bmsuYm9uZURhdGFMb2NhdGlvbkluZGV4ICE9IElOVkFMSUQpIHtcbiAgICAgIGxldCBsb2NhdGlvbiA9IGRhdGFbY2h1bmsuYm9uZURhdGFMb2NhdGlvbkluZGV4XTtcbiAgICAgIGxldCBib25lRGF0YUJhc2UgPSB1MzIobG9jYXRpb24ueCkgKiBMT0NBVElPTl9SQURJWCArIHUzMihsb2NhdGlvbi55KTtcbiAgICAgIGxldCBib25lRGF0YUluZm8gPSBkYXRhW2NodW5rLmJvbmVEYXRhSW5mb0luZGV4XTtcbiAgICAgIGxldCBib25lRGF0YVR5cGUgPSBpMzIoYm9uZURhdGFJbmZvLncgKyAwLjUpO1xuICAgICAgbGV0IGpvaW50ID0gYml0Y2FzdDx2ZWM0PHUzMj4+KHNvdXJjZXNbc3JjICsgMnVdKTtcbiAgICAgIGxldCB3ZWlnaHQgPSBzb3VyY2VzW3NyYyArIDN1XTtcbiAgICAgIHZhciBza2luTWF0OiBtYXQ0eDQ8ZjMyPiA9IHdlaWdodC54ICogYm9uZU1hdHJpeChib25lRGF0YUJhc2UsIGpvaW50LngsIGJvbmVEYXRhVHlwZSwgYm9uZURhdGFJbmZvKTtcbiAgICAgIHNraW5NYXQgKz0gd2VpZ2h0LnkgKiBib25lTWF0cml4KGJvbmVEYXRhQmFzZSwgam9pbnQueSwgYm9uZURhdGFUeXBlLCBib25lRGF0YUluZm8pO1xuICAgICAgc2tpbk1hdCArPSB3ZWlnaHQueiAqIGJvbmVNYXRyaXgoYm9uZURhdGFCYXNlLCBqb2ludC56LCBib25lRGF0YVR5cGUsIGJvbmVEYXRhSW5mbyk7XG4gICAgICBza2luTWF0ICs9IHdlaWdodC53ICogYm9uZU1hdHJpeChib25lRGF0YUJhc2UsIGpvaW50LncsIGJvbmVEYXRhVHlwZSwgYm9uZURhdGFJbmZvKTtcbiAgICAgIHBvc2l0aW9uID0gc2tpbk1hdCAqIHBvc2l0aW9uO1xuICAgICAgbm9ybWFsID0gdG9Ob3JtYWxNYXRyaXgoc2tpbk1hdCkgKiBub3JtYWw7XG4gICAgfVxuXG4gICAgbGV0IGRzdCA9IChjaHVuay5kc3RCYXNlICsgbGlkKSAqIDJ1O1xuICAgIGRlZm9ybWVkW2RzdF0gPSBwb3NpdGlvbjtcbiAgICBkZWZvcm1lZFtkc3QgKyAxdV0gPSB2ZWM0PGYzMj4obm9ybWFsLCAwLjApO1xuXG4gICAgLy8gVGhlIHZlcnRleCBzaGFkZXJzIHRyYW5zZm9ybSB0aGUgaG9tb2dlbmVvdXMgcG9zaXRpb24sIHNvIHRoZSBib3VuZHMgYXJlIHRob3NlIG9mIHRoZSBwcm9qZWN0ZWQgcG9pbnQuXG4gICAgbGV0IHBvaW50ID0gc2VsZWN0KHBvc2l0aW9uLnh5eiwgcG9zaXRpb24ueHl6IC8gcG9zaXRpb24udywgcG9zaXRpb24udyAhPSAwLjApO1xuICAgIGF0b21pY01heCgmbG9jYWxCb3VuZHNbMF0sIH5lbmNvZGVPcmRlcmVkRmxvYXQocG9pbnQueCkpO1xuICAgIGF0b21pY01heCgmbG9jYWxCb3VuZHNbMV0sIH5lbmNvZGVPcmRlcmVkRmxvYXQocG9pbnQueSkpO1xuICAgIGF0b21pY01heCgmbG9jYWxCb3VuZHNbMl0sIH5lbmNvZGVPcmRlcmVkRmxvYXQocG9pbnQueikpO1xuICAgIGF0b21pY01heCgmbG9jYWxCb3VuZHNbM10sIGVuY29kZU9yZGVyZWRGbG9hdChwb2ludC54KSk7XG4gICAgYXRvbWljTWF4KCZsb2NhbEJvdW5kc1s0XSwgZW5jb2RlT3JkZXJlZEZsb2F0KHBvaW50LnkpKTtcbiAgICBhdG9taWNNYXgoJmxvY2FsQm91bmRzWzVdLCBlbmNvZGVPcmRlcmVkRmxvYXQocG9pbnQueikpO1xuICB9XG4gIHdvcmtncm91cEJhcnJpZXIoKTtcbiAgaWYgKGxpZCA8IDZ1ICYmIGNodW5rLnZlcnRleENvdW50ID4gMHUpIHtcbiAgICBsZXQgc2xvdCA9IGNodW5rLmJvdW5kc1Nsb3QgKiA4dSArIHNlbGVjdChsaWQsIGxpZCArIDF1LCBsaWQgPj0gM3UpO1xuICAgIGF0b21pY01heCgmYm91bmRzW3Nsb3RdLCBhdG9taWNMb2FkKCZsb2NhbEJvdW5kc1tsaWRdKSk7XG4gIH1cbn1cbmA7XG5cbmNvbnN0IE1heFdvcmtncm91cHNQZXJEaW1lbnNpb24gPSA2NTUzNTtcbi8qKiBUaGUgYnl0ZSBzaXplIG9mIGEgc291cmNlIHZlcnRleCAoNCB2ZWM0KS4gKi9cbmNvbnN0IFNvdXJjZVZlcnRleEJ5dGVTaXplID0gNjQ7XG5jb25zdCBTb3VyY2VWZXJ0ZXhXb3JkU2l6ZSA9IFNvdXJjZVZlcnRleEJ5dGVTaXplIC8gNDtcbi8qKiBUaGUgYnl0ZSBzaXplIG9mIGEgZGVmb3JtZWQgdmVydGV4ICgyIHZlYzQpLiAqL1xuZXhwb3J0IGNvbnN0IERlZm9ybWVkVmVydGV4Qnl0ZVNpemUgPSAzMjtcbi8qKiBUaGUgYnl0ZSBzaXplIG9mIHRoZSBib3VuZGluZyBib3ggb2YgYW4gaW5zdGFuY2UgKDIgeCB2ZWM0PHUzMj4pLiAqL1xuZXhwb3J0IGNvbnN0IERlZm9ybUJvdW5kc0J5dGVTaXplID0gMzI7XG4vKiogVGhlIGJ5dGUgc2l6ZSBvZiBhIERlZm9ybUNodW5rLiAqL1xuY29uc3QgQ2h1bmtCeXRlU2l6ZSA9IDQ4O1xuY29uc3QgQ2h1bmtXb3JkU2l6ZSA9IENodW5rQnl0ZVNpemUgLyA0O1xuY29uc3QgUGFyYW1zQnl0ZVNpemUgPSAxNjtcbmNvbnN0IEludmFsaWQgPSAweGZmZmZmZmZmO1xuXG5jb25zdCBJbml0aWFsQ2FwYWNpdGllczogR3B1RGVmb3JtQ2FwYWNpdGllcyA9IHtcbiAgc291cmNlVmVydGljZXM6IDgxOTIsXG4gIGRlZm9ybWVkVmVydGljZXM6IDE2Mzg0LFxuICBib3VuZHM6IDI1NixcbiAgY2h1bmtzOiAxMDI0LFxufTtcblxuLyoqIFRoZSBzb3VyY2Ugb2YgdGhlIHJlY29yZHMgb2YgYW4gZW50cnkuICovXG50eXBlIEVudHJ5SW5mbyA9IHtcbiAgZW5naW5lOiBFbmdpbmU7XG4gIG1lc2g6IE1lc2g7XG4gIGVudGl0eUluZm86IFVpbnQzMkFycmF5O1xuICBwcmltaXRpdmVzOiBQcmltaXRpdmVbXTtcbiAgLyoqIGBtZXNoLnByaW1pdGl2ZVBvc2l0aW9uVXBkYXRlQ291bnRgIHRoZSBzb3VyY2VzIHdlcmUgd3JpdHRlbiBmb3IuICovXG4gIHBvc2l0aW9uVXBkYXRlQ291bnQ6IG51bWJlcjtcbiAgLyoqIFRoZSBtb3JwaCBsYXlvdXQgdGhlIGNodW5rcyB3ZXJlIHdyaXR0ZW4gZm9yIChzZWUgYF9fcmVmcmVzaE1vcnBoTGF5b3V0c2ApLiAqL1xuICBtb3JwaFByaW1pdGl2ZUNvdW50OiBudW1iZXI7XG4gIGJsZW5kU2hhcGVPZmZzZXRzOiByZWFkb25seSBudW1iZXJbXTtcbn07XG5cbmNvbnN0IEVtcHR5QWNjZXNzT3B0aW9uID0ge307XG5cbi8qKiBUaGUgYnVmZmVycyBvZiB0aGUgbW9ycGggdGFyZ2V0cyAob3duZWQgYnkgV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5KSwgdW5kZWZpbmVkIHdoZW4gbm90IGNyZWF0ZWQgeWV0LiAqL1xuZXhwb3J0IGludGVyZmFjZSBHcHVEZWZvcm1Nb3JwaEJ1ZmZlcnMge1xuICBibGVuZFNoYXBlRGF0YT86IEdQVUJ1ZmZlcjtcbiAgbW9ycGhPZmZzZXRzPzogR1BVQnVmZmVyO1xuICBtb3JwaFdlaWdodHM/OiBHUFVCdWZmZXI7XG59XG5cbi8qKlxuICogRmluZHMgdGhlIGF0dHJpYnV0ZSBhY2Nlc3NvciBvZiBhIHByaW1pdGl2ZSBieSB0aGUgYXR0cmlidXRlIG5hbWUgKGUuZy4gJ1BPU0lUSU9OJywgJ0pPSU5UU18wJykuXG4gKi9cbmZ1bmN0aW9uIGZpbmRBdHRyaWJ1dGUocHJpbWl0aXZlOiBQcmltaXRpdmUsIG5hbWU6IHN0cmluZyk6IEFjY2Vzc29yIHwgdW5kZWZpbmVkIHtcbiAgZm9yIChjb25zdCBzZW1hbnRpYyBvZiBwcmltaXRpdmUuYXR0cmlidXRlU2VtYW50aWNzKSB7XG4gICAgaWYgKHNlbWFudGljLnNwbGl0KCcuJylbMF0gPT09IG5hbWUpIHtcbiAgICAgIHJldHVybiBwcmltaXRpdmUuZ2V0QXR0cmlidXRlKHNlbWFudGljKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBSZWFkcyB0aGUgY29tcG9uZW50cyBvZiB0aGUgdmVydGV4IGF0dHJpYnV0ZXMgYXMgdGhlIHZlcnRleCBmZXRjaCBvZiB0aGUgR1BVIGRvZXNcbiAqIChXZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuX19nZXRWZXJ0ZXhGb3JtYXQpOiBhIG5vcm1hbGl6ZWQgOCBvciAxNiBiaXQgYWNjZXNzb3Igd2l0aCAyIG9yIDQgY29tcG9uZW50cyBpc1xuICogY29udmVydGVkIHRvIFswLCAxXSAvIFstMSwgMV0sIHRoZSBvdGhlciB2YWx1ZXMgYXJlIHJlYWQgYXMgdGhleSBhcmUuIFRoZSBtaXNzaW5nIGNvbXBvbmVudHMgYXJlICgwLCAwLCAwLCAxKS5cbiAqL1xuY2xhc3MgQXR0cmlidXRlUmVhZGVyIHtcbiAgcHJpdmF0ZSBfX2FjY2Vzc29yPzogQWNjZXNzb3I7XG4gIHByaXZhdGUgX19jb21wb25lbnRDb3VudCA9IDA7XG4gIHByaXZhdGUgX19ieXRlU2l6ZSA9IDQ7XG4gIHByaXZhdGUgX19zY2FsZSA9IDE7XG4gIHByaXZhdGUgX19pc1NpZ25lZCA9IGZhbHNlO1xuICBwcml2YXRlIF9faXNOb3JtYWxpemVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoYWNjZXNzb3I6IEFjY2Vzc29yIHwgdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5fX2FjY2Vzc29yID0gYWNjZXNzb3I7XG4gICAgaWYgKGFjY2Vzc29yID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fX2NvbXBvbmVudENvdW50ID0gTWF0aC5taW4oYWNjZXNzb3IubnVtYmVyT2ZDb21wb25lbnRzLCA0KTtcbiAgICB0aGlzLl9fYnl0ZVNpemUgPSBhY2Nlc3Nvci5jb21wb25lbnRTaXplSW5CeXRlcztcbiAgICBjb25zdCBjb21wb25lbnRUeXBlID0gYWNjZXNzb3IuY29tcG9uZW50VHlwZTtcbiAgICBjb25zdCBoYXNOb3JtYWxpemVkRm9ybWF0ID0gYWNjZXNzb3IubnVtYmVyT2ZDb21wb25lbnRzID09PSAyIHx8IGFjY2Vzc29yLm51bWJlck9mQ29tcG9uZW50cyA9PT0gNDtcbiAgICBpZiAoYWNjZXNzb3Iubm9ybWFsaXplZCAmJiBoYXNOb3JtYWxpemVkRm9ybWF0KSB7XG4gICAgICBpZiAoY29tcG9uZW50VHlwZSA9PT0gQ29tcG9uZW50VHlwZS5VbnNpZ25lZEJ5dGUpIHtcbiAgICAgICAgdGhpcy5fX2lzTm9ybWFsaXplZCA9IHRydWU7XG4gICAgICAgIHRoaXMuX19zY2FsZSA9IDI1NTtcbiAgICAgIH0gZWxzZSBpZiAoY29tcG9uZW50VHlwZSA9PT0gQ29tcG9uZW50VHlwZS5CeXRlKSB7XG4gICAgICAgIHRoaXMuX19pc05vcm1hbGl6ZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLl9fc2NhbGUgPSAxMjc7XG4gICAgICAgIHRoaXMuX19pc1NpZ25lZCA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuVW5zaWduZWRTaG9ydCkge1xuICAgICAgICB0aGlzLl9faXNOb3JtYWxpemVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fX3NjYWxlID0gNjU1MzU7XG4gICAgICB9IGVsc2UgaWYgKGNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuU2hvcnQpIHtcbiAgICAgICAgdGhpcy5fX2lzTm9ybWFsaXplZCA9IHRydWU7XG4gICAgICAgIHRoaXMuX19zY2FsZSA9IDMyNzY3O1xuICAgICAgICB0aGlzLl9faXNTaWduZWQgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGdldCBleGlzdHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19hY2Nlc3NvciAhPT0gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqIFJlYWRzIHRoZSBjb21wb25lbnQgYGNgIG9mIHRoZSBlbGVtZW50IGBpYC4gKi9cbiAgcmVhZChpOiBudW1iZXIsIGM6IG51bWJlcik6IG51bWJlciB7XG4gICAgY29uc3QgYWNjZXNzb3IgPSB0aGlzLl9fYWNjZXNzb3I7XG4gICAgaWYgKGFjY2Vzc29yID09PSB1bmRlZmluZWQgfHwgYyA+PSB0aGlzLl9fY29tcG9uZW50Q291bnQpIHtcbiAgICAgIHJldHVybiBjID09PSAzID8gMSA6IDA7XG4gICAgfVxuICAgIGNvbnN0IHZhbHVlID0gYWNjZXNzb3IuZ2V0U2NhbGFyQXQoaSwgYyAqIHRoaXMuX19ieXRlU2l6ZSwgRW1wdHlBY2Nlc3NPcHRpb24pO1xuICAgIGlmICghdGhpcy5fX2lzTm9ybWFsaXplZCkge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBjb25zdCBub3JtYWxpemVkID0gdmFsdWUgLyB0aGlzLl9fc2NhbGU7XG4gICAgcmV0dXJuIHRoaXMuX19pc1NpZ25lZCA/IE1hdGgubWF4KG5vcm1hbGl6ZWQsIC0xKSA6IG5vcm1hbGl6ZWQ7XG4gIH1cbn1cblxuLyoqIEEgY29tcHV0ZSBzdGFnZSBhbmQgaXRzIGJpbmQgZ3JvdXAuICovXG50eXBlIERlZm9ybVN0YWdlID0ge1xuICBsYXlvdXQ6IEdQVUJpbmRHcm91cExheW91dDtcbiAgcGlwZWxpbmU6IEdQVUNvbXB1dGVQaXBlbGluZTtcbiAgYmluZEdyb3VwPzogR1BVQmluZEdyb3VwO1xuICBiaW5kR3JvdXBCdWZmZXJzOiAoR1BVQnVmZmVyIHwgdW5kZWZpbmVkKVtdO1xufTtcblxuLyoqXG4gKiBUaGUgdmVydGV4IGRlZm9ybWF0aW9uIChibGVuZCBzaGFwZXMsIHRoZW4gc2tpbm5pbmcpIG9mIHRoZSBtZXNoZXMgY3VsbGVkIG9uIHRoZSBHUFUgKFdlYkdwdUdwdUN1bGxpbmcpLlxuICpcbiAqIFRoZSB2ZXJ0aWNlcyBvZiBldmVyeSBpbnN0YW5jZSBvZiBhIGRlZm9ybWVkIG1lc2ggYXJlIGRlZm9ybWVkIG9uY2UgcGVyIGZyYW1lIGJ5IGEgY29tcHV0ZSBwYXNzIGludG8gdGhlIGRlZm9ybWVkXG4gKiB2ZXJ0ZXggYnVmZmVyLCB3aGljaCB0aGUgdmVydGV4IHNoYWRlcnMgcmVhZCAoYm91bmQgYXQgZ3JvdXAgMCwgYmluZGluZyA0OyBzZWUgcHJvY2Vzc0dlb21ldHJ5KSBpbnN0ZWFkIG9mIGRlZm9ybWluZ1xuICogdGhlIHZlcnRpY2VzIGluIGV2ZXJ5IHJlbmRlciBwYXNzLiBUaGUgcGFzcyBhbHNvIGNvbXB1dGVzIHRoZSBib3VuZGluZyBib3ggb2YgZWFjaCBkZWZvcm1lZCBpbnN0YW5jZSwgd2hpY2ggdGhlXG4gKiBjdWxsaW5nIHRlc3RzIGluc3RlYWQgb2YgdGhlIHN0YXRpYyBsb2NhbCBib3VuZGluZyBib3ggb2YgdGhlIG1lc2guXG4gKlxuICogRWFjaCBjdWxsIGdyb3VwIG9mIGEgZGVmb3JtZWQgbWVzaCBhY3F1aXJlcyB0aGUgZGVmb3JtYXRpb24gZW50cnkgb2YgdGhlIG1lc2gncyBpbnN0YW5jZSB2YXJpYXRpb24gZGF0YSAoc2hhcmVkIGJ5XG4gKiB0aGUgdmlld3MgYW5kIHJlbmRlciBidW5kbGVzIHRoYXQgZHJhdyB0aGUgbWVzaCkgYW5kIHJlbGVhc2VzIGl0IHdpdGggdGhlIGdyb3VwLlxuICovXG5leHBvcnQgY2xhc3MgV2ViR3B1VmVydGV4RGVmb3JtZXIge1xuICBwcml2YXRlIF9fZGV2aWNlOiBHUFVEZXZpY2U7XG4gIHByaXZhdGUgX19yZWdpc3RyeTogR3B1RGVmb3JtUmVnaXN0cnk7XG4gIHByaXZhdGUgX19zdGFnZTogRGVmb3JtU3RhZ2U7XG4gIHByaXZhdGUgX19wYXJhbXNCdWZmZXI6IEdQVUJ1ZmZlcjtcbiAgcHJpdmF0ZSBfX3BhcmFtc0FycmF5ID0gbmV3IFVpbnQzMkFycmF5KFBhcmFtc0J5dGVTaXplIC8gNCk7XG4gIHByaXZhdGUgX19kdW1teUJ1ZmZlcjogR1BVQnVmZmVyO1xuXG4gIHByaXZhdGUgX19zb3VyY2VzQnVmZmVyITogR1BVQnVmZmVyO1xuICBwcml2YXRlIF9fY2h1bmtzQnVmZmVyITogR1BVQnVmZmVyO1xuICBwcml2YXRlIF9fZGVmb3JtZWRCdWZmZXIhOiBHUFVCdWZmZXI7XG4gIHByaXZhdGUgX19ib3VuZHNCdWZmZXIhOiBHUFVCdWZmZXI7XG4gIHByaXZhdGUgX19zb3VyY2VzVTMyITogVWludDMyQXJyYXk7XG4gIHByaXZhdGUgX19zb3VyY2VzRjMyITogRmxvYXQzMkFycmF5O1xuICBwcml2YXRlIF9fY2h1bmtzVTMyITogVWludDMyQXJyYXk7XG4gIHByaXZhdGUgX19zb3VyY2VzRGlydHkgPSBuZXcgRGlydHlSYW5nZSgpO1xuICBwcml2YXRlIF9fY2h1bmtzRGlydHkgPSBuZXcgRGlydHlSYW5nZSgpO1xuXG4gIHByaXZhdGUgX19lbnRyeUluZm9zID0gbmV3IE1hcDxHcHVEZWZvcm1FbnRyeSwgRW50cnlJbmZvPigpO1xuICBwcml2YXRlIF9fdmVyc2lvbiA9IDA7XG4gIHByaXZhdGUgX19sYXN0RGlzcGF0Y2hlZFZlcnNpb24gPSAtMTtcbiAgcHJpdmF0ZSBfX3Jlc2V0UmVxdWVzdGVkID0gZmFsc2U7XG4gIC8qKiBgTWVzaC5fcHJpbWl0aXZlUG9zaXRpb25VcGRhdGVWZXJzaW9uYCB3aGVuIHRoZSBzb3VyY2VzIHdlcmUgbGFzdCByZXZhbGlkYXRlZC4gKi9cbiAgcHJpdmF0ZSBfX2xhc3RQb3NpdGlvblVwZGF0ZVZlcnNpb24gPSAtMTtcblxuICBjb25zdHJ1Y3RvcihkZXZpY2U6IEdQVURldmljZSkge1xuICAgIHRoaXMuX19kZXZpY2UgPSBkZXZpY2U7XG4gICAgdGhpcy5fX3JlZ2lzdHJ5ID0gbmV3IEdwdURlZm9ybVJlZ2lzdHJ5KEluaXRpYWxDYXBhY2l0aWVzKTtcbiAgICBjb25zdCByID0gJ3JlYWQtb25seS1zdG9yYWdlJztcbiAgICBjb25zdCB0eXBlczogR1BVQnVmZmVyQmluZGluZ1R5cGVbXSA9IFtyLCAndW5pZm9ybScsIHIsIHIsIHIsIHIsIHIsICdzdG9yYWdlJywgJ3N0b3JhZ2UnXTtcbiAgICBjb25zdCBsYXlvdXQgPSBkZXZpY2UuY3JlYXRlQmluZEdyb3VwTGF5b3V0KHtcbiAgICAgIGxhYmVsOiAnR3B1U2tpbm5pbmcuZGVmb3JtJyxcbiAgICAgIGVudHJpZXM6IHR5cGVzLm1hcCgodHlwZSwgYmluZGluZykgPT4gKHsgYmluZGluZywgdmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSwgYnVmZmVyOiB7IHR5cGUgfSB9KSksXG4gICAgfSk7XG4gICAgY29uc3QgcGlwZWxpbmUgPSBkZXZpY2UuY3JlYXRlQ29tcHV0ZVBpcGVsaW5lKHtcbiAgICAgIGxhYmVsOiAnR3B1U2tpbm5pbmcuZGVmb3JtJyxcbiAgICAgIGxheW91dDogZGV2aWNlLmNyZWF0ZVBpcGVsaW5lTGF5b3V0KHsgYmluZEdyb3VwTGF5b3V0czogW2xheW91dF0gfSksXG4gICAgICBjb21wdXRlOiB7XG4gICAgICAgIG1vZHVsZTogZGV2aWNlLmNyZWF0ZVNoYWRlck1vZHVsZSh7IGxhYmVsOiAnR3B1U2tpbm5pbmcuZGVmb3JtJywgY29kZTogZGVmb3JtV2dzbCB9KSxcbiAgICAgICAgZW50cnlQb2ludDogJ2RlZm9ybScsXG4gICAgICB9LFxuICAgIH0pO1xuICAgIHRoaXMuX19zdGFnZSA9IHsgbGF5b3V0LCBwaXBlbGluZSwgYmluZEdyb3VwQnVmZmVyczogW10gfTtcbiAgICB0aGlzLl9fcGFyYW1zQnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG4gICAgICBsYWJlbDogJ0dwdVNraW5uaW5nLnBhcmFtcycsXG4gICAgICBzaXplOiBQYXJhbXNCeXRlU2l6ZSxcbiAgICAgIHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5VTklGT1JNIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXG4gICAgfSk7XG4gICAgdGhpcy5fX2R1bW15QnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG4gICAgICBsYWJlbDogJ0dwdVNraW5uaW5nLmR1bW15JyxcbiAgICAgIHNpemU6IDE2LFxuICAgICAgdXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlNUT1JBR0UsXG4gICAgfSk7XG4gICAgdGhpcy5fX2NyZWF0ZVRhYmxlcyhJbml0aWFsQ2FwYWNpdGllcyk7XG4gIH1cblxuICAvKiogVGhlIGJvb2trZWVwaW5nIG9mIHRoZSBhbGxvY2F0aW9ucyAoZXhwb3NlZCBmb3IgdGVzdHMgYW5kIHN0YXRpc3RpY3MpLiAqL1xuICBnZXQgcmVnaXN0cnkoKTogR3B1RGVmb3JtUmVnaXN0cnkge1xuICAgIHJldHVybiB0aGlzLl9fcmVnaXN0cnk7XG4gIH1cblxuICAvKiogVGhlIGRlZm9ybWVkIHZlcnRpY2VzLCByZWFkIGJ5IHRoZSB2ZXJ0ZXggc2hhZGVycyAoZ3JvdXAgMCwgYmluZGluZyA0KS4gKi9cbiAgZ2V0IGRlZm9ybWVkVmVydGljZXNCdWZmZXIoKTogR1BVQnVmZmVyIHtcbiAgICByZXR1cm4gdGhpcy5fX2RlZm9ybWVkQnVmZmVyO1xuICB9XG5cbiAgLyoqIFRoZSBib3VuZGluZyBib3hlcyBvZiB0aGUgZGVmb3JtZWQgaW5zdGFuY2VzLCByZWFkIGJ5IHRoZSBjdWxsaW5nLiAqL1xuICBnZXQgYm91bmRzQnVmZmVyKCk6IEdQVUJ1ZmZlciB7XG4gICAgcmV0dXJuIHRoaXMuX19ib3VuZHNCdWZmZXI7XG4gIH1cblxuICAvKiogV2hldGhlciBhbnkgZW50cnkgaXMgYWxpdmUuICovXG4gIGdldCBoYXNFbnRyaWVzKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9fcmVnaXN0cnkuZW50cnlDb3VudCA+IDA7XG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgdGFibGVzIGNoYW5nZWQgc2luY2UgdGhlIGxhc3QgZGlzcGF0Y2ggKHRoZSBkZWZvcm1hdGlvbiBtdXN0IHJ1biBhZ2FpbikuICovXG4gIGdldCBpc0NoYW5nZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX192ZXJzaW9uICE9PSB0aGlzLl9fbGFzdERpc3BhdGNoZWRWZXJzaW9uO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgYW4gYWxsb2NhdGlvbiBmYWlsZWQgc2luY2UgdGhlIGxhc3QgcmVzZXQgKHRoZSB0YWJsZXMgbXVzdCBncm93KS4gKi9cbiAgZ2V0IGlzT3ZlcmZsb3dlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fX3JlZ2lzdHJ5LmlzT3ZlcmZsb3dlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBlbnRyaWVzIGNhbiBubyBsb25nZXIgYmUgdXBkYXRlZCBpbiBwbGFjZSAodGhlIHZlcnRleCBjb3VudHMgb2YgYSBtZXNoIGNoYW5nZWQpOiBldmVyeSBlbnRyeSBtdXN0IGJlXG4gICAqIGRyb3BwZWQgd2l0aCBgcmVzZXRgLlxuICAgKi9cbiAgZ2V0IGlzUmVzZXRSZXF1ZXN0ZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX19yZXNldFJlcXVlc3RlZDtcbiAgfVxuXG4gIC8qKiBUaGUgY3VycmVudCBjYXBhY2l0aWVzIG9mIHRoZSB0YWJsZXMuICovXG4gIGdldCBjYXBhY2l0aWVzKCk6IFJlYWRvbmx5PEdwdURlZm9ybUNhcGFjaXRpZXM+IHtcbiAgICByZXR1cm4gdGhpcy5fX3JlZ2lzdHJ5LmNhcGFjaXRpZXM7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZGVmb3JtYXRpb24gb2YgdGhlIGluc3RhbmNlcyBvZiBhIG1lc2gsIGFsbG9jYXRpbmcgYW5kIHdyaXRpbmcgaXRzIHRhYmxlcyBvbiBmaXJzdCB1c2UuXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lXG4gICAqIEBwYXJhbSBtZXNoIC0gVGhlIG1lc2ggKGBNZXNoLl9uZWVkc0NvbXB1dGVEZWZvcm1hdGlvbmApXG4gICAqIEBwYXJhbSBlbnRpdHlJbmZvIC0gVGhlIGluc3RhbmNlIHZhcmlhdGlvbiBkYXRhIG9mIHRoZSBtZXNoIChgTWVzaC5fdmFyaWF0aW9uRW50aXR5SW5mb2ApLCB3aGljaCBpZGVudGlmaWVzIHRoZVxuICAgKiAgIGRlZm9ybWF0aW9uOiBhIG5ldyBhcnJheSAoaW5zdGFuY2VzIGFkZGVkIG9yIHJlbW92ZWQpIGlzIGEgbmV3IGRlZm9ybWF0aW9uXG4gICAqIEByZXR1cm5zIFRoZSBlbnRyeSwgb3IgdW5kZWZpbmVkIHdoZW4gdGhlIHRhYmxlcyBhcmUgZnVsbCAoZHJhdyB0aGUgbWVzaCB3aXRob3V0IHRoZSBHUFUgY3VsbGluZylcbiAgICovXG4gIGFjcXVpcmUoZW5naW5lOiBFbmdpbmUsIG1lc2g6IE1lc2gsIGVudGl0eUluZm86IFVpbnQzMkFycmF5KTogR3B1RGVmb3JtRW50cnkgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IHByaW1pdGl2ZXM6IFByaW1pdGl2ZVtdID0gW107XG4gICAgY29uc3QgdmVydGV4Q291bnRzOiBudW1iZXJbXSA9IFtdO1xuICAgIGNvbnN0IHByaW1pdGl2ZU51bWJlciA9IG1lc2guZ2V0UHJpbWl0aXZlTnVtYmVyKCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmltaXRpdmVOdW1iZXI7IGkrKykge1xuICAgICAgY29uc3QgcHJpbWl0aXZlID0gbWVzaC5nZXRQcmltaXRpdmVBdChpKTtcbiAgICAgIGNvbnN0IHBvc2l0aW9uID0gZmluZEF0dHJpYnV0ZShwcmltaXRpdmUsICdQT1NJVElPTicpO1xuICAgICAgaWYgKHBvc2l0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICAgIHByaW1pdGl2ZXMucHVzaChwcmltaXRpdmUpO1xuICAgICAgdmVydGV4Q291bnRzLnB1c2gocG9zaXRpb24uZWxlbWVudENvdW50KTtcbiAgICB9XG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy5fX3JlZ2lzdHJ5LmFjcXVpcmUoZW50aXR5SW5mbywgdmVydGV4Q291bnRzLCBlbnRpdHlJbmZvLmxlbmd0aCAvIDQpO1xuICAgIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKHJlc3VsdC5pc05ldykge1xuICAgICAgY29uc3QgaW5mbzogRW50cnlJbmZvID0ge1xuICAgICAgICBlbmdpbmUsXG4gICAgICAgIG1lc2gsXG4gICAgICAgIGVudGl0eUluZm8sXG4gICAgICAgIHByaW1pdGl2ZXMsXG4gICAgICAgIHBvc2l0aW9uVXBkYXRlQ291bnQ6IG1lc2gucHJpbWl0aXZlUG9zaXRpb25VcGRhdGVDb3VudCxcbiAgICAgICAgbW9ycGhQcmltaXRpdmVDb3VudDogLTEsXG4gICAgICAgIGJsZW5kU2hhcGVPZmZzZXRzOiBbXSxcbiAgICAgIH07XG4gICAgICB0aGlzLl9fZW50cnlJbmZvcy5zZXQocmVzdWx0LmVudHJ5LCBpbmZvKTtcbiAgICAgIHRoaXMuX193cml0ZVNvdXJjZXMocmVzdWx0LmVudHJ5LCBpbmZvKTtcbiAgICAgIHRoaXMuX193cml0ZUNodW5rcyhyZXN1bHQuZW50cnksIGluZm8pO1xuICAgICAgdGhpcy5fX3ZlcnNpb24rKztcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdC5lbnRyeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIHRoZSByZWZlcmVuY2Ugb2YgYSBjdWxsIGdyb3VwIHRvIGFuIGVudHJ5IChhZnRlciB0aGUgY29tbWFuZHMgdGhhdCB1c2VkIGl0IHdlcmUgc3VibWl0dGVkKS5cbiAgICovXG4gIHJlbGVhc2UoZW50cnk6IEdwdURlZm9ybUVudHJ5KSB7XG4gICAgaWYgKCF0aGlzLl9fcmVnaXN0cnkucmVsZWFzZShlbnRyeSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fX2VudHJ5SW5mb3MuZGVsZXRlKGVudHJ5KTtcbiAgICBjb25zdCBjaHVua3MgPSB0aGlzLl9fY2h1bmtzVTMyO1xuICAgIGZvciAobGV0IGsgPSAwOyBrIDwgZW50cnkuY2h1bmtDb3VudDsgaysrKSB7XG4gICAgICAvLyBBbiB1bnVzZWQgY2h1bmsgc2xvdCBkZWZvcm1zIG5vIHZlcnRleC5cbiAgICAgIGNodW5rc1soZW50cnkuY2h1bmtCYXNlICsgaykgKiBDaHVua1dvcmRTaXplICsgMV0gPSAwO1xuICAgIH1cbiAgICB0aGlzLl9fY2h1bmtzRGlydHkuYWRkKGVudHJ5LmNodW5rQmFzZSwgZW50cnkuY2h1bmtCYXNlICsgZW50cnkuY2h1bmtDb3VudCk7XG4gICAgdGhpcy5fX3ZlcnNpb24rKztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgaW5kZXggb2YgdGhlIGZpcnN0IGRlZm9ybWVkIHZlcnRleCBvZiBhIHByaW1pdGl2ZSBhbW9uZyB0aGUgZGVmb3JtZWQgdmVydGljZXMgb2YgYW4gaW5zdGFuY2VcbiAgICogKGBVbmlmb3JtRHJhd1BhcmFtZXRlcnMuZGVmb3JtZWRWZXJ0ZXhPZmZzZXRgKSwgb3IgdW5kZWZpbmVkIHdoZW4gdGhlIHByaW1pdGl2ZSBpcyBub3Qgb25lIG9mIHRoZSBlbnRyeSdzIG1lc2guXG4gICAqL1xuICBnZXRQcmltaXRpdmVPZmZzZXQoZW50cnk6IEdwdURlZm9ybUVudHJ5LCBwcmltaXRpdmU6IFByaW1pdGl2ZSk6IG51bWJlciB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgaW5mbyA9IHRoaXMuX19lbnRyeUluZm9zLmdldChlbnRyeSk7XG4gICAgaWYgKGluZm8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgY29uc3QgaW5kZXggPSBpbmZvLnByaW1pdGl2ZXMuaW5kZXhPZihwcmltaXRpdmUpO1xuICAgIHJldHVybiBpbmRleCA8IDAgPyB1bmRlZmluZWQgOiBlbnRyeS5wcmltaXRpdmVPZmZzZXRzW2luZGV4XTtcbiAgfVxuXG4gIC8qKiBUaGUgaW5kZXggb2YgdGhlIGZpcnN0IGRlZm9ybWVkIHZlcnRleCBvZiBhbiBpbnN0YW5jZSAodGhlIHcgb2YgaXRzIGluc3RhbmNlIGlkcyBtaW51cyAxKS4gKi9cbiAgZ2V0SW5zdGFuY2VEZWZvcm1lZEJhc2UoZW50cnk6IEdwdURlZm9ybUVudHJ5LCBpbnN0YW5jZUluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiBlbnRyeS5kZWZvcm1lZEJhc2UgKyBpbnN0YW5jZUluZGV4ICogZW50cnkudmVydGV4Q291bnQ7XG4gIH1cblxuICAvKiogVGhlIGJvdW5kaW5nIGJveCBzbG90IG9mIGFuIGluc3RhbmNlLiAqL1xuICBnZXRJbnN0YW5jZUJvdW5kc1Nsb3QoZW50cnk6IEdwdURlZm9ybUVudHJ5LCBpbnN0YW5jZUluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiBlbnRyeS5ib3VuZHNCYXNlICsgaW5zdGFuY2VJbmRleDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXdyaXRlcyB0aGUgdGFibGVzIHRoYXQgZGVwZW5kIG9uIGRhdGEgY2hhbmdlZCBzaW5jZSB0aGV5IHdlcmUgd3JpdHRlbjogdGhlIHNvdXJjZXMgb2YgdGhlIG1lc2hlcyB3aG9zZSB2ZXJ0ZXhcbiAgICogcG9zaXRpb25zIHdlcmUgdXBkYXRlZCwgYW5kIHRoZSBjaHVua3Mgd2hlbiB0aGUgbGF5b3V0IG9mIHRoZSBtb3JwaCB0YXJnZXRzIGNoYW5nZWQuIENhbGwgb25jZSBwZXIgZnJhbWUgYmVmb3JlXG4gICAqIGBlbmNvZGVgLlxuICAgKi9cbiAgcmVmcmVzaCgpIHtcbiAgICBjb25zdCBwb3NpdGlvblVwZGF0ZVZlcnNpb24gPSBNZXNoLl9wcmltaXRpdmVQb3NpdGlvblVwZGF0ZVZlcnNpb247XG4gICAgaWYgKHBvc2l0aW9uVXBkYXRlVmVyc2lvbiAhPT0gdGhpcy5fX2xhc3RQb3NpdGlvblVwZGF0ZVZlcnNpb24pIHtcbiAgICAgIHRoaXMuX19sYXN0UG9zaXRpb25VcGRhdGVWZXJzaW9uID0gcG9zaXRpb25VcGRhdGVWZXJzaW9uO1xuICAgICAgdGhpcy5fX3JlZnJlc2hDaGFuZ2VkU291cmNlcygpO1xuICAgIH1cbiAgICB0aGlzLl9fcmVmcmVzaE1vcnBoTGF5b3V0cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlY29yZHMgdGhlIGRlZm9ybWF0aW9uIGNvbXB1dGUgcGFzcyAoYWZ0ZXIgY2xlYXJpbmcgdGhlIGJvdW5kaW5nIGJveGVzKSB3aGVuIHRoZXJlIGlzIGFueXRoaW5nIHRvIGRlZm9ybS5cbiAgICpcbiAgICogQHBhcmFtIGVuY29kZXIgLSBUaGUgY29tbWFuZCBlbmNvZGVyLCBzdWJtaXR0ZWQgYmVmb3JlIHRoZSBjb21tYW5kcyB0aGF0IGRyYXcgdGhlIGRlZm9ybWVkIHZlcnRpY2VzXG4gICAqIEBwYXJhbSBzdG9yYWdlQnVmZmVyIC0gVGhlIHN0b3JhZ2UgYnVmZmVyIG9mIHRoZSBHUFUgaW5zdGFuY2UgZGF0YSAodGhlIGJvbmUgZGF0YSlcbiAgICogQHBhcmFtIG1vcnBoQnVmZmVycyAtIFRoZSBidWZmZXJzIG9mIHRoZSBtb3JwaCB0YXJnZXRzXG4gICAqIEBwYXJhbSBncHVUaW1lciAtIFdoZW4gc2V0IChhbmQgYSBmcmFtZSBpcyBiZWluZyBtZWFzdXJlZCksIG1lYXN1cmVzIHRoZSBwYXNzIGFzICdHcHVTa2lubmluZydcbiAgICogQHJldHVybnMgVHJ1ZSB3aGVuIHRoZSBwYXNzIHdhcyByZWNvcmRlZFxuICAgKi9cbiAgZW5jb2RlKFxuICAgIGVuY29kZXI6IEdQVUNvbW1hbmRFbmNvZGVyLFxuICAgIHN0b3JhZ2VCdWZmZXI6IEdQVUJ1ZmZlcixcbiAgICBtb3JwaEJ1ZmZlcnM6IEdwdURlZm9ybU1vcnBoQnVmZmVycyxcbiAgICBncHVUaW1lcj86IFdlYkdwdUdwdVRpbWVyXG4gICk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHJlZ2lzdHJ5ID0gdGhpcy5fX3JlZ2lzdHJ5O1xuICAgIGlmIChyZWdpc3RyeS5lbnRyeUNvdW50ID09PSAwKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IGRldmljZSA9IHRoaXMuX19kZXZpY2U7XG4gICAgdGhpcy5fX3VwbG9hZERpcnR5KHRoaXMuX19zb3VyY2VzQnVmZmVyLCB0aGlzLl9fc291cmNlc1UzMiwgdGhpcy5fX3NvdXJjZXNEaXJ0eSwgU291cmNlVmVydGV4V29yZFNpemUpO1xuICAgIHRoaXMuX191cGxvYWREaXJ0eSh0aGlzLl9fY2h1bmtzQnVmZmVyLCB0aGlzLl9fY2h1bmtzVTMyLCB0aGlzLl9fY2h1bmtzRGlydHksIENodW5rV29yZFNpemUpO1xuXG4gICAgY29uc3QgY2h1bmtDb3VudCA9IHJlZ2lzdHJ5LmNodW5rSGlnaFdhdGVyO1xuICAgIGNvbnN0IGNodW5rc1BlclJvdyA9IE1hdGgubWF4KDEsIE1hdGgubWluKGNodW5rQ291bnQsIE1heFdvcmtncm91cHNQZXJEaW1lbnNpb24pKTtcbiAgICBjb25zdCBwYXJhbXMgPSB0aGlzLl9fcGFyYW1zQXJyYXk7XG4gICAgcGFyYW1zWzBdID0gY2h1bmtDb3VudDtcbiAgICBwYXJhbXNbMV0gPSBjaHVua3NQZXJSb3c7XG4gICAgZGV2aWNlLnF1ZXVlLndyaXRlQnVmZmVyKHRoaXMuX19wYXJhbXNCdWZmZXIsIDAsIHBhcmFtcyk7XG5cbiAgICBjb25zdCBzdGFnZSA9IHRoaXMuX19zdGFnZTtcbiAgICBjb25zdCBidWZmZXJzID0gW1xuICAgICAgc3RvcmFnZUJ1ZmZlcixcbiAgICAgIHRoaXMuX19wYXJhbXNCdWZmZXIsXG4gICAgICB0aGlzLl9fc291cmNlc0J1ZmZlcixcbiAgICAgIHRoaXMuX19jaHVua3NCdWZmZXIsXG4gICAgICBtb3JwaEJ1ZmZlcnMuYmxlbmRTaGFwZURhdGEgPz8gdGhpcy5fX2R1bW15QnVmZmVyLFxuICAgICAgbW9ycGhCdWZmZXJzLm1vcnBoT2Zmc2V0cyA/PyB0aGlzLl9fZHVtbXlCdWZmZXIsXG4gICAgICBtb3JwaEJ1ZmZlcnMubW9ycGhXZWlnaHRzID8/IHRoaXMuX19kdW1teUJ1ZmZlcixcbiAgICAgIHRoaXMuX19kZWZvcm1lZEJ1ZmZlcixcbiAgICAgIHRoaXMuX19ib3VuZHNCdWZmZXIsXG4gICAgXTtcbiAgICBsZXQgaXNCaW5kR3JvdXBWYWxpZCA9IHN0YWdlLmJpbmRHcm91cCAhPSBudWxsO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYnVmZmVycy5sZW5ndGggJiYgaXNCaW5kR3JvdXBWYWxpZDsgaSsrKSB7XG4gICAgICBpc0JpbmRHcm91cFZhbGlkID0gc3RhZ2UuYmluZEdyb3VwQnVmZmVyc1tpXSA9PT0gYnVmZmVyc1tpXTtcbiAgICB9XG4gICAgaWYgKCFpc0JpbmRHcm91cFZhbGlkKSB7XG4gICAgICBzdGFnZS5iaW5kR3JvdXAgPSBkZXZpY2UuY3JlYXRlQmluZEdyb3VwKHtcbiAgICAgICAgbGFiZWw6ICdHcHVTa2lubmluZy5kZWZvcm0nLFxuICAgICAgICBsYXlvdXQ6IHN0YWdlLmxheW91dCxcbiAgICAgICAgZW50cmllczogYnVmZmVycy5tYXAoKGJ1ZmZlciwgYmluZGluZykgPT4gKHsgYmluZGluZywgcmVzb3VyY2U6IHsgYnVmZmVyIH0gfSkpLFxuICAgICAgfSk7XG4gICAgICBzdGFnZS5iaW5kR3JvdXBCdWZmZXJzID0gYnVmZmVycztcbiAgICB9XG5cbiAgICAvLyBUaGUgYm91bmRpbmcgYm94ZXMgYXJlIG1lcmdlZCB3aXRoIGF0b21pY01heCwgZnJvbSAwIChlbXB0eSkuXG4gICAgZW5jb2Rlci5jbGVhckJ1ZmZlcih0aGlzLl9fYm91bmRzQnVmZmVyLCAwLCByZWdpc3RyeS5ib3VuZHNIaWdoV2F0ZXIgKiBEZWZvcm1Cb3VuZHNCeXRlU2l6ZSk7XG4gICAgY29uc3QgcGFzc0Rlc2NyaXB0b3I6IEdQVUNvbXB1dGVQYXNzRGVzY3JpcHRvciA9IHsgbGFiZWw6ICdHcHVTa2lubmluZycgfTtcbiAgICBjb25zdCB0aW1lc3RhbXBXcml0ZXMgPSBncHVUaW1lcj8uZ2V0VGltZXN0YW1wV3JpdGVzKCdHcHVTa2lubmluZycpO1xuICAgIGlmICh0aW1lc3RhbXBXcml0ZXMgIT0gbnVsbCkge1xuICAgICAgcGFzc0Rlc2NyaXB0b3IudGltZXN0YW1wV3JpdGVzID0gdGltZXN0YW1wV3JpdGVzO1xuICAgIH1cbiAgICBjb25zdCBwYXNzID0gZW5jb2Rlci5iZWdpbkNvbXB1dGVQYXNzKHBhc3NEZXNjcmlwdG9yKTtcbiAgICBpZiAoY2h1bmtDb3VudCA+IDApIHtcbiAgICAgIHBhc3Muc2V0UGlwZWxpbmUoc3RhZ2UucGlwZWxpbmUpO1xuICAgICAgcGFzcy5zZXRCaW5kR3JvdXAoMCwgc3RhZ2UuYmluZEdyb3VwISk7XG4gICAgICBwYXNzLmRpc3BhdGNoV29ya2dyb3VwcyhjaHVua3NQZXJSb3csIE1hdGguY2VpbChjaHVua0NvdW50IC8gY2h1bmtzUGVyUm93KSk7XG4gICAgfVxuICAgIHBhc3MuZW5kKCk7XG4gICAgdGhpcy5fX2xhc3REaXNwYXRjaGVkVmVyc2lvbiA9IHRoaXMuX192ZXJzaW9uO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBjYXBhY2l0aWVzIHRoZSB0YWJsZXMgbXVzdCBncm93IHRvIGFmdGVyIGFuIGFsbG9jYXRpb24gZmFpbGVkLCBvciB1bmRlZmluZWQgd2hlbiB0aGV5IGRpZCBub3Qgb3ZlcmZsb3cgb3JcbiAgICogY2Fubm90IGdyb3cgKHRoZSBkZXZpY2UgbGltaXRzIGFyZSByZWFjaGVkOyB0aGUgZmFpbGVkIGRyYXdzIHN0YXkgdW5jdWxsZWQpLlxuICAgKi9cbiAgZ2V0R3Jvd25DYXBhY2l0aWVzKCk6IEdwdURlZm9ybUNhcGFjaXRpZXMgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IHJlZ2lzdHJ5ID0gdGhpcy5fX3JlZ2lzdHJ5O1xuICAgIGlmICghcmVnaXN0cnkuaXNPdmVyZmxvd2VkKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBjb25zdCByZXF1aXJlZCA9IHJlZ2lzdHJ5LnJlcXVpcmVkQ2FwYWNpdGllcztcbiAgICBjb25zdCBjdXJyZW50ID0gcmVnaXN0cnkuY2FwYWNpdGllcztcbiAgICBjb25zdCBsaW1pdHMgPSB0aGlzLl9fZGV2aWNlLmxpbWl0cztcbiAgICBjb25zdCBtYXhCeXRlcyA9IE1hdGgubWluKGxpbWl0cy5tYXhTdG9yYWdlQnVmZmVyQmluZGluZ1NpemUsIGxpbWl0cy5tYXhCdWZmZXJTaXplKTtcbiAgICBjb25zdCBncm93ID0gKGNhcGFjaXR5OiBudW1iZXIsIG5lZWRlZDogbnVtYmVyLCBieXRlc1BlclNsb3Q6IG51bWJlcikgPT4ge1xuICAgICAgbGV0IG5leHQgPSBjYXBhY2l0eTtcbiAgICAgIHdoaWxlIChuZXh0IDwgbmVlZGVkICogMS4yNSkge1xuICAgICAgICBuZXh0ICo9IDI7XG4gICAgICB9XG4gICAgICByZXR1cm4gTWF0aC5tYXgoY2FwYWNpdHksIE1hdGgubWluKG5leHQsIE1hdGguZmxvb3IobWF4Qnl0ZXMgLyBieXRlc1BlclNsb3QpKSk7XG4gICAgfTtcbiAgICBjb25zdCBjYXBhY2l0aWVzOiBHcHVEZWZvcm1DYXBhY2l0aWVzID0ge1xuICAgICAgc291cmNlVmVydGljZXM6IGdyb3coY3VycmVudC5zb3VyY2VWZXJ0aWNlcywgcmVxdWlyZWQuc291cmNlVmVydGljZXMsIFNvdXJjZVZlcnRleEJ5dGVTaXplKSxcbiAgICAgIGRlZm9ybWVkVmVydGljZXM6IGdyb3coY3VycmVudC5kZWZvcm1lZFZlcnRpY2VzLCByZXF1aXJlZC5kZWZvcm1lZFZlcnRpY2VzLCBEZWZvcm1lZFZlcnRleEJ5dGVTaXplKSxcbiAgICAgIGJvdW5kczogZ3JvdyhjdXJyZW50LmJvdW5kcywgcmVxdWlyZWQuYm91bmRzLCBEZWZvcm1Cb3VuZHNCeXRlU2l6ZSksXG4gICAgICBjaHVua3M6IGdyb3coY3VycmVudC5jaHVua3MsIHJlcXVpcmVkLmNodW5rcywgQ2h1bmtCeXRlU2l6ZSksXG4gICAgfTtcbiAgICBpZiAoXG4gICAgICBjYXBhY2l0aWVzLnNvdXJjZVZlcnRpY2VzID09PSBjdXJyZW50LnNvdXJjZVZlcnRpY2VzICYmXG4gICAgICBjYXBhY2l0aWVzLmRlZm9ybWVkVmVydGljZXMgPT09IGN1cnJlbnQuZGVmb3JtZWRWZXJ0aWNlcyAmJlxuICAgICAgY2FwYWNpdGllcy5ib3VuZHMgPT09IGN1cnJlbnQuYm91bmRzICYmXG4gICAgICBjYXBhY2l0aWVzLmNodW5rcyA9PT0gY3VycmVudC5jaHVua3NcbiAgICApIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiBjYXBhY2l0aWVzO1xuICB9XG5cbiAgLyoqXG4gICAqIERyb3BzIGV2ZXJ5IGVudHJ5IGFuZCByZWNyZWF0ZXMgdGhlIHRhYmxlcy4gVGhlIGN1bGwgZ3JvdXBzIHRoYXQgcmVmZXJlbmNlZCB0aGUgZW50cmllcyBtdXN0IGJlIGRyb3BwZWQgYXMgd2VsbCxcbiAgICogYW5kIHRoZSByZW5kZXIgYnVuZGxlcyB0aGF0IGJvdW5kIHRoZSBkZWZvcm1lZCB2ZXJ0ZXggYnVmZmVyLlxuICAgKi9cbiAgcmVzZXQoY2FwYWNpdGllczogR3B1RGVmb3JtQ2FwYWNpdGllcykge1xuICAgIHRoaXMuX19kZXN0cm95VGFibGVzKCk7XG4gICAgdGhpcy5fX2NyZWF0ZVRhYmxlcyhjYXBhY2l0aWVzKTtcbiAgICB0aGlzLl9fcmVnaXN0cnkucmVzZXQoY2FwYWNpdGllcyk7XG4gICAgdGhpcy5fX2VudHJ5SW5mb3MuY2xlYXIoKTtcbiAgICB0aGlzLl9fcmVzZXRSZXF1ZXN0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9fdmVyc2lvbisrO1xuICB9XG5cbiAgLyoqIFJlbGVhc2VzIHRoZSBHUFUgcmVzb3VyY2VzLiAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuX19kZXN0cm95VGFibGVzKCk7XG4gICAgdGhpcy5fX3BhcmFtc0J1ZmZlci5kZXN0cm95KCk7XG4gICAgdGhpcy5fX2R1bW15QnVmZmVyLmRlc3Ryb3koKTtcbiAgfVxuXG4gIHByaXZhdGUgX19jcmVhdGVUYWJsZXMoY2FwYWNpdGllczogR3B1RGVmb3JtQ2FwYWNpdGllcykge1xuICAgIGNvbnN0IGRldmljZSA9IHRoaXMuX19kZXZpY2U7XG4gICAgdGhpcy5fX3NvdXJjZXNCdWZmZXIgPSBkZXZpY2UuY3JlYXRlQnVmZmVyKHtcbiAgICAgIGxhYmVsOiAnR3B1U2tpbm5pbmcuc291cmNlcycsXG4gICAgICBzaXplOiBjYXBhY2l0aWVzLnNvdXJjZVZlcnRpY2VzICogU291cmNlVmVydGV4Qnl0ZVNpemUsXG4gICAgICB1c2FnZTogR1BVQnVmZmVyVXNhZ2UuU1RPUkFHRSB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxuICAgIH0pO1xuICAgIHRoaXMuX19jaHVua3NCdWZmZXIgPSBkZXZpY2UuY3JlYXRlQnVmZmVyKHtcbiAgICAgIGxhYmVsOiAnR3B1U2tpbm5pbmcuY2h1bmtzJyxcbiAgICAgIHNpemU6IGNhcGFjaXRpZXMuY2h1bmtzICogQ2h1bmtCeXRlU2l6ZSxcbiAgICAgIHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5TVE9SQUdFIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXG4gICAgfSk7XG4gICAgLy8gQm91bmQgaW4gZ3JvdXAgMCBvZiB0aGUgZHJhd3M6IHJlcGxhY2luZyBpdCByZXF1aXJlcyByZS1yZWNvcmRpbmcgdGhlIHJlbmRlciBidW5kbGVzLlxuICAgIHRoaXMuX19kZWZvcm1lZEJ1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuICAgICAgbGFiZWw6ICdHcHVTa2lubmluZy5kZWZvcm1lZFZlcnRpY2VzJyxcbiAgICAgIHNpemU6IGNhcGFjaXRpZXMuZGVmb3JtZWRWZXJ0aWNlcyAqIERlZm9ybWVkVmVydGV4Qnl0ZVNpemUsXG4gICAgICAvLyBDT1BZX1NSQyBsZXRzIHRlc3RzIGFuZCB0b29scyByZWFkIGJhY2sgdGhlIGRlZm9ybWVkIHZlcnRpY2VzLlxuICAgICAgdXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlNUT1JBR0UgfCBHUFVCdWZmZXJVc2FnZS5DT1BZX1NSQyxcbiAgICB9KTtcbiAgICB0aGlzLl9fYm91bmRzQnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG4gICAgICBsYWJlbDogJ0dwdVNraW5uaW5nLmJvdW5kcycsXG4gICAgICBzaXplOiBjYXBhY2l0aWVzLmJvdW5kcyAqIERlZm9ybUJvdW5kc0J5dGVTaXplLFxuICAgICAgdXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlNUT1JBR0UgfCBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfU1JDLFxuICAgIH0pO1xuICAgIGNvbnN0IHNvdXJjZXMgPSBuZXcgQXJyYXlCdWZmZXIoY2FwYWNpdGllcy5zb3VyY2VWZXJ0aWNlcyAqIFNvdXJjZVZlcnRleEJ5dGVTaXplKTtcbiAgICB0aGlzLl9fc291cmNlc1UzMiA9IG5ldyBVaW50MzJBcnJheShzb3VyY2VzKTtcbiAgICB0aGlzLl9fc291cmNlc0YzMiA9IG5ldyBGbG9hdDMyQXJyYXkoc291cmNlcyk7XG4gICAgdGhpcy5fX2NodW5rc1UzMiA9IG5ldyBVaW50MzJBcnJheShjYXBhY2l0aWVzLmNodW5rcyAqIENodW5rV29yZFNpemUpO1xuICAgIHRoaXMuX19zb3VyY2VzRGlydHkuY2xlYXIoKTtcbiAgICAvLyBUaGUgbmV3IGNodW5rIGJ1ZmZlciBpcyB1bmluaXRpYWxpemVkOiB1cGxvYWQgaXQgd2hvbGUgKGFsbCB1bnVzZWQpIG9uY2UuXG4gICAgdGhpcy5fX2NodW5rc0RpcnR5LmNsZWFyKCk7XG4gICAgdGhpcy5fX2NodW5rc0RpcnR5LmFkZCgwLCBjYXBhY2l0aWVzLmNodW5rcyk7XG4gICAgdGhpcy5fX3N0YWdlLmJpbmRHcm91cCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fc3RhZ2UuYmluZEdyb3VwQnVmZmVycyA9IFtdO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2Rlc3Ryb3lUYWJsZXMoKSB7XG4gICAgdGhpcy5fX3NvdXJjZXNCdWZmZXI/LmRlc3Ryb3koKTtcbiAgICB0aGlzLl9fY2h1bmtzQnVmZmVyPy5kZXN0cm95KCk7XG4gICAgdGhpcy5fX2RlZm9ybWVkQnVmZmVyPy5kZXN0cm95KCk7XG4gICAgdGhpcy5fX2JvdW5kc0J1ZmZlcj8uZGVzdHJveSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBfX3VwbG9hZERpcnR5KGJ1ZmZlcjogR1BVQnVmZmVyLCBtaXJyb3I6IFVpbnQzMkFycmF5LCBkaXJ0eTogRGlydHlSYW5nZSwgd29yZHNQZXJTbG90OiBudW1iZXIpIHtcbiAgICBpZiAoZGlydHkuaXNFbXB0eSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBiZWdpbiA9IGRpcnR5Lm1pbiAqIHdvcmRzUGVyU2xvdDtcbiAgICBjb25zdCBlbmQgPSBNYXRoLm1pbihkaXJ0eS5tYXggKiB3b3Jkc1BlclNsb3QsIG1pcnJvci5sZW5ndGgpO1xuICAgIHRoaXMuX19kZXZpY2UucXVldWUud3JpdGVCdWZmZXIoYnVmZmVyLCBiZWdpbiAqIDQsIG1pcnJvciwgYmVnaW4sIGVuZCAtIGJlZ2luKTtcbiAgICBkaXJ0eS5jbGVhcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIFdyaXRlcyB0aGUgdW5kZWZvcm1lZCB2ZXJ0aWNlcyBvZiB0aGUgcHJpbWl0aXZlcyBvZiBhbiBlbnRyeSdzIG1lc2guXG4gICAqL1xuICBwcml2YXRlIF9fd3JpdGVTb3VyY2VzKGVudHJ5OiBHcHVEZWZvcm1FbnRyeSwgaW5mbzogRW50cnlJbmZvKSB7XG4gICAgY29uc3QgdTMyID0gdGhpcy5fX3NvdXJjZXNVMzI7XG4gICAgY29uc3QgZjMyID0gdGhpcy5fX3NvdXJjZXNGMzI7XG4gICAgZm9yIChsZXQgcCA9IDA7IHAgPCBpbmZvLnByaW1pdGl2ZXMubGVuZ3RoOyBwKyspIHtcbiAgICAgIGNvbnN0IHByaW1pdGl2ZSA9IGluZm8ucHJpbWl0aXZlc1twXTtcbiAgICAgIGNvbnN0IHBvc2l0aW9uID0gbmV3IEF0dHJpYnV0ZVJlYWRlcihmaW5kQXR0cmlidXRlKHByaW1pdGl2ZSwgJ1BPU0lUSU9OJykpO1xuICAgICAgY29uc3Qgbm9ybWFsID0gbmV3IEF0dHJpYnV0ZVJlYWRlcihmaW5kQXR0cmlidXRlKHByaW1pdGl2ZSwgJ05PUk1BTCcpKTtcbiAgICAgIGNvbnN0IGpvaW50cyA9IG5ldyBBdHRyaWJ1dGVSZWFkZXIoZmluZEF0dHJpYnV0ZShwcmltaXRpdmUsICdKT0lOVFNfMCcpKTtcbiAgICAgIGNvbnN0IHdlaWdodHMgPSBuZXcgQXR0cmlidXRlUmVhZGVyKGZpbmRBdHRyaWJ1dGUocHJpbWl0aXZlLCAnV0VJR0hUU18wJykpO1xuICAgICAgY29uc3QgYmFyeUNlbnRyaWNDb29yZCA9IG5ldyBBdHRyaWJ1dGVSZWFkZXIoZmluZEF0dHJpYnV0ZShwcmltaXRpdmUsICdCQVJZX0NFTlRSSUNfQ09PUkQnKSk7XG4gICAgICBjb25zdCBiYXNlID0gZW50cnkuc291cmNlQmFzZSArIGVudHJ5LnByaW1pdGl2ZU9mZnNldHNbcF07XG4gICAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IGVudHJ5LnByaW1pdGl2ZVZlcnRleENvdW50c1twXTtcbiAgICAgIGZvciAobGV0IHYgPSAwOyB2IDwgdmVydGV4Q291bnQ7IHYrKykge1xuICAgICAgICBjb25zdCB3ID0gKGJhc2UgKyB2KSAqIFNvdXJjZVZlcnRleFdvcmRTaXplO1xuICAgICAgICBmMzJbd10gPSBwb3NpdGlvbi5yZWFkKHYsIDApO1xuICAgICAgICBmMzJbdyArIDFdID0gcG9zaXRpb24ucmVhZCh2LCAxKTtcbiAgICAgICAgZjMyW3cgKyAyXSA9IHBvc2l0aW9uLnJlYWQodiwgMik7XG4gICAgICAgIC8vIFRoZSB2ZXJ0ZXggaW5kZXggb2YgdGhlIG1vcnBoIHRhcmdldHMsIGFzIHByb2Nlc3NHZW9tZXRyeSByZWFkcyBpdCBmcm9tIHRoZSBiYXJ5Y2VudHJpYyBjb29yZGluYXRlLlxuICAgICAgICB1MzJbdyArIDNdID0gYmFyeUNlbnRyaWNDb29yZC5leGlzdHMgPyBNYXRoLm1heCgwLCBNYXRoLnRydW5jKGJhcnlDZW50cmljQ29vcmQucmVhZCh2LCAzKSkpIDogdjtcbiAgICAgICAgaWYgKG5vcm1hbC5leGlzdHMpIHtcbiAgICAgICAgICBmMzJbdyArIDRdID0gbm9ybWFsLnJlYWQodiwgMCk7XG4gICAgICAgICAgZjMyW3cgKyA1XSA9IG5vcm1hbC5yZWFkKHYsIDEpO1xuICAgICAgICAgIGYzMlt3ICsgNl0gPSBub3JtYWwucmVhZCh2LCAyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmMzJbdyArIDRdID0gMDtcbiAgICAgICAgICBmMzJbdyArIDVdID0gMDtcbiAgICAgICAgICBmMzJbdyArIDZdID0gMDtcbiAgICAgICAgfVxuICAgICAgICBmMzJbdyArIDddID0gMDtcbiAgICAgICAgZm9yIChsZXQgYyA9IDA7IGMgPCA0OyBjKyspIHtcbiAgICAgICAgICB1MzJbdyArIDggKyBjXSA9IGpvaW50cy5leGlzdHMgPyBNYXRoLm1heCgwLCBNYXRoLnRydW5jKGpvaW50cy5yZWFkKHYsIGMpKSkgOiAwO1xuICAgICAgICAgIGYzMlt3ICsgMTIgKyBjXSA9IHdlaWdodHMuZXhpc3RzID8gd2VpZ2h0cy5yZWFkKHYsIGMpIDogMDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9fc291cmNlc0RpcnR5LmFkZChlbnRyeS5zb3VyY2VCYXNlLCBlbnRyeS5zb3VyY2VCYXNlICsgZW50cnkudmVydGV4Q291bnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFdyaXRlcyB0aGUgY2h1bmtzIG9mIGFuIGVudHJ5OiB0aGUgc291cmNlIGFuZCBkZXN0aW5hdGlvbiByYW5nZXMsIHRoZSBza2VsZXRvbiBhbmQgdGhlIG1vcnBoIHRhcmdldHMgYXBwbGllZCB0b1xuICAgKiBlYWNoIHByaW1pdGl2ZSBvZiBlYWNoIGluc3RhbmNlLlxuICAgKi9cbiAgcHJpdmF0ZSBfX3dyaXRlQ2h1bmtzKGVudHJ5OiBHcHVEZWZvcm1FbnRyeSwgaW5mbzogRW50cnlJbmZvKSB7XG4gICAgY29uc3QgZW5naW5lID0gaW5mby5lbmdpbmU7XG4gICAgY29uc3QgZW50aXR5SW5mbyA9IGluZm8uZW50aXR5SW5mbztcbiAgICBpbmZvLm1vcnBoUHJpbWl0aXZlQ291bnQgPSBQcmltaXRpdmUuZ2V0UHJpbWl0aXZlQ291bnRIYXNNb3JwaCgpO1xuICAgIGluZm8uYmxlbmRTaGFwZU9mZnNldHMgPSBCbGVuZFNoYXBlQ29tcG9uZW50LmdldE9mZnNldHNJblVuaWZvcm0oZW5naW5lKTtcbiAgICBjb25zdCBtb3JwaE9mZnNldHMgPSBQcmltaXRpdmUuZ2V0TW9ycGhVbmlmb3JtRGF0YU9mZnNldHMoKTtcbiAgICBjb25zdCBibGVuZFNoYXBlT2Zmc2V0cyA9IGluZm8uYmxlbmRTaGFwZU9mZnNldHM7XG5cbiAgICAvLyBUaGUgc3RvcmFnZSBsb2NhdGlvbnMgb2YgdGhlIFNrZWxldGFsQ29tcG9uZW50IG1lbWJlcnMsIHdpdGggdGhlIHNhbWUgZm9ybXVsYSBhcyB0aGUgZ2V0dGVycyBnZW5lcmF0ZWQgYnlcbiAgICAvLyBXZWJHcHVTdHJhdGVneUJhc2ljLmdldFZlcnRleFNoYWRlck1ldGhvZERlZmluaXRpb25zX3N0b3JhZ2VCdWZmZXIgKFZlYzQgbWVtYmVycykuXG4gICAgY29uc3QgY291bnRQZXJCdWZmZXJWaWV3ID0gQ29tcG9uZW50LmdldENvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldyhlbmdpbmUpLmdldChTa2VsZXRhbENvbXBvbmVudCkgPz8gMTtcbiAgICBjb25zdCBsb2NhdGlvbk9mZnNldHMgPSBDb21wb25lbnQuZ2V0TG9jYXRpb25PZmZzZXRPZk1lbWJlck9mQ29tcG9uZW50KFxuICAgICAgZW5naW5lLFxuICAgICAgU2tlbGV0YWxDb21wb25lbnQsXG4gICAgICBDb21wb25lbnQuX2dldFZhcmlhYmxlTGVuZ3RoTG9jYXRpb25NZW1iZXJOYW1lKCdib25lRGF0YScpXG4gICAgKTtcbiAgICBjb25zdCBpbmZvT2Zmc2V0cyA9IENvbXBvbmVudC5nZXRMb2NhdGlvbk9mZnNldE9mTWVtYmVyT2ZDb21wb25lbnQoZW5naW5lLCBTa2VsZXRhbENvbXBvbmVudCwgJ2JvbmVEYXRhSW5mbycpO1xuXG4gICAgY29uc3QgY2h1bmtzID0gdGhpcy5fX2NodW5rc1UzMjtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVudHJ5Lmluc3RhbmNlQ291bnQ7IGkrKykge1xuICAgICAgY29uc3Qgc2tlbGV0YWxTSUQgPSBlbnRpdHlJbmZvWzQgKiBpICsgMV07XG4gICAgICBjb25zdCBibGVuZFNoYXBlU0lEID0gZW50aXR5SW5mb1s0ICogaSArIDJdO1xuICAgICAgbGV0IGJvbmVEYXRhTG9jYXRpb25JbmRleCA9IEludmFsaWQ7XG4gICAgICBsZXQgYm9uZURhdGFJbmZvSW5kZXggPSAwO1xuICAgICAgaWYgKHNrZWxldGFsU0lEICE9PSBJbnZhbGlkKSB7XG4gICAgICAgIGNvbnN0IGJ1ZmZlclZpZXdJbmRleCA9IE1hdGguZmxvb3Ioc2tlbGV0YWxTSUQgLyBjb3VudFBlckJ1ZmZlclZpZXcpO1xuICAgICAgICBjb25zdCBpbmRleEluQnVmZmVyVmlldyA9IHNrZWxldGFsU0lEICUgY291bnRQZXJCdWZmZXJWaWV3O1xuICAgICAgICBib25lRGF0YUxvY2F0aW9uSW5kZXggPSAobG9jYXRpb25PZmZzZXRzW2J1ZmZlclZpZXdJbmRleF0gPz8gMCkgKyBpbmRleEluQnVmZmVyVmlldztcbiAgICAgICAgYm9uZURhdGFJbmZvSW5kZXggPSAoaW5mb09mZnNldHNbYnVmZmVyVmlld0luZGV4XSA/PyAwKSArIGluZGV4SW5CdWZmZXJWaWV3O1xuICAgICAgfVxuICAgICAgY29uc3QgaW5zdGFuY2VEZWZvcm1lZEJhc2UgPSB0aGlzLmdldEluc3RhbmNlRGVmb3JtZWRCYXNlKGVudHJ5LCBpKTtcbiAgICAgIGNvbnN0IGJvdW5kc1Nsb3QgPSB0aGlzLmdldEluc3RhbmNlQm91bmRzU2xvdChlbnRyeSwgaSk7XG4gICAgICBsZXQgY2h1bmtJbmRleCA9IGVudHJ5LmNodW5rQmFzZSArIGkgKiBlbnRyeS5jaHVua0NvdW50UGVySW5zdGFuY2U7XG4gICAgICBmb3IgKGxldCBwID0gMDsgcCA8IGluZm8ucHJpbWl0aXZlcy5sZW5ndGg7IHArKykge1xuICAgICAgICBjb25zdCBwcmltaXRpdmUgPSBpbmZvLnByaW1pdGl2ZXNbcF07XG4gICAgICAgIC8vIFRoZSBzYW1lIGNvbmRpdGlvbiBhcyB0aGUgdmVydGV4IHNoYWRlcnMgKFJOX0lTX01PUlBISU5HIGFuZCB1bmlmb3JtRHJhd1BhcmFtZXRlcnMubW9ycGhUYXJnZXROdW1iZXIpLCBmb3JcbiAgICAgICAgLy8gdGhlIGluc3RhbmNlcyB3aXRoIGEgYmxlbmQgc2hhcGUgY29tcG9uZW50LlxuICAgICAgICBsZXQgbW9ycGhPZmZzZXRCYXNlID0gMDtcbiAgICAgICAgbGV0IG1vcnBoVGFyZ2V0Q291bnQgPSAwO1xuICAgICAgICBsZXQgbW9ycGhXZWlnaHRCYXNlID0gMDtcbiAgICAgICAgY29uc3QgdGFyZ2V0Q291bnQgPSBwcmltaXRpdmUudGFyZ2V0cy5sZW5ndGg7XG4gICAgICAgIGNvbnN0IG1vcnBoSW5kZXggPSBQcmltaXRpdmUuZ2V0UHJpbWl0aXZlSWR4SGFzTW9ycGgocHJpbWl0aXZlLnByaW1pdGl2ZVVpZCk7XG4gICAgICAgIGlmICh0YXJnZXRDb3VudCA+IDAgJiYgYmxlbmRTaGFwZVNJRCAhPT0gSW52YWxpZCAmJiBtb3JwaEluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBjb25zdCB3ZWlnaHRCYXNlID0gYmxlbmRTaGFwZU9mZnNldHNbYmxlbmRTaGFwZVNJRF07XG4gICAgICAgICAgaWYgKHdlaWdodEJhc2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgbW9ycGhPZmZzZXRCYXNlID0gbW9ycGhPZmZzZXRzW21vcnBoSW5kZXhdID8/IDA7XG4gICAgICAgICAgICBtb3JwaFRhcmdldENvdW50ID0gdGFyZ2V0Q291bnQ7XG4gICAgICAgICAgICBtb3JwaFdlaWdodEJhc2UgPSB3ZWlnaHRCYXNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwcmltaXRpdmVPZmZzZXQgPSBlbnRyeS5wcmltaXRpdmVPZmZzZXRzW3BdO1xuICAgICAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IGVudHJ5LnByaW1pdGl2ZVZlcnRleENvdW50c1twXTtcbiAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBlbnRyeS5wcmltaXRpdmVDaHVua0NvdW50c1twXTsgaysrKSB7XG4gICAgICAgICAgY29uc3QgZmlyc3QgPSBrICogR3B1RGVmb3JtQ2h1bmtTaXplO1xuICAgICAgICAgIGNvbnN0IHcgPSBjaHVua0luZGV4ICogQ2h1bmtXb3JkU2l6ZTtcbiAgICAgICAgICBjaHVua3Nbd10gPSBlbnRyeS5zb3VyY2VCYXNlICsgcHJpbWl0aXZlT2Zmc2V0ICsgZmlyc3Q7XG4gICAgICAgICAgY2h1bmtzW3cgKyAxXSA9IE1hdGgubWluKEdwdURlZm9ybUNodW5rU2l6ZSwgdmVydGV4Q291bnQgLSBmaXJzdCk7XG4gICAgICAgICAgY2h1bmtzW3cgKyAyXSA9IGluc3RhbmNlRGVmb3JtZWRCYXNlICsgcHJpbWl0aXZlT2Zmc2V0ICsgZmlyc3Q7XG4gICAgICAgICAgY2h1bmtzW3cgKyAzXSA9IGJvdW5kc1Nsb3Q7XG4gICAgICAgICAgY2h1bmtzW3cgKyA0XSA9IGJvbmVEYXRhTG9jYXRpb25JbmRleDtcbiAgICAgICAgICBjaHVua3NbdyArIDVdID0gYm9uZURhdGFJbmZvSW5kZXg7XG4gICAgICAgICAgY2h1bmtzW3cgKyA2XSA9IG1vcnBoT2Zmc2V0QmFzZTtcbiAgICAgICAgICBjaHVua3NbdyArIDddID0gbW9ycGhUYXJnZXRDb3VudDtcbiAgICAgICAgICBjaHVua3NbdyArIDhdID0gbW9ycGhXZWlnaHRCYXNlO1xuICAgICAgICAgIGNodW5rc1t3ICsgOV0gPSAwO1xuICAgICAgICAgIGNodW5rc1t3ICsgMTBdID0gMDtcbiAgICAgICAgICBjaHVua3NbdyArIDExXSA9IDA7XG4gICAgICAgICAgY2h1bmtJbmRleCsrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX19jaHVua3NEaXJ0eS5hZGQoZW50cnkuY2h1bmtCYXNlLCBlbnRyeS5jaHVua0Jhc2UgKyBlbnRyeS5jaHVua0NvdW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXdyaXRlcyB0aGUgc291cmNlcyBvZiB0aGUgbWVzaGVzIHdob3NlIHZlcnRleCBwb3NpdGlvbnMgd2VyZSB1cGRhdGVkLiBXaGVuIHRoZSB2ZXJ0ZXggY291bnRzIGNoYW5nZWQsIHRoZSBlbnRyeVxuICAgKiBsYXlvdXQgaXMgbm8gbG9uZ2VyIHZhbGlkIGFuZCBhIHJlc2V0IGlzIHJlcXVlc3RlZC5cbiAgICovXG4gIHByaXZhdGUgX19yZWZyZXNoQ2hhbmdlZFNvdXJjZXMoKSB7XG4gICAgZm9yIChjb25zdCBbZW50cnksIGluZm9dIG9mIHRoaXMuX19lbnRyeUluZm9zKSB7XG4gICAgICBjb25zdCBtZXNoID0gaW5mby5tZXNoO1xuICAgICAgaWYgKG1lc2gucHJpbWl0aXZlUG9zaXRpb25VcGRhdGVDb3VudCA9PT0gaW5mby5wb3NpdGlvblVwZGF0ZUNvdW50KSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaW5mby5wb3NpdGlvblVwZGF0ZUNvdW50ID0gbWVzaC5wcmltaXRpdmVQb3NpdGlvblVwZGF0ZUNvdW50O1xuICAgICAgbGV0IGlzTGF5b3V0VmFsaWQgPSBtZXNoLmdldFByaW1pdGl2ZU51bWJlcigpID09PSBpbmZvLnByaW1pdGl2ZXMubGVuZ3RoO1xuICAgICAgZm9yIChsZXQgcCA9IDA7IHAgPCBpbmZvLnByaW1pdGl2ZXMubGVuZ3RoICYmIGlzTGF5b3V0VmFsaWQ7IHArKykge1xuICAgICAgICBjb25zdCBwcmltaXRpdmUgPSBtZXNoLmdldFByaW1pdGl2ZUF0KHApO1xuICAgICAgICBjb25zdCBwb3NpdGlvbiA9IGZpbmRBdHRyaWJ1dGUocHJpbWl0aXZlLCAnUE9TSVRJT04nKTtcbiAgICAgICAgaXNMYXlvdXRWYWxpZCA9XG4gICAgICAgICAgcHJpbWl0aXZlID09PSBpbmZvLnByaW1pdGl2ZXNbcF0gJiZcbiAgICAgICAgICBwb3NpdGlvbiAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgcG9zaXRpb24uZWxlbWVudENvdW50ID09PSBlbnRyeS5wcmltaXRpdmVWZXJ0ZXhDb3VudHNbcF07XG4gICAgICB9XG4gICAgICBpZiAoIWlzTGF5b3V0VmFsaWQpIHtcbiAgICAgICAgdGhpcy5fX3Jlc2V0UmVxdWVzdGVkID0gdHJ1ZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB0aGlzLl9fd3JpdGVTb3VyY2VzKGVudHJ5LCBpbmZvKTtcbiAgICAgIHRoaXMuX192ZXJzaW9uKys7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJld3JpdGVzIHRoZSBjaHVua3Mgb2YgdGhlIGVudHJpZXMgd2hlbiB0aGUgbW9ycGggdGFyZ2V0IG9yIGJsZW5kIHNoYXBlIHdlaWdodCBsYXlvdXRzIGNoYW5nZWQgKHByaW1pdGl2ZXMgd2l0aFxuICAgKiBtb3JwaCB0YXJnZXRzIG9yIGJsZW5kIHNoYXBlIGNvbXBvbmVudHMgd2VyZSBjcmVhdGVkIG9yIGRlc3Ryb3llZCkuXG4gICAqL1xuICBwcml2YXRlIF9fcmVmcmVzaE1vcnBoTGF5b3V0cygpIHtcbiAgICBjb25zdCBtb3JwaFByaW1pdGl2ZUNvdW50ID0gUHJpbWl0aXZlLmdldFByaW1pdGl2ZUNvdW50SGFzTW9ycGgoKTtcbiAgICBmb3IgKGNvbnN0IFtlbnRyeSwgaW5mb10gb2YgdGhpcy5fX2VudHJ5SW5mb3MpIHtcbiAgICAgIGlmIChcbiAgICAgICAgaW5mby5tb3JwaFByaW1pdGl2ZUNvdW50ID09PSBtb3JwaFByaW1pdGl2ZUNvdW50ICYmXG4gICAgICAgIGluZm8uYmxlbmRTaGFwZU9mZnNldHMgPT09IEJsZW5kU2hhcGVDb21wb25lbnQuZ2V0T2Zmc2V0c0luVW5pZm9ybShpbmZvLmVuZ2luZSlcbiAgICAgICkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX193cml0ZUNodW5rcyhlbnRyeSwgaW5mbyk7XG4gICAgICB0aGlzLl9fdmVyc2lvbisrO1xuICAgIH1cbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFBLFNBQVMsMkJBQTJCO0FBQ3BDLFNBQVMseUJBQXlCO0FBQ2xDLFNBQVMsaUJBQWlCO0FBQzFCLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsWUFBWTtBQUNyQixTQUFTLGlCQUFpQjtBQUcxQixTQUFTLGtCQUFrQjtBQUMzQjtBQUFBLEVBRUU7QUFBQSxFQUVBO0FBQUEsT0FDSztBQUNQLFNBQVMsc0JB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LGlCQUFpQixNQUFNLHNCQUFzQixDQUFDO0FBQUEsTUFDM0Q7QUFDQSxVQUFJLENBQUMsZUFBZTtBQUNsQixhQUFLRyxLQUFtQjtBQUN4QjtBQUFBLE1BQ0Y7QUFDQSxXQUFLVSxHQUFlLE9BQU8sSUFBSTtBQUMvQixXQUFLWjtBQUFBLElBQ1A7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1RZ0IsS0FBd0I7QUFDOUIsVUFBTSxzQkFBc0IsVUFBVSwwQkFBMEI7QUFDaEUsZUFBVyxDQUFDLE9BQU8sSUFBSSxLQUFLLEtBQUtqQixJQUFjO0FBQzdDLFVBQ0UsS0FBSyx3QkFBd0IsdUJBQzdCLEtBQUssc0JBQXNCLG9CQUFvQixvQkFBb0IsS0FBSyxNQUFNLEdBQzlFO0FBQ0E7QUFBQSxNQUNGO0FBQ0EsV0FBS2MsR0FBYyxPQUFPLElBQUk7QUFDOUIsV0FBS2I7QUFBQSxJQUNQO0FBQUEsRUFDRjtBQUNGOyIsCiAgIm5hbWVzIjogWyJfX2NvbXBvbmVudENvdW50IiwgIl9fYnl0ZVNpemUiLCAiX19zY2FsZSIsICJfX2lzU2lnbmVkIiwgIl9faXNOb3JtYWxpemVkIiwgIl9fYWNjZXNzb3IiLCAiX19wYXJhbXNBcnJheSIsICJfX3NvdXJjZXNEaXJ0eSIsICJfX2NodW5rc0RpcnR5IiwgIl9fZW50cnlJbmZvcyIsICJfX3ZlcnNpb24iLCAiX19sYXN0RGlzcGF0Y2hlZFZlcnNpb24iLCAiX19yZXNldFJlcXVlc3RlZCIsICJfX2xhc3RQb3NpdGlvblVwZGF0ZVZlcnNpb24iLCAiX19kZXZpY2UiLCAiX19yZWdpc3RyeSIsICJfX3N0YWdlIiwgIl9fcGFyYW1zQnVmZmVyIiwgIl9fZHVtbXlCdWZmZXIiLCAiX19jcmVhdGVUYWJsZXMiLCAiX19kZWZvcm1lZEJ1ZmZlciIsICJfX2JvdW5kc0J1ZmZlciIsICJfX3dyaXRlU291cmNlcyIsICJfX3dyaXRlQ2h1bmtzIiwgIl9fY2h1bmtzVTMyIiwgIl9fcmVmcmVzaENoYW5nZWRTb3VyY2VzIiwgIl9fcmVmcmVzaE1vcnBoTGF5b3V0cyIsICJfX3VwbG9hZERpcnR5IiwgIl9fc291cmNlc0J1ZmZlciIsICJfX3NvdXJjZXNVMzIiLCAiX19jaHVua3NCdWZmZXIiLCAiX19kZXN0cm95VGFibGVzIiwgIl9fc291cmNlc0YzMiJdCn0K
