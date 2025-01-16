import { FrameBuffer } from '../renderer/FrameBuffer';
import { RenderTargetTexture } from '../textures/RenderTargetTexture';
import { TextureParameter, TextureParameterEnum } from '../definitions/TextureParameter';
import { ComponentType, ComponentTypeEnum } from '../definitions/ComponentType';
import { PixelFormat, PixelFormatEnum } from '../definitions/PixelFormat';
import { RenderBuffer } from '../textures/RenderBuffer';
import { TextureFormat, TextureFormatEnum } from '../definitions/TextureFormat';
import { RenderTargetTextureCube } from '../textures';

export interface TextureParameters {
  level: number;
  format: TextureParameterEnum;
}

export interface FrameBufferDescriptor {
  width: number;
  height: number;
  textureNum: number;
  textureFormats: TextureFormatEnum[];
  mipLevelCount?: number;
  createDepthBuffer: boolean;
  depthTextureFormat?: TextureFormatEnum;
}

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

export interface FrameBufferMSAADescriptor {
  width: number;
  height: number;
  colorBufferNum: number;
  colorFormats: TextureFormatEnum[];
  sampleCountMSAA: number;
  depthBufferFormat: TextureFormatEnum;
}

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

export interface FrameBufferTextureArrayDescriptor {
  width: number;
  height: number;
  arrayLength: number;
  level: number;
  internalFormat: TextureFormatEnum;
  format: PixelFormatEnum;
  type: ComponentTypeEnum;
}

function createFrameBufferTextureArray(desc: FrameBufferTextureArrayDescriptor) {
  const frameBuffer = new FrameBuffer();
  frameBuffer.create(desc.width, desc.height);

  const renderTargetTexture = new RenderTargetTexture();
  renderTargetTexture.createTextureArray({
    width: desc.width,
    height: desc.height,
    level: desc.level,
    internalFormat: desc.internalFormat,
    format: desc.format,
    type: desc.type,
    arrayLength: desc.arrayLength,
  });
  frameBuffer.setColorAttachmentLayerAt(0, renderTargetTexture, 0, 0);

  return frameBuffer;
}

export interface FrameBufferTextureArrayForMultiViewDescriptor {
  width: number;
  height: number;
  arrayLength: number;
  level: number;
  internalFormat: TextureFormatEnum;
  format: PixelFormatEnum;
  type: ComponentTypeEnum;
}

function createFrameBufferTextureArrayForMultiView(
  desc: FrameBufferTextureArrayForMultiViewDescriptor
) {
  const frameBuffer = new FrameBuffer();
  frameBuffer.create(desc.width, desc.height);

  const renderTargetTexture = new RenderTargetTexture();
  renderTargetTexture.createTextureArray({
    width: desc.width,
    height: desc.height,
    level: desc.level,
    internalFormat: desc.internalFormat,
    format: desc.format,
    type: desc.type,
    arrayLength: desc.arrayLength,
  });
  frameBuffer.setColorAttachmentAt(0, renderTargetTexture);

  const renderTargetDepthStencilTexture = new RenderTargetTexture();
  renderTargetDepthStencilTexture.createTextureArray({
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

export interface FrameBufferCubeMapDescriptor {
  width: number;
  height: number;
  textureFormat: TextureFormatEnum;
  mipLevelCount?: number;
}

function createFrameBufferCubeMap(
  desc: FrameBufferCubeMapDescriptor
): [FrameBuffer, RenderTargetTextureCube] {
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

function createDepthBuffer(
  width: number,
  height: number,
  { level = 0, internalFormat = TextureFormat.Depth32F }
) {
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

export const RenderableHelper = Object.freeze({
  createFrameBuffer,
  createFrameBufferMSAA,
  createFrameBufferTextureArray,
  createFrameBufferTextureArrayForMultiView,
  createFrameBufferCubeMap,
  createDepthBuffer,
});
