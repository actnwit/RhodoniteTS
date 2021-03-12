import {Vector2_} from './Vector2';
import {
  IVector2,
  IVector3,
  IVector4,
  IMutableVector,
  IMutableVector2,
} from './IVector';
import {TypedArray, TypedArrayConstructor} from '../../commontypes/CommonTypes';

export class MutableVector2_<
  T extends TypedArrayConstructor
> extends Vector2_<T> {
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
    {type}: {type: T}
  ) {
    super(x, y, {type});
  }

  set x(x: number) {
    this.v[0] = x;
  }

  get x() {
    return this.v[0];
  }

  set y(y: number) {
    this.v[1] = y;
  }

  get y() {
    return this.v[1];
  }

  get z() {
    return 0;
  }

  get w() {
    return 1;
  }

  raw() {
    return this.v;
  }

  setAt(i: number, value: number) {
    this.v[i] = value;
    return this;
  }

  setComponents(x: number, y: number) {
    this.v[0] = x;
    this.v[1] = y;
    return this;
  }

  copyComponents(vec: IVector2) {
    return this.setComponents(vec.v[0], vec.v[1]);
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
    this.v[0] += vec.v[0];
    this.v[1] += vec.v[1];
    return this;
  }

  /**
   * subtract
   */
  subtract(vec: IVector2) {
    this.v[0] -= vec.v[0];
    this.v[1] -= vec.v[1];
    return this;
  }

  /**
   * multiply
   */
  multiply(value: number) {
    this.v[0] *= value;
    this.v[1] *= value;
    return this;
  }

  /**
   * multiply vector
   */
  multiplyVector(vec: IVector2) {
    this.v[0] *= vec.v[0];
    this.v[1] *= vec.v[1];
    return this;
  }

  /**
   * divide
   */
  divide(value: number) {
    if (value !== 0) {
      this.v[0] /= value;
      this.v[1] /= value;
    } else {
      console.error('0 division occurred!');
      this.v[0] = Infinity;
      this.v[1] = Infinity;
    }
    return this;
  }

  /**
   * divide vector
   */
  divideVector(vec: IVector2) {
    if (vec.v[0] !== 0 && vec.v[1] !== 0) {
      this.v[0] /= vec.v[0];
      this.v[1] /= vec.v[1];
    } else {
      console.error('0 division occurred!');
      this.v[0] = vec.v[0] === 0 ? Infinity : this.v[0] / vec.v[0];
      this.v[1] = vec.v[1] === 0 ? Infinity : this.v[1] / vec.v[1];
    }
    return this;
  }
}

export default class MutableVector2
  extends MutableVector2_<Float32ArrayConstructor>
  implements IMutableVector, IMutableVector2 {
  constructor(
    x:
      | number
      | TypedArray
      | IVector2
      | IVector3
      | IVector4
      | Array<number>
      | null,
    y?: number
  ) {
    super(x, y!, {type: Float32Array});
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
    return this.constructor.name;
  }

  clone() {
    return super.clone() as MutableVector2;
  }
}

export class MutableVector2d extends MutableVector2_<Float64ArrayConstructor> {
  constructor(
    x:
      | number
      | TypedArray
      | IVector2
      | IVector3
      | IVector4
      | Array<number>
      | null,
    y?: number
  ) {
    super(x, y!, {type: Float64Array});
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
