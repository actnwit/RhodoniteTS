import { _from, _fromString, EnumClass, type EnumIO } from '../misc/EnumIO';

export type SdfShapeTypeEnum = EnumIO;

class SdfShapeTypeClass extends EnumClass implements SdfShapeTypeEnum {
  constructor({ index, str }: { index: number; str: string }) {
    super({ index, str });
  }
}

const Custom: SdfShapeTypeEnum = new SdfShapeTypeClass({
  index: 0,
  str: 'Custom',
});
const Sphere: SdfShapeTypeEnum = new SdfShapeTypeClass({
  index: 1,
  str: 'Sphere',
});
const Box: SdfShapeTypeEnum = new SdfShapeTypeClass({ index: 2, str: 'Box' });

const typeList = [Custom, Sphere, Box];

function from(index: number): SdfShapeTypeEnum {
  return _from({ typeList, index }) as SdfShapeTypeEnum;
}

function fromString(str: string): SdfShapeTypeEnum {
  return _fromString({ typeList, str }) as SdfShapeTypeEnum;
}

export const SdfShapeType = Object.freeze({
  Custom,
  Sphere,
  Box,
  from,
  fromString,
});
