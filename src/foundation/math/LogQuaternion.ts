import type { Array3, FloatTypedArrayConstructor, TypedArray } from '../../types/CommonTypes';
import type { ILogQuaternion, IQuaternion } from './IQuaternion';
import type { IVector3 } from './IVector';

/**
 * Generic base class for logarithms of quaternions.
 *
 * A log quaternion provides a more compact representation for quaternion
 * interpolation and mathematical operations. It stores only the x, y, z
 * components, as the w component is implicitly 1.
 *
 * @template T - The typed array constructor (Float32Array or Float64Array)
 * @internal
 */
export class LogQuaternion_<T extends FloatTypedArrayConstructor> implements ILogQuaternion {
  _v: TypedArray;

  /**
   * Creates a new LogQuaternion_ instance.
   * @param v - Typed array containing the x, y, z components
   * @param _options - Configuration object containing the typed array constructor
   */
  constructor(v: TypedArray, _options: { type: T }) {
    this._v = v;
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
   * Gets the class name identifier.
   * @returns The string 'LogQuaternion'
   */
  get className() {
    return 'LogQuaternion';
  }

  /**
   * Creates a log quaternion that directly uses the given typed array (no copy).
   * @param array - Typed array containing the x, y, z components
   * @param type - The typed array constructor to use
   * @returns A new log quaternion
   */
  static _fromTypedArray(array: TypedArray, type: FloatTypedArrayConstructor): ILogQuaternion {
    return new this(array, { type });
  }

  /**
   * Creates a log quaternion from a 3-element array by copying the values.
   * @param array - Array of 3 numbers representing x, y, z components
   * @param type - The typed array constructor to use
   * @returns A new log quaternion
   */
  static _fromCopyArray3(array: Array3<number>, type: FloatTypedArrayConstructor): ILogQuaternion {
    return new this(new type(array), { type });
  }

  /**
   * Creates a log quaternion from an array by copying the first 3 values.
   * @param array - Array of numbers (only first 3 elements are used)
   * @param type - The typed array constructor to use
   * @returns A new log quaternion
   */
  static _fromCopyArray(array: Array<number>, type: FloatTypedArrayConstructor): ILogQuaternion {
    return new this(new type(array.slice(0, 3)), { type });
  }

  /**
   * Creates a log quaternion from individual x, y, z component values.
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   * @param type - The typed array constructor to use
   * @returns A new log quaternion
   */
  static _fromCopy3(x: number, y: number, z: number, type: FloatTypedArrayConstructor): ILogQuaternion {
    return new this(new type([x, y, z]), { type });
  }

  /**
   * Creates a log quaternion from a 3D vector by copying its components.
   * @param vec - The source vector to copy from
   * @param type - The typed array constructor to use
   * @returns A new log quaternion
   */
  static _fromCopyVector3(vec: IVector3, type: FloatTypedArrayConstructor): ILogQuaternion {
    const v = new type(3);
    v[0] = vec._v[0];
    v[1] = vec._v[1];
    v[2] = vec._v[2];
    return new this(v, { type });
  }

  /**
   * Creates a log quaternion by copying from another log quaternion.
   * @param quat - The source log quaternion to copy from
   * @param type - The typed array constructor to use
   * @returns A new log quaternion
   */
  static _fromCopyLogQuaternion(quat: ILogQuaternion, type: FloatTypedArrayConstructor): ILogQuaternion {
    const v = new type(3);
    v[0] = quat._v[0];
    v[1] = quat._v[1];
    v[2] = quat._v[2];
    return new this(v, { type });
  }

  /**
   * Converts a regular quaternion to its logarithmic form.
   *
   * Uses the formula `log(q) = (θ / sin(θ)) * (x, y, z)` where `θ = acos(w)`.
   * When θ is 0 (identity rotation) the result is a zero log quaternion. When
   * θ is close to π the logarithm is not representable and a zero log
   * quaternion is returned instead of `Infinity`/`NaN`.
   *
   * @param quat - The source quaternion to convert
   * @param type - The typed array constructor to use
   * @returns A new log quaternion representing the logarithm of the input quaternion
   */
  static _fromCopyQuaternion(quat: IQuaternion, type: FloatTypedArrayConstructor): ILogQuaternion {
    const theta = Math.acos(Math.min(1, Math.max(-1, quat.w)));
    const sin = Math.sin(theta);

    // θ ≈ 0: log(identity) = 0. θ ≈ π: the logarithm is unbounded and cannot
    // be represented, so fall back to zero instead of producing Infinity/NaN.
    if (!Number.isFinite(sin) || Math.abs(sin) < 1e-6) {
      return new this(new type(3), { type });
    }

    const v = new type(3);
    v[0] = quat.x * (theta / sin);
    v[1] = quat.y * (theta / sin);
    v[2] = quat.z * (theta / sin);
    return new this(v, { type });
  }
}

/**
 * Logarithm of a quaternion with 32-bit float components.
 */
export class LogQuaternion extends LogQuaternion_<Float32ArrayConstructor> {
  /**
   * Creates a new LogQuaternion instance.
   * @param v - The typed array containing the x, y, z components
   */
  constructor(v: TypedArray) {
    super(v, { type: Float32Array });
  }

