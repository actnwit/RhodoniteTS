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

export class WebGpuResourceRepository
  extends CGAPIResourceRepository
  implements ICGAPIResourceRepository
{
  private static __instance: WebGpuResourceRepository;
  private __webGpuResources: Map<WebGLResourceHandle, WebGpuResource> = new Map();
  private __webGpuRenderPipelineMap: Map<RenderPipelineId, GPURenderPipeline> = new Map();
  private __materialStateVersionMap: Map<RenderPipelineId, number> = new Map();
  private __resourceCounter: number = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __webGpuDeviceWrapper?: WebGpuDeviceWrapper;
  private __storageBuffer?: GPUBuffer;
  private __bindGroupStorageBuffer?: GPUBindGroup;
  private __bindGroupLayoutStorageBuffer?: GPUBindGroupLayout;
  private __bindGroupTexture?: GPUBindGroup;
  private __bindGroupLayoutTexture?: GPUBindGroupLayout;
  private __bindGroupSampler?: GPUBindGroup;
  private __bindGroupLayoutSampler?: GPUBindGroupLayout;
  private __commandEncoder?: GPUCommandEncoder;

  private constructor() {
    super();
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

  createTextureSampler({
    magFilter,
    minFilter,
    wrapS,
    wrapT,
    wrapR,
    anisotropy,
    isPremultipliedAlpha,
  }: {
    magFilter: TextureParameterEnum;
    minFilter: TextureParameterEnum;
    wrapS: TextureParameterEnum;
    wrapT: TextureParameterEnum;
    wrapR: TextureParameterEnum;
    anisotropy: boolean;
    isPremultipliedAlpha?: boolean;
  }): WebGPUResourceHandle {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const sampler = gpuDevice.createSampler({
      magFilter: magFilter.webgpu as GPUFilterMode,
      minFilter: minFilter.webgpu as GPUFilterMode,
      mipmapFilter: 'linear',
      addressModeU: wrapS.webgpu as GPUAddressMode,
      addressModeV: wrapT.webgpu as GPUAddressMode,
      addressModeW: wrapR.webgpu as GPUAddressMode,
      lodMinClamp: 0,
      lodMaxClamp: 0,
      maxAnisotropy: anisotropy ? 4 : 1,
    });

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
    const fsModule = gpuDevice.createShaderModule({
      code: fragmentShaderStr,
    });

    const modules = {
      vsModule,
      fsModule,
    };
    const modulesHandle = this.__registerResource(modules);

    return modulesHandle;
  }

  clearFrameBuffer(renderPass: RenderPass) {
    if (renderPass.toClearColorBuffer) {
      const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
      const context = this.__webGpuDeviceWrapper!.context;
      const textureView = context.getCurrentTexture().createView();
      const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
          {
            view: textureView,
            clearValue: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
            loadOp: 'load',
            storeOp: 'store',
          },
        ],
      };
    }
  }

  draw(primitive: Primitive, material: Material, renderPass: RenderPass) {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const context = this.__webGpuDeviceWrapper!.context;
    if (this.__commandEncoder == null) {
      this.__commandEncoder = gpuDevice.createCommandEncoder();
    }
    const textureView = context.getCurrentTexture().createView();

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
          loadOp: 'load',
          storeOp: 'store',
        },
      ],
    };
    const passEncoder = this.__commandEncoder.beginRenderPass(renderPassDescriptor);

    const pipeline = this.getOrCreateRenderPipeline(primitive, material, renderPass);

    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, this.__bindGroupStorageBuffer!);
    passEncoder.setBindGroup(1, this.__bindGroupTexture!);
    passEncoder.setBindGroup(2, this.__bindGroupSampler!);
    const VertexHandles = primitive._vertexHandles;
    if (VertexHandles == null) {
      return;
    }

    const mesh = primitive.mesh as Mesh;
    const variationVBO = this.__webGpuResources.get(mesh._variationVBOUid) as GPUBuffer;
    passEncoder.setVertexBuffer(0, variationVBO);
    VertexHandles.vboHandles.forEach((vboHandle, i) => {
      const vertexBuffer = this.__webGpuResources.get(vboHandle) as GPUBuffer;
      passEncoder.setVertexBuffer(i + 1, vertexBuffer);
    });

    if (primitive.hasIndices()) {
      const indicesBuffer = this.__webGpuResources.get(VertexHandles.iboHandle!) as GPUBuffer;
      const indexBitSize = primitive.getIndexBitSize();
      passEncoder.setIndexBuffer(indicesBuffer, indexBitSize);
      const indicesAccessor = primitive.indicesAccessor!;
      passEncoder.drawIndexed(indicesAccessor.elementCount, mesh.meshEntitiesInner.length);
    } else {
      const vertexCount = primitive.attributeAccessors[0].elementCount;
      passEncoder.draw(vertexCount, mesh.meshEntitiesInner.length);
    }
    passEncoder.end();
  }

  getOrCreateRenderPipeline(primitive: Primitive, material: Material, renderPass: RenderPass) {
    const renderPipelineId = `${primitive.primitiveUid} ${material.materialUID} ${renderPass.renderPassUID}`;

    if (this.__webGpuRenderPipelineMap.has(renderPipelineId)) {
      const materialStateVersion = this.__materialStateVersionMap.get(renderPipelineId);
      if (materialStateVersion === material.stateVersion) {
        return this.__webGpuRenderPipelineMap.get(renderPipelineId)!;
      } else {
        this.__webGpuRenderPipelineMap.delete(renderPipelineId);
        this.__materialStateVersionMap.delete(renderPipelineId);
      }
    }

    this.createBindGroup(material);

    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    const modules = this.__webGpuResources.get(material._shaderProgramUid) as {
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
        this.__bindGroupLayoutTexture!,
        this.__bindGroupLayoutSampler!,
      ],
    });

    const mode = primitive.primitiveMode;
    const topology = mode.getWebGPUTypeStr();
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
        targets: [
          // 0
          {
            // @location(0) in fragment shader
            format: presentationFormat,
          },
        ],
      },
      primitive: {
        topology: topology as GPUPrimitiveTopology,
      },
    });

    this.__webGpuRenderPipelineMap.set(renderPipelineId, pipeline);
    this.__materialStateVersionMap.set(renderPipelineId, material.stateVersion);

    return pipeline;
  }

  flush() {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    gpuDevice.queue.submit([this.__commandEncoder!.finish()]);
    this.__commandEncoder = undefined;
  }

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
    const imageBitmaps: (ImageBitmap | HTMLCanvasElement)[] = [];
    if (images[0].posX instanceof ImageBitmap || images[0].posX instanceof HTMLCanvasElement) {
      imageBitmaps.push(images[0].posX as any);
      imageBitmaps.push(images[0].negX as any);
      imageBitmaps.push(images[0].posY as any);
      imageBitmaps.push(images[0].negY as any);
      imageBitmaps.push(images[0].posZ as any);
      imageBitmaps.push(images[0].negZ as any);
    }
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;
    const cubemapTexture = gpuDevice.createTexture({
      dimension: '2d',
      // Create a 2d array texture.
      // Assume each image has the same size.
      size: [imageBitmaps[0].width, imageBitmaps[0].height, 6],
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });

    for (let i = 0; i < imageBitmaps.length; i++) {
      const imageBitmap = imageBitmaps[i];
      gpuDevice.queue.copyExternalImageToTexture(
        { source: imageBitmap },
        { texture: cubemapTexture, origin: [0, 0, i] },
        [imageBitmap.width, imageBitmap.height]
      );
    }

    const handle = this.__registerResource(cubemapTexture);
    const wrapS = TextureParameter.ClampToEdge;
    const wrapT = TextureParameter.ClampToEdge;
    const minFilter = TextureParameter.Linear;
    const magFilter = TextureParameter.Linear;

    const sampler = new Sampler({ wrapS, wrapT, minFilter, magFilter });
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

  createBindGroup(material: Material) {
    const gpuDevice = this.__webGpuDeviceWrapper!.gpuDevice;

    // Group 0 (Storage Buffer)
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
        if (CompositionType.isTexture(info.compositionType)) {
          const slot = value.value[0];
          const texture = value.value[1] as AbstractTexture;
          const sampler = value.value[2] as Sampler;

          // Texture
          const gpuTexture = this.__webGpuResources.get(texture._textureResourceUid) as GPUTexture;
          entriesForTexture.push({
            binding: slot,
            resource: gpuTexture.createView(),
          });
          bindGroupLayoutEntriesForTexture.push({
            binding: slot,
            texture: {
              viewDimension: '2d',
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

      const bindGroupLayoutDesc: GPUBindGroupLayoutDescriptor = {
        entries: bindGroupLayoutEntriesForTexture,
      };
      const bindGroupLayout = gpuDevice.createBindGroupLayout(bindGroupLayoutDesc);
      const uniformBindGroup = gpuDevice.createBindGroup({
        layout: bindGroupLayout,
        entries: entriesForTexture,
      });
      this.__bindGroupTexture = uniformBindGroup;
      this.__bindGroupLayoutTexture = bindGroupLayout;

      const bindGroupLayoutDescForSampler: GPUBindGroupLayoutDescriptor = {
        entries: bindGroupLayoutEntriesForSampler,
      };
      const bindGroupLayoutForSampler = gpuDevice.createBindGroupLayout(
        bindGroupLayoutDescForSampler
      );
      const uniformBindGroupForSampler = gpuDevice.createBindGroup({
        layout: bindGroupLayoutForSampler,
        entries: entriesForSampler,
      });
      this.__bindGroupSampler = uniformBindGroupForSampler;
      this.__bindGroupLayoutSampler = bindGroupLayoutForSampler;
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
}
