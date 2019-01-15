import Vector2 from './Vector2';
import Vector4 from './ImmutableVector4';
import Vector3 from './Vector3';
import {IMutableColorRgb} from './IColor';
import ColorRgb from './ColorRgb';

export default class MutableColorRgb extends ColorRgb implements Vector3, IMutableColorRgb {

  constructor(r?:number|TypedArray|Vector3|Vector4|Array<number>|ColorRgb|null, g?:number, b?:number) {
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
