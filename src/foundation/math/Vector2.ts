import type { Array2, FloatTypedArrayConstructor, TypedArray } from '../../types/CommonTypes';
import { CompositionType } from '../definitions/CompositionType';
import { Logger } from '../misc/Logger';
import { AbstractVector } from './AbstractVector';
import type { IMutableVector2, IVector, IVector2, IVector3, IVector4 } from './IVector';
import { MathUtil } from './MathUtil';

/**
 * Base class for 2D vector implementations with different precision types.
 * This class provides common functionality for both 32-bit and 64-bit floating point vectors.
 *
 * @template T - The typed array constructor type (Float32Array or Float64Array)
 * @internal
 */
export class Vector2_<T extends FloatTypedArrayConstructor> extends AbstractVector {
  /**
   * Creates a new Vector2_ instance.
   *
   * @param v - The typed array containing the vector components
   * @param options - Configuration object containing the array type
   */
  constructor(v: TypedArray, { type }: { type: T }) {
    super();
    this._v = v;
  }

  /**
   * Gets the X component of the vector.
   *
   * @returns The X component value
   */
  get x() {
    return this._v[0];
  }

  /**
   * Gets the Y component of the vector.
   *
   * @returns The Y component value
   */
  get y() {
    return this._v[1];
  }

  /**
   * Converts the vector to a GLSL vec2 string representation with float precision.
   *
   * @returns GLSL-compatible vec2 string
   */
  get glslStrAsFloat() {
    return `vec2(${MathUtil.convertToStringAsGLSLFloat(
      this._v[0]
    )}, ${MathUtil.convertToStringAsGLSLFloat(this._v[1])})`;
  }

  /**
   * Converts the vector to a GLSL ivec2 string representation with integer precision.
   *
   * @returns GLSL-compatible ivec2 string
   */
  get glslStrAsInt() {
    return `ivec2(${Math.floor(this._v[0])}, ${Math.floor(this._v[1])})`;
  }

  /**
   * Converts the vector to a WGSL vec2f string representation with float precision.
   *
   * @returns WGSL-compatible vec2f string
   */
  get wgslStrAsFloat() {
    return `vec2f(${MathUtil.convertToStringAsGLSLFloat(
      this._v[0]
    )}, ${MathUtil.convertToStringAsGLSLFloat(this._v[1])})`;
  }

  /**
   * Converts the vector to a WGSL vec2i string representation with integer precision.
   *
   * @returns WGSL-compatible vec2i string
   */
  get wgslStrAsInt() {
    return `vec2i(${Math.floor(this._v[0])}, ${Math.floor(this._v[1])})`;
  }

  /**
   * Gets the composition type of this vector.
   *
   * @returns The composition type (Vec2)
   */
  static get compositionType() {
    return CompositionType.Vec2;
  }

  /**
   * Calculates the squared length of a vector (static version).
   * This is more efficient than calculating the actual length when only comparison is needed.
   *
   * @param vec - The vector to calculate squared length for
   * @returns The squared length of the vector
   */
  static lengthSquared(vec: IVector2) {
    return vec.lengthSquared();
  }

  /**
   * Calculates the distance between two vectors.
   *
   * @param l_vec - The first vector
   * @param r_vec - The second vector
   * @returns The distance between the vectors
   */
  static lengthBtw(l_vec: IVector2, r_vec: IVector2) {
    return l_vec.lengthTo(r_vec);
  }

  /**
   * Calculates the angle between two vectors in radians.
   *
   * @param l_vec - The first vector
   * @param r_vec - The second vector
   * @returns The angle between the vectors in radians
   */
  static angleOfVectors(l_vec: IVector2, r_vec: IVector2) {
    const multipliedLength = l_vec.length() * r_vec.length();
    if (multipliedLength === 0) {
      Logger.error('length of a vector is 0!');
    }
    const cos_sita = l_vec.dot(r_vec) / multipliedLength;
    const sita = Math.acos(cos_sita);
    return sita;
  }

  /**
   * Creates a zero vector (0, 0).
   *
   * @param type - The typed array constructor
   * @returns A new zero vector
   */
  static _zero(type: FloatTypedArrayConstructor) {
    return this._fromCopyArray2([0, 0], type);
  }

