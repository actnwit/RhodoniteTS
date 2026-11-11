import type { Array4, FloatTypedArrayConstructor, TypedArray } from '../../types/CommonTypes';
import { Logger } from '../misc/Logger';
import type { IMatrix44 } from './IMatrix';
import type { ILogQuaternion, IMutableQuaternion, IQuaternion } from './IQuaternion';
import type { IVector3, IVector4 } from './IVector';
import { Quaternion, Quaternion_ } from './Quaternion';

/**
 * A mutable quaternion class that extends the immutable Quaternion class.
 * Provides methods for quaternion operations that modify the instance in place.
 * Quaternions are used to represent rotations in 3D space and are particularly
 * useful for avoiding gimbal lock and providing smooth interpolations.
 */
export class MutableQuaternion_<T extends FloatTypedArrayConstructor>
  extends Quaternion_<T>
  implements IMutableQuaternion
{
  /**
   * Creates a new MutableQuaternion_ instance.
   * @param v - The typed array containing the quaternion components
   * @param _options - Configuration object containing the typed array constructor
   */
  constructor(v: TypedArray, _options?: { type: T }) {
    super(v, _options);
  }

  /**
   * Sets the x component of the quaternion.
   * @param x - The x component value
   */
  set x(x: number) {
    this._v[0] = x;
  }

  /**
   * Gets the x component of the quaternion.
   * @returns The x component value
   */
  get x(): number {
    return this._v[0];
  }

  /**
   * Sets the y component of the quaternion.
   * @param y - The y component value
   */
  set y(y: number) {
    this._v[1] = y;
  }

  /**
   * Gets the y component of the quaternion.
   * @returns The y component value
   */
  get y(): number {
    return this._v[1];
  }

  /**
   * Sets the z component of the quaternion.
   * @param z - The z component value
   */
  set z(z: number) {
    this._v[2] = z;
  }

  /**
   * Gets the z component of the quaternion.
   * @returns The z component value
   */
  get z(): number {
    return this._v[2];
  }

  /**
   * Sets the w component of the quaternion.
   * @param w - The w component value
   */
  set w(w: number) {
    this._v[3] = w;
  }

  /**
   * Gets the w component of the quaternion.
   * @returns The w component value
   */
  get w(): number {
    return this._v[3];
  }

  /**
   * Gets the class name for identification purposes.
   * @returns The string 'MutableQuaternion'
   */
  get className(): string {
    return 'MutableQuaternion';
  }

  /**
   * Gets the raw Float32Array containing the quaternion components.
   * @returns The underlying Float32Array [x, y, z, w]
   */
  raw() {
    return this._v;
  }

  /**
   * Sets a component value at the specified index.
   * @param i - The component index (0=x, 1=y, 2=z, 3=w)
   * @param value - The value to set
   * @returns This instance for method chaining
   */
  setAt(i: number, value: number): this {
    this._v[i] = value;
    return this;
  }

  /**
   * Sets all quaternion components.
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   * @param w - The w component
   * @returns This instance for method chaining
   */
  setComponents(x: number, y: number, z: number, w: number): this {
    this._v[0] = x;
    this._v[1] = y;
    this._v[2] = z;
    this._v[3] = w;
    return this;
  }

  /**
   * Copies components from another quaternion.
   * @param quat - The quaternion to copy from
   * @returns This instance for method chaining
   */
  copyComponents(quat: IQuaternion): this {
    return this.setComponents(quat._v[0], quat._v[1], quat._v[2], quat._v[3]);
  }

  /**
   * Sets this quaternion to the identity quaternion (0, 0, 0, 1).
   * @returns This instance for method chaining
   */
  identity(): this {
    return this.setComponents(0, 0, 0, 1);
  }

  /**
   * Normalizes this quaternion to unit length in place.
   * @returns This instance for method chaining
   */
  normalize(): this {
    const norm = this.length();
    if (norm === 0) {
      Logger.default.error('cannot normalize a zero-length quaternion. Returning an identity quaternion instead.');
      return this.identity();
    }
    return this.divideNumber(norm);
  }

  /**
   * Inverts this quaternion in place (conjugate divided by magnitude squared).
   * @returns This instance for method chaining
   */
  invert(): this {
    const norm = this.length();
    if (norm === 0.0) {
      return this; // [0, 0, 0, 0]
    }

    this._v[0] = -this._v[0] / norm;
    this._v[1] = -this._v[1] / norm;
    this._v[2] = -this._v[2] / norm;
    this._v[3] = this._v[3] / norm;
    return this;
  }

  /**
   * Performs spherical linear interpolation (SLERP) and stores the result in this quaternion.
   * @param l_quat - The starting quaternion
   * @param r_quat - The ending quaternion
   * @param ratio - Interpolation factor (0.0 to 1.0)
   * @returns This instance for method chaining
   */
  qlerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): this {
    let qr =
      l_quat._v[3] * r_quat._v[3] +
      l_quat._v[0] * r_quat._v[0] +
      l_quat._v[1] * r_quat._v[1] +
      l_quat._v[2] * r_quat._v[2];
    const ss = 1.0 - qr * qr;

    if (ss === 0.0) {
      return this.copyComponents(l_quat);
    }
    if (qr > 1) {
      qr = 0.999;
    } else if (qr < -1) {
      qr = -0.999;
    }

    let ph = Math.acos(qr);
    let s2: number;
    if (qr < 0.0 && ph > Math.PI / 2.0) {
      qr =
        -l_quat._v[3] * r_quat._v[3] -
        l_quat._v[0] * r_quat._v[0] -
        l_quat._v[1] * r_quat._v[1] -
        l_quat._v[2] * r_quat._v[2];
      ph = Math.acos(qr);
      s2 = (-1 * Math.sin(ph * ratio)) / Math.sin(ph);
    } else {
      s2 = Math.sin(ph * ratio) / Math.sin(ph);
    }
    const s1 = Math.sin(ph * (1.0 - ratio)) / Math.sin(ph);

    this._v[0] = l_quat._v[0] * s1 + r_quat._v[0] * s2;
    this._v[1] = l_quat._v[1] * s1 + r_quat._v[1] * s2;
    this._v[2] = l_quat._v[2] * s1 + r_quat._v[2] * s2;
    this._v[3] = l_quat._v[3] * s1 + r_quat._v[3] * s2;

    return this;
  }

  /**
   * Performs linear interpolation and stores the result in this quaternion.
   * @param l_quat - The starting quaternion
   * @param r_quat - The ending quaternion
   * @param ratio - Interpolation factor (0.0 to 1.0)
   * @returns This instance for method chaining
   */
  lerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): this {
    this._v[0] = l_quat._v[0] * (1 - ratio) + r_quat._v[0] * ratio;
    this._v[1] = l_quat._v[1] * (1 - ratio) + r_quat._v[1] * ratio;
    this._v[2] = l_quat._v[2] * (1 - ratio) + r_quat._v[2] * ratio;
    this._v[3] = l_quat._v[3] * (1 - ratio) + r_quat._v[3] * ratio;

    return this;
  }

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
  tryAxisAngle(vec: IVector3, radian: number): boolean {
    const length = vec.length();
    if (!Number.isFinite(length) || length === 0) {
      return false;
    }

    const halfAngle = 0.5 * radian;
    const sin = Math.sin(halfAngle);

    this._v[3] = Math.cos(halfAngle);
    this._v[0] = (sin * vec._v[0]) / length;
    this._v[1] = (sin * vec._v[1]) / length;
    this._v[2] = (sin * vec._v[2]) / length;

    return true;
  }

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
  axisAngle(vec: IVector3, radian: number): this {
    if (this.tryAxisAngle(vec, radian)) {
      return this;
    }

    Logger.default.error('the rotation axis has zero length. Returning an identity quaternion instead.');
    return this.identity();
  }

  /**
   * Attempts to set this quaternion from a 4x4 transformation matrix.
   * Extracts the rotation component from the matrix, ignoring scale and translation.
   *
   * The quaternion is left unchanged when the rotation cannot be extracted.
   *
   * @param mat - The 4x4 transformation matrix
   * @returns True if the rotation could be extracted, false otherwise
   */
  tryFromMatrix(mat: IMatrix44): boolean {
    return Quaternion.tryFromMatrixTo(mat, this);
  }

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
  fromMatrix(mat: IMatrix44): this {
    if (this.tryFromMatrix(mat)) {
      return this;
    }

    Logger.default.error(
      'the rotation cannot be extracted from the matrix (it is singular or contains non-finite values). Returning an identity quaternion instead.'
    );
    this._v[0] = 0;
    this._v[1] = 0;
    this._v[2] = 0;
    this._v[3] = 1;
    return this;
  }

  /**
   * Sets this quaternion from a position vector (w component set to 0).
   * @param vec - The position vector
   * @returns This instance for method chaining
   */
  fromPosition(vec: IVector3): this {
    return this.setComponents(vec._v[0], vec._v[1], vec._v[2], 0);
  }

  /**
   * Adds another quaternion to this quaternion component-wise.
   * @param quat - The quaternion to add
   * @returns This instance for method chaining
   */
  add(quat: IQuaternion): this {
    this._v[0] += quat._v[0];
    this._v[1] += quat._v[1];
    this._v[2] += quat._v[2];
    this._v[3] += quat._v[3];
    return this;
  }

  /**
   * Subtracts another quaternion from this quaternion component-wise.
   * @param quat - The quaternion to subtract
   * @returns This instance for method chaining
   */
  subtract(quat: IQuaternion): this {
    this._v[0] -= quat._v[0];
    this._v[1] -= quat._v[1];
    this._v[2] -= quat._v[2];
    this._v[3] -= quat._v[3];
    return this;
  }

  /**
   * Multiplies this quaternion by another quaternion (quaternion composition).
   * The result represents the combined rotation.
   * @param quat - The quaternion to multiply by
   * @returns This instance for method chaining
   */
  multiply(quat: IQuaternion): this {
    const x = quat._v[3] * this._v[0] + quat._v[2] * this._v[1] + quat._v[1] * this._v[2] - quat._v[0] * this._v[3];
    const y = -quat._v[2] * this._v[0] + quat._v[3] * this._v[1] + quat._v[0] * this._v[2] - quat._v[1] * this._v[3];
    const z = quat._v[1] * this._v[0] + quat._v[0] * this._v[1] + quat._v[3] * this._v[2] - quat._v[2] * this._v[3];
    const w = -quat._v[0] * this._v[0] - quat._v[1] * this._v[1] - quat._v[2] * this._v[2] - quat._v[3] * this._v[3];
    return this.setComponents(x, y, z, w);
  }

  /**
   * Multiplies this quaternion by a scalar value.
   * @param value - The scalar value to multiply by
   * @returns This instance for method chaining
   */
  multiplyNumber(value: number): this {
    this._v[0] *= value;
    this._v[1] *= value;
    this._v[2] *= value;
    this._v[3] *= value;
    return this;
  }

  /**
   * Divides this quaternion by a scalar value.
   * @param value - The scalar value to divide by (must not be zero)
   * @returns This instance for method chaining
   */
  divideNumber(value: number): this {
    if (value !== 0) {
      this._v[0] /= value;
      this._v[1] /= value;
      this._v[2] /= value;
      this._v[3] /= value;
    } else {
      Logger.default.error('0 division occurred! The result is set to zero.');
      this._v[0] = 0;
      this._v[1] = 0;
      this._v[2] = 0;
      this._v[3] = 0;
    }
    return this;
  }

  /**
   * Creates a copy of this quaternion.
   * @returns A new IMutableQuaternion with the same component values
   */
  clone(): this {
    return (this.constructor as any).fromCopy4(this._v[0], this._v[1], this._v[2], this._v[3]);
  }
}

