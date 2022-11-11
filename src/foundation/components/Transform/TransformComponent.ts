import {Vector3} from '../../math/Vector3';
import {Quaternion} from '../../math/Quaternion';
import {Matrix44} from '../../math/Matrix44';
import {Component} from '../../core/Component';
import {ComponentRepository} from '../../core/ComponentRepository';
import {ComponentType} from '../../definitions/ComponentType';
import {applyMixins, EntityRepository} from '../../core/EntityRepository';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import {BufferUse} from '../../definitions/BufferUse';
import {MutableMatrix44} from '../../math/MutableMatrix44';
import {MutableQuaternion} from '../../math/MutableQuaternion';
import {ProcessStage} from '../../definitions/ProcessStage';
import {MutableMatrix33} from '../../math/MutableMatrix33';
import {MutableVector3} from '../../math/MutableVector3';
import {
  ComponentTID,
  ComponentSID,
  EntityUID,
  Array3,
  Array16,
  Array4,
} from '../../../types/CommonTypes';
import {IQuaternion} from '../../math/IQuaternion';
import {IMatrix44} from '../../math/IMatrix';
import {IVector3} from '../../math/IVector';
import {IEntity} from '../../core/Entity';
import {ComponentToComponentMethods} from '../ComponentTypes';
import {ITransformEntity} from '../../helpers';

// import AnimationComponent from './AnimationComponent';

export class TransformComponent extends Component {
  private _translate: MutableVector3 = MutableVector3.dummy();
  // private _rotate: MutableVector3 = MutableVector3.dummy();
  private _scale: MutableVector3 = MutableVector3.dummy();
  private _quaternion: MutableQuaternion = MutableQuaternion.dummy();
  private _matrix: MutableMatrix44 = MutableMatrix44.dummy();
  private _invMatrix: MutableMatrix44 = MutableMatrix44.dummy();
  private _normalMatrix: MutableMatrix33 = MutableMatrix33.dummy();

  private _is_translate_updated: boolean;
  private _is_scale_updated: boolean;
  private _is_quaternion_updated: boolean;
  private _is_trs_matrix_updated: boolean;
  private _is_inverse_trs_matrix_updated: boolean;
  private _is_normal_trs_matrix_updated: boolean;

  private static __tmpMatrix44_0: MutableMatrix44 = MutableMatrix44.zero();
  private static __tmpVector3_0: MutableVector3 = MutableVector3.zero();
  private static __tmpVector3_1: MutableVector3 = MutableVector3.zero();
  private static __tmpVector3_2: MutableVector3 = MutableVector3.zero();
  private static __tmpQuaternion_0: MutableQuaternion =
    MutableQuaternion.identity();

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

    this.registerMember(
      BufferUse.CPUGeneric,
      'translate',
      MutableVector3,
      ComponentType.Float,
      [0, 0, 0]
    );
    // this.registerMember(
    //   BufferUse.CPUGeneric,
    //   'rotate',
    //   MutableVector3,
    //   ComponentType.Float,
    //   [0, 0, 0]
    // );
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

  /**
   * return a copy of a local translate vector
   */
  get translate() {
    return this.translateInner.clone();
  }

  /**
   * return a local translate vector
   */
  get translateInner(): MutableVector3 {
    if (this._is_translate_updated) {
      return this._translate;
    } else if (this._is_trs_matrix_updated) {
      this._matrix.getTranslateTo(this._translate);
      this._is_translate_updated = true;
    }
    return this._translate;
  }

  set rotate(vec: IVector3) {
    const rotationMat = TransformComponent.__tmpMatrix44_0.rotate(vec);
    this.quaternion = Quaternion.fromMatrix(rotationMat);
  }

  /**
   * return a copy of a local rotation (XYZ euler) vector
   */
  get rotate() {
    return this.rotateInner.clone();
  }

  /**
   * return a local rotation (XYZ euler) vector
   */
  get rotateInner() {
    if (this._is_trs_matrix_updated) {
      return this._matrix.toEulerAngles();
    } else {
      // this._is_quaternion_updated
      return this._quaternion.toEulerAngles();
    }
  }

  set scale(vec: IVector3) {
    this._scale.copyComponents(vec);
    this._is_scale_updated = true;
    this._is_trs_matrix_updated = false;
    this._is_inverse_trs_matrix_updated = false;
    this._is_normal_trs_matrix_updated = false;

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
    this._is_trs_matrix_updated = false;
    this._is_inverse_trs_matrix_updated = false;
    this._is_normal_trs_matrix_updated = false;

    this.__updateTransform();
  }

  /**
   * return a copy of a local quaternion vector
   */
  get quaternion() {
    return this.quaternionInner.clone();
  }

  /**
   * return a local quaternion vector
   */
  get quaternionInner(): Quaternion {
    if (this._is_quaternion_updated) {
      return this._quaternion;
    } else if (!this._is_quaternion_updated) {
      if (this._is_trs_matrix_updated) {
        this._is_quaternion_updated = true;
        this._quaternion.fromMatrix(this._matrix);
        return this._quaternion;
      }
    }
    return this._quaternion;
  }

