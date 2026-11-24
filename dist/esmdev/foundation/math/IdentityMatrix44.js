// src/foundation/math/IdentityMatrix44.ts
import { CompositionType } from "../definitions/CompositionType.js";
import { AbstractMatrix } from "./AbstractMatrix.js";
import { Vector3 } from "./Vector3.js";
var _IdentityMatrix44 = class _IdentityMatrix44 extends AbstractMatrix {
  /**
   * Creates a new IdentityMatrix44 instance.
   * The internal array reference points to the static identity matrix values.
   */
  constructor() {
    super();
    this._v = _IdentityMatrix44.Bt;
  }
  /**
   * Returns a string representation of the identity matrix in a readable format.
   * Each row is separated by newlines for visual clarity.
   *
   * @returns A formatted string showing the 4x4 identity matrix
   */
  toString() {
    return `1 0 0 0
0 1 0 0
0 0 1 0
0 0 0 1
`;
  }
  /**
   * Returns an approximate string representation of the matrix.
   * For identity matrix, this is identical to toString() since all values are exact.
   *
   * @returns A formatted string showing the 4x4 identity matrix
   */
  toStringApproximately() {
    return this.toString();
  }
  /**
   * Returns the matrix elements as a flat array in column-major order.
   *
   * @returns An array of 16 numbers representing the identity matrix
   */
  flattenAsArray() {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  }
  /**
   * Indicates whether this matrix is a dummy/placeholder matrix.
   * Identity matrix is not considered a dummy matrix.
   *
   * @returns Always false for identity matrix
   */
  isDummy() {
    return false;
  }
  /**
   * Checks if the given matrix is approximately equal to this identity matrix within a tolerance.
   * Compares each element of the input matrix against the corresponding identity matrix element.
   *
   * @param mat - The matrix to compare against this identity matrix
   * @param delta - The tolerance for floating-point comparison (default: Number.EPSILON)
   * @returns True if the matrix is approximately an identity matrix, false otherwise
   */
  isEqual(mat, delta = Number.EPSILON) {
    if (Math.abs(mat.m00 - 1) < delta && Math.abs(mat.m10) < delta && Math.abs(mat.m20) < delta && Math.abs(mat.m30) < delta && Math.abs(mat.m01) < delta && Math.abs(mat.m11 - 1) < delta && Math.abs(mat.m21) < delta && Math.abs(mat.m31) < delta && Math.abs(mat.m02) < delta && Math.abs(mat.m12) < delta && Math.abs(mat.m22 - 1) < delta && Math.abs(mat.m32) < delta && Math.abs(mat.m03) < delta && Math.abs(mat.m13) < delta && Math.abs(mat.m23) < delta && Math.abs(mat.m33 - 1) < delta) {
      return true;
    }
    return false;
  }
  /**
   * Performs a strict equality check against another matrix.
   * Uses exact floating-point comparison without tolerance.
   *
   * @param mat - The matrix to compare for strict equality
   * @returns True if the matrix is exactly an identity matrix, false otherwise
   */
  isStrictEqual(mat) {
    const v = mat._v;
    if (v[0] === 1 && v[1] === 0 && v[2] === 0 && v[3] === 0 && v[4] === 0 && v[5] === 1 && v[6] === 0 && v[7] === 0 && v[8] === 0 && v[9] === 0 && v[10] === 1 && v[11] === 0 && v[12] === 0 && v[13] === 0 && v[14] === 0 && v[15] === 1) {
      return true;
    }
    return false;
  }
  /**
   * Gets the matrix element at the specified row and column indices.
   * For identity matrix, returns 1 for diagonal elements and 0 for off-diagonal elements.
   *
   * @param row_i - The row index (0-based)
   * @param column_i - The column index (0-based)
   * @returns 1 if row equals column (diagonal), 0 otherwise
   */
  at(row_i, column_i) {
    return row_i === column_i ? 1 : 0;
  }
  /**
   * Gets the matrix element at the specified linear index in column-major order.
   * For identity matrix, returns 1 for diagonal positions and 0 elsewhere.
   *
   * @param i - The linear index (0-15) in column-major order
   * @returns 1 for diagonal elements (indices 0, 5, 10, 15), 0 otherwise
   */
  v(i) {
    return i % 5 === 0 ? 1 : 0;
  }
  /**
   * Calculates the determinant of this identity matrix.
   * The determinant of an identity matrix is always 1.
   *
   * @returns Always returns 1
   */
  determinant() {
    return 1;
  }
  /**
   * Multiplies this identity matrix with a 4D vector.
   * Since this is an identity matrix, the result is the input vector unchanged.
   *
   * @param vec - The 4D vector to multiply
   * @returns The same vector (identity transformation)
   */
  multiplyVector(vec) {
    return vec;
  }
  /**
   * Multiplies this identity matrix with a 3D vector.
   * Since this is an identity matrix, the result is the input vector unchanged.
   *
   * @param vec - The 3D vector to multiply
   * @returns The same vector (identity transformation)
   */
  multiplyVector3(vec) {
    return vec;
  }
  /**
   * Multiplies this identity matrix with a vector and stores the result in an output vector.
   * Since this is an identity matrix, copies the input vector to the output vector.
   *
   * @param vec - The input vector to multiply
   * @param outVec - The mutable vector to store the result
   * @returns The output vector containing the copied values
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
   * Extracts the scale components from this transformation matrix.
   * For identity matrix, the scale is (1, 1, 1).
   *
   * @returns A Vector3 with all components set to 1
   */
  getScale() {
    return Vector3.one();
  }
  /**
   * Extracts the scale components and stores them in an output vector.
   * For identity matrix, sets all scale components to 1.
   *
   * @param outVec - The mutable vector to store the scale values
   * @returns The output vector with scale components set to 1
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
   * Returns a new IdentityMatrix44 instance.
   *
   * @returns A new IdentityMatrix44 instance
   */
  clone() {
    return new _IdentityMatrix44();
  }
  /**
   * Extracts the rotation part of this transformation matrix.
   * For identity matrix, the rotation is also an identity matrix.
   *
   * @returns A new IdentityMatrix44 representing no rotation
   */
  getRotate() {
    return new _IdentityMatrix44();
  }
  /**
   * Extracts the translation components from this transformation matrix.
   * For identity matrix, the translation is (0, 0, 0).
   *
   * @returns A Vector3 with all components set to 0
   */
  getTranslate() {
    return Vector3.zero();
  }
  /**
   * Extracts the translation components from this transformation matrix
   * and stores them in the output vector.
   * For identity matrix, the translation is (0, 0, 0).
   *
   * @param outVec - The output vector to store the translation
   * @returns The output vector with all components set to 0
   */
  getTranslateTo(outVec) {
    return outVec.setComponents(0, 0, 0);
  }
  /**
   * Gets the matrix element at row 0, column 0.
   * @returns Always 1 for identity matrix
   */
  get m00() {
    return 1;
  }
  /**
   * Gets the matrix element at row 1, column 0.
   * @returns Always 0 for identity matrix
   */
  get m10() {
    return 0;
  }
  /**
   * Gets the matrix element at row 2, column 0.
   * @returns Always 0 for identity matrix
   */
  get m20() {
    return 0;
  }
  /**
   * Gets the matrix element at row 3, column 0.
   * @returns Always 0 for identity matrix
   */
  get m30() {
    return 0;
  }
  /**
   * Gets the matrix element at row 0, column 1.
   * @returns Always 0 for identity matrix
   */
  get m01() {
    return 0;
  }
  /**
   * Gets the matrix element at row 1, column 1.
   * @returns Always 1 for identity matrix
   */
  get m11() {
    return 1;
  }
  /**
   * Gets the matrix element at row 2, column 1.
   * @returns Always 0 for identity matrix
   */
  get m21() {
    return 0;
  }
  /**
   * Gets the matrix element at row 3, column 1.
   * @returns Always 0 for identity matrix
   */
  get m31() {
    return 0;
  }
  /**
   * Gets the matrix element at row 0, column 2.
   * @returns Always 0 for identity matrix
   */
  get m02() {
    return 0;
  }
  /**
   * Gets the matrix element at row 1, column 2.
   * @returns Always 0 for identity matrix
   */
  get m12() {
    return 0;
  }
  /**
   * Gets the matrix element at row 2, column 2.
   * @returns Always 1 for identity matrix
   */
  get m22() {
    return 1;
  }
  /**
   * Gets the matrix element at row 3, column 2.
   * @returns Always 0 for identity matrix
   */
  get m32() {
    return 0;
  }
  /**
   * Gets the matrix element at row 0, column 3.
   * @returns Always 0 for identity matrix
   */
  get m03() {
    return 0;
  }
  /**
   * Gets the matrix element at row 1, column 3.
   * @returns Always 0 for identity matrix
   */
  get m13() {
    return 0;
  }
  /**
   * Gets the matrix element at row 2, column 3.
   * @returns Always 0 for identity matrix
   */
  get m23() {
    return 0;
  }
  /**
   * Gets the matrix element at row 3, column 3.
   * @returns Always 1 for identity matrix
   */
  get m33() {
    return 1;
  }
  /**
   * Gets the X translation component from the matrix.
   * @returns Always 0 for identity matrix
   */
  get translateX() {
    return 0;
  }
  /**
   * Gets the Y translation component from the matrix.
   * @returns Always 0 for identity matrix
   */
  get translateY() {
    return 0;
  }
  /**
   * Gets the Z translation component from the matrix.
   * @returns Always 0 for identity matrix
   */
  get translateZ() {
    return 0;
  }
  /**
   * Gets the class name for debugging and reflection purposes.
   * @returns The string 'IdentityMatrix44'
   */
  get className() {
    return "IdentityMatrix44";
  }
  /**
   * Gets the composition type for this matrix class.
   * @returns CompositionType.Mat4 indicating this is a 4x4 matrix
   */
  static get compositionType() {
    return CompositionType.Mat4;
  }
  /**
   * Indicates whether this matrix is an identity matrix class.
   * @returns Always true for IdentityMatrix44
   */
  get isIdentityMatrixClass() {
    return true;
  }
};
/**
 * Static array representing the identity matrix values in column-major order.
 * This is shared across all instances for memory efficiency.
 */
