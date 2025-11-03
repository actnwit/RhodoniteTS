import type { TypedArray, TypedArrayConstructor } from '../../types/CommonTypes';
import { CompositionType, type CompositionTypeEnum } from '../definitions/CompositionType';
import { Scalar_ } from './Scalar';

/**
 * Base class for mutable scalar values with typed array backing.
 * This class extends the immutable Scalar_ class to provide mutable operations.
 * @template T - The typed array constructor type (Float32Array, Float64Array, etc.)
 * @internal
 */
export class MutableScalar_<T extends TypedArrayConstructor> extends Scalar_<T> {
  /**
   * Creates a new mutable scalar with the specified value and type.
   * @param x - The typed array containing the scalar value
   * @param options - Configuration object containing the array type
   * @param options.type - The typed array constructor to use
   */
  constructor(x: TypedArray, { type }: { type: T }) {
    super(x, { type });
  }

  /**
   * Copies the components from another scalar to this scalar.
   * @param vec - The source scalar to copy from
   */
  copyComponents(vec: Scalar_<T>) {
    this._v[0] = vec._v[0];
  }

  /**
   * Gets the x component (scalar value).
   * @returns The scalar value
   */
  get x(): number {
    return this._v[0];
  }

  /**
   * Sets the x component (scalar value).
   * @param x - The new scalar value
   */
  set x(x: number) {
    this._v[0] = x;
  }

  /**
   * Gets the y component (always 0 for scalars).
   * @returns Always returns 0
   */
  get y(): number {
    return 0;
  }

  /**
   * Gets the z component (always 0 for scalars).
   * @returns Always returns 0
   */
  get z(): number {
    return 0;
  }

  /**
   * Gets the w component (always 1 for scalars).
   * @returns Always returns 1
   */
  get w(): number {
    return 1;
  }

  /**
   * Converts the scalar to a string representation.
   * @returns A string representation of the scalar in the format "(value)"
   */
  toString(): string {
    return `(${this._v[0]})`;
  }

  /**
   * Sets the scalar value.
   * @param value - The new scalar value
   * @returns This scalar instance for method chaining
   */
  setValue(value: number) {
    this.x = value;
    return this;
  }

  /**
   * Gets the composition type for this scalar.
   * @returns The scalar composition type
   */
  static get compositionType(): CompositionTypeEnum {
    return CompositionType.Scalar;
  }

  /**
   * Gets the number of bytes per component in the underlying typed array.
   * @returns The number of bytes per element
   */
  get bytesPerComponent(): number {
    return this._v.BYTES_PER_ELEMENT;
  }
}

/**
 * Mutable scalar class with 32-bit float components.
 * This class provides a mutable scalar value backed by a Float32Array.
 */
export class MutableScalar extends MutableScalar_<Float32ArrayConstructor> {
  /**
   * Creates a new mutable scalar with 32-bit float precision.
   * @param x - The typed array containing the scalar value
   */
  constructor(x: TypedArray) {
    super(x, { type: Float32Array });
  }

  /**
   * Creates a copy of this scalar.
   * @returns A new MutableScalar instance with the same value
   */
  clone(): MutableScalar {
    return new MutableScalar(new Float32Array([this.x]));
  }

  /**
   * Creates a scalar with value 1.
   * @returns A new MutableScalar instance with value 1
   */
  static one(): MutableScalar {
    return new MutableScalar(new Float32Array([1]));
  }

  /**
   * Creates a dummy scalar with no data.
   * @returns A new MutableScalar instance with empty array
   */
  static dummy(): MutableScalar {
    return new MutableScalar(new Float32Array([]));
  }

  /**
   * Creates a scalar with value 0.
   * @returns A new MutableScalar instance with value 0
   */
  static zero(): MutableScalar {
    return new MutableScalar(new Float32Array([0]));
  }

  /**
   * Gets the class name for debugging and serialization purposes.
   * @returns The string "MutableScalar"
   */
  get className(): string {
    return 'MutableScalar';
  }
}

/**
 * Mutable scalar class with 64-bit float components.
 * This class provides a mutable scalar value backed by a Float64Array for higher precision.
 */
export class MutableScalard extends MutableScalar_<Float64ArrayConstructor> {
  /**
   * Creates a new mutable scalar with 64-bit float precision.
   * @param x - The typed array containing the scalar value
   */
  constructor(x: TypedArray) {
    super(x, { type: Float64Array });
  }

  /**
   * Creates a copy of this scalar.
   * @returns A new MutableScalard instance with the same value
   */
  clone(): MutableScalard {
    return new MutableScalard(new Float64Array([this.x]));
  }

  /**
   * Creates a scalar with value 1.
   * @returns A new MutableScalard instance with value 1
   */
  static one(): MutableScalard {
    return new MutableScalard(new Float64Array([1]));
  }

  /**
   * Creates a dummy scalar with no data.
   * @returns A new MutableScalard instance with empty array
   */
  static dummy(): MutableScalard {
    return new MutableScalard(new Float64Array([]));
  }

  /**
   * Creates a scalar with value 0.
   * @returns A new MutableScalard instance with value 0
   */
  static zero(): MutableScalard {
    return new MutableScalard(new Float64Array([0]));
  }
}

/**
 * Type alias for MutableScalar (32-bit float precision).
 * Provides backward compatibility and clearer naming.
 */
export type MutableScalarf = MutableScalar;
