import type { Config } from '../foundation/core/Config';
import type { ComponentTypeEnum } from '../foundation/definitions/ComponentType';
import type { CompressionTextureTypeEnum } from '../foundation/definitions/CompressionTextureType';
import { type HdriFormatEnum } from '../foundation/definitions/HdriFormat';
import { type PixelFormatEnum } from '../foundation/definitions/PixelFormat';
import type { ShaderSemanticsInfo } from '../foundation/definitions/ShaderSemanticsInfo';
import { type TextureFormatEnum } from '../foundation/definitions/TextureFormat';
import { type TextureParameterEnum } from '../foundation/definitions/TextureParameter';
import { type VertexAttributeEnum } from '../foundation/definitions/VertexAttribute';
import type { Primitive } from '../foundation/geometry/Primitive';
import type { Material } from '../foundation/materials/core/Material';
import { Vector4 } from '../foundation/math/Vector4';
import type { Accessor } from '../foundation/memory/Accessor';
import { CGAPIResourceRepository, type DirectTextureData, type ICGAPIResourceRepository, type ImageBitmapData } from '../foundation/renderer/CGAPIResourceRepository';
import type { FrameBuffer } from '../foundation/renderer/FrameBuffer';
import type { RenderPass } from '../foundation/renderer/RenderPass';
import type { Engine } from '../foundation/system/Engine.js';
import type { AbstractTexture } from '../foundation/textures/AbstractTexture';
import type { IRenderable } from '../foundation/textures/IRenderable';
import { Sampler } from '../foundation/textures/Sampler';
import type { BasisFile } from '../types/BasisTexture';
import type { ArrayType, Byte, CGAPIResourceHandle, Count, Index, Offset, Size, TypedArray, WebGLResourceHandle, WebGPUResourceHandle } from '../types/CommonTypes';
import type { AttributeNames } from './types';
import { WebGLContextWrapper } from './WebGLContextWrapper';
import type { RnWebGLProgram } from './WebGLExtendedTypes';
export type VertexHandles = {
    vaoHandle: CGAPIResourceHandle;
    iboHandle?: CGAPIResourceHandle;
    vboHandles: Array<CGAPIResourceHandle>;
    attributesFlags: Array<boolean>;
    setComplete: boolean;
};
export type TextureData = {
    level: Count;
    width: Count;
    height: Count;
    buffer: ArrayBufferView;
};
export type WebGLStates = {
    depthTest: boolean;
    stencilTest: boolean;
    blend: boolean;
    dither: boolean;
    scissorTest: boolean;
    polygonOffsetFill: boolean;
    sampleCoverage: boolean;
    sampleAlphaToCoverage: boolean;
    cullFace: boolean;
    rasterizerDiscard: boolean;
    depthFunc: number;
    depthWriteMask: boolean;
    depthClearValue: number;
    depthRange: [number, number];
    stencilFunc: number;
    stencilValueMask: number;
    stencilRef: number;
    stencilBackFunc: number;
    stencilBackValueMask: number;
    stencilBackRef: number;
    stencilFail: number;
    stencilPassDepthFail: number;
    stencilPassDepthPass: number;
    stencilBackFail: number;
    stencilBackPassDepthFail: number;
    stencilBackPassDepthPass: number;
    stencilWriteMask: number;
    stencilBackWriteMask: number;
    stencilClearValue: number;
    blendSrcRgb: number;
    blendDstRgb: number;
    blendSrcAlpha: number;
    blendDstAlpha: number;
    blendEquationRgb: number;
    blendEquationAlpha: number;
    blendColor: [number, number, number, number];
    colorClearValue: [number, number, number, number];
    colorWriteMask: [boolean, boolean, boolean, boolean];
    cullFaceMode: number;
    frontFace: number;
    polygonOffsetFactor: number;
    polygonOffsetUnits: number;
    sampleCoverageValue: number;
    sampleCoverageInvert: boolean;
    scissorBox: [number, number, number, number];
    viewport: [number, number, number, number];
    lineWidth: number;
    activeTexture: number;
    textureBindings: Array<{
        texture2D: WebGLTexture | null;
        textureCubeMap: WebGLTexture | null;
        texture3D: WebGLTexture | null;
        texture2DArray: WebGLTexture | null;
        sampler: WebGLSampler | null;
    }>;
    arrayBufferBinding: WebGLBuffer | null;
    elementArrayBufferBinding: WebGLBuffer | null;
    uniformBufferBinding: WebGLBuffer | null;
    transformFeedbackBinding: WebGLTransformFeedback | null;
    copyReadBufferBinding: WebGLBuffer | null;
    copyWriteBufferBinding: WebGLBuffer | null;
    pixelPackBufferBinding: WebGLBuffer | null;
    pixelUnpackBufferBinding: WebGLBuffer | null;
    readFramebufferBinding: WebGLFramebuffer | null;
    drawFramebufferBinding: WebGLFramebuffer | null;
    renderbufferBinding: WebGLRenderbuffer | null;
    vertexArrayBinding: WebGLVertexArrayObject | null;
    currentProgram: WebGLProgram | null;
};
export type WebGLResource = WebGLBuffer | WebGLFramebuffer | WebGLProgram | WebGLRenderbuffer | WebGLTexture | WebGLTransformFeedback | WebGLSampler | WebGLVertexArrayObject;
/**
 * A comprehensive repository for managing WebGL resources including buffers, textures, shaders, and framebuffers.
 * This class provides a centralized interface for creating, managing, and disposing of WebGL resources
 * while maintaining resource handles for efficient memory management.
 *
 * @example
 * ```typescript
 * const repository = WebGLResourceRepository.getInstance();
 * const textureHandle = repository.createTextureFromImageBitmapData(imageData, options);
 * ```
 */
