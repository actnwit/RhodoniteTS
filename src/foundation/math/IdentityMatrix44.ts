/* eslint-disable prettier/prettier */
import { CompositionType } from '../definitions/CompositionType';
import { AbstractMatrix } from './AbstractMatrix';
import type { IMatrix, IMatrix44 } from './IMatrix';
import type { IVector, IVector4, IMutableVector, IVector3 } from './IVector';
import type { Matrix44 } from './Matrix44';
import type { MutableVector4 } from './MutableVector4';
import { Vector3 } from './Vector3';
import type { Vector4 } from './Vector4';

/**
 * Represents a 4x4 identity matrix that provides optimized operations for identity transformations.
 * This class implements the identity matrix pattern where all diagonal elements are 1 and all other elements are 0.
 * It extends AbstractMatrix and implements both IMatrix and IMatrix44 interfaces.
 *
 * The identity matrix is immutable and provides efficient implementations since the result of many operations
 * can be computed without actual matrix multiplication.
 *
 * @example
 * ```typescript
 * const identity = new IdentityMatrix44();
 * const vector = new Vector4(1, 2, 3, 1);
 * const result = identity.multiplyVector(vector); // Returns the same vector
 * ```
 */
export class IdentityMatrix44 extends AbstractMatrix implements IMatrix, IMatrix44 {
  /**
   * Static array representing the identity matrix values in column-major order.
   * This is shared across all instances for memory efficiency.
   */
  static readonly __v = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

  /**
   * Creates a new IdentityMatrix44 instance.
   * The internal array reference points to the static identity matrix values.
   */
  constructor() {
    super();
    this._v = IdentityMatrix44.__v;
  }

  /**
   * Returns a string representation of the identity matrix in a readable format.
   * Each row is separated by newlines for visual clarity.
   *
   * @returns A formatted string showing the 4x4 identity matrix
   */
  toString(): string {
    return `1 0 0 0
0 1 0 0
0 0 1 0
0 0 0 1
`;
  }

  /**
   * Returns an approximate string representation of the matrix.
   * For identity matrix, this is identical to toString() since all values are exact.
   *
   * @returns A formatted string showing the 4x4 identity matrix
   */
  toStringApproximately(): string {
    return this.toString();
  }

  /**
   * Returns the matrix elements as a flat array in column-major order.
   *
   * @returns An array of 16 numbers representing the identity matrix
   */
  flattenAsArray(): number[] {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  }

  /**
   * Indicates whether this matrix is a dummy/placeholder matrix.
   * Identity matrix is not considered a dummy matrix.
   *
   * @returns Always false for identity matrix
   */
  isDummy(): boolean {
    return false;
  }

