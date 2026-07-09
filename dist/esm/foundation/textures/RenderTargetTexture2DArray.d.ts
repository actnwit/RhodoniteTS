import type { Index, Size } from '../../types/CommonTypes';
import { type ComponentTypeEnum } from '../definitions/ComponentType';
import { type PixelFormatEnum } from '../definitions/PixelFormat';
import { type TextureFormatEnum } from '../definitions/TextureFormat';
import { Vector4 } from '../math/Vector4';
import type { FrameBuffer } from '../renderer/FrameBuffer';
import { AbstractTexture } from './AbstractTexture';
import type { IRenderable } from './IRenderable';
/**
 * A 2D texture array that can be used as a render target.
 * This class extends AbstractTexture and implements IRenderable to provide
 * functionality for creating and managing 2D texture arrays that can be
 * rendered to in graphics pipelines.
 */
export declare class RenderTargetTexture2DArray extends AbstractTexture implements IRenderable {
    private __fbo?;
    private __arrayLength;
    /**
     * Creates and initializes the 2D texture array with the specified parameters.
     * @param params - Configuration object for texture creation
     * @param params.width - Width of the texture in pixels
     * @param params.height - Height of the texture in pixels
     * @param params.level - Mipmap level (default: 0)
     * @param params.internalFormat - Internal format of the texture (default: RGB8)
     * @param params.format - Pixel format of the texture (default: RGBA)
     * @param params.type - Component type of the texture data (default: UnsignedByte)
     * @param params.arrayLength - Number of layers in the texture array
     */
    create({ width, height, level, internalFormat, format, type, arrayLength, }: {
        width: Size;
        height: Size;
        level: number;
        internalFormat: TextureFormatEnum;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        arrayLength: number;
    }): void;
    /**
     * Sets the framebuffer object associated with this render target.
     * @param fbo - The framebuffer object to associate with this texture
     */
    set _fbo(fbo: FrameBuffer);
    /**
     * Gets the framebuffer object associated with this render target.
     * @returns The associated framebuffer object, or undefined if not set
     */
    get fbo(): FrameBuffer | undefined;
    /**
     * Gets the number of layers in the texture array.
     * @returns The array length (number of layers)
     */
    get arrayLength(): number;
    /**
     * Creates the underlying graphics API resources for the render target texture array.
     * This method handles both WebGL and WebGPU resource creation.
     * @private
     */
    private __createRenderTargetTextureArray;
    /**
     * Changes the render target layer for WebGPU rendering.
     * This method creates a new texture view targeting a specific layer of the array.
     * @param layerIndex - The index of the layer to target for rendering
     */
    changeRenderTargetLayerWebGPU(layerIndex: Index): void;
    /**
     * Resizes the texture array to new dimensions.
     * This destroys the existing resources and recreates them with the new size.
     * @param width - New width in pixels
     * @param height - New height in pixels
     */
    resize(width: Size, height: Size): void;
    /**
     * Destroys all graphics API resources associated with this texture.
     * This should be called when the texture is no longer needed to free GPU memory.
     * @returns True if resources were successfully destroyed
     */
    destroy3DAPIResources(): boolean;
    /**
     * Retrieves the pixel data from the texture as a byte array.
     * This is an asynchronous operation that reads back data from the GPU.
     * @returns Promise that resolves to a Uint8Array containing the pixel data
     */
    getTexturePixelData(): Promise<Uint8Array<ArrayBufferLike>>;
    /**
     * Downloads the texture pixel data as a PNG image file.
     * This method creates a canvas, draws the texture data to it, and triggers
     * a download of the resulting image.
     */
    downloadTexturePixelData(): Promise<void>;
    /**
     * Gets the pixel value at a specific coordinate in the texture.
     * The coordinate system has its origin at the bottom-left corner.
     * @param x - Horizontal pixel position (0 is left)
     * @param y - Vertical pixel position (0 is bottom)
     * @param argByteArray - Optional pre-fetched pixel data array. If not provided, data will be fetched from GPU
     * @returns Promise that resolves to a Vector4 containing the RGBA pixel values
     */
    getPixelValueAt(x: Index, y: Index, argByteArray?: Uint8Array): Promise<Vector4>;
    /**
     * Generates mipmaps for the texture.
     * This creates lower resolution versions of the texture for improved rendering performance
     * and quality when the texture is viewed at different distances.
     */
    generateMipmaps(): void;
    /**
     * Blits (copies) data from this texture array to a 2D texture.
     * This operation copies the first layer of the array to the target texture.
     * @param targetTexture2D - The target 2D texture to copy data to
     */
    blitToTexture2dFromTexture2dArray(targetTexture2D: RenderTargetTexture2DArray): void;
    /**
     * Performs a fake blit operation from this texture array to a 2D texture.
     * This is likely a fallback or alternative implementation for specific use cases.
     * @param targetTexture2D - The target 2D texture to copy data to
     */
    blitToTexture2dFromTexture2dArrayFake(targetTexture2D: RenderTargetTexture2DArray): void;
    /**
     * Alternative blit implementation from texture array to 2D texture.
     * This version uses a different approach and scales the target to half width.
     * @param targetTexture2D - The target 2D texture to copy data to
     */
    blitToTexture2dFromTexture2dArray2(targetTexture2D: RenderTargetTexture2DArray): void;
    /**
     * Creates a cube texture view as a render target for a specific face and mip level.
     * Currently this method is not implemented (empty body).
     * @param faceIdx - The index of the cube face to target
     * @param mipLevel - The mipmap level to target
     */
    createCubeTextureViewAsRenderTarget(_faceIdx: Index, _mipLevel: Index): void;
}
