import RnObject from "../core/Object";
import AbstractTexture from "./AbstractTexture";
import WebGLResourceRepository from "../../webgl/WebGLResourceRepository";

export default class CubeTexture extends AbstractTexture {
  public baseUriToLoad?: string;
  public mipmapLevelNumber?: number;
  public cubeTextureUid?: CGAPIResourceHandle;
  constructor() {
    super();
  }

  async loadTextureImages() {
    this.cubeTextureUid = await WebGLResourceRepository.getInstance().createCubeTextureFromFiles(this.baseUriToLoad!, this.mipmapLevelNumber!);
  }

  loadTextureImagesAsync() {
    WebGLResourceRepository.getInstance().createCubeTextureFromFiles(this.baseUriToLoad!, this.mipmapLevelNumber!).then((cubeTextureUid)=>{
      this.cubeTextureUid = cubeTextureUid;
    });
  }

}
