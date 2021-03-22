import {EnumClass, EnumIO, _from, _fromString} from '../misc/EnumIO';

export type CompressionTextureTypeEnum = EnumIO;

class CompressionTextureTypeClass
  extends EnumClass
  implements CompressionTextureTypeEnum {
  constructor({index, str}: {index: number; str: string}) {
    super({index, str});
  }
}

const ASTC_RGBA_4x4: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37808,
    str: 'COMPRESSED_RGBA_ASTC_4x4_KHR',
  }
);
const ASTC_RGBA_5x4: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37809,
    str: 'COMPRESSED_RGBA_ASTC_5x4_KHR',
  }
);
const ASTC_RGBA_5x5: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37810,
    str: 'COMPRESSED_RGBA_ASTC_5x5_KHR',
  }
);
const ASTC_RGBA_6x5: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37811,
    str: 'COMPRESSED_RGBA_ASTC_6x5_KHR',
  }
);
const ASTC_RGBA_6x6: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37812,
    str: 'COMPRESSED_RGBA_ASTC_6x6_KHR',
  }
);
const ASTC_RGBA_8x5: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37813,
    str: 'COMPRESSED_RGBA_ASTC_8x5_KHR',
  }
);
const ASTC_RGBA_8x6: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37814,
    str: 'COMPRESSED_RGBA_ASTC_8x6_KHR',
  }
);
const ASTC_RGBA_8x8: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37815,
    str: 'COMPRESSED_RGBA_ASTC_8x8_KHR',
  }
);
const ASTC_RGBA_10x5: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37816,
    str: 'COMPRESSED_RGBA_ASTC_10x5_KHR',
  }
);
const ASTC_RGBA_10x6: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37817,
    str: 'COMPRESSED_RGBA_ASTC_10x6_KHR',
  }
);
const ASTC_RGBA_10x8: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37818,
    str: 'COMPRESSED_RGBA_ASTC_10x8_KHR',
  }
);
const ASTC_RGBA_10x10: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37819,
    str: 'COMPRESSED_RGBA_ASTC_10x10_KHR',
  }
);
const ASTC_RGBA_12x10: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37820,
    str: 'COMPRESSED_RGBA_ASTC_12x10_KHR',
  }
);
const ASTC_RGBA_12x12: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37821,
    str: 'COMPRESSED_RGBA_ASTC_12x12_KHR',
  }
);
const ASTC_SRGB_4x4: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37840,
    str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR',
  }
);
const ASTC_SRGB_5x4: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37841,
    str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR',
  }
);
const ASTC_SRGB_5x5: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37842,
    str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR',
  }
);
const ASTC_SRGB_6x5: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37843,
    str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR',
  }
);
const ASTC_SRGB_6x6: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37844,
    str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR',
  }
);
const ASTC_SRGB_8x5: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37845,
    str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR',
  }
);
const ASTC_SRGB_8x6: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37846,
    str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR',
  }
);
const ASTC_SRGB_8x8: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37847,
    str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR',
  }
);
const ASTC_SRGB_10x5: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37848,
    str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR',
  }
);
const ASTC_SRGB_10x6: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37849,
    str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR',
  }
);
const ASTC_SRGB_10x8: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37850,
    str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR',
  }
);
const ASTC_SRGB_10x10: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37851,
    str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR',
  }
);
const ASTC_SRGB_12x10: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37852,
    str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR',
  }
);
const ASTC_SRGB_12x12: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 37853,
    str: 'COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR',
  }
);

const S3TC_RGB_DXT1: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 33776,
    str: 'COMPRESSED_RGB_S3TC_DXT1_EXT',
  }
);
const S3TC_RGBA_DXT1: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 33777,
    str: 'COMPRESSED_RGBA_S3TC_DXT1_EXT',
  }
);
const S3TC_RGBA_DXT3: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 33778,
    str: 'COMPRESSED_RGBA_S3TC_DXT3_EXT',
  }
);
const S3TC_RGBA_DXT5: CompressionTextureTypeEnum = new CompressionTextureTypeClass(
  {
    index: 33779,
    str: 'COMPRESSED_RGBA_S3TC_DXT5_EXT',
  }
);

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
];

function from(index: number): CompressionTextureTypeEnum {
  return _from({typeList, index}) as CompressionTextureTypeEnum;
}

function fromString(str: string): CompressionTextureTypeEnum {
  return _fromString({typeList, str}) as CompressionTextureTypeEnum;
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
  from,
  fromString,
});