  /**
   * Creates a one vector (1, 1).
   *
   * @param type - The typed array constructor
   * @returns A new one vector
   */
  static _one(type: FloatTypedArrayConstructor) {
    return this._fromCopyArray2([1, 1], type);
  }

  /**
   * Creates a dummy vector with no components.
   *
   * @param type - The typed array constructor
   * @returns A new dummy vector
   */
  static _dummy(type: FloatTypedArrayConstructor) {
    return new this(new type(), { type });
  }

  /**
   * Normalizes a vector to unit length (static version).
   *
   * @param vec - The vector to normalize
   * @param type - The typed array constructor
   * @returns A new normalized vector
   */
  static _normalize(vec: IVector2, type: FloatTypedArrayConstructor) {
    const length = vec.length();
    return this._divide(vec, length, type);
  }

  /**
   * Adds two vectors component-wise (static version).
   *
   * @param l_vec - The left vector operand
   * @param r_vec - The right vector operand
   * @param type - The typed array constructor
   * @returns A new vector containing the sum
   */
  static _add(l_vec: IVector2, r_vec: IVector2, type: FloatTypedArrayConstructor) {
    const x = l_vec._v[0] + r_vec._v[0];
    const y = l_vec._v[1] + r_vec._v[1];
    return this._fromCopyArray2([x, y], type);
  }

  /**
   * Adds two vectors component-wise and stores the result in the output vector.
   *
   * @param l_vec - The left vector operand
   * @param r_vec - The right vector operand
   * @param out - The output vector to store the result
   * @returns The output vector containing the sum
   */
  static addTo(l_vec: IVector2, r_vec: IVector2, out: IMutableVector2) {
    out._v[0] = l_vec._v[0] + r_vec._v[0];
    out._v[1] = l_vec._v[1] + r_vec._v[1];
    return out;
  }

  /**
   * Subtracts the right vector from the left vector component-wise (static version).
   *
   * @param l_vec - The left vector operand
   * @param r_vec - The right vector operand
   * @param type - The typed array constructor
   * @returns A new vector containing the difference
   */
  static _subtract(l_vec: IVector2, r_vec: IVector2, type: FloatTypedArrayConstructor) {
    const x = l_vec._v[0] - r_vec._v[0];
    const y = l_vec._v[1] - r_vec._v[1];
    return this._fromCopyArray2([x, y], type);
  }

  /**
   * Subtracts the right vector from the left vector component-wise and stores the result in the output vector.
   *
   * @param l_vec - The left vector operand
   * @param r_vec - The right vector operand
   * @param out - The output vector to store the result
   * @returns The output vector containing the difference
   */
  static subtractTo(l_vec: IVector2, r_vec: IVector2, out: IMutableVector2) {
    out._v[0] = l_vec._v[0] - r_vec._v[0];
    out._v[1] = l_vec._v[1] - r_vec._v[1];
    return out;
  }

  /**
   * Multiplies a vector by a scalar value (static version).
   *
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @param type - The typed array constructor
   * @returns A new vector containing the scaled result
   */
  static _multiply(vec: IVector2, value: number, type: FloatTypedArrayConstructor) {
    const x = vec._v[0] * value;
    const y = vec._v[1] * value;
    return this._fromCopyArray2([x, y], type);
  }

  /**
   * Multiplies a vector by a scalar value and stores the result in the output vector.
   *
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @param out - The output vector to store the result
   * @returns The output vector containing the scaled result
   */
  static multiplyTo(vec: IVector2, value: number, out: IMutableVector2) {
    out._v[0] = vec._v[0] * value;
    out._v[1] = vec._v[1] * value;
    return out;
  }

  /**
   * Multiplies two vectors component-wise (static version).
   *
   * @param l_vec - The left vector operand
   * @param r_vec - The right vector operand
   * @param type - The typed array constructor
   * @returns A new vector containing the component-wise product
   */
  static _multiplyVector(l_vec: IVector2, r_vec: IVector2, type: FloatTypedArrayConstructor) {
    const x = l_vec._v[0] * r_vec._v[0];
    const y = l_vec._v[1] * r_vec._v[1];
    return this._fromCopyArray2([x, y], type);
  }