/**
 * Mutable quaternion with 32-bit float components.
 */
export class MutableQuaternion extends MutableQuaternion_<Float32ArrayConstructor> {
  /**
   * Creates a new MutableQuaternion instance.
   * @param v - The typed array containing the quaternion components
   */
  constructor(v: TypedArray) {
    super(v, { type: Float32Array });
  }

  /**
   * identity
   */
  static identity(): MutableQuaternion {
    return super.identity() as MutableQuaternion;
  }

  /**
   * dummy
   */
  static dummy(): MutableQuaternion {
    return super.dummy() as MutableQuaternion;
  }

  /**
   * invert
   */
  static invert(quat: IQuaternion): MutableQuaternion {
    return super.invert(quat) as MutableQuaternion;
  }

  /**
   * qlerp
   */
  static qlerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): MutableQuaternion {
    return super.qlerp(l_quat, r_quat, ratio) as MutableQuaternion;
  }

  /**
   * lerp
   */
  static lerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): MutableQuaternion {
    return super.lerp(l_quat, r_quat, ratio) as MutableQuaternion;
  }

  /**
   * tryAxisAngle
   */
  static tryAxisAngle(vec: IVector3, radian: number): MutableQuaternion | null {
    return super.tryAxisAngle(vec, radian) as MutableQuaternion | null;
  }

  /**
   * axisAngle
   */
  static axisAngle(vec: IVector3, radian: number): MutableQuaternion {
    return super.axisAngle(vec, radian) as MutableQuaternion;
  }

  /**
   * tryFromMatrix
   */
  static tryFromMatrix(mat: IMatrix44): MutableQuaternion | null {
    return super.tryFromMatrix(mat) as MutableQuaternion | null;
  }

  /**
   * fromMatrix
   */
  static fromMatrix(mat: IMatrix44): MutableQuaternion {
    return super.fromMatrix(mat) as MutableQuaternion;
  }

  /**
   * fromPosition
   */
  static fromPosition(vec: IVector3): MutableQuaternion {
    return super.fromPosition(vec) as MutableQuaternion;
  }

  /**
   * add
   */
  static add(l_quat: IQuaternion, r_quat: IQuaternion): MutableQuaternion {
    return super.add(l_quat, r_quat) as MutableQuaternion;
  }

  /**
   * subtract
   */
  static subtract(l_quat: IQuaternion, r_quat: IQuaternion): MutableQuaternion {
    return super.subtract(l_quat, r_quat) as MutableQuaternion;
  }

  /**
   * multiply
   */
  static multiply(l_quat: IQuaternion, r_quat: IQuaternion): MutableQuaternion {
    return super.multiply(l_quat, r_quat) as MutableQuaternion;
  }

  /**
   * multiplyNumber
   */
  static multiplyNumber(quat: IQuaternion, value: number): MutableQuaternion {
    return super.multiplyNumber(quat, value) as MutableQuaternion;
  }

  /**
   * divideNumber
   */
  static divideNumber(quat: IQuaternion, value: number): MutableQuaternion {
    return super.divideNumber(quat, value) as MutableQuaternion;
  }

  /**
   * Creates a mutable quaternion that directly uses the given Float32Array (no copy).
   */
  static fromFloat32Array(array: Float32Array): MutableQuaternion {
    return super.fromTypedArray(array) as MutableQuaternion;
  }

  /**
   * fromCopyArray4
   */
  static fromCopyArray4(array: Array4<number>): MutableQuaternion {
    return super.fromCopyArray4(array) as MutableQuaternion;
  }

  /**
   * fromCopyArray
   */
  static fromCopyArray(array: Array<number>): MutableQuaternion {
    return super.fromCopyArray(array) as MutableQuaternion;
  }

  /**
   * fromCopy4
   */
  static fromCopy4(x: number, y: number, z: number, w: number): MutableQuaternion {
    return super.fromCopy4(x, y, z, w) as MutableQuaternion;
  }

  /**
   * fromCopyQuaternion
   */
  static fromCopyQuaternion(quat: IQuaternion): MutableQuaternion {
    return super.fromCopyQuaternion(quat) as MutableQuaternion;
  }

  /**
   * fromCopyVector4
   */
  static fromCopyVector4(vec: IVector4): MutableQuaternion {
    return super.fromCopyVector4(vec) as MutableQuaternion;
  }

  /**
   * fromCopyLogQuaternion
   */
  static fromCopyLogQuaternion(x: ILogQuaternion): MutableQuaternion {
    return super.fromCopyLogQuaternion(x) as MutableQuaternion;
  }
}

