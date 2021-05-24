import {PixelFormat, PixelFormatEnum} from '../definitions/PixelFormat';
import {ComponentType} from '../definitions/ComponentType';
import {
  TextureParameter,
  TextureParameterEnum,
} from '../definitions/TextureParameter';
import AbstractTexture from './AbstractTexture';
import CGAPIResourceRepository from '../renderer/CGAPIResourceRepository';
import {Size, TypedArray, Count} from '../../types/CommonTypes';
import Config from '../core/Config';
import {
  BasisFile,
  BasisTranscoder,
  BASIS,
} from '../../types/BasisTexture';
import {ComponentTypeEnum} from '../../foundation/definitions/ComponentType';
import DataUtil from '../misc/DataUtil';
import {CompressionTextureTypeEnum} from '../definitions/CompressionTextureType';
import {TextureData} from '../../webgl/WebGLResourceRepository';

declare const BASIS: BASIS;

export default class Texture extends AbstractTexture {
  public autoResize = true;
  public autoDetectTransparency = false;
  private static __loadedBasisFunc = false;
  private static __basisLoadPromise?: Promise<void>;
  private static __BasisFile?: new (x: Uint8Array) => BasisFile;

  constructor() {
    super();
  }

  generateTextureFromBasis(
    uint8Array: Uint8Array,
    options?: {
      level?: Count;
      internalFormat?: PixelFormatEnum;
      format?: PixelFormatEnum;
      type?: ComponentTypeEnum;
      magFilter?: TextureParameterEnum;
      minFilter?: TextureParameterEnum;
      wrapS?: TextureParameterEnum;
      wrapT?: TextureParameterEnum;
      generateMipmap?: boolean;
      anisotropy?: boolean;
      isPremultipliedAlpha?: boolean;
    }
  ) {
    this.__startedToLoad = true;

    if (typeof BASIS === 'undefined') {
      console.error(
        'Failed to call BASIS() function. Please check to import basis_transcoder.js.'
      );
    }

    // download basis_transcoder.wasm once
    if (!Texture.__loadedBasisFunc) {
      Texture.__loadedBasisFunc = true;

      Texture.__basisLoadPromise = new Promise(resolve => {
        BASIS().then((basisTransCoder: BasisTranscoder) => {
          const {initializeBasis} = basisTransCoder;
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

  private __setBasisTexture(
    uint8Array: Uint8Array,
    {
      level = 0,
      internalFormat = PixelFormat.RGBA,
      format = PixelFormat.RGBA,
      type = ComponentType.UnsignedByte,
      magFilter = TextureParameter.Linear,
      minFilter = TextureParameter.LinearMipmapLinear,
      wrapS = TextureParameter.Repeat,
      wrapT = TextureParameter.Repeat,
      generateMipmap = true,
      anisotropy = true,
      isPremultipliedAlpha = false,
    } = {}
  ): void {
    this.__startedToLoad = true;

    const basisFile = new Texture.__BasisFile!(uint8Array);

    if (!basisFile.startTranscoding()) {
      console.error('failed to start transcoding.');
      basisFile.close();
      basisFile.delete();
      return;
    }

    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const texture = webGLResourceRepository.createCompressedTextureFromBasis(
      basisFile,
      {
        border: 0,
        format,
        type,
        magFilter,
        minFilter,
        wrapS,
        wrapT,
        anisotropy,
        isPremultipliedAlpha,
      }
    );

    this.cgApiResourceUid = texture;
    this.__isTextureReady = true;

    AbstractTexture.__textureMap.set(texture, this);

    basisFile.close();
    basisFile.delete();
  }

  generateTextureFromImage(
    image: HTMLImageElement,
    {
      level = 0,
      internalFormat = PixelFormat.RGBA,
      format = PixelFormat.RGBA,
      type = ComponentType.UnsignedByte,
      magFilter = TextureParameter.Linear,
      minFilter = TextureParameter.Linear,
      wrapS = TextureParameter.Repeat,
      wrapT = TextureParameter.Repeat,
      generateMipmap = true,
      anisotropy = true,
      isPremultipliedAlpha = false,
    } = {}
  ) {
    this.__startedToLoad = true;
    this.__htmlImageElement = image;
    let img: HTMLImageElement | HTMLCanvasElement | ImageData = image;

    if (this.autoResize) {
      const [
        resizedCanvas,
        resizedWidth,
        resizedHeight,
      ] = DataUtil.getResizedCanvas(
        img,
        Config.maxSizeLimitOfNonCompressedTexture
      );
      img = resizedCanvas;
      this.__width = resizedWidth;
      this.__height = resizedHeight;
      this.__htmlCanvasElement = resizedCanvas;
    }

    if (this.autoDetectTransparency) {
      this.__hasTransparentPixels = DataUtil.detectTransparentPixelExistence(
        img
      );
    }

    this.__width = img.width;
    this.__height = img.height;

    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const texture = webGLResourceRepository.createTexture(img, {
      level,
      internalFormat,
      width: this.__width,
      height: this.__height,
      border: 0,
      format,
      type,
      magFilter,
      minFilter,
      wrapS,
      wrapT,
      generateMipmap,
      anisotropy,
      isPremultipliedAlpha,
    });

    this.cgApiResourceUid = texture;
    this.__isTextureReady = true;
    this.__uri = image.src;

    AbstractTexture.__textureMap.set(texture, this);
  }

  generateTextureFromUri(
    imageUri: string,
    {
      level = 0,
      internalFormat = PixelFormat.RGBA,
      format = PixelFormat.RGBA,
      type = ComponentType.UnsignedByte,
      magFilter = TextureParameter.Linear,
      minFilter = TextureParameter.Linear,
      wrapS = TextureParameter.Repeat,
      wrapT = TextureParameter.Repeat,
      generateMipmap = true,
      anisotropy = true,
      isPremultipliedAlpha = false,
    } = {}
  ) {
    this.__uri = imageUri;
    this.__startedToLoad = true;
    return new Promise((resolve, reject) => {
      this.__img = new Image();
      if (!imageUri.match(/^data:/)) {
        this.__img.crossOrigin = 'Anonymous';
      }
      this.__img.onload = () => {
        this.__htmlImageElement = this.__img;

        let img: HTMLImageElement | HTMLCanvasElement = this.__img!;

        if (this.autoResize) {
          const [
            resizedCanvas,
            resizedWidth,
            resizedHeight,
          ] = DataUtil.getResizedCanvas(
            img,
            Config.maxSizeLimitOfNonCompressedTexture
          );
          img = resizedCanvas;
          this.__width = resizedWidth;
          this.__height = resizedHeight;
          this.__htmlCanvasElement = resizedCanvas;
        }

        if (this.autoDetectTransparency) {
          this.__hasTransparentPixels = DataUtil.detectTransparentPixelExistence(
            img
          );
        }

        this.__width = img.width;
        this.__height = img.height;

        const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
        const texture = webGLResourceRepository.createTexture(img, {
          level,
          internalFormat,
          width: this.__width,
          height: this.__height,
          border: 0,
          format,
          type,
          magFilter,
          minFilter,
          wrapS,
          wrapT,
          generateMipmap,
          anisotropy,
          isPremultipliedAlpha,
        });

        this.cgApiResourceUid = texture;
        this.__isTextureReady = true;
        AbstractTexture.__textureMap.set(texture, this);

        resolve();
      };

      this.__img.src = imageUri;
    }) as Promise<void>;
  }

  generate1x1TextureFrom(rgbaStr = 'rgba(255,255,255,1)') {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    this.__width = 1;
    this.__height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = rgbaStr;
    ctx.fillRect(0, 0, 1, 1);

    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const texture = webGLResourceRepository.createTexture(canvas, {
      level: 0,
      internalFormat: PixelFormat.RGBA,
      width: 1,
      height: 1,
      border: 0,
      format: PixelFormat.RGBA,
      type: ComponentType.UnsignedByte,
      magFilter: TextureParameter.Nearest,
      minFilter: TextureParameter.Nearest,
      wrapS: TextureParameter.ClampToEdge,
      wrapT: TextureParameter.ClampToEdge,
      generateMipmap: false,
      anisotropy: false,
      isPremultipliedAlpha: true,
    });

    this.cgApiResourceUid = texture;
    this.__isTextureReady = true;
    AbstractTexture.__textureMap.set(texture, this);
  }

  generateTextureFromTypedArray(
    typedArray: TypedArray,
    {
      level = 0,
      internalFormat = PixelFormat.RGBA,
      format = PixelFormat.RGBA,
      magFilter = TextureParameter.Linear,
      minFilter = TextureParameter.LinearMipmapLinear,
      wrapS = TextureParameter.Repeat,
      wrapT = TextureParameter.Repeat,
      generateMipmap = true,
      anisotropy = true,
      isPremultipliedAlpha = false,
    } = {}
  ) {
    const type = ComponentType.fromTypedArray(typedArray);

    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const texture = webGLResourceRepository.createTexture(typedArray, {
      level,
      internalFormat,
      width: this.__width,
      height: this.__height,
      border: 0,
      format,
      type,
      magFilter,
      minFilter,
      wrapS,
      wrapT,
      generateMipmap,
      anisotropy,
      isPremultipliedAlpha,
    });

    this.cgApiResourceUid = texture;
    this.__isTextureReady = true;
    AbstractTexture.__textureMap.set(texture, this);
  }

  generateCompressedTextureFromTypedArray(
    typedArray: TypedArray,
    width: number,
    height: number,
    compressionTextureType: CompressionTextureTypeEnum,
    {
      magFilter = TextureParameter.Linear,
      minFilter = TextureParameter.LinearMipmapLinear,
      wrapS = TextureParameter.ClampToEdge,
      wrapT = TextureParameter.ClampToEdge,
      anisotropy = true,
      // isPremultipliedAlpha = false,
    } = {}
  ) {
    this.__width = width;
    this.__height = height;

    const textureData = {
      level: 0,
      width,
      height,
      buffer: typedArray,
    } as TextureData;

    const webGLResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();
    const texture = webGLResourceRepository.createCompressedTexture(
      [textureData],
      compressionTextureType,
      {
        magFilter,
        minFilter,
        wrapS,
        wrapT,
        anisotropy,
        // isPremultipliedAlpha,
      }
    );

    this.cgApiResourceUid = texture;
    this.__isTextureReady = true;
    AbstractTexture.__textureMap.set(texture, this);
  }

  importWebGLTextureDirectly(
    webGLTexture: WebGLTexture,
    width = 0,
    height = 0
  ) {
    this.__width = width;
    this.__height = height;
    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const texture = webGLResourceRepository.setWebGLTextureDirectly(
      webGLTexture
    );
    this.cgApiResourceUid = texture;
    this.__startedToLoad = true;
    this.__isTextureReady = true;
    AbstractTexture.__textureMap.set(texture, this);
  }
}
