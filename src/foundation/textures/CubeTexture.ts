import { AbstractTexture } from './AbstractTexture';
import { HdriFormat, type HdriFormatEnum } from '../definitions/HdriFormat';
import { CGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import type { BasisTranscoder, BASIS } from '../../types/BasisTexture';
import { TextureParameter } from '../definitions/TextureParameter';
import type { CGAPIResourceHandle, Size, TypedArray } from '../../types/CommonTypes';
import { SystemState } from '../system/SystemState';
import { ProcessApproach } from '../definitions/ProcessApproach';
import type { WebGpuResourceRepository } from '../../webgpu/WebGpuResourceRepository';
import { Logger } from '../misc/Logger';

declare const BASIS: BASIS;

type FinalizationRegistryObject = {
  textureResourceUid: CGAPIResourceHandle;
  uniqueName: string;
};

/**
 * A cube texture class that represents a cubemap texture for 3D rendering.
 * Cube textures are commonly used for environment mapping, skyboxes, and reflection mapping.
 * This class extends AbstractTexture and provides functionality to load cube textures from various sources
 * including files, Basis compressed textures, and typed arrays.
 *
 * @example
 * ```typescript
 * // Load cube texture from files
 * const cubeTexture = await CubeTexture.loadFromUrl({
 *   baseUrl: 'path/to/cubemap',
 *   mipmapLevelNumber: 1,
 *   isNamePosNeg: true,
 *   hdriFormat: HdriFormat.LDR_SRGB
 * });
 *
 * // Create a simple 1x1 cube texture
 * const simpleCube = new CubeTexture();
 * simpleCube.load1x1Texture('rgba(255,0,0,1)');
 * ```
 */
export class CubeTexture extends AbstractTexture implements Disposable {
  /** The number of mipmap levels for this cube texture */
  public mipmapLevelNumber = 1;

  /** The HDRI format used for this cube texture */
  public hdriFormat = HdriFormat.LDR_SRGB;

  /**
   * Registry for automatic cleanup of cube texture resources when objects are garbage collected.
   * This helps prevent memory leaks by automatically releasing WebGL/WebGPU resources.
   */
  private static managedRegistry: FinalizationRegistry<FinalizationRegistryObject> =
    new FinalizationRegistry<FinalizationRegistryObject>(texObj => {
      Logger.info(
        `WebGL/WebGPU cube texture "${texObj.uniqueName}" was automatically released along with GC. But explicit release is recommended.`
      );
      CubeTexture.__deleteInternalTexture(texObj.textureResourceUid);
    });

  /**
   * Creates a new CubeTexture instance.
   * The texture is not loaded until one of the load methods is called.
   */
  constructor() {
    super();
  }

  /**
   * Sets the texture resource UID and registers the texture for automatic cleanup.
   * This is an internal method used by the loading methods.
   *
   * @param textureResourceUid - The unique identifier for the texture resource
   * @param uniqueName - A unique name for the texture used in logging
   * @private
   */
  private __setTextureResourceUid(textureResourceUid: CGAPIResourceHandle, uniqueName: string) {
    this._textureResourceUid = textureResourceUid;
    CubeTexture.managedRegistry.register(this, { textureResourceUid, uniqueName }, this);
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
    hdriFormat,
  }: {
    baseUrl: string;
    mipmapLevelNumber: number;
    isNamePosNeg: boolean;
    hdriFormat: HdriFormatEnum;
  }) {
    this.__startedToLoad = true;

    this.mipmapLevelNumber = mipmapLevelNumber;
    this.hdriFormat = hdriFormat;

    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    const [cubeTextureUid, sampler] = await cgApiResourceRepository.createCubeTextureFromFiles(
      baseUrl,
      mipmapLevelNumber,
      isNamePosNeg,
      hdriFormat
    );
    this.__setTextureResourceUid(cubeTextureUid, this.uniqueName);
    this._recommendedTextureSampler = sampler;
    this._samplerResourceUid = sampler._samplerResourceUid;

    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = (cgApiResourceRepository as WebGpuResourceRepository).createTextureViewCube(
        this._textureResourceUid
      );
    }
    this.__isTextureReady = true;
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
  loadTextureImagesFromBasis(
    uint8Array: Uint8Array,
    {
      magFilter = TextureParameter.Linear,
      minFilter = TextureParameter.LinearMipmapLinear,
      wrapS = TextureParameter.Repeat,
      wrapT = TextureParameter.Repeat,
    } = {}
  ) {
    this.__startedToLoad = true;

    if (typeof BASIS === 'undefined') {
      Logger.error('Failed to call BASIS() function. Please check to import basis_transcoder.js.');
    }

    BASIS().then((basisTransCoder: BasisTranscoder) => {
      const { initializeBasis } = basisTransCoder;
      initializeBasis();

      const BasisFile = basisTransCoder.BasisFile;
      const basisFile = new BasisFile(uint8Array);

      if (!basisFile.startTranscoding()) {
        Logger.error('failed to start transcoding.');
        basisFile.close();
        basisFile.delete();
        return;
      }

      const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
      const texture = webGLResourceRepository.createCubeTextureFromBasis(basisFile, {
        magFilter: magFilter,
        minFilter: minFilter,
        wrapS: wrapS,
        wrapT: wrapT,
      });

      this.__setTextureResourceUid(texture, this.uniqueName);
      this.__isTextureReady = true;

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
  load1x1Texture(rgbaStr = 'rgba(0,0,0,1)') {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = rgbaStr;
    ctx.fillRect(0, 0, 1, 1);
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();

    const [resourceUid, sampler] = cgApiResourceRepository.createCubeTexture(
      1,
      [
        {
          posX: canvas,
          negX: canvas,
          posY: canvas,
          negY: canvas,
          posZ: canvas,
          negZ: canvas,
        },
      ],
      1,
      1
    );
    this.__setTextureResourceUid(resourceUid, this.uniqueName);
    this._recommendedTextureSampler = sampler;
    this._samplerResourceUid = sampler._samplerResourceUid;

    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = (
        cgApiResourceRepository as unknown as WebGpuResourceRepository
      ).createTextureViewCube(this._textureResourceUid);
    }

    this.__isTextureReady = true;
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
  generateTextureFromTypedArrays(
    typedArrayImages: Array<{
      posX: TypedArray;
      negX: TypedArray;
      posY: TypedArray;
      negY: TypedArray;
      posZ: TypedArray;
      negZ: TypedArray;
    }>,
    baseLevelWidth: Size,
    baseLevelHeight: Size
  ) {
    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();

    const [resourceId, sampler] = webGLResourceRepository.createCubeTexture(
      typedArrayImages.length,
      typedArrayImages,
      baseLevelWidth,
      baseLevelHeight
    );
    this._recommendedTextureSampler = sampler;
    this.__setTextureResourceUid(resourceId, this.uniqueName);

    this.__isTextureReady = true;
    this.__startedToLoad = true;
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
  importWebGLTextureDirectly(webGLTexture: WebGLTexture, width = 0, height = 0) {
    this.__width = width;
    this.__height = height;
    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const texture = webGLResourceRepository.setWebGLTextureDirectly(webGLTexture);
    this.__setTextureResourceUid(texture, this.uniqueName);
    this.__startedToLoad = true;
    this.__isTextureReady = true;
  }

  /**
   * Deletes the internal texture resource from the graphics API.
   * This is a static utility method used internally for cleanup.
   *
   * @param textureResourceUid - The unique identifier of the texture resource to delete
   * @private
   */
  private static __deleteInternalTexture(textureResourceUid: CGAPIResourceHandle) {
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    cgApiResourceRepository.deleteTexture(textureResourceUid);
  }

  /**
   * Destroys the 3D API resources associated with this cube texture.
   * This method releases the texture from GPU memory and resets the texture state.
   * After calling this method, the texture cannot be used for rendering until reloaded.
   */
  destroy3DAPIResources() {
    CubeTexture.__deleteInternalTexture(this._textureResourceUid);
    this._textureResourceUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.__isTextureReady = false;
    this.__startedToLoad = false;
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
    Logger.debug('[Symbol.dispose] is called');
    this.destroy();
  }

  /**
   * Completely destroys this cube texture and releases all associated resources.
   * This method should be called when the texture is no longer needed to prevent memory leaks.
   * After calling destroy(), this texture instance should not be used.
   */
  destroy() {
    this.destroy3DAPIResources();
    this.unregister();
    CubeTexture.managedRegistry.unregister(this);
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
  static async loadFromUrl({
    baseUrl,
    mipmapLevelNumber,
    isNamePosNeg,
    hdriFormat,
  }: {
    baseUrl: string;
    mipmapLevelNumber: number;
    isNamePosNeg: boolean;
    hdriFormat: HdriFormatEnum;
  }) {
    const cubeTexture = new CubeTexture();
    await cubeTexture.loadTextureImages({
      baseUrl,
      mipmapLevelNumber,
      isNamePosNeg,
      hdriFormat,
    });
    return cubeTexture;
  }
}
