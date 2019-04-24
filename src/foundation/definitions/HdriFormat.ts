import { EnumClass, EnumIO, _from } from "../misc/EnumIO";

export interface HdriFormatEnum extends EnumIO {
}

class HdriFormatClass extends EnumClass implements HdriFormatEnum {

  constructor({index, str} : {index: number, str: string}) {
    super({index, str});

  }

}

const HDR: HdriFormatEnum = new HdriFormatClass({index:0, str:'.hdr'});
const RGBE_PNG: HdriFormatEnum = new HdriFormatClass({index:1, str:'.rgbe.png'});
const RGB9_E5_PNG: HdriFormatEnum = new HdriFormatClass({index:2, str:'.rgb9_e5.png'});
const OpenEXR: HdriFormatEnum = new HdriFormatClass({index:3, str:'.exr'});
const LDR_SRGB: HdriFormatEnum = new HdriFormatClass({index:4, str:'.ldr_srgb'});
const LDR_LINEAR: HdriFormatEnum = new HdriFormatClass({index:5, str:'.ldr_linear'});

const typeList = [ HDR, RGBE_PNG, RGB9_E5_PNG, OpenEXR, LDR_SRGB, LDR_LINEAR ];

function from( index : number ): HdriFormatEnum {
  return _from({typeList, index}) as HdriFormatEnum;
}

export const HdriFormat = Object.freeze({ HDR, RGBE_PNG, RGB9_E5_PNG, OpenEXR, LDR_SRGB, LDR_LINEAR });
