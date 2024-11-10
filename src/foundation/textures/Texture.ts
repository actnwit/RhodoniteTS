import { PixelFormat, PixelFormatEnum } from '../definitions/PixelFormat';
import { ComponentType } from '../definitions/ComponentType';
import { TextureParameter, TextureParameterEnum } from '../definitions/TextureParameter';
import { AbstractTexture } from './AbstractTexture';
import { CGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import {
  TypedArray,
  Count,
  CGAPIResourceHandle,
  Index,
  Size,
  Offset,
} from '../../types/CommonTypes';
import { Config } from '../core/Config';
import { BasisFile, BasisTranscoder, BASIS } from '../../types/BasisTexture';
import { ComponentTypeEnum } from '../../foundation/definitions/ComponentType';
import { DataUtil } from '../misc/DataUtil';
import { CompressionTextureTypeEnum } from '../definitions/CompressionTextureType';
import { KTX2TextureLoader } from '../../webgl/textureLoader/KTX2TextureLoader';
import { TextureData, WebGLResourceRepository } from '../../webgl/WebGLResourceRepository';
import { ModuleManager } from '../system/ModuleManager';
import { ProcessApproach } from '../definitions/ProcessApproach';
import { SystemState } from '../system/SystemState';
import { WebGpuResourceRepository } from '../../webgpu/WebGpuResourceRepository';
import { TextureFormat, TextureFormatEnum } from '../definitions/TextureFormat';

declare const BASIS: BASIS;

export interface LoadImageToMipLevelDescriptor {
  mipLevel: Index; // mip level to load
  xOffset: Offset; // x offset in the texture to copy data
  yOffset: Offset; // y offset in the texture to copy data
  width: Size; // width in the texture to copy
  height: Size; // height in the texture to copy
  data: TypedArray; // image data in TypedArray
  rowSizeByPixel: Size; // row size by pixel of the image data
  type: ComponentTypeEnum; // component type of the image data
}

type FinalizationRegistryObject = {
  textureResourceUid: CGAPIResourceHandle;
  uniqueName: string;
};

export class Texture extends AbstractTexture implements Disposable {
  public autoResize = true;
  public autoDetectTransparency = false;
  private static __loadedBasisFunc = false;
  private static __basisLoadPromise?: Promise<void>;
  private static __BasisFile?: new (x: Uint8Array) => BasisFile;
  private __uriToLoadLazy?: string;
  private __imgToLoadLazy?: HTMLImageElement;
  private __optionsToLoadLazy?: {
    level: number;
    internalFormat: TextureParameterEnum;
    format: PixelFormatEnum;
    type: ComponentTypeEnum;
    generateMipmap: boolean;
  };

  private static managedRegistry: FinalizationRegistry<FinalizationRegistryObject> =
    new FinalizationRegistry<FinalizationRegistryObject>((texObj) => {
      console.warn(
        `WebGL/WebGPU Texture ${texObj.uniqueName} was automatically released by GC. But explicit release is recommended.`
      );
      Texture.__deleteInternalTexture(texObj.textureResourceUid);
    });

  constructor() {
    super();
  }

  private __setTextureResourceUid(textureResourceUid: CGAPIResourceHandle, uniqueName: string) {
    this._textureResourceUid = textureResourceUid;
    Texture.managedRegistry.register(this, { textureResourceUid, uniqueName }, this);
  }

  get hasDataToLoadLazy() {
    return this.__uriToLoadLazy != null || this.__imgToLoadLazy != null;
  }

  generateTextureFromBasis(
    uint8Array: Uint8Array,
    options: {
      level?: Count;
      internalFormat?: TextureParameterEnum;
      format?: PixelFormatEnum;
      type?: ComponentTypeEnum;
      generateMipmap?: boolean;
    }
  ) {
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

  private __setBasisTexture(
    uint8Array: Uint8Array,
    {
      level = 0,
      internalFormat = TextureFormat.RGBA8,
      format = PixelFormat.RGBA,
      type = ComponentType.UnsignedByte as ComponentTypeEnum,
      generateMipmap = true,
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

    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    const texture = cgApiResourceRepository.createCompressedTextureFromBasis(basisFile, {
      border: 0,
      format,
      type,
    });

    this.__setTextureResourceUid(texture, this.uniqueName);

    this.__isTextureReady = true;

    basisFile.close();
    basisFile.delete();
  }

  async generateTextureFromKTX2(uint8Array: Uint8Array) {
    this.__startedToLoad = true;

    const transcodedData = await KTX2TextureLoader.getInstance().transcode(uint8Array);
    this.__width = transcodedData.width;
    this.__height = transcodedData.height;
    this.generateCompressedTextureWithMipmapFromTypedArray(
      transcodedData.mipmapData,
      transcodedData.compressionTextureType
    );
  }

  generateTextureFromImage(
    image: HTMLImageElement,
    {
      level = 0,
      internalFormat = TextureFormat.RGBA8,
      format = PixelFormat.RGBA,
      type = ComponentType.UnsignedByte,
      generateMipmap = true,
    } = {}
  ) {
    this.__imgToLoadLazy = image;
    this.__optionsToLoadLazy = {
      level,
      internalFormat,
      format,
      type,
      generateMipmap,
    };
  }

  async loadFromImgLazy() {
    if (this.__imgToLoadLazy == null) {
      return;
    }
    const image = this.__imgToLoadLazy!;
    const level = this.__optionsToLoadLazy?.level ?? 0;
    const internalFormat = this.__optionsToLoadLazy?.internalFormat ?? TextureFormat.RGBA8;
    const format = this.__optionsToLoadLazy?.format ?? PixelFormat.RGBA;
    const type = this.__optionsToLoadLazy?.type ?? ComponentType.UnsignedByte;
    const generateMipmap = this.__optionsToLoadLazy?.generateMipmap ?? true;

    this.__startedToLoad = true;
    this.__htmlImageElement = image;
    let img: HTMLImageElement | HTMLCanvasElement | ImageData = image;

    if (this.autoResize) {
      const [resizedCanvas, resizedWidth, resizedHeight] = DataUtil.getResizedCanvas(
        img,
        Config.maxSizeLimitOfNonCompressedTexture
      );
      img = resizedCanvas;
      this.__width = resizedWidth;
      this.__height = resizedHeight;
      this.__htmlCanvasElement = resizedCanvas;
    }

    if (this.autoDetectTransparency) {
      this.__hasTransparentPixels = DataUtil.detectTransparentPixelExistence(img);
    }

    this.__width = img.width;
    this.__height = img.height;

    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    let texture: CGAPIResourceHandle;
    if (img instanceof HTMLImageElement) {
      texture = await cgApiResourceRepository.createTextureFromHTMLImageElement(img, {
        level,
        internalFormat,
        width: this.__width,
        height: this.__height,
        border: 0,
        format,
        type,
        generateMipmap,
      });
    } else if (img instanceof HTMLCanvasElement) {
      const textureHandle = cgApiResourceRepository.createTextureFromImageBitmapData(img, {
        level,
        internalFormat,
        width: this.__width,
        height: this.__height,
        border: 0,
        format,
        type,
        generateMipmap,
      });
      texture = textureHandle;
    } else {
      throw new Error('Unsupported image type.');
    }

    this.__setTextureResourceUid(texture, this.uniqueName);
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = (
        cgApiResourceRepository as WebGpuResourceRepository
      ).createTextureView2d(this._textureResourceUid);
    }
    this.__isTextureReady = true;
    this.__uri = image.src;

    this.__imgToLoadLazy = undefined;
  }

  generateTextureFromUri(
    imageUri: string,
    {
      level = 0,
      internalFormat = TextureFormat.RGBA8,
      format = PixelFormat.RGBA,
      type = ComponentType.UnsignedByte,
      generateMipmap = true,
    } = {}
  ) {
    this.__uriToLoadLazy = imageUri;
    this.__optionsToLoadLazy = {
      level,
      internalFormat,
      format,
      type,
      generateMipmap,
    };
  }

  async loadFromUrlLazy() {
    if (this.__uriToLoadLazy == null) {
      return;
    }
    const imageUri = this.__uriToLoadLazy;
    const level = this.__optionsToLoadLazy?.level ?? 0;
    const internalFormat = this.__optionsToLoadLazy?.internalFormat ?? TextureFormat.RGBA8;
    const format = this.__optionsToLoadLazy?.format ?? PixelFormat.RGBA;
    const type = this.__optionsToLoadLazy?.type ?? ComponentType.UnsignedByte;
    const generateMipmap = this.__optionsToLoadLazy?.generateMipmap ?? true;

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
          const [resizedCanvas, resizedWidth, resizedHeight] = DataUtil.getResizedCanvas(
            img,
            Config.maxSizeLimitOfNonCompressedTexture
          );
          img = resizedCanvas;
          this.__width = resizedWidth;
          this.__height = resizedHeight;
          this.__htmlCanvasElement = resizedCanvas;
        }

        if (this.autoDetectTransparency) {
          this.__hasTransparentPixels = DataUtil.detectTransparentPixelExistence(img);
        }

        this.__width = img.width;
        this.__height = img.height;

        const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();

        let texture: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
        (async () => {
          if (img instanceof HTMLImageElement) {
            texture = await cgApiResourceRepository.createTextureFromHTMLImageElement(img, {
              level,
              internalFormat,
              width: this.__width,
              height: this.__height,
              border: 0,
              format,
              type,
              generateMipmap,
            });
          } else if (img instanceof HTMLCanvasElement) {
            const textureHandle = cgApiResourceRepository.createTextureFromImageBitmapData(img, {
              level,
              internalFormat,
              width: this.__width,
              height: this.__height,
              border: 0,
              format,
              type,
              generateMipmap,
            });
            texture = textureHandle;
          } else {
            throw new Error('Unsupported image type');
          }
          this.__setTextureResourceUid(texture, this.uniqueName);
          if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
            this._textureViewResourceUid = (
              cgApiResourceRepository as WebGpuResourceRepository
            ).createTextureView2d(this._textureResourceUid);
          }
          this.__isTextureReady = true;
          this.__uriToLoadLazy = undefined;
          resolve();
        })();
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

    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    const textureHandle = cgApiResourceRepository.createTextureFromImageBitmapData(canvas, {
      level: 0,
      internalFormat: TextureFormat.RGBA8,
      width: 1,
      height: 1,
      border: 0,
      format: PixelFormat.RGBA,
      type: ComponentType.UnsignedByte,
      generateMipmap: false,
    });

    this.__setTextureResourceUid(textureHandle, this.uniqueName);
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = (
        cgApiResourceRepository as WebGpuResourceRepository
      ).createTextureView2d(this._textureResourceUid);
    }
    this.__isTextureReady = true;
  }

  async generateSheenLutTextureFromDataUri() {
    const moduleName = 'pbr';
    const moduleManager = ModuleManager.getInstance();
    const pbrModule = moduleManager.getModule(moduleName)! as any;
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    const textureHandle = await cgApiResourceRepository!.createTextureFromDataUri(
      pbrModule.sheen_E_and_DGTerm,
      {
        level: 0,
        internalFormat: TextureFormat.RGBA8,
        border: 0,
        format: PixelFormat.RGBA,
        type: ComponentType.UnsignedByte,
        generateMipmap: false,
      }
    );
    this.__setTextureResourceUid(textureHandle, this.uniqueName);
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = (
        cgApiResourceRepository as WebGpuResourceRepository
      ).createTextureView2d(this._textureResourceUid);
    }
    this.__isTextureReady = true;
  }

  allocate(desc: {
    mipLevelCount?: Count;
    width: number;
    height: number;
    format: TextureFormatEnum;
  }) {
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();

    desc.mipLevelCount =
      desc.mipLevelCount ?? Math.floor(Math.log2(Math.max(desc.width, desc.height))) + 1;

    const texture = cgApiResourceRepository.allocateTexture({
      mipLevelCount: desc.mipLevelCount,
      width: desc.width,
      height: desc.height,
      format: desc.format,
    });

    this.__setTextureResourceUid(texture, this.uniqueName);
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = (
        cgApiResourceRepository as WebGpuResourceRepository
      ).createTextureView2d(this._textureResourceUid);
    }
    this.__width = desc.width;
    this.__height = desc.height;
    this.__mipLevelCount = desc.mipLevelCount;
    this.__internalFormat = desc.format;
  }

  async loadImageToMipLevel(desc: LoadImageToMipLevelDescriptor) {
    const webGLResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();

    await webGLResourceRepository.loadImageToMipLevelOfTexture2D({
      mipLevel: desc.mipLevel,
      textureUid: this._textureResourceUid,
      format: this.__internalFormat,
      type: desc.type,
      xOffset: desc.xOffset,
      yOffset: desc.yOffset,
      width: desc.width,
      height: desc.height,
      rowSizeByPixel: desc.rowSizeByPixel,
      data: desc.data,
    });

    if (desc.mipLevel === 0) {
      this.__isTextureReady = true;
    }
  }

  generateCompressedTextureFromTypedArray(
    typedArray: TypedArray,
    width: number,
    height: number,
    compressionTextureType: CompressionTextureTypeEnum
  ) {
    this.__width = width;
    this.__height = height;

    const textureData = {
      level: 0,
      width,
      height,
      buffer: typedArray,
    } as TextureData;

    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    const texture = cgApiResourceRepository.createCompressedTexture(
      [textureData],
      compressionTextureType
    );

    this.__setTextureResourceUid(texture, this.uniqueName);
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = (
        cgApiResourceRepository as WebGpuResourceRepository
      ).createTextureView2d(this._textureResourceUid);
    }
    this.__isTextureReady = true;
  }

  generateCompressedTextureWithMipmapFromTypedArray(
    textureDataArray: TextureData[],
    compressionTextureType: CompressionTextureTypeEnum
  ) {
    const originalTextureData = textureDataArray.find((textureData) => textureData.level === 0);
    if (originalTextureData == null) {
      throw new Error('texture data with level 0 is not found');
    }

    this.__width = originalTextureData.width;
    this.__height = originalTextureData.height;

    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    const texture = cgApiResourceRepository.createCompressedTexture(
      textureDataArray,
      compressionTextureType
    );

    this.__setTextureResourceUid(texture, this.uniqueName);
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = (
        cgApiResourceRepository as WebGpuResourceRepository
      ).createTextureView2d(this._textureResourceUid);
    }
    this.__isTextureReady = true;
  }

  /**
   * Generate mipmaps for the texture.
   */
  generateMipmaps() {
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    cgApiResourceRepository.generateMipmaps2d(
      this._textureResourceUid,
      this.__width,
      this.__height
    );
  }

  importWebGLTextureDirectly(webGLTexture: WebGLTexture, width = 0, height = 0) {
    this.__width = width;
    this.__height = height;
    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const texture = webGLResourceRepository.setWebGLTextureDirectly(webGLTexture);
    this.__setTextureResourceUid(texture, this.uniqueName);
    this.__startedToLoad = true;
    this.__isTextureReady = true;
  }

  destroy3DAPIResources() {
    Texture.__deleteInternalTexture(this._textureResourceUid);
    this._textureResourceUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.__isTextureReady = false;
    this.__startedToLoad = false;

    return true;
  }

  private static __deleteInternalTexture(textureResourceUid: CGAPIResourceHandle) {
    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    webGLResourceRepository.deleteTexture(textureResourceUid);
  }

  [Symbol.dispose]() {
    console.log('[Symbol.dispose] is called');
    this.destroy();
  }

  destroy() {
    this.destroy3DAPIResources();
    this.unregister();
    Texture.managedRegistry.unregister(this);
  }
}
