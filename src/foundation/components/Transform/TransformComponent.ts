import { Quaternion } from '../../math/Quaternion';
import { Matrix44 } from '../../math/Matrix44';
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

  get transform() {
    return this.__pose;
  }

  get transformRest() {
    return this.restOrPose;
  }

  set translate(vec: IVector3) {
    this.__pose.translate = vec;
  }

  /**
   * return a copy of a local translate vector
   */
  get translate() {
    return this.__pose.translate;
  }

  /**
   * return a local translate vector
   */
  get translateInner(): MutableVector3 {
    return this.__pose.translateInner;
  }

  /**
   * return a copy of a local translate vector
   */
  get translateRest() {
    return this.restOrPose.translate;
  }

  /**
   * return a local translate vector
   */
  get translateRestInner(): MutableVector3 {
    return this.restOrPose.translateInner;
  }

  set rotate(vec: IVector3) {
    this.__pose.rotate = vec;
  }

  /**
   * return a copy of a local rotation (XYZ euler) vector
   */
  get rotate() {
    return this.__pose.rotate;
  }

  /**
   * return a local rotation (XYZ euler) vector
   */
  get rotateInner() {
    return this.__pose.rotateInner;
  }

  /**
   * return a copy of a local rotation (XYZ euler) vector
   */
  get rotateRest() {
    return this.restOrPose.rotate;
  }

  /**
   * return a local rotation (XYZ euler) vector
   */
  get rotateRestInner() {
    return this.restOrPose.rotateInner;
  }

  set scale(vec: IVector3) {
    this.__pose.scale = vec;
  }

  /**
   * return a copy of a local scale vector
   */
  get scale() {
    return this.__pose.scale;
  }

  /**
   * return a local scale vector
   */
  get scaleInner() {
    return this.__pose.scaleInner;
  }

  /**
   * return a copy of a local scale vector
   */
  get scaleRest() {
    return this.restOrPose.scale;
  }

  /**
   * return a local scale vector
   */
  get scaleRestInner() {
    return this.restOrPose.scaleInner;
  }

  set quaternion(quat: IQuaternion) {
    this.__pose.quaternion = quat;
  }

  /**
   * return a copy of a local quaternion vector
   */
  get quaternion() {
    return this.__pose.quaternion;
  }

  /**
   * return a local quaternion vector
   */
  get quaternionInner(): Quaternion {
    return this.__pose.quaternionInner;
  }

  /**
   * return a copy of a local quaternion vector
   */
  get quaternionRest() {
    return this.restOrPose.quaternion;
  }

  /**
   * return a local quaternion vector
   */
  get quaternionRestInner(): Quaternion {
    return this.restOrPose.quaternionInner;
  }

  set matrix(mat: IMatrix44) {
    this.__pose.matrix = mat;
  }

  /**
   * return a copy of local transform matrix
   */
  get matrix() {
    return this.__pose.matrix;
  }

  /**
   * return a local transform matrix
   */
  get matrixInner() {
    return this.__pose.matrixInner;
  }

  /**
   * return a copy of local transform matrix
   */
  get matrixRest() {
    return this.restOrPose.matrix;
  }

  /**
   * return a local transform matrix
   */
  get matrixRestInner() {
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
      get translateRest() {
        const transform = this.getTransform();
        return transform.translateRest;
      }
      get translateRestInner() {
        const transform = this.getTransform();
        return transform.translateRestInner;
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
      get scaleRest() {
        const transform = this.getTransform();
        return transform.scaleRest;
      }
      get scaleRestInner() {
        const transform = this.getTransform();
        return transform.scaleRestInner;
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
      get rotateRest() {
        return this.rotateRestInner.clone();
      }
      get rotateRestInner() {
        const transform = this.getTransform();
        return transform.rotateRestInner;
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
      get quaternionRest() {
        return this.quaternionRestInner.clone();
      }
      get quaternionRestInner() {
        const transform = this.getTransform();
        return transform.quaternionRestInner;
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
      get matrixRest() {
        return this.matrixRestInner.clone();
      }
      get matrixRestInner() {
        const transform = this.getTransform();
        return transform.matrixRestInner;
      }
    }
    applyMixins(base, TransformEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}

ComponentRepository.registerComponentClass(TransformComponent);
