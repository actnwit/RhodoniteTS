import MutableVector3 from './MutableVector3';
import { IVector3, IVector4 } from './IVector';
import { IMutableColorRgb } from './IColor';
import { TypedArray } from '../../commontypes/CommonTypes';

export default class MutableColorRgb extends MutableVector3 implements IVector3, IMutableColorRgb {

  constructor(r: number | TypedArray | IVector3 | IVector4 | Array<number> | null, g?: number, b?: number) {
    super(r, g, b);
  }

  get x() {
    return this.v[0];
  }

  set x(val) {
    this.v[0] = val;
  }

  get y() {
    return this.v[1];
  }

  set y(val) {
    this.v[1] = val;
  }

  get z() {
    return this.v[2];
  }

  set z(val) {
    this.v[2] = val;
  }

  get w() {
    return 1;
  }

  get r() {
    return this.v[0];
  }

  set r(val) {
    this.v[0] = val;
  }

  get g() {
    return this.v[1];
  }

  set g(val) {
    this.v[1] = val;
  }

  get b() {
    return this.v[2];
  }

  set b(val) {
    this.v[2] = val;
  }

  get a() {
    return 1;
  }
}
