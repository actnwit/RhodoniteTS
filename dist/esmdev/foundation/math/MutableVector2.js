// src/foundation/math/MutableVector2.ts
import { Logger } from "../misc/Logger.js";
import { Vector2_ } from "./Vector2.js";
var MutableVector2_ = class extends Vector2_ {
  /**
   * Creates a new mutable 2D vector instance.
   *
   * @param x - The typed array containing vector components
   * @param options - Configuration object containing the array type
   */
  constructor(x, { type }) {
    super(x, { type });
  }
  /**
   * Sets the x component of the vector.
   *
   * @param x - The new x component value
   */
  set x(x) {
    this._v[0] = x;
  }
  /**
   * Gets the x component of the vector.
   *
   * @returns The x component value
   */
  get x() {
    return this._v[0];
  }
  /**
   * Sets the y component of the vector.
   *
   * @param y - The new y component value
   */
  set y(y) {
    this._v[1] = y;
  }
  /**
   * Gets the y component of the vector.
   *
   * @returns The y component value
   */
  get y() {
    return this._v[1];
  }
  /**
   * Gets the z component of the vector (always 0 for 2D vectors).
   *
   * @returns Always returns 0
   */
  get z() {
    return 0;
  }
  /**
   * Gets the w component of the vector (always 1 for homogeneous coordinates).
   *
   * @returns Always returns 1
   */
  get w() {
    return 1;
  }
  /**
   * Returns the raw typed array containing the vector components.
   *
   * @returns The underlying typed array
   */
  raw() {
    return this._v;
  }
  /**
   * Sets the value at the specified index.
   *
   * @param i - The component index (0 for x, 1 for y)
   * @param value - The value to set
   * @returns This vector instance for method chaining
   */
  setAt(i, value) {
    this._v[i] = value;
    return this;
  }
  /**
   * Sets both x and y components of the vector.
   *
   * @param x - The x component value
   * @param y - The y component value
   * @returns This vector instance for method chaining
   */
  setComponents(x, y) {
    this._v[0] = x;
    this._v[1] = y;
    return this;
  }
  /**
   * Copies components from another vector to this vector.
   *
   * @param vec - The source vector to copy from
   * @returns This vector instance for method chaining
   */
  copyComponents(vec) {
    return this.setComponents(vec._v[0], vec._v[1]);
  }
  /**
   * Sets both components to zero.
   *
   * @returns This vector instance for method chaining
   */
  zero() {
    return this.setComponents(0, 0);
  }
  /**
   * Sets both components to one.
   *
   * @returns This vector instance for method chaining
   */
  one() {
    return this.setComponents(1, 1);
  }
  /**
   * Normalizes this vector to unit length (modifies the vector in place).
   * If the vector has zero length, the result is undefined.
   *
   * @returns This vector instance for method chaining
   */
  normalize() {
    const length = this.length();
    this.divide(length);
    return this;
  }
  /**
   * Adds another vector to this vector (modifies this vector in place).
   *
   * @param vec - The vector to add
   * @returns This vector instance for method chaining
   */
  add(vec) {
    this._v[0] += vec._v[0];
    this._v[1] += vec._v[1];
    return this;
  }
  /**
   * Subtracts another vector from this vector (modifies this vector in place).
   *
   * @param vec - The vector to subtract
   * @returns This vector instance for method chaining
   */
  subtract(vec) {
    this._v[0] -= vec._v[0];
    this._v[1] -= vec._v[1];
    return this;
  }
  /**
   * Multiplies this vector by a scalar value (modifies this vector in place).
   *
   * @param value - The scalar value to multiply by
   * @returns This vector instance for method chaining
   */
  multiply(value) {
    this._v[0] *= value;
    this._v[1] *= value;
    return this;
  }
  /**
   * Multiplies this vector component-wise by another vector (modifies this vector in place).
   *
   * @param vec - The vector to multiply by
   * @returns This vector instance for method chaining
   */
  multiplyVector(vec) {
    this._v[0] *= vec._v[0];
    this._v[1] *= vec._v[1];
    return this;
  }
  /**
   * Divides this vector by a scalar value (modifies this vector in place).
   * If the divisor is zero, sets components to 0 and logs an error.
   *
   * @param value - The scalar value to divide by
   * @returns This vector instance for method chaining
   */
  divide(value) {
    if (value !== 0) {
      this._v[0] /= value;
      this._v[1] /= value;
    } else {
      Logger.default.error("0 division occurred! The result is set to zero.");
      this._v[0] = 0;
      this._v[1] = 0;
    }
    return this;
  }
  /**
   * Divides this vector component-wise by another vector (modifies this vector in place).
   * If any component of the divisor is zero, sets that component to 0 and logs an error.
   *
   * @param vec - The vector to divide by
   * @returns This vector instance for method chaining
   */
  divideVector(vec) {
    if (vec._v[0] !== 0 && vec._v[1] !== 0) {
      this._v[0] /= vec._v[0];
      this._v[1] /= vec._v[1];
    } else {
      Logger.default.error("0 division occurred! The result is set to zero.");
      this._v[0] = vec._v[0] === 0 ? 0 : this._v[0] / vec._v[0];
      this._v[1] = vec._v[1] === 0 ? 0 : this._v[1] / vec._v[1];
    }
    return this;
  }
  /**
   * Gets the number of bytes per component in the underlying typed array.
   *
   * @returns The number of bytes per element
   */
  get bytesPerComponent() {
    return this._v.BYTES_PER_ELEMENT;
  }
};
var MutableVector2 = class _MutableVector2 extends MutableVector2_ {
  /**
   * Creates a new mutable 2D vector with 32-bit float components.
   *
   * @param x - The typed array containing vector components
   */
  constructor(x) {
    super(x, { type: Float32Array });
  }
  /**
   * Creates a new vector from a 2-element array by copying the values.
   *
   * @param array - A 2-element array containing [x, y] components
   * @returns A new MutableVector2 instance
   */
  static fromCopyArray2(array) {
    return new _MutableVector2(new Float32Array(array));
  }
  /**
   * Creates a new vector from an array by copying the first two values.
   *
   * @param array - An array containing at least 2 numeric values
   * @returns A new MutableVector2 instance
   */
  static fromCopyArray(array) {
    return new _MutableVector2(new Float32Array(array.slice(0, 2)));
  }
  /**
   * Creates a new vector from an existing Float32Array (shares the same buffer).
   *
   * @param float32Array - The Float32Array to use as the vector's data
   * @returns A new MutableVector2 instance
   */
  static fromFloat32Array(float32Array) {
    return new _MutableVector2(float32Array);
  }
  /**
   * Creates a new vector by copying data from an existing Float32Array.
   *
   * @param float32Array - The Float32Array to copy from
   * @returns A new MutableVector2 instance with copied data
   */
  static fromCopyFloat32Array(float32Array) {
    return new _MutableVector2(new Float32Array(float32Array.buffer.slice(0)));
  }
  /**
   * Creates a zero vector (0, 0).
   *
   * @returns A new MutableVector2 instance with zero components
   */
  static zero() {
    return super._zero(Float32Array);
  }
  /**
   * Creates a vector with all components set to one (1, 1).
   *
   * @returns A new MutableVector2 instance with components set to 1
   */
  static one() {
    return super._one(Float32Array);
  }
  /**
   * Creates a dummy vector for placeholder purposes.
   *
   * @returns A new MutableVector2 instance
   */
  static dummy() {
    return super._dummy(Float32Array);
  }
  /**
   * Creates a normalized copy of the given vector.
   *
   * @param vec - The vector to normalize
   * @returns A new normalized MutableVector2 instance
   */
  static normalize(vec) {
    return super._normalize(vec, Float32Array);
  }
  /**
   * Creates a new vector by adding two vectors.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new MutableVector2 instance containing the sum
   */
  static add(l_vec, r_vec) {
    return super._add(l_vec, r_vec, Float32Array);
  }
  /**
   * Creates a new vector by subtracting the second vector from the first.
   *
   * @param l_vec - The vector to subtract from
   * @param r_vec - The vector to subtract
   * @returns A new MutableVector2 instance containing the difference
   */
  static subtract(l_vec, r_vec) {
    return super._subtract(l_vec, r_vec, Float32Array);
  }
  /**
   * Creates a new vector by multiplying a vector by a scalar.
   *
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @returns A new MutableVector2 instance containing the scaled vector
   */
  static multiply(vec, value) {
    return super._multiply(vec, value, Float32Array);
  }
  /**
   * Creates a new vector by multiplying two vectors component-wise.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new MutableVector2 instance containing the component-wise product
   */
  static multiplyVector(l_vec, r_vec) {
    return super._multiplyVector(l_vec, r_vec, Float32Array);
  }
  /**
   * Creates a new vector by dividing a vector by a scalar.
   *
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @returns A new MutableVector2 instance containing the divided vector
   */
  static divide(vec, value) {
    return super._divide(vec, value, Float32Array);
  }
  /**
   * Creates a new vector by dividing two vectors component-wise.
   *
   * @param l_vec - The dividend vector
   * @param r_vec - The divisor vector
   * @returns A new MutableVector2 instance containing the component-wise quotient
   */
  static divideVector(l_vec, r_vec) {
    return super._divideVector(l_vec, r_vec, Float32Array);
  }
  /**
   * Gets the class name for debugging and reflection purposes.
   *
   * @returns The string "MutableVector2"
   */
  get className() {
    return "MutableVector2";
  }
  /**
   * Creates a deep copy of this vector.
   *
   * @returns A new MutableVector2 instance with the same component values
   */
  clone() {
    return super.clone();
  }
};
var MutableVector2D = class _MutableVector2D extends MutableVector2_ {
  /**
   * Creates a new mutable 2D vector with 64-bit float components.
   *
   * @param x - The typed array containing vector components
   */
  constructor(x) {
    super(x, { type: Float64Array });
  }
  /**
   * Creates a new vector from a 2-element array by copying the values.
   *
   * @param array - A 2-element array containing [x, y] components
   * @returns A new MutableVector2D instance
   */
  static fromCopyArray(array) {
    return new _MutableVector2D(new Float64Array(array));
  }
  /**
   * Creates a zero vector (0, 0) with double precision.
   *
   * @returns A new MutableVector2D instance with zero components
   */
  static zero() {
    return super._zero(Float64Array);
  }
  /**
   * Creates a vector with all components set to one (1, 1) with double precision.
   *
   * @returns A new MutableVector2D instance with components set to 1
   */
  static one() {
    return super._one(Float64Array);
  }
  /**
   * Creates a dummy vector for placeholder purposes with double precision.
   *
   * @returns A new MutableVector2D instance
   */
  static dummy() {
    return super._dummy(Float64Array);
  }
  /**
   * Creates a normalized copy of the given vector with double precision.
   *
   * @param vec - The vector to normalize
   * @returns A new normalized MutableVector2D instance
   */
  static normalize(vec) {
    return super._normalize(vec, Float64Array);
  }
  /**
   * Creates a new vector by adding two vectors with double precision.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new MutableVector2D instance containing the sum
   */
  static add(l_vec, r_vec) {
    return super._add(l_vec, r_vec, Float64Array);
  }
  /**
   * Creates a new vector by subtracting the second vector from the first with double precision.
   *
   * @param l_vec - The vector to subtract from
   * @param r_vec - The vector to subtract
   * @returns A new MutableVector2D instance containing the difference
   */
  static subtract(l_vec, r_vec) {
    return super._subtract(l_vec, r_vec, Float64Array);
  }
  /**
   * Creates a new vector by multiplying a vector by a scalar with double precision.
   *
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @returns A new MutableVector2D instance containing the scaled vector
   */
  static multiply(vec, value) {
    return super._multiply(vec, value, Float64Array);
  }
  /**
   * Creates a new vector by multiplying two vectors component-wise with double precision.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new MutableVector2D instance containing the component-wise product
   */
  static multiplyVector(l_vec, r_vec) {
    return super._multiplyVector(l_vec, r_vec, Float64Array);
  }
  /**
   * Creates a new vector by dividing a vector by a scalar with double precision.
   *
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @returns A new MutableVector2D instance containing the divided vector
   */
  static divide(vec, value) {
    return super._divide(vec, value, Float64Array);
  }
  /**
   * Creates a new vector by dividing two vectors component-wise with double precision.
   *
   * @param l_vec - The dividend vector
   * @param r_vec - The divisor vector
   * @returns A new MutableVector2D instance containing the component-wise quotient
   */
  static divideVector(l_vec, r_vec) {
    return super._divideVector(l_vec, r_vec, Float64Array);
  }
  /**
   * Creates a deep copy of this vector with double precision.
   *
   * @returns A new MutableVector2D instance with the same component values
   */
  clone() {
    return super.clone();
  }
};
export {
  MutableVector2,
  MutableVector2D,
  MutableVector2 as MutableVector2F,
  MutableVector2_
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9NdXRhYmxlVmVjdG9yMi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBBcnJheTIsIEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yLCBUeXBlZEFycmF5IH0gZnJvbSAnLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHR5cGUgeyBJTXV0YWJsZVZlY3RvciwgSU11dGFibGVWZWN0b3IyLCBJVmVjdG9yMiB9IGZyb20gJy4vSVZlY3Rvcic7XG5pbXBvcnQgeyBWZWN0b3IyXyB9IGZyb20gJy4vVmVjdG9yMic7XG5cbi8qKlxuICogQmFzZSBjbGFzcyBmb3IgbXV0YWJsZSAyRCB2ZWN0b3JzIHdpdGggZ2VuZXJpYyB0eXBlZCBhcnJheSBzdXBwb3J0LlxuICogUHJvdmlkZXMgbXV0YWJsZSBvcGVyYXRpb25zIGZvciB2ZWN0b3IgbWFuaXB1bGF0aW9uIHRoYXQgbW9kaWZ5IHRoZSB2ZWN0b3IgaW4gcGxhY2UuXG4gKlxuICogQHRlbXBsYXRlIFQgLSBUaGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3IgdHlwZSAoRmxvYXQzMkFycmF5IG9yIEZsb2F0NjRBcnJheSlcbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgY2xhc3MgTXV0YWJsZVZlY3RvcjJfPFQgZXh0ZW5kcyBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcj4gZXh0ZW5kcyBWZWN0b3IyXzxUPiB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IG11dGFibGUgMkQgdmVjdG9yIGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0geCAtIFRoZSB0eXBlZCBhcnJheSBjb250YWluaW5nIHZlY3RvciBjb21wb25lbnRzXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gQ29uZmlndXJhdGlvbiBvYmplY3QgY29udGFpbmluZyB0aGUgYXJyYXkgdHlwZVxuICAgKi9cbiAgY29uc3RydWN0b3IoeDogVHlwZWRBcnJheSwgeyB0eXBlIH06IHsgdHlwZTogVCB9KSB7XG4gICAgc3VwZXIoeCwgeyB0eXBlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHggY29tcG9uZW50IG9mIHRoZSB2ZWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB4IC0gVGhlIG5ldyB4IGNvbXBvbmVudCB2YWx1ZVxuICAgKi9cbiAgc2V0IHgoeDogbnVtYmVyKSB7XG4gICAgdGhpcy5fdlswXSA9IHg7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgeCBjb21wb25lbnQgb2YgdGhlIHZlY3Rvci5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHggY29tcG9uZW50IHZhbHVlXG4gICAqL1xuICBnZXQgeCgpIHtcbiAgICByZXR1cm4gdGhpcy5fdlswXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB5IGNvbXBvbmVudCBvZiB0aGUgdmVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0geSAtIFRoZSBuZXcgeSBjb21wb25lbnQgdmFsdWVcbiAgICovXG4gIHNldCB5KHk6IG51bWJlcikge1xuICAgIHRoaXMuX3ZbMV0gPSB5O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHkgY29tcG9uZW50IG9mIHRoZSB2ZWN0b3IuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB5IGNvbXBvbmVudCB2YWx1ZVxuICAgKi9cbiAgZ2V0IHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMV07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgeiBjb21wb25lbnQgb2YgdGhlIHZlY3RvciAoYWx3YXlzIDAgZm9yIDJEIHZlY3RvcnMpLlxuICAgKlxuICAgKiBAcmV0dXJucyBBbHdheXMgcmV0dXJucyAwXG4gICAqL1xuICBnZXQgeigpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB3IGNvbXBvbmVudCBvZiB0aGUgdmVjdG9yIChhbHdheXMgMSBmb3IgaG9tb2dlbmVvdXMgY29vcmRpbmF0ZXMpLlxuICAgKlxuICAgKiBAcmV0dXJucyBBbHdheXMgcmV0dXJucyAxXG4gICAqL1xuICBnZXQgdygpIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSByYXcgdHlwZWQgYXJyYXkgY29udGFpbmluZyB0aGUgdmVjdG9yIGNvbXBvbmVudHMuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB1bmRlcmx5aW5nIHR5cGVkIGFycmF5XG4gICAqL1xuICByYXcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Y7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmFsdWUgYXQgdGhlIHNwZWNpZmllZCBpbmRleC5cbiAgICpcbiAgICogQHBhcmFtIGkgLSBUaGUgY29tcG9uZW50IGluZGV4ICgwIGZvciB4LCAxIGZvciB5KVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgdmFsdWUgdG8gc2V0XG4gICAqIEByZXR1cm5zIFRoaXMgdmVjdG9yIGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIHNldEF0KGk6IG51bWJlciwgdmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMuX3ZbaV0gPSB2YWx1ZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGJvdGggeCBhbmQgeSBjb21wb25lbnRzIG9mIHRoZSB2ZWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB4IC0gVGhlIHggY29tcG9uZW50IHZhbHVlXG4gICAqIEBwYXJhbSB5IC0gVGhlIHkgY29tcG9uZW50IHZhbHVlXG4gICAqIEByZXR1cm5zIFRoaXMgdmVjdG9yIGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIHNldENvbXBvbmVudHMoeDogbnVtYmVyLCB5OiBudW1iZXIpIHtcbiAgICB0aGlzLl92WzBdID0geDtcbiAgICB0aGlzLl92WzFdID0geTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDb3BpZXMgY29tcG9uZW50cyBmcm9tIGFub3RoZXIgdmVjdG9yIHRvIHRoaXMgdmVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHNvdXJjZSB2ZWN0b3IgdG8gY29weSBmcm9tXG4gICAqIEByZXR1cm5zIFRoaXMgdmVjdG9yIGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIGNvcHlDb21wb25lbnRzKHZlYzogSVZlY3RvcjIpIHtcbiAgICByZXR1cm4gdGhpcy5zZXRDb21wb25lbnRzKHZlYy5fdlswXSwgdmVjLl92WzFdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGJvdGggY29tcG9uZW50cyB0byB6ZXJvLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGlzIHZlY3RvciBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICB6ZXJvKCkge1xuICAgIHJldHVybiB0aGlzLnNldENvbXBvbmVudHMoMCwgMCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBib3RoIGNvbXBvbmVudHMgdG8gb25lLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGlzIHZlY3RvciBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICBvbmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuc2V0Q29tcG9uZW50cygxLCAxKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBOb3JtYWxpemVzIHRoaXMgdmVjdG9yIHRvIHVuaXQgbGVuZ3RoIChtb2RpZmllcyB0aGUgdmVjdG9yIGluIHBsYWNlKS5cbiAgICogSWYgdGhlIHZlY3RvciBoYXMgemVybyBsZW5ndGgsIHRoZSByZXN1bHQgaXMgdW5kZWZpbmVkLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGlzIHZlY3RvciBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICBub3JtYWxpemUoKSB7XG4gICAgY29uc3QgbGVuZ3RoID0gdGhpcy5sZW5ndGgoKTtcbiAgICB0aGlzLmRpdmlkZShsZW5ndGgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYW5vdGhlciB2ZWN0b3IgdG8gdGhpcyB2ZWN0b3IgKG1vZGlmaWVzIHRoaXMgdmVjdG9yIGluIHBsYWNlKS5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gYWRkXG4gICAqIEByZXR1cm5zIFRoaXMgdmVjdG9yIGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIGFkZCh2ZWM6IElWZWN0b3IyKSB7XG4gICAgdGhpcy5fdlswXSArPSB2ZWMuX3ZbMF07XG4gICAgdGhpcy5fdlsxXSArPSB2ZWMuX3ZbMV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU3VidHJhY3RzIGFub3RoZXIgdmVjdG9yIGZyb20gdGhpcyB2ZWN0b3IgKG1vZGlmaWVzIHRoaXMgdmVjdG9yIGluIHBsYWNlKS5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gc3VidHJhY3RcbiAgICogQHJldHVybnMgVGhpcyB2ZWN0b3IgaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgc3VidHJhY3QodmVjOiBJVmVjdG9yMikge1xuICAgIHRoaXMuX3ZbMF0gLT0gdmVjLl92WzBdO1xuICAgIHRoaXMuX3ZbMV0gLT0gdmVjLl92WzFdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgdGhpcyB2ZWN0b3IgYnkgYSBzY2FsYXIgdmFsdWUgKG1vZGlmaWVzIHRoaXMgdmVjdG9yIGluIHBsYWNlKS5cbiAgICpcbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIHNjYWxhciB2YWx1ZSB0byBtdWx0aXBseSBieVxuICAgKiBAcmV0dXJucyBUaGlzIHZlY3RvciBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICBtdWx0aXBseSh2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5fdlswXSAqPSB2YWx1ZTtcbiAgICB0aGlzLl92WzFdICo9IHZhbHVlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgdGhpcyB2ZWN0b3IgY29tcG9uZW50LXdpc2UgYnkgYW5vdGhlciB2ZWN0b3IgKG1vZGlmaWVzIHRoaXMgdmVjdG9yIGluIHBsYWNlKS5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gbXVsdGlwbHkgYnlcbiAgICogQHJldHVybnMgVGhpcyB2ZWN0b3IgaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgbXVsdGlwbHlWZWN0b3IodmVjOiBJVmVjdG9yMikge1xuICAgIHRoaXMuX3ZbMF0gKj0gdmVjLl92WzBdO1xuICAgIHRoaXMuX3ZbMV0gKj0gdmVjLl92WzFdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIERpdmlkZXMgdGhpcyB2ZWN0b3IgYnkgYSBzY2FsYXIgdmFsdWUgKG1vZGlmaWVzIHRoaXMgdmVjdG9yIGluIHBsYWNlKS5cbiAgICogSWYgdGhlIGRpdmlzb3IgaXMgemVybywgc2V0cyBjb21wb25lbnRzIHRvIDAgYW5kIGxvZ3MgYW4gZXJyb3IuXG4gICAqXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBzY2FsYXIgdmFsdWUgdG8gZGl2aWRlIGJ5XG4gICAqIEByZXR1cm5zIFRoaXMgdmVjdG9yIGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIGRpdmlkZSh2YWx1ZTogbnVtYmVyKSB7XG4gICAgaWYgKHZhbHVlICE9PSAwKSB7XG4gICAgICB0aGlzLl92WzBdIC89IHZhbHVlO1xuICAgICAgdGhpcy5fdlsxXSAvPSB2YWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJzAgZGl2aXNpb24gb2NjdXJyZWQhIFRoZSByZXN1bHQgaXMgc2V0IHRvIHplcm8uJyk7XG4gICAgICB0aGlzLl92WzBdID0gMDtcbiAgICAgIHRoaXMuX3ZbMV0gPSAwO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXZpZGVzIHRoaXMgdmVjdG9yIGNvbXBvbmVudC13aXNlIGJ5IGFub3RoZXIgdmVjdG9yIChtb2RpZmllcyB0aGlzIHZlY3RvciBpbiBwbGFjZSkuXG4gICAqIElmIGFueSBjb21wb25lbnQgb2YgdGhlIGRpdmlzb3IgaXMgemVybywgc2V0cyB0aGF0IGNvbXBvbmVudCB0byAwIGFuZCBsb2dzIGFuIGVycm9yLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBkaXZpZGUgYnlcbiAgICogQHJldHVybnMgVGhpcyB2ZWN0b3IgaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgZGl2aWRlVmVjdG9yKHZlYzogSVZlY3RvcjIpIHtcbiAgICBpZiAodmVjLl92WzBdICE9PSAwICYmIHZlYy5fdlsxXSAhPT0gMCkge1xuICAgICAgdGhpcy5fdlswXSAvPSB2ZWMuX3ZbMF07XG4gICAgICB0aGlzLl92WzFdIC89IHZlYy5fdlsxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJzAgZGl2aXNpb24gb2NjdXJyZWQhIFRoZSByZXN1bHQgaXMgc2V0IHRvIHplcm8uJyk7XG4gICAgICB0aGlzLl92WzBdID0gdmVjLl92WzBdID09PSAwID8gMCA6IHRoaXMuX3ZbMF0gLyB2ZWMuX3ZbMF07XG4gICAgICB0aGlzLl92WzFdID0gdmVjLl92WzFdID09PSAwID8gMCA6IHRoaXMuX3ZbMV0gLyB2ZWMuX3ZbMV07XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG51bWJlciBvZiBieXRlcyBwZXIgY29tcG9uZW50IGluIHRoZSB1bmRlcmx5aW5nIHR5cGVkIGFycmF5LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbnVtYmVyIG9mIGJ5dGVzIHBlciBlbGVtZW50XG4gICAqL1xuICBnZXQgYnl0ZXNQZXJDb21wb25lbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3YuQllURVNfUEVSX0VMRU1FTlQ7XG4gIH1cbn1cblxuLyoqXG4gKiBNdXRhYmxlIDJEIHZlY3RvciBjbGFzcyB3aXRoIDMyLWJpdCBmbG9hdCBjb21wb25lbnRzLlxuICogUHJvdmlkZXMgZWZmaWNpZW50IHZlY3RvciBvcGVyYXRpb25zIHRoYXQgbW9kaWZ5IHRoZSB2ZWN0b3IgaW4gcGxhY2UsXG4gKiBpbXBsZW1lbnRpbmcgYm90aCBJTXV0YWJsZVZlY3RvciBhbmQgSU11dGFibGVWZWN0b3IyIGludGVyZmFjZXMuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnN0IHZlYyA9IE11dGFibGVWZWN0b3IyLnplcm8oKTtcbiAqIHZlYy5zZXRDb21wb25lbnRzKDMsIDQpO1xuICogdmVjLm5vcm1hbGl6ZSgpOyAvLyB2ZWMgaXMgbm93ICgwLjYsIDAuOClcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgTXV0YWJsZVZlY3RvcjJcbiAgZXh0ZW5kcyBNdXRhYmxlVmVjdG9yMl88RmxvYXQzMkFycmF5Q29uc3RydWN0b3I+XG4gIGltcGxlbWVudHMgSU11dGFibGVWZWN0b3IsIElNdXRhYmxlVmVjdG9yMlxue1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBtdXRhYmxlIDJEIHZlY3RvciB3aXRoIDMyLWJpdCBmbG9hdCBjb21wb25lbnRzLlxuICAgKlxuICAgKiBAcGFyYW0geCAtIFRoZSB0eXBlZCBhcnJheSBjb250YWluaW5nIHZlY3RvciBjb21wb25lbnRzXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih4OiBUeXBlZEFycmF5KSB7XG4gICAgc3VwZXIoeCwgeyB0eXBlOiBGbG9hdDMyQXJyYXkgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyB2ZWN0b3IgZnJvbSBhIDItZWxlbWVudCBhcnJheSBieSBjb3B5aW5nIHRoZSB2YWx1ZXMuXG4gICAqXG4gICAqIEBwYXJhbSBhcnJheSAtIEEgMi1lbGVtZW50IGFycmF5IGNvbnRhaW5pbmcgW3gsIHldIGNvbXBvbmVudHNcbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZVZlY3RvcjIgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weUFycmF5MihhcnJheTogQXJyYXkyPG51bWJlcj4pOiBNdXRhYmxlVmVjdG9yMiB7XG4gICAgcmV0dXJuIG5ldyBNdXRhYmxlVmVjdG9yMihuZXcgRmxvYXQzMkFycmF5KGFycmF5KSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyB2ZWN0b3IgZnJvbSBhbiBhcnJheSBieSBjb3B5aW5nIHRoZSBmaXJzdCB0d28gdmFsdWVzLlxuICAgKlxuICAgKiBAcGFyYW0gYXJyYXkgLSBBbiBhcnJheSBjb250YWluaW5nIGF0IGxlYXN0IDIgbnVtZXJpYyB2YWx1ZXNcbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZVZlY3RvcjIgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weUFycmF5KGFycmF5OiBBcnJheTxudW1iZXI+KTogTXV0YWJsZVZlY3RvcjIge1xuICAgIHJldHVybiBuZXcgTXV0YWJsZVZlY3RvcjIobmV3IEZsb2F0MzJBcnJheShhcnJheS5zbGljZSgwLCAyKSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgdmVjdG9yIGZyb20gYW4gZXhpc3RpbmcgRmxvYXQzMkFycmF5IChzaGFyZXMgdGhlIHNhbWUgYnVmZmVyKS5cbiAgICpcbiAgICogQHBhcmFtIGZsb2F0MzJBcnJheSAtIFRoZSBGbG9hdDMyQXJyYXkgdG8gdXNlIGFzIHRoZSB2ZWN0b3IncyBkYXRhXG4gICAqIEByZXR1cm5zIEEgbmV3IE11dGFibGVWZWN0b3IyIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZnJvbUZsb2F0MzJBcnJheShmbG9hdDMyQXJyYXk6IEZsb2F0MzJBcnJheSk6IE11dGFibGVWZWN0b3IyIHtcbiAgICByZXR1cm4gbmV3IE11dGFibGVWZWN0b3IyKGZsb2F0MzJBcnJheSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyB2ZWN0b3IgYnkgY29weWluZyBkYXRhIGZyb20gYW4gZXhpc3RpbmcgRmxvYXQzMkFycmF5LlxuICAgKlxuICAgKiBAcGFyYW0gZmxvYXQzMkFycmF5IC0gVGhlIEZsb2F0MzJBcnJheSB0byBjb3B5IGZyb21cbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZVZlY3RvcjIgaW5zdGFuY2Ugd2l0aCBjb3BpZWQgZGF0YVxuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5RmxvYXQzMkFycmF5KGZsb2F0MzJBcnJheTogRmxvYXQzMkFycmF5KTogTXV0YWJsZVZlY3RvcjIge1xuICAgIHJldHVybiBuZXcgTXV0YWJsZVZlY3RvcjIobmV3IEZsb2F0MzJBcnJheShmbG9hdDMyQXJyYXkuYnVmZmVyLnNsaWNlKDApKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHplcm8gdmVjdG9yICgwLCAwKS5cbiAgICpcbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZVZlY3RvcjIgaW5zdGFuY2Ugd2l0aCB6ZXJvIGNvbXBvbmVudHNcbiAgICovXG4gIHN0YXRpYyB6ZXJvKCkge1xuICAgIHJldHVybiBzdXBlci5femVybyhGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVWZWN0b3IyO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB2ZWN0b3Igd2l0aCBhbGwgY29tcG9uZW50cyBzZXQgdG8gb25lICgxLCAxKS5cbiAgICpcbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZVZlY3RvcjIgaW5zdGFuY2Ugd2l0aCBjb21wb25lbnRzIHNldCB0byAxXG4gICAqL1xuICBzdGF0aWMgb25lKCkge1xuICAgIHJldHVybiBzdXBlci5fb25lKEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZVZlY3RvcjI7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGR1bW15IHZlY3RvciBmb3IgcGxhY2Vob2xkZXIgcHVycG9zZXMuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgbmV3IE11dGFibGVWZWN0b3IyIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZHVtbXkoKSB7XG4gICAgcmV0dXJuIHN1cGVyLl9kdW1teShGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVWZWN0b3IyO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBub3JtYWxpemVkIGNvcHkgb2YgdGhlIGdpdmVuIHZlY3Rvci5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gbm9ybWFsaXplXG4gICAqIEByZXR1cm5zIEEgbmV3IG5vcm1hbGl6ZWQgTXV0YWJsZVZlY3RvcjIgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBub3JtYWxpemUodmVjOiBJVmVjdG9yMikge1xuICAgIHJldHVybiBzdXBlci5fbm9ybWFsaXplKHZlYywgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlVmVjdG9yMjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IHZlY3RvciBieSBhZGRpbmcgdHdvIHZlY3RvcnMuXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBsZWZ0IG9wZXJhbmQgdmVjdG9yXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSByaWdodCBvcGVyYW5kIHZlY3RvclxuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlVmVjdG9yMiBpbnN0YW5jZSBjb250YWluaW5nIHRoZSBzdW1cbiAgICovXG4gIHN0YXRpYyBhZGQobF92ZWM6IElWZWN0b3IyLCByX3ZlYzogSVZlY3RvcjIpIHtcbiAgICByZXR1cm4gc3VwZXIuX2FkZChsX3ZlYywgcl92ZWMsIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZVZlY3RvcjI7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyB2ZWN0b3IgYnkgc3VidHJhY3RpbmcgdGhlIHNlY29uZCB2ZWN0b3IgZnJvbSB0aGUgZmlyc3QuXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSB2ZWN0b3IgdG8gc3VidHJhY3QgZnJvbVxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgdmVjdG9yIHRvIHN1YnRyYWN0XG4gICAqIEByZXR1cm5zIEEgbmV3IE11dGFibGVWZWN0b3IyIGluc3RhbmNlIGNvbnRhaW5pbmcgdGhlIGRpZmZlcmVuY2VcbiAgICovXG4gIHN0YXRpYyBzdWJ0cmFjdChsX3ZlYzogSVZlY3RvcjIsIHJfdmVjOiBJVmVjdG9yMikge1xuICAgIHJldHVybiBzdXBlci5fc3VidHJhY3QobF92ZWMsIHJfdmVjLCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVWZWN0b3IyO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgdmVjdG9yIGJ5IG11bHRpcGx5aW5nIGEgdmVjdG9yIGJ5IGEgc2NhbGFyLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBtdWx0aXBseVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIG11bHRpcGx5IGJ5XG4gICAqIEByZXR1cm5zIEEgbmV3IE11dGFibGVWZWN0b3IyIGluc3RhbmNlIGNvbnRhaW5pbmcgdGhlIHNjYWxlZCB2ZWN0b3JcbiAgICovXG4gIHN0YXRpYyBtdWx0aXBseSh2ZWM6IElWZWN0b3IyLCB2YWx1ZTogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHN1cGVyLl9tdWx0aXBseSh2ZWMsIHZhbHVlLCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVWZWN0b3IyO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgdmVjdG9yIGJ5IG11bHRpcGx5aW5nIHR3byB2ZWN0b3JzIGNvbXBvbmVudC13aXNlLlxuICAgKlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgbGVmdCBvcGVyYW5kIHZlY3RvclxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgb3BlcmFuZCB2ZWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZVZlY3RvcjIgaW5zdGFuY2UgY29udGFpbmluZyB0aGUgY29tcG9uZW50LXdpc2UgcHJvZHVjdFxuICAgKi9cbiAgc3RhdGljIG11bHRpcGx5VmVjdG9yKGxfdmVjOiBJVmVjdG9yMiwgcl92ZWM6IElWZWN0b3IyKSB7XG4gICAgcmV0dXJuIHN1cGVyLl9tdWx0aXBseVZlY3RvcihsX3ZlYywgcl92ZWMsIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZVZlY3RvcjI7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyB2ZWN0b3IgYnkgZGl2aWRpbmcgYSB2ZWN0b3IgYnkgYSBzY2FsYXIuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIGRpdmlkZVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIGRpdmlkZSBieVxuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlVmVjdG9yMiBpbnN0YW5jZSBjb250YWluaW5nIHRoZSBkaXZpZGVkIHZlY3RvclxuICAgKi9cbiAgc3RhdGljIGRpdmlkZSh2ZWM6IElWZWN0b3IyLCB2YWx1ZTogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHN1cGVyLl9kaXZpZGUodmVjLCB2YWx1ZSwgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlVmVjdG9yMjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IHZlY3RvciBieSBkaXZpZGluZyB0d28gdmVjdG9ycyBjb21wb25lbnQtd2lzZS5cbiAgICpcbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIGRpdmlkZW5kIHZlY3RvclxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgZGl2aXNvciB2ZWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZVZlY3RvcjIgaW5zdGFuY2UgY29udGFpbmluZyB0aGUgY29tcG9uZW50LXdpc2UgcXVvdGllbnRcbiAgICovXG4gIHN0YXRpYyBkaXZpZGVWZWN0b3IobF92ZWM6IElWZWN0b3IyLCByX3ZlYzogSVZlY3RvcjIpIHtcbiAgICByZXR1cm4gc3VwZXIuX2RpdmlkZVZlY3RvcihsX3ZlYywgcl92ZWMsIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZVZlY3RvcjI7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY2xhc3MgbmFtZSBmb3IgZGVidWdnaW5nIGFuZCByZWZsZWN0aW9uIHB1cnBvc2VzLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgc3RyaW5nIFwiTXV0YWJsZVZlY3RvcjJcIlxuICAgKi9cbiAgZ2V0IGNsYXNzTmFtZSgpIHtcbiAgICByZXR1cm4gJ011dGFibGVWZWN0b3IyJztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZGVlcCBjb3B5IG9mIHRoaXMgdmVjdG9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlVmVjdG9yMiBpbnN0YW5jZSB3aXRoIHRoZSBzYW1lIGNvbXBvbmVudCB2YWx1ZXNcbiAgICovXG4gIGNsb25lKCkge1xuICAgIHJldHVybiBzdXBlci5jbG9uZSgpIGFzIE11dGFibGVWZWN0b3IyO1xuICB9XG59XG5cbi8qKlxuICogTXV0YWJsZSAyRCB2ZWN0b3IgY2xhc3Mgd2l0aCA2NC1iaXQgZmxvYXQgY29tcG9uZW50cy5cbiAqIFByb3ZpZGVzIGhpZ2gtcHJlY2lzaW9uIHZlY3RvciBvcGVyYXRpb25zIGZvciBhcHBsaWNhdGlvbnMgcmVxdWlyaW5nXG4gKiBkb3VibGUtcHJlY2lzaW9uIGZsb2F0aW5nLXBvaW50IGFyaXRobWV0aWMuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnN0IHZlYyA9IE11dGFibGVWZWN0b3IyRC56ZXJvKCk7XG4gKiB2ZWMuc2V0Q29tcG9uZW50cygxLjIzNDU2Nzg5MDEyMzQ1LCAyLjM0NTY3ODkwMTIzNDU2KTtcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgTXV0YWJsZVZlY3RvcjJEIGV4dGVuZHMgTXV0YWJsZVZlY3RvcjJfPEZsb2F0NjRBcnJheUNvbnN0cnVjdG9yPiB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IG11dGFibGUgMkQgdmVjdG9yIHdpdGggNjQtYml0IGZsb2F0IGNvbXBvbmVudHMuXG4gICAqXG4gICAqIEBwYXJhbSB4IC0gVGhlIHR5cGVkIGFycmF5IGNvbnRhaW5pbmcgdmVjdG9yIGNvbXBvbmVudHNcbiAgICovXG4gIGNvbnN0cnVjdG9yKHg6IFR5cGVkQXJyYXkpIHtcbiAgICBzdXBlcih4LCB7IHR5cGU6IEZsb2F0NjRBcnJheSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IHZlY3RvciBmcm9tIGEgMi1lbGVtZW50IGFycmF5IGJ5IGNvcHlpbmcgdGhlIHZhbHVlcy5cbiAgICpcbiAgICogQHBhcmFtIGFycmF5IC0gQSAyLWVsZW1lbnQgYXJyYXkgY29udGFpbmluZyBbeCwgeV0gY29tcG9uZW50c1xuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlVmVjdG9yMkQgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weUFycmF5KGFycmF5OiBBcnJheTI8bnVtYmVyPik6IE11dGFibGVWZWN0b3IyRCB7XG4gICAgcmV0dXJuIG5ldyBNdXRhYmxlVmVjdG9yMkQobmV3IEZsb2F0NjRBcnJheShhcnJheSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB6ZXJvIHZlY3RvciAoMCwgMCkgd2l0aCBkb3VibGUgcHJlY2lzaW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlVmVjdG9yMkQgaW5zdGFuY2Ugd2l0aCB6ZXJvIGNvbXBvbmVudHNcbiAgICovXG4gIHN0YXRpYyB6ZXJvKCkge1xuICAgIHJldHVybiBzdXBlci5femVybyhGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVWZWN0b3IyRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgdmVjdG9yIHdpdGggYWxsIGNvbXBvbmVudHMgc2V0IHRvIG9uZSAoMSwgMSkgd2l0aCBkb3VibGUgcHJlY2lzaW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlVmVjdG9yMkQgaW5zdGFuY2Ugd2l0aCBjb21wb25lbnRzIHNldCB0byAxXG4gICAqL1xuICBzdGF0aWMgb25lKCkge1xuICAgIHJldHVybiBzdXBlci5fb25lKEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZVZlY3RvcjJEO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBkdW1teSB2ZWN0b3IgZm9yIHBsYWNlaG9sZGVyIHB1cnBvc2VzIHdpdGggZG91YmxlIHByZWNpc2lvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZVZlY3RvcjJEIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZHVtbXkoKSB7XG4gICAgcmV0dXJuIHN1cGVyLl9kdW1teShGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVWZWN0b3IyRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbm9ybWFsaXplZCBjb3B5IG9mIHRoZSBnaXZlbiB2ZWN0b3Igd2l0aCBkb3VibGUgcHJlY2lzaW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBub3JtYWxpemVcbiAgICogQHJldHVybnMgQSBuZXcgbm9ybWFsaXplZCBNdXRhYmxlVmVjdG9yMkQgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBub3JtYWxpemUodmVjOiBJVmVjdG9yMikge1xuICAgIHJldHVybiBzdXBlci5fbm9ybWFsaXplKHZlYywgRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlVmVjdG9yMkQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyB2ZWN0b3IgYnkgYWRkaW5nIHR3byB2ZWN0b3JzIHdpdGggZG91YmxlIHByZWNpc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIGxlZnQgb3BlcmFuZCB2ZWN0b3JcbiAgICogQHBhcmFtIHJfdmVjIC0gVGhlIHJpZ2h0IG9wZXJhbmQgdmVjdG9yXG4gICAqIEByZXR1cm5zIEEgbmV3IE11dGFibGVWZWN0b3IyRCBpbnN0YW5jZSBjb250YWluaW5nIHRoZSBzdW1cbiAgICovXG4gIHN0YXRpYyBhZGQobF92ZWM6IElWZWN0b3IyLCByX3ZlYzogSVZlY3RvcjIpIHtcbiAgICByZXR1cm4gc3VwZXIuX2FkZChsX3ZlYywgcl92ZWMsIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZVZlY3RvcjJEO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgdmVjdG9yIGJ5IHN1YnRyYWN0aW5nIHRoZSBzZWNvbmQgdmVjdG9yIGZyb20gdGhlIGZpcnN0IHdpdGggZG91YmxlIHByZWNpc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIHZlY3RvciB0byBzdWJ0cmFjdCBmcm9tXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSB2ZWN0b3IgdG8gc3VidHJhY3RcbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZVZlY3RvcjJEIGluc3RhbmNlIGNvbnRhaW5pbmcgdGhlIGRpZmZlcmVuY2VcbiAgICovXG4gIHN0YXRpYyBzdWJ0cmFjdChsX3ZlYzogSVZlY3RvcjIsIHJfdmVjOiBJVmVjdG9yMikge1xuICAgIHJldHVybiBzdXBlci5fc3VidHJhY3QobF92ZWMsIHJfdmVjLCBGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVWZWN0b3IyRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IHZlY3RvciBieSBtdWx0aXBseWluZyBhIHZlY3RvciBieSBhIHNjYWxhciB3aXRoIGRvdWJsZSBwcmVjaXNpb24uXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIG11bHRpcGx5XG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBzY2FsYXIgdmFsdWUgdG8gbXVsdGlwbHkgYnlcbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZVZlY3RvcjJEIGluc3RhbmNlIGNvbnRhaW5pbmcgdGhlIHNjYWxlZCB2ZWN0b3JcbiAgICovXG4gIHN0YXRpYyBtdWx0aXBseSh2ZWM6IElWZWN0b3IyLCB2YWx1ZTogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHN1cGVyLl9tdWx0aXBseSh2ZWMsIHZhbHVlLCBGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVWZWN0b3IyRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IHZlY3RvciBieSBtdWx0aXBseWluZyB0d28gdmVjdG9ycyBjb21wb25lbnQtd2lzZSB3aXRoIGRvdWJsZSBwcmVjaXNpb24uXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBsZWZ0IG9wZXJhbmQgdmVjdG9yXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSByaWdodCBvcGVyYW5kIHZlY3RvclxuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlVmVjdG9yMkQgaW5zdGFuY2UgY29udGFpbmluZyB0aGUgY29tcG9uZW50LXdpc2UgcHJvZHVjdFxuICAgKi9cbiAgc3RhdGljIG11bHRpcGx5VmVjdG9yKGxfdmVjOiBJVmVjdG9yMiwgcl92ZWM6IElWZWN0b3IyKSB7XG4gICAgcmV0dXJuIHN1cGVyLl9tdWx0aXBseVZlY3RvcihsX3ZlYywgcl92ZWMsIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZVZlY3RvcjJEO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgdmVjdG9yIGJ5IGRpdmlkaW5nIGEgdmVjdG9yIGJ5IGEgc2NhbGFyIHdpdGggZG91YmxlIHByZWNpc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gZGl2aWRlXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBzY2FsYXIgdmFsdWUgdG8gZGl2aWRlIGJ5XG4gICAqIEByZXR1cm5zIEEgbmV3IE11dGFibGVWZWN0b3IyRCBpbnN0YW5jZSBjb250YWluaW5nIHRoZSBkaXZpZGVkIHZlY3RvclxuICAgKi9cbiAgc3RhdGljIGRpdmlkZSh2ZWM6IElWZWN0b3IyLCB2YWx1ZTogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHN1cGVyLl9kaXZpZGUodmVjLCB2YWx1ZSwgRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlVmVjdG9yMkQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyB2ZWN0b3IgYnkgZGl2aWRpbmcgdHdvIHZlY3RvcnMgY29tcG9uZW50LXdpc2Ugd2l0aCBkb3VibGUgcHJlY2lzaW9uLlxuICAgKlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgZGl2aWRlbmQgdmVjdG9yXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSBkaXZpc29yIHZlY3RvclxuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlVmVjdG9yMkQgaW5zdGFuY2UgY29udGFpbmluZyB0aGUgY29tcG9uZW50LXdpc2UgcXVvdGllbnRcbiAgICovXG4gIHN0YXRpYyBkaXZpZGVWZWN0b3IobF92ZWM6IElWZWN0b3IyLCByX3ZlYzogSVZlY3RvcjIpIHtcbiAgICByZXR1cm4gc3VwZXIuX2RpdmlkZVZlY3RvcihsX3ZlYywgcl92ZWMsIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZVZlY3RvcjJEO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBkZWVwIGNvcHkgb2YgdGhpcyB2ZWN0b3Igd2l0aCBkb3VibGUgcHJlY2lzaW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlVmVjdG9yMkQgaW5zdGFuY2Ugd2l0aCB0aGUgc2FtZSBjb21wb25lbnQgdmFsdWVzXG4gICAqL1xuICBjbG9uZSgpIHtcbiAgICByZXR1cm4gc3VwZXIuY2xvbmUoKSBhcyBNdXRhYmxlVmVjdG9yMkQ7XG4gIH1cbn1cblxuLyoqXG4gKiBBbGlhcyBmb3IgdGhlIDMyLWJpdCAoRmxvYXQzMkFycmF5KSBpbXBsZW1lbnRhdGlvbiwgbWFraW5nIHRoZSBwcmVjaXNpb24gZXhwbGljaXQuXG4gKi9cbmV4cG9ydCB7IE11dGFibGVWZWN0b3IyIGFzIE11dGFibGVWZWN0b3IyRiB9O1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsY0FBYztBQUV2QixTQUFTLGdCQUFnQjtBQVNsQixJQUFNLGtCQUFOLGNBQW9FLFNBQVk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FB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
