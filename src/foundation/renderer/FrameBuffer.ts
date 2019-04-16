import RnObject from "../core/RnObject";
import Entity from "../core/Entity";
import RenderTargetTexture from "../textures/RenderTargetTexture";
import CGAPIResourceRepository from "./CGAPIResourceRepository";
import WebGLResourceRepository from "../../webgl/WebGLResourceRepository";
import ModuleManager from "../system/ModuleManager";
import IRenderable from "../textures/IRenderable";

export default class FrameBuffer extends RnObject {
  private __entities?: Entity[];
  private __colorAttatchments: Array<IRenderable> = [];
  private __depthAttatchment?: IRenderable;
  private __stencilAttatchment?: IRenderable;
  private __framebufferUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;

  constructor() {
    super();
  }

  create() {
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
    this.__colorAttatchments[index] = renderable;
  }

  setDepthAttachment(renderable: IRenderable) {
    this.__depthAttatchment = renderable;
  }

  setStencilAttachment(renderable: IRenderable) {
    this.__stencilAttatchment = renderable;
  }
}
