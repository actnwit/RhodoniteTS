// src/foundation/math/Quaternion.ts
import { CompositionType } from "../definitions/CompositionType.js";
import { Logger } from "../misc/Logger.js";
import { AbstractQuaternion } from "./AbstractQuaternion.js";
import { MathUtil } from "./MathUtil.js";
import { MutableMatrix44 } from "./MutableMatrix44.js";
import { MutableVector3 } from "./MutableVector3.js";
import { Vector3 } from "./Vector3.js";
var Quaternion_ = class extends AbstractQuaternion {
  /**
   * Creates a new Quaternion_ instance.
   * @param x - The typed array containing the quaternion components [x, y, z, w]
   * @param _options - Configuration object containing the typed array constructor
   */
  constructor(x, _options) {
    super();
    this._v = x;
  }
  /**
   * Gets the class name for debugging and reflection purposes.
   * @returns The string "Quaternion"
   */
  get className() {
    return "Quaternion";
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
  static invert(quat) {
    const norm = quat.length();
    if (norm === 0) {
      return this.fromCopy4(0, 0, 0, 0);
    }
    const x = -quat._v[0] / norm;
    const y = -quat._v[1] / norm;
    const z = -quat._v[2] / norm;
    const w = quat._v[3] / norm;
    return this.fromCopy4(x, y, z, w);
  }
  /**
   * Computes the inverse of a quaternion and stores the result in the output parameter.
   * @param quat - The quaternion to invert
   * @param out - The output quaternion to store the result
   * @returns The output quaternion containing the inverted result
   */
  static invertTo(quat, out) {
    const norm = quat.length();
    if (norm === 0) {
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
  static qlerp(l_quat, r_quat, ratio) {
    let dotProduct = l_quat._v[0] * r_quat._v[0] + l_quat._v[1] * r_quat._v[1] + l_quat._v[2] * r_quat._v[2] + l_quat._v[3] * r_quat._v[3];
    const ss = 1 - dotProduct * dotProduct;
    if (ss === 0) {
      return l_quat.clone();
    }
    if (dotProduct > 1) {
      dotProduct = 0.999;
    } else if (dotProduct < -1) {
      dotProduct = -0.999;
    }
    let theta = Math.acos(dotProduct);
    const sinTheta = Math.sin(theta);
    let s2;
    if (dotProduct < 0) {
      dotProduct *= -1;
      theta = Math.acos(dotProduct);
      s2 = -1 * Math.sin(theta * ratio) / sinTheta;
    } else {
      s2 = Math.sin(theta * ratio) / sinTheta;
    }
    const s1 = Math.sin(theta * (1 - ratio)) / sinTheta;
    let x = l_quat._v[0] * s1 + r_quat._v[0] * s2;
    let y = l_quat._v[1] * s1 + r_quat._v[1] * s2;
    let z = l_quat._v[2] * s1 + r_quat._v[2] * s2;
    let w = l_quat._v[3] * s1 + r_quat._v[3] * s2;
    const length = Math.hypot(x, y, z, w);
    x = x / length;
    y = y / length;
    z = z / length;
    w = w / length;
    return this.fromCopy4(x, y, z, w);
  }
  /**
   * Performs spherical linear interpolation (SLERP) and stores the result in the output parameter.
   * @param l_quat - The starting quaternion
   * @param r_quat - The ending quaternion
   * @param ratio - The interpolation parameter (0.0 = l_quat, 1.0 = r_quat)
   * @param out - The output quaternion to store the result
   * @returns The output quaternion containing the interpolated result
   */
  static qlerpTo(l_quat, r_quat, ratio, out) {
    let dotProduct = l_quat._v[0] * r_quat._v[0] + l_quat._v[1] * r_quat._v[1] + l_quat._v[2] * r_quat._v[2] + l_quat._v[3] * r_quat._v[3];
    const ss = 1 - dotProduct * dotProduct;
    if (ss === 0) {
      return out.copyComponents(l_quat);
    }
    if (dotProduct > 1) {
      dotProduct = 0.999;
    } else if (dotProduct < -1) {
      dotProduct = -0.999;
    }
    let theta = Math.acos(dotProduct);
    const sinTheta = Math.sin(theta);
    let s2;
    if (dotProduct < 0) {
      dotProduct *= -1;
      theta = Math.acos(dotProduct);
      s2 = -1 * Math.sin(theta * ratio) / sinTheta;
    } else {
      s2 = Math.sin(theta * ratio) / sinTheta;
    }
    const s1 = Math.sin(theta * (1 - ratio)) / sinTheta;
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
  static lerp(l_quat, r_quat, ratio) {
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
  static lerpTo(l_quat, r_quat, ratio, out) {
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
  static tryAxisAngle(vec, radian) {
    const length = vec.length();
    if (!Number.isFinite(length) || length === 0) {
      return null;
    }
    const halfAngle = 0.5 * radian;
    const sin = Math.sin(halfAngle);
    return this.fromCopy4(
      sin * vec._v[0] / length,
      sin * vec._v[1] / length,
      sin * vec._v[2] / length,
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
  static axisAngle(vec, radian) {
    const quat = this.tryAxisAngle(vec, radian);
    if (quat !== null) {
      return quat;
    }
    Logger.default.error("the rotation axis has zero length. Returning an identity quaternion instead.");
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
  static Dt(mat, outV) {
    const sxRaw = Math.hypot(mat.m00, mat.m10, mat.m20);
    const sy = Math.hypot(mat.m01, mat.m11, mat.m21);
    const sz = Math.hypot(mat.m02, mat.m12, mat.m22);
    const det = mat.determinant();
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
      const S = 0.5 / Math.sqrt(trace + 1);
      outV[0] = (m.m21 - m.m12) * S;
      outV[1] = (m.m02 - m.m20) * S;
      outV[2] = (m.m10 - m.m01) * S;
      outV[3] = 0.25 / S;
    } else if (m.m00 > m.m11 && m.m00 > m.m22) {
      const S = Math.sqrt(1 + m.m00 - m.m11 - m.m22) * 2;
      outV[0] = 0.25 * S;
      outV[1] = (m.m01 + m.m10) / S;
      outV[2] = (m.m02 + m.m20) / S;
      outV[3] = (m.m21 - m.m12) / S;
    } else if (m.m11 > m.m22) {
      const S = Math.sqrt(1 + m.m11 - m.m00 - m.m22) * 2;
      outV[0] = (m.m01 + m.m10) / S;
      outV[1] = 0.25 * S;
      outV[2] = (m.m12 + m.m21) / S;
      outV[3] = (m.m02 - m.m20) / S;
    } else {
      const S = Math.sqrt(1 + m.m22 - m.m00 - m.m11) * 2;
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
  static tryFromMatrix(mat) {
    const outV = new this._type(4);
    if (!this.Dt(mat, outV)) {
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
  static fromMatrix(mat) {
    const quat = this.tryFromMatrix(mat);
    if (quat !== null) {
      return quat;
    }
    Logger.default.error(
      "the rotation cannot be extracted from the matrix (it is singular or contains non-finite values). Returning an identity quaternion instead."
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
  static tryFromMatrixTo(mat, out) {
    return this.Dt(mat, out._v);
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
  static fromMatrixTo(mat, out) {
    if (this.tryFromMatrixTo(mat, out)) {
      return out;
    }
    Logger.default.error(
      "the rotation cannot be extracted from the matrix (it is singular or contains non-finite values). Returning an identity quaternion instead."
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
  static lookFromTo(fromDirection, toDirection) {
    if (fromDirection.isEqual(toDirection)) {
      return this.fromCopy4(0, 0, 0, 1);
    }
    return this.qlerp(this.lookForward(fromDirection), this.lookForward(toDirection), 1);
  }
  /**
   * Attempts to create a quaternion that looks in the specified forward direction using default up vector (0, 1, 0).
   * @param forward - The forward direction vector
   * @returns A quaternion representing the look rotation, or null if the direction is degenerate
   */
  static tryLookForward(forward) {
    if (this.Bt == null) {
      this.Bt = new forward.constructor(0, 1, 0);
    }
    return this.tryLookForwardAccordingToThisUp(forward, this.Bt);
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
  static lookForward(forward) {
    const quat = this.tryLookForward(forward);
    if (quat !== null) {
      return quat;
    }
    Logger.default.error("the forward direction has zero length. Returning an identity quaternion instead.");
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
  static tryLookForwardAccordingToThisUp(forward, up) {
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
      const num22 = 0.5 / num;
      return this.fromCopy4((m12 - m21) * num22, (m20 - m02) * num22, (m01 - m10) * num22, num * 0.5);
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
  static lookForwardAccordingToThisUp(forward, up) {
    const quat = this.tryLookForwardAccordingToThisUp(forward, up);
    if (quat !== null) {
      return quat;
    }
    Logger.default.error(
      "the forward/up directions are degenerate (zero length or parallel). Returning an identity quaternion instead."
    );
    return this.fromCopy4(0, 0, 0, 1);
  }
  /**
   * Creates a quaternion from a position vector, with w component set to 0.
   * This is useful for representing pure translations in quaternion form.
   * @param vec - The position vector
   * @returns A quaternion with xyz from the vector and w=0
   */
  static fromPosition(vec) {
    return this.fromCopy4(vec._v[0], vec._v[1], vec._v[2], 0);
  }
  /**
   * Adds two quaternions component-wise.
   * @param l_quat - The left quaternion
   * @param r_quat - The right quaternion
   * @returns The sum of the two quaternions
   */
  static add(l_quat, r_quat) {
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
  static addTo(l_quat, r_quat, out) {
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
  static subtract(l_quat, r_quat) {
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
  static subtractTo(l_quat, r_quat, out) {
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
  static multiply(l_quat, r_quat) {
    const x = r_quat._v[3] * l_quat._v[0] + r_quat._v[2] * l_quat._v[1] - r_quat._v[1] * l_quat._v[2] + r_quat._v[0] * l_quat._v[3];
    const y = -r_quat._v[2] * l_quat._v[0] + r_quat._v[3] * l_quat._v[1] + r_quat._v[0] * l_quat._v[2] + r_quat._v[1] * l_quat._v[3];
    const z = r_quat._v[1] * l_quat._v[0] - r_quat._v[0] * l_quat._v[1] + r_quat._v[3] * l_quat._v[2] + r_quat._v[2] * l_quat._v[3];
    const w = -r_quat._v[0] * l_quat._v[0] - r_quat._v[1] * l_quat._v[1] - r_quat._v[2] * l_quat._v[2] + r_quat._v[3] * l_quat._v[3];
    return this.fromCopy4(x, y, z, w);
  }
  /**
   * Multiplies two quaternions and stores the result in the output parameter.
   * @param l_quat - The left quaternion
   * @param r_quat - The right quaternion
   * @param out - The output quaternion to store the result
   * @returns The output quaternion containing the product
   */
  static multiplyTo(l_quat, r_quat, out) {
    const x = r_quat._v[3] * l_quat._v[0] + r_quat._v[2] * l_quat._v[1] - r_quat._v[1] * l_quat._v[2] + r_quat._v[0] * l_quat._v[3];
    const y = -r_quat._v[2] * l_quat._v[0] + r_quat._v[3] * l_quat._v[1] + r_quat._v[0] * l_quat._v[2] + r_quat._v[1] * l_quat._v[3];
    const z = r_quat._v[1] * l_quat._v[0] - r_quat._v[0] * l_quat._v[1] + r_quat._v[3] * l_quat._v[2] + r_quat._v[2] * l_quat._v[3];
    const w = -r_quat._v[0] * l_quat._v[0] - r_quat._v[1] * l_quat._v[1] - r_quat._v[2] * l_quat._v[2] + r_quat._v[3] * l_quat._v[3];
    return out.setComponents(x, y, z, w);
  }
  /**
   * Multiplies a quaternion by a scalar value.
   * @param quat - The quaternion to multiply
   * @param value - The scalar value to multiply by
   * @returns A new quaternion with all components multiplied by the scalar
   */
  static multiplyNumber(quat, value) {
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
  static multiplyNumberTo(quat, value, out) {
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
  static divideNumber(quat, value) {
    if (value === 0) {
      Logger.default.error("0 division occurred! The result is set to zero.");
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
  static divideNumberTo(quat, value, out) {
    if (value === 0) {
      Logger.default.error("0 division occurred! The result is set to zero.");
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
    return `${MathUtil.financial(this._v[0])} ${MathUtil.financial(this._v[1])} ${MathUtil.financial(this._v[2])} ${MathUtil.financial(this._v[3])}
`;
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
  isEqual(quat, delta = Number.EPSILON) {
    if (Math.abs(quat._v[0] - this._v[0]) < delta && Math.abs(quat._v[1] - this._v[1]) < delta && Math.abs(quat._v[2] - this._v[2]) < delta && Math.abs(quat._v[3] - this._v[3]) < delta) {
      return true;
    }
    return false;
  }
  /**
   * Checks if this quaternion is exactly equal to another quaternion.
   * @param quat - The quaternion to compare with
   * @returns True if all components are exactly equal, false otherwise
   */
  isStrictEqual(quat) {
    if (this._v[0] === quat._v[0] && this._v[1] === quat._v[1] && this._v[2] === quat._v[2] && this._v[3] === quat._v[3]) {
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
  toEulerAnglesTo(out) {
    const t0 = 2 * (this._v[3] * this._v[0] + this._v[1] * this._v[2]);
    const t1 = 1 - 2 * (this._v[0] * this._v[0] + this._v[1] * this._v[1]);
    out._v[0] = Math.atan2(t0, t1);
    let t2 = 2 * (this._v[3] * this._v[1] - this._v[2] * this._v[0]);
    t2 = Math.min(t2, 1);
    t2 = Math.max(t2, -1);
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
    t2 = Math.min(t2, 1);
    t2 = Math.max(t2, -1);
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
  static _divide(vec, value) {
    let x;
    let y;
    let z;
    let w;
    if (value !== 0) {
      x = vec._v[0] / value;
      y = vec._v[1] / value;
      z = vec._v[2] / value;
      w = vec._v[3] / value;
    } else {
      Logger.default.error("0 division occurred! The result is set to zero.");
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
  static _divideTo(vec, value, out) {
    let x;
    let y;
    let z;
    let w;
    if (value !== 0) {
      x = vec._v[0] / value;
      y = vec._v[1] / value;
      z = vec._v[2] / value;
      w = vec._v[3] / value;
    } else {
      Logger.default.error("0 division occurred! The result is set to zero.");
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
  static normalize(vec) {
    const length = vec.length();
    if (length === 0) {
      Logger.default.error("cannot normalize a zero-length quaternion. Returning an identity quaternion instead.");
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
  static normalizeTo(vec, out) {
    const length = vec.length();
    if (length === 0) {
      Logger.default.error("cannot normalize a zero-length quaternion. The output is set to the identity quaternion.");
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
  fromToRotation(from, to) {
    const v0 = MutableVector3.fromCopyVector3(from);
    const v1 = MutableVector3.fromCopyVector3(to);
    v0.normalize();
    v1.normalize();
    const d = v0.dot(v1);
    if (d > -1 + Number.EPSILON) {
      const s = Math.sqrt((1 + d) * 2);
      const invs = 1 / s;
      const c = Vector3.multiply(v0.cross(v1), invs);
      this._v[0] = c.x;
      this._v[1] = c.y;
      this._v[2] = c.z;
      this._v[3] = s * 0.5;
      return this.constructor.normalize(this);
    }
    let axis = Vector3.fromCopy3(0, 1, 0);
    let axis2 = v0.cross(axis);
    if (axis2.length() < Number.EPSILON) {
      axis = Vector3.fromCopy3(1, 0, 0);
      axis2 = v0.cross(axis);
    }
    axis2.normalize();
    return this.constructor.fromAxisAngle(axis2, Math.PI);
  }
  /**
   * Creates a quaternion representing the rotation from one vector to another (static version).
   * @param from - The starting direction vector
   * @param to - The target direction vector
   * @returns A normalized quaternion representing the rotation
   */
  static fromToRotation(from, to) {
    let r = Vector3.dot(from, to) + 1;
    if (r < Number.EPSILON) {
      r = 0;
      if (Math.abs(from.x) > Math.abs(from.z)) {
        const q3 = this.fromCopy4(-from.y, from.x, 0, r);
        return this.normalize(q3);
      }
      const q2 = this.fromCopy4(0, -from.z, from.y, r);
      return this.normalize(q2);
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
  static fromToRotationTo(from, to, out) {
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
  transformVector3(v) {
    const u = Quaternion.Ct;
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
  transformVector3To(v, out) {
    const u = Quaternion.Ct;
    u.setComponents(this._v[0], this._v[1], this._v[2]);
    const uv = Vector3.crossTo(u, v, Quaternion.Fg);
    const uuv = Vector3.crossTo(u, uv, Quaternion.Gg);
    const uvw = Vector3.multiplyTo(uv, this._v[3], Quaternion.Hg);
    const uuv_uvw = Vector3.addTo(uuv, uvw, Quaternion.Et);
    const uuv_uvw_2 = Vector3.multiplyTo(uuv_uvw, 2, Quaternion.Ft);
    return Vector3.addTo(v, uuv_uvw_2, out);
  }
  /**
   * Transforms a 3D vector by the inverse of this quaternion rotation.
   * @param v - The vector to transform
   * @returns A new transformed vector
   */
  transformVector3Inverse(v) {
    const inv = this.constructor.invert(this);
    return inv.transformVector3(v);
  }
  /**
   * Creates a deep copy of this quaternion.
   * @returns A new quaternion with the same component values
   */
  clone() {
    return this.constructor.fromCopy4(this._v[0], this._v[1], this._v[2], this._v[3]);
  }
  /**
   * Creates a quaternion that directly uses the given typed array (no copy).
   * @param array - The typed array containing quaternion components
   * @returns A new quaternion using the provided array
   */
  static fromTypedArray(array) {
    return new this(array);
  }
  /**
   * Creates a quaternion from a 4-element array.
   * @param array - The array containing [x, y, z, w] components
   * @returns A new quaternion with copied components
   */
  static fromCopyArray4(array) {
    return new this(new this._type(array));
  }
  /**
   * Creates a quaternion from a variable-length array (taking first 4 elements).
   * @param array - The array containing quaternion components
   * @returns A new quaternion with the first 4 components copied
   */
  static fromCopyArray(array) {
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
  static fromCopy4(x, y, z, w) {
    return new this(new this._type([x, y, z, w]));
  }
  /**
   * Creates a quaternion by copying from another quaternion.
   * @param quat - The quaternion to copy from
   * @returns A new quaternion with copied components
   */
  static fromCopyQuaternion(quat) {
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
  static fromCopyVector4(vec) {
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
  static fromCopyLogQuaternion(x) {
    const length = Math.hypot(x._v[0], x._v[1], x._v[2]);
    const v = new this._type(4);
    if (length === 0) {
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
  static fromAxisAngle(axis, rad) {
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
  static fromAxisAngleTo(axis, rad, out) {
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
  static getQuaternionAngle(q) {
    const wClamped = Math.max(-1, Math.min(1, q.w));
    return 2 * Math.acos(wClamped);
  }
  /**
   * Clamps the rotation angle of a quaternion to a maximum value.
   * If the quaternion's rotation angle exceeds thetaMax, it scales the rotation down.
   * @param quat - The quaternion to clamp
   * @param thetaMax - The maximum allowed rotation angle in radians
   * @returns A quaternion with rotation angle clamped to thetaMax
   */
  static clampRotation(quat, thetaMax) {
    const theta = this.getQuaternionAngle(quat);
    if (theta <= thetaMax) {
      return quat;
    }
    const t = thetaMax / theta;
    const qIdentity = this.fromCopy4(0, 0, 0, 1);
    return this.qlerp(qIdentity, quat, t);
  }
};
/** The typed array constructor used for newly created quaternions. */
Quaternion_._type = Float32Array;
Quaternion_.Bt = void 0;
Quaternion_.Fg = MutableVector3.zero();
Quaternion_.Gg = MutableVector3.zero();
Quaternion_.Hg = MutableVector3.zero();
Quaternion_.Et = MutableVector3.zero();
Quaternion_.Ft = MutableVector3.zero();
Quaternion_.Ct = MutableVector3.zero();
var Quaternion = class extends Quaternion_ {
  /**
   * Creates a new Quaternion instance.
   * @param v - The typed array containing the quaternion components
   */
  constructor(v) {
    super(v, { type: Float32Array });
  }
  /**
   * identity
   */
  static identity() {
    return super.identity();
  }
  /**
   * dummy
   */
  static dummy() {
    return super.dummy();
  }
  /**
   * invert
   */
  static invert(quat) {
    return super.invert(quat);
  }
  /**
   * invertTo
   */
  static invertTo(quat, out) {
    return super.invertTo(quat, out);
  }
  /**
   * qlerp
   */
  static qlerp(l_quat, r_quat, ratio) {
    return super.qlerp(l_quat, r_quat, ratio);
  }
  /**
   * qlerpTo
   */
  static qlerpTo(l_quat, r_quat, ratio, out) {
    return super.qlerpTo(l_quat, r_quat, ratio, out);
  }
  /**
   * lerp
   */
  static lerp(l_quat, r_quat, ratio) {
    return super.lerp(l_quat, r_quat, ratio);
  }
  /**
   * lerpTo
   */
  static lerpTo(l_quat, r_quat, ratio, out) {
    return super.lerpTo(l_quat, r_quat, ratio, out);
  }
  /**
   * tryAxisAngle
   */
  static tryAxisAngle(vec, radian) {
    return super.tryAxisAngle(vec, radian);
  }
  /**
   * axisAngle
   */
  static axisAngle(vec, radian) {
    return super.axisAngle(vec, radian);
  }
  /**
   * tryFromMatrix
   */
  static tryFromMatrix(mat) {
    return super.tryFromMatrix(mat);
  }
  /**
   * fromMatrix
   */
  static fromMatrix(mat) {
    return super.fromMatrix(mat);
  }
  /**
   * tryFromMatrixTo
   */
  static tryFromMatrixTo(mat, out) {
    return super.tryFromMatrixTo(mat, out);
  }
  /**
   * fromMatrixTo
   */
  static fromMatrixTo(mat, out) {
    return super.fromMatrixTo(mat, out);
  }
  /**
   * lookFromTo
   */
  static lookFromTo(fromDirection, toDirection) {
    return super.lookFromTo(fromDirection, toDirection);
  }
  /**
   * tryLookForward
   */
  static tryLookForward(forward) {
    return super.tryLookForward(forward);
  }
  /**
   * lookForward
   */
  static lookForward(forward) {
    return super.lookForward(forward);
  }
  /**
   * tryLookForwardAccordingToThisUp
   */
  static tryLookForwardAccordingToThisUp(forward, up) {
    return super.tryLookForwardAccordingToThisUp(forward, up);
  }
  /**
   * lookForwardAccordingToThisUp
   */
  static lookForwardAccordingToThisUp(forward, up) {
    return super.lookForwardAccordingToThisUp(forward, up);
  }
  /**
   * fromPosition
   */
  static fromPosition(vec) {
    return super.fromPosition(vec);
  }
  /**
   * add
   */
  static add(l_quat, r_quat) {
    return super.add(l_quat, r_quat);
  }
  /**
   * addTo
   */
  static addTo(l_quat, r_quat, out) {
    return super.addTo(l_quat, r_quat, out);
  }
  /**
   * subtract
   */
  static subtract(l_quat, r_quat) {
    return super.subtract(l_quat, r_quat);
  }
  /**
   * subtractTo
   */
  static subtractTo(l_quat, r_quat, out) {
    return super.subtractTo(l_quat, r_quat, out);
  }
  /**
   * multiply
   */
  static multiply(l_quat, r_quat) {
    return super.multiply(l_quat, r_quat);
  }
  /**
   * multiplyTo
   */
  static multiplyTo(l_quat, r_quat, out) {
    return super.multiplyTo(l_quat, r_quat, out);
  }
  /**
   * multiplyNumber
   */
  static multiplyNumber(quat, value) {
    return super.multiplyNumber(quat, value);
  }
  /**
   * multiplyNumberTo
   */
  static multiplyNumberTo(quat, value, out) {
    return super.multiplyNumberTo(quat, value, out);
  }
  /**
   * divideNumber
   */
  static divideNumber(quat, value) {
    return super.divideNumber(quat, value);
  }
  /**
   * divideNumberTo
   */
  static divideNumberTo(quat, value, out) {
    return super.divideNumberTo(quat, value, out);
  }
  /**
   * normalize
   */
  static normalize(vec) {
    return super.normalize(vec);
  }
  /**
   * normalizeTo
   */
  static normalizeTo(vec, out) {
    return super.normalizeTo(vec, out);
  }
  /**
   * fromToRotation
   */
  static fromToRotation(from, to) {
    return super.fromToRotation(from, to);
  }
  /**
   * fromToRotationTo
   */
  static fromToRotationTo(from, to, out) {
    return super.fromToRotationTo(from, to, out);
  }
  /**
   * Creates a quaternion that directly uses the given Float32Array (no copy).
   */
  static fromFloat32Array(array) {
    return super.fromTypedArray(array);
  }
  /**
   * fromCopyArray4
   */
  static fromCopyArray4(array) {
    return super.fromCopyArray4(array);
  }
  /**
   * fromCopyArray
   */
  static fromCopyArray(array) {
    return super.fromCopyArray(array);
  }
  /**
   * fromCopy4
   */
  static fromCopy4(x, y, z, w) {
    return super.fromCopy4(x, y, z, w);
  }
  /**
   * fromCopyQuaternion
   */
  static fromCopyQuaternion(quat) {
    return super.fromCopyQuaternion(quat);
  }
  /**
   * fromCopyVector4
   */
  static fromCopyVector4(vec) {
    return super.fromCopyVector4(vec);
  }
  /**
   * fromCopyLogQuaternion
   */
  static fromCopyLogQuaternion(x) {
    return super.fromCopyLogQuaternion(x);
  }
  /**
   * fromAxisAngle
   */
  static fromAxisAngle(axis, rad) {
    return super.fromAxisAngle(axis, rad);
  }
  /**
   * fromAxisAngleTo
   */
  static fromAxisAngleTo(axis, rad, out) {
    return super.fromAxisAngleTo(axis, rad, out);
  }
  /**
   * getQuaternionAngle
   */
  static getQuaternionAngle(q) {
    return super.getQuaternionAngle(q);
  }
  /**
   * clampRotation
   */
  static clampRotation(quat, thetaMax) {
    return super.clampRotation(quat, thetaMax);
  }
};
var QuaternionD = class extends Quaternion_ {
  /**
   * Creates a new QuaternionD instance.
   * @param v - The typed array containing the quaternion components
   */
  constructor(v) {
    super(v, { type: Float64Array });
  }
  /**
   * identity
   */
  static identity() {
    return super.identity();
  }
  /**
   * dummy
   */
  static dummy() {
    return super.dummy();
  }
  /**
   * invert
   */
  static invert(quat) {
    return super.invert(quat);
  }
  /**
   * invertTo
   */
  static invertTo(quat, out) {
    return super.invertTo(quat, out);
  }
  /**
   * qlerp
   */
  static qlerp(l_quat, r_quat, ratio) {
    return super.qlerp(l_quat, r_quat, ratio);
  }
  /**
   * qlerpTo
   */
  static qlerpTo(l_quat, r_quat, ratio, out) {
    return super.qlerpTo(l_quat, r_quat, ratio, out);
  }
  /**
   * lerp
   */
  static lerp(l_quat, r_quat, ratio) {
    return super.lerp(l_quat, r_quat, ratio);
  }
  /**
   * lerpTo
   */
  static lerpTo(l_quat, r_quat, ratio, out) {
    return super.lerpTo(l_quat, r_quat, ratio, out);
  }
  /**
   * tryAxisAngle
   */
  static tryAxisAngle(vec, radian) {
    return super.tryAxisAngle(vec, radian);
  }
  /**
   * axisAngle
   */
  static axisAngle(vec, radian) {
    return super.axisAngle(vec, radian);
  }
  /**
   * tryFromMatrix
   */
  static tryFromMatrix(mat) {
    return super.tryFromMatrix(mat);
  }
  /**
   * fromMatrix
   */
  static fromMatrix(mat) {
    return super.fromMatrix(mat);
  }
  /**
   * tryFromMatrixTo
   */
  static tryFromMatrixTo(mat, out) {
    return super.tryFromMatrixTo(mat, out);
  }
  /**
   * fromMatrixTo
   */
  static fromMatrixTo(mat, out) {
    return super.fromMatrixTo(mat, out);
  }
  /**
   * lookFromTo
   */
  static lookFromTo(fromDirection, toDirection) {
    return super.lookFromTo(fromDirection, toDirection);
  }
  /**
   * tryLookForward
   */
  static tryLookForward(forward) {
    return super.tryLookForward(forward);
  }
  /**
   * lookForward
   */
  static lookForward(forward) {
    return super.lookForward(forward);
  }
  /**
   * tryLookForwardAccordingToThisUp
   */
  static tryLookForwardAccordingToThisUp(forward, up) {
    return super.tryLookForwardAccordingToThisUp(forward, up);
  }
  /**
   * lookForwardAccordingToThisUp
   */
  static lookForwardAccordingToThisUp(forward, up) {
    return super.lookForwardAccordingToThisUp(forward, up);
  }
  /**
   * fromPosition
   */
  static fromPosition(vec) {
    return super.fromPosition(vec);
  }
  /**
   * add
   */
  static add(l_quat, r_quat) {
    return super.add(l_quat, r_quat);
  }
  /**
   * addTo
   */
  static addTo(l_quat, r_quat, out) {
    return super.addTo(l_quat, r_quat, out);
  }
  /**
   * subtract
   */
  static subtract(l_quat, r_quat) {
    return super.subtract(l_quat, r_quat);
  }
  /**
   * subtractTo
   */
  static subtractTo(l_quat, r_quat, out) {
    return super.subtractTo(l_quat, r_quat, out);
  }
  /**
   * multiply
   */
  static multiply(l_quat, r_quat) {
    return super.multiply(l_quat, r_quat);
  }
  /**
   * multiplyTo
   */
  static multiplyTo(l_quat, r_quat, out) {
    return super.multiplyTo(l_quat, r_quat, out);
  }
  /**
   * multiplyNumber
   */
  static multiplyNumber(quat, value) {
    return super.multiplyNumber(quat, value);
  }
  /**
   * multiplyNumberTo
   */
  static multiplyNumberTo(quat, value, out) {
    return super.multiplyNumberTo(quat, value, out);
  }
  /**
   * divideNumber
   */
  static divideNumber(quat, value) {
    return super.divideNumber(quat, value);
  }
  /**
   * divideNumberTo
   */
  static divideNumberTo(quat, value, out) {
    return super.divideNumberTo(quat, value, out);
  }
  /**
   * normalize
   */
  static normalize(vec) {
    return super.normalize(vec);
  }
  /**
   * normalizeTo
   */
  static normalizeTo(vec, out) {
    return super.normalizeTo(vec, out);
  }
  /**
   * fromToRotation
   */
  static fromToRotation(from, to) {
    return super.fromToRotation(from, to);
  }
  /**
   * fromToRotationTo
   */
  static fromToRotationTo(from, to, out) {
    return super.fromToRotationTo(from, to, out);
  }
  /**
   * Creates a quaternion that directly uses the given Float64Array (no copy).
   */
  static fromFloat64Array(array) {
    return super.fromTypedArray(array);
  }
  /**
   * fromCopyArray4
   */
  static fromCopyArray4(array) {
    return super.fromCopyArray4(array);
  }
  /**
   * fromCopyArray
   */
  static fromCopyArray(array) {
    return super.fromCopyArray(array);
  }
  /**
   * fromCopy4
   */
  static fromCopy4(x, y, z, w) {
    return super.fromCopy4(x, y, z, w);
  }
  /**
   * fromCopyQuaternion
   */
  static fromCopyQuaternion(quat) {
    return super.fromCopyQuaternion(quat);
  }
  /**
   * fromCopyVector4
   */
  static fromCopyVector4(vec) {
    return super.fromCopyVector4(vec);
  }
  /**
   * fromCopyLogQuaternion
   */
  static fromCopyLogQuaternion(x) {
    return super.fromCopyLogQuaternion(x);
  }
  /**
   * fromAxisAngle
   */
  static fromAxisAngle(axis, rad) {
    return super.fromAxisAngle(axis, rad);
  }
  /**
   * fromAxisAngleTo
   */
  static fromAxisAngleTo(axis, rad, out) {
    return super.fromAxisAngleTo(axis, rad, out);
  }
  /**
   * getQuaternionAngle
   */
  static getQuaternionAngle(q) {
    return super.getQuaternionAngle(q);
  }
  /**
   * clampRotation
   */
  static clampRotation(quat, thetaMax) {
    return super.clampRotation(quat, thetaMax);
  }
};
/** The typed array constructor used for newly created quaternions. */
QuaternionD._type = Float64Array;
export {
  Quaternion,
  QuaternionD,
  Quaternion as QuaternionF,
  Quaternion_
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9RdWF0ZXJuaW9uLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IEFycmF5NCwgRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IsIFR5cGVkQXJyYXkgfSBmcm9tICcuLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgeyBDb21wb3NpdGlvblR5cGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9Db21wb3NpdGlvblR5cGUnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHsgQWJzdHJhY3RRdWF0ZXJuaW9uIH0gZnJvbSAnLi9BYnN0cmFjdFF1YXRlcm5pb24nO1xuaW1wb3J0IHR5cGUgeyBJTWF0cml4NDQgfSBmcm9tICcuL0lNYXRyaXgnO1xuaW1wb3J0IHR5cGUgeyBJTG9nUXVhdGVybmlvbiwgSU11dGFibGVRdWF0ZXJuaW9uLCBJUXVhdGVybmlvbiB9IGZyb20gJy4vSVF1YXRlcm5pb24nO1xuaW1wb3J0IHR5cGUgeyBJTXV0YWJsZVZlY3RvcjMsIElWZWN0b3IzLCBJVmVjdG9yNCB9IGZyb20gJy4vSVZlY3Rvcic7XG5pbXBvcnQgeyBNYXRoVXRpbCB9IGZyb20gJy4vTWF0aFV0aWwnO1xuaW1wb3J0IHsgTXV0YWJsZU1hdHJpeDQ0IH0gZnJvbSAnLi9NdXRhYmxlTWF0cml4NDQnO1xuaW1wb3J0IHsgTXV0YWJsZVZlY3RvcjMgfSBmcm9tICcuL011dGFibGVWZWN0b3IzJztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICcuL1ZlY3RvcjMnO1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYW4gaW1tdXRhYmxlIHF1YXRlcm5pb24gdGhhdCBleHRlbmRzIEFic3RyYWN0UXVhdGVybmlvbi5cbiAqIFF1YXRlcm5pb25zIGFyZSB1c2VkIHRvIHJlcHJlc2VudCByb3RhdGlvbnMgaW4gM0Qgc3BhY2UgYW5kIG9mZmVyIGFkdmFudGFnZXNcbiAqIG92ZXIgRXVsZXIgYW5nbGVzIHN1Y2ggYXMgYXZvaWRpbmcgZ2ltYmFsIGxvY2sgYW5kIHByb3ZpZGluZyBzbW9vdGggaW50ZXJwb2xhdGlvbi5cbiAqXG4gKiBBIHF1YXRlcm5pb24gY29uc2lzdHMgb2YgZm91ciBjb21wb25lbnRzOiB4LCB5LCB6ICh2ZWN0b3IgcGFydCkgYW5kIHcgKHNjYWxhciBwYXJ0KS5cbiAqIEZvciB1bml0IHF1YXRlcm5pb25zIHJlcHJlc2VudGluZyByb3RhdGlvbnM6IHEgPSB3ICsgeGkgKyB5aiArIHprIHdoZXJlIGlcdTAwQjIgPSBqXHUwMEIyID0ga1x1MDBCMiA9IGlqayA9IC0xXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIC8vIENyZWF0ZSBpZGVudGl0eSBxdWF0ZXJuaW9uIChubyByb3RhdGlvbilcbiAqIGNvbnN0IGlkZW50aXR5ID0gUXVhdGVybmlvbi5pZGVudGl0eSgpO1xuICpcbiAqIC8vIENyZWF0ZSBxdWF0ZXJuaW9uIGZyb20gYXhpcy1hbmdsZSByZXByZXNlbnRhdGlvblxuICogY29uc3QgYXhpcyA9IFZlY3RvcjMuZnJvbUNvcHkzKDAsIDEsIDApOyAvLyBZLWF4aXNcbiAqIGNvbnN0IGFuZ2xlID0gTWF0aC5QSSAvIDQ7IC8vIDQ1IGRlZ3JlZXNcbiAqIGNvbnN0IHJvdGF0aW9uID0gUXVhdGVybmlvbi5mcm9tQXhpc0FuZ2xlKGF4aXMsIGFuZ2xlKTtcbiAqXG4gKiAvLyBNdWx0aXBseSBxdWF0ZXJuaW9ucyB0byBjb21iaW5lIHJvdGF0aW9uc1xuICogY29uc3QgY29tYmluZWQgPSBRdWF0ZXJuaW9uLm11bHRpcGx5KHJvdGF0aW9uMSwgcm90YXRpb24yKTtcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgUXVhdGVybmlvbl88VCBleHRlbmRzIEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yPiBleHRlbmRzIEFic3RyYWN0UXVhdGVybmlvbiBpbXBsZW1lbnRzIElRdWF0ZXJuaW9uIHtcbiAgLyoqIFRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvciB1c2VkIGZvciBuZXdseSBjcmVhdGVkIHF1YXRlcm5pb25zLiAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIHJlYWRvbmx5IF90eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3RvciA9IEZsb2F0MzJBcnJheTtcblxuICBwcml2YXRlIHN0YXRpYyBfX3RtcF91cFZlYzogYW55ID0gdW5kZWZpbmVkO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcF92ZWMzXzA6IGFueSA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBfdmVjM18xOiBhbnkgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wX3ZlYzNfMjogYW55ID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcF92ZWMzXzM6IGFueSA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBfdmVjM180OiBhbnkgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wX3ZlYzNfNTogYW55ID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IFF1YXRlcm5pb25fIGluc3RhbmNlLlxuICAgKiBAcGFyYW0geCAtIFRoZSB0eXBlZCBhcnJheSBjb250YWluaW5nIHRoZSBxdWF0ZXJuaW9uIGNvbXBvbmVudHMgW3gsIHksIHosIHddXG4gICAqIEBwYXJhbSBfb3B0aW9ucyAtIENvbmZpZ3VyYXRpb24gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9yXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih4OiBUeXBlZEFycmF5LCBfb3B0aW9ucz86IHsgdHlwZTogVCB9KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl92ID0geDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjbGFzcyBuYW1lIGZvciBkZWJ1Z2dpbmcgYW5kIHJlZmxlY3Rpb24gcHVycG9zZXMuXG4gICAqIEByZXR1cm5zIFRoZSBzdHJpbmcgXCJRdWF0ZXJuaW9uXCJcbiAgICovXG4gIGdldCBjbGFzc05hbWUoKSB7XG4gICAgcmV0dXJuICdRdWF0ZXJuaW9uJztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb21wb3NpdGlvbiB0eXBlIGZvciB0aGlzIHF1YXRlcm5pb24gY2xhc3MuXG4gICAqIEByZXR1cm5zIENvbXBvc2l0aW9uVHlwZS5WZWM0IGluZGljYXRpbmcgdGhpcyBpcyBhIDQtY29tcG9uZW50IHZlY3RvclxuICAgKi9cbiAgc3RhdGljIGdldCBjb21wb3NpdGlvblR5cGUoKSB7XG4gICAgcmV0dXJuIENvbXBvc2l0aW9uVHlwZS5WZWM0O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gaWRlbnRpdHkgcXVhdGVybmlvbiByZXByZXNlbnRpbmcgbm8gcm90YXRpb24uXG4gICAqIFRoZSBpZGVudGl0eSBxdWF0ZXJuaW9uIGlzICgwLCAwLCAwLCAxKSBpbiAoeCwgeSwgeiwgdykgZm9ybWF0LlxuICAgKiBAcmV0dXJucyBBIG5ldyBpZGVudGl0eSBxdWF0ZXJuaW9uXG4gICAqL1xuICBzdGF0aWMgaWRlbnRpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuZnJvbUNvcHk0KDAsIDAsIDAsIDEpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBkdW1teSBxdWF0ZXJuaW9uIHdpdGggemVyby1sZW5ndGggaW50ZXJuYWwgYXJyYXkuXG4gICAqIFVzZWQgYXMgYSBwbGFjZWhvbGRlciBvciB1bmluaXRpYWxpemVkIHF1YXRlcm5pb24uXG4gICAqIEByZXR1cm5zIEEgbmV3IGR1bW15IHF1YXRlcm5pb25cbiAgICovXG4gIHN0YXRpYyBkdW1teSgpIHtcbiAgICByZXR1cm4gbmV3IHRoaXMobmV3IHRoaXMuX3R5cGUoMCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXB1dGVzIHRoZSBpbnZlcnNlIG9mIGEgcXVhdGVybmlvbi5cbiAgICogRm9yIGEgdW5pdCBxdWF0ZXJuaW9uLCB0aGUgaW52ZXJzZSBpcyB0aGUgY29uanVnYXRlIGRpdmlkZWQgYnkgdGhlIHNxdWFyZWQgbWFnbml0dWRlLlxuICAgKiBAcGFyYW0gcXVhdCAtIFRoZSBxdWF0ZXJuaW9uIHRvIGludmVydFxuICAgKiBAcmV0dXJucyBUaGUgaW52ZXJ0ZWQgcXVhdGVybmlvbiwgb3IgemVybyBxdWF0ZXJuaW9uIGlmIGlucHV0IGhhcyB6ZXJvIGxlbmd0aFxuICAgKi9cbiAgc3RhdGljIGludmVydChxdWF0OiBJUXVhdGVybmlvbik6IElRdWF0ZXJuaW9uIHtcbiAgICBjb25zdCBub3JtID0gcXVhdC5sZW5ndGgoKTtcbiAgICBpZiAobm9ybSA9PT0gMC4wKSB7XG4gICAgICByZXR1cm4gdGhpcy5mcm9tQ29weTQoMCwgMCwgMCwgMCkgYXMgSVF1YXRlcm5pb247XG4gICAgfVxuXG4gICAgY29uc3QgeCA9IC1xdWF0Ll92WzBdIC8gbm9ybTtcbiAgICBjb25zdCB5ID0gLXF1YXQuX3ZbMV0gLyBub3JtO1xuICAgIGNvbnN0IHogPSAtcXVhdC5fdlsyXSAvIG5vcm07XG4gICAgY29uc3QgdyA9IHF1YXQuX3ZbM10gLyBub3JtO1xuICAgIHJldHVybiB0aGlzLmZyb21Db3B5NCh4LCB5LCB6LCB3KSBhcyBJUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wdXRlcyB0aGUgaW52ZXJzZSBvZiBhIHF1YXRlcm5pb24gYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIHRoZSBvdXRwdXQgcGFyYW1ldGVyLlxuICAgKiBAcGFyYW0gcXVhdCAtIFRoZSBxdWF0ZXJuaW9uIHRvIGludmVydFxuICAgKiBAcGFyYW0gb3V0IC0gVGhlIG91dHB1dCBxdWF0ZXJuaW9uIHRvIHN0b3JlIHRoZSByZXN1bHRcbiAgICogQHJldHVybnMgVGhlIG91dHB1dCBxdWF0ZXJuaW9uIGNvbnRhaW5pbmcgdGhlIGludmVydGVkIHJlc3VsdFxuICAgKi9cbiAgc3RhdGljIGludmVydFRvKHF1YXQ6IElRdWF0ZXJuaW9uLCBvdXQ6IElNdXRhYmxlUXVhdGVybmlvbik6IElRdWF0ZXJuaW9uIHtcbiAgICBjb25zdCBub3JtID0gcXVhdC5sZW5ndGgoKTtcbiAgICBpZiAobm9ybSA9PT0gMC4wKSB7XG4gICAgICByZXR1cm4gb3V0LnNldENvbXBvbmVudHMoMCwgMCwgMCwgMCk7XG4gICAgfVxuXG4gICAgb3V0Ll92WzBdID0gLXF1YXQuX3ZbMF0gLyBub3JtO1xuICAgIG91dC5fdlsxXSA9IC1xdWF0Ll92WzFdIC8gbm9ybTtcbiAgICBvdXQuX3ZbMl0gPSAtcXVhdC5fdlsyXSAvIG5vcm07XG4gICAgb3V0Ll92WzNdID0gcXVhdC5fdlszXSAvIG5vcm07XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtcyBzcGhlcmljYWwgbGluZWFyIGludGVycG9sYXRpb24gKFNMRVJQKSBiZXR3ZWVuIHR3byBxdWF0ZXJuaW9ucy5cbiAgICogU0xFUlAgcHJvdmlkZXMgc21vb3RoIHJvdGF0aW9uIGludGVycG9sYXRpb24gdGhhdCBtYWludGFpbnMgY29uc3RhbnQgYW5ndWxhciB2ZWxvY2l0eS5cbiAgICogQHBhcmFtIGxfcXVhdCAtIFRoZSBzdGFydGluZyBxdWF0ZXJuaW9uXG4gICAqIEBwYXJhbSByX3F1YXQgLSBUaGUgZW5kaW5nIHF1YXRlcm5pb25cbiAgICogQHBhcmFtIHJhdGlvIC0gVGhlIGludGVycG9sYXRpb24gcGFyYW1ldGVyICgwLjAgPSBsX3F1YXQsIDEuMCA9IHJfcXVhdClcbiAgICogQHJldHVybnMgVGhlIGludGVycG9sYXRlZCBxdWF0ZXJuaW9uXG4gICAqL1xuICBzdGF0aWMgcWxlcnAobF9xdWF0OiBJUXVhdGVybmlvbiwgcl9xdWF0OiBJUXVhdGVybmlvbiwgcmF0aW86IG51bWJlcik6IElRdWF0ZXJuaW9uIHtcbiAgICBsZXQgZG90UHJvZHVjdCA9XG4gICAgICBsX3F1YXQuX3ZbMF0gKiByX3F1YXQuX3ZbMF0gK1xuICAgICAgbF9xdWF0Ll92WzFdICogcl9xdWF0Ll92WzFdICtcbiAgICAgIGxfcXVhdC5fdlsyXSAqIHJfcXVhdC5fdlsyXSArXG4gICAgICBsX3F1YXQuX3ZbM10gKiByX3F1YXQuX3ZbM107XG4gICAgY29uc3Qgc3MgPSAxLjAgLSBkb3RQcm9kdWN0ICogZG90UHJvZHVjdDtcblxuICAgIGlmIChzcyA9PT0gMC4wKSB7XG4gICAgICByZXR1cm4gbF9xdWF0LmNsb25lKCk7XG4gICAgfVxuICAgIGlmIChkb3RQcm9kdWN0ID4gMSkge1xuICAgICAgZG90UHJvZHVjdCA9IDAuOTk5O1xuICAgIH0gZWxzZSBpZiAoZG90UHJvZHVjdCA8IC0xKSB7XG4gICAgICBkb3RQcm9kdWN0ID0gLTAuOTk5O1xuICAgIH1cblxuICAgIGxldCB0aGV0YSA9IE1hdGguYWNvcyhkb3RQcm9kdWN0KTtcbiAgICBjb25zdCBzaW5UaGV0YSA9IE1hdGguc2luKHRoZXRhKTtcblxuICAgIGxldCBzMjogbnVtYmVyO1xuICAgIGlmIChkb3RQcm9kdWN0IDwgMC4wKSB7XG4gICAgICBkb3RQcm9kdWN0ICo9IC0xO1xuICAgICAgdGhldGEgPSBNYXRoLmFjb3MoZG90UHJvZHVjdCk7XG4gICAgICBzMiA9ICgtMSAqIE1hdGguc2luKHRoZXRhICogcmF0aW8pKSAvIHNpblRoZXRhO1xuICAgIH0gZWxzZSB7XG4gICAgICBzMiA9IE1hdGguc2luKHRoZXRhICogcmF0aW8pIC8gc2luVGhldGE7XG4gICAgfVxuICAgIGNvbnN0IHMxID0gTWF0aC5zaW4odGhldGEgKiAoMS4wIC0gcmF0aW8pKSAvIHNpblRoZXRhO1xuXG4gICAgbGV0IHggPSBsX3F1YXQuX3ZbMF0gKiBzMSArIHJfcXVhdC5fdlswXSAqIHMyO1xuICAgIGxldCB5ID0gbF9xdWF0Ll92WzFdICogczEgKyByX3F1YXQuX3ZbMV0gKiBzMjtcbiAgICBsZXQgeiA9IGxfcXVhdC5fdlsyXSAqIHMxICsgcl9xdWF0Ll92WzJdICogczI7XG4gICAgbGV0IHcgPSBsX3F1YXQuX3ZbM10gKiBzMSArIHJfcXVhdC5fdlszXSAqIHMyO1xuXG4gICAgLy8gbm9ybWFsaXplXG4gICAgY29uc3QgbGVuZ3RoID0gTWF0aC5oeXBvdCh4LCB5LCB6LCB3KTtcbiAgICB4ID0geCAvIGxlbmd0aDtcbiAgICB5ID0geSAvIGxlbmd0aDtcbiAgICB6ID0geiAvIGxlbmd0aDtcbiAgICB3ID0gdyAvIGxlbmd0aDtcblxuICAgIHJldHVybiB0aGlzLmZyb21Db3B5NCh4LCB5LCB6LCB3KSBhcyBJUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtcyBzcGhlcmljYWwgbGluZWFyIGludGVycG9sYXRpb24gKFNMRVJQKSBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gdGhlIG91dHB1dCBwYXJhbWV0ZXIuXG4gICAqIEBwYXJhbSBsX3F1YXQgLSBUaGUgc3RhcnRpbmcgcXVhdGVybmlvblxuICAgKiBAcGFyYW0gcl9xdWF0IC0gVGhlIGVuZGluZyBxdWF0ZXJuaW9uXG4gICAqIEBwYXJhbSByYXRpbyAtIFRoZSBpbnRlcnBvbGF0aW9uIHBhcmFtZXRlciAoMC4wID0gbF9xdWF0LCAxLjAgPSByX3F1YXQpXG4gICAqIEBwYXJhbSBvdXQgLSBUaGUgb3V0cHV0IHF1YXRlcm5pb24gdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHF1YXRlcm5pb24gY29udGFpbmluZyB0aGUgaW50ZXJwb2xhdGVkIHJlc3VsdFxuICAgKi9cbiAgc3RhdGljIHFsZXJwVG8obF9xdWF0OiBJUXVhdGVybmlvbiwgcl9xdWF0OiBJUXVhdGVybmlvbiwgcmF0aW86IG51bWJlciwgb3V0OiBJTXV0YWJsZVF1YXRlcm5pb24pIHtcbiAgICBsZXQgZG90UHJvZHVjdCA9XG4gICAgICBsX3F1YXQuX3ZbMF0gKiByX3F1YXQuX3ZbMF0gK1xuICAgICAgbF9xdWF0Ll92WzFdICogcl9xdWF0Ll92WzFdICtcbiAgICAgIGxfcXVhdC5fdlsyXSAqIHJfcXVhdC5fdlsyXSArXG4gICAgICBsX3F1YXQuX3ZbM10gKiByX3F1YXQuX3ZbM107XG4gICAgY29uc3Qgc3MgPSAxLjAgLSBkb3RQcm9kdWN0ICogZG90UHJvZHVjdDtcblxuICAgIGlmIChzcyA9PT0gMC4wKSB7XG4gICAgICByZXR1cm4gb3V0LmNvcHlDb21wb25lbnRzKGxfcXVhdCk7XG4gICAgfVxuICAgIGlmIChkb3RQcm9kdWN0ID4gMSkge1xuICAgICAgZG90UHJvZHVjdCA9IDAuOTk5O1xuICAgIH0gZWxzZSBpZiAoZG90UHJvZHVjdCA8IC0xKSB7XG4gICAgICBkb3RQcm9kdWN0ID0gLTAuOTk5O1xuICAgIH1cblxuICAgIGxldCB0aGV0YSA9IE1hdGguYWNvcyhkb3RQcm9kdWN0KTtcbiAgICBjb25zdCBzaW5UaGV0YSA9IE1hdGguc2luKHRoZXRhKTtcblxuICAgIGxldCBzMjogbnVtYmVyO1xuICAgIGlmIChkb3RQcm9kdWN0IDwgMC4wKSB7XG4gICAgICBkb3RQcm9kdWN0ICo9IC0xO1xuICAgICAgdGhldGEgPSBNYXRoLmFjb3MoZG90UHJvZHVjdCk7XG4gICAgICBzMiA9ICgtMSAqIE1hdGguc2luKHRoZXRhICogcmF0aW8pKSAvIHNpblRoZXRhO1xuICAgIH0gZWxzZSB7XG4gICAgICBzMiA9IE1hdGguc2luKHRoZXRhICogcmF0aW8pIC8gc2luVGhldGE7XG4gICAgfVxuICAgIGNvbnN0IHMxID0gTWF0aC5zaW4odGhldGEgKiAoMS4wIC0gcmF0aW8pKSAvIHNpblRoZXRhO1xuXG4gICAgb3V0Ll92WzBdID0gbF9xdWF0Ll92WzBdICogczEgKyByX3F1YXQuX3ZbMF0gKiBzMjtcbiAgICBvdXQuX3ZbMV0gPSBsX3F1YXQuX3ZbMV0gKiBzMSArIHJfcXVhdC5fdlsxXSAqIHMyO1xuICAgIG91dC5fdlsyXSA9IGxfcXVhdC5fdlsyXSAqIHMxICsgcl9xdWF0Ll92WzJdICogczI7XG4gICAgb3V0Ll92WzNdID0gbF9xdWF0Ll92WzNdICogczEgKyByX3F1YXQuX3ZbM10gKiBzMjtcblxuICAgIHJldHVybiBvdXQubm9ybWFsaXplKCk7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgbGluZWFyIGludGVycG9sYXRpb24gKExFUlApIGJldHdlZW4gdHdvIHF1YXRlcm5pb25zLlxuICAgKiBOb3RlOiBMRVJQIGRvZXMgbm90IG1haW50YWluIGNvbnN0YW50IGFuZ3VsYXIgdmVsb2NpdHkgbGlrZSBTTEVSUC5cbiAgICogQHBhcmFtIGxfcXVhdCAtIFRoZSBzdGFydGluZyBxdWF0ZXJuaW9uXG4gICAqIEBwYXJhbSByX3F1YXQgLSBUaGUgZW5kaW5nIHF1YXRlcm5pb25cbiAgICogQHBhcmFtIHJhdGlvIC0gVGhlIGludGVycG9sYXRpb24gcGFyYW1ldGVyICgwLjAgPSBsX3F1YXQsIDEuMCA9IHJfcXVhdClcbiAgICogQHJldHVybnMgVGhlIGxpbmVhcmx5IGludGVycG9sYXRlZCBxdWF0ZXJuaW9uXG4gICAqL1xuICBzdGF0aWMgbGVycChsX3F1YXQ6IElRdWF0ZXJuaW9uLCByX3F1YXQ6IElRdWF0ZXJuaW9uLCByYXRpbzogbnVtYmVyKSB7XG4gICAgY29uc3QgeCA9IGxfcXVhdC5fdlswXSAqICgxIC0gcmF0aW8pICsgcl9xdWF0Ll92WzBdICogcmF0aW87XG4gICAgY29uc3QgeSA9IGxfcXVhdC5fdlsxXSAqICgxIC0gcmF0aW8pICsgcl9xdWF0Ll92WzFdICogcmF0aW87XG4gICAgY29uc3QgeiA9IGxfcXVhdC5fdlsyXSAqICgxIC0gcmF0aW8pICsgcl9xdWF0Ll92WzJdICogcmF0aW87XG4gICAgY29uc3QgdyA9IGxfcXVhdC5fdlszXSAqICgxIC0gcmF0aW8pICsgcl9xdWF0Ll92WzNdICogcmF0aW87XG4gICAgcmV0dXJuIHRoaXMuZnJvbUNvcHk0KHgsIHksIHosIHcpO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIGxpbmVhciBpbnRlcnBvbGF0aW9uIChMRVJQKSBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gdGhlIG91dHB1dCBwYXJhbWV0ZXIuXG4gICAqIEBwYXJhbSBsX3F1YXQgLSBUaGUgc3RhcnRpbmcgcXVhdGVybmlvblxuICAgKiBAcGFyYW0gcl9xdWF0IC0gVGhlIGVuZGluZyBxdWF0ZXJuaW9uXG4gICAqIEBwYXJhbSByYXRpbyAtIFRoZSBpbnRlcnBvbGF0aW9uIHBhcmFtZXRlciAoMC4wID0gbF9xdWF0LCAxLjAgPSByX3F1YXQpXG4gICAqIEBwYXJhbSBvdXQgLSBUaGUgb3V0cHV0IHF1YXRlcm5pb24gdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHF1YXRlcm5pb24gY29udGFpbmluZyB0aGUgaW50ZXJwb2xhdGVkIHJlc3VsdFxuICAgKi9cbiAgc3RhdGljIGxlcnBUbyhsX3F1YXQ6IElRdWF0ZXJuaW9uLCByX3F1YXQ6IElRdWF0ZXJuaW9uLCByYXRpbzogbnVtYmVyLCBvdXQ6IElNdXRhYmxlUXVhdGVybmlvbikge1xuICAgIG91dC5fdlswXSA9IGxfcXVhdC5fdlswXSAqICgxIC0gcmF0aW8pICsgcl9xdWF0Ll92WzBdICogcmF0aW87XG4gICAgb3V0Ll92WzFdID0gbF9xdWF0Ll92WzFdICogKDEgLSByYXRpbykgKyByX3F1YXQuX3ZbMV0gKiByYXRpbztcbiAgICBvdXQuX3ZbMl0gPSBsX3F1YXQuX3ZbMl0gKiAoMSAtIHJhdGlvKSArIHJfcXVhdC5fdlsyXSAqIHJhdGlvO1xuICAgIG91dC5fdlszXSA9IGxfcXVhdC5fdlszXSAqICgxIC0gcmF0aW8pICsgcl9xdWF0Ll92WzNdICogcmF0aW87XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRlbXB0cyB0byBjcmVhdGUgYSBxdWF0ZXJuaW9uIGZyb20gYW4gYXhpcy1hbmdsZSByZXByZXNlbnRhdGlvbi5cbiAgICpcbiAgICogUmV0dXJucyBudWxsIHdoZW4gdGhlIGF4aXMgaGFzIHplcm8gbGVuZ3RoIChvciBjb250YWlucyBub24tZmluaXRlIHZhbHVlcyksXG4gICAqIGJlY2F1c2Ugc3VjaCBhIHJvdGF0aW9uIGlzIHVuZGVmaW5lZC5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSByb3RhdGlvbiBheGlzICh3aWxsIGJlIG5vcm1hbGl6ZWQgaW50ZXJuYWxseSlcbiAgICogQHBhcmFtIHJhZGlhbiAtIFRoZSByb3RhdGlvbiBhbmdsZSBpbiByYWRpYW5zXG4gICAqIEByZXR1cm5zIEEgcXVhdGVybmlvbiByZXByZXNlbnRpbmcgdGhlIHJvdGF0aW9uIGFyb3VuZCB0aGUgZ2l2ZW4gYXhpcywgb3IgbnVsbFxuICAgKi9cbiAgc3RhdGljIHRyeUF4aXNBbmdsZSh2ZWM6IElWZWN0b3IzLCByYWRpYW46IG51bWJlcik6IFF1YXRlcm5pb24gfCBudWxsIHtcbiAgICBjb25zdCBsZW5ndGggPSB2ZWMubGVuZ3RoKCk7XG4gICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUobGVuZ3RoKSB8fCBsZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGhhbGZBbmdsZSA9IDAuNSAqIHJhZGlhbjtcbiAgICBjb25zdCBzaW4gPSBNYXRoLnNpbihoYWxmQW5nbGUpO1xuXG4gICAgcmV0dXJuIHRoaXMuZnJvbUNvcHk0KFxuICAgICAgKHNpbiAqIHZlYy5fdlswXSkgLyBsZW5ndGgsXG4gICAgICAoc2luICogdmVjLl92WzFdKSAvIGxlbmd0aCxcbiAgICAgIChzaW4gKiB2ZWMuX3ZbMl0pIC8gbGVuZ3RoLFxuICAgICAgTWF0aC5jb3MoaGFsZkFuZ2xlKVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHF1YXRlcm5pb24gZnJvbSBhbiBheGlzLWFuZ2xlIHJlcHJlc2VudGF0aW9uLlxuICAgKlxuICAgKiBJZiB0aGUgYXhpcyBoYXMgemVybyBsZW5ndGgsIGFuIGlkZW50aXR5IHF1YXRlcm5pb24gaXMgcmV0dXJuZWQgaW5zdGVhZCBvZlxuICAgKiBhIHF1YXRlcm5pb24gZmlsbGVkIHdpdGggYEluZmluaXR5YC9gTmFOYC5cbiAgICogVXNlIHtAbGluayBRdWF0ZXJuaW9uLnRyeUF4aXNBbmdsZX0gd2hlbiB0aGUgY2FsbGVyIG5lZWRzIHRvIGRldGVjdCB0aGUgZmFpbHVyZS5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSByb3RhdGlvbiBheGlzICh3aWxsIGJlIG5vcm1hbGl6ZWQgaW50ZXJuYWxseSlcbiAgICogQHBhcmFtIHJhZGlhbiAtIFRoZSByb3RhdGlvbiBhbmdsZSBpbiByYWRpYW5zXG4gICAqIEByZXR1cm5zIEEgcXVhdGVybmlvbiByZXByZXNlbnRpbmcgdGhlIHJvdGF0aW9uIGFyb3VuZCB0aGUgZ2l2ZW4gYXhpcyxcbiAgICogICAgICAgICAgb3IgdGhlIGlkZW50aXR5IHF1YXRlcm5pb24gaWYgdGhlIGF4aXMgaXMgZGVnZW5lcmF0ZVxuICAgKi9cbiAgc3RhdGljIGF4aXNBbmdsZSh2ZWM6IElWZWN0b3IzLCByYWRpYW46IG51bWJlcik6IFF1YXRlcm5pb24ge1xuICAgIGNvbnN0IHF1YXQgPSB0aGlzLnRyeUF4aXNBbmdsZSh2ZWMsIHJhZGlhbik7XG4gICAgaWYgKHF1YXQgIT09IG51bGwpIHtcbiAgICAgIHJldHVybiBxdWF0O1xuICAgIH1cblxuICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCd0aGUgcm90YXRpb24gYXhpcyBoYXMgemVybyBsZW5ndGguIFJldHVybmluZyBhbiBpZGVudGl0eSBxdWF0ZXJuaW9uIGluc3RlYWQuJyk7XG4gICAgcmV0dXJuIHRoaXMuZnJvbUNvcHk0KDAsIDAsIDAsIDEpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvcmUgaW1wbGVtZW50YXRpb24gZm9yIGV4dHJhY3RpbmcgYSBxdWF0ZXJuaW9uIGZyb20gYSA0eDQgbWF0cml4LlxuICAgKiBXcml0ZXMgdGhlIHgsIHksIHosIHcgY29tcG9uZW50cyBpbnRvIGBvdXRWYC5cbiAgICpcbiAgICogVGhlIHJvdGF0aW9uIHBhcnQgaXMgbm9ybWFsaXplZCBieSBpdHMgY29sdW1uIGxlbmd0aHMgc28gdGhhdCBzY2FsZSBhbmRcbiAgICogdHJhbnNsYXRpb24gYXJlIGlnbm9yZWQuIEV4dHJhY3Rpb24gaXMgaW1wb3NzaWJsZSAoYW5kIHRoZSByZXN1bHQgd291bGQgYmVcbiAgICogYE5hTmApIHdoZW4gYSBiYXNpcyB2ZWN0b3IgaGFzIHplcm8gbGVuZ3RoLCB3aGVuIHRoZSBsaW5lYXIgcGFydCBpc1xuICAgKiBudW1lcmljYWxseSBzaW5ndWxhciwgb3Igd2hlbiB0aGUgbWF0cml4IGNvbnRhaW5zIG5vbi1maW5pdGUgdmFsdWVzLlxuICAgKlxuICAgKiBAcGFyYW0gbWF0IC0gVGhlIDR4NCBtYXRyaXggY29udGFpbmluZyByb3RhdGlvbiBpbmZvcm1hdGlvblxuICAgKiBAcGFyYW0gb3V0ViAtIFRoZSBkZXN0aW5hdGlvbiBmb3IgdGhlIHgsIHksIHosIHcgY29tcG9uZW50c1xuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBxdWF0ZXJuaW9uIGNvdWxkIGJlIGV4dHJhY3RlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2Zyb21NYXRyaXhUb1R5cGVkQXJyYXkobWF0OiBJTWF0cml4NDQsIG91dFY6IFR5cGVkQXJyYXkpOiBib29sZWFuIHtcbiAgICBjb25zdCBzeFJhdyA9IE1hdGguaHlwb3QobWF0Lm0wMCwgbWF0Lm0xMCwgbWF0Lm0yMCk7XG4gICAgY29uc3Qgc3kgPSBNYXRoLmh5cG90KG1hdC5tMDEsIG1hdC5tMTEsIG1hdC5tMjEpO1xuICAgIGNvbnN0IHN6ID0gTWF0aC5oeXBvdChtYXQubTAyLCBtYXQubTEyLCBtYXQubTIyKTtcblxuICAgIGNvbnN0IGRldCA9IG1hdC5kZXRlcm1pbmFudCgpO1xuXG4gICAgLy8gVGhlIHByb2R1Y3Qgb2YgdGhlIGNvbHVtbiBub3JtcyBpcyBhbiB1cHBlciBib3VuZCBvZiB8ZGV0fCAoSGFkYW1hcmQnc1xuICAgIC8vIGluZXF1YWxpdHkpLCBzbyBpdCB3b3JrcyBhcyBhIHNjYWxlIHJlZmVyZW5jZSBmb3IgdGhlIHNpbmd1bGFyaXR5IHRlc3QuXG4gICAgLy8gVGhpcyBhbHNvIGNvdmVycyB6ZXJvLWxlbmd0aCBiYXNpcyB2ZWN0b3JzIGFuZCBub24tZmluaXRlIGlucHV0LCB3aGljaFxuICAgIC8vIHdvdWxkIG90aGVyd2lzZSB0dXJuIGludG8gSW5maW5pdHkvTmFOIHRocm91Z2ggdGhlIG5vcm1hbGl6YXRpb24gYmVsb3cuXG4gICAgaWYgKE1hdGhVdGlsLmlzU2luZ3VsYXJEZXQoZGV0LCBzeFJhdyAqIHN5ICogc3osIE1hdGhVdGlsLmdldFNpbmd1bGFyRXBzaWxvbih0aGlzLl90eXBlLkJZVEVTX1BFUl9FTEVNRU5UKSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBzeCA9IGRldCA8IDAgPyAtc3hSYXcgOiBzeFJhdztcblxuICAgIGNvbnN0IG0gPSBNdXRhYmxlTWF0cml4NDQuZnJvbUNvcHlNYXRyaXg0NChtYXQpO1xuXG4gICAgY29uc3QgaW52U3ggPSAxIC8gc3g7XG4gICAgY29uc3QgaW52U3kgPSAxIC8gc3k7XG4gICAgY29uc3QgaW52U3ogPSAxIC8gc3o7XG5cbiAgICBtLm0wMCAqPSBpbnZTeDtcbiAgICBtLm0xMCAqPSBpbnZTeDtcbiAgICBtLm0yMCAqPSBpbnZTeDtcblxuICAgIG0ubTAxICo9IGludlN5O1xuICAgIG0ubTExICo9IGludlN5O1xuICAgIG0ubTIxICo9IGludlN5O1xuXG4gICAgbS5tMDIgKj0gaW52U3o7XG4gICAgbS5tMTIgKj0gaW52U3o7XG4gICAgbS5tMjIgKj0gaW52U3o7XG5cbiAgICBjb25zdCB0cmFjZSA9IG0ubTAwICsgbS5tMTEgKyBtLm0yMjtcblxuICAgIGlmICh0cmFjZSA+IDApIHtcbiAgICAgIGNvbnN0IFMgPSAwLjUgLyBNYXRoLnNxcnQodHJhY2UgKyAxLjApO1xuICAgICAgb3V0VlswXSA9IChtLm0yMSAtIG0ubTEyKSAqIFM7XG4gICAgICBvdXRWWzFdID0gKG0ubTAyIC0gbS5tMjApICogUztcbiAgICAgIG91dFZbMl0gPSAobS5tMTAgLSBtLm0wMSkgKiBTO1xuICAgICAgb3V0VlszXSA9IDAuMjUgLyBTO1xuICAgIH0gZWxzZSBpZiAobS5tMDAgPiBtLm0xMSAmJiBtLm0wMCA+IG0ubTIyKSB7XG4gICAgICBjb25zdCBTID0gTWF0aC5zcXJ0KDEuMCArIG0ubTAwIC0gbS5tMTEgLSBtLm0yMikgKiAyO1xuICAgICAgb3V0VlswXSA9IDAuMjUgKiBTO1xuICAgICAgb3V0VlsxXSA9IChtLm0wMSArIG0ubTEwKSAvIFM7XG4gICAgICBvdXRWWzJdID0gKG0ubTAyICsgbS5tMjApIC8gUztcbiAgICAgIG91dFZbM10gPSAobS5tMjEgLSBtLm0xMikgLyBTO1xuICAgIH0gZWxzZSBpZiAobS5tMTEgPiBtLm0yMikge1xuICAgICAgY29uc3QgUyA9IE1hdGguc3FydCgxLjAgKyBtLm0xMSAtIG0ubTAwIC0gbS5tMjIpICogMjtcbiAgICAgIG91dFZbMF0gPSAobS5tMDEgKyBtLm0xMCkgLyBTO1xuICAgICAgb3V0VlsxXSA9IDAuMjUgKiBTO1xuICAgICAgb3V0VlsyXSA9IChtLm0xMiArIG0ubTIxKSAvIFM7XG4gICAgICBvdXRWWzNdID0gKG0ubTAyIC0gbS5tMjApIC8gUztcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgUyA9IE1hdGguc3FydCgxLjAgKyBtLm0yMiAtIG0ubTAwIC0gbS5tMTEpICogMjtcbiAgICAgIG91dFZbMF0gPSAobS5tMDIgKyBtLm0yMCkgLyBTO1xuICAgICAgb3V0VlsxXSA9IChtLm0xMiArIG0ubTIxKSAvIFM7XG4gICAgICBvdXRWWzJdID0gMC4yNSAqIFM7XG4gICAgICBvdXRWWzNdID0gKG0ubTEwIC0gbS5tMDEpIC8gUztcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRlbXB0cyB0byBjcmVhdGUgYSBxdWF0ZXJuaW9uIGZyb20gYSA0eDQgcm90YXRpb24gbWF0cml4LlxuICAgKiBFeHRyYWN0cyB0aGUgcm90YXRpb24gY29tcG9uZW50IGZyb20gdGhlIG1hdHJpeCBhbmQgY29udmVydHMgaXQgdG8gcXVhdGVybmlvbiBmb3JtLlxuICAgKlxuICAgKiBAcGFyYW0gbWF0IC0gVGhlIDR4NCBtYXRyaXggY29udGFpbmluZyByb3RhdGlvbiBpbmZvcm1hdGlvblxuICAgKiBAcmV0dXJucyBBIHF1YXRlcm5pb24gcmVwcmVzZW50aW5nIHRoZSBzYW1lIHJvdGF0aW9uIGFzIHRoZSBtYXRyaXgsIG9yIG51bGxcbiAgICogICAgICAgICAgaWYgdGhlIHJvdGF0aW9uIGNhbm5vdCBiZSBleHRyYWN0ZWQgKHplcm8tbGVuZ3RoIGJhc2lzIHZlY3RvcixcbiAgICogICAgICAgICAgbnVtZXJpY2FsbHkgc2luZ3VsYXIgbGluZWFyIHBhcnQsIG9yIG5vbi1maW5pdGUgdmFsdWVzKVxuICAgKi9cbiAgc3RhdGljIHRyeUZyb21NYXRyaXgobWF0OiBJTWF0cml4NDQpOiBRdWF0ZXJuaW9uIHwgbnVsbCB7XG4gICAgY29uc3Qgb3V0ViA9IG5ldyB0aGlzLl90eXBlKDQpO1xuICAgIGlmICghdGhpcy5fX2Zyb21NYXRyaXhUb1R5cGVkQXJyYXkobWF0LCBvdXRWKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZnJvbUNvcHk0KG91dFZbMF0sIG91dFZbMV0sIG91dFZbMl0sIG91dFZbM10pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBxdWF0ZXJuaW9uIGZyb20gYSA0eDQgcm90YXRpb24gbWF0cml4LlxuICAgKiBFeHRyYWN0cyB0aGUgcm90YXRpb24gY29tcG9uZW50IGZyb20gdGhlIG1hdHJpeCBhbmQgY29udmVydHMgaXQgdG8gcXVhdGVybmlvbiBmb3JtLlxuICAgKlxuICAgKiBJZiB0aGUgcm90YXRpb24gY2Fubm90IGJlIGV4dHJhY3RlZCwgYW4gaWRlbnRpdHkgcXVhdGVybmlvbiBpcyByZXR1cm5lZFxuICAgKiBpbnN0ZWFkIG9mIGEgcXVhdGVybmlvbiBmaWxsZWQgd2l0aCBgSW5maW5pdHlgL2BOYU5gLlxuICAgKiBVc2Uge0BsaW5rIFF1YXRlcm5pb24udHJ5RnJvbU1hdHJpeH0gd2hlbiB0aGUgY2FsbGVyIG5lZWRzIHRvIGRldGVjdCB0aGUgZmFpbHVyZS5cbiAgICpcbiAgICogQHBhcmFtIG1hdCAtIFRoZSA0eDQgbWF0cml4IGNvbnRhaW5pbmcgcm90YXRpb24gaW5mb3JtYXRpb25cbiAgICogQHJldHVybnMgQSBxdWF0ZXJuaW9uIHJlcHJlc2VudGluZyB0aGUgc2FtZSByb3RhdGlvbiBhcyB0aGUgbWF0cml4LFxuICAgKiAgICAgICAgICBvciB0aGUgaWRlbnRpdHkgcXVhdGVybmlvbiBpZiB0aGUgcm90YXRpb24gY2Fubm90IGJlIGV4dHJhY3RlZFxuICAgKi9cbiAgc3RhdGljIGZyb21NYXRyaXgobWF0OiBJTWF0cml4NDQpOiBRdWF0ZXJuaW9uIHtcbiAgICBjb25zdCBxdWF0ID0gdGhpcy50cnlGcm9tTWF0cml4KG1hdCk7XG4gICAgaWYgKHF1YXQgIT09IG51bGwpIHtcbiAgICAgIHJldHVybiBxdWF0O1xuICAgIH1cblxuICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKFxuICAgICAgJ3RoZSByb3RhdGlvbiBjYW5ub3QgYmUgZXh0cmFjdGVkIGZyb20gdGhlIG1hdHJpeCAoaXQgaXMgc2luZ3VsYXIgb3IgY29udGFpbnMgbm9uLWZpbml0ZSB2YWx1ZXMpLiBSZXR1cm5pbmcgYW4gaWRlbnRpdHkgcXVhdGVybmlvbiBpbnN0ZWFkLidcbiAgICApO1xuICAgIHJldHVybiB0aGlzLmZyb21Db3B5NCgwLCAwLCAwLCAxKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRlbXB0cyB0byBjcmVhdGUgYSBxdWF0ZXJuaW9uIGZyb20gYSA0eDQgcm90YXRpb24gbWF0cml4IGFuZCBzdG9yZXMgaXQgaW4gdGhlIG91dHB1dCBwYXJhbWV0ZXIuXG4gICAqIFRoZSBvdXRwdXQgcXVhdGVybmlvbiBpcyBsZWZ0IHVudG91Y2hlZCB3aGVuIHRoZSByb3RhdGlvbiBjYW5ub3QgYmUgZXh0cmFjdGVkLlxuICAgKlxuICAgKiBAcGFyYW0gbWF0IC0gVGhlIDR4NCBtYXRyaXggY29udGFpbmluZyByb3RhdGlvbiBpbmZvcm1hdGlvblxuICAgKiBAcGFyYW0gb3V0IC0gVGhlIG91dHB1dCBxdWF0ZXJuaW9uIHRvIHN0b3JlIHRoZSByZXN1bHRcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgcXVhdGVybmlvbiBjb3VsZCBiZSBleHRyYWN0ZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIHRyeUZyb21NYXRyaXhUbyhtYXQ6IElNYXRyaXg0NCwgb3V0OiBJTXV0YWJsZVF1YXRlcm5pb24pOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fX2Zyb21NYXRyaXhUb1R5cGVkQXJyYXkobWF0LCBvdXQuX3YpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBxdWF0ZXJuaW9uIGZyb20gYSA0eDQgcm90YXRpb24gbWF0cml4IGFuZCBzdG9yZXMgaXQgaW4gdGhlIG91dHB1dCBwYXJhbWV0ZXIuXG4gICAqXG4gICAqIElmIHRoZSByb3RhdGlvbiBjYW5ub3QgYmUgZXh0cmFjdGVkLCB0aGUgb3V0cHV0IHF1YXRlcm5pb24gaXMgc2V0IHRvIHRoZVxuICAgKiBpZGVudGl0eSBxdWF0ZXJuaW9uIGluc3RlYWQgb2YgYmVpbmcgZmlsbGVkIHdpdGggYEluZmluaXR5YC9gTmFOYC5cbiAgICogVXNlIHtAbGluayBRdWF0ZXJuaW9uLnRyeUZyb21NYXRyaXhUb30gd2hlbiB0aGUgY2FsbGVyIG5lZWRzIHRvIGRldGVjdCB0aGUgZmFpbHVyZS5cbiAgICpcbiAgICogQHBhcmFtIG1hdCAtIFRoZSA0eDQgbWF0cml4IGNvbnRhaW5pbmcgcm90YXRpb24gaW5mb3JtYXRpb25cbiAgICogQHBhcmFtIG91dCAtIFRoZSBvdXRwdXQgcXVhdGVybmlvbiB0byBzdG9yZSB0aGUgcmVzdWx0XG4gICAqIEByZXR1cm5zIFRoZSBvdXRwdXQgcXVhdGVybmlvbiBjb250YWluaW5nIHRoZSBleHRyYWN0ZWQgcm90YXRpb24sXG4gICAqICAgICAgICAgIG9yIHRoZSBpZGVudGl0eSBxdWF0ZXJuaW9uIGlmIHRoZSByb3RhdGlvbiBjYW5ub3QgYmUgZXh0cmFjdGVkXG4gICAqL1xuICBzdGF0aWMgZnJvbU1hdHJpeFRvKG1hdDogSU1hdHJpeDQ0LCBvdXQ6IElNdXRhYmxlUXVhdGVybmlvbik6IElNdXRhYmxlUXVhdGVybmlvbiB7XG4gICAgaWYgKHRoaXMudHJ5RnJvbU1hdHJpeFRvKG1hdCwgb3V0KSkge1xuICAgICAgcmV0dXJuIG91dDtcbiAgICB9XG5cbiAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcihcbiAgICAgICd0aGUgcm90YXRpb24gY2Fubm90IGJlIGV4dHJhY3RlZCBmcm9tIHRoZSBtYXRyaXggKGl0IGlzIHNpbmd1bGFyIG9yIGNvbnRhaW5zIG5vbi1maW5pdGUgdmFsdWVzKS4gUmV0dXJuaW5nIGFuIGlkZW50aXR5IHF1YXRlcm5pb24gaW5zdGVhZC4nXG4gICAgKTtcbiAgICBvdXQuX3ZbMF0gPSAwO1xuICAgIG91dC5fdlsxXSA9IDA7XG4gICAgb3V0Ll92WzJdID0gMDtcbiAgICBvdXQuX3ZbM10gPSAxO1xuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHF1YXRlcm5pb24gdGhhdCByb3RhdGVzIGZyb20gb25lIGRpcmVjdGlvbiB0byBhbm90aGVyLlxuICAgKiBAcGFyYW0gZnJvbURpcmVjdGlvbiAtIFRoZSBpbml0aWFsIGRpcmVjdGlvbiB2ZWN0b3JcbiAgICogQHBhcmFtIHRvRGlyZWN0aW9uIC0gVGhlIHRhcmdldCBkaXJlY3Rpb24gdmVjdG9yXG4gICAqIEByZXR1cm5zIEEgcXVhdGVybmlvbiByZXByZXNlbnRpbmcgdGhlIHJvdGF0aW9uIGZyb20gZnJvbURpcmVjdGlvbiB0byB0b0RpcmVjdGlvblxuICAgKi9cbiAgc3RhdGljIGxvb2tGcm9tVG8oZnJvbURpcmVjdGlvbjogSVZlY3RvcjMsIHRvRGlyZWN0aW9uOiBJVmVjdG9yMyk6IElRdWF0ZXJuaW9uIHtcbiAgICBpZiAoZnJvbURpcmVjdGlvbi5pc0VxdWFsKHRvRGlyZWN0aW9uKSkge1xuICAgICAgcmV0dXJuIHRoaXMuZnJvbUNvcHk0KDAsIDAsIDAsIDEpIGFzIElRdWF0ZXJuaW9uO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5xbGVycCh0aGlzLmxvb2tGb3J3YXJkKGZyb21EaXJlY3Rpb24pLCB0aGlzLmxvb2tGb3J3YXJkKHRvRGlyZWN0aW9uKSwgMSk7XG4gIH1cblxuICAvKipcbiAgICogQXR0ZW1wdHMgdG8gY3JlYXRlIGEgcXVhdGVybmlvbiB0aGF0IGxvb2tzIGluIHRoZSBzcGVjaWZpZWQgZm9yd2FyZCBkaXJlY3Rpb24gdXNpbmcgZGVmYXVsdCB1cCB2ZWN0b3IgKDAsIDEsIDApLlxuICAgKiBAcGFyYW0gZm9yd2FyZCAtIFRoZSBmb3J3YXJkIGRpcmVjdGlvbiB2ZWN0b3JcbiAgICogQHJldHVybnMgQSBxdWF0ZXJuaW9uIHJlcHJlc2VudGluZyB0aGUgbG9vayByb3RhdGlvbiwgb3IgbnVsbCBpZiB0aGUgZGlyZWN0aW9uIGlzIGRlZ2VuZXJhdGVcbiAgICovXG4gIHN0YXRpYyB0cnlMb29rRm9yd2FyZChmb3J3YXJkOiBJVmVjdG9yMyk6IFF1YXRlcm5pb24gfCBudWxsIHtcbiAgICBpZiAodGhpcy5fX3RtcF91cFZlYyA9PSBudWxsKSB7XG4gICAgICB0aGlzLl9fdG1wX3VwVmVjID0gbmV3IChmb3J3YXJkLmNvbnN0cnVjdG9yIGFzIGFueSkoMCwgMSwgMCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMudHJ5TG9va0ZvcndhcmRBY2NvcmRpbmdUb1RoaXNVcChmb3J3YXJkLCB0aGlzLl9fdG1wX3VwVmVjKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcXVhdGVybmlvbiB0aGF0IGxvb2tzIGluIHRoZSBzcGVjaWZpZWQgZm9yd2FyZCBkaXJlY3Rpb24gdXNpbmcgZGVmYXVsdCB1cCB2ZWN0b3IgKDAsIDEsIDApLlxuICAgKlxuICAgKiBJZiB0aGUgZGlyZWN0aW9uIGlzIGRlZ2VuZXJhdGUgKHplcm8gbGVuZ3RoKSwgYW4gaWRlbnRpdHkgcXVhdGVybmlvbiBpc1xuICAgKiByZXR1cm5lZCBpbnN0ZWFkIG9mIGEgcXVhdGVybmlvbiBmaWxsZWQgd2l0aCBgSW5maW5pdHlgL2BOYU5gLlxuICAgKiBVc2Uge0BsaW5rIFF1YXRlcm5pb24udHJ5TG9va0ZvcndhcmR9IHdoZW4gdGhlIGNhbGxlciBuZWVkcyB0byBkZXRlY3QgdGhlIGZhaWx1cmUuXG4gICAqXG4gICAqIEBwYXJhbSBmb3J3YXJkIC0gVGhlIGZvcndhcmQgZGlyZWN0aW9uIHZlY3RvclxuICAgKiBAcmV0dXJucyBBIHF1YXRlcm5pb24gcmVwcmVzZW50aW5nIHRoZSBsb29rIHJvdGF0aW9uLFxuICAgKiAgICAgICAgICBvciB0aGUgaWRlbnRpdHkgcXVhdGVybmlvbiBpZiB0aGUgZGlyZWN0aW9uIGlzIGRlZ2VuZXJhdGVcbiAgICovXG4gIHN0YXRpYyBsb29rRm9yd2FyZChmb3J3YXJkOiBJVmVjdG9yMyk6IFF1YXRlcm5pb24ge1xuICAgIGNvbnN0IHF1YXQgPSB0aGlzLnRyeUxvb2tGb3J3YXJkKGZvcndhcmQpO1xuICAgIGlmIChxdWF0ICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gcXVhdDtcbiAgICB9XG5cbiAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcigndGhlIGZvcndhcmQgZGlyZWN0aW9uIGhhcyB6ZXJvIGxlbmd0aC4gUmV0dXJuaW5nIGFuIGlkZW50aXR5IHF1YXRlcm5pb24gaW5zdGVhZC4nKTtcbiAgICByZXR1cm4gdGhpcy5mcm9tQ29weTQoMCwgMCwgMCwgMSk7XG4gIH1cblxuICAvKipcbiAgICogQXR0ZW1wdHMgdG8gY3JlYXRlIGEgcXVhdGVybmlvbiB0aGF0IGxvb2tzIGluIHRoZSBzcGVjaWZpZWQgZm9yd2FyZCBkaXJlY3Rpb24gd2l0aCBhIGN1c3RvbSB1cCB2ZWN0b3IuXG4gICAqXG4gICAqIFJldHVybnMgbnVsbCB3aGVuIGVpdGhlciBkaXJlY3Rpb24gaGFzIHplcm8gbGVuZ3RoIG9yIHdoZW4gdGhlIGZvcndhcmQgYW5kXG4gICAqIHVwIGRpcmVjdGlvbnMgYXJlIHBhcmFsbGVsLCBiZWNhdXNlIHRoZSByb3RhdGlvbiBiYXNpcyBjYW5ub3QgYmUgYnVpbHQuXG4gICAqXG4gICAqIEBwYXJhbSBmb3J3YXJkIC0gVGhlIGZvcndhcmQgZGlyZWN0aW9uIHZlY3RvclxuICAgKiBAcGFyYW0gdXAgLSBUaGUgdXAgZGlyZWN0aW9uIHZlY3RvclxuICAgKiBAcmV0dXJucyBBIHF1YXRlcm5pb24gcmVwcmVzZW50aW5nIHRoZSBsb29rIHJvdGF0aW9uLCBvciBudWxsXG4gICAqL1xuICBzdGF0aWMgdHJ5TG9va0ZvcndhcmRBY2NvcmRpbmdUb1RoaXNVcChmb3J3YXJkOiBJVmVjdG9yMywgdXA6IElWZWN0b3IzKTogUXVhdGVybmlvbiB8IG51bGwge1xuICAgIGNvbnN0IGZvcndhcmRMZW5ndGggPSBmb3J3YXJkLmxlbmd0aCgpO1xuICAgIGNvbnN0IHVwTGVuZ3RoID0gdXAubGVuZ3RoKCk7XG4gICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoZm9yd2FyZExlbmd0aCkgfHwgIU51bWJlci5pc0Zpbml0ZSh1cExlbmd0aCkgfHwgZm9yd2FyZExlbmd0aCA9PT0gMCB8fCB1cExlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgZm9yd2FyZFggPSBmb3J3YXJkLl92WzBdIC8gZm9yd2FyZExlbmd0aDtcbiAgICBjb25zdCBmb3J3YXJkWSA9IGZvcndhcmQuX3ZbMV0gLyBmb3J3YXJkTGVuZ3RoO1xuICAgIGNvbnN0IGZvcndhcmRaID0gZm9yd2FyZC5fdlsyXSAvIGZvcndhcmRMZW5ndGg7XG5cbiAgICBjb25zdCB1cFggPSB1cC5fdlswXSAvIHVwTGVuZ3RoO1xuICAgIGNvbnN0IHVwWSA9IHVwLl92WzFdIC8gdXBMZW5ndGg7XG4gICAgY29uc3QgdXBaID0gdXAuX3ZbMl0gLyB1cExlbmd0aDtcblxuICAgIC8vIFZlY3RvcjMuY3Jvc3ModXAsIGZvcndhcmQpXG4gICAgbGV0IHJpZ2h0WCA9IHVwLl92WzFdICogZm9yd2FyZC5fdlsyXSAtIHVwLl92WzJdICogZm9yd2FyZC5fdlsxXTtcbiAgICBsZXQgcmlnaHRZID0gdXAuX3ZbMl0gKiBmb3J3YXJkLl92WzBdIC0gdXAuX3ZbMF0gKiBmb3J3YXJkLl92WzJdO1xuICAgIGxldCByaWdodFogPSB1cC5fdlswXSAqIGZvcndhcmQuX3ZbMV0gLSB1cC5fdlsxXSAqIGZvcndhcmQuX3ZbMF07XG5cbiAgICBjb25zdCByaWdodExlbmd0aCA9IE1hdGguaHlwb3QocmlnaHRYLCByaWdodFksIHJpZ2h0Wik7XG4gICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUocmlnaHRMZW5ndGgpIHx8IHJpZ2h0TGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmlnaHRYIC89IHJpZ2h0TGVuZ3RoO1xuICAgIHJpZ2h0WSAvPSByaWdodExlbmd0aDtcbiAgICByaWdodFogLz0gcmlnaHRMZW5ndGg7XG5cbiAgICBjb25zdCBtMDAgPSByaWdodFg7XG4gICAgY29uc3QgbTAxID0gcmlnaHRZO1xuICAgIGNvbnN0IG0wMiA9IHJpZ2h0WjtcbiAgICBjb25zdCBtMTAgPSB1cFg7XG4gICAgY29uc3QgbTExID0gdXBZO1xuICAgIGNvbnN0IG0xMiA9IHVwWjtcbiAgICBjb25zdCBtMjAgPSBmb3J3YXJkWDtcbiAgICBjb25zdCBtMjEgPSBmb3J3YXJkWTtcbiAgICBjb25zdCBtMjIgPSBmb3J3YXJkWjtcblxuICAgIGNvbnN0IG51bTggPSBtMDAgKyBtMTEgKyBtMjI7XG4gICAgaWYgKG51bTggPiAwKSB7XG4gICAgICBjb25zdCBudW0gPSBNYXRoLnNxcnQobnVtOCArIDEpO1xuICAgICAgY29uc3QgbnVtMiA9IDAuNSAvIG51bTtcbiAgICAgIHJldHVybiB0aGlzLmZyb21Db3B5NCgobTEyIC0gbTIxKSAqIG51bTIsIChtMjAgLSBtMDIpICogbnVtMiwgKG0wMSAtIG0xMCkgKiBudW0yLCBudW0gKiAwLjUpO1xuICAgIH1cbiAgICBpZiAobTAwID49IG0xMSAmJiBtMDAgPj0gbTIyKSB7XG4gICAgICBjb25zdCBudW03ID0gTWF0aC5zcXJ0KDEgKyBtMDAgLSBtMTEgLSBtMjIpO1xuICAgICAgY29uc3QgbnVtNCA9IDAuNSAvIG51bTc7XG4gICAgICByZXR1cm4gdGhpcy5mcm9tQ29weTQoMC41ICogbnVtNywgKG0wMSArIG0xMCkgKiBudW00LCAobTAyICsgbTIwKSAqIG51bTQsIChtMTIgLSBtMjEpICogbnVtNCk7XG4gICAgfVxuICAgIGlmIChtMTEgPiBtMjIpIHtcbiAgICAgIGNvbnN0IG51bTYgPSBNYXRoLnNxcnQoMSArIG0xMSAtIG0wMCAtIG0yMik7XG4gICAgICBjb25zdCBudW0zID0gMC41IC8gbnVtNjtcbiAgICAgIHJldHVybiB0aGlzLmZyb21Db3B5NCgobTEwICsgbTAxKSAqIG51bTMsIDAuNSAqIG51bTYsIChtMjEgKyBtMTIpICogbnVtMywgKG0yMCAtIG0wMikgKiBudW0zKTtcbiAgICB9XG4gICAgY29uc3QgbnVtNSA9IE1hdGguc3FydCgxICsgbTIyIC0gbTAwIC0gbTExKTtcbiAgICBjb25zdCBudW0yID0gMC41IC8gbnVtNTtcbiAgICByZXR1cm4gdGhpcy5mcm9tQ29weTQoKG0yMCArIG0wMikgKiBudW0yLCAobTIxICsgbTEyKSAqIG51bTIsIDAuNSAqIG51bTUsIChtMDEgLSBtMTApICogbnVtMik7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHF1YXRlcm5pb24gdGhhdCBsb29rcyBpbiB0aGUgc3BlY2lmaWVkIGZvcndhcmQgZGlyZWN0aW9uIHdpdGggYSBjdXN0b20gdXAgdmVjdG9yLlxuICAgKlxuICAgKiBJZiB0aGUgZGlyZWN0aW9ucyBhcmUgZGVnZW5lcmF0ZSAoemVybyBsZW5ndGgsIG9yIGZvcndhcmQgcGFyYWxsZWwgdG8gdXApLFxuICAgKiBhbiBpZGVudGl0eSBxdWF0ZXJuaW9uIGlzIHJldHVybmVkIGluc3RlYWQgb2YgYSBxdWF0ZXJuaW9uIGZpbGxlZCB3aXRoXG4gICAqIGBJbmZpbml0eWAvYE5hTmAuXG4gICAqIFVzZSB7QGxpbmsgUXVhdGVybmlvbi50cnlMb29rRm9yd2FyZEFjY29yZGluZ1RvVGhpc1VwfSB3aGVuIHRoZSBjYWxsZXIgbmVlZHNcbiAgICogdG8gZGV0ZWN0IHRoZSBmYWlsdXJlLlxuICAgKlxuICAgKiBAcGFyYW0gZm9yd2FyZCAtIFRoZSBmb3J3YXJkIGRpcmVjdGlvbiB2ZWN0b3JcbiAgICogQHBhcmFtIHVwIC0gVGhlIHVwIGRpcmVjdGlvbiB2ZWN0b3JcbiAgICogQHJldHVybnMgQSBxdWF0ZXJuaW9uIHJlcHJlc2VudGluZyB0aGUgbG9vayByb3RhdGlvbiB3aXRoIHRoZSBzcGVjaWZpZWQgdXAgdmVjdG9yLFxuICAgKiAgICAgICAgICBvciB0aGUgaWRlbnRpdHkgcXVhdGVybmlvbiBpZiB0aGUgZGlyZWN0aW9ucyBhcmUgZGVnZW5lcmF0ZVxuICAgKi9cbiAgc3RhdGljIGxvb2tGb3J3YXJkQWNjb3JkaW5nVG9UaGlzVXAoZm9yd2FyZDogSVZlY3RvcjMsIHVwOiBJVmVjdG9yMyk6IElRdWF0ZXJuaW9uIHtcbiAgICBjb25zdCBxdWF0ID0gdGhpcy50cnlMb29rRm9yd2FyZEFjY29yZGluZ1RvVGhpc1VwKGZvcndhcmQsIHVwKTtcbiAgICBpZiAocXVhdCAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHF1YXQ7XG4gICAgfVxuXG4gICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoXG4gICAgICAndGhlIGZvcndhcmQvdXAgZGlyZWN0aW9ucyBhcmUgZGVnZW5lcmF0ZSAoemVybyBsZW5ndGggb3IgcGFyYWxsZWwpLiBSZXR1cm5pbmcgYW4gaWRlbnRpdHkgcXVhdGVybmlvbiBpbnN0ZWFkLidcbiAgICApO1xuICAgIHJldHVybiB0aGlzLmZyb21Db3B5NCgwLCAwLCAwLCAxKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcXVhdGVybmlvbiBmcm9tIGEgcG9zaXRpb24gdmVjdG9yLCB3aXRoIHcgY29tcG9uZW50IHNldCB0byAwLlxuICAgKiBUaGlzIGlzIHVzZWZ1bCBmb3IgcmVwcmVzZW50aW5nIHB1cmUgdHJhbnNsYXRpb25zIGluIHF1YXRlcm5pb24gZm9ybS5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSBwb3NpdGlvbiB2ZWN0b3JcbiAgICogQHJldHVybnMgQSBxdWF0ZXJuaW9uIHdpdGggeHl6IGZyb20gdGhlIHZlY3RvciBhbmQgdz0wXG4gICAqL1xuICBzdGF0aWMgZnJvbVBvc2l0aW9uKHZlYzogSVZlY3RvcjMpIHtcbiAgICByZXR1cm4gdGhpcy5mcm9tQ29weTQodmVjLl92WzBdLCB2ZWMuX3ZbMV0sIHZlYy5fdlsyXSwgMCk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0d28gcXVhdGVybmlvbnMgY29tcG9uZW50LXdpc2UuXG4gICAqIEBwYXJhbSBsX3F1YXQgLSBUaGUgbGVmdCBxdWF0ZXJuaW9uXG4gICAqIEBwYXJhbSByX3F1YXQgLSBUaGUgcmlnaHQgcXVhdGVybmlvblxuICAgKiBAcmV0dXJucyBUaGUgc3VtIG9mIHRoZSB0d28gcXVhdGVybmlvbnNcbiAgICovXG4gIHN0YXRpYyBhZGQobF9xdWF0OiBJUXVhdGVybmlvbiwgcl9xdWF0OiBJUXVhdGVybmlvbikge1xuICAgIGNvbnN0IHggPSBsX3F1YXQuX3ZbMF0gKyByX3F1YXQuX3ZbMF07XG4gICAgY29uc3QgeSA9IGxfcXVhdC5fdlsxXSArIHJfcXVhdC5fdlsxXTtcbiAgICBjb25zdCB6ID0gbF9xdWF0Ll92WzJdICsgcl9xdWF0Ll92WzJdO1xuICAgIGNvbnN0IHcgPSBsX3F1YXQuX3ZbM10gKyByX3F1YXQuX3ZbM107XG4gICAgcmV0dXJuIHRoaXMuZnJvbUNvcHk0KHgsIHksIHosIHcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdHdvIHF1YXRlcm5pb25zIGNvbXBvbmVudC13aXNlIGFuZCBzdG9yZXMgdGhlIHJlc3VsdCBpbiB0aGUgb3V0cHV0IHBhcmFtZXRlci5cbiAgICogQHBhcmFtIGxfcXVhdCAtIFRoZSBsZWZ0IHF1YXRlcm5pb25cbiAgICogQHBhcmFtIHJfcXVhdCAtIFRoZSByaWdodCBxdWF0ZXJuaW9uXG4gICAqIEBwYXJhbSBvdXQgLSBUaGUgb3V0cHV0IHF1YXRlcm5pb24gdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHF1YXRlcm5pb24gY29udGFpbmluZyB0aGUgc3VtXG4gICAqL1xuICBzdGF0aWMgYWRkVG8obF9xdWF0OiBJUXVhdGVybmlvbiwgcl9xdWF0OiBJUXVhdGVybmlvbiwgb3V0OiBJTXV0YWJsZVF1YXRlcm5pb24pIHtcbiAgICBvdXQuX3ZbMF0gPSBsX3F1YXQuX3ZbMF0gKyByX3F1YXQuX3ZbMF07XG4gICAgb3V0Ll92WzFdID0gbF9xdWF0Ll92WzFdICsgcl9xdWF0Ll92WzFdO1xuICAgIG91dC5fdlsyXSA9IGxfcXVhdC5fdlsyXSArIHJfcXVhdC5fdlsyXTtcbiAgICBvdXQuX3ZbM10gPSBsX3F1YXQuX3ZbM10gKyByX3F1YXQuX3ZbM107XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJ0cmFjdHMgdGhlIHJpZ2h0IHF1YXRlcm5pb24gZnJvbSB0aGUgbGVmdCBxdWF0ZXJuaW9uIGNvbXBvbmVudC13aXNlLlxuICAgKiBAcGFyYW0gbF9xdWF0IC0gVGhlIGxlZnQgcXVhdGVybmlvblxuICAgKiBAcGFyYW0gcl9xdWF0IC0gVGhlIHJpZ2h0IHF1YXRlcm5pb25cbiAgICogQHJldHVybnMgVGhlIGRpZmZlcmVuY2Ugb2YgdGhlIHR3byBxdWF0ZXJuaW9uc1xuICAgKi9cbiAgc3RhdGljIHN1YnRyYWN0KGxfcXVhdDogSVF1YXRlcm5pb24sIHJfcXVhdDogSVF1YXRlcm5pb24pIHtcbiAgICBjb25zdCB4ID0gbF9xdWF0Ll92WzBdIC0gcl9xdWF0Ll92WzBdO1xuICAgIGNvbnN0IHkgPSBsX3F1YXQuX3ZbMV0gLSByX3F1YXQuX3ZbMV07XG4gICAgY29uc3QgeiA9IGxfcXVhdC5fdlsyXSAtIHJfcXVhdC5fdlsyXTtcbiAgICBjb25zdCB3ID0gbF9xdWF0Ll92WzNdIC0gcl9xdWF0Ll92WzNdO1xuICAgIHJldHVybiB0aGlzLmZyb21Db3B5NCh4LCB5LCB6LCB3KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJ0cmFjdHMgdHdvIHF1YXRlcm5pb25zIGNvbXBvbmVudC13aXNlIGFuZCBzdG9yZXMgdGhlIHJlc3VsdCBpbiB0aGUgb3V0cHV0IHBhcmFtZXRlci5cbiAgICogQHBhcmFtIGxfcXVhdCAtIFRoZSBsZWZ0IHF1YXRlcm5pb25cbiAgICogQHBhcmFtIHJfcXVhdCAtIFRoZSByaWdodCBxdWF0ZXJuaW9uXG4gICAqIEBwYXJhbSBvdXQgLSBUaGUgb3V0cHV0IHF1YXRlcm5pb24gdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHF1YXRlcm5pb24gY29udGFpbmluZyB0aGUgZGlmZmVyZW5jZVxuICAgKi9cbiAgc3RhdGljIHN1YnRyYWN0VG8obF9xdWF0OiBJUXVhdGVybmlvbiwgcl9xdWF0OiBJUXVhdGVybmlvbiwgb3V0OiBJTXV0YWJsZVF1YXRlcm5pb24pIHtcbiAgICBvdXQuX3ZbMF0gPSBsX3F1YXQuX3ZbMF0gLSByX3F1YXQuX3ZbMF07XG4gICAgb3V0Ll92WzFdID0gbF9xdWF0Ll92WzFdIC0gcl9xdWF0Ll92WzFdO1xuICAgIG91dC5fdlsyXSA9IGxfcXVhdC5fdlsyXSAtIHJfcXVhdC5fdlsyXTtcbiAgICBvdXQuX3ZbM10gPSBsX3F1YXQuX3ZbM10gLSByX3F1YXQuX3ZbM107XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIHR3byBxdWF0ZXJuaW9ucyB1c2luZyBIYW1pbHRvbidzIHF1YXRlcm5pb24gbXVsdGlwbGljYXRpb24uXG4gICAqIFRoaXMgY29tYmluZXMgdGhlIHJvdGF0aW9ucyByZXByZXNlbnRlZCBieSBib3RoIHF1YXRlcm5pb25zLlxuICAgKiBOb3RlOiBRdWF0ZXJuaW9uIG11bHRpcGxpY2F0aW9uIGlzIG5vdCBjb21tdXRhdGl2ZSAob3JkZXIgbWF0dGVycykuXG4gICAqIEBwYXJhbSBsX3F1YXQgLSBUaGUgbGVmdCBxdWF0ZXJuaW9uXG4gICAqIEBwYXJhbSByX3F1YXQgLSBUaGUgcmlnaHQgcXVhdGVybmlvblxuICAgKiBAcmV0dXJucyBUaGUgcHJvZHVjdCBvZiB0aGUgdHdvIHF1YXRlcm5pb25zXG4gICAqL1xuICBzdGF0aWMgbXVsdGlwbHkobF9xdWF0OiBJUXVhdGVybmlvbiwgcl9xdWF0OiBJUXVhdGVybmlvbikge1xuICAgIGNvbnN0IHggPVxuICAgICAgcl9xdWF0Ll92WzNdICogbF9xdWF0Ll92WzBdICtcbiAgICAgIHJfcXVhdC5fdlsyXSAqIGxfcXVhdC5fdlsxXSAtXG4gICAgICByX3F1YXQuX3ZbMV0gKiBsX3F1YXQuX3ZbMl0gK1xuICAgICAgcl9xdWF0Ll92WzBdICogbF9xdWF0Ll92WzNdO1xuICAgIGNvbnN0IHkgPVxuICAgICAgLXJfcXVhdC5fdlsyXSAqIGxfcXVhdC5fdlswXSArXG4gICAgICByX3F1YXQuX3ZbM10gKiBsX3F1YXQuX3ZbMV0gK1xuICAgICAgcl9xdWF0Ll92WzBdICogbF9xdWF0Ll92WzJdICtcbiAgICAgIHJfcXVhdC5fdlsxXSAqIGxfcXVhdC5fdlszXTtcbiAgICBjb25zdCB6ID1cbiAgICAgIHJfcXVhdC5fdlsxXSAqIGxfcXVhdC5fdlswXSAtXG4gICAgICByX3F1YXQuX3ZbMF0gKiBsX3F1YXQuX3ZbMV0gK1xuICAgICAgcl9xdWF0Ll92WzNdICogbF9xdWF0Ll92WzJdICtcbiAgICAgIHJfcXVhdC5fdlsyXSAqIGxfcXVhdC5fdlszXTtcbiAgICBjb25zdCB3ID1cbiAgICAgIC1yX3F1YXQuX3ZbMF0gKiBsX3F1YXQuX3ZbMF0gLVxuICAgICAgcl9xdWF0Ll92WzFdICogbF9xdWF0Ll92WzFdIC1cbiAgICAgIHJfcXVhdC5fdlsyXSAqIGxfcXVhdC5fdlsyXSArXG4gICAgICByX3F1YXQuX3ZbM10gKiBsX3F1YXQuX3ZbM107XG4gICAgcmV0dXJuIHRoaXMuZnJvbUNvcHk0KHgsIHksIHosIHcpO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgdHdvIHF1YXRlcm5pb25zIGFuZCBzdG9yZXMgdGhlIHJlc3VsdCBpbiB0aGUgb3V0cHV0IHBhcmFtZXRlci5cbiAgICogQHBhcmFtIGxfcXVhdCAtIFRoZSBsZWZ0IHF1YXRlcm5pb25cbiAgICogQHBhcmFtIHJfcXVhdCAtIFRoZSByaWdodCBxdWF0ZXJuaW9uXG4gICAqIEBwYXJhbSBvdXQgLSBUaGUgb3V0cHV0IHF1YXRlcm5pb24gdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHF1YXRlcm5pb24gY29udGFpbmluZyB0aGUgcHJvZHVjdFxuICAgKi9cbiAgc3RhdGljIG11bHRpcGx5VG8obF9xdWF0OiBJUXVhdGVybmlvbiwgcl9xdWF0OiBJUXVhdGVybmlvbiwgb3V0OiBJTXV0YWJsZVF1YXRlcm5pb24pIHtcbiAgICBjb25zdCB4ID1cbiAgICAgIHJfcXVhdC5fdlszXSAqIGxfcXVhdC5fdlswXSArXG4gICAgICByX3F1YXQuX3ZbMl0gKiBsX3F1YXQuX3ZbMV0gLVxuICAgICAgcl9xdWF0Ll92WzFdICogbF9xdWF0Ll92WzJdICtcbiAgICAgIHJfcXVhdC5fdlswXSAqIGxfcXVhdC5fdlszXTtcbiAgICBjb25zdCB5ID1cbiAgICAgIC1yX3F1YXQuX3ZbMl0gKiBsX3F1YXQuX3ZbMF0gK1xuICAgICAgcl9xdWF0Ll92WzNdICogbF9xdWF0Ll92WzFdICtcbiAgICAgIHJfcXVhdC5fdlswXSAqIGxfcXVhdC5fdlsyXSArXG4gICAgICByX3F1YXQuX3ZbMV0gKiBsX3F1YXQuX3ZbM107XG4gICAgY29uc3QgeiA9XG4gICAgICByX3F1YXQuX3ZbMV0gKiBsX3F1YXQuX3ZbMF0gLVxuICAgICAgcl9xdWF0Ll92WzBdICogbF9xdWF0Ll92WzFdICtcbiAgICAgIHJfcXVhdC5fdlszXSAqIGxfcXVhdC5fdlsyXSArXG4gICAgICByX3F1YXQuX3ZbMl0gKiBsX3F1YXQuX3ZbM107XG4gICAgY29uc3QgdyA9XG4gICAgICAtcl9xdWF0Ll92WzBdICogbF9xdWF0Ll92WzBdIC1cbiAgICAgIHJfcXVhdC5fdlsxXSAqIGxfcXVhdC5fdlsxXSAtXG4gICAgICByX3F1YXQuX3ZbMl0gKiBsX3F1YXQuX3ZbMl0gK1xuICAgICAgcl9xdWF0Ll92WzNdICogbF9xdWF0Ll92WzNdO1xuICAgIHJldHVybiBvdXQuc2V0Q29tcG9uZW50cyh4LCB5LCB6LCB3KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIGEgcXVhdGVybmlvbiBieSBhIHNjYWxhciB2YWx1ZS5cbiAgICogQHBhcmFtIHF1YXQgLSBUaGUgcXVhdGVybmlvbiB0byBtdWx0aXBseVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIG11bHRpcGx5IGJ5XG4gICAqIEByZXR1cm5zIEEgbmV3IHF1YXRlcm5pb24gd2l0aCBhbGwgY29tcG9uZW50cyBtdWx0aXBsaWVkIGJ5IHRoZSBzY2FsYXJcbiAgICovXG4gIHN0YXRpYyBtdWx0aXBseU51bWJlcihxdWF0OiBJUXVhdGVybmlvbiwgdmFsdWU6IG51bWJlcikge1xuICAgIGNvbnN0IHggPSBxdWF0Ll92WzBdICogdmFsdWU7XG4gICAgY29uc3QgeSA9IHF1YXQuX3ZbMV0gKiB2YWx1ZTtcbiAgICBjb25zdCB6ID0gcXVhdC5fdlsyXSAqIHZhbHVlO1xuICAgIGNvbnN0IHcgPSBxdWF0Ll92WzNdICogdmFsdWU7XG4gICAgcmV0dXJuIHRoaXMuZnJvbUNvcHk0KHgsIHksIHosIHcpO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgYSBxdWF0ZXJuaW9uIGJ5IGEgc2NhbGFyIGFuZCBzdG9yZXMgdGhlIHJlc3VsdCBpbiB0aGUgb3V0cHV0IHBhcmFtZXRlci5cbiAgICogQHBhcmFtIHF1YXQgLSBUaGUgcXVhdGVybmlvbiB0byBtdWx0aXBseVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIG11bHRpcGx5IGJ5XG4gICAqIEBwYXJhbSBvdXQgLSBUaGUgb3V0cHV0IHF1YXRlcm5pb24gdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHF1YXRlcm5pb24gY29udGFpbmluZyB0aGUgc2NhbGVkIHJlc3VsdFxuICAgKi9cbiAgc3RhdGljIG11bHRpcGx5TnVtYmVyVG8ocXVhdDogSVF1YXRlcm5pb24sIHZhbHVlOiBudW1iZXIsIG91dDogSU11dGFibGVRdWF0ZXJuaW9uKSB7XG4gICAgb3V0Ll92WzBdID0gcXVhdC5fdlswXSAqIHZhbHVlO1xuICAgIG91dC5fdlsxXSA9IHF1YXQuX3ZbMV0gKiB2YWx1ZTtcbiAgICBvdXQuX3ZbMl0gPSBxdWF0Ll92WzJdICogdmFsdWU7XG4gICAgb3V0Ll92WzNdID0gcXVhdC5fdlszXSAqIHZhbHVlO1xuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICAvKipcbiAgICogRGl2aWRlcyBhIHF1YXRlcm5pb24gYnkgYSBzY2FsYXIgdmFsdWUuXG4gICAqIElmIHRoZSBkaXZpc29yIGlzIHplcm8sIGFsbCBjb21wb25lbnRzIGFyZSBzZXQgdG8gMCBhbmQgYW4gZXJyb3IgaXMgbG9nZ2VkXG4gICAqIGluc3RlYWQgb2YgcHJvZHVjaW5nIGBJbmZpbml0eWAvYE5hTmAuXG4gICAqXG4gICAqIEBwYXJhbSBxdWF0IC0gVGhlIHF1YXRlcm5pb24gdG8gZGl2aWRlXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBzY2FsYXIgdmFsdWUgdG8gZGl2aWRlIGJ5XG4gICAqIEByZXR1cm5zIEEgbmV3IHF1YXRlcm5pb24gd2l0aCBhbGwgY29tcG9uZW50cyBkaXZpZGVkIGJ5IHRoZSBzY2FsYXJcbiAgICovXG4gIHN0YXRpYyBkaXZpZGVOdW1iZXIocXVhdDogSVF1YXRlcm5pb24sIHZhbHVlOiBudW1iZXIpIHtcbiAgICBpZiAodmFsdWUgPT09IDApIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCcwIGRpdmlzaW9uIG9jY3VycmVkISBUaGUgcmVzdWx0IGlzIHNldCB0byB6ZXJvLicpO1xuICAgICAgcmV0dXJuIHRoaXMuZnJvbUNvcHk0KDAsIDAsIDAsIDApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5mcm9tQ29weTQocXVhdC5fdlswXSAvIHZhbHVlLCBxdWF0Ll92WzFdIC8gdmFsdWUsIHF1YXQuX3ZbMl0gLyB2YWx1ZSwgcXVhdC5fdlszXSAvIHZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXZpZGVzIGEgcXVhdGVybmlvbiBieSBhIHNjYWxhciBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gdGhlIG91dHB1dCBwYXJhbWV0ZXIuXG4gICAqIElmIHRoZSBkaXZpc29yIGlzIHplcm8sIGFsbCBjb21wb25lbnRzIGFyZSBzZXQgdG8gMCBhbmQgYW4gZXJyb3IgaXMgbG9nZ2VkXG4gICAqIGluc3RlYWQgb2YgcHJvZHVjaW5nIGBJbmZpbml0eWAvYE5hTmAuXG4gICAqXG4gICAqIEBwYXJhbSBxdWF0IC0gVGhlIHF1YXRlcm5pb24gdG8gZGl2aWRlXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBzY2FsYXIgdmFsdWUgdG8gZGl2aWRlIGJ5XG4gICAqIEBwYXJhbSBvdXQgLSBUaGUgb3V0cHV0IHF1YXRlcm5pb24gdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHF1YXRlcm5pb24gY29udGFpbmluZyB0aGUgZGl2aWRlZCByZXN1bHRcbiAgICovXG4gIHN0YXRpYyBkaXZpZGVOdW1iZXJUbyhxdWF0OiBJUXVhdGVybmlvbiwgdmFsdWU6IG51bWJlciwgb3V0OiBJTXV0YWJsZVF1YXRlcm5pb24pIHtcbiAgICBpZiAodmFsdWUgPT09IDApIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCcwIGRpdmlzaW9uIG9jY3VycmVkISBUaGUgcmVzdWx0IGlzIHNldCB0byB6ZXJvLicpO1xuICAgICAgb3V0Ll92WzBdID0gMDtcbiAgICAgIG91dC5fdlsxXSA9IDA7XG4gICAgICBvdXQuX3ZbMl0gPSAwO1xuICAgICAgb3V0Ll92WzNdID0gMDtcbiAgICAgIHJldHVybiBvdXQ7XG4gICAgfVxuICAgIG91dC5fdlswXSA9IHF1YXQuX3ZbMF0gLyB2YWx1ZTtcbiAgICBvdXQuX3ZbMV0gPSBxdWF0Ll92WzFdIC8gdmFsdWU7XG4gICAgb3V0Ll92WzJdID0gcXVhdC5fdlsyXSAvIHZhbHVlO1xuICAgIG91dC5fdlszXSA9IHF1YXQuX3ZbM10gLyB2YWx1ZTtcbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHRoZSBxdWF0ZXJuaW9uIHRvIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uLlxuICAgKiBAcmV0dXJucyBBIHN0cmluZyBpbiB0aGUgZm9ybWF0IFwiKHgsIHksIHosIHcpXCJcbiAgICovXG4gIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiBgKCR7dGhpcy5fdlswXX0sICR7dGhpcy5fdlsxXX0sICR7dGhpcy5fdlsyXX0sICR7dGhpcy5fdlszXX0pYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyB0aGUgcXVhdGVybmlvbiB0byBhbiBhcHByb3hpbWF0ZWx5IGZvcm1hdHRlZCBzdHJpbmcgdXNpbmcgZmluYW5jaWFsIHByZWNpc2lvbi5cbiAgICogQHJldHVybnMgQSBmb3JtYXR0ZWQgc3RyaW5nIHdpdGggY29tcG9uZW50cyBzZXBhcmF0ZWQgYnkgc3BhY2VzIGFuZCBlbmRpbmcgd2l0aCBuZXdsaW5lXG4gICAqL1xuICB0b1N0cmluZ0FwcHJveGltYXRlbHkoKSB7XG4gICAgcmV0dXJuIGAke01hdGhVdGlsLmZpbmFuY2lhbCh0aGlzLl92WzBdKX0gJHtNYXRoVXRpbC5maW5hbmNpYWwodGhpcy5fdlsxXSl9ICR7TWF0aFV0aWwuZmluYW5jaWFsKHRoaXMuX3ZbMl0pfSAke01hdGhVdGlsLmZpbmFuY2lhbCh0aGlzLl92WzNdKX1cXG5gO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHRoZSBxdWF0ZXJuaW9uIHRvIGEgZmxhdCBhcnJheSByZXByZXNlbnRhdGlvbi5cbiAgICogQHJldHVybnMgQW4gYXJyYXkgY29udGFpbmluZyBbeCwgeSwgeiwgd10gY29tcG9uZW50c1xuICAgKi9cbiAgZmxhdHRlbkFzQXJyYXkoKSB7XG4gICAgcmV0dXJuIFt0aGlzLl92WzBdLCB0aGlzLl92WzFdLCB0aGlzLl92WzJdLCB0aGlzLl92WzNdXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBxdWF0ZXJuaW9uIGlzIGEgZHVtbXkgKHVuaW5pdGlhbGl6ZWQpIHF1YXRlcm5pb24uXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIGludGVybmFsIGFycmF5IGhhcyB6ZXJvIGxlbmd0aCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBpc0R1bW15KCkge1xuICAgIGlmICh0aGlzLl92Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBxdWF0ZXJuaW9uIGlzIGFwcHJveGltYXRlbHkgZXF1YWwgdG8gYW5vdGhlciBxdWF0ZXJuaW9uIHdpdGhpbiBhIHRvbGVyYW5jZS5cbiAgICogQHBhcmFtIHF1YXQgLSBUaGUgcXVhdGVybmlvbiB0byBjb21wYXJlIHdpdGhcbiAgICogQHBhcmFtIGRlbHRhIC0gVGhlIHRvbGVyYW5jZSB2YWx1ZSAoZGVmYXVsdDogTnVtYmVyLkVQU0lMT04pXG4gICAqIEByZXR1cm5zIFRydWUgaWYgYWxsIGNvbXBvbmVudHMgYXJlIHdpdGhpbiB0aGUgdG9sZXJhbmNlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGlzRXF1YWwocXVhdDogSVF1YXRlcm5pb24sIGRlbHRhOiBudW1iZXIgPSBOdW1iZXIuRVBTSUxPTikge1xuICAgIGlmIChcbiAgICAgIE1hdGguYWJzKHF1YXQuX3ZbMF0gLSB0aGlzLl92WzBdKSA8IGRlbHRhICYmXG4gICAgICBNYXRoLmFicyhxdWF0Ll92WzFdIC0gdGhpcy5fdlsxXSkgPCBkZWx0YSAmJlxuICAgICAgTWF0aC5hYnMocXVhdC5fdlsyXSAtIHRoaXMuX3ZbMl0pIDwgZGVsdGEgJiZcbiAgICAgIE1hdGguYWJzKHF1YXQuX3ZbM10gLSB0aGlzLl92WzNdKSA8IGRlbHRhXG4gICAgKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGlzIHF1YXRlcm5pb24gaXMgZXhhY3RseSBlcXVhbCB0byBhbm90aGVyIHF1YXRlcm5pb24uXG4gICAqIEBwYXJhbSBxdWF0IC0gVGhlIHF1YXRlcm5pb24gdG8gY29tcGFyZSB3aXRoXG4gICAqIEByZXR1cm5zIFRydWUgaWYgYWxsIGNvbXBvbmVudHMgYXJlIGV4YWN0bHkgZXF1YWwsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgaXNTdHJpY3RFcXVhbChxdWF0OiBJUXVhdGVybmlvbik6IGJvb2xlYW4ge1xuICAgIGlmIChcbiAgICAgIHRoaXMuX3ZbMF0gPT09IHF1YXQuX3ZbMF0gJiZcbiAgICAgIHRoaXMuX3ZbMV0gPT09IHF1YXQuX3ZbMV0gJiZcbiAgICAgIHRoaXMuX3ZbMl0gPT09IHF1YXQuX3ZbMl0gJiZcbiAgICAgIHRoaXMuX3ZbM10gPT09IHF1YXQuX3ZbM11cbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgdGhlIHF1YXRlcm5pb24gdG8gRXVsZXIgYW5nbGVzIGFuZCBzdG9yZXMgdGhlIHJlc3VsdCBpbiB0aGUgb3V0cHV0IHZlY3Rvci5cbiAgICogVGhlIHJvdGF0aW9uIG9yZGVyIGlzIFhZWiAocm9sbCwgcGl0Y2gsIHlhdykuXG4gICAqIEBwYXJhbSBvdXQgLSBUaGUgb3V0cHV0IHZlY3RvciB0byBzdG9yZSB0aGUgRXVsZXIgYW5nbGVzIFt4LCB5LCB6XVxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHZlY3RvciBjb250YWluaW5nIHRoZSBFdWxlciBhbmdsZXMgaW4gcmFkaWFuc1xuICAgKi9cbiAgdG9FdWxlckFuZ2xlc1RvKG91dDogSU11dGFibGVWZWN0b3IzKSB7XG4gICAgY29uc3QgdDAgPSAyICogKHRoaXMuX3ZbM10gKiB0aGlzLl92WzBdICsgdGhpcy5fdlsxXSAqIHRoaXMuX3ZbMl0pO1xuICAgIGNvbnN0IHQxID0gMSAtIDIgKiAodGhpcy5fdlswXSAqIHRoaXMuX3ZbMF0gKyB0aGlzLl92WzFdICogdGhpcy5fdlsxXSk7XG4gICAgb3V0Ll92WzBdID0gTWF0aC5hdGFuMih0MCwgdDEpO1xuXG4gICAgbGV0IHQyID0gMiAqICh0aGlzLl92WzNdICogdGhpcy5fdlsxXSAtIHRoaXMuX3ZbMl0gKiB0aGlzLl92WzBdKTtcbiAgICB0MiA9IE1hdGgubWluKHQyLCAxKTtcbiAgICB0MiA9IE1hdGgubWF4KHQyLCAtMSk7XG4gICAgb3V0Ll92WzFdID0gTWF0aC5hc2luKHQyKTtcblxuICAgIGNvbnN0IHQzID0gMiAqICh0aGlzLl92WzNdICogdGhpcy5fdlsyXSArIHRoaXMuX3ZbMF0gKiB0aGlzLl92WzFdKTtcbiAgICBjb25zdCB0NCA9IDEgLSAyICogKHRoaXMuX3ZbMV0gKiB0aGlzLl92WzFdICsgdGhpcy5fdlsyXSAqIHRoaXMuX3ZbMl0pO1xuICAgIG91dC5fdlsyXSA9IE1hdGguYXRhbjIodDMsIHQ0KTtcblxuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgdGhlIHF1YXRlcm5pb24gdG8gRXVsZXIgYW5nbGVzLlxuICAgKiBUaGUgcm90YXRpb24gb3JkZXIgaXMgWFlaIChyb2xsLCBwaXRjaCwgeWF3KS5cbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yMyBjb250YWluaW5nIHRoZSBFdWxlciBhbmdsZXMgaW4gcmFkaWFuc1xuICAgKi9cbiAgdG9FdWxlckFuZ2xlcygpIHtcbiAgICBjb25zdCBvdXQgPSBuZXcgVmVjdG9yMyhuZXcgRmxvYXQzMkFycmF5KDMpKTtcbiAgICBjb25zdCB0MCA9IDIgKiAodGhpcy5fdlszXSAqIHRoaXMuX3ZbMF0gKyB0aGlzLl92WzFdICogdGhpcy5fdlsyXSk7XG4gICAgY29uc3QgdDEgPSAxIC0gMiAqICh0aGlzLl92WzBdICogdGhpcy5fdlswXSArIHRoaXMuX3ZbMV0gKiB0aGlzLl92WzFdKTtcbiAgICBvdXQuX3ZbMF0gPSBNYXRoLmF0YW4yKHQwLCB0MSk7XG5cbiAgICBsZXQgdDIgPSAyICogKHRoaXMuX3ZbM10gKiB0aGlzLl92WzFdIC0gdGhpcy5fdlsyXSAqIHRoaXMuX3ZbMF0pO1xuICAgIHQyID0gTWF0aC5taW4odDIsIDEpO1xuICAgIHQyID0gTWF0aC5tYXgodDIsIC0xKTtcbiAgICBvdXQuX3ZbMV0gPSBNYXRoLmFzaW4odDIpO1xuXG4gICAgY29uc3QgdDMgPSAyICogKHRoaXMuX3ZbM10gKiB0aGlzLl92WzJdICsgdGhpcy5fdlswXSAqIHRoaXMuX3ZbMV0pO1xuICAgIGNvbnN0IHQ0ID0gMSAtIDIgKiAodGhpcy5fdlsxXSAqIHRoaXMuX3ZbMV0gKyB0aGlzLl92WzJdICogdGhpcy5fdlsyXSk7XG4gICAgb3V0Ll92WzJdID0gTWF0aC5hdGFuMih0MywgdDQpO1xuXG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcml2YXRlIGhlbHBlciBtZXRob2QgZm9yIGRpdmlkaW5nIGEgcXVhdGVybmlvbiBieSBhIHNjYWxhciB2YWx1ZS5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSBxdWF0ZXJuaW9uIHRvIGRpdmlkZVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIGRpdmlkZSBieVxuICAgKiBAcmV0dXJucyBBIG5ldyBxdWF0ZXJuaW9uIHdpdGggZGl2aWRlZCBjb21wb25lbnRzLCBvciB6ZXJvIGNvbXBvbmVudHMgaWYgZGl2aXNpb24gYnkgemVyb1xuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX2RpdmlkZSh2ZWM6IElRdWF0ZXJuaW9uLCB2YWx1ZTogbnVtYmVyKSB7XG4gICAgbGV0IHg6IG51bWJlcjtcbiAgICBsZXQgeTogbnVtYmVyO1xuICAgIGxldCB6OiBudW1iZXI7XG4gICAgbGV0IHc6IG51bWJlcjtcbiAgICBpZiAodmFsdWUgIT09IDApIHtcbiAgICAgIHggPSB2ZWMuX3ZbMF0gLyB2YWx1ZTtcbiAgICAgIHkgPSB2ZWMuX3ZbMV0gLyB2YWx1ZTtcbiAgICAgIHogPSB2ZWMuX3ZbMl0gLyB2YWx1ZTtcbiAgICAgIHcgPSB2ZWMuX3ZbM10gLyB2YWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJzAgZGl2aXNpb24gb2NjdXJyZWQhIFRoZSByZXN1bHQgaXMgc2V0IHRvIHplcm8uJyk7XG4gICAgICB4ID0gMDtcbiAgICAgIHkgPSAwO1xuICAgICAgeiA9IDA7XG4gICAgICB3ID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZnJvbUNvcHk0KHgsIHksIHosIHcpO1xuICB9XG5cbiAgLyoqXG4gICAqIFByaXZhdGUgaGVscGVyIG1ldGhvZCBmb3IgZGl2aWRpbmcgYSBxdWF0ZXJuaW9uIGJ5IGEgc2NhbGFyIGFuZCBzdG9yaW5nIHRoZSByZXN1bHQuXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgcXVhdGVybmlvbiB0byBkaXZpZGVcbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIHNjYWxhciB2YWx1ZSB0byBkaXZpZGUgYnlcbiAgICogQHBhcmFtIG91dCAtIFRoZSBvdXRwdXQgcXVhdGVybmlvbiB0byBzdG9yZSB0aGUgcmVzdWx0XG4gICAqIEByZXR1cm5zIFRoZSBvdXRwdXQgcXVhdGVybmlvbiB3aXRoIGRpdmlkZWQgY29tcG9uZW50c1xuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX2RpdmlkZVRvKHZlYzogSVF1YXRlcm5pb24sIHZhbHVlOiBudW1iZXIsIG91dDogSU11dGFibGVRdWF0ZXJuaW9uKSB7XG4gICAgbGV0IHg6IG51bWJlcjtcbiAgICBsZXQgeTogbnVtYmVyO1xuICAgIGxldCB6OiBudW1iZXI7XG4gICAgbGV0IHc6IG51bWJlcjtcbiAgICBpZiAodmFsdWUgIT09IDApIHtcbiAgICAgIHggPSB2ZWMuX3ZbMF0gLyB2YWx1ZTtcbiAgICAgIHkgPSB2ZWMuX3ZbMV0gLyB2YWx1ZTtcbiAgICAgIHogPSB2ZWMuX3ZbMl0gLyB2YWx1ZTtcbiAgICAgIHcgPSB2ZWMuX3ZbM10gLyB2YWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJzAgZGl2aXNpb24gb2NjdXJyZWQhIFRoZSByZXN1bHQgaXMgc2V0IHRvIHplcm8uJyk7XG4gICAgICB4ID0gMDtcbiAgICAgIHkgPSAwO1xuICAgICAgeiA9IDA7XG4gICAgICB3ID0gMDtcbiAgICB9XG4gICAgb3V0Ll92WzBdID0geDtcbiAgICBvdXQuX3ZbMV0gPSB5O1xuICAgIG91dC5fdlsyXSA9IHo7XG4gICAgb3V0Ll92WzNdID0gdztcbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgLyoqXG4gICAqIE5vcm1hbGl6ZXMgYSBxdWF0ZXJuaW9uIHRvIHVuaXQgbGVuZ3RoLlxuICAgKiBBIHplcm8tbGVuZ3RoIHF1YXRlcm5pb24gaXMgbm9ybWFsaXplZCB0byB0aGUgaWRlbnRpdHkgcXVhdGVybmlvbiAoYW4gZXJyb3JcbiAgICogaXMgbG9nZ2VkKSBpbnN0ZWFkIG9mIGJlY29taW5nIGBJbmZpbml0eWAvYE5hTmAuXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgcXVhdGVybmlvbiB0byBub3JtYWxpemVcbiAgICogQHJldHVybnMgQSBuZXcgbm9ybWFsaXplZCBxdWF0ZXJuaW9uXG4gICAqL1xuICBzdGF0aWMgbm9ybWFsaXplKHZlYzogSVF1YXRlcm5pb24pOiBRdWF0ZXJuaW9uIHtcbiAgICBjb25zdCBsZW5ndGggPSB2ZWMubGVuZ3RoKCk7XG4gICAgaWYgKGxlbmd0aCA9PT0gMCkge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJ2Nhbm5vdCBub3JtYWxpemUgYSB6ZXJvLWxlbmd0aCBxdWF0ZXJuaW9uLiBSZXR1cm5pbmcgYW4gaWRlbnRpdHkgcXVhdGVybmlvbiBpbnN0ZWFkLicpO1xuICAgICAgcmV0dXJuIHRoaXMuZnJvbUNvcHk0KDAsIDAsIDAsIDEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fZGl2aWRlKHZlYywgbGVuZ3RoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBOb3JtYWxpemVzIGEgcXVhdGVybmlvbiB0byB1bml0IGxlbmd0aCBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gdGhlIG91dHB1dCBwYXJhbWV0ZXIuXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgcXVhdGVybmlvbiB0byBub3JtYWxpemVcbiAgICogQHBhcmFtIG91dCAtIFRoZSBvdXRwdXQgcXVhdGVybmlvbiB0byBzdG9yZSB0aGUgcmVzdWx0XG4gICAqIEByZXR1cm5zIFRoZSBvdXRwdXQgcXVhdGVybmlvbiBjb250YWluaW5nIHRoZSBub3JtYWxpemVkIHJlc3VsdFxuICAgKi9cbiAgc3RhdGljIG5vcm1hbGl6ZVRvKHZlYzogSVF1YXRlcm5pb24sIG91dDogSU11dGFibGVRdWF0ZXJuaW9uKTogSU11dGFibGVRdWF0ZXJuaW9uIHtcbiAgICBjb25zdCBsZW5ndGggPSB2ZWMubGVuZ3RoKCk7XG4gICAgaWYgKGxlbmd0aCA9PT0gMCkge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJ2Nhbm5vdCBub3JtYWxpemUgYSB6ZXJvLWxlbmd0aCBxdWF0ZXJuaW9uLiBUaGUgb3V0cHV0IGlzIHNldCB0byB0aGUgaWRlbnRpdHkgcXVhdGVybmlvbi4nKTtcbiAgICAgIG91dC5fdlswXSA9IDA7XG4gICAgICBvdXQuX3ZbMV0gPSAwO1xuICAgICAgb3V0Ll92WzJdID0gMDtcbiAgICAgIG91dC5fdlszXSA9IDE7XG4gICAgICByZXR1cm4gb3V0O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fZGl2aWRlVG8odmVjLCBsZW5ndGgsIG91dCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHF1YXRlcm5pb24gcmVwcmVzZW50aW5nIHRoZSByb3RhdGlvbiBmcm9tIG9uZSB2ZWN0b3IgdG8gYW5vdGhlci5cbiAgICogVGhpcyBpcyBhbiBpbnN0YW5jZSBtZXRob2QgdmVyc2lvbiBvZiB0aGUgc3RhdGljIGZyb21Ub1JvdGF0aW9uLlxuICAgKiBAcGFyYW0gZnJvbSAtIFRoZSBzdGFydGluZyBkaXJlY3Rpb24gdmVjdG9yXG4gICAqIEBwYXJhbSB0byAtIFRoZSB0YXJnZXQgZGlyZWN0aW9uIHZlY3RvclxuICAgKiBAcmV0dXJucyBUaGUgbm9ybWFsaXplZCBxdWF0ZXJuaW9uIHJlcHJlc2VudGluZyB0aGUgcm90YXRpb25cbiAgICovXG4gIGZyb21Ub1JvdGF0aW9uKGZyb206IElWZWN0b3IzLCB0bzogSVZlY3RvcjMpIHtcbiAgICBjb25zdCB2MCA9IE11dGFibGVWZWN0b3IzLmZyb21Db3B5VmVjdG9yMyhmcm9tKTtcbiAgICBjb25zdCB2MSA9IE11dGFibGVWZWN0b3IzLmZyb21Db3B5VmVjdG9yMyh0byk7XG4gICAgdjAubm9ybWFsaXplKCk7XG4gICAgdjEubm9ybWFsaXplKCk7XG4gICAgY29uc3QgZCA9IHYwLmRvdCh2MSk7XG4gICAgaWYgKGQgPiAtMS4wICsgTnVtYmVyLkVQU0lMT04pIHtcbiAgICAgIGNvbnN0IHMgPSBNYXRoLnNxcnQoKDEuMCArIGQpICogMi4wKTtcbiAgICAgIGNvbnN0IGludnMgPSAxLjAgLyBzO1xuICAgICAgY29uc3QgYyA9IFZlY3RvcjMubXVsdGlwbHkodjAuY3Jvc3ModjEpLCBpbnZzKTtcbiAgICAgIHRoaXMuX3ZbMF0gPSBjLng7XG4gICAgICB0aGlzLl92WzFdID0gYy55O1xuICAgICAgdGhpcy5fdlsyXSA9IGMuejtcbiAgICAgIHRoaXMuX3ZbM10gPSBzICogMC41O1xuICAgICAgcmV0dXJuICh0aGlzLmNvbnN0cnVjdG9yIGFzIGFueSkubm9ybWFsaXplKHRoaXMpO1xuICAgIH1cbiAgICBsZXQgYXhpcyA9IFZlY3RvcjMuZnJvbUNvcHkzKDAsIDEsIDApO1xuICAgIGxldCBheGlzMiA9IHYwLmNyb3NzKGF4aXMpO1xuICAgIGlmIChheGlzMi5sZW5ndGgoKSA8IE51bWJlci5FUFNJTE9OKSB7XG4gICAgICBheGlzID0gVmVjdG9yMy5mcm9tQ29weTMoMSwgMCwgMCk7XG4gICAgICBheGlzMiA9IHYwLmNyb3NzKGF4aXMpO1xuICAgIH1cbiAgICBheGlzMi5ub3JtYWxpemUoKTtcbiAgICByZXR1cm4gKHRoaXMuY29uc3RydWN0b3IgYXMgYW55KS5mcm9tQXhpc0FuZ2xlKGF4aXMyLCBNYXRoLlBJKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcXVhdGVybmlvbiByZXByZXNlbnRpbmcgdGhlIHJvdGF0aW9uIGZyb20gb25lIHZlY3RvciB0byBhbm90aGVyIChzdGF0aWMgdmVyc2lvbikuXG4gICAqIEBwYXJhbSBmcm9tIC0gVGhlIHN0YXJ0aW5nIGRpcmVjdGlvbiB2ZWN0b3JcbiAgICogQHBhcmFtIHRvIC0gVGhlIHRhcmdldCBkaXJlY3Rpb24gdmVjdG9yXG4gICAqIEByZXR1cm5zIEEgbm9ybWFsaXplZCBxdWF0ZXJuaW9uIHJlcHJlc2VudGluZyB0aGUgcm90YXRpb25cbiAgICovXG4gIHN0YXRpYyBmcm9tVG9Sb3RhdGlvbihmcm9tOiBJVmVjdG9yMywgdG86IElWZWN0b3IzKSB7XG4gICAgbGV0IHIgPSBWZWN0b3IzLmRvdChmcm9tLCB0bykgKyAxO1xuXG4gICAgaWYgKHIgPCBOdW1iZXIuRVBTSUxPTikge1xuICAgICAgciA9IDA7XG5cbiAgICAgIGlmIChNYXRoLmFicyhmcm9tLngpID4gTWF0aC5hYnMoZnJvbS56KSkge1xuICAgICAgICBjb25zdCBxID0gdGhpcy5mcm9tQ29weTQoLWZyb20ueSwgZnJvbS54LCAwLCByKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubm9ybWFsaXplKHEpO1xuICAgICAgfVxuICAgICAgY29uc3QgcSA9IHRoaXMuZnJvbUNvcHk0KDAsIC1mcm9tLnosIGZyb20ueSwgcik7XG4gICAgICByZXR1cm4gdGhpcy5ub3JtYWxpemUocSk7XG4gICAgfVxuICAgIGNvbnN0IHEgPSB0aGlzLmZyb21Db3B5NChcbiAgICAgIGZyb20ueSAqIHRvLnogLSBmcm9tLnogKiB0by55LFxuICAgICAgZnJvbS56ICogdG8ueCAtIGZyb20ueCAqIHRvLnosXG4gICAgICBmcm9tLnggKiB0by55IC0gZnJvbS55ICogdG8ueCxcbiAgICAgIHJcbiAgICApO1xuICAgIHJldHVybiB0aGlzLm5vcm1hbGl6ZShxKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcXVhdGVybmlvbiByZXByZXNlbnRpbmcgdGhlIHJvdGF0aW9uIGZyb20gb25lIHZlY3RvciB0byBhbm90aGVyIGFuZCBzdG9yZXMgaXQgaW4gdGhlIG91dHB1dCBwYXJhbWV0ZXIuXG4gICAqIEBwYXJhbSBmcm9tIC0gVGhlIHN0YXJ0aW5nIGRpcmVjdGlvbiB2ZWN0b3JcbiAgICogQHBhcmFtIHRvIC0gVGhlIHRhcmdldCBkaXJlY3Rpb24gdmVjdG9yXG4gICAqIEBwYXJhbSBvdXQgLSBUaGUgb3V0cHV0IHF1YXRlcm5pb24gdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHF1YXRlcm5pb24gY29udGFpbmluZyB0aGUgbm9ybWFsaXplZCByb3RhdGlvblxuICAgKi9cbiAgc3RhdGljIGZyb21Ub1JvdGF0aW9uVG8oZnJvbTogSVZlY3RvcjMsIHRvOiBJVmVjdG9yMywgb3V0OiBJTXV0YWJsZVF1YXRlcm5pb24pIHtcbiAgICBsZXQgciA9IFZlY3RvcjMuZG90KGZyb20sIHRvKSArIDE7XG5cbiAgICBpZiAociA8IE51bWJlci5FUFNJTE9OKSB7XG4gICAgICByID0gMDtcblxuICAgICAgaWYgKE1hdGguYWJzKGZyb20ueCkgPiBNYXRoLmFicyhmcm9tLnopKSB7XG4gICAgICAgIG91dC5fdlswXSA9IC1mcm9tLnk7XG4gICAgICAgIG91dC5fdlsxXSA9IGZyb20ueDtcbiAgICAgICAgb3V0Ll92WzJdID0gMDtcbiAgICAgICAgb3V0Ll92WzNdID0gcjtcbiAgICAgICAgb3V0Lm5vcm1hbGl6ZSgpO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgfVxuICAgICAgb3V0Ll92WzBdID0gMDtcbiAgICAgIG91dC5fdlsxXSA9IC1mcm9tLno7XG4gICAgICBvdXQuX3ZbMl0gPSBmcm9tLnk7XG4gICAgICBvdXQuX3ZbM10gPSByO1xuICAgICAgb3V0Lm5vcm1hbGl6ZSgpO1xuICAgICAgcmV0dXJuIG91dDtcbiAgICB9XG4gICAgb3V0Ll92WzBdID0gZnJvbS55ICogdG8ueiAtIGZyb20ueiAqIHRvLnk7XG4gICAgb3V0Ll92WzFdID0gZnJvbS56ICogdG8ueCAtIGZyb20ueCAqIHRvLno7XG4gICAgb3V0Ll92WzJdID0gZnJvbS54ICogdG8ueSAtIGZyb20ueSAqIHRvLng7XG4gICAgb3V0Ll92WzNdID0gcjtcbiAgICBvdXQubm9ybWFsaXplKCk7XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFuc2Zvcm1zIGEgM0QgdmVjdG9yIGJ5IHRoaXMgcXVhdGVybmlvbiByb3RhdGlvbi5cbiAgICogQXBwbGllcyB0aGUgcm90YXRpb24gcmVwcmVzZW50ZWQgYnkgdGhpcyBxdWF0ZXJuaW9uIHRvIHRoZSBpbnB1dCB2ZWN0b3IuXG4gICAqIEBwYXJhbSB2IC0gVGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cbiAgICogQHJldHVybnMgQSBuZXcgdHJhbnNmb3JtZWQgdmVjdG9yXG4gICAqL1xuICB0cmFuc2Zvcm1WZWN0b3IzKHY6IElWZWN0b3IzKSB7XG4gICAgY29uc3QgdSA9IFF1YXRlcm5pb24uX190bXBfdmVjM181O1xuICAgIHUuc2V0Q29tcG9uZW50cyh0aGlzLl92WzBdLCB0aGlzLl92WzFdLCB0aGlzLl92WzJdKTtcbiAgICBjb25zdCB1diA9IFZlY3RvcjMuY3Jvc3ModSwgdik7XG4gICAgY29uc3QgdXV2ID0gVmVjdG9yMy5jcm9zcyh1LCB1dik7XG4gICAgY29uc3QgdXZ3ID0gVmVjdG9yMy5tdWx0aXBseSh1diwgdGhpcy5fdlszXSk7XG4gICAgY29uc3QgdXV2X3V2dyA9IFZlY3RvcjMuYWRkKHV1diwgdXZ3KTtcbiAgICBjb25zdCB1dXZfdXZ3XzIgPSBWZWN0b3IzLm11bHRpcGx5KHV1dl91dncsIDIpO1xuICAgIHJldHVybiBWZWN0b3IzLmFkZCh2LCB1dXZfdXZ3XzIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybXMgYSAzRCB2ZWN0b3IgYnkgdGhpcyBxdWF0ZXJuaW9uIHJvdGF0aW9uIGFuZCBzdG9yZXMgdGhlIHJlc3VsdCBpbiB0aGUgb3V0cHV0IHBhcmFtZXRlci5cbiAgICogQHBhcmFtIHYgLSBUaGUgdmVjdG9yIHRvIHRyYW5zZm9ybVxuICAgKiBAcGFyYW0gb3V0IC0gVGhlIG91dHB1dCB2ZWN0b3IgdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHZlY3RvciBjb250YWluaW5nIHRoZSB0cmFuc2Zvcm1lZCByZXN1bHRcbiAgICovXG4gIHRyYW5zZm9ybVZlY3RvcjNUbyh2OiBJVmVjdG9yMywgb3V0OiBJTXV0YWJsZVZlY3RvcjMpIHtcbiAgICBjb25zdCB1ID0gUXVhdGVybmlvbi5fX3RtcF92ZWMzXzU7XG4gICAgdS5zZXRDb21wb25lbnRzKHRoaXMuX3ZbMF0sIHRoaXMuX3ZbMV0sIHRoaXMuX3ZbMl0pO1xuICAgIGNvbnN0IHV2ID0gVmVjdG9yMy5jcm9zc1RvKHUsIHYsIFF1YXRlcm5pb24uX190bXBfdmVjM18wKTtcbiAgICBjb25zdCB1dXYgPSBWZWN0b3IzLmNyb3NzVG8odSwgdXYsIFF1YXRlcm5pb24uX190bXBfdmVjM18xKTtcbiAgICBjb25zdCB1dncgPSBWZWN0b3IzLm11bHRpcGx5VG8odXYsIHRoaXMuX3ZbM10sIFF1YXRlcm5pb24uX190bXBfdmVjM18yKTtcbiAgICBjb25zdCB1dXZfdXZ3ID0gVmVjdG9yMy5hZGRUbyh1dXYsIHV2dywgUXVhdGVybmlvbi5fX3RtcF92ZWMzXzMpO1xuICAgIGNvbnN0IHV1dl91dndfMiA9IFZlY3RvcjMubXVsdGlwbHlUbyh1dXZfdXZ3LCAyLCBRdWF0ZXJuaW9uLl9fdG1wX3ZlYzNfNCk7XG4gICAgcmV0dXJuIFZlY3RvcjMuYWRkVG8odiwgdXV2X3V2d18yLCBvdXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybXMgYSAzRCB2ZWN0b3IgYnkgdGhlIGludmVyc2Ugb2YgdGhpcyBxdWF0ZXJuaW9uIHJvdGF0aW9uLlxuICAgKiBAcGFyYW0gdiAtIFRoZSB2ZWN0b3IgdG8gdHJhbnNmb3JtXG4gICAqIEByZXR1cm5zIEEgbmV3IHRyYW5zZm9ybWVkIHZlY3RvclxuICAgKi9cbiAgdHJhbnNmb3JtVmVjdG9yM0ludmVyc2UodjogSVZlY3RvcjMpIHtcbiAgICBjb25zdCBpbnYgPSAodGhpcy5jb25zdHJ1Y3RvciBhcyBhbnkpLmludmVydCh0aGlzKTtcbiAgICByZXR1cm4gaW52LnRyYW5zZm9ybVZlY3RvcjModik7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGRlZXAgY29weSBvZiB0aGlzIHF1YXRlcm5pb24uXG4gICAqIEByZXR1cm5zIEEgbmV3IHF1YXRlcm5pb24gd2l0aCB0aGUgc2FtZSBjb21wb25lbnQgdmFsdWVzXG4gICAqL1xuICBjbG9uZSgpOiB0aGlzIHtcbiAgICByZXR1cm4gKHRoaXMuY29uc3RydWN0b3IgYXMgYW55KS5mcm9tQ29weTQodGhpcy5fdlswXSwgdGhpcy5fdlsxXSwgdGhpcy5fdlsyXSwgdGhpcy5fdlszXSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHF1YXRlcm5pb24gdGhhdCBkaXJlY3RseSB1c2VzIHRoZSBnaXZlbiB0eXBlZCBhcnJheSAobm8gY29weSkuXG4gICAqIEBwYXJhbSBhcnJheSAtIFRoZSB0eXBlZCBhcnJheSBjb250YWluaW5nIHF1YXRlcm5pb24gY29tcG9uZW50c1xuICAgKiBAcmV0dXJucyBBIG5ldyBxdWF0ZXJuaW9uIHVzaW5nIHRoZSBwcm92aWRlZCBhcnJheVxuICAgKi9cbiAgc3RhdGljIGZyb21UeXBlZEFycmF5KGFycmF5OiBUeXBlZEFycmF5KSB7XG4gICAgcmV0dXJuIG5ldyB0aGlzKGFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcXVhdGVybmlvbiBmcm9tIGEgNC1lbGVtZW50IGFycmF5LlxuICAgKiBAcGFyYW0gYXJyYXkgLSBUaGUgYXJyYXkgY29udGFpbmluZyBbeCwgeSwgeiwgd10gY29tcG9uZW50c1xuICAgKiBAcmV0dXJucyBBIG5ldyBxdWF0ZXJuaW9uIHdpdGggY29waWVkIGNvbXBvbmVudHNcbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weUFycmF5NChhcnJheTogQXJyYXk0PG51bWJlcj4pIHtcbiAgICByZXR1cm4gbmV3IHRoaXMobmV3IHRoaXMuX3R5cGUoYXJyYXkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcXVhdGVybmlvbiBmcm9tIGEgdmFyaWFibGUtbGVuZ3RoIGFycmF5ICh0YWtpbmcgZmlyc3QgNCBlbGVtZW50cykuXG4gICAqIEBwYXJhbSBhcnJheSAtIFRoZSBhcnJheSBjb250YWluaW5nIHF1YXRlcm5pb24gY29tcG9uZW50c1xuICAgKiBAcmV0dXJucyBBIG5ldyBxdWF0ZXJuaW9uIHdpdGggdGhlIGZpcnN0IDQgY29tcG9uZW50cyBjb3BpZWRcbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weUFycmF5KGFycmF5OiBBcnJheTxudW1iZXI+KSB7XG4gICAgcmV0dXJuIG5ldyB0aGlzKG5ldyB0aGlzLl90eXBlKGFycmF5LnNsaWNlKDAsIDQpKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHF1YXRlcm5pb24gZnJvbSBpbmRpdmlkdWFsIGNvbXBvbmVudCB2YWx1ZXMuXG4gICAqIEBwYXJhbSB4IC0gVGhlIHggY29tcG9uZW50XG4gICAqIEBwYXJhbSB5IC0gVGhlIHkgY29tcG9uZW50XG4gICAqIEBwYXJhbSB6IC0gVGhlIHogY29tcG9uZW50XG4gICAqIEBwYXJhbSB3IC0gVGhlIHcgY29tcG9uZW50XG4gICAqIEByZXR1cm5zIEEgbmV3IHF1YXRlcm5pb24gd2l0aCB0aGUgc3BlY2lmaWVkIGNvbXBvbmVudHNcbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weTQoeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciwgdzogbnVtYmVyKSB7XG4gICAgcmV0dXJuIG5ldyB0aGlzKG5ldyB0aGlzLl90eXBlKFt4LCB5LCB6LCB3XSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBxdWF0ZXJuaW9uIGJ5IGNvcHlpbmcgZnJvbSBhbm90aGVyIHF1YXRlcm5pb24uXG4gICAqIEBwYXJhbSBxdWF0IC0gVGhlIHF1YXRlcm5pb24gdG8gY29weSBmcm9tXG4gICAqIEByZXR1cm5zIEEgbmV3IHF1YXRlcm5pb24gd2l0aCBjb3BpZWQgY29tcG9uZW50c1xuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5UXVhdGVybmlvbihxdWF0OiBJUXVhdGVybmlvbikge1xuICAgIGNvbnN0IHYgPSBuZXcgdGhpcy5fdHlwZSg0KTtcbiAgICB2WzBdID0gcXVhdC5fdlswXTtcbiAgICB2WzFdID0gcXVhdC5fdlsxXTtcbiAgICB2WzJdID0gcXVhdC5fdlsyXTtcbiAgICB2WzNdID0gcXVhdC5fdlszXTtcbiAgICByZXR1cm4gbmV3IHRoaXModik7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHF1YXRlcm5pb24gYnkgY29weWluZyBmcm9tIGEgNEQgdmVjdG9yLlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIDREIHZlY3RvciB0byBjb3B5IGZyb21cbiAgICogQHJldHVybnMgQSBuZXcgcXVhdGVybmlvbiB3aXRoIGNvbXBvbmVudHMgY29waWVkIGZyb20gdGhlIHZlY3RvclxuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5VmVjdG9yNCh2ZWM6IElWZWN0b3I0KSB7XG4gICAgY29uc3QgdiA9IG5ldyB0aGlzLl90eXBlKDQpO1xuICAgIHZbMF0gPSB2ZWMuX3ZbMF07XG4gICAgdlsxXSA9IHZlYy5fdlsxXTtcbiAgICB2WzJdID0gdmVjLl92WzJdO1xuICAgIHZbM10gPSB2ZWMuX3ZbM107XG4gICAgcmV0dXJuIG5ldyB0aGlzKHYpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBxdWF0ZXJuaW9uIGZyb20gYSBsb2cgcXVhdGVybmlvbiByZXByZXNlbnRhdGlvbi5cbiAgICogQHBhcmFtIHggLSBUaGUgbG9nIHF1YXRlcm5pb24gdG8gY29udmVydFxuICAgKiBAcmV0dXJucyBBIG5ldyBxdWF0ZXJuaW9uIGNvbnZlcnRlZCBmcm9tIGxvZyBzcGFjZVxuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5TG9nUXVhdGVybmlvbih4OiBJTG9nUXVhdGVybmlvbikge1xuICAgIGNvbnN0IGxlbmd0aCA9IE1hdGguaHlwb3QoeC5fdlswXSwgeC5fdlsxXSwgeC5fdlsyXSk7XG4gICAgY29uc3QgdiA9IG5ldyB0aGlzLl90eXBlKDQpO1xuICAgIGlmIChsZW5ndGggPT09IDApIHtcbiAgICAgIC8vIGxvZyhpZGVudGl0eSkgPSAwLCBzbyBleHAoMCkgaXMgdGhlIGlkZW50aXR5IHF1YXRlcm5pb24uXG4gICAgICB2WzBdID0gMDtcbiAgICAgIHZbMV0gPSAwO1xuICAgICAgdlsyXSA9IDA7XG4gICAgICB2WzNdID0gMTtcbiAgICAgIHJldHVybiBuZXcgdGhpcyh2KTtcbiAgICB9XG4gICAgY29uc3Qgc2luID0gTWF0aC5zaW4obGVuZ3RoKTtcbiAgICB2WzBdID0geC5fdlswXSAqIChzaW4gLyBsZW5ndGgpO1xuICAgIHZbMV0gPSB4Ll92WzFdICogKHNpbiAvIGxlbmd0aCk7XG4gICAgdlsyXSA9IHguX3ZbMl0gKiAoc2luIC8gbGVuZ3RoKTtcbiAgICB2WzNdID0gTWF0aC5jb3MobGVuZ3RoKTtcbiAgICByZXR1cm4gbmV3IHRoaXModik7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHF1YXRlcm5pb24gZnJvbSBhbiBheGlzLWFuZ2xlIHJlcHJlc2VudGF0aW9uLlxuICAgKiBAcGFyYW0gYXhpcyAtIFRoZSByb3RhdGlvbiBheGlzIHZlY3RvclxuICAgKiBAcGFyYW0gcmFkIC0gVGhlIHJvdGF0aW9uIGFuZ2xlIGluIHJhZGlhbnNcbiAgICogQHJldHVybnMgQSBuZXcgcXVhdGVybmlvbiByZXByZXNlbnRpbmcgdGhlIHJvdGF0aW9uXG4gICAqL1xuICBzdGF0aWMgZnJvbUF4aXNBbmdsZShheGlzOiBJVmVjdG9yMywgcmFkOiBudW1iZXIpIHtcbiAgICByYWQgPSByYWQgKiAwLjU7XG4gICAgY29uc3QgcyA9IE1hdGguc2luKHJhZCk7XG4gICAgcmV0dXJuIHRoaXMuZnJvbUNvcHk0KHMgKiBheGlzLngsIHMgKiBheGlzLnksIHMgKiBheGlzLnosIE1hdGguY29zKHJhZCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBxdWF0ZXJuaW9uIGZyb20gYW4gYXhpcy1hbmdsZSByZXByZXNlbnRhdGlvbiBhbmQgc3RvcmVzIGl0IGluIHRoZSBvdXRwdXQgcGFyYW1ldGVyLlxuICAgKiBAcGFyYW0gYXhpcyAtIFRoZSByb3RhdGlvbiBheGlzIHZlY3RvclxuICAgKiBAcGFyYW0gcmFkIC0gVGhlIHJvdGF0aW9uIGFuZ2xlIGluIHJhZGlhbnNcbiAgICogQHBhcmFtIG91dCAtIFRoZSBvdXRwdXQgcXVhdGVybmlvbiB0byBzdG9yZSB0aGUgcmVzdWx0XG4gICAqIEByZXR1cm5zIFRoZSBvdXRwdXQgcXVhdGVybmlvbiBjb250YWluaW5nIHRoZSByb3RhdGlvblxuICAgKi9cbiAgc3RhdGljIGZyb21BeGlzQW5nbGVUbyhheGlzOiBJVmVjdG9yMywgcmFkOiBudW1iZXIsIG91dDogSU11dGFibGVRdWF0ZXJuaW9uKSB7XG4gICAgcmFkID0gcmFkICogMC41O1xuICAgIGNvbnN0IHMgPSBNYXRoLnNpbihyYWQpO1xuICAgIG91dC5fdlswXSA9IHMgKiBheGlzLng7XG4gICAgb3V0Ll92WzFdID0gcyAqIGF4aXMueTtcbiAgICBvdXQuX3ZbMl0gPSBzICogYXhpcy56O1xuICAgIG91dC5fdlszXSA9IE1hdGguY29zKHJhZCk7XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSByb3RhdGlvbiBhbmdsZSAoMCB0byBcdTAzQzApIHJlcHJlc2VudGVkIGJ5IGEgcXVhdGVybmlvbi5cbiAgICogQHBhcmFtIHEgLSBUaGUgcXVhdGVybmlvbiB0byBhbmFseXplIChhc3N1bWVkIHRvIGJlIG5vcm1hbGl6ZWQpXG4gICAqIEByZXR1cm5zIFRoZSByb3RhdGlvbiBhbmdsZSBpbiByYWRpYW5zXG4gICAqL1xuICBzdGF0aWMgZ2V0UXVhdGVybmlvbkFuZ2xlKHE6IElRdWF0ZXJuaW9uKSB7XG4gICAgLy8gQXNzdW1lIHEgaXMgbm9ybWFsaXplZFxuICAgIGNvbnN0IHdDbGFtcGVkID0gTWF0aC5tYXgoLTEuMCwgTWF0aC5taW4oMS4wLCBxLncpKTtcbiAgICByZXR1cm4gMi4wICogTWF0aC5hY29zKHdDbGFtcGVkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGFtcHMgdGhlIHJvdGF0aW9uIGFuZ2xlIG9mIGEgcXVhdGVybmlvbiB0byBhIG1heGltdW0gdmFsdWUuXG4gICAqIElmIHRoZSBxdWF0ZXJuaW9uJ3Mgcm90YXRpb24gYW5nbGUgZXhjZWVkcyB0aGV0YU1heCwgaXQgc2NhbGVzIHRoZSByb3RhdGlvbiBkb3duLlxuICAgKiBAcGFyYW0gcXVhdCAtIFRoZSBxdWF0ZXJuaW9uIHRvIGNsYW1wXG4gICAqIEBwYXJhbSB0aGV0YU1heCAtIFRoZSBtYXhpbXVtIGFsbG93ZWQgcm90YXRpb24gYW5nbGUgaW4gcmFkaWFuc1xuICAgKiBAcmV0dXJucyBBIHF1YXRlcm5pb24gd2l0aCByb3RhdGlvbiBhbmdsZSBjbGFtcGVkIHRvIHRoZXRhTWF4XG4gICAqL1xuICBzdGF0aWMgY2xhbXBSb3RhdGlvbihxdWF0OiBJUXVhdGVybmlvbiwgdGhldGFNYXg6IG51bWJlcikge1xuICAgIGNvbnN0IHRoZXRhID0gdGhpcy5nZXRRdWF0ZXJuaW9uQW5nbGUocXVhdCk7XG4gICAgaWYgKHRoZXRhIDw9IHRoZXRhTWF4KSB7XG4gICAgICAvLyBEbyBub3RoaW5nIGlmIGFscmVhZHkgc21hbGwgZW5vdWdoXG4gICAgICByZXR1cm4gcXVhdDtcbiAgICB9XG4gICAgLy8gU2xlcnAgZnJvbSB1bml0IFEgdG8gcSBhdCB0aGUgcmF0aW8gb2YgXHUwM0I4bWF4L1x1MDNCOFxuICAgIGNvbnN0IHQgPSB0aGV0YU1heCAvIHRoZXRhO1xuICAgIC8vIFVuaXQgcXVhdGVybmlvbiAobm8gcm90YXRpb24pXG4gICAgY29uc3QgcUlkZW50aXR5ID0gdGhpcy5mcm9tQ29weTQoMC4wLCAwLjAsIDAuMCwgMS4wKTtcbiAgICAvLyBJbnRlcnBvbGF0ZSBmcm9tIHFJZGVudGl0eSAoMCBkZWdyZWVzKSB0byBxIChcdTAzQjggZGVncmVlcykgYW5kIHJlZHVjZSB0byBcdTAzQjhtYXhcbiAgICByZXR1cm4gdGhpcy5xbGVycChxSWRlbnRpdHksIHF1YXQsIHQpO1xuICB9XG59XG5cbi8qKlxuICogSW1tdXRhYmxlIHF1YXRlcm5pb24gd2l0aCAzMi1iaXQgZmxvYXQgY29tcG9uZW50cy5cbiAqL1xuZXhwb3J0IGNsYXNzIFF1YXRlcm5pb24gZXh0ZW5kcyBRdWF0ZXJuaW9uXzxGbG9hdDMyQXJyYXlDb25zdHJ1Y3Rvcj4ge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBRdWF0ZXJuaW9uIGluc3RhbmNlLlxuICAgKiBAcGFyYW0gdiAtIFRoZSB0eXBlZCBhcnJheSBjb250YWluaW5nIHRoZSBxdWF0ZXJuaW9uIGNvbXBvbmVudHNcbiAgICovXG4gIGNvbnN0cnVjdG9yKHY6IFR5cGVkQXJyYXkpIHtcbiAgICBzdXBlcih2LCB7IHR5cGU6IEZsb2F0MzJBcnJheSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBpZGVudGl0eVxuICAgKi9cbiAgc3RhdGljIGlkZW50aXR5KCk6IFF1YXRlcm5pb24ge1xuICAgIHJldHVybiBzdXBlci5pZGVudGl0eSgpIGFzIFF1YXRlcm5pb247XG4gIH1cblxuICAvKipcbiAgICogZHVtbXlcbiAgICovXG4gIHN0YXRpYyBkdW1teSgpOiBRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gc3VwZXIuZHVtbXkoKSBhcyBRdWF0ZXJuaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIGludmVydFxuICAgKi9cbiAgc3RhdGljIGludmVydChxdWF0OiBJUXVhdGVybmlvbik6IFF1YXRlcm5pb24ge1xuICAgIHJldHVybiBzdXBlci5pbnZlcnQocXVhdCkgYXMgUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBpbnZlcnRUb1xuICAgKi9cbiAgc3RhdGljIGludmVydFRvKHF1YXQ6IElRdWF0ZXJuaW9uLCBvdXQ6IElNdXRhYmxlUXVhdGVybmlvbik6IElNdXRhYmxlUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIHN1cGVyLmludmVydFRvKHF1YXQsIG91dCkgYXMgSU11dGFibGVRdWF0ZXJuaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIHFsZXJwXG4gICAqL1xuICBzdGF0aWMgcWxlcnAobF9xdWF0OiBJUXVhdGVybmlvbiwgcl9xdWF0OiBJUXVhdGVybmlvbiwgcmF0aW86IG51bWJlcik6IFF1YXRlcm5pb24ge1xuICAgIHJldHVybiBzdXBlci5xbGVycChsX3F1YXQsIHJfcXVhdCwgcmF0aW8pIGFzIFF1YXRlcm5pb247XG4gIH1cblxuICAvKipcbiAgICogcWxlcnBUb1xuICAgKi9cbiAgc3RhdGljIHFsZXJwVG8obF9xdWF0OiBJUXVhdGVybmlvbiwgcl9xdWF0OiBJUXVhdGVybmlvbiwgcmF0aW86IG51bWJlciwgb3V0OiBJTXV0YWJsZVF1YXRlcm5pb24pOiBJTXV0YWJsZVF1YXRlcm5pb24ge1xuICAgIHJldHVybiBzdXBlci5xbGVycFRvKGxfcXVhdCwgcl9xdWF0LCByYXRpbywgb3V0KSBhcyBJTXV0YWJsZVF1YXRlcm5pb247XG4gIH1cblxuICAvKipcbiAgICogbGVycFxuICAgKi9cbiAgc3RhdGljIGxlcnAobF9xdWF0OiBJUXVhdGVybmlvbiwgcl9xdWF0OiBJUXVhdGVybmlvbiwgcmF0aW86IG51bWJlcik6IFF1YXRlcm5pb24ge1xuICAgIHJldHVybiBzdXBlci5sZXJwKGxfcXVhdCwgcl9xdWF0LCByYXRpbykgYXMgUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBsZXJwVG9cbiAgICovXG4gIHN0YXRpYyBsZXJwVG8obF9xdWF0OiBJUXVhdGVybmlvbiwgcl9xdWF0OiBJUXVhdGVybmlvbiwgcmF0aW86IG51bWJlciwgb3V0OiBJTXV0YWJsZVF1YXRlcm5pb24pOiBJTXV0YWJsZVF1YXRlcm5pb24ge1xuICAgIHJldHVybiBzdXBlci5sZXJwVG8obF9xdWF0LCByX3F1YXQsIHJhdGlvLCBvdXQpIGFzIElNdXRhYmxlUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiB0cnlBeGlzQW5nbGVcbiAgICovXG4gIHN0YXRpYyB0cnlBeGlzQW5nbGUodmVjOiBJVmVjdG9yMywgcmFkaWFuOiBudW1iZXIpOiBRdWF0ZXJuaW9uIHwgbnVsbCB7XG4gICAgcmV0dXJuIHN1cGVyLnRyeUF4aXNBbmdsZSh2ZWMsIHJhZGlhbikgYXMgUXVhdGVybmlvbiB8IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogYXhpc0FuZ2xlXG4gICAqL1xuICBzdGF0aWMgYXhpc0FuZ2xlKHZlYzogSVZlY3RvcjMsIHJhZGlhbjogbnVtYmVyKTogUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIHN1cGVyLmF4aXNBbmdsZSh2ZWMsIHJhZGlhbikgYXMgUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiB0cnlGcm9tTWF0cml4XG4gICAqL1xuICBzdGF0aWMgdHJ5RnJvbU1hdHJpeChtYXQ6IElNYXRyaXg0NCk6IFF1YXRlcm5pb24gfCBudWxsIHtcbiAgICByZXR1cm4gc3VwZXIudHJ5RnJvbU1hdHJpeChtYXQpIGFzIFF1YXRlcm5pb24gfCBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIGZyb21NYXRyaXhcbiAgICovXG4gIHN0YXRpYyBmcm9tTWF0cml4KG1hdDogSU1hdHJpeDQ0KTogUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIHN1cGVyLmZyb21NYXRyaXgobWF0KSBhcyBRdWF0ZXJuaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIHRyeUZyb21NYXRyaXhUb1xuICAgKi9cbiAgc3RhdGljIHRyeUZyb21NYXRyaXhUbyhtYXQ6IElNYXRyaXg0NCwgb3V0OiBJTXV0YWJsZVF1YXRlcm5pb24pOiBib29sZWFuIHtcbiAgICByZXR1cm4gc3VwZXIudHJ5RnJvbU1hdHJpeFRvKG1hdCwgb3V0KSBhcyBib29sZWFuO1xuICB9XG5cbiAgLyoqXG4gICAqIGZyb21NYXRyaXhUb1xuICAgKi9cbiAgc3RhdGljIGZyb21NYXRyaXhUbyhtYXQ6IElNYXRyaXg0NCwgb3V0OiBJTXV0YWJsZVF1YXRlcm5pb24pOiBJTXV0YWJsZVF1YXRlcm5pb24ge1xuICAgIHJldHVybiBzdXBlci5mcm9tTWF0cml4VG8obWF0LCBvdXQpIGFzIElNdXRhYmxlUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBsb29rRnJvbVRvXG4gICAqL1xuICBzdGF0aWMgbG9va0Zyb21Ubyhmcm9tRGlyZWN0aW9uOiBJVmVjdG9yMywgdG9EaXJlY3Rpb246IElWZWN0b3IzKTogSU11dGFibGVRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gc3VwZXIubG9va0Zyb21Ubyhmcm9tRGlyZWN0aW9uLCB0b0RpcmVjdGlvbikgYXMgSU11dGFibGVRdWF0ZXJuaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIHRyeUxvb2tGb3J3YXJkXG4gICAqL1xuICBzdGF0aWMgdHJ5TG9va0ZvcndhcmQoZm9yd2FyZDogSVZlY3RvcjMpOiBRdWF0ZXJuaW9uIHwgbnVsbCB7XG4gICAgcmV0dXJuIHN1cGVyLnRyeUxvb2tGb3J3YXJkKGZvcndhcmQpIGFzIFF1YXRlcm5pb24gfCBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIGxvb2tGb3J3YXJkXG4gICAqL1xuICBzdGF0aWMgbG9va0ZvcndhcmQoZm9yd2FyZDogSVZlY3RvcjMpOiBRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gc3VwZXIubG9va0ZvcndhcmQoZm9yd2FyZCkgYXMgUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiB0cnlMb29rRm9yd2FyZEFjY29yZGluZ1RvVGhpc1VwXG4gICAqL1xuICBzdGF0aWMgdHJ5TG9va0ZvcndhcmRBY2NvcmRpbmdUb1RoaXNVcChmb3J3YXJkOiBJVmVjdG9yMywgdXA6IElWZWN0b3IzKTogUXVhdGVybmlvbiB8IG51bGwge1xuICAgIHJldHVybiBzdXBlci50cnlMb29rRm9yd2FyZEFjY29yZGluZ1RvVGhpc1VwKGZvcndhcmQsIHVwKSBhcyBRdWF0ZXJuaW9uIHwgbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBsb29rRm9yd2FyZEFjY29yZGluZ1RvVGhpc1VwXG4gICAqL1xuICBzdGF0aWMgbG9va0ZvcndhcmRBY2NvcmRpbmdUb1RoaXNVcChmb3J3YXJkOiBJVmVjdG9yMywgdXA6IElWZWN0b3IzKTogUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIHN1cGVyLmxvb2tGb3J3YXJkQWNjb3JkaW5nVG9UaGlzVXAoZm9yd2FyZCwgdXApIGFzIFF1YXRlcm5pb247XG4gIH1cblxuICAvKipcbiAgICogZnJvbVBvc2l0aW9uXG4gICAqL1xuICBzdGF0aWMgZnJvbVBvc2l0aW9uKHZlYzogSVZlY3RvcjMpOiBRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gc3VwZXIuZnJvbVBvc2l0aW9uKHZlYykgYXMgUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBhZGRcbiAgICovXG4gIHN0YXRpYyBhZGQobF9xdWF0OiBJUXVhdGVybmlvbiwgcl9xdWF0OiBJUXVhdGVybmlvbik6IFF1YXRlcm5pb24ge1xuICAgIHJldHVybiBzdXBlci5hZGQobF9xdWF0LCByX3F1YXQpIGFzIFF1YXRlcm5pb247XG4gIH1cblxuICAvKipcbiAgICogYWRkVG9cbiAgICovXG4gIHN0YXRpYyBhZGRUbyhsX3F1YXQ6IElRdWF0ZXJuaW9uLCByX3F1YXQ6IElRdWF0ZXJuaW9uLCBvdXQ6IElNdXRhYmxlUXVhdGVybmlvbik6IElNdXRhYmxlUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIHN1cGVyLmFkZFRvKGxfcXVhdCwgcl9xdWF0LCBvdXQpIGFzIElNdXRhYmxlUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBzdWJ0cmFjdFxuICAgKi9cbiAgc3RhdGljIHN1YnRyYWN0KGxfcXVhdDogSVF1YXRlcm5pb24sIHJfcXVhdDogSVF1YXRlcm5pb24pOiBRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gc3VwZXIuc3VidHJhY3QobF9xdWF0LCByX3F1YXQpIGFzIFF1YXRlcm5pb247XG4gIH1cblxuICAvKipcbiAgICogc3VidHJhY3RUb1xuICAgKi9cbiAgc3RhdGljIHN1YnRyYWN0VG8obF9xdWF0OiBJUXVhdGVybmlvbiwgcl9xdWF0OiBJUXVhdGVybmlvbiwgb3V0OiBJTXV0YWJsZVF1YXRlcm5pb24pOiBJTXV0YWJsZVF1YXRlcm5pb24ge1xuICAgIHJldHVybiBzdXBlci5zdWJ0cmFjdFRvKGxfcXVhdCwgcl9xdWF0LCBvdXQpIGFzIElNdXRhYmxlUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBtdWx0aXBseVxuICAgKi9cbiAgc3RhdGljIG11bHRpcGx5KGxfcXVhdDogSVF1YXRlcm5pb24sIHJfcXVhdDogSVF1YXRlcm5pb24pOiBRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gc3VwZXIubXVsdGlwbHkobF9xdWF0LCByX3F1YXQpIGFzIFF1YXRlcm5pb247XG4gIH1cblxuICAvKipcbiAgICogbXVsdGlwbHlUb1xuICAgKi9cbiAgc3RhdGljIG11bHRpcGx5VG8obF9xdWF0OiBJUXVhdGVybmlvbiwgcl9xdWF0OiBJUXVhdGVybmlvbiwgb3V0OiBJTXV0YWJsZVF1YXRlcm5pb24pOiBJTXV0YWJsZVF1YXRlcm5pb24ge1xuICAgIHJldHVybiBzdXBlci5tdWx0aXBseVRvKGxfcXVhdCwgcl9xdWF0LCBvdXQpIGFzIElNdXRhYmxlUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBtdWx0aXBseU51bWJlclxuICAgKi9cbiAgc3RhdGljIG11bHRpcGx5TnVtYmVyKHF1YXQ6IElRdWF0ZXJuaW9uLCB2YWx1ZTogbnVtYmVyKTogUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIHN1cGVyLm11bHRpcGx5TnVtYmVyKHF1YXQsIHZhbHVlKSBhcyBRdWF0ZXJuaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIG11bHRpcGx5TnVtYmVyVG9cbiAgICovXG4gIHN0YXRpYyBtdWx0aXBseU51bWJlclRvKHF1YXQ6IElRdWF0ZXJuaW9uLCB2YWx1ZTogbnVtYmVyLCBvdXQ6IElNdXRhYmxlUXVhdGVybmlvbik6IElNdXRhYmxlUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIHN1cGVyLm11bHRpcGx5TnVtYmVyVG8ocXVhdCwgdmFsdWUsIG91dCkgYXMgSU11dGFibGVRdWF0ZXJuaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIGRpdmlkZU51bWJlclxuICAgKi9cbiAgc3RhdGljIGRpdmlkZU51bWJlcihxdWF0OiBJUXVhdGVybmlvbiwgdmFsdWU6IG51bWJlcik6IFF1YXRlcm5pb24ge1xuICAgIHJldHVybiBzdXBlci5kaXZpZGVOdW1iZXIocXVhdCwgdmFsdWUpIGFzIFF1YXRlcm5pb247XG4gIH1cblxuICAvKipcbiAgICogZGl2aWRlTnVtYmVyVG9cbiAgICovXG4gIHN0YXRpYyBkaXZpZGVOdW1iZXJUbyhxdWF0OiBJUXVhdGVybmlvbiwgdmFsdWU6IG51bWJlciwgb3V0OiBJTXV0YWJsZVF1YXRlcm5pb24pOiBJTXV0YWJsZVF1YXRlcm5pb24ge1xuICAgIHJldHVybiBzdXBlci5kaXZpZGVOdW1iZXJUbyhxdWF0LCB2YWx1ZSwgb3V0KSBhcyBJTXV0YWJsZVF1YXRlcm5pb247XG4gIH1cblxuICAvKipcbiAgICogbm9ybWFsaXplXG4gICAqL1xuICBzdGF0aWMgbm9ybWFsaXplKHZlYzogSVF1YXRlcm5pb24pOiBRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gc3VwZXIubm9ybWFsaXplKHZlYykgYXMgUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBub3JtYWxpemVUb1xuICAgKi9cbiAgc3RhdGljIG5vcm1hbGl6ZVRvKHZlYzogSVF1YXRlcm5pb24sIG91dDogSU11dGFibGVRdWF0ZXJuaW9uKTogSU11dGFibGVRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gc3VwZXIubm9ybWFsaXplVG8odmVjLCBvdXQpIGFzIElNdXRhYmxlUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBmcm9tVG9Sb3RhdGlvblxuICAgKi9cbiAgc3RhdGljIGZyb21Ub1JvdGF0aW9uKGZyb206IElWZWN0b3IzLCB0bzogSVZlY3RvcjMpOiBRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gc3VwZXIuZnJvbVRvUm90YXRpb24oZnJvbSwgdG8pIGFzIFF1YXRlcm5pb247XG4gIH1cblxuICAvKipcbiAgICogZnJvbVRvUm90YXRpb25Ub1xuICAgKi9cbiAgc3RhdGljIGZyb21Ub1JvdGF0aW9uVG8oZnJvbTogSVZlY3RvcjMsIHRvOiBJVmVjdG9yMywgb3V0OiBJTXV0YWJsZVF1YXRlcm5pb24pOiBJTXV0YWJsZVF1YXRlcm5pb24ge1xuICAgIHJldHVybiBzdXBlci5mcm9tVG9Sb3RhdGlvblRvKGZyb20sIHRvLCBvdXQpIGFzIElNdXRhYmxlUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcXVhdGVybmlvbiB0aGF0IGRpcmVjdGx5IHVzZXMgdGhlIGdpdmVuIEZsb2F0MzJBcnJheSAobm8gY29weSkuXG4gICAqL1xuICBzdGF0aWMgZnJvbUZsb2F0MzJBcnJheShhcnJheTogRmxvYXQzMkFycmF5KTogUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIHN1cGVyLmZyb21UeXBlZEFycmF5KGFycmF5KSBhcyBRdWF0ZXJuaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIGZyb21Db3B5QXJyYXk0XG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheTQoYXJyYXk6IEFycmF5NDxudW1iZXI+KTogUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIHN1cGVyLmZyb21Db3B5QXJyYXk0KGFycmF5KSBhcyBRdWF0ZXJuaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIGZyb21Db3B5QXJyYXlcbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weUFycmF5KGFycmF5OiBBcnJheTxudW1iZXI+KTogUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIHN1cGVyLmZyb21Db3B5QXJyYXkoYXJyYXkpIGFzIFF1YXRlcm5pb247XG4gIH1cblxuICAvKipcbiAgICogZnJvbUNvcHk0XG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHk0KHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIsIHc6IG51bWJlcik6IFF1YXRlcm5pb24ge1xuICAgIHJldHVybiBzdXBlci5mcm9tQ29weTQoeCwgeSwgeiwgdykgYXMgUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBmcm9tQ29weVF1YXRlcm5pb25cbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weVF1YXRlcm5pb24ocXVhdDogSVF1YXRlcm5pb24pOiBRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gc3VwZXIuZnJvbUNvcHlRdWF0ZXJuaW9uKHF1YXQpIGFzIFF1YXRlcm5pb247XG4gIH1cblxuICAvKipcbiAgICogZnJvbUNvcHlWZWN0b3I0XG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHlWZWN0b3I0KHZlYzogSVZlY3RvcjQpOiBRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gc3VwZXIuZnJvbUNvcHlWZWN0b3I0KHZlYykgYXMgUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBmcm9tQ29weUxvZ1F1YXRlcm5pb25cbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weUxvZ1F1YXRlcm5pb24oeDogSUxvZ1F1YXRlcm5pb24pOiBRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gc3VwZXIuZnJvbUNvcHlMb2dRdWF0ZXJuaW9uKHgpIGFzIFF1YXRlcm5pb247XG4gIH1cblxuICAvKipcbiAgICogZnJvbUF4aXNBbmdsZVxuICAgKi9cbiAgc3RhdGljIGZyb21BeGlzQW5nbGUoYXhpczogSVZlY3RvcjMsIHJhZDogbnVtYmVyKTogUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIHN1cGVyLmZyb21BeGlzQW5nbGUoYXhpcywgcmFkKSBhcyBRdWF0ZXJuaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIGZyb21BeGlzQW5nbGVUb1xuICAgKi9cbiAgc3RhdGljIGZyb21BeGlzQW5nbGVUbyhheGlzOiBJVmVjdG9yMywgcmFkOiBudW1iZXIsIG91dDogSU11dGFibGVRdWF0ZXJuaW9uKTogSU11dGFibGVRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gc3VwZXIuZnJvbUF4aXNBbmdsZVRvKGF4aXMsIHJhZCwgb3V0KSBhcyBJTXV0YWJsZVF1YXRlcm5pb247XG4gIH1cblxuICAvKipcbiAgICogZ2V0UXVhdGVybmlvbkFuZ2xlXG4gICAqL1xuICBzdGF0aWMgZ2V0UXVhdGVybmlvbkFuZ2xlKHE6IElRdWF0ZXJuaW9uKTogbnVtYmVyIHtcbiAgICByZXR1cm4gc3VwZXIuZ2V0UXVhdGVybmlvbkFuZ2xlKHEpIGFzIG51bWJlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBjbGFtcFJvdGF0aW9uXG4gICAqL1xuICBzdGF0aWMgY2xhbXBSb3RhdGlvbihxdWF0OiBJUXVhdGVybmlvbiwgdGhldGFNYXg6IG51bWJlcik6IElRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gc3VwZXIuY2xhbXBSb3RhdGlvbihxdWF0LCB0aGV0YU1heCkgYXMgSVF1YXRlcm5pb247XG4gIH1cbn1cblxuLyoqXG4gKiBJbW11dGFibGUgcXVhdGVybmlvbiB3aXRoIDY0LWJpdCBmbG9hdCBjb21wb25lbnRzLlxuICovXG5leHBvcnQgY2xhc3MgUXVhdGVybmlvbkQgZXh0ZW5kcyBRdWF0ZXJuaW9uXzxGbG9hdDY0QXJyYXlDb25zdHJ1Y3Rvcj4ge1xuICAvKiogVGhlIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9yIHVzZWQgZm9yIG5ld2x5IGNyZWF0ZWQgcXVhdGVybmlvbnMuICovXG4gIHByb3RlY3RlZCBzdGF0aWMgb3ZlcnJpZGUgcmVhZG9ubHkgX3R5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yID0gRmxvYXQ2NEFycmF5O1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IFF1YXRlcm5pb25EIGluc3RhbmNlLlxuICAgKiBAcGFyYW0gdiAtIFRoZSB0eXBlZCBhcnJheSBjb250YWluaW5nIHRoZSBxdWF0ZXJuaW9uIGNvbXBvbmVudHNcbiAgICovXG4gIGNvbnN0cnVjdG9yKHY6IFR5cGVkQXJyYXkpIHtcbiAgICBzdXBlcih2LCB7IHR5cGU6IEZsb2F0NjRBcnJheSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBpZGVudGl0eVxuICAgKi9cbiAgc3RhdGljIGlkZW50aXR5KCk6IFF1YXRlcm5pb25EIHtcbiAgICByZXR1cm4gc3VwZXIuaWRlbnRpdHkoKSBhcyBRdWF0ZXJuaW9uRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBkdW1teVxuICAgKi9cbiAgc3RhdGljIGR1bW15KCk6IFF1YXRlcm5pb25EIHtcbiAgICByZXR1cm4gc3VwZXIuZHVtbXkoKSBhcyBRdWF0ZXJuaW9uRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBpbnZlcnRcbiAgICovXG4gIHN0YXRpYyBpbnZlcnQocXVhdDogSVF1YXRlcm5pb24pOiBRdWF0ZXJuaW9uRCB7XG4gICAgcmV0dXJuIHN1cGVyLmludmVydChxdWF0KSBhcyBRdWF0ZXJuaW9uRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBpbnZlcnRUb1xuICAgKi9cbiAgc3RhdGljIGludmVydFRvKHF1YXQ6IElRdWF0ZXJuaW9uLCBvdXQ6IElNdXRhYmxlUXVhdGVybmlvbik6IElNdXRhYmxlUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIHN1cGVyLmludmVydFRvKHF1YXQsIG91dCkgYXMgSU11dGFibGVRdWF0ZXJuaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIHFsZXJwXG4gICAqL1xuICBzdGF0aWMgcWxlcnAobF9xdWF0OiBJUXVhdGVybmlvbiwgcl9xdWF0OiBJUXVhdGVybmlvbiwgcmF0aW86IG51bWJlcik6IFF1YXRlcm5pb25EIHtcbiAgICByZXR1cm4gc3VwZXIucWxlcnAobF9xdWF0LCByX3F1YXQsIHJhdGlvKSBhcyBRdWF0ZXJuaW9uRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBxbGVycFRvXG4gICAqL1xuICBzdGF0aWMgcWxlcnBUbyhsX3F1YXQ6IElRdWF0ZXJuaW9uLCByX3F1YXQ6IElRdWF0ZXJuaW9uLCByYXRpbzogbnVtYmVyLCBvdXQ6IElNdXRhYmxlUXVhdGVybmlvbik6IElNdXRhYmxlUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIHN1cGVyLnFsZXJwVG8obF9xdWF0LCByX3F1YXQsIHJhdGlvLCBvdXQpIGFzIElNdXRhYmxlUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBsZXJwXG4gICAqL1xuICBzdGF0aWMgbGVycChsX3F1YXQ6IElRdWF0ZXJuaW9uLCByX3F1YXQ6IElRdWF0ZXJuaW9uLCByYXRpbzogbnVtYmVyKTogUXVhdGVybmlvbkQge1xuICAgIHJldHVybiBzdXBlci5sZXJwKGxfcXVhdCwgcl9xdWF0LCByYXRpbykgYXMgUXVhdGVybmlvbkQ7XG4gIH1cblxuICAvKipcbiAgICogbGVycFRvXG4gICAqL1xuICBzdGF0aWMgbGVycFRvKGxfcXVhdDogSVF1YXRlcm5pb24sIHJfcXVhdDogSVF1YXRlcm5pb24sIHJhdGlvOiBudW1iZXIsIG91dDogSU11dGFibGVRdWF0ZXJuaW9uKTogSU11dGFibGVRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gc3VwZXIubGVycFRvKGxfcXVhdCwgcl9xdWF0LCByYXRpbywgb3V0KSBhcyBJTXV0YWJsZVF1YXRlcm5pb247XG4gIH1cblxuICAvKipcbiAgICogdHJ5QXhpc0FuZ2xlXG4gICAqL1xuICBzdGF0aWMgdHJ5QXhpc0FuZ2xlKHZlYzogSVZlY3RvcjMsIHJhZGlhbjogbnVtYmVyKTogUXVhdGVybmlvbkQgfCBudWxsIHtcbiAgICByZXR1cm4gc3VwZXIudHJ5QXhpc0FuZ2xlKHZlYywgcmFkaWFuKSBhcyBRdWF0ZXJuaW9uRCB8IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogYXhpc0FuZ2xlXG4gICAqL1xuICBzdGF0aWMgYXhpc0FuZ2xlKHZlYzogSVZlY3RvcjMsIHJhZGlhbjogbnVtYmVyKTogUXVhdGVybmlvbkQge1xuICAgIHJldHVybiBzdXBlci5heGlzQW5nbGUodmVjLCByYWRpYW4pIGFzIFF1YXRlcm5pb25EO1xuICB9XG5cbiAgLyoqXG4gICAqIHRyeUZyb21NYXRyaXhcbiAgICovXG4gIHN0YXRpYyB0cnlGcm9tTWF0cml4KG1hdDogSU1hdHJpeDQ0KTogUXVhdGVybmlvbkQgfCBudWxsIHtcbiAgICByZXR1cm4gc3VwZXIudHJ5RnJvbU1hdHJpeChtYXQpIGFzIFF1YXRlcm5pb25EIHwgbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBmcm9tTWF0cml4XG4gICAqL1xuICBzdGF0aWMgZnJvbU1hdHJpeChtYXQ6IElNYXRyaXg0NCk6IFF1YXRlcm5pb25EIHtcbiAgICByZXR1cm4gc3VwZXIuZnJvbU1hdHJpeChtYXQpIGFzIFF1YXRlcm5pb25EO1xuICB9XG5cbiAgLyoqXG4gICAqIHRyeUZyb21NYXRyaXhUb1xuICAgKi9cbiAgc3RhdGljIHRyeUZyb21NYXRyaXhUbyhtYXQ6IElNYXRyaXg0NCwgb3V0OiBJTXV0YWJsZVF1YXRlcm5pb24pOiBib29sZWFuIHtcbiAgICByZXR1cm4gc3VwZXIudHJ5RnJvbU1hdHJpeFRvKG1hdCwgb3V0KSBhcyBib29sZWFuO1xuICB9XG5cbiAgLyoqXG4gICAqIGZyb21NYXRyaXhUb1xuICAgKi9cbiAgc3RhdGljIGZyb21NYXRyaXhUbyhtYXQ6IElNYXRyaXg0NCwgb3V0OiBJTXV0YWJsZVF1YXRlcm5pb24pOiBJTXV0YWJsZVF1YXRlcm5pb24ge1xuICAgIHJldHVybiBzdXBlci5mcm9tTWF0cml4VG8obWF0LCBvdXQpIGFzIElNdXRhYmxlUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBsb29rRnJvbVRvXG4gICAqL1xuICBzdGF0aWMgbG9va0Zyb21Ubyhmcm9tRGlyZWN0aW9uOiBJVmVjdG9yMywgdG9EaXJlY3Rpb246IElWZWN0b3IzKTogSU11dGFibGVRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gc3VwZXIubG9va0Zyb21Ubyhmcm9tRGlyZWN0aW9uLCB0b0RpcmVjdGlvbikgYXMgSU11dGFibGVRdWF0ZXJuaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIHRyeUxvb2tGb3J3YXJkXG4gICAqL1xuICBzdGF0aWMgdHJ5TG9va0ZvcndhcmQoZm9yd2FyZDogSVZlY3RvcjMpOiBRdWF0ZXJuaW9uRCB8IG51bGwge1xuICAgIHJldHVybiBzdXBlci50cnlMb29rRm9yd2FyZChmb3J3YXJkKSBhcyBRdWF0ZXJuaW9uRCB8IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogbG9va0ZvcndhcmRcbiAgICovXG4gIHN0YXRpYyBsb29rRm9yd2FyZChmb3J3YXJkOiBJVmVjdG9yMyk6IFF1YXRlcm5pb25EIHtcbiAgICByZXR1cm4gc3VwZXIubG9va0ZvcndhcmQoZm9yd2FyZCkgYXMgUXVhdGVybmlvbkQ7XG4gIH1cblxuICAvKipcbiAgICogdHJ5TG9va0ZvcndhcmRBY2NvcmRpbmdUb1RoaXNVcFxuICAgKi9cbiAgc3RhdGljIHRyeUxvb2tGb3J3YXJkQWNjb3JkaW5nVG9UaGlzVXAoZm9yd2FyZDogSVZlY3RvcjMsIHVwOiBJVmVjdG9yMyk6IFF1YXRlcm5pb25EIHwgbnVsbCB7XG4gICAgcmV0dXJuIHN1cGVyLnRyeUxvb2tGb3J3YXJkQWNjb3JkaW5nVG9UaGlzVXAoZm9yd2FyZCwgdXApIGFzIFF1YXRlcm5pb25EIHwgbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBsb29rRm9yd2FyZEFjY29yZGluZ1RvVGhpc1VwXG4gICAqL1xuICBzdGF0aWMgbG9va0ZvcndhcmRBY2NvcmRpbmdUb1RoaXNVcChmb3J3YXJkOiBJVmVjdG9yMywgdXA6IElWZWN0b3IzKTogUXVhdGVybmlvbkQge1xuICAgIHJldHVybiBzdXBlci5sb29rRm9yd2FyZEFjY29yZGluZ1RvVGhpc1VwKGZvcndhcmQsIHVwKSBhcyBRdWF0ZXJuaW9uRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBmcm9tUG9zaXRpb25cbiAgICovXG4gIHN0YXRpYyBmcm9tUG9zaXRpb24odmVjOiBJVmVjdG9yMyk6IFF1YXRlcm5pb25EIHtcbiAgICByZXR1cm4gc3VwZXIuZnJvbVBvc2l0aW9uKHZlYykgYXMgUXVhdGVybmlvbkQ7XG4gIH1cblxuICAvKipcbiAgICogYWRkXG4gICAqL1xuICBzdGF0aWMgYWRkKGxfcXVhdDogSVF1YXRlcm5pb24sIHJfcXVhdDogSVF1YXRlcm5pb24pOiBRdWF0ZXJuaW9uRCB7XG4gICAgcmV0dXJuIHN1cGVyLmFkZChsX3F1YXQsIHJfcXVhdCkgYXMgUXVhdGVybmlvbkQ7XG4gIH1cblxuICAvKipcbiAgICogYWRkVG9cbiAgICovXG4gIHN0YXRpYyBhZGRUbyhsX3F1YXQ6IElRdWF0ZXJuaW9uLCByX3F1YXQ6IElRdWF0ZXJuaW9uLCBvdXQ6IElNdXRhYmxlUXVhdGVybmlvbik6IElNdXRhYmxlUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIHN1cGVyLmFkZFRvKGxfcXVhdCwgcl9xdWF0LCBvdXQpIGFzIElNdXRhYmxlUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBzdWJ0cmFjdFxuICAgKi9cbiAgc3RhdGljIHN1YnRyYWN0KGxfcXVhdDogSVF1YXRlcm5pb24sIHJfcXVhdDogSVF1YXRlcm5pb24pOiBRdWF0ZXJuaW9uRCB7XG4gICAgcmV0dXJuIHN1cGVyLnN1YnRyYWN0KGxfcXVhdCwgcl9xdWF0KSBhcyBRdWF0ZXJuaW9uRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBzdWJ0cmFjdFRvXG4gICAqL1xuICBzdGF0aWMgc3VidHJhY3RUbyhsX3F1YXQ6IElRdWF0ZXJuaW9uLCByX3F1YXQ6IElRdWF0ZXJuaW9uLCBvdXQ6IElNdXRhYmxlUXVhdGVybmlvbik6IElNdXRhYmxlUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIHN1cGVyLnN1YnRyYWN0VG8obF9xdWF0LCByX3F1YXQsIG91dCkgYXMgSU11dGFibGVRdWF0ZXJuaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIG11bHRpcGx5XG4gICAqL1xuICBzdGF0aWMgbXVsdGlwbHkobF9xdWF0OiBJUXVhdGVybmlvbiwgcl9xdWF0OiBJUXVhdGVybmlvbik6IFF1YXRlcm5pb25EIHtcbiAgICByZXR1cm4gc3VwZXIubXVsdGlwbHkobF9xdWF0LCByX3F1YXQpIGFzIFF1YXRlcm5pb25EO1xuICB9XG5cbiAgLyoqXG4gICAqIG11bHRpcGx5VG9cbiAgICovXG4gIHN0YXRpYyBtdWx0aXBseVRvKGxfcXVhdDogSVF1YXRlcm5pb24sIHJfcXVhdDogSVF1YXRlcm5pb24sIG91dDogSU11dGFibGVRdWF0ZXJuaW9uKTogSU11dGFibGVRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gc3VwZXIubXVsdGlwbHlUbyhsX3F1YXQsIHJfcXVhdCwgb3V0KSBhcyBJTXV0YWJsZVF1YXRlcm5pb247XG4gIH1cblxuICAvKipcbiAgICogbXVsdGlwbHlOdW1iZXJcbiAgICovXG4gIHN0YXRpYyBtdWx0aXBseU51bWJlcihxdWF0OiBJUXVhdGVybmlvbiwgdmFsdWU6IG51bWJlcik6IFF1YXRlcm5pb25EIHtcbiAgICByZXR1cm4gc3VwZXIubXVsdGlwbHlOdW1iZXIocXVhdCwgdmFsdWUpIGFzIFF1YXRlcm5pb25EO1xuICB9XG5cbiAgLyoqXG4gICAqIG11bHRpcGx5TnVtYmVyVG9cbiAgICovXG4gIHN0YXRpYyBtdWx0aXBseU51bWJlclRvKHF1YXQ6IElRdWF0ZXJuaW9uLCB2YWx1ZTogbnVtYmVyLCBvdXQ6IElNdXRhYmxlUXVhdGVybmlvbik6IElNdXRhYmxlUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIHN1cGVyLm11bHRpcGx5TnVtYmVyVG8ocXVhdCwgdmFsdWUsIG91dCkgYXMgSU11dGFibGVRdWF0ZXJuaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIGRpdmlkZU51bWJlclxuICAgKi9cbiAgc3RhdGljIGRpdmlkZU51bWJlcihxdWF0OiBJUXVhdGVybmlvbiwgdmFsdWU6IG51bWJlcik6IFF1YXRlcm5pb25EIHtcbiAgICByZXR1cm4gc3VwZXIuZGl2aWRlTnVtYmVyKHF1YXQsIHZhbHVlKSBhcyBRdWF0ZXJuaW9uRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBkaXZpZGVOdW1iZXJUb1xuICAgKi9cbiAgc3RhdGljIGRpdmlkZU51bWJlclRvKHF1YXQ6IElRdWF0ZXJuaW9uLCB2YWx1ZTogbnVtYmVyLCBvdXQ6IElNdXRhYmxlUXVhdGVybmlvbik6IElNdXRhYmxlUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIHN1cGVyLmRpdmlkZU51bWJlclRvKHF1YXQsIHZhbHVlLCBvdXQpIGFzIElNdXRhYmxlUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBub3JtYWxpemVcbiAgICovXG4gIHN0YXRpYyBub3JtYWxpemUodmVjOiBJUXVhdGVybmlvbik6IFF1YXRlcm5pb25EIHtcbiAgICByZXR1cm4gc3VwZXIubm9ybWFsaXplKHZlYykgYXMgUXVhdGVybmlvbkQ7XG4gIH1cblxuICAvKipcbiAgICogbm9ybWFsaXplVG9cbiAgICovXG4gIHN0YXRpYyBub3JtYWxpemVUbyh2ZWM6IElRdWF0ZXJuaW9uLCBvdXQ6IElNdXRhYmxlUXVhdGVybmlvbik6IElNdXRhYmxlUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIHN1cGVyLm5vcm1hbGl6ZVRvKHZlYywgb3V0KSBhcyBJTXV0YWJsZVF1YXRlcm5pb247XG4gIH1cblxuICAvKipcbiAgICogZnJvbVRvUm90YXRpb25cbiAgICovXG4gIHN0YXRpYyBmcm9tVG9Sb3RhdGlvbihmcm9tOiBJVmVjdG9yMywgdG86IElWZWN0b3IzKTogUXVhdGVybmlvbkQge1xuICAgIHJldHVybiBzdXBlci5mcm9tVG9Sb3RhdGlvbihmcm9tLCB0bykgYXMgUXVhdGVybmlvbkQ7XG4gIH1cblxuICAvKipcbiAgICogZnJvbVRvUm90YXRpb25Ub1xuICAgKi9cbiAgc3RhdGljIGZyb21Ub1JvdGF0aW9uVG8oZnJvbTogSVZlY3RvcjMsIHRvOiBJVmVjdG9yMywgb3V0OiBJTXV0YWJsZVF1YXRlcm5pb24pOiBJTXV0YWJsZVF1YXRlcm5pb24ge1xuICAgIHJldHVybiBzdXBlci5mcm9tVG9Sb3RhdGlvblRvKGZyb20sIHRvLCBvdXQpIGFzIElNdXRhYmxlUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcXVhdGVybmlvbiB0aGF0IGRpcmVjdGx5IHVzZXMgdGhlIGdpdmVuIEZsb2F0NjRBcnJheSAobm8gY29weSkuXG4gICAqL1xuICBzdGF0aWMgZnJvbUZsb2F0NjRBcnJheShhcnJheTogRmxvYXQ2NEFycmF5KTogUXVhdGVybmlvbkQge1xuICAgIHJldHVybiBzdXBlci5mcm9tVHlwZWRBcnJheShhcnJheSkgYXMgUXVhdGVybmlvbkQ7XG4gIH1cblxuICAvKipcbiAgICogZnJvbUNvcHlBcnJheTRcbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weUFycmF5NChhcnJheTogQXJyYXk0PG51bWJlcj4pOiBRdWF0ZXJuaW9uRCB7XG4gICAgcmV0dXJuIHN1cGVyLmZyb21Db3B5QXJyYXk0KGFycmF5KSBhcyBRdWF0ZXJuaW9uRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBmcm9tQ29weUFycmF5XG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheShhcnJheTogQXJyYXk8bnVtYmVyPik6IFF1YXRlcm5pb25EIHtcbiAgICByZXR1cm4gc3VwZXIuZnJvbUNvcHlBcnJheShhcnJheSkgYXMgUXVhdGVybmlvbkQ7XG4gIH1cblxuICAvKipcbiAgICogZnJvbUNvcHk0XG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHk0KHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIsIHc6IG51bWJlcik6IFF1YXRlcm5pb25EIHtcbiAgICByZXR1cm4gc3VwZXIuZnJvbUNvcHk0KHgsIHksIHosIHcpIGFzIFF1YXRlcm5pb25EO1xuICB9XG5cbiAgLyoqXG4gICAqIGZyb21Db3B5UXVhdGVybmlvblxuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5UXVhdGVybmlvbihxdWF0OiBJUXVhdGVybmlvbik6IFF1YXRlcm5pb25EIHtcbiAgICByZXR1cm4gc3VwZXIuZnJvbUNvcHlRdWF0ZXJuaW9uKHF1YXQpIGFzIFF1YXRlcm5pb25EO1xuICB9XG5cbiAgLyoqXG4gICAqIGZyb21Db3B5VmVjdG9yNFxuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5VmVjdG9yNCh2ZWM6IElWZWN0b3I0KTogUXVhdGVybmlvbkQge1xuICAgIHJldHVybiBzdXBlci5mcm9tQ29weVZlY3RvcjQodmVjKSBhcyBRdWF0ZXJuaW9uRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBmcm9tQ29weUxvZ1F1YXRlcm5pb25cbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weUxvZ1F1YXRlcm5pb24oeDogSUxvZ1F1YXRlcm5pb24pOiBRdWF0ZXJuaW9uRCB7XG4gICAgcmV0dXJuIHN1cGVyLmZyb21Db3B5TG9nUXVhdGVybmlvbih4KSBhcyBRdWF0ZXJuaW9uRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBmcm9tQXhpc0FuZ2xlXG4gICAqL1xuICBzdGF0aWMgZnJvbUF4aXNBbmdsZShheGlzOiBJVmVjdG9yMywgcmFkOiBudW1iZXIpOiBRdWF0ZXJuaW9uRCB7XG4gICAgcmV0dXJuIHN1cGVyLmZyb21BeGlzQW5nbGUoYXhpcywgcmFkKSBhcyBRdWF0ZXJuaW9uRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBmcm9tQXhpc0FuZ2xlVG9cbiAgICovXG4gIHN0YXRpYyBmcm9tQXhpc0FuZ2xlVG8oYXhpczogSVZlY3RvcjMsIHJhZDogbnVtYmVyLCBvdXQ6IElNdXRhYmxlUXVhdGVybmlvbik6IElNdXRhYmxlUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIHN1cGVyLmZyb21BeGlzQW5nbGVUbyhheGlzLCByYWQsIG91dCkgYXMgSU11dGFibGVRdWF0ZXJuaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIGdldFF1YXRlcm5pb25BbmdsZVxuICAgKi9cbiAgc3RhdGljIGdldFF1YXRlcm5pb25BbmdsZShxOiBJUXVhdGVybmlvbik6IG51bWJlciB7XG4gICAgcmV0dXJuIHN1cGVyLmdldFF1YXRlcm5pb25BbmdsZShxKSBhcyBudW1iZXI7XG4gIH1cblxuICAvKipcbiAgICogY2xhbXBSb3RhdGlvblxuICAgKi9cbiAgc3RhdGljIGNsYW1wUm90YXRpb24ocXVhdDogSVF1YXRlcm5pb24sIHRoZXRhTWF4OiBudW1iZXIpOiBJUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIHN1cGVyLmNsYW1wUm90YXRpb24ocXVhdCwgdGhldGFNYXgpIGFzIElRdWF0ZXJuaW9uO1xuICB9XG59XG5cbi8qKlxuICogQWxpYXMgZm9yIHRoZSAzMi1iaXQgKEZsb2F0MzJBcnJheSkgaW1wbGVtZW50YXRpb24sIG1ha2luZyB0aGUgcHJlY2lzaW9uIGV4cGxpY2l0LlxuICovXG5leHBvcnQgeyBRdWF0ZXJuaW9uIGFzIFF1YXRlcm5pb25GIH07XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxjQUFjO0FBQ3ZCLFNBQVMsMEJBQTBCO0FBSW5DLFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsc0JBQXNCO0FBQy9CLFNBQVMsZUFBZTtBQXdCakIsSUFBTSxjQUFOLGNBQWdFLG1CQUEwQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWlCL0csWUFBWSxHQUFlLFVBQXdCO0FBQ2pELFVBQU07QUFDTixTQUFLLEtBQUs7QUFBQSxFQUNaO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUksWUFBWTtBQUNkLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLFdBQVcsa0JBQWtCO0FBQzNCLFdBQU8sZ0JBQWdCO0FBQUEsRUFDekI7QUFB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QUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsT0FBTyxJQUFJLFFBQXFCLFFBQXFCO0FBQ25ELFVBQU0sSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLE9BQU8sR0FBRyxDQUFDO0FBQ3BDLFVBQU0sSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLE9BQU8sR0FBRyxDQUFDO0FBQ3BDLFVBQU0sSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLE9BQU8sR0FBRyxDQUFDO0FBQ3BDLFVBQU0sSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLE9BQU8sR0FBRyxDQUFDO0FBQ3BDLFdBQU8sS0FBSyxVQUFVLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFBQSxFQUNsQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFTQSxPQUFPLE1BQU0sUUFBcUIsUUFBcUIsS0FBeUI7QUFDOUUsUUFBSSxHQUFHLENBQUMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLE9BQU8sR0FBRyxDQUFDO0FBQ3RDLFFBQUksR0FBRyxDQUFDLElBQUksT0FBTyxHQUFHLENBQUMsSUFBSSxPQUFPLEdBQUcsQ0FBQztBQUN0QyxRQUFJLEdBQUcsQ0FBQyxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksT0FBTyxHQUFHLENBQUM7QUFDdEMsUUFBSSxHQUFHLENBQUMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLE9BQU8sR0FBRyxDQUFDO0FBQ3RDLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxPQUFPLFNBQVMsUUFBcUIsUUFBcUI7QUFDeEQsVUFBTSxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksT0FBTyxHQUFHLENBQUM7QUFDcEMsVUFBTSxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksT0FBTyxHQUFHLENBQUM7QUFDcEMsVUFBTSxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksT0FBTyxHQUFHLENBQUM7QUFDcEMsVUFBTSxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksT0FBTyxHQUFHLENBQUM7QUFDcEMsV0FBTyxLQUFLLFVBQVUsR0FBRyxHQUFHLEdBQUcsQ0FBQztBQUFBLEVBQ2xDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBLE9BQU8sV0FBVyxRQUFxQixRQUFxQixLQUF5QjtBQUNuRixRQUFJLEdBQUcsQ0FBQyxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksT0FBTyxHQUFHLENBQUM7QUFDdEMsUUFBSSxHQUFHLENBQUMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLE9BQU8sR0FBRyxDQUFDO0FBQ3RDLFFBQUksR0FBRyxDQUFDLElBQUksT0FBTyxHQUFHLENBQUMsSUFBSSxPQUFPLEdBQUcsQ0FBQztBQUN0QyxRQUFJLEdBQUcsQ0FBQyxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksT0FBTyxHQUFHLENBQUM7QUFDdEMsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFVQSxPQUFPLFNBQVMsUUFBcUIsUUFBcUI7QUFDeEQsVUFBTSxJQUNKLE9BQU8sR0FBRyxDQUFDLElBQUksT0FBTyxHQUFHLENBQUMsSUFDMUIsT0FBTyxHQUFHLENBQUMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUMxQixPQUFPLEdBQUcsQ0FBQyxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQzFCLE9BQU8sR0FBRyxDQUFDLElBQUksT0FBTyxHQUFHLENBQUM7QUFDNUIsVUFBTSxJQUNKLENBQUMsT0FBTyxHQUFHLENBQUMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUMzQixPQUFPLEdBQUcsQ0FBQyxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQzFCLE9BQU8sR0FBRyxDQUFDLElBQUksT0FBTyxHQUFHLENBQUMsSUFDMUIsT0FBTyxHQUFHLENBQUMsSUFBSSxPQUFPLEdBQUcsQ0FBQztBQUM1QixVQUFNLElBQ0osT0FBTyxHQUFHLENBQUMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUMxQixPQUFPLEdBQUcsQ0FBQyxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQzFCLE9BQU8sR0FBRyxDQUFDLElBQUksT0FBTyxHQUFHLENBQUMsSUFDMUIsT0FBTyxHQUFHLENBQUMsSUFBSSxPQUFPLEdBQUcsQ0FBQztBQUM1QixVQUFNLElBQ0osQ0FBQyxPQUFPLEdBQUcsQ0FBQyxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQzNCLE9BQU8sR0FBRyxDQUFDLElBQUksT0FBTyxHQUFHLENBQUMsSUFDMUIsT0FBTyxHQUFHLENBQUMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUMxQixPQUFPLEdBQUcsQ0FBQyxJQUFJLE9BQU8sR0FBRyxDQUFDO0FBQzVCLFdBQU8sS0FBSyxVQUFVLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFBQSxFQUNsQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFTQSxPQUFPLFdBQVcsUUFBcUIsUUFBcUIsS0FBeUI7QUFDbkYsVUFBTSxJQUNKLE9BQU8sR0FBRyxDQUFDLElBQUksT0FBTyxHQUFHLENBQUMsSUFDMUIsT0FBTyxHQUFHLENBQUMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUMxQixPQUFPLEdBQUcsQ0FBQyxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQzFCLE9BQU8sR0FBRyxDQUFDLElBQUksT0FBTyxHQUFHLENBQUM7QUFDNUIsVUFBTSxJQUNKLENBQUMsT0FBTyxHQUFHLENBQUMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUMzQixPQUFPLEdBQUcsQ0FBQyxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQzFCLE9BQU8sR0FBRyxDQUFDLElBQUksT0FBTyxHQUFHLENBQUMsSUFDMUIsT0FBTyxHQUFHLENBQUMsSUFBSSxPQUFPLEdBQUcsQ0FBQztBQUM1QixVQUFNLElBQ0osT0FBTyxHQUFHLENBQUMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUMxQixPQUFPLEdBQUcsQ0FBQyxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQzFCLE9BQU8sR0FBRyxDQUFDLElBQUksT0FBTyxHQUFHLENBQUMsSUFDMUIs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QUEsRUFLQSxPQUFPLGlCQUFpQixNQUFnQixJQUFjLEtBQTZDO0FBQ2pHLFdBQU8sTUFBTSxpQkFBaUIsTUFBTSxJQUFJLEdBQUc7QUFBQSxFQUM3QztBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsT0FBTyxpQkFBaUIsT0FBa0M7QUFDeEQsV0FBTyxNQUFNLGVBQWUsS0FBSztBQUFBLEVBQ25DO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxPQUFPLGVBQWUsT0FBb0M7QUFDeEQsV0FBTyxNQUFNLGVBQWUsS0FBSztBQUFBLEVBQ25DO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxPQUFPLGNBQWMsT0FBbUM7QUFDdEQsV0FBTyxNQUFNLGNBQWMsS0FBSztBQUFBLEVBQ2xDO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxPQUFPLFVBQVUsR0FBVyxHQUFXLEdBQVcsR0FBd0I7QUFDeEUsV0FBTyxNQUFNLFVBQVUsR0FBRyxHQUFHLEdBQUcsQ0FBQztBQUFBLEVBQ25DO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxPQUFPLG1CQUFtQixNQUFnQztBQUN4RCxXQUFPLE1BQU0sbUJBQW1CLElBQUk7QUFBQSxFQUN0QztBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsT0FBTyxnQkFBZ0IsS0FBNEI7QUFDakQsV0FBTyxNQUFNLGdCQUFnQixHQUFHO0FBQUEsRUFDbEM7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLE9BQU8sc0JBQXNCLEdBQWdDO0FBQzNELFdBQU8sTUFBTSxzQkFBc0IsQ0FBQztBQUFBLEVBQ3RDO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxPQUFPLGNBQWMsTUFBZ0IsS0FBMEI7QUFDN0QsV0FBTyxNQUFNLGNBQWMsTUFBTSxHQUFHO0FBQUEsRUFDdEM7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLE9BQU8sZ0JBQWdCLE1BQWdCLEtBQWEsS0FBNkM7QUFDL0YsV0FBTyxNQUFNLGdCQUFnQixNQUFNLEtBQUssR0FBRztBQUFBLEVBQzdDO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxPQUFPLG1CQUFtQixHQUF3QjtBQUNoRCxXQUFPLE1BQU0sbUJBQW1CLENBQUM7QUFBQSxFQUNuQztBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsT0FBTyxjQUFjLE1BQW1CLFVBQStCO0FBQ3JFLFdBQU8sTUFBTSxjQUFjLE1BQU0sUUFBUTtBQUFBLEVBQzNDO0FBQ0Y7QUFBQTtBQXRVYSxZQUV3QixRQUFvQzsiLAogICJuYW1lcyI6IFsiX19mcm9tTWF0cml4VG9UeXBlZEFycmF5IiwgIl9fdG1wX3VwVmVjIiwgIm51bTIiLCAicSIsICJfX3RtcF92ZWMzXzUiLCAiX190bXBfdmVjM18wIiwgIl9fdG1wX3ZlYzNfMSIsICJfX3RtcF92ZWMzXzIiLCAiX190bXBfdmVjM18zIiwgIl9fdG1wX3ZlYzNfNCJdCn0K
