import { PixelFormat, type PixelFormatEnum } from '../definitions/PixelFormat';
import { ComponentType, type ComponentTypeEnum } from '../definitions/ComponentType';
import { TextureParameter, type TextureParameterEnum } from '../definitions/TextureParameter';
import { AbstractTexture } from './AbstractTexture';
import { CGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import type { Size } from '../../types/CommonTypes';
import { DataUtil } from '../misc/DataUtil';
import { TextureFormat } from '../definitions/TextureFormat';

/**
 * Configuration options for VideoTexture creation and processing.
 */
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

/**
 * A texture class that handles video content as texture data.
 * Extends AbstractTexture to provide video-specific functionality including
 * video loading, playback control, and real-time texture updates.
 *
 * @example
 * ```typescript
 * const videoTexture = new VideoTexture();
 * await videoTexture.generateTextureFromUri('path/to/video.mp4');
 * videoTexture.play();
 * ```
 */
export class VideoTexture extends AbstractTexture {
  private __imageData?: ImageData;
  public autoResize = true;
  public autoDetectTransparency = false;
  private static __loadedBasisFunc = false;
  private static __basisLoadPromise?: Promise<void>;
  #htmlVideoElement?: HTMLVideoElement;

  /**
   * Creates a new VideoTexture instance.
   */
  constructor() {
    super();
  }

  /**
   * Creates a resized canvas from an image, maintaining aspect ratio and ensuring power-of-two dimensions.
   * Optionally detects transparency in the image data.
   *
   * @param image - The source image to resize
   * @param maxSize - Maximum size constraint for the output canvas
   * @returns A canvas element containing the resized image
   * @private
   */
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

  /**
   * Generates a texture from an existing HTMLVideoElement.
   * Sets up the video element for playback and creates the corresponding WebGL texture.
   *
   * @param video - The HTMLVideoElement to use as texture source
   * @param options - Configuration options for texture generation
   * @param options.level - Mipmap level (default: 0)
   * @param options.internalFormat - Internal pixel format (default: RGBA8)
   * @param options.format - Pixel format (default: RGBA)
   * @param options.type - Component type (default: UnsignedByte)
   * @param options.generateMipmap - Whether to generate mipmaps (default: false)
   * @param options.mutedAutoPlay - Whether to enable muted autoplay (default: true)
   *
   * @example
   * ```typescript
   * const video = document.getElementById('myVideo') as HTMLVideoElement;
   * await videoTexture.generateTextureFromVideo(video, {
   *   generateMipmap: true,
   *   mutedAutoPlay: false
   * });
   * ```
   */
  async generateTextureFromVideo(
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
    const textureHandle = await webGLResourceRepository.createTextureFromImageBitmapData(img, {
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
  }

  /**
   * Generates a texture from a video file URI.
   * Creates a video element, loads the specified video, and sets up texture generation.
   * Supports both automatic playback and manual playback via a play button.
   *
   * @param videoUri - URI of the video file to load
   * @param options - Configuration options for texture generation
   * @param options.level - Mipmap level (default: 0)
   * @param options.internalFormat - Internal pixel format (default: RGBA8)
   * @param options.format - Pixel format (default: RGBA)
   * @param options.type - Component type (default: UnsignedByte)
   * @param options.generateMipmap - Whether to generate mipmaps (default: false)
   * @param options.mutedAutoPlay - Whether to enable muted autoplay (default: true)
   * @param options.playButtonDomElement - Optional button element to trigger manual playback
   * @returns Promise that resolves when the texture is ready
   *
   * @example
   * ```typescript
   * const playButton = document.getElementById('playBtn');
   * await videoTexture.generateTextureFromUri('video.mp4', {
   *   mutedAutoPlay: false,
   *   playButtonDomElement: playButton
   * });
   * ```
   */
  async generateTextureFromUri(
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
    return new Promise(async (resolve, reject) => {
      const button = playButtonDomElement as HTMLButtonElement | undefined;

      const setupTexture = async () => {
        this.__width = video.videoWidth;
        this.__height = video.videoHeight;

        const webGLResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
        const textureHandle = await webGLResourceRepository.createTextureFromImageBitmapData(video, {
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

  /**
   * Updates the texture with the current video frame.
   * Should be called regularly (e.g., in a render loop) to keep the texture
   * synchronized with the video playback.
   *
   * @example
   * ```typescript
   * // In render loop
   * function render() {
   *   videoTexture.updateTexture();
   *   // ... other rendering code
   *   requestAnimationFrame(render);
   * }
   * ```
   */
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

  /**
   * Retrieves the pixel data of the current video frame.
   * Useful for image processing or analysis of video content.
   *
   * @returns A tuple containing [pixelData, width, height] where pixelData is a Uint8Array
   *          of RGBA values, or [undefined, width, height] if texture is not ready
   *
   * @example
   * ```typescript
   * const [pixels, width, height] = videoTexture.getCurrentFramePixelData();
   * if (pixels) {
   *   // Process pixel data
   *   console.log(`Frame size: ${width}x${height}, pixels: ${pixels.length}`);
   * }
   * ```
   */
  getCurrentFramePixelData() {
    let pixel: Uint8Array | undefined = undefined;
    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    if (this.__isTextureReady && this.#htmlVideoElement) {
      pixel = webGLResourceRepository.getPixelDataFromTexture(this._textureResourceUid, 0, 0, this.width, this.height);
    }
    return [pixel, this.width, this.height];
  }

  /**
   * Sets the playback rate of the video.
   *
   * @param value - Playback rate multiplier (1.0 = normal speed, 2.0 = double speed, 0.5 = half speed)
   *
   * @example
   * ```typescript
   * videoTexture.playbackRate = 2.0; // Play at double speed
   * ```
   */
  set playbackRate(value) {
    if (this.#htmlVideoElement) {
      this.#htmlVideoElement.playbackRate = value;
    }
  }

  /**
   * Gets the current playback rate of the video.
   *
   * @returns The current playback rate, or 1 if no video element is available
   *
   * @example
   * ```typescript
   * const currentRate = videoTexture.playbackRate;
   * console.log(`Current playback rate: ${currentRate}`);
   * ```
   */
  get playbackRate() {
    const playbackRate = this.#htmlVideoElement?.playbackRate;
    return playbackRate ?? 1;
  }

  /**
   * Starts or resumes video playback.
   *
   * @example
   * ```typescript
   * videoTexture.play();
   * ```
   */
  play() {
    this.#htmlVideoElement?.play();
  }

  /**
   * Pauses video playback.
   *
   * @example
   * ```typescript
   * videoTexture.pause();
   * ```
   */
  pause() {
    this.#htmlVideoElement!.pause();
  }
}
