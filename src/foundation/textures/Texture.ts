import RnObject from "../core/RnObject";
import { PixelFormat } from "../definitions/PixelFormat";
import { ComponentType } from "../definitions/ComponentType";
import { TextureParameter } from "../definitions/TextureParameter";
import ModuleManager from "../system/ModuleManager";
import AbstractTexture from "./AbstractTexture";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";

export default class Texture extends AbstractTexture {
  constructor() {
    super();
  }

  private __getResizedCanvas(image: HTMLImageElement) {
    var canvas = document.createElement("canvas");
    canvas.width = this.__getNearestPowerOfTwo(image.width);
    canvas.height = this.__getNearestPowerOfTwo(image.height);

    var ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    return canvas;
  }

  generateTextureFromImage(image: HTMLImageElement) {
    this.__startedToLoad = true;
    this.__htmlImageElement = image;
    let imgCanvas = this.__getResizedCanvas(image);
    this.__htmlCanvasElement = imgCanvas;

    this.__width = imgCanvas.width;
    this.__height = imgCanvas.height;

    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    let texture = webGLResourceRepository.createTexture(
      imgCanvas, {
        level: 0, internalFormat: PixelFormat.RGBA, width: this.__width, height: this.__height,
        border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Linear, minFilter: TextureParameter.LinearMipmapLinear,
        wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat, generateMipmap: true, anisotropy: true
      });

    this.cgApiResourceUid = texture;
    this.__isTextureReady = true;
    this.__uri = image.src;

    AbstractTexture.__textureMap.set(texture, this);
  }

  generateTextureFromUri(imageUri: string) {
    this.__uri = imageUri;
    this.__startedToLoad = true;
    return new Promise((resolve, reject)=> {
      this.__img = new Image();
      if (!imageUri.match(/^data:/)) {
        this.__img.crossOrigin = 'Anonymous';
      }
      this.__img.onload = () => {
        this.__htmlImageElement = this.__img;
        let imgCanvas = this.__getResizedCanvas(this.__img!);
        this.__htmlCanvasElement = imgCanvas;
        this.__width = imgCanvas.width;
        this.__height = imgCanvas.height;

        const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
        let texture = webGLResourceRepository.createTexture(
          imgCanvas, {
            level: 0, internalFormat: PixelFormat.RGBA, width: this.__width, height: this.__height,
            border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Linear, minFilter: TextureParameter.Linear,
            wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat, generateMipmap: true, anisotropy: true
          });

        this.cgApiResourceUid = texture;
        this.__isTextureReady = true;
        AbstractTexture.__textureMap.set(texture, this);

        resolve();
      };

      this.__img.src = imageUri;
    });
  }

  generate1x1TextureFrom(rgbaStr: string = "rgba(255,255,255,1)") {
    var canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = rgbaStr;
    ctx.fillRect(0, 0, 1, 1);

    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const texture = webGLResourceRepository.createTexture(canvas, {
      level: 0, internalFormat: PixelFormat.RGBA, width: 1, height: 1,
      border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
      wrapS: TextureParameter.ClampToEdge, wrapT: TextureParameter.ClampToEdge, generateMipmap: false, anisotropy: false
    });

    this.cgApiResourceUid = texture;
    this.__isTextureReady = true;
    AbstractTexture.__textureMap.set(texture, this);
  }
}
