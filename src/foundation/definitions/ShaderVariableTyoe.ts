import { EnumClass, EnumIO, _from, _fromString } from "../misc/EnumIO";

export interface ShaderVariableTypeEnum extends EnumIO {
}

class ShaderVariableTypeClass extends EnumClass implements ShaderVariableTypeEnum {
  constructor({index, str} : {index: number, str: string}) {
    super({index, str});
  }
}

const Varying: ShaderVariableTypeEnum = new ShaderVariableTypeClass({index:1, str:'Varying'});
const ReadOnlyData: ShaderVariableTypeEnum = new ShaderVariableTypeClass({index:2, str:'ReadOnlyData'});

const typeList = [Varying, ReadOnlyData];

function from( index : number ): ShaderVariableTypeEnum {
  return _from({typeList, index}) as ShaderVariableTypeEnum;
}

function fromString( str: string ): ShaderVariableTypeEnum {
  return _fromString({typeList, str}) as ShaderVariableTypeEnum;
}

export const ShaderType = Object.freeze({Varying, ReadOnlyData, from, fromString });
