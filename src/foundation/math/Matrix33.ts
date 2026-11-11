import type { Array9 } from '../../types';
import type { FloatTypedArrayConstructor, TypedArray } from '../../types/CommonTypes';
import { CompositionType } from '../definitions/CompositionType';
import { Logger } from '../misc/Logger';
import { AbstractMatrix } from './AbstractMatrix';
import { IdentityMatrix33 } from './IdentityMatrix33';
import type { IMatrix, IMatrix33, IMatrix44, IMutableMatrix33 } from './IMatrix';
import type { IQuaternion } from './IQuaternion';
import type { IMutableVector3, IVector3 } from './IVector';
import { MathUtil } from './MathUtil';
import type { MutableVector3 } from './MutableVector3';
import { Vector3 } from './Vector3';
/* eslint-disable prettier/prettier */

/**
 * Immutable 3x3 matrix class for 3D transformations.
 * Matrix values are stored in column-major order for WebGL compatibility.
 * Provides various matrix operations including rotation, scaling, and multiplication.
 *
 * @example
 * ```typescript
 * // Create identity matrix
 * const identity = Matrix33.identity();
 *
 * // Create rotation matrix
 * const rotation = Matrix33.rotateZ(Math.PI / 4);
 *
 * // Create scale matrix
 * const scale = Matrix33.scale(Vector3.fromCopyArray([2, 2, 2]));
 *
 * // Matrix multiplication
 * const result = Matrix33.multiply(rotation, scale);
 * ```
 */
export class Matrix33_<T extends FloatTypedArrayConstructor> extends AbstractMatrix implements IMatrix, IMatrix33 {
  /**
   * Creates a new Matrix33_ instance.
   * @param m - Typed array containing 9 matrix values in column-major order
   * @param _options - Configuration object containing the typed array constructor
   */
  constructor(m: TypedArray, _options: { type: T }) {
    super();
    this._v = m;
  }

  /**
   * Gets the matrix element at row 0, column 0.
   * @returns The m00 component
   */
  public get m00() {
    return this._v[0];
  }

  /**
   * Gets the matrix element at row 1, column 0.
   * @returns The m10 component
   */
  public get m10() {
    return this._v[1];
  }

  /**
   * Gets the matrix element at row 2, column 0.
   * @returns The m20 component
   */
  public get m20() {
    return this._v[2];
  }

  /**
   * Gets the matrix element at row 0, column 1.
   * @returns The m01 component
   */
  public get m01() {
    return this._v[3];
  }

  /**
   * Gets the matrix element at row 1, column 1.
   * @returns The m11 component
   */
  public get m11() {
    return this._v[4];
  }

  /**
   * Gets the matrix element at row 2, column 1.
   * @returns The m21 component
   */
  public get m21() {
    return this._v[5];
  }

  /**
   * Gets the matrix element at row 0, column 2.
   * @returns The m02 component
   */
  public get m02() {
    return this._v[6];
  }

  /**
   * Gets the matrix element at row 1, column 2.
   * @returns The m12 component
   */
  public get m12() {
    return this._v[7];
  }

  /**
   * Gets the matrix element at row 2, column 2.
   * @returns The m22 component
   */
  public get m22() {
    return this._v[8];
  }

  /**
   * Gets the class name.
   * @returns The string "Matrix33"
   */
  get className() {
    return 'Matrix33';
  }

  /**
   * Gets the matrix as a GLSL mat3 string with float precision.
   * @returns GLSL mat3 constructor string
   */
  get glslStrAsFloat() {
    return `mat3(${MathUtil.convertToStringAsGLSLFloat(this._v[0])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[1])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[2])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[3])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[4])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[5])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[6])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[7])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[8])})`;
  }

  /**
   * Gets the matrix as a GLSL mat3 string with integer values.
   * @returns GLSL mat3 constructor string with floored values
   */
  get glslStrAsInt() {
    return `mat3(${Math.floor(this._v[0])}, ${Math.floor(this._v[1])}, ${Math.floor(this._v[2])}, ${Math.floor(this._v[3])}, ${Math.floor(this._v[4])}, ${Math.floor(this._v[5])}, ${Math.floor(this._v[6])}, ${Math.floor(this._v[7])}, ${Math.floor(this._v[8])})`;
  }

  /**
   * Gets the matrix as a WGSL mat3x3f string with float precision.
   * @returns WGSL mat3x3f constructor string
   */
  get wgslStrAsFloat() {
    return `mat3x3f(${MathUtil.convertToStringAsGLSLFloat(this._v[0])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[1])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[2])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[3])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[4])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[5])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[6])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[7])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[8])})`;
  }

  /**
   * Gets the matrix as a WGSL mat3x3i string with integer values.
   * @returns WGSL mat3x3i constructor string with floored values
   */
  get wgslStrAsInt() {
    return `mat3x3i(${Math.floor(this._v[0])}, ${Math.floor(this._v[1])}, ${Math.floor(this._v[2])}, ${Math.floor(this._v[3])}, ${Math.floor(this._v[4])}, ${Math.floor(this._v[5])}, ${Math.floor(this._v[6])}, ${Math.floor(this._v[7])}, ${Math.floor(this._v[8])})`;
  }

  /**
   * Gets the composition type for this matrix.
   * @returns CompositionType.Mat3
   */
  static get compositionType() {
    return CompositionType.Mat3;
  }

  /**
   * Creates a zero matrix (all elements are 0).
   * @returns A new Matrix33 with all zero elements
   */
  static _zero(type: FloatTypedArrayConstructor): IMatrix33 {
    return this._fromCopy9RowMajor(0, 0, 0, 0, 0, 0, 0, 0, 0, type);
  }

