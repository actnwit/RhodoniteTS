import { type Array4, TypedArray } from '../../types/CommonTypes';
import { Logger } from '../misc/Logger';
import type { IMatrix44 } from './IMatrix';
import type { ILogQuaternion, IMutableQuaternion, IQuaternion } from './IQuaternion';
import type { IVector3, IVector4 } from './IVector';
import { MutableMatrix44 } from './MutableMatrix44';
import { Quaternion } from './Quaternion';

/**
 * A mutable quaternion class that extends the immutable Quaternion class.
 * Provides methods for quaternion operations that modify the instance in place.
 * Quaternions are used to represent rotations in 3D space and are particularly
 * useful for avoiding gimbal lock and providing smooth interpolations.
 */
export class MutableQuaternion extends Quaternion implements IMutableQuaternion {
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
  get className() {
    return 'MutableQuaternion';
  }

  /**
   * Creates an identity quaternion (0, 0, 0, 1).
   * @returns A new MutableQuaternion representing no rotation
   */
  static identity() {
    return MutableQuaternion.fromCopy4(0, 0, 0, 1);
  }

  /**
   * Creates a dummy quaternion with empty array (for initialization purposes).
   * @returns A new MutableQuaternion with zero-length array
   */
  static dummy() {
    return new this(new Float32Array(0));
  }

  /**
   * Inverts a quaternion and returns a new MutableQuaternion.
   * @param quat - The quaternion to invert
   * @returns A new MutableQuaternion representing the inverse rotation
   */
  static invert(quat: IQuaternion) {
    return super.invert(quat) as MutableQuaternion;
  }

