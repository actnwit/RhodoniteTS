/* eslint-disable prettier/prettier */
import { Matrix33 } from './Matrix33';
import { Matrix44 } from './Matrix44';
import {IMatrix, IMatrix22} from './IMatrix';
import {CompositionType} from '../definitions/CompositionType';
import { Vector2 } from './Vector2';
import { MutableMatrix22 } from './MutableMatrix22';
import {MathUtil} from './MathUtil';
import { MutableVector2 } from './MutableVector2';
import { AbstractMatrix } from './AbstractMatrix';
import { Array4 } from '../../types';

export class Matrix22 extends AbstractMatrix implements IMatrix22 {
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

  public get m01() {
    return this._v[2];
  }

  public get m11() {
    return this._v[3];
  }

  get className() {
    return 'Matrix22';
  }

  static get compositionType() {
    return CompositionType.Mat2;
  }

  /**
   * Create zero matrix
   */
  static zero() {
    return Matrix22.fromCopy4RowMajor(0, 0, 0, 0);
  }

  /**
   * Create identity matrix
   */
  static identity() {
    return Matrix22.fromCopy4RowMajor(1, 0, 0, 1);
  }

  static dummy() {
    return new this(new Float32Array(0));
  }

  /**
   * Create transpose matrix
   */
  static transpose(mat: Matrix22) {
    return Matrix22.fromCopy4RowMajor(
      mat._v[0],
      mat._v[1],
      mat._v[2],
      mat._v[3]
    );
  }

  /**
   * Create invert matrix
   */
  static invert(mat: Matrix22) {
    const det = mat.determinant();
    if (det === 0) {
      console.error('the determinant is 0!');
    }

    const m00 = mat._v[3] / det;
    const m01 = (mat._v[2] / det) * -1.0;
    const m10 = (mat._v[1] / det) * -1.0;
    const m11 = mat._v[0] / det;

    return Matrix22.fromCopy4RowMajor(m00, m01, m10, m11);
  }

  static invertTo(mat: Matrix22, outMat: MutableMatrix22) {
    const det = mat.determinant();
    if (det === 0) {
      console.error('the determinant is 0!');
    }

    const m00 = mat._v[3] / det;
    const m01 = (mat._v[2] / det) * -1.0;
    const m10 = (mat._v[1] / det) * -1.0;
    const m11 = mat._v[0] / det;

    return outMat.setComponents(m00, m01, m10, m11);
  }

  /**
   * Create Rotation Matrix
   */
  static rotate(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return Matrix22.fromCopy4RowMajor(cos, -sin, sin, cos);
  }

  /**
   * Create Scale Matrix
   */
  static scale(vec: Vector2) {
    return Matrix22.fromCopy4RowMajor(vec._v[0], 0, 0, vec._v[1]);
  }

  /**
   * multiply matrixes
   */
  static multiply(l_mat: Matrix22, r_mat: Matrix22) {
    const m00 = l_mat._v[0] * r_mat._v[0] + l_mat._v[2] * r_mat._v[1];
    const m10 = l_mat._v[1] * r_mat._v[0] + l_mat._v[3] * r_mat._v[1];

    const m01 = l_mat._v[0] * r_mat._v[2] + l_mat._v[2] * r_mat._v[3];
    const m11 = l_mat._v[1] * r_mat._v[2] + l_mat._v[3] * r_mat._v[3];

    return Matrix22.fromCopy4RowMajor(m00, m01, m10, m11);
  }

  /**
   * multiply matrixes
   */
  static multiplyTo(l_mat: Matrix33, r_mat: Matrix33, outMat: MutableMatrix22) {
    const m00 = l_mat._v[0] * r_mat._v[0] + l_mat._v[2] * r_mat._v[1];
    const m10 = l_mat._v[1] * r_mat._v[0] + l_mat._v[3] * r_mat._v[1];

    const m01 = l_mat._v[0] * r_mat._v[2] + l_mat._v[2] * r_mat._v[3];
    const m11 = l_mat._v[1] * r_mat._v[2] + l_mat._v[3] * r_mat._v[3];

    return outMat.setComponents(m00, m01, m10, m11);
  }

  toString() {
    return (
      this._v[0] +
      ' ' +
      this._v[2] +
      '\n' +
      this._v[1] +
      ' ' +
      this._v[3] +
      ' \n'
    );
  }

  toStringApproximately() {
    return (
      MathUtil.financial(this._v[0]) +
      ' ' +
      MathUtil.financial(this._v[2]) +
      '\n' +
      MathUtil.financial(this._v[1]) +
      ' ' +
      MathUtil.financial(this._v[3]) +
      ' \n'
    );
  }

