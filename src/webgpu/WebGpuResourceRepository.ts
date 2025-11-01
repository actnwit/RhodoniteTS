/// <reference types="@webgpu/types" />

import { CameraComponent } from '../foundation/components/Camera/CameraComponent';
import { MeshRendererComponent } from '../foundation/components/MeshRenderer/MeshRendererComponent';
import { Config } from '../foundation/core/Config';
import { EntityRepository } from '../foundation/core/EntityRepository';
import { GlobalDataRepository } from '../foundation/core/GlobalDataRepository';
import { AlphaMode } from '../foundation/definitions/AlphaMode';
import { BasisCompressionType, type BasisCompressionTypeEnum } from '../foundation/definitions/BasisCompressionType';
import { ComponentType, type ComponentTypeEnum } from '../foundation/definitions/ComponentType';
import { CompositionType } from '../foundation/definitions/CompositionType';
import type { CompressionTextureTypeEnum } from '../foundation/definitions/CompressionTextureType';
import { HdriFormat, type HdriFormatEnum } from '../foundation/definitions/HdriFormat';
import { PixelFormat, type PixelFormatEnum } from '../foundation/definitions/PixelFormat';
import { ShaderSemantics } from '../foundation/definitions/ShaderSemantics';
import { TextureFormat, type TextureFormatEnum } from '../foundation/definitions/TextureFormat';
import { TextureParameter, type TextureParameterEnum } from '../foundation/definitions/TextureParameter';
import { VertexAttribute, type VertexAttributeEnum } from '../foundation/definitions/VertexAttribute';
import type { Mesh } from '../foundation/geometry/Mesh';
import { Primitive } from '../foundation/geometry/Primitive';
import { dummyBlackCubeTexture, dummyWhiteTexture } from '../foundation/materials/core/DummyTextures';
import { Material } from '../foundation/materials/core/Material';
import { MutableVector2 } from '../foundation/math/MutableVector2';
import { MutableVector4 } from '../foundation/math/MutableVector4';
import { Vector2 } from '../foundation/math/Vector2';
import type { Vector4 } from '../foundation/math/Vector4';
import type { Accessor } from '../foundation/memory/Accessor';
import { DataUtil } from '../foundation/misc/DataUtil';
import { Is } from '../foundation/misc/Is';
import { Logger } from '../foundation/misc/Logger';
import { MiscUtil } from '../foundation/misc/MiscUtil';
import {
  CGAPIResourceRepository,
  type DirectTextureData,
  type ICGAPIResourceRepository,
  type ImageBitmapData,
} from '../foundation/renderer/CGAPIResourceRepository';
import type { FrameBuffer } from '../foundation/renderer/FrameBuffer';
import type { RenderPass } from '../foundation/renderer/RenderPass';
import { SystemState } from '../foundation/system/SystemState';
import type { AbstractTexture } from '../foundation/textures/AbstractTexture';
import { CubeTexture } from '../foundation/textures/CubeTexture';
import type { IRenderable } from '../foundation/textures/IRenderable';
import type { RenderBuffer } from '../foundation/textures/RenderBuffer';
import { RenderTargetTexture2DArray } from '../foundation/textures/RenderTargetTexture2DArray';
import { RenderTargetTextureCube } from '../foundation/textures/RenderTargetTextureCube';
import { Sampler } from '../foundation/textures/Sampler';
import type { BasisFile } from '../types/BasisTexture';
import type { Count, Index, Size, TypedArray, WebGLResourceHandle, WebGPUResourceHandle } from '../types/CommonTypes';
import type { TextureData, VertexHandles } from '../webgl/WebGLResourceRepository';
import type { AttributeNames } from '../webgl/types/CommonTypes';
import type { WebGpuDeviceWrapper } from './WebGpuDeviceWrapper';

import HDRImage from '../../vendor/hdrpng.js';
import { ModuleManager } from '../foundation/system/ModuleManager';
import { TextureArray } from '../foundation/textures/TextureArray';
import type { WebXRSystem } from '../xr/WebXRSystem';
import type { RnXR } from '../xr/main';

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
  | GPUQuerySet
  | object;

type RenderPipelineId = string;
type RenderPassUid = number;

const _IBL_DIFFUSE_CUBE_TEXTURE_BINDING_SLOT = 16;
const _IBL_SPECULAR_CUBE_TEXTURE_BINDING_SLOT = 17;

type DRAW_PARAMETERS_IDENTIFIER = string;

/**
 * WebGPU Resource Repository that manages WebGPU resources and provides rendering functionality.
 * This class serves as a central hub for creating, managing, and utilizing WebGPU resources
 * such as textures, buffers, pipelines, and render passes.
 *
 * @extends CGAPIResourceRepository
 * @implements ICGAPIResourceRepository
 */
export class WebGpuResourceRepository extends CGAPIResourceRepository implements ICGAPIResourceRepository {
  private static __instance: WebGpuResourceRepository;
  private __webGpuResources: Map<WebGLResourceHandle, WebGpuResource> = new Map();
  private __resourceCounter: number = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __webGpuDeviceWrapper?: WebGpuDeviceWrapper;
  private __storageBuffer?: GPUBuffer;
  private __storageBlendShapeBuffer?: GPUBuffer;
  private __bindGroupStorageBuffer?: GPUBindGroup;
  private __bindGroupLayoutStorageBuffer?: GPUBindGroupLayout;
  private __webGpuRenderPipelineMap: Map<RenderPipelineId, GPURenderPipeline> = new Map();
  private __materialStateVersionMap: Map<RenderPipelineId, number> = new Map();
  private __bindGroupTextureMap: Map<RenderPipelineId, GPUBindGroup> = new Map();
  private __bindGroupLayoutTextureMap: Map<RenderPipelineId, GPUBindGroupLayout> = new Map();
  private __bindGroupSamplerMap: Map<RenderPipelineId, GPUBindGroup> = new Map();
  private __bindGroupLayoutSamplerMap: Map<RenderPipelineId, GPUBindGroupLayout> = new Map();
  private __bindGroupsUniformDrawParameters: Map<DRAW_PARAMETERS_IDENTIFIER, GPUBindGroup> = new Map();
  private __bindGroupLayoutUniformDrawParameters?: GPUBindGroupLayout;
  private __uniformDrawParametersBuffers: Map<DRAW_PARAMETERS_IDENTIFIER, GPUBuffer> = new Map();
  private __commandEncoder?: GPUCommandEncoder;
  private __renderBundles: Map<RenderPassUid, GPURenderBundle> = new Map();
  private __renderBundleEncoder?: GPURenderBundleEncoder;
  private __renderBundleEncoderKey?: string;
  private __systemDepthTexture?: GPUTexture;
  private __systemDepthTextureView?: GPUTextureView;
  private __uniformMorphOffsetsBuffer?: GPUBuffer;
  private __uniformMorphWeightsBuffer?: GPUBuffer;
  private __renderPassEncoder?: GPURenderPassEncoder;
  private __generateMipmapsShaderModule?: GPUShaderModule;
  private __generateMipmapsPipeline?: GPURenderPipeline;
  private __generateMipmapsFormat?: GPUTextureFormat;
  private __generateMipmapsSampler?: GPUSampler;
  private __generateMipmapsBindGroupLayout?: GPUBindGroupLayout;
  private __contextCurrentTextureView?: GPUTextureView;

  private __lastMaterialsUpdateCount = -1;
  private __lastCurrentCameraComponentSid = -1;
  private __lastEntityRepositoryUpdateCount = -1;
  private __lastPrimitivesMaterialVariantUpdateCount = -1;
  private __lastMeshRendererComponentsUpdateCount = -1;

  private __srcTextureViewsForGeneratingMipmaps: Map<GPUTexture, Array<GPUTextureView>> = new Map();
  private __dstTextureViewsForGeneratingMipmaps: Map<GPUTexture, Array<Array<GPUTextureView>>> = new Map();
  private __bindGroupsForGeneratingMipmaps: Map<GPUTexture, Array<Array<GPUBindGroup>>> = new Map();

  private static __drawParametersUint32Array: Uint32Array = new Uint32Array(4);
  private static __webxrSystem: WebXRSystem;

  private constructor() {
    super();
  }

  /**
   * Clears all cached resources including render pipelines, bind groups, and render bundles.
   * This method should be called when resources need to be recreated or when the rendering context changes.
   */
  clearCache() {
    this.__webGpuRenderPipelineMap.clear();
    this.__materialStateVersionMap.clear();
    this.__bindGroupTextureMap.clear();
    this.__bindGroupLayoutTextureMap.clear();
    this.__bindGroupSamplerMap.clear();
    this.__bindGroupLayoutSamplerMap.clear();
    this.__renderBundles.clear();
  }

  /**
   * Adds a WebGPU device wrapper to the repository and initializes the command encoder.
   * This must be called before using any WebGPU functionality.
   *
   * @param webGpuDeviceWrapper - The WebGPU device wrapper containing the device and context
   */
  addWebGpuDeviceWrapper(webGpuDeviceWrapper: WebGpuDeviceWrapper) {
    this.__webGpuDeviceWrapper = webGpuDeviceWrapper;
    this.__commandEncoder = this.__webGpuDeviceWrapper.gpuDevice.createCommandEncoder();
  }

  /**
   * Returns the WebGPU device wrapper instance.
   *
   * @returns The WebGPU device wrapper
   * @throws Error if the device wrapper has not been initialized
   */
  getWebGpuDeviceWrapper(): WebGpuDeviceWrapper {
    return this.__webGpuDeviceWrapper!;
  }

  /**
   * Returns the singleton instance of WebGpuResourceRepository.
   * Creates a new instance if one doesn't exist.
   *
   * @returns The singleton instance
   */
  static getInstance(): WebGpuResourceRepository {
    if (!this.__instance) {
      this.__instance = new WebGpuResourceRepository();
    }
    return this.__instance;
  }

  /**
   * Generates a unique resource number for tracking WebGPU resources.
   *
   * @returns A unique resource handle number
   */
  private getResourceNumber(): WebGPUResourceHandle {
    return ++this.__resourceCounter;
  }

  /**
   * Registers a WebGPU resource and assigns it a unique handle.
   *
   * @param obj - The WebGPU resource to register
   * @returns The unique handle for the registered resource
   */
  private __registerResource(obj: WebGpuResource) {
    const handle = this.getResourceNumber();
    (obj as any)._resourceUid = handle;
    this.__webGpuResources.set(handle, obj);
    return handle;
  }

  /**
   * Gets the current canvas size as a tuple of width and height.
   *
   * @returns A tuple containing [width, height] of the canvas
   */
  getCanvasSize(): [Size, Size] {
    const canvas = this.__webGpuDeviceWrapper!.canvas;
    return [canvas.width, canvas.height];
  }

  /**
   * Creates a WebGPU texture from ImageBitmap data with specified parameters.
   * This method handles texture creation, data upload, and optional mipmap generation.
   *
   * @param imageData - The ImageBitmap data to create the texture from
   * @param params - Configuration object containing texture parameters
   * @param params.level - Mipmap level (typically 0 for base level)
   * @param params.internalFormat - Internal format of the texture
   * @param params.width - Width of the texture in pixels
   * @param params.height - Height of the texture in pixels
   * @param params.border - Border width (must be 0 for WebGPU)
   * @param params.format - Pixel format of the source data
   * @param params.type - Component type of the source data
   * @param params.generateMipmap - Whether to generate mipmaps automatically
   * @returns Promise that resolves to the texture resource handle
   */
  public async createTextureFromImageBitmapData(
    imageData: ImageBitmapData,
    {
      internalFormat,
      width,
      height,
      generateMipmap,
    }: {
      internalFormat: TextureParameterEnum;
      width: Size;
      height: Size;
      generateMipmap: boolean;
    }
  ): Promise<WebGPUResourceHandle> {
    const textureHandle = await this.__createTextureInner(width, height, internalFormat, generateMipmap, imageData);

    return textureHandle;
  }

  /**
   * Creates a WebGPU texture from a data URI string.
   * This method loads the image from the data URI and creates a texture from it.
   *
   * @param dataUri - The data URI string containing the image data
   * @param params - Configuration object containing texture parameters
   * @param params.internalFormat - Internal format of the texture
   * @param params.generateMipmap - Whether to generate mipmaps automatically
   * @returns Promise that resolves to the texture resource handle
   */
  async createTextureFromDataUri(
    dataUri: string,
    {
      internalFormat,
      generateMipmap,
    }: {
      internalFormat: TextureParameterEnum;
      generateMipmap: boolean;
    }
  ): Promise<WebGPUResourceHandle> {
    return new Promise<WebGPUResourceHandle>(resolve => {
      const img = new Image();
      if (!dataUri.match(/^data:/)) {
        img.crossOrigin = 'Anonymous';
      }
      img.onload = async () => {
        const width = img.width;
        const height = img.height;

        const texture = await this.createTextureFromHTMLImageElement(img, {
          internalFormat,
          width,
          height,
          generateMipmap,
        });

        resolve(texture);
      };

      img.src = dataUri;
    });
  }

  /**
   * Generates mipmaps for a 2D texture using the specified dimensions.
   * This method creates all mipmap levels from the base texture.
   *
   * @param textureHandle - Handle to the texture resource
   * @param width - Width of the base texture level
   * @param height - Height of the base texture level
   */
  generateMipmaps2d(textureHandle: WebGPUResourceHandle, width: number, height: number): void {
    const gpuTexture = this.__webGpuResources.get(textureHandle) as GPUTexture;
    const textureDescriptor: GPUTextureDescriptor = {
      size: [width, height, 1],
      format: gpuTexture.format,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      mipLevelCount: Math.floor(Math.log2(Math.max(width, height))) + 1,
    };
    this.generateMipmaps(gpuTexture, textureDescriptor);
  }

  /**
   * Generates mipmaps for a cube texture using the specified dimensions.
   * This method creates all mipmap levels for all 6 faces of the cube texture.
   *
   * @param textureHandle - Handle to the cube texture resource
   * @param width - Width of the base texture level
   * @param height - Height of the base texture level
   */
  generateMipmapsCube(textureHandle: WebGPUResourceHandle, width: number, height: number): void {
    const gpuTexture = this.__webGpuResources.get(textureHandle) as GPUTexture;
    const textureDescriptor: GPUTextureDescriptor = {
      size: [width, height, 6],
      format: gpuTexture.format,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      mipLevelCount: Math.floor(Math.log2(Math.max(width, height))) + 1,
    };
    this.generateMipmaps(gpuTexture, textureDescriptor);
  }

