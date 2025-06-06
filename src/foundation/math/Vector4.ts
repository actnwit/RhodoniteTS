import type { IVector2, IVector3, IVector4, IMutableVector4 } from './IVector';
import type { Array4, FloatTypedArray, FloatTypedArrayConstructor } from '../../types/CommonTypes';
import { MathUtil } from './MathUtil';
import { CompositionType } from '../definitions/CompositionType';
import { AbstractVector } from './AbstractVector';
import { Logger } from '../misc/Logger';

/**
 * Generic 4D vector class that serves as the base implementation for both 32-bit and 64-bit vector types.
 * This class provides immutable vector operations with support for different floating-point precisions.
 *
 * @template T - The typed array constructor type (Float32ArrayConstructor or Float64ArrayConstructor)
 * @internal This class is not intended for direct instantiation by users
 */
export class Vector4_<T extends FloatTypedArrayConstructor> extends AbstractVector implements IVector4 {
  /**
   * Creates a new Vector4_ instance.
   *
   * @param v - The underlying typed array containing the vector components
   * @param options - Configuration object containing the array type constructor
   * @protected This constructor is protected to prevent direct instantiation
   */
  protected constructor(v: FloatTypedArray, { type }: { type: T }) {
    super();
    this._v = v;
  }

  /**
   * Gets the X component of the vector.
   *
   * @returns The X component value
   */
  get x(): number {
    return this._v[0];
  }

  /**
   * Gets the Y component of the vector.
   *
   * @returns The Y component value
   */
  get y(): number {
    return this._v[1];
  }

  /**
   * Gets the Z component of the vector.
   *
   * @returns The Z component value
   */
  get z(): number {
    return this._v[2];
  }

  /**
   * Gets the W component of the vector.
   *
   * @returns The W component value
   */
  get w(): number {
    return this._v[3];
  }

  /**
   * Converts the vector to a GLSL vec4 string representation with float precision.
   *
   * @returns A GLSL-compatible vec4 string (e.g., "vec4(1.0, 2.0, 3.0, 4.0)")
   */
  get glslStrAsFloat() {
    return `vec4(${MathUtil.convertToStringAsGLSLFloat(
      this._v[0]
    )}, ${MathUtil.convertToStringAsGLSLFloat(this._v[1])}, ${MathUtil.convertToStringAsGLSLFloat(
      this._v[2]
    )}, ${MathUtil.convertToStringAsGLSLFloat(this._v[3])})`;
  }

  /**
   * Converts the vector to a GLSL ivec4 string representation with integer values.
   *
   * @returns A GLSL-compatible ivec4 string (e.g., "ivec4(1, 2, 3, 4)")
   */
  get glslStrAsInt() {
    return `ivec4(${Math.floor(this._v[0])}, ${Math.floor(this._v[1])}, ${Math.floor(
      this._v[2]
    )}, ${Math.floor(this._v[3])})`;
  }

  /**
   * Converts the vector to a WGSL vec4f string representation with float precision.
   *
   * @returns A WGSL-compatible vec4f string (e.g., "vec4f(1.0, 2.0, 3.0, 4.0)")
   */
  get wgslStrAsFloat() {
    return `vec4f(${MathUtil.convertToStringAsGLSLFloat(
      this._v[0]
    )}, ${MathUtil.convertToStringAsGLSLFloat(this._v[1])}, ${MathUtil.convertToStringAsGLSLFloat(
      this._v[2]
    )}, ${MathUtil.convertToStringAsGLSLFloat(this._v[3])})`;
  }

  /**
   * Converts the vector to a WGSL vec4i string representation with integer values.
   *
   * @returns A WGSL-compatible vec4i string (e.g., "vec4i(1, 2, 3, 4)")
   */
  get wgslStrAsInt() {
    return `vec4i(${Math.floor(this._v[0])}, ${Math.floor(this._v[1])}, ${Math.floor(
      this._v[2]
    )}, ${Math.floor(this._v[3])})`;
  }

  /**
   * Creates a new vector from a 4-element array by copying the values.
   *
   * @param array - Array containing exactly 4 numeric values [x, y, z, w]
   * @param type - The typed array constructor to use for internal storage
   * @returns A new vector instance with the copied values
   * @static
   */
  static _fromCopyArray4(array: Array4<number>, type: FloatTypedArrayConstructor) {
    return new this(new type(array), { type });
  }

  /**
   * Creates a new vector from individual component values.
   *
   * @param x - The X component value
   * @param y - The Y component value
   * @param z - The Z component value
   * @param w - The W component value
   * @param type - The typed array constructor to use for internal storage
   * @returns A new vector instance with the specified component values
   * @static
   */
  static _fromCopy4(x: number, y: number, z: number, w: number, type: FloatTypedArrayConstructor) {
    return new this(new type([x, y, z, w]), { type });
  }