export declare class WebGLResourceRepository extends CGAPIResourceRepository implements ICGAPIResourceRepository {
    private __webglContexts;
    private __glw?;
    private __resourceCounter;
    private __webglResources;
    private __samplerClampToEdgeLinearUid;
    private __samplerClampToEdgeNearestUid;
    private __samplerRepeatNearestUid;
    private __samplerRepeatLinearUid;
    private __samplerShadowUid;
    private __samplerRepeatTriLinearUid;
    private __samplerRepeatAnisotropyLinearUid;
    private constructor();
    /**
     * Gets the singleton instance of WebGLResourceRepository.
     *
     * @returns The singleton instance of WebGLResourceRepository
     */
    static init(): WebGLResourceRepository;
    /**
     * Adds an existing WebGL2 context to the repository.
     *
     * @param config - The configuration for the WebGL context
     * @param gl - The WebGL2 rendering context to add
     * @param canvas - The HTML canvas element associated with the context
     * @param asCurrent - Whether to set this context as the current active context
     */
    addWebGLContext(config: Config, gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, asCurrent: boolean): void;
    /**
     * Generates a new WebGL2 context for the given canvas element.
     *
     * @param config - The configuration for the WebGL context
     * @param canvas - The HTML canvas element to create the context for
     * @param asCurrent - Whether to set this context as the current active context
     * @param webglOption - Optional WebGL context attributes for context creation
     * @returns The created WebGL2 rendering context
     */
    generateWebGLContext(config: Config, canvas: HTMLCanvasElement, asCurrent: boolean, webglOption?: WebGLContextAttributes): WebGL2RenderingContext;
    /**
     * Gets the current WebGL context wrapper.
     *
     * @returns The current WebGLContextWrapper instance or undefined if none is set
     */
    get currentWebGLContextWrapper(): WebGLContextWrapper | undefined;
    /**
     * Generates a unique resource handle for WebGL objects.
     *
     * @returns A unique WebGL resource handle
     */
    private getResourceNumber;
    /**
     * Registers a WebGL object and assigns it a unique handle.
     *
     * @param obj - The WebGL object to register
     * @returns The assigned resource handle
     */
    private __registerResource;
    /**
     * Retrieves a WebGL resource by its handle.
     *
     * @param WebGLResourceHandle - The handle of the resource to retrieve
     * @returns The WebGL resource or null if not found
     */
    getWebGLResource(WebGLResourceHandle: WebGLResourceHandle): WebGLResource | null;
    /**
     * Creates an index buffer from the provided accessor data.
     *
     * @param accessor - The accessor containing index data
     * @returns The handle of the created index buffer
     * @throws Error if no WebGL context is available
     */
    createIndexBuffer(accessor: Accessor): number;
    /**
     * Updates an existing index buffer with new data from the accessor.
     *
     * @param accessor - The accessor containing new index data
     * @param resourceHandle - The handle of the index buffer to update
     * @throws Error if no WebGL context is available or IBO not found
     */
    updateIndexBuffer(accessor: Accessor, resourceHandle: number): void;
    /**
     * Creates a vertex buffer from the provided accessor data.
     *
     * @param accessor - The accessor containing vertex data
     * @returns The handle of the created vertex buffer
     * @throws Error if no WebGL context is available
     */
    createVertexBuffer(accessor: Accessor): number;
    /**
     * Creates a vertex buffer directly from a typed array.
     *
     * @param typedArray - The typed array containing vertex data
     * @returns The handle of the created vertex buffer
     * @throws Error if no WebGL context is available
     */
    createVertexBufferFromTypedArray(typedArray: TypedArray): number;
    /**
     * Updates an existing vertex buffer with new data from the accessor.
     *
     * @param accessor - The accessor containing new vertex data
     * @param resourceHandle - The handle of the vertex buffer to update
     * @throws Error if no WebGL context is available or VBO not found
     */
    updateVertexBuffer(accessor: Accessor, resourceHandle: number): void;
    /**
     * Creates a new vertex array object (VAO).
     *
     * @returns The handle of the created VAO or undefined if creation failed
     * @throws Error if no WebGL context is available
     */
    createVertexArray(): number | undefined;
    /**
     * Binds a 2D texture to the specified texture slot.
     *
     * @param textureSlotIndex - The texture slot index to bind to
     * @param textureUid - The handle of the texture to bind
     */
    bindTexture2D(textureSlotIndex: Index, textureUid: CGAPIResourceHandle): void;
    /**
     * Binds a texture sampler to the specified texture slot.
     *
     * @param textureSlotIndex - The texture slot index to bind to
     * @param samplerUid - The handle of the sampler to bind, or -1 to unbind
     */
    bindTextureSampler(textureSlotIndex: Index, samplerUid: CGAPIResourceHandle): void;
    /**
     * Binds a cube texture to the specified texture slot.
     *
     * @param textureSlotIndex - The texture slot index to bind to
     * @param textureUid - The handle of the cube texture to bind
     */
    bindTextureCube(textureSlotIndex: Index, textureUid: CGAPIResourceHandle): void;
    /**
     * Binds a 2D texture array to the specified texture slot.
     *
     * @param textureSlotIndex - The texture slot index to bind to
     * @param textureUid - The handle of the 2D texture array to bind
     */
    bindTexture2DArray(textureSlotIndex: Index, textureUid: CGAPIResourceHandle): void;
    /**
     * Creates vertex buffers and index buffers for a primitive and returns handles for them.
     * This method processes all vertex attributes of the primitive and creates corresponding VBOs.
     *
     * @param primitive - The primitive object containing vertex and index data
     * @returns VertexHandles object containing all created buffer handles and metadata
     */
    createVertexBufferAndIndexBuffer(primitive: Primitive): VertexHandles;
    /**
     * Updates existing vertex buffers and index buffers with new data from a primitive.
     *
     * @param primitive - The primitive object containing updated vertex and index data
     * @param vertexHandles - The handles of the buffers to update
     */
    updateVertexBufferAndIndexBuffer(primitive: Primitive, vertexHandles: VertexHandles): void;
    /**
     * Creates and compiles a shader program from vertex and fragment shader source code.
     * This method handles shader compilation, linking, and error reporting.
     *
     * @param params - Configuration object for shader program creation
     * @param params.config - Configuration for the shader program
     * @param params.engine - The engine instance
     * @param params.material - The material associated with this shader program
     * @param params.primitive - The primitive that will use this shader program
     * @param params.vertexShaderStr - The vertex shader source code
     * @param params.fragmentShaderStr - The fragment shader source code
     * @param params.attributeNames - Array of vertex attribute names
     * @param params.attributeSemantics - Array of vertex attribute semantics
     * @param params.onError - Optional error callback function
     * @returns The handle of the created shader program, or InvalidCGAPIResourceUid on failure
     * @throws Error if no WebGL context is available
     */
    createShaderProgram({ config, engine, material, primitive, vertexShaderStr, fragmentShaderStr, attributeNames, attributeSemantics, onError, }: {
        config: Config;
        engine: Engine;
        material: Material;
        primitive: Primitive;
        vertexShaderStr: string;
        fragmentShaderStr: string;
        attributeNames: AttributeNames;
        attributeSemantics: VertexAttributeEnum[];
        onError?: (message: string) => void;
    }): WebGPUResourceHandle;
    /**
     * Validates shader compilation status and logs errors if compilation fails.
     *
     * @param engine - The engine instance for logging
     * @param materialTypeName - The name of the material type for error context
     * @param shader - The compiled shader object to check
     * @param shaderText - The shader source code for error reporting
     * @param onError - Optional error callback function
     * @returns True if compilation succeeded, false otherwise
     */
    private __checkShaderCompileStatus;
    /**
     * Validates shader program linking status and logs errors if linking fails.
     *
     * @param engine - The engine instance for logging
     * @param materialTypeName - The name of the material type for error context
     * @param shaderProgram - The linked shader program to check
     * @param vertexShaderText - The vertex shader source code for error reporting
     * @param fragmentShaderText - The fragment shader source code for error reporting
     * @returns True if linking succeeded, false otherwise
     */
    private __checkShaderProgramLinkStatus;
    /**
     * Sets up uniform locations for a shader program based on shader semantics information.
     * This method extracts uniform locations from the compiled shader program and stores them
     * for efficient access during rendering.
     *
     * @param config - Configuration for the shader program
     * @param shaderProgramUid - The handle of the shader program
     * @param infoArray - Array of shader semantics information
     * @param isUniformOnlyMode - Whether to set up only uniform locations
     * @returns The WebGL program object with configured uniform locations
     */
    setupUniformLocations(config: Config, shaderProgramUid: WebGLResourceHandle, infoArray: ShaderSemanticsInfo[], isUniformOnlyMode: boolean): WebGLProgram;
    /**
     * Sets up basic uniform locations required for data texture operations.
     *
     * @param shaderProgramUid - The handle of the shader program to configure
     */
    setupBasicUniformLocations(shaderProgramUid: WebGLResourceHandle): void;
    /**
     * Sets a uniform value for texture binding and binds the texture to the appropriate slot.
     *
     * @param shaderProgram_ - The shader program to set the uniform for
     * @param semanticStr - The semantic string identifying the uniform
     * @param value - The value array containing texture slot index and texture data
     */
    setUniform1iForTexture(shaderProgram_: WebGLProgram, semanticStr: string, value: any): void;
    /**
     * Sets a uniform value in the shader program with automatic type detection and conversion.
     * This method handles various composition types including matrices, vectors, and textures.
     *
     * @param shaderProgram_ - The shader program to set the uniform for
     * @param semanticStr - The semantic string identifying the uniform
     * @param firstTime - Whether this is the first time setting this uniform
     * @param value - The value to set (can be scalar, vector, matrix, or texture data)
     * @returns True if the uniform was successfully set, false otherwise
     */
    setUniformValue(shaderProgram_: WebGLProgram, semanticStr: string, _firstTime: boolean, value: any): boolean;
    /**
     * Binds textures and samplers based on the composition type information.
     * This method handles different texture types including 2D, cube, and texture arrays.
     *
     * @param info - The shader semantics info containing composition type details
     * @param value - Array containing texture slot, texture object, and sampler
     */
    bindTexture(info: ShaderSemanticsInfo, value: [number, AbstractTexture, Sampler]): void;
    /**
     * Internal method for setting uniform values with proper WebGL calls based on data type.
     * This method handles the actual WebGL uniform* calls with appropriate type conversion.
     *
     * @param shaderProgram - The shader program to set the uniform for
     * @param semanticStr - The semantic string identifying the uniform
     * @param info - The shader semantics information
     * @param isMatrix - Whether the value is a matrix
     * @param componentNumber - Number of components in the value
     * @param isVector - Whether the value is a vector/array
     * @param param6 - Object containing the value components
     * @param param6.x - Primary value component
     * @param param6.y - Second value component (optional)
     * @param param6.z - Third value component (optional)
     * @param param6.w - Fourth value component (optional)
     * @returns True if the uniform was successfully set, false if location not found
     */
    setUniformValueInner(shaderProgram: WebGLProgram, semanticStr: string, info: ShaderSemanticsInfo, isMatrix: boolean, componentNumber: number, isVector: boolean, { x, y, z, w, }: {
        x: number | ArrayType | boolean;
        y?: number | boolean;
        z?: number | boolean;
        w?: number | boolean;
    }): boolean;
    /**
     * Configures vertex data for rendering by setting up VAO with VBOs and IBO.
     * This method binds vertex arrays, index buffers, and configures vertex attribute pointers.
     *
     * @param handles - Object containing VAO, IBO, and VBO handles
     * @param handles.vaoHandle - Handle to the vertex array object
     * @param handles.iboHandle - Handle to the index buffer object (optional)
     * @param handles.vboHandles - Array of vertex buffer object handles
     * @param primitive - The primitive object containing vertex attribute information
     * @param instanceIDBufferUid - Handle to instance ID buffer for instanced rendering (optional)
     * @throws Error if required buffers are not found
     */
    setVertexDataToPipeline({ vaoHandle, iboHandle, vboHandles, }: {
        vaoHandle: WebGLResourceHandle;
        iboHandle?: WebGLResourceHandle;
        vboHandles: Array<WebGLResourceHandle>;
    }, primitive: Primitive, instanceIDBufferUid?: WebGLResourceHandle): void;
    /**
     * Creates a 2D texture with immutable storage using texStorage2D.
     * This method allocates texture storage with the specified parameters.
     *
     * @param params - Configuration object for texture creation
     * @param params.levels - Number of mipmap levels to allocate
     * @param params.internalFormat - Internal format of the texture
     * @param params.width - Width of the texture
     * @param params.height - Height of the texture
     * @returns The handle of the created texture
     */
    createTexStorage2D({ levels, internalFormat, width, height, }: {
        levels: Index;
        internalFormat: TextureParameterEnum | PixelFormatEnum;
        width: Size;
        height: Size;
    }): WebGLResourceHandle;
    /**
     * Creates a new texture sampler with the specified filtering and wrapping parameters.
     *
     * @param params - Configuration object for sampler creation
     * @param params.magFilter - Magnification filter mode
     * @param params.minFilter - Minification filter mode
     * @param params.wrapS - Wrapping mode for S coordinate
     * @param params.wrapT - Wrapping mode for T coordinate
     * @param params.wrapR - Wrapping mode for R coordinate
     * @param params.anisotropy - Whether to enable anisotropic filtering
     * @param params.shadowCompareMode - Whether to enable shadow comparison mode
     * @returns The handle of the created sampler
     */
    createTextureSampler({ magFilter, minFilter, wrapS, wrapT, wrapR, anisotropy, shadowCompareMode, }: {
        magFilter: TextureParameterEnum;
        minFilter: TextureParameterEnum;
        wrapS: TextureParameterEnum;
        wrapT: TextureParameterEnum;
        wrapR: TextureParameterEnum;
        anisotropy: boolean;
        shadowCompareMode: boolean;
    }): number;
    /**
     * Creates or returns an existing texture sampler with clamp-to-edge wrapping and linear filtering.
     * This method implements a singleton pattern for commonly used sampler configurations.
     *
     * @returns The handle of the clamp-to-edge linear sampler
     */
    createOrGetTextureSamplerClampToEdgeLinear(): number;
    /**
     * Creates or returns an existing texture sampler with clamp-to-edge wrapping and nearest filtering.
     * This method implements a singleton pattern for commonly used sampler configurations.
     *
     * @returns The handle of the clamp-to-edge nearest sampler
     */
    createOrGetTextureSamplerClampToEdgeNearest(): number;
    /**
     * Creates or returns an existing texture sampler with repeat wrapping and nearest filtering.
     * This method implements a singleton pattern for commonly used sampler configurations.
     *
     * @returns The handle of the repeat nearest sampler
     */
    createOrGetTextureSamplerRepeatNearest(): number;
    /**
     * Creates or returns an existing texture sampler with repeat wrapping and linear filtering.
     * This method implements a singleton pattern for commonly used sampler configurations.
     *
     * @returns The handle of the repeat linear sampler
     */
    createOrGetTextureSamplerRepeatLinear(): number;
    /**
     * Creates or returns an existing texture sampler with repeat wrapping and trilinear filtering.
     * This method implements a singleton pattern for commonly used sampler configurations.
     *
     * @returns The handle of the repeat trilinear sampler
     */
    createOrGetTextureSamplerRepeatTriLinear(): number;
    /**
     * Creates or returns an existing texture sampler configured for shadow mapping.
     * This sampler uses nearest filtering and enables shadow comparison functionality.
     *
     * @returns The handle of the shadow sampler
     */
    createOrGetTextureSamplerShadow(): number;
    /**
     * Creates or returns an existing texture sampler with repeat wrapping, anisotropic filtering, and linear filtering.
     * This method implements a singleton pattern for commonly used sampler configurations.
     *
     * @returns The handle of the repeat anisotropy linear sampler
     */
    createOrGetTextureSamplerRepeatAnisotropyLinear(): number;
    /**
     * Creates a 2D texture from ImageBitmap data with specified parameters.
     * This method allocates texture storage and uploads the image data to the GPU.
     *
     * @param imageData - The ImageBitmap or ImageBitmapSource data to upload
     * @param params - Configuration object for texture creation
     * @param params.internalFormat - Internal format of the texture
     * @param params.width - Width of the texture
     * @param params.height - Height of the texture
     * @param params.format - Pixel format of the source data
     * @param params.type - Data type of the source data
     * @param params.generateMipmap - Whether to generate mipmaps automatically
     * @returns Promise that resolves to the handle of the created texture
     */
    createTextureFromImageBitmapData(imageData: ImageBitmapData, { internalFormat, width, height, format, type, generateMipmap, }: {
        internalFormat: TextureFormatEnum;
        width: Size;
        height: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        generateMipmap: boolean;
    }): Promise<WebGLResourceHandle>;
    /**
     * Internal helper method for common texture setup operations.
     * This method handles mipmap generation and texture parameter setup.
     *
     * @param gl - The WebGL2 rendering context
     * @param width - Width of the texture
     * @param height - Height of the texture
     * @param generateMipmap - Whether to generate mipmaps
     */
    private __generateMipmapsAndUnbind;
    /**
     * Creates a 2D texture from an HTML image element with specified parameters.
     * This method allocates texture storage and uploads the image data to the GPU.
     *
     * @param imageData - The HTML image element containing the image data
     * @param params - Configuration object for texture creation
     * @param params.internalFormat - Internal format of the texture
     * @param params.width - Width of the texture
     * @param params.height - Height of the texture
     * @param params.format - Pixel format of the source data
     * @param params.type - Data type of the source data
     * @param params.generateMipmap - Whether to generate mipmaps automatically
     * @returns Promise that resolves to the handle of the created texture
     */
    createTextureFromHTMLImageElement(imageData: HTMLImageElement, { internalFormat, width, height, format, type, generateMipmap, }: {
        internalFormat: TextureParameterEnum;
        width: Size;
        height: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        generateMipmap: boolean;
    }): Promise<WebGLResourceHandle>;
    /**
     * Creates a 2D texture array with specified dimensions and format.
     * Texture arrays allow storing multiple texture layers in a single texture object.
     *
     * @param width - Width of each texture layer
     * @param height - Height of each texture layer
     * @param arrayLength - Number of texture layers in the array
     * @param mipLevelCount - Number of mipmap levels
     * @param internalFormat - Internal format of the texture
     * @param format - Pixel format of the source data
     * @param type - Data type of the source data
     * @param imageData - Typed array containing the texture data
     * @returns The handle of the created texture array
     */
    createTextureArray(width: Size, height: Size, arrayLength: Size, mipLevelCount: Size, internalFormat: TextureFormatEnum, format: PixelFormatEnum, type: ComponentTypeEnum, imageData: TypedArray): CGAPIResourceHandle;
    /**
     * Allocates texture storage without uploading any image data.
     * This method creates an empty texture with the specified format and dimensions.
     *
     * @param params - Configuration object for texture allocation
     * @param params.format - Internal format of the texture
     * @param params.width - Width of the texture
     * @param params.height - Height of the texture
     * @param params.mipLevelCount - Number of mipmap levels to allocate
     * @returns The handle of the allocated texture
     */
    allocateTexture({ format, width, height, mipLevelCount, }: {
        format: TextureFormatEnum;
        width: Size;
        height: Size;
        mipLevelCount: Count;
    }): WebGLResourceHandle;
    /**
     * Loads image data to a specific mip level of an existing 2D texture.
     * This method supports uploading data with row padding, extracting only the relevant pixels.
     *
     * @param params - Configuration object for image loading
     * @param params.mipLevel - The mip level to load the image to
     * @param params.textureUid - The handle of the target texture
     * @param params.format - The format of the image
     * @param params.type - The data type of the image
     * @param params.xOffset - X offset of the copy region
     * @param params.yOffset - Y offset of the copy region
     * @param params.width - Width of the image to copy
     * @param params.height - Height of the image to copy
     * @param params.rowSizeByPixel - Size of each row in pixels (including padding)
     * @param params.data - The typed array containing the image data
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
    }): void;
    /**
     * Creates a 2D texture from a typed array with specified parameters.
     * This method is useful for creating textures from raw pixel data.
     *
     * @param imageData - The typed array containing the pixel data
     * @param params - Configuration object for texture creation
     * @param params.internalFormat - Internal format of the texture
     * @param params.width - Width of the texture
     * @param params.height - Height of the texture
     * @param params.format - Pixel format of the source data
     * @param params.type - Data type of the source data
     * @param params.generateMipmap - Whether to generate mipmaps automatically
     * @returns The handle of the created texture
     */
    createTextureFromTypedArray(imageData: TypedArray, { internalFormat, width, height, format, type, generateMipmap, }: {
        internalFormat: TextureFormatEnum;
        width: Size;
        height: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        generateMipmap: boolean;
    }): WebGLResourceHandle;
    /**
     * Creates a compressed texture from pre-transcoded texture data for multiple mip levels.
     * This method handles various compressed texture formats and uploads the data to GPU.
     *
     * @param textureDataArray - Array of texture data for each mipmap level
     * @param compressionTextureType - The compression format type (e.g., DXT, ETC, ASTC)
     * @returns Promise that resolves to the handle of the created compressed texture
     */
    createCompressedTexture(textureDataArray: TextureData[], compressionTextureType: CompressionTextureTypeEnum): Promise<WebGLResourceHandle>;
    /**
     * Creates a compressed texture from a Basis Universal file.
     * This method automatically detects the best compression format supported by the hardware
     * and transcodes the Basis file accordingly.
     *
     * @param basisFile - The Basis Universal file containing the compressed texture data
     * @param params - Configuration object for texture creation
     * @param params.border - Border width (must be 0 in WebGL)
     * @returns The handle of the created compressed texture
     */
    createCompressedTextureFromBasis(basisFile: BasisFile, { border, }: {
        border: Size;
    }): WebGLResourceHandle;
    /**
     * Decodes a specific image and mip level from a Basis Universal file to the target compression format.
     * This method handles the transcoding process from Basis format to hardware-specific formats.
     *
     * @param basisFile - The Basis Universal file containing the texture data
     * @param basisCompressionType - The target compression format to transcode to
     * @param imageIndex - Index of the image to decode (for texture arrays)
     * @param levelIndex - Mip level index to decode
     * @returns Uint8Array containing the transcoded texture data
     */
    private decodeBasisImage;
    /**
     * Creates a new framebuffer object for off-screen rendering.
     * Framebuffers are used for render-to-texture operations and post-processing effects.
     *
     * @returns The handle of the created framebuffer object
     */
    createFrameBufferObject(): number;
    /**
     * Attaches a color buffer (texture or renderbuffer) to a framebuffer object.
     * This method supports both regular textures and multiview VR textures.
     *
     * @param framebuffer - The framebuffer to attach to
     * @param attachmentIndex - The color attachment index (0-based)
     * @param renderable - The texture or renderbuffer to attach
     */
    attachColorBufferToFrameBufferObject(framebuffer: FrameBuffer, attachmentIndex: Index, renderable: IRenderable): void;
    /**
     * Attaches a specific layer of a texture array to a framebuffer object.
     * This method is useful for rendering to individual layers of a texture array.
     *
     * @param framebuffer - The framebuffer to attach to
     * @param attachmentIndex - The color attachment index (0-based)
     * @param renderable - The texture array to attach
     * @param layerIndex - The layer index within the texture array
     * @param mipLevel - The mip level to attach
     */
    attachColorBufferLayerToFrameBufferObject(framebuffer: FrameBuffer, attachmentIndex: Index, renderable: IRenderable, layerIndex: Index, mipLevel: Index): void;
    /**
     * Attaches a specific face of a cube texture to a framebuffer object.
     * This method is used for rendering to individual faces of cube maps.
     *
     * @param framebuffer - The framebuffer to attach to
     * @param attachmentIndex - The color attachment index (0-based)
     * @param faceIndex - The cube face index (0-5: +X, -X, +Y, -Y, +Z, -Z)
     * @param mipLevel - The mip level to attach
     * @param renderable - The cube texture to attach
     */
    attachColorBufferCubeToFrameBufferObject(framebuffer: FrameBuffer, attachmentIndex: Index, faceIndex: Index, mipLevel: Index, renderable: IRenderable): void;
    /**
     * Attaches a depth buffer to a framebuffer object.
     *
     * @param framebuffer - The framebuffer to attach to
     * @param renderable - The depth texture or renderbuffer to attach
     */
    attachDepthBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable): void;
    /**
     * Attaches a stencil buffer to a framebuffer object.
     *
     * @param framebuffer - The framebuffer to attach to
     * @param renderable - The stencil texture or renderbuffer to attach
     */
    attachStencilBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable): void;
    /**
     * Attaches a combined depth-stencil buffer to a framebuffer object.
     *
     * @param framebuffer - The framebuffer to attach to
     * @param renderable - The depth-stencil texture or renderbuffer to attach
     */
    attachDepthStencilBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable): void;
    /**
     * Internal method for attaching depth or stencil buffers to framebuffers.
     * This method handles the common logic for depth, stencil, and depth-stencil attachments.
     *
     * @param framebuffer - The framebuffer to attach to
     * @param renderable - The texture or renderbuffer to attach
     * @param attachmentType - The WebGL attachment type constant
     */
    private __attachDepthOrStencilBufferToFrameBufferObject;
    /**
     * create Renderbuffer
     */
    createRenderBuffer(width: Size, height: Size, internalFormat: TextureParameterEnum, isMSAA: boolean, sampleCountMSAA: Count): number;
    /**
     * set drawTargets
     * @param framebuffer
     */
    setDrawTargets(renderPass: RenderPass): void;
    /**
     * bind Framebuffer
     * @param framebuffer
     */
    bindFramebuffer(framebuffer?: FrameBuffer): void;
    /**
     * unbind Framebuffer
     */
    unbindFramebuffer(): void;
    /**
     * create a RenderTargetTexture
     * @param param0
     * @returns
     */
    createRenderTargetTexture({ width, height, mipLevelCount, format, }: {
        width: Size;
        height: Size;
        mipLevelCount: Count;
        format: TextureParameterEnum;
    }): number;
    /**
     * create a RenderTargetTextureArray
     * @param param0
     * @returns
     */
    createRenderTargetTextureArray({ width, height, internalFormat, arrayLength, }: {
        width: Size;
        height: Size;
        internalFormat: TextureParameterEnum;
        arrayLength: Count;
    }): WebGLResourceHandle;
    /**
     * create a RenderTargetTextureCube
     * @param param0
     * @returns
     */
    createRenderTargetTextureCube({ width, height, mipLevelCount, format, }: {
        width: Size;
        height: Size;
        mipLevelCount: Size;
        format: TextureParameterEnum;
    }): number;
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
     * Create Cube Texture from image files.
     * @param baseUri the base uri to load images;
     * @param mipLevelCount the number of mip levels (include root level). if no mipmap, the value should be 1;
     * @returns the WebGLResourceHandle for the generated Cube Texture
     */
    createCubeTextureFromFiles(engine: Engine, baseUri: string, mipLevelCount: Count, isNamePosNeg: boolean, hdriFormat: HdriFormatEnum): Promise<[number, Sampler, number, number]>;
    createCubeTextureFromBasis(basisFile: BasisFile, { magFilter, minFilter, wrapS, wrapT, border, }: {
        border?: number | undefined;
        magFilter?: TextureParameterEnum | undefined;
        minFilter?: TextureParameterEnum | undefined;
        wrapS?: TextureParameterEnum | undefined;
        wrapT?: TextureParameterEnum | undefined;
    }): {
        resourceHandle: number;
        width: number;
        height: number;
    };
    createDummyBlackCubeTexture(engine: Engine): [number, Sampler];
    createDummyCubeTexture(engine: Engine, rgbaStr?: string): [number, Sampler];
    setWebGLTextureDirectly(webGLTexture: WebGLTexture): number;
    createTextureFromDataUri(dataUri: string, { internalFormat, format, type, generateMipmap, }: {
        internalFormat: TextureParameterEnum;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        generateMipmap: boolean;
    }): Promise<WebGLResourceHandle>;
    updateLevel0TextureAndGenerateMipmap(textureUid: WebGLResourceHandle, textureData: DirectTextureData, { width, height, format, type, }: {
        width: Size;
        height: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
    }): void;
    updateTexture(textureUid: WebGLResourceHandle, textureData: DirectTextureData, { level, offsetX, offsetY, width, height, format, type, }: {
        level: Index;
        offsetX: Offset;
        offsetY: Offset;
        width: Size;
        height: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
    }): void;
    deleteFrameBufferObject(frameBufferObjectHandle: WebGLResourceHandle): void;
    deleteRenderBuffer(renderBufferUid: WebGLResourceHandle): void;
    deleteTexture(textureHandle: WebGLResourceHandle): void;
    createDummyTexture(rgbaStr?: string): Promise<number>;
    createDummyBlackTexture(): number;
    createDummyWhiteTexture(): number;
    createDummyNormalTexture(): number;
    __createDummyTextureInner(base64: string): number;
    generateMipmaps2d(textureHandle: WebGLResourceHandle, width: number, height: number): void;
    generateMipmapsCube(textureHandle: WebGLResourceHandle, _width: number, _height: number): void;
    getTexturePixelData(_textureHandle: WebGLResourceHandle, width: number, height: number, frameBufferUid: WebGLResourceHandle, colorAttachmentIndex: number): Promise<Uint8Array>;
    /**
     * Reads pixel data from a specific face of a cube texture.
     * This creates a temporary framebuffer, attaches the cube face, and reads the pixels.
     * For floating-point textures (HDR), it uses a shader-based approach to sample and convert.
     *
     * @param textureHandle - Handle to the cube texture
     * @param width - Width of the face texture
     * @param height - Height of the face texture
     * @param faceIndex - Index of the cube face (0=+X, 1=-X, 2=+Y, 3=-Y, 4=+Z, 5=-Z)
     * @returns Promise resolving to the pixel data as a Uint8Array (RGBA format)
     */
    getCubeTexturePixelData(textureHandle: WebGLResourceHandle, width: number, height: number, faceIndex: number): Promise<Uint8Array>;
    /**
     * Reads cube texture data using a shader-based approach.
     * This is used for HDR/float textures that cannot be read directly.
     *
     * @param gl - WebGL2 rendering context
     * @param cubeTexture - The cube texture to read from
     * @param width - Width of the face texture
     * @param height - Height of the face texture
     * @param faceIndex - Index of the cube face (0=+X, 1=-X, 2=+Y, 3=-Y, 4=+Z, 5=-Z)
     * @param isHdrFormat - Whether the texture is HDR format (applies tone mapping and gamma correction if true)
     */
    private __readCubeTextureWithShader;
    createUniformBuffer(): number;
    createUniformBufferWithBufferView(bufferView: TypedArray | DataView): number;
    updateUniformBuffer(uboUid: WebGLResourceHandle, typedArray: TypedArray, offsetByte: Byte, arrayLength: Byte): void;
    bindUniformBlock(shaderProgramUid: WebGLResourceHandle, blockName: string, blockIndex: Index): void;
    bindUniformBufferBase(blockIndex: Index, uboUid: WebGLResourceHandle): void;
    deleteUniformBuffer(uboUid: WebGLResourceHandle): void;
    setupUniformBufferDataArea(typedArray?: TypedArray): number;
    setUniformBlockBindingForMorphOffsetsAndWeights(shaderProgramUid: WebGLResourceHandle, morphOffsetsUBOUid: WebGLResourceHandle, morphWeightsUBOUid: WebGLResourceHandle): void;
    setUniformBlockBindingForMorphOffsetsAndWeightsWithoutShaderProgram(morphOffsetsUBOUid: WebGLResourceHandle, morphWeightsUBOUid: WebGLResourceHandle): void;
    getGlslRenderTargetBeginString(renderTargetNumber: number): string;
    getGlslDataUBODefinitionString(): string;
    getGlslDataUBOVec4SizeString(): string;
    createMultiviewFramebuffer(width: number, height: number, samples: number): [WebGLResourceHandle, WebGLResourceHandle];
    createTransformFeedback(): number;
    deleteTransformFeedback(transformFeedbackUid: WebGLResourceHandle): void;
    setViewport(engine: Engine, viewport?: Vector4): void;
    clearFrameBuffer(_engine: Engine, renderPass: RenderPass, _?: number): void;
    deleteVertexDataResources(vertexHandles: VertexHandles): void;
    deleteVertexArray(vaoHandle: WebGLResourceHandle): void;
    deleteVertexBuffer(vboUid: WebGLResourceHandle): void;
    resizeCanvas(width: Size, height: Size): void;
    getCanvasSize(): [Size, Size];
    switchDepthTest(flag: boolean): void;
    rebuildProgramBySpector(this: RnWebGLProgram, engine: Engine, updatedVertexSourceCode: string, // The new vertex shader source
    updatedFragmentSourceCode: string, // The new fragment shader source
    onCompiled: (program: WebGLProgram) => void, // Callback triggered by your engine when the compilation is successful. It needs to send back the new linked program.
    onError: (message: string) => void): boolean;
    getPixelDataFromTexture(texUid: WebGLResourceHandle, x: number, y: number, width: number, height: number): Uint8Array<ArrayBuffer>;
    /**
     * Reads pixel data directly from a 2D texture asynchronously.
     * This is the async version of getPixelDataFromTexture for API consistency with WebGPU.
     *
     * @param texUid - Handle to the texture to read from
     * @param x - X offset to start reading from
     * @param y - Y offset to start reading from
     * @param width - Width of the region to read
     * @param height - Height of the region to read
     * @returns Promise resolving to the pixel data as a Uint8Array in RGBA format
     */
    getPixelDataFromTextureAsync(texUid: WebGLResourceHandle, x: number, y: number, width: number, height: number): Promise<Uint8Array>;
    getCurrentTexture2DBindingsForEffekseer(): {
        textureBindings: Array<{
            texture2D: WebGLTexture | null;
            sampler: WebGLSampler | null;
        }>;
        activeTexture: number;
        vertexArray: WebGLVertexArrayObject | null;
        arrayBuffer: WebGLBuffer | null;
        elementArrayBuffer: WebGLBuffer | null;
        currentProgram: WebGLProgram | null;
    };
    restoreTexture2DBindingsForEffekseer({ textureBindings, activeTexture, vertexArray, arrayBuffer, elementArrayBuffer, currentProgram, }: {
        textureBindings: Array<{
            texture2D: WebGLTexture | null;
            sampler: WebGLSampler | null;
        }>;
        activeTexture: number;
        vertexArray: WebGLVertexArrayObject | null;
        arrayBuffer: WebGLBuffer | null;
        elementArrayBuffer: WebGLBuffer | null;
        currentProgram: WebGLProgram | null;
    }): void;
    setWebGLStateToDefaultForEffekseer(): void;
    setWebGLStateToDefault(): void;
    restoreWebGLStates(webGLStates: WebGLStates): void;
    getCurrentWebGLStates(): WebGLStates;
    unbindTextureSamplers(): void;
    isSupportMultiViewVRRendering(engine: Engine): boolean;
    blitToTexture2dFromTexture2dArray(srcTextureUid: WebGLResourceHandle, dstFboUid: WebGLResourceHandle, dstWidth: number, dstHeight: number): void;
    blitToTexture2dFromTexture2dArrayFake(srcTextureUid: WebGLResourceHandle, dstFboUid: WebGLResourceHandle, dstWidth: number, dstHeight: number): void;
    blitToTexture2dFromTexture2dArray2(srcTextureUid: WebGLResourceHandle, dstTextureUid: WebGLResourceHandle, dstWidth: number, dstHeight: number): void;
}
