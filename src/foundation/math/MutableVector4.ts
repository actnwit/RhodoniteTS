import {
  IVector2,
  IVector3,
  IVector4,
  IMutableVector,
  IMutableVector4,
} from './IVector';
import {TypedArray, TypedArrayConstructor} from '../../types/CommonTypes';
import {Vector4_} from './Vector4';

export class MutableVector4_<T extends TypedArrayConstructor>
  extends Vector4_<T>
  implements IMutableVector, IMutableVector4 {
  constructor(
    x:
      | number
      | TypedArray
      | IVector2
      | IVector3
      | IVector4
      | Array<number>
      | null,
    y: number,
    z: number,
    w: number,
    {type}: {type: T}
  ) {
    super(x, y, z, w, {type});
  }

  set x(x: number) {
    this._v[0] = x;
  }

  get x(): number {
    return this._v[0];
  }

  set y(y: number) {
    this._v[1] = y;
  }

  get y(): number {
    return this._v[1];
  }

  set z(z: number) {
    this._v[2] = z;
  }

  get z(): number {
    return this._v[2];
  }

  set w(w: number) {
    this._v[3] = w;
  }

  get w(): number {
    return this._v[3];
  }

  raw() {
    return this._v;
  }

  setAt(i: number, value: number) {
    this._v[i] = value;
    return this;
  }

  setComponents(x: number, y: number, z: number, w: number) {
    this._v[0] = x;
    this._v[1] = y;
    this._v[2] = z;
    this._v[3] = w;
    return this;
  }

  copyComponents(vec: IVector4) {
    return this.setComponents(vec._v[0], vec._v[1], vec._v[2], vec._v[3]);
  }

  zero() {
    return this.setComponents(0, 0, 0, 0);
  }

  one() {
    return this.setComponents(1, 1, 1, 1);
  }

  /**
   * normalize
   */
  normalize() {
    const length = this.length();
    this.divide(length);
    return this;
  }

  normalize3() {
    const length = Math.hypot(this._v[0], this._v[1], this._v[2]);
    this.divide(length);
    return this;
  }

  /**
   * add value
   */
  add(vec: IVector4) {
    this._v[0] += vec._v[0];
    this._v[1] += vec._v[1];
    this._v[2] += vec._v[2];
    this._v[3] += vec._v[3];
    return this;
  }

  /**
   * subtract
   */
  subtract(vec: IVector4) {
    this._v[0] -= vec._v[0];
    this._v[1] -= vec._v[1];
    this._v[2] -= vec._v[2];
    this._v[3] -= vec._v[3];
    return this;
  }

  /**
   * multiply
   */
  multiply(value: number) {
    this._v[0] *= value;
    this._v[1] *= value;
    this._v[2] *= value;
    this._v[3] *= value;
    return this;
  }

  /**
   * multiply vector
   */
  multiplyVector(vec: IVector4) {
    this._v[0] *= vec._v[0];
    this._v[1] *= vec._v[1];
    this._v[2] *= vec._v[2];
    this._v[3] *= vec._v[3];
    return this;
  }

  /**
   * divide
   */
  divide(value: number) {
    if (value !== 0) {
      this._v[0] /= value;
      this._v[1] /= value;
      this._v[2] /= value;
      this._v[3] /= value;
    } else {
      console.error('0 division occurred!');
      this._v[0] = Infinity;
      this._v[1] = Infinity;
      this._v[2] = Infinity;
      this._v[3] = Infinity;
    }
    return this;
  }

  /**
   * divide vector
   */
  divideVector(vec: IVector4) {
    if (
      vec._v[0] !== 0 &&
      vec._v[1] !== 0 &&
      vec._v[2] !== 0 &&
      vec._v[3] !== 0
    ) {
      this._v[0] /= vec._v[0];
      this._v[1] /= vec._v[1];
      this._v[2] /= vec._v[2];
      this._v[3] /= vec._v[3];
    } else {
      console.error('0 division occurred!');
      this._v[0] = vec._v[0] === 0 ? Infinity : this._v[0] / vec._v[0];
      this._v[1] = vec._v[1] === 0 ? Infinity : this._v[1] / vec._v[1];
      this._v[2] = vec._v[2] === 0 ? Infinity : this._v[2] / vec._v[2];
      this._v[3] = vec._v[3] === 0 ? Infinity : this._v[3] / vec._v[3];
    }
    return this;
  }
}

