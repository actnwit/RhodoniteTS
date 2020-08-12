import { EnumClass, EnumIO, _from } from "../misc/EnumIO";

export interface TextureParameterEnum extends EnumIO {
}

class TextureParameterClass extends EnumClass implements TextureParameterEnum {

  constructor({ index, str }: { index: number, str: string }) {
    super({ index, str });

  }

}

const Nearest: TextureParameterEnum = new TextureParameterClass({ index: 0x2600, str: 'NEAREST' });
const Linear: TextureParameterEnum = new TextureParameterClass({ index: 0x2601, str: 'LINEAR' });
const LinearMipmapLinear: TextureParameterEnum = new TextureParameterClass({ index: 0x2703, str: 'LINEAR_MIPMAP_LINEAR' });
const TextureMagFilter: TextureParameterEnum = new TextureParameterClass({ index: 0x2800, str: 'TEXTURE_MAG_FILTER' });
const TextureMinFilter: TextureParameterEnum = new TextureParameterClass({ index: 0x2801, str: 'TEXTURE_MIN_FILTER' });
const TextureWrapS: TextureParameterEnum = new TextureParameterClass({ index: 0x2802, str: 'TEXTURE_WRAP_S' });
const TextureWrapT: TextureParameterEnum = new TextureParameterClass({ index: 0x2803, str: 'TEXTURE_WRAP_T' });
const Texture2D: TextureParameterEnum = new TextureParameterClass({ index: 0x0DE1, str: 'TEXTURE_2D' });
const Texture: TextureParameterEnum = new TextureParameterClass({ index: 0x1702, str: 'TEXTURE' });
const Texture0: TextureParameterEnum = new TextureParameterClass({ index: 0x84C0, str: 'TEXTURE0' });
const Texture1: TextureParameterEnum = new TextureParameterClass({ index: 0x84C1, str: 'TEXTURE1' });
const ActiveTexture: TextureParameterEnum = new TextureParameterClass({ index: 0x84E0, str: 'ACTIVE_TEXTURE' });
const Repeat: TextureParameterEnum = new TextureParameterClass({ index: 0x2901, str: 'REPEAT' });
const ClampToEdge: TextureParameterEnum = new TextureParameterClass({ index: 0x812F, str: 'CLAMP_TO_EDGE' });
const RGB8: TextureParameterEnum = new TextureParameterClass({ index: 0x8051, str: 'RGB8' });
const RGBA8: TextureParameterEnum = new TextureParameterClass({ index: 0x8058, str: 'RGBA8' });
const RGB10_A2: TextureParameterEnum = new TextureParameterClass({ index: 0x8059, str: 'RGB10_A2' });
const RGB16F: TextureParameterEnum = new TextureParameterClass({ index: 0x881B, str: 'RGB16F' });
const RGB32F: TextureParameterEnum = new TextureParameterClass({ index: 0x8815, str: 'RGB32F' });
const RGBA16F: TextureParameterEnum = new TextureParameterClass({ index: 0x881A, str: 'RGBA16F' });
const RGBA32F: TextureParameterEnum = new TextureParameterClass({ index: 0x8814, str: 'RGBA32F' });
const Depth16: TextureParameterEnum = new TextureParameterClass({ index: 0x81A5, str: 'DEPTH_COMPONENT16' });
const Depth24: TextureParameterEnum = new TextureParameterClass({ index: 0x81A6, str: 'DEPTH_COMPONENT24' });
const Depth32F: TextureParameterEnum = new TextureParameterClass({ index: 0x8CAC, str: 'DEPTH_COMPONENT32F' });
const Depth24Stencil8: TextureParameterEnum = new TextureParameterClass({ index: 0x88F0, str: 'DEPTH24_STENCIL8' });
const Depth32FStencil8: TextureParameterEnum = new TextureParameterClass({ index: 0x8CAD, str: 'DEPTH32F_STENCIL8' });

const typeList = [Nearest, Linear, LinearMipmapLinear, TextureMagFilter, TextureMinFilter, TextureWrapS, TextureWrapT, Texture2D, Texture, Texture0, Texture1, ActiveTexture,
  Repeat, ClampToEdge, RGB8, RGBA8, RGB10_A2, RGB16F, RGB32F, RGBA16F, RGBA32F, Depth16, Depth24, Depth32F, Depth24Stencil8, Depth32FStencil8];

function from(index: number): TextureParameterEnum {
  return _from({ typeList, index }) as TextureParameterEnum;
}

export const TextureParameter = Object.freeze({
  Nearest, Linear, LinearMipmapLinear, TextureMagFilter, TextureMinFilter, TextureWrapS, TextureWrapT, Texture2D, Texture,
  Texture0, Texture1, ActiveTexture, Repeat, ClampToEdge, RGB8, RGBA8, RGB10_A2, RGB16F, RGB32F, RGBA16F, RGBA32F, Depth16, Depth24, Depth32F, Depth24Stencil8, Depth32FStencil8, from
});
