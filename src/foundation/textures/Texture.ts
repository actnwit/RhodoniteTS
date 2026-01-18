import type { ComponentTypeEnum } from '../../foundation/definitions/ComponentType';
import type { BASIS_TYPE, BasisFile, BasisTranscoder } from '../../types/BasisTexture';
import type { CGAPIResourceHandle, Count, Index, Offset, Size, TypedArray } from '../../types/CommonTypes';
import { KTX2TextureLoader } from '../../webgl/textureLoader/KTX2TextureLoader';
import { type TextureData, WebGLResourceRepository } from '../../webgl/WebGLResourceRepository';
import type { WebGpuResourceRepository } from '../../webgpu/WebGpuResourceRepository';
import { ComponentType } from '../definitions/ComponentType';
import type { CompressionTextureTypeEnum } from '../definitions/CompressionTextureType';
import { PixelFormat, type PixelFormatEnum } from '../definitions/PixelFormat';
import { ProcessApproach } from '../definitions/ProcessApproach';
import { TextureFormat, type TextureFormatEnum } from '../definitions/TextureFormat';
import { TextureParameter, type TextureParameterEnum } from '../definitions/TextureParameter';
import { DataUtil } from '../misc/DataUtil';
import { Logger } from '../misc/Logger';
import { CGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import type { Engine } from '../system/Engine';
import { ModuleManager } from '../system/ModuleManager';
import { AbstractTexture } from './AbstractTexture';

declare const BASIS: BASIS_TYPE;

/**
 * Descriptor for loading image data to a specific mip level of a texture.
 */
export interface LoadImageToMipLevelDescriptor {
  /** Mip level to load the image data to */
  mipLevel: Index;
  /** X offset in the texture to copy data */
  xOffset: Offset;
  /** Y offset in the texture to copy data */
  yOffset: Offset;
  /** Width in the texture to copy */
  width: Size;
  /** Height in the texture to copy */
  height: Size;
  /** Image data in TypedArray format */
  data: TypedArray;
  /** Row size by pixel of the image data */
  rowSizeByPixel: Size;
  /** Component type of the image data */
  type: ComponentTypeEnum;
}

type FinalizationRegistryObject = {
  textureResourceUid: CGAPIResourceHandle;
  engine: Engine;
  uniqueName: string;
};

/**
 * A 2D texture class that extends AbstractTexture and provides functionality for
 * creating, loading, and managing textures from various sources including images,
 * compressed formats (Basis, KTX2), and raw data.
 *
 * This class supports:
 * - Loading textures from URLs, HTML image elements, and data URIs
 * - Compressed texture formats (Basis Universal, KTX2)
 * - Mipmap generation and management
 * - Automatic memory management with finalization registry
 * - Both WebGL and WebGPU backends
 *
 * @example
 * ```typescript
 * // Load texture from URL
 * const texture = await Texture.loadFromUrl('path/to/image.jpg');
 *
 * // Create texture from image element
 * const texture2 = new Texture();
 * await texture2.generateTextureFromImage(imageElement);
 *
 * // Generate 1x1 solid color texture
 * const whiteTexture = new Texture();
 * await whiteTexture.generate1x1TextureFrom('rgba(255,255,255,1)');
 * ```
 */
export class Texture extends AbstractTexture implements Disposable {
  /** Whether to automatically detect transparency in loaded images */
  public autoDetectTransparency = false;

  private static __loadedBasisFunc = false;
  private static __basisLoadPromise?: Promise<void>;
  private static __BasisFile?: new (
    x: Uint8Array
  ) => BasisFile;
  private __optionsToLoadLazy?: {
    level: number;
    internalFormat: TextureParameterEnum;
    format: PixelFormatEnum;
    type: ComponentTypeEnum;
    generateMipmap: boolean;
  };

  private static managedRegistry: FinalizationRegistry<FinalizationRegistryObject> =
    new FinalizationRegistry<FinalizationRegistryObject>(texObj => {
      Logger.default.info(
        `WebGL/WebGPU 2D texture "${texObj.uniqueName}" was automatically released along with GC. But explicit release is recommended.`
      );
      Texture.__deleteInternalTexture(texObj.engine, texObj.textureResourceUid);
    });

  /**
   * Sets the texture resource UID and registers it for automatic cleanup.
   * @param textureResourceUid - The texture resource handle from the graphics API
   * @param uniqueName - Unique name for debugging and logging purposes
   */
  private __setTextureResourceUid(textureResourceUid: CGAPIResourceHandle, uniqueName: string) {
    this._textureResourceUid = textureResourceUid;
    Texture.managedRegistry.register(this, { textureResourceUid, engine: this.__engine, uniqueName }, this);
  }

  /**
   * Generates a texture from Basis Universal compressed data.
   * Basis Universal is a supercompressed GPU texture codec that supports multiple formats.
   *
   * @param uint8Array - The Basis Universal compressed data
   * @param options - Configuration options for texture generation
   * @param options.level - Mip level (default: 0)
   * @param options.internalFormat - Internal texture format (default: RGBA8)
   * @param options.format - Pixel format (default: RGBA)
   * @param options.type - Component type (default: UnsignedByte)
   * @param options.generateMipmap - Whether to generate mipmaps (default: true)
   * @returns Promise that resolves when texture is ready
   *
   * @example
   * ```typescript
   * const texture = new Texture();
   * const basisData = new Uint8Array(basisFileBuffer);
   * await texture.generateTextureFromBasis(basisData);
   * ```
   */
  async generateTextureFromBasis(
    uint8Array: Uint8Array,
    options: {
      level?: Count;
      internalFormat?: TextureParameterEnum;
      format?: PixelFormatEnum;
      type?: ComponentTypeEnum;
      generateMipmap?: boolean;
    }
  ): Promise<void> {
    this.__startedToLoad = true;
    if (typeof BASIS === 'undefined') {
      Logger.default.error('Failed to call BASIS() function. Please check to import basis_transcoder.js.');
    }

    // download basis_transcoder.wasm once
    if (!Texture.__loadedBasisFunc) {
      Texture.__loadedBasisFunc = true;

      Texture.__basisLoadPromise = new Promise(resolve => {
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
    await Texture.__basisLoadPromise;
  }

  /**
   * Internal method to set up a Basis texture with the transcoder.
   * @param uint8Array - The Basis Universal compressed data
   * @param options - Texture generation options with defaults
   */
  private __setBasisTexture(
    uint8Array: Uint8Array,
    {
      _level = 0,
      _internalFormat = TextureFormat.RGBA8,
      format = PixelFormat.RGBA,
      type = ComponentType.UnsignedByte as ComponentTypeEnum,
      _generateMipmap = true,
    } = {}
  ): void {
    this.__startedToLoad = true;

    const basisFile = new Texture.__BasisFile!(uint8Array);

    if (!basisFile.startTranscoding()) {
      Logger.default.error('failed to start transcoding.');
      basisFile.close();
      basisFile.delete();
      return;
    }

    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
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

  /**
   * Generates a texture from KTX2 compressed data.
   * KTX2 is a container format for GPU textures that supports various compression formats.
   *
   * @param uint8Array - The KTX2 compressed data
   * @returns Promise that resolves when texture is ready
   *
   * @example
   * ```typescript
   * const texture = new Texture();
   * const ktx2Data = new Uint8Array(ktx2FileBuffer);
   * await texture.generateTextureFromKTX2(ktx2Data);
   * ```
   */
  async generateTextureFromKTX2(uint8Array: Uint8Array) {
    this.__startedToLoad = true;

    const transcodedData = await KTX2TextureLoader.getInstance().transcode(this.__engine, uint8Array);
    this.__width = transcodedData.width;
    this.__height = transcodedData.height;
    await this.generateCompressedTextureWithMipmapFromTypedArray(
      transcodedData.mipmapData,
      transcodedData.compressionTextureType
    );
  }

  /**
   * Generates a texture from an HTML image element.
   *
   * @param image - The HTML image element to create texture from
   * @param options - Configuration options for texture generation
   * @param options.level - Mip level (default: 0)
   * @param options.internalFormat - Internal texture format (default: RGBA8)
   * @param options.format - Pixel format (default: RGBA)
   * @param options.type - Component type (default: UnsignedByte)
   * @param options.generateMipmap - Whether to generate mipmaps (default: true)
   * @returns Promise that resolves when texture is ready
   *
   * @example
   * ```typescript
   * const texture = new Texture();
   * const img = document.getElementById('myImage') as HTMLImageElement;
   * await texture.generateTextureFromImage(img, { generateMipmap: false });
   * ```
   */
  async generateTextureFromImage(
    image: HTMLImageElement,
    {
      level = 0,
      internalFormat = TextureFormat.RGBA8,
      format = PixelFormat.RGBA,
      type = ComponentType.UnsignedByte,
      generateMipmap = true,
    } = {}
  ) {
    this.__startedToLoad = true;
    this.__htmlImageElement = image;
    let img: HTMLImageElement | HTMLCanvasElement | ImageData = image;

    if (this.autoDetectTransparency) {
      this.__hasTransparentPixels = DataUtil.detectTransparentPixelExistence(img);
    }

    this.__width = img.width;
    this.__height = img.height;

    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
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
    } else {
      throw new Error('Unsupported image type.');
    }

    this.__setTextureResourceUid(texture, this.uniqueName);
    if (this.__engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = (cgApiResourceRepository as WebGpuResourceRepository).createTextureView2d(
        this._textureResourceUid
      );
    }
    this.__isTextureReady = true;
    this.__uri = image.src;
  }

  /**
   * Generates a texture by loading an image from a URL.
   * Supports both regular URLs and data URIs. For external URLs, CORS is handled automatically.
   *
   * @param imageUri - The URL or data URI of the image to load
   * @param options - Configuration options for texture generation
   * @param options.level - Mip level (default: 0)
   * @param options.internalFormat - Internal texture format (default: RGBA8)
   * @param options.format - Pixel format (default: RGBA)
   * @param options.type - Component type (default: UnsignedByte)
   * @param options.generateMipmap - Whether to generate mipmaps (default: true)
   * @returns Promise that resolves when texture is loaded and ready
   *
   * @example
   * ```typescript
   * const texture = new Texture();
   * await texture.generateTextureFromUrl('https://example.com/image.jpg');
   * ```
   */
  async generateTextureFromUrl(
    imageUri: string,
    {
      level = 0,
      internalFormat = TextureFormat.RGBA8,
      format = PixelFormat.RGBA,
      type = ComponentType.UnsignedByte,
      generateMipmap = true,
    } = {}
  ) {
    this.__uri = imageUri;
    this.__startedToLoad = true;
    return new Promise((resolve, _reject) => {
      this.__img = new Image();
      if (!imageUri.match(/^data:/)) {
        this.__img.crossOrigin = 'Anonymous';
      }
      this.__img.onload = () => {
        this.__htmlImageElement = this.__img;

        let img: HTMLImageElement | HTMLCanvasElement = this.__img!;

        if (this.autoDetectTransparency) {
          this.__hasTransparentPixels = DataUtil.detectTransparentPixelExistence(img);
        }

        this.__width = img.width;
        this.__height = img.height;

        const cgApiResourceRepository = this.__engine.cgApiResourceRepository;

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
          } else {
            throw new Error('Unsupported image type');
          }
          this.__setTextureResourceUid(texture, this.uniqueName);
          if (this.__engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
            this._textureViewResourceUid = (
              cgApiResourceRepository as unknown as WebGpuResourceRepository
            ).createTextureView2d(this._textureResourceUid);
          }
          this.__isTextureReady = true;
          resolve();
        })();
      };

      this.__img.src = imageUri;
    }) as Promise<void>;
  }

  /**
   * Generates a 1x1 pixel texture with a solid color.
   * Useful for creating placeholder textures or solid color materials.
   *
   * @param rgbaStr - CSS color string in rgba format (default: 'rgba(255,255,255,1)')
   * @returns Promise that resolves when texture is ready
   *
   * @example
   * ```typescript
   * const texture = new Texture();
   * await texture.generate1x1TextureFrom('rgba(255,0,0,1)'); // Red texture
   * ```
   */
  async generate1x1TextureFrom(rgbaStr = 'rgba(255,255,255,1)') {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    this.__width = 1;
    this.__height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx == null) {
      Logger.default.error('Failed to get canvas context.');
      return;
    }
    ctx.fillStyle = rgbaStr;
    ctx.fillRect(0, 0, 1, 1);

    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    const textureHandle = await cgApiResourceRepository.createTextureFromImageBitmapData(canvas, {
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
    if (this.__engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = (
        cgApiResourceRepository as unknown as WebGpuResourceRepository
      ).createTextureView2d(this._textureResourceUid);
    }
    this.__isTextureReady = true;
  }

  /**
   * Generates a sheen lookup table texture from embedded data URI.
   * This is used for physically-based rendering (PBR) sheen calculations.
   * Requires the PBR module to be loaded.
   *
   * @returns Promise that resolves when texture is ready
   * @throws Error if PBR module is not available
   */
  async generateSheenLutTextureFromDataUri() {
    const moduleName = 'pbr';
    const moduleManager = ModuleManager.getInstance();
    const pbrModule = moduleManager.getModule(moduleName)! as any;
    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    if (cgApiResourceRepository == null) {
      Logger.default.error('Failed to get CGAPIResourceRepository.');
      return;
    }
    const textureHandle = await cgApiResourceRepository.createTextureFromDataUri(pbrModule.sheen_E_and_DGTerm, {
      level: 0,
      internalFormat: TextureFormat.RGBA8,
      border: 0,
      format: PixelFormat.RGBA,
      type: ComponentType.UnsignedByte,
      generateMipmap: false,
    });
    this.__setTextureResourceUid(textureHandle, this.uniqueName);
    if (this.__engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = (cgApiResourceRepository as WebGpuResourceRepository).createTextureView2d(
        this._textureResourceUid
      );
    }
    this.__isTextureReady = true;
  }

  /**
   * Allocates an empty texture with specified dimensions and format.
   * The texture can be filled with data later using loadImageToMipLevel.
   *
   * @param desc - Texture allocation descriptor
   * @param desc.mipLevelCount - Number of mip levels (auto-calculated if not provided)
   * @param desc.width - Texture width in pixels
   * @param desc.height - Texture height in pixels
   * @param desc.format - Texture format
   *
   * @example
   * ```typescript
   * const texture = new Texture();
   * texture.allocate({
   *   width: 512,
   *   height: 512,
   *   format: TextureFormat.RGBA8
   * });
   * ```
   */
  allocate(desc: { mipLevelCount?: Count; width: number; height: number; format: TextureFormatEnum }) {
    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;

    desc.mipLevelCount = desc.mipLevelCount ?? Math.floor(Math.log2(Math.max(desc.width, desc.height))) + 1;

    const texture = cgApiResourceRepository.allocateTexture({
      mipLevelCount: desc.mipLevelCount,
      width: desc.width,
      height: desc.height,
      format: desc.format,
    });

    this.__setTextureResourceUid(texture, this.uniqueName);
    if (this.__engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = (cgApiResourceRepository as WebGpuResourceRepository).createTextureView2d(
        this._textureResourceUid
      );
    }
    this.__width = desc.width;
    this.__height = desc.height;
    this.__mipLevelCount = desc.mipLevelCount;
    this.__internalFormat = desc.format;
  }

  /**
   * Loads image data to a specific mip level of an allocated texture.
   * The texture must be allocated first using the allocate method.
   *
   * @param desc - Descriptor containing image data and target location
   * @returns Promise that resolves when data is loaded
   *
   * @example
   * ```typescript
   * await texture.loadImageToMipLevel({
   *   mipLevel: 0,
   *   xOffset: 0,
   *   yOffset: 0,
   *   width: 256,
   *   height: 256,
   *   data: imageData,
   *   rowSizeByPixel: 256,
   *   type: ComponentType.UnsignedByte
   * });
   * ```
   */
  async loadImageToMipLevel(desc: LoadImageToMipLevelDescriptor) {
    const webGLResourceRepository = this.__engine.cgApiResourceRepository;

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

  /**
   * Generates a compressed texture from raw typed array data.
   *
   * @param typedArray - The compressed texture data
   * @param width - Texture width in pixels
   * @param height - Texture height in pixels
   * @param compressionTextureType - Type of compression used
   * @returns Promise that resolves when texture is ready
   *
   * @example
   * ```typescript
   * const texture = new Texture();
   * await texture.generateCompressedTextureFromTypedArray(
   *   compressedData,
   *   512,
   *   512,
   *   CompressionTextureType.S3TC_DXT1
   * );
   * ```
   */
  async generateCompressedTextureFromTypedArray(
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

    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    const textureHandle = await cgApiResourceRepository.createCompressedTexture([textureData], compressionTextureType);

    this.__setTextureResourceUid(textureHandle, this.uniqueName);
    if (this.__engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = (cgApiResourceRepository as WebGpuResourceRepository).createTextureView2d(
        this._textureResourceUid
      );
    }
    this.__isTextureReady = true;
  }

  /**
   * Generates a compressed texture with mipmaps from an array of texture data.
   * Each TextureData object represents a different mip level.
   *
   * @param textureDataArray - Array of texture data for different mip levels
   * @param compressionTextureType - Type of compression used
   * @returns Promise that resolves when texture is ready
   * @throws Error if level 0 texture data is not found
   *
   * @example
   * ```typescript
   * const texture = new Texture();
   * const mipmapData = [
   *   { level: 0, width: 512, height: 512, buffer: level0Data },
   *   { level: 1, width: 256, height: 256, buffer: level1Data },
   *   // ... more levels
   * ];
   * await texture.generateCompressedTextureWithMipmapFromTypedArray(
   *   mipmapData,
   *   CompressionTextureType.S3TC_DXT1
   * );
   * ```
   */
  async generateCompressedTextureWithMipmapFromTypedArray(
    textureDataArray: TextureData[],
    compressionTextureType: CompressionTextureTypeEnum
  ) {
    const originalTextureData = textureDataArray.find(textureData => textureData.level === 0);
    if (originalTextureData == null) {
      throw new Error('texture data with level 0 is not found');
    }

    this.__width = originalTextureData.width;
    this.__height = originalTextureData.height;

    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    const textureHandle = await cgApiResourceRepository.createCompressedTexture(
      textureDataArray,
      compressionTextureType
    );

    this.__setTextureResourceUid(textureHandle, this.uniqueName);
    if (this.__engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = (cgApiResourceRepository as WebGpuResourceRepository).createTextureView2d(
        this._textureResourceUid
      );
    }
    this.__isTextureReady = true;
  }

  /**
   * Generates mipmaps for the texture automatically.
   * The texture must already be loaded and ready before calling this method.
   *
   * @example
   * ```typescript
   * const texture = new Texture();
   * await texture.generateTextureFromUrl('image.jpg', { generateMipmap: false });
   * texture.generateMipmaps(); // Generate mipmaps manually
   * ```
   */
  generateMipmaps() {
    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    cgApiResourceRepository.generateMipmaps2d(this._textureResourceUid, this.__width, this.__height);
  }

  /**
   * Imports an existing WebGL texture directly without copying data.
   * This is useful for integrating with external WebGL code or libraries.
   *
   * @param webGLTexture - The WebGL texture object to import
   * @param width - Texture width in pixels (default: 0)
   * @param height - Texture height in pixels (default: 0)
   *
   * @example
   * ```typescript
   * const texture = new Texture();
   * const webglTexture = gl.createTexture();
   * // ... set up webglTexture
   * texture.importWebGLTextureDirectly(webglTexture, 512, 512);
   * ```
   */
  importWebGLTextureDirectly(webGLTexture: WebGLTexture, width = 0, height = 0) {
    this.__width = width;
    this.__height = height;
    const webGLResourceRepository = this.__engine.webglResourceRepository;
    const texture = webGLResourceRepository.setWebGLTextureDirectly(webGLTexture);
    this.__setTextureResourceUid(texture, this.uniqueName);
    this.__startedToLoad = true;
    this.__isTextureReady = true;
  }

  /**
   * Destroys the 3D API resources associated with this texture.
   * This releases GPU memory and invalidates the texture.
   *
   * @returns Always returns true
   */
  destroy3DAPIResources() {
    Texture.__deleteInternalTexture(this.__engine, this._textureResourceUid);
    this._textureResourceUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this._samplerResourceUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    if (this._recommendedTextureSampler) {
      this._recommendedTextureSampler.destroy();
    }
    this.__isTextureReady = false;
    this.__startedToLoad = false;

    return true;
  }

  /**
   * Internal method to delete a texture resource from the graphics API.
   * @param textureResourceUid - The texture resource handle to delete
   */
  private static __deleteInternalTexture(engine: Engine, textureResourceUid: CGAPIResourceHandle) {
    const cgApiResourceRepository = engine.cgApiResourceRepository;
    cgApiResourceRepository.deleteTexture(textureResourceUid);
  }

  /**
   * Symbol.dispose implementation for automatic resource cleanup.
   * Called automatically when using 'using' declarations in TypeScript 5.2+.
   */
  [Symbol.dispose]() {
    Logger.default.debug('[Symbol.dispose] is called');
    this.destroy();
  }

  /**
   * Destroys the texture and releases all associated resources.
   * This includes GPU memory, finalization registry entries, and other cleanup.
   * After calling this method, the texture should not be used.
   */
  destroy() {
    this.destroy3DAPIResources();
    this.unregister();
    Texture.managedRegistry.unregister(this);
  }

  /**
   * Static factory method to create and load a texture from a URL.
   * This is a convenience method that combines texture creation and loading.
   *
   * @param uri - The URL or data URI of the image to load
   * @param options - Configuration options for texture generation
   * @param options.level - Mip level (default: 0)
   * @param options.internalFormat - Internal texture format (default: RGBA8)
   * @param options.format - Pixel format (default: RGBA)
   * @param options.type - Component type (default: UnsignedByte)
   * @param options.generateMipmap - Whether to generate mipmaps (default: true)
   * @returns Promise that resolves to the loaded texture
   *
   * @example
   * ```typescript
   * const texture = await Texture.loadFromUrl('https://example.com/image.jpg', {
   *   generateMipmap: false,
   *   format: PixelFormat.RGB
   * });
   * ```
   */
  static async loadFromUrl(
    engine: Engine,
    uri: string,
    {
      level = 0,
      internalFormat = TextureFormat.RGBA8,
      format = PixelFormat.RGBA,
      type = ComponentType.UnsignedByte,
      generateMipmap = true,
    } = {}
  ) {
    const texture = new Texture(engine);
    await texture.generateTextureFromUrl(uri, {
      level,
      internalFormat,
      format,
      type,
      generateMipmap,
    });
    return texture;
  }
}
