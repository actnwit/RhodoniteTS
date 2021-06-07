import Vector3 from '../math/Vector3';
import Quaternion from '../math/Quaternion';
import Matrix44 from '../math/Matrix44';
import Component from '../core/Component';
import ComponentRepository from '../core/ComponentRepository';
import {ComponentType} from '../definitions/ComponentType';
import EntityRepository from '../core/EntityRepository';
import {WellKnownComponentTIDs} from './WellKnownComponentTIDs';
import {BufferUse} from '../definitions/BufferUse';
import MutableMatrix44 from '../math/MutableMatrix44';
import MutableQuaternion from '../math/MutableQuaternion';
import {ProcessStage} from '../definitions/ProcessStage';
import MutableMatrix33 from '../math/MutableMatrix33';
import MutableVector3 from '../math/MutableVector3';
import {ComponentTID, ComponentSID, EntityUID} from '../../types/CommonTypes';
import {IQuaternion} from '../math/IQuaternion';
import {IMatrix44} from '../math/IMatrix';
import {IVector3} from '../math/IVector';

// import AnimationComponent from './AnimationComponent';

export default class TransformComponent extends Component {
  private _translate: MutableVector3 = MutableVector3.dummy();
  private _rotate: MutableVector3 = MutableVector3.dummy();
  private _scale: MutableVector3 = MutableVector3.dummy();
  private _quaternion: MutableQuaternion = MutableQuaternion.dummy();
  private _matrix: MutableMatrix44 = MutableMatrix44.dummy();
  private _invMatrix: MutableMatrix44 = MutableMatrix44.dummy();
  private _normalMatrix: MutableMatrix33 = MutableMatrix33.dummy();

  private _is_translate_updated: boolean;
  private _is_euler_angles_updated: boolean;
  private _is_scale_updated: boolean;
  private _is_quaternion_updated: boolean;
  private _is_trs_matrix_updated: boolean;
  private _is_inverse_trs_matrix_updated: boolean;
  private _is_normal_trs_matrix_updated: boolean;

  private static __tmpMatrix44_0: MutableMatrix44 = MutableMatrix44.zero();
  private static __tmpVector3_0: MutableVector3 = MutableVector3.zero();
  private static __tmpVector3_1: MutableVector3 = MutableVector3.zero();
  private static __tmpVector3_2: MutableVector3 = MutableVector3.zero();
  private static __tmpQuaternion_0: MutableQuaternion = MutableQuaternion.identity();

  private __toUpdateAllTransform = true;
  private _updateCount = 0;
  private __updateCountAtLastLogic = 0;

