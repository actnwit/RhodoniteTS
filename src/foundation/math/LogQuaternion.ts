import { IVector3, IVector4 } from './IVector';
import { Quaternion } from './Quaternion';
import { Array3, TypedArray } from '../../types/CommonTypes';
import { ILogQuaternion, IQuaternion } from './IQuaternion';

/**
 * Represents a logarithm of a quaternion, which provides a more compact representation
 * for quaternion interpolation and mathematical operations. A log quaternion stores
 * only the x, y, z components as the w component is implicitly 1.
 */
export class LogQuaternion implements ILogQuaternion {
  _v: Float32Array;

  /**
   * Creates a new LogQuaternion instance.
   * @param x - Float32Array containing the x, y, z components
   */
  constructor(x: Float32Array) {
    this._v = x;
  }

  /**
   * Gets the x component of the log quaternion.
   * @returns The x component value
   */
  get x() {
    return this._v[0];
  }

  /**
   * Gets the y component of the log quaternion.
   * @returns The y component value
   */
  get y() {
    return this._v[1];
  }

  /**
   * Gets the z component of the log quaternion.
   * @returns The z component value
   */
  get z() {
    return this._v[2];
  }

  /**
   * Gets the w component of the log quaternion. Always returns 1 for log quaternions.
   * @returns Always returns 1
   */
  get w() {
    return 1;
  }

  /**
   * Creates a LogQuaternion from an existing Float32Array.
   * @param array - Float32Array containing the x, y, z components
   * @returns A new LogQuaternion instance
   */
  static fromFloat32Array(array: Float32Array) {
    return new LogQuaternion(array);
  }

  /**
   * Creates a LogQuaternion from a 3-element array by copying the values.
   * @param array - Array of 3 numbers representing x, y, z components
   * @returns A new Quaternion instance (note: this should return LogQuaternion)
   */
  static fromCopyArray3(array: Array3<number>) {
    return new Quaternion(new Float32Array(array));
  }

  /**
   * Creates a LogQuaternion from an array by copying the first 3 values.
   * @param array - Array of numbers (only first 3 elements are used)
   * @returns A new Quaternion instance (note: this should return LogQuaternion)
   */
  static fromCopyArray(array: Array<number>) {
    return new Quaternion(new Float32Array(array.slice(0, 3)));
  }

  /**
   * Creates a LogQuaternion from individual x, y, z component values.
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   * @returns A new Quaternion instance (note: this should return LogQuaternion)
   */
  static fromCopy3(x: number, y: number, z: number) {
    return new Quaternion(new Float32Array([x, y, z]));
  }

  /**
   * Creates a LogQuaternion by copying from another LogQuaternion.
   * @param quat - The source LogQuaternion to copy from
   * @returns A new Quaternion instance (note: this should return LogQuaternion)
   */
  static fromCopyLogQuaternion(quat: ILogQuaternion) {
    const v = new Float32Array(3);
    v[0] = quat._v[0];
    v[1] = quat._v[1];
    v[2] = quat._v[2];
    return new Quaternion(v);
  }

  /**
   * Creates a LogQuaternion from a 3D vector by copying its components.
   * @param vec - The source IVector3 to copy from
   * @returns A new Quaternion instance (note: this should return LogQuaternion)
   */
  static fromCopyVector4(vec: IVector3) {
    const v = new Float32Array(3);
    v[0] = vec._v[0];
    v[1] = vec._v[1];
    v[2] = vec._v[2];
    return new Quaternion(v);
  }

  /**
   * Converts a regular quaternion to its logarithmic form.
   * Uses the formula: log(q) = (θ/sin(θ)) * (x, y, z) where θ = acos(w)
   * @param x - The source quaternion to convert
   * @returns A new LogQuaternion representing the logarithm of the input quaternion
   */
  static fromCopyQuaternion(x: IQuaternion) {
    const theta = Math.acos(x.w);
    const sin = Math.sin(theta);

    const v = new Float32Array(3);
    v[0] = x.x * (theta / sin);
    v[1] = x.y * (theta / sin);
    v[2] = x.z * (theta / sin);
    return new LogQuaternion(v);
  }

  /**
   * Gets the class name identifier.
   * @returns The string 'LogQuaternion'
   */
  get className() {
    return 'LogQuaternion';
  }
}
