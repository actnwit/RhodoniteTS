import { EnumClass, EnumIO, _from, _fromString } from "../misc/EnumIO";

export interface ShaderTypeEnum extends EnumIO {
}

class ShaderTypeClass extends EnumClass implements ShaderTypeEnum {
  constructor({index, str} : {index: number, str: string}) {
    super({index, str});
  }
}

const VertexShader: ShaderTypeEnum = new ShaderTypeClass({index:1, str:'VertexShader'});
const PixelShader: ShaderTypeEnum = new ShaderTypeClass({index:2, str:'PixelShader'});
const ComputeShader: ShaderTypeEnum = new ShaderTypeClass({index:4, str:'ComputeShader'});

const typeList = [VertexShader, PixelShader, ComputeShader];

function from( index : number ): ShaderTypeEnum {
  return _from({typeList, index}) as ShaderTypeEnum;
}

function fromString( str: string ): ShaderTypeEnum {
  return _fromString({typeList, str}) as ShaderTypeEnum;
}

export const ShaderType = Object.freeze({VertexShader, PixelShader, ComputeShader, from, fromString });