  /**
   * Multiplies two vectors component-wise and stores the result in the output vector.
   *
   * @param l_vec - The left vector operand
   * @param r_vec - The right vector operand
   * @param out - The output vector to store the result
   * @returns The output vector containing the component-wise product
   */
  static multiplyVectorTo(l_vec: IVector2, r_vec: IVector2, out: IMutableVector2) {
    out._v[0] = l_vec._v[0] * r_vec._v[0];
    out._v[1] = l_vec._v[1] * r_vec._v[1];
    return out;
  }

  /**
   * Divides a vector by a scalar value (static version).
   *
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @param type - The typed array constructor
   * @returns A new vector containing the divided result
   */
  static _divide(vec: IVector2, value: number, type: FloatTypedArrayConstructor) {
    let x: number;
    let y: number;
    if (value !== 0) {
      x = vec._v[0] / value;
      y = vec._v[1] / value;
    } else {
      Logger.error('0 division occurred!');
      x = Number.POSITIVE_INFINITY;
      y = Number.POSITIVE_INFINITY;
    }
    return this._fromCopyArray2([x, y], type);
  }

  /**
   * Divides a vector by a scalar value and stores the result in the output vector.
   *
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @param out - The output vector to store the result
   * @returns The output vector containing the divided result
   */
  static divideTo(vec: IVector2, value: number, out: IMutableVector2) {
    if (value !== 0) {
      out._v[0] = vec._v[0] / value;
      out._v[1] = vec._v[1] / value;
    } else {
      Logger.error('0 division occurred!');
      out._v[0] = Number.POSITIVE_INFINITY;
      out._v[1] = Number.POSITIVE_INFINITY;
    }
    return out;
  }

  /**
   * Divides the left vector by the right vector component-wise (static version).
   *
   * @param l_vec - The left vector operand (dividend)
   * @param r_vec - The right vector operand (divisor)
   * @param type - The typed array constructor
   * @returns A new vector containing the component-wise division result
   */
  static _divideVector(l_vec: IVector2, r_vec: IVector2, type: FloatTypedArrayConstructor) {
    let x: number;
    let y: number;
    if (r_vec._v[0] !== 0 && r_vec._v[1] !== 0) {
      x = l_vec._v[0] / r_vec._v[0];
      y = l_vec._v[1] / r_vec._v[1];
    } else {
      Logger.error('0 division occurred!');
      x = r_vec._v[0] === 0 ? Number.POSITIVE_INFINITY : l_vec._v[0] / r_vec._v[0];
      y = r_vec._v[1] === 0 ? Number.POSITIVE_INFINITY : l_vec._v[1] / r_vec._v[1];
    }
    return this._fromCopyArray2([x, y], type);
  }

  /**
   * Divides the left vector by the right vector component-wise and stores the result in the output vector.
   *
   * @param l_vec - The left vector operand (dividend)
   * @param r_vec - The right vector operand (divisor)
   * @param out - The output vector to store the result
   * @returns The output vector containing the component-wise division result
   */
  static divideVectorTo(l_vec: IVector2, r_vec: IVector2, out: IMutableVector2) {
    if (r_vec._v[0] !== 0 && r_vec._v[1] !== 0) {
      out._v[0] = l_vec._v[0] / r_vec._v[0];
      out._v[1] = l_vec._v[1] / r_vec._v[1];
    } else {
      Logger.error('0 division occurred!');
      out._v[0] = r_vec._v[0] === 0 ? Number.POSITIVE_INFINITY : l_vec._v[0] / r_vec._v[0];
      out._v[1] = r_vec._v[1] === 0 ? Number.POSITIVE_INFINITY : l_vec._v[1] / r_vec._v[1];
    }
    return out;
  }

  /**
   * Calculates the dot product of two vectors (static version).
   *
   * @param l_vec - The left vector operand
   * @param r_vec - The right vector operand
   * @returns The dot product of the two vectors
   */
  static dot(l_vec: IVector2, r_vec: IVector2) {
    return l_vec.dot(r_vec);
  }

