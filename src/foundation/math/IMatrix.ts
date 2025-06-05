import {
  IVector,
  IVector2,
  IMutableVector2,
  IVector3,
  IMutableVector3,
  IVector4,
  IMutableVector4,
} from './IVector';
import { TypedArray, Index } from '../../types/CommonTypes';
import { IQuaternion } from './IQuaternion';

/**
 * Base interface for immutable matrix operations.
 * Provides read-only access to matrix data and basic mathematical operations.
 */
export interface IMatrix {
  /** Internal typed array storing matrix data in column-major order */
  _v: Float32Array;

  /** Returns the class name of the matrix implementation */
  readonly className: string;

  /**
   * Converts the matrix to a string representation.
   * @returns String representation of the matrix
   */
  toString(): string;

  /**
   * Converts the matrix to an approximate string representation.
   * @returns Approximate string representation with rounded values
   */
  toStringApproximately(): string;

  /**
   * Flattens the matrix into a plain JavaScript array.
   * @returns Array containing all matrix elements
   */
  flattenAsArray(): Array<number>;

  /**
   * Checks if this is a dummy/placeholder matrix.
   * @returns True if this is a dummy matrix
   */
  isDummy(): boolean;

  /**
   * Gets the value at the specified row and column.
   * @param row_i - Row index (0-based)
   * @param column_i - Column index (0-based)
   * @returns Value at the specified position
   */
  at(row_i: number, column_i: number): number;

  /**
   * Gets the value at the specified linear index.
   * @param i - Linear index in the internal array
   * @returns Value at the specified index
   */
  v(i: number): number;

  /**
   * Calculates the determinant of the matrix.
   * @returns Determinant value
   */
  determinant(): number;

  /** Indicates if this matrix is an identity matrix class */
  readonly isIdentityMatrixClass: boolean;

  /**
   * Checks if the internal array buffer is the same as the provided one.
   * @param arrayBuffer - Array buffer to compare against
   * @returns True if the source is the same
   */
  isTheSourceSame(arrayBuffer: ArrayBuffer): boolean;
}

/**
 * Interface for mutable matrix operations.
 * Extends IMatrix with methods that modify the matrix in place.
 */
export interface IMutableMatrix extends IMatrix {
  /**
   * Creates a deep copy of this matrix.
   * @returns New mutable matrix with the same values
   */
  clone(): IMutableMatrix;

  /**
   * Gets the raw typed array containing matrix data.
   * @returns Raw typed array
   */
  raw(): TypedArray;

  /**
   * Sets the value at the specified row and column.
   * @param row_i - Row index (0-based)
   * @param column_i - Column index (0-based)
   * @param value - Value to set
   */
  setAt(row_i: number, column_i: number, value: number): void;

  /**
   * Sets all matrix components from individual values.
   * @param num - Variable number of numeric values
   * @returns This matrix for method chaining
   */
  setComponents(...num: number[]): IMutableMatrix;

  /**
   * Copies components from another matrix.
   * @param mat - Source matrix to copy from
   * @returns This matrix for method chaining
   */
  copyComponents(mat: IMatrix): IMutableMatrix;

  /**
   * Sets all matrix elements to zero.
   * @returns This matrix for method chaining
   */
  zero(): IMutableMatrix;

  /**
   * Sets this matrix to the identity matrix.
   * @returns This matrix for method chaining
   */
  identity(): IMutableMatrix;

  /**
   * Swaps two elements in the internal array.
   * @param l - Left index
   * @param r - Right index
   */
  _swap(l: Index, r: Index): void;

  /**
   * Transposes this matrix in place.
   * @returns This matrix for method chaining
   */
  transpose(): IMutableMatrix;

  /**
   * Inverts this matrix in place.
   * @returns This matrix for method chaining
   */
  invert(): IMutableMatrix;

  /**
   * Applies a rotation to this matrix.
   * @param any - Rotation parameters (type varies by matrix dimension)
   * @returns This matrix for method chaining
   */
  rotate(any: any): IMutableMatrix;

  /**
   * Applies scaling to this matrix.
   * @param vec - Scale vector
   * @returns This matrix for method chaining
   */
  scale(vec: IVector): IMutableMatrix;

