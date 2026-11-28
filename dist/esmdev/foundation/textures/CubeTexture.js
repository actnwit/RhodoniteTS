// src/foundation/textures/CubeTexture.ts
import { HdriFormat } from "../definitions/HdriFormat.js";
import { ProcessApproach } from "../definitions/ProcessApproach.js";
import { TextureParameter } from "../definitions/TextureParameter.js";
import { Logger } from "../misc/Logger.js";
import { CGAPIResourceRepository } from "../renderer/CGAPIResourceRepository.js";
import { AbstractTexture } from "./AbstractTexture.js";
var _CubeTexture = class _CubeTexture extends AbstractTexture {
  constructor() {
    super(...arguments);
    /** The number of mipmap levels for this cube texture */
    this.mipmapLevelNumber = 1;
    /** The HDRI format used for this cube texture */
    this.hdriFormat = HdriFormat.LDR_SRGB;
  }
  /**
   * Sets the texture resource UID and registers the texture for automatic cleanup.
   * This is an internal method used by the loading methods.
   *
   * @param textureResourceUid - The unique identifier for the texture resource
   * @param uniqueName - A unique name for the texture used in logging
   * @private
   */
  bC(textureResourceUid, uniqueName) {
    this._textureResourceUid = textureResourceUid;
    _CubeTexture.managedRegistry.register(this, { textureResourceUid, engine: this.c, uniqueName }, this);
  }
  /**
   * Loads cube texture images from files asynchronously.
   * This method loads six cube faces from image files and creates a cube texture.
   *
   * @param options - Configuration options for loading the cube texture
   * @param options.baseUrl - Base URL path to the cube texture files
   * @param options.mipmapLevelNumber - Number of mipmap levels to generate
   * @param options.isNamePosNeg - Whether to use positive/negative naming convention (posX, negX, etc.)
   * @param options.hdriFormat - The HDRI format to use for the texture
   *
   * @example
   * ```typescript
   * const cubeTexture = new CubeTexture();
   * await cubeTexture.loadTextureImages({
   *   baseUrl: 'textures/skybox',
   *   mipmapLevelNumber: 1,
   *   isNamePosNeg: true,
   *   hdriFormat: HdriFormat.LDR_SRGB
   * });
   * ```
   */
  async loadTextureImages({
    baseUrl,
    mipmapLevelNumber,
    isNamePosNeg,
    hdriFormat
  }) {
    this.WB = true;
    this.mipmapLevelNumber = mipmapLevelNumber;
    this.hdriFormat = hdriFormat;
    const cgApiResourceRepository = this.c.cgApiResourceRepository;
    const [cubeTextureUid, sampler, width, height] = await cgApiResourceRepository.createCubeTextureFromFiles(
      this.c,
      baseUrl,
      mipmapLevelNumber,
      isNamePosNeg,
      hdriFormat
    );
    this.bC(cubeTextureUid, this.uniqueName);
    this._recommendedTextureSampler = sampler;
    this._samplerResourceUid = sampler._samplerResourceUid;
    this.km = width;
    this.iy = height;
    if (this.c.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = cgApiResourceRepository.createTextureViewCube(
        this._textureResourceUid
      );
    }
    this.TB = true;
  }
  /**
   * Loads cube texture from Basis compressed texture data.
   * Basis is a universal texture compression format that can be transcoded to various GPU formats.
   *
   * @param uint8Array - The Basis compressed texture data as a Uint8Array
   * @param options - Optional texture parameters for filtering and wrapping
   * @param options.magFilter - Magnification filter (default: Linear)
   * @param options.minFilter - Minification filter (default: LinearMipmapLinear)
   * @param options.wrapS - Texture wrapping mode for S coordinate (default: Repeat)
   * @param options.wrapT - Texture wrapping mode for T coordinate (default: Repeat)
   *
   * @throws Will log an error if BASIS transcoder is not available
   *
   * @example
   * ```typescript
   * const cubeTexture = new CubeTexture();
   * const basisData = new Uint8Array(basisFileBuffer);
   * cubeTexture.loadTextureImagesFromBasis(basisData, {
   *   magFilter: TextureParameter.Linear,
   *   minFilter: TextureParameter.LinearMipmapLinear
   * });
   * ```
   */
  loadTextureImagesFromBasis(uint8Array, {
    magFilter = TextureParameter.Linear,
    minFilter = TextureParameter.LinearMipmapLinear,
    wrapS = TextureParameter.Repeat,
    wrapT = TextureParameter.Repeat
  } = {}) {
    this.WB = true;
    if (typeof BASIS === "undefined") {
      Logger.default.error("Failed to call BASIS() function. Please check to import basis_transcoder.js.");
    }
    BASIS().then((basisTransCoder) => {
      const { initializeBasis } = basisTransCoder;
      initializeBasis();
      const BasisFile = basisTransCoder.BasisFile;
      const basisFile = new BasisFile(uint8Array);
      if (!basisFile.startTranscoding()) {
        Logger.default.error("failed to start transcoding.");
        basisFile.close();
        basisFile.delete();
        return;
      }
      const webGLResourceRepository = this.c.webglResourceRepository;
      const { resourceHandle, width, height } = webGLResourceRepository.createCubeTextureFromBasis(basisFile, {
        magFilter,
        minFilter,
        wrapS,
        wrapT
      });
      this.bC(resourceHandle, this.uniqueName);
      this.km = width;
      this.iy = height;
      this.TB = true;
      basisFile.close();
      basisFile.delete();
    });
  }
  /**
   * Creates a simple 1x1 pixel cube texture with a solid color.
   * This is useful for creating placeholder textures or solid color cube maps.
   *
   * @param rgbaStr - CSS color string in rgba format (default: 'rgba(0,0,0,1)' for black)
   *
   * @example
   * ```typescript
   * const cubeTexture = new CubeTexture();
   * cubeTexture.load1x1Texture('rgba(255,255,255,1)'); // White cube texture
   * cubeTexture.load1x1Texture('rgba(0,128,255,1)');   // Blue cube texture
   * ```
   */
  load1x1Texture(rgbaStr = "rgba(0,0,0,1)") {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (ctx == null) {
      Logger.default.error("Failed to get canvas context.");
      return;
    }
    ctx.fillStyle = rgbaStr;
    ctx.fillRect(0, 0, 1, 1);
    const cgApiResourceRepository = this.c.cgApiResourceRepository;
    const [resourceUid, sampler] = cgApiResourceRepository.createCubeTexture(
      this.c,
      1,
      [
        {
          posX: canvas,
          negX: canvas,
          posY: canvas,
          negY: canvas,
          posZ: canvas,
          negZ: canvas
        }
      ],
      1,
      1
    );
    this.bC(resourceUid, this.uniqueName);
    this._recommendedTextureSampler = sampler;
    this._samplerResourceUid = sampler._samplerResourceUid;
    this.km = 1;
    this.iy = 1;
    if (this.c.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = cgApiResourceRepository.createTextureViewCube(this._textureResourceUid);
    }
    this.TB = true;
  }
  /**
   * Generates a cube texture from typed arrays containing raw image data.
   * This method allows creating cube textures from pre-processed image data with multiple mipmap levels.
   *
   * @param typedArrayImages - Array of typed array objects for cubemap textures.
   *                          Each element represents a mipmap level (index 0 is the base level).
   *                          Each object contains six faces: posX, negX, posY, negY, posZ, negZ.
   * @param baseLevelWidth - Width of the base level texture (mipmap level 0)
   * @param baseLevelHeight - Height of the base level texture (mipmap level 0)
   *
   * @example
   * ```typescript
   * const cubeTexture = new CubeTexture();
   * const imageData = [{
   *   posX: new Uint8Array(imageDataPosX),
   *   negX: new Uint8Array(imageDataNegX),
   *   posY: new Uint8Array(imageDataPosY),
   *   negY: new Uint8Array(imageDataNegY),
   *   posZ: new Uint8Array(imageDataPosZ),
   *   negZ: new Uint8Array(imageDataNegZ)
   * }];
   * cubeTexture.generateTextureFromTypedArrays(imageData, 512, 512);
   * ```
   */
  generateTextureFromTypedArrays(typedArrayImages, baseLevelWidth, baseLevelHeight) {
    const webGLResourceRepository = this.c.webglResourceRepository;
    const [resourceId, sampler] = webGLResourceRepository.createCubeTexture(
      this.c,
      typedArrayImages.length,
      typedArrayImages,
      baseLevelWidth,
      baseLevelHeight
    );
    this._recommendedTextureSampler = sampler;
    this.bC(resourceId, this.uniqueName);
    this.km = baseLevelWidth;
    this.iy = baseLevelHeight;
    this.TB = true;
    this.WB = true;
  }
  /**
   * Imports an existing WebGL texture directly into this CubeTexture instance.
   * This method allows wrapping existing WebGL textures without creating new ones.
   *
   * @param webGLTexture - The existing WebGL texture object to import
   * @param width - Optional width of the texture (default: 0)
   * @param height - Optional height of the texture (default: 0)
   *
   * @example
   * ```typescript
   * const cubeTexture = new CubeTexture();
   * const existingTexture = gl.createTexture(); // Assume this is configured
   * cubeTexture.importWebGLTextureDirectly(existingTexture, 512, 512);
   * ```
   */
  importWebGLTextureDirectly(webGLTexture, width = 0, height = 0) {
    this.km = width;
    this.iy = height;
    const webGLResourceRepository = this.c.webglResourceRepository;
    const texture = webGLResourceRepository.setWebGLTextureDirectly(webGLTexture);
    this.bC(texture, this.uniqueName);
    this.WB = true;
    this.TB = true;
  }
  /**
   * Deletes the internal texture resource from the graphics API.
   * This is a static utility method used internally for cleanup.
   *
   * @param engine - The engine instance
   * @param textureResourceUid - The unique identifier of the texture resource to delete
   * @private
   */
  static cC(engine, textureResourceUid) {
    const cgApiResourceRepository = engine.cgApiResourceRepository;
    cgApiResourceRepository.deleteTexture(textureResourceUid);
  }
  /**
   * Destroys the 3D API resources associated with this cube texture.
   * This method releases the texture from GPU memory and resets the texture state.
   * After calling this method, the texture cannot be used for rendering until reloaded.
   */
  destroy3DAPIResources() {
    _CubeTexture.cC(this.c, this._textureResourceUid);
    this._textureResourceUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this._samplerResourceUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    if (this._recommendedTextureSampler) {
      this._recommendedTextureSampler.destroy();
    }
    this.TB = false;
    this.WB = false;
  }
  /**
   * Implements the Disposable interface for automatic resource cleanup.
   * This method is called when using the 'using' statement in TypeScript.
   *
   * @example
   * ```typescript
   * using cubeTexture = new CubeTexture();
   * // Texture will be automatically disposed when going out of scope
   * ```
   */
  [Symbol.dispose]() {
    Logger.default.debug("[Symbol.dispose] is called");
    this.destroy();
  }
  /**
   * Retrieves the pixel data from a specific face of the cube texture.
   * This operation reads back the texture data from GPU memory to CPU memory.
   *
   * @param faceIndex - Index of the cube face (0=+X, 1=-X, 2=+Y, 3=-Y, 4=+Z, 5=-Z)
   * @returns A promise that resolves to a Uint8Array containing the RGBA pixel data
   *
   * @example
   * ```typescript
   * const cubeTexture = new CubeTexture(engine);
   * // ... load texture ...
   * const posXData = await cubeTexture.getCubeFacePixelData(0); // Get +X face
   * const negYData = await cubeTexture.getCubeFacePixelData(3); // Get -Y face
   * ```
   */
  async getCubeFacePixelData(faceIndex) {
    if (faceIndex < 0 || faceIndex > 5) {
      throw new Error(`Invalid face index: ${faceIndex}. Must be between 0 and 5.`);
    }
    const cgApiResourceRepository = this.c.cgApiResourceRepository;
    const data = await cgApiResourceRepository.getCubeTexturePixelData(
      this._textureResourceUid,
      this.km,
      this.iy,
      faceIndex
    );
    return data;
  }
  /**
   * Retrieves the pixel data from all six faces of the cube texture.
   * This operation reads back all face data from GPU memory to CPU memory.
   *
   * @returns A promise that resolves to an object containing Uint8Arrays for each face
   *
   * @example
   * ```typescript
   * const cubeTexture = new CubeTexture(engine);
   * // ... load texture ...
   * const allFaces = await cubeTexture.getAllCubeFacePixelData();
   * console.log(allFaces.posX); // +X face data
   * console.log(allFaces.negZ); // -Z face data
   * ```
   */
  async getAllCubeFacePixelData() {
    const [posX, negX, posY, negY, posZ, negZ] = await Promise.all([
      this.getCubeFacePixelData(0),
      this.getCubeFacePixelData(1),
      this.getCubeFacePixelData(2),
      this.getCubeFacePixelData(3),
      this.getCubeFacePixelData(4),
      this.getCubeFacePixelData(5)
    ]);
    return { posX, negX, posY, negY, posZ, negZ };
  }
  /**
   * Completely destroys this cube texture and releases all associated resources.
   * This method should be called when the texture is no longer needed to prevent memory leaks.
   * After calling destroy(), this texture instance should not be used.
   */
  destroy() {
    this.destroy3DAPIResources();
    this.unregister();
    _CubeTexture.managedRegistry.unregister(this);
  }
  /**
   * Static factory method to create and load a cube texture from URL in one step.
   * This is a convenience method that combines instantiation and loading.
   *
   * @param options - Configuration options for loading the cube texture
   * @param options.baseUrl - Base URL path to the cube texture files
   * @param options.mipmapLevelNumber - Number of mipmap levels to generate
   * @param options.isNamePosNeg - Whether to use positive/negative naming convention
   * @param options.hdriFormat - The HDRI format to use for the texture
   * @returns Promise that resolves to a loaded CubeTexture instance
   *
   * @example
   * ```typescript
   * const cubeTexture = await CubeTexture.loadFromUrl({
   *   baseUrl: 'assets/skybox/sunset',
   *   mipmapLevelNumber: 1,
   *   isNamePosNeg: true,
   *   hdriFormat: HdriFormat.RGBE_PNG
   * });
   * ```
   */
  static async loadFromUrl(engine, {
    baseUrl,
    mipmapLevelNumber,
    isNamePosNeg,
    hdriFormat
  }) {
    const cubeTexture = new _CubeTexture(engine);
    await cubeTexture.loadTextureImages({
      baseUrl,
      mipmapLevelNumber,
      isNamePosNeg,
      hdriFormat
    });
    return cubeTexture;
  }
};
/**
 * Registry for automatic cleanup of cube texture resources when objects are garbage collected.
 * This helps prevent memory leaks by automatically releasing WebGL/WebGPU resources.
 */
