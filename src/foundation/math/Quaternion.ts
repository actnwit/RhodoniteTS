import { type Array4, TypedArray } from '../../types/CommonTypes';
import { CompositionType } from '../definitions/CompositionType';
import { Logger } from '../misc/Logger';
import { AbstractQuaternion } from './AbstractQuaternion';
import type { IMatrix44 } from './IMatrix';
import type { ILogQuaternion, IMutableQuaternion, IQuaternion } from './IQuaternion';
import { IVector2, type IVector3, type IVector4 } from './IVector';
import type { IMutableVector3 } from './IVector';
import { LogQuaternion } from './LogQuaternion';
import { MathUtil } from './MathUtil';
import { Matrix44 } from './Matrix44';
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
export class Quaternion extends AbstractQuaternion implements IQuaternion {
  private static __tmp_upVec: any = undefined;
  private static __tmp_vec3_0: any = MutableVector3.zero();
  private static __tmp_vec3_1: any = MutableVector3.zero();
  private static __tmp_vec3_2: any = MutableVector3.zero();
  private static __tmp_vec3_3: any = MutableVector3.zero();
  private static __tmp_vec3_4: any = MutableVector3.zero();
  private static __tmp_vec3_5: any = MutableVector3.zero();

  /**
   * Creates a new Quaternion instance.
   * @param x - The Float32Array containing the quaternion components [x, y, z, w]
   */
  constructor(x: Float32Array) {
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
    return Quaternion.fromCopy4(0, 0, 0, 1);
  }

  /**
   * Creates a dummy quaternion with zero-length internal array.
   * Used as a placeholder or uninitialized quaternion.
   * @returns A new dummy quaternion
   */
  static dummy() {
    return new this(new Float32Array(0));
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
      return Quaternion.fromCopy4(0, 0, 0, 0) as IQuaternion;
    }

    const x = -quat._v[0] / norm;
    const y = -quat._v[1] / norm;
    const z = -quat._v[2] / norm;
    const w = quat._v[3] / norm;
    return Quaternion.fromCopy4(x, y, z, w) as IQuaternion;
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

    return Quaternion.fromCopy4(x, y, z, w) as IQuaternion;
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
    return Quaternion.fromCopy4(x, y, z, w);
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
   * Creates a quaternion from an axis-angle representation.
   * @param vec - The rotation axis (will be normalized internally)
   * @param radian - The rotation angle in radians
   * @returns A quaternion representing the rotation around the given axis
   */
  static axisAngle(vec: IVector3, radian: number) {
    const halfAngle = 0.5 * radian;
    const sin = Math.sin(halfAngle);

    const length = vec.length();
    if (length === 0) {
      Logger.error('0 division occurred!');
    }

    return Quaternion.fromCopy4(
      (sin * vec._v[0]) / length,
      (sin * vec._v[1]) / length,
      (sin * vec._v[2]) / length,
      Math.cos(halfAngle)
    );
  }

