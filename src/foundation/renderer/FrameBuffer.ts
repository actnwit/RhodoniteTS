import RnObject from "../core/RnObject";
import Entity from "../core/Entity";
import CGAPIResourceRepository from "./CGAPIResourceRepository";
import IRenderable from "../textures/IRenderable";
import { RenderBufferTargetEnum, RenderBufferTarget } from "../definitions/RenderBufferTarget";

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

  get stencilAttachement() {
    return this.__stencilAttachment;
  }

  get depthStancilAttachment() {
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

  discard() {
    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    webGLResourceRepository.deleteFrameBufferObject(this.cgApiResourceUid);
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

}
