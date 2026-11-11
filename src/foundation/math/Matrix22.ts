import type { Array4 } from '../../types';
import type { FloatTypedArrayConstructor, TypedArray } from '../../types/CommonTypes';
import { CompositionType } from '../definitions/CompositionType';
import { Logger } from '../misc/Logger';
import { AbstractMatrix } from './AbstractMatrix';
import type { IMatrix22, IMutableMatrix22 } from './IMatrix';
import type { IVector2 } from './IVector';
import { MathUtil } from './MathUtil';
import type { MutableVector2 } from './MutableVector2';
import { Vector2 } from './Vector2';

/**
 * A 2x2 matrix class for 2D transformations and linear algebra operations.
 *
 * This immutable matrix class supports common 2D transformations including
 * rotation, scaling, and general linear transformations. The matrix data
 * is stored in column-major order as a Float32Array for WebGL compatibility.
 *
 * Matrix layout:
 * ```
 * | m00 m01 |
 * | m10 m11 |
 * ```
 *
 * @example
 * ```typescript
 * // Create identity matrix
 * const identity = Matrix22.identity();
 *
 * // Create rotation matrix
 * const rotation = Matrix22.rotate(Math.PI / 4);
 *
 * // Create scale matrix
 * const scale = Matrix22.scale(Vector2.fromCopyArray2([2, 3]));
 * ```
 */
export class Matrix22_<T extends FloatTypedArrayConstructor> extends AbstractMatrix implements IMatrix22 {
  /**
   * Creates a new Matrix22_ instance.
   *
   * @param m - Typed array containing matrix values in column-major order
   * @param _options - Configuration object containing the typed array constructor
   */
  constructor(m: TypedArray, _options: { type: T }) {
    super();
    this._v = m;
  }

  /**
   * Gets the matrix element at row 0, column 0.
   *
   * @returns The m00 component of the matrix
   */
  public get m00() {
    return this._v[0];
  }

  /**
   * Gets the matrix element at row 1, column 0.
   *
   * @returns The m10 component of the matrix
   */
  public get m10() {
    return this._v[1];
  }

  /**
   * Gets the matrix element at row 0, column 1.
   *
   * @returns The m01 component of the matrix
   */
  public get m01() {
    return this._v[2];
  }

  /**
   * Gets the matrix element at row 1, column 1.
   *
   * @returns The m11 component of the matrix
   */
  public get m11() {
    return this._v[3];
  }

  /**
   * Gets the class name for this matrix type.
   *
   * @returns The string 'Matrix22'
   */
  get className() {
    return 'Matrix22';
  }

  /**
   * Gets the composition type for this matrix.
   *
   * @returns The CompositionType.Mat2 enum value
   */
  static get compositionType() {
    return CompositionType.Mat2;
  }

  /**
   * Creates a 2x2 zero matrix.
   *
   * @returns A new Matrix22 with all elements set to 0
   *
   * @example
   * ```typescript
   * const zero = Matrix22.zero();
   * // Returns:
   * // | 0 0 |
   * // | 0 0 |
   * ```
   */
  static _zero(type: FloatTypedArrayConstructor): IMatrix22 {
    return this._fromCopy4RowMajor(0, 0, 0, 0, type);
  }

  /**
   * Creates a 2x2 identity matrix.
   *
   * @returns A new Matrix22 identity matrix
   *
   * @example
   * ```typescript
   * const identity = Matrix22.identity();
   * // Returns:
   * // | 1 0 |
   * // | 0 1 |
   * ```
   */
  static _identity(type: FloatTypedArrayConstructor): IMatrix22 {
    return this._fromCopy4RowMajor(1, 0, 0, 1, type);
  }

  /**
   * Creates a dummy matrix with empty data.
   * Used as a placeholder when no valid matrix data is available.
   *
   * @returns A new Matrix22 with empty Float32Array
   */
  static _dummy(type: FloatTypedArrayConstructor): IMatrix22 {
    return new this(new type(0), { type });
  }

