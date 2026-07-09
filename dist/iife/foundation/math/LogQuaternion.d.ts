import type { Array3 } from '../../types/CommonTypes';
import type { ILogQuaternion, IQuaternion } from './IQuaternion';
import type { IVector3 } from './IVector';
import { Quaternion } from './Quaternion';
/**
 * Represents a logarithm of a quaternion, which provides a more compact representation
 * for quaternion interpolation and mathematical operations. A log quaternion stores
 * only the x, y, z components as the w component is implicitly 1.
 */
export declare class LogQuaternion implements ILogQuaternion {
    _v: Float32Array;
    /**
     * Creates a new LogQuaternion instance.
     * @param x - Float32Array containing the x, y, z components
     */
    constructor(x: Float32Array);
    /**
     * Gets the x component of the log quaternion.
     * @returns The x component value
     */
    get x(): number;
    /**
     * Gets the y component of the log quaternion.
     * @returns The y component value
     */
    get y(): number;
    /**
     * Gets the z component of the log quaternion.
     * @returns The z component value
     */
    get z(): number;
    /**
     * Gets the w component of the log quaternion. Always returns 1 for log quaternions.
     * @returns Always returns 1
     */
    get w(): number;
    /**
     * Creates a LogQuaternion from an existing Float32Array.
     * @param array - Float32Array containing the x, y, z components
     * @returns A new LogQuaternion instance
     */
    static fromFloat32Array(array: Float32Array): LogQuaternion;
    /**
     * Creates a LogQuaternion from a 3-element array by copying the values.
     * @param array - Array of 3 numbers representing x, y, z components
     * @returns A new Quaternion instance (note: this should return LogQuaternion)
     */
    static fromCopyArray3(array: Array3<number>): Quaternion;
    /**
     * Creates a LogQuaternion from an array by copying the first 3 values.
     * @param array - Array of numbers (only first 3 elements are used)
     * @returns A new Quaternion instance (note: this should return LogQuaternion)
     */
    static fromCopyArray(array: Array<number>): Quaternion;
    /**
     * Creates a LogQuaternion from individual x, y, z component values.
     * @param x - The x component
     * @param y - The y component
     * @param z - The z component
     * @returns A new Quaternion instance (note: this should return LogQuaternion)
     */
    static fromCopy3(x: number, y: number, z: number): Quaternion;
    /**
     * Creates a LogQuaternion by copying from another LogQuaternion.
     * @param quat - The source LogQuaternion to copy from
     * @returns A new Quaternion instance (note: this should return LogQuaternion)
     */
    static fromCopyLogQuaternion(quat: ILogQuaternion): Quaternion;
    /**
     * Creates a LogQuaternion from a 3D vector by copying its components.
     * @param vec - The source IVector3 to copy from
     * @returns A new Quaternion instance (note: this should return LogQuaternion)
     */
    static fromCopyVector4(vec: IVector3): Quaternion;
    /**
     * Converts a regular quaternion to its logarithmic form.
     * Uses the formula: log(q) = (θ/sin(θ)) * (x, y, z) where θ = acos(w)
     * @param x - The source quaternion to convert
     * @returns A new LogQuaternion representing the logarithm of the input quaternion
     */
    static fromCopyQuaternion(x: IQuaternion): LogQuaternion;
    /**
     * Gets the class name identifier.
     * @returns The string 'LogQuaternion'
     */
    get className(): string;
}