  /**
   * Multiplies this matrix by a scale vector.
   * @param vec - Scale vector
   * @returns This matrix for method chaining
   */
  multiplyScale(vec: IVector): IMutableMatrix;

  /**
   * Multiplies this matrix by another matrix.
   * @param mat - Matrix to multiply by
   * @returns This matrix for method chaining
   */
  multiply(mat: IMatrix): IMutableMatrix;

  /**
   * Multiplies this matrix by another matrix from the left.
   * @param mat - Matrix to multiply from the left
   * @returns This matrix for method chaining
   */
  multiplyByLeft(mat: IMatrix): IMutableMatrix;
}

/**
 * Interface for immutable 2x2 matrices.
 * Provides specific operations for 2D transformations.
 */
export interface IMatrix22 extends IMatrix {
  /** Element at row 0, column 0 */
  readonly m00: number;
  /** Element at row 0, column 1 */
  readonly m01: number;
  /** Element at row 1, column 0 */
  readonly m10: number;
  /** Element at row 1, column 1 */
  readonly m11: number;

  /**
   * Checks if this matrix is approximately equal to another matrix.
   * @param mat - Matrix to compare against
   * @param delta - Optional tolerance for comparison (default: small epsilon)
   * @returns True if matrices are approximately equal
   */
  isEqual(mat: IMatrix22, delta?: number): boolean;

  /**
   * Checks if this matrix is strictly equal to another matrix.
   * @param mat - Matrix to compare against
   * @returns True if matrices are exactly equal
   */
  isStrictEqual(mat: IMatrix22): boolean;

  /**
   * Calculates the determinant of this 2x2 matrix.
   * @returns Determinant value
   */
  determinant(): number;

  /**
   * Multiplies this matrix by a 2D vector.
   * @param vec - 2D vector to multiply
   * @returns Resulting 2D vector
   */
  multiplyVector(vec: IVector2): IVector2;

  /**
   * Multiplies this matrix by a 2D vector and stores the result in an output vector.
   * @param vec - 2D vector to multiply
   * @param outVec - Output vector to store the result
   * @returns The output vector for method chaining
   */
  multiplyVectorTo(vec: IVector2, outVec: IMutableVector2): IMutableVector2;

  /**
   * Extracts the scale factors from this matrix.
   * @returns 2D vector containing scale factors
   */
  getScale(): IVector2;

  /**
   * Extracts the scale factors from this matrix and stores them in an output vector.
   * @param outVec - Output vector to store the scale factors
   * @returns The output vector for method chaining
   */
  getScaleTo(outVec: IMutableVector2): IMutableVector2;

  /**
   * Creates a deep copy of this matrix.
   * @returns New immutable 2x2 matrix with the same values
   */
  clone(): IMatrix22;
}

/**
 * Interface for mutable 2x2 matrices.
 * Provides modifiable 2x2 matrix operations for 2D transformations.
 */
export interface IMutableMatrix22 {
  /** Element at row 0, column 0 */
  m00: number;
  /** Element at row 0, column 1 */
  m01: number;
  /** Element at row 1, column 0 */
  m10: number;
  /** Element at row 1, column 1 */
  m11: number;

  // common with immutable matrix22
  /**
   * Converts the matrix to a string representation.
   * @returns String representation of the matrix
   */
  toString(): string;

  /**
   * Converts the matrix to an approximate string representation.
   * @returns Approximate string representation with rounded values
   */
  toStringApproximately(): string;

  /**
   * Flattens the matrix into a plain JavaScript array.
   * @returns Array containing all matrix elements
   */
  flattenAsArray(): Array<number>;

  /**
   * Checks if this is a dummy/placeholder matrix.
   * @returns True if this is a dummy matrix
   */
  isDummy(): boolean;

  /**
   * Checks if this matrix is approximately equal to another matrix.
   * @param mat - Matrix to compare against
   * @param delta - Optional tolerance for comparison (default: small epsilon)
   * @returns True if matrices are approximately equal
   */
  isEqual(mat: IMatrix22, delta?: number): boolean;

  /**
   * Checks if this matrix is strictly equal to another matrix.
   * @param mat - Matrix to compare against
   * @returns True if matrices are exactly equal
   */
  isStrictEqual(mat: IMatrix22): boolean;

  /**
   * Gets the value at the specified row and column.
   * @param row_i - Row index (0-based)
   * @param column_i - Column index (0-based)
   * @returns Value at the specified position
   */
  at(row_i: number, column_i: number): number;

