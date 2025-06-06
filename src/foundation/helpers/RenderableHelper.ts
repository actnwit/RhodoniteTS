import { FrameBuffer } from '../renderer/FrameBuffer';
import { RenderTargetTexture } from '../textures/RenderTargetTexture';
import { TextureParameter, type TextureParameterEnum } from '../definitions/TextureParameter';
import { ComponentType, type ComponentTypeEnum } from '../definitions/ComponentType';
import { PixelFormat, type PixelFormatEnum } from '../definitions/PixelFormat';
import { RenderBuffer } from '../textures/RenderBuffer';
import { TextureFormat, type TextureFormatEnum } from '../definitions/TextureFormat';
import { RenderTargetTexture2DArray, RenderTargetTextureCube } from '../textures';

/**
 * Parameters for texture configuration
 */
export interface TextureParameters {
  /** Mip level of the texture */
  level: number;
  /** Texture format parameter */
  format: TextureParameterEnum;
}

/**
 * Descriptor for creating a standard frame buffer with color and optional depth attachments
 */
export interface FrameBufferDescriptor {
  /** Width of the frame buffer in pixels */
  width: number;
  /** Height of the frame buffer in pixels */
  height: number;
  /** Number of color texture attachments */
  textureNum: number;
  /** Array of texture formats for each color attachment */
  textureFormats: TextureFormatEnum[];
  /** Number of mip levels to generate (optional) */
  mipLevelCount?: number;
  /** Whether to create a depth buffer attachment */
  createDepthBuffer: boolean;
  /** Format for the depth texture (optional, defaults to Depth32F) */
  depthTextureFormat?: TextureFormatEnum;
}

/**
 * Creates a standard frame buffer with the specified configuration
 * @param desc - Frame buffer descriptor containing width, height, texture formats, and other options
 * @returns A configured FrameBuffer instance with color and optional depth attachments
 */
function createFrameBuffer(desc: FrameBufferDescriptor) {
  const frameBuffer = new FrameBuffer();
  frameBuffer.create(desc.width, desc.height);

  for (let i = 0; i < desc.textureNum; i++) {
    const renderTargetTexture = new RenderTargetTexture();

    renderTargetTexture.create({
      width: desc.width,
      height: desc.height,
      mipLevelCount: desc.mipLevelCount,
      format: desc.textureFormats[i],
    });
    frameBuffer.setColorAttachmentAt(i, renderTargetTexture);
  }

  if (desc.createDepthBuffer) {
    const depthTexture = new RenderTargetTexture();
    const depthBufferInternalFormat = desc.depthTextureFormat ?? TextureFormat.Depth32F;

    depthTexture.create({
      width: desc.width,
      height: desc.height,
      mipLevelCount: 1,
      format: depthBufferInternalFormat,
    });
    frameBuffer.setDepthAttachment(depthTexture);
  }

  return frameBuffer;
}

/**
 * Descriptor for creating a multi-sample anti-aliasing (MSAA) frame buffer
 */
export interface FrameBufferMSAADescriptor {
  /** Width of the frame buffer in pixels */
  width: number;
  /** Height of the frame buffer in pixels */
  height: number;
  /** Number of color buffer attachments */
  colorBufferNum: number;
  /** Array of color buffer formats */
  colorFormats: TextureFormatEnum[];
  /** Number of samples for MSAA */
  sampleCountMSAA: number;
  /** Format for the depth buffer */
  depthBufferFormat: TextureFormatEnum;
}

/**
 * Creates a frame buffer with multi-sample anti-aliasing (MSAA) support
 * @param desc - MSAA frame buffer descriptor containing dimensions, sample count, and buffer formats
 * @returns A configured FrameBuffer instance with MSAA render buffers
 */
function createFrameBufferMSAA(desc: FrameBufferMSAADescriptor) {
  const frameBuffer = new FrameBuffer();
  frameBuffer.create(desc.width, desc.height);

  for (let i = 0; i < desc.colorBufferNum; i++) {
    const renderBuffer = new RenderBuffer();
    renderBuffer.create(desc.width, desc.height, desc.colorFormats[i], {
      isMSAA: true,
      sampleCountMSAA: desc.sampleCountMSAA,
    });
    frameBuffer.setColorAttachmentAt(i, renderBuffer);
  }

  const renderBuffer = new RenderBuffer();
  renderBuffer.create(desc.width, desc.height, desc.depthBufferFormat, {
    isMSAA: true,
    sampleCountMSAA: desc.sampleCountMSAA,
  });
  frameBuffer.setDepthAttachment(renderBuffer);

  return frameBuffer;
}

/**
 * Descriptor for creating a frame buffer with 2D texture array attachment
 */
export interface FrameBufferTextureArrayDescriptor {
  /** Width of the frame buffer in pixels */
  width: number;
  /** Height of the frame buffer in pixels */
  height: number;
  /** Number of array layers in the texture */
  arrayLength: number;
  /** Mip level to use */
  level: number;
  /** Internal format of the texture */
  internalFormat: TextureFormatEnum;
  /** Pixel format of the texture */
  format: PixelFormatEnum;
  /** Component type of the texture data */
  type: ComponentTypeEnum;
}

/**
 * Creates a frame buffer with a 2D texture array attachment
 * @param desc - Texture array frame buffer descriptor
 * @returns A tuple containing the FrameBuffer and RenderTargetTexture2DArray
 */
