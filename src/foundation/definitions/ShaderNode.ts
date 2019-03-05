import { EnumClass, EnumIO, _from, _fromString } from "../misc/EnumIO";

export interface ShaderNodeEnum extends EnumIO {
}

class ShaderNodeClass extends EnumClass implements ShaderNodeEnum {
  constructor({index, str} : {index: number, str: string}) {
    super({index, str});
  }
}

const ClassicShading: ShaderNodeEnum = new ShaderNodeClass({index:0, str:'ClassicShading'});
const PBRShading: ShaderNodeEnum = new ShaderNodeClass({index:1, str:'PBRShading'});
const Lerp: ShaderNodeEnum = new ShaderNodeClass({index:2, str:'Lerp'});
const Add: ShaderNodeEnum = new ShaderNodeClass({index:3, str:'Add'});

const typeList = [ClassicShading, PBRShading];

function from( index : number ): ShaderNodeEnum {
  return _from({typeList, index}) as ShaderNodeEnum;
}

function fromString( str: string ): ShaderNodeEnum {
  return _fromString({typeList, str}) as ShaderNodeEnum;
}

export const ShaderNode = Object.freeze({ClassicShading, PBRShading, from, fromString });