  /**
   * Calculates the determinant of this 2x2 matrix.
   * @returns Determinant value
   */
  determinant(): number;

  /**
   * Multiplies this matrix by a 2D vector.
   * @param vec - 2D vector to multiply
   * @returns Resulting 2D vector
   */
  multiplyVector(vec: IVector2): IVector2;

  /**
   * Multiplies this matrix by a 2D vector and stores the result in an output vector.
   * @param vec - 2D vector to multiply
   * @param outVec - Output vector to store the result
   * @returns The output vector for method chaining
   */
  multiplyVectorTo(vec: IVector2, outVec: IMutableVector2): IMutableVector2;

  /**
   * Extracts the scale factors from this matrix.
   * @returns 2D vector containing scale factors
   */
  getScale(): IVector2;

  /**
   * Extracts the scale factors from this matrix and stores them in an output vector.
   * @param outVec - Output vector to store the scale factors
   * @returns The output vector for method chaining
   */
  getScaleTo(outVec: IMutableVector2): IMutableVector2;

  // only for mutable matrix22
  /**
   * Creates a deep copy of this matrix.
   * @returns New mutable 2x2 matrix with the same values
   */
  clone(): IMutableMatrix22; // override

  /**
   * Gets the raw typed array containing matrix data.
   * @returns Raw typed array
   */
  raw(): TypedArray;

  /**
   * Sets the value at the specified row and column.
   * @param row_i - Row index (0-based)
   * @param column_i - Column index (0-based)
   * @param value - Value to set
   * @returns This matrix for method chaining
   */
  setAt(row_i: number, column_i: number, value: number): IMutableMatrix22;

  /**
   * Sets all matrix components from individual values.
   * @param m00 - Element at row 0, column 0
   * @param m01 - Element at row 0, column 1
   * @param m10 - Element at row 1, column 0
   * @param m11 - Element at row 1, column 1
   * @returns This matrix for method chaining
   */
  setComponents(m00: number, m01: number, m10: number, m11: number): IMutableMatrix22;

  /**
   * Copies components from another matrix.
   * @param mat - Source matrix to copy from
   * @returns This matrix for method chaining
   */
  copyComponents(mat: IMatrix22 | IMatrix33 | IMatrix44): IMutableMatrix22;

  /**
   * Sets all matrix elements to zero.
   * @returns This matrix for method chaining
   */
  zero(): IMutableMatrix22;

  /**
   * Sets this matrix to the identity matrix.
   * @returns This matrix for method chaining
   */
  identity(): IMutableMatrix22;

  /**
   * Swaps two elements in the internal array.
   * @param l - Left index
   * @param r - Right index
   */
  _swap(l: Index, r: Index): void;

  /**
   * Transposes this matrix in place.
   * @returns This matrix for method chaining
   */
  transpose(): IMutableMatrix22;

  /**
   * Inverts this matrix in place.
   * @returns This matrix for method chaining
   */
  invert(): IMutableMatrix22;

  /**
   * Applies a 2D rotation to this matrix.
   * @param radian - Rotation angle in radians
   * @returns This matrix for method chaining
   */
  rotate(radian: number): IMutableMatrix22;

  /**
   * Applies scaling to this matrix.
   * @param vec - 2D scale vector
   * @returns This matrix for method chaining
   */
  scale(vec: IVector2): IMutableMatrix22;

  /**
   * Multiplies this matrix by a scale vector.
   * @param vec - 2D scale vector
   * @returns This matrix for method chaining
   */
  multiplyScale(vec: IVector2): IMutableMatrix22;

  /**
   * Multiplies this matrix by another 2x2 matrix.
   * @param mat - Matrix to multiply by
   * @returns This matrix for method chaining
   */
  multiply(mat: IMatrix22): IMutableMatrix22;

  /**
   * Multiplies this matrix by another 2x2 matrix from the left.
   * @param mat - Matrix to multiply from the left
   * @returns This matrix for method chaining
   */
  multiplyByLeft(mat: IMatrix22): IMutableMatrix22;
}

/**
 * Interface for immutable 3x3 matrices.
 * Provides specific operations for 3D transformations without translation.
 */
