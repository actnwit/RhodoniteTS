import {Matrix44} from './Matrix44';
import {Quaternion} from './Quaternion';
import {IMutableMatrix33, IMutableMatrix, IMatrix33} from './IMatrix';
import {Matrix33} from './Matrix33';
import {Vector3} from './Vector3';
import {Array9, Index} from '../../types/CommonTypes';

/* eslint-disable prettier/prettier */
export class MutableMatrix33 extends Matrix33 implements IMutableMatrix, IMutableMatrix33 {

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

  public set m20(val) {
    this._v[2] = val;
  }

  public get m20() {
    return this._v[2];
  }

  public set m01(val) {
    this._v[3] = val;
  }

  public get m01() {
    return this._v[3];
  }

  public set m11(val) {
    this._v[4] = val;
  }

  public get m11() {
    return this._v[4];
  }

  public set m21(val) {
    this._v[5] = val;
  }

  public get m21() {
    return this._v[5];
  }

  public set m02(val) {
    this._v[6] = val;
  }

  public get m02() {
    return this._v[6];
  }

  public set m12(val) {
    this._v[7] = val;
  }

  public get m12() {
    return this._v[7];
  }

  public set m22(val) {
    this._v[8] = val;
  }

  public get m22() {
    return this._v[8];
  }

  get className() {
    return 'MutableMatrix33';
  }

  /**
   * zero matrix(static version)
   */
  static zero() {
    return super.zero() as MutableMatrix33;
  }

  /**
   * Create identity matrix
   */
  static identity() {
    return MutableMatrix33.fromCopy9RowMajor(1, 0, 0, 0, 1, 0, 0, 0, 1);
  }

  static dummy() {
    return super.dummy() as MutableMatrix33;
  }

  /**
   * Create transpose matrix
   */
  static transpose(mat: Matrix33) {
    return super.transpose(mat) as MutableMatrix33;
  }

  /**
   * Create invert matrix
   */
  static invert(mat: Matrix33) {
    return super.invert(mat) as MutableMatrix33;
  }

  /**
 * Create X oriented Rotation Matrix
 */
  static rotateX(radian: number) {
    return super.rotateX(radian) as MutableMatrix33;
  }

  /**
   * Create Y oriented Rotation Matrix
   */
  static rotateY(radian: number) {
    return super.rotateY(radian) as MutableMatrix33;
  }

  /**
   * Create Z oriented Rotation Matrix
   */
  static rotateZ(radian: number) {
    return super.rotateZ(radian) as MutableMatrix33;
  }

  static rotateXYZ(x: number, y: number, z: number) {
    return super.rotateXYZ(x, y, z) as MutableMatrix33;
  }

  static rotate(vec: Vector3) {
    return super.rotateXYZ(vec._v[0], vec._v[1], vec._v[2]) as MutableMatrix33;
  }

  /**
   * Create Scale Matrix
   */
  static scale(vec: Vector3) {
    return super.scale(vec) as MutableMatrix33;
  }

  /**
   * multiply matrixes
   */
  static multiply(l_mat: Matrix33, r_mat: Matrix33) {
    return super.multiply(l_mat, r_mat) as MutableMatrix33;
  }

  clone() {
    const result = super.clone() as MutableMatrix33;
    return result;
  }

  raw() {
    return this._v;
  }

  setAt(row_i: number, column_i: number, value: number) {
    this._v[row_i + column_i * 3] = value;
    return this;
  }

  setComponents(
    m00: number, m01: number, m02: number,
    m10: number, m11: number, m12: number,
    m20: number, m21: number, m22: number
  ): MutableMatrix33 {
    this._v[0] = m00; this._v[3] = m01; this._v[6] = m02;
    this._v[1] = m10; this._v[4] = m11; this._v[7] = m12;
    this._v[2] = m20; this._v[5] = m21; this._v[8] = m22;

    return this;
  }

  copyComponents(mat: Matrix33 | Matrix44) {
    this._v[0] = mat.m00; this._v[3] = mat.m01; this._v[6] = mat.m02; // mat.m01 is mat._v[3 or 4]
    this._v[1] = mat.m10; this._v[4] = mat.m11; this._v[7] = mat.m12;
    this._v[2] = mat.m20; this._v[5] = mat.m21; this._v[8] = mat.m22;

    return this;
  }

