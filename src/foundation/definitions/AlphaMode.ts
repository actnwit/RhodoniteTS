import { EnumClass, EnumIO, _from, _fromString } from "../misc/EnumIO";

export interface AlphaModeEnum extends EnumIO {

}

class AlphaModeClass extends EnumClass implements AlphaModeEnum {
  constructor({index, str} : {index: number, str: string}) {
    super({index, str});
  }
}

const Opaque: AlphaModeEnum = new AlphaModeClass({index:0, str:'OPAQUE'});
const Mask: AlphaModeEnum = new AlphaModeClass({index:1, str:'MASK'});
const Blend: AlphaModeEnum = new AlphaModeClass({index:2, str:'BLEND'});

const typeList = [Opaque, Mask, Blend];

function from( index : number): AlphaModeEnum {
  return _from({typeList, index});
}

function fromString( str: string ): AlphaModeEnum {
  return _fromString({typeList, str}) as AlphaModeEnum;
}

export const AlphaMode = Object.freeze({ Opaque, Mask, Blend, from, fromString });
