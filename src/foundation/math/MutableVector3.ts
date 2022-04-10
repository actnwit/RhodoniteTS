import {
  IVector2,
  IVector3,
  IVector4,
  IMutableVector,
  IMutableVector3,
} from './IVector';
import {
  TypedArray,
  FloatTypedArrayConstructor,
  Array3,
} from '../../types/CommonTypes';
import {Vector3d, Vector3_} from './Vector3';
import {IQuaternion} from './IQuaternion';

export class MutableVector3_<T extends FloatTypedArrayConstructor>
  extends Vector3_<T>
  implements IMutableVector, IMutableVector3
{
  constructor(v: TypedArray, {type}: {type: T}) {
    super(v, {type});
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

  set z(z: number) {
    this._v[2] = z;
  }

  get z() {
    return this._v[2];
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

  setComponents(x: number, y: number, z: number) {
    this._v[0] = x;
    this._v[1] = y;
    this._v[2] = z;
    return this;
  }

  copyComponents(vec: IVector3) {
    return this.setComponents(vec._v[0], vec._v[1], vec._v[2]);
  }

  zero() {
    return this.setComponents(0, 0, 0);
  }

  one() {
    return this.setComponents(1, 1, 1);
  }

  /**
   * normalize
   */
  normalize() {
    const length = this.length();
    this.divide(length);
    return this;
  }

  /**
   * add value
   */
  add(vec: IVector3) {
    this._v[0] += vec._v[0];
    this._v[1] += vec._v[1];
    this._v[2] += vec._v[2];
    return this;
  }

  /**
   * subtract
   */
  subtract(vec: IVector3) {
    this._v[0] -= vec._v[0];
    this._v[1] -= vec._v[1];
    this._v[2] -= vec._v[2];
    return this;
  }

  /**
   * multiply
   */
  multiply(value: number) {
    this._v[0] *= value;
    this._v[1] *= value;
    this._v[2] *= value;
    return this;
  }

  /**
   * multiply vector
   */
  multiplyVector(vec: IVector3) {
    this._v[0] *= vec._v[0];
    this._v[1] *= vec._v[1];
    this._v[2] *= vec._v[2];
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
    } else {
      console.error('0 division occurred!');
      this._v[0] = Infinity;
      this._v[1] = Infinity;
      this._v[2] = Infinity;
    }

    return this;
  }

  /**
   * divide vector
   */
  divideVector(vec: IVector3) {
    if (vec._v[0] !== 0 && vec._v[1] !== 0 && vec._v[2] !== 0) {
      this._v[0] /= vec._v[0];
      this._v[1] /= vec._v[1];
      this._v[2] /= vec._v[2];
    } else {
      console.error('0 division occurred!');
      this._v[0] = vec._v[0] === 0 ? Infinity : this._v[0] / vec._v[0];
      this._v[1] = vec._v[1] === 0 ? Infinity : this._v[1] / vec._v[1];
      this._v[2] = vec._v[2] === 0 ? Infinity : this._v[2] / vec._v[2];
    }
    return this;
  }
  /**
   * cross product
   */
  cross(vec: IVector3) {
    const x = this._v[1] * vec._v[2] - this._v[2] * vec._v[1];
    const y = this._v[2] * vec._v[0] - this._v[0] * vec._v[2];
    const z = this._v[0] * vec._v[1] - this._v[1] * vec._v[0];

    return this.setComponents(x, y, z);
  }

  /**
   * quaternion * vector3
   */
  multiplyQuaternion(quat: IQuaternion) {
    const num = quat._v[0] * 2;
    const num2 = quat._v[1] * 2;
    const num3 = quat._v[2] * 2;
    const num4 = quat._v[0] * num;
    const num5 = quat._v[1] * num2;
    const num6 = quat._v[2] * num3;
    const num7 = quat._v[0] * num2;
    const num8 = quat._v[0] * num3;
    const num9 = quat._v[1] * num3;
    const num10 = quat._v[3] * num;
    const num11 = quat._v[3] * num2;
    const num12 = quat._v[3] * num3;

    const x =
      (1 - (num5 + num6)) * this._v[0] +
      (num7 - num12) * this._v[1] +
      (num8 + num11) * this._v[2];
    const y =
      (num7 + num12) * this._v[0] +
      (1 - (num4 + num6)) * this._v[1] +
      (num9 - num10) * this._v[2];
    const z =
      (num8 - num11) * this._v[0] +
      (num9 + num10) * this._v[1] +
      (1 - (num4 + num5)) * this._v[2];

    return this.setComponents(x, y, z);
  }
}

export class MutableVector3 extends MutableVector3_<Float32ArrayConstructor> {
  constructor(v: TypedArray) {
    super(v, {type: Float32Array});
  }

  static zero() {
    return super._zero(Float32Array) as MutableVector3;
  }

  static one() {
    return super._one(Float32Array) as MutableVector3;
  }

  static dummy() {
    return super._dummy(Float32Array) as MutableVector3;
  }

  static normalize(vec: IVector3) {
    return super._normalize(vec, Float32Array) as MutableVector3;
  }

  static add(l_vec: IVector3, r_vec: IVector3) {
    return super._add(l_vec, r_vec, Float32Array) as MutableVector3;
  }

  static subtract(l_vec: IVector3, r_vec: IVector3) {
    return super._subtract(l_vec, r_vec, Float32Array) as MutableVector3;
  }

  static multiply(vec: IVector3, value: number) {
    return super._multiply(vec, value, Float32Array) as MutableVector3;
  }

  static multiplyVector(l_vec: IVector3, r_vec: IVector3) {
    return super._multiplyVector(l_vec, r_vec, Float32Array) as MutableVector3;
  }

  static divide(vec: IVector3, value: number) {
    return super._divide(vec, value, Float32Array) as MutableVector3;
  }

  static divideVector(l_vec: IVector3, r_vec: IVector3) {
    return super._divideVector(l_vec, r_vec, Float32Array) as MutableVector3;
  }

  static cross(l_vec: IVector3, r_vec: IVector3) {
    return super._cross(l_vec, r_vec, Float32Array) as MutableVector3;
  }

  static multiplyQuaternion(quat: IQuaternion, vec: IVector3) {
    return super._multiplyQuaternion(quat, vec, Float32Array) as MutableVector3;
  }

  get className() {
    return 'MutableVector3';
  }

  static fromCopyArray3(array: Array3<number>): MutableVector3 {
    return new MutableVector3(new Float32Array(array));
  }
  static fromCopyArray(array: Array<number>): MutableVector3 {
    return new MutableVector3(new Float32Array(array.slice(0, 3)));
  }

  static fromFloat32Array(float32Array: Float32Array): MutableVector3 {
    return new MutableVector3(float32Array);
  }

  static fromCopyFloat32Array(float32Array: Float32Array): MutableVector3 {
    return new MutableVector3(new Float32Array(float32Array.buffer.slice(0)));
  }

  clone() {
    return super.clone() as MutableVector3;
  }
}

export class MutableVector3d extends MutableVector3_<Float64ArrayConstructor> {
  constructor(x: TypedArray) {
    super(x, {type: Float64Array});
  }

  static zero() {
    return super._zero(Float64Array) as MutableVector3d;
  }

  static one() {
    return super._one(Float64Array) as MutableVector3d;
  }

  static dummy() {
    return super._dummy(Float64Array) as MutableVector3d;
  }

  static normalize(vec: IVector3) {
    return super._normalize(vec, Float64Array) as MutableVector3d;
  }

  static add(l_vec: IVector3, r_vec: IVector3) {
    return super._add(l_vec, r_vec, Float64Array) as MutableVector3d;
  }

  static subtract(l_vec: IVector3, r_vec: IVector3) {
    return super._subtract(l_vec, r_vec, Float64Array) as MutableVector3d;
  }

  static multiply(vec: IVector3, value: number) {
    return super._multiply(vec, value, Float64Array) as MutableVector3d;
  }

  static multiplyVector(l_vec: IVector3, r_vec: IVector3) {
    return super._multiplyVector(l_vec, r_vec, Float64Array) as MutableVector3d;
  }

  static divide(vec: IVector3, value: number) {
    return super._divide(vec, value, Float64Array) as MutableVector3d;
  }

  static divideVector(l_vec: IVector3, r_vec: IVector3) {
    return super._divideVector(l_vec, r_vec, Float64Array) as MutableVector3d;
  }

  static cross(l_vec: IVector3, r_vec: IVector3) {
    return super._cross(l_vec, r_vec, Float64Array) as MutableVector3d;
  }

  static multiplyQuaternion(quat: IQuaternion, vec: IVector3) {
    return super._multiplyQuaternion(
      quat,
      vec,
      Float64Array
    ) as MutableVector3d;
  }

  static fromCopyArray3(array: Array3<number>): MutableVector3d {
    return new MutableVector3d(new Float64Array(array));
  }

  static fromCopyArray(array: Array<number>): MutableVector3d {
    return new MutableVector3d(new Float64Array(array.slice(0, 3)));
  }

  clone() {
    return super.clone() as MutableVector3d;
  }
}

export type MutableVector3f = MutableVector3;
