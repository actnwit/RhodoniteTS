var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);

// src/foundation/textures/VideoTexture.ts
import { ComponentType } from "../definitions/ComponentType.js";
import { PixelFormat } from "../definitions/PixelFormat.js";
import { TextureFormat } from "../definitions/TextureFormat.js";
import { DataUtil } from "../misc/DataUtil.js";
import { AbstractTexture } from "./AbstractTexture.js";
var _htmlVideoElement;
var VideoTexture = class extends AbstractTexture {
  constructor() {
    super(...arguments);
    this.autoResize = true;
    this.autoDetectTransparency = false;
    __privateAdd(this, _htmlVideoElement);
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
  AC(image, maxSize) {
    const canvas = document.createElement("canvas");
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
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, dstWidth, dstHeight);
    if (this.autoDetectTransparency) {
      this.zC = ctx.getImageData(0, 0, dstWidth, dstHeight);
      for (let y = 0; y < dstHeight; y++) {
        for (let x = 0; x < dstWidth; x++) {
          const alpha = this.zC.data[(x + y * dstWidth) * 4 + 3];
          if (alpha < 1) {
            this.UB = true;
            return canvas;
          }
        }
      }
      this.UB = false;
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
  async generateTextureFromVideo(video, {
    _level = 0,
    internalFormat = TextureFormat.RGBA8,
    format = PixelFormat.RGBA,
    type = ComponentType.UnsignedByte,
    generateMipmap = false,
    mutedAutoPlay = true
  } = {}) {
    this.WB = true;
    __privateSet(this, _htmlVideoElement, video);
    if (mutedAutoPlay) {
      video.autoplay = true;
      video.muted = true;
    }
    const img = video;
    this.km = img.videoWidth;
    this.iy = img.videoHeight;
    const webGLResourceRepository = this.c.webglResourceRepository;
    const textureHandle = await webGLResourceRepository.createTextureFromImageBitmapData(img, {
      // level: level,
      internalFormat,
      width: this.km,
      height: this.iy,
      // border: 0,
      format,
      type,
      generateMipmap
    });
    this._textureResourceUid = textureHandle;
    this.TB = true;
    this.XB = video.src;
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
  async generateTextureFromUri(videoUri, {
    _level = 0,
    internalFormat = TextureFormat.RGBA8,
    format = PixelFormat.RGBA,
    type = ComponentType.UnsignedByte,
    generateMipmap = false,
    mutedAutoPlay = true,
    playButtonDomElement = void 0
  } = {}) {
    this.XB = videoUri;
    this.WB = true;
    return new Promise((resolve, _reject) => {
      const button = playButtonDomElement;
      const setupTexture = async () => {
        this.km = video.videoWidth;
        this.iy = video.videoHeight;
        const webGLResourceRepository = this.c.webglResourceRepository;
        const textureHandle = await webGLResourceRepository.createTextureFromImageBitmapData(video, {
          // level: level,
          internalFormat,
          width: this.km,
          height: this.iy,
          // border: 0,
          format,
          type,
          generateMipmap
        });
        this._textureResourceUid = textureHandle;
        this.TB = true;
        resolve();
      };
      button == null ? void 0 : button.addEventListener(
        "click",
        () => {
          setupTexture();
          video.play();
        },
        true
      );
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.setAttribute("playsinline", "playsinline");
      if (mutedAutoPlay) {
        video.autoplay = true;
        video.muted = true;
      }
      video.preload = "auto";
      __privateSet(this, _htmlVideoElement, video);
      video.addEventListener(
        "canplaythrough",
        () => {
          setupTexture();
          video.play();
        },
        true
      );
      video.addEventListener(
        "ended",
        () => {
          video.play();
        },
        true
      );
      video.src = videoUri;
    });
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
    const webGLResourceRepository = this.c.webglResourceRepository;
    if (this.TB && __privateGet(this, _htmlVideoElement)) {
      webGLResourceRepository.updateTexture(this._textureResourceUid, __privateGet(this, _htmlVideoElement), {
        level: 0,
        offsetX: 0,
        offsetY: 0,
        width: this.km,
        height: this.iy,
        format: PixelFormat.RGBA,
        type: ComponentType.UnsignedByte
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
    let pixel;
    const webGLResourceRepository = this.c.webglResourceRepository;
    if (this.TB && __privateGet(this, _htmlVideoElement)) {
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
    if (__privateGet(this, _htmlVideoElement)) {
      __privateGet(this, _htmlVideoElement).playbackRate = value;
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
    var _a;
    const playbackRate = (_a = __privateGet(this, _htmlVideoElement)) == null ? void 0 : _a.playbackRate;
    return playbackRate != null ? playbackRate : 1;
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
    var _a;
    (_a = __privateGet(this, _htmlVideoElement)) == null ? void 0 : _a.play();
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
    __privateGet(this, _htmlVideoElement).pause();
  }
};
_htmlVideoElement = new WeakMap();
VideoTexture.uC = false;
export {
  VideoTexture
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vdGV4dHVyZXMvVmlkZW9UZXh0dXJlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IFNpemUgfSBmcm9tICcuLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgeyBDb21wb25lbnRUeXBlLCB0eXBlIENvbXBvbmVudFR5cGVFbnVtIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvQ29tcG9uZW50VHlwZSc7XG5pbXBvcnQgeyBQaXhlbEZvcm1hdCwgdHlwZSBQaXhlbEZvcm1hdEVudW0gfSBmcm9tICcuLi9kZWZpbml0aW9ucy9QaXhlbEZvcm1hdCc7XG5pbXBvcnQgeyBUZXh0dXJlRm9ybWF0IH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvVGV4dHVyZUZvcm1hdCc7XG5pbXBvcnQgdHlwZSB7IFRleHR1cmVQYXJhbWV0ZXJFbnVtIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvVGV4dHVyZVBhcmFtZXRlcic7XG5pbXBvcnQgeyBEYXRhVXRpbCB9IGZyb20gJy4uL21pc2MvRGF0YVV0aWwnO1xuaW1wb3J0IHsgQWJzdHJhY3RUZXh0dXJlIH0gZnJvbSAnLi9BYnN0cmFjdFRleHR1cmUnO1xuXG4vKipcbiAqIENvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgVmlkZW9UZXh0dXJlIGNyZWF0aW9uIGFuZCBwcm9jZXNzaW5nLlxuICovXG5leHBvcnQgdHlwZSBWaWRlb1RleHR1cmVBcmd1bWVudHMgPSB7XG4gIGxldmVsOiBudW1iZXI7XG4gIGludGVybmFsRm9ybWF0OiBQaXhlbEZvcm1hdEVudW07XG4gIGZvcm1hdDogUGl4ZWxGb3JtYXRFbnVtO1xuICB0eXBlOiBDb21wb25lbnRUeXBlRW51bTtcbiAgbWFnRmlsdGVyOiBUZXh0dXJlUGFyYW1ldGVyRW51bTtcbiAgbWluRmlsdGVyOiBUZXh0dXJlUGFyYW1ldGVyRW51bTtcbiAgd3JhcFM6IFRleHR1cmVQYXJhbWV0ZXJFbnVtO1xuICB3cmFwVDogVGV4dHVyZVBhcmFtZXRlckVudW07XG4gIGdlbmVyYXRlTWlwbWFwOiBib29sZWFuO1xuICBhbmlzb3Ryb3B5OiBib29sZWFuO1xuICBpc1ByZW11bHRpcGxpZWRBbHBoYT86IGJvb2xlYW47XG4gIG11dGVkQXV0b1BsYXk6IGJvb2xlYW47XG4gIHBsYXlCdXR0b25Eb21FbGVtZW50PzogSFRNTEVsZW1lbnQ7XG59O1xuXG4vKipcbiAqIEEgdGV4dHVyZSBjbGFzcyB0aGF0IGhhbmRsZXMgdmlkZW8gY29udGVudCBhcyB0ZXh0dXJlIGRhdGEuXG4gKiBFeHRlbmRzIEFic3RyYWN0VGV4dHVyZSB0byBwcm92aWRlIHZpZGVvLXNwZWNpZmljIGZ1bmN0aW9uYWxpdHkgaW5jbHVkaW5nXG4gKiB2aWRlbyBsb2FkaW5nLCBwbGF5YmFjayBjb250cm9sLCBhbmQgcmVhbC10aW1lIHRleHR1cmUgdXBkYXRlcy5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHlwZXNjcmlwdFxuICogY29uc3QgdmlkZW9UZXh0dXJlID0gbmV3IFZpZGVvVGV4dHVyZSgpO1xuICogYXdhaXQgdmlkZW9UZXh0dXJlLmdlbmVyYXRlVGV4dHVyZUZyb21VcmkoJ3BhdGgvdG8vdmlkZW8ubXA0Jyk7XG4gKiB2aWRlb1RleHR1cmUucGxheSgpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBWaWRlb1RleHR1cmUgZXh0ZW5kcyBBYnN0cmFjdFRleHR1cmUge1xuICBwcml2YXRlIF9faW1hZ2VEYXRhPzogSW1hZ2VEYXRhO1xuICBwdWJsaWMgYXV0b1Jlc2l6ZSA9IHRydWU7XG4gIHB1YmxpYyBhdXRvRGV0ZWN0VHJhbnNwYXJlbmN5ID0gZmFsc2U7XG4gIHByaXZhdGUgc3RhdGljIF9fbG9hZGVkQmFzaXNGdW5jID0gZmFsc2U7XG4gIHByaXZhdGUgc3RhdGljIF9fYmFzaXNMb2FkUHJvbWlzZT86IFByb21pc2U8dm9pZD47XG4gICNodG1sVmlkZW9FbGVtZW50PzogSFRNTFZpZGVvRWxlbWVudDtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHJlc2l6ZWQgY2FudmFzIGZyb20gYW4gaW1hZ2UsIG1haW50YWluaW5nIGFzcGVjdCByYXRpbyBhbmQgZW5zdXJpbmcgcG93ZXItb2YtdHdvIGRpbWVuc2lvbnMuXG4gICAqIE9wdGlvbmFsbHkgZGV0ZWN0cyB0cmFuc3BhcmVuY3kgaW4gdGhlIGltYWdlIGRhdGEuXG4gICAqXG4gICAqIEBwYXJhbSBpbWFnZSAtIFRoZSBzb3VyY2UgaW1hZ2UgdG8gcmVzaXplXG4gICAqIEBwYXJhbSBtYXhTaXplIC0gTWF4aW11bSBzaXplIGNvbnN0cmFpbnQgZm9yIHRoZSBvdXRwdXQgY2FudmFzXG4gICAqIEByZXR1cm5zIEEgY2FudmFzIGVsZW1lbnQgY29udGFpbmluZyB0aGUgcmVzaXplZCBpbWFnZVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2dldFJlc2l6ZWRDYW52YXMoaW1hZ2U6IEhUTUxJbWFnZUVsZW1lbnQsIG1heFNpemU6IFNpemUpIHtcbiAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICBjb25zdCBwb3RXaWR0aCA9IERhdGFVdGlsLmdldE5lYXJlc3RQb3dlck9mVHdvKGltYWdlLndpZHRoKTtcbiAgICBjb25zdCBwb3RIZWlnaHQgPSBEYXRhVXRpbC5nZXROZWFyZXN0UG93ZXJPZlR3byhpbWFnZS5oZWlnaHQpO1xuXG4gICAgY29uc3QgYXNwZWN0ID0gcG90SGVpZ2h0IC8gcG90V2lkdGg7XG4gICAgbGV0IGRzdFdpZHRoID0gMDtcbiAgICBsZXQgZHN0SGVpZ2h0ID0gMDtcbiAgICBpZiAocG90V2lkdGggPiBwb3RIZWlnaHQpIHtcbiAgICAgIGRzdFdpZHRoID0gTWF0aC5taW4ocG90V2lkdGgsIG1heFNpemUpO1xuICAgICAgZHN0SGVpZ2h0ID0gZHN0V2lkdGggKiBhc3BlY3Q7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRzdEhlaWdodCA9IE1hdGgubWluKHBvdEhlaWdodCwgbWF4U2l6ZSk7XG4gICAgICBkc3RXaWR0aCA9IGRzdEhlaWdodCAvIGFzcGVjdDtcbiAgICB9XG4gICAgY2FudmFzLndpZHRoID0gZHN0V2lkdGg7XG4gICAgY2FudmFzLmhlaWdodCA9IGRzdEhlaWdodDtcblxuICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpITtcbiAgICBjdHguZHJhd0ltYWdlKGltYWdlLCAwLCAwLCBpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0LCAwLCAwLCBkc3RXaWR0aCwgZHN0SGVpZ2h0KTtcblxuICAgIGlmICh0aGlzLmF1dG9EZXRlY3RUcmFuc3BhcmVuY3kpIHtcbiAgICAgIHRoaXMuX19pbWFnZURhdGEgPSBjdHguZ2V0SW1hZ2VEYXRhKDAsIDAsIGRzdFdpZHRoLCBkc3RIZWlnaHQpO1xuICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBkc3RIZWlnaHQ7IHkrKykge1xuICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGRzdFdpZHRoOyB4KyspIHtcbiAgICAgICAgICBjb25zdCBhbHBoYSA9IHRoaXMuX19pbWFnZURhdGEuZGF0YVsoeCArIHkgKiBkc3RXaWR0aCkgKiA0ICsgM107XG4gICAgICAgICAgaWYgKGFscGhhIDwgMSkge1xuICAgICAgICAgICAgdGhpcy5fX2hhc1RyYW5zcGFyZW50UGl4ZWxzID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybiBjYW52YXM7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLl9faGFzVHJhbnNwYXJlbnRQaXhlbHMgPSBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2FudmFzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBhIHRleHR1cmUgZnJvbSBhbiBleGlzdGluZyBIVE1MVmlkZW9FbGVtZW50LlxuICAgKiBTZXRzIHVwIHRoZSB2aWRlbyBlbGVtZW50IGZvciBwbGF5YmFjayBhbmQgY3JlYXRlcyB0aGUgY29ycmVzcG9uZGluZyBXZWJHTCB0ZXh0dXJlLlxuICAgKlxuICAgKiBAcGFyYW0gdmlkZW8gLSBUaGUgSFRNTFZpZGVvRWxlbWVudCB0byB1c2UgYXMgdGV4dHVyZSBzb3VyY2VcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBDb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRleHR1cmUgZ2VuZXJhdGlvblxuICAgKiBAcGFyYW0gb3B0aW9ucy5sZXZlbCAtIE1pcG1hcCBsZXZlbCAoZGVmYXVsdDogMClcbiAgICogQHBhcmFtIG9wdGlvbnMuaW50ZXJuYWxGb3JtYXQgLSBJbnRlcm5hbCBwaXhlbCBmb3JtYXQgKGRlZmF1bHQ6IFJHQkE4KVxuICAgKiBAcGFyYW0gb3B0aW9ucy5mb3JtYXQgLSBQaXhlbCBmb3JtYXQgKGRlZmF1bHQ6IFJHQkEpXG4gICAqIEBwYXJhbSBvcHRpb25zLnR5cGUgLSBDb21wb25lbnQgdHlwZSAoZGVmYXVsdDogVW5zaWduZWRCeXRlKVxuICAgKiBAcGFyYW0gb3B0aW9ucy5nZW5lcmF0ZU1pcG1hcCAtIFdoZXRoZXIgdG8gZ2VuZXJhdGUgbWlwbWFwcyAoZGVmYXVsdDogZmFsc2UpXG4gICAqIEBwYXJhbSBvcHRpb25zLm11dGVkQXV0b1BsYXkgLSBXaGV0aGVyIHRvIGVuYWJsZSBtdXRlZCBhdXRvcGxheSAoZGVmYXVsdDogdHJ1ZSlcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCB2aWRlbyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdteVZpZGVvJykgYXMgSFRNTFZpZGVvRWxlbWVudDtcbiAgICogYXdhaXQgdmlkZW9UZXh0dXJlLmdlbmVyYXRlVGV4dHVyZUZyb21WaWRlbyh2aWRlbywge1xuICAgKiAgIGdlbmVyYXRlTWlwbWFwOiB0cnVlLFxuICAgKiAgIG11dGVkQXV0b1BsYXk6IGZhbHNlXG4gICAqIH0pO1xuICAgKiBgYGBcbiAgICovXG4gIGFzeW5jIGdlbmVyYXRlVGV4dHVyZUZyb21WaWRlbyhcbiAgICB2aWRlbzogSFRNTFZpZGVvRWxlbWVudCxcbiAgICB7XG4gICAgICBfbGV2ZWwgPSAwLFxuICAgICAgaW50ZXJuYWxGb3JtYXQgPSBUZXh0dXJlRm9ybWF0LlJHQkE4LFxuICAgICAgZm9ybWF0ID0gUGl4ZWxGb3JtYXQuUkdCQSxcbiAgICAgIHR5cGUgPSBDb21wb25lbnRUeXBlLlVuc2lnbmVkQnl0ZSxcbiAgICAgIGdlbmVyYXRlTWlwbWFwID0gZmFsc2UsXG4gICAgICBtdXRlZEF1dG9QbGF5ID0gdHJ1ZSxcbiAgICB9ID0ge31cbiAgKSB7XG4gICAgdGhpcy5fX3N0YXJ0ZWRUb0xvYWQgPSB0cnVlO1xuICAgIHRoaXMuI2h0bWxWaWRlb0VsZW1lbnQgPSB2aWRlbztcbiAgICBpZiAobXV0ZWRBdXRvUGxheSkge1xuICAgICAgdmlkZW8uYXV0b3BsYXkgPSB0cnVlO1xuICAgICAgdmlkZW8ubXV0ZWQgPSB0cnVlO1xuICAgIH1cbiAgICBjb25zdCBpbWcgPSB2aWRlbztcblxuICAgIHRoaXMuX193aWR0aCA9IGltZy52aWRlb1dpZHRoO1xuICAgIHRoaXMuX19oZWlnaHQgPSBpbWcudmlkZW9IZWlnaHQ7XG5cbiAgICBjb25zdCB3ZWJHTFJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgY29uc3QgdGV4dHVyZUhhbmRsZSA9IGF3YWl0IHdlYkdMUmVzb3VyY2VSZXBvc2l0b3J5LmNyZWF0ZVRleHR1cmVGcm9tSW1hZ2VCaXRtYXBEYXRhKGltZywge1xuICAgICAgLy8gbGV2ZWw6IGxldmVsLFxuICAgICAgaW50ZXJuYWxGb3JtYXQ6IGludGVybmFsRm9ybWF0LFxuICAgICAgd2lkdGg6IHRoaXMuX193aWR0aCxcbiAgICAgIGhlaWdodDogdGhpcy5fX2hlaWdodCxcbiAgICAgIC8vIGJvcmRlcjogMCxcbiAgICAgIGZvcm1hdDogZm9ybWF0LFxuICAgICAgdHlwZTogdHlwZSxcbiAgICAgIGdlbmVyYXRlTWlwbWFwOiBnZW5lcmF0ZU1pcG1hcCxcbiAgICB9KTtcblxuICAgIHRoaXMuX3RleHR1cmVSZXNvdXJjZVVpZCA9IHRleHR1cmVIYW5kbGU7XG4gICAgdGhpcy5fX2lzVGV4dHVyZVJlYWR5ID0gdHJ1ZTtcbiAgICB0aGlzLl9fdXJpID0gdmlkZW8uc3JjO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBhIHRleHR1cmUgZnJvbSBhIHZpZGVvIGZpbGUgVVJJLlxuICAgKiBDcmVhdGVzIGEgdmlkZW8gZWxlbWVudCwgbG9hZHMgdGhlIHNwZWNpZmllZCB2aWRlbywgYW5kIHNldHMgdXAgdGV4dHVyZSBnZW5lcmF0aW9uLlxuICAgKiBTdXBwb3J0cyBib3RoIGF1dG9tYXRpYyBwbGF5YmFjayBhbmQgbWFudWFsIHBsYXliYWNrIHZpYSBhIHBsYXkgYnV0dG9uLlxuICAgKlxuICAgKiBAcGFyYW0gdmlkZW9VcmkgLSBVUkkgb2YgdGhlIHZpZGVvIGZpbGUgdG8gbG9hZFxuICAgKiBAcGFyYW0gb3B0aW9ucyAtIENvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgdGV4dHVyZSBnZW5lcmF0aW9uXG4gICAqIEBwYXJhbSBvcHRpb25zLmxldmVsIC0gTWlwbWFwIGxldmVsIChkZWZhdWx0OiAwKVxuICAgKiBAcGFyYW0gb3B0aW9ucy5pbnRlcm5hbEZvcm1hdCAtIEludGVybmFsIHBpeGVsIGZvcm1hdCAoZGVmYXVsdDogUkdCQTgpXG4gICAqIEBwYXJhbSBvcHRpb25zLmZvcm1hdCAtIFBpeGVsIGZvcm1hdCAoZGVmYXVsdDogUkdCQSlcbiAgICogQHBhcmFtIG9wdGlvbnMudHlwZSAtIENvbXBvbmVudCB0eXBlIChkZWZhdWx0OiBVbnNpZ25lZEJ5dGUpXG4gICAqIEBwYXJhbSBvcHRpb25zLmdlbmVyYXRlTWlwbWFwIC0gV2hldGhlciB0byBnZW5lcmF0ZSBtaXBtYXBzIChkZWZhdWx0OiBmYWxzZSlcbiAgICogQHBhcmFtIG9wdGlvbnMubXV0ZWRBdXRvUGxheSAtIFdoZXRoZXIgdG8gZW5hYmxlIG11dGVkIGF1dG9wbGF5IChkZWZhdWx0OiB0cnVlKVxuICAgKiBAcGFyYW0gb3B0aW9ucy5wbGF5QnV0dG9uRG9tRWxlbWVudCAtIE9wdGlvbmFsIGJ1dHRvbiBlbGVtZW50IHRvIHRyaWdnZXIgbWFudWFsIHBsYXliYWNrXG4gICAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSB0ZXh0dXJlIGlzIHJlYWR5XG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgcGxheUJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwbGF5QnRuJyk7XG4gICAqIGF3YWl0IHZpZGVvVGV4dHVyZS5nZW5lcmF0ZVRleHR1cmVGcm9tVXJpKCd2aWRlby5tcDQnLCB7XG4gICAqICAgbXV0ZWRBdXRvUGxheTogZmFsc2UsXG4gICAqICAgcGxheUJ1dHRvbkRvbUVsZW1lbnQ6IHBsYXlCdXR0b25cbiAgICogfSk7XG4gICAqIGBgYFxuICAgKi9cbiAgYXN5bmMgZ2VuZXJhdGVUZXh0dXJlRnJvbVVyaShcbiAgICB2aWRlb1VyaTogc3RyaW5nLFxuICAgIHtcbiAgICAgIF9sZXZlbCA9IDAsXG4gICAgICBpbnRlcm5hbEZvcm1hdCA9IFRleHR1cmVGb3JtYXQuUkdCQTgsXG4gICAgICBmb3JtYXQgPSBQaXhlbEZvcm1hdC5SR0JBLFxuICAgICAgdHlwZSA9IENvbXBvbmVudFR5cGUuVW5zaWduZWRCeXRlLFxuICAgICAgZ2VuZXJhdGVNaXBtYXAgPSBmYWxzZSxcbiAgICAgIG11dGVkQXV0b1BsYXkgPSB0cnVlLFxuICAgICAgcGxheUJ1dHRvbkRvbUVsZW1lbnQgPSB1bmRlZmluZWQsXG4gICAgfSA9IHt9XG4gICkge1xuICAgIHRoaXMuX191cmkgPSB2aWRlb1VyaTtcbiAgICB0aGlzLl9fc3RhcnRlZFRvTG9hZCA9IHRydWU7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCBfcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCBidXR0b24gPSBwbGF5QnV0dG9uRG9tRWxlbWVudCBhcyBIVE1MQnV0dG9uRWxlbWVudCB8IHVuZGVmaW5lZDtcblxuICAgICAgY29uc3Qgc2V0dXBUZXh0dXJlID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICB0aGlzLl9fd2lkdGggPSB2aWRlby52aWRlb1dpZHRoO1xuICAgICAgICB0aGlzLl9faGVpZ2h0ID0gdmlkZW8udmlkZW9IZWlnaHQ7XG5cbiAgICAgICAgY29uc3Qgd2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgICAgICBjb25zdCB0ZXh0dXJlSGFuZGxlID0gYXdhaXQgd2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkuY3JlYXRlVGV4dHVyZUZyb21JbWFnZUJpdG1hcERhdGEodmlkZW8sIHtcbiAgICAgICAgICAvLyBsZXZlbDogbGV2ZWwsXG4gICAgICAgICAgaW50ZXJuYWxGb3JtYXQ6IGludGVybmFsRm9ybWF0LFxuICAgICAgICAgIHdpZHRoOiB0aGlzLl9fd2lkdGgsXG4gICAgICAgICAgaGVpZ2h0OiB0aGlzLl9faGVpZ2h0LFxuICAgICAgICAgIC8vIGJvcmRlcjogMCxcbiAgICAgICAgICBmb3JtYXQ6IGZvcm1hdCxcbiAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgIGdlbmVyYXRlTWlwbWFwOiBnZW5lcmF0ZU1pcG1hcCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5fdGV4dHVyZVJlc291cmNlVWlkID0gdGV4dHVyZUhhbmRsZTtcbiAgICAgICAgdGhpcy5fX2lzVGV4dHVyZVJlYWR5ID0gdHJ1ZTtcblxuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9O1xuXG4gICAgICBidXR0b24/LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICdjbGljaycsXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICBzZXR1cFRleHR1cmUoKTtcbiAgICAgICAgICB2aWRlby5wbGF5KCk7XG4gICAgICAgIH0sXG4gICAgICAgIHRydWVcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IHZpZGVvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlkZW8nKSBhcyBIVE1MVmlkZW9FbGVtZW50O1xuICAgICAgdmlkZW8uY3Jvc3NPcmlnaW4gPSAnYW5vbnltb3VzJztcbiAgICAgIHZpZGVvLnNldEF0dHJpYnV0ZSgncGxheXNpbmxpbmUnLCAncGxheXNpbmxpbmUnKTtcbiAgICAgIGlmIChtdXRlZEF1dG9QbGF5KSB7XG4gICAgICAgIHZpZGVvLmF1dG9wbGF5ID0gdHJ1ZTtcbiAgICAgICAgdmlkZW8ubXV0ZWQgPSB0cnVlO1xuICAgICAgfVxuICAgICAgdmlkZW8ucHJlbG9hZCA9ICdhdXRvJztcbiAgICAgIHRoaXMuI2h0bWxWaWRlb0VsZW1lbnQgPSB2aWRlbztcblxuICAgICAgdmlkZW8uYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgJ2NhbnBsYXl0aHJvdWdoJyxcbiAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIHNldHVwVGV4dHVyZSgpO1xuICAgICAgICAgIHZpZGVvLnBsYXkoKTtcbiAgICAgICAgfSxcbiAgICAgICAgdHJ1ZVxuICAgICAgKTtcblxuICAgICAgdmlkZW8uYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgJ2VuZGVkJyxcbiAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIHZpZGVvLnBsYXkoKTtcbiAgICAgICAgfSxcbiAgICAgICAgdHJ1ZVxuICAgICAgKTtcblxuICAgICAgdmlkZW8uc3JjID0gdmlkZW9Vcmk7XG4gICAgfSkgYXMgUHJvbWlzZTx2b2lkPjtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSB0ZXh0dXJlIHdpdGggdGhlIGN1cnJlbnQgdmlkZW8gZnJhbWUuXG4gICAqIFNob3VsZCBiZSBjYWxsZWQgcmVndWxhcmx5IChlLmcuLCBpbiBhIHJlbmRlciBsb29wKSB0byBrZWVwIHRoZSB0ZXh0dXJlXG4gICAqIHN5bmNocm9uaXplZCB3aXRoIHRoZSB2aWRlbyBwbGF5YmFjay5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiAvLyBJbiByZW5kZXIgbG9vcFxuICAgKiBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAqICAgdmlkZW9UZXh0dXJlLnVwZGF0ZVRleHR1cmUoKTtcbiAgICogICAvLyAuLi4gb3RoZXIgcmVuZGVyaW5nIGNvZGVcbiAgICogICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVuZGVyKTtcbiAgICogfVxuICAgKiBgYGBcbiAgICovXG4gIHVwZGF0ZVRleHR1cmUoKSB7XG4gICAgY29uc3Qgd2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGlmICh0aGlzLl9faXNUZXh0dXJlUmVhZHkgJiYgdGhpcy4jaHRtbFZpZGVvRWxlbWVudCkge1xuICAgICAgd2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkudXBkYXRlVGV4dHVyZSh0aGlzLl90ZXh0dXJlUmVzb3VyY2VVaWQsIHRoaXMuI2h0bWxWaWRlb0VsZW1lbnQsIHtcbiAgICAgICAgbGV2ZWw6IDAsXG4gICAgICAgIG9mZnNldFg6IDAsXG4gICAgICAgIG9mZnNldFk6IDAsXG4gICAgICAgIHdpZHRoOiB0aGlzLl9fd2lkdGgsXG4gICAgICAgIGhlaWdodDogdGhpcy5fX2hlaWdodCxcbiAgICAgICAgZm9ybWF0OiBQaXhlbEZvcm1hdC5SR0JBLFxuICAgICAgICB0eXBlOiBDb21wb25lbnRUeXBlLlVuc2lnbmVkQnl0ZSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIHBpeGVsIGRhdGEgb2YgdGhlIGN1cnJlbnQgdmlkZW8gZnJhbWUuXG4gICAqIFVzZWZ1bCBmb3IgaW1hZ2UgcHJvY2Vzc2luZyBvciBhbmFseXNpcyBvZiB2aWRlbyBjb250ZW50LlxuICAgKlxuICAgKiBAcmV0dXJucyBBIHR1cGxlIGNvbnRhaW5pbmcgW3BpeGVsRGF0YSwgd2lkdGgsIGhlaWdodF0gd2hlcmUgcGl4ZWxEYXRhIGlzIGEgVWludDhBcnJheVxuICAgKiAgICAgICAgICBvZiBSR0JBIHZhbHVlcywgb3IgW3VuZGVmaW5lZCwgd2lkdGgsIGhlaWdodF0gaWYgdGV4dHVyZSBpcyBub3QgcmVhZHlcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBbcGl4ZWxzLCB3aWR0aCwgaGVpZ2h0XSA9IHZpZGVvVGV4dHVyZS5nZXRDdXJyZW50RnJhbWVQaXhlbERhdGEoKTtcbiAgICogaWYgKHBpeGVscykge1xuICAgKiAgIC8vIFByb2Nlc3MgcGl4ZWwgZGF0YVxuICAgKiAgIGNvbnNvbGUubG9nKGBGcmFtZSBzaXplOiAke3dpZHRofXgke2hlaWdodH0sIHBpeGVsczogJHtwaXhlbHMubGVuZ3RofWApO1xuICAgKiB9XG4gICAqIGBgYFxuICAgKi9cbiAgZ2V0Q3VycmVudEZyYW1lUGl4ZWxEYXRhKCkge1xuICAgIGxldCBwaXhlbDogVWludDhBcnJheSB8IHVuZGVmaW5lZDtcbiAgICBjb25zdCB3ZWJHTFJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgaWYgKHRoaXMuX19pc1RleHR1cmVSZWFkeSAmJiB0aGlzLiNodG1sVmlkZW9FbGVtZW50KSB7XG4gICAgICBwaXhlbCA9IHdlYkdMUmVzb3VyY2VSZXBvc2l0b3J5LmdldFBpeGVsRGF0YUZyb21UZXh0dXJlKHRoaXMuX3RleHR1cmVSZXNvdXJjZVVpZCwgMCwgMCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIH1cbiAgICByZXR1cm4gW3BpeGVsLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodF07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcGxheWJhY2sgcmF0ZSBvZiB0aGUgdmlkZW8uXG4gICAqXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFBsYXliYWNrIHJhdGUgbXVsdGlwbGllciAoMS4wID0gbm9ybWFsIHNwZWVkLCAyLjAgPSBkb3VibGUgc3BlZWQsIDAuNSA9IGhhbGYgc3BlZWQpXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogdmlkZW9UZXh0dXJlLnBsYXliYWNrUmF0ZSA9IDIuMDsgLy8gUGxheSBhdCBkb3VibGUgc3BlZWRcbiAgICogYGBgXG4gICAqL1xuICBzZXQgcGxheWJhY2tSYXRlKHZhbHVlKSB7XG4gICAgaWYgKHRoaXMuI2h0bWxWaWRlb0VsZW1lbnQpIHtcbiAgICAgIHRoaXMuI2h0bWxWaWRlb0VsZW1lbnQucGxheWJhY2tSYXRlID0gdmFsdWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgcGxheWJhY2sgcmF0ZSBvZiB0aGUgdmlkZW8uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBjdXJyZW50IHBsYXliYWNrIHJhdGUsIG9yIDEgaWYgbm8gdmlkZW8gZWxlbWVudCBpcyBhdmFpbGFibGVcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBjdXJyZW50UmF0ZSA9IHZpZGVvVGV4dHVyZS5wbGF5YmFja1JhdGU7XG4gICAqIGNvbnNvbGUubG9nKGBDdXJyZW50IHBsYXliYWNrIHJhdGU6ICR7Y3VycmVudFJhdGV9YCk7XG4gICAqIGBgYFxuICAgKi9cbiAgZ2V0IHBsYXliYWNrUmF0ZSgpIHtcbiAgICBjb25zdCBwbGF5YmFja1JhdGUgPSB0aGlzLiNodG1sVmlkZW9FbGVtZW50Py5wbGF5YmFja1JhdGU7XG4gICAgcmV0dXJuIHBsYXliYWNrUmF0ZSA/PyAxO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0YXJ0cyBvciByZXN1bWVzIHZpZGVvIHBsYXliYWNrLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIHZpZGVvVGV4dHVyZS5wbGF5KCk7XG4gICAqIGBgYFxuICAgKi9cbiAgcGxheSgpIHtcbiAgICB0aGlzLiNodG1sVmlkZW9FbGVtZW50Py5wbGF5KCk7XG4gIH1cblxuICAvKipcbiAgICogUGF1c2VzIHZpZGVvIHBsYXliYWNrLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIHZpZGVvVGV4dHVyZS5wYXVzZSgpO1xuICAgKiBgYGBcbiAgICovXG4gIHBhdXNlKCkge1xuICAgIHRoaXMuI2h0bWxWaWRlb0VsZW1lbnQhLnBhdXNlKCk7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7OztBQUNBLFNBQVMscUJBQTZDO0FBQ3RELFNBQVMsbUJBQXlDO0FBQ2xELFNBQVMscUJBQXFCO0FBRTlCLFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMsdUJBQXVCO0FBTmhDO0FBdUNPLElBQU0sZUFBTixjQUEyQixnQkFBZ0I7QUFBQSxFQUEzQztBQUFBO0FBRUwsU0FBTyxhQUFhO0FBQ3BCLFNBQU8seUJBQXlCO0FBR2hDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVdRQSxHQUFtQixPQUF5QixTQUFlO0FBQ2pFLFVBQU0sU0FBUyxTQUFTLGNBQWMsUUFBUTtBQUM5QyxVQUFNLFdBQVcsU0FBUyxxQkFBcUIsTUFBTSxLQUFLO0FBQzFELFVBQU0sWUFBWSxTQUFTLHFCQUFxQixNQUFNLE1BQU07QUFFNUQsVUFBTSxTQUFTLFlBQVk7QUFDM0IsUUFBSSxXQUFXO0FBQ2YsUUFBSSxZQUFZO0FBQ2hCLFFBQUksV0FBVyxXQUFXO0FBQ3hCLGlCQUFXLEtBQUssSUFBSSxVQUFVLE9BQU87QUFDckMsa0JBQVksV0FBVztBQUFBLElBQ3pCLE9BQU87QUFDTCxrQkFBWSxLQUFLLElBQUksV0FBVyxPQUFPO0FBQ3ZDLGlCQUFXLFlBQVk7QUFBQSxJQUN6QjtBQUNBLFdBQU8sUUFBUTtBQUNmLFdBQU8sU0FBUztBQUVoQixVQUFNLE1BQU0sT0FBTyxXQUFXLElBQUk7QUFDbEMsUUFBSSxVQUFVLE9BQU8sR0FBRyxHQUFHLE1BQU0sT0FBTyxNQUFNLFFBQVEsR0FBRyxHQUFHLFVBQVUs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LG1CQUFLLG9CQUFtQjtBQUNuRCxjQUFRLHdCQUF3Qix3QkFBd0IsS0FBSyxxQkFBcUIsR0FBRyxHQUFHLEtBQUssT0FBTyxLQUFLLE1BQU07QUFBQSxJQUNqSDtBQUNBLFdBQU8sQ0FBQyxPQUFPLEtBQUssT0FBTyxLQUFLLE1BQU07QUFBQSxFQUN4QztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFZQSxJQUFJLGFBQWEsT0FBTztBQUN0QixRQUFJLG1CQUFLLG9CQUFtQjtBQUMxQix5QkFBSyxtQkFBa0IsZUFBZTtBQUFBLElBQ3hDO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWFBLElBQUksZUFBZTtBQXJWckI7QUFzVkksVUFBTSxnQkFBZSx3QkFBSyx1QkFBTCxtQkFBd0I7QUFDN0MsV0FBTyxzQ0FBZ0I7QUFBQSxFQUN6QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVBLE9BQU87QUFsV1Q7QUFtV0ksNkJBQUssdUJBQUwsbUJBQXdCO0FBQUEsRUFDMUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFVQSxRQUFRO0FBQ04sdUJBQUssbUJBQW1CLE1BQU07QUFBQSxFQUNoQztBQUNGO0FBcFVFO0FBTlcsYUFJSUUsS0FBb0I7IiwKICAibmFtZXMiOiBbIl9fZ2V0UmVzaXplZENhbnZhcyIsICJfX2ltYWdlRGF0YSIsICJfX2hhc1RyYW5zcGFyZW50UGl4ZWxzIiwgIl9fc3RhcnRlZFRvTG9hZCIsICJfX3dpZHRoIiwgIl9faGVpZ2h0IiwgIl9fZW5naW5lIiwgIl9faXNUZXh0dXJlUmVhZHkiLCAiX191cmkiLCAiX19sb2FkZWRCYXNpc0Z1bmMiXQp9Cg==
