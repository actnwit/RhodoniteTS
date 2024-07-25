import { FrameBuffer } from '../renderer/FrameBuffer';
import { RenderTargetTexture } from '../textures/RenderTargetTexture';
import { TextureParameter, TextureParameterEnum } from '../definitions/TextureParameter';
import { ComponentType, ComponentTypeEnum } from '../definitions/ComponentType';
import { PixelFormat, PixelFormatEnum } from '../definitions/PixelFormat';
import { RenderBuffer } from '../textures/RenderBuffer';

export interface TextureParameters {
  level: number;
  internalFormat: TextureParameterEnum;
  format: PixelFormatEnum;
  type: ComponentTypeEnum;
}

function createFramebuffer(
  width: number,
  height: number,
  textureNum: number,
  textureParametersList: TextureParameters[],
  createDepthBuffer: boolean,
  depthBufferInternalFormat: TextureParameterEnum = TextureParameter.Depth32F
) {
  const frameBuffer = new FrameBuffer();
  frameBuffer.create(width, height);

  for (let i = 0; i < textureNum; i++) {
    const renderTargetTexture = new RenderTargetTexture();
    renderTargetTexture.create({
      width,
      height,
      level: textureParametersList[i].level,
      internalFormat: textureParametersList[i].internalFormat,
      format: textureParametersList[i].format,
      type: textureParametersList[i].type,
    });
    frameBuffer.setColorAttachmentAt(i, renderTargetTexture);
  }

  if (createDepthBuffer) {
    const depthTexture = new RenderTargetTexture();
    depthTexture.create({
      width,
      height,
      level: 0,
      type:
        depthBufferInternalFormat === TextureParameter.Depth32F ||
        depthBufferInternalFormat === TextureParameter.Depth32FStencil8
          ? ComponentType.Float
          : ComponentType.UnsignedByte,
      internalFormat: depthBufferInternalFormat,
      format: PixelFormat.DepthComponent,
    });
    frameBuffer.setDepthAttachment(depthTexture);
  }

  return frameBuffer;
}

function createFramebufferMSAA(
  width: number,
  height: number,
  colorBufferNum: number,
  colorInternalFormatList: TextureParameterEnum[],
  sampleCountMSAA: number,
  depthBufferInternalFormat: TextureParameterEnum = TextureParameter.Depth32F
) {
  const frameBuffer = new FrameBuffer();
  frameBuffer.create(width, height);

  for (let i = 0; i < colorBufferNum; i++) {
    const renderBuffer = new RenderBuffer();
    renderBuffer.create(width, height, colorInternalFormatList[i], {
      isMSAA: true,
      sampleCountMSAA,
    });
    frameBuffer.setColorAttachmentAt(i, renderBuffer);
  }

  const renderBuffer = new RenderBuffer();
  renderBuffer.create(width, height, depthBufferInternalFormat, {
    isMSAA: true,
    sampleCountMSAA,
  });
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
    format = PixelFormat.RGBA,
    type = ComponentType.UnsignedByte as ComponentTypeEnum,
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
        format,
        type,
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

function createTextureArrayForRenderTarget(
  width: number,
  height: number,
  arrayLength: number,
  {
    level = 0,
    internalFormat = TextureParameter.RGBA8,
    format = PixelFormat.RGBA,
    type = ComponentType.UnsignedByte as ComponentTypeEnum,
    createDepthBuffer = true,
    isMSAA = false,
    sampleCountMSAA = 4,
  }
) {
  const frameBuffer = new FrameBuffer();
  frameBuffer.create(width, height);

  const renderTargetTexture = new RenderTargetTexture();
  renderTargetTexture.createTextureArray({
    width,
    height,
    level,
    internalFormat,
    format,
    type,
    arrayLength,
  });
  frameBuffer.setColorAttachmentAt(0, renderTargetTexture);

  const renderTargetDepthStencilTexture = new RenderTargetTexture();
  renderTargetDepthStencilTexture.createTextureArray({
    width,
    height,
    level,
    internalFormat: TextureParameter.Depth32FStencil8,
    format,
    type,
    arrayLength,
  });

  frameBuffer.setDepthStencilAttachment(renderTargetDepthStencilTexture);

  return frameBuffer;
}

function createDepthBuffer(
  width: number,
  height: number,
  {
    level = 0,
    internalFormat = TextureParameter.Depth32F,
    format = PixelFormat.DepthComponent,
    type = ComponentType.Float,
  }
) {
  const frameBuffer = new FrameBuffer();
  frameBuffer.create(width, height);

  const depthTexture = new RenderTargetTexture();
  depthTexture.create({
    width,
    height,
    level,
    type,
    internalFormat,
    format,
  });

  frameBuffer.setDepthAttachment(depthTexture);

  return frameBuffer;
}

export const RenderableHelper = Object.freeze({
  createTexturesForRenderTarget,
  createTextureArrayForRenderTarget,
  createDepthBuffer,
});
