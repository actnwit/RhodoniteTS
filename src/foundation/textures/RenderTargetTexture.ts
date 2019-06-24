import ModuleManager from "../system/ModuleManager";
import AbstractTexture from "./AbstractTexture";
import WebGLResourceRepository from "../../webgl/WebGLResourceRepository";
import { TextureParameter, TextureParameterEnum } from "../definitions/TextureParameter";
import { PixelFormat, PixelFormatEnum } from "../definitions/PixelFormat";
import { ComponentType } from "../definitions/ComponentType";
import IRenderable from "./IRenderable";
import { ComponentTypeEnum } from "../main";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";

export default class RenderTargetTexture extends AbstractTexture implements IRenderable {

  private __fbo = -1;

  constructor() {
    super();
  }

  create(
    {
      width, height, level = 0,
      internalFormat = PixelFormat.RGBA,
      format = PixelFormat.RGBA,
      type = ComponentType.UnsignedByte,
      magFilter = TextureParameter.Linear,
      minFilter = TextureParameter.Linear,
      wrapS = TextureParameter.ClampToEdge,
      wrapT = TextureParameter.ClampToEdge
    }:
    {
      width: Size, height: Size, level: number,
      internalFormat: PixelFormatEnum,
      format: PixelFormatEnum,
      type: ComponentTypeEnum,
      magFilter: TextureParameterEnum,
      minFilter: TextureParameterEnum,
      wrapS: TextureParameterEnum,
      wrapT: TextureParameterEnum
    })
  {
    this.__width = width;
    this.__height = height;

    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
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

  destroy3DAPIResources() {
    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    webGLResourceRepository.deleteTexture(this.cgApiResourceUid);

    return true;
  }
}
