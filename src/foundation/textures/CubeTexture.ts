import RnObject from "../core/Object";
import AbstractTexture from "./AbstractTexture";
import WebGLResourceRepository from "../../webgl/WebGLResourceRepository";

export default class CubeTexture extends AbstractTexture {
  public baseUriToLoad?: string;
  public mipmapLevelNumber?: number;
  constructor() {
    super();
  }

  async loadTextureImagesAsync() {
    return await WebGLResourceRepository.getInstance().createCubeTextureFromFiles(this.baseUriToLoad!, this.mipmapLevelNumber!);
  }

  loadTextureImages() {
    return WebGLResourceRepository.getInstance().createCubeTextureFromFiles(this.baseUriToLoad!, this.mipmapLevelNumber!);
  }

}
