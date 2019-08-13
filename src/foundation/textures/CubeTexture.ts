import RnObject from "../core/RnObject";
import AbstractTexture from "./AbstractTexture";
import { HdriFormat } from "../definitions/HdriFormat";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";

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
    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    this.cgApiResourceUid = await webGLResourceRepository.createCubeTextureFromFiles(this.baseUriToLoad!, this.mipmapLevelNumber!, this.isNamePosNeg, this.hdriFormat);
    this.__isTextureReady = true;
  }

  loadTextureImagesAsync() {
    this.__startedToLoad = true;
    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    webGLResourceRepository.createCubeTextureFromFiles(this.baseUriToLoad!, this.mipmapLevelNumber!, this.isNamePosNeg, this.hdriFormat).then((cubeTextureUid)=>{
      this.cgApiResourceUid = cubeTextureUid;
    }).then(()=>{
      this.__isTextureReady = true;
    });
  }

  load1x1Texture(rgbaStr = 'rgba(0,0,0,1)') {
    var canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = rgbaStr;
    ctx.fillRect(0, 0, 1, 1);
    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();

    this.cgApiResourceUid = webGLResourceRepository.createCubeTexture(1, [{ posX: canvas, negX: canvas, posY: canvas, negY: canvas, posZ: canvas, negZ: canvas }], 1, 1);
    this.__isTextureReady = true;
  }

}