  /**
   * Creates the transpose of the given matrix.
   * The transpose swaps rows and columns: (i,j) becomes (j,i).
   *
   * @param mat - The matrix to transpose
   * @returns A new Matrix22 that is the transpose of the input matrix
   *
   * @example
   * ```typescript
   * const mat = Matrix22.fromCopy4RowMajor(1, 2, 3, 4);
   * const transposed = Matrix22.transpose(mat);
   * // Original:    Transposed:
   * // | 1 2 |  ->  | 1 3 |
   * // | 3 4 |      | 2 4 |
   * ```
   */
  static _transpose(mat: IMatrix22, type: FloatTypedArrayConstructor): IMatrix22 {
    return this._fromCopy4RowMajor(mat._v[0], mat._v[1], mat._v[2], mat._v[3], type);
  }

  /**
   * Attempts to create the inverse of the given matrix.
   *
   * Unlike `invert`, this method never returns a matrix filled with
   * `Infinity`/`NaN`: it returns `null` when the matrix is numerically
   * singular (see {@link MathUtil.isSingularDet}).
   *
   * @param mat - The matrix to invert
   * @returns A new Matrix22, or null if the matrix is not invertible
   */
  static _tryInvert(mat: IMatrix22, type: FloatTypedArrayConstructor): IMatrix22 | null {
    const det = mat.determinant();
    const rowNorm0 = Math.abs(mat._v[0]) + Math.abs(mat._v[2]);
    const rowNorm1 = Math.abs(mat._v[1]) + Math.abs(mat._v[3]);
    if (MathUtil.isSingularDet(det, rowNorm0 * rowNorm1, MathUtil.getSingularEpsilon(mat._v.BYTES_PER_ELEMENT))) {
      return null;
    }

    const invDet = 1 / det;
    const m00 = mat._v[3] * invDet;
    const m01 = -mat._v[2] * invDet;
    const m10 = -mat._v[1] * invDet;
    const m11 = mat._v[0] * invDet;

    return this._fromCopy4RowMajor(m00, m01, m10, m11, type);
  }

  /**
   * Creates the inverse of the given matrix.
   *
   * For a 2x2 matrix, the inverse is calculated using the formula:
   * A^(-1) = (1/det(A)) * | d -b |
   *                        |-c  a |
   * where A = | a b | and det(A) = ad - bc
   *           | c d |
   *
   * If the matrix is numerically singular, an identity matrix is returned
   * instead of dividing by zero. Use {@link Matrix22.tryInvert} when the
   * caller needs to detect the failure.
   *
   * @param mat - The matrix to invert
   * @returns A new Matrix22 that is the inverse of the input matrix,
   *          or the identity matrix if the input is singular
   *
   * @example
   * ```typescript
   * const mat = Matrix22.fromCopy4RowMajor(2, 0, 0, 2);
   * const inverse = Matrix22.invert(mat);
   * // Returns:
   * // | 0.5   0 |
   * // |   0 0.5 |
   * ```
   */
  static _invert(mat: IMatrix22, type: FloatTypedArrayConstructor): IMatrix22 {
    const inverted = this._tryInvert(mat, type);
    if (inverted !== null) {
      return inverted;
    }

    Logger.default.error('the matrix is singular and cannot be inverted. Returning an identity matrix instead.');
    return this._fromCopy4RowMajor(1, 0, 0, 1, type);
  }

  /**
   * Attempts to calculate the inverse of the given matrix and stores the
   * result in the output matrix.
   *
   * The output matrix is left untouched when the input is numerically
   * singular, which lets callers keep the previous valid value.
   *
   * @param mat - The matrix to invert
   * @param outMat - The mutable matrix to store the result
   * @returns True if the inversion succeeded, false if the matrix is singular
   */
  static _tryInvertTo(mat: IMatrix22, outMat: IMutableMatrix22): boolean {
    const det = mat.determinant();
    const rowNorm0 = Math.abs(mat._v[0]) + Math.abs(mat._v[2]);
    const rowNorm1 = Math.abs(mat._v[1]) + Math.abs(mat._v[3]);
    if (MathUtil.isSingularDet(det, rowNorm0 * rowNorm1, MathUtil.getSingularEpsilon(mat._v.BYTES_PER_ELEMENT))) {
      return false;
    }

    const invDet = 1 / det;
    outMat.setComponents(mat._v[3] * invDet, -mat._v[2] * invDet, -mat._v[1] * invDet, mat._v[0] * invDet);
    return true;
  }