/**
 * Mutable quaternion with 64-bit float components.
 */
export class MutableQuaterniond extends MutableQuaternion_<Float64ArrayConstructor> {
  /** The typed array constructor used for newly created quaternions. */
  protected static override readonly _type: FloatTypedArrayConstructor = Float64Array;

  /**
   * Creates a new MutableQuaterniond instance.
   * @param v - The typed array containing the quaternion components
   */
  constructor(v: TypedArray) {
    super(v, { type: Float64Array });
  }

  /**
   * identity
   */
  static identity(): MutableQuaterniond {
    return super.identity() as MutableQuaterniond;
  }

  /**
   * dummy
   */
  static dummy(): MutableQuaterniond {
    return super.dummy() as MutableQuaterniond;
  }

  /**
   * invert
   */
  static invert(quat: IQuaternion): MutableQuaterniond {
    return super.invert(quat) as MutableQuaterniond;
  }

  /**
   * qlerp
   */
  static qlerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): MutableQuaterniond {
    return super.qlerp(l_quat, r_quat, ratio) as MutableQuaterniond;
  }

  /**
   * lerp
   */
  static lerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): MutableQuaterniond {
    return super.lerp(l_quat, r_quat, ratio) as MutableQuaterniond;
  }

  /**
   * tryAxisAngle
   */
  static tryAxisAngle(vec: IVector3, radian: number): MutableQuaterniond | null {
    return super.tryAxisAngle(vec, radian) as MutableQuaterniond | null;
  }

  /**
   * axisAngle
   */
  static axisAngle(vec: IVector3, radian: number): MutableQuaterniond {
    return super.axisAngle(vec, radian) as MutableQuaterniond;
  }

  /**
   * tryFromMatrix
   */
  static tryFromMatrix(mat: IMatrix44): MutableQuaterniond | null {
    return super.tryFromMatrix(mat) as MutableQuaterniond | null;
  }

  /**
   * fromMatrix
   */
  static fromMatrix(mat: IMatrix44): MutableQuaterniond {
    return super.fromMatrix(mat) as MutableQuaterniond;
  }

  /**
   * fromPosition
   */
  static fromPosition(vec: IVector3): MutableQuaterniond {
    return super.fromPosition(vec) as MutableQuaterniond;
  }

  /**
   * add
   */
  static add(l_quat: IQuaternion, r_quat: IQuaternion): MutableQuaterniond {
    return super.add(l_quat, r_quat) as MutableQuaterniond;
  }

  /**
   * subtract
   */
  static subtract(l_quat: IQuaternion, r_quat: IQuaternion): MutableQuaterniond {
    return super.subtract(l_quat, r_quat) as MutableQuaterniond;
  }

  /**
   * multiply
   */
  static multiply(l_quat: IQuaternion, r_quat: IQuaternion): MutableQuaterniond {
    return super.multiply(l_quat, r_quat) as MutableQuaterniond;
  }

  /**
   * multiplyNumber
   */
  static multiplyNumber(quat: IQuaternion, value: number): MutableQuaterniond {
    return super.multiplyNumber(quat, value) as MutableQuaterniond;
  }

  /**
   * divideNumber
   */
  static divideNumber(quat: IQuaternion, value: number): MutableQuaterniond {
    return super.divideNumber(quat, value) as MutableQuaterniond;
  }

  /**
   * Creates a mutable quaternion that directly uses the given Float64Array (no copy).
   */
  static fromFloat64Array(array: Float64Array): MutableQuaterniond {
    return super.fromTypedArray(array) as MutableQuaterniond;
  }

  /**
   * fromCopyArray4
   */
  static fromCopyArray4(array: Array4<number>): MutableQuaterniond {
    return super.fromCopyArray4(array) as MutableQuaterniond;
  }

  /**
   * fromCopyArray
   */
  static fromCopyArray(array: Array<number>): MutableQuaterniond {
    return super.fromCopyArray(array) as MutableQuaterniond;
  }

  /**
   * fromCopy4
   */
  static fromCopy4(x: number, y: number, z: number, w: number): MutableQuaterniond {
    return super.fromCopy4(x, y, z, w) as MutableQuaterniond;
  }

  /**
   * fromCopyQuaternion
   */
  static fromCopyQuaternion(quat: IQuaternion): MutableQuaterniond {
    return super.fromCopyQuaternion(quat) as MutableQuaterniond;
  }

  /**
   * fromCopyVector4
   */
  static fromCopyVector4(vec: IVector4): MutableQuaterniond {
    return super.fromCopyVector4(vec) as MutableQuaterniond;
  }

  /**
   * fromCopyLogQuaternion
   */
  static fromCopyLogQuaternion(x: ILogQuaternion): MutableQuaterniond {
    return super.fromCopyLogQuaternion(x) as MutableQuaterniond;
  }
}
