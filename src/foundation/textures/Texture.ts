import { PixelFormat, PixelFormatEnum } from "../definitions/PixelFormat";
import { ComponentType } from "../definitions/ComponentType";
import { TextureParameter, TextureParameterEnum } from "../definitions/TextureParameter";
import AbstractTexture from "./AbstractTexture";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";
import { Size, TypedArray, Count } from "../../commontypes/CommonTypes";
import Config from "../core/Config";
import { BasisFile, BasisTranscoder, BASIS } from "../../commontypes/BasisTexture";
import { ComponentTypeEnum } from "../../rhodonite";

declare const BASIS: BASIS;

export default class Texture extends AbstractTexture {
  private __imageData?: ImageData;
  public autoResize = true;
  public autoDetectTransparency = false;
  private static __loadedBasisFunc = false;
  private static __basisLoadPromise?: Promise<void>;
  private static __BasisFile?: new (x: Uint8Array) => BasisFile;

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

  generateTextureFromBasis(uint8Array: Uint8Array, options?: {
    level?: Count,
    internalFormat?: PixelFormatEnum,
    format?: PixelFormatEnum,
    type?: ComponentTypeEnum,
    magFilter?: TextureParameterEnum,
    minFilter?: TextureParameterEnum,
    wrapS?: TextureParameterEnum,
    wrapT?: TextureParameterEnum,
    generateMipmap?: boolean,
    anisotropy?: boolean,
    isPremultipliedAlpha?: boolean,
  }) {
    this.__startedToLoad = true;

    if (typeof BASIS === 'undefined') {
      console.error('Failed to call BASIS() function. Please check to import basis_transcoder.js.');
    }

    // download basis_transcoder.wasm once
    if (!Texture.__loadedBasisFunc) {
      Texture.__loadedBasisFunc = true;

      Texture.__basisLoadPromise = new Promise((resolve) => {
        BASIS().then((basisTransCoder: BasisTranscoder) => {
          const { initializeBasis } = basisTransCoder;
          initializeBasis();
          Texture.__BasisFile = basisTransCoder.BasisFile;

          this.__setBasisTexture(uint8Array, options);
          resolve();
        });
      });

    } else {
      // already download basis_transcoder.wasm or not
      if (Texture.__BasisFile) {
        this.__setBasisTexture(uint8Array, options);

      } else {
        Texture.__basisLoadPromise?.then(() => {
          this.__setBasisTexture(uint8Array, options);
        });
      }
    }
  }

  private __setBasisTexture(uint8Array: Uint8Array, {
    level = 0,
    internalFormat = PixelFormat.RGBA,
    format = PixelFormat.RGBA,
    type = ComponentType.Float,
    magFilter = TextureParameter.Linear,
    minFilter = TextureParameter.LinearMipmapLinear,
    wrapS = TextureParameter.Repeat,
    wrapT = TextureParameter.Repeat,
    generateMipmap = true,
    anisotropy = true,
    isPremultipliedAlpha = false
  } = {}): void {
    this.__startedToLoad = true;

    const basisFile = new Texture.__BasisFile!(uint8Array);
    const width = basisFile.getImageWidth(0, 0);
    const height = basisFile.getImageHeight(0, 0);

    if (!basisFile.startTranscoding()) {
      console.error("failed to start transcoding.");
      basisFile.close();
      basisFile.delete();
      return;
    }

    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const texture = webGLResourceRepository.createCompressedTextureFromBasis(basisFile, {
      border: 0, format, type, magFilter, minFilter, wrapS, wrapT, anisotropy, isPremultipliedAlpha
    });

    this.cgApiResourceUid = texture;
    this.__isTextureReady = true;

    AbstractTexture.__textureMap.set(texture, this);

    basisFile.close();
    basisFile.delete();
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
    anisotropy = true,
    isPremultipliedAlpha = false
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
      level, internalFormat,
      width: this.__width, height: this.__height, border: 0,
      format, type, magFilter, minFilter, wrapS, wrapT, generateMipmap, anisotropy, isPremultipliedAlpha
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
    anisotropy = true,
    isPremultipliedAlpha = false
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
          level, internalFormat,
          width: this.__width, height: this.__height, border: 0,
          format, type, magFilter, minFilter, wrapS, wrapT, generateMipmap, anisotropy, isPremultipliedAlpha
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
      wrapS: TextureParameter.ClampToEdge, wrapT: TextureParameter.ClampToEdge, generateMipmap: false, anisotropy: false, isPremultipliedAlpha: true
    });

    this.cgApiResourceUid = texture;
    this.__isTextureReady = true;
    AbstractTexture.__textureMap.set(texture, this);
  }

  generateTextureFromTypedArray(typedArray: TypedArray, {
    level = 0,
    internalFormat = PixelFormat.RGBA,
    format = PixelFormat.RGBA,
    magFilter = TextureParameter.Linear,
    minFilter = TextureParameter.LinearMipmapLinear,
    wrapS = TextureParameter.Repeat,
    wrapT = TextureParameter.Repeat,
    generateMipmap = true,
    anisotropy = true,
    isPremultipliedAlpha = false
  } = {}) {

    const type = ComponentType.fromTypedArray(typedArray);

    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    let texture = webGLResourceRepository.createTexture(
      typedArray, {
      level, internalFormat,
      width: this.__width, height: this.__height, border: 0,
      format, type, magFilter, minFilter, wrapS, wrapT, generateMipmap, anisotropy, isPremultipliedAlpha
    });

    this.cgApiResourceUid = texture;
    this.__isTextureReady = true;
  }

}