  // dependencies
  private _dependentAnimationComponentId = 0;

  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityComponent: EntityRepository
  ) {
    super(entityUid, componentSid, entityComponent);

    const thisClass = TransformComponent;

    this.registerMember(
      BufferUse.CPUGeneric,
      'translate',
      MutableVector3,
      ComponentType.Float,
      [0, 0, 0]
    );
    this.registerMember(
      BufferUse.CPUGeneric,
      'rotate',
      MutableVector3,
      ComponentType.Float,
      [0, 0, 0]
    );
    this.registerMember(
      BufferUse.CPUGeneric,
      'scale',
      MutableVector3,
      ComponentType.Float,
      [1, 1, 1]
    );
    this.registerMember(
      BufferUse.CPUGeneric,
      'quaternion',
      MutableQuaternion,
      ComponentType.Float,
      [0, 0, 0, 1]
    );
    this.registerMember(
      BufferUse.CPUGeneric,
      'matrix',
      MutableMatrix44,
      ComponentType.Float,
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    );
    this.registerMember(
      BufferUse.CPUGeneric,
      'invMatrix',
      MutableMatrix44,
      ComponentType.Float,
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    );
    this.registerMember(
      BufferUse.CPUGeneric,
      'normalMatrix',
      MutableMatrix33,
      ComponentType.Float,
      [1, 0, 0, 0, 1, 0, 0, 0, 1]
    );

    this.submitToAllocation(this.maxNumberOfComponent);

    this._is_translate_updated = true;
    this._is_euler_angles_updated = true;
    this._is_scale_updated = true;
    this._is_quaternion_updated = true;
    this._is_trs_matrix_updated = true;
    this._is_inverse_trs_matrix_updated = true;
    this._is_normal_trs_matrix_updated = true;

    this.moveStageTo(ProcessStage.Logic);
  }

  static get renderedPropertyCount() {
    return null;
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.TransformComponentTID;
  }

  set toUpdateAllTransform(flag: boolean) {
    this.__toUpdateAllTransform = flag;
  }

  get toUpdateAllTransform(): boolean {
    return this.__toUpdateAllTransform;
  }

  _needUpdate() {
    this._updateCount++;
  }

  set translate(vec: IVector3) {
    this._translate.copyComponents(vec);
    this._is_translate_updated = true;
    this._is_trs_matrix_updated = false;
    this._is_inverse_trs_matrix_updated = false;
    this._is_normal_trs_matrix_updated = false;

    this.__updateTransform();
  }

  get translate() {
    return this.translateInner.clone();
  }

  get translateInner() {
    if (this._is_translate_updated) {
      return this._translate;
    } else if (this._is_trs_matrix_updated) {
      this._matrix.getTranslateTo(this._translate);
      this._is_translate_updated = true;
    }
    return this._translate;
  }

  set rotate(vec: IVector3) {
    this._rotate.copyComponents(vec);
    this._is_euler_angles_updated = true;
    this._is_quaternion_updated = false;
    this._is_trs_matrix_updated = false;
    this._is_inverse_trs_matrix_updated = false;
    this._is_normal_trs_matrix_updated = false;

    this.__updateTransform();
  }

  get rotate() {
    return this.rotateInner.clone();
  }

  get rotateInner() {
    if (this._is_euler_angles_updated) {
      return this._rotate;
    } else if (this._is_trs_matrix_updated) {
      this._matrix.toEulerAnglesTo(this._rotate);
    } else if (this._is_quaternion_updated) {
      this._quaternion.toEulerAnglesTo(this._rotate);
    }

    this._is_euler_angles_updated = true;
    return this._rotate;
  }

  set scale(vec: IVector3) {
    this._scale.copyComponents(vec);
    this._is_scale_updated = true;
    this._is_trs_matrix_updated = false;
    this._is_inverse_trs_matrix_updated = false;
    this._is_normal_trs_matrix_updated = false;

    this.__updateTransform();
  }

  get scale() {
    return this.scaleInner.clone();
  }

  get scaleInner() {
    if (this._is_scale_updated) {
      return this._scale;
    } else if (this._is_trs_matrix_updated) {
      this._matrix.getScaleTo(this._scale);
      this._is_scale_updated = true;
    }

    return this._scale;
  }

  set quaternion(quat: IQuaternion) {
    this._quaternion.copyComponents(quat);
    this._is_quaternion_updated = true;
    this._is_euler_angles_updated = false;
    this._is_trs_matrix_updated = false;
    this._is_inverse_trs_matrix_updated = false;
    this._is_normal_trs_matrix_updated = false;

    this.__updateTransform();
  }

  get quaternion() {
    return this.quaternionInner.clone();
  }

  get quaternionInner(): Quaternion {
    if (this._is_quaternion_updated) {
      return this._quaternion;
    } else if (!this._is_quaternion_updated) {
      if (this._is_trs_matrix_updated) {
        this._is_quaternion_updated = true;
        this._quaternion.fromMatrix(this._matrix);
        return this._quaternion;
      } else if (this._is_euler_angles_updated) {
        const rotationMat = TransformComponent.__tmpMatrix44_0.rotate(
          this._rotate
        );
        this._quaternion.fromMatrix(rotationMat);
        this._is_quaternion_updated = true;
        return this._quaternion;
      }
    }
    return this._quaternion;
  }

  set matrix(mat: IMatrix44) {
    this._matrix.copyComponents(mat);
    this._is_trs_matrix_updated = true;
    this._is_translate_updated = false;
    this._is_euler_angles_updated = false;
    this._is_quaternion_updated = false;
    this._is_scale_updated = false;
    this._is_inverse_trs_matrix_updated = false;
    this._is_normal_trs_matrix_updated = false;

    this.__updateTransform();
  }

  get matrix() {
    return this.matrixInner.clone();
  }

  get matrixInner() {
    if (this._is_trs_matrix_updated) {
      return this._matrix;
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

    const q = this.quaternionInner;
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

    const translate = this.translateInner;

    // TranslateMatrix * RotateMatrix * ScaleMatrix
    this._matrix.m00 = m00 * n00;
    this._matrix.m01 = m01 * n11;
    this._matrix.m02 = m02 * n22;
    this._matrix.m03 = translate.x;

    this._matrix.m10 = m10 * n00;
    this._matrix.m11 = m11 * n11;
    this._matrix.m12 = m12 * n22;
    this._matrix.m13 = translate.y;

    this._matrix.m20 = m20 * n00;
    this._matrix.m21 = m21 * n11;
    this._matrix.m22 = m22 * n22;
    this._matrix.m23 = translate.z;

    this._matrix.m30 = 0;
    this._matrix.m31 = 0;
    this._matrix.m32 = 0;
    this._matrix.m33 = 1;

    // const rotateMatrix = new Matrix44(this.quaternion);
    // const matrix = MutableMatrix44.multiply(rotateMatrix, Matrix44.scale(this.scale));
    // matrix.m03 = this.translate.x;
    // matrix.m13 = this.translate.y;
    // matrix.m23 = this.translate.z;

    //this._matrix.copyComponents(matrix);

    this._is_trs_matrix_updated = true;

    return this._matrix;
  }

  get inverseMatrix(): Matrix44 {
    return this.inverseMatrixInner.clone();
  }

  get inverseMatrixInner() {
    if (!this._is_inverse_trs_matrix_updated) {
      MutableMatrix44.invertTo(this.matrixInner, this._invMatrix);
      this._is_inverse_trs_matrix_updated = true;
    }
    return this._invMatrix;
  }

  get normalMatrix() {
    return this.normalMatrixInner.clone();
  }

  get normalMatrixInner() {
    if (!this._is_normal_trs_matrix_updated) {
      const invertedMatrix44 = MutableMatrix44.invertTo(
        this.matrixInner,
        TransformComponent.__tmpMatrix44_0
      );
      const newNormalMatrix = invertedMatrix44.transpose();
      this._normalMatrix.copyComponents(newNormalMatrix);
      this._is_normal_trs_matrix_updated = true;
    }
    return this._normalMatrix;
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
    translate: IVector3,
    rotate: IVector3,
    scale: IVector3,
    quaternion: IQuaternion,
    matrix: IMatrix44
  ) {
    this._is_trs_matrix_updated = false;
    this._is_inverse_trs_matrix_updated = false;
    this._is_normal_trs_matrix_updated = false;

    // Matrix
    if (matrix != null) {
      this._matrix.copyComponents(matrix);
      this._is_trs_matrix_updated = true;
      this._is_translate_updated = false;
      this._is_euler_angles_updated = false;
      this._is_quaternion_updated = false;
      this._is_scale_updated = false;
    }

    // Translate
    if (translate != null) {
      this._translate.copyComponents(translate);
      this._is_translate_updated = true;
    }

    // Rotation
    if (rotate != null && quaternion != null) {
      this._rotate.copyComponents(rotate);
      this._quaternion = new MutableQuaternion(quaternion);
      this._is_euler_angles_updated = true;
      this._is_quaternion_updated = true;
    } else if (rotate != null) {
      this._rotate.copyComponents(rotate);
      this._is_euler_angles_updated = true;
      this._is_quaternion_updated = false;
    } else if (quaternion != null) {
      this._quaternion.copyComponents(quaternion);
      this._is_euler_angles_updated = false;
      this._is_quaternion_updated = true;
    }

    // Scale
    if (scale != null) {
      this._scale.copyComponents(scale);
      this._is_scale_updated = true;
    }

    this.__updateTransform();
  }

  __updateTransform() {
    if (this.__toUpdateAllTransform) {
      this.__updateRotation();
      this.__updateTranslate();
      this.__updateScale();
    }

    //this.__updateMatrix();
    this._needUpdate();
  }

  __updateRotation() {
    if (this._is_euler_angles_updated && !this._is_quaternion_updated) {
      const rotationMat = TransformComponent.__tmpMatrix44_0.rotate(
        this._rotate
      );
      this._quaternion.fromMatrix(rotationMat);
      this._is_quaternion_updated = true;
    } else if (!this._is_euler_angles_updated && this._is_quaternion_updated) {
      this._quaternion.toEulerAnglesTo(this._rotate);
      this._is_euler_angles_updated = true;
    } else if (
      !this._is_euler_angles_updated &&
      !this._is_quaternion_updated &&
      this._is_trs_matrix_updated
    ) {
      this._quaternion.fromMatrix(this._matrix);
      this._is_quaternion_updated = true;
      this._matrix.toEulerAnglesTo(this._rotate);
      this._is_euler_angles_updated = true;
    }
  }

  __updateTranslate() {
    if (!this._is_translate_updated && this._is_trs_matrix_updated) {
      this._matrix.getTranslateTo(this._translate);
      this._is_translate_updated = true;
    }
  }

  __updateScale() {
    if (!this._is_scale_updated && this._is_trs_matrix_updated) {
      this._matrix.getScaleTo(this._scale);
      this._is_scale_updated = true;
    }
  }

  __updateMatrix() {
    if (
      !this._is_trs_matrix_updated &&
      this._is_translate_updated &&
      this._is_quaternion_updated &&
      this._is_scale_updated
    ) {
      const rotationMatrix = this._matrix.fromQuaternion(this._quaternion);
      const scaleMat = TransformComponent.__tmpMatrix44_0.scale(this._scale);
      const rsMatrix = rotationMatrix.multiply(scaleMat); // rsMatrix references to this._matrix
      rsMatrix.putTranslate(this._translate);

      this._is_trs_matrix_updated = true;
    }
  }

  setPropertiesFromJson(arg: JSON) {
    let json = arg;
    if (typeof arg === 'string') {
      json = JSON.parse(arg);
    }
    for (const key in json) {
      if (json.hasOwnProperty(key) && key in this) {
        if (key === 'quaternion') {
          this[key] = new Quaternion((json as any)[key] as Array<number>);
        } else if (key === 'matrix') {
          this[key] = new Matrix44((json as any)[key] as Array<number>);
        } else {
          (this as any)[key] = new Vector3((json as any)[key] as Array<number>);
        }
      }
    }
  }

  setRotationFromNewUpAndFront(UpVec: IVector3, FrontVec: IVector3) {
    const yDir = UpVec;
    const xDir = MutableVector3.crossTo(
      yDir,
      FrontVec,
      TransformComponent.__tmpVector3_0
    );
    const zDir = MutableVector3.crossTo(
      xDir,
      yDir,
      TransformComponent.__tmpVector3_1
    );

    const rotateMatrix = TransformComponent.__tmpMatrix44_0.setComponents(
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
    const fromDir = TransformComponent.__tmpVector3_0
      .copyComponents(fromVec)
      .normalize();
    const toDir = TransformComponent.__tmpVector3_1
      .copyComponents(toVec)
      .normalize();
    const rotationDir = MutableVector3.crossTo(
      fromDir,
      toDir,
      TransformComponent.__tmpVector3_2
    );
    const cosTheta = Vector3.dot(fromDir, toDir);
    const theta = Math.acos(cosTheta);

    this.quaternion = TransformComponent.__tmpQuaternion_0.axisAngle(
      rotationDir,
      theta
    );
  }

  set rotateMatrix44(rotateMatrix: IMatrix44) {
    this.quaternion = TransformComponent.__tmpQuaternion_0.fromMatrix(
      rotateMatrix
    );
  }

  get rotateMatrix44() {
    return new Matrix44(this.quaternion);
  }

  $logic() {
    const sceneGraphComponent = this.entity.getSceneGraph();
    if (this.__updateCountAtLastLogic !== this._updateCount) {
      sceneGraphComponent.setWorldMatrixDirty();
      this.__updateCountAtLastLogic = this._updateCount;
    } else {
      const skeletalComponent = this.entity.getSkeletal();
      if (skeletalComponent != null) {
        sceneGraphComponent.setWorldMatrixDirty();
      }
    }
  }
}

ComponentRepository.registerComponentClass(TransformComponent);
