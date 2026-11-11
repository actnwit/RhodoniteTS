import type { Array9, FloatTypedArrayConstructor, Index, TypedArray } from '../../types/CommonTypes';
import { Logger } from '../misc/Logger';
import type { IMatrix33, IMatrix44, IMutableMatrix, IMutableMatrix33 } from './IMatrix';
import type { IQuaternion } from './IQuaternion';
import type { IVector3 } from './IVector';
import { MathUtil } from './MathUtil';
import { Matrix33_ } from './Matrix33';

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
export class MutableMatrix33_<T extends FloatTypedArrayConstructor>
  extends Matrix33_<T>
  implements IMutableMatrix, IMutableMatrix33
{
  /**
   * Creates a new MutableMatrix33_ instance.
   * @param m - The typed array containing the matrix components
   * @param options - Configuration object containing the typed array constructor
   */
  constructor(m: TypedArray, options: { type: T }) {
    super(m, options);
  }

  /**
   * Sets the matrix element at position (0,0).
   * @param val - The value to set
   */
  public set m00(val: number) {
    this._v[0] = val;
  }

  /**
   * Gets the matrix element at position (0,0).
   * @returns The value at position (0,0)
   */
  public get m00(): number {
    return this._v[0];
  }

  /**
   * Sets the matrix element at position (1,0).
   * @param val - The value to set
   */
  public set m10(val: number) {
    this._v[1] = val;
  }

  /**
   * Gets the matrix element at position (1,0).
   * @returns The value at position (1,0)
   */
  public get m10(): number {
    return this._v[1];
  }

  /**
   * Sets the matrix element at position (2,0).
   * @param val - The value to set
   */
  public set m20(val: number) {
    this._v[2] = val;
  }

  /**
   * Gets the matrix element at position (2,0).
   * @returns The value at position (2,0)
   */
  public get m20(): number {
    return this._v[2];
  }

  /**
   * Sets the matrix element at position (0,1).
   * @param val - The value to set
   */
  public set m01(val: number) {
    this._v[3] = val;
  }

  /**
   * Gets the matrix element at position (0,1).
   * @returns The value at position (0,1)
   */
  public get m01(): number {
    return this._v[3];
  }

  /**
   * Sets the matrix element at position (1,1).
   * @param val - The value to set
   */
  public set m11(val: number) {
    this._v[4] = val;
  }

  /**
   * Gets the matrix element at position (1,1).
   * @returns The value at position (1,1)
   */
  public get m11(): number {
    return this._v[4];
  }

  /**
   * Sets the matrix element at position (2,1).
   * @param val - The value to set
   */
  public set m21(val: number) {
    this._v[5] = val;
  }

  /**
   * Gets the matrix element at position (2,1).
   * @returns The value at position (2,1)
   */
  public get m21(): number {
    return this._v[5];
  }

  /**
   * Sets the matrix element at position (0,2).
   * @param val - The value to set
   */
  public set m02(val: number) {
    this._v[6] = val;
  }

  /**
   * Gets the matrix element at position (0,2).
   * @returns The value at position (0,2)
   */
  public get m02(): number {
    return this._v[6];
  }

  /**
   * Sets the matrix element at position (1,2).
   * @param val - The value to set
   */
  public set m12(val: number) {
    this._v[7] = val;
  }

  /**
   * Gets the matrix element at position (1,2).
   * @returns The value at position (1,2)
   */
  public get m12(): number {
    return this._v[7];
  }

  /**
   * Sets the matrix element at position (2,2).
   * @param val - The value to set
   */
  public set m22(val: number) {
    this._v[8] = val;
  }

  /**
   * Gets the matrix element at position (2,2).
   * @returns The value at position (2,2)
   */
  public get m22(): number {
    return this._v[8];
  }

  /**
   * Gets the class name for debugging purposes.
   * @returns The string 'MutableMatrix33'
   */
  get className(): string {
    return 'MutableMatrix33';
  }

  /**
   * Creates a copy of this matrix.
   * @returns A new MutableMatrix33 instance with the same values
   */
  clone(): MutableMatrix33 {
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
  setAt(row_i: number, column_i: number, value: number): MutableMatrix33 {
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
  copyComponents(mat: IMatrix33 | IMatrix44): MutableMatrix33 {
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
  zero(): MutableMatrix33 {
    return this.setComponents(0, 0, 0, 0, 0, 0, 0, 0, 0);
  }

  /**
   * Sets this matrix to the identity matrix.
   * @returns This matrix instance for method chaining
   */
  identity(): MutableMatrix33 {
    return this.setComponents(1, 0, 0, 0, 1, 0, 0, 0, 1);
  }

  /**
   * Swaps two elements in the internal array.
   * @param l - Index of the first element
   * @param r - Index of the second element
   * @private
   */
  _swap(l: Index, r: Index): void {
    const temp = this._v[l];
    this._v[l] = this._v[r];
    this._v[r] = temp;
  }

  /**
   * Transposes this matrix in place.
   * @returns This matrix instance for method chaining
   */
  transpose(): MutableMatrix33 {
    this._swap(1, 3);
    this._swap(2, 6);
    this._swap(5, 8);

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
    const rowNorm0 = Math.abs(this._v[0]) + Math.abs(this._v[3]) + Math.abs(this._v[6]);
    const rowNorm1 = Math.abs(this._v[1]) + Math.abs(this._v[4]) + Math.abs(this._v[7]);
    const rowNorm2 = Math.abs(this._v[2]) + Math.abs(this._v[5]) + Math.abs(this._v[8]);
    if (
      MathUtil.isSingularDet(
        det,
        rowNorm0 * rowNorm1 * rowNorm2,
        MathUtil.getSingularEpsilon(this._v.BYTES_PER_ELEMENT)
      )
    ) {
      return false;
    }

    const invDet = 1 / det;
    const m00 = (this._v[4] * this._v[8] - this._v[7] * this._v[5]) * invDet;
    const m01 = (this._v[6] * this._v[5] - this._v[3] * this._v[8]) * invDet;
    const m02 = (this._v[3] * this._v[7] - this._v[6] * this._v[4]) * invDet;
    const m10 = (this._v[7] * this._v[2] - this._v[1] * this._v[8]) * invDet;
    const m11 = (this._v[0] * this._v[8] - this._v[6] * this._v[2]) * invDet;
    const m12 = (this._v[6] * this._v[1] - this._v[0] * this._v[7]) * invDet;
    const m20 = (this._v[1] * this._v[5] - this._v[4] * this._v[2]) * invDet;
    const m21 = (this._v[3] * this._v[2] - this._v[0] * this._v[5]) * invDet;
    const m22 = (this._v[0] * this._v[4] - this._v[3] * this._v[1]) * invDet;

    this.setComponents(m00, m01, m02, m10, m11, m12, m20, m21, m22);
    return true;
  }

  /**
   * Inverts this matrix in place using the determinant method.
   *
   * If the matrix is numerically singular, it is set to the identity matrix
   * instead of being filled with `Infinity`/`NaN`.
   * Use {@link MutableMatrix33.tryInvert} when the caller needs to detect the failure.
   *
   * @returns This matrix instance for method chaining
   */
  invert(): MutableMatrix33 {
    if (this.tryInvert()) {
      return this;
    }

    Logger.default.error('the matrix is singular and cannot be inverted. Returning an identity matrix instead.');
    return this.identity();
  }

  /**
   * Sets this matrix to a rotation matrix around the X-axis.
   * @param radian - The rotation angle in radians
   * @returns This matrix instance for method chaining
   */
  rotateX(radian: number): MutableMatrix33 {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this.setComponents(1, 0, 0, 0, cos, -sin, 0, sin, cos);
  }

  /**
   * Sets this matrix to a rotation matrix around the Y-axis.
   * @param radian - The rotation angle in radians
   * @returns This matrix instance for method chaining
   */
  rotateY(radian: number): MutableMatrix33 {
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
  rotateXYZ(x: number, y: number, z: number): MutableMatrix33 {
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
  rotate(vec: IVector3): MutableMatrix33 {
    return this.rotateXYZ(vec._v[0], vec._v[1], vec._v[2]);
  }

  /**
   * Sets this matrix to a scaling matrix.
   * @param vec - A vector containing scale factors for X, Y, and Z axes
   * @returns This matrix instance for method chaining
   */
  scale(vec: IVector3): MutableMatrix33 {
    return this.setComponents(vec._v[0], 0, 0, 0, vec._v[1], 0, 0, 0, vec._v[2]);
  }

  /**
   * Multiplies this matrix by a scale matrix, applying scaling to the existing transformation.
   * Each column of the matrix is scaled by the corresponding component of the vector.
   * @param vec - A vector containing scale factors for X, Y, and Z axes
   * @returns This matrix instance for method chaining
   */
  multiplyScale(vec: IVector3): MutableMatrix33 {
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
  multiply(mat: IMatrix33): MutableMatrix33 {
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
  multiplyByLeft(mat: IMatrix33): MutableMatrix33 {
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
}

export class MutableMatrix33 extends MutableMatrix33_<Float32ArrayConstructor> {
  /**
   * Creates a new MutableMatrix33 instance.
   * @param m - The typed array containing the matrix components
   */
  constructor(m: TypedArray) {
    super(m, { type: Float32Array });
  }

  /** Creates a zero matrix. */
  static zero(): MutableMatrix33 {
    return super._zero(Float32Array) as MutableMatrix33;
  }

  /** Creates an identity matrix (optimized IdentityMatrix33 instance). */
  static identity(): MutableMatrix33 {
    return super._identity(Float32Array) as MutableMatrix33;
  }

  /** Creates a dummy matrix with an empty array. */
  static dummy(): MutableMatrix33 {
    return super._dummy(Float32Array) as MutableMatrix33;
  }

  /** Creates the transpose of the given matrix. */
  static transpose(mat: IMatrix33): MutableMatrix33 {
    return super._transpose(mat, Float32Array) as MutableMatrix33;
  }

  /** Attempts to invert the given matrix, returning null when it is singular. */
  static tryInvert(mat: IMatrix33): MutableMatrix33 | null {
    return super._tryInvert(mat, Float32Array) as MutableMatrix33 | null;
  }

  /** Creates the inverse of the given matrix (identity when singular). */
  static invert(mat: IMatrix33): MutableMatrix33 {
    return super._invert(mat, Float32Array) as MutableMatrix33;
  }

  /** Attempts to invert the given matrix into outMat. */
  static tryInvertTo<T extends IMutableMatrix33>(mat: IMatrix33, outMat: T): boolean {
    return super._tryInvertTo(mat, outMat);
  }

  /** Inverts the given matrix into outMat (identity when singular). */
  static invertTo<T extends IMutableMatrix33>(mat: IMatrix33, outMat: T): T {
    return super._invertTo(mat, outMat) as T;
  }

  /** Creates a rotation matrix around the X-axis. */
  static rotateX(radian: number): MutableMatrix33 {
    return super._rotateX(radian, Float32Array) as MutableMatrix33;
  }

  /** Creates a rotation matrix around the Y-axis. */
  static rotateY(radian: number): MutableMatrix33 {
    return super._rotateY(radian, Float32Array) as MutableMatrix33;
  }

  /** Creates a rotation matrix around the Z-axis. */
  static rotateZ(radian: number): MutableMatrix33 {
    return super._rotateZ(radian, Float32Array) as MutableMatrix33;
  }

  /** Creates a rotation matrix from Euler angles in XYZ order. */
  static rotateXYZ(x: number, y: number, z: number): MutableMatrix33 {
    return super._rotateXYZ(x, y, z, Float32Array) as MutableMatrix33;
  }

  /** Creates a rotation matrix from a Vector3 containing Euler angles. */
  static rotate(vec: IVector3): MutableMatrix33 {
    return super._rotate(vec, Float32Array) as MutableMatrix33;
  }

  /** Creates a scaling matrix. */
  static scale(vec: IVector3): MutableMatrix33 {
    return super._scale(vec, Float32Array) as MutableMatrix33;
  }

  /** Multiplies two matrices. */
  static multiply(l_mat: IMatrix33, r_mat: IMatrix33): MutableMatrix33 {
    return super._multiply(l_mat, r_mat, Float32Array) as MutableMatrix33;
  }

  /** Multiplies two matrices and stores the result in outMat. */
  static multiplyTo<T extends IMutableMatrix33>(l_mat: IMatrix33, r_mat: IMatrix33, outMat: T): T {
    return super._multiplyTo(l_mat, r_mat, outMat) as T;
  }

  /** Creates a matrix from row-major components. */
  // prettier-ignore
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
  ): MutableMatrix33 {
    return super._fromCopy9RowMajor(m00, m01, m02, m10, m11, m12, m20, m21, m22, Float32Array) as MutableMatrix33;
  }

  /** Creates a matrix from column-major components. */
  // prettier-ignore
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
  ): MutableMatrix33 {
    return super._fromCopy9ColumnMajor(m00, m10, m20, m01, m11, m21, m02, m12, m22, Float32Array) as MutableMatrix33;
  }

  /** Creates a matrix from the upper-left 3x3 portion of a 4x4 matrix. */
  static fromCopyMatrix44(mat: IMatrix44): MutableMatrix33 {
    return super._fromCopyMatrix44(mat, Float32Array) as MutableMatrix33;
  }

  /** Creates a matrix that directly uses the given Float32Array. */
  static fromFloat32ArrayColumnMajor(array: Float32Array): MutableMatrix33 {
    return super._fromTypedArrayColumnMajor(array, Float32Array) as MutableMatrix33;
  }

  /** Creates a matrix by copying a Float32Array in column-major order. */
  static fromCopyFloat32ArrayColumnMajor(array: Float32Array): MutableMatrix33 {
    return super._fromCopyTypedArrayColumnMajor(array, Float32Array) as MutableMatrix33;
  }

  /** Creates a matrix by copying a Float32Array in row-major order. */
  static fromCopyFloat32ArrayRowMajor(array: Float32Array): MutableMatrix33 {
    return super._fromCopyTypedArrayRowMajor(array, Float32Array) as MutableMatrix33;
  }

  /** Creates a matrix by copying another matrix. */
  static fromCopyMatrix33(mat: IMatrix33): MutableMatrix33 {
    return super._fromCopyMatrix33(mat, Float32Array) as MutableMatrix33;
  }

  /** Creates a matrix from a 9-element array in column-major order. */
  static fromCopyArray9ColumnMajor(array: Array9<number>): MutableMatrix33 {
    return super._fromCopyArray9ColumnMajor(array, Float32Array) as MutableMatrix33;
  }

  /** Creates a matrix from an array in column-major order. */
  static fromCopyArrayColumnMajor(array: Array<number>): MutableMatrix33 {
    return super._fromCopyArrayColumnMajor(array, Float32Array) as MutableMatrix33;
  }

  /** Creates a matrix from a 9-element array in row-major order. */
  static fromCopyArray9RowMajor(array: Array9<number>): MutableMatrix33 {
    return super._fromCopyArray9RowMajor(array, Float32Array) as MutableMatrix33;
  }

  /** Creates a matrix from an array in row-major order. */
  static fromCopyArrayRowMajor(array: Array<number>): MutableMatrix33 {
    return super._fromCopyArrayRowMajor(array, Float32Array) as MutableMatrix33;
  }

  /** Creates a matrix from a quaternion representing a rotation. */
  static fromCopyQuaternion(q: IQuaternion): MutableMatrix33 {
    return super._fromCopyQuaternion(q, Float32Array) as MutableMatrix33;
  }
}

/**
 * Immutable 3x3 matrix with 64-bit float components.
 * Use this implementation when higher numerical precision is required.
 */
export class MutableMatrix33d extends MutableMatrix33_<Float64ArrayConstructor> {
  /**
   * Creates a new MutableMatrix33d instance.
   * @param m - The typed array containing the matrix components
   */
  private constructor(m: TypedArray) {
    super(m, { type: Float64Array });
  }

  /** Creates a zero matrix. */
  static zero(): MutableMatrix33d {
    return super._zero(Float64Array) as MutableMatrix33d;
  }

  /** Creates an identity matrix. */
  static identity(): MutableMatrix33d {
    return super._identity(Float64Array) as MutableMatrix33d;
  }

  /** Creates a dummy matrix with an empty array. */
  static dummy(): MutableMatrix33d {
    return super._dummy(Float64Array) as MutableMatrix33d;
  }

  /** Creates the transpose of the given matrix. */
  static transpose(mat: IMatrix33): MutableMatrix33d {
    return super._transpose(mat, Float64Array) as MutableMatrix33d;
  }

  /** Attempts to invert the given matrix, returning null when it is singular. */
  static tryInvert(mat: IMatrix33): MutableMatrix33d | null {
    return super._tryInvert(mat, Float64Array) as MutableMatrix33d | null;
  }

  /** Creates the inverse of the given matrix (identity when singular). */
  static invert(mat: IMatrix33): MutableMatrix33d {
    return super._invert(mat, Float64Array) as MutableMatrix33d;
  }

  /** Attempts to invert the given matrix into outMat. */
  static tryInvertTo<T extends IMutableMatrix33>(mat: IMatrix33, outMat: T): boolean {
    return super._tryInvertTo(mat, outMat);
  }

  /** Inverts the given matrix into outMat (identity when singular). */
  static invertTo<T extends IMutableMatrix33>(mat: IMatrix33, outMat: T): T {
    return super._invertTo(mat, outMat) as T;
  }

  /** Creates a rotation matrix around the X-axis. */
  static rotateX(radian: number): MutableMatrix33d {
    return super._rotateX(radian, Float64Array) as MutableMatrix33d;
  }

  /** Creates a rotation matrix around the Y-axis. */
  static rotateY(radian: number): MutableMatrix33d {
    return super._rotateY(radian, Float64Array) as MutableMatrix33d;
  }

  /** Creates a rotation matrix around the Z-axis. */
  static rotateZ(radian: number): MutableMatrix33d {
    return super._rotateZ(radian, Float64Array) as MutableMatrix33d;
  }

  /** Creates a rotation matrix from Euler angles in XYZ order. */
  static rotateXYZ(x: number, y: number, z: number): MutableMatrix33d {
    return super._rotateXYZ(x, y, z, Float64Array) as MutableMatrix33d;
  }

  /** Creates a rotation matrix from a Vector3 containing Euler angles. */
  static rotate(vec: IVector3): MutableMatrix33d {
    return super._rotate(vec, Float64Array) as MutableMatrix33d;
  }

  /** Creates a scaling matrix. */
  static scale(vec: IVector3): MutableMatrix33d {
    return super._scale(vec, Float64Array) as MutableMatrix33d;
  }

  /** Multiplies two matrices. */
  static multiply(l_mat: IMatrix33, r_mat: IMatrix33): MutableMatrix33d {
    return super._multiply(l_mat, r_mat, Float64Array) as MutableMatrix33d;
  }

  /** Multiplies two matrices and stores the result in outMat. */
  static multiplyTo<T extends IMutableMatrix33>(l_mat: IMatrix33, r_mat: IMatrix33, outMat: T): T {
    return super._multiplyTo(l_mat, r_mat, outMat) as T;
  }

  /** Creates a matrix from row-major components. */
  // prettier-ignore
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
  ): MutableMatrix33d {
    return super._fromCopy9RowMajor(m00, m01, m02, m10, m11, m12, m20, m21, m22, Float64Array) as MutableMatrix33d;
  }

  /** Creates a matrix from column-major components. */
  // prettier-ignore
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
  ): MutableMatrix33d {
    return super._fromCopy9ColumnMajor(m00, m10, m20, m01, m11, m21, m02, m12, m22, Float64Array) as MutableMatrix33d;
  }

  /** Creates a matrix from the upper-left 3x3 portion of a 4x4 matrix. */
  static fromCopyMatrix44(mat: IMatrix44): MutableMatrix33d {
    return super._fromCopyMatrix44(mat, Float64Array) as MutableMatrix33d;
  }

  /** Creates a matrix that directly uses the given Float64Array. */
  static fromFloat64ArrayColumnMajor(array: Float64Array): MutableMatrix33d {
    return super._fromTypedArrayColumnMajor(array, Float64Array) as MutableMatrix33d;
  }

  /** Creates a matrix by copying a Float64Array in column-major order. */
  static fromCopyFloat64ArrayColumnMajor(array: Float64Array): MutableMatrix33d {
    return super._fromCopyTypedArrayColumnMajor(array, Float64Array) as MutableMatrix33d;
  }

  /** Creates a matrix by copying a Float64Array in row-major order. */
  static fromCopyFloat64ArrayRowMajor(array: Float64Array): MutableMatrix33d {
    return super._fromCopyTypedArrayRowMajor(array, Float64Array) as MutableMatrix33d;
  }

  /** Creates a matrix by copying another matrix. */
  static fromCopyMatrix33(mat: IMatrix33): MutableMatrix33d {
    return super._fromCopyMatrix33(mat, Float64Array) as MutableMatrix33d;
  }

  /** Creates a matrix from a 9-element array in column-major order. */
  static fromCopyArray9ColumnMajor(array: Array9<number>): MutableMatrix33d {
    return super._fromCopyArray9ColumnMajor(array, Float64Array) as MutableMatrix33d;
  }

  /** Creates a matrix from an array in column-major order. */
  static fromCopyArrayColumnMajor(array: Array<number>): MutableMatrix33d {
    return super._fromCopyArrayColumnMajor(array, Float64Array) as MutableMatrix33d;
  }

  /** Creates a matrix from a 9-element array in row-major order. */
  static fromCopyArray9RowMajor(array: Array9<number>): MutableMatrix33d {
    return super._fromCopyArray9RowMajor(array, Float64Array) as MutableMatrix33d;
  }

  /** Creates a matrix from an array in row-major order. */
  static fromCopyArrayRowMajor(array: Array<number>): MutableMatrix33d {
    return super._fromCopyArrayRowMajor(array, Float64Array) as MutableMatrix33d;
  }

  /** Creates a matrix from a quaternion representing a rotation. */
  static fromCopyQuaternion(q: IQuaternion): MutableMatrix33d {
    return super._fromCopyQuaternion(q, Float64Array) as MutableMatrix33d;
  }
}
