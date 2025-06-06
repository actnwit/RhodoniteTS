import { type Size, type Index, FloatTypedArrayConstructor, type TypedArrayConstructor } from '../../types/CommonTypes';
import type { ColorRgb } from '../math/ColorRgb';
import type { ColorRgba } from '../math/ColorRgba';

/**
 * A class for handling floating-point texture data with support for multi-channel pixels.
 * This class provides methods to manipulate texture data stored as Float32Array,
 * allowing for high-precision color and data storage in textures.
 */
export class TextureDataFloat {
  private __data: Float32Array;
  private __channels: number;
  private __width: number;
  private __height: number;

  /**
   * Creates a new TextureDataFloat instance with the specified dimensions and channel count.
   * @param width - The width of the texture in pixels
   * @param height - The height of the texture in pixels
   * @param channels - The number of channels per pixel (e.g., 3 for RGB, 4 for RGBA)
   */
  constructor(width: number, height: number, channels: number) {
    this.__channels = channels;
    this.__width = width;
    this.__height = height;
    this.__data = new Float32Array(width * height * channels);
  }

  /**
   * Resizes the texture data to new dimensions and channel count.
   * Existing data is preserved where possible during the resize operation.
   * @param width - The new width of the texture in pixels
   * @param height - The new height of the texture in pixels
   * @param channels - The new number of channels per pixel
   */
  resize(width: number, height: number, channels: number) {
    this.__width = width;
    this.__height = height;
    this.__channels = channels;
    this.__data = new Float32Array(TextureDataFloat.transfer(this.__data.buffer, width * height * channels * 4));
  }

  /**
   * Sets the value of a specific channel at the given pixel coordinates.
   * @param x - The x-coordinate of the pixel
   * @param y - The y-coordinate of the pixel
   * @param channelIdx - The index of the channel to set (0-based)
   * @param value - The floating-point value to set for the channel
   */
  setPixelAtChannel(x: Index, y: Index, channelIdx: Index, value: number) {
    this.__data[y * this.__width * this.__channels + x * this.__channels + channelIdx] = value;
  }

  /**
   * Gets the width of the texture in pixels.
   * @returns The width of the texture
   */
  get width() {
    return this.__width;
  }

  /**
   * Gets the height of the texture in pixels.
   * @returns The height of the texture
   */
  get height() {
    return this.__height;
  }

  /**
   * Gets the underlying Float32Array containing the texture data.
   * @returns The raw texture data as Float32Array
   */
  get data() {
    return this.__data;
  }

  /**
   * Gets the value of a specific channel at the given pixel coordinates.
   * @param x - The x-coordinate of the pixel
   * @param y - The y-coordinate of the pixel
   * @param channelIdx - The index of the channel to retrieve (0-based)
   * @returns The floating-point value of the specified channel
   */
  getPixel(x: Index, y: Index, channelIdx: Index) {
    return this.__data[y * this.__width * this.__channels + x * this.__channels + channelIdx];
  }

  /**
   * Gets pixel data as a color object (ColorRgb or ColorRgba) at the specified coordinates.
   * @param x - The x-coordinate of the pixel
   * @param y - The y-coordinate of the pixel
   * @param channels - The number of channels to read (3 for RGB, 4 for RGBA)
   * @param typeClass - The color class constructor (ColorRgb or ColorRgba)
   * @returns A new instance of the specified color class containing the pixel data
   */
  getPixelAs(x: Index, y: Index, channels: Size, typeClass: typeof ColorRgb | typeof ColorRgba) {
    if (channels === 3) {
      return new (typeClass as any)(
        new Float32Array([
          this.__data[y * this.__width * this.__channels + x * this.__channels + 0],
          this.__data[y * this.__width * this.__channels + x * this.__channels + 1],
          this.__data[y * this.__width * this.__channels + x * this.__channels + 2],
        ])
      );
    } else if (channels === 4) {
      return new (typeClass as any)(
        new Float32Array([
          this.__data[y * this.__width * this.__channels + x * this.__channels + 0],
          this.__data[y * this.__width * this.__channels + x * this.__channels + 1],
          this.__data[y * this.__width * this.__channels + x * this.__channels + 2],
          this.__data[y * this.__width * this.__channels + x * this.__channels + 3],
        ])
      );
    }
  }

