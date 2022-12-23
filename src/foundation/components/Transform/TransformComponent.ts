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
import { Is } from '../../misc';
import { SceneGraphComponent } from '../SceneGraph';

export class TransformComponent extends Component {
  private __rest: Transform3D | undefined;
  private __pose = new Transform3D();
  private __updateCountAtLastLogic = 0;
  private __sceneGraphComponent: SceneGraphComponent | undefined;

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository) {
    super(entityUid, componentSid, entityComponent);
    this.moveStageTo(ProcessStage.Create);
  }

  $create() {
    this.__sceneGraphComponent = this.entity.tryToGetSceneGraph();
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
    const sceneGraphComponent = this.entity.tryToGetSceneGraph()!;
    sceneGraphComponent.setWorldMatrixRestDirty();
  }

  _restoreTransformFromRest() {
    if (this.__rest === undefined) {
      return;
    }
    this.__pose.setTransform(
      this.__rest.positionInner,
      MutableVector3.fromCopyVector3(this.__rest.eulerAnglesInner),
      this.__rest.scaleInner,
      MutableQuaternion.fromCopyQuaternion(this.__rest.rotationInner),
      this.__rest.matrixInner
    );
  }

  get localTransform() {
    return this.__pose;
  }

  set localTransform(transform: Transform3D) {
    this.__pose.setTransform(
      transform.positionInner,
      MutableVector3.fromCopyVector3(transform.eulerAnglesInner),
      transform.scaleInner,
      MutableQuaternion.fromCopyQuaternion(transform.rotationInner),
      transform.matrixInner
    );
  }

  get localTransformRest() {
    return this.restOrPose;
  }

  set localTransformRest(transform: Transform3D) {
    if (Is.undefined(this.__rest)) {
      this.__rest = new Transform3D();
    }
    this.__rest.setTransform(
      transform.positionInner,
      MutableVector3.fromCopyVector3(transform.eulerAnglesInner),
      transform.scaleInner,
      MutableQuaternion.fromCopyQuaternion(transform.rotationInner),
      transform.matrixInner
    );
  }

  set localPosition(vec: IVector3) {
    this.__pose.position = vec;
  }

  /**
   * return a copy of a local translate vector
   */
  get localPosition() {
    return this.__pose.position;
  }

  /**
   * return a local translate vector
   */
  get localPositionInner(): MutableVector3 {
    return this.__pose.positionInner;
  }

  /**
   * return a copy of a local translate vector
   */
  get localPositionRest() {
    return this.restOrPose.position;
  }

  /**
   * return a local translate vector
   */
  get localPositionRestInner(): MutableVector3 {
    return this.restOrPose.positionInner;
  }

  set localEulerAngles(vec: IVector3) {
    this.__pose.eulerAngles = vec;
  }

  /**
   * return a copy of a local rotation (XYZ euler) vector
   */
  get localEulerAngles() {
    return this.__pose.eulerAngles;
  }

  /**
   * return a local rotation (XYZ euler) vector
   */
  get localEulerAnglesInner() {
    return this.__pose.eulerAnglesInner;
  }

  /**
   * return a copy of a local rotation (XYZ euler) vector
   */
  get localEulerAnglesRest() {
    return this.restOrPose.eulerAngles;
  }

  /**
   * return a local rotation (XYZ euler) vector
   */
  get localEulerAnglesRestInner() {
    return this.restOrPose.eulerAnglesInner;
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
    this.__pose.rotation = quat;
  }

  /**
   * return a copy of a local quaternion vector
   */
  get localRotation() {
    return this.__pose.rotation;
  }

  /**
   * return a local quaternion vector
   */
  get localRotationInner(): Quaternion {
    return this.__pose.rotationInner;
  }

  /**
   * return a copy of a local quaternion vector
   */
  get localRotationRest() {
    return this.restOrPose.rotation;
  }

  /**
   * return a local quaternion vector
   */
  get localRotationRestInner(): Quaternion {
    return this.restOrPose.rotationInner;
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
    if (this.__updateCountAtLastLogic !== this.__pose.updateCount) {
      this.__sceneGraphComponent!.setWorldMatrixDirty();
      this.__updateCountAtLastLogic = this.__pose.updateCount;
    }
  }

  _shallowCopyFrom(component_: Component): void {
    const component = component_ as TransformComponent;
    this.__pose = component.__pose.clone();
    if (component.__rest != null) {
      this.__rest = component.__rest.clone();
    }
    this.__updateCountAtLastLogic = component.__updateCountAtLastLogic;
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
