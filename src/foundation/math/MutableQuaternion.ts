import { Quaternion } from './Quaternion';
import {IVector3, IVector4} from './IVector';
import {TypedArray} from '../../types/CommonTypes';
import {IMutableQuaternion, ILogQuaternion, IQuaternion} from './IQuaternion';
import {IMatrix44} from './IMatrix';

export class MutableQuaternion
  extends Quaternion
  implements IMutableQuaternion
{
  constructor(
    x?:
      | number
      | TypedArray
      | IVector3
      | IVector4
      | IQuaternion
      | ILogQuaternion
      | Array<number>
      | null,
    y?: number,
    z?: number,
    w?: number
  ) {
    super(x, y, z, w);
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

  get className() {
    return 'MutableQuaternion';
  }

  static identity() {
    return super.identity() as MutableQuaternion;
  }

  static dummy() {
    return super.dummy() as MutableQuaternion;
  }

  static invert(quat: IQuaternion) {
    return super.invert(quat) as MutableQuaternion;
  }

  static qlerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number) {
    return super.qlerp(l_quat, r_quat, ratio) as MutableQuaternion;
  }

  static lerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number) {
    return super.lerp(l_quat, r_quat, ratio) as MutableQuaternion;
  }

  static axisAngle(vec: IVector3, radian: number) {
    return super.axisAngle(vec, radian) as MutableQuaternion;
  }

  static fromMatrix(mat: IMatrix44) {
    return super.fromMatrix(mat) as MutableQuaternion;
  }

  static fromPosition(vec: IVector3) {
    return super.fromPosition(vec) as MutableQuaternion;
  }

  static add(l_quat: IQuaternion, r_quat: IQuaternion) {
    return super.add(l_quat, r_quat) as MutableQuaternion;
  }

  static subtract(l_quat: IQuaternion, r_quat: IQuaternion) {
    return super.subtract(l_quat, r_quat) as MutableQuaternion;
  }

  static multiply(l_quat: IQuaternion, r_quat: IQuaternion) {
    return super.multiply(l_quat, r_quat) as MutableQuaternion;
  }

  static multiplyNumber(quat: IQuaternion, value: number) {
    return super.multiplyNumber(quat, value) as MutableQuaternion;
  }

  static divideNumber(quat: IQuaternion, value: number) {
    return super.divideNumber(quat, value) as MutableQuaternion;
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

  copyComponents(quat: IQuaternion) {
    return this.setComponents(quat._v[0], quat._v[1], quat._v[2], quat._v[3]);
  }

  identity() {
    return this.setComponents(0, 0, 0, 1);
  }

  normalize() {
    const norm = this.length();
    return this.divideNumber(norm);
  }

  invert() {
    const norm = this.length();
    if (norm === 0.0) {
      return this; // [0, 0, 0, 0]
    }

    this._v[0] = -this._v[0] / norm;
    this._v[1] = -this._v[1] / norm;
    this._v[2] = -this._v[2] / norm;
    this._v[3] = this._v[3] / norm;
    return this;
  }

  qlerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number) {
    let qr =
      l_quat._v[3] * r_quat._v[3] +
      l_quat._v[0] * r_quat._v[0] +
      l_quat._v[1] * r_quat._v[1] +
      l_quat._v[2] * r_quat._v[2];
    const ss = 1.0 - qr * qr;

    if (ss === 0.0) {
      return this.copyComponents(l_quat);
    } else {
      if (qr > 1) {
        qr = 0.999;
      } else if (qr < -1) {
        qr = -0.999;
      }

      let ph = Math.acos(qr);
      let s2;
      if (qr < 0.0 && ph > Math.PI / 2.0) {
        qr =
          -l_quat._v[3] * r_quat._v[3] -
          l_quat._v[0] * r_quat._v[0] -
          l_quat._v[1] * r_quat._v[1] -
          l_quat._v[2] * r_quat._v[2];
        ph = Math.acos(qr);
        s2 = (-1 * Math.sin(ph * ratio)) / Math.sin(ph);
      } else {
        s2 = Math.sin(ph * ratio) / Math.sin(ph);
      }
      const s1 = Math.sin(ph * (1.0 - ratio)) / Math.sin(ph);

      this._v[0] = l_quat._v[0] * s1 + r_quat._v[0] * s2;
      this._v[1] = l_quat._v[1] * s1 + r_quat._v[1] * s2;
      this._v[2] = l_quat._v[2] * s1 + r_quat._v[2] * s2;
      this._v[3] = l_quat._v[3] * s1 + r_quat._v[3] * s2;
    }

    return this;
  }

  lerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number) {
    this._v[0] = l_quat._v[0] * (1 - ratio) + r_quat._v[0] * ratio;
    this._v[1] = l_quat._v[1] * (1 - ratio) + r_quat._v[1] * ratio;
    this._v[2] = l_quat._v[2] * (1 - ratio) + r_quat._v[2] * ratio;
    this._v[3] = l_quat._v[3] * (1 - ratio) + r_quat._v[3] * ratio;

    return this;
  }

  axisAngle(vec: IVector3, radian: number) {
    const halfAngle = 0.5 * radian;
    const sin = Math.sin(halfAngle);

    const length = vec.length();
    if (length === 0) {
      console.error('0 division occurred!');
    }

    this._v[3] = Math.cos(halfAngle);
    this._v[0] = (sin * vec._v[0]) / length;
    this._v[1] = (sin * vec._v[1]) / length;
    this._v[2] = (sin * vec._v[2]) / length;

    return this;
  }

  fromMatrix(mat: IMatrix44) {
    const tr = mat.m00 + mat.m11 + mat.m22;

    if (tr > 0) {
      const S = 0.5 / Math.sqrt(tr + 1.0);
      this._v[0] = (mat.m21 - mat.m12) * S;
      this._v[1] = (mat.m02 - mat.m20) * S;
      this._v[2] = (mat.m10 - mat.m01) * S;
      this._v[3] = 0.25 / S;
    } else if (mat.m00 > mat.m11 && mat.m00 > mat.m22) {
      const S = Math.sqrt(1.0 + mat.m00 - mat.m11 - mat.m22) * 2;
      this._v[0] = 0.25 * S;
      this._v[1] = (mat.m01 + mat.m10) / S;
      this._v[2] = (mat.m02 + mat.m20) / S;
      this._v[3] = (mat.m21 - mat.m12) / S;
    } else if (mat.m11 > mat.m22) {
      const S = Math.sqrt(1.0 + mat.m11 - mat.m00 - mat.m22) * 2;
      this._v[0] = (mat.m01 + mat.m10) / S;
      this._v[1] = 0.25 * S;
      this._v[2] = (mat.m12 + mat.m21) / S;
      this._v[3] = (mat.m02 - mat.m20) / S;
    } else {
      const S = Math.sqrt(1.0 + mat.m22 - mat.m00 - mat.m11) * 2;
      this._v[0] = (mat.m02 + mat.m20) / S;
      this._v[1] = (mat.m12 + mat.m21) / S;
      this._v[2] = 0.25 * S;
      this._v[3] = (mat.m10 - mat.m01) / S;
    }

    return this;
  }

  fromPosition(vec: IVector3) {
    return this.setComponents(vec._v[0], vec._v[1], vec._v[2], 0);
  }

  add(quat: IQuaternion) {
    this._v[0] += quat._v[0];
    this._v[1] += quat._v[1];
    this._v[2] += quat._v[2];
    this._v[3] += quat._v[3];
    return this;
  }

  subtract(quat: IQuaternion) {
    this._v[0] -= quat._v[0];
    this._v[1] -= quat._v[1];
    this._v[2] -= quat._v[2];
    this._v[3] -= quat._v[3];
    return this;
  }

  multiply(quat: IQuaternion) {
    const x =
      quat._v[3] * this._v[0] +
      quat._v[2] * this._v[1] +
      quat._v[1] * this._v[2] -
      quat._v[0] * this._v[3];
    const y =
      -quat._v[2] * this._v[0] +
      quat._v[3] * this._v[1] +
      quat._v[0] * this._v[2] -
      quat._v[1] * this._v[3];
    const z =
      quat._v[1] * this._v[0] +
      quat._v[0] * this._v[1] +
      quat._v[3] * this._v[2] -
      quat._v[2] * this._v[3];
    const w =
      -quat._v[0] * this._v[0] -
      quat._v[1] * this._v[1] -
      quat._v[2] * this._v[2] -
      quat._v[3] * this._v[3];
    return this.setComponents(x, y, z, w);
  }

  multiplyNumber(value: number) {
    this._v[0] *= value;
    this._v[1] *= value;
    this._v[2] *= value;
    this._v[3] *= value;
    return this;
  }

  divideNumber(value: number) {
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

  clone(): MutableQuaternion {
    return super.clone() as MutableQuaternion;
  }
}