  /**
   * Calculates the inverse of the given matrix and stores the result in the output matrix.
   * This method avoids creating a new matrix instance for better performance.
   *
   * If the matrix is numerically singular, the output matrix is set to the
   * identity matrix instead of being filled with `Infinity`/`NaN`.
   * Use {@link Matrix22.tryInvertTo} when the caller needs to detect the failure.
   *
   * @param mat - The matrix to invert
   * @param outMat - The mutable matrix to store the result
   * @returns The output matrix containing the inverse, or the identity matrix if the input is singular
   */
  static _invertTo(mat: IMatrix22, outMat: IMutableMatrix22): IMutableMatrix22 {
    if (this._tryInvertTo(mat, outMat)) {
      return outMat;
    }

    Logger.default.error('the matrix is singular and cannot be inverted. Returning an identity matrix instead.');
    return outMat.identity();
  }

  /**
   * Creates a 2D rotation matrix for the given angle.
   *
   * The rotation matrix is:
   * | cos(θ) -sin(θ) |
   * | sin(θ)  cos(θ) |
   *
   * @param radian - The rotation angle in radians (positive values rotate counter-clockwise)
   * @returns A new Matrix22 representing the rotation transformation
   *
   * @example
   * ```typescript
   * // 90-degree counter-clockwise rotation
   * const rotation = Matrix22.rotate(Math.PI / 2);
   * ```
   */
  static _rotate(radian: number, type: FloatTypedArrayConstructor): IMatrix22 {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this._fromCopy4RowMajor(cos, -sin, sin, cos, type);
  }

  /**
   * Creates a 2D scaling matrix from a 2D vector.
   *
   * The scaling matrix is:
   * | sx  0 |
   * |  0 sy |
   *
   * @param vec - A Vector2 containing the scale factors for x and y axes
   * @returns A new Matrix22 representing the scaling transformation
   *
   * @example
   * ```typescript
   * const scale = Matrix22.scale(Vector2.fromCopyArray2([2, 3]));
   * // Creates a matrix that scales x by 2 and y by 3
   * ```
   */
  static _scale(vec: IVector2, type: FloatTypedArrayConstructor): IMatrix22 {
    return this._fromCopy4RowMajor(vec._v[0], 0, 0, vec._v[1], type);
  }

  /**
   * Multiplies two 2x2 matrices and returns the result.
   * Matrix multiplication is not commutative: A * B ≠ B * A in general.
   *
   * @param l_mat - The left matrix operand
   * @param r_mat - The right matrix operand
   * @returns A new Matrix22 containing the product l_mat * r_mat
   *
   * @example
   * ```typescript
   * const a = Matrix22.scale(Vector2.fromCopyArray2([2, 2]));
   * const b = Matrix22.rotate(Math.PI / 4);
   * const result = Matrix22.multiply(a, b); // Scale then rotate
   * ```
   */
  static _multiply(l_mat: IMatrix22, r_mat: IMatrix22, type: FloatTypedArrayConstructor): IMatrix22 {
    const m00 = l_mat._v[0] * r_mat._v[0] + l_mat._v[2] * r_mat._v[1];
    const m10 = l_mat._v[1] * r_mat._v[0] + l_mat._v[3] * r_mat._v[1];

    const m01 = l_mat._v[0] * r_mat._v[2] + l_mat._v[2] * r_mat._v[3];
    const m11 = l_mat._v[1] * r_mat._v[2] + l_mat._v[3] * r_mat._v[3];

    return this._fromCopy4RowMajor(m00, m01, m10, m11, type);
  }

  /**
   * Multiplies two matrices and stores the result in the output matrix.
   * This method avoids creating a new matrix instance for better performance.
   *
   * Note: The parameter types suggest Matrix33, but this appears to be a bug
   * as this should operate on Matrix22 instances.
   *
   * @param l_mat - The left matrix operand
   * @param r_mat - The right matrix operand
   * @param outMat - The mutable matrix to store the result
   * @returns The output matrix containing the product
   */
  static _multiplyTo(l_mat: IMatrix22, r_mat: IMatrix22, outMat: IMutableMatrix22): IMutableMatrix22 {
    const m00 = l_mat._v[0] * r_mat._v[0] + l_mat._v[2] * r_mat._v[1];
    const m10 = l_mat._v[1] * r_mat._v[0] + l_mat._v[3] * r_mat._v[1];

    const m01 = l_mat._v[0] * r_mat._v[2] + l_mat._v[2] * r_mat._v[3];
    const m11 = l_mat._v[1] * r_mat._v[2] + l_mat._v[3] * r_mat._v[3];

    return outMat.setComponents(m00, m01, m10, m11);
  }

