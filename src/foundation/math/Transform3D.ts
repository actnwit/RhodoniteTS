import type { Array3, Array4, Array16 } from '../../types';
import type { IMatrix44 } from './IMatrix';
import type { IQuaternion } from './IQuaternion';
import type { IVector3 } from './IVector';
import { Matrix44 } from './Matrix44';
import { MutableMatrix44 } from './MutableMatrix44';
import { MutableQuaternion } from './MutableQuaternion';
import { MutableVector3 } from './MutableVector3';
import { Quaternion } from './Quaternion';
import { Vector3 } from './Vector3';

/**
 * Represents a 3D transformation containing position, rotation, and scale components.
 * This class provides a convenient way to handle 3D object transformations with
 * automatic matrix composition and decomposition capabilities.
 *
 * @example
 * ```typescript
 * const transform = new Transform3D();
 * transform.position = Vector3.fromCopyArray([1, 2, 3]);
 * transform.scale = Vector3.fromCopyArray([2, 2, 2]);
 * transform.rotation = Quaternion.fromEulerAngles(0, Math.PI / 4, 0);
 * const matrix = transform.matrix;
 * ```
 */
export class Transform3D {
  private __position: MutableVector3;
  private __scale: MutableVector3;
  private __rotation: MutableQuaternion;

  private __updateCount = 0;

  private static __tmpMatrix44_0: MutableMatrix44 = MutableMatrix44.zero();
  private static __tmpVector3_0: MutableVector3 = MutableVector3.zero();
  private static __tmpVector3_1: MutableVector3 = MutableVector3.zero();
  private static __tmpVector3_2: MutableVector3 = MutableVector3.zero();
  private static __tmpQuaternion_0: MutableQuaternion = MutableQuaternion.identity();

  /**
   * Creates a new Transform3D instance.
   * @param transform - Optional Transform3D instance to copy from
   */
  constructor();
  constructor(Transform3D: Transform3D);
  constructor(x?: Transform3D) {
    this.__position = MutableVector3.dummy();
    this.__scale = MutableVector3.dummy();
    this.__rotation = MutableQuaternion.dummy();

    if (x !== undefined) {
      this.setTransform(x.positionInner, x.scaleInner, MutableQuaternion.fromCopyQuaternion(x.rotationInner));
    } else {
      this.__position = MutableVector3.zero();
      this.__scale = MutableVector3.one();
      this.__rotation = MutableQuaternion.identity();
    }
  }

  /**
   * Checks if this transform is equal to another transform within a given tolerance.
   * @param rhs - The transform to compare against
   * @param delta - The tolerance for comparison (default: Number.EPSILON)
   * @returns True if the transforms are equal within the specified tolerance
   */
  isEqual(rhs: Transform3D, delta = Number.EPSILON): boolean {
    return (
      this.positionInner.isEqual(rhs.positionInner, delta) &&
      this.rotationInner.isEqual(rhs.rotationInner, delta) &&
      this.scaleInner.isEqual(rhs.scaleInner, delta)
    );
  }

  /**
   * Creates a deep copy of this transform.
   * @returns A new Transform3D instance with the same values
   */
  clone() {
    const clone = new Transform3D(this);
    return clone;
  }

  /**
   * Sets the position of the transform.
   * @param vec - The new position vector
   */
  set position(vec: IVector3) {
    this.__position.copyComponents(vec);
    this.__updateTransform();
  }

  /**
   * Sets the position using an array of three numbers.
   * @param array - Array containing [x, y, z] position values
   */
  setPositionAsArray3(array: Array3<number>) {
    this.__position._v[0] = array[0];
    this.__position._v[1] = array[1];
    this.__position._v[2] = array[2];
    this.__updateTransform();
  }

  /**
   * Gets a copy of the local position vector.
   * @returns A cloned MutableVector3 representing the position
   */
  get position(): MutableVector3 {
    return this.positionInner.clone();
  }

