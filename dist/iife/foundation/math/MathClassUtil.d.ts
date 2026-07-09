import type { CompositionTypeEnum } from '../definitions/CompositionType';
import { Matrix33 } from './Matrix33';
import { Matrix44 } from './Matrix44';
import { MutableVector3 } from './MutableVector3';
import { Quaternion } from './Quaternion';
import { Vector2 } from './Vector2';
import { Vector3 } from './Vector3';
import { Vector4 } from './Vector4';
/**
 * Utility class providing various mathematical operations and conversions for vector, matrix, and quaternion types.
 * This class contains static methods for converting between different mathematical representations,
 * performing arithmetic operations, and manipulating mathematical objects.
 */
export declare class MathClassUtil {
    private static __tmpVector4_0;
    private static __tmpVector4_1;
    /**
     * Converts an array of numbers to the appropriate Vector type based on array length.
     * @param element - Array of numbers to convert
     * @returns Vector2, Vector3, or Vector4 instance based on array length, or the original element if not an array
     */
    static arrayToVector(element: Array<number>): Vector2 | Vector3 | Vector4;
    /**
     * Converts an array of numbers to the appropriate Vector or Matrix type based on array length.
     * Supports conversion to Matrix44, Matrix33, Vector4, Vector3, or Vector2.
     * @param element - Array of numbers to convert
     * @returns Matrix44, Matrix33, Vector4, Vector3, or Vector2 instance based on array length, or the original element if not an array
     */
    static arrayToVectorOrMatrix(element: Array<number>): Matrix33 | Matrix44 | Vector2 | Vector3 | Vector4;
    /**
     * Gets the immutable value class constructor for a given composition type.
     * @param compositionType - The composition type enum value
     * @returns Constructor function for the corresponding immutable math class, or undefined if not supported
     */
    static getImmutableValueClass(compositionType: CompositionTypeEnum): Function | undefined;
    /**
     * Gets the mutable value class constructor for a given composition type.
     * @param compositionType - The composition type enum value
     * @returns Constructor function for the corresponding mutable math class, or undefined if not supported
     */
    static getMutableValueClass(compositionType: CompositionTypeEnum): Function | undefined;
    /**
     * Creates a deep clone of mathematical objects (matrices and vectors).
     * @param element - The mathematical object to clone
     * @returns A cloned instance of the input object, or the original element if it's not a mathematical object
     */
    static cloneOfMathObjects(element: any): any;
    /**
     * Checks if an array is suitable for quaternion conversion (has 4 elements).
     * @param element - Array to check
     * @returns True if the array has 4 elements and can be converted to a quaternion
     */
    static isAcceptableArrayForQuaternion(element: Array<number>): boolean;
    /**
     * Converts a 4-element array to a Quaternion instance.
     * @param element - Array of 4 numbers representing quaternion components [x, y, z, w]
     * @returns Quaternion instance created from the array elements
     */
    static arrayToQuaternion(element: Array<number>): Quaternion;
    /**
     * Creates a sub-array with the specified number of components from the beginning of the input array.
     * @param array - Source array to extract elements from
     * @param componentN - Number of components to extract (1-4)
     * @returns Sub-array with the specified number of elements, or single element if componentN is 1
     */
    static makeSubArray(array: Array<any>, componentN: number): any;
    /**
     * Converts vector instances to arrays of their component values.
     * @param element - Vector2, Vector3, Vector4, or Quaternion instance
     * @returns Array representation of the vector components, or the original element if not a vector
     */
    static vectorToArray(element: Vector2 | Vector3 | Vector4 | Quaternion): number[];
    /**
     * Determines the number of components in a vector instance or array.
     * @param element - Vector instance or array to analyze
     * @returns Number of components (2 for Vector2, 3 for Vector3, 4 for Vector4/Quaternion, array length for arrays, 0 for unsupported types)
     */
    static componentNumberOfVector(element: Vector2 | Vector3 | Vector4 | Quaternion | Array<any>): number;
    /**
     * Packs a normalized 4D vector into a 2D vector using a grid-based encoding scheme.
     * Input values must be in the range [-1, 1] and are converted to [0, 1] internally.
     * @param x - X component of the 4D vector (must be in range [-1, 1])
     * @param y - Y component of the 4D vector (must be in range [-1, 1])
     * @param z - Z component of the 4D vector (must be in range [-1, 1])
     * @param w - W component of the 4D vector (must be in range [-1, 1])
     * @param criteria - Grid resolution for encoding (determines precision)
     * @returns Array of 2 values representing the packed vector
     */
    static packNormalizedVec4ToVec2(x: number, y: number, z: number, w: number, criteria: number): number[];
    /**
     * Unprojects a window coordinate to world space using the inverse projection-view matrix.
     * Converts 2D screen coordinates with depth to 3D world coordinates.
     * @param windowPosX - X coordinate in window space
     * @param windowPosY - Y coordinate in window space
     * @param windowPosZ - Z coordinate (depth) in window space
     * @param inversePVMat44 - Inverse of the projection-view matrix
     * @param viewportVec4 - Viewport parameters [x, y, width, height]
     * @param out - Output vector to store the result
     * @returns The unprojected 3D world position
     */
    static unProjectTo(windowPosX: number, windowPosY: number, windowPosZ: number, inversePVMat44: Matrix44, viewportVec4: Vector4, out: MutableVector3): import("./IVector").IMutableVector3;
    /**
     * Performs addition operation on various mathematical types.
     * Supports numbers, vectors, quaternions, and arrays.
     * @param lhs - Left-hand side operand
     * @param rhs - Right-hand side operand
     * @returns Result of the addition operation, type depends on input types
     */
    static add(lhs: any, rhs: any): any;
    /**
     * Performs subtraction operation on various mathematical types.
     * Supports numbers, vectors, quaternions, and arrays.
     * @param lhs - Left-hand side operand (minuend)
     * @param rhs - Right-hand side operand (subtrahend)
     * @returns Result of the subtraction operation, type depends on input types
     */
    static subtract(lhs: any, rhs: any): number | number[] | Quaternion | Vector2 | Vector3 | Vector4 | undefined;
    /**
     * Multiplies various mathematical types by a scalar number.
     * Supports numbers, vectors, quaternions, and arrays.
     * @param lhs - Mathematical object to multiply
     * @param rhs - Scalar multiplier
     * @returns Result of the scalar multiplication, type depends on input type
     */
    static multiplyNumber(lhs: any, rhs: number): number | number[] | Quaternion | Vector2 | Vector3 | Vector4 | undefined;
    /**
     * Divides various mathematical types by a scalar number.
     * Supports numbers, vectors, quaternions, and arrays.
     * @param lhs - Mathematical object to divide
     * @param rhs - Scalar divisor
     * @returns Result of the scalar division, type depends on input type
     */
    static divideNumber(lhs: any, rhs: number): number | number[] | Quaternion | Vector2 | Vector3 | Vector4 | undefined;
    /**
     * Initializes a mathematical object of the same type as the input with a scalar value.
     * For vectors and arrays, all components are set to the scalar value.
     * For quaternions, creates an identity quaternion.
     * @param objForDetectType - Object used to determine the target type
     * @param val - Scalar value to initialize with
     * @returns New instance of the same type as objForDetectType initialized with val
     */
    static initWithScalar(objForDetectType: any, val: number): number | number[] | Quaternion | Vector2 | Vector3 | Vector4 | undefined;
    /**
     * Initializes a mutable mathematical object from a value using a provided Float32Array as storage.
     * This method efficiently reuses memory by using the provided array as the backing store.
     * @param val - Value to initialize from (can be various mathematical types)
     * @param floatArray - Float32Array to use as backing storage
     * @returns Mutable mathematical object using the provided array as storage
     */
    static initWithFloat32Array(val: any, floatArray: Float32Array): any;
    /**
     * Forcefully sets the internal values of a mathematical object to match another object's values.
     * This method directly modifies the internal array representation for performance.
     * Performs equality check to avoid unnecessary operations.
     * @param objForDetectType - Target object to modify
     * @param val - Source object or value to copy from
     * @returns True if values were changed, false if they were already equal
     */
    static _setForce(objForDetectType: any, val: any): boolean;
}