  /**
   * Returns a string representation of the matrix in a readable format.
   *
   * @returns A string showing the matrix in 2x2 layout
   *
   * @example
   * ```typescript
   * const mat = Matrix22.identity();
   * console.log(mat.toString());
   * // Output:
   * // 1 0
   * // 0 1
   * ```
   */
  toString() {
    return `${this._v[0]} ${this._v[2]}\n${this._v[1]} ${this._v[3]} \n`;
  }

  /**
   * Returns an approximate string representation of the matrix with rounded values.
   * Uses financial rounding for cleaner display of floating-point numbers.
   *
   * @returns A string showing the matrix with rounded values
   */
  toStringApproximately() {
    return `${MathUtil.financial(this._v[0])} ${MathUtil.financial(this._v[2])}\n${MathUtil.financial(this._v[1])} ${MathUtil.financial(this._v[3])} \n`;
  }

  /**
   * Returns the matrix elements as a flat array in column-major order.
   *
   * @returns An array containing [m00, m10, m01, m11]
   */
  flattenAsArray() {
    return [this._v[0], this._v[1], this._v[2], this._v[3]];
  }

  /**
   * Checks if this is a dummy matrix (empty data).
   *
   * @returns True if the matrix has no data, false otherwise
   */
  isDummy() {
    if (this._v.length === 0) {
      return true;
    }
    return false;
  }

  /**
   * Checks if this matrix is approximately equal to another matrix within a tolerance.
   *
   * @param mat - The matrix to compare with
   * @param delta - The tolerance for comparison (default: Number.EPSILON)
   * @returns True if all corresponding elements are within the tolerance
   */
  isEqual(mat: Matrix22, delta: number = Number.EPSILON) {
    if (
      Math.abs(mat._v[0] - this._v[0]) < delta &&
      Math.abs(mat._v[1] - this._v[1]) < delta &&
      Math.abs(mat._v[2] - this._v[2]) < delta &&
      Math.abs(mat._v[3] - this._v[3]) < delta
    ) {
      return true;
    }
    return false;
  }

  /**
   * Checks if this matrix is exactly equal to another matrix.
   * Uses strict equality comparison for all elements.
   *
   * @param mat - The matrix to compare with
   * @returns True if all corresponding elements are exactly equal
   */
  isStrictEqual(mat: Matrix22) {
    if (mat._v[0] === this._v[0] && mat._v[1] === this._v[1] && mat._v[2] === this._v[2] && mat._v[3] === this._v[3]) {
      return true;
    }
    return false;
  }

  /**
   * Gets the matrix element at the specified row and column.
   *
   * @param row_i - The row index (0 or 1)
   * @param column_i - The column index (0 or 1)
   * @returns The matrix element at the specified position
   *
   * @example
   * ```typescript
   * const mat = Matrix22.identity();
   * const m01 = mat.at(0, 1); // Returns 0
   * ```
   */
  at(row_i: number, column_i: number) {
    return this._v[row_i + column_i * 2];
  }

  /**
   * Calculates the determinant of this 2x2 matrix.
   *
   * For a 2x2 matrix | a b |, the determinant is ad - bc.
   *                   | c d |
   *
   * @returns The determinant value
   *
   * @example
   * ```typescript
   * const mat = Matrix22.fromCopy4RowMajor(2, 3, 1, 4);
   * const det = mat.determinant(); // Returns 2*4 - 3*1 = 5
   * ```
   */
  determinant() {
    return this._v[0] * this._v[3] - this._v[1] * this._v[2];
  }

  /**
   * Multiplies this matrix by a 2D vector and returns the result.
   *
   * @param vec - The 2D vector to multiply
   * @returns A new Vector2 containing the transformed vector
   *
   * @example
   * ```typescript
   * const rotation = Matrix22.rotate(Math.PI / 2);
   * const vec = Vector2.fromCopyArray2([1, 0]);
   * const result = rotation.multiplyVector(vec); // Rotates (1,0) to (0,1)
   * ```
   */
  multiplyVector(vec: Vector2) {
    const x = this._v[0] * vec._v[0] + this._v[2] * vec._v[1];
    const y = this._v[1] * vec._v[0] + this._v[3] * vec._v[1];
    return Vector2.fromCopyArray2([x, y]);
  }

