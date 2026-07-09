import type { CGAPIResourceHandle, Index, Size } from '../../types/CommonTypes';
import { RnObject } from '../core/RnObject';
import { type RenderBufferTargetEnum } from '../definitions/RenderBufferTarget';
import type { Engine } from '../system/Engine';
import type { IRenderable } from '../textures/IRenderable';
import { RenderTargetTexture } from '../textures/RenderTargetTexture';
/**
 * FrameBuffer class represents a framebuffer object that manages render targets
 * for off-screen rendering operations. It handles color, depth, and stencil attachments
 * and provides methods to configure and manage the framebuffer state.
 */
export declare class FrameBuffer extends RnObject {
    private __engine;
    private __colorAttachments;
    private __depthAttachment?;
    private __stencilAttachment?;
    private __depthStencilAttachment?;
    cgApiResourceUid: CGAPIResourceHandle;
    width: Size;
    height: Size;
    private __colorAttachmentMap;
    constructor(engine: Engine);
    /**
     * Gets the render buffer targets for all color attachments.
     * @returns Array of render buffer target enums for color attachments
     */
    get colorAttachmentsRenderBufferTargets(): RenderBufferTargetEnum[];
    /**
     * Gets all color attachments as an array of renderable objects.
     * @returns Array of color attachment renderables
     */
    get colorAttachments(): IRenderable[];
    /**
     * Gets the depth attachment if one is set.
     * @returns The depth attachment renderable or undefined
     */
    get depthAttachment(): IRenderable | undefined;
    /**
     * Gets the stencil attachment if one is set.
     * @returns The stencil attachment renderable or undefined
     */
    get stencilAttachment(): IRenderable | undefined;
    /**
     * Gets the depth-stencil attachment if one is set.
     * @returns The depth-stencil attachment renderable or undefined
     */
    get depthStencilAttachment(): IRenderable | undefined;
    /**
     * Gets the render target texture attached to the specified color attachment index.
     * @param index - The color attachment index
     * @returns The render target texture or undefined if not found or not a render target texture
     */
    getColorAttachedRenderTargetTexture(index: Index): RenderTargetTexture | undefined;
    /**
     * Gets the render target texture attached as the depth attachment.
     * @returns The depth render target texture or undefined if not found or not a render target texture
     */
    getDepthAttachedRenderTargetTexture(): RenderTargetTexture | undefined;
    /**
     * Creates and initializes the framebuffer with the specified dimensions.
     * @param width - The width of the framebuffer
     * @param height - The height of the framebuffer
     * @returns The CG API resource handle for the created framebuffer
     */
    create(width: Size, height: Size): number;
    /**
     * Gets the unique identifier for this framebuffer.
     * @returns The framebuffer's CG API resource handle
     */
    get framebufferUID(): number;
    /**
     * Sets a color attachment at the specified index.
     * @param index - The color attachment index
     * @param renderable - The renderable object to attach
     * @returns True if the attachment was successful, false if dimensions don't match
     */
    setColorAttachmentAt(index: Index, renderable: IRenderable): boolean;
    /**
     * Sets a color attachment layer at the specified index for array textures.
     * @param index - The color attachment index
     * @param renderable - The renderable object to attach
     * @param layerIndex - The layer index within the array texture
     * @param mipLevel - The mip level to attach
     * @returns True if the attachment was successful, false if dimensions don't match
     */
    setColorAttachmentLayerAt(index: Index, renderable: IRenderable, layerIndex: Index, mipLevel: Index): boolean;
    /**
     * Sets a color attachment for a specific face of a cube texture.
     * @param attachmentIndex - The color attachment index
     * @param faceIndex - The cube face index (0-5)
     * @param mipLevel - The mip level to attach
     * @param renderable - The cube texture renderable to attach
     * @returns True if the attachment was successful, false if dimensions don't match
     */
    setColorAttachmentCubeAt(attachmentIndex: Index, faceIndex: Index, mipLevel: Index, renderable: IRenderable): boolean;
    /**
     * Sets the depth attachment for this framebuffer.
     * @param renderable - The renderable object to use as depth attachment
     * @returns True if the attachment was successful, false if dimensions don't match
     */
    setDepthAttachment(renderable: IRenderable): boolean;
    /**
     * Sets the stencil attachment for this framebuffer.
     * @param renderable - The renderable object to use as stencil attachment
     * @returns True if the attachment was successful, false if dimensions don't match
     */
    setStencilAttachment(renderable: IRenderable): boolean;
    /**
     * Sets the combined depth-stencil attachment for this framebuffer.
     * @param renderable - The renderable object to use as depth-stencil attachment
     * @returns True if the attachment was successful, false if dimensions don't match
     */
    setDepthStencilAttachment(renderable: IRenderable): boolean;
    /**
     * Resizes the framebuffer and all its attachments to the specified dimensions.
     * This method destroys the current framebuffer and recreates it with new dimensions.
     * @param width - The new width
     * @param height - The new height
     */
    resize(width: Size, height: Size): void;
    /**
     * Destroys all 3D API resources associated with this framebuffer and its attachments.
     * This includes the framebuffer object itself and all attached render targets.
     * After calling this method, the framebuffer is no longer usable until recreated.
     */
    destroy3DAPIResources(): void;
    /**
     * Finds the index of the specified renderable in the color attachments array.
     * @param renderable - The renderable object to search for
     * @returns The index of the renderable in color attachments, or -1 if not found
     */
    whichColorAttachment(renderable: IRenderable): number;
}
