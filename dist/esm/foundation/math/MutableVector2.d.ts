import type { Array2, FloatTypedArrayConstructor, TypedArray } from '../../types/CommonTypes';
import type { IMutableVector, IMutableVector2, IVector2 } from './IVector';
import { Vector2_ } from './Vector2';
/**
 * Base class for mutable 2D vectors with generic typed array support.
 * Provides mutable operations for vector manipulation that modify the vector in place.
 *
 * @template T - The typed array constructor type (Float32Array or Float64Array)
 * @internal
 */
export declare class MutableVector2_<T extends FloatTypedArrayConstructor> extends Vector2_<T> {
    /**
     * Creates a new mutable 2D vector instance.
     *
     * @param x - The typed array containing vector components
     * @param options - Configuration object containing the array type
     */
    constructor(x: TypedArray, { type }: {
        type: T;
    });
    /**
     * Sets the x component of the vector.
     *
     * @param x - The new x component value
     */
    set x(x: number);
    /**
     * Gets the x component of the vector.
     *
     * @returns The x component value
     */
    get x(): number;
    /**
     * Sets the y component of the vector.
     *
     * @param y - The new y component value
     */
    set y(y: number);
    /**
     * Gets the y component of the vector.
     *
     * @returns The y component value
     */
    get y(): number;
    /**
     * Gets the z component of the vector (always 0 for 2D vectors).
     *
     * @returns Always returns 0
     */
    get z(): number;
    /**
     * Gets the w component of the vector (always 1 for homogeneous coordinates).
     *
     * @returns Always returns 1
     */
    get w(): number;
    /**
     * Returns the raw typed array containing the vector components.
     *
     * @returns The underlying typed array
     */
    raw(): TypedArray;
    /**
     * Sets the value at the specified index.
     *
     * @param i - The component index (0 for x, 1 for y)
     * @param value - The value to set
     * @returns This vector instance for method chaining
     */
    setAt(i: number, value: number): this;
    /**
     * Sets both x and y components of the vector.
     *
     * @param x - The x component value
     * @param y - The y component value
     * @returns This vector instance for method chaining
     */
    setComponents(x: number, y: number): this;
    /**
     * Copies components from another vector to this vector.
     *
     * @param vec - The source vector to copy from
     * @returns This vector instance for method chaining
     */
    copyComponents(vec: IVector2): this;
    /**
     * Sets both components to zero.
     *
     * @returns This vector instance for method chaining
     */
    zero(): this;
    /**
     * Sets both components to one.
     *
     * @returns This vector instance for method chaining
     */
    one(): this;
    /**
     * Normalizes this vector to unit length (modifies the vector in place).
     * If the vector has zero length, the result is undefined.
     *
     * @returns This vector instance for method chaining
     */
    normalize(): this;
    /**
     * Adds another vector to this vector (modifies this vector in place).
     *
     * @param vec - The vector to add
     * @returns This vector instance for method chaining
     */
    add(vec: IVector2): this;
    /**
     * Subtracts another vector from this vector (modifies this vector in place).
     *
     * @param vec - The vector to subtract
     * @returns This vector instance for method chaining
     */
    subtract(vec: IVector2): this;
    /**
     * Multiplies this vector by a scalar value (modifies this vector in place).
     *
     * @param value - The scalar value to multiply by
     * @returns This vector instance for method chaining
     */
    multiply(value: number): this;
    /**
     * Multiplies this vector component-wise by another vector (modifies this vector in place).
     *
     * @param vec - The vector to multiply by
     * @returns This vector instance for method chaining
     */
    multiplyVector(vec: IVector2): this;
    /**
     * Divides this vector by a scalar value (modifies this vector in place).
     * If the divisor is zero, sets components to Infinity and logs an error.
     *
     * @param value - The scalar value to divide by
     * @returns This vector instance for method chaining
     */
    divide(value: number): this;
    /**
     * Divides this vector component-wise by another vector (modifies this vector in place).
     * If any component of the divisor is zero, sets that component to Infinity and logs an error.
     *
     * @param vec - The vector to divide by
     * @returns This vector instance for method chaining
     */
    divideVector(vec: IVector2): this;
    /**
     * Gets the number of bytes per component in the underlying typed array.
     *
     * @returns The number of bytes per element
     */
    get bytesPerComponent(): number;
}
/**
 * Mutable 2D vector class with 32-bit float components.
 * Provides efficient vector operations that modify the vector in place,
 * implementing both IMutableVector and IMutableVector2 interfaces.
 *
 * @example
 * ```typescript
 * const vec = MutableVector2.zero();
 * vec.setComponents(3, 4);
 * vec.normalize(); // vec is now (0.6, 0.8)
 * ```
 */
