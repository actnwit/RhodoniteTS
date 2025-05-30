import { RnObject } from '../core/RnObject';
import { CGAPIResourceRepository } from './CGAPIResourceRepository';
import { IRenderable } from '../textures/IRenderable';
import { RenderBufferTargetEnum, RenderBufferTarget } from '../definitions/RenderBufferTarget';
import { Index, Size, CGAPIResourceHandle } from '../../types/CommonTypes';
import { RenderTargetTexture } from '../textures/RenderTargetTexture';
import { RenderTargetTexture2DArray } from '../textures/RenderTargetTexture2DArray';
import { RenderTargetTextureCube } from '../textures/RenderTargetTextureCube';
import { SystemState } from '../system/SystemState';
import { ProcessApproach } from '../definitions/ProcessApproach';

export class FrameBuffer extends RnObject {
  private __colorAttachments: Array<IRenderable> = [];
  private __depthAttachment?: IRenderable;
  private __stencilAttachment?: IRenderable;
  private __depthStencilAttachment?: IRenderable;
  public cgApiResourceUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  public width: Size = 0;
  public height: Size = 0;
  private __colorAttachmentMap: Map<RenderBufferTargetEnum, IRenderable> = new Map();

  constructor() {
    super();
  }

  get colorAttachmentsRenderBufferTargets() {
    return Array.from(this.__colorAttachmentMap.keys());
  }

  get colorAttachments() {
    return this.__colorAttachments;
  }

  get depthAttachment() {
    return this.__depthAttachment;
  }

  get stencilAttachment() {
    return this.__stencilAttachment;
  }

  get depthStencilAttachment() {
    return this.__depthStencilAttachment;
  }

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
    } else {
      return this.__colorAttachments[index] as RenderTargetTexture;
    }
  }

  getDepthAttachedRenderTargetTexture(): RenderTargetTexture | undefined {
    if (
      this.__depthAttachment instanceof RenderTargetTexture ||
      this.__depthAttachment instanceof RenderTargetTexture2DArray ||
      this.__depthAttachment instanceof RenderTargetTextureCube
    ) {
      return this.__depthAttachment as RenderTargetTexture;
    } else {
      return undefined;
    }
  }

  create(width: Size, height: Size) {
    this.width = width;
    this.height = height;
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    this.cgApiResourceUid = cgApiResourceRepository.createFrameBufferObject();

    return this.cgApiResourceUid;
  }

  get framebufferUID() {
    return this.cgApiResourceUid;
  }

  setColorAttachmentAt(index: Index, renderable: IRenderable) {
    if (renderable.width !== this.width || renderable.height !== this.height) {
      return false;
    }
    this.__colorAttachments[index] = renderable;

    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    cgApiResourceRepository.attachColorBufferToFrameBufferObject(this, index, renderable);

    this.__colorAttachmentMap.set(RenderBufferTarget.from(index), renderable);

    return true;
  }

  setColorAttachmentLayerAt(
    index: Index,
    renderable: IRenderable,
    layerIndex: Index,
    mipLevel: Index
  ) {
    if (renderable.width !== this.width || renderable.height !== this.height) {
      return false;
    }
    this.__colorAttachments[index] = renderable;

    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (renderable instanceof RenderTargetTexture2DArray) {
        renderable.changeRenderTargetLayerWebGPU(layerIndex);
      }
    } else {
      cgApiResourceRepository.attachColorBufferLayerToFrameBufferObject(
        this,
        index,
        renderable,
        layerIndex,
        mipLevel
      );
    }

    this.__colorAttachmentMap.set(RenderBufferTarget.from(index), renderable);

    return true;
  }

  setColorAttachmentCubeAt(
    attachmentIndex: Index,
    faceIndex: Index,
    mipLevel: Index,
    renderable: IRenderable
  ) {
    if (renderable.width !== this.width || renderable.height !== this.height) {
      return false;
    }
    this.__colorAttachments[attachmentIndex] = renderable;

    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
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

  setDepthAttachment(renderable: IRenderable) {
    if (renderable.width !== this.width || renderable.height !== this.height) {
      return false;
    }
    this.__depthAttachment = renderable;

    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    cgApiResourceRepository.attachDepthBufferToFrameBufferObject(this, renderable);

    return true;
  }

  setStencilAttachment(renderable: IRenderable) {
    if (renderable.width !== this.width || renderable.height !== this.height) {
      return false;
    }
    this.__stencilAttachment = renderable;

    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    cgApiResourceRepository.attachStencilBufferToFrameBufferObject(this, renderable);

    return true;
  }

  setDepthStencilAttachment(renderable: IRenderable) {
    if (renderable.width !== this.width || renderable.height !== this.height) {
      return false;
    }
    this.__depthStencilAttachment = renderable;

    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    cgApiResourceRepository.attachDepthStencilBufferToFrameBufferObject(this, renderable);

    return true;
  }

  resize(width: Size, height: Size) {
    // this.destroy3DAPIResources();
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
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

  destroy3DAPIResources() {
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
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

  whichColorAttachment(renderable: IRenderable) {
    return this.__colorAttachments.indexOf(renderable);
  }
}
