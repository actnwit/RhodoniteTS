import RnObject from "../core/RnObject";
import IRenderable from "./IRenderable";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";
import { TextureParameterEnum } from "../definitions/TextureParameter";
import { Size, CGAPIResourceHandle } from "../../types/CommonTypes";

export default class RenderBuffer extends RnObject implements IRenderable {
  width: number = 0;
  height: number = 0;
  public cgApiResourceUid: CGAPIResourceHandle = -1;

  constructor() {
    super();
  }

  create(width: Size, height: Size, internalFormat: TextureParameterEnum) {
    this.width = width;
    this.height = height;
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    this.cgApiResourceUid = webglResourceRepository.createRenderBuffer(width, height, internalFormat);
  }

  destroy3DAPIResources() {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    webglResourceRepository.deleteRenderBuffer(this.cgApiResourceUid);

    return true;
  }
}