export declare class MutableVector2 extends MutableVector2_<Float32ArrayConstructor> implements IMutableVector, IMutableVector2 {
    /**
     * Creates a new mutable 2D vector with 32-bit float components.
     *
     * @param x - The typed array containing vector components
     */
    constructor(x: TypedArray);
    /**
     * Creates a new vector from a 2-element array by copying the values.
     *
     * @param array - A 2-element array containing [x, y] components
     * @returns A new MutableVector2 instance
     */
    static fromCopyArray2(array: Array2<number>): MutableVector2;
    /**
     * Creates a new vector from an array by copying the first two values.
     *
     * @param array - An array containing at least 2 numeric values
     * @returns A new MutableVector2 instance
     */
    static fromCopyArray(array: Array<number>): MutableVector2;
    /**
     * Creates a new vector from an existing Float32Array (shares the same buffer).
     *
     * @param float32Array - The Float32Array to use as the vector's data
     * @returns A new MutableVector2 instance
     */
    static fromFloat32Array(float32Array: Float32Array): MutableVector2;
    /**
     * Creates a new vector by copying data from an existing Float32Array.
     *
     * @param float32Array - The Float32Array to copy from
     * @returns A new MutableVector2 instance with copied data
     */
    static fromCopyFloat32Array(float32Array: Float32Array): MutableVector2;
    /**
     * Creates a zero vector (0, 0).
     *
     * @returns A new MutableVector2 instance with zero components
     */
    static zero(): MutableVector2;
    /**
     * Creates a vector with all components set to one (1, 1).
     *
     * @returns A new MutableVector2 instance with components set to 1
     */
    static one(): MutableVector2;
    /**
     * Creates a dummy vector for placeholder purposes.
     *
     * @returns A new MutableVector2 instance
     */
    static dummy(): MutableVector2;
    /**
     * Creates a normalized copy of the given vector.
     *
     * @param vec - The vector to normalize
     * @returns A new normalized MutableVector2 instance
     */
    static normalize(vec: IVector2): MutableVector2;
    /**
     * Creates a new vector by adding two vectors.
     *
     * @param l_vec - The left operand vector
     * @param r_vec - The right operand vector
     * @returns A new MutableVector2 instance containing the sum
     */
    static add(l_vec: IVector2, r_vec: IVector2): MutableVector2;
    /**
     * Creates a new vector by subtracting the second vector from the first.
     *
     * @param l_vec - The vector to subtract from
     * @param r_vec - The vector to subtract
     * @returns A new MutableVector2 instance containing the difference
     */
    static subtract(l_vec: IVector2, r_vec: IVector2): MutableVector2;
    /**
     * Creates a new vector by multiplying a vector by a scalar.
     *
     * @param vec - The vector to multiply
     * @param value - The scalar value to multiply by
     * @returns A new MutableVector2 instance containing the scaled vector
     */
    static multiply(vec: IVector2, value: number): MutableVector2;
    /**
     * Creates a new vector by multiplying two vectors component-wise.
     *
     * @param l_vec - The left operand vector
     * @param r_vec - The right operand vector
     * @returns A new MutableVector2 instance containing the component-wise product
     */
    static multiplyVector(l_vec: IVector2, r_vec: IVector2): MutableVector2;
    /**
     * Creates a new vector by dividing a vector by a scalar.
     *
     * @param vec - The vector to divide
     * @param value - The scalar value to divide by
     * @returns A new MutableVector2 instance containing the divided vector
     */
    static divide(vec: IVector2, value: number): MutableVector2;
    /**
     * Creates a new vector by dividing two vectors component-wise.
     *
     * @param l_vec - The dividend vector
     * @param r_vec - The divisor vector
     * @returns A new MutableVector2 instance containing the component-wise quotient
     */
    static divideVector(l_vec: IVector2, r_vec: IVector2): MutableVector2;
    /**
     * Gets the class name for debugging and reflection purposes.
     *
     * @returns The string "MutableVector2"
     */
    get className(): string;
    /**
     * Creates a deep copy of this vector.
     *
     * @returns A new MutableVector2 instance with the same component values
     */
    clone(): MutableVector2;
}
/**
 * Mutable 2D vector class with 64-bit float components.
 * Provides high-precision vector operations for applications requiring
 * double-precision floating-point arithmetic.
 *
 * @example
 * ```typescript
 * const vec = MutableVector2d.zero();
 * vec.setComponents(1.23456789012345, 2.34567890123456);
 * ```
 */
