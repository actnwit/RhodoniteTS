import { Quaternion } from '../../math/Quaternion';
import { Component } from '../../core/Component';
import { applyMixins, EntityRepository } from '../../core/EntityRepository';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';
import { ProcessStage } from '../../definitions/ProcessStage';
import { MutableVector3 } from '../../math/MutableVector3';
import { ComponentTID, ComponentSID, EntityUID, Array4, Array3 } from '../../../types/CommonTypes';
import { IQuaternion } from '../../math/IQuaternion';
import { IMatrix44 } from '../../math/IMatrix';
import { IVector3 } from '../../math/IVector';
import { IEntity } from '../../core/Entity';
import { ComponentToComponentMethods } from '../ComponentTypes';
import { ITransformEntity } from '../../helpers';
import { Is } from '../../misc';
import { Transform3D } from '../../math/Transform3D';
import { MutableQuaternion } from '../../math/MutableQuaternion';
import { MutableMatrix44 } from '../../math/MutableMatrix44';
import { Vector3 } from '../../math/Vector3';
import { Matrix44 } from '../../math';

/**
 * TransformComponent is a component that manages the transform of an entity.
 *
 */
export class TransformComponent extends Component {
  private __rest: Transform3D | undefined;
  private __pose = new Transform3D();
  private __updateCountAtLastLogic = 0;