  /**
   * Creates an identity matrix.
   * @returns A new identity matrix (optimized IdentityMatrix33 instance)
   */
  static _identity(type: FloatTypedArrayConstructor): IMatrix33 {
    return this._fromCopy9RowMajor(1, 0, 0, 0, 1, 0, 0, 0, 1, type);
  }

  /**
   * Creates a dummy matrix with empty data array.
   * Used for placeholder purposes.
   * @returns A new Matrix33 with empty Float32Array
   */
  static _dummy(type: FloatTypedArrayConstructor): IMatrix33 {
    return new this(new type(0), { type });
  }

  /**
   * Creates the transpose of the given matrix.
   * @param mat - The matrix to transpose
   * @returns A new transposed matrix
   */
  static _transpose(mat: IMatrix33, type: FloatTypedArrayConstructor): IMatrix33 {
    if (mat.isIdentityMatrixClass) {
      return this._fromCopyMatrix33(mat, type);
    }

    return this._fromCopy9RowMajor(
      mat._v[0],
      mat._v[1],
      mat._v[2],
      mat._v[3],
      mat._v[4],
      mat._v[5],
      mat._v[6],
      mat._v[7],
      mat._v[8],
      type
    );
  }

  /**
   * Attempts to create the inverse of the given matrix.
   *
   * Returns null instead of dividing by zero when the matrix is numerically
   * singular (see {@link MathUtil.isSingularDet}).
   *
   * @param mat - The matrix to invert
   * @returns A new inverted matrix, or null if the matrix is not invertible
   */
  static _tryInvert(mat: IMatrix33, type: FloatTypedArrayConstructor): IMatrix33 | null {
    if (mat.isIdentityMatrixClass) {
      return this._fromCopyMatrix33(mat, type);
    }

    const det = mat.determinant();
    const rowNorm0 = Math.abs(mat._v[0]) + Math.abs(mat._v[3]) + Math.abs(mat._v[6]);
    const rowNorm1 = Math.abs(mat._v[1]) + Math.abs(mat._v[4]) + Math.abs(mat._v[7]);
    const rowNorm2 = Math.abs(mat._v[2]) + Math.abs(mat._v[5]) + Math.abs(mat._v[8]);
    if (
      MathUtil.isSingularDet(det, rowNorm0 * rowNorm1 * rowNorm2, MathUtil.getSingularEpsilon(mat._v.BYTES_PER_ELEMENT))
    ) {
      return null;
    }

    const invDet = 1 / det;
    const m00 = (mat._v[4] * mat._v[8] - mat._v[7] * mat._v[5]) * invDet;
    const m01 = (mat._v[6] * mat._v[5] - mat._v[3] * mat._v[8]) * invDet;
    const m02 = (mat._v[3] * mat._v[7] - mat._v[6] * mat._v[4]) * invDet;
    const m10 = (mat._v[7] * mat._v[2] - mat._v[1] * mat._v[8]) * invDet;
    const m11 = (mat._v[0] * mat._v[8] - mat._v[6] * mat._v[2]) * invDet;
    const m12 = (mat._v[6] * mat._v[1] - mat._v[0] * mat._v[7]) * invDet;
    const m20 = (mat._v[1] * mat._v[5] - mat._v[4] * mat._v[2]) * invDet;
    const m21 = (mat._v[3] * mat._v[2] - mat._v[0] * mat._v[5]) * invDet;
    const m22 = (mat._v[0] * mat._v[4] - mat._v[3] * mat._v[1]) * invDet;

    return this._fromCopy9RowMajor(m00, m01, m02, m10, m11, m12, m20, m21, m22, type);
  }

  /**
   * Creates the inverse of the given matrix.
   *
   * If the matrix is numerically singular, an identity matrix is returned
   * instead of dividing by zero. Use {@link Matrix33.tryInvert} when the
   * caller needs to detect the failure.
   *
   * @param mat - The matrix to invert
   * @returns A new inverted matrix, or the identity matrix if the input is singular
   */
  static _invert(mat: IMatrix33, type: FloatTypedArrayConstructor): IMatrix33 {
    const inverted = this._tryInvert(mat, type);
    if (inverted !== null) {
      return inverted;
    }

    Logger.default.error('the matrix is singular and cannot be inverted. Returning an identity matrix instead.');
    return this._fromCopy9RowMajor(1, 0, 0, 0, 1, 0, 0, 0, 1, type);
  }

  /**
   * Attempts to calculate the inverse of the given matrix and stores the
   * result in the output matrix. The output matrix is left untouched when the
   * input is numerically singular.
   *
   * @param mat - The matrix to invert
   * @param outMat - The output mutable matrix to store the result
   * @returns True if the inversion succeeded, false if the matrix is singular
   */
  static _tryInvertTo(mat: IMatrix33, outMat: IMutableMatrix33): boolean {
    if (mat.isIdentityMatrixClass) {
      outMat.copyComponents(mat);
      return true;
    }

    const det = mat.determinant();
    const rowNorm0 = Math.abs(mat._v[0]) + Math.abs(mat._v[3]) + Math.abs(mat._v[6]);
    const rowNorm1 = Math.abs(mat._v[1]) + Math.abs(mat._v[4]) + Math.abs(mat._v[7]);
    const rowNorm2 = Math.abs(mat._v[2]) + Math.abs(mat._v[5]) + Math.abs(mat._v[8]);
    if (
      MathUtil.isSingularDet(det, rowNorm0 * rowNorm1 * rowNorm2, MathUtil.getSingularEpsilon(mat._v.BYTES_PER_ELEMENT))
    ) {
      return false;
    }

    const invDet = 1 / det;
    const m00 = (mat._v[4] * mat._v[8] - mat._v[7] * mat._v[5]) * invDet;
    const m01 = (mat._v[6] * mat._v[5] - mat._v[3] * mat._v[8]) * invDet;
    const m02 = (mat._v[3] * mat._v[7] - mat._v[6] * mat._v[4]) * invDet;
    const m10 = (mat._v[7] * mat._v[2] - mat._v[1] * mat._v[8]) * invDet;
    const m11 = (mat._v[0] * mat._v[8] - mat._v[6] * mat._v[2]) * invDet;
    const m12 = (mat._v[6] * mat._v[1] - mat._v[0] * mat._v[7]) * invDet;
    const m20 = (mat._v[1] * mat._v[5] - mat._v[4] * mat._v[2]) * invDet;
    const m21 = (mat._v[3] * mat._v[2] - mat._v[0] * mat._v[5]) * invDet;
    const m22 = (mat._v[0] * mat._v[4] - mat._v[3] * mat._v[1]) * invDet;

    outMat.setComponents(m00, m01, m02, m10, m11, m12, m20, m21, m22);
    return true;
  }

