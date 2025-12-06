import type { BasisFile } from '../../types/BasisTexture';
import type { CGAPIResourceHandle, Count, Index, Size, TypedArray } from '../../types/CommonTypes';
import type { TextureData, VertexHandles, WebGLResourceRepository } from '../../webgl/WebGLResourceRepository';
import type { RnWebGL } from '../../webgl/main';
import type { AttributeNames } from '../../webgl/types/CommonTypes';
import type { WebGpuResourceRepository } from '../../webgpu/WebGpuResourceRepository';
import type { RnWebGpu } from '../../webgpu/main';
import type { Config } from '../core/Config';
import {
  type CompressionTextureTypeEnum,
  type HdriFormatEnum,
  ProcessApproach,
  type TextureFormatEnum,
  type VertexAttributeEnum,
} from '../definitions';
import type { ComponentTypeEnum } from '../definitions/ComponentType';
import type { PixelFormatEnum } from '../definitions/PixelFormat';
import type { TextureParameterEnum } from '../definitions/TextureParameter';
import type { Primitive } from '../geometry/Primitive';
import type { Material } from '../materials/core/Material';
import type { Vector4 } from '../math/Vector4';
import type { Accessor } from '../memory/Accessor';
import type { FrameBuffer } from '../renderer/FrameBuffer';
import type { Engine } from '../system/Engine';
import { EngineState } from '../system/EngineState';
import { ModuleManager } from '../system/ModuleManager';
import type { IRenderable } from '../textures/IRenderable';
import type { Sampler } from '../textures/Sampler';
import type { RenderPass } from './RenderPass';

/**
 * Union type representing direct texture data that can be used for texture creation.
 * Includes typed arrays and various HTML/browser elements that can serve as texture sources.
 */
export type DirectTextureData = TypedArray | HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap;

/**
 * Union type representing image bitmap data sources.
 * Includes HTML elements and ImageBitmap that can be converted to texture data.
 */
export type ImageBitmapData = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap;

/**
 * Abstract base class for Computer Graphics API Resource Repository.
 * Provides a unified interface for managing graphics resources across different APIs (WebGL, WebGPU).
 * This class serves as a factory and utility provider for accessing the appropriate resource repository
 * based on the current graphics API approach.
 */
export abstract class CGAPIResourceRepository {
  /** Invalid resource handle constant used to indicate failed resource creation or invalid resources */
  static readonly InvalidCGAPIResourceUid = -1;

  /**
   * Gets the appropriate Computer Graphics API Resource Repository instance based on the current process approach.
   * Automatically selects between WebGL and WebGPU implementations.
   *
   * @returns The active ICGAPIResourceRepository implementation
   * @throws Error if the required module is not available
   */
  static getCgApiResourceRepository(engine: Engine): ICGAPIResourceRepository {
    const moduleName = ProcessApproach.isWebGL2Approach(engine.engineState.currentProcessApproach) ? 'webgl' : 'webgpu';
    // const moduleName = 'webgl';
    const moduleManager = ModuleManager.getInstance();
    const cgApiModule = moduleManager.getModule(moduleName)! as any;

    if (moduleName === 'webgl') {
      const webGLResourceRepository: ICGAPIResourceRepository = (cgApiModule as RnWebGL).WebGLResourceRepository.init();
      return webGLResourceRepository;
    }
    // WebGPU
    const webGLResourceRepository: ICGAPIResourceRepository = cgApiModule?.WebGpuResourceRepository.getInstance();
    return webGLResourceRepository;
  }

  /**
   * Gets the WebGL-specific resource repository instance.
   * Use this method when you specifically need WebGL functionality.
   *
   * @returns The WebGLResourceRepository singleton instance
   * @throws Error if the WebGL module is not available
   */
  static getWebGLResourceRepository(): WebGLResourceRepository {
    const moduleName = 'webgl';
    const moduleManager = ModuleManager.getInstance();
    const webglModule = moduleManager.getModule(moduleName)! as RnWebGL;
    const webGLResourceRepository: WebGLResourceRepository = webglModule.WebGLResourceRepository.init();
    return webGLResourceRepository;
  }