export interface IMatrix33 extends IMatrix {
  /** Element at row 0, column 0 */
  readonly m00: number;
  /** Element at row 0, column 1 */
  readonly m01: number;
  /** Element at row 0, column 2 */
  readonly m02: number;
  /** Element at row 1, column 0 */
  readonly m10: number;
  /** Element at row 1, column 1 */
  readonly m11: number;
  /** Element at row 1, column 2 */
  readonly m12: number;
  /** Element at row 2, column 0 */
  readonly m20: number;
  /** Element at row 2, column 1 */
  readonly m21: number;
  /** Element at row 2, column 2 */
  readonly m22: number;

  /**
   * Checks if this matrix is approximately equal to another matrix.
   * @param mat - Matrix to compare against
   * @param delta - Optional tolerance for comparison (default: small epsilon)
   * @returns True if matrices are approximately equal
   */
  isEqual(mat: IMatrix33, delta?: number): boolean;

  /**
   * Checks if this matrix is strictly equal to another matrix.
   * @param mat - Matrix to compare against
   * @returns True if matrices are exactly equal
   */
  isStrictEqual(mat: IMatrix33): boolean;

  /**
   * Creates a deep copy of this matrix.
   * @returns New immutable 3x3 matrix with the same values
   */
  clone(): IMatrix33;
}

/**
 * Interface for mutable 3x3 matrices.
 * Provides modifiable 3x3 matrix operations for 3D transformations without translation.
 */
export interface IMutableMatrix33 {
  /** Element at row 0, column 0 */
  m00: number;
  /** Element at row 0, column 1 */
  m01: number;
  /** Element at row 0, column 2 */
  m02: number;
  /** Element at row 1, column 0 */
  m10: number;
  /** Element at row 1, column 1 */
  m11: number;
  /** Element at row 1, column 2 */
  m12: number;
  /** Element at row 2, column 0 */
  m20: number;
  /** Element at row 2, column 1 */
  m21: number;
  /** Element at row 2, column 2 */
  m22: number;

  // common with immutable matrix33
  /**
   * Converts the matrix to a string representation.
   * @returns String representation of the matrix
   */
  toString(): string;

  /**
   * Converts the matrix to an approximate string representation.
   * @returns Approximate string representation with rounded values
   */
  toStringApproximately(): string;

  /**
   * Flattens the matrix into a plain JavaScript array.
   * @returns Array containing all matrix elements
   */
  flattenAsArray(): Array<number>;

  /**
   * Checks if this is a dummy/placeholder matrix.
   * @returns True if this is a dummy matrix
   */
  isDummy(): boolean;

  /**
   * Checks if this matrix is approximately equal to another matrix.
   * @param mat - Matrix to compare against
   * @param delta - Optional tolerance for comparison (default: small epsilon)
   * @returns True if matrices are approximately equal
   */
  isEqual(mat: IMatrix33, delta?: number): boolean;

  /**
   * Checks if this matrix is strictly equal to another matrix.
   * @param mat - Matrix to compare against
   * @returns True if matrices are exactly equal
   */
  isStrictEqual(mat: IMatrix33): boolean;

  /**
   * Gets the value at the specified row and column.
   * @param row_i - Row index (0-based)
   * @param column_i - Column index (0-based)
   * @returns Value at the specified position
   */
  at(row_i: number, column_i: number): number;

  /**
   * Calculates the determinant of this 3x3 matrix.
   * @returns Determinant value
   */
  determinant(): number;

  /**
   * Multiplies this matrix by a 3D vector.
   * @param vec - 3D vector to multiply
   * @returns Resulting 3D vector
   */
  multiplyVector(vec: IVector3): IVector3;

  /**
   * Multiplies this matrix by a 3D vector and stores the result in an output vector.
   * @param vec - 3D vector to multiply
   * @param outVec - Output vector to store the result
   * @returns The output vector for method chaining
   */
  multiplyVectorTo(vec: IVector3, outVec: IMutableVector3): IMutableVector3;

  /**
   * Extracts the scale factors from this matrix.
   * @returns 3D vector containing scale factors
   */
  getScale(): IVector3;

  /**
   * Extracts the scale factors from this matrix and stores them in an output vector.
   * @param outVec - Output vector to store the scale factors
   * @returns The output vector for method chaining
   */
  getScaleTo(outVec: IMutableVector3): IMutableVector3;

