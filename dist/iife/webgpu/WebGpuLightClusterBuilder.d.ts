import type { LightClusterGpuBuildParams } from '../foundation/renderer/lightCluster/LightClusterSystem';
import type { WebGpuGpuTimer } from './WebGpuGpuTimer';
/**
 * Builds the light cluster tables of Clustered Forward rendering with compute shaders.
 * The tables are written into the storage buffer of the GPU instance data, where the CPU build would write them.
 *
 * The sorted light input of the views (spheres, entries and Z slice ranges) is uploaded to a separate storage buffer,
 * because it is small (some tens of KiB) and reused for all views.
 */
export declare class WebGpuLightClusterBuilder {
    private __device;
    private __bindGroupLayout;
    private __pipeline;
    private __paramsBuffer?;
    private __paramsStride;
    private __paramsCapacity;
    private __paramsArray;
    private __buildDataBuffer?;
    private __buildDataCapacity;
    private __bindGroup?;
    private __bindGroupStorageBuffer?;
    constructor(device: GPUDevice);
    /**
     * Builds the clusters of the views and submits the work immediately, so that it runs after the upload of the
     * GPU instance data (queue.writeBuffer) and before the render commands of the frame.
     *
     * @param storageBuffer - The storage buffer of the GPU instance data
     * @param params - The views to build and their sorted light input
     * @param gpuTimer - When set (and a frame is being measured), measures the build as the
     *   'LightClusterBuild' pass
     */
    build(storageBuffer: GPUBuffer, params: LightClusterGpuBuildParams, gpuTimer?: WebGpuGpuTimer): void;
    /**
     * Releases the GPU resources.
     */
    destroy(): void;
}
