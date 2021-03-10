import {
  IVector2,
  IVector3,
  IVector4,
  IMutableVector,
  IMutableVector4,
} from './IVector';
import {TypedArray, TypedArrayConstructor} from '../../commontypes/CommonTypes';
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
    this.v[0] = x;
  }

  get x(): number {
    return this.v[0];
  }

  set y(y: number) {
    this.v[1] = y;
  }

  get y(): number {
    return this.v[1];
  }

  set z(z: number) {
    this.v[2] = z;
  }

  get z(): number {
    return this.v[2];
  }

  set w(w: number) {
    this.v[3] = w;
  }

  get w(): number {
    return this.v[3];
  }

  raw() {
    return this.v;
  }

  setAt(i: number, value: number) {
    this.v[i] = value;
    return this;
  }

  setComponents(x: number, y: number, z: number, w: number) {
    this.v[0] = x;
    this.v[1] = y;
    this.v[2] = z;
    this.v[3] = w;
    return this;
  }

  copyComponents(vec: IVector4) {
    return this.setComponents(vec.v[0], vec.v[1], vec.v[2], vec.v[3]);
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
    const length = Math.hypot(this.v[0], this.v[1], this.v[2]);
    this.divide(length);
    return this;
  }

  /**
   * add value
   */
  add(vec: IVector4) {
    this.v[0] += vec.v[0];
    this.v[1] += vec.v[1];
    this.v[2] += vec.v[2];
    this.v[3] += vec.v[3];
    return this;
  }

  /**
   * subtract
   */
  subtract(vec: IVector4) {
    this.v[0] -= vec.v[0];
    this.v[1] -= vec.v[1];
    this.v[2] -= vec.v[2];
    this.v[3] -= vec.v[3];
    return this;
  }

  /**
   * multiply
   */
  multiply(value: number) {
    this.v[0] *= value;
    this.v[1] *= value;
    this.v[2] *= value;
    this.v[3] *= value;
    return this;
  }

  /**
   * multiply vector
   */
  multiplyVector(vec: IVector4) {
    this.v[0] *= vec.v[0];
    this.v[1] *= vec.v[1];
    this.v[2] *= vec.v[2];
    this.v[3] *= vec.v[3];
    return this;
  }

  /**
   * divide
   */
  divide(value: number) {
    if (value !== 0) {
      this.v[0] /= value;
      this.v[1] /= value;
      this.v[2] /= value;
      this.v[3] /= value;
    } else {
      console.error('0 division occurred!');
      this.v[0] = Infinity;
      this.v[1] = Infinity;
      this.v[2] = Infinity;
      this.v[3] = Infinity;
    }
    return this;
  }

  /**
   * divide vector
   */
  divideVector(vec: IVector4) {
    if (vec.v[0] !== 0 && vec.v[1] !== 0 && vec.v[2] !== 0 && vec.v[3] !== 0) {
      this.v[0] /= vec.v[0];
      this.v[1] /= vec.v[1];
      this.v[2] /= vec.v[2];
      this.v[3] /= vec.v[3];
    } else {
      console.error('0 division occurred!');
      this.v[0] = vec.v[0] === 0 ? Infinity : this.v[0] / vec.v[0];
      this.v[1] = vec.v[1] === 0 ? Infinity : this.v[1] / vec.v[1];
      this.v[2] = vec.v[2] === 0 ? Infinity : this.v[2] / vec.v[2];
      this.v[3] = vec.v[3] === 0 ? Infinity : this.v[3] / vec.v[3];
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

  clone() {
    return super.clone() as MutableVector4;
  }

  get className() {
    return this.constructor.name;
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
