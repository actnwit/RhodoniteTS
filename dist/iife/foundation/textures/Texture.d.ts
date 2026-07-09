import type { ComponentTypeEnum } from '../../foundation/definitions/ComponentType';
import type { Count, Index, Offset, Size, TypedArray } from '../../types/CommonTypes';
import type { TextureData } from '../../webgl/WebGLResourceRepository';
import type { CompressionTextureTypeEnum } from '../definitions/CompressionTextureType';
import { type PixelFormatEnum } from '../definitions/PixelFormat';
import { type TextureFormatEnum } from '../definitions/TextureFormat';
import type { TextureParameterEnum } from '../definitions/TextureParameter';
import type { Engine } from '../system/Engine';
import { AbstractTexture } from './AbstractTexture';
/**
 * Descriptor for loading image data to a specific mip level of a texture.
 */
export interface LoadImageToMipLevelDescriptor {
    /** Mip level to load the image data to */
    mipLevel: Index;
    /** X offset in the texture to copy data */
    xOffset: Offset;
    /** Y offset in the texture to copy data */
    yOffset: Offset;
    /** Width in the texture to copy */
    width: Size;
    /** Height in the texture to copy */
    height: Size;
    /** Image data in TypedArray format */
    data: TypedArray;
    /** Row size by pixel of the image data */
    rowSizeByPixel: Size;
    /** Component type of the image data */
    type: ComponentTypeEnum;
}
/**
 * A 2D texture class that extends AbstractTexture and provides functionality for
 * creating, loading, and managing textures from various sources including images,
 * compressed formats (Basis, KTX2), and raw data.
 *
 * This class supports:
 * - Loading textures from URLs, HTML image elements, and data URIs
 * - Compressed texture formats (Basis Universal, KTX2)
 * - Mipmap generation and management
 * - Automatic memory management with finalization registry
 * - Both WebGL and WebGPU backends
 *
 * @example
 * ```typescript
 * // Load texture from URL
 * const texture = await Texture.loadFromUrl('path/to/image.jpg');
 *
 * // Create texture from image element
 * const texture2 = new Texture();
 * await texture2.generateTextureFromImage(imageElement);
 *
 * // Generate 1x1 solid color texture
 * const whiteTexture = new Texture();
 * await whiteTexture.generate1x1TextureFrom('rgba(255,255,255,1)');
 * ```
 */