  /**
   * Converts the vector to a string representation.
   *
   * @returns String representation in the format "(x, y)"
   */
  toString() {
    return `(${this._v[0]}, ${this._v[1]})`;
  }

  /**
   * Converts the vector to an approximate string representation with financial precision.
   *
   * @returns String representation with reduced decimal places
   */
  toStringApproximately() {
    return `${MathUtil.financial(this._v[0])} ${MathUtil.financial(this._v[1])}\n`;
  }

  /**
   * Converts the vector to a flat array representation.
   *
   * @returns Array containing [x, y] components
   */
  flattenAsArray() {
    return [this._v[0], this._v[1]];
  }

  /**
   * Checks if this vector is a dummy (empty) vector.
   *
   * @returns True if the vector has no components, false otherwise
   */
  isDummy() {
    if (this._v.length === 0) {
      return true;
    }
    return false;
  }

  /**
   * Checks if this vector is approximately equal to another vector within a tolerance.
   *
   * @param vec - The vector to compare with
   * @param delta - The tolerance value (default: Number.EPSILON)
   * @returns True if vectors are approximately equal, false otherwise
   */
  isEqual(vec: IVector2, delta: number = Number.EPSILON) {
    if (Math.abs(vec._v[0] - this._v[0]) < delta && Math.abs(vec._v[1] - this._v[1]) < delta) {
      return true;
    }
    return false;
  }

  /**
   * Checks if this vector is strictly equal to another vector (exact comparison).
   *
   * @param vec - The vector to compare with
   * @returns True if vectors are exactly equal, false otherwise
   */
  isStrictEqual(vec: IVector2) {
    if (this._v[0] === vec._v[0] && this._v[1] === vec._v[1]) {
      return true;
    }
    return false;
  }

  /**
   * Gets the component at the specified index.
   *
   * @param i - The index (0 for x, 1 for y)
   * @returns The component value at the specified index
   */
  at(i: number) {
    return this._v[i];
  }

  /**
   * Calculates the length (magnitude) of the vector.
   *
   * @returns The length of the vector
   */
  length() {
    return Math.hypot(this._v[0], this._v[1]);
  }

  /**
   * Calculates the squared length of the vector.
   * This is more efficient than calculating the actual length when only comparison is needed.
   *
   * @returns The squared length of the vector
   */
  lengthSquared(): number {
    return this._v[0] ** 2 + this._v[1] ** 2;
  }

  /**
   * Calculates the distance from this vector to another vector.
   *
   * @param vec - The target vector
   * @returns The distance between the vectors
   */
  lengthTo(vec: IVector2) {
    const deltaX = this._v[0] - vec._v[0];
    const deltaY = this._v[1] - vec._v[1];
    return Math.hypot(deltaX, deltaY);
  }

  /**
   * Calculates the dot product with another vector.
   *
   * @param vec - The vector to calculate dot product with
   * @returns The dot product result
   */
  dot(vec: IVector2) {
    return this._v[0] * vec._v[0] + this._v[1] * vec._v[1];
  }

  /**
   * Creates a clone of this vector.
   *
   * @returns A new vector with the same components
   */
  clone() {
    return new (this.constructor as any)(new (this._v.constructor as any)([this._v[0], this._v[1]]));
  }

  /**
   * Creates a vector from a 2-element array.
   *
   * @param array - The array containing [x, y] components
   * @param type - The typed array constructor
   * @returns A new vector instance
   */
  static _fromCopyArray2(array: Array2<number>, type: FloatTypedArrayConstructor) {
    return new this(new type(array), { type });
  }

  /**
   * Creates a vector from individual x and y components.
   *
   * @param x - The x component
   * @param y - The y component
   * @param type - The typed array constructor
   * @returns A new vector instance
   */
  static _fromCopy2(x: number, y: number, type: FloatTypedArrayConstructor) {
    return new this(new type([x, y]), { type });
  }

