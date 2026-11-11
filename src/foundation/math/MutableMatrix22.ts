import type { Array4, FloatTypedArrayConstructor, Index, TypedArray } from '../../types/CommonTypes';
import { Logger } from '../misc/Logger';
import type { IMatrix22, IMatrix33, IMatrix44, IMutableMatrix, IMutableMatrix22 } from './IMatrix';
import type { IVector2 } from './IVector';
import { MathUtil } from './MathUtil';
import { Matrix22_ } from './Matrix22';

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
export class MutableMatrix22_<T extends FloatTypedArrayConstructor>
  extends Matrix22_<T>
  implements IMutableMatrix, IMutableMatrix22
{
  /**
   * Creates a new MutableMatrix22_ instance.
   * @param m - The typed array containing the matrix components
   * @param options - Configuration object containing the typed array constructor
   */
  constructor(m: TypedArray, options: { type: T }) {
    super(m, options);
  }

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
  raw() {
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
   * Attempts to invert this matrix in place.
   *
   * The matrix is left unchanged when it is numerically singular, which
   * lets callers keep the previous valid value.
   *
   * @returns True if the inversion succeeded, false if the matrix is singular
   */
  tryInvert(): boolean {
    const det = this.determinant();
    const rowNorm0 = Math.abs(this._v[0]) + Math.abs(this._v[2]);
    const rowNorm1 = Math.abs(this._v[1]) + Math.abs(this._v[3]);
    if (MathUtil.isSingularDet(det, rowNorm0 * rowNorm1, MathUtil.getSingularEpsilon(this._v.BYTES_PER_ELEMENT))) {
      return false;
    }

    const invDet = 1 / det;
    const m00 = this._v[3] * invDet;
    const m01 = -this._v[2] * invDet;
    const m10 = -this._v[1] * invDet;
    const m11 = this._v[0] * invDet;

    this.setComponents(m00, m01, m10, m11);
    return true;
  }

  /**
   * Inverts this matrix in place.
   *
   * If the matrix is numerically singular, it is set to the identity matrix
   * instead of being filled with `Infinity`/`NaN`.
   * Use {@link MutableMatrix22.tryInvert} when the caller needs to detect the failure.
   *
   * @returns This matrix instance for method chaining
   */
  invert(): MutableMatrix22 {
    if (this.tryInvert()) {
      return this;
    }

    Logger.default.error('the matrix is singular and cannot be inverted. Returning an identity matrix instead.');
    return this.identity();
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
}

export class MutableMatrix22 extends MutableMatrix22_<Float32ArrayConstructor> {
  /**
   * Creates a new MutableMatrix22 instance.
   * @param m - The typed array containing the matrix components
   */
  constructor(m: TypedArray) {
    super(m, { type: Float32Array });
  }

  /** Creates a zero matrix. */
  static zero(): MutableMatrix22 {
    return super._zero(Float32Array) as MutableMatrix22;
  }

  /** Creates an identity matrix. */
  static identity(): MutableMatrix22 {
    return super._identity(Float32Array) as MutableMatrix22;
  }

  /** Creates a dummy matrix with an empty array. */
  static dummy(): MutableMatrix22 {
    return super._dummy(Float32Array) as MutableMatrix22;
  }

  /** Creates the transpose of the given matrix. */
  static transpose(mat: IMatrix22): MutableMatrix22 {
    return super._transpose(mat, Float32Array) as MutableMatrix22;
  }

  /** Attempts to invert the given matrix, returning null when it is singular. */
  static tryInvert(mat: IMatrix22): MutableMatrix22 | null {
    return super._tryInvert(mat, Float32Array) as MutableMatrix22 | null;
  }

  /** Creates the inverse of the given matrix (identity when singular). */
  static invert(mat: IMatrix22): MutableMatrix22 {
    return super._invert(mat, Float32Array) as MutableMatrix22;
  }

  /** Attempts to invert the given matrix into outMat. */
  static tryInvertTo<T extends IMutableMatrix22>(mat: IMatrix22, outMat: T): boolean {
    return super._tryInvertTo(mat, outMat);
  }

  /** Inverts the given matrix into outMat (identity when singular). */
  static invertTo<T extends IMutableMatrix22>(mat: IMatrix22, outMat: T): T {
    return super._invertTo(mat, outMat) as T;
  }

  /** Creates a 2D rotation matrix. */
  static rotate(radian: number): MutableMatrix22 {
    return super._rotate(radian, Float32Array) as MutableMatrix22;
  }

  /** Creates a 2D scaling matrix. */
  static scale(vec: IVector2): MutableMatrix22 {
    return super._scale(vec, Float32Array) as MutableMatrix22;
  }

  /** Multiplies two 2x2 matrices. */
  static multiply(l_mat: IMatrix22, r_mat: IMatrix22): MutableMatrix22 {
    return super._multiply(l_mat, r_mat, Float32Array) as MutableMatrix22;
  }

  /** Multiplies two matrices and stores the result in outMat. */
  static multiplyTo<T extends IMutableMatrix22>(l_mat: IMatrix22, r_mat: IMatrix22, outMat: T): T {
    return super._multiplyTo(l_mat, r_mat, outMat) as T;
  }

  /** Creates a matrix from row-major components. */
  static fromCopy4RowMajor(m00: number, m01: number, m10: number, m11: number): MutableMatrix22 {
    return super._fromCopy4RowMajor(m00, m01, m10, m11, Float32Array) as MutableMatrix22;
  }

  /** Creates a matrix from column-major components. */
  static fromCopy4ColumnMajor(m00: number, m10: number, m01: number, m11: number): MutableMatrix22 {
    return super._fromCopy4ColumnMajor(m00, m10, m01, m11, Float32Array) as MutableMatrix22;
  }

  /** Creates a matrix that directly uses the given Float32Array. */
  static fromFloat32ArrayColumnMajor(array: Float32Array): MutableMatrix22 {
    return super._fromTypedArrayColumnMajor(array, Float32Array) as MutableMatrix22;
  }

  /** Creates a matrix by copying a Float32Array in column-major order. */
  static fromCopyFloat32ArrayColumnMajor(array: Float32Array): MutableMatrix22 {
    return super._fromCopyTypedArrayColumnMajor(array, Float32Array) as MutableMatrix22;
  }

  /** Creates a matrix by copying a Float32Array in row-major order. */
  static fromCopyFloat32ArrayRowMajor(array: Float32Array): MutableMatrix22 {
    return super._fromCopyTypedArrayRowMajor(array, Float32Array) as MutableMatrix22;
  }

  /** Creates a matrix by copying another matrix. */
  static fromCopyMatrix22(mat: IMatrix22): MutableMatrix22 {
    return super._fromCopyMatrix22(mat, Float32Array) as MutableMatrix22;
  }

  /** Creates a matrix from a 4-element array in column-major order. */
  static fromCopyArray9ColumnMajor(array: Array4<number>): MutableMatrix22 {
    return super._fromCopyArray4ColumnMajor(array, Float32Array) as MutableMatrix22;
  }

  /** Creates a matrix from an array in column-major order. */
  static fromCopyArrayColumnMajor(array: Array<number>): MutableMatrix22 {
    return super._fromCopyArrayColumnMajor(array, Float32Array) as MutableMatrix22;
  }

  /** Creates a matrix from a 4-element array in row-major order. */
  static fromCopyArray9RowMajor(array: Array4<number>): MutableMatrix22 {
    return super._fromCopyArray4RowMajor(array, Float32Array) as MutableMatrix22;
  }

  /** Creates a matrix from an array in row-major order. */
  static fromCopyArrayRowMajor(array: Array<number>): MutableMatrix22 {
    return super._fromCopyArrayRowMajor(array, Float32Array) as MutableMatrix22;
  }
}

/**
 * Immutable 2x2 matrix with 64-bit float components.
 * Use this implementation when higher numerical precision is required.
 */
export class MutableMatrix22d extends MutableMatrix22_<Float64ArrayConstructor> {
  /**
   * Creates a new MutableMatrix22d instance.
   * @param m - The typed array containing the matrix components
   */
  private constructor(m: TypedArray) {
    super(m, { type: Float64Array });
  }

  /** Creates a zero matrix. */
  static zero(): MutableMatrix22d {
    return super._zero(Float64Array) as MutableMatrix22d;
  }

  /** Creates an identity matrix. */
  static identity(): MutableMatrix22d {
    return super._identity(Float64Array) as MutableMatrix22d;
  }

  /** Creates a dummy matrix with an empty array. */
  static dummy(): MutableMatrix22d {
    return super._dummy(Float64Array) as MutableMatrix22d;
  }

  /** Creates the transpose of the given matrix. */
  static transpose(mat: IMatrix22): MutableMatrix22d {
    return super._transpose(mat, Float64Array) as MutableMatrix22d;
  }

  /** Attempts to invert the given matrix, returning null when it is singular. */
  static tryInvert(mat: IMatrix22): MutableMatrix22d | null {
    return super._tryInvert(mat, Float64Array) as MutableMatrix22d | null;
  }

  /** Creates the inverse of the given matrix (identity when singular). */
  static invert(mat: IMatrix22): MutableMatrix22d {
    return super._invert(mat, Float64Array) as MutableMatrix22d;
  }

  /** Attempts to invert the given matrix into outMat. */
  static tryInvertTo<T extends IMutableMatrix22>(mat: IMatrix22, outMat: T): boolean {
    return super._tryInvertTo(mat, outMat);
  }

  /** Inverts the given matrix into outMat (identity when singular). */
  static invertTo<T extends IMutableMatrix22>(mat: IMatrix22, outMat: T): T {
    return super._invertTo(mat, outMat) as T;
  }

  /** Creates a 2D rotation matrix. */
  static rotate(radian: number): MutableMatrix22d {
    return super._rotate(radian, Float64Array) as MutableMatrix22d;
  }

  /** Creates a 2D scaling matrix. */
  static scale(vec: IVector2): MutableMatrix22d {
    return super._scale(vec, Float64Array) as MutableMatrix22d;
  }

  /** Multiplies two 2x2 matrices. */
  static multiply(l_mat: IMatrix22, r_mat: IMatrix22): MutableMatrix22d {
    return super._multiply(l_mat, r_mat, Float64Array) as MutableMatrix22d;
  }

  /** Multiplies two matrices and stores the result in outMat. */
  static multiplyTo<T extends IMutableMatrix22>(l_mat: IMatrix22, r_mat: IMatrix22, outMat: T): T {
    return super._multiplyTo(l_mat, r_mat, outMat) as T;
  }

  /** Creates a matrix from row-major components. */
  static fromCopy4RowMajor(m00: number, m01: number, m10: number, m11: number): MutableMatrix22d {
    return super._fromCopy4RowMajor(m00, m01, m10, m11, Float64Array) as MutableMatrix22d;
  }

  /** Creates a matrix from column-major components. */
  static fromCopy4ColumnMajor(m00: number, m10: number, m01: number, m11: number): MutableMatrix22d {
    return super._fromCopy4ColumnMajor(m00, m10, m01, m11, Float64Array) as MutableMatrix22d;
  }

  /** Creates a matrix that directly uses the given Float64Array. */
  static fromFloat64ArrayColumnMajor(array: Float64Array): MutableMatrix22d {
    return super._fromTypedArrayColumnMajor(array, Float64Array) as MutableMatrix22d;
  }

  /** Creates a matrix by copying a Float64Array in column-major order. */
  static fromCopyFloat64ArrayColumnMajor(array: Float64Array): MutableMatrix22d {
    return super._fromCopyTypedArrayColumnMajor(array, Float64Array) as MutableMatrix22d;
  }

  /** Creates a matrix by copying a Float64Array in row-major order. */
  static fromCopyFloat64ArrayRowMajor(array: Float64Array): MutableMatrix22d {
    return super._fromCopyTypedArrayRowMajor(array, Float64Array) as MutableMatrix22d;
  }

  /** Creates a matrix by copying another matrix. */
  static fromCopyMatrix22(mat: IMatrix22): MutableMatrix22d {
    return super._fromCopyMatrix22(mat, Float64Array) as MutableMatrix22d;
  }

  /** Creates a matrix from a 4-element array in column-major order. */
  static fromCopyArray9ColumnMajor(array: Array4<number>): MutableMatrix22d {
    return super._fromCopyArray4ColumnMajor(array, Float64Array) as MutableMatrix22d;
  }

  /** Creates a matrix from an array in column-major order. */
  static fromCopyArrayColumnMajor(array: Array<number>): MutableMatrix22d {
    return super._fromCopyArrayColumnMajor(array, Float64Array) as MutableMatrix22d;
  }

  /** Creates a matrix from a 4-element array in row-major order. */
  static fromCopyArray9RowMajor(array: Array4<number>): MutableMatrix22d {
    return super._fromCopyArray4RowMajor(array, Float64Array) as MutableMatrix22d;
  }

  /** Creates a matrix from an array in row-major order. */
  static fromCopyArrayRowMajor(array: Array<number>): MutableMatrix22d {
    return super._fromCopyArrayRowMajor(array, Float64Array) as MutableMatrix22d;
  }
}
