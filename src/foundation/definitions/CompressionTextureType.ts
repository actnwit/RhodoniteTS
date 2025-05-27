import { EnumClass, EnumIO, _from, _fromString } from '../misc/EnumIO';

type BlockInfo = {
  byteSize: number;
  width: number;
  height: number;
};

export interface CompressionTextureTypeEnum extends EnumIO {
  webgpu?: string;
  blockInfo?: BlockInfo
}

class CompressionTextureTypeClass extends EnumClass implements CompressionTextureTypeEnum {
  readonly __webgpu?: string;
  readonly __blockInfo?: BlockInfo;
  constructor({ index, str, webgpu, blockInfo }: { index: number; str: string; webgpu?: string, blockInfo?: BlockInfo }) {
    super({ index, str });
    this.__webgpu = webgpu;
    this.__blockInfo = blockInfo;
  }

  get webgpu(): string {
    if (this.__webgpu === undefined) {
      throw new Error(`does not support ${this.str}`);
    }
    return this.__webgpu;
  }

  get blockInfo(): BlockInfo {
    if (this.__blockInfo === undefined) {
      throw new Error(`does not support ${this.str}`);
    }
    return this.__blockInfo;
  }
}

const ASTC_RGBA_4x4: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37808,
  str: 'COMPRESSED_RGBA_ASTC_4x4_KHR',
  webgpu: 'astc-4x4-unorm',
  blockInfo: {
    byteSize: 16,
    width: 4,
    height: 4,
  }
});
const ASTC_RGBA_5x4: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37809,
  str: 'COMPRESSED_RGBA_ASTC_5x4_KHR',
  webgpu: 'astc-5x4-unorm',
});
const ASTC_RGBA_5x5: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37810,
  str: 'COMPRESSED_RGBA_ASTC_5x5_KHR',
  webgpu: 'astc-5x5-unorm',
});
const ASTC_RGBA_6x5: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37811,
  str: 'COMPRESSED_RGBA_ASTC_6x5_KHR',
  webgpu: 'astc-6x5-unorm',
});
const ASTC_RGBA_6x6: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37812,
  str: 'COMPRESSED_RGBA_ASTC_6x6_KHR',
  webgpu: 'astc-6x6-unorm',
});
const ASTC_RGBA_8x5: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37813,
  str: 'COMPRESSED_RGBA_ASTC_8x5_KHR',
  webgpu: 'astc-8x5-unorm',
});
const ASTC_RGBA_8x6: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37814,
  str: 'COMPRESSED_RGBA_ASTC_8x6_KHR',
  webgpu: 'astc-8x6-unorm',
});
const ASTC_RGBA_8x8: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37815,
  str: 'COMPRESSED_RGBA_ASTC_8x8_KHR',
  webgpu: 'astc-8x8-unorm',
});
const ASTC_RGBA_10x5: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37816,
  str: 'COMPRESSED_RGBA_ASTC_10x5_KHR',
  webgpu: 'astc-10x5-unorm',
});
const ASTC_RGBA_10x6: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37817,
  str: 'COMPRESSED_RGBA_ASTC_10x6_KHR',
  webgpu: 'astc-10x6-unorm',
});
const ASTC_RGBA_10x8: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37818,
  str: 'COMPRESSED_RGBA_ASTC_10x8_KHR',
  webgpu: 'astc-10x8-unorm',
});
const ASTC_RGBA_10x10: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37819,
  str: 'COMPRESSED_RGBA_ASTC_10x10_KHR',
  webgpu: 'astc-10x10-unorm',
});
const ASTC_RGBA_12x10: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37820,
  str: 'COMPRESSED_RGBA_ASTC_12x10_KHR',
  webgpu: 'astc-12x10-unorm',
});
const ASTC_RGBA_12x12: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37821,
  str: 'COMPRESSED_RGBA_ASTC_12x12_KHR',
  webgpu: 'astc-12x12-unorm',
});
const ASTC_SRGB_4x4: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37840,
  str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR',
  webgpu: 'astc-4x4-unorm-srgb',
  blockInfo: {
    byteSize: 16,
    width: 4,
    height: 4,
  }
});
const ASTC_SRGB_5x4: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37841,
  str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR',
  webgpu: 'astc-5x4-unorm-srgb',
});
const ASTC_SRGB_5x5: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37842,
  str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR',
  webgpu: 'astc-5x5-unorm-srgb',
});
const ASTC_SRGB_6x5: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37843,
  str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR',
  webgpu: 'astc-6x5-unorm-srgb',
});
const ASTC_SRGB_6x6: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37844,
  str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR',
  webgpu: 'astc-6x6-unorm-srgb',
});
const ASTC_SRGB_8x5: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37845,
  str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR',
  webgpu: 'astc-8x5-unorm-srgb',
});
const ASTC_SRGB_8x6: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37846,
  str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR',
  webgpu: 'astc-8x6-unorm-srgb',
});
const ASTC_SRGB_8x8: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37847,
  str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR',
  webgpu: 'astc-8x8-unorm-srgb',
});
const ASTC_SRGB_10x5: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37848,
  str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR',
  webgpu: 'astc-10x5-unorm-srgb',
});
const ASTC_SRGB_10x6: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37849,
  str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR',
  webgpu: 'astc-10x6-unorm-srgb',
});
const ASTC_SRGB_10x8: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37850,
  str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR',
  webgpu: 'astc-10x8-unorm-srgb',
});
const ASTC_SRGB_10x10: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37851,
  str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR',
  webgpu: 'astc-10x10-unorm-srgb',
});
const ASTC_SRGB_12x10: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37852,
  str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR',
  webgpu: 'astc-12x10-unorm-srgb',
});
const ASTC_SRGB_12x12: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37853,
  str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR',
  webgpu: 'astc-12x12-unorm-srgb',
});

