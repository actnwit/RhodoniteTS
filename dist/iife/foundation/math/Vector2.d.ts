import type { Array2, FloatTypedArrayConstructor, TypedArray } from '../../types/CommonTypes';
import { AbstractVector } from './AbstractVector';
import type { IMutableVector2, IVector, IVector2, IVector3, IVector4 } from './IVector';
/**
 * Base class for 2D vector implementations with different precision types.
 * This class provides common functionality for both 32-bit and 64-bit floating point vectors.
 *
 * @template T - The typed array constructor type (Float32Array or Float64Array)
 * @internal
 */
export declare class Vector2_<T extends FloatTypedArrayConstructor> extends AbstractVector {
    /**
     * Creates a new Vector2_ instance.
     *
     * @param v - The typed array containing the vector components
     * @param options - Configuration object containing the array type
     */
    constructor(v: TypedArray, _options: {
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
     * Converts the vector to a GLSL vec2 string representation with float precision.
     *
     * @returns GLSL-compatible vec2 string
     */
    get glslStrAsFloat(): string;
    /**
     * Converts the vector to a GLSL ivec2 string representation with integer precision.
     *
     * @returns GLSL-compatible ivec2 string
     */
    get glslStrAsInt(): string;
    /**
     * Converts the vector to a WGSL vec2f string representation with float precision.
     *
     * @returns WGSL-compatible vec2f string
     */
    get wgslStrAsFloat(): string;
    /**
     * Converts the vector to a WGSL vec2i string representation with integer precision.
     *
     * @returns WGSL-compatible vec2i string
     */
    get wgslStrAsInt(): string;
    /**
     * Gets the composition type of this vector.
     *
     * @returns The composition type (Vec2)
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
        readonly __dummyStr: "VEC2";
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
     * Calculates the squared length of a vector (static version).
     * This is more efficient than calculating the actual length when only comparison is needed.
     *
     * @param vec - The vector to calculate squared length for
     * @returns The squared length of the vector
     */
    static lengthSquared(vec: IVector2): number;
    /**
     * Calculates the distance between two vectors.
     *
     * @param l_vec - The first vector
     * @param r_vec - The second vector
     * @returns The distance between the vectors
     */
    static lengthBtw(l_vec: IVector2, r_vec: IVector2): number;
    /**
     * Calculates the angle between two vectors in radians.
     *
     * @param l_vec - The first vector
     * @param r_vec - The second vector
     * @returns The angle between the vectors in radians
     */
    static angleOfVectors(l_vec: IVector2, r_vec: IVector2): number;
    /**
     * Creates a zero vector (0, 0).
     *
     * @param type - The typed array constructor
     * @returns A new zero vector
     */
    static _zero(type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * Creates a one vector (1, 1).
     *
     * @param type - The typed array constructor
     * @returns A new one vector
     */
    static _one(type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * Creates a dummy vector with no components.
     *
     * @param type - The typed array constructor
     * @returns A new dummy vector
     */
    static _dummy(type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * Normalizes a vector to unit length (static version).
     *
     * @param vec - The vector to normalize
     * @param type - The typed array constructor
     * @returns A new normalized vector
     */
    static _normalize(vec: IVector2, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * Adds two vectors component-wise (static version).
     *
     * @param l_vec - The left vector operand
     * @param r_vec - The right vector operand
     * @param type - The typed array constructor
     * @returns A new vector containing the sum
     */
    static _add(l_vec: IVector2, r_vec: IVector2, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * Adds two vectors component-wise and stores the result in the output vector.
     *
     * @param l_vec - The left vector operand
     * @param r_vec - The right vector operand
     * @param out - The output vector to store the result
     * @returns The output vector containing the sum
     */
    static addTo(l_vec: IVector2, r_vec: IVector2, out: IMutableVector2): IMutableVector2;
    /**
     * Subtracts the right vector from the left vector component-wise (static version).
     *
     * @param l_vec - The left vector operand
     * @param r_vec - The right vector operand
     * @param type - The typed array constructor
     * @returns A new vector containing the difference
     */
    static _subtract(l_vec: IVector2, r_vec: IVector2, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * Subtracts the right vector from the left vector component-wise and stores the result in the output vector.
     *
     * @param l_vec - The left vector operand
     * @param r_vec - The right vector operand
     * @param out - The output vector to store the result
     * @returns The output vector containing the difference
     */
    static subtractTo(l_vec: IVector2, r_vec: IVector2, out: IMutableVector2): IMutableVector2;
    /**
     * Multiplies a vector by a scalar value (static version).
     *
     * @param vec - The vector to multiply
     * @param value - The scalar value to multiply by
     * @param type - The typed array constructor
     * @returns A new vector containing the scaled result
     */
    static _multiply(vec: IVector2, value: number, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * Multiplies a vector by a scalar value and stores the result in the output vector.
     *
     * @param vec - The vector to multiply
     * @param value - The scalar value to multiply by
     * @param out - The output vector to store the result
     * @returns The output vector containing the scaled result
     */
    static multiplyTo(vec: IVector2, value: number, out: IMutableVector2): IMutableVector2;
    /**
     * Multiplies two vectors component-wise (static version).
     *
     * @param l_vec - The left vector operand
     * @param r_vec - The right vector operand
     * @param type - The typed array constructor
     * @returns A new vector containing the component-wise product
     */
    static _multiplyVector(l_vec: IVector2, r_vec: IVector2, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * Multiplies two vectors component-wise and stores the result in the output vector.
     *
     * @param l_vec - The left vector operand
     * @param r_vec - The right vector operand
     * @param out - The output vector to store the result
     * @returns The output vector containing the component-wise product
     */
    static multiplyVectorTo(l_vec: IVector2, r_vec: IVector2, out: IMutableVector2): IMutableVector2;
    /**
     * Divides a vector by a scalar value (static version).
     *
     * @param vec - The vector to divide
     * @param value - The scalar value to divide by
     * @param type - The typed array constructor
     * @returns A new vector containing the divided result
     */
    static _divide(vec: IVector2, value: number, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * Divides a vector by a scalar value and stores the result in the output vector.
     *
     * @param vec - The vector to divide
     * @param value - The scalar value to divide by
     * @param out - The output vector to store the result
     * @returns The output vector containing the divided result
     */
    static divideTo(vec: IVector2, value: number, out: IMutableVector2): IMutableVector2;
    /**
     * Divides the left vector by the right vector component-wise (static version).
     *
     * @param l_vec - The left vector operand (dividend)
     * @param r_vec - The right vector operand (divisor)
     * @param type - The typed array constructor
     * @returns A new vector containing the component-wise division result
     */
    static _divideVector(l_vec: IVector2, r_vec: IVector2, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * Divides the left vector by the right vector component-wise and stores the result in the output vector.
     *
     * @param l_vec - The left vector operand (dividend)
     * @param r_vec - The right vector operand (divisor)
     * @param out - The output vector to store the result
     * @returns The output vector containing the component-wise division result
     */
    static divideVectorTo(l_vec: IVector2, r_vec: IVector2, out: IMutableVector2): IMutableVector2;
    /**
     * Calculates the dot product of two vectors (static version).
     *
     * @param l_vec - The left vector operand
     * @param r_vec - The right vector operand
     * @returns The dot product of the two vectors
     */
    static dot(l_vec: IVector2, r_vec: IVector2): number;
    /**
     * Converts the vector to a string representation.
     *
     * @returns String representation in the format "(x, y)"
     */
    toString(): string;
    /**
     * Converts the vector to an approximate string representation with financial precision.
     *
     * @returns String representation with reduced decimal places
     */
    toStringApproximately(): string;
    /**
     * Converts the vector to a flat array representation.
     *
     * @returns Array containing [x, y] components
     */
    flattenAsArray(): number[];
    /**
     * Checks if this vector is a dummy (empty) vector.
     *
     * @returns True if the vector has no components, false otherwise
     */
    isDummy(): boolean;
    /**
     * Checks if this vector is approximately equal to another vector within a tolerance.
     *
     * @param vec - The vector to compare with
     * @param delta - The tolerance value (default: Number.EPSILON)
     * @returns True if vectors are approximately equal, false otherwise
     */
    isEqual(vec: IVector2, delta?: number): boolean;
    /**
     * Checks if this vector is strictly equal to another vector (exact comparison).
     *
     * @param vec - The vector to compare with
     * @returns True if vectors are exactly equal, false otherwise
     */
    isStrictEqual(vec: IVector2): boolean;
    /**
     * Gets the component at the specified index.
     *
     * @param i - The index (0 for x, 1 for y)
     * @returns The component value at the specified index
     */
    at(i: number): number;
    /**
     * Calculates the length (magnitude) of the vector.
     *
     * @returns The length of the vector
     */
    length(): number;
    /**
     * Calculates the squared length of the vector.
     * This is more efficient than calculating the actual length when only comparison is needed.
     *
     * @returns The squared length of the vector
     */
    lengthSquared(): number;
    /**
     * Calculates the distance from this vector to another vector.
     *
     * @param vec - The target vector
     * @returns The distance between the vectors
     */
    lengthTo(vec: IVector2): number;
    /**
     * Calculates the dot product with another vector.
     *
     * @param vec - The vector to calculate dot product with
     * @returns The dot product result
     */
    dot(vec: IVector2): number;
    /**
     * Creates a clone of this vector.
     *
     * @returns A new vector with the same components
     */
    clone(): any;
    /**
     * Creates a vector from a 2-element array.
     *
     * @param array - The array containing [x, y] components
     * @param type - The typed array constructor
     * @returns A new vector instance
     */
    static _fromCopyArray2(array: Array2<number>, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * Creates a vector from individual x and y components.
     *
     * @param x - The x component
     * @param y - The y component
     * @param type - The typed array constructor
     * @returns A new vector instance
     */
    static _fromCopy2(x: number, y: number, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * Creates a vector from an array, taking the first 2 elements.
     *
     * @param array - The array containing components
     * @param type - The typed array constructor
     * @returns A new vector instance
     */
    static _fromCopyArray(array: Array<number>, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * Creates a vector from another IVector2 by sharing the underlying array.
     *
     * @param vec2 - The source vector
     * @param type - The typed array constructor
     * @returns A new vector instance
     */
    static _fromVector2(vec2: IVector2, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * Creates a vector by copying components from another IVector2.
     *
     * @param vec2 - The source vector
     * @param type - The typed array constructor
     * @returns A new vector instance
     */
    static _fromCopyVector2(vec2: IVector2, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * Creates a vector by copying the first 2 components from a 3D vector.
     *
     * @param vec3 - The source 3D vector
     * @param type - The typed array constructor
     * @returns A new vector instance
     */
    static _fromCopyVector3(vec3: IVector3, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * Creates a vector by copying the first 2 components from a 4D vector.
     *
     * @param vec4 - The source 4D vector
     * @param type - The typed array constructor
     * @returns A new vector instance
     */
    static _fromCopyVector4(vec4: IVector4, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * Gets the number of bytes per component in the underlying typed array.
     *
     * @returns The number of bytes per component
     */
    get bytesPerComponent(): number;
}
/**
 * Immutable 2D vector class with 32-bit float components.
 * This class provides comprehensive vector operations for 2D graphics and mathematics.
 * All operations return new vector instances, preserving immutability.
 */
export declare class Vector2 extends Vector2_<Float32ArrayConstructor> implements IVector, IVector2 {
    /**
     * Creates a new Vector2 instance.
     *
     * @param x - The typed array containing the vector components
     */
    constructor(x: TypedArray);
    /**
     * Creates a vector from a 2-element array.
     *
     * @param array - The array containing [x, y] components
     * @returns A new Vector2 instance
     */
    static fromCopyArray2(array: Array2<number>): Vector2;
    /**
     * Creates a vector from individual x and y components.
     *
     * @param x - The x component
     * @param y - The y component
     * @returns A new Vector2 instance
     */
    static fromCopy2(x: number, y: number): Vector2;
    /**
     * Creates a vector from an array, taking the first 2 elements.
     *
     * @param array - The array containing components
     * @returns A new Vector2 instance
     */
    static fromCopyArray(array: Array<number>): Vector2;
    /**
     * Creates a vector by copying components from another IVector2.
     *
     * @param vec2 - The source vector
     * @returns A new Vector2 instance
     */
    static fromCopyVector2(vec2: IVector2): Vector2;
    /**
     * Creates a vector by copying the first 2 components from a 4D vector.
     *
     * @param vec4 - The source 4D vector
     * @returns A new Vector2 instance
     */
    static fromCopyVector4(vec4: IVector4): Vector2;
    /**
     * Creates a zero vector (0, 0).
     *
     * @returns A new zero Vector2 instance
     */
    static zero(): Vector2;
    /**
     * Creates a one vector (1, 1).
     *
     * @returns A new one Vector2 instance
     */
    static one(): Vector2;
    /**
     * Creates a dummy vector with no components.
     *
     * @returns A new dummy Vector2 instance
     */
    static dummy(): Vector2;
    /**
     * Normalizes a vector to unit length.
     *
     * @param vec - The vector to normalize
     * @returns A new normalized Vector2 instance
     */
    static normalize(vec: IVector2): Vector2;
    /**
     * Adds two vectors component-wise.
     *
     * @param l_vec - The left vector operand
     * @param r_vec - The right vector operand
     * @returns A new Vector2 instance containing the sum
     */
    static add(l_vec: IVector2, r_vec: IVector2): Vector2;
    /**
     * Subtracts the right vector from the left vector component-wise.
     *
     * @param l_vec - The left vector operand
     * @param r_vec - The right vector operand
     * @returns A new Vector2 instance containing the difference
     */
    static subtract(l_vec: IVector2, r_vec: IVector2): Vector2;
    /**
     * Multiplies a vector by a scalar value.
     *
     * @param vec - The vector to multiply
     * @param value - The scalar value to multiply by
     * @returns A new Vector2 instance containing the scaled result
     */
    static multiply(vec: IVector2, value: number): Vector2;
    /**
     * Multiplies two vectors component-wise.
     *
     * @param l_vec - The left vector operand
     * @param r_vec - The right vector operand
     * @returns A new Vector2 instance containing the component-wise product
     */
    static multiplyVector(l_vec: IVector2, r_vec: IVector2): Vector2;
    /**
     * Divides a vector by a scalar value.
     *
     * @param vec - The vector to divide
     * @param value - The scalar value to divide by
     * @returns A new Vector2 instance containing the divided result
     */
    static divide(vec: IVector2, value: number): Vector2;
    /**
     * Divides the left vector by the right vector component-wise.
     *
     * @param l_vec - The left vector operand (dividend)
     * @param r_vec - The right vector operand (divisor)
     * @returns A new Vector2 instance containing the component-wise division result
     */
    static divideVector(l_vec: IVector2, r_vec: IVector2): Vector2;
    /**
     * Gets the class name.
     *
     * @returns The string "Vector2"
     */
    get className(): string;
    /**
     * Creates a clone of this vector.
     *
     * @returns A new Vector2 instance with the same components
     */
    clone(): Vector2;
}
/**
 * Immutable 2D vector class with 64-bit float components.
 * This class provides high-precision vector operations for applications requiring double precision.
 * All operations return new vector instances, preserving immutability.
 */
export declare class Vector2d extends Vector2_<Float64ArrayConstructor> {
    /**
     * Creates a new Vector2d instance.
     *
     * @param x - The typed array containing the vector components
     */
    constructor(x: TypedArray);
    /**
     * Creates a vector from a 2-element array.
     *
     * @param array - The array containing [x, y] components
     * @returns A new Vector2d instance
     */
    static fromCopyArray2(array: Array2<number>): Vector2d;
    /**
     * Creates a vector from individual x and y components.
     *
     * @param x - The x component
     * @param y - The y component
     * @returns A new Vector2d instance
     */
    static fromCopy2(x: number, y: number): Vector2d;
    /**
     * Creates a vector from an array, taking the first 2 elements.
     *
     * @param array - The array containing components
     * @returns A new Vector2d instance
     */
    static fromCopyArray(array: Array<number>): Vector2d;
    /**
     * Creates a vector from an ArrayBuffer.
     *
     * @param arrayBuffer - The ArrayBuffer containing the vector data
     * @returns A new Vector2d instance
     */
    static fromArrayBuffer(arrayBuffer: ArrayBuffer): Vector2d;
    /**
     * Creates a vector from a Float64Array.
     *
     * @param float64Array - The Float64Array containing the vector data
     * @returns A new Vector2d instance
     */
    static fromFloat64Array(float64Array: Float64Array): Vector2d;
    /**
     * Creates a zero vector (0, 0).
     *
     * @returns A new zero Vector2d instance
     */
    static zero(): Vector2d;
    /**
     * Creates a one vector (1, 1).
     *
     * @returns A new one Vector2d instance
     */
    static one(): Vector2d;
    /**
     * Creates a dummy vector with no components.
     *
     * @returns A new dummy Vector2d instance
     */
    static dummy(): Vector2d;
    /**
     * Normalizes a vector to unit length.
     *
     * @param vec - The vector to normalize
     * @returns A new normalized Vector2d instance
     */
    static normalize(vec: IVector2): Vector2d;
    /**
     * Adds two vectors component-wise.
     *
     * @param l_vec - The left vector operand
     * @param r_vec - The right vector operand
     * @returns A new Vector2d instance containing the sum
     */
    static add(l_vec: IVector2, r_vec: IVector2): Vector2d;
    /**
     * Subtracts the right vector from the left vector component-wise.
     *
     * @param l_vec - The left vector operand
     * @param r_vec - The right vector operand
     * @returns A new Vector2d instance containing the difference
     */
    static subtract(l_vec: IVector2, r_vec: IVector2): Vector2d;
    /**
     * Multiplies a vector by a scalar value.
     *
     * @param vec - The vector to multiply
     * @param value - The scalar value to multiply by
     * @returns A new Vector2d instance containing the scaled result
     */
    static multiply(vec: IVector2, value: number): Vector2d;
    /**
     * Multiplies two vectors component-wise.
     *
     * @param l_vec - The left vector operand
     * @param r_vec - The right vector operand
     * @returns A new Vector2d instance containing the component-wise product
     */
    static multiplyVector(l_vec: IVector2, r_vec: IVector2): Vector2d;
    /**
     * Divides a vector by a scalar value.
     *
     * @param vec - The vector to divide
     * @param value - The scalar value to divide by
     * @returns A new Vector2d instance containing the divided result
     */
    static divide(vec: IVector2, value: number): Vector2d;
    /**
     * Divides the left vector by the right vector component-wise.
     *
     * @param l_vec - The left vector operand (dividend)
     * @param r_vec - The right vector operand (divisor)
     * @returns A new Vector2d instance containing the component-wise division result
     */
    static divideVector(l_vec: IVector2, r_vec: IVector2): Vector2d;
    /**
     * Creates a clone of this vector.
     *
     * @returns A new Vector2d instance with the same components
     */
    clone(): Vector2d;
}
/**
 * Type alias for Vector2 using 32-bit float components.
 */
export type Vector2f = Vector2;
/**
 * Constant Vector2 instance representing (1, 1).
 */
export declare const ConstVector2_1_1: Vector2;
/**
 * Constant Vector2 instance representing (0, 0).
 */
export declare const ConstVector2_0_0: Vector2;
