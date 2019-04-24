import RnObject from "../core/RnObject";
import AbstractTexture from "./AbstractTexture";
import WebGLResourceRepository from "../../webgl/WebGLResourceRepository";

export default class CubeTexture extends AbstractTexture {
  public baseUriToLoad?: string;
  public mipmapLevelNumber: number = 1;
  public isHdr = false;
  constructor() {
    super();
  }

  async loadTextureImages() {
    this.__startedToLoad = true;
    this.cgApiResourceUid = await WebGLResourceRepository.getInstance().createCubeTextureFromFiles(this.baseUriToLoad!, this.mipmapLevelNumber!, this.isHdr);
    this.__isTextureReady = true;
  }

  loadTextureImagesAsync() {
    this.__startedToLoad = true;
    WebGLResourceRepository.getInstance().createCubeTextureFromFiles(this.baseUriToLoad!, this.mipmapLevelNumber!, this.isHdr).then((cubeTextureUid)=>{
      this.cgApiResourceUid = cubeTextureUid;
    }).then(()=>{
      this.__isTextureReady = true;
    });
  }

}