  private static __updateCount = 0;

  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityComponent: EntityRepository,
    isReUse: boolean
  ) {
    super(entityUid, componentSid, entityComponent, isReUse);
  }

  static get renderedPropertyCount() {
    return null;
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.TransformComponentTID;
  }

  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.TransformComponentTID;
  }

  get restOrPose() {
    if (this.__rest !== undefined) {
      return this.__rest;
    } else {
      return this.__pose;
    }
  }

  static get updateCount() {
    return this.__updateCount;
  }

  _backupTransformAsRest() {
    if (this.__rest === undefined) {
      this.__rest = this.__pose.clone();
      const sceneGraphComponent = this.entity.tryToGetSceneGraph()!;
      sceneGraphComponent.setWorldMatrixRestDirty();
    }
  }

  _restoreTransformFromRest() {
    if (this.__rest === undefined) {
      return;
    }
    this.__pose.setTransform(
      this.__rest.positionInner,
      this.__rest.scaleInner,
      MutableQuaternion.fromCopyQuaternion(this.__rest.rotationInner)
    );
  }

  get localTransform() {
    return this.__pose;
  }

  set localTransform(transform: Transform3D) {
    this.__pose.setTransform(
      transform.positionInner,
      transform.scaleInner,
      MutableQuaternion.fromCopyQuaternion(transform.rotationInner)
    );
    TransformComponent.__updateCount++;
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
      transform.scaleInner,
      MutableQuaternion.fromCopyQuaternion(transform.rotationInner)
    );
    TransformComponent.__updateCount++;
  }

  set localPosition(vec: IVector3) {
    this.__pose.position = vec;
    const sceneGraph = this.entity.tryToGetSceneGraph();
    if (sceneGraph !== undefined) {
      const parent = sceneGraph.parent;
      if (parent !== undefined) {
        sceneGraph.setPositionToPhysics(parent.matrixInner.multiplyVector3(vec));
      } else {
        sceneGraph.setPositionToPhysics(vec);
      }
    }
    TransformComponent.__updateCount++;
  }

  set localPositionWithoutPhysics(vec: IVector3) {
    this.__pose.position = vec;
    TransformComponent.__updateCount++;
  }

  setLocalPositionAsArray3(array: Array3<number>) {
    this.__pose.setPositionAsArray3(array);
    TransformComponent.__updateCount++;
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
   * set a local translate vector as Rest
   */
  set localPositionRest(vec: IVector3) {
    if (Is.undefined(this.__rest)) {
      this.__rest = this.__pose.clone();
    }
    this.__rest.position = vec;
    TransformComponent.__updateCount++;
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
    const sceneGraph = this.entity.tryToGetSceneGraph();
    if (sceneGraph !== undefined) {
      const sx = Math.sin(vec._v[0] * 0.5);
      const cx = Math.cos(vec._v[0] * 0.5);
      const sy = Math.sin(vec._v[1] * 0.5);
      const cy = Math.cos(vec._v[1] * 0.5);
      const sz = Math.sin(vec._v[2] * 0.5);
      const cz = Math.cos(vec._v[2] * 0.5);

      const rotation = MutableQuaternion.fromCopy4(
        sx * cy * cz - cx * sy * sz,
        cx * sy * cz + sx * cy * sz,
        cx * cy * sz - sx * sy * cz,
        cx * cy * cz + sx * sy * sz
      );
      const parent = sceneGraph.parent;
      if (parent !== undefined) {
        sceneGraph.setRotationToPhysics(Quaternion.multiply(parent.rotation, rotation));
      } else {
        sceneGraph.setRotationToPhysics(rotation);
      }
    }
    TransformComponent.__updateCount++;
  }

  set localEulerAnglesWithoutPhysics(vec: IVector3) {
    this.__pose.eulerAngles = vec;
    TransformComponent.__updateCount++;
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
   * set a local rotation (XYZ euler) vector as Rest
   */
  set localEulerAnglesRest(vec: IVector3) {
    if (Is.undefined(this.__rest)) {
      this.__rest = this.__pose.clone();
    }
    this.__rest.eulerAngles = vec;
    TransformComponent.__updateCount++;
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

    const sceneGraph = this.entity.tryToGetSceneGraph();
    if (sceneGraph !== undefined) {
      const parent = sceneGraph.parent;
      if (parent !== undefined) {
        sceneGraph.setScaleToPhysics(Vector3.multiplyVector(parent.matrixInner.getScale(), vec));
      } else {
        sceneGraph.setScaleToPhysics(vec);
      }
    }
    TransformComponent.__updateCount++;
  }

  set localScaleWithoutPhysics(vec: IVector3) {
    this.__pose.scale = vec;
    TransformComponent.__updateCount++;
  }

  setLocalScaleAsArray3(array: Array3<number>) {
    this.__pose.setScaleAsArray3(array);
    TransformComponent.__updateCount++;
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
   * set a local scale vector as Rest
   */
  set localScaleRest(vec: IVector3) {
    if (Is.undefined(this.__rest)) {
      this.__rest = this.__pose.clone();
    }
    this.__rest.scale = vec;
    TransformComponent.__updateCount++;
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
  get localScaleRestInner() {
    return this.restOrPose.scaleInner;
  }

  set localRotation(quat: IQuaternion) {
    this.__pose.rotation = quat;
    const sceneGraph = this.entity.tryToGetSceneGraph();
    if (sceneGraph !== undefined) {
      const parent = sceneGraph.parent;
      if (parent !== undefined) {
        sceneGraph.setRotationToPhysics(Quaternion.multiply(parent.rotation, quat));
      } else {
        sceneGraph.setRotationToPhysics(quat);
      }
    }
    TransformComponent.__updateCount++;
  }

  set localRotationWithoutPhysics(quat: IQuaternion) {
    this.__pose.rotation = quat;
    TransformComponent.__updateCount++;
  }

  setLocalRotationAsArray4(array: Array4<number>) {
    this.__pose.setRotationAsArray4(array);
    TransformComponent.__updateCount++;
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
   * set a local quaternion vector as Rest
   */
  set localRotationRest(quat: IQuaternion) {
    if (Is.undefined(this.__rest)) {
      this.__rest = this.__pose.clone();
    }
    this.__rest.rotation = quat;
    TransformComponent.__updateCount++;
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
    TransformComponent.__updateCount++;
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

  getLocalMatrixInnerTo(mat: MutableMatrix44) {
    this.__pose.getMatrixInnerTo(mat);
  }

  /**
   * set a local transform matrix as Rest
   */
  set localMatrixRest(mat: IMatrix44) {
    if (Is.undefined(this.__rest)) {
      this.__rest = this.__pose.clone();
    }
    this.__rest.matrix = mat;
    TransformComponent.__updateCount++;
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

  $load() {
    this.moveStageTo(ProcessStage.Logic);
  }

  $logic() {
    if (this.__updateCountAtLastLogic !== this.__pose.updateCount) {
      this.entity.tryToGetSceneGraph()!.setWorldMatrixDirty();
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
    TransformComponent.__updateCount++;
  }

  /**
   * get the entity which has this component.
   * @returns the entity which has this component
   */
  get entity(): ITransformEntity {
    return EntityRepository.getEntity(this.__entityUid) as unknown as ITransformEntity;
  }

  _destroy(): void {
    super._destroy();
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
      set localPositionRest(vec: IVector3) {
        const transform = this.getTransform();
        transform.localPositionRest = vec;
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
      set localScaleRest(vec: IVector3) {
        const transform = this.getTransform();
        transform.localScaleRest = vec;
      }
      get localScaleRest() {
        const transform = this.getTransform();
        return transform.localScaleRest;
      }
      get localScaleRestInner() {
        const transform = this.getTransform();
        return transform.localScaleRestInner;
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
      set localEulerAnglesRest(vec: IVector3) {
        const transform = this.getTransform();
        transform.localEulerAnglesRest = vec;
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
      set localRotationRest(quat: IQuaternion) {
        const transform = this.getTransform();
        transform.localRotationRest = quat;
      }
      get localRotationRest() {
        return this.localQuaternionRestInner.clone();
      }
      get localRotationRestInner() {
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
      set localMatrixRest(mat: IMatrix44) {
        const transform = this.getTransform();
        transform.localMatrixRest = mat;
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