  /** Creates a log quaternion that directly uses the given Float32Array (no copy). */
  static fromFloat32Array(array: Float32Array): LogQuaternion {
    return super._fromTypedArray(array, Float32Array) as LogQuaternion;
  }

  /** Creates a log quaternion from a 3-element array by copying the values. */
  static fromCopyArray3(array: Array3<number>): LogQuaternion {
    return super._fromCopyArray3(array, Float32Array) as LogQuaternion;
  }

  /** Creates a log quaternion from an array by copying the first 3 values. */
  static fromCopyArray(array: Array<number>): LogQuaternion {
    return super._fromCopyArray(array, Float32Array) as LogQuaternion;
  }

  /** Creates a log quaternion from individual x, y, z component values. */
  static fromCopy3(x: number, y: number, z: number): LogQuaternion {
    return super._fromCopy3(x, y, z, Float32Array) as LogQuaternion;
  }

  /** Creates a log quaternion from a 3D vector by copying its components. */
  static fromCopyVector3(vec: IVector3): LogQuaternion {
    return super._fromCopyVector3(vec, Float32Array) as LogQuaternion;
  }

  /** Creates a log quaternion by copying from another log quaternion. */
  static fromCopyLogQuaternion(quat: ILogQuaternion): LogQuaternion {
    return super._fromCopyLogQuaternion(quat, Float32Array) as LogQuaternion;
  }

  /** Converts a regular quaternion to its logarithmic form. */
  static fromCopyQuaternion(quat: IQuaternion): LogQuaternion {
    return super._fromCopyQuaternion(quat, Float32Array) as LogQuaternion;
  }
}

/**
 * Logarithm of a quaternion with 64-bit float components.
 * Use this implementation when higher numerical precision is required.
 */
export class LogQuaterniond extends LogQuaternion_<Float64ArrayConstructor> {
  /**
   * Creates a new LogQuaterniond instance.
   * @param v - The typed array containing the x, y, z components
   */
  constructor(v: TypedArray) {
    super(v, { type: Float64Array });
  }

  /** Creates a log quaternion that directly uses the given Float64Array (no copy). */
  static fromFloat64Array(array: Float64Array): LogQuaterniond {
    return super._fromTypedArray(array, Float64Array) as LogQuaterniond;
  }

  /** Creates a log quaternion from a 3-element array by copying the values. */
  static fromCopyArray3(array: Array3<number>): LogQuaterniond {
    return super._fromCopyArray3(array, Float64Array) as LogQuaterniond;
  }

  /** Creates a log quaternion from an array by copying the first 3 values. */
  static fromCopyArray(array: Array<number>): LogQuaterniond {
    return super._fromCopyArray(array, Float64Array) as LogQuaterniond;
  }

  /** Creates a log quaternion from individual x, y, z component values. */
  static fromCopy3(x: number, y: number, z: number): LogQuaterniond {
    return super._fromCopy3(x, y, z, Float64Array) as LogQuaterniond;
  }

  /** Creates a log quaternion from a 3D vector by copying its components. */
  static fromCopyVector3(vec: IVector3): LogQuaterniond {
    return super._fromCopyVector3(vec, Float64Array) as LogQuaterniond;
  }

  /** Creates a log quaternion by copying from another log quaternion. */
  static fromCopyLogQuaternion(quat: ILogQuaternion): LogQuaterniond {
    return super._fromCopyLogQuaternion(quat, Float64Array) as LogQuaterniond;
  }

  /** Converts a regular quaternion to its logarithmic form. */
  static fromCopyQuaternion(quat: IQuaternion): LogQuaterniond {
    return super._fromCopyQuaternion(quat, Float64Array) as LogQuaterniond;
  }
}
