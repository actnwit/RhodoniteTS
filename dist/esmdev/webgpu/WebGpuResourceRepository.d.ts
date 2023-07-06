/// <reference types="@webgpu/types" />
import { ComponentTypeEnum } from '../foundation/definitions/ComponentType';
import { PixelFormatEnum } from '../foundation/definitions/PixelFormat';
import { TextureParameterEnum } from '../foundation/definitions/TextureParameter';
import { Primitive } from '../foundation/geometry/Primitive';
import { Accessor } from '../foundation/memory/Accessor';
import { CGAPIResourceRepository, ICGAPIResourceRepository, ImageBitmapData } from '../foundation/renderer/CGAPIResourceRepository';
import { Index, Size, TypedArray, WebGLResourceHandle, WebGPUResourceHandle } from '../types/CommonTypes';
import { VertexHandles } from '../webgl/WebGLResourceRepository';
import { WebGpuDeviceWrapper } from './WebGpuDeviceWrapper';
export declare type WebGpuResource = GPUTexture | GPUBuffer | GPUSampler | GPUTextureView | GPUBufferBinding | GPURenderPipeline | GPUComputePipeline | GPUBindGroupLayout | GPUBindGroup | GPUShaderModule | GPUCommandEncoder | GPUComputePassEncoder | GPURenderPassEncoder | GPUComputePipeline | GPURenderPipeline | GPUQuerySet;
export declare class WebGpuResourceRepository extends CGAPIResourceRepository implements ICGAPIResourceRepository {
    private __webGpuResources;
    private __webGpuDeviceWrapper;
    private __resourceCounter;
    constructor(webGpuDeviceWrapper: WebGpuDeviceWrapper);
    private getResourceNumber;
    private __registerResource;
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
        magFilter: TextureParameterEnum;
        minFilter: TextureParameterEnum;
        wrapS: TextureParameterEnum;
        wrapT: TextureParameterEnum;
        generateMipmap: boolean;
        anisotropy: boolean;
        isPremultipliedAlpha: boolean;
    }): WebGLResourceHandle;
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
}