  /**
   * Gets the WebGPU-specific resource repository instance.
   * Use this method when you specifically need WebGPU functionality.
   *
   * @returns The WebGpuResourceRepository singleton instance
   * @throws Error if the WebGPU module is not available
   */
  static getWebGpuResourceRepository(): WebGpuResourceRepository {
    const moduleName = 'webgpu';
    const moduleManager = ModuleManager.getInstance();
    const webgpuModule = moduleManager.getModule(moduleName)! as RnWebGpu;
    const webGpuResourceRepository: WebGpuResourceRepository = webgpuModule.WebGpuResourceRepository.init();
    return webGpuResourceRepository;
  }
}

/**
 * Interface defining the contract for Computer Graphics API Resource Repository implementations.
 * This interface abstracts graphics resource management operations across different APIs (WebGL, WebGPU).
 * Implementations handle creation, management, and deletion of graphics resources like textures,
 * buffers, shaders, and framebuffers.
 */
export interface ICGAPIResourceRepository {
  /**
   * Retrieves the current canvas dimensions.
   *
   * @returns A tuple containing [width, height] of the canvas
   */
  getCanvasSize(): [Size, Size];

  /**
   * Resizes the canvas to the specified dimensions.
   * This operation may trigger viewport adjustments and resource reallocation.
   *
   * @param width - The new canvas width in pixels
   * @param height - The new canvas height in pixels
   */
  resizeCanvas(width: Size, height: Size): void;

  /**
   * Clears the framebuffer associated with the given render pass.
   * This operation clears color, depth, and/or stencil buffers as configured in the render pass.
   *
   * @param renderPass - The render pass containing clear configuration
   */
  clearFrameBuffer(engine: Engine, renderPass: RenderPass, displayIdx?: number): void;

  /**
   * Creates a texture from image bitmap data with specified parameters.
   * This method handles various image sources and converts them to GPU textures.
   *
   * @param imageData - The source image data (HTMLImageElement, HTMLVideoElement, etc.)
   * @param options - Texture creation parameters
   * @param options.level - Mipmap level (typically 0 for base level)
   * @param options.internalFormat - Internal texture format for GPU storage
   * @param options.width - Texture width in pixels
   * @param options.height - Texture height in pixels
   * @param options.border - Border width (typically 0)
   * @param options.format - Pixel data format
   * @param options.type - Component data type
   * @param options.generateMipmap - Whether to automatically generate mipmaps
   * @returns Promise resolving to the texture resource handle
   */
  createTextureFromImageBitmapData(
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
  ): Promise<CGAPIResourceHandle>;

  /**
   * Creates a compressed texture from a Basis Universal file.
   * Basis Universal provides efficient texture compression that can be transcoded
   * to various GPU-specific formats at runtime.
   *
   * @param basisFile - The Basis Universal file containing compressed texture data
   * @param options - Texture creation parameters
   * @param options.border - Border width (typically 0)
   * @param options.format - Target pixel format after transcoding
   * @param options.type - Component data type
   * @returns The texture resource handle
   */
  createCompressedTextureFromBasis(
    basisFile: BasisFile,
    {
      border,
      format,
      type,
    }: {
      border: Size;
      format: PixelFormatEnum;
      type: ComponentTypeEnum;
    }
  ): CGAPIResourceHandle;

  /**
   * Creates a compressed texture from pre-transcoded texture data.
   * This method handles already transcoded compressed texture data for multiple mipmap levels.
   *
   * @param textureDataArray - Array of texture data for each mipmap level
   * @param compressionTextureType - The specific compression format type
   * @returns Promise resolving to the texture resource handle
   */
  createCompressedTexture(
    textureDataArray: TextureData[],
    compressionTextureType: CompressionTextureTypeEnum
  ): Promise<CGAPIResourceHandle>;

