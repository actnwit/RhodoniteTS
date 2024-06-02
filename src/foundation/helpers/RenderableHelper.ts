import { FrameBuffer } from '../renderer/FrameBuffer';
import { RenderTargetTexture } from '../textures/RenderTargetTexture';
import { TextureParameter } from '../definitions/TextureParameter';
import { ComponentType } from '../definitions/ComponentType';
import { PixelFormat } from '../definitions/PixelFormat';
import { RenderBuffer } from '../textures/RenderBuffer';

function createTexturesForRenderTarget(
  width: number,
  height: number,
  textureNum: number,
  {
    level = 0,
    internalFormat = TextureParameter.RGBA8,
    format = PixelFormat.RGBA,
    type = ComponentType.UnsignedByte,
    createDepthBuffer = true,
    isMSAA = false,
    sampleCountMSAA = 4,
  }
) {
  const frameBuffer = new FrameBuffer();
  frameBuffer.create(width, height);

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
  createDepthBuffer,
});
