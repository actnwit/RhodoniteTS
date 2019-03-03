import { EnumClass, EnumIO, _from, _fromString } from "../misc/EnumIO";

export interface MaterialElementEnum extends EnumIO {
}

class MaterialElementClass extends EnumClass implements MaterialElementEnum {
  constructor({index, str} : {index: number, str: string}) {
    super({index, str});
  }
}

const ClassicShading: MaterialElementEnum = new MaterialElementClass({index:0, str:'ClassicShading'});
const PBRShading: MaterialElementEnum = new MaterialElementClass({index:1, str:'PBRShading'});
const Lerp: MaterialElementEnum = new MaterialElementClass({index:2, str:'Lerp'});
const Add: MaterialElementEnum = new MaterialElementClass({index:3, str:'Add'});

const typeList = [ClassicShading, PBRShading];

function from( index : number ): MaterialElementEnum {
  return _from({typeList, index}) as MaterialElementEnum;
}

function fromString( str: string ): MaterialElementEnum {
  return _fromString({typeList, str}) as MaterialElementEnum;
}

export const MaterialElement = Object.freeze({ClassicShading, PBRShading, from, fromString });
