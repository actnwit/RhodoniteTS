import type { Index, Size } from '../../types/CommonTypes';
import type { ColorRgb } from '../math/ColorRgb';
import type { ColorRgba } from '../math/ColorRgba';
/**
 * A class for handling floating-point texture data with support for multi-channel pixels.
 * This class provides methods to manipulate texture data stored as Float32Array,
 * allowing for high-precision color and data storage in textures.
 */
export declare class TextureDataFloat {
    private __data;
    private __channels;
    private __width;
    private __height;
    /**
     * Creates a new TextureDataFloat instance with the specified dimensions and channel count.
     * @param width - The width of the texture in pixels
     * @param height - The height of the texture in pixels
     * @param channels - The number of channels per pixel (e.g., 3 for RGB, 4 for RGBA)
     */
    constructor(width: number, height: number, channels: number);
    /**
     * Resizes the texture data to new dimensions and channel count.
     * Existing data is preserved where possible during the resize operation.
     * @param width - The new width of the texture in pixels
     * @param height - The new height of the texture in pixels
     * @param channels - The new number of channels per pixel
     */
    resize(width: number, height: number, channels: number): void;
    /**
     * Sets the value of a specific channel at the given pixel coordinates.
     * @param x - The x-coordinate of the pixel
     * @param y - The y-coordinate of the pixel
     * @param channelIdx - The index of the channel to set (0-based)
     * @param value - The floating-point value to set for the channel
     */
    setPixelAtChannel(x: Index, y: Index, channelIdx: Index, value: number): void;
    /**
     * Gets the width of the texture in pixels.
     * @returns The width of the texture
     */
    get width(): number;
    /**
     * Gets the height of the texture in pixels.
     * @returns The height of the texture
     */
    get height(): number;
    /**
     * Gets the underlying Float32Array containing the texture data.
     * @returns The raw texture data as Float32Array
     */
    get data(): Float32Array<ArrayBufferLike>;
    /**
     * Gets the value of a specific channel at the given pixel coordinates.
     * @param x - The x-coordinate of the pixel
     * @param y - The y-coordinate of the pixel
     * @param channelIdx - The index of the channel to retrieve (0-based)
     * @returns The floating-point value of the specified channel
     */
    getPixel(x: Index, y: Index, channelIdx: Index): number;
    /**
     * Gets pixel data as a color object (ColorRgb or ColorRgba) at the specified coordinates.
     * @param x - The x-coordinate of the pixel
     * @param y - The y-coordinate of the pixel
     * @param channels - The number of channels to read (3 for RGB, 4 for RGBA)
     * @param typeClass - The color class constructor (ColorRgb or ColorRgba)
     * @returns A new instance of the specified color class containing the pixel data
     */
    getPixelAs(x: Index, y: Index, channels: Size, typeClass: typeof ColorRgb | typeof ColorRgba): any;
    /**
     * Gets all channel values for a pixel at the specified coordinates as an array.
     * @param x - The x-coordinate of the pixel
     * @param y - The y-coordinate of the pixel
     * @returns An array containing all channel values for the pixel
     */
    getPixelAsArray(x: Index, y: Index): number[];
    /**
     * Initializes the texture data with new dimensions and channel count.
     * This method creates a new Float32Array, discarding any existing data.
     * @param width - The width of the texture in pixels
     * @param height - The height of the texture in pixels
     * @param channels - The number of channels per pixel
     */
    initialize(width: number, height: number, channels: number): void;
    /**
     * Transfers data from a source ArrayBuffer to a new ArrayBuffer with the specified length.
     * This is a utility method for efficiently copying array buffer data with different word sizes.
     * @param source - The source ArrayBuffer to copy data from
     * @param length - The length of the destination ArrayBuffer in bytes
     * @returns A new ArrayBuffer containing the transferred data
     * @throws {TypeError} If source or destination is not an ArrayBuffer instance
     */
    static transfer(source: any, length: number): ArrayBuffer;
}
