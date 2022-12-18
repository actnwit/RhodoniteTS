/// <reference types="@webgpu/types" />

import { WebGLResourceHandle } from '../types/CommonTypes';

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
  private static __webGpuResources: Map<WebGLResourceHandle, WebGpuResource> = new Map();
}