  // only for mutable matrix33
  /**
   * Creates a deep copy of this matrix.
   * @returns New mutable 3x3 matrix with the same values
   */
  clone(): IMutableMatrix33; // override

  /**
   * Gets the raw typed array containing matrix data.
   * @returns Raw typed array
   */
  raw(): TypedArray;

  /**
   * Sets the value at the specified row and column.
   * @param row_i - Row index (0-based)
   * @param column_i - Column index (0-based)
   * @param value - Value to set
   * @returns This matrix for method chaining
   */
  setAt(row_i: number, column_i: number, value: number): IMutableMatrix33;

  /**
   * Sets all matrix components from individual values.
   * @param m00 - Element at row 0, column 0
   * @param m01 - Element at row 0, column 1
   * @param m02 - Element at row 0, column 2
   * @param m10 - Element at row 1, column 0
   * @param m11 - Element at row 1, column 1
   * @param m12 - Element at row 1, column 2
   * @param m20 - Element at row 2, column 0
   * @param m21 - Element at row 2, column 1
   * @param m22 - Element at row 2, column 2
   * @returns This matrix for method chaining
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
  ): IMutableMatrix33;

  /**
   * Copies components from another matrix.
   * @param mat - Source matrix to copy from
   * @returns This matrix for method chaining
   */
  copyComponents(mat: IMatrix33 | IMatrix44): IMutableMatrix33;

  /**
   * Sets all matrix elements to zero.
   * @returns This matrix for method chaining
   */
  zero(): IMutableMatrix33;

  /**
   * Sets this matrix to the identity matrix.
   * @returns This matrix for method chaining
   */
  identity(): IMutableMatrix33;

  /**
   * Swaps two elements in the internal array.
   * @param l - Left index
   * @param r - Right index
   */
  _swap(l: Index, r: Index): void;

  /**
   * Transposes this matrix in place.
   * @returns This matrix for method chaining
   */
  transpose(): IMutableMatrix33;

  /**
   * Inverts this matrix in place.
   * @returns This matrix for method chaining
   */
  invert(): IMutableMatrix33;

  /**
   * Applies a rotation around the X-axis to this matrix.
   * @param radian - Rotation angle in radians
   * @returns This matrix for method chaining
   */
  rotateX(radian: number): IMutableMatrix33;

  /**
   * Applies a rotation around the Y-axis to this matrix.
   * @param radian - Rotation angle in radians
   * @returns This matrix for method chaining
   */
  rotateY(radian: number): IMutableMatrix33;

  /**
   * Applies a rotation around the Z-axis to this matrix.
   * @param radian - Rotation angle in radians
   * @returns This matrix for method chaining
   */
  rotateZ(radian: number): IMutableMatrix33;

  /**
   * Applies rotations around X, Y, and Z axes in that order.
   * @param x - Rotation around X-axis in radians
   * @param y - Rotation around Y-axis in radians
   * @param z - Rotation around Z-axis in radians
   * @returns This matrix for method chaining
   */
  rotateXYZ(x: number, y: number, z: number): IMutableMatrix33;

  /**
   * Applies a rotation specified by a 3D vector (Euler angles).
   * @param vec3 - 3D vector containing rotation angles
   * @returns This matrix for method chaining
   */
  rotate(vec3: IVector3): IMutableMatrix33;

  /**
   * Applies scaling to this matrix.
   * @param vec - 3D scale vector
   * @returns This matrix for method chaining
   */
  scale(vec: IVector3): IMutableMatrix33;

  /**
   * Multiplies this matrix by a scale vector.
   * @param vec - 3D scale vector
   * @returns This matrix for method chaining
   */
  multiplyScale(vec: IVector3): IMutableMatrix33;

  /**
   * Multiplies this matrix by another 3x3 matrix.
   * @param mat - Matrix to multiply by
   * @returns This matrix for method chaining
   */
  multiply(mat: IMatrix33): IMutableMatrix33;

  /**
   * Multiplies this matrix by another 3x3 matrix from the left.
   * @param mat - Matrix to multiply from the left
   * @returns This matrix for method chaining
   */
  multiplyByLeft(mat: IMatrix33): IMutableMatrix33;
}

/**
 * Interface for immutable 4x4 matrices.
 * Provides specific operations for 3D transformations including translation.
 */
