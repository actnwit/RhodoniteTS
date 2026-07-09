import type { Config } from '../foundation/core/Config';
import { type ComponentTypeEnum } from '../foundation/definitions/ComponentType';
import type { CompressionTextureTypeEnum } from '../foundation/definitions/CompressionTextureType';
import { type HdriFormatEnum } from '../foundation/definitions/HdriFormat';
import { type PixelFormatEnum } from '../foundation/definitions/PixelFormat';
import { type TextureFormatEnum } from '../foundation/definitions/TextureFormat';
import { type TextureParameterEnum } from '../foundation/definitions/TextureParameter';
import { Primitive } from '../foundation/geometry/Primitive';
import type { Material } from '../foundation/materials/core/Material';
import type { Vector4 } from '../foundation/math/Vector4';
import type { Accessor } from '../foundation/memory/Accessor';
import type { Buffer } from '../foundation/memory/Buffer';
import { CGAPIResourceRepository, type DirectTextureData, type ICGAPIResourceRepository, type ImageBitmapData } from '../foundation/renderer/CGAPIResourceRepository';
import type { FrameBuffer } from '../foundation/renderer/FrameBuffer';
import type { RenderPass } from '../foundation/renderer/RenderPass';
import type { Engine } from '../foundation/system/Engine';
import { CubeTexture } from '../foundation/textures/CubeTexture';
import type { IRenderable } from '../foundation/textures/IRenderable';
import { RenderTargetTextureCube } from '../foundation/textures/RenderTargetTextureCube';
import { Sampler } from '../foundation/textures/Sampler';
import type { BasisFile } from '../types/BasisTexture';
import type { Count, Index, Size, TypedArray, WebGLResourceHandle, WebGPUResourceHandle } from '../types/CommonTypes';
import type { TextureData, VertexHandles } from '../webgl/WebGLResourceRepository';
import type { WebGpuDeviceWrapper } from './WebGpuDeviceWrapper';
export type WebGpuResource = GPUTexture | GPUBuffer | GPUSampler | GPUTextureView | GPUBufferBinding | GPURenderPipeline | GPUComputePipeline | GPUBindGroupLayout | GPUBindGroup | GPUShaderModule | GPUCommandEncoder | GPUComputePassEncoder | GPURenderPassEncoder | GPUComputePipeline | GPURenderPipeline | GPUQuerySet | object;
type DRAW_PARAMETERS_IDENTIFIER = string;
/**
 * WebGPU Resource Repository that manages WebGPU resources and provides rendering functionality.
 * This class serves as a central hub for creating, managing, and utilizing WebGPU resources
 * such as textures, buffers, pipelines, and render passes.
 *
 * @extends CGAPIResourceRepository
 * @implements ICGAPIResourceRepository
 */
