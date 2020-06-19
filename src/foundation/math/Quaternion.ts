import { IVector2, IVector3, IVector4 } from './IVector';
import { TypedArray } from '../../commontypes/CommonTypes';
import { MathUtil } from './MathUtil';
import { CompositionType } from '../definitions/CompositionType';
import { IQuaternion, ILogQuaternion, IMutableQuaternion } from './IQuaternion';
import { IMutableVector3 } from './IVector';
import { IMatrix44 } from './IMatrix';
import LogQuaternion from './LogQuaternion';

export default class Quaternion implements IQuaternion {
  private static __tmp_upVec: any = undefined;
  v: TypedArray;

  constructor(x?: number | TypedArray | IVector2 | IVector3 | IVector4 | IQuaternion | ILogQuaternion | Array<number> | null, y?: number, z?: number, w?: number) {
    if (ArrayBuffer.isView(x)) {
      this.v = (x as TypedArray);
      return;
    } else if (x == null) {
      this.v = new Float32Array(0);
      return;
    } else {
      this.v = new Float32Array(4);
    }

    if (Array.isArray(x)) {
      this.v[0] = x[0];
      this.v[1] = x[1];
      this.v[2] = x[2];
      this.v[3] = x[3];
    } else if (typeof x === 'number') {
      this.v[0] = x;
      this.v[1] = y as number;
      this.v[2] = z as number;
      this.v[3] = w as number;
    } else if (x instanceof LogQuaternion) {
      const theta = x.v[0] * x.v[0] + x.v[1] * x.v[1] + x.v[2] * x.v[2];
      const sin = Math.sin(theta);
      this.v[0] = x.v[0] * (sin / theta);
      this.v[1] = x.v[1] * (sin / theta);
      this.v[2] = x.v[2] * (sin / theta);
      this.v[3] = Math.cos(theta);
    } else {
      if (typeof x.v[2] === 'undefined') {
        // IVector2
        this.v[0] = x.v[0];
        this.v[1] = x.v[1];
        this.v[2] = 0;
        this.v[3] = 1;
      } else if (typeof x.v[3] === 'undefined') {
        // IVector3
        this.v[0] = x.v[0];
        this.v[1] = x.v[1];
        this.v[2] = x.v[2];
        this.v[3] = 1;
      } else {
        // IVector4 and IQuaternion
        this.v[0] = x.v[0];
        this.v[1] = x.v[1];
        this.v[2] = x.v[2];
        this.v[3] = x.v[3];
      }
    }
  }

  get x(): number {
    return this.v[0];
  }

  get y(): number {
    return this.v[1];
  }

  get z(): number {
    return this.v[2];
  }

  get w(): number {
    return this.v[3];
  }

  get className() {
    return this.constructor.name;
  }

  static get compositionType() {
    return CompositionType.Vec4;
  }

  static identity() {
    return new this(0, 0, 0, 1);
  }

  static dummy() {
    return new this(null);
  }

  static invert(quat: IQuaternion) {
    const norm = quat.length();
    if (norm === 0.0) {
      return new this(0, 0, 0, 0);
    }

    const x = - quat.v[0] / norm;
    const y = - quat.v[1] / norm;
    const z = - quat.v[2] / norm;
    const w = quat.v[3] / norm;
    return new this(x, y, z, w);
  }

  static invertTo(quat: IQuaternion, out: IMutableQuaternion) {
    const norm = quat.length();
    if (norm === 0.0) {
      return out.setComponents(0, 0, 0, 0);
    }

    out.v[0] = - quat.v[0] / norm;
    out.v[1] = - quat.v[1] / norm;
    out.v[2] = - quat.v[2] / norm;
    out.v[3] = quat.v[3] / norm;
    return out;
  }

