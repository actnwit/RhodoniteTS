/// <reference types="@webgpu/types" />

import { ComponentTypeEnum } from '../foundation/definitions/ComponentType';
import { PixelFormatEnum } from '../foundation/definitions/PixelFormat';
import { TextureParameterEnum } from '../foundation/definitions/TextureParameter';
import {
  CGAPIResourceRepository,
  ICGAPIResourceRepository,
  ImageBitmapData,
} from '../foundation/renderer/CGAPIResourceRepository';
import { Index, Size, WebGLResourceHandle } from '../types/CommonTypes';
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

export class WebGpuResourceRepository
  extends CGAPIResourceRepository
  implements ICGAPIResourceRepository
{
  private __webGpuResources: Map<WebGLResourceHandle, WebGpuResource> = new Map();
  private __webGpuDeviceWrapper: WebGpuDeviceWrapper;
  private __resourceCounter: number = CGAPIResourceRepository.InvalidCGAPIResourceUid;

  constructor(webGpuDeviceWrapper: WebGpuDeviceWrapper) {
    super();

    this.__webGpuDeviceWrapper = webGpuDeviceWrapper;
  }

  private getResourceNumber(): WebGLResourceHandle {
    return ++this.__resourceCounter;
  }

  private __registerResource(obj: WebGpuResource) {
    const handle = this.getResourceNumber();
    (obj as any)._resourceUid = handle;
    this.__webGpuResources.set(handle, obj);
    return handle;
  }

  /**
   * create a Texture
   * @param imageData
   * @param param1
   * @returns
   */
  public createTextureFromImageBitmapData(
    imageData: ImageBitmapData,
    {
      level,
      internalFormat,
      width,
      height,
      border,
      format,
      type,
      magFilter,
      minFilter,
      wrapS,
      wrapT,
      generateMipmap,
      anisotropy,
      isPremultipliedAlpha,
    }: {
      level: Index;
      internalFormat: TextureParameterEnum;
      width: Size;
      height: Size;
      border: Size;
      format: PixelFormatEnum;
      type: ComponentTypeEnum;
      magFilter: TextureParameterEnum;
      minFilter: TextureParameterEnum;
      wrapS: TextureParameterEnum;
      wrapT: TextureParameterEnum;
      generateMipmap: boolean;
      anisotropy: boolean;
      isPremultipliedAlpha: boolean;
    }
  ): WebGLResourceHandle {
    const gpuDevice = this.__webGpuDeviceWrapper.gpuDevice;
    const gpuTexture = gpuDevice.createTexture({
      size: [width, height, 1],
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });

    gpuDevice.queue.copyExternalImageToTexture({ source: imageData }, { texture: gpuTexture }, [
      width,
      height,
    ]);

    const resourceHandle = this.__registerResource(gpuTexture);

    return resourceHandle;
  }
}
