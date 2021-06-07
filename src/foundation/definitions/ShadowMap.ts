import {EnumClass, EnumIO, _from, _fromString} from '../misc/EnumIO';

export type ShadowMapEnum = EnumIO;

class ShadowMapClass extends EnumClass implements ShadowMapEnum {
  constructor({index, str}: {index: number; str: string}) {
    super({index, str});
  }
}

const Standard: ShadowMapEnum = new ShadowMapClass({index: 0, str: 'Standard'});
const Variance: ShadowMapEnum = new ShadowMapClass({index: 1, str: 'Variance'});

const typeList = [Standard, Variance];

function from(index: number): ShadowMapEnum | undefined {
  return _from({typeList, index});
}

function fromString(str: string): ShadowMapEnum {
  return _fromString({typeList, str}) as ShadowMapEnum;
}

export const ShadowMap = Object.freeze({Standard, Variance, from, fromString});
