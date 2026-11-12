import type { Array4, FloatTypedArrayConstructor, TypedArray } from '../../types/CommonTypes';
import type { IMatrix44 } from './IMatrix';
import type { ILogQuaternion, IMutableQuaternion, IQuaternion } from './IQuaternion';
import type { IVector3, IVector4 } from './IVector';
import { Quaternion_ } from './Quaternion';
/**
 * A mutable quaternion class that extends the immutable Quaternion class.
 * Provides methods for quaternion operations that modify the instance in place.
 * Quaternions are used to represent rotations in 3D space and are particularly
 * useful for avoiding gimbal lock and providing smooth interpolations.
 */
export declare class MutableQuaternion_<T extends FloatTypedArrayConstructor> extends Quaternion_<T> implements IMutableQuaternion {
    /**
     * Creates a new MutableQuaternion_ instance.
     * @param v - The typed array containing the quaternion components
     * @param _options - Configuration object containing the typed array constructor
     */
    constructor(v: TypedArray, _options?: {
        type: T;
    });
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
     * Gets the raw Float32Array containing the quaternion components.
     * @returns The underlying Float32Array [x, y, z, w]
     */
    raw(): TypedArray;
    /**
     * Sets a component value at the specified index.
     * @param i - The component index (0=x, 1=y, 2=z, 3=w)
     * @param value - The value to set
     * @returns This instance for method chaining
     */
    setAt(i: number, value: number): this;
    /**
     * Sets all quaternion components.
     * @param x - The x component
     * @param y - The y component
     * @param z - The z component
     * @param w - The w component
     * @returns This instance for method chaining
     */
    setComponents(x: number, y: number, z: number, w: number): this;
    /**
     * Copies components from another quaternion.
     * @param quat - The quaternion to copy from
     * @returns This instance for method chaining
     */
    copyComponents(quat: IQuaternion): this;
    /**
     * Sets this quaternion to the identity quaternion (0, 0, 0, 1).
     * @returns This instance for method chaining
     */
    identity(): this;
    /**
     * Normalizes this quaternion to unit length in place.
     * @returns This instance for method chaining
     */
    normalize(): this;
    /**
     * Inverts this quaternion in place (conjugate divided by magnitude squared).
     * @returns This instance for method chaining
     */
    invert(): this;
    /**
     * Performs spherical linear interpolation (SLERP) and stores the result in this quaternion.
     * @param l_quat - The starting quaternion
     * @param r_quat - The ending quaternion
     * @param ratio - Interpolation factor (0.0 to 1.0)
     * @returns This instance for method chaining
     */
    qlerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): this;
    /**
     * Performs linear interpolation and stores the result in this quaternion.
     * @param l_quat - The starting quaternion
     * @param r_quat - The ending quaternion
     * @param ratio - Interpolation factor (0.0 to 1.0)
     * @returns This instance for method chaining
     */
    lerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): this;
    /**
     * Attempts to set this quaternion from an axis and angle.
     *
     * The quaternion is left unchanged when the axis is degenerate
     * (zero length or non-finite).
     *
     * @param vec - The rotation axis (will be normalized)
     * @param radian - The rotation angle in radians
     * @returns True if the quaternion could be set, false otherwise
     */
    tryAxisAngle(vec: IVector3, radian: number): boolean;
    /**
     * Sets this quaternion from an axis and angle.
     *
     * If the axis is degenerate (zero length), this quaternion is set to the
     * identity quaternion instead of being filled with `Infinity`/`NaN`.
     * Use {@link MutableQuaternion.tryAxisAngle} when the caller needs to detect the failure.
     *
     * @param vec - The rotation axis (will be normalized)
     * @param radian - The rotation angle in radians
     * @returns This instance for method chaining
     */
    axisAngle(vec: IVector3, radian: number): this;
    /**
     * Attempts to set this quaternion from a 4x4 transformation matrix.
     * Extracts the rotation component from the matrix, ignoring scale and translation.
     *
     * The quaternion is left unchanged when the rotation cannot be extracted.
     *
     * @param mat - The 4x4 transformation matrix
     * @returns True if the rotation could be extracted, false otherwise
     */
    tryFromMatrix(mat: IMatrix44): boolean;
    /**
     * Sets this quaternion from a 4x4 transformation matrix.
     * Extracts the rotation component from the matrix, ignoring scale and translation.
     *
     * If the rotation cannot be extracted, this quaternion is set to the identity
     * quaternion instead of being filled with `Infinity`/`NaN`.
     * Use {@link MutableQuaternion.tryFromMatrix} when the caller needs to detect the failure.
     *
     * @param mat - The 4x4 transformation matrix
     * @returns This instance for method chaining
     */
    fromMatrix(mat: IMatrix44): this;
    /**
     * Sets this quaternion from a position vector (w component set to 0).
     * @param vec - The position vector
     * @returns This instance for method chaining
     */
    fromPosition(vec: IVector3): this;
    /**
     * Adds another quaternion to this quaternion component-wise.
     * @param quat - The quaternion to add
     * @returns This instance for method chaining
     */
    add(quat: IQuaternion): this;
    /**
     * Subtracts another quaternion from this quaternion component-wise.
     * @param quat - The quaternion to subtract
     * @returns This instance for method chaining
     */
    subtract(quat: IQuaternion): this;
    /**
     * Multiplies this quaternion by another quaternion (quaternion composition).
     * The result represents the combined rotation.
     * @param quat - The quaternion to multiply by
     * @returns This instance for method chaining
     */
    multiply(quat: IQuaternion): this;
    /**
     * Multiplies this quaternion by a scalar value.
     * @param value - The scalar value to multiply by
     * @returns This instance for method chaining
     */
    multiplyNumber(value: number): this;
    /**
     * Divides this quaternion by a scalar value.
     * @param value - The scalar value to divide by (must not be zero)
     * @returns This instance for method chaining
     */
    divideNumber(value: number): this;
    /**
     * Creates a copy of this quaternion.
     * @returns A new IMutableQuaternion with the same component values
     */
    clone(): this;
}
/**
 * Mutable quaternion with 32-bit float components.
 */
