import Vector3 from './Vector3';
import Matrix44 from './Matrix44';
import Quaternion from './Quaternion';
import {IMatrix, IMatrix33} from './IMatrix';
import MutableMatrix33 from './MutableMatrix33';
import {CompositionType} from '../definitions/CompositionType';
import {TypedArray} from '../../types/CommonTypes';
import {MathUtil} from './MathUtil';
import MutableVector3 from './MutableVector3';
import IdentityMatrix33 from './IdentityMatrix33';
/* eslint-disable prettier/prettier */

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
    isColumnMajor = false, notCopyFloatArray = false) {

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
        const m = arguments;
        this.v[0] = m[0]; this.v[3] = m[3]; this.v[6] = m[6];
        this.v[1] = m[1]; this.v[4] = m[4]; this.v[7] = m[7];
        this.v[2] = m[2]; this.v[5] = m[5]; this.v[8] = m[8];
      } else {
        const m = arguments;
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
      const sx = q.v[0] * q.v[0];
      const sy = q.v[1] * q.v[1];
      const sz = q.v[2] * q.v[2];
      const cx = q.v[1] * q.v[2];
      const cy = q.v[0] * q.v[2];
      const cz = q.v[0] * q.v[1];
      const wx = q.v[3] * q.v[0];
      const wy = q.v[3] * q.v[1];
      const wz = q.v[3] * q.v[2];

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
    return new this(0, 0, 0, 0, 0, 0, 0, 0, 0);
  }

  /**
   * Create identity matrix
   */
  static identity(): IMatrix33 {
    // return new this(
    //   1, 0, 0,
    //   0, 1, 0,
    //   0, 0, 1
    // );

    return new IdentityMatrix33();
  }

  static dummy() {
    return new this(null);
  }

  /**
   * Create transpose matrix
   */
  static transpose(mat: Matrix33) {
    return new this(
      mat.v[0], mat.v[1], mat.v[2],
      mat.v[3], mat.v[4], mat.v[5],
      mat.v[6], mat.v[7], mat.v[8]
    );
  }

  /**
   * Create invert matrix
   */
  static invert(mat: Matrix33) {
    const det = mat.determinant();
    if (det === 0) {
      console.error('the determinant is 0!');
    }

    const m00 = (mat.v[4] * mat.v[8] - mat.v[7] * mat.v[5]) / det;
    const m01 = (mat.v[6] * mat.v[5] - mat.v[3] * mat.v[8]) / det;
    const m02 = (mat.v[3] * mat.v[7] - mat.v[6] * mat.v[4]) / det;
    const m10 = (mat.v[7] * mat.v[2] - mat.v[1] * mat.v[8]) / det;
    const m11 = (mat.v[0] * mat.v[8] - mat.v[6] * mat.v[2]) / det;
    const m12 = (mat.v[6] * mat.v[1] - mat.v[0] * mat.v[7]) / det;
    const m20 = (mat.v[1] * mat.v[5] - mat.v[4] * mat.v[2]) / det;
    const m21 = (mat.v[3] * mat.v[2] - mat.v[0] * mat.v[5]) / det;
    const m22 = (mat.v[0] * mat.v[4] - mat.v[3] * mat.v[1]) / det;

    return new this(
      m00, m01, m02,
      m10, m11, m12,
      m20, m21, m22
    );
  }

  static invertTo(mat: Matrix33, outMat: MutableMatrix33) {
    const det = mat.determinant();
    if (det === 0) {
      console.error('the determinant is 0!');
    }

    const m00 = (mat.v[4] * mat.v[8] - mat.v[7] * mat.v[5]) / det;
    const m01 = (mat.v[6] * mat.v[5] - mat.v[3] * mat.v[8]) / det;
    const m02 = (mat.v[3] * mat.v[7] - mat.v[6] * mat.v[4]) / det;
    const m10 = (mat.v[7] * mat.v[2] - mat.v[1] * mat.v[8]) / det;
    const m11 = (mat.v[0] * mat.v[8] - mat.v[6] * mat.v[2]) / det;
    const m12 = (mat.v[6] * mat.v[1] - mat.v[0] * mat.v[7]) / det;
    const m20 = (mat.v[1] * mat.v[5] - mat.v[4] * mat.v[2]) / det;
    const m21 = (mat.v[3] * mat.v[2] - mat.v[0] * mat.v[5]) / det;
    const m22 = (mat.v[0] * mat.v[4] - mat.v[3] * mat.v[1]) / det;

    return outMat.setComponents(
      m00, m01, m02,
      m10, m11, m12,
      m20, m21, m22
    );
  }

  /**
 * Create X oriented Rotation Matrix
 */
  static rotateX(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return new this(
      1, 0, 0,
      0, cos, -sin,
      0, sin, cos
    );
  }

  /**
   * Create Y oriented Rotation Matrix
   */
  static rotateY(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return new this(
      cos, 0, sin,
      0, 1, 0,
      -sin, 0, cos
    );
  }

  /**
   * Create Z oriented Rotation Matrix
   */
  static rotateZ(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return new this(
      cos, -sin, 0,
      sin, cos, 0,
      0, 0, 1
    );
  }

  static rotateXYZ(x: number, y: number, z: number) {
    const cosX = Math.cos(x);
    const sinX = Math.sin(x);
    const cosY = Math.cos(y);
    const sinY = Math.sin(y);
    const cosZ = Math.cos(z);
    const sinZ = Math.sin(z);

    // const x00 = 1;
    // const x01 = 0;
    // const x02 = 0;
    // const x10 = 0;
    const x11 = cosX;
    const x12 = -sinX;
    // const x20 = 0;
    const x21 = sinX;
    const x22 = cosX;

    const y00 = cosY;
    // const y01 = 0;
    const y02 = sinY;
    // const y10 = 0;
    // const y11 = 1;
    // const y12 = 0;
    const y20 = -sinY;
    // const y21 = 0;
    const y22 = cosY;

    const z00 = cosZ;
    const z01 = -sinZ;
    // const z02 = 0;
    const z10 = sinZ;
    const z11 = cosZ;
    // const z12 = 0;
    // const z20 = 0;
    // const z21 = 0;
    // const z22 = 1;

    // calculate this.multiply(this.rotateY(y), this.rotateX(x))
    const yx00 = y00;
    const yx01 = y02 * x21;
    const yx02 = y02 * x22;
    //const yx10 = 0;
    const yx11 = x11;
    const yx12 = x12;
    const yx20 = y20;
    const yx21 = y22 * x21;
    const yx22 = y22 * x22;

    // calculate this.multiply(this.rotateZ(z), this.multiply(this.rotateY(y), this.rotateX(x)))
    const m00 = z00 * yx00;
    const m01 = z00 * yx01 + z01 * yx11;
    const m02 = z00 * yx02 + z01 * yx12;
    const m10 = z10 * yx00;
    const m11 = z10 * yx01 + z11 * yx11;
    const m12 = z10 * yx02 + z11 * yx12;
    const m20 = yx20;
    const m21 = yx21;
    const m22 = yx22;

    return new this(
      m00, m01, m02,
      m10, m11, m12,
      m20, m21, m22
    );
  }

  static rotate(vec: Vector3) {
    return this.rotateXYZ(vec.v[0], vec.v[1], vec.v[2]);
  }

  /**
   * Create Scale Matrix
   */
  static scale(vec: Vector3) {
    return new this(
      vec.v[0], 0, 0,
      0, vec.v[1], 0,
      0, 0, vec.v[2]
    );
  }

  /**
   * multiply matrixes
   */
  static multiply(l_mat: Matrix33, r_mat: Matrix33) {
    const m00 = l_mat.v[0] * r_mat.v[0] + l_mat.v[3] * r_mat.v[1] + l_mat.v[6] * r_mat.v[2];
    const m10 = l_mat.v[1] * r_mat.v[0] + l_mat.v[4] * r_mat.v[1] + l_mat.v[7] * r_mat.v[2];
    const m20 = l_mat.v[2] * r_mat.v[0] + l_mat.v[5] * r_mat.v[1] + l_mat.v[8] * r_mat.v[2];

    const m01 = l_mat.v[0] * r_mat.v[3] + l_mat.v[3] * r_mat.v[4] + l_mat.v[6] * r_mat.v[5];
    const m11 = l_mat.v[1] * r_mat.v[3] + l_mat.v[4] * r_mat.v[4] + l_mat.v[7] * r_mat.v[5];
    const m21 = l_mat.v[2] * r_mat.v[3] + l_mat.v[5] * r_mat.v[4] + l_mat.v[8] * r_mat.v[5];

    const m02 = l_mat.v[0] * r_mat.v[6] + l_mat.v[3] * r_mat.v[7] + l_mat.v[6] * r_mat.v[8];
    const m12 = l_mat.v[1] * r_mat.v[6] + l_mat.v[4] * r_mat.v[7] + l_mat.v[7] * r_mat.v[8];
    const m22 = l_mat.v[2] * r_mat.v[6] + l_mat.v[5] * r_mat.v[7] + l_mat.v[8] * r_mat.v[8];

    return new this(
      m00, m01, m02,
      m10, m11, m12,
      m20, m21, m22
    );
  }

  /**
   * multiply matrixes
   */
  static multiplyTo(l_mat: Matrix33, r_mat: Matrix33, outMat: MutableMatrix33) {
    const m00 = l_mat.v[0] * r_mat.v[0] + l_mat.v[3] * r_mat.v[1] + l_mat.v[6] * r_mat.v[2];
    const m10 = l_mat.v[1] * r_mat.v[0] + l_mat.v[4] * r_mat.v[1] + l_mat.v[7] * r_mat.v[2];
    const m20 = l_mat.v[2] * r_mat.v[0] + l_mat.v[5] * r_mat.v[1] + l_mat.v[8] * r_mat.v[2];

    const m01 = l_mat.v[0] * r_mat.v[3] + l_mat.v[3] * r_mat.v[4] + l_mat.v[6] * r_mat.v[5];
    const m11 = l_mat.v[1] * r_mat.v[3] + l_mat.v[4] * r_mat.v[4] + l_mat.v[7] * r_mat.v[5];
    const m21 = l_mat.v[2] * r_mat.v[3] + l_mat.v[5] * r_mat.v[4] + l_mat.v[8] * r_mat.v[5];

    const m02 = l_mat.v[0] * r_mat.v[6] + l_mat.v[3] * r_mat.v[7] + l_mat.v[6] * r_mat.v[8];
    const m12 = l_mat.v[1] * r_mat.v[6] + l_mat.v[4] * r_mat.v[7] + l_mat.v[7] * r_mat.v[8];
    const m22 = l_mat.v[2] * r_mat.v[6] + l_mat.v[5] * r_mat.v[7] + l_mat.v[8] * r_mat.v[8];

    return outMat.setComponents(
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
    if (
      mat.v[0] === this.v[0] && mat.v[1] === this.v[1] && mat.v[2] === this.v[2] &&
      mat.v[3] === this.v[3] && mat.v[4] === this.v[4] && mat.v[5] === this.v[5] &&
      mat.v[6] === this.v[6] && mat.v[7] === this.v[7] && mat.v[8] === this.v[8]
    ) {
      return true;
    } else {
      return false;
    }
  }

  at(row_i: number, column_i: number) {
    return this.v[row_i + column_i * 3];
  }

  determinant() {
    return this.v[0] * this.v[4] * this.v[8] + this.v[1] * this.v[5] * this.v[6] + this.v[2] * this.v[3] * this.v[7]
      - this.v[0] * this.v[5] * this.v[7] - this.v[2] * this.v[4] * this.v[6] - this.v[1] * this.v[3] * this.v[8];
  }

  multiplyVector(vec: Vector3) {
    const x = this.v[0] * vec.v[0] + this.v[3] * vec.v[1] + this.v[6] * vec.v[2];
    const y = this.v[1] * vec.v[0] + this.v[4] * vec.v[1] + this.v[7] * vec.v[2];
    const z = this.v[2] * vec.v[0] + this.v[5] * vec.v[1] + this.v[8] * vec.v[2];
    return new (vec.constructor as any)(x, y, z);
  }

  multiplyVectorTo(vec: Vector3, outVec: MutableVector3) {
    const x = this.v[0] * vec.v[0] + this.v[3] * vec.v[1] + this.v[6] * vec.v[2];
    const y = this.v[1] * vec.v[0] + this.v[4] * vec.v[1] + this.v[7] * vec.v[2];
    const z = this.v[2] * vec.v[0] + this.v[5] * vec.v[1] + this.v[8] * vec.v[2];
    outVec.v[0] = x;
    outVec.v[1] = y;
    outVec.v[2] = z;
    return outVec;
  }

  getScale() {
    return new Vector3(
      Math.hypot(this.v[0], this.v[3], this.v[6]),
      Math.hypot(this.v[1], this.v[4], this.v[7]),
      Math.hypot(this.v[2], this.v[5], this.v[8])
    );
  }

  getScaleTo(outVec: MutableVector3) {
    outVec.v[0] = Math.hypot(this.v[0], this.v[3], this.v[6]);
    outVec.v[1] = Math.hypot(this.v[1], this.v[4], this.v[7]);
    outVec.v[2] = Math.hypot(this.v[2], this.v[5], this.v[8]);
    return outVec;
  }

  clone() {
    return new (this.constructor as any)(
      this.v[0], this.v[3], this.v[6],
      this.v[1], this.v[4], this.v[7],
      this.v[2], this.v[5], this.v[8]
    ) as Matrix33;
  }
}