export interface IMatrix44 extends IMatrix {
  /** Element at row 0, column 0 */
  readonly m00: number;
  /** Element at row 0, column 1 */
  readonly m01: number;
  /** Element at row 0, column 2 */
  readonly m02: number;
  /** Element at row 0, column 3 */
  readonly m03: number;
  /** Element at row 1, column 0 */
  readonly m10: number;
  /** Element at row 1, column 1 */
  readonly m11: number;
  /** Element at row 1, column 2 */
  readonly m12: number;
  /** Element at row 1, column 3 */
  readonly m13: number;
  /** Element at row 2, column 0 */
  readonly m20: number;
  /** Element at row 2, column 1 */
  readonly m21: number;
  /** Element at row 2, column 2 */
  readonly m22: number;
  /** Element at row 2, column 3 */
  readonly m23: number;
  /** Element at row 3, column 0 */
  readonly m30: number;
  /** Element at row 3, column 1 */
  readonly m31: number;
  /** Element at row 3, column 2 */
  readonly m32: number;
  /** Element at row 3, column 3 */
  readonly m33: number;
  /** Translation component along X-axis (same as m03) */
  readonly translateX: number;
  /** Translation component along Y-axis (same as m13) */
  readonly translateY: number;
  /** Translation component along Z-axis (same as m23) */
  readonly translateZ: number;

  /**
   * Gets the value at the specified row and column.
   * @param row_i - Row index (0-based)
   * @param column_i - Column index (0-based)
   * @returns Value at the specified position
   */
  at(row_i: number, column_i: number): number;

  /**
   * Creates a deep copy of this matrix.
   * @returns New immutable 4x4 matrix with the same values
   */
  clone(): IMatrix44;

  /**
   * Extracts the rotation part of this matrix as a 4x4 matrix.
   * @returns 4x4 matrix containing only rotation components
   */
  getRotate(): IMatrix44;

  /**
   * Extracts the translation part of this matrix.
   * @returns 3D vector containing translation components
   */
  getTranslate(): IVector3;

  /**
   * Extracts the scale factors from this matrix.
   * @returns 3D vector containing scale factors
   */
  getScale(): IVector3;

  /**
   * Multiplies this matrix by a 3D vector (treating it as a 4D vector with w=1).
   * @param vec - 3D vector to multiply
   * @returns Resulting 3D vector
   */
  multiplyVector3(vec: IVector3): IVector3;

  /**
   * Multiplies this matrix by a 4D vector.
   * @param vec - 4D vector to multiply
   * @returns Resulting 4D vector
   */
  multiplyVector(vec: IVector4): IVector4;
}

/**
 * Interface for mutable 4x4 matrices.
 * Provides modifiable 4x4 matrix operations for complete 3D transformations.
 */
export interface IMutableMatrix44 extends IMatrix {
  /** Element at row 0, column 0 */
  m00: number;
  /** Element at row 0, column 1 */
  m01: number;
  /** Element at row 0, column 2 */
  m02: number;
  /** Element at row 0, column 3 */
  m03: number;
  /** Element at row 1, column 0 */
  m10: number;
  /** Element at row 1, column 1 */
  m11: number;
  /** Element at row 1, column 2 */
  m12: number;
  /** Element at row 1, column 3 */
  m13: number;
  /** Element at row 2, column 0 */
  m20: number;
  /** Element at row 2, column 1 */
  m21: number;
  /** Element at row 2, column 2 */
  m22: number;
  /** Element at row 2, column 3 */
  m23: number;
  /** Element at row 3, column 0 */
  m30: number;
  /** Element at row 3, column 1 */
  m31: number;
  /** Element at row 3, column 2 */
  m32: number;
  /** Element at row 3, column 3 */
  m33: number;
  /** Translation component along X-axis (same as m03) */
  translateX: number;
  /** Translation component along Y-axis (same as m13) */
  translateY: number;
  /** Translation component along Z-axis (same as m23) */
  translateZ: number;

  // common with immutable matrix33
  /**
   * Converts the matrix to a string representation.
   * @returns String representation of the matrix
   */
  toString(): string;

  /**
   * Converts the matrix to an approximate string representation.
   * @returns Approximate string representation with rounded values
   */
  toStringApproximately(): string;

