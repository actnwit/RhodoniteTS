import { GL_RG16F, GL_RG32F } from '../../types';
import { EnumClass, type EnumIO, _from } from '../misc/EnumIO';
import { ComponentType, type ComponentTypeEnum } from './ComponentType';
import { PixelFormat, type PixelFormatEnum } from './PixelFormat';

export interface TextureFormatEnum extends EnumIO {
  webgpu: string;
}

class TextureFormatClass extends EnumClass implements TextureFormatEnum {
  readonly __webgpu?: string;
  constructor({ index, str, webgpu }: { index: number; str: string; webgpu?: string }) {
    super({ index, str });
    this.__webgpu = webgpu;
  }

  get webgpu(): string {
    if (this.__webgpu === undefined) {
      throw new Error(`does not support ${this.str}`);
    }
    return this.__webgpu;
  }
}

const RGB8: TextureFormatEnum = new TextureFormatClass({
  index: 0x8051,
  str: 'RGB8',
  webgpu: 'rgb8unorm',
});
const RGBA8: TextureFormatEnum = new TextureFormatClass({
  index: 0x8058,
  str: 'RGBA8',
  webgpu: 'rgba8unorm',
});
const RGB10_A2: TextureFormatEnum = new TextureFormatClass({
  index: 0x8059,
  str: 'RGB10_A2',
  webgpu: 'rgb10a2unorm',
});
const RG16F: TextureFormatEnum = new TextureFormatClass({
  index: GL_RG16F,
  str: 'RG16F',
  webgpu: 'rg16float',
});
const RG32F: TextureFormatEnum = new TextureFormatClass({
  index: GL_RG32F,
  str: 'RG32F',
  webgpu: 'rg32float',
});
const RGB16F: TextureFormatEnum = new TextureFormatClass({
  index: 0x881b,
  str: 'RGB16F',
  webgpu: 'rgba16float',
});
const RGB32F: TextureFormatEnum = new TextureFormatClass({
  index: 0x8815,
  str: 'RGB32F',
  webgpu: 'rgba32float',
});
const RGBA16F: TextureFormatEnum = new TextureFormatClass({
  index: 0x881a,
  str: 'RGBA16F',
  webgpu: 'rgba16float',
});
const RGBA32F: TextureFormatEnum = new TextureFormatClass({
  index: 0x8814,
  str: 'RGBA32F',
  webgpu: 'rgba32float',
});
const R11F_G11F_B10F: TextureFormatEnum = new TextureFormatClass({
  index: 0x8c3a,
  str: 'R11F_G11F_B10F',
  webgpu: 'rg11b10ufloat',
});
const Depth16: TextureFormatEnum = new TextureFormatClass({
  index: 0x81a5,
  str: 'DEPTH_COMPONENT16',
  webgpu: 'depth16unorm',
});
const Depth24: TextureFormatEnum = new TextureFormatClass({
  index: 0x81a6,
  str: 'DEPTH_COMPONENT24',
  webgpu: 'depth24plus',
});
const Depth32F: TextureFormatEnum = new TextureFormatClass({
  index: 0x8cac,
  str: 'DEPTH_COMPONENT32F',
  webgpu: 'depth32float',
});
const Depth24Stencil8: TextureFormatEnum = new TextureFormatClass({
  index: 0x88f0,
  str: 'DEPTH24_STENCIL8',
  webgpu: 'depth24plus-stencil8',
});
const Depth32FStencil8: TextureFormatEnum = new TextureFormatClass({
  index: 0x8cad,
  str: 'DEPTH32F_STENCIL8',
  webgpu: 'depth32float-stencil8',
});

