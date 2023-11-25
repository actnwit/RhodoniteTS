/// <reference types="@webgpu/types" />
import { ComponentTypeEnum } from '../foundation/definitions/ComponentType';
import { PixelFormatEnum } from '../foundation/definitions/PixelFormat';
import { TextureParameterEnum } from '../foundation/definitions/TextureParameter';
import { VertexAttributeEnum } from '../foundation/definitions/VertexAttribute';
import { Primitive } from '../foundation/geometry/Primitive';
import { Material } from '../foundation/materials/core/Material';
import { Accessor } from '../foundation/memory/Accessor';
import { CGAPIResourceRepository, DirectTextureData, ICGAPIResourceRepository, ImageBitmapData } from '../foundation/renderer/CGAPIResourceRepository';
import { RenderPass } from '../foundation/renderer/RenderPass';
import { Sampler } from '../foundation/textures/Sampler';
import { Byte, Count, Index, Size, TypedArray, WebGPUResourceHandle } from '../types/CommonTypes';
import { VertexHandles } from '../webgl/WebGLResourceRepository';
import { AttributeNames } from '../webgl/types/CommonTypes';
import { WebGpuDeviceWrapper } from './WebGpuDeviceWrapper';
import { HdriFormatEnum } from '../foundation/definitions/HdriFormat';
import { MeshRendererComponent } from '../foundation';
export declare type WebGpuResource = GPUTexture | GPUBuffer | GPUSampler | GPUTextureView | GPUBufferBinding | GPURenderPipeline | GPUComputePipeline | GPUBindGroupLayout | GPUBindGroup | GPUShaderModule | GPUCommandEncoder | GPUComputePassEncoder | GPURenderPassEncoder | GPUComputePipeline | GPURenderPipeline | GPUQuerySet | object;
export declare class WebGpuResourceRepository extends CGAPIResourceRepository implements ICGAPIResourceRepository {
    private static __instance;
    private __webGpuResources;
    private __webGpuRenderPipelineMap;
    private __materialStateVersionMap;
    private __resourceCounter;
    private __webGpuDeviceWrapper?;
    private __storageBuffer?;
    private __storageBlendShapeBuffer?;
    private __bindGroupStorageBuffer?;
    private __bindGroupLayoutStorageBuffer?;
    private __RenderBundleMap;
    private __bindGroupTextureMap;
    private __bindGroupLayoutTextureMap;
    private __bindGroupSamplerMap;
    private __bindGroupLayoutSamplerMap;
    private __commandEncoder?;
    private __systemDepthTexture?;
    private __systemDepthTextureView?;
    private __uniformMorphOffsetsBuffer?;
    private __uniformMorphWeightsBuffer?;
    private __renderPassEncoder?;
    private constructor();
    addWebGpuDeviceWrapper(webGpuDeviceWrapper: WebGpuDeviceWrapper): void;
    static getInstance(): WebGpuResourceRepository;
    private getResourceNumber;
    private __registerResource;
    getCanvasSize(): [Size, Size];
    /**
     * create a WebGPU Texture
     * @param imageData - an ImageBitmapData
     * @param paramObject - a parameter object
     * @returns
     */
    createTextureFromImageBitmapData(imageData: ImageBitmapData, { level, internalFormat, width, height, border, format, type, generateMipmap, }: {
        level: Index;
        internalFormat: TextureParameterEnum;
        width: Size;
        height: Size;
        border: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        generateMipmap: boolean;
    }): WebGPUResourceHandle;
    /**
     * create a WebGPU Texture Mipmaps
     *
     * @remarks
     * Thanks to: https://toji.dev/webgpu-best-practices/img-textures#generating-mipmaps
     * @param texture - a texture
     * @param textureDescriptor - a texture descriptor
     * @param depthOrArrayLayers - depth or array layers
     */
    generateMipmaps(texture: GPUTexture, textureDescriptor: GPUTextureDescriptor, depthOrArrayLayers: number): void;
    createTextureSampler({ magFilter, minFilter, wrapS, wrapT, wrapR, anisotropy, isPremultipliedAlpha, }: {
        magFilter: TextureParameterEnum;
        minFilter: TextureParameterEnum;
        wrapS: TextureParameterEnum;
        wrapT: TextureParameterEnum;
        wrapR: TextureParameterEnum;
        anisotropy: boolean;
        isPremultipliedAlpha?: boolean;
    }): WebGPUResourceHandle;
    /**
     * create a WebGPU Vertex Buffer
     * @param accessor - an accessor
     * @returns
     */
    createVertexBuffer(accessor: Accessor): WebGPUResourceHandle;
    /**
     * create a WebGPU Vertex Buffer
     * @param typedArray - a typed array
     * @returns a WebGPUResourceHandle
     */
    createVertexBufferFromTypedArray(typedArray: TypedArray): WebGPUResourceHandle;
    /**
     * create a WebGPU Index Buffer
     * @param accessor - an accessor
     * @returns a WebGPUResourceHandle
     */
    createIndexBuffer(accessor: Accessor): WebGPUResourceHandle;
    updateVertexBuffer(accessor: Accessor, resourceHandle: WebGPUResourceHandle): void;
    updateIndexBuffer(accessor: Accessor, resourceHandle: WebGPUResourceHandle): void;
    deleteVertexBuffer(resourceHandle: WebGPUResourceHandle): void;
    /**
     * create a VertexBuffer and IndexBuffer
     * @param primitive
     * @returns
     */
    createVertexBufferAndIndexBuffer(primitive: Primitive): VertexHandles;
    /**
     * update the VertexBuffer and IndexBuffer
     * @param primitive
     * @param vertexHandles
     */
    updateVertexBufferAndIndexBuffer(primitive: Primitive, vertexHandles: VertexHandles): void;
    deleteVertexDataResources(vertexHandles: VertexHandles): void;
    /**
     * set the VertexData to the Pipeline
     */
    setVertexDataToPipeline({ vaoHandle, iboHandle, vboHandles, }: {
        vaoHandle: WebGPUResourceHandle;
        iboHandle?: WebGPUResourceHandle;
        vboHandles: Array<WebGPUResourceHandle>;
    }, primitive: Primitive, instanceIDBufferUid?: WebGPUResourceHandle): void;
    /**
     * create a shader program
     * @param param0
     * @returns
     */
    createShaderProgram({ material, vertexShaderStr, fragmentShaderStr, attributeNames, attributeSemantics, onError, }: {
        material: Material;
        vertexShaderStr: string;
        fragmentShaderStr: string;
        attributeNames: AttributeNames;
        attributeSemantics: VertexAttributeEnum[];
        onError?: (message: string) => void;
    }): number;
    clearFrameBuffer(renderPass: RenderPass): void;
    draw(primitive: Primitive, material: Material, renderPass: RenderPass): void;
    getOrCreateRenderPipeline(renderPipelineId: string, primitive: Primitive, material: Material, renderPass: RenderPass, meshRendererComponent: MeshRendererComponent): [GPURenderPipeline, boolean];
    flush(): void;
    /**
     * Create Cube Texture from image files.
     * @param baseUri the base uri to load images;
     * @param mipLevelCount the number of mip levels (include root level). if no mipmap, the value should be 1;
     * @returns the WebGLResourceHandle for the generated Cube Texture
     */
    createCubeTextureFromFiles(baseUri: string, mipLevelCount: Count, isNamePosNeg: boolean, hdriFormat: HdriFormatEnum): Promise<[number, Sampler]>;
    createCubeTexture(mipLevelCount: Count, images: Array<{
        posX: DirectTextureData;
        negX: DirectTextureData;
        posY: DirectTextureData;
        negY: DirectTextureData;
        posZ: DirectTextureData;
        negZ: DirectTextureData;
    }>, width: Size, height: Size): [number, Sampler];
    createStorageBuffer(inputArray: Float32Array): number;
    updateStorageBuffer(storageBufferHandle: WebGPUResourceHandle, inputArray: Float32Array, updateByteLength: Byte): void;
    createStorageBlendShapeBuffer(inputArray: Float32Array): number;
    updateStorageBlendShapeBuffer(storageBufferHandle: WebGPUResourceHandle, inputArray: Float32Array, updateByteLength: Byte): void;
    createUniformMorphOffsetsBuffer(): number;
    updateUniformMorphOffsetsBuffer(inputArray: Uint32Array): void;
    createUniformMorphWeightsBuffer(): number;
    updateUniformMorphWeightsBuffer(inputArray: Float32Array): void;
    createBindGroup(renderPipelineId: string, material: Material, primitive: Primitive, meshRendererComponent: MeshRendererComponent): void;
    /**
     * create a Texture
     * @param imageData
     * @param param1
     * @returns
     */
    createTextureFromHTMLImageElement(imageData: HTMLImageElement, { level, internalFormat, width, height, border, format, type, generateMipmap, }: {
        level: Index;
        internalFormat: TextureParameterEnum;
        width: Size;
        height: Size;
        border: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        generateMipmap: boolean;
    }): Promise<WebGPUResourceHandle>;
    recreateSystemDepthTexture(): void;
    resizeCanvas(width: Size, height: Size): void;
}