  /**
   * Creates a vertex buffer from an accessor containing vertex data.
   * The accessor provides metadata about the data layout and type information.
   *
   * @param accessor - Accessor containing vertex data and metadata
   * @returns The vertex buffer resource handle
   */
  createVertexBuffer(accessor: Accessor): CGAPIResourceHandle;

  /**
   * Creates a vertex buffer directly from a typed array.
   * This is a more direct approach when you have raw vertex data without accessor metadata.
   *
   * @param typedArray - The typed array containing vertex data
   * @returns The vertex buffer resource handle
   */
  createVertexBufferFromTypedArray(typedArray: TypedArray): CGAPIResourceHandle;

  /**
   * Creates an index buffer from an accessor containing index data.
   * Index buffers are used to define the order in which vertices are processed.
   *
   * @param accessor - Accessor containing index data and metadata
   * @returns The index buffer resource handle
   */
  createIndexBuffer(accessor: Accessor): CGAPIResourceHandle;

  /**
   * Creates both vertex and index buffers for a primitive geometry.
   * This is a convenience method that handles the creation of all necessary buffers
   * for rendering a geometric primitive.
   *
   * @param primitive - The primitive geometry containing vertex and index data
   * @returns Object containing handles for all created vertex-related resources
   */
  createVertexBufferAndIndexBuffer(primitive: Primitive): VertexHandles;

  /**
   * Updates an existing vertex buffer with new data from an accessor.
   * This allows for dynamic modification of vertex data without recreating the buffer.
   *
   * @param accessor - Accessor containing the new vertex data
   * @param resourceHandle - Handle to the existing vertex buffer to update
   */
  updateVertexBuffer(accessor: Accessor, resourceHandle: CGAPIResourceHandle): void;

  /**
   * Updates an existing index buffer with new data from an accessor.
   * This allows for dynamic modification of index data without recreating the buffer.
   *
   * @param accessor - Accessor containing the new index data
   * @param resourceHandle - Handle to the existing index buffer to update
   */
  updateIndexBuffer(accessor: Accessor, resourceHandle: CGAPIResourceHandle): void;

  /**
   * Updates both vertex and index buffers for a primitive geometry.
   * This is a convenience method for updating all vertex-related data at once.
   *
   * @param primitive - The primitive geometry containing updated vertex and index data
   * @param vertexHandles - Object containing handles to the buffers to update
   */
  updateVertexBufferAndIndexBuffer(primitive: Primitive, vertexHandles: VertexHandles): void;

  /**
   * Deletes all vertex-related resources (vertex buffers, index buffers, VAOs).
   * This method ensures proper cleanup of all resources associated with vertex data.
   *
   * @param vertexHandles - Object containing handles to all vertex-related resources to delete
   */
  deleteVertexDataResources(vertexHandles: VertexHandles): void;

  /**
   * Deletes a specific vertex buffer resource.
   *
   * @param resourceHandle - Handle to the vertex buffer to delete
   */
  deleteVertexBuffer(resourceHandle: CGAPIResourceHandle): void;

  /**
   * Configures the graphics pipeline with vertex data for rendering.
   * This method sets up the vertex array object (VAO) and binds the necessary buffers.
   *
   * @param bufferHandles - Object containing buffer handles
   * @param bufferHandles.vaoHandle - Vertex Array Object handle
   * @param bufferHandles.iboHandle - Index Buffer Object handle (optional)
   * @param bufferHandles.vboHandles - Array of Vertex Buffer Object handles
   * @param primitive - The primitive geometry defining vertex layout
   * @param instanceIDBufferUid - Handle to instance ID buffer for instanced rendering
   */
  setVertexDataToPipeline(
    {
      vaoHandle,
      iboHandle,
      vboHandles,
    }: {
      vaoHandle: CGAPIResourceHandle;
      iboHandle?: CGAPIResourceHandle;
      vboHandles: Array<CGAPIResourceHandle>;
    },
    primitive: Primitive,
    instanceIDBufferUid: CGAPIResourceHandle
  ): void;

