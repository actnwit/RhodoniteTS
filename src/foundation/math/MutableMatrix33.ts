import type { Array9, Index } from '../../types/CommonTypes';
import { Logger } from '../misc/Logger';
import type { IMatrix33, IMatrix44, IMutableMatrix, IMutableMatrix33 } from './IMatrix';
import type { IQuaternion } from './IQuaternion';
import type { IVector3 } from './IVector';
import { Matrix33 } from './Matrix33';
import type { Matrix44 } from './Matrix44';
import { Quaternion } from './Quaternion';
import type { Vector3 } from './Vector3';

/* eslint-disable prettier/prettier */

/**
 * A mutable 3x3 matrix class that extends Matrix33 and provides mutating operations.
 * This class stores matrix data in column-major order as a Float32Array.
 * All transformation methods modify the matrix in place and return the same instance for method chaining.
 *
 * Matrix layout in memory (column-major order):
 * ```
 * [m00, m10, m20, m01, m11, m21, m02, m12, m22]
 *  [0]  [1]  [2]  [3]  [4]  [5]  [6]  [7]  [8]
 * ```
 *
 * Which represents the matrix:
 * ```
 * | m00  m01  m02 |
 * | m10  m11  m12 |
 * | m20  m21  m22 |
 * ```
 */
export class MutableMatrix33 extends Matrix33 implements IMutableMatrix, IMutableMatrix33 {
  /**
   * Sets the matrix element at position (0,0).
   * @param val - The value to set
   */
  public set m00(val) {
    this._v[0] = val;
  }

  /**
   * Gets the matrix element at position (0,0).
   * @returns The value at position (0,0)
   */
  public get m00() {
    return this._v[0];
  }

  /**
   * Sets the matrix element at position (1,0).
   * @param val - The value to set
   */
  public set m10(val) {
    this._v[1] = val;
  }

  /**
   * Gets the matrix element at position (1,0).
   * @returns The value at position (1,0)
   */
  public get m10() {
    return this._v[1];
  }

  /**
   * Sets the matrix element at position (2,0).
   * @param val - The value to set
   */
  public set m20(val) {
    this._v[2] = val;
  }

  /**
   * Gets the matrix element at position (2,0).
   * @returns The value at position (2,0)
   */
  public get m20() {
    return this._v[2];
  }

  /**
   * Sets the matrix element at position (0,1).
   * @param val - The value to set
   */
  public set m01(val) {
    this._v[3] = val;
  }

  /**
   * Gets the matrix element at position (0,1).
   * @returns The value at position (0,1)
   */
  public get m01() {
    return this._v[3];
  }

  /**
   * Sets the matrix element at position (1,1).
   * @param val - The value to set
   */
  public set m11(val) {
    this._v[4] = val;
  }

  /**
   * Gets the matrix element at position (1,1).
   * @returns The value at position (1,1)
   */
  public get m11() {
    return this._v[4];
  }

  /**
   * Sets the matrix element at position (2,1).
   * @param val - The value to set
   */
  public set m21(val) {
    this._v[5] = val;
  }

  /**
   * Gets the matrix element at position (2,1).
   * @returns The value at position (2,1)
   */
  public get m21() {
    return this._v[5];
  }

  /**
   * Sets the matrix element at position (0,2).
   * @param val - The value to set
   */
  public set m02(val) {
    this._v[6] = val;
  }

  /**
   * Gets the matrix element at position (0,2).
   * @returns The value at position (0,2)
   */
  public get m02() {
    return this._v[6];
  }

  /**
   * Sets the matrix element at position (1,2).
   * @param val - The value to set
   */
  public set m12(val) {
    this._v[7] = val;
  }

  /**
   * Gets the matrix element at position (1,2).
   * @returns The value at position (1,2)
   */
  public get m12() {
    return this._v[7];
  }

  /**
   * Sets the matrix element at position (2,2).
   * @param val - The value to set
   */
  public set m22(val) {
    this._v[8] = val;
  }

  /**
   * Gets the matrix element at position (2,2).
   * @returns The value at position (2,2)
   */
  public get m22() {
    return this._v[8];
  }

  /**
   * Gets the class name for debugging purposes.
   * @returns The string 'MutableMatrix33'
   */
  get className() {
    return 'MutableMatrix33';
  }

  /**
   * Creates a new zero matrix (all elements set to 0).
   * @returns A new MutableMatrix33 instance with all elements set to 0
   */
  static zero() {
    return super.zero() as MutableMatrix33;
  }