  /**
   * Checks if the given matrix is approximately equal to this identity matrix within a tolerance.
   * Compares each element of the input matrix against the corresponding identity matrix element.
   *
   * @param mat - The matrix to compare against this identity matrix
   * @param delta - The tolerance for floating-point comparison (default: Number.EPSILON)
   * @returns True if the matrix is approximately an identity matrix, false otherwise
   */
  isEqual(mat: IMatrix44, delta: number = Number.EPSILON): boolean {
    if (
      Math.abs(mat.m00 - 1) < delta &&
      Math.abs(mat.m10) < delta &&
      Math.abs(mat.m20) < delta &&
      Math.abs(mat.m30) < delta &&
      Math.abs(mat.m01) < delta &&
      Math.abs(mat.m11 - 1) < delta &&
      Math.abs(mat.m21) < delta &&
      Math.abs(mat.m31) < delta &&
      Math.abs(mat.m02) < delta &&
      Math.abs(mat.m12) < delta &&
      Math.abs(mat.m22 - 1) < delta &&
      Math.abs(mat.m32) < delta &&
      Math.abs(mat.m03) < delta &&
      Math.abs(mat.m13) < delta &&
      Math.abs(mat.m23) < delta &&
      Math.abs(mat.m33 - 1) < delta
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Performs a strict equality check against another matrix.
   * Uses exact floating-point comparison without tolerance.
   *
   * @param mat - The matrix to compare for strict equality
   * @returns True if the matrix is exactly an identity matrix, false otherwise
   */
  isStrictEqual(mat: IMatrix): boolean {
    const v = (mat as Matrix44)._v;
    if (
      v[0] === 1 &&
      v[1] === 0 &&
      v[2] === 0 &&
      v[3] === 0 &&
      v[4] === 0 &&
      v[5] === 1 &&
      v[6] === 0 &&
      v[7] === 0 &&
      v[8] === 0 &&
      v[9] === 0 &&
      v[10] === 1 &&
      v[11] === 0 &&
      v[12] === 0 &&
      v[13] === 0 &&
      v[14] === 0 &&
      v[15] === 1
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Gets the matrix element at the specified row and column indices.
   * For identity matrix, returns 1 for diagonal elements and 0 for off-diagonal elements.
   *
   * @param row_i - The row index (0-based)
   * @param column_i - The column index (0-based)
   * @returns 1 if row equals column (diagonal), 0 otherwise
   */
  at(row_i: number, column_i: number): number {
    return row_i === column_i ? 1 : 0;
  }

  /**
   * Gets the matrix element at the specified linear index in column-major order.
   * For identity matrix, returns 1 for diagonal positions and 0 elsewhere.
   *
   * @param i - The linear index (0-15) in column-major order
   * @returns 1 for diagonal elements (indices 0, 5, 10, 15), 0 otherwise
   */
  v(i: number): number {
    return i % 5 === 0 ? 1 : 0;
  }

  /**
   * Calculates the determinant of this identity matrix.
   * The determinant of an identity matrix is always 1.
   *
   * @returns Always returns 1
   */
  determinant(): number {
    return 1;
  }

  /**
   * Multiplies this identity matrix with a 4D vector.
   * Since this is an identity matrix, the result is the input vector unchanged.
   *
   * @param vec - The 4D vector to multiply
   * @returns The same vector (identity transformation)
   */
  multiplyVector(vec: IVector4): IVector4 {
    return vec;
  }

  /**
   * Multiplies this identity matrix with a 3D vector.
   * Since this is an identity matrix, the result is the input vector unchanged.
   *
   * @param vec - The 3D vector to multiply
   * @returns The same vector (identity transformation)
   */
  multiplyVector3(vec: IVector3): IVector3 {
    return vec;
  }

  /**
   * Multiplies this identity matrix with a vector and stores the result in an output vector.
   * Since this is an identity matrix, copies the input vector to the output vector.
   *
   * @param vec - The input vector to multiply
   * @param outVec - The mutable vector to store the result
   * @returns The output vector containing the copied values
   */
  multiplyVectorTo(vec: IVector, outVec: IMutableVector): IMutableVector {
    const v = (vec as Vector4)._v;
    outVec._v[0] = v[0];
    outVec._v[1] = v[1];
    outVec._v[2] = v[2];
    outVec._v[3] = v[3];

    return outVec;
  }

  /**
   * Extracts the scale components from this transformation matrix.
   * For identity matrix, the scale is (1, 1, 1).
   *
   * @returns A Vector3 with all components set to 1
   */
  getScale(): IVector3 {
    return Vector3.one();
  }

  /**
   * Extracts the scale components and stores them in an output vector.
   * For identity matrix, sets all scale components to 1.
   *
   * @param outVec - The mutable vector to store the scale values
   * @returns The output vector with scale components set to 1
   */
  getScaleTo(outVec: IMutableVector): IMutableVector {
    const v = (outVec as MutableVector4)._v;

    v[0] = 1;
    v[1] = 1;
    v[2] = 1;

    return outVec;
  }

  /**
   * Creates a copy of this identity matrix.
   * Returns a new IdentityMatrix44 instance.
   *
   * @returns A new IdentityMatrix44 instance
   */
  clone(): IMatrix44 {
    return new IdentityMatrix44();
  }

  /**
   * Extracts the rotation part of this transformation matrix.
   * For identity matrix, the rotation is also an identity matrix.
   *
   * @returns A new IdentityMatrix44 representing no rotation
   */
  getRotate(): IMatrix44 {
    return new IdentityMatrix44();
  }

  /**
   * Extracts the translation components from this transformation matrix.
   * For identity matrix, the translation is (0, 0, 0).
   *
   * @returns A Vector3 with all components set to 0
   */
  getTranslate(): IVector3 {
    return Vector3.zero();
  }

  /**
   * Gets the matrix element at row 0, column 0.
   * @returns Always 1 for identity matrix
   */
  public get m00() {
    return 1;
  }

  /**
   * Gets the matrix element at row 1, column 0.
   * @returns Always 0 for identity matrix
   */
  public get m10() {
    return 0;
  }

  /**
   * Gets the matrix element at row 2, column 0.
   * @returns Always 0 for identity matrix
   */
  public get m20() {
    return 0;
  }

  /**
   * Gets the matrix element at row 3, column 0.
   * @returns Always 0 for identity matrix
   */
  public get m30() {
    return 0;
  }

  /**
   * Gets the matrix element at row 0, column 1.
   * @returns Always 0 for identity matrix
   */
  public get m01() {
    return 0;
  }

  /**
   * Gets the matrix element at row 1, column 1.
   * @returns Always 1 for identity matrix
   */
  public get m11() {
    return 1;
  }

  /**
   * Gets the matrix element at row 2, column 1.
   * @returns Always 0 for identity matrix
   */
  public get m21() {
    return 0;
  }

  /**
   * Gets the matrix element at row 3, column 1.
   * @returns Always 0 for identity matrix
   */
  public get m31() {
    return 0;
  }

  /**
   * Gets the matrix element at row 0, column 2.
   * @returns Always 0 for identity matrix
   */
  public get m02() {
    return 0;
  }

  /**
   * Gets the matrix element at row 1, column 2.
   * @returns Always 0 for identity matrix
   */
  public get m12() {
    return 0;
  }

  /**
   * Gets the matrix element at row 2, column 2.
   * @returns Always 1 for identity matrix
   */
  public get m22() {
    return 1;
  }

  /**
   * Gets the matrix element at row 3, column 2.
   * @returns Always 0 for identity matrix
   */
  public get m32() {
    return 0;
  }

  /**
   * Gets the matrix element at row 0, column 3.
   * @returns Always 0 for identity matrix
   */
  public get m03() {
    return 0;
  }

  /**
   * Gets the matrix element at row 1, column 3.
   * @returns Always 0 for identity matrix
   */
  public get m13() {
    return 0;
  }

  /**
   * Gets the matrix element at row 2, column 3.
   * @returns Always 0 for identity matrix
   */
  public get m23() {
    return 0;
  }

  /**
   * Gets the matrix element at row 3, column 3.
   * @returns Always 1 for identity matrix
   */
  public get m33() {
    return 1;
  }

  /**
   * Gets the X translation component from the matrix.
   * @returns Always 0 for identity matrix
   */
  public get translateX() {
    return 0;
  }

  /**
   * Gets the Y translation component from the matrix.
   * @returns Always 0 for identity matrix
   */
  public get translateY() {
    return 0;
  }

  /**
   * Gets the Z translation component from the matrix.
   * @returns Always 0 for identity matrix
   */
  public get translateZ() {
    return 0;
  }

  /**
   * Gets the class name for debugging and reflection purposes.
   * @returns The string 'IdentityMatrix44'
   */
  get className() {
    return 'IdentityMatrix44';
  }

  /**
   * Gets the composition type for this matrix class.
   * @returns CompositionType.Mat4 indicating this is a 4x4 matrix
   */
  static get compositionType() {
    return CompositionType.Mat4;
  }

  /**
   * Indicates whether this matrix is an identity matrix class.
   * @returns Always true for IdentityMatrix44
   */
  get isIdentityMatrixClass(): boolean {
    return true;
  }
}