  /**
   * Calculates the inverse of the given matrix and stores the result in the output matrix.
   *
   * If the matrix is numerically singular, the output matrix is set to the
   * identity matrix instead of being filled with `Infinity`/`NaN`.
   * Use {@link Matrix33.tryInvertTo} when the caller needs to detect the failure.
   *
   * @param mat - The matrix to invert
   * @param outMat - The output mutable matrix to store the result
   * @returns The output matrix containing the inverted matrix, or the identity matrix if the input is singular
   */
  static _invertTo(mat: IMatrix33, outMat: IMutableMatrix33): IMutableMatrix33 {
    if (this._tryInvertTo(mat, outMat)) {
      return outMat;
    }

    Logger.default.error('the matrix is singular and cannot be inverted. Returning an identity matrix instead.');
    return outMat.identity();
  }

  /**
   * Creates a rotation matrix around the X-axis.
   * @param radian - The rotation angle in radians
   * @returns A new rotation matrix
   */
  static _rotateX(radian: number, type: FloatTypedArrayConstructor): IMatrix33 {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this._fromCopy9RowMajor(1, 0, 0, 0, cos, -sin, 0, sin, cos, type);
  }

  /**
   * Creates a rotation matrix around the Y-axis.
   * @param radian - The rotation angle in radians
   * @returns A new rotation matrix
   */
  static _rotateY(radian: number, type: FloatTypedArrayConstructor): IMatrix33 {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this._fromCopy9RowMajor(cos, 0, sin, 0, 1, 0, -sin, 0, cos, type);
  }

  /**
   * Creates a rotation matrix around the Z-axis.
   * @param radian - The rotation angle in radians
   * @returns A new rotation matrix
   */
  static _rotateZ(radian: number, type: FloatTypedArrayConstructor): IMatrix33 {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this._fromCopy9RowMajor(cos, -sin, 0, sin, cos, 0, 0, 0, 1, type);
  }

  /**
   * Creates a rotation matrix from Euler angles in XYZ order.
   * @param x - Rotation around X-axis in radians
   * @param y - Rotation around Y-axis in radians
   * @param z - Rotation around Z-axis in radians
   * @returns A new rotation matrix representing the combined rotations
   */
  static _rotateXYZ(x: number, y: number, z: number, type: FloatTypedArrayConstructor): IMatrix33 {
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

    return this._fromCopy9RowMajor(m00, m01, m02, m10, m11, m12, m20, m21, m22, type);
  }

  /**
   * Creates a rotation matrix from a Vector3 containing Euler angles.
   * @param vec - Vector3 containing rotation angles (x, y, z) in radians
   * @returns A new rotation matrix
   */
  static _rotate(vec: IVector3, type: FloatTypedArrayConstructor): IMatrix33 {
    return this._rotateXYZ(vec._v[0], vec._v[1], vec._v[2], type);
  }

  /**
   * Creates a scaling matrix.
   * @param vec - Vector3 containing scale factors for each axis
   * @returns A new scaling matrix
   */
  static _scale(vec: IVector3, type: FloatTypedArrayConstructor): IMatrix33 {
    return this._fromCopy9RowMajor(vec._v[0], 0, 0, 0, vec._v[1], 0, 0, 0, vec._v[2], type);
  }

  /**
   * Multiplies two matrices together.
   * @param l_mat - The left matrix
   * @param r_mat - The right matrix
   * @returns A new matrix representing l_mat * r_mat
   */
  static _multiply(l_mat: IMatrix33, r_mat: IMatrix33, type: FloatTypedArrayConstructor): IMatrix33 {
    if (l_mat.isIdentityMatrixClass) {
      return this._fromCopyMatrix33(r_mat, type);
    }
    if (r_mat.isIdentityMatrixClass) {
      return this._fromCopyMatrix33(l_mat, type);
    }

    const m00 = l_mat._v[0] * r_mat._v[0] + l_mat._v[3] * r_mat._v[1] + l_mat._v[6] * r_mat._v[2];
    const m10 = l_mat._v[1] * r_mat._v[0] + l_mat._v[4] * r_mat._v[1] + l_mat._v[7] * r_mat._v[2];
    const m20 = l_mat._v[2] * r_mat._v[0] + l_mat._v[5] * r_mat._v[1] + l_mat._v[8] * r_mat._v[2];

    const m01 = l_mat._v[0] * r_mat._v[3] + l_mat._v[3] * r_mat._v[4] + l_mat._v[6] * r_mat._v[5];
    const m11 = l_mat._v[1] * r_mat._v[3] + l_mat._v[4] * r_mat._v[4] + l_mat._v[7] * r_mat._v[5];
    const m21 = l_mat._v[2] * r_mat._v[3] + l_mat._v[5] * r_mat._v[4] + l_mat._v[8] * r_mat._v[5];

    const m02 = l_mat._v[0] * r_mat._v[6] + l_mat._v[3] * r_mat._v[7] + l_mat._v[6] * r_mat._v[8];
    const m12 = l_mat._v[1] * r_mat._v[6] + l_mat._v[4] * r_mat._v[7] + l_mat._v[7] * r_mat._v[8];
    const m22 = l_mat._v[2] * r_mat._v[6] + l_mat._v[5] * r_mat._v[7] + l_mat._v[8] * r_mat._v[8];

    return this._fromCopy9RowMajor(m00, m01, m02, m10, m11, m12, m20, m21, m22, type);
  }

