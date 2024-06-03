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
import { Count, Index, Size, TypedArray, WebGLResourceHandle, WebGPUResourceHandle } from '../types/CommonTypes';
import { VertexHandles } from '../webgl/WebGLResourceRepository';
import { AttributeNames } from '../webgl/types/CommonTypes';
import { WebGpuDeviceWrapper } from './WebGpuDeviceWrapper';
import { HdriFormatEnum } from '../foundation/definitions/HdriFormat';
import { CubeTexture } from '../foundation/textures/CubeTexture';
import { IRenderable } from '../foundation/textures/IRenderable';
import { FrameBuffer } from '../foundation/renderer/FrameBuffer';
export type WebGpuResource = GPUTexture | GPUBuffer | GPUSampler | GPUTextureView | GPUBufferBinding | GPURenderPipeline | GPUComputePipeline | GPUBindGroupLayout | GPUBindGroup | GPUShaderModule | GPUCommandEncoder | GPUComputePassEncoder | GPURenderPassEncoder | GPUComputePipeline | GPURenderPipeline | GPUQuerySet | object;
export declare class WebGpuResourceRepository extends CGAPIResourceRepository implements ICGAPIResourceRepository {
    private static __instance;
    private __webGpuResources;
    private __resourceCounter;
    private __webGpuDeviceWrapper?;
    private __storageBuffer?;
    private __storageBlendShapeBuffer?;
    private __bindGroupStorageBuffer?;
    private __bindGroupLayoutStorageBuffer?;
    private __webGpuRenderPipelineMap;
    private __materialStateVersionMap;
    private __bindGroupTextureMap;
    private __bindGroupLayoutTextureMap;
    private __bindGroupSamplerMap;
    private __bindGroupLayoutSamplerMap;
    private __commandEncoder?;
    private __renderBundles;
    private __renderBundleEncoder?;
    private __systemDepthTexture?;
    private __systemDepthTextureView?;
    private __uniformMorphOffsetsBuffer?;
    private __uniformMorphWeightsBuffer?;
    private __renderPassEncoder?;
    private __generateMipmapsShaderModule?;
    private __generateMipmapsPipeline?;
    private __generateMipmapsFormat?;
    private __generateMipmapsSampler?;
    private __contextCurrentTextureView?;
    private __lastMaterialsUpdateCount;
    private __lastCurrentCameraComponentSid;
    private __lastEntityRepositoryUpdateCount;
    private __lastPrimitivesMaterialVariantUpdateCount;
    private __lastMeshRendererComponentsUpdateCount;
    private constructor();
    clearCache(): void;
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
    createTextureFromDataUri(dataUri: string, { level, internalFormat, border, format, type, generateMipmap, }: {
        level: Index;
        internalFormat: TextureParameterEnum;
        border: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        generateMipmap: boolean;
    }): Promise<WebGPUResourceHandle>;
    generateMipmaps2d(textureHandle: WebGPUResourceHandle, width: number, height: number): void;
    getTexturePixelData(textureHandle: WebGPUResourceHandle, width: number, height: number, frameBufferUid: WebGPUResourceHandle, colorAttachmentIndex: number): Promise<Uint8Array>;
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
    createTextureSampler({ magFilter, minFilter, wrapS, wrapT, wrapR, anisotropy, isPremultipliedAlpha, shadowCompareMode, }: {
        magFilter: TextureParameterEnum;
        minFilter: TextureParameterEnum;
        wrapS: TextureParameterEnum;
        wrapT: TextureParameterEnum;
        wrapR: TextureParameterEnum;
        anisotropy: boolean;
        isPremultipliedAlpha?: boolean;
        shadowCompareMode: boolean;
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
    private __checkShaderCompileStatus;
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
    draw(primitive: Primitive, material: Material, renderPass: RenderPass, cameraId: number, isOpaque: boolean): void;
    private createRenderBundleEncoder;
    private createRenderPassEncoder;
    private __toClearRenderBundles;
    executeRenderBundle(renderPass: RenderPass): boolean;
    finishRenderBundleEncoder(renderPass: RenderPass): void;
    getOrCreateRenderPipeline(renderPipelineId: string, primitive: Primitive, material: Material, renderPass: RenderPass, cameraId: number, isOpaque: boolean, diffuseCubeMap?: CubeTexture, specularCubeMap?: CubeTexture): [GPURenderPipeline, boolean];
    flush(): void;
    /**
     * Create Cube Texture from image files.
     * @param baseUri the base uri to load images;
     * @param mipLevelCount the number of mip levels (include root level). if no mipmap, the value should be 1;
     * @returns the WebGLResourceHandle for the generated Cube Texture
     */
    createCubeTextureFromFiles(baseUri: string, mipLevelCount: Count, isNamePosNeg: boolean, hdriFormat: HdriFormatEnum): Promise<[number, Sampler]>;
    /**
     * create a CubeTexture
     *
     * @param mipLevelCount
     * @param images
     * @param width
     * @param height
     * @returns resource handle
     */
    createCubeTexture(mipLevelCount: Count, images: Array<{
        posX: DirectTextureData;
        negX: DirectTextureData;
        posY: DirectTextureData;
        negY: DirectTextureData;
        posZ: DirectTextureData;
        negZ: DirectTextureData;
    }>, width: Size, height: Size): [number, Sampler];
    createStorageBuffer(inputArray: Float32Array): number;
    updateStorageBuffer(storageBufferHandle: WebGPUResourceHandle, inputArray: Float32Array, updateComponentSize: Count): void;
    createStorageBlendShapeBuffer(inputArray: Float32Array): number;
    updateStorageBlendShapeBuffer(storageBufferHandle: WebGPUResourceHandle, inputArray: Float32Array, updateComponentSize: Count): void;
    createUniformMorphOffsetsBuffer(): number;
    updateUniformMorphOffsetsBuffer(inputArray: Uint32Array, elementNum: Count): void;
    createUniformMorphWeightsBuffer(): number;
    updateUniformMorphWeightsBuffer(inputArray: Float32Array, elementNum: Count): void;
    private __createBindGroup;
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
    private __createTextureInner;
    /**
     * create a RenderTargetTexture
     * @param param0
     * @returns
     */
    createRenderTargetTexture({ width, height, level, internalFormat, format, type, }: {
        width: Size;
        height: Size;
        level: Index;
        internalFormat: TextureParameterEnum;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
    }): WebGPUResourceHandle;
    /**
     * create Renderbuffer
     */
    createRenderBuffer(width: Size, height: Size, internalFormat: TextureParameterEnum, isMSAA: boolean, sampleCountMSAA: Count): WebGPUResourceHandle;
    /**
     * delete a RenderBuffer
     * @param renderBufferUid
     */
    deleteRenderBuffer(renderBufferUid: WebGPUResourceHandle): void;
    /**
     * copy Texture Data
     * @param fromTexture
     * @param toTexture
     */
    copyTextureData(fromTexture: WebGPUResourceHandle, toTexture: WebGPUResourceHandle): void;
    isMippmappedTexture(textureHandle: WebGPUResourceHandle): boolean;
    duplicateTextureAsMipmapped(fromTexture: WebGPUResourceHandle): [WebGPUResourceHandle, WebGPUResourceHandle];
    /**
     * attach the DepthBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param renderable a DepthBuffer
     */
    attachDepthBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable): void;
    /**
     * attach the StencilBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param renderable a StencilBuffer
     */
    attachStencilBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable): void;
    /**
     * attach the depthStencilBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param renderable a depthStencilBuffer
     */
    attachDepthStencilBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable): void;
    /**
     * create a FrameBufferObject
     * @returns
     */
    createFrameBufferObject(): number;
    /**
     * delete a FrameBufferObject
     * @param frameBufferObjectHandle
     */
    deleteFrameBufferObject(frameBufferObjectHandle: WebGPUResourceHandle): void;
    /**
     * attach the ColorBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param renderable a ColorBuffer
     */
    attachColorBufferToFrameBufferObject(framebuffer: FrameBuffer, index: Index, renderable: IRenderable): void;
    createTextureView2d(textureHandle: WebGPUResourceHandle): WebGPUResourceHandle;
    createTextureViewCube(textureHandle: WebGPUResourceHandle): WebGPUResourceHandle;
    deleteTexture(textureHandle: WebGLResourceHandle): void;
    recreateSystemDepthTexture(): void;
    resizeCanvas(width: Size, height: Size): void;
}
