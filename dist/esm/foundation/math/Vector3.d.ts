import type { Array3, FloatTypedArrayConstructor, TypedArray } from '../../types/CommonTypes';
import { AbstractVector } from './AbstractVector';
import type { IMatrix44 } from './IMatrix';
import type { IQuaternion } from './IQuaternion';
import type { IMutableVector3, IVector, IVector2, IVector3, IVector4 } from './IVector';
/**
 * Generic base class for 3D vectors with floating-point components.
 * This class provides immutable 3D vector operations and serves as the foundation
 * for both 32-bit and 64-bit precision vector implementations.
 *
 * @template T - The typed array constructor (Float32Array or Float64Array)
 * @internal
 */
export declare class Vector3_<T extends FloatTypedArrayConstructor> extends AbstractVector implements IVector, IVector3 {
    /**
     * Creates a new Vector3_ instance.
     * @param v - The typed array containing the vector components
     * @param type - Configuration object containing the typed array constructor
     */
    constructor(v: TypedArray, _options: {
        type: T;
    });
    /**
     * Gets the X component of the vector.
     * @returns The X component value
     */
    get x(): number;
    /**
     * Gets the Y component of the vector.
     * @returns The Y component value
     */
    get y(): number;
    /**
     * Gets the Z component of the vector.
     * @returns The Z component value
     */
    get z(): number;
    /**
     * Gets the W component of the vector (always returns 1 for homogeneous coordinates).
     * @returns Always returns 1
     */
    get w(): number;
    /**
     * Gets the GLSL representation of this vector as a float vec3.
     * @returns A string representation suitable for GLSL shaders
     */
    get glslStrAsFloat(): string;
    /**
     * Gets the GLSL representation of this vector as an integer ivec3.
     * @returns A string representation suitable for GLSL shaders with integer components
     */
    get glslStrAsInt(): string;
    /**
     * Gets the WGSL representation of this vector as a float vec3f.
     * @returns A string representation suitable for WGSL shaders
     */
    get wgslStrAsFloat(): string;
    /**
     * Gets the WGSL representation of this vector as an integer vec3i.
     * @returns A string representation suitable for WGSL shaders with integer components
     */
    get wgslStrAsInt(): string;
    /**
     * Gets the composition type for this vector class.
     * @returns The composition type (Vec3)
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
        readonly __dummyStr: "VEC3";
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
     * @param vec - The vector to calculate squared length for
     * @returns The squared length of the vector
     */
    static lengthSquared(vec: IVector3): number;
    /**
     * Calculates the distance between two vectors.
     * @param l_vec - The first vector
     * @param r_vec - The second vector
     * @returns The distance between the two vectors
     */
    static lengthBtw(l_vec: IVector3, r_vec: IVector3): number;
    /**
     * Calculates the angle between two vectors in radians.
     * @param l_vec - The first vector
     * @param r_vec - The second vector
     * @returns The angle between the vectors in radians
     * @throws Error if either vector has zero length
     */
    static angleOfVectors(l_vec: IVector3, r_vec: IVector3): number;
    /**
     * Creates a zero vector (0, 0, 0).
     * @param type - The typed array constructor to use
     * @returns A new zero vector
     */
    static _zero(type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * Creates a vector with all components set to 1 (1, 1, 1).
     * @param type - The typed array constructor to use
     * @returns A new vector with all components set to 1
     */
    static _one(type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * Creates an empty dummy vector for placeholder purposes.
     * @param type - The typed array constructor to use
     * @returns A new dummy vector
     */
    static _dummy(type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * Normalizes a vector to unit length (static version).
     * @param vec - The vector to normalize
     * @param type - The typed array constructor to use
     * @returns A new normalized vector
     */
    static _normalize(vec: IVector3, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * Normalizes a vector and stores the result in the output vector.
     * @param vec - The vector to normalize
     * @param out - The output vector to store the result
     * @returns The output vector containing the normalized result
     */
    static normalizeTo(vec: IVector3, out: IMutableVector3): IMutableVector3;
    /**
     * Adds two vectors component-wise (static version).
     * @param l_vec - The first vector
     * @param r_vec - The second vector
     * @param type - The typed array constructor to use
     * @returns A new vector containing the sum
     */
    static _add(l_vec: IVector3, r_vec: IVector3, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * Adds two vectors and stores the result in the output vector.
     * @param l_vec - The first vector
     * @param r_vec - The second vector
     * @param out - The output vector to store the result
     * @returns The output vector containing the sum
     */
    static addTo(l_vec: IVector3, r_vec: IVector3, out: IMutableVector3): IMutableVector3;
    /**
     * Adds a scaled vector to another vector and stores the result in the output vector.
     * @param l_vec - The vector to add to
     * @param r_vec - The vector to add
     * @param scale - The scale to apply to the second vector
     * @param out - The output vector to store the result
     * @returns The output vector containing the sum
     */
    static addScaledVectorTo(l_vec: IVector3, r_vec: IVector3, scale: number, out: IMutableVector3): IMutableVector3;
    /**
     * Subtracts the second vector from the first vector (static version).
     * @param l_vec - The vector to subtract from
     * @param r_vec - The vector to subtract
     * @param type - The typed array constructor to use
     * @returns A new vector containing the difference
     */
    static _subtract(l_vec: IVector3, r_vec: IVector3, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * Subtracts two vectors and stores the result in the output vector.
     * @param l_vec - The vector to subtract from
     * @param r_vec - The vector to subtract
     * @param out - The output vector to store the result
     * @returns The output vector containing the difference
     */
    static subtractTo(l_vec: IVector3, r_vec: IVector3, out: IMutableVector3): IMutableVector3;
    /**
     * Multiplies a vector by a scalar value (static version).
     * @param vec - The vector to multiply
     * @param value - The scalar value to multiply by
     * @param type - The typed array constructor to use
     * @returns A new vector containing the scaled result
     */
    static _multiply(vec: IVector3, value: number, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * Multiplies a vector by a scalar and stores the result in the output vector.
     * @param vec - The vector to multiply
     * @param value - The scalar value to multiply by
     * @param out - The output vector to store the result
     * @returns The output vector containing the scaled result
     */
    static multiplyTo(vec: IVector3, value: number, out: IMutableVector3): IMutableVector3;
    /**
     * Multiplies two vectors component-wise (static version).
     * @param l_vec - The first vector
     * @param r_vec - The second vector
     * @param type - The typed array constructor to use
     * @returns A new vector containing the component-wise product
     */
    static _multiplyVector(l_vec: IVector3, r_vec: IVector3, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * Multiplies two vectors component-wise and stores the result in the output vector.
     * @param l_vec - The first vector
     * @param r_vec - The second vector
     * @param out - The output vector to store the result
     * @returns The output vector containing the component-wise product
     */
    static multiplyVectorTo(l_vec: IVector3, r_vec: IVector3, out: IMutableVector3): IMutableVector3;
    /**
     * Transforms a 3D vector by a 4x4 matrix, treating the vector as a point (w=1).
     * The result is perspective-divided if the w component is not 1.
     * @param vec - The vector to transform
     * @param mat - The 4x4 transformation matrix
     * @param type - The typed array constructor to use
     * @returns A new transformed vector
     */
    static _multiplyMatrix4(vec: IVector3, mat: IMatrix44, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * Transforms a 3D vector by a 4x4 matrix, treating the vector as a point (w=1).
     * The result is perspective-divided if the w component is not 1.
     * @param vec - The vector to transform
     * @param mat - The 4x4 transformation matrix
     * @param out - The output vector to store the result
     * @returns A new transformed vector
     */
    static multiplyMatrix4To(vec: IVector3, mat: IMatrix44, out: IMutableVector3): IMutableVector3;
    /**
     * Divides a vector by a scalar value (static version).
     * @param vec - The vector to divide
     * @param value - The scalar value to divide by
     * @param type - The typed array constructor to use
     * @returns A new vector containing the divided result
     * @throws Error if division by zero occurs
     */
    static _divide(vec: IVector3, value: number, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * Divides a vector by a scalar and stores the result in the output vector.
     * @param vec - The vector to divide
     * @param value - The scalar value to divide by
     * @param out - The output vector to store the result
     * @returns The output vector containing the divided result
     * @throws Error if division by zero occurs
     */
    static divideTo(vec: IVector3, value: number, out: IMutableVector3): IMutableVector3;
    /**
     * Divides two vectors component-wise (static version).
     * @param l_vec - The vector to divide
     * @param r_vec - The vector to divide by
     * @param type - The typed array constructor to use
     * @returns A new vector containing the component-wise division result
     * @throws Error if division by zero occurs
     */
    static _divideVector(l_vec: IVector3, r_vec: IVector3, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * Divides two vectors component-wise and stores the result in the output vector.
     * @param l_vec - The vector to divide
     * @param r_vec - The vector to divide by
     * @param out - The output vector to store the result
     * @returns The output vector containing the component-wise division result
     * @throws Error if division by zero occurs
     */
    static divideVectorTo(l_vec: IVector3, r_vec: IVector3, out: IMutableVector3): IMutableVector3;
    /**
     * Calculates the dot product of two vectors (static version).
     * @param l_vec - The first vector
     * @param r_vec - The second vector
     * @returns The dot product of the two vectors
     */
    static dot(l_vec: IVector3, r_vec: IVector3): number;
    /**
     * Calculates the cross product of two vectors (static version).
     * @param l_vec - The first vector (left operand)
     * @param r_vec - The second vector (right operand)
     * @param type - The typed array constructor to use
     * @returns A new vector containing the cross product result
     */
    static _cross(l_vec: IVector3, r_vec: IVector3, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * Calculates the cross product of two vectors and stores the result in the output vector.
     * @param l_vec - The first vector (left operand)
     * @param r_vec - The second vector (right operand)
     * @param out - The output vector to store the result
     * @returns The output vector containing the cross product result
     */
    static crossTo(l_vec: IVector3, r_vec: IVector3, out: IMutableVector3): IMutableVector3;
    /**
     * Transforms a vector by a quaternion rotation (static version).
     * This applies the quaternion rotation to the vector.
     * @param quat - The quaternion to apply
     * @param vec - The vector to transform
     * @param type - The typed array constructor to use
     * @returns A new vector containing the transformed result
     */
    static _multiplyQuaternion(quat: IQuaternion, vec: IVector3, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * Transforms a vector by a quaternion rotation and stores the result in the output vector.
     * This applies the quaternion rotation to the vector.
     * @param quat - The quaternion to apply
     * @param vec - The vector to transform
     * @param out - The output vector to store the result
     * @returns The output vector containing the transformed result
     */
    static multiplyQuaternionTo(quat: IQuaternion, vec: IVector3, out: IMutableVector3): IMutableVector3;
    /**
     * Converts the vector to a string representation.
     * @returns A string representation of the vector in the format "(x, y, z)"
     */
    toString(): string;
    /**
     * Converts the vector to an approximate string representation with limited decimal places.
     * @returns A string representation with financial formatting
     */
    toStringApproximately(): string;
    /**
     * Converts the vector to a flat array.
     * @returns An array containing the x, y, and z components
     */
    flattenAsArray(): number[];
    /**
     * Checks if this vector is a dummy vector (empty).
     * @returns True if the vector is dummy (has no components), false otherwise
     */
    isDummy(): boolean;
    /**
     * Checks if this vector is approximately equal to another vector within a tolerance.
     * @param vec - The vector to compare with
     * @param delta - The tolerance for comparison (default: Number.EPSILON)
     * @returns True if vectors are approximately equal, false otherwise
     */
    isEqual(vec: IVector3, delta?: number): boolean;
    /**
     * Checks if this vector is strictly equal to another vector (exact comparison).
     * @param vec - The vector to compare with
     * @returns True if vectors are exactly equal, false otherwise
     */
    isStrictEqual(vec: IVector3): boolean;
    /**
     * Gets the component at the specified index.
     * @param i - The index (0 for x, 1 for y, 2 for z)
     * @returns The component value at the specified index
     */
    at(i: number): number;
    /**
     * Calculates the length (magnitude) of the vector.
     * @returns The length of the vector
     */
    length(): number;
    /**
     * Calculates the squared length of the vector.
     * This is more efficient than calculating the actual length when only comparison is needed.
     * @returns The squared length of the vector
     */
    lengthSquared(): number;
    /**
     * Calculates the distance from this vector to another vector.
     * @param vec - The target vector
     * @returns The distance between the vectors
     */
    lengthTo(vec: IVector3): number;
    /**
     * Calculates the dot product of this vector with another vector.
     * @param vec - The vector to calculate dot product with
     * @returns The dot product result
     */
    dot(vec: IVector3): number;
    /**
     * Gets the class name.
     * @returns The class name "Vector3"
     */
    get className(): string;
    /**
     * Creates a copy of this vector.
     * @returns A new vector with the same components
     */
    clone(): any;
    /**
     * Gets the number of bytes per component.
     * @returns The number of bytes per component (4 for Float32Array, 8 for Float64Array)
     */
    get bytesPerComponent(): number;
    /**
     * Performs linear interpolation between two vectors (static version).
     * @param lhs - The start vector
     * @param rhs - The end vector
     * @param ratio - The interpolation ratio (0.0 to 1.0)
     * @param type - The typed array constructor to use
     * @returns A new vector containing the interpolated result
     */
    static _lerp(lhs: IVector3, rhs: IVector3, ratio: number, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * Creates a vector from a 3-element array.
     * @param array - The array containing x, y, z components
     * @param type - The typed array constructor to use
     * @returns A new vector
     */
    static _fromCopyArray3(array: Array3<number>, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * Creates a vector from individual x, y, z components.
     * @param x - The x component
     * @param y - The y component
     * @param z - The z component
     * @param type - The typed array constructor to use
     * @returns A new vector
     */
    static _fromCopy3(x: number, y: number, z: number, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * Creates a vector from an array (takes first 3 elements).
     * @param array - The array containing the components
     * @param type - The typed array constructor to use
     * @returns A new vector
     */
    static _fromCopyArray(array: Array<number>, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * Creates a vector by copying from another Vector3.
     * @param vec3 - The source vector to copy from
     * @param type - The typed array constructor to use
     * @returns A new vector
     */
    static _fromCopyVector3(vec3: IVector3, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * Creates a Vector3 from a Vector4 (drops the w component).
     * @param vec4 - The source Vector4 to copy from
     * @param type - The typed array constructor to use
     * @returns A new vector
     */
    static _fromCopyVector4(vec4: IVector4, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * Creates a Vector3 from a Vector2 (sets z component to 0).
     * @param vec2 - The source Vector2 to copy from
     * @param type - The typed array constructor to use
     * @returns A new vector
     */
    static _fromVector2(vec2: IVector2, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
}
/**
 * Immutable 3D vector class with 32-bit float components.
 * This is the standard precision implementation for most 3D graphics operations.
 * Provides efficient vector operations for position, direction, and other 3D calculations.
 *
 * @example
 * ```typescript
 * const v1 = Vector3.fromCopy3(1, 2, 3);
 * const v2 = Vector3.fromCopy3(4, 5, 6);
 * const sum = Vector3.add(v1, v2);
 * ```
 */
export declare class Vector3 extends Vector3_<Float32ArrayConstructor> {
    /**
     * Creates a new Vector3 instance from a typed array.
     * @param v - The Float32Array containing the vector components
     */
    constructor(v: TypedArray);
    /**
     * Creates a vector from a 3-element array.
     * @param array - Array containing [x, y, z] components
     * @returns A new Vector3 instance
     */
    static fromCopyArray3(array: Array3<number>): Vector3;
    /**
     * Creates a vector from individual x, y, z components.
     * @param x - The x component
     * @param y - The y component
     * @param z - The z component
     * @returns A new Vector3 instance
     */
    static fromCopy3(x: number, y: number, z: number): Vector3;
    /**
     * Creates a vector with all components set to the same value.
     * @param val - The value to set for all components
     * @returns A new Vector3 instance
     */
    static fromCopy1(val: number): Vector3;
    /**
     * Creates a vector from an array (takes first 3 elements).
     * @param array - The array containing the components
     * @returns A new Vector3 instance
     */
    static fromCopyArray(array: Array<number>): Vector3;
    /**
     * Creates a vector by copying from another Vector3.
     * @param vec3 - The source vector to copy from
     * @returns A new Vector3 instance
     */
    static fromCopyVector3(vec3: IVector3): Vector3;
    /**
     * Creates a Vector3 from a Vector4 (drops the w component).
     * @param vec4 - The source Vector4 to copy from
     * @returns A new Vector3 instance
     */
    static fromCopyVector4(vec4: IVector4): Vector3;
    /**
     * Creates a vector from an ArrayBuffer.
     * @param arrayBuffer - The ArrayBuffer containing the vector data
     * @returns A new Vector3 instance
     */
    static fromArrayBuffer(arrayBuffer: ArrayBuffer): Vector3;
    /**
     * Creates a vector from a Float32Array.
     * @param float32Array - The Float32Array containing the vector data
     * @returns A new Vector3 instance
     */
    static fromFloat32Array(float32Array: Float32Array): Vector3;
    /**
     * Creates a vector by copying data from a Float32Array.
     * @param float32Array - The Float32Array to copy from
     * @returns A new Vector3 instance
     */
    static fromCopyFloat32Array(float32Array: Float32Array): Vector3;
    /**
     * Creates a zero vector (0, 0, 0).
     * @returns A new Vector3 instance with all components set to 0
     */
    static zero(): Vector3;
    /**
     * Creates a vector with all components set to 1 (1, 1, 1).
     * @returns A new Vector3 instance with all components set to 1
     */
    static one(): Vector3;
    /**
     * Creates an empty dummy vector for placeholder purposes.
     * @returns A new dummy Vector3 instance
     */
    static dummy(): Vector3;
    /**
     * Normalizes a vector to unit length.
     * @param vec - The vector to normalize
     * @returns A new normalized Vector3 instance
     */
    static normalize(vec: IVector3): Vector3;
    /**
     * Adds two vectors component-wise.
     * @param l_vec - The first vector
     * @param r_vec - The second vector
     * @returns A new Vector3 instance containing the sum
     */
    static add(l_vec: IVector3, r_vec: IVector3): Vector3;
    /**
     * Subtracts the second vector from the first vector.
     * @param l_vec - The vector to subtract from
     * @param r_vec - The vector to subtract
     * @returns A new Vector3 instance containing the difference
     */
    static subtract(l_vec: IVector3, r_vec: IVector3): Vector3;
    /**
     * Multiplies a vector by a scalar value.
     * @param vec - The vector to multiply
     * @param value - The scalar value to multiply by
     * @returns A new Vector3 instance containing the scaled result
     */
    static multiply(vec: IVector3, value: number): Vector3;
    /**
     * Multiplies two vectors component-wise.
     * @param l_vec - The first vector
     * @param r_vec - The second vector
     * @returns A new Vector3 instance containing the component-wise product
     */
    static multiplyVector(l_vec: IVector3, r_vec: IVector3): Vector3;
    /**
     * Transforms a 3D vector by a 4x4 matrix.
     * @param vec - The vector to transform
     * @param mat - The 4x4 transformation matrix
     * @returns A new Vector3 instance containing the transformed result
     */
    static multiplyMatrix4(vec: IVector3, mat: IMatrix44): Vector3;
    /**
     * Divides a vector by a scalar value.
     * @param vec - The vector to divide
     * @param value - The scalar value to divide by
     * @returns A new Vector3 instance containing the divided result
     */
    static divide(vec: IVector3, value: number): Vector3;
    /**
     * Divides two vectors component-wise.
     * @param l_vec - The vector to divide
     * @param r_vec - The vector to divide by
     * @returns A new Vector3 instance containing the component-wise division result
     */
    static divideVector(l_vec: IVector3, r_vec: IVector3): Vector3;
    /**
     * Calculates the cross product of two vectors.
     * @param l_vec - The first vector (left operand)
     * @param r_vec - The second vector (right operand)
     * @returns A new Vector3 instance containing the cross product result
     */
    static cross(l_vec: IVector3, r_vec: IVector3): Vector3;
    /**
     * Transforms a vector by a quaternion rotation.
     * @param quat - The quaternion to apply
     * @param vec - The vector to transform
     * @returns A new Vector3 instance containing the transformed result
     */
    static multiplyQuaternion(quat: IQuaternion, vec: IVector3): Vector3;
    /**
     * Performs linear interpolation between two vectors.
     * @param lhs - The start vector
     * @param rhs - The end vector
     * @param ratio - The interpolation ratio (0.0 to 1.0)
     * @returns A new Vector3 instance containing the interpolated result
     */
    static lerp(lhs: IVector3, rhs: IVector3, ratio: number): Vector3;
}
/**
 * Immutable 3D vector class with 64-bit float components.
 * This high-precision implementation is suitable for applications requiring
 * double precision floating-point calculations, such as scientific computing
 * or when dealing with very large coordinate systems.
 *
 * @example
 * ```typescript
 * const v1 = Vector3d.fromCopy3(1.123456789, 2.987654321, 3.456789123);
 * const v2 = Vector3d.fromCopy3(4.111111111, 5.222222222, 6.333333333);
 * const sum = Vector3d.add(v1, v2);
 * ```
 */
export declare class Vector3d extends Vector3_<Float64ArrayConstructor> {
    /**
     * Creates a new Vector3d instance from a typed array.
     * @param v - The Float64Array containing the vector components
     */
    private constructor();
    /**
     * Creates a vector from a 3-element array.
     * @param array - Array containing [x, y, z] components
     * @returns A new Vector3d instance
     */
    static fromCopyArray3(array: Array3<number>): Vector3d;
    /**
     * Creates a vector from individual x, y, z components.
     * @param x - The x component
     * @param y - The y component
     * @param z - The z component
     * @returns A new Vector3d instance
     */
    static fromCopy3(x: number, y: number, z: number): Vector3d;
    /**
     * Creates a vector with all components set to the same value.
     * @param val - The value to set for all components
     * @returns A new Vector3d instance
     */
    static fromCopy1(val: number): Vector3d;
    /**
     * Creates a vector from an array (takes first 3 elements).
     * @param array - The array containing the components
     * @returns A new Vector3d instance
     */
    static fromCopyArray(array: Array<number>): Vector3d;
    /**
     * Creates a vector from an ArrayBuffer.
     * @param arrayBuffer - The ArrayBuffer containing the vector data
     * @returns A new Vector3d instance
     */
    static fromArrayBuffer(arrayBuffer: ArrayBuffer): Vector3d;
    /**
     * Creates a vector from a Float64Array.
     * @param float64Array - The Float64Array containing the vector data
     * @returns A new Vector3d instance
     */
    static fromFloat64Array(float64Array: Float64Array): Vector3d;
    /**
     * Creates a zero vector (0, 0, 0).
     * @returns A new Vector3d instance with all components set to 0
     */
    static zero(): Vector3d;
    /**
     * Creates a vector with all components set to 1 (1, 1, 1).
     * @returns A new Vector3d instance with all components set to 1
     */
    static one(): Vector3d;
    /**
     * Creates an empty dummy vector for placeholder purposes.
     * @returns A new dummy Vector3d instance
     */
    static dummy(): Vector3d;
    /**
     * Normalizes a vector to unit length.
     * @param vec - The vector to normalize
     * @returns A new normalized Vector3d instance
     */
    static normalize(vec: IVector3): Vector3d;
    /**
     * Adds two vectors component-wise.
     * @param l_vec - The first vector
     * @param r_vec - The second vector
     * @returns A new Vector3d instance containing the sum
     */
    static add(l_vec: IVector3, r_vec: IVector3): Vector3d;
    /**
     * Subtracts the second vector from the first vector.
     * @param l_vec - The vector to subtract from
     * @param r_vec - The vector to subtract
     * @returns A new Vector3d instance containing the difference
     */
    static subtract(l_vec: IVector3, r_vec: IVector3): Vector3d;
    /**
     * Multiplies a vector by a scalar value.
     * @param vec - The vector to multiply
     * @param value - The scalar value to multiply by
     * @returns A new Vector3d instance containing the scaled result
     */
    static multiply(vec: IVector3, value: number): Vector3d;
    /**
     * Multiplies two vectors component-wise.
     * @param l_vec - The first vector
     * @param r_vec - The second vector
     * @returns A new Vector3d instance containing the component-wise product
     */
    static multiplyVector(l_vec: IVector3, r_vec: IVector3): Vector3d;
    /**
     * Transforms a 3D vector by a 4x4 matrix.
     * @param vec - The vector to transform
     * @param mat - The 4x4 transformation matrix
     * @returns A new Vector3d instance containing the transformed result
     */
    static multiplyMatrix4(vec: IVector3, mat: IMatrix44): Vector3d;
    /**
     * Divides a vector by a scalar value.
     * @param vec - The vector to divide
     * @param value - The scalar value to divide by
     * @returns A new Vector3d instance containing the divided result
     */
    static divide(vec: IVector3, value: number): Vector3d;
    /**
     * Divides two vectors component-wise.
     * @param l_vec - The vector to divide
     * @param r_vec - The vector to divide by
     * @returns A new Vector3d instance containing the component-wise division result
     */
    static divideVector(l_vec: IVector3, r_vec: IVector3): Vector3d;
    /**
     * Calculates the cross product of two vectors.
     * @param l_vec - The first vector (left operand)
     * @param r_vec - The second vector (right operand)
     * @returns A new Vector3d instance containing the cross product result
     */
    static cross(l_vec: IVector3, r_vec: IVector3): Vector3d;
    /**
     * Transforms a vector by a quaternion rotation.
     * @param quat - The quaternion to apply
     * @param vec - The vector to transform
     * @returns A new Vector3d instance containing the transformed result
     */
    static multiplyQuaternion(quat: IQuaternion, vec: IVector3): Vector3d;
    /**
     * Performs linear interpolation between two vectors.
     * @param lhs - The start vector
     * @param rhs - The end vector
     * @param ratio - The interpolation ratio (0.0 to 1.0)
     * @returns A new Vector3d instance containing the interpolated result
     */
    static lerp(lhs: IVector3, rhs: IVector3, ratio: number): Vector3d;
}
/**
 * Type alias for Vector3 with 32-bit float precision.
 * @deprecated Use Vector3 directly instead
 */
export type Vector3f = Vector3;
/**
 * Constant vector representing (1, 1, 1).
 * Useful for scaling operations or as a default "one" value.
 */
export declare const ConstVector3_1_1_1: Vector3;
/**
 * Constant vector representing (0, 0, 0).
 * Useful as an origin point or for zero/null vector operations.
 */
export declare const ConstVector3_0_0_0: Vector3;