  /**
   * Flattens the matrix into a plain JavaScript array.
   * @returns Array containing all matrix elements
   */
  flattenAsArray(): Array<number>;

  /**
   * Checks if this is a dummy/placeholder matrix.
   * @returns True if this is a dummy matrix
   */
  isDummy(): boolean;

  /**
   * Checks if this matrix is approximately equal to another matrix.
   * @param mat - Matrix to compare against
   * @param delta - Optional tolerance for comparison (default: small epsilon)
   * @returns True if matrices are approximately equal
   */
  isEqual(mat: IMatrix44, delta?: number): boolean;

  /**
   * Checks if this matrix is strictly equal to another matrix.
   * @param mat - Matrix to compare against
   * @returns True if matrices are exactly equal
   */
  isStrictEqual(mat: IMatrix44): boolean;

  /**
   * Gets the value at the specified row and column.
   * @param row_i - Row index (0-based)
   * @param column_i - Column index (0-based)
   * @returns Value at the specified position
   */
  at(row_i: number, column_i: number): number;

  /**
   * Calculates the determinant of this 4x4 matrix.
   * @returns Determinant value
   */
  determinant(): number;

  /**
   * Multiplies this matrix by a 4D vector.
   * @param vec - 4D vector to multiply
   * @returns Resulting 4D vector
   */
  multiplyVector(vec: IVector4): IVector4;

  /**
   * Multiplies this matrix by a 4D vector and stores the result in an output vector.
   * @param vec - 4D vector to multiply
   * @param outVec - Output vector to store the result
   * @returns The output vector for method chaining
   */
  multiplyVectorTo(vec: IVector4, outVec: IMutableVector4): IMutableVector4;

  /**
   * Multiplies this matrix by a 4D vector and stores the result in a 3D output vector.
   * @param vec - 4D vector to multiply
   * @param outVec - Output 3D vector to store the result
   * @returns The output vector for method chaining
   */
  multiplyVectorToVec3(vec: IVector4, outVec: IMutableVector3): IMutableVector3;

  /**
   * Multiplies this matrix by a 3D vector (treating it as a 4D vector with w=1).
   * @param vec - 3D vector to multiply
   * @returns Resulting 3D vector
   */
  multiplyVector3(vec: IVector3): IVector3;

  /**
   * Multiplies this matrix by a 3D vector and stores the result in an output vector.
   * @param vec - 3D vector to multiply
   * @param outVec - Output vector to store the result
   * @returns The output vector for method chaining
   */
  multiplyVector3To(vec: IVector3, outVec: IMutableVector3): IMutableVector3;

  /**
   * Extracts the translation part of this matrix.
   * @returns 3D vector containing translation components
   */
  getTranslate(): IVector3;

  /**
   * Extracts the translation part of this matrix and stores it in an output vector.
   * @param outVec - Output vector to store the translation
   * @returns The output vector for method chaining
   */
  getTranslateTo(outVec: IMutableVector3): IMutableVector3;

  /**
   * Extracts the scale factors from this matrix.
   * @returns 4D vector containing scale factors
   */
  getScale(): IVector4;

  /**
   * Extracts the scale factors from this matrix and stores them in an output vector.
   * @param outVec - Output vector to store the scale factors
   * @returns The output vector for method chaining
   */
  getScaleTo(outVec: IMutableVector3): IMutableVector3;

  /**
   * Converts the rotation part of this matrix to Euler angles.
   * @returns 3D vector containing Euler angles in radians
   */
  toEulerAngles(): IVector3;

  /**
   * Converts the rotation part of this matrix to Euler angles and stores them in an output vector.
   * @param outVec3 - Output vector to store the Euler angles
   * @returns The output vector for method chaining
   */
  toEulerAnglesTo(outVec3: IMutableVector3): IMutableVector3;

  // only for mutable matrix44
  /**
   * Creates a deep copy of this matrix.
   * @returns New mutable 4x4 matrix with the same values
   */
  clone(): IMutableMatrix44; // override

  /**
   * Extracts the rotation part of this matrix as a mutable 4x4 matrix.
   * @returns Mutable 4x4 matrix containing only rotation components
   */
  getRotate(): IMutableMatrix44; // override

  /**
   * Gets the raw typed array containing matrix data.
   * @returns Raw typed array
   */
  raw(): TypedArray;

