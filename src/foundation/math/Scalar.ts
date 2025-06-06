import { IScalar } from './IVector';
import { FloatTypedArrayConstructor, TypedArray, TypedArrayConstructor } from '../../types/CommonTypes';
import { MathUtil } from './MathUtil';
import { AbstractVector } from './AbstractVector';
import { CompositionType } from '../definitions/CompositionType';

/**
 * Abstract base class for scalar values using typed arrays.
 * Provides common functionality for both 32-bit and 64-bit floating-point scalar implementations.
 * @template T - The typed array constructor type
 * @internal
 */
export class Scalar_<T extends TypedArrayConstructor> extends AbstractVector {
  /**
   * Creates a new scalar instance.
   * @param v - The typed array containing the scalar value
   * @param options - Configuration object containing the array type
   * @param options.type - The typed array constructor type
   */
  constructor(v: TypedArray, { type }: { type: T }) {
    super();
    this._v = v;
  }

  /**
   * Gets the scalar value as a number.
   * @returns The scalar value
   */
  getValue() {
    return this._v[0];
  }

  /**
   * Gets the scalar value wrapped in an array.
   * @returns An array containing the scalar value
   */
  getValueInArray() {
    return [this._v[0]];
  }

  /**
   * Gets the scalar value (alias for x component).
   * @returns The scalar value
   */
  get x() {
    return this._v[0];
  }

  /**
   * Gets the raw typed array containing the scalar value.
   * @returns The underlying typed array
   */
  get raw() {
    return this._v;
  }

  /**
   * Performs strict equality comparison with another scalar.
   * Uses exact floating-point comparison without tolerance.
   * @param scalar - The scalar to compare with
   * @returns True if the scalars are exactly equal, false otherwise
   */
  isStrictEqual(scalar: Scalar_<T>) {
    if (this.x === scalar.x) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Performs approximate equality comparison with another scalar within a tolerance.
   * @param scalar - The scalar to compare with
   * @param delta - The tolerance for comparison (default: Number.EPSILON)
   * @returns True if the scalars are equal within the specified tolerance
   */
  isEqual(scalar: Scalar_<T>, delta: number = Number.EPSILON) {
    if (Math.abs(scalar.x - this.x) < delta) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Gets the scalar value as a GLSL-compatible float string.
   * @returns The scalar value formatted as a GLSL float literal
   */
  get glslStrAsFloat() {
    return `${MathUtil.convertToStringAsGLSLFloat(this.x)}`;
  }

  /**
   * Gets the scalar value as a GLSL-compatible integer string.
   * @returns The scalar value formatted as a GLSL integer literal
   */
  get glslStrAsInt() {
    return `${Math.floor(this.x)}`;
  }

  /**
   * Gets the scalar value as a WGSL-compatible float string.
   * @returns The scalar value formatted as a WGSL float literal
   */
  get wgslStrAsFloat() {
    return `${MathUtil.convertToStringAsGLSLFloat(this.x)}`;
  }

  /**
   * Gets the scalar value as a WGSL-compatible integer string.
   * @returns The scalar value formatted as a WGSL integer literal
   */
  get wgslStrAsInt() {
    return `${Math.floor(this.x)}`;
  }

  /**
   * Creates a new scalar instance from a number value.
   * @param value - The numeric value to create the scalar from
   * @param type - The typed array constructor to use
   * @returns A new scalar instance
   * @protected
   */
  static _fromCopyNumber(value: number, type: FloatTypedArrayConstructor) {
    return new this(new type([value]), { type });
  }

  /**
   * Creates a dummy (uninitialized) scalar instance.
   * @param type - The typed array constructor to use
   * @returns A new dummy scalar instance
   * @protected
   */
  static _dummy(type: FloatTypedArrayConstructor) {
    return new this(new type(), { type });
  }

  /**
   * Gets the composition type for scalar values.
   * @returns The scalar composition type
   */
  static get compositionType() {
    return CompositionType.Scalar;
  }

  /**
   * Gets the number of bytes per component in the underlying typed array.
   * @returns The number of bytes per element
   */
  get bytesPerComponent() {
    return this._v.BYTES_PER_ELEMENT;
  }
}

/**
 * Immutable scalar class using 32-bit floating-point precision.
 * Represents a single floating-point value with various utility methods
 * for mathematical operations and format conversions.
 */
export class Scalar extends Scalar_<Float32ArrayConstructor> implements IScalar {
  /**
   * Creates a new 32-bit float scalar instance.
   * @param x - The typed array containing the scalar value
   */
  constructor(x: TypedArray) {
    super(x, { type: Float32Array });
  }

  /**
   * Creates a new scalar from a numeric value.
   * @param value - The numeric value to create the scalar from
   * @returns A new Scalar instance
   */
  static fromCopyNumber(value: number): Scalar {
    return super._fromCopyNumber(value, Float32Array) as Scalar;
  }

  /**
   * Creates a scalar with value zero.
   * @returns A new Scalar instance with value 0
   */
  static zero(): Scalar {
    return Scalar.fromCopyNumber(0);
  }

  /**
   * Creates a scalar with value one.
   * @returns A new Scalar instance with value 1
   */
  static one(): Scalar {
    return Scalar.fromCopyNumber(1);
  }

  /**
   * Creates a dummy (uninitialized) scalar instance.
   * @returns A new dummy Scalar instance
   */
  static dummy(): Scalar {
    return super._dummy(Float32Array) as Scalar;
  }

  /**
   * Gets the class name for debugging and reflection purposes.
   * @returns The string "Scalar"
   */
  get className() {
    return 'Scalar';
  }

  /**
   * Converts the scalar to a string representation.
   * @returns A string representation of the scalar in the format "(value)"
   */
  toString() {
    return '(' + this._v[0] + ')';
  }

  /**
   * Creates a deep copy of this scalar.
   * @returns A new Scalar instance with the same value
   */
  clone(): Scalar {
    return new Scalar(this._v) as Scalar;
  }
}

/**
 * Immutable scalar class using 64-bit floating-point precision.
 * Provides higher precision than the standard Scalar class for applications
 * requiring double-precision arithmetic.
 */
export class Scalard extends Scalar_<Float64ArrayConstructor> {
  /**
   * Creates a new 64-bit float scalar instance.
   * @param x - The typed array containing the scalar value
   */
  constructor(x: TypedArray) {
    super(x, { type: Float64Array });
  }

  /**
   * Creates a new double-precision scalar from a numeric value.
   * @param value - The numeric value to create the scalar from
   * @returns A new Scalard instance
   */
  static fromCopyNumber(value: number): Scalard {
    return super._fromCopyNumber(value, Float64Array) as Scalard;
  }

  /**
   * Creates a double-precision scalar with value zero.
   * @returns A new Scalard instance with value 0
   */
  static zero(): Scalard {
    return Scalard.fromCopyNumber(0);
  }

  /**
   * Creates a double-precision scalar with value one.
   * @returns A new Scalard instance with value 1
   */
  static one(): Scalard {
    return Scalard.fromCopyNumber(1);
  }

  /**
   * Creates a dummy (uninitialized) double-precision scalar instance.
   * @returns A new dummy Scalard instance
   */
  static dummy(): Scalard {
    return super._dummy(Float64Array) as Scalard;
  }

  /**
   * Creates a deep copy of this double-precision scalar.
   * @returns A new Scalard instance with the same value
   */
  clone(): Scalard {
    return new Scalard(this._v) as Scalard;
  }
}

/**
 * Type alias for the standard 32-bit float Scalar class.
 * Provides convenient naming for float-precision scalar operations.
 */
export type Scalarf = Scalar;
