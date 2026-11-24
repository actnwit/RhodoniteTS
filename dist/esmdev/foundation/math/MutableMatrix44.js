// src/foundation/math/MutableMatrix44.ts
import { Logger } from "../misc/Logger.js";
import { MathUtil } from "./MathUtil.js";
import { Matrix44_ } from "./Matrix44.js";
var MutableMatrix44_ = class extends Matrix44_ {
  /**
   * Creates a new MutableMatrix44_ instance.
   * @param m - The typed array containing the matrix components
   * @param options - Configuration object containing the typed array constructor
   */
  constructor(m, options) {
    super(m, options);
  }
  /**
   * Sets the value at position (0,0) in the matrix.
   *
   * @param val - The value to set
   */
  set m00(val) {
    this._v[0] = val;
  }
  /**
   * Gets the value at position (0,0) in the matrix.
   *
   * @returns The value at position (0,0)
   */
  get m00() {
    return this._v[0];
  }
  /**
   * Sets the value at position (1,0) in the matrix.
   *
   * @param val - The value to set
   */
  set m10(val) {
    this._v[1] = val;
  }
  /**
   * Gets the value at position (1,0) in the matrix.
   *
   * @returns The value at position (1,0)
   */
  get m10() {
    return this._v[1];
  }
  /**
   * Sets the value at position (2,0) in the matrix.
   *
   * @param val - The value to set
   */
  set m20(val) {
    this._v[2] = val;
  }
  /**
   * Gets the value at position (2,0) in the matrix.
   *
   * @returns The value at position (2,0)
   */
  get m20() {
    return this._v[2];
  }
  /**
   * Sets the value at position (3,0) in the matrix.
   *
   * @param val - The value to set
   */
  set m30(val) {
    this._v[3] = val;
  }
  /**
   * Gets the value at position (3,0) in the matrix.
   *
   * @returns The value at position (3,0)
   */
  get m30() {
    return this._v[3];
  }
  /**
   * Sets the value at position (0,1) in the matrix.
   *
   * @param val - The value to set
   */
  set m01(val) {
    this._v[4] = val;
  }
  /**
   * Gets the value at position (0,1) in the matrix.
   *
   * @returns The value at position (0,1)
   */
  get m01() {
    return this._v[4];
  }
  /**
   * Sets the value at position (1,1) in the matrix.
   *
   * @param val - The value to set
   */
  set m11(val) {
    this._v[5] = val;
  }
  /**
   * Gets the value at position (1,1) in the matrix.
   *
   * @returns The value at position (1,1)
   */
  get m11() {
    return this._v[5];
  }
  /**
   * Sets the value at position (2,1) in the matrix.
   *
   * @param val - The value to set
   */
  set m21(val) {
    this._v[6] = val;
  }
  /**
   * Gets the value at position (2,1) in the matrix.
   *
   * @returns The value at position (2,1)
   */
  get m21() {
    return this._v[6];
  }
  /**
   * Sets the value at position (3,1) in the matrix.
   *
   * @param val - The value to set
   */
  set m31(val) {
    this._v[7] = val;
  }
  /**
   * Gets the value at position (3,1) in the matrix.
   *
   * @returns The value at position (3,1)
   */
  get m31() {
    return this._v[7];
  }
  /**
   * Sets the value at position (0,2) in the matrix.
   *
   * @param val - The value to set
   */
  set m02(val) {
    this._v[8] = val;
  }
  /**
   * Gets the value at position (0,2) in the matrix.
   *
   * @returns The value at position (0,2)
   */
  get m02() {
    return this._v[8];
  }
  /**
   * Sets the value at position (1,2) in the matrix.
   *
   * @param val - The value to set
   */
  set m12(val) {
    this._v[9] = val;
  }
  /**
   * Gets the value at position (1,2) in the matrix.
   *
   * @returns The value at position (1,2)
   */
  get m12() {
    return this._v[9];
  }
  /**
   * Sets the value at position (2,2) in the matrix.
   *
   * @param val - The value to set
   */
  set m22(val) {
    this._v[10] = val;
  }
  /**
   * Gets the value at position (2,2) in the matrix.
   *
   * @returns The value at position (2,2)
   */
  get m22() {
    return this._v[10];
  }
  /**
   * Sets the value at position (3,2) in the matrix.
   *
   * @param val - The value to set
   */
  set m32(val) {
    this._v[11] = val;
  }
  /**
   * Gets the value at position (3,2) in the matrix.
   *
   * @returns The value at position (3,2)
   */
  get m32() {
    return this._v[11];
  }
  /**
   * Sets the value at position (0,3) in the matrix.
   *
   * @param val - The value to set
   */
  set m03(val) {
    this._v[12] = val;
  }
  /**
   * Gets the value at position (0,3) in the matrix.
   *
   * @returns The value at position (0,3)
   */
  get m03() {
    return this._v[12];
  }
  /**
   * Sets the value at position (1,3) in the matrix.
   *
   * @param val - The value to set
   */
  set m13(val) {
    this._v[13] = val;
  }
  /**
   * Gets the value at position (1,3) in the matrix.
   *
   * @returns The value at position (1,3)
   */
  get m13() {
    return this._v[13];
  }
  /**
   * Sets the value at position (2,3) in the matrix.
   *
   * @param val - The value to set
   */
  set m23(val) {
    this._v[14] = val;
  }
  /**
   * Gets the value at position (2,3) in the matrix.
   *
   * @returns The value at position (2,3)
   */
  get m23() {
    return this._v[14];
  }
  /**
   * Sets the value at position (3,3) in the matrix.
   *
   * @param val - The value to set
   */
  set m33(val) {
    this._v[15] = val;
  }
  /**
   * Gets the value at position (3,3) in the matrix.
   *
   * @returns The value at position (3,3)
   */
  get m33() {
    return this._v[15];
  }
  /**
   * Gets the X translation component from the matrix.
   *
   * @returns The X translation value
   */
  get translateX() {
    return this._v[12];
  }
  /**
   * Sets the X translation component in the matrix.
   *
   * @param val - The X translation value to set
   */
  set translateX(val) {
    this._v[12] = val;
  }
  /**
   * Gets the Y translation component from the matrix.
   *
   * @returns The Y translation value
   */
  get translateY() {
    return this._v[13];
  }
  /**
   * Sets the Y translation component in the matrix.
   *
   * @param val - The Y translation value to set
   */
  set translateY(val) {
    this._v[13] = val;
  }
  /**
   * Gets the Z translation component from the matrix.
   *
   * @returns The Z translation value
   */
  get translateZ() {
    return this._v[14];
  }
  /**
   * Sets the Z translation component in the matrix.
   *
   * @param val - The Z translation value to set
   */
  set translateZ(val) {
    this._v[14] = val;
  }
  /**
   * Gets the class name identifier for this matrix type.
   *
   * @returns The string 'MutableMatrix44'
   */
  get className() {
    return "MutableMatrix44";
  }
  /**
   * Creates a copy of this matrix.
   *
   * @returns A new MutableMatrix44 instance with the same values as this matrix
   */
  clone() {
    const result = super.clone();
    return result;
  }
  /**
   * Extracts the rotation part of this matrix.
   *
   * @returns A new MutableMatrix44 instance containing only the rotation transformation
   */
  getRotate() {
    const rotateMat = super.getRotate();
    return rotateMat;
  }
  /**
   * Extracts the translation part of this matrix.
   *
   * @returns A new MutableVector3 instance containing the translation values
   */
  getTranslate() {
    const rotateMat = super.getTranslate();
    return rotateMat;
  }
  /**
   * Extracts the translation part of this matrix into the provided vector.
   *
   * @param outVec - The vector to store the translation values
   * @returns The output vector with translation values
   */
  getTranslateTo(outVec) {
    const rotateMat = super.getTranslateTo(outVec);
    return rotateMat;
  }
  /**
   * Extracts the scale part of this matrix.
   *
   * @returns A new MutableVector3 instance containing the scale values for each axis
   */
  getScale() {
    const rotateMat = super.getScale();
    return rotateMat;
  }
  /**
   * Gets the raw Float32Array containing the matrix data.
   *
   * @returns The internal Float32Array with matrix values in column-major order
   */
  raw() {
    return this._v;
  }
  /**
   * Sets a value at the specified row and column position.
   *
   * @param row_i - The row index (0-3)
   * @param column_i - The column index (0-3)
   * @param value - The value to set
   * @returns This matrix instance for method chaining
   */
  setAt(row_i, column_i, value) {
    this._v[row_i + column_i * 4] = value;
    return this;
  }
  /**
   * Sets all 16 components of the matrix with individual values.
   * Values are specified in row-major order but stored internally in column-major order.
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
   * @returns This matrix instance for method chaining
   */
  setComponents(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
    this._v[0] = m00;
    this._v[4] = m01;
    this._v[8] = m02;
    this._v[12] = m03;
    this._v[1] = m10;
    this._v[5] = m11;
    this._v[9] = m12;
    this._v[13] = m13;
    this._v[2] = m20;
    this._v[6] = m21;
    this._v[10] = m22;
    this._v[14] = m23;
    this._v[3] = m30;
    this._v[7] = m31;
    this._v[11] = m32;
    this._v[15] = m33;
    return this;
  }
  /**
   * Copies all components from another matrix to this matrix.
   *
   * @param mat - The source matrix to copy from
   * @returns This matrix instance for method chaining
   */
  copyComponents(mat) {
    this._v[0] = mat._v[0];
    this._v[4] = mat._v[4];
    this._v[8] = mat._v[8];
    this._v[12] = mat._v[12];
    this._v[1] = mat._v[1];
    this._v[5] = mat._v[5];
    this._v[9] = mat._v[9];
    this._v[13] = mat._v[13];
    this._v[2] = mat._v[2];
    this._v[6] = mat._v[6];
    this._v[10] = mat._v[10];
    this._v[14] = mat._v[14];
    this._v[3] = mat._v[3];
    this._v[7] = mat._v[7];
    this._v[11] = mat._v[11];
    this._v[15] = mat._v[15];
    return this;
  }
  /**
   * Sets this matrix to the zero matrix (all elements are 0).
   *
   * @returns This matrix instance for method chaining
   */
  zero() {
    return this.setComponents(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }
  /**
   * Sets this matrix to the identity matrix.
   *
   * @returns This matrix instance for method chaining
   */
  identity() {
    return this.setComponents(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  }
  _swap(l, r) {
    const temp = this._v[l];
    this._v[l] = this._v[r];
    this._v[r] = temp;
  }
  /**
   * Transposes this matrix in place (swaps rows and columns).
   *
   * @returns This matrix instance for method chaining
   */
  transpose() {
    this._swap(1, 4);
    this._swap(2, 8);
    this._swap(3, 12);
    this._swap(6, 9);
    this._swap(7, 13);
    this._swap(11, 14);
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
    const n00 = this._v[0] * this._v[5] - this._v[4] * this._v[1];
    const n01 = this._v[0] * this._v[9] - this._v[8] * this._v[1];
    const n02 = this._v[0] * this._v[13] - this._v[12] * this._v[1];
    const n03 = this._v[4] * this._v[9] - this._v[8] * this._v[5];
    const n04 = this._v[4] * this._v[13] - this._v[12] * this._v[5];
    const n05 = this._v[8] * this._v[13] - this._v[12] * this._v[9];
    const n06 = this._v[2] * this._v[7] - this._v[6] * this._v[3];
    const n07 = this._v[2] * this._v[11] - this._v[10] * this._v[3];
    const n08 = this._v[2] * this._v[15] - this._v[14] * this._v[3];
    const n09 = this._v[6] * this._v[11] - this._v[10] * this._v[7];
    const n10 = this._v[6] * this._v[15] - this._v[14] * this._v[7];
    const n11 = this._v[10] * this._v[15] - this._v[14] * this._v[11];
    const det = n00 * n11 - n01 * n10 + n02 * n09 + n03 * n08 - n04 * n07 + n05 * n06;
    const rowNorm0 = Math.abs(this._v[0]) + Math.abs(this._v[1]) + Math.abs(this._v[2]) + Math.abs(this._v[3]);
    const rowNorm1 = Math.abs(this._v[4]) + Math.abs(this._v[5]) + Math.abs(this._v[6]) + Math.abs(this._v[7]);
    const rowNorm2 = Math.abs(this._v[8]) + Math.abs(this._v[9]) + Math.abs(this._v[10]) + Math.abs(this._v[11]);
    const rowNorm3 = Math.abs(this._v[12]) + Math.abs(this._v[13]) + Math.abs(this._v[14]) + Math.abs(this._v[15]);
    if (MathUtil.isSingularDet(
      det,
      rowNorm0 * rowNorm1 * rowNorm2 * rowNorm3,
      MathUtil.getSingularEpsilon(this._v.BYTES_PER_ELEMENT)
    )) {
      return false;
    }
    const m00 = (this._v[5] * n11 - this._v[9] * n10 + this._v[13] * n09) / det;
    const m01 = (this._v[8] * n10 - this._v[4] * n11 - this._v[12] * n09) / det;
    const m02 = (this._v[7] * n05 - this._v[11] * n04 + this._v[15] * n03) / det;
    const m03 = (this._v[10] * n04 - this._v[6] * n05 - this._v[14] * n03) / det;
    const m10 = (this._v[9] * n08 - this._v[1] * n11 - this._v[13] * n07) / det;
    const m11 = (this._v[0] * n11 - this._v[8] * n08 + this._v[12] * n07) / det;
    const m12 = (this._v[11] * n02 - this._v[3] * n05 - this._v[15] * n01) / det;
    const m13 = (this._v[2] * n05 - this._v[10] * n02 + this._v[14] * n01) / det;
    const m20 = (this._v[1] * n10 - this._v[5] * n08 + this._v[13] * n06) / det;
    const m21 = (this._v[4] * n08 - this._v[0] * n10 - this._v[12] * n06) / det;
    const m22 = (this._v[3] * n04 - this._v[7] * n02 + this._v[15] * n00) / det;
    const m23 = (this._v[6] * n02 - this._v[2] * n04 - this._v[14] * n00) / det;
    const m30 = (this._v[5] * n07 - this._v[1] * n09 - this._v[9] * n06) / det;
    const m31 = (this._v[0] * n09 - this._v[4] * n07 + this._v[8] * n06) / det;
    const m32 = (this._v[7] * n01 - this._v[3] * n03 - this._v[11] * n00) / det;
    const m33 = (this._v[2] * n03 - this._v[6] * n01 + this._v[10] * n00) / det;
    this.setComponents(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
    return true;
  }
  /**
   * Inverts this matrix in place.
   *
   * If the matrix is numerically singular, it is set to the identity matrix
   * instead of being filled with `Infinity`/`NaN`.
   * Use {@link MutableMatrix44.tryInvert} when the caller needs to detect the failure.
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
   * Sets this matrix to a translation matrix with the given vector.
   *
   * @param vec - The translation vector
   * @returns This matrix instance for method chaining
   */
  translate(vec) {
    return this.setComponents(1, 0, 0, vec._v[0], 0, 1, 0, vec._v[1], 0, 0, 1, vec._v[2], 0, 0, 0, 1);
  }
  /**
   * Sets the translation component of this matrix without affecting other components.
   *
   * @param vec - The translation vector to set
   * @returns This matrix instance for method chaining
   */
  putTranslate(vec) {
    this._v[12] = vec._v[0];
    this._v[13] = vec._v[1];
    this._v[14] = vec._v[2];
    return this;
  }
  /**
   * Adds the given vector to the current translation component.
   *
   * @param vec - The translation vector to add
   * @returns This matrix instance for method chaining
   */
  addTranslate(vec) {
    this._v[12] += vec._v[0];
    this._v[13] += vec._v[1];
    this._v[14] += vec._v[2];
    return this;
  }
  /**
   * Sets this matrix to a rotation matrix around the X-axis.
   *
   * @param radian - The rotation angle in radians
   * @returns This matrix instance for method chaining
   */
  rotateX(radian) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this.setComponents(1, 0, 0, 0, 0, cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1);
  }
  /**
   * Sets this matrix to a rotation matrix around the Y-axis.
   *
   * @param radian - The rotation angle in radians
   * @returns This matrix instance for method chaining
   */
  rotateY(radian) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this.setComponents(cos, 0, sin, 0, 0, 1, 0, 0, -sin, 0, cos, 0, 0, 0, 0, 1);
  }
  /**
   * Sets this matrix to a rotation matrix around the Z-axis.
   *
   * @param radian - The rotation angle in radians
   * @returns This matrix instance for method chaining
   */
  rotateZ(radian) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this.setComponents(cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  }
  /**
   * Sets this matrix to a rotation matrix with rotations around X, Y, and Z axes in that order.
   * The rotation order is: Z * Y * X (applied from right to left).
   *
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
    const m03 = 0;
    const m13 = 0;
    const m23 = 0;
    const m30 = 0;
    const m31 = 0;
    const m32 = 0;
    const m33 = 1;
    return this.setComponents(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
  }
  /**
   * Sets this matrix to a rotation matrix from a vector containing X, Y, Z rotation angles.
   *
   * @param vec - Vector containing rotation angles (x, y, z) in radians
   * @returns This matrix instance for method chaining
   */
  rotate(vec) {
    return this.rotateXYZ(vec._v[0], vec._v[1], vec._v[2]);
  }
  /**
   * Sets this matrix to a scaling matrix with the given vector.
   *
   * @param vec - The scaling factors for X, Y, and Z axes
   * @returns This matrix instance for method chaining
   */
  scale(vec) {
    return this.setComponents(vec._v[0], 0, 0, 0, 0, vec._v[1], 0, 0, 0, 0, vec._v[2], 0, 0, 0, 0, 1);
  }
  /**
   * Multiplies the scaling factors to the current matrix.
   * This applies scaling transformation to each column of the matrix.
   *
   * @param vec - The scaling factors for X, Y, and Z axes
   * @returns This matrix instance for method chaining
   */
  multiplyScale(vec) {
    this._v[0] *= vec._v[0];
    this._v[4] *= vec._v[0];
    this._v[8] *= vec._v[0];
    this._v[12] *= vec._v[0];
    this._v[1] *= vec._v[1];
    this._v[5] *= vec._v[1];
    this._v[9] *= vec._v[1];
    this._v[13] *= vec._v[1];
    this._v[2] *= vec._v[2];
    this._v[6] *= vec._v[2];
    this._v[10] *= vec._v[2];
    this._v[14] *= vec._v[2];
    return this;
  }
  /**
   * Multiplies this matrix by another matrix from the right side (this * mat).
   * This operation transforms this matrix in place.
   *
   * @param mat - The matrix to multiply from the right
   * @returns This matrix instance for method chaining
   */
  multiply(mat) {
    if (mat.isIdentityMatrixClass) {
      return this;
    }
    const m00 = this._v[0] * mat._v[0] + this._v[4] * mat._v[1] + this._v[8] * mat._v[2] + this._v[12] * mat._v[3];
    const m01 = this._v[0] * mat._v[4] + this._v[4] * mat._v[5] + this._v[8] * mat._v[6] + this._v[12] * mat._v[7];
    const m02 = this._v[0] * mat._v[8] + this._v[4] * mat._v[9] + this._v[8] * mat._v[10] + this._v[12] * mat._v[11];
    const m03 = this._v[0] * mat._v[12] + this._v[4] * mat._v[13] + this._v[8] * mat._v[14] + this._v[12] * mat._v[15];
    const m10 = this._v[1] * mat._v[0] + this._v[5] * mat._v[1] + this._v[9] * mat._v[2] + this._v[13] * mat._v[3];
    const m11 = this._v[1] * mat._v[4] + this._v[5] * mat._v[5] + this._v[9] * mat._v[6] + this._v[13] * mat._v[7];
    const m12 = this._v[1] * mat._v[8] + this._v[5] * mat._v[9] + this._v[9] * mat._v[10] + this._v[13] * mat._v[11];
    const m13 = this._v[1] * mat._v[12] + this._v[5] * mat._v[13] + this._v[9] * mat._v[14] + this._v[13] * mat._v[15];
    const m20 = this._v[2] * mat._v[0] + this._v[6] * mat._v[1] + this._v[10] * mat._v[2] + this._v[14] * mat._v[3];
    const m21 = this._v[2] * mat._v[4] + this._v[6] * mat._v[5] + this._v[10] * mat._v[6] + this._v[14] * mat._v[7];
    const m22 = this._v[2] * mat._v[8] + this._v[6] * mat._v[9] + this._v[10] * mat._v[10] + this._v[14] * mat._v[11];
    const m23 = this._v[2] * mat._v[12] + this._v[6] * mat._v[13] + this._v[10] * mat._v[14] + this._v[14] * mat._v[15];
    const m30 = this._v[3] * mat._v[0] + this._v[7] * mat._v[1] + this._v[11] * mat._v[2] + this._v[15] * mat._v[3];
    const m31 = this._v[3] * mat._v[4] + this._v[7] * mat._v[5] + this._v[11] * mat._v[6] + this._v[15] * mat._v[7];
    const m32 = this._v[3] * mat._v[8] + this._v[7] * mat._v[9] + this._v[11] * mat._v[10] + this._v[15] * mat._v[11];
    const m33 = this._v[3] * mat._v[12] + this._v[7] * mat._v[13] + this._v[11] * mat._v[14] + this._v[15] * mat._v[15];
    return this.setComponents(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
  }
  /**
   * Multiplies this matrix by another matrix from the left side (mat * this).
   * This operation transforms this matrix in place.
   *
   * @param mat - The matrix to multiply from the left
   * @returns This matrix instance for method chaining
   */
  multiplyByLeft(mat) {
    if (mat.isIdentityMatrixClass) {
      return this;
    }
    const m00 = mat._v[0] * this._v[0] + mat._v[4] * this._v[1] + mat._v[8] * this._v[2] + mat._v[12] * this._v[3];
    const m01 = mat._v[0] * this._v[4] + mat._v[4] * this._v[5] + mat._v[8] * this._v[6] + mat._v[12] * this._v[7];
    const m02 = mat._v[0] * this._v[8] + mat._v[4] * this._v[9] + mat._v[8] * this._v[10] + mat._v[12] * this._v[11];
    const m03 = mat._v[0] * this._v[12] + mat._v[4] * this._v[13] + mat._v[8] * this._v[14] + mat._v[12] * this._v[15];
    const m10 = mat._v[1] * this._v[0] + mat._v[5] * this._v[1] + mat._v[9] * this._v[2] + mat._v[13] * this._v[3];
    const m11 = mat._v[1] * this._v[4] + mat._v[5] * this._v[5] + mat._v[9] * this._v[6] + mat._v[13] * this._v[7];
    const m12 = mat._v[1] * this._v[8] + mat._v[5] * this._v[9] + mat._v[9] * this._v[10] + mat._v[13] * this._v[11];
    const m13 = mat._v[1] * this._v[12] + mat._v[5] * this._v[13] + mat._v[9] * this._v[14] + mat._v[13] * this._v[15];
    const m20 = mat._v[2] * this._v[0] + mat._v[6] * this._v[1] + mat._v[10] * this._v[2] + mat._v[14] * this._v[3];
    const m21 = mat._v[2] * this._v[4] + mat._v[6] * this._v[5] + mat._v[10] * this._v[6] + mat._v[14] * this._v[7];
    const m22 = mat._v[2] * this._v[8] + mat._v[6] * this._v[9] + mat._v[10] * this._v[10] + mat._v[14] * this._v[11];
    const m23 = mat._v[2] * this._v[12] + mat._v[6] * this._v[13] + mat._v[10] * this._v[14] + mat._v[14] * this._v[15];
    const m30 = mat._v[3] * this._v[0] + mat._v[7] * this._v[1] + mat._v[11] * this._v[2] + mat._v[15] * this._v[3];
    const m31 = mat._v[3] * this._v[4] + mat._v[7] * this._v[5] + mat._v[11] * this._v[6] + mat._v[15] * this._v[7];
    const m32 = mat._v[3] * this._v[8] + mat._v[7] * this._v[9] + mat._v[11] * this._v[10] + mat._v[15] * this._v[11];
    const m33 = mat._v[3] * this._v[12] + mat._v[7] * this._v[13] + mat._v[11] * this._v[14] + mat._v[15] * this._v[15];
    return this.setComponents(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
  }
  /**
   * Sets this matrix to a rotation matrix based on the given quaternion.
   *
   * @param quat - The quaternion to convert to a rotation matrix
   * @returns This matrix instance for method chaining
   */
  fromQuaternion(quat) {
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
    return this.setComponents(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
  }
};
var MutableMatrix44 = class extends MutableMatrix44_ {
  /**
   * Creates a new MutableMatrix44 instance.
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
var MutableMatrix44D = class extends MutableMatrix44_ {
  /**
   * Creates a new MutableMatrix44D instance.
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
  MutableMatrix44,
  MutableMatrix44D,
  MutableMatrix44 as MutableMatrix44F,
  MutableMatrix44_
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9NdXRhYmxlTWF0cml4NDQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgQXJyYXkxNiwgQXJyYXlUeXBlLCBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3RvciwgSW5kZXgsIFR5cGVkQXJyYXkgfSBmcm9tICcuLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuLi9taXNjL0xvZ2dlcic7XG5pbXBvcnQgdHlwZSB7IElNYXRyaXgzMywgSU1hdHJpeDQ0LCBJTXV0YWJsZU1hdHJpeCwgSU11dGFibGVNYXRyaXg0NCB9IGZyb20gJy4vSU1hdHJpeCc7XG5pbXBvcnQgdHlwZSB7IElRdWF0ZXJuaW9uIH0gZnJvbSAnLi9JUXVhdGVybmlvbic7XG5pbXBvcnQgdHlwZSB7IElWZWN0b3IzIH0gZnJvbSAnLi9JVmVjdG9yJztcbmltcG9ydCB7IE1hdGhVdGlsIH0gZnJvbSAnLi9NYXRoVXRpbCc7XG5pbXBvcnQgeyBNYXRyaXg0NF8gfSBmcm9tICcuL01hdHJpeDQ0JztcbmltcG9ydCB0eXBlIHsgTXV0YWJsZVZlY3RvcjMgfSBmcm9tICcuL011dGFibGVWZWN0b3IzJztcblxuLyoqXG4gKiBBIG11dGFibGUgNHg0IG1hdHJpeCBjbGFzcyB0aGF0IGV4dGVuZHMgdGhlIGltbXV0YWJsZSBNYXRyaXg0NCBjbGFzcy5cbiAqXG4gKiBUaGlzIGNsYXNzIHByb3ZpZGVzIGEgbXV0YWJsZSBpbnRlcmZhY2UgZm9yIDR4NCBtYXRyaXggb3BlcmF0aW9ucyBjb21tb25seSB1c2VkXG4gKiBpbiAzRCBncmFwaGljcywgaW5jbHVkaW5nIHRyYW5zZm9ybWF0aW9ucywgcm90YXRpb25zLCBzY2FsaW5nLCBhbmQgcHJvamVjdGlvbnMuXG4gKiBUaGUgbWF0cml4IGlzIHN0b3JlZCBpbiBjb2x1bW4tbWFqb3Igb3JkZXIgaW50ZXJuYWxseSwgd2hpY2ggaXMgY29tcGF0aWJsZSB3aXRoIFdlYkdMLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjb25zdCBtYXRyaXggPSBNdXRhYmxlTWF0cml4NDQuaWRlbnRpdHkoKTtcbiAqIG1hdHJpeC50cmFuc2xhdGUoVmVjdG9yMy5mcm9tQ29weSgxLCAyLCAzKSk7XG4gKiBtYXRyaXgucm90YXRlWShNYXRoLlBJIC8gNCk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIE11dGFibGVNYXRyaXg0NF88VCBleHRlbmRzIEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yPlxuICBleHRlbmRzIE1hdHJpeDQ0XzxUPlxuICBpbXBsZW1lbnRzIElNdXRhYmxlTWF0cml4LCBJTXV0YWJsZU1hdHJpeDQ0XG57XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IE11dGFibGVNYXRyaXg0NF8gaW5zdGFuY2UuXG4gICAqIEBwYXJhbSBtIC0gVGhlIHR5cGVkIGFycmF5IGNvbnRhaW5pbmcgdGhlIG1hdHJpeCBjb21wb25lbnRzXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gQ29uZmlndXJhdGlvbiBvYmplY3QgY29udGFpbmluZyB0aGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3JcbiAgICovXG4gIGNvbnN0cnVjdG9yKG06IFR5cGVkQXJyYXksIG9wdGlvbnM6IHsgdHlwZTogVCB9KSB7XG4gICAgc3VwZXIobSwgb3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmFsdWUgYXQgcG9zaXRpb24gKDAsMCkgaW4gdGhlIG1hdHJpeC5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSB2YWx1ZSB0byBzZXRcbiAgICovXG4gIHB1YmxpYyBzZXQgbTAwKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fdlswXSA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMCwwKSBpbiB0aGUgbWF0cml4LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgdmFsdWUgYXQgcG9zaXRpb24gKDAsMClcbiAgICovXG4gIHB1YmxpYyBnZXQgbTAwKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMF07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmFsdWUgYXQgcG9zaXRpb24gKDEsMCkgaW4gdGhlIG1hdHJpeC5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSB2YWx1ZSB0byBzZXRcbiAgICovXG4gIHB1YmxpYyBzZXQgbTEwKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fdlsxXSA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMSwwKSBpbiB0aGUgbWF0cml4LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgdmFsdWUgYXQgcG9zaXRpb24gKDEsMClcbiAgICovXG4gIHB1YmxpYyBnZXQgbTEwKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMV07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmFsdWUgYXQgcG9zaXRpb24gKDIsMCkgaW4gdGhlIG1hdHJpeC5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSB2YWx1ZSB0byBzZXRcbiAgICovXG4gIHB1YmxpYyBzZXQgbTIwKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fdlsyXSA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMiwwKSBpbiB0aGUgbWF0cml4LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgdmFsdWUgYXQgcG9zaXRpb24gKDIsMClcbiAgICovXG4gIHB1YmxpYyBnZXQgbTIwKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMl07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmFsdWUgYXQgcG9zaXRpb24gKDMsMCkgaW4gdGhlIG1hdHJpeC5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSB2YWx1ZSB0byBzZXRcbiAgICovXG4gIHB1YmxpYyBzZXQgbTMwKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fdlszXSA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMywwKSBpbiB0aGUgbWF0cml4LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgdmFsdWUgYXQgcG9zaXRpb24gKDMsMClcbiAgICovXG4gIHB1YmxpYyBnZXQgbTMwKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbM107XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmFsdWUgYXQgcG9zaXRpb24gKDAsMSkgaW4gdGhlIG1hdHJpeC5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSB2YWx1ZSB0byBzZXRcbiAgICovXG4gIHB1YmxpYyBzZXQgbTAxKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fdls0XSA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMCwxKSBpbiB0aGUgbWF0cml4LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgdmFsdWUgYXQgcG9zaXRpb24gKDAsMSlcbiAgICovXG4gIHB1YmxpYyBnZXQgbTAxKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbNF07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmFsdWUgYXQgcG9zaXRpb24gKDEsMSkgaW4gdGhlIG1hdHJpeC5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSB2YWx1ZSB0byBzZXRcbiAgICovXG4gIHB1YmxpYyBzZXQgbTExKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fdls1XSA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMSwxKSBpbiB0aGUgbWF0cml4LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgdmFsdWUgYXQgcG9zaXRpb24gKDEsMSlcbiAgICovXG4gIHB1YmxpYyBnZXQgbTExKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbNV07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmFsdWUgYXQgcG9zaXRpb24gKDIsMSkgaW4gdGhlIG1hdHJpeC5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSB2YWx1ZSB0byBzZXRcbiAgICovXG4gIHB1YmxpYyBzZXQgbTIxKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fdls2XSA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMiwxKSBpbiB0aGUgbWF0cml4LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgdmFsdWUgYXQgcG9zaXRpb24gKDIsMSlcbiAgICovXG4gIHB1YmxpYyBnZXQgbTIxKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbNl07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmFsdWUgYXQgcG9zaXRpb24gKDMsMSkgaW4gdGhlIG1hdHJpeC5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSB2YWx1ZSB0byBzZXRcbiAgICovXG4gIHB1YmxpYyBzZXQgbTMxKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fdls3XSA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMywxKSBpbiB0aGUgbWF0cml4LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgdmFsdWUgYXQgcG9zaXRpb24gKDMsMSlcbiAgICovXG4gIHB1YmxpYyBnZXQgbTMxKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbN107XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmFsdWUgYXQgcG9zaXRpb24gKDAsMikgaW4gdGhlIG1hdHJpeC5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSB2YWx1ZSB0byBzZXRcbiAgICovXG4gIHB1YmxpYyBzZXQgbTAyKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fdls4XSA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMCwyKSBpbiB0aGUgbWF0cml4LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgdmFsdWUgYXQgcG9zaXRpb24gKDAsMilcbiAgICovXG4gIHB1YmxpYyBnZXQgbTAyKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbOF07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmFsdWUgYXQgcG9zaXRpb24gKDEsMikgaW4gdGhlIG1hdHJpeC5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSB2YWx1ZSB0byBzZXRcbiAgICovXG4gIHB1YmxpYyBzZXQgbTEyKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fdls5XSA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMSwyKSBpbiB0aGUgbWF0cml4LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgdmFsdWUgYXQgcG9zaXRpb24gKDEsMilcbiAgICovXG4gIHB1YmxpYyBnZXQgbTEyKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbOV07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmFsdWUgYXQgcG9zaXRpb24gKDIsMikgaW4gdGhlIG1hdHJpeC5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSB2YWx1ZSB0byBzZXRcbiAgICovXG4gIHB1YmxpYyBzZXQgbTIyKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fdlsxMF0gPSB2YWw7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmFsdWUgYXQgcG9zaXRpb24gKDIsMikgaW4gdGhlIG1hdHJpeC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHZhbHVlIGF0IHBvc2l0aW9uICgyLDIpXG4gICAqL1xuICBwdWJsaWMgZ2V0IG0yMigpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92WzEwXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMywyKSBpbiB0aGUgbWF0cml4LlxuICAgKlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIHZhbHVlIHRvIHNldFxuICAgKi9cbiAgcHVibGljIHNldCBtMzIodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl92WzExXSA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMywyKSBpbiB0aGUgbWF0cml4LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgdmFsdWUgYXQgcG9zaXRpb24gKDMsMilcbiAgICovXG4gIHB1YmxpYyBnZXQgbTMyKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMTFdO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHZhbHVlIGF0IHBvc2l0aW9uICgwLDMpIGluIHRoZSBtYXRyaXguXG4gICAqXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgdmFsdWUgdG8gc2V0XG4gICAqL1xuICBwdWJsaWMgc2V0IG0wMyh2YWw6IG51bWJlcikge1xuICAgIHRoaXMuX3ZbMTJdID0gdmFsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHZhbHVlIGF0IHBvc2l0aW9uICgwLDMpIGluIHRoZSBtYXRyaXguXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMCwzKVxuICAgKi9cbiAgcHVibGljIGdldCBtMDMoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdlsxMl07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmFsdWUgYXQgcG9zaXRpb24gKDEsMykgaW4gdGhlIG1hdHJpeC5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSB2YWx1ZSB0byBzZXRcbiAgICovXG4gIHB1YmxpYyBzZXQgbTEzKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fdlsxM10gPSB2YWw7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmFsdWUgYXQgcG9zaXRpb24gKDEsMykgaW4gdGhlIG1hdHJpeC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHZhbHVlIGF0IHBvc2l0aW9uICgxLDMpXG4gICAqL1xuICBwdWJsaWMgZ2V0IG0xMygpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92WzEzXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMiwzKSBpbiB0aGUgbWF0cml4LlxuICAgKlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIHZhbHVlIHRvIHNldFxuICAgKi9cbiAgcHVibGljIHNldCBtMjModmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl92WzE0XSA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMiwzKSBpbiB0aGUgbWF0cml4LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgdmFsdWUgYXQgcG9zaXRpb24gKDIsMylcbiAgICovXG4gIHB1YmxpYyBnZXQgbTIzKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMTRdO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHZhbHVlIGF0IHBvc2l0aW9uICgzLDMpIGluIHRoZSBtYXRyaXguXG4gICAqXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgdmFsdWUgdG8gc2V0XG4gICAqL1xuICBwdWJsaWMgc2V0IG0zMyh2YWw6IG51bWJlcikge1xuICAgIHRoaXMuX3ZbMTVdID0gdmFsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHZhbHVlIGF0IHBvc2l0aW9uICgzLDMpIGluIHRoZSBtYXRyaXguXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMywzKVxuICAgKi9cbiAgcHVibGljIGdldCBtMzMoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdlsxNV07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgWCB0cmFuc2xhdGlvbiBjb21wb25lbnQgZnJvbSB0aGUgbWF0cml4LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgWCB0cmFuc2xhdGlvbiB2YWx1ZVxuICAgKi9cbiAgcHVibGljIGdldCB0cmFuc2xhdGVYKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMTJdO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIFggdHJhbnNsYXRpb24gY29tcG9uZW50IGluIHRoZSBtYXRyaXguXG4gICAqXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgWCB0cmFuc2xhdGlvbiB2YWx1ZSB0byBzZXRcbiAgICovXG4gIHB1YmxpYyBzZXQgdHJhbnNsYXRlWCh2YWw6IG51bWJlcikge1xuICAgIHRoaXMuX3ZbMTJdID0gdmFsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIFkgdHJhbnNsYXRpb24gY29tcG9uZW50IGZyb20gdGhlIG1hdHJpeC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIFkgdHJhbnNsYXRpb24gdmFsdWVcbiAgICovXG4gIHB1YmxpYyBnZXQgdHJhbnNsYXRlWSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92WzEzXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBZIHRyYW5zbGF0aW9uIGNvbXBvbmVudCBpbiB0aGUgbWF0cml4LlxuICAgKlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIFkgdHJhbnNsYXRpb24gdmFsdWUgdG8gc2V0XG4gICAqL1xuICBwdWJsaWMgc2V0IHRyYW5zbGF0ZVkodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl92WzEzXSA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBaIHRyYW5zbGF0aW9uIGNvbXBvbmVudCBmcm9tIHRoZSBtYXRyaXguXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBaIHRyYW5zbGF0aW9uIHZhbHVlXG4gICAqL1xuICBwdWJsaWMgZ2V0IHRyYW5zbGF0ZVooKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdlsxNF07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgWiB0cmFuc2xhdGlvbiBjb21wb25lbnQgaW4gdGhlIG1hdHJpeC5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSBaIHRyYW5zbGF0aW9uIHZhbHVlIHRvIHNldFxuICAgKi9cbiAgcHVibGljIHNldCB0cmFuc2xhdGVaKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fdlsxNF0gPSB2YWw7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY2xhc3MgbmFtZSBpZGVudGlmaWVyIGZvciB0aGlzIG1hdHJpeCB0eXBlLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgc3RyaW5nICdNdXRhYmxlTWF0cml4NDQnXG4gICAqL1xuICBnZXQgY2xhc3NOYW1lKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICdNdXRhYmxlTWF0cml4NDQnO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBjb3B5IG9mIHRoaXMgbWF0cml4LlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlTWF0cml4NDQgaW5zdGFuY2Ugd2l0aCB0aGUgc2FtZSB2YWx1ZXMgYXMgdGhpcyBtYXRyaXhcbiAgICovXG4gIGNsb25lKCk6IE11dGFibGVNYXRyaXg0NCB7XG4gICAgY29uc3QgcmVzdWx0ID0gc3VwZXIuY2xvbmUoKSBhcyBNdXRhYmxlTWF0cml4NDQ7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHRyYWN0cyB0aGUgcm90YXRpb24gcGFydCBvZiB0aGlzIG1hdHJpeC5cbiAgICpcbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZU1hdHJpeDQ0IGluc3RhbmNlIGNvbnRhaW5pbmcgb25seSB0aGUgcm90YXRpb24gdHJhbnNmb3JtYXRpb25cbiAgICovXG4gIGdldFJvdGF0ZSgpOiBNdXRhYmxlTWF0cml4NDQge1xuICAgIGNvbnN0IHJvdGF0ZU1hdCA9IHN1cGVyLmdldFJvdGF0ZSgpIGFzIE11dGFibGVNYXRyaXg0NDtcbiAgICByZXR1cm4gcm90YXRlTWF0O1xuICB9XG5cbiAgLyoqXG4gICAqIEV4dHJhY3RzIHRoZSB0cmFuc2xhdGlvbiBwYXJ0IG9mIHRoaXMgbWF0cml4LlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlVmVjdG9yMyBpbnN0YW5jZSBjb250YWluaW5nIHRoZSB0cmFuc2xhdGlvbiB2YWx1ZXNcbiAgICovXG4gIGdldFRyYW5zbGF0ZSgpOiBNdXRhYmxlVmVjdG9yMyB7XG4gICAgY29uc3Qgcm90YXRlTWF0ID0gc3VwZXIuZ2V0VHJhbnNsYXRlKCkgYXMgTXV0YWJsZVZlY3RvcjM7XG4gICAgcmV0dXJuIHJvdGF0ZU1hdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHRyYWN0cyB0aGUgdHJhbnNsYXRpb24gcGFydCBvZiB0aGlzIG1hdHJpeCBpbnRvIHRoZSBwcm92aWRlZCB2ZWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBvdXRWZWMgLSBUaGUgdmVjdG9yIHRvIHN0b3JlIHRoZSB0cmFuc2xhdGlvbiB2YWx1ZXNcbiAgICogQHJldHVybnMgVGhlIG91dHB1dCB2ZWN0b3Igd2l0aCB0cmFuc2xhdGlvbiB2YWx1ZXNcbiAgICovXG4gIGdldFRyYW5zbGF0ZVRvKG91dFZlYzogTXV0YWJsZVZlY3RvcjMpOiBNdXRhYmxlVmVjdG9yMyB7XG4gICAgY29uc3Qgcm90YXRlTWF0ID0gc3VwZXIuZ2V0VHJhbnNsYXRlVG8ob3V0VmVjKSBhcyBNdXRhYmxlVmVjdG9yMztcbiAgICByZXR1cm4gcm90YXRlTWF0O1xuICB9XG5cbiAgLyoqXG4gICAqIEV4dHJhY3RzIHRoZSBzY2FsZSBwYXJ0IG9mIHRoaXMgbWF0cml4LlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlVmVjdG9yMyBpbnN0YW5jZSBjb250YWluaW5nIHRoZSBzY2FsZSB2YWx1ZXMgZm9yIGVhY2ggYXhpc1xuICAgKi9cbiAgZ2V0U2NhbGUoKTogTXV0YWJsZVZlY3RvcjMge1xuICAgIGNvbnN0IHJvdGF0ZU1hdCA9IHN1cGVyLmdldFNjYWxlKCkgYXMgTXV0YWJsZVZlY3RvcjM7XG4gICAgcmV0dXJuIHJvdGF0ZU1hdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSByYXcgRmxvYXQzMkFycmF5IGNvbnRhaW5pbmcgdGhlIG1hdHJpeCBkYXRhLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgaW50ZXJuYWwgRmxvYXQzMkFycmF5IHdpdGggbWF0cml4IHZhbHVlcyBpbiBjb2x1bW4tbWFqb3Igb3JkZXJcbiAgICovXG4gIHJhdygpIHtcbiAgICByZXR1cm4gdGhpcy5fdjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGEgdmFsdWUgYXQgdGhlIHNwZWNpZmllZCByb3cgYW5kIGNvbHVtbiBwb3NpdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHJvd19pIC0gVGhlIHJvdyBpbmRleCAoMC0zKVxuICAgKiBAcGFyYW0gY29sdW1uX2kgLSBUaGUgY29sdW1uIGluZGV4ICgwLTMpXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSB2YWx1ZSB0byBzZXRcbiAgICogQHJldHVybnMgVGhpcyBtYXRyaXggaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgc2V0QXQocm93X2k6IG51bWJlciwgY29sdW1uX2k6IG51bWJlciwgdmFsdWU6IG51bWJlcik6IE11dGFibGVNYXRyaXg0NCB7XG4gICAgdGhpcy5fdltyb3dfaSArIGNvbHVtbl9pICogNF0gPSB2YWx1ZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGFsbCAxNiBjb21wb25lbnRzIG9mIHRoZSBtYXRyaXggd2l0aCBpbmRpdmlkdWFsIHZhbHVlcy5cbiAgICogVmFsdWVzIGFyZSBzcGVjaWZpZWQgaW4gcm93LW1ham9yIG9yZGVyIGJ1dCBzdG9yZWQgaW50ZXJuYWxseSBpbiBjb2x1bW4tbWFqb3Igb3JkZXIuXG4gICAqXG4gICAqIEBwYXJhbSBtMDAgLSBFbGVtZW50IGF0IHJvdyAwLCBjb2x1bW4gMFxuICAgKiBAcGFyYW0gbTAxIC0gRWxlbWVudCBhdCByb3cgMCwgY29sdW1uIDFcbiAgICogQHBhcmFtIG0wMiAtIEVsZW1lbnQgYXQgcm93IDAsIGNvbHVtbiAyXG4gICAqIEBwYXJhbSBtMDMgLSBFbGVtZW50IGF0IHJvdyAwLCBjb2x1bW4gM1xuICAgKiBAcGFyYW0gbTEwIC0gRWxlbWVudCBhdCByb3cgMSwgY29sdW1uIDBcbiAgICogQHBhcmFtIG0xMSAtIEVsZW1lbnQgYXQgcm93IDEsIGNvbHVtbiAxXG4gICAqIEBwYXJhbSBtMTIgLSBFbGVtZW50IGF0IHJvdyAxLCBjb2x1bW4gMlxuICAgKiBAcGFyYW0gbTEzIC0gRWxlbWVudCBhdCByb3cgMSwgY29sdW1uIDNcbiAgICogQHBhcmFtIG0yMCAtIEVsZW1lbnQgYXQgcm93IDIsIGNvbHVtbiAwXG4gICAqIEBwYXJhbSBtMjEgLSBFbGVtZW50IGF0IHJvdyAyLCBjb2x1bW4gMVxuICAgKiBAcGFyYW0gbTIyIC0gRWxlbWVudCBhdCByb3cgMiwgY29sdW1uIDJcbiAgICogQHBhcmFtIG0yMyAtIEVsZW1lbnQgYXQgcm93IDIsIGNvbHVtbiAzXG4gICAqIEBwYXJhbSBtMzAgLSBFbGVtZW50IGF0IHJvdyAzLCBjb2x1bW4gMFxuICAgKiBAcGFyYW0gbTMxIC0gRWxlbWVudCBhdCByb3cgMywgY29sdW1uIDFcbiAgICogQHBhcmFtIG0zMiAtIEVsZW1lbnQgYXQgcm93IDMsIGNvbHVtbiAyXG4gICAqIEBwYXJhbSBtMzMgLSBFbGVtZW50IGF0IHJvdyAzLCBjb2x1bW4gM1xuICAgKiBAcmV0dXJucyBUaGlzIG1hdHJpeCBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICBzZXRDb21wb25lbnRzKFxuICAgIG0wMDogbnVtYmVyLFxuICAgIG0wMTogbnVtYmVyLFxuICAgIG0wMjogbnVtYmVyLFxuICAgIG0wMzogbnVtYmVyLFxuICAgIG0xMDogbnVtYmVyLFxuICAgIG0xMTogbnVtYmVyLFxuICAgIG0xMjogbnVtYmVyLFxuICAgIG0xMzogbnVtYmVyLFxuICAgIG0yMDogbnVtYmVyLFxuICAgIG0yMTogbnVtYmVyLFxuICAgIG0yMjogbnVtYmVyLFxuICAgIG0yMzogbnVtYmVyLFxuICAgIG0zMDogbnVtYmVyLFxuICAgIG0zMTogbnVtYmVyLFxuICAgIG0zMjogbnVtYmVyLFxuICAgIG0zMzogbnVtYmVyXG4gICk6IE11dGFibGVNYXRyaXg0NCB7XG4gICAgdGhpcy5fdlswXSA9IG0wMDtcbiAgICB0aGlzLl92WzRdID0gbTAxO1xuICAgIHRoaXMuX3ZbOF0gPSBtMDI7XG4gICAgdGhpcy5fdlsxMl0gPSBtMDM7XG4gICAgdGhpcy5fdlsxXSA9IG0xMDtcbiAgICB0aGlzLl92WzVdID0gbTExO1xuICAgIHRoaXMuX3ZbOV0gPSBtMTI7XG4gICAgdGhpcy5fdlsxM10gPSBtMTM7XG4gICAgdGhpcy5fdlsyXSA9IG0yMDtcbiAgICB0aGlzLl92WzZdID0gbTIxO1xuICAgIHRoaXMuX3ZbMTBdID0gbTIyO1xuICAgIHRoaXMuX3ZbMTRdID0gbTIzO1xuICAgIHRoaXMuX3ZbM10gPSBtMzA7XG4gICAgdGhpcy5fdls3XSA9IG0zMTtcbiAgICB0aGlzLl92WzExXSA9IG0zMjtcbiAgICB0aGlzLl92WzE1XSA9IG0zMztcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENvcGllcyBhbGwgY29tcG9uZW50cyBmcm9tIGFub3RoZXIgbWF0cml4IHRvIHRoaXMgbWF0cml4LlxuICAgKlxuICAgKiBAcGFyYW0gbWF0IC0gVGhlIHNvdXJjZSBtYXRyaXggdG8gY29weSBmcm9tXG4gICAqIEByZXR1cm5zIFRoaXMgbWF0cml4IGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIGNvcHlDb21wb25lbnRzKG1hdDogSU1hdHJpeDQ0KTogTXV0YWJsZU1hdHJpeDQ0IHtcbiAgICB0aGlzLl92WzBdID0gbWF0Ll92WzBdO1xuICAgIHRoaXMuX3ZbNF0gPSBtYXQuX3ZbNF07XG4gICAgdGhpcy5fdls4XSA9IG1hdC5fdls4XTtcbiAgICB0aGlzLl92WzEyXSA9IG1hdC5fdlsxMl07XG4gICAgdGhpcy5fdlsxXSA9IG1hdC5fdlsxXTtcbiAgICB0aGlzLl92WzVdID0gbWF0Ll92WzVdO1xuICAgIHRoaXMuX3ZbOV0gPSBtYXQuX3ZbOV07XG4gICAgdGhpcy5fdlsxM10gPSBtYXQuX3ZbMTNdO1xuICAgIHRoaXMuX3ZbMl0gPSBtYXQuX3ZbMl07XG4gICAgdGhpcy5fdls2XSA9IG1hdC5fdls2XTtcbiAgICB0aGlzLl92WzEwXSA9IG1hdC5fdlsxMF07XG4gICAgdGhpcy5fdlsxNF0gPSBtYXQuX3ZbMTRdO1xuICAgIHRoaXMuX3ZbM10gPSBtYXQuX3ZbM107XG4gICAgdGhpcy5fdls3XSA9IG1hdC5fdls3XTtcbiAgICB0aGlzLl92WzExXSA9IG1hdC5fdlsxMV07XG4gICAgdGhpcy5fdlsxNV0gPSBtYXQuX3ZbMTVdO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGlzIG1hdHJpeCB0byB0aGUgemVybyBtYXRyaXggKGFsbCBlbGVtZW50cyBhcmUgMCkuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoaXMgbWF0cml4IGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIHplcm8oKTogTXV0YWJsZU1hdHJpeDQ0IHtcbiAgICByZXR1cm4gdGhpcy5zZXRDb21wb25lbnRzKDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDApO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhpcyBtYXRyaXggdG8gdGhlIGlkZW50aXR5IG1hdHJpeC5cbiAgICpcbiAgICogQHJldHVybnMgVGhpcyBtYXRyaXggaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgaWRlbnRpdHkoKTogTXV0YWJsZU1hdHJpeDQ0IHtcbiAgICByZXR1cm4gdGhpcy5zZXRDb21wb25lbnRzKDEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpO1xuICB9XG5cbiAgX3N3YXAobDogSW5kZXgsIHI6IEluZGV4KTogdm9pZCB7XG4gICAgY29uc3QgdGVtcCA9IHRoaXMuX3ZbbF07XG4gICAgdGhpcy5fdltsXSA9IHRoaXMuX3Zbcl07XG4gICAgdGhpcy5fdltyXSA9IHRlbXA7XG4gIH1cblxuICAvKipcbiAgICogVHJhbnNwb3NlcyB0aGlzIG1hdHJpeCBpbiBwbGFjZSAoc3dhcHMgcm93cyBhbmQgY29sdW1ucykuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoaXMgbWF0cml4IGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIHRyYW5zcG9zZSgpOiBNdXRhYmxlTWF0cml4NDQge1xuICAgIHRoaXMuX3N3YXAoMSwgNCk7XG4gICAgdGhpcy5fc3dhcCgyLCA4KTtcbiAgICB0aGlzLl9zd2FwKDMsIDEyKTtcbiAgICB0aGlzLl9zd2FwKDYsIDkpO1xuICAgIHRoaXMuX3N3YXAoNywgMTMpO1xuICAgIHRoaXMuX3N3YXAoMTEsIDE0KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGVtcHRzIHRvIGludmVydCB0aGlzIG1hdHJpeCBpbiBwbGFjZS5cbiAgICpcbiAgICogVGhlIG1hdHJpeCBpcyBsZWZ0IHVuY2hhbmdlZCB3aGVuIGl0IGlzIG51bWVyaWNhbGx5IHNpbmd1bGFyLCB3aGljaFxuICAgKiBsZXRzIGNhbGxlcnMga2VlcCB0aGUgcHJldmlvdXMgdmFsaWQgdmFsdWUuXG4gICAqXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIGludmVyc2lvbiBzdWNjZWVkZWQsIGZhbHNlIGlmIHRoZSBtYXRyaXggaXMgc2luZ3VsYXJcbiAgICovXG4gIHRyeUludmVydCgpOiBib29sZWFuIHtcbiAgICBjb25zdCBuMDAgPSB0aGlzLl92WzBdICogdGhpcy5fdls1XSAtIHRoaXMuX3ZbNF0gKiB0aGlzLl92WzFdO1xuICAgIGNvbnN0IG4wMSA9IHRoaXMuX3ZbMF0gKiB0aGlzLl92WzldIC0gdGhpcy5fdls4XSAqIHRoaXMuX3ZbMV07XG4gICAgY29uc3QgbjAyID0gdGhpcy5fdlswXSAqIHRoaXMuX3ZbMTNdIC0gdGhpcy5fdlsxMl0gKiB0aGlzLl92WzFdO1xuICAgIGNvbnN0IG4wMyA9IHRoaXMuX3ZbNF0gKiB0aGlzLl92WzldIC0gdGhpcy5fdls4XSAqIHRoaXMuX3ZbNV07XG4gICAgY29uc3QgbjA0ID0gdGhpcy5fdls0XSAqIHRoaXMuX3ZbMTNdIC0gdGhpcy5fdlsxMl0gKiB0aGlzLl92WzVdO1xuICAgIGNvbnN0IG4wNSA9IHRoaXMuX3ZbOF0gKiB0aGlzLl92WzEzXSAtIHRoaXMuX3ZbMTJdICogdGhpcy5fdls5XTtcbiAgICBjb25zdCBuMDYgPSB0aGlzLl92WzJdICogdGhpcy5fdls3XSAtIHRoaXMuX3ZbNl0gKiB0aGlzLl92WzNdO1xuICAgIGNvbnN0IG4wNyA9IHRoaXMuX3ZbMl0gKiB0aGlzLl92WzExXSAtIHRoaXMuX3ZbMTBdICogdGhpcy5fdlszXTtcbiAgICBjb25zdCBuMDggPSB0aGlzLl92WzJdICogdGhpcy5fdlsxNV0gLSB0aGlzLl92WzE0XSAqIHRoaXMuX3ZbM107XG4gICAgY29uc3QgbjA5ID0gdGhpcy5fdls2XSAqIHRoaXMuX3ZbMTFdIC0gdGhpcy5fdlsxMF0gKiB0aGlzLl92WzddO1xuICAgIGNvbnN0IG4xMCA9IHRoaXMuX3ZbNl0gKiB0aGlzLl92WzE1XSAtIHRoaXMuX3ZbMTRdICogdGhpcy5fdls3XTtcbiAgICBjb25zdCBuMTEgPSB0aGlzLl92WzEwXSAqIHRoaXMuX3ZbMTVdIC0gdGhpcy5fdlsxNF0gKiB0aGlzLl92WzExXTtcblxuICAgIGNvbnN0IGRldCA9IG4wMCAqIG4xMSAtIG4wMSAqIG4xMCArIG4wMiAqIG4wOSArIG4wMyAqIG4wOCAtIG4wNCAqIG4wNyArIG4wNSAqIG4wNjtcblxuICAgIGNvbnN0IHJvd05vcm0wID0gTWF0aC5hYnModGhpcy5fdlswXSkgKyBNYXRoLmFicyh0aGlzLl92WzFdKSArIE1hdGguYWJzKHRoaXMuX3ZbMl0pICsgTWF0aC5hYnModGhpcy5fdlszXSk7XG4gICAgY29uc3Qgcm93Tm9ybTEgPSBNYXRoLmFicyh0aGlzLl92WzRdKSArIE1hdGguYWJzKHRoaXMuX3ZbNV0pICsgTWF0aC5hYnModGhpcy5fdls2XSkgKyBNYXRoLmFicyh0aGlzLl92WzddKTtcbiAgICBjb25zdCByb3dOb3JtMiA9IE1hdGguYWJzKHRoaXMuX3ZbOF0pICsgTWF0aC5hYnModGhpcy5fdls5XSkgKyBNYXRoLmFicyh0aGlzLl92WzEwXSkgKyBNYXRoLmFicyh0aGlzLl92WzExXSk7XG4gICAgY29uc3Qgcm93Tm9ybTMgPSBNYXRoLmFicyh0aGlzLl92WzEyXSkgKyBNYXRoLmFicyh0aGlzLl92WzEzXSkgKyBNYXRoLmFicyh0aGlzLl92WzE0XSkgKyBNYXRoLmFicyh0aGlzLl92WzE1XSk7XG4gICAgaWYgKFxuICAgICAgTWF0aFV0aWwuaXNTaW5ndWxhckRldChcbiAgICAgICAgZGV0LFxuICAgICAgICByb3dOb3JtMCAqIHJvd05vcm0xICogcm93Tm9ybTIgKiByb3dOb3JtMyxcbiAgICAgICAgTWF0aFV0aWwuZ2V0U2luZ3VsYXJFcHNpbG9uKHRoaXMuX3YuQllURVNfUEVSX0VMRU1FTlQpXG4gICAgICApXG4gICAgKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgbTAwID0gKHRoaXMuX3ZbNV0gKiBuMTEgLSB0aGlzLl92WzldICogbjEwICsgdGhpcy5fdlsxM10gKiBuMDkpIC8gZGV0O1xuICAgIGNvbnN0IG0wMSA9ICh0aGlzLl92WzhdICogbjEwIC0gdGhpcy5fdls0XSAqIG4xMSAtIHRoaXMuX3ZbMTJdICogbjA5KSAvIGRldDtcbiAgICBjb25zdCBtMDIgPSAodGhpcy5fdls3XSAqIG4wNSAtIHRoaXMuX3ZbMTFdICogbjA0ICsgdGhpcy5fdlsxNV0gKiBuMDMpIC8gZGV0O1xuICAgIGNvbnN0IG0wMyA9ICh0aGlzLl92WzEwXSAqIG4wNCAtIHRoaXMuX3ZbNl0gKiBuMDUgLSB0aGlzLl92WzE0XSAqIG4wMykgLyBkZXQ7XG4gICAgY29uc3QgbTEwID0gKHRoaXMuX3ZbOV0gKiBuMDggLSB0aGlzLl92WzFdICogbjExIC0gdGhpcy5fdlsxM10gKiBuMDcpIC8gZGV0O1xuICAgIGNvbnN0IG0xMSA9ICh0aGlzLl92WzBdICogbjExIC0gdGhpcy5fdls4XSAqIG4wOCArIHRoaXMuX3ZbMTJdICogbjA3KSAvIGRldDtcbiAgICBjb25zdCBtMTIgPSAodGhpcy5fdlsxMV0gKiBuMDIgLSB0aGlzLl92WzNdICogbjA1IC0gdGhpcy5fdlsxNV0gKiBuMDEpIC8gZGV0O1xuICAgIGNvbnN0IG0xMyA9ICh0aGlzLl92WzJdICogbjA1IC0gdGhpcy5fdlsxMF0gKiBuMDIgKyB0aGlzLl92WzE0XSAqIG4wMSkgLyBkZXQ7XG4gICAgY29uc3QgbTIwID0gKHRoaXMuX3ZbMV0gKiBuMTAgLSB0aGlzLl92WzVdICogbjA4ICsgdGhpcy5fdlsxM10gKiBuMDYpIC8gZGV0O1xuICAgIGNvbnN0IG0yMSA9ICh0aGlzLl92WzRdICogbjA4IC0gdGhpcy5fdlswXSAqIG4xMCAtIHRoaXMuX3ZbMTJdICogbjA2KSAvIGRldDtcbiAgICBjb25zdCBtMjIgPSAodGhpcy5fdlszXSAqIG4wNCAtIHRoaXMuX3ZbN10gKiBuMDIgKyB0aGlzLl92WzE1XSAqIG4wMCkgLyBkZXQ7XG4gICAgY29uc3QgbTIzID0gKHRoaXMuX3ZbNl0gKiBuMDIgLSB0aGlzLl92WzJdICogbjA0IC0gdGhpcy5fdlsxNF0gKiBuMDApIC8gZGV0O1xuICAgIGNvbnN0IG0zMCA9ICh0aGlzLl92WzVdICogbjA3IC0gdGhpcy5fdlsxXSAqIG4wOSAtIHRoaXMuX3ZbOV0gKiBuMDYpIC8gZGV0O1xuICAgIGNvbnN0IG0zMSA9ICh0aGlzLl92WzBdICogbjA5IC0gdGhpcy5fdls0XSAqIG4wNyArIHRoaXMuX3ZbOF0gKiBuMDYpIC8gZGV0O1xuICAgIGNvbnN0IG0zMiA9ICh0aGlzLl92WzddICogbjAxIC0gdGhpcy5fdlszXSAqIG4wMyAtIHRoaXMuX3ZbMTFdICogbjAwKSAvIGRldDtcbiAgICBjb25zdCBtMzMgPSAodGhpcy5fdlsyXSAqIG4wMyAtIHRoaXMuX3ZbNl0gKiBuMDEgKyB0aGlzLl92WzEwXSAqIG4wMCkgLyBkZXQ7XG5cbiAgICB0aGlzLnNldENvbXBvbmVudHMobTAwLCBtMDEsIG0wMiwgbTAzLCBtMTAsIG0xMSwgbTEyLCBtMTMsIG0yMCwgbTIxLCBtMjIsIG0yMywgbTMwLCBtMzEsIG0zMiwgbTMzKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnZlcnRzIHRoaXMgbWF0cml4IGluIHBsYWNlLlxuICAgKlxuICAgKiBJZiB0aGUgbWF0cml4IGlzIG51bWVyaWNhbGx5IHNpbmd1bGFyLCBpdCBpcyBzZXQgdG8gdGhlIGlkZW50aXR5IG1hdHJpeFxuICAgKiBpbnN0ZWFkIG9mIGJlaW5nIGZpbGxlZCB3aXRoIGBJbmZpbml0eWAvYE5hTmAuXG4gICAqIFVzZSB7QGxpbmsgTXV0YWJsZU1hdHJpeDQ0LnRyeUludmVydH0gd2hlbiB0aGUgY2FsbGVyIG5lZWRzIHRvIGRldGVjdCB0aGUgZmFpbHVyZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhpcyBtYXRyaXggaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgaW52ZXJ0KCk6IE11dGFibGVNYXRyaXg0NCB7XG4gICAgaWYgKHRoaXMudHJ5SW52ZXJ0KCkpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCd0aGUgbWF0cml4IGlzIHNpbmd1bGFyIGFuZCBjYW5ub3QgYmUgaW52ZXJ0ZWQuIFJldHVybmluZyBhbiBpZGVudGl0eSBtYXRyaXggaW5zdGVhZC4nKTtcbiAgICByZXR1cm4gdGhpcy5pZGVudGl0eSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhpcyBtYXRyaXggdG8gYSB0cmFuc2xhdGlvbiBtYXRyaXggd2l0aCB0aGUgZ2l2ZW4gdmVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHRyYW5zbGF0aW9uIHZlY3RvclxuICAgKiBAcmV0dXJucyBUaGlzIG1hdHJpeCBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICB0cmFuc2xhdGUodmVjOiBJVmVjdG9yMyk6IE11dGFibGVNYXRyaXg0NCB7XG4gICAgcmV0dXJuIHRoaXMuc2V0Q29tcG9uZW50cygxLCAwLCAwLCB2ZWMuX3ZbMF0sIDAsIDEsIDAsIHZlYy5fdlsxXSwgMCwgMCwgMSwgdmVjLl92WzJdLCAwLCAwLCAwLCAxKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB0cmFuc2xhdGlvbiBjb21wb25lbnQgb2YgdGhpcyBtYXRyaXggd2l0aG91dCBhZmZlY3Rpbmcgb3RoZXIgY29tcG9uZW50cy5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSB0cmFuc2xhdGlvbiB2ZWN0b3IgdG8gc2V0XG4gICAqIEByZXR1cm5zIFRoaXMgbWF0cml4IGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIHB1dFRyYW5zbGF0ZSh2ZWM6IElWZWN0b3IzKTogTXV0YWJsZU1hdHJpeDQ0IHtcbiAgICB0aGlzLl92WzEyXSA9IHZlYy5fdlswXTtcbiAgICB0aGlzLl92WzEzXSA9IHZlYy5fdlsxXTtcbiAgICB0aGlzLl92WzE0XSA9IHZlYy5fdlsyXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoZSBnaXZlbiB2ZWN0b3IgdG8gdGhlIGN1cnJlbnQgdHJhbnNsYXRpb24gY29tcG9uZW50LlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHRyYW5zbGF0aW9uIHZlY3RvciB0byBhZGRcbiAgICogQHJldHVybnMgVGhpcyBtYXRyaXggaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgYWRkVHJhbnNsYXRlKHZlYzogSVZlY3RvcjMpOiBNdXRhYmxlTWF0cml4NDQge1xuICAgIHRoaXMuX3ZbMTJdICs9IHZlYy5fdlswXTtcbiAgICB0aGlzLl92WzEzXSArPSB2ZWMuX3ZbMV07XG4gICAgdGhpcy5fdlsxNF0gKz0gdmVjLl92WzJdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhpcyBtYXRyaXggdG8gYSByb3RhdGlvbiBtYXRyaXggYXJvdW5kIHRoZSBYLWF4aXMuXG4gICAqXG4gICAqIEBwYXJhbSByYWRpYW4gLSBUaGUgcm90YXRpb24gYW5nbGUgaW4gcmFkaWFuc1xuICAgKiBAcmV0dXJucyBUaGlzIG1hdHJpeCBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICByb3RhdGVYKHJhZGlhbjogbnVtYmVyKTogTXV0YWJsZU1hdHJpeDQ0IHtcbiAgICBjb25zdCBjb3MgPSBNYXRoLmNvcyhyYWRpYW4pO1xuICAgIGNvbnN0IHNpbiA9IE1hdGguc2luKHJhZGlhbik7XG4gICAgcmV0dXJuIHRoaXMuc2V0Q29tcG9uZW50cygxLCAwLCAwLCAwLCAwLCBjb3MsIC1zaW4sIDAsIDAsIHNpbiwgY29zLCAwLCAwLCAwLCAwLCAxKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoaXMgbWF0cml4IHRvIGEgcm90YXRpb24gbWF0cml4IGFyb3VuZCB0aGUgWS1heGlzLlxuICAgKlxuICAgKiBAcGFyYW0gcmFkaWFuIC0gVGhlIHJvdGF0aW9uIGFuZ2xlIGluIHJhZGlhbnNcbiAgICogQHJldHVybnMgVGhpcyBtYXRyaXggaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgcm90YXRlWShyYWRpYW46IG51bWJlcik6IE11dGFibGVNYXRyaXg0NCB7XG4gICAgY29uc3QgY29zID0gTWF0aC5jb3MocmFkaWFuKTtcbiAgICBjb25zdCBzaW4gPSBNYXRoLnNpbihyYWRpYW4pO1xuICAgIHJldHVybiB0aGlzLnNldENvbXBvbmVudHMoY29zLCAwLCBzaW4sIDAsIDAsIDEsIDAsIDAsIC1zaW4sIDAsIGNvcywgMCwgMCwgMCwgMCwgMSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGlzIG1hdHJpeCB0byBhIHJvdGF0aW9uIG1hdHJpeCBhcm91bmQgdGhlIFotYXhpcy5cbiAgICpcbiAgICogQHBhcmFtIHJhZGlhbiAtIFRoZSByb3RhdGlvbiBhbmdsZSBpbiByYWRpYW5zXG4gICAqIEByZXR1cm5zIFRoaXMgbWF0cml4IGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIHJvdGF0ZVoocmFkaWFuOiBudW1iZXIpOiBNdXRhYmxlTWF0cml4NDQge1xuICAgIGNvbnN0IGNvcyA9IE1hdGguY29zKHJhZGlhbik7XG4gICAgY29uc3Qgc2luID0gTWF0aC5zaW4ocmFkaWFuKTtcbiAgICByZXR1cm4gdGhpcy5zZXRDb21wb25lbnRzKGNvcywgLXNpbiwgMCwgMCwgc2luLCBjb3MsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhpcyBtYXRyaXggdG8gYSByb3RhdGlvbiBtYXRyaXggd2l0aCByb3RhdGlvbnMgYXJvdW5kIFgsIFksIGFuZCBaIGF4ZXMgaW4gdGhhdCBvcmRlci5cbiAgICogVGhlIHJvdGF0aW9uIG9yZGVyIGlzOiBaICogWSAqIFggKGFwcGxpZWQgZnJvbSByaWdodCB0byBsZWZ0KS5cbiAgICpcbiAgICogQHBhcmFtIHggLSBSb3RhdGlvbiBhbmdsZSBhcm91bmQgWC1heGlzIGluIHJhZGlhbnNcbiAgICogQHBhcmFtIHkgLSBSb3RhdGlvbiBhbmdsZSBhcm91bmQgWS1heGlzIGluIHJhZGlhbnNcbiAgICogQHBhcmFtIHogLSBSb3RhdGlvbiBhbmdsZSBhcm91bmQgWi1heGlzIGluIHJhZGlhbnNcbiAgICogQHJldHVybnMgVGhpcyBtYXRyaXggaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgcm90YXRlWFlaKHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIpOiBNdXRhYmxlTWF0cml4NDQge1xuICAgIGNvbnN0IGNvc1ggPSBNYXRoLmNvcyh4KTtcbiAgICBjb25zdCBzaW5YID0gTWF0aC5zaW4oeCk7XG4gICAgY29uc3QgY29zWSA9IE1hdGguY29zKHkpO1xuICAgIGNvbnN0IHNpblkgPSBNYXRoLnNpbih5KTtcbiAgICBjb25zdCBjb3NaID0gTWF0aC5jb3Moeik7XG4gICAgY29uc3Qgc2luWiA9IE1hdGguc2luKHopO1xuXG4gICAgLy8gY29uc3QgeDAwID0gMTtcbiAgICAvLyBjb25zdCB4MDEgPSAwO1xuICAgIC8vIGNvbnN0IHgwMiA9IDA7XG4gICAgLy8gY29uc3QgeDEwID0gMDtcbiAgICBjb25zdCB4MTEgPSBjb3NYO1xuICAgIGNvbnN0IHgxMiA9IC1zaW5YO1xuICAgIC8vIGNvbnN0IHgyMCA9IDA7XG4gICAgY29uc3QgeDIxID0gc2luWDtcbiAgICBjb25zdCB4MjIgPSBjb3NYO1xuXG4gICAgY29uc3QgeTAwID0gY29zWTtcbiAgICAvLyBjb25zdCB5MDEgPSAwO1xuICAgIGNvbnN0IHkwMiA9IHNpblk7XG4gICAgLy8gY29uc3QgeTEwID0gMDtcbiAgICAvLyBjb25zdCB5MTEgPSAxO1xuICAgIC8vIGNvbnN0IHkxMiA9IDA7XG4gICAgY29uc3QgeTIwID0gLXNpblk7XG4gICAgLy8gY29uc3QgeTIxID0gMDtcbiAgICBjb25zdCB5MjIgPSBjb3NZO1xuXG4gICAgY29uc3QgejAwID0gY29zWjtcbiAgICBjb25zdCB6MDEgPSAtc2luWjtcbiAgICAvLyBjb25zdCB6MDIgPSAwO1xuICAgIGNvbnN0IHoxMCA9IHNpblo7XG4gICAgY29uc3QgejExID0gY29zWjtcbiAgICAvLyBjb25zdCB6MTIgPSAwO1xuICAgIC8vIGNvbnN0IHoyMCA9IDA7XG4gICAgLy8gY29uc3QgejIxID0gMDtcbiAgICAvLyBjb25zdCB6MjIgPSAxO1xuXG4gICAgLy8gWSAqIFhcbiAgICBjb25zdCB5eDAwID0geTAwO1xuICAgIGNvbnN0IHl4MDEgPSB5MDIgKiB4MjE7XG4gICAgY29uc3QgeXgwMiA9IHkwMiAqIHgyMjtcbiAgICAvL2NvbnN0IHl4MTAgPSAwO1xuICAgIGNvbnN0IHl4MTEgPSB4MTE7XG4gICAgY29uc3QgeXgxMiA9IHgxMjtcbiAgICBjb25zdCB5eDIwID0geTIwO1xuICAgIGNvbnN0IHl4MjEgPSB5MjIgKiB4MjE7XG4gICAgY29uc3QgeXgyMiA9IHkyMiAqIHgyMjtcblxuICAgIC8vIFogKiBZICogWFxuICAgIGNvbnN0IG0wMCA9IHowMCAqIHl4MDA7XG4gICAgY29uc3QgbTAxID0gejAwICogeXgwMSArIHowMSAqIHl4MTE7XG4gICAgY29uc3QgbTAyID0gejAwICogeXgwMiArIHowMSAqIHl4MTI7XG4gICAgY29uc3QgbTEwID0gejEwICogeXgwMDtcbiAgICBjb25zdCBtMTEgPSB6MTAgKiB5eDAxICsgejExICogeXgxMTtcbiAgICBjb25zdCBtMTIgPSB6MTAgKiB5eDAyICsgejExICogeXgxMjtcbiAgICBjb25zdCBtMjAgPSB5eDIwO1xuICAgIGNvbnN0IG0yMSA9IHl4MjE7XG4gICAgY29uc3QgbTIyID0geXgyMjtcblxuICAgIGNvbnN0IG0wMyA9IDA7XG4gICAgY29uc3QgbTEzID0gMDtcbiAgICBjb25zdCBtMjMgPSAwO1xuICAgIGNvbnN0IG0zMCA9IDA7XG4gICAgY29uc3QgbTMxID0gMDtcbiAgICBjb25zdCBtMzIgPSAwO1xuICAgIGNvbnN0IG0zMyA9IDE7XG5cbiAgICByZXR1cm4gdGhpcy5zZXRDb21wb25lbnRzKG0wMCwgbTAxLCBtMDIsIG0wMywgbTEwLCBtMTEsIG0xMiwgbTEzLCBtMjAsIG0yMSwgbTIyLCBtMjMsIG0zMCwgbTMxLCBtMzIsIG0zMyk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGlzIG1hdHJpeCB0byBhIHJvdGF0aW9uIG1hdHJpeCBmcm9tIGEgdmVjdG9yIGNvbnRhaW5pbmcgWCwgWSwgWiByb3RhdGlvbiBhbmdsZXMuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBWZWN0b3IgY29udGFpbmluZyByb3RhdGlvbiBhbmdsZXMgKHgsIHksIHopIGluIHJhZGlhbnNcbiAgICogQHJldHVybnMgVGhpcyBtYXRyaXggaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgcm90YXRlKHZlYzogSVZlY3RvcjMpOiBNdXRhYmxlTWF0cml4NDQge1xuICAgIHJldHVybiB0aGlzLnJvdGF0ZVhZWih2ZWMuX3ZbMF0sIHZlYy5fdlsxXSwgdmVjLl92WzJdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoaXMgbWF0cml4IHRvIGEgc2NhbGluZyBtYXRyaXggd2l0aCB0aGUgZ2l2ZW4gdmVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHNjYWxpbmcgZmFjdG9ycyBmb3IgWCwgWSwgYW5kIFogYXhlc1xuICAgKiBAcmV0dXJucyBUaGlzIG1hdHJpeCBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICBzY2FsZSh2ZWM6IElWZWN0b3IzKTogTXV0YWJsZU1hdHJpeDQ0IHtcbiAgICByZXR1cm4gdGhpcy5zZXRDb21wb25lbnRzKHZlYy5fdlswXSwgMCwgMCwgMCwgMCwgdmVjLl92WzFdLCAwLCAwLCAwLCAwLCB2ZWMuX3ZbMl0sIDAsIDAsIDAsIDAsIDEpO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgdGhlIHNjYWxpbmcgZmFjdG9ycyB0byB0aGUgY3VycmVudCBtYXRyaXguXG4gICAqIFRoaXMgYXBwbGllcyBzY2FsaW5nIHRyYW5zZm9ybWF0aW9uIHRvIGVhY2ggY29sdW1uIG9mIHRoZSBtYXRyaXguXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgc2NhbGluZyBmYWN0b3JzIGZvciBYLCBZLCBhbmQgWiBheGVzXG4gICAqIEByZXR1cm5zIFRoaXMgbWF0cml4IGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIG11bHRpcGx5U2NhbGUodmVjOiBJVmVjdG9yMyk6IE11dGFibGVNYXRyaXg0NCB7XG4gICAgdGhpcy5fdlswXSAqPSB2ZWMuX3ZbMF07XG4gICAgdGhpcy5fdls0XSAqPSB2ZWMuX3ZbMF07XG4gICAgdGhpcy5fdls4XSAqPSB2ZWMuX3ZbMF07XG4gICAgdGhpcy5fdlsxMl0gKj0gdmVjLl92WzBdO1xuXG4gICAgdGhpcy5fdlsxXSAqPSB2ZWMuX3ZbMV07XG4gICAgdGhpcy5fdls1XSAqPSB2ZWMuX3ZbMV07XG4gICAgdGhpcy5fdls5XSAqPSB2ZWMuX3ZbMV07XG4gICAgdGhpcy5fdlsxM10gKj0gdmVjLl92WzFdO1xuXG4gICAgdGhpcy5fdlsyXSAqPSB2ZWMuX3ZbMl07XG4gICAgdGhpcy5fdls2XSAqPSB2ZWMuX3ZbMl07XG4gICAgdGhpcy5fdlsxMF0gKj0gdmVjLl92WzJdO1xuICAgIHRoaXMuX3ZbMTRdICo9IHZlYy5fdlsyXTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgdGhpcyBtYXRyaXggYnkgYW5vdGhlciBtYXRyaXggZnJvbSB0aGUgcmlnaHQgc2lkZSAodGhpcyAqIG1hdCkuXG4gICAqIFRoaXMgb3BlcmF0aW9uIHRyYW5zZm9ybXMgdGhpcyBtYXRyaXggaW4gcGxhY2UuXG4gICAqXG4gICAqIEBwYXJhbSBtYXQgLSBUaGUgbWF0cml4IHRvIG11bHRpcGx5IGZyb20gdGhlIHJpZ2h0XG4gICAqIEByZXR1cm5zIFRoaXMgbWF0cml4IGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIG11bHRpcGx5KG1hdDogSU1hdHJpeDQ0KTogTXV0YWJsZU1hdHJpeDQ0IHtcbiAgICBpZiAobWF0LmlzSWRlbnRpdHlNYXRyaXhDbGFzcykge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGNvbnN0IG0wMCA9IHRoaXMuX3ZbMF0gKiBtYXQuX3ZbMF0gKyB0aGlzLl92WzRdICogbWF0Ll92WzFdICsgdGhpcy5fdls4XSAqIG1hdC5fdlsyXSArIHRoaXMuX3ZbMTJdICogbWF0Ll92WzNdO1xuICAgIGNvbnN0IG0wMSA9IHRoaXMuX3ZbMF0gKiBtYXQuX3ZbNF0gKyB0aGlzLl92WzRdICogbWF0Ll92WzVdICsgdGhpcy5fdls4XSAqIG1hdC5fdls2XSArIHRoaXMuX3ZbMTJdICogbWF0Ll92WzddO1xuICAgIGNvbnN0IG0wMiA9IHRoaXMuX3ZbMF0gKiBtYXQuX3ZbOF0gKyB0aGlzLl92WzRdICogbWF0Ll92WzldICsgdGhpcy5fdls4XSAqIG1hdC5fdlsxMF0gKyB0aGlzLl92WzEyXSAqIG1hdC5fdlsxMV07XG4gICAgY29uc3QgbTAzID0gdGhpcy5fdlswXSAqIG1hdC5fdlsxMl0gKyB0aGlzLl92WzRdICogbWF0Ll92WzEzXSArIHRoaXMuX3ZbOF0gKiBtYXQuX3ZbMTRdICsgdGhpcy5fdlsxMl0gKiBtYXQuX3ZbMTVdO1xuXG4gICAgY29uc3QgbTEwID0gdGhpcy5fdlsxXSAqIG1hdC5fdlswXSArIHRoaXMuX3ZbNV0gKiBtYXQuX3ZbMV0gKyB0aGlzLl92WzldICogbWF0Ll92WzJdICsgdGhpcy5fdlsxM10gKiBtYXQuX3ZbM107XG4gICAgY29uc3QgbTExID0gdGhpcy5fdlsxXSAqIG1hdC5fdls0XSArIHRoaXMuX3ZbNV0gKiBtYXQuX3ZbNV0gKyB0aGlzLl92WzldICogbWF0Ll92WzZdICsgdGhpcy5fdlsxM10gKiBtYXQuX3ZbN107XG4gICAgY29uc3QgbTEyID0gdGhpcy5fdlsxXSAqIG1hdC5fdls4XSArIHRoaXMuX3ZbNV0gKiBtYXQuX3ZbOV0gKyB0aGlzLl92WzldICogbWF0Ll92WzEwXSArIHRoaXMuX3ZbMTNdICogbWF0Ll92WzExXTtcbiAgICBjb25zdCBtMTMgPSB0aGlzLl92WzFdICogbWF0Ll92WzEyXSArIHRoaXMuX3ZbNV0gKiBtYXQuX3ZbMTNdICsgdGhpcy5fdls5XSAqIG1hdC5fdlsxNF0gKyB0aGlzLl92WzEzXSAqIG1hdC5fdlsxNV07XG5cbiAgICBjb25zdCBtMjAgPSB0aGlzLl92WzJdICogbWF0Ll92WzBdICsgdGhpcy5fdls2XSAqIG1hdC5fdlsxXSArIHRoaXMuX3ZbMTBdICogbWF0Ll92WzJdICsgdGhpcy5fdlsxNF0gKiBtYXQuX3ZbM107XG4gICAgY29uc3QgbTIxID0gdGhpcy5fdlsyXSAqIG1hdC5fdls0XSArIHRoaXMuX3ZbNl0gKiBtYXQuX3ZbNV0gKyB0aGlzLl92WzEwXSAqIG1hdC5fdls2XSArIHRoaXMuX3ZbMTRdICogbWF0Ll92WzddO1xuICAgIGNvbnN0IG0yMiA9IHRoaXMuX3ZbMl0gKiBtYXQuX3ZbOF0gKyB0aGlzLl92WzZdICogbWF0Ll92WzldICsgdGhpcy5fdlsxMF0gKiBtYXQuX3ZbMTBdICsgdGhpcy5fdlsxNF0gKiBtYXQuX3ZbMTFdO1xuICAgIGNvbnN0IG0yMyA9IHRoaXMuX3ZbMl0gKiBtYXQuX3ZbMTJdICsgdGhpcy5fdls2XSAqIG1hdC5fdlsxM10gKyB0aGlzLl92WzEwXSAqIG1hdC5fdlsxNF0gKyB0aGlzLl92WzE0XSAqIG1hdC5fdlsxNV07XG5cbiAgICBjb25zdCBtMzAgPSB0aGlzLl92WzNdICogbWF0Ll92WzBdICsgdGhpcy5fdls3XSAqIG1hdC5fdlsxXSArIHRoaXMuX3ZbMTFdICogbWF0Ll92WzJdICsgdGhpcy5fdlsxNV0gKiBtYXQuX3ZbM107XG4gICAgY29uc3QgbTMxID0gdGhpcy5fdlszXSAqIG1hdC5fdls0XSArIHRoaXMuX3ZbN10gKiBtYXQuX3ZbNV0gKyB0aGlzLl92WzExXSAqIG1hdC5fdls2XSArIHRoaXMuX3ZbMTVdICogbWF0Ll92WzddO1xuICAgIGNvbnN0IG0zMiA9IHRoaXMuX3ZbM10gKiBtYXQuX3ZbOF0gKyB0aGlzLl92WzddICogbWF0Ll92WzldICsgdGhpcy5fdlsxMV0gKiBtYXQuX3ZbMTBdICsgdGhpcy5fdlsxNV0gKiBtYXQuX3ZbMTFdO1xuICAgIGNvbnN0IG0zMyA9IHRoaXMuX3ZbM10gKiBtYXQuX3ZbMTJdICsgdGhpcy5fdls3XSAqIG1hdC5fdlsxM10gKyB0aGlzLl92WzExXSAqIG1hdC5fdlsxNF0gKyB0aGlzLl92WzE1XSAqIG1hdC5fdlsxNV07XG5cbiAgICByZXR1cm4gdGhpcy5zZXRDb21wb25lbnRzKG0wMCwgbTAxLCBtMDIsIG0wMywgbTEwLCBtMTEsIG0xMiwgbTEzLCBtMjAsIG0yMSwgbTIyLCBtMjMsIG0zMCwgbTMxLCBtMzIsIG0zMyk7XG4gIH1cblxuICAvKipcbiAgICogTXVsdGlwbGllcyB0aGlzIG1hdHJpeCBieSBhbm90aGVyIG1hdHJpeCBmcm9tIHRoZSBsZWZ0IHNpZGUgKG1hdCAqIHRoaXMpLlxuICAgKiBUaGlzIG9wZXJhdGlvbiB0cmFuc2Zvcm1zIHRoaXMgbWF0cml4IGluIHBsYWNlLlxuICAgKlxuICAgKiBAcGFyYW0gbWF0IC0gVGhlIG1hdHJpeCB0byBtdWx0aXBseSBmcm9tIHRoZSBsZWZ0XG4gICAqIEByZXR1cm5zIFRoaXMgbWF0cml4IGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIG11bHRpcGx5QnlMZWZ0KG1hdDogSU1hdHJpeDQ0KTogTXV0YWJsZU1hdHJpeDQ0IHtcbiAgICBpZiAobWF0LmlzSWRlbnRpdHlNYXRyaXhDbGFzcykge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGNvbnN0IG0wMCA9IG1hdC5fdlswXSAqIHRoaXMuX3ZbMF0gKyBtYXQuX3ZbNF0gKiB0aGlzLl92WzFdICsgbWF0Ll92WzhdICogdGhpcy5fdlsyXSArIG1hdC5fdlsxMl0gKiB0aGlzLl92WzNdO1xuICAgIGNvbnN0IG0wMSA9IG1hdC5fdlswXSAqIHRoaXMuX3ZbNF0gKyBtYXQuX3ZbNF0gKiB0aGlzLl92WzVdICsgbWF0Ll92WzhdICogdGhpcy5fdls2XSArIG1hdC5fdlsxMl0gKiB0aGlzLl92WzddO1xuICAgIGNvbnN0IG0wMiA9IG1hdC5fdlswXSAqIHRoaXMuX3ZbOF0gKyBtYXQuX3ZbNF0gKiB0aGlzLl92WzldICsgbWF0Ll92WzhdICogdGhpcy5fdlsxMF0gKyBtYXQuX3ZbMTJdICogdGhpcy5fdlsxMV07XG4gICAgY29uc3QgbTAzID0gbWF0Ll92WzBdICogdGhpcy5fdlsxMl0gKyBtYXQuX3ZbNF0gKiB0aGlzLl92WzEzXSArIG1hdC5fdls4XSAqIHRoaXMuX3ZbMTRdICsgbWF0Ll92WzEyXSAqIHRoaXMuX3ZbMTVdO1xuXG4gICAgY29uc3QgbTEwID0gbWF0Ll92WzFdICogdGhpcy5fdlswXSArIG1hdC5fdls1XSAqIHRoaXMuX3ZbMV0gKyBtYXQuX3ZbOV0gKiB0aGlzLl92WzJdICsgbWF0Ll92WzEzXSAqIHRoaXMuX3ZbM107XG4gICAgY29uc3QgbTExID0gbWF0Ll92WzFdICogdGhpcy5fdls0XSArIG1hdC5fdls1XSAqIHRoaXMuX3ZbNV0gKyBtYXQuX3ZbOV0gKiB0aGlzLl92WzZdICsgbWF0Ll92WzEzXSAqIHRoaXMuX3ZbN107XG4gICAgY29uc3QgbTEyID0gbWF0Ll92WzFdICogdGhpcy5fdls4XSArIG1hdC5fdls1XSAqIHRoaXMuX3ZbOV0gKyBtYXQuX3ZbOV0gKiB0aGlzLl92WzEwXSArIG1hdC5fdlsxM10gKiB0aGlzLl92WzExXTtcbiAgICBjb25zdCBtMTMgPSBtYXQuX3ZbMV0gKiB0aGlzLl92WzEyXSArIG1hdC5fdls1XSAqIHRoaXMuX3ZbMTNdICsgbWF0Ll92WzldICogdGhpcy5fdlsxNF0gKyBtYXQuX3ZbMTNdICogdGhpcy5fdlsxNV07XG5cbiAgICBjb25zdCBtMjAgPSBtYXQuX3ZbMl0gKiB0aGlzLl92WzBdICsgbWF0Ll92WzZdICogdGhpcy5fdlsxXSArIG1hdC5fdlsxMF0gKiB0aGlzLl92WzJdICsgbWF0Ll92WzE0XSAqIHRoaXMuX3ZbM107XG4gICAgY29uc3QgbTIxID0gbWF0Ll92WzJdICogdGhpcy5fdls0XSArIG1hdC5fdls2XSAqIHRoaXMuX3ZbNV0gKyBtYXQuX3ZbMTBdICogdGhpcy5fdls2XSArIG1hdC5fdlsxNF0gKiB0aGlzLl92WzddO1xuICAgIGNvbnN0IG0yMiA9IG1hdC5fdlsyXSAqIHRoaXMuX3ZbOF0gKyBtYXQuX3ZbNl0gKiB0aGlzLl92WzldICsgbWF0Ll92WzEwXSAqIHRoaXMuX3ZbMTBdICsgbWF0Ll92WzE0XSAqIHRoaXMuX3ZbMTFdO1xuICAgIGNvbnN0IG0yMyA9IG1hdC5fdlsyXSAqIHRoaXMuX3ZbMTJdICsgbWF0Ll92WzZdICogdGhpcy5fdlsxM10gKyBtYXQuX3ZbMTBdICogdGhpcy5fdlsxNF0gKyBtYXQuX3ZbMTRdICogdGhpcy5fdlsxNV07XG5cbiAgICBjb25zdCBtMzAgPSBtYXQuX3ZbM10gKiB0aGlzLl92WzBdICsgbWF0Ll92WzddICogdGhpcy5fdlsxXSArIG1hdC5fdlsxMV0gKiB0aGlzLl92WzJdICsgbWF0Ll92WzE1XSAqIHRoaXMuX3ZbM107XG4gICAgY29uc3QgbTMxID0gbWF0Ll92WzNdICogdGhpcy5fdls0XSArIG1hdC5fdls3XSAqIHRoaXMuX3ZbNV0gKyBtYXQuX3ZbMTFdICogdGhpcy5fdls2XSArIG1hdC5fdlsxNV0gKiB0aGlzLl92WzddO1xuICAgIGNvbnN0IG0zMiA9IG1hdC5fdlszXSAqIHRoaXMuX3ZbOF0gKyBtYXQuX3ZbN10gKiB0aGlzLl92WzldICsgbWF0Ll92WzExXSAqIHRoaXMuX3ZbMTBdICsgbWF0Ll92WzE1XSAqIHRoaXMuX3ZbMTFdO1xuICAgIGNvbnN0IG0zMyA9IG1hdC5fdlszXSAqIHRoaXMuX3ZbMTJdICsgbWF0Ll92WzddICogdGhpcy5fdlsxM10gKyBtYXQuX3ZbMTFdICogdGhpcy5fdlsxNF0gKyBtYXQuX3ZbMTVdICogdGhpcy5fdlsxNV07XG5cbiAgICByZXR1cm4gdGhpcy5zZXRDb21wb25lbnRzKG0wMCwgbTAxLCBtMDIsIG0wMywgbTEwLCBtMTEsIG0xMiwgbTEzLCBtMjAsIG0yMSwgbTIyLCBtMjMsIG0zMCwgbTMxLCBtMzIsIG0zMyk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGlzIG1hdHJpeCB0byBhIHJvdGF0aW9uIG1hdHJpeCBiYXNlZCBvbiB0aGUgZ2l2ZW4gcXVhdGVybmlvbi5cbiAgICpcbiAgICogQHBhcmFtIHF1YXQgLSBUaGUgcXVhdGVybmlvbiB0byBjb252ZXJ0IHRvIGEgcm90YXRpb24gbWF0cml4XG4gICAqIEByZXR1cm5zIFRoaXMgbWF0cml4IGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIGZyb21RdWF0ZXJuaW9uKHF1YXQ6IElRdWF0ZXJuaW9uKTogTXV0YWJsZU1hdHJpeDQ0IHtcbiAgICBjb25zdCBzeCA9IHF1YXQuX3ZbMF0gKiBxdWF0Ll92WzBdO1xuICAgIGNvbnN0IHN5ID0gcXVhdC5fdlsxXSAqIHF1YXQuX3ZbMV07XG4gICAgY29uc3Qgc3ogPSBxdWF0Ll92WzJdICogcXVhdC5fdlsyXTtcbiAgICBjb25zdCBjeCA9IHF1YXQuX3ZbMV0gKiBxdWF0Ll92WzJdO1xuICAgIGNvbnN0IGN5ID0gcXVhdC5fdlswXSAqIHF1YXQuX3ZbMl07XG4gICAgY29uc3QgY3ogPSBxdWF0Ll92WzBdICogcXVhdC5fdlsxXTtcbiAgICBjb25zdCB3eCA9IHF1YXQuX3ZbM10gKiBxdWF0Ll92WzBdO1xuICAgIGNvbnN0IHd5ID0gcXVhdC5fdlszXSAqIHF1YXQuX3ZbMV07XG4gICAgY29uc3Qgd3ogPSBxdWF0Ll92WzNdICogcXVhdC5fdlsyXTtcblxuICAgIGNvbnN0IG0wMCA9IDEuMCAtIDIuMCAqIChzeSArIHN6KTtcbiAgICBjb25zdCBtMDEgPSAyLjAgKiAoY3ogLSB3eik7XG4gICAgY29uc3QgbTAyID0gMi4wICogKGN5ICsgd3kpO1xuICAgIGNvbnN0IG0wMyA9IDA7XG4gICAgY29uc3QgbTEwID0gMi4wICogKGN6ICsgd3opO1xuICAgIGNvbnN0IG0xMSA9IDEuMCAtIDIuMCAqIChzeCArIHN6KTtcbiAgICBjb25zdCBtMTIgPSAyLjAgKiAoY3ggLSB3eCk7XG4gICAgY29uc3QgbTEzID0gMDtcbiAgICBjb25zdCBtMjAgPSAyLjAgKiAoY3kgLSB3eSk7XG4gICAgY29uc3QgbTIxID0gMi4wICogKGN4ICsgd3gpO1xuICAgIGNvbnN0IG0yMiA9IDEuMCAtIDIuMCAqIChzeCArIHN5KTtcbiAgICBjb25zdCBtMjMgPSAwO1xuICAgIGNvbnN0IG0zMCA9IDA7XG4gICAgY29uc3QgbTMxID0gMDtcbiAgICBjb25zdCBtMzIgPSAwO1xuICAgIGNvbnN0IG0zMyA9IDE7XG5cbiAgICByZXR1cm4gdGhpcy5zZXRDb21wb25lbnRzKG0wMCwgbTAxLCBtMDIsIG0wMywgbTEwLCBtMTEsIG0xMiwgbTEzLCBtMjAsIG0yMSwgbTIyLCBtMjMsIG0zMCwgbTMxLCBtMzIsIG0zMyk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE11dGFibGVNYXRyaXg0NCBleHRlbmRzIE11dGFibGVNYXRyaXg0NF88RmxvYXQzMkFycmF5Q29uc3RydWN0b3I+IHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgTXV0YWJsZU1hdHJpeDQ0IGluc3RhbmNlLlxuICAgKiBAcGFyYW0gbSAtIFRoZSB0eXBlZCBhcnJheSBjb250YWluaW5nIHRoZSBtYXRyaXggY29tcG9uZW50c1xuICAgKi9cbiAgY29uc3RydWN0b3IobTogVHlwZWRBcnJheSkge1xuICAgIHN1cGVyKG0sIHsgdHlwZTogRmxvYXQzMkFycmF5IH0pO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSB6ZXJvIG1hdHJpeC4gKi9cbiAgc3RhdGljIHplcm8oKTogTXV0YWJsZU1hdHJpeDQ0IHtcbiAgICByZXR1cm4gc3VwZXIuX3plcm8oRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlTWF0cml4NDQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhbiBpZGVudGl0eSBtYXRyaXggKG9wdGltaXplZCBJZGVudGl0eU1hdHJpeDQ0IGluc3RhbmNlKS4gKi9cbiAgc3RhdGljIGlkZW50aXR5KCk6IE11dGFibGVNYXRyaXg0NCB7XG4gICAgcmV0dXJuIHN1cGVyLl9pZGVudGl0eShGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXg0NDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgZHVtbXkgbWF0cml4IHdpdGggYW4gZW1wdHkgYXJyYXkuICovXG4gIHN0YXRpYyBkdW1teSgpOiBNdXRhYmxlTWF0cml4NDQge1xuICAgIHJldHVybiBzdXBlci5fZHVtbXkoRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlTWF0cml4NDQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyB0aGUgdHJhbnNwb3NlIG9mIHRoZSBnaXZlbiBtYXRyaXguICovXG4gIHN0YXRpYyB0cmFuc3Bvc2UobWF0OiBJTWF0cml4NDQpOiBNdXRhYmxlTWF0cml4NDQge1xuICAgIHJldHVybiBzdXBlci5fdHJhbnNwb3NlKG1hdCwgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlTWF0cml4NDQ7XG4gIH1cblxuICAvKiogQXR0ZW1wdHMgdG8gaW52ZXJ0IHRoZSBnaXZlbiBtYXRyaXgsIHJldHVybmluZyBudWxsIHdoZW4gaXQgaXMgc2luZ3VsYXIuICovXG4gIHN0YXRpYyB0cnlJbnZlcnQobWF0OiBJTWF0cml4NDQpOiBNdXRhYmxlTWF0cml4NDQgfCBudWxsIHtcbiAgICByZXR1cm4gc3VwZXIuX3RyeUludmVydChtYXQsIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDQ0IHwgbnVsbDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIHRoZSBpbnZlcnNlIG9mIHRoZSBnaXZlbiBtYXRyaXggKGlkZW50aXR5IHdoZW4gc2luZ3VsYXIpLiAqL1xuICBzdGF0aWMgaW52ZXJ0KG1hdDogSU1hdHJpeDQ0KTogTXV0YWJsZU1hdHJpeDQ0IHtcbiAgICByZXR1cm4gc3VwZXIuX2ludmVydChtYXQsIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDQ0O1xuICB9XG5cbiAgLyoqIEF0dGVtcHRzIHRvIGludmVydCB0aGUgZ2l2ZW4gbWF0cml4IGludG8gb3V0TWF0LiAqL1xuICBzdGF0aWMgdHJ5SW52ZXJ0VG88VCBleHRlbmRzIElNdXRhYmxlTWF0cml4NDQ+KG1hdDogSU1hdHJpeDQ0LCBvdXRNYXQ6IFQpOiBib29sZWFuIHtcbiAgICByZXR1cm4gc3VwZXIuX3RyeUludmVydFRvKG1hdCwgb3V0TWF0KTtcbiAgfVxuXG4gIC8qKiBJbnZlcnRzIHRoZSBnaXZlbiBtYXRyaXggaW50byBvdXRNYXQgKGlkZW50aXR5IHdoZW4gc2luZ3VsYXIpLiAqL1xuICBzdGF0aWMgaW52ZXJ0VG88VCBleHRlbmRzIElNdXRhYmxlTWF0cml4NDQ+KG1hdDogSU1hdHJpeDQ0LCBvdXRNYXQ6IFQpOiBUIHtcbiAgICByZXR1cm4gc3VwZXIuX2ludmVydFRvKG1hdCwgb3V0TWF0KSBhcyBUO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSB0cmFuc2xhdGlvbiBtYXRyaXguICovXG4gIHN0YXRpYyB0cmFuc2xhdGUodmVjOiBJVmVjdG9yMyk6IE11dGFibGVNYXRyaXg0NCB7XG4gICAgcmV0dXJuIHN1cGVyLl90cmFuc2xhdGUodmVjLCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXg0NDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgcm90YXRpb24gbWF0cml4IGFyb3VuZCB0aGUgWC1heGlzLiAqL1xuICBzdGF0aWMgcm90YXRlWChyYWRpYW46IG51bWJlcik6IE11dGFibGVNYXRyaXg0NCB7XG4gICAgcmV0dXJuIHN1cGVyLl9yb3RhdGVYKHJhZGlhbiwgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlTWF0cml4NDQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIHJvdGF0aW9uIG1hdHJpeCBhcm91bmQgdGhlIFktYXhpcy4gKi9cbiAgc3RhdGljIHJvdGF0ZVkocmFkaWFuOiBudW1iZXIpOiBNdXRhYmxlTWF0cml4NDQge1xuICAgIHJldHVybiBzdXBlci5fcm90YXRlWShyYWRpYW4sIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDQ0O1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSByb3RhdGlvbiBtYXRyaXggYXJvdW5kIHRoZSBaLWF4aXMuICovXG4gIHN0YXRpYyByb3RhdGVaKHJhZGlhbjogbnVtYmVyKTogTXV0YWJsZU1hdHJpeDQ0IHtcbiAgICByZXR1cm4gc3VwZXIuX3JvdGF0ZVoocmFkaWFuLCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXg0NDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgcm90YXRpb24gbWF0cml4IGZyb20gRXVsZXIgYW5nbGVzIGluIFhZWiBvcmRlci4gKi9cbiAgc3RhdGljIHJvdGF0ZVhZWih4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyKTogTXV0YWJsZU1hdHJpeDQ0IHtcbiAgICByZXR1cm4gc3VwZXIuX3JvdGF0ZVhZWih4LCB5LCB6LCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXg0NDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgcm90YXRpb24gbWF0cml4IGZyb20gYSB2ZWN0b3IgY29udGFpbmluZyBFdWxlciBhbmdsZXMuICovXG4gIHN0YXRpYyByb3RhdGUodmVjOiBJVmVjdG9yMyk6IE11dGFibGVNYXRyaXg0NCB7XG4gICAgcmV0dXJuIHN1cGVyLl9yb3RhdGUodmVjLCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXg0NDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgc2NhbGluZyBtYXRyaXguICovXG4gIHN0YXRpYyBzY2FsZSh2ZWM6IElWZWN0b3IzKTogTXV0YWJsZU1hdHJpeDQ0IHtcbiAgICByZXR1cm4gc3VwZXIuX3NjYWxlKHZlYywgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlTWF0cml4NDQ7XG4gIH1cblxuICAvKiogTXVsdGlwbGllcyB0d28gbWF0cmljZXMuICovXG4gIHN0YXRpYyBtdWx0aXBseShsX21hdDogSU1hdHJpeDQ0LCByX21hdDogSU1hdHJpeDQ0KTogTXV0YWJsZU1hdHJpeDQ0IHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5KGxfbWF0LCByX21hdCwgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlTWF0cml4NDQ7XG4gIH1cblxuICAvKiogTXVsdGlwbGllcyB0d28gbWF0cmljZXMgYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIG91dE1hdC4gKi9cbiAgc3RhdGljIG11bHRpcGx5VG88VCBleHRlbmRzIElNdXRhYmxlTWF0cml4NDQ+KGxfbWF0OiBJTWF0cml4NDQsIHJfbWF0OiBJTWF0cml4NDQsIG91dE1hdDogVCk6IFQge1xuICAgIHJldHVybiBzdXBlci5fbXVsdGlwbHlUbyhsX21hdCwgcl9tYXQsIG91dE1hdCkgYXMgVDtcbiAgfVxuXG4gIC8qKiBNdWx0aXBsaWVzIGEgbWF0cml4IHdpdGggdHlwZWQgYXJyYXkgZGF0YSBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gb3V0TWF0LiAqL1xuICBzdGF0aWMgbXVsdGlwbHlUeXBlZEFycmF5VG88VCBleHRlbmRzIElNdXRhYmxlTWF0cml4NDQ+KFxuICAgIGxfbWF0OiBJTWF0cml4NDQsXG4gICAgcl9hcnJheTogQXJyYXlUeXBlLFxuICAgIG91dE1hdDogVCxcbiAgICBvZmZzZXRBc0NvbXBvc2l0aW9uOiBudW1iZXJcbiAgKTogVCB7XG4gICAgcmV0dXJuIHN1cGVyLl9tdWx0aXBseVR5cGVkQXJyYXlUbyhsX21hdCwgcl9hcnJheSwgb3V0TWF0LCBvZmZzZXRBc0NvbXBvc2l0aW9uKSBhcyBUO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSByb3RhdGlvbiBtYXRyaXggZnJvbSBhIHF1YXRlcm5pb24gYW5kIHN0b3JlcyBpdCBpbiBvdXRNYXQuICovXG4gIHN0YXRpYyBmcm9tUXVhdGVybmlvblRvPFQgZXh0ZW5kcyBJTXV0YWJsZU1hdHJpeDQ0PihxdWF0OiBJUXVhdGVybmlvbiwgb3V0TWF0OiBUKTogVCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tUXVhdGVybmlvblRvKHF1YXQsIG91dE1hdCkgYXMgVDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gcm93LW1ham9yIGNvbXBvbmVudHMuICovXG4gIC8vIHByZXR0aWVyLWlnbm9yZVxuICBzdGF0aWMgZnJvbUNvcHkxNlJvd01ham9yKFxuICAgIG0wMDogbnVtYmVyLFxuICAgIG0wMTogbnVtYmVyLFxuICAgIG0wMjogbnVtYmVyLFxuICAgIG0wMzogbnVtYmVyLFxuICAgIG0xMDogbnVtYmVyLFxuICAgIG0xMTogbnVtYmVyLFxuICAgIG0xMjogbnVtYmVyLFxuICAgIG0xMzogbnVtYmVyLFxuICAgIG0yMDogbnVtYmVyLFxuICAgIG0yMTogbnVtYmVyLFxuICAgIG0yMjogbnVtYmVyLFxuICAgIG0yMzogbnVtYmVyLFxuICAgIG0zMDogbnVtYmVyLFxuICAgIG0zMTogbnVtYmVyLFxuICAgIG0zMjogbnVtYmVyLFxuICAgIG0zMzogbnVtYmVyXG4gICk6IE11dGFibGVNYXRyaXg0NCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weTE2Um93TWFqb3IoXG4gICAgICBtMDAsXG4gICAgICBtMDEsXG4gICAgICBtMDIsXG4gICAgICBtMDMsXG4gICAgICBtMTAsXG4gICAgICBtMTEsXG4gICAgICBtMTIsXG4gICAgICBtMTMsXG4gICAgICBtMjAsXG4gICAgICBtMjEsXG4gICAgICBtMjIsXG4gICAgICBtMjMsXG4gICAgICBtMzAsXG4gICAgICBtMzEsXG4gICAgICBtMzIsXG4gICAgICBtMzMsXG4gICAgICBGbG9hdDMyQXJyYXlcbiAgICApIGFzIE11dGFibGVNYXRyaXg0NDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gY29sdW1uLW1ham9yIGNvbXBvbmVudHMuICovXG4gIC8vIHByZXR0aWVyLWlnbm9yZVxuICBzdGF0aWMgZnJvbUNvcHkxNkNvbHVtbk1ham9yKFxuICAgIG0wMDogbnVtYmVyLFxuICAgIG0xMDogbnVtYmVyLFxuICAgIG0yMDogbnVtYmVyLFxuICAgIG0zMDogbnVtYmVyLFxuICAgIG0wMTogbnVtYmVyLFxuICAgIG0xMTogbnVtYmVyLFxuICAgIG0yMTogbnVtYmVyLFxuICAgIG0zMTogbnVtYmVyLFxuICAgIG0wMjogbnVtYmVyLFxuICAgIG0xMjogbnVtYmVyLFxuICAgIG0yMjogbnVtYmVyLFxuICAgIG0zMjogbnVtYmVyLFxuICAgIG0wMzogbnVtYmVyLFxuICAgIG0xMzogbnVtYmVyLFxuICAgIG0yMzogbnVtYmVyLFxuICAgIG0zMzogbnVtYmVyXG4gICk6IE11dGFibGVNYXRyaXg0NCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weTE2Q29sdW1uTWFqb3IoXG4gICAgICBtMDAsXG4gICAgICBtMTAsXG4gICAgICBtMjAsXG4gICAgICBtMzAsXG4gICAgICBtMDEsXG4gICAgICBtMTEsXG4gICAgICBtMjEsXG4gICAgICBtMzEsXG4gICAgICBtMDIsXG4gICAgICBtMTIsXG4gICAgICBtMjIsXG4gICAgICBtMzIsXG4gICAgICBtMDMsXG4gICAgICBtMTMsXG4gICAgICBtMjMsXG4gICAgICBtMzMsXG4gICAgICBGbG9hdDMyQXJyYXlcbiAgICApIGFzIE11dGFibGVNYXRyaXg0NDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGJ5IGNvcHlpbmcgYW5vdGhlciBtYXRyaXguICovXG4gIHN0YXRpYyBmcm9tQ29weU1hdHJpeDQ0KG1hdDogSU1hdHJpeDQ0KTogTXV0YWJsZU1hdHJpeDQ0IHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5TWF0cml4NDQobWF0LCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXg0NDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IHRoYXQgZGlyZWN0bHkgdXNlcyB0aGUgZ2l2ZW4gRmxvYXQzMkFycmF5LiAqL1xuICBzdGF0aWMgZnJvbUZsb2F0MzJBcnJheUNvbHVtbk1ham9yKGFycmF5OiBGbG9hdDMyQXJyYXkpOiBNdXRhYmxlTWF0cml4NDQge1xuICAgIHJldHVybiBzdXBlci5fZnJvbVR5cGVkQXJyYXlDb2x1bW5NYWpvcihhcnJheSwgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlTWF0cml4NDQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBieSBjb3B5aW5nIGEgRmxvYXQzMkFycmF5IGluIGNvbHVtbi1tYWpvciBvcmRlci4gKi9cbiAgc3RhdGljIGZyb21Db3B5RmxvYXQzMkFycmF5Q29sdW1uTWFqb3IoYXJyYXk6IEZsb2F0MzJBcnJheSk6IE11dGFibGVNYXRyaXg0NCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weVR5cGVkQXJyYXlDb2x1bW5NYWpvcihhcnJheSwgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlTWF0cml4NDQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBieSBjb3B5aW5nIGEgRmxvYXQzMkFycmF5IGluIHJvdy1tYWpvciBvcmRlci4gKi9cbiAgc3RhdGljIGZyb21Db3B5RmxvYXQzMkFycmF5Um93TWFqb3IoYXJyYXk6IEZsb2F0MzJBcnJheSk6IE11dGFibGVNYXRyaXg0NCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weVR5cGVkQXJyYXlSb3dNYWpvcihhcnJheSwgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlTWF0cml4NDQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgM3gzIG1hdHJpeCBlbWJlZGRlZCBpbiB0aGUgdXBwZXItbGVmdCBjb3JuZXIuICovXG4gIHN0YXRpYyBmcm9tQ29weU1hdHJpeDMzKG1hdDogSU1hdHJpeDMzKTogTXV0YWJsZU1hdHJpeDQ0IHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5TWF0cml4MzMobWF0LCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXg0NDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSAxNi1lbGVtZW50IGFycmF5IGluIGNvbHVtbi1tYWpvciBvcmRlci4gKi9cbiAgc3RhdGljIGZyb21Db3B5QXJyYXkxNkNvbHVtbk1ham9yKGFycmF5OiBBcnJheTE2PG51bWJlcj4pOiBNdXRhYmxlTWF0cml4NDQge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlBcnJheTE2Q29sdW1uTWFqb3IoYXJyYXksIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDQ0O1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhbiBhcnJheSBpbiBjb2x1bW4tbWFqb3Igb3JkZXIuICovXG4gIHN0YXRpYyBmcm9tQ29weUFycmF5Q29sdW1uTWFqb3IoYXJyYXk6IEFycmF5PG51bWJlcj4pOiBNdXRhYmxlTWF0cml4NDQge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlBcnJheUNvbHVtbk1ham9yKGFycmF5LCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXg0NDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSAxNi1lbGVtZW50IGFycmF5IGluIHJvdy1tYWpvciBvcmRlci4gKi9cbiAgc3RhdGljIGZyb21Db3B5QXJyYXkxNlJvd01ham9yKGFycmF5OiBBcnJheTE2PG51bWJlcj4pOiBNdXRhYmxlTWF0cml4NDQge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlBcnJheTE2Um93TWFqb3IoYXJyYXksIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDQ0O1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhbiBhcnJheSBpbiByb3ctbWFqb3Igb3JkZXIuICovXG4gIHN0YXRpYyBmcm9tQ29weUFycmF5Um93TWFqb3IoYXJyYXk6IEFycmF5PG51bWJlcj4pOiBNdXRhYmxlTWF0cml4NDQge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlBcnJheVJvd01ham9yKGFycmF5LCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXg0NDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgcm90YXRpb24gbWF0cml4IGZyb20gYSBxdWF0ZXJuaW9uLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlRdWF0ZXJuaW9uKHE6IElRdWF0ZXJuaW9uKTogTXV0YWJsZU1hdHJpeDQ0IHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5UXVhdGVybmlvbihxLCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXg0NDtcbiAgfVxufVxuXG4vKipcbiAqIEltbXV0YWJsZSA0eDQgbWF0cml4IHdpdGggNjQtYml0IGZsb2F0IGNvbXBvbmVudHMuXG4gKiBVc2UgdGhpcyBpbXBsZW1lbnRhdGlvbiB3aGVuIGhpZ2hlciBudW1lcmljYWwgcHJlY2lzaW9uIGlzIHJlcXVpcmVkLlxuICovXG5leHBvcnQgY2xhc3MgTXV0YWJsZU1hdHJpeDQ0RCBleHRlbmRzIE11dGFibGVNYXRyaXg0NF88RmxvYXQ2NEFycmF5Q29uc3RydWN0b3I+IHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgTXV0YWJsZU1hdHJpeDQ0RCBpbnN0YW5jZS5cbiAgICogQHBhcmFtIG0gLSBUaGUgdHlwZWQgYXJyYXkgY29udGFpbmluZyB0aGUgbWF0cml4IGNvbXBvbmVudHNcbiAgICovXG4gIHByaXZhdGUgY29uc3RydWN0b3IobTogVHlwZWRBcnJheSkge1xuICAgIHN1cGVyKG0sIHsgdHlwZTogRmxvYXQ2NEFycmF5IH0pO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSB6ZXJvIG1hdHJpeC4gKi9cbiAgc3RhdGljIHplcm8oKTogTXV0YWJsZU1hdHJpeDQ0RCB7XG4gICAgcmV0dXJuIHN1cGVyLl96ZXJvKEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDQ0RDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGFuIGlkZW50aXR5IG1hdHJpeC4gKi9cbiAgc3RhdGljIGlkZW50aXR5KCk6IE11dGFibGVNYXRyaXg0NEQge1xuICAgIHJldHVybiBzdXBlci5faWRlbnRpdHkoRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlTWF0cml4NDREO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBkdW1teSBtYXRyaXggd2l0aCBhbiBlbXB0eSBhcnJheS4gKi9cbiAgc3RhdGljIGR1bW15KCk6IE11dGFibGVNYXRyaXg0NEQge1xuICAgIHJldHVybiBzdXBlci5fZHVtbXkoRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlTWF0cml4NDREO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgdGhlIHRyYW5zcG9zZSBvZiB0aGUgZ2l2ZW4gbWF0cml4LiAqL1xuICBzdGF0aWMgdHJhbnNwb3NlKG1hdDogSU1hdHJpeDQ0KTogTXV0YWJsZU1hdHJpeDQ0RCB7XG4gICAgcmV0dXJuIHN1cGVyLl90cmFuc3Bvc2UobWF0LCBGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVNYXRyaXg0NEQ7XG4gIH1cblxuICAvKiogQXR0ZW1wdHMgdG8gaW52ZXJ0IHRoZSBnaXZlbiBtYXRyaXgsIHJldHVybmluZyBudWxsIHdoZW4gaXQgaXMgc2luZ3VsYXIuICovXG4gIHN0YXRpYyB0cnlJbnZlcnQobWF0OiBJTWF0cml4NDQpOiBNdXRhYmxlTWF0cml4NDREIHwgbnVsbCB7XG4gICAgcmV0dXJuIHN1cGVyLl90cnlJbnZlcnQobWF0LCBGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVNYXRyaXg0NEQgfCBudWxsO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgdGhlIGludmVyc2Ugb2YgdGhlIGdpdmVuIG1hdHJpeCAoaWRlbnRpdHkgd2hlbiBzaW5ndWxhcikuICovXG4gIHN0YXRpYyBpbnZlcnQobWF0OiBJTWF0cml4NDQpOiBNdXRhYmxlTWF0cml4NDREIHtcbiAgICByZXR1cm4gc3VwZXIuX2ludmVydChtYXQsIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDQ0RDtcbiAgfVxuXG4gIC8qKiBBdHRlbXB0cyB0byBpbnZlcnQgdGhlIGdpdmVuIG1hdHJpeCBpbnRvIG91dE1hdC4gKi9cbiAgc3RhdGljIHRyeUludmVydFRvPFQgZXh0ZW5kcyBJTXV0YWJsZU1hdHJpeDQ0PihtYXQ6IElNYXRyaXg0NCwgb3V0TWF0OiBUKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHN1cGVyLl90cnlJbnZlcnRUbyhtYXQsIG91dE1hdCk7XG4gIH1cblxuICAvKiogSW52ZXJ0cyB0aGUgZ2l2ZW4gbWF0cml4IGludG8gb3V0TWF0IChpZGVudGl0eSB3aGVuIHNpbmd1bGFyKS4gKi9cbiAgc3RhdGljIGludmVydFRvPFQgZXh0ZW5kcyBJTXV0YWJsZU1hdHJpeDQ0PihtYXQ6IElNYXRyaXg0NCwgb3V0TWF0OiBUKTogVCB7XG4gICAgcmV0dXJuIHN1cGVyLl9pbnZlcnRUbyhtYXQsIG91dE1hdCkgYXMgVDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgdHJhbnNsYXRpb24gbWF0cml4LiAqL1xuICBzdGF0aWMgdHJhbnNsYXRlKHZlYzogSVZlY3RvcjMpOiBNdXRhYmxlTWF0cml4NDREIHtcbiAgICByZXR1cm4gc3VwZXIuX3RyYW5zbGF0ZSh2ZWMsIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDQ0RDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgcm90YXRpb24gbWF0cml4IGFyb3VuZCB0aGUgWC1heGlzLiAqL1xuICBzdGF0aWMgcm90YXRlWChyYWRpYW46IG51bWJlcik6IE11dGFibGVNYXRyaXg0NEQge1xuICAgIHJldHVybiBzdXBlci5fcm90YXRlWChyYWRpYW4sIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDQ0RDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgcm90YXRpb24gbWF0cml4IGFyb3VuZCB0aGUgWS1heGlzLiAqL1xuICBzdGF0aWMgcm90YXRlWShyYWRpYW46IG51bWJlcik6IE11dGFibGVNYXRyaXg0NEQge1xuICAgIHJldHVybiBzdXBlci5fcm90YXRlWShyYWRpYW4sIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDQ0RDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgcm90YXRpb24gbWF0cml4IGFyb3VuZCB0aGUgWi1heGlzLiAqL1xuICBzdGF0aWMgcm90YXRlWihyYWRpYW46IG51bWJlcik6IE11dGFibGVNYXRyaXg0NEQge1xuICAgIHJldHVybiBzdXBlci5fcm90YXRlWihyYWRpYW4sIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDQ0RDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgcm90YXRpb24gbWF0cml4IGZyb20gRXVsZXIgYW5nbGVzIGluIFhZWiBvcmRlci4gKi9cbiAgc3RhdGljIHJvdGF0ZVhZWih4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyKTogTXV0YWJsZU1hdHJpeDQ0RCB7XG4gICAgcmV0dXJuIHN1cGVyLl9yb3RhdGVYWVooeCwgeSwgeiwgRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlTWF0cml4NDREO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSByb3RhdGlvbiBtYXRyaXggZnJvbSBhIHZlY3RvciBjb250YWluaW5nIEV1bGVyIGFuZ2xlcy4gKi9cbiAgc3RhdGljIHJvdGF0ZSh2ZWM6IElWZWN0b3IzKTogTXV0YWJsZU1hdHJpeDQ0RCB7XG4gICAgcmV0dXJuIHN1cGVyLl9yb3RhdGUodmVjLCBGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVNYXRyaXg0NEQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIHNjYWxpbmcgbWF0cml4LiAqL1xuICBzdGF0aWMgc2NhbGUodmVjOiBJVmVjdG9yMyk6IE11dGFibGVNYXRyaXg0NEQge1xuICAgIHJldHVybiBzdXBlci5fc2NhbGUodmVjLCBGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVNYXRyaXg0NEQ7XG4gIH1cblxuICAvKiogTXVsdGlwbGllcyB0d28gbWF0cmljZXMuICovXG4gIHN0YXRpYyBtdWx0aXBseShsX21hdDogSU1hdHJpeDQ0LCByX21hdDogSU1hdHJpeDQ0KTogTXV0YWJsZU1hdHJpeDQ0RCB7XG4gICAgcmV0dXJuIHN1cGVyLl9tdWx0aXBseShsX21hdCwgcl9tYXQsIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDQ0RDtcbiAgfVxuXG4gIC8qKiBNdWx0aXBsaWVzIHR3byBtYXRyaWNlcyBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gb3V0TWF0LiAqL1xuICBzdGF0aWMgbXVsdGlwbHlUbzxUIGV4dGVuZHMgSU11dGFibGVNYXRyaXg0ND4obF9tYXQ6IElNYXRyaXg0NCwgcl9tYXQ6IElNYXRyaXg0NCwgb3V0TWF0OiBUKTogVCB7XG4gICAgcmV0dXJuIHN1cGVyLl9tdWx0aXBseVRvKGxfbWF0LCByX21hdCwgb3V0TWF0KSBhcyBUO1xuICB9XG5cbiAgLyoqIE11bHRpcGxpZXMgYSBtYXRyaXggd2l0aCB0eXBlZCBhcnJheSBkYXRhIGFuZCBzdG9yZXMgdGhlIHJlc3VsdCBpbiBvdXRNYXQuICovXG4gIHN0YXRpYyBtdWx0aXBseVR5cGVkQXJyYXlUbzxUIGV4dGVuZHMgSU11dGFibGVNYXRyaXg0ND4oXG4gICAgbF9tYXQ6IElNYXRyaXg0NCxcbiAgICByX2FycmF5OiBBcnJheVR5cGUsXG4gICAgb3V0TWF0OiBULFxuICAgIG9mZnNldEFzQ29tcG9zaXRpb246IG51bWJlclxuICApOiBUIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5VHlwZWRBcnJheVRvKGxfbWF0LCByX2FycmF5LCBvdXRNYXQsIG9mZnNldEFzQ29tcG9zaXRpb24pIGFzIFQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIHJvdGF0aW9uIG1hdHJpeCBmcm9tIGEgcXVhdGVybmlvbiBhbmQgc3RvcmVzIGl0IGluIG91dE1hdC4gKi9cbiAgc3RhdGljIGZyb21RdWF0ZXJuaW9uVG88VCBleHRlbmRzIElNdXRhYmxlTWF0cml4NDQ+KHF1YXQ6IElRdWF0ZXJuaW9uLCBvdXRNYXQ6IFQpOiBUIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21RdWF0ZXJuaW9uVG8ocXVhdCwgb3V0TWF0KSBhcyBUO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSByb3ctbWFqb3IgY29tcG9uZW50cy4gKi9cbiAgLy8gcHJldHRpZXItaWdub3JlXG4gIHN0YXRpYyBmcm9tQ29weTE2Um93TWFqb3IoXG4gICAgbTAwOiBudW1iZXIsXG4gICAgbTAxOiBudW1iZXIsXG4gICAgbTAyOiBudW1iZXIsXG4gICAgbTAzOiBudW1iZXIsXG4gICAgbTEwOiBudW1iZXIsXG4gICAgbTExOiBudW1iZXIsXG4gICAgbTEyOiBudW1iZXIsXG4gICAgbTEzOiBudW1iZXIsXG4gICAgbTIwOiBudW1iZXIsXG4gICAgbTIxOiBudW1iZXIsXG4gICAgbTIyOiBudW1iZXIsXG4gICAgbTIzOiBudW1iZXIsXG4gICAgbTMwOiBudW1iZXIsXG4gICAgbTMxOiBudW1iZXIsXG4gICAgbTMyOiBudW1iZXIsXG4gICAgbTMzOiBudW1iZXJcbiAgKTogTXV0YWJsZU1hdHJpeDQ0RCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weTE2Um93TWFqb3IoXG4gICAgICBtMDAsXG4gICAgICBtMDEsXG4gICAgICBtMDIsXG4gICAgICBtMDMsXG4gICAgICBtMTAsXG4gICAgICBtMTEsXG4gICAgICBtMTIsXG4gICAgICBtMTMsXG4gICAgICBtMjAsXG4gICAgICBtMjEsXG4gICAgICBtMjIsXG4gICAgICBtMjMsXG4gICAgICBtMzAsXG4gICAgICBtMzEsXG4gICAgICBtMzIsXG4gICAgICBtMzMsXG4gICAgICBGbG9hdDY0QXJyYXlcbiAgICApIGFzIE11dGFibGVNYXRyaXg0NEQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGNvbHVtbi1tYWpvciBjb21wb25lbnRzLiAqL1xuICAvLyBwcmV0dGllci1pZ25vcmVcbiAgc3RhdGljIGZyb21Db3B5MTZDb2x1bW5NYWpvcihcbiAgICBtMDA6IG51bWJlcixcbiAgICBtMTA6IG51bWJlcixcbiAgICBtMjA6IG51bWJlcixcbiAgICBtMzA6IG51bWJlcixcbiAgICBtMDE6IG51bWJlcixcbiAgICBtMTE6IG51bWJlcixcbiAgICBtMjE6IG51bWJlcixcbiAgICBtMzE6IG51bWJlcixcbiAgICBtMDI6IG51bWJlcixcbiAgICBtMTI6IG51bWJlcixcbiAgICBtMjI6IG51bWJlcixcbiAgICBtMzI6IG51bWJlcixcbiAgICBtMDM6IG51bWJlcixcbiAgICBtMTM6IG51bWJlcixcbiAgICBtMjM6IG51bWJlcixcbiAgICBtMzM6IG51bWJlclxuICApOiBNdXRhYmxlTWF0cml4NDREIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5MTZDb2x1bW5NYWpvcihcbiAgICAgIG0wMCxcbiAgICAgIG0xMCxcbiAgICAgIG0yMCxcbiAgICAgIG0zMCxcbiAgICAgIG0wMSxcbiAgICAgIG0xMSxcbiAgICAgIG0yMSxcbiAgICAgIG0zMSxcbiAgICAgIG0wMixcbiAgICAgIG0xMixcbiAgICAgIG0yMixcbiAgICAgIG0zMixcbiAgICAgIG0wMyxcbiAgICAgIG0xMyxcbiAgICAgIG0yMyxcbiAgICAgIG0zMyxcbiAgICAgIEZsb2F0NjRBcnJheVxuICAgICkgYXMgTXV0YWJsZU1hdHJpeDQ0RDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGJ5IGNvcHlpbmcgYW5vdGhlciBtYXRyaXguICovXG4gIHN0YXRpYyBmcm9tQ29weU1hdHJpeDQ0KG1hdDogSU1hdHJpeDQ0KTogTXV0YWJsZU1hdHJpeDQ0RCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weU1hdHJpeDQ0KG1hdCwgRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlTWF0cml4NDREO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggdGhhdCBkaXJlY3RseSB1c2VzIHRoZSBnaXZlbiBGbG9hdDY0QXJyYXkuICovXG4gIHN0YXRpYyBmcm9tRmxvYXQ2NEFycmF5Q29sdW1uTWFqb3IoYXJyYXk6IEZsb2F0NjRBcnJheSk6IE11dGFibGVNYXRyaXg0NEQge1xuICAgIHJldHVybiBzdXBlci5fZnJvbVR5cGVkQXJyYXlDb2x1bW5NYWpvcihhcnJheSwgRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlTWF0cml4NDREO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggYnkgY29weWluZyBhIEZsb2F0NjRBcnJheSBpbiBjb2x1bW4tbWFqb3Igb3JkZXIuICovXG4gIHN0YXRpYyBmcm9tQ29weUZsb2F0NjRBcnJheUNvbHVtbk1ham9yKGFycmF5OiBGbG9hdDY0QXJyYXkpOiBNdXRhYmxlTWF0cml4NDREIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5VHlwZWRBcnJheUNvbHVtbk1ham9yKGFycmF5LCBGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVNYXRyaXg0NEQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBieSBjb3B5aW5nIGEgRmxvYXQ2NEFycmF5IGluIHJvdy1tYWpvciBvcmRlci4gKi9cbiAgc3RhdGljIGZyb21Db3B5RmxvYXQ2NEFycmF5Um93TWFqb3IoYXJyYXk6IEZsb2F0NjRBcnJheSk6IE11dGFibGVNYXRyaXg0NEQge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlUeXBlZEFycmF5Um93TWFqb3IoYXJyYXksIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDQ0RDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSAzeDMgbWF0cml4IGVtYmVkZGVkIGluIHRoZSB1cHBlci1sZWZ0IGNvcm5lci4gKi9cbiAgc3RhdGljIGZyb21Db3B5TWF0cml4MzMobWF0OiBJTWF0cml4MzMpOiBNdXRhYmxlTWF0cml4NDREIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5TWF0cml4MzMobWF0LCBGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVNYXRyaXg0NEQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgMTYtZWxlbWVudCBhcnJheSBpbiBjb2x1bW4tbWFqb3Igb3JkZXIuICovXG4gIHN0YXRpYyBmcm9tQ29weUFycmF5MTZDb2x1bW5NYWpvcihhcnJheTogQXJyYXkxNjxudW1iZXI+KTogTXV0YWJsZU1hdHJpeDQ0RCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weUFycmF5MTZDb2x1bW5NYWpvcihhcnJheSwgRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlTWF0cml4NDREO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhbiBhcnJheSBpbiBjb2x1bW4tbWFqb3Igb3JkZXIuICovXG4gIHN0YXRpYyBmcm9tQ29weUFycmF5Q29sdW1uTWFqb3IoYXJyYXk6IEFycmF5PG51bWJlcj4pOiBNdXRhYmxlTWF0cml4NDREIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5QXJyYXlDb2x1bW5NYWpvcihhcnJheSwgRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlTWF0cml4NDREO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIDE2LWVsZW1lbnQgYXJyYXkgaW4gcm93LW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheTE2Um93TWFqb3IoYXJyYXk6IEFycmF5MTY8bnVtYmVyPik6IE11dGFibGVNYXRyaXg0NEQge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlBcnJheTE2Um93TWFqb3IoYXJyYXksIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDQ0RDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYW4gYXJyYXkgaW4gcm93LW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheVJvd01ham9yKGFycmF5OiBBcnJheTxudW1iZXI+KTogTXV0YWJsZU1hdHJpeDQ0RCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weUFycmF5Um93TWFqb3IoYXJyYXksIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDQ0RDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgcm90YXRpb24gbWF0cml4IGZyb20gYSBxdWF0ZXJuaW9uLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlRdWF0ZXJuaW9uKHE6IElRdWF0ZXJuaW9uKTogTXV0YWJsZU1hdHJpeDQ0RCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weVF1YXRlcm5pb24ocSwgRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlTWF0cml4NDREO1xuICB9XG59XG5cbi8qKlxuICogQWxpYXMgZm9yIHRoZSAzMi1iaXQgKEZsb2F0MzJBcnJheSkgaW1wbGVtZW50YXRpb24sIG1ha2luZyB0aGUgcHJlY2lzaW9uIGV4cGxpY2l0LlxuICovXG5leHBvcnQgeyBNdXRhYmxlTWF0cml4NDQgYXMgTXV0YWJsZU1hdHJpeDQ0RiB9O1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsY0FBYztBQUl2QixTQUFTLGdCQUFnQjtBQUN6QixTQUFTLGlCQUFpQjtBQWlCbkIsSUFBTSxtQkFBTixjQUNHLFVBRVY7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNRSxZQUFZLEdBQWUsU0FBc0I7QUFDL0MsVUFBTSxHQUFHLE9BQU87QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQVcsSUFBSSxLQUFhO0FBQzFCLFNBQUssR0FBRyxDQUFDLElBQUk7QUFBQSxFQUNmO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBVyxNQUFjO0FBQ3ZCLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQVcsSUFBSSxLQUFhO0FBQzFCLFNBQUssR0FBRyxDQUFDLElBQUk7QUFBQSxFQUNmO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBVyxNQUFjO0FBQ3ZCLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQVcsSUFBSSxLQUFhO0FBQzFCLFNBQUssR0FBRyxDQUFDLElBQUk7QUFBQSxFQUNmO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBVyxNQUFjO0FBQ3ZCLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQVcsSUFBSSxLQUFhO0FBQzFCLFNBQUssR0FBRyxDQUFDLElBQUk7QUFBQSxFQUNmO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBVyxNQUFjO0FBQ3ZCLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQVcsSUFBSSxLQUFhO0FBQzFCLFNBQUssR0FBRyxDQUFDLElBQUk7QUFBQSxFQUNmO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBVyxNQUFjO0FBQ3ZCLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQVcsSUFBSSxLQUFhO0FBQzFCLFNBQUssR0FBRyxDQUFDLElBQUk7QUFBQSxFQUNmO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBVyxNQUFjO0FBQ3ZCLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQVcsSUFBSSxLQUFhO0FBQzFCLFNBQUssR0FBRyxDQUFDLElBQUk7QUFBQSxFQUNmO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBVyxNQUFjO0FBQ3ZCLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQVcsSUFBSSxLQUFhO0FBQzFCLFNBQUssR0FBRyxDQUFDLElBQUk7QUFBQSxFQUNmO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBVyxNQUFjO0FBQ3ZCLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQVcsSUFBSSxLQUFhO0FBQzFCLFNBQUssR0FBRyxDQUFDLElBQUk7QUFBQSxFQUNmO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBVyxNQUFjO0FBQ3ZCLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQVcsSUFBSSxLQUFhO0FBQzFCLFNBQUssR0FBRyxDQUFDLElBQUk7QUFBQSxFQUNmO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBVyxNQUFjO0FBQ3ZCLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQVcsSUFBSSxLQUFhO0FBQzFCLFNBQUssR0FBRyxFQUFFLElBQUk7QUFBQSxFQUNoQjtBQUFBO0FBQUE7QUFBQTtB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QUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQztBQUM1RCxVQUFNLE1BQU0sS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksS0FBSyxHQUFHLENBQUM7QUFDOUQsVUFBTSxNQUFNLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLEtBQUssR0FBRyxDQUFDO0FBQzlELFVBQU0sTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQztBQUM1RCxVQUFNLE1BQU0sS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksS0FBSyxHQUFHLENBQUM7QUFDOUQsVUFBTSxNQUFNLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLEtBQUssR0FBRyxDQUFDO0FBQzlELFVBQU0sTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksS0FBSyxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsQ0FBQztBQUM5RCxVQUFNLE1BQU0sS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksS0FBSyxHQUFHLENBQUM7QUFDOUQsVUFBTSxNQUFNLEtBQUssR0FBRyxFQUFFLElBQUksS0FBSyxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLEtBQUssR0FBRyxFQUFFO0FBRWhFLFVBQU0sTUFBTSxNQUFNLE1BQU0sTUFBTSxNQUFNLE1BQU0sTUFBTSxNQUFNLE1BQU0sTUFBTSxNQUFNLE1BQU07QUFFOUUsVUFBTSxXQUFXLEtBQUssSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLElBQUksS0FBSyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsSUFBSSxLQUFLLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUssSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ3pHLFVBQU0sV0FBVyxLQUFLLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUssSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLElBQUksS0FBSyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsSUFBSSxLQUFLLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztBQUN6RyxVQUFNLFdBQVcsS0FBSyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsSUFBSSxLQUFLLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUssSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDLElBQUksS0FBSyxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUM7QUFDM0csVUFBTSxXQUFXLEtBQUssSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDLElBQUksS0FBSyxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUMsSUFBSSxLQUFLLElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQyxJQUFJLEtBQUssSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQzdHLFFBQ0UsU0FBUztBQUFBLE1BQ1A7QUFBQSxNQUNBLFdBQVcsV0FBVyxXQUFXO0FBQUEsTUFDakMsU0FBUyxtQkFBbUIsS0FBSyxHQUFHLGlCQUFpQjtBQUFBLElBQ3ZELEdBQ0E7QUFDQSxhQUFPO0FBQUEsSUFDVDtBQUVBLFVBQU0sT0FBTyxLQUFLLEdBQUcsQ0FBQyxJQUFJLE1BQU0sS0FBSyxHQUFHLENBQUMsSUFBSSxNQUFNLEtBQUssR0FBRyxFQUFFLElBQUksT0FBTztBQUN4RSxVQUFNLE9BQU8sS0FBSyxHQUFHLENBQUMsSUFBSSxNQUFNLEtBQUssR0FBRyxDQUFDLElBQUksTUFBTSxLQUFLLEdBQUcsRUFBRSxJQUFJLE9BQU87QUFDeEUsVUFBTSxPQUFPLEtBQUssR0FBRyxDQUFDLElBQUksTUFBTSxLQUFLLEdBQUcsRUFBRSxJQUFJLE1BQU0sS0FBSyxHQUFHLEVBQUUsSUFBSSxPQUFPO0FBQ3pFLFVBQU0sT0FBTyxLQUFLLEdBQUcsRUFBRSxJQUFJLE1BQU0sS0FBSyxHQUFHLENBQUMsSUFBSSxNQUFNLEtBQUssR0FBRyxFQUFFLElBQUksT0FBTztBQUN6RSxVQUFNLE9BQU8sS0FBSyxHQUFHLENBQUMsSUFBSSxNQUFNLEtBQUssR0FBRyxDQUFDLElBQUksTUFBTSxLQUFLLEdBQUcsRUFBRSxJQUFJLE9BQU87QUFDeEUsVUFBTSxPQUFPLEtBQUssR0FBRyxDQUFDLElBQUksTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLE1BQU0sS0FBSyxHQUFHLEVBQUUsSUFBSSxPQUFPO0FBQ3hFLFVBQU0sT0FBTyxLQUFLLEdBQUcsRUFBRSxJQUFJLE1BQU0sS0FBSyxHQUFHLENBQUMsSUFBSSxNQUFNLEtBQUssR0FBRyxFQUFFLElBQUksT0FBTztBQUN6RSxVQUFNLE9BQU8sS0FBSyxHQUFHLENBQUMsSUFBSSxNQUFNLEtBQUssR0FBRyxFQUFFLElBQUksTUFBTSxLQUFLLEdBQUcsRUFBRSxJQUFJLE9BQU87QUFDekUsVUFBTSxPQUFPLEtBQUssR0FBRyxDQUFDLElBQUksTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLE1BQU0sS0FBSyxHQUFHLEVBQUUsSUFBSSxPQUFPO0FBQ3hFLFVBQU0sT0FBTyxLQUFLLEdBQUcsQ0FBQyxJQUFJLE1BQU0sS0FBSyxHQUFHLENBQUMsSUFBSSxNQUFNLEtBQUssR0FBRyxFQUFFLElBQUksT0FBTztBQUN4RSxVQUFNLE9BQU8sS0FBSyxHQUFHLENBQUMsSUFBSSxNQUFNLEtBQUssR0FBRyxDQUFDLElBQUksTUFBTSxLQUFLLEdBQUcsRUFBRSxJQUFJLE9BQU87QUFDeEUsVUFBTSxPQUFPLEtBQUssR0FBRyxDQUFDLElBQUksTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLE1BQU0sS0FBSyxHQUFHLEVBQUUsSUFBSSxPQUFPO0FBQ3hFLFVBQU0s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QU0sTUFBTTtBQUNaLFVBQU0sTUFBTTtBQUNaLFVBQU0sTUFBTTtBQUVaLFVBQU0sTUFBTTtBQUNaLFVBQU0sTUFBTTtBQUNaLFVBQU0sTUFBTTtBQUNaLFVBQU0sTUFBTTtBQUNaLFVBQU0sTUFBTTtBQUNaLFVBQU0sTUFBTTtBQUNaLFVBQU0sTUFBTTtBQUVaLFdBQU8sS0FBSyxjQUFjLEtBQUssS0FBSyxLQUFLLEtBQUssS0FBSyxLQUFLLEtBQUssS0FBSyxLQUFLLEtBQUssS0FBSyxLQUFLLEtBQUssS0FBSyxLQUFLLEdBQUc7QUFBQSxFQUMxRztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsT0FBTyxLQUFnQztBQUNyQyxXQUFPLEtBQUssVUFBVSxJQUFJLEdBQUcsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQztBQUFBLEVBQ3ZEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxNQUFNLEtBQWdDO0FBQ3BDLFdBQU8sS0FBSyxjQUFjLElBQUksR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFBQSxFQUNsRztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFTQSxjQUFjLEtBQWdDO0FBQzVDLFNBQUssR0FBRyxDQUFDLEtBQUssSUFBSSxHQUFHLENBQUM7QUFDdEIsU0FBSyxHQUFHLENBQUMsS0FBSyxJQUFJLEdBQUcsQ0FBQztBQUN0QixTQUFLLEdBQUcsQ0FBQyxLQUFLLElBQUksR0FBRyxDQUFDO0FBQ3RCLFNBQUssR0FBRyxFQUFFLEtBQUssSUFBSSxHQUFHLENBQUM7QUFFdkIsU0FBSyxHQUFHLENBQUMsS0FBSyxJQUFJLEdBQUcsQ0FBQztBQUN0QixTQUFLLEdBQUcsQ0FBQyxLQUFLLElBQUksR0FBRyxDQUFDO0FBQ3RCLFNBQUssR0FBRyxDQUFDLEtBQUssSUFBSSxHQUFHLENBQUM7QUFDdEIsU0FBSyxHQUFHLEVBQUUsS0FBSyxJQUFJLEdBQUcsQ0FBQztBQUV2QixTQUFLLEdBQUcsQ0FBQyxLQUFLLElBQUksR0FBRyxDQUFDO0FBQ3RCLFNBQUssR0FBRyxDQUFDLEtBQUssSUFBSSxHQUFHLENBQUM7QUFDdEIsU0FBSyxHQUFHLEVBQUUsS0FBSyxJQUFJLEdBQUcsQ0FBQztBQUN2QixTQUFLLEdBQUcsRUFBRSxLQUFLLElBQUksR0FBRyxDQUFDO0FBRXZCLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBLFNBQVMsS0FBaUM7QUFDeEMsUUFBSSxJQUFJLHVCQUF1QjtBQUM3QixhQUFPO0FBQUEsSUFDVDtBQUNBLFVBQU0sTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxDQUFDO0FBQzdHLFVBQU0sTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxDQUFDO0FBQzdHLFVBQU0sTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxFQUFFO0FBQy9HLFVBQU0sTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxFQUFFLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsRUFBRSxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxFQUFFO0FBRWpILFVBQU0sTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxDQUFDO0FBQzdHLFVBQU0sTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxDQUFDO0FBQzdHLFVBQU0sTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxFQUFFO0FBQy9HLFVBQU0sTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxFQUFFLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsRUFBRSxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxFQUFFO0FBRWpILFVBQU0sTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxDQUFDO0FBQzlHLFVBQU0sTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxDQUFDO0FBQzlHLFVBQU0sTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxFQUFFO0FBQ2hILFVBQU0sTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxFQUFFLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsRUFBRSxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxFQUFFO0FBRWxILFVBQU0sTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxDQUFDO0FBQzlHLFVBQU0sTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxDQUFDO0FBQzlHLFVBQU0sTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxFQUFFO0FBQ2hILFVBQU0sTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxFQUFFLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsRUFBRSxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxFQUFFO0FBRWxILFdBQU8sS0FBSyxjQUFjLEtBQUssS0FBSyxLQUFLLEtBQUssS0FBSyxLQUFLLEtBQUssS0FBSyxLQUFLLEtBQUssS0FBSyxLQUFLLEtBQUssS0FBSyxLQUFLLEdBQUc7QUFBQSxFQUMxRztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFTQSxlQUFlLEtBQWlDO0FBQzlDLFFBQUksSUFBSSx1QkFBdUI7QUFDN0IsYUFBTztBQUFBLElBQ1Q7QUFDQSxVQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsQ0FBQztBQUM3RyxVQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsQ0FBQztBQUM3RyxVQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsRUFBRTtBQUMvRyxVQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUUsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsRUFBRTtBQUVqSCxVQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsQ0FBQztBQUM3RyxVQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsQ0FBQztBQUM3RyxVQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsRUFBRTtBQUMvRyxVQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUUsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsRUFBRTtBQUVqSCxVQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsRUFBRSxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsQ0FBQztBQUM5RyxVQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsRUFBRSxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsQ0FBQztBQUM5RyxVQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsRUFBRSxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsRUFBRTtBQUNoSCxVQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUUsSUFBSSxJQUFJLEdBQUcsRUFBRSxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsRUFBRTtBQUVsSCxVQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsRUFBRSxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsQ0FBQztBQUM5RyxVQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsRUFBRSxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsQ0FBQztBQUM5RyxVQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsRUFBRSxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsRUFBRTtBQUNoSCxVQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUUsSUFBSSxJQUFJLEdBQUcsRUFBRSxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsRUFBRTtBQUVsSCxXQUFPLEtBQUssY0FBYyxLQUFLLEtBQUssS0FBSyxLQUFLLEtBQUssS0FBSyxLQUFLLEtBQUssS0FBSyxLQUFLLEtBQUssS0FBSyxLQUFLLEtBQUssS0FBSyxHQUFHO0FBQUEsRUFDMUc7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLGVBQWUsTUFBb0M7QUFDakQsVUFBTSxLQUFLLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUM7QUFDakMsVUFBTSxLQUFLLEtBQUssR0FBRyxDQUFD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
