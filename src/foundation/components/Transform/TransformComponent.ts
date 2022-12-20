import { Quaternion } from '../../math/Quaternion';
import { Component } from '../../core/Component';
import { ComponentRepository } from '../../core/ComponentRepository';
import { applyMixins, EntityRepository } from '../../core/EntityRepository';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';
import { ProcessStage } from '../../definitions/ProcessStage';
import { MutableVector3 } from '../../math/MutableVector3';
import { ComponentTID, ComponentSID, EntityUID } from '../../../types/CommonTypes';
import { IQuaternion } from '../../math/IQuaternion';
import { IMatrix44 } from '../../math/IMatrix';
import { IVector3 } from '../../math/IVector';
import { IEntity } from '../../core/Entity';
import { ComponentToComponentMethods } from '../ComponentTypes';
import { ITransformEntity } from '../../helpers';
import { MutableQuaternion, Transform3D } from '../../math';

// import AnimationComponent from './AnimationComponent';

export class TransformComponent extends Component {
  private __rest: Transform3D | undefined;
  private __pose = new Transform3D();
  private __updateCountAtLastLogic = 0;

  // dependencies
  private _dependentAnimationComponentId = 0;

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository) {
    super(entityUid, componentSid, entityComponent);
    this.moveStageTo(ProcessStage.Logic);
  }

  static get renderedPropertyCount() {
    return null;
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.TransformComponentTID;
  }

  get restOrPose() {
    if (this.__rest !== undefined) {
      return this.__rest;
    } else {
      return this.__pose;
    }
  }

  _backupTransformAsRest() {
    this.__rest = this.__pose.clone();
  }

  _restoreTransformFromRest() {
    if (this.__rest === undefined) {
      return;
    }
    this.__pose.setTransform(
      this.__rest.translateInner,
      MutableVector3.fromCopyVector3(this.__rest.rotateInner),
      this.__rest.scaleInner,
      MutableQuaternion.fromCopyQuaternion(this.__rest.quaternionInner),
      this.__rest.matrixInner
    );
  }

  get localTransform() {
    return this.__pose;
  }

  get localTransformRest() {
    return this.restOrPose;
  }

  set localPosition(vec: IVector3) {
    this.__pose.translate = vec;
  }

  /**
   * return a copy of a local translate vector
   */
  get localPosition() {
    return this.__pose.translate;
  }

  /**
   * return a local translate vector
   */
  get localPositionInner(): MutableVector3 {
    return this.__pose.translateInner;
  }

  /**
   * return a copy of a local translate vector
   */
  get localPositionRest() {
    return this.restOrPose.translate;
  }

  /**
   * return a local translate vector
   */
  get localPositionRestInner(): MutableVector3 {
    return this.restOrPose.translateInner;
  }

  set localEulerAngles(vec: IVector3) {
    this.__pose.rotate = vec;
  }

  /**
   * return a copy of a local rotation (XYZ euler) vector
   */
  get localEulerAngles() {
    return this.__pose.rotate;
  }

  /**
   * return a local rotation (XYZ euler) vector
   */
  get localEulerAnglesInner() {
    return this.__pose.rotateInner;
  }

  /**
   * return a copy of a local rotation (XYZ euler) vector
   */
  get localEulerAnglesRest() {
    return this.restOrPose.rotate;
  }

  /**
   * return a local rotation (XYZ euler) vector
   */
  get localEulerAnglesRestInner() {
    return this.restOrPose.rotateInner;
  }

  set localScale(vec: IVector3) {
    this.__pose.scale = vec;
  }

  /**
   * return a copy of a local scale vector
   */
  get localScale() {
    return this.__pose.scale;
  }

  /**
   * return a local scale vector
   */
  get localScaleInner() {
    return this.__pose.scaleInner;
  }

  /**
   * return a copy of a local scale vector
   */
  get localScaleRest() {
    return this.restOrPose.scale;
  }

  /**
   * return a local scale vector
   */
  get scaleRestInner() {
    return this.restOrPose.scaleInner;
  }

  set localRotation(quat: IQuaternion) {
    this.__pose.quaternion = quat;
  }

  /**
   * return a copy of a local quaternion vector
   */
  get localRotation() {
    return this.__pose.quaternion;
  }

  /**
   * return a local quaternion vector
   */
  get localRotationInner(): Quaternion {
    return this.__pose.quaternionInner;
  }

  /**
   * return a copy of a local quaternion vector
   */
  get localRotationRest() {
    return this.restOrPose.quaternion;
  }

  /**
   * return a local quaternion vector
   */
  get localRotationRestInner(): Quaternion {
    return this.restOrPose.quaternionInner;
  }

  set localMatrix(mat: IMatrix44) {
    this.__pose.matrix = mat;
  }

  /**
   * return a copy of local transform matrix
   */
  get localMatrix() {
    return this.__pose.matrix;
  }

  /**
   * return a local transform matrix
   */
  get localMatrixInner() {
    return this.__pose.matrixInner;
  }

  /**
   * return a copy of local transform matrix
   */
  get localMatrixRest() {
    return this.restOrPose.matrix;
  }

  /**
   * return a local transform matrix
   */
  get localMatrixRestInner() {
    return this.restOrPose.matrixInner;
  }

  $logic() {
    const sceneGraphComponent = this.entity.tryToGetSceneGraph()!;
    if (this.__updateCountAtLastLogic !== this.__pose.updateCount) {
      sceneGraphComponent.setWorldMatrixDirty();
      this.__updateCountAtLastLogic = this.__pose.updateCount;
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
    return EntityRepository.getEntity(this.__entityUid) as unknown as ITransformEntity;
  }

  /**
   * @override
   * Add this component to the entity
   * @param base the target entity
   * @param _componentClass the component class to add
   */
  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class TransformEntity extends (base.constructor as any) {
      private __transformComponent?: TransformComponent;
      constructor(
        entityUID: EntityUID,
        isAlive: boolean,
        components?: Map<ComponentTID, Component>
      ) {
        super(entityUID, isAlive, components);
      }

      getTransform(): TransformComponent {
        if (this.__transformComponent === undefined) {
          this.__transformComponent = this.getComponentByComponentTID(
            WellKnownComponentTIDs.TransformComponentTID
          ) as TransformComponent;
        }
        return this.__transformComponent;
      }
      set localPosition(vec: IVector3) {
        const transform = this.getTransform();
        transform.localPosition = vec;
      }
      get localPosition() {
        return this.localPositionInner.clone();
      }
      get localPositionInner() {
        const transform = this.getTransform();
        return transform.localPositionInner;
      }
      get localPositionRest() {
        const transform = this.getTransform();
        return transform.localPositionRest;
      }
      get localPositionRestInner() {
        const transform = this.getTransform();
        return transform.localPositionRestInner;
      }
      set localScale(vec: IVector3) {
        const transform = this.getTransform();
        transform.localScale = vec;
      }
      get localScale() {
        return this.localScaleInner.clone();
      }
      get localScaleInner() {
        const transform = this.getTransform();
        return transform.localScaleInner;
      }
      get localScaleRest() {
        const transform = this.getTransform();
        return transform.localScaleRest;
      }
      get localScaleRestInner() {
        const transform = this.getTransform();
        return transform.scaleRestInner;
      }
      set localEulerAngles(vec: IVector3) {
        const transform = this.getTransform();
        transform.localEulerAngles = vec;
      }
      get localEulerAngles() {
        return this.localEulerAnglesInner.clone();
      }
      get localEulerAnglesInner() {
        const transform = this.getTransform();
        return transform.localEulerAnglesInner;
      }
      get localEulerAnglesRest() {
        return this.localEulerAnglesRestInner.clone();
      }
      get localEulerAnglesRestInner() {
        const transform = this.getTransform();
        return transform.localEulerAnglesRestInner;
      }
      set localRotation(quat: IQuaternion) {
        const transform = this.getTransform();
        transform.localRotation = quat;
      }
      get localRotation() {
        return this.localRotationInner.clone();
      }
      get localRotationInner() {
        const transform = this.getTransform();
        return transform.localRotationInner;
      }
      get localRotationRest() {
        return this.localQuaternionRestInner.clone();
      }
      get localQuaternionRestInner() {
        const transform = this.getTransform();
        return transform.localRotationRestInner;
      }
      set localMatrix(mat: IMatrix44) {
        const transform = this.getTransform();
        transform.localMatrix = mat;
      }
      get localMatrix() {
        return this.localMatrixInner.clone();
      }
      get localMatrixInner() {
        const transform = this.getTransform();
        return transform.localMatrixInner;
      }
      get localMatrixRest() {
        return this.localMatrixRestInner.clone();
      }
      get localMatrixRestInner() {
        const transform = this.getTransform();
        return transform.localMatrixRestInner;
      }
    }
    applyMixins(base, TransformEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}

ComponentRepository.registerComponentClass(TransformComponent);