  /**
   * Multiplies two matrices and stores the result in an output matrix.
   * @param l_mat - The left matrix
   * @param r_mat - The right matrix
   * @param outMat - The output mutable matrix to store the result
   * @returns The output matrix containing l_mat * r_mat
   */
  static _multiplyTo(l_mat: IMatrix33, r_mat: IMatrix33, outMat: IMutableMatrix33): IMutableMatrix33 {
    if (l_mat.isIdentityMatrixClass) {
      return outMat.copyComponents(r_mat);
    }
    if (r_mat.isIdentityMatrixClass) {
      return outMat.copyComponents(l_mat);
    }

    const m00 = l_mat._v[0] * r_mat._v[0] + l_mat._v[3] * r_mat._v[1] + l_mat._v[6] * r_mat._v[2];
    const m10 = l_mat._v[1] * r_mat._v[0] + l_mat._v[4] * r_mat._v[1] + l_mat._v[7] * r_mat._v[2];
    const m20 = l_mat._v[2] * r_mat._v[0] + l_mat._v[5] * r_mat._v[1] + l_mat._v[8] * r_mat._v[2];

    const m01 = l_mat._v[0] * r_mat._v[3] + l_mat._v[3] * r_mat._v[4] + l_mat._v[6] * r_mat._v[5];
    const m11 = l_mat._v[1] * r_mat._v[3] + l_mat._v[4] * r_mat._v[4] + l_mat._v[7] * r_mat._v[5];
    const m21 = l_mat._v[2] * r_mat._v[3] + l_mat._v[5] * r_mat._v[4] + l_mat._v[8] * r_mat._v[5];

    const m02 = l_mat._v[0] * r_mat._v[6] + l_mat._v[3] * r_mat._v[7] + l_mat._v[6] * r_mat._v[8];
    const m12 = l_mat._v[1] * r_mat._v[6] + l_mat._v[4] * r_mat._v[7] + l_mat._v[7] * r_mat._v[8];
    const m22 = l_mat._v[2] * r_mat._v[6] + l_mat._v[5] * r_mat._v[7] + l_mat._v[8] * r_mat._v[8];

    return outMat.setComponents(m00, m01, m02, m10, m11, m12, m20, m21, m22);
  }

  /**
   * Converts the matrix to a human-readable string representation.
   * @returns A formatted string showing the matrix in 3x3 layout
   */
  toString() {
    return `${this._v[0]} ${this._v[3]} ${this._v[6]}\n${this._v[1]} ${this._v[4]} ${this._v[7]}\n${this._v[2]} ${this._v[5]} ${this._v[8]}\n`;
  }

  /**
   * Converts the matrix to a human-readable string with rounded values.
   * @returns A formatted string showing the matrix with financially rounded values
   */
  toStringApproximately() {
    return `${MathUtil.financial(this._v[0])} ${MathUtil.financial(this._v[3])} ${MathUtil.financial(this._v[6])}\n${MathUtil.financial(this._v[1])} ${MathUtil.financial(this._v[4])} ${MathUtil.financial(this._v[7])} \n${MathUtil.financial(this._v[2])} ${MathUtil.financial(this._v[5])} ${MathUtil.financial(this._v[8])}\n`;
  }

  /**
   * Converts the matrix to a flat array in column-major order.
   * @returns An array containing all 9 matrix elements
   */
  flattenAsArray() {
    return [this._v[0], this._v[1], this._v[2], this._v[3], this._v[4], this._v[5], this._v[6], this._v[7], this._v[8]];
  }

  /**
   * Checks if this matrix is a dummy matrix (empty data array).
   * @returns True if the matrix has no data, false otherwise
   */
  isDummy() {
    if (this._v.length === 0) {
      return true;
    }
    return false;
  }

  /**
   * Checks if this matrix is approximately equal to another matrix.
   * @param mat - The matrix to compare with
   * @param delta - The tolerance for comparison (default: Number.EPSILON)
   * @returns True if matrices are approximately equal, false otherwise
   */
  isEqual(mat: IMatrix33, delta: number = Number.EPSILON) {
    if (
      Math.abs(mat._v[0] - this._v[0]) < delta &&
      Math.abs(mat._v[1] - this._v[1]) < delta &&
      Math.abs(mat._v[2] - this._v[2]) < delta &&
      Math.abs(mat._v[3] - this._v[3]) < delta &&
      Math.abs(mat._v[4] - this._v[4]) < delta &&
      Math.abs(mat._v[5] - this._v[5]) < delta &&
      Math.abs(mat._v[6] - this._v[6]) < delta &&
      Math.abs(mat._v[7] - this._v[7]) < delta &&
      Math.abs(mat._v[8] - this._v[8]) < delta
    ) {
      return true;
    }
    return false;
  }

  /**
   * Checks if this matrix is strictly equal to another matrix.
   * @param mat - The matrix to compare with
   * @returns True if all elements are exactly equal, false otherwise
   */
  isStrictEqual(mat: Matrix33) {
    if (
      mat._v[0] === this._v[0] &&
      mat._v[1] === this._v[1] &&
      mat._v[2] === this._v[2] &&
      mat._v[3] === this._v[3] &&
      mat._v[4] === this._v[4] &&
      mat._v[5] === this._v[5] &&
      mat._v[6] === this._v[6] &&
      mat._v[7] === this._v[7] &&
      mat._v[8] === this._v[8]
    ) {
      return true;
    }
    return false;
  }

