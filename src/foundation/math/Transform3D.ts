import { Array16, Array3, Array4 } from '../../types';
import { IMatrix44 } from './IMatrix';
import { IQuaternion } from './IQuaternion';
import { IVector3 } from './IVector';
import { Matrix44 } from './Matrix44';
import { MutableMatrix44 } from './MutableMatrix44';
import { MutableQuaternion } from './MutableQuaternion';
import { MutableVector3 } from './MutableVector3';
import { Quaternion } from './Quaternion';
import { Vector3 } from './Vector3';

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

  constructor();
  constructor(Transform3D: Transform3D);
  constructor(x?: Transform3D) {
    this.__position = MutableVector3.dummy();
    this.__scale = MutableVector3.dummy();
    this.__rotation = MutableQuaternion.dummy();

    if (x !== undefined) {
      this.setTransform(
        x.positionInner,
        x.scaleInner,
        MutableQuaternion.fromCopyQuaternion(x.rotationInner)
      );
    } else {
      this.__position = MutableVector3.zero();
      this.__scale = MutableVector3.one();
      this.__rotation = MutableQuaternion.identity();
    }
  }

  isEqual(rhs: Transform3D, delta = Number.EPSILON): boolean {
    return (
      this.positionInner.isEqual(rhs.positionInner, delta) &&
      this.rotationInner.isEqual(rhs.rotationInner, delta) &&
      this.scaleInner.isEqual(rhs.scaleInner, delta)
    );
  }

  clone() {
    const clone = new Transform3D(this);
    return clone;
  }

  set position(vec: IVector3) {
    this.__position.copyComponents(vec);
    this.__updateTransform();
  }

  setPositionAsArray3(array: Array3<number>) {
    this.__position._v[0] = array[0];
    this.__position._v[1] = array[1];
    this.__position._v[2] = array[2];
    this.__updateTransform();
  }

  /**
   * return a copy of a local position vector
   */
  get position(): MutableVector3 {
    return this.positionInner.clone();
  }

  /**
   * return a local position vector
   */
  get positionInner(): MutableVector3 {
    return this.__position;
  }

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
   * return a copy of a local rotation (XYZ euler) vector
   */
  get eulerAngles() {
    return this.eulerAnglesInner.clone();
  }

  /**
   * return a local rotation (XYZ euler) vector
   */
  get eulerAnglesInner(): Vector3 {
    // this._is_quaternion_updated
    return this.__rotation.toEulerAngles();
  }

  set scale(vec: IVector3) {
    this.__scale.copyComponents(vec);
    this.__updateTransform();
  }

  setScaleAsArray3(array: Array3<number>) {
    this.__scale._v[0] = array[0];
    this.__scale._v[1] = array[1];
    this.__scale._v[2] = array[2];
    this.__updateTransform();
  }

  /**
   * return a copy of a local scale vector
   */
  get scale() {
    return this.scaleInner.clone();
  }

  /**
   * return a local scale vector
   */
  get scaleInner() {
    return this.__scale;
  }

  set rotation(quat: IQuaternion) {
    this.__rotation.copyComponents(quat);
    this.__updateTransform();
  }

  setRotationAsArray4(array: Array4<number>) {
    this.__rotation._v[0] = array[0];
    this.__rotation._v[1] = array[1];
    this.__rotation._v[2] = array[2];
    this.__rotation._v[3] = array[3];
    this.__updateTransform();
  }

  /**
   * return a copy of a local quaternion vector
   */
  get rotation() {
    return this.rotationInner.clone();
  }

  /**
   * return a local quaternion vector
   */
  get rotationInner(): Quaternion {
    return this.__rotation;
  }

  __updateTransform() {
    this.__updateCount++;
  }

  set matrix(mat: IMatrix44) {
    this.__rotation.fromMatrix(mat);
    (mat as Matrix44).getTranslateTo(this.__position);
    (mat as Matrix44).getScaleTo(this.__scale);
    this.__updateTransform();
  }

  /**
   * return a copy of local transform matrix
   */
  get matrix() {
    return this.matrixInner;
  }

  /**
   * return a local transform matrix
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

  get updateCount() {
    return this.__updateCount;
  }

  set rotateMatrix44(rotateMatrix: IMatrix44) {
    this.rotation = Transform3D.__tmpQuaternion_0.fromMatrix(rotateMatrix);
  }

  get rotateMatrix44() {
    return Matrix44.fromCopyQuaternion(this.rotation);
  }

  setPropertiesFromJson(arg: JSON) {
    let json = arg;
    if (typeof arg === 'string') {
      json = JSON.parse(arg);
    }
    for (const key in json) {
      if (json.hasOwnProperty(key) && key in this) {
        if (key === 'quaternion') {
          this['rotation'] = Quaternion.fromCopyArray4((json as any)[key] as Array4<number>);
        } else if (key === 'matrix') {
          this[key] = Matrix44.fromCopyArray16RowMajor((json as any)[key] as Array16<number>);
        } else {
          (this as any)[key] = Vector3.fromCopyArray((json as any)[key] as Array3<number>);
        }
      }
    }
  }

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

  headToDirection(fromVec: Vector3, toVec: Vector3) {
    const fromDir = Transform3D.__tmpVector3_0.copyComponents(fromVec).normalize();
    const toDir = Transform3D.__tmpVector3_1.copyComponents(toVec).normalize();
    const rotationDir = MutableVector3.crossTo(fromDir, toDir, Transform3D.__tmpVector3_2);
    const cosTheta = Vector3.dot(fromDir, toDir);
    const theta = Math.acos(cosTheta);

    this.rotation = Transform3D.__tmpQuaternion_0.axisAngle(rotationDir, theta);
  }

  /**
   * Set multiple transform information at once. By using this method,
   * we reduce the cost of automatically updating other transform components inside this class.
   * This method may be useful for animation processing and so on.
   *
   * The transform components of these arguments must not be mutually discrepant.
   * for example. The transform components of matrix argument (translate, rotate/quaternion, scale)
   * must be equal to translate, rotate, scale, quaternion arguments.
   * And both rotate and quaternion arguments must be same rotation.
   * If there is an argument passed with null or undefined, it is interpreted as unchanged.
   *
   * @param {*} translate
   * @param {*} scale
   * @param {*} rotation
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
