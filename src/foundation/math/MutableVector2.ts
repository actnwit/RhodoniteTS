import {Vector2_} from './Vector2';
import {IVector2, IMutableVector, IMutableVector2} from './IVector';
import {
  TypedArray,
  FloatTypedArrayConstructor,
  Array2,
} from '../../types/CommonTypes';

export class MutableVector2_<
  T extends FloatTypedArrayConstructor
> extends Vector2_<T> {
  constructor(x: TypedArray, {type}: {type: T}) {
    super(x, {type});
  }

  set x(x: number) {
    this._v[0] = x;
  }

  get x() {
    return this._v[0];
  }

  set y(y: number) {
    this._v[1] = y;
  }

  get y() {
    return this._v[1];
  }

  get z() {
    return 0;
  }

  get w() {
    return 1;
  }

  raw() {
    return this._v;
  }

  setAt(i: number, value: number) {
    this._v[i] = value;
    return this;
  }

  setComponents(x: number, y: number) {
    this._v[0] = x;
    this._v[1] = y;
    return this;
  }

  copyComponents(vec: IVector2) {
    return this.setComponents(vec._v[0], vec._v[1]);
  }

  zero() {
    return this.setComponents(0, 0);
  }

  one() {
    return this.setComponents(1, 1);
  }

  normalize() {
    const length = this.length();
    this.divide(length);
    return this;
  }

  /**
   * add value
   */
  add(vec: IVector2) {
    this._v[0] += vec._v[0];
    this._v[1] += vec._v[1];
    return this;
  }

  /**
   * subtract
   */
  subtract(vec: IVector2) {
    this._v[0] -= vec._v[0];
    this._v[1] -= vec._v[1];
    return this;
  }

  /**
   * multiply
   */
  multiply(value: number) {
    this._v[0] *= value;
    this._v[1] *= value;
    return this;
  }

  /**
   * multiply vector
   */
  multiplyVector(vec: IVector2) {
    this._v[0] *= vec._v[0];
    this._v[1] *= vec._v[1];
    return this;
  }

  /**
   * divide
   */
  divide(value: number) {
    if (value !== 0) {
      this._v[0] /= value;
      this._v[1] /= value;
    } else {
      console.error('0 division occurred!');
      this._v[0] = Infinity;
      this._v[1] = Infinity;
    }
    return this;
  }

  /**
   * divide vector
   */
  divideVector(vec: IVector2) {
    if (vec._v[0] !== 0 && vec._v[1] !== 0) {
      this._v[0] /= vec._v[0];
      this._v[1] /= vec._v[1];
    } else {
      console.error('0 division occurred!');
      this._v[0] = vec._v[0] === 0 ? Infinity : this._v[0] / vec._v[0];
      this._v[1] = vec._v[1] === 0 ? Infinity : this._v[1] / vec._v[1];
    }
    return this;
  }
}

export default class MutableVector2
  extends MutableVector2_<Float32ArrayConstructor>
  implements IMutableVector, IMutableVector2
{
  constructor(x: TypedArray) {
    super(x, {type: Float32Array});
  }

  static fromCopyArray2(array: Array2<number>): MutableVector2 {
    return new MutableVector2(new Float32Array(array));
  }

  static fromCopyArray(array: Array<number>): MutableVector2 {
    return new MutableVector2(new Float32Array(array.slice(0, 2)));
  }

  static fromFloat32Array(float32Array: Float32Array): MutableVector2 {
    return new MutableVector2(float32Array);
  }

  static fromCopyFloat32Array(float32Array: Float32Array): MutableVector2 {
    return new MutableVector2(new Float32Array(float32Array.buffer.slice(0)));
  }

  static zero() {
    return super._zero(Float32Array) as MutableVector2;
  }

  static one() {
    return super._one(Float32Array) as MutableVector2;
  }

  static dummy() {
    return super._dummy(Float32Array) as MutableVector2;
  }

  static normalize(vec: IVector2) {
    return super._normalize(vec, Float32Array) as MutableVector2;
  }

  static add(l_vec: IVector2, r_vec: IVector2) {
    return super._add(l_vec, r_vec, Float32Array) as MutableVector2;
  }

  static subtract(l_vec: IVector2, r_vec: IVector2) {
    return super._subtract(l_vec, r_vec, Float32Array) as MutableVector2;
  }

  static multiply(vec: IVector2, value: number) {
    return super._multiply(vec, value, Float32Array) as MutableVector2;
  }

  static multiplyVector(l_vec: IVector2, r_vec: IVector2) {
    return super._multiplyVector(l_vec, r_vec, Float32Array) as MutableVector2;
  }

  static divide(vec: IVector2, value: number) {
    return super._divide(vec, value, Float32Array) as MutableVector2;
  }

  static divideVector(l_vec: IVector2, r_vec: IVector2) {
    return super._divideVector(l_vec, r_vec, Float32Array) as MutableVector2;
  }

  get className() {
    return 'MutableVector2';
  }

  clone() {
    return super.clone() as MutableVector2;
  }
}

export class MutableVector2d extends MutableVector2_<Float64ArrayConstructor> {
  constructor(x: TypedArray) {
    super(x, {type: Float64Array});
  }

  static fromCopyArray(array: Array2<number>): MutableVector2d {
    return new MutableVector2d(new Float64Array(array));
  }

  static zero() {
    return super._zero(Float64Array) as MutableVector2d;
  }

  static one() {
    return super._one(Float64Array) as MutableVector2d;
  }

  static dummy() {
    return super._dummy(Float64Array) as MutableVector2d;
  }

  static normalize(vec: IVector2) {
    return super._normalize(vec, Float64Array) as MutableVector2d;
  }

  static add(l_vec: IVector2, r_vec: IVector2) {
    return super._add(l_vec, r_vec, Float64Array) as MutableVector2d;
  }

  static subtract(l_vec: IVector2, r_vec: IVector2) {
    return super._subtract(l_vec, r_vec, Float64Array) as MutableVector2d;
  }

  static multiply(vec: IVector2, value: number) {
    return super._multiply(vec, value, Float64Array) as MutableVector2d;
  }

  static multiplyVector(l_vec: IVector2, r_vec: IVector2) {
    return super._multiplyVector(l_vec, r_vec, Float64Array) as MutableVector2d;
  }

  static divide(vec: IVector2, value: number) {
    return super._divide(vec, value, Float64Array) as MutableVector2d;
  }

  static divideVector(l_vec: IVector2, r_vec: IVector2) {
    return super._divideVector(l_vec, r_vec, Float64Array) as MutableVector2d;
  }

  clone() {
    return super.clone() as MutableVector2d;
  }
}

export type MutableVector2f = MutableVector2;