  /**
   * Creates a quaternion from a 4x4 rotation matrix.
   * Extracts the rotation component from the matrix and converts it to quaternion form.
   * @param mat - The 4x4 matrix containing rotation information
   * @returns A quaternion representing the same rotation as the matrix
   */
  static fromMatrix(mat: IMatrix44) {
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
      const x = (m.m21 - m.m12) * S;
      const y = (m.m02 - m.m20) * S;
      const z = (m.m10 - m.m01) * S;
      const w = 0.25 / S;
      return Quaternion.fromCopy4(x, y, z, w);
    }
    if (m.m00 > m.m11 && m.m00 > m.m22) {
      const S = Math.sqrt(1.0 + m.m00 - m.m11 - m.m22) * 2;
      const x = 0.25 * S;
      const y = (m.m01 + m.m10) / S;
      const z = (m.m02 + m.m20) / S;
      const w = (m.m21 - m.m12) / S;
      return Quaternion.fromCopy4(x, y, z, w);
    }
    if (m.m11 > m.m22) {
      const S = Math.sqrt(1.0 + m.m11 - m.m00 - m.m22) * 2;
      const x = (m.m01 + m.m10) / S;
      const y = 0.25 * S;
      const z = (m.m12 + m.m21) / S;
      const w = (m.m02 - m.m20) / S;
      return Quaternion.fromCopy4(x, y, z, w);
    }
    const S = Math.sqrt(1.0 + m.m22 - m.m00 - m.m11) * 2;
    const x = (m.m02 + m.m20) / S;
    const y = (m.m12 + m.m21) / S;
    const z = 0.25 * S;
    const w = (m.m10 - m.m01) / S;
    return Quaternion.fromCopy4(x, y, z, w);
  }

  /**
   * Creates a quaternion from a 4x4 rotation matrix and stores it in the output parameter.
   * @param mat - The 4x4 matrix containing rotation information
   * @param out - The output quaternion to store the result
   * @returns The output quaternion containing the extracted rotation
   */
  static fromMatrixTo(mat: IMatrix44, out: IMutableQuaternion) {
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
      out._v[0] = (m.m21 - m.m12) * S;
      out._v[1] = (m.m02 - m.m20) * S;
      out._v[2] = (m.m10 - m.m01) * S;
      out._v[3] = 0.25 / S;
    } else if (m.m00 > m.m11 && m.m00 > m.m22) {
      const S = Math.sqrt(1.0 + m.m00 - m.m11 - m.m22) * 2;
      out._v[0] = 0.25 * S;
      out._v[1] = (m.m01 + m.m10) / S;
      out._v[2] = (m.m02 + m.m20) / S;
      out._v[3] = (m.m21 - m.m12) / S;
    } else if (m.m11 > m.m22) {
      const S = Math.sqrt(1.0 + m.m11 - m.m00 - m.m22) * 2;
      out._v[0] = (m.m01 + m.m10) / S;
      out._v[1] = 0.25 * S;
      out._v[2] = (m.m12 + m.m21) / S;
      out._v[3] = (m.m02 - m.m20) / S;
    } else {
      const S = Math.sqrt(1.0 + m.m22 - m.m00 - m.m11) * 2;
      out._v[0] = (m.m02 + m.m20) / S;
      out._v[1] = (m.m12 + m.m21) / S;
      out._v[2] = 0.25 * S;
      out._v[3] = (m.m10 - m.m01) / S;
    }

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
      return Quaternion.fromCopy4(0, 0, 0, 1) as IQuaternion;
    }
    return this.qlerp(this.lookForward(fromDirection), this.lookForward(toDirection), 1);
  }

  /**
   * Creates a quaternion that looks in the specified forward direction using default up vector (0, 1, 0).
   * @param forward - The forward direction vector
   * @returns A quaternion representing the look rotation
   */
  static lookForward(forward: IVector3) {
    if (Quaternion.__tmp_upVec == null) {
      Quaternion.__tmp_upVec = new (forward.constructor as any)(0, 1, 0);
    }

    return this.lookForwardAccordingToThisUp(forward, Quaternion.__tmp_upVec);
  }

  /**
   * Creates a quaternion that looks in the specified forward direction with a custom up vector.
   * @param forward - The forward direction vector
   * @param up - The up direction vector
   * @returns A quaternion representing the look rotation with the specified up vector
   */
  static lookForwardAccordingToThisUp(forward: IVector3, up: IVector3): IQuaternion {
    const forwardLength = forward.length();
    if (forwardLength === 0) {
      Logger.error('0 division occurred!');
    }

    const forwardX = forward._v[0] / forwardLength;
    const forwardY = forward._v[1] / forwardLength;
    const forwardZ = forward._v[2] / forwardLength;

    const upLength = up.length();
    if (upLength === 0) {
      Logger.error('0 division occurred!');
    }

    const upX = up._v[0] / upLength;
    const upY = up._v[1] / upLength;
    const upZ = up._v[2] / upLength;

    // Vector3.cross(up, forward)
    let rightX = up._v[1] * forward._v[2] - up._v[2] * forward._v[1];
    let rightY = up._v[2] * forward._v[0] - up._v[0] * forward._v[2];
    let rightZ = up._v[0] * forward._v[1] - up._v[1] * forward._v[0];

    const rightLength = Math.hypot(rightX, rightY, rightZ);
    if (rightLength === 0) {
      Logger.error('0 division occurred!');
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
      return Quaternion.fromCopy4((m12 - m21) * num2, (m20 - m02) * num2, (m01 - m10) * num2, num * 0.5) as IQuaternion;
    }
    if (m00 >= m11 && m00 >= m22) {
      const num7 = Math.sqrt(1 + m00 - m11 - m22);
      const num4 = 0.5 / num7;
      return Quaternion.fromCopy4(
        0.5 * num7,
        (m01 + m10) * num4,
        (m02 + m20) * num4,
        (m12 - m21) * num4
      ) as IQuaternion;
    }
    if (m11 > m22) {
      const num6 = Math.sqrt(1 + m11 - m00 - m22);
      const num3 = 0.5 / num6;
      return Quaternion.fromCopy4(
        (m10 + m01) * num3,
        0.5 * num6,
        (m21 + m12) * num3,
        (m20 - m02) * num3
      ) as IQuaternion;
    }
    const num5 = Math.sqrt(1 + m22 - m00 - m11);
    const num2 = 0.5 / num5;
    return Quaternion.fromCopy4((m20 + m02) * num2, (m21 + m12) * num2, 0.5 * num5, (m01 - m10) * num2) as IQuaternion;
  }

  /**
   * Creates a quaternion from a position vector, with w component set to 0.
   * This is useful for representing pure translations in quaternion form.
   * @param vec - The position vector
   * @returns A quaternion with xyz from the vector and w=0
   */
  static fromPosition(vec: IVector3) {
    return Quaternion.fromCopy4(vec._v[0], vec._v[1], vec._v[2], 0);
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
    return Quaternion.fromCopy4(x, y, z, w);
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
    return Quaternion.fromCopy4(x, y, z, w);
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
    return Quaternion.fromCopy4(x, y, z, w);
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
    return Quaternion.fromCopy4(x, y, z, w);
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
   * @param quat - The quaternion to divide
   * @param value - The scalar value to divide by (must not be zero)
   * @returns A new quaternion with all components divided by the scalar
   */
  static divideNumber(quat: IQuaternion, value: number) {
    if (value === 0) {
      Logger.error('0 division occurred!');
    }
    const x = quat._v[0] / value;
    const y = quat._v[1] / value;
    const z = quat._v[2] / value;
    const w = quat._v[3] / value;
    return Quaternion.fromCopy4(x, y, z, w);
  }

  /**
   * Divides a quaternion by a scalar and stores the result in the output parameter.
   * @param quat - The quaternion to divide
   * @param value - The scalar value to divide by (must not be zero)
   * @param out - The output quaternion to store the result
   * @returns The output quaternion containing the divided result
   */
  static divideNumberTo(quat: IQuaternion, value: number, out: IMutableQuaternion) {
    if (value === 0) {
      Logger.error('0 division occurred!');
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
   * @returns A new quaternion with divided components, or Infinity components if division by zero
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
      Logger.error('0 division occurred!');
      x = Number.POSITIVE_INFINITY;
      y = Number.POSITIVE_INFINITY;
      z = Number.POSITIVE_INFINITY;
      w = Number.POSITIVE_INFINITY;
    }
    return Quaternion.fromCopy4(x, y, z, w);
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
      Logger.error('0 division occurred!');
      x = Number.POSITIVE_INFINITY;
      y = Number.POSITIVE_INFINITY;
      z = Number.POSITIVE_INFINITY;
      w = Number.POSITIVE_INFINITY;
    }
    out._v[0] = x;
    out._v[1] = y;
    out._v[2] = z;
    out._v[3] = w;
    return out;
  }

  /**
   * Normalizes a quaternion to unit length.
   * @param vec - The quaternion to normalize
   * @returns A new normalized quaternion
   */
  static normalize(vec: IQuaternion) {
    const length = vec.length();
    return this._divide(vec, length);
  }

  /**
   * Normalizes a quaternion to unit length and stores the result in the output parameter.
   * @param vec - The quaternion to normalize
   * @param out - The output quaternion to store the result
   * @returns The output quaternion containing the normalized result
   */
  static normalizeTo(vec: IQuaternion, out: IMutableQuaternion) {
    const length = vec.length();
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
      return Quaternion.normalize(this);
    }
    let axis = Vector3.fromCopy3(0, 1, 0);
    let axis2 = v0.cross(axis);
    if (axis2.length() < Number.EPSILON) {
      axis = Vector3.fromCopy3(1, 0, 0);
      axis2 = v0.cross(axis);
    }
    axis2.normalize();
    return Quaternion.fromAxisAngle(axis2, Math.PI);
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
        const q = Quaternion.fromCopy4(-from.y, from.x, 0, r);
        return Quaternion.normalize(q);
      }
      const q = Quaternion.fromCopy4(0, -from.z, from.y, r);
      return Quaternion.normalize(q);
    }
    const q = Quaternion.fromCopy4(
      from.y * to.z - from.z * to.y,
      from.z * to.x - from.x * to.z,
      from.x * to.y - from.y * to.x,
      r
    );
    return Quaternion.normalize(q);
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
    const inv = Quaternion.invert(this);
    return inv.transformVector3(v);
  }

  /**
   * Creates a deep copy of this quaternion.
   * @returns A new quaternion with the same component values
   */
  clone(): Quaternion {
    return Quaternion.fromCopy4(this._v[0], this._v[1], this._v[2], this._v[3]);
  }

  /**
   * Creates a quaternion from a Float32Array.
   * @param array - The Float32Array containing quaternion components
   * @returns A new quaternion using the provided array
   */
  static fromFloat32Array(array: Float32Array) {
    return new Quaternion(array);
  }

  /**
   * Creates a quaternion from a 4-element array.
   * @param array - The array containing [x, y, z, w] components
   * @returns A new quaternion with copied components
   */
  static fromCopyArray4(array: Array4<number>) {
    return new Quaternion(new Float32Array(array));
  }

  /**
   * Creates a quaternion from a variable-length array (taking first 4 elements).
   * @param array - The array containing quaternion components
   * @returns A new quaternion with the first 4 components copied
   */
  static fromCopyArray(array: Array<number>) {
    return new Quaternion(new Float32Array(array.slice(0, 4)));
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
    return new Quaternion(new Float32Array([x, y, z, w]));
  }

  /**
   * Creates a quaternion by copying from another quaternion.
   * @param quat - The quaternion to copy from
   * @returns A new quaternion with copied components
   */
  static fromCopyQuaternion(quat: IQuaternion) {
    const v = new Float32Array(4);
    v[0] = quat._v[0];
    v[1] = quat._v[1];
    v[2] = quat._v[2];
    v[3] = quat._v[3];
    return new Quaternion(v);
  }

  /**
   * Creates a quaternion by copying from a 4D vector.
   * @param vec - The 4D vector to copy from
   * @returns A new quaternion with components copied from the vector
   */
  static fromCopyVector4(vec: IVector4) {
    const v = new Float32Array(4);
    v[0] = vec._v[0];
    v[1] = vec._v[1];
    v[2] = vec._v[2];
    v[3] = vec._v[3];
    return new Quaternion(v);
  }

  /**
   * Creates a quaternion from a log quaternion representation.
   * @param x - The log quaternion to convert
   * @returns A new quaternion converted from log space
   */
  static fromCopyLogQuaternion(x: ILogQuaternion) {
    const theta = x._v[0] * x._v[0] + x._v[1] * x._v[1] + x._v[2] * x._v[2];
    const sin = Math.sin(theta);
    const v = new Float32Array(4);
    v[0] = x._v[0] * (sin / theta);
    v[1] = x._v[1] * (sin / theta);
    v[2] = x._v[2] * (sin / theta);
    v[3] = Math.cos(theta);
    return new Quaternion(v);
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
    return Quaternion.fromCopy4(s * axis.x, s * axis.y, s * axis.z, Math.cos(rad));
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
    const theta = Quaternion.getQuaternionAngle(quat);
    if (theta <= thetaMax) {
      // Do nothing if already small enough
      return quat;
    }
    // Slerp from unit Q to q at the ratio of θmax/θ
    const t = thetaMax / theta;
    // Unit quaternion (no rotation)
    const qIdentity = Quaternion.fromCopy4(0.0, 0.0, 0.0, 1.0);
    // Interpolate from qIdentity (0 degrees) to q (θ degrees) and reduce to θmax
    return Quaternion.qlerp(qIdentity, quat, t);
  }
}
