import { GL_RG16F, GL_RG32F } from '../../types';
import {EnumClass, EnumIO, _from} from '../misc/EnumIO';
import { PixelFormat, PixelFormatEnum } from './PixelFormat';

export type TextureParameterEnum = EnumIO;

class TextureParameterClass extends EnumClass implements TextureParameterEnum {
  constructor({index, str}: {index: number; str: string}) {
    super({index, str});
  }
}

const Nearest: TextureParameterEnum = new TextureParameterClass({
  index: 0x2600,
  str: 'NEAREST',
});
const Linear: TextureParameterEnum = new TextureParameterClass({
  index: 0x2601,
  str: 'LINEAR',
});
const NearestMipmapNearest: TextureParameterEnum = new TextureParameterClass({
  index: 0x2700,
  str: 'NEAREST_MIPMAP_NEAREST',
});
const LinearMipmapNearest: TextureParameterEnum = new TextureParameterClass({
  index: 0x2701,
  str: 'LINEAR_MIPMAP_NEAREST',
});
const NearestMipmapLinear: TextureParameterEnum = new TextureParameterClass({
  index: 0x2702,
  str: 'NEAREST_MIPMAP_LINEAR',
});
const LinearMipmapLinear: TextureParameterEnum = new TextureParameterClass({
  index: 0x2703,
  str: 'LINEAR_MIPMAP_LINEAR',
});
const TextureMagFilter: TextureParameterEnum = new TextureParameterClass({
  index: 0x2800,
  str: 'TEXTURE_MAG_FILTER',
});
const TextureMinFilter: TextureParameterEnum = new TextureParameterClass({
  index: 0x2801,
  str: 'TEXTURE_MIN_FILTER',
});
const TextureWrapS: TextureParameterEnum = new TextureParameterClass({
  index: 0x2802,
  str: 'TEXTURE_WRAP_S',
});
const TextureWrapT: TextureParameterEnum = new TextureParameterClass({
  index: 0x2803,
  str: 'TEXTURE_WRAP_T',
});
const Texture2D: TextureParameterEnum = new TextureParameterClass({
  index: 0x0de1,
  str: 'TEXTURE_2D',
});
const Texture: TextureParameterEnum = new TextureParameterClass({
  index: 0x1702,
  str: 'TEXTURE',
});
const Texture0: TextureParameterEnum = new TextureParameterClass({
  index: 0x84c0,
  str: 'TEXTURE0',
});
const Texture1: TextureParameterEnum = new TextureParameterClass({
  index: 0x84c1,
  str: 'TEXTURE1',
});
const ActiveTexture: TextureParameterEnum = new TextureParameterClass({
  index: 0x84e0,
  str: 'ACTIVE_TEXTURE',
});
const Repeat: TextureParameterEnum = new TextureParameterClass({
  index: 0x2901,
  str: 'REPEAT',
});
const ClampToEdge: TextureParameterEnum = new TextureParameterClass({
  index: 0x812f,
  str: 'CLAMP_TO_EDGE',
});
const MirroredRepeat: TextureParameterEnum = new TextureParameterClass({
  index: 0x8370,
  str: 'MIRRORED_REPEAT',
});
const RGB8: TextureParameterEnum = new TextureParameterClass({
  index: 0x8051,
  str: 'RGB8',
});
const RGBA8: TextureParameterEnum = new TextureParameterClass({
  index: 0x8058,
  str: 'RGBA8',
});
const RGB10_A2: TextureParameterEnum = new TextureParameterClass({
  index: 0x8059,
  str: 'RGB10_A2',
});
const RG16F: TextureParameterEnum = new TextureParameterClass({
  index: GL_RG16F,
  str: 'RG16F',
});
const RG32F: TextureParameterEnum = new TextureParameterClass({
  index: GL_RG32F,
  str: 'RG32F',
});
const RGB16F: TextureParameterEnum = new TextureParameterClass({
  index: 0x881b,
  str: 'RGB16F',
});
const RGB32F: TextureParameterEnum = new TextureParameterClass({
  index: 0x8815,
  str: 'RGB32F',
});
const RGBA16F: TextureParameterEnum = new TextureParameterClass({
  index: 0x881a,
  str: 'RGBA16F',
});
const RGBA32F: TextureParameterEnum = new TextureParameterClass({
  index: 0x8814,
  str: 'RGBA32F',
});
const Depth16: TextureParameterEnum = new TextureParameterClass({
  index: 0x81a5,
  str: 'DEPTH_COMPONENT16',
});
const Depth24: TextureParameterEnum = new TextureParameterClass({
  index: 0x81a6,
  str: 'DEPTH_COMPONENT24',
});
const Depth32F: TextureParameterEnum = new TextureParameterClass({
  index: 0x8cac,
  str: 'DEPTH_COMPONENT32F',
});
const Depth24Stencil8: TextureParameterEnum = new TextureParameterClass({
  index: 0x88f0,
  str: 'DEPTH24_STENCIL8',
});
const Depth32FStencil8: TextureParameterEnum = new TextureParameterClass({
  index: 0x8cad,
  str: 'DEPTH32F_STENCIL8',
});

const typeList = [
  Nearest,
  Linear,
  NearestMipmapNearest,
  LinearMipmapNearest,
  NearestMipmapLinear,
  LinearMipmapLinear,
  TextureMagFilter,
  TextureMinFilter,
  TextureWrapS,
  TextureWrapT,
  Texture2D,
  Texture,
  Texture0,
  Texture1,
  ActiveTexture,
  Repeat,
  ClampToEdge,
  MirroredRepeat,
  RGB8,
  RGBA8,
  RGB10_A2,
  RG16F,
  RG32F,
  RGB16F,
  RGB32F,
  RGBA16F,
  RGBA32F,
  Depth16,
  Depth24,
  Depth32F,
  Depth24Stencil8,
  Depth32FStencil8,
];

function from(index: number): TextureParameterEnum {
  return _from({typeList, index}) as TextureParameterEnum;
}

function migrateToWebGL1InternalFormat(
  tp: TextureParameterEnum
): TextureParameterEnum {
  if (tp.index === RGBA8.index) {
    return PixelFormat.RGBA;
  } else if (tp.index === RGB8.index) {
    return PixelFormat.RGB;
  }
  throw new Error('Unsupported texture parameter');
}

export const TextureParameter = Object.freeze({
  Nearest,
  Linear,
  NearestMipmapNearest,
  LinearMipmapNearest,
  NearestMipmapLinear,
  LinearMipmapLinear,
  TextureMagFilter,
  TextureMinFilter,
  TextureWrapS,
  TextureWrapT,
  Texture2D,
  Texture,
  Texture0,
  Texture1,
  ActiveTexture,
  Repeat,
  ClampToEdge,
  MirroredRepeat,
  RGB8,
  RGBA8,
  RGB10_A2,
  RG16F,
  RG32F,
  RGB16F,
  RGB32F,
  RGBA16F,
  RGBA32F,
  Depth16,
  Depth24,
  Depth32F,
  Depth24Stencil8,
  Depth32FStencil8,
  from,
  migrateToWebGL1InternalFormat,
});
