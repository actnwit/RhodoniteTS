import type { Array16, Index } from '../../types/CommonTypes';
import { Logger } from '../misc/Logger';
import type { IMatrix33, IMatrix44, IMutableMatrix, IMutableMatrix44 } from './IMatrix';
import type { IQuaternion } from './IQuaternion';
import { Matrix44 } from './Matrix44';
import type { MutableVector3 } from './MutableVector3';
import type { Quaternion } from './Quaternion';
import type { Vector3 } from './Vector3';

/**
 * A mutable 4x4 matrix class that extends the immutable Matrix44 class.
 *
 * This class provides a mutable interface for 4x4 matrix operations commonly used
 * in 3D graphics, including transformations, rotations, scaling, and projections.
 * The matrix is stored in column-major order internally, which is compatible with WebGL.
 *
 * @example
 * ```typescript
 * const matrix = MutableMatrix44.identity();
 * matrix.translate(Vector3.fromCopy(1, 2, 3));
 * matrix.rotateY(Math.PI / 4);
 * ```
 */
export class MutableMatrix44 extends Matrix44 implements IMutableMatrix, IMutableMatrix44 {
  /**
   * Sets the value at position (0,0) in the matrix.
   *
   * @param val - The value to set
   */
  public set m00(val) {
    this._v[0] = val;
  }

  /**
   * Gets the value at position (0,0) in the matrix.
   *
   * @returns The value at position (0,0)
   */
  public get m00() {
    return this._v[0];
  }

  /**
   * Sets the value at position (1,0) in the matrix.
   *
   * @param val - The value to set
   */
  public set m10(val) {
    this._v[1] = val;
  }

  /**
   * Gets the value at position (1,0) in the matrix.
   *
   * @returns The value at position (1,0)
   */
  public get m10() {
    return this._v[1];
  }

  /**
   * Sets the value at position (2,0) in the matrix.
   *
   * @param val - The value to set
   */
  public set m20(val) {
    this._v[2] = val;
  }

  /**
   * Gets the value at position (2,0) in the matrix.
   *
   * @returns The value at position (2,0)
   */
  public get m20() {
    return this._v[2];
  }

  /**
   * Sets the value at position (3,0) in the matrix.
   *
   * @param val - The value to set
   */
  public set m30(val) {
    this._v[3] = val;
  }

  /**
   * Gets the value at position (3,0) in the matrix.
   *
   * @returns The value at position (3,0)
   */
  public get m30() {
    return this._v[3];
  }

  /**
   * Sets the value at position (0,1) in the matrix.
   *
   * @param val - The value to set
   */
  public set m01(val) {
    this._v[4] = val;
  }

  /**
   * Gets the value at position (0,1) in the matrix.
   *
   * @returns The value at position (0,1)
   */
  public get m01() {
    return this._v[4];
  }

  /**
   * Sets the value at position (1,1) in the matrix.
   *
   * @param val - The value to set
   */
  public set m11(val) {
    this._v[5] = val;
  }

  /**
   * Gets the value at position (1,1) in the matrix.
   *
   * @returns The value at position (1,1)
   */
  public get m11() {
    return this._v[5];
  }

  /**
   * Sets the value at position (2,1) in the matrix.
   *
   * @param val - The value to set
   */
  public set m21(val) {
    this._v[6] = val;
  }

  /**
   * Gets the value at position (2,1) in the matrix.
   *
   * @returns The value at position (2,1)
   */
  public get m21() {
    return this._v[6];
  }

  /**
   * Sets the value at position (3,1) in the matrix.
   *
   * @param val - The value to set
   */
  public set m31(val) {
    this._v[7] = val;
  }

  /**
   * Gets the value at position (3,1) in the matrix.
   *
   * @returns The value at position (3,1)
   */
  public get m31() {
    return this._v[7];
  }

  /**
   * Sets the value at position (0,2) in the matrix.
   *
   * @param val - The value to set
   */
  public set m02(val) {
    this._v[8] = val;
  }

  /**
   * Gets the value at position (0,2) in the matrix.
   *
   * @returns The value at position (0,2)
   */
  public get m02() {
    return this._v[8];
  }

  /**
   * Sets the value at position (1,2) in the matrix.
   *
   * @param val - The value to set
   */
  public set m12(val) {
    this._v[9] = val;
  }

  /**
   * Gets the value at position (1,2) in the matrix.
   *
   * @returns The value at position (1,2)
   */
  public get m12() {
    return this._v[9];
  }

  /**
   * Sets the value at position (2,2) in the matrix.
   *
   * @param val - The value to set
   */
  public set m22(val) {
    this._v[10] = val;
  }

  /**
   * Gets the value at position (2,2) in the matrix.
   *
   * @returns The value at position (2,2)
   */
  public get m22() {
    return this._v[10];
  }

  /**
   * Sets the value at position (3,2) in the matrix.
   *
   * @param val - The value to set
   */
  public set m32(val) {
    this._v[11] = val;
  }

  /**
   * Gets the value at position (3,2) in the matrix.
   *
   * @returns The value at position (3,2)
   */
  public get m32() {
    return this._v[11];
  }

