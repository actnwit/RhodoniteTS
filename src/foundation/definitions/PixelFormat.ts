import { GL_RG } from '../../types';
import { _from, EnumClass, type EnumIO } from '../misc/EnumIO';

export type PixelFormatEnum = EnumIO;

class PixelFormatClass extends EnumClass implements PixelFormatEnum {
  constructor({ index, str }: { index: number; str: string }) {
    super({ index, str });
  }
}

const DepthComponent: PixelFormatEnum = new PixelFormatClass({
  index: 0x1902,
  str: 'DEPTH_COMPONENT',
});
const DepthStencil: PixelFormatEnum = new PixelFormatClass({
  index: 0x84f9,
  str: 'DEPTH_STENCIL',
});
const Alpha: PixelFormatEnum = new PixelFormatClass({
  index: 0x1906,
  str: 'ALPHA',
});
const RG: PixelFormatEnum = new PixelFormatClass({
  index: GL_RG,
  str: 'RG',
});
const RGB: PixelFormatEnum = new PixelFormatClass({
  index: 0x1907,
  str: 'RGB',
});
const RGBA: PixelFormatEnum = new PixelFormatClass({
  index: 0x1908,
  str: 'RGBA',
});
const Luminance: PixelFormatEnum = new PixelFormatClass({
  index: 0x1909,
  str: 'LUMINANCE',
});
const LuminanceAlpha: PixelFormatEnum = new PixelFormatClass({
  index: 0x190a,
  str: 'LUMINANCE_ALPHA',
});

function getCompositionNumFromPixelFormat(pixelFormat: PixelFormatEnum): number {
  switch (pixelFormat) {
    case DepthComponent:
      return 1;
    case DepthStencil:
      return 2;
    case Alpha:
      return 1;
    case RG:
      return 2;
    case RGB:
      return 3;
    case RGBA:
      return 4;
    case Luminance:
      return 1;
    case LuminanceAlpha:
      return 2;
    default:
      throw new Error(`Not supported ${pixelFormat}`);
  }
}

const typeList = [DepthComponent, DepthStencil, Alpha, RG, RGB, RGBA, Luminance, LuminanceAlpha];

function from(index: number): PixelFormatEnum {
  return _from({ typeList, index }) as PixelFormatEnum;
}

export const PixelFormat = Object.freeze({
  DepthComponent,
  DepthStencil,
  Alpha,
  RG,
  RGB,
  RGBA,
  Luminance,
  LuminanceAlpha,
  from,
  getCompositionNumFromPixelFormat,
});
