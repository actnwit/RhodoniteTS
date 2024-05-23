/// <reference types="@webgpu/types" />

import { DataUtil } from '../foundation/misc/DataUtil';
import { CompositionType } from '../foundation/definitions/CompositionType';
import { AbstractTexture } from '../foundation/textures/AbstractTexture';
import { ComponentTypeEnum } from '../foundation/definitions/ComponentType';
import { PixelFormatEnum } from '../foundation/definitions/PixelFormat';
import { TextureParameter, TextureParameterEnum } from '../foundation/definitions/TextureParameter';
import { VertexAttribute, VertexAttributeEnum } from '../foundation/definitions/VertexAttribute';
import { Mesh } from '../foundation/geometry/Mesh';
import { Primitive } from '../foundation/geometry/Primitive';
import { Material } from '../foundation/materials/core/Material';
import { Accessor } from '../foundation/memory/Accessor';
import { Is } from '../foundation/misc/Is';
import {
  CGAPIResourceRepository,
  DirectTextureData,
  ICGAPIResourceRepository,
  ImageBitmapData,
} from '../foundation/renderer/CGAPIResourceRepository';
import { RenderPass } from '../foundation/renderer/RenderPass';
import { Sampler } from '../foundation/textures/Sampler';
import {
  Byte,
  Count,
  Index,
  Size,
  TypedArray,
  WebGLResourceHandle,
  WebGPUResourceHandle,
} from '../types/CommonTypes';
import { VertexHandles } from '../webgl/WebGLResourceRepository';
import { AttributeNames } from '../webgl/types/CommonTypes';
import { WebGpuDeviceWrapper } from './WebGpuDeviceWrapper';
import { Config } from '../foundation/core/Config';
import { HdriFormat, HdriFormatEnum } from '../foundation/definitions/HdriFormat';
import { dummyBlackCubeTexture } from '../foundation/materials/core/DummyTextures';
import { ShaderSemantics } from '../foundation/definitions/ShaderSemantics';
import { MutableVector2 } from '../foundation/math/MutableVector2';
import { MutableVector4 } from '../foundation/math/MutableVector4';
import { MeshRendererComponent } from '../foundation/components/MeshRenderer/MeshRendererComponent';
import { AlphaMode } from '../foundation/definitions/AlphaMode';
import { MiscUtil } from '../foundation/misc/MiscUtil';
import { CubeTexture } from '../foundation/textures/CubeTexture';
import { IRenderable } from '../foundation/textures/IRenderable';
import { FrameBuffer } from '../foundation/renderer/FrameBuffer';
import { GlobalDataRepository } from '../foundation/core/GlobalDataRepository';
import { RenderBuffer } from '../foundation/textures/RenderBuffer';
import { Vector2 } from '../foundation/math/Vector2';
import { CameraComponent } from '../foundation/components/Camera/CameraComponent';
import { EntityRepository } from '../foundation/core/EntityRepository';
import { CameraControllerComponent } from '../foundation/components/CameraController/CameraControllerComponent';
import { SystemState } from '../foundation/system/SystemState';

const HDRImage = require('../../vendor/hdrpng.min.js');

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

const IBL_DIFFUSE_CUBE_TEXTURE_BINDING_SLOT = 16;
const IBL_SPECULAR_CUBE_TEXTURE_BINDING_SLOT = 17;

