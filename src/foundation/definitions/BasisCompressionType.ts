import {EnumClass, EnumIO, _from, _fromString} from '../misc/EnumIO';

export type BasisCompressionTypeEnum = EnumIO;

class BasisCompressionTypeClass
  extends EnumClass
  implements BasisCompressionTypeEnum {
  constructor({index, str}: {index: number; str: string}) {
    super({index, str});
  }
}

const ETC1: BasisCompressionTypeEnum = new BasisCompressionTypeClass({
  index: 0,
  str: 'ETC1',
});
const ETC2: BasisCompressionTypeEnum = new BasisCompressionTypeClass({
  index: 1,
  str: 'ETC2',
});
const BC1: BasisCompressionTypeEnum = new BasisCompressionTypeClass({
  index: 2,
  str: 'BC1',
});
const BC3: BasisCompressionTypeEnum = new BasisCompressionTypeClass({
  index: 3,
  str: 'BC3',
});
const BC4: BasisCompressionTypeEnum = new BasisCompressionTypeClass({
  index: 4,
  str: 'BC4',
});
const BC5: BasisCompressionTypeEnum = new BasisCompressionTypeClass({
  index: 5,
  str: 'BC5',
});
const BC7_M6_OPAQUE: BasisCompressionTypeEnum = new BasisCompressionTypeClass({
  index: 6,
  str: 'BC7_M6_OPAQUE',
});
const BC7_M5: BasisCompressionTypeEnum = new BasisCompressionTypeClass({
  index: 7,
  str: 'BC7_M5',
});
const PVRTC1_RGB: BasisCompressionTypeEnum = new BasisCompressionTypeClass({
  index: 8,
  str: 'PVRTC1_RGB',
});
const PVRTC1_RGBA: BasisCompressionTypeEnum = new BasisCompressionTypeClass({
  index: 9,
  str: 'PVRTC1_RGBA',
});
const ASTC: BasisCompressionTypeEnum = new BasisCompressionTypeClass({
  index: 10,
  str: 'ASTC',
});
const ATC_RGB: BasisCompressionTypeEnum = new BasisCompressionTypeClass({
  index: 11,
  str: 'ATC_RGB',
});
const ATC_RGBA: BasisCompressionTypeEnum = new BasisCompressionTypeClass({
  index: 12,
  str: 'ATC_RGBA',
});
const RGBA32: BasisCompressionTypeEnum = new BasisCompressionTypeClass({
  index: 13,
  str: 'RGBA32',
});
const RGB565: BasisCompressionTypeEnum = new BasisCompressionTypeClass({
  index: 14,
  str: 'RGB565',
});
const BGR565: BasisCompressionTypeEnum = new BasisCompressionTypeClass({
  index: 15,
  str: 'BGR565',
});
const RGBA4444: BasisCompressionTypeEnum = new BasisCompressionTypeClass({
  index: 16,
  str: 'RGBA4444',
});

const typeList = [
  ETC1,
  ETC2,
  BC1,
  BC3,
  BC4,
  BC5,
  BC7_M5,
  BC7_M6_OPAQUE,
  PVRTC1_RGB,
  PVRTC1_RGBA,
  ASTC,
  ATC_RGB,
  ATC_RGBA,
  RGBA32,
  RGB565,
  BGR565,
  RGBA4444,
];

function from(index: number): BasisCompressionTypeEnum {
  return _from({typeList, index}) as BasisCompressionTypeEnum;
}

function fromString(str: string): BasisCompressionTypeEnum {
  return _fromString({typeList, str}) as BasisCompressionTypeEnum;
}

export const BasisCompressionType = Object.freeze({
  ETC1,
  ETC2,
  BC1,
  BC3,
  BC4,
  BC5,
  BC7_M5,
  BC7_M6_OPAQUE,
  PVRTC1_RGB,
  PVRTC1_RGBA,
  ASTC,
  ATC_RGB,
  ATC_RGBA,
  RGBA32,
  RGB565,
  BGR565,
  RGBA4444,
  from,
  fromString,
});
