import type { CGAPIResourceHandle, Index, Size } from '../../types/CommonTypes';
import { RnObject } from '../core/RnObject';
import { ProcessApproach } from '../definitions/ProcessApproach';
import { RenderBufferTarget, type RenderBufferTargetEnum } from '../definitions/RenderBufferTarget';
import type { Engine } from '../system/Engine';
import type { IRenderable } from '../textures/IRenderable';
import { RenderTargetTexture } from '../textures/RenderTargetTexture';
import { RenderTargetTexture2DArray } from '../textures/RenderTargetTexture2DArray';
import { RenderTargetTextureCube } from '../textures/RenderTargetTextureCube';
import { CGAPIResourceRepository } from './CGAPIResourceRepository';

/**
 * FrameBuffer class represents a framebuffer object that manages render targets
 * for off-screen rendering operations. It handles color, depth, and stencil attachments
 * and provides methods to configure and manage the framebuffer state.
 */
export class FrameBuffer extends RnObject {
  private __engine: Engine;
  private __colorAttachments: Array<IRenderable> = [];
  private __depthAttachment?: IRenderable;
  private __stencilAttachment?: IRenderable;
  private __depthStencilAttachment?: IRenderable;
  public cgApiResourceUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  public width: Size = 0;
  public height: Size = 0;
  private __colorAttachmentMap: Map<RenderBufferTargetEnum, IRenderable> = new Map();

  constructor(engine: Engine) {
    super();
    this.__engine = engine;
  }
  /**
   * Gets the render buffer targets for all color attachments.
   * @returns Array of render buffer target enums for color attachments
   */
  get colorAttachmentsRenderBufferTargets() {
    return Array.from(this.__colorAttachmentMap.keys());
  }

  /**
   * Gets all color attachments as an array of renderable objects.
   * @returns Array of color attachment renderables
   */
  get colorAttachments() {
    return this.__colorAttachments;
  }

  /**
   * Gets the depth attachment if one is set.
   * @returns The depth attachment renderable or undefined
   */
  get depthAttachment() {
    return this.__depthAttachment;
  }

  /**
   * Gets the stencil attachment if one is set.
   * @returns The stencil attachment renderable or undefined
   */
  get stencilAttachment() {
    return this.__stencilAttachment;
  }

  /**
   * Gets the depth-stencil attachment if one is set.
   * @returns The depth-stencil attachment renderable or undefined
   */
  get depthStencilAttachment() {
    return this.__depthStencilAttachment;
  }

  /**
   * Gets the render target texture attached to the specified color attachment index.
   * @param index - The color attachment index
   * @returns The render target texture or undefined if not found or not a render target texture
   */
  getColorAttachedRenderTargetTexture(index: Index): RenderTargetTexture | undefined {
    if (
      this.__colorAttachments[index] == null ||
      !(
        this.__colorAttachments[index] instanceof RenderTargetTexture ||
        this.__colorAttachments[index] instanceof RenderTargetTexture2DArray ||
        this.__colorAttachments[index] instanceof RenderTargetTextureCube
      )
    ) {
      return undefined;
    }
    return this.__colorAttachments[index] as RenderTargetTexture;
  }

  /**
   * Gets the render target texture attached as the depth attachment.
   * @returns The depth render target texture or undefined if not found or not a render target texture
   */
  getDepthAttachedRenderTargetTexture(): RenderTargetTexture | undefined {
    if (
      this.__depthAttachment instanceof RenderTargetTexture ||
      this.__depthAttachment instanceof RenderTargetTexture2DArray ||
      this.__depthAttachment instanceof RenderTargetTextureCube
    ) {
      return this.__depthAttachment as RenderTargetTexture;
    }
    return undefined;
  }

  /**
   * Creates and initializes the framebuffer with the specified dimensions.
   * @param width - The width of the framebuffer
   * @param height - The height of the framebuffer
   * @returns The CG API resource handle for the created framebuffer
   */
  create(width: Size, height: Size) {
    this.width = width;
    this.height = height;
    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    this.cgApiResourceUid = cgApiResourceRepository.createFrameBufferObject();

    return this.cgApiResourceUid;
  }

  /**
   * Gets the unique identifier for this framebuffer.
   * @returns The framebuffer's CG API resource handle
   */
  get framebufferUID() {
    return this.cgApiResourceUid;
  }

  /**
   * Sets a color attachment at the specified index.
   * @param index - The color attachment index
   * @param renderable - The renderable object to attach
   * @returns True if the attachment was successful, false if dimensions don't match
   */
  setColorAttachmentAt(index: Index, renderable: IRenderable) {
    if (renderable.width !== this.width || renderable.height !== this.height) {
      return false;
    }
    this.__colorAttachments[index] = renderable;

    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    cgApiResourceRepository.attachColorBufferToFrameBufferObject(this, index, renderable);

    this.__colorAttachmentMap.set(RenderBufferTarget.from(index), renderable);

    return true;
  }

  /**
   * Sets a color attachment layer at the specified index for array textures.
   * @param index - The color attachment index
   * @param renderable - The renderable object to attach
   * @param layerIndex - The layer index within the array texture
   * @param mipLevel - The mip level to attach
   * @returns True if the attachment was successful, false if dimensions don't match
   */
  setColorAttachmentLayerAt(index: Index, renderable: IRenderable, layerIndex: Index, mipLevel: Index) {
    if (renderable.width !== this.width || renderable.height !== this.height) {
      return false;
    }
    this.__colorAttachments[index] = renderable;

    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    if (this.__engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (renderable instanceof RenderTargetTexture2DArray) {
        renderable.changeRenderTargetLayerWebGPU(layerIndex);
      }
    } else {
      cgApiResourceRepository.attachColorBufferLayerToFrameBufferObject(this, index, renderable, layerIndex, mipLevel);
    }

    this.__colorAttachmentMap.set(RenderBufferTarget.from(index), renderable);

    return true;
  }

