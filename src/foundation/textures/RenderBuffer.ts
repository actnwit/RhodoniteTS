import { RnObject } from '../core/RnObject';
import { IRenderable } from './IRenderable';
import { CGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import { TextureParameter, TextureParameterEnum } from '../definitions/TextureParameter';
import { Size, CGAPIResourceHandle } from '../../types/CommonTypes';
import { FrameBuffer } from '../renderer/FrameBuffer';

export class RenderBuffer extends RnObject implements IRenderable {
  width = 0;
  height = 0;
  private __internalFormat: TextureParameterEnum = TextureParameter.Depth24;
  public _textureResourceUid: CGAPIResourceHandle = -1;
  private __fbo?: FrameBuffer;
  private __isMSAA = false;
  private __sampleCountMSAA = 4;

  constructor() {
    super();
  }

  set _fbo(fbo: FrameBuffer) {
    this.__fbo = fbo;
  }

  get fbo() {
    return this.__fbo;
  }

  create(
    width: Size,
    height: Size,
    internalFormat: TextureParameterEnum,
    { isMSAA = false, sampleCountMSAA = this.__sampleCountMSAA } = {}
  ) {
    this.width = width;
    this.height = height;
    this.__isMSAA = isMSAA;
    this.__sampleCountMSAA = sampleCountMSAA;
    this.__internalFormat = internalFormat;
    const webglResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    this._textureResourceUid = webglResourceRepository.createRenderBuffer(
      width,
      height,
      internalFormat,
      isMSAA,
      sampleCountMSAA
    );
  }

  resize(width: Size, height: Size) {
    this.destroy3DAPIResources();
    this.create(width, height, this.__internalFormat, { isMSAA: this.__isMSAA });
  }

  destroy3DAPIResources() {
    this.width = 0;
    this.height = 0;
    const webglResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    webglResourceRepository.deleteRenderBuffer(this._textureResourceUid);
    this._textureResourceUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    return true;
  }
}
