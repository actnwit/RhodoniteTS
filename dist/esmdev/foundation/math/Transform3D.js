// src/foundation/math/Transform3D.ts
import { Matrix44 } from "./Matrix44.js";
import { MutableMatrix44 } from "./MutableMatrix44.js";
import { MutableQuaternion } from "./MutableQuaternion.js";
import { MutableVector3 } from "./MutableVector3.js";
import { Quaternion } from "./Quaternion.js";
import { Vector3 } from "./Vector3.js";
var _Transform3D = class _Transform3D {
  constructor(x) {
    this.ia = 0;
    /** The local matrix composed from the current position, rotation and scale. */
    this.Kt = MutableMatrix44.identity();
    this.Lt = false;
    /** The position, rotation and scale the cached matrix was composed from (to detect direct inner mutations). */
    this.Mt = new Float64Array(3);
    this.Nt = new Float64Array(4);
    this.Ot = new Float64Array(3);
    this.Gt = MutableVector3.dummy();
    this.It = MutableVector3.dummy();
    this.Ht = MutableQuaternion.dummy();
    if (x !== void 0) {
      this.setTransform(x.positionInner, x.scaleInner, MutableQuaternion.fromCopyQuaternion(x.rotationInner));
    } else {
      this.Gt = MutableVector3.zero();
      this.It = MutableVector3.one();
      this.Ht = MutableQuaternion.identity();
    }
  }
  /**
   * Checks if this transform is equal to another transform within a given tolerance.
   * @param rhs - The transform to compare against
   * @param delta - The tolerance for comparison (default: Number.EPSILON)
   * @returns True if the transforms are equal within the specified tolerance
   */
  isEqual(rhs, delta = Number.EPSILON) {
    return this.positionInner.isEqual(rhs.positionInner, delta) && this.rotationInner.isEqual(rhs.rotationInner, delta) && this.scaleInner.isEqual(rhs.scaleInner, delta);
  }
  /**
   * Creates a deep copy of this transform.
   * @returns A new Transform3D instance with the same values
   */
  clone() {
    const clone = new _Transform3D(this);
    return clone;
  }
  /**
   * Sets the position of the transform.
   * @param vec - The new position vector
   */
  set position(vec) {
    this.Gt.copyComponents(vec);
    this.Jt("position");
  }
  /**
   * Sets the position using an array of three numbers.
   * @param array - Array containing [x, y, z] position values
   */
  setPositionAsArray3(array) {
    this.Gt._v[0] = array[0];
    this.Gt._v[1] = array[1];
    this.Gt._v[2] = array[2];
    this.Jt("position");
  }
  /**
   * Gets a copy of the local position vector.
   * @returns A cloned MutableVector3 representing the position
   */
  get position() {
    return this.positionInner.clone();
  }
  /**
   * Gets the internal position vector (direct reference).
   * @returns The internal MutableVector3 position object
   */
  get positionInner() {
    return this.Gt;
  }
  /**
   * Sets the rotation using Euler angles (XYZ order).
   * @param vec - Vector containing rotation angles in radians [x, y, z]
   */
  set eulerAngles(vec) {
    const sx = Math.sin(vec._v[0] * 0.5);
    const cx = Math.cos(vec._v[0] * 0.5);
    const sy = Math.sin(vec._v[1] * 0.5);
    const cy = Math.cos(vec._v[1] * 0.5);
    const sz = Math.sin(vec._v[2] * 0.5);
    const cz = Math.cos(vec._v[2] * 0.5);
    this.rotation = MutableQuaternion.fromCopy4(
      sx * cy * cz - cx * sy * sz,
      cx * sy * cz + sx * cy * sz,
      cx * cy * sz - sx * sy * cz,
      cx * cy * cz + sx * sy * sz
    );
  }
  /**
   * Gets a copy of the rotation as Euler angles (XYZ order).
   * @returns A cloned Vector3 containing rotation angles in radians [x, y, z]
   */
  get eulerAngles() {
    return this.eulerAnglesInner.clone();
  }
  /**
   * Gets the rotation as Euler angles (XYZ order) - direct reference.
   * @returns A Vector3 containing rotation angles in radians [x, y, z]
   */
  get eulerAnglesInner() {
    return this.Ht.toEulerAngles();
  }
  /**
   * Sets the scale of the transform.
   * @param vec - The new scale vector
   */
  set scale(vec) {
    this.It.copyComponents(vec);
    this.Jt();
  }
  /**
   * Sets the scale using an array of three numbers.
   * @param array - Array containing [x, y, z] scale values
   */
  setScaleAsArray3(array) {
    this.It._v[0] = array[0];
    this.It._v[1] = array[1];
    this.It._v[2] = array[2];
    this.Jt();
  }
  /**
   * Gets a copy of the local scale vector.
   * @returns A cloned MutableVector3 representing the scale
   */
  get scale() {
    return this.scaleInner.clone();
  }
  /**
   * Gets the internal scale vector (direct reference).
   * @returns The internal MutableVector3 scale object
   */
  get scaleInner() {
    return this.It;
  }
  /**
   * Sets the rotation using a quaternion.
   * @param quat - The new rotation quaternion
   */
  set rotation(quat) {
    this.Ht.copyComponents(quat);
    this.Jt();
  }
  /**
   * Sets the rotation using an array of four numbers representing a quaternion.
   * @param array - Array containing [x, y, z, w] quaternion values
   */
  setRotationAsArray4(array) {
    this.Ht._v[0] = array[0];
    this.Ht._v[1] = array[1];
    this.Ht._v[2] = array[2];
    this.Ht._v[3] = array[3];
    this.Jt();
  }
  /**
   * Gets a copy of the local rotation quaternion.
   * @returns A cloned Quaternion representing the rotation
   */
  get rotation() {
    return this.rotationInner.clone();
  }
  /**
   * Gets the internal rotation quaternion (direct reference).
   * @returns The internal Quaternion rotation object
   */
  get rotationInner() {
    return this.Ht;
  }
  /**
   * Internal method to increment the update counter when transform changes.
   *
   * A position-only change updates the translation column of the cached matrix instead of invalidating it.
   * Animations that move nodes (the common case with many lights) then avoid the quaternion-to-matrix
   * composition every frame. A rotation or scale change invalidates the matrix.
   *
   * @param change - What changed: `'position'` or everything (`'all'`).
   * @private
   */
  Jt(change = "all") {
    this.ia++;
    if (change === "position" && this.Lt) {
      const v = this.Kt._v;
      v[12] = this.Gt._v[0];
      v[13] = this.Gt._v[1];
      v[14] = this.Gt._v[2];
      this.Mt.set(this.Gt._v);
    } else {
      this.Lt = false;
    }
  }
  /**
   * Sets the transform from a 4x4 transformation matrix.
   * Decomposes the matrix into position, rotation, and scale components.
   * @param mat - The transformation matrix to decompose
   */
  set matrix(mat) {
    this.Ht.fromMatrix(mat);
    mat.getTranslateTo(this.Gt);
    mat.getScaleTo(this.It);
    this.Jt();
  }
  /**
   * Gets a copy of the local transformation matrix.
   * @returns A new Matrix44 representing the composed transformation
   */
  get matrix() {
    return this.matrixInner;
  }
  /**
   * Gets the local transformation matrix composed from position, rotation, and scale.
   * The matrix is computed as: Translation * Rotation * Scale
   * @returns A MutableMatrix44 representing the composed transformation
   */
  get matrixInner() {
    this.Pt();
    return this.Kt.clone();
  }
  /**
   * Composes the local matrix from the current position, rotation and scale and stores it in the cache.
   */
  Qt() {
    const scale = this.scaleInner;
    const n00 = scale._v[0];
    const n11 = scale._v[1];
    const n22 = scale._v[2];
    const q = this.rotationInner;
    const sx = q._v[0] * q._v[0];
    const sy = q._v[1] * q._v[1];
    const sz = q._v[2] * q._v[2];
    const cx = q._v[1] * q._v[2];
    const cy = q._v[0] * q._v[2];
    const cz = q._v[0] * q._v[1];
    const wx = q._v[3] * q._v[0];
    const wy = q._v[3] * q._v[1];
    const wz = q._v[3] * q._v[2];
    const m00 = 1 - 2 * (sy + sz);
    const m01 = 2 * (cz - wz);
    const m02 = 2 * (cy + wy);
    const m10 = 2 * (cz + wz);
    const m11 = 1 - 2 * (sx + sz);
    const m12 = 2 * (cx - wx);
    const m20 = 2 * (cy - wy);
    const m21 = 2 * (cx + wx);
    const m22 = 1 - 2 * (sx + sy);
    const translate = this.positionInner;
    this.Kt.setComponents(
      m00 * n00,
      m01 * n11,
      m02 * n22,
      translate.x,
      m10 * n00,
      m11 * n11,
      m12 * n22,
      translate.y,
      m20 * n00,
      m21 * n11,
      m22 * n22,
      translate.z,
      0,
      0,
      0,
      1
    );
    this.Mt.set(this.Gt._v);
    this.Nt.set(this.Ht._v);
    this.Ot.set(this.It._v);
  }
  /**
   * Brings the cached matrix up to date. Direct mutations of the inner vectors (positionInner and the like)
   * bypass the setters, so they are detected here: a position-only change updates the translation column, and
   * a rotation or scale change recomposes the matrix.
   */
  Pt() {
    if (!this.Lt) {
      this.Qt();
      this.Lt = true;
      return;
    }
    const p = this.Gt._v;
    const q = this.Ht._v;
    const s = this.It._v;
    const mp = this.Mt;
    const mq = this.Nt;
    const ms = this.Ot;
    let rotationScaleChanged = false;
    for (let i = 0; i < 4; i++) {
      if (q[i] !== mq[i]) {
        rotationScaleChanged = true;
        break;
      }
    }
    if (!rotationScaleChanged) {
      for (let i = 0; i < 3; i++) {
        if (s[i] !== ms[i]) {
          rotationScaleChanged = true;
          break;
        }
      }
    }
    if (rotationScaleChanged) {
      this.Qt();
      return;
    }
    if (p[0] !== mp[0] || p[1] !== mp[1] || p[2] !== mp[2]) {
      const v = this.Kt._v;
      v[12] = p[0];
      v[13] = p[1];
      v[14] = p[2];
      mp[0] = p[0];
      mp[1] = p[1];
      mp[2] = p[2];
    }
  }
  /**
   * Efficiently computes the transformation matrix and stores it in the provided matrix.
   * The composed matrix is cached, so repeated reads (including animated translations) do not
   * recompose the rotation and scale.
   * @param mat - The target matrix to store the result in
   */
  getMatrixInnerTo(mat) {
    this.Pt();
    mat.copyComponents(this.Kt);
  }
  /**
   * Gets the number of times this transform has been updated.
   * This can be useful for optimization and caching purposes.
   * @returns The update count as a number
   */
  get updateCount() {
    return this.ia;
  }
  /**
   * Sets the rotation using a 4x4 rotation matrix.
   * @param rotateMatrix - The rotation matrix to extract rotation from
   */
  set rotateMatrix44(rotateMatrix) {
    this.rotation = _Transform3D._m.fromMatrix(rotateMatrix);
  }
  /**
   * Gets the rotation as a 4x4 rotation matrix.
   * @returns A Matrix44 representing only the rotation component
   */
  get rotateMatrix44() {
    return Matrix44.fromCopyQuaternion(this.rotation);
  }
  /**
   * Sets transform properties from a JSON object.
   * Supports setting position, scale, rotation (as quaternion), and matrix properties.
   * @param arg - JSON object or JSON string containing transform properties
   */
  setPropertiesFromJson(arg) {
    let json = arg;
    if (typeof arg === "string") {
      json = JSON.parse(arg);
    }
    for (const key in json) {
      if (Object.hasOwn(json, key) && key in this) {
        if (key === "quaternion") {
          this.rotation = Quaternion.fromCopyArray4(json[key]);
        } else if (key === "matrix") {
          this[key] = Matrix44.fromCopyArray16RowMajor(json[key]);
        } else {
          this[key] = Vector3.fromCopyArray(json[key]);
        }
      }
    }
  }
  /**
   * Sets the rotation to align with specified up and front vectors.
   * Creates a coordinate system where the Y-axis aligns with the up vector
   * and the Z-axis aligns with the front vector.
   * @param UpVec - The desired up direction (Y-axis)
   * @param FrontVec - The desired front direction (Z-axis)
   */
  setRotationFromNewUpAndFront(UpVec, FrontVec) {
    const yDir = UpVec;
    const xDir = MutableVector3.crossTo(yDir, FrontVec, _Transform3D.Dc);
    const zDir = MutableVector3.crossTo(xDir, yDir, _Transform3D.Ac);
    const rotateMatrix = _Transform3D.yc.setComponents(
      xDir.x,
      yDir.x,
      zDir.x,
      0,
      xDir.y,
      yDir.y,
      zDir.y,
      0,
      xDir.z,
      yDir.z,
      zDir.z,
      0,
      0,
      0,
      0,
      1
    );
    this.rotateMatrix44 = rotateMatrix;
  }
  /**
   * Rotates the transform to face from one direction to another.
   * Calculates the rotation needed to align the 'from' direction with the 'to' direction.
   * @param fromVec - The current forward direction
   * @param toVec - The target direction to face towards
   */
  headToDirection(fromVec, toVec) {
    const fromDir = _Transform3D.Dc.copyComponents(fromVec).normalize();
    const toDir = _Transform3D.Ac.copyComponents(toVec).normalize();
    const rotationDir = MutableVector3.crossTo(fromDir, toDir, _Transform3D.Bc);
    const cosTheta = Vector3.dot(fromDir, toDir);
    const theta = Math.acos(cosTheta);
    this.rotation = _Transform3D._m.axisAngle(rotationDir, theta);
  }
  /**
   * Sets multiple transform components at once for optimal performance.
   * This method reduces the cost of automatically updating transform matrices
   * by setting all components in a single operation. Useful for animation and
   * batch updates where performance is critical.
   *
   * Note: The provided transform components must be mutually consistent.
   * For example, if a matrix is provided, its decomposed translate, rotate, and scale
   * components should match the individual component arguments.
   *
   * @param translate - The position component
   * @param scale - The scale component
   * @param rotation - The rotation component as a quaternion
   */
  setTransform(translate, scale, rotation) {
    this.Gt = translate.clone();
    this.Ht = rotation.clone();
    this.It = scale.clone();
    this.Jt();
  }
};
_Transform3D.yc = MutableMatrix44.zero();
_Transform3D.Dc = MutableVector3.zero();
_Transform3D.Ac = MutableVector3.zero();
_Transform3D.Bc = MutableVector3.zero();
_Transform3D._m = MutableQuaternion.identity();
var Transform3D = _Transform3D;
export {
  Transform3D
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9UcmFuc2Zvcm0zRC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBBcnJheTMsIEFycmF5NCwgQXJyYXkxNiB9IGZyb20gJy4uLy4uL3R5cGVzJztcbmltcG9ydCB0eXBlIHsgSU1hdHJpeDQ0IH0gZnJvbSAnLi9JTWF0cml4JztcbmltcG9ydCB0eXBlIHsgSVF1YXRlcm5pb24gfSBmcm9tICcuL0lRdWF0ZXJuaW9uJztcbmltcG9ydCB0eXBlIHsgSVZlY3RvcjMgfSBmcm9tICcuL0lWZWN0b3InO1xuaW1wb3J0IHsgTWF0cml4NDQgfSBmcm9tICcuL01hdHJpeDQ0JztcbmltcG9ydCB7IE11dGFibGVNYXRyaXg0NCB9IGZyb20gJy4vTXV0YWJsZU1hdHJpeDQ0JztcbmltcG9ydCB7IE11dGFibGVRdWF0ZXJuaW9uIH0gZnJvbSAnLi9NdXRhYmxlUXVhdGVybmlvbic7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yMyB9IGZyb20gJy4vTXV0YWJsZVZlY3RvcjMnO1xuaW1wb3J0IHsgUXVhdGVybmlvbiB9IGZyb20gJy4vUXVhdGVybmlvbic7XG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAnLi9WZWN0b3IzJztcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgM0QgdHJhbnNmb3JtYXRpb24gY29udGFpbmluZyBwb3NpdGlvbiwgcm90YXRpb24sIGFuZCBzY2FsZSBjb21wb25lbnRzLlxuICogVGhpcyBjbGFzcyBwcm92aWRlcyBhIGNvbnZlbmllbnQgd2F5IHRvIGhhbmRsZSAzRCBvYmplY3QgdHJhbnNmb3JtYXRpb25zIHdpdGhcbiAqIGF1dG9tYXRpYyBtYXRyaXggY29tcG9zaXRpb24gYW5kIGRlY29tcG9zaXRpb24gY2FwYWJpbGl0aWVzLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjb25zdCB0cmFuc2Zvcm0gPSBuZXcgVHJhbnNmb3JtM0QoKTtcbiAqIHRyYW5zZm9ybS5wb3NpdGlvbiA9IFZlY3RvcjMuZnJvbUNvcHlBcnJheShbMSwgMiwgM10pO1xuICogdHJhbnNmb3JtLnNjYWxlID0gVmVjdG9yMy5mcm9tQ29weUFycmF5KFsyLCAyLCAyXSk7XG4gKiB0cmFuc2Zvcm0ucm90YXRpb24gPSBRdWF0ZXJuaW9uLmZyb21FdWxlckFuZ2xlcygwLCBNYXRoLlBJIC8gNCwgMCk7XG4gKiBjb25zdCBtYXRyaXggPSB0cmFuc2Zvcm0ubWF0cml4O1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBUcmFuc2Zvcm0zRCB7XG4gIHByaXZhdGUgX19wb3NpdGlvbjogTXV0YWJsZVZlY3RvcjM7XG4gIHByaXZhdGUgX19zY2FsZTogTXV0YWJsZVZlY3RvcjM7XG4gIHByaXZhdGUgX19yb3RhdGlvbjogTXV0YWJsZVF1YXRlcm5pb247XG5cbiAgcHJpdmF0ZSBfX3VwZGF0ZUNvdW50ID0gMDtcbiAgLyoqIFRoZSBsb2NhbCBtYXRyaXggY29tcG9zZWQgZnJvbSB0aGUgY3VycmVudCBwb3NpdGlvbiwgcm90YXRpb24gYW5kIHNjYWxlLiAqL1xuICBwcml2YXRlIF9fbWF0cml4ID0gTXV0YWJsZU1hdHJpeDQ0LmlkZW50aXR5KCk7XG4gIHByaXZhdGUgX19pc01hdHJpeFVwVG9EYXRlID0gZmFsc2U7XG4gIC8qKiBUaGUgcG9zaXRpb24sIHJvdGF0aW9uIGFuZCBzY2FsZSB0aGUgY2FjaGVkIG1hdHJpeCB3YXMgY29tcG9zZWQgZnJvbSAodG8gZGV0ZWN0IGRpcmVjdCBpbm5lciBtdXRhdGlvbnMpLiAqL1xuICBwcml2YXRlIF9fbWF0cml4UG9zaXRpb24gPSBuZXcgRmxvYXQ2NEFycmF5KDMpO1xuICBwcml2YXRlIF9fbWF0cml4Um90YXRpb24gPSBuZXcgRmxvYXQ2NEFycmF5KDQpO1xuICBwcml2YXRlIF9fbWF0cml4U2NhbGUgPSBuZXcgRmxvYXQ2NEFycmF5KDMpO1xuXG4gIHByaXZhdGUgc3RhdGljIF9fdG1wTWF0cml4NDRfMDogTXV0YWJsZU1hdHJpeDQ0ID0gTXV0YWJsZU1hdHJpeDQ0Lnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBWZWN0b3IzXzA6IE11dGFibGVWZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcFZlY3RvcjNfMTogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wVmVjdG9yM18yOiBNdXRhYmxlVmVjdG9yMyA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBRdWF0ZXJuaW9uXzA6IE11dGFibGVRdWF0ZXJuaW9uID0gTXV0YWJsZVF1YXRlcm5pb24uaWRlbnRpdHkoKTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBUcmFuc2Zvcm0zRCBpbnN0YW5jZS5cbiAgICogQHBhcmFtIHRyYW5zZm9ybSAtIE9wdGlvbmFsIFRyYW5zZm9ybTNEIGluc3RhbmNlIHRvIGNvcHkgZnJvbVxuICAgKi9cbiAgY29uc3RydWN0b3IoKTtcbiAgY29uc3RydWN0b3IoVHJhbnNmb3JtM0Q6IFRyYW5zZm9ybTNEKTtcbiAgY29uc3RydWN0b3IoeD86IFRyYW5zZm9ybTNEKSB7XG4gICAgdGhpcy5fX3Bvc2l0aW9uID0gTXV0YWJsZVZlY3RvcjMuZHVtbXkoKTtcbiAgICB0aGlzLl9fc2NhbGUgPSBNdXRhYmxlVmVjdG9yMy5kdW1teSgpO1xuICAgIHRoaXMuX19yb3RhdGlvbiA9IE11dGFibGVRdWF0ZXJuaW9uLmR1bW15KCk7XG5cbiAgICBpZiAoeCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnNldFRyYW5zZm9ybSh4LnBvc2l0aW9uSW5uZXIsIHguc2NhbGVJbm5lciwgTXV0YWJsZVF1YXRlcm5pb24uZnJvbUNvcHlRdWF0ZXJuaW9uKHgucm90YXRpb25Jbm5lcikpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9fcG9zaXRpb24gPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gICAgICB0aGlzLl9fc2NhbGUgPSBNdXRhYmxlVmVjdG9yMy5vbmUoKTtcbiAgICAgIHRoaXMuX19yb3RhdGlvbiA9IE11dGFibGVRdWF0ZXJuaW9uLmlkZW50aXR5KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGlzIHRyYW5zZm9ybSBpcyBlcXVhbCB0byBhbm90aGVyIHRyYW5zZm9ybSB3aXRoaW4gYSBnaXZlbiB0b2xlcmFuY2UuXG4gICAqIEBwYXJhbSByaHMgLSBUaGUgdHJhbnNmb3JtIHRvIGNvbXBhcmUgYWdhaW5zdFxuICAgKiBAcGFyYW0gZGVsdGEgLSBUaGUgdG9sZXJhbmNlIGZvciBjb21wYXJpc29uIChkZWZhdWx0OiBOdW1iZXIuRVBTSUxPTilcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgdHJhbnNmb3JtcyBhcmUgZXF1YWwgd2l0aGluIHRoZSBzcGVjaWZpZWQgdG9sZXJhbmNlXG4gICAqL1xuICBpc0VxdWFsKHJoczogVHJhbnNmb3JtM0QsIGRlbHRhID0gTnVtYmVyLkVQU0lMT04pOiBib29sZWFuIHtcbiAgICByZXR1cm4gKFxuICAgICAgdGhpcy5wb3NpdGlvbklubmVyLmlzRXF1YWwocmhzLnBvc2l0aW9uSW5uZXIsIGRlbHRhKSAmJlxuICAgICAgdGhpcy5yb3RhdGlvbklubmVyLmlzRXF1YWwocmhzLnJvdGF0aW9uSW5uZXIsIGRlbHRhKSAmJlxuICAgICAgdGhpcy5zY2FsZUlubmVyLmlzRXF1YWwocmhzLnNjYWxlSW5uZXIsIGRlbHRhKVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGRlZXAgY29weSBvZiB0aGlzIHRyYW5zZm9ybS5cbiAgICogQHJldHVybnMgQSBuZXcgVHJhbnNmb3JtM0QgaW5zdGFuY2Ugd2l0aCB0aGUgc2FtZSB2YWx1ZXNcbiAgICovXG4gIGNsb25lKCkge1xuICAgIGNvbnN0IGNsb25lID0gbmV3IFRyYW5zZm9ybTNEKHRoaXMpO1xuICAgIHJldHVybiBjbG9uZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBwb3NpdGlvbiBvZiB0aGUgdHJhbnNmb3JtLlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIG5ldyBwb3NpdGlvbiB2ZWN0b3JcbiAgICovXG4gIHNldCBwb3NpdGlvbih2ZWM6IElWZWN0b3IzKSB7XG4gICAgdGhpcy5fX3Bvc2l0aW9uLmNvcHlDb21wb25lbnRzKHZlYyk7XG4gICAgdGhpcy5fX3VwZGF0ZVRyYW5zZm9ybSgncG9zaXRpb24nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBwb3NpdGlvbiB1c2luZyBhbiBhcnJheSBvZiB0aHJlZSBudW1iZXJzLlxuICAgKiBAcGFyYW0gYXJyYXkgLSBBcnJheSBjb250YWluaW5nIFt4LCB5LCB6XSBwb3NpdGlvbiB2YWx1ZXNcbiAgICovXG4gIHNldFBvc2l0aW9uQXNBcnJheTMoYXJyYXk6IEFycmF5MzxudW1iZXI+KSB7XG4gICAgdGhpcy5fX3Bvc2l0aW9uLl92WzBdID0gYXJyYXlbMF07XG4gICAgdGhpcy5fX3Bvc2l0aW9uLl92WzFdID0gYXJyYXlbMV07XG4gICAgdGhpcy5fX3Bvc2l0aW9uLl92WzJdID0gYXJyYXlbMl07XG4gICAgdGhpcy5fX3VwZGF0ZVRyYW5zZm9ybSgncG9zaXRpb24nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgY29weSBvZiB0aGUgbG9jYWwgcG9zaXRpb24gdmVjdG9yLlxuICAgKiBAcmV0dXJucyBBIGNsb25lZCBNdXRhYmxlVmVjdG9yMyByZXByZXNlbnRpbmcgdGhlIHBvc2l0aW9uXG4gICAqL1xuICBnZXQgcG9zaXRpb24oKTogTXV0YWJsZVZlY3RvcjMge1xuICAgIHJldHVybiB0aGlzLnBvc2l0aW9uSW5uZXIuY2xvbmUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpbnRlcm5hbCBwb3NpdGlvbiB2ZWN0b3IgKGRpcmVjdCByZWZlcmVuY2UpLlxuICAgKiBAcmV0dXJucyBUaGUgaW50ZXJuYWwgTXV0YWJsZVZlY3RvcjMgcG9zaXRpb24gb2JqZWN0XG4gICAqL1xuICBnZXQgcG9zaXRpb25Jbm5lcigpOiBNdXRhYmxlVmVjdG9yMyB7XG4gICAgcmV0dXJuIHRoaXMuX19wb3NpdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSByb3RhdGlvbiB1c2luZyBFdWxlciBhbmdsZXMgKFhZWiBvcmRlcikuXG4gICAqIEBwYXJhbSB2ZWMgLSBWZWN0b3IgY29udGFpbmluZyByb3RhdGlvbiBhbmdsZXMgaW4gcmFkaWFucyBbeCwgeSwgel1cbiAgICovXG4gIHNldCBldWxlckFuZ2xlcyh2ZWM6IElWZWN0b3IzKSB7XG4gICAgY29uc3Qgc3ggPSBNYXRoLnNpbih2ZWMuX3ZbMF0gKiAwLjUpO1xuICAgIGNvbnN0IGN4ID0gTWF0aC5jb3ModmVjLl92WzBdICogMC41KTtcbiAgICBjb25zdCBzeSA9IE1hdGguc2luKHZlYy5fdlsxXSAqIDAuNSk7XG4gICAgY29uc3QgY3kgPSBNYXRoLmNvcyh2ZWMuX3ZbMV0gKiAwLjUpO1xuICAgIGNvbnN0IHN6ID0gTWF0aC5zaW4odmVjLl92WzJdICogMC41KTtcbiAgICBjb25zdCBjeiA9IE1hdGguY29zKHZlYy5fdlsyXSAqIDAuNSk7XG5cbiAgICB0aGlzLnJvdGF0aW9uID0gTXV0YWJsZVF1YXRlcm5pb24uZnJvbUNvcHk0KFxuICAgICAgc3ggKiBjeSAqIGN6IC0gY3ggKiBzeSAqIHN6LFxuICAgICAgY3ggKiBzeSAqIGN6ICsgc3ggKiBjeSAqIHN6LFxuICAgICAgY3ggKiBjeSAqIHN6IC0gc3ggKiBzeSAqIGN6LFxuICAgICAgY3ggKiBjeSAqIGN6ICsgc3ggKiBzeSAqIHN6XG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgY29weSBvZiB0aGUgcm90YXRpb24gYXMgRXVsZXIgYW5nbGVzIChYWVogb3JkZXIpLlxuICAgKiBAcmV0dXJucyBBIGNsb25lZCBWZWN0b3IzIGNvbnRhaW5pbmcgcm90YXRpb24gYW5nbGVzIGluIHJhZGlhbnMgW3gsIHksIHpdXG4gICAqL1xuICBnZXQgZXVsZXJBbmdsZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuZXVsZXJBbmdsZXNJbm5lci5jbG9uZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHJvdGF0aW9uIGFzIEV1bGVyIGFuZ2xlcyAoWFlaIG9yZGVyKSAtIGRpcmVjdCByZWZlcmVuY2UuXG4gICAqIEByZXR1cm5zIEEgVmVjdG9yMyBjb250YWluaW5nIHJvdGF0aW9uIGFuZ2xlcyBpbiByYWRpYW5zIFt4LCB5LCB6XVxuICAgKi9cbiAgZ2V0IGV1bGVyQW5nbGVzSW5uZXIoKTogVmVjdG9yMyB7XG4gICAgLy8gdGhpcy5faXNfcXVhdGVybmlvbl91cGRhdGVkXG4gICAgcmV0dXJuIHRoaXMuX19yb3RhdGlvbi50b0V1bGVyQW5nbGVzKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgc2NhbGUgb2YgdGhlIHRyYW5zZm9ybS5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSBuZXcgc2NhbGUgdmVjdG9yXG4gICAqL1xuICBzZXQgc2NhbGUodmVjOiBJVmVjdG9yMykge1xuICAgIHRoaXMuX19zY2FsZS5jb3B5Q29tcG9uZW50cyh2ZWMpO1xuICAgIHRoaXMuX191cGRhdGVUcmFuc2Zvcm0oKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBzY2FsZSB1c2luZyBhbiBhcnJheSBvZiB0aHJlZSBudW1iZXJzLlxuICAgKiBAcGFyYW0gYXJyYXkgLSBBcnJheSBjb250YWluaW5nIFt4LCB5LCB6XSBzY2FsZSB2YWx1ZXNcbiAgICovXG4gIHNldFNjYWxlQXNBcnJheTMoYXJyYXk6IEFycmF5MzxudW1iZXI+KSB7XG4gICAgdGhpcy5fX3NjYWxlLl92WzBdID0gYXJyYXlbMF07XG4gICAgdGhpcy5fX3NjYWxlLl92WzFdID0gYXJyYXlbMV07XG4gICAgdGhpcy5fX3NjYWxlLl92WzJdID0gYXJyYXlbMl07XG4gICAgdGhpcy5fX3VwZGF0ZVRyYW5zZm9ybSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSBjb3B5IG9mIHRoZSBsb2NhbCBzY2FsZSB2ZWN0b3IuXG4gICAqIEByZXR1cm5zIEEgY2xvbmVkIE11dGFibGVWZWN0b3IzIHJlcHJlc2VudGluZyB0aGUgc2NhbGVcbiAgICovXG4gIGdldCBzY2FsZSgpIHtcbiAgICByZXR1cm4gdGhpcy5zY2FsZUlubmVyLmNsb25lKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW50ZXJuYWwgc2NhbGUgdmVjdG9yIChkaXJlY3QgcmVmZXJlbmNlKS5cbiAgICogQHJldHVybnMgVGhlIGludGVybmFsIE11dGFibGVWZWN0b3IzIHNjYWxlIG9iamVjdFxuICAgKi9cbiAgZ2V0IHNjYWxlSW5uZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19zY2FsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSByb3RhdGlvbiB1c2luZyBhIHF1YXRlcm5pb24uXG4gICAqIEBwYXJhbSBxdWF0IC0gVGhlIG5ldyByb3RhdGlvbiBxdWF0ZXJuaW9uXG4gICAqL1xuICBzZXQgcm90YXRpb24ocXVhdDogSVF1YXRlcm5pb24pIHtcbiAgICB0aGlzLl9fcm90YXRpb24uY29weUNvbXBvbmVudHMocXVhdCk7XG4gICAgdGhpcy5fX3VwZGF0ZVRyYW5zZm9ybSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHJvdGF0aW9uIHVzaW5nIGFuIGFycmF5IG9mIGZvdXIgbnVtYmVycyByZXByZXNlbnRpbmcgYSBxdWF0ZXJuaW9uLlxuICAgKiBAcGFyYW0gYXJyYXkgLSBBcnJheSBjb250YWluaW5nIFt4LCB5LCB6LCB3XSBxdWF0ZXJuaW9uIHZhbHVlc1xuICAgKi9cbiAgc2V0Um90YXRpb25Bc0FycmF5NChhcnJheTogQXJyYXk0PG51bWJlcj4pIHtcbiAgICB0aGlzLl9fcm90YXRpb24uX3ZbMF0gPSBhcnJheVswXTtcbiAgICB0aGlzLl9fcm90YXRpb24uX3ZbMV0gPSBhcnJheVsxXTtcbiAgICB0aGlzLl9fcm90YXRpb24uX3ZbMl0gPSBhcnJheVsyXTtcbiAgICB0aGlzLl9fcm90YXRpb24uX3ZbM10gPSBhcnJheVszXTtcbiAgICB0aGlzLl9fdXBkYXRlVHJhbnNmb3JtKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIGNvcHkgb2YgdGhlIGxvY2FsIHJvdGF0aW9uIHF1YXRlcm5pb24uXG4gICAqIEByZXR1cm5zIEEgY2xvbmVkIFF1YXRlcm5pb24gcmVwcmVzZW50aW5nIHRoZSByb3RhdGlvblxuICAgKi9cbiAgZ2V0IHJvdGF0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnJvdGF0aW9uSW5uZXIuY2xvbmUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpbnRlcm5hbCByb3RhdGlvbiBxdWF0ZXJuaW9uIChkaXJlY3QgcmVmZXJlbmNlKS5cbiAgICogQHJldHVybnMgVGhlIGludGVybmFsIFF1YXRlcm5pb24gcm90YXRpb24gb2JqZWN0XG4gICAqL1xuICBnZXQgcm90YXRpb25Jbm5lcigpOiBRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gdGhpcy5fX3JvdGF0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIEludGVybmFsIG1ldGhvZCB0byBpbmNyZW1lbnQgdGhlIHVwZGF0ZSBjb3VudGVyIHdoZW4gdHJhbnNmb3JtIGNoYW5nZXMuXG4gICAqXG4gICAqIEEgcG9zaXRpb24tb25seSBjaGFuZ2UgdXBkYXRlcyB0aGUgdHJhbnNsYXRpb24gY29sdW1uIG9mIHRoZSBjYWNoZWQgbWF0cml4IGluc3RlYWQgb2YgaW52YWxpZGF0aW5nIGl0LlxuICAgKiBBbmltYXRpb25zIHRoYXQgbW92ZSBub2RlcyAodGhlIGNvbW1vbiBjYXNlIHdpdGggbWFueSBsaWdodHMpIHRoZW4gYXZvaWQgdGhlIHF1YXRlcm5pb24tdG8tbWF0cml4XG4gICAqIGNvbXBvc2l0aW9uIGV2ZXJ5IGZyYW1lLiBBIHJvdGF0aW9uIG9yIHNjYWxlIGNoYW5nZSBpbnZhbGlkYXRlcyB0aGUgbWF0cml4LlxuICAgKlxuICAgKiBAcGFyYW0gY2hhbmdlIC0gV2hhdCBjaGFuZ2VkOiBgJ3Bvc2l0aW9uJ2Agb3IgZXZlcnl0aGluZyAoYCdhbGwnYCkuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfX3VwZGF0ZVRyYW5zZm9ybShjaGFuZ2U6ICdhbGwnIHwgJ3Bvc2l0aW9uJyA9ICdhbGwnKSB7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gICAgaWYgKGNoYW5nZSA9PT0gJ3Bvc2l0aW9uJyAmJiB0aGlzLl9faXNNYXRyaXhVcFRvRGF0ZSkge1xuICAgICAgY29uc3QgdiA9IHRoaXMuX19tYXRyaXguX3Y7XG4gICAgICB2WzEyXSA9IHRoaXMuX19wb3NpdGlvbi5fdlswXTtcbiAgICAgIHZbMTNdID0gdGhpcy5fX3Bvc2l0aW9uLl92WzFdO1xuICAgICAgdlsxNF0gPSB0aGlzLl9fcG9zaXRpb24uX3ZbMl07XG4gICAgICB0aGlzLl9fbWF0cml4UG9zaXRpb24uc2V0KHRoaXMuX19wb3NpdGlvbi5fdik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX19pc01hdHJpeFVwVG9EYXRlID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHRyYW5zZm9ybSBmcm9tIGEgNHg0IHRyYW5zZm9ybWF0aW9uIG1hdHJpeC5cbiAgICogRGVjb21wb3NlcyB0aGUgbWF0cml4IGludG8gcG9zaXRpb24sIHJvdGF0aW9uLCBhbmQgc2NhbGUgY29tcG9uZW50cy5cbiAgICogQHBhcmFtIG1hdCAtIFRoZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXggdG8gZGVjb21wb3NlXG4gICAqL1xuICBzZXQgbWF0cml4KG1hdDogSU1hdHJpeDQ0KSB7XG4gICAgdGhpcy5fX3JvdGF0aW9uLmZyb21NYXRyaXgobWF0KTtcbiAgICAobWF0IGFzIE1hdHJpeDQ0KS5nZXRUcmFuc2xhdGVUbyh0aGlzLl9fcG9zaXRpb24pO1xuICAgIChtYXQgYXMgTWF0cml4NDQpLmdldFNjYWxlVG8odGhpcy5fX3NjYWxlKTtcbiAgICB0aGlzLl9fdXBkYXRlVHJhbnNmb3JtKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIGNvcHkgb2YgdGhlIGxvY2FsIHRyYW5zZm9ybWF0aW9uIG1hdHJpeC5cbiAgICogQHJldHVybnMgQSBuZXcgTWF0cml4NDQgcmVwcmVzZW50aW5nIHRoZSBjb21wb3NlZCB0cmFuc2Zvcm1hdGlvblxuICAgKi9cbiAgZ2V0IG1hdHJpeCgpIHtcbiAgICByZXR1cm4gdGhpcy5tYXRyaXhJbm5lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBsb2NhbCB0cmFuc2Zvcm1hdGlvbiBtYXRyaXggY29tcG9zZWQgZnJvbSBwb3NpdGlvbiwgcm90YXRpb24sIGFuZCBzY2FsZS5cbiAgICogVGhlIG1hdHJpeCBpcyBjb21wdXRlZCBhczogVHJhbnNsYXRpb24gKiBSb3RhdGlvbiAqIFNjYWxlXG4gICAqIEByZXR1cm5zIEEgTXV0YWJsZU1hdHJpeDQ0IHJlcHJlc2VudGluZyB0aGUgY29tcG9zZWQgdHJhbnNmb3JtYXRpb25cbiAgICovXG4gIGdldCBtYXRyaXhJbm5lcigpIHtcbiAgICB0aGlzLl9fZW5zdXJlTWF0cml4VXBUb0RhdGUoKTtcbiAgICByZXR1cm4gdGhpcy5fX21hdHJpeC5jbG9uZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBvc2VzIHRoZSBsb2NhbCBtYXRyaXggZnJvbSB0aGUgY3VycmVudCBwb3NpdGlvbiwgcm90YXRpb24gYW5kIHNjYWxlIGFuZCBzdG9yZXMgaXQgaW4gdGhlIGNhY2hlLlxuICAgKi9cbiAgcHJpdmF0ZSBfX2NvbXBvc2VNYXRyaXgoKSB7XG4gICAgLy8gQ2xlYXIgYW5kIHNldCBTY2FsZVxuICAgIGNvbnN0IHNjYWxlID0gdGhpcy5zY2FsZUlubmVyO1xuICAgIGNvbnN0IG4wMCA9IHNjYWxlLl92WzBdO1xuICAgIC8vIGNvbnN0IG4wMSA9IDA7XG4gICAgLy8gY29uc3QgbjAyID0gMDtcbiAgICAvLyBjb25zdCBuMDMgPSAwO1xuICAgIC8vIGNvbnN0IG4xMCA9IDA7XG4gICAgY29uc3QgbjExID0gc2NhbGUuX3ZbMV07XG4gICAgLy8gY29uc3QgbjEyID0gMDtcbiAgICAvLyBjb25zdCBuMTMgPSAwO1xuICAgIC8vIGNvbnN0IG4yMCA9IDA7XG4gICAgLy8gY29uc3QgbjIxID0gMDtcbiAgICBjb25zdCBuMjIgPSBzY2FsZS5fdlsyXTtcbiAgICAvLyBjb25zdCBuMjMgPSAwO1xuICAgIC8vIGNvbnN0IG4zMCA9IDA7XG4gICAgLy8gY29uc3QgbjMxID0gMDtcbiAgICAvLyBjb25zdCBuMzIgPSAwO1xuICAgIC8vIGNvbnN0IG4zMyA9IDE7XG5cbiAgICBjb25zdCBxID0gdGhpcy5yb3RhdGlvbklubmVyO1xuICAgIGNvbnN0IHN4ID0gcS5fdlswXSAqIHEuX3ZbMF07XG4gICAgY29uc3Qgc3kgPSBxLl92WzFdICogcS5fdlsxXTtcbiAgICBjb25zdCBzeiA9IHEuX3ZbMl0gKiBxLl92WzJdO1xuICAgIGNvbnN0IGN4ID0gcS5fdlsxXSAqIHEuX3ZbMl07XG4gICAgY29uc3QgY3kgPSBxLl92WzBdICogcS5fdlsyXTtcbiAgICBjb25zdCBjeiA9IHEuX3ZbMF0gKiBxLl92WzFdO1xuICAgIGNvbnN0IHd4ID0gcS5fdlszXSAqIHEuX3ZbMF07XG4gICAgY29uc3Qgd3kgPSBxLl92WzNdICogcS5fdlsxXTtcbiAgICBjb25zdCB3eiA9IHEuX3ZbM10gKiBxLl92WzJdO1xuXG4gICAgY29uc3QgbTAwID0gMS4wIC0gMi4wICogKHN5ICsgc3opO1xuICAgIGNvbnN0IG0wMSA9IDIuMCAqIChjeiAtIHd6KTtcbiAgICBjb25zdCBtMDIgPSAyLjAgKiAoY3kgKyB3eSk7XG4gICAgLy8gY29uc3QgbTAzID0gMC4wO1xuICAgIGNvbnN0IG0xMCA9IDIuMCAqIChjeiArIHd6KTtcbiAgICBjb25zdCBtMTEgPSAxLjAgLSAyLjAgKiAoc3ggKyBzeik7XG4gICAgY29uc3QgbTEyID0gMi4wICogKGN4IC0gd3gpO1xuICAgIC8vIGNvbnN0IG0xMyA9IDAuMDtcbiAgICBjb25zdCBtMjAgPSAyLjAgKiAoY3kgLSB3eSk7XG4gICAgY29uc3QgbTIxID0gMi4wICogKGN4ICsgd3gpO1xuICAgIGNvbnN0IG0yMiA9IDEuMCAtIDIuMCAqIChzeCArIHN5KTtcblxuICAgIC8vIGNvbnN0IG0yMyA9IDAuMDtcbiAgICAvLyBjb25zdCBtMzAgPSAwLjA7XG4gICAgLy8gY29uc3QgbTMxID0gMC4wO1xuICAgIC8vIGNvbnN0IG0zMiA9IDAuMDtcbiAgICAvLyBjb25zdCBtMzMgPSAxLjA7XG5cbiAgICBjb25zdCB0cmFuc2xhdGUgPSB0aGlzLnBvc2l0aW9uSW5uZXI7XG5cbiAgICB0aGlzLl9fbWF0cml4LnNldENvbXBvbmVudHMoXG4gICAgICBtMDAgKiBuMDAsXG4gICAgICBtMDEgKiBuMTEsXG4gICAgICBtMDIgKiBuMjIsXG4gICAgICB0cmFuc2xhdGUueCxcbiAgICAgIG0xMCAqIG4wMCxcbiAgICAgIG0xMSAqIG4xMSxcbiAgICAgIG0xMiAqIG4yMixcbiAgICAgIHRyYW5zbGF0ZS55LFxuICAgICAgbTIwICogbjAwLFxuICAgICAgbTIxICogbjExLFxuICAgICAgbTIyICogbjIyLFxuICAgICAgdHJhbnNsYXRlLnosXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAxXG4gICAgKTtcbiAgICB0aGlzLl9fbWF0cml4UG9zaXRpb24uc2V0KHRoaXMuX19wb3NpdGlvbi5fdik7XG4gICAgdGhpcy5fX21hdHJpeFJvdGF0aW9uLnNldCh0aGlzLl9fcm90YXRpb24uX3YpO1xuICAgIHRoaXMuX19tYXRyaXhTY2FsZS5zZXQodGhpcy5fX3NjYWxlLl92KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCcmluZ3MgdGhlIGNhY2hlZCBtYXRyaXggdXAgdG8gZGF0ZS4gRGlyZWN0IG11dGF0aW9ucyBvZiB0aGUgaW5uZXIgdmVjdG9ycyAocG9zaXRpb25Jbm5lciBhbmQgdGhlIGxpa2UpXG4gICAqIGJ5cGFzcyB0aGUgc2V0dGVycywgc28gdGhleSBhcmUgZGV0ZWN0ZWQgaGVyZTogYSBwb3NpdGlvbi1vbmx5IGNoYW5nZSB1cGRhdGVzIHRoZSB0cmFuc2xhdGlvbiBjb2x1bW4sIGFuZFxuICAgKiBhIHJvdGF0aW9uIG9yIHNjYWxlIGNoYW5nZSByZWNvbXBvc2VzIHRoZSBtYXRyaXguXG4gICAqL1xuICBwcml2YXRlIF9fZW5zdXJlTWF0cml4VXBUb0RhdGUoKSB7XG4gICAgaWYgKCF0aGlzLl9faXNNYXRyaXhVcFRvRGF0ZSkge1xuICAgICAgdGhpcy5fX2NvbXBvc2VNYXRyaXgoKTtcbiAgICAgIHRoaXMuX19pc01hdHJpeFVwVG9EYXRlID0gdHJ1ZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcCA9IHRoaXMuX19wb3NpdGlvbi5fdjtcbiAgICBjb25zdCBxID0gdGhpcy5fX3JvdGF0aW9uLl92O1xuICAgIGNvbnN0IHMgPSB0aGlzLl9fc2NhbGUuX3Y7XG4gICAgY29uc3QgbXAgPSB0aGlzLl9fbWF0cml4UG9zaXRpb247XG4gICAgY29uc3QgbXEgPSB0aGlzLl9fbWF0cml4Um90YXRpb247XG4gICAgY29uc3QgbXMgPSB0aGlzLl9fbWF0cml4U2NhbGU7XG4gICAgbGV0IHJvdGF0aW9uU2NhbGVDaGFuZ2VkID0gZmFsc2U7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgIGlmIChxW2ldICE9PSBtcVtpXSkge1xuICAgICAgICByb3RhdGlvblNjYWxlQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXJvdGF0aW9uU2NhbGVDaGFuZ2VkKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgICAgICBpZiAoc1tpXSAhPT0gbXNbaV0pIHtcbiAgICAgICAgICByb3RhdGlvblNjYWxlQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHJvdGF0aW9uU2NhbGVDaGFuZ2VkKSB7XG4gICAgICB0aGlzLl9fY29tcG9zZU1hdHJpeCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAocFswXSAhPT0gbXBbMF0gfHwgcFsxXSAhPT0gbXBbMV0gfHwgcFsyXSAhPT0gbXBbMl0pIHtcbiAgICAgIGNvbnN0IHYgPSB0aGlzLl9fbWF0cml4Ll92O1xuICAgICAgdlsxMl0gPSBwWzBdO1xuICAgICAgdlsxM10gPSBwWzFdO1xuICAgICAgdlsxNF0gPSBwWzJdO1xuICAgICAgbXBbMF0gPSBwWzBdO1xuICAgICAgbXBbMV0gPSBwWzFdO1xuICAgICAgbXBbMl0gPSBwWzJdO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFZmZpY2llbnRseSBjb21wdXRlcyB0aGUgdHJhbnNmb3JtYXRpb24gbWF0cml4IGFuZCBzdG9yZXMgaXQgaW4gdGhlIHByb3ZpZGVkIG1hdHJpeC5cbiAgICogVGhlIGNvbXBvc2VkIG1hdHJpeCBpcyBjYWNoZWQsIHNvIHJlcGVhdGVkIHJlYWRzIChpbmNsdWRpbmcgYW5pbWF0ZWQgdHJhbnNsYXRpb25zKSBkbyBub3RcbiAgICogcmVjb21wb3NlIHRoZSByb3RhdGlvbiBhbmQgc2NhbGUuXG4gICAqIEBwYXJhbSBtYXQgLSBUaGUgdGFyZ2V0IG1hdHJpeCB0byBzdG9yZSB0aGUgcmVzdWx0IGluXG4gICAqL1xuICBnZXRNYXRyaXhJbm5lclRvKG1hdDogTXV0YWJsZU1hdHJpeDQ0KSB7XG4gICAgdGhpcy5fX2Vuc3VyZU1hdHJpeFVwVG9EYXRlKCk7XG4gICAgbWF0LmNvcHlDb21wb25lbnRzKHRoaXMuX19tYXRyaXgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG51bWJlciBvZiB0aW1lcyB0aGlzIHRyYW5zZm9ybSBoYXMgYmVlbiB1cGRhdGVkLlxuICAgKiBUaGlzIGNhbiBiZSB1c2VmdWwgZm9yIG9wdGltaXphdGlvbiBhbmQgY2FjaGluZyBwdXJwb3Nlcy5cbiAgICogQHJldHVybnMgVGhlIHVwZGF0ZSBjb3VudCBhcyBhIG51bWJlclxuICAgKi9cbiAgZ2V0IHVwZGF0ZUNvdW50KCkge1xuICAgIHJldHVybiB0aGlzLl9fdXBkYXRlQ291bnQ7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcm90YXRpb24gdXNpbmcgYSA0eDQgcm90YXRpb24gbWF0cml4LlxuICAgKiBAcGFyYW0gcm90YXRlTWF0cml4IC0gVGhlIHJvdGF0aW9uIG1hdHJpeCB0byBleHRyYWN0IHJvdGF0aW9uIGZyb21cbiAgICovXG4gIHNldCByb3RhdGVNYXRyaXg0NChyb3RhdGVNYXRyaXg6IElNYXRyaXg0NCkge1xuICAgIHRoaXMucm90YXRpb24gPSBUcmFuc2Zvcm0zRC5fX3RtcFF1YXRlcm5pb25fMC5mcm9tTWF0cml4KHJvdGF0ZU1hdHJpeCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcm90YXRpb24gYXMgYSA0eDQgcm90YXRpb24gbWF0cml4LlxuICAgKiBAcmV0dXJucyBBIE1hdHJpeDQ0IHJlcHJlc2VudGluZyBvbmx5IHRoZSByb3RhdGlvbiBjb21wb25lbnRcbiAgICovXG4gIGdldCByb3RhdGVNYXRyaXg0NCgpIHtcbiAgICByZXR1cm4gTWF0cml4NDQuZnJvbUNvcHlRdWF0ZXJuaW9uKHRoaXMucm90YXRpb24pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdHJhbnNmb3JtIHByb3BlcnRpZXMgZnJvbSBhIEpTT04gb2JqZWN0LlxuICAgKiBTdXBwb3J0cyBzZXR0aW5nIHBvc2l0aW9uLCBzY2FsZSwgcm90YXRpb24gKGFzIHF1YXRlcm5pb24pLCBhbmQgbWF0cml4IHByb3BlcnRpZXMuXG4gICAqIEBwYXJhbSBhcmcgLSBKU09OIG9iamVjdCBvciBKU09OIHN0cmluZyBjb250YWluaW5nIHRyYW5zZm9ybSBwcm9wZXJ0aWVzXG4gICAqL1xuICBzZXRQcm9wZXJ0aWVzRnJvbUpzb24oYXJnOiBKU09OKSB7XG4gICAgbGV0IGpzb24gPSBhcmc7XG4gICAgaWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnKSB7XG4gICAgICBqc29uID0gSlNPTi5wYXJzZShhcmcpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGtleSBpbiBqc29uKSB7XG4gICAgICBpZiAoT2JqZWN0Lmhhc093bihqc29uLCBrZXkpICYmIGtleSBpbiB0aGlzKSB7XG4gICAgICAgIGlmIChrZXkgPT09ICdxdWF0ZXJuaW9uJykge1xuICAgICAgICAgIHRoaXMucm90YXRpb24gPSBRdWF0ZXJuaW9uLmZyb21Db3B5QXJyYXk0KChqc29uIGFzIGFueSlba2V5XSBhcyBBcnJheTQ8bnVtYmVyPik7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSAnbWF0cml4Jykge1xuICAgICAgICAgIHRoaXNba2V5XSA9IE1hdHJpeDQ0LmZyb21Db3B5QXJyYXkxNlJvd01ham9yKChqc29uIGFzIGFueSlba2V5XSBhcyBBcnJheTE2PG51bWJlcj4pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICh0aGlzIGFzIGFueSlba2V5XSA9IFZlY3RvcjMuZnJvbUNvcHlBcnJheSgoanNvbiBhcyBhbnkpW2tleV0gYXMgQXJyYXkzPG51bWJlcj4pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHJvdGF0aW9uIHRvIGFsaWduIHdpdGggc3BlY2lmaWVkIHVwIGFuZCBmcm9udCB2ZWN0b3JzLlxuICAgKiBDcmVhdGVzIGEgY29vcmRpbmF0ZSBzeXN0ZW0gd2hlcmUgdGhlIFktYXhpcyBhbGlnbnMgd2l0aCB0aGUgdXAgdmVjdG9yXG4gICAqIGFuZCB0aGUgWi1heGlzIGFsaWducyB3aXRoIHRoZSBmcm9udCB2ZWN0b3IuXG4gICAqIEBwYXJhbSBVcFZlYyAtIFRoZSBkZXNpcmVkIHVwIGRpcmVjdGlvbiAoWS1heGlzKVxuICAgKiBAcGFyYW0gRnJvbnRWZWMgLSBUaGUgZGVzaXJlZCBmcm9udCBkaXJlY3Rpb24gKFotYXhpcylcbiAgICovXG4gIHNldFJvdGF0aW9uRnJvbU5ld1VwQW5kRnJvbnQoVXBWZWM6IElWZWN0b3IzLCBGcm9udFZlYzogSVZlY3RvcjMpIHtcbiAgICBjb25zdCB5RGlyID0gVXBWZWM7XG4gICAgY29uc3QgeERpciA9IE11dGFibGVWZWN0b3IzLmNyb3NzVG8oeURpciwgRnJvbnRWZWMsIFRyYW5zZm9ybTNELl9fdG1wVmVjdG9yM18wKTtcbiAgICBjb25zdCB6RGlyID0gTXV0YWJsZVZlY3RvcjMuY3Jvc3NUbyh4RGlyLCB5RGlyLCBUcmFuc2Zvcm0zRC5fX3RtcFZlY3RvcjNfMSk7XG5cbiAgICBjb25zdCByb3RhdGVNYXRyaXggPSBUcmFuc2Zvcm0zRC5fX3RtcE1hdHJpeDQ0XzAuc2V0Q29tcG9uZW50cyhcbiAgICAgIHhEaXIueCxcbiAgICAgIHlEaXIueCxcbiAgICAgIHpEaXIueCxcbiAgICAgIDAsXG4gICAgICB4RGlyLnksXG4gICAgICB5RGlyLnksXG4gICAgICB6RGlyLnksXG4gICAgICAwLFxuICAgICAgeERpci56LFxuICAgICAgeURpci56LFxuICAgICAgekRpci56LFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIDFcbiAgICApO1xuXG4gICAgdGhpcy5yb3RhdGVNYXRyaXg0NCA9IHJvdGF0ZU1hdHJpeDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSb3RhdGVzIHRoZSB0cmFuc2Zvcm0gdG8gZmFjZSBmcm9tIG9uZSBkaXJlY3Rpb24gdG8gYW5vdGhlci5cbiAgICogQ2FsY3VsYXRlcyB0aGUgcm90YXRpb24gbmVlZGVkIHRvIGFsaWduIHRoZSAnZnJvbScgZGlyZWN0aW9uIHdpdGggdGhlICd0bycgZGlyZWN0aW9uLlxuICAgKiBAcGFyYW0gZnJvbVZlYyAtIFRoZSBjdXJyZW50IGZvcndhcmQgZGlyZWN0aW9uXG4gICAqIEBwYXJhbSB0b1ZlYyAtIFRoZSB0YXJnZXQgZGlyZWN0aW9uIHRvIGZhY2UgdG93YXJkc1xuICAgKi9cbiAgaGVhZFRvRGlyZWN0aW9uKGZyb21WZWM6IFZlY3RvcjMsIHRvVmVjOiBWZWN0b3IzKSB7XG4gICAgY29uc3QgZnJvbURpciA9IFRyYW5zZm9ybTNELl9fdG1wVmVjdG9yM18wLmNvcHlDb21wb25lbnRzKGZyb21WZWMpLm5vcm1hbGl6ZSgpO1xuICAgIGNvbnN0IHRvRGlyID0gVHJhbnNmb3JtM0QuX190bXBWZWN0b3IzXzEuY29weUNvbXBvbmVudHModG9WZWMpLm5vcm1hbGl6ZSgpO1xuICAgIGNvbnN0IHJvdGF0aW9uRGlyID0gTXV0YWJsZVZlY3RvcjMuY3Jvc3NUbyhmcm9tRGlyLCB0b0RpciwgVHJhbnNmb3JtM0QuX190bXBWZWN0b3IzXzIpO1xuICAgIGNvbnN0IGNvc1RoZXRhID0gVmVjdG9yMy5kb3QoZnJvbURpciwgdG9EaXIpO1xuICAgIGNvbnN0IHRoZXRhID0gTWF0aC5hY29zKGNvc1RoZXRhKTtcblxuICAgIHRoaXMucm90YXRpb24gPSBUcmFuc2Zvcm0zRC5fX3RtcFF1YXRlcm5pb25fMC5heGlzQW5nbGUocm90YXRpb25EaXIsIHRoZXRhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIG11bHRpcGxlIHRyYW5zZm9ybSBjb21wb25lbnRzIGF0IG9uY2UgZm9yIG9wdGltYWwgcGVyZm9ybWFuY2UuXG4gICAqIFRoaXMgbWV0aG9kIHJlZHVjZXMgdGhlIGNvc3Qgb2YgYXV0b21hdGljYWxseSB1cGRhdGluZyB0cmFuc2Zvcm0gbWF0cmljZXNcbiAgICogYnkgc2V0dGluZyBhbGwgY29tcG9uZW50cyBpbiBhIHNpbmdsZSBvcGVyYXRpb24uIFVzZWZ1bCBmb3IgYW5pbWF0aW9uIGFuZFxuICAgKiBiYXRjaCB1cGRhdGVzIHdoZXJlIHBlcmZvcm1hbmNlIGlzIGNyaXRpY2FsLlxuICAgKlxuICAgKiBOb3RlOiBUaGUgcHJvdmlkZWQgdHJhbnNmb3JtIGNvbXBvbmVudHMgbXVzdCBiZSBtdXR1YWxseSBjb25zaXN0ZW50LlxuICAgKiBGb3IgZXhhbXBsZSwgaWYgYSBtYXRyaXggaXMgcHJvdmlkZWQsIGl0cyBkZWNvbXBvc2VkIHRyYW5zbGF0ZSwgcm90YXRlLCBhbmQgc2NhbGVcbiAgICogY29tcG9uZW50cyBzaG91bGQgbWF0Y2ggdGhlIGluZGl2aWR1YWwgY29tcG9uZW50IGFyZ3VtZW50cy5cbiAgICpcbiAgICogQHBhcmFtIHRyYW5zbGF0ZSAtIFRoZSBwb3NpdGlvbiBjb21wb25lbnRcbiAgICogQHBhcmFtIHNjYWxlIC0gVGhlIHNjYWxlIGNvbXBvbmVudFxuICAgKiBAcGFyYW0gcm90YXRpb24gLSBUaGUgcm90YXRpb24gY29tcG9uZW50IGFzIGEgcXVhdGVybmlvblxuICAgKi9cbiAgc2V0VHJhbnNmb3JtKHRyYW5zbGF0ZTogTXV0YWJsZVZlY3RvcjMsIHNjYWxlOiBNdXRhYmxlVmVjdG9yMywgcm90YXRpb246IE11dGFibGVRdWF0ZXJuaW9uKSB7XG4gICAgLy8gVHJhbnNsYXRlXG4gICAgdGhpcy5fX3Bvc2l0aW9uID0gdHJhbnNsYXRlLmNsb25lKCk7XG5cbiAgICAvLyBSb3RhdGlvblxuICAgIHRoaXMuX19yb3RhdGlvbiA9IHJvdGF0aW9uLmNsb25lKCkgYXMgTXV0YWJsZVF1YXRlcm5pb247XG5cbiAgICAvLyBTY2FsZVxuICAgIHRoaXMuX19zY2FsZSA9IHNjYWxlLmNsb25lKCk7XG5cbiAgICB0aGlzLl9fdXBkYXRlVHJhbnNmb3JtKCk7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFJQSxTQUFTLGdCQUFnQjtBQUN6QixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLHlCQUF5QjtBQUNsQyxTQUFTLHNCQUFzQjtBQUMvQixTQUFTLGtCQUFrQjtBQUMzQixTQUFTLGVBQWU7QUFnQmpCLElBQU0sZUFBTixNQUFNLGFBQVk7QUFBQSxFQTBCdkIsWUFBWSxHQUFpQjtBQXJCN0IsU0FBUUEsS0FBZ0I7QUFFeEI7QUFBQSxTQUFRQyxLQUFXLGdCQUFnQixTQUFTO0FBQzVDLFNBQVFDLEtBQXFCO0FBRTdCO0FBQUEsU0FBUUMsS0FBbUIsSUFBSSxhQUFhLENBQUM7QUFDN0MsU0FBUUMsS0FBbUIsSUFBSSxhQUFhLENBQUM7QUFDN0MsU0FBUUMsS0FBZ0IsSUFBSSxhQUFhLENBQUM7QUFleEMsU0FBS0MsS0FBYSxlQUFlLE1BQU07QUFD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S04sS0FBYSxVQUFVLE1BQU07QUFHbEMsU0FBS0UsS0FBYSxTQUFTLE1BQU07QUFHakMsU0FBS0QsS0FBVSxNQUFNLE1BQU07QUFFM0IsU0FBS0UsR0FBa0I7QUFBQSxFQUN6QjtBQUNGO0FBemdCYSxhQWNJTSxLQUFtQyxnQkFBZ0IsS0FBSztBQWQ1RCxhQWVJRixLQUFpQyxlQUFlLEtBQUs7QUFmekQsYUFnQklDLEtBQWlDLGVBQWUsS0FBSztBQWhCekQsYUFpQklFLEtBQWlDLGVBQWUsS0FBSztBQWpCekQsYUFrQklKLEtBQXVDLGtCQUFrQixTQUFTO0FBbEI1RSxJQUFNLGNBQU47IiwKICAibmFtZXMiOiBbIl9fdXBkYXRlQ291bnQiLCAiX19tYXRyaXgiLCAiX19pc01hdHJpeFVwVG9EYXRlIiwgIl9fbWF0cml4UG9zaXRpb24iLCAiX19tYXRyaXhSb3RhdGlvbiIsICJfX21hdHJpeFNjYWxlIiwgIl9fcG9zaXRpb24iLCAiX19zY2FsZSIsICJfX3JvdGF0aW9uIiwgIl9fdXBkYXRlVHJhbnNmb3JtIiwgIl9fZW5zdXJlTWF0cml4VXBUb0RhdGUiLCAiX19jb21wb3NlTWF0cml4IiwgIl9fdG1wUXVhdGVybmlvbl8wIiwgIl9fdG1wVmVjdG9yM18wIiwgIl9fdG1wVmVjdG9yM18xIiwgIl9fdG1wTWF0cml4NDRfMCIsICJfX3RtcFZlY3RvcjNfMiJdCn0K
