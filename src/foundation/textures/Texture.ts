import RnObject from "../core/RnObject";
import { PixelFormat } from "../definitions/PixelFormat";
import { ComponentType } from "../definitions/ComponentType";
import { TextureParameter } from "../definitions/TextureParameter";
import ModuleManager from "../system/ModuleManager";
import AbstractTexture from "./AbstractTexture";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";
import { thisExpression } from "@babel/types";
import { Size } from "../../types/CommonTypes";
import Config from "../core/Config";

export default class Texture extends AbstractTexture {
  private __imageData?: ImageData;
  public autoResize = true;
  public autoDetectTransparency = false;

  constructor() {
    super();
  }

  private __getResizedCanvas(image: HTMLImageElement, maxSize: Size) {
    var canvas = document.createElement("canvas");
    const potWidth = this.__getNearestPowerOfTwo(image.width);
    const potHeight = this.__getNearestPowerOfTwo(image.height);

    const aspect = potHeight / potWidth;
    let dstWidth = 0;
    let dstHeight = 0;
    if (potWidth > potHeight) {
      dstWidth = Math.min(potWidth, maxSize);
      dstHeight = dstWidth * aspect;
    } else {
      dstHeight = Math.min(potHeight, maxSize);
      dstWidth = dstHeight / aspect;
    }
    canvas.width = dstWidth;
    canvas.height = dstHeight;

    var ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, dstWidth, dstHeight);

    if (this.autoDetectTransparency) {
      this.__imageData = ctx.getImageData(0, 0, dstWidth, dstHeight);
      for (let y = 0; y < dstHeight; y++) {
        for (let x = 0; x < dstWidth; x++) {
          const alpha = this.__imageData.data[(x + y * dstWidth) * 4 + 3];
          if (alpha < 1) {
            this.__hasTransparentPixels = true;
            return canvas;
          }
        }
      }
      this.__hasTransparentPixels = false;
    }

    return canvas;
  }

  generateTextureFromImage(image: HTMLImageElement, {
    level = 0,
    internalFormat = PixelFormat.RGBA,
    format = PixelFormat.RGBA,
    type = ComponentType.Float,
    magFilter = TextureParameter.Linear,
    minFilter = TextureParameter.Linear,
    wrapS = TextureParameter.Repeat,
    wrapT = TextureParameter.Repeat,
    generateMipmap = true,
    anisotropy = true
  } = {}) {
    this.__startedToLoad = true;
    this.__htmlImageElement = image;

    let img;
    if (this.autoResize || this.autoDetectTransparency) {
      img = this.__getResizedCanvas(image, Config.maxSizeLimitOfNonCompressedTexture);
      this.__htmlCanvasElement = img;
    } else {
      img = image;
    }

    this.__width = img.width;
    this.__height = img.height;

    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    let texture = webGLResourceRepository.createTexture(
      img, {
      level: level, internalFormat: internalFormat, width: this.__width, height: this.__height,
      border: 0, format: format, type: type, magFilter: magFilter, minFilter: minFilter,
      wrapS: wrapS, wrapT: wrapT, generateMipmap: generateMipmap, anisotropy: anisotropy
    });

    this.cgApiResourceUid = texture;
    this.__isTextureReady = true;
    this.__uri = image.src;

    AbstractTexture.__textureMap.set(texture, this);
  }

  generateTextureFromUri(imageUri: string, {
    level = 0,
    internalFormat = PixelFormat.RGBA,
    format = PixelFormat.RGBA,
    type = ComponentType.Float,
    magFilter = TextureParameter.Linear,
    minFilter = TextureParameter.Linear,
    wrapS = TextureParameter.Repeat,
    wrapT = TextureParameter.Repeat,
    generateMipmap = true,
    anisotropy = true
  } = {}) {
    this.__uri = imageUri;
    this.__startedToLoad = true;
    return new Promise((resolve, reject) => {
      this.__img = new Image();
      if (!imageUri.match(/^data:/)) {
        this.__img.crossOrigin = 'Anonymous';
      }
      this.__img.onload = () => {
        this.__htmlImageElement = this.__img;

        let img;
        if (this.autoResize || this.autoDetectTransparency) {
          img = this.__getResizedCanvas(this.__img!, Config.maxSizeLimitOfNonCompressedTexture);
          this.__htmlCanvasElement = img;
        } else {
          img = this.__img!;
        }

        this.__width = img.width;
        this.__height = img.height;

        const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
        let texture = webGLResourceRepository.createTexture(
          img, {
          level: level, internalFormat: internalFormat, width: this.__width, height: this.__height,
          border: 0, format: format, type: type, magFilter: magFilter, minFilter: minFilter,
          wrapS: wrapS, wrapT: wrapT, generateMipmap: generateMipmap, anisotropy: anisotropy
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