_CubeTexture.managedRegistry = new FinalizationRegistry((texObj) => {
  Logger.default.info(
    `WebGL/WebGPU cube texture "${texObj.uniqueName}" was automatically released along with GC. But explicit release is recommended.`
  );
  _CubeTexture.cC(texObj.engine, texObj.textureResourceUid);
});
var CubeTexture = _CubeTexture;
export {
  CubeTexture
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vdGV4dHVyZXMvQ3ViZVRleHR1cmUudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgQkFTSVNfVFlQRSwgQmFzaXNUcmFuc2NvZGVyIH0gZnJvbSAnLi4vLi4vdHlwZXMvQmFzaXNUZXh0dXJlJztcbmltcG9ydCB0eXBlIHsgQ0dBUElSZXNvdXJjZUhhbmRsZSwgU2l6ZSwgVHlwZWRBcnJheSB9IGZyb20gJy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB0eXBlIHsgV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vd2ViZ3B1L1dlYkdwdVJlc291cmNlUmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBIZHJpRm9ybWF0LCB0eXBlIEhkcmlGb3JtYXRFbnVtIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvSGRyaUZvcm1hdCc7XG5pbXBvcnQgeyBQcm9jZXNzQXBwcm9hY2ggfSBmcm9tICcuLi9kZWZpbml0aW9ucy9Qcm9jZXNzQXBwcm9hY2gnO1xuaW1wb3J0IHsgVGV4dHVyZVBhcmFtZXRlciB9IGZyb20gJy4uL2RlZmluaXRpb25zL1RleHR1cmVQYXJhbWV0ZXInO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHsgQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkgfSBmcm9tICcuLi9yZW5kZXJlci9DR0FQSVJlc291cmNlUmVwb3NpdG9yeSc7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uL3N5c3RlbS9FbmdpbmUnO1xuaW1wb3J0IHsgQWJzdHJhY3RUZXh0dXJlIH0gZnJvbSAnLi9BYnN0cmFjdFRleHR1cmUnO1xuXG5kZWNsYXJlIGNvbnN0IEJBU0lTOiBCQVNJU19UWVBFO1xuXG50eXBlIEZpbmFsaXphdGlvblJlZ2lzdHJ5T2JqZWN0ID0ge1xuICB0ZXh0dXJlUmVzb3VyY2VVaWQ6IENHQVBJUmVzb3VyY2VIYW5kbGU7XG4gIGVuZ2luZTogRW5naW5lO1xuICB1bmlxdWVOYW1lOiBzdHJpbmc7XG59O1xuXG4vKipcbiAqIEEgY3ViZSB0ZXh0dXJlIGNsYXNzIHRoYXQgcmVwcmVzZW50cyBhIGN1YmVtYXAgdGV4dHVyZSBmb3IgM0QgcmVuZGVyaW5nLlxuICogQ3ViZSB0ZXh0dXJlcyBhcmUgY29tbW9ubHkgdXNlZCBmb3IgZW52aXJvbm1lbnQgbWFwcGluZywgc2t5Ym94ZXMsIGFuZCByZWZsZWN0aW9uIG1hcHBpbmcuXG4gKiBUaGlzIGNsYXNzIGV4dGVuZHMgQWJzdHJhY3RUZXh0dXJlIGFuZCBwcm92aWRlcyBmdW5jdGlvbmFsaXR5IHRvIGxvYWQgY3ViZSB0ZXh0dXJlcyBmcm9tIHZhcmlvdXMgc291cmNlc1xuICogaW5jbHVkaW5nIGZpbGVzLCBCYXNpcyBjb21wcmVzc2VkIHRleHR1cmVzLCBhbmQgdHlwZWQgYXJyYXlzLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiAvLyBMb2FkIGN1YmUgdGV4dHVyZSBmcm9tIGZpbGVzXG4gKiBjb25zdCBjdWJlVGV4dHVyZSA9IGF3YWl0IEN1YmVUZXh0dXJlLmxvYWRGcm9tVXJsKHtcbiAqICAgYmFzZVVybDogJ3BhdGgvdG8vY3ViZW1hcCcsXG4gKiAgIG1pcG1hcExldmVsTnVtYmVyOiAxLFxuICogICBpc05hbWVQb3NOZWc6IHRydWUsXG4gKiAgIGhkcmlGb3JtYXQ6IEhkcmlGb3JtYXQuTERSX1NSR0JcbiAqIH0pO1xuICpcbiAqIC8vIENyZWF0ZSBhIHNpbXBsZSAxeDEgY3ViZSB0ZXh0dXJlXG4gKiBjb25zdCBzaW1wbGVDdWJlID0gbmV3IEN1YmVUZXh0dXJlKCk7XG4gKiBzaW1wbGVDdWJlLmxvYWQxeDFUZXh0dXJlKCdyZ2JhKDI1NSwwLDAsMSknKTtcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgQ3ViZVRleHR1cmUgZXh0ZW5kcyBBYnN0cmFjdFRleHR1cmUgaW1wbGVtZW50cyBEaXNwb3NhYmxlIHtcbiAgLyoqIFRoZSBudW1iZXIgb2YgbWlwbWFwIGxldmVscyBmb3IgdGhpcyBjdWJlIHRleHR1cmUgKi9cbiAgcHVibGljIG1pcG1hcExldmVsTnVtYmVyID0gMTtcblxuICAvKiogVGhlIEhEUkkgZm9ybWF0IHVzZWQgZm9yIHRoaXMgY3ViZSB0ZXh0dXJlICovXG4gIHB1YmxpYyBoZHJpRm9ybWF0ID0gSGRyaUZvcm1hdC5MRFJfU1JHQjtcblxuICAvKipcbiAgICogUmVnaXN0cnkgZm9yIGF1dG9tYXRpYyBjbGVhbnVwIG9mIGN1YmUgdGV4dHVyZSByZXNvdXJjZXMgd2hlbiBvYmplY3RzIGFyZSBnYXJiYWdlIGNvbGxlY3RlZC5cbiAgICogVGhpcyBoZWxwcyBwcmV2ZW50IG1lbW9yeSBsZWFrcyBieSBhdXRvbWF0aWNhbGx5IHJlbGVhc2luZyBXZWJHTC9XZWJHUFUgcmVzb3VyY2VzLlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgbWFuYWdlZFJlZ2lzdHJ5OiBGaW5hbGl6YXRpb25SZWdpc3RyeTxGaW5hbGl6YXRpb25SZWdpc3RyeU9iamVjdD4gPVxuICAgIG5ldyBGaW5hbGl6YXRpb25SZWdpc3RyeTxGaW5hbGl6YXRpb25SZWdpc3RyeU9iamVjdD4odGV4T2JqID0+IHtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmluZm8oXG4gICAgICAgIGBXZWJHTC9XZWJHUFUgY3ViZSB0ZXh0dXJlIFwiJHt0ZXhPYmoudW5pcXVlTmFtZX1cIiB3YXMgYXV0b21hdGljYWxseSByZWxlYXNlZCBhbG9uZyB3aXRoIEdDLiBCdXQgZXhwbGljaXQgcmVsZWFzZSBpcyByZWNvbW1lbmRlZC5gXG4gICAgICApO1xuICAgICAgQ3ViZVRleHR1cmUuX19kZWxldGVJbnRlcm5hbFRleHR1cmUodGV4T2JqLmVuZ2luZSwgdGV4T2JqLnRleHR1cmVSZXNvdXJjZVVpZCk7XG4gICAgfSk7XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHRleHR1cmUgcmVzb3VyY2UgVUlEIGFuZCByZWdpc3RlcnMgdGhlIHRleHR1cmUgZm9yIGF1dG9tYXRpYyBjbGVhbnVwLlxuICAgKiBUaGlzIGlzIGFuIGludGVybmFsIG1ldGhvZCB1c2VkIGJ5IHRoZSBsb2FkaW5nIG1ldGhvZHMuXG4gICAqXG4gICAqIEBwYXJhbSB0ZXh0dXJlUmVzb3VyY2VVaWQgLSBUaGUgdW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0ZXh0dXJlIHJlc291cmNlXG4gICAqIEBwYXJhbSB1bmlxdWVOYW1lIC0gQSB1bmlxdWUgbmFtZSBmb3IgdGhlIHRleHR1cmUgdXNlZCBpbiBsb2dnaW5nXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIF9fc2V0VGV4dHVyZVJlc291cmNlVWlkKHRleHR1cmVSZXNvdXJjZVVpZDogQ0dBUElSZXNvdXJjZUhhbmRsZSwgdW5pcXVlTmFtZTogc3RyaW5nKSB7XG4gICAgdGhpcy5fdGV4dHVyZVJlc291cmNlVWlkID0gdGV4dHVyZVJlc291cmNlVWlkO1xuICAgIEN1YmVUZXh0dXJlLm1hbmFnZWRSZWdpc3RyeS5yZWdpc3Rlcih0aGlzLCB7IHRleHR1cmVSZXNvdXJjZVVpZCwgZW5naW5lOiB0aGlzLl9fZW5naW5lLCB1bmlxdWVOYW1lIH0sIHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIGN1YmUgdGV4dHVyZSBpbWFnZXMgZnJvbSBmaWxlcyBhc3luY2hyb25vdXNseS5cbiAgICogVGhpcyBtZXRob2QgbG9hZHMgc2l4IGN1YmUgZmFjZXMgZnJvbSBpbWFnZSBmaWxlcyBhbmQgY3JlYXRlcyBhIGN1YmUgdGV4dHVyZS5cbiAgICpcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBDb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIGxvYWRpbmcgdGhlIGN1YmUgdGV4dHVyZVxuICAgKiBAcGFyYW0gb3B0aW9ucy5iYXNlVXJsIC0gQmFzZSBVUkwgcGF0aCB0byB0aGUgY3ViZSB0ZXh0dXJlIGZpbGVzXG4gICAqIEBwYXJhbSBvcHRpb25zLm1pcG1hcExldmVsTnVtYmVyIC0gTnVtYmVyIG9mIG1pcG1hcCBsZXZlbHMgdG8gZ2VuZXJhdGVcbiAgICogQHBhcmFtIG9wdGlvbnMuaXNOYW1lUG9zTmVnIC0gV2hldGhlciB0byB1c2UgcG9zaXRpdmUvbmVnYXRpdmUgbmFtaW5nIGNvbnZlbnRpb24gKHBvc1gsIG5lZ1gsIGV0Yy4pXG4gICAqIEBwYXJhbSBvcHRpb25zLmhkcmlGb3JtYXQgLSBUaGUgSERSSSBmb3JtYXQgdG8gdXNlIGZvciB0aGUgdGV4dHVyZVxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IGN1YmVUZXh0dXJlID0gbmV3IEN1YmVUZXh0dXJlKCk7XG4gICAqIGF3YWl0IGN1YmVUZXh0dXJlLmxvYWRUZXh0dXJlSW1hZ2VzKHtcbiAgICogICBiYXNlVXJsOiAndGV4dHVyZXMvc2t5Ym94JyxcbiAgICogICBtaXBtYXBMZXZlbE51bWJlcjogMSxcbiAgICogICBpc05hbWVQb3NOZWc6IHRydWUsXG4gICAqICAgaGRyaUZvcm1hdDogSGRyaUZvcm1hdC5MRFJfU1JHQlxuICAgKiB9KTtcbiAgICogYGBgXG4gICAqL1xuICBhc3luYyBsb2FkVGV4dHVyZUltYWdlcyh7XG4gICAgYmFzZVVybCxcbiAgICBtaXBtYXBMZXZlbE51bWJlcixcbiAgICBpc05hbWVQb3NOZWcsXG4gICAgaGRyaUZvcm1hdCxcbiAgfToge1xuICAgIGJhc2VVcmw6IHN0cmluZztcbiAgICBtaXBtYXBMZXZlbE51bWJlcjogbnVtYmVyO1xuICAgIGlzTmFtZVBvc05lZzogYm9vbGVhbjtcbiAgICBoZHJpRm9ybWF0OiBIZHJpRm9ybWF0RW51bTtcbiAgfSkge1xuICAgIHRoaXMuX19zdGFydGVkVG9Mb2FkID0gdHJ1ZTtcblxuICAgIHRoaXMubWlwbWFwTGV2ZWxOdW1iZXIgPSBtaXBtYXBMZXZlbE51bWJlcjtcbiAgICB0aGlzLmhkcmlGb3JtYXQgPSBoZHJpRm9ybWF0O1xuXG4gICAgY29uc3QgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLmNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGNvbnN0IFtjdWJlVGV4dHVyZVVpZCwgc2FtcGxlciwgd2lkdGgsIGhlaWdodF0gPSBhd2FpdCBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeS5jcmVhdGVDdWJlVGV4dHVyZUZyb21GaWxlcyhcbiAgICAgIHRoaXMuX19lbmdpbmUsXG4gICAgICBiYXNlVXJsLFxuICAgICAgbWlwbWFwTGV2ZWxOdW1iZXIsXG4gICAgICBpc05hbWVQb3NOZWcsXG4gICAgICBoZHJpRm9ybWF0XG4gICAgKTtcbiAgICB0aGlzLl9fc2V0VGV4dHVyZVJlc291cmNlVWlkKGN1YmVUZXh0dXJlVWlkLCB0aGlzLnVuaXF1ZU5hbWUpO1xuICAgIHRoaXMuX3JlY29tbWVuZGVkVGV4dHVyZVNhbXBsZXIgPSBzYW1wbGVyO1xuICAgIHRoaXMuX3NhbXBsZXJSZXNvdXJjZVVpZCA9IHNhbXBsZXIuX3NhbXBsZXJSZXNvdXJjZVVpZDtcbiAgICB0aGlzLl9fd2lkdGggPSB3aWR0aDtcbiAgICB0aGlzLl9faGVpZ2h0ID0gaGVpZ2h0O1xuXG4gICAgaWYgKHRoaXMuX19lbmdpbmUuZW5naW5lU3RhdGUuY3VycmVudFByb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgdGhpcy5fdGV4dHVyZVZpZXdSZXNvdXJjZVVpZCA9IChjZ0FwaVJlc291cmNlUmVwb3NpdG9yeSBhcyBXZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkpLmNyZWF0ZVRleHR1cmVWaWV3Q3ViZShcbiAgICAgICAgdGhpcy5fdGV4dHVyZVJlc291cmNlVWlkXG4gICAgICApO1xuICAgIH1cbiAgICB0aGlzLl9faXNUZXh0dXJlUmVhZHkgPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIGN1YmUgdGV4dHVyZSBmcm9tIEJhc2lzIGNvbXByZXNzZWQgdGV4dHVyZSBkYXRhLlxuICAgKiBCYXNpcyBpcyBhIHVuaXZlcnNhbCB0ZXh0dXJlIGNvbXByZXNzaW9uIGZvcm1hdCB0aGF0IGNhbiBiZSB0cmFuc2NvZGVkIHRvIHZhcmlvdXMgR1BVIGZvcm1hdHMuXG4gICAqXG4gICAqIEBwYXJhbSB1aW50OEFycmF5IC0gVGhlIEJhc2lzIGNvbXByZXNzZWQgdGV4dHVyZSBkYXRhIGFzIGEgVWludDhBcnJheVxuICAgKiBAcGFyYW0gb3B0aW9ucyAtIE9wdGlvbmFsIHRleHR1cmUgcGFyYW1ldGVycyBmb3IgZmlsdGVyaW5nIGFuZCB3cmFwcGluZ1xuICAgKiBAcGFyYW0gb3B0aW9ucy5tYWdGaWx0ZXIgLSBNYWduaWZpY2F0aW9uIGZpbHRlciAoZGVmYXVsdDogTGluZWFyKVxuICAgKiBAcGFyYW0gb3B0aW9ucy5taW5GaWx0ZXIgLSBNaW5pZmljYXRpb24gZmlsdGVyIChkZWZhdWx0OiBMaW5lYXJNaXBtYXBMaW5lYXIpXG4gICAqIEBwYXJhbSBvcHRpb25zLndyYXBTIC0gVGV4dHVyZSB3cmFwcGluZyBtb2RlIGZvciBTIGNvb3JkaW5hdGUgKGRlZmF1bHQ6IFJlcGVhdClcbiAgICogQHBhcmFtIG9wdGlvbnMud3JhcFQgLSBUZXh0dXJlIHdyYXBwaW5nIG1vZGUgZm9yIFQgY29vcmRpbmF0ZSAoZGVmYXVsdDogUmVwZWF0KVxuICAgKlxuICAgKiBAdGhyb3dzIFdpbGwgbG9nIGFuIGVycm9yIGlmIEJBU0lTIHRyYW5zY29kZXIgaXMgbm90IGF2YWlsYWJsZVxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IGN1YmVUZXh0dXJlID0gbmV3IEN1YmVUZXh0dXJlKCk7XG4gICAqIGNvbnN0IGJhc2lzRGF0YSA9IG5ldyBVaW50OEFycmF5KGJhc2lzRmlsZUJ1ZmZlcik7XG4gICAqIGN1YmVUZXh0dXJlLmxvYWRUZXh0dXJlSW1hZ2VzRnJvbUJhc2lzKGJhc2lzRGF0YSwge1xuICAgKiAgIG1hZ0ZpbHRlcjogVGV4dHVyZVBhcmFtZXRlci5MaW5lYXIsXG4gICAqICAgbWluRmlsdGVyOiBUZXh0dXJlUGFyYW1ldGVyLkxpbmVhck1pcG1hcExpbmVhclxuICAgKiB9KTtcbiAgICogYGBgXG4gICAqL1xuICBsb2FkVGV4dHVyZUltYWdlc0Zyb21CYXNpcyhcbiAgICB1aW50OEFycmF5OiBVaW50OEFycmF5LFxuICAgIHtcbiAgICAgIG1hZ0ZpbHRlciA9IFRleHR1cmVQYXJhbWV0ZXIuTGluZWFyLFxuICAgICAgbWluRmlsdGVyID0gVGV4dHVyZVBhcmFtZXRlci5MaW5lYXJNaXBtYXBMaW5lYXIsXG4gICAgICB3cmFwUyA9IFRleHR1cmVQYXJhbWV0ZXIuUmVwZWF0LFxuICAgICAgd3JhcFQgPSBUZXh0dXJlUGFyYW1ldGVyLlJlcGVhdCxcbiAgICB9ID0ge31cbiAgKSB7XG4gICAgdGhpcy5fX3N0YXJ0ZWRUb0xvYWQgPSB0cnVlO1xuXG4gICAgaWYgKHR5cGVvZiBCQVNJUyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCdGYWlsZWQgdG8gY2FsbCBCQVNJUygpIGZ1bmN0aW9uLiBQbGVhc2UgY2hlY2sgdG8gaW1wb3J0IGJhc2lzX3RyYW5zY29kZXIuanMuJyk7XG4gICAgfVxuXG4gICAgQkFTSVMoKS50aGVuKChiYXNpc1RyYW5zQ29kZXI6IEJhc2lzVHJhbnNjb2RlcikgPT4ge1xuICAgICAgY29uc3QgeyBpbml0aWFsaXplQmFzaXMgfSA9IGJhc2lzVHJhbnNDb2RlcjtcbiAgICAgIGluaXRpYWxpemVCYXNpcygpO1xuXG4gICAgICBjb25zdCBCYXNpc0ZpbGUgPSBiYXNpc1RyYW5zQ29kZXIuQmFzaXNGaWxlO1xuICAgICAgY29uc3QgYmFzaXNGaWxlID0gbmV3IEJhc2lzRmlsZSh1aW50OEFycmF5KTtcblxuICAgICAgaWYgKCFiYXNpc0ZpbGUuc3RhcnRUcmFuc2NvZGluZygpKSB7XG4gICAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCdmYWlsZWQgdG8gc3RhcnQgdHJhbnNjb2RpbmcuJyk7XG4gICAgICAgIGJhc2lzRmlsZS5jbG9zZSgpO1xuICAgICAgICBiYXNpc0ZpbGUuZGVsZXRlKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgd2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgICAgY29uc3QgeyByZXNvdXJjZUhhbmRsZSwgd2lkdGgsIGhlaWdodCB9ID0gd2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkuY3JlYXRlQ3ViZVRleHR1cmVGcm9tQmFzaXMoYmFzaXNGaWxlLCB7XG4gICAgICAgIG1hZ0ZpbHRlcjogbWFnRmlsdGVyLFxuICAgICAgICBtaW5GaWx0ZXI6IG1pbkZpbHRlcixcbiAgICAgICAgd3JhcFM6IHdyYXBTLFxuICAgICAgICB3cmFwVDogd3JhcFQsXG4gICAgICB9KTtcblxuICAgICAgdGhpcy5fX3NldFRleHR1cmVSZXNvdXJjZVVpZChyZXNvdXJjZUhhbmRsZSwgdGhpcy51bmlxdWVOYW1lKTtcbiAgICAgIHRoaXMuX193aWR0aCA9IHdpZHRoO1xuICAgICAgdGhpcy5fX2hlaWdodCA9IGhlaWdodDtcbiAgICAgIHRoaXMuX19pc1RleHR1cmVSZWFkeSA9IHRydWU7XG5cbiAgICAgIGJhc2lzRmlsZS5jbG9zZSgpO1xuICAgICAgYmFzaXNGaWxlLmRlbGV0ZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBzaW1wbGUgMXgxIHBpeGVsIGN1YmUgdGV4dHVyZSB3aXRoIGEgc29saWQgY29sb3IuXG4gICAqIFRoaXMgaXMgdXNlZnVsIGZvciBjcmVhdGluZyBwbGFjZWhvbGRlciB0ZXh0dXJlcyBvciBzb2xpZCBjb2xvciBjdWJlIG1hcHMuXG4gICAqXG4gICAqIEBwYXJhbSByZ2JhU3RyIC0gQ1NTIGNvbG9yIHN0cmluZyBpbiByZ2JhIGZvcm1hdCAoZGVmYXVsdDogJ3JnYmEoMCwwLDAsMSknIGZvciBibGFjaylcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBjdWJlVGV4dHVyZSA9IG5ldyBDdWJlVGV4dHVyZSgpO1xuICAgKiBjdWJlVGV4dHVyZS5sb2FkMXgxVGV4dHVyZSgncmdiYSgyNTUsMjU1LDI1NSwxKScpOyAvLyBXaGl0ZSBjdWJlIHRleHR1cmVcbiAgICogY3ViZVRleHR1cmUubG9hZDF4MVRleHR1cmUoJ3JnYmEoMCwxMjgsMjU1LDEpJyk7ICAgLy8gQmx1ZSBjdWJlIHRleHR1cmVcbiAgICogYGBgXG4gICAqL1xuICBsb2FkMXgxVGV4dHVyZShyZ2JhU3RyID0gJ3JnYmEoMCwwLDAsMSknKSB7XG4gICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgY2FudmFzLndpZHRoID0gMTtcbiAgICBjYW52YXMuaGVpZ2h0ID0gMTtcbiAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICBpZiAoY3R4ID09IG51bGwpIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCdGYWlsZWQgdG8gZ2V0IGNhbnZhcyBjb250ZXh0LicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjdHguZmlsbFN0eWxlID0gcmdiYVN0cjtcbiAgICBjdHguZmlsbFJlY3QoMCwgMCwgMSwgMSk7XG4gICAgY29uc3QgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLmNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5O1xuXG4gICAgY29uc3QgW3Jlc291cmNlVWlkLCBzYW1wbGVyXSA9IGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5LmNyZWF0ZUN1YmVUZXh0dXJlKFxuICAgICAgdGhpcy5fX2VuZ2luZSxcbiAgICAgIDEsXG4gICAgICBbXG4gICAgICAgIHtcbiAgICAgICAgICBwb3NYOiBjYW52YXMsXG4gICAgICAgICAgbmVnWDogY2FudmFzLFxuICAgICAgICAgIHBvc1k6IGNhbnZhcyxcbiAgICAgICAgICBuZWdZOiBjYW52YXMsXG4gICAgICAgICAgcG9zWjogY2FudmFzLFxuICAgICAgICAgIG5lZ1o6IGNhbnZhcyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICAxLFxuICAgICAgMVxuICAgICk7XG4gICAgdGhpcy5fX3NldFRleHR1cmVSZXNvdXJjZVVpZChyZXNvdXJjZVVpZCwgdGhpcy51bmlxdWVOYW1lKTtcbiAgICB0aGlzLl9yZWNvbW1lbmRlZFRleHR1cmVTYW1wbGVyID0gc2FtcGxlcjtcbiAgICB0aGlzLl9zYW1wbGVyUmVzb3VyY2VVaWQgPSBzYW1wbGVyLl9zYW1wbGVyUmVzb3VyY2VVaWQ7XG4gICAgdGhpcy5fX3dpZHRoID0gMTtcbiAgICB0aGlzLl9faGVpZ2h0ID0gMTtcblxuICAgIGlmICh0aGlzLl9fZW5naW5lLmVuZ2luZVN0YXRlLmN1cnJlbnRQcm9jZXNzQXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHUFUpIHtcbiAgICAgIHRoaXMuX3RleHR1cmVWaWV3UmVzb3VyY2VVaWQgPSAoXG4gICAgICAgIGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5IGFzIHVua25vd24gYXMgV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5XG4gICAgICApLmNyZWF0ZVRleHR1cmVWaWV3Q3ViZSh0aGlzLl90ZXh0dXJlUmVzb3VyY2VVaWQpO1xuICAgIH1cblxuICAgIHRoaXMuX19pc1RleHR1cmVSZWFkeSA9IHRydWU7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIGEgY3ViZSB0ZXh0dXJlIGZyb20gdHlwZWQgYXJyYXlzIGNvbnRhaW5pbmcgcmF3IGltYWdlIGRhdGEuXG4gICAqIFRoaXMgbWV0aG9kIGFsbG93cyBjcmVhdGluZyBjdWJlIHRleHR1cmVzIGZyb20gcHJlLXByb2Nlc3NlZCBpbWFnZSBkYXRhIHdpdGggbXVsdGlwbGUgbWlwbWFwIGxldmVscy5cbiAgICpcbiAgICogQHBhcmFtIHR5cGVkQXJyYXlJbWFnZXMgLSBBcnJheSBvZiB0eXBlZCBhcnJheSBvYmplY3RzIGZvciBjdWJlbWFwIHRleHR1cmVzLlxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgRWFjaCBlbGVtZW50IHJlcHJlc2VudHMgYSBtaXBtYXAgbGV2ZWwgKGluZGV4IDAgaXMgdGhlIGJhc2UgbGV2ZWwpLlxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgRWFjaCBvYmplY3QgY29udGFpbnMgc2l4IGZhY2VzOiBwb3NYLCBuZWdYLCBwb3NZLCBuZWdZLCBwb3NaLCBuZWdaLlxuICAgKiBAcGFyYW0gYmFzZUxldmVsV2lkdGggLSBXaWR0aCBvZiB0aGUgYmFzZSBsZXZlbCB0ZXh0dXJlIChtaXBtYXAgbGV2ZWwgMClcbiAgICogQHBhcmFtIGJhc2VMZXZlbEhlaWdodCAtIEhlaWdodCBvZiB0aGUgYmFzZSBsZXZlbCB0ZXh0dXJlIChtaXBtYXAgbGV2ZWwgMClcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBjdWJlVGV4dHVyZSA9IG5ldyBDdWJlVGV4dHVyZSgpO1xuICAgKiBjb25zdCBpbWFnZURhdGEgPSBbe1xuICAgKiAgIHBvc1g6IG5ldyBVaW50OEFycmF5KGltYWdlRGF0YVBvc1gpLFxuICAgKiAgIG5lZ1g6IG5ldyBVaW50OEFycmF5KGltYWdlRGF0YU5lZ1gpLFxuICAgKiAgIHBvc1k6IG5ldyBVaW50OEFycmF5KGltYWdlRGF0YVBvc1kpLFxuICAgKiAgIG5lZ1k6IG5ldyBVaW50OEFycmF5KGltYWdlRGF0YU5lZ1kpLFxuICAgKiAgIHBvc1o6IG5ldyBVaW50OEFycmF5KGltYWdlRGF0YVBvc1opLFxuICAgKiAgIG5lZ1o6IG5ldyBVaW50OEFycmF5KGltYWdlRGF0YU5lZ1opXG4gICAqIH1dO1xuICAgKiBjdWJlVGV4dHVyZS5nZW5lcmF0ZVRleHR1cmVGcm9tVHlwZWRBcnJheXMoaW1hZ2VEYXRhLCA1MTIsIDUxMik7XG4gICAqIGBgYFxuICAgKi9cbiAgZ2VuZXJhdGVUZXh0dXJlRnJvbVR5cGVkQXJyYXlzKFxuICAgIHR5cGVkQXJyYXlJbWFnZXM6IEFycmF5PHtcbiAgICAgIHBvc1g6IFR5cGVkQXJyYXk7XG4gICAgICBuZWdYOiBUeXBlZEFycmF5O1xuICAgICAgcG9zWTogVHlwZWRBcnJheTtcbiAgICAgIG5lZ1k6IFR5cGVkQXJyYXk7XG4gICAgICBwb3NaOiBUeXBlZEFycmF5O1xuICAgICAgbmVnWjogVHlwZWRBcnJheTtcbiAgICB9PixcbiAgICBiYXNlTGV2ZWxXaWR0aDogU2l6ZSxcbiAgICBiYXNlTGV2ZWxIZWlnaHQ6IFNpemVcbiAgKSB7XG4gICAgY29uc3Qgd2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuXG4gICAgY29uc3QgW3Jlc291cmNlSWQsIHNhbXBsZXJdID0gd2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkuY3JlYXRlQ3ViZVRleHR1cmUoXG4gICAgICB0aGlzLl9fZW5naW5lLFxuICAgICAgdHlwZWRBcnJheUltYWdlcy5sZW5ndGgsXG4gICAgICB0eXBlZEFycmF5SW1hZ2VzLFxuICAgICAgYmFzZUxldmVsV2lkdGgsXG4gICAgICBiYXNlTGV2ZWxIZWlnaHRcbiAgICApO1xuICAgIHRoaXMuX3JlY29tbWVuZGVkVGV4dHVyZVNhbXBsZXIgPSBzYW1wbGVyO1xuICAgIHRoaXMuX19zZXRUZXh0dXJlUmVzb3VyY2VVaWQocmVzb3VyY2VJZCwgdGhpcy51bmlxdWVOYW1lKTtcbiAgICB0aGlzLl9fd2lkdGggPSBiYXNlTGV2ZWxXaWR0aDtcbiAgICB0aGlzLl9faGVpZ2h0ID0gYmFzZUxldmVsSGVpZ2h0O1xuXG4gICAgdGhpcy5fX2lzVGV4dHVyZVJlYWR5ID0gdHJ1ZTtcbiAgICB0aGlzLl9fc3RhcnRlZFRvTG9hZCA9IHRydWU7XG4gIH1cblxuICAvKipcbiAgICogSW1wb3J0cyBhbiBleGlzdGluZyBXZWJHTCB0ZXh0dXJlIGRpcmVjdGx5IGludG8gdGhpcyBDdWJlVGV4dHVyZSBpbnN0YW5jZS5cbiAgICogVGhpcyBtZXRob2QgYWxsb3dzIHdyYXBwaW5nIGV4aXN0aW5nIFdlYkdMIHRleHR1cmVzIHdpdGhvdXQgY3JlYXRpbmcgbmV3IG9uZXMuXG4gICAqXG4gICAqIEBwYXJhbSB3ZWJHTFRleHR1cmUgLSBUaGUgZXhpc3RpbmcgV2ViR0wgdGV4dHVyZSBvYmplY3QgdG8gaW1wb3J0XG4gICAqIEBwYXJhbSB3aWR0aCAtIE9wdGlvbmFsIHdpZHRoIG9mIHRoZSB0ZXh0dXJlIChkZWZhdWx0OiAwKVxuICAgKiBAcGFyYW0gaGVpZ2h0IC0gT3B0aW9uYWwgaGVpZ2h0IG9mIHRoZSB0ZXh0dXJlIChkZWZhdWx0OiAwKVxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IGN1YmVUZXh0dXJlID0gbmV3IEN1YmVUZXh0dXJlKCk7XG4gICAqIGNvbnN0IGV4aXN0aW5nVGV4dHVyZSA9IGdsLmNyZWF0ZVRleHR1cmUoKTsgLy8gQXNzdW1lIHRoaXMgaXMgY29uZmlndXJlZFxuICAgKiBjdWJlVGV4dHVyZS5pbXBvcnRXZWJHTFRleHR1cmVEaXJlY3RseShleGlzdGluZ1RleHR1cmUsIDUxMiwgNTEyKTtcbiAgICogYGBgXG4gICAqL1xuICBpbXBvcnRXZWJHTFRleHR1cmVEaXJlY3RseSh3ZWJHTFRleHR1cmU6IFdlYkdMVGV4dHVyZSwgd2lkdGggPSAwLCBoZWlnaHQgPSAwKSB7XG4gICAgdGhpcy5fX3dpZHRoID0gd2lkdGg7XG4gICAgdGhpcy5fX2hlaWdodCA9IGhlaWdodDtcbiAgICBjb25zdCB3ZWJHTFJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgY29uc3QgdGV4dHVyZSA9IHdlYkdMUmVzb3VyY2VSZXBvc2l0b3J5LnNldFdlYkdMVGV4dHVyZURpcmVjdGx5KHdlYkdMVGV4dHVyZSk7XG4gICAgdGhpcy5fX3NldFRleHR1cmVSZXNvdXJjZVVpZCh0ZXh0dXJlLCB0aGlzLnVuaXF1ZU5hbWUpO1xuICAgIHRoaXMuX19zdGFydGVkVG9Mb2FkID0gdHJ1ZTtcbiAgICB0aGlzLl9faXNUZXh0dXJlUmVhZHkgPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZXMgdGhlIGludGVybmFsIHRleHR1cmUgcmVzb3VyY2UgZnJvbSB0aGUgZ3JhcGhpY3MgQVBJLlxuICAgKiBUaGlzIGlzIGEgc3RhdGljIHV0aWxpdHkgbWV0aG9kIHVzZWQgaW50ZXJuYWxseSBmb3IgY2xlYW51cC5cbiAgICpcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHBhcmFtIHRleHR1cmVSZXNvdXJjZVVpZCAtIFRoZSB1bmlxdWUgaWRlbnRpZmllciBvZiB0aGUgdGV4dHVyZSByZXNvdXJjZSB0byBkZWxldGVcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZGVsZXRlSW50ZXJuYWxUZXh0dXJlKGVuZ2luZTogRW5naW5lLCB0ZXh0dXJlUmVzb3VyY2VVaWQ6IENHQVBJUmVzb3VyY2VIYW5kbGUpIHtcbiAgICBjb25zdCBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeSA9IGVuZ2luZS5jZ0FwaVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeS5kZWxldGVUZXh0dXJlKHRleHR1cmVSZXNvdXJjZVVpZCk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIDNEIEFQSSByZXNvdXJjZXMgYXNzb2NpYXRlZCB3aXRoIHRoaXMgY3ViZSB0ZXh0dXJlLlxuICAgKiBUaGlzIG1ldGhvZCByZWxlYXNlcyB0aGUgdGV4dHVyZSBmcm9tIEdQVSBtZW1vcnkgYW5kIHJlc2V0cyB0aGUgdGV4dHVyZSBzdGF0ZS5cbiAgICogQWZ0ZXIgY2FsbGluZyB0aGlzIG1ldGhvZCwgdGhlIHRleHR1cmUgY2Fubm90IGJlIHVzZWQgZm9yIHJlbmRlcmluZyB1bnRpbCByZWxvYWRlZC5cbiAgICovXG4gIGRlc3Ryb3kzREFQSVJlc291cmNlcygpIHtcbiAgICBDdWJlVGV4dHVyZS5fX2RlbGV0ZUludGVybmFsVGV4dHVyZSh0aGlzLl9fZW5naW5lLCB0aGlzLl90ZXh0dXJlUmVzb3VyY2VVaWQpO1xuICAgIHRoaXMuX3RleHR1cmVSZXNvdXJjZVVpZCA9IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkO1xuICAgIHRoaXMuX3NhbXBsZXJSZXNvdXJjZVVpZCA9IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkO1xuICAgIGlmICh0aGlzLl9yZWNvbW1lbmRlZFRleHR1cmVTYW1wbGVyKSB7XG4gICAgICB0aGlzLl9yZWNvbW1lbmRlZFRleHR1cmVTYW1wbGVyLmRlc3Ryb3koKTtcbiAgICB9XG4gICAgdGhpcy5fX2lzVGV4dHVyZVJlYWR5ID0gZmFsc2U7XG4gICAgdGhpcy5fX3N0YXJ0ZWRUb0xvYWQgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbXBsZW1lbnRzIHRoZSBEaXNwb3NhYmxlIGludGVyZmFjZSBmb3IgYXV0b21hdGljIHJlc291cmNlIGNsZWFudXAuXG4gICAqIFRoaXMgbWV0aG9kIGlzIGNhbGxlZCB3aGVuIHVzaW5nIHRoZSAndXNpbmcnIHN0YXRlbWVudCBpbiBUeXBlU2NyaXB0LlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIHVzaW5nIGN1YmVUZXh0dXJlID0gbmV3IEN1YmVUZXh0dXJlKCk7XG4gICAqIC8vIFRleHR1cmUgd2lsbCBiZSBhdXRvbWF0aWNhbGx5IGRpc3Bvc2VkIHdoZW4gZ29pbmcgb3V0IG9mIHNjb3BlXG4gICAqIGBgYFxuICAgKi9cbiAgW1N5bWJvbC5kaXNwb3NlXSgpIHtcbiAgICBMb2dnZXIuZGVmYXVsdC5kZWJ1ZygnW1N5bWJvbC5kaXNwb3NlXSBpcyBjYWxsZWQnKTtcbiAgICB0aGlzLmRlc3Ryb3koKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIHBpeGVsIGRhdGEgZnJvbSBhIHNwZWNpZmljIGZhY2Ugb2YgdGhlIGN1YmUgdGV4dHVyZS5cbiAgICogVGhpcyBvcGVyYXRpb24gcmVhZHMgYmFjayB0aGUgdGV4dHVyZSBkYXRhIGZyb20gR1BVIG1lbW9yeSB0byBDUFUgbWVtb3J5LlxuICAgKlxuICAgKiBAcGFyYW0gZmFjZUluZGV4IC0gSW5kZXggb2YgdGhlIGN1YmUgZmFjZSAoMD0rWCwgMT0tWCwgMj0rWSwgMz0tWSwgND0rWiwgNT0tWilcbiAgICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYSBVaW50OEFycmF5IGNvbnRhaW5pbmcgdGhlIFJHQkEgcGl4ZWwgZGF0YVxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IGN1YmVUZXh0dXJlID0gbmV3IEN1YmVUZXh0dXJlKGVuZ2luZSk7XG4gICAqIC8vIC4uLiBsb2FkIHRleHR1cmUgLi4uXG4gICAqIGNvbnN0IHBvc1hEYXRhID0gYXdhaXQgY3ViZVRleHR1cmUuZ2V0Q3ViZUZhY2VQaXhlbERhdGEoMCk7IC8vIEdldCArWCBmYWNlXG4gICAqIGNvbnN0IG5lZ1lEYXRhID0gYXdhaXQgY3ViZVRleHR1cmUuZ2V0Q3ViZUZhY2VQaXhlbERhdGEoMyk7IC8vIEdldCAtWSBmYWNlXG4gICAqIGBgYFxuICAgKi9cbiAgYXN5bmMgZ2V0Q3ViZUZhY2VQaXhlbERhdGEoZmFjZUluZGV4OiBudW1iZXIpOiBQcm9taXNlPFVpbnQ4QXJyYXk+IHtcbiAgICBpZiAoZmFjZUluZGV4IDwgMCB8fCBmYWNlSW5kZXggPiA1KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZmFjZSBpbmRleDogJHtmYWNlSW5kZXh9LiBNdXN0IGJlIGJldHdlZW4gMCBhbmQgNS5gKTtcbiAgICB9XG4gICAgY29uc3QgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLmNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeS5nZXRDdWJlVGV4dHVyZVBpeGVsRGF0YShcbiAgICAgIHRoaXMuX3RleHR1cmVSZXNvdXJjZVVpZCxcbiAgICAgIHRoaXMuX193aWR0aCxcbiAgICAgIHRoaXMuX19oZWlnaHQsXG4gICAgICBmYWNlSW5kZXhcbiAgICApO1xuICAgIHJldHVybiBkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyB0aGUgcGl4ZWwgZGF0YSBmcm9tIGFsbCBzaXggZmFjZXMgb2YgdGhlIGN1YmUgdGV4dHVyZS5cbiAgICogVGhpcyBvcGVyYXRpb24gcmVhZHMgYmFjayBhbGwgZmFjZSBkYXRhIGZyb20gR1BVIG1lbW9yeSB0byBDUFUgbWVtb3J5LlxuICAgKlxuICAgKiBAcmV0dXJucyBBIHByb21pc2UgdGhhdCByZXNvbHZlcyB0byBhbiBvYmplY3QgY29udGFpbmluZyBVaW50OEFycmF5cyBmb3IgZWFjaCBmYWNlXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgY3ViZVRleHR1cmUgPSBuZXcgQ3ViZVRleHR1cmUoZW5naW5lKTtcbiAgICogLy8gLi4uIGxvYWQgdGV4dHVyZSAuLi5cbiAgICogY29uc3QgYWxsRmFjZXMgPSBhd2FpdCBjdWJlVGV4dHVyZS5nZXRBbGxDdWJlRmFjZVBpeGVsRGF0YSgpO1xuICAgKiBjb25zb2xlLmxvZyhhbGxGYWNlcy5wb3NYKTsgLy8gK1ggZmFjZSBkYXRhXG4gICAqIGNvbnNvbGUubG9nKGFsbEZhY2VzLm5lZ1opOyAvLyAtWiBmYWNlIGRhdGFcbiAgICogYGBgXG4gICAqL1xuICBhc3luYyBnZXRBbGxDdWJlRmFjZVBpeGVsRGF0YSgpOiBQcm9taXNlPHtcbiAgICBwb3NYOiBVaW50OEFycmF5O1xuICAgIG5lZ1g6IFVpbnQ4QXJyYXk7XG4gICAgcG9zWTogVWludDhBcnJheTtcbiAgICBuZWdZOiBVaW50OEFycmF5O1xuICAgIHBvc1o6IFVpbnQ4QXJyYXk7XG4gICAgbmVnWjogVWludDhBcnJheTtcbiAgfT4ge1xuICAgIGNvbnN0IFtwb3NYLCBuZWdYLCBwb3NZLCBuZWdZLCBwb3NaLCBuZWdaXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgIHRoaXMuZ2V0Q3ViZUZhY2VQaXhlbERhdGEoMCksXG4gICAgICB0aGlzLmdldEN1YmVGYWNlUGl4ZWxEYXRhKDEpLFxuICAgICAgdGhpcy5nZXRDdWJlRmFjZVBpeGVsRGF0YSgyKSxcbiAgICAgIHRoaXMuZ2V0Q3ViZUZhY2VQaXhlbERhdGEoMyksXG4gICAgICB0aGlzLmdldEN1YmVGYWNlUGl4ZWxEYXRhKDQpLFxuICAgICAgdGhpcy5nZXRDdWJlRmFjZVBpeGVsRGF0YSg1KSxcbiAgICBdKTtcbiAgICByZXR1cm4geyBwb3NYLCBuZWdYLCBwb3NZLCBuZWdZLCBwb3NaLCBuZWdaIH07XG4gIH1cblxuICAvKipcbiAgICogQ29tcGxldGVseSBkZXN0cm95cyB0aGlzIGN1YmUgdGV4dHVyZSBhbmQgcmVsZWFzZXMgYWxsIGFzc29jaWF0ZWQgcmVzb3VyY2VzLlxuICAgKiBUaGlzIG1ldGhvZCBzaG91bGQgYmUgY2FsbGVkIHdoZW4gdGhlIHRleHR1cmUgaXMgbm8gbG9uZ2VyIG5lZWRlZCB0byBwcmV2ZW50IG1lbW9yeSBsZWFrcy5cbiAgICogQWZ0ZXIgY2FsbGluZyBkZXN0cm95KCksIHRoaXMgdGV4dHVyZSBpbnN0YW5jZSBzaG91bGQgbm90IGJlIHVzZWQuXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuZGVzdHJveTNEQVBJUmVzb3VyY2VzKCk7XG4gICAgdGhpcy51bnJlZ2lzdGVyKCk7XG4gICAgQ3ViZVRleHR1cmUubWFuYWdlZFJlZ2lzdHJ5LnVucmVnaXN0ZXIodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogU3RhdGljIGZhY3RvcnkgbWV0aG9kIHRvIGNyZWF0ZSBhbmQgbG9hZCBhIGN1YmUgdGV4dHVyZSBmcm9tIFVSTCBpbiBvbmUgc3RlcC5cbiAgICogVGhpcyBpcyBhIGNvbnZlbmllbmNlIG1ldGhvZCB0aGF0IGNvbWJpbmVzIGluc3RhbnRpYXRpb24gYW5kIGxvYWRpbmcuXG4gICAqXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gQ29uZmlndXJhdGlvbiBvcHRpb25zIGZvciBsb2FkaW5nIHRoZSBjdWJlIHRleHR1cmVcbiAgICogQHBhcmFtIG9wdGlvbnMuYmFzZVVybCAtIEJhc2UgVVJMIHBhdGggdG8gdGhlIGN1YmUgdGV4dHVyZSBmaWxlc1xuICAgKiBAcGFyYW0gb3B0aW9ucy5taXBtYXBMZXZlbE51bWJlciAtIE51bWJlciBvZiBtaXBtYXAgbGV2ZWxzIHRvIGdlbmVyYXRlXG4gICAqIEBwYXJhbSBvcHRpb25zLmlzTmFtZVBvc05lZyAtIFdoZXRoZXIgdG8gdXNlIHBvc2l0aXZlL25lZ2F0aXZlIG5hbWluZyBjb252ZW50aW9uXG4gICAqIEBwYXJhbSBvcHRpb25zLmhkcmlGb3JtYXQgLSBUaGUgSERSSSBmb3JtYXQgdG8gdXNlIGZvciB0aGUgdGV4dHVyZVxuICAgKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYSBsb2FkZWQgQ3ViZVRleHR1cmUgaW5zdGFuY2VcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBjdWJlVGV4dHVyZSA9IGF3YWl0IEN1YmVUZXh0dXJlLmxvYWRGcm9tVXJsKHtcbiAgICogICBiYXNlVXJsOiAnYXNzZXRzL3NreWJveC9zdW5zZXQnLFxuICAgKiAgIG1pcG1hcExldmVsTnVtYmVyOiAxLFxuICAgKiAgIGlzTmFtZVBvc05lZzogdHJ1ZSxcbiAgICogICBoZHJpRm9ybWF0OiBIZHJpRm9ybWF0LlJHQkVfUE5HXG4gICAqIH0pO1xuICAgKiBgYGBcbiAgICovXG4gIHN0YXRpYyBhc3luYyBsb2FkRnJvbVVybChcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICB7XG4gICAgICBiYXNlVXJsLFxuICAgICAgbWlwbWFwTGV2ZWxOdW1iZXIsXG4gICAgICBpc05hbWVQb3NOZWcsXG4gICAgICBoZHJpRm9ybWF0LFxuICAgIH06IHtcbiAgICAgIGJhc2VVcmw6IHN0cmluZztcbiAgICAgIG1pcG1hcExldmVsTnVtYmVyOiBudW1iZXI7XG4gICAgICBpc05hbWVQb3NOZWc6IGJvb2xlYW47XG4gICAgICBoZHJpRm9ybWF0OiBIZHJpRm9ybWF0RW51bTtcbiAgICB9XG4gICkge1xuICAgIGNvbnN0IGN1YmVUZXh0dXJlID0gbmV3IEN1YmVUZXh0dXJlKGVuZ2luZSk7XG4gICAgYXdhaXQgY3ViZVRleHR1cmUubG9hZFRleHR1cmVJbWFnZXMoe1xuICAgICAgYmFzZVVybCxcbiAgICAgIG1pcG1hcExldmVsTnVtYmVyLFxuICAgICAgaXNOYW1lUG9zTmVnLFxuICAgICAgaGRyaUZvcm1hdCxcbiAgICB9KTtcbiAgICByZXR1cm4gY3ViZVRleHR1cmU7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFHQSxTQUFTLGtCQUF1QztBQUNoRCxTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLHdCQUF3QjtBQUNqQyxTQUFTLGNBQWM7QUFDdkIsU0FBUywrQkFBK0I7QUFFeEMsU0FBUyx1QkFBdUI7QUErQnpCLElBQU0sZUFBTixNQUFNLHFCQUFvQixnQkFBc0M7QUFBQSxFQUFoRTtBQUFBO0FBRUw7QUFBQSxTQUFPLG9CQUFvQjtBQUczQjtBQUFBLFNBQU8sYUFBYSxXQUFXO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFzQnZCQSxHQUF3QixvQkFBeUMsWUFBb0I7QUFDM0YsU0FBSyxzQkFBc0I7QUFDM0IsaUJBQVksZ0JBQWdCLFNBQVMsTUFBTSxFQUFFLG9CQUFvQixRQUFRLEtBQUtDLEdBQVUsV0FBVyxHQUFHLElBQUk7QUFBQSxFQUM1RztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBdUJBLE1BQU0sa0JBQWtCO0FBQUEsSUFDdEI7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFB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QUEsTUFDTCxLQUFLRTtBQUFBLE1BQ0wsS0FBS0M7QUFBQSxNQUNMO0FBQUEsSUFDRjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFpQkEsTUFBTSwwQkFPSDtBQUNELFVBQU0sQ0FBQyxNQUFNLE1BQU0sTUFBTSxNQUFNLE1BQU0sSUFBSSxJQUFJLE1BQU0sUUFBUSxJQUFJO0FBQUEsTUFDN0QsS0FBSyxxQkFBcUIsQ0FBQztBQUFBLE1BQzNCLEtBQUsscUJBQXFCLENBQUM7QUFBQSxNQUMzQixLQUFLLHFCQUFxQixDQUFDO0FBQUEsTUFDM0IsS0FBSyxxQkFBcUIsQ0FBQztBQUFBLE1BQzNCLEtBQUsscUJBQXFCLENBQUM7QUFBQSxNQUMzQixLQUFLLHFCQUFxQixDQUFDO0FBQUEsSUFDN0IsQ0FBQztBQUNELFdBQU8sRUFBRSxNQUFNLE1BQU0sTUFBTSxNQUFNLE1BQU0sS0FBSztBQUFBLEVBQzlDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsVUFBVTtBQUNSLFNBQUssc0JBQXNCO0FBQzNCLFNBQUssV0FBVztBQUNoQixpQkFBWSxnQkFBZ0IsV0FBVyxJQUFJO0FBQUEsRUFDN0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQXVCQSxhQUFhLFlBQ1gsUUFDQTtBQUFBLElBQ0U7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGLEdBTUE7QUFDQSxVQUFNLGNBQWMsSUFBSSxhQUFZLE1BQU07QUFDMUMsVUFBTSxZQUFZLGtCQUFrQjtBQUFBLE1BQ2xDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRixDQUFDO0FBQ0QsV0FBTztBQUFBLEVBQ1Q7QUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBM2NhLGFBV0ksa0JBQ2IsSUFBSSxxQkFBaUQsWUFBVTtBQUM3RCxTQUFPLFFBQVE7QUFBQSxJQUNiLDhCQUE4QixPQUFPLFVBQVU7QUFBQSxFQUNqRDtBQUNBLGVBQVlFLEdBQXdCLE9BQU8sUUFBUSxPQUFPLGtCQUFrQjtBQUM5RSxDQUFDO0FBakJFLElBQU0sY0FBTjsiLAogICJuYW1lcyI6IFsiX19zZXRUZXh0dXJlUmVzb3VyY2VVaWQiLCAiX19lbmdpbmUiLCAiX19zdGFydGVkVG9Mb2FkIiwgIl9fd2lkdGgiLCAiX19oZWlnaHQiLCAiX19pc1RleHR1cmVSZWFkeSIsICJfX2RlbGV0ZUludGVybmFsVGV4dHVyZSJdCn0K
