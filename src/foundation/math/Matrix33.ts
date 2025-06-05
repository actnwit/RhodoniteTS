import { Vector3 } from './Vector3';
import { Matrix44 } from './Matrix44';
import { Quaternion } from './Quaternion';
import { IMatrix, IMatrix33 } from './IMatrix';
import { MutableMatrix33 } from './MutableMatrix33';
import { CompositionType } from '../definitions/CompositionType';
import { MathUtil } from './MathUtil';
import { MutableVector3 } from './MutableVector3';
import { AbstractMatrix } from './AbstractMatrix';
import { IdentityMatrix33 } from './IdentityMatrix33';
import { IMutableVector3, IVector3 } from './IVector';
import { Array9 } from '../../types';
import { Logger } from '../misc/Logger';
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
export class Matrix33 extends AbstractMatrix implements IMatrix, IMatrix33 {
  /**
   * Creates a new Matrix33 instance.
   * @param m - Float32Array containing 9 matrix values in column-major order
   */
  constructor(m: Float32Array) {
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
  static zero() {
    return Matrix33.fromCopy9RowMajor(0, 0, 0, 0, 0, 0, 0, 0, 0);
  }

  /**
   * Creates an identity matrix.
   * @returns A new identity matrix (optimized IdentityMatrix33 instance)
   */
  static identity(): IMatrix33 {
    // return new this(
    //   1, 0, 0,
    //   0, 1, 0,
    //   0, 0, 1
    // );

    return new IdentityMatrix33();
  }

  /**
   * Creates a dummy matrix with empty data array.
   * Used for placeholder purposes.
   * @returns A new Matrix33 with empty Float32Array
   */
  static dummy() {
    return new this(new Float32Array(0));
  }

  /**
   * Creates the transpose of the given matrix.
   * @param mat - The matrix to transpose
   * @returns A new transposed matrix
   */
  static transpose(mat: IMatrix33): IMatrix33 {
    if (mat.isIdentityMatrixClass) {
      return mat;
    }

    return Matrix33.fromCopy9RowMajor(
      mat._v[0],
      mat._v[1],
      mat._v[2],
      mat._v[3],
      mat._v[4],
      mat._v[5],
      mat._v[6],
      mat._v[7],
      mat._v[8]
    );
  }

  /**
   * Creates the inverse of the given matrix.
   * @param mat - The matrix to invert
   * @returns A new inverted matrix
   * @throws Will log an error if the matrix is not invertible (determinant is 0)
   */
  static invert(mat: IMatrix33) {
    if (mat.isIdentityMatrixClass) {
      return mat;
    }
    const det = mat.determinant();
    if (det === 0) {
      Logger.error('the determinant is 0!');
    }

    const m00 = (mat._v[4] * mat._v[8] - mat._v[7] * mat._v[5]) / det;
    const m01 = (mat._v[6] * mat._v[5] - mat._v[3] * mat._v[8]) / det;
    const m02 = (mat._v[3] * mat._v[7] - mat._v[6] * mat._v[4]) / det;
    const m10 = (mat._v[7] * mat._v[2] - mat._v[1] * mat._v[8]) / det;
    const m11 = (mat._v[0] * mat._v[8] - mat._v[6] * mat._v[2]) / det;
    const m12 = (mat._v[6] * mat._v[1] - mat._v[0] * mat._v[7]) / det;
    const m20 = (mat._v[1] * mat._v[5] - mat._v[4] * mat._v[2]) / det;
    const m21 = (mat._v[3] * mat._v[2] - mat._v[0] * mat._v[5]) / det;
    const m22 = (mat._v[0] * mat._v[4] - mat._v[3] * mat._v[1]) / det;

    return Matrix33.fromCopy9RowMajor(m00, m01, m02, m10, m11, m12, m20, m21, m22);
  }

  /**
   * Calculates the inverse of the given matrix and stores the result in the output matrix.
   * @param mat - The matrix to invert
   * @param outMat - The output mutable matrix to store the result
   * @returns The output matrix containing the inverted matrix
   * @throws Will log an error if the matrix is not invertible (determinant is 0)
   */
  static invertTo(mat: IMatrix33, outMat: MutableMatrix33) {
    if (mat.isIdentityMatrixClass) {
      return outMat.copyComponents(mat);
    }
    const det = mat.determinant();
    if (det === 0) {
      Logger.error('the determinant is 0!');
    }

    const m00 = (mat._v[4] * mat._v[8] - mat._v[7] * mat._v[5]) / det;
    const m01 = (mat._v[6] * mat._v[5] - mat._v[3] * mat._v[8]) / det;
    const m02 = (mat._v[3] * mat._v[7] - mat._v[6] * mat._v[4]) / det;
    const m10 = (mat._v[7] * mat._v[2] - mat._v[1] * mat._v[8]) / det;
    const m11 = (mat._v[0] * mat._v[8] - mat._v[6] * mat._v[2]) / det;
    const m12 = (mat._v[6] * mat._v[1] - mat._v[0] * mat._v[7]) / det;
    const m20 = (mat._v[1] * mat._v[5] - mat._v[4] * mat._v[2]) / det;
    const m21 = (mat._v[3] * mat._v[2] - mat._v[0] * mat._v[5]) / det;
    const m22 = (mat._v[0] * mat._v[4] - mat._v[3] * mat._v[1]) / det;

    return outMat.setComponents(m00, m01, m02, m10, m11, m12, m20, m21, m22);
  }

  /**
   * Creates a rotation matrix around the X-axis.
   * @param radian - The rotation angle in radians
   * @returns A new rotation matrix
   */
  static rotateX(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return Matrix33.fromCopy9RowMajor(1, 0, 0, 0, cos, -sin, 0, sin, cos);
  }

  /**
   * Creates a rotation matrix around the Y-axis.
   * @param radian - The rotation angle in radians
   * @returns A new rotation matrix
   */
  static rotateY(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return Matrix33.fromCopy9RowMajor(cos, 0, sin, 0, 1, 0, -sin, 0, cos);
  }

  /**
   * Creates a rotation matrix around the Z-axis.
   * @param radian - The rotation angle in radians
   * @returns A new rotation matrix
   */
  static rotateZ(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return Matrix33.fromCopy9RowMajor(cos, -sin, 0, sin, cos, 0, 0, 0, 1);
  }

  /**
   * Creates a rotation matrix from Euler angles in XYZ order.
   * @param x - Rotation around X-axis in radians
   * @param y - Rotation around Y-axis in radians
   * @param z - Rotation around Z-axis in radians
   * @returns A new rotation matrix representing the combined rotations
   */
  static rotateXYZ(x: number, y: number, z: number) {
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

    return Matrix33.fromCopy9RowMajor(m00, m01, m02, m10, m11, m12, m20, m21, m22);
  }

  /**
   * Creates a rotation matrix from a Vector3 containing Euler angles.
   * @param vec - Vector3 containing rotation angles (x, y, z) in radians
   * @returns A new rotation matrix
   */
  static rotate(vec: Vector3) {
    return this.rotateXYZ(vec._v[0], vec._v[1], vec._v[2]);
  }

  /**
   * Creates a scaling matrix.
   * @param vec - Vector3 containing scale factors for each axis
   * @returns A new scaling matrix
   */
  static scale(vec: IVector3) {
    return Matrix33.fromCopy9RowMajor(vec._v[0], 0, 0, 0, vec._v[1], 0, 0, 0, vec._v[2]);
  }

  /**
   * Multiplies two matrices together.
   * @param l_mat - The left matrix
   * @param r_mat - The right matrix
   * @returns A new matrix representing l_mat * r_mat
   */
  static multiply(l_mat: IMatrix33, r_mat: IMatrix33): IMatrix33 {
    if (l_mat.isIdentityMatrixClass) {
      return r_mat;
    } else if (r_mat.isIdentityMatrixClass) {
      return l_mat;
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

    return Matrix33.fromCopy9RowMajor(m00, m01, m02, m10, m11, m12, m20, m21, m22);
  }

  /**
   * Multiplies two matrices and stores the result in an output matrix.
   * @param l_mat - The left matrix
   * @param r_mat - The right matrix
   * @param outMat - The output mutable matrix to store the result
   * @returns The output matrix containing l_mat * r_mat
   */
  static multiplyTo(l_mat: IMatrix33, r_mat: IMatrix33, outMat: MutableMatrix33) {
    if (l_mat.isIdentityMatrixClass) {
      return outMat.copyComponents(r_mat);
    } else if (r_mat.isIdentityMatrixClass) {
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
    return (
      this._v[0] +
      ' ' +
      this._v[3] +
      ' ' +
      this._v[6] +
      '\n' +
      this._v[1] +
      ' ' +
      this._v[4] +
      ' ' +
      this._v[7] +
      '\n' +
      this._v[2] +
      ' ' +
      this._v[5] +
      ' ' +
      this._v[8] +
      '\n'
    );
  }

  /**
   * Converts the matrix to a human-readable string with rounded values.
   * @returns A formatted string showing the matrix with financially rounded values
   */
  toStringApproximately() {
    return (
      MathUtil.financial(this._v[0]) +
      ' ' +
      MathUtil.financial(this._v[3]) +
      ' ' +
      MathUtil.financial(this._v[6]) +
      '\n' +
      MathUtil.financial(this._v[1]) +
      ' ' +
      MathUtil.financial(this._v[4]) +
      ' ' +
      MathUtil.financial(this._v[7]) +
      ' \n' +
      MathUtil.financial(this._v[2]) +
      ' ' +
      MathUtil.financial(this._v[5]) +
      ' ' +
      MathUtil.financial(this._v[8]) +
      '\n'
    );
  }

  /**
   * Converts the matrix to a flat array in column-major order.
   * @returns An array containing all 9 matrix elements
   */
  flattenAsArray() {
    return [
      this._v[0],
      this._v[1],
      this._v[2],
      this._v[3],
      this._v[4],
      this._v[5],
      this._v[6],
      this._v[7],
      this._v[8],
    ];
  }

  /**
   * Checks if this matrix is a dummy matrix (empty data array).
   * @returns True if the matrix has no data, false otherwise
   */
  isDummy() {
    if (this._v.length === 0) {
      return true;
    } else {
      return false;
    }
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
    } else {
      return false;
    }
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
    } else {
      return false;
    }
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
    return new Matrix33(v);
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
    return new Matrix33(v);
  }

  /**
   * Creates a Matrix33 from the upper-left 3x3 portion of a Matrix44.
   * @param mat - The Matrix44 to extract from
   * @returns A new Matrix33 instance
   */
  static fromCopyMatrix44(mat: Matrix44) {
    const v = new Float32Array(9);
    v[0] = mat._v[0];
    v[1] = mat._v[1];
    v[2] = mat._v[2];
    v[3] = mat._v[5];
    v[4] = mat._v[6];
    v[5] = mat._v[7];
    v[6] = mat._v[9];
    v[7] = mat._v[10];
    v[8] = mat._v[11];
    return new Matrix33(v);
  }

  /**
   * Creates a Matrix33 using the provided Float32Array directly (no copy).
   * @param float32Array - The Float32Array in column-major order
   * @returns A new Matrix33 instance
   */
  static fromFloat32ArrayColumnMajor(float32Array: Float32Array) {
    return new Matrix33(float32Array);
  }

  /**
   * Creates a Matrix33 by copying from a Float32Array in column-major order.
   * @param float32Array - The Float32Array to copy from
   * @returns A new Matrix33 instance
   */
  static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array) {
    const v = new Float32Array(9);
    v.set(float32Array);
    return new Matrix33(v);
  }