  /**
   * Multiplies this matrix by a 2D vector and stores the result in the output vector.
   * This method avoids creating a new vector instance for better performance.
   *
   * @param vec - The 2D vector to multiply
   * @param outVec - The mutable vector to store the result
   * @returns The output vector containing the transformed vector
   */
  multiplyVectorTo(vec: Vector2, outVec: MutableVector2) {
    const x = this._v[0] * vec._v[0] + this._v[2] * vec._v[1];
    const y = this._v[1] * vec._v[0] + this._v[3] * vec._v[1];
    outVec._v[0] = x;
    outVec._v[1] = y;
    return outVec;
  }

  /**
   * Extracts the scale factors from this transformation matrix.
   * Calculates the length of each column vector to determine the scale.
   *
   * @returns A Vector2 containing the scale factors for x and y axes
   *
   * @example
   * ```typescript
   * const scaleAndRotation = Matrix22.multiply(
   *   Matrix22.scale(Vector2.fromCopyArray2([2, 3])),
   *   Matrix22.rotate(Math.PI / 4)
   * );
   * const scale = scaleAndRotation.getScale(); // Returns approximately [2, 3]
   * ```
   */
  getScale() {
    return Vector2.fromCopyArray2([Math.hypot(this.m00, this.m01), Math.hypot(this.m10, this.m11)]);
  }

  /**
   * Extracts the scale factors from this transformation matrix and stores them in the output vector.
   * This method avoids creating a new vector instance for better performance.
   *
   * @param outVec - The mutable vector to store the scale factors
   * @returns The output vector containing the scale factors
   */
  getScaleTo(outVec: MutableVector2) {
    outVec._v[0] = Math.hypot(this._v[0], this._v[2]);
    outVec._v[1] = Math.hypot(this._v[1], this._v[3]);
    return outVec;
  }

  /**
   * Creates a deep copy of this matrix.
   *
   * @returns A new Matrix22 instance with the same values
   */
  clone() {
    return (this.constructor as any).fromCopy4RowMajor(this._v[0], this._v[2], this._v[1], this._v[3]);
  }

  /**
   * Creates a new Matrix22 from individual components in row-major order.
   *
   * Row-major means you specify values as they appear visually:
   * ```
   * | m00 m01 |
   * | m10 m11 |
   * ```
   *
   * Note: Internally, WebGL matrices are stored in column-major order.
   *
   * @param m00 - Element at row 0, column 0
   * @param m01 - Element at row 0, column 1
   * @param m10 - Element at row 1, column 0
   * @param m11 - Element at row 1, column 1
   * @returns A new Matrix22 with the specified values
   *
   * @example
   * ```typescript
   * const mat = Matrix22.fromCopy4RowMajor(1, 2, 3, 4);
   * // Creates:
   * // | 1 2 |
   * // | 3 4 |
   * ```
   */
  static _fromCopy4RowMajor(
    m00: number,
    m01: number,
    m10: number,
    m11: number,
    type: FloatTypedArrayConstructor
  ): IMatrix22 {
    const v = new type(4);
    v[0] = m00;
    v[2] = m01;
    v[1] = m10;
    v[3] = m11;
    return new this(v, { type });
  }

  /**
   * Creates a new Matrix22 from individual components in column-major order.
   *
   * Column-major means you specify values column by column:
   * First column: m00, m10
   * Second column: m01, m11
   *
   * Note: WebGL matrices are stored in column-major order internally.
   *
   * @param m00 - Element at row 0, column 0
   * @param m10 - Element at row 1, column 0
   * @param m01 - Element at row 0, column 1
   * @param m11 - Element at row 1, column 1
   * @returns A new Matrix22 with the specified values
   */
  static _fromCopy4ColumnMajor(
    m00: number,
    m10: number,
    m01: number,
    m11: number,
    type: FloatTypedArrayConstructor
  ): IMatrix22 {
    const v = new type(4);
    v[0] = m00;
    v[2] = m01;
    v[1] = m10;
    v[3] = m11;
    return new this(v, { type });
  }

  /**
   * Creates a new Matrix22 that directly uses the provided Float32Array.
   * The array is used as-is without copying, so modifications to the array
   * will affect the matrix.
   *
   * @param float32Array - Float32Array containing matrix values in column-major order
   * @returns A new Matrix22 using the provided array
   */
  static _fromTypedArrayColumnMajor(array: TypedArray, type: FloatTypedArrayConstructor): IMatrix22 {
    return new this(array, { type });
  }

