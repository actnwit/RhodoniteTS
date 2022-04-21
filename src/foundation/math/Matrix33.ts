import {Vector3} from './Vector3';
import {Matrix44} from './Matrix44';
import {Quaternion} from './Quaternion';
import {IMatrix, IMatrix33} from './IMatrix';
import {MutableMatrix33} from './MutableMatrix33';
import {CompositionType} from '../definitions/CompositionType';
import {MathUtil} from './MathUtil';
import {MutableVector3} from './MutableVector3';
import {AbstractMatrix} from './AbstractMatrix';
import {IdentityMatrix33} from './IdentityMatrix33';
import {IMutableVector3, IVector3} from './IVector';
import {Array9} from '../../types';
/* eslint-disable prettier/prettier */

export class Matrix33 extends AbstractMatrix implements IMatrix, IMatrix33 {
  constructor(m: Float32Array) {
    super();
    this._v = m;
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
    return Matrix33.fromCopy9RowMajor(0, 0, 0, 0, 0, 0, 0, 0, 0);
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
    return new this(new Float32Array(0));
  }

  /**
   * Create transpose matrix
   */
  static transpose(mat: Matrix33) {
    if (mat.isIdentityMatrixClass) {
      return mat;
    }

    return Matrix33.fromCopy9RowMajor(
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

    return Matrix33.fromCopy9RowMajor(
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
    return Matrix33.fromCopy9RowMajor(
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
    return Matrix33.fromCopy9RowMajor(
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
    return Matrix33.fromCopy9RowMajor(
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

    return Matrix33.fromCopy9RowMajor(
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
    return Matrix33.fromCopy9RowMajor(
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

    return Matrix33.fromCopy9RowMajor(
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
    return new (vec.constructor as any)(new Float32Array([x, y, z]));
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
    return Vector3.fromCopyArray([
      Math.hypot(this._v[0], this._v[3], this._v[6]),
      Math.hypot(this._v[1], this._v[4], this._v[7]),
      Math.hypot(this._v[2], this._v[5], this._v[8])]
    );
  }

  getScaleTo(outVec: MutableVector3) {
    outVec._v[0] = Math.hypot(this._v[0], this._v[3], this._v[6]);
    outVec._v[1] = Math.hypot(this._v[1], this._v[4], this._v[7]);
    outVec._v[2] = Math.hypot(this._v[2], this._v[5], this._v[8]);
    return outVec;
  }

  clone() {
    return (this.constructor as any).fromCopy9RowMajor(
      this._v[0], this._v[3], this._v[6],
      this._v[1], this._v[4], this._v[7],
      this._v[2], this._v[5], this._v[8]
    );
  }

  /**
   * Set values as Row Major
   * Note that WebGL matrix keeps the values in column major.
   * If you write 9 values in 3x3 style (3 values in each row),
   *   It will becomes an intuitive handling.
   * @returns
   */
  static fromCopy9RowMajor(
    m00: number, m01: number, m02: number,
    m10: number, m11: number, m12: number,
    m20: number, m21: number, m22: number)
  {
    const v = new Float32Array(9);
    v[0] = m00; v[3] = m01; v[6] = m02;
    v[1] = m10; v[4] = m11; v[7] = m12;
    v[2] = m20; v[5] = m21; v[8] = m22;
    return new Matrix33(v);
  }

  /**
   * Set values as Column Major
   * Note that WebGL matrix keeps the values in column major.
   * @returns
   */
  static fromCopy9ColumnMajor(
    m00: number, m10: number, m20: number,
    m01: number, m11: number, m21: number,
    m02: number, m12: number, m22: number)
  {
    const v = new Float32Array(9);
    v[0] = m00; v[3] = m01; v[6] = m02;
    v[1] = m10; v[4] = m11; v[7] = m12;
    v[2] = m20; v[5] = m21; v[8] = m22;
    return new Matrix33(v);
  }


  static fromCopyMatrix44(mat: Matrix44) {
    const v = new Float32Array(9);
    v.set(mat._v);
    return new Matrix33(v);
  }

  static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array) {
    const v = new Float32Array(9);
    v.set(float32Array);
    return new Matrix33(v);
  }

  static fromCopyFloat32ArrayRowMajor(array: Float32Array) {
    const v = new Float32Array(9);
    v[0] = array[0]; v[3] = array[1]; v[6] = array[2];
    v[1] = array[3]; v[4] = array[4]; v[7] = array[5];
    v[2] = array[6]; v[5] = array[7]; v[8] = array[8];

    return new Matrix33(v);
  }

  static fromCopyMatrix33(mat: IMatrix33) {
    const v = new Float32Array(9);
    v[0] = mat._v[0]; v[3] = mat._v[3]; v[6] = mat._v[6];
    v[1] = mat._v[1]; v[4] = mat._v[4]; v[7] = mat._v[7];
    v[2] = mat._v[2]; v[5] = mat._v[5]; v[8] = mat._v[8];
    return new Matrix33(v);
  }

  static fromCopyArray9ColumnMajor(array: Array9<number>) {
    const v = new Float32Array(9);
    v.set(array);
    return new Matrix33(v);
  }

  static fromCopyArrayColumnMajor(array: Array<number>) {
    const v = new Float32Array(9);
    v.set(array);
    return new Matrix33(v);
  }

  static fromCopyArray9RowMajor(array: Array9<number>) {
    const v = new Float32Array(9);
    v[0] = array[0]; v[3] = array[1]; v[6] = array[2];
    v[1] = array[3]; v[4] = array[4]; v[7] = array[5];
    v[2] = array[6]; v[5] = array[7]; v[8] = array[8];
    return new Matrix33(v);
  }

  static fromCopyArrayRowMajor(array: Array<number>) {
    const v = new Float32Array(9);
    v[0] = array[0]; v[3] = array[1]; v[6] = array[2];
    v[1] = array[3]; v[4] = array[4]; v[7] = array[5];
    v[2] = array[6]; v[5] = array[7]; v[8] = array[8];
    return new Matrix33(v);
  }

  static fromQuaternion(q: Quaternion) {
    const sx = q._v[0] * q._v[0];
    const sy = q._v[1] * q._v[1];
    const sz = q._v[2] * q._v[2];
    const cx = q._v[1] * q._v[2];
    const cy = q._v[0] * q._v[2];
    const cz = q._v[0] * q._v[1];
    const wx = q._v[3] * q._v[0];
    const wy = q._v[3] * q._v[1];
    const wz = q._v[3] * q._v[2];
    const v = new Float32Array(9)
    v[0] = 1.0 - 2.0 * (sy + sz); v[3] = 2.0 * (cz - wz); v[6] = 2.0 * (cy + wy);
    v[1] = 2.0 * (cz + wz); v[4] = 1.0 - 2.0 * (sx + sz); v[7] = 2.0 * (cx - wx);
    v[2] = 2.0 * (cy - wy); v[5] = 2.0 * (cx + wx); v[8] = 1.0 - 2.0 * (sx + sy);

    return new Matrix33(v);
  }
}
