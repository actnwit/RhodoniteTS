import type { Array4, FloatTypedArrayConstructor, TypedArray } from '../../types/CommonTypes';
import { CompositionType } from '../definitions/CompositionType';
import { Logger } from '../misc/Logger';
import { AbstractQuaternion } from './AbstractQuaternion';
import type { IMatrix44 } from './IMatrix';
import type { ILogQuaternion, IMutableQuaternion, IQuaternion } from './IQuaternion';
import type { IMutableVector3, IVector3, IVector4 } from './IVector';
import { MathUtil } from './MathUtil';
import { MutableMatrix44 } from './MutableMatrix44';
import { MutableVector3 } from './MutableVector3';
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
export class Quaternion_<T extends FloatTypedArrayConstructor> extends AbstractQuaternion implements IQuaternion {
  /** The typed array constructor used for newly created quaternions. */
  protected static readonly _type: FloatTypedArrayConstructor = Float32Array;

  private static __tmp_upVec: any = undefined;
  private static __tmp_vec3_0: any = MutableVector3.zero();
  private static __tmp_vec3_1: any = MutableVector3.zero();
  private static __tmp_vec3_2: any = MutableVector3.zero();
  private static __tmp_vec3_3: any = MutableVector3.zero();
  private static __tmp_vec3_4: any = MutableVector3.zero();
  private static __tmp_vec3_5: any = MutableVector3.zero();

  /**
   * Creates a new Quaternion_ instance.
   * @param x - The typed array containing the quaternion components [x, y, z, w]
   * @param _options - Configuration object containing the typed array constructor
   */
  constructor(x: TypedArray, _options?: { type: T }) {
    super();
    this._v = x;
  }

  /**
   * Gets the class name for debugging and reflection purposes.
   * @returns The string "Quaternion"
   */
  get className() {
    return 'Quaternion';
  }

  /**
   * Gets the composition type for this quaternion class.
   * @returns CompositionType.Vec4 indicating this is a 4-component vector
   */
  static get compositionType() {
    return CompositionType.Vec4;
  }

  /**
   * Creates an identity quaternion representing no rotation.
   * The identity quaternion is (0, 0, 0, 1) in (x, y, z, w) format.
   * @returns A new identity quaternion
   */
  static identity() {
    return this.fromCopy4(0, 0, 0, 1);
  }

  /**
   * Creates a dummy quaternion with zero-length internal array.
   * Used as a placeholder or uninitialized quaternion.
   * @returns A new dummy quaternion
   */
  static dummy() {
    return new this(new this._type(0));
  }

  /**
   * Computes the inverse of a quaternion.
   * For a unit quaternion, the inverse is the conjugate divided by the squared magnitude.
   * @param quat - The quaternion to invert
   * @returns The inverted quaternion, or zero quaternion if input has zero length
   */
  static invert(quat: IQuaternion): IQuaternion {
    const norm = quat.length();
    if (norm === 0.0) {
      return this.fromCopy4(0, 0, 0, 0) as IQuaternion;
    }

    const x = -quat._v[0] / norm;
    const y = -quat._v[1] / norm;
    const z = -quat._v[2] / norm;
    const w = quat._v[3] / norm;
    return this.fromCopy4(x, y, z, w) as IQuaternion;
  }

  /**
   * Computes the inverse of a quaternion and stores the result in the output parameter.
   * @param quat - The quaternion to invert
   * @param out - The output quaternion to store the result
   * @returns The output quaternion containing the inverted result
   */
  static invertTo(quat: IQuaternion, out: IMutableQuaternion): IQuaternion {
    const norm = quat.length();
    if (norm === 0.0) {
      return out.setComponents(0, 0, 0, 0);
    }

    out._v[0] = -quat._v[0] / norm;
    out._v[1] = -quat._v[1] / norm;
    out._v[2] = -quat._v[2] / norm;
    out._v[3] = quat._v[3] / norm;
    return out;
  }