  /**
   * Creates a new Matrix22 by copying values from a Float32Array in column-major order.
   *
   * @param float32Array - Float32Array containing matrix values in column-major order
   * @returns A new Matrix22 with copied values
   */
  static _fromCopyTypedArrayColumnMajor(array: TypedArray, type: FloatTypedArrayConstructor): IMatrix22 {
    const v = new type(4);
    v.set(array);
    return new this(v, { type });
  }

  /**
   * Creates a new Matrix22 by copying values from a Float32Array in row-major order.
   *
   * @param array - Float32Array containing matrix values in row-major order
   * @returns A new Matrix22 with values converted to column-major order
   */
  static _fromCopyTypedArrayRowMajor(array: TypedArray, type: FloatTypedArrayConstructor): IMatrix22 {
    const v = new type(4);
    v[0] = array[0];
    v[2] = array[1];
    v[1] = array[2];
    v[3] = array[3];

    return new this(v, { type });
  }

  /**
   * Creates a new Matrix22 by copying values from another IMatrix22.
   *
   * @param mat - The matrix to copy from
   * @returns A new Matrix22 with copied values
   */
  static _fromCopyMatrix22(mat: IMatrix22, type: FloatTypedArrayConstructor): IMatrix22 {
    const v = new type(4);
    v[0] = mat._v[0];
    v[1] = mat._v[1];
    v[2] = mat._v[2];
    v[3] = mat._v[3];
    return new this(v, { type });
  }

  /**
   * Creates a new Matrix22 from a 4-element array in column-major order.
   *
   * @param array - Array4 containing exactly 4 numbers in column-major order
   * @returns A new Matrix22 with the array values
   */
  static _fromCopyArray4ColumnMajor(array: Array4<number>, type: FloatTypedArrayConstructor): IMatrix22 {
    const v = new type(4);
    v.set(array);
    return new this(v, { type });
  }

  /**
   * Creates a new Matrix22 from a variable-length array in column-major order.
   * Only the first 4 elements are used.
   *
   * @param array - Array containing matrix values in column-major order
   * @returns A new Matrix22 with the first 4 array values
   */
  static _fromCopyArrayColumnMajor(array: Array<number>, type: FloatTypedArrayConstructor): IMatrix22 {
    const v = new type(4);
    v.set(array);
    return new this(v, { type });
  }

  /**
   * Creates a new Matrix22 from a 4-element array in row-major order.
   *
   * @param array - Array4 containing exactly 4 numbers in row-major order
   * @returns A new Matrix22 with values converted to column-major order
   */
  static _fromCopyArray4RowMajor(array: Array4<number>, type: FloatTypedArrayConstructor): IMatrix22 {
    const v = new type(4);
    v[0] = array[0];
    v[2] = array[1];
    v[1] = array[2];
    v[3] = array[3];
    return new this(v, { type });
  }

  /**
   * Creates a new Matrix22 from a variable-length array in row-major order.
   * Only the first 4 elements are used.
   *
   * @param array - Array containing matrix values in row-major order
   * @returns A new Matrix22 with values converted to column-major order
   */
  static _fromCopyArrayRowMajor(array: Array<number>, type: FloatTypedArrayConstructor): IMatrix22 {
    const v = new type(4);
    v[0] = array[0];
    v[2] = array[1];
    v[1] = array[2];
    v[3] = array[3];
    return new this(v, { type });
  }
}

/**
 * Immutable 2x2 matrix with 32-bit float components.
 * This is the standard precision implementation for most 2D graphics operations.
 */
export class Matrix22 extends Matrix22_<Float32ArrayConstructor> {
  /**
   * Creates a new Matrix22 instance.
   * @param m - The typed array containing the matrix components
   */
  constructor(m: TypedArray) {
    super(m, { type: Float32Array });
  }

  /** Creates a zero matrix. */
  static zero(): Matrix22 {
    return super._zero(Float32Array) as Matrix22;
  }

  /** Creates an identity matrix. */
  static identity(): Matrix22 {
    return super._identity(Float32Array) as Matrix22;
  }

  /** Creates a dummy matrix with an empty array. */
  static dummy(): Matrix22 {
    return super._dummy(Float32Array) as Matrix22;
  }

