// src/foundation/textures/AbstractTexture.ts
import { RnObject } from "../core/RnObject.js";
import { ComponentType } from "../definitions/ComponentType.js";
import { CompositionType } from "../definitions/CompositionType.js";
import { PixelFormat } from "../definitions/PixelFormat.js";
import { TextureFormat } from "../definitions/TextureFormat.js";
import { Is } from "../misc/Is.js";
import { TextureDataFloat } from "./TextureDataFloat.js";
var _AbstractTexture = class _AbstractTexture extends RnObject {
  /**
   * Creates a new AbstractTexture instance.
   * Automatically assigns a unique texture UID to this texture.
   */
  constructor(engine) {
    super();
    this.dm = 0;
    this.Dy = 0;
    this.tB = 0;
    this.uB = 1;
    this.vB = TextureFormat.RGBA8;
    this.wB = PixelFormat.RGBA;
    this.Cc = ComponentType.UnsignedByte;
    this.pB = false;
    this.mB = false;
    this.oB = false;
    this.rB = false;
    this.mu = "untitled";
    this._textureResourceUid = -1;
    this._samplerResourceUid = -1;
    this._textureViewResourceUid = -1;
    this._textureViewAsRenderTargetResourceUid = -1;
    this.nB = ++_AbstractTexture.qB;
    this.c = engine;
  }
  /**
   * Gets the unique identifier for this texture.
   *
   * @returns The unique texture UID
   */
  get textureUID() {
    return this.nB;
  }
  /**
   * Gets the width of the texture in pixels.
   *
   * @returns The texture width
   */
  get width() {
    return this.dm;
  }
  /**
   * Calculates the width of the texture at a specific mip level.
   *
   * @param mipLevel - The mip level to calculate width for
   * @returns The width at the specified mip level (minimum 1 pixel)
   */
  getWidthAtMipLevel(mipLevel) {
    return Math.max(1, Math.floor(this.dm / 2 ** mipLevel));
  }
  /**
   * Calculates the height of the texture at a specific mip level.
   *
   * @param mipLevel - The mip level to calculate height for
   * @returns The height at the specified mip level (minimum 1 pixel)
   */
  getHeightAtMipLevel(mipLevel) {
    return Math.max(1, Math.floor(this.Dy / 2 ** mipLevel));
  }
  /**
   * Sets the width of the texture in pixels.
   *
   * @param val - The new width value
   */
  set width(val) {
    this.dm = val;
  }
  /**
   * Gets the height of the texture in pixels.
   *
   * @returns The texture height
   */
  get height() {
    return this.Dy;
  }
  /**
   * Sets the height of the texture in pixels.
   *
   * @param val - The new height value
   */
  set height(val) {
    this.Dy = val;
  }
  /**
   * Checks if the texture is ready for use.
   *
   * @returns True if the texture is ready, false otherwise
   */
  get isTextureReady() {
    return this.oB;
  }
  /**
   * Checks if the texture has started loading.
   *
   * @returns True if loading has started, false otherwise
   */
  get startedToLoad() {
    return this.rB;
  }
  /**
   * Checks whether this texture is marked as a dummy (placeholder) texture.
   *
   * @returns True if the texture is marked as dummy, false otherwise
   */
  get isDummyTexture() {
    return this.mB;
  }
  /**
   * Marks this texture as a dummy (placeholder) texture.
   *
   * @param isDummy - Whether to mark the texture as dummy (default: true)
   */
  markAsDummyTexture(isDummy = true) {
    this.mB = isDummy;
  }
  /**
   * Gets the HTML image element associated with this texture.
   *
   * @returns The HTML image element or undefined if not available
   */
  get htmlImageElement() {
    return this.jB;
  }
  /**
   * Gets or creates an HTML canvas element with the texture content.
   * If an image element exists, it will be drawn onto the canvas.
   *
   * @returns The HTML canvas element containing the texture data
   */
  get htmlCanvasElement() {
    const canvas = document.createElement("canvas");
    const ctx = canvas == null ? void 0 : canvas.getContext("2d");
    this.kB = canvas;
    if (Is.exist(ctx) && Is.exist(this.jB)) {
      canvas.width = this.jB.width;
      canvas.height = this.jB.height;
      ctx.drawImage(this.jB, 0, 0, this.jB.width, this.jB.height);
    }
    return this.kB;
  }
  /**
   * Gets the URI/URL of the texture source.
   *
   * @returns The texture URI or undefined if not set
   */
  get uri() {
    return this.sB;
  }
  /**
   * Sets the name of the texture.
   *
   * @param name - The new texture name
   */
  set name(name) {
    this.mu = name;
  }
  /**
   * Gets the name of the texture.
   *
   * @returns The texture name
   */
  get name() {
    return this.mu;
  }
  /**
   * Retrieves image data from a rectangular region of the texture.
   * Creates an internal canvas context if one doesn't exist.
   *
   * @param x - The x-coordinate of the top-left corner
   * @param y - The y-coordinate of the top-left corner
   * @param width - The width of the region
   * @param height - The height of the region
   * @returns ImageData object containing the pixel data
   */
  getImageData(x, y, width, height) {
    if (this.lB === void 0) {
      this.createInternalCanvasContext();
    }
    return this.lB.getImageData(x, y, width, height);
  }
  /**
   * Gets a single pixel value at the specified coordinates as a specific type.
   * Supports various color and vector types for different use cases.
   *
   * @param x - The x-coordinate of the pixel
   * @param y - The y-coordinate of the pixel
   * @param typeClass - The class type to return the pixel as (ColorRgb, ColorRgba, Vector3, etc.)
   * @returns An instance of the specified type containing the pixel data
   */
  getPixelAs(x, y, typeClass) {
    const pixel = this.getImageData(x, y, 1, 1);
    const data = pixel.data;
    if (typeClass.compositionType === CompositionType.Vec4) {
      return new typeClass(new Float32Array([data[0], data[1], data[2], data[3]]));
    }
    return new typeClass(new Float32Array([data[0], data[1], data[2]]));
  }
  /**
   * Gets the pixel data at the specified coordinates as a raw Uint8ClampedArray.
   * This provides direct access to the RGBA values as 8-bit integers.
   *
   * @param x - The x-coordinate of the pixel
   * @param y - The y-coordinate of the pixel
   * @returns A Uint8ClampedArray containing the RGBA pixel data
   */
  getPixelAsArray(x, y) {
    const pixel = this.getImageData(x, y, 1, 1);
    return pixel.data;
  }
  /**
   * Sets a pixel value at the specified coordinates using a color or vector object.
   * Automatically determines the number of components based on the input type.
   *
   * @param x - The x-coordinate of the pixel
   * @param y - The y-coordinate of the pixel
   * @param value - The color or vector value to set
   */
  setPixel(x, y, value) {
    const pixel = this.getImageData(x, y, 1, 1);
    const data = pixel.data;
    const classOfValue = value.constructor;
    const numberOfComponents = classOfValue.compositionType.getNumberOfComponents();
    for (let i = 0; i < numberOfComponents; i++) {
      data[i] = value.at(i);
    }
    this.lB.putImageData(pixel, x, y);
  }
  /**
   * Sets a specific channel value for a pixel at the given coordinates.
   * Useful for modifying individual color channels (R, G, B, A).
   *
   * @param x - The x-coordinate of the pixel
   * @param y - The y-coordinate of the pixel
   * @param channelIdx - The channel index (0=R, 1=G, 2=B, 3=A)
   * @param value - The new value for the channel (0-255)
   */
  setPixelAtChannel(x, y, channelIdx, value) {
    const pixel = this.getImageData(x, y, 1, 1);
    const data = pixel.data;
    data[channelIdx] = value;
    this.lB.putImageData(pixel, x, y);
  }
  /**
   * Checks if the texture contains transparent pixels.
   *
   * @returns True if the texture has transparency, false otherwise
   */
  get isTransparent() {
    return this.pB;
  }
  /**
   * Creates an internal canvas context for pixel manipulation operations.
   * Uses existing canvas element if available, otherwise creates a new one.
   */
  createInternalCanvasContext() {
    let canvas;
    if (this.kB != null) {
      canvas = this.kB;
    } else {
      canvas = document.createElement("canvas");
      canvas.width = this.width;
      canvas.height = this.height;
    }
    this.kB = canvas;
    this.lB = canvas.getContext("2d");
  }
  /**
   * Converts the texture data to a TextureDataFloat object with the specified number of channels.
   * This is useful for processing texture data in floating-point format.
   *
   * @param channels - The number of channels to include in the output (1-4)
   * @returns A TextureDataFloat object containing the converted pixel data
   */
  getTextureDataFloat(channels) {
    const pixel = this.getImageData(0, 0, this.width, this.height);
    const textureDataFloat = new TextureDataFloat(this.width, this.height, channels);
    const data = pixel.data;
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        for (let k = 0; k < channels; k++) {
          textureDataFloat.setPixelAtChannel(j, i, k, data[i * this.width * 4 + j * 4 + k] / 255);
        }
      }
    }
    return textureDataFloat;
  }
  /**
   * Reads the texture data from GPU and returns it as a Uint8Array.
   * This method works with both WebGL and WebGPU backends.
   * Useful for textures that don't have an associated htmlImageElement (e.g., dummy textures).
   *
   * @returns Promise resolving to the pixel data as a Uint8Array in RGBA format,
   *          or undefined if the texture is not ready or reading fails
   */
  async getTexturePixelDataFromGPU() {
    if (!this.oB || this._textureResourceUid < 0 || this.dm <= 0 || this.Dy <= 0) {
      return void 0;
    }
    try {
      const cgApiResourceRepository = this.c.cgApiResourceRepository;
      const pixels = await cgApiResourceRepository.getPixelDataFromTextureAsync(
        this._textureResourceUid,
        0,
        0,
        this.dm,
        this.Dy
      );
      return pixels;
    } catch (e) {
      console.warn("Failed to read texture pixel data from GPU:", e);
      return void 0;
    }
  }
  /**
   * Creates an HTMLCanvasElement containing the texture data read from GPU.
   * This is useful for displaying texture previews when htmlImageElement is not available.
   * Works with both WebGL and WebGPU backends.
   *
   * @returns Promise resolving to an HTMLCanvasElement with the texture content,
   *          or undefined if the texture is not ready or reading fails
   */
  async createCanvasFromGPU() {
    const pixels = await this.getTexturePixelDataFromGPU();
    if (!pixels || pixels.length === 0) {
      return void 0;
    }
    const canvas = document.createElement("canvas");
    canvas.width = this.dm;
    canvas.height = this.Dy;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return void 0;
    }
    const imageData = new ImageData(new Uint8ClampedArray(pixels), this.dm, this.Dy);
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
};
_AbstractTexture.InvalidTextureUid = -1;
_AbstractTexture.qB = _AbstractTexture.InvalidTextureUid;
var AbstractTexture = _AbstractTexture;
export {
  AbstractTexture
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vdGV4dHVyZXMvQWJzdHJhY3RUZXh0dXJlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IENHQVBJUmVzb3VyY2VIYW5kbGUsIEluZGV4LCBTaXplLCBUZXh0dXJlVUlEIH0gZnJvbSAnLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHsgUm5PYmplY3QgfSBmcm9tICcuLi9jb3JlL1JuT2JqZWN0JztcbmltcG9ydCB7IENvbXBvbmVudFR5cGUsIHR5cGUgQ29tcG9uZW50VHlwZUVudW0gfSBmcm9tICcuLi9kZWZpbml0aW9ucy9Db21wb25lbnRUeXBlJztcbmltcG9ydCB7IENvbXBvc2l0aW9uVHlwZSwgdHlwZSBDb21wb3NpdGlvblR5cGVFbnVtIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvQ29tcG9zaXRpb25UeXBlJztcbmltcG9ydCB7IFBpeGVsRm9ybWF0LCB0eXBlIFBpeGVsRm9ybWF0RW51bSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1BpeGVsRm9ybWF0JztcbmltcG9ydCB7IFRleHR1cmVGb3JtYXQsIHR5cGUgVGV4dHVyZUZvcm1hdEVudW0gfSBmcm9tICcuLi9kZWZpbml0aW9ucy9UZXh0dXJlRm9ybWF0JztcbmltcG9ydCB0eXBlIHsgQ29sb3JSZ2IgfSBmcm9tICcuLi9tYXRoL0NvbG9yUmdiJztcbmltcG9ydCB0eXBlIHsgQ29sb3JSZ2JhIH0gZnJvbSAnLi4vbWF0aC9Db2xvclJnYmEnO1xuaW1wb3J0IHR5cGUgeyBNdXRhYmxlVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvTXV0YWJsZVZlY3RvcjMnO1xuaW1wb3J0IHR5cGUgeyBNdXRhYmxlVmVjdG9yNCB9IGZyb20gJy4uL21hdGgvTXV0YWJsZVZlY3RvcjQnO1xuaW1wb3J0IHR5cGUgeyBWZWN0b3IzIH0gZnJvbSAnLi4vbWF0aC9WZWN0b3IzJztcbmltcG9ydCB0eXBlIHsgVmVjdG9yNCB9IGZyb20gJy4uL21hdGgvVmVjdG9yNCc7XG5pbXBvcnQgeyBJcyB9IGZyb20gJy4uL21pc2MvSXMnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB0eXBlIHsgU2FtcGxlciB9IGZyb20gJy4vU2FtcGxlcic7XG5pbXBvcnQgeyBUZXh0dXJlRGF0YUZsb2F0IH0gZnJvbSAnLi9UZXh0dXJlRGF0YUZsb2F0JztcblxuLyoqXG4gKiBBYnN0cmFjdCBiYXNlIGNsYXNzIGZvciBhbGwgdGV4dHVyZSB0eXBlcyBpbiB0aGUgUmhvZG9uaXRlIGVuZ2luZS5cbiAqIFByb3ZpZGVzIGNvbW1vbiBmdW5jdGlvbmFsaXR5IGZvciB0ZXh0dXJlIG1hbmFnZW1lbnQsIHBpeGVsIG1hbmlwdWxhdGlvbixcbiAqIGFuZCByZXNvdXJjZSBoYW5kbGluZyBhY3Jvc3MgZGlmZmVyZW50IHRleHR1cmUgaW1wbGVtZW50YXRpb25zLlxuICpcbiAqIEBhYnN0cmFjdFxuICogQGV4dGVuZHMgUm5PYmplY3RcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEFic3RyYWN0VGV4dHVyZSBleHRlbmRzIFJuT2JqZWN0IHtcbiAgcHJvdGVjdGVkIF9fZW5naW5lOiBFbmdpbmU7XG4gIHByb3RlY3RlZCBfX3dpZHRoOiBTaXplID0gMDtcbiAgcHJvdGVjdGVkIF9faGVpZ2h0OiBTaXplID0gMDtcbiAgcHJvdGVjdGVkIF9fbGV2ZWw6IEluZGV4ID0gMDtcbiAgcHJvdGVjdGVkIF9fbWlwTGV2ZWxDb3VudDogSW5kZXggPSAxO1xuICBwcm90ZWN0ZWQgX19pbnRlcm5hbEZvcm1hdDogVGV4dHVyZUZvcm1hdEVudW0gPSBUZXh0dXJlRm9ybWF0LlJHQkE4O1xuICBwcm90ZWN0ZWQgX19mb3JtYXQ6IFBpeGVsRm9ybWF0RW51bSA9IFBpeGVsRm9ybWF0LlJHQkE7XG4gIHByb3RlY3RlZCBfX3R5cGU6IENvbXBvbmVudFR5cGVFbnVtID0gQ29tcG9uZW50VHlwZS5VbnNpZ25lZEJ5dGU7XG5cbiAgcHJvdGVjdGVkIF9faGFzVHJhbnNwYXJlbnRQaXhlbHMgPSBmYWxzZTtcbiAgcHJvdGVjdGVkIF9faXNEdW1teVRleHR1cmUgPSBmYWxzZTtcblxuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBJbnZhbGlkVGV4dHVyZVVpZDogVGV4dHVyZVVJRCA9IC0xO1xuICBwcml2YXRlIHN0YXRpYyBfX3RleHR1cmVVaWRDb3VudDogVGV4dHVyZVVJRCA9IEFic3RyYWN0VGV4dHVyZS5JbnZhbGlkVGV4dHVyZVVpZDtcbiAgcHJpdmF0ZSBfX3RleHR1cmVVaWQ6IFRleHR1cmVVSUQ7XG4gIHByb3RlY3RlZCBfX2ltZz86IEhUTUxJbWFnZUVsZW1lbnQ7XG4gIHByb3RlY3RlZCBfX2lzVGV4dHVyZVJlYWR5ID0gZmFsc2U7XG4gIHByb3RlY3RlZCBfX3N0YXJ0ZWRUb0xvYWQgPSBmYWxzZTtcbiAgcHJvdGVjdGVkIF9faHRtbEltYWdlRWxlbWVudD86IEhUTUxJbWFnZUVsZW1lbnQ7XG4gIHByb3RlY3RlZCBfX2h0bWxDYW52YXNFbGVtZW50PzogSFRNTENhbnZhc0VsZW1lbnQ7XG4gIHByb3RlY3RlZCBfX2NhbnZhc0NvbnRleHQ/OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XG4gIHByb3RlY3RlZCBfX3VyaT86IHN0cmluZztcbiAgcHJvdGVjdGVkIF9fbmFtZSA9ICd1bnRpdGxlZCc7XG4gIHB1YmxpYyBfdGV4dHVyZVJlc291cmNlVWlkOiBDR0FQSVJlc291cmNlSGFuZGxlID0gLTE7XG4gIHB1YmxpYyBfc2FtcGxlclJlc291cmNlVWlkOiBDR0FQSVJlc291cmNlSGFuZGxlID0gLTE7XG4gIHB1YmxpYyBfdGV4dHVyZVZpZXdSZXNvdXJjZVVpZDogQ0dBUElSZXNvdXJjZUhhbmRsZSA9IC0xO1xuICBwdWJsaWMgX3RleHR1cmVWaWV3QXNSZW5kZXJUYXJnZXRSZXNvdXJjZVVpZDogQ0dBUElSZXNvdXJjZUhhbmRsZSA9IC0xO1xuICBwdWJsaWMgX3JlY29tbWVuZGVkVGV4dHVyZVNhbXBsZXI/OiBTYW1wbGVyO1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IEFic3RyYWN0VGV4dHVyZSBpbnN0YW5jZS5cbiAgICogQXV0b21hdGljYWxseSBhc3NpZ25zIGEgdW5pcXVlIHRleHR1cmUgVUlEIHRvIHRoaXMgdGV4dHVyZS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVuZ2luZTogRW5naW5lKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9fdGV4dHVyZVVpZCA9ICsrQWJzdHJhY3RUZXh0dXJlLl9fdGV4dHVyZVVpZENvdW50O1xuICAgIHRoaXMuX19lbmdpbmUgPSBlbmdpbmU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoaXMgdGV4dHVyZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHVuaXF1ZSB0ZXh0dXJlIFVJRFxuICAgKi9cbiAgZ2V0IHRleHR1cmVVSUQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX190ZXh0dXJlVWlkO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHdpZHRoIG9mIHRoZSB0ZXh0dXJlIGluIHBpeGVscy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHRleHR1cmUgd2lkdGhcbiAgICovXG4gIGdldCB3aWR0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5fX3dpZHRoO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIHdpZHRoIG9mIHRoZSB0ZXh0dXJlIGF0IGEgc3BlY2lmaWMgbWlwIGxldmVsLlxuICAgKlxuICAgKiBAcGFyYW0gbWlwTGV2ZWwgLSBUaGUgbWlwIGxldmVsIHRvIGNhbGN1bGF0ZSB3aWR0aCBmb3JcbiAgICogQHJldHVybnMgVGhlIHdpZHRoIGF0IHRoZSBzcGVjaWZpZWQgbWlwIGxldmVsIChtaW5pbXVtIDEgcGl4ZWwpXG4gICAqL1xuICBnZXRXaWR0aEF0TWlwTGV2ZWwobWlwTGV2ZWw6IEluZGV4KSB7XG4gICAgcmV0dXJuIE1hdGgubWF4KDEsIE1hdGguZmxvb3IodGhpcy5fX3dpZHRoIC8gMiAqKiBtaXBMZXZlbCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIGhlaWdodCBvZiB0aGUgdGV4dHVyZSBhdCBhIHNwZWNpZmljIG1pcCBsZXZlbC5cbiAgICpcbiAgICogQHBhcmFtIG1pcExldmVsIC0gVGhlIG1pcCBsZXZlbCB0byBjYWxjdWxhdGUgaGVpZ2h0IGZvclxuICAgKiBAcmV0dXJucyBUaGUgaGVpZ2h0IGF0IHRoZSBzcGVjaWZpZWQgbWlwIGxldmVsIChtaW5pbXVtIDEgcGl4ZWwpXG4gICAqL1xuICBnZXRIZWlnaHRBdE1pcExldmVsKG1pcExldmVsOiBJbmRleCkge1xuICAgIHJldHVybiBNYXRoLm1heCgxLCBNYXRoLmZsb29yKHRoaXMuX19oZWlnaHQgLyAyICoqIG1pcExldmVsKSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgd2lkdGggb2YgdGhlIHRleHR1cmUgaW4gcGl4ZWxzLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIG5ldyB3aWR0aCB2YWx1ZVxuICAgKi9cbiAgc2V0IHdpZHRoKHZhbDogU2l6ZSkge1xuICAgIHRoaXMuX193aWR0aCA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBoZWlnaHQgb2YgdGhlIHRleHR1cmUgaW4gcGl4ZWxzLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgdGV4dHVyZSBoZWlnaHRcbiAgICovXG4gIGdldCBoZWlnaHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19oZWlnaHQ7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaGVpZ2h0IG9mIHRoZSB0ZXh0dXJlIGluIHBpeGVscy5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSBuZXcgaGVpZ2h0IHZhbHVlXG4gICAqL1xuICBzZXQgaGVpZ2h0KHZhbDogU2l6ZSkge1xuICAgIHRoaXMuX19oZWlnaHQgPSB2YWw7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSB0ZXh0dXJlIGlzIHJlYWR5IGZvciB1c2UuXG4gICAqXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIHRleHR1cmUgaXMgcmVhZHksIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgZ2V0IGlzVGV4dHVyZVJlYWR5KCkge1xuICAgIHJldHVybiB0aGlzLl9faXNUZXh0dXJlUmVhZHk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSB0ZXh0dXJlIGhhcyBzdGFydGVkIGxvYWRpbmcuXG4gICAqXG4gICAqIEByZXR1cm5zIFRydWUgaWYgbG9hZGluZyBoYXMgc3RhcnRlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBnZXQgc3RhcnRlZFRvTG9hZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fX3N0YXJ0ZWRUb0xvYWQ7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhpcyB0ZXh0dXJlIGlzIG1hcmtlZCBhcyBhIGR1bW15IChwbGFjZWhvbGRlcikgdGV4dHVyZS5cbiAgICpcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgdGV4dHVyZSBpcyBtYXJrZWQgYXMgZHVtbXksIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgZ2V0IGlzRHVtbXlUZXh0dXJlKCkge1xuICAgIHJldHVybiB0aGlzLl9faXNEdW1teVRleHR1cmU7XG4gIH1cblxuICAvKipcbiAgICogTWFya3MgdGhpcyB0ZXh0dXJlIGFzIGEgZHVtbXkgKHBsYWNlaG9sZGVyKSB0ZXh0dXJlLlxuICAgKlxuICAgKiBAcGFyYW0gaXNEdW1teSAtIFdoZXRoZXIgdG8gbWFyayB0aGUgdGV4dHVyZSBhcyBkdW1teSAoZGVmYXVsdDogdHJ1ZSlcbiAgICovXG4gIG1hcmtBc0R1bW15VGV4dHVyZShpc0R1bW15ID0gdHJ1ZSkge1xuICAgIHRoaXMuX19pc0R1bW15VGV4dHVyZSA9IGlzRHVtbXk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgSFRNTCBpbWFnZSBlbGVtZW50IGFzc29jaWF0ZWQgd2l0aCB0aGlzIHRleHR1cmUuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBIVE1MIGltYWdlIGVsZW1lbnQgb3IgdW5kZWZpbmVkIGlmIG5vdCBhdmFpbGFibGVcbiAgICovXG4gIGdldCBodG1sSW1hZ2VFbGVtZW50KCkge1xuICAgIHJldHVybiB0aGlzLl9faHRtbEltYWdlRWxlbWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIG9yIGNyZWF0ZXMgYW4gSFRNTCBjYW52YXMgZWxlbWVudCB3aXRoIHRoZSB0ZXh0dXJlIGNvbnRlbnQuXG4gICAqIElmIGFuIGltYWdlIGVsZW1lbnQgZXhpc3RzLCBpdCB3aWxsIGJlIGRyYXduIG9udG8gdGhlIGNhbnZhcy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIEhUTUwgY2FudmFzIGVsZW1lbnQgY29udGFpbmluZyB0aGUgdGV4dHVyZSBkYXRhXG4gICAqL1xuICBnZXQgaHRtbENhbnZhc0VsZW1lbnQoKSB7XG4gICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgY29uc3QgY3R4ID0gY2FudmFzPy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIHRoaXMuX19odG1sQ2FudmFzRWxlbWVudCA9IGNhbnZhcztcbiAgICBpZiAoSXMuZXhpc3QoY3R4KSAmJiBJcy5leGlzdCh0aGlzLl9faHRtbEltYWdlRWxlbWVudCkpIHtcbiAgICAgIGNhbnZhcy53aWR0aCA9IHRoaXMuX19odG1sSW1hZ2VFbGVtZW50LndpZHRoO1xuICAgICAgY2FudmFzLmhlaWdodCA9IHRoaXMuX19odG1sSW1hZ2VFbGVtZW50LmhlaWdodDtcbiAgICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5fX2h0bWxJbWFnZUVsZW1lbnQsIDAsIDAsIHRoaXMuX19odG1sSW1hZ2VFbGVtZW50LndpZHRoLCB0aGlzLl9faHRtbEltYWdlRWxlbWVudC5oZWlnaHQpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX2h0bWxDYW52YXNFbGVtZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIFVSSS9VUkwgb2YgdGhlIHRleHR1cmUgc291cmNlLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgdGV4dHVyZSBVUkkgb3IgdW5kZWZpbmVkIGlmIG5vdCBzZXRcbiAgICovXG4gIGdldCB1cmkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX191cmk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbmFtZSBvZiB0aGUgdGV4dHVyZS5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgLSBUaGUgbmV3IHRleHR1cmUgbmFtZVxuICAgKi9cbiAgc2V0IG5hbWUobmFtZTogc3RyaW5nKSB7XG4gICAgdGhpcy5fX25hbWUgPSBuYW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG5hbWUgb2YgdGhlIHRleHR1cmUuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB0ZXh0dXJlIG5hbWVcbiAgICovXG4gIGdldCBuYW1lKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX19uYW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBpbWFnZSBkYXRhIGZyb20gYSByZWN0YW5ndWxhciByZWdpb24gb2YgdGhlIHRleHR1cmUuXG4gICAqIENyZWF0ZXMgYW4gaW50ZXJuYWwgY2FudmFzIGNvbnRleHQgaWYgb25lIGRvZXNuJ3QgZXhpc3QuXG4gICAqXG4gICAqIEBwYXJhbSB4IC0gVGhlIHgtY29vcmRpbmF0ZSBvZiB0aGUgdG9wLWxlZnQgY29ybmVyXG4gICAqIEBwYXJhbSB5IC0gVGhlIHktY29vcmRpbmF0ZSBvZiB0aGUgdG9wLWxlZnQgY29ybmVyXG4gICAqIEBwYXJhbSB3aWR0aCAtIFRoZSB3aWR0aCBvZiB0aGUgcmVnaW9uXG4gICAqIEBwYXJhbSBoZWlnaHQgLSBUaGUgaGVpZ2h0IG9mIHRoZSByZWdpb25cbiAgICogQHJldHVybnMgSW1hZ2VEYXRhIG9iamVjdCBjb250YWluaW5nIHRoZSBwaXhlbCBkYXRhXG4gICAqL1xuICBnZXRJbWFnZURhdGEoeDogSW5kZXgsIHk6IEluZGV4LCB3aWR0aDogU2l6ZSwgaGVpZ2h0OiBTaXplKSB7XG4gICAgaWYgKHRoaXMuX19jYW52YXNDb250ZXh0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuY3JlYXRlSW50ZXJuYWxDYW52YXNDb250ZXh0KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuICh0aGlzLl9fY2FudmFzQ29udGV4dCBhcyBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpLmdldEltYWdlRGF0YSh4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgc2luZ2xlIHBpeGVsIHZhbHVlIGF0IHRoZSBzcGVjaWZpZWQgY29vcmRpbmF0ZXMgYXMgYSBzcGVjaWZpYyB0eXBlLlxuICAgKiBTdXBwb3J0cyB2YXJpb3VzIGNvbG9yIGFuZCB2ZWN0b3IgdHlwZXMgZm9yIGRpZmZlcmVudCB1c2UgY2FzZXMuXG4gICAqXG4gICAqIEBwYXJhbSB4IC0gVGhlIHgtY29vcmRpbmF0ZSBvZiB0aGUgcGl4ZWxcbiAgICogQHBhcmFtIHkgLSBUaGUgeS1jb29yZGluYXRlIG9mIHRoZSBwaXhlbFxuICAgKiBAcGFyYW0gdHlwZUNsYXNzIC0gVGhlIGNsYXNzIHR5cGUgdG8gcmV0dXJuIHRoZSBwaXhlbCBhcyAoQ29sb3JSZ2IsIENvbG9yUmdiYSwgVmVjdG9yMywgZXRjLilcbiAgICogQHJldHVybnMgQW4gaW5zdGFuY2Ugb2YgdGhlIHNwZWNpZmllZCB0eXBlIGNvbnRhaW5pbmcgdGhlIHBpeGVsIGRhdGFcbiAgICovXG4gIGdldFBpeGVsQXMoXG4gICAgeDogSW5kZXgsXG4gICAgeTogSW5kZXgsXG4gICAgdHlwZUNsYXNzOlxuICAgICAgfCB0eXBlb2YgQ29sb3JSZ2JcbiAgICAgIHwgdHlwZW9mIENvbG9yUmdiYVxuICAgICAgfCB0eXBlb2YgVmVjdG9yM1xuICAgICAgfCB0eXBlb2YgTXV0YWJsZVZlY3RvcjNcbiAgICAgIHwgdHlwZW9mIFZlY3RvcjRcbiAgICAgIHwgdHlwZW9mIE11dGFibGVWZWN0b3I0XG4gICkge1xuICAgIGNvbnN0IHBpeGVsID0gdGhpcy5nZXRJbWFnZURhdGEoeCwgeSwgMSwgMSk7XG4gICAgY29uc3QgZGF0YSA9IHBpeGVsLmRhdGE7XG4gICAgaWYgKHR5cGVDbGFzcy5jb21wb3NpdGlvblR5cGUgPT09IENvbXBvc2l0aW9uVHlwZS5WZWM0KSB7XG4gICAgICByZXR1cm4gbmV3ICh0eXBlQ2xhc3MgYXMgYW55KShuZXcgRmxvYXQzMkFycmF5KFtkYXRhWzBdLCBkYXRhWzFdLCBkYXRhWzJdLCBkYXRhWzNdXSkpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3ICh0eXBlQ2xhc3MgYXMgYW55KShuZXcgRmxvYXQzMkFycmF5KFtkYXRhWzBdLCBkYXRhWzFdLCBkYXRhWzJdXSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHBpeGVsIGRhdGEgYXQgdGhlIHNwZWNpZmllZCBjb29yZGluYXRlcyBhcyBhIHJhdyBVaW50OENsYW1wZWRBcnJheS5cbiAgICogVGhpcyBwcm92aWRlcyBkaXJlY3QgYWNjZXNzIHRvIHRoZSBSR0JBIHZhbHVlcyBhcyA4LWJpdCBpbnRlZ2Vycy5cbiAgICpcbiAgICogQHBhcmFtIHggLSBUaGUgeC1jb29yZGluYXRlIG9mIHRoZSBwaXhlbFxuICAgKiBAcGFyYW0geSAtIFRoZSB5LWNvb3JkaW5hdGUgb2YgdGhlIHBpeGVsXG4gICAqIEByZXR1cm5zIEEgVWludDhDbGFtcGVkQXJyYXkgY29udGFpbmluZyB0aGUgUkdCQSBwaXhlbCBkYXRhXG4gICAqL1xuICBnZXRQaXhlbEFzQXJyYXkoeDogSW5kZXgsIHk6IEluZGV4KTogVWludDhDbGFtcGVkQXJyYXkge1xuICAgIGNvbnN0IHBpeGVsID0gdGhpcy5nZXRJbWFnZURhdGEoeCwgeSwgMSwgMSk7XG4gICAgcmV0dXJuIHBpeGVsLmRhdGE7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIHBpeGVsIHZhbHVlIGF0IHRoZSBzcGVjaWZpZWQgY29vcmRpbmF0ZXMgdXNpbmcgYSBjb2xvciBvciB2ZWN0b3Igb2JqZWN0LlxuICAgKiBBdXRvbWF0aWNhbGx5IGRldGVybWluZXMgdGhlIG51bWJlciBvZiBjb21wb25lbnRzIGJhc2VkIG9uIHRoZSBpbnB1dCB0eXBlLlxuICAgKlxuICAgKiBAcGFyYW0geCAtIFRoZSB4LWNvb3JkaW5hdGUgb2YgdGhlIHBpeGVsXG4gICAqIEBwYXJhbSB5IC0gVGhlIHktY29vcmRpbmF0ZSBvZiB0aGUgcGl4ZWxcbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIGNvbG9yIG9yIHZlY3RvciB2YWx1ZSB0byBzZXRcbiAgICovXG4gIHNldFBpeGVsKHg6IEluZGV4LCB5OiBJbmRleCwgdmFsdWU6IENvbG9yUmdiIHwgQ29sb3JSZ2JhIHwgVmVjdG9yMyB8IE11dGFibGVWZWN0b3IzIHwgVmVjdG9yNCB8IE11dGFibGVWZWN0b3I0KSB7XG4gICAgY29uc3QgcGl4ZWwgPSB0aGlzLmdldEltYWdlRGF0YSh4LCB5LCAxLCAxKTtcbiAgICBjb25zdCBkYXRhID0gcGl4ZWwuZGF0YTtcbiAgICBjb25zdCBjbGFzc09mVmFsdWUgPSB2YWx1ZS5jb25zdHJ1Y3RvciBhcyB1bmtub3duIGFzIHtcbiAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlRW51bTsgLy8gdmFsdWUuY29uc3RydWN0b3IgbmVlZHMgdG8gaGF2ZSBjb21wb3NpdGlvblR5cGUgb25seVxuICAgIH07XG5cbiAgICBjb25zdCBudW1iZXJPZkNvbXBvbmVudHMgPSBjbGFzc09mVmFsdWUuY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtYmVyT2ZDb21wb25lbnRzOyBpKyspIHtcbiAgICAgIGRhdGFbaV0gPSB2YWx1ZS5hdChpKTtcbiAgICB9XG4gICAgdGhpcy5fX2NhbnZhc0NvbnRleHQhLnB1dEltYWdlRGF0YShwaXhlbCwgeCwgeSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIHNwZWNpZmljIGNoYW5uZWwgdmFsdWUgZm9yIGEgcGl4ZWwgYXQgdGhlIGdpdmVuIGNvb3JkaW5hdGVzLlxuICAgKiBVc2VmdWwgZm9yIG1vZGlmeWluZyBpbmRpdmlkdWFsIGNvbG9yIGNoYW5uZWxzIChSLCBHLCBCLCBBKS5cbiAgICpcbiAgICogQHBhcmFtIHggLSBUaGUgeC1jb29yZGluYXRlIG9mIHRoZSBwaXhlbFxuICAgKiBAcGFyYW0geSAtIFRoZSB5LWNvb3JkaW5hdGUgb2YgdGhlIHBpeGVsXG4gICAqIEBwYXJhbSBjaGFubmVsSWR4IC0gVGhlIGNoYW5uZWwgaW5kZXggKDA9UiwgMT1HLCAyPUIsIDM9QSlcbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIG5ldyB2YWx1ZSBmb3IgdGhlIGNoYW5uZWwgKDAtMjU1KVxuICAgKi9cbiAgc2V0UGl4ZWxBdENoYW5uZWwoeDogSW5kZXgsIHk6IEluZGV4LCBjaGFubmVsSWR4OiBJbmRleCwgdmFsdWU6IG51bWJlcikge1xuICAgIGNvbnN0IHBpeGVsID0gdGhpcy5nZXRJbWFnZURhdGEoeCwgeSwgMSwgMSk7XG4gICAgY29uc3QgZGF0YSA9IHBpeGVsLmRhdGE7XG4gICAgZGF0YVtjaGFubmVsSWR4XSA9IHZhbHVlO1xuICAgIHRoaXMuX19jYW52YXNDb250ZXh0IS5wdXRJbWFnZURhdGEocGl4ZWwsIHgsIHkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgdGV4dHVyZSBjb250YWlucyB0cmFuc3BhcmVudCBwaXhlbHMuXG4gICAqXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIHRleHR1cmUgaGFzIHRyYW5zcGFyZW5jeSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBnZXQgaXNUcmFuc3BhcmVudCgpIHtcbiAgICByZXR1cm4gdGhpcy5fX2hhc1RyYW5zcGFyZW50UGl4ZWxzO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gaW50ZXJuYWwgY2FudmFzIGNvbnRleHQgZm9yIHBpeGVsIG1hbmlwdWxhdGlvbiBvcGVyYXRpb25zLlxuICAgKiBVc2VzIGV4aXN0aW5nIGNhbnZhcyBlbGVtZW50IGlmIGF2YWlsYWJsZSwgb3RoZXJ3aXNlIGNyZWF0ZXMgYSBuZXcgb25lLlxuICAgKi9cbiAgY3JlYXRlSW50ZXJuYWxDYW52YXNDb250ZXh0KCkge1xuICAgIGxldCBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50O1xuICAgIGlmICh0aGlzLl9faHRtbENhbnZhc0VsZW1lbnQgIT0gbnVsbCkge1xuICAgICAgY2FudmFzID0gdGhpcy5fX2h0bWxDYW52YXNFbGVtZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgIGNhbnZhcy53aWR0aCA9IHRoaXMud2lkdGg7XG4gICAgICBjYW52YXMuaGVpZ2h0ID0gdGhpcy5oZWlnaHQ7XG4gICAgfVxuICAgIHRoaXMuX19odG1sQ2FudmFzRWxlbWVudCA9IGNhbnZhcztcbiAgICB0aGlzLl9fY2FudmFzQ29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpITtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyB0aGUgdGV4dHVyZSBkYXRhIHRvIGEgVGV4dHVyZURhdGFGbG9hdCBvYmplY3Qgd2l0aCB0aGUgc3BlY2lmaWVkIG51bWJlciBvZiBjaGFubmVscy5cbiAgICogVGhpcyBpcyB1c2VmdWwgZm9yIHByb2Nlc3NpbmcgdGV4dHVyZSBkYXRhIGluIGZsb2F0aW5nLXBvaW50IGZvcm1hdC5cbiAgICpcbiAgICogQHBhcmFtIGNoYW5uZWxzIC0gVGhlIG51bWJlciBvZiBjaGFubmVscyB0byBpbmNsdWRlIGluIHRoZSBvdXRwdXQgKDEtNClcbiAgICogQHJldHVybnMgQSBUZXh0dXJlRGF0YUZsb2F0IG9iamVjdCBjb250YWluaW5nIHRoZSBjb252ZXJ0ZWQgcGl4ZWwgZGF0YVxuICAgKi9cbiAgZ2V0VGV4dHVyZURhdGFGbG9hdChjaGFubmVsczogU2l6ZSk6IFRleHR1cmVEYXRhRmxvYXQge1xuICAgIGNvbnN0IHBpeGVsID0gdGhpcy5nZXRJbWFnZURhdGEoMCwgMCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIGNvbnN0IHRleHR1cmVEYXRhRmxvYXQgPSBuZXcgVGV4dHVyZURhdGFGbG9hdCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwgY2hhbm5lbHMpO1xuICAgIGNvbnN0IGRhdGEgPSBwaXhlbC5kYXRhO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5oZWlnaHQ7IGkrKykge1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLndpZHRoOyBqKyspIHtcbiAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBjaGFubmVsczsgaysrKSB7XG4gICAgICAgICAgdGV4dHVyZURhdGFGbG9hdC5zZXRQaXhlbEF0Q2hhbm5lbChqLCBpLCBrLCBkYXRhW2kgKiB0aGlzLndpZHRoICogNCArIGogKiA0ICsga10gLyAyNTUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0ZXh0dXJlRGF0YUZsb2F0O1xuICB9XG5cbiAgLyoqXG4gICAqIFJlYWRzIHRoZSB0ZXh0dXJlIGRhdGEgZnJvbSBHUFUgYW5kIHJldHVybnMgaXQgYXMgYSBVaW50OEFycmF5LlxuICAgKiBUaGlzIG1ldGhvZCB3b3JrcyB3aXRoIGJvdGggV2ViR0wgYW5kIFdlYkdQVSBiYWNrZW5kcy5cbiAgICogVXNlZnVsIGZvciB0ZXh0dXJlcyB0aGF0IGRvbid0IGhhdmUgYW4gYXNzb2NpYXRlZCBodG1sSW1hZ2VFbGVtZW50IChlLmcuLCBkdW1teSB0ZXh0dXJlcykuXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgcmVzb2x2aW5nIHRvIHRoZSBwaXhlbCBkYXRhIGFzIGEgVWludDhBcnJheSBpbiBSR0JBIGZvcm1hdCxcbiAgICogICAgICAgICAgb3IgdW5kZWZpbmVkIGlmIHRoZSB0ZXh0dXJlIGlzIG5vdCByZWFkeSBvciByZWFkaW5nIGZhaWxzXG4gICAqL1xuICBhc3luYyBnZXRUZXh0dXJlUGl4ZWxEYXRhRnJvbUdQVSgpOiBQcm9taXNlPFVpbnQ4QXJyYXkgfCB1bmRlZmluZWQ+IHtcbiAgICBpZiAoIXRoaXMuX19pc1RleHR1cmVSZWFkeSB8fCB0aGlzLl90ZXh0dXJlUmVzb3VyY2VVaWQgPCAwIHx8IHRoaXMuX193aWR0aCA8PSAwIHx8IHRoaXMuX19oZWlnaHQgPD0gMCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLmNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgICAgY29uc3QgcGl4ZWxzID0gYXdhaXQgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkuZ2V0UGl4ZWxEYXRhRnJvbVRleHR1cmVBc3luYyhcbiAgICAgICAgdGhpcy5fdGV4dHVyZVJlc291cmNlVWlkLFxuICAgICAgICAwLFxuICAgICAgICAwLFxuICAgICAgICB0aGlzLl9fd2lkdGgsXG4gICAgICAgIHRoaXMuX19oZWlnaHRcbiAgICAgICk7XG4gICAgICByZXR1cm4gcGl4ZWxzO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUud2FybignRmFpbGVkIHRvIHJlYWQgdGV4dHVyZSBwaXhlbCBkYXRhIGZyb20gR1BVOicsIGUpO1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBIVE1MQ2FudmFzRWxlbWVudCBjb250YWluaW5nIHRoZSB0ZXh0dXJlIGRhdGEgcmVhZCBmcm9tIEdQVS5cbiAgICogVGhpcyBpcyB1c2VmdWwgZm9yIGRpc3BsYXlpbmcgdGV4dHVyZSBwcmV2aWV3cyB3aGVuIGh0bWxJbWFnZUVsZW1lbnQgaXMgbm90IGF2YWlsYWJsZS5cbiAgICogV29ya3Mgd2l0aCBib3RoIFdlYkdMIGFuZCBXZWJHUFUgYmFja2VuZHMuXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgcmVzb2x2aW5nIHRvIGFuIEhUTUxDYW52YXNFbGVtZW50IHdpdGggdGhlIHRleHR1cmUgY29udGVudCxcbiAgICogICAgICAgICAgb3IgdW5kZWZpbmVkIGlmIHRoZSB0ZXh0dXJlIGlzIG5vdCByZWFkeSBvciByZWFkaW5nIGZhaWxzXG4gICAqL1xuICBhc3luYyBjcmVhdGVDYW52YXNGcm9tR1BVKCk6IFByb21pc2U8SFRNTENhbnZhc0VsZW1lbnQgfCB1bmRlZmluZWQ+IHtcbiAgICBjb25zdCBwaXhlbHMgPSBhd2FpdCB0aGlzLmdldFRleHR1cmVQaXhlbERhdGFGcm9tR1BVKCk7XG4gICAgaWYgKCFwaXhlbHMgfHwgcGl4ZWxzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICBjYW52YXMud2lkdGggPSB0aGlzLl9fd2lkdGg7XG4gICAgY2FudmFzLmhlaWdodCA9IHRoaXMuX19oZWlnaHQ7XG4gICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgaWYgKCFjdHgpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIEltYWdlRGF0YSBmcm9tIHRoZSBwaXhlbCBhcnJheVxuICAgIGNvbnN0IGltYWdlRGF0YSA9IG5ldyBJbWFnZURhdGEobmV3IFVpbnQ4Q2xhbXBlZEFycmF5KHBpeGVscyksIHRoaXMuX193aWR0aCwgdGhpcy5fX2hlaWdodCk7XG4gICAgY3R4LnB1dEltYWdlRGF0YShpbWFnZURhdGEsIDAsIDApO1xuXG4gICAgcmV0dXJuIGNhbnZhcztcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMscUJBQTZDO0FBQ3RELFNBQVMsdUJBQWlEO0FBQzFELFNBQVMsbUJBQXlDO0FBQ2xELFNBQVMscUJBQTZDO0FBT3RELFNBQVMsVUFBVTtBQUdu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QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVBLE1BQU0sc0JBQThEO0FBQ2xFLFVBQU0sU0FBUyxNQUFNLEtBQUssMkJBQTJCO0FBQ3JELFFBQUksQ0FBQyxVQUFVLE9BQU8sV0FBVyxHQUFHO0FBQ2xDLGFBQU87QUFBQSxJQUNUO0FBRUEsVUFBTSxTQUFTLFNBQVMsY0FBYyxRQUFRO0FBQzlDLFdBQU8sUUFBUSxLQUFLRDtBQUNwQixXQUFPLFNBQVMsS0FBS0M7QUFDckIsVUFBTSxNQUFNLE9BQU8sV0FBVyxJQUFJO0FBQ2xDLFFBQUksQ0FBQyxLQUFLO0FBQ1IsYUFBTztBQUFBLElBQ1Q7QUFHQSxVQUFNLFlBQVksSUFBSSxVQUFVLElBQUksa0JBQWtCLE1BQU0sR0FBRyxLQUFLRCxJQUFTLEtBQUtDLEVBQVE7QUFDMUYsUUFBSSxhQUFhLFdBQVcsR0FBRyxDQUFDO0FBRWhDLFdBQU87QUFBQSxFQUNUO0FBQ0Y7QUE1WXNCLGlCQWFJLG9CQUFnQztBQWJwQyxpQkFjTFksS0FBZ0MsaUJBQWdCO0FBZDFELElBQWUsa0JBQWY7IiwKICAibmFtZXMiOiBbIl9fd2lkdGgiLCAiX19oZWlnaHQiLCAiX19sZXZlbCIsICJfX21pcExldmVsQ291bnQiLCAiX19pbnRlcm5hbEZvcm1hdCIsICJfX2Zvcm1hdCIsICJfX3R5cGUiLCAiX19oYXNUcmFuc3BhcmVudFBpeGVscyIsICJfX2lzRHVtbXlUZXh0dXJlIiwgIl9faXNUZXh0dXJlUmVhZHkiLCAiX19zdGFydGVkVG9Mb2FkIiwgIl9fbmFtZSIsICJfX3RleHR1cmVVaWQiLCAiX190ZXh0dXJlVWlkQ291bnQiLCAiX19lbmdpbmUiLCAiX19odG1sSW1hZ2VFbGVtZW50IiwgIl9faHRtbENhbnZhc0VsZW1lbnQiLCAiX191cmkiLCAiX19jYW52YXNDb250ZXh0Il0KfQo=
