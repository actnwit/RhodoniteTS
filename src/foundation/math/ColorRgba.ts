import Vector4 from './Vector4';
import {IVector4} from './IVector';
import {IColorRgba} from './IColor';
import { Array4 } from '../../types/CommonTypes';

export class ColorRgba extends Vector4 implements IVector4, IColorRgba {
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

  static fromCopyArray(array: Array<number>): ColorRgba {
    return this._fromCopyArray(array, Float32Array) as ColorRgba;
  }

  static fromCopyArray4(array: Array4<number>): ColorRgba {
    return this._fromCopyArray4(array, Float32Array) as ColorRgba;
  }

  static fromCopy4(x: number, y: number, z: number, w: number): ColorRgba {
    return this._fromCopy4(x, y, z, w, Float32Array) as ColorRgba;
  }

  static fromCopyVector4(vec4: IVector4): ColorRgba {
    return this._fromCopyVector4(vec4, Float32Array) as ColorRgba;
  }
}

export const ConstRgbaWhite = new ColorRgba(new Float32Array([1, 1, 1, 1]));
export const ConstRgbaBlack = new ColorRgba(new Float32Array([0, 0, 0, 1]));