  /**
   * Gets the internal position vector (direct reference).
   * @returns The internal MutableVector3 position object
   */
  get positionInner(): MutableVector3 {
    return this.__position;
  }

  /**
   * Sets the rotation using Euler angles (XYZ order).
   * @param vec - Vector containing rotation angles in radians [x, y, z]
   */
  set eulerAngles(vec: IVector3) {
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
  get eulerAnglesInner(): Vector3 {
    // this._is_quaternion_updated
    return this.__rotation.toEulerAngles();
  }

  /**
   * Sets the scale of the transform.
   * @param vec - The new scale vector
   */
  set scale(vec: IVector3) {
    this.__scale.copyComponents(vec);
    this.__updateTransform();
  }

  /**
   * Sets the scale using an array of three numbers.
   * @param array - Array containing [x, y, z] scale values
   */
  setScaleAsArray3(array: Array3<number>) {
    this.__scale._v[0] = array[0];
    this.__scale._v[1] = array[1];
    this.__scale._v[2] = array[2];
    this.__updateTransform();
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
    return this.__scale;
  }

  /**
   * Sets the rotation using a quaternion.
   * @param quat - The new rotation quaternion
   */
  set rotation(quat: IQuaternion) {
    this.__rotation.copyComponents(quat);
    this.__updateTransform();
  }

  /**
   * Sets the rotation using an array of four numbers representing a quaternion.
   * @param array - Array containing [x, y, z, w] quaternion values
   */
  setRotationAsArray4(array: Array4<number>) {
    this.__rotation._v[0] = array[0];
    this.__rotation._v[1] = array[1];
    this.__rotation._v[2] = array[2];
    this.__rotation._v[3] = array[3];
    this.__updateTransform();
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
  get rotationInner(): Quaternion {
    return this.__rotation;
  }

  /**
   * Internal method to increment the update counter when transform changes.
   * @private
   */
  __updateTransform() {
    this.__updateCount++;
  }

  /**
   * Sets the transform from a 4x4 transformation matrix.
   * Decomposes the matrix into position, rotation, and scale components.
   * @param mat - The transformation matrix to decompose
   */
  set matrix(mat: IMatrix44) {
    this.__rotation.fromMatrix(mat);
    (mat as Matrix44).getTranslateTo(this.__position);
    (mat as Matrix44).getScaleTo(this.__scale);
    this.__updateTransform();
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
    // Clear and set Scale
    const scale = this.scaleInner;
    const n00 = scale._v[0];
    // const n01 = 0;
    // const n02 = 0;
    // const n03 = 0;
    // const n10 = 0;
    const n11 = scale._v[1];
    // const n12 = 0;
    // const n13 = 0;
    // const n20 = 0;
    // const n21 = 0;
    const n22 = scale._v[2];
    // const n23 = 0;
    // const n30 = 0;
    // const n31 = 0;
    // const n32 = 0;
    // const n33 = 1;

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

    const m00 = 1.0 - 2.0 * (sy + sz);
    const m01 = 2.0 * (cz - wz);
    const m02 = 2.0 * (cy + wy);
    // const m03 = 0.0;
    const m10 = 2.0 * (cz + wz);
    const m11 = 1.0 - 2.0 * (sx + sz);
    const m12 = 2.0 * (cx - wx);
    // const m13 = 0.0;
    const m20 = 2.0 * (cy - wy);
    const m21 = 2.0 * (cx + wx);
    const m22 = 1.0 - 2.0 * (sx + sy);

    // const m23 = 0.0;
    // const m30 = 0.0;
    // const m31 = 0.0;
    // const m32 = 0.0;
    // const m33 = 1.0;

    const translate = this.positionInner;

    // TranslateMatrix * RotateMatrix * ScaleMatrix
    const mat = MutableMatrix44.fromCopy16RowMajor(
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

    return mat;
  }

  /**
   * Efficiently computes the transformation matrix and stores it in the provided matrix.
   * This method avoids memory allocation by reusing an existing matrix object.
   * @param mat - The target matrix to store the result in
   */
  getMatrixInnerTo(mat: MutableMatrix44) {
    // Clear and set Scale
    const scale = this.scaleInner;
    const n00 = scale._v[0];
    // const n01 = 0;
    // const n02 = 0;
    // const n03 = 0;
    // const n10 = 0;
    const n11 = scale._v[1];
    // const n12 = 0;
    // const n13 = 0;
    // const n20 = 0;
    // const n21 = 0;
    const n22 = scale._v[2];
    // const n23 = 0;
    // const n30 = 0;
    // const n31 = 0;
    // const n32 = 0;
    // const n33 = 1;

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

    const m00 = 1.0 - 2.0 * (sy + sz);
    const m01 = 2.0 * (cz - wz);
    const m02 = 2.0 * (cy + wy);
    // const m03 = 0.0;
    const m10 = 2.0 * (cz + wz);
    const m11 = 1.0 - 2.0 * (sx + sz);
    const m12 = 2.0 * (cx - wx);
    // const m13 = 0.0;
    const m20 = 2.0 * (cy - wy);
    const m21 = 2.0 * (cx + wx);
    const m22 = 1.0 - 2.0 * (sx + sy);

    // const m23 = 0.0;
    // const m30 = 0.0;
    // const m31 = 0.0;
    // const m32 = 0.0;
    // const m33 = 1.0;

    const translate = this.positionInner;

    mat.setComponents(
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
  }

  /**
   * Gets the number of times this transform has been updated.
   * This can be useful for optimization and caching purposes.
   * @returns The update count as a number
   */
  get updateCount() {
    return this.__updateCount;
  }

  /**
   * Sets the rotation using a 4x4 rotation matrix.
   * @param rotateMatrix - The rotation matrix to extract rotation from
   */
  set rotateMatrix44(rotateMatrix: IMatrix44) {
    this.rotation = Transform3D.__tmpQuaternion_0.fromMatrix(rotateMatrix);
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
  setPropertiesFromJson(arg: JSON) {
    let json = arg;
    if (typeof arg === 'string') {
      json = JSON.parse(arg);
    }
    for (const key in json) {
      if (json.hasOwnProperty(key) && key in this) {
        if (key === 'quaternion') {
          this.rotation = Quaternion.fromCopyArray4((json as any)[key] as Array4<number>);
        } else if (key === 'matrix') {
          this[key] = Matrix44.fromCopyArray16RowMajor((json as any)[key] as Array16<number>);
        } else {
          (this as any)[key] = Vector3.fromCopyArray((json as any)[key] as Array3<number>);
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
  setRotationFromNewUpAndFront(UpVec: IVector3, FrontVec: IVector3) {
    const yDir = UpVec;
    const xDir = MutableVector3.crossTo(yDir, FrontVec, Transform3D.__tmpVector3_0);
    const zDir = MutableVector3.crossTo(xDir, yDir, Transform3D.__tmpVector3_1);

    const rotateMatrix = Transform3D.__tmpMatrix44_0.setComponents(
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
  headToDirection(fromVec: Vector3, toVec: Vector3) {
    const fromDir = Transform3D.__tmpVector3_0.copyComponents(fromVec).normalize();
    const toDir = Transform3D.__tmpVector3_1.copyComponents(toVec).normalize();
    const rotationDir = MutableVector3.crossTo(fromDir, toDir, Transform3D.__tmpVector3_2);
    const cosTheta = Vector3.dot(fromDir, toDir);
    const theta = Math.acos(cosTheta);

    this.rotation = Transform3D.__tmpQuaternion_0.axisAngle(rotationDir, theta);
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
  setTransform(translate: MutableVector3, scale: MutableVector3, rotation: MutableQuaternion) {
    // Translate
    this.__position = translate.clone();

    // Rotation
    this.__rotation = rotation.clone() as MutableQuaternion;

    // Scale
    this.__scale = scale.clone();

    this.__updateTransform();
  }
}
