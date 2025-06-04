/* eslint-disable prettier/prettier */
import { CompositionType } from '../definitions/CompositionType';
import { AbstractMatrix } from './AbstractMatrix';
import { IMatrix, IMatrix33 } from './IMatrix';
import { IVector, IMutableVector } from './IVector';
import { Matrix33 } from './Matrix33';
import { MutableVector3 } from './MutableVector3';
import { Vector3 } from './Vector3';

/**
 * A 3x3 identity matrix implementation that represents the multiplicative identity for 3x3 matrices.
 * This matrix has 1s on the main diagonal and 0s elsewhere:
 * ```
 * [1 0 0]
 * [0 1 0]
 * [0 0 1]
 * ```
 *
 * This class is optimized for identity matrix operations and provides constant-time
 * access to matrix elements without storing the actual matrix data.
 */
export class IdentityMatrix33 extends AbstractMatrix implements IMatrix, IMatrix33 {
  /** Shared Float32Array containing the identity matrix values [1,0,0,0,1,0,0,0,1] */
  static readonly __v = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);

  /**
   * Creates a new 3x3 identity matrix instance.
   * Uses a shared static array for memory efficiency.
   */
  constructor() {
    super();
    this._v = IdentityMatrix33.__v;
  }

  /**
   * Returns a string representation of the identity matrix in a readable format.
   * @returns A formatted string showing the 3x3 identity matrix
   */
  toString(): string {
    return `1 0 0
0 1 0
0 0 1
`;
  }

  /**
   * Returns an approximate string representation of the matrix.
   * For identity matrix, this is identical to toString() since all values are exact.
   * @returns A formatted string showing the 3x3 identity matrix
   */
  toStringApproximately(): string {
    return this.toString();
  }

  /**
   * Returns the matrix elements as a flattened array in row-major order.
   * @returns An array containing [1,0,0,0,1,0,0,0,1]
   */
  flattenAsArray(): number[] {
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  }

  /**
   * Indicates whether this matrix is a dummy/placeholder matrix.
   * Identity matrices are never considered dummy matrices.
   * @returns Always false for identity matrices
   */
  isDummy(): boolean {
    return false;
  }

  /**
   * Checks if another matrix is approximately equal to this identity matrix within a tolerance.
   * @param mat - The matrix to compare against
   * @param delta - The tolerance for floating-point comparison (default: Number.EPSILON)
   * @returns True if the matrix is approximately an identity matrix
   */
  isEqual(mat: IMatrix33, delta: number = Number.EPSILON): boolean {
    if (
      Math.abs(mat.m00 - 1) < delta &&
      Math.abs(mat.m10) < delta &&
      Math.abs(mat.m20) < delta &&
      Math.abs(mat.m01) < delta &&
      Math.abs(mat.m11 - 1) < delta &&
      Math.abs(mat.m21) < delta &&
      Math.abs(mat.m02) < delta &&
      Math.abs(mat.m12) < delta &&
      Math.abs(mat.m22 - 1) < delta
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Checks if another matrix is strictly equal to this identity matrix (exact comparison).
   * Note: This method appears to have a bug - it checks 16 elements instead of 9 for a 3x3 matrix.
   * @param mat - The matrix to compare against
   * @returns True if the matrix is exactly an identity matrix
   */
  isStrictEqual(mat: IMatrix33): boolean {
    const v = (mat as Matrix33)._v;
    if (
      v[0] === 1 &&
      v[1] === 0 &&
      v[2] === 0 &&
      v[3] === 0 &&
      v[4] === 0 &&
      v[5] === 0 &&
      v[6] === 0 &&
      v[7] === 0 &&
      v[8] === 0 &&
      v[9] === 0 &&
      v[10] === 0 &&
      v[11] === 0 &&
      v[12] === 0 &&
      v[13] === 0 &&
      v[14] === 0 &&
      v[15] === 0
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Gets the matrix element at the specified row and column.
   * For identity matrix: returns 1 if row equals column, 0 otherwise.
   * @param row_i - The row index (0-2)
   * @param column_i - The column index (0-2)
   * @returns The matrix element value
   */
  at(row_i: number, column_i: number): number {
    return row_i === column_i ? 1 : 0;
  }

  /**
   * Calculates the determinant of the identity matrix.
   * The determinant of any identity matrix is always 1.
   * @returns Always returns 1
   */
  determinant(): number {
    return 1;
  }

  /**
   * Multiplies this identity matrix with a vector.
   * Since this is an identity matrix, the result is the original vector unchanged.
   * @param vec - The vector to multiply
   * @returns The same vector (identity operation)
   */
  multiplyVector(vec: IVector): IVector {
    return vec;
  }

  /**
   * Multiplies this identity matrix with a vector and stores the result in an output vector.
   * Since this is an identity matrix, this copies the input vector to the output vector.
   * @param vec - The input vector to multiply
   * @param outVec - The output vector to store the result
   * @returns The output vector containing the result
   */
  multiplyVectorTo(vec: IVector, outVec: IMutableVector): IMutableVector {
    const v = (vec as Vector3)._v;
    outVec._v[0] = v[0];
    outVec._v[1] = v[1];
    outVec._v[2] = v[2];
    outVec._v[3] = v[3];

    return outVec;
  }

  /**
   * Gets the scale components from this matrix.
   * For identity matrix, all scale components are 1.
   * @returns A Vector3 with components [1, 1, 1]
   */
  getScale(): IVector {
    return Vector3.fromCopyArray([1, 1, 1]);
  }

  /**
   * Gets the scale components from this matrix and stores them in an output vector.
   * For identity matrix, all scale components are 1.
   * @param outVec - The output vector to store the scale values
   * @returns The output vector containing [1, 1, 1]
   */
  getScaleTo(outVec: IMutableVector): IMutableVector {
    const v = (outVec as MutableVector3)._v;

    v[0] = 1;
    v[1] = 1;
    v[2] = 1;

    return outVec;
  }

  /**
   * Creates a copy of this identity matrix.
   * @returns A new IdentityMatrix33 instance
   */
  clone(): IMatrix33 {
    return new IdentityMatrix33();
  }

  /**
   * Extracts the rotation part of this matrix.
   * For identity matrix, the rotation is also identity (no rotation).
   * @returns A new IdentityMatrix33 instance representing no rotation
   */
  getRotate(): IMatrix33 {
    return new IdentityMatrix33();
  }

  /** Gets the matrix element at row 0, column 0 */
  public get m00() {
    return 1;
  }

  /** Gets the matrix element at row 1, column 0 */
  public get m10() {
    return 0;
  }

  /** Gets the matrix element at row 2, column 0 */
  public get m20() {
    return 0;
  }

  /** Gets the matrix element at row 3, column 0 (not applicable for 3x3 matrix) */
  public get m30() {
    return 0;
  }

  /** Gets the matrix element at row 0, column 1 */
  public get m01() {
    return 0;
  }

  /** Gets the matrix element at row 1, column 1 */
  public get m11() {
    return 1;
  }

  /** Gets the matrix element at row 2, column 1 */
  public get m21() {
    return 0;
  }

  /** Gets the matrix element at row 3, column 1 (not applicable for 3x3 matrix) */
  public get m31() {
    return 0;
  }

  /** Gets the matrix element at row 0, column 2 */
  public get m02() {
    return 0;
  }

  /** Gets the matrix element at row 1, column 2 */
  public get m12() {
    return 0;
  }

  /** Gets the matrix element at row 1, column 2 */
  public get m22() {
    return 1;
  }

  /** Gets the matrix element at row 3, column 2 (not applicable for 3x3 matrix) */
  public get m32() {
    return 0;
  }

  /** Gets the matrix element at row 0, column 3 (not applicable for 3x3 matrix) */
  public get m03() {
    return 0;
  }

  /** Gets the matrix element at row 1, column 3 (not applicable for 3x3 matrix) */
  public get m13() {
    return 0;
  }

  /** Gets the matrix element at row 2, column 3 (not applicable for 3x3 matrix) */
  public get m23() {
    return 0;
  }

  /** Gets the matrix element at row 3, column 3 (not applicable for 3x3 matrix) */
  public get m33() {
    return 1;
  }

  /** Gets the class name for debugging and reflection purposes */
  get className() {
    return 'IdentityMatrix33';
  }

  /** Gets the composition type for this matrix class */
  static get compositionType() {
    return CompositionType.Mat3;
  }

  /** Indicates that this is an identity matrix class implementation */
  get isIdentityMatrixClass(): boolean {
    return true;
  }
}
