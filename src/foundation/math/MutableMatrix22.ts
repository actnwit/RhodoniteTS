import type { Array4, Index } from '../../types/CommonTypes';
import { Logger } from '../misc/Logger';
import type { IMatrix22, IMatrix33, IMatrix44, IMutableMatrix, IMutableMatrix22 } from './IMatrix';
import type { IVector2 } from './IVector';
import { Matrix22 } from './Matrix22';
import type { Matrix33 } from './Matrix33';
import type { Matrix44 } from './Matrix44';
import type { Vector2 } from './Vector2';

/**
 * A mutable 2x2 matrix class that extends Matrix22 and provides modification capabilities.
 * This class allows in-place operations for matrix transformations, making it suitable
 * for performance-critical applications where object creation overhead should be minimized.
 *
 * The matrix is stored in column-major order as a Float32Array, compatible with WebGL.
 * Matrix layout:
 * ```
 * | m00 m01 |
 * | m10 m11 |
 * ```
 *
 * @example
 * ```typescript
 * const matrix = MutableMatrix22.identity();
 * matrix.rotate(Math.PI / 4); // Rotate 45 degrees
 * matrix.scale(Vector2.fromCopyArray([2, 3])); // Scale by 2x and 3y
 * ```
 */
export class MutableMatrix22 extends Matrix22 implements IMutableMatrix, IMutableMatrix22 {
  /**
   * Sets the value at position (0,0) of the matrix.
   *
   * @param val - The value to set
   */
  public set m00(val: number) {
    this._v[0] = val;
  }

  /**
   * Gets the value at position (0,0) of the matrix.
   *
   * @returns The value at position (0,0)
   */
  public get m00(): number {
    return this._v[0];
  }

  /**
   * Sets the value at position (1,0) of the matrix.
   *
   * @param val - The value to set
   */
  public set m10(val: number) {
    this._v[1] = val;
  }

  /**
   * Gets the value at position (1,0) of the matrix.
   *
   * @returns The value at position (1,0)
   */
  public get m10(): number {
    return this._v[1];
  }

  /**
   * Sets the value at position (0,1) of the matrix.
   *
   * @param val - The value to set
   */
  public set m01(val: number) {
    this._v[2] = val;
  }

  /**
   * Gets the value at position (0,1) of the matrix.
   *
   * @returns The value at position (0,1)
   */
  public get m01(): number {
    return this._v[2];
  }

  /**
   * Sets the value at position (1,1) of the matrix.
   *
   * @param val - The value to set
   */
  public set m11(val: number) {
    this._v[3] = val;
  }

  /**
   * Gets the value at position (1,1) of the matrix.
   *
   * @returns The value at position (1,1)
   */
  public get m11(): number {
    return this._v[3];
  }

  /**
   * Gets the class name for debugging purposes.
   *
   * @returns The class name "MutableMatrix22"
   */
  get className(): string {
    return 'MutableMatrix22';
  }

  /**
   * Creates a new zero matrix where all elements are 0.
   *
   * @returns A new MutableMatrix22 instance with all zero values
   */
  static zero(): MutableMatrix22 {
    return super.zero() as MutableMatrix22;
  }

  /**
   * Creates a new 2x2 identity matrix.
   *
   * @returns A new MutableMatrix22 identity matrix
   */
  static identity(): MutableMatrix22 {
    return super.identity() as MutableMatrix22;
  }

  /**
   * Creates a dummy matrix for placeholder purposes.
   *
   * @returns A new MutableMatrix22 dummy instance
   */
  static dummy(): MutableMatrix22 {
    return super.dummy() as MutableMatrix22;
  }

  /**
   * Creates a new matrix that is the transpose of the input matrix.
   *
   * @param mat - The matrix to transpose
   * @returns A new MutableMatrix22 containing the transposed matrix
   */
  static transpose(mat: IMatrix22): MutableMatrix22 {
    return super.transpose(mat) as MutableMatrix22;
  }

