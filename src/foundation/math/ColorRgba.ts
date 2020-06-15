import Vector4 from './Vector4';
import { IVector4 } from './IVector';
import { IColorRgba } from './IColor';
import { TypedArray } from '../../commontypes/CommonTypes';

export default class ColorRgba extends Vector4 implements IVector4, IColorRgba {

  constructor(r: number | TypedArray | IVector4 | Array<number> | null, g?: number, b?: number, a?: number) {
    super(r, g, b, a);
  }

  get x() {
    return this.v[0];
  }

  get y() {
    return this.v[1];
  }

  get z() {
    return this.v[2];
  }

  get w() {
    return this.v[3];
  }

  get r() {
    return this.v[0];
  }

  get g() {
    return this.v[1];
  }

  get b() {
    return this.v[2];
  }

  get a() {
    return this.v[3];
  }
}
