import { _from, EnumClass, type EnumIO } from '../misc/EnumIO';

export interface TextureParameterEnum extends EnumIO {
  webgpu: string;
}

class TextureParameterClass extends EnumClass implements TextureParameterEnum {
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

const Nearest: TextureParameterEnum = new TextureParameterClass({
  index: 0x2600,
  str: 'NEAREST',
  webgpu: 'nearest',
});
const Linear: TextureParameterEnum = new TextureParameterClass({
  index: 0x2601,
  str: 'LINEAR',
  webgpu: 'linear',
});
const NearestMipmapNearest: TextureParameterEnum = new TextureParameterClass({
  index: 0x2700,
  str: 'NEAREST_MIPMAP_NEAREST',
  webgpu: 'nearest',
});
const LinearMipmapNearest: TextureParameterEnum = new TextureParameterClass({
  index: 0x2701,
  str: 'LINEAR_MIPMAP_NEAREST',
  webgpu: 'linear',
});
const NearestMipmapLinear: TextureParameterEnum = new TextureParameterClass({
  index: 0x2702,
  str: 'NEAREST_MIPMAP_LINEAR',
  webgpu: 'nearest',
});
const LinearMipmapLinear: TextureParameterEnum = new TextureParameterClass({
  index: 0x2703,
  str: 'LINEAR_MIPMAP_LINEAR',
  webgpu: 'linear',
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
  webgpu: 'repeat',
});
const ClampToEdge: TextureParameterEnum = new TextureParameterClass({
  index: 0x812f,
  str: 'CLAMP_TO_EDGE',
  webgpu: 'clamp-to-edge',
});
const MirroredRepeat: TextureParameterEnum = new TextureParameterClass({
  index: 0x8370,
  str: 'MIRRORED_REPEAT',
  webgpu: 'mirror-repeat',
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
];

function from(index: number): TextureParameterEnum {
  return _from({ typeList, index }) as TextureParameterEnum;
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
  from,
});