  /**
   * Performs spherical linear interpolation (SLERP) between two quaternions.
   * SLERP provides smooth rotation interpolation that maintains constant angular velocity.
   * @param l_quat - The starting quaternion
   * @param r_quat - The ending quaternion
   * @param ratio - The interpolation parameter (0.0 = l_quat, 1.0 = r_quat)
   * @returns The interpolated quaternion
   */
  static qlerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): IQuaternion {
    let dotProduct =
      l_quat._v[0] * r_quat._v[0] +
      l_quat._v[1] * r_quat._v[1] +
      l_quat._v[2] * r_quat._v[2] +
      l_quat._v[3] * r_quat._v[3];
    const ss = 1.0 - dotProduct * dotProduct;

    if (ss === 0.0) {
      return l_quat.clone();
    }
    if (dotProduct > 1) {
      dotProduct = 0.999;
    } else if (dotProduct < -1) {
      dotProduct = -0.999;
    }

    let theta = Math.acos(dotProduct);
    const sinTheta = Math.sin(theta);

    let s2: number;
    if (dotProduct < 0.0) {
      dotProduct *= -1;
      theta = Math.acos(dotProduct);
      s2 = (-1 * Math.sin(theta * ratio)) / sinTheta;
    } else {
      s2 = Math.sin(theta * ratio) / sinTheta;
    }
    const s1 = Math.sin(theta * (1.0 - ratio)) / sinTheta;

    let x = l_quat._v[0] * s1 + r_quat._v[0] * s2;
    let y = l_quat._v[1] * s1 + r_quat._v[1] * s2;
    let z = l_quat._v[2] * s1 + r_quat._v[2] * s2;
    let w = l_quat._v[3] * s1 + r_quat._v[3] * s2;

    // normalize
    const length = Math.hypot(x, y, z, w);
    x = x / length;
    y = y / length;
    z = z / length;
    w = w / length;

    return this.fromCopy4(x, y, z, w) as IQuaternion;
  }

  /**
   * Performs spherical linear interpolation (SLERP) and stores the result in the output parameter.
   * @param l_quat - The starting quaternion
   * @param r_quat - The ending quaternion
   * @param ratio - The interpolation parameter (0.0 = l_quat, 1.0 = r_quat)
   * @param out - The output quaternion to store the result
   * @returns The output quaternion containing the interpolated result
   */
  static qlerpTo(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number, out: IMutableQuaternion) {
    let dotProduct =
      l_quat._v[0] * r_quat._v[0] +
      l_quat._v[1] * r_quat._v[1] +
      l_quat._v[2] * r_quat._v[2] +
      l_quat._v[3] * r_quat._v[3];
    const ss = 1.0 - dotProduct * dotProduct;

    if (ss === 0.0) {
      return out.copyComponents(l_quat);
    }
    if (dotProduct > 1) {
      dotProduct = 0.999;
    } else if (dotProduct < -1) {
      dotProduct = -0.999;
    }

    let theta = Math.acos(dotProduct);
    const sinTheta = Math.sin(theta);

    let s2: number;
    if (dotProduct < 0.0) {
      dotProduct *= -1;
      theta = Math.acos(dotProduct);
      s2 = (-1 * Math.sin(theta * ratio)) / sinTheta;
    } else {
      s2 = Math.sin(theta * ratio) / sinTheta;
    }
    const s1 = Math.sin(theta * (1.0 - ratio)) / sinTheta;

    out._v[0] = l_quat._v[0] * s1 + r_quat._v[0] * s2;
    out._v[1] = l_quat._v[1] * s1 + r_quat._v[1] * s2;
    out._v[2] = l_quat._v[2] * s1 + r_quat._v[2] * s2;
    out._v[3] = l_quat._v[3] * s1 + r_quat._v[3] * s2;

    return out.normalize();
  }

  /**
   * Performs linear interpolation (LERP) between two quaternions.
   * Note: LERP does not maintain constant angular velocity like SLERP.
   * @param l_quat - The starting quaternion
   * @param r_quat - The ending quaternion
   * @param ratio - The interpolation parameter (0.0 = l_quat, 1.0 = r_quat)
   * @returns The linearly interpolated quaternion
   */
  static lerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number) {
    const x = l_quat._v[0] * (1 - ratio) + r_quat._v[0] * ratio;
    const y = l_quat._v[1] * (1 - ratio) + r_quat._v[1] * ratio;
    const z = l_quat._v[2] * (1 - ratio) + r_quat._v[2] * ratio;
    const w = l_quat._v[3] * (1 - ratio) + r_quat._v[3] * ratio;
    return this.fromCopy4(x, y, z, w);
  }

  /**
   * Performs linear interpolation (LERP) and stores the result in the output parameter.
   * @param l_quat - The starting quaternion
   * @param r_quat - The ending quaternion
   * @param ratio - The interpolation parameter (0.0 = l_quat, 1.0 = r_quat)
   * @param out - The output quaternion to store the result
   * @returns The output quaternion containing the interpolated result
   */
  static lerpTo(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number, out: IMutableQuaternion) {
    out._v[0] = l_quat._v[0] * (1 - ratio) + r_quat._v[0] * ratio;
    out._v[1] = l_quat._v[1] * (1 - ratio) + r_quat._v[1] * ratio;
    out._v[2] = l_quat._v[2] * (1 - ratio) + r_quat._v[2] * ratio;
    out._v[3] = l_quat._v[3] * (1 - ratio) + r_quat._v[3] * ratio;
    return out;
  }

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
  static tryAxisAngle(vec: IVector3, radian: number): Quaternion | null {
    const length = vec.length();
    if (!Number.isFinite(length) || length === 0) {
      return null;
    }

    const halfAngle = 0.5 * radian;
    const sin = Math.sin(halfAngle);

    return this.fromCopy4(
      (sin * vec._v[0]) / length,
      (sin * vec._v[1]) / length,
      (sin * vec._v[2]) / length,
      Math.cos(halfAngle)
    );
  }

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
  static axisAngle(vec: IVector3, radian: number): Quaternion {
    const quat = this.tryAxisAngle(vec, radian);
    if (quat !== null) {
      return quat;
    }

    Logger.default.error('the rotation axis has zero length. Returning an identity quaternion instead.');
    return this.fromCopy4(0, 0, 0, 1);
  }

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
  private static __fromMatrixToTypedArray(mat: IMatrix44, outV: TypedArray): boolean {
    const sxRaw = Math.hypot(mat.m00, mat.m10, mat.m20);
    const sy = Math.hypot(mat.m01, mat.m11, mat.m21);
    const sz = Math.hypot(mat.m02, mat.m12, mat.m22);

    const det = mat.determinant();

    // The product of the column norms is an upper bound of |det| (Hadamard's
    // inequality), so it works as a scale reference for the singularity test.
    // This also covers zero-length basis vectors and non-finite input, which
    // would otherwise turn into Infinity/NaN through the normalization below.
    if (MathUtil.isSingularDet(det, sxRaw * sy * sz, MathUtil.getSingularEpsilon(this._type.BYTES_PER_ELEMENT))) {
      return false;
    }

    const sx = det < 0 ? -sxRaw : sxRaw;

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
      outV[0] = (m.m21 - m.m12) * S;
      outV[1] = (m.m02 - m.m20) * S;
      outV[2] = (m.m10 - m.m01) * S;
      outV[3] = 0.25 / S;
    } else if (m.m00 > m.m11 && m.m00 > m.m22) {
      const S = Math.sqrt(1.0 + m.m00 - m.m11 - m.m22) * 2;
      outV[0] = 0.25 * S;
      outV[1] = (m.m01 + m.m10) / S;
      outV[2] = (m.m02 + m.m20) / S;
      outV[3] = (m.m21 - m.m12) / S;
    } else if (m.m11 > m.m22) {
      const S = Math.sqrt(1.0 + m.m11 - m.m00 - m.m22) * 2;
      outV[0] = (m.m01 + m.m10) / S;
      outV[1] = 0.25 * S;
      outV[2] = (m.m12 + m.m21) / S;
      outV[3] = (m.m02 - m.m20) / S;
    } else {
      const S = Math.sqrt(1.0 + m.m22 - m.m00 - m.m11) * 2;
      outV[0] = (m.m02 + m.m20) / S;
      outV[1] = (m.m12 + m.m21) / S;
      outV[2] = 0.25 * S;
      outV[3] = (m.m10 - m.m01) / S;
    }

    return true;
  }

  /**
   * Attempts to create a quaternion from a 4x4 rotation matrix.
   * Extracts the rotation component from the matrix and converts it to quaternion form.
   *
   * @param mat - The 4x4 matrix containing rotation information
   * @returns A quaternion representing the same rotation as the matrix, or null
   *          if the rotation cannot be extracted (zero-length basis vector,
   *          numerically singular linear part, or non-finite values)
   */
  static tryFromMatrix(mat: IMatrix44): Quaternion | null {
    const outV = new this._type(4);
    if (!this.__fromMatrixToTypedArray(mat, outV)) {
      return null;
    }

    return this.fromCopy4(outV[0], outV[1], outV[2], outV[3]);
  }

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
  static fromMatrix(mat: IMatrix44): Quaternion {
    const quat = this.tryFromMatrix(mat);
    if (quat !== null) {
      return quat;
    }

    Logger.default.error(
      'the rotation cannot be extracted from the matrix (it is singular or contains non-finite values). Returning an identity quaternion instead.'
    );
    return this.fromCopy4(0, 0, 0, 1);
  }

  /**
   * Attempts to create a quaternion from a 4x4 rotation matrix and stores it in the output parameter.
   * The output quaternion is left untouched when the rotation cannot be extracted.
   *
   * @param mat - The 4x4 matrix containing rotation information
   * @param out - The output quaternion to store the result
   * @returns True if the quaternion could be extracted, false otherwise
   */
  static tryFromMatrixTo(mat: IMatrix44, out: IMutableQuaternion): boolean {
    return this.__fromMatrixToTypedArray(mat, out._v);
  }

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
  static fromMatrixTo(mat: IMatrix44, out: IMutableQuaternion): IMutableQuaternion {
    if (this.tryFromMatrixTo(mat, out)) {
      return out;
    }

    Logger.default.error(
      'the rotation cannot be extracted from the matrix (it is singular or contains non-finite values). Returning an identity quaternion instead.'
    );
    out._v[0] = 0;
    out._v[1] = 0;
    out._v[2] = 0;
    out._v[3] = 1;
    return out;
  }

  /**
   * Creates a quaternion that rotates from one direction to another.
   * @param fromDirection - The initial direction vector
   * @param toDirection - The target direction vector
   * @returns A quaternion representing the rotation from fromDirection to toDirection
   */
  static lookFromTo(fromDirection: IVector3, toDirection: IVector3): IQuaternion {
    if (fromDirection.isEqual(toDirection)) {
      return this.fromCopy4(0, 0, 0, 1) as IQuaternion;
    }
    return this.qlerp(this.lookForward(fromDirection), this.lookForward(toDirection), 1);
  }

  /**
   * Attempts to create a quaternion that looks in the specified forward direction using default up vector (0, 1, 0).
   * @param forward - The forward direction vector
   * @returns A quaternion representing the look rotation, or null if the direction is degenerate
   */
  static tryLookForward(forward: IVector3): Quaternion | null {
    if (this.__tmp_upVec == null) {
      this.__tmp_upVec = new (forward.constructor as any)(0, 1, 0);
    }

    return this.tryLookForwardAccordingToThisUp(forward, this.__tmp_upVec);
  }

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
  static lookForward(forward: IVector3): Quaternion {
    const quat = this.tryLookForward(forward);
    if (quat !== null) {
      return quat;
    }

    Logger.default.error('the forward direction has zero length. Returning an identity quaternion instead.');
    return this.fromCopy4(0, 0, 0, 1);
  }

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
  static tryLookForwardAccordingToThisUp(forward: IVector3, up: IVector3): Quaternion | null {
    const forwardLength = forward.length();
    const upLength = up.length();
    if (!Number.isFinite(forwardLength) || !Number.isFinite(upLength) || forwardLength === 0 || upLength === 0) {
      return null;
    }

    const forwardX = forward._v[0] / forwardLength;
    const forwardY = forward._v[1] / forwardLength;
    const forwardZ = forward._v[2] / forwardLength;

    const upX = up._v[0] / upLength;
    const upY = up._v[1] / upLength;
    const upZ = up._v[2] / upLength;

    // Vector3.cross(up, forward)
    let rightX = up._v[1] * forward._v[2] - up._v[2] * forward._v[1];
    let rightY = up._v[2] * forward._v[0] - up._v[0] * forward._v[2];
    let rightZ = up._v[0] * forward._v[1] - up._v[1] * forward._v[0];

    const rightLength = Math.hypot(rightX, rightY, rightZ);
    if (!Number.isFinite(rightLength) || rightLength === 0) {
      return null;
    }
    rightX /= rightLength;
    rightY /= rightLength;
    rightZ /= rightLength;

    const m00 = rightX;
    const m01 = rightY;
    const m02 = rightZ;
    const m10 = upX;
    const m11 = upY;
    const m12 = upZ;
    const m20 = forwardX;
    const m21 = forwardY;
    const m22 = forwardZ;

    const num8 = m00 + m11 + m22;
    if (num8 > 0) {
      const num = Math.sqrt(num8 + 1);
      const num2 = 0.5 / num;
      return this.fromCopy4((m12 - m21) * num2, (m20 - m02) * num2, (m01 - m10) * num2, num * 0.5);
    }
    if (m00 >= m11 && m00 >= m22) {
      const num7 = Math.sqrt(1 + m00 - m11 - m22);
      const num4 = 0.5 / num7;
      return this.fromCopy4(0.5 * num7, (m01 + m10) * num4, (m02 + m20) * num4, (m12 - m21) * num4);
    }
    if (m11 > m22) {
      const num6 = Math.sqrt(1 + m11 - m00 - m22);
      const num3 = 0.5 / num6;
      return this.fromCopy4((m10 + m01) * num3, 0.5 * num6, (m21 + m12) * num3, (m20 - m02) * num3);
    }
    const num5 = Math.sqrt(1 + m22 - m00 - m11);
    const num2 = 0.5 / num5;
    return this.fromCopy4((m20 + m02) * num2, (m21 + m12) * num2, 0.5 * num5, (m01 - m10) * num2);
  }

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
  static lookForwardAccordingToThisUp(forward: IVector3, up: IVector3): IQuaternion {
    const quat = this.tryLookForwardAccordingToThisUp(forward, up);
    if (quat !== null) {
      return quat;
    }

    Logger.default.error(
      'the forward/up directions are degenerate (zero length or parallel). Returning an identity quaternion instead.'
    );
    return this.fromCopy4(0, 0, 0, 1);
  }

  /**
   * Creates a quaternion from a position vector, with w component set to 0.
   * This is useful for representing pure translations in quaternion form.
   * @param vec - The position vector
   * @returns A quaternion with xyz from the vector and w=0
   */
  static fromPosition(vec: IVector3) {
    return this.fromCopy4(vec._v[0], vec._v[1], vec._v[2], 0);
  }

  /**
   * Adds two quaternions component-wise.
   * @param l_quat - The left quaternion
   * @param r_quat - The right quaternion
   * @returns The sum of the two quaternions
   */
  static add(l_quat: IQuaternion, r_quat: IQuaternion) {
    const x = l_quat._v[0] + r_quat._v[0];
    const y = l_quat._v[1] + r_quat._v[1];
    const z = l_quat._v[2] + r_quat._v[2];
    const w = l_quat._v[3] + r_quat._v[3];
    return this.fromCopy4(x, y, z, w);
  }

  /**
   * Adds two quaternions component-wise and stores the result in the output parameter.
   * @param l_quat - The left quaternion
   * @param r_quat - The right quaternion
   * @param out - The output quaternion to store the result
   * @returns The output quaternion containing the sum
   */
  static addTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion) {
    out._v[0] = l_quat._v[0] + r_quat._v[0];
    out._v[1] = l_quat._v[1] + r_quat._v[1];
    out._v[2] = l_quat._v[2] + r_quat._v[2];
    out._v[3] = l_quat._v[3] + r_quat._v[3];
    return out;
  }

  /**
   * Subtracts the right quaternion from the left quaternion component-wise.
   * @param l_quat - The left quaternion
   * @param r_quat - The right quaternion
   * @returns The difference of the two quaternions
   */
  static subtract(l_quat: IQuaternion, r_quat: IQuaternion) {
    const x = l_quat._v[0] - r_quat._v[0];
    const y = l_quat._v[1] - r_quat._v[1];
    const z = l_quat._v[2] - r_quat._v[2];
    const w = l_quat._v[3] - r_quat._v[3];
    return this.fromCopy4(x, y, z, w);
  }

  /**
   * Subtracts two quaternions component-wise and stores the result in the output parameter.
   * @param l_quat - The left quaternion
   * @param r_quat - The right quaternion
   * @param out - The output quaternion to store the result
   * @returns The output quaternion containing the difference
   */
  static subtractTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion) {
    out._v[0] = l_quat._v[0] - r_quat._v[0];
    out._v[1] = l_quat._v[1] - r_quat._v[1];
    out._v[2] = l_quat._v[2] - r_quat._v[2];
    out._v[3] = l_quat._v[3] - r_quat._v[3];
    return out;
  }

  /**
   * Multiplies two quaternions using Hamilton's quaternion multiplication.
   * This combines the rotations represented by both quaternions.
   * Note: Quaternion multiplication is not commutative (order matters).
   * @param l_quat - The left quaternion
   * @param r_quat - The right quaternion
   * @returns The product of the two quaternions
   */
  static multiply(l_quat: IQuaternion, r_quat: IQuaternion) {
    const x =
      r_quat._v[3] * l_quat._v[0] +
      r_quat._v[2] * l_quat._v[1] -
      r_quat._v[1] * l_quat._v[2] +
      r_quat._v[0] * l_quat._v[3];
    const y =
      -r_quat._v[2] * l_quat._v[0] +
      r_quat._v[3] * l_quat._v[1] +
      r_quat._v[0] * l_quat._v[2] +
      r_quat._v[1] * l_quat._v[3];
    const z =
      r_quat._v[1] * l_quat._v[0] -
      r_quat._v[0] * l_quat._v[1] +
      r_quat._v[3] * l_quat._v[2] +
      r_quat._v[2] * l_quat._v[3];
    const w =
      -r_quat._v[0] * l_quat._v[0] -
      r_quat._v[1] * l_quat._v[1] -
      r_quat._v[2] * l_quat._v[2] +
      r_quat._v[3] * l_quat._v[3];
    return this.fromCopy4(x, y, z, w);
  }

  /**
   * Multiplies two quaternions and stores the result in the output parameter.
   * @param l_quat - The left quaternion
   * @param r_quat - The right quaternion
   * @param out - The output quaternion to store the result
   * @returns The output quaternion containing the product
   */
  static multiplyTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion) {
    const x =
      r_quat._v[3] * l_quat._v[0] +
      r_quat._v[2] * l_quat._v[1] -
      r_quat._v[1] * l_quat._v[2] +
      r_quat._v[0] * l_quat._v[3];
    const y =
      -r_quat._v[2] * l_quat._v[0] +
      r_quat._v[3] * l_quat._v[1] +
      r_quat._v[0] * l_quat._v[2] +
      r_quat._v[1] * l_quat._v[3];
    const z =
      r_quat._v[1] * l_quat._v[0] -
      r_quat._v[0] * l_quat._v[1] +
      r_quat._v[3] * l_quat._v[2] +
      r_quat._v[2] * l_quat._v[3];
    const w =
      -r_quat._v[0] * l_quat._v[0] -
      r_quat._v[1] * l_quat._v[1] -
      r_quat._v[2] * l_quat._v[2] +
      r_quat._v[3] * l_quat._v[3];
    return out.setComponents(x, y, z, w);
  }

  /**
   * Multiplies a quaternion by a scalar value.
   * @param quat - The quaternion to multiply
   * @param value - The scalar value to multiply by
   * @returns A new quaternion with all components multiplied by the scalar
   */
  static multiplyNumber(quat: IQuaternion, value: number) {
    const x = quat._v[0] * value;
    const y = quat._v[1] * value;
    const z = quat._v[2] * value;
    const w = quat._v[3] * value;
    return this.fromCopy4(x, y, z, w);
  }

  /**
   * Multiplies a quaternion by a scalar and stores the result in the output parameter.
   * @param quat - The quaternion to multiply
   * @param value - The scalar value to multiply by
   * @param out - The output quaternion to store the result
   * @returns The output quaternion containing the scaled result
   */
  static multiplyNumberTo(quat: IQuaternion, value: number, out: IMutableQuaternion) {
    out._v[0] = quat._v[0] * value;
    out._v[1] = quat._v[1] * value;
    out._v[2] = quat._v[2] * value;
    out._v[3] = quat._v[3] * value;
    return out;
  }

  /**
   * Divides a quaternion by a scalar value.
   * If the divisor is zero, all components are set to 0 and an error is logged
   * instead of producing `Infinity`/`NaN`.
   *
   * @param quat - The quaternion to divide
   * @param value - The scalar value to divide by
   * @returns A new quaternion with all components divided by the scalar
   */
  static divideNumber(quat: IQuaternion, value: number) {
    if (value === 0) {
      Logger.default.error('0 division occurred! The result is set to zero.');
      return this.fromCopy4(0, 0, 0, 0);
    }
    return this.fromCopy4(quat._v[0] / value, quat._v[1] / value, quat._v[2] / value, quat._v[3] / value);
  }

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
  static divideNumberTo(quat: IQuaternion, value: number, out: IMutableQuaternion) {
    if (value === 0) {
      Logger.default.error('0 division occurred! The result is set to zero.');
      out._v[0] = 0;
      out._v[1] = 0;
      out._v[2] = 0;
      out._v[3] = 0;
      return out;
    }
    out._v[0] = quat._v[0] / value;
    out._v[1] = quat._v[1] / value;
    out._v[2] = quat._v[2] / value;
    out._v[3] = quat._v[3] / value;
    return out;
  }

  /**
   * Converts the quaternion to a string representation.
   * @returns A string in the format "(x, y, z, w)"
   */
  toString() {
    return `(${this._v[0]}, ${this._v[1]}, ${this._v[2]}, ${this._v[3]})`;
  }

  /**
   * Converts the quaternion to an approximately formatted string using financial precision.
   * @returns A formatted string with components separated by spaces and ending with newline
   */
  toStringApproximately() {
    return `${MathUtil.financial(this._v[0])} ${MathUtil.financial(this._v[1])} ${MathUtil.financial(this._v[2])} ${MathUtil.financial(this._v[3])}\n`;
  }

  /**
   * Converts the quaternion to a flat array representation.
   * @returns An array containing [x, y, z, w] components
   */
  flattenAsArray() {
    return [this._v[0], this._v[1], this._v[2], this._v[3]];
  }

  /**
   * Checks if this quaternion is a dummy (uninitialized) quaternion.
   * @returns True if the internal array has zero length, false otherwise
   */
  isDummy() {
    if (this._v.length === 0) {
      return true;
    }
    return false;
  }

  /**
   * Checks if this quaternion is approximately equal to another quaternion within a tolerance.
   * @param quat - The quaternion to compare with
   * @param delta - The tolerance value (default: Number.EPSILON)
   * @returns True if all components are within the tolerance, false otherwise
   */
  isEqual(quat: IQuaternion, delta: number = Number.EPSILON) {
    if (
      Math.abs(quat._v[0] - this._v[0]) < delta &&
      Math.abs(quat._v[1] - this._v[1]) < delta &&
      Math.abs(quat._v[2] - this._v[2]) < delta &&
      Math.abs(quat._v[3] - this._v[3]) < delta
    ) {
      return true;
    }
    return false;
  }

  /**
   * Checks if this quaternion is exactly equal to another quaternion.
   * @param quat - The quaternion to compare with
   * @returns True if all components are exactly equal, false otherwise
   */
  isStrictEqual(quat: IQuaternion): boolean {
    if (
      this._v[0] === quat._v[0] &&
      this._v[1] === quat._v[1] &&
      this._v[2] === quat._v[2] &&
      this._v[3] === quat._v[3]
    ) {
      return true;
    }
    return false;
  }

  /**
   * Converts the quaternion to Euler angles and stores the result in the output vector.
   * The rotation order is XYZ (roll, pitch, yaw).
   * @param out - The output vector to store the Euler angles [x, y, z]
   * @returns The output vector containing the Euler angles in radians
   */
  toEulerAnglesTo(out: IMutableVector3) {
    const t0 = 2 * (this._v[3] * this._v[0] + this._v[1] * this._v[2]);
    const t1 = 1 - 2 * (this._v[0] * this._v[0] + this._v[1] * this._v[1]);
    out._v[0] = Math.atan2(t0, t1);

    let t2 = 2 * (this._v[3] * this._v[1] - this._v[2] * this._v[0]);
    t2 = t2 > 1 ? 1 : t2;
    t2 = t2 < -1 ? -1 : t2;
    out._v[1] = Math.asin(t2);

    const t3 = 2 * (this._v[3] * this._v[2] + this._v[0] * this._v[1]);
    const t4 = 1 - 2 * (this._v[1] * this._v[1] + this._v[2] * this._v[2]);
    out._v[2] = Math.atan2(t3, t4);

    return out;
  }

  /**
   * Converts the quaternion to Euler angles.
   * The rotation order is XYZ (roll, pitch, yaw).
   * @returns A new Vector3 containing the Euler angles in radians
   */
  toEulerAngles() {
    const out = new Vector3(new Float32Array(3));
    const t0 = 2 * (this._v[3] * this._v[0] + this._v[1] * this._v[2]);
    const t1 = 1 - 2 * (this._v[0] * this._v[0] + this._v[1] * this._v[1]);
    out._v[0] = Math.atan2(t0, t1);

    let t2 = 2 * (this._v[3] * this._v[1] - this._v[2] * this._v[0]);
    t2 = t2 > 1 ? 1 : t2;
    t2 = t2 < -1 ? -1 : t2;
    out._v[1] = Math.asin(t2);

    const t3 = 2 * (this._v[3] * this._v[2] + this._v[0] * this._v[1]);
    const t4 = 1 - 2 * (this._v[1] * this._v[1] + this._v[2] * this._v[2]);
    out._v[2] = Math.atan2(t3, t4);

    return out;
  }

  /**
   * Private helper method for dividing a quaternion by a scalar value.
   * @param vec - The quaternion to divide
   * @param value - The scalar value to divide by
   * @returns A new quaternion with divided components, or zero components if division by zero
   */
  private static _divide(vec: IQuaternion, value: number) {
    let x: number;
    let y: number;
    let z: number;
    let w: number;
    if (value !== 0) {
      x = vec._v[0] / value;
      y = vec._v[1] / value;
      z = vec._v[2] / value;
      w = vec._v[3] / value;
    } else {
      Logger.default.error('0 division occurred! The result is set to zero.');
      x = 0;
      y = 0;
      z = 0;
      w = 0;
    }
    return this.fromCopy4(x, y, z, w);
  }

  /**
   * Private helper method for dividing a quaternion by a scalar and storing the result.
   * @param vec - The quaternion to divide
   * @param value - The scalar value to divide by
   * @param out - The output quaternion to store the result
   * @returns The output quaternion with divided components
   */
  private static _divideTo(vec: IQuaternion, value: number, out: IMutableQuaternion) {
    let x: number;
    let y: number;
    let z: number;
    let w: number;
    if (value !== 0) {
      x = vec._v[0] / value;
      y = vec._v[1] / value;
      z = vec._v[2] / value;
      w = vec._v[3] / value;
    } else {
      Logger.default.error('0 division occurred! The result is set to zero.');
      x = 0;
      y = 0;
      z = 0;
      w = 0;
    }
    out._v[0] = x;
    out._v[1] = y;
    out._v[2] = z;
    out._v[3] = w;
    return out;
  }

  /**
   * Normalizes a quaternion to unit length.
   * A zero-length quaternion is normalized to the identity quaternion (an error
   * is logged) instead of becoming `Infinity`/`NaN`.
   * @param vec - The quaternion to normalize
   * @returns A new normalized quaternion
   */
  static normalize(vec: IQuaternion): Quaternion {
    const length = vec.length();
    if (length === 0) {
      Logger.default.error('cannot normalize a zero-length quaternion. Returning an identity quaternion instead.');
      return this.fromCopy4(0, 0, 0, 1);
    }
    return this._divide(vec, length);
  }

  /**
   * Normalizes a quaternion to unit length and stores the result in the output parameter.
   * @param vec - The quaternion to normalize
   * @param out - The output quaternion to store the result
   * @returns The output quaternion containing the normalized result
   */
  static normalizeTo(vec: IQuaternion, out: IMutableQuaternion): IMutableQuaternion {
    const length = vec.length();
    if (length === 0) {
      Logger.default.error('cannot normalize a zero-length quaternion. The output is set to the identity quaternion.');
      out._v[0] = 0;
      out._v[1] = 0;
      out._v[2] = 0;
      out._v[3] = 1;
      return out;
    }
    return this._divideTo(vec, length, out);
  }

  /**
   * Creates a quaternion representing the rotation from one vector to another.
   * This is an instance method version of the static fromToRotation.
   * @param from - The starting direction vector
   * @param to - The target direction vector
   * @returns The normalized quaternion representing the rotation
   */
  fromToRotation(from: IVector3, to: IVector3) {
    const v0 = MutableVector3.fromCopyVector3(from);
    const v1 = MutableVector3.fromCopyVector3(to);
    v0.normalize();
    v1.normalize();
    const d = v0.dot(v1);
    if (d > -1.0 + Number.EPSILON) {
      const s = Math.sqrt((1.0 + d) * 2.0);
      const invs = 1.0 / s;
      const c = Vector3.multiply(v0.cross(v1), invs);
      this._v[0] = c.x;
      this._v[1] = c.y;
      this._v[2] = c.z;
      this._v[3] = s * 0.5;
      return (this.constructor as any).normalize(this);
    }
    let axis = Vector3.fromCopy3(0, 1, 0);
    let axis2 = v0.cross(axis);
    if (axis2.length() < Number.EPSILON) {
      axis = Vector3.fromCopy3(1, 0, 0);
      axis2 = v0.cross(axis);
    }
    axis2.normalize();
    return (this.constructor as any).fromAxisAngle(axis2, Math.PI);
  }

  /**
   * Creates a quaternion representing the rotation from one vector to another (static version).
   * @param from - The starting direction vector
   * @param to - The target direction vector
   * @returns A normalized quaternion representing the rotation
   */
  static fromToRotation(from: IVector3, to: IVector3) {
    let r = Vector3.dot(from, to) + 1;

    if (r < Number.EPSILON) {
      r = 0;

      if (Math.abs(from.x) > Math.abs(from.z)) {
        const q = this.fromCopy4(-from.y, from.x, 0, r);
        return this.normalize(q);
      }
      const q = this.fromCopy4(0, -from.z, from.y, r);
      return this.normalize(q);
    }
    const q = this.fromCopy4(
      from.y * to.z - from.z * to.y,
      from.z * to.x - from.x * to.z,
      from.x * to.y - from.y * to.x,
      r
    );
    return this.normalize(q);
  }

  /**
   * Creates a quaternion representing the rotation from one vector to another and stores it in the output parameter.
   * @param from - The starting direction vector
   * @param to - The target direction vector
   * @param out - The output quaternion to store the result
   * @returns The output quaternion containing the normalized rotation
   */
  static fromToRotationTo(from: IVector3, to: IVector3, out: IMutableQuaternion) {
    let r = Vector3.dot(from, to) + 1;

    if (r < Number.EPSILON) {
      r = 0;

      if (Math.abs(from.x) > Math.abs(from.z)) {
        out._v[0] = -from.y;
        out._v[1] = from.x;
        out._v[2] = 0;
        out._v[3] = r;
        out.normalize();
        return out;
      }
      out._v[0] = 0;
      out._v[1] = -from.z;
      out._v[2] = from.y;
      out._v[3] = r;
      out.normalize();
      return out;
    }
    out._v[0] = from.y * to.z - from.z * to.y;
    out._v[1] = from.z * to.x - from.x * to.z;
    out._v[2] = from.x * to.y - from.y * to.x;
    out._v[3] = r;
    out.normalize();
    return out;
  }

  /**
   * Transforms a 3D vector by this quaternion rotation.
   * Applies the rotation represented by this quaternion to the input vector.
   * @param v - The vector to transform
   * @returns A new transformed vector
   */
  transformVector3(v: IVector3) {
    const u = Quaternion.__tmp_vec3_5;
    u.setComponents(this._v[0], this._v[1], this._v[2]);
    const uv = Vector3.cross(u, v);
    const uuv = Vector3.cross(u, uv);
    const uvw = Vector3.multiply(uv, this._v[3]);
    const uuv_uvw = Vector3.add(uuv, uvw);
    const uuv_uvw_2 = Vector3.multiply(uuv_uvw, 2);
    return Vector3.add(v, uuv_uvw_2);
  }

  /**
   * Transforms a 3D vector by this quaternion rotation and stores the result in the output parameter.
   * @param v - The vector to transform
   * @param out - The output vector to store the result
   * @returns The output vector containing the transformed result
   */
  transformVector3To(v: IVector3, out: IMutableVector3) {
    const u = Quaternion.__tmp_vec3_5;
    u.setComponents(this._v[0], this._v[1], this._v[2]);
    const uv = Vector3.crossTo(u, v, Quaternion.__tmp_vec3_0);
    const uuv = Vector3.crossTo(u, uv, Quaternion.__tmp_vec3_1);
    const uvw = Vector3.multiplyTo(uv, this._v[3], Quaternion.__tmp_vec3_2);
    const uuv_uvw = Vector3.addTo(uuv, uvw, Quaternion.__tmp_vec3_3);
    const uuv_uvw_2 = Vector3.multiplyTo(uuv_uvw, 2, Quaternion.__tmp_vec3_4);
    return Vector3.addTo(v, uuv_uvw_2, out);
  }

  /**
   * Transforms a 3D vector by the inverse of this quaternion rotation.
   * @param v - The vector to transform
   * @returns A new transformed vector
   */
  transformVector3Inverse(v: IVector3) {
    const inv = (this.constructor as any).invert(this);
    return inv.transformVector3(v);
  }

  /**
   * Creates a deep copy of this quaternion.
   * @returns A new quaternion with the same component values
   */
  clone(): this {
    return (this.constructor as any).fromCopy4(this._v[0], this._v[1], this._v[2], this._v[3]);
  }

  /**
   * Creates a quaternion that directly uses the given typed array (no copy).
   * @param array - The typed array containing quaternion components
   * @returns A new quaternion using the provided array
   */
  static fromTypedArray(array: TypedArray) {
    return new this(array);
  }

  /**
   * Creates a quaternion from a 4-element array.
   * @param array - The array containing [x, y, z, w] components
   * @returns A new quaternion with copied components
   */
  static fromCopyArray4(array: Array4<number>) {
    return new this(new this._type(array));
  }

  /**
   * Creates a quaternion from a variable-length array (taking first 4 elements).
   * @param array - The array containing quaternion components
   * @returns A new quaternion with the first 4 components copied
   */
  static fromCopyArray(array: Array<number>) {
    return new this(new this._type(array.slice(0, 4)));
  }

  /**
   * Creates a quaternion from individual component values.
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   * @param w - The w component
   * @returns A new quaternion with the specified components
   */
  static fromCopy4(x: number, y: number, z: number, w: number) {
    return new this(new this._type([x, y, z, w]));
  }

  /**
   * Creates a quaternion by copying from another quaternion.
   * @param quat - The quaternion to copy from
   * @returns A new quaternion with copied components
   */
  static fromCopyQuaternion(quat: IQuaternion) {
    const v = new this._type(4);
    v[0] = quat._v[0];
    v[1] = quat._v[1];
    v[2] = quat._v[2];
    v[3] = quat._v[3];
    return new this(v);
  }

  /**
   * Creates a quaternion by copying from a 4D vector.
   * @param vec - The 4D vector to copy from
   * @returns A new quaternion with components copied from the vector
   */
  static fromCopyVector4(vec: IVector4) {
    const v = new this._type(4);
    v[0] = vec._v[0];
    v[1] = vec._v[1];
    v[2] = vec._v[2];
    v[3] = vec._v[3];
    return new this(v);
  }

  /**
   * Creates a quaternion from a log quaternion representation.
   * @param x - The log quaternion to convert
   * @returns A new quaternion converted from log space
   */
  static fromCopyLogQuaternion(x: ILogQuaternion) {
    const length = Math.hypot(x._v[0], x._v[1], x._v[2]);
    const v = new this._type(4);
    if (length === 0) {
      // log(identity) = 0, so exp(0) is the identity quaternion.
      v[0] = 0;
      v[1] = 0;
      v[2] = 0;
      v[3] = 1;
      return new this(v);
    }
    const sin = Math.sin(length);
    v[0] = x._v[0] * (sin / length);
    v[1] = x._v[1] * (sin / length);
    v[2] = x._v[2] * (sin / length);
    v[3] = Math.cos(length);
    return new this(v);
  }

  /**
   * Creates a quaternion from an axis-angle representation.
   * @param axis - The rotation axis vector
   * @param rad - The rotation angle in radians
   * @returns A new quaternion representing the rotation
   */
  static fromAxisAngle(axis: IVector3, rad: number) {
    rad = rad * 0.5;
    const s = Math.sin(rad);
    return this.fromCopy4(s * axis.x, s * axis.y, s * axis.z, Math.cos(rad));
  }

  /**
   * Creates a quaternion from an axis-angle representation and stores it in the output parameter.
   * @param axis - The rotation axis vector
   * @param rad - The rotation angle in radians
   * @param out - The output quaternion to store the result
   * @returns The output quaternion containing the rotation
   */
  static fromAxisAngleTo(axis: IVector3, rad: number, out: IMutableQuaternion) {
    rad = rad * 0.5;
    const s = Math.sin(rad);
    out._v[0] = s * axis.x;
    out._v[1] = s * axis.y;
    out._v[2] = s * axis.z;
    out._v[3] = Math.cos(rad);
    return out;
  }

  /**
   * Gets the rotation angle (0 to π) represented by a quaternion.
   * @param q - The quaternion to analyze (assumed to be normalized)
   * @returns The rotation angle in radians
   */
  static getQuaternionAngle(q: IQuaternion) {
    // Assume q is normalized
    const wClamped = Math.max(-1.0, Math.min(1.0, q.w));
    return 2.0 * Math.acos(wClamped);
  }

  /**
   * Clamps the rotation angle of a quaternion to a maximum value.
   * If the quaternion's rotation angle exceeds thetaMax, it scales the rotation down.
   * @param quat - The quaternion to clamp
   * @param thetaMax - The maximum allowed rotation angle in radians
   * @returns A quaternion with rotation angle clamped to thetaMax
   */
  static clampRotation(quat: IQuaternion, thetaMax: number) {
    const theta = this.getQuaternionAngle(quat);
    if (theta <= thetaMax) {
      // Do nothing if already small enough
      return quat;
    }
    // Slerp from unit Q to q at the ratio of θmax/θ
    const t = thetaMax / theta;
    // Unit quaternion (no rotation)
    const qIdentity = this.fromCopy4(0.0, 0.0, 0.0, 1.0);
    // Interpolate from qIdentity (0 degrees) to q (θ degrees) and reduce to θmax
    return this.qlerp(qIdentity, quat, t);
  }
}

