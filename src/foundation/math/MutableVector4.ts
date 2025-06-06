import type { IVector4, IMutableVector, IMutableVector4 } from './IVector';
import type { Array4, FloatTypedArray, FloatTypedArrayConstructor } from '../../types/CommonTypes';
import { Vector4_ } from './Vector4';
import { Logger } from '../misc/Logger';

/**
 * Base class for mutable 4D vectors with generic typed array support.
 * Extends Vector4_ to provide mutability capabilities for x, y, z, and w components.
 *
 * @template T - The typed array constructor type (Float32Array or Float64Array)
 * @internal
 */
export class MutableVector4_<T extends FloatTypedArrayConstructor>
  extends Vector4_<T>
  implements IMutableVector, IMutableVector4
{
  /**
   * Creates a new MutableVector4_ instance.
   *
   * @param x - The typed array containing vector components
   * @param type - Object containing the typed array constructor
   */
  constructor(x: FloatTypedArray, { type }: { type: T }) {
    super(x, { type });
  }

  /**
   * Sets the x component of the vector.
   * Automatically increments the update counter for change tracking.
   */
  set x(x: number) {
    this._v[0] = x;
    this.__updateCount++;
  }

  /**
   * Gets the x component of the vector.
   * @returns The x component value
   */
  get x(): number {
    return this._v[0];
  }

  /**
   * Sets the y component of the vector.
   * Automatically increments the update counter for change tracking.
   */
  set y(y: number) {
    this._v[1] = y;
    this.__updateCount++;
  }

  /**
   * Gets the y component of the vector.
   * @returns The y component value
   */
  get y(): number {
    return this._v[1];
  }

  /**
   * Sets the z component of the vector.
   * Automatically increments the update counter for change tracking.
   */
  set z(z: number) {
    this._v[2] = z;
    this.__updateCount++;
  }

  /**
   * Gets the z component of the vector.
   * @returns The z component value
   */
  get z(): number {
    return this._v[2];
  }

  /**
   * Sets the w component of the vector.
   * Automatically increments the update counter for change tracking.
   */
  set w(w: number) {
    this._v[3] = w;
    this.__updateCount++;
  }

  /**
   * Gets the w component of the vector.
   * @returns The w component value
   */
  get w(): number {
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
  setAt(i: number, value: number) {
    this._v[i] = value;
    this.__updateCount++;
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
  setComponents(x: number, y: number, z: number, w: number) {
    this._v[0] = x;
    this._v[1] = y;
    this._v[2] = z;
    this._v[3] = w;
    this.__updateCount++;
    return this;
  }

  /**
   * Copies components from another vector to this vector.
   *
   * @param vec - The source vector to copy from
   * @returns This vector instance for method chaining
   */
  copyComponents(vec: IVector4) {
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
  add(vec: IVector4) {
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
  subtract(vec: IVector4) {
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
  multiply(value: number) {
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
  multiplyVector(vec: IVector4) {
    this._v[0] *= vec._v[0];
    this._v[1] *= vec._v[1];
    this._v[2] *= vec._v[2];
    this._v[3] *= vec._v[3];
    return this;
  }

  /**
   * Divides this vector by a scalar value.
   * If the value is zero, sets components to Infinity and logs an error.
   *
   * @param value - The scalar value to divide by
   * @returns This vector instance for method chaining
   */
  divide(value: number) {
    if (value !== 0) {
      this._v[0] /= value;
      this._v[1] /= value;
      this._v[2] /= value;
      this._v[3] /= value;
    } else {
      Logger.error('0 division occurred!');
      this._v[0] = Number.POSITIVE_INFINITY;
      this._v[1] = Number.POSITIVE_INFINITY;
      this._v[2] = Number.POSITIVE_INFINITY;
      this._v[3] = Number.POSITIVE_INFINITY;
    }
    return this;
  }

  /**
   * Divides this vector by another vector component-wise.
   * If any component of the divisor is zero, sets the corresponding result to Infinity.
   *
   * @param vec - The vector to divide by
   * @returns This vector instance for method chaining
   */
  divideVector(vec: IVector4) {
    if (vec._v[0] !== 0 && vec._v[1] !== 0 && vec._v[2] !== 0 && vec._v[3] !== 0) {
      this._v[0] /= vec._v[0];
      this._v[1] /= vec._v[1];
      this._v[2] /= vec._v[2];
      this._v[3] /= vec._v[3];
    } else {
      Logger.error('0 division occurred!');
      this._v[0] = vec._v[0] === 0 ? Number.POSITIVE_INFINITY : this._v[0] / vec._v[0];
      this._v[1] = vec._v[1] === 0 ? Number.POSITIVE_INFINITY : this._v[1] / vec._v[1];
      this._v[2] = vec._v[2] === 0 ? Number.POSITIVE_INFINITY : this._v[2] / vec._v[2];
      this._v[3] = vec._v[3] === 0 ? Number.POSITIVE_INFINITY : this._v[3] / vec._v[3];
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
    return this.__updateCount;
  }

  private __updateCount = 0;
}

/**
 * Mutable 4D vector class with 32-bit float components.
 * Provides methods for vector operations that modify the vector in place,
 * as well as static factory methods for creating new vectors.
 */
export class MutableVector4 extends MutableVector4_<Float32ArrayConstructor> {
  /**
   * Creates a new MutableVector4 instance.
   *
   * @param x - Float32Array containing the vector components [x, y, z, w]
   */
  constructor(x: Float32Array) {
    super(x, { type: Float32Array });
  }

  /**
   * Creates a new MutableVector4 from an array of numbers.
   * Takes up to 4 elements from the array.
   *
   * @param array - Array of numbers to copy from
   * @returns A new MutableVector4 instance
   */
  static fromCopyArray(array: Array<number>): MutableVector4 {
    return new MutableVector4(new Float32Array(array).slice(0, 4));
  }

  /**
   * Creates a new MutableVector4 from a 4-element array.
   *
   * @param array - Array of exactly 4 numbers [x, y, z, w]
   * @returns A new MutableVector4 instance
   */
  static fromCopyArray4(array: Array4<number>): MutableVector4 {
    return new MutableVector4(new Float32Array(array));
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
  static fromCopy4(x: number, y: number, z: number, w: number): MutableVector4 {
    return new MutableVector4(new Float32Array([x, y, z, w]));
  }

  /**
   * Creates a zero vector (0, 0, 0, 0).
   *
   * @returns A new MutableVector4 with all components set to 0
   */
  static zero() {
    return super._zero(Float32Array) as MutableVector4;
  }

  /**
   * Creates a vector with all components set to 1 (1, 1, 1, 1).
   *
   * @returns A new MutableVector4 with all components set to 1
   */
  static one() {
    return super._one(Float32Array) as MutableVector4;
  }

  /**
   * Creates a dummy vector for placeholder purposes.
   *
   * @returns A new MutableVector4 dummy instance
   */
  static dummy() {
    return super._dummy(Float32Array) as MutableVector4;
  }

  /**
   * Creates a normalized copy of the given vector.
   *
   * @param vec - The vector to normalize
   * @returns A new normalized MutableVector4
   */
  static normalize(vec: IVector4) {
    return super._normalize(vec, Float32Array) as MutableVector4;
  }

  /**
   * Creates a new vector by adding two vectors component-wise.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new MutableVector4 containing the sum
   */
  static add(l_vec: IVector4, r_vec: IVector4) {
    return super._add(l_vec, r_vec, Float32Array) as MutableVector4;
  }

  /**
   * Creates a new vector by subtracting the second vector from the first.
   *
   * @param l_vec - The vector to subtract from
   * @param r_vec - The vector to subtract
   * @returns A new MutableVector4 containing the difference
   */
  static subtract(l_vec: IVector4, r_vec: IVector4) {
    return super._subtract(l_vec, r_vec, Float32Array) as MutableVector4;
  }

  /**
   * Creates a new vector by multiplying a vector by a scalar.
   *
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @returns A new MutableVector4 containing the scaled vector
   */
  static multiply(vec: IVector4, value: number) {
    return super._multiply(vec, value, Float32Array) as MutableVector4;
  }

  /**
   * Creates a new vector by multiplying two vectors component-wise.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new MutableVector4 containing the component-wise product
   */
  static multiplyVector(l_vec: IVector4, r_vec: IVector4) {
    return super._multiplyVector(l_vec, r_vec, Float32Array) as MutableVector4;
  }

  /**
   * Creates a new vector by dividing a vector by a scalar.
   *
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @returns A new MutableVector4 containing the divided vector
   */
  static divide(vec: IVector4, value: number) {
    return super._divide(vec, value, Float32Array) as MutableVector4;
  }

  /**
   * Creates a new vector by dividing two vectors component-wise.
   *
   * @param l_vec - The dividend vector
   * @param r_vec - The divisor vector
   * @returns A new MutableVector4 containing the component-wise quotient
   */
  static divideVector(l_vec: IVector4, r_vec: IVector4) {
    return super._divideVector(l_vec, r_vec, Float32Array) as MutableVector4;
  }

  /**
   * Gets the class name for debugging and identification purposes.
   *
   * @returns The string 'MutableVector4'
   */
  get className() {
    return 'MutableVector4';
  }

  /**
   * Creates a deep copy of this vector.
   *
   * @returns A new MutableVector4 instance with copied values
   */
  clone() {
    return new (this.constructor as any)(
      new (this._v.constructor as any)([this._v[0], this._v[1], this._v[2], this._v[3]])
    );
  }
}

/**
 * Mutable 4D vector class with 64-bit float components.
 * Provides higher precision arithmetic compared to MutableVector4.
 */
export class MutableVector4d extends MutableVector4_<Float64ArrayConstructor> {
  /**
   * Creates a new MutableVector4d instance.
   *
   * @param x - Float64Array containing the vector components [x, y, z, w]
   */
  constructor(x: Float64Array) {
    super(x, { type: Float64Array });
  }

  /**
   * Creates a zero vector (0, 0, 0, 0) with 64-bit precision.
   *
   * @returns A new MutableVector4d with all components set to 0
   */
  static zero() {
    return super._zero(Float64Array) as MutableVector4d;
  }

  /**
   * Creates a vector with all components set to 1 (1, 1, 1, 1) with 64-bit precision.
   *
   * @returns A new MutableVector4d with all components set to 1
   */
  static one() {
    return super._one(Float64Array) as MutableVector4d;
  }

  /**
   * Creates a dummy vector for placeholder purposes with 64-bit precision.
   *
   * @returns A new MutableVector4d dummy instance
   */
  static dummy() {
    return super._dummy(Float64Array) as MutableVector4d;
  }

  /**
   * Creates a normalized copy of the given vector with 64-bit precision.
   *
   * @param vec - The vector to normalize
   * @returns A new normalized MutableVector4d
   */
  static normalize(vec: IVector4) {
    return super._normalize(vec, Float64Array) as MutableVector4d;
  }

  /**
   * Creates a new vector by adding two vectors component-wise with 64-bit precision.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new MutableVector4d containing the sum
   */
  static add(l_vec: IVector4, r_vec: IVector4) {
    return super._add(l_vec, r_vec, Float64Array) as MutableVector4d;
  }

  /**
   * Creates a new vector by subtracting the second vector from the first with 64-bit precision.
   *
   * @param l_vec - The vector to subtract from
   * @param r_vec - The vector to subtract
   * @returns A new MutableVector4d containing the difference
   */
  static subtract(l_vec: IVector4, r_vec: IVector4) {
    return super._subtract(l_vec, r_vec, Float64Array) as MutableVector4d;
  }

  /**
   * Creates a new vector by multiplying a vector by a scalar with 64-bit precision.
   *
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @returns A new MutableVector4d containing the scaled vector
   */
  static multiply(vec: IVector4, value: number) {
    return super._multiply(vec, value, Float64Array) as MutableVector4d;
  }

  /**
   * Creates a new vector by multiplying two vectors component-wise with 64-bit precision.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new MutableVector4d containing the component-wise product
   */
  static multiplyVector(l_vec: IVector4, r_vec: IVector4) {
    return super._multiplyVector(l_vec, r_vec, Float64Array) as MutableVector4d;
  }

  /**
   * Creates a new vector by dividing a vector by a scalar with 64-bit precision.
   *
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @returns A new MutableVector4d containing the divided vector
   */
  static divide(vec: IVector4, value: number) {
    return super._divide(vec, value, Float64Array) as MutableVector4d;
  }

  /**
   * Creates a new vector by dividing two vectors component-wise with 64-bit precision.
   *
   * @param l_vec - The dividend vector
   * @param r_vec - The divisor vector
   * @returns A new MutableVector4d containing the component-wise quotient
   */
  static divideVector(l_vec: IVector4, r_vec: IVector4) {
    return super._divideVector(l_vec, r_vec, Float64Array) as MutableVector4d;
  }

  /**
   * Creates a new MutableVector4d from a 4-element array with 64-bit precision.
   *
   * @param array - Array of exactly 4 numbers [x, y, z, w]
   * @returns A new MutableVector4d instance
   */
  static fromCopyArray4(array: Array4<number>): MutableVector4d {
    return new MutableVector4d(new Float64Array(array));
  }

  /**
   * Creates a new MutableVector4d from an array of numbers with 64-bit precision.
   * Takes up to 4 elements from the array.
   *
   * @param array - Array of numbers to copy from
   * @returns A new MutableVector4d instance
   */
  static fromCopyArray(array: Array<number>): MutableVector4d {
    return new MutableVector4d(new Float64Array(array.slice(0, 4)));
  }

  /**
   * Creates a new MutableVector4d from individual component values with 64-bit precision.
   *
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   * @param w - The w component
   * @returns A new MutableVector4d instance
   */
  static fromCopy4(x: number, y: number, z: number, w: number): MutableVector4d {
    return new MutableVector4d(new Float64Array([x, y, z, w]));
  }

  /**
   * Creates a deep copy of this vector with 64-bit precision.
   *
   * @returns A new MutableVector4d instance with copied values
   */
  clone() {
    return super.clone() as MutableVector4d;
  }
}

/**
 * Type alias for MutableVector4 to indicate 32-bit float precision.
 */
export type MutableVector4f = MutableVector4;
