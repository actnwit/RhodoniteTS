// src/foundation/math/IdentityMatrix33.ts
import { CompositionType } from "../definitions/CompositionType.js";
import { AbstractMatrix } from "./AbstractMatrix.js";
import { Vector3 } from "./Vector3.js";
var _IdentityMatrix33 = class _IdentityMatrix33 extends AbstractMatrix {
  /**
   * Creates a new 3x3 identity matrix instance.
   * Uses a shared static array for memory efficiency.
   */
  constructor() {
    super();
    this._v = _IdentityMatrix33.__v;
  }
  /**
   * Returns a string representation of the identity matrix in a readable format.
   * @returns A formatted string showing the 3x3 identity matrix
   */
  toString() {
    return `1 0 0
0 1 0
0 0 1
`;
  }
  /**
   * Returns an approximate string representation of the matrix.
   * For identity matrix, this is identical to toString() since all values are exact.
   * @returns A formatted string showing the 3x3 identity matrix
   */
  toStringApproximately() {
    return this.toString();
  }
  /**
   * Returns the matrix elements as a flattened array in row-major order.
   * @returns An array containing [1,0,0,0,1,0,0,0,1]
   */
  flattenAsArray() {
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  }
  /**
   * Indicates whether this matrix is a dummy/placeholder matrix.
   * Identity matrices are never considered dummy matrices.
   * @returns Always false for identity matrices
   */
  isDummy() {
    return false;
  }
  /**
   * Checks if another matrix is approximately equal to this identity matrix within a tolerance.
   * @param mat - The matrix to compare against
   * @param delta - The tolerance for floating-point comparison (default: Number.EPSILON)
   * @returns True if the matrix is approximately an identity matrix
   */
  isEqual(mat, delta = Number.EPSILON) {
    if (Math.abs(mat.m00 - 1) < delta && Math.abs(mat.m10) < delta && Math.abs(mat.m20) < delta && Math.abs(mat.m01) < delta && Math.abs(mat.m11 - 1) < delta && Math.abs(mat.m21) < delta && Math.abs(mat.m02) < delta && Math.abs(mat.m12) < delta && Math.abs(mat.m22 - 1) < delta) {
      return true;
    }
    return false;
  }
  /**
   * Checks if another matrix is strictly equal to this identity matrix (exact comparison).
   * Note: This method appears to have a bug - it checks 16 elements instead of 9 for a 3x3 matrix.
   * @param mat - The matrix to compare against
   * @returns True if the matrix is exactly an identity matrix
   */
  isStrictEqual(mat) {
    const v = mat._v;
    if (v[0] === 1 && v[1] === 0 && v[2] === 0 && v[3] === 0 && v[4] === 0 && v[5] === 0 && v[6] === 0 && v[7] === 0 && v[8] === 0 && v[9] === 0 && v[10] === 0 && v[11] === 0 && v[12] === 0 && v[13] === 0 && v[14] === 0 && v[15] === 0) {
      return true;
    }
    return false;
  }
  /**
   * Gets the matrix element at the specified row and column.
   * For identity matrix: returns 1 if row equals column, 0 otherwise.
   * @param row_i - The row index (0-2)
   * @param column_i - The column index (0-2)
   * @returns The matrix element value
   */
  at(row_i, column_i) {
    return row_i === column_i ? 1 : 0;
  }
  /**
   * Calculates the determinant of the identity matrix.
   * The determinant of any identity matrix is always 1.
   * @returns Always returns 1
   */
  determinant() {
    return 1;
  }
  /**
   * Multiplies this identity matrix with a vector.
   * Since this is an identity matrix, the result is the original vector unchanged.
   * @param vec - The vector to multiply
   * @returns The same vector (identity operation)
   */
  multiplyVector(vec) {
    return vec;
  }
  /**
   * Multiplies this identity matrix with a vector and stores the result in an output vector.
   * Since this is an identity matrix, this copies the input vector to the output vector.
   * @param vec - The input vector to multiply
   * @param outVec - The output vector to store the result
   * @returns The output vector containing the result
   */
  multiplyVectorTo(vec, outVec) {
    const v = vec._v;
    outVec._v[0] = v[0];
    outVec._v[1] = v[1];
    outVec._v[2] = v[2];
    outVec._v[3] = v[3];
    return outVec;
  }
  /**
   * Gets the scale components from this matrix.
   * For identity matrix, all scale components are 1.
   * @returns A Vector3 with components [1, 1, 1]
   */
  getScale() {
    return Vector3.fromCopyArray([1, 1, 1]);
  }
  /**
   * Gets the scale components from this matrix and stores them in an output vector.
   * For identity matrix, all scale components are 1.
   * @param outVec - The output vector to store the scale values
   * @returns The output vector containing [1, 1, 1]
   */
  getScaleTo(outVec) {
    const v = outVec._v;
    v[0] = 1;
    v[1] = 1;
    v[2] = 1;
    return outVec;
  }
  /**
   * Creates a copy of this identity matrix.
   * @returns A new IdentityMatrix33 instance
   */
  clone() {
    return new _IdentityMatrix33();
  }
  /**
   * Extracts the rotation part of this matrix.
   * For identity matrix, the rotation is also identity (no rotation).
   * @returns A new IdentityMatrix33 instance representing no rotation
   */
  getRotate() {
    return new _IdentityMatrix33();
  }
  /** Gets the matrix element at row 0, column 0 */
  get m00() {
    return 1;
  }
  /** Gets the matrix element at row 1, column 0 */
  get m10() {
    return 0;
  }
  /** Gets the matrix element at row 2, column 0 */
  get m20() {
    return 0;
  }
  /** Gets the matrix element at row 3, column 0 (not applicable for 3x3 matrix) */
  get m30() {
    return 0;
  }
  /** Gets the matrix element at row 0, column 1 */
  get m01() {
    return 0;
  }
  /** Gets the matrix element at row 1, column 1 */
  get m11() {
    return 1;
  }
  /** Gets the matrix element at row 2, column 1 */
  get m21() {
    return 0;
  }
  /** Gets the matrix element at row 3, column 1 (not applicable for 3x3 matrix) */
  get m31() {
    return 0;
  }
  /** Gets the matrix element at row 0, column 2 */
  get m02() {
    return 0;
  }
  /** Gets the matrix element at row 1, column 2 */
  get m12() {
    return 0;
  }
  /** Gets the matrix element at row 1, column 2 */
  get m22() {
    return 1;
  }
  /** Gets the matrix element at row 3, column 2 (not applicable for 3x3 matrix) */
  get m32() {
    return 0;
  }
  /** Gets the matrix element at row 0, column 3 (not applicable for 3x3 matrix) */
  get m03() {
    return 0;
  }
  /** Gets the matrix element at row 1, column 3 (not applicable for 3x3 matrix) */
  get m13() {
    return 0;
  }
  /** Gets the matrix element at row 2, column 3 (not applicable for 3x3 matrix) */
  get m23() {
    return 0;
  }
  /** Gets the matrix element at row 3, column 3 (not applicable for 3x3 matrix) */
  get m33() {
    return 1;
  }
  /** Gets the class name for debugging and reflection purposes */
  get className() {
    return "IdentityMatrix33";
  }
  /** Gets the composition type for this matrix class */
  static get compositionType() {
    return CompositionType.Mat3;
  }
  /** Indicates that this is an identity matrix class implementation */
  get isIdentityMatrixClass() {
    return true;
  }
  /**
   * Gets the GLSL string representation of the identity matrix as float values.
   * @returns GLSL mat3 constructor string for identity matrix
   */
  get glslStrAsFloat() {
    return "mat3(1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0)";
  }
  /**
   * Gets the GLSL string representation of the identity matrix as integer values.
   * @returns GLSL mat3 constructor string for identity matrix
   */
  get glslStrAsInt() {
    return "mat3(1, 0, 0, 0, 1, 0, 0, 0, 1)";
  }
  /**
   * Gets the GLSL string representation of the identity matrix as unsigned integer values.
   * @returns GLSL mat3 constructor string for identity matrix
   */
  get glslStrAsUint() {
    return "mat3(1, 0, 0, 0, 1, 0, 0, 0, 1)";
  }
  /**
   * Gets the WGSL string representation of the identity matrix as float values.
   * @returns WGSL mat3x3f constructor string for identity matrix
   */
  get wgslStrAsFloat() {
    return "mat3x3f(1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0)";
  }
  /**
   * Gets the WGSL string representation of the identity matrix as integer values.
   * @returns WGSL mat3x3i constructor string for identity matrix
   */
  get wgslStrAsInt() {
    return "mat3x3i(1, 0, 0, 0, 1, 0, 0, 0, 1)";
  }
  /**
   * Gets the WGSL string representation of the identity matrix as unsigned integer values.
   * @returns WGSL mat3x3u constructor string for identity matrix
   */
  get wgslStrAsUint() {
    return "mat3x3u(1, 0, 0, 0, 1, 0, 0, 0, 1)";
  }
};
/** Shared Float32Array containing the identity matrix values [1,0,0,0,1,0,0,0,1] */
_IdentityMatrix33.__v = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
var IdentityMatrix33 = _IdentityMatrix33;
export {
  IdentityMatrix33
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9JZGVudGl0eU1hdHJpeDMzLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBDb21wb3NpdGlvblR5cGUsIHR5cGUgQ29tcG9zaXRpb25UeXBlRW51bSB9IGZyb20gJy4uL2RlZmluaXRpb25zL0NvbXBvc2l0aW9uVHlwZSc7XG5pbXBvcnQgeyBBYnN0cmFjdE1hdHJpeCB9IGZyb20gJy4vQWJzdHJhY3RNYXRyaXgnO1xuaW1wb3J0IHR5cGUgeyBJTWF0cml4LCBJTWF0cml4MzMgfSBmcm9tICcuL0lNYXRyaXgnO1xuaW1wb3J0IHR5cGUgeyBJVmVjdG9yIH0gZnJvbSAnLi9JVmVjdG9yJztcbmltcG9ydCB0eXBlIHsgTWF0cml4MzMgfSBmcm9tICcuL01hdHJpeDMzJztcbmltcG9ydCB0eXBlIHsgTXV0YWJsZVZlY3RvcjMgfSBmcm9tICcuL011dGFibGVWZWN0b3IzJztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICcuL1ZlY3RvcjMnO1xuXG4vKipcbiAqIEEgM3gzIGlkZW50aXR5IG1hdHJpeCBpbXBsZW1lbnRhdGlvbiB0aGF0IHJlcHJlc2VudHMgdGhlIG11bHRpcGxpY2F0aXZlIGlkZW50aXR5IGZvciAzeDMgbWF0cmljZXMuXG4gKiBUaGlzIG1hdHJpeCBoYXMgMXMgb24gdGhlIG1haW4gZGlhZ29uYWwgYW5kIDBzIGVsc2V3aGVyZTpcbiAqIGBgYFxuICogWzEgMCAwXVxuICogWzAgMSAwXVxuICogWzAgMCAxXVxuICogYGBgXG4gKlxuICogVGhpcyBjbGFzcyBpcyBvcHRpbWl6ZWQgZm9yIGlkZW50aXR5IG1hdHJpeCBvcGVyYXRpb25zIGFuZCBwcm92aWRlcyBjb25zdGFudC10aW1lXG4gKiBhY2Nlc3MgdG8gbWF0cml4IGVsZW1lbnRzIHdpdGhvdXQgc3RvcmluZyB0aGUgYWN0dWFsIG1hdHJpeCBkYXRhLlxuICovXG5leHBvcnQgY2xhc3MgSWRlbnRpdHlNYXRyaXgzMyBleHRlbmRzIEFic3RyYWN0TWF0cml4IGltcGxlbWVudHMgSU1hdHJpeCwgSU1hdHJpeDMzIHtcbiAgLyoqIFNoYXJlZCBGbG9hdDMyQXJyYXkgY29udGFpbmluZyB0aGUgaWRlbnRpdHkgbWF0cml4IHZhbHVlcyBbMSwwLDAsMCwxLDAsMCwwLDFdICovXG4gIHN0YXRpYyByZWFkb25seSBfX3YgPSBuZXcgRmxvYXQzMkFycmF5KFsxLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAxXSk7XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgM3gzIGlkZW50aXR5IG1hdHJpeCBpbnN0YW5jZS5cbiAgICogVXNlcyBhIHNoYXJlZCBzdGF0aWMgYXJyYXkgZm9yIG1lbW9yeSBlZmZpY2llbmN5LlxuICAgKi9cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl92ID0gSWRlbnRpdHlNYXRyaXgzMy5fX3Y7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgaWRlbnRpdHkgbWF0cml4IGluIGEgcmVhZGFibGUgZm9ybWF0LlxuICAgKiBAcmV0dXJucyBBIGZvcm1hdHRlZCBzdHJpbmcgc2hvd2luZyB0aGUgM3gzIGlkZW50aXR5IG1hdHJpeFxuICAgKi9cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYDEgMCAwXG4wIDEgMFxuMCAwIDFcbmA7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBhcHByb3hpbWF0ZSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG1hdHJpeC5cbiAgICogRm9yIGlkZW50aXR5IG1hdHJpeCwgdGhpcyBpcyBpZGVudGljYWwgdG8gdG9TdHJpbmcoKSBzaW5jZSBhbGwgdmFsdWVzIGFyZSBleGFjdC5cbiAgICogQHJldHVybnMgQSBmb3JtYXR0ZWQgc3RyaW5nIHNob3dpbmcgdGhlIDN4MyBpZGVudGl0eSBtYXRyaXhcbiAgICovXG4gIHRvU3RyaW5nQXBwcm94aW1hdGVseSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnRvU3RyaW5nKCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbWF0cml4IGVsZW1lbnRzIGFzIGEgZmxhdHRlbmVkIGFycmF5IGluIHJvdy1tYWpvciBvcmRlci5cbiAgICogQHJldHVybnMgQW4gYXJyYXkgY29udGFpbmluZyBbMSwwLDAsMCwxLDAsMCwwLDFdXG4gICAqL1xuICBmbGF0dGVuQXNBcnJheSgpOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIFsxLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAxXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgd2hldGhlciB0aGlzIG1hdHJpeCBpcyBhIGR1bW15L3BsYWNlaG9sZGVyIG1hdHJpeC5cbiAgICogSWRlbnRpdHkgbWF0cmljZXMgYXJlIG5ldmVyIGNvbnNpZGVyZWQgZHVtbXkgbWF0cmljZXMuXG4gICAqIEByZXR1cm5zIEFsd2F5cyBmYWxzZSBmb3IgaWRlbnRpdHkgbWF0cmljZXNcbiAgICovXG4gIGlzRHVtbXkoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhbm90aGVyIG1hdHJpeCBpcyBhcHByb3hpbWF0ZWx5IGVxdWFsIHRvIHRoaXMgaWRlbnRpdHkgbWF0cml4IHdpdGhpbiBhIHRvbGVyYW5jZS5cbiAgICogQHBhcmFtIG1hdCAtIFRoZSBtYXRyaXggdG8gY29tcGFyZSBhZ2FpbnN0XG4gICAqIEBwYXJhbSBkZWx0YSAtIFRoZSB0b2xlcmFuY2UgZm9yIGZsb2F0aW5nLXBvaW50IGNvbXBhcmlzb24gKGRlZmF1bHQ6IE51bWJlci5FUFNJTE9OKVxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBtYXRyaXggaXMgYXBwcm94aW1hdGVseSBhbiBpZGVudGl0eSBtYXRyaXhcbiAgICovXG4gIGlzRXF1YWwobWF0OiBJTWF0cml4MzMsIGRlbHRhOiBudW1iZXIgPSBOdW1iZXIuRVBTSUxPTik6IGJvb2xlYW4ge1xuICAgIGlmIChcbiAgICAgIE1hdGguYWJzKG1hdC5tMDAgLSAxKSA8IGRlbHRhICYmXG4gICAgICBNYXRoLmFicyhtYXQubTEwKSA8IGRlbHRhICYmXG4gICAgICBNYXRoLmFicyhtYXQubTIwKSA8IGRlbHRhICYmXG4gICAgICBNYXRoLmFicyhtYXQubTAxKSA8IGRlbHRhICYmXG4gICAgICBNYXRoLmFicyhtYXQubTExIC0gMSkgPCBkZWx0YSAmJlxuICAgICAgTWF0aC5hYnMobWF0Lm0yMSkgPCBkZWx0YSAmJlxuICAgICAgTWF0aC5hYnMobWF0Lm0wMikgPCBkZWx0YSAmJlxuICAgICAgTWF0aC5hYnMobWF0Lm0xMikgPCBkZWx0YSAmJlxuICAgICAgTWF0aC5hYnMobWF0Lm0yMiAtIDEpIDwgZGVsdGFcbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGFub3RoZXIgbWF0cml4IGlzIHN0cmljdGx5IGVxdWFsIHRvIHRoaXMgaWRlbnRpdHkgbWF0cml4IChleGFjdCBjb21wYXJpc29uKS5cbiAgICogTm90ZTogVGhpcyBtZXRob2QgYXBwZWFycyB0byBoYXZlIGEgYnVnIC0gaXQgY2hlY2tzIDE2IGVsZW1lbnRzIGluc3RlYWQgb2YgOSBmb3IgYSAzeDMgbWF0cml4LlxuICAgKiBAcGFyYW0gbWF0IC0gVGhlIG1hdHJpeCB0byBjb21wYXJlIGFnYWluc3RcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgbWF0cml4IGlzIGV4YWN0bHkgYW4gaWRlbnRpdHkgbWF0cml4XG4gICAqL1xuICBpc1N0cmljdEVxdWFsKG1hdDogSU1hdHJpeDMzKTogYm9vbGVhbiB7XG4gICAgY29uc3QgdiA9IChtYXQgYXMgTWF0cml4MzMpLl92O1xuICAgIGlmIChcbiAgICAgIHZbMF0gPT09IDEgJiZcbiAgICAgIHZbMV0gPT09IDAgJiZcbiAgICAgIHZbMl0gPT09IDAgJiZcbiAgICAgIHZbM10gPT09IDAgJiZcbiAgICAgIHZbNF0gPT09IDAgJiZcbiAgICAgIHZbNV0gPT09IDAgJiZcbiAgICAgIHZbNl0gPT09IDAgJiZcbiAgICAgIHZbN10gPT09IDAgJiZcbiAgICAgIHZbOF0gPT09IDAgJiZcbiAgICAgIHZbOV0gPT09IDAgJiZcbiAgICAgIHZbMTBdID09PSAwICYmXG4gICAgICB2WzExXSA9PT0gMCAmJlxuICAgICAgdlsxMl0gPT09IDAgJiZcbiAgICAgIHZbMTNdID09PSAwICYmXG4gICAgICB2WzE0XSA9PT0gMCAmJlxuICAgICAgdlsxNV0gPT09IDBcbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF0cml4IGVsZW1lbnQgYXQgdGhlIHNwZWNpZmllZCByb3cgYW5kIGNvbHVtbi5cbiAgICogRm9yIGlkZW50aXR5IG1hdHJpeDogcmV0dXJucyAxIGlmIHJvdyBlcXVhbHMgY29sdW1uLCAwIG90aGVyd2lzZS5cbiAgICogQHBhcmFtIHJvd19pIC0gVGhlIHJvdyBpbmRleCAoMC0yKVxuICAgKiBAcGFyYW0gY29sdW1uX2kgLSBUaGUgY29sdW1uIGluZGV4ICgwLTIpXG4gICAqIEByZXR1cm5zIFRoZSBtYXRyaXggZWxlbWVudCB2YWx1ZVxuICAgKi9cbiAgYXQocm93X2k6IG51bWJlciwgY29sdW1uX2k6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIHJvd19pID09PSBjb2x1bW5faSA/IDEgOiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIGRldGVybWluYW50IG9mIHRoZSBpZGVudGl0eSBtYXRyaXguXG4gICAqIFRoZSBkZXRlcm1pbmFudCBvZiBhbnkgaWRlbnRpdHkgbWF0cml4IGlzIGFsd2F5cyAxLlxuICAgKiBAcmV0dXJucyBBbHdheXMgcmV0dXJucyAxXG4gICAqL1xuICBkZXRlcm1pbmFudCgpOiBudW1iZXIge1xuICAgIHJldHVybiAxO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgdGhpcyBpZGVudGl0eSBtYXRyaXggd2l0aCBhIHZlY3Rvci5cbiAgICogU2luY2UgdGhpcyBpcyBhbiBpZGVudGl0eSBtYXRyaXgsIHRoZSByZXN1bHQgaXMgdGhlIG9yaWdpbmFsIHZlY3RvciB1bmNoYW5nZWQuXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIG11bHRpcGx5XG4gICAqIEByZXR1cm5zIFRoZSBzYW1lIHZlY3RvciAoaWRlbnRpdHkgb3BlcmF0aW9uKVxuICAgKi9cbiAgbXVsdGlwbHlWZWN0b3IodmVjOiBJVmVjdG9yKSB7XG4gICAgcmV0dXJuIHZlYztcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIHRoaXMgaWRlbnRpdHkgbWF0cml4IHdpdGggYSB2ZWN0b3IgYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIGFuIG91dHB1dCB2ZWN0b3IuXG4gICAqIFNpbmNlIHRoaXMgaXMgYW4gaWRlbnRpdHkgbWF0cml4LCB0aGlzIGNvcGllcyB0aGUgaW5wdXQgdmVjdG9yIHRvIHRoZSBvdXRwdXQgdmVjdG9yLlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIGlucHV0IHZlY3RvciB0byBtdWx0aXBseVxuICAgKiBAcGFyYW0gb3V0VmVjIC0gVGhlIG91dHB1dCB2ZWN0b3IgdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHZlY3RvciBjb250YWluaW5nIHRoZSByZXN1bHRcbiAgICovXG4gIG11bHRpcGx5VmVjdG9yVG8odmVjOiBJVmVjdG9yLCBvdXRWZWM6IE11dGFibGVWZWN0b3IzKTogTXV0YWJsZVZlY3RvcjMge1xuICAgIGNvbnN0IHYgPSAodmVjIGFzIFZlY3RvcjMpLl92O1xuICAgIG91dFZlYy5fdlswXSA9IHZbMF07XG4gICAgb3V0VmVjLl92WzFdID0gdlsxXTtcbiAgICBvdXRWZWMuX3ZbMl0gPSB2WzJdO1xuICAgIG91dFZlYy5fdlszXSA9IHZbM107XG5cbiAgICByZXR1cm4gb3V0VmVjO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHNjYWxlIGNvbXBvbmVudHMgZnJvbSB0aGlzIG1hdHJpeC5cbiAgICogRm9yIGlkZW50aXR5IG1hdHJpeCwgYWxsIHNjYWxlIGNvbXBvbmVudHMgYXJlIDEuXG4gICAqIEByZXR1cm5zIEEgVmVjdG9yMyB3aXRoIGNvbXBvbmVudHMgWzEsIDEsIDFdXG4gICAqL1xuICBnZXRTY2FsZSgpOiBWZWN0b3IzIHtcbiAgICByZXR1cm4gVmVjdG9yMy5mcm9tQ29weUFycmF5KFsxLCAxLCAxXSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc2NhbGUgY29tcG9uZW50cyBmcm9tIHRoaXMgbWF0cml4IGFuZCBzdG9yZXMgdGhlbSBpbiBhbiBvdXRwdXQgdmVjdG9yLlxuICAgKiBGb3IgaWRlbnRpdHkgbWF0cml4LCBhbGwgc2NhbGUgY29tcG9uZW50cyBhcmUgMS5cbiAgICogQHBhcmFtIG91dFZlYyAtIFRoZSBvdXRwdXQgdmVjdG9yIHRvIHN0b3JlIHRoZSBzY2FsZSB2YWx1ZXNcbiAgICogQHJldHVybnMgVGhlIG91dHB1dCB2ZWN0b3IgY29udGFpbmluZyBbMSwgMSwgMV1cbiAgICovXG4gIGdldFNjYWxlVG8ob3V0VmVjOiBNdXRhYmxlVmVjdG9yMyk6IE11dGFibGVWZWN0b3IzIHtcbiAgICBjb25zdCB2ID0gKG91dFZlYyBhcyBNdXRhYmxlVmVjdG9yMykuX3Y7XG5cbiAgICB2WzBdID0gMTtcbiAgICB2WzFdID0gMTtcbiAgICB2WzJdID0gMTtcblxuICAgIHJldHVybiBvdXRWZWM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGNvcHkgb2YgdGhpcyBpZGVudGl0eSBtYXRyaXguXG4gICAqIEByZXR1cm5zIEEgbmV3IElkZW50aXR5TWF0cml4MzMgaW5zdGFuY2VcbiAgICovXG4gIGNsb25lKCk6IElkZW50aXR5TWF0cml4MzMge1xuICAgIHJldHVybiBuZXcgSWRlbnRpdHlNYXRyaXgzMygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4dHJhY3RzIHRoZSByb3RhdGlvbiBwYXJ0IG9mIHRoaXMgbWF0cml4LlxuICAgKiBGb3IgaWRlbnRpdHkgbWF0cml4LCB0aGUgcm90YXRpb24gaXMgYWxzbyBpZGVudGl0eSAobm8gcm90YXRpb24pLlxuICAgKiBAcmV0dXJucyBBIG5ldyBJZGVudGl0eU1hdHJpeDMzIGluc3RhbmNlIHJlcHJlc2VudGluZyBubyByb3RhdGlvblxuICAgKi9cbiAgZ2V0Um90YXRlKCk6IElkZW50aXR5TWF0cml4MzMge1xuICAgIHJldHVybiBuZXcgSWRlbnRpdHlNYXRyaXgzMygpO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHJvdyAwLCBjb2x1bW4gMCAqL1xuICBwdWJsaWMgZ2V0IG0wMCgpOiBudW1iZXIge1xuICAgIHJldHVybiAxO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHJvdyAxLCBjb2x1bW4gMCAqL1xuICBwdWJsaWMgZ2V0IG0xMCgpOiBudW1iZXIge1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHJvdyAyLCBjb2x1bW4gMCAqL1xuICBwdWJsaWMgZ2V0IG0yMCgpOiBudW1iZXIge1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHJvdyAzLCBjb2x1bW4gMCAobm90IGFwcGxpY2FibGUgZm9yIDN4MyBtYXRyaXgpICovXG4gIHB1YmxpYyBnZXQgbTMwKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgbWF0cml4IGVsZW1lbnQgYXQgcm93IDAsIGNvbHVtbiAxICovXG4gIHB1YmxpYyBnZXQgbTAxKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgbWF0cml4IGVsZW1lbnQgYXQgcm93IDEsIGNvbHVtbiAxICovXG4gIHB1YmxpYyBnZXQgbTExKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIDE7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgbWF0cml4IGVsZW1lbnQgYXQgcm93IDIsIGNvbHVtbiAxICovXG4gIHB1YmxpYyBnZXQgbTIxKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgbWF0cml4IGVsZW1lbnQgYXQgcm93IDMsIGNvbHVtbiAxIChub3QgYXBwbGljYWJsZSBmb3IgM3gzIG1hdHJpeCkgKi9cbiAgcHVibGljIGdldCBtMzEoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCByb3cgMCwgY29sdW1uIDIgKi9cbiAgcHVibGljIGdldCBtMDIoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCByb3cgMSwgY29sdW1uIDIgKi9cbiAgcHVibGljIGdldCBtMTIoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCByb3cgMSwgY29sdW1uIDIgKi9cbiAgcHVibGljIGdldCBtMjIoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCByb3cgMywgY29sdW1uIDIgKG5vdCBhcHBsaWNhYmxlIGZvciAzeDMgbWF0cml4KSAqL1xuICBwdWJsaWMgZ2V0IG0zMigpOiBudW1iZXIge1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHJvdyAwLCBjb2x1bW4gMyAobm90IGFwcGxpY2FibGUgZm9yIDN4MyBtYXRyaXgpICovXG4gIHB1YmxpYyBnZXQgbTAzKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgbWF0cml4IGVsZW1lbnQgYXQgcm93IDEsIGNvbHVtbiAzIChub3QgYXBwbGljYWJsZSBmb3IgM3gzIG1hdHJpeCkgKi9cbiAgcHVibGljIGdldCBtMTMoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCByb3cgMiwgY29sdW1uIDMgKG5vdCBhcHBsaWNhYmxlIGZvciAzeDMgbWF0cml4KSAqL1xuICBwdWJsaWMgZ2V0IG0yMygpOiBudW1iZXIge1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHJvdyAzLCBjb2x1bW4gMyAobm90IGFwcGxpY2FibGUgZm9yIDN4MyBtYXRyaXgpICovXG4gIHB1YmxpYyBnZXQgbTMzKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIDE7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgY2xhc3MgbmFtZSBmb3IgZGVidWdnaW5nIGFuZCByZWZsZWN0aW9uIHB1cnBvc2VzICovXG4gIGdldCBjbGFzc05hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJ0lkZW50aXR5TWF0cml4MzMnO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIGNvbXBvc2l0aW9uIHR5cGUgZm9yIHRoaXMgbWF0cml4IGNsYXNzICovXG4gIHN0YXRpYyBnZXQgY29tcG9zaXRpb25UeXBlKCk6IENvbXBvc2l0aW9uVHlwZUVudW0ge1xuICAgIHJldHVybiBDb21wb3NpdGlvblR5cGUuTWF0MztcbiAgfVxuXG4gIC8qKiBJbmRpY2F0ZXMgdGhhdCB0aGlzIGlzIGFuIGlkZW50aXR5IG1hdHJpeCBjbGFzcyBpbXBsZW1lbnRhdGlvbiAqL1xuICBnZXQgaXNJZGVudGl0eU1hdHJpeENsYXNzKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIEdMU0wgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBpZGVudGl0eSBtYXRyaXggYXMgZmxvYXQgdmFsdWVzLlxuICAgKiBAcmV0dXJucyBHTFNMIG1hdDMgY29uc3RydWN0b3Igc3RyaW5nIGZvciBpZGVudGl0eSBtYXRyaXhcbiAgICovXG4gIGdldCBnbHNsU3RyQXNGbG9hdCgpOiBzdHJpbmcge1xuICAgIHJldHVybiAnbWF0MygxLjAsIDAuMCwgMC4wLCAwLjAsIDEuMCwgMC4wLCAwLjAsIDAuMCwgMS4wKSc7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgR0xTTCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIGlkZW50aXR5IG1hdHJpeCBhcyBpbnRlZ2VyIHZhbHVlcy5cbiAgICogQHJldHVybnMgR0xTTCBtYXQzIGNvbnN0cnVjdG9yIHN0cmluZyBmb3IgaWRlbnRpdHkgbWF0cml4XG4gICAqL1xuICBnZXQgZ2xzbFN0ckFzSW50KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICdtYXQzKDEsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDEpJztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBHTFNMIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgaWRlbnRpdHkgbWF0cml4IGFzIHVuc2lnbmVkIGludGVnZXIgdmFsdWVzLlxuICAgKiBAcmV0dXJucyBHTFNMIG1hdDMgY29uc3RydWN0b3Igc3RyaW5nIGZvciBpZGVudGl0eSBtYXRyaXhcbiAgICovXG4gIGdldCBnbHNsU3RyQXNVaW50KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICdtYXQzKDEsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDEpJztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBXR1NMIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgaWRlbnRpdHkgbWF0cml4IGFzIGZsb2F0IHZhbHVlcy5cbiAgICogQHJldHVybnMgV0dTTCBtYXQzeDNmIGNvbnN0cnVjdG9yIHN0cmluZyBmb3IgaWRlbnRpdHkgbWF0cml4XG4gICAqL1xuICBnZXQgd2dzbFN0ckFzRmxvYXQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJ21hdDN4M2YoMS4wLCAwLjAsIDAuMCwgMC4wLCAxLjAsIDAuMCwgMC4wLCAwLjAsIDEuMCknO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIFdHU0wgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBpZGVudGl0eSBtYXRyaXggYXMgaW50ZWdlciB2YWx1ZXMuXG4gICAqIEByZXR1cm5zIFdHU0wgbWF0M3gzaSBjb25zdHJ1Y3RvciBzdHJpbmcgZm9yIGlkZW50aXR5IG1hdHJpeFxuICAgKi9cbiAgZ2V0IHdnc2xTdHJBc0ludCgpOiBzdHJpbmcge1xuICAgIHJldHVybiAnbWF0M3gzaSgxLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAxKSc7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgV0dTTCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIGlkZW50aXR5IG1hdHJpeCBhcyB1bnNpZ25lZCBpbnRlZ2VyIHZhbHVlcy5cbiAgICogQHJldHVybnMgV0dTTCBtYXQzeDN1IGNvbnN0cnVjdG9yIHN0cmluZyBmb3IgaWRlbnRpdHkgbWF0cml4XG4gICAqL1xuICBnZXQgd2dzbFN0ckFzVWludCgpOiBzdHJpbmcge1xuICAgIHJldHVybiAnbWF0M3gzdSgxLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAxKSc7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBQSxTQUFTLHVCQUFpRDtBQUMxRCxTQUFTLHNCQUFzQjtBQUsvQixTQUFTLGVBQWU7QUFjakIsSUFBTSxvQkFBTixNQUFNLDBCQUF5QixlQUE2QztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRakYsY0FBYztBQUNaLFVBQU07QUFDTixTQUFLLEtBQUssa0JBQWlCO0FBQUEsRUFDN0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsV0FBbUI7QUFDakIsV0FBTztBQUFBO0FBQUE7QUFBQTtBQUFBLEVBSVQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSx3QkFBZ0M7QUFD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