export class WebGpuResourceRepository
  extends CGAPIResourceRepository
  implements ICGAPIResourceRepository
{
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
  private __commandEncoder?: GPUCommandEncoder;
  private __renderBundles: Map<RenderPassUid, GPURenderBundle> = new Map();
  private __renderBundleEncoder?: GPURenderBundleEncoder;
  private __systemDepthTexture?: GPUTexture;
  private __systemDepthTextureView?: GPUTextureView;
  private __uniformMorphOffsetsBuffer?: GPUBuffer;
  private __uniformMorphWeightsBuffer?: GPUBuffer;
  private __renderPassEncoder?: GPURenderPassEncoder;
  private __generateMipmapsShaderModule?: GPUShaderModule;
  private __generateMipmapsPipeline?: GPURenderPipeline;
  private __generateMipmapsFormat?: GPUTextureFormat;
  private __generateMipmapsSampler?: GPUSampler;
  private __contextCurrentTextureView?: GPUTextureView;

  private __lastMaterialsUpdateCount = -1;
  private __lastCurrentCameraComponentSid = -1;
  private __lastEntityRepositoryUpdateCount = -1;
  private __lastPrimitivesMaterialVariantUpdateCount = -1;

  private static __iblParameterVec4 = MutableVector4.zero();
  private static __hdriFormatVec2 = MutableVector2.zero();

  private constructor() {
    super();
  }

  clearCache() {
    this.__webGpuRenderPipelineMap.clear();
    this.__materialStateVersionMap.clear();
    this.__bindGroupTextureMap.clear();
    this.__bindGroupLayoutTextureMap.clear();
    this.__bindGroupSamplerMap.clear();
    this.__bindGroupLayoutSamplerMap.clear();
    this.__renderBundles.clear();
  }

  addWebGpuDeviceWrapper(webGpuDeviceWrapper: WebGpuDeviceWrapper) {
    this.__webGpuDeviceWrapper = webGpuDeviceWrapper;
  }

  static getInstance(): WebGpuResourceRepository {
    if (!this.__instance) {
      this.__instance = new WebGpuResourceRepository();
    }
    return this.__instance;
  }

  private getResourceNumber(): WebGPUResourceHandle {
    return ++this.__resourceCounter;
  }

  private __registerResource(obj: WebGpuResource) {
    const handle = this.getResourceNumber();
    (obj as any)._resourceUid = handle;
    this.__webGpuResources.set(handle, obj);
    return handle;
  }

  getCanvasSize(): [Size, Size] {
    const canvas = this.__webGpuDeviceWrapper!.canvas;
    return [canvas.width, canvas.height];
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
      generateMipmap: boolean;
    }
  ): WebGPUResourceHandle {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const textureDescriptor: GPUTextureDescriptor = {
      size: [width, height, 1],
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    };

    if (generateMipmap) {
      textureDescriptor.mipLevelCount = Math.floor(Math.log2(Math.max(width, height))) + 1;
    }

    const gpuTexture = gpuDevice.createTexture(textureDescriptor);

    gpuDevice.queue.copyExternalImageToTexture({ source: imageData }, { texture: gpuTexture }, [
      width,
      height,
    ]);

    if (generateMipmap) {
      this.generateMipmaps(gpuTexture, textureDescriptor, 1);
    }

    const textureHandle = this.__registerResource(gpuTexture);

    return textureHandle;
  }

  generateMipmaps2d(textureHandle: WebGPUResourceHandle, width: number, height: number): void {
    const gpuTexture = this.__webGpuResources.get(textureHandle) as GPUTexture;
    const textureDescriptor: GPUTextureDescriptor = {
      size: [width, height, 1],
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
      mipLevelCount: Math.floor(Math.log2(Math.max(width, height))) + 1,
    };
    this.generateMipmaps(gpuTexture, textureDescriptor, 1);
  }

  async getTexturePixelData(
    textureHandle: WebGPUResourceHandle,
    width: number,
    height: number,
    frameBufferUid: WebGPUResourceHandle,
    colorAttachmentIndex: number
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
   * create a WebGPU Texture Mipmaps
   *
   * @remarks
   * Thanks to: https://toji.dev/webgpu-best-practices/img-textures#generating-mipmaps
   * @param texture - a texture
   * @param textureDescriptor - a texture descriptor
   * @param depthOrArrayLayers - depth or array layers
   */
  generateMipmaps(
    texture: GPUTexture,
    textureDescriptor: GPUTextureDescriptor,
    depthOrArrayLayers: number
  ) {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;

    if (this.__generateMipmapsShaderModule == null) {
      this.__generateMipmapsShaderModule = gpuDevice.createShaderModule({
        code: `
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

    if (
      this.__generateMipmapsPipeline != null &&
      textureDescriptor.format != this.__generateMipmapsFormat
    ) {
      this.__generateMipmapsPipeline = undefined;
    }
    if (this.__generateMipmapsPipeline == null) {
      this.__generateMipmapsPipeline = gpuDevice.createRenderPipeline({
        layout: 'auto',
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
      }
      this.__renderPassEncoder.end();
      this.__renderPassEncoder = undefined;
    }
    if (this.__commandEncoder == null) {
      this.__commandEncoder = gpuDevice.createCommandEncoder({});
    }
    for (let j = 0; j < depthOrArrayLayers; ++j) {
      let srcView = texture.createView({
        baseMipLevel: 0,
        mipLevelCount: 1,
        baseArrayLayer: j,
      });
      for (let i = 1; i < textureDescriptor.mipLevelCount!; ++i) {
        const dstView = texture.createView({
          baseMipLevel: i,
          mipLevelCount: 1,
          baseArrayLayer: j,
        });

        const passEncoder = this.__commandEncoder.beginRenderPass({
          colorAttachments: [
            {
              view: dstView,
              loadOp: 'load',
              storeOp: 'store',
            },
          ],
        });

        const bindGroup = gpuDevice.createBindGroup({
          layout: this.__generateMipmapsPipeline.getBindGroupLayout(0),
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

        // Render
        passEncoder.setPipeline(this.__generateMipmapsPipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.draw(4);
        passEncoder.end();

        srcView = dstView;
      }
    }
  }

  createTextureSampler({
    magFilter,
    minFilter,
    wrapS,
    wrapT,
    wrapR,
    anisotropy,
    isPremultipliedAlpha,
    shadowCompareMode,
  }: {
    magFilter: TextureParameterEnum;
    minFilter: TextureParameterEnum;
    wrapS: TextureParameterEnum;
    wrapT: TextureParameterEnum;
    wrapR: TextureParameterEnum;
    anisotropy: boolean;
    isPremultipliedAlpha?: boolean;
    shadowCompareMode: boolean;
  }): WebGPUResourceHandle {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const maxAnisotropy = anisotropy ? 4 : 1;

    const desc = {
      magFilter: magFilter.webgpu as GPUFilterMode,
      minFilter: minFilter.webgpu as GPUFilterMode,
      mipmapFilter:
        minFilter === TextureParameter.LinearMipmapLinear ||
        minFilter === TextureParameter.NearestMipmapLinear
          ? 'linear'
          : 'nearest',
      addressModeU: wrapS.webgpu as GPUAddressMode,
      addressModeV: wrapT.webgpu as GPUAddressMode,
      addressModeW: wrapR.webgpu as GPUAddressMode,
      // lodMinClamp: 0,
      // lodMaxClamp: 32,
      maxAnisotropy,
    } as GPUSamplerDescriptor;

    if (
      desc.magFilter === 'nearest' ||
      desc.minFilter === 'nearest' ||
      desc.mipmapFilter === 'nearest'
    ) {
      desc.maxAnisotropy = 1;
    }

    const sampler = gpuDevice.createSampler(desc);

    const samplerHandle = this.__registerResource(sampler);

    return samplerHandle;
  }

  /**
   * create a WebGPU Vertex Buffer
   * @param accessor - an accessor
   * @returns
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
   * create a WebGPU Vertex Buffer
   * @param typedArray - a typed array
   * @returns a WebGPUResourceHandle
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
   * create a WebGPU Index Buffer
   * @param accessor - an accessor
   * @returns a WebGPUResourceHandle
   */
  public createIndexBuffer(accessor: Accessor): WebGPUResourceHandle {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const size = DataUtil.addPaddingBytes(accessor.byteLength, 4);
    const indexBuffer = gpuDevice.createBuffer({
      size: size,
      usage: GPUBufferUsage.INDEX,
      mappedAtCreation: true,
    });

    new Uint8Array(indexBuffer.getMappedRange()).set(accessor.getUint8Array());
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
      new Uint8Array(indexBuffer.getMappedRange()).set(accessor.getUint8Array());
      indexBuffer.unmap();
    });
  }

  deleteVertexBuffer(resourceHandle: WebGPUResourceHandle) {
    const vertexBuffer = this.__webGpuResources.get(resourceHandle) as GPUBuffer;
    if (Is.not.exist(vertexBuffer)) {
      throw new Error('Not found VBO.');
    }

    vertexBuffer.destroy();
    this.__webGpuResources.delete(resourceHandle);
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
   * set the VertexData to the Pipeline
   */
  setVertexDataToPipeline(
    {
      vaoHandle,
      iboHandle,
      vboHandles,
    }: {
      vaoHandle: WebGPUResourceHandle;
      iboHandle?: WebGPUResourceHandle;
      vboHandles: Array<WebGPUResourceHandle>;
    },
    primitive: Primitive,
    instanceIDBufferUid: WebGPUResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid
  ) {
    const buffers: GPUVertexBufferLayout[] = [];

    // Vertex Buffer Settings
    /// Each vertex attributes
    const attributes: GPUVertexAttribute[] = [];
    for (let i = 0; i < vboHandles.length; i++) {
      const shaderLocation = VertexAttribute.toAttributeSlotFromJoinedString(
        primitive.attributeSemantics[i]
      );

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
    const instanceIDBuffer = this.__webGpuResources.get(instanceIDBufferUid) as GPUBuffer;
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

  private __checkShaderCompileStatus(
    materialTypeName: string,
    shaderText: string,
    info: GPUCompilationInfo
  ): boolean {
    console.log('MaterialTypeName: ' + materialTypeName);
    const lineNumberedShaderText = MiscUtil.addLineNumberToCode(shaderText);
    console.log(lineNumberedShaderText);
    for (let i = 0; i < info.messages.length; i++) {
      console.log(info.messages[i]);
      return false;
    }

    return true;
  }

  /**
   * create a shader program
   * @param param0
   * @returns
   */
  createShaderProgram({
    material,
    vertexShaderStr,
    fragmentShaderStr,
    attributeNames,
    attributeSemantics,
    onError,
  }: {
    material: Material;
    vertexShaderStr: string;
    fragmentShaderStr: string;
    attributeNames: AttributeNames;
    attributeSemantics: VertexAttributeEnum[];
    onError?: (message: string) => void;
  }) {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const vsModule = gpuDevice.createShaderModule({
      code: vertexShaderStr,
    });
    vsModule.getCompilationInfo().then((info) => {
      if (info.messages.length > 0) {
        this.__checkShaderCompileStatus(material.materialTypeName, vertexShaderStr, info);
      }
    });
    const fsModule = gpuDevice.createShaderModule({
      code: fragmentShaderStr,
    });
    fsModule.getCompilationInfo().then((info) => {
      if (info.messages.length > 0) {
        this.__checkShaderCompileStatus(material.materialTypeName, fragmentShaderStr, info);
      }
    });

    const modules = {
      vsModule,
      fsModule,
    };
    const modulesHandle = this.__registerResource(modules);

    return modulesHandle;
  }

  clearFrameBuffer(renderPass: RenderPass) {
    if (renderPass.entities.length > 0) {
      return;
    }
    // this method is executed when the renderPass has no entities.
    // If the renderPass has entities, the clear operation is executed in the createRenderPassEncoder method.

    if (!renderPass.toClearColorBuffer && !renderPass.toClearDepthBuffer) {
      return;
    }

    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const context = this.__webGpuDeviceWrapper!.context;
    const colorAttachments: GPURenderPassColorAttachment[] = [];
    let depthStencilAttachment: GPURenderPassDepthStencilAttachment | undefined;
    if (renderPass.toClearColorBuffer) {
      const framebuffer = renderPass.getFramebuffer();
      if (framebuffer != null) {
        for (let colorAttachment of framebuffer.colorAttachments) {
          const textureView = this.__webGpuResources.get(
            colorAttachment._textureViewResourceUid
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
          framebuffer.depthAttachment._textureViewResourceUid
        ) as GPUTextureView;
        depthStencilAttachment = {
          view: depthTextureView,
          depthClearValue: renderPass.clearDepth,
          depthLoadOp: 'clear',
          depthStoreOp: 'store',
        };
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
    if (this.__commandEncoder == null) {
      this.__commandEncoder = gpuDevice.createCommandEncoder();
    }
    const passEncoder = this.__commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.end();
  }

  draw(primitive: Primitive, material: Material, renderPass: RenderPass, cameraId: number) {
    const VertexHandles = primitive._vertexHandles;
    if (VertexHandles == null) {
      return;
    }
    const mesh = primitive.mesh as Mesh;
    const entity = mesh.meshEntitiesInner[0]; // get base mesh for instancing draw
    const meshRendererComponent = entity.getMeshRenderer()!;
    const sceneGraphComponent = entity.getSceneGraph()!;
    sceneGraphComponent.normalMatrixInner; // update normal matrix. do not remove this line.

    const renderPipelineId = `${primitive.primitiveUid} ${material.materialUID} ${renderPass.renderPassUID} ${meshRendererComponent.componentSID} ${meshRendererComponent._updateCount} ${cameraId}`;

    const [pipeline, recreated] = this.getOrCreateRenderPipeline(
      renderPipelineId,
      primitive,
      material,
      renderPass,
      meshRendererComponent,
      cameraId
    );

    this.createRenderBundleEncoder(renderPass);

    const renderBundleEncoder = this.__renderBundleEncoder!;
    renderBundleEncoder.setBindGroup(0, this.__bindGroupStorageBuffer!);
    renderBundleEncoder.setPipeline(pipeline);
    renderBundleEncoder.setBindGroup(1, this.__bindGroupTextureMap.get(renderPipelineId)!);
    renderBundleEncoder.setBindGroup(2, this.__bindGroupSamplerMap.get(renderPipelineId)!);

    const variationVBO = this.__webGpuResources.get(mesh._variationVBOUid) as GPUBuffer;
    renderBundleEncoder.setVertexBuffer(0, variationVBO);
    VertexHandles.vboHandles.forEach((vboHandle, i) => {
      const vertexBuffer = this.__webGpuResources.get(vboHandle) as GPUBuffer;
      renderBundleEncoder.setVertexBuffer(i + 1, vertexBuffer);
    });

    if (primitive.hasIndices()) {
      const indicesBuffer = this.__webGpuResources.get(VertexHandles.iboHandle!) as GPUBuffer;
      const indexBitSize = primitive.getIndexBitSize();
      renderBundleEncoder.setIndexBuffer(indicesBuffer, indexBitSize);
      const indicesAccessor = primitive.indicesAccessor!;
      renderBundleEncoder.drawIndexed(indicesAccessor.elementCount, mesh.meshEntitiesInner.length);
    } else {
      const vertexCount = primitive.attributeAccessors[0].elementCount;
      renderBundleEncoder.draw(vertexCount, mesh.meshEntitiesInner.length);
    }

    this.createRenderPassEncoder(renderPass);
  }

  private createRenderBundleEncoder(renderPass: RenderPass) {
    if (this.__renderBundleEncoder == null) {
      const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
      const framebuffer = renderPass.getFramebuffer();
      let colorFormats = [navigator.gpu.getPreferredCanvasFormat()];
      let depthStencilFormat = this.__systemDepthTexture!.format;
      if (framebuffer != null) {
        colorFormats = [];
        for (let colorAttachment of framebuffer.colorAttachments) {
          const texture = this.__webGpuResources.get(
            colorAttachment._textureResourceUid
          ) as GPUTexture;
          colorFormats.push(texture.format);
        }
        if (framebuffer.depthAttachment != null) {
          const depthTexture = this.__webGpuResources.get(
            framebuffer.depthAttachment._textureResourceUid
          ) as GPUTexture;
          depthStencilFormat = depthTexture.format;
        }
      }
      const renderBundleDescriptor: GPURenderBundleEncoderDescriptor = {
        colorFormats: colorFormats,
        depthStencilFormat: depthStencilFormat,
        sampleCount:
          renderPass.getResolveFramebuffer() != null
            ? (renderPass.getFramebuffer()!.colorAttachments[0] as RenderBuffer).sampleCount
            : 1,
      };
      const encoder = gpuDevice.createRenderBundleEncoder(renderBundleDescriptor);
      this.__renderBundleEncoder = encoder;
    }
  }

  private createRenderPassEncoder(renderPass: RenderPass) {
    if (this.__commandEncoder == null) {
      const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
      this.__commandEncoder = gpuDevice.createCommandEncoder();
    }
    if (this.__renderPassEncoder == null) {
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

      if (resolveFramebuffer != null && framebuffer != null) {
        let depthTextureView = this.__systemDepthTextureView!;
        if (framebuffer.depthAttachment != null) {
          const depthTexture = this.__webGpuResources.get(
            framebuffer.depthAttachment._textureResourceUid
          ) as GPUTexture;
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
        const colorAttachments = [];
        for (let i = 0; i < resolveFramebuffer.colorAttachments.length; i++) {
          const colorAttachment = framebuffer.colorAttachments[i] as RenderBuffer;
          const resolveColorAttachment = resolveFramebuffer.colorAttachments[i] as RenderBuffer;
          const textureView = this.__webGpuResources.get(
            colorAttachment._textureViewResourceUid
          ) as GPUTextureView;
          const resolveTextureView = this.__webGpuResources.get(
            resolveColorAttachment._textureViewResourceUid
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
        this.__renderPassEncoder = this.__commandEncoder.beginRenderPass(renderPassDescriptor);
      } else if (framebuffer != null) {
        let depthTextureView = this.__systemDepthTextureView!;
        if (framebuffer.depthAttachment != null) {
          const depthTexture = this.__webGpuResources.get(
            framebuffer.depthAttachment._textureResourceUid
          ) as GPUTexture;
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
        const colorAttachments = [];
        for (let colorAttachment of framebuffer.colorAttachments) {
          const textureView = this.__webGpuResources.get(
            colorAttachment._textureViewResourceUid
          ) as GPUTextureView;
          colorAttachments.push({
            view: textureView,
            clearValue: clearValue,
            loadOp: renderPass.toClearColorBuffer ? 'clear' : 'load',
            storeOp: 'store',
          });
        }
        renderPassDescriptor.colorAttachments = colorAttachments as GPURenderPassColorAttachment[];
        this.__renderPassEncoder = this.__commandEncoder.beginRenderPass(renderPassDescriptor);
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
        this.__renderPassEncoder = this.__commandEncoder.beginRenderPass(renderPassDescriptor);
      }
    }
  }

  private __toClearRenderBundles() {
    if (
      Material.stateVersion !== this.__lastMaterialsUpdateCount ||
      CameraComponent.current !== this.__lastCurrentCameraComponentSid ||
      EntityRepository.updateCount !== this.__lastEntityRepositoryUpdateCount ||
      Primitive.variantUpdateCount !== this.__lastPrimitivesMaterialVariantUpdateCount
    ) {
      this.__renderBundles.clear();
      SystemState.webgpuRenderBundleMode = false;
      this.__lastCurrentCameraComponentSid = CameraComponent.current;
      this.__lastMaterialsUpdateCount = Material.stateVersion;
      this.__lastEntityRepositoryUpdateCount = EntityRepository.updateCount;
      this.__lastPrimitivesMaterialVariantUpdateCount = Primitive.variantUpdateCount;
    }
  }

  executeRenderBundle(renderPass: RenderPass) {
    this.__toClearRenderBundles();
    if (renderPass._isChangedSortRenderResult) {
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
    if (this.__renderPassEncoder != null && this.__renderBundleEncoder != null) {
      const renderBundle = this.__renderBundleEncoder.finish();
      this.__renderBundles.set(renderPass.renderPassUID, renderBundle);
      this.__renderPassEncoder.executeBundles([renderBundle]);
      this.__renderPassEncoder.end();
      this.__renderBundleEncoder = undefined;
      this.__renderPassEncoder = undefined;
    }
  }

  private __setupIBLParameters(material: Material, meshRendererComponent: MeshRendererComponent) {
    if (
      meshRendererComponent.diffuseCubeMap == null ||
      meshRendererComponent.specularCubeMap == null
    ) {
      return;
    }
    WebGpuResourceRepository.__iblParameterVec4.x =
      meshRendererComponent.specularCubeMap.mipmapLevelNumber;
    WebGpuResourceRepository.__iblParameterVec4.y =
      meshRendererComponent.diffuseCubeMapContribution;
    WebGpuResourceRepository.__iblParameterVec4.z =
      meshRendererComponent.specularCubeMapContribution;
    WebGpuResourceRepository.__iblParameterVec4.w = meshRendererComponent.rotationOfCubeMap;
    material.setParameter(
      ShaderSemantics.IBLParameter,
      WebGpuResourceRepository.__iblParameterVec4
    );

    WebGpuResourceRepository.__hdriFormatVec2.x =
      meshRendererComponent.diffuseCubeMap.hdriFormat.index;
    WebGpuResourceRepository.__hdriFormatVec2.y =
      meshRendererComponent.specularCubeMap.hdriFormat.index;
    material.setParameter(ShaderSemantics.HDRIFormat, WebGpuResourceRepository.__hdriFormatVec2);
  }

  getOrCreateRenderPipeline(
    renderPipelineId: string,
    primitive: Primitive,
    material: Material,
    renderPass: RenderPass,
    meshRendererComponent: MeshRendererComponent,
    cameraId: number
  ): [GPURenderPipeline, boolean] {
    if (this.__webGpuRenderPipelineMap.has(renderPipelineId)) {
      const materialStateVersion = this.__materialStateVersionMap.get(renderPipelineId);
      if (materialStateVersion === material.stateVersion) {
        return [this.__webGpuRenderPipelineMap.get(renderPipelineId)!, false];
      }
    }

    this.__setupIBLParameters(material, meshRendererComponent);

    const width = this.__webGpuDeviceWrapper!.canvas.width;
    const height = this.__webGpuDeviceWrapper!.canvas.height;
    const backBufferTextureSize = GlobalDataRepository.getInstance().getValue(
      ShaderSemantics.BackBufferTextureSize,
      0
    ) as Vector2;
    backBufferTextureSize._v[0] = width;
    backBufferTextureSize._v[1] = height;

    this.__webGpuRenderPipelineMap.delete(renderPipelineId);
    this.__materialStateVersionMap.delete(renderPipelineId);
    this.__bindGroupTextureMap.delete(renderPipelineId);
    this.__bindGroupLayoutTextureMap.delete(renderPipelineId);
    this.__bindGroupSamplerMap.delete(renderPipelineId);
    this.__bindGroupLayoutSamplerMap.delete(renderPipelineId);

    this.__createBindGroup(renderPipelineId, material, primitive, meshRendererComponent);

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
    primitive.attributeAccessors.forEach((accessor: Accessor, i: number) => {
      const slotIdx = VertexAttribute.toAttributeSlotFromJoinedString(
        primitive.attributeSemantics[i]
      );
      const attribute = {
        shaderLocation: slotIdx,
        offset: 0,
        format: (accessor.componentType.webgpu +
          accessor.compositionType.webgpu) as GPUVertexFormat,
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
        this.__bindGroupLayoutTextureMap.get(renderPipelineId)!,
        this.__bindGroupLayoutSamplerMap.get(renderPipelineId)!,
      ],
    });

    let blend: GPUBlendState | undefined;
    if (material.isBlend()) {
      if (material.alphaMode === AlphaMode.Translucent) {
        blend = {
          color: {
            srcFactor: 'src-alpha',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add',
          },
          alpha: {
            srcFactor: 'src-alpha',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add',
          },
        };
      } else if (material.alphaMode === AlphaMode.Additive) {
        blend = {
          color: {
            srcFactor: 'one',
            dstFactor: 'one',
            operation: 'add',
          },
          alpha: {
            srcFactor: 'one',
            dstFactor: 'one',
            operation: 'add',
          },
        };
      }
    }

    const mode = primitive.primitiveMode;
    const topology = mode.getWebGPUTypeStr();
    let stripIndexFormat = undefined;
    if (topology === 'triangle-strip' || topology === 'line-strip') {
      stripIndexFormat = primitive.getIndexBitSize();
    }
    const primitiveIdxHasMorph = Primitive.getPrimitiveIdxHasMorph(primitive.primitiveUid);
    const framebuffer = renderPass.getFramebuffer();
    let targets: GPUColorTargetState[] = [
      {
        // @location(0) in fragment shader
        format: presentationFormat,
        blend,
      },
    ];
    let depthStencilFormat = 'depth24plus' as GPUTextureFormat;
    if (framebuffer != null) {
      targets = [];
      for (let colorAttachment of framebuffer.colorAttachments) {
        const texture = this.__webGpuResources.get(
          colorAttachment._textureResourceUid
        ) as GPUTexture;
        targets.push({
          format: texture.format,
          blend,
        });
      }
      if (framebuffer.depthAttachment != null) {
        const depthTexture = this.__webGpuResources.get(
          framebuffer.depthAttachment._textureResourceUid
        ) as GPUTexture;
        depthStencilFormat = depthTexture.format;
      }
    }

    const pipeline = gpuDevice.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: modules.vsModule,
        entryPoint: 'main',
        constants: {
          _materialSID: material.materialSID,
          _currentPrimitiveIdx: primitiveIdxHasMorph ?? 0,
          _morphTargetNumber: primitive.targets.length,
          _cameraSID: cameraId,
        },
        buffers: gpuVertexBufferLayouts,
      },
      fragment: {
        module: modules.fsModule,
        entryPoint: 'main',
        constants: {
          _materialSID: material.materialSID,
          _cameraSID: cameraId,
        },
        targets: targets,
      },
      primitive: {
        topology: topology as GPUPrimitiveTopology,
        stripIndexFormat: stripIndexFormat,
      },
      depthStencil: {
        depthWriteEnabled: renderPass.isDepthTest ? true : false,
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

  flush() {
    if (this.__commandEncoder != null) {
      const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
      gpuDevice.queue.submit([this.__commandEncoder!.finish()]);
      this.__commandEncoder = undefined;
    }

    if (this.__contextCurrentTextureView != null) {
      this.__contextCurrentTextureView = undefined;
    }
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
      } catch (e) {
        // Try again once
        try {
          images = await loadOneLevel();
        } catch (uri) {
          // Give up
          console.error(`failed to load ${uri}`);
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
      format:
        (mipmaps[0][0] as any).hdriFormat === HdriFormat.HDR_LINEAR ? 'rgba16float' : 'rgba8unorm',
      mipLevelCount: mipLevelCount,
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });

    for (let i = 0; i < mipLevelCount; i++) {
      for (let j = 0; j < mipmaps[i].length; j++) {
        const imageBitmap = mipmaps[i][j];
        gpuDevice.queue.copyExternalImageToTexture(
          { source: imageBitmap },
          { texture: cubemapTexture, origin: [0, 0, j], mipLevel: i },
          [imageBitmap.width, imageBitmap.height, 1]
        );
      }
    }

    const handle = this.__registerResource(cubemapTexture);
    const wrapS = TextureParameter.Repeat;
    const wrapT = TextureParameter.Repeat;
    const minFilter =
      mipLevelCount === 1 ? TextureParameter.Linear : TextureParameter.LinearMipmapLinear;
    const magFilter = TextureParameter.Linear;

    const sampler = new Sampler({ wrapS, wrapT, minFilter, magFilter, anisotropy: false });
    sampler.create();

    return [handle, sampler];
  }

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

  updateStorageBuffer(
    storageBufferHandle: WebGPUResourceHandle,
    inputArray: Float32Array,
    updateByteLength: Byte
  ) {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const storageBuffer = this.__webGpuResources.get(storageBufferHandle) as GPUBuffer;
    gpuDevice.queue.writeBuffer(storageBuffer, 0, inputArray, 0, updateByteLength);
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
    updateByteLength: Byte
  ) {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const storageBuffer = this.__webGpuResources.get(storageBufferHandle) as GPUBuffer;
    gpuDevice.queue.writeBuffer(storageBuffer, 0, inputArray, 0, updateByteLength);
  }

  createUniformMorphOffsetsBuffer() {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const inputArray = new Uint32Array(
      Math.ceil(
        (Config.maxVertexPrimitiveNumberInShader * Config.maxVertexMorphNumberInShader) / 4
      ) * 4
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

  updateUniformMorphOffsetsBuffer(inputArray: Uint32Array) {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    if (this.__uniformMorphOffsetsBuffer == null) {
      throw new Error('Not found uniform morph buffer.');
    }
    gpuDevice.queue.writeBuffer(this.__uniformMorphOffsetsBuffer, 0, inputArray);
  }

  createUniformMorphWeightsBuffer() {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const inputArray = new Float32Array(
      Math.ceil(
        (Config.maxVertexPrimitiveNumberInShader * Config.maxVertexMorphNumberInShader) / 4
      ) * 4
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

  updateUniformMorphWeightsBuffer(inputArray: Float32Array) {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    if (this.__uniformMorphWeightsBuffer == null) {
      throw new Error('Not found uniform morph buffer.');
    }
    gpuDevice.queue.writeBuffer(this.__uniformMorphWeightsBuffer, 0, inputArray);
  }

  private __createBindGroup(
    renderPipelineId: string,
    material: Material,
    primitive: Primitive,
    meshRendererComponent: MeshRendererComponent
  ) {
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
      material._autoFieldVariablesOnly.forEach((value) => {
        const info = value.info;
        if (
          info.semantic.str === 'diffuseEnvTexture' ||
          info.semantic.str === 'specularEnvTexture'
        ) {
          return;
        }

        if (CompositionType.isTexture(info.compositionType)) {
          const slot = value.value[0];
          const texture = value.value[1] as AbstractTexture;
          const sampler = value.value[2] as Sampler;

          // Texture
          const type = texture instanceof CubeTexture ? 'cube' : '2d';
          const gpuTextureView = this.__webGpuResources.get(
            texture._textureViewResourceUid
          ) as GPUTextureView;
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
      const diffuseCubeTextureView = this.__webGpuResources.get(
        Is.exist(meshRendererComponent.diffuseCubeMap)
          ? meshRendererComponent.diffuseCubeMap._textureViewResourceUid
          : -1
      ) as GPUTextureView | undefined;
      if (Is.exist(diffuseCubeTextureView)) {
        entriesForTexture.push({
          binding: IBL_DIFFUSE_CUBE_TEXTURE_BINDING_SLOT,
          resource: diffuseCubeTextureView,
        });
      } else {
        const dummyCubeTextureView = this.__webGpuResources.get(
          dummyBlackCubeTexture._textureViewResourceUid
        ) as GPUTextureView;
        entriesForTexture.push({
          binding: IBL_DIFFUSE_CUBE_TEXTURE_BINDING_SLOT,
          resource: dummyCubeTextureView,
        });
      }
      bindGroupLayoutEntriesForTexture.push({
        binding: IBL_DIFFUSE_CUBE_TEXTURE_BINDING_SLOT,
        texture: {
          viewDimension: 'cube',
        },
        visibility: GPUShaderStage.FRAGMENT,
      });
      const diffuseCubeSampler = this.__webGpuResources.get(
        Is.exist(meshRendererComponent.diffuseCubeMap)
          ? meshRendererComponent.diffuseCubeMap._samplerResourceUid
          : -1
      ) as GPUSampler | undefined;
      if (Is.exist(diffuseCubeSampler)) {
        entriesForSampler.push({
          binding: IBL_DIFFUSE_CUBE_TEXTURE_BINDING_SLOT,
          resource: diffuseCubeSampler,
        });
      } else {
        const dummyCubeSampler = this.__webGpuResources.get(
          dummyBlackCubeTexture._samplerResourceUid
        ) as GPUSampler;
        entriesForSampler.push({
          binding: IBL_DIFFUSE_CUBE_TEXTURE_BINDING_SLOT,
          resource: dummyCubeSampler,
        });
      }
      bindGroupLayoutEntriesForSampler.push({
        binding: IBL_DIFFUSE_CUBE_TEXTURE_BINDING_SLOT,
        sampler: {
          type: 'filtering',
        },
        visibility: GPUShaderStage.FRAGMENT,
      });

      // Specular IBL
      const specularCubeTextureView = this.__webGpuResources.get(
        Is.exist(meshRendererComponent.specularCubeMap)
          ? meshRendererComponent.specularCubeMap._textureViewResourceUid
          : -1
      ) as GPUTextureView | undefined;

      if (Is.exist(specularCubeTextureView)) {
        entriesForTexture.push({
          binding: IBL_SPECULAR_CUBE_TEXTURE_BINDING_SLOT,
          resource: specularCubeTextureView,
        });
      } else {
        const dummyCubeTextureView = this.__webGpuResources.get(
          dummyBlackCubeTexture._textureViewResourceUid
        ) as GPUTextureView;
        entriesForTexture.push({
          binding: IBL_SPECULAR_CUBE_TEXTURE_BINDING_SLOT,
          resource: dummyCubeTextureView,
        });
      }
      bindGroupLayoutEntriesForTexture.push({
        binding: IBL_SPECULAR_CUBE_TEXTURE_BINDING_SLOT,
        texture: {
          viewDimension: 'cube',
        },
        visibility: GPUShaderStage.FRAGMENT,
      });
      const specularCubeSampler = this.__webGpuResources.get(
        Is.exist(meshRendererComponent.specularCubeMap)
          ? meshRendererComponent.specularCubeMap._samplerResourceUid
          : -1
      ) as GPUSampler | undefined;
      if (Is.exist(specularCubeSampler)) {
        entriesForSampler.push({
          binding: IBL_SPECULAR_CUBE_TEXTURE_BINDING_SLOT,
          resource: specularCubeSampler,
        });
      } else {
        const dummyCubeSampler = this.__webGpuResources.get(
          dummyBlackCubeTexture._samplerResourceUid
        ) as GPUSampler;
        entriesForSampler.push({
          binding: IBL_SPECULAR_CUBE_TEXTURE_BINDING_SLOT,
          resource: dummyCubeSampler,
        });
      }
      bindGroupLayoutEntriesForSampler.push({
        binding: IBL_SPECULAR_CUBE_TEXTURE_BINDING_SLOT,
        sampler: {
          type: 'filtering',
        },
        visibility: GPUShaderStage.FRAGMENT,
      });

      // Texture
      const bindGroupLayoutDescForTexture: GPUBindGroupLayoutDescriptor = {
        entries: bindGroupLayoutEntriesForTexture,
      };
      const bindGroupLayoutForTexture = gpuDevice.createBindGroupLayout(
        bindGroupLayoutDescForTexture
      );
      const bindGroupForTexture = gpuDevice.createBindGroup({
        layout: bindGroupLayoutForTexture,
        entries: entriesForTexture,
      });
      this.__bindGroupTextureMap.set(renderPipelineId, bindGroupForTexture);
      this.__bindGroupLayoutTextureMap.set(renderPipelineId, bindGroupLayoutForTexture);

      // Sampler
      const bindGroupLayoutDescForSampler: GPUBindGroupLayoutDescriptor = {
        entries: bindGroupLayoutEntriesForSampler,
      };
      const bindGroupLayoutForSampler = gpuDevice.createBindGroupLayout(
        bindGroupLayoutDescForSampler
      );
      const bindGroupForSampler = gpuDevice.createBindGroup({
        layout: bindGroupLayoutForSampler,
        entries: entriesForSampler,
      });
      this.__bindGroupSamplerMap.set(renderPipelineId, bindGroupForSampler);
      this.__bindGroupLayoutSamplerMap.set(renderPipelineId, bindGroupLayoutForSampler);
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
      generateMipmap: boolean;
    }
  ): Promise<WebGPUResourceHandle> {
    imageData.crossOrigin = 'Anonymous';

    let handler = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    await imageData.decode();
    const imageBitmap = await createImageBitmap(imageData);

    handler = this.createTextureFromImageBitmapData(imageBitmap, {
      level,
      internalFormat,
      width,
      height,
      border,
      format,
      type,
      generateMipmap,
    });

    return handler;
  }

  /**
   * create a RenderTargetTexture
   * @param param0
   * @returns
   */
  createRenderTargetTexture({
    width,
    height,
    level,
    internalFormat,
    format,
    type,
  }: {
    width: Size;
    height: Size;
    level: Index;
    internalFormat: TextureParameterEnum;
    format: PixelFormatEnum;
    type: ComponentTypeEnum;
  }): WebGPUResourceHandle {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const textureDescriptor: GPUTextureDescriptor = {
      size: [width, height, 1],
      format: internalFormat.webgpu as GPUTextureFormat,
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
   * create Renderbuffer
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
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const from = this.__webGpuResources.get(fromTexture) as GPUTexture;
    const to = this.__webGpuResources.get(toTexture) as GPUTexture;
    if (this.__renderPassEncoder != null) {
      if (this.__renderBundleEncoder != null) {
        this.__renderPassEncoder.executeBundles([this.__renderBundleEncoder.finish()]);
      }
      this.__renderPassEncoder.end();
      this.__renderPassEncoder = undefined;
    }
    if (this.__commandEncoder == null) {
      this.__commandEncoder = gpuDevice.createCommandEncoder();
    }
    this.__commandEncoder.copyTextureToTexture(
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
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const texture = this.__webGpuResources.get(textureHandle) as GPUTexture;
    if (texture.mipLevelCount > 1) {
      return true;
    } else {
      return false;
    }
  }

  duplicateTextureAsMipmapped(
    fromTexture: WebGPUResourceHandle
  ): [WebGPUResourceHandle, WebGPUResourceHandle] {
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
      }
      this.__renderPassEncoder.end();
      this.__renderPassEncoder = undefined;
    }
    // Create a command encoder
    if (this.__commandEncoder == null) {
      this.__commandEncoder = gpuDevice.createCommandEncoder();
    }

    // Copy the texture to the new texture
    this.__commandEncoder.copyTextureToTexture(
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
  attachDepthBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable): void {}

  /**
   * attach the StencilBuffer to the FrameBufferObject
   * @param framebuffer a Framebuffer
   * @param renderable a StencilBuffer
   */
  attachStencilBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable): void {}

  /**
   * attach the depthStencilBuffer to the FrameBufferObject
   * @param framebuffer a Framebuffer
   * @param renderable a depthStencilBuffer
   */
  attachDepthStencilBufferToFrameBufferObject(
    framebuffer: FrameBuffer,
    renderable: IRenderable
  ): void {}

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
  deleteFrameBufferObject(frameBufferObjectHandle: WebGPUResourceHandle): void {}

  /**
   * attach the ColorBuffer to the FrameBufferObject
   * @param framebuffer a Framebuffer
   * @param renderable a ColorBuffer
   */
  attachColorBufferToFrameBufferObject(
    framebuffer: FrameBuffer,
    index: Index,
    renderable: IRenderable
  ) {
    return;
  }

  createTextureView2d(textureHandle: WebGPUResourceHandle): WebGPUResourceHandle {
    const texture = this.__webGpuResources.get(textureHandle) as GPUTexture;
    const textureView = texture.createView();
    const textureViewHandle = this.__registerResource(textureView);

    return textureViewHandle;
  }

  createTextureViewCube(textureHandle: WebGPUResourceHandle): WebGPUResourceHandle {
    const texture = this.__webGpuResources.get(textureHandle) as GPUTexture;
    const textureView = texture.createView({ dimension: 'cube' });
    const textureViewHandle = this.__registerResource(textureView);

    return textureViewHandle;
  }

  deleteTexture(textureHandle: WebGLResourceHandle) {
    this.flush();
    this.clearCache();

    const texture = this.__webGpuResources.get(textureHandle) as GPUTexture;

    if (texture != null) {
      texture.destroy();
      this.__webGpuResources.delete(textureHandle);
    }
  }

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

  resizeCanvas(width: Size, height: Size) {
    const canvas = this.__webGpuDeviceWrapper!.canvas;
    canvas.width = width;
    canvas.height = height;
    this.recreateSystemDepthTexture();
  }
}
