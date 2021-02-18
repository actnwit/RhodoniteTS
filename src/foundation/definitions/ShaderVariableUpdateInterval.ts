import { EnumClass, EnumIO, _from, _fromString } from '../misc/EnumIO';

export interface ShaderVariableUpdateIntervalEnum extends EnumIO {
}

class ShaderVariableUpdateIntervalClass extends EnumClass implements ShaderVariableUpdateIntervalEnum {
  constructor({index, str} : {index: number, str: string}) {
    super({index, str});
  }
}

const FirstTimeOnly: ShaderVariableUpdateIntervalEnum = new ShaderVariableUpdateIntervalClass({index:0, str:'FirstTimeOnly'});
const EveryTime: ShaderVariableUpdateIntervalEnum = new ShaderVariableUpdateIntervalClass({index:1, str:'EveryTime'});
const RenderPass: ShaderVariableUpdateIntervalEnum = new ShaderVariableUpdateIntervalClass({index:2, str:'RenderPass'});

const typeList = [FirstTimeOnly, EveryTime, RenderPass];

function from( index : number ): ShaderVariableUpdateIntervalEnum {
  return _from({typeList, index}) as ShaderVariableUpdateIntervalEnum;
}

function fromString( str: string ): ShaderVariableUpdateIntervalEnum {
  return _fromString({typeList, str}) as ShaderVariableUpdateIntervalEnum;
}

export const ShaderVariableUpdateInterval = Object.freeze({FirstTimeOnly, EveryTime, RenderPass, from, fromString });
