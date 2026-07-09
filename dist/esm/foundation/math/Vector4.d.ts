import type { Array4, FloatTypedArray, FloatTypedArrayConstructor } from '../../types/CommonTypes';
import { AbstractVector } from './AbstractVector';
import type { IMutableVector4, IVector2, IVector3, IVector4 } from './IVector';
/**
 * Generic 4D vector class that serves as the base implementation for both 32-bit and 64-bit vector types.
 * This class provides immutable vector operations with support for different floating-point precisions.
 *
 * @template T - The typed array constructor type (Float32ArrayConstructor or Float64ArrayConstructor)
 * @internal This class is not intended for direct instantiation by users
 */
export declare class Vector4_<T extends FloatTypedArrayConstructor> extends AbstractVector implements IVector4 {
    /**
     * Creates a new Vector4_ instance.
     *
     * @param v - The underlying typed array containing the vector components
     * @param options - Configuration object containing the array type constructor
     * @protected This constructor is protected to prevent direct instantiation
     */
    protected constructor(v: FloatTypedArray, _options: {
        type: T;
    });
    /**
     * Gets the X component of the vector.
     *
     * @returns The X component value
     */
    get x(): number;
    /**
     * Gets the Y component of the vector.
     *
     * @returns The Y component value
     */
    get y(): number;
    /**
     * Gets the Z component of the vector.
     *
     * @returns The Z component value
     */
    get z(): number;
    /**
     * Gets the W component of the vector.
     *
     * @returns The W component value
     */
    get w(): number;
    /**
     * Converts the vector to a GLSL vec4 string representation with float precision.
     *
     * @returns A GLSL-compatible vec4 string (e.g., "vec4(1.0, 2.0, 3.0, 4.0)")
     */
    get glslStrAsFloat(): string;
    /**
     * Converts the vector to a GLSL ivec4 string representation with integer values.
     *
     * @returns A GLSL-compatible ivec4 string (e.g., "ivec4(1, 2, 3, 4)")
     */
    get glslStrAsInt(): string;
    /**
     * Converts the vector to a GLSL uvec4 string representation with unsigned integer values.
     *
     * @returns A GLSL-compatible uvec4 string (e.g., "uvec4(1u, 2u, 3u, 4u)")
     */
    get glslStrAsUint(): string;
    /**
     * Converts the vector to a WGSL vec4f string representation with float precision.
     *
     * @returns A WGSL-compatible vec4f string (e.g., "vec4f(1.0, 2.0, 3.0, 4.0)")
     */
    get wgslStrAsFloat(): string;
    /**
     * Converts the vector to a WGSL vec4i string representation with integer values.
     *
     * @returns A WGSL-compatible vec4i string (e.g., "vec4i(1, 2, 3, 4)")
     */
    get wgslStrAsInt(): string;
    /**
     * Converts the vector to a WGSL vec4u string representation with unsigned integer values.
     *
     * @returns A WGSL-compatible vec4u string (e.g., "vec4u(1u, 2u, 3u, 4u)")
     */
    get wgslStrAsUint(): string;
    /**
     * Creates a new vector from a 4-element array by copying the values.
     *
     * @param array - Array containing exactly 4 numeric values [x, y, z, w]
     * @param type - The typed array constructor to use for internal storage
     * @returns A new vector instance with the copied values
     * @static
     */
    static _fromCopyArray4(array: Array4<number>, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
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
    static _fromCopy4(x: number, y: number, z: number, w: number, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    /**
     * Creates a new vector from an array by copying the first 4 values.
     * If the array has fewer than 4 elements, the remaining components will be undefined.
     *
     * @param array - Array containing numeric values (at least 4 elements recommended)
     * @param type - The typed array constructor to use for internal storage
     * @returns A new vector instance with the first 4 values from the array
     * @static
     */
    static _fromCopyArray(array: Array<number>, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    /**
     * Creates a new vector by copying values from another Vector4.
     *
     * @param vec4 - The source Vector4 to copy from
     * @param type - The typed array constructor to use for internal storage
     * @returns A new vector instance with copied values from the source vector
     * @static
     */
    static _fromCopyVector4(vec4: IVector4, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    /**
     * Creates a new Vector4 from a Vector3, setting the W component to 1.
     * This is commonly used for converting 3D positions to homogeneous coordinates.
     *
     * @param vec3 - The source Vector3 to copy from
     * @param type - The typed array constructor to use for internal storage
     * @returns A new Vector4 with (vec3.x, vec3.y, vec3.z, 1.0)
     * @static
     */
    static _fromCopyVector3(vec3: IVector3, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    /**
     * Creates a new Vector4 from a Vector2, setting Z to 0 and W to 1.
     * This is commonly used for converting 2D positions to homogeneous coordinates.
     *
     * @param vec2 - The source Vector2 to copy from
     * @param type - The typed array constructor to use for internal storage
     * @returns A new Vector4 with (vec2.x, vec2.y, 0.0, 1.0)
     * @static
     */
    static _fromVector2(vec2: IVector2, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    /**
     * Gets the composition type identifier for this vector type.
     *
     * @returns The CompositionType.Vec4 identifier
     * @static
     */
    static get compositionType(): {
        toString(): string;
        toJSON(): number;
        readonly __numberOfComponents: number;
        readonly __glslStr: string;
        readonly __hlslStr: string;
        readonly __webgpuStr: string;
        readonly __wgslStr: string;
        readonly __isArray: boolean;
        readonly __vec4SizeOfProperty: import("../../types").IndexOf16Bytes;
        readonly __dummyStr: "VEC4";
        get webgpu(): string;
        get wgsl(): string;
        getNumberOfComponents(): import("../../types").Count;
        getGlslStr(componentType: import("..").ComponentTypeEnum): string;
        getGlslInitialValue(componentType: import("..").ComponentTypeEnum): string;
        getWgslInitialValue(componentType: import("..").ComponentTypeEnum): string;
        toWGSLType(componentType: import("..").ComponentTypeEnum): string;
        getVec4SizeOfProperty(): import("../../types").IndexOf16Bytes;
        readonly index: number;
        readonly symbol: symbol;
        readonly str: string;
    };
    /**
     * Calculates the squared length (magnitude) of a vector.
     * This is more efficient than length() when only comparing magnitudes.
     *
     * @param vec - The vector to calculate squared length for
     * @returns The squared length of the vector
     * @static
     */
    static lengthSquared(vec: IVector4): number;
    /**
     * Calculates the distance between two vectors.
     *
     * @param l_vec - The first vector
     * @param r_vec - The second vector
     * @returns The distance between the two vectors
     * @static
     */
    static lengthBtw(l_vec: IVector4, r_vec: IVector4): number;
    /**
     * Creates a zero vector (0, 0, 0, 0).
     *
     * @param type - The typed array constructor to use for internal storage
     * @returns A new zero vector
     * @static
     */
    static _zero(type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    /**
     * Creates a vector with all components set to 1 (1, 1, 1, 1).
     *
     * @param type - The typed array constructor to use for internal storage
     * @returns A new vector with all components set to 1
     * @static
     */
    static _one(type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    /**
     * Creates a dummy vector with no components (empty array).
     * This is used as a placeholder when a vector is needed but not yet initialized.
     *
     * @param type - The typed array constructor to use for internal storage
     * @returns A new dummy vector with empty components
     * @static
     */
    static _dummy(type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    /**
     * Creates a normalized version of the given vector.
     * A normalized vector has a length of 1 while maintaining its direction.
     *
     * @param vec - The vector to normalize
     * @param type - The typed array constructor to use for internal storage
     * @returns A new normalized vector
     * @static
     */
    static _normalize(vec: IVector4, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    /**
     * Adds two vectors component-wise and returns a new vector.
     *
     * @param l_vec - The left operand vector
     * @param r_vec - The right operand vector
     * @param type - The typed array constructor to use for internal storage
     * @returns A new vector containing the sum (l_vec + r_vec)
     * @static
     */
    static _add(l_vec: IVector4, r_vec: IVector4, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
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
    static addTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4): IMutableVector4;
    /**
     * Subtracts the right vector from the left vector component-wise and returns a new vector.
     *
     * @param l_vec - The left operand vector (minuend)
     * @param r_vec - The right operand vector (subtrahend)
     * @param type - The typed array constructor to use for internal storage
     * @returns A new vector containing the difference (l_vec - r_vec)
     * @static
     */
    static _subtract(l_vec: IVector4, r_vec: IVector4, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
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
    static subtractTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4): IMutableVector4;
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
    static _multiply(vec: IVector4, value: number, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
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
    static multiplyTo(vec: IVector4, value: number, out: IMutableVector4): IMutableVector4;
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
    static _multiplyVector(l_vec: IVector4, r_vec: IVector4, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
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
    static multiplyVectorTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4): IMutableVector4;
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
    static _divide(vec: IVector4, value: number, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
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
    static divideTo(vec: IVector4, value: number, out: IMutableVector4): IMutableVector4;
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
    static _divideVector(l_vec: IVector4, r_vec: IVector4, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
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
    static divideVectorTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4): IMutableVector4;
    /**
     * Calculates the dot product of two vectors.
     * The dot product is the sum of the products of corresponding components.
     *
     * @param l_vec - The left operand vector
     * @param r_vec - The right operand vector
     * @returns The dot product of the two vectors
     * @static
     */
    static dot(l_vec: IVector4, r_vec: IVector4): number;
    /**
     * Converts the vector to a string representation in the format "(x, y, z, w)".
     *
     * @returns A string representation of the vector
     */
    toString(): string;
    /**
     * Converts the vector to an approximately formatted string representation with financial precision.
     * Each component is formatted to a fixed number of decimal places.
     *
     * @returns A string with space-separated components followed by a newline
     */
    toStringApproximately(): string;
    /**
     * Converts the vector to a flat array representation.
     *
     * @returns An array containing the vector components [x, y, z, w]
     */
    flattenAsArray(): number[];
    /**
     * Checks if this vector is a dummy vector (has no components).
     *
     * @returns True if the vector has no components, false otherwise
     */
    isDummy(): boolean;
    /**
     * Checks if this vector is approximately equal to another vector within a specified tolerance.
     *
     * @param vec - The vector to compare with
     * @param delta - The tolerance value for comparison (default: Number.EPSILON)
     * @returns True if the vectors are approximately equal, false otherwise
     */
    isEqual(vec: IVector4, delta?: number): boolean;
    /**
     * Checks if this vector is strictly equal to another vector (exact component equality).
     *
     * @param vec - The vector to compare with
     * @returns True if all components are exactly equal, false otherwise
     */
    isStrictEqual(vec: IVector4): boolean;
    /**
     * Gets the component value at the specified index.
     *
     * @param i - The index (0=x, 1=y, 2=z, 3=w)
     * @returns The component value at the specified index
     */
    at(i: number): number;
    /**
     * Calculates the length (magnitude) of the vector using the Euclidean norm.
     *
     * @returns The length of the vector
     */
    length(): number;
    /**
     * Calculates the squared length (magnitude) of the vector.
     * This is more efficient than length() when only comparing magnitudes.
     *
     * @returns The squared length of the vector
     */
    lengthSquared(): number;
    /**
     * Calculates the distance from this vector to another vector.
     *
     * @param vec - The target vector to calculate distance to
     * @returns The distance between the two vectors
     */
    lengthTo(vec: IVector4): number;
    /**
     * Calculates the dot product between this vector and another vector.
     * The dot product is the sum of the products of corresponding components.
     *
     * @param vec - The vector to calculate dot product with
     * @returns The dot product of the two vectors
     */
    dot(vec: IVector4): number;
    /**
     * Gets the class name of this vector type.
     *
     * @returns The string "Vector4"
     */
    get className(): string;
    /**
     * Creates a deep copy of this vector.
     *
     * @returns A new vector instance with the same component values
     */
    clone(): any;
    /**
     * Gets the number of bytes per component in the underlying typed array.
     *
     * @returns The number of bytes per element (4 for Float32Array, 8 for Float64Array)
     */
    get bytesPerComponent(): number;
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
export declare class Vector4 extends Vector4_<Float32ArrayConstructor> {
    /**
     * Creates a new Vector4 instance from a Float32Array.
     *
     * @param x - The Float32Array containing vector components
     */
    constructor(x: Float32Array);
    /**
     * Creates a new Vector4 by copying values from an array.
     * Takes the first 4 elements from the array. If the array has fewer than 4 elements,
     * the remaining components will be undefined.
     *
     * @param array - Array containing numeric values (at least 4 elements recommended)
     * @returns A new Vector4 instance with copied values
     * @static
     */
    static fromCopyArray(array: Array<number>): Vector4;
    /**
     * Creates a new Vector4 from a 4-element array by copying the values.
     *
     * @param array - Array containing exactly 4 numeric values [x, y, z, w]
     * @returns A new Vector4 instance with the copied values
     * @static
     */
    static fromCopyArray4(array: Array4<number>): Vector4;
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
    static fromCopy4(x: number, y: number, z: number, w: number): Vector4;
    /**
     * Creates a new Vector4 from a Vector3, setting the W component to 1.
     * This is commonly used for converting 3D positions to homogeneous coordinates.
     *
     * @param vec3 - The source Vector3 to copy from
     * @returns A new Vector4 with (vec3.x, vec3.y, vec3.z, 1.0)
     * @static
     */
    static fromCopyVector3(vec3: IVector3): Vector4;
    /**
     * Creates a new Vector4 by copying values from another Vector4.
     *
     * @param vec4 - The source Vector4 to copy from
     * @returns A new Vector4 instance with copied values from the source vector
     * @static
     */
    static fromCopyVector4(vec4: IVector4): Vector4;
    /**
     * Creates a new Vector4 from an ArrayBuffer.
     * The ArrayBuffer should contain at least 16 bytes (4 float32 values).
     *
     * @param arrayBuffer - The ArrayBuffer containing vector data
     * @returns A new Vector4 instance using the ArrayBuffer data
     * @static
     */
    static fromArrayBuffer(arrayBuffer: ArrayBuffer): Vector4;
    /**
     * Creates a new Vector4 from a Float32Array.
     * The Float32Array is used directly without copying.
     *
     * @param float32Array - The Float32Array containing vector components
     * @returns A new Vector4 instance using the provided Float32Array
     * @static
     */
    static fromFloat32Array(float32Array: Float32Array): Vector4;
    /**
     * Creates a new Vector4 by copying from a Float32Array.
     * This creates a new Float32Array copy of the input data.
     *
     * @param float32Array - The Float32Array to copy from
     * @returns A new Vector4 instance with copied Float32Array data
     * @static
     */
    static fromCopyFloat32Array(float32Array: Float32Array): Vector4;
    /**
     * Creates a zero vector (0, 0, 0, 0).
     *
     * @returns A new Vector4 with all components set to zero
     * @static
     */
    static zero(): Vector4;
    /**
     * Creates a vector with all components set to 1 (1, 1, 1, 1).
     *
     * @returns A new Vector4 with all components set to 1
     * @static
     */
    static one(): Vector4;
    /**
     * Creates a dummy vector with no components (empty array).
     * This is used as a placeholder when a vector is needed but not yet initialized.
     *
     * @returns A new dummy Vector4 with empty components
     * @static
     */
    static dummy(): Vector4;
    /**
     * Creates a normalized version of the given vector.
     * A normalized vector has a length of 1 while maintaining its direction.
     *
     * @param vec - The vector to normalize
     * @returns A new normalized Vector4
     * @static
     */
    static normalize(vec: IVector4): Vector4;
    /**
     * Adds two vectors component-wise and returns a new vector.
     *
     * @param l_vec - The left operand vector
     * @param r_vec - The right operand vector
     * @returns A new Vector4 containing the sum (l_vec + r_vec)
     * @static
     */
    static add(l_vec: IVector4, r_vec: IVector4): Vector4;
    /**
     * Subtracts the right vector from the left vector component-wise and returns a new vector.
     *
     * @param l_vec - The left operand vector (minuend)
     * @param r_vec - The right operand vector (subtrahend)
     * @returns A new Vector4 containing the difference (l_vec - r_vec)
     * @static
     */
    static subtract(l_vec: IVector4, r_vec: IVector4): Vector4;
    /**
     * Multiplies a vector by a scalar value and returns a new vector.
     * This operation scales the vector while preserving its direction.
     *
     * @param vec - The vector to multiply
     * @param value - The scalar value to multiply by
     * @returns A new Vector4 with each component multiplied by the scalar
     * @static
     */
    static multiply(vec: IVector4, value: number): Vector4;
    /**
     * Multiplies two vectors component-wise and returns a new vector.
     * This is also known as the Hadamard product or element-wise multiplication.
     *
     * @param l_vec - The left operand vector
     * @param r_vec - The right operand vector
     * @returns A new Vector4 with each component being the product of corresponding components
     * @static
     */
    static multiplyVector(l_vec: IVector4, r_vec: IVector4): Vector4;
    /**
     * Divides a vector by a scalar value and returns a new vector.
     * If the divisor is zero, the result components will be set to Infinity and an error will be logged.
     *
     * @param vec - The vector to divide
     * @param value - The scalar value to divide by
     * @returns A new Vector4 with each component divided by the scalar
     * @static
     */
    static divide(vec: IVector4, value: number): Vector4;
    /**
     * Divides the left vector by the right vector component-wise and returns a new vector.
     * If any component of the right vector is zero, the corresponding result component will be set to Infinity.
     *
     * @param l_vec - The left operand vector (dividend)
     * @param r_vec - The right operand vector (divisor)
     * @returns A new Vector4 with component-wise division result
     * @static
     */
    static divideVector(l_vec: IVector4, r_vec: IVector4): Vector4;
    /**
     * Creates a deep copy of this vector.
     *
     * @returns A new Vector4 instance with the same component values
     */
    clone(): Vector4;
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
export declare class Vector4d extends Vector4_<Float64ArrayConstructor> {
    /**
     * Creates a new Vector4d instance from a Float64Array.
     *
     * @param x - The Float64Array containing vector components
     * @private This constructor is private to prevent direct instantiation
     */
    private constructor();
    /**
     * Creates a new Vector4d from a 4-element array by copying the values.
     *
     * @param array - Array containing exactly 4 numeric values [x, y, z, w]
     * @returns A new Vector4d instance with the copied values
     * @static
     */
    static fromCopyArray4(array: Array4<number>): Vector4d;
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
    static fromCopy4(x: number, y: number, z: number, w: number): Vector4d;
    /**
     * Creates a new Vector4d by copying values from an array.
     * Takes the first 4 elements from the array. If the array has fewer than 4 elements,
     * the remaining components will be undefined.
     *
     * @param array - Array containing numeric values (at least 4 elements recommended)
     * @returns A new Vector4d instance with copied values
     * @static
     */
    static fromCopyArray(array: Array4<number>): Vector4d;
    /**
     * Creates a new Vector4d from an ArrayBuffer.
     * The ArrayBuffer should contain at least 32 bytes (4 float64 values).
     *
     * @param arrayBuffer - The ArrayBuffer containing vector data
     * @returns A new Vector4d instance using the ArrayBuffer data
     * @static
     */
    static fromArrayBuffer(arrayBuffer: ArrayBuffer): Vector4d;
    /**
     * Creates a new Vector4d from a Float64Array.
     * The Float64Array is used directly without copying.
     *
     * @param float64Array - The Float64Array containing vector components
     * @returns A new Vector4d instance using the provided Float64Array
     * @static
     */
    static fromFloat64Array(float64Array: Float64Array): Vector4d;
    /**
     * Creates a zero vector (0, 0, 0, 0).
     *
     * @returns A new Vector4d with all components set to zero
     * @static
     */
    static zero(): Vector4d;
    /**
     * Creates a vector with all components set to 1 (1, 1, 1, 1).
     *
     * @returns A new Vector4d with all components set to 1
     * @static
     */
    static one(): Vector4d;
    /**
     * Creates a dummy vector with no components (empty array).
     * This is used as a placeholder when a vector is needed but not yet initialized.
     *
     * @returns A new dummy Vector4d with empty components
     * @static
     */
    static dummy(): Vector4d;
    /**
     * Creates a normalized version of the given vector.
     * A normalized vector has a length of 1 while maintaining its direction.
     *
     * @param vec - The vector to normalize
     * @returns A new normalized Vector4d
     * @static
     */
    static normalize(vec: IVector4): Vector4d;
    /**
     * Adds two vectors component-wise and returns a new vector.
     *
     * @param l_vec - The left operand vector
     * @param r_vec - The right operand vector
     * @returns A new Vector4d containing the sum (l_vec + r_vec)
     * @static
     */
    static add(l_vec: IVector4, r_vec: IVector4): Vector4d;
    /**
     * Subtracts the right vector from the left vector component-wise and returns a new vector.
     *
     * @param l_vec - The left operand vector (minuend)
     * @param r_vec - The right operand vector (subtrahend)
     * @returns A new Vector4d containing the difference (l_vec - r_vec)
     * @static
     */
    static subtract(l_vec: IVector4, r_vec: IVector4): Vector4d;
    /**
     * Multiplies a vector by a scalar value and returns a new vector.
     * This operation scales the vector while preserving its direction.
     *
     * @param vec - The vector to multiply
     * @param value - The scalar value to multiply by
     * @returns A new Vector4d with each component multiplied by the scalar
     * @static
     */
    static multiply(vec: IVector4, value: number): Vector4d;
    /**
     * Multiplies two vectors component-wise and returns a new vector.
     * This is also known as the Hadamard product or element-wise multiplication.
     *
     * @param l_vec - The left operand vector
     * @param r_vec - The right operand vector
     * @returns A new Vector4d with each component being the product of corresponding components
     * @static
     */
    static multiplyVector(l_vec: IVector4, r_vec: IVector4): Vector4d;
    /**
     * Divides a vector by a scalar value and returns a new vector.
     * If the divisor is zero, the result components will be set to Infinity and an error will be logged.
     *
     * @param vec - The vector to divide
     * @param value - The scalar value to divide by
     * @returns A new Vector4d with each component divided by the scalar
     * @static
     */
    static divide(vec: IVector4, value: number): Vector4d;
    /**
     * Divides the left vector by the right vector component-wise and returns a new vector.
     * If any component of the right vector is zero, the corresponding result component will be set to Infinity.
     *
     * @param l_vec - The left operand vector (dividend)
     * @param r_vec - The right operand vector (divisor)
     * @returns A new Vector4d with component-wise division result
     * @static
     */
    static divideVector(l_vec: IVector4, r_vec: IVector4): Vector4d;
    /**
     * Creates a deep copy of this vector.
     *
     * @returns A new Vector4d instance with the same component values
     */
    clone(): Vector4d;
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
export declare const ConstVector4_1_1_1_1: Vector4;
/**
 * Constant Vector4 representing a homogeneous coordinate with W=1 (0, 0, 0, 1).
 * Commonly used for representing positions in homogeneous coordinates.
 */
export declare const ConstVector4_0_0_0_1: Vector4;
/**
 * Constant Vector4 with all components set to 0 (0, 0, 0, 0).
 * Represents the zero vector or null vector.
 */
export declare const ConstVector4_0_0_0_0: Vector4;
