import { AbstractTexture } from './AbstractTexture';
import { HdriFormat } from '../definitions/HdriFormat';
import { CGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import { BasisTranscoder, BASIS } from '../../types/BasisTexture';
import { TextureParameter } from '../definitions/TextureParameter';
import { CGAPIResourceHandle, Size, TypedArray } from '../../types/CommonTypes';
import { SystemState } from '../system/SystemState';
import { ProcessApproach } from '../definitions/ProcessApproach';
import { WebGpuResourceRepository } from '../../webgpu/WebGpuResourceRepository';
import { Logger } from '../misc/Logger';

declare const BASIS: BASIS;

type FinalizationRegistryObject = {
  textureResourceUid: CGAPIResourceHandle;
  uniqueName: string;
};

export class CubeTexture extends AbstractTexture implements Disposable {
  public baseUriToLoad?: string;
  public mipmapLevelNumber = 1;
  public hdriFormat = HdriFormat.LDR_SRGB;
  public isNamePosNeg = false;
  private __onTextureLoadedArray: Array<() => void> = [];

  private static managedRegistry: FinalizationRegistry<FinalizationRegistryObject> =
    new FinalizationRegistry<FinalizationRegistryObject>((texObj) => {
      Logger.info(
        `WebGL/WebGPU cube texture "${texObj.uniqueName}" was automatically released along with GC. But explicit release is recommended.`
      );
      CubeTexture.__deleteInternalTexture(texObj.textureResourceUid);
    });

  constructor() {
    super();
  }

  private __setTextureResourceUid(textureResourceUid: CGAPIResourceHandle, uniqueName: string) {
    this._textureResourceUid = textureResourceUid;
    CubeTexture.managedRegistry.register(this, { textureResourceUid, uniqueName }, this);
  }

  registerOnTextureLoaded(func: () => void) {
    this.__onTextureLoadedArray.push(func);
  }

  async loadTextureImages() {
    this.__startedToLoad = true;
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    const [resourceUid, sampler] = await cgApiResourceRepository.createCubeTextureFromFiles(
      this.baseUriToLoad!,
      this.mipmapLevelNumber!,
      this.isNamePosNeg,
      this.hdriFormat
    );
    this._recommendedTextureSampler = sampler;
    this.__setTextureResourceUid(resourceUid, this.uniqueName);

    this._samplerResourceUid = sampler._samplerResourceUid;

    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = (
        cgApiResourceRepository as WebGpuResourceRepository
      ).createTextureViewCube(this._textureResourceUid);
    }

    this.__isTextureReady = true;
  }

  loadTextureImagesAsync() {
    return new Promise<void>((resolve) => {
      this.__startedToLoad = true;
      const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
      cgApiResourceRepository
        .createCubeTextureFromFiles(
          this.baseUriToLoad!,
          this.mipmapLevelNumber!,
          this.isNamePosNeg,
          this.hdriFormat
        )
        .then(([cubeTextureUid, sampler]) => {
          this.__setTextureResourceUid(cubeTextureUid, this.uniqueName);
          this._recommendedTextureSampler = sampler;
          this._samplerResourceUid = sampler._samplerResourceUid;

          if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
            this._textureViewResourceUid = (
              cgApiResourceRepository as WebGpuResourceRepository
            ).createTextureViewCube(this._textureResourceUid);
          }
        })
        .then(() => {
          this.__isTextureReady = true;
          this.__onTextureLoadedArray.forEach((func) => {
            func();
          });
          this.__onTextureLoadedArray = [];
          resolve();
        });
    });
  }

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
   * Generate cubemap texture object from typed array of cubemap images
   * @param typedArrays Array of typed array object for cubemap textures. The nth element is the nth mipmap reduction level(level 0 is the base image level).
   * @param width Texture width of the base image level texture
   * @param height Texture height of the base image level texture
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

  importWebGLTextureDirectly(webGLTexture: WebGLTexture, width = 0, height = 0) {
    this.__width = width;
    this.__height = height;
    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const texture = webGLResourceRepository.setWebGLTextureDirectly(webGLTexture);
    this.__setTextureResourceUid(texture, this.uniqueName);
    this.__startedToLoad = true;
    this.__isTextureReady = true;
  }

  private static __deleteInternalTexture(textureResourceUid: CGAPIResourceHandle) {
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    cgApiResourceRepository.deleteTexture(textureResourceUid);
  }

  destroy3DAPIResources() {
    CubeTexture.__deleteInternalTexture(this._textureResourceUid);
    this._textureResourceUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.__isTextureReady = false;
    this.__startedToLoad = false;
  }

  [Symbol.dispose]() {
    Logger.debug('[Symbol.dispose] is called');
    this.destroy();
  }

  destroy() {
    this.destroy3DAPIResources();
    this.unregister();
    CubeTexture.managedRegistry.unregister(this);
  }
}
