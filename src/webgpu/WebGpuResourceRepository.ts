/// <reference types="@webgpu/types" />

import { WebGLResourceHandle } from '../types/CommonTypes';
import { WebGpuDeviceWrapper } from './WebGpuDeviceWrapper';

export type WebGpuResource =
  | GPUTexture
  | GPUBuffer
  | GPUSampler
  | GPUTextureView
  | GPUBufferBinding
  | GPURenderPipeline
  | GPUComputePipeline
  | GPUBindGroupLayout
  | GPUBindGroup
  | GPUShaderModule
  | GPUCommandEncoder
  | GPUComputePassEncoder
  | GPURenderPassEncoder
  | GPUComputePipeline
  | GPURenderPipeline
  | GPUQuerySet;

export class WebGpuResourceRepository {
  private __webGpuResources: Map<WebGLResourceHandle, WebGpuResource> = new Map();
  private __webGpuDeviceWrapper: WebGpuDeviceWrapper;

  constructor(webGpuDeviceWrapper: WebGpuDeviceWrapper) {
    this.__webGpuDeviceWrapper = webGpuDeviceWrapper;
  }

  public createTexture() {}
}
