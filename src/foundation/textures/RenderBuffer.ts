import { RnObject } from '../core/RnObject';
import { IRenderable } from './IRenderable';
import { CGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import { TextureParameter, TextureParameterEnum } from '../definitions/TextureParameter';
import { Size, CGAPIResourceHandle } from '../../types/CommonTypes';
import { FrameBuffer } from '../renderer/FrameBuffer';
import { SystemState } from '../system/SystemState';
import { ProcessApproach } from '../definitions/ProcessApproach';
import { WebGpuResourceRepository } from '../../webgpu/WebGpuResourceRepository';
import { TextureFormat, TextureFormatEnum } from '../definitions/TextureFormat';

export class RenderBuffer extends RnObject implements IRenderable {
  width = 0;
  height = 0;
  private __internalFormat: TextureFormatEnum = TextureFormat.Depth24;
  public _textureResourceUid: CGAPIResourceHandle = -1;
  public _textureViewResourceUid: CGAPIResourceHandle = -1;
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

  get sampleCount() {
    return this.__sampleCountMSAA;
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
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    this._textureResourceUid = cgApiResourceRepository.createRenderBuffer(
      width,
      height,
      internalFormat,
      isMSAA,
      sampleCountMSAA
    );

    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = (
        cgApiResourceRepository as WebGpuResourceRepository
      ).createTextureView2d(this._textureResourceUid);
    }
  }

  resize(width: Size, height: Size) {
    this.destroy3DAPIResources();
    this.create(width, height, this.__internalFormat, { isMSAA: this.__isMSAA });
  }

  destroy3DAPIResources() {
    this.width = 0;
    this.height = 0;
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    cgApiResourceRepository.deleteRenderBuffer(this._textureResourceUid);
    this._textureResourceUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    return true;
  }
}
