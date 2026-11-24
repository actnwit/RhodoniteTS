// src/foundation/math/Matrix22.ts
import { CompositionType } from "../definitions/CompositionType.js";
import { Logger } from "../misc/Logger.js";
import { AbstractMatrix } from "./AbstractMatrix.js";
import { MathUtil } from "./MathUtil.js";
import { Vector2 } from "./Vector2.js";
var Matrix22_ = class extends AbstractMatrix {
  /**
   * Creates a new Matrix22_ instance.
   *
   * @param m - Typed array containing matrix values in column-major order
   * @param _options - Configuration object containing the typed array constructor
   */
  constructor(m, _options) {
    super();
    this._v = m;
  }
  /**
   * Gets the matrix element at row 0, column 0.
   *
   * @returns The m00 component of the matrix
   */
  get m00() {
    return this._v[0];
  }
  /**
   * Gets the matrix element at row 1, column 0.
   *
   * @returns The m10 component of the matrix
   */
  get m10() {
    return this._v[1];
  }
  /**
   * Gets the matrix element at row 0, column 1.
   *
   * @returns The m01 component of the matrix
   */
  get m01() {
    return this._v[2];
  }
  /**
   * Gets the matrix element at row 1, column 1.
   *
   * @returns The m11 component of the matrix
   */
  get m11() {
    return this._v[3];
  }
  /**
   * Gets the class name for this matrix type.
   *
   * @returns The string 'Matrix22'
   */
  get className() {
    return "Matrix22";
  }
  /**
   * Gets the composition type for this matrix.
   *
   * @returns The CompositionType.Mat2 enum value
   */
  static get compositionType() {
    return CompositionType.Mat2;
  }
  /**
   * Creates a 2x2 zero matrix.
   *
   * @returns A new Matrix22 with all elements set to 0
   *
   * @example
   * ```typescript
   * const zero = Matrix22.zero();
   * // Returns:
   * // | 0 0 |
   * // | 0 0 |
   * ```
   */
  static _zero(type) {
    return this._fromCopy4RowMajor(0, 0, 0, 0, type);
  }
  /**
   * Creates a 2x2 identity matrix.
   *
   * @returns A new Matrix22 identity matrix
   *
   * @example
   * ```typescript
   * const identity = Matrix22.identity();
   * // Returns:
   * // | 1 0 |
   * // | 0 1 |
   * ```
   */
  static _identity(type) {
    return this._fromCopy4RowMajor(1, 0, 0, 1, type);
  }
  /**
   * Creates a dummy matrix with empty data.
   * Used as a placeholder when no valid matrix data is available.
   *
   * @returns A new Matrix22 with empty Float32Array
   */
  static _dummy(type) {
    return new this(new type(0), { type });
  }
  /**
   * Creates the transpose of the given matrix.
   * The transpose swaps rows and columns: (i,j) becomes (j,i).
   *
   * @param mat - The matrix to transpose
   * @returns A new Matrix22 that is the transpose of the input matrix
   *
   * @example
   * ```typescript
   * const mat = Matrix22.fromCopy4RowMajor(1, 2, 3, 4);
   * const transposed = Matrix22.transpose(mat);
   * // Original:    Transposed:
   * // | 1 2 |  ->  | 1 3 |
   * // | 3 4 |      | 2 4 |
   * ```
   */
  static _transpose(mat, type) {
    return this._fromCopy4RowMajor(mat._v[0], mat._v[1], mat._v[2], mat._v[3], type);
  }
  /**
   * Attempts to create the inverse of the given matrix.
   *
   * Unlike `invert`, this method never returns a matrix filled with
   * `Infinity`/`NaN`: it returns `null` when the matrix is numerically
   * singular (see {@link MathUtil.isSingularDet}).
   *
   * @param mat - The matrix to invert
   * @returns A new Matrix22, or null if the matrix is not invertible
   */
  static _tryInvert(mat, type) {
    const det = mat.determinant();
    const rowNorm0 = Math.abs(mat._v[0]) + Math.abs(mat._v[2]);
    const rowNorm1 = Math.abs(mat._v[1]) + Math.abs(mat._v[3]);
    if (MathUtil.isSingularDet(det, rowNorm0 * rowNorm1, MathUtil.getSingularEpsilon(mat._v.BYTES_PER_ELEMENT))) {
      return null;
    }
    const invDet = 1 / det;
    const m00 = mat._v[3] * invDet;
    const m01 = -mat._v[2] * invDet;
    const m10 = -mat._v[1] * invDet;
    const m11 = mat._v[0] * invDet;
    return this._fromCopy4RowMajor(m00, m01, m10, m11, type);
  }
  /**
   * Creates the inverse of the given matrix.
   *
   * For a 2x2 matrix, the inverse is calculated using the formula:
   * A^(-1) = (1/det(A)) * | d -b |
   *                        |-c  a |
   * where A = | a b | and det(A) = ad - bc
   *           | c d |
   *
   * If the matrix is numerically singular, an identity matrix is returned
   * instead of dividing by zero. Use {@link Matrix22.tryInvert} when the
   * caller needs to detect the failure.
   *
   * @param mat - The matrix to invert
   * @returns A new Matrix22 that is the inverse of the input matrix,
   *          or the identity matrix if the input is singular
   *
   * @example
   * ```typescript
   * const mat = Matrix22.fromCopy4RowMajor(2, 0, 0, 2);
   * const inverse = Matrix22.invert(mat);
   * // Returns:
   * // | 0.5   0 |
   * // |   0 0.5 |
   * ```
   */
  static _invert(mat, type) {
    const inverted = this._tryInvert(mat, type);
    if (inverted !== null) {
      return inverted;
    }
    Logger.default.error("the matrix is singular and cannot be inverted. Returning an identity matrix instead.");
    return this._fromCopy4RowMajor(1, 0, 0, 1, type);
  }
  /**
   * Attempts to calculate the inverse of the given matrix and stores the
   * result in the output matrix.
   *
   * The output matrix is left untouched when the input is numerically
   * singular, which lets callers keep the previous valid value.
   *
   * @param mat - The matrix to invert
   * @param outMat - The mutable matrix to store the result
   * @returns True if the inversion succeeded, false if the matrix is singular
   */
  static _tryInvertTo(mat, outMat) {
    const det = mat.determinant();
    const rowNorm0 = Math.abs(mat._v[0]) + Math.abs(mat._v[2]);
    const rowNorm1 = Math.abs(mat._v[1]) + Math.abs(mat._v[3]);
    if (MathUtil.isSingularDet(det, rowNorm0 * rowNorm1, MathUtil.getSingularEpsilon(mat._v.BYTES_PER_ELEMENT))) {
      return false;
    }
    const invDet = 1 / det;
    outMat.setComponents(mat._v[3] * invDet, -mat._v[2] * invDet, -mat._v[1] * invDet, mat._v[0] * invDet);
    return true;
  }
  /**
   * Calculates the inverse of the given matrix and stores the result in the output matrix.
   * This method avoids creating a new matrix instance for better performance.
   *
   * If the matrix is numerically singular, the output matrix is set to the
   * identity matrix instead of being filled with `Infinity`/`NaN`.
   * Use {@link Matrix22.tryInvertTo} when the caller needs to detect the failure.
   *
   * @param mat - The matrix to invert
   * @param outMat - The mutable matrix to store the result
   * @returns The output matrix containing the inverse, or the identity matrix if the input is singular
   */
  static _invertTo(mat, outMat) {
    if (this._tryInvertTo(mat, outMat)) {
      return outMat;
    }
    Logger.default.error("the matrix is singular and cannot be inverted. Returning an identity matrix instead.");
    return outMat.identity();
  }
  /**
   * Creates a 2D rotation matrix for the given angle.
   *
   * The rotation matrix is:
   * | cos(θ) -sin(θ) |
   * | sin(θ)  cos(θ) |
   *
   * @param radian - The rotation angle in radians (positive values rotate counter-clockwise)
   * @returns A new Matrix22 representing the rotation transformation
   *
   * @example
   * ```typescript
   * // 90-degree counter-clockwise rotation
   * const rotation = Matrix22.rotate(Math.PI / 2);
   * ```
   */
  static _rotate(radian, type) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this._fromCopy4RowMajor(cos, -sin, sin, cos, type);
  }
  /**
   * Creates a 2D scaling matrix from a 2D vector.
   *
   * The scaling matrix is:
   * | sx  0 |
   * |  0 sy |
   *
   * @param vec - A Vector2 containing the scale factors for x and y axes
   * @returns A new Matrix22 representing the scaling transformation
   *
   * @example
   * ```typescript
   * const scale = Matrix22.scale(Vector2.fromCopyArray2([2, 3]));
   * // Creates a matrix that scales x by 2 and y by 3
   * ```
   */
  static _scale(vec, type) {
    return this._fromCopy4RowMajor(vec._v[0], 0, 0, vec._v[1], type);
  }
  /**
   * Multiplies two 2x2 matrices and returns the result.
   * Matrix multiplication is not commutative: A * B ≠ B * A in general.
   *
   * @param l_mat - The left matrix operand
   * @param r_mat - The right matrix operand
   * @returns A new Matrix22 containing the product l_mat * r_mat
   *
   * @example
   * ```typescript
   * const a = Matrix22.scale(Vector2.fromCopyArray2([2, 2]));
   * const b = Matrix22.rotate(Math.PI / 4);
   * const result = Matrix22.multiply(a, b); // Scale then rotate
   * ```
   */
  static _multiply(l_mat, r_mat, type) {
    const m00 = l_mat._v[0] * r_mat._v[0] + l_mat._v[2] * r_mat._v[1];
    const m10 = l_mat._v[1] * r_mat._v[0] + l_mat._v[3] * r_mat._v[1];
    const m01 = l_mat._v[0] * r_mat._v[2] + l_mat._v[2] * r_mat._v[3];
    const m11 = l_mat._v[1] * r_mat._v[2] + l_mat._v[3] * r_mat._v[3];
    return this._fromCopy4RowMajor(m00, m01, m10, m11, type);
  }
  /**
   * Multiplies two matrices and stores the result in the output matrix.
   * This method avoids creating a new matrix instance for better performance.
   *
   * Note: The parameter types suggest Matrix33, but this appears to be a bug
   * as this should operate on Matrix22 instances.
   *
   * @param l_mat - The left matrix operand
   * @param r_mat - The right matrix operand
   * @param outMat - The mutable matrix to store the result
   * @returns The output matrix containing the product
   */
  static _multiplyTo(l_mat, r_mat, outMat) {
    const m00 = l_mat._v[0] * r_mat._v[0] + l_mat._v[2] * r_mat._v[1];
    const m10 = l_mat._v[1] * r_mat._v[0] + l_mat._v[3] * r_mat._v[1];
    const m01 = l_mat._v[0] * r_mat._v[2] + l_mat._v[2] * r_mat._v[3];
    const m11 = l_mat._v[1] * r_mat._v[2] + l_mat._v[3] * r_mat._v[3];
    return outMat.setComponents(m00, m01, m10, m11);
  }
  /**
   * Returns a string representation of the matrix in a readable format.
   *
   * @returns A string showing the matrix in 2x2 layout
   *
   * @example
   * ```typescript
   * const mat = Matrix22.identity();
   * console.log(mat.toString());
   * // Output:
   * // 1 0
   * // 0 1
   * ```
   */
  toString() {
    return `${this._v[0]} ${this._v[2]}
${this._v[1]} ${this._v[3]} 
`;
  }
  /**
   * Returns an approximate string representation of the matrix with rounded values.
   * Uses financial rounding for cleaner display of floating-point numbers.
   *
   * @returns A string showing the matrix with rounded values
   */
  toStringApproximately() {
    return `${MathUtil.financial(this._v[0])} ${MathUtil.financial(this._v[2])}
${MathUtil.financial(this._v[1])} ${MathUtil.financial(this._v[3])} 
`;
  }
  /**
   * Returns the matrix elements as a flat array in column-major order.
   *
   * @returns An array containing [m00, m10, m01, m11]
   */
  flattenAsArray() {
    return [this._v[0], this._v[1], this._v[2], this._v[3]];
  }
  /**
   * Checks if this is a dummy matrix (empty data).
   *
   * @returns True if the matrix has no data, false otherwise
   */
  isDummy() {
    if (this._v.length === 0) {
      return true;
    }
    return false;
  }
  /**
   * Checks if this matrix is approximately equal to another matrix within a tolerance.
   *
   * @param mat - The matrix to compare with
   * @param delta - The tolerance for comparison (default: Number.EPSILON)
   * @returns True if all corresponding elements are within the tolerance
   */
  isEqual(mat, delta = Number.EPSILON) {
    if (Math.abs(mat._v[0] - this._v[0]) < delta && Math.abs(mat._v[1] - this._v[1]) < delta && Math.abs(mat._v[2] - this._v[2]) < delta && Math.abs(mat._v[3] - this._v[3]) < delta) {
      return true;
    }
    return false;
  }
  /**
   * Checks if this matrix is exactly equal to another matrix.
   * Uses strict equality comparison for all elements.
   *
   * @param mat - The matrix to compare with
   * @returns True if all corresponding elements are exactly equal
   */
  isStrictEqual(mat) {
    if (mat._v[0] === this._v[0] && mat._v[1] === this._v[1] && mat._v[2] === this._v[2] && mat._v[3] === this._v[3]) {
      return true;
    }
    return false;
  }
  /**
   * Gets the matrix element at the specified row and column.
   *
   * @param row_i - The row index (0 or 1)
   * @param column_i - The column index (0 or 1)
   * @returns The matrix element at the specified position
   *
   * @example
   * ```typescript
   * const mat = Matrix22.identity();
   * const m01 = mat.at(0, 1); // Returns 0
   * ```
   */
  at(row_i, column_i) {
    return this._v[row_i + column_i * 2];
  }
  /**
   * Calculates the determinant of this 2x2 matrix.
   *
   * For a 2x2 matrix | a b |, the determinant is ad - bc.
   *                   | c d |
   *
   * @returns The determinant value
   *
   * @example
   * ```typescript
   * const mat = Matrix22.fromCopy4RowMajor(2, 3, 1, 4);
   * const det = mat.determinant(); // Returns 2*4 - 3*1 = 5
   * ```
   */
  determinant() {
    return this._v[0] * this._v[3] - this._v[1] * this._v[2];
  }
  /**
   * Multiplies this matrix by a 2D vector and returns the result.
   *
   * @param vec - The 2D vector to multiply
   * @returns A new Vector2 containing the transformed vector
   *
   * @example
   * ```typescript
   * const rotation = Matrix22.rotate(Math.PI / 2);
   * const vec = Vector2.fromCopyArray2([1, 0]);
   * const result = rotation.multiplyVector(vec); // Rotates (1,0) to (0,1)
   * ```
   */
  multiplyVector(vec) {
    const x = this._v[0] * vec._v[0] + this._v[2] * vec._v[1];
    const y = this._v[1] * vec._v[0] + this._v[3] * vec._v[1];
    return Vector2.fromCopyArray2([x, y]);
  }
  /**
   * Multiplies this matrix by a 2D vector and stores the result in the output vector.
   * This method avoids creating a new vector instance for better performance.
   *
   * @param vec - The 2D vector to multiply
   * @param outVec - The mutable vector to store the result
   * @returns The output vector containing the transformed vector
   */
  multiplyVectorTo(vec, outVec) {
    const x = this._v[0] * vec._v[0] + this._v[2] * vec._v[1];
    const y = this._v[1] * vec._v[0] + this._v[3] * vec._v[1];
    outVec._v[0] = x;
    outVec._v[1] = y;
    return outVec;
  }
  /**
   * Extracts the scale factors from this transformation matrix.
   * Calculates the length of each column vector to determine the scale.
   *
   * @returns A Vector2 containing the scale factors for x and y axes
   *
   * @example
   * ```typescript
   * const scaleAndRotation = Matrix22.multiply(
   *   Matrix22.scale(Vector2.fromCopyArray2([2, 3])),
   *   Matrix22.rotate(Math.PI / 4)
   * );
   * const scale = scaleAndRotation.getScale(); // Returns approximately [2, 3]
   * ```
   */
  getScale() {
    return Vector2.fromCopyArray2([Math.hypot(this.m00, this.m01), Math.hypot(this.m10, this.m11)]);
  }
  /**
   * Extracts the scale factors from this transformation matrix and stores them in the output vector.
   * This method avoids creating a new vector instance for better performance.
   *
   * @param outVec - The mutable vector to store the scale factors
   * @returns The output vector containing the scale factors
   */
  getScaleTo(outVec) {
    outVec._v[0] = Math.hypot(this._v[0], this._v[2]);
    outVec._v[1] = Math.hypot(this._v[1], this._v[3]);
    return outVec;
  }
  /**
   * Creates a deep copy of this matrix.
   *
   * @returns A new Matrix22 instance with the same values
   */
  clone() {
    return this.constructor.fromCopy4RowMajor(this._v[0], this._v[2], this._v[1], this._v[3]);
  }
  /**
   * Creates a new Matrix22 from individual components in row-major order.
   *
   * Row-major means you specify values as they appear visually:
   * ```
   * | m00 m01 |
   * | m10 m11 |
   * ```
   *
   * Note: Internally, WebGL matrices are stored in column-major order.
   *
   * @param m00 - Element at row 0, column 0
   * @param m01 - Element at row 0, column 1
   * @param m10 - Element at row 1, column 0
   * @param m11 - Element at row 1, column 1
   * @returns A new Matrix22 with the specified values
   *
   * @example
   * ```typescript
   * const mat = Matrix22.fromCopy4RowMajor(1, 2, 3, 4);
   * // Creates:
   * // | 1 2 |
   * // | 3 4 |
   * ```
   */
  static _fromCopy4RowMajor(m00, m01, m10, m11, type) {
    const v = new type(4);
    v[0] = m00;
    v[2] = m01;
    v[1] = m10;
    v[3] = m11;
    return new this(v, { type });
  }
  /**
   * Creates a new Matrix22 from individual components in column-major order.
   *
   * Column-major means you specify values column by column:
   * First column: m00, m10
   * Second column: m01, m11
   *
   * Note: WebGL matrices are stored in column-major order internally.
   *
   * @param m00 - Element at row 0, column 0
   * @param m10 - Element at row 1, column 0
   * @param m01 - Element at row 0, column 1
   * @param m11 - Element at row 1, column 1
   * @returns A new Matrix22 with the specified values
   */
  static _fromCopy4ColumnMajor(m00, m10, m01, m11, type) {
    const v = new type(4);
    v[0] = m00;
    v[2] = m01;
    v[1] = m10;
    v[3] = m11;
    return new this(v, { type });
  }
  /**
   * Creates a new Matrix22 that directly uses the provided Float32Array.
   * The array is used as-is without copying, so modifications to the array
   * will affect the matrix.
   *
   * @param float32Array - Float32Array containing matrix values in column-major order
   * @returns A new Matrix22 using the provided array
   */
  static _fromTypedArrayColumnMajor(array, type) {
    return new this(array, { type });
  }
  /**
   * Creates a new Matrix22 by copying values from a Float32Array in column-major order.
   *
   * @param float32Array - Float32Array containing matrix values in column-major order
   * @returns A new Matrix22 with copied values
   */
  static _fromCopyTypedArrayColumnMajor(array, type) {
    const v = new type(4);
    v.set(array);
    return new this(v, { type });
  }
  /**
   * Creates a new Matrix22 by copying values from a Float32Array in row-major order.
   *
   * @param array - Float32Array containing matrix values in row-major order
   * @returns A new Matrix22 with values converted to column-major order
   */
  static _fromCopyTypedArrayRowMajor(array, type) {
    const v = new type(4);
    v[0] = array[0];
    v[2] = array[1];
    v[1] = array[2];
    v[3] = array[3];
    return new this(v, { type });
  }
  /**
   * Creates a new Matrix22 by copying values from another IMatrix22.
   *
   * @param mat - The matrix to copy from
   * @returns A new Matrix22 with copied values
   */
  static _fromCopyMatrix22(mat, type) {
    const v = new type(4);
    v[0] = mat._v[0];
    v[1] = mat._v[1];
    v[2] = mat._v[2];
    v[3] = mat._v[3];
    return new this(v, { type });
  }
  /**
   * Creates a new Matrix22 from a 4-element array in column-major order.
   *
   * @param array - Array4 containing exactly 4 numbers in column-major order
   * @returns A new Matrix22 with the array values
   */
  static _fromCopyArray4ColumnMajor(array, type) {
    const v = new type(4);
    v.set(array);
    return new this(v, { type });
  }
  /**
   * Creates a new Matrix22 from a variable-length array in column-major order.
   * Only the first 4 elements are used.
   *
   * @param array - Array containing matrix values in column-major order
   * @returns A new Matrix22 with the first 4 array values
   */
  static _fromCopyArrayColumnMajor(array, type) {
    const v = new type(4);
    v.set(array);
    return new this(v, { type });
  }
  /**
   * Creates a new Matrix22 from a 4-element array in row-major order.
   *
   * @param array - Array4 containing exactly 4 numbers in row-major order
   * @returns A new Matrix22 with values converted to column-major order
   */
  static _fromCopyArray4RowMajor(array, type) {
    const v = new type(4);
    v[0] = array[0];
    v[2] = array[1];
    v[1] = array[2];
    v[3] = array[3];
    return new this(v, { type });
  }
  /**
   * Creates a new Matrix22 from a variable-length array in row-major order.
   * Only the first 4 elements are used.
   *
   * @param array - Array containing matrix values in row-major order
   * @returns A new Matrix22 with values converted to column-major order
   */
  static _fromCopyArrayRowMajor(array, type) {
    const v = new type(4);
    v[0] = array[0];
    v[2] = array[1];
    v[1] = array[2];
    v[3] = array[3];
    return new this(v, { type });
  }
};
var Matrix22 = class extends Matrix22_ {
  /**
   * Creates a new Matrix22 instance.
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
var Matrix22D = class extends Matrix22_ {
  /**
   * Creates a new Matrix22D instance.
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
  Matrix22,
  Matrix22D,
  Matrix22 as Matrix22F,
  Matrix22_
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9NYXRyaXgyMi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBBcnJheTQgfSBmcm9tICcuLi8uLi90eXBlcyc7XG5pbXBvcnQgdHlwZSB7IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yLCBUeXBlZEFycmF5IH0gZnJvbSAnLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHsgQ29tcG9zaXRpb25UeXBlIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvQ29tcG9zaXRpb25UeXBlJztcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4uL21pc2MvTG9nZ2VyJztcbmltcG9ydCB7IEFic3RyYWN0TWF0cml4IH0gZnJvbSAnLi9BYnN0cmFjdE1hdHJpeCc7XG5pbXBvcnQgdHlwZSB7IElNYXRyaXgyMiwgSU11dGFibGVNYXRyaXgyMiB9IGZyb20gJy4vSU1hdHJpeCc7XG5pbXBvcnQgdHlwZSB7IElWZWN0b3IyIH0gZnJvbSAnLi9JVmVjdG9yJztcbmltcG9ydCB7IE1hdGhVdGlsIH0gZnJvbSAnLi9NYXRoVXRpbCc7XG5pbXBvcnQgdHlwZSB7IE11dGFibGVWZWN0b3IyIH0gZnJvbSAnLi9NdXRhYmxlVmVjdG9yMic7XG5pbXBvcnQgeyBWZWN0b3IyIH0gZnJvbSAnLi9WZWN0b3IyJztcblxuLyoqXG4gKiBBIDJ4MiBtYXRyaXggY2xhc3MgZm9yIDJEIHRyYW5zZm9ybWF0aW9ucyBhbmQgbGluZWFyIGFsZ2VicmEgb3BlcmF0aW9ucy5cbiAqXG4gKiBUaGlzIGltbXV0YWJsZSBtYXRyaXggY2xhc3Mgc3VwcG9ydHMgY29tbW9uIDJEIHRyYW5zZm9ybWF0aW9ucyBpbmNsdWRpbmdcbiAqIHJvdGF0aW9uLCBzY2FsaW5nLCBhbmQgZ2VuZXJhbCBsaW5lYXIgdHJhbnNmb3JtYXRpb25zLiBUaGUgbWF0cml4IGRhdGFcbiAqIGlzIHN0b3JlZCBpbiBjb2x1bW4tbWFqb3Igb3JkZXIgYXMgYSBGbG9hdDMyQXJyYXkgZm9yIFdlYkdMIGNvbXBhdGliaWxpdHkuXG4gKlxuICogTWF0cml4IGxheW91dDpcbiAqIGBgYFxuICogfCBtMDAgbTAxIHxcbiAqIHwgbTEwIG0xMSB8XG4gKiBgYGBcbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHlwZXNjcmlwdFxuICogLy8gQ3JlYXRlIGlkZW50aXR5IG1hdHJpeFxuICogY29uc3QgaWRlbnRpdHkgPSBNYXRyaXgyMi5pZGVudGl0eSgpO1xuICpcbiAqIC8vIENyZWF0ZSByb3RhdGlvbiBtYXRyaXhcbiAqIGNvbnN0IHJvdGF0aW9uID0gTWF0cml4MjIucm90YXRlKE1hdGguUEkgLyA0KTtcbiAqXG4gKiAvLyBDcmVhdGUgc2NhbGUgbWF0cml4XG4gKiBjb25zdCBzY2FsZSA9IE1hdHJpeDIyLnNjYWxlKFZlY3RvcjIuZnJvbUNvcHlBcnJheTIoWzIsIDNdKSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIE1hdHJpeDIyXzxUIGV4dGVuZHMgRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3I+IGV4dGVuZHMgQWJzdHJhY3RNYXRyaXggaW1wbGVtZW50cyBJTWF0cml4MjIge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNYXRyaXgyMl8gaW5zdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSBtIC0gVHlwZWQgYXJyYXkgY29udGFpbmluZyBtYXRyaXggdmFsdWVzIGluIGNvbHVtbi1tYWpvciBvcmRlclxuICAgKiBAcGFyYW0gX29wdGlvbnMgLSBDb25maWd1cmF0aW9uIG9iamVjdCBjb250YWluaW5nIHRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvclxuICAgKi9cbiAgY29uc3RydWN0b3IobTogVHlwZWRBcnJheSwgX29wdGlvbnM6IHsgdHlwZTogVCB9KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl92ID0gbTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCByb3cgMCwgY29sdW1uIDAuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBtMDAgY29tcG9uZW50IG9mIHRoZSBtYXRyaXhcbiAgICovXG4gIHB1YmxpYyBnZXQgbTAwKCkge1xuICAgIHJldHVybiB0aGlzLl92WzBdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHJvdyAxLCBjb2x1bW4gMC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG0xMCBjb21wb25lbnQgb2YgdGhlIG1hdHJpeFxuICAgKi9cbiAgcHVibGljIGdldCBtMTAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMV07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF0cml4IGVsZW1lbnQgYXQgcm93IDAsIGNvbHVtbiAxLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbTAxIGNvbXBvbmVudCBvZiB0aGUgbWF0cml4XG4gICAqL1xuICBwdWJsaWMgZ2V0IG0wMSgpIHtcbiAgICByZXR1cm4gdGhpcy5fdlsyXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCByb3cgMSwgY29sdW1uIDEuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBtMTEgY29tcG9uZW50IG9mIHRoZSBtYXRyaXhcbiAgICovXG4gIHB1YmxpYyBnZXQgbTExKCkge1xuICAgIHJldHVybiB0aGlzLl92WzNdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNsYXNzIG5hbWUgZm9yIHRoaXMgbWF0cml4IHR5cGUuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBzdHJpbmcgJ01hdHJpeDIyJ1xuICAgKi9cbiAgZ2V0IGNsYXNzTmFtZSgpIHtcbiAgICByZXR1cm4gJ01hdHJpeDIyJztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb21wb3NpdGlvbiB0eXBlIGZvciB0aGlzIG1hdHJpeC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIENvbXBvc2l0aW9uVHlwZS5NYXQyIGVudW0gdmFsdWVcbiAgICovXG4gIHN0YXRpYyBnZXQgY29tcG9zaXRpb25UeXBlKCkge1xuICAgIHJldHVybiBDb21wb3NpdGlvblR5cGUuTWF0MjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgMngyIHplcm8gbWF0cml4LlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyBNYXRyaXgyMiB3aXRoIGFsbCBlbGVtZW50cyBzZXQgdG8gMFxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IHplcm8gPSBNYXRyaXgyMi56ZXJvKCk7XG4gICAqIC8vIFJldHVybnM6XG4gICAqIC8vIHwgMCAwIHxcbiAgICogLy8gfCAwIDAgfFxuICAgKiBgYGBcbiAgICovXG4gIHN0YXRpYyBfemVybyh0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcik6IElNYXRyaXgyMiB7XG4gICAgcmV0dXJuIHRoaXMuX2Zyb21Db3B5NFJvd01ham9yKDAsIDAsIDAsIDAsIHR5cGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSAyeDIgaWRlbnRpdHkgbWF0cml4LlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyBNYXRyaXgyMiBpZGVudGl0eSBtYXRyaXhcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBpZGVudGl0eSA9IE1hdHJpeDIyLmlkZW50aXR5KCk7XG4gICAqIC8vIFJldHVybnM6XG4gICAqIC8vIHwgMSAwIHxcbiAgICogLy8gfCAwIDEgfFxuICAgKiBgYGBcbiAgICovXG4gIHN0YXRpYyBfaWRlbnRpdHkodHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpOiBJTWF0cml4MjIge1xuICAgIHJldHVybiB0aGlzLl9mcm9tQ29weTRSb3dNYWpvcigxLCAwLCAwLCAxLCB0eXBlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZHVtbXkgbWF0cml4IHdpdGggZW1wdHkgZGF0YS5cbiAgICogVXNlZCBhcyBhIHBsYWNlaG9sZGVyIHdoZW4gbm8gdmFsaWQgbWF0cml4IGRhdGEgaXMgYXZhaWxhYmxlLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyBNYXRyaXgyMiB3aXRoIGVtcHR5IEZsb2F0MzJBcnJheVxuICAgKi9cbiAgc3RhdGljIF9kdW1teSh0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcik6IElNYXRyaXgyMiB7XG4gICAgcmV0dXJuIG5ldyB0aGlzKG5ldyB0eXBlKDApLCB7IHR5cGUgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyB0aGUgdHJhbnNwb3NlIG9mIHRoZSBnaXZlbiBtYXRyaXguXG4gICAqIFRoZSB0cmFuc3Bvc2Ugc3dhcHMgcm93cyBhbmQgY29sdW1uczogKGksaikgYmVjb21lcyAoaixpKS5cbiAgICpcbiAgICogQHBhcmFtIG1hdCAtIFRoZSBtYXRyaXggdG8gdHJhbnNwb3NlXG4gICAqIEByZXR1cm5zIEEgbmV3IE1hdHJpeDIyIHRoYXQgaXMgdGhlIHRyYW5zcG9zZSBvZiB0aGUgaW5wdXQgbWF0cml4XG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgbWF0ID0gTWF0cml4MjIuZnJvbUNvcHk0Um93TWFqb3IoMSwgMiwgMywgNCk7XG4gICAqIGNvbnN0IHRyYW5zcG9zZWQgPSBNYXRyaXgyMi50cmFuc3Bvc2UobWF0KTtcbiAgICogLy8gT3JpZ2luYWw6ICAgIFRyYW5zcG9zZWQ6XG4gICAqIC8vIHwgMSAyIHwgIC0+ICB8IDEgMyB8XG4gICAqIC8vIHwgMyA0IHwgICAgICB8IDIgNCB8XG4gICAqIGBgYFxuICAgKi9cbiAgc3RhdGljIF90cmFuc3Bvc2UobWF0OiBJTWF0cml4MjIsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKTogSU1hdHJpeDIyIHtcbiAgICByZXR1cm4gdGhpcy5fZnJvbUNvcHk0Um93TWFqb3IobWF0Ll92WzBdLCBtYXQuX3ZbMV0sIG1hdC5fdlsyXSwgbWF0Ll92WzNdLCB0eXBlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRlbXB0cyB0byBjcmVhdGUgdGhlIGludmVyc2Ugb2YgdGhlIGdpdmVuIG1hdHJpeC5cbiAgICpcbiAgICogVW5saWtlIGBpbnZlcnRgLCB0aGlzIG1ldGhvZCBuZXZlciByZXR1cm5zIGEgbWF0cml4IGZpbGxlZCB3aXRoXG4gICAqIGBJbmZpbml0eWAvYE5hTmA6IGl0IHJldHVybnMgYG51bGxgIHdoZW4gdGhlIG1hdHJpeCBpcyBudW1lcmljYWxseVxuICAgKiBzaW5ndWxhciAoc2VlIHtAbGluayBNYXRoVXRpbC5pc1Npbmd1bGFyRGV0fSkuXG4gICAqXG4gICAqIEBwYXJhbSBtYXQgLSBUaGUgbWF0cml4IHRvIGludmVydFxuICAgKiBAcmV0dXJucyBBIG5ldyBNYXRyaXgyMiwgb3IgbnVsbCBpZiB0aGUgbWF0cml4IGlzIG5vdCBpbnZlcnRpYmxlXG4gICAqL1xuICBzdGF0aWMgX3RyeUludmVydChtYXQ6IElNYXRyaXgyMiwgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpOiBJTWF0cml4MjIgfCBudWxsIHtcbiAgICBjb25zdCBkZXQgPSBtYXQuZGV0ZXJtaW5hbnQoKTtcbiAgICBjb25zdCByb3dOb3JtMCA9IE1hdGguYWJzKG1hdC5fdlswXSkgKyBNYXRoLmFicyhtYXQuX3ZbMl0pO1xuICAgIGNvbnN0IHJvd05vcm0xID0gTWF0aC5hYnMobWF0Ll92WzFdKSArIE1hdGguYWJzKG1hdC5fdlszXSk7XG4gICAgaWYgKE1hdGhVdGlsLmlzU2luZ3VsYXJEZXQoZGV0LCByb3dOb3JtMCAqIHJvd05vcm0xLCBNYXRoVXRpbC5nZXRTaW5ndWxhckVwc2lsb24obWF0Ll92LkJZVEVTX1BFUl9FTEVNRU5UKSkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGludkRldCA9IDEgLyBkZXQ7XG4gICAgY29uc3QgbTAwID0gbWF0Ll92WzNdICogaW52RGV0O1xuICAgIGNvbnN0IG0wMSA9IC1tYXQuX3ZbMl0gKiBpbnZEZXQ7XG4gICAgY29uc3QgbTEwID0gLW1hdC5fdlsxXSAqIGludkRldDtcbiAgICBjb25zdCBtMTEgPSBtYXQuX3ZbMF0gKiBpbnZEZXQ7XG5cbiAgICByZXR1cm4gdGhpcy5fZnJvbUNvcHk0Um93TWFqb3IobTAwLCBtMDEsIG0xMCwgbTExLCB0eXBlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIHRoZSBpbnZlcnNlIG9mIHRoZSBnaXZlbiBtYXRyaXguXG4gICAqXG4gICAqIEZvciBhIDJ4MiBtYXRyaXgsIHRoZSBpbnZlcnNlIGlzIGNhbGN1bGF0ZWQgdXNpbmcgdGhlIGZvcm11bGE6XG4gICAqIEFeKC0xKSA9ICgxL2RldChBKSkgKiB8IGQgLWIgfFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgIHwtYyAgYSB8XG4gICAqIHdoZXJlIEEgPSB8IGEgYiB8IGFuZCBkZXQoQSkgPSBhZCAtIGJjXG4gICAqICAgICAgICAgICB8IGMgZCB8XG4gICAqXG4gICAqIElmIHRoZSBtYXRyaXggaXMgbnVtZXJpY2FsbHkgc2luZ3VsYXIsIGFuIGlkZW50aXR5IG1hdHJpeCBpcyByZXR1cm5lZFxuICAgKiBpbnN0ZWFkIG9mIGRpdmlkaW5nIGJ5IHplcm8uIFVzZSB7QGxpbmsgTWF0cml4MjIudHJ5SW52ZXJ0fSB3aGVuIHRoZVxuICAgKiBjYWxsZXIgbmVlZHMgdG8gZGV0ZWN0IHRoZSBmYWlsdXJlLlxuICAgKlxuICAgKiBAcGFyYW0gbWF0IC0gVGhlIG1hdHJpeCB0byBpbnZlcnRcbiAgICogQHJldHVybnMgQSBuZXcgTWF0cml4MjIgdGhhdCBpcyB0aGUgaW52ZXJzZSBvZiB0aGUgaW5wdXQgbWF0cml4LFxuICAgKiAgICAgICAgICBvciB0aGUgaWRlbnRpdHkgbWF0cml4IGlmIHRoZSBpbnB1dCBpcyBzaW5ndWxhclxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IG1hdCA9IE1hdHJpeDIyLmZyb21Db3B5NFJvd01ham9yKDIsIDAsIDAsIDIpO1xuICAgKiBjb25zdCBpbnZlcnNlID0gTWF0cml4MjIuaW52ZXJ0KG1hdCk7XG4gICAqIC8vIFJldHVybnM6XG4gICAqIC8vIHwgMC41ICAgMCB8XG4gICAqIC8vIHwgICAwIDAuNSB8XG4gICAqIGBgYFxuICAgKi9cbiAgc3RhdGljIF9pbnZlcnQobWF0OiBJTWF0cml4MjIsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKTogSU1hdHJpeDIyIHtcbiAgICBjb25zdCBpbnZlcnRlZCA9IHRoaXMuX3RyeUludmVydChtYXQsIHR5cGUpO1xuICAgIGlmIChpbnZlcnRlZCAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGludmVydGVkO1xuICAgIH1cblxuICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCd0aGUgbWF0cml4IGlzIHNpbmd1bGFyIGFuZCBjYW5ub3QgYmUgaW52ZXJ0ZWQuIFJldHVybmluZyBhbiBpZGVudGl0eSBtYXRyaXggaW5zdGVhZC4nKTtcbiAgICByZXR1cm4gdGhpcy5fZnJvbUNvcHk0Um93TWFqb3IoMSwgMCwgMCwgMSwgdHlwZSk7XG4gIH1cblxuICAvKipcbiAgICogQXR0ZW1wdHMgdG8gY2FsY3VsYXRlIHRoZSBpbnZlcnNlIG9mIHRoZSBnaXZlbiBtYXRyaXggYW5kIHN0b3JlcyB0aGVcbiAgICogcmVzdWx0IGluIHRoZSBvdXRwdXQgbWF0cml4LlxuICAgKlxuICAgKiBUaGUgb3V0cHV0IG1hdHJpeCBpcyBsZWZ0IHVudG91Y2hlZCB3aGVuIHRoZSBpbnB1dCBpcyBudW1lcmljYWxseVxuICAgKiBzaW5ndWxhciwgd2hpY2ggbGV0cyBjYWxsZXJzIGtlZXAgdGhlIHByZXZpb3VzIHZhbGlkIHZhbHVlLlxuICAgKlxuICAgKiBAcGFyYW0gbWF0IC0gVGhlIG1hdHJpeCB0byBpbnZlcnRcbiAgICogQHBhcmFtIG91dE1hdCAtIFRoZSBtdXRhYmxlIG1hdHJpeCB0byBzdG9yZSB0aGUgcmVzdWx0XG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIGludmVyc2lvbiBzdWNjZWVkZWQsIGZhbHNlIGlmIHRoZSBtYXRyaXggaXMgc2luZ3VsYXJcbiAgICovXG4gIHN0YXRpYyBfdHJ5SW52ZXJ0VG8obWF0OiBJTWF0cml4MjIsIG91dE1hdDogSU11dGFibGVNYXRyaXgyMik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGRldCA9IG1hdC5kZXRlcm1pbmFudCgpO1xuICAgIGNvbnN0IHJvd05vcm0wID0gTWF0aC5hYnMobWF0Ll92WzBdKSArIE1hdGguYWJzKG1hdC5fdlsyXSk7XG4gICAgY29uc3Qgcm93Tm9ybTEgPSBNYXRoLmFicyhtYXQuX3ZbMV0pICsgTWF0aC5hYnMobWF0Ll92WzNdKTtcbiAgICBpZiAoTWF0aFV0aWwuaXNTaW5ndWxhckRldChkZXQsIHJvd05vcm0wICogcm93Tm9ybTEsIE1hdGhVdGlsLmdldFNpbmd1bGFyRXBzaWxvbihtYXQuX3YuQllURVNfUEVSX0VMRU1FTlQpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IGludkRldCA9IDEgLyBkZXQ7XG4gICAgb3V0TWF0LnNldENvbXBvbmVudHMobWF0Ll92WzNdICogaW52RGV0LCAtbWF0Ll92WzJdICogaW52RGV0LCAtbWF0Ll92WzFdICogaW52RGV0LCBtYXQuX3ZbMF0gKiBpbnZEZXQpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIGludmVyc2Ugb2YgdGhlIGdpdmVuIG1hdHJpeCBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gdGhlIG91dHB1dCBtYXRyaXguXG4gICAqIFRoaXMgbWV0aG9kIGF2b2lkcyBjcmVhdGluZyBhIG5ldyBtYXRyaXggaW5zdGFuY2UgZm9yIGJldHRlciBwZXJmb3JtYW5jZS5cbiAgICpcbiAgICogSWYgdGhlIG1hdHJpeCBpcyBudW1lcmljYWxseSBzaW5ndWxhciwgdGhlIG91dHB1dCBtYXRyaXggaXMgc2V0IHRvIHRoZVxuICAgKiBpZGVudGl0eSBtYXRyaXggaW5zdGVhZCBvZiBiZWluZyBmaWxsZWQgd2l0aCBgSW5maW5pdHlgL2BOYU5gLlxuICAgKiBVc2Uge0BsaW5rIE1hdHJpeDIyLnRyeUludmVydFRvfSB3aGVuIHRoZSBjYWxsZXIgbmVlZHMgdG8gZGV0ZWN0IHRoZSBmYWlsdXJlLlxuICAgKlxuICAgKiBAcGFyYW0gbWF0IC0gVGhlIG1hdHJpeCB0byBpbnZlcnRcbiAgICogQHBhcmFtIG91dE1hdCAtIFRoZSBtdXRhYmxlIG1hdHJpeCB0byBzdG9yZSB0aGUgcmVzdWx0XG4gICAqIEByZXR1cm5zIFRoZSBvdXRwdXQgbWF0cml4IGNvbnRhaW5pbmcgdGhlIGludmVyc2UsIG9yIHRoZSBpZGVudGl0eSBtYXRyaXggaWYgdGhlIGlucHV0IGlzIHNpbmd1bGFyXG4gICAqL1xuICBzdGF0aWMgX2ludmVydFRvKG1hdDogSU1hdHJpeDIyLCBvdXRNYXQ6IElNdXRhYmxlTWF0cml4MjIpOiBJTXV0YWJsZU1hdHJpeDIyIHtcbiAgICBpZiAodGhpcy5fdHJ5SW52ZXJ0VG8obWF0LCBvdXRNYXQpKSB7XG4gICAgICByZXR1cm4gb3V0TWF0O1xuICAgIH1cblxuICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCd0aGUgbWF0cml4IGlzIHNpbmd1bGFyIGFuZCBjYW5ub3QgYmUgaW52ZXJ0ZWQuIFJldHVybmluZyBhbiBpZGVudGl0eSBtYXRyaXggaW5zdGVhZC4nKTtcbiAgICByZXR1cm4gb3V0TWF0LmlkZW50aXR5KCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIDJEIHJvdGF0aW9uIG1hdHJpeCBmb3IgdGhlIGdpdmVuIGFuZ2xlLlxuICAgKlxuICAgKiBUaGUgcm90YXRpb24gbWF0cml4IGlzOlxuICAgKiB8IGNvcyhcdTAzQjgpIC1zaW4oXHUwM0I4KSB8XG4gICAqIHwgc2luKFx1MDNCOCkgIGNvcyhcdTAzQjgpIHxcbiAgICpcbiAgICogQHBhcmFtIHJhZGlhbiAtIFRoZSByb3RhdGlvbiBhbmdsZSBpbiByYWRpYW5zIChwb3NpdGl2ZSB2YWx1ZXMgcm90YXRlIGNvdW50ZXItY2xvY2t3aXNlKVxuICAgKiBAcmV0dXJucyBBIG5ldyBNYXRyaXgyMiByZXByZXNlbnRpbmcgdGhlIHJvdGF0aW9uIHRyYW5zZm9ybWF0aW9uXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogLy8gOTAtZGVncmVlIGNvdW50ZXItY2xvY2t3aXNlIHJvdGF0aW9uXG4gICAqIGNvbnN0IHJvdGF0aW9uID0gTWF0cml4MjIucm90YXRlKE1hdGguUEkgLyAyKTtcbiAgICogYGBgXG4gICAqL1xuICBzdGF0aWMgX3JvdGF0ZShyYWRpYW46IG51bWJlciwgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpOiBJTWF0cml4MjIge1xuICAgIGNvbnN0IGNvcyA9IE1hdGguY29zKHJhZGlhbik7XG4gICAgY29uc3Qgc2luID0gTWF0aC5zaW4ocmFkaWFuKTtcbiAgICByZXR1cm4gdGhpcy5fZnJvbUNvcHk0Um93TWFqb3IoY29zLCAtc2luLCBzaW4sIGNvcywgdHlwZSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIDJEIHNjYWxpbmcgbWF0cml4IGZyb20gYSAyRCB2ZWN0b3IuXG4gICAqXG4gICAqIFRoZSBzY2FsaW5nIG1hdHJpeCBpczpcbiAgICogfCBzeCAgMCB8XG4gICAqIHwgIDAgc3kgfFxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gQSBWZWN0b3IyIGNvbnRhaW5pbmcgdGhlIHNjYWxlIGZhY3RvcnMgZm9yIHggYW5kIHkgYXhlc1xuICAgKiBAcmV0dXJucyBBIG5ldyBNYXRyaXgyMiByZXByZXNlbnRpbmcgdGhlIHNjYWxpbmcgdHJhbnNmb3JtYXRpb25cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBzY2FsZSA9IE1hdHJpeDIyLnNjYWxlKFZlY3RvcjIuZnJvbUNvcHlBcnJheTIoWzIsIDNdKSk7XG4gICAqIC8vIENyZWF0ZXMgYSBtYXRyaXggdGhhdCBzY2FsZXMgeCBieSAyIGFuZCB5IGJ5IDNcbiAgICogYGBgXG4gICAqL1xuICBzdGF0aWMgX3NjYWxlKHZlYzogSVZlY3RvcjIsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKTogSU1hdHJpeDIyIHtcbiAgICByZXR1cm4gdGhpcy5fZnJvbUNvcHk0Um93TWFqb3IodmVjLl92WzBdLCAwLCAwLCB2ZWMuX3ZbMV0sIHR5cGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgdHdvIDJ4MiBtYXRyaWNlcyBhbmQgcmV0dXJucyB0aGUgcmVzdWx0LlxuICAgKiBNYXRyaXggbXVsdGlwbGljYXRpb24gaXMgbm90IGNvbW11dGF0aXZlOiBBICogQiBcdTIyNjAgQiAqIEEgaW4gZ2VuZXJhbC5cbiAgICpcbiAgICogQHBhcmFtIGxfbWF0IC0gVGhlIGxlZnQgbWF0cml4IG9wZXJhbmRcbiAgICogQHBhcmFtIHJfbWF0IC0gVGhlIHJpZ2h0IG1hdHJpeCBvcGVyYW5kXG4gICAqIEByZXR1cm5zIEEgbmV3IE1hdHJpeDIyIGNvbnRhaW5pbmcgdGhlIHByb2R1Y3QgbF9tYXQgKiByX21hdFxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IGEgPSBNYXRyaXgyMi5zY2FsZShWZWN0b3IyLmZyb21Db3B5QXJyYXkyKFsyLCAyXSkpO1xuICAgKiBjb25zdCBiID0gTWF0cml4MjIucm90YXRlKE1hdGguUEkgLyA0KTtcbiAgICogY29uc3QgcmVzdWx0ID0gTWF0cml4MjIubXVsdGlwbHkoYSwgYik7IC8vIFNjYWxlIHRoZW4gcm90YXRlXG4gICAqIGBgYFxuICAgKi9cbiAgc3RhdGljIF9tdWx0aXBseShsX21hdDogSU1hdHJpeDIyLCByX21hdDogSU1hdHJpeDIyLCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcik6IElNYXRyaXgyMiB7XG4gICAgY29uc3QgbTAwID0gbF9tYXQuX3ZbMF0gKiByX21hdC5fdlswXSArIGxfbWF0Ll92WzJdICogcl9tYXQuX3ZbMV07XG4gICAgY29uc3QgbTEwID0gbF9tYXQuX3ZbMV0gKiByX21hdC5fdlswXSArIGxfbWF0Ll92WzNdICogcl9tYXQuX3ZbMV07XG5cbiAgICBjb25zdCBtMDEgPSBsX21hdC5fdlswXSAqIHJfbWF0Ll92WzJdICsgbF9tYXQuX3ZbMl0gKiByX21hdC5fdlszXTtcbiAgICBjb25zdCBtMTEgPSBsX21hdC5fdlsxXSAqIHJfbWF0Ll92WzJdICsgbF9tYXQuX3ZbM10gKiByX21hdC5fdlszXTtcblxuICAgIHJldHVybiB0aGlzLl9mcm9tQ29weTRSb3dNYWpvcihtMDAsIG0wMSwgbTEwLCBtMTEsIHR5cGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgdHdvIG1hdHJpY2VzIGFuZCBzdG9yZXMgdGhlIHJlc3VsdCBpbiB0aGUgb3V0cHV0IG1hdHJpeC5cbiAgICogVGhpcyBtZXRob2QgYXZvaWRzIGNyZWF0aW5nIGEgbmV3IG1hdHJpeCBpbnN0YW5jZSBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlLlxuICAgKlxuICAgKiBOb3RlOiBUaGUgcGFyYW1ldGVyIHR5cGVzIHN1Z2dlc3QgTWF0cml4MzMsIGJ1dCB0aGlzIGFwcGVhcnMgdG8gYmUgYSBidWdcbiAgICogYXMgdGhpcyBzaG91bGQgb3BlcmF0ZSBvbiBNYXRyaXgyMiBpbnN0YW5jZXMuXG4gICAqXG4gICAqIEBwYXJhbSBsX21hdCAtIFRoZSBsZWZ0IG1hdHJpeCBvcGVyYW5kXG4gICAqIEBwYXJhbSByX21hdCAtIFRoZSByaWdodCBtYXRyaXggb3BlcmFuZFxuICAgKiBAcGFyYW0gb3V0TWF0IC0gVGhlIG11dGFibGUgbWF0cml4IHRvIHN0b3JlIHRoZSByZXN1bHRcbiAgICogQHJldHVybnMgVGhlIG91dHB1dCBtYXRyaXggY29udGFpbmluZyB0aGUgcHJvZHVjdFxuICAgKi9cbiAgc3RhdGljIF9tdWx0aXBseVRvKGxfbWF0OiBJTWF0cml4MjIsIHJfbWF0OiBJTWF0cml4MjIsIG91dE1hdDogSU11dGFibGVNYXRyaXgyMik6IElNdXRhYmxlTWF0cml4MjIge1xuICAgIGNvbnN0IG0wMCA9IGxfbWF0Ll92WzBdICogcl9tYXQuX3ZbMF0gKyBsX21hdC5fdlsyXSAqIHJfbWF0Ll92WzFdO1xuICAgIGNvbnN0IG0xMCA9IGxfbWF0Ll92WzFdICogcl9tYXQuX3ZbMF0gKyBsX21hdC5fdlszXSAqIHJfbWF0Ll92WzFdO1xuXG4gICAgY29uc3QgbTAxID0gbF9tYXQuX3ZbMF0gKiByX21hdC5fdlsyXSArIGxfbWF0Ll92WzJdICogcl9tYXQuX3ZbM107XG4gICAgY29uc3QgbTExID0gbF9tYXQuX3ZbMV0gKiByX21hdC5fdlsyXSArIGxfbWF0Ll92WzNdICogcl9tYXQuX3ZbM107XG5cbiAgICByZXR1cm4gb3V0TWF0LnNldENvbXBvbmVudHMobTAwLCBtMDEsIG0xMCwgbTExKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBtYXRyaXggaW4gYSByZWFkYWJsZSBmb3JtYXQuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgc3RyaW5nIHNob3dpbmcgdGhlIG1hdHJpeCBpbiAyeDIgbGF5b3V0XG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgbWF0ID0gTWF0cml4MjIuaWRlbnRpdHkoKTtcbiAgICogY29uc29sZS5sb2cobWF0LnRvU3RyaW5nKCkpO1xuICAgKiAvLyBPdXRwdXQ6XG4gICAqIC8vIDEgMFxuICAgKiAvLyAwIDFcbiAgICogYGBgXG4gICAqL1xuICB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gYCR7dGhpcy5fdlswXX0gJHt0aGlzLl92WzJdfVxcbiR7dGhpcy5fdlsxXX0gJHt0aGlzLl92WzNdfSBcXG5gO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gYXBwcm94aW1hdGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBtYXRyaXggd2l0aCByb3VuZGVkIHZhbHVlcy5cbiAgICogVXNlcyBmaW5hbmNpYWwgcm91bmRpbmcgZm9yIGNsZWFuZXIgZGlzcGxheSBvZiBmbG9hdGluZy1wb2ludCBudW1iZXJzLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIHN0cmluZyBzaG93aW5nIHRoZSBtYXRyaXggd2l0aCByb3VuZGVkIHZhbHVlc1xuICAgKi9cbiAgdG9TdHJpbmdBcHByb3hpbWF0ZWx5KCkge1xuICAgIHJldHVybiBgJHtNYXRoVXRpbC5maW5hbmNpYWwodGhpcy5fdlswXSl9ICR7TWF0aFV0aWwuZmluYW5jaWFsKHRoaXMuX3ZbMl0pfVxcbiR7TWF0aFV0aWwuZmluYW5jaWFsKHRoaXMuX3ZbMV0pfSAke01hdGhVdGlsLmZpbmFuY2lhbCh0aGlzLl92WzNdKX0gXFxuYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBtYXRyaXggZWxlbWVudHMgYXMgYSBmbGF0IGFycmF5IGluIGNvbHVtbi1tYWpvciBvcmRlci5cbiAgICpcbiAgICogQHJldHVybnMgQW4gYXJyYXkgY29udGFpbmluZyBbbTAwLCBtMTAsIG0wMSwgbTExXVxuICAgKi9cbiAgZmxhdHRlbkFzQXJyYXkoKSB7XG4gICAgcmV0dXJuIFt0aGlzLl92WzBdLCB0aGlzLl92WzFdLCB0aGlzLl92WzJdLCB0aGlzLl92WzNdXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBpcyBhIGR1bW15IG1hdHJpeCAoZW1wdHkgZGF0YSkuXG4gICAqXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIG1hdHJpeCBoYXMgbm8gZGF0YSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBpc0R1bW15KCkge1xuICAgIGlmICh0aGlzLl92Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBtYXRyaXggaXMgYXBwcm94aW1hdGVseSBlcXVhbCB0byBhbm90aGVyIG1hdHJpeCB3aXRoaW4gYSB0b2xlcmFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSBtYXQgLSBUaGUgbWF0cml4IHRvIGNvbXBhcmUgd2l0aFxuICAgKiBAcGFyYW0gZGVsdGEgLSBUaGUgdG9sZXJhbmNlIGZvciBjb21wYXJpc29uIChkZWZhdWx0OiBOdW1iZXIuRVBTSUxPTilcbiAgICogQHJldHVybnMgVHJ1ZSBpZiBhbGwgY29ycmVzcG9uZGluZyBlbGVtZW50cyBhcmUgd2l0aGluIHRoZSB0b2xlcmFuY2VcbiAgICovXG4gIGlzRXF1YWwobWF0OiBNYXRyaXgyMiwgZGVsdGE6IG51bWJlciA9IE51bWJlci5FUFNJTE9OKSB7XG4gICAgaWYgKFxuICAgICAgTWF0aC5hYnMobWF0Ll92WzBdIC0gdGhpcy5fdlswXSkgPCBkZWx0YSAmJlxuICAgICAgTWF0aC5hYnMobWF0Ll92WzFdIC0gdGhpcy5fdlsxXSkgPCBkZWx0YSAmJlxuICAgICAgTWF0aC5hYnMobWF0Ll92WzJdIC0gdGhpcy5fdlsyXSkgPCBkZWx0YSAmJlxuICAgICAgTWF0aC5hYnMobWF0Ll92WzNdIC0gdGhpcy5fdlszXSkgPCBkZWx0YVxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBtYXRyaXggaXMgZXhhY3RseSBlcXVhbCB0byBhbm90aGVyIG1hdHJpeC5cbiAgICogVXNlcyBzdHJpY3QgZXF1YWxpdHkgY29tcGFyaXNvbiBmb3IgYWxsIGVsZW1lbnRzLlxuICAgKlxuICAgKiBAcGFyYW0gbWF0IC0gVGhlIG1hdHJpeCB0byBjb21wYXJlIHdpdGhcbiAgICogQHJldHVybnMgVHJ1ZSBpZiBhbGwgY29ycmVzcG9uZGluZyBlbGVtZW50cyBhcmUgZXhhY3RseSBlcXVhbFxuICAgKi9cbiAgaXNTdHJpY3RFcXVhbChtYXQ6IE1hdHJpeDIyKSB7XG4gICAgaWYgKG1hdC5fdlswXSA9PT0gdGhpcy5fdlswXSAmJiBtYXQuX3ZbMV0gPT09IHRoaXMuX3ZbMV0gJiYgbWF0Ll92WzJdID09PSB0aGlzLl92WzJdICYmIG1hdC5fdlszXSA9PT0gdGhpcy5fdlszXSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCB0aGUgc3BlY2lmaWVkIHJvdyBhbmQgY29sdW1uLlxuICAgKlxuICAgKiBAcGFyYW0gcm93X2kgLSBUaGUgcm93IGluZGV4ICgwIG9yIDEpXG4gICAqIEBwYXJhbSBjb2x1bW5faSAtIFRoZSBjb2x1bW4gaW5kZXggKDAgb3IgMSlcbiAgICogQHJldHVybnMgVGhlIG1hdHJpeCBlbGVtZW50IGF0IHRoZSBzcGVjaWZpZWQgcG9zaXRpb25cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBtYXQgPSBNYXRyaXgyMi5pZGVudGl0eSgpO1xuICAgKiBjb25zdCBtMDEgPSBtYXQuYXQoMCwgMSk7IC8vIFJldHVybnMgMFxuICAgKiBgYGBcbiAgICovXG4gIGF0KHJvd19pOiBudW1iZXIsIGNvbHVtbl9pOiBudW1iZXIpIHtcbiAgICByZXR1cm4gdGhpcy5fdltyb3dfaSArIGNvbHVtbl9pICogMl07XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyB0aGUgZGV0ZXJtaW5hbnQgb2YgdGhpcyAyeDIgbWF0cml4LlxuICAgKlxuICAgKiBGb3IgYSAyeDIgbWF0cml4IHwgYSBiIHwsIHRoZSBkZXRlcm1pbmFudCBpcyBhZCAtIGJjLlxuICAgKiAgICAgICAgICAgICAgICAgICB8IGMgZCB8XG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBkZXRlcm1pbmFudCB2YWx1ZVxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IG1hdCA9IE1hdHJpeDIyLmZyb21Db3B5NFJvd01ham9yKDIsIDMsIDEsIDQpO1xuICAgKiBjb25zdCBkZXQgPSBtYXQuZGV0ZXJtaW5hbnQoKTsgLy8gUmV0dXJucyAyKjQgLSAzKjEgPSA1XG4gICAqIGBgYFxuICAgKi9cbiAgZGV0ZXJtaW5hbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMF0gKiB0aGlzLl92WzNdIC0gdGhpcy5fdlsxXSAqIHRoaXMuX3ZbMl07XG4gIH1cblxuICAvKipcbiAgICogTXVsdGlwbGllcyB0aGlzIG1hdHJpeCBieSBhIDJEIHZlY3RvciBhbmQgcmV0dXJucyB0aGUgcmVzdWx0LlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIDJEIHZlY3RvciB0byBtdWx0aXBseVxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3IyIGNvbnRhaW5pbmcgdGhlIHRyYW5zZm9ybWVkIHZlY3RvclxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IHJvdGF0aW9uID0gTWF0cml4MjIucm90YXRlKE1hdGguUEkgLyAyKTtcbiAgICogY29uc3QgdmVjID0gVmVjdG9yMi5mcm9tQ29weUFycmF5MihbMSwgMF0pO1xuICAgKiBjb25zdCByZXN1bHQgPSByb3RhdGlvbi5tdWx0aXBseVZlY3Rvcih2ZWMpOyAvLyBSb3RhdGVzICgxLDApIHRvICgwLDEpXG4gICAqIGBgYFxuICAgKi9cbiAgbXVsdGlwbHlWZWN0b3IodmVjOiBWZWN0b3IyKSB7XG4gICAgY29uc3QgeCA9IHRoaXMuX3ZbMF0gKiB2ZWMuX3ZbMF0gKyB0aGlzLl92WzJdICogdmVjLl92WzFdO1xuICAgIGNvbnN0IHkgPSB0aGlzLl92WzFdICogdmVjLl92WzBdICsgdGhpcy5fdlszXSAqIHZlYy5fdlsxXTtcbiAgICByZXR1cm4gVmVjdG9yMi5mcm9tQ29weUFycmF5MihbeCwgeV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgdGhpcyBtYXRyaXggYnkgYSAyRCB2ZWN0b3IgYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIHRoZSBvdXRwdXQgdmVjdG9yLlxuICAgKiBUaGlzIG1ldGhvZCBhdm9pZHMgY3JlYXRpbmcgYSBuZXcgdmVjdG9yIGluc3RhbmNlIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgMkQgdmVjdG9yIHRvIG11bHRpcGx5XG4gICAqIEBwYXJhbSBvdXRWZWMgLSBUaGUgbXV0YWJsZSB2ZWN0b3IgdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHZlY3RvciBjb250YWluaW5nIHRoZSB0cmFuc2Zvcm1lZCB2ZWN0b3JcbiAgICovXG4gIG11bHRpcGx5VmVjdG9yVG8odmVjOiBWZWN0b3IyLCBvdXRWZWM6IE11dGFibGVWZWN0b3IyKSB7XG4gICAgY29uc3QgeCA9IHRoaXMuX3ZbMF0gKiB2ZWMuX3ZbMF0gKyB0aGlzLl92WzJdICogdmVjLl92WzFdO1xuICAgIGNvbnN0IHkgPSB0aGlzLl92WzFdICogdmVjLl92WzBdICsgdGhpcy5fdlszXSAqIHZlYy5fdlsxXTtcbiAgICBvdXRWZWMuX3ZbMF0gPSB4O1xuICAgIG91dFZlYy5fdlsxXSA9IHk7XG4gICAgcmV0dXJuIG91dFZlYztcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHRyYWN0cyB0aGUgc2NhbGUgZmFjdG9ycyBmcm9tIHRoaXMgdHJhbnNmb3JtYXRpb24gbWF0cml4LlxuICAgKiBDYWxjdWxhdGVzIHRoZSBsZW5ndGggb2YgZWFjaCBjb2x1bW4gdmVjdG9yIHRvIGRldGVybWluZSB0aGUgc2NhbGUuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgVmVjdG9yMiBjb250YWluaW5nIHRoZSBzY2FsZSBmYWN0b3JzIGZvciB4IGFuZCB5IGF4ZXNcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBzY2FsZUFuZFJvdGF0aW9uID0gTWF0cml4MjIubXVsdGlwbHkoXG4gICAqICAgTWF0cml4MjIuc2NhbGUoVmVjdG9yMi5mcm9tQ29weUFycmF5MihbMiwgM10pKSxcbiAgICogICBNYXRyaXgyMi5yb3RhdGUoTWF0aC5QSSAvIDQpXG4gICAqICk7XG4gICAqIGNvbnN0IHNjYWxlID0gc2NhbGVBbmRSb3RhdGlvbi5nZXRTY2FsZSgpOyAvLyBSZXR1cm5zIGFwcHJveGltYXRlbHkgWzIsIDNdXG4gICAqIGBgYFxuICAgKi9cbiAgZ2V0U2NhbGUoKSB7XG4gICAgcmV0dXJuIFZlY3RvcjIuZnJvbUNvcHlBcnJheTIoW01hdGguaHlwb3QodGhpcy5tMDAsIHRoaXMubTAxKSwgTWF0aC5oeXBvdCh0aGlzLm0xMCwgdGhpcy5tMTEpXSk7XG4gIH1cblxuICAvKipcbiAgICogRXh0cmFjdHMgdGhlIHNjYWxlIGZhY3RvcnMgZnJvbSB0aGlzIHRyYW5zZm9ybWF0aW9uIG1hdHJpeCBhbmQgc3RvcmVzIHRoZW0gaW4gdGhlIG91dHB1dCB2ZWN0b3IuXG4gICAqIFRoaXMgbWV0aG9kIGF2b2lkcyBjcmVhdGluZyBhIG5ldyB2ZWN0b3IgaW5zdGFuY2UgZm9yIGJldHRlciBwZXJmb3JtYW5jZS5cbiAgICpcbiAgICogQHBhcmFtIG91dFZlYyAtIFRoZSBtdXRhYmxlIHZlY3RvciB0byBzdG9yZSB0aGUgc2NhbGUgZmFjdG9yc1xuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHZlY3RvciBjb250YWluaW5nIHRoZSBzY2FsZSBmYWN0b3JzXG4gICAqL1xuICBnZXRTY2FsZVRvKG91dFZlYzogTXV0YWJsZVZlY3RvcjIpIHtcbiAgICBvdXRWZWMuX3ZbMF0gPSBNYXRoLmh5cG90KHRoaXMuX3ZbMF0sIHRoaXMuX3ZbMl0pO1xuICAgIG91dFZlYy5fdlsxXSA9IE1hdGguaHlwb3QodGhpcy5fdlsxXSwgdGhpcy5fdlszXSk7XG4gICAgcmV0dXJuIG91dFZlYztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZGVlcCBjb3B5IG9mIHRoaXMgbWF0cml4LlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyBNYXRyaXgyMiBpbnN0YW5jZSB3aXRoIHRoZSBzYW1lIHZhbHVlc1xuICAgKi9cbiAgY2xvbmUoKSB7XG4gICAgcmV0dXJuICh0aGlzLmNvbnN0cnVjdG9yIGFzIGFueSkuZnJvbUNvcHk0Um93TWFqb3IodGhpcy5fdlswXSwgdGhpcy5fdlsyXSwgdGhpcy5fdlsxXSwgdGhpcy5fdlszXSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNYXRyaXgyMiBmcm9tIGluZGl2aWR1YWwgY29tcG9uZW50cyBpbiByb3ctbWFqb3Igb3JkZXIuXG4gICAqXG4gICAqIFJvdy1tYWpvciBtZWFucyB5b3Ugc3BlY2lmeSB2YWx1ZXMgYXMgdGhleSBhcHBlYXIgdmlzdWFsbHk6XG4gICAqIGBgYFxuICAgKiB8IG0wMCBtMDEgfFxuICAgKiB8IG0xMCBtMTEgfFxuICAgKiBgYGBcbiAgICpcbiAgICogTm90ZTogSW50ZXJuYWxseSwgV2ViR0wgbWF0cmljZXMgYXJlIHN0b3JlZCBpbiBjb2x1bW4tbWFqb3Igb3JkZXIuXG4gICAqXG4gICAqIEBwYXJhbSBtMDAgLSBFbGVtZW50IGF0IHJvdyAwLCBjb2x1bW4gMFxuICAgKiBAcGFyYW0gbTAxIC0gRWxlbWVudCBhdCByb3cgMCwgY29sdW1uIDFcbiAgICogQHBhcmFtIG0xMCAtIEVsZW1lbnQgYXQgcm93IDEsIGNvbHVtbiAwXG4gICAqIEBwYXJhbSBtMTEgLSBFbGVtZW50IGF0IHJvdyAxLCBjb2x1bW4gMVxuICAgKiBAcmV0dXJucyBBIG5ldyBNYXRyaXgyMiB3aXRoIHRoZSBzcGVjaWZpZWQgdmFsdWVzXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgbWF0ID0gTWF0cml4MjIuZnJvbUNvcHk0Um93TWFqb3IoMSwgMiwgMywgNCk7XG4gICAqIC8vIENyZWF0ZXM6XG4gICAqIC8vIHwgMSAyIHxcbiAgICogLy8gfCAzIDQgfFxuICAgKiBgYGBcbiAgICovXG4gIHN0YXRpYyBfZnJvbUNvcHk0Um93TWFqb3IoXG4gICAgbTAwOiBudW1iZXIsXG4gICAgbTAxOiBudW1iZXIsXG4gICAgbTEwOiBudW1iZXIsXG4gICAgbTExOiBudW1iZXIsXG4gICAgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3JcbiAgKTogSU1hdHJpeDIyIHtcbiAgICBjb25zdCB2ID0gbmV3IHR5cGUoNCk7XG4gICAgdlswXSA9IG0wMDtcbiAgICB2WzJdID0gbTAxO1xuICAgIHZbMV0gPSBtMTA7XG4gICAgdlszXSA9IG0xMTtcbiAgICByZXR1cm4gbmV3IHRoaXModiwgeyB0eXBlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgTWF0cml4MjIgZnJvbSBpbmRpdmlkdWFsIGNvbXBvbmVudHMgaW4gY29sdW1uLW1ham9yIG9yZGVyLlxuICAgKlxuICAgKiBDb2x1bW4tbWFqb3IgbWVhbnMgeW91IHNwZWNpZnkgdmFsdWVzIGNvbHVtbiBieSBjb2x1bW46XG4gICAqIEZpcnN0IGNvbHVtbjogbTAwLCBtMTBcbiAgICogU2Vjb25kIGNvbHVtbjogbTAxLCBtMTFcbiAgICpcbiAgICogTm90ZTogV2ViR0wgbWF0cmljZXMgYXJlIHN0b3JlZCBpbiBjb2x1bW4tbWFqb3Igb3JkZXIgaW50ZXJuYWxseS5cbiAgICpcbiAgICogQHBhcmFtIG0wMCAtIEVsZW1lbnQgYXQgcm93IDAsIGNvbHVtbiAwXG4gICAqIEBwYXJhbSBtMTAgLSBFbGVtZW50IGF0IHJvdyAxLCBjb2x1bW4gMFxuICAgKiBAcGFyYW0gbTAxIC0gRWxlbWVudCBhdCByb3cgMCwgY29sdW1uIDFcbiAgICogQHBhcmFtIG0xMSAtIEVsZW1lbnQgYXQgcm93IDEsIGNvbHVtbiAxXG4gICAqIEByZXR1cm5zIEEgbmV3IE1hdHJpeDIyIHdpdGggdGhlIHNwZWNpZmllZCB2YWx1ZXNcbiAgICovXG4gIHN0YXRpYyBfZnJvbUNvcHk0Q29sdW1uTWFqb3IoXG4gICAgbTAwOiBudW1iZXIsXG4gICAgbTEwOiBudW1iZXIsXG4gICAgbTAxOiBudW1iZXIsXG4gICAgbTExOiBudW1iZXIsXG4gICAgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3JcbiAgKTogSU1hdHJpeDIyIHtcbiAgICBjb25zdCB2ID0gbmV3IHR5cGUoNCk7XG4gICAgdlswXSA9IG0wMDtcbiAgICB2WzJdID0gbTAxO1xuICAgIHZbMV0gPSBtMTA7XG4gICAgdlszXSA9IG0xMTtcbiAgICByZXR1cm4gbmV3IHRoaXModiwgeyB0eXBlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgTWF0cml4MjIgdGhhdCBkaXJlY3RseSB1c2VzIHRoZSBwcm92aWRlZCBGbG9hdDMyQXJyYXkuXG4gICAqIFRoZSBhcnJheSBpcyB1c2VkIGFzLWlzIHdpdGhvdXQgY29weWluZywgc28gbW9kaWZpY2F0aW9ucyB0byB0aGUgYXJyYXlcbiAgICogd2lsbCBhZmZlY3QgdGhlIG1hdHJpeC5cbiAgICpcbiAgICogQHBhcmFtIGZsb2F0MzJBcnJheSAtIEZsb2F0MzJBcnJheSBjb250YWluaW5nIG1hdHJpeCB2YWx1ZXMgaW4gY29sdW1uLW1ham9yIG9yZGVyXG4gICAqIEByZXR1cm5zIEEgbmV3IE1hdHJpeDIyIHVzaW5nIHRoZSBwcm92aWRlZCBhcnJheVxuICAgKi9cbiAgc3RhdGljIF9mcm9tVHlwZWRBcnJheUNvbHVtbk1ham9yKGFycmF5OiBUeXBlZEFycmF5LCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcik6IElNYXRyaXgyMiB7XG4gICAgcmV0dXJuIG5ldyB0aGlzKGFycmF5LCB7IHR5cGUgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNYXRyaXgyMiBieSBjb3B5aW5nIHZhbHVlcyBmcm9tIGEgRmxvYXQzMkFycmF5IGluIGNvbHVtbi1tYWpvciBvcmRlci5cbiAgICpcbiAgICogQHBhcmFtIGZsb2F0MzJBcnJheSAtIEZsb2F0MzJBcnJheSBjb250YWluaW5nIG1hdHJpeCB2YWx1ZXMgaW4gY29sdW1uLW1ham9yIG9yZGVyXG4gICAqIEByZXR1cm5zIEEgbmV3IE1hdHJpeDIyIHdpdGggY29waWVkIHZhbHVlc1xuICAgKi9cbiAgc3RhdGljIF9mcm9tQ29weVR5cGVkQXJyYXlDb2x1bW5NYWpvcihhcnJheTogVHlwZWRBcnJheSwgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpOiBJTWF0cml4MjIge1xuICAgIGNvbnN0IHYgPSBuZXcgdHlwZSg0KTtcbiAgICB2LnNldChhcnJheSk7XG4gICAgcmV0dXJuIG5ldyB0aGlzKHYsIHsgdHlwZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IE1hdHJpeDIyIGJ5IGNvcHlpbmcgdmFsdWVzIGZyb20gYSBGbG9hdDMyQXJyYXkgaW4gcm93LW1ham9yIG9yZGVyLlxuICAgKlxuICAgKiBAcGFyYW0gYXJyYXkgLSBGbG9hdDMyQXJyYXkgY29udGFpbmluZyBtYXRyaXggdmFsdWVzIGluIHJvdy1tYWpvciBvcmRlclxuICAgKiBAcmV0dXJucyBBIG5ldyBNYXRyaXgyMiB3aXRoIHZhbHVlcyBjb252ZXJ0ZWQgdG8gY29sdW1uLW1ham9yIG9yZGVyXG4gICAqL1xuICBzdGF0aWMgX2Zyb21Db3B5VHlwZWRBcnJheVJvd01ham9yKGFycmF5OiBUeXBlZEFycmF5LCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcik6IElNYXRyaXgyMiB7XG4gICAgY29uc3QgdiA9IG5ldyB0eXBlKDQpO1xuICAgIHZbMF0gPSBhcnJheVswXTtcbiAgICB2WzJdID0gYXJyYXlbMV07XG4gICAgdlsxXSA9IGFycmF5WzJdO1xuICAgIHZbM10gPSBhcnJheVszXTtcblxuICAgIHJldHVybiBuZXcgdGhpcyh2LCB7IHR5cGUgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNYXRyaXgyMiBieSBjb3B5aW5nIHZhbHVlcyBmcm9tIGFub3RoZXIgSU1hdHJpeDIyLlxuICAgKlxuICAgKiBAcGFyYW0gbWF0IC0gVGhlIG1hdHJpeCB0byBjb3B5IGZyb21cbiAgICogQHJldHVybnMgQSBuZXcgTWF0cml4MjIgd2l0aCBjb3BpZWQgdmFsdWVzXG4gICAqL1xuICBzdGF0aWMgX2Zyb21Db3B5TWF0cml4MjIobWF0OiBJTWF0cml4MjIsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKTogSU1hdHJpeDIyIHtcbiAgICBjb25zdCB2ID0gbmV3IHR5cGUoNCk7XG4gICAgdlswXSA9IG1hdC5fdlswXTtcbiAgICB2WzFdID0gbWF0Ll92WzFdO1xuICAgIHZbMl0gPSBtYXQuX3ZbMl07XG4gICAgdlszXSA9IG1hdC5fdlszXTtcbiAgICByZXR1cm4gbmV3IHRoaXModiwgeyB0eXBlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgTWF0cml4MjIgZnJvbSBhIDQtZWxlbWVudCBhcnJheSBpbiBjb2x1bW4tbWFqb3Igb3JkZXIuXG4gICAqXG4gICAqIEBwYXJhbSBhcnJheSAtIEFycmF5NCBjb250YWluaW5nIGV4YWN0bHkgNCBudW1iZXJzIGluIGNvbHVtbi1tYWpvciBvcmRlclxuICAgKiBAcmV0dXJucyBBIG5ldyBNYXRyaXgyMiB3aXRoIHRoZSBhcnJheSB2YWx1ZXNcbiAgICovXG4gIHN0YXRpYyBfZnJvbUNvcHlBcnJheTRDb2x1bW5NYWpvcihhcnJheTogQXJyYXk0PG51bWJlcj4sIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKTogSU1hdHJpeDIyIHtcbiAgICBjb25zdCB2ID0gbmV3IHR5cGUoNCk7XG4gICAgdi5zZXQoYXJyYXkpO1xuICAgIHJldHVybiBuZXcgdGhpcyh2LCB7IHR5cGUgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNYXRyaXgyMiBmcm9tIGEgdmFyaWFibGUtbGVuZ3RoIGFycmF5IGluIGNvbHVtbi1tYWpvciBvcmRlci5cbiAgICogT25seSB0aGUgZmlyc3QgNCBlbGVtZW50cyBhcmUgdXNlZC5cbiAgICpcbiAgICogQHBhcmFtIGFycmF5IC0gQXJyYXkgY29udGFpbmluZyBtYXRyaXggdmFsdWVzIGluIGNvbHVtbi1tYWpvciBvcmRlclxuICAgKiBAcmV0dXJucyBBIG5ldyBNYXRyaXgyMiB3aXRoIHRoZSBmaXJzdCA0IGFycmF5IHZhbHVlc1xuICAgKi9cbiAgc3RhdGljIF9mcm9tQ29weUFycmF5Q29sdW1uTWFqb3IoYXJyYXk6IEFycmF5PG51bWJlcj4sIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKTogSU1hdHJpeDIyIHtcbiAgICBjb25zdCB2ID0gbmV3IHR5cGUoNCk7XG4gICAgdi5zZXQoYXJyYXkpO1xuICAgIHJldHVybiBuZXcgdGhpcyh2LCB7IHR5cGUgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNYXRyaXgyMiBmcm9tIGEgNC1lbGVtZW50IGFycmF5IGluIHJvdy1tYWpvciBvcmRlci5cbiAgICpcbiAgICogQHBhcmFtIGFycmF5IC0gQXJyYXk0IGNvbnRhaW5pbmcgZXhhY3RseSA0IG51bWJlcnMgaW4gcm93LW1ham9yIG9yZGVyXG4gICAqIEByZXR1cm5zIEEgbmV3IE1hdHJpeDIyIHdpdGggdmFsdWVzIGNvbnZlcnRlZCB0byBjb2x1bW4tbWFqb3Igb3JkZXJcbiAgICovXG4gIHN0YXRpYyBfZnJvbUNvcHlBcnJheTRSb3dNYWpvcihhcnJheTogQXJyYXk0PG51bWJlcj4sIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKTogSU1hdHJpeDIyIHtcbiAgICBjb25zdCB2ID0gbmV3IHR5cGUoNCk7XG4gICAgdlswXSA9IGFycmF5WzBdO1xuICAgIHZbMl0gPSBhcnJheVsxXTtcbiAgICB2WzFdID0gYXJyYXlbMl07XG4gICAgdlszXSA9IGFycmF5WzNdO1xuICAgIHJldHVybiBuZXcgdGhpcyh2LCB7IHR5cGUgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNYXRyaXgyMiBmcm9tIGEgdmFyaWFibGUtbGVuZ3RoIGFycmF5IGluIHJvdy1tYWpvciBvcmRlci5cbiAgICogT25seSB0aGUgZmlyc3QgNCBlbGVtZW50cyBhcmUgdXNlZC5cbiAgICpcbiAgICogQHBhcmFtIGFycmF5IC0gQXJyYXkgY29udGFpbmluZyBtYXRyaXggdmFsdWVzIGluIHJvdy1tYWpvciBvcmRlclxuICAgKiBAcmV0dXJucyBBIG5ldyBNYXRyaXgyMiB3aXRoIHZhbHVlcyBjb252ZXJ0ZWQgdG8gY29sdW1uLW1ham9yIG9yZGVyXG4gICAqL1xuICBzdGF0aWMgX2Zyb21Db3B5QXJyYXlSb3dNYWpvcihhcnJheTogQXJyYXk8bnVtYmVyPiwgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpOiBJTWF0cml4MjIge1xuICAgIGNvbnN0IHYgPSBuZXcgdHlwZSg0KTtcbiAgICB2WzBdID0gYXJyYXlbMF07XG4gICAgdlsyXSA9IGFycmF5WzFdO1xuICAgIHZbMV0gPSBhcnJheVsyXTtcbiAgICB2WzNdID0gYXJyYXlbM107XG4gICAgcmV0dXJuIG5ldyB0aGlzKHYsIHsgdHlwZSB9KTtcbiAgfVxufVxuXG4vKipcbiAqIEltbXV0YWJsZSAyeDIgbWF0cml4IHdpdGggMzItYml0IGZsb2F0IGNvbXBvbmVudHMuXG4gKiBUaGlzIGlzIHRoZSBzdGFuZGFyZCBwcmVjaXNpb24gaW1wbGVtZW50YXRpb24gZm9yIG1vc3QgMkQgZ3JhcGhpY3Mgb3BlcmF0aW9ucy5cbiAqL1xuZXhwb3J0IGNsYXNzIE1hdHJpeDIyIGV4dGVuZHMgTWF0cml4MjJfPEZsb2F0MzJBcnJheUNvbnN0cnVjdG9yPiB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IE1hdHJpeDIyIGluc3RhbmNlLlxuICAgKiBAcGFyYW0gbSAtIFRoZSB0eXBlZCBhcnJheSBjb250YWluaW5nIHRoZSBtYXRyaXggY29tcG9uZW50c1xuICAgKi9cbiAgY29uc3RydWN0b3IobTogVHlwZWRBcnJheSkge1xuICAgIHN1cGVyKG0sIHsgdHlwZTogRmxvYXQzMkFycmF5IH0pO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSB6ZXJvIG1hdHJpeC4gKi9cbiAgc3RhdGljIHplcm8oKTogTWF0cml4MjIge1xuICAgIHJldHVybiBzdXBlci5femVybyhGbG9hdDMyQXJyYXkpIGFzIE1hdHJpeDIyO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYW4gaWRlbnRpdHkgbWF0cml4LiAqL1xuICBzdGF0aWMgaWRlbnRpdHkoKTogTWF0cml4MjIge1xuICAgIHJldHVybiBzdXBlci5faWRlbnRpdHkoRmxvYXQzMkFycmF5KSBhcyBNYXRyaXgyMjtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgZHVtbXkgbWF0cml4IHdpdGggYW4gZW1wdHkgYXJyYXkuICovXG4gIHN0YXRpYyBkdW1teSgpOiBNYXRyaXgyMiB7XG4gICAgcmV0dXJuIHN1cGVyLl9kdW1teShGbG9hdDMyQXJyYXkpIGFzIE1hdHJpeDIyO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgdGhlIHRyYW5zcG9zZSBvZiB0aGUgZ2l2ZW4gbWF0cml4LiAqL1xuICBzdGF0aWMgdHJhbnNwb3NlKG1hdDogSU1hdHJpeDIyKTogTWF0cml4MjIge1xuICAgIHJldHVybiBzdXBlci5fdHJhbnNwb3NlKG1hdCwgRmxvYXQzMkFycmF5KSBhcyBNYXRyaXgyMjtcbiAgfVxuXG4gIC8qKiBBdHRlbXB0cyB0byBpbnZlcnQgdGhlIGdpdmVuIG1hdHJpeCwgcmV0dXJuaW5nIG51bGwgd2hlbiBpdCBpcyBzaW5ndWxhci4gKi9cbiAgc3RhdGljIHRyeUludmVydChtYXQ6IElNYXRyaXgyMik6IE1hdHJpeDIyIHwgbnVsbCB7XG4gICAgcmV0dXJuIHN1cGVyLl90cnlJbnZlcnQobWF0LCBGbG9hdDMyQXJyYXkpIGFzIE1hdHJpeDIyIHwgbnVsbDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIHRoZSBpbnZlcnNlIG9mIHRoZSBnaXZlbiBtYXRyaXggKGlkZW50aXR5IHdoZW4gc2luZ3VsYXIpLiAqL1xuICBzdGF0aWMgaW52ZXJ0KG1hdDogSU1hdHJpeDIyKTogTWF0cml4MjIge1xuICAgIHJldHVybiBzdXBlci5faW52ZXJ0KG1hdCwgRmxvYXQzMkFycmF5KSBhcyBNYXRyaXgyMjtcbiAgfVxuXG4gIC8qKiBBdHRlbXB0cyB0byBpbnZlcnQgdGhlIGdpdmVuIG1hdHJpeCBpbnRvIG91dE1hdC4gKi9cbiAgc3RhdGljIHRyeUludmVydFRvPFQgZXh0ZW5kcyBJTXV0YWJsZU1hdHJpeDIyPihtYXQ6IElNYXRyaXgyMiwgb3V0TWF0OiBUKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHN1cGVyLl90cnlJbnZlcnRUbyhtYXQsIG91dE1hdCk7XG4gIH1cblxuICAvKiogSW52ZXJ0cyB0aGUgZ2l2ZW4gbWF0cml4IGludG8gb3V0TWF0IChpZGVudGl0eSB3aGVuIHNpbmd1bGFyKS4gKi9cbiAgc3RhdGljIGludmVydFRvPFQgZXh0ZW5kcyBJTXV0YWJsZU1hdHJpeDIyPihtYXQ6IElNYXRyaXgyMiwgb3V0TWF0OiBUKTogVCB7XG4gICAgcmV0dXJuIHN1cGVyLl9pbnZlcnRUbyhtYXQsIG91dE1hdCkgYXMgVDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgMkQgcm90YXRpb24gbWF0cml4LiAqL1xuICBzdGF0aWMgcm90YXRlKHJhZGlhbjogbnVtYmVyKTogTWF0cml4MjIge1xuICAgIHJldHVybiBzdXBlci5fcm90YXRlKHJhZGlhbiwgRmxvYXQzMkFycmF5KSBhcyBNYXRyaXgyMjtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgMkQgc2NhbGluZyBtYXRyaXguICovXG4gIHN0YXRpYyBzY2FsZSh2ZWM6IElWZWN0b3IyKTogTWF0cml4MjIge1xuICAgIHJldHVybiBzdXBlci5fc2NhbGUodmVjLCBGbG9hdDMyQXJyYXkpIGFzIE1hdHJpeDIyO1xuICB9XG5cbiAgLyoqIE11bHRpcGxpZXMgdHdvIDJ4MiBtYXRyaWNlcy4gKi9cbiAgc3RhdGljIG11bHRpcGx5KGxfbWF0OiBJTWF0cml4MjIsIHJfbWF0OiBJTWF0cml4MjIpOiBNYXRyaXgyMiB7XG4gICAgcmV0dXJuIHN1cGVyLl9tdWx0aXBseShsX21hdCwgcl9tYXQsIEZsb2F0MzJBcnJheSkgYXMgTWF0cml4MjI7XG4gIH1cblxuICAvKiogTXVsdGlwbGllcyB0d28gbWF0cmljZXMgYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIG91dE1hdC4gKi9cbiAgc3RhdGljIG11bHRpcGx5VG88VCBleHRlbmRzIElNdXRhYmxlTWF0cml4MjI+KGxfbWF0OiBJTWF0cml4MjIsIHJfbWF0OiBJTWF0cml4MjIsIG91dE1hdDogVCk6IFQge1xuICAgIHJldHVybiBzdXBlci5fbXVsdGlwbHlUbyhsX21hdCwgcl9tYXQsIG91dE1hdCkgYXMgVDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gcm93LW1ham9yIGNvbXBvbmVudHMuICovXG4gIHN0YXRpYyBmcm9tQ29weTRSb3dNYWpvcihtMDA6IG51bWJlciwgbTAxOiBudW1iZXIsIG0xMDogbnVtYmVyLCBtMTE6IG51bWJlcik6IE1hdHJpeDIyIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5NFJvd01ham9yKG0wMCwgbTAxLCBtMTAsIG0xMSwgRmxvYXQzMkFycmF5KSBhcyBNYXRyaXgyMjtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gY29sdW1uLW1ham9yIGNvbXBvbmVudHMuICovXG4gIHN0YXRpYyBmcm9tQ29weTRDb2x1bW5NYWpvcihtMDA6IG51bWJlciwgbTEwOiBudW1iZXIsIG0wMTogbnVtYmVyLCBtMTE6IG51bWJlcik6IE1hdHJpeDIyIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5NENvbHVtbk1ham9yKG0wMCwgbTEwLCBtMDEsIG0xMSwgRmxvYXQzMkFycmF5KSBhcyBNYXRyaXgyMjtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IHRoYXQgZGlyZWN0bHkgdXNlcyB0aGUgZ2l2ZW4gRmxvYXQzMkFycmF5LiAqL1xuICBzdGF0aWMgZnJvbUZsb2F0MzJBcnJheUNvbHVtbk1ham9yKGFycmF5OiBGbG9hdDMyQXJyYXkpOiBNYXRyaXgyMiB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tVHlwZWRBcnJheUNvbHVtbk1ham9yKGFycmF5LCBGbG9hdDMyQXJyYXkpIGFzIE1hdHJpeDIyO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggYnkgY29weWluZyBhIEZsb2F0MzJBcnJheSBpbiBjb2x1bW4tbWFqb3Igb3JkZXIuICovXG4gIHN0YXRpYyBmcm9tQ29weUZsb2F0MzJBcnJheUNvbHVtbk1ham9yKGFycmF5OiBGbG9hdDMyQXJyYXkpOiBNYXRyaXgyMiB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weVR5cGVkQXJyYXlDb2x1bW5NYWpvcihhcnJheSwgRmxvYXQzMkFycmF5KSBhcyBNYXRyaXgyMjtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGJ5IGNvcHlpbmcgYSBGbG9hdDMyQXJyYXkgaW4gcm93LW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlGbG9hdDMyQXJyYXlSb3dNYWpvcihhcnJheTogRmxvYXQzMkFycmF5KTogTWF0cml4MjIge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlUeXBlZEFycmF5Um93TWFqb3IoYXJyYXksIEZsb2F0MzJBcnJheSkgYXMgTWF0cml4MjI7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBieSBjb3B5aW5nIGFub3RoZXIgbWF0cml4LiAqL1xuICBzdGF0aWMgZnJvbUNvcHlNYXRyaXgyMihtYXQ6IElNYXRyaXgyMik6IE1hdHJpeDIyIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5TWF0cml4MjIobWF0LCBGbG9hdDMyQXJyYXkpIGFzIE1hdHJpeDIyO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIDQtZWxlbWVudCBhcnJheSBpbiBjb2x1bW4tbWFqb3Igb3JkZXIuICovXG4gIHN0YXRpYyBmcm9tQ29weUFycmF5OUNvbHVtbk1ham9yKGFycmF5OiBBcnJheTQ8bnVtYmVyPik6IE1hdHJpeDIyIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5QXJyYXk0Q29sdW1uTWFqb3IoYXJyYXksIEZsb2F0MzJBcnJheSkgYXMgTWF0cml4MjI7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGFuIGFycmF5IGluIGNvbHVtbi1tYWpvciBvcmRlci4gKi9cbiAgc3RhdGljIGZyb21Db3B5QXJyYXlDb2x1bW5NYWpvcihhcnJheTogQXJyYXk8bnVtYmVyPik6IE1hdHJpeDIyIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5QXJyYXlDb2x1bW5NYWpvcihhcnJheSwgRmxvYXQzMkFycmF5KSBhcyBNYXRyaXgyMjtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSA0LWVsZW1lbnQgYXJyYXkgaW4gcm93LW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheTlSb3dNYWpvcihhcnJheTogQXJyYXk0PG51bWJlcj4pOiBNYXRyaXgyMiB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weUFycmF5NFJvd01ham9yKGFycmF5LCBGbG9hdDMyQXJyYXkpIGFzIE1hdHJpeDIyO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhbiBhcnJheSBpbiByb3ctbWFqb3Igb3JkZXIuICovXG4gIHN0YXRpYyBmcm9tQ29weUFycmF5Um93TWFqb3IoYXJyYXk6IEFycmF5PG51bWJlcj4pOiBNYXRyaXgyMiB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weUFycmF5Um93TWFqb3IoYXJyYXksIEZsb2F0MzJBcnJheSkgYXMgTWF0cml4MjI7XG4gIH1cbn1cblxuLyoqXG4gKiBJbW11dGFibGUgMngyIG1hdHJpeCB3aXRoIDY0LWJpdCBmbG9hdCBjb21wb25lbnRzLlxuICogVXNlIHRoaXMgaW1wbGVtZW50YXRpb24gd2hlbiBoaWdoZXIgbnVtZXJpY2FsIHByZWNpc2lvbiBpcyByZXF1aXJlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIE1hdHJpeDIyRCBleHRlbmRzIE1hdHJpeDIyXzxGbG9hdDY0QXJyYXlDb25zdHJ1Y3Rvcj4ge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNYXRyaXgyMkQgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSBtIC0gVGhlIHR5cGVkIGFycmF5IGNvbnRhaW5pbmcgdGhlIG1hdHJpeCBjb21wb25lbnRzXG4gICAqL1xuICBwcml2YXRlIGNvbnN0cnVjdG9yKG06IFR5cGVkQXJyYXkpIHtcbiAgICBzdXBlcihtLCB7IHR5cGU6IEZsb2F0NjRBcnJheSB9KTtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgemVybyBtYXRyaXguICovXG4gIHN0YXRpYyB6ZXJvKCk6IE1hdHJpeDIyRCB7XG4gICAgcmV0dXJuIHN1cGVyLl96ZXJvKEZsb2F0NjRBcnJheSkgYXMgTWF0cml4MjJEO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYW4gaWRlbnRpdHkgbWF0cml4LiAqL1xuICBzdGF0aWMgaWRlbnRpdHkoKTogTWF0cml4MjJEIHtcbiAgICByZXR1cm4gc3VwZXIuX2lkZW50aXR5KEZsb2F0NjRBcnJheSkgYXMgTWF0cml4MjJEO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBkdW1teSBtYXRyaXggd2l0aCBhbiBlbXB0eSBhcnJheS4gKi9cbiAgc3RhdGljIGR1bW15KCk6IE1hdHJpeDIyRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9kdW1teShGbG9hdDY0QXJyYXkpIGFzIE1hdHJpeDIyRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIHRoZSB0cmFuc3Bvc2Ugb2YgdGhlIGdpdmVuIG1hdHJpeC4gKi9cbiAgc3RhdGljIHRyYW5zcG9zZShtYXQ6IElNYXRyaXgyMik6IE1hdHJpeDIyRCB7XG4gICAgcmV0dXJuIHN1cGVyLl90cmFuc3Bvc2UobWF0LCBGbG9hdDY0QXJyYXkpIGFzIE1hdHJpeDIyRDtcbiAgfVxuXG4gIC8qKiBBdHRlbXB0cyB0byBpbnZlcnQgdGhlIGdpdmVuIG1hdHJpeCwgcmV0dXJuaW5nIG51bGwgd2hlbiBpdCBpcyBzaW5ndWxhci4gKi9cbiAgc3RhdGljIHRyeUludmVydChtYXQ6IElNYXRyaXgyMik6IE1hdHJpeDIyRCB8IG51bGwge1xuICAgIHJldHVybiBzdXBlci5fdHJ5SW52ZXJ0KG1hdCwgRmxvYXQ2NEFycmF5KSBhcyBNYXRyaXgyMkQgfCBudWxsO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgdGhlIGludmVyc2Ugb2YgdGhlIGdpdmVuIG1hdHJpeCAoaWRlbnRpdHkgd2hlbiBzaW5ndWxhcikuICovXG4gIHN0YXRpYyBpbnZlcnQobWF0OiBJTWF0cml4MjIpOiBNYXRyaXgyMkQge1xuICAgIHJldHVybiBzdXBlci5faW52ZXJ0KG1hdCwgRmxvYXQ2NEFycmF5KSBhcyBNYXRyaXgyMkQ7XG4gIH1cblxuICAvKiogQXR0ZW1wdHMgdG8gaW52ZXJ0IHRoZSBnaXZlbiBtYXRyaXggaW50byBvdXRNYXQuICovXG4gIHN0YXRpYyB0cnlJbnZlcnRUbzxUIGV4dGVuZHMgSU11dGFibGVNYXRyaXgyMj4obWF0OiBJTWF0cml4MjIsIG91dE1hdDogVCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBzdXBlci5fdHJ5SW52ZXJ0VG8obWF0LCBvdXRNYXQpO1xuICB9XG5cbiAgLyoqIEludmVydHMgdGhlIGdpdmVuIG1hdHJpeCBpbnRvIG91dE1hdCAoaWRlbnRpdHkgd2hlbiBzaW5ndWxhcikuICovXG4gIHN0YXRpYyBpbnZlcnRUbzxUIGV4dGVuZHMgSU11dGFibGVNYXRyaXgyMj4obWF0OiBJTWF0cml4MjIsIG91dE1hdDogVCk6IFQge1xuICAgIHJldHVybiBzdXBlci5faW52ZXJ0VG8obWF0LCBvdXRNYXQpIGFzIFQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIDJEIHJvdGF0aW9uIG1hdHJpeC4gKi9cbiAgc3RhdGljIHJvdGF0ZShyYWRpYW46IG51bWJlcik6IE1hdHJpeDIyRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9yb3RhdGUocmFkaWFuLCBGbG9hdDY0QXJyYXkpIGFzIE1hdHJpeDIyRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgMkQgc2NhbGluZyBtYXRyaXguICovXG4gIHN0YXRpYyBzY2FsZSh2ZWM6IElWZWN0b3IyKTogTWF0cml4MjJEIHtcbiAgICByZXR1cm4gc3VwZXIuX3NjYWxlKHZlYywgRmxvYXQ2NEFycmF5KSBhcyBNYXRyaXgyMkQ7XG4gIH1cblxuICAvKiogTXVsdGlwbGllcyB0d28gMngyIG1hdHJpY2VzLiAqL1xuICBzdGF0aWMgbXVsdGlwbHkobF9tYXQ6IElNYXRyaXgyMiwgcl9tYXQ6IElNYXRyaXgyMik6IE1hdHJpeDIyRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9tdWx0aXBseShsX21hdCwgcl9tYXQsIEZsb2F0NjRBcnJheSkgYXMgTWF0cml4MjJEO1xuICB9XG5cbiAgLyoqIE11bHRpcGxpZXMgdHdvIG1hdHJpY2VzIGFuZCBzdG9yZXMgdGhlIHJlc3VsdCBpbiBvdXRNYXQuICovXG4gIHN0YXRpYyBtdWx0aXBseVRvPFQgZXh0ZW5kcyBJTXV0YWJsZU1hdHJpeDIyPihsX21hdDogSU1hdHJpeDIyLCByX21hdDogSU1hdHJpeDIyLCBvdXRNYXQ6IFQpOiBUIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5VG8obF9tYXQsIHJfbWF0LCBvdXRNYXQpIGFzIFQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIHJvdy1tYWpvciBjb21wb25lbnRzLiAqL1xuICBzdGF0aWMgZnJvbUNvcHk0Um93TWFqb3IobTAwOiBudW1iZXIsIG0wMTogbnVtYmVyLCBtMTA6IG51bWJlciwgbTExOiBudW1iZXIpOiBNYXRyaXgyMkQge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHk0Um93TWFqb3IobTAwLCBtMDEsIG0xMCwgbTExLCBGbG9hdDY0QXJyYXkpIGFzIE1hdHJpeDIyRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gY29sdW1uLW1ham9yIGNvbXBvbmVudHMuICovXG4gIHN0YXRpYyBmcm9tQ29weTRDb2x1bW5NYWpvcihtMDA6IG51bWJlciwgbTEwOiBudW1iZXIsIG0wMTogbnVtYmVyLCBtMTE6IG51bWJlcik6IE1hdHJpeDIyRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weTRDb2x1bW5NYWpvcihtMDAsIG0xMCwgbTAxLCBtMTEsIEZsb2F0NjRBcnJheSkgYXMgTWF0cml4MjJEO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggdGhhdCBkaXJlY3RseSB1c2VzIHRoZSBnaXZlbiBGbG9hdDY0QXJyYXkuICovXG4gIHN0YXRpYyBmcm9tRmxvYXQ2NEFycmF5Q29sdW1uTWFqb3IoYXJyYXk6IEZsb2F0NjRBcnJheSk6IE1hdHJpeDIyRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tVHlwZWRBcnJheUNvbHVtbk1ham9yKGFycmF5LCBGbG9hdDY0QXJyYXkpIGFzIE1hdHJpeDIyRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGJ5IGNvcHlpbmcgYSBGbG9hdDY0QXJyYXkgaW4gY29sdW1uLW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlGbG9hdDY0QXJyYXlDb2x1bW5NYWpvcihhcnJheTogRmxvYXQ2NEFycmF5KTogTWF0cml4MjJEIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5VHlwZWRBcnJheUNvbHVtbk1ham9yKGFycmF5LCBGbG9hdDY0QXJyYXkpIGFzIE1hdHJpeDIyRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGJ5IGNvcHlpbmcgYSBGbG9hdDY0QXJyYXkgaW4gcm93LW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlGbG9hdDY0QXJyYXlSb3dNYWpvcihhcnJheTogRmxvYXQ2NEFycmF5KTogTWF0cml4MjJEIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5VHlwZWRBcnJheVJvd01ham9yKGFycmF5LCBGbG9hdDY0QXJyYXkpIGFzIE1hdHJpeDIyRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGJ5IGNvcHlpbmcgYW5vdGhlciBtYXRyaXguICovXG4gIHN0YXRpYyBmcm9tQ29weU1hdHJpeDIyKG1hdDogSU1hdHJpeDIyKTogTWF0cml4MjJEIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5TWF0cml4MjIobWF0LCBGbG9hdDY0QXJyYXkpIGFzIE1hdHJpeDIyRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSA0LWVsZW1lbnQgYXJyYXkgaW4gY29sdW1uLW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheTlDb2x1bW5NYWpvcihhcnJheTogQXJyYXk0PG51bWJlcj4pOiBNYXRyaXgyMkQge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlBcnJheTRDb2x1bW5NYWpvcihhcnJheSwgRmxvYXQ2NEFycmF5KSBhcyBNYXRyaXgyMkQ7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGFuIGFycmF5IGluIGNvbHVtbi1tYWpvciBvcmRlci4gKi9cbiAgc3RhdGljIGZyb21Db3B5QXJyYXlDb2x1bW5NYWpvcihhcnJheTogQXJyYXk8bnVtYmVyPik6IE1hdHJpeDIyRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weUFycmF5Q29sdW1uTWFqb3IoYXJyYXksIEZsb2F0NjRBcnJheSkgYXMgTWF0cml4MjJEO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIDQtZWxlbWVudCBhcnJheSBpbiByb3ctbWFqb3Igb3JkZXIuICovXG4gIHN0YXRpYyBmcm9tQ29weUFycmF5OVJvd01ham9yKGFycmF5OiBBcnJheTQ8bnVtYmVyPik6IE1hdHJpeDIyRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weUFycmF5NFJvd01ham9yKGFycmF5LCBGbG9hdDY0QXJyYXkpIGFzIE1hdHJpeDIyRDtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYW4gYXJyYXkgaW4gcm93LW1ham9yIG9yZGVyLiAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheVJvd01ham9yKGFycmF5OiBBcnJheTxudW1iZXI+KTogTWF0cml4MjJEIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5QXJyYXlSb3dNYWpvcihhcnJheSwgRmxvYXQ2NEFycmF5KSBhcyBNYXRyaXgyMkQ7XG4gIH1cbn1cblxuLyoqXG4gKiBBbGlhcyBmb3IgdGhlIDMyLWJpdCAoRmxvYXQzMkFycmF5KSBpbXBsZW1lbnRhdGlvbiwgbWFraW5nIHRoZSBwcmVjaXNpb24gZXhwbGljaXQuXG4gKi9cbmV4cG9ydCB7IE1hdHJpeDIyIGFzIE1hdHJpeDIyRiB9O1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUVBLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsY0FBYztBQUN2QixTQUFTLHNCQUFzQjtBQUcvQixTQUFTLGdCQUFnQjtBQUV6QixTQUFTLGVBQWU7QUEyQmpCLElBQU0sWUFBTixjQUE4RCxlQUFvQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT3ZHLFlBQVksR0FBZSxVQUF1QjtBQUNoRCxVQUFNO0FBQ04sU0FBSyxLQUFLO0FBQUEsRUFDWjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQVcsTUFBTTtBQUNmLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQVcsTUFBTTtBQUNmLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQVcsTUFBTTtBQUNmLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQVcsTUFBTTtBQUNmLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQUksWUFBWTtBQUNkLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsV0FBVyxrQkFBa0I7QUFDM0IsV0FBTyxnQkFBZ0I7QUFBQSxFQUN6QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtB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