  /**
   * Performs spherical linear interpolation (SLERP) between two quaternions.
   * @param l_quat - The starting quaternion
   * @param r_quat - The ending quaternion
   * @param ratio - Interpolation factor (0.0 to 1.0)
   * @returns A new MutableQuaternion representing the interpolated rotation
   */
  static qlerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number) {
    return super.qlerp(l_quat, r_quat, ratio) as MutableQuaternion;
  }

  /**
   * Performs linear interpolation between two quaternions.
   * @param l_quat - The starting quaternion
   * @param r_quat - The ending quaternion
   * @param ratio - Interpolation factor (0.0 to 1.0)
   * @returns A new MutableQuaternion representing the interpolated rotation
   */
  static lerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number) {
    return super.lerp(l_quat, r_quat, ratio) as MutableQuaternion;
  }

  /**
   * Creates a quaternion from an axis and angle.
   * @param vec - The rotation axis (normalized vector recommended)
   * @param radian - The rotation angle in radians
   * @returns A new MutableQuaternion representing the axis-angle rotation
   */
  static axisAngle(vec: IVector3, radian: number) {
    return super.axisAngle(vec, radian) as MutableQuaternion;
  }

  /**
   * Creates a quaternion from a rotation matrix.
   * @param mat - The 4x4 transformation matrix
   * @returns A new MutableQuaternion representing the matrix's rotation
   */
  static fromMatrix(mat: IMatrix44) {
    return super.fromMatrix(mat) as MutableQuaternion;
  }

  /**
   * Creates a quaternion from a position vector (w component set to 0).
   * @param vec - The position vector
   * @returns A new MutableQuaternion with position data
   */
  static fromPosition(vec: IVector3) {
    return super.fromPosition(vec) as MutableQuaternion;
  }

  /**
   * Adds two quaternions component-wise.
   * @param l_quat - The left quaternion
   * @param r_quat - The right quaternion
   * @returns A new MutableQuaternion representing the sum
   */
  static add(l_quat: IQuaternion, r_quat: IQuaternion) {
    return super.add(l_quat, r_quat) as MutableQuaternion;
  }

  /**
   * Subtracts the second quaternion from the first component-wise.
   * @param l_quat - The left quaternion
   * @param r_quat - The right quaternion
   * @returns A new MutableQuaternion representing the difference
   */
  static subtract(l_quat: IQuaternion, r_quat: IQuaternion) {
    return super.subtract(l_quat, r_quat) as MutableQuaternion;
  }

  /**
   * Multiplies two quaternions (quaternion composition).
   * @param l_quat - The left quaternion
   * @param r_quat - The right quaternion
   * @returns A new MutableQuaternion representing the composed rotation
   */
  static multiply(l_quat: IQuaternion, r_quat: IQuaternion) {
    return super.multiply(l_quat, r_quat) as MutableQuaternion;
  }

  /**
   * Multiplies a quaternion by a scalar value.
   * @param quat - The quaternion to multiply
   * @param value - The scalar value
   * @returns A new MutableQuaternion representing the scaled quaternion
   */
  static multiplyNumber(quat: IQuaternion, value: number) {
    return super.multiplyNumber(quat, value) as MutableQuaternion;
  }

  /**
   * Divides a quaternion by a scalar value.
   * @param quat - The quaternion to divide
   * @param value - The scalar value (must not be zero)
   * @returns A new MutableQuaternion representing the scaled quaternion
   */
  static divideNumber(quat: IQuaternion, value: number) {
    return super.divideNumber(quat, value) as MutableQuaternion;
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
  setAt(i: number, value: number) {
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
  setComponents(x: number, y: number, z: number, w: number) {
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
  copyComponents(quat: IQuaternion) {
    return this.setComponents(quat._v[0], quat._v[1], quat._v[2], quat._v[3]);
  }

  /**
   * Sets this quaternion to the identity quaternion (0, 0, 0, 1).
   * @returns This instance for method chaining
   */
  identity() {
    return this.setComponents(0, 0, 0, 1);
  }

  /**
   * Normalizes this quaternion to unit length in place.
   * @returns This instance for method chaining
   */
  normalize() {
    const norm = this.length();
    return this.divideNumber(norm);
  }

  /**
   * Inverts this quaternion in place (conjugate divided by magnitude squared).
   * @returns This instance for method chaining
   */
  invert() {
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
  qlerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number) {
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
    let s2;
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
  lerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number) {
    this._v[0] = l_quat._v[0] * (1 - ratio) + r_quat._v[0] * ratio;
    this._v[1] = l_quat._v[1] * (1 - ratio) + r_quat._v[1] * ratio;
    this._v[2] = l_quat._v[2] * (1 - ratio) + r_quat._v[2] * ratio;
    this._v[3] = l_quat._v[3] * (1 - ratio) + r_quat._v[3] * ratio;

    return this;
  }

  /**
   * Sets this quaternion from an axis and angle.
   * @param vec - The rotation axis (will be normalized)
   * @param radian - The rotation angle in radians
   * @returns This instance for method chaining
   */
  axisAngle(vec: IVector3, radian: number) {
    const halfAngle = 0.5 * radian;
    const sin = Math.sin(halfAngle);

    const length = vec.length();
    if (length === 0) {
      Logger.error('0 division occurred!');
    }

    this._v[3] = Math.cos(halfAngle);
    this._v[0] = (sin * vec._v[0]) / length;
    this._v[1] = (sin * vec._v[1]) / length;
    this._v[2] = (sin * vec._v[2]) / length;

    return this;
  }

  /**
   * Sets this quaternion from a 4x4 transformation matrix.
   * Extracts the rotation component from the matrix, ignoring scale and translation.
   * @param mat - The 4x4 transformation matrix
   * @returns This instance for method chaining
   */
  fromMatrix(mat: IMatrix44) {
    let sx = Math.hypot(mat.m00, mat.m10, mat.m20);
    const sy = Math.hypot(mat.m01, mat.m11, mat.m21);
    const sz = Math.hypot(mat.m02, mat.m12, mat.m22);

    const det = mat.determinant();
    if (det < 0) {
      sx = -sx;
    }

    const m = MutableMatrix44.fromCopyMatrix44(mat);

    const invSx = 1 / sx;
    const invSy = 1 / sy;
    const invSz = 1 / sz;

    m.m00 *= invSx;
    m.m10 *= invSx;
    m.m20 *= invSx;

    m.m01 *= invSy;
    m.m11 *= invSy;
    m.m21 *= invSy;

    m.m02 *= invSz;
    m.m12 *= invSz;
    m.m22 *= invSz;

    const trace = m.m00 + m.m11 + m.m22;

    if (trace > 0) {
      const S = 0.5 / Math.sqrt(trace + 1.0);
      this._v[0] = (m.m21 - m.m12) * S;
      this._v[1] = (m.m02 - m.m20) * S;
      this._v[2] = (m.m10 - m.m01) * S;
      this._v[3] = 0.25 / S;
    } else if (m.m00 > m.m11 && m.m00 > m.m22) {
      const S = Math.sqrt(1.0 + m.m00 - m.m11 - m.m22) * 2;
      this._v[0] = 0.25 * S;
      this._v[1] = (m.m01 + m.m10) / S;
      this._v[2] = (m.m02 + m.m20) / S;
      this._v[3] = (m.m21 - m.m12) / S;
    } else if (m.m11 > m.m22) {
      const S = Math.sqrt(1.0 + m.m11 - m.m00 - m.m22) * 2;
      this._v[0] = (m.m01 + m.m10) / S;
      this._v[1] = 0.25 * S;
      this._v[2] = (m.m12 + m.m21) / S;
      this._v[3] = (m.m02 - m.m20) / S;
    } else {
      const S = Math.sqrt(1.0 + m.m22 - m.m00 - m.m11) * 2;
      this._v[0] = (m.m02 + m.m20) / S;
      this._v[1] = (m.m12 + m.m21) / S;
      this._v[2] = 0.25 * S;
      this._v[3] = (m.m10 - m.m01) / S;
    }
    return this;
  }

  /**
   * Sets this quaternion from a position vector (w component set to 0).
   * @param vec - The position vector
   * @returns This instance for method chaining
   */
  fromPosition(vec: IVector3) {
    return this.setComponents(vec._v[0], vec._v[1], vec._v[2], 0);
  }

  /**
   * Adds another quaternion to this quaternion component-wise.
   * @param quat - The quaternion to add
   * @returns This instance for method chaining
   */
  add(quat: IQuaternion) {
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
  subtract(quat: IQuaternion) {
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
  multiply(quat: IQuaternion) {
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
  multiplyNumber(value: number) {
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
  divideNumber(value: number) {
    if (value !== 0) {
      this._v[0] /= value;
      this._v[1] /= value;
      this._v[2] /= value;
      this._v[3] /= value;
    } else {
      Logger.error('0 division occurred!');
      this._v[0] = Number.POSITIVE_INFINITY;
      this._v[1] = Number.POSITIVE_INFINITY;
      this._v[2] = Number.POSITIVE_INFINITY;
      this._v[3] = Number.POSITIVE_INFINITY;
    }
    return this;
  }

  /**
   * Creates a copy of this quaternion.
   * @returns A new IMutableQuaternion with the same component values
   */
  clone(): IMutableQuaternion {
    return MutableQuaternion.fromCopy4(this._v[0], this._v[1], this._v[2], this._v[3]) as IMutableQuaternion;
  }

  /**
   * Creates a MutableQuaternion from an existing Float32Array.
   * @param array - The Float32Array containing quaternion components
   * @returns A new MutableQuaternion instance
   */
  static fromFloat32Array(array: Float32Array) {
    return new MutableQuaternion(array);
  }

  /**
   * Creates a MutableQuaternion by copying from a 4-element array.
   * @param array - Array containing [x, y, z, w] components
   * @returns A new MutableQuaternion instance
   */
  static fromCopyArray4(array: Array4<number>) {
    return new MutableQuaternion(new Float32Array(array));
  }

  /**
   * Creates a MutableQuaternion by copying from an array (takes first 4 elements).
   * @param array - Array containing quaternion components
   * @returns A new MutableQuaternion instance
   */
  static fromCopyArray(array: Array<number>) {
    return new MutableQuaternion(new Float32Array(array.slice(0, 4)));
  }

  /**
   * Creates a MutableQuaternion from individual component values.
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   * @param w - The w component
   * @returns A new MutableQuaternion instance
   */
  static fromCopy4(x: number, y: number, z: number, w: number) {
    return new MutableQuaternion(new Float32Array([x, y, z, w]));
  }

  /**
   * Creates a MutableQuaternion by copying from another quaternion.
   * @param quat - The quaternion to copy from
   * @returns A new MutableQuaternion instance
   */
  static fromCopyQuaternion(quat: IQuaternion) {
    const v = new Float32Array(4);
    v[0] = quat._v[0];
    v[1] = quat._v[1];
    v[2] = quat._v[2];
    v[3] = quat._v[3];
    return new MutableQuaternion(v);
  }

  /**
   * Creates a MutableQuaternion by copying from a 4D vector.
   * @param vec - The 4D vector to copy from
   * @returns A new MutableQuaternion instance
   */
  static fromCopyVector4(vec: IVector4) {
    const v = new Float32Array(4);
    v[0] = vec._v[0];
    v[1] = vec._v[1];
    v[2] = vec._v[2];
    v[3] = vec._v[3];
    return new MutableQuaternion(v);
  }

  /**
   * Creates a MutableQuaternion from a logarithmic quaternion.
   * Converts from log space back to quaternion space using exponential map.
   * @param x - The logarithmic quaternion to convert
   * @returns A new MutableQuaternion instance
   */
  static fromCopyLogQuaternion(x: ILogQuaternion) {
    const theta = x._v[0] * x._v[0] + x._v[1] * x._v[1] + x._v[2] * x._v[2];
    const sin = Math.sin(theta);
    const v = new Float32Array(4);
    v[0] = x._v[0] * (sin / theta);
    v[1] = x._v[1] * (sin / theta);
    v[2] = x._v[2] * (sin / theta);
    v[3] = Math.cos(theta);
    return new MutableQuaternion(v);
  }
}
