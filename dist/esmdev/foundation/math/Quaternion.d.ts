import type { Array4, FloatTypedArrayConstructor, TypedArray } from '../../types/CommonTypes';
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
export declare class Quaternion_<T extends FloatTypedArrayConstructor> extends AbstractQuaternion implements IQuaternion {
    /** The typed array constructor used for newly created quaternions. */
    protected static readonly _type: FloatTypedArrayConstructor;
    private static __tmp_upVec;
    private static __tmp_vec3_0;
    private static __tmp_vec3_1;
    private static __tmp_vec3_2;
    private static __tmp_vec3_3;
    private static __tmp_vec3_4;
    private static __tmp_vec3_5;
    /**
     * Creates a new Quaternion_ instance.
     * @param x - The typed array containing the quaternion components [x, y, z, w]
     * @param _options - Configuration object containing the typed array constructor
     */
    constructor(x: TypedArray, _options?: {
        type: T;
    });
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
    static identity(): Quaternion_<FloatTypedArrayConstructor>;
    /**
     * Creates a dummy quaternion with zero-length internal array.
     * Used as a placeholder or uninitialized quaternion.
     * @returns A new dummy quaternion
     */
    static dummy(): Quaternion_<FloatTypedArrayConstructor>;
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
    static lerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): Quaternion_<FloatTypedArrayConstructor>;
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
     * Attempts to create a quaternion from an axis-angle representation.
     *
     * Returns null when the axis has zero length (or contains non-finite values),
     * because such a rotation is undefined.
     *
     * @param vec - The rotation axis (will be normalized internally)
     * @param radian - The rotation angle in radians
     * @returns A quaternion representing the rotation around the given axis, or null
     */
    static tryAxisAngle(vec: IVector3, radian: number): Quaternion | null;
    /**
     * Creates a quaternion from an axis-angle representation.
     *
     * If the axis has zero length, an identity quaternion is returned instead of
     * a quaternion filled with `Infinity`/`NaN`.
     * Use {@link Quaternion.tryAxisAngle} when the caller needs to detect the failure.
     *
     * @param vec - The rotation axis (will be normalized internally)
     * @param radian - The rotation angle in radians
     * @returns A quaternion representing the rotation around the given axis,
     *          or the identity quaternion if the axis is degenerate
     */
    static axisAngle(vec: IVector3, radian: number): Quaternion;
    /**
     * Core implementation for extracting a quaternion from a 4x4 matrix.
     * Writes the x, y, z, w components into `outV`.
     *
     * The rotation part is normalized by its column lengths so that scale and
     * translation are ignored. Extraction is impossible (and the result would be
     * `NaN`) when a basis vector has zero length, when the linear part is
     * numerically singular, or when the matrix contains non-finite values.
     *
     * @param mat - The 4x4 matrix containing rotation information
     * @param outV - The destination for the x, y, z, w components
     * @returns True if the quaternion could be extracted, false otherwise
     * @private
     */
    private static __fromMatrixToTypedArray;
    /**
     * Attempts to create a quaternion from a 4x4 rotation matrix.
     * Extracts the rotation component from the matrix and converts it to quaternion form.
     *
     * @param mat - The 4x4 matrix containing rotation information
     * @returns A quaternion representing the same rotation as the matrix, or null
     *          if the rotation cannot be extracted (zero-length basis vector,
     *          numerically singular linear part, or non-finite values)
     */
    static tryFromMatrix(mat: IMatrix44): Quaternion | null;
    /**
     * Creates a quaternion from a 4x4 rotation matrix.
     * Extracts the rotation component from the matrix and converts it to quaternion form.
     *
     * If the rotation cannot be extracted, an identity quaternion is returned
     * instead of a quaternion filled with `Infinity`/`NaN`.
     * Use {@link Quaternion.tryFromMatrix} when the caller needs to detect the failure.
     *
     * @param mat - The 4x4 matrix containing rotation information
     * @returns A quaternion representing the same rotation as the matrix,
     *          or the identity quaternion if the rotation cannot be extracted
     */
    static fromMatrix(mat: IMatrix44): Quaternion;
    /**
     * Attempts to create a quaternion from a 4x4 rotation matrix and stores it in the output parameter.
     * The output quaternion is left untouched when the rotation cannot be extracted.
     *
     * @param mat - The 4x4 matrix containing rotation information
     * @param out - The output quaternion to store the result
     * @returns True if the quaternion could be extracted, false otherwise
     */
    static tryFromMatrixTo(mat: IMatrix44, out: IMutableQuaternion): boolean;
    /**
     * Creates a quaternion from a 4x4 rotation matrix and stores it in the output parameter.
     *
     * If the rotation cannot be extracted, the output quaternion is set to the
     * identity quaternion instead of being filled with `Infinity`/`NaN`.
     * Use {@link Quaternion.tryFromMatrixTo} when the caller needs to detect the failure.
     *
     * @param mat - The 4x4 matrix containing rotation information
     * @param out - The output quaternion to store the result
     * @returns The output quaternion containing the extracted rotation,
     *          or the identity quaternion if the rotation cannot be extracted
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
     * Attempts to create a quaternion that looks in the specified forward direction using default up vector (0, 1, 0).
     * @param forward - The forward direction vector
     * @returns A quaternion representing the look rotation, or null if the direction is degenerate
     */
    static tryLookForward(forward: IVector3): Quaternion | null;
    /**
     * Creates a quaternion that looks in the specified forward direction using default up vector (0, 1, 0).
     *
     * If the direction is degenerate (zero length), an identity quaternion is
     * returned instead of a quaternion filled with `Infinity`/`NaN`.
     * Use {@link Quaternion.tryLookForward} when the caller needs to detect the failure.
     *
     * @param forward - The forward direction vector
     * @returns A quaternion representing the look rotation,
     *          or the identity quaternion if the direction is degenerate
     */
    static lookForward(forward: IVector3): Quaternion;
    /**
     * Attempts to create a quaternion that looks in the specified forward direction with a custom up vector.
     *
     * Returns null when either direction has zero length or when the forward and
     * up directions are parallel, because the rotation basis cannot be built.
     *
     * @param forward - The forward direction vector
     * @param up - The up direction vector
     * @returns A quaternion representing the look rotation, or null
     */
    static tryLookForwardAccordingToThisUp(forward: IVector3, up: IVector3): Quaternion | null;
    /**
     * Creates a quaternion that looks in the specified forward direction with a custom up vector.
     *
     * If the directions are degenerate (zero length, or forward parallel to up),
     * an identity quaternion is returned instead of a quaternion filled with
     * `Infinity`/`NaN`.
     * Use {@link Quaternion.tryLookForwardAccordingToThisUp} when the caller needs
     * to detect the failure.
     *
     * @param forward - The forward direction vector
     * @param up - The up direction vector
     * @returns A quaternion representing the look rotation with the specified up vector,
     *          or the identity quaternion if the directions are degenerate
     */
    static lookForwardAccordingToThisUp(forward: IVector3, up: IVector3): IQuaternion;
    /**
     * Creates a quaternion from a position vector, with w component set to 0.
     * This is useful for representing pure translations in quaternion form.
     * @param vec - The position vector
     * @returns A quaternion with xyz from the vector and w=0
     */
    static fromPosition(vec: IVector3): Quaternion_<FloatTypedArrayConstructor>;
    /**
     * Adds two quaternions component-wise.
     * @param l_quat - The left quaternion
     * @param r_quat - The right quaternion
     * @returns The sum of the two quaternions
     */
    static add(l_quat: IQuaternion, r_quat: IQuaternion): Quaternion_<FloatTypedArrayConstructor>;
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
    static subtract(l_quat: IQuaternion, r_quat: IQuaternion): Quaternion_<FloatTypedArrayConstructor>;
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
    static multiply(l_quat: IQuaternion, r_quat: IQuaternion): Quaternion_<FloatTypedArrayConstructor>;
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
    static multiplyNumber(quat: IQuaternion, value: number): Quaternion_<FloatTypedArrayConstructor>;
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
     * If the divisor is zero, all components are set to 0 and an error is logged
     * instead of producing `Infinity`/`NaN`.
     *
     * @param quat - The quaternion to divide
     * @param value - The scalar value to divide by
     * @returns A new quaternion with all components divided by the scalar
     */
    static divideNumber(quat: IQuaternion, value: number): Quaternion_<FloatTypedArrayConstructor>;
    /**
     * Divides a quaternion by a scalar and stores the result in the output parameter.
     * If the divisor is zero, all components are set to 0 and an error is logged
     * instead of producing `Infinity`/`NaN`.
     *
     * @param quat - The quaternion to divide
     * @param value - The scalar value to divide by
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
     * @returns A new quaternion with divided components, or zero components if division by zero
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
     * A zero-length quaternion is normalized to the identity quaternion (an error
     * is logged) instead of becoming `Infinity`/`NaN`.
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
    fromToRotation(from: IVector3, to: IVector3): any;
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
    transformVector3Inverse(v: IVector3): any;
    /**
     * Creates a deep copy of this quaternion.
     * @returns A new quaternion with the same component values
     */
    clone(): this;
    /**
     * Creates a quaternion that directly uses the given typed array (no copy).
     * @param array - The typed array containing quaternion components
     * @returns A new quaternion using the provided array
     */
    static fromTypedArray(array: TypedArray): Quaternion_<FloatTypedArrayConstructor>;
    /**
     * Creates a quaternion from a 4-element array.
     * @param array - The array containing [x, y, z, w] components
     * @returns A new quaternion with copied components
     */
    static fromCopyArray4(array: Array4<number>): Quaternion_<FloatTypedArrayConstructor>;
    /**
     * Creates a quaternion from a variable-length array (taking first 4 elements).
     * @param array - The array containing quaternion components
     * @returns A new quaternion with the first 4 components copied
     */
    static fromCopyArray(array: Array<number>): Quaternion_<FloatTypedArrayConstructor>;
    /**
     * Creates a quaternion from individual component values.
     * @param x - The x component
     * @param y - The y component
     * @param z - The z component
     * @param w - The w component
     * @returns A new quaternion with the specified components
     */
    static fromCopy4(x: number, y: number, z: number, w: number): Quaternion_<FloatTypedArrayConstructor>;
    /**
     * Creates a quaternion by copying from another quaternion.
     * @param quat - The quaternion to copy from
     * @returns A new quaternion with copied components
     */
    static fromCopyQuaternion(quat: IQuaternion): Quaternion_<FloatTypedArrayConstructor>;
    /**
     * Creates a quaternion by copying from a 4D vector.
     * @param vec - The 4D vector to copy from
     * @returns A new quaternion with components copied from the vector
     */
    static fromCopyVector4(vec: IVector4): Quaternion_<FloatTypedArrayConstructor>;
    /**
     * Creates a quaternion from a log quaternion representation.
     * @param x - The log quaternion to convert
     * @returns A new quaternion converted from log space
     */
    static fromCopyLogQuaternion(x: ILogQuaternion): Quaternion_<FloatTypedArrayConstructor>;
    /**
     * Creates a quaternion from an axis-angle representation.
     * @param axis - The rotation axis vector
     * @param rad - The rotation angle in radians
     * @returns A new quaternion representing the rotation
     */
    static fromAxisAngle(axis: IVector3, rad: number): Quaternion_<FloatTypedArrayConstructor>;
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
/**
 * Immutable quaternion with 32-bit float components.
 */