/**
 * Immutable quaternion with 32-bit float components.
 */
export class Quaternion extends Quaternion_<Float32ArrayConstructor> {
  /**
   * Creates a new Quaternion instance.
   * @param v - The typed array containing the quaternion components
   */
  constructor(v: TypedArray) {
    super(v, { type: Float32Array });
  }

  /**
   * identity
   */
  static identity(): Quaternion {
    return super.identity() as Quaternion;
  }

  /**
   * dummy
   */
  static dummy(): Quaternion {
    return super.dummy() as Quaternion;
  }

  /**
   * invert
   */
  static invert(quat: IQuaternion): Quaternion {
    return super.invert(quat) as Quaternion;
  }

  /**
   * invertTo
   */
  static invertTo(quat: IQuaternion, out: IMutableQuaternion): IMutableQuaternion {
    return super.invertTo(quat, out) as IMutableQuaternion;
  }

  /**
   * qlerp
   */
  static qlerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): Quaternion {
    return super.qlerp(l_quat, r_quat, ratio) as Quaternion;
  }

  /**
   * qlerpTo
   */
  static qlerpTo(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number, out: IMutableQuaternion): IMutableQuaternion {
    return super.qlerpTo(l_quat, r_quat, ratio, out) as IMutableQuaternion;
  }

  /**
   * lerp
   */
  static lerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): Quaternion {
    return super.lerp(l_quat, r_quat, ratio) as Quaternion;
  }

  /**
   * lerpTo
   */
  static lerpTo(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number, out: IMutableQuaternion): IMutableQuaternion {
    return super.lerpTo(l_quat, r_quat, ratio, out) as IMutableQuaternion;
  }

  /**
   * tryAxisAngle
   */
  static tryAxisAngle(vec: IVector3, radian: number): Quaternion | null {
    return super.tryAxisAngle(vec, radian) as Quaternion | null;
  }

  /**
   * axisAngle
   */
  static axisAngle(vec: IVector3, radian: number): Quaternion {
    return super.axisAngle(vec, radian) as Quaternion;
  }

  /**
   * tryFromMatrix
   */
  static tryFromMatrix(mat: IMatrix44): Quaternion | null {
    return super.tryFromMatrix(mat) as Quaternion | null;
  }

  /**
   * fromMatrix
   */
  static fromMatrix(mat: IMatrix44): Quaternion {
    return super.fromMatrix(mat) as Quaternion;
  }

  /**
   * tryFromMatrixTo
   */
  static tryFromMatrixTo(mat: IMatrix44, out: IMutableQuaternion): boolean {
    return super.tryFromMatrixTo(mat, out) as boolean;
  }

  /**
   * fromMatrixTo
   */
  static fromMatrixTo(mat: IMatrix44, out: IMutableQuaternion): IMutableQuaternion {
    return super.fromMatrixTo(mat, out) as IMutableQuaternion;
  }

  /**
   * lookFromTo
   */
  static lookFromTo(fromDirection: IVector3, toDirection: IVector3): IMutableQuaternion {
    return super.lookFromTo(fromDirection, toDirection) as IMutableQuaternion;
  }

  /**
   * tryLookForward
   */
  static tryLookForward(forward: IVector3): Quaternion | null {
    return super.tryLookForward(forward) as Quaternion | null;
  }

  /**
   * lookForward
   */
  static lookForward(forward: IVector3): Quaternion {
    return super.lookForward(forward) as Quaternion;
  }

  /**
   * tryLookForwardAccordingToThisUp
   */
  static tryLookForwardAccordingToThisUp(forward: IVector3, up: IVector3): Quaternion | null {
    return super.tryLookForwardAccordingToThisUp(forward, up) as Quaternion | null;
  }

  /**
   * lookForwardAccordingToThisUp
   */
  static lookForwardAccordingToThisUp(forward: IVector3, up: IVector3): Quaternion {
    return super.lookForwardAccordingToThisUp(forward, up) as Quaternion;
  }

  /**
   * fromPosition
   */
  static fromPosition(vec: IVector3): Quaternion {
    return super.fromPosition(vec) as Quaternion;
  }

  /**
   * add
   */
  static add(l_quat: IQuaternion, r_quat: IQuaternion): Quaternion {
    return super.add(l_quat, r_quat) as Quaternion;
  }

  /**
   * addTo
   */
  static addTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion): IMutableQuaternion {
    return super.addTo(l_quat, r_quat, out) as IMutableQuaternion;
  }

  /**
   * subtract
   */
  static subtract(l_quat: IQuaternion, r_quat: IQuaternion): Quaternion {
    return super.subtract(l_quat, r_quat) as Quaternion;
  }

  /**
   * subtractTo
   */
  static subtractTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion): IMutableQuaternion {
    return super.subtractTo(l_quat, r_quat, out) as IMutableQuaternion;
  }

  /**
   * multiply
   */
  static multiply(l_quat: IQuaternion, r_quat: IQuaternion): Quaternion {
    return super.multiply(l_quat, r_quat) as Quaternion;
  }

  /**
   * multiplyTo
   */
  static multiplyTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion): IMutableQuaternion {
    return super.multiplyTo(l_quat, r_quat, out) as IMutableQuaternion;
  }

  /**
   * multiplyNumber
   */
  static multiplyNumber(quat: IQuaternion, value: number): Quaternion {
    return super.multiplyNumber(quat, value) as Quaternion;
  }

  /**
   * multiplyNumberTo
   */
  static multiplyNumberTo(quat: IQuaternion, value: number, out: IMutableQuaternion): IMutableQuaternion {
    return super.multiplyNumberTo(quat, value, out) as IMutableQuaternion;
  }

  /**
   * divideNumber
   */
  static divideNumber(quat: IQuaternion, value: number): Quaternion {
    return super.divideNumber(quat, value) as Quaternion;
  }

  /**
   * divideNumberTo
   */
  static divideNumberTo(quat: IQuaternion, value: number, out: IMutableQuaternion): IMutableQuaternion {
    return super.divideNumberTo(quat, value, out) as IMutableQuaternion;
  }

  /**
   * normalize
   */
  static normalize(vec: IQuaternion): Quaternion {
    return super.normalize(vec) as Quaternion;
  }

  /**
   * normalizeTo
   */
  static normalizeTo(vec: IQuaternion, out: IMutableQuaternion): IMutableQuaternion {
    return super.normalizeTo(vec, out) as IMutableQuaternion;
  }

  /**
   * fromToRotation
   */
  static fromToRotation(from: IVector3, to: IVector3): Quaternion {
    return super.fromToRotation(from, to) as Quaternion;
  }

  /**
   * fromToRotationTo
   */
  static fromToRotationTo(from: IVector3, to: IVector3, out: IMutableQuaternion): IMutableQuaternion {
    return super.fromToRotationTo(from, to, out) as IMutableQuaternion;
  }

  /**
   * Creates a quaternion that directly uses the given Float32Array (no copy).
   */
  static fromFloat32Array(array: Float32Array): Quaternion {
    return super.fromTypedArray(array) as Quaternion;
  }

  /**
   * fromCopyArray4
   */
  static fromCopyArray4(array: Array4<number>): Quaternion {
    return super.fromCopyArray4(array) as Quaternion;
  }

  /**
   * fromCopyArray
   */
  static fromCopyArray(array: Array<number>): Quaternion {
    return super.fromCopyArray(array) as Quaternion;
  }

  /**
   * fromCopy4
   */
  static fromCopy4(x: number, y: number, z: number, w: number): Quaternion {
    return super.fromCopy4(x, y, z, w) as Quaternion;
  }

  /**
   * fromCopyQuaternion
   */
  static fromCopyQuaternion(quat: IQuaternion): Quaternion {
    return super.fromCopyQuaternion(quat) as Quaternion;
  }

  /**
   * fromCopyVector4
   */
  static fromCopyVector4(vec: IVector4): Quaternion {
    return super.fromCopyVector4(vec) as Quaternion;
  }

  /**
   * fromCopyLogQuaternion
   */
  static fromCopyLogQuaternion(x: ILogQuaternion): Quaternion {
    return super.fromCopyLogQuaternion(x) as Quaternion;
  }

  /**
   * fromAxisAngle
   */
  static fromAxisAngle(axis: IVector3, rad: number): Quaternion {
    return super.fromAxisAngle(axis, rad) as Quaternion;
  }

  /**
   * fromAxisAngleTo
   */
  static fromAxisAngleTo(axis: IVector3, rad: number, out: IMutableQuaternion): IMutableQuaternion {
    return super.fromAxisAngleTo(axis, rad, out) as IMutableQuaternion;
  }

  /**
   * getQuaternionAngle
   */
  static getQuaternionAngle(q: IQuaternion): number {
    return super.getQuaternionAngle(q) as number;
  }

  /**
   * clampRotation
   */
  static clampRotation(quat: IQuaternion, thetaMax: number): IQuaternion {
    return super.clampRotation(quat, thetaMax) as IQuaternion;
  }
}

