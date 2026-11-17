import type { LightClusterGpuBuildParams } from '../foundation/renderer/lightCluster/LightClusterSystem';

/**
 * The WGSL of the light cluster build. It implements the assignment test documented in LightClusterBuilder.ts
 * (`sphereIntersectsLightCluster`) and writes the same layout as `buildLightClustersOnCpu` (LightClusterLayout.ts).
 *
 * Three dispatches per view (no atomics, so the result is deterministic and ordered like the CPU build):
 * 1. countLights: each cluster counts its lights and writes the count to its table entry.
 * 2. computeOffsets: one workgroup computes the exclusive prefix sum of the list sizes in vec4 (the offsets) and the
 *    overflow state.
 * 3. fillLights: each cluster writes the entries of its lights to its own vec4s of the index list.
 *
 * Every invocation writes only whole vec4s that no other invocation of the same dispatch accesses. Some backends
 * store a vector component by rewriting the whole vector, so component writes to shared vec4s would lose data.
 */
const lightClusterBuildWgsl = /* wgsl */ `
struct Params {
  viewBase: u32,
  sphereBase: u32,
  allListBase: u32,
  globalCount: u32,
  localCount: u32,
  clusterCount: u32,
  indexVec4Count: u32,
  // 0: on overflow, the shaders use the all-light list. > 0: on overflow, each cluster keeps this many lights.
  truncateCapacity: u32,
}

@group(0) @binding(0) var<storage, read_write> data: array<vec4<f32>>;
@group(0) @binding(1) var<uniform> params: Params;

fn tableBase() -> u32 {
  return params.viewBase + 6u;
}

fn indexBase() -> u32 {
  return params.viewBase + 6u + params.clusterCount;
}

fn readCount(cluster: u32) -> u32 {
  return u32(data[tableBase() + cluster].y);
}

fn planePasses(plane: vec4<f32>, center: vec3<f32>, radius: f32) -> bool {
  let planeLength = length(plane.xyz);
  if (!(planeLength > 1e-30)) {
    return true;
  }
  return (dot(plane.xyz, center) + plane.w) / planeLength >= -radius;
}

// Counts (fill == false) or writes (fill == true) the lights of a cluster.
// offsetVec4 is the vec4 index of the list of the cluster from the index list start, and fillLimit is the number of
// lights to write (the lights after it were truncated).
fn processCluster(cluster: u32, fill: bool, offsetVec4: u32, fillLimit: u32) -> u32 {
  let base = params.viewBase;
  let rowX = data[base];
  let rowY = data[base + 1u];
  let rowW = data[base + 2u];
  let rowDepth = data[base + 3u];
  let grid = data[base + 4u];
  let slice = data[base + 5u];
  let gridX = u32(grid.x);
  let gridY = u32(grid.y);
  let gridZ = u32(grid.z);
  let x = cluster % gridX;
  let y = (cluster / gridX) % gridY;
  let z = cluster / (gridX * gridY);
  let fx = f32(x);
  let fy = f32(y);
  let fz = f32(z);
  let leftPlane = rowX - fx * rowW;
  let rightPlane = (fx + 1.0) * rowW - rowX;
  let bottomPlane = rowY - fy * rowW;
  let topPlane = (fy + 1.0) * rowW - rowY;
  let sliceNear = exp((fz - slice.y) / slice.x);
  let sliceFar = exp((fz + 1.0 - slice.y) / slice.x);
  let wLength = length(rowW.xyz);
  let listBase = indexBase() + offsetVec4;

  var count = 0u;
  var pending = vec4<f32>(0.0);
  for (var i = 0u; i < params.localCount; i++) {
    let sphere = data[params.sphereBase + i];
    let center = sphere.xyz;
    let radius = sphere.w;
    // entirely behind the eye plane
    if (wLength > 1e-30 && (dot(rowW.xyz, center) + rowW.w) / wLength <= -radius) {
      continue;
    }
    if (x > 0u && !planePasses(leftPlane, center, radius)) {
      continue;
    }
    if (x < gridX - 1u && !planePasses(rightPlane, center, radius)) {
      continue;
    }
    if (y > 0u && !planePasses(bottomPlane, center, radius)) {
      continue;
    }
    if (y < gridY - 1u && !planePasses(topPlane, center, radius)) {
      continue;
    }
    let depth = dot(rowDepth.xyz, center) + rowDepth.w;
    if (z > 0u && depth + radius < sliceNear) {
      continue;
    }
    if (z < gridZ - 1u && depth - radius > sliceFar) {
      continue;
    }
    if (fill) {
      if (count >= fillLimit) {
        break;
      }
      let entryIndex = params.globalCount + i;
      pending[count & 3u] = data[params.allListBase + (entryIndex >> 2u)][entryIndex & 3u];
      if ((count & 3u) == 3u) {
        data[listBase + (count >> 2u)] = pending;
        pending = vec4<f32>(0.0);
      }
    }
    count++;
  }
  if (fill && (count & 3u) != 0u) {
    data[listBase + (count >> 2u)] = pending;
  }
  return count;
}

@compute @workgroup_size(64)
fn countLights(@builtin(global_invocation_id) id: vec3<u32>) {
  let cluster = id.x;
  if (cluster >= params.clusterCount) {
    return;
  }
  let count = processCluster(cluster, false, 0u, 0u);
  data[tableBase() + cluster] = vec4<f32>(0.0, f32(count), 0.0, 0.0);
}

var<workgroup> partialSums: array<u32, 256>;
var<workgroup> truncatedPartialSums: array<u32, 256>;
var<workgroup> isTruncating: u32;

fn truncatedCount(count: u32) -> u32 {
  return min(count, params.truncateCapacity);
}

@compute @workgroup_size(256)
fn computeOffsets(@builtin(local_invocation_index) index: u32) {
  let clusterCount = params.clusterCount;
  let chunk = (clusterCount + 255u) / 256u;
  let start = min(index * chunk, clusterCount);
  let end = min(start + chunk, clusterCount);
  var sum = 0u;
  var truncatedSum = 0u;
  for (var c = start; c < end; c++) {
    let count = readCount(c);
    sum += (count + 3u) >> 2u;
    truncatedSum += (truncatedCount(count) + 3u) >> 2u;
  }
  partialSums[index] = sum;
  truncatedPartialSums[index] = truncatedSum;
  workgroupBarrier();
  if (index == 0u) {
    var total = 0u;
    for (var i = 0u; i < 256u; i++) {
      total += partialSums[i];
    }
    let isOverflow = total > params.indexVec4Count;
    // Keep the first lights of each cluster (clusterCount * truncateCapacity entries always fit in the list).
    let truncate = isOverflow && params.truncateCapacity > 0u;
    isTruncating = select(0u, 1u, truncate);
    var offset = 0u;
    for (var i = 0u; i < 256u; i++) {
      let value = select(partialSums[i], truncatedPartialSums[i], truncate);
      partialSums[i] = offset;
      offset += value;
    }
    let grid = data[params.viewBase + 4u];
    data[params.viewBase + 4u] = vec4<f32>(grid.xyz, select(0.0, 1.0, isOverflow && !truncate));
  }
  workgroupBarrier();
  let truncate = workgroupUniformLoad(&isTruncating) != 0u;
  var offset = partialSums[index];
  for (var c = start; c < end; c++) {
    var count = readCount(c);
    if (truncate) {
      count = truncatedCount(count);
    }
    data[tableBase() + c] = vec4<f32>(f32(offset), f32(count), 0.0, 0.0);
    offset += (count + 3u) >> 2u;
  }
}

@compute @workgroup_size(64)
fn fillLights(@builtin(global_invocation_id) id: vec3<u32>) {
  let cluster = id.x;
  if (cluster >= params.clusterCount) {
    return;
  }
  if (data[params.viewBase + 4u].w != 0.0) {
    return; // overflow: the shaders use the all-light list
  }
  let table = data[tableBase() + cluster];
  processCluster(cluster, true, u32(table.x), u32(table.y));
}
`;

