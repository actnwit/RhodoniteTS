import RnObject from "../core/RnObject";
import AbstractTexture from "./AbstractTexture";
import WebGLResourceRepository from "../../webgl/WebGLResourceRepository";

export default class CubeTexture extends AbstractTexture {
  public baseUriToLoad?: string;
  public mipmapLevelNumber: number = 1;
  constructor() {
    super();
  }

  async loadTextureImages() {
    this.__startedToLoad = true;
    this.cgApiResourceUid = await WebGLResourceRepository.getInstance().createCubeTextureFromFiles(this.baseUriToLoad!, this.mipmapLevelNumber!);
    this.__isTextureReady = true;
  }

  loadTextureImagesAsync() {
    this.__startedToLoad = true;
    WebGLResourceRepository.getInstance().createCubeTextureFromFiles(this.baseUriToLoad!, this.mipmapLevelNumber!).then((cubeTextureUid)=>{
      this.cgApiResourceUid = cubeTextureUid;
    }).then(()=>{
      this.__isTextureReady = true;
    });
  }

}
