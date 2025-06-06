import { RnObject } from '../core/RnObject';
import { PixelFormat, PixelFormatEnum } from '../definitions/PixelFormat';
import { ComponentType, ComponentTypeEnum } from '../definitions/ComponentType';
import { CGAPIResourceHandle, TextureUID, Size, Index } from '../../types/CommonTypes';
import { TextureDataFloat } from './TextureDataFloat';
import { CompositionType, CompositionTypeEnum } from '../definitions/CompositionType';
import { ColorRgb } from '../math/ColorRgb';
import { ColorRgba } from '../math/ColorRgba';
import { MutableVector3 } from '../math/MutableVector3';
import { MutableVector4 } from '../math/MutableVector4';
import { Vector3 } from '../math/Vector3';
import { Vector4 } from '../math/Vector4';
import { Is } from '../misc/Is';
import { Sampler } from './Sampler';
import { TextureFormat, TextureFormatEnum } from '../definitions/TextureFormat';

/**
 * Abstract base class for all texture types in the Rhodonite engine.
 * Provides common functionality for texture management, pixel manipulation,
 * and resource handling across different texture implementations.
 *
 * @abstract
 * @extends RnObject
 */
export abstract class AbstractTexture extends RnObject {
  protected __width: Size = 0;
  protected __height: Size = 0;
  protected __level: Index = 0;
  protected __mipLevelCount: Index = 1;
  protected __internalFormat: TextureFormatEnum = TextureFormat.RGBA8;
  protected __format: PixelFormatEnum = PixelFormat.RGBA;
  protected __type: ComponentTypeEnum = ComponentType.UnsignedByte;

  protected __hasTransparentPixels = false;

  private static readonly InvalidTextureUid: TextureUID = -1;
  private static __textureUidCount: TextureUID = AbstractTexture.InvalidTextureUid;
  private __textureUid: TextureUID;
  protected __img?: HTMLImageElement;
  protected __isTextureReady = false;
  protected __startedToLoad = false;
  protected __htmlImageElement?: HTMLImageElement;
  protected __htmlCanvasElement?: HTMLCanvasElement;
  protected __canvasContext?: CanvasRenderingContext2D;
  protected __uri?: string;
  protected __name = 'untitled';
  public _textureResourceUid: CGAPIResourceHandle = -1;
  public _samplerResourceUid: CGAPIResourceHandle = -1;
  public _textureViewResourceUid: CGAPIResourceHandle = -1;
  public _textureViewAsRenderTargetResourceUid: CGAPIResourceHandle = -1;
  public _recommendedTextureSampler?: Sampler;

  /**
   * Creates a new AbstractTexture instance.
   * Automatically assigns a unique texture UID to this texture.
   */
  constructor() {
    super();
    this.__textureUid = ++AbstractTexture.__textureUidCount;
  }

  /**
   * Gets the unique identifier for this texture.
   *
   * @returns The unique texture UID
   */
  get textureUID() {
    return this.__textureUid;
  }

  /**
   * Gets the width of the texture in pixels.
   *
   * @returns The texture width
   */
  get width() {
    return this.__width;
  }

  /**
   * Calculates the width of the texture at a specific mip level.
   *
   * @param mipLevel - The mip level to calculate width for
   * @returns The width at the specified mip level (minimum 1 pixel)
   */
  getWidthAtMipLevel(mipLevel: Index) {
    return Math.max(1, Math.floor(this.__width / Math.pow(2, mipLevel)));
  }

  /**
   * Calculates the height of the texture at a specific mip level.
   *
   * @param mipLevel - The mip level to calculate height for
   * @returns The height at the specified mip level (minimum 1 pixel)
   */
  getHeightAtMipLevel(mipLevel: Index) {
    return Math.max(1, Math.floor(this.__height / Math.pow(2, mipLevel)));
  }

  /**
   * Sets the width of the texture in pixels.
   *
   * @param val - The new width value
   */
  set width(val: Size) {
    this.__width = val;
  }

  /**
   * Gets the height of the texture in pixels.
   *
   * @returns The texture height
   */
  get height() {
    return this.__height;
  }

  /**
   * Sets the height of the texture in pixels.
   *
   * @param val - The new height value
   */
  set height(val: Size) {
    this.__height = val;
  }

  /**
   * Checks if the texture is ready for use.
   *
   * @returns True if the texture is ready, false otherwise
   */
  get isTextureReady() {
    return this.__isTextureReady;
  }

  /**
   * Checks if the texture has started loading.
   *
   * @returns True if loading has started, false otherwise
   */
  get startedToLoad() {
    return this.__startedToLoad;
  }

