import type { CGAPIResourceHandle, Index, Size } from '../../types/CommonTypes';
import { RnObject } from '../core/RnObject';
import type { TextureParameterEnum } from '../definitions/TextureParameter';
import type { FrameBuffer } from '../renderer/FrameBuffer';
import type { Engine } from '../system/Engine';
import type { IRenderable } from './IRenderable';
/**
 * A render buffer class that represents a renderable texture buffer used for off-screen rendering.
 * This class manages GPU resources for render targets, depth buffers, and MSAA (Multi-Sample Anti-Aliasing) buffers.
 * It implements the IRenderable interface and extends RnObject for resource management.
 */
export declare class RenderBuffer extends RnObject implements IRenderable {
    private __engine;
    /** The width of the render buffer in pixels */
    width: number;
    /** The height of the render buffer in pixels */
    height: number;
    /** The internal texture format of the render buffer */
    private __internalFormat;
    /** The unique identifier for the texture resource in the graphics API */
    _textureResourceUid: CGAPIResourceHandle;
    /** The unique identifier for the texture view resource */
    _textureViewResourceUid: CGAPIResourceHandle;
    /** The unique identifier for the texture view used as a render target */
    _textureViewAsRenderTargetResourceUid: CGAPIResourceHandle;
    /** The associated frame buffer object */
    private __fbo?;
    /** Flag indicating whether MSAA (Multi-Sample Anti-Aliasing) is enabled */
    private __isMSAA;
    /** The number of samples used for MSAA */
    private __sampleCountMSAA;
    constructor(engine: Engine);
    /**
     * Sets the associated frame buffer object.
     * @param fbo - The frame buffer object to associate with this render buffer
     */
    set _fbo(fbo: FrameBuffer);
    /**
     * Gets the associated frame buffer object.
     * @returns The frame buffer object or undefined if not set
     */
    get fbo(): FrameBuffer | undefined;
    /**
     * Gets the MSAA sample count for this render buffer.
     * @returns The number of samples used for multi-sample anti-aliasing
     */
    get sampleCount(): number;
    /**
     * Creates and initializes the render buffer with the specified parameters.
     * This method allocates GPU resources and sets up the render buffer for rendering operations.
     *
     * @param width - The width of the render buffer in pixels
     * @param height - The height of the render buffer in pixels
     * @param internalFormat - The internal texture format for the render buffer
     * @param options - Optional configuration object
     * @param options.isMSAA - Whether to enable multi-sample anti-aliasing (default: false)
     * @param options.sampleCountMSAA - The number of MSAA samples (default: current sample count)
     */
    create(width: Size, height: Size, internalFormat: TextureParameterEnum, { isMSAA, sampleCountMSAA }?: {
        isMSAA?: boolean | undefined;
        sampleCountMSAA?: number | undefined;
    }): void;
    /**
     * Creates a cube texture view as a render target for a specific face and mip level.
     * This method is currently not implemented and serves as a placeholder for future functionality.
     *
     * @param faceIdx - The index of the cube face (0-5)
     * @param mipLevel - The mip level to create the view for
     */
    createCubeTextureViewAsRenderTarget(_faceIdx: Index, _mipLevel: Index): void;
    /**
     * Resizes the render buffer to new dimensions.
     * This method destroys the current GPU resources and recreates them with the new size,
     * preserving the original format and MSAA settings.
     *
     * @param width - The new width in pixels
     * @param height - The new height in pixels
     */
    resize(width: Size, height: Size): void;
    /**
     * Destroys all GPU resources associated with this render buffer.
     * This method releases the allocated graphics API resources and resets the buffer state.
     * Should be called when the render buffer is no longer needed to prevent memory leaks.
     *
     * @returns True if the resources were successfully destroyed
     */
    destroy3DAPIResources(): boolean;
}
