import { Index, Size } from '../../types/CommonTypes';
import { WebGpuResourceRepository } from '../../webgpu/WebGpuResourceRepository';
import { HdriFormat } from '../definitions/HdriFormat';
import { ProcessApproach } from '../definitions/ProcessApproach';
import { TextureFormat, TextureFormatEnum } from '../definitions/TextureFormat';
import { CGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import { FrameBuffer } from '../renderer/FrameBuffer';
import { SystemState } from '../system/SystemState';
import { AbstractTexture } from './AbstractTexture';
import { IRenderable } from './IRenderable';

export class RenderTargetTextureCube extends AbstractTexture implements IRenderable {
  private __fbo?: FrameBuffer;
  public hdriFormat = HdriFormat.HDR_LINEAR;
  public _textureViewAsRenderTargetResourceUid: number = -1;

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
    mipLevelCount?: number;
    format: TextureFormatEnum;
  }) {
    this.__width = width;
    this.__height = height;
    this.__mipLevelCount = mipLevelCount ?? Math.floor(Math.log2(Math.max(width, height))) + 1;

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

      this._textureViewAsRenderTargetResourceUid = (
        cgApiResourceRepository as WebGpuResourceRepository
      ).createCubeTextureViewAsRenderTarget(this._textureResourceUid, 0, 0);
    }

    AbstractTexture.__textureMap.set(texture, this);
  }

  generateMipmaps() {
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    cgApiResourceRepository.generateMipmapsCube(this._textureResourceUid, this.width, this.height);
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

  createCubeTextureViewAsRenderTarget(faceIdx: Index, mipLevel: Index): void {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      const webGpuResourceRepository = CGAPIResourceRepository.getWebGpuResourceRepository();
      this._textureViewAsRenderTargetResourceUid =
        webGpuResourceRepository.createCubeTextureViewAsRenderTarget(
          this._textureResourceUid,
          faceIdx,
          mipLevel
        );
    }
  }

  set _fbo(fbo: FrameBuffer) {
    this.__fbo = fbo;
  }

  get fbo() {
    return this.__fbo;
  }

  get mipmapLevelNumber() {
    return this.__mipLevelCount;
  }

  setIsTextureReady() {
    this.__isTextureReady = true;
  }
}
