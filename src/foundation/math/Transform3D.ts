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
  private __matrix: MutableMatrix44;
  // private _invMatrix: MutableMatrix44;
  // private _normalMatrix: MutableMatrix33;

  private __is_position_updated = true;
  private __is_scale_updated = true;
  private __is_rotation_updated = true;
  private __is_trs_matrix_updated = true;
  // private __is_inverse_trs_matrix_updated = true;
  // private __is_normal_trs_matrix_updated = true;

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
    this.__matrix = MutableMatrix44.dummy();
    // this._invMatrix = MutableMatrix44.dummy();
    // this._normalMatrix = MutableMatrix33.dummy();
    if (x !== undefined) {
      this.setTransform(
        x.positionInner,
        MutableVector3.fromCopyVector3(x.eulerAnglesInner),
        x.scaleInner,
        MutableQuaternion.fromCopyQuaternion(x.rotationInner),
        x.matrixInner
      );
    } else {
      this.__position = MutableVector3.zero();
      this.__scale = MutableVector3.one();
      this.__rotation = MutableQuaternion.identity();
      this.__matrix = MutableMatrix44.identity();
      // this._invMatrix = MutableMatrix44.identity();
      // this._normalMatrix = MutableMatrix33.identity();
    }
  }

  isEqual(rhs: Transform3D, delta = Number.EPSILON): boolean {
    return (
      this.positionInner.isEqual(rhs.positionInner, delta) &&
      this.rotationInner.isEqual(rhs.rotationInner, delta) &&
      this.scaleInner.isEqual(rhs.scaleInner, delta) &&
      this.matrixInner.isEqual(rhs.matrixInner, delta)
    );
  }

  clone() {
    const clone = new Transform3D(this);
    return clone;
  }

  set position(vec: IVector3) {
    this.__position.copyComponents(vec);
    this.__is_position_updated = true;
    this.__is_trs_matrix_updated = false;
    // this.__is_inverse_trs_matrix_updated = false;
    // this.__is_normal_trs_matrix_updated = false;

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
    if (this.__is_position_updated) {
      return this.__position;
    } else if (this.__is_trs_matrix_updated) {
      this.__matrix.getTranslateTo(this.__position);
      this.__is_position_updated = true;
    }
    return this.__position;
  }

  set eulerAngles(vec: IVector3) {
    // const rotationMat = Transform3D.__tmpMatrix44_0.rotate(vec);
    // this.rotation = Quaternion.fromMatrix(rotationMat);
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
    this.__is_scale_updated = true;
    this.__is_trs_matrix_updated = false;
    // this.__is_inverse_trs_matrix_updated = false;
    // this.__is_normal_trs_matrix_updated = false;

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
    if (this.__is_scale_updated) {
      return this.__scale;
    } else if (this.__is_trs_matrix_updated) {
      this.__matrix.getScaleTo(this.__scale);
      this.__is_scale_updated = true;
    }

    return this.__scale;
  }

  set rotation(quat: IQuaternion) {
    this.__rotation.copyComponents(quat);
    this.__is_rotation_updated = true;
    this.__is_trs_matrix_updated = false;
    // this.__is_inverse_trs_matrix_updated = false;
    // this.__is_normal_trs_matrix_updated = false;

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
    if (this.__is_rotation_updated) {
      return this.__rotation;
    } else if (!this.__is_rotation_updated) {
      if (this.__is_trs_matrix_updated) {
        this.__is_rotation_updated = true;
        this.__rotation.fromMatrix(this.__matrix);
        return this.__rotation;
      }
    }
    return this.__rotation;
  }

  __updateTransform() {
    this.__updateEulerAngles();
    this.__updatePosition();
    this.__updateScale();

    //this.__updateMatrix();
    this.__needUpdate();
  }

  __updateEulerAngles() {
    if (!this.__is_rotation_updated && this.__is_trs_matrix_updated) {
      this.__rotation.fromMatrix(this.__matrix);
      this.__is_rotation_updated = true;
    }
  }

  __updatePosition() {
    if (!this.__is_position_updated && this.__is_trs_matrix_updated) {
      this.__matrix.getTranslateTo(this.__position);
      this.__is_position_updated = true;
    }
  }

  __updateScale() {
    if (!this.__is_scale_updated && this.__is_trs_matrix_updated) {
      this.__matrix.getScaleTo(this.__scale);
      this.__is_scale_updated = true;
    }
  }

  __updateMatrix() {
    if (
      !this.__is_trs_matrix_updated &&
      this.__is_position_updated &&
      this.__is_rotation_updated &&
      this.__is_scale_updated
    ) {
      const rotationMatrix = this.__matrix.fromQuaternion(this.__rotation);
      const scaleMat = Transform3D.__tmpMatrix44_0.scale(this.__scale);
      const rsMatrix = rotationMatrix.multiply(scaleMat); // rsMatrix references to this._matrix
      rsMatrix.putTranslate(this.__position);

      this.__is_trs_matrix_updated = true;
    }
  }

  set matrix(mat: IMatrix44) {
    this.__matrix.copyComponents(mat);
    this.__is_trs_matrix_updated = true;
    this.__is_position_updated = false;
    this.__is_rotation_updated = false;
    this.__is_scale_updated = false;
    // this.__is_inverse_trs_matrix_updated = false;
    // this.__is_normal_trs_matrix_updated = false;

    this.__updateTransform();
  }

  /**
   * return a copy of local transform matrix
   */
  get matrix() {
    return this.matrixInner.clone();
  }

  /**
   * return a local transform matrix
   */
  get matrixInner() {
    if (this.__is_trs_matrix_updated) {
      return this.__matrix;
    }

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
    this.__matrix.m00 = m00 * n00;
    this.__matrix.m01 = m01 * n11;
    this.__matrix.m02 = m02 * n22;
    this.__matrix.m03 = translate.x;

    this.__matrix.m10 = m10 * n00;
    this.__matrix.m11 = m11 * n11;
    this.__matrix.m12 = m12 * n22;
    this.__matrix.m13 = translate.y;

    this.__matrix.m20 = m20 * n00;
    this.__matrix.m21 = m21 * n11;
    this.__matrix.m22 = m22 * n22;
    this.__matrix.m23 = translate.z;

    this.__matrix.m30 = 0;
    this.__matrix.m31 = 0;
    this.__matrix.m32 = 0;
    this.__matrix.m33 = 1;

    // const rotateMatrix = new Matrix44(this.quaternion);
    // const matrix = MutableMatrix44.multiply(rotateMatrix, Matrix44.scale(this.scale));
    // matrix.m03 = this.translate.x;
    // matrix.m13 = this.translate.y;
    // matrix.m23 = this.translate.z;

    //this.__matrix.copyComponents(matrix);

    this.__is_trs_matrix_updated = true;

    return this.__matrix;
  }

  // /**
  //  * return a copy of an inverse local transform matrix
  //  */
  // get inverseMatrix(): Matrix44 {
  //   return this.inverseMatrixInner.clone();
  // }

  // /**
  //  * return an inverse local transform matrix
  //  */
  // get inverseMatrixInner() {
  //   if (!this.__is_inverse_trs_matrix_updated) {
  //     MutableMatrix44.invertTo(this.matrixInner, this._invMatrix);
  //     this.__is_inverse_trs_matrix_updated = true;
  //   }
  //   return this._invMatrix;
  // }

  // get normalMatrix() {
  //   return this.normalMatrixInner.clone();
  // }

  // get normalMatrixInner() {
  //   if (!this.__is_normal_trs_matrix_updated) {
  //     const invertedMatrix44 = MutableMatrix44.invertTo(
  //       this.matrixInner,
  //       Transform3D.__tmpMatrix44_0
  //     );
  //     const newNormalMatrix = invertedMatrix44.transpose();
  //     this._normalMatrix.copyComponents(newNormalMatrix);
  //     this.__is_normal_trs_matrix_updated = true;
  //   }
  //   return this._normalMatrix;
  // }

  __needUpdate() {
    this.__updateCount++;
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
   * @param {*} rotate
   * @param {*} scale
   * @param {*} quaternion
   * @param {*} matrix
   */

  setTransform(
    translate: MutableVector3,
    rotate: MutableVector3,
    scale: MutableVector3,
    quaternion: MutableQuaternion,
    matrix: MutableMatrix44
  ) {
    this.__is_trs_matrix_updated = false;
    // this.__is_inverse_trs_matrix_updated = false;
    // this.__is_normal_trs_matrix_updated = false;

    // Matrix
    if (matrix != null) {
      this.__matrix = matrix.clone();
      this.__is_trs_matrix_updated = true;
      this.__is_position_updated = false;
      this.__is_rotation_updated = false;
      this.__is_scale_updated = false;
    }

    // Translate
    if (translate != null) {
      this.__position = translate.clone();
      this.__is_position_updated = true;
    }

    // Rotation
    if (rotate != null && quaternion != null) {
      this.__rotation = quaternion.clone() as MutableQuaternion;
      this.__is_rotation_updated = true;
    } else if (rotate != null) {
      this.__is_rotation_updated = false;
    } else if (quaternion != null) {
      this.__rotation = quaternion.clone() as MutableQuaternion;
      this.__is_rotation_updated = true;
    }

    // Scale
    if (scale != null) {
      this.__scale = scale.clone();
      this.__is_scale_updated = true;
    }

    this.__updateTransform();
  }
}
