//import GLBoost from './../../globals';
import Vector2 from './Vector2';
import Vector4 from './ImmutableVector4';
import Vector3 from './Vector3';
import ColorRgb from './ColorRgb';
import ImmutableColorRgb from './ImmutableColorRgb';

export default class MutableColorRgb extends ImmutableColorRgb implements Vector3, ColorRgb {

  constructor(r?:number|TypedArray|Vector3|Vector4|Array<number>|ImmutableColorRgb|null, g?:number, b?:number) {
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

}
