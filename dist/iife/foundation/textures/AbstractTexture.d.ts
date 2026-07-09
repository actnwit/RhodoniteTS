import type { CGAPIResourceHandle, Index, Size } from '../../types/CommonTypes';
import { RnObject } from '../core/RnObject';
import { type ComponentTypeEnum } from '../definitions/ComponentType';
import { type PixelFormatEnum } from '../definitions/PixelFormat';
import { type TextureFormatEnum } from '../definitions/TextureFormat';
import type { ColorRgb } from '../math/ColorRgb';
import type { ColorRgba } from '../math/ColorRgba';
import type { MutableVector3 } from '../math/MutableVector3';
import type { MutableVector4 } from '../math/MutableVector4';
import type { Vector3 } from '../math/Vector3';
import type { Vector4 } from '../math/Vector4';
import type { Engine } from '../system/Engine';
import type { Sampler } from './Sampler';
import { TextureDataFloat } from './TextureDataFloat';
/**
 * Abstract base class for all texture types in the Rhodonite engine.
 * Provides common functionality for texture management, pixel manipulation,
 * and resource handling across different texture implementations.
 *
 * @abstract
 * @extends RnObject
 */
export declare abstract class AbstractTexture extends RnObject {
    protected __engine: Engine;
    protected __width: Size;
    protected __height: Size;
    protected __level: Index;
    protected __mipLevelCount: Index;
    protected __internalFormat: TextureFormatEnum;
    protected __format: PixelFormatEnum;
    protected __type: ComponentTypeEnum;
    protected __hasTransparentPixels: boolean;
    protected __isDummyTexture: boolean;
    private static readonly InvalidTextureUid;
    private static __textureUidCount;
    private __textureUid;
    protected __img?: HTMLImageElement;
    protected __isTextureReady: boolean;
    protected __startedToLoad: boolean;
    protected __htmlImageElement?: HTMLImageElement;
    protected __htmlCanvasElement?: HTMLCanvasElement;
    protected __canvasContext?: CanvasRenderingContext2D;
    protected __uri?: string;
    protected __name: string;
    _textureResourceUid: CGAPIResourceHandle;
    _samplerResourceUid: CGAPIResourceHandle;
    _textureViewResourceUid: CGAPIResourceHandle;
    _textureViewAsRenderTargetResourceUid: CGAPIResourceHandle;
    _recommendedTextureSampler?: Sampler;
    /**
     * Creates a new AbstractTexture instance.
     * Automatically assigns a unique texture UID to this texture.
     */
    constructor(engine: Engine);
    /**
     * Gets the unique identifier for this texture.
     *
     * @returns The unique texture UID
     */
    get textureUID(): number;
    /**
     * Gets the width of the texture in pixels.
     *
     * @returns The texture width
     */
    get width(): Size;
    /**
     * Calculates the width of the texture at a specific mip level.
     *
     * @param mipLevel - The mip level to calculate width for
     * @returns The width at the specified mip level (minimum 1 pixel)
     */
    getWidthAtMipLevel(mipLevel: Index): number;
    /**
     * Calculates the height of the texture at a specific mip level.
     *
     * @param mipLevel - The mip level to calculate height for
     * @returns The height at the specified mip level (minimum 1 pixel)
     */
    getHeightAtMipLevel(mipLevel: Index): number;
    /**
     * Sets the width of the texture in pixels.
     *
     * @param val - The new width value
     */
    set width(val: Size);
    /**
     * Gets the height of the texture in pixels.
     *
     * @returns The texture height
     */
    get height(): Size;
    /**
     * Sets the height of the texture in pixels.
     *
     * @param val - The new height value
     */
    set height(val: Size);
    /**
     * Checks if the texture is ready for use.
     *
     * @returns True if the texture is ready, false otherwise
     */
    get isTextureReady(): boolean;
    /**
     * Checks if the texture has started loading.
     *
     * @returns True if loading has started, false otherwise
     */
    get startedToLoad(): boolean;
    /**
     * Checks whether this texture is marked as a dummy (placeholder) texture.
     *
     * @returns True if the texture is marked as dummy, false otherwise
     */
    get isDummyTexture(): boolean;
    /**
     * Marks this texture as a dummy (placeholder) texture.
     *
     * @param isDummy - Whether to mark the texture as dummy (default: true)
     */
    markAsDummyTexture(isDummy?: boolean): void;
    /**
     * Gets the HTML image element associated with this texture.
     *
     * @returns The HTML image element or undefined if not available
     */
    get htmlImageElement(): HTMLImageElement | undefined;
    /**
     * Gets or creates an HTML canvas element with the texture content.
     * If an image element exists, it will be drawn onto the canvas.
     *
     * @returns The HTML canvas element containing the texture data
     */
    get htmlCanvasElement(): HTMLCanvasElement;
    /**
     * Gets the URI/URL of the texture source.
     *
     * @returns The texture URI or undefined if not set
     */
    get uri(): string | undefined;
    /**
     * Sets the name of the texture.
     *
     * @param name - The new texture name
     */
    set name(name: string);
    /**
     * Gets the name of the texture.
     *
     * @returns The texture name
     */
    get name(): string;
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
    getImageData(x: Index, y: Index, width: Size, height: Size): ImageData;
    /**
     * Gets a single pixel value at the specified coordinates as a specific type.
     * Supports various color and vector types for different use cases.
     *
     * @param x - The x-coordinate of the pixel
     * @param y - The y-coordinate of the pixel
     * @param typeClass - The class type to return the pixel as (ColorRgb, ColorRgba, Vector3, etc.)
     * @returns An instance of the specified type containing the pixel data
     */
    getPixelAs(x: Index, y: Index, typeClass: typeof ColorRgb | typeof ColorRgba | typeof Vector3 | typeof MutableVector3 | typeof Vector4 | typeof MutableVector4): any;
    /**
     * Gets the pixel data at the specified coordinates as a raw Uint8ClampedArray.
     * This provides direct access to the RGBA values as 8-bit integers.
     *
     * @param x - The x-coordinate of the pixel
     * @param y - The y-coordinate of the pixel
     * @returns A Uint8ClampedArray containing the RGBA pixel data
     */
    getPixelAsArray(x: Index, y: Index): Uint8ClampedArray;
    /**
     * Sets a pixel value at the specified coordinates using a color or vector object.
     * Automatically determines the number of components based on the input type.
     *
     * @param x - The x-coordinate of the pixel
     * @param y - The y-coordinate of the pixel
     * @param value - The color or vector value to set
     */
    setPixel(x: Index, y: Index, value: ColorRgb | ColorRgba | Vector3 | MutableVector3 | Vector4 | MutableVector4): void;
    /**
     * Sets a specific channel value for a pixel at the given coordinates.
     * Useful for modifying individual color channels (R, G, B, A).
     *
     * @param x - The x-coordinate of the pixel
     * @param y - The y-coordinate of the pixel
     * @param channelIdx - The channel index (0=R, 1=G, 2=B, 3=A)
     * @param value - The new value for the channel (0-255)
     */
    setPixelAtChannel(x: Index, y: Index, channelIdx: Index, value: number): void;
    /**
     * Checks if the texture contains transparent pixels.
     *
     * @returns True if the texture has transparency, false otherwise
     */
    get isTransparent(): boolean;
    /**
     * Creates an internal canvas context for pixel manipulation operations.
     * Uses existing canvas element if available, otherwise creates a new one.
     */
    createInternalCanvasContext(): void;
    /**
     * Converts the texture data to a TextureDataFloat object with the specified number of channels.
     * This is useful for processing texture data in floating-point format.
     *
     * @param channels - The number of channels to include in the output (1-4)
     * @returns A TextureDataFloat object containing the converted pixel data
     */
    getTextureDataFloat(channels: Size): TextureDataFloat;
    /**
     * Reads the texture data from GPU and returns it as a Uint8Array.
     * This method works with both WebGL and WebGPU backends.
     * Useful for textures that don't have an associated htmlImageElement (e.g., dummy textures).
     *
     * @returns Promise resolving to the pixel data as a Uint8Array in RGBA format,
     *          or undefined if the texture is not ready or reading fails
     */
    getTexturePixelDataFromGPU(): Promise<Uint8Array | undefined>;
    /**
     * Creates an HTMLCanvasElement containing the texture data read from GPU.
     * This is useful for displaying texture previews when htmlImageElement is not available.
     * Works with both WebGL and WebGPU backends.
     *
     * @returns Promise resolving to an HTMLCanvasElement with the texture content,
     *          or undefined if the texture is not ready or reading fails
     */
    createCanvasFromGPU(): Promise<HTMLCanvasElement | undefined>;
}