const S3TC_RGB_DXT1: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 33776,
  str: 'COMPRESSED_RGB_S3TC_DXT1_EXT',
  webgpu: 'bc1-rgba-unorm',
  blockInfo: {
    byteSize: 8,
    width: 4,
    height: 4,
  }
});
const S3TC_RGBA_DXT1: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 33777,
  str: 'COMPRESSED_RGBA_S3TC_DXT1_EXT',
  webgpu: 'bc1-rgba-unorm',
  blockInfo: {
    byteSize: 8,
    width: 4,
    height: 4,
  }
});
const S3TC_RGBA_DXT3: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 33778,
  str: 'COMPRESSED_RGBA_S3TC_DXT3_EXT',
  webgpu: 'bc2-rgba-unorm',
  blockInfo: {
    byteSize: 16,
    width: 4,
    height: 4,
  }
});
const S3TC_RGBA_DXT5: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 33779,
  str: 'COMPRESSED_RGBA_S3TC_DXT5_EXT',
  webgpu: 'bc3-rgba-unorm',
  blockInfo: {
    byteSize: 16,
    width: 4,
    height: 4,
  }
});
const BPTC_RGBA: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 36492,
  str: 'COMPRESSED_RGBA_BPTC_UNORM_EXT',
  webgpu: 'bc7-rgba-unorm',
  blockInfo: {
    byteSize: 16,
    width: 4,
    height: 4,
  }
});
const PVRTC_RGBA_4BPPV1: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 35842,
  str: 'COMPRESSED_RGBA_PVRTC_4BPPV1_IMG',
  blockInfo: {
    byteSize: 8,
    width: 4,
    height: 4,
  }
});
const PVRTC_RGB_4BPPV1: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 35840,
  str: 'COMPRESSED_RGB_PVRTC_4BPPV1_IMG',
  blockInfo: {
    byteSize: 8,
    width: 4,
    height: 4,
  }
});
const ETC2_RGBA8_EAC: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37496,
  str: 'COMPRESSED_RGBA8_ETC2_EAC',
  webgpu: 'etc2-rgba8unorm',
  blockInfo: {
    byteSize: 16,
    width: 4,
    height: 4,
  }
});
const ETC2_RGB8: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 37492,
  str: 'COMPRESSED_RGB8_ETC2',
  webgpu: 'etc2-rgb8unorm',
  blockInfo: {
    byteSize: 8,
    width: 4,
    height: 4,
  }
});
const ETC1_RGB: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 36196,
  str: 'COMPRESSED_RGB_ETC1_WEBGL',
});
const RGBA8_EXT: CompressionTextureTypeEnum = new CompressionTextureTypeClass({
  index: 32856,
  str: 'RGBA8_EXT',
  blockInfo: {
    byteSize: 4,
    width: 1,
    height: 1,
  }
});

