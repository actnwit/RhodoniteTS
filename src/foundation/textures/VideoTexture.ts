import { PixelFormat, PixelFormatEnum } from '../definitions/PixelFormat';
import { ComponentType, ComponentTypeEnum } from '../definitions/ComponentType';
import { TextureParameter, TextureParameterEnum } from '../definitions/TextureParameter';
import { AbstractTexture } from './AbstractTexture';
import { CGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import { Size } from '../../types/CommonTypes';
import { DataUtil } from '../misc/DataUtil';
import { TextureFormat } from '../definitions/TextureFormat';

export type VideoTextureArguments = {
  level: number;
  internalFormat: PixelFormatEnum;
  format: PixelFormatEnum;
  type: ComponentTypeEnum;
  magFilter: TextureParameterEnum;
  minFilter: TextureParameterEnum;
  wrapS: TextureParameterEnum;
  wrapT: TextureParameterEnum;
  generateMipmap: boolean;
  anisotropy: boolean;
  isPremultipliedAlpha?: boolean;
  mutedAutoPlay: boolean;
  playButtonDomElement?: HTMLElement;
};

export class VideoTexture extends AbstractTexture {
  private __imageData?: ImageData;
  public autoResize = true;
  public autoDetectTransparency = false;
  private static __loadedBasisFunc = false;
  private static __basisLoadPromise?: Promise<void>;
  #htmlVideoElement?: HTMLVideoElement;

  constructor() {
    super();
  }

  private __getResizedCanvas(image: HTMLImageElement, maxSize: Size) {
    const canvas = document.createElement('canvas');
    const potWidth = DataUtil.getNearestPowerOfTwo(image.width);
    const potHeight = DataUtil.getNearestPowerOfTwo(image.height);

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

    const ctx = canvas.getContext('2d')!;
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

  generateTextureFromVideo(
    video: HTMLVideoElement,
    {
      level = 0,
      internalFormat = TextureFormat.RGBA8,
      format = PixelFormat.RGBA,
      type = ComponentType.UnsignedByte,
      generateMipmap = false,
      mutedAutoPlay = true,
    } = {}
  ) {
    this.__startedToLoad = true;
    this.#htmlVideoElement = video;
    if (mutedAutoPlay) {
      video.autoplay = true;
      video.muted = true;
    }
    const img = video;

    this.__width = img.videoWidth;
    this.__height = img.videoHeight;

    const webGLResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    const textureHandle = webGLResourceRepository.createTextureFromImageBitmapData(img, {
      level: level,
      internalFormat: internalFormat,
      width: this.__width,
      height: this.__height,
      border: 0,
      format: format,
      type: type,
      generateMipmap: generateMipmap,
    });

    this._textureResourceUid = textureHandle;
    this.__isTextureReady = true;
    this.__uri = video.src;

    AbstractTexture.__textureMap.set(textureHandle, this);
  }

  generateTextureFromUri(
    videoUri: string,
    {
      level = 0,
      internalFormat = TextureFormat.RGBA8,
      format = PixelFormat.RGBA,
      type = ComponentType.UnsignedByte,
      generateMipmap = false,
      mutedAutoPlay = true,
      playButtonDomElement = undefined,
    } = {}
  ) {
    this.__uri = videoUri;
    this.__startedToLoad = true;
    return new Promise((resolve, reject) => {
      const button = playButtonDomElement as HTMLButtonElement | undefined;

      const setupTexture = () => {
        this.__width = video.videoWidth;
        this.__height = video.videoHeight;

        const webGLResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
        const textureHandle = webGLResourceRepository.createTextureFromImageBitmapData(video, {
          level: level,
          internalFormat: internalFormat,
          width: this.__width,
          height: this.__height,
          border: 0,
          format: format,
          type: type,
          generateMipmap: generateMipmap,
        });

        this._textureResourceUid = textureHandle;
        this.__isTextureReady = true;

        resolve();
      };

      button?.addEventListener(
        'click',
        () => {
          setupTexture();
          video.play();
        },
        true
      );

      const video = document.createElement('video') as HTMLVideoElement;
      video.crossOrigin = 'anonymous';
      video.setAttribute('playsinline', 'playsinline');
      if (mutedAutoPlay) {
        video.autoplay = true;
        video.muted = true;
      }
      video.preload = 'auto';
      this.#htmlVideoElement = video;

      video.addEventListener(
        'canplaythrough',
        () => {
          setupTexture();
          video.play();
        },
        true
      );

      video.addEventListener(
        'ended',
        () => {
          video.play();
        },
        true
      );

      video.src = videoUri;
    }) as Promise<void>;
  }

  updateTexture() {
    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    if (this.__isTextureReady && this.#htmlVideoElement) {
      webGLResourceRepository.updateTexture(this._textureResourceUid, this.#htmlVideoElement, {
        level: 0,
        xoffset: 0,
        yoffset: 0,
        width: this.__width,
        height: this.__height,
        format: PixelFormat.RGBA,
        type: ComponentType.UnsignedByte,
      });
    }
  }

  getCurrentFramePixelData() {
    let pixel: Uint8Array | undefined = undefined;
    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    if (this.__isTextureReady && this.#htmlVideoElement) {
      pixel = webGLResourceRepository.getPixelDataFromTexture(
        this._textureResourceUid,
        0,
        0,
        this.width,
        this.height
      );
    }
    return [pixel, this.width, this.height];
  }

  set playbackRate(value) {
    if (this.#htmlVideoElement) {
      this.#htmlVideoElement.playbackRate = value;
    }
  }

  get playbackRate() {
    const playbackRate = this.#htmlVideoElement?.playbackRate;
    return playbackRate ?? 1;
  }

  play() {
    this.#htmlVideoElement?.play();
  }

  pause() {
    this.#htmlVideoElement!.pause();
  }
}