function getPixelFormatFromTextureFormat(textureFormat: TextureFormatEnum): PixelFormatEnum {
  switch (textureFormat) {
    case RGB8:
      return PixelFormat.RGB;
    case RGBA8:
      return PixelFormat.RGBA;
    case RGB10_A2:
      return PixelFormat.RGBA;
    case RG16F:
      return PixelFormat.RG;
    case RG32F:
      return PixelFormat.RG;
    case RGB16F:
      return PixelFormat.RGB;
    case RGB32F:
      return PixelFormat.RGB;
    case RGBA16F:
      return PixelFormat.RGBA;
    case RGBA32F:
      return PixelFormat.RGBA;
    case R11F_G11F_B10F:
      return PixelFormat.RGB;
    case Depth16:
      return PixelFormat.DepthComponent;
    case Depth24:
      return PixelFormat.DepthComponent;
    case Depth32F:
      return PixelFormat.DepthComponent;
    case Depth24Stencil8:
      return PixelFormat.DepthStencil;
    case Depth32FStencil8:
      return PixelFormat.DepthStencil;
    default:
      throw new Error(`Not implemented yet: ${textureFormat}`);
  }
}

function getPixelFormatAndComponentTypeFromTextureFormat(internalFormat: TextureFormatEnum) {
  let format = PixelFormat.RGBA as PixelFormatEnum;
  let type = ComponentType.UnsignedByte as ComponentTypeEnum;
  if (internalFormat === TextureFormat.RGB8) {
    format = PixelFormat.RGB;
    type = ComponentType.UnsignedByte;
  } else if (internalFormat === TextureFormat.RGBA8) {
    format = PixelFormat.RGBA;
    type = ComponentType.UnsignedByte;
  } else if (internalFormat === TextureFormat.RGB10_A2) {
    format = PixelFormat.RGBA;
    type = ComponentType.UnsignedByte;
  } else if (internalFormat === TextureFormat.RG16F) {
    format = PixelFormat.RG;
    type = ComponentType.HalfFloat;
  } else if (internalFormat === TextureFormat.RG32F) {
    format = PixelFormat.RG;
    type = ComponentType.Float;
  } else if (internalFormat === TextureFormat.RGB16F) {
    format = PixelFormat.RGB;
    type = ComponentType.HalfFloat;
  } else if (internalFormat === TextureFormat.RGB32F) {
    format = PixelFormat.RGB;
    type = ComponentType.Float;
  } else if (internalFormat === TextureFormat.RGBA16F) {
    format = PixelFormat.RGBA;
    type = ComponentType.HalfFloat;
  } else if (internalFormat === TextureFormat.RGBA32F) {
    format = PixelFormat.RGBA;
    type = ComponentType.Float;
  } else if (internalFormat === TextureFormat.R11F_G11F_B10F) {
    format = PixelFormat.RGB;
    type = ComponentType.Float;
  } else if (internalFormat === TextureFormat.Depth16) {
    format = PixelFormat.DepthComponent;
    type = ComponentType.UnsignedShort;
  } else if (internalFormat === TextureFormat.Depth24 || internalFormat === TextureFormat.Depth24Stencil8) {
    format = PixelFormat.DepthComponent;
    type = ComponentType.UnsignedInt;
  } else if (internalFormat === TextureFormat.Depth32F || internalFormat === TextureFormat.Depth32FStencil8) {
    format = PixelFormat.DepthComponent;
    type = ComponentType.Float;
  }

  return { format, type };
}

const typeList = [
  RGB8,
  RGBA8,
  RGB10_A2,
  RG16F,
  RG32F,
  RGB16F,
  RGB32F,
  RGBA16F,
  RGBA32F,
  R11F_G11F_B10F,
  Depth16,
  Depth24,
  Depth32F,
  Depth24Stencil8,
  Depth32FStencil8,
];

function from(index: number): TextureFormatEnum {
  return _from({ typeList, index }) as TextureFormatEnum;
}

export const TextureFormat = Object.freeze({
  RGB8,
  RGBA8,
  RGB10_A2,
  RG16F,
  RG32F,
  RGB16F,
  RGB32F,
  RGBA16F,
  RGBA32F,
  R11F_G11F_B10F,
  Depth16,
  Depth24,
  Depth32F,
  Depth24Stencil8,
  Depth32FStencil8,
  getPixelFormatFromTextureFormat,
  getPixelFormatAndComponentTypeFromTextureFormat,
  from,
});