  /**
   * zero matrix
   */
  zero() {
    return this.setComponents(0, 0, 0, 0, 0, 0, 0, 0, 0);
  }

  identity() {
    return this.setComponents(
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    );
  }

  _swap(l: Index, r: Index) {
    this._v[r] = [this._v[l], this._v[l] = this._v[r]][0];
  }

  /**
   * transpose
   */
  transpose() {
    this._swap(1, 3);
    this._swap(2, 6);
    this._swap(5, 8);

    return this;
  }

  invert() {
    const det = this.determinant();
    if (det === 0) {
      console.error('the determinant is 0!');
    }

    const m00 = (this._v[4] * this._v[8] - this._v[7] * this._v[5]) / det;
    const m01 = (this._v[6] * this._v[5] - this._v[3] * this._v[8]) / det;
    const m02 = (this._v[3] * this._v[7] - this._v[6] * this._v[4]) / det;
    const m10 = (this._v[7] * this._v[2] - this._v[1] * this._v[8]) / det;
    const m11 = (this._v[0] * this._v[8] - this._v[6] * this._v[2]) / det;
    const m12 = (this._v[6] * this._v[1] - this._v[0] * this._v[7]) / det;
    const m20 = (this._v[1] * this._v[5] - this._v[4] * this._v[2]) / det;
    const m21 = (this._v[3] * this._v[2] - this._v[0] * this._v[5]) / det;
    const m22 = (this._v[0] * this._v[4] - this._v[3] * this._v[1]) / det;

    return this.setComponents(
      m00, m01, m02,
      m10, m11, m12,
      m20, m21, m22
    );
  }

  /**
   * Create X oriented Rotation Matrix
   */
  rotateX(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this.setComponents(
      1, 0, 0,
      0, cos, -sin,
      0, sin, cos
    );
  }

  /**
   * Create Y oriented Rotation Matrix
   */
  rotateY(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this.setComponents(
      cos, 0, sin,
      0, 1, 0,
      -sin, 0, cos
    );
  }

  /**
   * Create Z oriented Rotation Matrix
   */
  rotateZ(radian: number): MutableMatrix33 {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this.setComponents(
      cos, -sin, 0,
      sin, cos, 0,
      0, 0, 1
    );
  }

  rotateXYZ(x: number, y: number, z: number) {
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

    return this.setComponents(
      m00, m01, m02,
      m10, m11, m12,
      m20, m21, m22
    );
  }

  rotate(vec: Vector3) {
    return this.rotateXYZ(vec._v[0], vec._v[1], vec._v[2]);
  }

  scale(vec: Vector3) {
    return this.setComponents(
      vec._v[0], 0, 0,
      0, vec._v[1], 0,
      0, 0, vec._v[2]
    );
  }

  multiplyScale(vec: Vector3) {
    this._v[0] *= vec._v[0];
    this._v[3] *= vec._v[0];
    this._v[6] *= vec._v[0];

    this._v[1] *= vec._v[1];
    this._v[4] *= vec._v[1];
    this._v[7] *= vec._v[1];

    this._v[2] *= vec._v[2];
    this._v[5] *= vec._v[2];
    this._v[8] *= vec._v[2];

    return this;
  }

  /**
   * multiply the input matrix from right side
   */
  multiply(mat: Matrix33) {
    if (mat.isIdentityMatrixClass) {
      return this;
    }

    const m00 = this._v[0] * mat._v[0] + this._v[3] * mat._v[1] + this._v[6] * mat._v[2];
    const m01 = this._v[0] * mat._v[3] + this._v[3] * mat._v[4] + this._v[6] * mat._v[5];
    const m02 = this._v[0] * mat._v[6] + this._v[3] * mat._v[7] + this._v[6] * mat._v[8];

    const m10 = this._v[1] * mat._v[0] + this._v[4] * mat._v[1] + this._v[7] * mat._v[2];
    const m11 = this._v[1] * mat._v[3] + this._v[4] * mat._v[4] + this._v[7] * mat._v[5];
    const m12 = this._v[1] * mat._v[6] + this._v[4] * mat._v[7] + this._v[7] * mat._v[8];

    const m20 = this._v[2] * mat._v[0] + this._v[5] * mat._v[1] + this._v[8] * mat._v[2];
    const m21 = this._v[2] * mat._v[3] + this._v[5] * mat._v[4] + this._v[8] * mat._v[5];
    const m22 = this._v[2] * mat._v[6] + this._v[5] * mat._v[7] + this._v[8] * mat._v[8];

    return this.setComponents(
      m00, m01, m02,
      m10, m11, m12,
      m20, m21, m22
    );
  }

