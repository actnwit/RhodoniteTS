import type { Array4 } from '../../types/CommonTypes';
import { AbstractQuaternion } from './AbstractQuaternion';
import type { IMatrix44 } from './IMatrix';
import type { ILogQuaternion, IMutableQuaternion, IQuaternion } from './IQuaternion';
import type { IMutableVector3, IVector3, IVector4 } from './IVector';
import { Vector3 } from './Vector3';
/**
 * Represents an immutable quaternion that extends AbstractQuaternion.
 * Quaternions are used to represent rotations in 3D space and offer advantages
 * over Euler angles such as avoiding gimbal lock and providing smooth interpolation.
 *
 * A quaternion consists of four components: x, y, z (vector part) and w (scalar part).
 * For unit quaternions representing rotations: q = w + xi + yj + zk where i² = j² = k² = ijk = -1
 *
 * @example
 * ```typescript
 * // Create identity quaternion (no rotation)
 * const identity = Quaternion.identity();
 *
 * // Create quaternion from axis-angle representation
 * const axis = Vector3.fromCopy3(0, 1, 0); // Y-axis
 * const angle = Math.PI / 4; // 45 degrees
 * const rotation = Quaternion.fromAxisAngle(axis, angle);
 *
 * // Multiply quaternions to combine rotations
 * const combined = Quaternion.multiply(rotation1, rotation2);
 * ```
 */
