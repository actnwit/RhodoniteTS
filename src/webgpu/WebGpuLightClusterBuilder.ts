import type { LightClusterGpuBuildParams } from '../foundation/renderer/lightCluster/LightClusterSystem';
import type { WebGpuGpuTimer } from './WebGpuGpuTimer';

/**
 * The WGSL of the light cluster build. It implements the assignment test documented in LightClusterBuilder.ts
 * (`sphereIntersectsLightCluster`) and writes the same layout as `buildLightClustersOnCpu` (LightClusterLayout.ts).
 *
 * One dispatch per view, one invocation per cluster, no atomics:
 * - The caller sorts the local lights by view depth (nearest first) and passes the range of the sorted lights whose
 *   sphere overlaps the depth slice of each cluster, so an invocation only tests the lights that can reach its slice.
 * - Each cluster owns `entriesPerCluster` vec4s of the light index list and writes its nearest lights until it is full.
 *   The table entry of the cluster holds the vec4 offset of its list and its light count; the clusters of the same view
 *   do not share the list, so the shader reads it with the same table lookup as the CPU build.
 * - Every invocation writes only whole vec4s that no other invocation of the dispatch accesses. Some backends store a
 *   vector component by rewriting the whole vector, so component writes to shared vec4s would lose data.
 */
const lightClusterBuildWgsl = /* wgsl */ `
struct Params {
  viewBase: u32,
  sphereBase: u32,
  entryBase: u32,
  rangeBase: u32,
  localCount: u32,
  clusterCount: u32,
  entriesPerCluster: u32,
  capacity: u32,
}

@group(0) @binding(0) var<storage, read_write> data: array<vec4<f32>>;
@group(0) @binding(1) var<uniform> params: Params;
@group(0) @binding(2) var<storage, read> buildData: array<f32>;

fn tableBase() -> u32 {
  return params.viewBase + 6u;
}

fn indexBase() -> u32 {
  return params.viewBase + 6u + params.clusterCount;
}

fn planePasses(plane: vec4<f32>, center: vec3<f32>, radius: f32) -> bool {
  let planeLength = length(plane.xyz);
  if (!(planeLength > 1e-30)) {
    return true;
  }
  return (dot(plane.xyz, center) + plane.w) / planeLength >= -radius;
}

@compute @workgroup_size(64)
fn buildClusters(@builtin(global_invocation_id) id: vec3<u32>) {
  let cluster = id.x;
  if (cluster >= params.clusterCount) {
    return;
  }
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

  let rangeBase = params.rangeBase + z * 2u;
  let rangeStart = u32(buildData[rangeBase]);
  let rangeEnd = u32(buildData[rangeBase + 1u]);
  let listBase = indexBase() + cluster * params.entriesPerCluster;

  var count = 0u;
  var pending = vec4<f32>(0.0);
  for (var i = rangeStart; i < rangeEnd; i = i + 1u) {
    if (count >= params.capacity) {
      break;
    }
    let sphereBase = params.sphereBase + i * 4u;
    let center = vec3<f32>(buildData[sphereBase], buildData[sphereBase + 1u], buildData[sphereBase + 2u]);
    let radius = buildData[sphereBase + 3u];
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
    pending[count & 3u] = buildData[params.entryBase + i];
    if ((count & 3u) == 3u) {
      data[listBase + (count >> 2u)] = pending;
      pending = vec4<f32>(0.0);
    }
    count++;
  }
  if ((count & 3u) != 0u) {
    data[listBase + (count >> 2u)] = pending;
  }
  data[tableBase() + cluster] = vec4<f32>(f32(cluster * params.entriesPerCluster), f32(count), 0.0, 0.0);
}
`;

const ParamsByteLength = 32;
const BuildWorkgroupSize = 64;

/**
 * Builds the light cluster tables of Clustered Forward rendering with compute shaders.
 * The tables are written into the storage buffer of the GPU instance data, where the CPU build would write them.
 *
 * The sorted light input of the views (spheres, entries and Z slice ranges) is uploaded to a separate storage buffer,
 * because it is small (some tens of KiB) and reused for all views.
 */