export declare class MutableVector2d extends MutableVector2_<Float64ArrayConstructor> {
    /**
     * Creates a new mutable 2D vector with 64-bit float components.
     *
     * @param x - The typed array containing vector components
     */
    constructor(x: TypedArray);
    /**
     * Creates a new vector from a 2-element array by copying the values.
     *
     * @param array - A 2-element array containing [x, y] components
     * @returns A new MutableVector2d instance
     */
    static fromCopyArray(array: Array2<number>): MutableVector2d;
    /**
     * Creates a zero vector (0, 0) with double precision.
     *
     * @returns A new MutableVector2d instance with zero components
     */
    static zero(): MutableVector2d;
    /**
     * Creates a vector with all components set to one (1, 1) with double precision.
     *
     * @returns A new MutableVector2d instance with components set to 1
     */
    static one(): MutableVector2d;
    /**
     * Creates a dummy vector for placeholder purposes with double precision.
     *
     * @returns A new MutableVector2d instance
     */
    static dummy(): MutableVector2d;
    /**
     * Creates a normalized copy of the given vector with double precision.
     *
     * @param vec - The vector to normalize
     * @returns A new normalized MutableVector2d instance
     */
    static normalize(vec: IVector2): MutableVector2d;
    /**
     * Creates a new vector by adding two vectors with double precision.
     *
     * @param l_vec - The left operand vector
     * @param r_vec - The right operand vector
     * @returns A new MutableVector2d instance containing the sum
     */
    static add(l_vec: IVector2, r_vec: IVector2): MutableVector2d;
    /**
     * Creates a new vector by subtracting the second vector from the first with double precision.
     *
     * @param l_vec - The vector to subtract from
     * @param r_vec - The vector to subtract
     * @returns A new MutableVector2d instance containing the difference
     */
    static subtract(l_vec: IVector2, r_vec: IVector2): MutableVector2d;
    /**
     * Creates a new vector by multiplying a vector by a scalar with double precision.
     *
     * @param vec - The vector to multiply
     * @param value - The scalar value to multiply by
     * @returns A new MutableVector2d instance containing the scaled vector
     */
    static multiply(vec: IVector2, value: number): MutableVector2d;
    /**
     * Creates a new vector by multiplying two vectors component-wise with double precision.
     *
     * @param l_vec - The left operand vector
     * @param r_vec - The right operand vector
     * @returns A new MutableVector2d instance containing the component-wise product
     */
    static multiplyVector(l_vec: IVector2, r_vec: IVector2): MutableVector2d;
    /**
     * Creates a new vector by dividing a vector by a scalar with double precision.
     *
     * @param vec - The vector to divide
     * @param value - The scalar value to divide by
     * @returns A new MutableVector2d instance containing the divided vector
     */
    static divide(vec: IVector2, value: number): MutableVector2d;
    /**
     * Creates a new vector by dividing two vectors component-wise with double precision.
     *
     * @param l_vec - The dividend vector
     * @param r_vec - The divisor vector
     * @returns A new MutableVector2d instance containing the component-wise quotient
     */
    static divideVector(l_vec: IVector2, r_vec: IVector2): MutableVector2d;
    /**
     * Creates a deep copy of this vector with double precision.
     *
     * @returns A new MutableVector2d instance with the same component values
     */
    clone(): MutableVector2d;
}
/**
 * Type alias for MutableVector2 using 32-bit float components.
 * Provides a more explicit name for single-precision mutable vectors.
 */
export type MutableVector2f = MutableVector2;
