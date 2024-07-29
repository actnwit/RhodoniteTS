import { AbstractTexture } from './AbstractTexture';
import { TextureParameter, TextureParameterEnum } from '../definitions/TextureParameter';
import { PixelFormat, PixelFormatEnum } from '../definitions/PixelFormat';
import { ComponentTypeEnum, ComponentType } from '../definitions/ComponentType';
import { IRenderable } from './IRenderable';
import { CGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import { Size, Index } from '../../types/CommonTypes';
import { FrameBuffer } from '../renderer/FrameBuffer';
import { Vector4 } from '../math/Vector4';
import { SystemState } from '../system/SystemState';
import { ProcessApproach } from '../definitions';
import { WebGpuResourceRepository } from '../../webgpu/WebGpuResourceRepository';

export class RenderTargetTexture extends AbstractTexture implements IRenderable {
  private __fbo?: FrameBuffer;
  private __arrayLength: number = 0;
  constructor() {
    super();
  }

  create({
    width,
    height,
    level,
    format: internalFormat,
  }: {
    width: Size;
    height: Size;
    level: number;
    format: TextureParameterEnum;
  }) {
    this.__width = width;
    this.__height = height;
    this.__level = level;

    let format = PixelFormat.RGBA as PixelFormatEnum;
    let type = ComponentType.UnsignedByte as ComponentTypeEnum;
    if (internalFormat === TextureParameter.RGB8) {
      format = PixelFormat.RGB;
      type = ComponentType.UnsignedByte;
    } else if (internalFormat === TextureParameter.RGBA8) {
      format = PixelFormat.RGBA;
      type = ComponentType.UnsignedByte;
    } else if (internalFormat === TextureParameter.RGB10_A2) {
      format = PixelFormat.RGBA;
      type = ComponentType.UnsignedByte;
    } else if (internalFormat === TextureParameter.RG16F) {
      format = PixelFormat.RG;
      type = ComponentType.HalfFloat;
    } else if (internalFormat === TextureParameter.RG32F) {
      format = PixelFormat.RG;
      type = ComponentType.Float;
    } else if (internalFormat === TextureParameter.RGB16F) {
      format = PixelFormat.RGB;
      type = ComponentType.HalfFloat;
    } else if (internalFormat === TextureParameter.RGB32F) {
      format = PixelFormat.RGB;
      type = ComponentType.Float;
    } else if (internalFormat === TextureParameter.RGBA16F) {
      format = PixelFormat.RGBA;
      type = ComponentType.HalfFloat;
    } else if (internalFormat === TextureParameter.RGBA32F) {
      format = PixelFormat.RGBA;
      type = ComponentType.Float;
    } else if (internalFormat === TextureParameter.R11F_G11F_B10F) {
      format = PixelFormat.RGB;
      type = ComponentType.Float;
    } else if (internalFormat === TextureParameter.Depth16) {
      format = PixelFormat.DepthComponent;
      type = ComponentType.UnsignedShort;
    } else if (
      internalFormat === TextureParameter.Depth24 ||
      internalFormat === TextureParameter.Depth24Stencil8
    ) {
      format = PixelFormat.DepthComponent;
      type = ComponentType.UnsignedInt;
    } else if (
      internalFormat === TextureParameter.Depth32F ||
      internalFormat === TextureParameter.Depth32FStencil8
    ) {
      format = PixelFormat.DepthComponent;
      type = ComponentType.Float;
    }

    this.__internalFormat = internalFormat;
    this.__format = format;
    this.__type = type;

    this.__createRenderTargetTexture();
  }

  createTextureArray({
    width,
    height,
    level = 0,
    internalFormat = TextureParameter.RGB8,
    format = PixelFormat.RGBA,
    type = ComponentType.UnsignedByte,
    arrayLength,
  }: {
    width: Size;
    height: Size;
    level: number;
    internalFormat: TextureParameterEnum;
    format: PixelFormatEnum;
    type: ComponentTypeEnum;
    arrayLength: number;
  }) {
    this.__width = width;
    this.__height = height;
    this.__level = level;
    this.__internalFormat = internalFormat;
    this.__format = format;
    this.__type = type;
    this.__arrayLength = arrayLength;

    this.__createRenderTargetTextureArray();
  }

  set _fbo(fbo: FrameBuffer) {
    this.__fbo = fbo;
  }

  get fbo() {
    return this.__fbo;
  }

  get arrayLength() {
    return this.__arrayLength;
  }

  private __createRenderTargetTexture() {
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    const texture = cgApiResourceRepository.createRenderTargetTexture({
      width: this.__width,
      height: this.__height,
      level: this.__level,
      internalFormat: this.__internalFormat,
      format: this.__format,
      type: this.__type,
    });
    this._textureResourceUid = texture;

    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = (
        cgApiResourceRepository as WebGpuResourceRepository
      ).createTextureView2d(this._textureResourceUid);
    }

    AbstractTexture.__textureMap.set(texture, this);
  }

  private __createRenderTargetTextureArray() {
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    const texture = cgApiResourceRepository.createRenderTargetTextureArray({
      width: this.__width,
      height: this.__height,
      level: this.__level,
      internalFormat: this.__internalFormat,
      format: this.__format,
      type: this.__type,
      arrayLength: this.__arrayLength,
    });
    this._textureResourceUid = texture;

    AbstractTexture.__textureMap.set(texture, this);
  }

  resize(width: Size, height: Size) {
    this.destroy3DAPIResources();
    this.__width = width;
    this.__height = height;
    if (this.__arrayLength > 0) {
      this.__createRenderTargetTextureArray();
    } else {
      this.__createRenderTargetTexture();
    }
  }

  destroy3DAPIResources() {
    AbstractTexture.__textureMap.delete(this._textureResourceUid);
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

  generateMipmap() {
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    cgApiResourceRepository.generateMipmaps2d(this._textureResourceUid, this.width, this.height);
  }

  blitToTexture2dFromTexture2dArray(targetTexture2D: RenderTargetTexture) {
    if (this.__arrayLength === 0) {
      return;
    }
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    webglResourceRepository.blitToTexture2dFromTexture2dArray(
      this._textureResourceUid,
      targetTexture2D.__fbo!.cgApiResourceUid,
      targetTexture2D.width,
      targetTexture2D.height
    );
  }
  blitToTexture2dFromTexture2dArrayFake(targetTexture2D: RenderTargetTexture) {
    if (this.__arrayLength === 0) {
      return;
    }
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    webglResourceRepository.blitToTexture2dFromTexture2dArrayFake(
      this._textureResourceUid,
      targetTexture2D.__fbo!.cgApiResourceUid,
      targetTexture2D.width,
      targetTexture2D.height
    );
  }
  blitToTexture2dFromTexture2dArray2(targetTexture2D: RenderTargetTexture) {
    if (this.__arrayLength === 0) {
      return;
    }
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    webglResourceRepository.blitToTexture2dFromTexture2dArray2(
      this._textureResourceUid,
      targetTexture2D._textureResourceUid,
      targetTexture2D.width / 2,
      targetTexture2D.height
    );
  }
}
