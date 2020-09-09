import { EnumClass, EnumIO, _from, _fromString } from "../misc/EnumIO";

export interface AlphaModeEnum extends EnumIO {

}

class AlphaModeClass extends EnumClass implements AlphaModeEnum {
  constructor({ index, str }: { index: number, str: string }) {
    super({ index, str });
  }
}

const Opaque: AlphaModeEnum = new AlphaModeClass({ index: 0, str: 'OPAQUE' });
const Mask: AlphaModeEnum = new AlphaModeClass({ index: 1, str: 'MASK' });
const Translucent: AlphaModeEnum = new AlphaModeClass({ index: 2, str: 'TRANSLUCENT' });
const Additive: AlphaModeEnum = new AlphaModeClass({ index: 3, str: 'ADDITIVE' });

const typeList = [Opaque, Mask, Translucent, Additive];

function from(index: number): AlphaModeEnum | undefined {
  return _from({ typeList, index });
}

function fromString(str: string): AlphaModeEnum | undefined {
  return _fromString({ typeList, str }) as AlphaModeEnum;
}

function fromGlTFString(str: string): AlphaModeEnum | undefined {
  if (str === 'BLEND') {
    return Translucent;
  }

  return _fromString({ typeList, str }) as AlphaModeEnum;
}

export const AlphaMode = Object.freeze({ Opaque, Mask, Translucent, Additive, from, fromString, fromGlTFString });
