import Vector3 from './Vector3';
import Matrix44 from './Matrix44';
import Quaternion from './Quaternion';
import { IMatrix, IMatrix33 } from './IMatrix';
import MutableMatrix33 from './MutableMatrix33';
import { CompositionType } from '../definitions/CompositionType';
import { TypedArray } from '../../commontypes/CommonTypes';
import { MathUtil } from './MathUtil';
import MutableVector3 from './MutableVector3';

export default class Matrix33 implements IMatrix, IMatrix33 {
  v: TypedArray;

  constructor(m: null);
  constructor(m: Float32Array, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
  constructor(m: Array<number>, isColumnMajor?: boolean);
  constructor(m: Matrix33, isColumnMajor?: boolean);
  constructor(m: Matrix44, isColumnMajor?: boolean);
  constructor(m: Quaternion, isColumnMajor?: boolean);
  constructor(
    m0: number, m1: number, m2: number,
    m3: number, m4: number, m5: number,
    m6: number, m7: number, m8: number,
    isColumnMajor?: boolean, );
  constructor(
    m0: any, m1?: any, m2?: any,
    m3?: number, m4?: number, m5?: number,
    m6?: number, m7?: number, m8?: number,
    isColumnMajor: boolean = false, notCopyFloatArray: boolean = false) {

    const _isColumnMajor = (arguments.length === 10) ? isColumnMajor : m1;
    const _notCopyFloatArray = (arguments.length === 3) ? notCopyFloatArray : m2;
    const m = m0;

    if (m == null) {
      this.v = new Float32Array(0);
      return;
    }

    if (9 <= arguments.length && arguments.length <= 10 && m8 != null) {
      this.v = new Float32Array(9);
      if (_isColumnMajor === true) {
        let m = arguments;
        this.v[0] = m[0]; this.v[3] = m[3]; this.v[6] = m[6];
        this.v[1] = m[1]; this.v[4] = m[4]; this.v[7] = m[7];
        this.v[2] = m[2]; this.v[5] = m[5]; this.v[8] = m[8];
      } else {
        let m = arguments;
        // arguments[0-8] must be row major values if isColumnMajor is false
        this.v[0] = m[0]; this.v[3] = m[1]; this.v[6] = m[2];
        this.v[1] = m[3]; this.v[4] = m[4]; this.v[7] = m[5];
        this.v[2] = m[6]; this.v[5] = m[7]; this.v[8] = m[8];
      }
    } else if (Array.isArray(m as Array<Number>)) {
      this.v = new Float32Array(9);
      if (_isColumnMajor === true) {
        this.v[0] = m[0]; this.v[3] = m[3]; this.v[6] = m[6];
        this.v[1] = m[1]; this.v[4] = m[4]; this.v[7] = m[7];
        this.v[2] = m[2]; this.v[5] = m[5]; this.v[8] = m[8];
      } else {
        // 'm' must be row major array if isColumnMajor is false
        this.v[0] = m[0]; this.v[3] = m[1]; this.v[6] = m[2];
        this.v[1] = m[3]; this.v[4] = m[4]; this.v[7] = m[5];
        this.v[2] = m[6]; this.v[5] = m[7]; this.v[8] = m[8];
      }
    } else if (m instanceof Float32Array) {
      if (_notCopyFloatArray) {
        this.v = m;
      } else {
        this.v = new Float32Array(9);
        if (_isColumnMajor === true) {
          this.v[0] = m[0]; this.v[3] = m[3]; this.v[6] = m[6];
          this.v[1] = m[1]; this.v[4] = m[4]; this.v[7] = m[7];
          this.v[2] = m[2]; this.v[5] = m[5]; this.v[8] = m[8];
        } else {
          // 'm' must be row major array if isColumnMajor is false
          this.v[0] = m[0]; this.v[3] = m[1]; this.v[6] = m[2];
          this.v[1] = m[3]; this.v[4] = m[4]; this.v[7] = m[5];
          this.v[2] = m[6]; this.v[5] = m[7]; this.v[8] = m[8];
        }
      }
    } else if (!!m && m.v != null && m.v[8] !== null) {
      if (_notCopyFloatArray) {
        this.v = m.v;
      } else {
        this.v = new Float32Array(9);
        const v = (m as Matrix33 | Matrix44).v;
        this.v[0] = v[0]; this.v[3] = v[3]; this.v[6] = v[6];
        this.v[1] = v[1]; this.v[4] = v[4]; this.v[7] = v[7];
        this.v[2] = v[2]; this.v[5] = v[5]; this.v[8] = v[8];
      }
    } else if (!!m && typeof (m as Quaternion).className !== 'undefined' && (m as Quaternion).className === 'Quaternion') {
      this.v = new Float32Array(9);
      const q = m as Quaternion;
      const sx = q.x * q.x;
      const sy = q.y * q.y;
      const sz = q.z * q.z;
      const cx = q.y * q.z;
      const cy = q.x * q.z;
      const cz = q.x * q.y;
      const wx = q.w * q.x;
      const wy = q.w * q.y;
      const wz = q.w * q.z;

      this.v[0] = 1.0 - 2.0 * (sy + sz); this.v[3] = 2.0 * (cz - wz); this.v[6] = 2.0 * (cy + wy);
      this.v[1] = 2.0 * (cz + wz); this.v[4] = 1.0 - 2.0 * (sx + sz); this.v[7] = 2.0 * (cx - wx);
      this.v[2] = 2.0 * (cy - wy); this.v[5] = 2.0 * (cx + wx); this.v[8] = 1.0 - 2.0 * (sx + sy);

    } else {
      this.v = new Float32Array(9);
      this.v[0] = 1; this.v[3] = 0; this.v[6] = 0;
      this.v[1] = 0; this.v[4] = 1; this.v[7] = 0;
      this.v[2] = 0; this.v[5] = 0; this.v[8] = 1;

    }
  }

  public get m00() {
    return this.v[0];
  }

  public get m10() {
    return this.v[1];
  }

  public get m20() {
    return this.v[2];
  }

  public get m01() {
    return this.v[3];
  }

  public get m11() {
    return this.v[4];
  }

  public get m21() {
    return this.v[5];
  }

  public get m02() {
    return this.v[6];
  }

  public get m12() {
    return this.v[7];
  }

  public get m22() {
    return this.v[8];
  }

  get className() {
    return this.constructor.name;
  }

  static get compositionType() {
    return CompositionType.Mat3;
  }

  /**
   * zero matrix(static version)
   */
  static zero() {
    return new Matrix33(0, 0, 0, 0, 0, 0, 0, 0, 0);
  }

  /**
   * Create identity matrix
   */
  static identity() {
    return new Matrix33(
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    );
  }

  static dummy() {
    return new Matrix33(null);
  }

  /**
   * Create transpose matrix
   */
  static transpose(mat: Matrix33) {
    return new Matrix33(
      mat.m00, mat.m10, mat.m20,
      mat.m01, mat.m11, mat.m21,
      mat.m02, mat.m12, mat.m22
    );
  }

  /**
   * Create invert matrix
   */
  static invert(mat: Matrix33) {
    var det = mat.determinant();
    var m00 = (mat.m11 * mat.m22 - mat.m12 * mat.m21) / det;
    var m01 = (mat.m02 * mat.m21 - mat.m01 * mat.m22) / det;
    var m02 = (mat.m01 * mat.m12 - mat.m02 * mat.m11) / det;
    var m10 = (mat.m12 * mat.m20 - mat.m10 * mat.m22) / det;
    var m11 = (mat.m00 * mat.m22 - mat.m02 * mat.m20) / det;
    var m12 = (mat.m02 * mat.m10 - mat.m00 * mat.m12) / det;
    var m20 = (mat.m10 * mat.m21 - mat.m11 * mat.m20) / det;
    var m21 = (mat.m01 * mat.m20 - mat.m00 * mat.m21) / det;
    var m22 = (mat.m00 * mat.m11 - mat.m01 * mat.m10) / det;

    return new Matrix33(
      m00, m01, m02,
      m10, m11, m12,
      m20, m21, m22
    );
  }

  static invertTo(mat: Matrix33, out: MutableMatrix33) {
    const det = mat.determinant();
    const m00 = (mat.m11 * mat.m22 - mat.m12 * mat.m21) / det;
    const m01 = (mat.m02 * mat.m21 - mat.m01 * mat.m22) / det;
    const m02 = (mat.m01 * mat.m12 - mat.m02 * mat.m11) / det;
    const m10 = (mat.m12 * mat.m20 - mat.m10 * mat.m22) / det;
    const m11 = (mat.m00 * mat.m22 - mat.m02 * mat.m20) / det;
    const m12 = (mat.m02 * mat.m10 - mat.m00 * mat.m12) / det;
    const m20 = (mat.m10 * mat.m21 - mat.m11 * mat.m20) / det;
    const m21 = (mat.m01 * mat.m20 - mat.m00 * mat.m21) / det;
    const m22 = (mat.m00 * mat.m11 - mat.m01 * mat.m10) / det;

    return out.setComponents(
      m00, m01, m02,
      m10, m11, m12,
      m20, m21, m22
    );
  }

  /**
 * Create X oriented Rotation Matrix
 */
  static rotateX(radian: number) {
    var cos = Math.cos(radian);
    var sin = Math.sin(radian);
    return new Matrix33(
      1, 0, 0,
      0, cos, -sin,
      0, sin, cos
    );
  }

  /**
   * Create Y oriented Rotation Matrix
   */
  static rotateY(radian: number) {
    var cos = Math.cos(radian);
    var sin = Math.sin(radian);
    return new Matrix33(
      cos, 0, sin,
      0, 1, 0,
      -sin, 0, cos
    );
  }

  /**
   * Create Z oriented Rotation Matrix
   */
  static rotateZ(radian: number) {
    var cos = Math.cos(radian);
    var sin = Math.sin(radian);
    return new Matrix33(
      cos, -sin, 0,
      sin, cos, 0,
      0, 0, 1
    );
  }

  static rotateXYZ(x: number, y: number, z: number) {
    return Matrix33.multiply(Matrix33.multiply(Matrix33.rotateZ(z), Matrix33.rotateY(y)), Matrix33.rotateX(x));
  }

  static rotate(vec3: Vector3) {
    return Matrix33.multiply(Matrix33.multiply(Matrix33.rotateZ(vec3.z), Matrix33.rotateY(vec3.y)), Matrix33.rotateX(vec3.x));
  }

  /**
   * Create Scale Matrix
   */
  static scale(vec: Vector3) {
    return new Matrix33(
      vec.x, 0, 0,
      0, vec.y, 0,
      0, 0, vec.z
    );
  }

  /**
   * multiply matrixes
   */
  static multiply(l_m: Matrix33, r_m: Matrix33) {
    var m00 = l_m.v[0] * r_m.v[0] + l_m.v[3] * r_m.v[1] + l_m.v[6] * r_m.v[2];
    var m10 = l_m.v[1] * r_m.v[0] + l_m.v[4] * r_m.v[1] + l_m.v[7] * r_m.v[2];
    var m20 = l_m.v[2] * r_m.v[0] + l_m.v[5] * r_m.v[1] + l_m.v[8] * r_m.v[2];

    var m01 = l_m.v[0] * r_m.v[3] + l_m.v[3] * r_m.v[4] + l_m.v[6] * r_m.v[5];
    var m11 = l_m.v[1] * r_m.v[3] + l_m.v[4] * r_m.v[4] + l_m.v[7] * r_m.v[5];
    var m21 = l_m.v[2] * r_m.v[3] + l_m.v[5] * r_m.v[4] + l_m.v[8] * r_m.v[5];

    var m02 = l_m.v[0] * r_m.v[6] + l_m.v[3] * r_m.v[7] + l_m.v[6] * r_m.v[8];
    var m12 = l_m.v[1] * r_m.v[6] + l_m.v[4] * r_m.v[7] + l_m.v[7] * r_m.v[8];
    var m22 = l_m.v[2] * r_m.v[6] + l_m.v[5] * r_m.v[7] + l_m.v[8] * r_m.v[8];

    return new Matrix33(
      m00, m01, m02,
      m10, m11, m12,
      m20, m21, m22
    );
  }

  /**
   * multiply matrixes
   */
  static multiplyTo(l_m: Matrix33, r_m: Matrix33, out: MutableMatrix33) {
    const m00 = l_m.v[0] * r_m.v[0] + l_m.v[3] * r_m.v[1] + l_m.v[6] * r_m.v[2];
    const m10 = l_m.v[1] * r_m.v[0] + l_m.v[4] * r_m.v[1] + l_m.v[7] * r_m.v[2];
    const m20 = l_m.v[2] * r_m.v[0] + l_m.v[5] * r_m.v[1] + l_m.v[8] * r_m.v[2];

    const m01 = l_m.v[0] * r_m.v[3] + l_m.v[3] * r_m.v[4] + l_m.v[6] * r_m.v[5];
    const m11 = l_m.v[1] * r_m.v[3] + l_m.v[4] * r_m.v[4] + l_m.v[7] * r_m.v[5];
    const m21 = l_m.v[2] * r_m.v[3] + l_m.v[5] * r_m.v[4] + l_m.v[8] * r_m.v[5];

    const m02 = l_m.v[0] * r_m.v[6] + l_m.v[3] * r_m.v[7] + l_m.v[6] * r_m.v[8];
    const m12 = l_m.v[1] * r_m.v[6] + l_m.v[4] * r_m.v[7] + l_m.v[7] * r_m.v[8];
    const m22 = l_m.v[2] * r_m.v[6] + l_m.v[5] * r_m.v[7] + l_m.v[8] * r_m.v[8];

    return out.setComponents(
      m00, m01, m02,
      m10, m11, m12,
      m20, m21, m22
    );
  }

  toString() {
    return this.v[0] + ' ' + this.v[3] + ' ' + this.v[6] + '\n' +
      this.v[1] + ' ' + this.v[4] + ' ' + this.v[7] + '\n' +
      this.v[2] + ' ' + this.v[5] + ' ' + this.v[8] + '\n';
  }

  toStringApproximately() {
    return MathUtil.nearZeroToZero(this.v[0]) + ' ' + MathUtil.nearZeroToZero(this.v[3]) + ' ' + MathUtil.nearZeroToZero(this.v[6]) + '\n' +
      MathUtil.nearZeroToZero(this.v[1]) + ' ' + MathUtil.nearZeroToZero(this.v[4]) + ' ' + MathUtil.nearZeroToZero(this.v[7]) + ' \n' +
      MathUtil.nearZeroToZero(this.v[2]) + ' ' + MathUtil.nearZeroToZero(this.v[5]) + ' ' + MathUtil.nearZeroToZero(this.v[8]) + '\n';
  }

  flattenAsArray() {
    return [this.v[0], this.v[1], this.v[2],
    this.v[3], this.v[4], this.v[5],
    this.v[6], this.v[7], this.v[8]];
  }

  isDummy() {
    if (this.v.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  isEqual(mat: Matrix33, delta: number = Number.EPSILON) {
    if (Math.abs(mat.v[0] - this.v[0]) < delta &&
      Math.abs(mat.v[1] - this.v[1]) < delta &&
      Math.abs(mat.v[2] - this.v[2]) < delta &&
      Math.abs(mat.v[3] - this.v[3]) < delta &&
      Math.abs(mat.v[4] - this.v[4]) < delta &&
      Math.abs(mat.v[5] - this.v[5]) < delta &&
      Math.abs(mat.v[6] - this.v[6]) < delta &&
      Math.abs(mat.v[7] - this.v[7]) < delta &&
      Math.abs(mat.v[8] - this.v[8]) < delta) {
      return true;
    } else {
      return false;
    }
  }

  isStrictEqual(mat: Matrix33) {
    if (this.v.length !== mat.v.length) {
      false;
    }

    for (let i = 0; i < this.v.length; i++) {
      if (mat.v[i] !== this.v[i]) {
        return false;
      }
    }
    return true;
  }

  at(row_i: number, column_i: number) {
    return this.v[row_i + column_i * 3];
  }

  clone() {
    return new Matrix33(
      this.v[0], this.v[3], this.v[6],
      this.v[1], this.v[4], this.v[7],
      this.v[2], this.v[5], this.v[8]
    );
  }

  determinant() {
    return this.v[0] * this.v[4] * this.v[8] + this.v[1] * this.v[5] * this.v[6] + this.v[2] * this.v[3] * this.v[7]
      - this.v[0] * this.v[5] * this.v[7] - this.v[2] * this.v[4] * this.v[6] - this.v[1] * this.v[3] * this.v[8];
  }

  multiplyVector(vec: Vector3) {
    var x = this.v[0] * vec.x + this.v[3] * vec.y + this.v[6] * vec.z;
    var y = this.v[1] * vec.x + this.v[4] * vec.y + this.v[7] * vec.z;
    var z = this.v[2] * vec.x + this.v[5] * vec.y + this.v[8] * vec.z;

    return new (vec.constructor as any)(x, y, z);
  }

  multiplyVectorTo(vec: Vector3, outVec: MutableVector3) {
    const x = this.v[0] * vec.x + this.v[3] * vec.y + this.v[6] * vec.z;
    const y = this.v[1] * vec.x + this.v[4] * vec.y + this.v[7] * vec.z;
    const z = this.v[2] * vec.x + this.v[5] * vec.y + this.v[8] * vec.z;
    outVec.x = x;
    outVec.y = y;
    outVec.z = z;
    return outVec;
  }

  getScale() {
    return new Vector3(
      Math.hypot(this.m00, this.m01, this.m02),
      Math.hypot(this.m10, this.m11, this.m12),
      Math.hypot(this.m20, this.m21, this.m22)
    );
  }

  getScaleTo(outVec: MutableVector3) {
    const x = Math.hypot(this.m00, this.m01, this.m02);
    const y = Math.hypot(this.m10, this.m11, this.m12);
    const z = Math.hypot(this.m20, this.m21, this.m22);
    outVec.x = x;
    outVec.y = y;
    outVec.z = z;
    return outVec;
  }
}
