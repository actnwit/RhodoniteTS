import {EnumClass, EnumIO, _from, _fromString} from '../misc/EnumIO';

export type BoneDataTypeEnum = EnumIO;

class BoneDataTypeClass extends EnumClass implements BoneDataTypeEnum {
  constructor({index, str}: {index: number; str: string}) {
    super({index, str});
  }
}

const Mat4x4: BoneDataTypeEnum = new BoneDataTypeClass({
  index: 0,
  str: 'Mat4x4',
});
const Vec4x2: BoneDataTypeEnum = new BoneDataTypeClass({
  index: 1,
  str: 'Vec4x2',
});
const Vec4x1: BoneDataTypeEnum = new BoneDataTypeClass({
  index: 2,
  str: 'Vec4x1',
});

const typeList = [Mat4x4, Vec4x2, Vec4x1];

function from(index: number): BoneDataTypeEnum {
  return _from({typeList, index}) as BoneDataTypeEnum;
}

function fromString(str: string): BoneDataTypeEnum {
  return _fromString({typeList, str}) as BoneDataTypeEnum;
}

export const BoneDataType = Object.freeze({
  Mat4x4,
  Vec4x2,
  Vec4x1,
  from,
  fromString,
});
