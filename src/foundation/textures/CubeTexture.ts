import RnObject from "../core/RnObject";
import AbstractTexture from "./AbstractTexture";
import WebGLResourceRepository from "../../webgl/WebGLResourceRepository";
import { HdriFormat } from "../definitions/HdriFormat";

export default class CubeTexture extends AbstractTexture {
  public baseUriToLoad?: string;
  public mipmapLevelNumber: number = 1;
  public hdriFormat = HdriFormat.LDR_SRGB;
  public isNamePosNeg = false;
  constructor() {
    super();
  }

  async loadTextureImages() {
    this.__startedToLoad = true;
    this.cgApiResourceUid = await WebGLResourceRepository.getInstance().createCubeTextureFromFiles(this.baseUriToLoad!, this.mipmapLevelNumber!, this.isNamePosNeg, this.hdriFormat);
    this.__isTextureReady = true;
  }

  loadTextureImagesAsync() {
    this.__startedToLoad = true;
    WebGLResourceRepository.getInstance().createCubeTextureFromFiles(this.baseUriToLoad!, this.mipmapLevelNumber!, this.isNamePosNeg, this.hdriFormat).then((cubeTextureUid)=>{
      this.cgApiResourceUid = cubeTextureUid;
    }).then(()=>{
      this.__isTextureReady = true;
    });
  }

}