export declare class Texture extends AbstractTexture implements Disposable {
    /** Whether to automatically detect transparency in loaded images */
    autoDetectTransparency: boolean;
    private static __loadedBasisFunc;
    private static __basisLoadPromise?;
    private static __BasisFile?;
    private __optionsToLoadLazy?;
    private static managedRegistry;
    /**
     * Sets the texture resource UID and registers it for automatic cleanup.
     * @param textureResourceUid - The texture resource handle from the graphics API
     * @param uniqueName - Unique name for debugging and logging purposes
     */
    private __setTextureResourceUid;
    /**
     * Generates a texture from Basis Universal compressed data.
     * Basis Universal is a supercompressed GPU texture codec that supports multiple formats.
     *
     * @param uint8Array - The Basis Universal compressed data
     * @param options - Configuration options for texture generation
     * @param options.level - Mip level (default: 0)
     * @param options.internalFormat - Internal texture format (default: RGBA8)
     * @param options.format - Pixel format (default: RGBA)
     * @param options.type - Component type (default: UnsignedByte)
     * @param options.generateMipmap - Whether to generate mipmaps (default: true)
     * @returns Promise that resolves when texture is ready
     *
     * @example
     * ```typescript
     * const texture = new Texture();
     * const basisData = new Uint8Array(basisFileBuffer);
     * await texture.generateTextureFromBasis(basisData);
     * ```
     */
    generateTextureFromBasis(uint8Array: Uint8Array, options: {
        level?: Count;
        internalFormat?: TextureParameterEnum;
        format?: PixelFormatEnum;
        type?: ComponentTypeEnum;
        generateMipmap?: boolean;
    }): Promise<void>;
    /**
     * Internal method to set up a Basis texture with the transcoder.
     * @param uint8Array - The Basis Universal compressed data
     * @param options - Texture generation options with defaults
     */
    private __setBasisTexture;
    /**
     * Generates a texture from KTX2 compressed data.
     * KTX2 is a container format for GPU textures that supports various compression formats.
     *
     * @param uint8Array - The KTX2 compressed data
     * @returns Promise that resolves when texture is ready
     *
     * @example
     * ```typescript
     * const texture = new Texture();
     * const ktx2Data = new Uint8Array(ktx2FileBuffer);
     * await texture.generateTextureFromKTX2(ktx2Data);
     * ```
     */
    generateTextureFromKTX2(uint8Array: Uint8Array): Promise<void>;
    /**
     * Generates a texture from an HTML image element.
     *
     * @param image - The HTML image element to create texture from
     * @param options - Configuration options for texture generation
     * @param options.level - Mip level (default: 0)
     * @param options.internalFormat - Internal texture format (default: RGBA8)
     * @param options.format - Pixel format (default: RGBA)
     * @param options.type - Component type (default: UnsignedByte)
     * @param options.generateMipmap - Whether to generate mipmaps (default: true)
     * @returns Promise that resolves when texture is ready
     *
     * @example
     * ```typescript
     * const texture = new Texture();
     * const img = document.getElementById('myImage') as HTMLImageElement;
     * await texture.generateTextureFromImage(img, { generateMipmap: false });
     * ```
     */
    generateTextureFromImage(image: HTMLImageElement, { level, internalFormat, format, type, generateMipmap, }?: {
        format?: import("..").EnumIO | undefined;
        generateMipmap?: boolean | undefined;
        internalFormat?: TextureFormatEnum | undefined;
        level?: number | undefined;
        type?: {
            toString(): string;
            toJSON(): number;
            readonly __webgpu: string;
            readonly __wgsl: string;
            readonly __sizeInBytes: number;
            readonly __dummyStr: "UNSIGNED_BYTE";
            get wgsl(): string;
            get webgpu(): string;
            getSizeInBytes(): number;
            isFloatingPoint(): boolean;
            isInteger(): boolean;
            isUnsignedInteger(): boolean;
            readonly index: number;
            readonly symbol: symbol;
            readonly str: string;
        } | undefined;
    }): Promise<void>;
    /**
     * Generates a texture by loading an image from a URL.
     * Supports both regular URLs and data URIs. For external URLs, CORS is handled automatically.
     *
     * @param imageUri - The URL or data URI of the image to load
     * @param options - Configuration options for texture generation
     * @param options.level - Mip level (default: 0)
     * @param options.internalFormat - Internal texture format (default: RGBA8)
     * @param options.format - Pixel format (default: RGBA)
     * @param options.type - Component type (default: UnsignedByte)
     * @param options.generateMipmap - Whether to generate mipmaps (default: true)
     * @returns Promise that resolves when texture is loaded and ready
     *
     * @example
     * ```typescript
     * const texture = new Texture();
     * await texture.generateTextureFromUrl('https://example.com/image.jpg');
     * ```
     */
    generateTextureFromUrl(imageUri: string, { level, internalFormat, format, type, generateMipmap, }?: {
        format?: import("..").EnumIO | undefined;
        generateMipmap?: boolean | undefined;
        internalFormat?: TextureFormatEnum | undefined;
        level?: number | undefined;
        type?: {
            toString(): string;
            toJSON(): number;
            readonly __webgpu: string;
            readonly __wgsl: string;
            readonly __sizeInBytes: number;
            readonly __dummyStr: "UNSIGNED_BYTE";
            get wgsl(): string;
            get webgpu(): string;
            getSizeInBytes(): number;
            isFloatingPoint(): boolean;
            isInteger(): boolean;
            isUnsignedInteger(): boolean;
            readonly index: number;
            readonly symbol: symbol;
            readonly str: string;
        } | undefined;
    }): Promise<void>;
    /**
     * Generates a 1x1 pixel texture with a solid color.
     * Useful for creating placeholder textures or solid color materials.
     *
     * @param rgbaStr - CSS color string in rgba format (default: 'rgba(255,255,255,1)')
     * @returns Promise that resolves when texture is ready
     *
     * @example
     * ```typescript
     * const texture = new Texture();
     * await texture.generate1x1TextureFrom('rgba(255,0,0,1)'); // Red texture
     * ```
     */
    generate1x1TextureFrom(rgbaStr?: string): Promise<void>;
    /**
     * Generates a sheen lookup table texture from embedded data URI.
     * This is used for physically-based rendering (PBR) sheen calculations.
     * Requires the PBR module to be loaded.
     *
     * @returns Promise that resolves when texture is ready
     * @throws Error if PBR module is not available
     */
    generateSheenLutTextureFromDataUri(): Promise<void>;
    /**
     * Allocates an empty texture with specified dimensions and format.
     * The texture can be filled with data later using loadImageToMipLevel.
     *
     * @param desc - Texture allocation descriptor
     * @param desc.mipLevelCount - Number of mip levels (auto-calculated if not provided)
     * @param desc.width - Texture width in pixels
     * @param desc.height - Texture height in pixels
     * @param desc.format - Texture format
     *
     * @example
     * ```typescript
     * const texture = new Texture();
     * texture.allocate({
     *   width: 512,
     *   height: 512,
     *   format: TextureFormat.RGBA8
     * });
     * ```
     */
    allocate(desc: {
        mipLevelCount?: Count;
        width: number;
        height: number;
        format: TextureFormatEnum;
    }): void;
    /**
     * Loads image data to a specific mip level of an allocated texture.
     * The texture must be allocated first using the allocate method.
     *
     * @param desc - Descriptor containing image data and target location
     * @returns Promise that resolves when data is loaded
     *
     * @example
     * ```typescript
     * await texture.loadImageToMipLevel({
     *   mipLevel: 0,
     *   xOffset: 0,
     *   yOffset: 0,
     *   width: 256,
     *   height: 256,
     *   data: imageData,
     *   rowSizeByPixel: 256,
     *   type: ComponentType.UnsignedByte
     * });
     * ```
     */
    loadImageToMipLevel(desc: LoadImageToMipLevelDescriptor): Promise<void>;
    /**
     * Generates a compressed texture from raw typed array data.
     *
     * @param typedArray - The compressed texture data
     * @param width - Texture width in pixels
     * @param height - Texture height in pixels
     * @param compressionTextureType - Type of compression used
     * @returns Promise that resolves when texture is ready
     *
     * @example
     * ```typescript
     * const texture = new Texture();
     * await texture.generateCompressedTextureFromTypedArray(
     *   compressedData,
     *   512,
     *   512,
     *   CompressionTextureType.S3TC_DXT1
     * );
     * ```
     */
    generateCompressedTextureFromTypedArray(typedArray: TypedArray, width: number, height: number, compressionTextureType: CompressionTextureTypeEnum): Promise<void>;
    /**
     * Generates a compressed texture with mipmaps from an array of texture data.
     * Each TextureData object represents a different mip level.
     *
     * @param textureDataArray - Array of texture data for different mip levels
     * @param compressionTextureType - Type of compression used
     * @returns Promise that resolves when texture is ready
     * @throws Error if level 0 texture data is not found
     *
     * @example
     * ```typescript
     * const texture = new Texture();
     * const mipmapData = [
     *   { level: 0, width: 512, height: 512, buffer: level0Data },
     *   { level: 1, width: 256, height: 256, buffer: level1Data },
     *   // ... more levels
     * ];
     * await texture.generateCompressedTextureWithMipmapFromTypedArray(
     *   mipmapData,
     *   CompressionTextureType.S3TC_DXT1
     * );
     * ```
     */
    generateCompressedTextureWithMipmapFromTypedArray(textureDataArray: TextureData[], compressionTextureType: CompressionTextureTypeEnum): Promise<void>;
    /**
     * Generates mipmaps for the texture automatically.
     * The texture must already be loaded and ready before calling this method.
     *
     * @example
     * ```typescript
     * const texture = new Texture();
     * await texture.generateTextureFromUrl('image.jpg', { generateMipmap: false });
     * texture.generateMipmaps(); // Generate mipmaps manually
     * ```
     */
    generateMipmaps(): void;
    /**
     * Imports an existing WebGL texture directly without copying data.
     * This is useful for integrating with external WebGL code or libraries.
     *
     * @param webGLTexture - The WebGL texture object to import
     * @param width - Texture width in pixels (default: 0)
     * @param height - Texture height in pixels (default: 0)
     *
     * @example
     * ```typescript
     * const texture = new Texture();
     * const webglTexture = gl.createTexture();
     * // ... set up webglTexture
     * texture.importWebGLTextureDirectly(webglTexture, 512, 512);
     * ```
     */
    importWebGLTextureDirectly(webGLTexture: WebGLTexture, width?: number, height?: number): void;
    /**
     * Destroys the 3D API resources associated with this texture.
     * This releases GPU memory and invalidates the texture.
     *
     * @returns Always returns true
     */
    destroy3DAPIResources(): boolean;
    /**
     * Internal method to delete a texture resource from the graphics API.
     * @param textureResourceUid - The texture resource handle to delete
     */
    private static __deleteInternalTexture;
    /**
     * Symbol.dispose implementation for automatic resource cleanup.
     * Called automatically when using 'using' declarations in TypeScript 5.2+.
     */
    [Symbol.dispose](): void;
    /**
     * Destroys the texture and releases all associated resources.
     * This includes GPU memory, finalization registry entries, and other cleanup.
     * After calling this method, the texture should not be used.
     */
    destroy(): void;
    /**
     * Static factory method to create and load a texture from a URL.
     * This is a convenience method that combines texture creation and loading.
     *
     * @param uri - The URL or data URI of the image to load
     * @param options - Configuration options for texture generation
     * @param options.level - Mip level (default: 0)
     * @param options.internalFormat - Internal texture format (default: RGBA8)
     * @param options.format - Pixel format (default: RGBA)
     * @param options.type - Component type (default: UnsignedByte)
     * @param options.generateMipmap - Whether to generate mipmaps (default: true)
     * @returns Promise that resolves to the loaded texture
     *
     * @example
     * ```typescript
     * const texture = await Texture.loadFromUrl('https://example.com/image.jpg', {
     *   generateMipmap: false,
     *   format: PixelFormat.RGB
     * });
     * ```
     */
    static loadFromUrl(engine: Engine, uri: string, { level, internalFormat, format, type, generateMipmap, }?: {
        format?: import("..").EnumIO | undefined;
        generateMipmap?: boolean | undefined;
        internalFormat?: TextureFormatEnum | undefined;
        level?: number | undefined;
        type?: {
            toString(): string;
            toJSON(): number;
            readonly __webgpu: string;
            readonly __wgsl: string;
            readonly __sizeInBytes: number;
            readonly __dummyStr: "UNSIGNED_BYTE";
            get wgsl(): string;
            get webgpu(): string;
            getSizeInBytes(): number;
            isFloatingPoint(): boolean;
            isInteger(): boolean;
            isUnsignedInteger(): boolean;
            readonly index: number;
            readonly symbol: symbol;
            readonly str: string;
        } | undefined;
    }): Promise<Texture>;
}