  /**
   * Creates a vector from an array, taking the first 2 elements.
   *
   * @param array - The array containing components
   * @param type - The typed array constructor
   * @returns A new vector instance
   */
  static _fromCopyArray(array: Array<number>, type: FloatTypedArrayConstructor) {
    return new this(new type(array.slice(0, 2)), { type });
  }

  /**
   * Creates a vector from another IVector2 by sharing the underlying array.
   *
   * @param vec2 - The source vector
   * @param type - The typed array constructor
   * @returns A new vector instance
   */
  static _fromVector2(vec2: IVector2, type: FloatTypedArrayConstructor) {
    const vec = new this(new type(vec2._v), {
      type,
    });
    return vec;
  }

  /**
   * Creates a vector by copying components from another IVector2.
   *
   * @param vec2 - The source vector
   * @param type - The typed array constructor
   * @returns A new vector instance
   */
  static _fromCopyVector2(vec2: IVector2, type: FloatTypedArrayConstructor) {
    const vec = new this(new type([vec2._v[0], vec2._v[1]]), {
      type,
    });
    return vec;
  }

  /**
   * Creates a vector by copying the first 2 components from a 3D vector.
   *
   * @param vec3 - The source 3D vector
   * @param type - The typed array constructor
   * @returns A new vector instance
   */
  static _fromCopyVector3(vec3: IVector3, type: FloatTypedArrayConstructor) {
    const vec = new this(new type([vec3._v[0], vec3._v[1], vec3._v[2]]), {
      type,
    });
    return vec;
  }

  /**
   * Creates a vector by copying the first 2 components from a 4D vector.
   *
   * @param vec4 - The source 4D vector
   * @param type - The typed array constructor
   * @returns A new vector instance
   */
  static _fromCopyVector4(vec4: IVector4, type: FloatTypedArrayConstructor) {
    const vec = new this(new type([vec4._v[0], vec4._v[1], vec4._v[2]]), {
      type,
    });
    return vec;
  }

  /**
   * Gets the number of bytes per component in the underlying typed array.
   *
   * @returns The number of bytes per component
   */
  get bytesPerComponent() {
    return this._v.BYTES_PER_ELEMENT;
  }
}

/**
 * Immutable 2D vector class with 32-bit float components.
 * This class provides comprehensive vector operations for 2D graphics and mathematics.
 * All operations return new vector instances, preserving immutability.
 */
export class Vector2 extends Vector2_<Float32ArrayConstructor> implements IVector, IVector2 {
  /**
   * Creates a new Vector2 instance.
   *
   * @param x - The typed array containing the vector components
   */
  constructor(x: TypedArray) {
    super(x, { type: Float32Array });
  }

  /**
   * Creates a vector from a 2-element array.
   *
   * @param array - The array containing [x, y] components
   * @returns A new Vector2 instance
   */
  static fromCopyArray2(array: Array2<number>): Vector2 {
    return super._fromCopyArray2(array, Float32Array);
  }

  /**
   * Creates a vector from individual x and y components.
   *
   * @param x - The x component
   * @param y - The y component
   * @returns A new Vector2 instance
   */
  static fromCopy2(x: number, y: number): Vector2 {
    return super._fromCopy2(x, y, Float32Array);
  }

  /**
   * Creates a vector from an array, taking the first 2 elements.
   *
   * @param array - The array containing components
   * @returns A new Vector2 instance
   */
  static fromCopyArray(array: Array<number>): Vector2 {
    return super._fromCopyArray(array, Float32Array);
  }

  /**
   * Creates a vector by copying components from another IVector2.
   *
   * @param vec2 - The source vector
   * @returns A new Vector2 instance
   */
  static fromCopyVector2(vec2: IVector2): Vector2 {
    return super._fromCopyVector2(vec2, Float32Array);
  }

  /**
   * Creates a vector by copying the first 2 components from a 4D vector.
   *
   * @param vec4 - The source 4D vector
   * @returns A new Vector2 instance
   */
  static fromCopyVector4(vec4: IVector4): Vector2 {
    return super._fromCopyVector4(vec4, Float32Array);
  }

  /**
   * Creates a zero vector (0, 0).
   *
   * @returns A new zero Vector2 instance
   */
  static zero() {
    return super._zero(Float32Array) as Vector2;
  }