  /**
   * Creates a new identity matrix.
   * @returns A new MutableMatrix33 instance representing the identity matrix
   */
  static identity() {
    return MutableMatrix33.fromCopy9RowMajor(1, 0, 0, 0, 1, 0, 0, 0, 1);
  }

  /**
   * Creates a dummy matrix for testing purposes.
   * @returns A new MutableMatrix33 instance with default values
   */
  static dummy() {
    return super.dummy() as MutableMatrix33;
  }

  /**
   * Creates a new matrix that is the transpose of the input matrix.
   * @param mat - The matrix to transpose
   * @returns A new MutableMatrix33 instance representing the transposed matrix
   */
  static transpose(mat: IMatrix33) {
    return super.transpose(mat) as MutableMatrix33;
  }

  /**
   * Creates a new matrix that is the inverse of the input matrix.
   * @param mat - The matrix to invert
   * @returns A new MutableMatrix33 instance representing the inverted matrix
   */
  static invert(mat: IMatrix33) {
    return super.invert(mat) as MutableMatrix33;
  }

  /**
   * Creates a rotation matrix around the X-axis.
   * @param radian - The rotation angle in radians
   * @returns A new MutableMatrix33 instance representing the X-axis rotation
   */
  static rotateX(radian: number) {
    return super.rotateX(radian) as MutableMatrix33;
  }

  /**
   * Creates a rotation matrix around the Y-axis.
   * @param radian - The rotation angle in radians
   * @returns A new MutableMatrix33 instance representing the Y-axis rotation
   */
  static rotateY(radian: number) {
    return super.rotateY(radian) as MutableMatrix33;
  }

  /**
   * Creates a rotation matrix around the Z-axis.
   * @param radian - The rotation angle in radians
   * @returns A new MutableMatrix33 instance representing the Z-axis rotation
   */
  static rotateZ(radian: number) {
    return super.rotateZ(radian) as MutableMatrix33;
  }

  /**
   * Creates a rotation matrix for combined X, Y, and Z axis rotations applied in that order.
   * @param x - Rotation angle around X-axis in radians
   * @param y - Rotation angle around Y-axis in radians
   * @param z - Rotation angle around Z-axis in radians
   * @returns A new MutableMatrix33 instance representing the combined rotation
   */
  static rotateXYZ(x: number, y: number, z: number) {
    return super.rotateXYZ(x, y, z) as MutableMatrix33;
  }

  /**
   * Creates a rotation matrix from a vector containing rotation angles.
   * @param vec - A vector containing rotation angles for X, Y, and Z axes
   * @returns A new MutableMatrix33 instance representing the rotation
   */
  static rotate(vec: IVector3) {
    return super.rotateXYZ(vec._v[0], vec._v[1], vec._v[2]) as MutableMatrix33;
  }

  /**
   * Creates a scaling matrix from a vector.
   * @param vec - A vector containing scale factors for X, Y, and Z axes
   * @returns A new MutableMatrix33 instance representing the scaling transformation
   */
  static scale(vec: IVector3) {
    return super.scale(vec) as MutableMatrix33;
  }

  /**
   * Multiplies two matrices and returns the result as a new matrix.
   * @param l_mat - The left matrix operand
   * @param r_mat - The right matrix operand
   * @returns A new MutableMatrix33 instance representing l_mat * r_mat
   */
  static multiply(l_mat: IMatrix33, r_mat: IMatrix33) {
    return super.multiply(l_mat, r_mat) as MutableMatrix33;
  }

  /**
   * Creates a copy of this matrix.
   * @returns A new MutableMatrix33 instance with the same values
   */
  clone() {
    const result = super.clone() as MutableMatrix33;
    return result;
  }

  /**
   * Gets the raw Float32Array containing the matrix data.
   * @returns The underlying Float32Array in column-major order
   */
  raw() {
    return this._v;
  }

  /**
   * Sets a value at the specified row and column position.
   * @param row_i - The row index (0-2)
   * @param column_i - The column index (0-2)
   * @param value - The value to set
   * @returns This matrix instance for method chaining
   */
  setAt(row_i: number, column_i: number, value: number) {
    this._v[row_i + column_i * 3] = value;
    return this;
  }

