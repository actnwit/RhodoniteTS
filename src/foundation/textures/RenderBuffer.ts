import RnObject from "../core/RnObject";
import IRenderable from "./IRenderable";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";

export default class RenderBuffer extends RnObject implements IRenderable {
  width: number = 0;
  height: number = 0;
  public cgApiResourceUid: CGAPIResourceHandle = -1;

  constructor() {
    super();
  }

  create(width: Size, height: Size) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    this.cgApiResourceUid = webglResourceRepository.createRenderBuffer(width, height);
  }

  discard() {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    webglResourceRepository.deleteRenderBuffer(this.cgApiResourceUid);
  }
}
