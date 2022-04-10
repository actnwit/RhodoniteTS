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
    renderBuffer.create(width, height, TextureParameter.Depth16, {
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
    frameBuffer.setColorAttachmentAt(textureNum, renderBuffer);
  }

  return frameBuffer;
}
/*
function createTexturesForRenderTarget(width: number, height:number, textureNum:number,
  {
    level = 0,
    internalFormat = TextureParameter.RGBA8,
    format = PixelFormat.RGBA,
    type = ComponentType.UnsignedByte,
    magFilter = TextureParameter.Linear,
    minFilter = TextureParameter.Linear,
    wrapS = TextureParameter.ClampToEdge,
    wrapT = TextureParameter.ClampToEdge
  }) {
  const frameBuffer = new FrameBuffer();
  frameBuffer.create(width, height);

  for (let i=0; i<textureNum; i++) {
    const renderTargetTexture = new RenderTargetTexture();
    renderTargetTexture.create({width, height, level, internalFormat, format, type, magFilter, minFilter, wrapS, wrapT});
    frameBuffer.setColorAttachmentAt(i, renderTargetTexture);
  }



  let format = gl.DEPTH_COMPONENT;
  let internalFormat = gl.DEPTH_COMPONENT;
  let type = gl.UNSIGNED_INT;
  if (GLBoost.isThisGLVersion_2(gl)) {
    type = gl.UNSIGNED_INT;
    format = gl.DEPTH_COMPONENT;
    internalFormat = gl.DEPTH_COMPONENT24;
  } else if (glem.extDepthTex) {
    type = glem.extDepthTex.UNSIGNED_INT_24_8_WEBGL;
    format = gl.DEPTH_STENCIL;
    internalFormat = gl.DEPTH_STENCIL;
  }

  const depthTexture = new RenderTargetTexture();
  depthTexture.create({width: width, height: height, level: 0, internalFormat: TextureParameter.Depth16, format: TextureParameter.Depth16,
     type: ComponentType.Float, magFilter: TextureParameter.Linear, minFilter: TextureParameter.Linear, wrapS: TextureParameter.ClampToEdge, wrapT: TextureParameter.ClampToEdge});

  frameBuffer.setDepthAttachment(depthTexture);

  return frameBuffer;
}
*/

export default Object.freeze({createTexturesForRenderTarget});