  /**
   * Creates a one vector (1, 1).
   *
   * @returns A new one Vector2 instance
   */
  static one() {
    return super._one(Float32Array) as Vector2;
  }

  /**
   * Creates a dummy vector with no components.
   *
   * @returns A new dummy Vector2 instance
   */
  static dummy() {
    return super._dummy(Float32Array) as Vector2;
  }

  /**
   * Normalizes a vector to unit length.
   *
   * @param vec - The vector to normalize
   * @returns A new normalized Vector2 instance
   */
  static normalize(vec: IVector2) {
    return super._normalize(vec, Float32Array) as Vector2;
  }

  /**
   * Adds two vectors component-wise.
   *
   * @param l_vec - The left vector operand
   * @param r_vec - The right vector operand
   * @returns A new Vector2 instance containing the sum
   */
  static add(l_vec: IVector2, r_vec: IVector2) {
    return super._add(l_vec, r_vec, Float32Array) as Vector2;
  }

  /**
   * Subtracts the right vector from the left vector component-wise.
   *
   * @param l_vec - The left vector operand
   * @param r_vec - The right vector operand
   * @returns A new Vector2 instance containing the difference
   */
  static subtract(l_vec: IVector2, r_vec: IVector2) {
    return super._subtract(l_vec, r_vec, Float32Array) as Vector2;
  }

  /**
   * Multiplies a vector by a scalar value.
   *
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @returns A new Vector2 instance containing the scaled result
   */
  static multiply(vec: IVector2, value: number) {
    return super._multiply(vec, value, Float32Array) as Vector2;
  }

  /**
   * Multiplies two vectors component-wise.
   *
   * @param l_vec - The left vector operand
   * @param r_vec - The right vector operand
   * @returns A new Vector2 instance containing the component-wise product
   */
  static multiplyVector(l_vec: IVector2, r_vec: IVector2) {
    return super._multiplyVector(l_vec, r_vec, Float32Array) as Vector2;
  }

  /**
   * Divides a vector by a scalar value.
   *
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @returns A new Vector2 instance containing the divided result
   */
  static divide(vec: IVector2, value: number) {
    return super._divide(vec, value, Float32Array) as Vector2;
  }

  /**
   * Divides the left vector by the right vector component-wise.
   *
   * @param l_vec - The left vector operand (dividend)
   * @param r_vec - The right vector operand (divisor)
   * @returns A new Vector2 instance containing the component-wise division result
   */
  static divideVector(l_vec: IVector2, r_vec: IVector2) {
    return super._divideVector(l_vec, r_vec, Float32Array) as Vector2;
  }

  /**
   * Gets the class name.
   *
   * @returns The string "Vector2"
   */
  get className() {
    return 'Vector2';
  }

  /**
   * Creates a clone of this vector.
   *
   * @returns A new Vector2 instance with the same components
   */
  clone() {
    return super.clone() as Vector2;
  }
}

/**
 * Immutable 2D vector class with 64-bit float components.
 * This class provides high-precision vector operations for applications requiring double precision.
 * All operations return new vector instances, preserving immutability.
 */
export class Vector2d extends Vector2_<Float64ArrayConstructor> {
  /**
   * Creates a new Vector2d instance.
   *
   * @param x - The typed array containing the vector components
   */
  constructor(x: TypedArray) {
    super(x, { type: Float64Array });
  }

  /**
   * Creates a vector from a 2-element array.
   *
   * @param array - The array containing [x, y] components
   * @returns A new Vector2d instance
   */
  static fromCopyArray2(array: Array2<number>): Vector2d {
    return super._fromCopyArray2(array, Float64Array);
  }

  /**
   * Creates a vector from individual x and y components.
   *
   * @param x - The x component
   * @param y - The y component
   * @returns A new Vector2d instance
   */
  static fromCopy2(x: number, y: number): Vector2d {
    return super._fromCopy2(x, y, Float64Array);
  }

  /**
   * Creates a vector from an array, taking the first 2 elements.
   *
   * @param array - The array containing components
   * @returns A new Vector2d instance
   */
  static fromCopyArray(array: Array<number>): Vector2d {
    return super._fromCopyArray(array, Float64Array);
  }

