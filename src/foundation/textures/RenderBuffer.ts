import RnObject from '../core/RnObject';
import IRenderable from './IRenderable';
import CGAPIResourceRepository from '../renderer/CGAPIResourceRepository';
import {
  TextureParameter,
  TextureParameterEnum,
} from '../definitions/TextureParameter';
import {Size, CGAPIResourceHandle} from '../../types/CommonTypes';
import FrameBuffer from '../renderer/FrameBuffer';

export default class RenderBuffer extends RnObject implements IRenderable {
  width = 0;
  height = 0;
  private __internalFormat: TextureParameterEnum = TextureParameter.Depth24;
  public cgApiResourceUid: CGAPIResourceHandle = -1;
  private __fbo?: FrameBuffer;

  constructor() {
    super();
  }

  set _fbo(fbo: FrameBuffer) {
    this.__fbo = fbo;
  }

  get fbo() {
    return this.__fbo;
  }

  create(width: Size, height: Size, internalFormat: TextureParameterEnum) {
    this.width = width;
    this.height = height;
    this.__internalFormat = TextureParameter.Depth24;
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    this.cgApiResourceUid = webglResourceRepository.createRenderBuffer(
      width,
      height,
      internalFormat
    );
  }

  resize(width: Size, height: Size) {
    this.destroy3DAPIResources();
    this.create(width, height, this.__internalFormat);
  }

  destroy3DAPIResources() {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    webglResourceRepository.deleteRenderBuffer(this.cgApiResourceUid);

    return true;
  }
}