  multiplyByLeft(mat: Matrix33) {
    if (mat.isIdentityMatrixClass) {
      return this;
    }

    const m00 = mat._v[0] * this._v[0] + mat._v[3] * this._v[1] + mat._v[6] * this._v[2];
    const m01 = mat._v[0] * this._v[3] + mat._v[3] * this._v[4] + mat._v[6] * this._v[5];
    const m02 = mat._v[0] * this._v[6] + mat._v[3] * this._v[7] + mat._v[6] * this._v[8];

    const m10 = mat._v[1] * this._v[0] + mat._v[4] * this._v[1] + mat._v[7] * this._v[2];
    const m11 = mat._v[1] * this._v[3] + mat._v[4] * this._v[4] + mat._v[7] * this._v[5];
    const m12 = mat._v[1] * this._v[6] + mat._v[4] * this._v[7] + mat._v[7] * this._v[8];

    const m20 = mat._v[2] * this._v[0] + mat._v[5] * this._v[1] + mat._v[8] * this._v[2];
    const m21 = mat._v[2] * this._v[3] + mat._v[5] * this._v[4] + mat._v[8] * this._v[5];
    const m22 = mat._v[2] * this._v[6] + mat._v[5] * this._v[7] + mat._v[8] * this._v[8];

    return this.setComponents(
      m00, m01, m02,
      m10, m11, m12,
      m20, m21, m22
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
    return new MutableMatrix33(v);
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
    return new MutableMatrix33(v);
  }


  static fromCopyMatrix44(mat: Matrix44) {
    const v = new Float32Array(9);
    v.set(mat._v);
    return new MutableMatrix33(v);
  }

  static fromFloat32ArrayColumnMajor(float32Array: Float32Array) {
    return new MutableMatrix33(float32Array);
  }

  static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array) {
    const v = new Float32Array(9);
    v.set(float32Array);
    return new MutableMatrix33(v);
  }

  static fromCopyFloat32ArrayRowMajor(array: Float32Array) {
    const v = new Float32Array(9);
    v[0] = array[0]; v[3] = array[1]; v[6] = array[2];
    v[1] = array[3]; v[4] = array[4]; v[7] = array[5];
    v[2] = array[6]; v[5] = array[7]; v[8] = array[8];

    return new MutableMatrix33(v);
  }

  static fromCopyMatrix33(mat: IMatrix33) {
    const v = new Float32Array(9);
    v[0] = mat._v[0]; v[3] = mat._v[3]; v[6] = mat._v[6];
    v[1] = mat._v[1]; v[4] = mat._v[4]; v[7] = mat._v[7];
    v[2] = mat._v[2]; v[5] = mat._v[5]; v[8] = mat._v[8];
    return new MutableMatrix33(v);
  }

  static fromCopyArray9ColumnMajor(array: Array9<number>) {
    const v = new Float32Array(9);
    v.set(array);
    return new MutableMatrix33(v);
  }

  static fromCopyArrayColumnMajor(array: Array<number>) {
    const v = new Float32Array(9);
    v.set(array);
    return new MutableMatrix33(v);
  }

  static fromCopyArray9RowMajor(array: Array9<number>) {
    const v = new Float32Array(9);
    v[0] = array[0]; v[3] = array[1]; v[6] = array[2];
    v[1] = array[3]; v[4] = array[4]; v[7] = array[5];
    v[2] = array[6]; v[5] = array[7]; v[8] = array[8];
    return new MutableMatrix33(v);
  }

  static fromCopyArrayRowMajor(array: Array<number>) {
    const v = new Float32Array(9);
    v[0] = array[0]; v[3] = array[1]; v[6] = array[2];
    v[1] = array[3]; v[4] = array[4]; v[7] = array[5];
    v[2] = array[6]; v[5] = array[7]; v[8] = array[8];
    return new MutableMatrix33(v);
  }

  static fromCopyQuaternion(q: Quaternion) {
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

    return new MutableMatrix33(v);
  }
}
