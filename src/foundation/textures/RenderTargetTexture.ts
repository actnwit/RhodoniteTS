import ModuleManager from "../system/ModuleManager";
import AbstractTexture from "./AbstractTexture";
import WebGLResourceRepository from "../../webgl/WebGLResourceRepository";
import { TextureParameter } from "../definitions/TextureParameter";
import { PixelFormat } from "../definitions/PixelFormat";
import { ComponentType } from "../definitions/ComponentType";
import IRenderable from "./IRenderable";

export default class RenderTargetTexture extends AbstractTexture implements IRenderable {

  private __fbo = -1;

  constructor() {
    super();
  }

  create(width: Size, height: Size, level = 0,
    internalFormat = PixelFormat.RGBA,
    format = PixelFormat.RGBA,
    type = ComponentType.UnsignedByte,
    magFilter = TextureParameter.Linear,
    minFilter = TextureParameter.LinearMipmapLinear,
    wrapS = TextureParameter.ClampToEdge,
    wrapT = TextureParameter.ClampToEdge)
  {
    const moduleManager = ModuleManager.getInstance();
    const moduleName = 'webgl';
    const webglModule = (moduleManager.getModule(moduleName)! as any);
    let webGLResourceRepository:WebGLResourceRepository = webglModule.WebGLResourceRepository.getInstance();
    const texture = webGLResourceRepository.createRenderTargetTexture(
      {width, height, level, internalFormat, format, type, magFilter, minFilter, wrapS, wrapT});
    this.cgApiResourceUid = texture;

    AbstractTexture.__textureMap.set(texture, this);
  }

  set fbo(fbo) {
    this.__fbo = fbo;
  }

  get fbo() {
    return this.__fbo;
  }
}