function createFrameBufferTextureArray(
  desc: FrameBufferTextureArrayDescriptor
): [FrameBuffer, RenderTargetTexture2DArray] {
  const frameBuffer = new FrameBuffer();
  frameBuffer.create(desc.width, desc.height);

  const renderTargetTexture = new RenderTargetTexture2DArray();
  renderTargetTexture.create({
    width: desc.width,
    height: desc.height,
    level: desc.level,
    internalFormat: desc.internalFormat,
    format: desc.format,
    type: desc.type,
    arrayLength: desc.arrayLength,
  });
  frameBuffer.setColorAttachmentLayerAt(0, renderTargetTexture, 0, 0);

  return [frameBuffer, renderTargetTexture];
}

/**
 * Descriptor for creating a frame buffer with texture array for multi-view rendering
 */
export interface FrameBufferTextureArrayForMultiViewDescriptor {
  /** Width of the frame buffer in pixels */
  width: number;
  /** Height of the frame buffer in pixels */
  height: number;
  /** Number of array layers for multi-view rendering */
  arrayLength: number;
  /** Mip level to use */
  level: number;
  /** Internal format of the color texture */
  internalFormat: TextureFormatEnum;
  /** Pixel format of the color texture */
  format: PixelFormatEnum;
  /** Component type of the texture data */
  type: ComponentTypeEnum;
}

/**
 * Creates a frame buffer with texture arrays for multi-view rendering (e.g., VR/AR stereo rendering)
 * @param desc - Multi-view frame buffer descriptor
 * @returns A configured FrameBuffer with color and depth-stencil texture arrays
 */
function createFrameBufferTextureArrayForMultiView(desc: FrameBufferTextureArrayForMultiViewDescriptor) {
  const frameBuffer = new FrameBuffer();
  frameBuffer.create(desc.width, desc.height);

  const renderTargetTexture = new RenderTargetTexture2DArray();
  renderTargetTexture.create({
    width: desc.width,
    height: desc.height,
    level: desc.level,
    internalFormat: desc.internalFormat,
    format: desc.format,
    type: desc.type,
    arrayLength: desc.arrayLength,
  });
  frameBuffer.setColorAttachmentAt(0, renderTargetTexture);

  const renderTargetDepthStencilTexture = new RenderTargetTexture2DArray();
  renderTargetDepthStencilTexture.create({
    width: desc.width,
    height: desc.height,
    level: desc.level,
    internalFormat: TextureFormat.Depth32FStencil8,
    format: PixelFormat.DepthStencil,
    type: ComponentType.Float,
    arrayLength: desc.arrayLength,
  });

  frameBuffer.setDepthStencilAttachment(renderTargetDepthStencilTexture);

  return frameBuffer;
}

/**
 * Descriptor for creating a cube map frame buffer
 */
export interface FrameBufferCubeMapDescriptor {
  /** Width of each cube face in pixels */
  width: number;
  /** Height of each cube face in pixels */
  height: number;
  /** Texture format for the cube map */
  textureFormat: TextureFormatEnum;
  /** Number of mip levels to generate (optional) */
  mipLevelCount?: number;
}

/**
 * Creates a frame buffer with a cube map texture attachment for environment mapping or shadow mapping
 * @param desc - Cube map frame buffer descriptor
 * @returns A tuple containing the FrameBuffer and RenderTargetTextureCube
 */
function createFrameBufferCubeMap(desc: FrameBufferCubeMapDescriptor): [FrameBuffer, RenderTargetTextureCube] {
  const frameBuffer = new FrameBuffer();
  frameBuffer.create(desc.width, desc.height);

  const renderTargetTexture = new RenderTargetTextureCube();

  renderTargetTexture.create({
    width: desc.width,
    height: desc.height,
    mipLevelCount: desc.mipLevelCount,
    format: desc.textureFormat,
  });

  frameBuffer.setColorAttachmentCubeAt(0, 0, 0, renderTargetTexture);

  return [frameBuffer, renderTargetTexture];
}

/**
 * Creates a depth-only frame buffer for depth testing or shadow mapping
 * @param width - Width of the depth buffer in pixels
 * @param height - Height of the depth buffer in pixels
 * @param options - Configuration options for the depth buffer
 * @param options.level - Mip level to use (default: 0)
 * @param options.internalFormat - Internal format for the depth texture (default: Depth32F)
 * @returns A FrameBuffer configured with only a depth attachment
 */
function createDepthBuffer(width: number, height: number, { level = 0, internalFormat = TextureFormat.Depth32F }) {
  const frameBuffer = new FrameBuffer();
  frameBuffer.create(width, height);

  const depthTexture = new RenderTargetTexture();
  depthTexture.create({
    width,
    height,
    mipLevelCount: 1,
    format: internalFormat,
  });

  frameBuffer.setDepthAttachment(depthTexture);

  return frameBuffer;
}

/**
 * Utility helper for creating various types of frame buffers and render targets
 */
export const RenderableHelper = Object.freeze({
  createFrameBuffer,
  createFrameBufferMSAA,
  createFrameBufferTextureArray,
  createFrameBufferTextureArrayForMultiView,
  createFrameBufferCubeMap,
  createDepthBuffer,
});