  /**
   * Sets the value at position (0,3) in the matrix.
   *
   * @param val - The value to set
   */
  public set m03(val) {
    this._v[12] = val;
  }

  /**
   * Gets the value at position (0,3) in the matrix.
   *
   * @returns The value at position (0,3)
   */
  public get m03() {
    return this._v[12];
  }

  /**
   * Sets the value at position (1,3) in the matrix.
   *
   * @param val - The value to set
   */
  public set m13(val) {
    this._v[13] = val;
  }

  /**
   * Gets the value at position (1,3) in the matrix.
   *
   * @returns The value at position (1,3)
   */
  public get m13() {
    return this._v[13];
  }

  /**
   * Sets the value at position (2,3) in the matrix.
   *
   * @param val - The value to set
   */
  public set m23(val) {
    this._v[14] = val;
  }

  /**
   * Gets the value at position (2,3) in the matrix.
   *
   * @returns The value at position (2,3)
   */
  public get m23() {
    return this._v[14];
  }

  /**
   * Sets the value at position (3,3) in the matrix.
   *
   * @param val - The value to set
   */
  public set m33(val) {
    this._v[15] = val;
  }

  /**
   * Gets the value at position (3,3) in the matrix.
   *
   * @returns The value at position (3,3)
   */
  public get m33() {
    return this._v[15];
  }

  /**
   * Gets the X translation component from the matrix.
   *
   * @returns The X translation value
   */
  public get translateX() {
    return this._v[12];
  }

  /**
   * Sets the X translation component in the matrix.
   *
   * @param val - The X translation value to set
   */
  public set translateX(val: number) {
    this._v[12] = val;
  }

  /**
   * Gets the Y translation component from the matrix.
   *
   * @returns The Y translation value
   */
  public get translateY() {
    return this._v[13];
  }

  /**
   * Sets the Y translation component in the matrix.
   *
   * @param val - The Y translation value to set
   */
  public set translateY(val: number) {
    this._v[13] = val;
  }

  /**
   * Gets the Z translation component from the matrix.
   *
   * @returns The Z translation value
   */
  public get translateZ() {
    return this._v[14];
  }

  /**
   * Sets the Z translation component in the matrix.
   *
   * @param val - The Z translation value to set
   */
  public set translateZ(val: number) {
    this._v[14] = val;
  }

  /**
   * Gets the class name identifier for this matrix type.
   *
   * @returns The string 'MutableMatrix44'
   */
  get className() {
    return 'MutableMatrix44';
  }