  /**
   * Gets the matrix element at the specified row and column.
   * @param row_i - The row index (0-2)
   * @param column_i - The column index (0-2)
   * @returns The matrix element at the specified position
   */
  at(row_i: number, column_i: number) {
    return this._v[row_i + column_i * 3];
  }

  /**
   * Gets the matrix element at the specified index in the internal array.
   * @param i - The index (0-8)
   * @returns The matrix element at the specified index
   */
  v(i: number): number {
    return this._v[i];
  }

  /**
   * Calculates the determinant of this matrix.
   * @returns The determinant value
   */
  determinant() {
    return (
      this._v[0] * this._v[4] * this._v[8] +
      this._v[1] * this._v[5] * this._v[6] +
      this._v[2] * this._v[3] * this._v[7] -
      this._v[0] * this._v[5] * this._v[7] -
      this._v[2] * this._v[4] * this._v[6] -
      this._v[1] * this._v[3] * this._v[8]
    );
  }

  /**
   * Multiplies this matrix with a vector.
   * @param vec - The vector to multiply
   * @returns A new vector representing the result of matrix * vector
   */
  multiplyVector(vec: IVector3) {
    const x = this._v[0] * vec._v[0] + this._v[3] * vec._v[1] + this._v[6] * vec._v[2];
    const y = this._v[1] * vec._v[0] + this._v[4] * vec._v[1] + this._v[7] * vec._v[2];
    const z = this._v[2] * vec._v[0] + this._v[5] * vec._v[1] + this._v[8] * vec._v[2];
    return new (vec.constructor as any)(new Float32Array([x, y, z]));
  }

  /**
   * Multiplies this matrix with a vector and stores the result in an output vector.
   * @param vec - The vector to multiply
   * @param outVec - The output mutable vector to store the result
   * @returns The output vector containing the result of matrix * vector
   */
  multiplyVectorTo(vec: IVector3, outVec: IMutableVector3) {
    const x = this._v[0] * vec._v[0] + this._v[3] * vec._v[1] + this._v[6] * vec._v[2];
    const y = this._v[1] * vec._v[0] + this._v[4] * vec._v[1] + this._v[7] * vec._v[2];
    const z = this._v[2] * vec._v[0] + this._v[5] * vec._v[1] + this._v[8] * vec._v[2];
    outVec._v[0] = x;
    outVec._v[1] = y;
    outVec._v[2] = z;
    return outVec;
  }

  /**
   * Extracts the scale factors from this matrix.
   * @returns A new Vector3 containing the scale factors for each axis
   */
  getScale() {
    return Vector3.fromCopyArray([
      Math.hypot(this._v[0], this._v[1], this._v[2]),
      Math.hypot(this._v[3], this._v[4], this._v[5]),
      Math.hypot(this._v[6], this._v[7], this._v[8]),
    ]);
  }

  /**
   * Extracts the scale factors from this matrix and stores them in an output vector.
   * @param outVec - The output mutable vector to store the scale factors
   * @returns The output vector containing the scale factors
   */
  getScaleTo(outVec: MutableVector3) {
    outVec._v[0] = Math.hypot(this._v[0], this._v[1], this._v[2]);
    outVec._v[1] = Math.hypot(this._v[3], this._v[4], this._v[5]);
    outVec._v[2] = Math.hypot(this._v[6], this._v[7], this._v[8]);
    return outVec;
  }

  /**
   * Creates a deep copy of this matrix.
   * @returns A new Matrix33 instance with the same values
   */
  clone() {
    return (this.constructor as any).fromCopy9RowMajor(
      this._v[0],
      this._v[3],
      this._v[6],
      this._v[1],
      this._v[4],
      this._v[7],
      this._v[2],
      this._v[5],
      this._v[8]
    );
  }

  /**
   * Creates a Matrix33 from 9 values in row-major order.
   * Values are stored internally in column-major order for WebGL compatibility.
   * @param m00 - Element at row 0, column 0
   * @param m01 - Element at row 0, column 1
   * @param m02 - Element at row 0, column 2
   * @param m10 - Element at row 1, column 0
   * @param m11 - Element at row 1, column 1
   * @param m12 - Element at row 1, column 2
   * @param m20 - Element at row 2, column 0
   * @param m21 - Element at row 2, column 1
   * @param m22 - Element at row 2, column 2
   * @returns A new Matrix33 instance
   */
  static _fromCopy9RowMajor(
    m00: number,
    m01: number,
    m02: number,
    m10: number,
    m11: number,
    m12: number,
    m20: number,
    m21: number,
    m22: number,
    type: FloatTypedArrayConstructor
  ): IMatrix33 {
    const v = new type(9);
    v[0] = m00;
    v[3] = m01;
    v[6] = m02;
    v[1] = m10;
    v[4] = m11;
    v[7] = m12;
    v[2] = m20;
    v[5] = m21;
    v[8] = m22;
    return new this(v, { type });
  }

  /**
   * Creates a Matrix33 from 9 values in column-major order.
   * @param m00 - Element at row 0, column 0
   * @param m10 - Element at row 1, column 0
   * @param m20 - Element at row 2, column 0
   * @param m01 - Element at row 0, column 1
   * @param m11 - Element at row 1, column 1
   * @param m21 - Element at row 2, column 1
   * @param m02 - Element at row 0, column 2
   * @param m12 - Element at row 1, column 2
   * @param m22 - Element at row 2, column 2
   * @returns A new Matrix33 instance
   */
  static _fromCopy9ColumnMajor(
    m00: number,
    m10: number,
    m20: number,
    m01: number,
    m11: number,
    m21: number,
    m02: number,
    m12: number,
    m22: number,
    type: FloatTypedArrayConstructor
  ): IMatrix33 {
    const v = new type(9);
    v[0] = m00;
    v[3] = m01;
    v[6] = m02;
    v[1] = m10;
    v[4] = m11;
    v[7] = m12;
    v[2] = m20;
    v[5] = m21;
    v[8] = m22;
    return new this(v, { type });
  }