const typeList = [
  ASTC_RGBA_4x4,
  ASTC_RGBA_5x4,
  ASTC_RGBA_5x5,
  ASTC_RGBA_6x5,
  ASTC_RGBA_6x6,
  ASTC_RGBA_8x5,
  ASTC_RGBA_8x6,
  ASTC_RGBA_8x8,
  ASTC_RGBA_10x5,
  ASTC_RGBA_10x6,
  ASTC_RGBA_10x8,
  ASTC_RGBA_10x10,
  ASTC_RGBA_12x10,
  ASTC_RGBA_12x12,
  ASTC_SRGB_4x4,
  ASTC_SRGB_5x4,
  ASTC_SRGB_5x5,
  ASTC_SRGB_6x5,
  ASTC_SRGB_6x6,
  ASTC_SRGB_8x5,
  ASTC_SRGB_8x6,
  ASTC_SRGB_8x8,
  ASTC_SRGB_10x5,
  ASTC_SRGB_10x6,
  ASTC_SRGB_10x8,
  ASTC_SRGB_10x10,
  ASTC_SRGB_12x10,
  ASTC_SRGB_12x12,
  S3TC_RGB_DXT1,
  S3TC_RGBA_DXT1,
  S3TC_RGBA_DXT3,
  S3TC_RGBA_DXT5,
  BPTC_RGBA,
  PVRTC_RGBA_4BPPV1,
  PVRTC_RGB_4BPPV1,
  ETC2_RGBA8_EAC,
  ETC2_RGB8,
  ETC1_RGB,
  RGBA8_EXT,
];

function from(index: number): CompressionTextureTypeEnum {
  return _from({ typeList, index }) as CompressionTextureTypeEnum;
}

function fromString(str: string): CompressionTextureTypeEnum {
  return _fromString({ typeList, str }) as CompressionTextureTypeEnum;
}

export const CompressionTextureType = Object.freeze({
  ASTC_RGBA_4x4,
  ASTC_RGBA_5x4,
  ASTC_RGBA_5x5,
  ASTC_RGBA_6x5,
  ASTC_RGBA_6x6,
  ASTC_RGBA_8x5,
  ASTC_RGBA_8x6,
  ASTC_RGBA_8x8,
  ASTC_RGBA_10x5,
  ASTC_RGBA_10x6,
  ASTC_RGBA_10x8,
  ASTC_RGBA_10x10,
  ASTC_RGBA_12x10,
  ASTC_RGBA_12x12,
  ASTC_SRGB_4x4,
  ASTC_SRGB_5x4,
  ASTC_SRGB_5x5,
  ASTC_SRGB_6x5,
  ASTC_SRGB_6x6,
  ASTC_SRGB_8x5,
  ASTC_SRGB_8x6,
  ASTC_SRGB_8x8,
  ASTC_SRGB_10x5,
  ASTC_SRGB_10x6,
  ASTC_SRGB_10x8,
  ASTC_SRGB_10x10,
  ASTC_SRGB_12x10,
  ASTC_SRGB_12x12,
  S3TC_RGB_DXT1,
  S3TC_RGBA_DXT1,
  S3TC_RGBA_DXT3,
  S3TC_RGBA_DXT5,
  BPTC_RGBA,
  PVRTC_RGBA_4BPPV1,
  PVRTC_RGB_4BPPV1,
  ETC2_RGBA8_EAC,
  ETC2_RGB8,
  ETC1_RGB,
  RGBA8_EXT,
  from,
  fromString,
});