  /**
   * Sets the value at the specified row and column.
   * @param row_i - Row index (0-based)
   * @param column_i - Column index (0-based)
   * @param value - Value to set
   * @returns This matrix for method chaining
   */
  setAt(row_i: number, column_i: number, value: number): IMutableMatrix44;

  /**
   * Sets all matrix components from individual values.
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
   * @returns This matrix for method chaining
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
  ): IMutableMatrix44;

  /**
   * Copies components from another matrix.
   * @param mat - Source matrix to copy from
   * @returns This matrix for method chaining
   */
  copyComponents(mat: IMatrix44): IMutableMatrix44;

  /**
   * Sets all matrix elements to zero.
   * @returns This matrix for method chaining
   */
  zero(): IMutableMatrix44;

  /**
   * Sets this matrix to the identity matrix.
   * @returns This matrix for method chaining
   */
  identity(): IMutableMatrix44;

  /**
   * Swaps two elements in the internal array.
   * @param l - Left index
   * @param r - Right index
   */
  _swap(l: Index, r: Index): void;

  /**
   * Transposes this matrix in place.
   * @returns This matrix for method chaining
   */
  transpose(): IMutableMatrix44;

  /**
   * Inverts this matrix in place.
   * @returns This matrix for method chaining
   */
  invert(): IMutableMatrix44;

  /**
   * Applies a translation to this matrix.
   * @param vec - 3D translation vector
   * @returns This matrix for method chaining
   */
  translate(vec: IVector3): IMutableMatrix44;

  /**
   * Sets the translation part of this matrix.
   * @param vec - 3D translation vector
   * @returns This matrix for method chaining
   */
  putTranslate(vec: IVector3): IMutableMatrix44;

  /**
   * Adds a translation to the existing translation of this matrix.
   * @param vec - 3D translation vector to add
   * @returns This matrix for method chaining
   */
  addTranslate(vec: IVector3): IMutableMatrix44;

  /**
   * Applies a rotation around the X-axis to this matrix.
   * @param radian - Rotation angle in radians
   * @returns This matrix for method chaining
   */
  rotateX(radian: number): IMutableMatrix44;

  /**
   * Applies a rotation around the Y-axis to this matrix.
   * @param radian - Rotation angle in radians
   * @returns This matrix for method chaining
   */
  rotateY(radian: number): IMutableMatrix44;

  /**
   * Applies a rotation around the Z-axis to this matrix.
   * @param radian - Rotation angle in radians
   * @returns This matrix for method chaining
   */
  rotateZ(radian: number): IMutableMatrix44;

  /**
   * Applies rotations around X, Y, and Z axes in that order.
   * @param x - Rotation around X-axis in radians
   * @param y - Rotation around Y-axis in radians
   * @param z - Rotation around Z-axis in radians
   * @returns This matrix for method chaining
   */
  rotateXYZ(x: number, y: number, z: number): IMutableMatrix44;

  /**
   * Applies a rotation specified by a 3D vector (Euler angles).
   * @param vec3 - 3D vector containing rotation angles
   * @returns This matrix for method chaining
   */
  rotate(vec3: IVector3): IMutableMatrix44;

  /**
   * Applies scaling to this matrix.
   * @param vec - 3D scale vector
   * @returns This matrix for method chaining
   */
  scale(vec: IVector3): IMutableMatrix44;

  /**
   * Multiplies this matrix by a scale vector.
   * @param vec - 3D scale vector
   * @returns This matrix for method chaining
   */
  multiplyScale(vec: IVector3): IMutableMatrix44;

  /**
   * Multiplies this matrix by another 4x4 matrix.
   * @param mat - Matrix to multiply by
   * @returns This matrix for method chaining
   */
  multiply(mat: IMatrix44): IMutableMatrix44;

  /**
   * Multiplies this matrix by another 4x4 matrix from the left.
   * @param mat - Matrix to multiply from the left
   * @returns This matrix for method chaining
   */
  multiplyByLeft(mat: IMatrix44): IMutableMatrix44;

  /**
   * Sets this matrix from a quaternion rotation.
   * @param quat - Quaternion representing the rotation
   * @returns This matrix for method chaining
   */
  fromQuaternion(quat: IQuaternion): IMutableMatrix44;
}
