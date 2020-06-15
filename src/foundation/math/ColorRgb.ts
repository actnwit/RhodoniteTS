import Vector3 from './Vector3';
import { IVector3, IVector4 } from './IVector';
import { IColorRgb } from './IColor';
import { TypedArray } from '../../commontypes/CommonTypes';

export default class ColorRgb extends Vector3 implements IVector3, IColorRgb {
  constructor(r: number | TypedArray | IVector3 | IVector4 | Array<number> | null, g?: number, b?: number) {
    super(r, g, b);
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
    return 1;
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
    return 1;
  }
}
