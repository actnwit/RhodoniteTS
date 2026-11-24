// src/foundation/math/Matrix44.ts
import { CompositionType } from "../definitions/CompositionType.js";
import { Logger } from "../misc/Logger.js";
import { AbstractMatrix } from "./AbstractMatrix.js";
import { IdentityMatrix44 } from "./IdentityMatrix44.js";
import { MathUtil } from "./MathUtil.js";
import { mulThatAndThisToOutAsMat44_offsetAsComposition } from "./raw/raw_extension.js";
import { Vector3 } from "./Vector3.js";
import { Vector4 } from "./Vector4.js";
var Matrix44_ = class extends AbstractMatrix {
  /**
   * Creates a new Matrix44_ instance.
   * @param m - A typed array containing 16 matrix elements in column-major order
   * @param _options - Configuration object containing the typed array constructor
   */
  constructor(m, _options) {
    super();
    this._v = m;
  }
  /**
   * Gets the matrix element at row 0, column 0.
   * @returns The m00 component of the matrix
   */
  get m00() {
    return this._v[0];
  }
  /**
   * Gets the matrix element at row 1, column 0.
   * @returns The m10 component of the matrix
   */
  get m10() {
    return this._v[1];
  }
  /**
   * Gets the matrix element at row 2, column 0.
   * @returns The m20 component of the matrix
   */
  get m20() {
    return this._v[2];
  }
  /**
   * Gets the matrix element at row 3, column 0.
   * @returns The m30 component of the matrix
   */
  get m30() {
    return this._v[3];
  }
  /**
   * Gets the matrix element at row 0, column 1.
   * @returns The m01 component of the matrix
   */
  get m01() {
    return this._v[4];
  }
  /**
   * Gets the matrix element at row 1, column 1.
   * @returns The m11 component of the matrix
   */
  get m11() {
    return this._v[5];
  }
  /**
   * Gets the matrix element at row 2, column 1.
   * @returns The m21 component of the matrix
   */
  get m21() {
    return this._v[6];
  }
  /**
   * Gets the matrix element at row 3, column 1.
   * @returns The m31 component of the matrix
   */
  get m31() {
    return this._v[7];
  }
  /**
   * Gets the matrix element at row 0, column 2.
   * @returns The m02 component of the matrix
   */
  get m02() {
    return this._v[8];
  }
  /**
   * Gets the matrix element at row 1, column 2.
   * @returns The m12 component of the matrix
   */
  get m12() {
    return this._v[9];
  }
  /**
   * Gets the matrix element at row 2, column 2.
   * @returns The m22 component of the matrix
   */
  get m22() {
    return this._v[10];
  }
  /**
   * Gets the matrix element at row 3, column 2.
   * @returns The m32 component of the matrix
   */
  get m32() {
    return this._v[11];
  }
  /**
   * Gets the matrix element at row 0, column 3.
   * @returns The m03 component of the matrix
   */
  get m03() {
    return this._v[12];
  }
  /**
   * Gets the matrix element at row 1, column 3.
   * @returns The m13 component of the matrix
   */
  get m13() {
    return this._v[13];
  }
  /**
   * Gets the matrix element at row 2, column 3.
   * @returns The m23 component of the matrix
   */
  get m23() {
    return this._v[14];
  }
  /**
   * Gets the matrix element at row 3, column 3.
   * @returns The m33 component of the matrix
   */
  get m33() {
    return this._v[15];
  }
  /**
   * Gets the X component of the translation vector from this matrix.
   * @returns The X translation value
   */
  get translateX() {
    return this._v[12];
  }
  /**
   * Gets the Y component of the translation vector from this matrix.
   * @returns The Y translation value
   */
  get translateY() {
    return this._v[13];
  }
  /**
   * Gets the Z component of the translation vector from this matrix.
   * @returns The Z translation value
   */
  get translateZ() {
    return this._v[14];
  }
  /**
   * Gets the composition type for this matrix class.
   * @returns The composition type enum value
   */
  static get compositionType() {
    return CompositionType.Mat4;
  }
  /**
   * Converts the matrix to a GLSL mat4 string representation with float precision.
   * @returns A GLSL-compatible string representation of the matrix
   */
  get glslStrAsFloat() {
    return `mat4(${MathUtil.convertToStringAsGLSLFloat(this._v[0])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[1])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[2])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[3])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[4])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[5])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[6])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[7])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[8])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[9])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[10])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[11])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[12])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[13])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[14])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[15])})`;
  }
  /**
   * Converts the matrix to a GLSL mat4 string representation with integer values.
   * @returns A GLSL-compatible string representation of the matrix with integer values
   */
  get glslStrAsInt() {
    return `mat4(${Math.floor(this._v[0])}, ${Math.floor(this._v[1])}, ${Math.floor(this._v[2])}, ${Math.floor(this._v[3])}, ${Math.floor(this._v[4])}, ${Math.floor(this._v[5])}, ${Math.floor(this._v[6])}, ${Math.floor(this._v[7])}, ${Math.floor(this._v[8])}, ${Math.floor(this._v[9])}, ${Math.floor(this._v[10])}, ${Math.floor(this._v[11])}, ${Math.floor(this._v[12])}, ${Math.floor(this._v[13])}, ${Math.floor(this._v[14])}, ${Math.floor(this._v[15])})`;
  }
  /**
   * Converts the matrix to a WGSL mat4x4f string representation with float precision.
   * @returns A WGSL-compatible string representation of the matrix
   */
  get wgslStrAsFloat() {
    return `mat4x4f(${MathUtil.convertToStringAsGLSLFloat(this._v[0])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[1])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[2])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[3])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[4])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[5])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[6])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[7])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[8])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[9])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[10])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[11])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[12])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[13])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[14])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[15])})`;
  }
  /**
   * Converts the matrix to a WGSL mat4x4i string representation with integer values.
   * @returns A WGSL-compatible string representation of the matrix with integer values
   */
  get wgslStrAsInt() {
    return `mat4x4i(${Math.floor(this._v[0])}, ${Math.floor(this._v[1])}, ${Math.floor(this._v[2])}, ${Math.floor(this._v[3])}, ${Math.floor(this._v[4])}, ${Math.floor(this._v[5])}, ${Math.floor(this._v[6])}, ${Math.floor(this._v[7])}, ${Math.floor(this._v[8])}, ${Math.floor(this._v[9])}, ${Math.floor(this._v[10])}, ${Math.floor(this._v[11])}, ${Math.floor(this._v[12])}, ${Math.floor(this._v[13])}, ${Math.floor(this._v[14])}, ${Math.floor(this._v[15])})`;
  }
  /**
   * Creates a zero matrix (all elements are 0).
   * @returns A new Matrix44 instance with all elements set to 0
   */
  static _zero(type) {
    return this._fromCopy16RowMajor(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, type);
  }
  /**
   * Creates a 4x4 identity matrix.
   * @returns A new IdentityMatrix44 instance representing the identity matrix
   */
  static _identity(type) {
    return this._fromCopy16RowMajor(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, type);
  }
  /**
   * Creates a dummy matrix with zero-length array (for placeholder purposes).
   * @returns A new Matrix44 instance with an empty array
   */
  static _dummy(type) {
    return new this(new type(0), { type });
  }
  /**
   * Creates a transpose matrix from the given matrix.
   * For identity matrices, returns the same matrix since transpose of identity is identity.
   * @param mat - The matrix to transpose
   * @returns A new Matrix44 instance representing the transposed matrix
   */
  static _transpose(mat, type) {
    return this._fromCopyTypedArrayRowMajor(mat._v, type);
  }
  /**
   * Attempts to create the inverse of the given matrix.
   * Uses optimized computation for 4x4 matrix inversion.
   *
   * Returns null instead of dividing by zero when the matrix is numerically
   * singular (see {@link MathUtil.isSingularDet}).
   *
   * @param mat - The matrix to invert
   * @returns A new Matrix44 instance representing the inverted matrix,
   *          or null if the matrix is not invertible
   */
  static _tryInvert(mat, type) {
    if (mat.isIdentityMatrixClass) {
      return this._fromCopyMatrix44(mat, type);
    }
    const n00 = mat._v[0] * mat._v[5] - mat._v[4] * mat._v[1];
    const n01 = mat._v[0] * mat._v[9] - mat._v[8] * mat._v[1];
    const n02 = mat._v[0] * mat._v[13] - mat._v[12] * mat._v[1];
    const n03 = mat._v[4] * mat._v[9] - mat._v[8] * mat._v[5];
    const n04 = mat._v[4] * mat._v[13] - mat._v[12] * mat._v[5];
    const n05 = mat._v[8] * mat._v[13] - mat._v[12] * mat._v[9];
    const n06 = mat._v[2] * mat._v[7] - mat._v[6] * mat._v[3];
    const n07 = mat._v[2] * mat._v[11] - mat._v[10] * mat._v[3];
    const n08 = mat._v[2] * mat._v[15] - mat._v[14] * mat._v[3];
    const n09 = mat._v[6] * mat._v[11] - mat._v[10] * mat._v[7];
    const n10 = mat._v[6] * mat._v[15] - mat._v[14] * mat._v[7];
    const n11 = mat._v[10] * mat._v[15] - mat._v[14] * mat._v[11];
    const det = n00 * n11 - n01 * n10 + n02 * n09 + n03 * n08 - n04 * n07 + n05 * n06;
    const rowNorm0 = Math.abs(mat._v[0]) + Math.abs(mat._v[1]) + Math.abs(mat._v[2]) + Math.abs(mat._v[3]);
    const rowNorm1 = Math.abs(mat._v[4]) + Math.abs(mat._v[5]) + Math.abs(mat._v[6]) + Math.abs(mat._v[7]);
    const rowNorm2 = Math.abs(mat._v[8]) + Math.abs(mat._v[9]) + Math.abs(mat._v[10]) + Math.abs(mat._v[11]);
    const rowNorm3 = Math.abs(mat._v[12]) + Math.abs(mat._v[13]) + Math.abs(mat._v[14]) + Math.abs(mat._v[15]);
    if (MathUtil.isSingularDet(
      det,
      rowNorm0 * rowNorm1 * rowNorm2 * rowNorm3,
      MathUtil.getSingularEpsilon(mat._v.BYTES_PER_ELEMENT)
    )) {
      return null;
    }
    const invDet = 1 / det;
    const m00 = (mat._v[5] * n11 - mat._v[9] * n10 + mat._v[13] * n09) * invDet;
    const m01 = (mat._v[8] * n10 - mat._v[4] * n11 - mat._v[12] * n09) * invDet;
    const m02 = (mat._v[7] * n05 - mat._v[11] * n04 + mat._v[15] * n03) * invDet;
    const m03 = (mat._v[10] * n04 - mat._v[6] * n05 - mat._v[14] * n03) * invDet;
    const m10 = (mat._v[9] * n08 - mat._v[1] * n11 - mat._v[13] * n07) * invDet;
    const m11 = (mat._v[0] * n11 - mat._v[8] * n08 + mat._v[12] * n07) * invDet;
    const m12 = (mat._v[11] * n02 - mat._v[3] * n05 - mat._v[15] * n01) * invDet;
    const m13 = (mat._v[2] * n05 - mat._v[10] * n02 + mat._v[14] * n01) * invDet;
    const m20 = (mat._v[1] * n10 - mat._v[5] * n08 + mat._v[13] * n06) * invDet;
    const m21 = (mat._v[4] * n08 - mat._v[0] * n10 - mat._v[12] * n06) * invDet;
    const m22 = (mat._v[3] * n04 - mat._v[7] * n02 + mat._v[15] * n00) * invDet;
    const m23 = (mat._v[6] * n02 - mat._v[2] * n04 - mat._v[14] * n00) * invDet;
    const m30 = (mat._v[5] * n07 - mat._v[1] * n09 - mat._v[9] * n06) * invDet;
    const m31 = (mat._v[0] * n09 - mat._v[4] * n07 + mat._v[8] * n06) * invDet;
    const m32 = (mat._v[7] * n01 - mat._v[3] * n03 - mat._v[11] * n00) * invDet;
    const m33 = (mat._v[2] * n03 - mat._v[6] * n01 + mat._v[10] * n00) * invDet;
    return this._fromCopy16RowMajor(
      m00,
      m01,
      m02,
      m03,
      m10,
      m11,
      m12,
      m13,
      m20,
      m21,
      m22,
      m23,
      m30,
      m31,
      m32,
      m33,
      type
    );
  }
  /**
   * Creates an inverse matrix from the given matrix.
   * Uses optimized computation for 4x4 matrix inversion.
   *
   * If the matrix is numerically singular, an identity matrix is returned
   * instead of dividing by zero. Use {@link Matrix44.tryInvert} when the
   * caller needs to detect the failure.
   *
   * @param mat - The matrix to invert
   * @returns A new Matrix44 instance representing the inverted matrix,
   *          or the identity matrix if the input is singular
   */
  static _invert(mat, type) {
    const inverted = this._tryInvert(mat, type);
    if (inverted !== null) {
      return inverted;
    }
    Logger.default.error("the matrix is singular and cannot be inverted. Returning an identity matrix instead.");
    return this._fromCopy16RowMajor(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, type);
  }
  /**
   * Attempts to compute the inverse of a matrix and store the result in an output matrix.
   * The output matrix is left untouched when the input is numerically singular,
   * which lets callers keep the previous valid value.
   *
   * @param mat - The matrix to invert
   * @param outMat - The output matrix to store the result
   * @returns True if the inversion succeeded, false if the matrix is singular
   */
  static _tryInvertTo(mat, outMat) {
    if (mat.isIdentityMatrixClass) {
      outMat.copyComponents(mat);
      return true;
    }
    const n00 = mat._v[0] * mat._v[5] - mat._v[4] * mat._v[1];
    const n01 = mat._v[0] * mat._v[9] - mat._v[8] * mat._v[1];
    const n02 = mat._v[0] * mat._v[13] - mat._v[12] * mat._v[1];
    const n03 = mat._v[4] * mat._v[9] - mat._v[8] * mat._v[5];
    const n04 = mat._v[4] * mat._v[13] - mat._v[12] * mat._v[5];
    const n05 = mat._v[8] * mat._v[13] - mat._v[12] * mat._v[9];
    const n06 = mat._v[2] * mat._v[7] - mat._v[6] * mat._v[3];
    const n07 = mat._v[2] * mat._v[11] - mat._v[10] * mat._v[3];
    const n08 = mat._v[2] * mat._v[15] - mat._v[14] * mat._v[3];
    const n09 = mat._v[6] * mat._v[11] - mat._v[10] * mat._v[7];
    const n10 = mat._v[6] * mat._v[15] - mat._v[14] * mat._v[7];
    const n11 = mat._v[10] * mat._v[15] - mat._v[14] * mat._v[11];
    const det = n00 * n11 - n01 * n10 + n02 * n09 + n03 * n08 - n04 * n07 + n05 * n06;
    const rowNorm0 = Math.abs(mat._v[0]) + Math.abs(mat._v[1]) + Math.abs(mat._v[2]) + Math.abs(mat._v[3]);
    const rowNorm1 = Math.abs(mat._v[4]) + Math.abs(mat._v[5]) + Math.abs(mat._v[6]) + Math.abs(mat._v[7]);
    const rowNorm2 = Math.abs(mat._v[8]) + Math.abs(mat._v[9]) + Math.abs(mat._v[10]) + Math.abs(mat._v[11]);
    const rowNorm3 = Math.abs(mat._v[12]) + Math.abs(mat._v[13]) + Math.abs(mat._v[14]) + Math.abs(mat._v[15]);
    if (MathUtil.isSingularDet(
      det,
      rowNorm0 * rowNorm1 * rowNorm2 * rowNorm3,
      MathUtil.getSingularEpsilon(mat._v.BYTES_PER_ELEMENT)
    )) {
      return false;
    }
    const invDet = 1 / det;
    const m00 = (mat._v[5] * n11 - mat._v[9] * n10 + mat._v[13] * n09) * invDet;
    const m01 = (mat._v[8] * n10 - mat._v[4] * n11 - mat._v[12] * n09) * invDet;
    const m02 = (mat._v[7] * n05 - mat._v[11] * n04 + mat._v[15] * n03) * invDet;
    const m03 = (mat._v[10] * n04 - mat._v[6] * n05 - mat._v[14] * n03) * invDet;
    const m10 = (mat._v[9] * n08 - mat._v[1] * n11 - mat._v[13] * n07) * invDet;
    const m11 = (mat._v[0] * n11 - mat._v[8] * n08 + mat._v[12] * n07) * invDet;
    const m12 = (mat._v[11] * n02 - mat._v[3] * n05 - mat._v[15] * n01) * invDet;
    const m13 = (mat._v[2] * n05 - mat._v[10] * n02 + mat._v[14] * n01) * invDet;
    const m20 = (mat._v[1] * n10 - mat._v[5] * n08 + mat._v[13] * n06) * invDet;
    const m21 = (mat._v[4] * n08 - mat._v[0] * n10 - mat._v[12] * n06) * invDet;
    const m22 = (mat._v[3] * n04 - mat._v[7] * n02 + mat._v[15] * n00) * invDet;
    const m23 = (mat._v[6] * n02 - mat._v[2] * n04 - mat._v[14] * n00) * invDet;
    const m30 = (mat._v[5] * n07 - mat._v[1] * n09 - mat._v[9] * n06) * invDet;
    const m31 = (mat._v[0] * n09 - mat._v[4] * n07 + mat._v[8] * n06) * invDet;
    const m32 = (mat._v[7] * n01 - mat._v[3] * n03 - mat._v[11] * n00) * invDet;
    const m33 = (mat._v[2] * n03 - mat._v[6] * n01 + mat._v[10] * n00) * invDet;
    outMat.setComponents(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
    return true;
  }
  /**
   * Computes the inverse of a matrix and stores the result in an output matrix.
   * This is the mutable version of the invert method for performance optimization.
   *
   * If the matrix is numerically singular, the output matrix is set to the
   * identity matrix instead of being filled with `Infinity`/`NaN`.
   * Use {@link Matrix44.tryInvertTo} when the caller needs to detect the failure.
   *
   * @param mat - The matrix to invert
   * @param outMat - The output matrix to store the result
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
   * Creates a translation matrix from a 3D vector.
   * @param vec - The translation vector
   * @returns A new Matrix44 instance representing the translation transformation
   */
  static _translate(vec, type) {
    return this._fromCopy16RowMajor(1, 0, 0, vec._v[0], 0, 1, 0, vec._v[1], 0, 0, 1, vec._v[2], 0, 0, 0, 1, type);
  }
  /**
   * Creates a rotation matrix around the X-axis.
   * @param radian - The rotation angle in radians
   * @returns A new Matrix44 instance representing the X-axis rotation
   */
  static _rotateX(radian, type) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this._fromCopy16RowMajor(1, 0, 0, 0, 0, cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1, type);
  }
  /**
   * Creates a rotation matrix around the Y-axis.
   * @param radian - The rotation angle in radians
   * @returns A new Matrix44 instance representing the Y-axis rotation
   */
  static _rotateY(radian, type) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this._fromCopy16RowMajor(cos, 0, sin, 0, 0, 1, 0, 0, -sin, 0, cos, 0, 0, 0, 0, 1, type);
  }
  /**
   * Creates a rotation matrix around the Z-axis.
   * @param radian - The rotation angle in radians
   * @returns A new Matrix44 instance representing the Z-axis rotation
   */
  static _rotateZ(radian, type) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this._fromCopy16RowMajor(cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, type);
  }
  /**
   * Creates a rotation matrix from Euler angles (XYZ order).
   * Applies rotations in the order: X, then Y, then Z.
   * @param x - Rotation around X-axis in radians
   * @param y - Rotation around Y-axis in radians
   * @param z - Rotation around Z-axis in radians
   * @returns A new Matrix44 instance representing the combined rotation
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
    const m03 = 0;
    const m13 = 0;
    const m23 = 0;
    const m30 = 0;
    const m31 = 0;
    const m32 = 0;
    const m33 = 1;
    return this._fromCopy16RowMajor(
      m00,
      m01,
      m02,
      m03,
      m10,
      m11,
      m12,
      m13,
      m20,
      m21,
      m22,
      m23,
      m30,
      m31,
      m32,
      m33,
      type
    );
  }
  /**
   * Creates a rotation matrix from a 3D vector containing Euler angles.
   * @param vec - A vector containing rotation angles [x, y, z] in radians
   * @returns A new Matrix44 instance representing the rotation
   */
  static _rotate(vec, type) {
    return this._rotateXYZ(vec._v[0], vec._v[1], vec._v[2], type);
  }
  /**
   * Creates a scaling matrix from a 3D vector.
   * @param vec - The scaling factors for each axis [x, y, z]
   * @returns A new Matrix44 instance representing the scaling transformation
   */
  static _scale(vec, type) {
    return this._fromCopy16RowMajor(vec._v[0], 0, 0, 0, 0, vec._v[1], 0, 0, 0, 0, vec._v[2], 0, 0, 0, 0, 1, type);
  }
  /**
   * Multiplies two 4x4 matrices and returns the result.
   * Optimized to handle identity matrices efficiently.
   * @param l_mat - The left matrix in the multiplication
   * @param r_mat - The right matrix in the multiplication
   * @returns A new Matrix44 instance representing the matrix product (l_mat * r_mat)
   */
  static _multiply(l_mat, r_mat, type) {
    if (l_mat.isIdentityMatrixClass) {
      return this._fromCopyMatrix44(r_mat, type);
    }
    if (r_mat.isIdentityMatrixClass) {
      return this._fromCopyMatrix44(l_mat, type);
    }
    const lv = l_mat._v;
    const rv = r_mat._v;
    const m00 = lv[0] * rv[0] + lv[4] * rv[1] + lv[8] * rv[2] + lv[12] * rv[3];
    const m10 = lv[1] * rv[0] + lv[5] * rv[1] + lv[9] * rv[2] + lv[13] * rv[3];
    const m20 = lv[2] * rv[0] + lv[6] * rv[1] + lv[10] * rv[2] + lv[14] * rv[3];
    const m30 = lv[3] * rv[0] + lv[7] * rv[1] + lv[11] * rv[2] + lv[15] * rv[3];
    const m01 = lv[0] * rv[4] + lv[4] * rv[5] + lv[8] * rv[6] + lv[12] * rv[7];
    const m11 = lv[1] * rv[4] + lv[5] * rv[5] + lv[9] * rv[6] + lv[13] * rv[7];
    const m21 = lv[2] * rv[4] + lv[6] * rv[5] + lv[10] * rv[6] + lv[14] * rv[7];
    const m31 = lv[3] * rv[4] + lv[7] * rv[5] + lv[11] * rv[6] + lv[15] * rv[7];
    const m02 = lv[0] * rv[8] + lv[4] * rv[9] + lv[8] * rv[10] + lv[12] * rv[11];
    const m12 = lv[1] * rv[8] + lv[5] * rv[9] + lv[9] * rv[10] + lv[13] * rv[11];
    const m22 = lv[2] * rv[8] + lv[6] * rv[9] + lv[10] * rv[10] + lv[14] * rv[11];
    const m32 = lv[3] * rv[8] + lv[7] * rv[9] + lv[11] * rv[10] + lv[15] * rv[11];
    const m03 = lv[0] * rv[12] + lv[4] * rv[13] + lv[8] * rv[14] + lv[12] * rv[15];
    const m13 = lv[1] * rv[12] + lv[5] * rv[13] + lv[9] * rv[14] + lv[13] * rv[15];
    const m23 = lv[2] * rv[12] + lv[6] * rv[13] + lv[10] * rv[14] + lv[14] * rv[15];
    const m33 = lv[3] * rv[12] + lv[7] * rv[13] + lv[11] * rv[14] + lv[15] * rv[15];
    return this._fromCopy16RowMajor(
      m00,
      m01,
      m02,
      m03,
      m10,
      m11,
      m12,
      m13,
      m20,
      m21,
      m22,
      m23,
      m30,
      m31,
      m32,
      m33,
      type
    );
  }
  /**
   * Multiplies two 4x4 matrices and stores the result in an output matrix.
   * This is the mutable version of the multiply method for performance optimization.
   * @param l_mat - The left matrix in the multiplication
   * @param r_mat - The right matrix in the multiplication
   * @param outMat - The output matrix to store the result
   * @returns The output matrix containing the multiplication result
   */
  static _multiplyTo(l_mat, r_mat, outMat) {
    if (l_mat.isIdentityMatrixClass) {
      return outMat.copyComponents(r_mat);
    }
    if (r_mat.isIdentityMatrixClass) {
      return outMat.copyComponents(l_mat);
    }
    const lv = l_mat._v;
    const rv = r_mat._v;
    const m00 = lv[0] * rv[0] + lv[4] * rv[1] + lv[8] * rv[2] + lv[12] * rv[3];
    const m10 = lv[1] * rv[0] + lv[5] * rv[1] + lv[9] * rv[2] + lv[13] * rv[3];
    const m20 = lv[2] * rv[0] + lv[6] * rv[1] + lv[10] * rv[2] + lv[14] * rv[3];
    const m30 = lv[3] * rv[0] + lv[7] * rv[1] + lv[11] * rv[2] + lv[15] * rv[3];
    const m01 = lv[0] * rv[4] + lv[4] * rv[5] + lv[8] * rv[6] + lv[12] * rv[7];
    const m11 = lv[1] * rv[4] + lv[5] * rv[5] + lv[9] * rv[6] + lv[13] * rv[7];
    const m21 = lv[2] * rv[4] + lv[6] * rv[5] + lv[10] * rv[6] + lv[14] * rv[7];
    const m31 = lv[3] * rv[4] + lv[7] * rv[5] + lv[11] * rv[6] + lv[15] * rv[7];
    const m02 = lv[0] * rv[8] + lv[4] * rv[9] + lv[8] * rv[10] + lv[12] * rv[11];
    const m12 = lv[1] * rv[8] + lv[5] * rv[9] + lv[9] * rv[10] + lv[13] * rv[11];
    const m22 = lv[2] * rv[8] + lv[6] * rv[9] + lv[10] * rv[10] + lv[14] * rv[11];
    const m32 = lv[3] * rv[8] + lv[7] * rv[9] + lv[11] * rv[10] + lv[15] * rv[11];
    const m03 = lv[0] * rv[12] + lv[4] * rv[13] + lv[8] * rv[14] + lv[12] * rv[15];
    const m13 = lv[1] * rv[12] + lv[5] * rv[13] + lv[9] * rv[14] + lv[13] * rv[15];
    const m23 = lv[2] * rv[12] + lv[6] * rv[13] + lv[10] * rv[14] + lv[14] * rv[15];
    const m33 = lv[3] * rv[12] + lv[7] * rv[13] + lv[11] * rv[14] + lv[15] * rv[15];
    return outMat.setComponents(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
  }
  /**
   * Multiplies a matrix with data from a typed array and stores the result.
   * This method is optimized for working with raw array data.
   * @param l_mat - The left matrix in the multiplication
   * @param r_array - The right operand as a typed array
   * @param outMat - The output matrix to store the result
   * @param offsetAsComposition - The offset in the array for composition data
   * @returns The output matrix containing the multiplication result
   */
  static _multiplyTypedArrayTo(l_mat, r_array, outMat, offsetAsComposition) {
    r_array[mulThatAndThisToOutAsMat44_offsetAsComposition](offsetAsComposition, l_mat._v, 0, outMat._v);
    return outMat;
  }
  /**
   * Creates a rotation matrix from a quaternion and stores it in an output matrix.
   * @param quat - The quaternion representing the rotation
   * @param outMat - The output matrix to store the result
   * @returns The output matrix containing the rotation matrix
   */
  static _fromQuaternionTo(quat, outMat) {
    const sx = quat._v[0] * quat._v[0];
    const sy = quat._v[1] * quat._v[1];
    const sz = quat._v[2] * quat._v[2];
    const cx = quat._v[1] * quat._v[2];
    const cy = quat._v[0] * quat._v[2];
    const cz = quat._v[0] * quat._v[1];
    const wx = quat._v[3] * quat._v[0];
    const wy = quat._v[3] * quat._v[1];
    const wz = quat._v[3] * quat._v[2];
    const m00 = 1 - 2 * (sy + sz);
    const m01 = 2 * (cz - wz);
    const m02 = 2 * (cy + wy);
    const m03 = 0;
    const m10 = 2 * (cz + wz);
    const m11 = 1 - 2 * (sx + sz);
    const m12 = 2 * (cx - wx);
    const m13 = 0;
    const m20 = 2 * (cy - wy);
    const m21 = 2 * (cx + wx);
    const m22 = 1 - 2 * (sx + sy);
    const m23 = 0;
    const m30 = 0;
    const m31 = 0;
    const m32 = 0;
    const m33 = 1;
    return outMat.setComponents(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
  }
  /**
   * Converts the matrix to a human-readable string representation.
   * Elements are displayed in row-major order for intuitive reading.
   * @returns A formatted string representation of the matrix
   */
  toString() {
    return `${this._v[0]} ${this._v[4]} ${this._v[8]} ${this._v[12]} 
${this._v[1]} ${this._v[5]} ${this._v[9]} ${this._v[13]} 
${this._v[2]} ${this._v[6]} ${this._v[10]} ${this._v[14]} 
${this._v[3]} ${this._v[7]} ${this._v[11]} ${this._v[15]} 
`;
  }
  /**
   * Converts the matrix to a human-readable string with rounded values.
   * Uses financial rounding for better readability of floating-point numbers.
   * @returns A formatted string representation with approximated values
   */
  toStringApproximately() {
    return `${MathUtil.financial(this._v[0])} ${MathUtil.financial(this._v[4])} ${MathUtil.financial(this._v[8])} ${MathUtil.financial(this._v[12])} 
${MathUtil.financial(this._v[1])} ${MathUtil.financial(this._v[5])} ${MathUtil.financial(this._v[9])} ${MathUtil.financial(this._v[13])} 
${MathUtil.financial(this._v[2])} ${MathUtil.financial(this._v[6])} ${MathUtil.financial(this._v[10])} ${MathUtil.financial(this._v[14])} 
${MathUtil.financial(this._v[3])} ${MathUtil.financial(this._v[7])} ${MathUtil.financial(this._v[11])} ${MathUtil.financial(this._v[15])} 
`;
  }
  /**
   * Flattens the matrix into a regular JavaScript array.
   * Elements are returned in column-major order (WebGL compatible).
   * @returns An array containing all 16 matrix elements
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
      this._v[9],
      this._v[10],
      this._v[11],
      this._v[12],
      this._v[13],
      this._v[14],
      this._v[15]
    ];
  }
  /**
   * Checks if this is a dummy matrix (empty array).
   * @returns true if the matrix has no elements, false otherwise
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
   * @param delta - The tolerance for floating-point comparison (default: Number.EPSILON)
   * @returns true if matrices are approximately equal within the given tolerance
   */
  isEqual(mat, delta = Number.EPSILON) {
    const v = mat._v;
    if (Math.abs(v[0] - this._v[0]) < delta && Math.abs(v[1] - this._v[1]) < delta && Math.abs(v[2] - this._v[2]) < delta && Math.abs(v[3] - this._v[3]) < delta && Math.abs(v[4] - this._v[4]) < delta && Math.abs(v[5] - this._v[5]) < delta && Math.abs(v[6] - this._v[6]) < delta && Math.abs(v[7] - this._v[7]) < delta && Math.abs(v[8] - this._v[8]) < delta && Math.abs(v[9] - this._v[9]) < delta && Math.abs(v[10] - this._v[10]) < delta && Math.abs(v[11] - this._v[11]) < delta && Math.abs(v[12] - this._v[12]) < delta && Math.abs(v[13] - this._v[13]) < delta && Math.abs(v[14] - this._v[14]) < delta && Math.abs(v[15] - this._v[15]) < delta) {
      return true;
    }
    return false;
  }
  /**
   * Checks if this matrix is exactly equal to another matrix.
   * Uses strict equality comparison for all elements.
   * @param mat - The matrix to compare with
   * @returns true if matrices are exactly equal, false otherwise
   */
  isStrictEqual(mat) {
    if (mat._v[0] === this._v[0] && mat._v[1] === this._v[1] && mat._v[2] === this._v[2] && mat._v[3] === this._v[3] && mat._v[4] === this._v[4] && mat._v[5] === this._v[5] && mat._v[6] === this._v[6] && mat._v[7] === this._v[7] && mat._v[8] === this._v[8] && mat._v[9] === this._v[9] && mat._v[10] === this._v[10] && mat._v[11] === this._v[11] && mat._v[12] === this._v[12] && mat._v[13] === this._v[13] && mat._v[14] === this._v[14] && mat._v[15] === this._v[15]) {
      return true;
    }
    return false;
  }
  /**
   * Gets a matrix element at the specified row and column.
   * @param row_i - The row index (0-3)
   * @param column_i - The column index (0-3)
   * @returns The matrix element at the given position
   */
  at(row_i, column_i) {
    return this._v[row_i + column_i * 4];
  }
  /**
   * Calculates the determinant of this 4x4 matrix.
   * @returns The determinant value
   */
  determinant() {
    return this._v[0] * this._v[5] * this._v[10] * this._v[15] + this._v[0] * this._v[9] * this._v[14] * this._v[7] + this._v[0] * this._v[13] * this._v[6] * this._v[11] + this._v[4] * this._v[1] * this._v[14] * this._v[11] + this._v[4] * this._v[9] * this._v[2] * this._v[15] + this._v[4] * this._v[13] * this._v[10] * this._v[3] + this._v[8] * this._v[1] * this._v[6] * this._v[15] + this._v[8] * this._v[5] * this._v[14] * this._v[3] + this._v[8] * this._v[13] * this._v[2] * this._v[7] + this._v[12] * this._v[1] * this._v[10] * this._v[7] + this._v[12] * this._v[5] * this._v[2] * this._v[11] + this._v[12] * this._v[9] * this._v[6] * this._v[3] - this._v[0] * this._v[5] * this._v[14] * this._v[11] - this._v[0] * this._v[9] * this._v[6] * this._v[15] - this._v[0] * this._v[13] * this._v[10] * this._v[7] - this._v[4] * this._v[1] * this._v[10] * this._v[15] - this._v[4] * this._v[9] * this._v[14] * this._v[3] - this._v[4] * this._v[13] * this._v[2] * this._v[11] - this._v[8] * this._v[1] * this._v[14] * this._v[7] - this._v[8] * this._v[5] * this._v[2] * this._v[15] - this._v[8] * this._v[13] * this._v[6] * this._v[3] - this._v[12] * this._v[1] * this._v[6] * this._v[11] - this._v[12] * this._v[5] * this._v[10] * this._v[3] - this._v[12] * this._v[9] * this._v[2] * this._v[7];
  }
  /**
   * Multiplies this matrix with a 4D vector and returns the result.
   * @param vec - The 4D vector to multiply
   * @returns A new Vector4 containing the multiplication result
   */
  multiplyVector(vec) {
    const x = this._v[0] * vec._v[0] + this._v[4] * vec._v[1] + this._v[8] * vec._v[2] + this._v[12] * vec._v[3];
    const y = this._v[1] * vec._v[0] + this._v[5] * vec._v[1] + this._v[9] * vec._v[2] + this._v[13] * vec._v[3];
    const z = this._v[2] * vec._v[0] + this._v[6] * vec._v[1] + this._v[10] * vec._v[2] + this._v[14] * vec._v[3];
    const w = this._v[3] * vec._v[0] + this._v[7] * vec._v[1] + this._v[11] * vec._v[2] + this._v[15] * vec._v[3];
    return Vector4.fromCopyArray([x, y, z, w]);
  }
  /**
   * Multiplies this matrix with a 4D vector and stores the result in an output vector.
   * @param vec - The 4D vector to multiply
   * @param outVec - The output vector to store the result
   * @returns The output vector containing the multiplication result
   */
  multiplyVectorTo(vec, outVec) {
    const x = this._v[0] * vec._v[0] + this._v[4] * vec._v[1] + this._v[8] * vec._v[2] + this._v[12] * vec._v[3];
    const y = this._v[1] * vec._v[0] + this._v[5] * vec._v[1] + this._v[9] * vec._v[2] + this._v[13] * vec._v[3];
    const z = this._v[2] * vec._v[0] + this._v[6] * vec._v[1] + this._v[10] * vec._v[2] + this._v[14] * vec._v[3];
    const w = this._v[3] * vec._v[0] + this._v[7] * vec._v[1] + this._v[11] * vec._v[2] + this._v[15] * vec._v[3];
    outVec._v[0] = x;
    outVec._v[1] = y;
    outVec._v[2] = z;
    outVec._v[3] = w;
    return outVec;
  }
  /**
   * Multiplies this matrix with a 4D vector and stores the XYZ components in a 3D vector.
   * @param vec - The 4D vector to multiply
   * @param outVec - The output 3D vector to store the XYZ components
   * @returns The output vector containing the XYZ components of the result
   */
  multiplyVectorToVec3(vec, outVec) {
    const x = this._v[0] * vec._v[0] + this._v[4] * vec._v[1] + this._v[8] * vec._v[2] + this._v[12] * vec._v[3];
    const y = this._v[1] * vec._v[0] + this._v[5] * vec._v[1] + this._v[9] * vec._v[2] + this._v[13] * vec._v[3];
    const z = this._v[2] * vec._v[0] + this._v[6] * vec._v[1] + this._v[10] * vec._v[2] + this._v[14] * vec._v[3];
    outVec._v[0] = x;
    outVec._v[1] = y;
    outVec._v[2] = z;
    return outVec;
  }
  /**
   * Multiplies this matrix with a 3D vector (treating it as a point with w=1).
   * @param vec - The 3D vector to multiply
   * @returns A new Vector3 containing the transformed point
   */
  multiplyVector3(vec) {
    const x = this._v[0] * vec._v[0] + this._v[4] * vec._v[1] + this._v[8] * vec._v[2] + this._v[12];
    const y = this._v[1] * vec._v[0] + this._v[5] * vec._v[1] + this._v[9] * vec._v[2] + this._v[13];
    const z = this._v[2] * vec._v[0] + this._v[6] * vec._v[1] + this._v[10] * vec._v[2] + this._v[14];
    return Vector3.fromCopyArray([x, y, z]);
  }
  /**
   * Multiplies this matrix with a 3D vector and stores the result (treating it as a point with w=1).
   * @param vec - The 3D vector to multiply
   * @param outVec - The output vector to store the result
   * @returns The output vector containing the transformed point
   */
  multiplyVector3To(vec, outVec) {
    const x = this._v[0] * vec._v[0] + this._v[4] * vec._v[1] + this._v[8] * vec._v[2] + this._v[12];
    const y = this._v[1] * vec._v[0] + this._v[5] * vec._v[1] + this._v[9] * vec._v[2] + this._v[13];
    const z = this._v[2] * vec._v[0] + this._v[6] * vec._v[1] + this._v[10] * vec._v[2] + this._v[14];
    outVec._v[0] = x;
    outVec._v[1] = y;
    outVec._v[2] = z;
    return outVec;
  }
  /**
   * Extracts the translation vector from this transformation matrix.
   * @returns A new Vector3 containing the translation components
   */
  getTranslate() {
    return Vector3.fromCopyArray([this._v[12], this._v[13], this._v[14]]);
  }
  /**
   * Extracts the translation vector from this matrix and stores it in an output vector.
   * @param outVec - The output vector to store the translation
   * @returns The output vector containing the translation components
   */
  getTranslateTo(outVec) {
    outVec._v[0] = this._v[12];
    outVec._v[1] = this._v[13];
    outVec._v[2] = this._v[14];
    return outVec;
  }
  /**
   * Extracts the scale factors from this transformation matrix.
   * @returns A new Vector3 containing the scale components for each axis
   */
  getScale() {
    return Vector3.fromCopyArray([
      Math.hypot(this._v[0], this._v[1], this._v[2]),
      Math.hypot(this._v[4], this._v[5], this._v[6]),
      Math.hypot(this._v[8], this._v[9], this._v[10])
    ]);
  }
  /**
   * Extracts the scale factors from this matrix and stores them in an output vector.
   * @param outVec - The output vector to store the scale factors
   * @returns The output vector containing the scale components
   */
  getScaleTo(outVec) {
    outVec._v[0] = Math.hypot(this._v[0], this._v[1], this._v[2]);
    outVec._v[1] = Math.hypot(this._v[4], this._v[5], this._v[6]);
    outVec._v[2] = Math.hypot(this._v[8], this._v[9], this._v[10]);
    return outVec;
  }
  /**
   * Converts this transformation matrix to Euler angles (XYZ rotation order).
   * @returns A Vector3 containing the Euler angles [x, y, z] in radians
   */
  toEulerAngles() {
    let rotate;
    if (Math.abs(this._v[2]) !== 1) {
      const y = -Math.asin(this._v[2]);
      const x = Math.atan2(this._v[6] / Math.cos(y), this._v[10] / Math.cos(y));
      const z = Math.atan2(this._v[1] / Math.cos(y), this._v[0] / Math.cos(y));
      rotate = Vector3.fromCopyArray([x, y, z]);
    } else if (this._v[2] === -1) {
      rotate = Vector3.fromCopyArray([Math.atan2(this._v[4], this._v[8]), Math.PI / 2, 0]);
    } else {
      rotate = Vector3.fromCopyArray([Math.atan2(-this._v[4], -this._v[8]), -Math.PI / 2, 0]);
    }
    return rotate;
  }
  /**
   * Converts this transformation matrix to Euler angles and stores them in an output vector.
   * @param outVec3 - The output vector to store the Euler angles
   * @returns The output vector containing the Euler angles [x, y, z] in radians
   */
  toEulerAnglesTo(outVec3) {
    if (Math.abs(this._v[2]) !== 1) {
      const y = -Math.asin(this._v[2]);
      const x = Math.atan2(this._v[6] / Math.cos(y), this._v[10] / Math.cos(y));
      const z = Math.atan2(this._v[1] / Math.cos(y), this._v[0] / Math.cos(y));
      outVec3._v[0] = x;
      outVec3._v[1] = y;
      outVec3._v[2] = z;
    } else if (this._v[2] === -1) {
      outVec3._v[0] = Math.atan2(this._v[4], this._v[8]);
      outVec3._v[1] = Math.PI / 2;
      outVec3._v[2] = 0;
    } else {
      outVec3._v[0] = Math.atan2(-this._v[4], -this._v[8]);
      outVec3._v[1] = -Math.PI / 2;
      outVec3._v[2] = 0;
    }
    return outVec3;
  }
  /**
   * Creates a deep copy of this matrix.
   * @returns A new Matrix44 instance with the same values
   */
  clone() {
    return this.constructor.fromCopy16RowMajor(
      this._v[0],
      this._v[4],
      this._v[8],
      this._v[12],
      this._v[1],
      this._v[5],
      this._v[9],
      this._v[13],
      this._v[2],
      this._v[6],
      this._v[10],
      this._v[14],
      this._v[3],
      this._v[7],
      this._v[11],
      this._v[15]
    );
  }
  /**
   * Extracts the rotation part of this transformation matrix.
   * Removes scaling effects to get pure rotation.
   * @returns A new Matrix44 containing only the rotation transformation
   */
  getRotate() {
    const scaleX = Math.hypot(this._v[0], this._v[1], this._v[2]);
    const scaleY = Math.hypot(this._v[4], this._v[5], this._v[6]);
    const scaleZ = Math.hypot(this._v[8], this._v[9], this._v[10]);
    const mat = Matrix44.fromCopy16RowMajor(
      this._v[0] / scaleX,
      this._v[4],
      this._v[8],
      0,
      this._v[1],
      this._v[5] / scaleY,
      this._v[9],
      0,
      this._v[2],
      this._v[6],
      this._v[10] / scaleZ,
      0,
      0,
      0,
      0,
      1
    );
    return mat;
  }
  /**
   * Creates a matrix from 16 individual values in row-major order.
   * This is the most intuitive way to specify matrix values, as you can
   * write them in the same 4x4 layout as they appear visually.
   * Note that internally, WebGL uses column-major storage.
   *
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
   * @returns A new Matrix44 instance
   */
  static _fromCopy16RowMajor(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33, type) {
    const v = new type(16);
    v[0] = m00;
    v[4] = m01;
    v[8] = m02;
    v[12] = m03;
    v[1] = m10;
    v[5] = m11;
    v[9] = m12;
    v[13] = m13;
    v[2] = m20;
    v[6] = m21;
    v[10] = m22;
    v[14] = m23;
    v[3] = m30;
    v[7] = m31;
    v[11] = m32;
    v[15] = m33;
    return new this(v, { type });
  }
  /**
   * Creates a matrix from 16 individual values in column-major order.
   * This matches the internal storage format used by WebGL.
   *
   * @param m00 - Element at row 0, column 0
   * @param m10 - Element at row 1, column 0
   * @param m20 - Element at row 2, column 0
   * @param m30 - Element at row 3, column 0
   * @param m01 - Element at row 0, column 1
   * @param m11 - Element at row 1, column 1
   * @param m21 - Element at row 2, column 1
   * @param m31 - Element at row 3, column 1
   * @param m02 - Element at row 0, column 2
   * @param m12 - Element at row 1, column 2
   * @param m22 - Element at row 2, column 2
   * @param m32 - Element at row 3, column 2
   * @param m03 - Element at row 0, column 3
   * @param m13 - Element at row 1, column 3
   * @param m23 - Element at row 2, column 3
   * @param m33 - Element at row 3, column 3
   * @returns A new Matrix44 instance
   */
  static _fromCopy16ColumnMajor(m00, m10, m20, m30, m01, m11, m21, m31, m02, m12, m22, m32, m03, m13, m23, m33, type) {
    const v = new type(16);
    v[0] = m00;
    v[4] = m01;
    v[8] = m02;
    v[12] = m03;
    v[1] = m10;
    v[5] = m11;
    v[9] = m12;
    v[13] = m13;
    v[2] = m20;
    v[6] = m21;
    v[10] = m22;
    v[14] = m23;
    v[3] = m30;
    v[7] = m31;
    v[11] = m32;
    v[15] = m33;
    return new this(v, { type });
  }
  /**
   * Creates a new matrix by copying another Matrix44 instance.
   * @param mat - The source matrix to copy
   * @returns A new Matrix44 instance with copied values
   */
  static _fromCopyMatrix44(mat, type) {
    const v = new type(16);
    v.set(mat._v);
    return new this(v, { type });
  }
  /**
   * Creates a matrix directly from a Float32Array in column-major order.
   * The array is used directly without copying (shares the same memory).
   * @param float32Array - A Float32Array containing 16 matrix elements
   * @returns A new Matrix44 instance using the provided array
   */
  static _fromTypedArrayColumnMajor(array, type) {
    return new this(array, { type });
  }
  /**
   * Creates a matrix from a Float32Array in column-major order with copying.
   * @param float32Array - A Float32Array containing 16 matrix elements
   * @returns A new Matrix44 instance with copied values
   */
  static _fromCopyTypedArrayColumnMajor(array, type) {
    const v = new type(16);
    v.set(array);
    return new this(v, { type });
  }
  /**
   * Creates a matrix from a Float32Array in row-major order with copying.
   * The input array is assumed to be in row-major order and will be converted
   * to column-major order for internal storage.
   * @param array - A Float32Array containing 16 matrix elements in row-major order
   * @returns A new Matrix44 instance with converted values
   */
  static _fromCopyTypedArrayRowMajor(array, type) {
    const v = new type(16);
    v[0] = array[0];
    v[4] = array[1];
    v[8] = array[2];
    v[12] = array[3];
    v[1] = array[4];
    v[5] = array[5];
    v[9] = array[6];
    v[13] = array[7];
    v[2] = array[8];
    v[6] = array[9];
    v[10] = array[10];
    v[14] = array[11];
    v[3] = array[12];
    v[7] = array[13];
    v[11] = array[14];
    v[15] = array[15];
    return new this(v, { type });
  }
  /**
   * Creates a 4x4 matrix from a 3x3 matrix by embedding it in the upper-left corner.
   * The resulting matrix has the 3x3 matrix in the upper-left, with the bottom-right
   * element set to 1 and other elements set to 0.
   * @param mat - The 3x3 matrix to embed
   * @returns A new Matrix44 instance
   */
  static _fromCopyMatrix33(mat, type) {
    const v = new type(16);
    v[0] = mat._v[0];
    v[4] = mat._v[3];
    v[8] = mat._v[6];
    v[12] = 0;
    v[1] = mat._v[1];
    v[5] = mat._v[4];
    v[9] = mat._v[7];
    v[13] = 0;
    v[2] = mat._v[2];
    v[6] = mat._v[5];
    v[10] = mat._v[8];
    v[14] = 0;
    v[3] = 0;
    v[7] = 0;
    v[11] = 0;
    v[15] = 1;
    return new this(v, { type });
  }
  /**
   * Creates a matrix from a fixed-size array (Array16) in column-major order.
   * @param array - An Array16 containing exactly 16 matrix elements
   * @returns A new Matrix44 instance with copied values
   */
  static _fromCopyArray16ColumnMajor(array, type) {
    const v = new type(16);
    v.set(array);
    return new this(v, { type });
  }
  /**
   * Creates a matrix from a variable-length array in column-major order.
   * @param array - An array containing at least 16 matrix elements
   * @returns A new Matrix44 instance with copied values
   */
  static _fromCopyArrayColumnMajor(array, type) {
    const v = new type(16);
    v.set(array);
    return new this(v, { type });
  }
  /**
   * Creates a matrix from a fixed-size array (Array16) in row-major order.
   * The input array is converted from row-major to column-major order.
   * @param array - An Array16 containing exactly 16 matrix elements in row-major order
   * @returns A new Matrix44 instance with converted values
   */
  static _fromCopyArray16RowMajor(array, type) {
    const v = new type(16);
    v[0] = array[0];
    v[4] = array[1];
    v[8] = array[2];
    v[12] = array[3];
    v[1] = array[4];
    v[5] = array[5];
    v[9] = array[6];
    v[13] = array[7];
    v[2] = array[8];
    v[6] = array[9];
    v[10] = array[10];
    v[14] = array[11];
    v[3] = array[12];
    v[7] = array[13];
    v[11] = array[14];
    v[15] = array[15];
    return new this(v, { type });
  }
  /**
   * Creates a matrix from a variable-length array in row-major order.
   * The input array is converted from row-major to column-major order.
   * @param array - An array containing at least 16 matrix elements in row-major order
   * @returns A new Matrix44 instance with converted values
   */
  static _fromCopyArrayRowMajor(array, type) {
    const v = new type(16);
    v[0] = array[0];
    v[4] = array[1];
    v[8] = array[2];
    v[12] = array[3];
    v[1] = array[4];
    v[5] = array[5];
    v[9] = array[6];
    v[13] = array[7];
    v[2] = array[8];
    v[6] = array[9];
    v[10] = array[10];
    v[14] = array[11];
    v[3] = array[12];
    v[7] = array[13];
    v[11] = array[14];
    v[15] = array[15];
    return new this(v, { type });
  }
  /**
   * Creates a rotation matrix from a quaternion.
   * @param q - The quaternion representing the rotation
   * @returns A new Matrix44 instance representing the rotation transformation
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
    const v = new type(16);
    v[0] = 1 - 2 * (sy + sz);
    v[4] = 2 * (cz - wz);
    v[8] = 2 * (cy + wy);
    v[12] = 0;
    v[1] = 2 * (cz + wz);
    v[5] = 1 - 2 * (sx + sz);
    v[9] = 2 * (cx - wx);
    v[13] = 0;
    v[2] = 2 * (cy - wy);
    v[6] = 2 * (cx + wx);
    v[10] = 1 - 2 * (sx + sy);
    v[14] = 0;
    v[3] = 0;
    v[7] = 0;
    v[11] = 0;
    v[15] = 1;
    return new this(v, { type });
  }
};
var Matrix44 = class extends Matrix44_ {
  /**
   * Creates a new Matrix44 instance.
   * @param m - The typed array containing the matrix components
   */
  constructor(m) {
    super(m, { type: Float32Array });
  }
  /** Creates a zero matrix. */
  static zero() {
    return super._zero(Float32Array);
  }
  /** Creates an identity matrix (optimized IdentityMatrix44 instance). */
  static identity() {
    return new IdentityMatrix44();
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
  /** Creates a translation matrix. */
  static translate(vec) {
    return super._translate(vec, Float32Array);
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
  /** Creates a rotation matrix from a vector containing Euler angles. */
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
  /** Multiplies a matrix with typed array data and stores the result in outMat. */
  static multiplyTypedArrayTo(l_mat, r_array, outMat, offsetAsComposition) {
    return super._multiplyTypedArrayTo(l_mat, r_array, outMat, offsetAsComposition);
  }
  /** Creates a rotation matrix from a quaternion and stores it in outMat. */
  static fromQuaternionTo(quat, outMat) {
    return super._fromQuaternionTo(quat, outMat);
  }
  /** Creates a matrix from row-major components. */
  // prettier-ignore
  static fromCopy16RowMajor(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
    return super._fromCopy16RowMajor(
      m00,
      m01,
      m02,
      m03,
      m10,
      m11,
      m12,
      m13,
      m20,
      m21,
      m22,
      m23,
      m30,
      m31,
      m32,
      m33,
      Float32Array
    );
  }
  /** Creates a matrix from column-major components. */
  // prettier-ignore
  static fromCopy16ColumnMajor(m00, m10, m20, m30, m01, m11, m21, m31, m02, m12, m22, m32, m03, m13, m23, m33) {
    return super._fromCopy16ColumnMajor(
      m00,
      m10,
      m20,
      m30,
      m01,
      m11,
      m21,
      m31,
      m02,
      m12,
      m22,
      m32,
      m03,
      m13,
      m23,
      m33,
      Float32Array
    );
  }
  /** Creates a matrix by copying another matrix. */
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
  /** Creates a matrix from a 3x3 matrix embedded in the upper-left corner. */
  static fromCopyMatrix33(mat) {
    return super._fromCopyMatrix33(mat, Float32Array);
  }
  /** Creates a matrix from a 16-element array in column-major order. */
  static fromCopyArray16ColumnMajor(array) {
    return super._fromCopyArray16ColumnMajor(array, Float32Array);
  }
  /** Creates a matrix from an array in column-major order. */
  static fromCopyArrayColumnMajor(array) {
    return super._fromCopyArrayColumnMajor(array, Float32Array);
  }
  /** Creates a matrix from a 16-element array in row-major order. */
  static fromCopyArray16RowMajor(array) {
    return super._fromCopyArray16RowMajor(array, Float32Array);
  }
  /** Creates a matrix from an array in row-major order. */
  static fromCopyArrayRowMajor(array) {
    return super._fromCopyArrayRowMajor(array, Float32Array);
  }
  /** Creates a rotation matrix from a quaternion. */
  static fromCopyQuaternion(q) {
    return super._fromCopyQuaternion(q, Float32Array);
  }
};
var Matrix44D = class extends Matrix44_ {
  /**
   * Creates a new Matrix44D instance.
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
  /** Creates a translation matrix. */
  static translate(vec) {
    return super._translate(vec, Float64Array);
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
  /** Creates a rotation matrix from a vector containing Euler angles. */
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
  /** Multiplies a matrix with typed array data and stores the result in outMat. */
  static multiplyTypedArrayTo(l_mat, r_array, outMat, offsetAsComposition) {
    return super._multiplyTypedArrayTo(l_mat, r_array, outMat, offsetAsComposition);
  }
  /** Creates a rotation matrix from a quaternion and stores it in outMat. */
  static fromQuaternionTo(quat, outMat) {
    return super._fromQuaternionTo(quat, outMat);
  }
  /** Creates a matrix from row-major components. */
  // prettier-ignore
  static fromCopy16RowMajor(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
    return super._fromCopy16RowMajor(
      m00,
      m01,
      m02,
      m03,
      m10,
      m11,
      m12,
      m13,
      m20,
      m21,
      m22,
      m23,
      m30,
      m31,
      m32,
      m33,
      Float64Array
    );
  }
  /** Creates a matrix from column-major components. */
  // prettier-ignore
  static fromCopy16ColumnMajor(m00, m10, m20, m30, m01, m11, m21, m31, m02, m12, m22, m32, m03, m13, m23, m33) {
    return super._fromCopy16ColumnMajor(
      m00,
      m10,
      m20,
      m30,
      m01,
      m11,
      m21,
      m31,
      m02,
      m12,
      m22,
      m32,
      m03,
      m13,
      m23,
      m33,
      Float64Array
    );
  }
  /** Creates a matrix by copying another matrix. */
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
  /** Creates a matrix from a 3x3 matrix embedded in the upper-left corner. */
  static fromCopyMatrix33(mat) {
    return super._fromCopyMatrix33(mat, Float64Array);
  }
  /** Creates a matrix from a 16-element array in column-major order. */
  static fromCopyArray16ColumnMajor(array) {
    return super._fromCopyArray16ColumnMajor(array, Float64Array);
  }
  /** Creates a matrix from an array in column-major order. */
  static fromCopyArrayColumnMajor(array) {
    return super._fromCopyArrayColumnMajor(array, Float64Array);
  }
  /** Creates a matrix from a 16-element array in row-major order. */
  static fromCopyArray16RowMajor(array) {
    return super._fromCopyArray16RowMajor(array, Float64Array);
  }
  /** Creates a matrix from an array in row-major order. */
  static fromCopyArrayRowMajor(array) {
    return super._fromCopyArrayRowMajor(array, Float64Array);
  }
  /** Creates a rotation matrix from a quaternion. */
  static fromCopyQuaternion(q) {
    return super._fromCopyQuaternion(q, Float64Array);
  }
};
export {
  Matrix44,
  Matrix44D,
  Matrix44 as Matrix44F,
  Matrix44_
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9NYXRyaXg0NC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBBcnJheTE2LCBBcnJheVR5cGUsIEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yLCBUeXBlZEFycmF5IH0gZnJvbSAnLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHsgQ29tcG9zaXRpb25UeXBlLCB0eXBlIENvbXBvc2l0aW9uVHlwZUVudW0gfSBmcm9tICcuLi9kZWZpbml0aW9ucy9Db21wb3NpdGlvblR5cGUnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHsgQWJzdHJhY3RNYXRyaXggfSBmcm9tICcuL0Fic3RyYWN0TWF0cml4JztcbmltcG9ydCB7IElkZW50aXR5TWF0cml4NDQgfSBmcm9tICcuL0lkZW50aXR5TWF0cml4NDQnO1xuaW1wb3J0IHR5cGUgeyBJTWF0cml4LCBJTWF0cml4MzMsIElNYXRyaXg0NCwgSU11dGFibGVNYXRyaXg0NCB9IGZyb20gJy4vSU1hdHJpeCc7XG5pbXBvcnQgdHlwZSB7IElRdWF0ZXJuaW9uIH0gZnJvbSAnLi9JUXVhdGVybmlvbic7XG5pbXBvcnQgdHlwZSB7IElWZWN0b3IzLCBJVmVjdG9yNCB9IGZyb20gJy4vSVZlY3Rvcic7XG5pbXBvcnQgeyBNYXRoVXRpbCB9IGZyb20gJy4vTWF0aFV0aWwnO1xuaW1wb3J0IHR5cGUgeyBNdXRhYmxlVmVjdG9yMyB9IGZyb20gJy4vTXV0YWJsZVZlY3RvcjMnO1xuaW1wb3J0IHR5cGUgeyBNdXRhYmxlVmVjdG9yNCB9IGZyb20gJy4vTXV0YWJsZVZlY3RvcjQnO1xuaW1wb3J0IHsgbXVsVGhhdEFuZFRoaXNUb091dEFzTWF0NDRfb2Zmc2V0QXNDb21wb3NpdGlvbiB9IGZyb20gJy4vcmF3L3Jhd19leHRlbnNpb24nO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJy4vVmVjdG9yMyc7XG5pbXBvcnQgeyBWZWN0b3I0IH0gZnJvbSAnLi9WZWN0b3I0JztcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgNHg0IG1hdHJpeCBzdG9yZWQgaW4gY29sdW1uLW1ham9yIG9yZGVyIChPcGVuR0wvV2ViR0wgc3R5bGUpLlxuICogVGhpcyBjbGFzcyBwcm92aWRlcyBpbW11dGFibGUgbWF0cml4IG9wZXJhdGlvbnMgYW5kIGlzIHVzZWQgZm9yIDNEIHRyYW5zZm9ybWF0aW9uc1xuICogaW5jbHVkaW5nIHRyYW5zbGF0aW9uLCByb3RhdGlvbiwgYW5kIHNjYWxpbmcuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnN0IGlkZW50aXR5ID0gTWF0cml4NDQuaWRlbnRpdHkoKTtcbiAqIGNvbnN0IHRyYW5zbGF0aW9uID0gTWF0cml4NDQudHJhbnNsYXRlKFZlY3RvcjMuZnJvbUNvcHlBcnJheShbMSwgMiwgM10pKTtcbiAqIGNvbnN0IHJlc3VsdCA9IE1hdHJpeDQ0Lm11bHRpcGx5KGlkZW50aXR5LCB0cmFuc2xhdGlvbik7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIE1hdHJpeDQ0XzxUIGV4dGVuZHMgRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3I+IGV4dGVuZHMgQWJzdHJhY3RNYXRyaXggaW1wbGVtZW50cyBJTWF0cml4LCBJTWF0cml4NDQge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNYXRyaXg0NF8gaW5zdGFuY2UuXG4gICAqIEBwYXJhbSBtIC0gQSB0eXBlZCBhcnJheSBjb250YWluaW5nIDE2IG1hdHJpeCBlbGVtZW50cyBpbiBjb2x1bW4tbWFqb3Igb3JkZXJcbiAgICogQHBhcmFtIF9vcHRpb25zIC0gQ29uZmlndXJhdGlvbiBvYmplY3QgY29udGFpbmluZyB0aGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3JcbiAgICovXG4gIGNvbnN0cnVjdG9yKG06IFR5cGVkQXJyYXksIF9vcHRpb25zOiB7IHR5cGU6IFQgfSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fdiA9IG07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF0cml4IGVsZW1lbnQgYXQgcm93IDAsIGNvbHVtbiAwLlxuICAgKiBAcmV0dXJucyBUaGUgbTAwIGNvbXBvbmVudCBvZiB0aGUgbWF0cml4XG4gICAqL1xuICBwdWJsaWMgZ2V0IG0wMCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92WzBdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHJvdyAxLCBjb2x1bW4gMC5cbiAgICogQHJldHVybnMgVGhlIG0xMCBjb21wb25lbnQgb2YgdGhlIG1hdHJpeFxuICAgKi9cbiAgcHVibGljIGdldCBtMTAoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdlsxXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCByb3cgMiwgY29sdW1uIDAuXG4gICAqIEByZXR1cm5zIFRoZSBtMjAgY29tcG9uZW50IG9mIHRoZSBtYXRyaXhcbiAgICovXG4gIHB1YmxpYyBnZXQgbTIwKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMl07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF0cml4IGVsZW1lbnQgYXQgcm93IDMsIGNvbHVtbiAwLlxuICAgKiBAcmV0dXJucyBUaGUgbTMwIGNvbXBvbmVudCBvZiB0aGUgbWF0cml4XG4gICAqL1xuICBwdWJsaWMgZ2V0IG0zMCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92WzNdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHJvdyAwLCBjb2x1bW4gMS5cbiAgICogQHJldHVybnMgVGhlIG0wMSBjb21wb25lbnQgb2YgdGhlIG1hdHJpeFxuICAgKi9cbiAgcHVibGljIGdldCBtMDEoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdls0XTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCByb3cgMSwgY29sdW1uIDEuXG4gICAqIEByZXR1cm5zIFRoZSBtMTEgY29tcG9uZW50IG9mIHRoZSBtYXRyaXhcbiAgICovXG4gIHB1YmxpYyBnZXQgbTExKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbNV07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF0cml4IGVsZW1lbnQgYXQgcm93IDIsIGNvbHVtbiAxLlxuICAgKiBAcmV0dXJucyBUaGUgbTIxIGNvbXBvbmVudCBvZiB0aGUgbWF0cml4XG4gICAqL1xuICBwdWJsaWMgZ2V0IG0yMSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92WzZdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHJvdyAzLCBjb2x1bW4gMS5cbiAgICogQHJldHVybnMgVGhlIG0zMSBjb21wb25lbnQgb2YgdGhlIG1hdHJpeFxuICAgKi9cbiAgcHVibGljIGdldCBtMzEoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdls3XTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCByb3cgMCwgY29sdW1uIDIuXG4gICAqIEByZXR1cm5zIFRoZSBtMDIgY29tcG9uZW50IG9mIHRoZSBtYXRyaXhcbiAgICovXG4gIHB1YmxpYyBnZXQgbTAyKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbOF07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF0cml4IGVsZW1lbnQgYXQgcm93IDEsIGNvbHVtbiAyLlxuICAgKiBAcmV0dXJucyBUaGUgbTEyIGNvbXBvbmVudCBvZiB0aGUgbWF0cml4XG4gICAqL1xuICBwdWJsaWMgZ2V0IG0xMigpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92WzldO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHJvdyAyLCBjb2x1bW4gMi5cbiAgICogQHJldHVybnMgVGhlIG0yMiBjb21wb25lbnQgb2YgdGhlIG1hdHJpeFxuICAgKi9cbiAgcHVibGljIGdldCBtMjIoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdlsxMF07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF0cml4IGVsZW1lbnQgYXQgcm93IDMsIGNvbHVtbiAyLlxuICAgKiBAcmV0dXJucyBUaGUgbTMyIGNvbXBvbmVudCBvZiB0aGUgbWF0cml4XG4gICAqL1xuICBwdWJsaWMgZ2V0IG0zMigpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92WzExXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCByb3cgMCwgY29sdW1uIDMuXG4gICAqIEByZXR1cm5zIFRoZSBtMDMgY29tcG9uZW50IG9mIHRoZSBtYXRyaXhcbiAgICovXG4gIHB1YmxpYyBnZXQgbTAzKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMTJdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHJvdyAxLCBjb2x1bW4gMy5cbiAgICogQHJldHVybnMgVGhlIG0xMyBjb21wb25lbnQgb2YgdGhlIG1hdHJpeFxuICAgKi9cbiAgcHVibGljIGdldCBtMTMoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdlsxM107XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF0cml4IGVsZW1lbnQgYXQgcm93IDIsIGNvbHVtbiAzLlxuICAgKiBAcmV0dXJucyBUaGUgbTIzIGNvbXBvbmVudCBvZiB0aGUgbWF0cml4XG4gICAqL1xuICBwdWJsaWMgZ2V0IG0yMygpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92WzE0XTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCByb3cgMywgY29sdW1uIDMuXG4gICAqIEByZXR1cm5zIFRoZSBtMzMgY29tcG9uZW50IG9mIHRoZSBtYXRyaXhcbiAgICovXG4gIHB1YmxpYyBnZXQgbTMzKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMTVdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIFggY29tcG9uZW50IG9mIHRoZSB0cmFuc2xhdGlvbiB2ZWN0b3IgZnJvbSB0aGlzIG1hdHJpeC5cbiAgICogQHJldHVybnMgVGhlIFggdHJhbnNsYXRpb24gdmFsdWVcbiAgICovXG4gIHB1YmxpYyBnZXQgdHJhbnNsYXRlWCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92WzEyXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBZIGNvbXBvbmVudCBvZiB0aGUgdHJhbnNsYXRpb24gdmVjdG9yIGZyb20gdGhpcyBtYXRyaXguXG4gICAqIEByZXR1cm5zIFRoZSBZIHRyYW5zbGF0aW9uIHZhbHVlXG4gICAqL1xuICBwdWJsaWMgZ2V0IHRyYW5zbGF0ZVkoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdlsxM107XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgWiBjb21wb25lbnQgb2YgdGhlIHRyYW5zbGF0aW9uIHZlY3RvciBmcm9tIHRoaXMgbWF0cml4LlxuICAgKiBAcmV0dXJucyBUaGUgWiB0cmFuc2xhdGlvbiB2YWx1ZVxuICAgKi9cbiAgcHVibGljIGdldCB0cmFuc2xhdGVaKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMTRdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNvbXBvc2l0aW9uIHR5cGUgZm9yIHRoaXMgbWF0cml4IGNsYXNzLlxuICAgKiBAcmV0dXJucyBUaGUgY29tcG9zaXRpb24gdHlwZSBlbnVtIHZhbHVlXG4gICAqL1xuICBzdGF0aWMgZ2V0IGNvbXBvc2l0aW9uVHlwZSgpOiBDb21wb3NpdGlvblR5cGVFbnVtIHtcbiAgICByZXR1cm4gQ29tcG9zaXRpb25UeXBlLk1hdDQ7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgdGhlIG1hdHJpeCB0byBhIEdMU0wgbWF0NCBzdHJpbmcgcmVwcmVzZW50YXRpb24gd2l0aCBmbG9hdCBwcmVjaXNpb24uXG4gICAqIEByZXR1cm5zIEEgR0xTTC1jb21wYXRpYmxlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgbWF0cml4XG4gICAqL1xuICBnZXQgZ2xzbFN0ckFzRmxvYXQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYG1hdDQoJHtNYXRoVXRpbC5jb252ZXJ0VG9TdHJpbmdBc0dMU0xGbG9hdCh0aGlzLl92WzBdKX0sICR7TWF0aFV0aWwuY29udmVydFRvU3RyaW5nQXNHTFNMRmxvYXQodGhpcy5fdlsxXSl9LCAke01hdGhVdGlsLmNvbnZlcnRUb1N0cmluZ0FzR0xTTEZsb2F0KHRoaXMuX3ZbMl0pfSwgJHtNYXRoVXRpbC5jb252ZXJ0VG9TdHJpbmdBc0dMU0xGbG9hdCh0aGlzLl92WzNdKX0sICR7TWF0aFV0aWwuY29udmVydFRvU3RyaW5nQXNHTFNMRmxvYXQodGhpcy5fdls0XSl9LCAke01hdGhVdGlsLmNvbnZlcnRUb1N0cmluZ0FzR0xTTEZsb2F0KHRoaXMuX3ZbNV0pfSwgJHtNYXRoVXRpbC5jb252ZXJ0VG9TdHJpbmdBc0dMU0xGbG9hdCh0aGlzLl92WzZdKX0sICR7TWF0aFV0aWwuY29udmVydFRvU3RyaW5nQXNHTFNMRmxvYXQodGhpcy5fdls3XSl9LCAke01hdGhVdGlsLmNvbnZlcnRUb1N0cmluZ0FzR0xTTEZsb2F0KHRoaXMuX3ZbOF0pfSwgJHtNYXRoVXRpbC5jb252ZXJ0VG9TdHJpbmdBc0dMU0xGbG9hdCh0aGlzLl92WzldKX0sICR7TWF0aFV0aWwuY29udmVydFRvU3RyaW5nQXNHTFNMRmxvYXQodGhpcy5fdlsxMF0pfSwgJHtNYXRoVXRpbC5jb252ZXJ0VG9TdHJpbmdBc0dMU0xGbG9hdCh0aGlzLl92WzExXSl9LCAke01hdGhVdGlsLmNvbnZlcnRUb1N0cmluZ0FzR0xTTEZsb2F0KHRoaXMuX3ZbMTJdKX0sICR7TWF0aFV0aWwuY29udmVydFRvU3RyaW5nQXNHTFNMRmxvYXQodGhpcy5fdlsxM10pfSwgJHtNYXRoVXRpbC5jb252ZXJ0VG9TdHJpbmdBc0dMU0xGbG9hdCh0aGlzLl92WzE0XSl9LCAke01hdGhVdGlsLmNvbnZlcnRUb1N0cmluZ0FzR0xTTEZsb2F0KHRoaXMuX3ZbMTVdKX0pYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyB0aGUgbWF0cml4IHRvIGEgR0xTTCBtYXQ0IHN0cmluZyByZXByZXNlbnRhdGlvbiB3aXRoIGludGVnZXIgdmFsdWVzLlxuICAgKiBAcmV0dXJucyBBIEdMU0wtY29tcGF0aWJsZSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG1hdHJpeCB3aXRoIGludGVnZXIgdmFsdWVzXG4gICAqL1xuICBnZXQgZ2xzbFN0ckFzSW50KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBtYXQ0KCR7TWF0aC5mbG9vcih0aGlzLl92WzBdKX0sICR7TWF0aC5mbG9vcih0aGlzLl92WzFdKX0sICR7TWF0aC5mbG9vcih0aGlzLl92WzJdKX0sICR7TWF0aC5mbG9vcih0aGlzLl92WzNdKX0sICR7TWF0aC5mbG9vcih0aGlzLl92WzRdKX0sICR7TWF0aC5mbG9vcih0aGlzLl92WzVdKX0sICR7TWF0aC5mbG9vcih0aGlzLl92WzZdKX0sICR7TWF0aC5mbG9vcih0aGlzLl92WzddKX0sICR7TWF0aC5mbG9vcih0aGlzLl92WzhdKX0sICR7TWF0aC5mbG9vcih0aGlzLl92WzldKX0sICR7TWF0aC5mbG9vcih0aGlzLl92WzEwXSl9LCAke01hdGguZmxvb3IodGhpcy5fdlsxMV0pfSwgJHtNYXRoLmZsb29yKHRoaXMuX3ZbMTJdKX0sICR7TWF0aC5mbG9vcih0aGlzLl92WzEzXSl9LCAke01hdGguZmxvb3IodGhpcy5fdlsxNF0pfSwgJHtNYXRoLmZsb29yKHRoaXMuX3ZbMTVdKX0pYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyB0aGUgbWF0cml4IHRvIGEgV0dTTCBtYXQ0eDRmIHN0cmluZyByZXByZXNlbnRhdGlvbiB3aXRoIGZsb2F0IHByZWNpc2lvbi5cbiAgICogQHJldHVybnMgQSBXR1NMLWNvbXBhdGlibGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBtYXRyaXhcbiAgICovXG4gIGdldCB3Z3NsU3RyQXNGbG9hdCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBgbWF0NHg0Zigke01hdGhVdGlsLmNvbnZlcnRUb1N0cmluZ0FzR0xTTEZsb2F0KHRoaXMuX3ZbMF0pfSwgJHtNYXRoVXRpbC5jb252ZXJ0VG9TdHJpbmdBc0dMU0xGbG9hdCh0aGlzLl92WzFdKX0sICR7TWF0aFV0aWwuY29udmVydFRvU3RyaW5nQXNHTFNMRmxvYXQodGhpcy5fdlsyXSl9LCAke01hdGhVdGlsLmNvbnZlcnRUb1N0cmluZ0FzR0xTTEZsb2F0KHRoaXMuX3ZbM10pfSwgJHtNYXRoVXRpbC5jb252ZXJ0VG9TdHJpbmdBc0dMU0xGbG9hdCh0aGlzLl92WzRdKX0sICR7TWF0aFV0aWwuY29udmVydFRvU3RyaW5nQXNHTFNMRmxvYXQodGhpcy5fdls1XSl9LCAke01hdGhVdGlsLmNvbnZlcnRUb1N0cmluZ0FzR0xTTEZsb2F0KHRoaXMuX3ZbNl0pfSwgJHtNYXRoVXRpbC5jb252ZXJ0VG9TdHJpbmdBc0dMU0xGbG9hdCh0aGlzLl92WzddKX0sICR7TWF0aFV0aWwuY29udmVydFRvU3RyaW5nQXNHTFNMRmxvYXQodGhpcy5fdls4XSl9LCAke01hdGhVdGlsLmNvbnZlcnRUb1N0cmluZ0FzR0xTTEZsb2F0KHRoaXMuX3ZbOV0pfSwgJHtNYXRoVXRpbC5jb252ZXJ0VG9TdHJpbmdBc0dMU0xGbG9hdCh0aGlzLl92WzEwXSl9LCAke01hdGhVdGlsLmNvbnZlcnRUb1N0cmluZ0FzR0xTTEZsb2F0KHRoaXMuX3ZbMTFdKX0sICR7TWF0aFV0aWwuY29udmVydFRvU3RyaW5nQXNHTFNMRmxvYXQodGhpcy5fdlsxMl0pfSwgJHtNYXRoVXRpbC5jb252ZXJ0VG9TdHJpbmdBc0dMU0xGbG9hdCh0aGlzLl92WzEzXSl9LCAke01hdGhVdGlsLmNvbnZlcnRUb1N0cmluZ0FzR0xTTEZsb2F0KHRoaXMuX3ZbMTRdKX0sICR7TWF0aFV0aWwuY29udmVydFRvU3RyaW5nQXNHTFNMRmxvYXQodGhpcy5fdlsxNV0pfSlgO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHRoZSBtYXRyaXggdG8gYSBXR1NMIG1hdDR4NGkgc3RyaW5nIHJlcHJlc2VudGF0aW9uIHdpdGggaW50ZWdlciB2YWx1ZXMuXG4gICAqIEByZXR1cm5zIEEgV0dTTC1jb21wYXRpYmxlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgbWF0cml4IHdpdGggaW50ZWdlciB2YWx1ZXNcbiAgICovXG4gIGdldCB3Z3NsU3RyQXNJbnQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYG1hdDR4NGkoJHtNYXRoLmZsb29yKHRoaXMuX3ZbMF0pfSwgJHtNYXRoLmZsb29yKHRoaXMuX3ZbMV0pfSwgJHtNYXRoLmZsb29yKHRoaXMuX3ZbMl0pfSwgJHtNYXRoLmZsb29yKHRoaXMuX3ZbM10pfSwgJHtNYXRoLmZsb29yKHRoaXMuX3ZbNF0pfSwgJHtNYXRoLmZsb29yKHRoaXMuX3ZbNV0pfSwgJHtNYXRoLmZsb29yKHRoaXMuX3ZbNl0pfSwgJHtNYXRoLmZsb29yKHRoaXMuX3ZbN10pfSwgJHtNYXRoLmZsb29yKHRoaXMuX3ZbOF0pfSwgJHtNYXRoLmZsb29yKHRoaXMuX3ZbOV0pfSwgJHtNYXRoLmZsb29yKHRoaXMuX3ZbMTBdKX0sICR7TWF0aC5mbG9vcih0aGlzLl92WzExXSl9LCAke01hdGguZmxvb3IodGhpcy5fdlsxMl0pfSwgJHtNYXRoLmZsb29yKHRoaXMuX3ZbMTNdKX0sICR7TWF0aC5mbG9vcih0aGlzLl92WzE0XSl9LCAke01hdGguZmxvb3IodGhpcy5fdlsxNV0pfSlgO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB6ZXJvIG1hdHJpeCAoYWxsIGVsZW1lbnRzIGFyZSAwKS5cbiAgICogQHJldHVybnMgQSBuZXcgTWF0cml4NDQgaW5zdGFuY2Ugd2l0aCBhbGwgZWxlbWVudHMgc2V0IHRvIDBcbiAgICovXG4gIHN0YXRpYyBfemVybyh0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcik6IElNYXRyaXg0NCB7XG4gICAgcmV0dXJuIHRoaXMuX2Zyb21Db3B5MTZSb3dNYWpvcigwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCB0eXBlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgNHg0IGlkZW50aXR5IG1hdHJpeC5cbiAgICogQHJldHVybnMgQSBuZXcgSWRlbnRpdHlNYXRyaXg0NCBpbnN0YW5jZSByZXByZXNlbnRpbmcgdGhlIGlkZW50aXR5IG1hdHJpeFxuICAgKi9cbiAgc3RhdGljIF9pZGVudGl0eSh0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcik6IElNYXRyaXg0NCB7XG4gICAgcmV0dXJuIHRoaXMuX2Zyb21Db3B5MTZSb3dNYWpvcigxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCB0eXBlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZHVtbXkgbWF0cml4IHdpdGggemVyby1sZW5ndGggYXJyYXkgKGZvciBwbGFjZWhvbGRlciBwdXJwb3NlcykuXG4gICAqIEByZXR1cm5zIEEgbmV3IE1hdHJpeDQ0IGluc3RhbmNlIHdpdGggYW4gZW1wdHkgYXJyYXlcbiAgICovXG4gIHN0YXRpYyBfZHVtbXkodHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpOiBJTWF0cml4NDQge1xuICAgIHJldHVybiBuZXcgdGhpcyhuZXcgdHlwZSgwKSwgeyB0eXBlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB0cmFuc3Bvc2UgbWF0cml4IGZyb20gdGhlIGdpdmVuIG1hdHJpeC5cbiAgICogRm9yIGlkZW50aXR5IG1hdHJpY2VzLCByZXR1cm5zIHRoZSBzYW1lIG1hdHJpeCBzaW5jZSB0cmFuc3Bvc2Ugb2YgaWRlbnRpdHkgaXMgaWRlbnRpdHkuXG4gICAqIEBwYXJhbSBtYXQgLSBUaGUgbWF0cml4IHRvIHRyYW5zcG9zZVxuICAgKiBAcmV0dXJucyBBIG5ldyBNYXRyaXg0NCBpbnN0YW5jZSByZXByZXNlbnRpbmcgdGhlIHRyYW5zcG9zZWQgbWF0cml4XG4gICAqL1xuICBzdGF0aWMgX3RyYW5zcG9zZShtYXQ6IElNYXRyaXg0NCwgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpOiBJTWF0cml4NDQge1xuICAgIHJldHVybiB0aGlzLl9mcm9tQ29weVR5cGVkQXJyYXlSb3dNYWpvcihtYXQuX3YsIHR5cGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGVtcHRzIHRvIGNyZWF0ZSB0aGUgaW52ZXJzZSBvZiB0aGUgZ2l2ZW4gbWF0cml4LlxuICAgKiBVc2VzIG9wdGltaXplZCBjb21wdXRhdGlvbiBmb3IgNHg0IG1hdHJpeCBpbnZlcnNpb24uXG4gICAqXG4gICAqIFJldHVybnMgbnVsbCBpbnN0ZWFkIG9mIGRpdmlkaW5nIGJ5IHplcm8gd2hlbiB0aGUgbWF0cml4IGlzIG51bWVyaWNhbGx5XG4gICAqIHNpbmd1bGFyIChzZWUge0BsaW5rIE1hdGhVdGlsLmlzU2luZ3VsYXJEZXR9KS5cbiAgICpcbiAgICogQHBhcmFtIG1hdCAtIFRoZSBtYXRyaXggdG8gaW52ZXJ0XG4gICAqIEByZXR1cm5zIEEgbmV3IE1hdHJpeDQ0IGluc3RhbmNlIHJlcHJlc2VudGluZyB0aGUgaW52ZXJ0ZWQgbWF0cml4LFxuICAgKiAgICAgICAgICBvciBudWxsIGlmIHRoZSBtYXRyaXggaXMgbm90IGludmVydGlibGVcbiAgICovXG4gIHN0YXRpYyBfdHJ5SW52ZXJ0KG1hdDogSU1hdHJpeDQ0LCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcik6IElNYXRyaXg0NCB8IG51bGwge1xuICAgIGlmIChtYXQuaXNJZGVudGl0eU1hdHJpeENsYXNzKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZnJvbUNvcHlNYXRyaXg0NChtYXQsIHR5cGUpO1xuICAgIH1cblxuICAgIGNvbnN0IG4wMCA9IG1hdC5fdlswXSAqIG1hdC5fdls1XSAtIG1hdC5fdls0XSAqIG1hdC5fdlsxXTtcbiAgICBjb25zdCBuMDEgPSBtYXQuX3ZbMF0gKiBtYXQuX3ZbOV0gLSBtYXQuX3ZbOF0gKiBtYXQuX3ZbMV07XG4gICAgY29uc3QgbjAyID0gbWF0Ll92WzBdICogbWF0Ll92WzEzXSAtIG1hdC5fdlsxMl0gKiBtYXQuX3ZbMV07XG4gICAgY29uc3QgbjAzID0gbWF0Ll92WzRdICogbWF0Ll92WzldIC0gbWF0Ll92WzhdICogbWF0Ll92WzVdO1xuICAgIGNvbnN0IG4wNCA9IG1hdC5fdls0XSAqIG1hdC5fdlsxM10gLSBtYXQuX3ZbMTJdICogbWF0Ll92WzVdO1xuICAgIGNvbnN0IG4wNSA9IG1hdC5fdls4XSAqIG1hdC5fdlsxM10gLSBtYXQuX3ZbMTJdICogbWF0Ll92WzldO1xuICAgIGNvbnN0IG4wNiA9IG1hdC5fdlsyXSAqIG1hdC5fdls3XSAtIG1hdC5fdls2XSAqIG1hdC5fdlszXTtcbiAgICBjb25zdCBuMDcgPSBtYXQuX3ZbMl0gKiBtYXQuX3ZbMTFdIC0gbWF0Ll92WzEwXSAqIG1hdC5fdlszXTtcbiAgICBjb25zdCBuMDggPSBtYXQuX3ZbMl0gKiBtYXQuX3ZbMTVdIC0gbWF0Ll92WzE0XSAqIG1hdC5fdlszXTtcbiAgICBjb25zdCBuMDkgPSBtYXQuX3ZbNl0gKiBtYXQuX3ZbMTFdIC0gbWF0Ll92WzEwXSAqIG1hdC5fdls3XTtcbiAgICBjb25zdCBuMTAgPSBtYXQuX3ZbNl0gKiBtYXQuX3ZbMTVdIC0gbWF0Ll92WzE0XSAqIG1hdC5fdls3XTtcbiAgICBjb25zdCBuMTEgPSBtYXQuX3ZbMTBdICogbWF0Ll92WzE1XSAtIG1hdC5fdlsxNF0gKiBtYXQuX3ZbMTFdO1xuXG4gICAgY29uc3QgZGV0ID0gbjAwICogbjExIC0gbjAxICogbjEwICsgbjAyICogbjA5ICsgbjAzICogbjA4IC0gbjA0ICogbjA3ICsgbjA1ICogbjA2O1xuXG4gICAgY29uc3Qgcm93Tm9ybTAgPSBNYXRoLmFicyhtYXQuX3ZbMF0pICsgTWF0aC5hYnMobWF0Ll92WzFdKSArIE1hdGguYWJzKG1hdC5fdlsyXSkgKyBNYXRoLmFicyhtYXQuX3ZbM10pO1xuICAgIGNvbnN0IHJvd05vcm0xID0gTWF0aC5hYnMobWF0Ll92WzRdKSArIE1hdGguYWJzKG1hdC5fdls1XSkgKyBNYXRoLmFicyhtYXQuX3ZbNl0pICsgTWF0aC5hYnMobWF0Ll92WzddKTtcbiAgICBjb25zdCByb3dOb3JtMiA9IE1hdGguYWJzKG1hdC5fdls4XSkgKyBNYXRoLmFicyhtYXQuX3ZbOV0pICsgTWF0aC5hYnMobWF0Ll92WzEwXSkgKyBNYXRoLmFicyhtYXQuX3ZbMTFdKTtcbiAgICBjb25zdCByb3dOb3JtMyA9IE1hdGguYWJzKG1hdC5fdlsxMl0pICsgTWF0aC5hYnMobWF0Ll92WzEzXSkgKyBNYXRoLmFicyhtYXQuX3ZbMTRdKSArIE1hdGguYWJzKG1hdC5fdlsxNV0pO1xuICAgIGlmIChcbiAgICAgIE1hdGhVdGlsLmlzU2luZ3VsYXJEZXQoXG4gICAgICAgIGRldCxcbiAgICAgICAgcm93Tm9ybTAgKiByb3dOb3JtMSAqIHJvd05vcm0yICogcm93Tm9ybTMsXG4gICAgICAgIE1hdGhVdGlsLmdldFNpbmd1bGFyRXBzaWxvbihtYXQuX3YuQllURVNfUEVSX0VMRU1FTlQpXG4gICAgICApXG4gICAgKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBpbnZEZXQgPSAxIC8gZGV0O1xuXG4gICAgY29uc3QgbTAwID0gKG1hdC5fdls1XSAqIG4xMSAtIG1hdC5fdls5XSAqIG4xMCArIG1hdC5fdlsxM10gKiBuMDkpICogaW52RGV0O1xuICAgIGNvbnN0IG0wMSA9IChtYXQuX3ZbOF0gKiBuMTAgLSBtYXQuX3ZbNF0gKiBuMTEgLSBtYXQuX3ZbMTJdICogbjA5KSAqIGludkRldDtcbiAgICBjb25zdCBtMDIgPSAobWF0Ll92WzddICogbjA1IC0gbWF0Ll92WzExXSAqIG4wNCArIG1hdC5fdlsxNV0gKiBuMDMpICogaW52RGV0O1xuICAgIGNvbnN0IG0wMyA9IChtYXQuX3ZbMTBdICogbjA0IC0gbWF0Ll92WzZdICogbjA1IC0gbWF0Ll92WzE0XSAqIG4wMykgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTEwID0gKG1hdC5fdls5XSAqIG4wOCAtIG1hdC5fdlsxXSAqIG4xMSAtIG1hdC5fdlsxM10gKiBuMDcpICogaW52RGV0O1xuICAgIGNvbnN0IG0xMSA9IChtYXQuX3ZbMF0gKiBuMTEgLSBtYXQuX3ZbOF0gKiBuMDggKyBtYXQuX3ZbMTJdICogbjA3KSAqIGludkRldDtcbiAgICBjb25zdCBtMTIgPSAobWF0Ll92WzExXSAqIG4wMiAtIG1hdC5fdlszXSAqIG4wNSAtIG1hdC5fdlsxNV0gKiBuMDEpICogaW52RGV0O1xuICAgIGNvbnN0IG0xMyA9IChtYXQuX3ZbMl0gKiBuMDUgLSBtYXQuX3ZbMTBdICogbjAyICsgbWF0Ll92WzE0XSAqIG4wMSkgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTIwID0gKG1hdC5fdlsxXSAqIG4xMCAtIG1hdC5fdls1XSAqIG4wOCArIG1hdC5fdlsxM10gKiBuMDYpICogaW52RGV0O1xuICAgIGNvbnN0IG0yMSA9IChtYXQuX3ZbNF0gKiBuMDggLSBtYXQuX3ZbMF0gKiBuMTAgLSBtYXQuX3ZbMTJdICogbjA2KSAqIGludkRldDtcbiAgICBjb25zdCBtMjIgPSAobWF0Ll92WzNdICogbjA0IC0gbWF0Ll92WzddICogbjAyICsgbWF0Ll92WzE1XSAqIG4wMCkgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTIzID0gKG1hdC5fdls2XSAqIG4wMiAtIG1hdC5fdlsyXSAqIG4wNCAtIG1hdC5fdlsxNF0gKiBuMDApICogaW52RGV0O1xuICAgIGNvbnN0IG0zMCA9IChtYXQuX3ZbNV0gKiBuMDcgLSBtYXQuX3ZbMV0gKiBuMDkgLSBtYXQuX3ZbOV0gKiBuMDYpICogaW52RGV0O1xuICAgIGNvbnN0IG0zMSA9IChtYXQuX3ZbMF0gKiBuMDkgLSBtYXQuX3ZbNF0gKiBuMDcgKyBtYXQuX3ZbOF0gKiBuMDYpICogaW52RGV0O1xuICAgIGNvbnN0IG0zMiA9IChtYXQuX3ZbN10gKiBuMDEgLSBtYXQuX3ZbM10gKiBuMDMgLSBtYXQuX3ZbMTFdICogbjAwKSAqIGludkRldDtcbiAgICBjb25zdCBtMzMgPSAobWF0Ll92WzJdICogbjAzIC0gbWF0Ll92WzZdICogbjAxICsgbWF0Ll92WzEwXSAqIG4wMCkgKiBpbnZEZXQ7XG5cbiAgICByZXR1cm4gdGhpcy5fZnJvbUNvcHkxNlJvd01ham9yKFxuICAgICAgbTAwLFxuICAgICAgbTAxLFxuICAgICAgbTAyLFxuICAgICAgbTAzLFxuICAgICAgbTEwLFxuICAgICAgbTExLFxuICAgICAgbTEyLFxuICAgICAgbTEzLFxuICAgICAgbTIwLFxuICAgICAgbTIxLFxuICAgICAgbTIyLFxuICAgICAgbTIzLFxuICAgICAgbTMwLFxuICAgICAgbTMxLFxuICAgICAgbTMyLFxuICAgICAgbTMzLFxuICAgICAgdHlwZVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBpbnZlcnNlIG1hdHJpeCBmcm9tIHRoZSBnaXZlbiBtYXRyaXguXG4gICAqIFVzZXMgb3B0aW1pemVkIGNvbXB1dGF0aW9uIGZvciA0eDQgbWF0cml4IGludmVyc2lvbi5cbiAgICpcbiAgICogSWYgdGhlIG1hdHJpeCBpcyBudW1lcmljYWxseSBzaW5ndWxhciwgYW4gaWRlbnRpdHkgbWF0cml4IGlzIHJldHVybmVkXG4gICAqIGluc3RlYWQgb2YgZGl2aWRpbmcgYnkgemVyby4gVXNlIHtAbGluayBNYXRyaXg0NC50cnlJbnZlcnR9IHdoZW4gdGhlXG4gICAqIGNhbGxlciBuZWVkcyB0byBkZXRlY3QgdGhlIGZhaWx1cmUuXG4gICAqXG4gICAqIEBwYXJhbSBtYXQgLSBUaGUgbWF0cml4IHRvIGludmVydFxuICAgKiBAcmV0dXJucyBBIG5ldyBNYXRyaXg0NCBpbnN0YW5jZSByZXByZXNlbnRpbmcgdGhlIGludmVydGVkIG1hdHJpeCxcbiAgICogICAgICAgICAgb3IgdGhlIGlkZW50aXR5IG1hdHJpeCBpZiB0aGUgaW5wdXQgaXMgc2luZ3VsYXJcbiAgICovXG4gIHN0YXRpYyBfaW52ZXJ0KG1hdDogSU1hdHJpeDQ0LCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcik6IElNYXRyaXg0NCB7XG4gICAgY29uc3QgaW52ZXJ0ZWQgPSB0aGlzLl90cnlJbnZlcnQobWF0LCB0eXBlKTtcbiAgICBpZiAoaW52ZXJ0ZWQgIT09IG51bGwpIHtcbiAgICAgIHJldHVybiBpbnZlcnRlZDtcbiAgICB9XG5cbiAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcigndGhlIG1hdHJpeCBpcyBzaW5ndWxhciBhbmQgY2Fubm90IGJlIGludmVydGVkLiBSZXR1cm5pbmcgYW4gaWRlbnRpdHkgbWF0cml4IGluc3RlYWQuJyk7XG4gICAgcmV0dXJuIHRoaXMuX2Zyb21Db3B5MTZSb3dNYWpvcigxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCB0eXBlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRlbXB0cyB0byBjb21wdXRlIHRoZSBpbnZlcnNlIG9mIGEgbWF0cml4IGFuZCBzdG9yZSB0aGUgcmVzdWx0IGluIGFuIG91dHB1dCBtYXRyaXguXG4gICAqIFRoZSBvdXRwdXQgbWF0cml4IGlzIGxlZnQgdW50b3VjaGVkIHdoZW4gdGhlIGlucHV0IGlzIG51bWVyaWNhbGx5IHNpbmd1bGFyLFxuICAgKiB3aGljaCBsZXRzIGNhbGxlcnMga2VlcCB0aGUgcHJldmlvdXMgdmFsaWQgdmFsdWUuXG4gICAqXG4gICAqIEBwYXJhbSBtYXQgLSBUaGUgbWF0cml4IHRvIGludmVydFxuICAgKiBAcGFyYW0gb3V0TWF0IC0gVGhlIG91dHB1dCBtYXRyaXggdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBpbnZlcnNpb24gc3VjY2VlZGVkLCBmYWxzZSBpZiB0aGUgbWF0cml4IGlzIHNpbmd1bGFyXG4gICAqL1xuICBzdGF0aWMgX3RyeUludmVydFRvKG1hdDogSU1hdHJpeDQ0LCBvdXRNYXQ6IElNdXRhYmxlTWF0cml4NDQpOiBib29sZWFuIHtcbiAgICBpZiAobWF0LmlzSWRlbnRpdHlNYXRyaXhDbGFzcykge1xuICAgICAgb3V0TWF0LmNvcHlDb21wb25lbnRzKG1hdCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBjb25zdCBuMDAgPSBtYXQuX3ZbMF0gKiBtYXQuX3ZbNV0gLSBtYXQuX3ZbNF0gKiBtYXQuX3ZbMV07XG4gICAgY29uc3QgbjAxID0gbWF0Ll92WzBdICogbWF0Ll92WzldIC0gbWF0Ll92WzhdICogbWF0Ll92WzFdO1xuICAgIGNvbnN0IG4wMiA9IG1hdC5fdlswXSAqIG1hdC5fdlsxM10gLSBtYXQuX3ZbMTJdICogbWF0Ll92WzFdO1xuICAgIGNvbnN0IG4wMyA9IG1hdC5fdls0XSAqIG1hdC5fdls5XSAtIG1hdC5fdls4XSAqIG1hdC5fdls1XTtcbiAgICBjb25zdCBuMDQgPSBtYXQuX3ZbNF0gKiBtYXQuX3ZbMTNdIC0gbWF0Ll92WzEyXSAqIG1hdC5fdls1XTtcbiAgICBjb25zdCBuMDUgPSBtYXQuX3ZbOF0gKiBtYXQuX3ZbMTNdIC0gbWF0Ll92WzEyXSAqIG1hdC5fdls5XTtcbiAgICBjb25zdCBuMDYgPSBtYXQuX3ZbMl0gKiBtYXQuX3ZbN10gLSBtYXQuX3ZbNl0gKiBtYXQuX3ZbM107XG4gICAgY29uc3QgbjA3ID0gbWF0Ll92WzJdICogbWF0Ll92WzExXSAtIG1hdC5fdlsxMF0gKiBtYXQuX3ZbM107XG4gICAgY29uc3QgbjA4ID0gbWF0Ll92WzJdICogbWF0Ll92WzE1XSAtIG1hdC5fdlsxNF0gKiBtYXQuX3ZbM107XG4gICAgY29uc3QgbjA5ID0gbWF0Ll92WzZdICogbWF0Ll92WzExXSAtIG1hdC5fdlsxMF0gKiBtYXQuX3ZbN107XG4gICAgY29uc3QgbjEwID0gbWF0Ll92WzZdICogbWF0Ll92WzE1XSAtIG1hdC5fdlsxNF0gKiBtYXQuX3ZbN107XG4gICAgY29uc3QgbjExID0gbWF0Ll92WzEwXSAqIG1hdC5fdlsxNV0gLSBtYXQuX3ZbMTRdICogbWF0Ll92WzExXTtcblxuICAgIGNvbnN0IGRldCA9IG4wMCAqIG4xMSAtIG4wMSAqIG4xMCArIG4wMiAqIG4wOSArIG4wMyAqIG4wOCAtIG4wNCAqIG4wNyArIG4wNSAqIG4wNjtcblxuICAgIGNvbnN0IHJvd05vcm0wID0gTWF0aC5hYnMobWF0Ll92WzBdKSArIE1hdGguYWJzKG1hdC5fdlsxXSkgKyBNYXRoLmFicyhtYXQuX3ZbMl0pICsgTWF0aC5hYnMobWF0Ll92WzNdKTtcbiAgICBjb25zdCByb3dOb3JtMSA9IE1hdGguYWJzKG1hdC5fdls0XSkgKyBNYXRoLmFicyhtYXQuX3ZbNV0pICsgTWF0aC5hYnMobWF0Ll92WzZdKSArIE1hdGguYWJzKG1hdC5fdls3XSk7XG4gICAgY29uc3Qgcm93Tm9ybTIgPSBNYXRoLmFicyhtYXQuX3ZbOF0pICsgTWF0aC5hYnMobWF0Ll92WzldKSArIE1hdGguYWJzKG1hdC5fdlsxMF0pICsgTWF0aC5hYnMobWF0Ll92WzExXSk7XG4gICAgY29uc3Qgcm93Tm9ybTMgPSBNYXRoLmFicyhtYXQuX3ZbMTJdKSArIE1hdGguYWJzKG1hdC5fdlsxM10pICsgTWF0aC5hYnMobWF0Ll92WzE0XSkgKyBNYXRoLmFicyhtYXQuX3ZbMTVdKTtcbiAgICBpZiAoXG4gICAgICBNYXRoVXRpbC5pc1Npbmd1bGFyRGV0KFxuICAgICAgICBkZXQsXG4gICAgICAgIHJvd05vcm0wICogcm93Tm9ybTEgKiByb3dOb3JtMiAqIHJvd05vcm0zLFxuICAgICAgICBNYXRoVXRpbC5nZXRTaW5ndWxhckVwc2lsb24obWF0Ll92LkJZVEVTX1BFUl9FTEVNRU5UKVxuICAgICAgKVxuICAgICkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IGludkRldCA9IDEgLyBkZXQ7XG5cbiAgICBjb25zdCBtMDAgPSAobWF0Ll92WzVdICogbjExIC0gbWF0Ll92WzldICogbjEwICsgbWF0Ll92WzEzXSAqIG4wOSkgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTAxID0gKG1hdC5fdls4XSAqIG4xMCAtIG1hdC5fdls0XSAqIG4xMSAtIG1hdC5fdlsxMl0gKiBuMDkpICogaW52RGV0O1xuICAgIGNvbnN0IG0wMiA9IChtYXQuX3ZbN10gKiBuMDUgLSBtYXQuX3ZbMTFdICogbjA0ICsgbWF0Ll92WzE1XSAqIG4wMykgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTAzID0gKG1hdC5fdlsxMF0gKiBuMDQgLSBtYXQuX3ZbNl0gKiBuMDUgLSBtYXQuX3ZbMTRdICogbjAzKSAqIGludkRldDtcbiAgICBjb25zdCBtMTAgPSAobWF0Ll92WzldICogbjA4IC0gbWF0Ll92WzFdICogbjExIC0gbWF0Ll92WzEzXSAqIG4wNykgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTExID0gKG1hdC5fdlswXSAqIG4xMSAtIG1hdC5fdls4XSAqIG4wOCArIG1hdC5fdlsxMl0gKiBuMDcpICogaW52RGV0O1xuICAgIGNvbnN0IG0xMiA9IChtYXQuX3ZbMTFdICogbjAyIC0gbWF0Ll92WzNdICogbjA1IC0gbWF0Ll92WzE1XSAqIG4wMSkgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTEzID0gKG1hdC5fdlsyXSAqIG4wNSAtIG1hdC5fdlsxMF0gKiBuMDIgKyBtYXQuX3ZbMTRdICogbjAxKSAqIGludkRldDtcbiAgICBjb25zdCBtMjAgPSAobWF0Ll92WzFdICogbjEwIC0gbWF0Ll92WzVdICogbjA4ICsgbWF0Ll92WzEzXSAqIG4wNikgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTIxID0gKG1hdC5fdls0XSAqIG4wOCAtIG1hdC5fdlswXSAqIG4xMCAtIG1hdC5fdlsxMl0gKiBuMDYpICogaW52RGV0O1xuICAgIGNvbnN0IG0yMiA9IChtYXQuX3ZbM10gKiBuMDQgLSBtYXQuX3ZbN10gKiBuMDIgKyBtYXQuX3ZbMTVdICogbjAwKSAqIGludkRldDtcbiAgICBjb25zdCBtMjMgPSAobWF0Ll92WzZdICogbjAyIC0gbWF0Ll92WzJdICogbjA0IC0gbWF0Ll92WzE0XSAqIG4wMCkgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTMwID0gKG1hdC5fdls1XSAqIG4wNyAtIG1hdC5fdlsxXSAqIG4wOSAtIG1hdC5fdls5XSAqIG4wNikgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTMxID0gKG1hdC5fdlswXSAqIG4wOSAtIG1hdC5fdls0XSAqIG4wNyArIG1hdC5fdls4XSAqIG4wNikgKiBpbnZEZXQ7XG4gICAgY29uc3QgbTMyID0gKG1hdC5fdls3XSAqIG4wMSAtIG1hdC5fdlszXSAqIG4wMyAtIG1hdC5fdlsxMV0gKiBuMDApICogaW52RGV0O1xuICAgIGNvbnN0IG0zMyA9IChtYXQuX3ZbMl0gKiBuMDMgLSBtYXQuX3ZbNl0gKiBuMDEgKyBtYXQuX3ZbMTBdICogbjAwKSAqIGludkRldDtcblxuICAgIG91dE1hdC5zZXRDb21wb25lbnRzKG0wMCwgbTAxLCBtMDIsIG0wMywgbTEwLCBtMTEsIG0xMiwgbTEzLCBtMjAsIG0yMSwgbTIyLCBtMjMsIG0zMCwgbTMxLCBtMzIsIG0zMyk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogQ29tcHV0ZXMgdGhlIGludmVyc2Ugb2YgYSBtYXRyaXggYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIGFuIG91dHB1dCBtYXRyaXguXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgdmVyc2lvbiBvZiB0aGUgaW52ZXJ0IG1ldGhvZCBmb3IgcGVyZm9ybWFuY2Ugb3B0aW1pemF0aW9uLlxuICAgKlxuICAgKiBJZiB0aGUgbWF0cml4IGlzIG51bWVyaWNhbGx5IHNpbmd1bGFyLCB0aGUgb3V0cHV0IG1hdHJpeCBpcyBzZXQgdG8gdGhlXG4gICAqIGlkZW50aXR5IG1hdHJpeCBpbnN0ZWFkIG9mIGJlaW5nIGZpbGxlZCB3aXRoIGBJbmZpbml0eWAvYE5hTmAuXG4gICAqIFVzZSB7QGxpbmsgTWF0cml4NDQudHJ5SW52ZXJ0VG99IHdoZW4gdGhlIGNhbGxlciBuZWVkcyB0byBkZXRlY3QgdGhlIGZhaWx1cmUuXG4gICAqXG4gICAqIEBwYXJhbSBtYXQgLSBUaGUgbWF0cml4IHRvIGludmVydFxuICAgKiBAcGFyYW0gb3V0TWF0IC0gVGhlIG91dHB1dCBtYXRyaXggdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IG1hdHJpeCBjb250YWluaW5nIHRoZSBpbnZlcnRlZCBtYXRyaXgsIG9yIHRoZSBpZGVudGl0eSBtYXRyaXggaWYgdGhlIGlucHV0IGlzIHNpbmd1bGFyXG4gICAqL1xuICBzdGF0aWMgX2ludmVydFRvKG1hdDogSU1hdHJpeDQ0LCBvdXRNYXQ6IElNdXRhYmxlTWF0cml4NDQpOiBJTXV0YWJsZU1hdHJpeDQ0IHtcbiAgICBpZiAodGhpcy5fdHJ5SW52ZXJ0VG8obWF0LCBvdXRNYXQpKSB7XG4gICAgICByZXR1cm4gb3V0TWF0O1xuICAgIH1cblxuICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCd0aGUgbWF0cml4IGlzIHNpbmd1bGFyIGFuZCBjYW5ub3QgYmUgaW52ZXJ0ZWQuIFJldHVybmluZyBhbiBpZGVudGl0eSBtYXRyaXggaW5zdGVhZC4nKTtcbiAgICByZXR1cm4gb3V0TWF0LmlkZW50aXR5KCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHRyYW5zbGF0aW9uIG1hdHJpeCBmcm9tIGEgM0QgdmVjdG9yLlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHRyYW5zbGF0aW9uIHZlY3RvclxuICAgKiBAcmV0dXJucyBBIG5ldyBNYXRyaXg0NCBpbnN0YW5jZSByZXByZXNlbnRpbmcgdGhlIHRyYW5zbGF0aW9uIHRyYW5zZm9ybWF0aW9uXG4gICAqL1xuICBzdGF0aWMgX3RyYW5zbGF0ZSh2ZWM6IElWZWN0b3IzLCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcik6IElNYXRyaXg0NCB7XG4gICAgcmV0dXJuIHRoaXMuX2Zyb21Db3B5MTZSb3dNYWpvcigxLCAwLCAwLCB2ZWMuX3ZbMF0sIDAsIDEsIDAsIHZlYy5fdlsxXSwgMCwgMCwgMSwgdmVjLl92WzJdLCAwLCAwLCAwLCAxLCB0eXBlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcm90YXRpb24gbWF0cml4IGFyb3VuZCB0aGUgWC1heGlzLlxuICAgKiBAcGFyYW0gcmFkaWFuIC0gVGhlIHJvdGF0aW9uIGFuZ2xlIGluIHJhZGlhbnNcbiAgICogQHJldHVybnMgQSBuZXcgTWF0cml4NDQgaW5zdGFuY2UgcmVwcmVzZW50aW5nIHRoZSBYLWF4aXMgcm90YXRpb25cbiAgICovXG4gIHN0YXRpYyBfcm90YXRlWChyYWRpYW46IG51bWJlciwgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpOiBJTWF0cml4NDQge1xuICAgIGNvbnN0IGNvcyA9IE1hdGguY29zKHJhZGlhbik7XG4gICAgY29uc3Qgc2luID0gTWF0aC5zaW4ocmFkaWFuKTtcbiAgICByZXR1cm4gdGhpcy5fZnJvbUNvcHkxNlJvd01ham9yKDEsIDAsIDAsIDAsIDAsIGNvcywgLXNpbiwgMCwgMCwgc2luLCBjb3MsIDAsIDAsIDAsIDAsIDEsIHR5cGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSByb3RhdGlvbiBtYXRyaXggYXJvdW5kIHRoZSBZLWF4aXMuXG4gICAqIEBwYXJhbSByYWRpYW4gLSBUaGUgcm90YXRpb24gYW5nbGUgaW4gcmFkaWFuc1xuICAgKiBAcmV0dXJucyBBIG5ldyBNYXRyaXg0NCBpbnN0YW5jZSByZXByZXNlbnRpbmcgdGhlIFktYXhpcyByb3RhdGlvblxuICAgKi9cbiAgc3RhdGljIF9yb3RhdGVZKHJhZGlhbjogbnVtYmVyLCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcik6IElNYXRyaXg0NCB7XG4gICAgY29uc3QgY29zID0gTWF0aC5jb3MocmFkaWFuKTtcbiAgICBjb25zdCBzaW4gPSBNYXRoLnNpbihyYWRpYW4pO1xuICAgIHJldHVybiB0aGlzLl9mcm9tQ29weTE2Um93TWFqb3IoY29zLCAwLCBzaW4sIDAsIDAsIDEsIDAsIDAsIC1zaW4sIDAsIGNvcywgMCwgMCwgMCwgMCwgMSwgdHlwZSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHJvdGF0aW9uIG1hdHJpeCBhcm91bmQgdGhlIFotYXhpcy5cbiAgICogQHBhcmFtIHJhZGlhbiAtIFRoZSByb3RhdGlvbiBhbmdsZSBpbiByYWRpYW5zXG4gICAqIEByZXR1cm5zIEEgbmV3IE1hdHJpeDQ0IGluc3RhbmNlIHJlcHJlc2VudGluZyB0aGUgWi1heGlzIHJvdGF0aW9uXG4gICAqL1xuICBzdGF0aWMgX3JvdGF0ZVoocmFkaWFuOiBudW1iZXIsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKTogSU1hdHJpeDQ0IHtcbiAgICBjb25zdCBjb3MgPSBNYXRoLmNvcyhyYWRpYW4pO1xuICAgIGNvbnN0IHNpbiA9IE1hdGguc2luKHJhZGlhbik7XG4gICAgcmV0dXJuIHRoaXMuX2Zyb21Db3B5MTZSb3dNYWpvcihjb3MsIC1zaW4sIDAsIDAsIHNpbiwgY29zLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCB0eXBlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcm90YXRpb24gbWF0cml4IGZyb20gRXVsZXIgYW5nbGVzIChYWVogb3JkZXIpLlxuICAgKiBBcHBsaWVzIHJvdGF0aW9ucyBpbiB0aGUgb3JkZXI6IFgsIHRoZW4gWSwgdGhlbiBaLlxuICAgKiBAcGFyYW0geCAtIFJvdGF0aW9uIGFyb3VuZCBYLWF4aXMgaW4gcmFkaWFuc1xuICAgKiBAcGFyYW0geSAtIFJvdGF0aW9uIGFyb3VuZCBZLWF4aXMgaW4gcmFkaWFuc1xuICAgKiBAcGFyYW0geiAtIFJvdGF0aW9uIGFyb3VuZCBaLWF4aXMgaW4gcmFkaWFuc1xuICAgKiBAcmV0dXJucyBBIG5ldyBNYXRyaXg0NCBpbnN0YW5jZSByZXByZXNlbnRpbmcgdGhlIGNvbWJpbmVkIHJvdGF0aW9uXG4gICAqL1xuICBzdGF0aWMgX3JvdGF0ZVhZWih4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyLCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcik6IElNYXRyaXg0NCB7XG4gICAgY29uc3QgY29zWCA9IE1hdGguY29zKHgpO1xuICAgIGNvbnN0IHNpblggPSBNYXRoLnNpbih4KTtcbiAgICBjb25zdCBjb3NZID0gTWF0aC5jb3MoeSk7XG4gICAgY29uc3Qgc2luWSA9IE1hdGguc2luKHkpO1xuICAgIGNvbnN0IGNvc1ogPSBNYXRoLmNvcyh6KTtcbiAgICBjb25zdCBzaW5aID0gTWF0aC5zaW4oeik7XG5cbiAgICAvLyBjb25zdCB4MDAgPSAxO1xuICAgIC8vIGNvbnN0IHgwMSA9IDA7XG4gICAgLy8gY29uc3QgeDAyID0gMDtcbiAgICAvLyBjb25zdCB4MTAgPSAwO1xuICAgIGNvbnN0IHgxMSA9IGNvc1g7XG4gICAgY29uc3QgeDEyID0gLXNpblg7XG4gICAgLy8gY29uc3QgeDIwID0gMDtcbiAgICBjb25zdCB4MjEgPSBzaW5YO1xuICAgIGNvbnN0IHgyMiA9IGNvc1g7XG5cbiAgICBjb25zdCB5MDAgPSBjb3NZO1xuICAgIC8vIGNvbnN0IHkwMSA9IDA7XG4gICAgY29uc3QgeTAyID0gc2luWTtcbiAgICAvLyBjb25zdCB5MTAgPSAwO1xuICAgIC8vIGNvbnN0IHkxMSA9IDE7XG4gICAgLy8gY29uc3QgeTEyID0gMDtcbiAgICBjb25zdCB5MjAgPSAtc2luWTtcbiAgICAvLyBjb25zdCB5MjEgPSAwO1xuICAgIGNvbnN0IHkyMiA9IGNvc1k7XG5cbiAgICBjb25zdCB6MDAgPSBjb3NaO1xuICAgIGNvbnN0IHowMSA9IC1zaW5aO1xuICAgIC8vIGNvbnN0IHowMiA9IDA7XG4gICAgY29uc3QgejEwID0gc2luWjtcbiAgICBjb25zdCB6MTEgPSBjb3NaO1xuICAgIC8vIGNvbnN0IHoxMiA9IDA7XG4gICAgLy8gY29uc3QgejIwID0gMDtcbiAgICAvLyBjb25zdCB6MjEgPSAwO1xuICAgIC8vIGNvbnN0IHoyMiA9IDE7XG5cbiAgICAvLyBZICogWFxuICAgIGNvbnN0IHl4MDAgPSB5MDA7XG4gICAgY29uc3QgeXgwMSA9IHkwMiAqIHgyMTtcbiAgICBjb25zdCB5eDAyID0geTAyICogeDIyO1xuICAgIC8vY29uc3QgeXgxMCA9IDA7XG4gICAgY29uc3QgeXgxMSA9IHgxMTtcbiAgICBjb25zdCB5eDEyID0geDEyO1xuICAgIGNvbnN0IHl4MjAgPSB5MjA7XG4gICAgY29uc3QgeXgyMSA9IHkyMiAqIHgyMTtcbiAgICBjb25zdCB5eDIyID0geTIyICogeDIyO1xuXG4gICAgLy8gWiAqIFkgKiBYXG4gICAgY29uc3QgbTAwID0gejAwICogeXgwMDtcbiAgICBjb25zdCBtMDEgPSB6MDAgKiB5eDAxICsgejAxICogeXgxMTtcbiAgICBjb25zdCBtMDIgPSB6MDAgKiB5eDAyICsgejAxICogeXgxMjtcbiAgICBjb25zdCBtMTAgPSB6MTAgKiB5eDAwO1xuICAgIGNvbnN0IG0xMSA9IHoxMCAqIHl4MDEgKyB6MTEgKiB5eDExO1xuICAgIGNvbnN0IG0xMiA9IHoxMCAqIHl4MDIgKyB6MTEgKiB5eDEyO1xuICAgIGNvbnN0IG0yMCA9IHl4MjA7XG4gICAgY29uc3QgbTIxID0geXgyMTtcbiAgICBjb25zdCBtMjIgPSB5eDIyO1xuXG4gICAgY29uc3QgbTAzID0gMDtcbiAgICBjb25zdCBtMTMgPSAwO1xuICAgIGNvbnN0IG0yMyA9IDA7XG4gICAgY29uc3QgbTMwID0gMDtcbiAgICBjb25zdCBtMzEgPSAwO1xuICAgIGNvbnN0IG0zMiA9IDA7XG4gICAgY29uc3QgbTMzID0gMTtcblxuICAgIHJldHVybiB0aGlzLl9mcm9tQ29weTE2Um93TWFqb3IoXG4gICAgICBtMDAsXG4gICAgICBtMDEsXG4gICAgICBtMDIsXG4gICAgICBtMDMsXG4gICAgICBtMTAsXG4gICAgICBtMTEsXG4gICAgICBtMTIsXG4gICAgICBtMTMsXG4gICAgICBtMjAsXG4gICAgICBtMjEsXG4gICAgICBtMjIsXG4gICAgICBtMjMsXG4gICAgICBtMzAsXG4gICAgICBtMzEsXG4gICAgICBtMzIsXG4gICAgICBtMzMsXG4gICAgICB0eXBlXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcm90YXRpb24gbWF0cml4IGZyb20gYSAzRCB2ZWN0b3IgY29udGFpbmluZyBFdWxlciBhbmdsZXMuXG4gICAqIEBwYXJhbSB2ZWMgLSBBIHZlY3RvciBjb250YWluaW5nIHJvdGF0aW9uIGFuZ2xlcyBbeCwgeSwgel0gaW4gcmFkaWFuc1xuICAgKiBAcmV0dXJucyBBIG5ldyBNYXRyaXg0NCBpbnN0YW5jZSByZXByZXNlbnRpbmcgdGhlIHJvdGF0aW9uXG4gICAqL1xuICBzdGF0aWMgX3JvdGF0ZSh2ZWM6IElWZWN0b3IzLCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcik6IElNYXRyaXg0NCB7XG4gICAgcmV0dXJuIHRoaXMuX3JvdGF0ZVhZWih2ZWMuX3ZbMF0sIHZlYy5fdlsxXSwgdmVjLl92WzJdLCB0eXBlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgc2NhbGluZyBtYXRyaXggZnJvbSBhIDNEIHZlY3Rvci5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSBzY2FsaW5nIGZhY3RvcnMgZm9yIGVhY2ggYXhpcyBbeCwgeSwgel1cbiAgICogQHJldHVybnMgQSBuZXcgTWF0cml4NDQgaW5zdGFuY2UgcmVwcmVzZW50aW5nIHRoZSBzY2FsaW5nIHRyYW5zZm9ybWF0aW9uXG4gICAqL1xuICBzdGF0aWMgX3NjYWxlKHZlYzogSVZlY3RvcjMsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKTogSU1hdHJpeDQ0IHtcbiAgICByZXR1cm4gdGhpcy5fZnJvbUNvcHkxNlJvd01ham9yKHZlYy5fdlswXSwgMCwgMCwgMCwgMCwgdmVjLl92WzFdLCAwLCAwLCAwLCAwLCB2ZWMuX3ZbMl0sIDAsIDAsIDAsIDAsIDEsIHR5cGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgdHdvIDR4NCBtYXRyaWNlcyBhbmQgcmV0dXJucyB0aGUgcmVzdWx0LlxuICAgKiBPcHRpbWl6ZWQgdG8gaGFuZGxlIGlkZW50aXR5IG1hdHJpY2VzIGVmZmljaWVudGx5LlxuICAgKiBAcGFyYW0gbF9tYXQgLSBUaGUgbGVmdCBtYXRyaXggaW4gdGhlIG11bHRpcGxpY2F0aW9uXG4gICAqIEBwYXJhbSByX21hdCAtIFRoZSByaWdodCBtYXRyaXggaW4gdGhlIG11bHRpcGxpY2F0aW9uXG4gICAqIEByZXR1cm5zIEEgbmV3IE1hdHJpeDQ0IGluc3RhbmNlIHJlcHJlc2VudGluZyB0aGUgbWF0cml4IHByb2R1Y3QgKGxfbWF0ICogcl9tYXQpXG4gICAqL1xuICBzdGF0aWMgX211bHRpcGx5KGxfbWF0OiBJTWF0cml4NDQsIHJfbWF0OiBJTWF0cml4NDQsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKTogSU1hdHJpeDQ0IHtcbiAgICBpZiAobF9tYXQuaXNJZGVudGl0eU1hdHJpeENsYXNzKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZnJvbUNvcHlNYXRyaXg0NChyX21hdCwgdHlwZSk7XG4gICAgfVxuICAgIGlmIChyX21hdC5pc0lkZW50aXR5TWF0cml4Q2xhc3MpIHtcbiAgICAgIHJldHVybiB0aGlzLl9mcm9tQ29weU1hdHJpeDQ0KGxfbWF0LCB0eXBlKTtcbiAgICB9XG5cbiAgICBjb25zdCBsdiA9IGxfbWF0Ll92O1xuICAgIGNvbnN0IHJ2ID0gcl9tYXQuX3Y7XG4gICAgY29uc3QgbTAwID0gbHZbMF0gKiBydlswXSArIGx2WzRdICogcnZbMV0gKyBsdls4XSAqIHJ2WzJdICsgbHZbMTJdICogcnZbM107XG4gICAgY29uc3QgbTEwID0gbHZbMV0gKiBydlswXSArIGx2WzVdICogcnZbMV0gKyBsdls5XSAqIHJ2WzJdICsgbHZbMTNdICogcnZbM107XG4gICAgY29uc3QgbTIwID0gbHZbMl0gKiBydlswXSArIGx2WzZdICogcnZbMV0gKyBsdlsxMF0gKiBydlsyXSArIGx2WzE0XSAqIHJ2WzNdO1xuICAgIGNvbnN0IG0zMCA9IGx2WzNdICogcnZbMF0gKyBsdls3XSAqIHJ2WzFdICsgbHZbMTFdICogcnZbMl0gKyBsdlsxNV0gKiBydlszXTtcblxuICAgIGNvbnN0IG0wMSA9IGx2WzBdICogcnZbNF0gKyBsdls0XSAqIHJ2WzVdICsgbHZbOF0gKiBydls2XSArIGx2WzEyXSAqIHJ2WzddO1xuICAgIGNvbnN0IG0xMSA9IGx2WzFdICogcnZbNF0gKyBsdls1XSAqIHJ2WzVdICsgbHZbOV0gKiBydls2XSArIGx2WzEzXSAqIHJ2WzddO1xuICAgIGNvbnN0IG0yMSA9IGx2WzJdICogcnZbNF0gKyBsdls2XSAqIHJ2WzVdICsgbHZbMTBdICogcnZbNl0gKyBsdlsxNF0gKiBydls3XTtcbiAgICBjb25zdCBtMzEgPSBsdlszXSAqIHJ2WzRdICsgbHZbN10gKiBydls1XSArIGx2WzExXSAqIHJ2WzZdICsgbHZbMTVdICogcnZbN107XG5cbiAgICBjb25zdCBtMDIgPSBsdlswXSAqIHJ2WzhdICsgbHZbNF0gKiBydls5XSArIGx2WzhdICogcnZbMTBdICsgbHZbMTJdICogcnZbMTFdO1xuICAgIGNvbnN0IG0xMiA9IGx2WzFdICogcnZbOF0gKyBsdls1XSAqIHJ2WzldICsgbHZbOV0gKiBydlsxMF0gKyBsdlsxM10gKiBydlsxMV07XG4gICAgY29uc3QgbTIyID0gbHZbMl0gKiBydls4XSArIGx2WzZdICogcnZbOV0gKyBsdlsxMF0gKiBydlsxMF0gKyBsdlsxNF0gKiBydlsxMV07XG4gICAgY29uc3QgbTMyID0gbHZbM10gKiBydls4XSArIGx2WzddICogcnZbOV0gKyBsdlsxMV0gKiBydlsxMF0gKyBsdlsxNV0gKiBydlsxMV07XG5cbiAgICBjb25zdCBtMDMgPSBsdlswXSAqIHJ2WzEyXSArIGx2WzRdICogcnZbMTNdICsgbHZbOF0gKiBydlsxNF0gKyBsdlsxMl0gKiBydlsxNV07XG4gICAgY29uc3QgbTEzID0gbHZbMV0gKiBydlsxMl0gKyBsdls1XSAqIHJ2WzEzXSArIGx2WzldICogcnZbMTRdICsgbHZbMTNdICogcnZbMTVdO1xuICAgIGNvbnN0IG0yMyA9IGx2WzJdICogcnZbMTJdICsgbHZbNl0gKiBydlsxM10gKyBsdlsxMF0gKiBydlsxNF0gKyBsdlsxNF0gKiBydlsxNV07XG4gICAgY29uc3QgbTMzID0gbHZbM10gKiBydlsxMl0gKyBsdls3XSAqIHJ2WzEzXSArIGx2WzExXSAqIHJ2WzE0XSArIGx2WzE1XSAqIHJ2WzE1XTtcblxuICAgIHJldHVybiB0aGlzLl9mcm9tQ29weTE2Um93TWFqb3IoXG4gICAgICBtMDAsXG4gICAgICBtMDEsXG4gICAgICBtMDIsXG4gICAgICBtMDMsXG4gICAgICBtMTAsXG4gICAgICBtMTEsXG4gICAgICBtMTIsXG4gICAgICBtMTMsXG4gICAgICBtMjAsXG4gICAgICBtMjEsXG4gICAgICBtMjIsXG4gICAgICBtMjMsXG4gICAgICBtMzAsXG4gICAgICBtMzEsXG4gICAgICBtMzIsXG4gICAgICBtMzMsXG4gICAgICB0eXBlXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIHR3byA0eDQgbWF0cmljZXMgYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIGFuIG91dHB1dCBtYXRyaXguXG4gICAqIFRoaXMgaXMgdGhlIG11dGFibGUgdmVyc2lvbiBvZiB0aGUgbXVsdGlwbHkgbWV0aG9kIGZvciBwZXJmb3JtYW5jZSBvcHRpbWl6YXRpb24uXG4gICAqIEBwYXJhbSBsX21hdCAtIFRoZSBsZWZ0IG1hdHJpeCBpbiB0aGUgbXVsdGlwbGljYXRpb25cbiAgICogQHBhcmFtIHJfbWF0IC0gVGhlIHJpZ2h0IG1hdHJpeCBpbiB0aGUgbXVsdGlwbGljYXRpb25cbiAgICogQHBhcmFtIG91dE1hdCAtIFRoZSBvdXRwdXQgbWF0cml4IHRvIHN0b3JlIHRoZSByZXN1bHRcbiAgICogQHJldHVybnMgVGhlIG91dHB1dCBtYXRyaXggY29udGFpbmluZyB0aGUgbXVsdGlwbGljYXRpb24gcmVzdWx0XG4gICAqL1xuICBzdGF0aWMgX211bHRpcGx5VG8obF9tYXQ6IElNYXRyaXg0NCwgcl9tYXQ6IElNYXRyaXg0NCwgb3V0TWF0OiBJTXV0YWJsZU1hdHJpeDQ0KTogSU11dGFibGVNYXRyaXg0NCB7XG4gICAgaWYgKGxfbWF0LmlzSWRlbnRpdHlNYXRyaXhDbGFzcykge1xuICAgICAgcmV0dXJuIG91dE1hdC5jb3B5Q29tcG9uZW50cyhyX21hdCk7XG4gICAgfVxuICAgIGlmIChyX21hdC5pc0lkZW50aXR5TWF0cml4Q2xhc3MpIHtcbiAgICAgIHJldHVybiBvdXRNYXQuY29weUNvbXBvbmVudHMobF9tYXQpO1xuICAgIH1cblxuICAgIGNvbnN0IGx2ID0gbF9tYXQuX3Y7XG4gICAgY29uc3QgcnYgPSByX21hdC5fdjtcbiAgICBjb25zdCBtMDAgPSBsdlswXSAqIHJ2WzBdICsgbHZbNF0gKiBydlsxXSArIGx2WzhdICogcnZbMl0gKyBsdlsxMl0gKiBydlszXTtcbiAgICBjb25zdCBtMTAgPSBsdlsxXSAqIHJ2WzBdICsgbHZbNV0gKiBydlsxXSArIGx2WzldICogcnZbMl0gKyBsdlsxM10gKiBydlszXTtcbiAgICBjb25zdCBtMjAgPSBsdlsyXSAqIHJ2WzBdICsgbHZbNl0gKiBydlsxXSArIGx2WzEwXSAqIHJ2WzJdICsgbHZbMTRdICogcnZbM107XG4gICAgY29uc3QgbTMwID0gbHZbM10gKiBydlswXSArIGx2WzddICogcnZbMV0gKyBsdlsxMV0gKiBydlsyXSArIGx2WzE1XSAqIHJ2WzNdO1xuXG4gICAgY29uc3QgbTAxID0gbHZbMF0gKiBydls0XSArIGx2WzRdICogcnZbNV0gKyBsdls4XSAqIHJ2WzZdICsgbHZbMTJdICogcnZbN107XG4gICAgY29uc3QgbTExID0gbHZbMV0gKiBydls0XSArIGx2WzVdICogcnZbNV0gKyBsdls5XSAqIHJ2WzZdICsgbHZbMTNdICogcnZbN107XG4gICAgY29uc3QgbTIxID0gbHZbMl0gKiBydls0XSArIGx2WzZdICogcnZbNV0gKyBsdlsxMF0gKiBydls2XSArIGx2WzE0XSAqIHJ2WzddO1xuICAgIGNvbnN0IG0zMSA9IGx2WzNdICogcnZbNF0gKyBsdls3XSAqIHJ2WzVdICsgbHZbMTFdICogcnZbNl0gKyBsdlsxNV0gKiBydls3XTtcblxuICAgIGNvbnN0IG0wMiA9IGx2WzBdICogcnZbOF0gKyBsdls0XSAqIHJ2WzldICsgbHZbOF0gKiBydlsxMF0gKyBsdlsxMl0gKiBydlsxMV07XG4gICAgY29uc3QgbTEyID0gbHZbMV0gKiBydls4XSArIGx2WzVdICogcnZbOV0gKyBsdls5XSAqIHJ2WzEwXSArIGx2WzEzXSAqIHJ2WzExXTtcbiAgICBjb25zdCBtMjIgPSBsdlsyXSAqIHJ2WzhdICsgbHZbNl0gKiBydls5XSArIGx2WzEwXSAqIHJ2WzEwXSArIGx2WzE0XSAqIHJ2WzExXTtcbiAgICBjb25zdCBtMzIgPSBsdlszXSAqIHJ2WzhdICsgbHZbN10gKiBydls5XSArIGx2WzExXSAqIHJ2WzEwXSArIGx2WzE1XSAqIHJ2WzExXTtcblxuICAgIGNvbnN0IG0wMyA9IGx2WzBdICogcnZbMTJdICsgbHZbNF0gKiBydlsxM10gKyBsdls4XSAqIHJ2WzE0XSArIGx2WzEyXSAqIHJ2WzE1XTtcbiAgICBjb25zdCBtMTMgPSBsdlsxXSAqIHJ2WzEyXSArIGx2WzVdICogcnZbMTNdICsgbHZbOV0gKiBydlsxNF0gKyBsdlsxM10gKiBydlsxNV07XG4gICAgY29uc3QgbTIzID0gbHZbMl0gKiBydlsxMl0gKyBsdls2XSAqIHJ2WzEzXSArIGx2WzEwXSAqIHJ2WzE0XSArIGx2WzE0XSAqIHJ2WzE1XTtcbiAgICBjb25zdCBtMzMgPSBsdlszXSAqIHJ2WzEyXSArIGx2WzddICogcnZbMTNdICsgbHZbMTFdICogcnZbMTRdICsgbHZbMTVdICogcnZbMTVdO1xuXG4gICAgcmV0dXJuIG91dE1hdC5zZXRDb21wb25lbnRzKG0wMCwgbTAxLCBtMDIsIG0wMywgbTEwLCBtMTEsIG0xMiwgbTEzLCBtMjAsIG0yMSwgbTIyLCBtMjMsIG0zMCwgbTMxLCBtMzIsIG0zMyk7XG4gIH1cblxuICAvKipcbiAgICogTXVsdGlwbGllcyBhIG1hdHJpeCB3aXRoIGRhdGEgZnJvbSBhIHR5cGVkIGFycmF5IGFuZCBzdG9yZXMgdGhlIHJlc3VsdC5cbiAgICogVGhpcyBtZXRob2QgaXMgb3B0aW1pemVkIGZvciB3b3JraW5nIHdpdGggcmF3IGFycmF5IGRhdGEuXG4gICAqIEBwYXJhbSBsX21hdCAtIFRoZSBsZWZ0IG1hdHJpeCBpbiB0aGUgbXVsdGlwbGljYXRpb25cbiAgICogQHBhcmFtIHJfYXJyYXkgLSBUaGUgcmlnaHQgb3BlcmFuZCBhcyBhIHR5cGVkIGFycmF5XG4gICAqIEBwYXJhbSBvdXRNYXQgLSBUaGUgb3V0cHV0IG1hdHJpeCB0byBzdG9yZSB0aGUgcmVzdWx0XG4gICAqIEBwYXJhbSBvZmZzZXRBc0NvbXBvc2l0aW9uIC0gVGhlIG9mZnNldCBpbiB0aGUgYXJyYXkgZm9yIGNvbXBvc2l0aW9uIGRhdGFcbiAgICogQHJldHVybnMgVGhlIG91dHB1dCBtYXRyaXggY29udGFpbmluZyB0aGUgbXVsdGlwbGljYXRpb24gcmVzdWx0XG4gICAqL1xuICBzdGF0aWMgX211bHRpcGx5VHlwZWRBcnJheVRvKFxuICAgIGxfbWF0OiBJTWF0cml4NDQsXG4gICAgcl9hcnJheTogQXJyYXlUeXBlLFxuICAgIG91dE1hdDogSU11dGFibGVNYXRyaXg0NCxcbiAgICBvZmZzZXRBc0NvbXBvc2l0aW9uOiBudW1iZXJcbiAgKTogSU11dGFibGVNYXRyaXg0NCB7XG4gICAgKHJfYXJyYXkgYXMgYW55KVttdWxUaGF0QW5kVGhpc1RvT3V0QXNNYXQ0NF9vZmZzZXRBc0NvbXBvc2l0aW9uXShvZmZzZXRBc0NvbXBvc2l0aW9uLCBsX21hdC5fdiwgMCwgb3V0TWF0Ll92KTtcblxuICAgIHJldHVybiBvdXRNYXQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHJvdGF0aW9uIG1hdHJpeCBmcm9tIGEgcXVhdGVybmlvbiBhbmQgc3RvcmVzIGl0IGluIGFuIG91dHB1dCBtYXRyaXguXG4gICAqIEBwYXJhbSBxdWF0IC0gVGhlIHF1YXRlcm5pb24gcmVwcmVzZW50aW5nIHRoZSByb3RhdGlvblxuICAgKiBAcGFyYW0gb3V0TWF0IC0gVGhlIG91dHB1dCBtYXRyaXggdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IG1hdHJpeCBjb250YWluaW5nIHRoZSByb3RhdGlvbiBtYXRyaXhcbiAgICovXG4gIHN0YXRpYyBfZnJvbVF1YXRlcm5pb25UbyhxdWF0OiBJUXVhdGVybmlvbiwgb3V0TWF0OiBJTXV0YWJsZU1hdHJpeDQ0KTogSU11dGFibGVNYXRyaXg0NCB7XG4gICAgY29uc3Qgc3ggPSBxdWF0Ll92WzBdICogcXVhdC5fdlswXTtcbiAgICBjb25zdCBzeSA9IHF1YXQuX3ZbMV0gKiBxdWF0Ll92WzFdO1xuICAgIGNvbnN0IHN6ID0gcXVhdC5fdlsyXSAqIHF1YXQuX3ZbMl07XG4gICAgY29uc3QgY3ggPSBxdWF0Ll92WzFdICogcXVhdC5fdlsyXTtcbiAgICBjb25zdCBjeSA9IHF1YXQuX3ZbMF0gKiBxdWF0Ll92WzJdO1xuICAgIGNvbnN0IGN6ID0gcXVhdC5fdlswXSAqIHF1YXQuX3ZbMV07XG4gICAgY29uc3Qgd3ggPSBxdWF0Ll92WzNdICogcXVhdC5fdlswXTtcbiAgICBjb25zdCB3eSA9IHF1YXQuX3ZbM10gKiBxdWF0Ll92WzFdO1xuICAgIGNvbnN0IHd6ID0gcXVhdC5fdlszXSAqIHF1YXQuX3ZbMl07XG5cbiAgICBjb25zdCBtMDAgPSAxLjAgLSAyLjAgKiAoc3kgKyBzeik7XG4gICAgY29uc3QgbTAxID0gMi4wICogKGN6IC0gd3opO1xuICAgIGNvbnN0IG0wMiA9IDIuMCAqIChjeSArIHd5KTtcbiAgICBjb25zdCBtMDMgPSAwO1xuICAgIGNvbnN0IG0xMCA9IDIuMCAqIChjeiArIHd6KTtcbiAgICBjb25zdCBtMTEgPSAxLjAgLSAyLjAgKiAoc3ggKyBzeik7XG4gICAgY29uc3QgbTEyID0gMi4wICogKGN4IC0gd3gpO1xuICAgIGNvbnN0IG0xMyA9IDA7XG4gICAgY29uc3QgbTIwID0gMi4wICogKGN5IC0gd3kpO1xuICAgIGNvbnN0IG0yMSA9IDIuMCAqIChjeCArIHd4KTtcbiAgICBjb25zdCBtMjIgPSAxLjAgLSAyLjAgKiAoc3ggKyBzeSk7XG4gICAgY29uc3QgbTIzID0gMDtcbiAgICBjb25zdCBtMzAgPSAwO1xuICAgIGNvbnN0IG0zMSA9IDA7XG4gICAgY29uc3QgbTMyID0gMDtcbiAgICBjb25zdCBtMzMgPSAxO1xuXG4gICAgcmV0dXJuIG91dE1hdC5zZXRDb21wb25lbnRzKG0wMCwgbTAxLCBtMDIsIG0wMywgbTEwLCBtMTEsIG0xMiwgbTEzLCBtMjAsIG0yMSwgbTIyLCBtMjMsIG0zMCwgbTMxLCBtMzIsIG0zMyk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgdGhlIG1hdHJpeCB0byBhIGh1bWFuLXJlYWRhYmxlIHN0cmluZyByZXByZXNlbnRhdGlvbi5cbiAgICogRWxlbWVudHMgYXJlIGRpc3BsYXllZCBpbiByb3ctbWFqb3Igb3JkZXIgZm9yIGludHVpdGl2ZSByZWFkaW5nLlxuICAgKiBAcmV0dXJucyBBIGZvcm1hdHRlZCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG1hdHJpeFxuICAgKi9cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7dGhpcy5fdlswXX0gJHt0aGlzLl92WzRdfSAke3RoaXMuX3ZbOF19ICR7dGhpcy5fdlsxMl19IFxcbiR7dGhpcy5fdlsxXX0gJHt0aGlzLl92WzVdfSAke3RoaXMuX3ZbOV19ICR7dGhpcy5fdlsxM119IFxcbiR7dGhpcy5fdlsyXX0gJHt0aGlzLl92WzZdfSAke3RoaXMuX3ZbMTBdfSAke3RoaXMuX3ZbMTRdfSBcXG4ke3RoaXMuX3ZbM119ICR7dGhpcy5fdls3XX0gJHt0aGlzLl92WzExXX0gJHt0aGlzLl92WzE1XX0gXFxuYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyB0aGUgbWF0cml4IHRvIGEgaHVtYW4tcmVhZGFibGUgc3RyaW5nIHdpdGggcm91bmRlZCB2YWx1ZXMuXG4gICAqIFVzZXMgZmluYW5jaWFsIHJvdW5kaW5nIGZvciBiZXR0ZXIgcmVhZGFiaWxpdHkgb2YgZmxvYXRpbmctcG9pbnQgbnVtYmVycy5cbiAgICogQHJldHVybnMgQSBmb3JtYXR0ZWQgc3RyaW5nIHJlcHJlc2VudGF0aW9uIHdpdGggYXBwcm94aW1hdGVkIHZhbHVlc1xuICAgKi9cbiAgdG9TdHJpbmdBcHByb3hpbWF0ZWx5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke01hdGhVdGlsLmZpbmFuY2lhbCh0aGlzLl92WzBdKX0gJHtNYXRoVXRpbC5maW5hbmNpYWwodGhpcy5fdls0XSl9ICR7TWF0aFV0aWwuZmluYW5jaWFsKHRoaXMuX3ZbOF0pfSAke01hdGhVdGlsLmZpbmFuY2lhbCh0aGlzLl92WzEyXSl9IFxcbiR7TWF0aFV0aWwuZmluYW5jaWFsKHRoaXMuX3ZbMV0pfSAke01hdGhVdGlsLmZpbmFuY2lhbCh0aGlzLl92WzVdKX0gJHtNYXRoVXRpbC5maW5hbmNpYWwodGhpcy5fdls5XSl9ICR7TWF0aFV0aWwuZmluYW5jaWFsKHRoaXMuX3ZbMTNdKX0gXFxuJHtNYXRoVXRpbC5maW5hbmNpYWwodGhpcy5fdlsyXSl9ICR7TWF0aFV0aWwuZmluYW5jaWFsKHRoaXMuX3ZbNl0pfSAke01hdGhVdGlsLmZpbmFuY2lhbCh0aGlzLl92WzEwXSl9ICR7TWF0aFV0aWwuZmluYW5jaWFsKHRoaXMuX3ZbMTRdKX0gXFxuJHtNYXRoVXRpbC5maW5hbmNpYWwodGhpcy5fdlszXSl9ICR7TWF0aFV0aWwuZmluYW5jaWFsKHRoaXMuX3ZbN10pfSAke01hdGhVdGlsLmZpbmFuY2lhbCh0aGlzLl92WzExXSl9ICR7TWF0aFV0aWwuZmluYW5jaWFsKHRoaXMuX3ZbMTVdKX0gXFxuYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBGbGF0dGVucyB0aGUgbWF0cml4IGludG8gYSByZWd1bGFyIEphdmFTY3JpcHQgYXJyYXkuXG4gICAqIEVsZW1lbnRzIGFyZSByZXR1cm5lZCBpbiBjb2x1bW4tbWFqb3Igb3JkZXIgKFdlYkdMIGNvbXBhdGlibGUpLlxuICAgKiBAcmV0dXJucyBBbiBhcnJheSBjb250YWluaW5nIGFsbCAxNiBtYXRyaXggZWxlbWVudHNcbiAgICovXG4gIGZsYXR0ZW5Bc0FycmF5KCk6IG51bWJlcltdIHtcbiAgICByZXR1cm4gW1xuICAgICAgdGhpcy5fdlswXSxcbiAgICAgIHRoaXMuX3ZbMV0sXG4gICAgICB0aGlzLl92WzJdLFxuICAgICAgdGhpcy5fdlszXSxcbiAgICAgIHRoaXMuX3ZbNF0sXG4gICAgICB0aGlzLl92WzVdLFxuICAgICAgdGhpcy5fdls2XSxcbiAgICAgIHRoaXMuX3ZbN10sXG4gICAgICB0aGlzLl92WzhdLFxuICAgICAgdGhpcy5fdls5XSxcbiAgICAgIHRoaXMuX3ZbMTBdLFxuICAgICAgdGhpcy5fdlsxMV0sXG4gICAgICB0aGlzLl92WzEyXSxcbiAgICAgIHRoaXMuX3ZbMTNdLFxuICAgICAgdGhpcy5fdlsxNF0sXG4gICAgICB0aGlzLl92WzE1XSxcbiAgICBdO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGlzIGlzIGEgZHVtbXkgbWF0cml4IChlbXB0eSBhcnJheSkuXG4gICAqIEByZXR1cm5zIHRydWUgaWYgdGhlIG1hdHJpeCBoYXMgbm8gZWxlbWVudHMsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgaXNEdW1teSgpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5fdi5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoaXMgbWF0cml4IGlzIGFwcHJveGltYXRlbHkgZXF1YWwgdG8gYW5vdGhlciBtYXRyaXguXG4gICAqIEBwYXJhbSBtYXQgLSBUaGUgbWF0cml4IHRvIGNvbXBhcmUgd2l0aFxuICAgKiBAcGFyYW0gZGVsdGEgLSBUaGUgdG9sZXJhbmNlIGZvciBmbG9hdGluZy1wb2ludCBjb21wYXJpc29uIChkZWZhdWx0OiBOdW1iZXIuRVBTSUxPTilcbiAgICogQHJldHVybnMgdHJ1ZSBpZiBtYXRyaWNlcyBhcmUgYXBwcm94aW1hdGVseSBlcXVhbCB3aXRoaW4gdGhlIGdpdmVuIHRvbGVyYW5jZVxuICAgKi9cbiAgaXNFcXVhbChtYXQ6IElNYXRyaXg0NCwgZGVsdGE6IG51bWJlciA9IE51bWJlci5FUFNJTE9OKTogYm9vbGVhbiB7XG4gICAgY29uc3QgdiA9IChtYXQgYXMgTWF0cml4NDQpLl92O1xuICAgIGlmIChcbiAgICAgIE1hdGguYWJzKHZbMF0gLSB0aGlzLl92WzBdKSA8IGRlbHRhICYmXG4gICAgICBNYXRoLmFicyh2WzFdIC0gdGhpcy5fdlsxXSkgPCBkZWx0YSAmJlxuICAgICAgTWF0aC5hYnModlsyXSAtIHRoaXMuX3ZbMl0pIDwgZGVsdGEgJiZcbiAgICAgIE1hdGguYWJzKHZbM10gLSB0aGlzLl92WzNdKSA8IGRlbHRhICYmXG4gICAgICBNYXRoLmFicyh2WzRdIC0gdGhpcy5fdls0XSkgPCBkZWx0YSAmJlxuICAgICAgTWF0aC5hYnModls1XSAtIHRoaXMuX3ZbNV0pIDwgZGVsdGEgJiZcbiAgICAgIE1hdGguYWJzKHZbNl0gLSB0aGlzLl92WzZdKSA8IGRlbHRhICYmXG4gICAgICBNYXRoLmFicyh2WzddIC0gdGhpcy5fdls3XSkgPCBkZWx0YSAmJlxuICAgICAgTWF0aC5hYnModls4XSAtIHRoaXMuX3ZbOF0pIDwgZGVsdGEgJiZcbiAgICAgIE1hdGguYWJzKHZbOV0gLSB0aGlzLl92WzldKSA8IGRlbHRhICYmXG4gICAgICBNYXRoLmFicyh2WzEwXSAtIHRoaXMuX3ZbMTBdKSA8IGRlbHRhICYmXG4gICAgICBNYXRoLmFicyh2WzExXSAtIHRoaXMuX3ZbMTFdKSA8IGRlbHRhICYmXG4gICAgICBNYXRoLmFicyh2WzEyXSAtIHRoaXMuX3ZbMTJdKSA8IGRlbHRhICYmXG4gICAgICBNYXRoLmFicyh2WzEzXSAtIHRoaXMuX3ZbMTNdKSA8IGRlbHRhICYmXG4gICAgICBNYXRoLmFicyh2WzE0XSAtIHRoaXMuX3ZbMTRdKSA8IGRlbHRhICYmXG4gICAgICBNYXRoLmFicyh2WzE1XSAtIHRoaXMuX3ZbMTVdKSA8IGRlbHRhXG4gICAgKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGlzIG1hdHJpeCBpcyBleGFjdGx5IGVxdWFsIHRvIGFub3RoZXIgbWF0cml4LlxuICAgKiBVc2VzIHN0cmljdCBlcXVhbGl0eSBjb21wYXJpc29uIGZvciBhbGwgZWxlbWVudHMuXG4gICAqIEBwYXJhbSBtYXQgLSBUaGUgbWF0cml4IHRvIGNvbXBhcmUgd2l0aFxuICAgKiBAcmV0dXJucyB0cnVlIGlmIG1hdHJpY2VzIGFyZSBleGFjdGx5IGVxdWFsLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGlzU3RyaWN0RXF1YWwobWF0OiBJTWF0cml4NDQpIHtcbiAgICBpZiAoXG4gICAgICBtYXQuX3ZbMF0gPT09IHRoaXMuX3ZbMF0gJiZcbiAgICAgIG1hdC5fdlsxXSA9PT0gdGhpcy5fdlsxXSAmJlxuICAgICAgbWF0Ll92WzJdID09PSB0aGlzLl92WzJdICYmXG4gICAgICBtYXQuX3ZbM10gPT09IHRoaXMuX3ZbM10gJiZcbiAgICAgIG1hdC5fdls0XSA9PT0gdGhpcy5fdls0XSAmJlxuICAgICAgbWF0Ll92WzVdID09PSB0aGlzLl92WzVdICYmXG4gICAgICBtYXQuX3ZbNl0gPT09IHRoaXMuX3ZbNl0gJiZcbiAgICAgIG1hdC5fdls3XSA9PT0gdGhpcy5fdls3XSAmJlxuICAgICAgbWF0Ll92WzhdID09PSB0aGlzLl92WzhdICYmXG4gICAgICBtYXQuX3ZbOV0gPT09IHRoaXMuX3ZbOV0gJiZcbiAgICAgIG1hdC5fdlsxMF0gPT09IHRoaXMuX3ZbMTBdICYmXG4gICAgICBtYXQuX3ZbMTFdID09PSB0aGlzLl92WzExXSAmJlxuICAgICAgbWF0Ll92WzEyXSA9PT0gdGhpcy5fdlsxMl0gJiZcbiAgICAgIG1hdC5fdlsxM10gPT09IHRoaXMuX3ZbMTNdICYmXG4gICAgICBtYXQuX3ZbMTRdID09PSB0aGlzLl92WzE0XSAmJlxuICAgICAgbWF0Ll92WzE1XSA9PT0gdGhpcy5fdlsxNV1cbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIG1hdHJpeCBlbGVtZW50IGF0IHRoZSBzcGVjaWZpZWQgcm93IGFuZCBjb2x1bW4uXG4gICAqIEBwYXJhbSByb3dfaSAtIFRoZSByb3cgaW5kZXggKDAtMylcbiAgICogQHBhcmFtIGNvbHVtbl9pIC0gVGhlIGNvbHVtbiBpbmRleCAoMC0zKVxuICAgKiBAcmV0dXJucyBUaGUgbWF0cml4IGVsZW1lbnQgYXQgdGhlIGdpdmVuIHBvc2l0aW9uXG4gICAqL1xuICBhdChyb3dfaTogbnVtYmVyLCBjb2x1bW5faTogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdltyb3dfaSArIGNvbHVtbl9pICogNF07XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyB0aGUgZGV0ZXJtaW5hbnQgb2YgdGhpcyA0eDQgbWF0cml4LlxuICAgKiBAcmV0dXJucyBUaGUgZGV0ZXJtaW5hbnQgdmFsdWVcbiAgICovXG4gIGRldGVybWluYW50KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMuX3ZbMF0gKiB0aGlzLl92WzVdICogdGhpcy5fdlsxMF0gKiB0aGlzLl92WzE1XSArXG4gICAgICB0aGlzLl92WzBdICogdGhpcy5fdls5XSAqIHRoaXMuX3ZbMTRdICogdGhpcy5fdls3XSArXG4gICAgICB0aGlzLl92WzBdICogdGhpcy5fdlsxM10gKiB0aGlzLl92WzZdICogdGhpcy5fdlsxMV0gK1xuICAgICAgdGhpcy5fdls0XSAqIHRoaXMuX3ZbMV0gKiB0aGlzLl92WzE0XSAqIHRoaXMuX3ZbMTFdICtcbiAgICAgIHRoaXMuX3ZbNF0gKiB0aGlzLl92WzldICogdGhpcy5fdlsyXSAqIHRoaXMuX3ZbMTVdICtcbiAgICAgIHRoaXMuX3ZbNF0gKiB0aGlzLl92WzEzXSAqIHRoaXMuX3ZbMTBdICogdGhpcy5fdlszXSArXG4gICAgICB0aGlzLl92WzhdICogdGhpcy5fdlsxXSAqIHRoaXMuX3ZbNl0gKiB0aGlzLl92WzE1XSArXG4gICAgICB0aGlzLl92WzhdICogdGhpcy5fdls1XSAqIHRoaXMuX3ZbMTRdICogdGhpcy5fdlszXSArXG4gICAgICB0aGlzLl92WzhdICogdGhpcy5fdlsxM10gKiB0aGlzLl92WzJdICogdGhpcy5fdls3XSArXG4gICAgICB0aGlzLl92WzEyXSAqIHRoaXMuX3ZbMV0gKiB0aGlzLl92WzEwXSAqIHRoaXMuX3ZbN10gK1xuICAgICAgdGhpcy5fdlsxMl0gKiB0aGlzLl92WzVdICogdGhpcy5fdlsyXSAqIHRoaXMuX3ZbMTFdICtcbiAgICAgIHRoaXMuX3ZbMTJdICogdGhpcy5fdls5XSAqIHRoaXMuX3ZbNl0gKiB0aGlzLl92WzNdIC1cbiAgICAgIHRoaXMuX3ZbMF0gKiB0aGlzLl92WzVdICogdGhpcy5fdlsxNF0gKiB0aGlzLl92WzExXSAtXG4gICAgICB0aGlzLl92WzBdICogdGhpcy5fdls5XSAqIHRoaXMuX3ZbNl0gKiB0aGlzLl92WzE1XSAtXG4gICAgICB0aGlzLl92WzBdICogdGhpcy5fdlsxM10gKiB0aGlzLl92WzEwXSAqIHRoaXMuX3ZbN10gLVxuICAgICAgdGhpcy5fdls0XSAqIHRoaXMuX3ZbMV0gKiB0aGlzLl92WzEwXSAqIHRoaXMuX3ZbMTVdIC1cbiAgICAgIHRoaXMuX3ZbNF0gKiB0aGlzLl92WzldICogdGhpcy5fdlsxNF0gKiB0aGlzLl92WzNdIC1cbiAgICAgIHRoaXMuX3ZbNF0gKiB0aGlzLl92WzEzXSAqIHRoaXMuX3ZbMl0gKiB0aGlzLl92WzExXSAtXG4gICAgICB0aGlzLl92WzhdICogdGhpcy5fdlsxXSAqIHRoaXMuX3ZbMTRdICogdGhpcy5fdls3XSAtXG4gICAgICB0aGlzLl92WzhdICogdGhpcy5fdls1XSAqIHRoaXMuX3ZbMl0gKiB0aGlzLl92WzE1XSAtXG4gICAgICB0aGlzLl92WzhdICogdGhpcy5fdlsxM10gKiB0aGlzLl92WzZdICogdGhpcy5fdlszXSAtXG4gICAgICB0aGlzLl92WzEyXSAqIHRoaXMuX3ZbMV0gKiB0aGlzLl92WzZdICogdGhpcy5fdlsxMV0gLVxuICAgICAgdGhpcy5fdlsxMl0gKiB0aGlzLl92WzVdICogdGhpcy5fdlsxMF0gKiB0aGlzLl92WzNdIC1cbiAgICAgIHRoaXMuX3ZbMTJdICogdGhpcy5fdls5XSAqIHRoaXMuX3ZbMl0gKiB0aGlzLl92WzddXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIHRoaXMgbWF0cml4IHdpdGggYSA0RCB2ZWN0b3IgYW5kIHJldHVybnMgdGhlIHJlc3VsdC5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSA0RCB2ZWN0b3IgdG8gbXVsdGlwbHlcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yNCBjb250YWluaW5nIHRoZSBtdWx0aXBsaWNhdGlvbiByZXN1bHRcbiAgICovXG4gIG11bHRpcGx5VmVjdG9yKHZlYzogSVZlY3RvcjQpOiBWZWN0b3I0IHtcbiAgICBjb25zdCB4ID0gdGhpcy5fdlswXSAqIHZlYy5fdlswXSArIHRoaXMuX3ZbNF0gKiB2ZWMuX3ZbMV0gKyB0aGlzLl92WzhdICogdmVjLl92WzJdICsgdGhpcy5fdlsxMl0gKiB2ZWMuX3ZbM107XG4gICAgY29uc3QgeSA9IHRoaXMuX3ZbMV0gKiB2ZWMuX3ZbMF0gKyB0aGlzLl92WzVdICogdmVjLl92WzFdICsgdGhpcy5fdls5XSAqIHZlYy5fdlsyXSArIHRoaXMuX3ZbMTNdICogdmVjLl92WzNdO1xuICAgIGNvbnN0IHogPSB0aGlzLl92WzJdICogdmVjLl92WzBdICsgdGhpcy5fdls2XSAqIHZlYy5fdlsxXSArIHRoaXMuX3ZbMTBdICogdmVjLl92WzJdICsgdGhpcy5fdlsxNF0gKiB2ZWMuX3ZbM107XG4gICAgY29uc3QgdyA9IHRoaXMuX3ZbM10gKiB2ZWMuX3ZbMF0gKyB0aGlzLl92WzddICogdmVjLl92WzFdICsgdGhpcy5fdlsxMV0gKiB2ZWMuX3ZbMl0gKyB0aGlzLl92WzE1XSAqIHZlYy5fdlszXTtcblxuICAgIHJldHVybiBWZWN0b3I0LmZyb21Db3B5QXJyYXkoW3gsIHksIHosIHddKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIHRoaXMgbWF0cml4IHdpdGggYSA0RCB2ZWN0b3IgYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIGFuIG91dHB1dCB2ZWN0b3IuXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgNEQgdmVjdG9yIHRvIG11bHRpcGx5XG4gICAqIEBwYXJhbSBvdXRWZWMgLSBUaGUgb3V0cHV0IHZlY3RvciB0byBzdG9yZSB0aGUgcmVzdWx0XG4gICAqIEByZXR1cm5zIFRoZSBvdXRwdXQgdmVjdG9yIGNvbnRhaW5pbmcgdGhlIG11bHRpcGxpY2F0aW9uIHJlc3VsdFxuICAgKi9cbiAgbXVsdGlwbHlWZWN0b3JUbyh2ZWM6IElWZWN0b3I0LCBvdXRWZWM6IE11dGFibGVWZWN0b3I0KTogTXV0YWJsZVZlY3RvcjQge1xuICAgIGNvbnN0IHggPSB0aGlzLl92WzBdICogdmVjLl92WzBdICsgdGhpcy5fdls0XSAqIHZlYy5fdlsxXSArIHRoaXMuX3ZbOF0gKiB2ZWMuX3ZbMl0gKyB0aGlzLl92WzEyXSAqIHZlYy5fdlszXTtcbiAgICBjb25zdCB5ID0gdGhpcy5fdlsxXSAqIHZlYy5fdlswXSArIHRoaXMuX3ZbNV0gKiB2ZWMuX3ZbMV0gKyB0aGlzLl92WzldICogdmVjLl92WzJdICsgdGhpcy5fdlsxM10gKiB2ZWMuX3ZbM107XG4gICAgY29uc3QgeiA9IHRoaXMuX3ZbMl0gKiB2ZWMuX3ZbMF0gKyB0aGlzLl92WzZdICogdmVjLl92WzFdICsgdGhpcy5fdlsxMF0gKiB2ZWMuX3ZbMl0gKyB0aGlzLl92WzE0XSAqIHZlYy5fdlszXTtcbiAgICBjb25zdCB3ID0gdGhpcy5fdlszXSAqIHZlYy5fdlswXSArIHRoaXMuX3ZbN10gKiB2ZWMuX3ZbMV0gKyB0aGlzLl92WzExXSAqIHZlYy5fdlsyXSArIHRoaXMuX3ZbMTVdICogdmVjLl92WzNdO1xuICAgIG91dFZlYy5fdlswXSA9IHg7XG4gICAgb3V0VmVjLl92WzFdID0geTtcbiAgICBvdXRWZWMuX3ZbMl0gPSB6O1xuICAgIG91dFZlYy5fdlszXSA9IHc7XG5cbiAgICByZXR1cm4gb3V0VmVjO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgdGhpcyBtYXRyaXggd2l0aCBhIDREIHZlY3RvciBhbmQgc3RvcmVzIHRoZSBYWVogY29tcG9uZW50cyBpbiBhIDNEIHZlY3Rvci5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSA0RCB2ZWN0b3IgdG8gbXVsdGlwbHlcbiAgICogQHBhcmFtIG91dFZlYyAtIFRoZSBvdXRwdXQgM0QgdmVjdG9yIHRvIHN0b3JlIHRoZSBYWVogY29tcG9uZW50c1xuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHZlY3RvciBjb250YWluaW5nIHRoZSBYWVogY29tcG9uZW50cyBvZiB0aGUgcmVzdWx0XG4gICAqL1xuICBtdWx0aXBseVZlY3RvclRvVmVjMyh2ZWM6IElWZWN0b3I0LCBvdXRWZWM6IE11dGFibGVWZWN0b3IzKTogTXV0YWJsZVZlY3RvcjMge1xuICAgIGNvbnN0IHggPSB0aGlzLl92WzBdICogdmVjLl92WzBdICsgdGhpcy5fdls0XSAqIHZlYy5fdlsxXSArIHRoaXMuX3ZbOF0gKiB2ZWMuX3ZbMl0gKyB0aGlzLl92WzEyXSAqIHZlYy5fdlszXTtcbiAgICBjb25zdCB5ID0gdGhpcy5fdlsxXSAqIHZlYy5fdlswXSArIHRoaXMuX3ZbNV0gKiB2ZWMuX3ZbMV0gKyB0aGlzLl92WzldICogdmVjLl92WzJdICsgdGhpcy5fdlsxM10gKiB2ZWMuX3ZbM107XG4gICAgY29uc3QgeiA9IHRoaXMuX3ZbMl0gKiB2ZWMuX3ZbMF0gKyB0aGlzLl92WzZdICogdmVjLl92WzFdICsgdGhpcy5fdlsxMF0gKiB2ZWMuX3ZbMl0gKyB0aGlzLl92WzE0XSAqIHZlYy5fdlszXTtcbiAgICBvdXRWZWMuX3ZbMF0gPSB4O1xuICAgIG91dFZlYy5fdlsxXSA9IHk7XG4gICAgb3V0VmVjLl92WzJdID0gejtcblxuICAgIHJldHVybiBvdXRWZWM7XG4gIH1cblxuICAvKipcbiAgICogTXVsdGlwbGllcyB0aGlzIG1hdHJpeCB3aXRoIGEgM0QgdmVjdG9yICh0cmVhdGluZyBpdCBhcyBhIHBvaW50IHdpdGggdz0xKS5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSAzRCB2ZWN0b3IgdG8gbXVsdGlwbHlcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yMyBjb250YWluaW5nIHRoZSB0cmFuc2Zvcm1lZCBwb2ludFxuICAgKi9cbiAgbXVsdGlwbHlWZWN0b3IzKHZlYzogSVZlY3RvcjMpOiBWZWN0b3IzIHtcbiAgICBjb25zdCB4ID0gdGhpcy5fdlswXSAqIHZlYy5fdlswXSArIHRoaXMuX3ZbNF0gKiB2ZWMuX3ZbMV0gKyB0aGlzLl92WzhdICogdmVjLl92WzJdICsgdGhpcy5fdlsxMl07IC8vIHJlZ2FyZHMgdmVjLncodmVjLl92WzNdKSBhcyAxXG4gICAgY29uc3QgeSA9IHRoaXMuX3ZbMV0gKiB2ZWMuX3ZbMF0gKyB0aGlzLl92WzVdICogdmVjLl92WzFdICsgdGhpcy5fdls5XSAqIHZlYy5fdlsyXSArIHRoaXMuX3ZbMTNdO1xuICAgIGNvbnN0IHogPSB0aGlzLl92WzJdICogdmVjLl92WzBdICsgdGhpcy5fdls2XSAqIHZlYy5fdlsxXSArIHRoaXMuX3ZbMTBdICogdmVjLl92WzJdICsgdGhpcy5fdlsxNF07XG5cbiAgICByZXR1cm4gVmVjdG9yMy5mcm9tQ29weUFycmF5KFt4LCB5LCB6XSk7XG4gIH1cblxuICAvKipcbiAgICogTXVsdGlwbGllcyB0aGlzIG1hdHJpeCB3aXRoIGEgM0QgdmVjdG9yIGFuZCBzdG9yZXMgdGhlIHJlc3VsdCAodHJlYXRpbmcgaXQgYXMgYSBwb2ludCB3aXRoIHc9MSkuXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgM0QgdmVjdG9yIHRvIG11bHRpcGx5XG4gICAqIEBwYXJhbSBvdXRWZWMgLSBUaGUgb3V0cHV0IHZlY3RvciB0byBzdG9yZSB0aGUgcmVzdWx0XG4gICAqIEByZXR1cm5zIFRoZSBvdXRwdXQgdmVjdG9yIGNvbnRhaW5pbmcgdGhlIHRyYW5zZm9ybWVkIHBvaW50XG4gICAqL1xuICBtdWx0aXBseVZlY3RvcjNUbyh2ZWM6IElWZWN0b3IzLCBvdXRWZWM6IE11dGFibGVWZWN0b3IzKTogTXV0YWJsZVZlY3RvcjMge1xuICAgIGNvbnN0IHggPSB0aGlzLl92WzBdICogdmVjLl92WzBdICsgdGhpcy5fdls0XSAqIHZlYy5fdlsxXSArIHRoaXMuX3ZbOF0gKiB2ZWMuX3ZbMl0gKyB0aGlzLl92WzEyXTsgLy8gcmVnYXJkcyB2ZWMudyh2ZWMuX3ZbM10pIGFzIDFcbiAgICBjb25zdCB5ID0gdGhpcy5fdlsxXSAqIHZlYy5fdlswXSArIHRoaXMuX3ZbNV0gKiB2ZWMuX3ZbMV0gKyB0aGlzLl92WzldICogdmVjLl92WzJdICsgdGhpcy5fdlsxM107XG4gICAgY29uc3QgeiA9IHRoaXMuX3ZbMl0gKiB2ZWMuX3ZbMF0gKyB0aGlzLl92WzZdICogdmVjLl92WzFdICsgdGhpcy5fdlsxMF0gKiB2ZWMuX3ZbMl0gKyB0aGlzLl92WzE0XTtcbiAgICBvdXRWZWMuX3ZbMF0gPSB4O1xuICAgIG91dFZlYy5fdlsxXSA9IHk7XG4gICAgb3V0VmVjLl92WzJdID0gejtcblxuICAgIHJldHVybiBvdXRWZWM7XG4gIH1cblxuICAvKipcbiAgICogRXh0cmFjdHMgdGhlIHRyYW5zbGF0aW9uIHZlY3RvciBmcm9tIHRoaXMgdHJhbnNmb3JtYXRpb24gbWF0cml4LlxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3IzIGNvbnRhaW5pbmcgdGhlIHRyYW5zbGF0aW9uIGNvbXBvbmVudHNcbiAgICovXG4gIGdldFRyYW5zbGF0ZSgpOiBWZWN0b3IzIHtcbiAgICByZXR1cm4gVmVjdG9yMy5mcm9tQ29weUFycmF5KFt0aGlzLl92WzEyXSwgdGhpcy5fdlsxM10sIHRoaXMuX3ZbMTRdXSk7XG4gIH1cblxuICAvKipcbiAgICogRXh0cmFjdHMgdGhlIHRyYW5zbGF0aW9uIHZlY3RvciBmcm9tIHRoaXMgbWF0cml4IGFuZCBzdG9yZXMgaXQgaW4gYW4gb3V0cHV0IHZlY3Rvci5cbiAgICogQHBhcmFtIG91dFZlYyAtIFRoZSBvdXRwdXQgdmVjdG9yIHRvIHN0b3JlIHRoZSB0cmFuc2xhdGlvblxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHZlY3RvciBjb250YWluaW5nIHRoZSB0cmFuc2xhdGlvbiBjb21wb25lbnRzXG4gICAqL1xuICBnZXRUcmFuc2xhdGVUbyhvdXRWZWM6IE11dGFibGVWZWN0b3IzKTogTXV0YWJsZVZlY3RvcjMge1xuICAgIG91dFZlYy5fdlswXSA9IHRoaXMuX3ZbMTJdO1xuICAgIG91dFZlYy5fdlsxXSA9IHRoaXMuX3ZbMTNdO1xuICAgIG91dFZlYy5fdlsyXSA9IHRoaXMuX3ZbMTRdO1xuICAgIHJldHVybiBvdXRWZWM7XG4gIH1cblxuICAvKipcbiAgICogRXh0cmFjdHMgdGhlIHNjYWxlIGZhY3RvcnMgZnJvbSB0aGlzIHRyYW5zZm9ybWF0aW9uIG1hdHJpeC5cbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yMyBjb250YWluaW5nIHRoZSBzY2FsZSBjb21wb25lbnRzIGZvciBlYWNoIGF4aXNcbiAgICovXG4gIGdldFNjYWxlKCk6IFZlY3RvcjMge1xuICAgIHJldHVybiBWZWN0b3IzLmZyb21Db3B5QXJyYXkoW1xuICAgICAgTWF0aC5oeXBvdCh0aGlzLl92WzBdLCB0aGlzLl92WzFdLCB0aGlzLl92WzJdKSxcbiAgICAgIE1hdGguaHlwb3QodGhpcy5fdls0XSwgdGhpcy5fdls1XSwgdGhpcy5fdls2XSksXG4gICAgICBNYXRoLmh5cG90KHRoaXMuX3ZbOF0sIHRoaXMuX3ZbOV0sIHRoaXMuX3ZbMTBdKSxcbiAgICBdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHRyYWN0cyB0aGUgc2NhbGUgZmFjdG9ycyBmcm9tIHRoaXMgbWF0cml4IGFuZCBzdG9yZXMgdGhlbSBpbiBhbiBvdXRwdXQgdmVjdG9yLlxuICAgKiBAcGFyYW0gb3V0VmVjIC0gVGhlIG91dHB1dCB2ZWN0b3IgdG8gc3RvcmUgdGhlIHNjYWxlIGZhY3RvcnNcbiAgICogQHJldHVybnMgVGhlIG91dHB1dCB2ZWN0b3IgY29udGFpbmluZyB0aGUgc2NhbGUgY29tcG9uZW50c1xuICAgKi9cbiAgZ2V0U2NhbGVUbyhvdXRWZWM6IE11dGFibGVWZWN0b3IzKTogTXV0YWJsZVZlY3RvcjMge1xuICAgIG91dFZlYy5fdlswXSA9IE1hdGguaHlwb3QodGhpcy5fdlswXSwgdGhpcy5fdlsxXSwgdGhpcy5fdlsyXSk7XG4gICAgb3V0VmVjLl92WzFdID0gTWF0aC5oeXBvdCh0aGlzLl92WzRdLCB0aGlzLl92WzVdLCB0aGlzLl92WzZdKTtcbiAgICBvdXRWZWMuX3ZbMl0gPSBNYXRoLmh5cG90KHRoaXMuX3ZbOF0sIHRoaXMuX3ZbOV0sIHRoaXMuX3ZbMTBdKTtcbiAgICByZXR1cm4gb3V0VmVjO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHRoaXMgdHJhbnNmb3JtYXRpb24gbWF0cml4IHRvIEV1bGVyIGFuZ2xlcyAoWFlaIHJvdGF0aW9uIG9yZGVyKS5cbiAgICogQHJldHVybnMgQSBWZWN0b3IzIGNvbnRhaW5pbmcgdGhlIEV1bGVyIGFuZ2xlcyBbeCwgeSwgel0gaW4gcmFkaWFuc1xuICAgKi9cbiAgdG9FdWxlckFuZ2xlcygpOiBWZWN0b3IzIHtcbiAgICBsZXQgcm90YXRlOiBWZWN0b3IzO1xuICAgIGlmIChNYXRoLmFicyh0aGlzLl92WzJdKSAhPT0gMS4wKSB7XG4gICAgICBjb25zdCB5ID0gLU1hdGguYXNpbih0aGlzLl92WzJdKTtcbiAgICAgIGNvbnN0IHggPSBNYXRoLmF0YW4yKHRoaXMuX3ZbNl0gLyBNYXRoLmNvcyh5KSwgdGhpcy5fdlsxMF0gLyBNYXRoLmNvcyh5KSk7XG4gICAgICBjb25zdCB6ID0gTWF0aC5hdGFuMih0aGlzLl92WzFdIC8gTWF0aC5jb3MoeSksIHRoaXMuX3ZbMF0gLyBNYXRoLmNvcyh5KSk7XG4gICAgICByb3RhdGUgPSBWZWN0b3IzLmZyb21Db3B5QXJyYXkoW3gsIHksIHpdKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX3ZbMl0gPT09IC0xLjApIHtcbiAgICAgIHJvdGF0ZSA9IFZlY3RvcjMuZnJvbUNvcHlBcnJheShbTWF0aC5hdGFuMih0aGlzLl92WzRdLCB0aGlzLl92WzhdKSwgTWF0aC5QSSAvIDIuMCwgMC4wXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJvdGF0ZSA9IFZlY3RvcjMuZnJvbUNvcHlBcnJheShbTWF0aC5hdGFuMigtdGhpcy5fdls0XSwgLXRoaXMuX3ZbOF0pLCAtTWF0aC5QSSAvIDIuMCwgMC4wXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJvdGF0ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyB0aGlzIHRyYW5zZm9ybWF0aW9uIG1hdHJpeCB0byBFdWxlciBhbmdsZXMgYW5kIHN0b3JlcyB0aGVtIGluIGFuIG91dHB1dCB2ZWN0b3IuXG4gICAqIEBwYXJhbSBvdXRWZWMzIC0gVGhlIG91dHB1dCB2ZWN0b3IgdG8gc3RvcmUgdGhlIEV1bGVyIGFuZ2xlc1xuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHZlY3RvciBjb250YWluaW5nIHRoZSBFdWxlciBhbmdsZXMgW3gsIHksIHpdIGluIHJhZGlhbnNcbiAgICovXG4gIHRvRXVsZXJBbmdsZXNUbyhvdXRWZWMzOiBNdXRhYmxlVmVjdG9yMykge1xuICAgIGlmIChNYXRoLmFicyh0aGlzLl92WzJdKSAhPT0gMS4wKSB7XG4gICAgICBjb25zdCB5ID0gLU1hdGguYXNpbih0aGlzLl92WzJdKTtcbiAgICAgIGNvbnN0IHggPSBNYXRoLmF0YW4yKHRoaXMuX3ZbNl0gLyBNYXRoLmNvcyh5KSwgdGhpcy5fdlsxMF0gLyBNYXRoLmNvcyh5KSk7XG4gICAgICBjb25zdCB6ID0gTWF0aC5hdGFuMih0aGlzLl92WzFdIC8gTWF0aC5jb3MoeSksIHRoaXMuX3ZbMF0gLyBNYXRoLmNvcyh5KSk7XG4gICAgICBvdXRWZWMzLl92WzBdID0geDtcbiAgICAgIG91dFZlYzMuX3ZbMV0gPSB5O1xuICAgICAgb3V0VmVjMy5fdlsyXSA9IHo7XG4gICAgfSBlbHNlIGlmICh0aGlzLl92WzJdID09PSAtMS4wKSB7XG4gICAgICBvdXRWZWMzLl92WzBdID0gTWF0aC5hdGFuMih0aGlzLl92WzRdLCB0aGlzLl92WzhdKTtcbiAgICAgIG91dFZlYzMuX3ZbMV0gPSBNYXRoLlBJIC8gMi4wO1xuICAgICAgb3V0VmVjMy5fdlsyXSA9IDAuMDtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0VmVjMy5fdlswXSA9IE1hdGguYXRhbjIoLXRoaXMuX3ZbNF0sIC10aGlzLl92WzhdKTtcbiAgICAgIG91dFZlYzMuX3ZbMV0gPSAtTWF0aC5QSSAvIDIuMDtcbiAgICAgIG91dFZlYzMuX3ZbMl0gPSAwLjA7XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dFZlYzM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGRlZXAgY29weSBvZiB0aGlzIG1hdHJpeC5cbiAgICogQHJldHVybnMgQSBuZXcgTWF0cml4NDQgaW5zdGFuY2Ugd2l0aCB0aGUgc2FtZSB2YWx1ZXNcbiAgICovXG4gIGNsb25lKCkge1xuICAgIHJldHVybiAodGhpcy5jb25zdHJ1Y3RvciBhcyBhbnkpLmZyb21Db3B5MTZSb3dNYWpvcihcbiAgICAgIHRoaXMuX3ZbMF0sXG4gICAgICB0aGlzLl92WzRdLFxuICAgICAgdGhpcy5fdls4XSxcbiAgICAgIHRoaXMuX3ZbMTJdLFxuICAgICAgdGhpcy5fdlsxXSxcbiAgICAgIHRoaXMuX3ZbNV0sXG4gICAgICB0aGlzLl92WzldLFxuICAgICAgdGhpcy5fdlsxM10sXG4gICAgICB0aGlzLl92WzJdLFxuICAgICAgdGhpcy5fdls2XSxcbiAgICAgIHRoaXMuX3ZbMTBdLFxuICAgICAgdGhpcy5fdlsxNF0sXG4gICAgICB0aGlzLl92WzNdLFxuICAgICAgdGhpcy5fdls3XSxcbiAgICAgIHRoaXMuX3ZbMTFdLFxuICAgICAgdGhpcy5fdlsxNV1cbiAgICApIGFzIE1hdHJpeDQ0O1xuICB9XG5cbiAgLyoqXG4gICAqIEV4dHJhY3RzIHRoZSByb3RhdGlvbiBwYXJ0IG9mIHRoaXMgdHJhbnNmb3JtYXRpb24gbWF0cml4LlxuICAgKiBSZW1vdmVzIHNjYWxpbmcgZWZmZWN0cyB0byBnZXQgcHVyZSByb3RhdGlvbi5cbiAgICogQHJldHVybnMgQSBuZXcgTWF0cml4NDQgY29udGFpbmluZyBvbmx5IHRoZSByb3RhdGlvbiB0cmFuc2Zvcm1hdGlvblxuICAgKi9cbiAgZ2V0Um90YXRlKCk6IE1hdHJpeDQ0IHtcbiAgICAvLyBjb25zdCBxdWF0ID0gUXVhdGVybmlvbi5mcm9tTWF0cml4KHRoaXMpO1xuICAgIC8vIGNvbnN0IHJvdGF0ZU1hdCA9ICh0aGlzLmNvbnN0cnVjdG9yIGFzIGFueSkuZnJvbUNvcHlRdWF0ZXJuaW9uKHF1YXQpIGFzIE1hdHJpeDQ0O1xuICAgIGNvbnN0IHNjYWxlWCA9IE1hdGguaHlwb3QodGhpcy5fdlswXSwgdGhpcy5fdlsxXSwgdGhpcy5fdlsyXSk7XG4gICAgY29uc3Qgc2NhbGVZID0gTWF0aC5oeXBvdCh0aGlzLl92WzRdLCB0aGlzLl92WzVdLCB0aGlzLl92WzZdKTtcbiAgICBjb25zdCBzY2FsZVogPSBNYXRoLmh5cG90KHRoaXMuX3ZbOF0sIHRoaXMuX3ZbOV0sIHRoaXMuX3ZbMTBdKTtcblxuICAgIGNvbnN0IG1hdCA9IE1hdHJpeDQ0LmZyb21Db3B5MTZSb3dNYWpvcihcbiAgICAgIHRoaXMuX3ZbMF0gLyBzY2FsZVgsXG4gICAgICB0aGlzLl92WzRdLFxuICAgICAgdGhpcy5fdls4XSxcbiAgICAgIDAsXG4gICAgICB0aGlzLl92WzFdLFxuICAgICAgdGhpcy5fdls1XSAvIHNjYWxlWSxcbiAgICAgIHRoaXMuX3ZbOV0sXG4gICAgICAwLFxuICAgICAgdGhpcy5fdlsyXSxcbiAgICAgIHRoaXMuX3ZbNl0sXG4gICAgICB0aGlzLl92WzEwXSAvIHNjYWxlWixcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAxXG4gICAgKTtcbiAgICByZXR1cm4gbWF0O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSAxNiBpbmRpdmlkdWFsIHZhbHVlcyBpbiByb3ctbWFqb3Igb3JkZXIuXG4gICAqIFRoaXMgaXMgdGhlIG1vc3QgaW50dWl0aXZlIHdheSB0byBzcGVjaWZ5IG1hdHJpeCB2YWx1ZXMsIGFzIHlvdSBjYW5cbiAgICogd3JpdGUgdGhlbSBpbiB0aGUgc2FtZSA0eDQgbGF5b3V0IGFzIHRoZXkgYXBwZWFyIHZpc3VhbGx5LlxuICAgKiBOb3RlIHRoYXQgaW50ZXJuYWxseSwgV2ViR0wgdXNlcyBjb2x1bW4tbWFqb3Igc3RvcmFnZS5cbiAgICpcbiAgICogQHBhcmFtIG0wMCAtIEVsZW1lbnQgYXQgcm93IDAsIGNvbHVtbiAwXG4gICAqIEBwYXJhbSBtMDEgLSBFbGVtZW50IGF0IHJvdyAwLCBjb2x1bW4gMVxuICAgKiBAcGFyYW0gbTAyIC0gRWxlbWVudCBhdCByb3cgMCwgY29sdW1uIDJcbiAgICogQHBhcmFtIG0wMyAtIEVsZW1lbnQgYXQgcm93IDAsIGNvbHVtbiAzXG4gICAqIEBwYXJhbSBtMTAgLSBFbGVtZW50IGF0IHJvdyAxLCBjb2x1bW4gMFxuICAgKiBAcGFyYW0gbTExIC0gRWxlbWVudCBhdCByb3cgMSwgY29sdW1uIDFcbiAgICogQHBhcmFtIG0xMiAtIEVsZW1lbnQgYXQgcm93IDEsIGNvbHVtbiAyXG4gICAqIEBwYXJhbSBtMTMgLSBFbGVtZW50IGF0IHJvdyAxLCBjb2x1bW4gM1xuICAgKiBAcGFyYW0gbTIwIC0gRWxlbWVudCBhdCByb3cgMiwgY29sdW1uIDBcbiAgICogQHBhcmFtIG0yMSAtIEVsZW1lbnQgYXQgcm93IDIsIGNvbHVtbiAxXG4gICAqIEBwYXJhbSBtMjIgLSBFbGVtZW50IGF0IHJvdyAyLCBjb2x1bW4gMlxuICAgKiBAcGFyYW0gbTIzIC0gRWxlbWVudCBhdCByb3cgMiwgY29sdW1uIDNcbiAgICogQHBhcmFtIG0zMCAtIEVsZW1lbnQgYXQgcm93IDMsIGNvbHVtbiAwXG4gICAqIEBwYXJhbSBtMzEgLSBFbGVtZW50IGF0IHJvdyAzLCBjb2x1bW4gMVxuICAgKiBAcGFyYW0gbTMyIC0gRWxlbWVudCBhdCByb3cgMywgY29sdW1uIDJcbiAgICogQHBhcmFtIG0zMyAtIEVsZW1lbnQgYXQgcm93IDMsIGNvbHVtbiAzXG4gICAqIEByZXR1cm5zIEEgbmV3IE1hdHJpeDQ0IGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgX2Zyb21Db3B5MTZSb3dNYWpvcihcbiAgICBtMDA6IG51bWJlcixcbiAgICBtMDE6IG51bWJlcixcbiAgICBtMDI6IG51bWJlcixcbiAgICBtMDM6IG51bWJlcixcbiAgICBtMTA6IG51bWJlcixcbiAgICBtMTE6IG51bWJlcixcbiAgICBtMTI6IG51bWJlcixcbiAgICBtMTM6IG51bWJlcixcbiAgICBtMjA6IG51bWJlcixcbiAgICBtMjE6IG51bWJlcixcbiAgICBtMjI6IG51bWJlcixcbiAgICBtMjM6IG51bWJlcixcbiAgICBtMzA6IG51bWJlcixcbiAgICBtMzE6IG51bWJlcixcbiAgICBtMzI6IG51bWJlcixcbiAgICBtMzM6IG51bWJlcixcbiAgICB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3RvclxuICApOiBJTWF0cml4NDQge1xuICAgIGNvbnN0IHYgPSBuZXcgdHlwZSgxNik7XG4gICAgdlswXSA9IG0wMDtcbiAgICB2WzRdID0gbTAxO1xuICAgIHZbOF0gPSBtMDI7XG4gICAgdlsxMl0gPSBtMDM7XG4gICAgdlsxXSA9IG0xMDtcbiAgICB2WzVdID0gbTExO1xuICAgIHZbOV0gPSBtMTI7XG4gICAgdlsxM10gPSBtMTM7XG4gICAgdlsyXSA9IG0yMDtcbiAgICB2WzZdID0gbTIxO1xuICAgIHZbMTBdID0gbTIyO1xuICAgIHZbMTRdID0gbTIzO1xuICAgIHZbM10gPSBtMzA7XG4gICAgdls3XSA9IG0zMTtcbiAgICB2WzExXSA9IG0zMjtcbiAgICB2WzE1XSA9IG0zMztcbiAgICByZXR1cm4gbmV3IHRoaXModiwgeyB0eXBlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSAxNiBpbmRpdmlkdWFsIHZhbHVlcyBpbiBjb2x1bW4tbWFqb3Igb3JkZXIuXG4gICAqIFRoaXMgbWF0Y2hlcyB0aGUgaW50ZXJuYWwgc3RvcmFnZSBmb3JtYXQgdXNlZCBieSBXZWJHTC5cbiAgICpcbiAgICogQHBhcmFtIG0wMCAtIEVsZW1lbnQgYXQgcm93IDAsIGNvbHVtbiAwXG4gICAqIEBwYXJhbSBtMTAgLSBFbGVtZW50IGF0IHJvdyAxLCBjb2x1bW4gMFxuICAgKiBAcGFyYW0gbTIwIC0gRWxlbWVudCBhdCByb3cgMiwgY29sdW1uIDBcbiAgICogQHBhcmFtIG0zMCAtIEVsZW1lbnQgYXQgcm93IDMsIGNvbHVtbiAwXG4gICAqIEBwYXJhbSBtMDEgLSBFbGVtZW50IGF0IHJvdyAwLCBjb2x1bW4gMVxuICAgKiBAcGFyYW0gbTExIC0gRWxlbWVudCBhdCByb3cgMSwgY29sdW1uIDFcbiAgICogQHBhcmFtIG0yMSAtIEVsZW1lbnQgYXQgcm93IDIsIGNvbHVtbiAxXG4gICAqIEBwYXJhbSBtMzEgLSBFbGVtZW50IGF0IHJvdyAzLCBjb2x1bW4gMVxuICAgKiBAcGFyYW0gbTAyIC0gRWxlbWVudCBhdCByb3cgMCwgY29sdW1uIDJcbiAgICogQHBhcmFtIG0xMiAtIEVsZW1lbnQgYXQgcm93IDEsIGNvbHVtbiAyXG4gICAqIEBwYXJhbSBtMjIgLSBFbGVtZW50IGF0IHJvdyAyLCBjb2x1bW4gMlxuICAgKiBAcGFyYW0gbTMyIC0gRWxlbWVudCBhdCByb3cgMywgY29sdW1uIDJcbiAgICogQHBhcmFtIG0wMyAtIEVsZW1lbnQgYXQgcm93IDAsIGNvbHVtbiAzXG4gICAqIEBwYXJhbSBtMTMgLSBFbGVtZW50IGF0IHJvdyAxLCBjb2x1bW4gM1xuICAgKiBAcGFyYW0gbTIzIC0gRWxlbWVudCBhdCByb3cgMiwgY29sdW1uIDNcbiAgICogQHBhcmFtIG0zMyAtIEVsZW1lbnQgYXQgcm93IDMsIGNvbHVtbiAzXG4gICAqIEByZXR1cm5zIEEgbmV3IE1hdHJpeDQ0IGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgX2Zyb21Db3B5MTZDb2x1bW5NYWpvcihcbiAgICBtMDA6IG51bWJlcixcbiAgICBtMTA6IG51bWJlcixcbiAgICBtMjA6IG51bWJlcixcbiAgICBtMzA6IG51bWJlcixcbiAgICBtMDE6IG51bWJlcixcbiAgICBtMTE6IG51bWJlcixcbiAgICBtMjE6IG51bWJlcixcbiAgICBtMzE6IG51bWJlcixcbiAgICBtMDI6IG51bWJlcixcbiAgICBtMTI6IG51bWJlcixcbiAgICBtMjI6IG51bWJlcixcbiAgICBtMzI6IG51bWJlcixcbiAgICBtMDM6IG51bWJlcixcbiAgICBtMTM6IG51bWJlcixcbiAgICBtMjM6IG51bWJlcixcbiAgICBtMzM6IG51bWJlcixcbiAgICB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3RvclxuICApOiBJTWF0cml4NDQge1xuICAgIGNvbnN0IHYgPSBuZXcgdHlwZSgxNik7XG4gICAgdlswXSA9IG0wMDtcbiAgICB2WzRdID0gbTAxO1xuICAgIHZbOF0gPSBtMDI7XG4gICAgdlsxMl0gPSBtMDM7XG4gICAgdlsxXSA9IG0xMDtcbiAgICB2WzVdID0gbTExO1xuICAgIHZbOV0gPSBtMTI7XG4gICAgdlsxM10gPSBtMTM7XG4gICAgdlsyXSA9IG0yMDtcbiAgICB2WzZdID0gbTIxO1xuICAgIHZbMTBdID0gbTIyO1xuICAgIHZbMTRdID0gbTIzO1xuICAgIHZbM10gPSBtMzA7XG4gICAgdls3XSA9IG0zMTtcbiAgICB2WzExXSA9IG0zMjtcbiAgICB2WzE1XSA9IG0zMztcbiAgICByZXR1cm4gbmV3IHRoaXModiwgeyB0eXBlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgbWF0cml4IGJ5IGNvcHlpbmcgYW5vdGhlciBNYXRyaXg0NCBpbnN0YW5jZS5cbiAgICogQHBhcmFtIG1hdCAtIFRoZSBzb3VyY2UgbWF0cml4IHRvIGNvcHlcbiAgICogQHJldHVybnMgQSBuZXcgTWF0cml4NDQgaW5zdGFuY2Ugd2l0aCBjb3BpZWQgdmFsdWVzXG4gICAqL1xuICBzdGF0aWMgX2Zyb21Db3B5TWF0cml4NDQobWF0OiBJTWF0cml4NDQsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKTogSU1hdHJpeDQ0IHtcbiAgICBjb25zdCB2ID0gbmV3IHR5cGUoMTYpO1xuICAgIHYuc2V0KG1hdC5fdik7XG4gICAgcmV0dXJuIG5ldyB0aGlzKHYsIHsgdHlwZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbWF0cml4IGRpcmVjdGx5IGZyb20gYSBGbG9hdDMyQXJyYXkgaW4gY29sdW1uLW1ham9yIG9yZGVyLlxuICAgKiBUaGUgYXJyYXkgaXMgdXNlZCBkaXJlY3RseSB3aXRob3V0IGNvcHlpbmcgKHNoYXJlcyB0aGUgc2FtZSBtZW1vcnkpLlxuICAgKiBAcGFyYW0gZmxvYXQzMkFycmF5IC0gQSBGbG9hdDMyQXJyYXkgY29udGFpbmluZyAxNiBtYXRyaXggZWxlbWVudHNcbiAgICogQHJldHVybnMgQSBuZXcgTWF0cml4NDQgaW5zdGFuY2UgdXNpbmcgdGhlIHByb3ZpZGVkIGFycmF5XG4gICAqL1xuICBzdGF0aWMgX2Zyb21UeXBlZEFycmF5Q29sdW1uTWFqb3IoYXJyYXk6IFR5cGVkQXJyYXksIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKTogSU1hdHJpeDQ0IHtcbiAgICByZXR1cm4gbmV3IHRoaXMoYXJyYXksIHsgdHlwZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSBGbG9hdDMyQXJyYXkgaW4gY29sdW1uLW1ham9yIG9yZGVyIHdpdGggY29weWluZy5cbiAgICogQHBhcmFtIGZsb2F0MzJBcnJheSAtIEEgRmxvYXQzMkFycmF5IGNvbnRhaW5pbmcgMTYgbWF0cml4IGVsZW1lbnRzXG4gICAqIEByZXR1cm5zIEEgbmV3IE1hdHJpeDQ0IGluc3RhbmNlIHdpdGggY29waWVkIHZhbHVlc1xuICAgKi9cbiAgc3RhdGljIF9mcm9tQ29weVR5cGVkQXJyYXlDb2x1bW5NYWpvcihhcnJheTogVHlwZWRBcnJheSwgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpOiBJTWF0cml4NDQge1xuICAgIGNvbnN0IHYgPSBuZXcgdHlwZSgxNik7XG4gICAgdi5zZXQoYXJyYXkpO1xuICAgIHJldHVybiBuZXcgdGhpcyh2LCB7IHR5cGUgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgRmxvYXQzMkFycmF5IGluIHJvdy1tYWpvciBvcmRlciB3aXRoIGNvcHlpbmcuXG4gICAqIFRoZSBpbnB1dCBhcnJheSBpcyBhc3N1bWVkIHRvIGJlIGluIHJvdy1tYWpvciBvcmRlciBhbmQgd2lsbCBiZSBjb252ZXJ0ZWRcbiAgICogdG8gY29sdW1uLW1ham9yIG9yZGVyIGZvciBpbnRlcm5hbCBzdG9yYWdlLlxuICAgKiBAcGFyYW0gYXJyYXkgLSBBIEZsb2F0MzJBcnJheSBjb250YWluaW5nIDE2IG1hdHJpeCBlbGVtZW50cyBpbiByb3ctbWFqb3Igb3JkZXJcbiAgICogQHJldHVybnMgQSBuZXcgTWF0cml4NDQgaW5zdGFuY2Ugd2l0aCBjb252ZXJ0ZWQgdmFsdWVzXG4gICAqL1xuICBzdGF0aWMgX2Zyb21Db3B5VHlwZWRBcnJheVJvd01ham9yKGFycmF5OiBUeXBlZEFycmF5LCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcik6IElNYXRyaXg0NCB7XG4gICAgY29uc3QgdiA9IG5ldyB0eXBlKDE2KTtcbiAgICB2WzBdID0gYXJyYXlbMF07XG4gICAgdls0XSA9IGFycmF5WzFdO1xuICAgIHZbOF0gPSBhcnJheVsyXTtcbiAgICB2WzEyXSA9IGFycmF5WzNdO1xuICAgIHZbMV0gPSBhcnJheVs0XTtcbiAgICB2WzVdID0gYXJyYXlbNV07XG4gICAgdls5XSA9IGFycmF5WzZdO1xuICAgIHZbMTNdID0gYXJyYXlbN107XG4gICAgdlsyXSA9IGFycmF5WzhdO1xuICAgIHZbNl0gPSBhcnJheVs5XTtcbiAgICB2WzEwXSA9IGFycmF5WzEwXTtcbiAgICB2WzE0XSA9IGFycmF5WzExXTtcbiAgICB2WzNdID0gYXJyYXlbMTJdO1xuICAgIHZbN10gPSBhcnJheVsxM107XG4gICAgdlsxMV0gPSBhcnJheVsxNF07XG4gICAgdlsxNV0gPSBhcnJheVsxNV07XG4gICAgcmV0dXJuIG5ldyB0aGlzKHYsIHsgdHlwZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgNHg0IG1hdHJpeCBmcm9tIGEgM3gzIG1hdHJpeCBieSBlbWJlZGRpbmcgaXQgaW4gdGhlIHVwcGVyLWxlZnQgY29ybmVyLlxuICAgKiBUaGUgcmVzdWx0aW5nIG1hdHJpeCBoYXMgdGhlIDN4MyBtYXRyaXggaW4gdGhlIHVwcGVyLWxlZnQsIHdpdGggdGhlIGJvdHRvbS1yaWdodFxuICAgKiBlbGVtZW50IHNldCB0byAxIGFuZCBvdGhlciBlbGVtZW50cyBzZXQgdG8gMC5cbiAgICogQHBhcmFtIG1hdCAtIFRoZSAzeDMgbWF0cml4IHRvIGVtYmVkXG4gICAqIEByZXR1cm5zIEEgbmV3IE1hdHJpeDQ0IGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgX2Zyb21Db3B5TWF0cml4MzMobWF0OiBJTWF0cml4MzMsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKTogSU1hdHJpeDQ0IHtcbiAgICBjb25zdCB2ID0gbmV3IHR5cGUoMTYpO1xuICAgIHZbMF0gPSBtYXQuX3ZbMF07XG4gICAgdls0XSA9IG1hdC5fdlszXTtcbiAgICB2WzhdID0gbWF0Ll92WzZdO1xuICAgIHZbMTJdID0gMDtcbiAgICB2WzFdID0gbWF0Ll92WzFdO1xuICAgIHZbNV0gPSBtYXQuX3ZbNF07XG4gICAgdls5XSA9IG1hdC5fdls3XTtcbiAgICB2WzEzXSA9IDA7XG4gICAgdlsyXSA9IG1hdC5fdlsyXTtcbiAgICB2WzZdID0gbWF0Ll92WzVdO1xuICAgIHZbMTBdID0gbWF0Ll92WzhdO1xuICAgIHZbMTRdID0gMDtcbiAgICB2WzNdID0gMDtcbiAgICB2WzddID0gMDtcbiAgICB2WzExXSA9IDA7XG4gICAgdlsxNV0gPSAxO1xuICAgIHJldHVybiBuZXcgdGhpcyh2LCB7IHR5cGUgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgZml4ZWQtc2l6ZSBhcnJheSAoQXJyYXkxNikgaW4gY29sdW1uLW1ham9yIG9yZGVyLlxuICAgKiBAcGFyYW0gYXJyYXkgLSBBbiBBcnJheTE2IGNvbnRhaW5pbmcgZXhhY3RseSAxNiBtYXRyaXggZWxlbWVudHNcbiAgICogQHJldHVybnMgQSBuZXcgTWF0cml4NDQgaW5zdGFuY2Ugd2l0aCBjb3BpZWQgdmFsdWVzXG4gICAqL1xuICBzdGF0aWMgX2Zyb21Db3B5QXJyYXkxNkNvbHVtbk1ham9yKGFycmF5OiBBcnJheTE2PG51bWJlcj4sIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKTogSU1hdHJpeDQ0IHtcbiAgICBjb25zdCB2ID0gbmV3IHR5cGUoMTYpO1xuICAgIHYuc2V0KGFycmF5KTtcbiAgICByZXR1cm4gbmV3IHRoaXModiwgeyB0eXBlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIHZhcmlhYmxlLWxlbmd0aCBhcnJheSBpbiBjb2x1bW4tbWFqb3Igb3JkZXIuXG4gICAqIEBwYXJhbSBhcnJheSAtIEFuIGFycmF5IGNvbnRhaW5pbmcgYXQgbGVhc3QgMTYgbWF0cml4IGVsZW1lbnRzXG4gICAqIEByZXR1cm5zIEEgbmV3IE1hdHJpeDQ0IGluc3RhbmNlIHdpdGggY29waWVkIHZhbHVlc1xuICAgKi9cbiAgc3RhdGljIF9mcm9tQ29weUFycmF5Q29sdW1uTWFqb3IoYXJyYXk6IEFycmF5PG51bWJlcj4sIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKTogSU1hdHJpeDQ0IHtcbiAgICBjb25zdCB2ID0gbmV3IHR5cGUoMTYpO1xuICAgIHYuc2V0KGFycmF5KTtcbiAgICByZXR1cm4gbmV3IHRoaXModiwgeyB0eXBlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIGZpeGVkLXNpemUgYXJyYXkgKEFycmF5MTYpIGluIHJvdy1tYWpvciBvcmRlci5cbiAgICogVGhlIGlucHV0IGFycmF5IGlzIGNvbnZlcnRlZCBmcm9tIHJvdy1tYWpvciB0byBjb2x1bW4tbWFqb3Igb3JkZXIuXG4gICAqIEBwYXJhbSBhcnJheSAtIEFuIEFycmF5MTYgY29udGFpbmluZyBleGFjdGx5IDE2IG1hdHJpeCBlbGVtZW50cyBpbiByb3ctbWFqb3Igb3JkZXJcbiAgICogQHJldHVybnMgQSBuZXcgTWF0cml4NDQgaW5zdGFuY2Ugd2l0aCBjb252ZXJ0ZWQgdmFsdWVzXG4gICAqL1xuICBzdGF0aWMgX2Zyb21Db3B5QXJyYXkxNlJvd01ham9yKGFycmF5OiBBcnJheTE2PG51bWJlcj4sIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKTogSU1hdHJpeDQ0IHtcbiAgICBjb25zdCB2ID0gbmV3IHR5cGUoMTYpO1xuICAgIHZbMF0gPSBhcnJheVswXTtcbiAgICB2WzRdID0gYXJyYXlbMV07XG4gICAgdls4XSA9IGFycmF5WzJdO1xuICAgIHZbMTJdID0gYXJyYXlbM107XG4gICAgdlsxXSA9IGFycmF5WzRdO1xuICAgIHZbNV0gPSBhcnJheVs1XTtcbiAgICB2WzldID0gYXJyYXlbNl07XG4gICAgdlsxM10gPSBhcnJheVs3XTtcbiAgICB2WzJdID0gYXJyYXlbOF07XG4gICAgdls2XSA9IGFycmF5WzldO1xuICAgIHZbMTBdID0gYXJyYXlbMTBdO1xuICAgIHZbMTRdID0gYXJyYXlbMTFdO1xuICAgIHZbM10gPSBhcnJheVsxMl07XG4gICAgdls3XSA9IGFycmF5WzEzXTtcbiAgICB2WzExXSA9IGFycmF5WzE0XTtcbiAgICB2WzE1XSA9IGFycmF5WzE1XTtcbiAgICByZXR1cm4gbmV3IHRoaXModiwgeyB0eXBlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIHZhcmlhYmxlLWxlbmd0aCBhcnJheSBpbiByb3ctbWFqb3Igb3JkZXIuXG4gICAqIFRoZSBpbnB1dCBhcnJheSBpcyBjb252ZXJ0ZWQgZnJvbSByb3ctbWFqb3IgdG8gY29sdW1uLW1ham9yIG9yZGVyLlxuICAgKiBAcGFyYW0gYXJyYXkgLSBBbiBhcnJheSBjb250YWluaW5nIGF0IGxlYXN0IDE2IG1hdHJpeCBlbGVtZW50cyBpbiByb3ctbWFqb3Igb3JkZXJcbiAgICogQHJldHVybnMgQSBuZXcgTWF0cml4NDQgaW5zdGFuY2Ugd2l0aCBjb252ZXJ0ZWQgdmFsdWVzXG4gICAqL1xuICBzdGF0aWMgX2Zyb21Db3B5QXJyYXlSb3dNYWpvcihhcnJheTogQXJyYXk8bnVtYmVyPiwgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpOiBJTWF0cml4NDQge1xuICAgIGNvbnN0IHYgPSBuZXcgdHlwZSgxNik7XG4gICAgdlswXSA9IGFycmF5WzBdO1xuICAgIHZbNF0gPSBhcnJheVsxXTtcbiAgICB2WzhdID0gYXJyYXlbMl07XG4gICAgdlsxMl0gPSBhcnJheVszXTtcbiAgICB2WzFdID0gYXJyYXlbNF07XG4gICAgdls1XSA9IGFycmF5WzVdO1xuICAgIHZbOV0gPSBhcnJheVs2XTtcbiAgICB2WzEzXSA9IGFycmF5WzddO1xuICAgIHZbMl0gPSBhcnJheVs4XTtcbiAgICB2WzZdID0gYXJyYXlbOV07XG4gICAgdlsxMF0gPSBhcnJheVsxMF07XG4gICAgdlsxNF0gPSBhcnJheVsxMV07XG4gICAgdlszXSA9IGFycmF5WzEyXTtcbiAgICB2WzddID0gYXJyYXlbMTNdO1xuICAgIHZbMTFdID0gYXJyYXlbMTRdO1xuICAgIHZbMTVdID0gYXJyYXlbMTVdO1xuICAgIHJldHVybiBuZXcgdGhpcyh2LCB7IHR5cGUgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHJvdGF0aW9uIG1hdHJpeCBmcm9tIGEgcXVhdGVybmlvbi5cbiAgICogQHBhcmFtIHEgLSBUaGUgcXVhdGVybmlvbiByZXByZXNlbnRpbmcgdGhlIHJvdGF0aW9uXG4gICAqIEByZXR1cm5zIEEgbmV3IE1hdHJpeDQ0IGluc3RhbmNlIHJlcHJlc2VudGluZyB0aGUgcm90YXRpb24gdHJhbnNmb3JtYXRpb25cbiAgICovXG4gIHN0YXRpYyBfZnJvbUNvcHlRdWF0ZXJuaW9uKHE6IElRdWF0ZXJuaW9uLCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcik6IElNYXRyaXg0NCB7XG4gICAgY29uc3Qgc3ggPSBxLl92WzBdICogcS5fdlswXTtcbiAgICBjb25zdCBzeSA9IHEuX3ZbMV0gKiBxLl92WzFdO1xuICAgIGNvbnN0IHN6ID0gcS5fdlsyXSAqIHEuX3ZbMl07XG4gICAgY29uc3QgY3ggPSBxLl92WzFdICogcS5fdlsyXTtcbiAgICBjb25zdCBjeSA9IHEuX3ZbMF0gKiBxLl92WzJdO1xuICAgIGNvbnN0IGN6ID0gcS5fdlswXSAqIHEuX3ZbMV07XG4gICAgY29uc3Qgd3ggPSBxLl92WzNdICogcS5fdlswXTtcbiAgICBjb25zdCB3eSA9IHEuX3ZbM10gKiBxLl92WzFdO1xuICAgIGNvbnN0IHd6ID0gcS5fdlszXSAqIHEuX3ZbMl07XG4gICAgY29uc3QgdiA9IG5ldyB0eXBlKDE2KTtcbiAgICB2WzBdID0gMS4wIC0gMi4wICogKHN5ICsgc3opO1xuICAgIHZbNF0gPSAyLjAgKiAoY3ogLSB3eik7XG4gICAgdls4XSA9IDIuMCAqIChjeSArIHd5KTtcbiAgICB2WzEyXSA9IDA7XG4gICAgdlsxXSA9IDIuMCAqIChjeiArIHd6KTtcbiAgICB2WzVdID0gMS4wIC0gMi4wICogKHN4ICsgc3opO1xuICAgIHZbOV0gPSAyLjAgKiAoY3ggLSB3eCk7XG4gICAgdlsxM10gPSAwO1xuICAgIHZbMl0gPSAyLjAgKiAoY3kgLSB3eSk7XG4gICAgdls2XSA9IDIuMCAqIChjeCArIHd4KTtcbiAgICB2WzEwXSA9IDEuMCAtIDIuMCAqIChzeCArIHN5KTtcbiAgICB2WzE0XSA9IDA7XG4gICAgdlszXSA9IDA7XG4gICAgdls3XSA9IDA7XG4gICAgdlsxMV0gPSAwO1xuICAgIHZbMTVdID0gMTtcblxuICAgIHJldHVybiBuZXcgdGhpcyh2LCB7IHR5cGUgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbW11dGFibGUgNHg0IG1hdHJpeCB3aXRoIDMyLWJpdCBmbG9hdCBjb21wb25lbnRzLlxuICogVGhpcyBpcyB0aGUgc3RhbmRhcmQgcHJlY2lzaW9uIGltcGxlbWVudGF0aW9uIGZvciB0cmFuc2Zvcm1zLCBjYW1lcmFzLCBhbmQgcHJvamVjdGlvbnMuXG4gKi9cbmV4cG9ydCBjbGFzcyBNYXRyaXg0NCBleHRlbmRzIE1hdHJpeDQ0XzxGbG9hdDMyQXJyYXlDb25zdHJ1Y3Rvcj4ge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNYXRyaXg0NCBpbnN0YW5jZS5cbiAgICogQHBhcmFtIG0gLSBUaGUgdHlwZWQgYXJyYXkgY29udGFpbmluZyB0aGUgbWF0cml4IGNvbXBvbmVudHNcbiAgICovXG4gIGNvbnN0cnVjdG9yKG06IFR5cGVkQXJyYXkpIHtcbiAgICBzdXBlcihtLCB7IHR5cGU6IEZsb2F0MzJBcnJheSB9KTtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgemVybyBtYXRyaXguICovXG4gIHN0YXRpYyB6ZXJvKCk6IE1hdHJpeDQ0IHtcbiAgICByZXR1cm4gc3VwZXIuX3plcm8oRmxvYXQzMkFycmF5KSBhcyBNYXRyaXg0NDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGFuIGlkZW50aXR5IG1hdHJpeCAob3B0aW1pemVkIElkZW50aXR5TWF0cml4NDQgaW5zdGFuY2UpLiAqL1xuICBzdGF0aWMgaWRlbnRpdHkoKTogSWRlbnRpdHlNYXRyaXg0NCB7XG4gICAgcmV0dXJuIG5ldyBJZGVudGl0eU1hdHJpeDQ0KCk7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIGR1bW15IG1hdHJpeCB3aXRoIGFuIGVtcHR5IGFycmF5LiAqL1xuICBzdGF0aWMgZHVtbXkoKTogTWF0cml4NDQge1xuICAgIHJldHVybiBzdXBlci5fZHVtbXkoRmxvYXQzMkFycmF5KSBhcyBNYXRyaXg0NDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIHRoZSB0cmFuc3Bvc2Ugb2YgdGhlIGdpdmVuIG1hdHJpeC4gKi9cbiAgc3RhdGljIHRyYW5zcG9zZShtYXQ6IElNYXRyaXg0NCk6IE1hdHJpeDQ0IHtcbiAgICByZXR1cm4gc3VwZXIuX3RyYW5zcG9zZShtYXQsIEZsb2F0MzJBcnJheSkgYXMgTWF0cml4NDQ7XG4gIH1cblxuICAvKiogQXR0ZW1wdHMgdG8gaW52ZXJ0IHRoZSBnaXZlbiBtYXRyaXgsIHJldHVybmluZyBudWxsIHdoZW4gaXQgaXMgc2luZ3VsYXIuICovXG4gIHN0YXRpYyB0cnlJbnZlcnQobWF0OiBJTWF0cml4NDQpOiBNYXRyaXg0NCB8IG51bGwge1xuICAgIHJldHVybiBzdXBlci5fdHJ5SW52ZXJ0KG1hdCwgRmxvYXQzMkFycmF5KSBhcyBNYXRyaXg0NCB8IG51bGw7XG4gIH1cblxuICAvKiogQ3JlYXRlcyB0aGUgaW52ZXJzZSBvZiB0aGUgZ2l2ZW4gbWF0cml4IChpZGVudGl0eSB3aGVuIHNpbmd1bGFyKS4gKi9cbiAgc3RhdGljIGludmVydChtYXQ6IElNYXRyaXg0NCk6IE1hdHJpeDQ0IHtcbiAgICByZXR1cm4gc3VwZXIuX2ludmVydChtYXQsIEZsb2F0MzJBcnJheSkgYXMgTWF0cml4NDQ7XG4gIH1cblxuICAvKiogQXR0ZW1wdHMgdG8gaW52ZXJ0IHRoZSBnaXZlbiBtYXRyaXggaW50byBvdXRNYXQuICovXG4gIHN0YXRpYyB0cnlJbnZlcnRUbzxUIGV4dGVuZHMgSU11dGFibGVNYXRyaXg0ND4obWF0OiBJTWF0cml4NDQsIG91dE1hdDogVCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBzdXBlci5fdHJ5SW52ZXJ0VG8obWF0LCBvdXRNYXQpO1xuICB9XG5cbiAgLyoqIEludmVydHMgdGhlIGdpdmVuIG1hdHJpeCBpbnRvIG91dE1hdCAoaWRlbnRpdHkgd2hlbiBzaW5ndWxhcikuICovXG4gIHN0YXRpYyBpbnZlcnRUbzxUIGV4dGVuZHMgSU11dGFibGVNYXRyaXg0ND4obWF0OiBJTWF0cml4NDQsIG91dE1hdDogVCk6IFQge1xuICAgIHJldHVybiBzdXBlci5faW52ZXJ0VG8obWF0LCBvdXRNYXQpIGFzIFQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIHRyYW5zbGF0aW9uIG1hdHJpeC4gKi9cbiAgc3RhdGljIHRyYW5zbGF0ZSh2ZWM6IElWZWN0b3IzKTogTWF0cml4NDQge1xuICAgIHJldHVybiBzdXBlci5fdHJhbnNsYXRlKHZlYywgRmxvYXQzMkFycmF5KSBhcyBNYXRyaXg0NDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgcm90YXRpb24gbWF0cml4IGFyb3VuZCB0aGUgWC1heGlzLiAqL1xuICBzdGF0aWMgcm90YXRlWChyYWRpYW46IG51bWJlcik6IE1hdHJpeDQ0IHtcbiAgICByZXR1cm4gc3VwZXIuX3JvdGF0ZVgocmFkaWFuLCBGbG9hdDMyQXJyYXkpIGFzIE1hdHJpeDQ0O1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSByb3RhdGlvbiBtYXRyaXggYXJvdW5kIHRoZSBZLWF4aXMuICovXG4gIHN0YXRpYyByb3RhdGVZKHJhZGlhbjogbnVtYmVyKTogTWF0cml4NDQge1xuICAgIHJldHVybiBzdXBlci5fcm90YXRlWShyYWRpYW4sIEZsb2F0MzJBcnJheSkgYXMgTWF0cml4NDQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIHJvdGF0aW9uIG1hdHJpeCBhcm91bmQgdGhlIFotYXhpcy4gKi9cbiAgc3RhdGljIHJvdGF0ZVoocmFkaWFuOiBudW1iZXIpOiBNYXRyaXg0NCB7XG4gICAgcmV0dXJuIHN1cGVyLl9yb3RhdGVaKHJhZGlhbiwgRmxvYXQzMkFycmF5KSBhcyBNYXRyaXg0NDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgcm90YXRpb24gbWF0cml4IGZyb20gRXVsZXIgYW5nbGVzIGluIFhZWiBvcmRlci4gKi9cbiAgc3RhdGljIHJvdGF0ZVhZWih4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyKTogTWF0cml4NDQge1xuICAgIHJldHVybiBzdXBlci5fcm90YXRlWFlaKHgsIHksIHosIEZsb2F0MzJBcnJheSkgYXMgTWF0cml4NDQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIHJvdGF0aW9uIG1hdHJpeCBmcm9tIGEgdmVjdG9yIGNvbnRhaW5pbmcgRXVsZXIgYW5nbGVzLiAqL1xuICBzdGF0aWMgcm90YXRlKHZlYzogSVZlY3RvcjMpOiBNYXRyaXg0NCB7XG4gICAgcmV0dXJuIHN1cGVyLl9yb3RhdGUodmVjLCBGbG9hdDMyQXJyYXkpIGFzIE1hdHJpeDQ0O1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBzY2FsaW5nIG1hdHJpeC4gKi9cbiAgc3RhdGljIHNjYWxlKHZlYzogSVZlY3RvcjMpOiBNYXRyaXg0NCB7XG4gICAgcmV0dXJuIHN1cGVyLl9zY2FsZSh2ZWMsIEZsb2F0MzJBcnJheSkgYXMgTWF0cml4NDQ7XG4gIH1cblxuICAvKiogTXVsdGlwbGllcyB0d28gbWF0cmljZXMuICovXG4gIHN0YXRpYyBtdWx0aXBseShsX21hdDogSU1hdHJpeDQ0LCByX21hdDogSU1hdHJpeDQ0KTogTWF0cml4NDQge1xuICAgIHJldHVybiBzdXBlci5fbXVsdGlwbHkobF9tYXQsIHJfbWF0LCBGbG9hdDMyQXJyYXkpIGFzIE1hdHJpeDQ0O1xuICB9XG5cbiAgLyoqIE11bHRpcGxpZXMgdHdvIG1hdHJpY2VzIGFuZCBzdG9yZXMgdGhlIHJlc3VsdCBpbiBvdXRNYXQuICovXG4gIHN0YXRpYyBtdWx0aXBseVRvPFQgZXh0ZW5kcyBJTXV0YWJsZU1hdHJpeDQ0PihsX21hdDogSU1hdHJpeDQ0LCByX21hdDogSU1hdHJpeDQ0LCBvdXRNYXQ6IFQpOiBUIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5VG8obF9tYXQsIHJfbWF0LCBvdXRNYXQpIGFzIFQ7XG4gIH1cblxuICAvKiogTXVsdGlwbGllcyBhIG1hdHJpeCB3aXRoIHR5cGVkIGFycmF5IGRhdGEgYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIG91dE1hdC4gKi9cbiAgc3RhdGljIG11bHRpcGx5VHlwZWRBcnJheVRvPFQgZXh0ZW5kcyBJTXV0YWJsZU1hdHJpeDQ0PihcbiAgICBsX21hdDogSU1hdHJpeDQ0LFxuICAgIHJfYXJyYXk6IEFycmF5VHlwZSxcbiAgICBvdXRNYXQ6IFQsXG4gICAgb2Zmc2V0QXNDb21wb3NpdGlvbjogbnVtYmVyXG4gICk6IFQge1xuICAgIHJldHVybiBzdXBlci5fbXVsdGlwbHlUeXBlZEFycmF5VG8obF9tYXQsIHJfYXJyYXksIG91dE1hdCwgb2Zmc2V0QXNDb21wb3NpdGlvbikgYXMgVDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgcm90YXRpb24gbWF0cml4IGZyb20gYSBxdWF0ZXJuaW9uIGFuZCBzdG9yZXMgaXQgaW4gb3V0TWF0LiAqL1xuICBzdGF0aWMgZnJvbVF1YXRlcm5pb25UbzxUIGV4dGVuZHMgSU11dGFibGVNYXRyaXg0ND4ocXVhdDogSVF1YXRlcm5pb24sIG91dE1hdDogVCk6IFQge1xuICAgIHJldHVybiBzdXBlci5fZnJvbVF1YXRlcm5pb25UbyhxdWF0LCBvdXRNYXQpIGFzIFQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIHJvdy1tYWpvciBjb21wb25lbnRzLiAqL1xuICAvLyBwcmV0dGllci1pZ25vcmVcbiAgc3RhdGljIGZyb21Db3B5MTZSb3dNYWpvcihcbiAgICBtMDA6IG51bWJlcixcbiAgICBtMDE6IG51bWJlcixcbiAgICBtMDI6IG51bWJlcixcbiAgICBtMDM6IG51bWJlcixcbiAgICBtMTA6IG51bWJlcixcbiAgICBtMTE6IG51bWJlcixcbiAgICBtMTI6IG51bWJlcixcbiAgICBtMTM6IG51bWJlcixcbiAgICBtMjA6IG51bWJlcixcbiAgICBtMjE6IG51bWJlcixcbiAgICBtMjI6IG51bWJlcixcbiAgICBtMjM6IG51bWJlcixcbiAgICBtMzA6IG51bWJlcixcbiAgICBtMzE6IG51bWJlcixcbiAgICBtMzI6IG51bWJlcixcbiAgICBtMzM6IG51bWJlclxuICApOiBNYXRyaXg0NCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weTE2Um93TWFqb3IoXG4gICAgICBtMDAsXG4gICAgICBtMDEsXG4gICAgICBtMDIsXG4gICAgICBtMDMsXG4gICAgICBtMTAsXG4gICAgICBtMTEsXG4gICAgICBtMTIsXG4gICAgICBtMTMsXG4gICAgICBtMjAsXG4gICAgICBtMjEsXG4gICAgICBtMjIsXG4gICAgICBtMjMsXG4gICAgICBtMzAsXG4gICAgICBtMzEsXG4gICAgICBtMzIsXG4gICAgICBtMzMsXG4gICAgICBGbG9hdDMyQXJyYXlcbiAgICApIGFzIE1hdHJpeDQ0O1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBjb2x1bW4tbWFqb3IgY29tcG9uZW50cy4gKi9cbiAgLy8gcHJldHRpZXItaWdub3JlXG4gIHN0YXRpYyBmcm9tQ29weTE2Q29sdW1uTWFqb3IoXG4gICAgbTAwOiBudW1iZXIsXG4gICAgbTEwOiBudW1iZXIsXG4gICAgbTIwOiBudW1iZXIsXG4gICAgbTMwOiBudW1iZXIsXG4gICAgbTAxOiBudW1iZXIsXG4gICAgbTExOiBudW1iZXIsXG4gICAgbTIxOiBudW1iZXIsXG4gICAgbTMxOiBudW1iZXIsXG4gICAgbTAyOiBudW1iZXIsXG4gICAgbTEyOiBudW1iZXIsXG4gICAgbTIyOiBudW1iZXIsXG4gICAgbTMyOiBudW1iZXIsXG4gICAgbTAzOiBudW1iZXIsXG4gICAgbTEzOiBudW1iZXIsXG4gICAgbTIzOiBudW1iZXIsXG4gICAgbTMzOiBudW1iZXJcbiAgKTogTWF0cml4NDQge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHkxNkNvbHVtbk1ham9yKFxuICAgICAgbTAwLFxuICAgICAgbTEwLFxuICAgICAgbTIwLFxuICAgICAgbTMwLFxuICAgICAgbTAxLFxuICAgICAgbTExLFxuICAgICAgbTIxLFxuICAgICAgbTMxLFxuICAgICAgbTAyLFxuICAgICAgbTEyLFxuICAgICAgbTIyLFxuICAgICAgbTMyLFxuICAgICAgbTAzLFxuICAgICAgbTEzLFxuICAgICAgbTIzLFxuICAgICAgbTMzLFxuICAgICAgRmxvYXQzMkFycmF5XG4gICAgKSBhcyBNYXRyaXg0NDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGJ5IGNvcHlpbmcgYW5vdGhlciBtYXRyaXguICovXG4gIHN0YXRpYyBmcm9tQ29weU1hdHJpeDQ0KG1hdDogSU1hdHJpeDQ0KTogTWF0cml4NDQge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlNYXRyaXg0NChtYXQsIEZsb2F0MzJBcnJheSkgYXMgTWF0cml4NDQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCB0aGF0IGRpcmVjdGx5IHVzZXMgdGhlIGdpdmVuIEZsb2F0MzJBcnJheS4gKi9cbiAgc3RhdGljIGZyb21GbG9hdDMyQXJyYXlDb2x1bW5NYWpvcihhcnJheTogRmxvYXQzMkFycmF5KTogTWF0cml4NDQge1xuICAgIHJldHVybiBzdXBlci5fZnJvbVR5cGVkQXJyYXlDb2x1bW5NYWpvcihhcnJheSwgRmxvYXQzMkFycmF5KSBhcyBNYXRyaXg0NDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGJ5IGNvcHlpbmcgYSBGbG9hdDMyQXJyYXkgaW4gY29sdW1uLW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlGbG9hdDMyQXJyYXlDb2x1bW5NYWpvcihhcnJheTogRmxvYXQzMkFycmF5KTogTWF0cml4NDQge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlUeXBlZEFycmF5Q29sdW1uTWFqb3IoYXJyYXksIEZsb2F0MzJBcnJheSkgYXMgTWF0cml4NDQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBieSBjb3B5aW5nIGEgRmxvYXQzMkFycmF5IGluIHJvdy1tYWpvciBvcmRlci4gKi9cbiAgc3RhdGljIGZyb21Db3B5RmxvYXQzMkFycmF5Um93TWFqb3IoYXJyYXk6IEZsb2F0MzJBcnJheSk6IE1hdHJpeDQ0IHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5VHlwZWRBcnJheVJvd01ham9yKGFycmF5LCBGbG9hdDMyQXJyYXkpIGFzIE1hdHJpeDQ0O1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIDN4MyBtYXRyaXggZW1iZWRkZWQgaW4gdGhlIHVwcGVyLWxlZnQgY29ybmVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlNYXRyaXgzMyhtYXQ6IElNYXRyaXgzMyk6IE1hdHJpeDQ0IHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5TWF0cml4MzMobWF0LCBGbG9hdDMyQXJyYXkpIGFzIE1hdHJpeDQ0O1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIDE2LWVsZW1lbnQgYXJyYXkgaW4gY29sdW1uLW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheTE2Q29sdW1uTWFqb3IoYXJyYXk6IEFycmF5MTY8bnVtYmVyPik6IE1hdHJpeDQ0IHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5QXJyYXkxNkNvbHVtbk1ham9yKGFycmF5LCBGbG9hdDMyQXJyYXkpIGFzIE1hdHJpeDQ0O1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhbiBhcnJheSBpbiBjb2x1bW4tbWFqb3Igb3JkZXIuICovXG4gIHN0YXRpYyBmcm9tQ29weUFycmF5Q29sdW1uTWFqb3IoYXJyYXk6IEFycmF5PG51bWJlcj4pOiBNYXRyaXg0NCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weUFycmF5Q29sdW1uTWFqb3IoYXJyYXksIEZsb2F0MzJBcnJheSkgYXMgTWF0cml4NDQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgMTYtZWxlbWVudCBhcnJheSBpbiByb3ctbWFqb3Igb3JkZXIuICovXG4gIHN0YXRpYyBmcm9tQ29weUFycmF5MTZSb3dNYWpvcihhcnJheTogQXJyYXkxNjxudW1iZXI+KTogTWF0cml4NDQge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlBcnJheTE2Um93TWFqb3IoYXJyYXksIEZsb2F0MzJBcnJheSkgYXMgTWF0cml4NDQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGFuIGFycmF5IGluIHJvdy1tYWpvciBvcmRlci4gKi9cbiAgc3RhdGljIGZyb21Db3B5QXJyYXlSb3dNYWpvcihhcnJheTogQXJyYXk8bnVtYmVyPik6IE1hdHJpeDQ0IHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5QXJyYXlSb3dNYWpvcihhcnJheSwgRmxvYXQzMkFycmF5KSBhcyBNYXRyaXg0NDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgcm90YXRpb24gbWF0cml4IGZyb20gYSBxdWF0ZXJuaW9uLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlRdWF0ZXJuaW9uKHE6IElRdWF0ZXJuaW9uKTogTWF0cml4NDQge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlRdWF0ZXJuaW9uKHEsIEZsb2F0MzJBcnJheSkgYXMgTWF0cml4NDQ7XG4gIH1cbn1cblxuLyoqXG4gKiBJbW11dGFibGUgNHg0IG1hdHJpeCB3aXRoIDY0LWJpdCBmbG9hdCBjb21wb25lbnRzLlxuICogVXNlIHRoaXMgaW1wbGVtZW50YXRpb24gd2hlbiBoaWdoZXIgbnVtZXJpY2FsIHByZWNpc2lvbiBpcyByZXF1aXJlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIE1hdHJpeDQ0RCBleHRlbmRzIE1hdHJpeDQ0XzxGbG9hdDY0QXJyYXlDb25zdHJ1Y3Rvcj4ge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNYXRyaXg0NEQgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSBtIC0gVGhlIHR5cGVkIGFycmF5IGNvbnRhaW5pbmcgdGhlIG1hdHJpeCBjb21wb25lbnRzXG4gICAqL1xuICBwcml2YXRlIGNvbnN0cnVjdG9yKG06IFR5cGVkQXJyYXkpIHtcbiAgICBzdXBlcihtLCB7IHR5cGU6IEZsb2F0NjRBcnJheSB9KTtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgemVybyBtYXRyaXguICovXG4gIHN0YXRpYyB6ZXJvKCk6IE1hdHJpeDQ0RCB7XG4gICAgcmV0dXJuIHN1cGVyLl96ZXJvKEZsb2F0NjRBcnJheSkgYXMgTWF0cml4NDREO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYW4gaWRlbnRpdHkgbWF0cml4LiAqL1xuICBzdGF0aWMgaWRlbnRpdHkoKTogTWF0cml4NDREIHtcbiAgICByZXR1cm4gc3VwZXIuX2lkZW50aXR5KEZsb2F0NjRBcnJheSkgYXMgTWF0cml4NDREO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBkdW1teSBtYXRyaXggd2l0aCBhbiBlbXB0eSBhcnJheS4gKi9cbiAgc3RhdGljIGR1bW15KCk6IE1hdHJpeDQ0RCB7XG4gICAgcmV0dXJuIHN1cGVyLl9kdW1teShGbG9hdDY0QXJyYXkpIGFzIE1hdHJpeDQ0RDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIHRoZSB0cmFuc3Bvc2Ugb2YgdGhlIGdpdmVuIG1hdHJpeC4gKi9cbiAgc3RhdGljIHRyYW5zcG9zZShtYXQ6IElNYXRyaXg0NCk6IE1hdHJpeDQ0RCB7XG4gICAgcmV0dXJuIHN1cGVyLl90cmFuc3Bvc2UobWF0LCBGbG9hdDY0QXJyYXkpIGFzIE1hdHJpeDQ0RDtcbiAgfVxuXG4gIC8qKiBBdHRlbXB0cyB0byBpbnZlcnQgdGhlIGdpdmVuIG1hdHJpeCwgcmV0dXJuaW5nIG51bGwgd2hlbiBpdCBpcyBzaW5ndWxhci4gKi9cbiAgc3RhdGljIHRyeUludmVydChtYXQ6IElNYXRyaXg0NCk6IE1hdHJpeDQ0RCB8IG51bGwge1xuICAgIHJldHVybiBzdXBlci5fdHJ5SW52ZXJ0KG1hdCwgRmxvYXQ2NEFycmF5KSBhcyBNYXRyaXg0NEQgfCBudWxsO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgdGhlIGludmVyc2Ugb2YgdGhlIGdpdmVuIG1hdHJpeCAoaWRlbnRpdHkgd2hlbiBzaW5ndWxhcikuICovXG4gIHN0YXRpYyBpbnZlcnQobWF0OiBJTWF0cml4NDQpOiBNYXRyaXg0NEQge1xuICAgIHJldHVybiBzdXBlci5faW52ZXJ0KG1hdCwgRmxvYXQ2NEFycmF5KSBhcyBNYXRyaXg0NEQ7XG4gIH1cblxuICAvKiogQXR0ZW1wdHMgdG8gaW52ZXJ0IHRoZSBnaXZlbiBtYXRyaXggaW50byBvdXRNYXQuICovXG4gIHN0YXRpYyB0cnlJbnZlcnRUbzxUIGV4dGVuZHMgSU11dGFibGVNYXRyaXg0ND4obWF0OiBJTWF0cml4NDQsIG91dE1hdDogVCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBzdXBlci5fdHJ5SW52ZXJ0VG8obWF0LCBvdXRNYXQpO1xuICB9XG5cbiAgLyoqIEludmVydHMgdGhlIGdpdmVuIG1hdHJpeCBpbnRvIG91dE1hdCAoaWRlbnRpdHkgd2hlbiBzaW5ndWxhcikuICovXG4gIHN0YXRpYyBpbnZlcnRUbzxUIGV4dGVuZHMgSU11dGFibGVNYXRyaXg0ND4obWF0OiBJTWF0cml4NDQsIG91dE1hdDogVCk6IFQge1xuICAgIHJldHVybiBzdXBlci5faW52ZXJ0VG8obWF0LCBvdXRNYXQpIGFzIFQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIHRyYW5zbGF0aW9uIG1hdHJpeC4gKi9cbiAgc3RhdGljIHRyYW5zbGF0ZSh2ZWM6IElWZWN0b3IzKTogTWF0cml4NDREIHtcbiAgICByZXR1cm4gc3VwZXIuX3RyYW5zbGF0ZSh2ZWMsIEZsb2F0NjRBcnJheSkgYXMgTWF0cml4NDREO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSByb3RhdGlvbiBtYXRyaXggYXJvdW5kIHRoZSBYLWF4aXMuICovXG4gIHN0YXRpYyByb3RhdGVYKHJhZGlhbjogbnVtYmVyKTogTWF0cml4NDREIHtcbiAgICByZXR1cm4gc3VwZXIuX3JvdGF0ZVgocmFkaWFuLCBGbG9hdDY0QXJyYXkpIGFzIE1hdHJpeDQ0RDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgcm90YXRpb24gbWF0cml4IGFyb3VuZCB0aGUgWS1heGlzLiAqL1xuICBzdGF0aWMgcm90YXRlWShyYWRpYW46IG51bWJlcik6IE1hdHJpeDQ0RCB7XG4gICAgcmV0dXJuIHN1cGVyLl9yb3RhdGVZKHJhZGlhbiwgRmxvYXQ2NEFycmF5KSBhcyBNYXRyaXg0NEQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIHJvdGF0aW9uIG1hdHJpeCBhcm91bmQgdGhlIFotYXhpcy4gKi9cbiAgc3RhdGljIHJvdGF0ZVoocmFkaWFuOiBudW1iZXIpOiBNYXRyaXg0NEQge1xuICAgIHJldHVybiBzdXBlci5fcm90YXRlWihyYWRpYW4sIEZsb2F0NjRBcnJheSkgYXMgTWF0cml4NDREO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSByb3RhdGlvbiBtYXRyaXggZnJvbSBFdWxlciBhbmdsZXMgaW4gWFlaIG9yZGVyLiAqL1xuICBzdGF0aWMgcm90YXRlWFlaKHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIpOiBNYXRyaXg0NEQge1xuICAgIHJldHVybiBzdXBlci5fcm90YXRlWFlaKHgsIHksIHosIEZsb2F0NjRBcnJheSkgYXMgTWF0cml4NDREO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSByb3RhdGlvbiBtYXRyaXggZnJvbSBhIHZlY3RvciBjb250YWluaW5nIEV1bGVyIGFuZ2xlcy4gKi9cbiAgc3RhdGljIHJvdGF0ZSh2ZWM6IElWZWN0b3IzKTogTWF0cml4NDREIHtcbiAgICByZXR1cm4gc3VwZXIuX3JvdGF0ZSh2ZWMsIEZsb2F0NjRBcnJheSkgYXMgTWF0cml4NDREO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBzY2FsaW5nIG1hdHJpeC4gKi9cbiAgc3RhdGljIHNjYWxlKHZlYzogSVZlY3RvcjMpOiBNYXRyaXg0NEQge1xuICAgIHJldHVybiBzdXBlci5fc2NhbGUodmVjLCBGbG9hdDY0QXJyYXkpIGFzIE1hdHJpeDQ0RDtcbiAgfVxuXG4gIC8qKiBNdWx0aXBsaWVzIHR3byBtYXRyaWNlcy4gKi9cbiAgc3RhdGljIG11bHRpcGx5KGxfbWF0OiBJTWF0cml4NDQsIHJfbWF0OiBJTWF0cml4NDQpOiBNYXRyaXg0NEQge1xuICAgIHJldHVybiBzdXBlci5fbXVsdGlwbHkobF9tYXQsIHJfbWF0LCBGbG9hdDY0QXJyYXkpIGFzIE1hdHJpeDQ0RDtcbiAgfVxuXG4gIC8qKiBNdWx0aXBsaWVzIHR3byBtYXRyaWNlcyBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gb3V0TWF0LiAqL1xuICBzdGF0aWMgbXVsdGlwbHlUbzxUIGV4dGVuZHMgSU11dGFibGVNYXRyaXg0ND4obF9tYXQ6IElNYXRyaXg0NCwgcl9tYXQ6IElNYXRyaXg0NCwgb3V0TWF0OiBUKTogVCB7XG4gICAgcmV0dXJuIHN1cGVyLl9tdWx0aXBseVRvKGxfbWF0LCByX21hdCwgb3V0TWF0KSBhcyBUO1xuICB9XG5cbiAgLyoqIE11bHRpcGxpZXMgYSBtYXRyaXggd2l0aCB0eXBlZCBhcnJheSBkYXRhIGFuZCBzdG9yZXMgdGhlIHJlc3VsdCBpbiBvdXRNYXQuICovXG4gIHN0YXRpYyBtdWx0aXBseVR5cGVkQXJyYXlUbzxUIGV4dGVuZHMgSU11dGFibGVNYXRyaXg0ND4oXG4gICAgbF9tYXQ6IElNYXRyaXg0NCxcbiAgICByX2FycmF5OiBBcnJheVR5cGUsXG4gICAgb3V0TWF0OiBULFxuICAgIG9mZnNldEFzQ29tcG9zaXRpb246IG51bWJlclxuICApOiBUIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5VHlwZWRBcnJheVRvKGxfbWF0LCByX2FycmF5LCBvdXRNYXQsIG9mZnNldEFzQ29tcG9zaXRpb24pIGFzIFQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIHJvdGF0aW9uIG1hdHJpeCBmcm9tIGEgcXVhdGVybmlvbiBhbmQgc3RvcmVzIGl0IGluIG91dE1hdC4gKi9cbiAgc3RhdGljIGZyb21RdWF0ZXJuaW9uVG88VCBleHRlbmRzIElNdXRhYmxlTWF0cml4NDQ+KHF1YXQ6IElRdWF0ZXJuaW9uLCBvdXRNYXQ6IFQpOiBUIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21RdWF0ZXJuaW9uVG8ocXVhdCwgb3V0TWF0KSBhcyBUO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSByb3ctbWFqb3IgY29tcG9uZW50cy4gKi9cbiAgLy8gcHJldHRpZXItaWdub3JlXG4gIHN0YXRpYyBmcm9tQ29weTE2Um93TWFqb3IoXG4gICAgbTAwOiBudW1iZXIsXG4gICAgbTAxOiBudW1iZXIsXG4gICAgbTAyOiBudW1iZXIsXG4gICAgbTAzOiBudW1iZXIsXG4gICAgbTEwOiBudW1iZXIsXG4gICAgbTExOiBudW1iZXIsXG4gICAgbTEyOiBudW1iZXIsXG4gICAgbTEzOiBudW1iZXIsXG4gICAgbTIwOiBudW1iZXIsXG4gICAgbTIxOiBudW1iZXIsXG4gICAgbTIyOiBudW1iZXIsXG4gICAgbTIzOiBudW1iZXIsXG4gICAgbTMwOiBudW1iZXIsXG4gICAgbTMxOiBudW1iZXIsXG4gICAgbTMyOiBudW1iZXIsXG4gICAgbTMzOiBudW1iZXJcbiAgKTogTWF0cml4NDREIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5MTZSb3dNYWpvcihcbiAgICAgIG0wMCxcbiAgICAgIG0wMSxcbiAgICAgIG0wMixcbiAgICAgIG0wMyxcbiAgICAgIG0xMCxcbiAgICAgIG0xMSxcbiAgICAgIG0xMixcbiAgICAgIG0xMyxcbiAgICAgIG0yMCxcbiAgICAgIG0yMSxcbiAgICAgIG0yMixcbiAgICAgIG0yMyxcbiAgICAgIG0zMCxcbiAgICAgIG0zMSxcbiAgICAgIG0zMixcbiAgICAgIG0zMyxcbiAgICAgIEZsb2F0NjRBcnJheVxuICAgICkgYXMgTWF0cml4NDREO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBjb2x1bW4tbWFqb3IgY29tcG9uZW50cy4gKi9cbiAgLy8gcHJldHRpZXItaWdub3JlXG4gIHN0YXRpYyBmcm9tQ29weTE2Q29sdW1uTWFqb3IoXG4gICAgbTAwOiBudW1iZXIsXG4gICAgbTEwOiBudW1iZXIsXG4gICAgbTIwOiBudW1iZXIsXG4gICAgbTMwOiBudW1iZXIsXG4gICAgbTAxOiBudW1iZXIsXG4gICAgbTExOiBudW1iZXIsXG4gICAgbTIxOiBudW1iZXIsXG4gICAgbTMxOiBudW1iZXIsXG4gICAgbTAyOiBudW1iZXIsXG4gICAgbTEyOiBudW1iZXIsXG4gICAgbTIyOiBudW1iZXIsXG4gICAgbTMyOiBudW1iZXIsXG4gICAgbTAzOiBudW1iZXIsXG4gICAgbTEzOiBudW1iZXIsXG4gICAgbTIzOiBudW1iZXIsXG4gICAgbTMzOiBudW1iZXJcbiAgKTogTWF0cml4NDREIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5MTZDb2x1bW5NYWpvcihcbiAgICAgIG0wMCxcbiAgICAgIG0xMCxcbiAgICAgIG0yMCxcbiAgICAgIG0zMCxcbiAgICAgIG0wMSxcbiAgICAgIG0xMSxcbiAgICAgIG0yMSxcbiAgICAgIG0zMSxcbiAgICAgIG0wMixcbiAgICAgIG0xMixcbiAgICAgIG0yMixcbiAgICAgIG0zMixcbiAgICAgIG0wMyxcbiAgICAgIG0xMyxcbiAgICAgIG0yMyxcbiAgICAgIG0zMyxcbiAgICAgIEZsb2F0NjRBcnJheVxuICAgICkgYXMgTWF0cml4NDREO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggYnkgY29weWluZyBhbm90aGVyIG1hdHJpeC4gKi9cbiAgc3RhdGljIGZyb21Db3B5TWF0cml4NDQobWF0OiBJTWF0cml4NDQpOiBNYXRyaXg0NEQge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlNYXRyaXg0NChtYXQsIEZsb2F0NjRBcnJheSkgYXMgTWF0cml4NDREO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggdGhhdCBkaXJlY3RseSB1c2VzIHRoZSBnaXZlbiBGbG9hdDY0QXJyYXkuICovXG4gIHN0YXRpYyBmcm9tRmxvYXQ2NEFycmF5Q29sdW1uTWFqb3IoYXJyYXk6IEZsb2F0NjRBcnJheSk6IE1hdHJpeDQ0RCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tVHlwZWRBcnJheUNvbHVtbk1ham9yKGFycmF5LCBGbG9hdDY0QXJyYXkpIGFzIE1hdHJpeDQ0RDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGJ5IGNvcHlpbmcgYSBGbG9hdDY0QXJyYXkgaW4gY29sdW1uLW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlGbG9hdDY0QXJyYXlDb2x1bW5NYWpvcihhcnJheTogRmxvYXQ2NEFycmF5KTogTWF0cml4NDREIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5VHlwZWRBcnJheUNvbHVtbk1ham9yKGFycmF5LCBGbG9hdDY0QXJyYXkpIGFzIE1hdHJpeDQ0RDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGJ5IGNvcHlpbmcgYSBGbG9hdDY0QXJyYXkgaW4gcm93LW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlGbG9hdDY0QXJyYXlSb3dNYWpvcihhcnJheTogRmxvYXQ2NEFycmF5KTogTWF0cml4NDREIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5VHlwZWRBcnJheVJvd01ham9yKGFycmF5LCBGbG9hdDY0QXJyYXkpIGFzIE1hdHJpeDQ0RDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSAzeDMgbWF0cml4IGVtYmVkZGVkIGluIHRoZSB1cHBlci1sZWZ0IGNvcm5lci4gKi9cbiAgc3RhdGljIGZyb21Db3B5TWF0cml4MzMobWF0OiBJTWF0cml4MzMpOiBNYXRyaXg0NEQge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlNYXRyaXgzMyhtYXQsIEZsb2F0NjRBcnJheSkgYXMgTWF0cml4NDREO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIDE2LWVsZW1lbnQgYXJyYXkgaW4gY29sdW1uLW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheTE2Q29sdW1uTWFqb3IoYXJyYXk6IEFycmF5MTY8bnVtYmVyPik6IE1hdHJpeDQ0RCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weUFycmF5MTZDb2x1bW5NYWpvcihhcnJheSwgRmxvYXQ2NEFycmF5KSBhcyBNYXRyaXg0NEQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGFuIGFycmF5IGluIGNvbHVtbi1tYWpvciBvcmRlci4gKi9cbiAgc3RhdGljIGZyb21Db3B5QXJyYXlDb2x1bW5NYWpvcihhcnJheTogQXJyYXk8bnVtYmVyPik6IE1hdHJpeDQ0RCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weUFycmF5Q29sdW1uTWFqb3IoYXJyYXksIEZsb2F0NjRBcnJheSkgYXMgTWF0cml4NDREO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIDE2LWVsZW1lbnQgYXJyYXkgaW4gcm93LW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheTE2Um93TWFqb3IoYXJyYXk6IEFycmF5MTY8bnVtYmVyPik6IE1hdHJpeDQ0RCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weUFycmF5MTZSb3dNYWpvcihhcnJheSwgRmxvYXQ2NEFycmF5KSBhcyBNYXRyaXg0NEQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGFuIGFycmF5IGluIHJvdy1tYWpvciBvcmRlci4gKi9cbiAgc3RhdGljIGZyb21Db3B5QXJyYXlSb3dNYWpvcihhcnJheTogQXJyYXk8bnVtYmVyPik6IE1hdHJpeDQ0RCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weUFycmF5Um93TWFqb3IoYXJyYXksIEZsb2F0NjRBcnJheSkgYXMgTWF0cml4NDREO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSByb3RhdGlvbiBtYXRyaXggZnJvbSBhIHF1YXRlcm5pb24uICovXG4gIHN0YXRpYyBmcm9tQ29weVF1YXRlcm5pb24ocTogSVF1YXRlcm5pb24pOiBNYXRyaXg0NEQge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlRdWF0ZXJuaW9uKHEsIEZsb2F0NjRBcnJheSkgYXMgTWF0cml4NDREO1xuICB9XG59XG5cbi8qKlxuICogQWxpYXMgZm9yIHRoZSAzMi1iaXQgKEZsb2F0MzJBcnJheSkgaW1wbGVtZW50YXRpb24sIG1ha2luZyB0aGUgcHJlY2lzaW9uIGV4cGxpY2l0LlxuICovXG5leHBvcnQgeyBNYXRyaXg0NCBhcyBNYXRyaXg0NEYgfTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxTQUFTLHVCQUFpRDtBQUMxRCxTQUFTLGNBQWM7QUFDdkIsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyx3QkFBd0I7QUFJakMsU0FBUyxnQkFBZ0I7QUFHekIsU0FBUyxzREFBc0Q7QUFDL0QsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsZUFBZTtBQWNqQixJQUFNLFlBQU4sY0FBOEQsZUFBNkM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNaEgsWUFBWSxHQUFlLFVBQXVCO0FBQ2hELFVBQU07QUFDTixTQUFLLEtBQUs7QUFBQSxFQUNaO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQVcsTUFBYztBQUN2QixXQUFPLEtBQUssR0FBRyxDQUFDO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBVyxNQUFjO0FBQ3ZCLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFXLE1BQWM7QUFDdkIsV0FBTyxLQUFLLEdBQUcsQ0FBQztBQUFBLEVBQ2xCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQVcsTUFBYztBQUN2QixXQUFPLEtBQUssR0FBRyxDQUFDO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBVyxNQUFjO0FBQ3ZCLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFXLE1BQWM7QUFDdkIsV0FBTyxLQUFLLEdBQUcsQ0FBQztBQUFBLEVBQ2xCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQVcsTUFBYztBQUN2QixXQUFPLEtBQUssR0FB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V0FBTyxRQUFRLEtBQUssTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEtBQUssS0FBSyxNQUFNLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUssTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEtBQUssS0FBSyxNQUFNLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUssTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFBQSxFQUNsYztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLGlCQUF5QjtBQUMzQixXQUFPLFdBQVcsU0FBUywyQkFBMkIsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUywyQkFBMkIsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUywyQkFBMkIsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUywyQkFBMkIsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUywyQkFBMkIsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUywyQkFBMkIsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUywyQkFBMkIsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUywyQkFBMkIsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUywyQkFBMkIsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUywyQkFBMkIsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUywyQkFBMkIsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEtBQUssU0FBUywyQkFBMkIsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEtBQUssU0FBUywyQkFBMkIsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEtBQUssU0FBUywyQkFBMkIsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEtBQUssU0FBUywyQkFBMkIsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEtBQUssU0FBUywyQkFBMkIsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQUEsRUFDcjFCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUksZUFBdUI7QUFDekIsV0FBTyxXQUFXLEtBQUssTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMs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RSxJQUFJLElBQUksR0FBRyxDQUFDO0FBQzFELFVBQU0sTUFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxJQUFJLEdBQUcsQ0FBQztBQUMxRCxVQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLENBQUM7QUFDMUQsVUFBTSxNQUFNLElBQUksR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxJQUFJLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxFQUFFO0FBRTVELFVBQU0sTUFBTSxNQUFNLE1BQU0sTUFBTSxNQUFNLE1BQU0sTUFBTSxNQUFNLE1BQU0sTUFBTSxNQUFNLE1BQU07QUFFOUUsVUFBTSxXQUFXLEtBQUssSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksS0FBSyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxLQUFLLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUssSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDO0FBQ3JHLFVBQU0sV0FBVyxLQUFLLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUssSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksS0FBSyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxLQUFLLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztBQUNyRyxVQUFNLFdBQVcsS0FBSyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxLQUFLLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUssSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDLElBQUksS0FBSyxJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7QUFDdkcsVUFBTSxXQUFXLEtBQUssSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDLElBQUksS0FBSyxJQUFJLElBQUksR0FBRyxFQUFFLENBQUMsSUFBSSxLQUFLLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyxJQUFJLEtBQUssSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQ3pHLFFBQ0UsU0FBUztBQUFBLE1BQ1A7QUFBQSxNQUNBLFdBQVcsV0FBVyxXQUFXO0FBQUEsTUFDakMsU0FBUyxtQkFBbUIsSUFBSSxHQUFHLGlCQUFpQjtBQUFBLElBQ3RELEdBQ0E7QUFDQSxhQUFPO0FBQUEsSUFDVDtBQUVBLFVBQU0sU0FBUyxJQUFJO0FBRW5CLFVBQU0sT0FBTyxJQUFJLEdBQUcsQ0FBQyxJQUFJLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxNQUFNLElBQUksR0FBRyxFQUFFLElBQUksT0FBTztBQUNyRSxVQUFNLE9BQU8sSUFBSSxHQUFHLENBQUMsSUFBSSxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksTUFBTSxJQUFJLEdBQUcsRUFBRSxJQUFJLE9BQU87QUFDckUsVUFBTSxPQUFPLElBQUksR0FBRyxDQUFDLElBQUksTUFBTSxJQUFJLEdBQUcsRUFBRSxJQUFJLE1BQU0sSUFBSSxHQUFHLEVBQUUsSUFBSSxPQUFPO0FBQ3RFLFVBQU0sT0FBTyxJQUFJLEdBQUcsRUFBRSxJQUFJLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxNQUFNLElBQUksR0FBRyxFQUFFLElBQUksT0FBTztBQUN0RSxVQUFNLE9BQU8sSUFBSSxHQUFHLENBQUMsSUFBSSxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksTUFBTSxJQUFJLEdBQUcsRUFBRSxJQUFJLE9BQU87QUFDckUsVUFBTSxPQUFPLElBQUksR0FBRyxDQUFDLElBQUksTUFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFJLE1BQU0sSUFBSSxHQUFHLEVBQUUsSUFBSSxPQUFPO0FBQ3JFLFVBQU0sT0FBTyxJQUFJLEdBQUcsRUFBRSxJQUFJLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxNQUFNLElBQUksR0FBRyxFQUFFLElBQUksT0FBTztBQUN0RSxVQUFNLE9BQU8sSUFBSSxHQUFHLENBQUMsSUFBSSxNQUFNLElBQUksR0FBRyxFQUFFLElBQUksTUFBTSxJQUFJLEdBQUcsRUFBRSxJQUFJLE9BQU87QUFDdEUsVUFBTSxPQUFPLElBQUksR0FBRyxDQUFDLElBQUksTUFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFJLE1BQU0sSUFBSSxHQUFHLEVBQUUsSUFBSSxPQUFPO0FBQ3JFLFVBQU0sT0FBTyxJQUFJLEdBQUcsQ0FBQyxJQUFJLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxNQUFNLElBQUksR0FBRyxFQUFFLElBQUksT0FBTztBQUNyRSxVQUFNLE9BQU8sSUFBSSxHQUFHLENBQUMsSUFBSSxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksTUFBTSxJQUFJLEdBQUcsRUFBRSxJQUFJLE9BQU87QUFDckUsVUFBTSxPQUFPLElBQUksR0FBRyxDQUFDLElBQUksTUFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFJLE1BQU0sSUFBSSxHQUFHLEVBQUUsSUFBSSxPQUFPO0FBQ3JFLFVBQU0sT0FBTyxJQUFJLEdBQUcsQ0FBQyxJQUFJLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksT0FBTztBQUNwRSxVQUFNLE9BQU8sSUFBSSxHQUFHLENBQUMsSUFBSSxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksTUFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFJLE9BQU87QUFDcEUsVUFBTSxPQUFPLElBQUksR0FBRyxDQUFDLElBQUksTUFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFJLE1BQU0sSUFBSSxHQUFHLEVBQUUsSUFBSSxPQUFPO0FBQ3JFLFVBQU0sT0FBTyxJQUFJLEdBQUcsQ0FBQyxJQUFJLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxNQUFNLElBQUksR0FBRyxFQUFFLElBQUksT0FBTztBQUVyRSxXQUFPLEtBQUs7QUFBQSxNQUNWO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFjQSxPQUFPLFFBQVEsS0FBZ0IsTUFBNkM7QUFDMUUsVUFBTSxXQUFXLEtBQUssV0FBVyxLQUFLLElBQUk7QUFDMUMsUUFBSSxhQUFhLE1BQU07QUFDckIsYUFBTztBQUFBLElBQ1Q7QUFFQSxXQUFPLFFBQVEsTUFBTSxzRkFBc0Y7QUFDM0csV0FBTyxLQUFLLG9CQUFvQixHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUk7QUFBQSxFQUN0RjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBV0EsT0FBTyxhQUFhLEtBQWdCLFFBQW1DO0FBQ3JFLFFBQUksSUFBSSx1QkFBdUI7QUFDN0IsYUFBTyxlQUFlLEdBQUc7QUFDekIsYUFBTztBQUFBLElBQ1Q7QUFFQSxVQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUM7QUFDeEQsVUFBTSxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDO0FBQ3hELFVBQU0sTUFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxJQUFJLEdBQUcsQ0FBQztBQUMxRCxVQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUM7QUFDeEQsVUFBTSxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxJQUFJLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxDQUFDO0FBQzFELFVBQU0sTUFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxJQUFJLEdBQUcsQ0FBQztBQUMxRCxVQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUM7QUFDeEQsVUFBTSxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxJQUFJLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxDQUFDO0FBQzFELFVBQU0sTUFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxJQUFJLEdBQUcsQ0FBQztBQUMxRCxVQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLENBQUM7QUFDMUQsVUFBTSxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxJQUFJLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxDQUFDO0FBQzFELFVBQU0sTUFBTSxJQUFJLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxJQUFJLEdBQUcsRUFBRTtBQUU1RCxVQUFNLE1BQU0sTUFBTSxNQUFNLE1BQU0sTUFBTSxNQUFNLE1BQU0sTUFBTSxNQUFNLE1BQU0sTUFBTSxNQUFNO0FBRTlFLFVBQU0sV0FBVyxLQUFLLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUssSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksS0FBSyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxLQUFLLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztBQUNyRyxVQUFNLFdBQVcsS0FBSyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxLQUFLLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUssSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksS0FBSyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUM7QUFDckcsVUFBTSxXQUFXLEtBQUssSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksS0FBSyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxLQUFLLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyxJQUFJLEtBQUssSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQ3ZHLFVBQU0sV0FBVyxLQUFLLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyxJQUFJLEtBQUssSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDLElBQUksS0FBSyxJQUFJLElBQUksR0FBRyxFQUFFLENBQUMsSUFBSSxLQUFLLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUN6RyxRQUNFLFNBQVM7QUFBQSxNQUNQO0FBQUEsTUFDQSxXQUFXLFdBQVcsV0FBVztBQUFBLE1BQ2pDLFNBQVMsbUJBQW1CLElBQUksR0FBRyxpQkFBaUI7QUFBQSxJQUN0RCxHQUNBO0FBQ0EsYUFBTztBQUFBLElBQ1Q7QUFFQSxVQUFNLFNBQVMsSUFBSTtBQUVuQixVQUFNLE9BQU8sSUFBSSxHQUFHLENBQUMsSUFBSSxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksTUFBTSxJQUFJLEdBQUcsRUFBRSxJQUFJLE9BQU87QUFDckUsVUFBTSxPQUFPLElBQUksR0FBRyxDQUFDLElBQUksTUFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFJLE1BQU0sSUFBSSxHQUFHLEVBQUUsSUFBSSxPQUFPO0FBQ3JFLFVBQU0sT0FBTyxJQUFJLEdBQUcsQ0FBQyxJQUFJLE1BQU0sSUFBSSxHQUFHLEVBQUUsSUFBSSxNQUFNLElBQUksR0FBRyxFQUFFLElBQUksT0FBTztBQUN0RSxVQUFNLE9BQU8sSUFBSSxHQUFHLEVBQUUsSUFBSSxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksTUFBTSxJQUFJLEdBQUcsRUFBRSxJQUFJLE9BQU87QUFDdEUsVUFBTSxPQUFPLElBQUksR0FBRyxDQUFDLElBQUksTUFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFJLE1BQU0sSUFBSSxHQUFHLEVBQUUsSUFBSSxPQUFPO0FBQ3JFLFVBQU0sT0FBTyxJQUFJLEdBQUcsQ0FBQyxJQUFJLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxNQUFNLElBQUksR0FBRyxFQUFFLElBQUksT0FBTztBQUNyRSxVQUFNLE9BQU8sSUFBSSxHQUFHLEVBQUUsSUFBSSxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksTUFBTSxJQUFJLEdBQUcsRUFBRSxJQUFJLE9BQU87QUFDdEUsVUFBTSxPQUFPLElBQUksR0FBRyxDQUFDLElBQUksTUFBTSxJQUFJLEdBQUcsRUFBRSxJQUFJLE1BQU0sSUFBSSxHQUFHLEVBQUUsSUFBSSxPQUFPO0FBQ3RFLFVBQU0sT0FBTyxJQUFJLEdBQUcsQ0FBQyxJQUFJLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxNQUFNLElBQUksR0FBRyxFQUFFLElBQUksT0FBTztBQUNyRSxVQUFNLE9BQU8sSUFBSSxHQUFHLENBQUMsSUFBSSxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksTUFBTSxJQUFJLEdBQUcsRUFBRSxJQUFJLE9BQU87QUFDckUsVUFBTSxPQUFPLElBQUksR0FBRyxDQUFDLElBQUksTUFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFJLE1BQU0sSUFBSSxHQUFHLEVBQUUsSUFBSSxPQUFPO0FBQ3JFLFVBQU0sT0FBTyxJQUFJLEdBQUcsQ0FBQyxJQUFJLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxNQUFNLElBQUksR0FBRyxFQUFFLElBQUksT0FBTztBQUNyRSxVQUFNLE9BQU8sSUFBSSxHQUFHLENBQUMsSUFBSSxNQUFNLElBQUksR0FBRyxDQUFDLElB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LE1BQU0sR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxFQUFFLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxFQUFFLElBQUksR0FBRyxDQUFDO0FBQzFFLFVBQU0sTUFBTSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLENBQUM7QUFFMUUsVUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsQ0FBQztBQUN6RSxVQUFNLE1BQU0sR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxFQUFFLElBQUksR0FBRyxDQUFDO0FBQ3pFLFVBQU0sTUFBTSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLENBQUM7QUFDMUUsVUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsQ0FBQztBQUUxRSxVQUFNLE1BQU0sR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxFQUFFLElBQUksR0FBRyxFQUFFLElBQUksR0FBRyxFQUFFO0FBQzNFLFVBQU0sTUFBTSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLEVBQUU7QUFDM0UsVUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsRUFBRTtBQUM1RSxVQUFNLE1BQU0sR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxFQUFFLElBQUksR0FBRyxFQUFFLElBQUksR0FBRyxFQUFFLElBQUksR0FBRyxFQUFFO0FBRTVFLFVBQU0sTUFBTSxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLEVBQUU7QUFDN0UsVUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsRUFBRTtBQUM3RSxVQUFNLE1BQU0sR0FBRyxDQUFDLElBQUksR0FBRyxFQUFFLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxFQUFFLElBQUksR0FBRyxFQUFFLElBQUksR0FBRyxFQUFFLElBQUksR0FBRyxFQUFFLElBQUksR0FBRyxFQUFFO0FBQzlFLFVBQU0sTUFBTSxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLEVBQUU7QUFFOUUsV0FBTyxLQUFLO0FBQUEsTUFDVjtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVBLE9BQU8sWUFBWSxPQUFrQixPQUFrQixRQUE0QztBQUNqRyxRQUFJLE1BQU0sdUJBQXVCO0FBQy9CLGFBQU8sT0FBTyxlQUFlLEtBQUs7QUFBQSxJQUNwQztBQUNBLFFBQUksTUFBTSx1QkFBdUI7QUFDL0IsYUFBTyxPQUFPLGVBQWUsS0FBSztBQUFBLElBQ3BDO0FBRUEsVUFBTSxLQUFLLE1BQU07QUFDakIsVUFBTSxLQUFLLE1BQU07QUFDakIsVUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsQ0FBQztBQUN6RSxVQUFNLE1BQU0sR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxFQUFFLElBQUksR0FBRyxDQUFDO0FBQ3pFLFVBQU0sTUFBTSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLENBQUM7QUFDMUUsVUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsQ0FBQztBQUUxRSxVQUFNLE1BQU0sR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxFQUFFLElBQUksR0FBRyxDQUFDO0FBQ3pFLFVBQU0sTUFBTSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLENBQUM7QUFDekUsVUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsQ0FBQztBQUMxRSxVQUFNLE1BQU0sR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxFQUFFLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxFQUFFLElBQUksR0FBRyxDQUFDO0FBRTFFLFVBQU0sTUFBTSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLEVBQUU7QUFDM0UsVUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsRUFBRTtBQUMzRSxVQUFNLE1BQU0sR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxFQUFFLElBQUksR0FBRyxFQUFFLElBQUksR0FBRyxFQUFFLElBQUksR0FBRyxFQUFFO0FBQzVFLFVBQU0sTUFBTSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLEVBQUU7QUFFNUUsVUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsRUFBRTtBQUM3RSxVQUFNLE1BQU0sR0FBRyxDQUFDLElBQUksR0FBRyxFQUFFLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxFQUFFLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxFQUFFLElBQUksR0FBRyxFQUFFLElBQUksR0FBRyxFQUFFO0FBQzdFLFVBQU0sTUFBTSxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLEVBQUU7QUFDOUUsVUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsRUFBRTtBQUU5RSxXQUFPLE9BQU8sY0FBYyxLQUFLLEtBQUssS0FBSyxLQUFLLEtBQUssS0FBSyxLQUFLLEtBQUssS0FBSyxLQUFLLEtBQUssS0FBSyxLQUFLLEtBQUssS0FBSyxHQUFHO0FBQUEsRUFDNUc7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFB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LFVBQVUsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQUEsRUFBTSxTQUFTLFVBQVUsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksU0FBUyxVQUFVLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLFNBQVMsVUFBVSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxTQUFTLFVBQVUsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQUEsRUFBTSxTQUFTLFVBQVUsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksU0FBUyxVQUFVLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLFNBQVMsVUFBVSxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUMsSUFBSSxTQUFTLFVBQVUsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQUEsRUFBTSxTQUFTLFVBQVUsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksU0FBUyxVQUFVLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLFNBQVMsVUFBVSxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUMsSUFBSSxTQUFTLFVBQVUsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQUE7QUFBQSxFQUNwakI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxpQkFBMkI7QUFDekIsV0FBTztBQUFBLE1BQ0wsS0FBSyxHQUFHLENBQUM7QUFBQSxNQUNULEtBQUssR0FBRyxDQUFDO0FBQUEsTUFDVCxLQUFLLEdBQUcsQ0FBQztBQUFBLE1BQ1QsS0FBSyxHQUFHLENBQUM7QUFBQSxNQUNULEtBQUssR0FBRyxDQUFDO0FBQUEsTUFDVCxLQUFLLEdBQUcsQ0FBQztBQUFBLE1BQ1QsS0FBSyxHQUFHLENBQUM7QUFBQSxNQUNULEtBQUssR0FBRyxDQUFDO0FBQUEsTUFDVCxLQUFLLEdBQUcsQ0FBQztBQUFBLE1BQ1QsS0FBSyxHQUFHLENBQUM7QUFBQSxNQUNULEtBQUssR0FBRyxFQUFFO0FBQUEsTUFDVixLQUFLLEdBQUcsRUFBRTtBQUFB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R0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUUsSUFDakQsS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksS0FBSyxHQUFHLENBQUMsSUFDakQsS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFDakQsS0FBSyxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksS0FBSyxHQUFHLENBQUMsSUFDbEQsS0FBSyxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUUsSUFDbEQsS0FBSyxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFDakQsS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksS0FBSyxHQUFHLEVBQUUsSUFDbEQsS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUUsSUFDakQsS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksS0FBSyxHQUFHLENBQUMsSUFDbEQsS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksS0FBSyxHQUFHLEVBQUUsSUFDbEQsS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksS0FBSyxHQUFHLENBQUMsSUFDakQsS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUUsSUFDbEQsS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksS0FBSyxHQUFHLENBQUMsSUFDakQsS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUUsSUFDakQsS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFDakQsS0FBSyxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUUsSUFDbEQsS0FBSyxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksS0FBSyxHQUFHLENBQUMsSUFDbEQsS0FBSyxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUM7QUFBQSxFQUVyRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLGVBQWUsS0FBd0I7QUFDckMsVUFBTSxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLENBQUM7QUFDM0csVUFBTSxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLENBQUM7QUFDM0csVUFBTSxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUUsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLENBQUM7QUFDNUcsVUFBTSxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUUsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLENBQUM7QUFFNUcsV0FBTyxRQUFRLGNBQWMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7QUFBQSxFQUMzQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsaUJBQWlCLEtBQWUsUUFBd0M7QUFDdEUsVUFBTSxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLENBQUM7QUFDM0csVUFBTSxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLENBQUM7QUFDM0csVUFBTSxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUUsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLENBQUM7QUFDNUcsVUFBTSxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUUsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLENBQUM7QUFDNUcsV0FBTyxHQUFHLENBQUMsSUFBSTtBQUNmLFdBQU8sR0FBRyxDQUFDLElBQUk7QUFDZixXQUFPLEdBQUcsQ0FBQyxJQUFJO0FBQ2YsV0FBTyxHQUFHLENBQUMsSUFBSTtBQUVmLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxxQkFBcUIsS0FBZSxRQUF3QztBQUMxRSxVQUFNLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUUsSUFBSSxJQUFJLEdBQUcsQ0FBQztBQUMzRyxVQUFNLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUUsSUFBSSxJQUFJLEdBQUcsQ0FBQztBQUMzRyxVQUFNLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUUsSUFBSSxJQUFJLEdBQUcsQ0FBQztBQUM1RyxXQUFPLEdBQUcsQ0FBQyxJQUFJO0FBQ2YsV0FBTyxHQUFHLENBQUMsSUFBSTtBQUNmLFdBQU8sR0FBRyxDQUFDLElBQUk7QUFFZixXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLGdCQUFnQixLQUF3QjtBQUN0QyxVQUFNLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUU7QUFDL0YsVUFBTSxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFO0FBQy9GLFVBQU0sSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRTtBQUVoRyxXQUFPLFFBQVEsY0FBYyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7QUFBQSxFQUN4QztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsa0JBQWtCLEtBQWUsUUFBd0M7QUFDdkUsVUFBTSxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFO0FBQy9GLFVBQU0sSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRTtBQUMvRixVQUFNLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUU7QUFDaEcsV0FBTyxHQUFHLENBQUMsSUFBSTtBQUNmLFdBQU8sR0FBRyxDQUFDLElBQUk7QUFDZixXQUFPLEdBQUcsQ0FBQyxJQUFJO0FBRWYsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsZUFBd0I7QUFDdEIsV0FBTyxRQUFRLGNBQWMsQ0FBQyxLQUFLLEdBQUcsRUFBRSxHQUFHLEtBQUssR0FBRyxFQUFFLEdBQUcsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQUEsRUFDdEU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxlQUFlLFFBQXdDO0FBQ3JELFdBQU8sR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUU7QUFDekIsV0FBTyxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRTtBQUN6QixXQUFPLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFO0FBQ3pCLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLFdBQW9CO0FBQ2xCLFdBQU8sUUFBUSxjQUFjO0FBQUEsTUFDM0IsS0FBSyxNQUFNLEtBQUssR0FBRyxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQUEsTUFDN0MsS0FBSyxNQUFNLEtBQUssR0FBRyxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQUEsTUFDN0MsS0FBSyxNQUFNLEtBQUssR0FBRyxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsR0FBRyxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQUEsSUFDaEQsQ0FBQztBQUFBLEVBQ0g7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxXQUFXLFFBQXdDO0FBQ2pELFdBQU8sR0FBRyxDQUFDLElBQUksS0FBSyxNQUFNLEtBQUssR0FBRyxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQzVELFdBQU8sR0FBRyxDQUFDLElBQUksS0FBSyxNQUFNLEtBQUssR0FBRyxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQzVELFdBQU8sR0FBRyxDQUFDLElBQUksS0FBSyxNQUFNLEtBQUssR0FBRyxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsR0FBRyxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQzdELFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLGdCQUF5QjtBQUN2QixRQUFJO0FBQ0osUUFBSSxLQUFLLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxNQUFNLEdBQUs7QUFDaEMsWUFBTSxJQUFJLENBQUMsS0FBSyxLQUFLLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDL0IsWUFBTSxJQUFJLEtBQUssTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLEdBQUcsS0FBSyxHQUFHLEVBQUUsSUFBSSxLQUFLLElBQUksQ0FBQyxDQUFDO0FBQ3hFLFlBQU0sSUFBSSxLQUFLLE1BQU0sS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxHQUFHLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsQ0FBQztBQUN2RSxlQUFTLFFBQVEsY0FBYyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7QUFBQSxJQUMxQyxXQUFXLEtBQUssR0FBRyxDQUFDLE1BQU0sSUFBTTtBQUM5QixlQUFTLFFBQVEsY0FBYyxDQUFDLEtBQUssTUFBTSxLQUFLLEdBQUcsQ0FBQyxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFLLEtBQUssR0FBSyxDQUFHLENBQUM7QUFBQSxJQUN6RixPQUFPO0FBQ0wsZUFBUyxRQUFRLGNBQWMsQ0FBQyxLQUFLLE1BQU0sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxLQUFLLEdBQUssQ0FBRyxDQUFDO0FBQUEsSUFDNUY7QUFFQSxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLGdCQUFnQixTQUF5QjtBQUN2QyxRQUFJLEtBQUssSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLE1BQU0sR0FBSztBQUNoQyxZQUFNLElBQUksQ0FBQyxLQUFLLEtBQUssS0FBSyxHQUFHLENBQUMsQ0FBQztBQUMvQixZQUFNLElBQUksS0FBSyxNQUFNLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsR0FBRyxLQUFLLEdBQUcsRUFBRSxJQUFJLEtBQUssSUFBSSxDQUFDLENBQUM7QUFDeEUsWUFBTSxJQUFJLEtBQUssTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxDQUFDO0FBQ3ZFLGNBQVEsR0FBRyxDQUFDLElBQUk7QUFDaEIsY0FBUSxHQUFHLENBQUMsSUFBSTtBQUNoQixjQUFRLEdBQUcsQ0FBQyxJQUFJO0FBQUEsSUFDbEIsV0FBVyxLQUFLLEdBQUcsQ0FBQyxNQUFNLElBQU07QUFDOUIsY0FBUSxHQUFHLENBQUMsSUFBSSxLQUFLLE1BQU0sS0FBSyxHQUFHLENBQUMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ2pELGNBQVEsR0FBRyxDQUFDLElBQUksS0FBSyxLQUFLO0FBQzFCLGNBQVEsR0FBRyxDQUFDLElBQUk7QUFBQSxJQUNsQixPQUFPO0FBQ0wsY0FBUSxHQUFHLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNuRCxjQUFRLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxLQUFLO0FBQzNCLGNBQVEsR0FBRyxDQUFDLElBQUk7QUFBQSxJQUNsQjtBQUVBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLFFBQVE7QUFDTixXQUFRLEtBQUssWUFBb0I7QUFBQSxNQUMvQixLQUFLLEdBQUcsQ0FBQztBQUFBLE1BQ1QsS0FBSyxHQUFHLENBQUM7QUFBQSxNQUNULEtBQUssR0FBRyxDQUFDO0FBQUEsTUFDVCxLQUFLLEdBQUcsRUFBRTtBQUFBLE1BQ1YsS0FBSyxHQUFHLENBQUM7QUFBQSxNQUNULEtBQUssR0FBRyxDQUFDO0FBQUEsTUFDVCxLQUFLLEdBQUcsQ0FBQztBQUFBLE1BQ1QsS0FBSyxHQUFHLEVBQUU7QUFBQSxNQUNWLEtBQUssR0FBRyxDQUFDO0FBQUEsTUFDVCxLQUFLLEdBQUcsQ0FBQztBQUFBLE1BQ1QsS0FBSyxHQUFHLEVBQUU7QUFBQSxNQUNWLEtBQUssR0FBRyxFQUFFO0FBQUEsTUFDVixLQUFLLEdBQUcsQ0FBQztBQUFBLE1BQ1QsS0FBSyxHQUFHLENBQUM7QUFBQSxNQUNULEtBQUssR0FBRyxFQUFFO0FBQUEsTUFDVixLQUFLLEdBQUcsRUFBRTtBQUFBLElBQ1o7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsWUFBc0I7QUFHcEIsVUFBTSxTQUFTLEtBQUssTUFBTSxLQUFLLEdBQUcsQ0FBQyxHQUFHLEtBQUssR0FBRyxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUM1RCxVQUFNLFNBQVMsS0FBSyxNQUFNLEtBQUssR0FBRyxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQzVELFVBQU0sU0FBUyxLQUFLLE1BQU0sS0FBSyxHQUFHLENBQUMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxHQUFHLEtBQUssR0FBRyxFQUFFLENBQUM7QUFFN0QsVUFBTSxNQUFNLFNBQVM7QUFBQSxNQUNuQixLQUFLLEdBQUcsQ0FBQyxJQUFJO0FBQUEsTUFDYixLQUFLLEdBQUcsQ0FBQztBQUFBLE1BQ1QsS0FBSyxHQUFHLENBQUM7QUFBQSxNQUNUO0FBQUEsTUFDQSxLQUFLLEdBQUcsQ0FBQztBQUFBLE1BQ1QsS0FBSyxHQUFHLENBQUMsSUFBSTtBQUFBLE1BQ2IsS0FBSyxHQUFHLENBQUM7QUFBQSxNQUNUO0FBQUEsTUFDQSxLQUFLLEdBQUcsQ0FBQztBQUFBLE1BQ1QsS0FBSyxHQUFHLENBQUM7QUFBQSxNQUNULEtBQUssR0FBRyxFQUFFLElBQUk7QUFBQSxNQUNkO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBMEJBLE9BQU8sb0JBQ0wsS0FDQSxLQUNBLEtBQ0EsS0FDQSxLQUNBLEtBQ0EsS0FDQSxLQUNBLEtBQ0EsS0FDQSxLQUNBLEtBQ0EsS0FDQSxLQUNBLEtBQ0EsS0FDQSxNQUNXO0FBQ1gsVUFBTSxJQUFJLElBQUksS0FBSyxFQUFFO0FBQ3JCLE1BQUUsQ0FBQyxJQUFJO0FBQ1AsTUFBRSxDQUFDLElBQUk7QUFDUCxNQUFFLENBQUMsSUFBSTtBQUNQLE1BQUUsRUFBRSxJQUFJO0FBQ1IsTUFBRSxDQUFDLElBQUk7QUFDUCxNQUFFLENBQUMsSUFBSTtBQUNQLE1BQUUsQ0FBQyxJQUFJO0FBQ1AsTUFBRSxFQUFFLElBQUk7QUFDUixNQUFFLENBQUMsSUFBSTtBQUNQLE1BQUUsQ0FBQyxJQUFJO0FBQ1AsTUFBRSxFQUFFLElBQUk7QUFDUixNQUFFLEVBQUUsSUFBSTtBQUNSLE1BQUUsQ0FBQyxJQUFJO0FBQ1AsTUFBRSxDQUFDLElBQUk7QUFDUCxNQUFFLEVBQUUsSUFBSTtBQUNSLE1BQUUsRUFBRSxJQUFJO0FBQ1IsV0FBTyxJQUFJLEtBQUssR0FBRyxFQUFFLEtBQUssQ0FBQztBQUFBLEVBQzdCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQXdCQSxPQUFPLHVCQUNMLEtBQ0EsS0FDQSxLQUNBLEtBQ0EsS0FDQSxLQUNBLEtBQ0EsS0FDQSxLQUNBLEtBQ0EsS0FDQSxLQUNBLEtBQ0EsS0FDQSxLQUNBLEtBQ0EsTUFDVztBQUNYLFVBQU0sSUFBSSxJQUFJLEtBQUssRUFBRTtBQUNyQixNQUFFLENBQUMsSUFBSTtBQUNQLE1BQUUsQ0FBQyxJQUFJO0FBQ1AsTUFBRSxDQUFDLElBQUk7QUFDUCxNQUFFLEVBQUUsSUFBSTtBQUNSLE1BQUUsQ0FBQyxJQUFJO0FBQ1AsTUFBRSxDQUFDLElBQUk7QUFDUCxNQUFFLENBQUMsSUFBSTtBQUNQLE1BQUUsRUFBRSxJQUFJO0FBQ1IsTUFBRSxDQUFDLElBQUk7QUFDUCxNQUFFLENBQUMsSUFBSTtBQUNQLE1BQUUsRUFBRSxJQUFJO0FBQ1IsTUFBRSxFQUFFLElBQUk7QUFDUixNQUFFLENBQUMsSUFBSTtBQUNQLE1BQUUsQ0FBQyxJQUFJO0FBQ1AsTUFBRSxFQUFFLElBQUk7QUFDUixNQUFFLEVBQUUsSUFBSTtBQUNSLFdBQU8sSUFBSSxLQUFLLEdBQUcsRUFBRSxLQUFLLENBQUM7QUFBQSxFQUM3QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLE9BQU8sa0JBQWtCLEtBQWdCLE1BQTZDO0FBQ3BGLFVBQU0sSUFBSSxJQUFJLEtBQUssRUFBRTtBQUNyQixNQUFFLElBQUksSUFBSSxFQUFFO0FBQ1osV0FBTyxJQUFJLEtBQUssR0FBRyxFQUFFLEtBQUssQ0FBQztBQUFBLEVBQzdCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxPQUFPLDJCQUEyQixPQUFtQixNQUE2QztBQUNoRyxXQUFPLElBQUksS0FBSyxPQUFPLEVBQUUsS0FBSyxDQUFDO0FBQUEsRUFDakM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxPQUFPLCtCQUErQixPQUFtQixNQUE2QztBQUNwRyxVQUFNLElBQUksSUFBSSxLQUFLLEVBQUU7QUFDckIsTUFBRSxJQUFJLEtBQUs7QUFDWCxXQUFPLElBQUksS0FBSyxHQUFHLEVBQUUsS0FBSyxDQUFDO0FBQUEsRUFDN0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBU0EsT0FBTyw0QkFBNEIsT0FBbUIsTUFBNkM7QUFDakcsVUFBTSxJQUFJLElBQUksS0FBSyxFQUFFO0FBQ3JCLE1BQUUsQ0FBQyxJQUFJLE1BQU0sQ0FBQztBQUNkLE1BQUUsQ0FBQyxJQUFJLE1BQU0sQ0FBQztBQUNkLE1BQUUsQ0FBQyxJQUFJLE1BQU0sQ0FBQztBQUNkLE1BQUUsRUFBRSxJQUFJLE1BQU0sQ0FBQztBQUNmLE1BQUUsQ0FBQyxJQUFJLE1BQU0sQ0FBQztBQUNkLE1BQUUsQ0FBQyxJQUFJLE1BQU0sQ0FBQztBQUNkLE1BQUUsQ0FBQyxJQUFJLE1BQU0sQ0FBQztBQUNkLE1BQUUsRUFBRSxJQUFJLE1BQU0sQ0FBQztBQUNmLE1BQUUsQ0FBQyxJQUFJLE1BQU0sQ0FBQztBQUNkLE1BQUUsQ0FBQyxJQUFJLE1BQU0sQ0FBQztBQUNkLE1BQUUsRUFBRSxJQUFJLE1BQU0sRUFBRTtBQUNoQixNQUFFLEVBQUUsSUFBSSxNQUFNLEVBQUU7QUFDaEIsTUFBRSxDQUFDLElBQUksTUFBTSxFQUFFO0FBQ2YsTUFBRSxDQUFDLElBQUksTUFBTSxFQUFFO0FBQ2YsTUFBRSxFQUFFLElBQUksTUFBTSxFQUFFO0FBQ2hCLE1BQUUsRUFBRSxJQUFJLE1BQU0sRUFBRTtBQUNoQixXQUFPLElBQUksS0FBSyxHQUFHLEVBQUUsS0FBSyxDQUFDO0FBQUEsRUFDN0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBU0EsT0FBTyxrQkFBa0IsS0FBZ0IsTUFBNkM7QUFDcEYsVUFBTSxJQUFJLElBQUksS0FBSyxFQUFFO0FBQ3JCLE1BQUUsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDO0FBQ2YsTUFBRSxDQUFDLElBQUksSUFBSSxHQUFHLENBQUM7QUFDZixNQUFFLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQztBQUNmLE1BQUUsRUFBRSxJQUFJO0FBQ1IsTUFBRSxDQUFDLElBQUksSUFBSSxHQUFHLENBQUM7QUFDZixNQUFFLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQztBQUNmLE1BQUUsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDO0FBQ2YsTUFBRSxFQUFFLElBQUk7QUFDUixNQUFFLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQztBQUNmLE1BQUUsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDO0FBQ2YsTUFBRSxFQUFFLElBQUksSUFBSSxHQUFHLENBQUM7QUFDaEIsTUFBRSxFQUFFLElBQUk7QUFDUixNQUFFLENBQUMsSUFBSTtBQUNQLE1BQUUsQ0FBQyxJQUFJO0FBQ1AsTUFBRSxFQUFFLElBQUk7QUFDUixNQUFFLEVBQUUsSUFBSTtBQUNSLFdBQU8sSUFBSSxLQUFLLEdBQUcsRUFBRSxLQUFLLENBQUM7QUFBQSxFQUM3QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLE9BQU8sNEJBQTRCLE9BQXdCLE1BQTZDO0FBQ3RHLFVBQU0sSUFBSSxJQUFJLEtBQUssRUFBRTtBQUNyQixNQUFFLElBQUksS0FBSztBQUNYLFdBQU8sSUFBSSxLQUFLLEdBQUcsRUFBRSxLQUFLLENBQUM7QUFBQSxFQUM3QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLE9BQU8sMEJBQTBCLE9BQXNCLE1BQTZDO0FBQ2xHLFVBQU0sSUFBSSxJQUFJLEtBQUssRUFBRTtBQUNyQixNQUFFLElBQUksS0FBSztBQUNYLFdBQU8sSUFBSSxLQUFLLEdBQUcsRUFBRSxLQUFLLENBQUM7QUFBQSxFQUM3QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsT0FBTyx5QkFBeUIsT0FBd0IsTUFBNkM7QUFDbkcsVUFBTSxJQUFJLElBQUksS0FBSyxFQUFFO0FBQ3JCLE1BQUUsQ0FBQyxJQUFJLE1BQU0sQ0FBQztBQUNkLE1BQUUsQ0FBQyxJQUFJLE1BQU0sQ0FBQztBQUNkLE1BQUUsQ0FBQyxJQUFJLE1BQU0sQ0FBQztBQUNkLE1BQUUsRUFBRSxJQUFJLE1BQU0sQ0FBQztBQUNmLE1BQUUsQ0FBQyxJQUFJLE1BQU0sQ0FBQztBQUNkLE1BQUUsQ0FBQyxJQUFJLE1BQU0sQ0FBQztBQUNkLE1BQUUsQ0FBQyxJQUFJLE1BQU0sQ0FBQztBQUNkLE1BQUUsRUFBRSxJQUFJLE1BQU0sQ0FBQztBQUNmLE1BQUUsQ0FBQyxJQUFJLE1BQU0sQ0FBQztBQUNkLE1BQUUsQ0FBQyxJQUFJLE1BQU0sQ0FBQztBQUNkLE1BQUUsRUFBRSxJQUFJLE1BQU0sRUFBRTtBQUNoQixNQUFFLEVBQUUsSUFBSSxNQUFNLEVBQUU7QUFDaEIsTUFBRSxDQUFDLElBQUksTUFBTSxFQUFFO0FBQ2YsTUFBRSxDQUFDLElBQUksTUFBTSxFQUFFO0FBQ2YsTUFBRSxFQUFFLElBQUksTUFBTSxFQUFFO0FBQ2hCLE1BQUUsRUFBRSxJQUFJLE1BQU0sRUFBRTtBQUNoQixXQUFPLElBQUksS0FBSyxHQUFHLEVBQUUsS0FBSyxDQUFDO0FBQUEsRUFDN0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLE9BQU8sdUJBQXVCLE9BQXNCLE1BQTZDO0FBQy9GLFVBQU0sSUFBSSxJQUFJLEtBQUssRUFBRTtBQUNyQixNQUFFLENBQUMsSUFBSSxNQUFNLENBQUM7QUFDZCxNQUFFLENBQUMsSUFBSSxNQUFNLENBQUM7QUFDZCxNQUFFLENBQUMsSUFBSSxNQUFNLENBQUM7QUFDZCxNQUFFLEVBQUUsSUFBSSxNQUFNLENBQUM7QUFDZixNQUFFLENBQUMsSUFBSSxNQUFNLENBQUM7QUFDZCxNQUFFLENBQUMsSUFBSSxNQUFNLENBQUM7QUFDZCxNQUFFLENBQUMsSUFBSSxNQUFNLENBQUM7QUFDZCxNQUFFLEVBQUUsSUFBSSxNQUFNLENBQUM7QUFDZixNQUFFLENBQUMsSUFBSSxNQUFNLENBQUM7QUFDZCxNQUFFLENBQUMsSUFBSSxNQUFNLENBQUM7QUFDZCxNQUFFLEVBQUUsSUFBSSxNQUFNLEVBQUU7QUFDaEIsTUFBRSxFQUFFLElBQUksTUFBTSxFQUFFO0FBQ2hCLE1BQUUsQ0FBQyxJQUFJLE1BQU0sRUFBRTtBQUNmLE1BQUUsQ0FBQyxJQUFJLE1BQU0sRUFBRTtBQUNmLE1BQUUsRUFBRSxJQUFJLE1BQU0sRUFBRTtBQUNoQixNQUFFLEVBQUUsSUFBSSxNQUFNLEVBQUU7QUFDaEIsV0FBTyxJQUFJLEtBQUssR0FBRyxFQUFFLEtBQUssQ0FBQztBQUFBLEVBQzdCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsT0FBTyxvQkFBb0IsR0FBZ0IsTUFBNkM7QUFDdEYsVUFBTSxLQUFLLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUM7QUFDM0IsVUFBTSxLQUFLLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUM7QUFDM0IsVUFBTSxLQUFLLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUM7QUFDM0IsVUFBTSxLQUFLLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUM7QUFDM0IsVUFBTSxLQUFLLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUM7QUFDM0IsVUFBTSxLQUFLLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUM7QUFDM0IsVUFBTSxLQUFLLEVBQUUs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