  /**
   * Creates a shader program from vertex and fragment shader source code.
   * This method compiles, links, and validates the shader program for use in rendering.
   *
   * @param options - Shader program creation parameters
   * @param options.config - Configuration for the shader program
   * @param options.engine - Engine instance for logging
   * @param options.material - Material that will use this shader program
   * @param options.primitive - Primitive geometry that will be rendered with this shader
   * @param options.vertexShaderStr - Vertex shader source code
   * @param options.fragmentShaderStr - Fragment shader source code
   * @param options.attributeNames - Names of vertex attributes
   * @param options.attributeSemantics - Semantic meanings of vertex attributes
   * @param options.onError - Optional error callback for compilation/linking errors
   * @returns The shader program resource handle
   */
  createShaderProgram({
    config,
    engine,
    material,
    primitive,
    vertexShaderStr,
    fragmentShaderStr,
    attributeNames,
    attributeSemantics,
    onError,
  }: {
    config: Config;
    engine: Engine;
    material: Material;
    primitive: Primitive;
    vertexShaderStr: string;
    fragmentShaderStr: string;
    attributeNames: AttributeNames;
    attributeSemantics: VertexAttributeEnum[];
    onError?: (message: string) => void;
  }): CGAPIResourceHandle;

  /**
   * Creates a cube texture from image files with automatic loading.
   * This method handles the loading and assembly of 6 cube faces from file sources.
   *
   * @param baseUri - Base URI for the cube texture files
   * @param mipLevelCount - Number of mipmap levels to generate
   * @param isNamePosNeg - Whether to use positive/negative naming convention
   * @param hdriFormat - HDRI format specification for high dynamic range textures
   * @returns Promise resolving to a tuple of [texture handle, sampler]
   */
  createCubeTextureFromFiles(
    engine: Engine,
    baseUri: string,
    mipLevelCount: Count,
    isNamePosNeg: boolean,
    hdriFormat: HdriFormatEnum
  ): Promise<[number, Sampler]>;

  /**
   * Allocates a texture with specified dimensions and format without initial data.
   * This creates an empty texture that can be filled later or used as a render target.
   *
   * @param options - Texture allocation parameters
   * @param options.format - Internal texture format
   * @param options.width - Texture width in pixels
   * @param options.height - Texture height in pixels
   * @param options.mipLevelCount - Number of mipmap levels to allocate
   * @returns The texture resource handle
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
  }): CGAPIResourceHandle;

  /**
   * Loads image data to a specific mipmap level of an existing texture.
   * This method allows for partial texture updates and mipmap level management.
   *
   * @param options - Image loading parameters
   * @param options.mipLevel - Target mipmap level
   * @param options.textureUid - Handle to the target texture
   * @param options.format - Format of the source image data
   * @param options.type - Data type of the source image
   * @param options.xOffset - X offset within the texture for the copy region
   * @param options.yOffset - Y offset within the texture for the copy region
   * @param options.width - Width of the image data to copy
   * @param options.height - Height of the image data to copy
   * @param options.rowSizeByPixel - Size of each row in pixels
   * @param options.data - The actual image data as a typed array
   */
  loadImageToMipLevelOfTexture2D({
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
    textureUid: CGAPIResourceHandle;
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
   * Creates a cube texture from provided image data for all six faces.
   * This method assembles a complete cube texture from individual face images.
   *
   * @param engine - The engine instance
   * @param mipLevelCount - Number of mipmap levels to generate
   * @param images - Array of image data objects, each containing all six cube faces
   * @param width - Width of each cube face in pixels
   * @param height - Height of each cube face in pixels
   * @returns Tuple containing [texture handle, sampler]
   */
  createCubeTexture(
    engine: Engine,
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
  ): [number, Sampler];

  /**
   * Creates a texture sampler with specified filtering and wrapping parameters.
   * Samplers define how textures are filtered and addressed during rendering.
   *
   * @param options - Sampler creation parameters
   * @param options.magFilter - Magnification filter mode
   * @param options.minFilter - Minification filter mode
   * @param options.wrapS - Texture wrapping mode for S coordinate
   * @param options.wrapT - Texture wrapping mode for T coordinate
   * @param options.wrapR - Texture wrapping mode for R coordinate
   * @param options.anisotropy - Whether to enable anisotropic filtering
   * @param options.isPremultipliedAlpha - Whether the texture uses premultiplied alpha
   * @param options.shadowCompareMode - Whether to enable shadow comparison mode
   * @returns The texture sampler resource handle
   */
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
  }): CGAPIResourceHandle;

