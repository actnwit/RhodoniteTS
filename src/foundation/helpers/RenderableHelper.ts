import { FrameBuffer } from '../renderer/FrameBuffer';
import { RenderTargetTexture } from '../textures/RenderTargetTexture';
import {TextureParameter} from '../definitions/TextureParameter';
import {ComponentType} from '../definitions/ComponentType';
import {PixelFormat} from '../definitions/PixelFormat';
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
    magFilter = TextureParameter.Linear,
    minFilter = TextureParameter.Linear,
    wrapS = TextureParameter.ClampToEdge,
    wrapT = TextureParameter.ClampToEdge,
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
      magFilter,
      minFilter,
      wrapS,
      wrapT,
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
    renderBuffer.create(width, height, TextureParameter.RGBA8, {
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
    magFilter = TextureParameter.Linear,
    minFilter = TextureParameter.Linear,
    wrapS = TextureParameter.Repeat,
    wrapT = TextureParameter.Repeat,
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
    magFilter,
    minFilter,
    wrapS,
    wrapT,
  });

  frameBuffer.setDepthAttachment(depthTexture);

  return frameBuffer;
}

function createDepthBuffer2(
  width: number,
  height: number,
  {
    level = 0,
    internalFormat = TextureParameter.Depth32F,
    format = PixelFormat.DepthComponent,
    type = ComponentType.Float,
    magFilter = TextureParameter.Linear,
    minFilter = TextureParameter.Linear,
    wrapS = TextureParameter.Repeat,
    wrapT = TextureParameter.Repeat,
  }
) {
  const frameBuffer = new FrameBuffer();
  frameBuffer.create(width, height);

  const renderTargetTexture = new RenderTargetTexture();
  renderTargetTexture.create({
    width,
    height,
    level,
    internalFormat: TextureParameter.RGBA8,
    format: PixelFormat.RGBA,
    type: ComponentType.UnsignedByte,
    magFilter,
    minFilter,
    wrapS,
    wrapT,
  });
  frameBuffer.setColorAttachmentAt(0, renderTargetTexture);

  const depthTexture = new RenderTargetTexture();
  depthTexture.create({
    width,
    height,
    level,
    type,
    internalFormat,
    format,
    magFilter,
    minFilter,
    wrapS,
    wrapT,
  });

  frameBuffer.setDepthAttachment(depthTexture);

  return frameBuffer;
}

export const RenderableHelper = Object.freeze({
  createTexturesForRenderTarget,
  createDepthBuffer,
  createDepthBuffer2,
});