const ParamsByteLength = 32;
const CountWorkgroupSize = 64;

/**
 * Builds the light cluster tables of Clustered Forward rendering with compute shaders.
 * The tables are written into the storage buffer of the GPU instance data, where the CPU build would write them.
 */
export class WebGpuLightClusterBuilder {
  private __device: GPUDevice;
  private __bindGroupLayout: GPUBindGroupLayout;
  private __countPipeline: GPUComputePipeline;
  private __offsetPipeline: GPUComputePipeline;
  private __fillPipeline: GPUComputePipeline;
  private __paramsBuffer?: GPUBuffer;
  private __paramsStride: number;
  private __paramsCapacity = 0;
  private __paramsArray = new Uint32Array(ParamsByteLength / 4);
  private __bindGroup?: GPUBindGroup;
  private __bindGroupStorageBuffer?: GPUBuffer;

  constructor(device: GPUDevice) {
    this.__device = device;
    this.__paramsStride = Math.max(device.limits.minUniformBufferOffsetAlignment, ParamsByteLength);
    this.__bindGroupLayout = device.createBindGroupLayout({
      label: 'LightClusterBuild',
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'uniform', hasDynamicOffset: true, minBindingSize: ParamsByteLength },
        },
      ],
    });
    const layout = device.createPipelineLayout({ bindGroupLayouts: [this.__bindGroupLayout] });
    const module = device.createShaderModule({ label: 'LightClusterBuild', code: lightClusterBuildWgsl });
    this.__countPipeline = device.createComputePipeline({
      label: 'LightClusterBuild.countLights',
      layout,
      compute: { module, entryPoint: 'countLights' },
    });
    this.__offsetPipeline = device.createComputePipeline({
      label: 'LightClusterBuild.computeOffsets',
      layout,
      compute: { module, entryPoint: 'computeOffsets' },
    });
    this.__fillPipeline = device.createComputePipeline({
      label: 'LightClusterBuild.fillLights',
      layout,
      compute: { module, entryPoint: 'fillLights' },
    });
  }

  /**
   * Builds the clusters of the views and submits the work immediately, so that it runs after the upload of the
   * GPU instance data (queue.writeBuffer) and before the render commands of the frame.
   *
   * @param storageBuffer - The storage buffer of the GPU instance data
   * @param params - The views to build
   */
  build(storageBuffer: GPUBuffer, params: LightClusterGpuBuildParams) {
    const viewCount = params.viewVec4Bases.length;
    if (viewCount === 0) {
      return;
    }
    const device = this.__device;
    if (this.__paramsBuffer == null || this.__paramsCapacity < viewCount) {
      this.__paramsBuffer?.destroy();
      this.__paramsCapacity = Math.max(viewCount, 4);
      this.__paramsBuffer = device.createBuffer({
        label: 'LightClusterBuild.params',
        size: this.__paramsStride * this.__paramsCapacity,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      this.__bindGroup = undefined;
    }
    if (this.__bindGroup == null || this.__bindGroupStorageBuffer !== storageBuffer) {
      this.__bindGroup = device.createBindGroup({
        label: 'LightClusterBuild',
        layout: this.__bindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: storageBuffer } },
          { binding: 1, resource: { buffer: this.__paramsBuffer, size: ParamsByteLength } },
        ],
      });
      this.__bindGroupStorageBuffer = storageBuffer;
    }

    const layout = params.layout;
    const p = this.__paramsArray;
    for (let i = 0; i < viewCount; i++) {
      p[0] = params.viewVec4Bases[i];
      p[1] = params.sphereVec4Base;
      p[2] = params.allListVec4Base;
      p[3] = params.globalCount;
      p[4] = params.localCount;
      p[5] = layout.clusterCount;
      p[6] = layout.indexVec4Count;
      p[7] = params.truncateOnOverflow ? layout.clusterLightCapacity : 0;
      device.queue.writeBuffer(this.__paramsBuffer, i * this.__paramsStride, p);
    }

    const encoder = device.createCommandEncoder({ label: 'LightClusterBuild' });
    const pass = encoder.beginComputePass({ label: 'LightClusterBuild' });
    const clusterWorkgroupCount = Math.ceil(layout.clusterCount / CountWorkgroupSize);
    for (let i = 0; i < viewCount; i++) {
      pass.setBindGroup(0, this.__bindGroup, [i * this.__paramsStride]);
      pass.setPipeline(this.__countPipeline);
      pass.dispatchWorkgroups(clusterWorkgroupCount);
      pass.setPipeline(this.__offsetPipeline);
      pass.dispatchWorkgroups(1);
      pass.setPipeline(this.__fillPipeline);
      pass.dispatchWorkgroups(clusterWorkgroupCount);
    }
    pass.end();
    device.queue.submit([encoder.finish()]);
  }

  /**
   * Releases the GPU resources.
   */
  destroy() {
    this.__paramsBuffer?.destroy();
    this.__paramsBuffer = undefined;
    this.__bindGroup = undefined;
    this.__bindGroupStorageBuffer = undefined;
  }
}
