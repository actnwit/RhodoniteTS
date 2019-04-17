import RnObject from "../core/RnObject";
import Entity from "../core/Entity";
import CGAPIResourceRepository from "./CGAPIResourceRepository";
import IRenderable from "../textures/IRenderable";

export default class FrameBuffer extends RnObject {
  private __entities?: Entity[];
  private __colorAttatchments: Array<IRenderable> = [];
  private __depthAttatchment?: IRenderable;
  private __stencilAttatchment?: IRenderable;
  private __depthStencilAttatchment?: IRenderable;
  private __framebufferUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  public width: Size = 0;
  public height: Size = 0;

  constructor() {
    super();
  }

  create(width: Size, height: Size) {
    this.width = width;
    this.height = height;
    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    this.__framebufferUid = webGLResourceRepository.createFrameBufferObject();

    return this.__framebufferUid;
  }

  get framebufferUID() {
    return this.__framebufferUid;
  }

  discard() {
    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    webGLResourceRepository.deleteFrameBufferObject(this.__framebufferUid);
  }

  setColorAttatchmentAt(index: Index, renderable: IRenderable) {
    if (renderable.width !== this.width || renderable.height !== this.height) {
      return false;
    }
    this.__colorAttatchments[index] = renderable;

    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    webglResourceRepository.attachColorBufferToFrameBufferObject(this, index, renderable);

    return true;
  }

  setDepthAttachment(renderable: IRenderable) {
    if (renderable.width !== this.width || renderable.height !== this.height) {
      return false;
    }
    this.__depthAttatchment = renderable;

    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    webglResourceRepository.attachDepthBufferToFrameBufferObject(this, renderable);

    return true;
  }

  setStencilAttachment(renderable: IRenderable) {
    if (renderable.width !== this.width || renderable.height !== this.height) {
      return false;
    }
    this.__stencilAttatchment = renderable;

    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    webglResourceRepository.attachStencilBufferToFrameBufferObject(this, renderable);

    return true;
  }

  setDepthStencilAttachment(renderable: IRenderable) {
    if (renderable.width !== this.width || renderable.height !== this.height) {
      return false;
    }
    this.__depthStencilAttatchment = renderable;

    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    webglResourceRepository.attachDepthStencilBufferToFrameBufferObject(this, renderable);

    return true;
  }

}
