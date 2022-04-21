import { Matrix44 } from './Matrix44';
import {IMutableMatrix22, IMutableMatrix, IMatrix22} from './IMatrix';
import { Matrix22 } from './Matrix22';
import {Array4, Index} from '../../types/CommonTypes';
import { Matrix33 } from './Matrix33';
import { Vector2 } from './Vector2';

export class MutableMatrix22
  extends Matrix22
  implements IMutableMatrix, IMutableMatrix22
{
  constructor(m: Float32Array) {
    super(m);
  }

  public set m00(val) {
    this._v[0] = val;
  }

  public get m00() {
    return this._v[0];
  }

  public set m10(val) {
    this._v[1] = val;
  }

  public get m10() {
    return this._v[1];
  }

  public set m01(val) {
    this._v[2] = val;
  }

  public get m01() {
    return this._v[2];
  }

  public set m11(val) {
    this._v[3] = val;
  }

  public get m11() {
    return this._v[3];
  }

  get className() {
    return 'MutableMatrix22';
  }

  /**
   * Create zero matrix
   */
  static zero() {
    return super.zero() as MutableMatrix22;
  }

  /**
   * Create identity matrix
   */
  static identity() {
    return super.identity() as MutableMatrix22;
  }

  static dummy() {
    return super.dummy() as MutableMatrix22;
  }

  /**
   * Create transpose matrix
   */
  static transpose(mat: Matrix22) {
    return super.transpose(mat) as MutableMatrix22;
  }

  /**
   * Create invert matrix
   */
  static invert(mat: Matrix22) {
    return super.invert(mat) as MutableMatrix22;
  }

  /**
   * Create Rotation Matrix
   */
  static rotate(radian: number) {
    return super.rotate(radian) as MutableMatrix22;
  }

  /**
   * Create Scale Matrix
   */
  static scale(vec: Vector2) {
    return super.scale(vec) as unknown as MutableMatrix22;
  }

  /**
   * multiply matrixes
   */
  static multiply(l_mat: Matrix22, r_mat: Matrix22) {
    return super.multiply(l_mat, r_mat) as MutableMatrix22;
  }

  clone() {
    const result = super.clone() as MutableMatrix22;
    return result;
  }

  raw() {
    return this._v;
  }

  setAt(row_i: number, column_i: number, value: number) {
    this._v[row_i + column_i * 2] = value;
    return this;
  }

  setComponents(
    m00: number,
    m01: number,
    m10: number,
    m11: number
  ): MutableMatrix22 {
    this._v[0] = m00;
    this._v[2] = m01;
    this._v[1] = m10;
    this._v[3] = m11;

    return this;
  }

  copyComponents(mat: Matrix22 | Matrix33 | Matrix44) {
    this._v[0] = mat.m00;
    this._v[2] = mat.m01; // mat.m01 is mat._v[2 or 3 or 4]
    this._v[1] = mat.m10;
    this._v[3] = mat.m11;

    return this;
  }

  /**
   * zero matrix
   */
  zero() {
    return this.setComponents(0, 0, 0, 0);
  }

  identity() {
    return this.setComponents(1, 0, 0, 1);
  }

  _swap(l: Index, r: Index) {
    this._v[r] = [this._v[l], (this._v[l] = this._v[r])][0];
  }

  /**
   * transpose
   */
  transpose() {
    this._swap(1, 2);

    return this;
  }

  invert() {
    const det = this.determinant();
    if (det === 0) {
      console.error('the determinant is 0!');
    }

    const m00 = this._v[3] / det;
    const m01 = (this._v[2] / det) * -1.0;
    const m10 = (this._v[1] / det) * -1.0;
    const m11 = this._v[0] / det;

    return this.setComponents(m00, m01, m10, m11);
  }

  /**
   * Create Rotation Matrix
   */
  rotate(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this.setComponents(cos, -sin, sin, cos);
  }

  scale(vec: Vector2) {
    return this.setComponents(vec._v[0], 0, 0, vec._v[1]);
  }

  multiplyScale(vec: Vector2) {
    this._v[0] *= vec._v[0];
    this._v[2] *= vec._v[0];

    this._v[1] *= vec._v[1];
    this._v[3] *= vec._v[1];

    return this;
  }

  /**
   * multiply the input matrix from right side
   */
  multiply(mat: Matrix22) {
    const m00 = this._v[0] * mat._v[0] + this._v[2] * mat._v[1];
    const m01 = this._v[0] * mat._v[2] + this._v[2] * mat._v[3];

    const m10 = this._v[1] * mat._v[0] + this._v[3] * mat._v[1];
    const m11 = this._v[1] * mat._v[2] + this._v[3] * mat._v[3];

    return this.setComponents(m00, m01, m10, m11);
  }

  multiplyByLeft(mat: Matrix22) {
    const m00 = mat._v[0] * this._v[0] + mat._v[2] * this._v[1];
    const m01 = mat._v[0] * this._v[2] + mat._v[2] * this._v[3];

    const m10 = mat._v[1] * this._v[0] + mat._v[3] * this._v[1];
    const m11 = mat._v[1] * this._v[2] + mat._v[3] * this._v[3];

    return this.setComponents(m00, m01, m10, m11);
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
    return new MutableMatrix22(v);
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
    return new MutableMatrix22(v);
  }

  static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array) {
    const v = new Float32Array(4);
    v.set(float32Array);
    return new MutableMatrix22(v);
  }

  static fromCopyFloat32ArrayRowMajor(array: Float32Array) {
    const v = new Float32Array(4);
    v[0] = array[0]; v[3] = array[1];
    v[1] = array[2]; v[4] = array[3];

    return new MutableMatrix22(v);
  }

  static fromCopyMatrix22(mat: IMatrix22) {
    const v = new Float32Array(4);
    v[0] = mat._v[0]; v[3] = mat._v[1];
    v[1] = mat._v[2]; v[4] = mat._v[3];
    return new MutableMatrix22(v);
  }

  static fromCopyArray9ColumnMajor(array: Array4<number>) {
    const v = new Float32Array(4);
    v.set(array);
    return new MutableMatrix22(v);
  }

  static fromCopyArrayColumnMajor(array: Array<number>) {
    const v = new Float32Array(4);
    v.set(array);
    return new MutableMatrix22(v);
  }

  static fromCopyArray9RowMajor(array: Array4<number>) {
    const v = new Float32Array(4);
    v[0] = array[0]; v[3] = array[1];
    v[1] = array[2]; v[4] = array[3];
    return new MutableMatrix22(v);
  }

  static fromCopyArrayRowMajor(array: Array<number>) {
    const v = new Float32Array(4);
    v[0] = array[0]; v[3] = array[1];
    v[1] = array[2]; v[4] = array[3];
    return new MutableMatrix22(v);
  }
}