export declare class Quaternion extends Quaternion_<Float32ArrayConstructor> {
    /**
     * Creates a new Quaternion instance.
     * @param v - The typed array containing the quaternion components
     */
    constructor(v: TypedArray);
    /**
     * identity
     */
    static identity(): Quaternion;
    /**
     * dummy
     */
    static dummy(): Quaternion;
    /**
     * invert
     */
    static invert(quat: IQuaternion): Quaternion;
    /**
     * invertTo
     */
    static invertTo(quat: IQuaternion, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * qlerp
     */
    static qlerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): Quaternion;
    /**
     * qlerpTo
     */
    static qlerpTo(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * lerp
     */
    static lerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): Quaternion;
    /**
     * lerpTo
     */
    static lerpTo(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * tryAxisAngle
     */
    static tryAxisAngle(vec: IVector3, radian: number): Quaternion | null;
    /**
     * axisAngle
     */
    static axisAngle(vec: IVector3, radian: number): Quaternion;
    /**
     * tryFromMatrix
     */
    static tryFromMatrix(mat: IMatrix44): Quaternion | null;
    /**
     * fromMatrix
     */
    static fromMatrix(mat: IMatrix44): Quaternion;
    /**
     * tryFromMatrixTo
     */
    static tryFromMatrixTo(mat: IMatrix44, out: IMutableQuaternion): boolean;
    /**
     * fromMatrixTo
     */
    static fromMatrixTo(mat: IMatrix44, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * lookFromTo
     */
    static lookFromTo(fromDirection: IVector3, toDirection: IVector3): IMutableQuaternion;
    /**
     * tryLookForward
     */
    static tryLookForward(forward: IVector3): Quaternion | null;
    /**
     * lookForward
     */
    static lookForward(forward: IVector3): Quaternion;
    /**
     * tryLookForwardAccordingToThisUp
     */
    static tryLookForwardAccordingToThisUp(forward: IVector3, up: IVector3): Quaternion | null;
    /**
     * lookForwardAccordingToThisUp
     */
    static lookForwardAccordingToThisUp(forward: IVector3, up: IVector3): Quaternion;
    /**
     * fromPosition
     */
    static fromPosition(vec: IVector3): Quaternion;
    /**
     * add
     */
    static add(l_quat: IQuaternion, r_quat: IQuaternion): Quaternion;
    /**
     * addTo
     */
    static addTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * subtract
     */
    static subtract(l_quat: IQuaternion, r_quat: IQuaternion): Quaternion;
    /**
     * subtractTo
     */
    static subtractTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * multiply
     */
    static multiply(l_quat: IQuaternion, r_quat: IQuaternion): Quaternion;
    /**
     * multiplyTo
     */
    static multiplyTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * multiplyNumber
     */
    static multiplyNumber(quat: IQuaternion, value: number): Quaternion;
    /**
     * multiplyNumberTo
     */
    static multiplyNumberTo(quat: IQuaternion, value: number, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * divideNumber
     */
    static divideNumber(quat: IQuaternion, value: number): Quaternion;
    /**
     * divideNumberTo
     */
    static divideNumberTo(quat: IQuaternion, value: number, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * normalize
     */
    static normalize(vec: IQuaternion): Quaternion;
    /**
     * normalizeTo
     */
    static normalizeTo(vec: IQuaternion, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * fromToRotation
     */
    static fromToRotation(from: IVector3, to: IVector3): Quaternion;
    /**
     * fromToRotationTo
     */
    static fromToRotationTo(from: IVector3, to: IVector3, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * Creates a quaternion that directly uses the given Float32Array (no copy).
     */
    static fromFloat32Array(array: Float32Array): Quaternion;
    /**
     * fromCopyArray4
     */
    static fromCopyArray4(array: Array4<number>): Quaternion;
    /**
     * fromCopyArray
     */
    static fromCopyArray(array: Array<number>): Quaternion;
    /**
     * fromCopy4
     */
    static fromCopy4(x: number, y: number, z: number, w: number): Quaternion;
    /**
     * fromCopyQuaternion
     */
    static fromCopyQuaternion(quat: IQuaternion): Quaternion;
    /**
     * fromCopyVector4
     */
    static fromCopyVector4(vec: IVector4): Quaternion;
    /**
     * fromCopyLogQuaternion
     */
    static fromCopyLogQuaternion(x: ILogQuaternion): Quaternion;
    /**
     * fromAxisAngle
     */
    static fromAxisAngle(axis: IVector3, rad: number): Quaternion;
    /**
     * fromAxisAngleTo
     */
    static fromAxisAngleTo(axis: IVector3, rad: number, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * getQuaternionAngle
     */
    static getQuaternionAngle(q: IQuaternion): number;
    /**
     * clampRotation
     */
    static clampRotation(quat: IQuaternion, thetaMax: number): IQuaternion;
}
/**
 * Immutable quaternion with 64-bit float components.
 */
export declare class QuaternionD extends Quaternion_<Float64ArrayConstructor> {
    /** The typed array constructor used for newly created quaternions. */
    protected static readonly _type: FloatTypedArrayConstructor;
    /**
     * Creates a new QuaternionD instance.
     * @param v - The typed array containing the quaternion components
     */
    constructor(v: TypedArray);
    /**
     * identity
     */
    static identity(): QuaternionD;
    /**
     * dummy
     */
    static dummy(): QuaternionD;
    /**
     * invert
     */
    static invert(quat: IQuaternion): QuaternionD;
    /**
     * invertTo
     */
    static invertTo(quat: IQuaternion, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * qlerp
     */
    static qlerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): QuaternionD;
    /**
     * qlerpTo
     */
    static qlerpTo(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * lerp
     */
    static lerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): QuaternionD;
    /**
     * lerpTo
     */
    static lerpTo(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * tryAxisAngle
     */
    static tryAxisAngle(vec: IVector3, radian: number): QuaternionD | null;
    /**
     * axisAngle
     */
    static axisAngle(vec: IVector3, radian: number): QuaternionD;
    /**
     * tryFromMatrix
     */
    static tryFromMatrix(mat: IMatrix44): QuaternionD | null;
    /**
     * fromMatrix
     */
    static fromMatrix(mat: IMatrix44): QuaternionD;
    /**
     * tryFromMatrixTo
     */
    static tryFromMatrixTo(mat: IMatrix44, out: IMutableQuaternion): boolean;
    /**
     * fromMatrixTo
     */
    static fromMatrixTo(mat: IMatrix44, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * lookFromTo
     */
    static lookFromTo(fromDirection: IVector3, toDirection: IVector3): IMutableQuaternion;
    /**
     * tryLookForward
     */
    static tryLookForward(forward: IVector3): QuaternionD | null;
    /**
     * lookForward
     */
    static lookForward(forward: IVector3): QuaternionD;
    /**
     * tryLookForwardAccordingToThisUp
     */
    static tryLookForwardAccordingToThisUp(forward: IVector3, up: IVector3): QuaternionD | null;
    /**
     * lookForwardAccordingToThisUp
     */
    static lookForwardAccordingToThisUp(forward: IVector3, up: IVector3): QuaternionD;
    /**
     * fromPosition
     */
    static fromPosition(vec: IVector3): QuaternionD;
    /**
     * add
     */
    static add(l_quat: IQuaternion, r_quat: IQuaternion): QuaternionD;
    /**
     * addTo
     */
    static addTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * subtract
     */
    static subtract(l_quat: IQuaternion, r_quat: IQuaternion): QuaternionD;
    /**
     * subtractTo
     */
    static subtractTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * multiply
     */
    static multiply(l_quat: IQuaternion, r_quat: IQuaternion): QuaternionD;
    /**
     * multiplyTo
     */
    static multiplyTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * multiplyNumber
     */
    static multiplyNumber(quat: IQuaternion, value: number): QuaternionD;
    /**
     * multiplyNumberTo
     */
    static multiplyNumberTo(quat: IQuaternion, value: number, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * divideNumber
     */
    static divideNumber(quat: IQuaternion, value: number): QuaternionD;
    /**
     * divideNumberTo
     */
    static divideNumberTo(quat: IQuaternion, value: number, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * normalize
     */
    static normalize(vec: IQuaternion): QuaternionD;
    /**
     * normalizeTo
     */
    static normalizeTo(vec: IQuaternion, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * fromToRotation
     */
    static fromToRotation(from: IVector3, to: IVector3): QuaternionD;
    /**
     * fromToRotationTo
     */
    static fromToRotationTo(from: IVector3, to: IVector3, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * Creates a quaternion that directly uses the given Float64Array (no copy).
     */
    static fromFloat64Array(array: Float64Array): QuaternionD;
    /**
     * fromCopyArray4
     */
    static fromCopyArray4(array: Array4<number>): QuaternionD;
    /**
     * fromCopyArray
     */
    static fromCopyArray(array: Array<number>): QuaternionD;
    /**
     * fromCopy4
     */
    static fromCopy4(x: number, y: number, z: number, w: number): QuaternionD;
    /**
     * fromCopyQuaternion
     */
    static fromCopyQuaternion(quat: IQuaternion): QuaternionD;
    /**
     * fromCopyVector4
     */
    static fromCopyVector4(vec: IVector4): QuaternionD;
    /**
     * fromCopyLogQuaternion
     */
    static fromCopyLogQuaternion(x: ILogQuaternion): QuaternionD;
    /**
     * fromAxisAngle
     */
    static fromAxisAngle(axis: IVector3, rad: number): QuaternionD;
    /**
     * fromAxisAngleTo
     */
    static fromAxisAngleTo(axis: IVector3, rad: number, out: IMutableQuaternion): IMutableQuaternion;
    /**
     * getQuaternionAngle
     */
    static getQuaternionAngle(q: IQuaternion): number;
    /**
     * clampRotation
     */
    static clampRotation(quat: IQuaternion, thetaMax: number): IQuaternion;
}
/**
 * Alias for the 32-bit (Float32Array) implementation, making the precision explicit.
 */
export { Quaternion as QuaternionF };
