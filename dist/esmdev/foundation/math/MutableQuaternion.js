// src/foundation/math/MutableQuaternion.ts
import { Logger } from "../misc/Logger.js";
import { Quaternion, Quaternion_ } from "./Quaternion.js";
var MutableQuaternion_ = class extends Quaternion_ {
  /**
   * Creates a new MutableQuaternion_ instance.
   * @param v - The typed array containing the quaternion components
   * @param _options - Configuration object containing the typed array constructor
   */
  constructor(v, _options) {
    super(v, _options);
  }
  /**
   * Sets the x component of the quaternion.
   * @param x - The x component value
   */
  set x(x) {
    this._v[0] = x;
  }
  /**
   * Gets the x component of the quaternion.
   * @returns The x component value
   */
  get x() {
    return this._v[0];
  }
  /**
   * Sets the y component of the quaternion.
   * @param y - The y component value
   */
  set y(y) {
    this._v[1] = y;
  }
  /**
   * Gets the y component of the quaternion.
   * @returns The y component value
   */
  get y() {
    return this._v[1];
  }
  /**
   * Sets the z component of the quaternion.
   * @param z - The z component value
   */
  set z(z) {
    this._v[2] = z;
  }
  /**
   * Gets the z component of the quaternion.
   * @returns The z component value
   */
  get z() {
    return this._v[2];
  }
  /**
   * Sets the w component of the quaternion.
   * @param w - The w component value
   */
  set w(w) {
    this._v[3] = w;
  }
  /**
   * Gets the w component of the quaternion.
   * @returns The w component value
   */
  get w() {
    return this._v[3];
  }
  /**
   * Gets the class name for identification purposes.
   * @returns The string 'MutableQuaternion'
   */
  get className() {
    return "MutableQuaternion";
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
  setAt(i, value) {
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
  setComponents(x, y, z, w) {
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
  copyComponents(quat) {
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
    if (norm === 0) {
      Logger.default.error("cannot normalize a zero-length quaternion. Returning an identity quaternion instead.");
      return this.identity();
    }
    return this.divideNumber(norm);
  }
  /**
   * Inverts this quaternion in place (conjugate divided by magnitude squared).
   * @returns This instance for method chaining
   */
  invert() {
    const norm = this.length();
    if (norm === 0) {
      return this;
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
  qlerp(l_quat, r_quat, ratio) {
    let qr = l_quat._v[3] * r_quat._v[3] + l_quat._v[0] * r_quat._v[0] + l_quat._v[1] * r_quat._v[1] + l_quat._v[2] * r_quat._v[2];
    const ss = 1 - qr * qr;
    if (ss === 0) {
      return this.copyComponents(l_quat);
    }
    if (qr > 1) {
      qr = 0.999;
    } else if (qr < -1) {
      qr = -0.999;
    }
    let ph = Math.acos(qr);
    let s2;
    if (qr < 0 && ph > Math.PI / 2) {
      qr = -l_quat._v[3] * r_quat._v[3] - l_quat._v[0] * r_quat._v[0] - l_quat._v[1] * r_quat._v[1] - l_quat._v[2] * r_quat._v[2];
      ph = Math.acos(qr);
      s2 = -1 * Math.sin(ph * ratio) / Math.sin(ph);
    } else {
      s2 = Math.sin(ph * ratio) / Math.sin(ph);
    }
    const s1 = Math.sin(ph * (1 - ratio)) / Math.sin(ph);
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
  lerp(l_quat, r_quat, ratio) {
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
  tryAxisAngle(vec, radian) {
    const length = vec.length();
    if (!Number.isFinite(length) || length === 0) {
      return false;
    }
    const halfAngle = 0.5 * radian;
    const sin = Math.sin(halfAngle);
    this._v[3] = Math.cos(halfAngle);
    this._v[0] = sin * vec._v[0] / length;
    this._v[1] = sin * vec._v[1] / length;
    this._v[2] = sin * vec._v[2] / length;
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
  axisAngle(vec, radian) {
    if (this.tryAxisAngle(vec, radian)) {
      return this;
    }
    Logger.default.error("the rotation axis has zero length. Returning an identity quaternion instead.");
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
  tryFromMatrix(mat) {
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
  fromMatrix(mat) {
    if (this.tryFromMatrix(mat)) {
      return this;
    }
    Logger.default.error(
      "the rotation cannot be extracted from the matrix (it is singular or contains non-finite values). Returning an identity quaternion instead."
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
  fromPosition(vec) {
    return this.setComponents(vec._v[0], vec._v[1], vec._v[2], 0);
  }
  /**
   * Adds another quaternion to this quaternion component-wise.
   * @param quat - The quaternion to add
   * @returns This instance for method chaining
   */
  add(quat) {
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
  subtract(quat) {
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
  multiply(quat) {
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
  multiplyNumber(value) {
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
  divideNumber(value) {
    if (value !== 0) {
      this._v[0] /= value;
      this._v[1] /= value;
      this._v[2] /= value;
      this._v[3] /= value;
    } else {
      Logger.default.error("0 division occurred! The result is set to zero.");
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
  clone() {
    return this.constructor.fromCopy4(this._v[0], this._v[1], this._v[2], this._v[3]);
  }
};
var MutableQuaternion = class extends MutableQuaternion_ {
  /**
   * Creates a new MutableQuaternion instance.
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
   * qlerp
   */
  static qlerp(l_quat, r_quat, ratio) {
    return super.qlerp(l_quat, r_quat, ratio);
  }
  /**
   * lerp
   */
  static lerp(l_quat, r_quat, ratio) {
    return super.lerp(l_quat, r_quat, ratio);
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
   * subtract
   */
  static subtract(l_quat, r_quat) {
    return super.subtract(l_quat, r_quat);
  }
  /**
   * multiply
   */
  static multiply(l_quat, r_quat) {
    return super.multiply(l_quat, r_quat);
  }
  /**
   * multiplyNumber
   */
  static multiplyNumber(quat, value) {
    return super.multiplyNumber(quat, value);
  }
  /**
   * divideNumber
   */
  static divideNumber(quat, value) {
    return super.divideNumber(quat, value);
  }
  /**
   * Creates a mutable quaternion that directly uses the given Float32Array (no copy).
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
};
var MutableQuaternionD = class extends MutableQuaternion_ {
  /**
   * Creates a new MutableQuaternionD instance.
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
   * qlerp
   */
  static qlerp(l_quat, r_quat, ratio) {
    return super.qlerp(l_quat, r_quat, ratio);
  }
  /**
   * lerp
   */
  static lerp(l_quat, r_quat, ratio) {
    return super.lerp(l_quat, r_quat, ratio);
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
   * subtract
   */
  static subtract(l_quat, r_quat) {
    return super.subtract(l_quat, r_quat);
  }
  /**
   * multiply
   */
  static multiply(l_quat, r_quat) {
    return super.multiply(l_quat, r_quat);
  }
  /**
   * multiplyNumber
   */
  static multiplyNumber(quat, value) {
    return super.multiplyNumber(quat, value);
  }
  /**
   * divideNumber
   */
  static divideNumber(quat, value) {
    return super.divideNumber(quat, value);
  }
  /**
   * Creates a mutable quaternion that directly uses the given Float64Array (no copy).
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
};
/** The typed array constructor used for newly created quaternions. */
MutableQuaternionD._type = Float64Array;
export {
  MutableQuaternion,
  MutableQuaternionD,
  MutableQuaternion as MutableQuaternionF,
  MutableQuaternion_
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9NdXRhYmxlUXVhdGVybmlvbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBBcnJheTQsIEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yLCBUeXBlZEFycmF5IH0gZnJvbSAnLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHR5cGUgeyBJTWF0cml4NDQgfSBmcm9tICcuL0lNYXRyaXgnO1xuaW1wb3J0IHR5cGUgeyBJTG9nUXVhdGVybmlvbiwgSU11dGFibGVRdWF0ZXJuaW9uLCBJUXVhdGVybmlvbiB9IGZyb20gJy4vSVF1YXRlcm5pb24nO1xuaW1wb3J0IHR5cGUgeyBJVmVjdG9yMywgSVZlY3RvcjQgfSBmcm9tICcuL0lWZWN0b3InO1xuaW1wb3J0IHsgUXVhdGVybmlvbiwgUXVhdGVybmlvbl8gfSBmcm9tICcuL1F1YXRlcm5pb24nO1xuXG4vKipcbiAqIEEgbXV0YWJsZSBxdWF0ZXJuaW9uIGNsYXNzIHRoYXQgZXh0ZW5kcyB0aGUgaW1tdXRhYmxlIFF1YXRlcm5pb24gY2xhc3MuXG4gKiBQcm92aWRlcyBtZXRob2RzIGZvciBxdWF0ZXJuaW9uIG9wZXJhdGlvbnMgdGhhdCBtb2RpZnkgdGhlIGluc3RhbmNlIGluIHBsYWNlLlxuICogUXVhdGVybmlvbnMgYXJlIHVzZWQgdG8gcmVwcmVzZW50IHJvdGF0aW9ucyBpbiAzRCBzcGFjZSBhbmQgYXJlIHBhcnRpY3VsYXJseVxuICogdXNlZnVsIGZvciBhdm9pZGluZyBnaW1iYWwgbG9jayBhbmQgcHJvdmlkaW5nIHNtb290aCBpbnRlcnBvbGF0aW9ucy5cbiAqL1xuZXhwb3J0IGNsYXNzIE11dGFibGVRdWF0ZXJuaW9uXzxUIGV4dGVuZHMgRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3I+XG4gIGV4dGVuZHMgUXVhdGVybmlvbl88VD5cbiAgaW1wbGVtZW50cyBJTXV0YWJsZVF1YXRlcm5pb25cbntcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgTXV0YWJsZVF1YXRlcm5pb25fIGluc3RhbmNlLlxuICAgKiBAcGFyYW0gdiAtIFRoZSB0eXBlZCBhcnJheSBjb250YWluaW5nIHRoZSBxdWF0ZXJuaW9uIGNvbXBvbmVudHNcbiAgICogQHBhcmFtIF9vcHRpb25zIC0gQ29uZmlndXJhdGlvbiBvYmplY3QgY29udGFpbmluZyB0aGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3JcbiAgICovXG4gIGNvbnN0cnVjdG9yKHY6IFR5cGVkQXJyYXksIF9vcHRpb25zPzogeyB0eXBlOiBUIH0pIHtcbiAgICBzdXBlcih2LCBfb3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgeCBjb21wb25lbnQgb2YgdGhlIHF1YXRlcm5pb24uXG4gICAqIEBwYXJhbSB4IC0gVGhlIHggY29tcG9uZW50IHZhbHVlXG4gICAqL1xuICBzZXQgeCh4OiBudW1iZXIpIHtcbiAgICB0aGlzLl92WzBdID0geDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB4IGNvbXBvbmVudCBvZiB0aGUgcXVhdGVybmlvbi5cbiAgICogQHJldHVybnMgVGhlIHggY29tcG9uZW50IHZhbHVlXG4gICAqL1xuICBnZXQgeCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92WzBdO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHkgY29tcG9uZW50IG9mIHRoZSBxdWF0ZXJuaW9uLlxuICAgKiBAcGFyYW0geSAtIFRoZSB5IGNvbXBvbmVudCB2YWx1ZVxuICAgKi9cbiAgc2V0IHkoeTogbnVtYmVyKSB7XG4gICAgdGhpcy5fdlsxXSA9IHk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgeSBjb21wb25lbnQgb2YgdGhlIHF1YXRlcm5pb24uXG4gICAqIEByZXR1cm5zIFRoZSB5IGNvbXBvbmVudCB2YWx1ZVxuICAgKi9cbiAgZ2V0IHkoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdlsxXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB6IGNvbXBvbmVudCBvZiB0aGUgcXVhdGVybmlvbi5cbiAgICogQHBhcmFtIHogLSBUaGUgeiBjb21wb25lbnQgdmFsdWVcbiAgICovXG4gIHNldCB6KHo6IG51bWJlcikge1xuICAgIHRoaXMuX3ZbMl0gPSB6O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHogY29tcG9uZW50IG9mIHRoZSBxdWF0ZXJuaW9uLlxuICAgKiBAcmV0dXJucyBUaGUgeiBjb21wb25lbnQgdmFsdWVcbiAgICovXG4gIGdldCB6KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMl07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdyBjb21wb25lbnQgb2YgdGhlIHF1YXRlcm5pb24uXG4gICAqIEBwYXJhbSB3IC0gVGhlIHcgY29tcG9uZW50IHZhbHVlXG4gICAqL1xuICBzZXQgdyh3OiBudW1iZXIpIHtcbiAgICB0aGlzLl92WzNdID0gdztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB3IGNvbXBvbmVudCBvZiB0aGUgcXVhdGVybmlvbi5cbiAgICogQHJldHVybnMgVGhlIHcgY29tcG9uZW50IHZhbHVlXG4gICAqL1xuICBnZXQgdygpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92WzNdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNsYXNzIG5hbWUgZm9yIGlkZW50aWZpY2F0aW9uIHB1cnBvc2VzLlxuICAgKiBAcmV0dXJucyBUaGUgc3RyaW5nICdNdXRhYmxlUXVhdGVybmlvbidcbiAgICovXG4gIGdldCBjbGFzc05hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJ011dGFibGVRdWF0ZXJuaW9uJztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSByYXcgRmxvYXQzMkFycmF5IGNvbnRhaW5pbmcgdGhlIHF1YXRlcm5pb24gY29tcG9uZW50cy5cbiAgICogQHJldHVybnMgVGhlIHVuZGVybHlpbmcgRmxvYXQzMkFycmF5IFt4LCB5LCB6LCB3XVxuICAgKi9cbiAgcmF3KCkge1xuICAgIHJldHVybiB0aGlzLl92O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSBjb21wb25lbnQgdmFsdWUgYXQgdGhlIHNwZWNpZmllZCBpbmRleC5cbiAgICogQHBhcmFtIGkgLSBUaGUgY29tcG9uZW50IGluZGV4ICgwPXgsIDE9eSwgMj16LCAzPXcpXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSB2YWx1ZSB0byBzZXRcbiAgICogQHJldHVybnMgVGhpcyBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICBzZXRBdChpOiBudW1iZXIsIHZhbHVlOiBudW1iZXIpOiB0aGlzIHtcbiAgICB0aGlzLl92W2ldID0gdmFsdWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhbGwgcXVhdGVybmlvbiBjb21wb25lbnRzLlxuICAgKiBAcGFyYW0geCAtIFRoZSB4IGNvbXBvbmVudFxuICAgKiBAcGFyYW0geSAtIFRoZSB5IGNvbXBvbmVudFxuICAgKiBAcGFyYW0geiAtIFRoZSB6IGNvbXBvbmVudFxuICAgKiBAcGFyYW0gdyAtIFRoZSB3IGNvbXBvbmVudFxuICAgKiBAcmV0dXJucyBUaGlzIGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIHNldENvbXBvbmVudHMoeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciwgdzogbnVtYmVyKTogdGhpcyB7XG4gICAgdGhpcy5fdlswXSA9IHg7XG4gICAgdGhpcy5fdlsxXSA9IHk7XG4gICAgdGhpcy5fdlsyXSA9IHo7XG4gICAgdGhpcy5fdlszXSA9IHc7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ29waWVzIGNvbXBvbmVudHMgZnJvbSBhbm90aGVyIHF1YXRlcm5pb24uXG4gICAqIEBwYXJhbSBxdWF0IC0gVGhlIHF1YXRlcm5pb24gdG8gY29weSBmcm9tXG4gICAqIEByZXR1cm5zIFRoaXMgaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgY29weUNvbXBvbmVudHMocXVhdDogSVF1YXRlcm5pb24pOiB0aGlzIHtcbiAgICByZXR1cm4gdGhpcy5zZXRDb21wb25lbnRzKHF1YXQuX3ZbMF0sIHF1YXQuX3ZbMV0sIHF1YXQuX3ZbMl0sIHF1YXQuX3ZbM10pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhpcyBxdWF0ZXJuaW9uIHRvIHRoZSBpZGVudGl0eSBxdWF0ZXJuaW9uICgwLCAwLCAwLCAxKS5cbiAgICogQHJldHVybnMgVGhpcyBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICBpZGVudGl0eSgpOiB0aGlzIHtcbiAgICByZXR1cm4gdGhpcy5zZXRDb21wb25lbnRzKDAsIDAsIDAsIDEpO1xuICB9XG5cbiAgLyoqXG4gICAqIE5vcm1hbGl6ZXMgdGhpcyBxdWF0ZXJuaW9uIHRvIHVuaXQgbGVuZ3RoIGluIHBsYWNlLlxuICAgKiBAcmV0dXJucyBUaGlzIGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIG5vcm1hbGl6ZSgpOiB0aGlzIHtcbiAgICBjb25zdCBub3JtID0gdGhpcy5sZW5ndGgoKTtcbiAgICBpZiAobm9ybSA9PT0gMCkge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJ2Nhbm5vdCBub3JtYWxpemUgYSB6ZXJvLWxlbmd0aCBxdWF0ZXJuaW9uLiBSZXR1cm5pbmcgYW4gaWRlbnRpdHkgcXVhdGVybmlvbiBpbnN0ZWFkLicpO1xuICAgICAgcmV0dXJuIHRoaXMuaWRlbnRpdHkoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZGl2aWRlTnVtYmVyKG5vcm0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEludmVydHMgdGhpcyBxdWF0ZXJuaW9uIGluIHBsYWNlIChjb25qdWdhdGUgZGl2aWRlZCBieSBtYWduaXR1ZGUgc3F1YXJlZCkuXG4gICAqIEByZXR1cm5zIFRoaXMgaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgaW52ZXJ0KCk6IHRoaXMge1xuICAgIGNvbnN0IG5vcm0gPSB0aGlzLmxlbmd0aCgpO1xuICAgIGlmIChub3JtID09PSAwLjApIHtcbiAgICAgIHJldHVybiB0aGlzOyAvLyBbMCwgMCwgMCwgMF1cbiAgICB9XG5cbiAgICB0aGlzLl92WzBdID0gLXRoaXMuX3ZbMF0gLyBub3JtO1xuICAgIHRoaXMuX3ZbMV0gPSAtdGhpcy5fdlsxXSAvIG5vcm07XG4gICAgdGhpcy5fdlsyXSA9IC10aGlzLl92WzJdIC8gbm9ybTtcbiAgICB0aGlzLl92WzNdID0gdGhpcy5fdlszXSAvIG5vcm07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgc3BoZXJpY2FsIGxpbmVhciBpbnRlcnBvbGF0aW9uIChTTEVSUCkgYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIHRoaXMgcXVhdGVybmlvbi5cbiAgICogQHBhcmFtIGxfcXVhdCAtIFRoZSBzdGFydGluZyBxdWF0ZXJuaW9uXG4gICAqIEBwYXJhbSByX3F1YXQgLSBUaGUgZW5kaW5nIHF1YXRlcm5pb25cbiAgICogQHBhcmFtIHJhdGlvIC0gSW50ZXJwb2xhdGlvbiBmYWN0b3IgKDAuMCB0byAxLjApXG4gICAqIEByZXR1cm5zIFRoaXMgaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgcWxlcnAobF9xdWF0OiBJUXVhdGVybmlvbiwgcl9xdWF0OiBJUXVhdGVybmlvbiwgcmF0aW86IG51bWJlcik6IHRoaXMge1xuICAgIGxldCBxciA9XG4gICAgICBsX3F1YXQuX3ZbM10gKiByX3F1YXQuX3ZbM10gK1xuICAgICAgbF9xdWF0Ll92WzBdICogcl9xdWF0Ll92WzBdICtcbiAgICAgIGxfcXVhdC5fdlsxXSAqIHJfcXVhdC5fdlsxXSArXG4gICAgICBsX3F1YXQuX3ZbMl0gKiByX3F1YXQuX3ZbMl07XG4gICAgY29uc3Qgc3MgPSAxLjAgLSBxciAqIHFyO1xuXG4gICAgaWYgKHNzID09PSAwLjApIHtcbiAgICAgIHJldHVybiB0aGlzLmNvcHlDb21wb25lbnRzKGxfcXVhdCk7XG4gICAgfVxuICAgIGlmIChxciA+IDEpIHtcbiAgICAgIHFyID0gMC45OTk7XG4gICAgfSBlbHNlIGlmIChxciA8IC0xKSB7XG4gICAgICBxciA9IC0wLjk5OTtcbiAgICB9XG5cbiAgICBsZXQgcGggPSBNYXRoLmFjb3MocXIpO1xuICAgIGxldCBzMjogbnVtYmVyO1xuICAgIGlmIChxciA8IDAuMCAmJiBwaCA+IE1hdGguUEkgLyAyLjApIHtcbiAgICAgIHFyID1cbiAgICAgICAgLWxfcXVhdC5fdlszXSAqIHJfcXVhdC5fdlszXSAtXG4gICAgICAgIGxfcXVhdC5fdlswXSAqIHJfcXVhdC5fdlswXSAtXG4gICAgICAgIGxfcXVhdC5fdlsxXSAqIHJfcXVhdC5fdlsxXSAtXG4gICAgICAgIGxfcXVhdC5fdlsyXSAqIHJfcXVhdC5fdlsyXTtcbiAgICAgIHBoID0gTWF0aC5hY29zKHFyKTtcbiAgICAgIHMyID0gKC0xICogTWF0aC5zaW4ocGggKiByYXRpbykpIC8gTWF0aC5zaW4ocGgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzMiA9IE1hdGguc2luKHBoICogcmF0aW8pIC8gTWF0aC5zaW4ocGgpO1xuICAgIH1cbiAgICBjb25zdCBzMSA9IE1hdGguc2luKHBoICogKDEuMCAtIHJhdGlvKSkgLyBNYXRoLnNpbihwaCk7XG5cbiAgICB0aGlzLl92WzBdID0gbF9xdWF0Ll92WzBdICogczEgKyByX3F1YXQuX3ZbMF0gKiBzMjtcbiAgICB0aGlzLl92WzFdID0gbF9xdWF0Ll92WzFdICogczEgKyByX3F1YXQuX3ZbMV0gKiBzMjtcbiAgICB0aGlzLl92WzJdID0gbF9xdWF0Ll92WzJdICogczEgKyByX3F1YXQuX3ZbMl0gKiBzMjtcbiAgICB0aGlzLl92WzNdID0gbF9xdWF0Ll92WzNdICogczEgKyByX3F1YXQuX3ZbM10gKiBzMjtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIGxpbmVhciBpbnRlcnBvbGF0aW9uIGFuZCBzdG9yZXMgdGhlIHJlc3VsdCBpbiB0aGlzIHF1YXRlcm5pb24uXG4gICAqIEBwYXJhbSBsX3F1YXQgLSBUaGUgc3RhcnRpbmcgcXVhdGVybmlvblxuICAgKiBAcGFyYW0gcl9xdWF0IC0gVGhlIGVuZGluZyBxdWF0ZXJuaW9uXG4gICAqIEBwYXJhbSByYXRpbyAtIEludGVycG9sYXRpb24gZmFjdG9yICgwLjAgdG8gMS4wKVxuICAgKiBAcmV0dXJucyBUaGlzIGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIGxlcnAobF9xdWF0OiBJUXVhdGVybmlvbiwgcl9xdWF0OiBJUXVhdGVybmlvbiwgcmF0aW86IG51bWJlcik6IHRoaXMge1xuICAgIHRoaXMuX3ZbMF0gPSBsX3F1YXQuX3ZbMF0gKiAoMSAtIHJhdGlvKSArIHJfcXVhdC5fdlswXSAqIHJhdGlvO1xuICAgIHRoaXMuX3ZbMV0gPSBsX3F1YXQuX3ZbMV0gKiAoMSAtIHJhdGlvKSArIHJfcXVhdC5fdlsxXSAqIHJhdGlvO1xuICAgIHRoaXMuX3ZbMl0gPSBsX3F1YXQuX3ZbMl0gKiAoMSAtIHJhdGlvKSArIHJfcXVhdC5fdlsyXSAqIHJhdGlvO1xuICAgIHRoaXMuX3ZbM10gPSBsX3F1YXQuX3ZbM10gKiAoMSAtIHJhdGlvKSArIHJfcXVhdC5fdlszXSAqIHJhdGlvO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQXR0ZW1wdHMgdG8gc2V0IHRoaXMgcXVhdGVybmlvbiBmcm9tIGFuIGF4aXMgYW5kIGFuZ2xlLlxuICAgKlxuICAgKiBUaGUgcXVhdGVybmlvbiBpcyBsZWZ0IHVuY2hhbmdlZCB3aGVuIHRoZSBheGlzIGlzIGRlZ2VuZXJhdGVcbiAgICogKHplcm8gbGVuZ3RoIG9yIG5vbi1maW5pdGUpLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHJvdGF0aW9uIGF4aXMgKHdpbGwgYmUgbm9ybWFsaXplZClcbiAgICogQHBhcmFtIHJhZGlhbiAtIFRoZSByb3RhdGlvbiBhbmdsZSBpbiByYWRpYW5zXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIHF1YXRlcm5pb24gY291bGQgYmUgc2V0LCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHRyeUF4aXNBbmdsZSh2ZWM6IElWZWN0b3IzLCByYWRpYW46IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGxlbmd0aCA9IHZlYy5sZW5ndGgoKTtcbiAgICBpZiAoIU51bWJlci5pc0Zpbml0ZShsZW5ndGgpIHx8IGxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IGhhbGZBbmdsZSA9IDAuNSAqIHJhZGlhbjtcbiAgICBjb25zdCBzaW4gPSBNYXRoLnNpbihoYWxmQW5nbGUpO1xuXG4gICAgdGhpcy5fdlszXSA9IE1hdGguY29zKGhhbGZBbmdsZSk7XG4gICAgdGhpcy5fdlswXSA9IChzaW4gKiB2ZWMuX3ZbMF0pIC8gbGVuZ3RoO1xuICAgIHRoaXMuX3ZbMV0gPSAoc2luICogdmVjLl92WzFdKSAvIGxlbmd0aDtcbiAgICB0aGlzLl92WzJdID0gKHNpbiAqIHZlYy5fdlsyXSkgLyBsZW5ndGg7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoaXMgcXVhdGVybmlvbiBmcm9tIGFuIGF4aXMgYW5kIGFuZ2xlLlxuICAgKlxuICAgKiBJZiB0aGUgYXhpcyBpcyBkZWdlbmVyYXRlICh6ZXJvIGxlbmd0aCksIHRoaXMgcXVhdGVybmlvbiBpcyBzZXQgdG8gdGhlXG4gICAqIGlkZW50aXR5IHF1YXRlcm5pb24gaW5zdGVhZCBvZiBiZWluZyBmaWxsZWQgd2l0aCBgSW5maW5pdHlgL2BOYU5gLlxuICAgKiBVc2Uge0BsaW5rIE11dGFibGVRdWF0ZXJuaW9uLnRyeUF4aXNBbmdsZX0gd2hlbiB0aGUgY2FsbGVyIG5lZWRzIHRvIGRldGVjdCB0aGUgZmFpbHVyZS5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSByb3RhdGlvbiBheGlzICh3aWxsIGJlIG5vcm1hbGl6ZWQpXG4gICAqIEBwYXJhbSByYWRpYW4gLSBUaGUgcm90YXRpb24gYW5nbGUgaW4gcmFkaWFuc1xuICAgKiBAcmV0dXJucyBUaGlzIGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIGF4aXNBbmdsZSh2ZWM6IElWZWN0b3IzLCByYWRpYW46IG51bWJlcik6IHRoaXMge1xuICAgIGlmICh0aGlzLnRyeUF4aXNBbmdsZSh2ZWMsIHJhZGlhbikpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCd0aGUgcm90YXRpb24gYXhpcyBoYXMgemVybyBsZW5ndGguIFJldHVybmluZyBhbiBpZGVudGl0eSBxdWF0ZXJuaW9uIGluc3RlYWQuJyk7XG4gICAgcmV0dXJuIHRoaXMuaWRlbnRpdHkoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRlbXB0cyB0byBzZXQgdGhpcyBxdWF0ZXJuaW9uIGZyb20gYSA0eDQgdHJhbnNmb3JtYXRpb24gbWF0cml4LlxuICAgKiBFeHRyYWN0cyB0aGUgcm90YXRpb24gY29tcG9uZW50IGZyb20gdGhlIG1hdHJpeCwgaWdub3Jpbmcgc2NhbGUgYW5kIHRyYW5zbGF0aW9uLlxuICAgKlxuICAgKiBUaGUgcXVhdGVybmlvbiBpcyBsZWZ0IHVuY2hhbmdlZCB3aGVuIHRoZSByb3RhdGlvbiBjYW5ub3QgYmUgZXh0cmFjdGVkLlxuICAgKlxuICAgKiBAcGFyYW0gbWF0IC0gVGhlIDR4NCB0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgcm90YXRpb24gY291bGQgYmUgZXh0cmFjdGVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHRyeUZyb21NYXRyaXgobWF0OiBJTWF0cml4NDQpOiBib29sZWFuIHtcbiAgICByZXR1cm4gUXVhdGVybmlvbi50cnlGcm9tTWF0cml4VG8obWF0LCB0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoaXMgcXVhdGVybmlvbiBmcm9tIGEgNHg0IHRyYW5zZm9ybWF0aW9uIG1hdHJpeC5cbiAgICogRXh0cmFjdHMgdGhlIHJvdGF0aW9uIGNvbXBvbmVudCBmcm9tIHRoZSBtYXRyaXgsIGlnbm9yaW5nIHNjYWxlIGFuZCB0cmFuc2xhdGlvbi5cbiAgICpcbiAgICogSWYgdGhlIHJvdGF0aW9uIGNhbm5vdCBiZSBleHRyYWN0ZWQsIHRoaXMgcXVhdGVybmlvbiBpcyBzZXQgdG8gdGhlIGlkZW50aXR5XG4gICAqIHF1YXRlcm5pb24gaW5zdGVhZCBvZiBiZWluZyBmaWxsZWQgd2l0aCBgSW5maW5pdHlgL2BOYU5gLlxuICAgKiBVc2Uge0BsaW5rIE11dGFibGVRdWF0ZXJuaW9uLnRyeUZyb21NYXRyaXh9IHdoZW4gdGhlIGNhbGxlciBuZWVkcyB0byBkZXRlY3QgdGhlIGZhaWx1cmUuXG4gICAqXG4gICAqIEBwYXJhbSBtYXQgLSBUaGUgNHg0IHRyYW5zZm9ybWF0aW9uIG1hdHJpeFxuICAgKiBAcmV0dXJucyBUaGlzIGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIGZyb21NYXRyaXgobWF0OiBJTWF0cml4NDQpOiB0aGlzIHtcbiAgICBpZiAodGhpcy50cnlGcm9tTWF0cml4KG1hdCkpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKFxuICAgICAgJ3RoZSByb3RhdGlvbiBjYW5ub3QgYmUgZXh0cmFjdGVkIGZyb20gdGhlIG1hdHJpeCAoaXQgaXMgc2luZ3VsYXIgb3IgY29udGFpbnMgbm9uLWZpbml0ZSB2YWx1ZXMpLiBSZXR1cm5pbmcgYW4gaWRlbnRpdHkgcXVhdGVybmlvbiBpbnN0ZWFkLidcbiAgICApO1xuICAgIHRoaXMuX3ZbMF0gPSAwO1xuICAgIHRoaXMuX3ZbMV0gPSAwO1xuICAgIHRoaXMuX3ZbMl0gPSAwO1xuICAgIHRoaXMuX3ZbM10gPSAxO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhpcyBxdWF0ZXJuaW9uIGZyb20gYSBwb3NpdGlvbiB2ZWN0b3IgKHcgY29tcG9uZW50IHNldCB0byAwKS5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSBwb3NpdGlvbiB2ZWN0b3JcbiAgICogQHJldHVybnMgVGhpcyBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICBmcm9tUG9zaXRpb24odmVjOiBJVmVjdG9yMyk6IHRoaXMge1xuICAgIHJldHVybiB0aGlzLnNldENvbXBvbmVudHModmVjLl92WzBdLCB2ZWMuX3ZbMV0sIHZlYy5fdlsyXSwgMCk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhbm90aGVyIHF1YXRlcm5pb24gdG8gdGhpcyBxdWF0ZXJuaW9uIGNvbXBvbmVudC13aXNlLlxuICAgKiBAcGFyYW0gcXVhdCAtIFRoZSBxdWF0ZXJuaW9uIHRvIGFkZFxuICAgKiBAcmV0dXJucyBUaGlzIGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIGFkZChxdWF0OiBJUXVhdGVybmlvbik6IHRoaXMge1xuICAgIHRoaXMuX3ZbMF0gKz0gcXVhdC5fdlswXTtcbiAgICB0aGlzLl92WzFdICs9IHF1YXQuX3ZbMV07XG4gICAgdGhpcy5fdlsyXSArPSBxdWF0Ll92WzJdO1xuICAgIHRoaXMuX3ZbM10gKz0gcXVhdC5fdlszXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJ0cmFjdHMgYW5vdGhlciBxdWF0ZXJuaW9uIGZyb20gdGhpcyBxdWF0ZXJuaW9uIGNvbXBvbmVudC13aXNlLlxuICAgKiBAcGFyYW0gcXVhdCAtIFRoZSBxdWF0ZXJuaW9uIHRvIHN1YnRyYWN0XG4gICAqIEByZXR1cm5zIFRoaXMgaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKi9cbiAgc3VidHJhY3QocXVhdDogSVF1YXRlcm5pb24pOiB0aGlzIHtcbiAgICB0aGlzLl92WzBdIC09IHF1YXQuX3ZbMF07XG4gICAgdGhpcy5fdlsxXSAtPSBxdWF0Ll92WzFdO1xuICAgIHRoaXMuX3ZbMl0gLT0gcXVhdC5fdlsyXTtcbiAgICB0aGlzLl92WzNdIC09IHF1YXQuX3ZbM107XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogTXVsdGlwbGllcyB0aGlzIHF1YXRlcm5pb24gYnkgYW5vdGhlciBxdWF0ZXJuaW9uIChxdWF0ZXJuaW9uIGNvbXBvc2l0aW9uKS5cbiAgICogVGhlIHJlc3VsdCByZXByZXNlbnRzIHRoZSBjb21iaW5lZCByb3RhdGlvbi5cbiAgICogQHBhcmFtIHF1YXQgLSBUaGUgcXVhdGVybmlvbiB0byBtdWx0aXBseSBieVxuICAgKiBAcmV0dXJucyBUaGlzIGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIG11bHRpcGx5KHF1YXQ6IElRdWF0ZXJuaW9uKTogdGhpcyB7XG4gICAgY29uc3QgeCA9IHF1YXQuX3ZbM10gKiB0aGlzLl92WzBdICsgcXVhdC5fdlsyXSAqIHRoaXMuX3ZbMV0gKyBxdWF0Ll92WzFdICogdGhpcy5fdlsyXSAtIHF1YXQuX3ZbMF0gKiB0aGlzLl92WzNdO1xuICAgIGNvbnN0IHkgPSAtcXVhdC5fdlsyXSAqIHRoaXMuX3ZbMF0gKyBxdWF0Ll92WzNdICogdGhpcy5fdlsxXSArIHF1YXQuX3ZbMF0gKiB0aGlzLl92WzJdIC0gcXVhdC5fdlsxXSAqIHRoaXMuX3ZbM107XG4gICAgY29uc3QgeiA9IHF1YXQuX3ZbMV0gKiB0aGlzLl92WzBdICsgcXVhdC5fdlswXSAqIHRoaXMuX3ZbMV0gKyBxdWF0Ll92WzNdICogdGhpcy5fdlsyXSAtIHF1YXQuX3ZbMl0gKiB0aGlzLl92WzNdO1xuICAgIGNvbnN0IHcgPSAtcXVhdC5fdlswXSAqIHRoaXMuX3ZbMF0gLSBxdWF0Ll92WzFdICogdGhpcy5fdlsxXSAtIHF1YXQuX3ZbMl0gKiB0aGlzLl92WzJdIC0gcXVhdC5fdlszXSAqIHRoaXMuX3ZbM107XG4gICAgcmV0dXJuIHRoaXMuc2V0Q29tcG9uZW50cyh4LCB5LCB6LCB3KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIHRoaXMgcXVhdGVybmlvbiBieSBhIHNjYWxhciB2YWx1ZS5cbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIHNjYWxhciB2YWx1ZSB0byBtdWx0aXBseSBieVxuICAgKiBAcmV0dXJucyBUaGlzIGluc3RhbmNlIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIG11bHRpcGx5TnVtYmVyKHZhbHVlOiBudW1iZXIpOiB0aGlzIHtcbiAgICB0aGlzLl92WzBdICo9IHZhbHVlO1xuICAgIHRoaXMuX3ZbMV0gKj0gdmFsdWU7XG4gICAgdGhpcy5fdlsyXSAqPSB2YWx1ZTtcbiAgICB0aGlzLl92WzNdICo9IHZhbHVlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIERpdmlkZXMgdGhpcyBxdWF0ZXJuaW9uIGJ5IGEgc2NhbGFyIHZhbHVlLlxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIGRpdmlkZSBieSAobXVzdCBub3QgYmUgemVybylcbiAgICogQHJldHVybnMgVGhpcyBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICBkaXZpZGVOdW1iZXIodmFsdWU6IG51bWJlcik6IHRoaXMge1xuICAgIGlmICh2YWx1ZSAhPT0gMCkge1xuICAgICAgdGhpcy5fdlswXSAvPSB2YWx1ZTtcbiAgICAgIHRoaXMuX3ZbMV0gLz0gdmFsdWU7XG4gICAgICB0aGlzLl92WzJdIC89IHZhbHVlO1xuICAgICAgdGhpcy5fdlszXSAvPSB2YWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJzAgZGl2aXNpb24gb2NjdXJyZWQhIFRoZSByZXN1bHQgaXMgc2V0IHRvIHplcm8uJyk7XG4gICAgICB0aGlzLl92WzBdID0gMDtcbiAgICAgIHRoaXMuX3ZbMV0gPSAwO1xuICAgICAgdGhpcy5fdlsyXSA9IDA7XG4gICAgICB0aGlzLl92WzNdID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGNvcHkgb2YgdGhpcyBxdWF0ZXJuaW9uLlxuICAgKiBAcmV0dXJucyBBIG5ldyBJTXV0YWJsZVF1YXRlcm5pb24gd2l0aCB0aGUgc2FtZSBjb21wb25lbnQgdmFsdWVzXG4gICAqL1xuICBjbG9uZSgpOiB0aGlzIHtcbiAgICByZXR1cm4gKHRoaXMuY29uc3RydWN0b3IgYXMgYW55KS5mcm9tQ29weTQodGhpcy5fdlswXSwgdGhpcy5fdlsxXSwgdGhpcy5fdlsyXSwgdGhpcy5fdlszXSk7XG4gIH1cbn1cblxuLyoqXG4gKiBNdXRhYmxlIHF1YXRlcm5pb24gd2l0aCAzMi1iaXQgZmxvYXQgY29tcG9uZW50cy5cbiAqL1xuZXhwb3J0IGNsYXNzIE11dGFibGVRdWF0ZXJuaW9uIGV4dGVuZHMgTXV0YWJsZVF1YXRlcm5pb25fPEZsb2F0MzJBcnJheUNvbnN0cnVjdG9yPiB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IE11dGFibGVRdWF0ZXJuaW9uIGluc3RhbmNlLlxuICAgKiBAcGFyYW0gdiAtIFRoZSB0eXBlZCBhcnJheSBjb250YWluaW5nIHRoZSBxdWF0ZXJuaW9uIGNvbXBvbmVudHNcbiAgICovXG4gIGNvbnN0cnVjdG9yKHY6IFR5cGVkQXJyYXkpIHtcbiAgICBzdXBlcih2LCB7IHR5cGU6IEZsb2F0MzJBcnJheSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBpZGVudGl0eVxuICAgKi9cbiAgc3RhdGljIGlkZW50aXR5KCk6IE11dGFibGVRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gc3VwZXIuaWRlbnRpdHkoKSBhcyBNdXRhYmxlUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBkdW1teVxuICAgKi9cbiAgc3RhdGljIGR1bW15KCk6IE11dGFibGVRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gc3VwZXIuZHVtbXkoKSBhcyBNdXRhYmxlUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBpbnZlcnRcbiAgICovXG4gIHN0YXRpYyBpbnZlcnQocXVhdDogSVF1YXRlcm5pb24pOiBNdXRhYmxlUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIHN1cGVyLmludmVydChxdWF0KSBhcyBNdXRhYmxlUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBxbGVycFxuICAgKi9cbiAgc3RhdGljIHFsZXJwKGxfcXVhdDogSVF1YXRlcm5pb24sIHJfcXVhdDogSVF1YXRlcm5pb24sIHJhdGlvOiBudW1iZXIpOiBNdXRhYmxlUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIHN1cGVyLnFsZXJwKGxfcXVhdCwgcl9xdWF0LCByYXRpbykgYXMgTXV0YWJsZVF1YXRlcm5pb247XG4gIH1cblxuICAvKipcbiAgICogbGVycFxuICAgKi9cbiAgc3RhdGljIGxlcnAobF9xdWF0OiBJUXVhdGVybmlvbiwgcl9xdWF0OiBJUXVhdGVybmlvbiwgcmF0aW86IG51bWJlcik6IE11dGFibGVRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gc3VwZXIubGVycChsX3F1YXQsIHJfcXVhdCwgcmF0aW8pIGFzIE11dGFibGVRdWF0ZXJuaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIHRyeUF4aXNBbmdsZVxuICAgKi9cbiAgc3RhdGljIHRyeUF4aXNBbmdsZSh2ZWM6IElWZWN0b3IzLCByYWRpYW46IG51bWJlcik6IE11dGFibGVRdWF0ZXJuaW9uIHwgbnVsbCB7XG4gICAgcmV0dXJuIHN1cGVyLnRyeUF4aXNBbmdsZSh2ZWMsIHJhZGlhbikgYXMgTXV0YWJsZVF1YXRlcm5pb24gfCBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIGF4aXNBbmdsZVxuICAgKi9cbiAgc3RhdGljIGF4aXNBbmdsZSh2ZWM6IElWZWN0b3IzLCByYWRpYW46IG51bWJlcik6IE11dGFibGVRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gc3VwZXIuYXhpc0FuZ2xlKHZlYywgcmFkaWFuKSBhcyBNdXRhYmxlUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiB0cnlGcm9tTWF0cml4XG4gICAqL1xuICBzdGF0aWMgdHJ5RnJvbU1hdHJpeChtYXQ6IElNYXRyaXg0NCk6IE11dGFibGVRdWF0ZXJuaW9uIHwgbnVsbCB7XG4gICAgcmV0dXJuIHN1cGVyLnRyeUZyb21NYXRyaXgobWF0KSBhcyBNdXRhYmxlUXVhdGVybmlvbiB8IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogZnJvbU1hdHJpeFxuICAgKi9cbiAgc3RhdGljIGZyb21NYXRyaXgobWF0OiBJTWF0cml4NDQpOiBNdXRhYmxlUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIHN1cGVyLmZyb21NYXRyaXgobWF0KSBhcyBNdXRhYmxlUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBmcm9tUG9zaXRpb25cbiAgICovXG4gIHN0YXRpYyBmcm9tUG9zaXRpb24odmVjOiBJVmVjdG9yMyk6IE11dGFibGVRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gc3VwZXIuZnJvbVBvc2l0aW9uKHZlYykgYXMgTXV0YWJsZVF1YXRlcm5pb247XG4gIH1cblxuICAvKipcbiAgICogYWRkXG4gICAqL1xuICBzdGF0aWMgYWRkKGxfcXVhdDogSVF1YXRlcm5pb24sIHJfcXVhdDogSVF1YXRlcm5pb24pOiBNdXRhYmxlUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIHN1cGVyLmFkZChsX3F1YXQsIHJfcXVhdCkgYXMgTXV0YWJsZVF1YXRlcm5pb247XG4gIH1cblxuICAvKipcbiAgICogc3VidHJhY3RcbiAgICovXG4gIHN0YXRpYyBzdWJ0cmFjdChsX3F1YXQ6IElRdWF0ZXJuaW9uLCByX3F1YXQ6IElRdWF0ZXJuaW9uKTogTXV0YWJsZVF1YXRlcm5pb24ge1xuICAgIHJldHVybiBzdXBlci5zdWJ0cmFjdChsX3F1YXQsIHJfcXVhdCkgYXMgTXV0YWJsZVF1YXRlcm5pb247XG4gIH1cblxuICAvKipcbiAgICogbXVsdGlwbHlcbiAgICovXG4gIHN0YXRpYyBtdWx0aXBseShsX3F1YXQ6IElRdWF0ZXJuaW9uLCByX3F1YXQ6IElRdWF0ZXJuaW9uKTogTXV0YWJsZVF1YXRlcm5pb24ge1xuICAgIHJldHVybiBzdXBlci5tdWx0aXBseShsX3F1YXQsIHJfcXVhdCkgYXMgTXV0YWJsZVF1YXRlcm5pb247XG4gIH1cblxuICAvKipcbiAgICogbXVsdGlwbHlOdW1iZXJcbiAgICovXG4gIHN0YXRpYyBtdWx0aXBseU51bWJlcihxdWF0OiBJUXVhdGVybmlvbiwgdmFsdWU6IG51bWJlcik6IE11dGFibGVRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gc3VwZXIubXVsdGlwbHlOdW1iZXIocXVhdCwgdmFsdWUpIGFzIE11dGFibGVRdWF0ZXJuaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIGRpdmlkZU51bWJlclxuICAgKi9cbiAgc3RhdGljIGRpdmlkZU51bWJlcihxdWF0OiBJUXVhdGVybmlvbiwgdmFsdWU6IG51bWJlcik6IE11dGFibGVRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gc3VwZXIuZGl2aWRlTnVtYmVyKHF1YXQsIHZhbHVlKSBhcyBNdXRhYmxlUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbXV0YWJsZSBxdWF0ZXJuaW9uIHRoYXQgZGlyZWN0bHkgdXNlcyB0aGUgZ2l2ZW4gRmxvYXQzMkFycmF5IChubyBjb3B5KS5cbiAgICovXG4gIHN0YXRpYyBmcm9tRmxvYXQzMkFycmF5KGFycmF5OiBGbG9hdDMyQXJyYXkpOiBNdXRhYmxlUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIHN1cGVyLmZyb21UeXBlZEFycmF5KGFycmF5KSBhcyBNdXRhYmxlUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBmcm9tQ29weUFycmF5NFxuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5QXJyYXk0KGFycmF5OiBBcnJheTQ8bnVtYmVyPik6IE11dGFibGVRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gc3VwZXIuZnJvbUNvcHlBcnJheTQoYXJyYXkpIGFzIE11dGFibGVRdWF0ZXJuaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIGZyb21Db3B5QXJyYXlcbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weUFycmF5KGFycmF5OiBBcnJheTxudW1iZXI+KTogTXV0YWJsZVF1YXRlcm5pb24ge1xuICAgIHJldHVybiBzdXBlci5mcm9tQ29weUFycmF5KGFycmF5KSBhcyBNdXRhYmxlUXVhdGVybmlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBmcm9tQ29weTRcbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weTQoeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciwgdzogbnVtYmVyKTogTXV0YWJsZVF1YXRlcm5pb24ge1xuICAgIHJldHVybiBzdXBlci5mcm9tQ29weTQoeCwgeSwgeiwgdykgYXMgTXV0YWJsZVF1YXRlcm5pb247XG4gIH1cblxuICAvKipcbiAgICogZnJvbUNvcHlRdWF0ZXJuaW9uXG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHlRdWF0ZXJuaW9uKHF1YXQ6IElRdWF0ZXJuaW9uKTogTXV0YWJsZVF1YXRlcm5pb24ge1xuICAgIHJldHVybiBzdXBlci5mcm9tQ29weVF1YXRlcm5pb24ocXVhdCkgYXMgTXV0YWJsZVF1YXRlcm5pb247XG4gIH1cblxuICAvKipcbiAgICogZnJvbUNvcHlWZWN0b3I0XG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHlWZWN0b3I0KHZlYzogSVZlY3RvcjQpOiBNdXRhYmxlUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIHN1cGVyLmZyb21Db3B5VmVjdG9yNCh2ZWMpIGFzIE11dGFibGVRdWF0ZXJuaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIGZyb21Db3B5TG9nUXVhdGVybmlvblxuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5TG9nUXVhdGVybmlvbih4OiBJTG9nUXVhdGVybmlvbik6IE11dGFibGVRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gc3VwZXIuZnJvbUNvcHlMb2dRdWF0ZXJuaW9uKHgpIGFzIE11dGFibGVRdWF0ZXJuaW9uO1xuICB9XG59XG5cbi8qKlxuICogTXV0YWJsZSBxdWF0ZXJuaW9uIHdpdGggNjQtYml0IGZsb2F0IGNvbXBvbmVudHMuXG4gKi9cbmV4cG9ydCBjbGFzcyBNdXRhYmxlUXVhdGVybmlvbkQgZXh0ZW5kcyBNdXRhYmxlUXVhdGVybmlvbl88RmxvYXQ2NEFycmF5Q29uc3RydWN0b3I+IHtcbiAgLyoqIFRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvciB1c2VkIGZvciBuZXdseSBjcmVhdGVkIHF1YXRlcm5pb25zLiAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIG92ZXJyaWRlIHJlYWRvbmx5IF90eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3RvciA9IEZsb2F0NjRBcnJheTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNdXRhYmxlUXVhdGVybmlvbkQgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSB2IC0gVGhlIHR5cGVkIGFycmF5IGNvbnRhaW5pbmcgdGhlIHF1YXRlcm5pb24gY29tcG9uZW50c1xuICAgKi9cbiAgY29uc3RydWN0b3IodjogVHlwZWRBcnJheSkge1xuICAgIHN1cGVyKHYsIHsgdHlwZTogRmxvYXQ2NEFycmF5IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIGlkZW50aXR5XG4gICAqL1xuICBzdGF0aWMgaWRlbnRpdHkoKTogTXV0YWJsZVF1YXRlcm5pb25EIHtcbiAgICByZXR1cm4gc3VwZXIuaWRlbnRpdHkoKSBhcyBNdXRhYmxlUXVhdGVybmlvbkQ7XG4gIH1cblxuICAvKipcbiAgICogZHVtbXlcbiAgICovXG4gIHN0YXRpYyBkdW1teSgpOiBNdXRhYmxlUXVhdGVybmlvbkQge1xuICAgIHJldHVybiBzdXBlci5kdW1teSgpIGFzIE11dGFibGVRdWF0ZXJuaW9uRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBpbnZlcnRcbiAgICovXG4gIHN0YXRpYyBpbnZlcnQocXVhdDogSVF1YXRlcm5pb24pOiBNdXRhYmxlUXVhdGVybmlvbkQge1xuICAgIHJldHVybiBzdXBlci5pbnZlcnQocXVhdCkgYXMgTXV0YWJsZVF1YXRlcm5pb25EO1xuICB9XG5cbiAgLyoqXG4gICAqIHFsZXJwXG4gICAqL1xuICBzdGF0aWMgcWxlcnAobF9xdWF0OiBJUXVhdGVybmlvbiwgcl9xdWF0OiBJUXVhdGVybmlvbiwgcmF0aW86IG51bWJlcik6IE11dGFibGVRdWF0ZXJuaW9uRCB7XG4gICAgcmV0dXJuIHN1cGVyLnFsZXJwKGxfcXVhdCwgcl9xdWF0LCByYXRpbykgYXMgTXV0YWJsZVF1YXRlcm5pb25EO1xuICB9XG5cbiAgLyoqXG4gICAqIGxlcnBcbiAgICovXG4gIHN0YXRpYyBsZXJwKGxfcXVhdDogSVF1YXRlcm5pb24sIHJfcXVhdDogSVF1YXRlcm5pb24sIHJhdGlvOiBudW1iZXIpOiBNdXRhYmxlUXVhdGVybmlvbkQge1xuICAgIHJldHVybiBzdXBlci5sZXJwKGxfcXVhdCwgcl9xdWF0LCByYXRpbykgYXMgTXV0YWJsZVF1YXRlcm5pb25EO1xuICB9XG5cbiAgLyoqXG4gICAqIHRyeUF4aXNBbmdsZVxuICAgKi9cbiAgc3RhdGljIHRyeUF4aXNBbmdsZSh2ZWM6IElWZWN0b3IzLCByYWRpYW46IG51bWJlcik6IE11dGFibGVRdWF0ZXJuaW9uRCB8IG51bGwge1xuICAgIHJldHVybiBzdXBlci50cnlBeGlzQW5nbGUodmVjLCByYWRpYW4pIGFzIE11dGFibGVRdWF0ZXJuaW9uRCB8IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogYXhpc0FuZ2xlXG4gICAqL1xuICBzdGF0aWMgYXhpc0FuZ2xlKHZlYzogSVZlY3RvcjMsIHJhZGlhbjogbnVtYmVyKTogTXV0YWJsZVF1YXRlcm5pb25EIHtcbiAgICByZXR1cm4gc3VwZXIuYXhpc0FuZ2xlKHZlYywgcmFkaWFuKSBhcyBNdXRhYmxlUXVhdGVybmlvbkQ7XG4gIH1cblxuICAvKipcbiAgICogdHJ5RnJvbU1hdHJpeFxuICAgKi9cbiAgc3RhdGljIHRyeUZyb21NYXRyaXgobWF0OiBJTWF0cml4NDQpOiBNdXRhYmxlUXVhdGVybmlvbkQgfCBudWxsIHtcbiAgICByZXR1cm4gc3VwZXIudHJ5RnJvbU1hdHJpeChtYXQpIGFzIE11dGFibGVRdWF0ZXJuaW9uRCB8IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogZnJvbU1hdHJpeFxuICAgKi9cbiAgc3RhdGljIGZyb21NYXRyaXgobWF0OiBJTWF0cml4NDQpOiBNdXRhYmxlUXVhdGVybmlvbkQge1xuICAgIHJldHVybiBzdXBlci5mcm9tTWF0cml4KG1hdCkgYXMgTXV0YWJsZVF1YXRlcm5pb25EO1xuICB9XG5cbiAgLyoqXG4gICAqIGZyb21Qb3NpdGlvblxuICAgKi9cbiAgc3RhdGljIGZyb21Qb3NpdGlvbih2ZWM6IElWZWN0b3IzKTogTXV0YWJsZVF1YXRlcm5pb25EIHtcbiAgICByZXR1cm4gc3VwZXIuZnJvbVBvc2l0aW9uKHZlYykgYXMgTXV0YWJsZVF1YXRlcm5pb25EO1xuICB9XG5cbiAgLyoqXG4gICAqIGFkZFxuICAgKi9cbiAgc3RhdGljIGFkZChsX3F1YXQ6IElRdWF0ZXJuaW9uLCByX3F1YXQ6IElRdWF0ZXJuaW9uKTogTXV0YWJsZVF1YXRlcm5pb25EIHtcbiAgICByZXR1cm4gc3VwZXIuYWRkKGxfcXVhdCwgcl9xdWF0KSBhcyBNdXRhYmxlUXVhdGVybmlvbkQ7XG4gIH1cblxuICAvKipcbiAgICogc3VidHJhY3RcbiAgICovXG4gIHN0YXRpYyBzdWJ0cmFjdChsX3F1YXQ6IElRdWF0ZXJuaW9uLCByX3F1YXQ6IElRdWF0ZXJuaW9uKTogTXV0YWJsZVF1YXRlcm5pb25EIHtcbiAgICByZXR1cm4gc3VwZXIuc3VidHJhY3QobF9xdWF0LCByX3F1YXQpIGFzIE11dGFibGVRdWF0ZXJuaW9uRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBtdWx0aXBseVxuICAgKi9cbiAgc3RhdGljIG11bHRpcGx5KGxfcXVhdDogSVF1YXRlcm5pb24sIHJfcXVhdDogSVF1YXRlcm5pb24pOiBNdXRhYmxlUXVhdGVybmlvbkQge1xuICAgIHJldHVybiBzdXBlci5tdWx0aXBseShsX3F1YXQsIHJfcXVhdCkgYXMgTXV0YWJsZVF1YXRlcm5pb25EO1xuICB9XG5cbiAgLyoqXG4gICAqIG11bHRpcGx5TnVtYmVyXG4gICAqL1xuICBzdGF0aWMgbXVsdGlwbHlOdW1iZXIocXVhdDogSVF1YXRlcm5pb24sIHZhbHVlOiBudW1iZXIpOiBNdXRhYmxlUXVhdGVybmlvbkQge1xuICAgIHJldHVybiBzdXBlci5tdWx0aXBseU51bWJlcihxdWF0LCB2YWx1ZSkgYXMgTXV0YWJsZVF1YXRlcm5pb25EO1xuICB9XG5cbiAgLyoqXG4gICAqIGRpdmlkZU51bWJlclxuICAgKi9cbiAgc3RhdGljIGRpdmlkZU51bWJlcihxdWF0OiBJUXVhdGVybmlvbiwgdmFsdWU6IG51bWJlcik6IE11dGFibGVRdWF0ZXJuaW9uRCB7XG4gICAgcmV0dXJuIHN1cGVyLmRpdmlkZU51bWJlcihxdWF0LCB2YWx1ZSkgYXMgTXV0YWJsZVF1YXRlcm5pb25EO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBtdXRhYmxlIHF1YXRlcm5pb24gdGhhdCBkaXJlY3RseSB1c2VzIHRoZSBnaXZlbiBGbG9hdDY0QXJyYXkgKG5vIGNvcHkpLlxuICAgKi9cbiAgc3RhdGljIGZyb21GbG9hdDY0QXJyYXkoYXJyYXk6IEZsb2F0NjRBcnJheSk6IE11dGFibGVRdWF0ZXJuaW9uRCB7XG4gICAgcmV0dXJuIHN1cGVyLmZyb21UeXBlZEFycmF5KGFycmF5KSBhcyBNdXRhYmxlUXVhdGVybmlvbkQ7XG4gIH1cblxuICAvKipcbiAgICogZnJvbUNvcHlBcnJheTRcbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weUFycmF5NChhcnJheTogQXJyYXk0PG51bWJlcj4pOiBNdXRhYmxlUXVhdGVybmlvbkQge1xuICAgIHJldHVybiBzdXBlci5mcm9tQ29weUFycmF5NChhcnJheSkgYXMgTXV0YWJsZVF1YXRlcm5pb25EO1xuICB9XG5cbiAgLyoqXG4gICAqIGZyb21Db3B5QXJyYXlcbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weUFycmF5KGFycmF5OiBBcnJheTxudW1iZXI+KTogTXV0YWJsZVF1YXRlcm5pb25EIHtcbiAgICByZXR1cm4gc3VwZXIuZnJvbUNvcHlBcnJheShhcnJheSkgYXMgTXV0YWJsZVF1YXRlcm5pb25EO1xuICB9XG5cbiAgLyoqXG4gICAqIGZyb21Db3B5NFxuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5NCh4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyLCB3OiBudW1iZXIpOiBNdXRhYmxlUXVhdGVybmlvbkQge1xuICAgIHJldHVybiBzdXBlci5mcm9tQ29weTQoeCwgeSwgeiwgdykgYXMgTXV0YWJsZVF1YXRlcm5pb25EO1xuICB9XG5cbiAgLyoqXG4gICAqIGZyb21Db3B5UXVhdGVybmlvblxuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5UXVhdGVybmlvbihxdWF0OiBJUXVhdGVybmlvbik6IE11dGFibGVRdWF0ZXJuaW9uRCB7XG4gICAgcmV0dXJuIHN1cGVyLmZyb21Db3B5UXVhdGVybmlvbihxdWF0KSBhcyBNdXRhYmxlUXVhdGVybmlvbkQ7XG4gIH1cblxuICAvKipcbiAgICogZnJvbUNvcHlWZWN0b3I0XG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHlWZWN0b3I0KHZlYzogSVZlY3RvcjQpOiBNdXRhYmxlUXVhdGVybmlvbkQge1xuICAgIHJldHVybiBzdXBlci5mcm9tQ29weVZlY3RvcjQodmVjKSBhcyBNdXRhYmxlUXVhdGVybmlvbkQ7XG4gIH1cblxuICAvKipcbiAgICogZnJvbUNvcHlMb2dRdWF0ZXJuaW9uXG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHlMb2dRdWF0ZXJuaW9uKHg6IElMb2dRdWF0ZXJuaW9uKTogTXV0YWJsZVF1YXRlcm5pb25EIHtcbiAgICByZXR1cm4gc3VwZXIuZnJvbUNvcHlMb2dRdWF0ZXJuaW9uKHgpIGFzIE11dGFibGVRdWF0ZXJuaW9uRDtcbiAgfVxufVxuXG4vKipcbiAqIEFsaWFzIGZvciB0aGUgMzItYml0IChGbG9hdDMyQXJyYXkpIGltcGxlbWVudGF0aW9uLCBtYWtpbmcgdGhlIHByZWNpc2lvbiBleHBsaWNpdC5cbiAqL1xuZXhwb3J0IHsgTXV0YWJsZVF1YXRlcm5pb24gYXMgTXV0YWJsZVF1YXRlcm5pb25GIH07XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxjQUFjO0FBSXZCLFNBQVMsWUFBWSxtQkFBbUI7QUFRakMsSUFBTSxxQkFBTixjQUNHLFlBRVY7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNRSxZQUFZLEdBQWUsVUFBd0I7QUFDakQsVUFBTSxHQUFHLFFBQVE7QUFBQSxFQUNuQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLEVBQUUsR0FBVztBQUNmLFNBQUssR0FBRyxDQUFDLElBQUk7QUFBQSxFQUNmO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUksSUFBWTtBQUNkLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLEVBQUUsR0FBVztBQUNmLFNBQUssR0FBRyxDQUFDLElBQUk7QUFBQSxFQUNmO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUksSUFBWTtBQUNkLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLEVBQUUsR0FBVztBQUNmLFNBQUssR0FBRyxDQUFDLElBQUk7QUFBQSxFQUNmO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUksSUFBWTtBQUNkLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLEVBQUUsR0FBVztBQUNmLFNBQUssR0FBRyxDQUFDLElBQUk7QUFBQSxFQUNmO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUksSUFBWTtBQUNkLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNs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
