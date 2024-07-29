import { FrameBuffer } from '../renderer/FrameBuffer';
import { RenderTargetTexture } from '../textures/RenderTargetTexture';
import { TextureParameter, TextureParameterEnum } from '../definitions/TextureParameter';
import { ComponentType, ComponentTypeEnum } from '../definitions/ComponentType';
import { PixelFormat, PixelFormatEnum } from '../definitions/PixelFormat';
import { RenderBuffer } from '../textures/RenderBuffer';

export interface TextureParameters {
  level: number;
  internalFormat: TextureParameterEnum;
}

export interface FrameBufferDescriptor {
  width: number;
  height: number;
  textureNum: number;
  textureParametersList: TextureParameters[];
  createDepthBuffer: boolean;
  depthBufferInternalFormat?: TextureParameterEnum;
}

function createFrameBuffer(desc: FrameBufferDescriptor) {
  const frameBuffer = new FrameBuffer();
  frameBuffer.create(desc.width, desc.height);

  for (let i = 0; i < desc.textureNum; i++) {
    const renderTargetTexture = new RenderTargetTexture();

    renderTargetTexture.create({
      width: desc.width,
      height: desc.height,
      level: desc.textureParametersList[i].level,
      internalFormat: desc.textureParametersList[i].internalFormat,
    });
    frameBuffer.setColorAttachmentAt(i, renderTargetTexture);
  }

  if (desc.createDepthBuffer) {
    const depthTexture = new RenderTargetTexture();
    const depthBufferInternalFormat = desc.depthBufferInternalFormat ?? TextureParameter.Depth32F;

    depthTexture.create({
      width: desc.width,
      height: desc.height,
      level: 0,
      internalFormat: depthBufferInternalFormat,
    });
    frameBuffer.setDepthAttachment(depthTexture);
  }

  return frameBuffer;
}

export interface FrameBufferMSAADescriptor {
  width: number;
  height: number;
  colorBufferNum: number;
  colorInternalFormatList: TextureParameterEnum[];
  sampleCountMSAA: number;
  depthBufferInternalFormat: TextureParameterEnum;
}

function createFrameBufferMSAA(desc: FrameBufferMSAADescriptor) {
  const frameBuffer = new FrameBuffer();
  frameBuffer.create(desc.width, desc.height);

  for (let i = 0; i < desc.colorBufferNum; i++) {
    const renderBuffer = new RenderBuffer();
    renderBuffer.create(desc.width, desc.height, desc.colorInternalFormatList[i], {
      isMSAA: true,
      sampleCountMSAA: desc.sampleCountMSAA,
    });
    frameBuffer.setColorAttachmentAt(i, renderBuffer);
  }

  const renderBuffer = new RenderBuffer();
  renderBuffer.create(
    desc.width,
    desc.height,
    desc.depthBufferInternalFormat ?? TextureParameter.Depth24,
    {
      isMSAA: true,
      sampleCountMSAA: desc.sampleCountMSAA,
    }
  );
  frameBuffer.setDepthAttachment(renderBuffer);

  return frameBuffer;
}

function createTexturesForRenderTarget(
  width: number,
  height: number,
  textureNum: number,
  {
    level = 0,
    internalFormat = TextureParameter.RGBA8,
    createDepthBuffer = true,
    isMSAA = false,
    sampleCountMSAA = 4,
  }
) {
  const frameBuffer = new FrameBuffer();
  frameBuffer.create(width, height);

  if (!isMSAA) {
    for (let i = 0; i < textureNum; i++) {
      const renderTargetTexture = new RenderTargetTexture();
      renderTargetTexture.create({
        width,
        height,
        level,
        internalFormat,
      });
      frameBuffer.setColorAttachmentAt(i, renderTargetTexture);
    }
  }

  if (createDepthBuffer) {
    const renderBuffer = new RenderBuffer();
    renderBuffer.create(width, height, TextureParameter.Depth24, {
      isMSAA,
      sampleCountMSAA,
    });
    frameBuffer.setDepthAttachment(renderBuffer);
  }

  if (isMSAA) {
    const renderBuffer = new RenderBuffer();
    renderBuffer.create(width, height, internalFormat, {
      isMSAA,
      sampleCountMSAA,
    });
    frameBuffer.setColorAttachmentAt(0, renderBuffer);
  }

  return frameBuffer;
}

export interface FrameBufferTextureArrayDescriptor {
  width: number;
  height: number;
  arrayLength: number;
  level: number;
  internalFormat: TextureParameterEnum;
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
  frameBuffer.setColorAttachmentAt(0, renderTargetTexture);

  const renderTargetDepthStencilTexture = new RenderTargetTexture();
  renderTargetDepthStencilTexture.createTextureArray({
    width: desc.width,
    height: desc.height,
    level: desc.level,
    internalFormat: TextureParameter.Depth32FStencil8,
    format: PixelFormat.DepthStencil,
    type: ComponentType.Float,
    arrayLength: desc.arrayLength,
  });

  frameBuffer.setDepthStencilAttachment(renderTargetDepthStencilTexture);

  return frameBuffer;
}

function createDepthBuffer(
  width: number,
  height: number,
  { level = 0, internalFormat = TextureParameter.Depth32F }
) {
  const frameBuffer = new FrameBuffer();
  frameBuffer.create(width, height);

  const depthTexture = new RenderTargetTexture();
  depthTexture.create({
    width,
    height,
    level,
    internalFormat,
  });

  frameBuffer.setDepthAttachment(depthTexture);

  return frameBuffer;
}

export const RenderableHelper = Object.freeze({
  createFrameBuffer,
  createFrameBufferMSAA,
  createTexturesForRenderTarget,
  createFrameBufferTextureArray,
  createDepthBuffer,
});
