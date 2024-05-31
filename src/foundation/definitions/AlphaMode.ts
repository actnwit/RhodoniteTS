import { EnumClass, EnumIO, _from, _fromString } from '../misc/EnumIO';

export interface AlphaModeEnum extends EnumIO {
  toGltfString(): string;
}

class AlphaModeClass extends EnumClass implements AlphaModeEnum {
  constructor({ index, str }: { index: number; str: string }) {
    super({ index, str });
  }

  toGltfString(): string {
    return this.str;
  }
}

const Opaque: AlphaModeEnum = new AlphaModeClass({ index: 0, str: 'OPAQUE' });
const Mask: AlphaModeEnum = new AlphaModeClass({ index: 1, str: 'MASK' });
const Blend: AlphaModeEnum = new AlphaModeClass({
  index: 2,
  str: 'BLEND',
});
const OpaqueTransmission: AlphaModeEnum = new AlphaModeClass({
  index: 3,
  str: 'OPAQUE_TRANSMISSION',
});

const typeList = [Opaque, Mask, Blend, OpaqueTransmission];

function from(index: number): AlphaModeEnum | undefined {
  return _from({ typeList, index }) as AlphaModeEnum;
}

function fromString(str: string): AlphaModeEnum | undefined {
  return _fromString({ typeList, str }) as AlphaModeEnum;
}

function fromGlTFString(str: string): AlphaModeEnum | undefined {
  return _fromString({ typeList, str }) as AlphaModeEnum;
}

export const AlphaMode = Object.freeze({
  Opaque,
  Mask,
  Blend,
  OpaqueTransmission,
  from,
  fromString,
  fromGlTFString,
});
