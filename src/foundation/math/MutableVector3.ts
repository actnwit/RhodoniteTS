import type { Array3, FloatTypedArrayConstructor, TypedArray } from '../../types/CommonTypes';
import { Logger } from '../misc/Logger';
import type { IQuaternion } from './IQuaternion';
import type { IMutableVector, IMutableVector3, IVector3, IVector4 } from './IVector';
import { Vector3_ } from './Vector3';

/**
 * Abstract base class for mutable 3D vectors with generic typed array support.
 * Extends the immutable Vector3_ class to provide mutable operations.
 *
 * @template T - The typed array constructor type (Float32Array or Float64Array)
 * @internal
 */
export class MutableVector3_<T extends FloatTypedArrayConstructor>
  extends Vector3_<T>
  implements IMutableVector, IMutableVector3
{
  /**
   * Creates a new MutableVector3_ instance.
   *
   * @param v - The typed array containing the vector components
   * @param options - Configuration object containing the array type
   */
  constructor(v: TypedArray, { type }: { type: T }) {
    super(v, { type });
  }

  /**
   * Sets the x component of the vector.
   *
   * @param x - The new x value
   */
  set x(x: number) {
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
  set y(y: number) {
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
  set z(z: number) {
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
  setAt(i: number, value: number) {
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
  setComponents(x: number, y: number, z: number) {
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
  copyComponents(vec: IVector3) {
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
  add(vec: IVector3) {
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
  subtract(vec: IVector3) {
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
  multiply(value: number) {
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
  multiplyVector(vec: IVector3) {
    this._v[0] *= vec._v[0];
    this._v[1] *= vec._v[1];
    this._v[2] *= vec._v[2];
    return this;
  }

  /**
   * Divides this vector by a scalar value.
   * Scales all components by 1/value and modifies this vector in place.
   * If value is 0, sets all components to Infinity and logs an error.
   *
   * @param value - The scalar value to divide by
   * @returns This vector instance for method chaining
   */
  divide(value: number) {
    if (value !== 0) {
      this._v[0] /= value;
      this._v[1] /= value;
      this._v[2] /= value;
    } else {
      Logger.default.error('0 division occurred!');
      this._v[0] = Number.POSITIVE_INFINITY;
      this._v[1] = Number.POSITIVE_INFINITY;
      this._v[2] = Number.POSITIVE_INFINITY;
    }

    return this;
  }

  /**
   * Divides this vector by another vector component-wise.
   * Performs element-wise division and modifies this vector in place.
   * If any component of the divisor vector is 0, sets the corresponding component to Infinity.
   *
   * @param vec - The vector to divide by
   * @returns This vector instance for method chaining
   */
  divideVector(vec: IVector3) {
    if (vec._v[0] !== 0 && vec._v[1] !== 0 && vec._v[2] !== 0) {
      this._v[0] /= vec._v[0];
      this._v[1] /= vec._v[1];
      this._v[2] /= vec._v[2];
    } else {
      Logger.default.error('0 division occurred!');
      this._v[0] = vec._v[0] === 0 ? Number.POSITIVE_INFINITY : this._v[0] / vec._v[0];
      this._v[1] = vec._v[1] === 0 ? Number.POSITIVE_INFINITY : this._v[1] / vec._v[1];
      this._v[2] = vec._v[2] === 0 ? Number.POSITIVE_INFINITY : this._v[2] / vec._v[2];
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
  cross(vec: IVector3) {
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
  multiplyQuaternion(quat: IQuaternion) {
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
  static _fromCopy3(x: number, y: number, z: number, type: FloatTypedArrayConstructor) {
    return new this(new type([x, y, z]), { type });
  }
}

/**
 * Mutable 3D vector class with 32-bit float precision.
 * Provides in-place vector operations for efficient mathematical computations.
 * All operations modify the vector instance and return it for method chaining.
 */
export class MutableVector3 extends MutableVector3_<Float32ArrayConstructor> {
  /**
   * Creates a new MutableVector3 instance.
   *
   * @param v - The typed array containing the vector components
   */
  constructor(v: TypedArray) {
    super(v, { type: Float32Array });
  }

  /**
   * Creates a zero vector (0, 0, 0).
   *
   * @returns A new zero vector
   */
  static zero() {
    return super._zero(Float32Array) as MutableVector3;
  }

  /**
   * Creates a unit vector (1, 1, 1).
   *
   * @returns A new unit vector
   */
  static one() {
    return super._one(Float32Array) as MutableVector3;
  }

  /**
   * Creates a dummy vector for initialization purposes.
   *
   * @returns A new dummy vector
   */
  static dummy() {
    return super._dummy(Float32Array) as MutableVector3;
  }

  /**
   * Creates a normalized copy of the given vector.
   *
   * @param vec - The vector to normalize
   * @returns A new normalized vector
   */
  static normalize(vec: IVector3) {
    return super._normalize(vec, Float32Array) as MutableVector3;
  }

  /**
   * Creates a new vector that is the sum of two vectors.
   *
   * @param l_vec - The left vector
   * @param r_vec - The right vector
   * @returns A new vector containing the sum
   */
  static add(l_vec: IVector3, r_vec: IVector3) {
    return super._add(l_vec, r_vec, Float32Array) as MutableVector3;
  }

  /**
   * Creates a new vector that is the difference of two vectors.
   *
   * @param l_vec - The left vector (minuend)
   * @param r_vec - The right vector (subtrahend)
   * @returns A new vector containing the difference
   */
  static subtract(l_vec: IVector3, r_vec: IVector3) {
    return super._subtract(l_vec, r_vec, Float32Array) as MutableVector3;
  }

  /**
   * Creates a new vector that is the scalar multiplication of a vector.
   *
   * @param vec - The vector to multiply
   * @param value - The scalar value
   * @returns A new scaled vector
   */
  static multiply(vec: IVector3, value: number) {
    return super._multiply(vec, value, Float32Array) as MutableVector3;
  }

  /**
   * Creates a new vector that is the component-wise multiplication of two vectors.
   *
   * @param l_vec - The left vector
   * @param r_vec - The right vector
   * @returns A new vector containing the component-wise product
   */
  static multiplyVector(l_vec: IVector3, r_vec: IVector3) {
    return super._multiplyVector(l_vec, r_vec, Float32Array) as MutableVector3;
  }

  /**
   * Creates a new vector that is the scalar division of a vector.
   *
   * @param vec - The vector to divide
   * @param value - The scalar divisor
   * @returns A new divided vector
   */
  static divide(vec: IVector3, value: number) {
    return super._divide(vec, value, Float32Array) as MutableVector3;
  }

  /**
   * Creates a new vector that is the component-wise division of two vectors.
   *
   * @param l_vec - The dividend vector
   * @param r_vec - The divisor vector
   * @returns A new vector containing the component-wise quotient
   */
  static divideVector(l_vec: IVector3, r_vec: IVector3) {
    return super._divideVector(l_vec, r_vec, Float32Array) as MutableVector3;
  }

  /**
   * Creates a new vector that is the cross product of two vectors.
   *
   * @param l_vec - The left vector
   * @param r_vec - The right vector
   * @returns A new vector containing the cross product
   */
  static cross(l_vec: IVector3, r_vec: IVector3) {
    return super._cross(l_vec, r_vec, Float32Array) as MutableVector3;
  }

  /**
   * Creates a new vector by applying a quaternion rotation to a vector.
   *
   * @param quat - The quaternion representing the rotation
   * @param vec - The vector to rotate
   * @returns A new rotated vector
   */
  static multiplyQuaternion(quat: IQuaternion, vec: IVector3) {
    return super._multiplyQuaternion(quat, vec, Float32Array) as MutableVector3;
  }

  /**
   * Gets the class name for debugging purposes.
   *
   * @returns The class name string
   */
  get className() {
    return 'MutableVector3';
  }

  /**
   * Creates a vector from three component values.
   *
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   * @returns A new vector instance
   */
  static fromCopy3(x: number, y: number, z: number): MutableVector3 {
    return super._fromCopy3(x, y, z, Float32Array);
  }

  /**
   * Creates a vector with all components set to the same value.
   *
   * @param val - The value for all components
   * @returns A new vector instance
   */
  static fromCopy1(val: number): MutableVector3 {
    return super._fromCopy3(val, val, val, Float32Array);
  }

  /**
   * Creates a vector from a 3-element array.
   *
   * @param array - The array containing x, y, z values
   * @returns A new vector instance
   */
  static fromCopyArray3(array: Array3<number>): MutableVector3 {
    return new MutableVector3(new Float32Array(array));
  }

  /**
   * Creates a vector from an array, taking the first 3 elements.
   *
   * @param array - The array containing at least 3 values
   * @returns A new vector instance
   */
  static fromCopyArray(array: Array<number>): MutableVector3 {
    return new MutableVector3(new Float32Array(array.slice(0, 3)));
  }

  /**
   * Creates a vector from an existing Float32Array (shares the same buffer).
   *
   * @param float32Array - The Float32Array to use
   * @returns A new vector instance
   */
  static fromFloat32Array(float32Array: Float32Array): MutableVector3 {
    return new MutableVector3(float32Array);
  }

  /**
   * Creates a vector by copying from an existing Float32Array.
   *
   * @param float32Array - The Float32Array to copy from
   * @returns A new vector instance with copied data
   */
  static fromCopyFloat32Array(float32Array: Float32Array): MutableVector3 {
    return new MutableVector3(new Float32Array(float32Array.buffer.slice(0)));
  }

  /**
   * Creates a vector by copying from another 3D vector.
   *
   * @param vec - The vector to copy from
   * @returns A new vector instance
   */
  static fromCopyVector3(vec: IVector3): MutableVector3 {
    return super._fromCopyVector3(vec, Float32Array) as MutableVector3;
  }

  /**
   * Creates a 3D vector by copying from a 4D vector (ignoring w component).
   *
   * @param vec - The 4D vector to copy from
   * @returns A new 3D vector instance
   */
  static fromCopyVector4(vec: IVector4): MutableVector3 {
    return super._fromCopyVector4(vec, Float32Array) as MutableVector3;
  }

  /**
   * Creates a copy of this vector.
   *
   * @returns A new vector instance with the same values
   */
  clone() {
    return super.clone() as MutableVector3;
  }

  /**
   * Rotates a vector around the X-axis and stores the result in the output vector.
   * Only the Y and Z components are affected by X-axis rotation.
   *
   * @param vec3 - The input vector to rotate
   * @param radian - The rotation angle in radians
   * @param outVec - The output vector to store the result
   */
  static rotateX(vec3: IVector3, radian: number, outVec: MutableVector3) {
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
  static rotateY(vec3: IVector3, radian: number, outVec: MutableVector3) {
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
  static rotateZ(vec3: IVector3, radian: number, outVec: MutableVector3) {
    const c = Math.cos(radian);
    const s = Math.sin(radian);
    outVec.x = vec3.x * c - vec3.y * s;
    outVec.y = vec3.x * s + vec3.y * c;
  }
}

/**
 * Mutable 3D vector class with 64-bit double precision.
 * Provides higher precision vector operations for applications requiring
 * greater numerical accuracy than 32-bit floats.
 */
export class MutableVector3d extends MutableVector3_<Float64ArrayConstructor> {
  /**
   * Creates a new MutableVector3d instance.
   *
   * @param x - The typed array containing the vector components
   */
  constructor(x: TypedArray) {
    super(x, { type: Float64Array });
  }

  /**
   * Creates a zero vector (0, 0, 0) with double precision.
   *
   * @returns A new zero vector
   */
  static zero() {
    return super._zero(Float64Array) as MutableVector3d;
  }

  /**
   * Creates a unit vector (1, 1, 1) with double precision.
   *
   * @returns A new unit vector
   */
  static one() {
    return super._one(Float64Array) as MutableVector3d;
  }

  /**
   * Creates a dummy vector for initialization purposes with double precision.
   *
   * @returns A new dummy vector
   */
  static dummy() {
    return super._dummy(Float64Array) as MutableVector3d;
  }

  /**
   * Creates a normalized copy of the given vector with double precision.
   *
   * @param vec - The vector to normalize
   * @returns A new normalized vector
   */
  static normalize(vec: IVector3) {
    return super._normalize(vec, Float64Array) as MutableVector3d;
  }

  /**
   * Creates a new vector that is the sum of two vectors with double precision.
   *
   * @param l_vec - The left vector
   * @param r_vec - The right vector
   * @returns A new vector containing the sum
   */
  static add(l_vec: IVector3, r_vec: IVector3) {
    return super._add(l_vec, r_vec, Float64Array) as MutableVector3d;
  }

  /**
   * Creates a new vector that is the difference of two vectors with double precision.
   *
   * @param l_vec - The left vector (minuend)
   * @param r_vec - The right vector (subtrahend)
   * @returns A new vector containing the difference
   */
  static subtract(l_vec: IVector3, r_vec: IVector3) {
    return super._subtract(l_vec, r_vec, Float64Array) as MutableVector3d;
  }

  /**
   * Creates a new vector that is the scalar multiplication of a vector with double precision.
   *
   * @param vec - The vector to multiply
   * @param value - The scalar value
   * @returns A new scaled vector
   */
  static multiply(vec: IVector3, value: number) {
    return super._multiply(vec, value, Float64Array) as MutableVector3d;
  }

  /**
   * Creates a new vector that is the component-wise multiplication of two vectors with double precision.
   *
   * @param l_vec - The left vector
   * @param r_vec - The right vector
   * @returns A new vector containing the component-wise product
   */
  static multiplyVector(l_vec: IVector3, r_vec: IVector3) {
    return super._multiplyVector(l_vec, r_vec, Float64Array) as MutableVector3d;
  }

  /**
   * Creates a new vector that is the scalar division of a vector with double precision.
   *
   * @param vec - The vector to divide
   * @param value - The scalar divisor
   * @returns A new divided vector
   */
  static divide(vec: IVector3, value: number) {
    return super._divide(vec, value, Float64Array) as MutableVector3d;
  }

  /**
   * Creates a new vector that is the component-wise division of two vectors with double precision.
   *
   * @param l_vec - The dividend vector
   * @param r_vec - The divisor vector
   * @returns A new vector containing the component-wise quotient
   */
  static divideVector(l_vec: IVector3, r_vec: IVector3) {
    return super._divideVector(l_vec, r_vec, Float64Array) as MutableVector3d;
  }

  /**
   * Creates a new vector that is the cross product of two vectors with double precision.
   *
   * @param l_vec - The left vector
   * @param r_vec - The right vector
   * @returns A new vector containing the cross product
   */
  static cross(l_vec: IVector3, r_vec: IVector3) {
    return super._cross(l_vec, r_vec, Float64Array) as MutableVector3d;
  }

  /**
   * Creates a new vector by applying a quaternion rotation to a vector with double precision.
   *
   * @param quat - The quaternion representing the rotation
   * @param vec - The vector to rotate
   * @returns A new rotated vector
   */
  static multiplyQuaternion(quat: IQuaternion, vec: IVector3) {
    return super._multiplyQuaternion(quat, vec, Float64Array) as MutableVector3d;
  }

  /**
   * Creates a vector from three component values with double precision.
   *
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   * @returns A new vector instance
   */
  static fromCopy3(x: number, y: number, z: number): MutableVector3d {
    return super._fromCopy3(x, y, z, Float64Array);
  }

  /**
   * Creates a vector with all components set to the same value with double precision.
   *
   * @param val - The value for all components
   * @returns A new vector instance
   */
  static fromCopy1(val: number): MutableVector3d {
    return super._fromCopy3(val, val, val, Float64Array);
  }

  /**
   * Creates a vector from a 3-element array with double precision.
   *
   * @param array - The array containing x, y, z values
   * @returns A new vector instance
   */
  static fromCopyArray3(array: Array3<number>): MutableVector3d {
    return new MutableVector3d(new Float64Array(array));
  }

  /**
   * Creates a vector from an array, taking the first 3 elements with double precision.
   *
   * @param array - The array containing at least 3 values
   * @returns A new vector instance
   */
  static fromCopyArray(array: Array<number>): MutableVector3d {
    return new MutableVector3d(new Float64Array(array.slice(0, 3)));
  }

  /**
   * Rotates a vector around the X-axis and stores the result in the output vector with double precision.
   * Only the Y and Z components are affected by X-axis rotation.
   *
   * @param vec3 - The input vector to rotate
   * @param radian - The rotation angle in radians
   * @param outVec - The output vector to store the result
   */
  static rotateX(vec3: IVector3, radian: number, outVec: MutableVector3d) {
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
  static rotateY(vec3: IVector3, radian: number, outVec: MutableVector3d) {
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
  static rotateZ(vec3: IVector3, radian: number, outVec: MutableVector3d) {
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
    return super.clone() as MutableVector3d;
  }
}

/**
 * Type alias for MutableVector3 with single precision (32-bit) floating point components.
 */
export type MutableVector3f = MutableVector3;