  /** Creates the transpose of the given matrix. */
  static transpose(mat: IMatrix22): Matrix22 {
    return super._transpose(mat, Float32Array) as Matrix22;
  }

  /** Attempts to invert the given matrix, returning null when it is singular. */
  static tryInvert(mat: IMatrix22): Matrix22 | null {
    return super._tryInvert(mat, Float32Array) as Matrix22 | null;
  }

  /** Creates the inverse of the given matrix (identity when singular). */
  static invert(mat: IMatrix22): Matrix22 {
    return super._invert(mat, Float32Array) as Matrix22;
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
  static rotate(radian: number): Matrix22 {
    return super._rotate(radian, Float32Array) as Matrix22;
  }

  /** Creates a 2D scaling matrix. */
  static scale(vec: IVector2): Matrix22 {
    return super._scale(vec, Float32Array) as Matrix22;
  }

  /** Multiplies two 2x2 matrices. */
  static multiply(l_mat: IMatrix22, r_mat: IMatrix22): Matrix22 {
    return super._multiply(l_mat, r_mat, Float32Array) as Matrix22;
  }

  /** Multiplies two matrices and stores the result in outMat. */
  static multiplyTo<T extends IMutableMatrix22>(l_mat: IMatrix22, r_mat: IMatrix22, outMat: T): T {
    return super._multiplyTo(l_mat, r_mat, outMat) as T;
  }

  /** Creates a matrix from row-major components. */
  static fromCopy4RowMajor(m00: number, m01: number, m10: number, m11: number): Matrix22 {
    return super._fromCopy4RowMajor(m00, m01, m10, m11, Float32Array) as Matrix22;
  }

  /** Creates a matrix from column-major components. */
  static fromCopy4ColumnMajor(m00: number, m10: number, m01: number, m11: number): Matrix22 {
    return super._fromCopy4ColumnMajor(m00, m10, m01, m11, Float32Array) as Matrix22;
  }

  /** Creates a matrix that directly uses the given Float32Array. */
  static fromFloat32ArrayColumnMajor(array: Float32Array): Matrix22 {
    return super._fromTypedArrayColumnMajor(array, Float32Array) as Matrix22;
  }

  /** Creates a matrix by copying a Float32Array in column-major order. */
  static fromCopyFloat32ArrayColumnMajor(array: Float32Array): Matrix22 {
    return super._fromCopyTypedArrayColumnMajor(array, Float32Array) as Matrix22;
  }

  /** Creates a matrix by copying a Float32Array in row-major order. */
  static fromCopyFloat32ArrayRowMajor(array: Float32Array): Matrix22 {
    return super._fromCopyTypedArrayRowMajor(array, Float32Array) as Matrix22;
  }

  /** Creates a matrix by copying another matrix. */
  static fromCopyMatrix22(mat: IMatrix22): Matrix22 {
    return super._fromCopyMatrix22(mat, Float32Array) as Matrix22;
  }

  /** Creates a matrix from a 4-element array in column-major order. */
  static fromCopyArray9ColumnMajor(array: Array4<number>): Matrix22 {
    return super._fromCopyArray4ColumnMajor(array, Float32Array) as Matrix22;
  }

  /** Creates a matrix from an array in column-major order. */
  static fromCopyArrayColumnMajor(array: Array<number>): Matrix22 {
    return super._fromCopyArrayColumnMajor(array, Float32Array) as Matrix22;
  }

  /** Creates a matrix from a 4-element array in row-major order. */
  static fromCopyArray9RowMajor(array: Array4<number>): Matrix22 {
    return super._fromCopyArray4RowMajor(array, Float32Array) as Matrix22;
  }

  /** Creates a matrix from an array in row-major order. */
  static fromCopyArrayRowMajor(array: Array<number>): Matrix22 {
    return super._fromCopyArrayRowMajor(array, Float32Array) as Matrix22;
  }
}

/**
 * Immutable 2x2 matrix with 64-bit float components.
 * Use this implementation when higher numerical precision is required.
 */
export class Matrix22d extends Matrix22_<Float64ArrayConstructor> {
  /**
   * Creates a new Matrix22d instance.
   * @param m - The typed array containing the matrix components
   */
  private constructor(m: TypedArray) {
    super(m, { type: Float64Array });
  }