  /**
   * Creates a Matrix33 by copying from a Float32Array in row-major order.
   * @param array - The Float32Array in row-major order
   * @returns A new Matrix33 instance
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

    return new Matrix33(v);
  }

  /**
   * Creates a Matrix33 by copying from another IMatrix33.
   * @param mat - The matrix to copy from
   * @returns A new Matrix33 instance
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
    return new Matrix33(v);
  }

  /**
   * Creates a Matrix33 from an Array9 in column-major order.
   * @param array - The Array9 containing 9 numbers
   * @returns A new Matrix33 instance
   */
  static fromCopyArray9ColumnMajor(array: Array9<number>) {
    const v = new Float32Array(9);
    v.set(array);
    return new Matrix33(v);
  }

  /**
   * Creates a Matrix33 from a regular array in column-major order.
   * @param array - The array containing at least 9 numbers
   * @returns A new Matrix33 instance
   */
  static fromCopyArrayColumnMajor(array: Array<number>) {
    const v = new Float32Array(9);
    v.set(array);
    return new Matrix33(v);
  }

  /**
   * Creates a Matrix33 from an Array9 in row-major order.
   * @param array - The Array9 containing 9 numbers in row-major order
   * @returns A new Matrix33 instance
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
    return new Matrix33(v);
  }

  /**
   * Creates a Matrix33 from a regular array in row-major order.
   * @param array - The array containing at least 9 numbers in row-major order
   * @returns A new Matrix33 instance
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
    return new Matrix33(v);
  }

  /**
   * Creates a Matrix33 from a quaternion representing rotation.
   * @param q - The quaternion to convert
   * @returns A new Matrix33 representing the rotation
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

    return new Matrix33(v);
  }
}