  /**
   * Creates a Matrix33 from the upper-left 3x3 portion of a Matrix44.
   * @param mat - The Matrix44 to extract from
   * @returns A new Matrix33 instance
   */
  static _fromCopyMatrix44(mat: IMatrix44, type: FloatTypedArrayConstructor): IMatrix33 {
    const v = new type(9);
    v[0] = mat._v[0];
    v[1] = mat._v[1];
    v[2] = mat._v[2];
    v[3] = mat._v[5];
    v[4] = mat._v[6];
    v[5] = mat._v[7];
    v[6] = mat._v[9];
    v[7] = mat._v[10];
    v[8] = mat._v[11];
    return new this(v, { type });
  }

  /**
   * Creates a Matrix33 using the provided Float32Array directly (no copy).
   * @param float32Array - The Float32Array in column-major order
   * @returns A new Matrix33 instance
   */
  static _fromTypedArrayColumnMajor(array: TypedArray, type: FloatTypedArrayConstructor): IMatrix33 {
    return new this(array, { type });
  }

  /**
   * Creates a Matrix33 by copying from a Float32Array in column-major order.
   * @param float32Array - The Float32Array to copy from
   * @returns A new Matrix33 instance
   */
  static _fromCopyTypedArrayColumnMajor(array: TypedArray, type: FloatTypedArrayConstructor): IMatrix33 {
    const v = new type(9);
    v.set(array);
    return new this(v, { type });
  }

  /**
   * Creates a Matrix33 by copying from a Float32Array in row-major order.
   * @param array - The Float32Array in row-major order
   * @returns A new Matrix33 instance
   */
  static _fromCopyTypedArrayRowMajor(array: TypedArray, type: FloatTypedArrayConstructor): IMatrix33 {
    const v = new type(9);
    v[0] = array[0];
    v[3] = array[1];
    v[6] = array[2];
    v[1] = array[3];
    v[4] = array[4];
    v[7] = array[5];
    v[2] = array[6];
    v[5] = array[7];
    v[8] = array[8];

    return new this(v, { type });
  }

  /**
   * Creates a Matrix33 by copying from another IMatrix33.
   * @param mat - The matrix to copy from
   * @returns A new Matrix33 instance
   */
  static _fromCopyMatrix33(mat: IMatrix33, type: FloatTypedArrayConstructor): IMatrix33 {
    const v = new type(9);
    v[0] = mat._v[0];
    v[3] = mat._v[3];
    v[6] = mat._v[6];
    v[1] = mat._v[1];
    v[4] = mat._v[4];
    v[7] = mat._v[7];
    v[2] = mat._v[2];
    v[5] = mat._v[5];
    v[8] = mat._v[8];
    return new this(v, { type });
  }

  /**
   * Creates a Matrix33 from an Array9 in column-major order.
   * @param array - The Array9 containing 9 numbers
   * @returns A new Matrix33 instance
   */
  static _fromCopyArray9ColumnMajor(array: Array9<number>, type: FloatTypedArrayConstructor): IMatrix33 {
    const v = new type(9);
    v.set(array);
    return new this(v, { type });
  }

  /**
   * Creates a Matrix33 from a regular array in column-major order.
   * @param array - The array containing at least 9 numbers
   * @returns A new Matrix33 instance
   */
  static _fromCopyArrayColumnMajor(array: Array<number>, type: FloatTypedArrayConstructor): IMatrix33 {
    const v = new type(9);
    v.set(array);
    return new this(v, { type });
  }

  /**
   * Creates a Matrix33 from an Array9 in row-major order.
   * @param array - The Array9 containing 9 numbers in row-major order
   * @returns A new Matrix33 instance
   */
  static _fromCopyArray9RowMajor(array: Array9<number>, type: FloatTypedArrayConstructor): IMatrix33 {
    const v = new type(9);
    v[0] = array[0];
    v[3] = array[1];
    v[6] = array[2];
    v[1] = array[3];
    v[4] = array[4];
    v[7] = array[5];
    v[2] = array[6];
    v[5] = array[7];
    v[8] = array[8];
    return new this(v, { type });
  }

  /**
   * Creates a Matrix33 from a regular array in row-major order.
   * @param array - The array containing at least 9 numbers in row-major order
   * @returns A new Matrix33 instance
   */
  static _fromCopyArrayRowMajor(array: Array<number>, type: FloatTypedArrayConstructor): IMatrix33 {
    const v = new type(9);
    v[0] = array[0];
    v[3] = array[1];
    v[6] = array[2];
    v[1] = array[3];
    v[4] = array[4];
    v[7] = array[5];
    v[2] = array[6];
    v[5] = array[7];
    v[8] = array[8];
    return new this(v, { type });
  }

  /**
   * Creates a Matrix33 from a quaternion representing rotation.
   * @param q - The quaternion to convert
   * @returns A new Matrix33 representing the rotation
   */
  static _fromCopyQuaternion(q: IQuaternion, type: FloatTypedArrayConstructor): IMatrix33 {
    const sx = q._v[0] * q._v[0];
    const sy = q._v[1] * q._v[1];
    const sz = q._v[2] * q._v[2];
    const cx = q._v[1] * q._v[2];
    const cy = q._v[0] * q._v[2];
    const cz = q._v[0] * q._v[1];
    const wx = q._v[3] * q._v[0];
    const wy = q._v[3] * q._v[1];
    const wz = q._v[3] * q._v[2];
    const v = new type(9);
    v[0] = 1.0 - 2.0 * (sy + sz);
    v[3] = 2.0 * (cz - wz);
    v[6] = 2.0 * (cy + wy);
    v[1] = 2.0 * (cz + wz);
    v[4] = 1.0 - 2.0 * (sx + sz);
    v[7] = 2.0 * (cx - wx);
    v[2] = 2.0 * (cy - wy);
    v[5] = 2.0 * (cx + wx);
    v[8] = 1.0 - 2.0 * (sx + sy);

    return new this(v, { type });
  }
}