  /**
   * Reads pixel data from a texture and returns it as a Uint8Array.
   * This method is useful for debugging or post-processing texture data.
   *
   * @param textureHandle - Handle to the texture resource
   * @param width - Width of the texture region to read
   * @param height - Height of the texture region to read
   * @param frameBufferUid - Handle to the framebuffer (if applicable)
   * @param colorAttachmentIndex - Index of the color attachment to read from
   * @returns Promise that resolves to the pixel data as Uint8Array
   */
  async getTexturePixelData(
    textureHandle: WebGPUResourceHandle,
    width: number,
    height: number,
    _frameBufferUid: WebGPUResourceHandle,
    _colorAttachmentIndex: number
  ): Promise<Uint8Array> {
    const gpuTexture = this.__webGpuResources.get(textureHandle) as GPUTexture;
    const textureData = new Uint8Array(width * height * 4);
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const commandEncoder = gpuDevice.createCommandEncoder();
    const buffer = gpuDevice.createBuffer({
      size: width * height * 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    commandEncoder.copyTextureToBuffer(
      { texture: gpuTexture },
      { buffer, bytesPerRow: width * 4 },
      { width, height, depthOrArrayLayers: 1 }
    );
    gpuDevice.queue.submit([commandEncoder.finish()]);
    await buffer.mapAsync(GPUMapMode.READ);
    const arrayBuffer = buffer.getMappedRange();
    textureData.set(new Uint8Array(arrayBuffer));
    buffer.unmap();
    return textureData;
  }

  /**
   * Generates mipmaps for a texture using render passes (including CubeMap support).
   * This is an optimized method adapted from WebGPU best practices that uses
   * a custom shader to generate each mipmap level from the previous one.
   *
   * @remarks
   * Adapted from: https://toji.dev/webgpu-best-practices/img-textures#generating-mipmaps
   * @param texture - The GPU texture to generate mipmaps for
   * @param textureDescriptor - Descriptor containing texture format and dimensions
   */
  generateMipmaps(texture: GPUTexture, textureDescriptor: GPUTextureDescriptor) {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;

    if (this.__generateMipmapsShaderModule == null) {
      this.__generateMipmapsShaderModule = gpuDevice.createShaderModule({
        code: /* wgsl */ `
          var<private> pos : array<vec2f, 4> = array<vec2f, 4>(
            vec2f(-1, 1), vec2f(1, 1),
            vec2f(-1, -1), vec2f(1, -1));

          struct VertexOutput {
            @builtin(position) position : vec4f,
            @location(0) texCoord : vec2f,
          };

          @vertex
          fn vertexMain(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {
            var output : VertexOutput;
            output.texCoord = pos[vertexIndex] * vec2f(0.5, -0.5) + vec2f(0.5);
            output.position = vec4f(pos[vertexIndex], 0, 1);
            return output;
          }

          @group(0) @binding(0) var imgSampler : sampler;
          @group(0) @binding(1) var img : texture_2d<f32>;

          @fragment
          fn fragmentMain(@location(0) texCoord : vec2f) -> @location(0) vec4f {
            return textureSample(img, imgSampler, texCoord);
          }
        `,
      });
    }

    if (this.__generateMipmapsPipeline != null && textureDescriptor.format !== this.__generateMipmapsFormat) {
      this.__generateMipmapsPipeline = undefined;
    }
    if (this.__generateMipmapsPipeline == null) {
      this.__generateMipmapsBindGroupLayout = gpuDevice.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            sampler: {
              type: 'filtering',
            },
          },
          {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT,
            texture: {
              viewDimension: '2d',
            },
          },
        ],
      });
      const pipelineLayout = gpuDevice.createPipelineLayout({
        bindGroupLayouts: [this.__generateMipmapsBindGroupLayout],
      });
      this.__generateMipmapsPipeline = gpuDevice.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
          module: this.__generateMipmapsShaderModule,
          entryPoint: 'vertexMain',
        },
        fragment: {
          module: this.__generateMipmapsShaderModule,
          entryPoint: 'fragmentMain',
          targets: [
            {
              format: textureDescriptor.format,
            },
          ],
        },
        primitive: {
          topology: 'triangle-strip',
          stripIndexFormat: 'uint32',
        },
      });
      this.__generateMipmapsFormat = textureDescriptor.format;
    }

    if (this.__generateMipmapsSampler == null) {
      this.__generateMipmapsSampler = gpuDevice.createSampler({ minFilter: 'linear' });
    }

    if (this.__renderPassEncoder != null) {
      if (this.__renderBundleEncoder != null) {
        this.__renderPassEncoder.executeBundles([this.__renderBundleEncoder.finish()]);
        this.__renderBundleEncoder = undefined;
        this.__renderBundleEncoderKey = undefined;
      }
      this.__renderPassEncoder.end();
      this.__renderPassEncoder = undefined;
    }
    const isCubemap = texture.dimension === '2d' && texture.depthOrArrayLayers === 6;
    const layerCount = isCubemap ? 6 : 1;

    for (let layer = 0; layer < layerCount; ++layer) {
      const srcTextureViewsMap = this.__srcTextureViewsForGeneratingMipmaps.get(texture);
      if (srcTextureViewsMap == null || srcTextureViewsMap[layer] == null) {
        const srcView = texture.createView({
          dimension: '2d',
          baseMipLevel: 0,
          mipLevelCount: 1,
          baseArrayLayer: layer,
          arrayLayerCount: 1,
        });
        if (srcTextureViewsMap == null) {
          this.__srcTextureViewsForGeneratingMipmaps.set(texture, []);
        }
        this.__srcTextureViewsForGeneratingMipmaps.get(texture)![layer] = srcView;
      }
      let srcView = this.__srcTextureViewsForGeneratingMipmaps.get(texture)![layer];

      for (let i = 1; i < textureDescriptor.mipLevelCount!; ++i) {
        const dstTextureViewsMap = this.__dstTextureViewsForGeneratingMipmaps.get(texture);
        if (dstTextureViewsMap == null || dstTextureViewsMap[layer] == null || dstTextureViewsMap[layer][i] == null) {
          const dstView = texture.createView({
            dimension: '2d',
            baseMipLevel: i,
            mipLevelCount: 1,
            baseArrayLayer: layer,
            arrayLayerCount: 1,
          });

          if (dstTextureViewsMap == null) {
            this.__dstTextureViewsForGeneratingMipmaps.set(texture, []);
          }
          if (this.__dstTextureViewsForGeneratingMipmaps.get(texture)![layer] == null) {
            this.__dstTextureViewsForGeneratingMipmaps.get(texture)![layer] = [];
          }
          this.__dstTextureViewsForGeneratingMipmaps.get(texture)![layer][i] = dstView;
        }
        const dstView = this.__dstTextureViewsForGeneratingMipmaps.get(texture)![layer][i];

        const passEncoder = this.__commandEncoder!.beginRenderPass({
          colorAttachments: [
            {
              view: dstView,
              loadOp: 'load',
              storeOp: 'store',
            },
          ],
        });

        const bindGroupsMap = this.__bindGroupsForGeneratingMipmaps.get(texture);
        if (bindGroupsMap == null || bindGroupsMap[layer] == null || bindGroupsMap[layer][i] == null) {
          const bindGroup = gpuDevice.createBindGroup({
            layout: this.__generateMipmapsBindGroupLayout!,
            entries: [
              {
                binding: 0,
                resource: this.__generateMipmapsSampler,
              },
              {
                binding: 1,
                resource: srcView,
              },
            ],
          });

          if (bindGroupsMap == null) {
            this.__bindGroupsForGeneratingMipmaps.set(texture, []);
          }
          if (this.__bindGroupsForGeneratingMipmaps.get(texture)![layer] == null) {
            this.__bindGroupsForGeneratingMipmaps.get(texture)![layer] = [];
          }
          this.__bindGroupsForGeneratingMipmaps.get(texture)![layer][i] = bindGroup;
        }
        const bindGroup = this.__bindGroupsForGeneratingMipmaps.get(texture)![layer][i];
        // Render
        passEncoder.setPipeline(this.__generateMipmapsPipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.draw(4);
        passEncoder.end();

        srcView = dstView;
      }
    }
  }

  /**
   * Creates a texture sampler with the specified filtering and wrapping parameters.
   * The sampler defines how textures are filtered and wrapped when accessed in shaders.
   *
   * @param params - Configuration object for the sampler
   * @param params.magFilter - Magnification filter mode
   * @param params.minFilter - Minification filter mode
   * @param params.wrapS - Wrapping mode for S (U) texture coordinate
   * @param params.wrapT - Wrapping mode for T (V) texture coordinate
   * @param params.wrapR - Wrapping mode for R (W) texture coordinate
   * @param params.anisotropy - Whether to enable anisotropic filtering
   * @returns Handle to the created sampler resource
   */
  createTextureSampler({
    magFilter,
    minFilter,
    wrapS,
    wrapT,
    wrapR,
    anisotropy,
  }: {
    magFilter: TextureParameterEnum;
    minFilter: TextureParameterEnum;
    wrapS: TextureParameterEnum;
    wrapT: TextureParameterEnum;
    wrapR: TextureParameterEnum;
    anisotropy: boolean;
  }): WebGPUResourceHandle {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const maxAnisotropy = anisotropy ? 4 : 1;

    const desc = {
      magFilter: magFilter.webgpu as GPUFilterMode,
      minFilter: minFilter.webgpu as GPUFilterMode,
      mipmapFilter:
        minFilter === TextureParameter.LinearMipmapLinear || minFilter === TextureParameter.NearestMipmapLinear
          ? 'linear'
          : 'nearest',
      addressModeU: wrapS.webgpu as GPUAddressMode,
      addressModeV: wrapT.webgpu as GPUAddressMode,
      addressModeW: wrapR.webgpu as GPUAddressMode,
      // lodMinClamp: 0,
      // lodMaxClamp: 32,
      maxAnisotropy,
    } as GPUSamplerDescriptor;

    if (desc.magFilter === 'nearest' || desc.minFilter === 'nearest' || desc.mipmapFilter === 'nearest') {
      desc.maxAnisotropy = 1;
    }

    const sampler = gpuDevice.createSampler(desc);

    const samplerHandle = this.__registerResource(sampler);

    return samplerHandle;
  }

  /**
   * Creates a WebGPU vertex buffer from an accessor containing vertex data.
   * The buffer is created with the appropriate size and the data is uploaded immediately.
   *
   * @param accessor - Accessor containing the vertex data to upload
   * @returns Handle to the created vertex buffer
   */
  public createVertexBuffer(accessor: Accessor): WebGPUResourceHandle {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const vertexBuffer = gpuDevice.createBuffer({
      size: accessor.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });

    new Uint8Array(vertexBuffer.getMappedRange()).set(accessor.getUint8Array());
    vertexBuffer.unmap();

    const bufferHandle = this.__registerResource(vertexBuffer);

    return bufferHandle;
  }

  /**
   * Creates a WebGPU vertex buffer from a typed array.
   * This is a more direct method when you have raw typed array data.
   *
   * @param typedArray - The typed array containing vertex data
   * @returns Handle to the created vertex buffer resource
   */
  createVertexBufferFromTypedArray(typedArray: TypedArray): WebGPUResourceHandle {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const vertexBuffer = gpuDevice.createBuffer({
      size: typedArray.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });

    new Uint8Array(vertexBuffer.getMappedRange()).set(new Uint8Array(typedArray.buffer));
    vertexBuffer.unmap();

    const resourceHandle = this.__registerResource(vertexBuffer);

    return resourceHandle;
  }

  /**
   * Creates a WebGPU index buffer from an accessor containing index data.
   * Automatically converts UnsignedByte indices to UnsignedShort since WebGPU
   * doesn't support 8-bit index buffers.
   *
   * @param accessor - Accessor containing the index data to upload
   * @returns Handle to the created index buffer resource
   */
  public createIndexBuffer(accessor: Accessor): WebGPUResourceHandle {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;

    let uint8Array = accessor.getUint8Array();
    if (accessor.componentType === ComponentType.UnsignedByte) {
      // WebGPU does not support uint8 for index buffer.
      // So we need to convert uint8 to uint16.
      const uint16Array = new Uint16Array(accessor.byteLength);
      const typedArray = accessor.getTypedArray();
      for (let i = 0; i < typedArray.length; i++) {
        uint16Array[i] = typedArray[i];
      }
      uint8Array = new Uint8Array(uint16Array.buffer);
    }

    const size = DataUtil.addPaddingBytes(uint8Array.byteLength, 4);
    const indexBuffer = gpuDevice.createBuffer({
      size: size,
      usage: GPUBufferUsage.INDEX,
      mappedAtCreation: true,
    });

    new Uint8Array(indexBuffer.getMappedRange()).set(uint8Array);
    indexBuffer.unmap();

    const bufferHandle = this.__registerResource(indexBuffer);

    return bufferHandle;
  }

  /**
   * Updates the data in an existing vertex buffer with new data from an accessor.
   * This method maps the buffer for writing and uploads the new data.
   *
   * @param accessor - Accessor containing the new vertex data
   * @param resourceHandle - Handle to the existing vertex buffer to update
   * @throws Error if the vertex buffer is not found
   */
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

  /**
   * Updates the data in an existing index buffer with new data from an accessor.
   * Automatically handles conversion of UnsignedByte indices to UnsignedShort if needed.
   *
   * @param accessor - Accessor containing the new index data
   * @param resourceHandle - Handle to the existing index buffer to update
   * @throws Error if the index buffer is not found
   */
  updateIndexBuffer(accessor: Accessor, resourceHandle: WebGPUResourceHandle) {
    const indexBuffer = this.__webGpuResources.get(resourceHandle) as GPUBuffer;
    if (Is.not.exist(indexBuffer)) {
      throw new Error('Not found IBO.');
    }

    indexBuffer.mapAsync(GPUMapMode.WRITE).then(() => {
      let uint8Array = accessor.getUint8Array();
      if (accessor.componentType === ComponentType.UnsignedByte) {
        // WebGPU does not support uint8 for index buffer.
        // So we need to convert uint8 to uint16.
        const uint16Array = new Uint16Array(accessor.byteLength);
        const typedArray = accessor.getTypedArray();
        for (let i = 0; i < typedArray.length; i++) {
          uint16Array[i] = typedArray[i];
        }
        uint8Array = new Uint8Array(uint16Array.buffer);
      }
      new Uint8Array(indexBuffer.getMappedRange()).set(uint8Array);
      indexBuffer.unmap();
    });
  }

  /**
   * Deletes a vertex buffer and removes it from the resource registry.
   * This destroys the GPU buffer and frees its memory.
   *
   * @param resourceHandle - Handle to the vertex buffer to delete
   * @throws Error if the vertex buffer is not found
   */
  deleteVertexBuffer(resourceHandle: WebGPUResourceHandle) {
    const vertexBuffer = this.__webGpuResources.get(resourceHandle) as GPUBuffer;
    if (Is.not.exist(vertexBuffer)) {
      throw new Error('Not found VBO.');
    }

    vertexBuffer.destroy();
    this.__webGpuResources.delete(resourceHandle);
  }

  /**
   * Creates vertex and index buffers for a primitive and returns their handles.
   * This method processes all vertex attributes and creates appropriate buffers
   * while tracking which attributes are present.
   *
   * @param primitive - The primitive containing vertex and index data
   * @returns Object containing buffer handles and attribute flags
   */
  createVertexBufferAndIndexBuffer(primitive: Primitive): VertexHandles {
    let iboHandle: WebGPUResourceHandle;
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
      const slotIdx = VertexAttribute.toAttributeSlotFromJoinedString(primitive.attributeSemantics[i]);
      attributesFlags[slotIdx] = true;
      vboHandles.push(vboHandle);
    });

    return {
      vaoHandle: -1,
      iboHandle: iboHandle!,
      vboHandles: vboHandles,
      attributesFlags: attributesFlags,
      setComplete: false,
    };
  }

  /**
   * Updates the vertex and index buffers for a primitive with new data.
   * This method updates all existing buffers with fresh data from the primitive.
   *
   * @param primitive - The primitive containing the updated vertex and index data
   * @param vertexHandles - Object containing the handles to the buffers to update
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

  /**
   * Deletes all vertex data resources (vertex and index buffers) associated with vertex handles.
   * This method destroys both vertex buffers and index buffers to free GPU memory.
   *
   * @param vertexHandles - Object containing handles to the vertex data resources to delete
   */
  deleteVertexDataResources(vertexHandles: VertexHandles) {
    if (Is.exist(vertexHandles.iboHandle)) {
      const indexBuffer = this.__webGpuResources.get(vertexHandles.iboHandle) as GPUBuffer;
      if (Is.exist(indexBuffer)) {
        indexBuffer.destroy();
      }
    }

    for (const vboHandle of vertexHandles.vboHandles) {
      const vertexBuffer = this.__webGpuResources.get(vboHandle) as GPUBuffer;
      if (Is.exist(vertexBuffer)) {
        vertexBuffer.destroy();
      }
    }
  }

  /**
   * Configures vertex data layout for the rendering pipeline.
   * This method sets up vertex buffer layouts including both per-vertex and per-instance data.
   *
   * @param bufferHandles - Object containing vertex array object, index buffer, and vertex buffer handles
   * @param bufferHandles.vboHandles - Array of vertex buffer handles
   * @param primitive - The primitive containing vertex attribute information
   */
  setVertexDataToPipeline(
    {
      vboHandles,
    }: {
      vboHandles: Array<WebGPUResourceHandle>;
    },
    primitive: Primitive
  ) {
    const buffers: GPUVertexBufferLayout[] = [];

    // Vertex Buffer Settings
    /// Each vertex attributes
    const attributes: GPUVertexAttribute[] = [];
    for (let i = 0; i < vboHandles.length; i++) {
      const shaderLocation = VertexAttribute.toAttributeSlotFromJoinedString(primitive.attributeSemantics[i]);

      const gpuVertexFormat = (primitive.attributeAccessors[i].componentType.webgpu +
        primitive.attributeAccessors[i].compositionType.webgpu) as GPUVertexFormat;
      attributes.push({
        shaderLocation,
        offset: primitive.attributeAccessors[i].byteOffsetInBufferView,
        format: gpuVertexFormat,
      });
    }
    buffers[0] = {
      stepMode: 'vertex',
      attributes,
      arrayStride: primitive.attributeAccessors[0].byteStride,
    };

    /// Instance Buffer
    buffers[1] = {
      stepMode: 'instance',
      attributes: [
        {
          shaderLocation: VertexAttribute.Instance.getAttributeSlot(),
          offset: 0,
          format: 'float32x4',
        },
      ],
      arrayStride: 4 * 4,
    };
  }

  /**
   * Checks and logs shader compilation status and error messages.
   * This method provides detailed debugging information when shader compilation fails.
   *
   * @param materialTypeName - Name of the material type for debugging
   * @param shaderText - The shader source code that was compiled
   * @param info - WebGPU compilation info containing messages and errors
   * @returns True if compilation was successful, false otherwise
   */
  private __checkShaderCompileStatus(materialTypeName: string, shaderText: string, info: GPUCompilationInfo): boolean {
    Logger.info(`MaterialTypeName: ${materialTypeName}`);
    const lineNumberedShaderText = MiscUtil.addLineNumberToCode(shaderText);
    Logger.info(lineNumberedShaderText);
    let isOk = true;
    for (let i = 0; i < info.messages.length; i++) {
      Logger.info(info.messages[i].message);
      isOk = false;
    }

    return isOk;
  }

  /**
   * Creates shader modules (vertex and fragment) from shader source code.
   * This method compiles both vertex and fragment shaders and returns their handles.
   *
   * @param params - Configuration object for shader creation
   * @param params.material - The material that will use these shaders
   * @param params.vertexShaderStr - WGSL vertex shader source code
   * @param params.fragmentShaderStr - WGSL fragment shader source code
   * @returns Handle to the shader program containing both modules
   */
  createShaderProgram({
    material,
    vertexShaderStr,
    fragmentShaderStr,
  }: {
    material: Material;
    vertexShaderStr: string;
    fragmentShaderStr: string;
  }) {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const vsModule = gpuDevice.createShaderModule({
      code: vertexShaderStr,
      label: `${material.materialTypeName} vertex shader`,
    });
    if (Config.cgApiDebugConsoleOutput) {
      vsModule.getCompilationInfo().then(info => {
        if (info.messages.length > 0) {
          this.__checkShaderCompileStatus(material.materialTypeName, vertexShaderStr, info);
        }
      });
    }
    const fsModule = gpuDevice.createShaderModule({
      code: fragmentShaderStr,
      label: `${material.materialTypeName} fragment shader`,
    });
    if (Config.cgApiDebugConsoleOutput) {
      fsModule.getCompilationInfo().then(info => {
        if (info.messages.length > 0) {
          this.__checkShaderCompileStatus(material.materialTypeName, fragmentShaderStr, info);
        }
      });
    }

    const modules = {
      vsModule,
      fsModule,
    };
    const modulesHandle = this.__registerResource(modules);

    return modulesHandle;
  }

  /**
   * Clears the framebuffer with the specified clear values.
   * This method is executed when the render pass has no entities to render,
   * but still needs to perform clear operations.
   *
   * @param renderPass - The render pass containing clear settings and target framebuffer
   */
  clearFrameBuffer(renderPass: RenderPass) {
    if (renderPass.entities.length > 0) {
      return;
    }
    // this method is executed when the renderPass has no entities.
    // If the renderPass has entities, the clear operation is executed in the createRenderPassEncoder method.

    if (!renderPass.toClearColorBuffer && !renderPass.toClearDepthBuffer) {
      return;
    }

    const context = this.__webGpuDeviceWrapper!.context;
    const colorAttachments: GPURenderPassColorAttachment[] = [];
    let depthStencilAttachment: GPURenderPassDepthStencilAttachment | undefined;
    const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
    const webxrSystem = rnXRModule.WebXRSystem.getInstance();
    if (renderPass.toClearColorBuffer) {
      const framebuffer = renderPass.getFramebuffer();
      if (framebuffer != null) {
        for (let colorAttachment of framebuffer.colorAttachments) {
          const textureView = this.__webGpuResources.get(
            colorAttachment._textureViewAsRenderTargetResourceUid
          ) as GPUTextureView;
          colorAttachments.push({
            view: textureView,
            clearValue: {
              r: renderPass.clearColor.x,
              g: renderPass.clearColor.y,
              b: renderPass.clearColor.z,
              a: renderPass.clearColor.w,
            },
            loadOp: 'clear',
            storeOp: 'store',
          });
        }
      } else if (webxrSystem.isWebXRMode && renderPass.isOutputForVr) {
        for (let i = 0; i < SystemState.xrPoseWebGPU!.views.length; i++) {
          const view = SystemState.xrPoseWebGPU!.views[i];
          const subImage = SystemState.xrGpuBinding.getViewSubImage(SystemState.xrProjectionLayerWebGPU!, view);
          colorAttachments.push({
            view: subImage.colorTexture.createView(subImage.getViewDescriptor()),
            clearValue: {
              r: renderPass.clearColor.x,
              g: renderPass.clearColor.y,
              b: renderPass.clearColor.z,
              a: renderPass.clearColor.w,
            },
            loadOp: 'clear',
            storeOp: 'store',
          });
        }
      } else {
        if (this.__contextCurrentTextureView == null) {
          this.__contextCurrentTextureView = context.getCurrentTexture().createView();
        }
        colorAttachments.push({
          view: this.__contextCurrentTextureView,
          clearValue: {
            r: renderPass.clearColor.x,
            g: renderPass.clearColor.y,
            b: renderPass.clearColor.z,
            a: renderPass.clearColor.w,
          },
          loadOp: 'clear',
          storeOp: 'store',
        });
      }
    }
    if (renderPass.toClearDepthBuffer) {
      const framebuffer = renderPass.getFramebuffer();
      if (framebuffer != null && framebuffer.depthAttachment != null) {
        const depthTextureView = this.__webGpuResources.get(
          framebuffer.depthAttachment._textureViewAsRenderTargetResourceUid
        ) as GPUTextureView;
        depthStencilAttachment = {
          view: depthTextureView,
          depthClearValue: renderPass.clearDepth,
          depthLoadOp: 'clear',
          depthStoreOp: 'store',
        };
      } else if (webxrSystem.isWebXRMode && renderPass.isOutputForVr) {
        for (let i = 0; i < SystemState.xrPoseWebGPU!.views.length; i++) {
          const view = SystemState.xrPoseWebGPU!.views[i];
          const subImage = SystemState.xrGpuBinding.getViewSubImage(SystemState.xrProjectionLayerWebGPU!, view);
          depthStencilAttachment = {
            view: subImage.depthStencilTexture.createView(subImage.getViewDescriptor()),
            depthClearValue: renderPass.clearDepth,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
          };
        }
      } else {
        depthStencilAttachment = {
          view: this.__systemDepthTextureView!,
          depthClearValue: renderPass.clearDepth,
          depthLoadOp: 'clear',
          depthStoreOp: 'store',
        };
      }
    }

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: colorAttachments,
      depthStencilAttachment: depthStencilAttachment,
      label: renderPass.uniqueName,
    };
    const passEncoder = this.__commandEncoder!.beginRenderPass(renderPassDescriptor);
    passEncoder.end();
  }

  /**
   * Executes a draw call for rendering a primitive with the specified material and render pass.
   * This is the core rendering method that sets up the render pipeline, bind groups,
   * and executes the actual GPU draw commands.
   *
   * @param primitive - The geometric primitive to render (vertices, indices, attributes)
   * @param material - The material containing shaders and rendering properties
   * @param renderPass - The render pass defining render targets and clear operations
   * @param cameraId - Identifier for the camera used for rendering
   * @param zWrite - Whether to enable depth writing during rendering
   */
  draw(primitive: Primitive, material: Material, renderPass: RenderPass, cameraId: number, zWrite: boolean) {
    const isBufferLessRendering = renderPass.isBufferLessRenderingMode();
    const VertexHandles = primitive._vertexHandles;
    if (!isBufferLessRendering && VertexHandles == null) {
      return;
    }

    let meshRendererComponentFingerPrint = '';
    let diffuseCubeMap: CubeTexture | RenderTargetTextureCube | undefined;
    let specularCubeMap: CubeTexture | RenderTargetTextureCube | undefined;
    let sheenCubeMap: CubeTexture | RenderTargetTextureCube | undefined;
    if (!isBufferLessRendering) {
      const mesh = primitive.mesh as Mesh;
      const entity = mesh.meshEntitiesInner[0]; // get base mesh for instancing draw
      const meshRendererComponent = entity.getMeshRenderer()!;

      material._setInternalSettingParametersToGpuWebGpu({
        material: material,
        args: {
          cameraComponentSid: cameraId,
          entity,
          specularCube: meshRendererComponent.specularCubeMap,
        },
      });
      diffuseCubeMap = meshRendererComponent.diffuseCubeMap;
      specularCubeMap = meshRendererComponent.specularCubeMap;
      sheenCubeMap = meshRendererComponent.sheenCubeMap;
      meshRendererComponentFingerPrint = meshRendererComponent.getFingerPrint();
    }

    const renderPipelineId = `${primitive._getFingerPrint()} ${material._getFingerPrint()} ${material.__materialTypeName} ${
      renderPass.renderPassUID
    } ${meshRendererComponentFingerPrint} ${zWrite} `;
    const bindGroupId = `${renderPipelineId} ${material.stateVersion} ${material.__materialSid}`;

    if (!this.__bindGroupTextureMap.has(bindGroupId)) {
      this.__createBindGroup(bindGroupId, material, diffuseCubeMap, specularCubeMap, sheenCubeMap);
    }

    const [pipeline, _recreated] = this.getOrCreateRenderPipeline(
      renderPipelineId,
      bindGroupId,
      primitive,
      material,
      renderPass,
      zWrite,
      diffuseCubeMap,
      specularCubeMap,
      sheenCubeMap
    );

    const renderBundleEncoder = this.__renderBundleEncoder!;
    renderBundleEncoder.setBindGroup(0, this.__bindGroupStorageBuffer!);
    renderBundleEncoder.setPipeline(pipeline);
    renderBundleEncoder.setBindGroup(1, this.__bindGroupTextureMap.get(bindGroupId)!);
    renderBundleEncoder.setBindGroup(2, this.__bindGroupSamplerMap.get(bindGroupId)!);
    renderBundleEncoder.setBindGroup(
      3,
      this.__bindGroupsUniformDrawParameters.get(`${renderPass.renderPassUID}-${primitive.primitiveUid}`)!
    );
    if (isBufferLessRendering) {
      renderBundleEncoder.draw(renderPass._drawVertexNumberForBufferLessRendering);
    } else {
      const mesh = primitive.mesh as Mesh;
      const variationVBO = this.__webGpuResources.get(mesh._variationVBOUid) as GPUBuffer;
      renderBundleEncoder.setVertexBuffer(0, variationVBO);
      VertexHandles!.vboHandles.forEach((vboHandle, i) => {
        const vertexBuffer = this.__webGpuResources.get(vboHandle) as GPUBuffer;
        renderBundleEncoder.setVertexBuffer(i + 1, vertexBuffer);
      });

      if (primitive.hasIndices()) {
        const indicesBuffer = this.__webGpuResources.get(VertexHandles!.iboHandle!) as GPUBuffer;
        const indexBitSize = primitive.getIndexBitSize();
        renderBundleEncoder.setIndexBuffer(indicesBuffer, indexBitSize);
        const indicesAccessor = primitive.indicesAccessor!;
        renderBundleEncoder.drawIndexed(indicesAccessor.elementCount, mesh.meshEntitiesInner.length);
      } else {
        const vertexCount = primitive.attributeAccessors[0].elementCount;
        renderBundleEncoder.draw(vertexCount, mesh.meshEntitiesInner.length);
      }
    }
  }

  /**
   * Creates a render bundle encoder for efficient rendering.
   * Render bundles allow pre-recording of rendering commands for better performance.
   *
   * @param renderPass - The render pass that will use this render bundle encoder
   */
  private __getRenderBundleDescriptor(renderPass: RenderPass): GPURenderBundleEncoderDescriptor {
    const framebuffer = renderPass.getFramebuffer();
    const resolveFramebuffer = renderPass.getResolveFramebuffer();
    let colorFormats: GPUTextureFormat[] = [];
    let depthStencilFormat: GPUTextureFormat | undefined;
    let sampleCount = 1;

    if (framebuffer != null) {
      for (const colorAttachment of framebuffer.colorAttachments) {
        if (colorAttachment == null) {
          continue;
        }
        const textureResourceUid = (colorAttachment as { _textureResourceUid?: WebGLResourceHandle })
          ._textureResourceUid;
        if (textureResourceUid == null || textureResourceUid < 0) {
          continue;
        }
        const texture = this.__webGpuResources.get(textureResourceUid) as GPUTexture | undefined;
        if (texture != null) {
          colorFormats.push(texture.format);
        }
      }

      if (resolveFramebuffer != null && framebuffer.colorAttachments.length > 0) {
        const msaaAttachment = framebuffer.colorAttachments[0] as RenderBuffer | undefined;
        const sampledCount = msaaAttachment?.sampleCount;
        if (typeof sampledCount === 'number' && sampledCount > 0) {
          sampleCount = sampledCount;
        }
      }

      if (framebuffer.depthAttachment != null) {
        const depthTextureUid = (framebuffer.depthAttachment as { _textureResourceUid?: WebGLResourceHandle })
          ._textureResourceUid;
        if (depthTextureUid != null && depthTextureUid >= 0) {
          const depthTexture = this.__webGpuResources.get(depthTextureUid) as GPUTexture | undefined;
          depthStencilFormat = depthTexture?.format;
        } else {
          depthStencilFormat = undefined;
        }
      } else {
        depthStencilFormat = undefined;
      }
    } else {
      colorFormats = [navigator.gpu.getPreferredCanvasFormat()];
      depthStencilFormat =
        this.__systemDepthTexture != null ? this.__systemDepthTexture.format : ('depth24plus' as GPUTextureFormat);
    }

    if (colorFormats.length === 0) {
      colorFormats = [navigator.gpu.getPreferredCanvasFormat()];
    }

    return {
      colorFormats,
      depthStencilFormat,
      sampleCount,
    };
  }

  createRenderBundleEncoder(renderPass: RenderPass) {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const renderBundleDescriptor = this.__getRenderBundleDescriptor(renderPass);
    const descriptorKey = JSON.stringify({
      colorFormats: renderBundleDescriptor.colorFormats,
      depthStencilFormat: renderBundleDescriptor.depthStencilFormat ?? null,
      sampleCount: renderBundleDescriptor.sampleCount,
    });

    if (this.__renderBundleEncoder != null && this.__renderBundleEncoderKey === descriptorKey) {
      return;
    }

    this.__renderBundleEncoder = gpuDevice.createRenderBundleEncoder(renderBundleDescriptor);
    this.__renderBundleEncoderKey = descriptorKey;
  }

  /**
   * Creates a render pass encoder for immediate rendering commands.
   * This encoder is used for recording rendering commands that will be executed immediately.
   *
   * @param renderPass - The render pass configuration including targets and clear values
   */
  private createRenderPassEncoder(renderPass: RenderPass) {
    if (this.__renderPassEncoder != null) {
      return;
    }

    const framebuffer = renderPass.getFramebuffer();
    const resolveFramebuffer = renderPass.getResolveFramebuffer();

    const clearValue = renderPass.toClearColorBuffer
      ? {
          r: renderPass.clearColor.x,
          g: renderPass.clearColor.y,
          b: renderPass.clearColor.z,
          a: renderPass.clearColor.w,
        }
      : undefined;
    const depthClearValue = renderPass.toClearDepthBuffer ? renderPass.clearDepth : undefined;

    const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
    const webxrSystem = rnXRModule.WebXRSystem.getInstance();

    if (resolveFramebuffer != null && framebuffer != null) {
      let depthTextureView = this.__systemDepthTextureView!;
      if (framebuffer.depthAttachment != null) {
        const depthTexture = this.__webGpuResources.get(framebuffer.depthAttachment._textureResourceUid) as GPUTexture;
        if (depthTexture != null) {
          depthTextureView = this.__webGpuResources.get(
            framebuffer.depthAttachment._textureViewResourceUid
          ) as GPUTextureView;
        }
      }
      const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [],
        depthStencilAttachment: {
          view: depthTextureView,
          depthClearValue: depthClearValue,
          depthLoadOp: renderPass.toClearDepthBuffer ? 'clear' : 'load',
          depthStoreOp: 'store',
        },
        label: renderPass.uniqueName,
      };
      const colorAttachments: GPURenderPassColorAttachment[] = [];
      for (let i = 0; i < resolveFramebuffer.colorAttachments.length; i++) {
        const colorAttachment = framebuffer.colorAttachments[i] as RenderBuffer;
        const resolveColorAttachment = resolveFramebuffer.colorAttachments[i] as RenderBuffer;
        const textureView = this.__webGpuResources.get(
          colorAttachment._textureViewAsRenderTargetResourceUid
        ) as GPUTextureView;
        let resolveTextureView = this.__webGpuResources.get(
          resolveColorAttachment._textureViewAsRenderTargetResourceUid
        ) as GPUTextureView;
        colorAttachments.push({
          view: textureView,
          resolveTarget: resolveTextureView,
          clearValue: clearValue,
          loadOp: renderPass.toClearColorBuffer ? 'clear' : 'load',
          storeOp: 'store',
        });
      }
      renderPassDescriptor.colorAttachments = colorAttachments as GPURenderPassColorAttachment[];
      this.__renderPassEncoder = this.__commandEncoder!.beginRenderPass(renderPassDescriptor);
    } else if (framebuffer != null) {
      let depthTextureView: GPUTextureView | undefined = undefined;
      if (framebuffer.depthAttachment != null) {
        const depthTexture = this.__webGpuResources.get(framebuffer.depthAttachment._textureResourceUid) as GPUTexture;
        if (depthTexture != null) {
          depthTextureView = this.__webGpuResources.get(
            framebuffer.depthAttachment._textureViewAsRenderTargetResourceUid
          ) as GPUTextureView;
        }
      }
      let depthStencilAttachment: GPURenderPassDepthStencilAttachment | undefined = undefined;
      if (depthTextureView != null) {
        depthStencilAttachment = {
          view: depthTextureView,
          depthClearValue: depthClearValue,
          depthLoadOp: renderPass.toClearDepthBuffer ? 'clear' : 'load',
          depthStoreOp: 'store',
        };
      }
      const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [],
        depthStencilAttachment: depthStencilAttachment,
        label: renderPass.uniqueName,
      };
      const colorAttachments: GPURenderPassColorAttachment[] = [];
      for (let colorAttachment of framebuffer.colorAttachments) {
        const textureView = this.__webGpuResources.get(
          colorAttachment._textureViewAsRenderTargetResourceUid
        ) as GPUTextureView;
        colorAttachments.push({
          view: textureView,
          clearValue: clearValue,
          loadOp: renderPass.toClearColorBuffer ? 'clear' : 'load',
          storeOp: 'store',
        });
      }
      renderPassDescriptor.colorAttachments = colorAttachments as GPURenderPassColorAttachment[];
      this.__renderPassEncoder = this.__commandEncoder!.beginRenderPass(renderPassDescriptor);
    } else if (webxrSystem.isWebXRMode && renderPass.isOutputForVr) {
      const colorAttachments: GPURenderPassColorAttachment[] = [];
      for (let i = 0; i < SystemState.xrPoseWebGPU!.views.length; i++) {
        const view = SystemState.xrPoseWebGPU!.views[i];
        const subImage = SystemState.xrGpuBinding.getViewSubImage(SystemState.xrProjectionLayerWebGPU!, view);
        colorAttachments.push({
          view: subImage.colorTexture.createView(subImage.getViewDescriptor()),
          clearValue: clearValue,
          loadOp: renderPass.toClearColorBuffer ? 'clear' : 'load',
          storeOp: 'store',
        });
      }
      const view = SystemState.xrPoseWebGPU!.views[0];
      const subImage = SystemState.xrGpuBinding.getViewSubImage(SystemState.xrProjectionLayerWebGPU!, view);
      const depthStencilAttachment: GPURenderPassDepthStencilAttachment = {
        view: subImage.depthStencilTexture.createView(subImage.getViewDescriptor()),
        depthClearValue: depthClearValue,
        depthLoadOp: renderPass.toClearDepthBuffer ? 'clear' : 'load',
        depthStoreOp: 'store',
      };
      const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: colorAttachments as GPURenderPassColorAttachment[],
        depthStencilAttachment: depthStencilAttachment,
      };
      this.__renderPassEncoder = this.__commandEncoder!.beginRenderPass(renderPassDescriptor);
    } else {
      if (this.__contextCurrentTextureView == null) {
        const context = this.__webGpuDeviceWrapper!.context;
        this.__contextCurrentTextureView = context.getCurrentTexture().createView();
      }
      const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
          {
            view: this.__contextCurrentTextureView,
            clearValue: clearValue,
            loadOp: renderPass.toClearColorBuffer ? 'clear' : 'load',
            storeOp: 'store',
          },
        ],
        depthStencilAttachment: {
          view: this.__systemDepthTextureView!,
          depthClearValue: depthClearValue,
          depthLoadOp: renderPass.toClearDepthBuffer ? 'clear' : 'load',
          depthStoreOp: 'store',
        },
        label: renderPass.uniqueName,
      };
      this.__renderPassEncoder = this.__commandEncoder!.beginRenderPass(renderPassDescriptor);
    }
  }

  private __toClearRenderBundles() {
    if (
      Material.stateVersion !== this.__lastMaterialsUpdateCount ||
      CameraComponent.current !== this.__lastCurrentCameraComponentSid ||
      EntityRepository.updateCount !== this.__lastEntityRepositoryUpdateCount ||
      Primitive.variantUpdateCount !== this.__lastPrimitivesMaterialVariantUpdateCount ||
      MeshRendererComponent.updateCount !== this.__lastMeshRendererComponentsUpdateCount
    ) {
      this.__renderBundles.clear();
      SystemState.webgpuRenderBundleMode = false;
      this.__lastCurrentCameraComponentSid = CameraComponent.current;
      this.__lastMaterialsUpdateCount = Material.stateVersion;
      this.__lastEntityRepositoryUpdateCount = EntityRepository.updateCount;
      this.__lastPrimitivesMaterialVariantUpdateCount = Primitive.variantUpdateCount;
      this.__lastMeshRendererComponentsUpdateCount = MeshRendererComponent.updateCount;
    }
  }

  executeRenderBundle(renderPass: RenderPass) {
    this.__toClearRenderBundles();
    if (renderPass._isChangedSortRenderResult || !Config.cacheWebGpuRenderBundles) {
      this.__renderBundles.clear();
    }

    let renderBundle = this.__renderBundles.get(renderPass.renderPassUID);
    if (renderBundle != null) {
      this.createRenderPassEncoder(renderPass);

      if (this.__renderPassEncoder != null) {
        this.__renderPassEncoder.executeBundles([renderBundle]);
        this.__renderPassEncoder.end();
        this.__renderPassEncoder = undefined;

        return true;
      }
    }

    return false;
  }

  finishRenderBundleEncoder(renderPass: RenderPass) {
    this.createRenderPassEncoder(renderPass);

    if (this.__renderPassEncoder != null && this.__renderBundleEncoder != null) {
      const renderBundle = this.__renderBundleEncoder.finish();
      if (Config.cacheWebGpuRenderBundles) {
        this.__renderBundles.set(renderPass.renderPassUID, renderBundle);
      } else {
        this.__renderBundles.clear();
      }
      this.__renderPassEncoder.executeBundles([renderBundle]);
      this.__renderPassEncoder.end();
      this.__renderBundleEncoder = undefined;
      this.__renderBundleEncoderKey = undefined;
      this.__renderPassEncoder = undefined;
    } else {
      console.log('renderPassEncoder is null');
    }
  }

  getOrCreateRenderPipeline(
    renderPipelineId: string,
    bindGroupId: string,
    primitive: Primitive,
    material: Material,
    renderPass: RenderPass,
    zWrite: boolean,
    _diffuseCubeMap?: CubeTexture | RenderTargetTextureCube,
    _specularCubeMap?: CubeTexture | RenderTargetTextureCube,
    _sheenCubeMap?: CubeTexture | RenderTargetTextureCube
  ): [GPURenderPipeline, boolean] {
    if (this.__webGpuRenderPipelineMap.has(renderPipelineId)) {
      const materialStateVersion = this.__materialStateVersionMap.get(renderPipelineId);
      if (materialStateVersion === material.stateVersion) {
        return [this.__webGpuRenderPipelineMap.get(renderPipelineId)!, false];
      }
    }

    // const width = this.__webGpuDeviceWrapper!.canvas.width;
    // const height = this.__webGpuDeviceWrapper!.canvas.height;
    // const backBufferTextureSize = GlobalDataRepository.getInstance().getValue(
    //   ShaderSemantics.BackBufferTextureSize,
    //   0
    // ) as Vector2;
    // backBufferTextureSize._v[0] = width;
    // backBufferTextureSize._v[1] = height;

    this.__webGpuRenderPipelineMap.delete(renderPipelineId);
    this.__materialStateVersionMap.delete(renderPipelineId);

    // this.__createBindGroup(renderPipelineId, material, diffuseCubeMap, specularCubeMap, sheenCubeMap);

    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    const modules = this.__webGpuResources.get(material.getShaderProgramUid(primitive)) as {
      vsModule: GPUShaderModule;
      fsModule: GPUShaderModule;
    };

    if (modules != null) {
      new Error('Shader Modules is not found');
    }

    const gpuVertexBufferLayouts: GPUVertexBufferLayout[] = [];
    if (!renderPass.isBufferLessRenderingMode()) {
      gpuVertexBufferLayouts.push({
        stepMode: 'instance',
        attributes: [
          {
            shaderLocation: VertexAttribute.Instance.getAttributeSlot(),
            offset: 0,
            format: 'float32x4',
          },
        ],
        arrayStride: 4 * 4,
      });
    }
    primitive.attributeAccessors.forEach((accessor: Accessor, i: number) => {
      const slotIdx = VertexAttribute.toAttributeSlotFromJoinedString(primitive.attributeSemantics[i]);
      const attribute = {
        shaderLocation: slotIdx,
        offset: 0,
        format: (accessor.componentType.webgpu + accessor.compositionType.webgpu) as GPUVertexFormat,
      };
      gpuVertexBufferLayouts.push({
        stepMode: 'vertex',
        arrayStride: primitive.attributeAccessors[i].actualByteStride,
        attributes: [attribute],
      });
    });

    const pipelineLayout = gpuDevice.createPipelineLayout({
      bindGroupLayouts: [
        this.__bindGroupLayoutStorageBuffer!,
        this.__bindGroupLayoutTextureMap.get(bindGroupId)!,
        this.__bindGroupLayoutSamplerMap.get(bindGroupId)!,
        this.__bindGroupLayoutUniformDrawParameters!,
      ],
    });

    let blend: GPUBlendState | undefined;
    if (material.isBlend()) {
      if (material.alphaMode === AlphaMode.Blend) {
        blend = {
          color: {
            srcFactor: material.blendFuncSrcFactor.webgpu as GPUBlendFactor,
            dstFactor: material.blendFuncDstFactor.webgpu as GPUBlendFactor,
            operation: material.blendEquationMode.webgpu as GPUBlendOperation,
          },
          alpha: {
            srcFactor: material.blendFuncAlphaSrcFactor.webgpu as GPUBlendFactor,
            dstFactor: material.blendFuncAlphaDstFactor.webgpu as GPUBlendFactor,
            operation: material.blendEquationModeAlpha.webgpu as GPUBlendOperation,
          },
        };
      }
    }

    const mode = renderPass.isBufferLessRenderingMode()
      ? renderPass._primitiveModeForBufferLessRendering
      : primitive.primitiveMode;
    const topology = mode.getWebGPUTypeStr();
    let stripIndexFormat = undefined;
    if (topology === 'triangle-strip' || topology === 'line-strip') {
      stripIndexFormat = primitive.getIndexBitSize();
    }
    const framebuffer = renderPass.getFramebuffer();
    let targets: GPUColorTargetState[] = [
      {
        // @location(0) in fragment shader
        format: presentationFormat,
        blend,
      },
    ];
    let depthStencilFormat: GPUTextureFormat | undefined = 'depth24plus' as GPUTextureFormat;
    if (framebuffer != null) {
      targets = [];
      for (let colorAttachment of framebuffer.colorAttachments) {
        const texture = this.__webGpuResources.get(colorAttachment._textureResourceUid) as GPUTexture;
        targets.push({
          format: texture.format,
          blend,
          writeMask: this.setColorWriteMask(material),
        });
      }
      if (framebuffer.depthAttachment != null) {
        const depthTexture = this.__webGpuResources.get(framebuffer.depthAttachment._textureResourceUid) as GPUTexture;
        depthStencilFormat = depthTexture.format;
      } else {
        depthStencilFormat = undefined;
      }
    }

    const pipeline = gpuDevice.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: modules.vsModule,
        entryPoint: 'main',
        buffers: gpuVertexBufferLayouts,
      },
      fragment: {
        module: modules.fsModule,
        entryPoint: 'main',
        targets: targets,
      },
      primitive: {
        topology: topology as GPUPrimitiveTopology,
        stripIndexFormat: stripIndexFormat,
        frontFace: material.cullFrontFaceCCW ? 'ccw' : 'cw',
        cullMode: material.cullFace ? (material.cullFaceBack ? 'back' : 'front') : 'none',
      },
      depthStencil:
        depthStencilFormat == null
          ? undefined
          : {
              depthWriteEnabled: zWrite,
              depthCompare: renderPass.isDepthTest ? 'less' : 'always',
              format: depthStencilFormat,
            },
      multisample: {
        count:
          renderPass.getResolveFramebuffer() != null
            ? (renderPass.getFramebuffer()!.colorAttachments[0] as RenderBuffer).sampleCount
            : 1,
      },
    });

    this.__webGpuRenderPipelineMap.set(renderPipelineId, pipeline);
    this.__materialStateVersionMap.set(renderPipelineId, material.stateVersion);

    return [pipeline, true];
  }

  /**
   * Submits all recorded commands to the GPU queue and resets the command encoder.
   * This method must be called to execute any recorded rendering commands.
   */
  flush() {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    gpuDevice.queue.submit([this.__commandEncoder!.finish()]);
    this.__commandEncoder = gpuDevice.createCommandEncoder();

    if (this.__contextCurrentTextureView != null) {
      this.__contextCurrentTextureView = undefined;
    }
  }

  setColorWriteMask(material: Material): GPUColorWriteFlags {
    let flags = 0;
    if (material.colorWriteMask[0]) {
      flags |= 0x01;
    }
    if (material.colorWriteMask[1]) {
      flags |= 0x02;
    }
    if (material.colorWriteMask[2]) {
      flags |= 0x04;
    }
    if (material.colorWriteMask[3]) {
      flags |= 0x08;
    }
    return flags;
  }

  /**
   * Create Cube Texture from image files.
   * @param baseUri the base uri to load images;
   * @param mipLevelCount the number of mip levels (include root level). if no mipmap, the value should be 1;
   * @returns the WebGLResourceHandle for the generated Cube Texture
   */
  async createCubeTextureFromFiles(
    baseUri: string,
    mipLevelCount: Count,
    isNamePosNeg: boolean,
    hdriFormat: HdriFormatEnum
  ) {
    const imageArgs: Array<{
      posX: DirectTextureData;
      negX: DirectTextureData;
      posY: DirectTextureData;
      negY: DirectTextureData;
      posZ: DirectTextureData;
      negZ: DirectTextureData;
    }> = [];
    let width = 0;
    let height = 0;
    for (let i = 0; i < mipLevelCount; i++) {
      const loadOneLevel = () => {
        return new Promise<HTMLImageElement[] | HTMLCanvasElement[]>((resolve, reject) => {
          let loadedCount = 0;
          const images: HTMLImageElement[] = [];
          let extension = '.jpg';
          if (hdriFormat === HdriFormat.HDR_LINEAR) {
            extension = '.hdr';
          } else if (hdriFormat === HdriFormat.RGBE_PNG) {
            extension = '.RGBE.PNG';
          }

          let posX = '_right_';
          let negX = '_left_';
          let posY = '_top_';
          let negY = '_bottom_';
          let posZ = '_front_';
          let negZ = '_back_';
          if (isNamePosNeg) {
            posX = '_posx_';
            negX = '_negx_';
            posY = '_posy_';
            negY = '_negy_';
            posZ = '_posz_';
            negZ = '_negz_';
          }

          const faces = [
            [baseUri + posX + i + extension, 'posX'],
            [baseUri + negX + i + extension, 'negX'],
            [baseUri + posY + i + extension, 'posY'],
            [baseUri + negY + i + extension, 'negY'],
            [baseUri + posZ + i + extension, 'posZ'],
            [baseUri + negZ + i + extension, 'negZ'],
          ];
          for (let j = 0; j < faces.length; j++) {
            const face = faces[j][1];
            let image: any;
            if (hdriFormat === HdriFormat.HDR_LINEAR || hdriFormat === HdriFormat.RGB9_E5_PNG) {
              image = new HDRImage();
            } else {
              image = new Image();
            }
            image.hdriFormat = hdriFormat;

            (image as any).side = face;
            (image as any).uri = faces[j][0];
            image.crossOrigin = 'Anonymous';
            image.onload = () => {
              loadedCount++;
              images.push(image);
              if (loadedCount === 6) {
                resolve(images);
              }
            };
            image.onerror = () => {
              reject((image as any).uri);
            };
            image.src = faces[j][0];
          }
        });
      };

      let images: HTMLImageElement[] | HTMLCanvasElement[];
      try {
        images = await loadOneLevel();
      } catch (_e) {
        // Try again once
        try {
          images = await loadOneLevel();
        } catch (uri) {
          // Give up
          Logger.error(`failed to load ${uri}`);
        }
      }
      const imageBitmaps: ImageBitmap[] | HTMLCanvasElement[] = [];
      for (const image of images!) {
        if ((image as any).hdriFormat === HdriFormat.HDR_LINEAR) {
          imageBitmaps.push(image as any);
        } else {
          await (image as any).decode();
          const imageBitmap = await createImageBitmap(image);
          imageBitmaps.push(imageBitmap as any);
          (imageBitmap as any).side = (image as any).side;
        }
      }
      const imageObj: {
        posX?: DirectTextureData;
        negX?: DirectTextureData;
        posY?: DirectTextureData;
        negY?: DirectTextureData;
        posZ?: DirectTextureData;
        negZ?: DirectTextureData;
      } = {};
      for (const imageBitmap of imageBitmaps) {
        switch ((imageBitmap as any).side) {
          case 'posX':
            imageObj.posX = imageBitmap;
            break;
          case 'posY':
            imageObj.posY = imageBitmap;
            break;
          case 'posZ':
            imageObj.posZ = imageBitmap;
            break;
          case 'negX':
            imageObj.negX = imageBitmap;
            break;
          case 'negY':
            imageObj.negY = imageBitmap;
            break;
          case 'negZ':
            imageObj.negZ = imageBitmap;
            break;
        }
        if (i === 0) {
          width = imageBitmap.width;
          height = imageBitmap.height;
        }
      }
      imageArgs.push(
        imageObj as {
          posX: DirectTextureData;
          negX: DirectTextureData;
          posY: DirectTextureData;
          negY: DirectTextureData;
          posZ: DirectTextureData;
          negZ: DirectTextureData;
        }
      );
    }
    return this.createCubeTexture(mipLevelCount, imageArgs, width, height);
  }

  /**
   * create a CubeTexture
   *
   * @param mipLevelCount
   * @param images
   * @param width
   * @param height
   * @returns resource handle
   */
  createCubeTexture(
    mipLevelCount: Count,
    images: Array<{
      posX: DirectTextureData;
      negX: DirectTextureData;
      posY: DirectTextureData;
      negY: DirectTextureData;
      posZ: DirectTextureData;
      negZ: DirectTextureData;
    }>,
    width: Size,
    height: Size
  ): [number, Sampler] {
    const mipmaps: (ImageBitmap | HTMLCanvasElement)[][] = [];
    for (let i = 0; i < mipLevelCount; i++) {
      const imageBitmaps: (ImageBitmap | HTMLCanvasElement)[] = [];
      if (images[i].posX instanceof ImageBitmap || images[0].posX instanceof HTMLCanvasElement) {
        imageBitmaps.push(images[i].posX as any);
        imageBitmaps.push(images[i].negX as any);
        imageBitmaps.push(images[i].posY as any);
        imageBitmaps.push(images[i].negY as any);
        imageBitmaps.push(images[i].posZ as any);
        imageBitmaps.push(images[i].negZ as any);
      }
      mipmaps.push(imageBitmaps);
    }
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const cubemapTexture = gpuDevice.createTexture({
      dimension: '2d',
      size: [width, height, 6],
      format: (mipmaps[0][0] as any).hdriFormat === HdriFormat.HDR_LINEAR ? 'rgba32float' : 'rgba8unorm',
      mipLevelCount: mipLevelCount,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });

    for (let i = 0; i < mipLevelCount; i++) {
      for (let j = 0; j < mipmaps[i].length; j++) {
        const imageBitmap = mipmaps[i][j];
        if ((imageBitmap as any).hdriFormat === HdriFormat.HDR_LINEAR) {
          // HDR image is 3 channels, so we need to convert it to 4 channels
          const newFloat323Array = new Float32Array(imageBitmap.width * imageBitmap.height * 4);
          const dataFloat = (imageBitmap as any).dataFloat;
          const size = imageBitmap.width * imageBitmap.height;
          for (let k = 0; k < size; k++) {
            newFloat323Array[k * 4] = dataFloat[k * 3];
            newFloat323Array[k * 4 + 1] = dataFloat[k * 3 + 1];
            newFloat323Array[k * 4 + 2] = dataFloat[k * 3 + 2];
            newFloat323Array[k * 4 + 3] = 1.0;
          }

          // Align the row data size to multiple of 256 bytes
          const bytesPerRow = imageBitmap.width * 4 * Float32Array.BYTES_PER_ELEMENT;
          const paddedBytesPerRow = Math.ceil(bytesPerRow / 256) * 256; // 256-byte alignment (GPUImageCopyBuffer.bytesPerRow). See: https://www.w3.org/TR/webgpu/#gpuimagecopybuffer
          const paddedRowSize = paddedBytesPerRow / Float32Array.BYTES_PER_ELEMENT;
          const paddedFloatData = new Float32Array(paddedRowSize * imageBitmap.height);
          for (let y = 0; y < imageBitmap.height; y++) {
            const sourceStart = y * imageBitmap.width * 4;
            const sourceEnd = sourceStart + imageBitmap.width * 4;
            const destStart = y * paddedRowSize;
            paddedFloatData.set(newFloat323Array.subarray(sourceStart, sourceEnd), destStart);
          }

          const buffer = gpuDevice.createBuffer({
            size: paddedFloatData.byteLength,
            usage: GPUBufferUsage.COPY_SRC,
            mappedAtCreation: true,
          });

          new Float32Array(buffer.getMappedRange()).set(paddedFloatData);
          buffer.unmap();

          const commandEncoder = gpuDevice.createCommandEncoder();

          commandEncoder.copyBufferToTexture(
            {
              buffer: buffer,
              bytesPerRow: paddedBytesPerRow,
              rowsPerImage: imageBitmap.height,
            },
            { texture: cubemapTexture, origin: [0, 0, j], mipLevel: i },
            [imageBitmap.width, imageBitmap.height, 1]
          );

          const commandBuffer = commandEncoder.finish();
          gpuDevice.queue.submit([commandBuffer]);
        } else {
          gpuDevice.queue.copyExternalImageToTexture(
            { source: imageBitmap },
            { texture: cubemapTexture, origin: [0, 0, j], mipLevel: i },
            [imageBitmap.width, imageBitmap.height, 1]
          );
        }
      }
    }

    const handle = this.__registerResource(cubemapTexture);
    const wrapS = TextureParameter.Repeat;
    const wrapT = TextureParameter.Repeat;
    const minFilter = mipLevelCount === 1 ? TextureParameter.Linear : TextureParameter.LinearMipmapLinear;
    const magFilter = TextureParameter.Linear;

    const sampler = new Sampler({ wrapS, wrapT, minFilter, magFilter, anisotropy: false });
    sampler.create();

    return [handle, sampler];
  }

  /**
   * create a TextureArray
   * @param width
   * @param height
   * @param arrayLength
   * @param mipLevelCount
   * @param internalFormat
   * @param format
   * @param type
   * @returns texture handle
   */
  createTextureArray(
    width: Size,
    height: Size,
    arrayLength: Size,
    mipLevelCount: Size,
    internalFormat: TextureFormatEnum,
    _format: PixelFormatEnum,
    _type: ComponentTypeEnum,
    imageData: TypedArray
  ): WebGPUResourceHandle {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const textureDescriptor: GPUTextureDescriptor = {
      size: [width, height, arrayLength],
      format: internalFormat.webgpu as GPUTextureFormat,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      dimension: '2d',
      mipLevelCount: mipLevelCount,
    };

    const gpuTexture = gpuDevice.createTexture(textureDescriptor);

    const imageData2 = new ImageData(new Uint8ClampedArray(imageData.buffer), width, height);

    for (let i = 0; i < arrayLength; i++) {
      gpuDevice.queue.copyExternalImageToTexture({ source: imageData2 }, { texture: gpuTexture, origin: [0, 0, i] }, [
        width,
        height,
      ]);
    }

    const textureHandle = this.__registerResource(gpuTexture);
    return textureHandle;
  }

  /**
   * Creates a storage buffer from a Float32Array and registers it as a WebGPU resource.
   * Storage buffers are used for storing large amounts of data accessible from shaders.
   *
   * @param inputArray - The Float32Array containing the data to store
   * @returns Handle to the created storage buffer resource
   */
  createStorageBuffer(inputArray: Float32Array) {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const storageBuffer = gpuDevice.createBuffer({
      size: inputArray.byteLength,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
    });
    gpuDevice.queue.writeBuffer(storageBuffer, 0, inputArray);

    this.__storageBuffer = storageBuffer;

    const storageBufferHandle = this.__registerResource(storageBuffer);

    return storageBufferHandle;
  }

  /**
   * Updates an existing storage buffer with new data.
   * Only updates the specified number of components to optimize data transfer.
   *
   * @param storageBufferHandle - Handle to the storage buffer to update
   * @param inputArray - New data to write to the buffer
   * @param updateComponentSize - Number of components to update
   */
  updateStorageBuffer(storageBufferHandle: WebGPUResourceHandle, inputArray: Float32Array, updateComponentSize: Count) {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const storageBuffer = this.__webGpuResources.get(storageBufferHandle) as GPUBuffer;
    gpuDevice.queue.writeBuffer(storageBuffer, 0, inputArray, 0, updateComponentSize);
  }

  /**
   * Updates a portion of a storage buffer with new data at a specific offset.
   * This allows for efficient partial updates of large storage buffers.
   *
   * @param storageBufferHandle - Handle to the storage buffer to update
   * @param inputArray - New data to write to the buffer
   * @param offsetOfStorageBufferInByte - Byte offset in the storage buffer where to start writing
   * @param offsetOfInputArrayInElement - Element offset in the input array where to start reading
   * @param updateComponentSize - Number of components to update
   */
  updateStorageBufferPartially(
    storageBufferHandle: WebGPUResourceHandle,
    inputArray: Float32Array,
    offsetOfStorageBufferInByte: Count,
    offsetOfInputArrayInElement: Count,
    updateComponentSize: Count
  ) {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const storageBuffer = this.__webGpuResources.get(storageBufferHandle) as GPUBuffer;
    gpuDevice.queue.writeBuffer(
      storageBuffer,
      offsetOfStorageBufferInByte,
      inputArray,
      offsetOfInputArrayInElement,
      updateComponentSize
    );
  }

  createStorageBlendShapeBuffer(inputArray: Float32Array) {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const storageBuffer = gpuDevice.createBuffer({
      size: inputArray.byteLength,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
    });
    gpuDevice.queue.writeBuffer(storageBuffer, 0, inputArray);

    this.__storageBlendShapeBuffer = storageBuffer;

    const storageBufferHandle = this.__registerResource(storageBuffer);

    return storageBufferHandle;
  }

  updateStorageBlendShapeBuffer(
    storageBufferHandle: WebGPUResourceHandle,
    inputArray: Float32Array,
    updateComponentSize: Count
  ) {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const storageBuffer = this.__webGpuResources.get(storageBufferHandle) as GPUBuffer;
    gpuDevice.queue.writeBuffer(storageBuffer, 0, inputArray, 0, updateComponentSize);
  }

  createBindGroupLayoutForDrawParameters() {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    {
      const bindGroupLayoutDesc: GPUBindGroupLayoutDescriptor = {
        entries: [
          {
            binding: 0,
            buffer: {
              type: 'uniform',
            },
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          },
        ],
      };
      const bindGroupLayout = gpuDevice.createBindGroupLayout(bindGroupLayoutDesc);
      this.__bindGroupLayoutUniformDrawParameters = bindGroupLayout;
    }
  }

  updateUniformBufferForDrawParameters(
    identifier: DRAW_PARAMETERS_IDENTIFIER,
    materialSid: Index,
    cameraSID: Index,
    currentPrimitiveIdx: Index,
    morphTargetNumber: Count
  ) {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    let uniformBuffer = this.__uniformDrawParametersBuffers.get(identifier);
    if (uniformBuffer == null) {
      uniformBuffer = gpuDevice.createBuffer({
        size: 4 /* uint32 */ * 4 /* 4 elements */,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
      });
      this.__uniformDrawParametersBuffers.set(identifier, uniformBuffer);

      const bindGroup = gpuDevice.createBindGroup({
        layout: this.__bindGroupLayoutUniformDrawParameters!,
        entries: [
          {
            binding: 0,
            resource: {
              buffer: uniformBuffer,
            },
          },
        ],
      });
      this.__bindGroupsUniformDrawParameters.set(identifier, bindGroup);
    }

    WebGpuResourceRepository.__drawParametersUint32Array[0] = materialSid;
    WebGpuResourceRepository.__drawParametersUint32Array[1] = cameraSID;
    WebGpuResourceRepository.__drawParametersUint32Array[2] = currentPrimitiveIdx;
    WebGpuResourceRepository.__drawParametersUint32Array[3] = morphTargetNumber;
    gpuDevice.queue.writeBuffer(uniformBuffer, 0, WebGpuResourceRepository.__drawParametersUint32Array);
  }

  createUniformMorphOffsetsBuffer() {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const inputArray = new Uint32Array(
      Math.ceil((Config.maxMorphPrimitiveNumberInWebGPU * Config.maxMorphTargetNumber) / 4) * 4
    );
    const uniformBuffer = gpuDevice.createBuffer({
      size: inputArray.byteLength,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });
    gpuDevice.queue.writeBuffer(uniformBuffer, 0, inputArray);

    this.__uniformMorphOffsetsBuffer = uniformBuffer;

    const uniformBufferHandle = this.__registerResource(uniformBuffer);

    return uniformBufferHandle;
  }

  updateUniformMorphOffsetsBuffer(inputArray: Uint32Array, elementNum: Count) {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    if (this.__uniformMorphOffsetsBuffer == null) {
      throw new Error('Not found uniform morph buffer.');
    }
    gpuDevice.queue.writeBuffer(this.__uniformMorphOffsetsBuffer, 0, inputArray, 0, elementNum);
  }

  createUniformMorphWeightsBuffer() {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const inputArray = new Float32Array(
      Math.ceil((Config.maxMorphPrimitiveNumberInWebGPU * Config.maxMorphTargetNumber) / 4) * 4
    );
    const uniformBuffer = gpuDevice.createBuffer({
      size: inputArray.byteLength,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });
    gpuDevice.queue.writeBuffer(uniformBuffer, 0, inputArray);

    this.__uniformMorphWeightsBuffer = uniformBuffer;

    const uniformBufferHandle = this.__registerResource(uniformBuffer);

    return uniformBufferHandle;
  }

  updateUniformMorphWeightsBuffer(inputArray: Float32Array, elementNum: Count) {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    if (this.__uniformMorphWeightsBuffer == null) {
      throw new Error('Not found uniform morph buffer.');
    }
    gpuDevice.queue.writeBuffer(this.__uniformMorphWeightsBuffer, 0, inputArray, 0, elementNum);
  }

  private __createBindGroup(
    bindGroupId: string,
    material: Material,
    diffuseCubeMap?: CubeTexture | RenderTargetTextureCube,
    specularCubeMap?: CubeTexture | RenderTargetTextureCube,
    sheenCubeMap?: CubeTexture | RenderTargetTextureCube
  ) {
    this.__bindGroupTextureMap.delete(bindGroupId);
    this.__bindGroupLayoutTextureMap.delete(bindGroupId);
    this.__bindGroupSamplerMap.delete(bindGroupId);
    this.__bindGroupLayoutSamplerMap.delete(bindGroupId);

    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;

    // Group 0 (Storage Buffer, UniformMorph Buffer)
    {
      const entries: GPUBindGroupEntry[] = [];
      const bindGroupLayoutEntries: GPUBindGroupLayoutEntry[] = [];
      if (this.__storageBuffer != null) {
        entries.push({
          binding: 0,
          resource: {
            buffer: this.__storageBuffer,
          },
        });
        bindGroupLayoutEntries.push({
          binding: 0,
          buffer: {
            type: 'read-only-storage',
          },
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        });
      }
      if (this.__storageBlendShapeBuffer != null) {
        entries.push({
          binding: 1,
          resource: {
            buffer: this.__storageBlendShapeBuffer,
          },
        });
        bindGroupLayoutEntries.push({
          binding: 1,
          buffer: {
            type: 'read-only-storage',
          },
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        });
      } else {
        const dummyBuffer = gpuDevice.createBuffer({
          size: 16,
          usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
        });
        entries.push({
          binding: 1,
          resource: {
            buffer: dummyBuffer,
          },
        });
        bindGroupLayoutEntries.push({
          binding: 1,
          buffer: {
            type: 'read-only-storage',
          },
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        });
      }

      if (this.__uniformMorphOffsetsBuffer != null) {
        entries.push({
          binding: 2,
          resource: {
            buffer: this.__uniformMorphOffsetsBuffer,
          },
        });
        bindGroupLayoutEntries.push({
          binding: 2,
          buffer: {
            type: 'uniform',
          },
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        });
      }
      if (this.__uniformMorphWeightsBuffer != null) {
        entries.push({
          binding: 3,
          resource: {
            buffer: this.__uniformMorphWeightsBuffer,
          },
        });
        bindGroupLayoutEntries.push({
          binding: 3,
          buffer: {
            type: 'uniform',
          },
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        });
      }

      const bindGroupLayoutDesc: GPUBindGroupLayoutDescriptor = {
        entries: bindGroupLayoutEntries,
      };
      const bindGroupLayout = gpuDevice.createBindGroupLayout(bindGroupLayoutDesc);

      const uniformBindGroup = gpuDevice.createBindGroup({
        layout: bindGroupLayout,
        entries: entries,
      });

      this.__bindGroupStorageBuffer = uniformBindGroup;
      this.__bindGroupLayoutStorageBuffer = bindGroupLayout;
    }

    // Group 1 (Texture), Group 2 (Sampler)
    {
      const entriesForTexture: GPUBindGroupEntry[] = [];
      const bindGroupLayoutEntriesForTexture: GPUBindGroupLayoutEntry[] = [];
      const entriesForSampler: GPUBindGroupEntry[] = [];
      const bindGroupLayoutEntriesForSampler: GPUBindGroupLayoutEntry[] = [];
      material._autoTextureFieldVariablesOnly.forEach(value => {
        const info = value.info;
        if (
          info.semantic === 'diffuseEnvTexture' ||
          info.semantic === 'specularEnvTexture' ||
          info.semantic === 'sheenEnvTexture'
        ) {
          return;
        }

        if (CompositionType.isTexture(info.compositionType)) {
          const slot = value.value[0];
          const texture = value.value[1] as AbstractTexture;
          const sampler = value.value[2] as Sampler;

          // Texture
          let type = '2d' as GPUTextureViewDimension;
          if (texture instanceof CubeTexture || texture instanceof RenderTargetTextureCube) {
            type = 'cube';
          } else if (texture instanceof TextureArray || texture instanceof RenderTargetTexture2DArray) {
            type = '2d-array';
          }

          let gpuTextureView = this.__webGpuResources.get(texture._textureViewResourceUid) as GPUTextureView;
          if (gpuTextureView == null) {
            if (texture instanceof CubeTexture || texture instanceof RenderTargetTextureCube) {
              const gpuTexture = this.__webGpuResources.get(dummyBlackCubeTexture._textureResourceUid) as GPUTexture;
              gpuTextureView = gpuTexture.createView({ dimension: 'cube' });
            } else if (texture instanceof TextureArray || texture instanceof RenderTargetTexture2DArray) {
              const gpuTexture = this.__webGpuResources.get(dummyWhiteTexture._textureResourceUid) as GPUTexture;
              gpuTextureView = gpuTexture.createView({ dimension: '2d-array' });
            } else {
              const gpuTexture = this.__webGpuResources.get(dummyWhiteTexture._textureResourceUid) as GPUTexture;
              gpuTextureView = gpuTexture.createView();
            }
          }
          entriesForTexture.push({
            binding: slot,
            resource: gpuTextureView,
          });
          bindGroupLayoutEntriesForTexture.push({
            binding: slot,
            texture: {
              viewDimension: type,
            },
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          });

          // Sampler
          if (!sampler.created) {
            sampler.create();
          }
          const gpuSampler = this.__webGpuResources.get(sampler._samplerResourceUid) as GPUSampler;
          entriesForSampler.push({
            binding: slot,
            resource: gpuSampler,
          });
          bindGroupLayoutEntriesForSampler.push({
            binding: slot,
            sampler: {
              type: 'filtering',
            },
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          });
        }
      });

      // Diffuse IBL
      const diffuseEnvValue = material.getTextureParameter(ShaderSemantics.DiffuseEnvTexture.str);
      if (Is.exist(diffuseEnvValue)) {
        const diffuseEnvSlot = diffuseEnvValue[0];
        const diffuseCubeTextureView = this.__webGpuResources.get(
          Is.exist(diffuseCubeMap) ? diffuseCubeMap._textureViewResourceUid : -1
        ) as GPUTextureView | undefined;
        if (Is.exist(diffuseCubeTextureView)) {
          entriesForTexture.push({
            binding: diffuseEnvSlot,
            resource: diffuseCubeTextureView,
          });
        } else {
          const dummyCubeTextureView = this.__webGpuResources.get(
            dummyBlackCubeTexture._textureViewResourceUid
          ) as GPUTextureView;
          entriesForTexture.push({
            binding: diffuseEnvSlot,
            resource: dummyCubeTextureView,
          });
        }
        bindGroupLayoutEntriesForTexture.push({
          binding: diffuseEnvSlot,
          texture: {
            viewDimension: 'cube',
          },
          visibility: GPUShaderStage.FRAGMENT,
        });
        const diffuseCubeSampler = this.__webGpuResources.get(
          Is.exist(diffuseCubeMap) ? diffuseCubeMap._samplerResourceUid : -1
        ) as GPUSampler | undefined;
        if (Is.exist(diffuseCubeSampler)) {
          entriesForSampler.push({
            binding: diffuseEnvSlot,
            resource: diffuseCubeSampler,
          });
        } else {
          const dummyCubeSampler = this.__webGpuResources.get(dummyBlackCubeTexture._samplerResourceUid) as GPUSampler;
          entriesForSampler.push({
            binding: diffuseEnvSlot,
            resource: dummyCubeSampler,
          });
        }
        bindGroupLayoutEntriesForSampler.push({
          binding: diffuseEnvSlot,
          sampler: {
            type: 'filtering',
          },
          visibility: GPUShaderStage.FRAGMENT,
        });
      }

      // Specular IBL
      const specularEnvValue = material.getTextureParameter(ShaderSemantics.SpecularEnvTexture.str);
      if (Is.exist(specularEnvValue)) {
        const specularEnvSlot = specularEnvValue[0];
        const specularCubeTextureView = this.__webGpuResources.get(
          Is.exist(specularCubeMap) ? specularCubeMap._textureViewResourceUid : -1
        ) as GPUTextureView | undefined;
        if (Is.exist(specularCubeTextureView)) {
          entriesForTexture.push({
            binding: specularEnvSlot,
            resource: specularCubeTextureView,
          });
        } else {
          const dummyCubeTextureView = this.__webGpuResources.get(
            dummyBlackCubeTexture._textureViewResourceUid
          ) as GPUTextureView;
          entriesForTexture.push({
            binding: specularEnvSlot,
            resource: dummyCubeTextureView,
          });
        }
        bindGroupLayoutEntriesForTexture.push({
          binding: specularEnvSlot,
          texture: {
            viewDimension: 'cube',
          },
          visibility: GPUShaderStage.FRAGMENT,
        });
        const specularCubeSampler = this.__webGpuResources.get(
          Is.exist(specularCubeMap) ? specularCubeMap._samplerResourceUid : -1
        ) as GPUSampler | undefined;
        if (Is.exist(specularCubeSampler)) {
          entriesForSampler.push({
            binding: specularEnvSlot,
            resource: specularCubeSampler,
          });
        } else {
          const dummyCubeSampler = this.__webGpuResources.get(dummyBlackCubeTexture._samplerResourceUid) as GPUSampler;
          entriesForSampler.push({
            binding: specularEnvSlot,
            resource: dummyCubeSampler,
          });
        }
        bindGroupLayoutEntriesForSampler.push({
          binding: specularEnvSlot,
          sampler: {
            type: 'filtering',
          },
          visibility: GPUShaderStage.FRAGMENT,
        });
      }

      // Sheen IBL
      const sheenEnvValue = material.getTextureParameter(ShaderSemantics.SheenEnvTexture.str);
      if (Is.exist(sheenEnvValue)) {
        const sheenEnvSlot = sheenEnvValue[0];
        let sheenCubeTextureView: GPUTextureView | undefined;
        if (Is.exist(sheenCubeMap)) {
          sheenCubeTextureView = this.__webGpuResources.get(sheenCubeMap._textureViewResourceUid) as
            | GPUTextureView
            | undefined;
        } else if (Is.exist(specularCubeMap)) {
          // if sheenCubeMap is not exist, use specularCubeMap instead as sheenCubeMap
          sheenCubeTextureView = this.__webGpuResources.get(specularCubeMap._textureViewResourceUid) as
            | GPUTextureView
            | undefined;
        }
        if (Is.exist(sheenCubeTextureView)) {
          entriesForTexture.push({
            binding: sheenEnvSlot,
            resource: sheenCubeTextureView,
          });
        } else {
          const dummyCubeTextureView = this.__webGpuResources.get(
            dummyBlackCubeTexture._textureViewResourceUid
          ) as GPUTextureView;
          entriesForTexture.push({
            binding: sheenEnvSlot,
            resource: dummyCubeTextureView,
          });
        }
        bindGroupLayoutEntriesForTexture.push({
          binding: sheenEnvSlot,
          texture: {
            viewDimension: 'cube',
          },
          visibility: GPUShaderStage.FRAGMENT,
        });
        let sheenCubeSampler: GPUSampler | undefined;
        if (Is.exist(sheenCubeMap)) {
          sheenCubeSampler = this.__webGpuResources.get(sheenCubeMap._samplerResourceUid) as GPUSampler | undefined;
        } else if (Is.exist(specularCubeMap)) {
          // if sheenCubeMap is not exist, use specularCubeMap instead as sheenCubeMap
          sheenCubeSampler = this.__webGpuResources.get(specularCubeMap._samplerResourceUid) as GPUSampler | undefined;
        }
        if (Is.exist(sheenCubeSampler)) {
          entriesForSampler.push({
            binding: sheenEnvSlot,
            resource: sheenCubeSampler,
          });
        } else {
          const dummyCubeSampler = this.__webGpuResources.get(dummyBlackCubeTexture._samplerResourceUid) as GPUSampler;
          entriesForSampler.push({
            binding: sheenEnvSlot,
            resource: dummyCubeSampler,
          });
        }
        bindGroupLayoutEntriesForSampler.push({
          binding: sheenEnvSlot,
          sampler: {
            type: 'filtering',
          },
          visibility: GPUShaderStage.FRAGMENT,
        });
      }

      // Texture
      const bindGroupLayoutDescForTexture: GPUBindGroupLayoutDescriptor = {
        entries: bindGroupLayoutEntriesForTexture,
      };
      const bindGroupLayoutForTexture = gpuDevice.createBindGroupLayout(bindGroupLayoutDescForTexture);
      const bindGroupForTexture = gpuDevice.createBindGroup({
        layout: bindGroupLayoutForTexture,
        entries: entriesForTexture,
      });
      this.__bindGroupTextureMap.set(bindGroupId, bindGroupForTexture);
      this.__bindGroupLayoutTextureMap.set(bindGroupId, bindGroupLayoutForTexture);

      // Sampler
      const bindGroupLayoutDescForSampler: GPUBindGroupLayoutDescriptor = {
        entries: bindGroupLayoutEntriesForSampler,
      };
      const bindGroupLayoutForSampler = gpuDevice.createBindGroupLayout(bindGroupLayoutDescForSampler);
      const bindGroupForSampler = gpuDevice.createBindGroup({
        layout: bindGroupLayoutForSampler,
        entries: entriesForSampler,
      });
      this.__bindGroupSamplerMap.set(bindGroupId, bindGroupForSampler);
      this.__bindGroupLayoutSamplerMap.set(bindGroupId, bindGroupLayoutForSampler);
    }
  }

  /**
   * create a Texture
   * @param imageData
   * @param param1
   * @returns
   */
  async createTextureFromHTMLImageElement(
    imageData: HTMLImageElement,
    {
      internalFormat,
      width,
      height,
      generateMipmap,
    }: {
      internalFormat: TextureParameterEnum;
      width: Size;
      height: Size;
      generateMipmap: boolean;
    }
  ): Promise<WebGPUResourceHandle> {
    imageData.crossOrigin = 'Anonymous';

    const textureHandle = await this.__createTextureInner(width, height, internalFormat, generateMipmap, imageData);

    return textureHandle;
  }

  /**
   * create CompressedTextureFromBasis
   * @param basisFile
   * @returns
   */
  createCompressedTextureFromBasis(basisFile: BasisFile): WebGPUResourceHandle {
    let basisCompressionType: BasisCompressionTypeEnum;
    let compressionType: GPUTextureFormat | undefined;
    const mipmapDepth = basisFile.getNumLevels(0);
    const width = basisFile.getImageWidth(0, 0);
    const height = basisFile.getImageHeight(0, 0);

    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const gpuAdapter = this.__webGpuDeviceWrapper!.gpuAdapter;

    // デバッグ情報：サポートされている圧縮フォーマットを確認
    const s3tc = gpuAdapter.features.has('texture-compression-bc');
    const etc2 = gpuAdapter.features.has('texture-compression-etc2');
    const astc = gpuAdapter.features.has('texture-compression-astc');

    if (s3tc) {
      basisCompressionType = BasisCompressionType.BC3;
      compressionType = 'bc3-rgba-unorm';
    } else if (etc2) {
      basisCompressionType = BasisCompressionType.ETC2;
      compressionType = 'etc2-rgba8unorm';
    } else if (astc) {
      basisCompressionType = BasisCompressionType.ASTC;
      compressionType = 'astc-4x4-unorm';
    }

    if (!compressionType) {
      console.warn('No supported compression format found, falling back to uncompressed');
      throw new Error('No supported compression format found');
    }

    const textureDescriptor: GPUTextureDescriptor = {
      size: [width, height, 1],
      format: compressionType,
      mipLevelCount: mipmapDepth,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    };

    const gpuTexture = gpuDevice.createTexture(textureDescriptor);

    // Retrieve block information for the compressed format
    let blockInfo = { byteSize: 16, width: 4, height: 4 }; // デフォルト値
    if (compressionType === 'bc1-rgba-unorm') {
      blockInfo = { byteSize: 8, width: 4, height: 4 };
    } else if (compressionType === 'bc3-rgba-unorm' || compressionType === 'astc-4x4-unorm') {
      blockInfo = { byteSize: 16, width: 4, height: 4 };
    } else if (compressionType === 'etc2-rgba8unorm') {
      blockInfo = { byteSize: 16, width: 4, height: 4 };
    } else if (compressionType === 'etc2-rgb8unorm') {
      blockInfo = { byteSize: 8, width: 4, height: 4 };
    }

    for (let i = 0; i < mipmapDepth; i++) {
      const mipWidth = basisFile.getImageWidth(0, i);
      const mipHeight = basisFile.getImageHeight(0, i);
      const textureSource = this.decodeBasisImage(basisFile, basisCompressionType!, 0, i);

      // Calculate the number of blocks for the compressed texture (minimum 1 block)
      const blocksWide = Math.max(1, Math.ceil(mipWidth / blockInfo.width));
      const blocksHigh = Math.max(1, Math.ceil(mipHeight / blockInfo.height));

      // For compressed textures in WebGPU, bytesPerRow must be a multiple of 256 bytes
      const unalignedBytesPerRow = blocksWide * blockInfo.byteSize;
      const bytesPerRow = Math.ceil(unalignedBytesPerRow / 256) * 256;

      // Check if data needs to be padded
      let compressedTextureData: Uint8Array;
      const expectedDataSize = bytesPerRow * blocksHigh;

      if (bytesPerRow !== unalignedBytesPerRow || textureSource.length < expectedDataSize) {
        // If padding is needed or the actual data size is smaller than expected
        const paddedData = new Uint8Array(expectedDataSize);

        if (textureSource.length > 0) {
          // If actual data exists, copy it row by row
          const actualRowsAvailable = Math.floor(textureSource.length / unalignedBytesPerRow);
          for (let row = 0; row < Math.min(blocksHigh, actualRowsAvailable); row++) {
            const srcOffset = row * unalignedBytesPerRow;
            const dstOffset = row * bytesPerRow;
            const copyLength = Math.min(unalignedBytesPerRow, textureSource.length - srcOffset);
            if (copyLength > 0) {
              paddedData.set(textureSource.subarray(srcOffset, srcOffset + copyLength), dstOffset);
            }
          }
        }
        compressedTextureData = paddedData;
      } else {
        compressedTextureData = textureSource;
      }

      gpuDevice.queue.writeTexture(
        {
          texture: gpuTexture,
          mipLevel: i,
        },
        compressedTextureData,
        {
          offset: 0,
          bytesPerRow,
          rowsPerImage: blocksHigh,
        },
        {
          width: Math.ceil(mipWidth / blockInfo.width) * blockInfo.width,
          height: Math.ceil(mipHeight / blockInfo.height) * blockInfo.height,
        }
      );
    }

    const textureHandle = this.__registerResource(gpuTexture);
    return textureHandle;
  }

  /**
   * decode the BasisImage
   * @param basisFile
   * @param basisCompressionType
   * @param imageIndex
   * @param levelIndex
   * @returns
   */
  private decodeBasisImage(
    basisFile: BasisFile,
    basisCompressionType: BasisCompressionTypeEnum,
    imageIndex: Index,
    levelIndex: Index
  ) {
    const extractSize = basisFile.getImageTranscodedSizeInBytes(imageIndex, levelIndex, basisCompressionType!.index);
    const textureSource = new Uint8Array(extractSize);
    if (!basisFile.transcodeImage(textureSource, imageIndex, levelIndex, basisCompressionType!.index, 0, 0)) {
      Logger.error('failed to transcode the image.');
    }
    return textureSource;
  }

  /**
   * Create and bind compressed texture object
   * @param textureDataArray transcoded texture data for each mipmaps(levels)
   * @param compressionTextureType
   */
  async createCompressedTexture(
    textureDataArray: TextureData[],
    compressionTextureType: CompressionTextureTypeEnum
  ): Promise<WebGPUResourceHandle> {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const blockInfo = compressionTextureType.blockInfo || { byteSize: 4, width: 1, height: 1 };

    const textureDataLevel0 = textureDataArray[0];

    const textureDescriptor: GPUTextureDescriptor = {
      size: [
        Math.ceil(textureDataLevel0.width / blockInfo.width) * blockInfo.width,
        Math.ceil(textureDataLevel0.height / blockInfo.height) * blockInfo.height,
        1,
      ],
      format: compressionTextureType.webgpu as GPUTextureFormat,
      mipLevelCount: textureDataArray.length,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    };

    const texture = gpuDevice.createTexture(textureDescriptor);

    for (let level = 0; level < textureDataArray.length; level++) {
      const textureData = textureDataArray[level];
      const mipWidth = textureData.width;
      const mipHeight = textureData.height;

      // Calculate the number of blocks for the compressed texture (minimum 1 block)
      const blocksWide = Math.max(1, Math.ceil(mipWidth / blockInfo.width));
      const blocksHigh = Math.max(1, Math.ceil(mipHeight / blockInfo.height));

      // For compressed textures in WebGPU, bytesPerRow must be a multiple of 256 bytes
      const unalignedBytesPerRow = blocksWide * blockInfo.byteSize;
      const bytesPerRow = Math.ceil(unalignedBytesPerRow / 256) * 256;

      // Retrieve the appropriate Uint8Array from ArrayBufferView
      const originalData =
        textureData.buffer instanceof Uint8Array
          ? textureData.buffer
          : new Uint8Array(textureData.buffer.buffer, textureData.buffer.byteOffset, textureData.buffer.byteLength);

      // If bytesPerRow is not aligned, data needs to be padded
      let compressedTextureData: Uint8Array;
      const expectedDataSize = bytesPerRow * blocksHigh;

      if (bytesPerRow !== unalignedBytesPerRow || originalData.length < expectedDataSize) {
        // Padding is needed, or the actual data size is smaller than expected
        const paddedData = new Uint8Array(expectedDataSize);

        if (originalData.length > 0) {
          // If there is actual data, copy it row by row
          const actualRowsAvailable = Math.floor(originalData.length / unalignedBytesPerRow);
          for (let row = 0; row < Math.min(blocksHigh, actualRowsAvailable); row++) {
            const srcOffset = row * unalignedBytesPerRow;
            const dstOffset = row * bytesPerRow;
            const copyLength = Math.min(unalignedBytesPerRow, originalData.length - srcOffset);
            if (copyLength > 0) {
              paddedData.set(originalData.subarray(srcOffset, srcOffset + copyLength), dstOffset);
            }
          }
        }
        compressedTextureData = paddedData;
      } else {
        compressedTextureData = originalData;
      }

      gpuDevice.queue.writeTexture(
        {
          texture,
          mipLevel: level,
        },
        compressedTextureData,
        {
          offset: 0,
          bytesPerRow,
          rowsPerImage: blocksHigh,
        },
        {
          width: Math.ceil(mipWidth / blockInfo.width) * blockInfo.width,
          height: Math.ceil(mipHeight / blockInfo.height) * blockInfo.height,
        }
      );
    }

    await gpuDevice.queue.onSubmittedWorkDone();

    const textureHandle = this.__registerResource(texture);
    return textureHandle;
  }

  /**
   * allocate a Texture
   * @param format - the format of the texture
   * @param width - the width of the texture
   * @param height - the height of the texture
   * @param mipmapCount - the number of mipmap levels
   * @returns the handle of the texture
   */
  allocateTexture({
    format,
    width,
    height,
    mipLevelCount,
  }: {
    format: TextureFormatEnum;
    width: Size;
    height: Size;
    mipLevelCount: Count;
  }): WebGPUResourceHandle {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;

    const textureDescriptor: GPUTextureDescriptor = {
      size: [width, height, 1],
      mipLevelCount: mipLevelCount,
      format: format.webgpu as GPUTextureFormat,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    };

    const gpuTexture = gpuDevice.createTexture(textureDescriptor);

    const textureHandle = this.__registerResource(gpuTexture);
    return textureHandle;
  }

  /**
   * Load an image to a specific mip level of a texture
   * @param mipLevel - the mip level to load the image to
   * @param textureUid - the handle of the texture
   * @param format - the format of the image
   * @param type - the type of the data
   * @param xOffset - the x offset of copy region
   * @param yOffset - the y offset of copy region
   * @param width - the width of the image
   * @param height - the height of the image
   * @param data - the typedarray data of the image
   */
  async loadImageToMipLevelOfTexture2D({
    mipLevel,
    textureUid,
    format,
    type,
    xOffset,
    yOffset,
    width,
    height,
    rowSizeByPixel,
    data,
  }: {
    mipLevel: Index;
    textureUid: WebGLResourceHandle;
    format: TextureFormatEnum;
    type: ComponentTypeEnum;
    xOffset: number;
    yOffset: number;
    width: number;
    height: number;
    rowSizeByPixel: number;
    data: TypedArray;
  }) {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const texture = this.__webGpuResources.get(textureUid) as GPUTexture;
    const pixelFormat = TextureFormat.getPixelFormatFromTextureFormat(format);
    const compositionNum = PixelFormat.getCompositionNumFromPixelFormat(pixelFormat);

    const bytesPerRow = rowSizeByPixel * compositionNum * type.getSizeInBytes();

    // Align the row data size to multiple of 256 bytes due to the WebGPU spec
    const paddedBytesPerRow = Math.ceil(bytesPerRow / 256) * 256;

    // Copy data to padded buffer
    const paddedData = new Uint8Array(paddedBytesPerRow * height);
    for (let row = 0; row < height; row++) {
      const srcOffset = row * bytesPerRow;
      const dstOffset = row * paddedBytesPerRow;
      paddedData.set(new Uint8Array(data.buffer, srcOffset, bytesPerRow), dstOffset);
    }

    // バッファの作成
    const buffer = gpuDevice.createBuffer({
      size: paddedData.byteLength,
      usage: GPUBufferUsage.COPY_SRC,
      mappedAtCreation: true,
    });

    new Uint8Array(buffer.getMappedRange()).set(paddedData);
    buffer.unmap();

    const commandEncoder = gpuDevice.createCommandEncoder();

    commandEncoder.copyBufferToTexture(
      {
        buffer,
        offset: 0,
        bytesPerRow: paddedBytesPerRow,
        rowsPerImage: height,
      },
      {
        texture,
        mipLevel,
        origin: { x: xOffset, y: yOffset, z: 0 },
      },
      {
        width: width,
        height: height,
        depthOrArrayLayers: 1,
      }
    );

    const commandBuffer = commandEncoder.finish();
    gpuDevice.queue.submit([commandBuffer]);

    try {
      await gpuDevice.queue.onSubmittedWorkDone();
    } catch (e) {
      Logger.error(e as string);
    }
  }

  private async __createTextureInner(
    width: number,
    height: number,
    internalFormat: TextureParameterEnum,
    generateMipmap: boolean,
    imageData: ImageBitmapData
  ) {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const textureDescriptor: GPUTextureDescriptor = {
      size: [width, height, 1],
      format: internalFormat.webgpu as GPUTextureFormat,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    };

    if (generateMipmap) {
      textureDescriptor.mipLevelCount = Math.floor(Math.log2(Math.max(width, height))) + 1;
    }

    const gpuTexture = gpuDevice.createTexture(textureDescriptor);

    gpuDevice.queue.copyExternalImageToTexture({ source: imageData }, { texture: gpuTexture }, [width, height]);

    if (generateMipmap) {
      this.generateMipmaps(gpuTexture, textureDescriptor);
    }

    await gpuDevice.queue.onSubmittedWorkDone();

    const textureHandle = this.__registerResource(gpuTexture);
    return textureHandle;
  }

  /**
   * Creates a render target texture that can be used as a color attachment in framebuffers.
   * This texture can be rendered to and also used as a texture input in shaders.
   *
   * @param params - Configuration for the render target texture
   * @param params.width - Width of the texture in pixels
   * @param params.height - Height of the texture in pixels
   * @param params.mipLevelCount - Number of mipmap levels to create
   * @param params.format - Texture format for the render target
   * @returns Handle to the created render target texture resource
   */
  createRenderTargetTexture({
    width,
    height,
    mipLevelCount,
    format,
  }: {
    width: Size;
    height: Size;
    mipLevelCount: Count;
    format: TextureParameterEnum;
  }): WebGPUResourceHandle {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const textureDescriptor: GPUTextureDescriptor = {
      size: [width, height, 1],
      format: format.webgpu as GPUTextureFormat,
      mipLevelCount,
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_SRC |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    };

    const gpuTexture = gpuDevice.createTexture(textureDescriptor);

    const textureHandle = this.__registerResource(gpuTexture);

    return textureHandle;
  }

  /**
   * Creates a render target texture array that can hold multiple 2D textures.
   * Useful for techniques like shadow mapping with multiple lights or layered rendering.
   *
   * @param params - Configuration for the render target texture array
   * @param params.width - Width of each texture layer in pixels
   * @param params.height - Height of each texture layer in pixels
   * @param params.internalFormat - Internal format of the texture
   * @param params.arrayLength - Number of texture layers in the array
   * @returns Handle to the created render target texture array resource
   */
  createRenderTargetTextureArray({
    width,
    height,
    internalFormat,
    arrayLength,
  }: {
    width: Size;
    height: Size;
    internalFormat: TextureParameterEnum;
    arrayLength: Count;
  }): WebGPUResourceHandle {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const textureDescriptor: GPUTextureDescriptor = {
      dimension: '2d',
      size: [width, height, arrayLength],
      format: internalFormat.webgpu as GPUTextureFormat,
      mipLevelCount: 1,
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_SRC |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    };

    const gpuTexture = gpuDevice.createTexture(textureDescriptor);

    const textureHandle = this.__registerResource(gpuTexture);

    return textureHandle;
  }

  /**
   * Creates a render target cube texture for environment mapping or omnidirectional shadow mapping.
   * This creates a cube texture with 6 faces that can be rendered to.
   *
   * @param params - Configuration for the render target cube texture
   * @param params.width - Width of each cube face in pixels
   * @param params.height - Height of each cube face in pixels
   * @param params.mipLevelCount - Number of mipmap levels to create
   * @param params.format - Texture format for the render target
   * @returns Handle to the created render target cube texture resource
   */
  createRenderTargetTextureCube({
    width,
    height,
    mipLevelCount,
    format,
  }: {
    width: Size;
    height: Size;
    mipLevelCount: Count;
    format: TextureParameterEnum;
  }): WebGPUResourceHandle {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const textureDescriptor: GPUTextureDescriptor = {
      dimension: '2d',
      size: [width, height, 6],
      format: format.webgpu as GPUTextureFormat,
      mipLevelCount,
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_SRC |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    };

    const gpuTexture = gpuDevice.createTexture(textureDescriptor);

    const textureHandle = this.__registerResource(gpuTexture);

    return textureHandle;
  }

  /**
   * Creates a render buffer for multisampling (MSAA) or as a render attachment.
   * Render buffers are textures that are only used for rendering and cannot be sampled in shaders.
   *
   * @param width - Width of the render buffer in pixels
   * @param height - Height of the render buffer in pixels
   * @param internalFormat - Internal format of the render buffer
   * @param isMSAA - Whether to enable multisampling
   * @param sampleCountMSAA - Number of samples for MSAA (ignored if isMSAA is false)
   * @returns Handle to the created render buffer resource
   */
  createRenderBuffer(
    width: Size,
    height: Size,
    internalFormat: TextureParameterEnum,
    isMSAA: boolean,
    sampleCountMSAA: Count
  ): WebGPUResourceHandle {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const textureDescriptor: GPUTextureDescriptor = {
      size: [width, height, 1],
      format: internalFormat.webgpu as GPUTextureFormat,
      sampleCount: isMSAA ? sampleCountMSAA : 1,
      usage: GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT,
    };

    const gpuTexture = gpuDevice.createTexture(textureDescriptor);

    const textureHandle = this.__registerResource(gpuTexture);

    return textureHandle;
  }

  /**
   * delete a RenderBuffer
   * @param renderBufferUid
   */
  deleteRenderBuffer(renderBufferUid: WebGPUResourceHandle) {
    this.flush();
    this.clearCache();

    const texture = this.__webGpuResources.get(renderBufferUid) as GPUTexture;

    if (texture != null) {
      texture.destroy();
      this.__webGpuResources.delete(renderBufferUid);
    }
  }

  /**
   * copy Texture Data
   * @param fromTexture
   * @param toTexture
   */
  copyTextureData(fromTexture: WebGPUResourceHandle, toTexture: WebGPUResourceHandle) {
    const from = this.__webGpuResources.get(fromTexture) as GPUTexture;
    const to = this.__webGpuResources.get(toTexture) as GPUTexture;
    if (this.__renderPassEncoder != null) {
      if (this.__renderBundleEncoder != null) {
        this.__renderPassEncoder.executeBundles([this.__renderBundleEncoder.finish()]);
        this.__renderBundleEncoder = undefined;
        this.__renderBundleEncoderKey = undefined;
      }
      this.__renderPassEncoder.end();
      this.__renderPassEncoder = undefined;
    }
    this.__commandEncoder!.copyTextureToTexture(
      {
        texture: from,
      },
      {
        texture: to,
      },
      [to.width, to.height, 1]
    );
  }

  isMippmappedTexture(textureHandle: WebGPUResourceHandle): boolean {
    const texture = this.__webGpuResources.get(textureHandle) as GPUTexture;
    if (texture.mipLevelCount > 1) {
      return true;
    }
    return false;
  }

  duplicateTextureAsMipmapped(fromTexture: WebGPUResourceHandle): [WebGPUResourceHandle, WebGPUResourceHandle] {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const texture = this.__webGpuResources.get(fromTexture) as GPUTexture;

    // Create a new texture with the same descriptor
    const textureDescriptor = {
      size: {
        width: texture.width,
        height: texture.height,
        depthOrArrayLayers: texture.depthOrArrayLayers,
      },
      mipLevelCount: Math.floor(Math.log2(Math.max(texture.width, texture.height))) + 1,
      format: texture.format,
      usage: texture.usage,
    };
    const newTexture = gpuDevice.createTexture(textureDescriptor);

    if (this.__renderPassEncoder != null) {
      if (this.__renderBundleEncoder != null) {
        this.__renderPassEncoder.executeBundles([this.__renderBundleEncoder.finish()]);
        this.__renderBundleEncoder = undefined;
        this.__renderBundleEncoderKey = undefined;
      }
      this.__renderPassEncoder.end();
      this.__renderPassEncoder = undefined;
    }

    // Copy the texture to the new texture
    this.__commandEncoder!.copyTextureToTexture(
      { texture: texture },
      { texture: newTexture },
      { width: texture.width, height: texture.height, depthOrArrayLayers: 1 }
    );

    const textureHandle = this.__registerResource(newTexture);
    const textureViewHandle = this.__registerResource(newTexture.createView());

    return [textureHandle, textureViewHandle];
  }

  /**
   * attach the DepthBuffer to the FrameBufferObject
   * @param framebuffer a Framebuffer
   * @param renderable a DepthBuffer
   */
  attachDepthBufferToFrameBufferObject(_framebuffer: FrameBuffer, _renderable: IRenderable): void {}

  /**
   * attach the StencilBuffer to the FrameBufferObject
   * @param framebuffer a Framebuffer
   * @param renderable a StencilBuffer
   */
  attachStencilBufferToFrameBufferObject(_framebuffer: FrameBuffer, _renderable: IRenderable): void {}

  /**
   * attach the depthStencilBuffer to the FrameBufferObject
   * @param framebuffer a Framebuffer
   * @param renderable a depthStencilBuffer
   */
  attachDepthStencilBufferToFrameBufferObject(_framebuffer: FrameBuffer, _renderable: IRenderable): void {}

  /**
   * create a FrameBufferObject
   * @returns
   */
  createFrameBufferObject() {
    return -1;
  }

  /**
   * delete a FrameBufferObject
   * @param frameBufferObjectHandle
   */
  deleteFrameBufferObject(_frameBufferObjectHandle: WebGPUResourceHandle): void {}

  /**
   * attach the ColorBuffer to the FrameBufferObject
   * @param framebuffer a Framebuffer
   * @param attachmentIndex a attachment index
   * @param renderable a ColorBuffer
   */
  attachColorBufferToFrameBufferObject(_framebuffer: FrameBuffer, _attachmentIndex: Index, _renderable: IRenderable) {
    return;
  }

  /**
   * attach the ColorBuffer to the FrameBufferObject
   * @param framebuffer a Framebuffer
   * @param attachmentIndex a attachment index
   * @param renderable a ColorBuffer
   * @param layerIndex a layer index
   * @param mipLevel a mip level
   */
  attachColorBufferLayerToFrameBufferObject(
    _framebuffer: FrameBuffer,
    _attachmentIndex: Index,
    _renderable: IRenderable,
    _layerIndex: Index,
    _mipLevel: Index
  ) {
    return;
  }

  /**
   * attach the ColorBuffer to the FrameBufferObject
   * @param framebuffer a Framebuffer
   * @param attachmentIndex a attachment index
   * @param faceIndex a face index
   * @param mipLevel a mip level
   * @param renderable a ColorBuffer
   */
  attachColorBufferCubeToFrameBufferObject(
    _framebuffer: FrameBuffer,
    _attachmentIndex: Index,
    _faceIndex: Index,
    _mipLevel: Index,
    _renderable: IRenderable
  ) {}

  /**
   * Creates a 2D texture view from a texture resource.
   * This view can be used for sampling the texture in shaders.
   *
   * @param textureHandle - Handle to the source texture
   * @returns Handle to the created texture view
   */
  createTextureView2d(textureHandle: WebGPUResourceHandle): WebGPUResourceHandle {
    const texture = this.__webGpuResources.get(textureHandle) as GPUTexture;
    const textureView = texture.createView();
    const textureViewHandle = this.__registerResource(textureView);

    return textureViewHandle;
  }

  /**
   * Creates a texture view suitable for use as a render target.
   * This view targets only the base mip level and first array layer.
   *
   * @param textureHandle - Handle to the source texture
   * @returns Handle to the created render target texture view
   */
  createTextureViewAsRenderTarget(textureHandle: WebGPUResourceHandle): WebGPUResourceHandle {
    const texture = this.__webGpuResources.get(textureHandle) as GPUTexture;
    const textureView = texture.createView({
      baseMipLevel: 0,
      mipLevelCount: 1,
      arrayLayerCount: 1,
    });
    const textureViewHandle = this.__registerResource(textureView);

    return textureViewHandle;
  }

  /**
   * Creates a cube texture view from a cube texture resource.
   * This view exposes all 6 faces of the cube texture for sampling.
   *
   * @param textureHandle - Handle to the source cube texture
   * @returns Handle to the created cube texture view
   */
  createTextureViewCube(textureHandle: WebGPUResourceHandle): WebGPUResourceHandle {
    const texture = this.__webGpuResources.get(textureHandle) as GPUTexture;
    const textureView = texture.createView({ dimension: 'cube' });
    const textureViewHandle = this.__registerResource(textureView);

    return textureViewHandle;
  }

  createTextureView2dArray(textureHandle: WebGPUResourceHandle, arrayLayerCount: Count): WebGPUResourceHandle {
    const texture = this.__webGpuResources.get(textureHandle) as GPUTexture;
    const textureView = texture.createView({
      dimension: '2d-array',
      baseArrayLayer: 0,
      arrayLayerCount: arrayLayerCount,
    });
    const textureViewHandle = this.__registerResource(textureView);

    return textureViewHandle;
  }

  createTextureView2dArrayAsRenderTarget(
    textureHandle: WebGPUResourceHandle,
    arrayIdx: Index,
    mipLevel: Index
  ): WebGPUResourceHandle {
    const texture = this.__webGpuResources.get(textureHandle) as GPUTexture;
    const textureView = texture.createView({
      dimension: '2d',
      arrayLayerCount: 1,
      baseArrayLayer: arrayIdx,
      baseMipLevel: mipLevel,
      mipLevelCount: 1,
      aspect: 'all',
    });
    const textureViewHandle = this.__registerResource(textureView);

    return textureViewHandle;
  }

  createCubeTextureViewAsRenderTarget(
    textureHandle: WebGPUResourceHandle,
    faceIdx: Index,
    mipLevel: Index
  ): WebGPUResourceHandle {
    const texture = this.__webGpuResources.get(textureHandle) as GPUTexture;
    const textureView = texture.createView({
      dimension: '2d',
      arrayLayerCount: 1,
      baseArrayLayer: faceIdx,
      baseMipLevel: mipLevel,
      mipLevelCount: 1,
      aspect: 'all',
    });
    const textureViewHandle = this.__registerResource(textureView);

    return textureViewHandle;
  }

  deleteTexture(textureHandle: WebGLResourceHandle) {
    this.flush();
    this.clearCache();

    const texture = this.__webGpuResources.get(textureHandle) as GPUTexture;
    if (texture == null) {
      return;
    }
    // delete the texture view for generating mipmaps
    this.__srcTextureViewsForGeneratingMipmaps.delete(texture);
    this.__dstTextureViewsForGeneratingMipmaps.delete(texture);
    this.__bindGroupsForGeneratingMipmaps.delete(texture);

    texture.destroy();
    this.__webGpuResources.delete(textureHandle);
  }

  /**
   * Recreates the system depth texture with the current canvas dimensions.
   * This is called when the canvas is resized or initialized.
   */
  recreateSystemDepthTexture() {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const canvas = this.__webGpuDeviceWrapper!.canvas;

    if (this.__systemDepthTexture != null) {
      this.__systemDepthTexture.destroy();
    }
    this.__systemDepthTexture = gpuDevice.createTexture({
      size: [canvas.width, canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.__systemDepthTextureView = this.__systemDepthTexture.createView();
  }

  /**
   * Resizes the canvas and recreates the system depth texture.
   * This method should be called when the window or viewport size changes.
   *
   * @param width - New canvas width in pixels
   * @param height - New canvas height in pixels
   */
  resizeCanvas(width: Size, height: Size) {
    const canvas = this.__webGpuDeviceWrapper!.canvas;
    canvas.width = width;
    canvas.height = height;
    this.recreateSystemDepthTexture();
  }

  /**
   * Sets the viewport for rendering (currently not implemented in WebGPU version).
   *
   * @param viewport - Optional viewport rectangle (x, y, width, height)
   */
  setViewport(_viewport?: Vector4) {}

  /**
   * Checks if the implementation supports multi-view VR rendering.
   *
   * @returns Always false for WebGPU implementation (not yet supported)
   */
  isSupportMultiViewVRRendering(): boolean {
    return false;
  }
}