_IdentityMatrix44.Bt = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
var IdentityMatrix44 = _IdentityMatrix44;
export {
  IdentityMatrix44
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9JZGVudGl0eU1hdHJpeDQ0LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKiBlc2xpbnQtZGlzYWJsZSBwcmV0dGllci9wcmV0dGllciAqL1xuaW1wb3J0IHsgQ29tcG9zaXRpb25UeXBlLCB0eXBlIENvbXBvc2l0aW9uVHlwZUVudW0gfSBmcm9tICcuLi9kZWZpbml0aW9ucy9Db21wb3NpdGlvblR5cGUnO1xuaW1wb3J0IHsgQWJzdHJhY3RNYXRyaXggfSBmcm9tICcuL0Fic3RyYWN0TWF0cml4JztcbmltcG9ydCB0eXBlIHsgSU1hdHJpeCwgSU1hdHJpeDQ0IH0gZnJvbSAnLi9JTWF0cml4JztcbmltcG9ydCB0eXBlIHsgSVZlY3RvciwgSVZlY3RvcjMsIElWZWN0b3I0IH0gZnJvbSAnLi9JVmVjdG9yJztcbmltcG9ydCB0eXBlIHsgTWF0cml4NDQgfSBmcm9tICcuL01hdHJpeDQ0JztcbmltcG9ydCB0eXBlIHsgTXV0YWJsZVZlY3RvcjMgfSBmcm9tICcuL011dGFibGVWZWN0b3IzJztcbmltcG9ydCB0eXBlIHsgTXV0YWJsZVZlY3RvcjQgfSBmcm9tICcuL011dGFibGVWZWN0b3I0JztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICcuL1ZlY3RvcjMnO1xuaW1wb3J0IHR5cGUgeyBWZWN0b3I0IH0gZnJvbSAnLi9WZWN0b3I0JztcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgNHg0IGlkZW50aXR5IG1hdHJpeCB0aGF0IHByb3ZpZGVzIG9wdGltaXplZCBvcGVyYXRpb25zIGZvciBpZGVudGl0eSB0cmFuc2Zvcm1hdGlvbnMuXG4gKiBUaGlzIGNsYXNzIGltcGxlbWVudHMgdGhlIGlkZW50aXR5IG1hdHJpeCBwYXR0ZXJuIHdoZXJlIGFsbCBkaWFnb25hbCBlbGVtZW50cyBhcmUgMSBhbmQgYWxsIG90aGVyIGVsZW1lbnRzIGFyZSAwLlxuICogSXQgZXh0ZW5kcyBBYnN0cmFjdE1hdHJpeCBhbmQgaW1wbGVtZW50cyBib3RoIElNYXRyaXggYW5kIElNYXRyaXg0NCBpbnRlcmZhY2VzLlxuICpcbiAqIFRoZSBpZGVudGl0eSBtYXRyaXggaXMgaW1tdXRhYmxlIGFuZCBwcm92aWRlcyBlZmZpY2llbnQgaW1wbGVtZW50YXRpb25zIHNpbmNlIHRoZSByZXN1bHQgb2YgbWFueSBvcGVyYXRpb25zXG4gKiBjYW4gYmUgY29tcHV0ZWQgd2l0aG91dCBhY3R1YWwgbWF0cml4IG11bHRpcGxpY2F0aW9uLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjb25zdCBpZGVudGl0eSA9IG5ldyBJZGVudGl0eU1hdHJpeDQ0KCk7XG4gKiBjb25zdCB2ZWN0b3IgPSBuZXcgVmVjdG9yNCgxLCAyLCAzLCAxKTtcbiAqIGNvbnN0IHJlc3VsdCA9IGlkZW50aXR5Lm11bHRpcGx5VmVjdG9yKHZlY3Rvcik7IC8vIFJldHVybnMgdGhlIHNhbWUgdmVjdG9yXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIElkZW50aXR5TWF0cml4NDQgZXh0ZW5kcyBBYnN0cmFjdE1hdHJpeCBpbXBsZW1lbnRzIElNYXRyaXgsIElNYXRyaXg0NCB7XG4gIC8qKlxuICAgKiBTdGF0aWMgYXJyYXkgcmVwcmVzZW50aW5nIHRoZSBpZGVudGl0eSBtYXRyaXggdmFsdWVzIGluIGNvbHVtbi1tYWpvciBvcmRlci5cbiAgICogVGhpcyBpcyBzaGFyZWQgYWNyb3NzIGFsbCBpbnN0YW5jZXMgZm9yIG1lbW9yeSBlZmZpY2llbmN5LlxuICAgKi9cbiAgc3RhdGljIHJlYWRvbmx5IF9fdiA9IG5ldyBGbG9hdDMyQXJyYXkoWzEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDFdKTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBJZGVudGl0eU1hdHJpeDQ0IGluc3RhbmNlLlxuICAgKiBUaGUgaW50ZXJuYWwgYXJyYXkgcmVmZXJlbmNlIHBvaW50cyB0byB0aGUgc3RhdGljIGlkZW50aXR5IG1hdHJpeCB2YWx1ZXMuXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX3YgPSBJZGVudGl0eU1hdHJpeDQ0Ll9fdjtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBpZGVudGl0eSBtYXRyaXggaW4gYSByZWFkYWJsZSBmb3JtYXQuXG4gICAqIEVhY2ggcm93IGlzIHNlcGFyYXRlZCBieSBuZXdsaW5lcyBmb3IgdmlzdWFsIGNsYXJpdHkuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZm9ybWF0dGVkIHN0cmluZyBzaG93aW5nIHRoZSA0eDQgaWRlbnRpdHkgbWF0cml4XG4gICAqL1xuICB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIHJldHVybiBgMSAwIDAgMFxuMCAxIDAgMFxuMCAwIDEgMFxuMCAwIDAgMVxuYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGFwcHJveGltYXRlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgbWF0cml4LlxuICAgKiBGb3IgaWRlbnRpdHkgbWF0cml4LCB0aGlzIGlzIGlkZW50aWNhbCB0byB0b1N0cmluZygpIHNpbmNlIGFsbCB2YWx1ZXMgYXJlIGV4YWN0LlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZvcm1hdHRlZCBzdHJpbmcgc2hvd2luZyB0aGUgNHg0IGlkZW50aXR5IG1hdHJpeFxuICAgKi9cbiAgdG9TdHJpbmdBcHByb3hpbWF0ZWx5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMudG9TdHJpbmcoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBtYXRyaXggZWxlbWVudHMgYXMgYSBmbGF0IGFycmF5IGluIGNvbHVtbi1tYWpvciBvcmRlci5cbiAgICpcbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgMTYgbnVtYmVycyByZXByZXNlbnRpbmcgdGhlIGlkZW50aXR5IG1hdHJpeFxuICAgKi9cbiAgZmxhdHRlbkFzQXJyYXkoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMV07XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIHdoZXRoZXIgdGhpcyBtYXRyaXggaXMgYSBkdW1teS9wbGFjZWhvbGRlciBtYXRyaXguXG4gICAqIElkZW50aXR5IG1hdHJpeCBpcyBub3QgY29uc2lkZXJlZCBhIGR1bW15IG1hdHJpeC5cbiAgICpcbiAgICogQHJldHVybnMgQWx3YXlzIGZhbHNlIGZvciBpZGVudGl0eSBtYXRyaXhcbiAgICovXG4gIGlzRHVtbXkoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgZ2l2ZW4gbWF0cml4IGlzIGFwcHJveGltYXRlbHkgZXF1YWwgdG8gdGhpcyBpZGVudGl0eSBtYXRyaXggd2l0aGluIGEgdG9sZXJhbmNlLlxuICAgKiBDb21wYXJlcyBlYWNoIGVsZW1lbnQgb2YgdGhlIGlucHV0IG1hdHJpeCBhZ2FpbnN0IHRoZSBjb3JyZXNwb25kaW5nIGlkZW50aXR5IG1hdHJpeCBlbGVtZW50LlxuICAgKlxuICAgKiBAcGFyYW0gbWF0IC0gVGhlIG1hdHJpeCB0byBjb21wYXJlIGFnYWluc3QgdGhpcyBpZGVudGl0eSBtYXRyaXhcbiAgICogQHBhcmFtIGRlbHRhIC0gVGhlIHRvbGVyYW5jZSBmb3IgZmxvYXRpbmctcG9pbnQgY29tcGFyaXNvbiAoZGVmYXVsdDogTnVtYmVyLkVQU0lMT04pXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIG1hdHJpeCBpcyBhcHByb3hpbWF0ZWx5IGFuIGlkZW50aXR5IG1hdHJpeCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBpc0VxdWFsKG1hdDogSU1hdHJpeDQ0LCBkZWx0YTogbnVtYmVyID0gTnVtYmVyLkVQU0lMT04pOiBib29sZWFuIHtcbiAgICBpZiAoXG4gICAgICBNYXRoLmFicyhtYXQubTAwIC0gMSkgPCBkZWx0YSAmJlxuICAgICAgTWF0aC5hYnMobWF0Lm0xMCkgPCBkZWx0YSAmJlxuICAgICAgTWF0aC5hYnMobWF0Lm0yMCkgPCBkZWx0YSAmJlxuICAgICAgTWF0aC5hYnMobWF0Lm0zMCkgPCBkZWx0YSAmJlxuICAgICAgTWF0aC5hYnMobWF0Lm0wMSkgPCBkZWx0YSAmJlxuICAgICAgTWF0aC5hYnMobWF0Lm0xMSAtIDEpIDwgZGVsdGEgJiZcbiAgICAgIE1hdGguYWJzKG1hdC5tMjEpIDwgZGVsdGEgJiZcbiAgICAgIE1hdGguYWJzKG1hdC5tMzEpIDwgZGVsdGEgJiZcbiAgICAgIE1hdGguYWJzKG1hdC5tMDIpIDwgZGVsdGEgJiZcbiAgICAgIE1hdGguYWJzKG1hdC5tMTIpIDwgZGVsdGEgJiZcbiAgICAgIE1hdGguYWJzKG1hdC5tMjIgLSAxKSA8IGRlbHRhICYmXG4gICAgICBNYXRoLmFicyhtYXQubTMyKSA8IGRlbHRhICYmXG4gICAgICBNYXRoLmFicyhtYXQubTAzKSA8IGRlbHRhICYmXG4gICAgICBNYXRoLmFicyhtYXQubTEzKSA8IGRlbHRhICYmXG4gICAgICBNYXRoLmFicyhtYXQubTIzKSA8IGRlbHRhICYmXG4gICAgICBNYXRoLmFicyhtYXQubTMzIC0gMSkgPCBkZWx0YVxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtcyBhIHN0cmljdCBlcXVhbGl0eSBjaGVjayBhZ2FpbnN0IGFub3RoZXIgbWF0cml4LlxuICAgKiBVc2VzIGV4YWN0IGZsb2F0aW5nLXBvaW50IGNvbXBhcmlzb24gd2l0aG91dCB0b2xlcmFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSBtYXQgLSBUaGUgbWF0cml4IHRvIGNvbXBhcmUgZm9yIHN0cmljdCBlcXVhbGl0eVxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBtYXRyaXggaXMgZXhhY3RseSBhbiBpZGVudGl0eSBtYXRyaXgsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgaXNTdHJpY3RFcXVhbChtYXQ6IElNYXRyaXgpOiBib29sZWFuIHtcbiAgICBjb25zdCB2ID0gKG1hdCBhcyBNYXRyaXg0NCkuX3Y7XG4gICAgaWYgKFxuICAgICAgdlswXSA9PT0gMSAmJlxuICAgICAgdlsxXSA9PT0gMCAmJlxuICAgICAgdlsyXSA9PT0gMCAmJlxuICAgICAgdlszXSA9PT0gMCAmJlxuICAgICAgdls0XSA9PT0gMCAmJlxuICAgICAgdls1XSA9PT0gMSAmJlxuICAgICAgdls2XSA9PT0gMCAmJlxuICAgICAgdls3XSA9PT0gMCAmJlxuICAgICAgdls4XSA9PT0gMCAmJlxuICAgICAgdls5XSA9PT0gMCAmJlxuICAgICAgdlsxMF0gPT09IDEgJiZcbiAgICAgIHZbMTFdID09PSAwICYmXG4gICAgICB2WzEyXSA9PT0gMCAmJlxuICAgICAgdlsxM10gPT09IDAgJiZcbiAgICAgIHZbMTRdID09PSAwICYmXG4gICAgICB2WzE1XSA9PT0gMVxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCB0aGUgc3BlY2lmaWVkIHJvdyBhbmQgY29sdW1uIGluZGljZXMuXG4gICAqIEZvciBpZGVudGl0eSBtYXRyaXgsIHJldHVybnMgMSBmb3IgZGlhZ29uYWwgZWxlbWVudHMgYW5kIDAgZm9yIG9mZi1kaWFnb25hbCBlbGVtZW50cy5cbiAgICpcbiAgICogQHBhcmFtIHJvd19pIC0gVGhlIHJvdyBpbmRleCAoMC1iYXNlZClcbiAgICogQHBhcmFtIGNvbHVtbl9pIC0gVGhlIGNvbHVtbiBpbmRleCAoMC1iYXNlZClcbiAgICogQHJldHVybnMgMSBpZiByb3cgZXF1YWxzIGNvbHVtbiAoZGlhZ29uYWwpLCAwIG90aGVyd2lzZVxuICAgKi9cbiAgYXQocm93X2k6IG51bWJlciwgY29sdW1uX2k6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIHJvd19pID09PSBjb2x1bW5faSA/IDEgOiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHRoZSBzcGVjaWZpZWQgbGluZWFyIGluZGV4IGluIGNvbHVtbi1tYWpvciBvcmRlci5cbiAgICogRm9yIGlkZW50aXR5IG1hdHJpeCwgcmV0dXJucyAxIGZvciBkaWFnb25hbCBwb3NpdGlvbnMgYW5kIDAgZWxzZXdoZXJlLlxuICAgKlxuICAgKiBAcGFyYW0gaSAtIFRoZSBsaW5lYXIgaW5kZXggKDAtMTUpIGluIGNvbHVtbi1tYWpvciBvcmRlclxuICAgKiBAcmV0dXJucyAxIGZvciBkaWFnb25hbCBlbGVtZW50cyAoaW5kaWNlcyAwLCA1LCAxMCwgMTUpLCAwIG90aGVyd2lzZVxuICAgKi9cbiAgdihpOiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiBpICUgNSA9PT0gMCA/IDEgOiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIGRldGVybWluYW50IG9mIHRoaXMgaWRlbnRpdHkgbWF0cml4LlxuICAgKiBUaGUgZGV0ZXJtaW5hbnQgb2YgYW4gaWRlbnRpdHkgbWF0cml4IGlzIGFsd2F5cyAxLlxuICAgKlxuICAgKiBAcmV0dXJucyBBbHdheXMgcmV0dXJucyAxXG4gICAqL1xuICBkZXRlcm1pbmFudCgpOiBudW1iZXIge1xuICAgIHJldHVybiAxO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgdGhpcyBpZGVudGl0eSBtYXRyaXggd2l0aCBhIDREIHZlY3Rvci5cbiAgICogU2luY2UgdGhpcyBpcyBhbiBpZGVudGl0eSBtYXRyaXgsIHRoZSByZXN1bHQgaXMgdGhlIGlucHV0IHZlY3RvciB1bmNoYW5nZWQuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgNEQgdmVjdG9yIHRvIG11bHRpcGx5XG4gICAqIEByZXR1cm5zIFRoZSBzYW1lIHZlY3RvciAoaWRlbnRpdHkgdHJhbnNmb3JtYXRpb24pXG4gICAqL1xuICBtdWx0aXBseVZlY3Rvcih2ZWM6IElWZWN0b3I0KSB7XG4gICAgcmV0dXJuIHZlYztcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIHRoaXMgaWRlbnRpdHkgbWF0cml4IHdpdGggYSAzRCB2ZWN0b3IuXG4gICAqIFNpbmNlIHRoaXMgaXMgYW4gaWRlbnRpdHkgbWF0cml4LCB0aGUgcmVzdWx0IGlzIHRoZSBpbnB1dCB2ZWN0b3IgdW5jaGFuZ2VkLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIDNEIHZlY3RvciB0byBtdWx0aXBseVxuICAgKiBAcmV0dXJucyBUaGUgc2FtZSB2ZWN0b3IgKGlkZW50aXR5IHRyYW5zZm9ybWF0aW9uKVxuICAgKi9cbiAgbXVsdGlwbHlWZWN0b3IzKHZlYzogSVZlY3RvcjMpIHtcbiAgICByZXR1cm4gdmVjO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgdGhpcyBpZGVudGl0eSBtYXRyaXggd2l0aCBhIHZlY3RvciBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gYW4gb3V0cHV0IHZlY3Rvci5cbiAgICogU2luY2UgdGhpcyBpcyBhbiBpZGVudGl0eSBtYXRyaXgsIGNvcGllcyB0aGUgaW5wdXQgdmVjdG9yIHRvIHRoZSBvdXRwdXQgdmVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIGlucHV0IHZlY3RvciB0byBtdWx0aXBseVxuICAgKiBAcGFyYW0gb3V0VmVjIC0gVGhlIG11dGFibGUgdmVjdG9yIHRvIHN0b3JlIHRoZSByZXN1bHRcbiAgICogQHJldHVybnMgVGhlIG91dHB1dCB2ZWN0b3IgY29udGFpbmluZyB0aGUgY29waWVkIHZhbHVlc1xuICAgKi9cbiAgbXVsdGlwbHlWZWN0b3JUbyh2ZWM6IElWZWN0b3IsIG91dFZlYzogTXV0YWJsZVZlY3RvcjQpOiBNdXRhYmxlVmVjdG9yNCB7XG4gICAgY29uc3QgdiA9ICh2ZWMgYXMgVmVjdG9yNCkuX3Y7XG4gICAgb3V0VmVjLl92WzBdID0gdlswXTtcbiAgICBvdXRWZWMuX3ZbMV0gPSB2WzFdO1xuICAgIG91dFZlYy5fdlsyXSA9IHZbMl07XG4gICAgb3V0VmVjLl92WzNdID0gdlszXTtcblxuICAgIHJldHVybiBvdXRWZWM7XG4gIH1cblxuICAvKipcbiAgICogRXh0cmFjdHMgdGhlIHNjYWxlIGNvbXBvbmVudHMgZnJvbSB0aGlzIHRyYW5zZm9ybWF0aW9uIG1hdHJpeC5cbiAgICogRm9yIGlkZW50aXR5IG1hdHJpeCwgdGhlIHNjYWxlIGlzICgxLCAxLCAxKS5cbiAgICpcbiAgICogQHJldHVybnMgQSBWZWN0b3IzIHdpdGggYWxsIGNvbXBvbmVudHMgc2V0IHRvIDFcbiAgICovXG4gIGdldFNjYWxlKCk6IFZlY3RvcjMge1xuICAgIHJldHVybiBWZWN0b3IzLm9uZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4dHJhY3RzIHRoZSBzY2FsZSBjb21wb25lbnRzIGFuZCBzdG9yZXMgdGhlbSBpbiBhbiBvdXRwdXQgdmVjdG9yLlxuICAgKiBGb3IgaWRlbnRpdHkgbWF0cml4LCBzZXRzIGFsbCBzY2FsZSBjb21wb25lbnRzIHRvIDEuXG4gICAqXG4gICAqIEBwYXJhbSBvdXRWZWMgLSBUaGUgbXV0YWJsZSB2ZWN0b3IgdG8gc3RvcmUgdGhlIHNjYWxlIHZhbHVlc1xuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHZlY3RvciB3aXRoIHNjYWxlIGNvbXBvbmVudHMgc2V0IHRvIDFcbiAgICovXG4gIGdldFNjYWxlVG8ob3V0VmVjOiBNdXRhYmxlVmVjdG9yMyk6IE11dGFibGVWZWN0b3IzIHtcbiAgICBjb25zdCB2ID0gb3V0VmVjLl92O1xuXG4gICAgdlswXSA9IDE7XG4gICAgdlsxXSA9IDE7XG4gICAgdlsyXSA9IDE7XG5cbiAgICByZXR1cm4gb3V0VmVjO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBjb3B5IG9mIHRoaXMgaWRlbnRpdHkgbWF0cml4LlxuICAgKiBSZXR1cm5zIGEgbmV3IElkZW50aXR5TWF0cml4NDQgaW5zdGFuY2UuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgbmV3IElkZW50aXR5TWF0cml4NDQgaW5zdGFuY2VcbiAgICovXG4gIGNsb25lKCk6IElkZW50aXR5TWF0cml4NDQge1xuICAgIHJldHVybiBuZXcgSWRlbnRpdHlNYXRyaXg0NCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4dHJhY3RzIHRoZSByb3RhdGlvbiBwYXJ0IG9mIHRoaXMgdHJhbnNmb3JtYXRpb24gbWF0cml4LlxuICAgKiBGb3IgaWRlbnRpdHkgbWF0cml4LCB0aGUgcm90YXRpb24gaXMgYWxzbyBhbiBpZGVudGl0eSBtYXRyaXguXG4gICAqXG4gICAqIEByZXR1cm5zIEEgbmV3IElkZW50aXR5TWF0cml4NDQgcmVwcmVzZW50aW5nIG5vIHJvdGF0aW9uXG4gICAqL1xuICBnZXRSb3RhdGUoKTogSWRlbnRpdHlNYXRyaXg0NCB7XG4gICAgcmV0dXJuIG5ldyBJZGVudGl0eU1hdHJpeDQ0KCk7XG4gIH1cblxuICAvKipcbiAgICogRXh0cmFjdHMgdGhlIHRyYW5zbGF0aW9uIGNvbXBvbmVudHMgZnJvbSB0aGlzIHRyYW5zZm9ybWF0aW9uIG1hdHJpeC5cbiAgICogRm9yIGlkZW50aXR5IG1hdHJpeCwgdGhlIHRyYW5zbGF0aW9uIGlzICgwLCAwLCAwKS5cbiAgICpcbiAgICogQHJldHVybnMgQSBWZWN0b3IzIHdpdGggYWxsIGNvbXBvbmVudHMgc2V0IHRvIDBcbiAgICovXG4gIGdldFRyYW5zbGF0ZSgpOiBWZWN0b3IzIHtcbiAgICByZXR1cm4gVmVjdG9yMy56ZXJvKCk7XG4gIH1cblxuICAvKipcbiAgICogRXh0cmFjdHMgdGhlIHRyYW5zbGF0aW9uIGNvbXBvbmVudHMgZnJvbSB0aGlzIHRyYW5zZm9ybWF0aW9uIG1hdHJpeFxuICAgKiBhbmQgc3RvcmVzIHRoZW0gaW4gdGhlIG91dHB1dCB2ZWN0b3IuXG4gICAqIEZvciBpZGVudGl0eSBtYXRyaXgsIHRoZSB0cmFuc2xhdGlvbiBpcyAoMCwgMCwgMCkuXG4gICAqXG4gICAqIEBwYXJhbSBvdXRWZWMgLSBUaGUgb3V0cHV0IHZlY3RvciB0byBzdG9yZSB0aGUgdHJhbnNsYXRpb25cbiAgICogQHJldHVybnMgVGhlIG91dHB1dCB2ZWN0b3Igd2l0aCBhbGwgY29tcG9uZW50cyBzZXQgdG8gMFxuICAgKi9cbiAgZ2V0VHJhbnNsYXRlVG8ob3V0VmVjOiBNdXRhYmxlVmVjdG9yMyk6IE11dGFibGVWZWN0b3IzIHtcbiAgICByZXR1cm4gb3V0VmVjLnNldENvbXBvbmVudHMoMCwgMCwgMCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF0cml4IGVsZW1lbnQgYXQgcm93IDAsIGNvbHVtbiAwLlxuICAgKiBAcmV0dXJucyBBbHdheXMgMSBmb3IgaWRlbnRpdHkgbWF0cml4XG4gICAqL1xuICBwdWJsaWMgZ2V0IG0wMCgpOiBudW1iZXIge1xuICAgIHJldHVybiAxO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHJvdyAxLCBjb2x1bW4gMC5cbiAgICogQHJldHVybnMgQWx3YXlzIDAgZm9yIGlkZW50aXR5IG1hdHJpeFxuICAgKi9cbiAgcHVibGljIGdldCBtMTAoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCByb3cgMiwgY29sdW1uIDAuXG4gICAqIEByZXR1cm5zIEFsd2F5cyAwIGZvciBpZGVudGl0eSBtYXRyaXhcbiAgICovXG4gIHB1YmxpYyBnZXQgbTIwKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF0cml4IGVsZW1lbnQgYXQgcm93IDMsIGNvbHVtbiAwLlxuICAgKiBAcmV0dXJucyBBbHdheXMgMCBmb3IgaWRlbnRpdHkgbWF0cml4XG4gICAqL1xuICBwdWJsaWMgZ2V0IG0zMCgpOiBudW1iZXIge1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHJvdyAwLCBjb2x1bW4gMS5cbiAgICogQHJldHVybnMgQWx3YXlzIDAgZm9yIGlkZW50aXR5IG1hdHJpeFxuICAgKi9cbiAgcHVibGljIGdldCBtMDEoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCByb3cgMSwgY29sdW1uIDEuXG4gICAqIEByZXR1cm5zIEFsd2F5cyAxIGZvciBpZGVudGl0eSBtYXRyaXhcbiAgICovXG4gIHB1YmxpYyBnZXQgbTExKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIDE7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF0cml4IGVsZW1lbnQgYXQgcm93IDIsIGNvbHVtbiAxLlxuICAgKiBAcmV0dXJucyBBbHdheXMgMCBmb3IgaWRlbnRpdHkgbWF0cml4XG4gICAqL1xuICBwdWJsaWMgZ2V0IG0yMSgpOiBudW1iZXIge1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHJvdyAzLCBjb2x1bW4gMS5cbiAgICogQHJldHVybnMgQWx3YXlzIDAgZm9yIGlkZW50aXR5IG1hdHJpeFxuICAgKi9cbiAgcHVibGljIGdldCBtMzEoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCByb3cgMCwgY29sdW1uIDIuXG4gICAqIEByZXR1cm5zIEFsd2F5cyAwIGZvciBpZGVudGl0eSBtYXRyaXhcbiAgICovXG4gIHB1YmxpYyBnZXQgbTAyKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF0cml4IGVsZW1lbnQgYXQgcm93IDEsIGNvbHVtbiAyLlxuICAgKiBAcmV0dXJucyBBbHdheXMgMCBmb3IgaWRlbnRpdHkgbWF0cml4XG4gICAqL1xuICBwdWJsaWMgZ2V0IG0xMigpOiBudW1iZXIge1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHJvdyAyLCBjb2x1bW4gMi5cbiAgICogQHJldHVybnMgQWx3YXlzIDEgZm9yIGlkZW50aXR5IG1hdHJpeFxuICAgKi9cbiAgcHVibGljIGdldCBtMjIoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCByb3cgMywgY29sdW1uIDIuXG4gICAqIEByZXR1cm5zIEFsd2F5cyAwIGZvciBpZGVudGl0eSBtYXRyaXhcbiAgICovXG4gIHB1YmxpYyBnZXQgbTMyKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF0cml4IGVsZW1lbnQgYXQgcm93IDAsIGNvbHVtbiAzLlxuICAgKiBAcmV0dXJucyBBbHdheXMgMCBmb3IgaWRlbnRpdHkgbWF0cml4XG4gICAqL1xuICBwdWJsaWMgZ2V0IG0wMygpOiBudW1iZXIge1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdHJpeCBlbGVtZW50IGF0IHJvdyAxLCBjb2x1bW4gMy5cbiAgICogQHJldHVybnMgQWx3YXlzIDAgZm9yIGlkZW50aXR5IG1hdHJpeFxuICAgKi9cbiAgcHVibGljIGdldCBtMTMoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCByb3cgMiwgY29sdW1uIDMuXG4gICAqIEByZXR1cm5zIEFsd2F5cyAwIGZvciBpZGVudGl0eSBtYXRyaXhcbiAgICovXG4gIHB1YmxpYyBnZXQgbTIzKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF0cml4IGVsZW1lbnQgYXQgcm93IDMsIGNvbHVtbiAzLlxuICAgKiBAcmV0dXJucyBBbHdheXMgMSBmb3IgaWRlbnRpdHkgbWF0cml4XG4gICAqL1xuICBwdWJsaWMgZ2V0IG0zMygpOiBudW1iZXIge1xuICAgIHJldHVybiAxO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIFggdHJhbnNsYXRpb24gY29tcG9uZW50IGZyb20gdGhlIG1hdHJpeC5cbiAgICogQHJldHVybnMgQWx3YXlzIDAgZm9yIGlkZW50aXR5IG1hdHJpeFxuICAgKi9cbiAgcHVibGljIGdldCB0cmFuc2xhdGVYKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgWSB0cmFuc2xhdGlvbiBjb21wb25lbnQgZnJvbSB0aGUgbWF0cml4LlxuICAgKiBAcmV0dXJucyBBbHdheXMgMCBmb3IgaWRlbnRpdHkgbWF0cml4XG4gICAqL1xuICBwdWJsaWMgZ2V0IHRyYW5zbGF0ZVkoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBaIHRyYW5zbGF0aW9uIGNvbXBvbmVudCBmcm9tIHRoZSBtYXRyaXguXG4gICAqIEByZXR1cm5zIEFsd2F5cyAwIGZvciBpZGVudGl0eSBtYXRyaXhcbiAgICovXG4gIHB1YmxpYyBnZXQgdHJhbnNsYXRlWigpOiBudW1iZXIge1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNsYXNzIG5hbWUgZm9yIGRlYnVnZ2luZyBhbmQgcmVmbGVjdGlvbiBwdXJwb3Nlcy5cbiAgICogQHJldHVybnMgVGhlIHN0cmluZyAnSWRlbnRpdHlNYXRyaXg0NCdcbiAgICovXG4gIGdldCBjbGFzc05hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJ0lkZW50aXR5TWF0cml4NDQnO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNvbXBvc2l0aW9uIHR5cGUgZm9yIHRoaXMgbWF0cml4IGNsYXNzLlxuICAgKiBAcmV0dXJucyBDb21wb3NpdGlvblR5cGUuTWF0NCBpbmRpY2F0aW5nIHRoaXMgaXMgYSA0eDQgbWF0cml4XG4gICAqL1xuICBzdGF0aWMgZ2V0IGNvbXBvc2l0aW9uVHlwZSgpOiBDb21wb3NpdGlvblR5cGVFbnVtIHtcbiAgICByZXR1cm4gQ29tcG9zaXRpb25UeXBlLk1hdDQ7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIHdoZXRoZXIgdGhpcyBtYXRyaXggaXMgYW4gaWRlbnRpdHkgbWF0cml4IGNsYXNzLlxuICAgKiBAcmV0dXJucyBBbHdheXMgdHJ1ZSBmb3IgSWRlbnRpdHlNYXRyaXg0NFxuICAgKi9cbiAgZ2V0IGlzSWRlbnRpdHlNYXRyaXhDbGFzcygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsdUJBQWlEO0FBQzFELFNBQVMsc0JBQXNCO0FBTS9CLFNBQVMsZUFBZTtBQWtCakIsSUFBTSxvQkFBTixNQUFNLDBCQUF5QixlQUE2QztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFXakYsY0FBYztBQUNaLFVBQU07QUFDTixTQUFLLEtBQUssa0JBQWlCQTtBQUFBLEVBQzdCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxXQUFtQjtBQUNqQixXQUFPO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSx3QkFBZ0M7QUFDOUIsV0FBTyxLQUFLLFNBQVM7QUFBQSxFQUN2QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLGlCQUEyQjtBQUN6QixXQUFPLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQztBQUFBLEVBQ3hEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxVQUFtQjtBQUNqQixXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVBLFFBQVEsS0FBZ0IsUUFBZ0IsT0FBTyxTQUFrQjtBQUMvRCxRQUNFLEtBQUssSUFBSSxJQUFJLE1BQU0sQ0FBQyxJQUFJLFNBQ3hCLEtBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxTQUNwQixLQUFLLElBQUksSUFBSSxHQUFHLElBQUksU0FDcEIsS0FBSyxJQUFJLElBQUksR0FBRyxJQUFJLFNBQ3BCLEtBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxTQUNwQixLQUFLLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxTQUN4QixLQUFLLElBQUksSUFBSSxHQUFHLElBQUksU0FDcEIsS0FBSyxJQUFJLElBQUksR0FBRyxJQUFJLFNBQ3BCLEtBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxTQUNwQixLQUFLLElBQUksSUFBSSxHQUFHLElBQUksU0FDcEIsS0FBSyxJQUFJLElBQUksTUFBTSxDQUFDLElBQUksU0FDeEIsS0FBSyxJQUFJLElBQUksR0FBRyxJQUFJLFNBQ3BCLEtBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxTQUNwQixLQUFLLElBQUksSUFBSSxHQUFHLElBQUksU0FDcEIsS0FBSyxJQUFJLElBQUksR0FBRyxJQUFJLFNBQ3BCLEtBQUssSUFBSSxJQUFJLE1BQU0sQ0FBQyxJQUFJLE9BQ3hCO0FBQ0EsYUFBTztBQUFBLElBQ1Q7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFTQSxjQUFjLEtBQXVCO0FBQ25DLFVBQU0sSUFBSyxJQUFpQjtBQUM1QixRQUNFLEVBQUUsQ0FBQyxNQUFNLEtBQ1QsRUFBRSxDQUFDLE1BQU0sS0FDVCxFQUFFLENBQUMsTUFBTSxLQUNULEVBQUUsQ0FBQyxNQUFNLEtBQ1QsRUFBRSxDQUFDLE1BQU0sS0FDVCxFQUFFLENBQUMsTUFBTSxLQUNULEVBQUUsQ0FBQyxNQUFNLEtBQ1QsRUFBRSxDQUFDLE1BQU0sS0FDVCxFQUFFLENBQUMsTUFBTSxLQUNULEVBQUUsQ0FBQyxNQUFNLEtBQ1QsRUFBRSxFQUFFLE1BQU0sS0FDVixFQUFFLEVBQUUsTUFBTSxLQUNWLEVBQUUsRUFBRSxNQUFNLEtBQ1YsRUFBRSxFQUFFLE1BQU0sS0FDVixFQUFFLEVBQUUsTUFBTSxLQUNWLEVBQUUsRUFBRSxNQUFNLEdBQ1Y7QUFDQSxhQUFPO0FBQUEsSUFDVDtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVUEsR0FBRyxPQUFlLFVBQTBCO0FBQzFDLFdBQU8sVUFBVSxXQUFXLElBQUk7QUFBQSxFQUNsQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFTQSxFQUFFLEdBQW1CO0FBQ25CLFdBQU8sSUFBSSxNQUFNLElBQUksSUFBSTtBQUFBLEVBQzNCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxjQUFzQjtBQUNwQixXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFTQSxlQUFlLEtBQWU7QUFDNUIsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBU0EsZ0JBQWdCLEtBQWU7QUFDN0IsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFVQSxpQkFBaUIsS0FBYyxRQUF3QztBQUNyRSxVQUFNLElBQUssSUFBZ0I7QUFDM0IsV0FBTyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDbEIsV0FBTyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDbEIsV0FBTyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDbEIsV0FBTyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7QUFFbEIsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLFdBQW9CO0FBQ2xCLFdBQU8sUUFBUSxJQUFJO0FBQUEsRUFDckI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBU0EsV0FBVyxRQUF3QztBQUNqRCxVQUFNLElBQUksT0FBTztBQUVqQixNQUFFLENBQUMsSUFBSTtBQUNQLE1BQUUsQ0FBQyxJQUFJO0FBQ1AsTUFBRSxDQUFDLElBQUk7QUFFUCxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsUUFBMEI7QUFDeEIsV0FBTyxJQUFJLGtCQUFpQjtBQUFBLEVBQzlCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxZQUE4QjtBQUM1QixXQUFPLElBQUksa0JBQWlCO0FBQUEsRUFDOUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLGVBQXdCO0FBQ3RCLFdBQU8sUUFBUSxLQUFLO0FBQUEsRUFDdEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFVQSxlQUFlLFFBQXdDO0FBQ3JELFdBQU8sT0FBTyxjQUFjLEdBQUcsR0FBRyxDQUFDO0FBQUEsRUFDckM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBVyxNQUFjO0FBQ3ZCLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQVcsTUFBYztBQUN2QixXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFXLE1BQWM7QUFDdkIsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBVyxNQUFjO0FBQ3ZCLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQVcsTUFBYztBQUN2QixXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFXLE1BQWM7QUFDdkIsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBVyxNQUFjO0FBQ3ZCLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQVcsTUFBYztBQUN2QixXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFXLE1BQWM7QUFDdkIsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBVyxNQUFjO0FBQ3ZCLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQVcsTUFBYztBQUN2QixXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFXLE1BQWM7QUFDdkIsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBVyxNQUFjO0FBQ3ZCLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQVcsTUFBYztBQUN2QixXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFXLE1BQWM7QUFDdkIsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBVyxNQUFjO0FBQ3ZCLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQVcsYUFBcUI7QUFDOUIsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBVyxhQUFxQjtBQUM5QixXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFXLGFBQXFCO0FBQzlCLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUksWUFBb0I7QUFDdEIsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsV0FBVyxrQkFBdUM7QUFDaEQsV0FBTyxnQkFBZ0I7QUFBQSxFQUN6QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLHdCQUFpQztBQUNuQyxXQUFPO0FBQUEsRUFDVDtBQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUF4YmEsa0JBS0tBLEtBQU0sSUFBSSxhQUFhLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDO0FBTGxGLElBQU0sbUJBQU47IiwKICAibmFtZXMiOiBbIl9fdiJdCn0K
