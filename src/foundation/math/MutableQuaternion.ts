import { Quaternion } from './Quaternion';
import { IVector3, IVector4 } from './IVector';
import { Array4, TypedArray } from '../../types/CommonTypes';
import { IMutableQuaternion, ILogQuaternion, IQuaternion } from './IQuaternion';
import { IMatrix44 } from './IMatrix';
import { MutableMatrix44 } from './MutableMatrix44';
import { Logger } from '../misc/Logger';

export class MutableQuaternion extends Quaternion implements IMutableQuaternion {
  constructor(x: Float32Array) {
    super(x);
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
    return MutableQuaternion.fromCopy4(0, 0, 0, 1);
  }

  static dummy() {
    return new this(new Float32Array(0));
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
      Logger.error('0 division occurred!');
    }

    this._v[3] = Math.cos(halfAngle);
    this._v[0] = (sin * vec._v[0]) / length;
    this._v[1] = (sin * vec._v[1]) / length;
    this._v[2] = (sin * vec._v[2]) / length;

    return this;
  }

  fromMatrix(mat: IMatrix44) {
    let sx = Math.hypot(mat.m00, mat.m10, mat.m20);
    const sy = Math.hypot(mat.m01, mat.m11, mat.m21);
    const sz = Math.hypot(mat.m02, mat.m12, mat.m22);

    const det = mat.determinant();
    if (det < 0) {
      sx = -sx;
    }

    const m = MutableMatrix44.fromCopyMatrix44(mat);

    const invSx = 1 / sx;
    const invSy = 1 / sy;
    const invSz = 1 / sz;

    m.m00 *= invSx;
    m.m10 *= invSx;
    m.m20 *= invSx;

    m.m01 *= invSy;
    m.m11 *= invSy;
    m.m21 *= invSy;

    m.m02 *= invSz;
    m.m12 *= invSz;
    m.m22 *= invSz;

    const trace = m.m00 + m.m11 + m.m22;

    if (trace > 0) {
      const S = 0.5 / Math.sqrt(trace + 1.0);
      this._v[0] = (m.m21 - m.m12) * S;
      this._v[1] = (m.m02 - m.m20) * S;
      this._v[2] = (m.m10 - m.m01) * S;
      this._v[3] = 0.25 / S;
    } else if (m.m00 > m.m11 && m.m00 > m.m22) {
      const S = Math.sqrt(1.0 + m.m00 - m.m11 - m.m22) * 2;
      this._v[0] = 0.25 * S;
      this._v[1] = (m.m01 + m.m10) / S;
      this._v[2] = (m.m02 + m.m20) / S;
      this._v[3] = (m.m21 - m.m12) / S;
    } else if (m.m11 > m.m22) {
      const S = Math.sqrt(1.0 + m.m11 - m.m00 - m.m22) * 2;
      this._v[0] = (m.m01 + m.m10) / S;
      this._v[1] = 0.25 * S;
      this._v[2] = (m.m12 + m.m21) / S;
      this._v[3] = (m.m02 - m.m20) / S;
    } else {
      const S = Math.sqrt(1.0 + m.m22 - m.m00 - m.m11) * 2;
      this._v[0] = (m.m02 + m.m20) / S;
      this._v[1] = (m.m12 + m.m21) / S;
      this._v[2] = 0.25 * S;
      this._v[3] = (m.m10 - m.m01) / S;
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
      Logger.error('0 division occurred!');
      this._v[0] = Infinity;
      this._v[1] = Infinity;
      this._v[2] = Infinity;
      this._v[3] = Infinity;
    }
    return this;
  }

  clone(): IMutableQuaternion {
    return MutableQuaternion.fromCopy4(
      this._v[0],
      this._v[1],
      this._v[2],
      this._v[3]
    ) as IMutableQuaternion;
  }

  static fromFloat32Array(array: Float32Array) {
    return new MutableQuaternion(array);
  }

  static fromCopyArray4(array: Array4<number>) {
    return new MutableQuaternion(new Float32Array(array));
  }

  static fromCopyArray(array: Array<number>) {
    return new MutableQuaternion(new Float32Array(array.slice(0, 4)));
  }

  static fromCopy4(x: number, y: number, z: number, w: number) {
    return new MutableQuaternion(new Float32Array([x, y, z, w]));
  }

  static fromCopyQuaternion(quat: IQuaternion) {
    const v = new Float32Array(4);
    v[0] = quat._v[0];
    v[1] = quat._v[1];
    v[2] = quat._v[2];
    v[3] = quat._v[3];
    return new MutableQuaternion(v);
  }

  static fromCopyVector4(vec: IVector4) {
    const v = new Float32Array(4);
    v[0] = vec._v[0];
    v[1] = vec._v[1];
    v[2] = vec._v[2];
    v[3] = vec._v[3];
    return new MutableQuaternion(v);
  }

  static fromCopyLogQuaternion(x: ILogQuaternion) {
    const theta = x._v[0] * x._v[0] + x._v[1] * x._v[1] + x._v[2] * x._v[2];
    const sin = Math.sin(theta);
    const v = new Float32Array(4);
    v[0] = x._v[0] * (sin / theta);
    v[1] = x._v[1] * (sin / theta);
    v[2] = x._v[2] * (sin / theta);
    v[3] = Math.cos(theta);
    return new MutableQuaternion(v);
  }
}
