/// <reference types="@webgpu/types" />

import { ComponentTypeEnum } from '../foundation/definitions/ComponentType';
import { PixelFormatEnum } from '../foundation/definitions/PixelFormat';
import { TextureParameterEnum } from '../foundation/definitions/TextureParameter';
import { VertexAttribute } from '../foundation/definitions/VertexAttribute';
import { Primitive } from '../foundation/geometry/Primitive';
import { Accessor } from '../foundation/memory/Accessor';
import { Is } from '../foundation/misc/Is';
import {
  CGAPIResourceRepository,
  ICGAPIResourceRepository,
  ImageBitmapData,
} from '../foundation/renderer/CGAPIResourceRepository';
import { Index, Size, WebGLResourceHandle, WebGPUResourceHandle } from '../types/CommonTypes';
import { VertexHandles } from '../webgl/WebGLResourceRepository';
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
   * create a WebGPU Texture
   * @param imageData - an ImageBitmapData
   * @param paramObject - a parameter object
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
      generateMipmap,
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

    const textureHandle = this.__registerResource(gpuTexture);

    return textureHandle;
  }

  /**
   * create a WebGPU Vertex Buffer
   * @param accessor - an accessor
   * @returns
   */
  public createVertexBuffer(accessor: Accessor): WebGPUResourceHandle {
    const gpuDevice = this.__webGpuDeviceWrapper.gpuDevice;
    const vertexBuffer = gpuDevice.createBuffer({
      size: accessor.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });

    new Uint8Array(vertexBuffer.getMappedRange()).set(accessor.bufferView.getUint8Array());
    vertexBuffer.unmap();

    const bufferHandle = this.__registerResource(vertexBuffer);

    return bufferHandle;
  }

  /**
   * create a WebGPU Index Buffer
   * @param accessor - an accessor
   * @returns a WebGPUResourceHandle
   */
  public createIndexBuffer(accessor: Accessor): WebGPUResourceHandle {
    const gpuDevice = this.__webGpuDeviceWrapper.gpuDevice;
    const indexBuffer = gpuDevice.createBuffer({
      size: accessor.byteLength,
      usage: GPUBufferUsage.INDEX,
      mappedAtCreation: true,
    });

    new Uint8Array(indexBuffer.getMappedRange()).set(accessor.bufferView.getUint8Array());
    indexBuffer.unmap();

    const bufferHandle = this.__registerResource(indexBuffer);

    return bufferHandle;
  }

  updateVertexBuffer(accessor: Accessor, resourceHandle: WebGPUResourceHandle) {
    const vertexBuffer = this.__webGpuResources.get(resourceHandle) as GPUBuffer;
    if (Is.not.exist(vertexBuffer)) {
      throw new Error('Not found VBO.');
    }

    vertexBuffer.mapAsync(GPUMapMode.WRITE).then(() => {
      new Uint8Array(vertexBuffer.getMappedRange()).set(accessor.bufferView.getUint8Array());
      vertexBuffer.unmap();
    });
  }

  updateIndexBuffer(accessor: Accessor, resourceHandle: WebGPUResourceHandle) {
    const indexBuffer = this.__webGpuResources.get(resourceHandle) as GPUBuffer;
    if (Is.not.exist(indexBuffer)) {
      throw new Error('Not found IBO.');
    }

    indexBuffer.mapAsync(GPUMapMode.WRITE).then(() => {
      new Uint8Array(indexBuffer.getMappedRange()).set(accessor.bufferView.getUint8Array());
      indexBuffer.unmap();
    });
  }

  /**
   * create a VertexBuffer and IndexBuffer
   * @param primitive
   * @returns
   */
  createVertexBufferAndIndexBuffer(primitive: Primitive): VertexHandles {
    let iboHandle;
    if (primitive.hasIndices()) {
      iboHandle = this.createIndexBuffer(primitive.indicesAccessor!);
    }

    const attributesFlags: boolean[] = [];
    for (let i = 0; i < VertexAttribute.AttributeTypeNumber; i++) {
      attributesFlags[i] = false;
    }
    const vboHandles: Array<WebGLResourceHandle> = [];
    primitive.attributeAccessors.forEach((accessor: Accessor, i: number) => {
      const vboHandle = this.createVertexBuffer(accessor);
      const slotIdx = VertexAttribute.toAttributeSlotFromJoinedString(
        primitive.attributeSemantics[i]
      );
      attributesFlags[slotIdx] = true;
      vboHandles.push(vboHandle);
    });

    return {
      vaoHandle: -1,
      iboHandle: iboHandle,
      vboHandles: vboHandles,
      attributesFlags: attributesFlags,
      setComplete: false,
    };
  }

  /**
   * update the VertexBuffer and IndexBuffer
   * @param primitive
   * @param vertexHandles
   */
  updateVertexBufferAndIndexBuffer(primitive: Primitive, vertexHandles: VertexHandles) {
    if (vertexHandles.iboHandle) {
      this.updateIndexBuffer(primitive.indicesAccessor as Accessor, vertexHandles.iboHandle);
    }

    const attributeAccessors = primitive.attributeAccessors;
    for (let i = 0; i < attributeAccessors.length; i++) {
      this.updateVertexBuffer(attributeAccessors[i], vertexHandles.vboHandles[i]);
    }
  }
}
