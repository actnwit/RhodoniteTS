// src/foundation/math/MutableVector3.ts
import { Logger } from "../misc/Logger.js";
import { Vector3_ } from "./Vector3.js";
var MutableVector3_ = class extends Vector3_ {
  /**
   * Creates a new MutableVector3_ instance.
   *
   * @param v - The typed array containing the vector components
   * @param options - Configuration object containing the array type
   */
  constructor(v, { type }) {
    super(v, { type });
  }
  /**
   * Sets the x component of the vector.
   *
   * @param x - The new x value
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
   * @param y - The new y value
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
   * Sets the z component of the vector.
   *
   * @param z - The new z value
   */
  set z(z) {
    this._v[2] = z;
  }
  /**
   * Gets the z component of the vector.
   *
   * @returns The z component value
   */
  get z() {
    return this._v[2];
  }
  /**
   * Gets the w component (always 1 for 3D vectors).
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
   * @param i - The index (0 for x, 1 for y, 2 for z)
   * @param value - The new value to set
   * @returns This vector instance for method chaining
   */
  setAt(i, value) {
    this._v[i] = value;
    return this;
  }
  /**
   * Sets all three components of the vector.
   *
   * @param x - The x component value
   * @param y - The y component value
   * @param z - The z component value
   * @returns This vector instance for method chaining
   */
  setComponents(x, y, z) {
    this._v[0] = x;
    this._v[1] = y;
    this._v[2] = z;
    return this;
  }
  /**
   * Copies the components from another vector.
   *
   * @param vec - The vector to copy from
   * @returns This vector instance for method chaining
   */
  copyComponents(vec) {
    return this.setComponents(vec._v[0], vec._v[1], vec._v[2]);
  }
  /**
   * Sets all components to zero.
   *
   * @returns This vector instance for method chaining
   */
  zero() {
    return this.setComponents(0, 0, 0);
  }
  /**
   * Sets all components to one.
   *
   * @returns This vector instance for method chaining
   */
  one() {
    return this.setComponents(1, 1, 1);
  }
  /**
   * Normalizes this vector to unit length.
   * Modifies the vector in place to have a magnitude of 1.
   * A zero-length vector stays a zero vector (an error is logged) instead of
   * becoming `Infinity`/`NaN`.
   *
   * @returns This vector instance for method chaining
   */
  normalize() {
    const length = this.length();
    this.divide(length);
    return this;
  }
  /**
   * Adds another vector to this vector.
   * Performs component-wise addition and modifies this vector in place.
   *
   * @param vec - The vector to add
   * @returns This vector instance for method chaining
   */
  add(vec) {
    this._v[0] += vec._v[0];
    this._v[1] += vec._v[1];
    this._v[2] += vec._v[2];
    return this;
  }
  /**
   * Subtracts another vector from this vector.
   * Performs component-wise subtraction and modifies this vector in place.
   *
   * @param vec - The vector to subtract
   * @returns This vector instance for method chaining
   */
  subtract(vec) {
    this._v[0] -= vec._v[0];
    this._v[1] -= vec._v[1];
    this._v[2] -= vec._v[2];
    return this;
  }
  /**
   * Multiplies this vector by a scalar value.
   * Scales all components by the given value and modifies this vector in place.
   *
   * @param value - The scalar value to multiply by
   * @returns This vector instance for method chaining
   */
  multiply(value) {
    this._v[0] *= value;
    this._v[1] *= value;
    this._v[2] *= value;
    return this;
  }
  /**
   * Multiplies this vector by another vector component-wise.
   * Performs element-wise multiplication and modifies this vector in place.
   *
   * @param vec - The vector to multiply by
   * @returns This vector instance for method chaining
   */
  multiplyVector(vec) {
    this._v[0] *= vec._v[0];
    this._v[1] *= vec._v[1];
    this._v[2] *= vec._v[2];
    return this;
  }
  /**
   * Divides this vector by a scalar value.
   * Scales all components by 1/value and modifies this vector in place.
   * If value is 0, sets all components to 0 and logs an error.
   *
   * @param value - The scalar value to divide by
   * @returns This vector instance for method chaining
   */
  divide(value) {
    if (value !== 0) {
      this._v[0] /= value;
      this._v[1] /= value;
      this._v[2] /= value;
    } else {
      Logger.default.error("0 division occurred! The result is set to zero.");
      this._v[0] = 0;
      this._v[1] = 0;
      this._v[2] = 0;
    }
    return this;
  }
  /**
   * Divides this vector by another vector component-wise.
   * Performs element-wise division and modifies this vector in place.
   * If any component of the divisor vector is 0, sets the corresponding component to 0.
   *
   * @param vec - The vector to divide by
   * @returns This vector instance for method chaining
   */
  divideVector(vec) {
    if (vec._v[0] !== 0 && vec._v[1] !== 0 && vec._v[2] !== 0) {
      this._v[0] /= vec._v[0];
      this._v[1] /= vec._v[1];
      this._v[2] /= vec._v[2];
    } else {
      Logger.default.error("0 division occurred! The result is set to zero.");
      this._v[0] = vec._v[0] === 0 ? 0 : this._v[0] / vec._v[0];
      this._v[1] = vec._v[1] === 0 ? 0 : this._v[1] / vec._v[1];
      this._v[2] = vec._v[2] === 0 ? 0 : this._v[2] / vec._v[2];
    }
    return this;
  }
  /**
   * Computes the cross product of this vector with another vector.
   * Calculates the cross product and modifies this vector in place to store the result.
   * The cross product produces a vector perpendicular to both input vectors.
   *
   * @param vec - The vector to compute cross product with
   * @returns This vector instance for method chaining
   */
  cross(vec) {
    const x = this._v[1] * vec._v[2] - this._v[2] * vec._v[1];
    const y = this._v[2] * vec._v[0] - this._v[0] * vec._v[2];
    const z = this._v[0] * vec._v[1] - this._v[1] * vec._v[0];
    return this.setComponents(x, y, z);
  }
  /**
   * Applies a quaternion rotation to this vector.
   * Rotates this vector by the given quaternion and modifies it in place.
   * Equivalent to: quat * vector3 * quat^(-1)
   *
   * @param quat - The quaternion representing the rotation
   * @returns This vector instance for method chaining
   */
  multiplyQuaternion(quat) {
    const num = quat._v[0] * 2;
    const num2 = quat._v[1] * 2;
    const num3 = quat._v[2] * 2;
    const num4 = quat._v[0] * num;
    const num5 = quat._v[1] * num2;
    const num6 = quat._v[2] * num3;
    const num7 = quat._v[0] * num2;
    const num8 = quat._v[0] * num3;
    const num9 = quat._v[1] * num3;
    const num10 = quat._v[3] * num;
    const num11 = quat._v[3] * num2;
    const num12 = quat._v[3] * num3;
    const x = (1 - (num5 + num6)) * this._v[0] + (num7 - num12) * this._v[1] + (num8 + num11) * this._v[2];
    const y = (num7 + num12) * this._v[0] + (1 - (num4 + num6)) * this._v[1] + (num9 - num10) * this._v[2];
    const z = (num8 - num11) * this._v[0] + (num9 + num10) * this._v[1] + (1 - (num4 + num5)) * this._v[2];
    return this.setComponents(x, y, z);
  }
  /**
   * Gets the number of bytes per component in the underlying typed array.
   *
   * @returns The number of bytes per element (4 for Float32Array, 8 for Float64Array)
   */
  get bytesPerComponent() {
    return this._v.BYTES_PER_ELEMENT;
  }
  /**
   * Creates a new vector from three component values.
   *
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   * @param type - The typed array constructor
   * @returns A new vector instance
   * @protected
   */
  static _fromCopy3(x, y, z, type) {
    return new this(new type([x, y, z]), { type });
  }
};
var MutableVector3 = class _MutableVector3 extends MutableVector3_ {
  /**
   * Creates a new MutableVector3 instance.
   *
   * @param v - The typed array containing the vector components
   */
  constructor(v) {
    super(v, { type: Float32Array });
  }
  /**
   * Creates a zero vector (0, 0, 0).
   *
   * @returns A new zero vector
   */
  static zero() {
    return super._zero(Float32Array);
  }
  /**
   * Creates a unit vector (1, 1, 1).
   *
   * @returns A new unit vector
   */
  static one() {
    return super._one(Float32Array);
  }
  /**
   * Creates a dummy vector for initialization purposes.
   *
   * @returns A new dummy vector
   */
  static dummy() {
    return super._dummy(Float32Array);
  }
  /**
   * Creates a normalized copy of the given vector.
   *
   * @param vec - The vector to normalize
   * @returns A new normalized vector
   */
  static normalize(vec) {
    return super._normalize(vec, Float32Array);
  }
  /**
   * Creates a new vector that is the sum of two vectors.
   *
   * @param l_vec - The left vector
   * @param r_vec - The right vector
   * @returns A new vector containing the sum
   */
  static add(l_vec, r_vec) {
    return super._add(l_vec, r_vec, Float32Array);
  }
  /**
   * Creates a new vector that is the difference of two vectors.
   *
   * @param l_vec - The left vector (minuend)
   * @param r_vec - The right vector (subtrahend)
   * @returns A new vector containing the difference
   */
  static subtract(l_vec, r_vec) {
    return super._subtract(l_vec, r_vec, Float32Array);
  }
  /**
   * Creates a new vector that is the scalar multiplication of a vector.
   *
   * @param vec - The vector to multiply
   * @param value - The scalar value
   * @returns A new scaled vector
   */
  static multiply(vec, value) {
    return super._multiply(vec, value, Float32Array);
  }
  /**
   * Creates a new vector that is the component-wise multiplication of two vectors.
   *
   * @param l_vec - The left vector
   * @param r_vec - The right vector
   * @returns A new vector containing the component-wise product
   */
  static multiplyVector(l_vec, r_vec) {
    return super._multiplyVector(l_vec, r_vec, Float32Array);
  }
  /**
   * Creates a new vector that is the scalar division of a vector.
   *
   * @param vec - The vector to divide
   * @param value - The scalar divisor
   * @returns A new divided vector
   */
  static divide(vec, value) {
    return super._divide(vec, value, Float32Array);
  }
  /**
   * Creates a new vector that is the component-wise division of two vectors.
   *
   * @param l_vec - The dividend vector
   * @param r_vec - The divisor vector
   * @returns A new vector containing the component-wise quotient
   */
  static divideVector(l_vec, r_vec) {
    return super._divideVector(l_vec, r_vec, Float32Array);
  }
  /**
   * Creates a new vector that is the cross product of two vectors.
   *
   * @param l_vec - The left vector
   * @param r_vec - The right vector
   * @returns A new vector containing the cross product
   */
  static cross(l_vec, r_vec) {
    return super._cross(l_vec, r_vec, Float32Array);
  }
  /**
   * Creates a new vector by applying a quaternion rotation to a vector.
   *
   * @param quat - The quaternion representing the rotation
   * @param vec - The vector to rotate
   * @returns A new rotated vector
   */
  static multiplyQuaternion(quat, vec) {
    return super._multiplyQuaternion(quat, vec, Float32Array);
  }
  /**
   * Gets the class name for debugging purposes.
   *
   * @returns The class name string
   */
  get className() {
    return "MutableVector3";
  }
  /**
   * Creates a vector from three component values.
   *
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   * @returns A new vector instance
   */
  static fromCopy3(x, y, z) {
    return super._fromCopy3(x, y, z, Float32Array);
  }
  /**
   * Creates a vector with all components set to the same value.
   *
   * @param val - The value for all components
   * @returns A new vector instance
   */
  static fromCopy1(val) {
    return super._fromCopy3(val, val, val, Float32Array);
  }
  /**
   * Creates a vector from a 3-element array.
   *
   * @param array - The array containing x, y, z values
   * @returns A new vector instance
   */
  static fromCopyArray3(array) {
    return new _MutableVector3(new Float32Array(array));
  }
  /**
   * Creates a vector from an array, taking the first 3 elements.
   *
   * @param array - The array containing at least 3 values
   * @returns A new vector instance
   */
  static fromCopyArray(array) {
    return new _MutableVector3(new Float32Array(array.slice(0, 3)));
  }
  /**
   * Creates a vector from an existing Float32Array (shares the same buffer).
   *
   * @param float32Array - The Float32Array to use
   * @returns A new vector instance
   */
  static fromFloat32Array(float32Array) {
    return new _MutableVector3(float32Array);
  }
  /**
   * Creates a vector by copying from an existing Float32Array.
   *
   * @param float32Array - The Float32Array to copy from
   * @returns A new vector instance with copied data
   */
  static fromCopyFloat32Array(float32Array) {
    return new _MutableVector3(new Float32Array(float32Array.buffer.slice(0)));
  }
  /**
   * Creates a vector by copying from another 3D vector.
   *
   * @param vec - The vector to copy from
   * @returns A new vector instance
   */
  static fromCopyVector3(vec) {
    return super._fromCopyVector3(vec, Float32Array);
  }
  /**
   * Creates a 3D vector by copying from a 4D vector (ignoring w component).
   *
   * @param vec - The 4D vector to copy from
   * @returns A new 3D vector instance
   */
  static fromCopyVector4(vec) {
    return super._fromCopyVector4(vec, Float32Array);
  }
  /**
   * Creates a copy of this vector.
   *
   * @returns A new vector instance with the same values
   */
  clone() {
    return super.clone();
  }
  /**
   * Rotates a vector around the X-axis and stores the result in the output vector.
   * Only the Y and Z components are affected by X-axis rotation.
   *
   * @param vec3 - The input vector to rotate
   * @param radian - The rotation angle in radians
   * @param outVec - The output vector to store the result
   */
  static rotateX(vec3, radian, outVec) {
    const c = Math.cos(radian);
    const s = Math.sin(radian);
    outVec.y = vec3.y * c - vec3.z * s;
    outVec.z = vec3.y * s + vec3.z * c;
  }
  /**
   * Rotates a vector around the Y-axis and stores the result in the output vector.
   * Only the X and Z components are affected by Y-axis rotation.
   *
   * @param vec3 - The input vector to rotate
   * @param radian - The rotation angle in radians
   * @param outVec - The output vector to store the result
   */
  static rotateY(vec3, radian, outVec) {
    const c = Math.cos(radian);
    const s = Math.sin(radian);
    outVec.x = vec3.x * c + vec3.z * s;
    outVec.z = -vec3.x * s + vec3.z * c;
  }
  /**
   * Rotates a vector around the Z-axis and stores the result in the output vector.
   * Only the X and Y components are affected by Z-axis rotation.
   *
   * @param vec3 - The input vector to rotate
   * @param radian - The rotation angle in radians
   * @param outVec - The output vector to store the result
   */
  static rotateZ(vec3, radian, outVec) {
    const c = Math.cos(radian);
    const s = Math.sin(radian);
    outVec.x = vec3.x * c - vec3.y * s;
    outVec.y = vec3.x * s + vec3.y * c;
  }
};
var MutableVector3D = class _MutableVector3D extends MutableVector3_ {
  /**
   * Creates a new MutableVector3D instance.
   *
   * @param x - The typed array containing the vector components
   */
  constructor(x) {
    super(x, { type: Float64Array });
  }
  /**
   * Creates a zero vector (0, 0, 0) with double precision.
   *
   * @returns A new zero vector
   */
  static zero() {
    return super._zero(Float64Array);
  }
  /**
   * Creates a unit vector (1, 1, 1) with double precision.
   *
   * @returns A new unit vector
   */
  static one() {
    return super._one(Float64Array);
  }
  /**
   * Creates a dummy vector for initialization purposes with double precision.
   *
   * @returns A new dummy vector
   */
  static dummy() {
    return super._dummy(Float64Array);
  }
  /**
   * Creates a normalized copy of the given vector with double precision.
   *
   * @param vec - The vector to normalize
   * @returns A new normalized vector
   */
  static normalize(vec) {
    return super._normalize(vec, Float64Array);
  }
  /**
   * Creates a new vector that is the sum of two vectors with double precision.
   *
   * @param l_vec - The left vector
   * @param r_vec - The right vector
   * @returns A new vector containing the sum
   */
  static add(l_vec, r_vec) {
    return super._add(l_vec, r_vec, Float64Array);
  }
  /**
   * Creates a new vector that is the difference of two vectors with double precision.
   *
   * @param l_vec - The left vector (minuend)
   * @param r_vec - The right vector (subtrahend)
   * @returns A new vector containing the difference
   */
  static subtract(l_vec, r_vec) {
    return super._subtract(l_vec, r_vec, Float64Array);
  }
  /**
   * Creates a new vector that is the scalar multiplication of a vector with double precision.
   *
   * @param vec - The vector to multiply
   * @param value - The scalar value
   * @returns A new scaled vector
   */
  static multiply(vec, value) {
    return super._multiply(vec, value, Float64Array);
  }
  /**
   * Creates a new vector that is the component-wise multiplication of two vectors with double precision.
   *
   * @param l_vec - The left vector
   * @param r_vec - The right vector
   * @returns A new vector containing the component-wise product
   */
  static multiplyVector(l_vec, r_vec) {
    return super._multiplyVector(l_vec, r_vec, Float64Array);
  }
  /**
   * Creates a new vector that is the scalar division of a vector with double precision.
   *
   * @param vec - The vector to divide
   * @param value - The scalar divisor
   * @returns A new divided vector
   */
  static divide(vec, value) {
    return super._divide(vec, value, Float64Array);
  }
  /**
   * Creates a new vector that is the component-wise division of two vectors with double precision.
   *
   * @param l_vec - The dividend vector
   * @param r_vec - The divisor vector
   * @returns A new vector containing the component-wise quotient
   */
  static divideVector(l_vec, r_vec) {
    return super._divideVector(l_vec, r_vec, Float64Array);
  }
  /**
   * Creates a new vector that is the cross product of two vectors with double precision.
   *
   * @param l_vec - The left vector
   * @param r_vec - The right vector
   * @returns A new vector containing the cross product
   */
  static cross(l_vec, r_vec) {
    return super._cross(l_vec, r_vec, Float64Array);
  }
  /**
   * Creates a new vector by applying a quaternion rotation to a vector with double precision.
   *
   * @param quat - The quaternion representing the rotation
   * @param vec - The vector to rotate
   * @returns A new rotated vector
   */
  static multiplyQuaternion(quat, vec) {
    return super._multiplyQuaternion(quat, vec, Float64Array);
  }
  /**
   * Creates a vector from three component values with double precision.
   *
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   * @returns A new vector instance
   */
  static fromCopy3(x, y, z) {
    return super._fromCopy3(x, y, z, Float64Array);
  }
  /**
   * Creates a vector with all components set to the same value with double precision.
   *
   * @param val - The value for all components
   * @returns A new vector instance
   */
  static fromCopy1(val) {
    return super._fromCopy3(val, val, val, Float64Array);
  }
  /**
   * Creates a vector from a 3-element array with double precision.
   *
   * @param array - The array containing x, y, z values
   * @returns A new vector instance
   */
  static fromCopyArray3(array) {
    return new _MutableVector3D(new Float64Array(array));
  }
  /**
   * Creates a vector from an array, taking the first 3 elements with double precision.
   *
   * @param array - The array containing at least 3 values
   * @returns A new vector instance
   */
  static fromCopyArray(array) {
    return new _MutableVector3D(new Float64Array(array.slice(0, 3)));
  }
  /**
   * Rotates a vector around the X-axis and stores the result in the output vector with double precision.
   * Only the Y and Z components are affected by X-axis rotation.
   *
   * @param vec3 - The input vector to rotate
   * @param radian - The rotation angle in radians
   * @param outVec - The output vector to store the result
   */
  static rotateX(vec3, radian, outVec) {
    const c = Math.cos(radian);
    const s = Math.sin(radian);
    outVec.y = vec3.y * c - vec3.z * s;
    outVec.z = vec3.y * s + vec3.z * c;
  }
  /**
   * Rotates a vector around the Y-axis and stores the result in the output vector with double precision.
   * Only the X and Z components are affected by Y-axis rotation.
   *
   * @param vec3 - The input vector to rotate
   * @param radian - The rotation angle in radians
   * @param outVec - The output vector to store the result
   */
  static rotateY(vec3, radian, outVec) {
    const c = Math.cos(radian);
    const s = Math.sin(radian);
    outVec.x = vec3.x * c + vec3.z * s;
    outVec.z = -vec3.x * s + vec3.z * c;
  }
  /**
   * Rotates a vector around the Z-axis and stores the result in the output vector with double precision.
   * Only the X and Y components are affected by Z-axis rotation.
   *
   * @param vec3 - The input vector to rotate
   * @param radian - The rotation angle in radians
   * @param outVec - The output vector to store the result
   */
  static rotateZ(vec3, radian, outVec) {
    const c = Math.cos(radian);
    const s = Math.sin(radian);
    outVec.x = vec3.x * c - vec3.y * s;
    outVec.y = vec3.x * s + vec3.y * c;
  }
  /**
   * Creates a copy of this vector with double precision.
   *
   * @returns A new vector instance with the same values
   */
  clone() {
    return super.clone();
  }
};
export {
  MutableVector3,
  MutableVector3D,
  MutableVector3 as MutableVector3F,
  MutableVector3_
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9NdXRhYmxlVmVjdG9yMy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBBcnJheTMsIEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yLCBUeXBlZEFycmF5IH0gZnJvbSAnLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHR5cGUgeyBJUXVhdGVybmlvbiB9IGZyb20gJy4vSVF1YXRlcm5pb24nO1xuaW1wb3J0IHR5cGUgeyBJTXV0YWJsZVZlY3RvciwgSU11dGFibGVWZWN0b3IzLCBJVmVjdG9yMywgSVZlY3RvcjQgfSBmcm9tICcuL0lWZWN0b3InO1xuaW1wb3J0IHsgVmVjdG9yM18gfSBmcm9tICcuL1ZlY3RvcjMnO1xuXG4vKipcbiAqIEFic3RyYWN0IGJhc2UgY2xhc3MgZm9yIG11dGFibGUgM0QgdmVjdG9ycyB3aXRoIGdlbmVyaWMgdHlwZWQgYXJyYXkgc3VwcG9ydC5cbiAqIEV4dGVuZHMgdGhlIGltbXV0YWJsZSBWZWN0b3IzXyBjbGFzcyB0byBwcm92aWRlIG11dGFibGUgb3BlcmF0aW9ucy5cbiAqXG4gKiBAdGVtcGxhdGUgVCAtIFRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvciB0eXBlIChGbG9hdDMyQXJyYXkgb3IgRmxvYXQ2NEFycmF5KVxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBjbGFzcyBNdXRhYmxlVmVjdG9yM188VCBleHRlbmRzIEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yPlxuICBleHRlbmRzIFZlY3RvcjNfPFQ+XG4gIGltcGxlbWVudHMgSU11dGFibGVWZWN0b3IsIElNdXRhYmxlVmVjdG9yM1xue1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNdXRhYmxlVmVjdG9yM18gaW5zdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSB2IC0gVGhlIHR5cGVkIGFycmF5IGNvbnRhaW5pbmcgdGhlIHZlY3RvciBjb21wb25lbnRzXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gQ29uZmlndXJhdGlvbiBvYmplY3QgY29udGFpbmluZyB0aGUgYXJyYXkgdHlwZVxuICAgKi9cbiAgY29uc3RydWN0b3IodjogVHlwZWRBcnJheSwgeyB0eXBlIH06IHsgdHlwZTogVCB9KSB7XG4gICAgc3VwZXIodiwgeyB0eXBlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHggY29tcG9uZW50IG9mIHRoZSB2ZWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB4IC0gVGhlIG5ldyB4IHZhbHVlXG4gICAqL1xuICBzZXQgeCh4OiBudW1iZXIpIHtcbiAgICB0aGlzLl92WzBdID0geDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB4IGNvbXBvbmVudCBvZiB0aGUgdmVjdG9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgeCBjb21wb25lbnQgdmFsdWVcbiAgICovXG4gIGdldCB4KCkge1xuICAgIHJldHVybiB0aGlzLl92WzBdO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHkgY29tcG9uZW50IG9mIHRoZSB2ZWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB5IC0gVGhlIG5ldyB5IHZhbHVlXG4gICAqL1xuICBzZXQgeSh5OiBudW1iZXIpIHtcbiAgICB0aGlzLl92WzFdID0geTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB5IGNvbXBvbmVudCBvZiB0aGUgdmVjdG9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgeSBjb21wb25lbnQgdmFsdWVcbiAgICovXG4gIGdldCB5KCkge1xuICAgIHJldHVybiB0aGlzLl92WzFdO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHogY29tcG9uZW50IG9mIHRoZSB2ZWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB6IC0gVGhlIG5ldyB6IHZhbHVlXG4gICAqL1xuICBzZXQgeih6OiBudW1iZXIpIHtcbiAgICB0aGlzLl92WzJdID0gejtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB6IGNvbXBvbmVudCBvZiB0aGUgdmVjdG9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgeiBjb21wb25lbnQgdmFsdWVcbiAgICovXG4gIGdldCB6KCkge1xuICAgIHJldHVybiB0aGlzLl92WzJdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHcgY29tcG9uZW50IChhbHdheXMgMSBmb3IgM0QgdmVjdG9ycykuXG4gICAqXG4gICAqIEByZXR1cm5zIEFsd2F5cyByZXR1cm5zIDFcbiAgICovXG4gIGdldCB3KCkge1xuICAgIHJldHVybiAxO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHJhdyB0eXBlZCBhcnJheSBjb250YWluaW5nIHRoZSB2ZWN0b3IgY29tcG9uZW50cy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHVuZGVybHlpbmcgdHlwZWQgYXJyYXlcbiAgICovXG4gIHJhdygpIHtcbiAgICByZXR1cm4gdGhpcy5fdjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2YWx1ZSBhdCB0aGUgc3BlY2lmaWVkIGluZGV4LlxuICAgKlxuICAgKiBAcGFyYW0gaSAtIFRoZSBpbmRleCAoMCBmb3IgeCwgMSBmb3IgeSwgMiBmb3IgeilcbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIG5ldyB2YWx1ZSB0byBzZXRcbiAgICogQHJldHVybnMgVGhpcyB2ZWN0b3IgaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgc2V0QXQoaTogbnVtYmVyLCB2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5fdltpXSA9IHZhbHVlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYWxsIHRocmVlIGNvbXBvbmVudHMgb2YgdGhlIHZlY3Rvci5cbiAgICpcbiAgICogQHBhcmFtIHggLSBUaGUgeCBjb21wb25lbnQgdmFsdWVcbiAgICogQHBhcmFtIHkgLSBUaGUgeSBjb21wb25lbnQgdmFsdWVcbiAgICogQHBhcmFtIHogLSBUaGUgeiBjb21wb25lbnQgdmFsdWVcbiAgICogQHJldHVybnMgVGhpcyB2ZWN0b3IgaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgc2V0Q29tcG9uZW50cyh4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyKSB7XG4gICAgdGhpcy5fdlswXSA9IHg7XG4gICAgdGhpcy5fdlsxXSA9IHk7XG4gICAgdGhpcy5fdlsyXSA9IHo7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ29waWVzIHRoZSBjb21wb25lbnRzIGZyb20gYW5vdGhlciB2ZWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIGNvcHkgZnJvbVxuICAgKiBAcmV0dXJucyBUaGlzIHZlY3RvciBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICBjb3B5Q29tcG9uZW50cyh2ZWM6IElWZWN0b3IzKSB7XG4gICAgcmV0dXJuIHRoaXMuc2V0Q29tcG9uZW50cyh2ZWMuX3ZbMF0sIHZlYy5fdlsxXSwgdmVjLl92WzJdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGFsbCBjb21wb25lbnRzIHRvIHplcm8uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoaXMgdmVjdG9yIGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIHplcm8oKSB7XG4gICAgcmV0dXJuIHRoaXMuc2V0Q29tcG9uZW50cygwLCAwLCAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGFsbCBjb21wb25lbnRzIHRvIG9uZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhpcyB2ZWN0b3IgaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgb25lKCkge1xuICAgIHJldHVybiB0aGlzLnNldENvbXBvbmVudHMoMSwgMSwgMSk7XG4gIH1cblxuICAvKipcbiAgICogTm9ybWFsaXplcyB0aGlzIHZlY3RvciB0byB1bml0IGxlbmd0aC5cbiAgICogTW9kaWZpZXMgdGhlIHZlY3RvciBpbiBwbGFjZSB0byBoYXZlIGEgbWFnbml0dWRlIG9mIDEuXG4gICAqIEEgemVyby1sZW5ndGggdmVjdG9yIHN0YXlzIGEgemVybyB2ZWN0b3IgKGFuIGVycm9yIGlzIGxvZ2dlZCkgaW5zdGVhZCBvZlxuICAgKiBiZWNvbWluZyBgSW5maW5pdHlgL2BOYU5gLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGlzIHZlY3RvciBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICBub3JtYWxpemUoKSB7XG4gICAgY29uc3QgbGVuZ3RoID0gdGhpcy5sZW5ndGgoKTtcbiAgICB0aGlzLmRpdmlkZShsZW5ndGgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYW5vdGhlciB2ZWN0b3IgdG8gdGhpcyB2ZWN0b3IuXG4gICAqIFBlcmZvcm1zIGNvbXBvbmVudC13aXNlIGFkZGl0aW9uIGFuZCBtb2RpZmllcyB0aGlzIHZlY3RvciBpbiBwbGFjZS5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gYWRkXG4gICAqIEByZXR1cm5zIFRoaXMgdmVjdG9yIGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIGFkZCh2ZWM6IElWZWN0b3IzKSB7XG4gICAgdGhpcy5fdlswXSArPSB2ZWMuX3ZbMF07XG4gICAgdGhpcy5fdlsxXSArPSB2ZWMuX3ZbMV07XG4gICAgdGhpcy5fdlsyXSArPSB2ZWMuX3ZbMl07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU3VidHJhY3RzIGFub3RoZXIgdmVjdG9yIGZyb20gdGhpcyB2ZWN0b3IuXG4gICAqIFBlcmZvcm1zIGNvbXBvbmVudC13aXNlIHN1YnRyYWN0aW9uIGFuZCBtb2RpZmllcyB0aGlzIHZlY3RvciBpbiBwbGFjZS5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gc3VidHJhY3RcbiAgICogQHJldHVybnMgVGhpcyB2ZWN0b3IgaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgc3VidHJhY3QodmVjOiBJVmVjdG9yMykge1xuICAgIHRoaXMuX3ZbMF0gLT0gdmVjLl92WzBdO1xuICAgIHRoaXMuX3ZbMV0gLT0gdmVjLl92WzFdO1xuICAgIHRoaXMuX3ZbMl0gLT0gdmVjLl92WzJdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgdGhpcyB2ZWN0b3IgYnkgYSBzY2FsYXIgdmFsdWUuXG4gICAqIFNjYWxlcyBhbGwgY29tcG9uZW50cyBieSB0aGUgZ2l2ZW4gdmFsdWUgYW5kIG1vZGlmaWVzIHRoaXMgdmVjdG9yIGluIHBsYWNlLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIG11bHRpcGx5IGJ5XG4gICAqIEByZXR1cm5zIFRoaXMgdmVjdG9yIGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIG11bHRpcGx5KHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl92WzBdICo9IHZhbHVlO1xuICAgIHRoaXMuX3ZbMV0gKj0gdmFsdWU7XG4gICAgdGhpcy5fdlsyXSAqPSB2YWx1ZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIHRoaXMgdmVjdG9yIGJ5IGFub3RoZXIgdmVjdG9yIGNvbXBvbmVudC13aXNlLlxuICAgKiBQZXJmb3JtcyBlbGVtZW50LXdpc2UgbXVsdGlwbGljYXRpb24gYW5kIG1vZGlmaWVzIHRoaXMgdmVjdG9yIGluIHBsYWNlLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBtdWx0aXBseSBieVxuICAgKiBAcmV0dXJucyBUaGlzIHZlY3RvciBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICBtdWx0aXBseVZlY3Rvcih2ZWM6IElWZWN0b3IzKSB7XG4gICAgdGhpcy5fdlswXSAqPSB2ZWMuX3ZbMF07XG4gICAgdGhpcy5fdlsxXSAqPSB2ZWMuX3ZbMV07XG4gICAgdGhpcy5fdlsyXSAqPSB2ZWMuX3ZbMl07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogRGl2aWRlcyB0aGlzIHZlY3RvciBieSBhIHNjYWxhciB2YWx1ZS5cbiAgICogU2NhbGVzIGFsbCBjb21wb25lbnRzIGJ5IDEvdmFsdWUgYW5kIG1vZGlmaWVzIHRoaXMgdmVjdG9yIGluIHBsYWNlLlxuICAgKiBJZiB2YWx1ZSBpcyAwLCBzZXRzIGFsbCBjb21wb25lbnRzIHRvIDAgYW5kIGxvZ3MgYW4gZXJyb3IuXG4gICAqXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBzY2FsYXIgdmFsdWUgdG8gZGl2aWRlIGJ5XG4gICAqIEByZXR1cm5zIFRoaXMgdmVjdG9yIGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIGRpdmlkZSh2YWx1ZTogbnVtYmVyKSB7XG4gICAgaWYgKHZhbHVlICE9PSAwKSB7XG4gICAgICB0aGlzLl92WzBdIC89IHZhbHVlO1xuICAgICAgdGhpcy5fdlsxXSAvPSB2YWx1ZTtcbiAgICAgIHRoaXMuX3ZbMl0gLz0gdmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCcwIGRpdmlzaW9uIG9jY3VycmVkISBUaGUgcmVzdWx0IGlzIHNldCB0byB6ZXJvLicpO1xuICAgICAgdGhpcy5fdlswXSA9IDA7XG4gICAgICB0aGlzLl92WzFdID0gMDtcbiAgICAgIHRoaXMuX3ZbMl0gPSAwO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIERpdmlkZXMgdGhpcyB2ZWN0b3IgYnkgYW5vdGhlciB2ZWN0b3IgY29tcG9uZW50LXdpc2UuXG4gICAqIFBlcmZvcm1zIGVsZW1lbnQtd2lzZSBkaXZpc2lvbiBhbmQgbW9kaWZpZXMgdGhpcyB2ZWN0b3IgaW4gcGxhY2UuXG4gICAqIElmIGFueSBjb21wb25lbnQgb2YgdGhlIGRpdmlzb3IgdmVjdG9yIGlzIDAsIHNldHMgdGhlIGNvcnJlc3BvbmRpbmcgY29tcG9uZW50IHRvIDAuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIGRpdmlkZSBieVxuICAgKiBAcmV0dXJucyBUaGlzIHZlY3RvciBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICBkaXZpZGVWZWN0b3IodmVjOiBJVmVjdG9yMykge1xuICAgIGlmICh2ZWMuX3ZbMF0gIT09IDAgJiYgdmVjLl92WzFdICE9PSAwICYmIHZlYy5fdlsyXSAhPT0gMCkge1xuICAgICAgdGhpcy5fdlswXSAvPSB2ZWMuX3ZbMF07XG4gICAgICB0aGlzLl92WzFdIC89IHZlYy5fdlsxXTtcbiAgICAgIHRoaXMuX3ZbMl0gLz0gdmVjLl92WzJdO1xuICAgIH0gZWxzZSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcignMCBkaXZpc2lvbiBvY2N1cnJlZCEgVGhlIHJlc3VsdCBpcyBzZXQgdG8gemVyby4nKTtcbiAgICAgIHRoaXMuX3ZbMF0gPSB2ZWMuX3ZbMF0gPT09IDAgPyAwIDogdGhpcy5fdlswXSAvIHZlYy5fdlswXTtcbiAgICAgIHRoaXMuX3ZbMV0gPSB2ZWMuX3ZbMV0gPT09IDAgPyAwIDogdGhpcy5fdlsxXSAvIHZlYy5fdlsxXTtcbiAgICAgIHRoaXMuX3ZbMl0gPSB2ZWMuX3ZbMl0gPT09IDAgPyAwIDogdGhpcy5fdlsyXSAvIHZlYy5fdlsyXTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ29tcHV0ZXMgdGhlIGNyb3NzIHByb2R1Y3Qgb2YgdGhpcyB2ZWN0b3Igd2l0aCBhbm90aGVyIHZlY3Rvci5cbiAgICogQ2FsY3VsYXRlcyB0aGUgY3Jvc3MgcHJvZHVjdCBhbmQgbW9kaWZpZXMgdGhpcyB2ZWN0b3IgaW4gcGxhY2UgdG8gc3RvcmUgdGhlIHJlc3VsdC5cbiAgICogVGhlIGNyb3NzIHByb2R1Y3QgcHJvZHVjZXMgYSB2ZWN0b3IgcGVycGVuZGljdWxhciB0byBib3RoIGlucHV0IHZlY3RvcnMuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIGNvbXB1dGUgY3Jvc3MgcHJvZHVjdCB3aXRoXG4gICAqIEByZXR1cm5zIFRoaXMgdmVjdG9yIGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIGNyb3NzKHZlYzogSVZlY3RvcjMpIHtcbiAgICBjb25zdCB4ID0gdGhpcy5fdlsxXSAqIHZlYy5fdlsyXSAtIHRoaXMuX3ZbMl0gKiB2ZWMuX3ZbMV07XG4gICAgY29uc3QgeSA9IHRoaXMuX3ZbMl0gKiB2ZWMuX3ZbMF0gLSB0aGlzLl92WzBdICogdmVjLl92WzJdO1xuICAgIGNvbnN0IHogPSB0aGlzLl92WzBdICogdmVjLl92WzFdIC0gdGhpcy5fdlsxXSAqIHZlYy5fdlswXTtcblxuICAgIHJldHVybiB0aGlzLnNldENvbXBvbmVudHMoeCwgeSwgeik7XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyBhIHF1YXRlcm5pb24gcm90YXRpb24gdG8gdGhpcyB2ZWN0b3IuXG4gICAqIFJvdGF0ZXMgdGhpcyB2ZWN0b3IgYnkgdGhlIGdpdmVuIHF1YXRlcm5pb24gYW5kIG1vZGlmaWVzIGl0IGluIHBsYWNlLlxuICAgKiBFcXVpdmFsZW50IHRvOiBxdWF0ICogdmVjdG9yMyAqIHF1YXReKC0xKVxuICAgKlxuICAgKiBAcGFyYW0gcXVhdCAtIFRoZSBxdWF0ZXJuaW9uIHJlcHJlc2VudGluZyB0aGUgcm90YXRpb25cbiAgICogQHJldHVybnMgVGhpcyB2ZWN0b3IgaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgbXVsdGlwbHlRdWF0ZXJuaW9uKHF1YXQ6IElRdWF0ZXJuaW9uKSB7XG4gICAgY29uc3QgbnVtID0gcXVhdC5fdlswXSAqIDI7XG4gICAgY29uc3QgbnVtMiA9IHF1YXQuX3ZbMV0gKiAyO1xuICAgIGNvbnN0IG51bTMgPSBxdWF0Ll92WzJdICogMjtcbiAgICBjb25zdCBudW00ID0gcXVhdC5fdlswXSAqIG51bTtcbiAgICBjb25zdCBudW01ID0gcXVhdC5fdlsxXSAqIG51bTI7XG4gICAgY29uc3QgbnVtNiA9IHF1YXQuX3ZbMl0gKiBudW0zO1xuICAgIGNvbnN0IG51bTcgPSBxdWF0Ll92WzBdICogbnVtMjtcbiAgICBjb25zdCBudW04ID0gcXVhdC5fdlswXSAqIG51bTM7XG4gICAgY29uc3QgbnVtOSA9IHF1YXQuX3ZbMV0gKiBudW0zO1xuICAgIGNvbnN0IG51bTEwID0gcXVhdC5fdlszXSAqIG51bTtcbiAgICBjb25zdCBudW0xMSA9IHF1YXQuX3ZbM10gKiBudW0yO1xuICAgIGNvbnN0IG51bTEyID0gcXVhdC5fdlszXSAqIG51bTM7XG5cbiAgICBjb25zdCB4ID0gKDEgLSAobnVtNSArIG51bTYpKSAqIHRoaXMuX3ZbMF0gKyAobnVtNyAtIG51bTEyKSAqIHRoaXMuX3ZbMV0gKyAobnVtOCArIG51bTExKSAqIHRoaXMuX3ZbMl07XG4gICAgY29uc3QgeSA9IChudW03ICsgbnVtMTIpICogdGhpcy5fdlswXSArICgxIC0gKG51bTQgKyBudW02KSkgKiB0aGlzLl92WzFdICsgKG51bTkgLSBudW0xMCkgKiB0aGlzLl92WzJdO1xuICAgIGNvbnN0IHogPSAobnVtOCAtIG51bTExKSAqIHRoaXMuX3ZbMF0gKyAobnVtOSArIG51bTEwKSAqIHRoaXMuX3ZbMV0gKyAoMSAtIChudW00ICsgbnVtNSkpICogdGhpcy5fdlsyXTtcblxuICAgIHJldHVybiB0aGlzLnNldENvbXBvbmVudHMoeCwgeSwgeik7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbnVtYmVyIG9mIGJ5dGVzIHBlciBjb21wb25lbnQgaW4gdGhlIHVuZGVybHlpbmcgdHlwZWQgYXJyYXkuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBudW1iZXIgb2YgYnl0ZXMgcGVyIGVsZW1lbnQgKDQgZm9yIEZsb2F0MzJBcnJheSwgOCBmb3IgRmxvYXQ2NEFycmF5KVxuICAgKi9cbiAgZ2V0IGJ5dGVzUGVyQ29tcG9uZW50KCkge1xuICAgIHJldHVybiB0aGlzLl92LkJZVEVTX1BFUl9FTEVNRU5UO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgdmVjdG9yIGZyb20gdGhyZWUgY29tcG9uZW50IHZhbHVlcy5cbiAgICpcbiAgICogQHBhcmFtIHggLSBUaGUgeCBjb21wb25lbnRcbiAgICogQHBhcmFtIHkgLSBUaGUgeSBjb21wb25lbnRcbiAgICogQHBhcmFtIHogLSBUaGUgeiBjb21wb25lbnRcbiAgICogQHBhcmFtIHR5cGUgLSBUaGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgdmVjdG9yIGluc3RhbmNlXG4gICAqIEBwcm90ZWN0ZWRcbiAgICovXG4gIHN0YXRpYyBfZnJvbUNvcHkzKHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgcmV0dXJuIG5ldyB0aGlzKG5ldyB0eXBlKFt4LCB5LCB6XSksIHsgdHlwZSB9KTtcbiAgfVxufVxuXG4vKipcbiAqIE11dGFibGUgM0QgdmVjdG9yIGNsYXNzIHdpdGggMzItYml0IGZsb2F0IHByZWNpc2lvbi5cbiAqIFByb3ZpZGVzIGluLXBsYWNlIHZlY3RvciBvcGVyYXRpb25zIGZvciBlZmZpY2llbnQgbWF0aGVtYXRpY2FsIGNvbXB1dGF0aW9ucy5cbiAqIEFsbCBvcGVyYXRpb25zIG1vZGlmeSB0aGUgdmVjdG9yIGluc3RhbmNlIGFuZCByZXR1cm4gaXQgZm9yIG1ldGhvZCBjaGFpbmluZy5cbiAqL1xuZXhwb3J0IGNsYXNzIE11dGFibGVWZWN0b3IzIGV4dGVuZHMgTXV0YWJsZVZlY3RvcjNfPEZsb2F0MzJBcnJheUNvbnN0cnVjdG9yPiB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IE11dGFibGVWZWN0b3IzIGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0gdiAtIFRoZSB0eXBlZCBhcnJheSBjb250YWluaW5nIHRoZSB2ZWN0b3IgY29tcG9uZW50c1xuICAgKi9cbiAgY29uc3RydWN0b3IodjogVHlwZWRBcnJheSkge1xuICAgIHN1cGVyKHYsIHsgdHlwZTogRmxvYXQzMkFycmF5IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB6ZXJvIHZlY3RvciAoMCwgMCwgMCkuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgbmV3IHplcm8gdmVjdG9yXG4gICAqL1xuICBzdGF0aWMgemVybygpIHtcbiAgICByZXR1cm4gc3VwZXIuX3plcm8oRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlVmVjdG9yMztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgdW5pdCB2ZWN0b3IgKDEsIDEsIDEpLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyB1bml0IHZlY3RvclxuICAgKi9cbiAgc3RhdGljIG9uZSgpIHtcbiAgICByZXR1cm4gc3VwZXIuX29uZShGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVWZWN0b3IzO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBkdW1teSB2ZWN0b3IgZm9yIGluaXRpYWxpemF0aW9uIHB1cnBvc2VzLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyBkdW1teSB2ZWN0b3JcbiAgICovXG4gIHN0YXRpYyBkdW1teSgpIHtcbiAgICByZXR1cm4gc3VwZXIuX2R1bW15KEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZVZlY3RvcjM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5vcm1hbGl6ZWQgY29weSBvZiB0aGUgZ2l2ZW4gdmVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBub3JtYWxpemVcbiAgICogQHJldHVybnMgQSBuZXcgbm9ybWFsaXplZCB2ZWN0b3JcbiAgICovXG4gIHN0YXRpYyBub3JtYWxpemUodmVjOiBJVmVjdG9yMykge1xuICAgIHJldHVybiBzdXBlci5fbm9ybWFsaXplKHZlYywgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlVmVjdG9yMztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IHZlY3RvciB0aGF0IGlzIHRoZSBzdW0gb2YgdHdvIHZlY3RvcnMuXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBsZWZ0IHZlY3RvclxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgdmVjdG9yXG4gICAqIEByZXR1cm5zIEEgbmV3IHZlY3RvciBjb250YWluaW5nIHRoZSBzdW1cbiAgICovXG4gIHN0YXRpYyBhZGQobF92ZWM6IElWZWN0b3IzLCByX3ZlYzogSVZlY3RvcjMpIHtcbiAgICByZXR1cm4gc3VwZXIuX2FkZChsX3ZlYywgcl92ZWMsIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZVZlY3RvcjM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyB2ZWN0b3IgdGhhdCBpcyB0aGUgZGlmZmVyZW5jZSBvZiB0d28gdmVjdG9ycy5cbiAgICpcbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIGxlZnQgdmVjdG9yIChtaW51ZW5kKVxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgdmVjdG9yIChzdWJ0cmFoZW5kKVxuICAgKiBAcmV0dXJucyBBIG5ldyB2ZWN0b3IgY29udGFpbmluZyB0aGUgZGlmZmVyZW5jZVxuICAgKi9cbiAgc3RhdGljIHN1YnRyYWN0KGxfdmVjOiBJVmVjdG9yMywgcl92ZWM6IElWZWN0b3IzKSB7XG4gICAgcmV0dXJuIHN1cGVyLl9zdWJ0cmFjdChsX3ZlYywgcl92ZWMsIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZVZlY3RvcjM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyB2ZWN0b3IgdGhhdCBpcyB0aGUgc2NhbGFyIG11bHRpcGxpY2F0aW9uIG9mIGEgdmVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBtdWx0aXBseVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlXG4gICAqIEByZXR1cm5zIEEgbmV3IHNjYWxlZCB2ZWN0b3JcbiAgICovXG4gIHN0YXRpYyBtdWx0aXBseSh2ZWM6IElWZWN0b3IzLCB2YWx1ZTogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHN1cGVyLl9tdWx0aXBseSh2ZWMsIHZhbHVlLCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVWZWN0b3IzO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgdmVjdG9yIHRoYXQgaXMgdGhlIGNvbXBvbmVudC13aXNlIG11bHRpcGxpY2F0aW9uIG9mIHR3byB2ZWN0b3JzLlxuICAgKlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgbGVmdCB2ZWN0b3JcbiAgICogQHBhcmFtIHJfdmVjIC0gVGhlIHJpZ2h0IHZlY3RvclxuICAgKiBAcmV0dXJucyBBIG5ldyB2ZWN0b3IgY29udGFpbmluZyB0aGUgY29tcG9uZW50LXdpc2UgcHJvZHVjdFxuICAgKi9cbiAgc3RhdGljIG11bHRpcGx5VmVjdG9yKGxfdmVjOiBJVmVjdG9yMywgcl92ZWM6IElWZWN0b3IzKSB7XG4gICAgcmV0dXJuIHN1cGVyLl9tdWx0aXBseVZlY3RvcihsX3ZlYywgcl92ZWMsIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZVZlY3RvcjM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyB2ZWN0b3IgdGhhdCBpcyB0aGUgc2NhbGFyIGRpdmlzaW9uIG9mIGEgdmVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBkaXZpZGVcbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIHNjYWxhciBkaXZpc29yXG4gICAqIEByZXR1cm5zIEEgbmV3IGRpdmlkZWQgdmVjdG9yXG4gICAqL1xuICBzdGF0aWMgZGl2aWRlKHZlYzogSVZlY3RvcjMsIHZhbHVlOiBudW1iZXIpIHtcbiAgICByZXR1cm4gc3VwZXIuX2RpdmlkZSh2ZWMsIHZhbHVlLCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVWZWN0b3IzO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgdmVjdG9yIHRoYXQgaXMgdGhlIGNvbXBvbmVudC13aXNlIGRpdmlzaW9uIG9mIHR3byB2ZWN0b3JzLlxuICAgKlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgZGl2aWRlbmQgdmVjdG9yXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSBkaXZpc29yIHZlY3RvclxuICAgKiBAcmV0dXJucyBBIG5ldyB2ZWN0b3IgY29udGFpbmluZyB0aGUgY29tcG9uZW50LXdpc2UgcXVvdGllbnRcbiAgICovXG4gIHN0YXRpYyBkaXZpZGVWZWN0b3IobF92ZWM6IElWZWN0b3IzLCByX3ZlYzogSVZlY3RvcjMpIHtcbiAgICByZXR1cm4gc3VwZXIuX2RpdmlkZVZlY3RvcihsX3ZlYywgcl92ZWMsIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZVZlY3RvcjM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyB2ZWN0b3IgdGhhdCBpcyB0aGUgY3Jvc3MgcHJvZHVjdCBvZiB0d28gdmVjdG9ycy5cbiAgICpcbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIGxlZnQgdmVjdG9yXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSByaWdodCB2ZWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgdmVjdG9yIGNvbnRhaW5pbmcgdGhlIGNyb3NzIHByb2R1Y3RcbiAgICovXG4gIHN0YXRpYyBjcm9zcyhsX3ZlYzogSVZlY3RvcjMsIHJfdmVjOiBJVmVjdG9yMykge1xuICAgIHJldHVybiBzdXBlci5fY3Jvc3MobF92ZWMsIHJfdmVjLCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVWZWN0b3IzO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgdmVjdG9yIGJ5IGFwcGx5aW5nIGEgcXVhdGVybmlvbiByb3RhdGlvbiB0byBhIHZlY3Rvci5cbiAgICpcbiAgICogQHBhcmFtIHF1YXQgLSBUaGUgcXVhdGVybmlvbiByZXByZXNlbnRpbmcgdGhlIHJvdGF0aW9uXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIHJvdGF0ZVxuICAgKiBAcmV0dXJucyBBIG5ldyByb3RhdGVkIHZlY3RvclxuICAgKi9cbiAgc3RhdGljIG11bHRpcGx5UXVhdGVybmlvbihxdWF0OiBJUXVhdGVybmlvbiwgdmVjOiBJVmVjdG9yMykge1xuICAgIHJldHVybiBzdXBlci5fbXVsdGlwbHlRdWF0ZXJuaW9uKHF1YXQsIHZlYywgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlVmVjdG9yMztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjbGFzcyBuYW1lIGZvciBkZWJ1Z2dpbmcgcHVycG9zZXMuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBjbGFzcyBuYW1lIHN0cmluZ1xuICAgKi9cbiAgZ2V0IGNsYXNzTmFtZSgpIHtcbiAgICByZXR1cm4gJ011dGFibGVWZWN0b3IzJztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgdmVjdG9yIGZyb20gdGhyZWUgY29tcG9uZW50IHZhbHVlcy5cbiAgICpcbiAgICogQHBhcmFtIHggLSBUaGUgeCBjb21wb25lbnRcbiAgICogQHBhcmFtIHkgLSBUaGUgeSBjb21wb25lbnRcbiAgICogQHBhcmFtIHogLSBUaGUgeiBjb21wb25lbnRcbiAgICogQHJldHVybnMgQSBuZXcgdmVjdG9yIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHkzKHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIpOiBNdXRhYmxlVmVjdG9yMyB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weTMoeCwgeSwgeiwgRmxvYXQzMkFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgdmVjdG9yIHdpdGggYWxsIGNvbXBvbmVudHMgc2V0IHRvIHRoZSBzYW1lIHZhbHVlLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIHZhbHVlIGZvciBhbGwgY29tcG9uZW50c1xuICAgKiBAcmV0dXJucyBBIG5ldyB2ZWN0b3IgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weTEodmFsOiBudW1iZXIpOiBNdXRhYmxlVmVjdG9yMyB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weTModmFsLCB2YWwsIHZhbCwgRmxvYXQzMkFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgdmVjdG9yIGZyb20gYSAzLWVsZW1lbnQgYXJyYXkuXG4gICAqXG4gICAqIEBwYXJhbSBhcnJheSAtIFRoZSBhcnJheSBjb250YWluaW5nIHgsIHksIHogdmFsdWVzXG4gICAqIEByZXR1cm5zIEEgbmV3IHZlY3RvciBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5QXJyYXkzKGFycmF5OiBBcnJheTM8bnVtYmVyPik6IE11dGFibGVWZWN0b3IzIHtcbiAgICByZXR1cm4gbmV3IE11dGFibGVWZWN0b3IzKG5ldyBGbG9hdDMyQXJyYXkoYXJyYXkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgdmVjdG9yIGZyb20gYW4gYXJyYXksIHRha2luZyB0aGUgZmlyc3QgMyBlbGVtZW50cy5cbiAgICpcbiAgICogQHBhcmFtIGFycmF5IC0gVGhlIGFycmF5IGNvbnRhaW5pbmcgYXQgbGVhc3QgMyB2YWx1ZXNcbiAgICogQHJldHVybnMgQSBuZXcgdmVjdG9yIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheShhcnJheTogQXJyYXk8bnVtYmVyPik6IE11dGFibGVWZWN0b3IzIHtcbiAgICByZXR1cm4gbmV3IE11dGFibGVWZWN0b3IzKG5ldyBGbG9hdDMyQXJyYXkoYXJyYXkuc2xpY2UoMCwgMykpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgdmVjdG9yIGZyb20gYW4gZXhpc3RpbmcgRmxvYXQzMkFycmF5IChzaGFyZXMgdGhlIHNhbWUgYnVmZmVyKS5cbiAgICpcbiAgICogQHBhcmFtIGZsb2F0MzJBcnJheSAtIFRoZSBGbG9hdDMyQXJyYXkgdG8gdXNlXG4gICAqIEByZXR1cm5zIEEgbmV3IHZlY3RvciBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGZyb21GbG9hdDMyQXJyYXkoZmxvYXQzMkFycmF5OiBGbG9hdDMyQXJyYXkpOiBNdXRhYmxlVmVjdG9yMyB7XG4gICAgcmV0dXJuIG5ldyBNdXRhYmxlVmVjdG9yMyhmbG9hdDMyQXJyYXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB2ZWN0b3IgYnkgY29weWluZyBmcm9tIGFuIGV4aXN0aW5nIEZsb2F0MzJBcnJheS5cbiAgICpcbiAgICogQHBhcmFtIGZsb2F0MzJBcnJheSAtIFRoZSBGbG9hdDMyQXJyYXkgdG8gY29weSBmcm9tXG4gICAqIEByZXR1cm5zIEEgbmV3IHZlY3RvciBpbnN0YW5jZSB3aXRoIGNvcGllZCBkYXRhXG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHlGbG9hdDMyQXJyYXkoZmxvYXQzMkFycmF5OiBGbG9hdDMyQXJyYXkpOiBNdXRhYmxlVmVjdG9yMyB7XG4gICAgcmV0dXJuIG5ldyBNdXRhYmxlVmVjdG9yMyhuZXcgRmxvYXQzMkFycmF5KGZsb2F0MzJBcnJheS5idWZmZXIuc2xpY2UoMCkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgdmVjdG9yIGJ5IGNvcHlpbmcgZnJvbSBhbm90aGVyIDNEIHZlY3Rvci5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gY29weSBmcm9tXG4gICAqIEByZXR1cm5zIEEgbmV3IHZlY3RvciBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5VmVjdG9yMyh2ZWM6IElWZWN0b3IzKTogTXV0YWJsZVZlY3RvcjMge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlWZWN0b3IzKHZlYywgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlVmVjdG9yMztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgM0QgdmVjdG9yIGJ5IGNvcHlpbmcgZnJvbSBhIDREIHZlY3RvciAoaWdub3JpbmcgdyBjb21wb25lbnQpLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIDREIHZlY3RvciB0byBjb3B5IGZyb21cbiAgICogQHJldHVybnMgQSBuZXcgM0QgdmVjdG9yIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHlWZWN0b3I0KHZlYzogSVZlY3RvcjQpOiBNdXRhYmxlVmVjdG9yMyB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weVZlY3RvcjQodmVjLCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVWZWN0b3IzO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBjb3B5IG9mIHRoaXMgdmVjdG9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyB2ZWN0b3IgaW5zdGFuY2Ugd2l0aCB0aGUgc2FtZSB2YWx1ZXNcbiAgICovXG4gIGNsb25lKCkge1xuICAgIHJldHVybiBzdXBlci5jbG9uZSgpIGFzIE11dGFibGVWZWN0b3IzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJvdGF0ZXMgYSB2ZWN0b3IgYXJvdW5kIHRoZSBYLWF4aXMgYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIHRoZSBvdXRwdXQgdmVjdG9yLlxuICAgKiBPbmx5IHRoZSBZIGFuZCBaIGNvbXBvbmVudHMgYXJlIGFmZmVjdGVkIGJ5IFgtYXhpcyByb3RhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHZlYzMgLSBUaGUgaW5wdXQgdmVjdG9yIHRvIHJvdGF0ZVxuICAgKiBAcGFyYW0gcmFkaWFuIC0gVGhlIHJvdGF0aW9uIGFuZ2xlIGluIHJhZGlhbnNcbiAgICogQHBhcmFtIG91dFZlYyAtIFRoZSBvdXRwdXQgdmVjdG9yIHRvIHN0b3JlIHRoZSByZXN1bHRcbiAgICovXG4gIHN0YXRpYyByb3RhdGVYKHZlYzM6IElWZWN0b3IzLCByYWRpYW46IG51bWJlciwgb3V0VmVjOiBNdXRhYmxlVmVjdG9yMykge1xuICAgIGNvbnN0IGMgPSBNYXRoLmNvcyhyYWRpYW4pO1xuICAgIGNvbnN0IHMgPSBNYXRoLnNpbihyYWRpYW4pO1xuICAgIG91dFZlYy55ID0gdmVjMy55ICogYyAtIHZlYzMueiAqIHM7XG4gICAgb3V0VmVjLnogPSB2ZWMzLnkgKiBzICsgdmVjMy56ICogYztcbiAgfVxuXG4gIC8qKlxuICAgKiBSb3RhdGVzIGEgdmVjdG9yIGFyb3VuZCB0aGUgWS1heGlzIGFuZCBzdG9yZXMgdGhlIHJlc3VsdCBpbiB0aGUgb3V0cHV0IHZlY3Rvci5cbiAgICogT25seSB0aGUgWCBhbmQgWiBjb21wb25lbnRzIGFyZSBhZmZlY3RlZCBieSBZLWF4aXMgcm90YXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMzIC0gVGhlIGlucHV0IHZlY3RvciB0byByb3RhdGVcbiAgICogQHBhcmFtIHJhZGlhbiAtIFRoZSByb3RhdGlvbiBhbmdsZSBpbiByYWRpYW5zXG4gICAqIEBwYXJhbSBvdXRWZWMgLSBUaGUgb3V0cHV0IHZlY3RvciB0byBzdG9yZSB0aGUgcmVzdWx0XG4gICAqL1xuICBzdGF0aWMgcm90YXRlWSh2ZWMzOiBJVmVjdG9yMywgcmFkaWFuOiBudW1iZXIsIG91dFZlYzogTXV0YWJsZVZlY3RvcjMpIHtcbiAgICBjb25zdCBjID0gTWF0aC5jb3MocmFkaWFuKTtcbiAgICBjb25zdCBzID0gTWF0aC5zaW4ocmFkaWFuKTtcbiAgICBvdXRWZWMueCA9IHZlYzMueCAqIGMgKyB2ZWMzLnogKiBzO1xuICAgIG91dFZlYy56ID0gLXZlYzMueCAqIHMgKyB2ZWMzLnogKiBjO1xuICB9XG5cbiAgLyoqXG4gICAqIFJvdGF0ZXMgYSB2ZWN0b3IgYXJvdW5kIHRoZSBaLWF4aXMgYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIHRoZSBvdXRwdXQgdmVjdG9yLlxuICAgKiBPbmx5IHRoZSBYIGFuZCBZIGNvbXBvbmVudHMgYXJlIGFmZmVjdGVkIGJ5IFotYXhpcyByb3RhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHZlYzMgLSBUaGUgaW5wdXQgdmVjdG9yIHRvIHJvdGF0ZVxuICAgKiBAcGFyYW0gcmFkaWFuIC0gVGhlIHJvdGF0aW9uIGFuZ2xlIGluIHJhZGlhbnNcbiAgICogQHBhcmFtIG91dFZlYyAtIFRoZSBvdXRwdXQgdmVjdG9yIHRvIHN0b3JlIHRoZSByZXN1bHRcbiAgICovXG4gIHN0YXRpYyByb3RhdGVaKHZlYzM6IElWZWN0b3IzLCByYWRpYW46IG51bWJlciwgb3V0VmVjOiBNdXRhYmxlVmVjdG9yMykge1xuICAgIGNvbnN0IGMgPSBNYXRoLmNvcyhyYWRpYW4pO1xuICAgIGNvbnN0IHMgPSBNYXRoLnNpbihyYWRpYW4pO1xuICAgIG91dFZlYy54ID0gdmVjMy54ICogYyAtIHZlYzMueSAqIHM7XG4gICAgb3V0VmVjLnkgPSB2ZWMzLnggKiBzICsgdmVjMy55ICogYztcbiAgfVxufVxuXG4vKipcbiAqIE11dGFibGUgM0QgdmVjdG9yIGNsYXNzIHdpdGggNjQtYml0IGRvdWJsZSBwcmVjaXNpb24uXG4gKiBQcm92aWRlcyBoaWdoZXIgcHJlY2lzaW9uIHZlY3RvciBvcGVyYXRpb25zIGZvciBhcHBsaWNhdGlvbnMgcmVxdWlyaW5nXG4gKiBncmVhdGVyIG51bWVyaWNhbCBhY2N1cmFjeSB0aGFuIDMyLWJpdCBmbG9hdHMuXG4gKi9cbmV4cG9ydCBjbGFzcyBNdXRhYmxlVmVjdG9yM0QgZXh0ZW5kcyBNdXRhYmxlVmVjdG9yM188RmxvYXQ2NEFycmF5Q29uc3RydWN0b3I+IHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgTXV0YWJsZVZlY3RvcjNEIGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0geCAtIFRoZSB0eXBlZCBhcnJheSBjb250YWluaW5nIHRoZSB2ZWN0b3IgY29tcG9uZW50c1xuICAgKi9cbiAgY29uc3RydWN0b3IoeDogVHlwZWRBcnJheSkge1xuICAgIHN1cGVyKHgsIHsgdHlwZTogRmxvYXQ2NEFycmF5IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB6ZXJvIHZlY3RvciAoMCwgMCwgMCkgd2l0aCBkb3VibGUgcHJlY2lzaW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyB6ZXJvIHZlY3RvclxuICAgKi9cbiAgc3RhdGljIHplcm8oKSB7XG4gICAgcmV0dXJuIHN1cGVyLl96ZXJvKEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZVZlY3RvcjNEO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB1bml0IHZlY3RvciAoMSwgMSwgMSkgd2l0aCBkb3VibGUgcHJlY2lzaW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyB1bml0IHZlY3RvclxuICAgKi9cbiAgc3RhdGljIG9uZSgpIHtcbiAgICByZXR1cm4gc3VwZXIuX29uZShGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVWZWN0b3IzRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZHVtbXkgdmVjdG9yIGZvciBpbml0aWFsaXphdGlvbiBwdXJwb3NlcyB3aXRoIGRvdWJsZSBwcmVjaXNpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgbmV3IGR1bW15IHZlY3RvclxuICAgKi9cbiAgc3RhdGljIGR1bW15KCkge1xuICAgIHJldHVybiBzdXBlci5fZHVtbXkoRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlVmVjdG9yM0Q7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5vcm1hbGl6ZWQgY29weSBvZiB0aGUgZ2l2ZW4gdmVjdG9yIHdpdGggZG91YmxlIHByZWNpc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gbm9ybWFsaXplXG4gICAqIEByZXR1cm5zIEEgbmV3IG5vcm1hbGl6ZWQgdmVjdG9yXG4gICAqL1xuICBzdGF0aWMgbm9ybWFsaXplKHZlYzogSVZlY3RvcjMpIHtcbiAgICByZXR1cm4gc3VwZXIuX25vcm1hbGl6ZSh2ZWMsIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZVZlY3RvcjNEO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgdmVjdG9yIHRoYXQgaXMgdGhlIHN1bSBvZiB0d28gdmVjdG9ycyB3aXRoIGRvdWJsZSBwcmVjaXNpb24uXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBsZWZ0IHZlY3RvclxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgdmVjdG9yXG4gICAqIEByZXR1cm5zIEEgbmV3IHZlY3RvciBjb250YWluaW5nIHRoZSBzdW1cbiAgICovXG4gIHN0YXRpYyBhZGQobF92ZWM6IElWZWN0b3IzLCByX3ZlYzogSVZlY3RvcjMpIHtcbiAgICByZXR1cm4gc3VwZXIuX2FkZChsX3ZlYywgcl92ZWMsIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZVZlY3RvcjNEO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgdmVjdG9yIHRoYXQgaXMgdGhlIGRpZmZlcmVuY2Ugb2YgdHdvIHZlY3RvcnMgd2l0aCBkb3VibGUgcHJlY2lzaW9uLlxuICAgKlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgbGVmdCB2ZWN0b3IgKG1pbnVlbmQpXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSByaWdodCB2ZWN0b3IgKHN1YnRyYWhlbmQpXG4gICAqIEByZXR1cm5zIEEgbmV3IHZlY3RvciBjb250YWluaW5nIHRoZSBkaWZmZXJlbmNlXG4gICAqL1xuICBzdGF0aWMgc3VidHJhY3QobF92ZWM6IElWZWN0b3IzLCByX3ZlYzogSVZlY3RvcjMpIHtcbiAgICByZXR1cm4gc3VwZXIuX3N1YnRyYWN0KGxfdmVjLCByX3ZlYywgRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlVmVjdG9yM0Q7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyB2ZWN0b3IgdGhhdCBpcyB0aGUgc2NhbGFyIG11bHRpcGxpY2F0aW9uIG9mIGEgdmVjdG9yIHdpdGggZG91YmxlIHByZWNpc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gbXVsdGlwbHlcbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIHNjYWxhciB2YWx1ZVxuICAgKiBAcmV0dXJucyBBIG5ldyBzY2FsZWQgdmVjdG9yXG4gICAqL1xuICBzdGF0aWMgbXVsdGlwbHkodmVjOiBJVmVjdG9yMywgdmFsdWU6IG51bWJlcikge1xuICAgIHJldHVybiBzdXBlci5fbXVsdGlwbHkodmVjLCB2YWx1ZSwgRmxvYXQ2NEFycmF5KSBhcyBNdXRhYmxlVmVjdG9yM0Q7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyB2ZWN0b3IgdGhhdCBpcyB0aGUgY29tcG9uZW50LXdpc2UgbXVsdGlwbGljYXRpb24gb2YgdHdvIHZlY3RvcnMgd2l0aCBkb3VibGUgcHJlY2lzaW9uLlxuICAgKlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgbGVmdCB2ZWN0b3JcbiAgICogQHBhcmFtIHJfdmVjIC0gVGhlIHJpZ2h0IHZlY3RvclxuICAgKiBAcmV0dXJucyBBIG5ldyB2ZWN0b3IgY29udGFpbmluZyB0aGUgY29tcG9uZW50LXdpc2UgcHJvZHVjdFxuICAgKi9cbiAgc3RhdGljIG11bHRpcGx5VmVjdG9yKGxfdmVjOiBJVmVjdG9yMywgcl92ZWM6IElWZWN0b3IzKSB7XG4gICAgcmV0dXJuIHN1cGVyLl9tdWx0aXBseVZlY3RvcihsX3ZlYywgcl92ZWMsIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZVZlY3RvcjNEO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgdmVjdG9yIHRoYXQgaXMgdGhlIHNjYWxhciBkaXZpc2lvbiBvZiBhIHZlY3RvciB3aXRoIGRvdWJsZSBwcmVjaXNpb24uXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIGRpdmlkZVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIGRpdmlzb3JcbiAgICogQHJldHVybnMgQSBuZXcgZGl2aWRlZCB2ZWN0b3JcbiAgICovXG4gIHN0YXRpYyBkaXZpZGUodmVjOiBJVmVjdG9yMywgdmFsdWU6IG51bWJlcikge1xuICAgIHJldHVybiBzdXBlci5fZGl2aWRlKHZlYywgdmFsdWUsIEZsb2F0NjRBcnJheSkgYXMgTXV0YWJsZVZlY3RvcjNEO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgdmVjdG9yIHRoYXQgaXMgdGhlIGNvbXBvbmVudC13aXNlIGRpdmlzaW9uIG9mIHR3byB2ZWN0b3JzIHdpdGggZG91YmxlIHByZWNpc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIGRpdmlkZW5kIHZlY3RvclxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgZGl2aXNvciB2ZWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgdmVjdG9yIGNvbnRhaW5pbmcgdGhlIGNvbXBvbmVudC13aXNlIHF1b3RpZW50XG4gICAqL1xuICBzdGF0aWMgZGl2aWRlVmVjdG9yKGxfdmVjOiBJVmVjdG9yMywgcl92ZWM6IElWZWN0b3IzKSB7XG4gICAgcmV0dXJuIHN1cGVyLl9kaXZpZGVWZWN0b3IobF92ZWMsIHJfdmVjLCBGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVWZWN0b3IzRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IHZlY3RvciB0aGF0IGlzIHRoZSBjcm9zcyBwcm9kdWN0IG9mIHR3byB2ZWN0b3JzIHdpdGggZG91YmxlIHByZWNpc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIGxlZnQgdmVjdG9yXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSByaWdodCB2ZWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgdmVjdG9yIGNvbnRhaW5pbmcgdGhlIGNyb3NzIHByb2R1Y3RcbiAgICovXG4gIHN0YXRpYyBjcm9zcyhsX3ZlYzogSVZlY3RvcjMsIHJfdmVjOiBJVmVjdG9yMykge1xuICAgIHJldHVybiBzdXBlci5fY3Jvc3MobF92ZWMsIHJfdmVjLCBGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVWZWN0b3IzRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IHZlY3RvciBieSBhcHBseWluZyBhIHF1YXRlcm5pb24gcm90YXRpb24gdG8gYSB2ZWN0b3Igd2l0aCBkb3VibGUgcHJlY2lzaW9uLlxuICAgKlxuICAgKiBAcGFyYW0gcXVhdCAtIFRoZSBxdWF0ZXJuaW9uIHJlcHJlc2VudGluZyB0aGUgcm90YXRpb25cbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gcm90YXRlXG4gICAqIEByZXR1cm5zIEEgbmV3IHJvdGF0ZWQgdmVjdG9yXG4gICAqL1xuICBzdGF0aWMgbXVsdGlwbHlRdWF0ZXJuaW9uKHF1YXQ6IElRdWF0ZXJuaW9uLCB2ZWM6IElWZWN0b3IzKSB7XG4gICAgcmV0dXJuIHN1cGVyLl9tdWx0aXBseVF1YXRlcm5pb24ocXVhdCwgdmVjLCBGbG9hdDY0QXJyYXkpIGFzIE11dGFibGVWZWN0b3IzRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgdmVjdG9yIGZyb20gdGhyZWUgY29tcG9uZW50IHZhbHVlcyB3aXRoIGRvdWJsZSBwcmVjaXNpb24uXG4gICAqXG4gICAqIEBwYXJhbSB4IC0gVGhlIHggY29tcG9uZW50XG4gICAqIEBwYXJhbSB5IC0gVGhlIHkgY29tcG9uZW50XG4gICAqIEBwYXJhbSB6IC0gVGhlIHogY29tcG9uZW50XG4gICAqIEByZXR1cm5zIEEgbmV3IHZlY3RvciBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5Myh4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyKTogTXV0YWJsZVZlY3RvcjNEIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5Myh4LCB5LCB6LCBGbG9hdDY0QXJyYXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB2ZWN0b3Igd2l0aCBhbGwgY29tcG9uZW50cyBzZXQgdG8gdGhlIHNhbWUgdmFsdWUgd2l0aCBkb3VibGUgcHJlY2lzaW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIHZhbHVlIGZvciBhbGwgY29tcG9uZW50c1xuICAgKiBAcmV0dXJucyBBIG5ldyB2ZWN0b3IgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weTEodmFsOiBudW1iZXIpOiBNdXRhYmxlVmVjdG9yM0Qge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHkzKHZhbCwgdmFsLCB2YWwsIEZsb2F0NjRBcnJheSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHZlY3RvciBmcm9tIGEgMy1lbGVtZW50IGFycmF5IHdpdGggZG91YmxlIHByZWNpc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIGFycmF5IC0gVGhlIGFycmF5IGNvbnRhaW5pbmcgeCwgeSwgeiB2YWx1ZXNcbiAgICogQHJldHVybnMgQSBuZXcgdmVjdG9yIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheTMoYXJyYXk6IEFycmF5MzxudW1iZXI+KTogTXV0YWJsZVZlY3RvcjNEIHtcbiAgICByZXR1cm4gbmV3IE11dGFibGVWZWN0b3IzRChuZXcgRmxvYXQ2NEFycmF5KGFycmF5KSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHZlY3RvciBmcm9tIGFuIGFycmF5LCB0YWtpbmcgdGhlIGZpcnN0IDMgZWxlbWVudHMgd2l0aCBkb3VibGUgcHJlY2lzaW9uLlxuICAgKlxuICAgKiBAcGFyYW0gYXJyYXkgLSBUaGUgYXJyYXkgY29udGFpbmluZyBhdCBsZWFzdCAzIHZhbHVlc1xuICAgKiBAcmV0dXJucyBBIG5ldyB2ZWN0b3IgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weUFycmF5KGFycmF5OiBBcnJheTxudW1iZXI+KTogTXV0YWJsZVZlY3RvcjNEIHtcbiAgICByZXR1cm4gbmV3IE11dGFibGVWZWN0b3IzRChuZXcgRmxvYXQ2NEFycmF5KGFycmF5LnNsaWNlKDAsIDMpKSk7XG4gIH1cblxuICAvKipcbiAgICogUm90YXRlcyBhIHZlY3RvciBhcm91bmQgdGhlIFgtYXhpcyBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gdGhlIG91dHB1dCB2ZWN0b3Igd2l0aCBkb3VibGUgcHJlY2lzaW9uLlxuICAgKiBPbmx5IHRoZSBZIGFuZCBaIGNvbXBvbmVudHMgYXJlIGFmZmVjdGVkIGJ5IFgtYXhpcyByb3RhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHZlYzMgLSBUaGUgaW5wdXQgdmVjdG9yIHRvIHJvdGF0ZVxuICAgKiBAcGFyYW0gcmFkaWFuIC0gVGhlIHJvdGF0aW9uIGFuZ2xlIGluIHJhZGlhbnNcbiAgICogQHBhcmFtIG91dFZlYyAtIFRoZSBvdXRwdXQgdmVjdG9yIHRvIHN0b3JlIHRoZSByZXN1bHRcbiAgICovXG4gIHN0YXRpYyByb3RhdGVYKHZlYzM6IElWZWN0b3IzLCByYWRpYW46IG51bWJlciwgb3V0VmVjOiBNdXRhYmxlVmVjdG9yM0QpIHtcbiAgICBjb25zdCBjID0gTWF0aC5jb3MocmFkaWFuKTtcbiAgICBjb25zdCBzID0gTWF0aC5zaW4ocmFkaWFuKTtcbiAgICBvdXRWZWMueSA9IHZlYzMueSAqIGMgLSB2ZWMzLnogKiBzO1xuICAgIG91dFZlYy56ID0gdmVjMy55ICogcyArIHZlYzMueiAqIGM7XG4gIH1cblxuICAvKipcbiAgICogUm90YXRlcyBhIHZlY3RvciBhcm91bmQgdGhlIFktYXhpcyBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gdGhlIG91dHB1dCB2ZWN0b3Igd2l0aCBkb3VibGUgcHJlY2lzaW9uLlxuICAgKiBPbmx5IHRoZSBYIGFuZCBaIGNvbXBvbmVudHMgYXJlIGFmZmVjdGVkIGJ5IFktYXhpcyByb3RhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHZlYzMgLSBUaGUgaW5wdXQgdmVjdG9yIHRvIHJvdGF0ZVxuICAgKiBAcGFyYW0gcmFkaWFuIC0gVGhlIHJvdGF0aW9uIGFuZ2xlIGluIHJhZGlhbnNcbiAgICogQHBhcmFtIG91dFZlYyAtIFRoZSBvdXRwdXQgdmVjdG9yIHRvIHN0b3JlIHRoZSByZXN1bHRcbiAgICovXG4gIHN0YXRpYyByb3RhdGVZKHZlYzM6IElWZWN0b3IzLCByYWRpYW46IG51bWJlciwgb3V0VmVjOiBNdXRhYmxlVmVjdG9yM0QpIHtcbiAgICBjb25zdCBjID0gTWF0aC5jb3MocmFkaWFuKTtcbiAgICBjb25zdCBzID0gTWF0aC5zaW4ocmFkaWFuKTtcbiAgICBvdXRWZWMueCA9IHZlYzMueCAqIGMgKyB2ZWMzLnogKiBzO1xuICAgIG91dFZlYy56ID0gLXZlYzMueCAqIHMgKyB2ZWMzLnogKiBjO1xuICB9XG5cbiAgLyoqXG4gICAqIFJvdGF0ZXMgYSB2ZWN0b3IgYXJvdW5kIHRoZSBaLWF4aXMgYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIHRoZSBvdXRwdXQgdmVjdG9yIHdpdGggZG91YmxlIHByZWNpc2lvbi5cbiAgICogT25seSB0aGUgWCBhbmQgWSBjb21wb25lbnRzIGFyZSBhZmZlY3RlZCBieSBaLWF4aXMgcm90YXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMzIC0gVGhlIGlucHV0IHZlY3RvciB0byByb3RhdGVcbiAgICogQHBhcmFtIHJhZGlhbiAtIFRoZSByb3RhdGlvbiBhbmdsZSBpbiByYWRpYW5zXG4gICAqIEBwYXJhbSBvdXRWZWMgLSBUaGUgb3V0cHV0IHZlY3RvciB0byBzdG9yZSB0aGUgcmVzdWx0XG4gICAqL1xuICBzdGF0aWMgcm90YXRlWih2ZWMzOiBJVmVjdG9yMywgcmFkaWFuOiBudW1iZXIsIG91dFZlYzogTXV0YWJsZVZlY3RvcjNEKSB7XG4gICAgY29uc3QgYyA9IE1hdGguY29zKHJhZGlhbik7XG4gICAgY29uc3QgcyA9IE1hdGguc2luKHJhZGlhbik7XG4gICAgb3V0VmVjLnggPSB2ZWMzLnggKiBjIC0gdmVjMy55ICogcztcbiAgICBvdXRWZWMueSA9IHZlYzMueCAqIHMgKyB2ZWMzLnkgKiBjO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBjb3B5IG9mIHRoaXMgdmVjdG9yIHdpdGggZG91YmxlIHByZWNpc2lvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBuZXcgdmVjdG9yIGluc3RhbmNlIHdpdGggdGhlIHNhbWUgdmFsdWVzXG4gICAqL1xuICBjbG9uZSgpIHtcbiAgICByZXR1cm4gc3VwZXIuY2xvbmUoKSBhcyBNdXRhYmxlVmVjdG9yM0Q7XG4gIH1cbn1cblxuLyoqXG4gKiBBbGlhcyBmb3IgdGhlIDMyLWJpdCAoRmxvYXQzMkFycmF5KSBpbXBsZW1lbnRhdGlvbiwgbWFraW5nIHRoZSBwcmVjaXNpb24gZXhwbGljaXQuXG4gKi9cbmV4cG9ydCB7IE11dGFibGVWZWN0b3IzIGFzIE11dGFibGVWZWN0b3IzRiB9O1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsY0FBYztBQUd2QixTQUFTLGdCQUFnQjtBQVNsQixJQUFNLGtCQUFOLGNBQ0csU0FFVjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0UsWUFBWSxHQUFlLEVBQUUsS0FBSyxHQUFnQjtBQUNoRCxVQUFNLEdBQUcsRUFBRSxLQUFLLENBQUM7QUFBQSxFQUNuQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQUksRUFBRSxHQUFXO0FBQ2YsU0FBSyxHQUFHLENBQUMsSUFBSTtBQUFBLEVBQ2Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLElBQUk7QUFDTixXQUFPLEtBQUssR0FBRyxDQUFDO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLEVBQUUsR0FBVztBQUNmLFNBQUssR0FBRyxDQUFDLElBQUk7QUFBQSxFQUNmO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBSSxJQUFJO0FBQ04sV0FBTyxLQUFLLEdBQUcsQ0FBQztBQUFBLEVBQ2xCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBSSxFQUFFLEdBQVc7QUFDZixTQUFLLEdBQUcsQ0FBQyxJQUFJO0FBQUEsRUFDZjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQUksSUFBSTtBQUNOLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQUksSUFBSTtBQUNOLFdB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eEQsVUFBTSxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDO0FBRXhELFdBQU8sS0FBSyxjQUFjLEdBQUcsR0FBRyxDQUFDO0FBQUEsRUFDbkM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFVQSxtQkFBbUIsTUFBbUI7QUFDcEMsVUFBTSxNQUFNLEtBQUssR0FBRyxDQUFDLElBQUk7QUFDekIsVUFBTSxPQUFPLEtBQUssR0FBRyxDQUFDLElBQUk7QUFDMUIsVUFBTSxPQUFPLEtBQUssR0FBRyxDQUFDLElBQUk7QUFDMUIsVUFBTSxPQUFPLEtBQUssR0FBRyxDQUFDLElBQUk7QUFDMUIsVUFBTSxPQUFPLEtBQUssR0FBRyxDQUFDLElBQUk7QUFDMUIsVUFBTSxPQUFPLEtBQUssR0FBRyxDQUFDLElBQUk7QUFDMUIsVUFBTSxPQUFPLEtBQUssR0FBRyxDQUFDLElBQUk7QUFDMUIsVUFBTSxPQUFPLEtBQUssR0FBRyxDQUFDLElBQUk7QUFDMUIsVUFBTSxPQUFPLEtBQUssR0FBRyxDQUFDLElBQUk7QUFDMUIsVUFBTSxRQUFRLEtBQUssR0FBRyxDQUFDLElBQUk7QUFDM0IsVUFBTSxRQUFRLEtBQUssR0FBRyxDQUFDLElBQUk7QUFDM0IsVUFBTSxRQUFRLEtBQUssR0FBRyxDQUFDLElBQUk7QUFFM0IsVUFBTSxLQUFLLEtBQUssT0FBTyxTQUFTLEtBQUssR0FBRyxDQUFDLEtBQUssT0FBTyxTQUFTLEtBQUssR0FBRyxDQUFDLEtBQUssT0FBTyxTQUFTLEtBQUssR0FBRyxDQUFDO0FBQ3JHLFVBQU0sS0FBSyxPQUFPLFNBQVMsS0FBSyxHQUFHLENBQUMsS0FBSyxLQUFLLE9BQU8sU0FBUyxLQUFLLEdBQUcsQ0FBQyxLQUFLLE9BQU8sU0FBUyxLQUFLLEdBQUcsQ0FBQztBQUNyRyxVQUFNLEtBQUssT0FBTyxTQUFTLEtBQUssR0FBRyxDQUFDLEtBQUssT0FBTyxTQUFTLEtB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