  /**
   * Gets the HTML image element associated with this texture.
   *
   * @returns The HTML image element or undefined if not available
   */
  get htmlImageElement() {
    return this.__htmlImageElement;
  }

  /**
   * Gets or creates an HTML canvas element with the texture content.
   * If an image element exists, it will be drawn onto the canvas.
   *
   * @returns The HTML canvas element containing the texture data
   */
  get htmlCanvasElement() {
    const canvas = document.createElement('canvas');
    const ctx = canvas?.getContext('2d');
    this.__htmlCanvasElement = canvas;
    if (Is.exist(ctx) && Is.exist(this.__htmlImageElement)) {
      canvas.width = this.__htmlImageElement.width;
      canvas.height = this.__htmlImageElement.height;
      ctx.drawImage(this.__htmlImageElement, 0, 0, this.__htmlImageElement.width, this.__htmlImageElement.height);
    }
    return this.__htmlCanvasElement;
  }

  /**
   * Gets the URI/URL of the texture source.
   *
   * @returns The texture URI or undefined if not set
   */
  get uri() {
    return this.__uri;
  }

  /**
   * Sets the name of the texture.
   *
   * @param name - The new texture name
   */
  set name(name: string) {
    this.__name = name;
  }

  /**
   * Gets the name of the texture.
   *
   * @returns The texture name
   */
  get name(): string {
    return this.__name;
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
  getImageData(x: Index, y: Index, width: Size, height: Size) {
    if (this.__canvasContext === undefined) {
      this.createInternalCanvasContext();
    }

    return (this.__canvasContext as CanvasRenderingContext2D).getImageData(x, y, width, height);
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
  getPixelAs(
    x: Index,
    y: Index,
    typeClass:
      | typeof ColorRgb
      | typeof ColorRgba
      | typeof Vector3
      | typeof MutableVector3
      | typeof Vector4
      | typeof MutableVector4
  ) {
    const pixel = this.getImageData(x, y, 1, 1);
    const data = pixel.data;
    if (typeClass.compositionType === CompositionType.Vec4) {
      return new (typeClass as any)(new Float32Array([data[0], data[1], data[2], data[3]]));
    } else {
      return new (typeClass as any)(new Float32Array([data[0], data[1], data[2]]));
    }
  }

  /**
   * Gets the pixel data at the specified coordinates as a raw Uint8ClampedArray.
   * This provides direct access to the RGBA values as 8-bit integers.
   *
   * @param x - The x-coordinate of the pixel
   * @param y - The y-coordinate of the pixel
   * @returns A Uint8ClampedArray containing the RGBA pixel data
   */
  getPixelAsArray(x: Index, y: Index): Uint8ClampedArray {
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
  setPixel(x: Index, y: Index, value: ColorRgb | ColorRgba | Vector3 | MutableVector3 | Vector4 | MutableVector4) {
    const pixel = this.getImageData(x, y, 1, 1);
    const data = pixel.data;
    const classOfValue = value.constructor as unknown as {
      compositionType: CompositionTypeEnum; // value.constructor needs to have compositionType only
    };

    const numberOfComponents = classOfValue.compositionType.getNumberOfComponents();
    for (let i = 0; i < numberOfComponents; i++) {
      data[i] = value.at(i);
    }
    this.__canvasContext!.putImageData(pixel, x, y);
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
  setPixelAtChannel(x: Index, y: Index, channelIdx: Index, value: number) {
    const pixel = this.getImageData(x, y, 1, 1);
    const data = pixel.data;
    data[channelIdx] = value;
    this.__canvasContext!.putImageData(pixel, x, y);
  }

  /**
   * Checks if the texture contains transparent pixels.
   *
   * @returns True if the texture has transparency, false otherwise
   */
  get isTransparent() {
    return this.__hasTransparentPixels;
  }

  /**
   * Creates an internal canvas context for pixel manipulation operations.
   * Uses existing canvas element if available, otherwise creates a new one.
   */
  createInternalCanvasContext() {
    let canvas;
    if (this.__htmlCanvasElement != null) {
      canvas = this.__htmlCanvasElement;
    } else {
      canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
    }
    this.__htmlCanvasElement = canvas;
    this.__canvasContext = canvas.getContext('2d')!;
  }

  /**
   * Converts the texture data to a TextureDataFloat object with the specified number of channels.
   * This is useful for processing texture data in floating-point format.
   *
   * @param channels - The number of channels to include in the output (1-4)
   * @returns A TextureDataFloat object containing the converted pixel data
   */
  getTextureDataFloat(channels: Size): TextureDataFloat {
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
}