  /**
   * Gets all channel values for a pixel at the specified coordinates as an array.
   * @param x - The x-coordinate of the pixel
   * @param y - The y-coordinate of the pixel
   * @returns An array containing all channel values for the pixel
   */
  getPixelAsArray(x: Index, y: Index) {
    const array = [];
    for (let i = 0; i < this.__channels; i++) {
      array.push(this.__data[y * this.__width * this.__channels + x * this.__channels + i]);
    }
    return array;
  }

  /**
   * Initializes the texture data with new dimensions and channel count.
   * This method creates a new Float32Array, discarding any existing data.
   * @param width - The width of the texture in pixels
   * @param height - The height of the texture in pixels
   * @param channels - The number of channels per pixel
   */
  initialize(width: number, height: number, channels: number) {
    this.__width = width;
    this.__height = height;
    this.__channels = channels;
    this.__data = new Float32Array(width * height * channels);
  }

  /**
   * Transfers data from a source ArrayBuffer to a new ArrayBuffer with the specified length.
   * This is a utility method for efficiently copying array buffer data with different word sizes.
   * @param source - The source ArrayBuffer to copy data from
   * @param length - The length of the destination ArrayBuffer in bytes
   * @returns A new ArrayBuffer containing the transferred data
   * @throws {TypeError} If source or destination is not an ArrayBuffer instance
   */
  static transfer(source: any, length: number) {
    source = Object(source);
    const dest = new ArrayBuffer(length);
    if (!(source instanceof ArrayBuffer) || !(dest instanceof ArrayBuffer)) {
      throw new TypeError('Source and destination must be ArrayBuffer instances');
    }
    if (dest.byteLength >= source.byteLength) {
      let nextOffset = 0;
      let leftBytes = source.byteLength;
      const wordSizes = [8, 4, 2, 1];
      wordSizes.forEach(_wordSize_ => {
        if (leftBytes >= _wordSize_) {
          const done = transferWith(_wordSize_, source, dest, nextOffset, leftBytes);
          nextOffset = done.nextOffset;
          leftBytes = done.leftBytes;
        }
      });
    }
    return dest;

    /**
     * Internal helper function to transfer data using specific word sizes for optimization.
     * @param wordSize - The size of each data unit to transfer (1, 2, 4, or 8 bytes)
     * @param source - The source ArrayBuffer
     * @param dest - The destination ArrayBuffer
     * @param nextOffset - The current offset in bytes
     * @param leftBytes - The remaining bytes to transfer
     * @returns An object containing the next offset and remaining bytes
     */
    function transferWith(wordSize: number, source: any, dest: any, nextOffset: number, leftBytes: number) {
      let ViewClass: TypedArrayConstructor = Uint8Array;
      switch (wordSize) {
        case 8:
          ViewClass = Float64Array;
          break;
        case 4:
          ViewClass = Float32Array;
          break;
        case 2:
          ViewClass = Uint16Array;
          break;
        case 1:
          ViewClass = Uint8Array;
          break;
        default:
          ViewClass = Uint8Array;
          break;
      }
      const view_source = new ViewClass(source, nextOffset, Math.trunc(leftBytes / wordSize));
      const view_dest = new ViewClass(dest, nextOffset, Math.trunc(leftBytes / wordSize));
      for (let i = 0; i < view_dest.length; i++) {
        view_dest[i] = view_source[i];
      }
      return {
        nextOffset: view_source.byteOffset + view_source.byteLength,
        leftBytes: source.byteLength - (view_source.byteOffset + view_source.byteLength),
      };
    }
  }
}
