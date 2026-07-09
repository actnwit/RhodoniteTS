import type { FloatTypedArrayConstructor, TypedArray, TypedArrayConstructor } from '../../types/CommonTypes';
import { type CompositionTypeEnum } from '../definitions/CompositionType';
import { AbstractVector } from './AbstractVector';
import type { IScalar } from './IVector';
/**
 * Abstract base class for scalar values using typed arrays.
 * Provides common functionality for both 32-bit and 64-bit floating-point scalar implementations.
 * @template T - The typed array constructor type
 * @internal
 */
export declare class Scalar_<T extends TypedArrayConstructor> extends AbstractVector {
    /**
     * Creates a new scalar instance.
     * @param v - The typed array containing the scalar value
     * @param options - Configuration object containing the array type
     * @param options.type - The typed array constructor type
     */
    constructor(v: TypedArray, _options: {
        type: T;
    });
    /**
     * Gets the scalar value as a number.
     * @returns The scalar value
     */
    getValue(): number;
    /**
     * Gets the scalar value wrapped in an array.
     * @returns An array containing the scalar value
     */
    getValueInArray(): number[];
    /**
     * Gets the scalar value (alias for x component).
     * @returns The scalar value
     */
    get x(): number;
    /**
     * Gets the raw typed array containing the scalar value.
     * @returns The underlying typed array
     */
    get raw(): TypedArray;
    /**
     * Performs strict equality comparison with another scalar.
     * Uses exact floating-point comparison without tolerance.
     * @param scalar - The scalar to compare with
     * @returns True if the scalars are exactly equal, false otherwise
     */
    isStrictEqual(scalar: Scalar_<T>): boolean;
    /**
     * Performs approximate equality comparison with another scalar within a tolerance.
     * @param scalar - The scalar to compare with
     * @param delta - The tolerance for comparison (default: Number.EPSILON)
     * @returns True if the scalars are equal within the specified tolerance
     */
    isEqual(scalar: Scalar_<T>, delta?: number): boolean;
    /**
     * Gets the scalar value as a GLSL-compatible float string.
     * @returns The scalar value formatted as a GLSL float literal
     */
    get glslStrAsFloat(): string;
    /**
     * Gets the scalar value as a GLSL-compatible integer string.
     * @returns The scalar value formatted as a GLSL integer literal
     */
    get glslStrAsInt(): string;
    /**
     * Gets the scalar value as a GLSL-compatible unsigned integer string.
     * @returns The scalar value formatted as a GLSL unsigned integer literal with 'u' suffix
     */
    get glslStrAsUint(): string;
    /**
     * Gets the scalar value as a WGSL-compatible float string.
     * @returns The scalar value formatted as a WGSL float literal
     */
    get wgslStrAsFloat(): string;
    /**
     * Gets the scalar value as a WGSL-compatible integer string.
     * @returns The scalar value formatted as a WGSL integer literal
     */
    get wgslStrAsInt(): string;
    /**
     * Gets the scalar value as a WGSL-compatible unsigned integer string.
     * @returns The scalar value formatted as a WGSL unsigned integer literal with 'u' suffix
     */
    get wgslStrAsUint(): string;
    /**
     * Creates a new scalar instance from a number value.
     * @param value - The numeric value to create the scalar from
     * @param type - The typed array constructor to use
     * @returns A new scalar instance
     * @protected
     */
    static _fromCopyNumber(value: number, type: FloatTypedArrayConstructor): Scalar_<FloatTypedArrayConstructor>;
    /**
     * Creates a dummy (uninitialized) scalar instance.
     * @param type - The typed array constructor to use
     * @returns A new dummy scalar instance
     * @protected
     */
    static _dummy(type: FloatTypedArrayConstructor): Scalar_<FloatTypedArrayConstructor>;
    /**
     * Gets the composition type for scalar values.
     * @returns The scalar composition type
     */
    static get compositionType(): CompositionTypeEnum;
    /**
     * Gets the number of bytes per component in the underlying typed array.
     * @returns The number of bytes per element
     */
    get bytesPerComponent(): number;
}
/**
 * Immutable scalar class using 32-bit floating-point precision.
 * Represents a single floating-point value with various utility methods
 * for mathematical operations and format conversions.
 */
export declare class Scalar extends Scalar_<Float32ArrayConstructor> implements IScalar {
    /**
     * Creates a new 32-bit float scalar instance.
     * @param x - The typed array containing the scalar value
     */
    constructor(x: TypedArray);
    /**
     * Creates a new scalar from a numeric value.
     * @param value - The numeric value to create the scalar from
     * @returns A new Scalar instance
     */
    static fromCopyNumber(value: number): Scalar;
    /**
     * Creates a scalar with value zero.
     * @returns A new Scalar instance with value 0
     */
    static zero(): Scalar;
    /**
     * Creates a scalar with value one.
     * @returns A new Scalar instance with value 1
     */
    static one(): Scalar;
    /**
     * Creates a dummy (uninitialized) scalar instance.
     * @returns A new dummy Scalar instance
     */
    static dummy(): Scalar;
    /**
     * Gets the class name for debugging and reflection purposes.
     * @returns The string "Scalar"
     */
    get className(): string;
    /**
     * Converts the scalar to a string representation.
     * @returns A string representation of the scalar in the format "(value)"
     */
    toString(): string;
    /**
     * Creates a deep copy of this scalar.
     * @returns A new Scalar instance with the same value
     */
    clone(): Scalar;
}
/**
 * Immutable scalar class using 64-bit floating-point precision.
 * Provides higher precision than the standard Scalar class for applications
 * requiring double-precision arithmetic.
 */
export declare class Scalard extends Scalar_<Float64ArrayConstructor> {
    /**
     * Creates a new 64-bit float scalar instance.
     * @param x - The typed array containing the scalar value
     */
    constructor(x: TypedArray);
    /**
     * Creates a new double-precision scalar from a numeric value.
     * @param value - The numeric value to create the scalar from
     * @returns A new Scalard instance
     */
    static fromCopyNumber(value: number): Scalard;
    /**
     * Creates a double-precision scalar with value zero.
     * @returns A new Scalard instance with value 0
     */
    static zero(): Scalard;
    /**
     * Creates a double-precision scalar with value one.
     * @returns A new Scalard instance with value 1
     */
    static one(): Scalard;
    /**
     * Creates a dummy (uninitialized) double-precision scalar instance.
     * @returns A new dummy Scalard instance
     */
    static dummy(): Scalard;
    /**
     * Creates a deep copy of this double-precision scalar.
     * @returns A new Scalard instance with the same value
     */
    clone(): Scalard;
}
/**
 * Type alias for the standard 32-bit float Scalar class.
 * Provides convenient naming for float-precision scalar operations.
 */
export type Scalarf = Scalar;
