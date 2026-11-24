// src/foundation/textures/Texture.ts
import { ComponentType } from "../definitions/ComponentType.js";
import { PixelFormat } from "../definitions/PixelFormat.js";
import { ProcessApproach } from "../definitions/ProcessApproach.js";
import { TextureFormat } from "../definitions/TextureFormat.js";
import { DataUtil } from "../misc/DataUtil.js";
import { Logger } from "../misc/Logger.js";
import { CGAPIResourceRepository } from "../renderer/CGAPIResourceRepository.js";
import { ModuleManager } from "../system/ModuleManager.js";
import { AbstractTexture } from "./AbstractTexture.js";
var _Texture = class _Texture extends AbstractTexture {
  constructor() {
    super(...arguments);
    /** Whether to automatically detect transparency in loaded images */
    this.autoDetectTransparency = false;
  }
  /**
   * Sets the texture resource UID and registers it for automatic cleanup.
   * @param textureResourceUid - The texture resource handle from the graphics API
   * @param uniqueName - Unique name for debugging and logging purposes
   */
  __setTextureResourceUid(textureResourceUid, uniqueName) {
    this._textureResourceUid = textureResourceUid;
    _Texture.managedRegistry.register(this, { textureResourceUid, engine: this.__engine, uniqueName }, this);
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
  async generateTextureFromBasis(uint8Array, options) {
    var _a;
    this.__startedToLoad = true;
    if (typeof BASIS === "undefined") {
      Logger.default.error("Failed to call BASIS() function. Please check to import basis_transcoder.js.");
    }
    if (!_Texture.__loadedBasisFunc) {
      _Texture.__loadedBasisFunc = true;
      _Texture.__basisLoadPromise = new Promise((resolve) => {
        BASIS().then((basisTransCoder) => {
          const { initializeBasis } = basisTransCoder;
          initializeBasis();
          _Texture.__BasisFile = basisTransCoder.BasisFile;
          this.__setBasisTexture(uint8Array, options);
          resolve();
        });
      });
    } else {
      if (_Texture.__BasisFile) {
        this.__setBasisTexture(uint8Array, options);
      } else {
        (_a = _Texture.__basisLoadPromise) == null ? void 0 : _a.then(() => {
          this.__setBasisTexture(uint8Array, options);
        });
      }
    }
    await _Texture.__basisLoadPromise;
  }
  /**
   * Internal method to set up a Basis texture with the transcoder.
   * @param uint8Array - The Basis Universal compressed data
   * @param options - Texture generation options with defaults
   */
  __setBasisTexture(uint8Array, {
    _level = 0,
    _internalFormat = TextureFormat.RGBA8,
    format = PixelFormat.RGBA,
    type = ComponentType.UnsignedByte,
    _generateMipmap = true
  } = {}) {
    this.__startedToLoad = true;
    const basisFile = new _Texture.__BasisFile(uint8Array);
    if (!basisFile.startTranscoding()) {
      Logger.default.error("failed to start transcoding.");
      basisFile.close();
      basisFile.delete();
      return;
    }
    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    const texture = cgApiResourceRepository.createCompressedTextureFromBasis(basisFile, {
      border: 0,
      format,
      type
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
  async generateTextureFromKTX2(uint8Array) {
    this.__startedToLoad = true;
    const { KTX2TextureLoader } = await import("../../webgl/textureLoader/KTX2TextureLoader.js");
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
  async generateTextureFromImage(image, {
    level = 0,
    internalFormat = TextureFormat.RGBA8,
    format = PixelFormat.RGBA,
    type = ComponentType.UnsignedByte,
    generateMipmap = true
  } = {}) {
    this.__startedToLoad = true;
    this.__htmlImageElement = image;
    let img = image;
    if (this.autoDetectTransparency) {
      this.__hasTransparentPixels = DataUtil.detectTransparentPixelExistence(img);
    }
    this.__width = img.width;
    this.__height = img.height;
    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    let texture;
    if (img instanceof HTMLImageElement) {
      texture = await cgApiResourceRepository.createTextureFromHTMLImageElement(img, {
        level,
        internalFormat,
        width: this.__width,
        height: this.__height,
        border: 0,
        format,
        type,
        generateMipmap
      });
    } else {
      throw new Error("Unsupported image type.");
    }
    this.__setTextureResourceUid(texture, this.uniqueName);
    if (this.__engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = cgApiResourceRepository.createTextureView2d(
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
  async generateTextureFromUrl(imageUri, {
    level = 0,
    internalFormat = TextureFormat.RGBA8,
    format = PixelFormat.RGBA,
    type = ComponentType.UnsignedByte,
    generateMipmap = true
  } = {}) {
    this.__uri = imageUri;
    this.__startedToLoad = true;
    return new Promise((resolve, _reject) => {
      this.__img = new Image();
      if (!imageUri.match(/^data:/)) {
        this.__img.crossOrigin = "Anonymous";
      }
      this.__img.onload = () => {
        this.__htmlImageElement = this.__img;
        let img = this.__img;
        if (this.autoDetectTransparency) {
          this.__hasTransparentPixels = DataUtil.detectTransparentPixelExistence(img);
        }
        this.__width = img.width;
        this.__height = img.height;
        const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
        let texture = CGAPIResourceRepository.InvalidCGAPIResourceUid;
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
              generateMipmap
            });
          } else {
            throw new Error("Unsupported image type");
          }
          this.__setTextureResourceUid(texture, this.uniqueName);
          if (this.__engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
            this._textureViewResourceUid = cgApiResourceRepository.createTextureView2d(this._textureResourceUid);
          }
          this.__isTextureReady = true;
          resolve();
        })();
      };
      this.__img.src = imageUri;
    });
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
  async generate1x1TextureFrom(rgbaStr = "rgba(255,255,255,1)") {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    this.__width = 1;
    this.__height = 1;
    const ctx = canvas.getContext("2d");
    if (ctx == null) {
      Logger.default.error("Failed to get canvas context.");
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
      generateMipmap: false
    });
    this.__setTextureResourceUid(textureHandle, this.uniqueName);
    if (this.__engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = cgApiResourceRepository.createTextureView2d(this._textureResourceUid);
    }
    this.__isTextureReady = true;
  }
  /**
   * Generates a sheen lookup table texture from embedded data URI.
   * This is used for physically-based rendering (PBR) sheen calculations.
   * The PBR module (which contains the image data) is loaded on demand and only once.
   *
   * @returns Promise that resolves when texture is ready
   */
  async generateSheenLutTextureFromDataUri() {
    if (this.__isTextureReady) {
      return;
    }
    if (this.__sheenLutLoadPromise == null) {
      this.__sheenLutLoadPromise = this.__generateSheenLutTextureFromDataUri();
    }
    await this.__sheenLutLoadPromise;
  }
  async __generateSheenLutTextureFromDataUri() {
    const moduleName = "pbr";
    const moduleManager = ModuleManager.getInstance();
    const pbrModule = await moduleManager.loadModule(moduleName);
    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    if (cgApiResourceRepository == null) {
      Logger.default.error("Failed to get CGAPIResourceRepository.");
      return;
    }
    const textureHandle = await cgApiResourceRepository.createTextureFromDataUri(pbrModule.sheen_E_and_DGTerm, {
      level: 0,
      internalFormat: TextureFormat.RGBA8,
      border: 0,
      format: PixelFormat.RGBA,
      type: ComponentType.UnsignedByte,
      generateMipmap: false
    });
    this.__setTextureResourceUid(textureHandle, this.uniqueName);
    if (this.__engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = cgApiResourceRepository.createTextureView2d(
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
  allocate(desc) {
    var _a;
    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    desc.mipLevelCount = (_a = desc.mipLevelCount) != null ? _a : Math.floor(Math.log2(Math.max(desc.width, desc.height))) + 1;
    const texture = cgApiResourceRepository.allocateTexture({
      mipLevelCount: desc.mipLevelCount,
      width: desc.width,
      height: desc.height,
      format: desc.format
    });
    this.__setTextureResourceUid(texture, this.uniqueName);
    if (this.__engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = cgApiResourceRepository.createTextureView2d(
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
  async loadImageToMipLevel(desc) {
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
      data: desc.data
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
  async generateCompressedTextureFromTypedArray(typedArray, width, height, compressionTextureType) {
    this.__width = width;
    this.__height = height;
    const textureData = {
      level: 0,
      width,
      height,
      buffer: typedArray
    };
    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    const textureHandle = await cgApiResourceRepository.createCompressedTexture([textureData], compressionTextureType);
    this.__setTextureResourceUid(textureHandle, this.uniqueName);
    if (this.__engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = cgApiResourceRepository.createTextureView2d(
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
  async generateCompressedTextureWithMipmapFromTypedArray(textureDataArray, compressionTextureType) {
    const originalTextureData = textureDataArray.find((textureData) => textureData.level === 0);
    if (originalTextureData == null) {
      throw new Error("texture data with level 0 is not found");
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
      this._textureViewResourceUid = cgApiResourceRepository.createTextureView2d(
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
  importWebGLTextureDirectly(webGLTexture, width = 0, height = 0) {
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
    _Texture.__deleteInternalTexture(this.__engine, this._textureResourceUid);
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
  static __deleteInternalTexture(engine, textureResourceUid) {
    const cgApiResourceRepository = engine.cgApiResourceRepository;
    cgApiResourceRepository.deleteTexture(textureResourceUid);
  }
  /**
   * Symbol.dispose implementation for automatic resource cleanup.
   * Called automatically when using 'using' declarations in TypeScript 5.2+.
   */
  [Symbol.dispose]() {
    Logger.default.debug("[Symbol.dispose] is called");
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
    _Texture.managedRegistry.unregister(this);
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
  static async loadFromUrl(engine, uri, {
    level = 0,
    internalFormat = TextureFormat.RGBA8,
    format = PixelFormat.RGBA,
    type = ComponentType.UnsignedByte,
    generateMipmap = true
  } = {}) {
    const texture = new _Texture(engine);
    await texture.generateTextureFromUrl(uri, {
      level,
      internalFormat,
      format,
      type,
      generateMipmap
    });
    return texture;
  }
};
_Texture.__loadedBasisFunc = false;
_Texture.managedRegistry = new FinalizationRegistry((texObj) => {
  Logger.default.info(
    `WebGL/WebGPU 2D texture "${texObj.uniqueName}" was automatically released along with GC. But explicit release is recommended.`
  );
  _Texture.__deleteInternalTexture(texObj.engine, texObj.textureResourceUid);
});
var Texture = _Texture;
export {
  Texture
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vdGV4dHVyZXMvVGV4dHVyZS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBDb21wb25lbnRUeXBlRW51bSB9IGZyb20gJy4uLy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvQ29tcG9uZW50VHlwZSc7XG5pbXBvcnQgdHlwZSB7IEJBU0lTX1RZUEUsIEJhc2lzRmlsZSwgQmFzaXNUcmFuc2NvZGVyIH0gZnJvbSAnLi4vLi4vdHlwZXMvQmFzaXNUZXh0dXJlJztcbmltcG9ydCB0eXBlIHsgQ0dBUElSZXNvdXJjZUhhbmRsZSwgQ291bnQsIEluZGV4LCBPZmZzZXQsIFNpemUsIFR5cGVkQXJyYXkgfSBmcm9tICcuLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgdHlwZSB7IFRleHR1cmVEYXRhIH0gZnJvbSAnLi4vLi4vd2ViZ2wvV2ViR0xSZXNvdXJjZVJlcG9zaXRvcnknO1xuaW1wb3J0IHR5cGUgeyBXZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi93ZWJncHUvV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5JztcbmltcG9ydCB7IENvbXBvbmVudFR5cGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9Db21wb25lbnRUeXBlJztcbmltcG9ydCB0eXBlIHsgQ29tcHJlc3Npb25UZXh0dXJlVHlwZUVudW0gfSBmcm9tICcuLi9kZWZpbml0aW9ucy9Db21wcmVzc2lvblRleHR1cmVUeXBlJztcbmltcG9ydCB7IFBpeGVsRm9ybWF0LCB0eXBlIFBpeGVsRm9ybWF0RW51bSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1BpeGVsRm9ybWF0JztcbmltcG9ydCB7IFByb2Nlc3NBcHByb2FjaCB9IGZyb20gJy4uL2RlZmluaXRpb25zL1Byb2Nlc3NBcHByb2FjaCc7XG5pbXBvcnQgeyBUZXh0dXJlRm9ybWF0LCB0eXBlIFRleHR1cmVGb3JtYXRFbnVtIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvVGV4dHVyZUZvcm1hdCc7XG5pbXBvcnQgdHlwZSB7IFRleHR1cmVQYXJhbWV0ZXJFbnVtIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvVGV4dHVyZVBhcmFtZXRlcic7XG5pbXBvcnQgeyBEYXRhVXRpbCB9IGZyb20gJy4uL21pc2MvRGF0YVV0aWwnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHsgQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkgfSBmcm9tICcuLi9yZW5kZXJlci9DR0FQSVJlc291cmNlUmVwb3NpdG9yeSc7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uL3N5c3RlbS9FbmdpbmUnO1xuaW1wb3J0IHsgTW9kdWxlTWFuYWdlciB9IGZyb20gJy4uL3N5c3RlbS9Nb2R1bGVNYW5hZ2VyJztcbmltcG9ydCB7IEFic3RyYWN0VGV4dHVyZSB9IGZyb20gJy4vQWJzdHJhY3RUZXh0dXJlJztcblxuZGVjbGFyZSBjb25zdCBCQVNJUzogQkFTSVNfVFlQRTtcblxuLyoqXG4gKiBEZXNjcmlwdG9yIGZvciBsb2FkaW5nIGltYWdlIGRhdGEgdG8gYSBzcGVjaWZpYyBtaXAgbGV2ZWwgb2YgYSB0ZXh0dXJlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIExvYWRJbWFnZVRvTWlwTGV2ZWxEZXNjcmlwdG9yIHtcbiAgLyoqIE1pcCBsZXZlbCB0byBsb2FkIHRoZSBpbWFnZSBkYXRhIHRvICovXG4gIG1pcExldmVsOiBJbmRleDtcbiAgLyoqIFggb2Zmc2V0IGluIHRoZSB0ZXh0dXJlIHRvIGNvcHkgZGF0YSAqL1xuICB4T2Zmc2V0OiBPZmZzZXQ7XG4gIC8qKiBZIG9mZnNldCBpbiB0aGUgdGV4dHVyZSB0byBjb3B5IGRhdGEgKi9cbiAgeU9mZnNldDogT2Zmc2V0O1xuICAvKiogV2lkdGggaW4gdGhlIHRleHR1cmUgdG8gY29weSAqL1xuICB3aWR0aDogU2l6ZTtcbiAgLyoqIEhlaWdodCBpbiB0aGUgdGV4dHVyZSB0byBjb3B5ICovXG4gIGhlaWdodDogU2l6ZTtcbiAgLyoqIEltYWdlIGRhdGEgaW4gVHlwZWRBcnJheSBmb3JtYXQgKi9cbiAgZGF0YTogVHlwZWRBcnJheTtcbiAgLyoqIFJvdyBzaXplIGJ5IHBpeGVsIG9mIHRoZSBpbWFnZSBkYXRhICovXG4gIHJvd1NpemVCeVBpeGVsOiBTaXplO1xuICAvKiogQ29tcG9uZW50IHR5cGUgb2YgdGhlIGltYWdlIGRhdGEgKi9cbiAgdHlwZTogQ29tcG9uZW50VHlwZUVudW07XG59XG5cbnR5cGUgRmluYWxpemF0aW9uUmVnaXN0cnlPYmplY3QgPSB7XG4gIHRleHR1cmVSZXNvdXJjZVVpZDogQ0dBUElSZXNvdXJjZUhhbmRsZTtcbiAgZW5naW5lOiBFbmdpbmU7XG4gIHVuaXF1ZU5hbWU6IHN0cmluZztcbn07XG5cbi8qKlxuICogQSAyRCB0ZXh0dXJlIGNsYXNzIHRoYXQgZXh0ZW5kcyBBYnN0cmFjdFRleHR1cmUgYW5kIHByb3ZpZGVzIGZ1bmN0aW9uYWxpdHkgZm9yXG4gKiBjcmVhdGluZywgbG9hZGluZywgYW5kIG1hbmFnaW5nIHRleHR1cmVzIGZyb20gdmFyaW91cyBzb3VyY2VzIGluY2x1ZGluZyBpbWFnZXMsXG4gKiBjb21wcmVzc2VkIGZvcm1hdHMgKEJhc2lzLCBLVFgyKSwgYW5kIHJhdyBkYXRhLlxuICpcbiAqIFRoaXMgY2xhc3Mgc3VwcG9ydHM6XG4gKiAtIExvYWRpbmcgdGV4dHVyZXMgZnJvbSBVUkxzLCBIVE1MIGltYWdlIGVsZW1lbnRzLCBhbmQgZGF0YSBVUklzXG4gKiAtIENvbXByZXNzZWQgdGV4dHVyZSBmb3JtYXRzIChCYXNpcyBVbml2ZXJzYWwsIEtUWDIpXG4gKiAtIE1pcG1hcCBnZW5lcmF0aW9uIGFuZCBtYW5hZ2VtZW50XG4gKiAtIEF1dG9tYXRpYyBtZW1vcnkgbWFuYWdlbWVudCB3aXRoIGZpbmFsaXphdGlvbiByZWdpc3RyeVxuICogLSBCb3RoIFdlYkdMIGFuZCBXZWJHUFUgYmFja2VuZHNcbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHlwZXNjcmlwdFxuICogLy8gTG9hZCB0ZXh0dXJlIGZyb20gVVJMXG4gKiBjb25zdCB0ZXh0dXJlID0gYXdhaXQgVGV4dHVyZS5sb2FkRnJvbVVybCgncGF0aC90by9pbWFnZS5qcGcnKTtcbiAqXG4gKiAvLyBDcmVhdGUgdGV4dHVyZSBmcm9tIGltYWdlIGVsZW1lbnRcbiAqIGNvbnN0IHRleHR1cmUyID0gbmV3IFRleHR1cmUoKTtcbiAqIGF3YWl0IHRleHR1cmUyLmdlbmVyYXRlVGV4dHVyZUZyb21JbWFnZShpbWFnZUVsZW1lbnQpO1xuICpcbiAqIC8vIEdlbmVyYXRlIDF4MSBzb2xpZCBjb2xvciB0ZXh0dXJlXG4gKiBjb25zdCB3aGl0ZVRleHR1cmUgPSBuZXcgVGV4dHVyZSgpO1xuICogYXdhaXQgd2hpdGVUZXh0dXJlLmdlbmVyYXRlMXgxVGV4dHVyZUZyb20oJ3JnYmEoMjU1LDI1NSwyNTUsMSknKTtcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgVGV4dHVyZSBleHRlbmRzIEFic3RyYWN0VGV4dHVyZSBpbXBsZW1lbnRzIERpc3Bvc2FibGUge1xuICAvKiogV2hldGhlciB0byBhdXRvbWF0aWNhbGx5IGRldGVjdCB0cmFuc3BhcmVuY3kgaW4gbG9hZGVkIGltYWdlcyAqL1xuICBwdWJsaWMgYXV0b0RldGVjdFRyYW5zcGFyZW5jeSA9IGZhbHNlO1xuXG4gIHByaXZhdGUgc3RhdGljIF9fbG9hZGVkQmFzaXNGdW5jID0gZmFsc2U7XG4gIHByaXZhdGUgc3RhdGljIF9fYmFzaXNMb2FkUHJvbWlzZT86IFByb21pc2U8dm9pZD47XG4gIHByaXZhdGUgc3RhdGljIF9fQmFzaXNGaWxlPzogbmV3IChcbiAgICB4OiBVaW50OEFycmF5XG4gICkgPT4gQmFzaXNGaWxlO1xuICBwcml2YXRlIF9fb3B0aW9uc1RvTG9hZExhenk/OiB7XG4gICAgbGV2ZWw6IG51bWJlcjtcbiAgICBpbnRlcm5hbEZvcm1hdDogVGV4dHVyZVBhcmFtZXRlckVudW07XG4gICAgZm9ybWF0OiBQaXhlbEZvcm1hdEVudW07XG4gICAgdHlwZTogQ29tcG9uZW50VHlwZUVudW07XG4gICAgZ2VuZXJhdGVNaXBtYXA6IGJvb2xlYW47XG4gIH07XG4gIC8qKiBLZWVwcyBjb25jdXJyZW50IHNoZWVuIExVVCByZXF1ZXN0cyBmcm9tIGxvYWRpbmcgdGhlIFBCUiBtb2R1bGUgYW5kIHRoZSBpbWFnZSBtb3JlIHRoYW4gb25jZS4gKi9cbiAgcHJpdmF0ZSBfX3NoZWVuTHV0TG9hZFByb21pc2U/OiBQcm9taXNlPHZvaWQ+O1xuXG4gIHByaXZhdGUgc3RhdGljIG1hbmFnZWRSZWdpc3RyeTogRmluYWxpemF0aW9uUmVnaXN0cnk8RmluYWxpemF0aW9uUmVnaXN0cnlPYmplY3Q+ID1cbiAgICBuZXcgRmluYWxpemF0aW9uUmVnaXN0cnk8RmluYWxpemF0aW9uUmVnaXN0cnlPYmplY3Q+KHRleE9iaiA9PiB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5pbmZvKFxuICAgICAgICBgV2ViR0wvV2ViR1BVIDJEIHRleHR1cmUgXCIke3RleE9iai51bmlxdWVOYW1lfVwiIHdhcyBhdXRvbWF0aWNhbGx5IHJlbGVhc2VkIGFsb25nIHdpdGggR0MuIEJ1dCBleHBsaWNpdCByZWxlYXNlIGlzIHJlY29tbWVuZGVkLmBcbiAgICAgICk7XG4gICAgICBUZXh0dXJlLl9fZGVsZXRlSW50ZXJuYWxUZXh0dXJlKHRleE9iai5lbmdpbmUsIHRleE9iai50ZXh0dXJlUmVzb3VyY2VVaWQpO1xuICAgIH0pO1xuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB0ZXh0dXJlIHJlc291cmNlIFVJRCBhbmQgcmVnaXN0ZXJzIGl0IGZvciBhdXRvbWF0aWMgY2xlYW51cC5cbiAgICogQHBhcmFtIHRleHR1cmVSZXNvdXJjZVVpZCAtIFRoZSB0ZXh0dXJlIHJlc291cmNlIGhhbmRsZSBmcm9tIHRoZSBncmFwaGljcyBBUElcbiAgICogQHBhcmFtIHVuaXF1ZU5hbWUgLSBVbmlxdWUgbmFtZSBmb3IgZGVidWdnaW5nIGFuZCBsb2dnaW5nIHB1cnBvc2VzXG4gICAqL1xuICBwcml2YXRlIF9fc2V0VGV4dHVyZVJlc291cmNlVWlkKHRleHR1cmVSZXNvdXJjZVVpZDogQ0dBUElSZXNvdXJjZUhhbmRsZSwgdW5pcXVlTmFtZTogc3RyaW5nKSB7XG4gICAgdGhpcy5fdGV4dHVyZVJlc291cmNlVWlkID0gdGV4dHVyZVJlc291cmNlVWlkO1xuICAgIFRleHR1cmUubWFuYWdlZFJlZ2lzdHJ5LnJlZ2lzdGVyKHRoaXMsIHsgdGV4dHVyZVJlc291cmNlVWlkLCBlbmdpbmU6IHRoaXMuX19lbmdpbmUsIHVuaXF1ZU5hbWUgfSwgdGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIGEgdGV4dHVyZSBmcm9tIEJhc2lzIFVuaXZlcnNhbCBjb21wcmVzc2VkIGRhdGEuXG4gICAqIEJhc2lzIFVuaXZlcnNhbCBpcyBhIHN1cGVyY29tcHJlc3NlZCBHUFUgdGV4dHVyZSBjb2RlYyB0aGF0IHN1cHBvcnRzIG11bHRpcGxlIGZvcm1hdHMuXG4gICAqXG4gICAqIEBwYXJhbSB1aW50OEFycmF5IC0gVGhlIEJhc2lzIFVuaXZlcnNhbCBjb21wcmVzc2VkIGRhdGFcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBDb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRleHR1cmUgZ2VuZXJhdGlvblxuICAgKiBAcGFyYW0gb3B0aW9ucy5sZXZlbCAtIE1pcCBsZXZlbCAoZGVmYXVsdDogMClcbiAgICogQHBhcmFtIG9wdGlvbnMuaW50ZXJuYWxGb3JtYXQgLSBJbnRlcm5hbCB0ZXh0dXJlIGZvcm1hdCAoZGVmYXVsdDogUkdCQTgpXG4gICAqIEBwYXJhbSBvcHRpb25zLmZvcm1hdCAtIFBpeGVsIGZvcm1hdCAoZGVmYXVsdDogUkdCQSlcbiAgICogQHBhcmFtIG9wdGlvbnMudHlwZSAtIENvbXBvbmVudCB0eXBlIChkZWZhdWx0OiBVbnNpZ25lZEJ5dGUpXG4gICAqIEBwYXJhbSBvcHRpb25zLmdlbmVyYXRlTWlwbWFwIC0gV2hldGhlciB0byBnZW5lcmF0ZSBtaXBtYXBzIChkZWZhdWx0OiB0cnVlKVxuICAgKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0ZXh0dXJlIGlzIHJlYWR5XG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgdGV4dHVyZSA9IG5ldyBUZXh0dXJlKCk7XG4gICAqIGNvbnN0IGJhc2lzRGF0YSA9IG5ldyBVaW50OEFycmF5KGJhc2lzRmlsZUJ1ZmZlcik7XG4gICAqIGF3YWl0IHRleHR1cmUuZ2VuZXJhdGVUZXh0dXJlRnJvbUJhc2lzKGJhc2lzRGF0YSk7XG4gICAqIGBgYFxuICAgKi9cbiAgYXN5bmMgZ2VuZXJhdGVUZXh0dXJlRnJvbUJhc2lzKFxuICAgIHVpbnQ4QXJyYXk6IFVpbnQ4QXJyYXksXG4gICAgb3B0aW9uczoge1xuICAgICAgbGV2ZWw/OiBDb3VudDtcbiAgICAgIGludGVybmFsRm9ybWF0PzogVGV4dHVyZVBhcmFtZXRlckVudW07XG4gICAgICBmb3JtYXQ/OiBQaXhlbEZvcm1hdEVudW07XG4gICAgICB0eXBlPzogQ29tcG9uZW50VHlwZUVudW07XG4gICAgICBnZW5lcmF0ZU1pcG1hcD86IGJvb2xlYW47XG4gICAgfVxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLl9fc3RhcnRlZFRvTG9hZCA9IHRydWU7XG4gICAgaWYgKHR5cGVvZiBCQVNJUyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCdGYWlsZWQgdG8gY2FsbCBCQVNJUygpIGZ1bmN0aW9uLiBQbGVhc2UgY2hlY2sgdG8gaW1wb3J0IGJhc2lzX3RyYW5zY29kZXIuanMuJyk7XG4gICAgfVxuXG4gICAgLy8gZG93bmxvYWQgYmFzaXNfdHJhbnNjb2Rlci53YXNtIG9uY2VcbiAgICBpZiAoIVRleHR1cmUuX19sb2FkZWRCYXNpc0Z1bmMpIHtcbiAgICAgIFRleHR1cmUuX19sb2FkZWRCYXNpc0Z1bmMgPSB0cnVlO1xuXG4gICAgICBUZXh0dXJlLl9fYmFzaXNMb2FkUHJvbWlzZSA9IG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICBCQVNJUygpLnRoZW4oKGJhc2lzVHJhbnNDb2RlcjogQmFzaXNUcmFuc2NvZGVyKSA9PiB7XG4gICAgICAgICAgY29uc3QgeyBpbml0aWFsaXplQmFzaXMgfSA9IGJhc2lzVHJhbnNDb2RlcjtcbiAgICAgICAgICBpbml0aWFsaXplQmFzaXMoKTtcbiAgICAgICAgICBUZXh0dXJlLl9fQmFzaXNGaWxlID0gYmFzaXNUcmFuc0NvZGVyLkJhc2lzRmlsZTtcblxuICAgICAgICAgIHRoaXMuX19zZXRCYXNpc1RleHR1cmUodWludDhBcnJheSwgb3B0aW9ucyk7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBhbHJlYWR5IGRvd25sb2FkIGJhc2lzX3RyYW5zY29kZXIud2FzbSBvciBub3RcbiAgICAgIGlmIChUZXh0dXJlLl9fQmFzaXNGaWxlKSB7XG4gICAgICAgIHRoaXMuX19zZXRCYXNpc1RleHR1cmUodWludDhBcnJheSwgb3B0aW9ucyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBUZXh0dXJlLl9fYmFzaXNMb2FkUHJvbWlzZT8udGhlbigoKSA9PiB7XG4gICAgICAgICAgdGhpcy5fX3NldEJhc2lzVGV4dHVyZSh1aW50OEFycmF5LCBvcHRpb25zKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIGF3YWl0IFRleHR1cmUuX19iYXNpc0xvYWRQcm9taXNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEludGVybmFsIG1ldGhvZCB0byBzZXQgdXAgYSBCYXNpcyB0ZXh0dXJlIHdpdGggdGhlIHRyYW5zY29kZXIuXG4gICAqIEBwYXJhbSB1aW50OEFycmF5IC0gVGhlIEJhc2lzIFVuaXZlcnNhbCBjb21wcmVzc2VkIGRhdGFcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBUZXh0dXJlIGdlbmVyYXRpb24gb3B0aW9ucyB3aXRoIGRlZmF1bHRzXG4gICAqL1xuICBwcml2YXRlIF9fc2V0QmFzaXNUZXh0dXJlKFxuICAgIHVpbnQ4QXJyYXk6IFVpbnQ4QXJyYXksXG4gICAge1xuICAgICAgX2xldmVsID0gMCxcbiAgICAgIF9pbnRlcm5hbEZvcm1hdCA9IFRleHR1cmVGb3JtYXQuUkdCQTgsXG4gICAgICBmb3JtYXQgPSBQaXhlbEZvcm1hdC5SR0JBLFxuICAgICAgdHlwZSA9IENvbXBvbmVudFR5cGUuVW5zaWduZWRCeXRlIGFzIENvbXBvbmVudFR5cGVFbnVtLFxuICAgICAgX2dlbmVyYXRlTWlwbWFwID0gdHJ1ZSxcbiAgICB9ID0ge31cbiAgKTogdm9pZCB7XG4gICAgdGhpcy5fX3N0YXJ0ZWRUb0xvYWQgPSB0cnVlO1xuXG4gICAgY29uc3QgYmFzaXNGaWxlID0gbmV3IFRleHR1cmUuX19CYXNpc0ZpbGUhKHVpbnQ4QXJyYXkpO1xuXG4gICAgaWYgKCFiYXNpc0ZpbGUuc3RhcnRUcmFuc2NvZGluZygpKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcignZmFpbGVkIHRvIHN0YXJ0IHRyYW5zY29kaW5nLicpO1xuICAgICAgYmFzaXNGaWxlLmNsb3NlKCk7XG4gICAgICBiYXNpc0ZpbGUuZGVsZXRlKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLmNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGNvbnN0IHRleHR1cmUgPSBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeS5jcmVhdGVDb21wcmVzc2VkVGV4dHVyZUZyb21CYXNpcyhiYXNpc0ZpbGUsIHtcbiAgICAgIGJvcmRlcjogMCxcbiAgICAgIGZvcm1hdCxcbiAgICAgIHR5cGUsXG4gICAgfSk7XG5cbiAgICB0aGlzLl9fc2V0VGV4dHVyZVJlc291cmNlVWlkKHRleHR1cmUsIHRoaXMudW5pcXVlTmFtZSk7XG5cbiAgICB0aGlzLl9faXNUZXh0dXJlUmVhZHkgPSB0cnVlO1xuXG4gICAgYmFzaXNGaWxlLmNsb3NlKCk7XG4gICAgYmFzaXNGaWxlLmRlbGV0ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBhIHRleHR1cmUgZnJvbSBLVFgyIGNvbXByZXNzZWQgZGF0YS5cbiAgICogS1RYMiBpcyBhIGNvbnRhaW5lciBmb3JtYXQgZm9yIEdQVSB0ZXh0dXJlcyB0aGF0IHN1cHBvcnRzIHZhcmlvdXMgY29tcHJlc3Npb24gZm9ybWF0cy5cbiAgICpcbiAgICogQHBhcmFtIHVpbnQ4QXJyYXkgLSBUaGUgS1RYMiBjb21wcmVzc2VkIGRhdGFcbiAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGV4dHVyZSBpcyByZWFkeVxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IHRleHR1cmUgPSBuZXcgVGV4dHVyZSgpO1xuICAgKiBjb25zdCBrdHgyRGF0YSA9IG5ldyBVaW50OEFycmF5KGt0eDJGaWxlQnVmZmVyKTtcbiAgICogYXdhaXQgdGV4dHVyZS5nZW5lcmF0ZVRleHR1cmVGcm9tS1RYMihrdHgyRGF0YSk7XG4gICAqIGBgYFxuICAgKi9cbiAgYXN5bmMgZ2VuZXJhdGVUZXh0dXJlRnJvbUtUWDIodWludDhBcnJheTogVWludDhBcnJheSkge1xuICAgIHRoaXMuX19zdGFydGVkVG9Mb2FkID0gdHJ1ZTtcblxuICAgIC8vIExvYWRlZCBvbiBkZW1hbmQ6IHRoZSBLVFgyIGxvYWRlciBidW5kbGVzIHRoZSBac3RhbmRhcmQgZGVjb2RlciBhbmQga3R4LXBhcnNlLCB3aGljaCBhcHBsaWNhdGlvbnNcbiAgICAvLyB0aGF0IGRvIG5vdCB1c2UgS1RYMiB0ZXh0dXJlcyBzaG91bGQgbm90IHBheSBmb3IuXG4gICAgY29uc3QgeyBLVFgyVGV4dHVyZUxvYWRlciB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi93ZWJnbC90ZXh0dXJlTG9hZGVyL0tUWDJUZXh0dXJlTG9hZGVyJyk7XG4gICAgY29uc3QgdHJhbnNjb2RlZERhdGEgPSBhd2FpdCBLVFgyVGV4dHVyZUxvYWRlci5nZXRJbnN0YW5jZSgpLnRyYW5zY29kZSh0aGlzLl9fZW5naW5lLCB1aW50OEFycmF5KTtcbiAgICB0aGlzLl9fd2lkdGggPSB0cmFuc2NvZGVkRGF0YS53aWR0aDtcbiAgICB0aGlzLl9faGVpZ2h0ID0gdHJhbnNjb2RlZERhdGEuaGVpZ2h0O1xuICAgIGF3YWl0IHRoaXMuZ2VuZXJhdGVDb21wcmVzc2VkVGV4dHVyZVdpdGhNaXBtYXBGcm9tVHlwZWRBcnJheShcbiAgICAgIHRyYW5zY29kZWREYXRhLm1pcG1hcERhdGEsXG4gICAgICB0cmFuc2NvZGVkRGF0YS5jb21wcmVzc2lvblRleHR1cmVUeXBlXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgYSB0ZXh0dXJlIGZyb20gYW4gSFRNTCBpbWFnZSBlbGVtZW50LlxuICAgKlxuICAgKiBAcGFyYW0gaW1hZ2UgLSBUaGUgSFRNTCBpbWFnZSBlbGVtZW50IHRvIGNyZWF0ZSB0ZXh0dXJlIGZyb21cbiAgICogQHBhcmFtIG9wdGlvbnMgLSBDb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRleHR1cmUgZ2VuZXJhdGlvblxuICAgKiBAcGFyYW0gb3B0aW9ucy5sZXZlbCAtIE1pcCBsZXZlbCAoZGVmYXVsdDogMClcbiAgICogQHBhcmFtIG9wdGlvbnMuaW50ZXJuYWxGb3JtYXQgLSBJbnRlcm5hbCB0ZXh0dXJlIGZvcm1hdCAoZGVmYXVsdDogUkdCQTgpXG4gICAqIEBwYXJhbSBvcHRpb25zLmZvcm1hdCAtIFBpeGVsIGZvcm1hdCAoZGVmYXVsdDogUkdCQSlcbiAgICogQHBhcmFtIG9wdGlvbnMudHlwZSAtIENvbXBvbmVudCB0eXBlIChkZWZhdWx0OiBVbnNpZ25lZEJ5dGUpXG4gICAqIEBwYXJhbSBvcHRpb25zLmdlbmVyYXRlTWlwbWFwIC0gV2hldGhlciB0byBnZW5lcmF0ZSBtaXBtYXBzIChkZWZhdWx0OiB0cnVlKVxuICAgKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0ZXh0dXJlIGlzIHJlYWR5XG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgdGV4dHVyZSA9IG5ldyBUZXh0dXJlKCk7XG4gICAqIGNvbnN0IGltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdteUltYWdlJykgYXMgSFRNTEltYWdlRWxlbWVudDtcbiAgICogYXdhaXQgdGV4dHVyZS5nZW5lcmF0ZVRleHR1cmVGcm9tSW1hZ2UoaW1nLCB7IGdlbmVyYXRlTWlwbWFwOiBmYWxzZSB9KTtcbiAgICogYGBgXG4gICAqL1xuICBhc3luYyBnZW5lcmF0ZVRleHR1cmVGcm9tSW1hZ2UoXG4gICAgaW1hZ2U6IEhUTUxJbWFnZUVsZW1lbnQsXG4gICAge1xuICAgICAgbGV2ZWwgPSAwLFxuICAgICAgaW50ZXJuYWxGb3JtYXQgPSBUZXh0dXJlRm9ybWF0LlJHQkE4LFxuICAgICAgZm9ybWF0ID0gUGl4ZWxGb3JtYXQuUkdCQSxcbiAgICAgIHR5cGUgPSBDb21wb25lbnRUeXBlLlVuc2lnbmVkQnl0ZSxcbiAgICAgIGdlbmVyYXRlTWlwbWFwID0gdHJ1ZSxcbiAgICB9ID0ge31cbiAgKSB7XG4gICAgdGhpcy5fX3N0YXJ0ZWRUb0xvYWQgPSB0cnVlO1xuICAgIHRoaXMuX19odG1sSW1hZ2VFbGVtZW50ID0gaW1hZ2U7XG4gICAgbGV0IGltZzogSFRNTEltYWdlRWxlbWVudCB8IEhUTUxDYW52YXNFbGVtZW50IHwgSW1hZ2VEYXRhID0gaW1hZ2U7XG5cbiAgICBpZiAodGhpcy5hdXRvRGV0ZWN0VHJhbnNwYXJlbmN5KSB7XG4gICAgICB0aGlzLl9faGFzVHJhbnNwYXJlbnRQaXhlbHMgPSBEYXRhVXRpbC5kZXRlY3RUcmFuc3BhcmVudFBpeGVsRXhpc3RlbmNlKGltZyk7XG4gICAgfVxuXG4gICAgdGhpcy5fX3dpZHRoID0gaW1nLndpZHRoO1xuICAgIHRoaXMuX19oZWlnaHQgPSBpbWcuaGVpZ2h0O1xuXG4gICAgY29uc3QgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLmNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGxldCB0ZXh0dXJlOiBDR0FQSVJlc291cmNlSGFuZGxlO1xuICAgIGlmIChpbWcgaW5zdGFuY2VvZiBIVE1MSW1hZ2VFbGVtZW50KSB7XG4gICAgICB0ZXh0dXJlID0gYXdhaXQgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkuY3JlYXRlVGV4dHVyZUZyb21IVE1MSW1hZ2VFbGVtZW50KGltZywge1xuICAgICAgICBsZXZlbCxcbiAgICAgICAgaW50ZXJuYWxGb3JtYXQsXG4gICAgICAgIHdpZHRoOiB0aGlzLl9fd2lkdGgsXG4gICAgICAgIGhlaWdodDogdGhpcy5fX2hlaWdodCxcbiAgICAgICAgYm9yZGVyOiAwLFxuICAgICAgICBmb3JtYXQsXG4gICAgICAgIHR5cGUsXG4gICAgICAgIGdlbmVyYXRlTWlwbWFwLFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5zdXBwb3J0ZWQgaW1hZ2UgdHlwZS4nKTtcbiAgICB9XG5cbiAgICB0aGlzLl9fc2V0VGV4dHVyZVJlc291cmNlVWlkKHRleHR1cmUsIHRoaXMudW5pcXVlTmFtZSk7XG4gICAgaWYgKHRoaXMuX19lbmdpbmUuZW5naW5lU3RhdGUuY3VycmVudFByb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgdGhpcy5fdGV4dHVyZVZpZXdSZXNvdXJjZVVpZCA9IChjZ0FwaVJlc291cmNlUmVwb3NpdG9yeSBhcyBXZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkpLmNyZWF0ZVRleHR1cmVWaWV3MmQoXG4gICAgICAgIHRoaXMuX3RleHR1cmVSZXNvdXJjZVVpZFxuICAgICAgKTtcbiAgICB9XG4gICAgdGhpcy5fX2lzVGV4dHVyZVJlYWR5ID0gdHJ1ZTtcbiAgICB0aGlzLl9fdXJpID0gaW1hZ2Uuc3JjO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBhIHRleHR1cmUgYnkgbG9hZGluZyBhbiBpbWFnZSBmcm9tIGEgVVJMLlxuICAgKiBTdXBwb3J0cyBib3RoIHJlZ3VsYXIgVVJMcyBhbmQgZGF0YSBVUklzLiBGb3IgZXh0ZXJuYWwgVVJMcywgQ09SUyBpcyBoYW5kbGVkIGF1dG9tYXRpY2FsbHkuXG4gICAqXG4gICAqIEBwYXJhbSBpbWFnZVVyaSAtIFRoZSBVUkwgb3IgZGF0YSBVUkkgb2YgdGhlIGltYWdlIHRvIGxvYWRcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBDb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRleHR1cmUgZ2VuZXJhdGlvblxuICAgKiBAcGFyYW0gb3B0aW9ucy5sZXZlbCAtIE1pcCBsZXZlbCAoZGVmYXVsdDogMClcbiAgICogQHBhcmFtIG9wdGlvbnMuaW50ZXJuYWxGb3JtYXQgLSBJbnRlcm5hbCB0ZXh0dXJlIGZvcm1hdCAoZGVmYXVsdDogUkdCQTgpXG4gICAqIEBwYXJhbSBvcHRpb25zLmZvcm1hdCAtIFBpeGVsIGZvcm1hdCAoZGVmYXVsdDogUkdCQSlcbiAgICogQHBhcmFtIG9wdGlvbnMudHlwZSAtIENvbXBvbmVudCB0eXBlIChkZWZhdWx0OiBVbnNpZ25lZEJ5dGUpXG4gICAqIEBwYXJhbSBvcHRpb25zLmdlbmVyYXRlTWlwbWFwIC0gV2hldGhlciB0byBnZW5lcmF0ZSBtaXBtYXBzIChkZWZhdWx0OiB0cnVlKVxuICAgKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0ZXh0dXJlIGlzIGxvYWRlZCBhbmQgcmVhZHlcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCB0ZXh0dXJlID0gbmV3IFRleHR1cmUoKTtcbiAgICogYXdhaXQgdGV4dHVyZS5nZW5lcmF0ZVRleHR1cmVGcm9tVXJsKCdodHRwczovL2V4YW1wbGUuY29tL2ltYWdlLmpwZycpO1xuICAgKiBgYGBcbiAgICovXG4gIGFzeW5jIGdlbmVyYXRlVGV4dHVyZUZyb21VcmwoXG4gICAgaW1hZ2VVcmk6IHN0cmluZyxcbiAgICB7XG4gICAgICBsZXZlbCA9IDAsXG4gICAgICBpbnRlcm5hbEZvcm1hdCA9IFRleHR1cmVGb3JtYXQuUkdCQTgsXG4gICAgICBmb3JtYXQgPSBQaXhlbEZvcm1hdC5SR0JBLFxuICAgICAgdHlwZSA9IENvbXBvbmVudFR5cGUuVW5zaWduZWRCeXRlLFxuICAgICAgZ2VuZXJhdGVNaXBtYXAgPSB0cnVlLFxuICAgIH0gPSB7fVxuICApIHtcbiAgICB0aGlzLl9fdXJpID0gaW1hZ2VVcmk7XG4gICAgdGhpcy5fX3N0YXJ0ZWRUb0xvYWQgPSB0cnVlO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgX3JlamVjdCkgPT4ge1xuICAgICAgdGhpcy5fX2ltZyA9IG5ldyBJbWFnZSgpO1xuICAgICAgaWYgKCFpbWFnZVVyaS5tYXRjaCgvXmRhdGE6LykpIHtcbiAgICAgICAgdGhpcy5fX2ltZy5jcm9zc09yaWdpbiA9ICdBbm9ueW1vdXMnO1xuICAgICAgfVxuICAgICAgdGhpcy5fX2ltZy5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuX19odG1sSW1hZ2VFbGVtZW50ID0gdGhpcy5fX2ltZztcblxuICAgICAgICBsZXQgaW1nOiBIVE1MSW1hZ2VFbGVtZW50IHwgSFRNTENhbnZhc0VsZW1lbnQgPSB0aGlzLl9faW1nITtcblxuICAgICAgICBpZiAodGhpcy5hdXRvRGV0ZWN0VHJhbnNwYXJlbmN5KSB7XG4gICAgICAgICAgdGhpcy5fX2hhc1RyYW5zcGFyZW50UGl4ZWxzID0gRGF0YVV0aWwuZGV0ZWN0VHJhbnNwYXJlbnRQaXhlbEV4aXN0ZW5jZShpbWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fX3dpZHRoID0gaW1nLndpZHRoO1xuICAgICAgICB0aGlzLl9faGVpZ2h0ID0gaW1nLmhlaWdodDtcblxuICAgICAgICBjb25zdCBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUuY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnk7XG5cbiAgICAgICAgbGV0IHRleHR1cmU6IENHQVBJUmVzb3VyY2VIYW5kbGUgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgICAgICAgKGFzeW5jICgpID0+IHtcbiAgICAgICAgICBpZiAoaW1nIGluc3RhbmNlb2YgSFRNTEltYWdlRWxlbWVudCkge1xuICAgICAgICAgICAgdGV4dHVyZSA9IGF3YWl0IGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5LmNyZWF0ZVRleHR1cmVGcm9tSFRNTEltYWdlRWxlbWVudChpbWcsIHtcbiAgICAgICAgICAgICAgbGV2ZWwsXG4gICAgICAgICAgICAgIGludGVybmFsRm9ybWF0LFxuICAgICAgICAgICAgICB3aWR0aDogdGhpcy5fX3dpZHRoLFxuICAgICAgICAgICAgICBoZWlnaHQ6IHRoaXMuX19oZWlnaHQsXG4gICAgICAgICAgICAgIGJvcmRlcjogMCxcbiAgICAgICAgICAgICAgZm9ybWF0LFxuICAgICAgICAgICAgICB0eXBlLFxuICAgICAgICAgICAgICBnZW5lcmF0ZU1pcG1hcCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vuc3VwcG9ydGVkIGltYWdlIHR5cGUnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5fX3NldFRleHR1cmVSZXNvdXJjZVVpZCh0ZXh0dXJlLCB0aGlzLnVuaXF1ZU5hbWUpO1xuICAgICAgICAgIGlmICh0aGlzLl9fZW5naW5lLmVuZ2luZVN0YXRlLmN1cnJlbnRQcm9jZXNzQXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHUFUpIHtcbiAgICAgICAgICAgIHRoaXMuX3RleHR1cmVWaWV3UmVzb3VyY2VVaWQgPSAoXG4gICAgICAgICAgICAgIGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5IGFzIHVua25vd24gYXMgV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5XG4gICAgICAgICAgICApLmNyZWF0ZVRleHR1cmVWaWV3MmQodGhpcy5fdGV4dHVyZVJlc291cmNlVWlkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5fX2lzVGV4dHVyZVJlYWR5ID0gdHJ1ZTtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pKCk7XG4gICAgICB9O1xuXG4gICAgICB0aGlzLl9faW1nLnNyYyA9IGltYWdlVXJpO1xuICAgIH0pIGFzIFByb21pc2U8dm9pZD47XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIGEgMXgxIHBpeGVsIHRleHR1cmUgd2l0aCBhIHNvbGlkIGNvbG9yLlxuICAgKiBVc2VmdWwgZm9yIGNyZWF0aW5nIHBsYWNlaG9sZGVyIHRleHR1cmVzIG9yIHNvbGlkIGNvbG9yIG1hdGVyaWFscy5cbiAgICpcbiAgICogQHBhcmFtIHJnYmFTdHIgLSBDU1MgY29sb3Igc3RyaW5nIGluIHJnYmEgZm9ybWF0IChkZWZhdWx0OiAncmdiYSgyNTUsMjU1LDI1NSwxKScpXG4gICAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRleHR1cmUgaXMgcmVhZHlcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCB0ZXh0dXJlID0gbmV3IFRleHR1cmUoKTtcbiAgICogYXdhaXQgdGV4dHVyZS5nZW5lcmF0ZTF4MVRleHR1cmVGcm9tKCdyZ2JhKDI1NSwwLDAsMSknKTsgLy8gUmVkIHRleHR1cmVcbiAgICogYGBgXG4gICAqL1xuICBhc3luYyBnZW5lcmF0ZTF4MVRleHR1cmVGcm9tKHJnYmFTdHIgPSAncmdiYSgyNTUsMjU1LDI1NSwxKScpIHtcbiAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICBjYW52YXMud2lkdGggPSAxO1xuICAgIGNhbnZhcy5oZWlnaHQgPSAxO1xuICAgIHRoaXMuX193aWR0aCA9IDE7XG4gICAgdGhpcy5fX2hlaWdodCA9IDE7XG4gICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgaWYgKGN0eCA9PSBudWxsKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcignRmFpbGVkIHRvIGdldCBjYW52YXMgY29udGV4dC4nKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY3R4LmZpbGxTdHlsZSA9IHJnYmFTdHI7XG4gICAgY3R4LmZpbGxSZWN0KDAsIDAsIDEsIDEpO1xuXG4gICAgY29uc3QgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLmNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGNvbnN0IHRleHR1cmVIYW5kbGUgPSBhd2FpdCBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeS5jcmVhdGVUZXh0dXJlRnJvbUltYWdlQml0bWFwRGF0YShjYW52YXMsIHtcbiAgICAgIGxldmVsOiAwLFxuICAgICAgaW50ZXJuYWxGb3JtYXQ6IFRleHR1cmVGb3JtYXQuUkdCQTgsXG4gICAgICB3aWR0aDogMSxcbiAgICAgIGhlaWdodDogMSxcbiAgICAgIGJvcmRlcjogMCxcbiAgICAgIGZvcm1hdDogUGl4ZWxGb3JtYXQuUkdCQSxcbiAgICAgIHR5cGU6IENvbXBvbmVudFR5cGUuVW5zaWduZWRCeXRlLFxuICAgICAgZ2VuZXJhdGVNaXBtYXA6IGZhbHNlLFxuICAgIH0pO1xuXG4gICAgdGhpcy5fX3NldFRleHR1cmVSZXNvdXJjZVVpZCh0ZXh0dXJlSGFuZGxlLCB0aGlzLnVuaXF1ZU5hbWUpO1xuICAgIGlmICh0aGlzLl9fZW5naW5lLmVuZ2luZVN0YXRlLmN1cnJlbnRQcm9jZXNzQXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHUFUpIHtcbiAgICAgIHRoaXMuX3RleHR1cmVWaWV3UmVzb3VyY2VVaWQgPSAoXG4gICAgICAgIGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5IGFzIHVua25vd24gYXMgV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5XG4gICAgICApLmNyZWF0ZVRleHR1cmVWaWV3MmQodGhpcy5fdGV4dHVyZVJlc291cmNlVWlkKTtcbiAgICB9XG4gICAgdGhpcy5fX2lzVGV4dHVyZVJlYWR5ID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgYSBzaGVlbiBsb29rdXAgdGFibGUgdGV4dHVyZSBmcm9tIGVtYmVkZGVkIGRhdGEgVVJJLlxuICAgKiBUaGlzIGlzIHVzZWQgZm9yIHBoeXNpY2FsbHktYmFzZWQgcmVuZGVyaW5nIChQQlIpIHNoZWVuIGNhbGN1bGF0aW9ucy5cbiAgICogVGhlIFBCUiBtb2R1bGUgKHdoaWNoIGNvbnRhaW5zIHRoZSBpbWFnZSBkYXRhKSBpcyBsb2FkZWQgb24gZGVtYW5kIGFuZCBvbmx5IG9uY2UuXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRleHR1cmUgaXMgcmVhZHlcbiAgICovXG4gIGFzeW5jIGdlbmVyYXRlU2hlZW5MdXRUZXh0dXJlRnJvbURhdGFVcmkoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuX19pc1RleHR1cmVSZWFkeSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5fX3NoZWVuTHV0TG9hZFByb21pc2UgPT0gbnVsbCkge1xuICAgICAgdGhpcy5fX3NoZWVuTHV0TG9hZFByb21pc2UgPSB0aGlzLl9fZ2VuZXJhdGVTaGVlbkx1dFRleHR1cmVGcm9tRGF0YVVyaSgpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLl9fc2hlZW5MdXRMb2FkUHJvbWlzZTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgX19nZW5lcmF0ZVNoZWVuTHV0VGV4dHVyZUZyb21EYXRhVXJpKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG1vZHVsZU5hbWUgPSAncGJyJztcbiAgICBjb25zdCBtb2R1bGVNYW5hZ2VyID0gTW9kdWxlTWFuYWdlci5nZXRJbnN0YW5jZSgpO1xuICAgIGNvbnN0IHBick1vZHVsZSA9IChhd2FpdCBtb2R1bGVNYW5hZ2VyLmxvYWRNb2R1bGUobW9kdWxlTmFtZSkpIGFzIHsgc2hlZW5fRV9hbmRfREdUZXJtOiBzdHJpbmcgfTtcbiAgICBjb25zdCBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUuY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgaWYgKGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5ID09IG51bGwpIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCdGYWlsZWQgdG8gZ2V0IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB0ZXh0dXJlSGFuZGxlID0gYXdhaXQgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkuY3JlYXRlVGV4dHVyZUZyb21EYXRhVXJpKHBick1vZHVsZS5zaGVlbl9FX2FuZF9ER1Rlcm0sIHtcbiAgICAgIGxldmVsOiAwLFxuICAgICAgaW50ZXJuYWxGb3JtYXQ6IFRleHR1cmVGb3JtYXQuUkdCQTgsXG4gICAgICBib3JkZXI6IDAsXG4gICAgICBmb3JtYXQ6IFBpeGVsRm9ybWF0LlJHQkEsXG4gICAgICB0eXBlOiBDb21wb25lbnRUeXBlLlVuc2lnbmVkQnl0ZSxcbiAgICAgIGdlbmVyYXRlTWlwbWFwOiBmYWxzZSxcbiAgICB9KTtcbiAgICB0aGlzLl9fc2V0VGV4dHVyZVJlc291cmNlVWlkKHRleHR1cmVIYW5kbGUsIHRoaXMudW5pcXVlTmFtZSk7XG4gICAgaWYgKHRoaXMuX19lbmdpbmUuZW5naW5lU3RhdGUuY3VycmVudFByb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgdGhpcy5fdGV4dHVyZVZpZXdSZXNvdXJjZVVpZCA9IChjZ0FwaVJlc291cmNlUmVwb3NpdG9yeSBhcyBXZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkpLmNyZWF0ZVRleHR1cmVWaWV3MmQoXG4gICAgICAgIHRoaXMuX3RleHR1cmVSZXNvdXJjZVVpZFxuICAgICAgKTtcbiAgICB9XG4gICAgdGhpcy5fX2lzVGV4dHVyZVJlYWR5ID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbGxvY2F0ZXMgYW4gZW1wdHkgdGV4dHVyZSB3aXRoIHNwZWNpZmllZCBkaW1lbnNpb25zIGFuZCBmb3JtYXQuXG4gICAqIFRoZSB0ZXh0dXJlIGNhbiBiZSBmaWxsZWQgd2l0aCBkYXRhIGxhdGVyIHVzaW5nIGxvYWRJbWFnZVRvTWlwTGV2ZWwuXG4gICAqXG4gICAqIEBwYXJhbSBkZXNjIC0gVGV4dHVyZSBhbGxvY2F0aW9uIGRlc2NyaXB0b3JcbiAgICogQHBhcmFtIGRlc2MubWlwTGV2ZWxDb3VudCAtIE51bWJlciBvZiBtaXAgbGV2ZWxzIChhdXRvLWNhbGN1bGF0ZWQgaWYgbm90IHByb3ZpZGVkKVxuICAgKiBAcGFyYW0gZGVzYy53aWR0aCAtIFRleHR1cmUgd2lkdGggaW4gcGl4ZWxzXG4gICAqIEBwYXJhbSBkZXNjLmhlaWdodCAtIFRleHR1cmUgaGVpZ2h0IGluIHBpeGVsc1xuICAgKiBAcGFyYW0gZGVzYy5mb3JtYXQgLSBUZXh0dXJlIGZvcm1hdFxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IHRleHR1cmUgPSBuZXcgVGV4dHVyZSgpO1xuICAgKiB0ZXh0dXJlLmFsbG9jYXRlKHtcbiAgICogICB3aWR0aDogNTEyLFxuICAgKiAgIGhlaWdodDogNTEyLFxuICAgKiAgIGZvcm1hdDogVGV4dHVyZUZvcm1hdC5SR0JBOFxuICAgKiB9KTtcbiAgICogYGBgXG4gICAqL1xuICBhbGxvY2F0ZShkZXNjOiB7IG1pcExldmVsQ291bnQ/OiBDb3VudDsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXI7IGZvcm1hdDogVGV4dHVyZUZvcm1hdEVudW0gfSkge1xuICAgIGNvbnN0IGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5ID0gdGhpcy5fX2VuZ2luZS5jZ0FwaVJlc291cmNlUmVwb3NpdG9yeTtcblxuICAgIGRlc2MubWlwTGV2ZWxDb3VudCA9IGRlc2MubWlwTGV2ZWxDb3VudCA/PyBNYXRoLmZsb29yKE1hdGgubG9nMihNYXRoLm1heChkZXNjLndpZHRoLCBkZXNjLmhlaWdodCkpKSArIDE7XG5cbiAgICBjb25zdCB0ZXh0dXJlID0gY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkuYWxsb2NhdGVUZXh0dXJlKHtcbiAgICAgIG1pcExldmVsQ291bnQ6IGRlc2MubWlwTGV2ZWxDb3VudCxcbiAgICAgIHdpZHRoOiBkZXNjLndpZHRoLFxuICAgICAgaGVpZ2h0OiBkZXNjLmhlaWdodCxcbiAgICAgIGZvcm1hdDogZGVzYy5mb3JtYXQsXG4gICAgfSk7XG5cbiAgICB0aGlzLl9fc2V0VGV4dHVyZVJlc291cmNlVWlkKHRleHR1cmUsIHRoaXMudW5pcXVlTmFtZSk7XG4gICAgaWYgKHRoaXMuX19lbmdpbmUuZW5naW5lU3RhdGUuY3VycmVudFByb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgdGhpcy5fdGV4dHVyZVZpZXdSZXNvdXJjZVVpZCA9IChjZ0FwaVJlc291cmNlUmVwb3NpdG9yeSBhcyBXZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkpLmNyZWF0ZVRleHR1cmVWaWV3MmQoXG4gICAgICAgIHRoaXMuX3RleHR1cmVSZXNvdXJjZVVpZFxuICAgICAgKTtcbiAgICB9XG4gICAgdGhpcy5fX3dpZHRoID0gZGVzYy53aWR0aDtcbiAgICB0aGlzLl9faGVpZ2h0ID0gZGVzYy5oZWlnaHQ7XG4gICAgdGhpcy5fX21pcExldmVsQ291bnQgPSBkZXNjLm1pcExldmVsQ291bnQ7XG4gICAgdGhpcy5fX2ludGVybmFsRm9ybWF0ID0gZGVzYy5mb3JtYXQ7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgaW1hZ2UgZGF0YSB0byBhIHNwZWNpZmljIG1pcCBsZXZlbCBvZiBhbiBhbGxvY2F0ZWQgdGV4dHVyZS5cbiAgICogVGhlIHRleHR1cmUgbXVzdCBiZSBhbGxvY2F0ZWQgZmlyc3QgdXNpbmcgdGhlIGFsbG9jYXRlIG1ldGhvZC5cbiAgICpcbiAgICogQHBhcmFtIGRlc2MgLSBEZXNjcmlwdG9yIGNvbnRhaW5pbmcgaW1hZ2UgZGF0YSBhbmQgdGFyZ2V0IGxvY2F0aW9uXG4gICAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIGRhdGEgaXMgbG9hZGVkXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogYXdhaXQgdGV4dHVyZS5sb2FkSW1hZ2VUb01pcExldmVsKHtcbiAgICogICBtaXBMZXZlbDogMCxcbiAgICogICB4T2Zmc2V0OiAwLFxuICAgKiAgIHlPZmZzZXQ6IDAsXG4gICAqICAgd2lkdGg6IDI1NixcbiAgICogICBoZWlnaHQ6IDI1NixcbiAgICogICBkYXRhOiBpbWFnZURhdGEsXG4gICAqICAgcm93U2l6ZUJ5UGl4ZWw6IDI1NixcbiAgICogICB0eXBlOiBDb21wb25lbnRUeXBlLlVuc2lnbmVkQnl0ZVxuICAgKiB9KTtcbiAgICogYGBgXG4gICAqL1xuICBhc3luYyBsb2FkSW1hZ2VUb01pcExldmVsKGRlc2M6IExvYWRJbWFnZVRvTWlwTGV2ZWxEZXNjcmlwdG9yKSB7XG4gICAgY29uc3Qgd2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLmNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5O1xuXG4gICAgYXdhaXQgd2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkubG9hZEltYWdlVG9NaXBMZXZlbE9mVGV4dHVyZTJEKHtcbiAgICAgIG1pcExldmVsOiBkZXNjLm1pcExldmVsLFxuICAgICAgdGV4dHVyZVVpZDogdGhpcy5fdGV4dHVyZVJlc291cmNlVWlkLFxuICAgICAgZm9ybWF0OiB0aGlzLl9faW50ZXJuYWxGb3JtYXQsXG4gICAgICB0eXBlOiBkZXNjLnR5cGUsXG4gICAgICB4T2Zmc2V0OiBkZXNjLnhPZmZzZXQsXG4gICAgICB5T2Zmc2V0OiBkZXNjLnlPZmZzZXQsXG4gICAgICB3aWR0aDogZGVzYy53aWR0aCxcbiAgICAgIGhlaWdodDogZGVzYy5oZWlnaHQsXG4gICAgICByb3dTaXplQnlQaXhlbDogZGVzYy5yb3dTaXplQnlQaXhlbCxcbiAgICAgIGRhdGE6IGRlc2MuZGF0YSxcbiAgICB9KTtcblxuICAgIGlmIChkZXNjLm1pcExldmVsID09PSAwKSB7XG4gICAgICB0aGlzLl9faXNUZXh0dXJlUmVhZHkgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgYSBjb21wcmVzc2VkIHRleHR1cmUgZnJvbSByYXcgdHlwZWQgYXJyYXkgZGF0YS5cbiAgICpcbiAgICogQHBhcmFtIHR5cGVkQXJyYXkgLSBUaGUgY29tcHJlc3NlZCB0ZXh0dXJlIGRhdGFcbiAgICogQHBhcmFtIHdpZHRoIC0gVGV4dHVyZSB3aWR0aCBpbiBwaXhlbHNcbiAgICogQHBhcmFtIGhlaWdodCAtIFRleHR1cmUgaGVpZ2h0IGluIHBpeGVsc1xuICAgKiBAcGFyYW0gY29tcHJlc3Npb25UZXh0dXJlVHlwZSAtIFR5cGUgb2YgY29tcHJlc3Npb24gdXNlZFxuICAgKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0ZXh0dXJlIGlzIHJlYWR5XG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgdGV4dHVyZSA9IG5ldyBUZXh0dXJlKCk7XG4gICAqIGF3YWl0IHRleHR1cmUuZ2VuZXJhdGVDb21wcmVzc2VkVGV4dHVyZUZyb21UeXBlZEFycmF5KFxuICAgKiAgIGNvbXByZXNzZWREYXRhLFxuICAgKiAgIDUxMixcbiAgICogICA1MTIsXG4gICAqICAgQ29tcHJlc3Npb25UZXh0dXJlVHlwZS5TM1RDX0RYVDFcbiAgICogKTtcbiAgICogYGBgXG4gICAqL1xuICBhc3luYyBnZW5lcmF0ZUNvbXByZXNzZWRUZXh0dXJlRnJvbVR5cGVkQXJyYXkoXG4gICAgdHlwZWRBcnJheTogVHlwZWRBcnJheSxcbiAgICB3aWR0aDogbnVtYmVyLFxuICAgIGhlaWdodDogbnVtYmVyLFxuICAgIGNvbXByZXNzaW9uVGV4dHVyZVR5cGU6IENvbXByZXNzaW9uVGV4dHVyZVR5cGVFbnVtXG4gICkge1xuICAgIHRoaXMuX193aWR0aCA9IHdpZHRoO1xuICAgIHRoaXMuX19oZWlnaHQgPSBoZWlnaHQ7XG5cbiAgICBjb25zdCB0ZXh0dXJlRGF0YSA9IHtcbiAgICAgIGxldmVsOiAwLFxuICAgICAgd2lkdGgsXG4gICAgICBoZWlnaHQsXG4gICAgICBidWZmZXI6IHR5cGVkQXJyYXksXG4gICAgfSBhcyBUZXh0dXJlRGF0YTtcblxuICAgIGNvbnN0IGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5ID0gdGhpcy5fX2VuZ2luZS5jZ0FwaVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICBjb25zdCB0ZXh0dXJlSGFuZGxlID0gYXdhaXQgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkuY3JlYXRlQ29tcHJlc3NlZFRleHR1cmUoW3RleHR1cmVEYXRhXSwgY29tcHJlc3Npb25UZXh0dXJlVHlwZSk7XG5cbiAgICB0aGlzLl9fc2V0VGV4dHVyZVJlc291cmNlVWlkKHRleHR1cmVIYW5kbGUsIHRoaXMudW5pcXVlTmFtZSk7XG4gICAgaWYgKHRoaXMuX19lbmdpbmUuZW5naW5lU3RhdGUuY3VycmVudFByb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgdGhpcy5fdGV4dHVyZVZpZXdSZXNvdXJjZVVpZCA9IChjZ0FwaVJlc291cmNlUmVwb3NpdG9yeSBhcyBXZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkpLmNyZWF0ZVRleHR1cmVWaWV3MmQoXG4gICAgICAgIHRoaXMuX3RleHR1cmVSZXNvdXJjZVVpZFxuICAgICAgKTtcbiAgICB9XG4gICAgdGhpcy5fX2lzVGV4dHVyZVJlYWR5ID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgYSBjb21wcmVzc2VkIHRleHR1cmUgd2l0aCBtaXBtYXBzIGZyb20gYW4gYXJyYXkgb2YgdGV4dHVyZSBkYXRhLlxuICAgKiBFYWNoIFRleHR1cmVEYXRhIG9iamVjdCByZXByZXNlbnRzIGEgZGlmZmVyZW50IG1pcCBsZXZlbC5cbiAgICpcbiAgICogQHBhcmFtIHRleHR1cmVEYXRhQXJyYXkgLSBBcnJheSBvZiB0ZXh0dXJlIGRhdGEgZm9yIGRpZmZlcmVudCBtaXAgbGV2ZWxzXG4gICAqIEBwYXJhbSBjb21wcmVzc2lvblRleHR1cmVUeXBlIC0gVHlwZSBvZiBjb21wcmVzc2lvbiB1c2VkXG4gICAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRleHR1cmUgaXMgcmVhZHlcbiAgICogQHRocm93cyBFcnJvciBpZiBsZXZlbCAwIHRleHR1cmUgZGF0YSBpcyBub3QgZm91bmRcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCB0ZXh0dXJlID0gbmV3IFRleHR1cmUoKTtcbiAgICogY29uc3QgbWlwbWFwRGF0YSA9IFtcbiAgICogICB7IGxldmVsOiAwLCB3aWR0aDogNTEyLCBoZWlnaHQ6IDUxMiwgYnVmZmVyOiBsZXZlbDBEYXRhIH0sXG4gICAqICAgeyBsZXZlbDogMSwgd2lkdGg6IDI1NiwgaGVpZ2h0OiAyNTYsIGJ1ZmZlcjogbGV2ZWwxRGF0YSB9LFxuICAgKiAgIC8vIC4uLiBtb3JlIGxldmVsc1xuICAgKiBdO1xuICAgKiBhd2FpdCB0ZXh0dXJlLmdlbmVyYXRlQ29tcHJlc3NlZFRleHR1cmVXaXRoTWlwbWFwRnJvbVR5cGVkQXJyYXkoXG4gICAqICAgbWlwbWFwRGF0YSxcbiAgICogICBDb21wcmVzc2lvblRleHR1cmVUeXBlLlMzVENfRFhUMVxuICAgKiApO1xuICAgKiBgYGBcbiAgICovXG4gIGFzeW5jIGdlbmVyYXRlQ29tcHJlc3NlZFRleHR1cmVXaXRoTWlwbWFwRnJvbVR5cGVkQXJyYXkoXG4gICAgdGV4dHVyZURhdGFBcnJheTogVGV4dHVyZURhdGFbXSxcbiAgICBjb21wcmVzc2lvblRleHR1cmVUeXBlOiBDb21wcmVzc2lvblRleHR1cmVUeXBlRW51bVxuICApIHtcbiAgICBjb25zdCBvcmlnaW5hbFRleHR1cmVEYXRhID0gdGV4dHVyZURhdGFBcnJheS5maW5kKHRleHR1cmVEYXRhID0+IHRleHR1cmVEYXRhLmxldmVsID09PSAwKTtcbiAgICBpZiAob3JpZ2luYWxUZXh0dXJlRGF0YSA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3RleHR1cmUgZGF0YSB3aXRoIGxldmVsIDAgaXMgbm90IGZvdW5kJyk7XG4gICAgfVxuXG4gICAgdGhpcy5fX3dpZHRoID0gb3JpZ2luYWxUZXh0dXJlRGF0YS53aWR0aDtcbiAgICB0aGlzLl9faGVpZ2h0ID0gb3JpZ2luYWxUZXh0dXJlRGF0YS5oZWlnaHQ7XG5cbiAgICBjb25zdCBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUuY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgY29uc3QgdGV4dHVyZUhhbmRsZSA9IGF3YWl0IGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5LmNyZWF0ZUNvbXByZXNzZWRUZXh0dXJlKFxuICAgICAgdGV4dHVyZURhdGFBcnJheSxcbiAgICAgIGNvbXByZXNzaW9uVGV4dHVyZVR5cGVcbiAgICApO1xuXG4gICAgdGhpcy5fX3NldFRleHR1cmVSZXNvdXJjZVVpZCh0ZXh0dXJlSGFuZGxlLCB0aGlzLnVuaXF1ZU5hbWUpO1xuICAgIGlmICh0aGlzLl9fZW5naW5lLmVuZ2luZVN0YXRlLmN1cnJlbnRQcm9jZXNzQXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHUFUpIHtcbiAgICAgIHRoaXMuX3RleHR1cmVWaWV3UmVzb3VyY2VVaWQgPSAoY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgYXMgV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5KS5jcmVhdGVUZXh0dXJlVmlldzJkKFxuICAgICAgICB0aGlzLl90ZXh0dXJlUmVzb3VyY2VVaWRcbiAgICAgICk7XG4gICAgfVxuICAgIHRoaXMuX19pc1RleHR1cmVSZWFkeSA9IHRydWU7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIG1pcG1hcHMgZm9yIHRoZSB0ZXh0dXJlIGF1dG9tYXRpY2FsbHkuXG4gICAqIFRoZSB0ZXh0dXJlIG11c3QgYWxyZWFkeSBiZSBsb2FkZWQgYW5kIHJlYWR5IGJlZm9yZSBjYWxsaW5nIHRoaXMgbWV0aG9kLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IHRleHR1cmUgPSBuZXcgVGV4dHVyZSgpO1xuICAgKiBhd2FpdCB0ZXh0dXJlLmdlbmVyYXRlVGV4dHVyZUZyb21VcmwoJ2ltYWdlLmpwZycsIHsgZ2VuZXJhdGVNaXBtYXA6IGZhbHNlIH0pO1xuICAgKiB0ZXh0dXJlLmdlbmVyYXRlTWlwbWFwcygpOyAvLyBHZW5lcmF0ZSBtaXBtYXBzIG1hbnVhbGx5XG4gICAqIGBgYFxuICAgKi9cbiAgZ2VuZXJhdGVNaXBtYXBzKCkge1xuICAgIGNvbnN0IGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5ID0gdGhpcy5fX2VuZ2luZS5jZ0FwaVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeS5nZW5lcmF0ZU1pcG1hcHMyZCh0aGlzLl90ZXh0dXJlUmVzb3VyY2VVaWQsIHRoaXMuX193aWR0aCwgdGhpcy5fX2hlaWdodCk7XG4gIH1cblxuICAvKipcbiAgICogSW1wb3J0cyBhbiBleGlzdGluZyBXZWJHTCB0ZXh0dXJlIGRpcmVjdGx5IHdpdGhvdXQgY29weWluZyBkYXRhLlxuICAgKiBUaGlzIGlzIHVzZWZ1bCBmb3IgaW50ZWdyYXRpbmcgd2l0aCBleHRlcm5hbCBXZWJHTCBjb2RlIG9yIGxpYnJhcmllcy5cbiAgICpcbiAgICogQHBhcmFtIHdlYkdMVGV4dHVyZSAtIFRoZSBXZWJHTCB0ZXh0dXJlIG9iamVjdCB0byBpbXBvcnRcbiAgICogQHBhcmFtIHdpZHRoIC0gVGV4dHVyZSB3aWR0aCBpbiBwaXhlbHMgKGRlZmF1bHQ6IDApXG4gICAqIEBwYXJhbSBoZWlnaHQgLSBUZXh0dXJlIGhlaWdodCBpbiBwaXhlbHMgKGRlZmF1bHQ6IDApXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgdGV4dHVyZSA9IG5ldyBUZXh0dXJlKCk7XG4gICAqIGNvbnN0IHdlYmdsVGV4dHVyZSA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcbiAgICogLy8gLi4uIHNldCB1cCB3ZWJnbFRleHR1cmVcbiAgICogdGV4dHVyZS5pbXBvcnRXZWJHTFRleHR1cmVEaXJlY3RseSh3ZWJnbFRleHR1cmUsIDUxMiwgNTEyKTtcbiAgICogYGBgXG4gICAqL1xuICBpbXBvcnRXZWJHTFRleHR1cmVEaXJlY3RseSh3ZWJHTFRleHR1cmU6IFdlYkdMVGV4dHVyZSwgd2lkdGggPSAwLCBoZWlnaHQgPSAwKSB7XG4gICAgdGhpcy5fX3dpZHRoID0gd2lkdGg7XG4gICAgdGhpcy5fX2hlaWdodCA9IGhlaWdodDtcbiAgICBjb25zdCB3ZWJHTFJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgY29uc3QgdGV4dHVyZSA9IHdlYkdMUmVzb3VyY2VSZXBvc2l0b3J5LnNldFdlYkdMVGV4dHVyZURpcmVjdGx5KHdlYkdMVGV4dHVyZSk7XG4gICAgdGhpcy5fX3NldFRleHR1cmVSZXNvdXJjZVVpZCh0ZXh0dXJlLCB0aGlzLnVuaXF1ZU5hbWUpO1xuICAgIHRoaXMuX19zdGFydGVkVG9Mb2FkID0gdHJ1ZTtcbiAgICB0aGlzLl9faXNUZXh0dXJlUmVhZHkgPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSAzRCBBUEkgcmVzb3VyY2VzIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHRleHR1cmUuXG4gICAqIFRoaXMgcmVsZWFzZXMgR1BVIG1lbW9yeSBhbmQgaW52YWxpZGF0ZXMgdGhlIHRleHR1cmUuXG4gICAqXG4gICAqIEByZXR1cm5zIEFsd2F5cyByZXR1cm5zIHRydWVcbiAgICovXG4gIGRlc3Ryb3kzREFQSVJlc291cmNlcygpIHtcbiAgICBUZXh0dXJlLl9fZGVsZXRlSW50ZXJuYWxUZXh0dXJlKHRoaXMuX19lbmdpbmUsIHRoaXMuX3RleHR1cmVSZXNvdXJjZVVpZCk7XG4gICAgdGhpcy5fdGV4dHVyZVJlc291cmNlVWlkID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gICAgdGhpcy5fc2FtcGxlclJlc291cmNlVWlkID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gICAgaWYgKHRoaXMuX3JlY29tbWVuZGVkVGV4dHVyZVNhbXBsZXIpIHtcbiAgICAgIHRoaXMuX3JlY29tbWVuZGVkVGV4dHVyZVNhbXBsZXIuZGVzdHJveSgpO1xuICAgIH1cbiAgICB0aGlzLl9faXNUZXh0dXJlUmVhZHkgPSBmYWxzZTtcbiAgICB0aGlzLl9fc3RhcnRlZFRvTG9hZCA9IGZhbHNlO1xuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogSW50ZXJuYWwgbWV0aG9kIHRvIGRlbGV0ZSBhIHRleHR1cmUgcmVzb3VyY2UgZnJvbSB0aGUgZ3JhcGhpY3MgQVBJLlxuICAgKiBAcGFyYW0gdGV4dHVyZVJlc291cmNlVWlkIC0gVGhlIHRleHR1cmUgcmVzb3VyY2UgaGFuZGxlIHRvIGRlbGV0ZVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19kZWxldGVJbnRlcm5hbFRleHR1cmUoZW5naW5lOiBFbmdpbmUsIHRleHR1cmVSZXNvdXJjZVVpZDogQ0dBUElSZXNvdXJjZUhhbmRsZSkge1xuICAgIGNvbnN0IGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5ID0gZW5naW5lLmNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5LmRlbGV0ZVRleHR1cmUodGV4dHVyZVJlc291cmNlVWlkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTeW1ib2wuZGlzcG9zZSBpbXBsZW1lbnRhdGlvbiBmb3IgYXV0b21hdGljIHJlc291cmNlIGNsZWFudXAuXG4gICAqIENhbGxlZCBhdXRvbWF0aWNhbGx5IHdoZW4gdXNpbmcgJ3VzaW5nJyBkZWNsYXJhdGlvbnMgaW4gVHlwZVNjcmlwdCA1LjIrLlxuICAgKi9cbiAgW1N5bWJvbC5kaXNwb3NlXSgpIHtcbiAgICBMb2dnZXIuZGVmYXVsdC5kZWJ1ZygnW1N5bWJvbC5kaXNwb3NlXSBpcyBjYWxsZWQnKTtcbiAgICB0aGlzLmRlc3Ryb3koKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGUgdGV4dHVyZSBhbmQgcmVsZWFzZXMgYWxsIGFzc29jaWF0ZWQgcmVzb3VyY2VzLlxuICAgKiBUaGlzIGluY2x1ZGVzIEdQVSBtZW1vcnksIGZpbmFsaXphdGlvbiByZWdpc3RyeSBlbnRyaWVzLCBhbmQgb3RoZXIgY2xlYW51cC5cbiAgICogQWZ0ZXIgY2FsbGluZyB0aGlzIG1ldGhvZCwgdGhlIHRleHR1cmUgc2hvdWxkIG5vdCBiZSB1c2VkLlxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLmRlc3Ryb3kzREFQSVJlc291cmNlcygpO1xuICAgIHRoaXMudW5yZWdpc3RlcigpO1xuICAgIFRleHR1cmUubWFuYWdlZFJlZ2lzdHJ5LnVucmVnaXN0ZXIodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogU3RhdGljIGZhY3RvcnkgbWV0aG9kIHRvIGNyZWF0ZSBhbmQgbG9hZCBhIHRleHR1cmUgZnJvbSBhIFVSTC5cbiAgICogVGhpcyBpcyBhIGNvbnZlbmllbmNlIG1ldGhvZCB0aGF0IGNvbWJpbmVzIHRleHR1cmUgY3JlYXRpb24gYW5kIGxvYWRpbmcuXG4gICAqXG4gICAqIEBwYXJhbSB1cmkgLSBUaGUgVVJMIG9yIGRhdGEgVVJJIG9mIHRoZSBpbWFnZSB0byBsb2FkXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gQ29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0ZXh0dXJlIGdlbmVyYXRpb25cbiAgICogQHBhcmFtIG9wdGlvbnMubGV2ZWwgLSBNaXAgbGV2ZWwgKGRlZmF1bHQ6IDApXG4gICAqIEBwYXJhbSBvcHRpb25zLmludGVybmFsRm9ybWF0IC0gSW50ZXJuYWwgdGV4dHVyZSBmb3JtYXQgKGRlZmF1bHQ6IFJHQkE4KVxuICAgKiBAcGFyYW0gb3B0aW9ucy5mb3JtYXQgLSBQaXhlbCBmb3JtYXQgKGRlZmF1bHQ6IFJHQkEpXG4gICAqIEBwYXJhbSBvcHRpb25zLnR5cGUgLSBDb21wb25lbnQgdHlwZSAoZGVmYXVsdDogVW5zaWduZWRCeXRlKVxuICAgKiBAcGFyYW0gb3B0aW9ucy5nZW5lcmF0ZU1pcG1hcCAtIFdoZXRoZXIgdG8gZ2VuZXJhdGUgbWlwbWFwcyAoZGVmYXVsdDogdHJ1ZSlcbiAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIHRoZSBsb2FkZWQgdGV4dHVyZVxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IHRleHR1cmUgPSBhd2FpdCBUZXh0dXJlLmxvYWRGcm9tVXJsKCdodHRwczovL2V4YW1wbGUuY29tL2ltYWdlLmpwZycsIHtcbiAgICogICBnZW5lcmF0ZU1pcG1hcDogZmFsc2UsXG4gICAqICAgZm9ybWF0OiBQaXhlbEZvcm1hdC5SR0JcbiAgICogfSk7XG4gICAqIGBgYFxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGxvYWRGcm9tVXJsKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIHVyaTogc3RyaW5nLFxuICAgIHtcbiAgICAgIGxldmVsID0gMCxcbiAgICAgIGludGVybmFsRm9ybWF0ID0gVGV4dHVyZUZvcm1hdC5SR0JBOCxcbiAgICAgIGZvcm1hdCA9IFBpeGVsRm9ybWF0LlJHQkEsXG4gICAgICB0eXBlID0gQ29tcG9uZW50VHlwZS5VbnNpZ25lZEJ5dGUsXG4gICAgICBnZW5lcmF0ZU1pcG1hcCA9IHRydWUsXG4gICAgfSA9IHt9XG4gICkge1xuICAgIGNvbnN0IHRleHR1cmUgPSBuZXcgVGV4dHVyZShlbmdpbmUpO1xuICAgIGF3YWl0IHRleHR1cmUuZ2VuZXJhdGVUZXh0dXJlRnJvbVVybCh1cmksIHtcbiAgICAgIGxldmVsLFxuICAgICAgaW50ZXJuYWxGb3JtYXQsXG4gICAgICBmb3JtYXQsXG4gICAgICB0eXBlLFxuICAgICAgZ2VuZXJhdGVNaXBtYXAsXG4gICAgfSk7XG4gICAgcmV0dXJuIHRleHR1cmU7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFLQSxTQUFTLHFCQUFxQjtBQUU5QixTQUFTLG1CQUF5QztBQUNsRCxTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLHFCQUE2QztBQUV0RCxTQUFTLGdCQUFnQjtBQUN6QixTQUFTLGNBQWM7QUFDdkIsU0FBUywrQkFBK0I7QUFFeEMsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyx1QkFBdUI7QUEwRHpCLElBQU0sV0FBTixNQUFNLGlCQUFnQixnQkFBc0M7QUFBQSxFQUE1RDtBQUFBO0FBRUw7QUFBQSxTQUFPLHlCQUF5QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBOEJ4Qix3QkFBd0Isb0JBQXlDLFlBQW9CO0FBQzNGLFNBQUssc0JBQXNCO0FBQzNCLGFBQVEsZ0JBQWdCLFNBQVMsTUFBTSxFQUFFLG9CQUFvQixRQUFRLEtBQUssVUFBVSxXQUFXLEdBQUcsSUFBSTtBQUFBLEVBQ3hHO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBc0JBLE1BQU0seUJBQ0osWUFDQSxTQU9lO0FBNUluQjtBQTZJSSxTQUFLLGtCQUFrQjtBQUN2QixRQUFJLE9BQU8sVUFBVSxhQUFhO0FBQ2hDLGFBQU8sUUFBUSxNQUFNLDhFQUE4RTtBQUFBLElBQ3JHO0FBR0EsUUFBSSxDQUFDLFNBQVEsbUJBQW1CO0FBQzlCLGVBQVEsb0JBQW9CO0FBRTVCLGVBQVEscUJBQXFCLElBQUksUUFBUSxhQUFXO0FB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