  /**
   * Sets all matrix components using row-major order parameters.
   * @param m00 - Element at position (0,0)
   * @param m01 - Element at position (0,1)
   * @param m02 - Element at position (0,2)
   * @param m10 - Element at position (1,0)
   * @param m11 - Element at position (1,1)
   * @param m12 - Element at position (1,2)
   * @param m20 - Element at position (2,0)
   * @param m21 - Element at position (2,1)
   * @param m22 - Element at position (2,2)
   * @returns This matrix instance for method chaining
   */
  setComponents(
    m00: number,
    m01: number,
    m02: number,
    m10: number,
    m11: number,
    m12: number,
    m20: number,
    m21: number,
    m22: number
  ): MutableMatrix33 {
    this._v[0] = m00;
    this._v[3] = m01;
    this._v[6] = m02;
    this._v[1] = m10;
    this._v[4] = m11;
    this._v[7] = m12;
    this._v[2] = m20;
    this._v[5] = m21;
    this._v[8] = m22;

    return this;
  }

  /**
   * Copies components from another matrix (3x3 or 4x4) into this matrix.
   * For 4x4 matrices, only the upper-left 3x3 portion is copied.
   * @param mat - The source matrix to copy from
   * @returns This matrix instance for method chaining
   */
  copyComponents(mat: IMatrix33 | IMatrix44) {
    this._v[0] = mat.m00;
    this._v[3] = mat.m01;
    this._v[6] = mat.m02; // mat.m01 is mat._v[3 or 4]
    this._v[1] = mat.m10;
    this._v[4] = mat.m11;
    this._v[7] = mat.m12;
    this._v[2] = mat.m20;
    this._v[5] = mat.m21;
    this._v[8] = mat.m22;

    return this;
  }

  /**
   * Sets this matrix to the zero matrix (all elements set to 0).
   * @returns This matrix instance for method chaining
   */
  zero() {
    return this.setComponents(0, 0, 0, 0, 0, 0, 0, 0, 0);
  }

  /**
   * Sets this matrix to the identity matrix.
   * @returns This matrix instance for method chaining
   */
  identity() {
    return this.setComponents(1, 0, 0, 0, 1, 0, 0, 0, 1);
  }

  /**
   * Swaps two elements in the internal array.
   * @param l - Index of the first element
   * @param r - Index of the second element
   * @private
   */
  _swap(l: Index, r: Index) {
    this._v[r] = [this._v[l], (this._v[l] = this._v[r])][0];
  }

  /**
   * Transposes this matrix in place.
   * @returns This matrix instance for method chaining
   */
  transpose() {
    this._swap(1, 3);
    this._swap(2, 6);
    this._swap(5, 8);

    return this;
  }

  /**
   * Inverts this matrix in place using the determinant method.
   * Logs an error if the determinant is 0 (matrix is not invertible).
   * @returns This matrix instance for method chaining
   */
  invert() {
    const det = this.determinant();
    if (det === 0) {
      Logger.error('the determinant is 0!');
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

    return this.setComponents(m00, m01, m02, m10, m11, m12, m20, m21, m22);
  }

  /**
   * Sets this matrix to a rotation matrix around the X-axis.
   * @param radian - The rotation angle in radians
   * @returns This matrix instance for method chaining
   */
  rotateX(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this.setComponents(1, 0, 0, 0, cos, -sin, 0, sin, cos);
  }

  /**
   * Sets this matrix to a rotation matrix around the Y-axis.
   * @param radian - The rotation angle in radians
   * @returns This matrix instance for method chaining
   */
  rotateY(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this.setComponents(cos, 0, sin, 0, 1, 0, -sin, 0, cos);
  }

  /**
   * Sets this matrix to a rotation matrix around the Z-axis.
   * @param radian - The rotation angle in radians
   * @returns This matrix instance for method chaining
   */
  rotateZ(radian: number): MutableMatrix33 {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this.setComponents(cos, -sin, 0, sin, cos, 0, 0, 0, 1);
  }

  /**
   * Sets this matrix to a rotation matrix for combined X, Y, and Z axis rotations.
   * Rotations are applied in the order: Z * Y * X (which means X is applied first, then Y, then Z).
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

    return this.setComponents(m00, m01, m02, m10, m11, m12, m20, m21, m22);
  }

  /**
   * Sets this matrix to a rotation matrix from a vector containing rotation angles.
   * @param vec - A vector containing rotation angles for X, Y, and Z axes in radians
   * @returns This matrix instance for method chaining
   */
  rotate(vec: Vector3) {
    return this.rotateXYZ(vec._v[0], vec._v[1], vec._v[2]);
  }

  /**
   * Sets this matrix to a scaling matrix.
   * @param vec - A vector containing scale factors for X, Y, and Z axes
   * @returns This matrix instance for method chaining
   */
  scale(vec: Vector3) {
    return this.setComponents(vec._v[0], 0, 0, 0, vec._v[1], 0, 0, 0, vec._v[2]);
  }

  /**
   * Multiplies this matrix by a scale matrix, applying scaling to the existing transformation.
   * Each column of the matrix is scaled by the corresponding component of the vector.
   * @param vec - A vector containing scale factors for X, Y, and Z axes
   * @returns This matrix instance for method chaining
   */
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
   * Multiplies this matrix by another matrix from the right side (this = this * mat).
   * If the input matrix is an identity matrix, no operation is performed for optimization.
   * @param mat - The matrix to multiply with from the right
   * @returns This matrix instance for method chaining
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

    return this.setComponents(m00, m01, m02, m10, m11, m12, m20, m21, m22);
  }