  set matrix(mat: IMatrix44) {
    this._matrix.copyComponents(mat);
    this._is_trs_matrix_updated = true;
    this._is_translate_updated = false;
    this._is_quaternion_updated = false;
    this._is_scale_updated = false;
    this._is_inverse_trs_matrix_updated = false;
    this._is_normal_trs_matrix_updated = false;

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

  /**
   * return a copy of an inverse local transform matrix
   */
  get inverseMatrix(): Matrix44 {
    return this.inverseMatrixInner.clone();
  }

  /**
   * return an inverse local transform matrix
   */
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
      this._quaternion = MutableQuaternion.fromCopyQuaternion(quaternion);
      this._is_quaternion_updated = true;
    } else if (rotate != null) {
      this._is_quaternion_updated = false;
    } else if (quaternion != null) {
      this._quaternion.copyComponents(quaternion);
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
    this.__updateRotation();
    this.__updateTranslate();
    this.__updateScale();

    //this.__updateMatrix();
    this._needUpdate();
  }

  __updateRotation() {
    if (!this._is_quaternion_updated && this._is_trs_matrix_updated) {
      this._quaternion.fromMatrix(this._matrix);
      this._is_quaternion_updated = true;
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
          this[key] = Quaternion.fromCopyArray4(
            (json as any)[key] as Array4<number>
          );
        } else if (key === 'matrix') {
          this[key] = Matrix44.fromCopyArray16RowMajor(
            (json as any)[key] as Array16<number>
          );
        } else {
          (this as any)[key] = Vector3.fromCopyArray(
            (json as any)[key] as Array3<number>
          );
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
    this.quaternion =
      TransformComponent.__tmpQuaternion_0.fromMatrix(rotateMatrix);
  }

  get rotateMatrix44() {
    return Matrix44.fromCopyQuaternion(this.quaternion);
  }

  $logic() {
    const sceneGraphComponent = this.entity.tryToGetSceneGraph()!;
    if (this.__updateCountAtLastLogic !== this._updateCount) {
      sceneGraphComponent.setWorldMatrixDirty();
      this.__updateCountAtLastLogic = this._updateCount;
    } else {
      const skeletalComponent = this.entity.tryToGetSkeletal();
      if (skeletalComponent != null) {
        sceneGraphComponent.setWorldMatrixDirty();
      }
    }
  }

  /**
   * get the entity which has this component.
   * @returns the entity which has this component
   */
  get entity(): ITransformEntity {
    return EntityRepository.getEntity(
      this.__entityUid
    ) as unknown as ITransformEntity;
  }

  /**
   * @override
   * Add this component to the entity
   * @param base the target entity
   * @param _componentClass the component class to add
   */
  addThisComponentToEntity<
    EntityBase extends IEntity,
    SomeComponentClass extends typeof Component
  >(base: EntityBase, _componentClass: SomeComponentClass) {
    class TransformEntity extends (base.constructor as any) {
      private __transformComponent?: TransformComponent;
      constructor(
        entityUID: EntityUID,
        isAlive: Boolean,
        components?: Map<ComponentTID, Component>
      ) {
        super(entityUID, isAlive, components);
      }

      getTransform() {
        if (this.__transformComponent === undefined) {
          this.__transformComponent = this.getComponentByComponentTID(
            WellKnownComponentTIDs.TransformComponentTID
          ) as TransformComponent;
        }
        return this.__transformComponent;
      }
      set translate(vec: IVector3) {
        const transform = this.getTransform();
        transform.translate = vec;
      }
      get translate() {
        return this.translateInner.clone();
      }
      get translateInner() {
        const transform = this.getTransform();
        return transform.translateInner;
      }
      set scale(vec: IVector3) {
        const transform = this.getTransform();
        transform.scale = vec;
      }
      get scale() {
        return this.scaleInner.clone();
      }
      get scaleInner() {
        const transform = this.getTransform();
        return transform.scaleInner;
      }
      set rotate(vec: IVector3) {
        const transform = this.getTransform();
        transform.rotate = vec;
      }
      get rotate() {
        return this.rotateInner.clone();
      }
      get rotateInner() {
        const transform = this.getTransform();
        return transform.rotateInner;
      }
      set quaternion(quat: IQuaternion) {
        const transform = this.getTransform();
        transform.quaternion = quat;
      }
      get quaternion() {
        return this.quaternionInner.clone();
      }
      get quaternionInner() {
        const transform = this.getTransform();
        return transform.quaternionInner;
      }
      set matrix(mat: IMatrix44) {
        const transform = this.getTransform();
        transform.matrix = mat;
      }
      get matrix() {
        return this.matrixInner.clone();
      }
      get matrixInner() {
        const transform = this.getTransform();
        return transform.matrixInner;
      }
    }
    applyMixins(base, TransformEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> &
      EntityBase;
  }
}

ComponentRepository.registerComponentClass(TransformComponent);