  /**
   * Creates a zero matrix (all elements are 0).
   *
   * @returns A new MutableMatrix44 instance with all elements set to 0
   */
  static zero() {
    return MutableMatrix44.fromCopy16RowMajor(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }

  /**
   * Creates an identity matrix.
   *
   * @returns A new MutableMatrix44 instance representing the 4x4 identity matrix
   */
  static identity() {
    return MutableMatrix44.fromCopy16RowMajor(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  }

  /**
   * Creates a dummy matrix (typically used as a placeholder).
   *
   * @returns A new MutableMatrix44 instance representing a dummy matrix
   */
  static dummy(): MutableMatrix44 {
    return super.dummy() as MutableMatrix44;
  }

  /**
   * Creates a transposed matrix from the given matrix.
   *
   * @param mat - The matrix to transpose
   * @returns A new MutableMatrix44 instance that is the transpose of the input matrix
   */
  static transpose(mat: IMatrix44): MutableMatrix44 {
    return MutableMatrix44.fromCopyFloat32ArrayRowMajor(mat._v);
  }

  /**
   * Creates an inverted matrix from the given matrix.
   *
   * @param mat - The matrix to invert
   * @returns A new MutableMatrix44 instance that is the inverse of the input matrix
   */
  static invert(mat: Matrix44) {
    return super.invert(mat) as MutableMatrix44;
  }

  /**
   * Creates a translation matrix from the given vector.
   *
   * @param vec - The translation vector
   * @returns A new MutableMatrix44 instance representing the translation transformation
   */
  static translate(vec: Vector3) {
    return super.translate(vec) as MutableMatrix44;
  }

  /**
   * Creates a rotation matrix around the X-axis.
   *
   * @param radian - The rotation angle in radians
   * @returns A new MutableMatrix44 instance representing the X-axis rotation
   */
  static rotateX(radian: number) {
    return super.rotateX(radian) as MutableMatrix44;
  }

  /**
   * Creates a rotation matrix around the Y-axis.
   *
   * @param radian - The rotation angle in radians
   * @returns A new MutableMatrix44 instance representing the Y-axis rotation
   */
  static rotateY(radian: number) {
    return super.rotateY(radian) as MutableMatrix44;
  }

  /**
   * Creates a rotation matrix around the Z-axis.
   *
   * @param radian - The rotation angle in radians
   * @returns A new MutableMatrix44 instance representing the Z-axis rotation
   */
  static rotateZ(radian: number) {
    return super.rotateZ(radian) as MutableMatrix44;
  }

  /**
   * Creates a rotation matrix with rotations around X, Y, and Z axes in that order.
   *
   * @param x - Rotation angle around X-axis in radians
   * @param y - Rotation angle around Y-axis in radians
   * @param z - Rotation angle around Z-axis in radians
   * @returns A new MutableMatrix44 instance representing the combined rotation
   */
  static rotateXYZ(x: number, y: number, z: number) {
    return super.rotateXYZ(x, y, z) as MutableMatrix44;
  }

  /**
   * Creates a rotation matrix from a vector containing X, Y, Z rotation angles.
   *
   * @param vec - Vector containing rotation angles (x, y, z) in radians
   * @returns A new MutableMatrix44 instance representing the rotation transformation
   */
  static rotate(vec: Vector3) {
    return super.rotateXYZ(vec._v[0], vec._v[1], vec._v[2]) as MutableMatrix44;
  }

  /**
   * Creates a scaling matrix from the given vector.
   *
   * @param vec - The scaling factors for X, Y, and Z axes
   * @returns A new MutableMatrix44 instance representing the scaling transformation
   */
  static scale(vec: Vector3) {
    return super.scale(vec) as MutableMatrix44;
  }

  /**
   * Multiplies two matrices and returns the result as a new matrix.
   *
   * @param l_mat - The left matrix in the multiplication
   * @param r_mat - The right matrix in the multiplication
   * @returns A new MutableMatrix44 instance representing the product l_mat * r_mat
   */
  static multiply(l_mat: Matrix44, r_mat: Matrix44) {
    return super.multiply(l_mat, r_mat) as MutableMatrix44;
  }

  /**
   * Creates a copy of this matrix.
   *
   * @returns A new MutableMatrix44 instance with the same values as this matrix
   */
  clone() {
    const result = super.clone() as MutableMatrix44;
    return result;
  }

  /**
   * Extracts the rotation part of this matrix.
   *
   * @returns A new MutableMatrix44 instance containing only the rotation transformation
   */
  getRotate() {
    const rotateMat = super.getRotate() as MutableMatrix44;
    return rotateMat;
  }

  /**
   * Extracts the translation part of this matrix.
   *
   * @returns A new MutableVector3 instance containing the translation values
   */
  getTranslate() {
    const rotateMat = super.getTranslate() as MutableVector3;
    return rotateMat;
  }

  /**
   * Extracts the translation part of this matrix into the provided vector.
   *
   * @param outVec - The vector to store the translation values
   * @returns The output vector with translation values
   */
  getTranslateTo(outVec: MutableVector3) {
    const rotateMat = super.getTranslateTo(outVec) as MutableVector3;
    return rotateMat;
  }

  /**
   * Extracts the scale part of this matrix.
   *
   * @returns A new MutableVector3 instance containing the scale values for each axis
   */
  getScale() {
    const rotateMat = super.getScale() as MutableVector3;
    return rotateMat;
  }

  /**
   * Gets the raw Float32Array containing the matrix data.
   *
   * @returns The internal Float32Array with matrix values in column-major order
   */
  raw() {
    return this._v;
  }

  /**
   * Sets a value at the specified row and column position.
   *
   * @param row_i - The row index (0-3)
   * @param column_i - The column index (0-3)
   * @param value - The value to set
   * @returns This matrix instance for method chaining
   */
  setAt(row_i: number, column_i: number, value: number) {
    this._v[row_i + column_i * 4] = value;
    return this;
  }

  /**
   * Sets all 16 components of the matrix with individual values.
   * Values are specified in row-major order but stored internally in column-major order.
   *
   * @param m00 - Element at row 0, column 0
   * @param m01 - Element at row 0, column 1
   * @param m02 - Element at row 0, column 2
   * @param m03 - Element at row 0, column 3
   * @param m10 - Element at row 1, column 0
   * @param m11 - Element at row 1, column 1
   * @param m12 - Element at row 1, column 2
   * @param m13 - Element at row 1, column 3
   * @param m20 - Element at row 2, column 0
   * @param m21 - Element at row 2, column 1
   * @param m22 - Element at row 2, column 2
   * @param m23 - Element at row 2, column 3
   * @param m30 - Element at row 3, column 0
   * @param m31 - Element at row 3, column 1
   * @param m32 - Element at row 3, column 2
   * @param m33 - Element at row 3, column 3
   * @returns This matrix instance for method chaining
   */
  setComponents(
    m00: number,
    m01: number,
    m02: number,
    m03: number,
    m10: number,
    m11: number,
    m12: number,
    m13: number,
    m20: number,
    m21: number,
    m22: number,
    m23: number,
    m30: number,
    m31: number,
    m32: number,
    m33: number
  ) {
    this._v[0] = m00;
    this._v[4] = m01;
    this._v[8] = m02;
    this._v[12] = m03;
    this._v[1] = m10;
    this._v[5] = m11;
    this._v[9] = m12;
    this._v[13] = m13;
    this._v[2] = m20;
    this._v[6] = m21;
    this._v[10] = m22;
    this._v[14] = m23;
    this._v[3] = m30;
    this._v[7] = m31;
    this._v[11] = m32;
    this._v[15] = m33;

    return this;
  }

  /**
   * Copies all components from another matrix to this matrix.
   *
   * @param mat - The source matrix to copy from
   * @returns This matrix instance for method chaining
   */
  copyComponents(mat: IMatrix44) {
    this._v[0] = mat._v[0];
    this._v[4] = mat._v[4];
    this._v[8] = mat._v[8];
    this._v[12] = mat._v[12];
    this._v[1] = mat._v[1];
    this._v[5] = mat._v[5];
    this._v[9] = mat._v[9];
    this._v[13] = mat._v[13];
    this._v[2] = mat._v[2];
    this._v[6] = mat._v[6];
    this._v[10] = mat._v[10];
    this._v[14] = mat._v[14];
    this._v[3] = mat._v[3];
    this._v[7] = mat._v[7];
    this._v[11] = mat._v[11];
    this._v[15] = mat._v[15];

    return this;
  }

  /**
   * Sets this matrix to the zero matrix (all elements are 0).
   *
   * @returns This matrix instance for method chaining
   */
  zero() {
    return this.setComponents(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }

  /**
   * Sets this matrix to the identity matrix.
   *
   * @returns This matrix instance for method chaining
   */
  identity() {
    return this.setComponents(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  }

  _swap(l: Index, r: Index) {
    const temp = this._v[l];
    this._v[l] = this._v[r];
    this._v[r] = temp;
  }

  /**
   * Transposes this matrix in place (swaps rows and columns).
   *
   * @returns This matrix instance for method chaining
   */
  transpose() {
    this._swap(1, 4);
    this._swap(2, 8);
    this._swap(3, 12);
    this._swap(6, 9);
    this._swap(7, 13);
    this._swap(11, 14);

    return this;
  }

  /**
   * Inverts this matrix in place.
   * The matrix must be invertible (determinant != 0), otherwise an error is logged.
   *
   * @returns This matrix instance for method chaining
   */
  invert() {
    const n00 = this._v[0] * this._v[5] - this._v[4] * this._v[1];
    const n01 = this._v[0] * this._v[9] - this._v[8] * this._v[1];
    const n02 = this._v[0] * this._v[13] - this._v[12] * this._v[1];
    const n03 = this._v[4] * this._v[9] - this._v[8] * this._v[5];
    const n04 = this._v[4] * this._v[13] - this._v[12] * this._v[5];
    const n05 = this._v[8] * this._v[13] - this._v[12] * this._v[9];
    const n06 = this._v[2] * this._v[7] - this._v[6] * this._v[3];
    const n07 = this._v[2] * this._v[11] - this._v[10] * this._v[3];
    const n08 = this._v[2] * this._v[15] - this._v[14] * this._v[3];
    const n09 = this._v[6] * this._v[11] - this._v[10] * this._v[7];
    const n10 = this._v[6] * this._v[15] - this._v[14] * this._v[7];
    const n11 = this._v[10] * this._v[15] - this._v[14] * this._v[11];

    const det = n00 * n11 - n01 * n10 + n02 * n09 + n03 * n08 - n04 * n07 + n05 * n06;
    if (det === 0) {
      Logger.error('the determinant is 0!');
    }

    const m00 = (this._v[5] * n11 - this._v[9] * n10 + this._v[13] * n09) / det;
    const m01 = (this._v[8] * n10 - this._v[4] * n11 - this._v[12] * n09) / det;
    const m02 = (this._v[7] * n05 - this._v[11] * n04 + this._v[15] * n03) / det;
    const m03 = (this._v[10] * n04 - this._v[6] * n05 - this._v[14] * n03) / det;
    const m10 = (this._v[9] * n08 - this._v[1] * n11 - this._v[13] * n07) / det;
    const m11 = (this._v[0] * n11 - this._v[8] * n08 + this._v[12] * n07) / det;
    const m12 = (this._v[11] * n02 - this._v[3] * n05 - this._v[15] * n01) / det;
    const m13 = (this._v[2] * n05 - this._v[10] * n02 + this._v[14] * n01) / det;
    const m20 = (this._v[1] * n10 - this._v[5] * n08 + this._v[13] * n06) / det;
    const m21 = (this._v[4] * n08 - this._v[0] * n10 - this._v[12] * n06) / det;
    const m22 = (this._v[3] * n04 - this._v[7] * n02 + this._v[15] * n00) / det;
    const m23 = (this._v[6] * n02 - this._v[2] * n04 - this._v[14] * n00) / det;
    const m30 = (this._v[5] * n07 - this._v[1] * n09 - this._v[9] * n06) / det;
    const m31 = (this._v[0] * n09 - this._v[4] * n07 + this._v[8] * n06) / det;
    const m32 = (this._v[7] * n01 - this._v[3] * n03 - this._v[11] * n00) / det;
    const m33 = (this._v[2] * n03 - this._v[6] * n01 + this._v[10] * n00) / det;

    return this.setComponents(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
  }

  /**
   * Sets this matrix to a translation matrix with the given vector.
   *
   * @param vec - The translation vector
   * @returns This matrix instance for method chaining
   */
  translate(vec: Vector3) {
    return this.setComponents(1, 0, 0, vec._v[0], 0, 1, 0, vec._v[1], 0, 0, 1, vec._v[2], 0, 0, 0, 1);
  }

  /**
   * Sets the translation component of this matrix without affecting other components.
   *
   * @param vec - The translation vector to set
   * @returns This matrix instance for method chaining
   */
  putTranslate(vec: Vector3) {
    this._v[12] = vec._v[0];
    this._v[13] = vec._v[1];
    this._v[14] = vec._v[2];
    return this;
  }

  /**
   * Adds the given vector to the current translation component.
   *
   * @param vec - The translation vector to add
   * @returns This matrix instance for method chaining
   */
  addTranslate(vec: Vector3) {
    this._v[12] += vec._v[0];
    this._v[13] += vec._v[1];
    this._v[14] += vec._v[2];
    return this;
  }

  /**
   * Sets this matrix to a rotation matrix around the X-axis.
   *
   * @param radian - The rotation angle in radians
   * @returns This matrix instance for method chaining
   */
  rotateX(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this.setComponents(1, 0, 0, 0, 0, cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1);
  }

  /**
   * Sets this matrix to a rotation matrix around the Y-axis.
   *
   * @param radian - The rotation angle in radians
   * @returns This matrix instance for method chaining
   */
  rotateY(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this.setComponents(cos, 0, sin, 0, 0, 1, 0, 0, -sin, 0, cos, 0, 0, 0, 0, 1);
  }

  /**
   * Sets this matrix to a rotation matrix around the Z-axis.
   *
   * @param radian - The rotation angle in radians
   * @returns This matrix instance for method chaining
   */
  rotateZ(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this.setComponents(cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  }

  /**
   * Sets this matrix to a rotation matrix with rotations around X, Y, and Z axes in that order.
   * The rotation order is: Z * Y * X (applied from right to left).
   *
   * @param x - Rotation angle around X-axis in radians
   * @param y - Rotation angle around Y-axis in radians
   * @param z - Rotation angle around Z-axis in radians
   * @returns This matrix instance for method chaining
   */
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

    // Y * X
    const yx00 = y00;
    const yx01 = y02 * x21;
    const yx02 = y02 * x22;
    //const yx10 = 0;
    const yx11 = x11;
    const yx12 = x12;
    const yx20 = y20;
    const yx21 = y22 * x21;
    const yx22 = y22 * x22;

    // Z * Y * X
    const m00 = z00 * yx00;
    const m01 = z00 * yx01 + z01 * yx11;
    const m02 = z00 * yx02 + z01 * yx12;
    const m10 = z10 * yx00;
    const m11 = z10 * yx01 + z11 * yx11;
    const m12 = z10 * yx02 + z11 * yx12;
    const m20 = yx20;
    const m21 = yx21;
    const m22 = yx22;

    const m03 = 0;
    const m13 = 0;
    const m23 = 0;
    const m30 = 0;
    const m31 = 0;
    const m32 = 0;
    const m33 = 1;

    return this.setComponents(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
  }

  /**
   * Sets this matrix to a rotation matrix from a vector containing X, Y, Z rotation angles.
   *
   * @param vec - Vector containing rotation angles (x, y, z) in radians
   * @returns This matrix instance for method chaining
   */
  rotate(vec: Vector3) {
    return this.rotateXYZ(vec._v[0], vec._v[1], vec._v[2]);
  }

  /**
   * Sets this matrix to a scaling matrix with the given vector.
   *
   * @param vec - The scaling factors for X, Y, and Z axes
   * @returns This matrix instance for method chaining
   */
  scale(vec: Vector3) {
    return this.setComponents(vec._v[0], 0, 0, 0, 0, vec._v[1], 0, 0, 0, 0, vec._v[2], 0, 0, 0, 0, 1);
  }

  /**
   * Multiplies the scaling factors to the current matrix.
   * This applies scaling transformation to each column of the matrix.
   *
   * @param vec - The scaling factors for X, Y, and Z axes
   * @returns This matrix instance for method chaining
   */
  multiplyScale(vec: Vector3) {
    this._v[0] *= vec._v[0];
    this._v[4] *= vec._v[0];
    this._v[8] *= vec._v[0];
    this._v[12] *= vec._v[0];

    this._v[1] *= vec._v[1];
    this._v[5] *= vec._v[1];
    this._v[9] *= vec._v[1];
    this._v[13] *= vec._v[1];

    this._v[2] *= vec._v[2];
    this._v[6] *= vec._v[2];
    this._v[10] *= vec._v[2];
    this._v[14] *= vec._v[2];

    return this;
  }

  /**
   * Multiplies this matrix by another matrix from the right side (this * mat).
   * This operation transforms this matrix in place.
   *
   * @param mat - The matrix to multiply from the right
   * @returns This matrix instance for method chaining
   */
  multiply(mat: IMatrix44): MutableMatrix44 {
    if (mat.isIdentityMatrixClass) {
      return this;
    }
    const m00 = this._v[0] * mat._v[0] + this._v[4] * mat._v[1] + this._v[8] * mat._v[2] + this._v[12] * mat._v[3];
    const m01 = this._v[0] * mat._v[4] + this._v[4] * mat._v[5] + this._v[8] * mat._v[6] + this._v[12] * mat._v[7];
    const m02 = this._v[0] * mat._v[8] + this._v[4] * mat._v[9] + this._v[8] * mat._v[10] + this._v[12] * mat._v[11];
    const m03 = this._v[0] * mat._v[12] + this._v[4] * mat._v[13] + this._v[8] * mat._v[14] + this._v[12] * mat._v[15];

    const m10 = this._v[1] * mat._v[0] + this._v[5] * mat._v[1] + this._v[9] * mat._v[2] + this._v[13] * mat._v[3];
    const m11 = this._v[1] * mat._v[4] + this._v[5] * mat._v[5] + this._v[9] * mat._v[6] + this._v[13] * mat._v[7];
    const m12 = this._v[1] * mat._v[8] + this._v[5] * mat._v[9] + this._v[9] * mat._v[10] + this._v[13] * mat._v[11];
    const m13 = this._v[1] * mat._v[12] + this._v[5] * mat._v[13] + this._v[9] * mat._v[14] + this._v[13] * mat._v[15];

    const m20 = this._v[2] * mat._v[0] + this._v[6] * mat._v[1] + this._v[10] * mat._v[2] + this._v[14] * mat._v[3];
    const m21 = this._v[2] * mat._v[4] + this._v[6] * mat._v[5] + this._v[10] * mat._v[6] + this._v[14] * mat._v[7];
    const m22 = this._v[2] * mat._v[8] + this._v[6] * mat._v[9] + this._v[10] * mat._v[10] + this._v[14] * mat._v[11];
    const m23 = this._v[2] * mat._v[12] + this._v[6] * mat._v[13] + this._v[10] * mat._v[14] + this._v[14] * mat._v[15];

    const m30 = this._v[3] * mat._v[0] + this._v[7] * mat._v[1] + this._v[11] * mat._v[2] + this._v[15] * mat._v[3];
    const m31 = this._v[3] * mat._v[4] + this._v[7] * mat._v[5] + this._v[11] * mat._v[6] + this._v[15] * mat._v[7];
    const m32 = this._v[3] * mat._v[8] + this._v[7] * mat._v[9] + this._v[11] * mat._v[10] + this._v[15] * mat._v[11];
    const m33 = this._v[3] * mat._v[12] + this._v[7] * mat._v[13] + this._v[11] * mat._v[14] + this._v[15] * mat._v[15];

    return this.setComponents(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
  }

  /**
   * Multiplies this matrix by another matrix from the left side (mat * this).
   * This operation transforms this matrix in place.
   *
   * @param mat - The matrix to multiply from the left
   * @returns This matrix instance for method chaining
   */
  multiplyByLeft(mat: IMatrix44): MutableMatrix44 {
    if (mat.isIdentityMatrixClass) {
      return this;
    }
    const m00 = mat._v[0] * this._v[0] + mat._v[4] * this._v[1] + mat._v[8] * this._v[2] + mat._v[12] * this._v[3];
    const m01 = mat._v[0] * this._v[4] + mat._v[4] * this._v[5] + mat._v[8] * this._v[6] + mat._v[12] * this._v[7];
    const m02 = mat._v[0] * this._v[8] + mat._v[4] * this._v[9] + mat._v[8] * this._v[10] + mat._v[12] * this._v[11];
    const m03 = mat._v[0] * this._v[12] + mat._v[4] * this._v[13] + mat._v[8] * this._v[14] + mat._v[12] * this._v[15];

    const m10 = mat._v[1] * this._v[0] + mat._v[5] * this._v[1] + mat._v[9] * this._v[2] + mat._v[13] * this._v[3];
    const m11 = mat._v[1] * this._v[4] + mat._v[5] * this._v[5] + mat._v[9] * this._v[6] + mat._v[13] * this._v[7];
    const m12 = mat._v[1] * this._v[8] + mat._v[5] * this._v[9] + mat._v[9] * this._v[10] + mat._v[13] * this._v[11];
    const m13 = mat._v[1] * this._v[12] + mat._v[5] * this._v[13] + mat._v[9] * this._v[14] + mat._v[13] * this._v[15];

    const m20 = mat._v[2] * this._v[0] + mat._v[6] * this._v[1] + mat._v[10] * this._v[2] + mat._v[14] * this._v[3];
    const m21 = mat._v[2] * this._v[4] + mat._v[6] * this._v[5] + mat._v[10] * this._v[6] + mat._v[14] * this._v[7];
    const m22 = mat._v[2] * this._v[8] + mat._v[6] * this._v[9] + mat._v[10] * this._v[10] + mat._v[14] * this._v[11];
    const m23 = mat._v[2] * this._v[12] + mat._v[6] * this._v[13] + mat._v[10] * this._v[14] + mat._v[14] * this._v[15];

    const m30 = mat._v[3] * this._v[0] + mat._v[7] * this._v[1] + mat._v[11] * this._v[2] + mat._v[15] * this._v[3];
    const m31 = mat._v[3] * this._v[4] + mat._v[7] * this._v[5] + mat._v[11] * this._v[6] + mat._v[15] * this._v[7];
    const m32 = mat._v[3] * this._v[8] + mat._v[7] * this._v[9] + mat._v[11] * this._v[10] + mat._v[15] * this._v[11];
    const m33 = mat._v[3] * this._v[12] + mat._v[7] * this._v[13] + mat._v[11] * this._v[14] + mat._v[15] * this._v[15];

    return this.setComponents(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
  }

  /**
   * Sets this matrix to a rotation matrix based on the given quaternion.
   *
   * @param quat - The quaternion to convert to a rotation matrix
   * @returns This matrix instance for method chaining
   */
  fromQuaternion(quat: IQuaternion) {
    const sx = quat._v[0] * quat._v[0];
    const sy = quat._v[1] * quat._v[1];
    const sz = quat._v[2] * quat._v[2];
    const cx = quat._v[1] * quat._v[2];
    const cy = quat._v[0] * quat._v[2];
    const cz = quat._v[0] * quat._v[1];
    const wx = quat._v[3] * quat._v[0];
    const wy = quat._v[3] * quat._v[1];
    const wz = quat._v[3] * quat._v[2];

    const m00 = 1.0 - 2.0 * (sy + sz);
    const m01 = 2.0 * (cz - wz);
    const m02 = 2.0 * (cy + wy);
    const m03 = 0;
    const m10 = 2.0 * (cz + wz);
    const m11 = 1.0 - 2.0 * (sx + sz);
    const m12 = 2.0 * (cx - wx);
    const m13 = 0;
    const m20 = 2.0 * (cy - wy);
    const m21 = 2.0 * (cx + wx);
    const m22 = 1.0 - 2.0 * (sx + sy);
    const m23 = 0;
    const m30 = 0;
    const m31 = 0;
    const m32 = 0;
    const m33 = 1;

    return this.setComponents(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
  }

  /**
   * Creates a matrix from 16 values in row-major order.
   * Values are provided in row-major order but stored internally in column-major order.
   *
   * @param m00-m33 - Matrix elements in row-major order
   * @returns A new MutableMatrix44 instance
   */
  static fromCopy16RowMajor(
    m00: number,
    m01: number,
    m02: number,
    m03: number,
    m10: number,
    m11: number,
    m12: number,
    m13: number,
    m20: number,
    m21: number,
    m22: number,
    m23: number,
    m30: number,
    m31: number,
    m32: number,
    m33: number
  ) {
    const v = new Float32Array(16);
    v[0] = m00;
    v[4] = m01;
    v[8] = m02;
    v[12] = m03;
    v[1] = m10;
    v[5] = m11;
    v[9] = m12;
    v[13] = m13;
    v[2] = m20;
    v[6] = m21;
    v[10] = m22;
    v[14] = m23;
    v[3] = m30;
    v[7] = m31;
    v[11] = m32;
    v[15] = m33;
    return new MutableMatrix44(v);
  }

  /**
   * Creates a matrix from 16 values in column-major order.
   *
   * @param m00-m33 - Matrix elements in column-major order
   * @returns A new MutableMatrix44 instance
   */
  static fromCopy16ColumnMajor(
    m00: number,
    m10: number,
    m20: number,
    m30: number,
    m01: number,
    m11: number,
    m21: number,
    m31: number,
    m02: number,
    m12: number,
    m22: number,
    m32: number,
    m03: number,
    m13: number,
    m23: number,
    m33: number
  ) {
    const v = new Float32Array(16);
    v[0] = m00;
    v[4] = m01;
    v[8] = m02;
    v[12] = m03;
    v[1] = m10;
    v[5] = m11;
    v[9] = m12;
    v[13] = m13;
    v[2] = m20;
    v[6] = m21;
    v[10] = m22;
    v[14] = m23;
    v[3] = m30;
    v[7] = m31;
    v[11] = m32;
    v[15] = m33;
    return new MutableMatrix44(v);
  }

  /**
   * Creates a new MutableMatrix44 from an existing Matrix44 instance.
   * This creates a copy of the matrix data, so modifications to the new matrix
   * will not affect the original.
   *
   * @param mat - The source Matrix44 to copy from
   * @returns A new MutableMatrix44 instance with copied data
   */
  static fromCopyMatrix44(mat: IMatrix44) {
    const v = new Float32Array(16);
    v.set(mat._v);
    return new MutableMatrix44(v);
  }

  /**
   * Creates a new MutableMatrix44 directly from a Float32Array in column-major order.
   * This method does not copy the array, so the matrix will share the same memory
   * as the input array.
   *
   * @param float32Array - A Float32Array containing 16 elements in column-major order
   * @returns A new MutableMatrix44 instance using the provided array
   */
  static fromFloat32ArrayColumnMajor(float32Array: Float32Array) {
    return new MutableMatrix44(float32Array);
  }

  /**
   * Creates a new MutableMatrix44 from a Float32Array in column-major order.
   * This method creates a copy of the input array, so modifications to the matrix
   * will not affect the original array.
   *
   * @param float32Array - A Float32Array containing 16 elements in column-major order
   * @returns A new MutableMatrix44 instance with copied data
   */
  static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array) {
    const v = new Float32Array(16);
    v.set(float32Array);
    return new MutableMatrix44(v);
  }

  /**
   * Creates a new MutableMatrix44 from a Float32Array in row-major order.
   * The input data is converted from row-major to column-major order during creation.
   *
   * @param array - A Float32Array containing 16 elements in row-major order
   * @returns A new MutableMatrix44 instance with data converted to column-major order
   */
  static fromCopyFloat32ArrayRowMajor(array: Float32Array) {
    const v = new Float32Array(16);
    v[0] = array[0];
    v[4] = array[1];
    v[8] = array[2];
    v[12] = array[3];
    v[1] = array[4];
    v[5] = array[5];
    v[9] = array[6];
    v[13] = array[7];
    v[2] = array[8];
    v[6] = array[9];
    v[10] = array[10];
    v[14] = array[11];
    v[3] = array[12];
    v[7] = array[13];
    v[11] = array[14];
    v[15] = array[15];
    return new MutableMatrix44(v);
  }

  /**
   * Creates a new MutableMatrix44 from a 3x3 matrix.
   * The 3x3 matrix is embedded in the upper-left corner of the 4x4 matrix,
   * with the bottom row and right column set to [0, 0, 0, 1].
   *
   * @param mat - The source 3x3 matrix to convert
   * @returns A new MutableMatrix44 instance with the 3x3 matrix embedded
   */
  static fromCopyMatrix33(mat: IMatrix33) {
    const v = new Float32Array(16);
    v[0] = mat._v[0];
    v[4] = mat._v[3];
    v[8] = mat._v[6];
    v[12] = 0;
    v[1] = mat._v[1];
    v[5] = mat._v[4];
    v[9] = mat._v[7];
    v[13] = 0;
    v[2] = mat._v[2];
    v[6] = mat._v[5];
    v[10] = mat._v[8];
    v[14] = 0;
    v[3] = 0;
    v[7] = 0;
    v[11] = 0;
    v[15] = 1;
    return new MutableMatrix44(v);
  }

  /**
   * Creates a new MutableMatrix44 from an Array16 in column-major order.
   * This method copies the array data into a new Float32Array.
   *
   * @param array - An Array16 containing 16 elements in column-major order
   * @returns A new MutableMatrix44 instance with copied data
   */
  static fromCopyArray16ColumnMajor(array: Array16<number>) {
    const v = new Float32Array(16);
    v.set(array);
    return new MutableMatrix44(v);
  }

  /**
   * Creates a new MutableMatrix44 from a regular array in column-major order.
   * Only the first 16 elements are used if the array is larger.
   *
   * @param array - An array containing at least 16 elements in column-major order
   * @returns A new MutableMatrix44 instance with copied data
   */
  static fromCopyArrayColumnMajor(array: Array<number>) {
    const v = new Float32Array(16);
    v.set(array);
    return new MutableMatrix44(v);
  }

  /**
   * Creates a new MutableMatrix44 from an Array16 in row-major order.
   * The input data is converted from row-major to column-major order during creation.
   *
   * @param array - An Array16 containing 16 elements in row-major order
   * @returns A new MutableMatrix44 instance with data converted to column-major order
   */
  static fromCopyArray16RowMajor(array: Array16<number>) {
    const v = new Float32Array(16);
    v[0] = array[0];
    v[4] = array[1];
    v[8] = array[2];
    v[12] = array[3];
    v[1] = array[4];
    v[5] = array[5];
    v[9] = array[6];
    v[13] = array[7];
    v[2] = array[8];
    v[6] = array[9];
    v[10] = array[10];
    v[14] = array[11];
    v[3] = array[12];
    v[7] = array[13];
    v[11] = array[14];
    v[15] = array[15];
    return new MutableMatrix44(v);
  }

  /**
   * Creates a new MutableMatrix44 from a regular array in row-major order.
   * The input data is converted from row-major to column-major order during creation.
   * Only the first 16 elements are used if the array is larger.
   *
   * @param array - An array containing at least 16 elements in row-major order
   * @returns A new MutableMatrix44 instance with data converted to column-major order
   */
  static fromCopyArrayRowMajor(array: Array<number>) {
    const v = new Float32Array(16);
    v[0] = array[0];
    v[4] = array[1];
    v[8] = array[2];
    v[12] = array[3];
    v[1] = array[4];
    v[5] = array[5];
    v[9] = array[6];
    v[13] = array[7];
    v[2] = array[8];
    v[6] = array[9];
    v[10] = array[10];
    v[14] = array[11];
    v[3] = array[12];
    v[7] = array[13];
    v[11] = array[14];
    v[15] = array[15];
    return new MutableMatrix44(v);
  }

  /**
   * Creates a matrix from a quaternion.
   *
   * @param q - The quaternion to convert
   * @returns A new MutableMatrix44 instance representing the rotation
   */
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
    const v = new Float32Array(16);
    v[0] = 1.0 - 2.0 * (sy + sz);
    v[4] = 2.0 * (cz - wz);
    v[8] = 2.0 * (cy + wy);
    v[12] = 0;
    v[1] = 2.0 * (cz + wz);
    v[5] = 1.0 - 2.0 * (sx + sz);
    v[9] = 2.0 * (cx - wx);
    v[13] = 0;
    v[2] = 2.0 * (cy - wy);
    v[6] = 2.0 * (cx + wx);
    v[10] = 1.0 - 2.0 * (sx + sy);
    v[14] = 0;
    v[3] = 0;
    v[7] = 0;
    v[11] = 0;
    v[15] = 1;

    return new MutableMatrix44(v);
  }
}