  /**
   * Multiplies this matrix by another matrix from the left side (this = mat * this).
   * If the input matrix is an identity matrix, no operation is performed for optimization.
   * @param mat - The matrix to multiply with from the left
   * @returns This matrix instance for method chaining
   */
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

    return this.setComponents(m00, m01, m02, m10, m11, m12, m20, m21, m22);
  }

  /**
   * Creates a new matrix from 9 values specified in row-major order.
   * This is more intuitive when writing matrix values as they appear visually.
   * @param m00 - Element at position (0,0)
   * @param m01 - Element at position (0,1)
   * @param m02 - Element at position (0,2)
   * @param m10 - Element at position (1,0)
   * @param m11 - Element at position (1,1)
   * @param m12 - Element at position (1,2)
   * @param m20 - Element at position (2,0)
   * @param m21 - Element at position (2,1)
   * @param m22 - Element at position (2,2)
   * @returns A new MutableMatrix33 instance
   */
  static fromCopy9RowMajor(
    m00: number,
    m01: number,
    m02: number,
    m10: number,
    m11: number,
    m12: number,
    m20: number,
    m21: number,
    m22: number
  ) {
    const v = new Float32Array(9);
    v[0] = m00;
    v[3] = m01;
    v[6] = m02;
    v[1] = m10;
    v[4] = m11;
    v[7] = m12;
    v[2] = m20;
    v[5] = m21;
    v[8] = m22;
    return new MutableMatrix33(v);
  }

  /**
   * Creates a new matrix from 9 values specified in column-major order.
   * This matches the internal storage format of WebGL matrices.
   * @param m00 - Element at position (0,0)
   * @param m10 - Element at position (1,0)
   * @param m20 - Element at position (2,0)
   * @param m01 - Element at position (0,1)
   * @param m11 - Element at position (1,1)
   * @param m21 - Element at position (2,1)
   * @param m02 - Element at position (0,2)
   * @param m12 - Element at position (1,2)
   * @param m22 - Element at position (2,2)
   * @returns A new MutableMatrix33 instance
   */
  static fromCopy9ColumnMajor(
    m00: number,
    m10: number,
    m20: number,
    m01: number,
    m11: number,
    m21: number,
    m02: number,
    m12: number,
    m22: number
  ) {
    const v = new Float32Array(9);
    v[0] = m00;
    v[3] = m01;
    v[6] = m02;
    v[1] = m10;
    v[4] = m11;
    v[7] = m12;
    v[2] = m20;
    v[5] = m21;
    v[8] = m22;
    return new MutableMatrix33(v);
  }

  /**
   * Creates a new 3x3 matrix by copying the upper-left 3x3 portion of a 4x4 matrix.
   * @param mat - The 4x4 matrix to copy from
   * @returns A new MutableMatrix33 instance
   */
  static fromCopyMatrix44(mat: Matrix44) {
    const v = new Float32Array(9);
    v.set(mat._v);
    return new MutableMatrix33(v);
  }

  /**
   * Creates a new matrix using the provided Float32Array directly (no copy).
   * The array should contain 9 elements in column-major order.
   * @param float32Array - A Float32Array containing the matrix data
   * @returns A new MutableMatrix33 instance that shares the array reference
   */
  static fromFloat32ArrayColumnMajor(float32Array: Float32Array) {
    return new MutableMatrix33(float32Array);
  }

  /**
   * Creates a new matrix by copying data from a Float32Array in column-major order.
   * @param float32Array - A Float32Array containing the matrix data to copy
   * @returns A new MutableMatrix33 instance with copied data
   */
  static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array) {
    const v = new Float32Array(9);
    v.set(float32Array);
    return new MutableMatrix33(v);
  }

  /**
   * Creates a new matrix by copying data from a Float32Array in row-major order.
   * The data is converted to column-major order during the copy process.
   * @param array - A Float32Array containing the matrix data in row-major order
   * @returns A new MutableMatrix33 instance with converted data
   */
  static fromCopyFloat32ArrayRowMajor(array: Float32Array) {
    const v = new Float32Array(9);
    v[0] = array[0];
    v[3] = array[1];
    v[6] = array[2];
    v[1] = array[3];
    v[4] = array[4];
    v[7] = array[5];
    v[2] = array[6];
    v[5] = array[7];
    v[8] = array[8];

    return new MutableMatrix33(v);
  }

  /**
   * Creates a new matrix by copying from another 3x3 matrix.
   * @param mat - The source matrix to copy from
   * @returns A new MutableMatrix33 instance with copied data
   */
  static fromCopyMatrix33(mat: IMatrix33) {
    const v = new Float32Array(9);
    v[0] = mat._v[0];
    v[3] = mat._v[3];
    v[6] = mat._v[6];
    v[1] = mat._v[1];
    v[4] = mat._v[4];
    v[7] = mat._v[7];
    v[2] = mat._v[2];
    v[5] = mat._v[5];
    v[8] = mat._v[8];
    return new MutableMatrix33(v);
  }

  /**
   * Creates a new matrix from a 9-element array in column-major order.
   * @param array - An array containing exactly 9 numbers in column-major order
   * @returns A new MutableMatrix33 instance
   */
  static fromCopyArray9ColumnMajor(array: Array9<number>) {
    const v = new Float32Array(9);
    v.set(array);
    return new MutableMatrix33(v);
  }

  /**
   * Creates a new matrix from an array in column-major order.
   * Only the first 9 elements are used if the array is larger.
   * @param array - An array containing the matrix data in column-major order
   * @returns A new MutableMatrix33 instance
   */
  static fromCopyArrayColumnMajor(array: Array<number>) {
    const v = new Float32Array(9);
    v.set(array);
    return new MutableMatrix33(v);
  }

  /**
   * Creates a new matrix from a 9-element array in row-major order.
   * The data is converted to column-major order during the creation process.
   * @param array - An array containing exactly 9 numbers in row-major order
   * @returns A new MutableMatrix33 instance
   */
  static fromCopyArray9RowMajor(array: Array9<number>) {
    const v = new Float32Array(9);
    v[0] = array[0];
    v[3] = array[1];
    v[6] = array[2];
    v[1] = array[3];
    v[4] = array[4];
    v[7] = array[5];
    v[2] = array[6];
    v[5] = array[7];
    v[8] = array[8];
    return new MutableMatrix33(v);
  }

  /**
   * Creates a new matrix from an array in row-major order.
   * Only the first 9 elements are used if the array is larger.
   * The data is converted to column-major order during the creation process.
   * @param array - An array containing the matrix data in row-major order
   * @returns A new MutableMatrix33 instance
   */
  static fromCopyArrayRowMajor(array: Array<number>) {
    const v = new Float32Array(9);
    v[0] = array[0];
    v[3] = array[1];
    v[6] = array[2];
    v[1] = array[3];
    v[4] = array[4];
    v[7] = array[5];
    v[2] = array[6];
    v[5] = array[7];
    v[8] = array[8];
    return new MutableMatrix33(v);
  }

  /**
   * Creates a new rotation matrix from a quaternion.
   * Converts the quaternion representation to its equivalent 3x3 rotation matrix.
   * @param q - The quaternion to convert (should be normalized)
   * @returns A new MutableMatrix33 instance representing the rotation
   */
  static fromCopyQuaternion(q: IQuaternion) {
    const sx = q._v[0] * q._v[0];
    const sy = q._v[1] * q._v[1];
    const sz = q._v[2] * q._v[2];
    const cx = q._v[1] * q._v[2];
    const cy = q._v[0] * q._v[2];
    const cz = q._v[0] * q._v[1];
    const wx = q._v[3] * q._v[0];
    const wy = q._v[3] * q._v[1];
    const wz = q._v[3] * q._v[2];
    const v = new Float32Array(9);
    v[0] = 1.0 - 2.0 * (sy + sz);
    v[3] = 2.0 * (cz - wz);
    v[6] = 2.0 * (cy + wy);
    v[1] = 2.0 * (cz + wz);
    v[4] = 1.0 - 2.0 * (sx + sz);
    v[7] = 2.0 * (cx - wx);
    v[2] = 2.0 * (cy - wy);
    v[5] = 2.0 * (cx + wx);
    v[8] = 1.0 - 2.0 * (sx + sy);

    return new MutableMatrix33(v);
  }
}