  /**
   * Creates a texture from an HTML image element with specified parameters.
   * This method handles the conversion of HTML image elements to GPU textures.
   *
   * @param imageData - The HTML image element containing the texture data
   * @param options - Texture creation parameters
   * @param options.level - Mipmap level (typically 0 for base level)
   * @param options.internalFormat - Internal texture format for GPU storage
   * @param options.width - Texture width in pixels
   * @param options.height - Texture height in pixels
   * @param options.border - Border width (typically 0)
   * @param options.format - Pixel data format
   * @param options.type - Component data type
   * @param options.generateMipmap - Whether to automatically generate mipmaps
   * @returns Promise resolving to the texture resource handle
   */
  createTextureFromHTMLImageElement(
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
  ): Promise<CGAPIResourceHandle>;

  /**
   * Creates a texture from a data URI string.
   * This method decodes base64-encoded image data and creates a GPU texture.
   *
   * @param dataUri - The data URI string containing encoded image data
   * @param options - Texture creation parameters
   * @param options.level - Mipmap level (typically 0 for base level)
   * @param options.internalFormat - Internal texture format for GPU storage
   * @param options.border - Border width (typically 0)
   * @param options.format - Pixel data format
   * @param options.type - Component data type
   * @param options.generateMipmap - Whether to automatically generate mipmaps
   * @returns Promise resolving to the texture resource handle
   */
  createTextureFromDataUri(
    dataUri: string,
    {
      level,
      internalFormat,
      border,
      format,
      type,
      generateMipmap,
    }: {
      level: Index;
      internalFormat: TextureParameterEnum;
      border: Size;
      format: PixelFormatEnum;
      type: ComponentTypeEnum;
      generateMipmap: boolean;
    }
  ): Promise<CGAPIResourceHandle>;

  /**
   * Creates a render target texture for off-screen rendering.
   * This texture can be used as a color attachment in framebuffers for rendering operations.
   *
   * @param options - Render target creation parameters
   * @param options.width - Texture width in pixels
   * @param options.height - Texture height in pixels
   * @param options.mipLevelCount - Number of mipmap levels
   * @param options.format - Internal texture format
   * @returns The render target texture resource handle
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
  }): CGAPIResourceHandle;

  /**
   * Creates a render target texture array for layered rendering.
   * This allows rendering to multiple texture layers in a single pass.
   *
   * @param options - Render target array creation parameters
   * @param options.width - Texture width in pixels
   * @param options.height - Texture height in pixels
   * @param options.level - Mipmap level
   * @param options.internalFormat - Internal texture format
   * @param options.format - Pixel data format
   * @param options.type - Component data type
   * @param options.arrayLength - Number of texture layers
   * @returns The render target texture array resource handle
   */
  createRenderTargetTextureArray({
    width,
    height,
    level,
    internalFormat,
    format,
    type,
    arrayLength,
  }: {
    width: Size;
    height: Size;
    level: Index;
    internalFormat: TextureParameterEnum;
    format: PixelFormatEnum;
    type: ComponentTypeEnum;
    arrayLength: Count;
  }): CGAPIResourceHandle;

