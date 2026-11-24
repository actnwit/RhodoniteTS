// src/foundation/math/Matrix33.ts
import { CompositionType } from "../definitions/CompositionType.js";
import { Logger } from "../misc/Logger.js";
import { AbstractMatrix } from "./AbstractMatrix.js";
import { IdentityMatrix33 } from "./IdentityMatrix33.js";
import { MathUtil } from "./MathUtil.js";
import { Vector3 } from "./Vector3.js";
var Matrix33_ = class extends AbstractMatrix {
  /**
   * Creates a new Matrix33_ instance.
   * @param m - Typed array containing 9 matrix values in column-major order
   * @param _options - Configuration object containing the typed array constructor
   */
  constructor(m, _options) {
    super();
    this._v = m;
  }
  /**
   * Gets the matrix element at row 0, column 0.
   * @returns The m00 component
   */
  get m00() {
    return this._v[0];
  }
  /**
   * Gets the matrix element at row 1, column 0.
   * @returns The m10 component
   */
  get m10() {
    return this._v[1];
  }
  /**
   * Gets the matrix element at row 2, column 0.
   * @returns The m20 component
   */
  get m20() {
    return this._v[2];
  }
  /**
   * Gets the matrix element at row 0, column 1.
   * @returns The m01 component
   */
  get m01() {
    return this._v[3];
  }
  /**
   * Gets the matrix element at row 1, column 1.
   * @returns The m11 component
   */
  get m11() {
    return this._v[4];
  }
  /**
   * Gets the matrix element at row 2, column 1.
   * @returns The m21 component
   */
  get m21() {
    return this._v[5];
  }
  /**
   * Gets the matrix element at row 0, column 2.
   * @returns The m02 component
   */
  get m02() {
    return this._v[6];
  }
  /**
   * Gets the matrix element at row 1, column 2.
   * @returns The m12 component
   */
  get m12() {
    return this._v[7];
  }
  /**
   * Gets the matrix element at row 2, column 2.
   * @returns The m22 component
   */
  get m22() {
    return this._v[8];
  }
  /**
   * Gets the class name.
   * @returns The string "Matrix33"
   */
  get className() {
    return "Matrix33";
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
  static _zero(type) {
    return this._fromCopy9RowMajor(0, 0, 0, 0, 0, 0, 0, 0, 0, type);
  }
  /**
   * Creates an identity matrix.
   * @returns A new identity matrix (optimized IdentityMatrix33 instance)
   */
  static _identity(type) {
    return this._fromCopy9RowMajor(1, 0, 0, 0, 1, 0, 0, 0, 1, type);
  }
  /**
   * Creates a dummy matrix with empty data array.
   * Used for placeholder purposes.
   * @returns A new Matrix33 with empty Float32Array
   */
  static _dummy(type) {
    return new this(new type(0), { type });
  }
  /**
   * Creates the transpose of the given matrix.
   * @param mat - The matrix to transpose
   * @returns A new transposed matrix
   */
  static _transpose(mat, type) {
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
  static _tryInvert(mat, type) {
    if (mat.isIdentityMatrixClass) {
      return this._fromCopyMatrix33(mat, type);
    }
    const det = mat.determinant();
    const rowNorm0 = Math.abs(mat._v[0]) + Math.abs(mat._v[3]) + Math.abs(mat._v[6]);
    const rowNorm1 = Math.abs(mat._v[1]) + Math.abs(mat._v[4]) + Math.abs(mat._v[7]);
    const rowNorm2 = Math.abs(mat._v[2]) + Math.abs(mat._v[5]) + Math.abs(mat._v[8]);
    if (MathUtil.isSingularDet(det, rowNorm0 * rowNorm1 * rowNorm2, MathUtil.getSingularEpsilon(mat._v.BYTES_PER_ELEMENT))) {
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
  static _invert(mat, type) {
    const inverted = this._tryInvert(mat, type);
    if (inverted !== null) {
      return inverted;
    }
    Logger.default.error("the matrix is singular and cannot be inverted. Returning an identity matrix instead.");
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
  static _tryInvertTo(mat, outMat) {
    if (mat.isIdentityMatrixClass) {
      outMat.copyComponents(mat);
      return true;
    }
    const det = mat.determinant();
    const rowNorm0 = Math.abs(mat._v[0]) + Math.abs(mat._v[3]) + Math.abs(mat._v[6]);
    const rowNorm1 = Math.abs(mat._v[1]) + Math.abs(mat._v[4]) + Math.abs(mat._v[7]);
    const rowNorm2 = Math.abs(mat._v[2]) + Math.abs(mat._v[5]) + Math.abs(mat._v[8]);
    if (MathUtil.isSingularDet(det, rowNorm0 * rowNorm1 * rowNorm2, MathUtil.getSingularEpsilon(mat._v.BYTES_PER_ELEMENT))) {
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
  static _invertTo(mat, outMat) {
    if (this._tryInvertTo(mat, outMat)) {
      return outMat;
    }
    Logger.default.error("the matrix is singular and cannot be inverted. Returning an identity matrix instead.");
    return outMat.identity();
  }
  /**
   * Creates a rotation matrix around the X-axis.
   * @param radian - The rotation angle in radians
   * @returns A new rotation matrix
   */
  static _rotateX(radian, type) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this._fromCopy9RowMajor(1, 0, 0, 0, cos, -sin, 0, sin, cos, type);
  }
  /**
   * Creates a rotation matrix around the Y-axis.
   * @param radian - The rotation angle in radians
   * @returns A new rotation matrix
   */
  static _rotateY(radian, type) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this._fromCopy9RowMajor(cos, 0, sin, 0, 1, 0, -sin, 0, cos, type);
  }
  /**
   * Creates a rotation matrix around the Z-axis.
   * @param radian - The rotation angle in radians
   * @returns A new rotation matrix
   */
  static _rotateZ(radian, type) {
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
  static _rotateXYZ(x, y, z, type) {
    const cosX = Math.cos(x);
    const sinX = Math.sin(x);
    const cosY = Math.cos(y);
    const sinY = Math.sin(y);
    const cosZ = Math.cos(z);
    const sinZ = Math.sin(z);
    const x11 = cosX;
    const x12 = -sinX;
    const x21 = sinX;
    const x22 = cosX;
    const y00 = cosY;
    const y02 = sinY;
    const y20 = -sinY;
    const y22 = cosY;
    const z00 = cosZ;
    const z01 = -sinZ;
    const z10 = sinZ;
    const z11 = cosZ;
    const yx00 = y00;
    const yx01 = y02 * x21;
    const yx02 = y02 * x22;
    const yx11 = x11;
    const yx12 = x12;
    const yx20 = y20;
    const yx21 = y22 * x21;
    const yx22 = y22 * x22;
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
  static _rotate(vec, type) {
    return this._rotateXYZ(vec._v[0], vec._v[1], vec._v[2], type);
  }
  /**
   * Creates a scaling matrix.
   * @param vec - Vector3 containing scale factors for each axis
   * @returns A new scaling matrix
   */
  static _scale(vec, type) {
    return this._fromCopy9RowMajor(vec._v[0], 0, 0, 0, vec._v[1], 0, 0, 0, vec._v[2], type);
  }
  /**
   * Multiplies two matrices together.
   * @param l_mat - The left matrix
   * @param r_mat - The right matrix
   * @returns A new matrix representing l_mat * r_mat
   */
  static _multiply(l_mat, r_mat, type) {
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
  static _multiplyTo(l_mat, r_mat, outMat) {
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
    return `${this._v[0]} ${this._v[3]} ${this._v[6]}
${this._v[1]} ${this._v[4]} ${this._v[7]}
${this._v[2]} ${this._v[5]} ${this._v[8]}
`;
  }
  /**
   * Converts the matrix to a human-readable string with rounded values.
   * @returns A formatted string showing the matrix with financially rounded values
   */
  toStringApproximately() {
    return `${MathUtil.financial(this._v[0])} ${MathUtil.financial(this._v[3])} ${MathUtil.financial(this._v[6])}
${MathUtil.financial(this._v[1])} ${MathUtil.financial(this._v[4])} ${MathUtil.financial(this._v[7])} 
${MathUtil.financial(this._v[2])} ${MathUtil.financial(this._v[5])} ${MathUtil.financial(this._v[8])}
`;
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
  isEqual(mat, delta = Number.EPSILON) {
    if (Math.abs(mat._v[0] - this._v[0]) < delta && Math.abs(mat._v[1] - this._v[1]) < delta && Math.abs(mat._v[2] - this._v[2]) < delta && Math.abs(mat._v[3] - this._v[3]) < delta && Math.abs(mat._v[4] - this._v[4]) < delta && Math.abs(mat._v[5] - this._v[5]) < delta && Math.abs(mat._v[6] - this._v[6]) < delta && Math.abs(mat._v[7] - this._v[7]) < delta && Math.abs(mat._v[8] - this._v[8]) < delta) {
      return true;
    }
    return false;
  }
  /**
   * Checks if this matrix is strictly equal to another matrix.
   * @param mat - The matrix to compare with
   * @returns True if all elements are exactly equal, false otherwise
   */
  isStrictEqual(mat) {
    if (mat._v[0] === this._v[0] && mat._v[1] === this._v[1] && mat._v[2] === this._v[2] && mat._v[3] === this._v[3] && mat._v[4] === this._v[4] && mat._v[5] === this._v[5] && mat._v[6] === this._v[6] && mat._v[7] === this._v[7] && mat._v[8] === this._v[8]) {
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
  at(row_i, column_i) {
    return this._v[row_i + column_i * 3];
  }
  /**
   * Gets the matrix element at the specified index in the internal array.
   * @param i - The index (0-8)
   * @returns The matrix element at the specified index
   */
  v(i) {
    return this._v[i];
  }
  /**
   * Calculates the determinant of this matrix.
   * @returns The determinant value
   */
  determinant() {
    return this._v[0] * this._v[4] * this._v[8] + this._v[1] * this._v[5] * this._v[6] + this._v[2] * this._v[3] * this._v[7] - this._v[0] * this._v[5] * this._v[7] - this._v[2] * this._v[4] * this._v[6] - this._v[1] * this._v[3] * this._v[8];
  }
  /**
   * Multiplies this matrix with a vector.
   * @param vec - The vector to multiply
   * @returns A new vector representing the result of matrix * vector
   */
  multiplyVector(vec) {
    const x = this._v[0] * vec._v[0] + this._v[3] * vec._v[1] + this._v[6] * vec._v[2];
    const y = this._v[1] * vec._v[0] + this._v[4] * vec._v[1] + this._v[7] * vec._v[2];
    const z = this._v[2] * vec._v[0] + this._v[5] * vec._v[1] + this._v[8] * vec._v[2];
    return new vec.constructor(new Float32Array([x, y, z]));
  }
  /**
   * Multiplies this matrix with a vector and stores the result in an output vector.
   * @param vec - The vector to multiply
   * @param outVec - The output mutable vector to store the result
   * @returns The output vector containing the result of matrix * vector
   */
  multiplyVectorTo(vec, outVec) {
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
      Math.hypot(this._v[6], this._v[7], this._v[8])
    ]);
  }
  /**
   * Extracts the scale factors from this matrix and stores them in an output vector.
   * @param outVec - The output mutable vector to store the scale factors
   * @returns The output vector containing the scale factors
   */
  getScaleTo(outVec) {
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
    return this.constructor.fromCopy9RowMajor(
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
  static _fromCopy9RowMajor(m00, m01, m02, m10, m11, m12, m20, m21, m22, type) {
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
  static _fromCopy9ColumnMajor(m00, m10, m20, m01, m11, m21, m02, m12, m22, type) {
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
  static _fromCopyMatrix44(mat, type) {
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
  static _fromTypedArrayColumnMajor(array, type) {
    return new this(array, { type });
  }
  /**
   * Creates a Matrix33 by copying from a Float32Array in column-major order.
   * @param float32Array - The Float32Array to copy from
   * @returns A new Matrix33 instance
   */
  static _fromCopyTypedArrayColumnMajor(array, type) {
    const v = new type(9);
    v.set(array);
    return new this(v, { type });
  }
  /**
   * Creates a Matrix33 by copying from a Float32Array in row-major order.
   * @param array - The Float32Array in row-major order
   * @returns A new Matrix33 instance
   */
  static _fromCopyTypedArrayRowMajor(array, type) {
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
  static _fromCopyMatrix33(mat, type) {
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
  static _fromCopyArray9ColumnMajor(array, type) {
    const v = new type(9);
    v.set(array);
    return new this(v, { type });
  }
  /**
   * Creates a Matrix33 from a regular array in column-major order.
   * @param array - The array containing at least 9 numbers
   * @returns A new Matrix33 instance
   */
  static _fromCopyArrayColumnMajor(array, type) {
    const v = new type(9);
    v.set(array);
    return new this(v, { type });
  }
  /**
   * Creates a Matrix33 from an Array9 in row-major order.
   * @param array - The Array9 containing 9 numbers in row-major order
   * @returns A new Matrix33 instance
   */
  static _fromCopyArray9RowMajor(array, type) {
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
  static _fromCopyArrayRowMajor(array, type) {
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
  static _fromCopyQuaternion(q, type) {
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
    v[0] = 1 - 2 * (sy + sz);
    v[3] = 2 * (cz - wz);
    v[6] = 2 * (cy + wy);
    v[1] = 2 * (cz + wz);
    v[4] = 1 - 2 * (sx + sz);
    v[7] = 2 * (cx - wx);
    v[2] = 2 * (cy - wy);
    v[5] = 2 * (cx + wx);
    v[8] = 1 - 2 * (sx + sy);
    return new this(v, { type });
  }
};
var Matrix33 = class extends Matrix33_ {
  /**
   * Creates a new Matrix33 instance.
   * @param m - The typed array containing the matrix components
   */
  constructor(m) {
    super(m, { type: Float32Array });
  }
  /** Creates a zero matrix. */
  static zero() {
    return super._zero(Float32Array);
  }
  /** Creates an identity matrix (optimized IdentityMatrix33 instance). */
  static identity() {
    return new IdentityMatrix33();
  }
  /** Creates a dummy matrix with an empty array. */
  static dummy() {
    return super._dummy(Float32Array);
  }
  /** Creates the transpose of the given matrix. */
  static transpose(mat) {
    return super._transpose(mat, Float32Array);
  }
  /** Attempts to invert the given matrix, returning null when it is singular. */
  static tryInvert(mat) {
    return super._tryInvert(mat, Float32Array);
  }
  /** Creates the inverse of the given matrix (identity when singular). */
  static invert(mat) {
    return super._invert(mat, Float32Array);
  }
  /** Attempts to invert the given matrix into outMat. */
  static tryInvertTo(mat, outMat) {
    return super._tryInvertTo(mat, outMat);
  }
  /** Inverts the given matrix into outMat (identity when singular). */
  static invertTo(mat, outMat) {
    return super._invertTo(mat, outMat);
  }
  /** Creates a rotation matrix around the X-axis. */
  static rotateX(radian) {
    return super._rotateX(radian, Float32Array);
  }
  /** Creates a rotation matrix around the Y-axis. */
  static rotateY(radian) {
    return super._rotateY(radian, Float32Array);
  }
  /** Creates a rotation matrix around the Z-axis. */
  static rotateZ(radian) {
    return super._rotateZ(radian, Float32Array);
  }
  /** Creates a rotation matrix from Euler angles in XYZ order. */
  static rotateXYZ(x, y, z) {
    return super._rotateXYZ(x, y, z, Float32Array);
  }
  /** Creates a rotation matrix from a Vector3 containing Euler angles. */
  static rotate(vec) {
    return super._rotate(vec, Float32Array);
  }
  /** Creates a scaling matrix. */
  static scale(vec) {
    return super._scale(vec, Float32Array);
  }
  /** Multiplies two matrices. */
  static multiply(l_mat, r_mat) {
    return super._multiply(l_mat, r_mat, Float32Array);
  }
  /** Multiplies two matrices and stores the result in outMat. */
  static multiplyTo(l_mat, r_mat, outMat) {
    return super._multiplyTo(l_mat, r_mat, outMat);
  }
  /** Creates a matrix from row-major components. */
  // prettier-ignore
  static fromCopy9RowMajor(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
    return super._fromCopy9RowMajor(m00, m01, m02, m10, m11, m12, m20, m21, m22, Float32Array);
  }
  /** Creates a matrix from column-major components. */
  // prettier-ignore
  static fromCopy9ColumnMajor(m00, m10, m20, m01, m11, m21, m02, m12, m22) {
    return super._fromCopy9ColumnMajor(m00, m10, m20, m01, m11, m21, m02, m12, m22, Float32Array);
  }
  /** Creates a matrix from the upper-left 3x3 portion of a 4x4 matrix. */
  static fromCopyMatrix44(mat) {
    return super._fromCopyMatrix44(mat, Float32Array);
  }
  /** Creates a matrix that directly uses the given Float32Array. */
  static fromFloat32ArrayColumnMajor(array) {
    return super._fromTypedArrayColumnMajor(array, Float32Array);
  }
  /** Creates a matrix by copying a Float32Array in column-major order. */
  static fromCopyFloat32ArrayColumnMajor(array) {
    return super._fromCopyTypedArrayColumnMajor(array, Float32Array);
  }
  /** Creates a matrix by copying a Float32Array in row-major order. */
  static fromCopyFloat32ArrayRowMajor(array) {
    return super._fromCopyTypedArrayRowMajor(array, Float32Array);
  }
  /** Creates a matrix by copying another matrix. */
  static fromCopyMatrix33(mat) {
    return super._fromCopyMatrix33(mat, Float32Array);
  }
  /** Creates a matrix from a 9-element array in column-major order. */
  static fromCopyArray9ColumnMajor(array) {
    return super._fromCopyArray9ColumnMajor(array, Float32Array);
  }
  /** Creates a matrix from an array in column-major order. */
  static fromCopyArrayColumnMajor(array) {
    return super._fromCopyArrayColumnMajor(array, Float32Array);
  }
  /** Creates a matrix from a 9-element array in row-major order. */
  static fromCopyArray9RowMajor(array) {
    return super._fromCopyArray9RowMajor(array, Float32Array);
  }
  /** Creates a matrix from an array in row-major order. */
  static fromCopyArrayRowMajor(array) {
    return super._fromCopyArrayRowMajor(array, Float32Array);
  }
  /** Creates a matrix from a quaternion representing a rotation. */
  static fromCopyQuaternion(q) {
    return super._fromCopyQuaternion(q, Float32Array);
  }
};
var Matrix33D = class extends Matrix33_ {
  /**
   * Creates a new Matrix33D instance.
   * @param m - The typed array containing the matrix components
   */
  constructor(m) {
    super(m, { type: Float64Array });
  }
  /** Creates a zero matrix. */
  static zero() {
    return super._zero(Float64Array);
  }
  /** Creates an identity matrix. */
  static identity() {
    return super._identity(Float64Array);
  }
  /** Creates a dummy matrix with an empty array. */
  static dummy() {
    return super._dummy(Float64Array);
  }
  /** Creates the transpose of the given matrix. */
  static transpose(mat) {
    return super._transpose(mat, Float64Array);
  }
  /** Attempts to invert the given matrix, returning null when it is singular. */
  static tryInvert(mat) {
    return super._tryInvert(mat, Float64Array);
  }
  /** Creates the inverse of the given matrix (identity when singular). */
  static invert(mat) {
    return super._invert(mat, Float64Array);
  }
  /** Attempts to invert the given matrix into outMat. */
  static tryInvertTo(mat, outMat) {
    return super._tryInvertTo(mat, outMat);
  }
  /** Inverts the given matrix into outMat (identity when singular). */
  static invertTo(mat, outMat) {
    return super._invertTo(mat, outMat);
  }
  /** Creates a rotation matrix around the X-axis. */
  static rotateX(radian) {
    return super._rotateX(radian, Float64Array);
  }
  /** Creates a rotation matrix around the Y-axis. */
  static rotateY(radian) {
    return super._rotateY(radian, Float64Array);
  }
  /** Creates a rotation matrix around the Z-axis. */
  static rotateZ(radian) {
    return super._rotateZ(radian, Float64Array);
  }
  /** Creates a rotation matrix from Euler angles in XYZ order. */
  static rotateXYZ(x, y, z) {
    return super._rotateXYZ(x, y, z, Float64Array);
  }
  /** Creates a rotation matrix from a Vector3 containing Euler angles. */
  static rotate(vec) {
    return super._rotate(vec, Float64Array);
  }
  /** Creates a scaling matrix. */
  static scale(vec) {
    return super._scale(vec, Float64Array);
  }
  /** Multiplies two matrices. */
  static multiply(l_mat, r_mat) {
    return super._multiply(l_mat, r_mat, Float64Array);
  }
  /** Multiplies two matrices and stores the result in outMat. */
  static multiplyTo(l_mat, r_mat, outMat) {
    return super._multiplyTo(l_mat, r_mat, outMat);
  }
  /** Creates a matrix from row-major components. */
  // prettier-ignore
  static fromCopy9RowMajor(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
    return super._fromCopy9RowMajor(m00, m01, m02, m10, m11, m12, m20, m21, m22, Float64Array);
  }
  /** Creates a matrix from column-major components. */
  // prettier-ignore
  static fromCopy9ColumnMajor(m00, m10, m20, m01, m11, m21, m02, m12, m22) {
    return super._fromCopy9ColumnMajor(m00, m10, m20, m01, m11, m21, m02, m12, m22, Float64Array);
  }
  /** Creates a matrix from the upper-left 3x3 portion of a 4x4 matrix. */
  static fromCopyMatrix44(mat) {
    return super._fromCopyMatrix44(mat, Float64Array);
  }
  /** Creates a matrix that directly uses the given Float64Array. */
  static fromFloat64ArrayColumnMajor(array) {
    return super._fromTypedArrayColumnMajor(array, Float64Array);
  }
  /** Creates a matrix by copying a Float64Array in column-major order. */
  static fromCopyFloat64ArrayColumnMajor(array) {
    return super._fromCopyTypedArrayColumnMajor(array, Float64Array);
  }
  /** Creates a matrix by copying a Float64Array in row-major order. */
  static fromCopyFloat64ArrayRowMajor(array) {
    return super._fromCopyTypedArrayRowMajor(array, Float64Array);
  }
  /** Creates a matrix by copying another matrix. */
  static fromCopyMatrix33(mat) {
    return super._fromCopyMatrix33(mat, Float64Array);
  }
  /** Creates a matrix from a 9-element array in column-major order. */
  static fromCopyArray9ColumnMajor(array) {
    return super._fromCopyArray9ColumnMajor(array, Float64Array);
  }
  /** Creates a matrix from an array in column-major order. */
  static fromCopyArrayColumnMajor(array) {
    return super._fromCopyArrayColumnMajor(array, Float64Array);
  }
  /** Creates a matrix from a 9-element array in row-major order. */
  static fromCopyArray9RowMajor(array) {
    return super._fromCopyArray9RowMajor(array, Float64Array);
  }
  /** Creates a matrix from an array in row-major order. */
  static fromCopyArrayRowMajor(array) {
    return super._fromCopyArrayRowMajor(array, Float64Array);
  }
  /** Creates a matrix from a quaternion representing a rotation. */
  static fromCopyQuaternion(q) {
    return super._fromCopyQuaternion(q, Float64Array);
  }
};
export {
  Matrix33,
  Matrix33D,
  Matrix33 as Matrix33F,
  Matrix33_
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9NYXRyaXgzMy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBBcnJheTkgfSBmcm9tICcuLi8uLi90eXBlcyc7XG5pbXBvcnQgdHlwZSB7IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yLCBUeXBlZEFycmF5IH0gZnJvbSAnLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHsgQ29tcG9zaXRpb25UeXBlIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvQ29tcG9zaXRpb25UeXBlJztcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4uL21pc2MvTG9nZ2VyJztcbmltcG9ydCB7IEFic3RyYWN0TWF0cml4IH0gZnJvbSAnLi9BYnN0cmFjdE1hdHJpeCc7XG5pbXBvcnQgeyBJZGVudGl0eU1hdHJpeDMzIH0gZnJvbSAnLi9JZGVudGl0eU1hdHJpeDMzJztcbmltcG9ydCB0eXBlIHsgSU1hdHJpeCwgSU1hdHJpeDMzLCBJTWF0cml4NDQsIElNdXRhYmxlTWF0cml4MzMgfSBmcm9tICcuL0lNYXRyaXgnO1xuaW1wb3J0IHR5cGUgeyBJUXVhdGVybmlvbiB9IGZyb20gJy4vSVF1YXRlcm5pb24nO1xuaW1wb3J0IHR5cGUgeyBJTXV0YWJsZVZlY3RvcjMsIElWZWN0b3IzIH0gZnJvbSAnLi9JVmVjdG9yJztcbmltcG9ydCB7IE1hdGhVdGlsIH0gZnJvbSAnLi9NYXRoVXRpbCc7XG5pbXBvcnQgdHlwZSB7IE11dGFibGVWZWN0b3IzIH0gZnJvbSAnLi9NdXRhYmxlVmVjdG9yMyc7XG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAnLi9WZWN0b3IzJztcbi8qIGVzbGludC1kaXNhYmxlIHByZXR0aWVyL3ByZXR0aWVyICovXG5cbi8qKlxuICogSW1tdXRhYmxlIDN4MyBtYXRyaXggY2xhc3MgZm9yIDNEIHRyYW5zZm9ybWF0aW9ucy5cbiAqIE1hdHJpeCB2YWx1ZXMgYXJlIHN0b3JlZCBpbiBjb2x1bW4tbWFqb3Igb3JkZXIgZm9yIFdlYkdMIGNvbXBhdGliaWxpdHkuXG4gKiBQcm92aWRlcyB2YXJpb3VzIG1hdHJpeCBvcGVyYXRpb25zIGluY2x1ZGluZyByb3RhdGlvbiwgc2NhbGluZywgYW5kIG11bHRpcGxpY2F0aW9uLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiAvLyBDcmVhdGUgaWRlbnRpdHkgbWF0cml4XG4gKiBjb25zdCBpZGVudGl0eSA9IE1hdHJpeDMzLmlkZW50aXR5KCk7XG4gKlxuICogLy8gQ3JlYXRlIHJvdGF0aW9uIG1hdHJpeFxuICogY29uc3Qgcm90YXRpb24gPSBNYXRyaXgzMy5yb3RhdGVaKE1hdGguUEkgLyA0KTtcbiAqXG4gKiAvLyBDcmVhdGUgc2NhbGUgbWF0cml4XG4gKiBjb25zdCBzY2FsZSA9IE1hdHJpeDMzLnNjYWxlKFZlY3RvcjMuZnJvbUNvcHlBcnJheShbMiwgMiwgMl0pKTtcbiAqXG4gKiAvLyBNYXRyaXggbXVsdGlwbGljYXRpb25cbiAqIGNvbnN0IHJlc3VsdCA9IE1hdHJpeDMzLm11bHRpcGx5KHJvdGF0aW9uLCBzY2FsZSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIE1hdHJpeDMzXzxUIGV4dGVuZHMgRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3I+IGV4dGVuZHMgQWJzdHJhY3RNYXRyaXggaW1wbGVtZW50cyBJTWF0cml4LCBJTWF0cml4MzMge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNYXRyaXgzM18gaW5zdGFuY2UuXG4gICAqIEBwYXJhbSBtIC0gVHlwZWQgYXJyYXkgY29udGFpbmluZyA5IG1hdHJpeCB2YWx1ZXMgaW4gY29sdW1uLW1ham9yIG9yZGVyXG4gICAqIEBwYXJhbSBfb3B0aW9ucyAtIENvbmZpZ3VyYXRpb24gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9yXG4gICAqL1xuICBjb25zdHJ1Y3RvcihtOiBUeXBlZEFycmF5LCBfb3B0aW9uczogeyB0eXBlOiBUIH0pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX3YgPSBtO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHJvdyAwLCBjb2x1bW4gMC5cbiAgICogQHJldHVybnMgVGhlIG0wMCBjb21wb25lbnRcbiAgICovXG4gIHB1YmxpYyBnZXQgbTAwKCkge1xuICAgIHJldHVybiB0aGlzLl92WzBdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHJvdyAxLCBjb2x1bW4gMC5cbiAgICogQHJldHVybnMgVGhlIG0xMCBjb21wb25lbnRcbiAgICovXG4gIHB1YmxpYyBnZXQgbTEwKCkge1xuICAgIHJldHVybiB0aGlzLl92WzFdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHJvdyAyLCBjb2x1bW4gMC5cbiAgICogQHJldHVybnMgVGhlIG0yMCBjb21wb25lbnRcbiAgICovXG4gIHB1YmxpYyBnZXQgbTIwKCkge1xuICAgIHJldHVybiB0aGlzLl92WzJdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHJvdyAwLCBjb2x1bW4gMS5cbiAgICogQHJldHVybnMgVGhlIG0wMSBjb21wb25lbnRcbiAgICovXG4gIHB1YmxpYyBnZXQgbTAxKCkge1xuICAgIHJldHVybiB0aGlzLl92WzNdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHJvdyAxLCBjb2x1bW4gMS5cbiAgICogQHJldHVybnMgVGhlIG0xMSBjb21wb25lbnRcbiAgICovXG4gIHB1YmxpYyBnZXQgbTExKCkge1xuICAgIHJldHVybiB0aGlzLl92WzRdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHJvdyAyLCBjb2x1bW4gMS5cbiAgICogQHJldHVybnMgVGhlIG0yMSBjb21wb25lbnRcbiAgICovXG4gIHB1YmxpYyBnZXQgbTIxKCkge1xuICAgIHJldHVybiB0aGlzLl92WzVdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHJvdyAwLCBjb2x1bW4gMi5cbiAgICogQHJldHVybnMgVGhlIG0wMiBjb21wb25lbnRcbiAgICovXG4gIHB1YmxpYyBnZXQgbTAyKCkge1xuICAgIHJldHVybiB0aGlzLl92WzZdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHJvdyAxLCBjb2x1bW4gMi5cbiAgICogQHJldHVybnMgVGhlIG0xMiBjb21wb25lbnRcbiAgICovXG4gIHB1YmxpYyBnZXQgbTEyKCkge1xuICAgIHJldHVybiB0aGlzLl92WzddO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHJvdyAyLCBjb2x1bW4gMi5cbiAgICogQHJldHVybnMgVGhlIG0yMiBjb21wb25lbnRcbiAgICovXG4gIHB1YmxpYyBnZXQgbTIyKCkge1xuICAgIHJldHVybiB0aGlzLl92WzhdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNsYXNzIG5hbWUuXG4gICAqIEByZXR1cm5zIFRoZSBzdHJpbmcgXCJNYXRyaXgzM1wiXG4gICAqL1xuICBnZXQgY2xhc3NOYW1lKCkge1xuICAgIHJldHVybiAnTWF0cml4MzMnO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdHJpeCBhcyBhIEdMU0wgbWF0MyBzdHJpbmcgd2l0aCBmbG9hdCBwcmVjaXNpb24uXG4gICAqIEByZXR1cm5zIEdMU0wgbWF0MyBjb25zdHJ1Y3RvciBzdHJpbmdcbiAgICovXG4gIGdldCBnbHNsU3RyQXNGbG9hdCgpIHtcbiAgICByZXR1cm4gYG1hdDMoJHtNYXRoVXRpbC5jb252ZXJ0VG9TdHJpbmdBc0dMU0xGbG9hdCh0aGlzLl92WzBdKX0sICR7TWF0aFV0aWwuY29udmVydFRvU3RyaW5nQXNHTFNMRmxvYXQodGhpcy5fdlsxXSl9LCAke01hdGhVdGlsLmNvbnZlcnRUb1N0cmluZ0FzR0xTTEZsb2F0KHRoaXMuX3ZbMl0pfSwgJHtNYXRoVXRpbC5jb252ZXJ0VG9TdHJpbmdBc0dMU0xGbG9hdCh0aGlzLl92WzNdKX0sICR7TWF0aFV0aWwuY29udmVydFRvU3RyaW5nQXNHTFNMRmxvYXQodGhpcy5fdls0XSl9LCAke01hdGhVdGlsLmNvbnZlcnRUb1N0cmluZ0FzR0xTTEZsb2F0KHRoaXMuX3ZbNV0pfSwgJHtNYXRoVXRpbC5jb252ZXJ0VG9TdHJpbmdBc0dMU0xGbG9hdCh0aGlzLl92WzZdKX0sICR7TWF0aFV0aWwuY29udmVydFRvU3RyaW5nQXNHTFNMRmxvYXQodGhpcy5fdls3XSl9LCAke01hdGhVdGlsLmNvbnZlcnRUb1N0cmluZ0FzR0xTTEZsb2F0KHRoaXMuX3ZbOF0pfSlgO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdHJpeCBhcyBhIEdMU0wgbWF0MyBzdHJpbmcgd2l0aCBpbnRlZ2VyIHZhbHVlcy5cbiAgICogQHJldHVybnMgR0xTTCBtYXQzIGNvbnN0cnVjdG9yIHN0cmluZyB3aXRoIGZsb29yZWQgdmFsdWVzXG4gICAqL1xuICBnZXQgZ2xzbFN0ckFzSW50KCkge1xuICAgIHJldHVybiBgbWF0Mygke01hdGguZmxvb3IodGhpcy5fdlswXSl9LCAke01hdGguZmxvb3IodGhpcy5fdlsxXSl9LCAke01hdGguZmxvb3IodGhpcy5fdlsyXSl9LCAke01hdGguZmxvb3IodGhpcy5fdlszXSl9LCAke01hdGguZmxvb3IodGhpcy5fdls0XSl9LCAke01hdGguZmxvb3IodGhpcy5fdls1XSl9LCAke01hdGguZmxvb3IodGhpcy5fdls2XSl9LCAke01hdGguZmxvb3IodGhpcy5fdls3XSl9LCAke01hdGguZmxvb3IodGhpcy5fdls4XSl9KWA7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF0cml4IGFzIGEgV0dTTCBtYXQzeDNmIHN0cmluZyB3aXRoIGZsb2F0IHByZWNpc2lvbi5cbiAgICogQHJldHVybnMgV0dTTCBtYXQzeDNmIGNvbnN0cnVjdG9yIHN0cmluZ1xuICAgKi9cbiAgZ2V0IHdnc2xTdHJBc0Zsb2F0KCkge1xuICAgIHJldHVybiBgbWF0M3gzZigke01hdGhVdGlsLmNvbnZlcnRUb1N0cmluZ0FzR0xTTEZsb2F0KHRoaXMuX3ZbMF0pfSwgJHtNYXRoVXRpbC5jb252ZXJ0VG9TdHJpbmdBc0dMU0xGbG9hdCh0aGlzLl92WzFdKX0sICR7TWF0aFV0aWwuY29udmVydFRvU3RyaW5nQXNHTFNMRmxvYXQodGhpcy5fdlsyXSl9LCAke01hdGhVdGlsLmNvbnZlcnRUb1N0cmluZ0FzR0xTTEZsb2F0KHRoaXMuX3ZbM10pfSwgJHtNYXRoVXRpbC5jb252ZXJ0VG9TdHJpbmdBc0dMU0xGbG9hdCh0aGlzLl92WzRdKX0sICR7TWF0aFV0aWwuY29udmVydFRvU3RyaW5nQXNHTFNMRmxvYXQodGhpcy5fdls1XSl9LCAke01hdGhVdGlsLmNvbnZlcnRUb1N0cmluZ0FzR0xTTEZsb2F0KHRoaXMuX3ZbNl0pfSwgJHtNYXRoVXRpbC5jb252ZXJ0VG9TdHJpbmdBc0dMU0xGbG9hdCh0aGlzLl92WzddKX0sICR7TWF0aFV0aWwuY29udmVydFRvU3RyaW5nQXNHTFNMRmxvYXQodGhpcy5fdls4XSl9KWA7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF0cml4IGFzIGEgV0dTTCBtYXQzeDNpIHN0cmluZyB3aXRoIGludGVnZXIgdmFsdWVzLlxuICAgKiBAcmV0dXJucyBXR1NMIG1hdDN4M2kgY29uc3RydWN0b3Igc3RyaW5nIHdpdGggZmxvb3JlZCB2YWx1ZXNcbiAgICovXG4gIGdldCB3Z3NsU3RyQXNJbnQoKSB7XG4gICAgcmV0dXJuIGBtYXQzeDNpKCR7TWF0aC5mbG9vcih0aGlzLl92WzBdKX0sICR7TWF0aC5mbG9vcih0aGlzLl92WzFdKX0sICR7TWF0aC5mbG9vcih0aGlzLl92WzJdKX0sICR7TWF0aC5mbG9vcih0aGlzLl92WzNdKX0sICR7TWF0aC5mbG9vcih0aGlzLl92WzRdKX0sICR7TWF0aC5mbG9vcih0aGlzLl92WzVdKX0sICR7TWF0aC5mbG9vcih0aGlzLl92WzZdKX0sICR7TWF0aC5mbG9vcih0aGlzLl92WzddKX0sICR7TWF0aC5mbG9vcih0aGlzLl92WzhdKX0pYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb21wb3NpdGlvbiB0eXBlIGZvciB0aGlzIG1hdHJpeC5cbiAgICogQHJldHVybnMgQ29tcG9zaXRpb25UeXBlLk1hdDNcbiAgICovXG4gIHN0YXRpYyBnZXQgY29tcG9zaXRpb25UeXBlKCkge1xuICAgIHJldHVybiBDb21wb3NpdGlvblR5cGUuTWF0MztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgemVybyBtYXRyaXggKGFsbCBlbGVtZW50cyBhcmUgMCkuXG4gICAqIEByZXR1cm5zIEEgbmV3IE1hdHJpeDMzIHdpdGggYWxsIHplcm8gZWxlbWVudHNcbiAgICovXG4gIHN0YXRpYyBfemVybyh0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcik6IElNYXRyaXgzMyB7XG4gICAgcmV0dXJuIHRoaXMuX2Zyb21Db3B5OVJvd01ham9yKDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIHR5cGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gaWRlbnRpdHkgbWF0cml4LlxuICAgKiBAcmV0dXJucyBBIG5ldyBpZGVudGl0eSBtYXRyaXggKG9wdGltaXplZCBJZGVudGl0eU1hdHJpeDMzIGluc3RhbmNlKVxuICAgKi9cbiAgc3RhdGljIF9pZGVudGl0eSh0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcik6IElNYXRyaXgzMyB7XG4gICAgcmV0dXJuIHRoaXMuX2Zyb21Db3B5OVJvd01ham9yKDEsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDEsIHR5cGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBkdW1teSBtYXRyaXggd2l0aCBlbXB0eSBkYXRhIGFycmF5LlxuICAgKiBVc2VkIGZvciBwbGFjZWhvbGRlciBwdXJwb3Nlcy5cbiAgICogQHJldHVybnMgQSBuZXcgTWF0cml4MzMgd2l0aCBlbXB0eSBGbG9hdDMyQXJyYXlcbiAgICovXG4gIHN0YXRpYyBfZHVtbXkodHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpOiBJTWF0cml4MzMge1xuICAgIHJldHVybiBuZXcgdGhpcyhuZXcgdHlwZSgwKSwgeyB0eXBlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgdGhlIHRyYW5zcG9zZSBvZiB0aGUgZ2l2ZW4gbWF0cml4LlxuICAgKiBAcGFyYW0gbWF0IC0gVGhlIG1hdHJpeCB0byB0cmFuc3Bvc2VcbiAgICogQHJldHVybnMgQSBuZXcgdHJhbnNwb3NlZCBtYXRyaXhcbiAgICovXG4gIHN0YXRpYyBfdHJhbnNwb3NlKG1hdDogSU1hdHJpeDMzLCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcik6IElNYXRyaXgzMyB7XG4gICAgaWYgKG1hdC5pc0lkZW50aXR5TWF0cml4Q2xhc3MpIHtcbiAgICAgIHJldHVybiB0aGlzLl9mcm9tQ29weU1hdHJpeDMzKG1hdCwgdHlwZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX2Zyb21Db3B5OVJvd01ham9yKFxuICAgICAgbWF0Ll92WzBdLFxuICAgICAgbWF0Ll92WzFdLFxuICAgICAgbWF0Ll92WzJdLFxuICAgICAgbWF0Ll92WzNdLFxuICAgICAgbWF0Ll92WzRdLFxuICAgICAgbWF0Ll92WzVdLFxuICAgICAgbWF0Ll92WzZdLFxuICAgICAgbWF0Ll92WzddLFxuICAgICAgbWF0Ll92WzhdLFxuICAgICAgdHlwZVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQXR0ZW1wdHMgdG8gY3JlYXRlIHRoZSBpbnZlcnNlIG9mIHRoZSBnaXZlbiBtYXRyaXguXG4gICAqXG4gICAqIFJldHVybnMgbnVsbCBpbnN0ZWFkIG9mIGRpdmlkaW5nIGJ5IHplcm8gd2hlbiB0aGUgbWF0cml4IGlzIG51bWVyaWNhbGx5XG4gICAqIHNpbmd1bGFyIChzZWUge0BsaW5rIE1hdGhVdGlsLmlzU2luZ3VsYXJEZXR9KS5cbiAgICpcbiAgICogQHBhcmFtIG1hdCAtIFRoZSBtYXRyaXggdG8gaW52ZXJ0XG4gICAqIEByZXR1cm5zIEEgbmV3IGludmVydGVkIG1hdHJpeCwgb3IgbnVsbCBpZiB0aGUgbWF0cml4IGlzIG5vdCBpbnZlcnRpYmxlXG4gICAqL1xuICBzdGF0aWMgX3RyeUludmVydChtYXQ6IElNYXRyaXgzMywgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpOiBJTWF0cml4MzMgfCBudWxsIHtcbiAgICBpZiAobWF0LmlzSWRlbnRpdHlNYXRyaXhDbGFzcykge1xuICAgICAgcmV0dXJuIHRoaXMuX2Zyb21Db3B5TWF0cml4MzMobWF0LCB0eXBlKTtcbiAgICB9XG5cbiAgICBjb25zdCBkZXQgPSBtYXQuZGV0ZXJtaW5hbnQoKTtcbiAgICBjb25zdCByb3dOb3JtMCA9IE1hdGguYWJzKG1hdC5fdlswXSkgKyBNYXRoLmFicyhtYXQuX3ZbM10pICsgTWF0aC5hYnMobWF0Ll92WzZdKTtcbiAgICBjb25zdCByb3dOb3JtMSA9IE1hdGguYWJzKG1hdC5fdlsxXSkgKyBNYXRoLmFicyhtYXQuX3ZbNF0pICsgTWF0aC5hYnMobWF0Ll92WzddKTtcbiAgICBjb25zdCByb3dOb3JtMiA9IE1hdGguYWJzKG1hdC5fdlsyXSkgKyBNYXRoLmFicyhtYXQuX3ZbNV0pICsgTWF0aC5hYnMobWF0Ll92WzhdKTtcbiAgICBpZiAoXG4gICAgICBNYXRoVXRpbC5pc1Npbmd1bGFyRGV0KGRldCwgcm93Tm9ybTAgKiByb3dOb3JtMSAqIHJvd05vcm0yLCBNYXRoVXRpbC5nZXRTaW5ndWxhckVwc2lsb24obWF0Ll92LkJZVEVTX1BFUl9FTEVNRU5UKSlcbiAgICApIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGludkRldCA9IDEgLyBkZXQ7XG4gICAgY29uc3QgbTAwID0gKG1hdC5fdls0XSAqIG1hdC5fdls4XSAtIG1hdC5fdls3XSAqIG1hdC5fdls1XSkgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTAxID0gKG1hdC5fdls2XSAqIG1hdC5fdls1XSAtIG1hdC5fdlszXSAqIG1hdC5fdls4XSkgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTAyID0gKG1hdC5fdlszXSAqIG1hdC5fdls3XSAtIG1hdC5fdls2XSAqIG1hdC5fdls0XSkgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTEwID0gKG1hdC5fdls3XSAqIG1hdC5fdlsyXSAtIG1hdC5fdlsxXSAqIG1hdC5fdls4XSkgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTExID0gKG1hdC5fdlswXSAqIG1hdC5fdls4XSAtIG1hdC5fdls2XSAqIG1hdC5fdlsyXSkgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTEyID0gKG1hdC5fdls2XSAqIG1hdC5fdlsxXSAtIG1hdC5fdlswXSAqIG1hdC5fdls3XSkgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTIwID0gKG1hdC5fdlsxXSAqIG1hdC5fdls1XSAtIG1hdC5fdls0XSAqIG1hdC5fdlsyXSkgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTIxID0gKG1hdC5fdlszXSAqIG1hdC5fdlsyXSAtIG1hdC5fdlswXSAqIG1hdC5fdls1XSkgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTIyID0gKG1hdC5fdlswXSAqIG1hdC5fdls0XSAtIG1hdC5fdlszXSAqIG1hdC5fdlsxXSkgKiBpbnZEZXQ7XG5cbiAgICByZXR1cm4gdGhpcy5fZnJvbUNvcHk5Um93TWFqb3IobTAwLCBtMDEsIG0wMiwgbTEwLCBtMTEsIG0xMiwgbTIwLCBtMjEsIG0yMiwgdHlwZSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyB0aGUgaW52ZXJzZSBvZiB0aGUgZ2l2ZW4gbWF0cml4LlxuICAgKlxuICAgKiBJZiB0aGUgbWF0cml4IGlzIG51bWVyaWNhbGx5IHNpbmd1bGFyLCBhbiBpZGVudGl0eSBtYXRyaXggaXMgcmV0dXJuZWRcbiAgICogaW5zdGVhZCBvZiBkaXZpZGluZyBieSB6ZXJvLiBVc2Uge0BsaW5rIE1hdHJpeDMzLnRyeUludmVydH0gd2hlbiB0aGVcbiAgICogY2FsbGVyIG5lZWRzIHRvIGRldGVjdCB0aGUgZmFpbHVyZS5cbiAgICpcbiAgICogQHBhcmFtIG1hdCAtIFRoZSBtYXRyaXggdG8gaW52ZXJ0XG4gICAqIEByZXR1cm5zIEEgbmV3IGludmVydGVkIG1hdHJpeCwgb3IgdGhlIGlkZW50aXR5IG1hdHJpeCBpZiB0aGUgaW5wdXQgaXMgc2luZ3VsYXJcbiAgICovXG4gIHN0YXRpYyBfaW52ZXJ0KG1hdDogSU1hdHJpeDMzLCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcik6IElNYXRyaXgzMyB7XG4gICAgY29uc3QgaW52ZXJ0ZWQgPSB0aGlzLl90cnlJbnZlcnQobWF0LCB0eXBlKTtcbiAgICBpZiAoaW52ZXJ0ZWQgIT09IG51bGwpIHtcbiAgICAgIHJldHVybiBpbnZlcnRlZDtcbiAgICB9XG5cbiAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcigndGhlIG1hdHJpeCBpcyBzaW5ndWxhciBhbmQgY2Fubm90IGJlIGludmVydGVkLiBSZXR1cm5pbmcgYW4gaWRlbnRpdHkgbWF0cml4IGluc3RlYWQuJyk7XG4gICAgcmV0dXJuIHRoaXMuX2Zyb21Db3B5OVJvd01ham9yKDEsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDEsIHR5cGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGVtcHRzIHRvIGNhbGN1bGF0ZSB0aGUgaW52ZXJzZSBvZiB0aGUgZ2l2ZW4gbWF0cml4IGFuZCBzdG9yZXMgdGhlXG4gICAqIHJlc3VsdCBpbiB0aGUgb3V0cHV0IG1hdHJpeC4gVGhlIG91dHB1dCBtYXRyaXggaXMgbGVmdCB1bnRvdWNoZWQgd2hlbiB0aGVcbiAgICogaW5wdXQgaXMgbnVtZXJpY2FsbHkgc2luZ3VsYXIuXG4gICAqXG4gICAqIEBwYXJhbSBtYXQgLSBUaGUgbWF0cml4IHRvIGludmVydFxuICAgKiBAcGFyYW0gb3V0TWF0IC0gVGhlIG91dHB1dCBtdXRhYmxlIG1hdHJpeCB0byBzdG9yZSB0aGUgcmVzdWx0XG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIGludmVyc2lvbiBzdWNjZWVkZWQsIGZhbHNlIGlmIHRoZSBtYXRyaXggaXMgc2luZ3VsYXJcbiAgICovXG4gIHN0YXRpYyBfdHJ5SW52ZXJ0VG8obWF0OiBJTWF0cml4MzMsIG91dE1hdDogSU11dGFibGVNYXRyaXgzMyk6IGJvb2xlYW4ge1xuICAgIGlmIChtYXQuaXNJZGVudGl0eU1hdHJpeENsYXNzKSB7XG4gICAgICBvdXRNYXQuY29weUNvbXBvbmVudHMobWF0KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGRldCA9IG1hdC5kZXRlcm1pbmFudCgpO1xuICAgIGNvbnN0IHJvd05vcm0wID0gTWF0aC5hYnMobWF0Ll92WzBdKSArIE1hdGguYWJzKG1hdC5fdlszXSkgKyBNYXRoLmFicyhtYXQuX3ZbNl0pO1xuICAgIGNvbnN0IHJvd05vcm0xID0gTWF0aC5hYnMobWF0Ll92WzFdKSArIE1hdGguYWJzKG1hdC5fdls0XSkgKyBNYXRoLmFicyhtYXQuX3ZbN10pO1xuICAgIGNvbnN0IHJvd05vcm0yID0gTWF0aC5hYnMobWF0Ll92WzJdKSArIE1hdGguYWJzKG1hdC5fdls1XSkgKyBNYXRoLmFicyhtYXQuX3ZbOF0pO1xuICAgIGlmIChcbiAgICAgIE1hdGhVdGlsLmlzU2luZ3VsYXJEZXQoZGV0LCByb3dOb3JtMCAqIHJvd05vcm0xICogcm93Tm9ybTIsIE1hdGhVdGlsLmdldFNpbmd1bGFyRXBzaWxvbihtYXQuX3YuQllURVNfUEVSX0VMRU1FTlQpKVxuICAgICkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IGludkRldCA9IDEgLyBkZXQ7XG4gICAgY29uc3QgbTAwID0gKG1hdC5fdls0XSAqIG1hdC5fdls4XSAtIG1hdC5fdls3XSAqIG1hdC5fdls1XSkgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTAxID0gKG1hdC5fdls2XSAqIG1hdC5fdls1XSAtIG1hdC5fdlszXSAqIG1hdC5fdls4XSkgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTAyID0gKG1hdC5fdlszXSAqIG1hdC5fdls3XSAtIG1hdC5fdls2XSAqIG1hdC5fdls0XSkgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTEwID0gKG1hdC5fdls3XSAqIG1hdC5fdlsyXSAtIG1hdC5fdlsxXSAqIG1hdC5fdls4XSkgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTExID0gKG1hdC5fdlswXSAqIG1hdC5fdls4XSAtIG1hdC5fdls2XSAqIG1hdC5fdlsyXSkgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTEyID0gKG1hdC5fdls2XSAqIG1hdC5fdlsxXSAtIG1hdC5fdlswXSAqIG1hdC5fdls3XSkgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTIwID0gKG1hdC5fdlsxXSAqIG1hdC5fdls1XSAtIG1hdC5fdls0XSAqIG1hdC5fdlsyXSkgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTIxID0gKG1hdC5fdlszXSAqIG1hdC5fdlsyXSAtIG1hdC5fdlswXSAqIG1hdC5fdls1XSkgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTIyID0gKG1hdC5fdlswXSAqIG1hdC5fdls0XSAtIG1hdC5fdlszXSAqIG1hdC5fdlsxXSkgKiBpbnZEZXQ7XG5cbiAgICBvdXRNYXQuc2V0Q29tcG9uZW50cyhtMDAsIG0wMSwgbTAyLCBtMTAsIG0xMSwgbTEyLCBtMjAsIG0yMSwgbTIyKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIHRoZSBpbnZlcnNlIG9mIHRoZSBnaXZlbiBtYXRyaXggYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIHRoZSBvdXRwdXQgbWF0cml4LlxuICAgKlxuICAgKiBJZiB0aGUgbWF0cml4IGlzIG51bWVyaWNhbGx5IHNpbmd1bGFyLCB0aGUgb3V0cHV0IG1hdHJpeCBpcyBzZXQgdG8gdGhlXG4gICAqIGlkZW50aXR5IG1hdHJpeCBpbnN0ZWFkIG9mIGJlaW5nIGZpbGxlZCB3aXRoIGBJbmZpbml0eWAvYE5hTmAuXG4gICAqIFVzZSB7QGxpbmsgTWF0cml4MzMudHJ5SW52ZXJ0VG99IHdoZW4gdGhlIGNhbGxlciBuZWVkcyB0byBkZXRlY3QgdGhlIGZhaWx1cmUuXG4gICAqXG4gICAqIEBwYXJhbSBtYXQgLSBUaGUgbWF0cml4IHRvIGludmVydFxuICAgKiBAcGFyYW0gb3V0TWF0IC0gVGhlIG91dHB1dCBtdXRhYmxlIG1hdHJpeCB0byBzdG9yZSB0aGUgcmVzdWx0XG4gICAqIEByZXR1cm5zIFRoZSBvdXRwdXQgbWF0cml4IGNvbnRhaW5pbmcgdGhlIGludmVydGVkIG1hdHJpeCwgb3IgdGhlIGlkZW50aXR5IG1hdHJpeCBpZiB0aGUgaW5wdXQgaXMgc2luZ3VsYXJcbiAgICovXG4gIHN0YXRpYyBfaW52ZXJ0VG8obWF0OiBJTWF0cml4MzMsIG91dE1hdDogSU11dGFibGVNYXRyaXgzMyk6IElNdXRhYmxlTWF0cml4MzMge1xuICAgIGlmICh0aGlzLl90cnlJbnZlcnRUbyhtYXQsIG91dE1hdCkpIHtcbiAgICAgIHJldHVybiBvdXRNYXQ7XG4gICAgfVxuXG4gICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJ3RoZSBtYXRyaXggaXMgc2luZ3VsYXIgYW5kIGNhbm5vdCBiZSBpbnZlcnRlZC4gUmV0dXJuaW5nIGFuIGlkZW50aXR5IG1hdHJpeCBpbnN0ZWFkLicpO1xuICAgIHJldHVybiBvdXRNYXQuaWRlbnRpdHkoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcm90YXRpb24gbWF0cml4IGFyb3VuZCB0aGUgWC1heGlzLlxuICAgKiBAcGFyYW0gcmFkaWFuIC0gVGhlIHJvdGF0aW9uIGFuZ2xlIGluIHJhZGlhbnNcbiAgICogQHJldHVybnMgQSBuZXcgcm90YXRpb24gbWF0cml4XG4gICAqL1xuICBzdGF0aWMgX3JvdGF0ZVgocmFkaWFuOiBudW1iZXIsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKTogSU1hdHJpeDMzIHtcbiAgICBjb25zdCBjb3MgPSBNYXRoLmNvcyhyYWRpYW4pO1xuICAgIGNvbnN0IHNpbiA9IE1hdGguc2luKHJhZGlhbik7XG4gICAgcmV0dXJuIHRoaXMuX2Zyb21Db3B5OVJvd01ham9yKDEsIDAsIDAsIDAsIGNvcywgLXNpbiwgMCwgc2luLCBjb3MsIHR5cGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSByb3RhdGlvbiBtYXRyaXggYXJvdW5kIHRoZSBZLWF4aXMuXG4gICAqIEBwYXJhbSByYWRpYW4gLSBUaGUgcm90YXRpb24gYW5nbGUgaW4gcmFkaWFuc1xuICAgKiBAcmV0dXJucyBBIG5ldyByb3RhdGlvbiBtYXRyaXhcbiAgICovXG4gIHN0YXRpYyBfcm90YXRlWShyYWRpYW46IG51bWJlciwgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpOiBJTWF0cml4MzMge1xuICAgIGNvbnN0IGNvcyA9IE1hdGguY29zKHJhZGlhbik7XG4gICAgY29uc3Qgc2luID0gTWF0aC5zaW4ocmFkaWFuKTtcbiAgICByZXR1cm4gdGhpcy5fZnJvbUNvcHk5Um93TWFqb3IoY29zLCAwLCBzaW4sIDAsIDEsIDAsIC1zaW4sIDAsIGNvcywgdHlwZSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHJvdGF0aW9uIG1hdHJpeCBhcm91bmQgdGhlIFotYXhpcy5cbiAgICogQHBhcmFtIHJhZGlhbiAtIFRoZSByb3RhdGlvbiBhbmdsZSBpbiByYWRpYW5zXG4gICAqIEByZXR1cm5zIEEgbmV3IHJvdGF0aW9uIG1hdHJpeFxuICAgKi9cbiAgc3RhdGljIF9yb3RhdGVaKHJhZGlhbjogbnVtYmVyLCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcik6IElNYXRyaXgzMyB7XG4gICAgY29uc3QgY29zID0gTWF0aC5jb3MocmFkaWFuKTtcbiAgICBjb25zdCBzaW4gPSBNYXRoLnNpbihyYWRpYW4pO1xuICAgIHJldHVybiB0aGlzLl9mcm9tQ29weTlSb3dNYWpvcihjb3MsIC1zaW4sIDAsIHNpbiwgY29zLCAwLCAwLCAwLCAxLCB0eXBlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcm90YXRpb24gbWF0cml4IGZyb20gRXVsZXIgYW5nbGVzIGluIFhZWiBvcmRlci5cbiAgICogQHBhcmFtIHggLSBSb3RhdGlvbiBhcm91bmQgWC1heGlzIGluIHJhZGlhbnNcbiAgICogQHBhcmFtIHkgLSBSb3RhdGlvbiBhcm91bmQgWS1heGlzIGluIHJhZGlhbnNcbiAgICogQHBhcmFtIHogLSBSb3RhdGlvbiBhcm91bmQgWi1heGlzIGluIHJhZGlhbnNcbiAgICogQHJldHVybnMgQSBuZXcgcm90YXRpb24gbWF0cml4IHJlcHJlc2VudGluZyB0aGUgY29tYmluZWQgcm90YXRpb25zXG4gICAqL1xuICBzdGF0aWMgX3JvdGF0ZVhZWih4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyLCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcik6IElNYXRyaXgzMyB7XG4gICAgY29uc3QgY29zWCA9IE1hdGguY29zKHgpO1xuICAgIGNvbnN0IHNpblggPSBNYXRoLnNpbih4KTtcbiAgICBjb25zdCBjb3NZID0gTWF0aC5jb3MoeSk7XG4gICAgY29uc3Qgc2luWSA9IE1hdGguc2luKHkpO1xuICAgIGNvbnN0IGNvc1ogPSBNYXRoLmNvcyh6KTtcbiAgICBjb25zdCBzaW5aID0gTWF0aC5zaW4oeik7XG5cbiAgICAvLyBjb25zdCB4MDAgPSAxO1xuICAgIC8vIGNvbnN0IHgwMSA9IDA7XG4gICAgLy8gY29uc3QgeDAyID0gMDtcbiAgICAvLyBjb25zdCB4MTAgPSAwO1xuICAgIGNvbnN0IHgxMSA9IGNvc1g7XG4gICAgY29uc3QgeDEyID0gLXNpblg7XG4gICAgLy8gY29uc3QgeDIwID0gMDtcbiAgICBjb25zdCB4MjEgPSBzaW5YO1xuICAgIGNvbnN0IHgyMiA9IGNvc1g7XG5cbiAgICBjb25zdCB5MDAgPSBjb3NZO1xuICAgIC8vIGNvbnN0IHkwMSA9IDA7XG4gICAgY29uc3QgeTAyID0gc2luWTtcbiAgICAvLyBjb25zdCB5MTAgPSAwO1xuICAgIC8vIGNvbnN0IHkxMSA9IDE7XG4gICAgLy8gY29uc3QgeTEyID0gMDtcbiAgICBjb25zdCB5MjAgPSAtc2luWTtcbiAgICAvLyBjb25zdCB5MjEgPSAwO1xuICAgIGNvbnN0IHkyMiA9IGNvc1k7XG5cbiAgICBjb25zdCB6MDAgPSBjb3NaO1xuICAgIGNvbnN0IHowMSA9IC1zaW5aO1xuICAgIC8vIGNvbnN0IHowMiA9IDA7XG4gICAgY29uc3QgejEwID0gc2luWjtcbiAgICBjb25zdCB6MTEgPSBjb3NaO1xuICAgIC8vIGNvbnN0IHoxMiA9IDA7XG4gICAgLy8gY29uc3QgejIwID0gMDtcbiAgICAvLyBjb25zdCB6MjEgPSAwO1xuICAgIC8vIGNvbnN0IHoyMiA9IDE7XG5cbiAgICAvLyBjYWxjdWxhdGUgdGhpcy5tdWx0aXBseSh0aGlzLnJvdGF0ZVkoeSksIHRoaXMucm90YXRlWCh4KSlcbiAgICBjb25zdCB5eDAwID0geTAwO1xuICAgIGNvbnN0IHl4MDEgPSB5MDIgKiB4MjE7XG4gICAgY29uc3QgeXgwMiA9IHkwMiAqIHgyMjtcbiAgICAvL2NvbnN0IHl4MTAgPSAwO1xuICAgIGNvbnN0IHl4MTEgPSB4MTE7XG4gICAgY29uc3QgeXgxMiA9IHgxMjtcbiAgICBjb25zdCB5eDIwID0geTIwO1xuICAgIGNvbnN0IHl4MjEgPSB5MjIgKiB4MjE7XG4gICAgY29uc3QgeXgyMiA9IHkyMiAqIHgyMjtcblxuICAgIC8vIGNhbGN1bGF0ZSB0aGlzLm11bHRpcGx5KHRoaXMucm90YXRlWih6KSwgdGhpcy5tdWx0aXBseSh0aGlzLnJvdGF0ZVkoeSksIHRoaXMucm90YXRlWCh4KSkpXG4gICAgY29uc3QgbTAwID0gejAwICogeXgwMDtcbiAgICBjb25zdCBtMDEgPSB6MDAgKiB5eDAxICsgejAxICogeXgxMTtcbiAgICBjb25zdCBtMDIgPSB6MDAgKiB5eDAyICsgejAxICogeXgxMjtcbiAgICBjb25zdCBtMTAgPSB6MTAgKiB5eDAwO1xuICAgIGNvbnN0IG0xMSA9IHoxMCAqIHl4MDEgKyB6MTEgKiB5eDExO1xuICAgIGNvbnN0IG0xMiA9IHoxMCAqIHl4MDIgKyB6MTEgKiB5eDEyO1xuICAgIGNvbnN0IG0yMCA9IHl4MjA7XG4gICAgY29uc3QgbTIxID0geXgyMTtcbiAgICBjb25zdCBtMjIgPSB5eDIyO1xuXG4gICAgcmV0dXJuIHRoaXMuX2Zyb21Db3B5OVJvd01ham9yKG0wMCwgbTAxLCBtMDIsIG0xMCwgbTExLCBtMTIsIG0yMCwgbTIxLCBtMjIsIHR5cGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSByb3RhdGlvbiBtYXRyaXggZnJvbSBhIFZlY3RvcjMgY29udGFpbmluZyBFdWxlciBhbmdsZXMuXG4gICAqIEBwYXJhbSB2ZWMgLSBWZWN0b3IzIGNvbnRhaW5pbmcgcm90YXRpb24gYW5nbGVzICh4LCB5LCB6KSBpbiByYWRpYW5zXG4gICAqIEByZXR1cm5zIEEgbmV3IHJvdGF0aW9uIG1hdHJpeFxuICAgKi9cbiAgc3RhdGljIF9yb3RhdGUodmVjOiBJVmVjdG9yMywgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpOiBJTWF0cml4MzMge1xuICAgIHJldHVybiB0aGlzLl9yb3RhdGVYWVoodmVjLl92WzBdLCB2ZWMuX3ZbMV0sIHZlYy5fdlsyXSwgdHlwZSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHNjYWxpbmcgbWF0cml4LlxuICAgKiBAcGFyYW0gdmVjIC0gVmVjdG9yMyBjb250YWluaW5nIHNjYWxlIGZhY3RvcnMgZm9yIGVhY2ggYXhpc1xuICAgKiBAcmV0dXJucyBBIG5ldyBzY2FsaW5nIG1hdHJpeFxuICAgKi9cbiAgc3RhdGljIF9zY2FsZSh2ZWM6IElWZWN0b3IzLCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcik6IElNYXRyaXgzMyB7XG4gICAgcmV0dXJuIHRoaXMuX2Zyb21Db3B5OVJvd01ham9yKHZlYy5fdlswXSwgMCwgMCwgMCwgdmVjLl92WzFdLCAwLCAwLCAwLCB2ZWMuX3ZbMl0sIHR5cGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgdHdvIG1hdHJpY2VzIHRvZ2V0aGVyLlxuICAgKiBAcGFyYW0gbF9tYXQgLSBUaGUgbGVmdCBtYXRyaXhcbiAgICogQHBhcmFtIHJfbWF0IC0gVGhlIHJpZ2h0IG1hdHJpeFxuICAgKiBAcmV0dXJucyBBIG5ldyBtYXRyaXggcmVwcmVzZW50aW5nIGxfbWF0ICogcl9tYXRcbiAgICovXG4gIHN0YXRpYyBfbXVsdGlwbHkobF9tYXQ6IElNYXRyaXgzMywgcl9tYXQ6IElNYXRyaXgzMywgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpOiBJTWF0cml4MzMge1xuICAgIGlmIChsX21hdC5pc0lkZW50aXR5TWF0cml4Q2xhc3MpIHtcbiAgICAgIHJldHVybiB0aGlzLl9mcm9tQ29weU1hdHJpeDMzKHJfbWF0LCB0eXBlKTtcbiAgICB9XG4gICAgaWYgKHJfbWF0LmlzSWRlbnRpdHlNYXRyaXhDbGFzcykge1xuICAgICAgcmV0dXJuIHRoaXMuX2Zyb21Db3B5TWF0cml4MzMobF9tYXQsIHR5cGUpO1xuICAgIH1cblxuICAgIGNvbnN0IG0wMCA9IGxfbWF0Ll92WzBdICogcl9tYXQuX3ZbMF0gKyBsX21hdC5fdlszXSAqIHJfbWF0Ll92WzFdICsgbF9tYXQuX3ZbNl0gKiByX21hdC5fdlsyXTtcbiAgICBjb25zdCBtMTAgPSBsX21hdC5fdlsxXSAqIHJfbWF0Ll92WzBdICsgbF9tYXQuX3ZbNF0gKiByX21hdC5fdlsxXSArIGxfbWF0Ll92WzddICogcl9tYXQuX3ZbMl07XG4gICAgY29uc3QgbTIwID0gbF9tYXQuX3ZbMl0gKiByX21hdC5fdlswXSArIGxfbWF0Ll92WzVdICogcl9tYXQuX3ZbMV0gKyBsX21hdC5fdls4XSAqIHJfbWF0Ll92WzJdO1xuXG4gICAgY29uc3QgbTAxID0gbF9tYXQuX3ZbMF0gKiByX21hdC5fdlszXSArIGxfbWF0Ll92WzNdICogcl9tYXQuX3ZbNF0gKyBsX21hdC5fdls2XSAqIHJfbWF0Ll92WzVdO1xuICAgIGNvbnN0IG0xMSA9IGxfbWF0Ll92WzFdICogcl9tYXQuX3ZbM10gKyBsX21hdC5fdls0XSAqIHJfbWF0Ll92WzRdICsgbF9tYXQuX3ZbN10gKiByX21hdC5fdls1XTtcbiAgICBjb25zdCBtMjEgPSBsX21hdC5fdlsyXSAqIHJfbWF0Ll92WzNdICsgbF9tYXQuX3ZbNV0gKiByX21hdC5fdls0XSArIGxfbWF0Ll92WzhdICogcl9tYXQuX3ZbNV07XG5cbiAgICBjb25zdCBtMDIgPSBsX21hdC5fdlswXSAqIHJfbWF0Ll92WzZdICsgbF9tYXQuX3ZbM10gKiByX21hdC5fdls3XSArIGxfbWF0Ll92WzZdICogcl9tYXQuX3ZbOF07XG4gICAgY29uc3QgbTEyID0gbF9tYXQuX3ZbMV0gKiByX21hdC5fdls2XSArIGxfbWF0Ll92WzRdICogcl9tYXQuX3ZbN10gKyBsX21hdC5fdls3XSAqIHJfbWF0Ll92WzhdO1xuICAgIGNvbnN0IG0yMiA9IGxfbWF0Ll92WzJdICogcl9tYXQuX3ZbNl0gKyBsX21hdC5fdls1XSAqIHJfbWF0Ll92WzddICsgbF9tYXQuX3ZbOF0gKiByX21hdC5fdls4XTtcblxuICAgIHJldHVybiB0aGlzLl9mcm9tQ29weTlSb3dNYWpvcihtMDAsIG0wMSwgbTAyLCBtMTAsIG0xMSwgbTEyLCBtMjAsIG0yMSwgbTIyLCB0eXBlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIHR3byBtYXRyaWNlcyBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gYW4gb3V0cHV0IG1hdHJpeC5cbiAgICogQHBhcmFtIGxfbWF0IC0gVGhlIGxlZnQgbWF0cml4XG4gICAqIEBwYXJhbSByX21hdCAtIFRoZSByaWdodCBtYXRyaXhcbiAgICogQHBhcmFtIG91dE1hdCAtIFRoZSBvdXRwdXQgbXV0YWJsZSBtYXRyaXggdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IG1hdHJpeCBjb250YWluaW5nIGxfbWF0ICogcl9tYXRcbiAgICovXG4gIHN0YXRpYyBfbXVsdGlwbHlUbyhsX21hdDogSU1hdHJpeDMzLCByX21hdDogSU1hdHJpeDMzLCBvdXRNYXQ6IElNdXRhYmxlTWF0cml4MzMpOiBJTXV0YWJsZU1hdHJpeDMzIHtcbiAgICBpZiAobF9tYXQuaXNJZGVudGl0eU1hdHJpeENsYXNzKSB7XG4gICAgICByZXR1cm4gb3V0TWF0LmNvcHlDb21wb25lbnRzKHJfbWF0KTtcbiAgICB9XG4gICAgaWYgKHJfbWF0LmlzSWRlbnRpdHlNYXRyaXhDbGFzcykge1xuICAgICAgcmV0dXJuIG91dE1hdC5jb3B5Q29tcG9uZW50cyhsX21hdCk7XG4gICAgfVxuXG4gICAgY29uc3QgbTAwID0gbF9tYXQuX3ZbMF0gKiByX21hdC5fdlswXSArIGxfbWF0Ll92WzNdICogcl9tYXQuX3ZbMV0gKyBsX21hdC5fdls2XSAqIHJfbWF0Ll92WzJdO1xuICAgIGNvbnN0IG0xMCA9IGxfbWF0Ll92WzFdICogcl9tYXQuX3ZbMF0gKyBsX21hdC5fdls0XSAqIHJfbWF0Ll92WzFdICsgbF9tYXQuX3ZbN10gKiByX21hdC5fdlsyXTtcbiAgICBjb25zdCBtMjAgPSBsX21hdC5fdlsyXSAqIHJfbWF0Ll92WzBdICsgbF9tYXQuX3ZbNV0gKiByX21hdC5fdlsxXSArIGxfbWF0Ll92WzhdICogcl9tYXQuX3ZbMl07XG5cbiAgICBjb25zdCBtMDEgPSBsX21hdC5fdlswXSAqIHJfbWF0Ll92WzNdICsgbF9tYXQuX3ZbM10gKiByX21hdC5fdls0XSArIGxfbWF0Ll92WzZdICogcl9tYXQuX3ZbNV07XG4gICAgY29uc3QgbTExID0gbF9tYXQuX3ZbMV0gKiByX21hdC5fdlszXSArIGxfbWF0Ll92WzRdICogcl9tYXQuX3ZbNF0gKyBsX21hdC5fdls3XSAqIHJfbWF0Ll92WzVdO1xuICAgIGNvbnN0IG0yMSA9IGxfbWF0Ll92WzJdICogcl9tYXQuX3ZbM10gKyBsX21hdC5fdls1XSAqIHJfbWF0Ll92WzRdICsgbF9tYXQuX3ZbOF0gKiByX21hdC5fdls1XTtcblxuICAgIGNvbnN0IG0wMiA9IGxfbWF0Ll92WzBdICogcl9tYXQuX3ZbNl0gKyBsX21hdC5fdlszXSAqIHJfbWF0Ll92WzddICsgbF9tYXQuX3ZbNl0gKiByX21hdC5fdls4XTtcbiAgICBjb25zdCBtMTIgPSBsX21hdC5fdlsxXSAqIHJfbWF0Ll92WzZdICsgbF9tYXQuX3ZbNF0gKiByX21hdC5fdls3XSArIGxfbWF0Ll92WzddICogcl9tYXQuX3ZbOF07XG4gICAgY29uc3QgbTIyID0gbF9tYXQuX3ZbMl0gKiByX21hdC5fdls2XSArIGxfbWF0Ll92WzVdICogcl9tYXQuX3ZbN10gKyBsX21hdC5fdls4XSAqIHJfbWF0Ll92WzhdO1xuXG4gICAgcmV0dXJuIG91dE1hdC5zZXRDb21wb25lbnRzKG0wMCwgbTAxLCBtMDIsIG0xMCwgbTExLCBtMTIsIG0yMCwgbTIxLCBtMjIpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHRoZSBtYXRyaXggdG8gYSBodW1hbi1yZWFkYWJsZSBzdHJpbmcgcmVwcmVzZW50YXRpb24uXG4gICAqIEByZXR1cm5zIEEgZm9ybWF0dGVkIHN0cmluZyBzaG93aW5nIHRoZSBtYXRyaXggaW4gM3gzIGxheW91dFxuICAgKi9cbiAgdG9TdHJpbmcoKSB7XG4gICAgcmV0dXJuIGAke3RoaXMuX3ZbMF19ICR7dGhpcy5fdlszXX0gJHt0aGlzLl92WzZdfVxcbiR7dGhpcy5fdlsxXX0gJHt0aGlzLl92WzRdfSAke3RoaXMuX3ZbN119XFxuJHt0aGlzLl92WzJdfSAke3RoaXMuX3ZbNV19ICR7dGhpcy5fdls4XX1cXG5gO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHRoZSBtYXRyaXggdG8gYSBodW1hbi1yZWFkYWJsZSBzdHJpbmcgd2l0aCByb3VuZGVkIHZhbHVlcy5cbiAgICogQHJldHVybnMgQSBmb3JtYXR0ZWQgc3RyaW5nIHNob3dpbmcgdGhlIG1hdHJpeCB3aXRoIGZpbmFuY2lhbGx5IHJvdW5kZWQgdmFsdWVzXG4gICAqL1xuICB0b1N0cmluZ0FwcHJveGltYXRlbHkoKSB7XG4gICAgcmV0dXJuIGAke01hdGhVdGlsLmZpbmFuY2lhbCh0aGlzLl92WzBdKX0gJHtNYXRoVXRpbC5maW5hbmNpYWwodGhpcy5fdlszXSl9ICR7TWF0aFV0aWwuZmluYW5jaWFsKHRoaXMuX3ZbNl0pfVxcbiR7TWF0aFV0aWwuZmluYW5jaWFsKHRoaXMuX3ZbMV0pfSAke01hdGhVdGlsLmZpbmFuY2lhbCh0aGlzLl92WzRdKX0gJHtNYXRoVXRpbC5maW5hbmNpYWwodGhpcy5fdls3XSl9IFxcbiR7TWF0aFV0aWwuZmluYW5jaWFsKHRoaXMuX3ZbMl0pfSAke01hdGhVdGlsLmZpbmFuY2lhbCh0aGlzLl92WzVdKX0gJHtNYXRoVXRpbC5maW5hbmNpYWwodGhpcy5fdls4XSl9XFxuYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyB0aGUgbWF0cml4IHRvIGEgZmxhdCBhcnJheSBpbiBjb2x1bW4tbWFqb3Igb3JkZXIuXG4gICAqIEByZXR1cm5zIEFuIGFycmF5IGNvbnRhaW5pbmcgYWxsIDkgbWF0cml4IGVsZW1lbnRzXG4gICAqL1xuICBmbGF0dGVuQXNBcnJheSgpIHtcbiAgICByZXR1cm4gW3RoaXMuX3ZbMF0sIHRoaXMuX3ZbMV0sIHRoaXMuX3ZbMl0sIHRoaXMuX3ZbM10sIHRoaXMuX3ZbNF0sIHRoaXMuX3ZbNV0sIHRoaXMuX3ZbNl0sIHRoaXMuX3ZbN10sIHRoaXMuX3ZbOF1dO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGlzIG1hdHJpeCBpcyBhIGR1bW15IG1hdHJpeCAoZW1wdHkgZGF0YSBhcnJheSkuXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIG1hdHJpeCBoYXMgbm8gZGF0YSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBpc0R1bW15KCkge1xuICAgIGlmICh0aGlzLl92Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBtYXRyaXggaXMgYXBwcm94aW1hdGVseSBlcXVhbCB0byBhbm90aGVyIG1hdHJpeC5cbiAgICogQHBhcmFtIG1hdCAtIFRoZSBtYXRyaXggdG8gY29tcGFyZSB3aXRoXG4gICAqIEBwYXJhbSBkZWx0YSAtIFRoZSB0b2xlcmFuY2UgZm9yIGNvbXBhcmlzb24gKGRlZmF1bHQ6IE51bWJlci5FUFNJTE9OKVxuICAgKiBAcmV0dXJucyBUcnVlIGlmIG1hdHJpY2VzIGFyZSBhcHByb3hpbWF0ZWx5IGVxdWFsLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGlzRXF1YWwobWF0OiBJTWF0cml4MzMsIGRlbHRhOiBudW1iZXIgPSBOdW1iZXIuRVBTSUxPTikge1xuICAgIGlmIChcbiAgICAgIE1hdGguYWJzKG1hdC5fdlswXSAtIHRoaXMuX3ZbMF0pIDwgZGVsdGEgJiZcbiAgICAgIE1hdGguYWJzKG1hdC5fdlsxXSAtIHRoaXMuX3ZbMV0pIDwgZGVsdGEgJiZcbiAgICAgIE1hdGguYWJzKG1hdC5fdlsyXSAtIHRoaXMuX3ZbMl0pIDwgZGVsdGEgJiZcbiAgICAgIE1hdGguYWJzKG1hdC5fdlszXSAtIHRoaXMuX3ZbM10pIDwgZGVsdGEgJiZcbiAgICAgIE1hdGguYWJzKG1hdC5fdls0XSAtIHRoaXMuX3ZbNF0pIDwgZGVsdGEgJiZcbiAgICAgIE1hdGguYWJzKG1hdC5fdls1XSAtIHRoaXMuX3ZbNV0pIDwgZGVsdGEgJiZcbiAgICAgIE1hdGguYWJzKG1hdC5fdls2XSAtIHRoaXMuX3ZbNl0pIDwgZGVsdGEgJiZcbiAgICAgIE1hdGguYWJzKG1hdC5fdls3XSAtIHRoaXMuX3ZbN10pIDwgZGVsdGEgJiZcbiAgICAgIE1hdGguYWJzKG1hdC5fdls4XSAtIHRoaXMuX3ZbOF0pIDwgZGVsdGFcbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoaXMgbWF0cml4IGlzIHN0cmljdGx5IGVxdWFsIHRvIGFub3RoZXIgbWF0cml4LlxuICAgKiBAcGFyYW0gbWF0IC0gVGhlIG1hdHJpeCB0byBjb21wYXJlIHdpdGhcbiAgICogQHJldHVybnMgVHJ1ZSBpZiBhbGwgZWxlbWVudHMgYXJlIGV4YWN0bHkgZXF1YWwsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgaXNTdHJpY3RFcXVhbChtYXQ6IE1hdHJpeDMzKSB7XG4gICAgaWYgKFxuICAgICAgbWF0Ll92WzBdID09PSB0aGlzLl92WzBdICYmXG4gICAgICBtYXQuX3ZbMV0gPT09IHRoaXMuX3ZbMV0gJiZcbiAgICAgIG1hdC5fdlsyXSA9PT0gdGhpcy5fdlsyXSAmJlxuICAgICAgbWF0Ll92WzNdID09PSB0aGlzLl92WzNdICYmXG4gICAgICBtYXQuX3ZbNF0gPT09IHRoaXMuX3ZbNF0gJiZcbiAgICAgIG1hdC5fdls1XSA9PT0gdGhpcy5fdls1XSAmJlxuICAgICAgbWF0Ll92WzZdID09PSB0aGlzLl92WzZdICYmXG4gICAgICBtYXQuX3ZbN10gPT09IHRoaXMuX3ZbN10gJiZcbiAgICAgIG1hdC5fdls4XSA9PT0gdGhpcy5fdls4XVxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCB0aGUgc3BlY2lmaWVkIHJvdyBhbmQgY29sdW1uLlxuICAgKiBAcGFyYW0gcm93X2kgLSBUaGUgcm93IGluZGV4ICgwLTIpXG4gICAqIEBwYXJhbSBjb2x1bW5faSAtIFRoZSBjb2x1bW4gaW5kZXggKDAtMilcbiAgICogQHJldHVybnMgVGhlIG1hdHJpeCBlbGVtZW50IGF0IHRoZSBzcGVjaWZpZWQgcG9zaXRpb25cbiAgICovXG4gIGF0KHJvd19pOiBudW1iZXIsIGNvbHVtbl9pOiBudW1iZXIpIHtcbiAgICByZXR1cm4gdGhpcy5fdltyb3dfaSArIGNvbHVtbl9pICogM107XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF0cml4IGVsZW1lbnQgYXQgdGhlIHNwZWNpZmllZCBpbmRleCBpbiB0aGUgaW50ZXJuYWwgYXJyYXkuXG4gICAqIEBwYXJhbSBpIC0gVGhlIGluZGV4ICgwLTgpXG4gICAqIEByZXR1cm5zIFRoZSBtYXRyaXggZWxlbWVudCBhdCB0aGUgc3BlY2lmaWVkIGluZGV4XG4gICAqL1xuICB2KGk6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbaV07XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyB0aGUgZGV0ZXJtaW5hbnQgb2YgdGhpcyBtYXRyaXguXG4gICAqIEByZXR1cm5zIFRoZSBkZXRlcm1pbmFudCB2YWx1ZVxuICAgKi9cbiAgZGV0ZXJtaW5hbnQoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMuX3ZbMF0gKiB0aGlzLl92WzRdICogdGhpcy5fdls4XSArXG4gICAgICB0aGlzLl92WzFdICogdGhpcy5fdls1XSAqIHRoaXMuX3ZbNl0gK1xuICAgICAgdGhpcy5fdlsyXSAqIHRoaXMuX3ZbM10gKiB0aGlzLl92WzddIC1cbiAgICAgIHRoaXMuX3ZbMF0gKiB0aGlzLl92WzVdICogdGhpcy5fdls3XSAtXG4gICAgICB0aGlzLl92WzJdICogdGhpcy5fdls0XSAqIHRoaXMuX3ZbNl0gLVxuICAgICAgdGhpcy5fdlsxXSAqIHRoaXMuX3ZbM10gKiB0aGlzLl92WzhdXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIHRoaXMgbWF0cml4IHdpdGggYSB2ZWN0b3IuXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIG11bHRpcGx5XG4gICAqIEByZXR1cm5zIEEgbmV3IHZlY3RvciByZXByZXNlbnRpbmcgdGhlIHJlc3VsdCBvZiBtYXRyaXggKiB2ZWN0b3JcbiAgICovXG4gIG11bHRpcGx5VmVjdG9yKHZlYzogSVZlY3RvcjMpIHtcbiAgICBjb25zdCB4ID0gdGhpcy5fdlswXSAqIHZlYy5fdlswXSArIHRoaXMuX3ZbM10gKiB2ZWMuX3ZbMV0gKyB0aGlzLl92WzZdICogdmVjLl92WzJdO1xuICAgIGNvbnN0IHkgPSB0aGlzLl92WzFdICogdmVjLl92WzBdICsgdGhpcy5fdls0XSAqIHZlYy5fdlsxXSArIHRoaXMuX3ZbN10gKiB2ZWMuX3ZbMl07XG4gICAgY29uc3QgeiA9IHRoaXMuX3ZbMl0gKiB2ZWMuX3ZbMF0gKyB0aGlzLl92WzVdICogdmVjLl92WzFdICsgdGhpcy5fdls4XSAqIHZlYy5fdlsyXTtcbiAgICByZXR1cm4gbmV3ICh2ZWMuY29uc3RydWN0b3IgYXMgYW55KShuZXcgRmxvYXQzMkFycmF5KFt4LCB5LCB6XSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgdGhpcyBtYXRyaXggd2l0aCBhIHZlY3RvciBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gYW4gb3V0cHV0IHZlY3Rvci5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gbXVsdGlwbHlcbiAgICogQHBhcmFtIG91dFZlYyAtIFRoZSBvdXRwdXQgbXV0YWJsZSB2ZWN0b3IgdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHZlY3RvciBjb250YWluaW5nIHRoZSByZXN1bHQgb2YgbWF0cml4ICogdmVjdG9yXG4gICAqL1xuICBtdWx0aXBseVZlY3RvclRvKHZlYzogSVZlY3RvcjMsIG91dFZlYzogSU11dGFibGVWZWN0b3IzKSB7XG4gICAgY29uc3QgeCA9IHRoaXMuX3ZbMF0gKiB2ZWMuX3ZbMF0gKyB0aGlzLl92WzNdICogdmVjLl92WzFdICsgdGhpcy5fdls2XSAqIHZlYy5fdlsyXTtcbiAgICBjb25zdCB5ID0gdGhpcy5fdlsxXSAqIHZlYy5fdlswXSArIHRoaXMuX3ZbNF0gKiB2ZWMuX3ZbMV0gKyB0aGlzLl92WzddICogdmVjLl92WzJdO1xuICAgIGNvbnN0IHogPSB0aGlzLl92WzJdICogdmVjLl92WzBdICsgdGhpcy5fdls1XSAqIHZlYy5fdlsxXSArIHRoaXMuX3ZbOF0gKiB2ZWMuX3ZbMl07XG4gICAgb3V0VmVjLl92WzBdID0geDtcbiAgICBvdXRWZWMuX3ZbMV0gPSB5O1xuICAgIG91dFZlYy5fdlsyXSA9IHo7XG4gICAgcmV0dXJuIG91dFZlYztcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHRyYWN0cyB0aGUgc2NhbGUgZmFjdG9ycyBmcm9tIHRoaXMgbWF0cml4LlxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3IzIGNvbnRhaW5pbmcgdGhlIHNjYWxlIGZhY3RvcnMgZm9yIGVhY2ggYXhpc1xuICAgKi9cbiAgZ2V0U2NhbGUoKSB7XG4gICAgcmV0dXJuIFZlY3RvcjMuZnJvbUNvcHlBcnJheShbXG4gICAgICBNYXRoLmh5cG90KHRoaXMuX3ZbMF0sIHRoaXMuX3ZbMV0sIHRoaXMuX3ZbMl0pLFxuICAgICAgTWF0aC5oeXBvdCh0aGlzLl92WzNdLCB0aGlzLl92WzRdLCB0aGlzLl92WzVdKSxcbiAgICAgIE1hdGguaHlwb3QodGhpcy5fdls2XSwgdGhpcy5fdls3XSwgdGhpcy5fdls4XSksXG4gICAgXSk7XG4gIH1cblxuICAvKipcbiAgICogRXh0cmFjdHMgdGhlIHNjYWxlIGZhY3RvcnMgZnJvbSB0aGlzIG1hdHJpeCBhbmQgc3RvcmVzIHRoZW0gaW4gYW4gb3V0cHV0IHZlY3Rvci5cbiAgICogQHBhcmFtIG91dFZlYyAtIFRoZSBvdXRwdXQgbXV0YWJsZSB2ZWN0b3IgdG8gc3RvcmUgdGhlIHNjYWxlIGZhY3RvcnNcbiAgICogQHJldHVybnMgVGhlIG91dHB1dCB2ZWN0b3IgY29udGFpbmluZyB0aGUgc2NhbGUgZmFjdG9yc1xuICAgKi9cbiAgZ2V0U2NhbGVUbyhvdXRWZWM6IE11dGFibGVWZWN0b3IzKSB7XG4gICAgb3V0VmVjLl92WzBdID0gTWF0aC5oeXBvdCh0aGlzLl92WzBdLCB0aGlzLl92WzFdLCB0aGlzLl92WzJdKTtcbiAgICBvdXRWZWMuX3ZbMV0gPSBNYXRoLmh5cG90KHRoaXMuX3ZbM10sIHRoaXMuX3ZbNF0sIHRoaXMuX3ZbNV0pO1xuICAgIG91dFZlYy5fdlsyXSA9IE1hdGguaHlwb3QodGhpcy5fdls2XSwgdGhpcy5fdls3XSwgdGhpcy5fdls4XSk7XG4gICAgcmV0dXJuIG91dFZlYztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZGVlcCBjb3B5IG9mIHRoaXMgbWF0cml4LlxuICAgKiBAcmV0dXJucyBBIG5ldyBNYXRyaXgzMyBpbnN0YW5jZSB3aXRoIHRoZSBzYW1lIHZhbHVlc1xuICAgKi9cbiAgY2xvbmUoKSB7XG4gICAgcmV0dXJuICh0aGlzLmNvbnN0cnVjdG9yIGFzIGFueSkuZnJvbUNvcHk5Um93TWFqb3IoXG4gICAgICB0aGlzLl92WzBdLFxuICAgICAgdGhpcy5fdlszXSxcbiAgICAgIHRoaXMuX3ZbNl0sXG4gICAgICB0aGlzLl92WzFdLFxuICAgICAgdGhpcy5fdls0XSxcbiAgICAgIHRoaXMuX3ZbN10sXG4gICAgICB0aGlzLl92WzJdLFxuICAgICAgdGhpcy5fdls1XSxcbiAgICAgIHRoaXMuX3ZbOF1cbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBNYXRyaXgzMyBmcm9tIDkgdmFsdWVzIGluIHJvdy1tYWpvciBvcmRlci5cbiAgICogVmFsdWVzIGFyZSBzdG9yZWQgaW50ZXJuYWxseSBpbiBjb2x1bW4tbWFqb3Igb3JkZXIgZm9yIFdlYkdMIGNvbXBhdGliaWxpdHkuXG4gICAqIEBwYXJhbSBtMDAgLSBFbGVtZW50IGF0IHJvdyAwLCBjb2x1bW4gMFxuICAgKiBAcGFyYW0gbTAxIC0gRWxlbWVudCBhdCByb3cgMCwgY29sdW1uIDFcbiAgICogQHBhcmFtIG0wMiAtIEVsZW1lbnQgYXQgcm93IDAsIGNvbHVtbiAyXG4gICAqIEBwYXJhbSBtMTAgLSBFbGVtZW50IGF0IHJvdyAxLCBjb2x1bW4gMFxuICAgKiBAcGFyYW0gbTExIC0gRWxlbWVudCBhdCByb3cgMSwgY29sdW1uIDFcbiAgICogQHBhcmFtIG0xMiAtIEVsZW1lbnQgYXQgcm93IDEsIGNvbHVtbiAyXG4gICAqIEBwYXJhbSBtMjAgLSBFbGVtZW50IGF0IHJvdyAyLCBjb2x1bW4gMFxuICAgKiBAcGFyYW0gbTIxIC0gRWxlbWVudCBhdCByb3cgMiwgY29sdW1uIDFcbiAgICogQHBhcmFtIG0yMiAtIEVsZW1lbnQgYXQgcm93IDIsIGNvbHVtbiAyXG4gICAqIEByZXR1cm5zIEEgbmV3IE1hdHJpeDMzIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgX2Zyb21Db3B5OVJvd01ham9yKFxuICAgIG0wMDogbnVtYmVyLFxuICAgIG0wMTogbnVtYmVyLFxuICAgIG0wMjogbnVtYmVyLFxuICAgIG0xMDogbnVtYmVyLFxuICAgIG0xMTogbnVtYmVyLFxuICAgIG0xMjogbnVtYmVyLFxuICAgIG0yMDogbnVtYmVyLFxuICAgIG0yMTogbnVtYmVyLFxuICAgIG0yMjogbnVtYmVyLFxuICAgIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yXG4gICk6IElNYXRyaXgzMyB7XG4gICAgY29uc3QgdiA9IG5ldyB0eXBlKDkpO1xuICAgIHZbMF0gPSBtMDA7XG4gICAgdlszXSA9IG0wMTtcbiAgICB2WzZdID0gbTAyO1xuICAgIHZbMV0gPSBtMTA7XG4gICAgdls0XSA9IG0xMTtcbiAgICB2WzddID0gbTEyO1xuICAgIHZbMl0gPSBtMjA7XG4gICAgdls1XSA9IG0yMTtcbiAgICB2WzhdID0gbTIyO1xuICAgIHJldHVybiBuZXcgdGhpcyh2LCB7IHR5cGUgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIE1hdHJpeDMzIGZyb20gOSB2YWx1ZXMgaW4gY29sdW1uLW1ham9yIG9yZGVyLlxuICAgKiBAcGFyYW0gbTAwIC0gRWxlbWVudCBhdCByb3cgMCwgY29sdW1uIDBcbiAgICogQHBhcmFtIG0xMCAtIEVsZW1lbnQgYXQgcm93IDEsIGNvbHVtbiAwXG4gICAqIEBwYXJhbSBtMjAgLSBFbGVtZW50IGF0IHJvdyAyLCBjb2x1bW4gMFxuICAgKiBAcGFyYW0gbTAxIC0gRWxlbWVudCBhdCByb3cgMCwgY29sdW1uIDFcbiAgICogQHBhcmFtIG0xMSAtIEVsZW1lbnQgYXQgcm93IDEsIGNvbHVtbiAxXG4gICAqIEBwYXJhbSBtMjEgLSBFbGVtZW50IGF0IHJvdyAyLCBjb2x1bW4gMVxuICAgKiBAcGFyYW0gbTAyIC0gRWxlbWVudCBhdCByb3cgMCwgY29sdW1uIDJcbiAgICogQHBhcmFtIG0xMiAtIEVsZW1lbnQgYXQgcm93IDEsIGNvbHVtbiAyXG4gICAqIEBwYXJhbSBtMjIgLSBFbGVtZW50IGF0IHJvdyAyLCBjb2x1bW4gMlxuICAgKiBAcmV0dXJucyBBIG5ldyBNYXRyaXgzMyBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIF9mcm9tQ29weTlDb2x1bW5NYWpvcihcbiAgICBtMDA6IG51bWJlcixcbiAgICBtMTA6IG51bWJlcixcbiAgICBtMjA6IG51bWJlcixcbiAgICBtMDE6IG51bWJlcixcbiAgICBtMTE6IG51bWJlcixcbiAgICBtMjE6IG51bWJlcixcbiAgICBtMDI6IG51bWJlcixcbiAgICBtMTI6IG51bWJlcixcbiAgICBtMjI6IG51bWJlcixcbiAgICB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3RvclxuICApOiBJTWF0cml4MzMge1xuICAgIGNvbnN0IHYgPSBuZXcgdHlwZSg5KTtcbiAgICB2WzBdID0gbTAwO1xuICAgIHZbM10gPSBtMDE7XG4gICAgdls2XSA9IG0wMjtcbiAgICB2WzFdID0gbTEwO1xuICAgIHZbNF0gPSBtMTE7XG4gICAgdls3XSA9IG0xMjtcbiAgICB2WzJdID0gbTIwO1xuICAgIHZbNV0gPSBtMjE7XG4gICAgdls4XSA9IG0yMjtcbiAgICByZXR1cm4gbmV3IHRoaXModiwgeyB0eXBlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBNYXRyaXgzMyBmcm9tIHRoZSB1cHBlci1sZWZ0IDN4MyBwb3J0aW9uIG9mIGEgTWF0cml4NDQuXG4gICAqIEBwYXJhbSBtYXQgLSBUaGUgTWF0cml4NDQgdG8gZXh0cmFjdCBmcm9tXG4gICAqIEByZXR1cm5zIEEgbmV3IE1hdHJpeDMzIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgX2Zyb21Db3B5TWF0cml4NDQobWF0OiBJTWF0cml4NDQsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKTogSU1hdHJpeDMzIHtcbiAgICBjb25zdCB2ID0gbmV3IHR5cGUoOSk7XG4gICAgdlswXSA9IG1hdC5fdlswXTtcbiAgICB2WzFdID0gbWF0Ll92WzFdO1xuICAgIHZbMl0gPSBtYXQuX3ZbMl07XG4gICAgdlszXSA9IG1hdC5fdls1XTtcbiAgICB2WzRdID0gbWF0Ll92WzZdO1xuICAgIHZbNV0gPSBtYXQuX3ZbN107XG4gICAgdls2XSA9IG1hdC5fdls5XTtcbiAgICB2WzddID0gbWF0Ll92WzEwXTtcbiAgICB2WzhdID0gbWF0Ll92WzExXTtcbiAgICByZXR1cm4gbmV3IHRoaXModiwgeyB0eXBlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBNYXRyaXgzMyB1c2luZyB0aGUgcHJvdmlkZWQgRmxvYXQzMkFycmF5IGRpcmVjdGx5IChubyBjb3B5KS5cbiAgICogQHBhcmFtIGZsb2F0MzJBcnJheSAtIFRoZSBGbG9hdDMyQXJyYXkgaW4gY29sdW1uLW1ham9yIG9yZGVyXG4gICAqIEByZXR1cm5zIEEgbmV3IE1hdHJpeDMzIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgX2Zyb21UeXBlZEFycmF5Q29sdW1uTWFqb3IoYXJyYXk6IFR5cGVkQXJyYXksIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKTogSU1hdHJpeDMzIHtcbiAgICByZXR1cm4gbmV3IHRoaXMoYXJyYXksIHsgdHlwZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgTWF0cml4MzMgYnkgY29weWluZyBmcm9tIGEgRmxvYXQzMkFycmF5IGluIGNvbHVtbi1tYWpvciBvcmRlci5cbiAgICogQHBhcmFtIGZsb2F0MzJBcnJheSAtIFRoZSBGbG9hdDMyQXJyYXkgdG8gY29weSBmcm9tXG4gICAqIEByZXR1cm5zIEEgbmV3IE1hdHJpeDMzIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgX2Zyb21Db3B5VHlwZWRBcnJheUNvbHVtbk1ham9yKGFycmF5OiBUeXBlZEFycmF5LCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcik6IElNYXRyaXgzMyB7XG4gICAgY29uc3QgdiA9IG5ldyB0eXBlKDkpO1xuICAgIHYuc2V0KGFycmF5KTtcbiAgICByZXR1cm4gbmV3IHRoaXModiwgeyB0eXBlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBNYXRyaXgzMyBieSBjb3B5aW5nIGZyb20gYSBGbG9hdDMyQXJyYXkgaW4gcm93LW1ham9yIG9yZGVyLlxuICAgKiBAcGFyYW0gYXJyYXkgLSBUaGUgRmxvYXQzMkFycmF5IGluIHJvdy1tYWpvciBvcmRlclxuICAgKiBAcmV0dXJucyBBIG5ldyBNYXRyaXgzMyBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIF9mcm9tQ29weVR5cGVkQXJyYXlSb3dNYWpvcihhcnJheTogVHlwZWRBcnJheSwgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpOiBJTWF0cml4MzMge1xuICAgIGNvbnN0IHYgPSBuZXcgdHlwZSg5KTtcbiAgICB2WzBdID0gYXJyYXlbMF07XG4gICAgdlszXSA9IGFycmF5WzFdO1xuICAgIHZbNl0gPSBhcnJheVsyXTtcbiAgICB2WzFdID0gYXJyYXlbM107XG4gICAgdls0XSA9IGFycmF5WzRdO1xuICAgIHZbN10gPSBhcnJheVs1XTtcbiAgICB2WzJdID0gYXJyYXlbNl07XG4gICAgdls1XSA9IGFycmF5WzddO1xuICAgIHZbOF0gPSBhcnJheVs4XTtcblxuICAgIHJldHVybiBuZXcgdGhpcyh2LCB7IHR5cGUgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIE1hdHJpeDMzIGJ5IGNvcHlpbmcgZnJvbSBhbm90aGVyIElNYXRyaXgzMy5cbiAgICogQHBhcmFtIG1hdCAtIFRoZSBtYXRyaXggdG8gY29weSBmcm9tXG4gICAqIEByZXR1cm5zIEEgbmV3IE1hdHJpeDMzIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgX2Zyb21Db3B5TWF0cml4MzMobWF0OiBJTWF0cml4MzMsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKTogSU1hdHJpeDMzIHtcbiAgICBjb25zdCB2ID0gbmV3IHR5cGUoOSk7XG4gICAgdlswXSA9IG1hdC5fdlswXTtcbiAgICB2WzNdID0gbWF0Ll92WzNdO1xuICAgIHZbNl0gPSBtYXQuX3ZbNl07XG4gICAgdlsxXSA9IG1hdC5fdlsxXTtcbiAgICB2WzRdID0gbWF0Ll92WzRdO1xuICAgIHZbN10gPSBtYXQuX3ZbN107XG4gICAgdlsyXSA9IG1hdC5fdlsyXTtcbiAgICB2WzVdID0gbWF0Ll92WzVdO1xuICAgIHZbOF0gPSBtYXQuX3ZbOF07XG4gICAgcmV0dXJuIG5ldyB0aGlzKHYsIHsgdHlwZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgTWF0cml4MzMgZnJvbSBhbiBBcnJheTkgaW4gY29sdW1uLW1ham9yIG9yZGVyLlxuICAgKiBAcGFyYW0gYXJyYXkgLSBUaGUgQXJyYXk5IGNvbnRhaW5pbmcgOSBudW1iZXJzXG4gICAqIEByZXR1cm5zIEEgbmV3IE1hdHJpeDMzIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgX2Zyb21Db3B5QXJyYXk5Q29sdW1uTWFqb3IoYXJyYXk6IEFycmF5OTxudW1iZXI+LCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcik6IElNYXRyaXgzMyB7XG4gICAgY29uc3QgdiA9IG5ldyB0eXBlKDkpO1xuICAgIHYuc2V0KGFycmF5KTtcbiAgICByZXR1cm4gbmV3IHRoaXModiwgeyB0eXBlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBNYXRyaXgzMyBmcm9tIGEgcmVndWxhciBhcnJheSBpbiBjb2x1bW4tbWFqb3Igb3JkZXIuXG4gICAqIEBwYXJhbSBhcnJheSAtIFRoZSBhcnJheSBjb250YWluaW5nIGF0IGxlYXN0IDkgbnVtYmVyc1xuICAgKiBAcmV0dXJucyBBIG5ldyBNYXRyaXgzMyBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIF9mcm9tQ29weUFycmF5Q29sdW1uTWFqb3IoYXJyYXk6IEFycmF5PG51bWJlcj4sIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKTogSU1hdHJpeDMzIHtcbiAgICBjb25zdCB2ID0gbmV3IHR5cGUoOSk7XG4gICAgdi5zZXQoYXJyYXkpO1xuICAgIHJldHVybiBuZXcgdGhpcyh2LCB7IHR5cGUgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIE1hdHJpeDMzIGZyb20gYW4gQXJyYXk5IGluIHJvdy1tYWpvciBvcmRlci5cbiAgICogQHBhcmFtIGFycmF5IC0gVGhlIEFycmF5OSBjb250YWluaW5nIDkgbnVtYmVycyBpbiByb3ctbWFqb3Igb3JkZXJcbiAgICogQHJldHVybnMgQSBuZXcgTWF0cml4MzMgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBfZnJvbUNvcHlBcnJheTlSb3dNYWpvcihhcnJheTogQXJyYXk5PG51bWJlcj4sIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKTogSU1hdHJpeDMzIHtcbiAgICBjb25zdCB2ID0gbmV3IHR5cGUoOSk7XG4gICAgdlswXSA9IGFycmF5WzBdO1xuICAgIHZbM10gPSBhcnJheVsxXTtcbiAgICB2WzZdID0gYXJyYXlbMl07XG4gICAgdlsxXSA9IGFycmF5WzNdO1xuICAgIHZbNF0gPSBhcnJheVs0XTtcbiAgICB2WzddID0gYXJyYXlbNV07XG4gICAgdlsyXSA9IGFycmF5WzZdO1xuICAgIHZbNV0gPSBhcnJheVs3XTtcbiAgICB2WzhdID0gYXJyYXlbOF07XG4gICAgcmV0dXJuIG5ldyB0aGlzKHYsIHsgdHlwZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgTWF0cml4MzMgZnJvbSBhIHJlZ3VsYXIgYXJyYXkgaW4gcm93LW1ham9yIG9yZGVyLlxuICAgKiBAcGFyYW0gYXJyYXkgLSBUaGUgYXJyYXkgY29udGFpbmluZyBhdCBsZWFzdCA5IG51bWJlcnMgaW4gcm93LW1ham9yIG9yZGVyXG4gICAqIEByZXR1cm5zIEEgbmV3IE1hdHJpeDMzIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgX2Zyb21Db3B5QXJyYXlSb3dNYWpvcihhcnJheTogQXJyYXk8bnVtYmVyPiwgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpOiBJTWF0cml4MzMge1xuICAgIGNvbnN0IHYgPSBuZXcgdHlwZSg5KTtcbiAgICB2WzBdID0gYXJyYXlbMF07XG4gICAgdlszXSA9IGFycmF5WzFdO1xuICAgIHZbNl0gPSBhcnJheVsyXTtcbiAgICB2WzFdID0gYXJyYXlbM107XG4gICAgdls0XSA9IGFycmF5WzRdO1xuICAgIHZbN10gPSBhcnJheVs1XTtcbiAgICB2WzJdID0gYXJyYXlbNl07XG4gICAgdls1XSA9IGFycmF5WzddO1xuICAgIHZbOF0gPSBhcnJheVs4XTtcbiAgICByZXR1cm4gbmV3IHRoaXModiwgeyB0eXBlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBNYXRyaXgzMyBmcm9tIGEgcXVhdGVybmlvbiByZXByZXNlbnRpbmcgcm90YXRpb24uXG4gICAqIEBwYXJhbSBxIC0gVGhlIHF1YXRlcm5pb24gdG8gY29udmVydFxuICAgKiBAcmV0dXJucyBBIG5ldyBNYXRyaXgzMyByZXByZXNlbnRpbmcgdGhlIHJvdGF0aW9uXG4gICAqL1xuICBzdGF0aWMgX2Zyb21Db3B5UXVhdGVybmlvbihxOiBJUXVhdGVybmlvbiwgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpOiBJTWF0cml4MzMge1xuICAgIGNvbnN0IHN4ID0gcS5fdlswXSAqIHEuX3ZbMF07XG4gICAgY29uc3Qgc3kgPSBxLl92WzFdICogcS5fdlsxXTtcbiAgICBjb25zdCBzeiA9IHEuX3ZbMl0gKiBxLl92WzJdO1xuICAgIGNvbnN0IGN4ID0gcS5fdlsxXSAqIHEuX3ZbMl07XG4gICAgY29uc3QgY3kgPSBxLl92WzBdICogcS5fdlsyXTtcbiAgICBjb25zdCBjeiA9IHEuX3ZbMF0gKiBxLl92WzFdO1xuICAgIGNvbnN0IHd4ID0gcS5fdlszXSAqIHEuX3ZbMF07XG4gICAgY29uc3Qgd3kgPSBxLl92WzNdICogcS5fdlsxXTtcbiAgICBjb25zdCB3eiA9IHEuX3ZbM10gKiBxLl92WzJdO1xuICAgIGNvbnN0IHYgPSBuZXcgdHlwZSg5KTtcbiAgICB2WzBdID0gMS4wIC0gMi4wICogKHN5ICsgc3opO1xuICAgIHZbM10gPSAyLjAgKiAoY3ogLSB3eik7XG4gICAgdls2XSA9IDIuMCAqIChjeSArIHd5KTtcbiAgICB2WzFdID0gMi4wICogKGN6ICsgd3opO1xuICAgIHZbNF0gPSAxLjAgLSAyLjAgKiAoc3ggKyBzeik7XG4gICAgdls3XSA9IDIuMCAqIChjeCAtIHd4KTtcbiAgICB2WzJdID0gMi4wICogKGN5IC0gd3kpO1xuICAgIHZbNV0gPSAyLjAgKiAoY3ggKyB3eCk7XG4gICAgdls4XSA9IDEuMCAtIDIuMCAqIChzeCArIHN5KTtcblxuICAgIHJldHVybiBuZXcgdGhpcyh2LCB7IHR5cGUgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbW11dGFibGUgM3gzIG1hdHJpeCB3aXRoIDMyLWJpdCBmbG9hdCBjb21wb25lbnRzLlxuICogVGhpcyBpcyB0aGUgc3RhbmRhcmQgcHJlY2lzaW9uIGltcGxlbWVudGF0aW9uIGZvciBub3JtYWwgbWF0cmljZXMgYW5kIG90aGVyIDNEIG1hdGguXG4gKi9cbmV4cG9ydCBjbGFzcyBNYXRyaXgzMyBleHRlbmRzIE1hdHJpeDMzXzxGbG9hdDMyQXJyYXlDb25zdHJ1Y3Rvcj4ge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNYXRyaXgzMyBpbnN0YW5jZS5cbiAgICogQHBhcmFtIG0gLSBUaGUgdHlwZWQgYXJyYXkgY29udGFpbmluZyB0aGUgbWF0cml4IGNvbXBvbmVudHNcbiAgICovXG4gIGNvbnN0cnVjdG9yKG06IFR5cGVkQXJyYXkpIHtcbiAgICBzdXBlcihtLCB7IHR5cGU6IEZsb2F0MzJBcnJheSB9KTtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgemVybyBtYXRyaXguICovXG4gIHN0YXRpYyB6ZXJvKCk6IE1hdHJpeDMzIHtcbiAgICByZXR1cm4gc3VwZXIuX3plcm8oRmxvYXQzMkFycmF5KSBhcyBNYXRyaXgzMztcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGFuIGlkZW50aXR5IG1hdHJpeCAob3B0aW1pemVkIElkZW50aXR5TWF0cml4MzMgaW5zdGFuY2UpLiAqL1xuICBzdGF0aWMgaWRlbnRpdHkoKTogSU1hdHJpeDMzIHtcbiAgICByZXR1cm4gbmV3IElkZW50aXR5TWF0cml4MzMoKTtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgZHVtbXkgbWF0cml4IHdpdGggYW4gZW1wdHkgYXJyYXkuICovXG4gIHN0YXRpYyBkdW1teSgpOiBNYXRyaXgzMyB7XG4gICAgcmV0dXJuIHN1cGVyLl9kdW1teShGbG9hdDMyQXJyYXkpIGFzIE1hdHJpeDMzO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgdGhlIHRyYW5zcG9zZSBvZiB0aGUgZ2l2ZW4gbWF0cml4LiAqL1xuICBzdGF0aWMgdHJhbnNwb3NlKG1hdDogSU1hdHJpeDMzKTogTWF0cml4MzMge1xuICAgIHJldHVybiBzdXBlci5fdHJhbnNwb3NlKG1hdCwgRmxvYXQzMkFycmF5KSBhcyBNYXRyaXgzMztcbiAgfVxuXG4gIC8qKiBBdHRlbXB0cyB0byBpbnZlcnQgdGhlIGdpdmVuIG1hdHJpeCwgcmV0dXJuaW5nIG51bGwgd2hlbiBpdCBpcyBzaW5ndWxhci4gKi9cbiAgc3RhdGljIHRyeUludmVydChtYXQ6IElNYXRyaXgzMyk6IE1hdHJpeDMzIHwgbnVsbCB7XG4gICAgcmV0dXJuIHN1cGVyLl90cnlJbnZlcnQobWF0LCBGbG9hdDMyQXJyYXkpIGFzIE1hdHJpeDMzIHwgbnVsbDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIHRoZSBpbnZlcnNlIG9mIHRoZSBnaXZlbiBtYXRyaXggKGlkZW50aXR5IHdoZW4gc2luZ3VsYXIpLiAqL1xuICBzdGF0aWMgaW52ZXJ0KG1hdDogSU1hdHJpeDMzKTogTWF0cml4MzMge1xuICAgIHJldHVybiBzdXBlci5faW52ZXJ0KG1hdCwgRmxvYXQzMkFycmF5KSBhcyBNYXRyaXgzMztcbiAgfVxuXG4gIC8qKiBBdHRlbXB0cyB0byBpbnZlcnQgdGhlIGdpdmVuIG1hdHJpeCBpbnRvIG91dE1hdC4gKi9cbiAgc3RhdGljIHRyeUludmVydFRvPFQgZXh0ZW5kcyBJTXV0YWJsZU1hdHJpeDMzPihtYXQ6IElNYXRyaXgzMywgb3V0TWF0OiBUKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHN1cGVyLl90cnlJbnZlcnRUbyhtYXQsIG91dE1hdCk7XG4gIH1cblxuICAvKiogSW52ZXJ0cyB0aGUgZ2l2ZW4gbWF0cml4IGludG8gb3V0TWF0IChpZGVudGl0eSB3aGVuIHNpbmd1bGFyKS4gKi9cbiAgc3RhdGljIGludmVydFRvPFQgZXh0ZW5kcyBJTXV0YWJsZU1hdHJpeDMzPihtYXQ6IElNYXRyaXgzMywgb3V0TWF0OiBUKTogVCB7XG4gICAgcmV0dXJuIHN1cGVyLl9pbnZlcnRUbyhtYXQsIG91dE1hdCkgYXMgVDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgcm90YXRpb24gbWF0cml4IGFyb3VuZCB0aGUgWC1heGlzLiAqL1xuICBzdGF0aWMgcm90YXRlWChyYWRpYW46IG51bWJlcik6IE1hdHJpeDMzIHtcbiAgICByZXR1cm4gc3VwZXIuX3JvdGF0ZVgocmFkaWFuLCBGbG9hdDMyQXJyYXkpIGFzIE1hdHJpeDMzO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSByb3RhdGlvbiBtYXRyaXggYXJvdW5kIHRoZSBZLWF4aXMuICovXG4gIHN0YXRpYyByb3RhdGVZKHJhZGlhbjogbnVtYmVyKTogTWF0cml4MzMge1xuICAgIHJldHVybiBzdXBlci5fcm90YXRlWShyYWRpYW4sIEZsb2F0MzJBcnJheSkgYXMgTWF0cml4MzM7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIHJvdGF0aW9uIG1hdHJpeCBhcm91bmQgdGhlIFotYXhpcy4gKi9cbiAgc3RhdGljIHJvdGF0ZVoocmFkaWFuOiBudW1iZXIpOiBNYXRyaXgzMyB7XG4gICAgcmV0dXJuIHN1cGVyLl9yb3RhdGVaKHJhZGlhbiwgRmxvYXQzMkFycmF5KSBhcyBNYXRyaXgzMztcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgcm90YXRpb24gbWF0cml4IGZyb20gRXVsZXIgYW5nbGVzIGluIFhZWiBvcmRlci4gKi9cbiAgc3RhdGljIHJvdGF0ZVhZWih4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyKTogTWF0cml4MzMge1xuICAgIHJldHVybiBzdXBlci5fcm90YXRlWFlaKHgsIHksIHosIEZsb2F0MzJBcnJheSkgYXMgTWF0cml4MzM7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIHJvdGF0aW9uIG1hdHJpeCBmcm9tIGEgVmVjdG9yMyBjb250YWluaW5nIEV1bGVyIGFuZ2xlcy4gKi9cbiAgc3RhdGljIHJvdGF0ZSh2ZWM6IElWZWN0b3IzKTogTWF0cml4MzMge1xuICAgIHJldHVybiBzdXBlci5fcm90YXRlKHZlYywgRmxvYXQzMkFycmF5KSBhcyBNYXRyaXgzMztcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgc2NhbGluZyBtYXRyaXguICovXG4gIHN0YXRpYyBzY2FsZSh2ZWM6IElWZWN0b3IzKTogTWF0cml4MzMge1xuICAgIHJldHVybiBzdXBlci5fc2NhbGUodmVjLCBGbG9hdDMyQXJyYXkpIGFzIE1hdHJpeDMzO1xuICB9XG5cbiAgLyoqIE11bHRpcGxpZXMgdHdvIG1hdHJpY2VzLiAqL1xuICBzdGF0aWMgbXVsdGlwbHkobF9tYXQ6IElNYXRyaXgzMywgcl9tYXQ6IElNYXRyaXgzMyk6IE1hdHJpeDMzIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5KGxfbWF0LCByX21hdCwgRmxvYXQzMkFycmF5KSBhcyBNYXRyaXgzMztcbiAgfVxuXG4gIC8qKiBNdWx0aXBsaWVzIHR3byBtYXRyaWNlcyBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gb3V0TWF0LiAqL1xuICBzdGF0aWMgbXVsdGlwbHlUbzxUIGV4dGVuZHMgSU11dGFibGVNYXRyaXgzMz4obF9tYXQ6IElNYXRyaXgzMywgcl9tYXQ6IElNYXRyaXgzMywgb3V0TWF0OiBUKTogVCB7XG4gICAgcmV0dXJuIHN1cGVyLl9tdWx0aXBseVRvKGxfbWF0LCByX21hdCwgb3V0TWF0KSBhcyBUO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSByb3ctbWFqb3IgY29tcG9uZW50cy4gKi9cbiAgLy8gcHJldHRpZXItaWdub3JlXG4gIHN0YXRpYyBmcm9tQ29weTlSb3dNYWpvcihcbiAgICBtMDA6IG51bWJlcixcbiAgICBtMDE6IG51bWJlcixcbiAgICBtMDI6IG51bWJlcixcbiAgICBtMTA6IG51bWJlcixcbiAgICBtMTE6IG51bWJlcixcbiAgICBtMTI6IG51bWJlcixcbiAgICBtMjA6IG51bWJlcixcbiAgICBtMjE6IG51bWJlcixcbiAgICBtMjI6IG51bWJlclxuICApOiBNYXRyaXgzMyB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weTlSb3dNYWpvcihtMDAsIG0wMSwgbTAyLCBtMTAsIG0xMSwgbTEyLCBtMjAsIG0yMSwgbTIyLCBGbG9hdDMyQXJyYXkpIGFzIE1hdHJpeDMzO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBjb2x1bW4tbWFqb3IgY29tcG9uZW50cy4gKi9cbiAgLy8gcHJldHRpZXItaWdub3JlXG4gIHN0YXRpYyBmcm9tQ29weTlDb2x1bW5NYWpvcihcbiAgICBtMDA6IG51bWJlcixcbiAgICBtMTA6IG51bWJlcixcbiAgICBtMjA6IG51bWJlcixcbiAgICBtMDE6IG51bWJlcixcbiAgICBtMTE6IG51bWJlcixcbiAgICBtMjE6IG51bWJlcixcbiAgICBtMDI6IG51bWJlcixcbiAgICBtMTI6IG51bWJlcixcbiAgICBtMjI6IG51bWJlclxuICApOiBNYXRyaXgzMyB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weTlDb2x1bW5NYWpvcihtMDAsIG0xMCwgbTIwLCBtMDEsIG0xMSwgbTIxLCBtMDIsIG0xMiwgbTIyLCBGbG9hdDMyQXJyYXkpIGFzIE1hdHJpeDMzO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSB0aGUgdXBwZXItbGVmdCAzeDMgcG9ydGlvbiBvZiBhIDR4NCBtYXRyaXguICovXG4gIHN0YXRpYyBmcm9tQ29weU1hdHJpeDQ0KG1hdDogSU1hdHJpeDQ0KTogTWF0cml4MzMge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlNYXRyaXg0NChtYXQsIEZsb2F0MzJBcnJheSkgYXMgTWF0cml4MzM7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCB0aGF0IGRpcmVjdGx5IHVzZXMgdGhlIGdpdmVuIEZsb2F0MzJBcnJheS4gKi9cbiAgc3RhdGljIGZyb21GbG9hdDMyQXJyYXlDb2x1bW5NYWpvcihhcnJheTogRmxvYXQzMkFycmF5KTogTWF0cml4MzMge1xuICAgIHJldHVybiBzdXBlci5fZnJvbVR5cGVkQXJyYXlDb2x1bW5NYWpvcihhcnJheSwgRmxvYXQzMkFycmF5KSBhcyBNYXRyaXgzMztcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGJ5IGNvcHlpbmcgYSBGbG9hdDMyQXJyYXkgaW4gY29sdW1uLW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlGbG9hdDMyQXJyYXlDb2x1bW5NYWpvcihhcnJheTogRmxvYXQzMkFycmF5KTogTWF0cml4MzMge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlUeXBlZEFycmF5Q29sdW1uTWFqb3IoYXJyYXksIEZsb2F0MzJBcnJheSkgYXMgTWF0cml4MzM7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBieSBjb3B5aW5nIGEgRmxvYXQzMkFycmF5IGluIHJvdy1tYWpvciBvcmRlci4gKi9cbiAgc3RhdGljIGZyb21Db3B5RmxvYXQzMkFycmF5Um93TWFqb3IoYXJyYXk6IEZsb2F0MzJBcnJheSk6IE1hdHJpeDMzIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5VHlwZWRBcnJheVJvd01ham9yKGFycmF5LCBGbG9hdDMyQXJyYXkpIGFzIE1hdHJpeDMzO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggYnkgY29weWluZyBhbm90aGVyIG1hdHJpeC4gKi9cbiAgc3RhdGljIGZyb21Db3B5TWF0cml4MzMobWF0OiBJTWF0cml4MzMpOiBNYXRyaXgzMyB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weU1hdHJpeDMzKG1hdCwgRmxvYXQzMkFycmF5KSBhcyBNYXRyaXgzMztcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSA5LWVsZW1lbnQgYXJyYXkgaW4gY29sdW1uLW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheTlDb2x1bW5NYWpvcihhcnJheTogQXJyYXk5PG51bWJlcj4pOiBNYXRyaXgzMyB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weUFycmF5OUNvbHVtbk1ham9yKGFycmF5LCBGbG9hdDMyQXJyYXkpIGFzIE1hdHJpeDMzO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhbiBhcnJheSBpbiBjb2x1bW4tbWFqb3Igb3JkZXIuICovXG4gIHN0YXRpYyBmcm9tQ29weUFycmF5Q29sdW1uTWFqb3IoYXJyYXk6IEFycmF5PG51bWJlcj4pOiBNYXRyaXgzMyB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weUFycmF5Q29sdW1uTWFqb3IoYXJyYXksIEZsb2F0MzJBcnJheSkgYXMgTWF0cml4MzM7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgOS1lbGVtZW50IGFycmF5IGluIHJvdy1tYWpvciBvcmRlci4gKi9cbiAgc3RhdGljIGZyb21Db3B5QXJyYXk5Um93TWFqb3IoYXJyYXk6IEFycmF5OTxudW1iZXI+KTogTWF0cml4MzMge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlBcnJheTlSb3dNYWpvcihhcnJheSwgRmxvYXQzMkFycmF5KSBhcyBNYXRyaXgzMztcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYW4gYXJyYXkgaW4gcm93LW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheVJvd01ham9yKGFycmF5OiBBcnJheTxudW1iZXI+KTogTWF0cml4MzMge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlBcnJheVJvd01ham9yKGFycmF5LCBGbG9hdDMyQXJyYXkpIGFzIE1hdHJpeDMzO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIHF1YXRlcm5pb24gcmVwcmVzZW50aW5nIGEgcm90YXRpb24uICovXG4gIHN0YXRpYyBmcm9tQ29weVF1YXRlcm5pb24ocTogSVF1YXRlcm5pb24pOiBNYXRyaXgzMyB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weVF1YXRlcm5pb24ocSwgRmxvYXQzMkFycmF5KSBhcyBNYXRyaXgzMztcbiAgfVxufVxuXG4vKipcbiAqIEltbXV0YWJsZSAzeDMgbWF0cml4IHdpdGggNjQtYml0IGZsb2F0IGNvbXBvbmVudHMuXG4gKiBVc2UgdGhpcyBpbXBsZW1lbnRhdGlvbiB3aGVuIGhpZ2hlciBudW1lcmljYWwgcHJlY2lzaW9uIGlzIHJlcXVpcmVkLlxuICovXG5leHBvcnQgY2xhc3MgTWF0cml4MzNEIGV4dGVuZHMgTWF0cml4MzNfPEZsb2F0NjRBcnJheUNvbnN0cnVjdG9yPiB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IE1hdHJpeDMzRCBpbnN0YW5jZS5cbiAgICogQHBhcmFtIG0gLSBUaGUgdHlwZWQgYXJyYXkgY29udGFpbmluZyB0aGUgbWF0cml4IGNvbXBvbmVudHNcbiAgICovXG4gIHByaXZhdGUgY29uc3RydWN0b3IobTogVHlwZWRBcnJheSkge1xuICAgIHN1cGVyKG0sIHsgdHlwZTogRmxvYXQ2NEFycmF5IH0pO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSB6ZXJvIG1hdHJpeC4gKi9cbiAgc3RhdGljIHplcm8oKTogTWF0cml4MzNEIHtcbiAgICByZXR1cm4gc3VwZXIuX3plcm8oRmxvYXQ2NEFycmF5KSBhcyBNYXRyaXgzM0Q7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhbiBpZGVudGl0eSBtYXRyaXguICovXG4gIHN0YXRpYyBpZGVudGl0eSgpOiBNYXRyaXgzM0Qge1xuICAgIHJldHVybiBzdXBlci5faWRlbnRpdHkoRmxvYXQ2NEFycmF5KSBhcyBNYXRyaXgzM0Q7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIGR1bW15IG1hdHJpeCB3aXRoIGFuIGVtcHR5IGFycmF5LiAqL1xuICBzdGF0aWMgZHVtbXkoKTogTWF0cml4MzNEIHtcbiAgICByZXR1cm4gc3VwZXIuX2R1bW15KEZsb2F0NjRBcnJheSkgYXMgTWF0cml4MzNEO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgdGhlIHRyYW5zcG9zZSBvZiB0aGUgZ2l2ZW4gbWF0cml4LiAqL1xuICBzdGF0aWMgdHJhbnNwb3NlKG1hdDogSU1hdHJpeDMzKTogTWF0cml4MzNEIHtcbiAgICByZXR1cm4gc3VwZXIuX3RyYW5zcG9zZShtYXQsIEZsb2F0NjRBcnJheSkgYXMgTWF0cml4MzNEO1xuICB9XG5cbiAgLyoqIEF0dGVtcHRzIHRvIGludmVydCB0aGUgZ2l2ZW4gbWF0cml4LCByZXR1cm5pbmcgbnVsbCB3aGVuIGl0IGlzIHNpbmd1bGFyLiAqL1xuICBzdGF0aWMgdHJ5SW52ZXJ0KG1hdDogSU1hdHJpeDMzKTogTWF0cml4MzNEIHwgbnVsbCB7XG4gICAgcmV0dXJuIHN1cGVyLl90cnlJbnZlcnQobWF0LCBGbG9hdDY0QXJyYXkpIGFzIE1hdHJpeDMzRCB8IG51bGw7XG4gIH1cblxuICAvKiogQ3JlYXRlcyB0aGUgaW52ZXJzZSBvZiB0aGUgZ2l2ZW4gbWF0cml4IChpZGVudGl0eSB3aGVuIHNpbmd1bGFyKS4gKi9cbiAgc3RhdGljIGludmVydChtYXQ6IElNYXRyaXgzMyk6IE1hdHJpeDMzRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9pbnZlcnQobWF0LCBGbG9hdDY0QXJyYXkpIGFzIE1hdHJpeDMzRDtcbiAgfVxuXG4gIC8qKiBBdHRlbXB0cyB0byBpbnZlcnQgdGhlIGdpdmVuIG1hdHJpeCBpbnRvIG91dE1hdC4gKi9cbiAgc3RhdGljIHRyeUludmVydFRvPFQgZXh0ZW5kcyBJTXV0YWJsZU1hdHJpeDMzPihtYXQ6IElNYXRyaXgzMywgb3V0TWF0OiBUKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHN1cGVyLl90cnlJbnZlcnRUbyhtYXQsIG91dE1hdCk7XG4gIH1cblxuICAvKiogSW52ZXJ0cyB0aGUgZ2l2ZW4gbWF0cml4IGludG8gb3V0TWF0IChpZGVudGl0eSB3aGVuIHNpbmd1bGFyKS4gKi9cbiAgc3RhdGljIGludmVydFRvPFQgZXh0ZW5kcyBJTXV0YWJsZU1hdHJpeDMzPihtYXQ6IElNYXRyaXgzMywgb3V0TWF0OiBUKTogVCB7XG4gICAgcmV0dXJuIHN1cGVyLl9pbnZlcnRUbyhtYXQsIG91dE1hdCkgYXMgVDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgcm90YXRpb24gbWF0cml4IGFyb3VuZCB0aGUgWC1heGlzLiAqL1xuICBzdGF0aWMgcm90YXRlWChyYWRpYW46IG51bWJlcik6IE1hdHJpeDMzRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9yb3RhdGVYKHJhZGlhbiwgRmxvYXQ2NEFycmF5KSBhcyBNYXRyaXgzM0Q7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIHJvdGF0aW9uIG1hdHJpeCBhcm91bmQgdGhlIFktYXhpcy4gKi9cbiAgc3RhdGljIHJvdGF0ZVkocmFkaWFuOiBudW1iZXIpOiBNYXRyaXgzM0Qge1xuICAgIHJldHVybiBzdXBlci5fcm90YXRlWShyYWRpYW4sIEZsb2F0NjRBcnJheSkgYXMgTWF0cml4MzNEO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSByb3RhdGlvbiBtYXRyaXggYXJvdW5kIHRoZSBaLWF4aXMuICovXG4gIHN0YXRpYyByb3RhdGVaKHJhZGlhbjogbnVtYmVyKTogTWF0cml4MzNEIHtcbiAgICByZXR1cm4gc3VwZXIuX3JvdGF0ZVoocmFkaWFuLCBGbG9hdDY0QXJyYXkpIGFzIE1hdHJpeDMzRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgcm90YXRpb24gbWF0cml4IGZyb20gRXVsZXIgYW5nbGVzIGluIFhZWiBvcmRlci4gKi9cbiAgc3RhdGljIHJvdGF0ZVhZWih4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyKTogTWF0cml4MzNEIHtcbiAgICByZXR1cm4gc3VwZXIuX3JvdGF0ZVhZWih4LCB5LCB6LCBGbG9hdDY0QXJyYXkpIGFzIE1hdHJpeDMzRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgcm90YXRpb24gbWF0cml4IGZyb20gYSBWZWN0b3IzIGNvbnRhaW5pbmcgRXVsZXIgYW5nbGVzLiAqL1xuICBzdGF0aWMgcm90YXRlKHZlYzogSVZlY3RvcjMpOiBNYXRyaXgzM0Qge1xuICAgIHJldHVybiBzdXBlci5fcm90YXRlKHZlYywgRmxvYXQ2NEFycmF5KSBhcyBNYXRyaXgzM0Q7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIHNjYWxpbmcgbWF0cml4LiAqL1xuICBzdGF0aWMgc2NhbGUodmVjOiBJVmVjdG9yMyk6IE1hdHJpeDMzRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9zY2FsZSh2ZWMsIEZsb2F0NjRBcnJheSkgYXMgTWF0cml4MzNEO1xuICB9XG5cbiAgLyoqIE11bHRpcGxpZXMgdHdvIG1hdHJpY2VzLiAqL1xuICBzdGF0aWMgbXVsdGlwbHkobF9tYXQ6IElNYXRyaXgzMywgcl9tYXQ6IElNYXRyaXgzMyk6IE1hdHJpeDMzRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9tdWx0aXBseShsX21hdCwgcl9tYXQsIEZsb2F0NjRBcnJheSkgYXMgTWF0cml4MzNEO1xuICB9XG5cbiAgLyoqIE11bHRpcGxpZXMgdHdvIG1hdHJpY2VzIGFuZCBzdG9yZXMgdGhlIHJlc3VsdCBpbiBvdXRNYXQuICovXG4gIHN0YXRpYyBtdWx0aXBseVRvPFQgZXh0ZW5kcyBJTXV0YWJsZU1hdHJpeDMzPihsX21hdDogSU1hdHJpeDMzLCByX21hdDogSU1hdHJpeDMzLCBvdXRNYXQ6IFQpOiBUIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5VG8obF9tYXQsIHJfbWF0LCBvdXRNYXQpIGFzIFQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIHJvdy1tYWpvciBjb21wb25lbnRzLiAqL1xuICAvLyBwcmV0dGllci1pZ25vcmVcbiAgc3RhdGljIGZyb21Db3B5OVJvd01ham9yKFxuICAgIG0wMDogbnVtYmVyLFxuICAgIG0wMTogbnVtYmVyLFxuICAgIG0wMjogbnVtYmVyLFxuICAgIG0xMDogbnVtYmVyLFxuICAgIG0xMTogbnVtYmVyLFxuICAgIG0xMjogbnVtYmVyLFxuICAgIG0yMDogbnVtYmVyLFxuICAgIG0yMTogbnVtYmVyLFxuICAgIG0yMjogbnVtYmVyXG4gICk6IE1hdHJpeDMzRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weTlSb3dNYWpvcihtMDAsIG0wMSwgbTAyLCBtMTAsIG0xMSwgbTEyLCBtMjAsIG0yMSwgbTIyLCBGbG9hdDY0QXJyYXkpIGFzIE1hdHJpeDMzRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gY29sdW1uLW1ham9yIGNvbXBvbmVudHMuICovXG4gIC8vIHByZXR0aWVyLWlnbm9yZVxuICBzdGF0aWMgZnJvbUNvcHk5Q29sdW1uTWFqb3IoXG4gICAgbTAwOiBudW1iZXIsXG4gICAgbTEwOiBudW1iZXIsXG4gICAgbTIwOiBudW1iZXIsXG4gICAgbTAxOiBudW1iZXIsXG4gICAgbTExOiBudW1iZXIsXG4gICAgbTIxOiBudW1iZXIsXG4gICAgbTAyOiBudW1iZXIsXG4gICAgbTEyOiBudW1iZXIsXG4gICAgbTIyOiBudW1iZXJcbiAgKTogTWF0cml4MzNEIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5OUNvbHVtbk1ham9yKG0wMCwgbTEwLCBtMjAsIG0wMSwgbTExLCBtMjEsIG0wMiwgbTEyLCBtMjIsIEZsb2F0NjRBcnJheSkgYXMgTWF0cml4MzNEO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSB0aGUgdXBwZXItbGVmdCAzeDMgcG9ydGlvbiBvZiBhIDR4NCBtYXRyaXguICovXG4gIHN0YXRpYyBmcm9tQ29weU1hdHJpeDQ0KG1hdDogSU1hdHJpeDQ0KTogTWF0cml4MzNEIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5TWF0cml4NDQobWF0LCBGbG9hdDY0QXJyYXkpIGFzIE1hdHJpeDMzRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IHRoYXQgZGlyZWN0bHkgdXNlcyB0aGUgZ2l2ZW4gRmxvYXQ2NEFycmF5LiAqL1xuICBzdGF0aWMgZnJvbUZsb2F0NjRBcnJheUNvbHVtbk1ham9yKGFycmF5OiBGbG9hdDY0QXJyYXkpOiBNYXRyaXgzM0Qge1xuICAgIHJldHVybiBzdXBlci5fZnJvbVR5cGVkQXJyYXlDb2x1bW5NYWpvcihhcnJheSwgRmxvYXQ2NEFycmF5KSBhcyBNYXRyaXgzM0Q7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBieSBjb3B5aW5nIGEgRmxvYXQ2NEFycmF5IGluIGNvbHVtbi1tYWpvciBvcmRlci4gKi9cbiAgc3RhdGljIGZyb21Db3B5RmxvYXQ2NEFycmF5Q29sdW1uTWFqb3IoYXJyYXk6IEZsb2F0NjRBcnJheSk6IE1hdHJpeDMzRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weVR5cGVkQXJyYXlDb2x1bW5NYWpvcihhcnJheSwgRmxvYXQ2NEFycmF5KSBhcyBNYXRyaXgzM0Q7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBieSBjb3B5aW5nIGEgRmxvYXQ2NEFycmF5IGluIHJvdy1tYWpvciBvcmRlci4gKi9cbiAgc3RhdGljIGZyb21Db3B5RmxvYXQ2NEFycmF5Um93TWFqb3IoYXJyYXk6IEZsb2F0NjRBcnJheSk6IE1hdHJpeDMzRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weVR5cGVkQXJyYXlSb3dNYWpvcihhcnJheSwgRmxvYXQ2NEFycmF5KSBhcyBNYXRyaXgzM0Q7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBieSBjb3B5aW5nIGFub3RoZXIgbWF0cml4LiAqL1xuICBzdGF0aWMgZnJvbUNvcHlNYXRyaXgzMyhtYXQ6IElNYXRyaXgzMyk6IE1hdHJpeDMzRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weU1hdHJpeDMzKG1hdCwgRmxvYXQ2NEFycmF5KSBhcyBNYXRyaXgzM0Q7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgOS1lbGVtZW50IGFycmF5IGluIGNvbHVtbi1tYWpvciBvcmRlci4gKi9cbiAgc3RhdGljIGZyb21Db3B5QXJyYXk5Q29sdW1uTWFqb3IoYXJyYXk6IEFycmF5OTxudW1iZXI+KTogTWF0cml4MzNEIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5QXJyYXk5Q29sdW1uTWFqb3IoYXJyYXksIEZsb2F0NjRBcnJheSkgYXMgTWF0cml4MzNEO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhbiBhcnJheSBpbiBjb2x1bW4tbWFqb3Igb3JkZXIuICovXG4gIHN0YXRpYyBmcm9tQ29weUFycmF5Q29sdW1uTWFqb3IoYXJyYXk6IEFycmF5PG51bWJlcj4pOiBNYXRyaXgzM0Qge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlBcnJheUNvbHVtbk1ham9yKGFycmF5LCBGbG9hdDY0QXJyYXkpIGFzIE1hdHJpeDMzRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSA5LWVsZW1lbnQgYXJyYXkgaW4gcm93LW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheTlSb3dNYWpvcihhcnJheTogQXJyYXk5PG51bWJlcj4pOiBNYXRyaXgzM0Qge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlBcnJheTlSb3dNYWpvcihhcnJheSwgRmxvYXQ2NEFycmF5KSBhcyBNYXRyaXgzM0Q7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGFuIGFycmF5IGluIHJvdy1tYWpvciBvcmRlci4gKi9cbiAgc3RhdGljIGZyb21Db3B5QXJyYXlSb3dNYWpvcihhcnJheTogQXJyYXk8bnVtYmVyPik6IE1hdHJpeDMzRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weUFycmF5Um93TWFqb3IoYXJyYXksIEZsb2F0NjRBcnJheSkgYXMgTWF0cml4MzNEO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIHF1YXRlcm5pb24gcmVwcmVzZW50aW5nIGEgcm90YXRpb24uICovXG4gIHN0YXRpYyBmcm9tQ29weVF1YXRlcm5pb24ocTogSVF1YXRlcm5pb24pOiBNYXRyaXgzM0Qge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlRdWF0ZXJuaW9uKHEsIEZsb2F0NjRBcnJheSkgYXMgTWF0cml4MzNEO1xuICB9XG59XG5cbi8qKlxuICogQWxpYXMgZm9yIHRoZSAzMi1iaXQgKEZsb2F0MzJBcnJheSkgaW1wbGVtZW50YXRpb24sIG1ha2luZyB0aGUgcHJlY2lzaW9uIGV4cGxpY2l0LlxuICovXG5leHBvcnQgeyBNYXRyaXgzMyBhcyBNYXRyaXgzM0YgfTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFFQSxTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLGNBQWM7QUFDdkIsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyx3QkFBd0I7QUFJakMsU0FBUyxnQkFBZ0I7QUFFekIsU0FBUyxlQUFlO0FBdUJqQixJQUFNLFlBQU4sY0FBOEQsZUFBNkM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNaEgsWUFBWSxHQUFlLFVBQXVCO0FBQ2hELFVBQU07QUFDTixTQUFLLEtBQUs7QUFBQSxFQUNaO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQVcsTUFBTTtBQUNmLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFXLE1BQU07QUFDZixXQUFPLEtBQUssR0FBRyxDQUFDO0FB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QUM7QUFDNUYsVUFBTSxNQUFNLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQztBQUM1RixVQUFNLE1BQU0sTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDO0FBRTVGLFVBQU0sTUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUM7QUFDNUYsVUFBTSxNQUFNLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQztBQUM1RixVQUFNLE1BQU0sTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDO0FBRTVGLFVBQU0sTUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUM7QUFDNUYsVUFBTSxNQUFNLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQztBQUM1RixVQUFNLE1BQU0sTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDO0FBRTVGLFdBQU8sS0FBSyxtQkFBbUIsS0FBSyxLQUFLLEtBQUssS0FBSyxLQUFLLEtBQUssS0FBSyxLQUFLLEtBQUssSUFBSTtBQUFBLEVBQ2xGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBLE9BQU8sWUFBWSxPQUFrQixPQUFrQixRQUE0QztBQUNqRyxRQUFJLE1BQU0sdUJBQXVCO0FBQy9CLGFBQU8sT0FBTyxlQUFlLEtBQUs7QUFBQSxJQUNwQztBQUNBLFFBQUksTUFBTSx1QkFBdUI7QUFDL0IsYUFBTyxPQUFPLGVBQWUsS0FBSztBQUFBLElBQ3BDO0FBRUEsVUFBTSxNQUFNLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQztBQUM1RixVQUFNLE1BQU0sTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDO0FBQzVGLFVBQU0sTUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUM7QUFFNUYsVUFBTSxNQUFNLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQztBQUM1RixVQUFNLE1BQU0sTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDO0FBQzVGLFVBQU0sTUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUM7QUFFNUYsVUFBTSxNQUFNLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQztBQUM1RixVQUFNLE1BQU0sTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDO0FBQzVGLFVBQU0sTUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUM7QUFFNUYsV0FBTyxPQUFPLGNBQWMsS0FBSyxLQUFLLEtBQUssS0FBSyxLQUFLLEtBQUssS0FBSyxLQUFLLEdBQUc7QUFBQSxFQUN6RTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxXQUFXO0FBQ1QsV0FBTyxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FB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
