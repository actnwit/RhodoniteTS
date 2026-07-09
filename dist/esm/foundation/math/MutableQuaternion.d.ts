import type { Array4 } from '../../types/CommonTypes';
import type { IMatrix44 } from './IMatrix';
import type { ILogQuaternion, IMutableQuaternion, IQuaternion } from './IQuaternion';
import type { IVector3, IVector4 } from './IVector';
import { Quaternion } from './Quaternion';
/**
 * A mutable quaternion class that extends the immutable Quaternion class.
 * Provides methods for quaternion operations that modify the instance in place.
 * Quaternions are used to represent rotations in 3D space and are particularly
 * useful for avoiding gimbal lock and providing smooth interpolations.
 */
export declare class MutableQuaternion extends Quaternion implements IMutableQuaternion {
    /**
     * Sets the x component of the quaternion.
     * @param x - The x component value
     */
    set x(x: number);
    /**
     * Gets the x component of the quaternion.
     * @returns The x component value
     */
    get x(): number;
    /**
     * Sets the y component of the quaternion.
     * @param y - The y component value
     */
    set y(y: number);
    /**
     * Gets the y component of the quaternion.
     * @returns The y component value
     */
    get y(): number;
    /**
     * Sets the z component of the quaternion.
     * @param z - The z component value
     */
    set z(z: number);
    /**
     * Gets the z component of the quaternion.
     * @returns The z component value
     */
    get z(): number;
    /**
     * Sets the w component of the quaternion.
     * @param w - The w component value
     */
    set w(w: number);
    /**
     * Gets the w component of the quaternion.
     * @returns The w component value
     */
    get w(): number;
    /**
     * Gets the class name for identification purposes.
     * @returns The string 'MutableQuaternion'
     */
    get className(): string;
    /**
     * Creates an identity quaternion (0, 0, 0, 1).
     * @returns A new MutableQuaternion representing no rotation
     */
    static identity(): MutableQuaternion;
    /**
     * Creates a dummy quaternion with empty array (for initialization purposes).
     * @returns A new MutableQuaternion with zero-length array
     */
    static dummy(): MutableQuaternion;
    /**
     * Inverts a quaternion and returns a new MutableQuaternion.
     * @param quat - The quaternion to invert
     * @returns A new MutableQuaternion representing the inverse rotation
     */
    static invert(quat: IQuaternion): MutableQuaternion;
    /**
     * Performs spherical linear interpolation (SLERP) between two quaternions.
     * @param l_quat - The starting quaternion
     * @param r_quat - The ending quaternion
     * @param ratio - Interpolation factor (0.0 to 1.0)
     * @returns A new MutableQuaternion representing the interpolated rotation
     */
    static qlerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): MutableQuaternion;
    /**
     * Performs linear interpolation between two quaternions.
     * @param l_quat - The starting quaternion
     * @param r_quat - The ending quaternion
     * @param ratio - Interpolation factor (0.0 to 1.0)
     * @returns A new MutableQuaternion representing the interpolated rotation
     */
    static lerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): MutableQuaternion;
    /**
     * Creates a quaternion from an axis and angle.
     * @param vec - The rotation axis (normalized vector recommended)
     * @param radian - The rotation angle in radians
     * @returns A new MutableQuaternion representing the axis-angle rotation
     */
    static axisAngle(vec: IVector3, radian: number): MutableQuaternion;
    /**
     * Creates a quaternion from a rotation matrix.
     * @param mat - The 4x4 transformation matrix
     * @returns A new MutableQuaternion representing the matrix's rotation
     */
    static fromMatrix(mat: IMatrix44): MutableQuaternion;
    /**
     * Creates a quaternion from a position vector (w component set to 0).
     * @param vec - The position vector
     * @returns A new MutableQuaternion with position data
     */
    static fromPosition(vec: IVector3): MutableQuaternion;
    /**
     * Adds two quaternions component-wise.
     * @param l_quat - The left quaternion
     * @param r_quat - The right quaternion
     * @returns A new MutableQuaternion representing the sum
     */
    static add(l_quat: IQuaternion, r_quat: IQuaternion): MutableQuaternion;
    /**
     * Subtracts the second quaternion from the first component-wise.
     * @param l_quat - The left quaternion
     * @param r_quat - The right quaternion
     * @returns A new MutableQuaternion representing the difference
     */
    static subtract(l_quat: IQuaternion, r_quat: IQuaternion): MutableQuaternion;
    /**
     * Multiplies two quaternions (quaternion composition).
     * @param l_quat - The left quaternion
     * @param r_quat - The right quaternion
     * @returns A new MutableQuaternion representing the composed rotation
     */
    static multiply(l_quat: IQuaternion, r_quat: IQuaternion): MutableQuaternion;
    /**
     * Multiplies a quaternion by a scalar value.
     * @param quat - The quaternion to multiply
     * @param value - The scalar value
     * @returns A new MutableQuaternion representing the scaled quaternion
     */
    static multiplyNumber(quat: IQuaternion, value: number): MutableQuaternion;
    /**
     * Divides a quaternion by a scalar value.
     * @param quat - The quaternion to divide
     * @param value - The scalar value (must not be zero)
     * @returns A new MutableQuaternion representing the scaled quaternion
     */
    static divideNumber(quat: IQuaternion, value: number): MutableQuaternion;
    /**
     * Gets the raw Float32Array containing the quaternion components.
     * @returns The underlying Float32Array [x, y, z, w]
     */
    raw(): Float32Array;
    /**
     * Sets a component value at the specified index.
     * @param i - The component index (0=x, 1=y, 2=z, 3=w)
     * @param value - The value to set
     * @returns This instance for method chaining
     */
    setAt(i: number, value: number): MutableQuaternion;
    /**
     * Sets all quaternion components.
     * @param x - The x component
     * @param y - The y component
     * @param z - The z component
     * @param w - The w component
     * @returns This instance for method chaining
     */
    setComponents(x: number, y: number, z: number, w: number): MutableQuaternion;
    /**
     * Copies components from another quaternion.
     * @param quat - The quaternion to copy from
     * @returns This instance for method chaining
     */
    copyComponents(quat: IQuaternion): MutableQuaternion;
    /**
     * Sets this quaternion to the identity quaternion (0, 0, 0, 1).
     * @returns This instance for method chaining
     */
    identity(): MutableQuaternion;
    /**
     * Normalizes this quaternion to unit length in place.
     * @returns This instance for method chaining
     */
    normalize(): MutableQuaternion;
    /**
     * Inverts this quaternion in place (conjugate divided by magnitude squared).
     * @returns This instance for method chaining
     */
    invert(): MutableQuaternion;
    /**
     * Performs spherical linear interpolation (SLERP) and stores the result in this quaternion.
     * @param l_quat - The starting quaternion
     * @param r_quat - The ending quaternion
     * @param ratio - Interpolation factor (0.0 to 1.0)
     * @returns This instance for method chaining
     */
    qlerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): MutableQuaternion;
    /**
     * Performs linear interpolation and stores the result in this quaternion.
     * @param l_quat - The starting quaternion
     * @param r_quat - The ending quaternion
     * @param ratio - Interpolation factor (0.0 to 1.0)
     * @returns This instance for method chaining
     */
    lerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): MutableQuaternion;
    /**
     * Sets this quaternion from an axis and angle.
     * @param vec - The rotation axis (will be normalized)
     * @param radian - The rotation angle in radians
     * @returns This instance for method chaining
     */
    axisAngle(vec: IVector3, radian: number): MutableQuaternion;
    /**
     * Sets this quaternion from a 4x4 transformation matrix.
     * Extracts the rotation component from the matrix, ignoring scale and translation.
     * @param mat - The 4x4 transformation matrix
     * @returns This instance for method chaining
     */
    fromMatrix(mat: IMatrix44): MutableQuaternion;
    /**
     * Sets this quaternion from a position vector (w component set to 0).
     * @param vec - The position vector
     * @returns This instance for method chaining
     */
    fromPosition(vec: IVector3): MutableQuaternion;
    /**
     * Adds another quaternion to this quaternion component-wise.
     * @param quat - The quaternion to add
     * @returns This instance for method chaining
     */
    add(quat: IQuaternion): MutableQuaternion;
    /**
     * Subtracts another quaternion from this quaternion component-wise.
     * @param quat - The quaternion to subtract
     * @returns This instance for method chaining
     */
    subtract(quat: IQuaternion): MutableQuaternion;
    /**
     * Multiplies this quaternion by another quaternion (quaternion composition).
     * The result represents the combined rotation.
     * @param quat - The quaternion to multiply by
     * @returns This instance for method chaining
     */
    multiply(quat: IQuaternion): MutableQuaternion;
    /**
     * Multiplies this quaternion by a scalar value.
     * @param value - The scalar value to multiply by
     * @returns This instance for method chaining
     */
    multiplyNumber(value: number): MutableQuaternion;
    /**
     * Divides this quaternion by a scalar value.
     * @param value - The scalar value to divide by (must not be zero)
     * @returns This instance for method chaining
     */
    divideNumber(value: number): MutableQuaternion;
    /**
     * Creates a copy of this quaternion.
     * @returns A new IMutableQuaternion with the same component values
     */
    clone(): MutableQuaternion;
    /**
     * Creates a MutableQuaternion from an existing Float32Array.
     * @param array - The Float32Array containing quaternion components
     * @returns A new MutableQuaternion instance
     */
    static fromFloat32Array(array: Float32Array): MutableQuaternion;
    /**
     * Creates a MutableQuaternion by copying from a 4-element array.
     * @param array - Array containing [x, y, z, w] components
     * @returns A new MutableQuaternion instance
     */
    static fromCopyArray4(array: Array4<number>): MutableQuaternion;
    /**
     * Creates a MutableQuaternion by copying from an array (takes first 4 elements).
     * @param array - Array containing quaternion components
     * @returns A new MutableQuaternion instance
     */
    static fromCopyArray(array: Array<number>): MutableQuaternion;
    /**
     * Creates a MutableQuaternion from individual component values.
     * @param x - The x component
     * @param y - The y component
     * @param z - The z component
     * @param w - The w component
     * @returns A new MutableQuaternion instance
     */
    static fromCopy4(x: number, y: number, z: number, w: number): MutableQuaternion;
    /**
     * Creates a MutableQuaternion by copying from another quaternion.
     * @param quat - The quaternion to copy from
     * @returns A new MutableQuaternion instance
     */
    static fromCopyQuaternion(quat: IQuaternion): MutableQuaternion;
    /**
     * Creates a MutableQuaternion by copying from a 4D vector.
     * @param vec - The 4D vector to copy from
     * @returns A new MutableQuaternion instance
     */
    static fromCopyVector4(vec: IVector4): MutableQuaternion;
    /**
     * Creates a MutableQuaternion from a logarithmic quaternion.
     * Converts from log space back to quaternion space using exponential map.
     * @param x - The logarithmic quaternion to convert
     * @returns A new MutableQuaternion instance
     */
    static fromCopyLogQuaternion(x: ILogQuaternion): MutableQuaternion;
}