  /**
   * Creates a new vector from an array by copying the first 4 values.
   * If the array has fewer than 4 elements, the remaining components will be undefined.
   *
   * @param array - Array containing numeric values (at least 4 elements recommended)
   * @param type - The typed array constructor to use for internal storage
   * @returns A new vector instance with the first 4 values from the array
   * @static
   */
  static _fromCopyArray(array: Array<number>, type: FloatTypedArrayConstructor) {
    return new this(new type(array.slice(0, 4)), { type });
  }

  /**
   * Creates a new vector by copying values from another Vector4.
   *
   * @param vec4 - The source Vector4 to copy from
   * @param type - The typed array constructor to use for internal storage
   * @returns A new vector instance with copied values from the source vector
   * @static
   */
  static _fromCopyVector4(vec4: IVector4, type: FloatTypedArrayConstructor) {
    const vec = new this(new type([vec4._v[0], vec4._v[1], vec4._v[2], vec4._v[3]]), { type });
    return vec;
  }

  /**
   * Creates a new Vector4 from a Vector3, setting the W component to 1.
   * This is commonly used for converting 3D positions to homogeneous coordinates.
   *
   * @param vec3 - The source Vector3 to copy from
   * @param type - The typed array constructor to use for internal storage
   * @returns A new Vector4 with (vec3.x, vec3.y, vec3.z, 1.0)
   * @static
   */
  static _fromCopyVector3(vec3: IVector3, type: FloatTypedArrayConstructor) {
    const vec = new this(new type([vec3._v[0], vec3._v[1], vec3._v[2], 1]), {
      type,
    });
    return vec;
  }

  /**
   * Creates a new Vector4 from a Vector2, setting Z to 0 and W to 1.
   * This is commonly used for converting 2D positions to homogeneous coordinates.
   *
   * @param vec2 - The source Vector2 to copy from
   * @param type - The typed array constructor to use for internal storage
   * @returns A new Vector4 with (vec2.x, vec2.y, 0.0, 1.0)
   * @static
   */
  static _fromVector2(vec2: IVector2, type: FloatTypedArrayConstructor) {
    const vec = new this(new type([vec2._v[0], vec2._v[1], 0, 1]), {
      type,
    });
    return vec;
  }

  /**
   * Gets the composition type identifier for this vector type.
   *
   * @returns The CompositionType.Vec4 identifier
   * @static
   */
  static get compositionType() {
    return CompositionType.Vec4;
  }

  /**
   * Calculates the squared length (magnitude) of a vector.
   * This is more efficient than length() when only comparing magnitudes.
   *
   * @param vec - The vector to calculate squared length for
   * @returns The squared length of the vector
   * @static
   */
  static lengthSquared(vec: IVector4) {
    return vec.lengthSquared();
  }

  /**
   * Calculates the distance between two vectors.
   *
   * @param l_vec - The first vector
   * @param r_vec - The second vector
   * @returns The distance between the two vectors
   * @static
   */
  static lengthBtw(l_vec: IVector4, r_vec: IVector4) {
    return l_vec.lengthTo(r_vec);
  }

  /**
   * Creates a zero vector (0, 0, 0, 0).
   *
   * @param type - The typed array constructor to use for internal storage
   * @returns A new zero vector
   * @static
   */
  static _zero(type: FloatTypedArrayConstructor) {
    return new this(new type([0, 0, 0, 0]), { type });
  }

  /**
   * Creates a vector with all components set to 1 (1, 1, 1, 1).
   *
   * @param type - The typed array constructor to use for internal storage
   * @returns A new vector with all components set to 1
   * @static
   */
  static _one(type: FloatTypedArrayConstructor) {
    return new this(new type([1, 1, 1, 1]), { type });
  }

  /**
   * Creates a dummy vector with no components (empty array).
   * This is used as a placeholder when a vector is needed but not yet initialized.
   *
   * @param type - The typed array constructor to use for internal storage
   * @returns A new dummy vector with empty components
   * @static
   */
  static _dummy(type: FloatTypedArrayConstructor) {
    return new this(new type([]), { type });
  }

  /**
   * Creates a normalized version of the given vector.
   * A normalized vector has a length of 1 while maintaining its direction.
   *
   * @param vec - The vector to normalize
   * @param type - The typed array constructor to use for internal storage
   * @returns A new normalized vector
   * @static
   */
  static _normalize(vec: IVector4, type: FloatTypedArrayConstructor) {
    const length = vec.length();
    return this._divide(vec, length, type);
  }

  /**
   * Adds two vectors component-wise and returns a new vector.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @param type - The typed array constructor to use for internal storage
   * @returns A new vector containing the sum (l_vec + r_vec)
   * @static
   */
  static _add(l_vec: IVector4, r_vec: IVector4, type: FloatTypedArrayConstructor) {
    const x = l_vec._v[0] + r_vec._v[0];
    const y = l_vec._v[1] + r_vec._v[1];
    const z = l_vec._v[2] + r_vec._v[2];
    const w = l_vec._v[3] + r_vec._v[3];
    return new this(new type([x, y, z, w]), { type });
  }