export declare class Quaternion extends AbstractQuaternion implements IQuaternion {
    private static __tmp_upVec;
    private static __tmp_vec3_0;
    private static __tmp_vec3_1;
    private static __tmp_vec3_2;
    private static __tmp_vec3_3;
    private static __tmp_vec3_4;
    private static __tmp_vec3_5;
    /**
     * Creates a new Quaternion instance.
     * @param x - The Float32Array containing the quaternion components [x, y, z, w]
     */
    constructor(x: Float32Array);
    /**
     * Gets the class name for debugging and reflection purposes.
     * @returns The string "Quaternion"
     */
    get className(): string;
    /**
     * Gets the composition type for this quaternion class.
     * @returns CompositionType.Vec4 indicating this is a 4-component vector
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
     * Creates an identity quaternion representing no rotation.
     * The identity quaternion is (0, 0, 0, 1) in (x, y, z, w) format.
     * @returns A new identity quaternion
     */
    static identity(): Quaternion;
    /**
     * Creates a dummy quaternion with zero-length internal array.
     * Used as a placeholder or uninitialized quaternion.
     * @returns A new dummy quaternion
     */
    static dummy(): Quaternion;
    /**
     * Computes the inverse of a quaternion.
     * For a unit quaternion, the inverse is the conjugate divided by the squared magnitude.
     * @param quat - The quaternion to invert
     * @returns The inverted quaternion, or zero quaternion if input has zero length
     */
    static invert(quat: IQuaternion): IQuaternion;
    /**
     * Computes the inverse of a quaternion and stores the result in the output parameter.
     * @param quat - The quaternion to invert
     * @param out - The output quaternion to store the result
     * @returns The output quaternion containing the inverted result
     */
    static invertTo(quat: IQuaternion, out: IMutableQuaternion): IQuaternion;
    /**
     * Performs spherical linear interpolation (SLERP) between two quaternions.
     * SLERP provides smooth rotation interpolation that maintains constant angular velocity.
     * @param l_quat - The starting quaternion
     * @param r_quat - The ending quaternion
     * @param ratio - The interpolation parameter (0.0 = l_quat, 1.0 = r_quat)
     * @returns The interpolated quaternion
     */
    static qlerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): IQuaternion;
    /**
     * Performs spherical linear interpolation (SLERP) and stores the result in the output parameter.
     * @param l_quat - The starting quaternion
     * @param r_quat - The ending quaternion
     * @param ratio - The interpolation parameter (0.0 = l_quat, 1.0 = r_quat)
     * @param out - The output quaternion to store the result
     * @returns The output quaternion containing the interpolated result
     */
    static qlerpTo(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * Performs linear interpolation (LERP) between two quaternions.
     * Note: LERP does not maintain constant angular velocity like SLERP.
     * @param l_quat - The starting quaternion
     * @param r_quat - The ending quaternion
     * @param ratio - The interpolation parameter (0.0 = l_quat, 1.0 = r_quat)
     * @returns The linearly interpolated quaternion
     */
    static lerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): Quaternion;
    /**
     * Performs linear interpolation (LERP) and stores the result in the output parameter.
     * @param l_quat - The starting quaternion
     * @param r_quat - The ending quaternion
     * @param ratio - The interpolation parameter (0.0 = l_quat, 1.0 = r_quat)
     * @param out - The output quaternion to store the result
     * @returns The output quaternion containing the interpolated result
     */
    static lerpTo(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * Creates a quaternion from an axis-angle representation.
     * @param vec - The rotation axis (will be normalized internally)
     * @param radian - The rotation angle in radians
     * @returns A quaternion representing the rotation around the given axis
     */
    static axisAngle(vec: IVector3, radian: number): Quaternion;
    /**
     * Creates a quaternion from a 4x4 rotation matrix.
     * Extracts the rotation component from the matrix and converts it to quaternion form.
     * @param mat - The 4x4 matrix containing rotation information
     * @returns A quaternion representing the same rotation as the matrix
     */
    static fromMatrix(mat: IMatrix44): Quaternion;
    /**
     * Creates a quaternion from a 4x4 rotation matrix and stores it in the output parameter.
     * @param mat - The 4x4 matrix containing rotation information
     * @param out - The output quaternion to store the result
     * @returns The output quaternion containing the extracted rotation
     */
    static fromMatrixTo(mat: IMatrix44, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * Creates a quaternion that rotates from one direction to another.
     * @param fromDirection - The initial direction vector
     * @param toDirection - The target direction vector
     * @returns A quaternion representing the rotation from fromDirection to toDirection
     */
    static lookFromTo(fromDirection: IVector3, toDirection: IVector3): IQuaternion;
    /**
     * Creates a quaternion that looks in the specified forward direction using default up vector (0, 1, 0).
     * @param forward - The forward direction vector
     * @returns A quaternion representing the look rotation
     */
    static lookForward(forward: IVector3): IQuaternion;
    /**
     * Creates a quaternion that looks in the specified forward direction with a custom up vector.
     * @param forward - The forward direction vector
     * @param up - The up direction vector
     * @returns A quaternion representing the look rotation with the specified up vector
     */
    static lookForwardAccordingToThisUp(forward: IVector3, up: IVector3): IQuaternion;
    /**
     * Creates a quaternion from a position vector, with w component set to 0.
     * This is useful for representing pure translations in quaternion form.
     * @param vec - The position vector
     * @returns A quaternion with xyz from the vector and w=0
     */
    static fromPosition(vec: IVector3): Quaternion;
    /**
     * Adds two quaternions component-wise.
     * @param l_quat - The left quaternion
     * @param r_quat - The right quaternion
     * @returns The sum of the two quaternions
     */
    static add(l_quat: IQuaternion, r_quat: IQuaternion): Quaternion;
    /**
     * Adds two quaternions component-wise and stores the result in the output parameter.
     * @param l_quat - The left quaternion
     * @param r_quat - The right quaternion
     * @param out - The output quaternion to store the result
     * @returns The output quaternion containing the sum
     */
    static addTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * Subtracts the right quaternion from the left quaternion component-wise.
     * @param l_quat - The left quaternion
     * @param r_quat - The right quaternion
     * @returns The difference of the two quaternions
     */
    static subtract(l_quat: IQuaternion, r_quat: IQuaternion): Quaternion;
    /**
     * Subtracts two quaternions component-wise and stores the result in the output parameter.
     * @param l_quat - The left quaternion
     * @param r_quat - The right quaternion
     * @param out - The output quaternion to store the result
     * @returns The output quaternion containing the difference
     */
    static subtractTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * Multiplies two quaternions using Hamilton's quaternion multiplication.
     * This combines the rotations represented by both quaternions.
     * Note: Quaternion multiplication is not commutative (order matters).
     * @param l_quat - The left quaternion
     * @param r_quat - The right quaternion
     * @returns The product of the two quaternions
     */
    static multiply(l_quat: IQuaternion, r_quat: IQuaternion): Quaternion;
    /**
     * Multiplies two quaternions and stores the result in the output parameter.
     * @param l_quat - The left quaternion
     * @param r_quat - The right quaternion
     * @param out - The output quaternion to store the result
     * @returns The output quaternion containing the product
     */
    static multiplyTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * Multiplies a quaternion by a scalar value.
     * @param quat - The quaternion to multiply
     * @param value - The scalar value to multiply by
     * @returns A new quaternion with all components multiplied by the scalar
     */
    static multiplyNumber(quat: IQuaternion, value: number): Quaternion;
    /**
     * Multiplies a quaternion by a scalar and stores the result in the output parameter.
     * @param quat - The quaternion to multiply
     * @param value - The scalar value to multiply by
     * @param out - The output quaternion to store the result
     * @returns The output quaternion containing the scaled result
     */
    static multiplyNumberTo(quat: IQuaternion, value: number, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * Divides a quaternion by a scalar value.
     * @param quat - The quaternion to divide
     * @param value - The scalar value to divide by (must not be zero)
     * @returns A new quaternion with all components divided by the scalar
     */
    static divideNumber(quat: IQuaternion, value: number): Quaternion;
    /**
     * Divides a quaternion by a scalar and stores the result in the output parameter.
     * @param quat - The quaternion to divide
     * @param value - The scalar value to divide by (must not be zero)
     * @param out - The output quaternion to store the result
     * @returns The output quaternion containing the divided result
     */
    static divideNumberTo(quat: IQuaternion, value: number, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * Converts the quaternion to a string representation.
     * @returns A string in the format "(x, y, z, w)"
     */
    toString(): string;
    /**
     * Converts the quaternion to an approximately formatted string using financial precision.
     * @returns A formatted string with components separated by spaces and ending with newline
     */
    toStringApproximately(): string;
    /**
     * Converts the quaternion to a flat array representation.
     * @returns An array containing [x, y, z, w] components
     */
    flattenAsArray(): number[];
    /**
     * Checks if this quaternion is a dummy (uninitialized) quaternion.
     * @returns True if the internal array has zero length, false otherwise
     */
    isDummy(): boolean;
    /**
     * Checks if this quaternion is approximately equal to another quaternion within a tolerance.
     * @param quat - The quaternion to compare with
     * @param delta - The tolerance value (default: Number.EPSILON)
     * @returns True if all components are within the tolerance, false otherwise
     */
    isEqual(quat: IQuaternion, delta?: number): boolean;
    /**
     * Checks if this quaternion is exactly equal to another quaternion.
     * @param quat - The quaternion to compare with
     * @returns True if all components are exactly equal, false otherwise
     */
    isStrictEqual(quat: IQuaternion): boolean;
    /**
     * Converts the quaternion to Euler angles and stores the result in the output vector.
     * The rotation order is XYZ (roll, pitch, yaw).
     * @param out - The output vector to store the Euler angles [x, y, z]
     * @returns The output vector containing the Euler angles in radians
     */
    toEulerAnglesTo(out: IMutableVector3): IMutableVector3;
    /**
     * Converts the quaternion to Euler angles.
     * The rotation order is XYZ (roll, pitch, yaw).
     * @returns A new Vector3 containing the Euler angles in radians
     */
    toEulerAngles(): Vector3;
    /**
     * Private helper method for dividing a quaternion by a scalar value.
     * @param vec - The quaternion to divide
     * @param value - The scalar value to divide by
     * @returns A new quaternion with divided components, or Infinity components if division by zero
     */
    private static _divide;
    /**
     * Private helper method for dividing a quaternion by a scalar and storing the result.
     * @param vec - The quaternion to divide
     * @param value - The scalar value to divide by
     * @param out - The output quaternion to store the result
     * @returns The output quaternion with divided components
     */
    private static _divideTo;
    /**
     * Normalizes a quaternion to unit length.
     * @param vec - The quaternion to normalize
     * @returns A new normalized quaternion
     */
    static normalize(vec: IQuaternion): Quaternion;
    /**
     * Normalizes a quaternion to unit length and stores the result in the output parameter.
     * @param vec - The quaternion to normalize
     * @param out - The output quaternion to store the result
     * @returns The output quaternion containing the normalized result
     */
    static normalizeTo(vec: IQuaternion, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * Creates a quaternion representing the rotation from one vector to another.
     * This is an instance method version of the static fromToRotation.
     * @param from - The starting direction vector
     * @param to - The target direction vector
     * @returns The normalized quaternion representing the rotation
     */
    fromToRotation(from: IVector3, to: IVector3): Quaternion;
    /**
     * Creates a quaternion representing the rotation from one vector to another (static version).
     * @param from - The starting direction vector
     * @param to - The target direction vector
     * @returns A normalized quaternion representing the rotation
     */
    static fromToRotation(from: IVector3, to: IVector3): Quaternion;
    /**
     * Creates a quaternion representing the rotation from one vector to another and stores it in the output parameter.
     * @param from - The starting direction vector
     * @param to - The target direction vector
     * @param out - The output quaternion to store the result
     * @returns The output quaternion containing the normalized rotation
     */
    static fromToRotationTo(from: IVector3, to: IVector3, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * Transforms a 3D vector by this quaternion rotation.
     * Applies the rotation represented by this quaternion to the input vector.
     * @param v - The vector to transform
     * @returns A new transformed vector
     */
    transformVector3(v: IVector3): Vector3;
    /**
     * Transforms a 3D vector by this quaternion rotation and stores the result in the output parameter.
     * @param v - The vector to transform
     * @param out - The output vector to store the result
     * @returns The output vector containing the transformed result
     */
    transformVector3To(v: IVector3, out: IMutableVector3): IMutableVector3;
    /**
     * Transforms a 3D vector by the inverse of this quaternion rotation.
     * @param v - The vector to transform
     * @returns A new transformed vector
     */
    transformVector3Inverse(v: IVector3): IVector3;
    /**
     * Creates a deep copy of this quaternion.
     * @returns A new quaternion with the same component values
     */
    clone(): Quaternion;
    /**
     * Creates a quaternion from a Float32Array.
     * @param array - The Float32Array containing quaternion components
     * @returns A new quaternion using the provided array
     */
    static fromFloat32Array(array: Float32Array): Quaternion;
    /**
     * Creates a quaternion from a 4-element array.
     * @param array - The array containing [x, y, z, w] components
     * @returns A new quaternion with copied components
     */
    static fromCopyArray4(array: Array4<number>): Quaternion;
    /**
     * Creates a quaternion from a variable-length array (taking first 4 elements).
     * @param array - The array containing quaternion components
     * @returns A new quaternion with the first 4 components copied
     */
    static fromCopyArray(array: Array<number>): Quaternion;
    /**
     * Creates a quaternion from individual component values.
     * @param x - The x component
     * @param y - The y component
     * @param z - The z component
     * @param w - The w component
     * @returns A new quaternion with the specified components
     */
    static fromCopy4(x: number, y: number, z: number, w: number): Quaternion;
    /**
     * Creates a quaternion by copying from another quaternion.
     * @param quat - The quaternion to copy from
     * @returns A new quaternion with copied components
     */
    static fromCopyQuaternion(quat: IQuaternion): Quaternion;
    /**
     * Creates a quaternion by copying from a 4D vector.
     * @param vec - The 4D vector to copy from
     * @returns A new quaternion with components copied from the vector
     */
    static fromCopyVector4(vec: IVector4): Quaternion;
    /**
     * Creates a quaternion from a log quaternion representation.
     * @param x - The log quaternion to convert
     * @returns A new quaternion converted from log space
     */
    static fromCopyLogQuaternion(x: ILogQuaternion): Quaternion;
    /**
     * Creates a quaternion from an axis-angle representation.
     * @param axis - The rotation axis vector
     * @param rad - The rotation angle in radians
     * @returns A new quaternion representing the rotation
     */
    static fromAxisAngle(axis: IVector3, rad: number): Quaternion;
    /**
     * Creates a quaternion from an axis-angle representation and stores it in the output parameter.
     * @param axis - The rotation axis vector
     * @param rad - The rotation angle in radians
     * @param out - The output quaternion to store the result
     * @returns The output quaternion containing the rotation
     */
    static fromAxisAngleTo(axis: IVector3, rad: number, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * Gets the rotation angle (0 to π) represented by a quaternion.
     * @param q - The quaternion to analyze (assumed to be normalized)
     * @returns The rotation angle in radians
     */
    static getQuaternionAngle(q: IQuaternion): number;
    /**
     * Clamps the rotation angle of a quaternion to a maximum value.
     * If the quaternion's rotation angle exceeds thetaMax, it scales the rotation down.
     * @param quat - The quaternion to clamp
     * @param thetaMax - The maximum allowed rotation angle in radians
     * @returns A quaternion with rotation angle clamped to thetaMax
     */
    static clampRotation(quat: IQuaternion, thetaMax: number): IQuaternion;
}
