import {EnumClass, EnumIO, _from, _fromString} from '../misc/EnumIO';

export type GpuStateEnum = EnumIO;

class GpuStateClass extends EnumClass implements GpuStateEnum {
  constructor({index, str}: {index: number; str: string}) {
    super({index, str});
  }
}

const DepthTest: GpuStateEnum = new GpuStateClass({index: 0, str: 'DEPTH_TEST'});

const typeList = [DepthTest];

function from(index: number): GpuStateEnum | undefined {
  return _from({typeList, index});
}

function fromString(str: string): GpuStateEnum | undefined {
  return _fromString({typeList, str}) as GpuStateEnum;
}

export const AlphaMode = Object.freeze({
  DepthTest,
  from,
  fromString,
});
