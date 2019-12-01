import RnObject from "../core/RnObject";
import Entity from "../core/Entity";
import CGAPIResourceRepository from "./CGAPIResourceRepository";
import IRenderable from "../textures/IRenderable";
import { RenderBufferTargetEnum, RenderBufferTarget } from "../definitions/RenderBufferTarget";
import { Index, Size, CGAPIResourceHandle } from "../../types/CommonTypes";
import RenderTargetTexture from "../textures/RenderTargetTexture";

export default class FrameBuffer extends RnObject {
  private __entities?: Entity[];
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

  create(width: Size, height: Size) {
    this.width = width;
    this.height = height;
    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    this.cgApiResourceUid = webGLResourceRepository.createFrameBufferObject();

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

    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    webglResourceRepository.attachColorBufferToFrameBufferObject(this, index, renderable);

    this.__colorAttachmentMap.set(RenderBufferTarget.from(index), renderable);

    return true;
  }

  setDepthAttachment(renderable: IRenderable) {
    if (renderable.width !== this.width || renderable.height !== this.height) {
      return false;
    }
    this.__depthAttachment = renderable;

    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    webglResourceRepository.attachDepthBufferToFrameBufferObject(this, renderable);

    return true;
  }

  setStencilAttachment(renderable: IRenderable) {
    if (renderable.width !== this.width || renderable.height !== this.height) {
      return false;
    }
    this.__stencilAttachment = renderable;

    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    webglResourceRepository.attachStencilBufferToFrameBufferObject(this, renderable);

    return true;
  }

  setDepthStencilAttachment(renderable: IRenderable) {
    if (renderable.width !== this.width || renderable.height !== this.height) {
      return false;
    }
    this.__depthStencilAttachment = renderable;

    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    webglResourceRepository.attachDepthStencilBufferToFrameBufferObject(this, renderable);

    return true;
  }

  resize(width: Size, height: Size) {
    this.destroy3DAPIResources();
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

    for (let i=0; i<this.colorAttachments.length; i++) {
      this.colorAttachments[i].resize(width, height);
      this.setColorAttachmentAt(i, this.colorAttachments[i]);
    }

  }

  destroy3DAPIResources() {
    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    webGLResourceRepository.deleteFrameBufferObject(this.cgApiResourceUid);

    if (this.depthAttachment) {
      this.depthAttachment.destroy3DAPIResources();
    }

    if (this.depthStencilAttachment) {
      this.depthStencilAttachment.destroy3DAPIResources();
    }

    if (this.stencilAttachment) {
      this.stencilAttachment.destroy3DAPIResources();
    }

    for (let colorAttachment of this.colorAttachments) {
      colorAttachment.destroy3DAPIResources();
    }
  }

  whichColorAttachment(renderable: IRenderable) {
    return this.__colorAttachments.indexOf(renderable)
  }

}