  /**
   * Creates a new matrix that is the inverse of the input matrix.
   *
   * @param mat - The matrix to invert
   * @returns A new MutableMatrix22 containing the inverted matrix
   * @throws Error if the matrix is not invertible (determinant is 0)
   */
  static invert(mat: IMatrix22): MutableMatrix22 {
    return super.invert(mat) as MutableMatrix22;
  }

  /**
   * Creates a new rotation matrix for the given angle.
   *
   * @param radian - The rotation angle in radians
   * @returns A new MutableMatrix22 representing the rotation transformation
   */
  static rotate(radian: number): MutableMatrix22 {
    return super.rotate(radian) as MutableMatrix22;
  }

  /**
   * Creates a new scale matrix from a 2D vector.
   *
   * @param vec - Vector2 containing the scale factors for x and y axes
   * @returns A new MutableMatrix22 representing the scale transformation
   */
  static scale(vec: IVector2): MutableMatrix22 {
    return super.scale(vec) as MutableMatrix22;
  }

  /**
   * Multiplies two matrices and returns a new matrix with the result.
   *
   * @param l_mat - The left matrix operand
   * @param r_mat - The right matrix operand
   * @returns A new MutableMatrix22 containing the multiplication result
   */
  static multiply(l_mat: IMatrix22, r_mat: IMatrix22): MutableMatrix22 {
    return super.multiply(l_mat, r_mat) as MutableMatrix22;
  }

  /**
   * Creates a deep copy of this matrix.
   *
   * @returns A new MutableMatrix22 instance with the same values
   */
  clone(): MutableMatrix22 {
    const result = super.clone() as MutableMatrix22;
    return result;
  }

  /**
   * Gets the raw Float32Array containing the matrix data.
   *
   * @returns The internal Float32Array in column-major order
   */
  raw(): Float32Array {
    return this._v;
  }

  /**
   * Sets the value at the specified row and column position.
   *
   * @param row_i - The row index (0-1)
   * @param column_i - The column index (0-1)
   * @param value - The value to set
   * @returns This matrix instance for method chaining
   */
  setAt(row_i: number, column_i: number, value: number): MutableMatrix22 {
    this._v[row_i + column_i * 2] = value;
    return this;
  }

  /**
   * Sets all matrix components directly.
   *
   * @param m00 - Value for position (0,0)
   * @param m01 - Value for position (0,1)
   * @param m10 - Value for position (1,0)
   * @param m11 - Value for position (1,1)
   * @returns This matrix instance for method chaining
   */
  setComponents(m00: number, m01: number, m10: number, m11: number): MutableMatrix22 {
    this._v[0] = m00;
    this._v[2] = m01;
    this._v[1] = m10;
    this._v[3] = m11;

    return this;
  }

  /**
   * Copies the 2x2 portion of another matrix into this matrix.
   * Works with Matrix22, Matrix33, or Matrix44 sources.
   *
   * @param mat - The source matrix to copy from
   * @returns This matrix instance for method chaining
   */
  copyComponents(mat: IMatrix22 | IMatrix33 | IMatrix44): MutableMatrix22 {
    this._v[0] = mat.m00;
    this._v[2] = mat.m01; // mat.m01 is mat._v[2 or 3 or 4]
    this._v[1] = mat.m10;
    this._v[3] = mat.m11;

    return this;
  }

  /**
   * Sets this matrix to a zero matrix (all elements are 0).
   *
   * @returns This matrix instance for method chaining
   */
  zero(): MutableMatrix22 {
    return this.setComponents(0, 0, 0, 0);
  }

  /**
   * Sets this matrix to an identity matrix.
   *
   * @returns This matrix instance for method chaining
   */
  identity(): MutableMatrix22 {
    return this.setComponents(1, 0, 0, 1);
  }

  /**
   * Internal helper method to swap two elements in the matrix array.
   *
   * @param l - Index of the first element
   * @param r - Index of the second element
   */
  _swap(l: Index, r: Index): void {
    const temp = this._v[l];
    this._v[l] = this._v[r];
    this._v[r] = temp;
  }

