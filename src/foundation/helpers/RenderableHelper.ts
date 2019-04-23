import FrameBuffer from "../renderer/FrameBuffer";
import RenderTargetTexture from "../textures/RenderTargetTexture";
import { TextureParameter } from "../definitions/TextureParameter";
import { ComponentType } from "../definitions/ComponentType";
import { PixelFormat } from "../definitions/PixelFormat";
import RenderBuffer from "../textures/RenderBuffer";

function createTexturesForRenderTarget(width: number, height:number, textureNum:number,
  {
    level = 0,
    internalFormat = PixelFormat.RGBA,
    format = PixelFormat.RGBA,
    type = ComponentType.UnsignedByte,
    magFilter = TextureParameter.Linear,
    minFilter = TextureParameter.LinearMipmapLinear,
    wrapS = TextureParameter.ClampToEdge,
    wrapT = TextureParameter.ClampToEdge
  }) {
  const frameBuffer = new FrameBuffer();
  frameBuffer.create(width, height);

  for (let i=0; i<textureNum; i++) {
    const renderTargetTexture = new RenderTargetTexture();
    renderTargetTexture.create({width, height, level, internalFormat, format, type, magFilter, minFilter, wrapS, wrapT});
    frameBuffer.setColorAttatchmentAt(i, renderTargetTexture);
  }

  const renderBuffer = new RenderBuffer();
  renderBuffer.create(width, height, TextureParameter.Depth24);

  frameBuffer.setDepthAttachment(renderBuffer);
}


export default Object.freeze({createTexturesForRenderTarget});