import Vector3 from './Vector3';
import Matrix44 from './Matrix44';
import Quaternion from './Quaternion';
import {IMatrix, IMatrix33} from './IMatrix';
import MutableMatrix33 from './MutableMatrix33';
import {CompositionType} from '../definitions/CompositionType';
import {MathUtil} from './MathUtil';
import MutableVector3 from './MutableVector3';
import AbstractMatrix from './AbstractMatrix';
import IdentityMatrix33 from './IdentityMatrix33';
import { IMutableVector3, IVector3 } from './IVector';
/* eslint-disable prettier/prettier */

export default class Matrix33 extends AbstractMatrix implements IMatrix, IMatrix33 {
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
    isColumnMajor?: boolean,);
  constructor(
    m0: any, m1?: any, m2?: any,
    m3?: number, m4?: number, m5?: number,
    m6?: number, m7?: number, m8?: number,
    isColumnMajor = false, notCopyFloatArray = false) {

    super();
    const _isColumnMajor = (arguments.length === 10) ? isColumnMajor : m1;
    const _notCopyFloatArray = (arguments.length === 3) ? notCopyFloatArray : m2;
    const m = m0;

    if (m == null) {
      this._v = new Float32Array(0);
      return;
    }

    if (9 <= arguments.length && arguments.length <= 10 && m8 != null) {
      this._v = new Float32Array(9);
      if (_isColumnMajor === true) {
        const m = arguments;
        this._v[0] = m[0]; this._v[3] = m[3]; this._v[6] = m[6];
        this._v[1] = m[1]; this._v[4] = m[4]; this._v[7] = m[7];
        this._v[2] = m[2]; this._v[5] = m[5]; this._v[8] = m[8];
      } else {
        const m = arguments;
        // arguments[0-8] must be row major values if isColumnMajor is false
        this._v[0] = m[0]; this._v[3] = m[1]; this._v[6] = m[2];
        this._v[1] = m[3]; this._v[4] = m[4]; this._v[7] = m[5];
        this._v[2] = m[6]; this._v[5] = m[7]; this._v[8] = m[8];
      }
    } else if (Array.isArray(m as Array<Number>)) {
      this._v = new Float32Array(9);
      if (_isColumnMajor === true) {
        this._v[0] = m[0]; this._v[3] = m[3]; this._v[6] = m[6];
        this._v[1] = m[1]; this._v[4] = m[4]; this._v[7] = m[7];
        this._v[2] = m[2]; this._v[5] = m[5]; this._v[8] = m[8];
      } else {
        // 'm' must be row major array if isColumnMajor is false
        this._v[0] = m[0]; this._v[3] = m[1]; this._v[6] = m[2];
        this._v[1] = m[3]; this._v[4] = m[4]; this._v[7] = m[5];
        this._v[2] = m[6]; this._v[5] = m[7]; this._v[8] = m[8];
      }
    } else if (m instanceof Float32Array) {
      if (_notCopyFloatArray) {
        this._v = m;
      } else {
        this._v = new Float32Array(9);
        if (_isColumnMajor === true) {
          this._v[0] = m[0]; this._v[3] = m[3]; this._v[6] = m[6];
          this._v[1] = m[1]; this._v[4] = m[4]; this._v[7] = m[7];
          this._v[2] = m[2]; this._v[5] = m[5]; this._v[8] = m[8];
        } else {
          // 'm' must be row major array if isColumnMajor is false
          this._v[0] = m[0]; this._v[3] = m[1]; this._v[6] = m[2];
          this._v[1] = m[3]; this._v[4] = m[4]; this._v[7] = m[5];
          this._v[2] = m[6]; this._v[5] = m[7]; this._v[8] = m[8];
        }
      }
    } else if (!!m && m._v?.[8] != null) {
      if (_notCopyFloatArray) {
        this._v = m._v;
      } else {
        this._v = new Float32Array(9);
        const v = (m as Matrix33 | Matrix44)._v;
        this._v[0] = v[0]; this._v[3] = v[3]; this._v[6] = v[6];
        this._v[1] = v[1]; this._v[4] = v[4]; this._v[7] = v[7];
        this._v[2] = v[2]; this._v[5] = v[5]; this._v[8] = v[8];
      }
    } else if (!!m && typeof (m as Quaternion).className !== 'undefined' && (m as Quaternion).className.indexOf('Quaternion') !== -1) {
      this._v = new Float32Array(9);
      const q = m as Quaternion;
      const sx = q._v[0] * q._v[0];
      const sy = q._v[1] * q._v[1];
      const sz = q._v[2] * q._v[2];
      const cx = q._v[1] * q._v[2];
      const cy = q._v[0] * q._v[2];
      const cz = q._v[0] * q._v[1];
      const wx = q._v[3] * q._v[0];
      const wy = q._v[3] * q._v[1];
      const wz = q._v[3] * q._v[2];

      this._v[0] = 1.0 - 2.0 * (sy + sz); this._v[3] = 2.0 * (cz - wz); this._v[6] = 2.0 * (cy + wy);
      this._v[1] = 2.0 * (cz + wz); this._v[4] = 1.0 - 2.0 * (sx + sz); this._v[7] = 2.0 * (cx - wx);
      this._v[2] = 2.0 * (cy - wy); this._v[5] = 2.0 * (cx + wx); this._v[8] = 1.0 - 2.0 * (sx + sy);

    } else {
      this._v = new Float32Array(9);
      this._v[0] = 1; this._v[3] = 0; this._v[6] = 0;
      this._v[1] = 0; this._v[4] = 1; this._v[7] = 0;
      this._v[2] = 0; this._v[5] = 0; this._v[8] = 1;

    }
  }

  public get m00() {
    return this._v[0];
  }

  public get m10() {
    return this._v[1];
  }

  public get m20() {
    return this._v[2];
  }

  public get m01() {
    return this._v[3];
  }

  public get m11() {
    return this._v[4];
  }

  public get m21() {
    return this._v[5];
  }

  public get m02() {
    return this._v[6];
  }

  public get m12() {
    return this._v[7];
  }

  public get m22() {
    return this._v[8];
  }

  get className() {
    return 'Matrix33';
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
    if (mat.isIdentityMatrixClass) {
      return mat;
    }

    return new this(
      mat._v[0], mat._v[1], mat._v[2],
      mat._v[3], mat._v[4], mat._v[5],
      mat._v[6], mat._v[7], mat._v[8]
    );
  }

  /**
   * Create invert matrix
   */
  static invert(mat: Matrix33) {
    if (mat.isIdentityMatrixClass) {
      return mat;
    }
    const det = mat.determinant();
    if (det === 0) {
      console.error('the determinant is 0!');
    }

    const m00 = (mat._v[4] * mat._v[8] - mat._v[7] * mat._v[5]) / det;
    const m01 = (mat._v[6] * mat._v[5] - mat._v[3] * mat._v[8]) / det;
    const m02 = (mat._v[3] * mat._v[7] - mat._v[6] * mat._v[4]) / det;
    const m10 = (mat._v[7] * mat._v[2] - mat._v[1] * mat._v[8]) / det;
    const m11 = (mat._v[0] * mat._v[8] - mat._v[6] * mat._v[2]) / det;
    const m12 = (mat._v[6] * mat._v[1] - mat._v[0] * mat._v[7]) / det;
    const m20 = (mat._v[1] * mat._v[5] - mat._v[4] * mat._v[2]) / det;
    const m21 = (mat._v[3] * mat._v[2] - mat._v[0] * mat._v[5]) / det;
    const m22 = (mat._v[0] * mat._v[4] - mat._v[3] * mat._v[1]) / det;

    return new this(
      m00, m01, m02,
      m10, m11, m12,
      m20, m21, m22
    );
  }

  static invertTo(mat: Matrix33, outMat: MutableMatrix33) {
    if (mat.isIdentityMatrixClass) {
      return outMat.copyComponents(mat);
    }
    const det = mat.determinant();
    if (det === 0) {
      console.error('the determinant is 0!');
    }

    const m00 = (mat._v[4] * mat._v[8] - mat._v[7] * mat._v[5]) / det;
    const m01 = (mat._v[6] * mat._v[5] - mat._v[3] * mat._v[8]) / det;
    const m02 = (mat._v[3] * mat._v[7] - mat._v[6] * mat._v[4]) / det;
    const m10 = (mat._v[7] * mat._v[2] - mat._v[1] * mat._v[8]) / det;
    const m11 = (mat._v[0] * mat._v[8] - mat._v[6] * mat._v[2]) / det;
    const m12 = (mat._v[6] * mat._v[1] - mat._v[0] * mat._v[7]) / det;
    const m20 = (mat._v[1] * mat._v[5] - mat._v[4] * mat._v[2]) / det;
    const m21 = (mat._v[3] * mat._v[2] - mat._v[0] * mat._v[5]) / det;
    const m22 = (mat._v[0] * mat._v[4] - mat._v[3] * mat._v[1]) / det;

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
    return this.rotateXYZ(vec._v[0], vec._v[1], vec._v[2]);
  }

  /**
   * Create Scale Matrix
   */
  static scale(vec: Vector3) {
    return new this(
      vec._v[0], 0, 0,
      0, vec._v[1], 0,
      0, 0, vec._v[2]
    );
  }

  /**
   * multiply matrixes
   */
  static multiply(l_mat: Matrix33, r_mat: Matrix33) {
    if (l_mat.isIdentityMatrixClass) {
      return r_mat;
    } else if (r_mat.isIdentityMatrixClass) {
      return l_mat;
    }

    const m00 = l_mat._v[0] * r_mat._v[0] + l_mat._v[3] * r_mat._v[1] + l_mat._v[6] * r_mat._v[2];
    const m10 = l_mat._v[1] * r_mat._v[0] + l_mat._v[4] * r_mat._v[1] + l_mat._v[7] * r_mat._v[2];
    const m20 = l_mat._v[2] * r_mat._v[0] + l_mat._v[5] * r_mat._v[1] + l_mat._v[8] * r_mat._v[2];

    const m01 = l_mat._v[0] * r_mat._v[3] + l_mat._v[3] * r_mat._v[4] + l_mat._v[6] * r_mat._v[5];
    const m11 = l_mat._v[1] * r_mat._v[3] + l_mat._v[4] * r_mat._v[4] + l_mat._v[7] * r_mat._v[5];
    const m21 = l_mat._v[2] * r_mat._v[3] + l_mat._v[5] * r_mat._v[4] + l_mat._v[8] * r_mat._v[5];

    const m02 = l_mat._v[0] * r_mat._v[6] + l_mat._v[3] * r_mat._v[7] + l_mat._v[6] * r_mat._v[8];
    const m12 = l_mat._v[1] * r_mat._v[6] + l_mat._v[4] * r_mat._v[7] + l_mat._v[7] * r_mat._v[8];
    const m22 = l_mat._v[2] * r_mat._v[6] + l_mat._v[5] * r_mat._v[7] + l_mat._v[8] * r_mat._v[8];

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
    if (l_mat.isIdentityMatrixClass) {
      return outMat.copyComponents(r_mat);
    } else if (r_mat.isIdentityMatrixClass) {
      return outMat.copyComponents(l_mat);
    }

    const m00 = l_mat._v[0] * r_mat._v[0] + l_mat._v[3] * r_mat._v[1] + l_mat._v[6] * r_mat._v[2];
    const m10 = l_mat._v[1] * r_mat._v[0] + l_mat._v[4] * r_mat._v[1] + l_mat._v[7] * r_mat._v[2];
    const m20 = l_mat._v[2] * r_mat._v[0] + l_mat._v[5] * r_mat._v[1] + l_mat._v[8] * r_mat._v[2];

    const m01 = l_mat._v[0] * r_mat._v[3] + l_mat._v[3] * r_mat._v[4] + l_mat._v[6] * r_mat._v[5];
    const m11 = l_mat._v[1] * r_mat._v[3] + l_mat._v[4] * r_mat._v[4] + l_mat._v[7] * r_mat._v[5];
    const m21 = l_mat._v[2] * r_mat._v[3] + l_mat._v[5] * r_mat._v[4] + l_mat._v[8] * r_mat._v[5];

    const m02 = l_mat._v[0] * r_mat._v[6] + l_mat._v[3] * r_mat._v[7] + l_mat._v[6] * r_mat._v[8];
    const m12 = l_mat._v[1] * r_mat._v[6] + l_mat._v[4] * r_mat._v[7] + l_mat._v[7] * r_mat._v[8];
    const m22 = l_mat._v[2] * r_mat._v[6] + l_mat._v[5] * r_mat._v[7] + l_mat._v[8] * r_mat._v[8];

    return outMat.setComponents(
      m00, m01, m02,
      m10, m11, m12,
      m20, m21, m22
    );
  }

  toString() {
    return this._v[0] + ' ' + this._v[3] + ' ' + this._v[6] + '\n' +
      this._v[1] + ' ' + this._v[4] + ' ' + this._v[7] + '\n' +
      this._v[2] + ' ' + this._v[5] + ' ' + this._v[8] + '\n';
  }

  toStringApproximately() {
    return MathUtil.financial(this._v[0]) + ' ' + MathUtil.financial(this._v[3]) + ' ' + MathUtil.financial(this._v[6]) + '\n' +
      MathUtil.financial(this._v[1]) + ' ' + MathUtil.financial(this._v[4]) + ' ' + MathUtil.financial(this._v[7]) + ' \n' +
      MathUtil.financial(this._v[2]) + ' ' + MathUtil.financial(this._v[5]) + ' ' + MathUtil.financial(this._v[8]) + '\n';
  }

  flattenAsArray() {
    return [this._v[0], this._v[1], this._v[2],
    this._v[3], this._v[4], this._v[5],
    this._v[6], this._v[7], this._v[8]];
  }

  isDummy() {
    if (this._v.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  isEqual(mat: Matrix33, delta: number = Number.EPSILON) {
    if (Math.abs(mat._v[0] - this._v[0]) < delta &&
      Math.abs(mat._v[1] - this._v[1]) < delta &&
      Math.abs(mat._v[2] - this._v[2]) < delta &&
      Math.abs(mat._v[3] - this._v[3]) < delta &&
      Math.abs(mat._v[4] - this._v[4]) < delta &&
      Math.abs(mat._v[5] - this._v[5]) < delta &&
      Math.abs(mat._v[6] - this._v[6]) < delta &&
      Math.abs(mat._v[7] - this._v[7]) < delta &&
      Math.abs(mat._v[8] - this._v[8]) < delta) {
      return true;
    } else {
      return false;
    }
  }

  isStrictEqual(mat: Matrix33) {
    if (
      mat._v[0] === this._v[0] && mat._v[1] === this._v[1] && mat._v[2] === this._v[2] &&
      mat._v[3] === this._v[3] && mat._v[4] === this._v[4] && mat._v[5] === this._v[5] &&
      mat._v[6] === this._v[6] && mat._v[7] === this._v[7] && mat._v[8] === this._v[8]
    ) {
      return true;
    } else {
      return false;
    }
  }

  at(row_i: number, column_i: number) {
    return this._v[row_i + column_i * 3];
  }

  v(i: number): number {
    return this._v[i];
  }

  determinant() {
    return this._v[0] * this._v[4] * this._v[8] + this._v[1] * this._v[5] * this._v[6] + this._v[2] * this._v[3] * this._v[7]
      - this._v[0] * this._v[5] * this._v[7] - this._v[2] * this._v[4] * this._v[6] - this._v[1] * this._v[3] * this._v[8];
  }

  multiplyVector(vec: IVector3) {
    const x = this._v[0] * vec._v[0] + this._v[3] * vec._v[1] + this._v[6] * vec._v[2];
    const y = this._v[1] * vec._v[0] + this._v[4] * vec._v[1] + this._v[7] * vec._v[2];
    const z = this._v[2] * vec._v[0] + this._v[5] * vec._v[1] + this._v[8] * vec._v[2];
    return new (vec.constructor as any)(x, y, z);
  }

  multiplyVectorTo(vec: IVector3, outVec: IMutableVector3) {
    const x = this._v[0] * vec._v[0] + this._v[3] * vec._v[1] + this._v[6] * vec._v[2];
    const y = this._v[1] * vec._v[0] + this._v[4] * vec._v[1] + this._v[7] * vec._v[2];
    const z = this._v[2] * vec._v[0] + this._v[5] * vec._v[1] + this._v[8] * vec._v[2];
    outVec._v[0] = x;
    outVec._v[1] = y;
    outVec._v[2] = z;
    return outVec;
  }

  getScale() {
    return new Vector3(
      Math.hypot(this._v[0], this._v[3], this._v[6]),
      Math.hypot(this._v[1], this._v[4], this._v[7]),
      Math.hypot(this._v[2], this._v[5], this._v[8])
    );
  }

  getScaleTo(outVec: MutableVector3) {
    outVec._v[0] = Math.hypot(this._v[0], this._v[3], this._v[6]);
    outVec._v[1] = Math.hypot(this._v[1], this._v[4], this._v[7]);
    outVec._v[2] = Math.hypot(this._v[2], this._v[5], this._v[8]);
    return outVec;
  }

  clone() {
    return new (this.constructor as any)(
      this._v[0], this._v[3], this._v[6],
      this._v[1], this._v[4], this._v[7],
      this._v[2], this._v[5], this._v[8]
    ) as Matrix33;
  }
}
