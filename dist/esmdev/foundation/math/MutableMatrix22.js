// src/foundation/math/MutableMatrix22.ts
import { Logger } from "../misc/Logger.js";
import { MathUtil } from "./MathUtil.js";
import { Matrix22_ } from "./Matrix22.js";
var MutableMatrix22_ = class extends Matrix22_ {
  /**
   * Creates a new MutableMatrix22_ instance.
   * @param m - The typed array containing the matrix components
   * @param options - Configuration object containing the typed array constructor
   */
  constructor(m, options) {
    super(m, options);
  }
  /**
   * Sets the value at position (0,0) of the matrix.
   *
   * @param val - The value to set
   */
  set m00(val) {
    this._v[0] = val;
  }
  /**
   * Gets the value at position (0,0) of the matrix.
   *
   * @returns The value at position (0,0)
   */
  get m00() {
    return this._v[0];
  }
  /**
   * Sets the value at position (1,0) of the matrix.
   *
   * @param val - The value to set
   */
  set m10(val) {
    this._v[1] = val;
  }
  /**
   * Gets the value at position (1,0) of the matrix.
   *
   * @returns The value at position (1,0)
   */
  get m10() {
    return this._v[1];
  }
  /**
   * Sets the value at position (0,1) of the matrix.
   *
   * @param val - The value to set
   */
  set m01(val) {
    this._v[2] = val;
  }
  /**
   * Gets the value at position (0,1) of the matrix.
   *
   * @returns The value at position (0,1)
   */
  get m01() {
    return this._v[2];
  }
  /**
   * Sets the value at position (1,1) of the matrix.
   *
   * @param val - The value to set
   */
  set m11(val) {
    this._v[3] = val;
  }
  /**
   * Gets the value at position (1,1) of the matrix.
   *
   * @returns The value at position (1,1)
   */
  get m11() {
    return this._v[3];
  }
  /**
   * Gets the class name for debugging purposes.
   *
   * @returns The class name "MutableMatrix22"
   */
  get className() {
    return "MutableMatrix22";
  }
  /**
   * Creates a deep copy of this matrix.
   *
   * @returns A new MutableMatrix22 instance with the same values
   */
  clone() {
    const result = super.clone();
    return result;
  }
  /**
   * Gets the raw Float32Array containing the matrix data.
   *
   * @returns The internal Float32Array in column-major order
   */
  raw() {
    return this._v;
  }
  /**
   * Sets the value at the specified row and column position.
   *
   * @param row_i - The row index (0-1)
   * @param column_i - The column index (0-1)
   * @param value - The value to set
   * @returns This matrix instance for method chaining
   */
  setAt(row_i, column_i, value) {
    this._v[row_i + column_i * 2] = value;
    return this;
  }
  /**
   * Sets all matrix components directly.
   *
   * @param m00 - Value for position (0,0)
   * @param m01 - Value for position (0,1)
   * @param m10 - Value for position (1,0)
   * @param m11 - Value for position (1,1)
   * @returns This matrix instance for method chaining
   */
  setComponents(m00, m01, m10, m11) {
    this._v[0] = m00;
    this._v[2] = m01;
    this._v[1] = m10;
    this._v[3] = m11;
    return this;
  }
  /**
   * Copies the 2x2 portion of another matrix into this matrix.
   * Works with Matrix22, Matrix33, or Matrix44 sources.
   *
   * @param mat - The source matrix to copy from
   * @returns This matrix instance for method chaining
   */
  copyComponents(mat) {
    this._v[0] = mat.m00;
    this._v[2] = mat.m01;
    this._v[1] = mat.m10;
    this._v[3] = mat.m11;
    return this;
  }
  /**
   * Sets this matrix to a zero matrix (all elements are 0).
   *
   * @returns This matrix instance for method chaining
   */
  zero() {
    return this.setComponents(0, 0, 0, 0);
  }
  /**
   * Sets this matrix to an identity matrix.
   *
   * @returns This matrix instance for method chaining
   */
  identity() {
    return this.setComponents(1, 0, 0, 1);
  }
  /**
   * Internal helper method to swap two elements in the matrix array.
   *
   * @param l - Index of the first element
   * @param r - Index of the second element
   */
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
    this._swap(1, 2);
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
    const rowNorm0 = Math.abs(this._v[0]) + Math.abs(this._v[2]);
    const rowNorm1 = Math.abs(this._v[1]) + Math.abs(this._v[3]);
    if (MathUtil.isSingularDet(det, rowNorm0 * rowNorm1, MathUtil.getSingularEpsilon(this._v.BYTES_PER_ELEMENT))) {
      return false;
    }
    const invDet = 1 / det;
    const m00 = this._v[3] * invDet;
    const m01 = -this._v[2] * invDet;
    const m10 = -this._v[1] * invDet;
    const m11 = this._v[0] * invDet;
    this.setComponents(m00, m01, m10, m11);
    return true;
  }
  /**
   * Inverts this matrix in place.
   *
   * If the matrix is numerically singular, it is set to the identity matrix
   * instead of being filled with `Infinity`/`NaN`.
   * Use {@link MutableMatrix22.tryInvert} when the caller needs to detect the failure.
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
   * Sets this matrix to a rotation matrix for the given angle.
   *
   * @param radian - The rotation angle in radians
   * @returns This matrix instance for method chaining
   */
  rotate(radian) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this.setComponents(cos, -sin, sin, cos);
  }
  /**
   * Sets this matrix to a scale matrix from a 2D vector.
   *
   * @param vec - Vector2 containing the scale factors for x and y axes
   * @returns This matrix instance for method chaining
   */
  scale(vec) {
    return this.setComponents(vec._v[0], 0, 0, vec._v[1]);
  }
  /**
   * Multiplies this matrix by a scale transformation in place.
   *
   * @param vec - Vector2 containing the scale factors for x and y axes
   * @returns This matrix instance for method chaining
   */
  multiplyScale(vec) {
    this._v[0] *= vec._v[0];
    this._v[2] *= vec._v[0];
    this._v[1] *= vec._v[1];
    this._v[3] *= vec._v[1];
    return this;
  }
  /**
   * Multiplies this matrix by another matrix from the right side (this * mat).
   *
   * @param mat - The matrix to multiply with
   * @returns This matrix instance for method chaining
   */
  multiply(mat) {
    const m00 = this._v[0] * mat._v[0] + this._v[2] * mat._v[1];
    const m01 = this._v[0] * mat._v[2] + this._v[2] * mat._v[3];
    const m10 = this._v[1] * mat._v[0] + this._v[3] * mat._v[1];
    const m11 = this._v[1] * mat._v[2] + this._v[3] * mat._v[3];
    return this.setComponents(m00, m01, m10, m11);
  }
  /**
   * Multiplies this matrix by another matrix from the left side (mat * this).
   *
   * @param mat - The matrix to multiply with from the left
   * @returns This matrix instance for method chaining
   */
  multiplyByLeft(mat) {
    const m00 = mat._v[0] * this._v[0] + mat._v[2] * this._v[1];
    const m01 = mat._v[0] * this._v[2] + mat._v[2] * this._v[3];
    const m10 = mat._v[1] * this._v[0] + mat._v[3] * this._v[1];
    const m11 = mat._v[1] * this._v[2] + mat._v[3] * this._v[3];
    return this.setComponents(m00, m01, m10, m11);
  }
};
var MutableMatrix22 = class extends MutableMatrix22_ {
  /**
   * Creates a new MutableMatrix22 instance.
   * @param m - The typed array containing the matrix components
   */
  constructor(m) {
    super(m, { type: Float32Array });
  }
  /** Creates a zero matrix. */
  static zero() {
    return super._zero(Float32Array);
  }
  /** Creates an identity matrix. */
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
  /** Creates a 2D rotation matrix. */
  static rotate(radian) {
    return super._rotate(radian, Float32Array);
  }
  /** Creates a 2D scaling matrix. */
  static scale(vec) {
    return super._scale(vec, Float32Array);
  }
  /** Multiplies two 2x2 matrices. */
  static multiply(l_mat, r_mat) {
    return super._multiply(l_mat, r_mat, Float32Array);
  }
  /** Multiplies two matrices and stores the result in outMat. */
  static multiplyTo(l_mat, r_mat, outMat) {
    return super._multiplyTo(l_mat, r_mat, outMat);
  }
  /** Creates a matrix from row-major components. */
  static fromCopy4RowMajor(m00, m01, m10, m11) {
    return super._fromCopy4RowMajor(m00, m01, m10, m11, Float32Array);
  }
  /** Creates a matrix from column-major components. */
  static fromCopy4ColumnMajor(m00, m10, m01, m11) {
    return super._fromCopy4ColumnMajor(m00, m10, m01, m11, Float32Array);
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
  static fromCopyMatrix22(mat) {
    return super._fromCopyMatrix22(mat, Float32Array);
  }
  /** Creates a matrix from a 4-element array in column-major order. */
  static fromCopyArray9ColumnMajor(array) {
    return super._fromCopyArray4ColumnMajor(array, Float32Array);
  }
  /** Creates a matrix from an array in column-major order. */
  static fromCopyArrayColumnMajor(array) {
    return super._fromCopyArrayColumnMajor(array, Float32Array);
  }
  /** Creates a matrix from a 4-element array in row-major order. */
  static fromCopyArray9RowMajor(array) {
    return super._fromCopyArray4RowMajor(array, Float32Array);
  }
  /** Creates a matrix from an array in row-major order. */
  static fromCopyArrayRowMajor(array) {
    return super._fromCopyArrayRowMajor(array, Float32Array);
  }
};
var MutableMatrix22D = class extends MutableMatrix22_ {
  /**
   * Creates a new MutableMatrix22D instance.
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
  /** Creates a 2D rotation matrix. */
  static rotate(radian) {
    return super._rotate(radian, Float64Array);
  }
  /** Creates a 2D scaling matrix. */
  static scale(vec) {
    return super._scale(vec, Float64Array);
  }
  /** Multiplies two 2x2 matrices. */
  static multiply(l_mat, r_mat) {
    return super._multiply(l_mat, r_mat, Float64Array);
  }
  /** Multiplies two matrices and stores the result in outMat. */
  static multiplyTo(l_mat, r_mat, outMat) {
    return super._multiplyTo(l_mat, r_mat, outMat);
  }
  /** Creates a matrix from row-major components. */
  static fromCopy4RowMajor(m00, m01, m10, m11) {
    return super._fromCopy4RowMajor(m00, m01, m10, m11, Float64Array);
  }
  /** Creates a matrix from column-major components. */
  static fromCopy4ColumnMajor(m00, m10, m01, m11) {
    return super._fromCopy4ColumnMajor(m00, m10, m01, m11, Float64Array);
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
  static fromCopyMatrix22(mat) {
    return super._fromCopyMatrix22(mat, Float64Array);
  }
  /** Creates a matrix from a 4-element array in column-major order. */
  static fromCopyArray9ColumnMajor(array) {
    return super._fromCopyArray4ColumnMajor(array, Float64Array);
  }
  /** Creates a matrix from an array in column-major order. */
  static fromCopyArrayColumnMajor(array) {
    return super._fromCopyArrayColumnMajor(array, Float64Array);
  }
  /** Creates a matrix from a 4-element array in row-major order. */
  static fromCopyArray9RowMajor(array) {
    return super._fromCopyArray4RowMajor(array, Float64Array);
  }
  /** Creates a matrix from an array in row-major order. */
  static fromCopyArrayRowMajor(array) {
    return super._fromCopyArrayRowMajor(array, Float64Array);
  }
};
export {
  MutableMatrix22,
  MutableMatrix22D,
  MutableMatrix22 as MutableMatrix22F,
  MutableMatrix22_
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9NdXRhYmxlTWF0cml4MjIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgQXJyYXk0LCBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3RvciwgSW5kZXgsIFR5cGVkQXJyYXkgfSBmcm9tICcuLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuLi9taXNjL0xvZ2dlcic7XG5pbXBvcnQgdHlwZSB7IElNYXRyaXgyMiwgSU1hdHJpeDMzLCBJTWF0cml4NDQsIElNdXRhYmxlTWF0cml4LCBJTXV0YWJsZU1hdHJpeDIyIH0gZnJvbSAnLi9JTWF0cml4JztcbmltcG9ydCB0eXBlIHsgSVZlY3RvcjIgfSBmcm9tICcuL0lWZWN0b3InO1xuaW1wb3J0IHsgTWF0aFV0aWwgfSBmcm9tICcuL01hdGhVdGlsJztcbmltcG9ydCB7IE1hdHJpeDIyXyB9IGZyb20gJy4vTWF0cml4MjInO1xuXG4vKipcbiAqIEEgbXV0YWJsZSAyeDIgbWF0cml4IGNsYXNzIHRoYXQgZXh0ZW5kcyBNYXRyaXgyMiBhbmQgcHJvdmlkZXMgbW9kaWZpY2F0aW9uIGNhcGFiaWxpdGllcy5cbiAqIFRoaXMgY2xhc3MgYWxsb3dzIGluLXBsYWNlIG9wZXJhdGlvbnMgZm9yIG1hdHJpeCB0cmFuc2Zvcm1hdGlvbnMsIG1ha2luZyBpdCBzdWl0YWJsZVxuICogZm9yIHBlcmZvcm1hbmNlLWNyaXRpY2FsIGFwcGxpY2F0aW9ucyB3aGVyZSBvYmplY3QgY3JlYXRpb24gb3ZlcmhlYWQgc2hvdWxkIGJlIG1pbmltaXplZC5cbiAqXG4gKiBUaGUgbWF0cml4IGlzIHN0b3JlZCBpbiBjb2x1bW4tbWFqb3Igb3JkZXIgYXMgYSBGbG9hdDMyQXJyYXksIGNvbXBhdGlibGUgd2l0aCBXZWJHTC5cbiAqIE1hdHJpeCBsYXlvdXQ6XG4gKiBgYGBcbiAqIHwgbTAwIG0wMSB8XG4gKiB8IG0xMCBtMTEgfFxuICogYGBgXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnN0IG1hdHJpeCA9IE11dGFibGVNYXRyaXgyMi5pZGVudGl0eSgpO1xuICogbWF0cml4LnJvdGF0ZShNYXRoLlBJIC8gNCk7IC8vIFJvdGF0ZSA0NSBkZWdyZWVzXG4gKiBtYXRyaXguc2NhbGUoVmVjdG9yMi5mcm9tQ29weUFycmF5KFsyLCAzXSkpOyAvLyBTY2FsZSBieSAyeCBhbmQgM3lcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgTXV0YWJsZU1hdHJpeDIyXzxUIGV4dGVuZHMgRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3I+XG4gIGV4dGVuZHMgTWF0cml4MjJfPFQ+XG4gIGltcGxlbWVudHMgSU11dGFibGVNYXRyaXgsIElNdXRhYmxlTWF0cml4MjJcbntcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgTXV0YWJsZU1hdHJpeDIyXyBpbnN0YW5jZS5cbiAgICogQHBhcmFtIG0gLSBUaGUgdHlwZWQgYXJyYXkgY29udGFpbmluZyB0aGUgbWF0cml4IGNvbXBvbmVudHNcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBDb25maWd1cmF0aW9uIG9iamVjdCBjb250YWluaW5nIHRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvclxuICAgKi9cbiAgY29uc3RydWN0b3IobTogVHlwZWRBcnJheSwgb3B0aW9uczogeyB0eXBlOiBUIH0pIHtcbiAgICBzdXBlcihtLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMCwwKSBvZiB0aGUgbWF0cml4LlxuICAgKlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIHZhbHVlIHRvIHNldFxuICAgKi9cbiAgcHVibGljIHNldCBtMDAodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl92WzBdID0gdmFsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHZhbHVlIGF0IHBvc2l0aW9uICgwLDApIG9mIHRoZSBtYXRyaXguXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMCwwKVxuICAgKi9cbiAgcHVibGljIGdldCBtMDAoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdlswXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMSwwKSBvZiB0aGUgbWF0cml4LlxuICAgKlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIHZhbHVlIHRvIHNldFxuICAgKi9cbiAgcHVibGljIHNldCBtMTAodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl92WzFdID0gdmFsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHZhbHVlIGF0IHBvc2l0aW9uICgxLDApIG9mIHRoZSBtYXRyaXguXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMSwwKVxuICAgKi9cbiAgcHVibGljIGdldCBtMTAoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdlsxXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMCwxKSBvZiB0aGUgbWF0cml4LlxuICAgKlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIHZhbHVlIHRvIHNldFxuICAgKi9cbiAgcHVibGljIHNldCBtMDEodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl92WzJdID0gdmFsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHZhbHVlIGF0IHBvc2l0aW9uICgwLDEpIG9mIHRoZSBtYXRyaXguXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMCwxKVxuICAgKi9cbiAgcHVibGljIGdldCBtMDEoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdlsyXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMSwxKSBvZiB0aGUgbWF0cml4LlxuICAgKlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIHZhbHVlIHRvIHNldFxuICAgKi9cbiAgcHVibGljIHNldCBtMTEodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl92WzNdID0gdmFsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHZhbHVlIGF0IHBvc2l0aW9uICgxLDEpIG9mIHRoZSBtYXRyaXguXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB2YWx1ZSBhdCBwb3NpdGlvbiAoMSwxKVxuICAgKi9cbiAgcHVibGljIGdldCBtMTEoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdlszXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjbGFzcyBuYW1lIGZvciBkZWJ1Z2dpbmcgcHVycG9zZXMuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBjbGFzcyBuYW1lIFwiTXV0YWJsZU1hdHJpeDIyXCJcbiAgICovXG4gIGdldCBjbGFzc05hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJ011dGFibGVNYXRyaXgyMic7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGRlZXAgY29weSBvZiB0aGlzIG1hdHJpeC5cbiAgICpcbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZU1hdHJpeDIyIGluc3RhbmNlIHdpdGggdGhlIHNhbWUgdmFsdWVzXG4gICAqL1xuICBjbG9uZSgpOiBNdXRhYmxlTWF0cml4MjIge1xuICAgIGNvbnN0IHJlc3VsdCA9IHN1cGVyLmNsb25lKCkgYXMgTXV0YWJsZU1hdHJpeDIyO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcmF3IEZsb2F0MzJBcnJheSBjb250YWluaW5nIHRoZSBtYXRyaXggZGF0YS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGludGVybmFsIEZsb2F0MzJBcnJheSBpbiBjb2x1bW4tbWFqb3Igb3JkZXJcbiAgICovXG4gIHJhdygpIHtcbiAgICByZXR1cm4gdGhpcy5fdjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2YWx1ZSBhdCB0aGUgc3BlY2lmaWVkIHJvdyBhbmQgY29sdW1uIHBvc2l0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gcm93X2kgLSBUaGUgcm93IGluZGV4ICgwLTEpXG4gICAqIEBwYXJhbSBjb2x1bW5faSAtIFRoZSBjb2x1bW4gaW5kZXggKDAtMSlcbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIHZhbHVlIHRvIHNldFxuICAgKiBAcmV0dXJucyBUaGlzIG1hdHJpeCBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICBzZXRBdChyb3dfaTogbnVtYmVyLCBjb2x1bW5faTogbnVtYmVyLCB2YWx1ZTogbnVtYmVyKTogTXV0YWJsZU1hdHJpeDIyIHtcbiAgICB0aGlzLl92W3Jvd19pICsgY29sdW1uX2kgKiAyXSA9IHZhbHVlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYWxsIG1hdHJpeCBjb21wb25lbnRzIGRpcmVjdGx5LlxuICAgKlxuICAgKiBAcGFyYW0gbTAwIC0gVmFsdWUgZm9yIHBvc2l0aW9uICgwLDApXG4gICAqIEBwYXJhbSBtMDEgLSBWYWx1ZSBmb3IgcG9zaXRpb24gKDAsMSlcbiAgICogQHBhcmFtIG0xMCAtIFZhbHVlIGZvciBwb3NpdGlvbiAoMSwwKVxuICAgKiBAcGFyYW0gbTExIC0gVmFsdWUgZm9yIHBvc2l0aW9uICgxLDEpXG4gICAqIEByZXR1cm5zIFRoaXMgbWF0cml4IGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIHNldENvbXBvbmVudHMobTAwOiBudW1iZXIsIG0wMTogbnVtYmVyLCBtMTA6IG51bWJlciwgbTExOiBudW1iZXIpOiBNdXRhYmxlTWF0cml4MjIge1xuICAgIHRoaXMuX3ZbMF0gPSBtMDA7XG4gICAgdGhpcy5fdlsyXSA9IG0wMTtcbiAgICB0aGlzLl92WzFdID0gbTEwO1xuICAgIHRoaXMuX3ZbM10gPSBtMTE7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDb3BpZXMgdGhlIDJ4MiBwb3J0aW9uIG9mIGFub3RoZXIgbWF0cml4IGludG8gdGhpcyBtYXRyaXguXG4gICAqIFdvcmtzIHdpdGggTWF0cml4MjIsIE1hdHJpeDMzLCBvciBNYXRyaXg0NCBzb3VyY2VzLlxuICAgKlxuICAgKiBAcGFyYW0gbWF0IC0gVGhlIHNvdXJjZSBtYXRyaXggdG8gY29weSBmcm9tXG4gICAqIEByZXR1cm5zIFRoaXMgbWF0cml4IGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIGNvcHlDb21wb25lbnRzKG1hdDogSU1hdHJpeDIyIHwgSU1hdHJpeDMzIHwgSU1hdHJpeDQ0KTogTXV0YWJsZU1hdHJpeDIyIHtcbiAgICB0aGlzLl92WzBdID0gbWF0Lm0wMDtcbiAgICB0aGlzLl92WzJdID0gbWF0Lm0wMTsgLy8gbWF0Lm0wMSBpcyBtYXQuX3ZbMiBvciAzIG9yIDRdXG4gICAgdGhpcy5fdlsxXSA9IG1hdC5tMTA7XG4gICAgdGhpcy5fdlszXSA9IG1hdC5tMTE7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoaXMgbWF0cml4IHRvIGEgemVybyBtYXRyaXggKGFsbCBlbGVtZW50cyBhcmUgMCkuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoaXMgbWF0cml4IGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIHplcm8oKTogTXV0YWJsZU1hdHJpeDIyIHtcbiAgICByZXR1cm4gdGhpcy5zZXRDb21wb25lbnRzKDAsIDAsIDAsIDApO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhpcyBtYXRyaXggdG8gYW4gaWRlbnRpdHkgbWF0cml4LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGlzIG1hdHJpeCBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICBpZGVudGl0eSgpOiBNdXRhYmxlTWF0cml4MjIge1xuICAgIHJldHVybiB0aGlzLnNldENvbXBvbmVudHMoMSwgMCwgMCwgMSk7XG4gIH1cblxuICAvKipcbiAgICogSW50ZXJuYWwgaGVscGVyIG1ldGhvZCB0byBzd2FwIHR3byBlbGVtZW50cyBpbiB0aGUgbWF0cml4IGFycmF5LlxuICAgKlxuICAgKiBAcGFyYW0gbCAtIEluZGV4IG9mIHRoZSBmaXJzdCBlbGVtZW50XG4gICAqIEBwYXJhbSByIC0gSW5kZXggb2YgdGhlIHNlY29uZCBlbGVtZW50XG4gICAqL1xuICBfc3dhcChsOiBJbmRleCwgcjogSW5kZXgpOiB2b2lkIHtcbiAgICBjb25zdCB0ZW1wID0gdGhpcy5fdltsXTtcbiAgICB0aGlzLl92W2xdID0gdGhpcy5fdltyXTtcbiAgICB0aGlzLl92W3JdID0gdGVtcDtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFuc3Bvc2VzIHRoaXMgbWF0cml4IGluIHBsYWNlIChzd2FwcyByb3dzIGFuZCBjb2x1bW5zKS5cbiAgICpcbiAgICogQHJldHVybnMgVGhpcyBtYXRyaXggaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgdHJhbnNwb3NlKCk6IE11dGFibGVNYXRyaXgyMiB7XG4gICAgdGhpcy5fc3dhcCgxLCAyKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGVtcHRzIHRvIGludmVydCB0aGlzIG1hdHJpeCBpbiBwbGFjZS5cbiAgICpcbiAgICogVGhlIG1hdHJpeCBpcyBsZWZ0IHVuY2hhbmdlZCB3aGVuIGl0IGlzIG51bWVyaWNhbGx5IHNpbmd1bGFyLCB3aGljaFxuICAgKiBsZXRzIGNhbGxlcnMga2VlcCB0aGUgcHJldmlvdXMgdmFsaWQgdmFsdWUuXG4gICAqXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIGludmVyc2lvbiBzdWNjZWVkZWQsIGZhbHNlIGlmIHRoZSBtYXRyaXggaXMgc2luZ3VsYXJcbiAgICovXG4gIHRyeUludmVydCgpOiBib29sZWFuIHtcbiAgICBjb25zdCBkZXQgPSB0aGlzLmRldGVybWluYW50KCk7XG4gICAgY29uc3Qgcm93Tm9ybTAgPSBNYXRoLmFicyh0aGlzLl92WzBdKSArIE1hdGguYWJzKHRoaXMuX3ZbMl0pO1xuICAgIGNvbnN0IHJvd05vcm0xID0gTWF0aC5hYnModGhpcy5fdlsxXSkgKyBNYXRoLmFicyh0aGlzLl92WzNdKTtcbiAgICBpZiAoTWF0aFV0aWwuaXNTaW5ndWxhckRldChkZXQsIHJvd05vcm0wICogcm93Tm9ybTEsIE1hdGhVdGlsLmdldFNpbmd1bGFyRXBzaWxvbih0aGlzLl92LkJZVEVTX1BFUl9FTEVNRU5UKSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBpbnZEZXQgPSAxIC8gZGV0O1xuICAgIGNvbnN0IG0wMCA9IHRoaXMuX3ZbM10gKiBpbnZEZXQ7XG4gICAgY29uc3QgbTAxID0gLXRoaXMuX3ZbMl0gKiBpbnZEZXQ7XG4gICAgY29uc3QgbTEwID0gLXRoaXMuX3ZbMV0gKiBpbnZEZXQ7XG4gICAgY29uc3QgbTExID0gdGhpcy5fdlswXSAqIGludkRldDtcblxuICAgIHRoaXMuc2V0Q29tcG9uZW50cyhtMDAsIG0wMSwgbTEwLCBtMTEpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEludmVydHMgdGhpcyBtYXRyaXggaW4gcGxhY2UuXG4gICAqXG4gICAqIElmIHRoZSBtYXRyaXggaXMgbnVtZXJpY2FsbHkgc2luZ3VsYXIsIGl0IGlzIHNldCB0byB0aGUgaWRlbnRpdHkgbWF0cml4XG4gICAqIGluc3RlYWQgb2YgYmVpbmcgZmlsbGVkIHdpdGggYEluZmluaXR5YC9gTmFOYC5cbiAgICogVXNlIHtAbGluayBNdXRhYmxlTWF0cml4MjIudHJ5SW52ZXJ0fSB3aGVuIHRoZSBjYWxsZXIgbmVlZHMgdG8gZGV0ZWN0IHRoZSBmYWlsdXJlLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGlzIG1hdHJpeCBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICBpbnZlcnQoKTogTXV0YWJsZU1hdHJpeDIyIHtcbiAgICBpZiAodGhpcy50cnlJbnZlcnQoKSkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJ3RoZSBtYXRyaXggaXMgc2luZ3VsYXIgYW5kIGNhbm5vdCBiZSBpbnZlcnRlZC4gUmV0dXJuaW5nIGFuIGlkZW50aXR5IG1hdHJpeCBpbnN0ZWFkLicpO1xuICAgIHJldHVybiB0aGlzLmlkZW50aXR5KCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGlzIG1hdHJpeCB0byBhIHJvdGF0aW9uIG1hdHJpeCBmb3IgdGhlIGdpdmVuIGFuZ2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcmFkaWFuIC0gVGhlIHJvdGF0aW9uIGFuZ2xlIGluIHJhZGlhbnNcbiAgICogQHJldHVybnMgVGhpcyBtYXRyaXggaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgcm90YXRlKHJhZGlhbjogbnVtYmVyKTogTXV0YWJsZU1hdHJpeDIyIHtcbiAgICBjb25zdCBjb3MgPSBNYXRoLmNvcyhyYWRpYW4pO1xuICAgIGNvbnN0IHNpbiA9IE1hdGguc2luKHJhZGlhbik7XG4gICAgcmV0dXJuIHRoaXMuc2V0Q29tcG9uZW50cyhjb3MsIC1zaW4sIHNpbiwgY29zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoaXMgbWF0cml4IHRvIGEgc2NhbGUgbWF0cml4IGZyb20gYSAyRCB2ZWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBWZWN0b3IyIGNvbnRhaW5pbmcgdGhlIHNjYWxlIGZhY3RvcnMgZm9yIHggYW5kIHkgYXhlc1xuICAgKiBAcmV0dXJucyBUaGlzIG1hdHJpeCBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICBzY2FsZSh2ZWM6IElWZWN0b3IyKTogTXV0YWJsZU1hdHJpeDIyIHtcbiAgICByZXR1cm4gdGhpcy5zZXRDb21wb25lbnRzKHZlYy5fdlswXSwgMCwgMCwgdmVjLl92WzFdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIHRoaXMgbWF0cml4IGJ5IGEgc2NhbGUgdHJhbnNmb3JtYXRpb24gaW4gcGxhY2UuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBWZWN0b3IyIGNvbnRhaW5pbmcgdGhlIHNjYWxlIGZhY3RvcnMgZm9yIHggYW5kIHkgYXhlc1xuICAgKiBAcmV0dXJucyBUaGlzIG1hdHJpeCBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICBtdWx0aXBseVNjYWxlKHZlYzogSVZlY3RvcjIpOiBNdXRhYmxlTWF0cml4MjIge1xuICAgIHRoaXMuX3ZbMF0gKj0gdmVjLl92WzBdO1xuICAgIHRoaXMuX3ZbMl0gKj0gdmVjLl92WzBdO1xuXG4gICAgdGhpcy5fdlsxXSAqPSB2ZWMuX3ZbMV07XG4gICAgdGhpcy5fdlszXSAqPSB2ZWMuX3ZbMV07XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIHRoaXMgbWF0cml4IGJ5IGFub3RoZXIgbWF0cml4IGZyb20gdGhlIHJpZ2h0IHNpZGUgKHRoaXMgKiBtYXQpLlxuICAgKlxuICAgKiBAcGFyYW0gbWF0IC0gVGhlIG1hdHJpeCB0byBtdWx0aXBseSB3aXRoXG4gICAqIEByZXR1cm5zIFRoaXMgbWF0cml4IGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIG11bHRpcGx5KG1hdDogSU1hdHJpeDIyKTogTXV0YWJsZU1hdHJpeDIyIHtcbiAgICBjb25zdCBtMDAgPSB0aGlzLl92WzBdICogbWF0Ll92WzBdICsgdGhpcy5fdlsyXSAqIG1hdC5fdlsxXTtcbiAgICBjb25zdCBtMDEgPSB0aGlzLl92WzBdICogbWF0Ll92WzJdICsgdGhpcy5fdlsyXSAqIG1hdC5fdlszXTtcblxuICAgIGNvbnN0IG0xMCA9IHRoaXMuX3ZbMV0gKiBtYXQuX3ZbMF0gKyB0aGlzLl92WzNdICogbWF0Ll92WzFdO1xuICAgIGNvbnN0IG0xMSA9IHRoaXMuX3ZbMV0gKiBtYXQuX3ZbMl0gKyB0aGlzLl92WzNdICogbWF0Ll92WzNdO1xuXG4gICAgcmV0dXJuIHRoaXMuc2V0Q29tcG9uZW50cyhtMDAsIG0wMSwgbTEwLCBtMTEpO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgdGhpcyBtYXRyaXggYnkgYW5vdGhlciBtYXRyaXggZnJvbSB0aGUgbGVmdCBzaWRlIChtYXQgKiB0aGlzKS5cbiAgICpcbiAgICogQHBhcmFtIG1hdCAtIFRoZSBtYXRyaXggdG8gbXVsdGlwbHkgd2l0aCBmcm9tIHRoZSBsZWZ0XG4gICAqIEByZXR1cm5zIFRoaXMgbWF0cml4IGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIG11bHRpcGx5QnlMZWZ0KG1hdDogSU1hdHJpeDIyKTogTXV0YWJsZU1hdHJpeDIyIHtcbiAgICBjb25zdCBtMDAgPSBtYXQuX3ZbMF0gKiB0aGlzLl92WzBdICsgbWF0Ll92WzJdICogdGhpcy5fdlsxXTtcbiAgICBjb25zdCBtMDEgPSBtYXQuX3ZbMF0gKiB0aGlzLl92WzJdICsgbWF0Ll92WzJdICogdGhpcy5fdlszXTtcblxuICAgIGNvbnN0IG0xMCA9IG1hdC5fdlsxXSAqIHRoaXMuX3ZbMF0gKyBtYXQuX3ZbM10gKiB0aGlzLl92WzFdO1xuICAgIGNvbnN0IG0xMSA9IG1hdC5fdlsxXSAqIHRoaXMuX3ZbMl0gKyBtYXQuX3ZbM10gKiB0aGlzLl92WzNdO1xuXG4gICAgcmV0dXJuIHRoaXMuc2V0Q29tcG9uZW50cyhtMDAsIG0wMSwgbTEwLCBtMTEpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBNdXRhYmxlTWF0cml4MjIgZXh0ZW5kcyBNdXRhYmxlTWF0cml4MjJfPEZsb2F0MzJBcnJheUNvbnN0cnVjdG9yPiB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IE11dGFibGVNYXRyaXgyMiBpbnN0YW5jZS5cbiAgICogQHBhcmFtIG0gLSBUaGUgdHlwZWQgYXJyYXkgY29udGFpbmluZyB0aGUgbWF0cml4IGNvbXBvbmVudHNcbiAgICovXG4gIGNvbnN0cnVjdG9yKG06IFR5cGVkQXJyYXkpIHtcbiAgICBzdXBlcihtLCB7IHR5cGU6IEZsb2F0MzJBcnJheSB9KTtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgemVybyBtYXRyaXguICovXG4gIHN0YXRpYyB6ZXJvKCk6IE11dGFibGVNYXRyaXgyMiB7XG4gICAgcmV0dXJuIHN1cGVyLl96ZXJvKEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDIyO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYW4gaWRlbnRpdHkgbWF0cml4LiAqL1xuICBzdGF0aWMgaWRlbnRpdHkoKTogTXV0YWJsZU1hdHJpeDIyIHtcbiAgICByZXR1cm4gc3VwZXIuX2lkZW50aXR5KEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDIyO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBkdW1teSBtYXRyaXggd2l0aCBhbiBlbXB0eSBhcnJheS4gKi9cbiAgc3RhdGljIGR1bW15KCk6IE11dGFibGVNYXRyaXgyMiB7XG4gICAgcmV0dXJuIHN1cGVyLl9kdW1teShGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXgyMjtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIHRoZSB0cmFuc3Bvc2Ugb2YgdGhlIGdpdmVuIG1hdHJpeC4gKi9cbiAgc3RhdGljIHRyYW5zcG9zZShtYXQ6IElNYXRyaXgyMik6IE11dGFibGVNYXRyaXgyMiB7XG4gICAgcmV0dXJuIHN1cGVyLl90cmFuc3Bvc2UobWF0LCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXgyMjtcbiAgfVxuXG4gIC8qKiBBdHRlbXB0cyB0byBpbnZlcnQgdGhlIGdpdmVuIG1hdHJpeCwgcmV0dXJuaW5nIG51bGwgd2hlbiBpdCBpcyBzaW5ndWxhci4gKi9cbiAgc3RhdGljIHRyeUludmVydChtYXQ6IElNYXRyaXgyMik6IE11dGFibGVNYXRyaXgyMiB8IG51bGwge1xuICAgIHJldHVybiBzdXBlci5fdHJ5SW52ZXJ0KG1hdCwgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlTWF0cml4MjIgfCBudWxsO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgdGhlIGludmVyc2Ugb2YgdGhlIGdpdmVuIG1hdHJpeCAoaWRlbnRpdHkgd2hlbiBzaW5ndWxhcikuICovXG4gIHN0YXRpYyBpbnZlcnQobWF0OiBJTWF0cml4MjIpOiBNdXRhYmxlTWF0cml4MjIge1xuICAgIHJldHVybiBzdXBlci5faW52ZXJ0KG1hdCwgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlTWF0cml4MjI7XG4gIH1cblxuICAvKiogQXR0ZW1wdHMgdG8gaW52ZXJ0IHRoZSBnaXZlbiBtYXRyaXggaW50byBvdXRNYXQuICovXG4gIHN0YXRpYyB0cnlJbnZlcnRUbzxUIGV4dGVuZHMgSU11dGFibGVNYXRyaXgyMj4obWF0OiBJTWF0cml4MjIsIG91dE1hdDogVCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBzdXBlci5fdHJ5SW52ZXJ0VG8obWF0LCBvdXRNYXQpO1xuICB9XG5cbiAgLyoqIEludmVydHMgdGhlIGdpdmVuIG1hdHJpeCBpbnRvIG91dE1hdCAoaWRlbnRpdHkgd2hlbiBzaW5ndWxhcikuICovXG4gIHN0YXRpYyBpbnZlcnRUbzxUIGV4dGVuZHMgSU11dGFibGVNYXRyaXgyMj4obWF0OiBJTWF0cml4MjIsIG91dE1hdDogVCk6IFQge1xuICAgIHJldHVybiBzdXBlci5faW52ZXJ0VG8obWF0LCBvdXRNYXQpIGFzIFQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIDJEIHJvdGF0aW9uIG1hdHJpeC4gKi9cbiAgc3RhdGljIHJvdGF0ZShyYWRpYW46IG51bWJlcik6IE11dGFibGVNYXRyaXgyMiB7XG4gICAgcmV0dXJuIHN1cGVyLl9yb3RhdGUocmFkaWFuLCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXgyMjtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgMkQgc2NhbGluZyBtYXRyaXguICovXG4gIHN0YXRpYyBzY2FsZSh2ZWM6IElWZWN0b3IyKTogTXV0YWJsZU1hdHJpeDIyIHtcbiAgICByZXR1cm4gc3VwZXIuX3NjYWxlKHZlYywgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlTWF0cml4MjI7XG4gIH1cblxuICAvKiogTXVsdGlwbGllcyB0d28gMngyIG1hdHJpY2VzLiAqL1xuICBzdGF0aWMgbXVsdGlwbHkobF9tYXQ6IElNYXRyaXgyMiwgcl9tYXQ6IElNYXRyaXgyMik6IE11dGFibGVNYXRyaXgyMiB7XG4gICAgcmV0dXJuIHN1cGVyLl9tdWx0aXBseShsX21hdCwgcl9tYXQsIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDIyO1xuICB9XG5cbiAgLyoqIE11bHRpcGxpZXMgdHdvIG1hdHJpY2VzIGFuZCBzdG9yZXMgdGhlIHJlc3VsdCBpbiBvdXRNYXQuICovXG4gIHN0YXRpYyBtdWx0aXBseVRvPFQgZXh0ZW5kcyBJTXV0YWJsZU1hdHJpeDIyPihsX21hdDogSU1hdHJpeDIyLCByX21hdDogSU1hdHJpeDIyLCBvdXRNYXQ6IFQpOiBUIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5VG8obF9tYXQsIHJfbWF0LCBvdXRNYXQpIGFzIFQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIHJvdy1tYWpvciBjb21wb25lbnRzLiAqL1xuICBzdGF0aWMgZnJvbUNvcHk0Um93TWFqb3IobTAwOiBudW1iZXIsIG0wMTogbnVtYmVyLCBtMTA6IG51bWJlciwgbTExOiBudW1iZXIpOiBNdXRhYmxlTWF0cml4MjIge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHk0Um93TWFqb3IobTAwLCBtMDEsIG0xMCwgbTExLCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXgyMjtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gY29sdW1uLW1ham9yIGNvbXBvbmVudHMuICovXG4gIHN0YXRpYyBmcm9tQ29weTRDb2x1bW5NYWpvcihtMDA6IG51bWJlciwgbTEwOiBudW1iZXIsIG0wMTogbnVtYmVyLCBtMTE6IG51bWJlcik6IE11dGFibGVNYXRyaXgyMiB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weTRDb2x1bW5NYWpvcihtMDAsIG0xMCwgbTAxLCBtMTEsIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDIyO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggdGhhdCBkaXJlY3RseSB1c2VzIHRoZSBnaXZlbiBGbG9hdDMyQXJyYXkuICovXG4gIHN0YXRpYyBmcm9tRmxvYXQzMkFycmF5Q29sdW1uTWFqb3IoYXJyYXk6IEZsb2F0MzJBcnJheSk6IE11dGFibGVNYXRyaXgyMiB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tVHlwZWRBcnJheUNvbHVtbk1ham9yKGFycmF5LCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXgyMjtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGJ5IGNvcHlpbmcgYSBGbG9hdDMyQXJyYXkgaW4gY29sdW1uLW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlGbG9hdDMyQXJyYXlDb2x1bW5NYWpvcihhcnJheTogRmxvYXQzMkFycmF5KTogTXV0YWJsZU1hdHJpeDIyIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5VHlwZWRBcnJheUNvbHVtbk1ham9yKGFycmF5LCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXgyMjtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGJ5IGNvcHlpbmcgYSBGbG9hdDMyQXJyYXkgaW4gcm93LW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlGbG9hdDMyQXJyYXlSb3dNYWpvcihhcnJheTogRmxvYXQzMkFycmF5KTogTXV0YWJsZU1hdHJpeDIyIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5VHlwZWRBcnJheVJvd01ham9yKGFycmF5LCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXgyMjtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGJ5IGNvcHlpbmcgYW5vdGhlciBtYXRyaXguICovXG4gIHN0YXRpYyBmcm9tQ29weU1hdHJpeDIyKG1hdDogSU1hdHJpeDIyKTogTXV0YWJsZU1hdHJpeDIyIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5TWF0cml4MjIobWF0LCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXgyMjtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSA0LWVsZW1lbnQgYXJyYXkgaW4gY29sdW1uLW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheTlDb2x1bW5NYWpvcihhcnJheTogQXJyYXk0PG51bWJlcj4pOiBNdXRhYmxlTWF0cml4MjIge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlBcnJheTRDb2x1bW5NYWpvcihhcnJheSwgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlTWF0cml4MjI7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGFuIGFycmF5IGluIGNvbHVtbi1tYWpvciBvcmRlci4gKi9cbiAgc3RhdGljIGZyb21Db3B5QXJyYXlDb2x1bW5NYWpvcihhcnJheTogQXJyYXk8bnVtYmVyPik6IE11dGFibGVNYXRyaXgyMiB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weUFycmF5Q29sdW1uTWFqb3IoYXJyYXksIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDIyO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIDQtZWxlbWVudCBhcnJheSBpbiByb3ctbWFqb3Igb3JkZXIuICovXG4gIHN0YXRpYyBmcm9tQ29weUFycmF5OVJvd01ham9yKGFycmF5OiBBcnJheTQ8bnVtYmVyPik6IE11dGFibGVNYXRyaXgyMiB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weUFycmF5NFJvd01ham9yKGFycmF5LCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVNYXRyaXgyMjtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYW4gYXJyYXkgaW4gcm93LW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheVJvd01ham9yKGFycmF5OiBBcnJheTxudW1iZXI+KTogTXV0YWJsZU1hdHJpeDIyIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5QXJyYXlSb3dNYWpvcihhcnJheSwgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlTWF0cml4MjI7XG4gIH1cbn1cblxuLyoqXG4gKiBJbW11dGFibGUgMngyIG1hdHJpeCB3aXRoIDY0LWJpdCBmbG9hdCBjb21wb25lbnRzLlxuICogVXNlIHRoaXMgaW1wbGVtZW50YXRpb24gd2hlbiBoaWdoZXIgbnVtZXJpY2FsIHByZWNpc2lvbiBpcyByZXF1aXJlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIE11dGFibGVNYXRyaXgyMkQgZXh0ZW5kcyBNdXRhYmxlTWF0cml4MjJfPEZsb2F0NjRBcnJheUNvbnN0cnVjdG9yPiB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IE11dGFibGVNYXRyaXgyMkQgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSBtIC0gVGhlIHR5cGVkIGFycmF5IGNvbnRhaW5pbmcgdGhlIG1hdHJpeCBjb21wb25lbnRzXG4gICAqL1xuICBwcml2YXRlIGNvbnN0cnVjdG9yKG06IFR5cGVkQXJyYXkpIHtcbiAgICBzdXBlcihtLCB7IHR5cGU6IEZsb2F0NjRBcnJheSB9KTtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgemVybyBtYXRyaXguICovXG4gIHN0YXRpYyB6ZXJvKCk6IE11dGFibGVNYXRyaXgyMkQge1xuICAgIHJldHVybiBzdXBlci5femVybyhGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVNYXRyaXgyMkQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhbiBpZGVudGl0eSBtYXRyaXguICovXG4gIHN0YXRpYyBpZGVudGl0eSgpOiBNdXRhYmxlTWF0cml4MjJEIHtcbiAgICByZXR1cm4gc3VwZXIuX2lkZW50aXR5KEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDIyRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgZHVtbXkgbWF0cml4IHdpdGggYW4gZW1wdHkgYXJyYXkuICovXG4gIHN0YXRpYyBkdW1teSgpOiBNdXRhYmxlTWF0cml4MjJEIHtcbiAgICByZXR1cm4gc3VwZXIuX2R1bW15KEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDIyRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIHRoZSB0cmFuc3Bvc2Ugb2YgdGhlIGdpdmVuIG1hdHJpeC4gKi9cbiAgc3RhdGljIHRyYW5zcG9zZShtYXQ6IElNYXRyaXgyMik6IE11dGFibGVNYXRyaXgyMkQge1xuICAgIHJldHVybiBzdXBlci5fdHJhbnNwb3NlKG1hdCwgRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlTWF0cml4MjJEO1xuICB9XG5cbiAgLyoqIEF0dGVtcHRzIHRvIGludmVydCB0aGUgZ2l2ZW4gbWF0cml4LCByZXR1cm5pbmcgbnVsbCB3aGVuIGl0IGlzIHNpbmd1bGFyLiAqL1xuICBzdGF0aWMgdHJ5SW52ZXJ0KG1hdDogSU1hdHJpeDIyKTogTXV0YWJsZU1hdHJpeDIyRCB8IG51bGwge1xuICAgIHJldHVybiBzdXBlci5fdHJ5SW52ZXJ0KG1hdCwgRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlTWF0cml4MjJEIHwgbnVsbDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIHRoZSBpbnZlcnNlIG9mIHRoZSBnaXZlbiBtYXRyaXggKGlkZW50aXR5IHdoZW4gc2luZ3VsYXIpLiAqL1xuICBzdGF0aWMgaW52ZXJ0KG1hdDogSU1hdHJpeDIyKTogTXV0YWJsZU1hdHJpeDIyRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9pbnZlcnQobWF0LCBGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVNYXRyaXgyMkQ7XG4gIH1cblxuICAvKiogQXR0ZW1wdHMgdG8gaW52ZXJ0IHRoZSBnaXZlbiBtYXRyaXggaW50byBvdXRNYXQuICovXG4gIHN0YXRpYyB0cnlJbnZlcnRUbzxUIGV4dGVuZHMgSU11dGFibGVNYXRyaXgyMj4obWF0OiBJTWF0cml4MjIsIG91dE1hdDogVCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBzdXBlci5fdHJ5SW52ZXJ0VG8obWF0LCBvdXRNYXQpO1xuICB9XG5cbiAgLyoqIEludmVydHMgdGhlIGdpdmVuIG1hdHJpeCBpbnRvIG91dE1hdCAoaWRlbnRpdHkgd2hlbiBzaW5ndWxhcikuICovXG4gIHN0YXRpYyBpbnZlcnRUbzxUIGV4dGVuZHMgSU11dGFibGVNYXRyaXgyMj4obWF0OiBJTWF0cml4MjIsIG91dE1hdDogVCk6IFQge1xuICAgIHJldHVybiBzdXBlci5faW52ZXJ0VG8obWF0LCBvdXRNYXQpIGFzIFQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIDJEIHJvdGF0aW9uIG1hdHJpeC4gKi9cbiAgc3RhdGljIHJvdGF0ZShyYWRpYW46IG51bWJlcik6IE11dGFibGVNYXRyaXgyMkQge1xuICAgIHJldHVybiBzdXBlci5fcm90YXRlKHJhZGlhbiwgRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlTWF0cml4MjJEO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSAyRCBzY2FsaW5nIG1hdHJpeC4gKi9cbiAgc3RhdGljIHNjYWxlKHZlYzogSVZlY3RvcjIpOiBNdXRhYmxlTWF0cml4MjJEIHtcbiAgICByZXR1cm4gc3VwZXIuX3NjYWxlKHZlYywgRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlTWF0cml4MjJEO1xuICB9XG5cbiAgLyoqIE11bHRpcGxpZXMgdHdvIDJ4MiBtYXRyaWNlcy4gKi9cbiAgc3RhdGljIG11bHRpcGx5KGxfbWF0OiBJTWF0cml4MjIsIHJfbWF0OiBJTWF0cml4MjIpOiBNdXRhYmxlTWF0cml4MjJEIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5KGxfbWF0LCByX21hdCwgRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlTWF0cml4MjJEO1xuICB9XG5cbiAgLyoqIE11bHRpcGxpZXMgdHdvIG1hdHJpY2VzIGFuZCBzdG9yZXMgdGhlIHJlc3VsdCBpbiBvdXRNYXQuICovXG4gIHN0YXRpYyBtdWx0aXBseVRvPFQgZXh0ZW5kcyBJTXV0YWJsZU1hdHJpeDIyPihsX21hdDogSU1hdHJpeDIyLCByX21hdDogSU1hdHJpeDIyLCBvdXRNYXQ6IFQpOiBUIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5VG8obF9tYXQsIHJfbWF0LCBvdXRNYXQpIGFzIFQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIHJvdy1tYWpvciBjb21wb25lbnRzLiAqL1xuICBzdGF0aWMgZnJvbUNvcHk0Um93TWFqb3IobTAwOiBudW1iZXIsIG0wMTogbnVtYmVyLCBtMTA6IG51bWJlciwgbTExOiBudW1iZXIpOiBNdXRhYmxlTWF0cml4MjJEIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5NFJvd01ham9yKG0wMCwgbTAxLCBtMTAsIG0xMSwgRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlTWF0cml4MjJEO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBjb2x1bW4tbWFqb3IgY29tcG9uZW50cy4gKi9cbiAgc3RhdGljIGZyb21Db3B5NENvbHVtbk1ham9yKG0wMDogbnVtYmVyLCBtMTA6IG51bWJlciwgbTAxOiBudW1iZXIsIG0xMTogbnVtYmVyKTogTXV0YWJsZU1hdHJpeDIyRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weTRDb2x1bW5NYWpvcihtMDAsIG0xMCwgbTAxLCBtMTEsIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDIyRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IHRoYXQgZGlyZWN0bHkgdXNlcyB0aGUgZ2l2ZW4gRmxvYXQ2NEFycmF5LiAqL1xuICBzdGF0aWMgZnJvbUZsb2F0NjRBcnJheUNvbHVtbk1ham9yKGFycmF5OiBGbG9hdDY0QXJyYXkpOiBNdXRhYmxlTWF0cml4MjJEIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21UeXBlZEFycmF5Q29sdW1uTWFqb3IoYXJyYXksIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDIyRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGJ5IGNvcHlpbmcgYSBGbG9hdDY0QXJyYXkgaW4gY29sdW1uLW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlGbG9hdDY0QXJyYXlDb2x1bW5NYWpvcihhcnJheTogRmxvYXQ2NEFycmF5KTogTXV0YWJsZU1hdHJpeDIyRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weVR5cGVkQXJyYXlDb2x1bW5NYWpvcihhcnJheSwgRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlTWF0cml4MjJEO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggYnkgY29weWluZyBhIEZsb2F0NjRBcnJheSBpbiByb3ctbWFqb3Igb3JkZXIuICovXG4gIHN0YXRpYyBmcm9tQ29weUZsb2F0NjRBcnJheVJvd01ham9yKGFycmF5OiBGbG9hdDY0QXJyYXkpOiBNdXRhYmxlTWF0cml4MjJEIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5VHlwZWRBcnJheVJvd01ham9yKGFycmF5LCBGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVNYXRyaXgyMkQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBieSBjb3B5aW5nIGFub3RoZXIgbWF0cml4LiAqL1xuICBzdGF0aWMgZnJvbUNvcHlNYXRyaXgyMihtYXQ6IElNYXRyaXgyMik6IE11dGFibGVNYXRyaXgyMkQge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlNYXRyaXgyMihtYXQsIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDIyRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSA0LWVsZW1lbnQgYXJyYXkgaW4gY29sdW1uLW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheTlDb2x1bW5NYWpvcihhcnJheTogQXJyYXk0PG51bWJlcj4pOiBNdXRhYmxlTWF0cml4MjJEIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5QXJyYXk0Q29sdW1uTWFqb3IoYXJyYXksIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDIyRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYW4gYXJyYXkgaW4gY29sdW1uLW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheUNvbHVtbk1ham9yKGFycmF5OiBBcnJheTxudW1iZXI+KTogTXV0YWJsZU1hdHJpeDIyRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weUFycmF5Q29sdW1uTWFqb3IoYXJyYXksIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDIyRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSA0LWVsZW1lbnQgYXJyYXkgaW4gcm93LW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheTlSb3dNYWpvcihhcnJheTogQXJyYXk0PG51bWJlcj4pOiBNdXRhYmxlTWF0cml4MjJEIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5QXJyYXk0Um93TWFqb3IoYXJyYXksIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDIyRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYW4gYXJyYXkgaW4gcm93LW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheVJvd01ham9yKGFycmF5OiBBcnJheTxudW1iZXI+KTogTXV0YWJsZU1hdHJpeDIyRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weUFycmF5Um93TWFqb3IoYXJyYXksIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZU1hdHJpeDIyRDtcbiAgfVxufVxuXG4vKipcbiAqIEFsaWFzIGZvciB0aGUgMzItYml0IChGbG9hdDMyQXJyYXkpIGltcGxlbWVudGF0aW9uLCBtYWtpbmcgdGhlIHByZWNpc2lvbiBleHBsaWNpdC5cbiAqL1xuZXhwb3J0IHsgTXV0YWJsZU1hdHJpeDIyIGFzIE11dGFibGVNYXRyaXgyMkYgfTtcbiJdLAogICJtYXBwaW5n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