/**
 * Immutable quaternion with 64-bit float components.
 */
export class QuaternionD extends Quaternion_<Float64ArrayConstructor> {
  /** The typed array constructor used for newly created quaternions. */
  protected static override readonly _type: FloatTypedArrayConstructor = Float64Array;

  /**
   * Creates a new QuaternionD instance.
   * @param v - The typed array containing the quaternion components
   */
  constructor(v: TypedArray) {
    super(v, { type: Float64Array });
  }

  /**
   * identity
   */
  static identity(): QuaternionD {
    return super.identity() as QuaternionD;
  }

  /**
   * dummy
   */
  static dummy(): QuaternionD {
    return super.dummy() as QuaternionD;
  }

  /**
   * invert
   */
  static invert(quat: IQuaternion): QuaternionD {
    return super.invert(quat) as QuaternionD;
  }

  /**
   * invertTo
   */
  static invertTo(quat: IQuaternion, out: IMutableQuaternion): IMutableQuaternion {
    return super.invertTo(quat, out) as IMutableQuaternion;
  }

  /**
   * qlerp
   */
  static qlerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): QuaternionD {
    return super.qlerp(l_quat, r_quat, ratio) as QuaternionD;
  }

  /**
   * qlerpTo
   */
  static qlerpTo(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number, out: IMutableQuaternion): IMutableQuaternion {
    return super.qlerpTo(l_quat, r_quat, ratio, out) as IMutableQuaternion;
  }

  /**
   * lerp
   */
  static lerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): QuaternionD {
    return super.lerp(l_quat, r_quat, ratio) as QuaternionD;
  }

  /**
   * lerpTo
   */
  static lerpTo(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number, out: IMutableQuaternion): IMutableQuaternion {
    return super.lerpTo(l_quat, r_quat, ratio, out) as IMutableQuaternion;
  }

  /**
   * tryAxisAngle
   */
  static tryAxisAngle(vec: IVector3, radian: number): QuaternionD | null {
    return super.tryAxisAngle(vec, radian) as QuaternionD | null;
  }

  /**
   * axisAngle
   */
  static axisAngle(vec: IVector3, radian: number): QuaternionD {
    return super.axisAngle(vec, radian) as QuaternionD;
  }

  /**
   * tryFromMatrix
   */
  static tryFromMatrix(mat: IMatrix44): QuaternionD | null {
    return super.tryFromMatrix(mat) as QuaternionD | null;
  }

  /**
   * fromMatrix
   */
  static fromMatrix(mat: IMatrix44): QuaternionD {
    return super.fromMatrix(mat) as QuaternionD;
  }

  /**
   * tryFromMatrixTo
   */
  static tryFromMatrixTo(mat: IMatrix44, out: IMutableQuaternion): boolean {
    return super.tryFromMatrixTo(mat, out) as boolean;
  }

  /**
   * fromMatrixTo
   */
  static fromMatrixTo(mat: IMatrix44, out: IMutableQuaternion): IMutableQuaternion {
    return super.fromMatrixTo(mat, out) as IMutableQuaternion;
  }

  /**
   * lookFromTo
   */
  static lookFromTo(fromDirection: IVector3, toDirection: IVector3): IMutableQuaternion {
    return super.lookFromTo(fromDirection, toDirection) as IMutableQuaternion;
  }

  /**
   * tryLookForward
   */
  static tryLookForward(forward: IVector3): QuaternionD | null {
    return super.tryLookForward(forward) as QuaternionD | null;
  }

  /**
   * lookForward
   */
  static lookForward(forward: IVector3): QuaternionD {
    return super.lookForward(forward) as QuaternionD;
  }

  /**
   * tryLookForwardAccordingToThisUp
   */
  static tryLookForwardAccordingToThisUp(forward: IVector3, up: IVector3): QuaternionD | null {
    return super.tryLookForwardAccordingToThisUp(forward, up) as QuaternionD | null;
  }

  /**
   * lookForwardAccordingToThisUp
   */
  static lookForwardAccordingToThisUp(forward: IVector3, up: IVector3): QuaternionD {
    return super.lookForwardAccordingToThisUp(forward, up) as QuaternionD;
  }

  /**
   * fromPosition
   */
  static fromPosition(vec: IVector3): QuaternionD {
    return super.fromPosition(vec) as QuaternionD;
  }

  /**
   * add
   */
  static add(l_quat: IQuaternion, r_quat: IQuaternion): QuaternionD {
    return super.add(l_quat, r_quat) as QuaternionD;
  }

  /**
   * addTo
   */
  static addTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion): IMutableQuaternion {
    return super.addTo(l_quat, r_quat, out) as IMutableQuaternion;
  }

  /**
   * subtract
   */
  static subtract(l_quat: IQuaternion, r_quat: IQuaternion): QuaternionD {
    return super.subtract(l_quat, r_quat) as QuaternionD;
  }

  /**
   * subtractTo
   */
  static subtractTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion): IMutableQuaternion {
    return super.subtractTo(l_quat, r_quat, out) as IMutableQuaternion;
  }

  /**
   * multiply
   */
  static multiply(l_quat: IQuaternion, r_quat: IQuaternion): QuaternionD {
    return super.multiply(l_quat, r_quat) as QuaternionD;
  }

  /**
   * multiplyTo
   */
  static multiplyTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion): IMutableQuaternion {
    return super.multiplyTo(l_quat, r_quat, out) as IMutableQuaternion;
  }

  /**
   * multiplyNumber
   */
  static multiplyNumber(quat: IQuaternion, value: number): QuaternionD {
    return super.multiplyNumber(quat, value) as QuaternionD;
  }

  /**
   * multiplyNumberTo
   */
  static multiplyNumberTo(quat: IQuaternion, value: number, out: IMutableQuaternion): IMutableQuaternion {
    return super.multiplyNumberTo(quat, value, out) as IMutableQuaternion;
  }

  /**
   * divideNumber
   */
  static divideNumber(quat: IQuaternion, value: number): QuaternionD {
    return super.divideNumber(quat, value) as QuaternionD;
  }

  /**
   * divideNumberTo
   */
  static divideNumberTo(quat: IQuaternion, value: number, out: IMutableQuaternion): IMutableQuaternion {
    return super.divideNumberTo(quat, value, out) as IMutableQuaternion;
  }

  /**
   * normalize
   */
  static normalize(vec: IQuaternion): QuaternionD {
    return super.normalize(vec) as QuaternionD;
  }

  /**
   * normalizeTo
   */
  static normalizeTo(vec: IQuaternion, out: IMutableQuaternion): IMutableQuaternion {
    return super.normalizeTo(vec, out) as IMutableQuaternion;
  }

  /**
   * fromToRotation
   */
  static fromToRotation(from: IVector3, to: IVector3): QuaternionD {
    return super.fromToRotation(from, to) as QuaternionD;
  }

  /**
   * fromToRotationTo
   */
  static fromToRotationTo(from: IVector3, to: IVector3, out: IMutableQuaternion): IMutableQuaternion {
    return super.fromToRotationTo(from, to, out) as IMutableQuaternion;
  }

  /**
   * Creates a quaternion that directly uses the given Float64Array (no copy).
   */
  static fromFloat64Array(array: Float64Array): QuaternionD {
    return super.fromTypedArray(array) as QuaternionD;
  }

  /**
   * fromCopyArray4
   */
  static fromCopyArray4(array: Array4<number>): QuaternionD {
    return super.fromCopyArray4(array) as QuaternionD;
  }

  /**
   * fromCopyArray
   */
  static fromCopyArray(array: Array<number>): QuaternionD {
    return super.fromCopyArray(array) as QuaternionD;
  }

  /**
   * fromCopy4
   */
  static fromCopy4(x: number, y: number, z: number, w: number): QuaternionD {
    return super.fromCopy4(x, y, z, w) as QuaternionD;
  }

  /**
   * fromCopyQuaternion
   */
  static fromCopyQuaternion(quat: IQuaternion): QuaternionD {
    return super.fromCopyQuaternion(quat) as QuaternionD;
  }

  /**
   * fromCopyVector4
   */
  static fromCopyVector4(vec: IVector4): QuaternionD {
    return super.fromCopyVector4(vec) as QuaternionD;
  }

  /**
   * fromCopyLogQuaternion
   */
  static fromCopyLogQuaternion(x: ILogQuaternion): QuaternionD {
    return super.fromCopyLogQuaternion(x) as QuaternionD;
  }

  /**
   * fromAxisAngle
   */
  static fromAxisAngle(axis: IVector3, rad: number): QuaternionD {
    return super.fromAxisAngle(axis, rad) as QuaternionD;
  }

  /**
   * fromAxisAngleTo
   */
  static fromAxisAngleTo(axis: IVector3, rad: number, out: IMutableQuaternion): IMutableQuaternion {
    return super.fromAxisAngleTo(axis, rad, out) as IMutableQuaternion;
  }

  /**
   * getQuaternionAngle
   */
  static getQuaternionAngle(q: IQuaternion): number {
    return super.getQuaternionAngle(q) as number;
  }

  /**
   * clampRotation
   */
  static clampRotation(quat: IQuaternion, thetaMax: number): IQuaternion {
    return super.clampRotation(quat, thetaMax) as IQuaternion;
  }
}

/**
 * Alias for the 32-bit (Float32Array) implementation, making the precision explicit.
 */
export { Quaternion as QuaternionF };