export default class MutableVector4 extends MutableVector4_<Float32ArrayConstructor> {
  constructor(
    x:
      | number
      | TypedArray
      | IVector2
      | IVector3
      | IVector4
      | Array<number>
      | null,
    y?: number,
    z?: number,
    w?: number
  ) {
    super(x, y!, z!, w!, {type: Float32Array});
  }

  static zero() {
    return super._zero(Float32Array) as MutableVector4;
  }

  static one() {
    return super._one(Float32Array) as MutableVector4;
  }

  static dummy() {
    return super._dummy(Float32Array) as MutableVector4;
  }

  static normalize(vec: IVector4) {
    return super._normalize(vec, Float32Array) as MutableVector4;
  }

  static add(l_vec: IVector4, r_vec: IVector4) {
    return super._add(l_vec, r_vec, Float32Array) as MutableVector4;
  }

  static subtract(l_vec: IVector4, r_vec: IVector4) {
    return super._subtract(l_vec, r_vec, Float32Array) as MutableVector4;
  }

  static multiply(vec: IVector4, value: number) {
    return super._multiply(vec, value, Float32Array) as MutableVector4;
  }

  static multiplyVector(l_vec: IVector4, r_vec: IVector4) {
    return super._multiplyVector(l_vec, r_vec, Float32Array) as MutableVector4;
  }

  static divide(vec: IVector4, value: number) {
    return super._divide(vec, value, Float32Array) as MutableVector4;
  }

  static divideVector(l_vec: IVector4, r_vec: IVector4) {
    return super._divideVector(l_vec, r_vec, Float32Array) as MutableVector4;
  }

  get className() {
    return 'MutableVector4';
  }

  clone() {
    return super.clone() as MutableVector4;
  }
}

export class MutableVector4d extends MutableVector4_<Float64ArrayConstructor> {
  constructor(
    x:
      | number
      | TypedArray
      | IVector2
      | IVector3
      | IVector4
      | Array<number>
      | null,
    y?: number,
    z?: number,
    w?: number
  ) {
    super(x, y!, z!, w!, {type: Float64Array});
  }

  static zero() {
    return super._zero(Float64Array) as MutableVector4d;
  }

  static one() {
    return super._one(Float64Array) as MutableVector4d;
  }

  static dummy() {
    return super._dummy(Float64Array) as MutableVector4d;
  }

  static normalize(vec: IVector4) {
    return super._normalize(vec, Float64Array) as MutableVector4d;
  }

  static add(l_vec: IVector4, r_vec: IVector4) {
    return super._add(l_vec, r_vec, Float64Array) as MutableVector4d;
  }

  static subtract(l_vec: IVector4, r_vec: IVector4) {
    return super._subtract(l_vec, r_vec, Float64Array) as MutableVector4d;
  }

  static multiply(vec: IVector4, value: number) {
    return super._multiply(vec, value, Float64Array) as MutableVector4d;
  }

  static multiplyVector(l_vec: IVector4, r_vec: IVector4) {
    return super._multiplyVector(l_vec, r_vec, Float64Array) as MutableVector4d;
  }

  static divide(vec: IVector4, value: number) {
    return super._divide(vec, value, Float64Array) as MutableVector4d;
  }

  static divideVector(l_vec: IVector4, r_vec: IVector4) {
    return super._divideVector(l_vec, r_vec, Float64Array) as MutableVector4d;
  }

  clone() {
    return super.clone() as MutableVector4d;
  }
}

export type MutableVector4f = MutableVector4;
