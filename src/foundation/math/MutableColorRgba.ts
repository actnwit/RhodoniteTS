import MutableVector4 from './MutableVector4';
import { IVector4 } from './IVector';
import { IMutableColorRgba } from './IColor';
import { TypedArray } from '../../commontypes/CommonTypes';

export default class MutableColorRgba extends MutableVector4 implements IVector4, IMutableColorRgba {

  constructor(r: number | TypedArray | IVector4 | Array<number> | null, g?: number, b?: number, a?: number) {
    super(r, g, b, a);
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
    return this.v[3];
  }

  set w(val) {
    this.v[3] = val;
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
    return this.v[3];
  }

  set a(val) {
    this.v[3] = val;
  }

  static zero() {
    return super._zero(Float32Array) as MutableColorRgba;
  }

  static one() {
    return super._one(Float32Array) as MutableColorRgba;
  }

  static dummy() {
    return super._dummy(Float32Array) as MutableColorRgba;
  }

  static normalize(vec: IVector4) {
    return super._normalize(vec, Float32Array) as MutableColorRgba;
  }

  static add(l_vec: IVector4, r_vec: IVector4) {
    return super._add(l_vec, r_vec, Float32Array) as MutableColorRgba;
  }

  static subtract(l_vec: IVector4, r_vec: IVector4) {
    return super._subtract(l_vec, r_vec, Float32Array) as MutableColorRgba;
  }

  static multiply(vec: IVector4, value: number) {
    return super._multiply(vec, value, Float32Array) as MutableColorRgba;
  }

  static multiplyVector(l_vec: IVector4, r_vec: IVector4) {
    return super._multiplyVector(l_vec, r_vec, Float32Array) as MutableColorRgba;
  }

  static divide(vec: IVector4, value: number) {
    return super._divide(vec, value, Float32Array) as MutableColorRgba;
  }

  static divideVector(l_vec: IVector4, r_vec: IVector4) {
    return super._divideVector(l_vec, r_vec, Float32Array) as MutableColorRgba;
  }
}
