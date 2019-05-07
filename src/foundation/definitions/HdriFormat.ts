import { EnumClass, EnumIO, _from } from "../misc/EnumIO";

export interface HdriFormatEnum extends EnumIO {
}

class HdriFormatClass extends EnumClass implements HdriFormatEnum {

  constructor({index, str} : {index: number, str: string}) {
    super({index, str});

  }

}

const LDR_SRGB: HdriFormatEnum = new HdriFormatClass({index:0, str:'.ldr_srgb'});

const typeList = [ LDR_SRGB ];

function from( index : number ): HdriFormatEnum {
  return _from({typeList, index}) as HdriFormatEnum;
}

export const HdriFormat = Object.freeze({ LDR_SRGB });