export declare class MutableQuaternion extends MutableQuaternion_<Float32ArrayConstructor> {
    /**
     * Creates a new MutableQuaternion instance.
     * @param v - The typed array containing the quaternion components
     */
    constructor(v: TypedArray);
    /**
     * identity
     */
    static identity(): MutableQuaternion;
    /**
     * dummy
     */
    static dummy(): MutableQuaternion;
    /**
     * invert
     */
    static invert(quat: IQuaternion): MutableQuaternion;
    /**
     * qlerp
     */
    static qlerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): MutableQuaternion;
    /**
     * lerp
     */
    static lerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): MutableQuaternion;
    /**
     * tryAxisAngle
     */
    static tryAxisAngle(vec: IVector3, radian: number): MutableQuaternion | null;
    /**
     * axisAngle
     */
    static axisAngle(vec: IVector3, radian: number): MutableQuaternion;
    /**
     * tryFromMatrix
     */
    static tryFromMatrix(mat: IMatrix44): MutableQuaternion | null;
    /**
     * fromMatrix
     */
    static fromMatrix(mat: IMatrix44): MutableQuaternion;
    /**
     * fromPosition
     */
    static fromPosition(vec: IVector3): MutableQuaternion;
    /**
     * add
     */
    static add(l_quat: IQuaternion, r_quat: IQuaternion): MutableQuaternion;
    /**
     * subtract
     */
    static subtract(l_quat: IQuaternion, r_quat: IQuaternion): MutableQuaternion;
    /**
     * multiply
     */
    static multiply(l_quat: IQuaternion, r_quat: IQuaternion): MutableQuaternion;
    /**
     * multiplyNumber
     */
    static multiplyNumber(quat: IQuaternion, value: number): MutableQuaternion;
    /**
     * divideNumber
     */
    static divideNumber(quat: IQuaternion, value: number): MutableQuaternion;
    /**
     * Creates a mutable quaternion that directly uses the given Float32Array (no copy).
     */
    static fromFloat32Array(array: Float32Array): MutableQuaternion;
    /**
     * fromCopyArray4
     */
    static fromCopyArray4(array: Array4<number>): MutableQuaternion;
    /**
     * fromCopyArray
     */
    static fromCopyArray(array: Array<number>): MutableQuaternion;
    /**
     * fromCopy4
     */
    static fromCopy4(x: number, y: number, z: number, w: number): MutableQuaternion;
    /**
     * fromCopyQuaternion
     */
    static fromCopyQuaternion(quat: IQuaternion): MutableQuaternion;
    /**
     * fromCopyVector4
     */
    static fromCopyVector4(vec: IVector4): MutableQuaternion;
    /**
     * fromCopyLogQuaternion
     */
    static fromCopyLogQuaternion(x: ILogQuaternion): MutableQuaternion;
}
/**
 * Mutable quaternion with 64-bit float components.
 */