export class WebGpuLightClusterBuilder {
  private __device: GPUDevice;
  private __bindGroupLayout: GPUBindGroupLayout;
  private __pipeline: GPUComputePipeline;
  private __paramsBuffer?: GPUBuffer;
  private __paramsStride: number;
  private __paramsCapacity = 0;
  private __paramsArray = new Uint32Array(ParamsByteLength / 4);
  private __buildDataBuffer?: GPUBuffer;
  private __buildDataCapacity = 0;
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
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
      ],
    });
    const layout = device.createPipelineLayout({ bindGroupLayouts: [this.__bindGroupLayout] });
    const module = device.createShaderModule({ label: 'LightClusterBuild', code: lightClusterBuildWgsl });
    this.__pipeline = device.createComputePipeline({
      label: 'LightClusterBuild.buildClusters',
      layout,
      compute: { module, entryPoint: 'buildClusters' },
    });
  }

  /**
   * Builds the clusters of the views and submits the work immediately, so that it runs after the upload of the
   * GPU instance data (queue.writeBuffer) and before the render commands of the frame.
   *
   * @param storageBuffer - The storage buffer of the GPU instance data
   * @param params - The views to build and their sorted light input
   * @param gpuTimer - When set (and a frame is being measured), measures the build as the
   *   'LightClusterBuild' pass
   */
  build(storageBuffer: GPUBuffer, params: LightClusterGpuBuildParams, gpuTimer?: WebGpuGpuTimer) {
    const viewCount = params.views.length;
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

    let dataLength = 0;
    for (const view of params.views) {
      dataLength = Math.max(dataLength, view.dataOffset + params.dataStride);
    }
    if (this.__buildDataBuffer == null || this.__buildDataCapacity < dataLength) {
      this.__buildDataBuffer?.destroy();
      // Grow in powers of two to avoid recreating the buffer every time a view is added.
      let capacity = 1;
      while (capacity < dataLength) {
        capacity *= 2;
      }
      this.__buildDataCapacity = capacity;
      this.__buildDataBuffer = device.createBuffer({
        label: 'LightClusterBuild.buildData',
        size: capacity * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
      this.__bindGroup = undefined;
    }
    device.queue.writeBuffer(this.__buildDataBuffer!, 0, params.data.subarray(0, dataLength));

    if (this.__bindGroup == null || this.__bindGroupStorageBuffer !== storageBuffer) {
      this.__bindGroup = device.createBindGroup({
        label: 'LightClusterBuild',
        layout: this.__bindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: storageBuffer } },
          { binding: 1, resource: { buffer: this.__paramsBuffer!, size: ParamsByteLength } },
          { binding: 2, resource: { buffer: this.__buildDataBuffer! } },
        ],
      });
      this.__bindGroupStorageBuffer = storageBuffer;
    }

    const layout = params.layout;
    const capacity = layout.clusterLightCapacity;
    const entriesPerCluster = Math.ceil(capacity / 4);
    const p = this.__paramsArray;
    for (let i = 0; i < viewCount; i++) {
      const view = params.views[i];
      p[0] = view.viewVec4Base;
      p[1] = view.dataOffset;
      p[2] = view.dataOffset + params.localCapacity * 4;
      p[3] = view.dataOffset + params.localCapacity * 5;
      p[4] = view.localCount;
      p[5] = layout.clusterCount;
      p[6] = entriesPerCluster;
      p[7] = capacity;
      device.queue.writeBuffer(this.__paramsBuffer!, i * this.__paramsStride, p);
    }

    const encoder = device.createCommandEncoder({ label: 'LightClusterBuild' });
    const passDescriptor: GPUComputePassDescriptor = { label: 'LightClusterBuild' };
    const timestampWrites = gpuTimer?.getTimestampWrites('LightClusterBuild');
    if (timestampWrites != null) {
      passDescriptor.timestampWrites = timestampWrites;
    }
    const pass = encoder.beginComputePass(passDescriptor);
    const workgroupCount = Math.ceil(layout.clusterCount / BuildWorkgroupSize);
    for (let i = 0; i < viewCount; i++) {
      pass.setBindGroup(0, this.__bindGroup, [i * this.__paramsStride]);
      pass.setPipeline(this.__pipeline);
      pass.dispatchWorkgroups(workgroupCount);
    }
    pass.end();
    if (timestampWrites != null) {
      gpuTimer!.encodeResolve(encoder);
    }
    device.queue.submit([encoder.finish()]);
    if (timestampWrites != null) {
      gpuTimer!.afterSubmit();
    }
  }

  /**
   * Releases the GPU resources.
   */
  destroy() {
    this.__paramsBuffer?.destroy();
    this.__paramsBuffer = undefined;
    this.__buildDataBuffer?.destroy();
    this.__buildDataBuffer = undefined;
    this.__bindGroup = undefined;
    this.__bindGroupStorageBuffer = undefined;
  }
}