export declare class WebGpuResourceRepository extends CGAPIResourceRepository implements ICGAPIResourceRepository {
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
    private __bindGroupsUniformDrawParameters;
    private __bindGroupLayoutUniformDrawParameters?;
    private __uniformDrawParametersBuffers;
    private __commandEncoder?;
    private __renderBundles;
    private __renderBundleEncoder?;
    private __renderBundleEncoderKey?;
    private __systemDepthTexture?;
    private __systemDepthTextureView?;
    private __uniformMorphOffsetsBuffer?;
    private __uniformMorphWeightsBuffer?;
    private __renderPassEncoder?;
    private __generateMipmapsShaderModule?;
    private __generateMipmapsPipeline?;
    private __generateMipmapsFormat?;
    private __generateMipmapsSampler?;
    private __generateMipmapsBindGroupLayout?;
    private __contextCurrentTextureView?;
    private __lastMaterialsUpdateCount;
    private __lastCurrentCameraComponentSid;
    private __lastEntityRepositoryUpdateCount;
    private __lastPrimitivesMaterialVariantUpdateCount;
    private __lastMeshRendererComponentsUpdateCount;
    private __srcTextureViewsForGeneratingMipmaps;
    private __dstTextureViewsForGeneratingMipmaps;
    private __bindGroupsForGeneratingMipmaps;
    private static __drawParametersUint32Array;
    private constructor();
    private static __assertArrayBufferView;
    /**
     * Clears all cached resources including render pipelines, bind groups, and render bundles.
     * This method should be called when resources need to be recreated or when the rendering context changes.
     */
    clearCache(): void;
    /**
     * Adds a WebGPU device wrapper to the repository and initializes the command encoder.
     * This must be called before using any WebGPU functionality.
     *
     * @param webGpuDeviceWrapper - The WebGPU device wrapper containing the device and context
     */
    addWebGpuDeviceWrapper(webGpuDeviceWrapper: WebGpuDeviceWrapper): void;
    /**
     * Returns the WebGPU device wrapper instance.
     *
     * @returns The WebGPU device wrapper
     * @throws Error if the device wrapper has not been initialized
     */
    getWebGpuDeviceWrapper(): WebGpuDeviceWrapper;
    /**
     * Returns the singleton instance of WebGpuResourceRepository.
     * Creates a new instance if one doesn't exist.
     *
     * @returns The singleton instance
     */
    static init(): WebGpuResourceRepository;
    /**
     * Generates a unique resource number for tracking WebGPU resources.
     *
     * @returns A unique resource handle number
     */
    private getResourceNumber;
    /**
     * Registers a WebGPU resource and assigns it a unique handle.
     *
     * @param obj - The WebGPU resource to register
     * @returns The unique handle for the registered resource
     */
    private __registerResource;
    /**
     * Gets the current canvas size as a tuple of width and height.
     *
     * @returns A tuple containing [width, height] of the canvas
     */
    getCanvasSize(): [Size, Size];
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
    createTextureFromImageBitmapData(imageData: ImageBitmapData, { internalFormat, width, height, generateMipmap, }: {
        internalFormat: TextureParameterEnum;
        width: Size;
        height: Size;
        generateMipmap: boolean;
    }): Promise<WebGPUResourceHandle>;
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
    createTextureFromDataUri(dataUri: string, { internalFormat, generateMipmap, }: {
        internalFormat: TextureParameterEnum;
        generateMipmap: boolean;
    }): Promise<WebGPUResourceHandle>;
    /**
     * Generates mipmaps for a 2D texture using the specified dimensions.
     * This method creates all mipmap levels from the base texture.
     *
     * @param textureHandle - Handle to the texture resource
     * @param width - Width of the base texture level
     * @param height - Height of the base texture level
     */
    generateMipmaps2d(textureHandle: WebGPUResourceHandle, width: number, height: number): void;
    /**
     * Generates mipmaps for a cube texture using the specified dimensions.
     * This method creates all mipmap levels for all 6 faces of the cube texture.
     *
     * @param textureHandle - Handle to the cube texture resource
     * @param width - Width of the base texture level
     * @param height - Height of the base texture level
     */
    generateMipmapsCube(textureHandle: WebGPUResourceHandle, width: number, height: number): void;
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
    getTexturePixelData(textureHandle: WebGPUResourceHandle, width: number, height: number, _frameBufferUid: WebGPUResourceHandle, _colorAttachmentIndex: number): Promise<Uint8Array>;
    /**
     * Reads pixel data directly from a 2D texture (synchronous version).
     * Note: WebGPU does not support synchronous texture readback.
     * This method throws an error - use getPixelDataFromTextureAsync instead.
     */
    getPixelDataFromTexture(_textureHandle: WebGPUResourceHandle, _x: number, _y: number, _width: number, _height: number): Uint8Array;
    /**
     * Reads pixel data directly from a 2D texture asynchronously.
     * This method uses a render-based approach to avoid requiring COPY_SRC usage on the source texture.
     * It renders the texture to a temporary render target with COPY_SRC, then reads from that.
     *
     * @param textureHandle - Handle to the texture to read from
     * @param x - X offset to start reading from (currently ignored, reads from 0)
     * @param y - Y offset to start reading from (currently ignored, reads from 0)
     * @param width - Width of the region to read
     * @param height - Height of the region to read
     * @returns Promise resolving to the pixel data as a Uint8Array in RGBA format
     */
    getPixelDataFromTextureAsync(textureHandle: WebGPUResourceHandle, _x: number, _y: number, width: number, height: number): Promise<Uint8Array>;
    /**
     * Reads pixel data from a specific face of a cube texture.
     * Uses a shader-based approach to sample the cubemap and render to a 2D texture,
     * then copies the result to a buffer for CPU access.
     *
     * @param textureHandle - Handle to the cube texture
     * @param width - Width of the face texture
     * @param height - Height of the face texture
     * @param faceIndex - Index of the cube face (0=+X, 1=-X, 2=+Y, 3=-Y, 4=+Z, 5=-Z)
     * @returns Promise resolving to the pixel data as a Uint8Array (RGBA format)
     */
    getCubeTexturePixelData(textureHandle: WebGPUResourceHandle, width: number, height: number, faceIndex: number): Promise<Uint8Array>;
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
    generateMipmaps(texture: GPUTexture, textureDescriptor: GPUTextureDescriptor): void;
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
    createTextureSampler({ magFilter, minFilter, wrapS, wrapT, wrapR, anisotropy, }: {
        magFilter: TextureParameterEnum;
        minFilter: TextureParameterEnum;
        wrapS: TextureParameterEnum;
        wrapT: TextureParameterEnum;
        wrapR: TextureParameterEnum;
        anisotropy: boolean;
    }): WebGPUResourceHandle;
    /**
     * Creates a WebGPU vertex buffer from an accessor containing vertex data.
     * The buffer is created with the appropriate size and the data is uploaded immediately.
     *
     * @param accessor - Accessor containing the vertex data to upload
     * @returns Handle to the created vertex buffer
     */
    createVertexBuffer(accessor: Accessor): WebGPUResourceHandle;
    /**
     * Creates a WebGPU vertex buffer from a typed array.
     * This is a more direct method when you have raw typed array data.
     *
     * @param typedArray - The typed array containing vertex data
     * @returns Handle to the created vertex buffer resource
     */
    createVertexBufferFromTypedArray(typedArray: TypedArray): WebGPUResourceHandle;
    /**
     * Creates a WebGPU index buffer from an accessor containing index data.
     * Automatically converts UnsignedByte indices to UnsignedShort since WebGPU
     * doesn't support 8-bit index buffers.
     *
     * @param accessor - Accessor containing the index data to upload
     * @returns Handle to the created index buffer resource
     */
    createIndexBuffer(accessor: Accessor): WebGPUResourceHandle;
    /**
     * Updates the data in an existing vertex buffer with new data from an accessor.
     * This method maps the buffer for writing and uploads the new data.
     *
     * @param accessor - Accessor containing the new vertex data
     * @param resourceHandle - Handle to the existing vertex buffer to update
     * @throws Error if the vertex buffer is not found
     */
    updateVertexBuffer(accessor: Accessor, resourceHandle: WebGPUResourceHandle): void;
    /**
     * Updates the data in an existing index buffer with new data from an accessor.
     * Automatically handles conversion of UnsignedByte indices to UnsignedShort if needed.
     *
     * @param accessor - Accessor containing the new index data
     * @param resourceHandle - Handle to the existing index buffer to update
     * @throws Error if the index buffer is not found
     */
    updateIndexBuffer(accessor: Accessor, resourceHandle: WebGPUResourceHandle): void;
    /**
     * Deletes a vertex buffer and removes it from the resource registry.
     * This destroys the GPU buffer and frees its memory.
     *
     * @param resourceHandle - Handle to the vertex buffer to delete
     * @throws Error if the vertex buffer is not found
     */
    deleteVertexBuffer(resourceHandle: WebGPUResourceHandle): void;
    /**
     * Creates vertex and index buffers for a primitive and returns their handles.
     * This method processes all vertex attributes and creates appropriate buffers
     * while tracking which attributes are present.
     *
     * @param primitive - The primitive containing vertex and index data
     * @returns Object containing buffer handles and attribute flags
     */
    createVertexBufferAndIndexBuffer(primitive: Primitive): VertexHandles;
    /**
     * Updates the vertex and index buffers for a primitive with new data.
     * This method updates all existing buffers with fresh data from the primitive.
     *
     * @param primitive - The primitive containing the updated vertex and index data
     * @param vertexHandles - Object containing the handles to the buffers to update
     */
    updateVertexBufferAndIndexBuffer(primitive: Primitive, vertexHandles: VertexHandles): void;
    /**
     * Deletes all vertex data resources (vertex and index buffers) associated with vertex handles.
     * This method destroys both vertex buffers and index buffers to free GPU memory.
     *
     * @param vertexHandles - Object containing handles to the vertex data resources to delete
     */
    deleteVertexDataResources(vertexHandles: VertexHandles): void;
    /**
     * Configures vertex data layout for the rendering pipeline.
     * This method sets up vertex buffer layouts including both per-vertex and per-instance data.
     *
     * @param bufferHandles - Object containing vertex array object, index buffer, and vertex buffer handles
     * @param bufferHandles.vboHandles - Array of vertex buffer handles
     * @param primitive - The primitive containing vertex attribute information
     */
    setVertexDataToPipeline({ vboHandles, }: {
        vboHandles: Array<WebGPUResourceHandle>;
    }, primitive: Primitive): void;
    /**
     * Checks and logs shader compilation status and error messages.
     * This method provides detailed debugging information when shader compilation fails.
     *
     * @param engine - The engine instance for logging
     * @param materialTypeName - Name of the material type for debugging
     * @param shaderText - The shader source code that was compiled
     * @param info - WebGPU compilation info containing messages and errors
     * @returns True if compilation was successful, false otherwise
     */
    private __checkShaderCompileStatus;
    /**
     * Creates shader modules (vertex and fragment) from shader source code.
     * This method compiles both vertex and fragment shaders and returns their handles.
     *
     * @param params - Configuration object for shader creation
     * @param params.engine - The engine instance for logging
     * @param params.material - The material that will use these shaders
     * @param params.vertexShaderStr - WGSL vertex shader source code
     * @param params.fragmentShaderStr - WGSL fragment shader source code
     * @returns Handle to the shader program containing both modules
     */
    createShaderProgram({ config, engine, material, vertexShaderStr, fragmentShaderStr, }: {
        config: Config;
        engine: Engine;
        material: Material;
        vertexShaderStr: string;
        fragmentShaderStr: string;
    }): number;
    /**
     * Clears the framebuffer with the specified clear values.
     * This method is executed when the render pass has no entities to render,
     * but still needs to perform clear operations.
     *
     * @param renderPass - The render pass containing clear settings and target framebuffer
     */
    clearFrameBuffer(engine: Engine, renderPass: RenderPass, displayIdx: number): void;
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
    draw(engine: Engine, primitive: Primitive, material: Material, renderPass: RenderPass, cameraId: number, zWrite: boolean, displayIdx: number): void;
    /**
     * Creates a render bundle encoder for efficient rendering.
     * Render bundles allow pre-recording of rendering commands for better performance.
     *
     * @param renderPass - The render pass that will use this render bundle encoder
     */
    private __getRenderBundleDescriptor;
    getEffekseerRenderPassOptions(engine: Engine, renderPass?: RenderPass, displayIdx?: number): {
        colorFormat?: GPUTextureFormat;
        depthFormat?: GPUTextureFormat;
    };
    getOrCreateRenderPassEncoderForEffekseerExternalRendering(engine: Engine, renderPass: RenderPass, displayIdx: number): GPURenderPassEncoder | undefined;
    createRenderBundleEncoder(engine: Engine, renderPass: RenderPass, displayIdx: number): void;
    /**
     * Creates a render pass encoder for immediate rendering commands.
     * This encoder is used for recording rendering commands that will be executed immediately.
     *
     * @param engine - The engine instance
     * @param renderPass - The render pass configuration including targets and clear values
     * @param displayIdx - The display index for stereo rendering (0 for left eye, 1 for right eye)
     */
    private createRenderPassEncoder;
    private __toClearRenderBundles;
    renderWithRenderBundle(engine: Engine, renderPass: RenderPass, displayIdx: number): boolean;
    renderWithRenderBundleAndKeepRenderPass(engine: Engine, renderPass: RenderPass, displayIdx: number): GPURenderPassEncoder | undefined;
    finishRenderBundleEncoder(engine: Engine, renderPass: RenderPass, displayIdx: number): void;
    finishRenderBundleEncoderAndKeepRenderPass(engine: Engine, renderPass: RenderPass, displayIdx: number): GPURenderPassEncoder | undefined;
    getOrCreateRenderPassEncoderForExternalRendering(engine: Engine, renderPass: RenderPass, displayIdx: number): GPURenderPassEncoder | undefined;
    endRenderPassEncoderForExternalRendering(): void;
    getOrCreateRenderPipeline(renderPipelineId: string, bindGroupId: string, primitive: Primitive, material: Material, renderPass: RenderPass, zWrite: boolean, _diffuseCubeMap?: CubeTexture | RenderTargetTextureCube, _specularCubeMap?: CubeTexture | RenderTargetTextureCube, _sheenCubeMap?: CubeTexture | RenderTargetTextureCube): [GPURenderPipeline, boolean];
    /**
     * Submits all recorded commands to the GPU queue and resets the command encoder.
     * This method must be called to execute any recorded rendering commands.
     */
    flush(): void;
    setColorWriteMask(material: Material): GPUColorWriteFlags;
    /**
     * Create Cube Texture from image files.
     * @param baseUri the base uri to load images;
     * @param mipLevelCount the number of mip levels (include root level). if no mipmap, the value should be 1;
     * @returns the WebGLResourceHandle for the generated Cube Texture
     */
    createCubeTextureFromFiles(engine: Engine, baseUri: string, mipLevelCount: Count, isNamePosNeg: boolean, hdriFormat: HdriFormatEnum): Promise<[number, Sampler, number, number]>;
    /**
     * create a CubeTexture
     *
     * @param mipLevelCount
     * @param images
     * @param width
     * @param height
     * @returns resource handle
     */
    createCubeTexture(engine: Engine, mipLevelCount: Count, images: Array<{
        posX: DirectTextureData;
        negX: DirectTextureData;
        posY: DirectTextureData;
        negY: DirectTextureData;
        posZ: DirectTextureData;
        negZ: DirectTextureData;
    }>, width: Size, height: Size): [number, Sampler];
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
    createTextureArray(width: Size, height: Size, arrayLength: Size, mipLevelCount: Size, internalFormat: TextureFormatEnum, _format: PixelFormatEnum, _type: ComponentTypeEnum, imageData: TypedArray): WebGPUResourceHandle;
    /**
     * Creates a storage buffer from a Float32Array and registers it as a WebGPU resource.
     * Storage buffers are used for storing large amounts of data accessible from shaders.
     *
     * @param gpuInstanceDataBuffers - The buffers containing the data to store
     * @returns Handle to the created storage buffer resource
     */
    createStorageBuffer(gpuInstanceDataBuffers: Buffer[]): number;
    /**
     * Updates an existing storage buffer with new data.
     * Only updates the specified number of components to optimize data transfer.
     *
     * @param storageBufferHandle - Handle to the storage buffer to update
     * @param gpuInstanceDataBuffers - New data to write to the buffer
     */
    updateStorageBuffer(storageBufferHandle: WebGPUResourceHandle, gpuInstanceDataBuffers: Buffer[]): void;
    destroyStorageBuffer(storageBufferHandle: WebGPUResourceHandle): void;
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
    updateStorageBufferPartially(storageBufferHandle: WebGPUResourceHandle, inputArray: Float32Array, offsetOfStorageBufferInByte: Count, offsetOfInputArrayInElement: Count, updateComponentSize: Count): void;
    createStorageBlendShapeBuffer(inputArray: Float32Array): number;
    deleteStorageBlendShapeBuffer(storageBufferHandle: WebGPUResourceHandle): void;
    updateStorageBlendShapeBuffer(storageBufferHandle: WebGPUResourceHandle, inputArray: Float32Array, updateComponentSize: Count): void;
    createBindGroupLayoutForDrawParameters(): void;
    updateUniformBufferForDrawParameters(identifier: DRAW_PARAMETERS_IDENTIFIER, materialSid: Index, cameraSID: Index, currentPrimitiveIdx: Index, morphTargetNumber: Count): void;
    createUniformMorphOffsetsBuffer(sizeInByte: Count): number;
    updateUniformMorphOffsetsBuffer(inputArray: Uint32Array, elementNum: Count): void;
    createUniformMorphWeightsBuffer(sizeInByte: Count): number;
    updateUniformMorphWeightsBuffer(inputArray: Float32Array, elementNum: Count): void;
    deleteUniformBuffer(uniformBufferHandle: WebGPUResourceHandle): void;
    private __createBindGroup;
    /**
     * create a Texture
     * @param imageData
     * @param param1
     * @returns
     */
    createTextureFromHTMLImageElement(imageData: HTMLImageElement, { internalFormat, width, height, generateMipmap, }: {
        internalFormat: TextureParameterEnum;
        width: Size;
        height: Size;
        generateMipmap: boolean;
    }): Promise<WebGPUResourceHandle>;
    /**
     * create CompressedTextureFromBasis
     * @param basisFile
     * @returns
     */
    createCompressedTextureFromBasis(basisFile: BasisFile): WebGPUResourceHandle;
    /**
     * decode the BasisImage
     * @param basisFile
     * @param basisCompressionType
     * @param imageIndex
     * @param levelIndex
     * @returns
     */
    private decodeBasisImage;
    /**
     * Create and bind compressed texture object
     * @param textureDataArray transcoded texture data for each mipmaps(levels)
     * @param compressionTextureType
     */
    createCompressedTexture(textureDataArray: TextureData[], compressionTextureType: CompressionTextureTypeEnum): Promise<WebGPUResourceHandle>;
    /**
     * allocate a Texture
     * @param format - the format of the texture
     * @param width - the width of the texture
     * @param height - the height of the texture
     * @param mipmapCount - the number of mipmap levels
     * @returns the handle of the texture
     */
    allocateTexture({ format, width, height, mipLevelCount, }: {
        format: TextureFormatEnum;
        width: Size;
        height: Size;
        mipLevelCount: Count;
    }): WebGPUResourceHandle;
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
    loadImageToMipLevelOfTexture2D({ mipLevel, textureUid, format, type, xOffset, yOffset, width, height, rowSizeByPixel, data, }: {
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
    }): Promise<void>;
    private __createTextureInner;
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
    createRenderTargetTexture({ width, height, mipLevelCount, format, }: {
        width: Size;
        height: Size;
        mipLevelCount: Count;
        format: TextureParameterEnum;
    }): WebGPUResourceHandle;
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
    createRenderTargetTextureArray({ width, height, internalFormat, arrayLength, }: {
        width: Size;
        height: Size;
        internalFormat: TextureParameterEnum;
        arrayLength: Count;
    }): WebGPUResourceHandle;
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
    createRenderTargetTextureCube({ width, height, mipLevelCount, format, }: {
        width: Size;
        height: Size;
        mipLevelCount: Count;
        format: TextureParameterEnum;
    }): WebGPUResourceHandle;
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
    attachDepthBufferToFrameBufferObject(_framebuffer: FrameBuffer, _renderable: IRenderable): void;
    /**
     * attach the StencilBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param renderable a StencilBuffer
     */
    attachStencilBufferToFrameBufferObject(_framebuffer: FrameBuffer, _renderable: IRenderable): void;
    /**
     * attach the depthStencilBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param renderable a depthStencilBuffer
     */
    attachDepthStencilBufferToFrameBufferObject(_framebuffer: FrameBuffer, _renderable: IRenderable): void;
    /**
     * create a FrameBufferObject
     * @returns
     */
    createFrameBufferObject(): number;
    /**
     * delete a FrameBufferObject
     * @param frameBufferObjectHandle
     */
    deleteFrameBufferObject(_frameBufferObjectHandle: WebGPUResourceHandle): void;
    /**
     * attach the ColorBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param attachmentIndex a attachment index
     * @param renderable a ColorBuffer
     */
    attachColorBufferToFrameBufferObject(_framebuffer: FrameBuffer, _attachmentIndex: Index, _renderable: IRenderable): void;
    /**
     * attach the ColorBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param attachmentIndex a attachment index
     * @param renderable a ColorBuffer
     * @param layerIndex a layer index
     * @param mipLevel a mip level
     */
    attachColorBufferLayerToFrameBufferObject(_framebuffer: FrameBuffer, _attachmentIndex: Index, _renderable: IRenderable, _layerIndex: Index, _mipLevel: Index): void;
    /**
     * attach the ColorBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param attachmentIndex a attachment index
     * @param faceIndex a face index
     * @param mipLevel a mip level
     * @param renderable a ColorBuffer
     */
    attachColorBufferCubeToFrameBufferObject(_framebuffer: FrameBuffer, _attachmentIndex: Index, _faceIndex: Index, _mipLevel: Index, _renderable: IRenderable): void;
    /**
     * Creates a 2D texture view from a texture resource.
     * This view can be used for sampling the texture in shaders.
     *
     * @param textureHandle - Handle to the source texture
     * @returns Handle to the created texture view
     */
    createTextureView2d(textureHandle: WebGPUResourceHandle): WebGPUResourceHandle;
    /**
     * Creates a texture view suitable for use as a render target.
     * This view targets only the base mip level and first array layer.
     *
     * @param textureHandle - Handle to the source texture
     * @returns Handle to the created render target texture view
     */
    createTextureViewAsRenderTarget(textureHandle: WebGPUResourceHandle): WebGPUResourceHandle;
    /**
     * Creates a cube texture view from a cube texture resource.
     * This view exposes all 6 faces of the cube texture for sampling.
     *
     * @param textureHandle - Handle to the source cube texture
     * @returns Handle to the created cube texture view
     */
    createTextureViewCube(textureHandle: WebGPUResourceHandle): WebGPUResourceHandle;
    createTextureView2dArray(textureHandle: WebGPUResourceHandle, arrayLayerCount: Count): WebGPUResourceHandle;
    createTextureView2dArrayAsRenderTarget(textureHandle: WebGPUResourceHandle, arrayIdx: Index, mipLevel: Index): WebGPUResourceHandle;
    createCubeTextureViewAsRenderTarget(textureHandle: WebGPUResourceHandle, faceIdx: Index, mipLevel: Index): WebGPUResourceHandle;
    deleteTexture(textureHandle: WebGLResourceHandle): void;
    /**
     * Recreates the system depth texture with the current canvas dimensions.
     * This is called when the canvas is resized or initialized.
     */
    recreateSystemDepthTexture(): void;
    /**
     * Resizes the canvas and recreates the system depth texture.
     * This method should be called when the window or viewport size changes.
     *
     * @param width - New canvas width in pixels
     * @param height - New canvas height in pixels
     */
    resizeCanvas(width: Size, height: Size): void;
    /**
     * Sets the viewport for rendering (currently not implemented in WebGPU version).
     *
     * @param viewport - Optional viewport rectangle (x, y, width, height)
     */
    setViewport(_engine: Engine, _viewport?: Vector4): void;
    /**
     * Checks if the implementation supports multi-view VR rendering.
     *
     * @returns Always false for WebGPU implementation (not yet supported)
     */
    isSupportMultiViewVRRendering(): boolean;
}
export {};