  flattenAsArray() {
    return [this._v[0], this._v[1], this._v[2], this._v[3]];
  }

  isDummy() {
    if (this._v.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  isEqual(mat: Matrix22, delta: number = Number.EPSILON) {
    if (
      Math.abs(mat._v[0] - this._v[0]) < delta &&
      Math.abs(mat._v[1] - this._v[1]) < delta &&
      Math.abs(mat._v[2] - this._v[2]) < delta &&
      Math.abs(mat._v[3] - this._v[3]) < delta
    ) {
      return true;
    } else {
      return false;
    }
  }

  isStrictEqual(mat: Matrix22) {
    if (
      mat._v[0] === this._v[0] &&
      mat._v[1] === this._v[1] &&
      mat._v[2] === this._v[2] &&
      mat._v[3] === this._v[3]
    ) {
      return true;
    } else {
      return false;
    }
  }

  at(row_i: number, column_i: number) {
    return this._v[row_i + column_i * 2];
  }

  determinant() {
    return this._v[0] * this._v[3] - this._v[1] * this._v[2];
  }

  multiplyVector(vec: Vector2) {
    const x = this._v[0] * vec._v[0] + this._v[2] * vec._v[1];
    const y = this._v[1] * vec._v[0] + this._v[3] * vec._v[1];
    return Vector2.fromCopyArray2([x, y]);
  }

  multiplyVectorTo(vec: Vector2, outVec: MutableVector2) {
    const x = this._v[0] * vec._v[0] + this._v[2] * vec._v[1];
    const y = this._v[1] * vec._v[0] + this._v[3] * vec._v[1];
    outVec._v[0] = x;
    outVec._v[1] = y;
    return outVec;
  }

  getScale() {
    return Vector2.fromCopyArray2([
      Math.hypot(this.m00, this.m01),
      Math.hypot(this.m10, this.m11),
    ]);
  }

  getScaleTo(outVec: MutableVector2) {
    outVec._v[0] = Math.hypot(this._v[0], this._v[2]);
    outVec._v[1] = Math.hypot(this._v[1], this._v[3]);
    return outVec;
  }

  clone() {
    return (this.constructor as any).fromCopy4RowMajor(
      this._v[0],
      this._v[2],
      this._v[1],
      this._v[3]
    );
  }

  /**
   * Set values as Row Major
   * Note that WebGL matrix keeps the values in column major.
   * If you write 4 values in 2x2 style (2 values in each row),
   *   It will becomes an intuitive handling.
   * @returns
   */
  static fromCopy4RowMajor(
    m00: number, m01: number,
    m10: number, m11: number)
  {
    const v = new Float32Array(4);
    v[0] = m00; v[2] = m01;
    v[1] = m10; v[3] = m11;
    return new Matrix22(v);
  }

  /**
   * Set values as Column Major
   * Note that WebGL matrix keeps the values in column major.
   * @returns
   */
  static fromCopy4ColumnMajor(
    m00: number, m10: number,
    m01: number, m11: number)
  {
    const v = new Float32Array(4);
    v[0] = m00; v[2] = m01;
    v[1] = m10; v[3] = m11;
    return new Matrix22(v);
  }

  static fromFloat32ArrayColumnMajor(float32Array: Float32Array) {
    return new Matrix22(float32Array);
  }

  static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array) {
    const v = new Float32Array(4);
    v.set(float32Array);
    return new Matrix22(v);
  }

  static fromCopyFloat32ArrayRowMajor(array: Float32Array) {
    const v = new Float32Array(4);
    v[0] = array[0]; v[3] = array[1];
    v[1] = array[2]; v[4] = array[3];

    return new Matrix22(v);
  }

  static fromCopyMatrix22(mat: IMatrix22) {
    const v = new Float32Array(4);
    v[0] = mat._v[0]; v[3] = mat._v[1];
    v[1] = mat._v[2]; v[4] = mat._v[3];
    return new Matrix22(v);
  }

  static fromCopyArray9ColumnMajor(array: Array4<number>) {
    const v = new Float32Array(4);
    v.set(array);
    return new Matrix22(v);
  }

  static fromCopyArrayColumnMajor(array: Array<number>) {
    const v = new Float32Array(4);
    v.set(array);
    return new Matrix22(v);
  }

  static fromCopyArray9RowMajor(array: Array4<number>) {
    const v = new Float32Array(4);
    v[0] = array[0]; v[3] = array[1];
    v[1] = array[2]; v[4] = array[3];
    return new Matrix22(v);
  }

  static fromCopyArrayRowMajor(array: Array<number>) {
    const v = new Float32Array(4);
    v[0] = array[0]; v[3] = array[1];
    v[1] = array[2]; v[4] = array[3];
    return new Matrix22(v);
  }
}