  /**
   * Creates a render target cube texture for environment mapping and shadow mapping.
   * This allows rendering to all six faces of a cube texture.
   *
   * @param options - Render target cube creation parameters
   * @param options.width - Texture width in pixels
   * @param options.height - Texture height in pixels
   * @param options.mipLevelCount - Number of mipmap levels
   * @param options.format - Internal texture format
   * @returns The render target cube texture resource handle
   */
  createRenderTargetTextureCube({
    width,
    height,
    mipLevelCount,
    format,
  }: {
    width: Size;
    height: Size;
    mipLevelCount: Size;
    format: TextureParameterEnum;
  }): CGAPIResourceHandle;

  /**
   * Creates a texture array from provided image data.
   * Texture arrays allow efficient rendering of multiple related textures.
   *
   * @param width - Texture width in pixels
   * @param height - Texture height in pixels
   * @param arrayLength - Number of textures in the array
   * @param mipLevelCount - Number of mipmap levels
   * @param internalFormat - Internal texture format
   * @param format - Pixel data format
   * @param type - Component data type
   * @param imageData - The texture data as a typed array
   * @returns The texture array resource handle
   */
  createTextureArray(
    width: Size,
    height: Size,
    arrayLength: Size,
    mipLevelCount: Size,
    internalFormat: TextureFormatEnum,
    format: PixelFormatEnum,
    type: ComponentTypeEnum,
    imageData: TypedArray
  ): CGAPIResourceHandle;

  /**
   * Deletes a texture resource and frees associated GPU memory.
   *
   * @param textureHandle - Handle to the texture to delete
   */
  deleteTexture(textureHandle: CGAPIResourceHandle): void;

  /**
   * Generates mipmaps for a 2D texture.
   * Mipmaps improve rendering quality and performance by providing pre-filtered texture versions.
   *
   * @param textureHandle - Handle to the texture
   * @param width - Base texture width in pixels
   * @param height - Base texture height in pixels
   */
  generateMipmaps2d(textureHandle: CGAPIResourceHandle, width: number, height: number): void;

  /**
   * Generates mipmaps for a cube texture.
   * This creates mipmaps for all six faces of the cube texture.
   *
   * @param textureHandle - Handle to the cube texture
   * @param width - Base texture width in pixels
   * @param height - Base texture height in pixels
   */
  generateMipmapsCube(textureHandle: CGAPIResourceHandle, width: number, height: number): void;

  /**
   * Reads pixel data from a texture attached to a framebuffer.
   * This allows CPU access to rendered texture data for analysis or processing.
   *
   * @param textureHandle - Handle to the texture to read from
   * @param width - Width of the region to read
   * @param height - Height of the region to read
   * @param frameBufferUid - Handle to the framebuffer containing the texture
   * @param colorAttachmentIndex - Index of the color attachment to read from
   * @returns Promise resolving to the pixel data as a Uint8Array
   */
  getTexturePixelData(
    textureHandle: CGAPIResourceHandle,
    width: number,
    height: number,
    frameBufferUid: CGAPIResourceHandle,
    colorAttachmentIndex: number
  ): Promise<Uint8Array>;

  /**
   * Creates a framebuffer object for off-screen rendering.
   * Framebuffers allow rendering to textures instead of the default screen buffer.
   *
   * @returns The framebuffer object resource handle
   */
  createFrameBufferObject(): CGAPIResourceHandle;

  /**
   * Attaches a color buffer (texture or renderbuffer) to a framebuffer object.
   * This allows the framebuffer to render color data to the attached buffer.
   *
   * @param framebuffer - The target framebuffer
   * @param attachmentIndex - Color attachment index (0-based)
   * @param renderable - The color buffer to attach
   */
  attachColorBufferToFrameBufferObject(framebuffer: FrameBuffer, attachmentIndex: Index, renderable: IRenderable): void;