  /**
   * Transposes this matrix in place (swaps rows and columns).
   *
   * @returns This matrix instance for method chaining
   */
  transpose(): MutableMatrix22 {
    this._swap(1, 2);

    return this;
  }

  /**
   * Inverts this matrix in place.
   *
   * @returns This matrix instance for method chaining
   * @throws Error if the matrix is not invertible (determinant is 0)
   */
  invert(): MutableMatrix22 {
    const det = this.determinant();
    if (det === 0) {
      Logger.error('the determinant is 0!');
    }

    const m00 = this._v[3] / det;
    const m01 = (this._v[2] / det) * -1.0;
    const m10 = (this._v[1] / det) * -1.0;
    const m11 = this._v[0] / det;

    return this.setComponents(m00, m01, m10, m11);
  }

  /**
   * Sets this matrix to a rotation matrix for the given angle.
   *
   * @param radian - The rotation angle in radians
   * @returns This matrix instance for method chaining
   */
  rotate(radian: number): MutableMatrix22 {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this.setComponents(cos, -sin, sin, cos);
  }

  /**
   * Sets this matrix to a scale matrix from a 2D vector.
   *
   * @param vec - Vector2 containing the scale factors for x and y axes
   * @returns This matrix instance for method chaining
   */
  scale(vec: IVector2): MutableMatrix22 {
    return this.setComponents(vec._v[0], 0, 0, vec._v[1]);
  }

  /**
   * Multiplies this matrix by a scale transformation in place.
   *
   * @param vec - Vector2 containing the scale factors for x and y axes
   * @returns This matrix instance for method chaining
   */
  multiplyScale(vec: IVector2): MutableMatrix22 {
    this._v[0] *= vec._v[0];
    this._v[2] *= vec._v[0];

    this._v[1] *= vec._v[1];
    this._v[3] *= vec._v[1];

    return this;
  }

  /**
   * Multiplies this matrix by another matrix from the right side (this * mat).
   *
   * @param mat - The matrix to multiply with
   * @returns This matrix instance for method chaining
   */
  multiply(mat: IMatrix22): MutableMatrix22 {
    const m00 = this._v[0] * mat._v[0] + this._v[2] * mat._v[1];
    const m01 = this._v[0] * mat._v[2] + this._v[2] * mat._v[3];

    const m10 = this._v[1] * mat._v[0] + this._v[3] * mat._v[1];
    const m11 = this._v[1] * mat._v[2] + this._v[3] * mat._v[3];

    return this.setComponents(m00, m01, m10, m11);
  }

  /**
   * Multiplies this matrix by another matrix from the left side (mat * this).
   *
   * @param mat - The matrix to multiply with from the left
   * @returns This matrix instance for method chaining
   */
  multiplyByLeft(mat: IMatrix22): MutableMatrix22 {
    const m00 = mat._v[0] * this._v[0] + mat._v[2] * this._v[1];
    const m01 = mat._v[0] * this._v[2] + mat._v[2] * this._v[3];

    const m10 = mat._v[1] * this._v[0] + mat._v[3] * this._v[1];
    const m11 = mat._v[1] * this._v[2] + mat._v[3] * this._v[3];

    return this.setComponents(m00, m01, m10, m11);
  }

  /**
   * Creates a new matrix from values provided in row-major order.
   * This is more intuitive for manual input as values are specified
   * in the same order they appear visually in the matrix.
   *
   * @param m00 - Value for position (0,0)
   * @param m01 - Value for position (0,1)
   * @param m10 - Value for position (1,0)
   * @param m11 - Value for position (1,1)
   * @returns A new MutableMatrix22 instance
   */
  static fromCopy4RowMajor(m00: number, m01: number, m10: number, m11: number): MutableMatrix22 {
    const v = new Float32Array(4);
    v[0] = m00;
    v[2] = m01;
    v[1] = m10;
    v[3] = m11;
    return new MutableMatrix22(v);
  }