/**
 * Immutable 3x3 matrix with 32-bit float components.
 * This is the standard precision implementation for normal matrices and other 3D math.
 */
export class Matrix33 extends Matrix33_<Float32ArrayConstructor> {
  /**
   * Creates a new Matrix33 instance.
   * @param m - The typed array containing the matrix components
   */
  constructor(m: TypedArray) {
    super(m, { type: Float32Array });
  }

  /** Creates a zero matrix. */
  static zero(): Matrix33 {
    return super._zero(Float32Array) as Matrix33;
  }

  /** Creates an identity matrix (optimized IdentityMatrix33 instance). */
  static identity(): IMatrix33 {
    return new IdentityMatrix33();
  }

  /** Creates a dummy matrix with an empty array. */
  static dummy(): Matrix33 {
    return super._dummy(Float32Array) as Matrix33;
  }

  /** Creates the transpose of the given matrix. */
  static transpose(mat: IMatrix33): Matrix33 {
    return super._transpose(mat, Float32Array) as Matrix33;
  }

  /** Attempts to invert the given matrix, returning null when it is singular. */
  static tryInvert(mat: IMatrix33): Matrix33 | null {
    return super._tryInvert(mat, Float32Array) as Matrix33 | null;
  }

  /** Creates the inverse of the given matrix (identity when singular). */
  static invert(mat: IMatrix33): Matrix33 {
    return super._invert(mat, Float32Array) as Matrix33;
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
  static rotateX(radian: number): Matrix33 {
    return super._rotateX(radian, Float32Array) as Matrix33;
  }

  /** Creates a rotation matrix around the Y-axis. */
  static rotateY(radian: number): Matrix33 {
    return super._rotateY(radian, Float32Array) as Matrix33;
  }

  /** Creates a rotation matrix around the Z-axis. */
  static rotateZ(radian: number): Matrix33 {
    return super._rotateZ(radian, Float32Array) as Matrix33;
  }

  /** Creates a rotation matrix from Euler angles in XYZ order. */
  static rotateXYZ(x: number, y: number, z: number): Matrix33 {
    return super._rotateXYZ(x, y, z, Float32Array) as Matrix33;
  }

  /** Creates a rotation matrix from a Vector3 containing Euler angles. */
  static rotate(vec: IVector3): Matrix33 {
    return super._rotate(vec, Float32Array) as Matrix33;
  }

  /** Creates a scaling matrix. */
  static scale(vec: IVector3): Matrix33 {
    return super._scale(vec, Float32Array) as Matrix33;
  }

  /** Multiplies two matrices. */
  static multiply(l_mat: IMatrix33, r_mat: IMatrix33): Matrix33 {
    return super._multiply(l_mat, r_mat, Float32Array) as Matrix33;
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
  ): Matrix33 {
    return super._fromCopy9RowMajor(m00, m01, m02, m10, m11, m12, m20, m21, m22, Float32Array) as Matrix33;
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
  ): Matrix33 {
    return super._fromCopy9ColumnMajor(m00, m10, m20, m01, m11, m21, m02, m12, m22, Float32Array) as Matrix33;
  }

  /** Creates a matrix from the upper-left 3x3 portion of a 4x4 matrix. */
  static fromCopyMatrix44(mat: IMatrix44): Matrix33 {
    return super._fromCopyMatrix44(mat, Float32Array) as Matrix33;
  }

  /** Creates a matrix that directly uses the given Float32Array. */
  static fromFloat32ArrayColumnMajor(array: Float32Array): Matrix33 {
    return super._fromTypedArrayColumnMajor(array, Float32Array) as Matrix33;
  }

  /** Creates a matrix by copying a Float32Array in column-major order. */
  static fromCopyFloat32ArrayColumnMajor(array: Float32Array): Matrix33 {
    return super._fromCopyTypedArrayColumnMajor(array, Float32Array) as Matrix33;
  }

  /** Creates a matrix by copying a Float32Array in row-major order. */
  static fromCopyFloat32ArrayRowMajor(array: Float32Array): Matrix33 {
    return super._fromCopyTypedArrayRowMajor(array, Float32Array) as Matrix33;
  }

  /** Creates a matrix by copying another matrix. */
  static fromCopyMatrix33(mat: IMatrix33): Matrix33 {
    return super._fromCopyMatrix33(mat, Float32Array) as Matrix33;
  }

  /** Creates a matrix from a 9-element array in column-major order. */
  static fromCopyArray9ColumnMajor(array: Array9<number>): Matrix33 {
    return super._fromCopyArray9ColumnMajor(array, Float32Array) as Matrix33;
  }

  /** Creates a matrix from an array in column-major order. */
  static fromCopyArrayColumnMajor(array: Array<number>): Matrix33 {
    return super._fromCopyArrayColumnMajor(array, Float32Array) as Matrix33;
  }

  /** Creates a matrix from a 9-element array in row-major order. */
  static fromCopyArray9RowMajor(array: Array9<number>): Matrix33 {
    return super._fromCopyArray9RowMajor(array, Float32Array) as Matrix33;
  }

  /** Creates a matrix from an array in row-major order. */
  static fromCopyArrayRowMajor(array: Array<number>): Matrix33 {
    return super._fromCopyArrayRowMajor(array, Float32Array) as Matrix33;
  }

  /** Creates a matrix from a quaternion representing a rotation. */
  static fromCopyQuaternion(q: IQuaternion): Matrix33 {
    return super._fromCopyQuaternion(q, Float32Array) as Matrix33;
  }
}

/**
 * Immutable 3x3 matrix with 64-bit float components.
 * Use this implementation when higher numerical precision is required.
 */
export class Matrix33D extends Matrix33_<Float64ArrayConstructor> {
  /**
   * Creates a new Matrix33D instance.
   * @param m - The typed array containing the matrix components
   */
  private constructor(m: TypedArray) {
    super(m, { type: Float64Array });
  }