  /**
   * Adds two vectors component-wise and stores the result in the output vector.
   * This method modifies the output vector in-place for better performance.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @param out - The output vector to store the result (will be modified)
   * @returns The modified output vector containing the sum
   * @static
   */
  static addTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4) {
    out._v[0] = l_vec._v[0] + r_vec._v[0];
    out._v[1] = l_vec._v[1] + r_vec._v[1];
    out._v[2] = l_vec._v[2] + r_vec._v[2];
    out._v[3] = l_vec._v[3] + r_vec._v[3];
    return out;
  }

  /**
   * Subtracts the right vector from the left vector component-wise and returns a new vector.
   *
   * @param l_vec - The left operand vector (minuend)
   * @param r_vec - The right operand vector (subtrahend)
   * @param type - The typed array constructor to use for internal storage
   * @returns A new vector containing the difference (l_vec - r_vec)
   * @static
   */
  static _subtract(l_vec: IVector4, r_vec: IVector4, type: FloatTypedArrayConstructor) {
    const x = l_vec._v[0] - r_vec._v[0];
    const y = l_vec._v[1] - r_vec._v[1];
    const z = l_vec._v[2] - r_vec._v[2];
    const w = l_vec._v[3] - r_vec._v[3];
    return new this(new type([x, y, z, w]), { type });
  }

  /**
   * Subtracts the right vector from the left vector component-wise and stores the result in the output vector.
   * This method modifies the output vector in-place for better performance.
   *
   * @param l_vec - The left operand vector (minuend)
   * @param r_vec - The right operand vector (subtrahend)
   * @param out - The output vector to store the result (will be modified)
   * @returns The modified output vector containing the difference
   * @static
   */
  static subtractTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4) {
    out._v[0] = l_vec._v[0] - r_vec._v[0];
    out._v[1] = l_vec._v[1] - r_vec._v[1];
    out._v[2] = l_vec._v[2] - r_vec._v[2];
    out._v[3] = l_vec._v[3] - r_vec._v[3];
    return out;
  }

  /**
   * Multiplies a vector by a scalar value and returns a new vector.
   * This operation scales the vector while preserving its direction.
   *
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @param type - The typed array constructor to use for internal storage
   * @returns A new vector with each component multiplied by the scalar
   * @static
   */
  static _multiply(vec: IVector4, value: number, type: FloatTypedArrayConstructor) {
    const x = vec._v[0] * value;
    const y = vec._v[1] * value;
    const z = vec._v[2] * value;
    const w = vec._v[3] * value;
    return new this(new type([x, y, z, w]), { type });
  }

  /**
   * Multiplies a vector by a scalar value and stores the result in the output vector.
   * This method modifies the output vector in-place for better performance.
   *
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @param out - The output vector to store the result (will be modified)
   * @returns The modified output vector with each component multiplied by the scalar
   * @static
   */
  static multiplyTo(vec: IVector4, value: number, out: IMutableVector4) {
    out._v[0] = vec._v[0] * value;
    out._v[1] = vec._v[1] * value;
    out._v[2] = vec._v[2] * value;
    out._v[3] = vec._v[3] * value;
    return out;
  }

  /**
   * Multiplies two vectors component-wise and returns a new vector.
   * This is also known as the Hadamard product or element-wise multiplication.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @param type - The typed array constructor to use for internal storage
   * @returns A new vector with each component being the product of corresponding components
   * @static
   */
  static _multiplyVector(l_vec: IVector4, r_vec: IVector4, type: FloatTypedArrayConstructor) {
    const x = l_vec._v[0] * r_vec._v[0];
    const y = l_vec._v[1] * r_vec._v[1];
    const z = l_vec._v[2] * r_vec._v[2];
    const w = l_vec._v[3] * r_vec._v[3];
    return new this(new type([x, y, z, w]), { type });
  }

  /**
   * Multiplies two vectors component-wise and stores the result in the output vector.
   * This method modifies the output vector in-place for better performance.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @param out - The output vector to store the result (will be modified)
   * @returns The modified output vector with component-wise multiplication result
   * @static
   */
  static multiplyVectorTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4) {
    out._v[0] = l_vec._v[0] * r_vec._v[0];
    out._v[1] = l_vec._v[1] * r_vec._v[1];
    out._v[2] = l_vec._v[2] * r_vec._v[2];
    out._v[3] = l_vec._v[3] * r_vec._v[3];
    return out;
  }

  /**
   * Divides a vector by a scalar value and returns a new vector.
   * If the divisor is zero, the result components will be set to Infinity and an error will be logged.
   *
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @param type - The typed array constructor to use for internal storage
   * @returns A new vector with each component divided by the scalar
   * @static
   */
  static _divide(vec: IVector4, value: number, type: FloatTypedArrayConstructor) {
    let x;
    let y;
    let z;
    let w;
    if (value !== 0) {
      x = vec._v[0] / value;
      y = vec._v[1] / value;
      z = vec._v[2] / value;
      w = vec._v[3] / value;
    } else {
      Logger.error('0 division occurred!');
      x = Number.POSITIVE_INFINITY;
      y = Number.POSITIVE_INFINITY;
      z = Number.POSITIVE_INFINITY;
      w = Number.POSITIVE_INFINITY;
    }
    return new this(new type([x, y, z, w]), { type });
  }

  /**
   * Divides a vector by a scalar value and stores the result in the output vector.
   * If the divisor is zero, the result components will be set to Infinity and an error will be logged.
   * This method modifies the output vector in-place for better performance.
   *
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @param out - The output vector to store the result (will be modified)
   * @returns The modified output vector with each component divided by the scalar
   * @static
   */
  static divideTo(vec: IVector4, value: number, out: IMutableVector4) {
    if (value !== 0) {
      out._v[0] = vec._v[0] / value;
      out._v[1] = vec._v[1] / value;
      out._v[2] = vec._v[2] / value;
      out._v[3] = vec._v[3] / value;
    } else {
      Logger.error('0 division occurred!');
      out._v[0] = Number.POSITIVE_INFINITY;
      out._v[1] = Number.POSITIVE_INFINITY;
      out._v[2] = Number.POSITIVE_INFINITY;
      out._v[3] = Number.POSITIVE_INFINITY;
    }
    return out;
  }

  /**
   * Divides the left vector by the right vector component-wise and returns a new vector.
   * If any component of the right vector is zero, the corresponding result component will be set to Infinity.
   *
   * @param l_vec - The left operand vector (dividend)
   * @param r_vec - The right operand vector (divisor)
   * @param type - The typed array constructor to use for internal storage
   * @returns A new vector with component-wise division result
   * @static
   */
  static _divideVector(l_vec: IVector4, r_vec: IVector4, type: FloatTypedArrayConstructor) {
    let x;
    let y;
    let z;
    let w;
    if (r_vec._v[0] !== 0 && r_vec._v[1] !== 0 && r_vec._v[2] !== 0 && r_vec._v[3] !== 0) {
      x = l_vec._v[0] / r_vec._v[0];
      y = l_vec._v[1] / r_vec._v[1];
      z = l_vec._v[2] / r_vec._v[2];
      w = l_vec._v[3] / r_vec._v[3];
    } else {
      Logger.error('0 division occurred!');
      x = r_vec._v[0] === 0 ? Number.POSITIVE_INFINITY : l_vec._v[0] / r_vec._v[0];
      y = r_vec._v[1] === 0 ? Number.POSITIVE_INFINITY : l_vec._v[1] / r_vec._v[1];
      z = r_vec._v[2] === 0 ? Number.POSITIVE_INFINITY : l_vec._v[2] / r_vec._v[2];
      w = r_vec._v[3] === 0 ? Number.POSITIVE_INFINITY : l_vec._v[3] / r_vec._v[3];
    }
    return new this(new type([x, y, z, w]), { type });
  }

  /**
   * Divides the left vector by the right vector component-wise and stores the result in the output vector.
   * If any component of the right vector is zero, the corresponding result component will be set to Infinity.
   * This method modifies the output vector in-place for better performance.
   *
   * @param l_vec - The left operand vector (dividend)
   * @param r_vec - The right operand vector (divisor)
   * @param out - The output vector to store the result (will be modified)
   * @returns The modified output vector with component-wise division result
   * @static
   */
  static divideVectorTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4) {
    if (r_vec._v[0] !== 0 && r_vec._v[1] !== 0 && r_vec._v[2] !== 0 && r_vec._v[3] !== 0) {
      out._v[0] = l_vec._v[0] / r_vec._v[0];
      out._v[1] = l_vec._v[1] / r_vec._v[1];
      out._v[2] = l_vec._v[2] / r_vec._v[2];
      out._v[3] = l_vec._v[3] / r_vec._v[3];
    } else {
      Logger.error('0 division occurred!');
      out._v[0] = r_vec._v[0] === 0 ? Number.POSITIVE_INFINITY : l_vec._v[0] / r_vec._v[0];
      out._v[1] = r_vec._v[1] === 0 ? Number.POSITIVE_INFINITY : l_vec._v[1] / r_vec._v[1];
      out._v[2] = r_vec._v[2] === 0 ? Number.POSITIVE_INFINITY : l_vec._v[2] / r_vec._v[2];
      out._v[3] = r_vec._v[3] === 0 ? Number.POSITIVE_INFINITY : l_vec._v[3] / r_vec._v[3];
    }
    return out;
  }

  /**
   * Calculates the dot product of two vectors.
   * The dot product is the sum of the products of corresponding components.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns The dot product of the two vectors
   * @static
   */
  static dot(l_vec: IVector4, r_vec: IVector4) {
    return l_vec.dot(r_vec);
  }

  /**
   * Converts the vector to a string representation in the format "(x, y, z, w)".
   *
   * @returns A string representation of the vector
   */
  toString() {
    return '(' + this._v[0] + ', ' + this._v[1] + ', ' + this._v[2] + ', ' + this._v[3] + ')';
  }

  /**
   * Converts the vector to an approximately formatted string representation with financial precision.
   * Each component is formatted to a fixed number of decimal places.
   *
   * @returns A string with space-separated components followed by a newline
   */
  toStringApproximately() {
    return (
      MathUtil.financial(this._v[0]) +
      ' ' +
      MathUtil.financial(this._v[1]) +
      ' ' +
      MathUtil.financial(this._v[2]) +
      ' ' +
      MathUtil.financial(this._v[3]) +
      '\n'
    );
  }

  /**
   * Converts the vector to a flat array representation.
   *
   * @returns An array containing the vector components [x, y, z, w]
   */
  flattenAsArray() {
    return [this._v[0], this._v[1], this._v[2], this._v[3]];
  }

  /**
   * Checks if this vector is a dummy vector (has no components).
   *
   * @returns True if the vector has no components, false otherwise
   */
  isDummy() {
    if (this._v.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Checks if this vector is approximately equal to another vector within a specified tolerance.
   *
   * @param vec - The vector to compare with
   * @param delta - The tolerance value for comparison (default: Number.EPSILON)
   * @returns True if the vectors are approximately equal, false otherwise
   */
  isEqual(vec: IVector4, delta: number = Number.EPSILON) {
    if (
      Math.abs(vec._v[0] - this._v[0]) < delta &&
      Math.abs(vec._v[1] - this._v[1]) < delta &&
      Math.abs(vec._v[2] - this._v[2]) < delta &&
      Math.abs(vec._v[3] - this._v[3]) < delta
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Checks if this vector is strictly equal to another vector (exact component equality).
   *
   * @param vec - The vector to compare with
   * @returns True if all components are exactly equal, false otherwise
   */
  isStrictEqual(vec: IVector4): boolean {
    if (this._v[0] === vec._v[0] && this._v[1] === vec._v[1] && this._v[2] === vec._v[2] && this._v[3] === vec._v[3]) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Gets the component value at the specified index.
   *
   * @param i - The index (0=x, 1=y, 2=z, 3=w)
   * @returns The component value at the specified index
   */
  at(i: number) {
    return this._v[i];
  }

  /**
   * Calculates the length (magnitude) of the vector using the Euclidean norm.
   *
   * @returns The length of the vector
   */
  length() {
    return Math.hypot(this._v[0], this._v[1], this._v[2], this._v[3]);
  }

  /**
   * Calculates the squared length (magnitude) of the vector.
   * This is more efficient than length() when only comparing magnitudes.
   *
   * @returns The squared length of the vector
   */
  lengthSquared(): number {
    return this._v[0] ** 2 + this._v[1] ** 2 + this._v[2] ** 2 + this._v[3] ** 2;
  }

  /**
   * Calculates the distance from this vector to another vector.
   *
   * @param vec - The target vector to calculate distance to
   * @returns The distance between the two vectors
   */
  lengthTo(vec: IVector4) {
    const deltaX = this._v[0] - vec._v[0];
    const deltaY = this._v[1] - vec._v[1];
    const deltaZ = this._v[2] - vec._v[2];
    const deltaW = this._v[3] - vec._v[3];
    return Math.hypot(deltaX, deltaY, deltaZ, deltaW);
  }

  /**
   * Calculates the dot product between this vector and another vector.
   * The dot product is the sum of the products of corresponding components.
   *
   * @param vec - The vector to calculate dot product with
   * @returns The dot product of the two vectors
   */
  dot(vec: IVector4) {
    return this._v[0] * vec._v[0] + this._v[1] * vec._v[1] + this._v[2] * vec._v[2] + this._v[3] * vec._v[3];
  }

  /**
   * Gets the class name of this vector type.
   *
   * @returns The string "Vector4"
   */
  get className() {
    return 'Vector4';
  }

  /**
   * Creates a deep copy of this vector.
   *
   * @returns A new vector instance with the same component values
   */
  clone() {
    return new (this.constructor as any)(
      new (this._v.constructor as any)([this._v[0], this._v[1], this._v[2], this._v[3]])
    );
  }

  /**
   * Gets the number of bytes per component in the underlying typed array.
   *
   * @returns The number of bytes per element (4 for Float32Array, 8 for Float64Array)
   */
  get bytesPerComponent() {
    return this._v.BYTES_PER_ELEMENT;
  }
}

/**
 * Immutable 4D(x,y,z,w) Vector class with 32-bit float components.
 *
 * This class provides comprehensive vector operations for 4-dimensional mathematics,
 * commonly used in graphics programming for representing positions, directions,
 * colors (RGBA), and homogeneous coordinates.
 *
 * All operations return new vector instances, preserving immutability.
 * For performance-critical applications where mutation is acceptable,
 * consider using the corresponding mutable vector types or the *To methods.
 *
 * @example Basic usage:
 * ```typescript
 * const vec1 = Vector4.fromCopy4(1, 2, 3, 1);
 * const vec2 = Vector4.fromCopyArray4([2, 3, 3, 1]);
 * const dotProduct = vec1.dot(vec2);
 * const sum = Vector4.add(vec1, vec2);
 * ```
 *
 * @example Creating vectors from different sources:
 * ```typescript
 * const fromArray = Vector4.fromCopyArray([1, 2, 3, 4, 5]); // Takes first 4 elements
 * const fromVec3 = Vector4.fromCopyVector3(someVector3); // W component set to 1
 * const zero = Vector4.zero();
 * const normalized = Vector4.normalize(someVector);
 * ```
 */
export class Vector4 extends Vector4_<Float32ArrayConstructor> {
  /**
   * Creates a new Vector4 instance from a Float32Array.
   *
   * @param x - The Float32Array containing vector components
   */
  constructor(x: Float32Array) {
    super(x, { type: Float32Array });
  }

  /**
   * Creates a new Vector4 by copying values from an array.
   * Takes the first 4 elements from the array. If the array has fewer than 4 elements,
   * the remaining components will be undefined.
   *
   * @param array - Array containing numeric values (at least 4 elements recommended)
   * @returns A new Vector4 instance with copied values
   * @static
   */
  static fromCopyArray(array: Array<number>): Vector4 {
    return super._fromCopyArray(array, Float32Array);
  }

  /**
   * Creates a new Vector4 from a 4-element array by copying the values.
   *
   * @param array - Array containing exactly 4 numeric values [x, y, z, w]
   * @returns A new Vector4 instance with the copied values
   * @static
   */
  static fromCopyArray4(array: Array4<number>): Vector4 {
    return super._fromCopyArray4(array, Float32Array);
  }

  /**
   * Creates a new Vector4 from individual component values.
   *
   * @param x - The X component value
   * @param y - The Y component value
   * @param z - The Z component value
   * @param w - The W component value
   * @returns A new Vector4 instance with the specified component values
   * @static
   */
  static fromCopy4(x: number, y: number, z: number, w: number): Vector4 {
    return super._fromCopy4(x, y, z, w, Float32Array);
  }

  /**
   * Creates a new Vector4 from a Vector3, setting the W component to 1.
   * This is commonly used for converting 3D positions to homogeneous coordinates.
   *
   * @param vec3 - The source Vector3 to copy from
   * @returns A new Vector4 with (vec3.x, vec3.y, vec3.z, 1.0)
   * @static
   */
  static fromCopyVector3(vec3: IVector3): Vector4 {
    return super._fromCopyVector3(vec3, Float32Array);
  }

  /**
   * Creates a new Vector4 by copying values from another Vector4.
   *
   * @param vec4 - The source Vector4 to copy from
   * @returns A new Vector4 instance with copied values from the source vector
   * @static
   */
  static fromCopyVector4(vec4: IVector4): Vector4 {
    return super._fromCopyVector4(vec4, Float32Array);
  }

  /**
   * Creates a new Vector4 from an ArrayBuffer.
   * The ArrayBuffer should contain at least 16 bytes (4 float32 values).
   *
   * @param arrayBuffer - The ArrayBuffer containing vector data
   * @returns A new Vector4 instance using the ArrayBuffer data
   * @static
   */
  static fromArrayBuffer(arrayBuffer: ArrayBuffer): Vector4 {
    return new Vector4(new Float32Array(arrayBuffer));
  }

  /**
   * Creates a new Vector4 from a Float32Array.
   * The Float32Array is used directly without copying.
   *
   * @param float32Array - The Float32Array containing vector components
   * @returns A new Vector4 instance using the provided Float32Array
   * @static
   */
  static fromFloat32Array(float32Array: Float32Array): Vector4 {
    return new Vector4(float32Array);
  }

  /**
   * Creates a new Vector4 by copying from a Float32Array.
   * This creates a new Float32Array copy of the input data.
   *
   * @param float32Array - The Float32Array to copy from
   * @returns A new Vector4 instance with copied Float32Array data
   * @static
   */
  static fromCopyFloat32Array(float32Array: Float32Array): Vector4 {
    return new Vector4(float32Array.slice(0));
  }

  /**
   * Creates a zero vector (0, 0, 0, 0).
   *
   * @returns A new Vector4 with all components set to zero
   * @static
   */
  static zero() {
    return super._zero(Float32Array) as Vector4;
  }

  /**
   * Creates a vector with all components set to 1 (1, 1, 1, 1).
   *
   * @returns A new Vector4 with all components set to 1
   * @static
   */
  static one() {
    return super._one(Float32Array) as Vector4;
  }

  /**
   * Creates a dummy vector with no components (empty array).
   * This is used as a placeholder when a vector is needed but not yet initialized.
   *
   * @returns A new dummy Vector4 with empty components
   * @static
   */
  static dummy() {
    return super._dummy(Float32Array) as Vector4;
  }

  /**
   * Creates a normalized version of the given vector.
   * A normalized vector has a length of 1 while maintaining its direction.
   *
   * @param vec - The vector to normalize
   * @returns A new normalized Vector4
   * @static
   */
  static normalize(vec: IVector4) {
    return super._normalize(vec, Float32Array) as Vector4;
  }

  /**
   * Adds two vectors component-wise and returns a new vector.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new Vector4 containing the sum (l_vec + r_vec)
   * @static
   */
  static add(l_vec: IVector4, r_vec: IVector4) {
    return super._add(l_vec, r_vec, Float32Array) as Vector4;
  }

  /**
   * Subtracts the right vector from the left vector component-wise and returns a new vector.
   *
   * @param l_vec - The left operand vector (minuend)
   * @param r_vec - The right operand vector (subtrahend)
   * @returns A new Vector4 containing the difference (l_vec - r_vec)
   * @static
   */
  static subtract(l_vec: IVector4, r_vec: IVector4) {
    return super._subtract(l_vec, r_vec, Float32Array) as Vector4;
  }

  /**
   * Multiplies a vector by a scalar value and returns a new vector.
   * This operation scales the vector while preserving its direction.
   *
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @returns A new Vector4 with each component multiplied by the scalar
   * @static
   */
  static multiply(vec: IVector4, value: number) {
    return super._multiply(vec, value, Float32Array) as Vector4;
  }

  /**
   * Multiplies two vectors component-wise and returns a new vector.
   * This is also known as the Hadamard product or element-wise multiplication.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new Vector4 with each component being the product of corresponding components
   * @static
   */
  static multiplyVector(l_vec: IVector4, r_vec: IVector4) {
    return super._multiplyVector(l_vec, r_vec, Float32Array) as Vector4;
  }

  /**
   * Divides a vector by a scalar value and returns a new vector.
   * If the divisor is zero, the result components will be set to Infinity and an error will be logged.
   *
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @returns A new Vector4 with each component divided by the scalar
   * @static
   */
  static divide(vec: IVector4, value: number) {
    return super._divide(vec, value, Float32Array) as Vector4;
  }

  /**
   * Divides the left vector by the right vector component-wise and returns a new vector.
   * If any component of the right vector is zero, the corresponding result component will be set to Infinity.
   *
   * @param l_vec - The left operand vector (dividend)
   * @param r_vec - The right operand vector (divisor)
   * @returns A new Vector4 with component-wise division result
   * @static
   */
  static divideVector(l_vec: IVector4, r_vec: IVector4) {
    return super._divideVector(l_vec, r_vec, Float32Array) as Vector4;
  }

  /**
   * Creates a deep copy of this vector.
   *
   * @returns A new Vector4 instance with the same component values
   */
  clone() {
    return super.clone() as Vector4;
  }
}

/**
 * Immutable 4D(x,y,z,w) Vector class with 64-bit float components.
 *
 * This class provides the same functionality as Vector4 but with double precision
 * floating-point components. Use this when higher precision is required for
 * mathematical calculations or when working with very large or very small numbers.
 *
 * @example Basic usage:
 * ```typescript
 * const vec1 = Vector4d.fromCopy4(1.0, 2.0, 3.0, 1.0);
 * const vec2 = Vector4d.fromCopyArray4([2.0, 3.0, 3.0, 1.0]);
 * const dotProduct = vec1.dot(vec2);
 * const sum = Vector4d.add(vec1, vec2);
 * ```
 */
export class Vector4d extends Vector4_<Float64ArrayConstructor> {
  /**
   * Creates a new Vector4d instance from a Float64Array.
   *
   * @param x - The Float64Array containing vector components
   * @private This constructor is private to prevent direct instantiation
   */
  private constructor(x: Float64Array) {
    super(x, { type: Float64Array });
  }

  /**
   * Creates a new Vector4d from a 4-element array by copying the values.
   *
   * @param array - Array containing exactly 4 numeric values [x, y, z, w]
   * @returns A new Vector4d instance with the copied values
   * @static
   */
  static fromCopyArray4(array: Array4<number>): Vector4d {
    return super._fromCopyArray4(array, Float64Array) as Vector4d;
  }

  /**
   * Creates a new Vector4d from individual component values.
   *
   * @param x - The X component value
   * @param y - The Y component value
   * @param z - The Z component value
   * @param w - The W component value
   * @returns A new Vector4d instance with the specified component values
   * @static
   */
  static fromCopy4(x: number, y: number, z: number, w: number): Vector4d {
    return super._fromCopy4(x, y, z, w, Float64Array);
  }

  /**
   * Creates a new Vector4d by copying values from an array.
   * Takes the first 4 elements from the array. If the array has fewer than 4 elements,
   * the remaining components will be undefined.
   *
   * @param array - Array containing numeric values (at least 4 elements recommended)
   * @returns A new Vector4d instance with copied values
   * @static
   */
  static fromCopyArray(array: Array4<number>): Vector4d {
    return super._fromCopyArray(array, Float64Array) as Vector4d;
  }

  /**
   * Creates a new Vector4d from an ArrayBuffer.
   * The ArrayBuffer should contain at least 32 bytes (4 float64 values).
   *
   * @param arrayBuffer - The ArrayBuffer containing vector data
   * @returns A new Vector4d instance using the ArrayBuffer data
   * @static
   */
  static fromArrayBuffer(arrayBuffer: ArrayBuffer): Vector4d {
    return new Vector4d(new Float64Array(arrayBuffer));
  }

  /**
   * Creates a new Vector4d from a Float64Array.
   * The Float64Array is used directly without copying.
   *
   * @param float64Array - The Float64Array containing vector components
   * @returns A new Vector4d instance using the provided Float64Array
   * @static
   */
  static fromFloat64Array(float64Array: Float64Array): Vector4d {
    return new Vector4d(float64Array);
  }

  /**
   * Creates a zero vector (0, 0, 0, 0).
   *
   * @returns A new Vector4d with all components set to zero
   * @static
   */
  static zero() {
    return super._zero(Float64Array) as Vector4d;
  }

  /**
   * Creates a vector with all components set to 1 (1, 1, 1, 1).
   *
   * @returns A new Vector4d with all components set to 1
   * @static
   */
  static one() {
    return super._one(Float64Array) as Vector4d;
  }

  /**
   * Creates a dummy vector with no components (empty array).
   * This is used as a placeholder when a vector is needed but not yet initialized.
   *
   * @returns A new dummy Vector4d with empty components
   * @static
   */
  static dummy() {
    return super._dummy(Float64Array) as Vector4d;
  }

  /**
   * Creates a normalized version of the given vector.
   * A normalized vector has a length of 1 while maintaining its direction.
   *
   * @param vec - The vector to normalize
   * @returns A new normalized Vector4d
   * @static
   */
  static normalize(vec: IVector4) {
    return super._normalize(vec, Float64Array) as Vector4d;
  }

  /**
   * Adds two vectors component-wise and returns a new vector.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new Vector4d containing the sum (l_vec + r_vec)
   * @static
   */
  static add(l_vec: IVector4, r_vec: IVector4) {
    return super._add(l_vec, r_vec, Float64Array) as Vector4d;
  }

  /**
   * Subtracts the right vector from the left vector component-wise and returns a new vector.
   *
   * @param l_vec - The left operand vector (minuend)
   * @param r_vec - The right operand vector (subtrahend)
   * @returns A new Vector4d containing the difference (l_vec - r_vec)
   * @static
   */
  static subtract(l_vec: IVector4, r_vec: IVector4) {
    return super._subtract(l_vec, r_vec, Float64Array) as Vector4d;
  }

  /**
   * Multiplies a vector by a scalar value and returns a new vector.
   * This operation scales the vector while preserving its direction.
   *
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @returns A new Vector4d with each component multiplied by the scalar
   * @static
   */
  static multiply(vec: IVector4, value: number) {
    return super._multiply(vec, value, Float64Array) as Vector4d;
  }

  /**
   * Multiplies two vectors component-wise and returns a new vector.
   * This is also known as the Hadamard product or element-wise multiplication.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new Vector4d with each component being the product of corresponding components
   * @static
   */
  static multiplyVector(l_vec: IVector4, r_vec: IVector4) {
    return super._multiplyVector(l_vec, r_vec, Float64Array) as Vector4d;
  }

  /**
   * Divides a vector by a scalar value and returns a new vector.
   * If the divisor is zero, the result components will be set to Infinity and an error will be logged.
   *
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @returns A new Vector4d with each component divided by the scalar
   * @static
   */
  static divide(vec: IVector4, value: number) {
    return super._divide(vec, value, Float64Array) as Vector4d;
  }

  /**
   * Divides the left vector by the right vector component-wise and returns a new vector.
   * If any component of the right vector is zero, the corresponding result component will be set to Infinity.
   *
   * @param l_vec - The left operand vector (dividend)
   * @param r_vec - The right operand vector (divisor)
   * @returns A new Vector4d with component-wise division result
   * @static
   */
  static divideVector(l_vec: IVector4, r_vec: IVector4) {
    return super._divideVector(l_vec, r_vec, Float64Array) as Vector4d;
  }

  /**
   * Creates a deep copy of this vector.
   *
   * @returns A new Vector4d instance with the same component values
   */
  clone() {
    return super.clone() as Vector4d;
  }
}

/**
 * Type alias for Vector4 to provide a consistent naming convention.
 * Vector4f explicitly indicates 32-bit float precision.
 */
export type Vector4f = Vector4;

/**
 * Constant Vector4 with all components set to 1 (1, 1, 1, 1).
 * Useful for initialization and mathematical operations.
 */
export const ConstVector4_1_1_1_1 = Vector4.fromCopy4(1, 1, 1, 1);

/**
 * Constant Vector4 representing a homogeneous coordinate with W=1 (0, 0, 0, 1).
 * Commonly used for representing positions in homogeneous coordinates.
 */
export const ConstVector4_0_0_0_1 = Vector4.fromCopy4(0, 0, 0, 1);

/**
 * Constant Vector4 with all components set to 0 (0, 0, 0, 0).
 * Represents the zero vector or null vector.
 */
export const ConstVector4_0_0_0_0 = Vector4.fromCopy4(0, 0, 0, 0);
