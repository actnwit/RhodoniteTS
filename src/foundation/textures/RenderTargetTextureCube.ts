import { Size } from '../../types/CommonTypes';
import { WebGpuResourceRepository } from '../../webgpu/WebGpuResourceRepository';
import { ProcessApproach } from '../definitions/ProcessApproach';
import { TextureFormat, TextureFormatEnum } from '../definitions/TextureFormat';
import { CGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import { FrameBuffer } from '../renderer/FrameBuffer';
import { SystemState } from '../system/SystemState';
import { AbstractTexture } from './AbstractTexture';
import { IRenderable } from './IRenderable';

export class RenderTargetTextureCube extends AbstractTexture implements IRenderable {
  private __fbo?: FrameBuffer;

  constructor() {
    super();
  }

  create({
    width,
    height,
    mipLevelCount,
    format: internalFormat,
  }: {
    width: number;
    height: number;
    mipLevelCount: number;
    format: TextureFormatEnum;
  }) {
    this.__width = width;
    this.__height = height;
    this.__mipLevelCount = mipLevelCount;

    const { format, type } =
      TextureFormat.getPixelFormatAndComponentTypeFromTextureFormat(internalFormat);

    this.__internalFormat = internalFormat;
    this.__format = format;
    this.__type = type;

    this.__createRenderTargetTexture();
  }

  private __createRenderTargetTexture() {
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    const texture = cgApiResourceRepository.createRenderTargetTextureCube({
      width: this.__width,
      height: this.__height,
      mipLevelCount: this.__mipLevelCount,
      format: this.__internalFormat,
    });
    this._textureResourceUid = texture;

    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = (
        cgApiResourceRepository as WebGpuResourceRepository
      ).createTextureViewCube(this._textureResourceUid);
    }

    AbstractTexture.__textureMap.set(texture, this);
  }

  resize(width: Size, height: Size) {
    this.destroy3DAPIResources();
    this.__width = width;
    this.__height = height;
    this.__createRenderTargetTexture();
  }

  destroy3DAPIResources() {
    AbstractTexture.__textureMap.delete(this._textureResourceUid);
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    cgApiResourceRepository.deleteTexture(this._textureResourceUid);
    this._textureResourceUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;

    return true;
  }

  set _fbo(fbo: FrameBuffer) {
    this.__fbo = fbo;
  }

  get fbo() {
    return this.__fbo;
  }
}
