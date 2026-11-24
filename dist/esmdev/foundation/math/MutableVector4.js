// src/foundation/math/MutableVector4.ts
import { Logger } from "../misc/Logger.js";
import { Vector4_ } from "./Vector4.js";
var MutableVector4_ = class extends Vector4_ {
  /**
   * Creates a new MutableVector4_ instance.
   *
   * @param x - The typed array containing vector components
   * @param type - Object containing the typed array constructor
   */
  constructor(x, { type }) {
    super(x, { type });
    this.ia = 0;
  }
  /**
   * Sets the x component of the vector.
   * Automatically increments the update counter for change tracking.
   */
  set x(x) {
    this._v[0] = x;
    this.ia++;
  }
  /**
   * Gets the x component of the vector.
   * @returns The x component value
   */
  get x() {
    return this._v[0];
  }
  /**
   * Sets the y component of the vector.
   * Automatically increments the update counter for change tracking.
   */
  set y(y) {
    this._v[1] = y;
    this.ia++;
  }
  /**
   * Gets the y component of the vector.
   * @returns The y component value
   */
  get y() {
    return this._v[1];
  }
  /**
   * Sets the z component of the vector.
   * Automatically increments the update counter for change tracking.
   */
  set z(z) {
    this._v[2] = z;
    this.ia++;
  }
  /**
   * Gets the z component of the vector.
   * @returns The z component value
   */
  get z() {
    return this._v[2];
  }
  /**
   * Sets the w component of the vector.
   * Automatically increments the update counter for change tracking.
   */
  set w(w) {
    this._v[3] = w;
    this.ia++;
  }
  /**
   * Gets the w component of the vector.
   * @returns The w component value
   */
  get w() {
    return this._v[3];
  }
  /**
   * Gets the raw typed array containing the vector components.
   *
   * @returns The underlying typed array [x, y, z, w]
   */
  raw() {
    return this._v;
  }
  /**
   * Sets the value at the specified index.
   *
   * @param i - The index (0-3) to set
   * @param value - The value to set at the index
   * @returns This vector instance for method chaining
   */
  setAt(i, value) {
    this._v[i] = value;
    this.ia++;
    return this;
  }
  /**
   * Sets all four components of the vector.
   *
   * @param x - The x component value
   * @param y - The y component value
   * @param z - The z component value
   * @param w - The w component value
   * @returns This vector instance for method chaining
   */
  setComponents(x, y, z, w) {
    this._v[0] = x;
    this._v[1] = y;
    this._v[2] = z;
    this._v[3] = w;
    this.ia++;
    return this;
  }
  /**
   * Copies components from another vector to this vector.
   *
   * @param vec - The source vector to copy from
   * @returns This vector instance for method chaining
   */
  copyComponents(vec) {
    return this.setComponents(vec._v[0], vec._v[1], vec._v[2], vec._v[3]);
  }
  /**
   * Sets all components to zero.
   *
   * @returns This vector instance for method chaining
   */
  zero() {
    return this.setComponents(0, 0, 0, 0);
  }
  /**
   * Sets all components to one.
   *
   * @returns This vector instance for method chaining
   */
  one() {
    return this.setComponents(1, 1, 1, 1);
  }
  /**
   * Gets the number of bytes per component in the underlying typed array.
   *
   * @returns The byte size per component (4 for Float32Array, 8 for Float64Array)
   */
  get bytesPerComponent() {
    return this._v.BYTES_PER_ELEMENT;
  }
  /**
   * Normalizes the vector to unit length.
   * Modifies this vector in place.
   *
   * @returns This vector instance for method chaining
   */
  normalize() {
    const length = this.length();
    this.divide(length);
    return this;
  }
  /**
   * Normalizes only the x, y, z components (treating as 3D vector).
   * The w component is divided by the same length factor.
   *
   * @returns This vector instance for method chaining
   */
  normalize3() {
    const length = Math.hypot(this._v[0], this._v[1], this._v[2]);
    this.divide(length);
    return this;
  }
  /**
   * Adds another vector to this vector component-wise.
   *
   * @param vec - The vector to add
   * @returns This vector instance for method chaining
   */
  add(vec) {
    this._v[0] += vec._v[0];
    this._v[1] += vec._v[1];
    this._v[2] += vec._v[2];
    this._v[3] += vec._v[3];
    return this;
  }
  /**
   * Subtracts another vector from this vector component-wise.
   *
   * @param vec - The vector to subtract
   * @returns This vector instance for method chaining
   */
  subtract(vec) {
    this._v[0] -= vec._v[0];
    this._v[1] -= vec._v[1];
    this._v[2] -= vec._v[2];
    this._v[3] -= vec._v[3];
    return this;
  }
  /**
   * Multiplies this vector by a scalar value.
   *
   * @param value - The scalar value to multiply by
   * @returns This vector instance for method chaining
   */
  multiply(value) {
    this._v[0] *= value;
    this._v[1] *= value;
    this._v[2] *= value;
    this._v[3] *= value;
    return this;
  }
  /**
   * Multiplies this vector by another vector component-wise.
   *
   * @param vec - The vector to multiply by
   * @returns This vector instance for method chaining
   */
  multiplyVector(vec) {
    this._v[0] *= vec._v[0];
    this._v[1] *= vec._v[1];
    this._v[2] *= vec._v[2];
    this._v[3] *= vec._v[3];
    return this;
  }
  /**
   * Divides this vector by a scalar value.
   * If the value is zero, sets components to 0 and logs an error.
   *
   * @param value - The scalar value to divide by
   * @returns This vector instance for method chaining
   */
  divide(value) {
    if (value !== 0) {
      this._v[0] /= value;
      this._v[1] /= value;
      this._v[2] /= value;
      this._v[3] /= value;
    } else {
      Logger.default.error("0 division occurred! The result is set to zero.");
      this._v[0] = 0;
      this._v[1] = 0;
      this._v[2] = 0;
      this._v[3] = 0;
    }
    return this;
  }
  /**
   * Divides this vector by another vector component-wise.
   * If any component of the divisor is zero, sets the corresponding result to 0.
   *
   * @param vec - The vector to divide by
   * @returns This vector instance for method chaining
   */
  divideVector(vec) {
    if (vec._v[0] !== 0 && vec._v[1] !== 0 && vec._v[2] !== 0 && vec._v[3] !== 0) {
      this._v[0] /= vec._v[0];
      this._v[1] /= vec._v[1];
      this._v[2] /= vec._v[2];
      this._v[3] /= vec._v[3];
    } else {
      Logger.default.error("0 division occurred! The result is set to zero.");
      this._v[0] = vec._v[0] === 0 ? 0 : this._v[0] / vec._v[0];
      this._v[1] = vec._v[1] === 0 ? 0 : this._v[1] / vec._v[1];
      this._v[2] = vec._v[2] === 0 ? 0 : this._v[2] / vec._v[2];
      this._v[3] = vec._v[3] === 0 ? 0 : this._v[3] / vec._v[3];
    }
    return this;
  }
  /**
   * Gets the update counter value.
   * This counter is incremented whenever the vector is modified.
   *
   * @returns The current update count
   */
  get _updateCount() {
    return this.ia;
  }
};
var MutableVector4 = class _MutableVector4 extends MutableVector4_ {
  /**
   * Creates a new MutableVector4 instance.
   *
   * @param x - Float32Array containing the vector components [x, y, z, w]
   */
  constructor(x) {
    super(x, { type: Float32Array });
  }
  /**
   * Creates a new MutableVector4 from an array of numbers.
   * Takes up to 4 elements from the array.
   *
   * @param array - Array of numbers to copy from
   * @returns A new MutableVector4 instance
   */
  static fromCopyArray(array) {
    return new _MutableVector4(new Float32Array(array).slice(0, 4));
  }
  /**
   * Creates a new MutableVector4 from a 4-element array.
   *
   * @param array - Array of exactly 4 numbers [x, y, z, w]
   * @returns A new MutableVector4 instance
   */
  static fromCopyArray4(array) {
    return new _MutableVector4(new Float32Array(array));
  }
  /**
   * Creates a new MutableVector4 from individual component values.
   *
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   * @param w - The w component
   * @returns A new MutableVector4 instance
   */
  static fromCopy4(x, y, z, w) {
    return new _MutableVector4(new Float32Array([x, y, z, w]));
  }
  /**
   * Creates a zero vector (0, 0, 0, 0).
   *
   * @returns A new MutableVector4 with all components set to 0
   */
  static zero() {
    return super._zero(Float32Array);
  }
  /**
   * Creates a vector with all components set to 1 (1, 1, 1, 1).
   *
   * @returns A new MutableVector4 with all components set to 1
   */
  static one() {
    return super._one(Float32Array);
  }
  /**
   * Creates a dummy vector for placeholder purposes.
   *
   * @returns A new MutableVector4 dummy instance
   */
  static dummy() {
    return super._dummy(Float32Array);
  }
  /**
   * Creates a normalized copy of the given vector.
   *
   * @param vec - The vector to normalize
   * @returns A new normalized MutableVector4
   */
  static normalize(vec) {
    return super._normalize(vec, Float32Array);
  }
  /**
   * Creates a new vector by adding two vectors component-wise.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new MutableVector4 containing the sum
   */
  static add(l_vec, r_vec) {
    return super._add(l_vec, r_vec, Float32Array);
  }
  /**
   * Creates a new vector by subtracting the second vector from the first.
   *
   * @param l_vec - The vector to subtract from
   * @param r_vec - The vector to subtract
   * @returns A new MutableVector4 containing the difference
   */
  static subtract(l_vec, r_vec) {
    return super._subtract(l_vec, r_vec, Float32Array);
  }
  /**
   * Creates a new vector by multiplying a vector by a scalar.
   *
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @returns A new MutableVector4 containing the scaled vector
   */
  static multiply(vec, value) {
    return super._multiply(vec, value, Float32Array);
  }
  /**
   * Creates a new vector by multiplying two vectors component-wise.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new MutableVector4 containing the component-wise product
   */
  static multiplyVector(l_vec, r_vec) {
    return super._multiplyVector(l_vec, r_vec, Float32Array);
  }
  /**
   * Creates a new vector by dividing a vector by a scalar.
   *
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @returns A new MutableVector4 containing the divided vector
   */
  static divide(vec, value) {
    return super._divide(vec, value, Float32Array);
  }
  /**
   * Creates a new vector by dividing two vectors component-wise.
   *
   * @param l_vec - The dividend vector
   * @param r_vec - The divisor vector
   * @returns A new MutableVector4 containing the component-wise quotient
   */
  static divideVector(l_vec, r_vec) {
    return super._divideVector(l_vec, r_vec, Float32Array);
  }
  /**
   * Gets the class name for debugging and identification purposes.
   *
   * @returns The string 'MutableVector4'
   */
  get className() {
    return "MutableVector4";
  }
  /**
   * Creates a deep copy of this vector.
   *
   * @returns A new MutableVector4 instance with copied values
   */
  clone() {
    return new this.constructor(
      new this._v.constructor([this._v[0], this._v[1], this._v[2], this._v[3]])
    );
  }
};
var MutableVector4D = class _MutableVector4D extends MutableVector4_ {
  /**
   * Creates a new MutableVector4D instance.
   *
   * @param x - Float64Array containing the vector components [x, y, z, w]
   */
  constructor(x) {
    super(x, { type: Float64Array });
  }
  /**
   * Creates a zero vector (0, 0, 0, 0) with 64-bit precision.
   *
   * @returns A new MutableVector4D with all components set to 0
   */
  static zero() {
    return super._zero(Float64Array);
  }
  /**
   * Creates a vector with all components set to 1 (1, 1, 1, 1) with 64-bit precision.
   *
   * @returns A new MutableVector4D with all components set to 1
   */
  static one() {
    return super._one(Float64Array);
  }
  /**
   * Creates a dummy vector for placeholder purposes with 64-bit precision.
   *
   * @returns A new MutableVector4D dummy instance
   */
  static dummy() {
    return super._dummy(Float64Array);
  }
  /**
   * Creates a normalized copy of the given vector with 64-bit precision.
   *
   * @param vec - The vector to normalize
   * @returns A new normalized MutableVector4D
   */
  static normalize(vec) {
    return super._normalize(vec, Float64Array);
  }
  /**
   * Creates a new vector by adding two vectors component-wise with 64-bit precision.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new MutableVector4D containing the sum
   */
  static add(l_vec, r_vec) {
    return super._add(l_vec, r_vec, Float64Array);
  }
  /**
   * Creates a new vector by subtracting the second vector from the first with 64-bit precision.
   *
   * @param l_vec - The vector to subtract from
   * @param r_vec - The vector to subtract
   * @returns A new MutableVector4D containing the difference
   */
  static subtract(l_vec, r_vec) {
    return super._subtract(l_vec, r_vec, Float64Array);
  }
  /**
   * Creates a new vector by multiplying a vector by a scalar with 64-bit precision.
   *
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @returns A new MutableVector4D containing the scaled vector
   */
  static multiply(vec, value) {
    return super._multiply(vec, value, Float64Array);
  }
  /**
   * Creates a new vector by multiplying two vectors component-wise with 64-bit precision.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new MutableVector4D containing the component-wise product
   */
  static multiplyVector(l_vec, r_vec) {
    return super._multiplyVector(l_vec, r_vec, Float64Array);
  }
  /**
   * Creates a new vector by dividing a vector by a scalar with 64-bit precision.
   *
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @returns A new MutableVector4D containing the divided vector
   */
  static divide(vec, value) {
    return super._divide(vec, value, Float64Array);
  }
  /**
   * Creates a new vector by dividing two vectors component-wise with 64-bit precision.
   *
   * @param l_vec - The dividend vector
   * @param r_vec - The divisor vector
   * @returns A new MutableVector4D containing the component-wise quotient
   */
  static divideVector(l_vec, r_vec) {
    return super._divideVector(l_vec, r_vec, Float64Array);
  }
  /**
   * Creates a new MutableVector4D from a 4-element array with 64-bit precision.
   *
   * @param array - Array of exactly 4 numbers [x, y, z, w]
   * @returns A new MutableVector4D instance
   */
  static fromCopyArray4(array) {
    return new _MutableVector4D(new Float64Array(array));
  }
  /**
   * Creates a new MutableVector4D from an array of numbers with 64-bit precision.
   * Takes up to 4 elements from the array.
   *
   * @param array - Array of numbers to copy from
   * @returns A new MutableVector4D instance
   */
  static fromCopyArray(array) {
    return new _MutableVector4D(new Float64Array(array.slice(0, 4)));
  }
  /**
   * Creates a new MutableVector4D from individual component values with 64-bit precision.
   *
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   * @param w - The w component
   * @returns A new MutableVector4D instance
   */
  static fromCopy4(x, y, z, w) {
    return new _MutableVector4D(new Float64Array([x, y, z, w]));
  }
  /**
   * Creates a deep copy of this vector with 64-bit precision.
   *
   * @returns A new MutableVector4D instance with copied values
   */
  clone() {
    return super.clone();
  }
};
export {
  MutableVector4,
  MutableVector4D,
  MutableVector4 as MutableVector4F,
  MutableVector4_
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9NdXRhYmxlVmVjdG9yNC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBBcnJheTQsIEZsb2F0VHlwZWRBcnJheSwgRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IgfSBmcm9tICcuLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuLi9taXNjL0xvZ2dlcic7XG5pbXBvcnQgdHlwZSB7IElNdXRhYmxlVmVjdG9yLCBJTXV0YWJsZVZlY3RvcjQsIElWZWN0b3I0IH0gZnJvbSAnLi9JVmVjdG9yJztcbmltcG9ydCB7IFZlY3RvcjRfIH0gZnJvbSAnLi9WZWN0b3I0JztcblxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciBtdXRhYmxlIDREIHZlY3RvcnMgd2l0aCBnZW5lcmljIHR5cGVkIGFycmF5IHN1cHBvcnQuXG4gKiBFeHRlbmRzIFZlY3RvcjRfIHRvIHByb3ZpZGUgbXV0YWJpbGl0eSBjYXBhYmlsaXRpZXMgZm9yIHgsIHksIHosIGFuZCB3IGNvbXBvbmVudHMuXG4gKlxuICogQHRlbXBsYXRlIFQgLSBUaGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3IgdHlwZSAoRmxvYXQzMkFycmF5IG9yIEZsb2F0NjRBcnJheSlcbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgY2xhc3MgTXV0YWJsZVZlY3RvcjRfPFQgZXh0ZW5kcyBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcj5cbiAgZXh0ZW5kcyBWZWN0b3I0XzxUPlxuICBpbXBsZW1lbnRzIElNdXRhYmxlVmVjdG9yLCBJTXV0YWJsZVZlY3RvcjRcbntcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgTXV0YWJsZVZlY3RvcjRfIGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0geCAtIFRoZSB0eXBlZCBhcnJheSBjb250YWluaW5nIHZlY3RvciBjb21wb25lbnRzXG4gICAqIEBwYXJhbSB0eXBlIC0gT2JqZWN0IGNvbnRhaW5pbmcgdGhlIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9yXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih4OiBGbG9hdFR5cGVkQXJyYXksIHsgdHlwZSB9OiB7IHR5cGU6IFQgfSkge1xuICAgIHN1cGVyKHgsIHsgdHlwZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB4IGNvbXBvbmVudCBvZiB0aGUgdmVjdG9yLlxuICAgKiBBdXRvbWF0aWNhbGx5IGluY3JlbWVudHMgdGhlIHVwZGF0ZSBjb3VudGVyIGZvciBjaGFuZ2UgdHJhY2tpbmcuXG4gICAqL1xuICBzZXQgeCh4OiBudW1iZXIpIHtcbiAgICB0aGlzLl92WzBdID0geDtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB4IGNvbXBvbmVudCBvZiB0aGUgdmVjdG9yLlxuICAgKiBAcmV0dXJucyBUaGUgeCBjb21wb25lbnQgdmFsdWVcbiAgICovXG4gIGdldCB4KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMF07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgeSBjb21wb25lbnQgb2YgdGhlIHZlY3Rvci5cbiAgICogQXV0b21hdGljYWxseSBpbmNyZW1lbnRzIHRoZSB1cGRhdGUgY291bnRlciBmb3IgY2hhbmdlIHRyYWNraW5nLlxuICAgKi9cbiAgc2V0IHkoeTogbnVtYmVyKSB7XG4gICAgdGhpcy5fdlsxXSA9IHk7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgeSBjb21wb25lbnQgb2YgdGhlIHZlY3Rvci5cbiAgICogQHJldHVybnMgVGhlIHkgY29tcG9uZW50IHZhbHVlXG4gICAqL1xuICBnZXQgeSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92WzFdO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHogY29tcG9uZW50IG9mIHRoZSB2ZWN0b3IuXG4gICAqIEF1dG9tYXRpY2FsbHkgaW5jcmVtZW50cyB0aGUgdXBkYXRlIGNvdW50ZXIgZm9yIGNoYW5nZSB0cmFja2luZy5cbiAgICovXG4gIHNldCB6KHo6IG51bWJlcikge1xuICAgIHRoaXMuX3ZbMl0gPSB6O1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHogY29tcG9uZW50IG9mIHRoZSB2ZWN0b3IuXG4gICAqIEByZXR1cm5zIFRoZSB6IGNvbXBvbmVudCB2YWx1ZVxuICAgKi9cbiAgZ2V0IHooKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdlsyXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB3IGNvbXBvbmVudCBvZiB0aGUgdmVjdG9yLlxuICAgKiBBdXRvbWF0aWNhbGx5IGluY3JlbWVudHMgdGhlIHVwZGF0ZSBjb3VudGVyIGZvciBjaGFuZ2UgdHJhY2tpbmcuXG4gICAqL1xuICBzZXQgdyh3OiBudW1iZXIpIHtcbiAgICB0aGlzLl92WzNdID0gdztcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB3IGNvbXBvbmVudCBvZiB0aGUgdmVjdG9yLlxuICAgKiBAcmV0dXJucyBUaGUgdyBjb21wb25lbnQgdmFsdWVcbiAgICovXG4gIGdldCB3KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbM107XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcmF3IHR5cGVkIGFycmF5IGNvbnRhaW5pbmcgdGhlIHZlY3RvciBjb21wb25lbnRzLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgdW5kZXJseWluZyB0eXBlZCBhcnJheSBbeCwgeSwgeiwgd11cbiAgICovXG4gIHJhdygpIHtcbiAgICByZXR1cm4gdGhpcy5fdjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2YWx1ZSBhdCB0aGUgc3BlY2lmaWVkIGluZGV4LlxuICAgKlxuICAgKiBAcGFyYW0gaSAtIFRoZSBpbmRleCAoMC0zKSB0byBzZXRcbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIHZhbHVlIHRvIHNldCBhdCB0aGUgaW5kZXhcbiAgICogQHJldHVybnMgVGhpcyB2ZWN0b3IgaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgc2V0QXQoaTogbnVtYmVyLCB2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5fdltpXSA9IHZhbHVlO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYWxsIGZvdXIgY29tcG9uZW50cyBvZiB0aGUgdmVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0geCAtIFRoZSB4IGNvbXBvbmVudCB2YWx1ZVxuICAgKiBAcGFyYW0geSAtIFRoZSB5IGNvbXBvbmVudCB2YWx1ZVxuICAgKiBAcGFyYW0geiAtIFRoZSB6IGNvbXBvbmVudCB2YWx1ZVxuICAgKiBAcGFyYW0gdyAtIFRoZSB3IGNvbXBvbmVudCB2YWx1ZVxuICAgKiBAcmV0dXJucyBUaGlzIHZlY3RvciBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICBzZXRDb21wb25lbnRzKHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIsIHc6IG51bWJlcikge1xuICAgIHRoaXMuX3ZbMF0gPSB4O1xuICAgIHRoaXMuX3ZbMV0gPSB5O1xuICAgIHRoaXMuX3ZbMl0gPSB6O1xuICAgIHRoaXMuX3ZbM10gPSB3O1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENvcGllcyBjb21wb25lbnRzIGZyb20gYW5vdGhlciB2ZWN0b3IgdG8gdGhpcyB2ZWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgc291cmNlIHZlY3RvciB0byBjb3B5IGZyb21cbiAgICogQHJldHVybnMgVGhpcyB2ZWN0b3IgaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgY29weUNvbXBvbmVudHModmVjOiBJVmVjdG9yNCkge1xuICAgIHJldHVybiB0aGlzLnNldENvbXBvbmVudHModmVjLl92WzBdLCB2ZWMuX3ZbMV0sIHZlYy5fdlsyXSwgdmVjLl92WzNdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGFsbCBjb21wb25lbnRzIHRvIHplcm8uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoaXMgdmVjdG9yIGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIHplcm8oKSB7XG4gICAgcmV0dXJuIHRoaXMuc2V0Q29tcG9uZW50cygwLCAwLCAwLCAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGFsbCBjb21wb25lbnRzIHRvIG9uZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhpcyB2ZWN0b3IgaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgb25lKCkge1xuICAgIHJldHVybiB0aGlzLnNldENvbXBvbmVudHMoMSwgMSwgMSwgMSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbnVtYmVyIG9mIGJ5dGVzIHBlciBjb21wb25lbnQgaW4gdGhlIHVuZGVybHlpbmcgdHlwZWQgYXJyYXkuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBieXRlIHNpemUgcGVyIGNvbXBvbmVudCAoNCBmb3IgRmxvYXQzMkFycmF5LCA4IGZvciBGbG9hdDY0QXJyYXkpXG4gICAqL1xuICBnZXQgYnl0ZXNQZXJDb21wb25lbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3YuQllURVNfUEVSX0VMRU1FTlQ7XG4gIH1cblxuICAvKipcbiAgICogTm9ybWFsaXplcyB0aGUgdmVjdG9yIHRvIHVuaXQgbGVuZ3RoLlxuICAgKiBNb2RpZmllcyB0aGlzIHZlY3RvciBpbiBwbGFjZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhpcyB2ZWN0b3IgaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgbm9ybWFsaXplKCkge1xuICAgIGNvbnN0IGxlbmd0aCA9IHRoaXMubGVuZ3RoKCk7XG4gICAgdGhpcy5kaXZpZGUobGVuZ3RoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBOb3JtYWxpemVzIG9ubHkgdGhlIHgsIHksIHogY29tcG9uZW50cyAodHJlYXRpbmcgYXMgM0QgdmVjdG9yKS5cbiAgICogVGhlIHcgY29tcG9uZW50IGlzIGRpdmlkZWQgYnkgdGhlIHNhbWUgbGVuZ3RoIGZhY3Rvci5cbiAgICpcbiAgICogQHJldHVybnMgVGhpcyB2ZWN0b3IgaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgbm9ybWFsaXplMygpIHtcbiAgICBjb25zdCBsZW5ndGggPSBNYXRoLmh5cG90KHRoaXMuX3ZbMF0sIHRoaXMuX3ZbMV0sIHRoaXMuX3ZbMl0pO1xuICAgIHRoaXMuZGl2aWRlKGxlbmd0aCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhbm90aGVyIHZlY3RvciB0byB0aGlzIHZlY3RvciBjb21wb25lbnQtd2lzZS5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gYWRkXG4gICAqIEByZXR1cm5zIFRoaXMgdmVjdG9yIGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIGFkZCh2ZWM6IElWZWN0b3I0KSB7XG4gICAgdGhpcy5fdlswXSArPSB2ZWMuX3ZbMF07XG4gICAgdGhpcy5fdlsxXSArPSB2ZWMuX3ZbMV07XG4gICAgdGhpcy5fdlsyXSArPSB2ZWMuX3ZbMl07XG4gICAgdGhpcy5fdlszXSArPSB2ZWMuX3ZbM107XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU3VidHJhY3RzIGFub3RoZXIgdmVjdG9yIGZyb20gdGhpcyB2ZWN0b3IgY29tcG9uZW50LXdpc2UuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIHN1YnRyYWN0XG4gICAqIEByZXR1cm5zIFRoaXMgdmVjdG9yIGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIHN1YnRyYWN0KHZlYzogSVZlY3RvcjQpIHtcbiAgICB0aGlzLl92WzBdIC09IHZlYy5fdlswXTtcbiAgICB0aGlzLl92WzFdIC09IHZlYy5fdlsxXTtcbiAgICB0aGlzLl92WzJdIC09IHZlYy5fdlsyXTtcbiAgICB0aGlzLl92WzNdIC09IHZlYy5fdlszXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIHRoaXMgdmVjdG9yIGJ5IGEgc2NhbGFyIHZhbHVlLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIG11bHRpcGx5IGJ5XG4gICAqIEByZXR1cm5zIFRoaXMgdmVjdG9yIGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIG11bHRpcGx5KHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl92WzBdICo9IHZhbHVlO1xuICAgIHRoaXMuX3ZbMV0gKj0gdmFsdWU7XG4gICAgdGhpcy5fdlsyXSAqPSB2YWx1ZTtcbiAgICB0aGlzLl92WzNdICo9IHZhbHVlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgdGhpcyB2ZWN0b3IgYnkgYW5vdGhlciB2ZWN0b3IgY29tcG9uZW50LXdpc2UuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIG11bHRpcGx5IGJ5XG4gICAqIEByZXR1cm5zIFRoaXMgdmVjdG9yIGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIG11bHRpcGx5VmVjdG9yKHZlYzogSVZlY3RvcjQpIHtcbiAgICB0aGlzLl92WzBdICo9IHZlYy5fdlswXTtcbiAgICB0aGlzLl92WzFdICo9IHZlYy5fdlsxXTtcbiAgICB0aGlzLl92WzJdICo9IHZlYy5fdlsyXTtcbiAgICB0aGlzLl92WzNdICo9IHZlYy5fdlszXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXZpZGVzIHRoaXMgdmVjdG9yIGJ5IGEgc2NhbGFyIHZhbHVlLlxuICAgKiBJZiB0aGUgdmFsdWUgaXMgemVybywgc2V0cyBjb21wb25lbnRzIHRvIDAgYW5kIGxvZ3MgYW4gZXJyb3IuXG4gICAqXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBzY2FsYXIgdmFsdWUgdG8gZGl2aWRlIGJ5XG4gICAqIEByZXR1cm5zIFRoaXMgdmVjdG9yIGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIGRpdmlkZSh2YWx1ZTogbnVtYmVyKSB7XG4gICAgaWYgKHZhbHVlICE9PSAwKSB7XG4gICAgICB0aGlzLl92WzBdIC89IHZhbHVlO1xuICAgICAgdGhpcy5fdlsxXSAvPSB2YWx1ZTtcbiAgICAgIHRoaXMuX3ZbMl0gLz0gdmFsdWU7XG4gICAgICB0aGlzLl92WzNdIC89IHZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcignMCBkaXZpc2lvbiBvY2N1cnJlZCEgVGhlIHJlc3VsdCBpcyBzZXQgdG8gemVyby4nKTtcbiAgICAgIHRoaXMuX3ZbMF0gPSAwO1xuICAgICAgdGhpcy5fdlsxXSA9IDA7XG4gICAgICB0aGlzLl92WzJdID0gMDtcbiAgICAgIHRoaXMuX3ZbM10gPSAwO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXZpZGVzIHRoaXMgdmVjdG9yIGJ5IGFub3RoZXIgdmVjdG9yIGNvbXBvbmVudC13aXNlLlxuICAgKiBJZiBhbnkgY29tcG9uZW50IG9mIHRoZSBkaXZpc29yIGlzIHplcm8sIHNldHMgdGhlIGNvcnJlc3BvbmRpbmcgcmVzdWx0IHRvIDAuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIGRpdmlkZSBieVxuICAgKiBAcmV0dXJucyBUaGlzIHZlY3RvciBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICBkaXZpZGVWZWN0b3IodmVjOiBJVmVjdG9yNCkge1xuICAgIGlmICh2ZWMuX3ZbMF0gIT09IDAgJiYgdmVjLl92WzFdICE9PSAwICYmIHZlYy5fdlsyXSAhPT0gMCAmJiB2ZWMuX3ZbM10gIT09IDApIHtcbiAgICAgIHRoaXMuX3ZbMF0gLz0gdmVjLl92WzBdO1xuICAgICAgdGhpcy5fdlsxXSAvPSB2ZWMuX3ZbMV07XG4gICAgICB0aGlzLl92WzJdIC89IHZlYy5fdlsyXTtcbiAgICAgIHRoaXMuX3ZbM10gLz0gdmVjLl92WzNdO1xuICAgIH0gZWxzZSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcignMCBkaXZpc2lvbiBvY2N1cnJlZCEgVGhlIHJlc3VsdCBpcyBzZXQgdG8gemVyby4nKTtcbiAgICAgIHRoaXMuX3ZbMF0gPSB2ZWMuX3ZbMF0gPT09IDAgPyAwIDogdGhpcy5fdlswXSAvIHZlYy5fdlswXTtcbiAgICAgIHRoaXMuX3ZbMV0gPSB2ZWMuX3ZbMV0gPT09IDAgPyAwIDogdGhpcy5fdlsxXSAvIHZlYy5fdlsxXTtcbiAgICAgIHRoaXMuX3ZbMl0gPSB2ZWMuX3ZbMl0gPT09IDAgPyAwIDogdGhpcy5fdlsyXSAvIHZlYy5fdlsyXTtcbiAgICAgIHRoaXMuX3ZbM10gPSB2ZWMuX3ZbM10gPT09IDAgPyAwIDogdGhpcy5fdlszXSAvIHZlYy5fdlszXTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdXBkYXRlIGNvdW50ZXIgdmFsdWUuXG4gICAqIFRoaXMgY291bnRlciBpcyBpbmNyZW1lbnRlZCB3aGVuZXZlciB0aGUgdmVjdG9yIGlzIG1vZGlmaWVkLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCB1cGRhdGUgY291bnRcbiAgICovXG4gIGdldCBfdXBkYXRlQ291bnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX191cGRhdGVDb3VudDtcbiAgfVxuXG4gIHByaXZhdGUgX191cGRhdGVDb3VudCA9IDA7XG59XG5cbi8qKlxuICogTXV0YWJsZSA0RCB2ZWN0b3IgY2xhc3Mgd2l0aCAzMi1iaXQgZmxvYXQgY29tcG9uZW50cy5cbiAqIFByb3ZpZGVzIG1ldGhvZHMgZm9yIHZlY3RvciBvcGVyYXRpb25zIHRoYXQgbW9kaWZ5IHRoZSB2ZWN0b3IgaW4gcGxhY2UsXG4gKiBhcyB3ZWxsIGFzIHN0YXRpYyBmYWN0b3J5IG1ldGhvZHMgZm9yIGNyZWF0aW5nIG5ldyB2ZWN0b3JzLlxuICovXG5leHBvcnQgY2xhc3MgTXV0YWJsZVZlY3RvcjQgZXh0ZW5kcyBNdXRhYmxlVmVjdG9yNF88RmxvYXQzMkFycmF5Q29uc3RydWN0b3I+IHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgTXV0YWJsZVZlY3RvcjQgaW5zdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSB4IC0gRmxvYXQzMkFycmF5IGNvbnRhaW5pbmcgdGhlIHZlY3RvciBjb21wb25lbnRzIFt4LCB5LCB6LCB3XVxuICAgKi9cbiAgY29uc3RydWN0b3IoeDogRmxvYXQzMkFycmF5KSB7XG4gICAgc3VwZXIoeCwgeyB0eXBlOiBGbG9hdDMyQXJyYXkgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNdXRhYmxlVmVjdG9yNCBmcm9tIGFuIGFycmF5IG9mIG51bWJlcnMuXG4gICAqIFRha2VzIHVwIHRvIDQgZWxlbWVudHMgZnJvbSB0aGUgYXJyYXkuXG4gICAqXG4gICAqIEBwYXJhbSBhcnJheSAtIEFycmF5IG9mIG51bWJlcnMgdG8gY29weSBmcm9tXG4gICAqIEByZXR1cm5zIEEgbmV3IE11dGFibGVWZWN0b3I0IGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheShhcnJheTogQXJyYXk8bnVtYmVyPik6IE11dGFibGVWZWN0b3I0IHtcbiAgICByZXR1cm4gbmV3IE11dGFibGVWZWN0b3I0KG5ldyBGbG9hdDMyQXJyYXkoYXJyYXkpLnNsaWNlKDAsIDQpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IE11dGFibGVWZWN0b3I0IGZyb20gYSA0LWVsZW1lbnQgYXJyYXkuXG4gICAqXG4gICAqIEBwYXJhbSBhcnJheSAtIEFycmF5IG9mIGV4YWN0bHkgNCBudW1iZXJzIFt4LCB5LCB6LCB3XVxuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlVmVjdG9yNCBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5QXJyYXk0KGFycmF5OiBBcnJheTQ8bnVtYmVyPik6IE11dGFibGVWZWN0b3I0IHtcbiAgICByZXR1cm4gbmV3IE11dGFibGVWZWN0b3I0KG5ldyBGbG9hdDMyQXJyYXkoYXJyYXkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IE11dGFibGVWZWN0b3I0IGZyb20gaW5kaXZpZHVhbCBjb21wb25lbnQgdmFsdWVzLlxuICAgKlxuICAgKiBAcGFyYW0geCAtIFRoZSB4IGNvbXBvbmVudFxuICAgKiBAcGFyYW0geSAtIFRoZSB5IGNvbXBvbmVudFxuICAgKiBAcGFyYW0geiAtIFRoZSB6IGNvbXBvbmVudFxuICAgKiBAcGFyYW0gdyAtIFRoZSB3IGNvbXBvbmVudFxuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlVmVjdG9yNCBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5NCh4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyLCB3OiBudW1iZXIpOiBNdXRhYmxlVmVjdG9yNCB7XG4gICAgcmV0dXJuIG5ldyBNdXRhYmxlVmVjdG9yNChuZXcgRmxvYXQzMkFycmF5KFt4LCB5LCB6LCB3XSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB6ZXJvIHZlY3RvciAoMCwgMCwgMCwgMCkuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgbmV3IE11dGFibGVWZWN0b3I0IHdpdGggYWxsIGNvbXBvbmVudHMgc2V0IHRvIDBcbiAgICovXG4gIHN0YXRpYyB6ZXJvKCkge1xuICAgIHJldHVybiBzdXBlci5femVybyhGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVWZWN0b3I0O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB2ZWN0b3Igd2l0aCBhbGwgY29tcG9uZW50cyBzZXQgdG8gMSAoMSwgMSwgMSwgMSkuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgbmV3IE11dGFibGVWZWN0b3I0IHdpdGggYWxsIGNvbXBvbmVudHMgc2V0IHRvIDFcbiAgICovXG4gIHN0YXRpYyBvbmUoKSB7XG4gICAgcmV0dXJuIHN1cGVyLl9vbmUoRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlVmVjdG9yNDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZHVtbXkgdmVjdG9yIGZvciBwbGFjZWhvbGRlciBwdXJwb3Nlcy5cbiAgICpcbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZVZlY3RvcjQgZHVtbXkgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBkdW1teSgpIHtcbiAgICByZXR1cm4gc3VwZXIuX2R1bW15KEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZVZlY3RvcjQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5vcm1hbGl6ZWQgY29weSBvZiB0aGUgZ2l2ZW4gdmVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBub3JtYWxpemVcbiAgICogQHJldHVybnMgQSBuZXcgbm9ybWFsaXplZCBNdXRhYmxlVmVjdG9yNFxuICAgKi9cbiAgc3RhdGljIG5vcm1hbGl6ZSh2ZWM6IElWZWN0b3I0KSB7XG4gICAgcmV0dXJuIHN1cGVyLl9ub3JtYWxpemUodmVjLCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVWZWN0b3I0O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgdmVjdG9yIGJ5IGFkZGluZyB0d28gdmVjdG9ycyBjb21wb25lbnQtd2lzZS5cbiAgICpcbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIGxlZnQgb3BlcmFuZCB2ZWN0b3JcbiAgICogQHBhcmFtIHJfdmVjIC0gVGhlIHJpZ2h0IG9wZXJhbmQgdmVjdG9yXG4gICAqIEByZXR1cm5zIEEgbmV3IE11dGFibGVWZWN0b3I0IGNvbnRhaW5pbmcgdGhlIHN1bVxuICAgKi9cbiAgc3RhdGljIGFkZChsX3ZlYzogSVZlY3RvcjQsIHJfdmVjOiBJVmVjdG9yNCkge1xuICAgIHJldHVybiBzdXBlci5fYWRkKGxfdmVjLCByX3ZlYywgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlVmVjdG9yNDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IHZlY3RvciBieSBzdWJ0cmFjdGluZyB0aGUgc2Vjb25kIHZlY3RvciBmcm9tIHRoZSBmaXJzdC5cbiAgICpcbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIHZlY3RvciB0byBzdWJ0cmFjdCBmcm9tXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSB2ZWN0b3IgdG8gc3VidHJhY3RcbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZVZlY3RvcjQgY29udGFpbmluZyB0aGUgZGlmZmVyZW5jZVxuICAgKi9cbiAgc3RhdGljIHN1YnRyYWN0KGxfdmVjOiBJVmVjdG9yNCwgcl92ZWM6IElWZWN0b3I0KSB7XG4gICAgcmV0dXJuIHN1cGVyLl9zdWJ0cmFjdChsX3ZlYywgcl92ZWMsIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZVZlY3RvcjQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyB2ZWN0b3IgYnkgbXVsdGlwbHlpbmcgYSB2ZWN0b3IgYnkgYSBzY2FsYXIuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIG11bHRpcGx5XG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBzY2FsYXIgdmFsdWUgdG8gbXVsdGlwbHkgYnlcbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZVZlY3RvcjQgY29udGFpbmluZyB0aGUgc2NhbGVkIHZlY3RvclxuICAgKi9cbiAgc3RhdGljIG11bHRpcGx5KHZlYzogSVZlY3RvcjQsIHZhbHVlOiBudW1iZXIpIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5KHZlYywgdmFsdWUsIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZVZlY3RvcjQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyB2ZWN0b3IgYnkgbXVsdGlwbHlpbmcgdHdvIHZlY3RvcnMgY29tcG9uZW50LXdpc2UuXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBsZWZ0IG9wZXJhbmQgdmVjdG9yXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSByaWdodCBvcGVyYW5kIHZlY3RvclxuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlVmVjdG9yNCBjb250YWluaW5nIHRoZSBjb21wb25lbnQtd2lzZSBwcm9kdWN0XG4gICAqL1xuICBzdGF0aWMgbXVsdGlwbHlWZWN0b3IobF92ZWM6IElWZWN0b3I0LCByX3ZlYzogSVZlY3RvcjQpIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5VmVjdG9yKGxfdmVjLCByX3ZlYywgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlVmVjdG9yNDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IHZlY3RvciBieSBkaXZpZGluZyBhIHZlY3RvciBieSBhIHNjYWxhci5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gZGl2aWRlXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBzY2FsYXIgdmFsdWUgdG8gZGl2aWRlIGJ5XG4gICAqIEByZXR1cm5zIEEgbmV3IE11dGFibGVWZWN0b3I0IGNvbnRhaW5pbmcgdGhlIGRpdmlkZWQgdmVjdG9yXG4gICAqL1xuICBzdGF0aWMgZGl2aWRlKHZlYzogSVZlY3RvcjQsIHZhbHVlOiBudW1iZXIpIHtcbiAgICByZXR1cm4gc3VwZXIuX2RpdmlkZSh2ZWMsIHZhbHVlLCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVWZWN0b3I0O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgdmVjdG9yIGJ5IGRpdmlkaW5nIHR3byB2ZWN0b3JzIGNvbXBvbmVudC13aXNlLlxuICAgKlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgZGl2aWRlbmQgdmVjdG9yXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSBkaXZpc29yIHZlY3RvclxuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlVmVjdG9yNCBjb250YWluaW5nIHRoZSBjb21wb25lbnQtd2lzZSBxdW90aWVudFxuICAgKi9cbiAgc3RhdGljIGRpdmlkZVZlY3RvcihsX3ZlYzogSVZlY3RvcjQsIHJfdmVjOiBJVmVjdG9yNCkge1xuICAgIHJldHVybiBzdXBlci5fZGl2aWRlVmVjdG9yKGxfdmVjLCByX3ZlYywgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlVmVjdG9yNDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjbGFzcyBuYW1lIGZvciBkZWJ1Z2dpbmcgYW5kIGlkZW50aWZpY2F0aW9uIHB1cnBvc2VzLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgc3RyaW5nICdNdXRhYmxlVmVjdG9yNCdcbiAgICovXG4gIGdldCBjbGFzc05hbWUoKSB7XG4gICAgcmV0dXJuICdNdXRhYmxlVmVjdG9yNCc7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGRlZXAgY29weSBvZiB0aGlzIHZlY3Rvci5cbiAgICpcbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZVZlY3RvcjQgaW5zdGFuY2Ugd2l0aCBjb3BpZWQgdmFsdWVzXG4gICAqL1xuICBjbG9uZSgpIHtcbiAgICByZXR1cm4gbmV3ICh0aGlzLmNvbnN0cnVjdG9yIGFzIGFueSkoXG4gICAgICBuZXcgKHRoaXMuX3YuY29uc3RydWN0b3IgYXMgYW55KShbdGhpcy5fdlswXSwgdGhpcy5fdlsxXSwgdGhpcy5fdlsyXSwgdGhpcy5fdlszXV0pXG4gICAgKTtcbiAgfVxufVxuXG4vKipcbiAqIE11dGFibGUgNEQgdmVjdG9yIGNsYXNzIHdpdGggNjQtYml0IGZsb2F0IGNvbXBvbmVudHMuXG4gKiBQcm92aWRlcyBoaWdoZXIgcHJlY2lzaW9uIGFyaXRobWV0aWMgY29tcGFyZWQgdG8gTXV0YWJsZVZlY3RvcjQuXG4gKi9cbmV4cG9ydCBjbGFzcyBNdXRhYmxlVmVjdG9yNEQgZXh0ZW5kcyBNdXRhYmxlVmVjdG9yNF88RmxvYXQ2NEFycmF5Q29uc3RydWN0b3I+IHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgTXV0YWJsZVZlY3RvcjREIGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0geCAtIEZsb2F0NjRBcnJheSBjb250YWluaW5nIHRoZSB2ZWN0b3IgY29tcG9uZW50cyBbeCwgeSwgeiwgd11cbiAgICovXG4gIGNvbnN0cnVjdG9yKHg6IEZsb2F0NjRBcnJheSkge1xuICAgIHN1cGVyKHgsIHsgdHlwZTogRmxvYXQ2NEFycmF5IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB6ZXJvIHZlY3RvciAoMCwgMCwgMCwgMCkgd2l0aCA2NC1iaXQgcHJlY2lzaW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlVmVjdG9yNEQgd2l0aCBhbGwgY29tcG9uZW50cyBzZXQgdG8gMFxuICAgKi9cbiAgc3RhdGljIHplcm8oKSB7XG4gICAgcmV0dXJuIHN1cGVyLl96ZXJvKEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZVZlY3RvcjREO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB2ZWN0b3Igd2l0aCBhbGwgY29tcG9uZW50cyBzZXQgdG8gMSAoMSwgMSwgMSwgMSkgd2l0aCA2NC1iaXQgcHJlY2lzaW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlVmVjdG9yNEQgd2l0aCBhbGwgY29tcG9uZW50cyBzZXQgdG8gMVxuICAgKi9cbiAgc3RhdGljIG9uZSgpIHtcbiAgICByZXR1cm4gc3VwZXIuX29uZShGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVWZWN0b3I0RDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZHVtbXkgdmVjdG9yIGZvciBwbGFjZWhvbGRlciBwdXJwb3NlcyB3aXRoIDY0LWJpdCBwcmVjaXNpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgbmV3IE11dGFibGVWZWN0b3I0RCBkdW1teSBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGR1bW15KCkge1xuICAgIHJldHVybiBzdXBlci5fZHVtbXkoRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlVmVjdG9yNEQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5vcm1hbGl6ZWQgY29weSBvZiB0aGUgZ2l2ZW4gdmVjdG9yIHdpdGggNjQtYml0IHByZWNpc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gbm9ybWFsaXplXG4gICAqIEByZXR1cm5zIEEgbmV3IG5vcm1hbGl6ZWQgTXV0YWJsZVZlY3RvcjREXG4gICAqL1xuICBzdGF0aWMgbm9ybWFsaXplKHZlYzogSVZlY3RvcjQpIHtcbiAgICByZXR1cm4gc3VwZXIuX25vcm1hbGl6ZSh2ZWMsIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZVZlY3RvcjREO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgdmVjdG9yIGJ5IGFkZGluZyB0d28gdmVjdG9ycyBjb21wb25lbnQtd2lzZSB3aXRoIDY0LWJpdCBwcmVjaXNpb24uXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBsZWZ0IG9wZXJhbmQgdmVjdG9yXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSByaWdodCBvcGVyYW5kIHZlY3RvclxuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlVmVjdG9yNEQgY29udGFpbmluZyB0aGUgc3VtXG4gICAqL1xuICBzdGF0aWMgYWRkKGxfdmVjOiBJVmVjdG9yNCwgcl92ZWM6IElWZWN0b3I0KSB7XG4gICAgcmV0dXJuIHN1cGVyLl9hZGQobF92ZWMsIHJfdmVjLCBGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVWZWN0b3I0RDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IHZlY3RvciBieSBzdWJ0cmFjdGluZyB0aGUgc2Vjb25kIHZlY3RvciBmcm9tIHRoZSBmaXJzdCB3aXRoIDY0LWJpdCBwcmVjaXNpb24uXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSB2ZWN0b3IgdG8gc3VidHJhY3QgZnJvbVxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgdmVjdG9yIHRvIHN1YnRyYWN0XG4gICAqIEByZXR1cm5zIEEgbmV3IE11dGFibGVWZWN0b3I0RCBjb250YWluaW5nIHRoZSBkaWZmZXJlbmNlXG4gICAqL1xuICBzdGF0aWMgc3VidHJhY3QobF92ZWM6IElWZWN0b3I0LCByX3ZlYzogSVZlY3RvcjQpIHtcbiAgICByZXR1cm4gc3VwZXIuX3N1YnRyYWN0KGxfdmVjLCByX3ZlYywgRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlVmVjdG9yNEQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyB2ZWN0b3IgYnkgbXVsdGlwbHlpbmcgYSB2ZWN0b3IgYnkgYSBzY2FsYXIgd2l0aCA2NC1iaXQgcHJlY2lzaW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBtdWx0aXBseVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIG11bHRpcGx5IGJ5XG4gICAqIEByZXR1cm5zIEEgbmV3IE11dGFibGVWZWN0b3I0RCBjb250YWluaW5nIHRoZSBzY2FsZWQgdmVjdG9yXG4gICAqL1xuICBzdGF0aWMgbXVsdGlwbHkodmVjOiBJVmVjdG9yNCwgdmFsdWU6IG51bWJlcikge1xuICAgIHJldHVybiBzdXBlci5fbXVsdGlwbHkodmVjLCB2YWx1ZSwgRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlVmVjdG9yNEQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyB2ZWN0b3IgYnkgbXVsdGlwbHlpbmcgdHdvIHZlY3RvcnMgY29tcG9uZW50LXdpc2Ugd2l0aCA2NC1iaXQgcHJlY2lzaW9uLlxuICAgKlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgbGVmdCBvcGVyYW5kIHZlY3RvclxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgb3BlcmFuZCB2ZWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZVZlY3RvcjREIGNvbnRhaW5pbmcgdGhlIGNvbXBvbmVudC13aXNlIHByb2R1Y3RcbiAgICovXG4gIHN0YXRpYyBtdWx0aXBseVZlY3RvcihsX3ZlYzogSVZlY3RvcjQsIHJfdmVjOiBJVmVjdG9yNCkge1xuICAgIHJldHVybiBzdXBlci5fbXVsdGlwbHlWZWN0b3IobF92ZWMsIHJfdmVjLCBGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVWZWN0b3I0RDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IHZlY3RvciBieSBkaXZpZGluZyBhIHZlY3RvciBieSBhIHNjYWxhciB3aXRoIDY0LWJpdCBwcmVjaXNpb24uXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIGRpdmlkZVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIGRpdmlkZSBieVxuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlVmVjdG9yNEQgY29udGFpbmluZyB0aGUgZGl2aWRlZCB2ZWN0b3JcbiAgICovXG4gIHN0YXRpYyBkaXZpZGUodmVjOiBJVmVjdG9yNCwgdmFsdWU6IG51bWJlcikge1xuICAgIHJldHVybiBzdXBlci5fZGl2aWRlKHZlYywgdmFsdWUsIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZVZlY3RvcjREO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgdmVjdG9yIGJ5IGRpdmlkaW5nIHR3byB2ZWN0b3JzIGNvbXBvbmVudC13aXNlIHdpdGggNjQtYml0IHByZWNpc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIGRpdmlkZW5kIHZlY3RvclxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgZGl2aXNvciB2ZWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZVZlY3RvcjREIGNvbnRhaW5pbmcgdGhlIGNvbXBvbmVudC13aXNlIHF1b3RpZW50XG4gICAqL1xuICBzdGF0aWMgZGl2aWRlVmVjdG9yKGxfdmVjOiBJVmVjdG9yNCwgcl92ZWM6IElWZWN0b3I0KSB7XG4gICAgcmV0dXJuIHN1cGVyLl9kaXZpZGVWZWN0b3IobF92ZWMsIHJfdmVjLCBGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVWZWN0b3I0RDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IE11dGFibGVWZWN0b3I0RCBmcm9tIGEgNC1lbGVtZW50IGFycmF5IHdpdGggNjQtYml0IHByZWNpc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIGFycmF5IC0gQXJyYXkgb2YgZXhhY3RseSA0IG51bWJlcnMgW3gsIHksIHosIHddXG4gICAqIEByZXR1cm5zIEEgbmV3IE11dGFibGVWZWN0b3I0RCBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5QXJyYXk0KGFycmF5OiBBcnJheTQ8bnVtYmVyPik6IE11dGFibGVWZWN0b3I0RCB7XG4gICAgcmV0dXJuIG5ldyBNdXRhYmxlVmVjdG9yNEQobmV3IEZsb2F0NjRBcnJheShhcnJheSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgTXV0YWJsZVZlY3RvcjREIGZyb20gYW4gYXJyYXkgb2YgbnVtYmVycyB3aXRoIDY0LWJpdCBwcmVjaXNpb24uXG4gICAqIFRha2VzIHVwIHRvIDQgZWxlbWVudHMgZnJvbSB0aGUgYXJyYXkuXG4gICAqXG4gICAqIEBwYXJhbSBhcnJheSAtIEFycmF5IG9mIG51bWJlcnMgdG8gY29weSBmcm9tXG4gICAqIEByZXR1cm5zIEEgbmV3IE11dGFibGVWZWN0b3I0RCBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5QXJyYXkoYXJyYXk6IEFycmF5PG51bWJlcj4pOiBNdXRhYmxlVmVjdG9yNEQge1xuICAgIHJldHVybiBuZXcgTXV0YWJsZVZlY3RvcjREKG5ldyBGbG9hdDY0QXJyYXkoYXJyYXkuc2xpY2UoMCwgNCkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IE11dGFibGVWZWN0b3I0RCBmcm9tIGluZGl2aWR1YWwgY29tcG9uZW50IHZhbHVlcyB3aXRoIDY0LWJpdCBwcmVjaXNpb24uXG4gICAqXG4gICAqIEBwYXJhbSB4IC0gVGhlIHggY29tcG9uZW50XG4gICAqIEBwYXJhbSB5IC0gVGhlIHkgY29tcG9uZW50XG4gICAqIEBwYXJhbSB6IC0gVGhlIHogY29tcG9uZW50XG4gICAqIEBwYXJhbSB3IC0gVGhlIHcgY29tcG9uZW50XG4gICAqIEByZXR1cm5zIEEgbmV3IE11dGFibGVWZWN0b3I0RCBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5NCh4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyLCB3OiBudW1iZXIpOiBNdXRhYmxlVmVjdG9yNEQge1xuICAgIHJldHVybiBuZXcgTXV0YWJsZVZlY3RvcjREKG5ldyBGbG9hdDY0QXJyYXkoW3gsIHksIHosIHddKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGRlZXAgY29weSBvZiB0aGlzIHZlY3RvciB3aXRoIDY0LWJpdCBwcmVjaXNpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgbmV3IE11dGFibGVWZWN0b3I0RCBpbnN0YW5jZSB3aXRoIGNvcGllZCB2YWx1ZXNcbiAgICovXG4gIGNsb25lKCkge1xuICAgIHJldHVybiBzdXBlci5jbG9uZSgpIGFzIE11dGFibGVWZWN0b3I0RDtcbiAgfVxufVxuXG4vKipcbiAqIEFsaWFzIGZvciB0aGUgMzItYml0IChGbG9hdDMyQXJyYXkpIGltcGxlbWVudGF0aW9uLCBtYWtpbmcgdGhlIHByZWNpc2lvbiBleHBsaWNpdC5cbiAqL1xuZXhwb3J0IHsgTXV0YWJsZVZlY3RvcjQgYXMgTXV0YWJsZVZlY3RvcjRGIH07XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxjQUFjO0FBRXZCLFNBQVMsZ0JBQWdCO0FBU2xCLElBQU0s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QUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBLE9BQU8sSUFBSSxPQUFpQixPQUFpQjtBQUMzQyxXQUFPLE1BQU0sS0FBSyxPQUFPLE9BQU8sWUFBWTtBQUFBLEVBQzlDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBLE9BQU8sU0FBUyxPQUFpQixPQUFpQjtBQUNoRCxXQUFPLE1BQU0sVUFBVSxPQUFPLE9BQU8sWUFBWTtBQUFBLEVBQ25EO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBLE9BQU8sU0FBUyxLQUFlLE9BQWU7QUFDNUMsV0FBTyxNQUFNLFVBQVUsS0FBSyxPQUFPLFlBQVk7QUFBQSxFQUNqRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFTQSxPQUFPLGVBQWUsT0FBaUIsT0FBaUI7QUFDdEQsV0FBTyxNQUFNLGdCQUFnQixPQUFPLE9BQU8sWUFBWTtBQUFBLEVBQ3pEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBLE9BQU8sT0FBTyxLQUFlLE9BQWU7QUFDMUMsV0FBTyxNQUFNLFFBQVEsS0FBSyxPQUFPLFlBQVk7QUFBQSxFQUMvQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFTQSxPQUFPLGFBQWEsT0FBaUIsT0FBaUI7QUFDcEQsV0FBTyxNQUFNLGNBQWMsT0FBTyxPQUFPLFlBQVk7QUFBQSxFQUN2RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsT0FBTyxlQUFlLE9BQXdDO0FBQzVELFdBQU8sSUFBSSxpQkFBZ0IsSUFBSSxhQUFhLEtBQUssQ0FBQztBQUFBLEVBQ3BEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBLE9BQU8sY0FBYyxPQUF1QztBQUMxRCxXQUFPLElBQUksaUJBQWdCLElBQUksYUFBYSxNQUFNLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztBQUFBLEVBQ2hFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFXQSxPQUFPLFVBQVUsR0FBVyxHQUFXLEdBQVcsR0FBNEI7QUFDNUUsV0FBTyxJQUFJLGlCQUFnQixJQUFJLGFBQWEsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUFBLEVBQzNEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsUUFBUTtBQUNOLFdBQU8sTUFBTSxNQUFNO0FBQUEsRUFDckI7QUFDRjsiLAogICJuYW1lcyI6IFsiX191cGRhdGVDb3VudCJdCn0K