  /**
   * Attaches a specific layer of a texture array as a color buffer to a framebuffer.
   * This enables layered rendering to texture arrays.
   *
   * @param framebuffer - The target framebuffer
   * @param attachmentIndex - Color attachment index (0-based)
   * @param renderable - The texture array to attach
   * @param layerIndex - Index of the layer to attach
   * @param mipLevel - Mipmap level to attach
   */
  attachColorBufferLayerToFrameBufferObject(
    framebuffer: FrameBuffer,
    attachmentIndex: Index,
    renderable: IRenderable,
    layerIndex: Index,
    mipLevel: Index
  ): void;

  /**
   * Attaches a specific face of a cube texture as a color buffer to a framebuffer.
   * This enables rendering to individual faces of cube textures.
   *
   * @param framebuffer - The target framebuffer
   * @param attachmentIndex - Color attachment index (0-based)
   * @param faceIndex - Cube face index (0-5)
   * @param mipLevel - Mipmap level to attach
   * @param renderable - The cube texture to attach
   */
  attachColorBufferCubeToFrameBufferObject(
    framebuffer: FrameBuffer,
    attachmentIndex: Index,
    faceIndex: Index,
    mipLevel: Index,
    renderable: IRenderable
  ): void;

  /**
   * Creates a renderbuffer for use as a framebuffer attachment.
   * Renderbuffers are optimized for use as render targets but cannot be sampled as textures.
   *
   * @param width - Renderbuffer width in pixels
   * @param height - Renderbuffer height in pixels
   * @param internalFormat - Internal format of the renderbuffer
   * @param isMSAA - Whether to enable multi-sample anti-aliasing
   * @param sampleCountMSAA - Number of MSAA samples (if MSAA is enabled)
   * @returns The renderbuffer resource handle
   */
  createRenderBuffer(
    width: Size,
    height: Size,
    internalFormat: TextureParameterEnum,
    isMSAA: boolean,
    sampleCountMSAA: Count
  ): CGAPIResourceHandle;

  /**
   * Deletes a renderbuffer resource and frees associated GPU memory.
   *
   * @param renderBufferUid - Handle to the renderbuffer to delete
   */
  deleteRenderBuffer(renderBufferUid: CGAPIResourceHandle): void;

  /**
   * Attaches a depth buffer to a framebuffer object.
   * The depth buffer stores per-pixel depth information for depth testing.
   *
   * @param framebuffer - The target framebuffer
   * @param renderable - The depth buffer to attach
   */
  attachDepthBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable): void;

  /**
   * Attaches a stencil buffer to a framebuffer object.
   * The stencil buffer enables stencil testing for advanced rendering effects.
   *
   * @param framebuffer - The target framebuffer
   * @param renderable - The stencil buffer to attach
   */
  attachStencilBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable): void;

  /**
   * Attaches a combined depth-stencil buffer to a framebuffer object.
   * This is more efficient than separate depth and stencil buffers when both are needed.
   *
   * @param framebuffer - The target framebuffer
   * @param renderable - The depth-stencil buffer to attach
   */
  attachDepthStencilBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable): void;

  /**
   * Deletes a framebuffer object and frees associated resources.
   *
   * @param frameBufferObjectHandle - Handle to the framebuffer to delete
   */
  deleteFrameBufferObject(frameBufferObjectHandle: CGAPIResourceHandle): void;

  /**
   * Checks if the current graphics API supports multi-view VR rendering.
   * Multi-view rendering allows efficient stereo rendering for VR applications.
   *
   * @returns True if multi-view VR rendering is supported, false otherwise
   */
  isSupportMultiViewVRRendering(engine: Engine): boolean;

  /**
   * Sets the viewport for rendering operations.
   * The viewport defines the area of the framebuffer that will be rendered to.
   *
   * @param viewport - Optional viewport rectangle as [x, y, width, height]. If not provided, uses full framebuffer
   */
  setViewport(engine: Engine, viewport?: Vector4): void;
}
