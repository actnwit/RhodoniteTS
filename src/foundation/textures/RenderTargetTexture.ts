import { AbstractTexture } from './AbstractTexture';
import { IRenderable } from './IRenderable';
import { CGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import { Size, Index } from '../../types/CommonTypes';
import { FrameBuffer } from '../renderer/FrameBuffer';
import { Vector4 } from '../math/Vector4';
import { SystemState } from '../system/SystemState';
import { ProcessApproach } from '../definitions/ProcessApproach';
import { WebGpuResourceRepository } from '../../webgpu/WebGpuResourceRepository';
import { TextureFormat, TextureFormatEnum } from '../definitions/TextureFormat';

export class RenderTargetTexture extends AbstractTexture implements IRenderable {
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
    width: Size;
    height: Size;
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

  set _fbo(fbo: FrameBuffer) {
    this.__fbo = fbo;
  }

  get fbo() {
    return this.__fbo;
  }

  private __createRenderTargetTexture() {
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    const texture = cgApiResourceRepository.createRenderTargetTexture({
      width: this.__width,
      height: this.__height,
      mipLevelCount: this.__mipLevelCount,
      format: this.__internalFormat,
    });
    this._textureResourceUid = texture;

    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = (
        cgApiResourceRepository as WebGpuResourceRepository
      ).createTextureView2d(this._textureResourceUid);
      this._textureViewAsRenderTargetResourceUid = (
        cgApiResourceRepository as WebGpuResourceRepository
      ).createTextureViewAsRenderTarget(this._textureResourceUid);
    }
  }

  resize(width: Size, height: Size) {
    this.destroy3DAPIResources();
    this.__width = width;
    this.__height = height;
    this.__createRenderTargetTexture();
  }

  destroy3DAPIResources() {
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    cgApiResourceRepository.deleteTexture(this._textureResourceUid);
    this._textureResourceUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;

    return true;
  }

  async getTexturePixelData() {
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    const data = cgApiResourceRepository.getTexturePixelData(
      this._textureResourceUid,
      this.__width,
      this.__height,
      this.__fbo!.framebufferUID,
      this.__fbo!.whichColorAttachment(this)
    );

    return data;
  }

  async downloadTexturePixelData() {
    const data = await this.getTexturePixelData();
    const canvas = document.createElement('canvas');
    canvas.width = this.__width;
    canvas.height = this.__height;
    const ctx = canvas.getContext('2d')!;
    const imageData = new ImageData(
      new Uint8ClampedArray(data.buffer),
      this.__width,
      this.__height
    );
    ctx.putImageData(imageData, this.__width, this.__height);
    const dataUri = canvas.toDataURL('image/png');

    const a = document.createElement('a');
    const e = document.createEvent('MouseEvent');
    a.href = dataUri;
    a.download = 'texture.png';
    e.initEvent('click', true, true); //, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null)
    a.dispatchEvent(e);
  }

  /**
   * Origin is left bottom
   *
   * @param x horizontal pixel position (0 is left)
   * @param y vertical pixel position (0 is bottom)
   * @param argByteArray Pixel Data as Uint8Array
   * @returns Pixel Value in Vector4
   */
  async getPixelValueAt(x: Index, y: Index, argByteArray?: Uint8Array): Promise<Vector4> {
    let byteArray = argByteArray;
    if (!byteArray) {
      byteArray = await this.getTexturePixelData();
    }

    const color = Vector4.fromCopyArray([
      byteArray[(y * this.width + x) * 4 + 0],
      byteArray[(y * this.width + x) * 4 + 1],
      byteArray[(y * this.width + x) * 4 + 2],
      byteArray[(y * this.width + x) * 4 + 3],
    ]);
    return color;
  }

  generateMipmaps() {
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    cgApiResourceRepository.generateMipmaps2d(this._textureResourceUid, this.width, this.height);
  }

  createCubeTextureViewAsRenderTarget(faceIdx: Index, mipLevel: Index): void {}
}