export declare class MutableQuaternionD extends MutableQuaternion_<Float64ArrayConstructor> {
    /** The typed array constructor used for newly created quaternions. */
    protected static readonly _type: FloatTypedArrayConstructor;
    /**
     * Creates a new MutableQuaternionD instance.
     * @param v - The typed array containing the quaternion components
     */
    constructor(v: TypedArray);
    /**
     * identity
     */
    static identity(): MutableQuaternionD;
    /**
     * dummy
     */
    static dummy(): MutableQuaternionD;
    /**
     * invert
     */
    static invert(quat: IQuaternion): MutableQuaternionD;
    /**
     * qlerp
     */
    static qlerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): MutableQuaternionD;
    /**
     * lerp
     */
    static lerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): MutableQuaternionD;
    /**
     * tryAxisAngle
     */
    static tryAxisAngle(vec: IVector3, radian: number): MutableQuaternionD | null;
    /**
     * axisAngle
     */
    static axisAngle(vec: IVector3, radian: number): MutableQuaternionD;
    /**
     * tryFromMatrix
     */
    static tryFromMatrix(mat: IMatrix44): MutableQuaternionD | null;
    /**
     * fromMatrix
     */
    static fromMatrix(mat: IMatrix44): MutableQuaternionD;
    /**
     * fromPosition
     */
    static fromPosition(vec: IVector3): MutableQuaternionD;
    /**
     * add
     */
    static add(l_quat: IQuaternion, r_quat: IQuaternion): MutableQuaternionD;
    /**
     * subtract
     */
    static subtract(l_quat: IQuaternion, r_quat: IQuaternion): MutableQuaternionD;
    /**
     * multiply
     */
    static multiply(l_quat: IQuaternion, r_quat: IQuaternion): MutableQuaternionD;
    /**
     * multiplyNumber
     */
    static multiplyNumber(quat: IQuaternion, value: number): MutableQuaternionD;
    /**
     * divideNumber
     */
    static divideNumber(quat: IQuaternion, value: number): MutableQuaternionD;
    /**
     * Creates a mutable quaternion that directly uses the given Float64Array (no copy).
     */
    static fromFloat64Array(array: Float64Array): MutableQuaternionD;
    /**
     * fromCopyArray4
     */
    static fromCopyArray4(array: Array4<number>): MutableQuaternionD;
    /**
     * fromCopyArray
     */
    static fromCopyArray(array: Array<number>): MutableQuaternionD;
    /**
     * fromCopy4
     */
    static fromCopy4(x: number, y: number, z: number, w: number): MutableQuaternionD;
    /**
     * fromCopyQuaternion
     */
    static fromCopyQuaternion(quat: IQuaternion): MutableQuaternionD;
    /**
     * fromCopyVector4
     */
    static fromCopyVector4(vec: IVector4): MutableQuaternionD;
    /**
     * fromCopyLogQuaternion
     */
    static fromCopyLogQuaternion(x: ILogQuaternion): MutableQuaternionD;
}
/**
 * Alias for the 32-bit (Float32Array) implementation, making the precision explicit.
 */
export { MutableQuaternion as MutableQuaternionF };
