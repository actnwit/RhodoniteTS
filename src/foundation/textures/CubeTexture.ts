import AbstractTexture from './AbstractTexture';
import {HdriFormat} from '../definitions/HdriFormat';
import CGAPIResourceRepository from '../renderer/CGAPIResourceRepository';
import {BasisTranscoder, BASIS} from '../../types/BasisTexture';
import {TextureParameter} from '../definitions/TextureParameter';
import {Size, TypedArray} from '../../types/CommonTypes';

declare const BASIS: BASIS;

export default class CubeTexture extends AbstractTexture {
  public baseUriToLoad?: string;
  public mipmapLevelNumber = 1;
  public hdriFormat = HdriFormat.LDR_SRGB;
  public isNamePosNeg = false;
  constructor() {
    super();
  }

  async loadTextureImages() {
    this.__startedToLoad = true;
    const webGLResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();
    this.cgApiResourceUid =
      await webGLResourceRepository.createCubeTextureFromFiles(
        this.baseUriToLoad!,
        this.mipmapLevelNumber!,
        this.isNamePosNeg,
        this.hdriFormat
      );
    this.__isTextureReady = true;
  }

  loadTextureImagesAsync() {
    this.__startedToLoad = true;
    const webGLResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();
    webGLResourceRepository
      .createCubeTextureFromFiles(
        this.baseUriToLoad!,
        this.mipmapLevelNumber!,
        this.isNamePosNeg,
        this.hdriFormat
      )
      .then(cubeTextureUid => {
        this.cgApiResourceUid = cubeTextureUid;
      })
      .then(() => {
        this.__isTextureReady = true;
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
      console.error(
        'Failed to call BASIS() function. Please check to import basis_transcoder.js.'
      );
    }

    BASIS().then((basisTransCoder: BasisTranscoder) => {
      const {initializeBasis} = basisTransCoder;
      initializeBasis();

      const BasisFile = basisTransCoder.BasisFile;
      const basisFile = new BasisFile(uint8Array);

      if (!basisFile.startTranscoding()) {
        console.error('failed to start transcoding.');
        basisFile.close();
        basisFile.delete();
        return;
      }

      const webGLResourceRepository =
        CGAPIResourceRepository.getWebGLResourceRepository();
      const texture = webGLResourceRepository.createCubeTextureFromBasis(
        basisFile,
        {
          magFilter: magFilter,
          minFilter: minFilter,
          wrapS: wrapS,
          wrapT: wrapT,
        }
      );

      this.cgApiResourceUid = texture;
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
    const webGLResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();

    this.cgApiResourceUid = webGLResourceRepository.createCubeTexture(
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
    const webGLResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();

    this.cgApiResourceUid = webGLResourceRepository.createCubeTexture(
      typedArrayImages.length,
      typedArrayImages,
      baseLevelWidth,
      baseLevelHeight
    );

    this.__isTextureReady = true;
    this.__startedToLoad = true;
    AbstractTexture.__textureMap.set(this.cgApiResourceUid, this);
  }

  importWebGLTextureDirectly(
    webGLTexture: WebGLTexture,
    width = 0,
    height = 0
  ) {
    this.__width = width;
    this.__height = height;
    const webGLResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();
    const texture =
      webGLResourceRepository.setWebGLTextureDirectly(webGLTexture);
    this.cgApiResourceUid = texture;
    this.__startedToLoad = true;
    this.__isTextureReady = true;
    AbstractTexture.__textureMap.set(texture, this);
  }
}
