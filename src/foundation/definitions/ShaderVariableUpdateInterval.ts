import {EnumClass, EnumIO, _from, _fromString} from '../misc/EnumIO';

export type ShaderVariableUpdateIntervalEnum = EnumIO;

class ShaderVariableUpdateIntervalClass
  extends EnumClass
  implements ShaderVariableUpdateIntervalEnum
{
  constructor({index, str}: {index: number; str: string}) {
    super({index, str});
  }
}

const FirstTimeOnly: ShaderVariableUpdateIntervalEnum =
  new ShaderVariableUpdateIntervalClass({index: 0, str: 'FirstTimeOnly'}); // If the previous object was the same material as mine, the parameter will not be set in my turn.
const EveryTime: ShaderVariableUpdateIntervalEnum =
  new ShaderVariableUpdateIntervalClass({index: 1, str: 'EveryTime'}); // The parameters are set each time the object is drawn.
const RenderPass: ShaderVariableUpdateIntervalEnum =
  new ShaderVariableUpdateIntervalClass({index: 2, str: 'RenderPass'});

const typeList = [FirstTimeOnly, EveryTime, RenderPass];

function from(index: number): ShaderVariableUpdateIntervalEnum {
  return _from({typeList, index}) as ShaderVariableUpdateIntervalEnum;
}

function fromString(str: string): ShaderVariableUpdateIntervalEnum {
  return _fromString({typeList, str}) as ShaderVariableUpdateIntervalEnum;
}

export const ShaderVariableUpdateInterval = Object.freeze({
  FirstTimeOnly,
  EveryTime,
  RenderPass,
  from,
  fromString,
});
