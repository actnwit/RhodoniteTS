import { MutableVector3 } from './MutableVector3';
import { IVector3, IVector4, IMutableVector3 } from './IVector';
import { IMutableColorRgb } from './IColor';

export class MutableColorRgb extends MutableVector3 implements IMutableVector3, IMutableColorRgb {
  constructor(r: Float32Array) {
    super(r);
  }

  get x() {
    return this._v[0];
  }

  set x(val) {
    this._v[0] = val;
  }

  get y() {
    return this._v[1];
  }

  set y(val) {
    this._v[1] = val;
  }

  get z() {
    return this._v[2];
  }

  set z(val) {
    this._v[2] = val;
  }

  get w() {
    return 1;
  }

  get r() {
    return this._v[0];
  }

  set r(val) {
    this._v[0] = val;
  }

  get g() {
    return this._v[1];
  }

  set g(val) {
    this._v[1] = val;
  }

  get b() {
    return this._v[2];
  }

  set b(val) {
    this._v[2] = val;
  }

  get a() {
    return 1;
  }

  static zero() {
    return super._zero(Float32Array) as MutableColorRgb;
  }

  static one() {
    return super._one(Float32Array) as MutableColorRgb;
  }

  static dummy() {
    return super._dummy(Float32Array) as MutableColorRgb;
  }

  static normalize(vec: IVector3) {
    return super._normalize(vec, Float32Array) as MutableColorRgb;
  }

  static add(l_vec: IVector3, r_vec: IVector3) {
    return super._add(l_vec, r_vec, Float32Array) as MutableColorRgb;
  }

  static subtract(l_vec: IVector3, r_vec: IVector3) {
    return super._subtract(l_vec, r_vec, Float32Array) as MutableColorRgb;
  }

  static multiply(vec: IVector3, value: number) {
    return super._multiply(vec, value, Float32Array) as MutableColorRgb;
  }

  static multiplyVector(l_vec: IVector3, r_vec: IVector3) {
    return super._multiplyVector(l_vec, r_vec, Float32Array) as MutableColorRgb;
  }

  static divide(vec: IVector3, value: number) {
    return super._divide(vec, value, Float32Array) as MutableColorRgb;
  }

  static divideVector(l_vec: IVector3, r_vec: IVector3) {
    return super._divideVector(l_vec, r_vec, Float32Array) as MutableColorRgb;
  }

  static cross(l_vec: IVector3, r_vec: IVector3) {
    return super._cross(l_vec, r_vec, Float32Array) as MutableColorRgb;
  }

  clone(): MutableColorRgb {
    return super.clone() as MutableColorRgb;
  }
}