  /**
   * Sets a color attachment for a specific face of a cube texture.
   * @param attachmentIndex - The color attachment index
   * @param faceIndex - The cube face index (0-5)
   * @param mipLevel - The mip level to attach
   * @param renderable - The cube texture renderable to attach
   * @returns True if the attachment was successful, false if dimensions don't match
   */
  setColorAttachmentCubeAt(attachmentIndex: Index, faceIndex: Index, mipLevel: Index, renderable: IRenderable) {
    if (renderable.width !== this.width || renderable.height !== this.height) {
      return false;
    }
    this.__colorAttachments[attachmentIndex] = renderable;

    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    cgApiResourceRepository.attachColorBufferCubeToFrameBufferObject(
      this,
      attachmentIndex,
      faceIndex,
      mipLevel,
      renderable
    );

    renderable.createCubeTextureViewAsRenderTarget(faceIndex, mipLevel);

    this.__colorAttachmentMap.set(RenderBufferTarget.from(attachmentIndex), renderable);

    return true;
  }

  /**
   * Sets the depth attachment for this framebuffer.
   * @param renderable - The renderable object to use as depth attachment
   * @returns True if the attachment was successful, false if dimensions don't match
   */
  setDepthAttachment(renderable: IRenderable) {
    if (renderable.width !== this.width || renderable.height !== this.height) {
      return false;
    }
    this.__depthAttachment = renderable;

    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    cgApiResourceRepository.attachDepthBufferToFrameBufferObject(this, renderable);

    return true;
  }

  /**
   * Sets the stencil attachment for this framebuffer.
   * @param renderable - The renderable object to use as stencil attachment
   * @returns True if the attachment was successful, false if dimensions don't match
   */
  setStencilAttachment(renderable: IRenderable) {
    if (renderable.width !== this.width || renderable.height !== this.height) {
      return false;
    }
    this.__stencilAttachment = renderable;

    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    cgApiResourceRepository.attachStencilBufferToFrameBufferObject(this, renderable);

    return true;
  }

  /**
   * Sets the combined depth-stencil attachment for this framebuffer.
   * @param renderable - The renderable object to use as depth-stencil attachment
   * @returns True if the attachment was successful, false if dimensions don't match
   */
  setDepthStencilAttachment(renderable: IRenderable) {
    if (renderable.width !== this.width || renderable.height !== this.height) {
      return false;
    }
    this.__depthStencilAttachment = renderable;

    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    cgApiResourceRepository.attachDepthStencilBufferToFrameBufferObject(this, renderable);

    return true;
  }

  /**
   * Resizes the framebuffer and all its attachments to the specified dimensions.
   * This method destroys the current framebuffer and recreates it with new dimensions.
   * @param width - The new width
   * @param height - The new height
   */
  resize(width: Size, height: Size) {
    // this.destroy3DAPIResources();
    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    cgApiResourceRepository.deleteFrameBufferObject(this.cgApiResourceUid);
    this.cgApiResourceUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.width = 0;
    this.height = 0;
    this.create(width, height);
    if (this.depthAttachment) {
      this.depthAttachment.resize(width, height);
      this.setDepthAttachment(this.depthAttachment);
    }

    if (this.depthStencilAttachment) {
      this.depthStencilAttachment.resize(width, height);
      this.setDepthStencilAttachment(this.depthStencilAttachment);
    }

    if (this.stencilAttachment) {
      this.stencilAttachment.resize(width, height);
      this.setStencilAttachment(this.stencilAttachment);
    }

    for (let i = 0; i < this.colorAttachments.length; i++) {
      this.colorAttachments[i].resize(width, height);
      this.setColorAttachmentAt(i, this.colorAttachments[i]);
    }
  }

  /**
   * Destroys all 3D API resources associated with this framebuffer and its attachments.
   * This includes the framebuffer object itself and all attached render targets.
   * After calling this method, the framebuffer is no longer usable until recreated.
   */
  destroy3DAPIResources() {
    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    cgApiResourceRepository.deleteFrameBufferObject(this.cgApiResourceUid);
    this.cgApiResourceUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.width = 0;
    this.height = 0;

    if (this.depthAttachment) {
      this.depthAttachment.destroy3DAPIResources();
      this.__depthAttachment = undefined;
    }

    if (this.depthStencilAttachment) {
      this.depthStencilAttachment.destroy3DAPIResources();
      this.__depthStencilAttachment = undefined;
    }

    if (this.stencilAttachment) {
      this.stencilAttachment.destroy3DAPIResources();
      this.__stencilAttachment = undefined;
    }

    for (const colorAttachment of this.colorAttachments) {
      colorAttachment.destroy3DAPIResources();
    }
    this.__colorAttachmentMap = new Map();
  }

  /**
   * Finds the index of the specified renderable in the color attachments array.
   * @param renderable - The renderable object to search for
   * @returns The index of the renderable in color attachments, or -1 if not found
   */
  whichColorAttachment(renderable: IRenderable) {
    return this.__colorAttachments.indexOf(renderable);
  }
}