  static qlerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number) {
    let qr = l_quat.v[3] * r_quat.v[3] + l_quat.v[0] * r_quat.v[0] + l_quat.v[1] * r_quat.v[1] + l_quat.v[2] * r_quat.v[2];
    const ss = 1.0 - qr * qr;

    if (ss === 0.0) {
      return l_quat.clone();
    } else {

      if (qr > 1) {
        qr = 0.999;
      } else if (qr < -1) {
        qr = -0.999;
      }

      let ph = Math.acos(qr);
      let s2;
      if (qr < 0.0 && ph > Math.PI / 2.0) {
        qr = - l_quat.v[3] * r_quat.v[3] - l_quat.v[0] * r_quat.v[0] - l_quat.v[1] * r_quat.v[1] - l_quat.v[2] * r_quat.v[2];
        ph = Math.acos(qr);
        s2 = -1 * Math.sin(ph * ratio) / Math.sin(ph);
      } else {
        s2 = Math.sin(ph * ratio) / Math.sin(ph);
      }
      const s1 = Math.sin(ph * (1.0 - ratio)) / Math.sin(ph);

      return new this(
        l_quat.v[0] * s1 + r_quat.v[0] * s2,
        l_quat.v[1] * s1 + r_quat.v[1] * s2,
        l_quat.v[2] * s1 + r_quat.v[2] * s2,
        l_quat.v[3] * s1 + r_quat.v[3] * s2
      );
    }
  }

  static qlerpTo(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number, out: IMutableQuaternion) {

    let qr = l_quat.v[3] * r_quat.v[3] + l_quat.v[0] * r_quat.v[0] + l_quat.v[1] * r_quat.v[1] + l_quat.v[2] * r_quat.v[2];
    const ss = 1.0 - qr * qr;

    if (ss === 0.0) {
      return out.copyComponents(l_quat);
    } else {

      if (qr > 1) {
        qr = 0.999;
      } else if (qr < -1) {
        qr = -0.999;
      }

      let ph = Math.acos(qr);
      let s2;
      if (qr < 0.0 && ph > Math.PI / 2.0) {
        qr = - l_quat.v[3] * r_quat.v[3] - l_quat.v[0] * r_quat.v[0] - l_quat.v[1] * r_quat.v[1] - l_quat.v[2] * r_quat.v[2];
        ph = Math.acos(qr);
        s2 = -1 * Math.sin(ph * ratio) / Math.sin(ph);
      } else {
        s2 = Math.sin(ph * ratio) / Math.sin(ph);
      }
      const s1 = Math.sin(ph * (1.0 - ratio)) / Math.sin(ph);

      out.v[0] = l_quat.v[0] * s1 + r_quat.v[0] * s2;
      out.v[1] = l_quat.v[1] * s1 + r_quat.v[1] * s2;
      out.v[2] = l_quat.v[2] * s1 + r_quat.v[2] * s2;
      out.v[3] = l_quat.v[3] * s1 + r_quat.v[3] * s2;
    }

    return out;
  }

  static lerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number) {
    const x = l_quat.v[0] * (1 - ratio) + r_quat.v[0] * ratio;
    const y = l_quat.v[1] * (1 - ratio) + r_quat.v[1] * ratio;
    const z = l_quat.v[2] * (1 - ratio) + r_quat.v[2] * ratio;
    const w = l_quat.v[3] * (1 - ratio) + r_quat.v[3] * ratio;
    return new this(x, y, z, w)
  }

  static lerpTo(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number, out: IMutableQuaternion) {
    out.v[0] = l_quat.v[0] * (1 - ratio) + r_quat.v[0] * ratio;
    out.v[1] = l_quat.v[1] * (1 - ratio) + r_quat.v[1] * ratio;
    out.v[2] = l_quat.v[2] * (1 - ratio) + r_quat.v[2] * ratio;
    out.v[3] = l_quat.v[3] * (1 - ratio) + r_quat.v[3] * ratio;
    return out;
  }

  static axisAngle(vec: IVector3, radian: number) {
    const halfAngle = 0.5 * radian;
    const sin = Math.sin(halfAngle);

    const length = vec.length();
    if (length === 0) {
      console.error("0 division occurred!");
    }

    return new this(
      sin * vec.v[0] / length,
      sin * vec.v[1] / length,
      sin * vec.v[2] / length,
      Math.cos(halfAngle)
    );
  }

  static fromMatrix(mat: IMatrix44) {

    const quat = new this(0, 0, 0, 1);
    const tr = mat.m00 + mat.m11 + mat.m22;

    if (tr > 0) {
      const S = 0.5 / Math.sqrt(tr + 1.0);
      quat.v[3] = 0.25 / S;
      quat.v[0] = (mat.m21 - mat.m12) * S;
      quat.v[1] = (mat.m02 - mat.m20) * S;
      quat.v[2] = (mat.m10 - mat.m01) * S;
    } else if ((mat.m00 > mat.m11) && (mat.m00 > mat.m22)) {
      const S = Math.sqrt(1.0 + mat.m00 - mat.m11 - mat.m22) * 2;
      quat.v[3] = (mat.m21 - mat.m12) / S;
      quat.v[0] = 0.25 * S;
      quat.v[1] = (mat.m01 + mat.m10) / S;
      quat.v[2] = (mat.m02 + mat.m20) / S;
    } else if (mat.m11 > mat.m22) {
      const S = Math.sqrt(1.0 + mat.m11 - mat.m00 - mat.m22) * 2;
      quat.v[3] = (mat.m02 - mat.m20) / S;
      quat.v[0] = (mat.m01 + mat.m10) / S;
      quat.v[1] = 0.25 * S;
      quat.v[2] = (mat.m12 + mat.m21) / S;
    } else {
      const S = Math.sqrt(1.0 + mat.m22 - mat.m00 - mat.m11) * 2;
      quat.v[3] = (mat.m10 - mat.m01) / S;
      quat.v[0] = (mat.m02 + mat.m20) / S;
      quat.v[1] = (mat.m12 + mat.m21) / S;
      quat.v[2] = 0.25 * S;
    }

    return quat;
  }

  static fromMatrixTo(mat: IMatrix44, out: IMutableQuaternion) {

    const tr = mat.m00 + mat.m11 + mat.m22;
    if (tr > 0) {
      const S = 0.5 / Math.sqrt(tr + 1.0);
      out.v[3] = 0.25 / S;
      out.v[0] = (mat.m21 - mat.m12) * S;
      out.v[1] = (mat.m02 - mat.m20) * S;
      out.v[2] = (mat.m10 - mat.m01) * S;
    } else if ((mat.m00 > mat.m11) && (mat.m00 > mat.m22)) {
      const S = Math.sqrt(1.0 + mat.m00 - mat.m11 - mat.m22) * 2;
      out.v[3] = (mat.m21 - mat.m12) / S;
      out.v[0] = 0.25 * S;
      out.v[1] = (mat.m01 + mat.m10) / S;
      out.v[2] = (mat.m02 + mat.m20) / S;
    } else if (mat.m11 > mat.m22) {
      const S = Math.sqrt(1.0 + mat.m11 - mat.m00 - mat.m22) * 2;
      out.v[3] = (mat.m02 - mat.m20) / S;
      out.v[0] = (mat.m01 + mat.m10) / S;
      out.v[1] = 0.25 * S;
      out.v[2] = (mat.m12 + mat.m21) / S;
    } else {
      const S = Math.sqrt(1.0 + mat.m22 - mat.m00 - mat.m11) * 2;
      out.v[3] = (mat.m10 - mat.m01) / S;
      out.v[0] = (mat.m02 + mat.m20) / S;
      out.v[1] = (mat.m12 + mat.m21) / S;
      out.v[2] = 0.25 * S;
    }

    return out;
  }

  static lookFromTo(fromDirection: IVector3, toDirection: IVector3) {

    if (fromDirection.isEqual(toDirection)) {
      return new this(0, 0, 0, 1);
    }
    return this.qlerp(this.lookForward(fromDirection), this.lookForward(toDirection), 1);
  }

  static lookForward(forward: IVector3) {
    if (Quaternion.__tmp_upVec == null) {
      Quaternion.__tmp_upVec = new (forward.constructor as any)(0, 1, 0);
    }

    return this.lookForwardAccordingToThisUp(forward, Quaternion.__tmp_upVec);
  }

  static lookForwardAccordingToThisUp(forward: IVector3, up: IVector3) {
    const forwardLength = forward.length();
    if (forwardLength === 0) {
      console.error("0 division occurred!");
    }

    const forwardX = forward.v[0] / forwardLength;
    const forwardY = forward.v[1] / forwardLength;
    const forwardZ = forward.v[2] / forwardLength;

    const upLength = up.length();
    if (upLength === 0) {
      console.error("0 division occurred!");
    }

    const upX = up.v[0] / upLength;
    const upY = up.v[1] / upLength;
    const upZ = up.v[2] / upLength;

    // Vector3.cross(up, forward)
    let rightX = up.v[1] * forward.v[2] - up.v[2] * forward.v[1];
    let rightY = up.v[2] * forward.v[0] - up.v[0] * forward.v[2];
    let rightZ = up.v[0] * forward.v[1] - up.v[1] * forward.v[0];

    const rightLength = Math.hypot(rightX, rightY, rightZ);
    if (rightLength === 0) {
      console.error("0 division occurred!");
    }
    rightX /= rightLength;
    rightY /= rightLength;
    rightZ /= rightLength;

    const m00 = rightX;
    const m01 = rightY;
    const m02 = rightZ;
    const m10 = upX;
    const m11 = upY;
    const m12 = upZ;
    const m20 = forwardX;
    const m21 = forwardY;
    const m22 = forwardZ;

    const num8 = (m00 + m11) + m22;
    if (num8 > 0) {
      const num = Math.sqrt(num8 + 1);
      const num2 = 0.5 / num;
      return new this(
        (m12 - m21) * num2,
        (m20 - m02) * num2,
        (m01 - m10) * num2,
        num * 0.5);
    } else if ((m00 >= m11) && (m00 >= m22)) {
      const num7 = Math.sqrt(((1 + m00) - m11) - m22);
      const num4 = 0.5 / num7;
      return new this(
        0.5 * num7,
        (m01 + m10) * num4,
        (m02 + m20) * num4,
        (m12 - m21) * num4);
    } else if (m11 > m22) {
      const num6 = Math.sqrt(((1 + m11) - m00) - m22);
      const num3 = 0.5 / num6;
      return new this(
        (m10 + m01) * num3,
        0.5 * num6,
        (m21 + m12) * num3,
        (m20 - m02) * num3);
    } else {
      const num5 = Math.sqrt(((1 + m22) - m00) - m11);
      const num2 = 0.5 / num5;
      return new this(
        (m20 + m02) * num2,
        (m21 + m12) * num2,
        0.5 * num5,
        (m01 - m10) * num2);
    }
  }

  static fromPosition(vec: IVector3) {
    return new this(vec.v[0], vec.v[1], vec.v[2], 0);
  }

  static add(l_quat: IQuaternion, r_quat: IQuaternion) {
    const x = l_quat.v[0] + r_quat.v[0];
    const y = l_quat.v[1] + r_quat.v[1];
    const z = l_quat.v[2] + r_quat.v[2];
    const w = l_quat.v[3] + r_quat.v[3];
    return new this(x, y, z, w);
  }

  static addTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion) {
    out.v[0] = l_quat.v[0] + r_quat.v[0];
    out.v[1] = l_quat.v[1] + r_quat.v[1];
    out.v[2] = l_quat.v[2] + r_quat.v[2];
    out.v[3] = l_quat.v[3] + r_quat.v[3];
    return out;
  }

  static subtract(l_quat: IQuaternion, r_quat: IQuaternion) {
    const x = l_quat.v[0] - r_quat.v[0];
    const y = l_quat.v[1] - r_quat.v[1];
    const z = l_quat.v[2] - r_quat.v[2];
    const w = l_quat.v[3] - r_quat.v[3];
    return new this(x, y, z, w);
  }

  static subtractTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion) {
    out.v[0] = l_quat.v[0] - r_quat.v[0];
    out.v[1] = l_quat.v[1] - r_quat.v[1];
    out.v[2] = l_quat.v[2] - r_quat.v[2];
    out.v[3] = l_quat.v[3] - r_quat.v[3];
    return out;
  }

  static multiply(l_quat: IQuaternion, r_quat: IQuaternion) {
    const x = r_quat.v[3] * l_quat.v[0] + r_quat.v[2] * l_quat.v[1] - r_quat.v[1] * l_quat.v[2] + r_quat.v[0] * l_quat.v[3];
    const y = - r_quat.v[2] * l_quat.v[0] + r_quat.v[3] * l_quat.v[1] + r_quat.v[0] * l_quat.v[2] + r_quat.v[1] * l_quat.v[3];
    const z = r_quat.v[1] * l_quat.v[0] - r_quat.v[0] * l_quat.v[1] + r_quat.v[3] * l_quat.v[2] + r_quat.v[2] * l_quat.v[3];
    const w = - r_quat.v[0] * l_quat.v[0] - r_quat.v[1] * l_quat.v[1] - r_quat.v[2] * l_quat.v[2] + r_quat.v[3] * l_quat.v[3];
    return new this(x, y, z, w);
  }

  static multiplyTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion) {
    const x = r_quat.v[3] * l_quat.v[0] + r_quat.v[2] * l_quat.v[1] - r_quat.v[1] * l_quat.v[2] + r_quat.v[0] * l_quat.v[3];
    const y = - r_quat.v[2] * l_quat.v[0] + r_quat.v[3] * l_quat.v[1] + r_quat.v[0] * l_quat.v[2] + r_quat.v[1] * l_quat.v[3];
    const z = r_quat.v[1] * l_quat.v[0] - r_quat.v[0] * l_quat.v[1] + r_quat.v[3] * l_quat.v[2] + r_quat.v[2] * l_quat.v[3];
    const w = - r_quat.v[0] * l_quat.v[0] - r_quat.v[1] * l_quat.v[1] - r_quat.v[2] * l_quat.v[2] + r_quat.v[3] * l_quat.v[3];
    return out.setComponents(x, y, z, w);
  }

  static multiplyNumber(quat: IQuaternion, value: number) {
    const x = quat.v[0] * value;
    const y = quat.v[1] * value;
    const z = quat.v[2] * value;
    const w = quat.v[3] * value;
    return new this(x, y, z, w);
  }

  static multiplyNumberTo(quat: IQuaternion, value: number, out: IMutableQuaternion) {
    out.v[0] = quat.v[0] * value;
    out.v[1] = quat.v[1] * value;
    out.v[2] = quat.v[2] * value;
    out.v[3] = quat.v[3] * value;
    return out;
  }

  static divideNumber(quat: IQuaternion, value: number) {
    if (value === 0) {
      console.error("0 division occurred!");
    }
    const x = quat.v[0] / value;
    const y = quat.v[1] / value;
    const z = quat.v[2] / value;
    const w = quat.v[3] / value;
    return new this(x, y, z, w);
  }

  static divideNumberTo(quat: IQuaternion, value: number, out: IMutableQuaternion) {
    if (value === 0) {
      console.error("0 division occurred!");
    }
    out.v[0] = quat.v[0] / value;
    out.v[1] = quat.v[1] / value;
    out.v[2] = quat.v[2] / value;
    out.v[3] = quat.v[3] / value;
    return out;
  }

  toString() {
    return '(' + this.v[0] + ', ' + this.v[1] + ', ' + this.v[2] + ', ' + this.v[3] + ')';
  }

  toStringApproximately() {
    return MathUtil.nearZeroToZero(this.v[0]) + ' ' + MathUtil.nearZeroToZero(this.v[1]) +
      ' ' + MathUtil.nearZeroToZero(this.v[2]) + ' ' + MathUtil.nearZeroToZero(this.v[3]) + '\n';
  }

  flattenAsArray() {
    return [this.v[0], this.v[1], this.v[2], this.v[3]];
  }

  isDummy() {
    if (this.v.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  isEqual(quat: IQuaternion, delta: number = Number.EPSILON) {
    if (
      Math.abs(quat.v[0] - this.v[0]) < delta &&
      Math.abs(quat.v[1] - this.v[1]) < delta &&
      Math.abs(quat.v[2] - this.v[2]) < delta &&
      Math.abs(quat.v[3] - this.v[3]) < delta
    ) {
      return true;
    } else {
      return false;
    }
  }

  isStrictEqual(quat: IQuaternion): boolean {
    if (
      this.v[0] === quat.v[0] &&
      this.v[1] === quat.v[1] &&
      this.v[2] === quat.v[2] &&
      this.v[3] === quat.v[3]
    ) {
      return true;
    } else {
      return false;
    }
  }

  at(i: number) {
    return this.v[i];
  }

  length() {
    return Math.hypot(this.v[0], this.v[1], this.v[2], this.v[3]);
  }

  lengthSquared(): number {
    return this.v[0] ** 2 + this.v[1] ** 2 + this.v[2] ** 2 + this.v[3] ** 2;
  }

  /**
   * dot product
   */
  dot(quat: IQuaternion) {
    return this.v[0] * quat.v[0] + this.v[1] * quat.v[1] + this.v[2] * quat.v[2] + this.v[3] * quat.v[3];
  }

  toEulerAnglesTo(out: IMutableVector3) {
    // this is from https://en.v[3]ikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles#Source_Code_2
    const sinr_cosp = 2.0 * (this.v[3] * this.v[0] + this.v[1] * this.v[2]);
    const cosr_cosp = 1.0 - 2.0 * (this.v[0] * this.v[0] + this.v[1] * this.v[1]);
    out.v[0] = Math.atan2(sinr_cosp, cosr_cosp);

    const sinp = 2.0 * (this.v[3] * this.v[1] - this.v[2] * this.v[0]);
    if (Math.abs(sinp) >= 1) {
      out.v[1] = Math.PI / 2 * Math.sign(sinp); // use 90 degrees if out of range
    } else {
      out.v[1] = Math.asin(sinp);
    }

    const siny_cosp = 2.0 * (this.v[3] * this.v[2] + this.v[0] * this.v[1]);
    const cosy_cosp = 1.0 - 2.0 * (this.v[1] * this.v[1] + this.v[2] * this.v[2]);
    out.v[2] = Math.atan2(siny_cosp, cosy_cosp);

    return out;
  }

  clone() {
    return new (this.constructor as any)(this.v[0], this.v[1], this.v[2], this.v[3]) as Quaternion;
  }
}