  /**
   * Creates a new matrix from values provided in column-major order.
   * This matches the internal storage format used by WebGL.
   *
   * @param m00 - Value for position (0,0)
   * @param m10 - Value for position (1,0)
   * @param m01 - Value for position (0,1)
   * @param m11 - Value for position (1,1)
   * @returns A new MutableMatrix22 instance
   */
  static fromCopy4ColumnMajor(m00: number, m10: number, m01: number, m11: number): MutableMatrix22 {
    const v = new Float32Array(4);
    v[0] = m00;
    v[2] = m01;
    v[1] = m10;
    v[3] = m11;
    return new MutableMatrix22(v);
  }

  /**
   * Creates a new matrix using the provided Float32Array directly (no copy).
   * The array is expected to be in column-major order.
   *
   * @param float32Array - Float32Array containing matrix data in column-major order
   * @returns A new MutableMatrix22 instance sharing the provided array
   */
  static fromFloat32ArrayColumnMajor(float32Array: Float32Array): MutableMatrix22 {
    return new MutableMatrix22(float32Array);
  }

  /**
   * Creates a new matrix by copying from a Float32Array in column-major order.
   *
   * @param float32Array - Float32Array containing matrix data in column-major order
   * @returns A new MutableMatrix22 instance with copied data
   */
  static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array): MutableMatrix22 {
    const v = new Float32Array(4);
    v.set(float32Array);
    return new MutableMatrix22(v);
  }

  /**
   * Creates a new matrix by copying from a Float32Array in row-major order.
   *
   * @param array - Float32Array containing matrix data in row-major order
   * @returns A new MutableMatrix22 instance with converted data
   */
  static fromCopyFloat32ArrayRowMajor(array: Float32Array): MutableMatrix22 {
    const v = new Float32Array(4);
    v[0] = array[0];
    v[3] = array[1];
    v[1] = array[2];
    v[4] = array[3];

    return new MutableMatrix22(v);
  }

  /**
   * Creates a new matrix by copying from another Matrix22 instance.
   *
   * @param mat - The source Matrix22 to copy from
   * @returns A new MutableMatrix22 instance with copied data
   */
  static fromCopyMatrix22(mat: IMatrix22): MutableMatrix22 {
    const v = new Float32Array(4);
    v[0] = mat._v[0];
    v[3] = mat._v[1];
    v[1] = mat._v[2];
    v[4] = mat._v[3];
    return new MutableMatrix22(v);
  }

  /**
   * Creates a new matrix from a 4-element array in column-major order.
   *
   * @param array - Array4 containing matrix data in column-major order
   * @returns A new MutableMatrix22 instance with copied data
   */
  static fromCopyArray9ColumnMajor(array: Array4<number>): MutableMatrix22 {
    const v = new Float32Array(4);
    v.set(array);
    return new MutableMatrix22(v);
  }

  /**
   * Creates a new matrix from an array in column-major order.
   *
   * @param array - Array containing matrix data in column-major order
   * @returns A new MutableMatrix22 instance with copied data
   */
  static fromCopyArrayColumnMajor(array: Array<number>): MutableMatrix22 {
    const v = new Float32Array(4);
    v.set(array);
    return new MutableMatrix22(v);
  }

  /**
   * Creates a new matrix from a 4-element array in row-major order.
   *
   * @param array - Array4 containing matrix data in row-major order
   * @returns A new MutableMatrix22 instance with converted data
   */
  static fromCopyArray9RowMajor(array: Array4<number>): MutableMatrix22 {
    const v = new Float32Array(4);
    v[0] = array[0];
    v[3] = array[1];
    v[1] = array[2];
    v[4] = array[3];
    return new MutableMatrix22(v);
  }

  /**
   * Creates a new matrix from an array in row-major order.
   *
   * @param array - Array containing matrix data in row-major order
   * @returns A new MutableMatrix22 instance with converted data
   */
  static fromCopyArrayRowMajor(array: Array<number>): MutableMatrix22 {
    const v = new Float32Array(4);
    v[0] = array[0];
    v[3] = array[1];
    v[1] = array[2];
    v[4] = array[3];
    return new MutableMatrix22(v);
  }
}
