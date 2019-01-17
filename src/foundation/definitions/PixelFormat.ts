import { EnumClass, EnumIO, _from } from "../misc/EnumIO";

export interface PixelFormatEnum extends EnumIO {
}

class PixelFormatClass extends EnumClass implements PixelFormatEnum {

  constructor({index, str} : {index: number, str: string}) {
    super({index, str});

  }

}

const DepthComponent: PixelFormatEnum = new PixelFormatClass({index:0x1902, str:'DEPTH_COMPONENT'});
const Alpha: PixelFormatEnum = new PixelFormatClass({index:0x1906, str:'ALPHA'});
const RGB: PixelFormatEnum = new PixelFormatClass({index:0x1907, str:'RGB'});
const RGBA: PixelFormatEnum = new PixelFormatClass({index:0x1908, str:'RGBA'});
const Luminance: PixelFormatEnum = new PixelFormatClass({index:0x1909, str:'LUMINANCE'});
const LuminanceAlpha: PixelFormatEnum = new PixelFormatClass({index:0x190A, str:'LUMINANCE_ALPHA'});

const typeList = [ DepthComponent, Alpha, RGB, RGBA, Luminance, LuminanceAlpha ];

function from( index : number ): PixelFormatEnum {
  return _from({typeList, index}) as PixelFormatEnum;
}

export const PixelFormat = Object.freeze({ DepthComponent, Alpha, RGB, RGBA, Luminance, LuminanceAlpha });