  /**
   * Creates a vector from an ArrayBuffer.
   *
   * @param arrayBuffer - The ArrayBuffer containing the vector data
   * @returns A new Vector2d instance
   */
  static fromArrayBuffer(arrayBuffer: ArrayBuffer): Vector2d {
    return new Vector2d(new Float64Array(arrayBuffer));
  }

  /**
   * Creates a vector from a Float64Array.
   *
   * @param float64Array - The Float64Array containing the vector data
   * @returns A new Vector2d instance
   */
  static fromFloat64Array(float64Array: Float64Array): Vector2d {
    return new Vector2d(float64Array);
  }

  /**
   * Creates a zero vector (0, 0).
   *
   * @returns A new zero Vector2d instance
   */
  static zero() {
    return super._zero(Float64Array) as Vector2d;
  }

  /**
   * Creates a one vector (1, 1).
   *
   * @returns A new one Vector2d instance
   */
  static one() {
    return super._one(Float64Array) as Vector2d;
  }

  /**
   * Creates a dummy vector with no components.
   *
   * @returns A new dummy Vector2d instance
   */
  static dummy() {
    return super._dummy(Float64Array) as Vector2d;
  }

  /**
   * Normalizes a vector to unit length.
   *
   * @param vec - The vector to normalize
   * @returns A new normalized Vector2d instance
   */
  static normalize(vec: IVector2) {
    return super._normalize(vec, Float64Array) as Vector2d;
  }

  /**
   * Adds two vectors component-wise.
   *
   * @param l_vec - The left vector operand
   * @param r_vec - The right vector operand
   * @returns A new Vector2d instance containing the sum
   */
  static add(l_vec: IVector2, r_vec: IVector2) {
    return super._add(l_vec, r_vec, Float64Array) as Vector2d;
  }

  /**
   * Subtracts the right vector from the left vector component-wise.
   *
   * @param l_vec - The left vector operand
   * @param r_vec - The right vector operand
   * @returns A new Vector2d instance containing the difference
   */
  static subtract(l_vec: IVector2, r_vec: IVector2) {
    return super._subtract(l_vec, r_vec, Float64Array) as Vector2d;
  }

  /**
   * Multiplies a vector by a scalar value.
   *
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @returns A new Vector2d instance containing the scaled result
   */
  static multiply(vec: IVector2, value: number) {
    return super._multiply(vec, value, Float64Array) as Vector2d;
  }

  /**
   * Multiplies two vectors component-wise.
   *
   * @param l_vec - The left vector operand
   * @param r_vec - The right vector operand
   * @returns A new Vector2d instance containing the component-wise product
   */
  static multiplyVector(l_vec: IVector2, r_vec: IVector2) {
    return super._multiplyVector(l_vec, r_vec, Float64Array) as Vector2d;
  }

  /**
   * Divides a vector by a scalar value.
   *
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @returns A new Vector2d instance containing the divided result
   */
  static divide(vec: IVector2, value: number) {
    return super._divide(vec, value, Float64Array) as Vector2d;
  }

  /**
   * Divides the left vector by the right vector component-wise.
   *
   * @param l_vec - The left vector operand (dividend)
   * @param r_vec - The right vector operand (divisor)
   * @returns A new Vector2d instance containing the component-wise division result
   */
  static divideVector(l_vec: IVector2, r_vec: IVector2) {
    return super._divideVector(l_vec, r_vec, Float64Array) as Vector2d;
  }

  /**
   * Creates a clone of this vector.
   *
   * @returns A new Vector2d instance with the same components
   */
  clone() {
    return super.clone() as Vector2d;
  }
}

/**
 * Type alias for Vector2 using 32-bit float components.
 */
export type Vector2f = Vector2;

/**
 * Constant Vector2 instance representing (1, 1).
 */
export const ConstVector2_1_1 = Vector2.fromCopy2(1, 1);

/**
 * Constant Vector2 instance representing (0, 0).
 */
export const ConstVector2_0_0 = Vector2.fromCopy2(0, 0);
