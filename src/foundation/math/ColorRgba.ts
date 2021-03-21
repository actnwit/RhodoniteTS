import Vector4 from './Vector4';
import {IVector4} from './IVector';
import {IColorRgba} from './IColor';
import {TypedArray} from '../../types/CommonTypes';

export default class ColorRgba extends Vector4 implements IVector4, IColorRgba {
  constructor(
    r: number | TypedArray | IVector4 | Array<number> | null,
    g?: number,
    b?: number,
    a?: number
  ) {
    super(r, g, b, a);
  }

  get x() {
    return this._v[0];
  }

  get y() {
    return this._v[1];
  }

  get z() {
    return this._v[2];
  }

  get w() {
    return this._v[3];
  }

  get r() {
    return this._v[0];
  }

  get g() {
    return this._v[1];
  }

  get b() {
    return this._v[2];
  }

  get a() {
    return this._v[3];
  }

  static zero() {
    return super._zero(Float32Array) as ColorRgba;
  }

  static one() {
    return super._one(Float32Array) as ColorRgba;
  }

  static dummy() {
    return super._dummy(Float32Array) as ColorRgba;
  }

  static normalize(vec: IVector4) {
    return super._normalize(vec, Float32Array) as ColorRgba;
  }

  static add(l_vec: IVector4, r_vec: IVector4) {
    return super._add(l_vec, r_vec, Float32Array) as ColorRgba;
  }

  static subtract(l_vec: IVector4, r_vec: IVector4) {
    return super._subtract(l_vec, r_vec, Float32Array) as ColorRgba;
  }

  static multiply(vec: IVector4, value: number) {
    return super._multiply(vec, value, Float32Array) as ColorRgba;
  }

  static multiplyVector(l_vec: IVector4, r_vec: IVector4) {
    return super._multiplyVector(l_vec, r_vec, Float32Array) as ColorRgba;
  }

  static divide(vec: IVector4, value: number) {
    return super._divide(vec, value, Float32Array) as ColorRgba;
  }

  static divideVector(l_vec: IVector4, r_vec: IVector4) {
    return super._divideVector(l_vec, r_vec, Float32Array) as ColorRgba;
  }

  clone(): ColorRgba {
    return super.clone() as ColorRgba;
  }
}
