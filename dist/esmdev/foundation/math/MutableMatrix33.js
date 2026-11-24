// src/foundation/math/MutableMatrix33.ts
import { Logger } from "../misc/Logger.js";
import { MathUtil } from "./MathUtil.js";
import { Matrix33_ } from "./Matrix33.js";
var MutableMatrix33_ = class extends Matrix33_ {
  /**
   * Creates a new MutableMatrix33_ instance.
   * @param m - The typed array containing the matrix components
   * @param options - Configuration object containing the typed array constructor
   */
  constructor(m, options) {
    super(m, options);
  }
  /**
   * Sets the matrix element at position (0,0).
   * @param val - The value to set
   */
  set m00(val) {
    this._v[0] = val;
  }
  /**
   * Gets the matrix element at position (0,0).
   * @returns The value at position (0,0)
   */
  get m00() {
    return this._v[0];
  }
  /**
   * Sets the matrix element at position (1,0).
   * @param val - The value to set
   */
  set m10(val) {
    this._v[1] = val;
  }
  /**
   * Gets the matrix element at position (1,0).
   * @returns The value at position (1,0)
   */
  get m10() {
    return this._v[1];
  }
  /**
   * Sets the matrix element at position (2,0).
   * @param val - The value to set
   */
  set m20(val) {
    this._v[2] = val;
  }
  /**
   * Gets the matrix element at position (2,0).
   * @returns The value at position (2,0)
   */
  get m20() {
    return this._v[2];
  }
  /**
   * Sets the matrix element at position (0,1).
   * @param val - The value to set
   */
  set m01(val) {
    this._v[3] = val;
  }
  /**
   * Gets the matrix element at position (0,1).
   * @returns The value at position (0,1)
   */
  get m01() {
    return this._v[3];
  }
  /**
   * Sets the matrix element at position (1,1).
   * @param val - The value to set
   */
  set m11(val) {
    this._v[4] = val;
  }
  /**
   * Gets the matrix element at position (1,1).
   * @returns The value at position (1,1)
   */
  get m11() {
    return this._v[4];
  }
  /**
   * Sets the matrix element at position (2,1).
   * @param val - The value to set
   */
  set m21(val) {
    this._v[5] = val;
  }
  /**
   * Gets the matrix element at position (2,1).
   * @returns The value at position (2,1)
   */
  get m21() {
    return this._v[5];
  }
  /**
   * Sets the matrix element at position (0,2).
   * @param val - The value to set
   */
  set m02(val) {
    this._v[6] = val;
  }
  /**
   * Gets the matrix element at position (0,2).
   * @returns The value at position (0,2)
   */
  get m02() {
    return this._v[6];
  }
  /**
   * Sets the matrix element at position (1,2).
   * @param val - The value to set
   */
  set m12(val) {
    this._v[7] = val;
  }
  /**
   * Gets the matrix element at position (1,2).
   * @returns The value at position (1,2)
   */
  get m12() {
    return this._v[7];
  }
  /**
   * Sets the matrix element at position (2,2).
   * @param val - The value to set
   */
  set m22(val) {
    this._v[8] = val;
  }
  /**
   * Gets the matrix element at position (2,2).
   * @returns The value at position (2,2)
   */
  get m22() {
    return this._v[8];
  }
  /**
   * Gets the class name for debugging purposes.
   * @returns The string 'MutableMatrix33'
   */
  get className() {
    return "MutableMatrix33";
  }
  /**
   * Creates a copy of this matrix.
   * @returns A new MutableMatrix33 instance with the same values
   */
  clone() {
    const result = super.clone();
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
  setAt(row_i, column_i, value) {
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
  setComponents(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
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
  copyComponents(mat) {
    this._v[0] = mat.m00;
    this._v[3] = mat.m01;
    this._v[6] = mat.m02;
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
  zero() {
    return this.setComponents(0, 0, 0, 0, 0, 0, 0, 0, 0);
  }
  /**
   * Sets this matrix to the identity matrix.
   * @returns This matrix instance for method chaining
   */
  identity() {
    return this.setComponents(1, 0, 0, 0, 1, 0, 0, 0, 1);
  }
  /**
   * Swaps two elements in the internal array.
   * @param l - Index of the first element
   * @param r - Index of the second element
   * @private
   */
  _swap(l, r) {
    const temp = this._v[l];
    this._v[l] = this._v[r];
    this._v[r] = temp;
  }
  /**
   * Transposes this matrix in place.
   * @returns This matrix instance for method chaining
   */
  transpose() {
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
  tryInvert() {
    const det = this.determinant();
    const rowNorm0 = Math.abs(this._v[0]) + Math.abs(this._v[3]) + Math.abs(this._v[6]);
    const rowNorm1 = Math.abs(this._v[1]) + Math.abs(this._v[4]) + Math.abs(this._v[7]);
    const rowNorm2 = Math.abs(this._v[2]) + Math.abs(this._v[5]) + Math.abs(this._v[8]);
    if (MathUtil.isSingularDet(
      det,
      rowNorm0 * rowNorm1 * rowNorm2,
      MathUtil.getSingularEpsilon(this._v.BYTES_PER_ELEMENT)
    )) {
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
  invert() {
    if (this.tryInvert()) {
      return this;
    }
    Logger.default.error("the matrix is singular and cannot be inverted. Returning an identity matrix instead.");
    return this.identity();
  }
  /**
   * Sets this matrix to a rotation matrix around the X-axis.
   * @param radian - The rotation angle in radians
   * @returns This matrix instance for method chaining
   */
  rotateX(radian) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this.setComponents(1, 0, 0, 0, cos, -sin, 0, sin, cos);
  }
  /**
   * Sets this matrix to a rotation matrix around the Y-axis.
   * @param radian - The rotation angle in radians
   * @returns This matrix instance for method chaining
   */
  rotateY(radian) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this.setComponents(cos, 0, sin, 0, 1, 0, -sin, 0, cos);
  }
  /**
   * Sets this matrix to a rotation matrix around the Z-axis.
   * @param radian - The rotation angle in radians
   * @returns This matrix instance for method chaining
   */
  rotateZ(radian) {
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
  rotateXYZ(x, y, z) {
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
    return this.setComponents(m00, m01, m02, m10, m11, m12, m20, m21, m22);
  }
  /**
   * Sets this matrix to a rotation matrix from a vector containing rotation angles.
   * @param vec - A vector containing rotation angles for X, Y, and Z axes in radians
   * @returns This matrix instance for method chaining
   */
  rotate(vec) {
    return this.rotateXYZ(vec._v[0], vec._v[1], vec._v[2]);
  }
  /**
   * Sets this matrix to a scaling matrix.
   * @param vec - A vector containing scale factors for X, Y, and Z axes
   * @returns This matrix instance for method chaining
   */
  scale(vec) {
    return this.setComponents(vec._v[0], 0, 0, 0, vec._v[1], 0, 0, 0, vec._v[2]);
  }
  /**
   * Multiplies this matrix by a scale matrix, applying scaling to the existing transformation.
   * Each column of the matrix is scaled by the corresponding component of the vector.
   * @param vec - A vector containing scale factors for X, Y, and Z axes
   * @returns This matrix instance for method chaining
   */
  multiplyScale(vec) {
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
  multiply(mat) {
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
  multiplyByLeft(mat) {
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
};
var MutableMatrix33 = class extends MutableMatrix33_ {
  /**
   * Creates a new MutableMatrix33 instance.
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
    return super._identity(Float32Array);
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
var MutableMatrix33D = class extends MutableMatrix33_ {
  /**
   * Creates a new MutableMatrix33D instance.
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
  MutableMatrix33,
  MutableMatrix33D,
  MutableMatrix33 as MutableMatrix33F,
  MutableMatrix33_
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9NdXRhYmxlTWF0cml4MzMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgQXJyYXk5LCBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3RvciwgSW5kZXgsIFR5cGVkQXJyYXkgfSBmcm9tICcuLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuLi9taXNjL0xvZ2dlcic7XG5pbXBvcnQgdHlwZSB7IElNYXRyaXgzMywgSU1hdHJpeDQ0LCBJTXV0YWJsZU1hdHJpeCwgSU11dGFibGVNYXRyaXgzMyB9IGZyb20gJy4vSU1hdHJpeCc7XG5pbXBvcnQgdHlwZSB7IElRdWF0ZXJuaW9uIH0gZnJvbSAnLi9JUXVhdGVybmlvbic7XG5pbXBvcnQgdHlwZSB7IElWZWN0b3IzIH0gZnJvbSAnLi9JVmVjdG9yJztcbmltcG9ydCB7IE1hdGhVdGlsIH0gZnJvbSAnLi9NYXRoVXRpbCc7XG5pbXBvcnQgeyBNYXRyaXgzM18gfSBmcm9tICcuL01hdHJpeDMzJztcblxuLyoqXG4gKiBBIG11dGFibGUgM3gzIG1hdHJpeCBjbGFzcyB0aGF0IGV4dGVuZHMgTWF0cml4MzMgYW5kIHByb3ZpZGVzIG11dGF0aW5nIG9wZXJhdGlvbnMuXG4gKiBUaGlzIGNsYXNzIHN0b3JlcyBtYXRyaXggZGF0YSBpbiBjb2x1bW4tbWFqb3Igb3JkZXIgYXMgYSBGbG9hdDMyQXJyYXkuXG4gKiBBbGwgdHJhbnNmb3JtYXRpb24gbWV0aG9kcyBtb2RpZnkgdGhlIG1hdHJpeCBpbiBwbGFjZSBhbmQgcmV0dXJuIHRoZSBzYW1lIGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmcuXG4gKlxuICogTWF0cml4IGxheW91dCBpbiBtZW1vcnkgKGNvbHVtbi1tYWpvciBvcmRlcik6XG4gKiBgYGBcbiAqIFttMDAsIG0xMCwgbTIwLCBtMDEsIG0xMSwgbTIxLCBtMDIsIG0xMiwgbTIyXVxuICogIFswXSAgWzFdICBbMl0gIFszXSAgWzRdICBbNV0gIFs2XSAgWzddICBbOF1cbiAqIGBgYFxuICpcbiAqIFdoaWNoIHJlcHJlc2VudHMgdGhlIG1hdHJpeDpcbiAqIGBgYFxuICogfCBtMDAgIG0wMSAgbTAyIHxcbiAqIHwgbTEwICBtMTEgIG0xMiB8XG4gKiB8IG0yMCAgbTIxICBtMjIgfFxuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBNdXRhYmxlTWF0cml4MzNfPFQgZXh0ZW5kcyBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcj5cbiAgZXh0ZW5kcyBNYXRyaXgzM188VD5cbiAgaW1wbGVtZW50cyBJTXV0YWJsZU1hdHJpeCwgSU11dGFibGVNYXRyaXgzM1xue1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNdXRhYmxlTWF0cml4MzNfIGluc3RhbmNlLlxuICAgKiBAcGFyYW0gbSAtIFRoZSB0eXBlZCBhcnJheSBjb250YWluaW5nIHRoZSBtYXRyaXggY29tcG9uZW50c1xuICAgKiBAcGFyYW0gb3B0aW9ucyAtIENvbmZpZ3VyYXRpb24gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9yXG4gICAqL1xuICBjb25zdHJ1Y3RvcihtOiBUeXBlZEFycmF5LCBvcHRpb25zOiB7IHR5cGU6IFQgfSkge1xuICAgIHN1cGVyKG0sIG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHBvc2l0aW9uICgwLDApLlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIHZhbHVlIHRvIHNldFxuICAgKi9cbiAgcHVibGljIHNldCBtMDAodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl92WzBdID0gdmFsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHBvc2l0aW9uICgwLDApLlxuICAgKiBAcmV0dXJucyBUaGUgdmFsdWUgYXQgcG9zaXRpb24gKDAsMClcbiAgICovXG4gIHB1YmxpYyBnZXQgbTAwKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMF07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbWF0cml4IGVsZW1lbnQgYXQgcG9zaXRpb24gKDEsMCkuXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgdmFsdWUgdG8gc2V0XG4gICAqL1xuICBwdWJsaWMgc2V0IG0xMCh2YWw6IG51bWJlcikge1xuICAgIHRoaXMuX3ZbMV0gPSB2YWw7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF0cml4IGVsZW1lbnQgYXQgcG9zaXRpb24gKDEsMCkuXG4gICAqIEByZXR1cm5zIFRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMSwwKVxuICAgKi9cbiAgcHVibGljIGdldCBtMTAoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdlsxXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCBwb3NpdGlvbiAoMiwwKS5cbiAgICogQHBhcmFtIHZhbCAtIFRoZSB2YWx1ZSB0byBzZXRcbiAgICovXG4gIHB1YmxpYyBzZXQgbTIwKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fdlsyXSA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCBwb3NpdGlvbiAoMiwwKS5cbiAgICogQHJldHVybnMgVGhlIHZhbHVlIGF0IHBvc2l0aW9uICgyLDApXG4gICAqL1xuICBwdWJsaWMgZ2V0IG0yMCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92WzJdO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHBvc2l0aW9uICgwLDEpLlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIHZhbHVlIHRvIHNldFxuICAgKi9cbiAgcHVibGljIHNldCBtMDEodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl92WzNdID0gdmFsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHBvc2l0aW9uICgwLDEpLlxuICAgKiBAcmV0dXJucyBUaGUgdmFsdWUgYXQgcG9zaXRpb24gKDAsMSlcbiAgICovXG4gIHB1YmxpYyBnZXQgbTAxKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbM107XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbWF0cml4IGVsZW1lbnQgYXQgcG9zaXRpb24gKDEsMSkuXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgdmFsdWUgdG8gc2V0XG4gICAqL1xuICBwdWJsaWMgc2V0IG0xMSh2YWw6IG51bWJlcikge1xuICAgIHRoaXMuX3ZbNF0gPSB2YWw7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF0cml4IGVsZW1lbnQgYXQgcG9zaXRpb24gKDEsMSkuXG4gICAqIEByZXR1cm5zIFRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMSwxKVxuICAgKi9cbiAgcHVibGljIGdldCBtMTEoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdls0XTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCBwb3NpdGlvbiAoMiwxKS5cbiAgICogQHBhcmFtIHZhbCAtIFRoZSB2YWx1ZSB0byBzZXRcbiAgICovXG4gIHB1YmxpYyBzZXQgbTIxKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fdls1XSA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCBwb3NpdGlvbiAoMiwxKS5cbiAgICogQHJldHVybnMgVGhlIHZhbHVlIGF0IHBvc2l0aW9uICgyLDEpXG4gICAqL1xuICBwdWJsaWMgZ2V0IG0yMSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92WzVdO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHBvc2l0aW9uICgwLDIpLlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIHZhbHVlIHRvIHNldFxuICAgKi9cbiAgcHVibGljIHNldCBtMDIodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl92WzZdID0gdmFsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHBvc2l0aW9uICgwLDIpLlxuICAgKiBAcmV0dXJucyBUaGUgdmFsdWUgYXQgcG9zaXRpb24gKDAsMilcbiAgICovXG4gIHB1YmxpYyBnZXQgbTAyKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbNl07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbWF0cml4IGVsZW1lbnQgYXQgcG9zaXRpb24gKDEsMikuXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgdmFsdWUgdG8gc2V0XG4gICAqL1xuICBwdWJsaWMgc2V0IG0xMih2YWw6IG51bWJlcikge1xuICAgIHRoaXMuX3ZbN10gPSB2YWw7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF0cml4IGVsZW1lbnQgYXQgcG9zaXRpb24gKDEsMikuXG4gICAqIEByZXR1cm5zIFRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMSwyKVxuICAgKi9cbiAgcHVibGljIGdldCBtMTIoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdls3XTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCBwb3NpdGlvbiAoMiwyKS5cbiAgICogQHBhcmFtIHZhbCAtIFRoZSB2YWx1ZSB0byBzZXRcbiAgICovXG4gIHB1YmxpYyBzZXQgbTIyKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fdls4XSA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCBwb3NpdGlvbiAoMiwyKS5cbiAgICogQHJldHVybnMgVGhlIHZhbHVlIGF0IHBvc2l0aW9uICgyLDIpXG4gICAqL1xuICBwdWJsaWMgZ2V0IG0yMigpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92WzhdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNsYXNzIG5hbWUgZm9yIGRlYnVnZ2luZyBwdXJwb3Nlcy5cbiAgICogQHJldHVybnMgVGhlIHN0cmluZyAnTXV0YWJsZU1hdHJpeDMzJ1xuICAgKi9cbiAgZ2V0IGNsYXNzTmFtZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiAnTXV0YWJsZU1hdHJpeDMzJztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgY29weSBvZiB0aGlzIG1hdHJpeC5cbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZU1hdHJpeDMzIGluc3RhbmNlIHdpdGggdGhlIHNhbWUgdmFsdWVzXG4gICAqL1xuICBjbG9uZSgpOiBNdXRhYmxlTWF0cml4MzMge1xuICAgIGNvbnN0IHJlc3VsdCA9IHN1cGVyLmNsb25lKCkgYXMgTXV0YWJsZU1hdHJpeDMzO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcmF3IEZsb2F0MzJBcnJheSBjb250YWluaW5nIHRoZSBtYXRyaXggZGF0YS5cbiAgICogQHJldHVybnMgVGhlIHVuZGVybHlpbmcgRmxvYXQzMkFycmF5IGluIGNvbHVtbi1tYWpvciBvcmRlclxuICAgKi9cbiAgcmF3KCkge1xuICAgIHJldHVybiB0aGlzLl92O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSB2YWx1ZSBhdCB0aGUgc3BlY2lmaWVkIHJvdyBhbmQgY29sdW1uIHBvc2l0aW9uLlxuICAgKiBAcGFyYW0gcm93X2kgLSBUaGUgcm93IGluZGV4ICgwLTIpXG4gICAqIEBwYXJhbSBjb2x1bW5faSAtIFRoZSBjb2x1bW4gaW5kZXggKDAtMilcbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIHZhbHVlIHRvIHNldFxuICAgKiBAcmV0dXJucyBUaGlzIG1hdHJpeCBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICBzZXRBdChyb3dfaTogbnVtYmVyLCBjb2x1bW5faTogbnVtYmVyLCB2YWx1ZTogbnVtYmVyKTogTXV0YWJsZU1hdHJpeDMzIHtcbiAgICB0aGlzLl92W3Jvd19pICsgY29sdW1uX2kgKiAzXSA9IHZhbHVlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYWxsIG1hdHJpeCBjb21wb25lbnRzIHVzaW5nIHJvdy1tYWpvciBvcmRlciBwYXJhbWV0ZXJzLlxuICAgKiBAcGFyYW0gbTAwIC0gRWxlbWVudCBhdCBwb3NpdGlvbiAoMCwwKVxuICAgKiBAcGFyYW0gbTAxIC0gRWxlbWVudCBhdCBwb3NpdGlvbiAoMCwxKVxuICAgKiBAcGFyYW0gbTAyIC0gRWxlbWVudCBhdCBwb3NpdGlvbiAoMCwyKVxuICAgKiBAcGFyYW0gbTEwIC0gRWxlbWVudCBhdCBwb3NpdGlvbiAoMSwwKVxuICAgKiBAcGFyYW0gbTExIC0gRWxlbWVudCBhdCBwb3NpdGlvbiAoMSwxKVxuICAgKiBAcGFyYW0gbTEyIC0gRWxlbWVudCBhdCBwb3NpdGlvbiAoMSwyKVxuICAgKiBAcGFyYW0gbTIwIC0gRWxlbWVudCBhdCBwb3NpdGlvbiAoMiwwKVxuICAgKiBAcGFyYW0gbTIxIC0gRWxlbWVudCBhdCBwb3NpdGlvbiAoMiwxKVxuICAgKiBAcGFyYW0gbTIyIC0gRWxlbWVudCBhdCBwb3NpdGlvbiAoMiwyKVxuICAgKiBAcmV0dXJucyBUaGlzIG1hdHJpeCBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICBzZXRDb21wb25lbnRzKFxuICAgIG0wMDogbnVtYmVyLFxuICAgIG0wMTogbnVtYmVyLFxuICAgIG0wMjogbnVtYmVyLFxuICAgIG0xMDogbnVtYmVyLFxuICAgIG0xMTogbnVtYmVyLFxuICAgIG0xMjogbnVtYmVyLFxuICAgIG0yMDogbnVtYmVyLFxuICAgIG0yMTogbnVtYmVyLFxuICAgIG0yMjogbnVtYmVyXG4gICk6IE11dGFibGVNYXRyaXgzMyB7XG4gICAgdGhpcy5fdlswXSA9IG0wMDtcbiAgICB0aGlzLl92WzNdID0gbTAxO1xuICAgIHRoaXMuX3ZbNl0gPSBtMDI7XG4gICAgdGhpcy5fdlsxXSA9IG0xMDtcbiAgICB0aGlzLl92WzRdID0gbTExO1xuICAgIHRoaXMuX3ZbN10gPSBtMTI7XG4gICAgdGhpcy5fdlsyXSA9IG0yMDtcbiAgICB0aGlzLl92WzVdID0gbTIxO1xuICAgIHRoaXMuX3ZbOF0gPSBtMjI7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDb3BpZXMgY29tcG9uZW50cyBmcm9tIGFub3RoZXIgbWF0cml4ICgzeDMgb3IgNHg0KSBpbnRvIHRoaXMgbWF0cml4LlxuICAgKiBGb3IgNHg0IG1hdHJpY2VzLCBvbmx5IHRoZSB1cHBlci1sZWZ0IDN4MyBwb3J0aW9uIGlzIGNvcGllZC5cbiAgICogQHBhcmFtIG1hdCAtIFRoZSBzb3VyY2UgbWF0cml4IHRvIGNvcHkgZnJvbVxuICAgKiBAcmV0dXJucyBUaGlzIG1hdHJpeCBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICBjb3B5Q29tcG9uZW50cyhtYXQ6IElNYXRyaXgzMyB8IElNYXRyaXg0NCk6IE11dGFibGVNYXRyaXgzMyB7XG4gICAgdGhpcy5fdlswXSA9IG1hdC5tMDA7XG4gICAgdGhpcy5fdlszXSA9IG1hdC5tMDE7XG4gICAgdGhpcy5fdls2XSA9IG1hdC5tMDI7IC8vIG1hdC5tMDEgaXMgbWF0Ll92WzMgb3IgNF1cbiAgICB0aGlzLl92WzFdID0gbWF0Lm0xMDtcbiAgICB0aGlzLl92WzRdID0gbWF0Lm0xMTtcbiAgICB0aGlzLl92WzddID0gbWF0Lm0xMjtcbiAgICB0aGlzLl92WzJdID0gbWF0Lm0yMDtcbiAgICB0aGlzLl92WzVdID0gbWF0Lm0yMTtcbiAgICB0aGlzLl92WzhdID0gbWF0Lm0yMjtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhpcyBtYXRyaXggdG8gdGhlIHplcm8gbWF0cml4IChhbGwgZWxlbWVudHMgc2V0IHRvIDApLlxuICAgKiBAcmV0dXJucyBUaGlzIG1hdHJpeCBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICB6ZXJvKCk6IE11dGFibGVNYXRyaXgzMyB7XG4gICAgcmV0dXJuIHRoaXMuc2V0Q29tcG9uZW50cygwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoaXMgbWF0cml4IHRvIHRoZSBpZGVudGl0eSBtYXRyaXguXG4gICAqIEByZXR1cm5zIFRoaXMgbWF0cml4IGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIGlkZW50aXR5KCk6IE11dGFibGVNYXRyaXgzMyB7XG4gICAgcmV0dXJuIHRoaXMuc2V0Q29tcG9uZW50cygxLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAxKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTd2FwcyB0d28gZWxlbWVudHMgaW4gdGhlIGludGVybmFsIGFycmF5LlxuICAgKiBAcGFyYW0gbCAtIEluZGV4IG9mIHRoZSBmaXJzdCBlbGVtZW50XG4gICAqIEBwYXJhbSByIC0gSW5kZXggb2YgdGhlIHNlY29uZCBlbGVtZW50XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfc3dhcChsOiBJbmRleCwgcjogSW5kZXgpOiB2b2lkIHtcbiAgICBjb25zdCB0ZW1wID0gdGhpcy5fdltsXTtcbiAgICB0aGlzLl92W2xdID0gdGhpcy5fdltyXTtcbiAgICB0aGlzLl92W3JdID0gdGVtcDtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFuc3Bvc2VzIHRoaXMgbWF0cml4IGluIHBsYWNlLlxuICAgKiBAcmV0dXJucyBUaGlzIG1hdHJpeCBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICB0cmFuc3Bvc2UoKTogTXV0YWJsZU1hdHJpeDMzIHtcbiAgICB0aGlzLl9zd2FwKDEsIDMpO1xuICAgIHRoaXMuX3N3YXAoMiwgNik7XG4gICAgdGhpcy5fc3dhcCg1LCA4KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGVtcHRzIHRvIGludmVydCB0aGlzIG1hdHJpeCBpbiBwbGFjZS5cbiAgICpcbiAgICogVGhlIG1hdHJpeCBpcyBsZWZ0IHVuY2hhbmdlZCB3aGVuIGl0IGlzIG51bWVyaWNhbGx5IHNpbmd1bGFyLCB3aGljaFxuICAgKiBsZXRzIGNhbGxlcnMga2VlcCB0aGUgcHJldmlvdXMgdmFsaWQgdmFsdWUuXG4gICAqXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIGludmVyc2lvbiBzdWNjZWVkZWQsIGZhbHNlIGlmIHRoZSBtYXRyaXggaXMgc2luZ3VsYXJcbiAgICovXG4gIHRyeUludmVydCgpOiBib29sZWFuIHtcbiAgICBjb25zdCBkZXQgPSB0aGlzLmRldGVybWluYW50KCk7XG4gICAgY29uc3Qgcm93Tm9ybTAgPSBNYXRoLmFicyh0aGlzLl92WzBdKSArIE1hdGguYWJzKHRoaXMuX3ZbM10pICsgTWF0aC5hYnModGhpcy5fdls2XSk7XG4gICAgY29uc3Qgcm93Tm9ybTEgPSBNYXRoLmFicyh0aGlzLl92WzFdKSArIE1hdGguYWJzKHRoaXMuX3ZbNF0pICsgTWF0aC5hYnModGhpcy5fdls3XSk7XG4gICAgY29uc3Qgcm93Tm9ybTIgPSBNYXRoLmFicyh0aGlzLl92WzJdKSArIE1hdGguYWJzKHRoaXMuX3ZbNV0pICsgTWF0aC5hYnModGhpcy5fdls4XSk7XG4gICAgaWYgKFxuICAgICAgTWF0aFV0aWwuaXNTaW5ndWxhckRldChcbiAgICAgICAgZGV0LFxuICAgICAgICByb3dOb3JtMCAqIHJvd05vcm0xICogcm93Tm9ybTIsXG4gICAgICAgIE1hdGhVdGlsLmdldFNpbmd1bGFyRXBzaWxvbih0aGlzLl92LkJZVEVTX1BFUl9FTEVNRU5UKVxuICAgICAgKVxuICAgICkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IGludkRldCA9IDEgLyBkZXQ7XG4gICAgY29uc3QgbTAwID0gKHRoaXMuX3ZbNF0gKiB0aGlzLl92WzhdIC0gdGhpcy5fdls3XSAqIHRoaXMuX3ZbNV0pICogaW52RGV0O1xuICAgIGNvbnN0IG0wMSA9ICh0aGlzLl92WzZdICogdGhpcy5fdls1XSAtIHRoaXMuX3ZbM10gKiB0aGlzLl92WzhdKSAqIGludkRldDtcbiAgICBjb25zdCBtMDIgPSAodGhpcy5fdlszXSAqIHRoaXMuX3ZbN10gLSB0aGlzLl92WzZdICogdGhpcy5fdls0XSkgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTEwID0gKHRoaXMuX3ZbN10gKiB0aGlzLl92WzJdIC0gdGhpcy5fdlsxXSAqIHRoaXMuX3ZbOF0pICogaW52RGV0O1xuICAgIGNvbnN0IG0xMSA9ICh0aGlzLl92WzBdICogdGhpcy5fdls4XSAtIHRoaXMuX3ZbNl0gKiB0aGlzLl92WzJdKSAqIGludkRldDtcbiAgICBjb25zdCBtMTIgPSAodGhpcy5fdls2XSAqIHRoaXMuX3ZbMV0gLSB0aGlzLl92WzBdICogdGhpcy5fdls3XSkgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTIwID0gKHRoaXMuX3ZbMV0gKiB0aGlzLl92WzVdIC0gdGhpcy5fdls0XSAqIHRoaXMuX3ZbMl0pICogaW52RGV0O1xuICAgIGNvbnN0IG0yMSA9ICh0aGlzLl92WzNdICogdGhpcy5fdlsyXSAtIHRoaXMuX3ZbMF0gKiB0aGlzLl92WzVdKSAqIGludkRldDtcbiAgICBjb25zdCBtMjIgPSAodGhpcy5fdlswXSAqIHRoaXMuX3ZbNF0gLSB0aGlzLl92WzNdICogdGhpcy5fdlsxXSkgKiBpbnZEZXQ7XG5cbiAgICB0aGlzLnNldENvbXBvbmVudHMobTAwLCBtMDEsIG0wMiwgbTEwLCBtMTEsIG0xMiwgbTIwLCBtMjEsIG0yMik7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogSW52ZXJ0cyB0aGlzIG1hdHJpeCBpbiBwbGFjZSB1c2luZyB0aGUgZGV0ZXJtaW5hbnQgbWV0aG9kLlxuICAgKlxuICAgKiBJZiB0aGUgbWF0cml4IGlzIG51bWVyaWNhbGx5IHNpbmd1bGFyLCBpdCBpcyBzZXQgdG8gdGhlIGlkZW50aXR5IG1hdHJpeFxuICAgKiBpbnN0ZWFkIG9mIGJlaW5nIGZpbGxlZCB3aXRoIGBJbmZpbml0eWAvYE5hTmAuXG4gICAqIFVzZSB7QGxpbmsgTXV0YWJsZU1hdHJpeDMzLnRyeUludmVydH0gd2hlbiB0aGUgY2FsbGVyIG5lZWRzIHRvIGRldGVjdCB0aGUgZmFpbHVyZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhpcyBtYXRyaXggaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgaW52ZXJ0KCk6IE11dGFibGVNYXRyaXgzMyB7XG4gICAgaWYgKHRoaXMudHJ5SW52ZXJ0KCkpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCd0aGUgbWF0cml4IGlzIHNpbmd1bGFyIGFuZCBjYW5ub3QgYmUgaW52ZXJ0ZWQuIFJldHVybmluZyBhbiBpZGVudGl0eSBtYXRyaXggaW5zdGVhZC4nKTtcbiAgICByZXR1cm4gdGhpcy5pZGVudGl0eSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhpcyBtYXRyaXggdG8gYSByb3RhdGlvbiBtYXRyaXggYXJvdW5kIHRoZSBYLWF4aXMuXG4gICAqIEBwYXJhbSByYWRpYW4gLSBUaGUgcm90YXRpb24gYW5nbGUgaW4gcmFkaWFuc1xuICAgKiBAcmV0dXJucyBUaGlzIG1hdHJpeCBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICByb3RhdGVYKHJhZGlhbjogbnVtYmVyKTogTXV0YWJsZU1hdHJpeDMzIHtcbiAgICBjb25zdCBjb3MgPSBNYXRoLmNvcyhyYWRpYW4pO1xuICAgIGNvbnN0IHNpbiA9IE1hdGguc2luKHJhZGlhbik7XG4gICAgcmV0dXJuIHRoaXMuc2V0Q29tcG9uZW50cygxLCAwLCAwLCAwLCBjb3MsIC1zaW4sIDAsIHNpbiwgY29zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoaXMgbWF0cml4IHRvIGEgcm90YXRpb24gbWF0cml4IGFyb3VuZCB0aGUgWS1heGlzLlxuICAgKiBAcGFyYW0gcmFkaWFuIC0gVGhlIHJvdGF0aW9uIGFuZ2xlIGluIHJhZGlhbnNcbiAgICogQHJldHVybnMgVGhpcyBtYXRyaXggaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgcm90YXRlWShyYWRpYW46IG51bWJlcik6IE11dGFibGVNYXRyaXgzMyB7XG4gICAgY29uc3QgY29zID0gTWF0aC5jb3MocmFkaWFuKTtcbiAgICBjb25zdCBzaW4gPSBNYXRoLnNpbihyYWRpYW4pO1xuICAgIHJldHVybiB0aGlzLnNldENvbXBvbmVudHMoY29zLCAwLCBzaW4sIDAsIDEsIDAsIC1zaW4sIDAsIGNvcyk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGlzIG1hdHJpeCB0byBhIHJvdGF0aW9uIG1hdHJpeCBhcm91bmQgdGhlIFotYXhpcy5cbiAgICogQHBhcmFtIHJhZGlhbiAtIFRoZSByb3RhdGlvbiBhbmdsZSBpbiByYWRpYW5zXG4gICAqIEByZXR1cm5zIFRoaXMgbWF0cml4IGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIHJvdGF0ZVoocmFkaWFuOiBudW1iZXIpOiBNdXRhYmxlTWF0cml4MzMge1xuICAgIGNvbnN0IGNvcyA9IE1hdGguY29zKHJhZGlhbik7XG4gICAgY29uc3Qgc2luID0gTWF0aC5zaW4ocmFkaWFuKTtcbiAgICByZXR1cm4gdGhpcy5zZXRDb21wb25lbnRzKGNvcywgLXNpbiwgMCwgc2luLCBjb3MsIDAsIDAsIDAsIDEpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhpcyBtYXRyaXggdG8gYSByb3RhdGlvbiBtYXRyaXggZm9yIGNvbWJpbmVkIFgsIFksIGFuZCBaIGF4aXMgcm90YXRpb25zLlxuICAgKiBSb3RhdGlvbnMgYXJlIGFwcGxpZWQgaW4gdGhlIG9yZGVyOiBaICogWSAqIFggKHdoaWNoIG1lYW5zIFggaXMgYXBwbGllZCBmaXJzdCwgdGhlbiBZLCB0aGVuIFopLlxuICAgKiBAcGFyYW0geCAtIFJvdGF0aW9uIGFuZ2xlIGFyb3VuZCBYLWF4aXMgaW4gcmFkaWFuc1xuICAgKiBAcGFyYW0geSAtIFJvdGF0aW9uIGFuZ2xlIGFyb3VuZCBZLWF4aXMgaW4gcmFkaWFuc1xuICAgKiBAcGFyYW0geiAtIFJvdGF0aW9uIGFuZ2xlIGFyb3VuZCBaLWF4aXMgaW4gcmFkaWFuc1xuICAgKiBAcmV0dXJucyBUaGlzIG1hdHJpeCBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICByb3RhdGVYWVooeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlcik6IE11dGFibGVNYXRyaXgzMyB7XG4gICAgY29uc3QgY29zWCA9IE1hdGguY29zKHgpO1xuICAgIGNvbnN0IHNpblggPSBNYXRoLnNpbih4KTtcbiAgICBjb25zdCBjb3NZID0gTWF0aC5jb3MoeSk7XG4gICAgY29uc3Qgc2luWSA9IE1hdGguc2luKHkpO1xuICAgIGNvbnN0IGNvc1ogPSBNYXRoLmNvcyh6KTtcbiAgICBjb25zdCBzaW5aID0gTWF0aC5zaW4oeik7XG5cbiAgICAvLyBjb25zdCB4MDAgPSAxO1xuICAgIC8vIGNvbnN0IHgwMSA9IDA7XG4gICAgLy8gY29uc3QgeDAyID0gMDtcbiAgICAvLyBjb25zdCB4MTAgPSAwO1xuICAgIGNvbnN0IHgxMSA9IGNvc1g7XG4gICAgY29uc3QgeDEyID0gLXNpblg7XG4gICAgLy8gY29uc3QgeDIwID0gMDtcbiAgICBjb25zdCB4MjEgPSBzaW5YO1xuICAgIGNvbnN0IHgyMiA9IGNvc1g7XG5cbiAgICBjb25zdCB5MDAgPSBjb3NZO1xuICAgIC8vIGNvbnN0IHkwMSA9IDA7XG4gICAgY29uc3QgeTAyID0gc2luWTtcbiAgICAvLyBjb25zdCB5MTAgPSAwO1xuICAgIC8vIGNvbnN0IHkxMSA9IDE7XG4gICAgLy8gY29uc3QgeTEyID0gMDtcbiAgICBjb25zdCB5MjAgPSAtc2luWTtcbiAgICAvLyBjb25zdCB5MjEgPSAwO1xuICAgIGNvbnN0IHkyMiA9IGNvc1k7XG5cbiAgICBjb25zdCB6MDAgPSBjb3NaO1xuICAgIGNvbnN0IHowMSA9IC1zaW5aO1xuICAgIC8vIGNvbnN0IHowMiA9IDA7XG4gICAgY29uc3QgejEwID0gc2luWjtcbiAgICBjb25zdCB6MTEgPSBjb3NaO1xuICAgIC8vIGNvbnN0IHoxMiA9IDA7XG4gICAgLy8gY29uc3QgejIwID0gMDtcbiAgICAvLyBjb25zdCB6MjEgPSAwO1xuICAgIC8vIGNvbnN0IHoyMiA9IDE7XG5cbiAgICAvLyBjYWxjdWxhdGUgdGhpcy5tdWx0aXBseSh0aGlzLnJvdGF0ZVkoeSksIHRoaXMucm90YXRlWCh4KSlcbiAgICBjb25zdCB5eDAwID0geTAwO1xuICAgIGNvbnN0IHl4MDEgPSB5MDIgKiB4MjE7XG4gICAgY29uc3QgeXgwMiA9IHkwMiAqIHgyMjtcbiAgICAvL2NvbnN0IHl4MTAgPSAwO1xuICAgIGNvbnN0IHl4MTEgPSB4MTE7XG4gICAgY29uc3QgeXgxMiA9IHgxMjtcbiAgICBjb25zdCB5eDIwID0geTIwO1xuICAgIGNvbnN0IHl4MjEgPSB5MjIgKiB4MjE7XG4gICAgY29uc3QgeXgyMiA9IHkyMiAqIHgyMjtcblxuICAgIC8vIGNhbGN1bGF0ZSB0aGlzLm11bHRpcGx5KHRoaXMucm90YXRlWih6KSwgdGhpcy5tdWx0aXBseSh0aGlzLnJvdGF0ZVkoeSksIHRoaXMucm90YXRlWCh4KSkpXG4gICAgY29uc3QgbTAwID0gejAwICogeXgwMDtcbiAgICBjb25zdCBtMDEgPSB6MDAgKiB5eDAxICsgejAxICogeXgxMTtcbiAgICBjb25zdCBtMDIgPSB6MDAgKiB5eDAyICsgejAxICogeXgxMjtcbiAgICBjb25zdCBtMTAgPSB6MTAgKiB5eDAwO1xuICAgIGNvbnN0IG0xMSA9IHoxMCAqIHl4MDEgKyB6MTEgKiB5eDExO1xuICAgIGNvbnN0IG0xMiA9IHoxMCAqIHl4MDIgKyB6MTEgKiB5eDEyO1xuICAgIGNvbnN0IG0yMCA9IHl4MjA7XG4gICAgY29uc3QgbTIxID0geXgyMTtcbiAgICBjb25zdCBtMjIgPSB5eDIyO1xuXG4gICAgcmV0dXJuIHRoaXMuc2V0Q29tcG9uZW50cyhtMDAsIG0wMSwgbTAyLCBtMTAsIG0xMSwgbTEyLCBtMjAsIG0yMSwgbTIyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoaXMgbWF0cml4IHRvIGEgcm90YXRpb24gbWF0cml4IGZyb20gYSB2ZWN0b3IgY29udGFpbmluZyByb3RhdGlvbiBhbmdsZXMuXG4gICAqIEBwYXJhbSB2ZWMgLSBBIHZlY3RvciBjb250YWluaW5nIHJvdGF0aW9uIGFuZ2xlcyBmb3IgWCwgWSwgYW5kIFogYXhlcyBpbiByYWRpYW5zXG4gICAqIEByZXR1cm5zIFRoaXMgbWF0cml4IGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIHJvdGF0ZSh2ZWM6IElWZWN0b3IzKTogTXV0YWJsZU1hdHJpeDMzIHtcbiAgICByZXR1cm4gdGhpcy5yb3RhdGVYWVoodmVjLl92WzBdLCB2ZWMuX3ZbMV0sIHZlYy5fdlsyXSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGlzIG1hdHJpeCB0byBhIHNjYWxpbmcgbWF0cml4LlxuICAgKiBAcGFyYW0gdmVjIC0gQSB2ZWN0b3IgY29udGFpbmluZyBzY2FsZSBmYWN0b3JzIGZvciBYLCBZLCBhbmQgWiBheGVzXG4gICAqIEByZXR1cm5zIFRoaXMgbWF0cml4IGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIHNjYWxlKHZlYzogSVZlY3RvcjMpOiBNdXRhYmxlTWF0cml4MzMge1xuICAgIHJldHVybiB0aGlzLnNldENvbXBvbmVudHModmVjLl92WzBdLCAwLCAwLCAwLCB2ZWMuX3ZbMV0sIDAsIDAsIDAsIHZlYy5fdlsyXSk7XG4gIH1cblxuICAvKipcbiAgICogTXVsdGlwbGllcyB0aGlzIG1hdHJpeCBieSBhIHNjYWxlIG1hdHJpeCwgYXBwbHlpbmcgc2NhbGluZyB0byB0aGUgZXhpc3RpbmcgdHJhbnNmb3JtYXRpb24uXG4gICAqIEVhY2ggY29sdW1uIG9mIHRoZSBtYXRyaXggaXMgc2NhbGVkIGJ5IHRoZSBjb3JyZXNwb25kaW5nIGNvbXBvbmVudCBvZiB0aGUgdmVjdG9yLlxuICAgKiBAcGFyYW0gdmVjIC0gQSB2ZWN0b3IgY29udGFpbmluZyBzY2FsZSBmYWN0b3JzIGZvciBYLCBZLCBhbmQgWiBheGVzXG4gICAqIEByZXR1cm5zIFRoaXMgbWF0cml4IGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIG11bHRpcGx5U2NhbGUodmVjOiBJVmVjdG9yMyk6IE11dGFibGVNYXRyaXgzMyB7XG4gICAgdGhpcy5fdlswXSAqPSB2ZWMuX3ZbMF07XG4gICAgdGhpcy5fdlszXSAqPSB2ZWMuX3ZbMF07XG4gICAgdGhpcy5fdls2XSAqPSB2ZWMuX3ZbMF07XG5cbiAgICB0aGlzLl92WzFdICo9IHZlYy5fdlsxXTtcbiAgICB0aGlzLl92WzRdICo9IHZlYy5fdlsxXTtcbiAgICB0aGlzLl92WzddICo9IHZlYy5fdlsxXTtcblxuICAgIHRoaXMuX3ZbMl0gKj0gdmVjLl92WzJdO1xuICAgIHRoaXMuX3ZbNV0gKj0gdmVjLl92WzJdO1xuICAgIHRoaXMuX3ZbOF0gKj0gdmVjLl92WzJdO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogTXVsdGlwbGllcyB0aGlzIG1hdHJpeCBieSBhbm90aGVyIG1hdHJpeCBmcm9tIHRoZSByaWdodCBzaWRlICh0aGlzID0gdGhpcyAqIG1hdCkuXG4gICAqIElmIHRoZSBpbnB1dCBtYXRyaXggaXMgYW4gaWRlbnRpdHkgbWF0cml4LCBubyBvcGVyYXRpb24gaXMgcGVyZm9ybWVkIGZvciBvcHRpbWl6YXRpb24uXG4gICAqIEBwYXJhbSBtYXQgLSBUaGUgbWF0cml4IHRvIG11bHRpcGx5IHdpdGggZnJvbSB0aGUgcmlnaHRcbiAgICogQHJldHVybnMgVGhpcyBtYXRyaXggaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgbXVsdGlwbHkobWF0OiBJTWF0cml4MzMpOiBNdXRhYmxlTWF0cml4MzMge1xuICAgIGlmIChtYXQuaXNJZGVudGl0eU1hdHJpeENsYXNzKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjb25zdCBtMDAgPSB0aGlzLl92WzBdICogbWF0Ll92WzBdICsgdGhpcy5fdlszXSAqIG1hdC5fdlsxXSArIHRoaXMuX3ZbNl0gKiBtYXQuX3ZbMl07XG4gICAgY29uc3QgbTAxID0gdGhpcy5fdlswXSAqIG1hdC5fdlszXSArIHRoaXMuX3ZbM10gKiBtYXQuX3ZbNF0gKyB0aGlzLl92WzZdICogbWF0Ll92WzVdO1xuICAgIGNvbnN0IG0wMiA9IHRoaXMuX3ZbMF0gKiBtYXQuX3ZbNl0gKyB0aGlzLl92WzNdICogbWF0Ll92WzddICsgdGhpcy5fdls2XSAqIG1hdC5fdls4XTtcblxuICAgIGNvbnN0IG0xMCA9IHRoaXMuX3ZbMV0gKiBtYXQuX3ZbMF0gKyB0aGlzLl92WzRdICogbWF0Ll92WzFdICsgdGhpcy5fdls3XSAqIG1hdC5fdlsyXTtcbiAgICBjb25zdCBtMTEgPSB0aGlzLl92WzFdICogbWF0Ll92WzNdICsgdGhpcy5fdls0XSAqIG1hdC5fdls0XSArIHRoaXMuX3ZbN10gKiBtYXQuX3ZbNV07XG4gICAgY29uc3QgbTEyID0gdGhpcy5fdlsxXSAqIG1hdC5fdls2XSArIHRoaXMuX3ZbNF0gKiBtYXQuX3ZbN10gKyB0aGlzLl92WzddICogbWF0Ll92WzhdO1xuXG4gICAgY29uc3QgbTIwID0gdGhpcy5fdlsyXSAqIG1hdC5fdlswXSArIHRoaXMuX3ZbNV0gKiBtYXQuX3ZbMV0gKyB0aGlzLl92WzhdICogbWF0Ll92WzJdO1xuICAgIGNvbnN0IG0yMSA9IHRoaXMuX3ZbMl0gKiBtYXQuX3ZbM10gKyB0aGlzLl92WzVdICogbWF0Ll92WzRdICsgdGhpcy5fdls4XSAqIG1hdC5fdls1XTtcbiAgICBjb25zdCBtMjIgPSB0aGlzLl92WzJdICogbWF0Ll92WzZdICsgdGhpcy5fdls1XSAqIG1hdC5fdls3XSArIHRoaXMuX3ZbOF0gKiBtYXQuX3ZbOF07XG5cbiAgICByZXR1cm4gdGhpcy5zZXRDb21wb25lbnRzKG0wMCwgbTAxLCBtMDIsIG0xMCwgbTExLCBtMTIsIG0yMCwgbTIxLCBtMjIpO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgdGhpcyBtYXRyaXggYnkgYW5vdGhlciBtYXRyaXggZnJvbSB0aGUgbGVmdCBzaWRlICh0aGlzID0gbWF0ICogdGhpcykuXG4gICAqIElmIHRoZSBpbnB1dCBtYXRyaXggaXMgYW4gaWRlbnRpdHkgbWF0cml4LCBubyBvcGVyYXRpb24gaXMgcGVyZm9ybWVkIGZvciBvcHRpbWl6YXRpb24uXG4gICAqIEBwYXJhbSBtYXQgLSBUaGUgbWF0cml4IHRvIG11bHRpcGx5IHdpdGggZnJvbSB0aGUgbGVmdFxuICAgKiBAcmV0dXJucyBUaGlzIG1hdHJpeCBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICBtdWx0aXBseUJ5TGVmdChtYXQ6IElNYXRyaXgzMyk6IE11dGFibGVNYXRyaXgzMyB7XG4gICAgaWYgKG1hdC5pc0lkZW50aXR5TWF0cml4Q2xhc3MpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNvbnN0IG0wMCA9IG1hdC5fdlswXSAqIHRoaXMuX3ZbMF0gKyBtYXQuX3ZbM10gKiB0aGlzLl92WzFdICsgbWF0Ll92WzZdICogdGhpcy5fdlsyXTtcbiAgICBjb25zdCBtMDEgPSBtYXQuX3ZbMF0gKiB0aGlzLl92WzNdICsgbWF0Ll92WzNdICogdGhpcy5fdls0XSArIG1hdC5fdls2XSAqIHRoaXMuX3ZbNV07XG4gICAgY29uc3QgbTAyID0gbWF0Ll92WzBdICogdGhpcy5fdls2XSArIG1hdC5fdlszXSAqIHRoaXMuX3ZbN10gKyBtYXQuX3ZbNl0gKiB0aGlzLl92WzhdO1xuXG4gICAgY29uc3QgbTEwID0gbWF0Ll92WzFdICogdGhpcy5fdlswXSArIG1hdC5fdls0XSAqIHRoaXMuX3ZbMV0gKyBtYXQuX3ZbN10gKiB0aGlzLl92WzJdO1xuICAgIGNvbnN0IG0xMSA9IG1hdC5fdlsxXSAqIHRoaXMuX3ZbM10gKyBtYXQuX3ZbNF0gKiB0aGlzLl92WzRdICsgbWF0Ll92WzddICogdGhpcy5fdls1XTtcbiAgICBjb25zdCBtMTIgPSBtYXQuX3ZbMV0gKiB0aGlzLl92WzZdICsgbWF0Ll92WzRdICogdGhpcy5fdls3XSArIG1hdC5fdls3XSAqIHRoaXMuX3ZbOF07XG5cbiAgICBjb25zdCBtMjAgPSBtYXQuX3ZbMl0gKiB0aGlzLl92WzBdICsgbWF0Ll92WzVdICogdGhpcy5fdlsxXSArIG1hdC5fdls4XSAqIHRoaXMuX3ZbMl07XG4gICAgY29uc3QgbTIxID0gbWF0Ll92WzJdICogdGhpcy5fdlszXSArIG1hdC5fdls1XSAqIHRoaXMuX3ZbNF0gKyBtYXQuX3ZbOF0gKiB0aGlzLl92WzVdO1xuICAgIGNvbnN0IG0yMiA9IG1hdC5fdlsyXSAqIHRoaXMuX3ZbNl0gKyBtYXQuX3ZbNV0gKiB0aGlzLl92WzddICsgbWF0Ll92WzhdICogdGhpcy5fdls4XTtcblxuICAgIHJldHVybiB0aGlzLnNldENvbXBvbmVudHMobTAwLCBtMDEsIG0wMiwgbTEwLCBtMTEsIG0xMiwgbTIwLCBtMjEsIG0yMik7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE11dGFibGVNYXRyaXgzMyBleHRlbmRzIE11dGFibGVNYXRyaXgzM188RmxvYXQzMkFycmF5Q29uc3RydWN0b3I+IHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgTXV0YWJsZU1hdHJpeDMzIGluc3RhbmNlLlxuICAgKiBAcGFyYW0gbSAtIFRoZSB0eXBlZCBhcnJheSBjb250YWluaW5nIHRoZSBtYXRyaXggY29tcG9uZW50c1xuICAgKi9cbiAgY29uc3RydWN0b3IobTogVHlwZWRBcnJheSkge1xuICAgIHN1cGVyKG0sIHsgdHlwZTogRmxvYXQzMkFycmF5IH0pO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSB6ZXJvIG1hdHJpeC4gKi9cbiAgc3RhdGljIHplcm8oKTogTXV0YWJsZU1hdHJpeDMzIHtcbiAgICByZXR1cm4gc3VwZXIuX3plcm8oRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlTWF0cml4MzM7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhbiBpZGVudGl0eSBtYXRyaXggKG9wdGltaXplZCBJZGVudGl0eU1hdHJpeDMzIGluc3RhbmNlKS4gKi9cbiAgc3RhdGljIGlkZW50aXR5KCk6IE11dGFibGVNYXRyaXgzMyB7XG4gICAgcmV0dXJuIHN1cGVyLl9pZGVudGl0eShGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXgzMztcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgZHVtbXkgbWF0cml4IHdpdGggYW4gZW1wdHkgYXJyYXkuICovXG4gIHN0YXRpYyBkdW1teSgpOiBNdXRhYmxlTWF0cml4MzMge1xuICAgIHJldHVybiBzdXBlci5fZHVtbXkoRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlTWF0cml4MzM7XG4gIH1cblxuICAvKiogQ3JlYXRlcyB0aGUgdHJhbnNwb3NlIG9mIHRoZSBnaXZlbiBtYXRyaXguICovXG4gIHN0YXRpYyB0cmFuc3Bvc2UobWF0OiBJTWF0cml4MzMpOiBNdXRhYmxlTWF0cml4MzMge1xuICAgIHJldHVybiBzdXBlci5fdHJhbnNwb3NlKG1hdCwgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlTWF0cml4MzM7XG4gIH1cblxuICAvKiogQXR0ZW1wdHMgdG8gaW52ZXJ0IHRoZSBnaXZlbiBtYXRyaXgsIHJldHVybmluZyBudWxsIHdoZW4gaXQgaXMgc2luZ3VsYXIuICovXG4gIHN0YXRpYyB0cnlJbnZlcnQobWF0OiBJTWF0cml4MzMpOiBNdXRhYmxlTWF0cml4MzMgfCBudWxsIHtcbiAgICByZXR1cm4gc3VwZXIuX3RyeUludmVydChtYXQsIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDMzIHwgbnVsbDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIHRoZSBpbnZlcnNlIG9mIHRoZSBnaXZlbiBtYXRyaXggKGlkZW50aXR5IHdoZW4gc2luZ3VsYXIpLiAqL1xuICBzdGF0aWMgaW52ZXJ0KG1hdDogSU1hdHJpeDMzKTogTXV0YWJsZU1hdHJpeDMzIHtcbiAgICByZXR1cm4gc3VwZXIuX2ludmVydChtYXQsIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDMzO1xuICB9XG5cbiAgLyoqIEF0dGVtcHRzIHRvIGludmVydCB0aGUgZ2l2ZW4gbWF0cml4IGludG8gb3V0TWF0LiAqL1xuICBzdGF0aWMgdHJ5SW52ZXJ0VG88VCBleHRlbmRzIElNdXRhYmxlTWF0cml4MzM+KG1hdDogSU1hdHJpeDMzLCBvdXRNYXQ6IFQpOiBib29sZWFuIHtcbiAgICByZXR1cm4gc3VwZXIuX3RyeUludmVydFRvKG1hdCwgb3V0TWF0KTtcbiAgfVxuXG4gIC8qKiBJbnZlcnRzIHRoZSBnaXZlbiBtYXRyaXggaW50byBvdXRNYXQgKGlkZW50aXR5IHdoZW4gc2luZ3VsYXIpLiAqL1xuICBzdGF0aWMgaW52ZXJ0VG88VCBleHRlbmRzIElNdXRhYmxlTWF0cml4MzM+KG1hdDogSU1hdHJpeDMzLCBvdXRNYXQ6IFQpOiBUIHtcbiAgICByZXR1cm4gc3VwZXIuX2ludmVydFRvKG1hdCwgb3V0TWF0KSBhcyBUO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSByb3RhdGlvbiBtYXRyaXggYXJvdW5kIHRoZSBYLWF4aXMuICovXG4gIHN0YXRpYyByb3RhdGVYKHJhZGlhbjogbnVtYmVyKTogTXV0YWJsZU1hdHJpeDMzIHtcbiAgICByZXR1cm4gc3VwZXIuX3JvdGF0ZVgocmFkaWFuLCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXgzMztcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgcm90YXRpb24gbWF0cml4IGFyb3VuZCB0aGUgWS1heGlzLiAqL1xuICBzdGF0aWMgcm90YXRlWShyYWRpYW46IG51bWJlcik6IE11dGFibGVNYXRyaXgzMyB7XG4gICAgcmV0dXJuIHN1cGVyLl9yb3RhdGVZKHJhZGlhbiwgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlTWF0cml4MzM7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIHJvdGF0aW9uIG1hdHJpeCBhcm91bmQgdGhlIFotYXhpcy4gKi9cbiAgc3RhdGljIHJvdGF0ZVoocmFkaWFuOiBudW1iZXIpOiBNdXRhYmxlTWF0cml4MzMge1xuICAgIHJldHVybiBzdXBlci5fcm90YXRlWihyYWRpYW4sIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDMzO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSByb3RhdGlvbiBtYXRyaXggZnJvbSBFdWxlciBhbmdsZXMgaW4gWFlaIG9yZGVyLiAqL1xuICBzdGF0aWMgcm90YXRlWFlaKHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIpOiBNdXRhYmxlTWF0cml4MzMge1xuICAgIHJldHVybiBzdXBlci5fcm90YXRlWFlaKHgsIHksIHosIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDMzO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSByb3RhdGlvbiBtYXRyaXggZnJvbSBhIFZlY3RvcjMgY29udGFpbmluZyBFdWxlciBhbmdsZXMuICovXG4gIHN0YXRpYyByb3RhdGUodmVjOiBJVmVjdG9yMyk6IE11dGFibGVNYXRyaXgzMyB7XG4gICAgcmV0dXJuIHN1cGVyLl9yb3RhdGUodmVjLCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXgzMztcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgc2NhbGluZyBtYXRyaXguICovXG4gIHN0YXRpYyBzY2FsZSh2ZWM6IElWZWN0b3IzKTogTXV0YWJsZU1hdHJpeDMzIHtcbiAgICByZXR1cm4gc3VwZXIuX3NjYWxlKHZlYywgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlTWF0cml4MzM7XG4gIH1cblxuICAvKiogTXVsdGlwbGllcyB0d28gbWF0cmljZXMuICovXG4gIHN0YXRpYyBtdWx0aXBseShsX21hdDogSU1hdHJpeDMzLCByX21hdDogSU1hdHJpeDMzKTogTXV0YWJsZU1hdHJpeDMzIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5KGxfbWF0LCByX21hdCwgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlTWF0cml4MzM7XG4gIH1cblxuICAvKiogTXVsdGlwbGllcyB0d28gbWF0cmljZXMgYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIG91dE1hdC4gKi9cbiAgc3RhdGljIG11bHRpcGx5VG88VCBleHRlbmRzIElNdXRhYmxlTWF0cml4MzM+KGxfbWF0OiBJTWF0cml4MzMsIHJfbWF0OiBJTWF0cml4MzMsIG91dE1hdDogVCk6IFQge1xuICAgIHJldHVybiBzdXBlci5fbXVsdGlwbHlUbyhsX21hdCwgcl9tYXQsIG91dE1hdCkgYXMgVDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gcm93LW1ham9yIGNvbXBvbmVudHMuICovXG4gIC8vIHByZXR0aWVyLWlnbm9yZVxuICBzdGF0aWMgZnJvbUNvcHk5Um93TWFqb3IoXG4gICAgbTAwOiBudW1iZXIsXG4gICAgbTAxOiBudW1iZXIsXG4gICAgbTAyOiBudW1iZXIsXG4gICAgbTEwOiBudW1iZXIsXG4gICAgbTExOiBudW1iZXIsXG4gICAgbTEyOiBudW1iZXIsXG4gICAgbTIwOiBudW1iZXIsXG4gICAgbTIxOiBudW1iZXIsXG4gICAgbTIyOiBudW1iZXJcbiAgKTogTXV0YWJsZU1hdHJpeDMzIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5OVJvd01ham9yKG0wMCwgbTAxLCBtMDIsIG0xMCwgbTExLCBtMTIsIG0yMCwgbTIxLCBtMjIsIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDMzO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBjb2x1bW4tbWFqb3IgY29tcG9uZW50cy4gKi9cbiAgLy8gcHJldHRpZXItaWdub3JlXG4gIHN0YXRpYyBmcm9tQ29weTlDb2x1bW5NYWpvcihcbiAgICBtMDA6IG51bWJlcixcbiAgICBtMTA6IG51bWJlcixcbiAgICBtMjA6IG51bWJlcixcbiAgICBtMDE6IG51bWJlcixcbiAgICBtMTE6IG51bWJlcixcbiAgICBtMjE6IG51bWJlcixcbiAgICBtMDI6IG51bWJlcixcbiAgICBtMTI6IG51bWJlcixcbiAgICBtMjI6IG51bWJlclxuICApOiBNdXRhYmxlTWF0cml4MzMge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHk5Q29sdW1uTWFqb3IobTAwLCBtMTAsIG0yMCwgbTAxLCBtMTEsIG0yMSwgbTAyLCBtMTIsIG0yMiwgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlTWF0cml4MzM7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIHRoZSB1cHBlci1sZWZ0IDN4MyBwb3J0aW9uIG9mIGEgNHg0IG1hdHJpeC4gKi9cbiAgc3RhdGljIGZyb21Db3B5TWF0cml4NDQobWF0OiBJTWF0cml4NDQpOiBNdXRhYmxlTWF0cml4MzMge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlNYXRyaXg0NChtYXQsIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDMzO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggdGhhdCBkaXJlY3RseSB1c2VzIHRoZSBnaXZlbiBGbG9hdDMyQXJyYXkuICovXG4gIHN0YXRpYyBmcm9tRmxvYXQzMkFycmF5Q29sdW1uTWFqb3IoYXJyYXk6IEZsb2F0MzJBcnJheSk6IE11dGFibGVNYXRyaXgzMyB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tVHlwZWRBcnJheUNvbHVtbk1ham9yKGFycmF5LCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXgzMztcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGJ5IGNvcHlpbmcgYSBGbG9hdDMyQXJyYXkgaW4gY29sdW1uLW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlGbG9hdDMyQXJyYXlDb2x1bW5NYWpvcihhcnJheTogRmxvYXQzMkFycmF5KTogTXV0YWJsZU1hdHJpeDMzIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5VHlwZWRBcnJheUNvbHVtbk1ham9yKGFycmF5LCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXgzMztcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGJ5IGNvcHlpbmcgYSBGbG9hdDMyQXJyYXkgaW4gcm93LW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlGbG9hdDMyQXJyYXlSb3dNYWpvcihhcnJheTogRmxvYXQzMkFycmF5KTogTXV0YWJsZU1hdHJpeDMzIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5VHlwZWRBcnJheVJvd01ham9yKGFycmF5LCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXgzMztcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGJ5IGNvcHlpbmcgYW5vdGhlciBtYXRyaXguICovXG4gIHN0YXRpYyBmcm9tQ29weU1hdHJpeDMzKG1hdDogSU1hdHJpeDMzKTogTXV0YWJsZU1hdHJpeDMzIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5TWF0cml4MzMobWF0LCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXgzMztcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSA5LWVsZW1lbnQgYXJyYXkgaW4gY29sdW1uLW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheTlDb2x1bW5NYWpvcihhcnJheTogQXJyYXk5PG51bWJlcj4pOiBNdXRhYmxlTWF0cml4MzMge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlBcnJheTlDb2x1bW5NYWpvcihhcnJheSwgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlTWF0cml4MzM7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGFuIGFycmF5IGluIGNvbHVtbi1tYWpvciBvcmRlci4gKi9cbiAgc3RhdGljIGZyb21Db3B5QXJyYXlDb2x1bW5NYWpvcihhcnJheTogQXJyYXk8bnVtYmVyPik6IE11dGFibGVNYXRyaXgzMyB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weUFycmF5Q29sdW1uTWFqb3IoYXJyYXksIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDMzO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIDktZWxlbWVudCBhcnJheSBpbiByb3ctbWFqb3Igb3JkZXIuICovXG4gIHN0YXRpYyBmcm9tQ29weUFycmF5OVJvd01ham9yKGFycmF5OiBBcnJheTk8bnVtYmVyPik6IE11dGFibGVNYXRyaXgzMyB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weUFycmF5OVJvd01ham9yKGFycmF5LCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXgzMztcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYW4gYXJyYXkgaW4gcm93LW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheVJvd01ham9yKGFycmF5OiBBcnJheTxudW1iZXI+KTogTXV0YWJsZU1hdHJpeDMzIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5QXJyYXlSb3dNYWpvcihhcnJheSwgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlTWF0cml4MzM7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgcXVhdGVybmlvbiByZXByZXNlbnRpbmcgYSByb3RhdGlvbi4gKi9cbiAgc3RhdGljIGZyb21Db3B5UXVhdGVybmlvbihxOiBJUXVhdGVybmlvbik6IE11dGFibGVNYXRyaXgzMyB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weVF1YXRlcm5pb24ocSwgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlTWF0cml4MzM7XG4gIH1cbn1cblxuLyoqXG4gKiBJbW11dGFibGUgM3gzIG1hdHJpeCB3aXRoIDY0LWJpdCBmbG9hdCBjb21wb25lbnRzLlxuICogVXNlIHRoaXMgaW1wbGVtZW50YXRpb24gd2hlbiBoaWdoZXIgbnVtZXJpY2FsIHByZWNpc2lvbiBpcyByZXF1aXJlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIE11dGFibGVNYXRyaXgzM0QgZXh0ZW5kcyBNdXRhYmxlTWF0cml4MzNfPEZsb2F0NjRBcnJheUNvbnN0cnVjdG9yPiB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IE11dGFibGVNYXRyaXgzM0QgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSBtIC0gVGhlIHR5cGVkIGFycmF5IGNvbnRhaW5pbmcgdGhlIG1hdHJpeCBjb21wb25lbnRzXG4gICAqL1xuICBwcml2YXRlIGNvbnN0cnVjdG9yKG06IFR5cGVkQXJyYXkpIHtcbiAgICBzdXBlcihtLCB7IHR5cGU6IEZsb2F0NjRBcnJheSB9KTtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgemVybyBtYXRyaXguICovXG4gIHN0YXRpYyB6ZXJvKCk6IE11dGFibGVNYXRyaXgzM0Qge1xuICAgIHJldHVybiBzdXBlci5femVybyhGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVNYXRyaXgzM0Q7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhbiBpZGVudGl0eSBtYXRyaXguICovXG4gIHN0YXRpYyBpZGVudGl0eSgpOiBNdXRhYmxlTWF0cml4MzNEIHtcbiAgICByZXR1cm4gc3VwZXIuX2lkZW50aXR5KEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDMzRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgZHVtbXkgbWF0cml4IHdpdGggYW4gZW1wdHkgYXJyYXkuICovXG4gIHN0YXRpYyBkdW1teSgpOiBNdXRhYmxlTWF0cml4MzNEIHtcbiAgICByZXR1cm4gc3VwZXIuX2R1bW15KEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDMzRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIHRoZSB0cmFuc3Bvc2Ugb2YgdGhlIGdpdmVuIG1hdHJpeC4gKi9cbiAgc3RhdGljIHRyYW5zcG9zZShtYXQ6IElNYXRyaXgzMyk6IE11dGFibGVNYXRyaXgzM0Qge1xuICAgIHJldHVybiBzdXBlci5fdHJhbnNwb3NlKG1hdCwgRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlTWF0cml4MzNEO1xuICB9XG5cbiAgLyoqIEF0dGVtcHRzIHRvIGludmVydCB0aGUgZ2l2ZW4gbWF0cml4LCByZXR1cm5pbmcgbnVsbCB3aGVuIGl0IGlzIHNpbmd1bGFyLiAqL1xuICBzdGF0aWMgdHJ5SW52ZXJ0KG1hdDogSU1hdHJpeDMzKTogTXV0YWJsZU1hdHJpeDMzRCB8IG51bGwge1xuICAgIHJldHVybiBzdXBlci5fdHJ5SW52ZXJ0KG1hdCwgRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlTWF0cml4MzNEIHwgbnVsbDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIHRoZSBpbnZlcnNlIG9mIHRoZSBnaXZlbiBtYXRyaXggKGlkZW50aXR5IHdoZW4gc2luZ3VsYXIpLiAqL1xuICBzdGF0aWMgaW52ZXJ0KG1hdDogSU1hdHJpeDMzKTogTXV0YWJsZU1hdHJpeDMzRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9pbnZlcnQobWF0LCBGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVNYXRyaXgzM0Q7XG4gIH1cblxuICAvKiogQXR0ZW1wdHMgdG8gaW52ZXJ0IHRoZSBnaXZlbiBtYXRyaXggaW50byBvdXRNYXQuICovXG4gIHN0YXRpYyB0cnlJbnZlcnRUbzxUIGV4dGVuZHMgSU11dGFibGVNYXRyaXgzMz4obWF0OiBJTWF0cml4MzMsIG91dE1hdDogVCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBzdXBlci5fdHJ5SW52ZXJ0VG8obWF0LCBvdXRNYXQpO1xuICB9XG5cbiAgLyoqIEludmVydHMgdGhlIGdpdmVuIG1hdHJpeCBpbnRvIG91dE1hdCAoaWRlbnRpdHkgd2hlbiBzaW5ndWxhcikuICovXG4gIHN0YXRpYyBpbnZlcnRUbzxUIGV4dGVuZHMgSU11dGFibGVNYXRyaXgzMz4obWF0OiBJTWF0cml4MzMsIG91dE1hdDogVCk6IFQge1xuICAgIHJldHVybiBzdXBlci5faW52ZXJ0VG8obWF0LCBvdXRNYXQpIGFzIFQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIHJvdGF0aW9uIG1hdHJpeCBhcm91bmQgdGhlIFgtYXhpcy4gKi9cbiAgc3RhdGljIHJvdGF0ZVgocmFkaWFuOiBudW1iZXIpOiBNdXRhYmxlTWF0cml4MzNEIHtcbiAgICByZXR1cm4gc3VwZXIuX3JvdGF0ZVgocmFkaWFuLCBGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVNYXRyaXgzM0Q7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIHJvdGF0aW9uIG1hdHJpeCBhcm91bmQgdGhlIFktYXhpcy4gKi9cbiAgc3RhdGljIHJvdGF0ZVkocmFkaWFuOiBudW1iZXIpOiBNdXRhYmxlTWF0cml4MzNEIHtcbiAgICByZXR1cm4gc3VwZXIuX3JvdGF0ZVkocmFkaWFuLCBGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVNYXRyaXgzM0Q7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIHJvdGF0aW9uIG1hdHJpeCBhcm91bmQgdGhlIFotYXhpcy4gKi9cbiAgc3RhdGljIHJvdGF0ZVoocmFkaWFuOiBudW1iZXIpOiBNdXRhYmxlTWF0cml4MzNEIHtcbiAgICByZXR1cm4gc3VwZXIuX3JvdGF0ZVoocmFkaWFuLCBGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVNYXRyaXgzM0Q7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIHJvdGF0aW9uIG1hdHJpeCBmcm9tIEV1bGVyIGFuZ2xlcyBpbiBYWVogb3JkZXIuICovXG4gIHN0YXRpYyByb3RhdGVYWVooeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlcik6IE11dGFibGVNYXRyaXgzM0Qge1xuICAgIHJldHVybiBzdXBlci5fcm90YXRlWFlaKHgsIHksIHosIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDMzRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgcm90YXRpb24gbWF0cml4IGZyb20gYSBWZWN0b3IzIGNvbnRhaW5pbmcgRXVsZXIgYW5nbGVzLiAqL1xuICBzdGF0aWMgcm90YXRlKHZlYzogSVZlY3RvcjMpOiBNdXRhYmxlTWF0cml4MzNEIHtcbiAgICByZXR1cm4gc3VwZXIuX3JvdGF0ZSh2ZWMsIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDMzRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgc2NhbGluZyBtYXRyaXguICovXG4gIHN0YXRpYyBzY2FsZSh2ZWM6IElWZWN0b3IzKTogTXV0YWJsZU1hdHJpeDMzRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9zY2FsZSh2ZWMsIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDMzRDtcbiAgfVxuXG4gIC8qKiBNdWx0aXBsaWVzIHR3byBtYXRyaWNlcy4gKi9cbiAgc3RhdGljIG11bHRpcGx5KGxfbWF0OiBJTWF0cml4MzMsIHJfbWF0OiBJTWF0cml4MzMpOiBNdXRhYmxlTWF0cml4MzNEIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5KGxfbWF0LCByX21hdCwgRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlTWF0cml4MzNEO1xuICB9XG5cbiAgLyoqIE11bHRpcGxpZXMgdHdvIG1hdHJpY2VzIGFuZCBzdG9yZXMgdGhlIHJlc3VsdCBpbiBvdXRNYXQuICovXG4gIHN0YXRpYyBtdWx0aXBseVRvPFQgZXh0ZW5kcyBJTXV0YWJsZU1hdHJpeDMzPihsX21hdDogSU1hdHJpeDMzLCByX21hdDogSU1hdHJpeDMzLCBvdXRNYXQ6IFQpOiBUIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5VG8obF9tYXQsIHJfbWF0LCBvdXRNYXQpIGFzIFQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIHJvdy1tYWpvciBjb21wb25lbnRzLiAqL1xuICAvLyBwcmV0dGllci1pZ25vcmVcbiAgc3RhdGljIGZyb21Db3B5OVJvd01ham9yKFxuICAgIG0wMDogbnVtYmVyLFxuICAgIG0wMTogbnVtYmVyLFxuICAgIG0wMjogbnVtYmVyLFxuICAgIG0xMDogbnVtYmVyLFxuICAgIG0xMTogbnVtYmVyLFxuICAgIG0xMjogbnVtYmVyLFxuICAgIG0yMDogbnVtYmVyLFxuICAgIG0yMTogbnVtYmVyLFxuICAgIG0yMjogbnVtYmVyXG4gICk6IE11dGFibGVNYXRyaXgzM0Qge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHk5Um93TWFqb3IobTAwLCBtMDEsIG0wMiwgbTEwLCBtMTEsIG0xMiwgbTIwLCBtMjEsIG0yMiwgRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlTWF0cml4MzNEO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBjb2x1bW4tbWFqb3IgY29tcG9uZW50cy4gKi9cbiAgLy8gcHJldHRpZXItaWdub3JlXG4gIHN0YXRpYyBmcm9tQ29weTlDb2x1bW5NYWpvcihcbiAgICBtMDA6IG51bWJlcixcbiAgICBtMTA6IG51bWJlcixcbiAgICBtMjA6IG51bWJlcixcbiAgICBtMDE6IG51bWJlcixcbiAgICBtMTE6IG51bWJlcixcbiAgICBtMjE6IG51bWJlcixcbiAgICBtMDI6IG51bWJlcixcbiAgICBtMTI6IG51bWJlcixcbiAgICBtMjI6IG51bWJlclxuICApOiBNdXRhYmxlTWF0cml4MzNEIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5OUNvbHVtbk1ham9yKG0wMCwgbTEwLCBtMjAsIG0wMSwgbTExLCBtMjEsIG0wMiwgbTEyLCBtMjIsIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDMzRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gdGhlIHVwcGVyLWxlZnQgM3gzIHBvcnRpb24gb2YgYSA0eDQgbWF0cml4LiAqL1xuICBzdGF0aWMgZnJvbUNvcHlNYXRyaXg0NChtYXQ6IElNYXRyaXg0NCk6IE11dGFibGVNYXRyaXgzM0Qge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlNYXRyaXg0NChtYXQsIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDMzRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IHRoYXQgZGlyZWN0bHkgdXNlcyB0aGUgZ2l2ZW4gRmxvYXQ2NEFycmF5LiAqL1xuICBzdGF0aWMgZnJvbUZsb2F0NjRBcnJheUNvbHVtbk1ham9yKGFycmF5OiBGbG9hdDY0QXJyYXkpOiBNdXRhYmxlTWF0cml4MzNEIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21UeXBlZEFycmF5Q29sdW1uTWFqb3IoYXJyYXksIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDMzRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGJ5IGNvcHlpbmcgYSBGbG9hdDY0QXJyYXkgaW4gY29sdW1uLW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlGbG9hdDY0QXJyYXlDb2x1bW5NYWpvcihhcnJheTogRmxvYXQ2NEFycmF5KTogTXV0YWJsZU1hdHJpeDMzRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weVR5cGVkQXJyYXlDb2x1bW5NYWpvcihhcnJheSwgRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlTWF0cml4MzNEO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggYnkgY29weWluZyBhIEZsb2F0NjRBcnJheSBpbiByb3ctbWFqb3Igb3JkZXIuICovXG4gIHN0YXRpYyBmcm9tQ29weUZsb2F0NjRBcnJheVJvd01ham9yKGFycmF5OiBGbG9hdDY0QXJyYXkpOiBNdXRhYmxlTWF0cml4MzNEIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5VHlwZWRBcnJheVJvd01ham9yKGFycmF5LCBGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVNYXRyaXgzM0Q7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBieSBjb3B5aW5nIGFub3RoZXIgbWF0cml4LiAqL1xuICBzdGF0aWMgZnJvbUNvcHlNYXRyaXgzMyhtYXQ6IElNYXRyaXgzMyk6IE11dGFibGVNYXRyaXgzM0Qge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlNYXRyaXgzMyhtYXQsIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDMzRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSA5LWVsZW1lbnQgYXJyYXkgaW4gY29sdW1uLW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheTlDb2x1bW5NYWpvcihhcnJheTogQXJyYXk5PG51bWJlcj4pOiBNdXRhYmxlTWF0cml4MzNEIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5QXJyYXk5Q29sdW1uTWFqb3IoYXJyYXksIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDMzRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYW4gYXJyYXkgaW4gY29sdW1uLW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheUNvbHVtbk1ham9yKGFycmF5OiBBcnJheTxudW1iZXI+KTogTXV0YWJsZU1hdHJpeDMzRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weUFycmF5Q29sdW1uTWFqb3IoYXJyYXksIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDMzRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSA5LWVsZW1lbnQgYXJyYXkgaW4gcm93LW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheTlSb3dNYWpvcihhcnJheTogQXJyYXk5PG51bWJlcj4pOiBNdXRhYmxlTWF0cml4MzNEIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5QXJyYXk5Um93TWFqb3IoYXJyYXksIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDMzRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYW4gYXJyYXkgaW4gcm93LW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheVJvd01ham9yKGFycmF5OiBBcnJheTxudW1iZXI+KTogTXV0YWJsZU1hdHJpeDMzRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weUFycmF5Um93TWFqb3IoYXJyYXksIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDMzRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSBxdWF0ZXJuaW9uIHJlcHJlc2VudGluZyBhIHJvdGF0aW9uLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlRdWF0ZXJuaW9uKHE6IElRdWF0ZXJuaW9uKTogTXV0YWJsZU1hdHJpeDMzRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weVF1YXRlcm5pb24ocSwgRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlTWF0cml4MzNEO1xuICB9XG59XG5cbi8qKlxuICogQWxpYXMgZm9yIHRoZSAzMi1iaXQgKEZsb2F0MzJBcnJheSkgaW1wbGVtZW50YXRpb24sIG1ha2luZyB0aGUgcHJlY2lzaW9uIGV4cGxpY2l0LlxuICovXG5leHBvcnQgeyBNdXRhYmxlTWF0cml4MzMgYXMgTXV0YWJsZU1hdHJpeDMzRiB9O1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsY0FBYztBQUl2QixTQUFTLGdCQUFnQjtBQUN6QixTQUFTLGlCQUFpQjtBQW9CbkIsSUFBTSxtQkFBTixjQUNHLFVBRVY7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNRSxZQUFZLEdBQWUsU0FBc0I7QUFDL0MsVUFBTSxHQUFHLE9BQU87QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFXLElBQUksS0FBYTtBQUMxQixTQUFLLEdBQUcsQ0FBQyxJQUFJO0FBQUEsRUFDZjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFXLE1BQWM7QUFDdkIsV0FBTyxLQUFLLEdBQUcsQ0FBQztBQUFBLEVBQ2xCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQVcsSUFBSSxLQUFhO0FBQzFCLFNBQUssR0FBRyxDQUFDLElBQUk7QUFBQSxFQUNmO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQVcsTUFBYztBQUN2QixXQUFPLEtBQUssR0FBRyxDQUFDO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBVyxJQUFJLEtBQWE7QUFDMUIsU0FBSyxHQUFHLENBQUMsSUFBSTtBQUFBLEVBQ2Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBVyxNQUFjO0FBQ3ZCLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7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QUFDO0FBQ25GLFVBQU0sTUFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUM7QUFFbkYsVUFBTSxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQztBQUNuRixVQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDO0FBQ25GLFVBQU0sTUFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUM7QUFFbkYsVUFBTSxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQztBQUNuRixVQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDO0FBQ25GLFVBQU0sTUFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFD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
