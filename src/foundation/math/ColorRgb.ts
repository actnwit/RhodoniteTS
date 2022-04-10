import { Vector3 } from './Vector3';
import {IVector3} from './IVector';
import {IColorRgb} from './IColor';

export class ColorRgb extends Vector3 implements IVector3, IColorRgb {
  constructor(r: Float32Array) {
    super(r);
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
    return 1;
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
    return 1;
  }

  static zero() {
    return super._zero(Float32Array) as ColorRgb;
  }

  static one() {
    return super._one(Float32Array) as ColorRgb;
  }

  static dummy() {
    return super._dummy(Float32Array) as ColorRgb;
  }

  static normalize(vec: IVector3) {
    return super._normalize(vec, Float32Array) as ColorRgb;
  }

  static add(l_vec: IVector3, r_vec: IVector3) {
    return super._add(l_vec, r_vec, Float32Array) as ColorRgb;
  }

  static subtract(l_vec: IVector3, r_vec: IVector3) {
    return super._subtract(l_vec, r_vec, Float32Array) as ColorRgb;
  }

  static multiply(vec: IVector3, value: number) {
    return super._multiply(vec, value, Float32Array) as ColorRgb;
  }

  static multiplyVector(l_vec: IVector3, r_vec: IVector3) {
    return super._multiplyVector(l_vec, r_vec, Float32Array) as ColorRgb;
  }

  static divide(vec: IVector3, value: number) {
    return super._divide(vec, value, Float32Array) as ColorRgb;
  }

  static divideVector(l_vec: IVector3, r_vec: IVector3) {
    return super._divideVector(l_vec, r_vec, Float32Array) as ColorRgb;
  }

  static cross(l_vec: IVector3, r_vec: IVector3) {
    return super._cross(l_vec, r_vec, Float32Array) as ColorRgb;
  }

  clone(): ColorRgb {
    return super.clone() as ColorRgb;
  }
}
