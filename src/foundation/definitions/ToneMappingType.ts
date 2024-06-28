import { EnumClass, EnumIO, _from } from '../misc/EnumIO';

export type ToneMappingTypeEnum = EnumIO;

class ToneMappingTypeClass extends EnumClass implements ToneMappingTypeEnum {
  constructor({ index, str }: { index: number; str: string }) {
    super({ index, str });
  }
}

const None: ToneMappingTypeEnum = new ToneMappingTypeClass({
  index: -1,
  str: 'None',
});
const KhronosPbrNeutral: ToneMappingTypeEnum = new ToneMappingTypeClass({
  index: 0,
  str: 'Khronos_PBR_Neutral',
});
const Reinhard: ToneMappingTypeEnum = new ToneMappingTypeClass({
  index: 1,
  str: 'Reinhard',
});
const GT_ToneMap: ToneMappingTypeEnum = new ToneMappingTypeClass({
  index: 2,
  str: 'GT_ToneMap',
});

const typeList = [None, KhronosPbrNeutral, Reinhard, GT_ToneMap];

function from(index: number): ToneMappingTypeEnum {
  return _from({ typeList, index }) as ToneMappingTypeEnum;
}

export const ToneMappingType = Object.freeze({
  None,
  KhronosPbrNeutral,
  Reinhard,
  GT_ToneMap,
  from,
});
