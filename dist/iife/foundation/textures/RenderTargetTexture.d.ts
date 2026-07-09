import type { Index, Size } from '../../types/CommonTypes';
import { type TextureFormatEnum } from '../definitions/TextureFormat';
import { Vector4 } from '../math/Vector4';
import type { FrameBuffer } from '../renderer/FrameBuffer';
import { AbstractTexture } from './AbstractTexture';
import type { IRenderable } from './IRenderable';
/**
 * A texture that can be used as a render target for off-screen rendering.
 * This class extends AbstractTexture and implements IRenderable to provide
 * functionality for rendering to texture, which is commonly used for
 * post-processing effects, shadow mapping, and other advanced rendering techniques.
 */
export declare class RenderTargetTexture extends AbstractTexture implements IRenderable {
    private __fbo?;
    /**
     * Creates and initializes the render target texture with the specified parameters.
     *
     * @param params - Configuration object for the render target texture
     * @param params.width - Width of the texture in pixels
     * @param params.height - Height of the texture in pixels
     * @param params.mipLevelCount - Number of mip levels to generate (optional, defaults to full mip chain)
     * @param params.format - Internal format of the texture
     */
    create({ width, height, mipLevelCount, format: internalFormat, }: {
        width: Size;
        height: Size;
        mipLevelCount?: number;
        format: TextureFormatEnum;
    }): void;
    /**
     * Sets the framebuffer object associated with this render target texture.
     *
     * @param fbo - The FrameBuffer object to associate with this texture
     */
    set _fbo(fbo: FrameBuffer);
    /**
     * Gets the framebuffer object associated with this render target texture.
     *
     * @returns The associated FrameBuffer object, or undefined if not set
     */
    get fbo(): FrameBuffer | undefined;
    /**
     * Creates the underlying 3D API resources for the render target texture.
     * This method handles both WebGL and WebGPU resource creation.
     *
     * @private
     */
    private __createRenderTargetTexture;
    /**
     * Resizes the render target texture to the specified dimensions.
     * This operation destroys the existing resources and creates new ones.
     *
     * @param width - New width in pixels
     * @param height - New height in pixels
     */
    resize(width: Size, height: Size): void;
    /**
     * Destroys all 3D API resources associated with this render target texture.
     * This method should be called when the texture is no longer needed to free GPU memory.
     *
     * @returns True if the resources were successfully destroyed
     */
    destroy3DAPIResources(): boolean;
    /**
     * Retrieves the pixel data from the render target texture.
     * This operation reads back the texture data from GPU memory to CPU memory.
     *
     * @returns A promise that resolves to a Uint8Array containing the pixel data
     */
    getTexturePixelData(): Promise<Uint8Array<ArrayBufferLike>>;
    /**
     * Downloads the texture pixel data as a PNG image file.
     * This method creates a canvas, draws the texture data to it, and triggers
     * a download of the resulting image.
     */
    downloadTexturePixelData(): Promise<void>;
    /**
     * Gets the pixel value at the specified coordinates.
     * The coordinate system has its origin at the bottom-left corner.
     *
     * @param x - Horizontal pixel position (0 is left edge)
     * @param y - Vertical pixel position (0 is bottom edge)
     * @param argByteArray - Optional pre-fetched pixel data array to avoid redundant GPU reads
     * @returns A promise that resolves to a Vector4 containing the RGBA pixel values (0-255)
     */
    getPixelValueAt(x: Index, y: Index, argByteArray?: Uint8Array): Promise<Vector4>;
    /**
     * Generates mipmaps for the render target texture.
     * Mipmaps are pre-calculated, optimized sequences of images that accompany
     * a main texture, intended to increase rendering speed and reduce aliasing artifacts.
     */
    generateMipmaps(): void;
    /**
     * Creates a cube texture view as a render target for the specified face and mip level.
     * This method is currently not implemented and serves as a placeholder for future functionality.
     *
     * @param faceIdx - Index of the cube face (0-5)
     * @param mipLevel - Mip level to create the view for
     */
    createCubeTextureViewAsRenderTarget(_faceIdx: Index, _mipLevel: Index): void;
}