  /** Creates a zero matrix. */
  static zero(): Matrix22d {
    return super._zero(Float64Array) as Matrix22d;
  }

  /** Creates an identity matrix. */
  static identity(): Matrix22d {
    return super._identity(Float64Array) as Matrix22d;
  }

  /** Creates a dummy matrix with an empty array. */
  static dummy(): Matrix22d {
    return super._dummy(Float64Array) as Matrix22d;
  }

  /** Creates the transpose of the given matrix. */
  static transpose(mat: IMatrix22): Matrix22d {
    return super._transpose(mat, Float64Array) as Matrix22d;
  }

  /** Attempts to invert the given matrix, returning null when it is singular. */
  static tryInvert(mat: IMatrix22): Matrix22d | null {
    return super._tryInvert(mat, Float64Array) as Matrix22d | null;
  }

  /** Creates the inverse of the given matrix (identity when singular). */
  static invert(mat: IMatrix22): Matrix22d {
    return super._invert(mat, Float64Array) as Matrix22d;
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
  static rotate(radian: number): Matrix22d {
    return super._rotate(radian, Float64Array) as Matrix22d;
  }

  /** Creates a 2D scaling matrix. */
  static scale(vec: IVector2): Matrix22d {
    return super._scale(vec, Float64Array) as Matrix22d;
  }

  /** Multiplies two 2x2 matrices. */
  static multiply(l_mat: IMatrix22, r_mat: IMatrix22): Matrix22d {
    return super._multiply(l_mat, r_mat, Float64Array) as Matrix22d;
  }

  /** Multiplies two matrices and stores the result in outMat. */
  static multiplyTo<T extends IMutableMatrix22>(l_mat: IMatrix22, r_mat: IMatrix22, outMat: T): T {
    return super._multiplyTo(l_mat, r_mat, outMat) as T;
  }

  /** Creates a matrix from row-major components. */
  static fromCopy4RowMajor(m00: number, m01: number, m10: number, m11: number): Matrix22d {
    return super._fromCopy4RowMajor(m00, m01, m10, m11, Float64Array) as Matrix22d;
  }

  /** Creates a matrix from column-major components. */
  static fromCopy4ColumnMajor(m00: number, m10: number, m01: number, m11: number): Matrix22d {
    return super._fromCopy4ColumnMajor(m00, m10, m01, m11, Float64Array) as Matrix22d;
  }

  /** Creates a matrix that directly uses the given Float64Array. */
  static fromFloat64ArrayColumnMajor(array: Float64Array): Matrix22d {
    return super._fromTypedArrayColumnMajor(array, Float64Array) as Matrix22d;
  }

  /** Creates a matrix by copying a Float64Array in column-major order. */
  static fromCopyFloat64ArrayColumnMajor(array: Float64Array): Matrix22d {
    return super._fromCopyTypedArrayColumnMajor(array, Float64Array) as Matrix22d;
  }

  /** Creates a matrix by copying a Float64Array in row-major order. */
  static fromCopyFloat64ArrayRowMajor(array: Float64Array): Matrix22d {
    return super._fromCopyTypedArrayRowMajor(array, Float64Array) as Matrix22d;
  }

  /** Creates a matrix by copying another matrix. */
  static fromCopyMatrix22(mat: IMatrix22): Matrix22d {
    return super._fromCopyMatrix22(mat, Float64Array) as Matrix22d;
  }

  /** Creates a matrix from a 4-element array in column-major order. */
  static fromCopyArray9ColumnMajor(array: Array4<number>): Matrix22d {
    return super._fromCopyArray4ColumnMajor(array, Float64Array) as Matrix22d;
  }

  /** Creates a matrix from an array in column-major order. */
  static fromCopyArrayColumnMajor(array: Array<number>): Matrix22d {
    return super._fromCopyArrayColumnMajor(array, Float64Array) as Matrix22d;
  }

  /** Creates a matrix from a 4-element array in row-major order. */
  static fromCopyArray9RowMajor(array: Array4<number>): Matrix22d {
    return super._fromCopyArray4RowMajor(array, Float64Array) as Matrix22d;
  }

  /** Creates a matrix from an array in row-major order. */
  static fromCopyArrayRowMajor(array: Array<number>): Matrix22d {
    return super._fromCopyArrayRowMajor(array, Float64Array) as Matrix22d;
  }
}