  /** Creates a zero matrix. */
  static zero(): Matrix33D {
    return super._zero(Float64Array) as Matrix33D;
  }

  /** Creates an identity matrix. */
  static identity(): Matrix33D {
    return super._identity(Float64Array) as Matrix33D;
  }

  /** Creates a dummy matrix with an empty array. */
  static dummy(): Matrix33D {
    return super._dummy(Float64Array) as Matrix33D;
  }

  /** Creates the transpose of the given matrix. */
  static transpose(mat: IMatrix33): Matrix33D {
    return super._transpose(mat, Float64Array) as Matrix33D;
  }

  /** Attempts to invert the given matrix, returning null when it is singular. */
  static tryInvert(mat: IMatrix33): Matrix33D | null {
    return super._tryInvert(mat, Float64Array) as Matrix33D | null;
  }

  /** Creates the inverse of the given matrix (identity when singular). */
  static invert(mat: IMatrix33): Matrix33D {
    return super._invert(mat, Float64Array) as Matrix33D;
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
  static rotateX(radian: number): Matrix33D {
    return super._rotateX(radian, Float64Array) as Matrix33D;
  }

  /** Creates a rotation matrix around the Y-axis. */
  static rotateY(radian: number): Matrix33D {
    return super._rotateY(radian, Float64Array) as Matrix33D;
  }

  /** Creates a rotation matrix around the Z-axis. */
  static rotateZ(radian: number): Matrix33D {
    return super._rotateZ(radian, Float64Array) as Matrix33D;
  }

  /** Creates a rotation matrix from Euler angles in XYZ order. */
  static rotateXYZ(x: number, y: number, z: number): Matrix33D {
    return super._rotateXYZ(x, y, z, Float64Array) as Matrix33D;
  }

  /** Creates a rotation matrix from a Vector3 containing Euler angles. */
  static rotate(vec: IVector3): Matrix33D {
    return super._rotate(vec, Float64Array) as Matrix33D;
  }

  /** Creates a scaling matrix. */
  static scale(vec: IVector3): Matrix33D {
    return super._scale(vec, Float64Array) as Matrix33D;
  }

  /** Multiplies two matrices. */
  static multiply(l_mat: IMatrix33, r_mat: IMatrix33): Matrix33D {
    return super._multiply(l_mat, r_mat, Float64Array) as Matrix33D;
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
  ): Matrix33D {
    return super._fromCopy9RowMajor(m00, m01, m02, m10, m11, m12, m20, m21, m22, Float64Array) as Matrix33D;
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
  ): Matrix33D {
    return super._fromCopy9ColumnMajor(m00, m10, m20, m01, m11, m21, m02, m12, m22, Float64Array) as Matrix33D;
  }

  /** Creates a matrix from the upper-left 3x3 portion of a 4x4 matrix. */
  static fromCopyMatrix44(mat: IMatrix44): Matrix33D {
    return super._fromCopyMatrix44(mat, Float64Array) as Matrix33D;
  }

  /** Creates a matrix that directly uses the given Float64Array. */
  static fromFloat64ArrayColumnMajor(array: Float64Array): Matrix33D {
    return super._fromTypedArrayColumnMajor(array, Float64Array) as Matrix33D;
  }

  /** Creates a matrix by copying a Float64Array in column-major order. */
  static fromCopyFloat64ArrayColumnMajor(array: Float64Array): Matrix33D {
    return super._fromCopyTypedArrayColumnMajor(array, Float64Array) as Matrix33D;
  }

  /** Creates a matrix by copying a Float64Array in row-major order. */
  static fromCopyFloat64ArrayRowMajor(array: Float64Array): Matrix33D {
    return super._fromCopyTypedArrayRowMajor(array, Float64Array) as Matrix33D;
  }

  /** Creates a matrix by copying another matrix. */
  static fromCopyMatrix33(mat: IMatrix33): Matrix33D {
    return super._fromCopyMatrix33(mat, Float64Array) as Matrix33D;
  }

  /** Creates a matrix from a 9-element array in column-major order. */
  static fromCopyArray9ColumnMajor(array: Array9<number>): Matrix33D {
    return super._fromCopyArray9ColumnMajor(array, Float64Array) as Matrix33D;
  }

  /** Creates a matrix from an array in column-major order. */
  static fromCopyArrayColumnMajor(array: Array<number>): Matrix33D {
    return super._fromCopyArrayColumnMajor(array, Float64Array) as Matrix33D;
  }

  /** Creates a matrix from a 9-element array in row-major order. */
  static fromCopyArray9RowMajor(array: Array9<number>): Matrix33D {
    return super._fromCopyArray9RowMajor(array, Float64Array) as Matrix33D;
  }

  /** Creates a matrix from an array in row-major order. */
  static fromCopyArrayRowMajor(array: Array<number>): Matrix33D {
    return super._fromCopyArrayRowMajor(array, Float64Array) as Matrix33D;
  }

  /** Creates a matrix from a quaternion representing a rotation. */
  static fromCopyQuaternion(q: IQuaternion): Matrix33D {
    return super._fromCopyQuaternion(q, Float64Array) as Matrix33D;
  }
}

/**
 * Alias for the 32-bit (Float32Array) implementation, making the precision explicit.
 */
export { Matrix33 as Matrix33F };
