import type { Array3, Array4, ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { EntityRepository, applyMixins } from '../../core/EntityRepository';
import { ProcessStage } from '../../definitions/ProcessStage';
import type { ITransformEntity } from '../../helpers';
import { Matrix44 } from '../../math';
import type { IMatrix44 } from '../../math/IMatrix';
import type { IQuaternion } from '../../math/IQuaternion';
import type { IVector3 } from '../../math/IVector';
import type { MutableMatrix44 } from '../../math/MutableMatrix44';
import { MutableQuaternion } from '../../math/MutableQuaternion';
import type { MutableVector3 } from '../../math/MutableVector3';
import { Quaternion } from '../../math/Quaternion';
import { Transform3D } from '../../math/Transform3D';
import { Vector3 } from '../../math/Vector3';
import { Is } from '../../misc';
import type { Engine } from '../../system/Engine';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

/**
 * TransformComponent is a component that manages the transform of an entity.
 * It handles position, rotation, scale, and transformation matrices for 3D objects.
 * This component provides both current transform state and rest pose functionality.
 */
export class TransformComponent extends Component {
  private __rest: Transform3D | undefined;
  private __pose = new Transform3D();
  private __updateCountAtLastLogic = 0;

  /** Map to store update count per Engine instance for multi-engine support */
  private static __updateCountMap: Map<Engine, number> = new Map();

  /**
   * Gets the number of rendered properties for this component type.
   * @returns null as this component doesn't have rendered properties
   */
  static get renderedPropertyCount() {
    return null;
  }

  /**
   * Gets the component type identifier for TransformComponent.
   * @returns The transform component type ID
   */
  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.TransformComponentTID;
  }

  /**
   * Gets the component type identifier for this instance.
   * @returns The transform component type ID
   */
  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.TransformComponentTID;
  }

  /**
   * Gets the rest transform if available, otherwise returns the current pose.
   * @returns The rest transform or current pose
   */
  get restOrPose() {
    if (this.__rest !== undefined) {
      return this.__rest;
    }
    return this.__pose;
  }

  /**
   * Gets the update counter for transform components of the specified engine.
   * @param engine - The engine instance to get the update count for
   * @returns The current update count for the specified engine
   */
  static getUpdateCount(engine: Engine): number {
    return this.__updateCountMap.get(engine) ?? 0;
  }

  /**
   * Increments the update counter for the specified engine.
   * @param engine - The engine instance to increment the update count for
   * @internal
   */
  private static __incrementUpdateCount(engine: Engine): void {
    const currentCount = this.__updateCountMap.get(engine) ?? 0;
    this.__updateCountMap.set(engine, currentCount + 1);
  }

  /**
   * Backs up the current transform as the rest pose.
   * Creates a rest pose snapshot and marks the scene graph world matrix as dirty.
   * @internal
   */
  _backupTransformAsRest() {
    if (this.__rest === undefined) {
      this.__rest = this.__pose.clone();
      const sceneGraphComponent = this.entity.tryToGetSceneGraph()!;
      sceneGraphComponent.setWorldMatrixRestDirty();
    }
  }

  /**
   * Restores the transform from the previously backed up rest pose.
   * @internal
   */
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

  /**
   * Gets the local transform of this entity.
   * @returns The current local transform
   */
  get localTransform() {
    return this.__pose;
  }

  /**
   * Sets the local transform of this entity.
   * @param transform - The new transform to apply
   */
  set localTransform(transform: Transform3D) {
    this.__pose.setTransform(
      transform.positionInner,
      transform.scaleInner,
      MutableQuaternion.fromCopyQuaternion(transform.rotationInner)
    );
    TransformComponent.__incrementUpdateCount(this.__engine);
  }

  /**
   * Gets the local transform rest pose.
   * @returns The rest pose or current pose if no rest pose is set
   */
  get localTransformRest() {
    return this.restOrPose;
  }

  /**
   * Sets the local transform rest pose.
   * @param transform - The transform to set as rest pose
   */
  set localTransformRest(transform: Transform3D) {
    if (Is.undefined(this.__rest)) {
      this.__rest = new Transform3D();
    }
    this.__rest.setTransform(
      transform.positionInner,
      transform.scaleInner,
      MutableQuaternion.fromCopyQuaternion(transform.rotationInner)
    );
    TransformComponent.__incrementUpdateCount(this.__engine);
  }

  /**
   * Sets the local position of this entity and updates physics if applicable.
   * @param vec - The new position vector
   */
  set localPosition(vec: IVector3) {
    this.__pose.position = vec;
    const sceneGraph = this.entity.tryToGetSceneGraph();
    if (sceneGraph !== undefined && sceneGraph.entity.tryToGetPhysics() !== undefined) {
      const parent = sceneGraph.parent;
      if (parent !== undefined) {
        sceneGraph.setPositionToPhysics(parent.matrixInner.multiplyVector3(vec));
      } else {
        sceneGraph.setPositionToPhysics(vec);
      }
    }
    TransformComponent.__incrementUpdateCount(this.__engine);
  }

  /**
   * Sets the local position without updating physics simulation.
   * @param vec - The new position vector
   */
  set localPositionWithoutPhysics(vec: IVector3) {
    this.__pose.position = vec;
    TransformComponent.__incrementUpdateCount(this.__engine);
  }

  /**
   * Sets the local position using a 3-element array.
   * @param array - Array containing [x, y, z] position values
   */
  setLocalPositionAsArray3(array: Array3<number>) {
    this.__pose.setPositionAsArray3(array);
    TransformComponent.__incrementUpdateCount(this.__engine);
  }

  /**
   * Gets a copy of the local position vector.
   * @returns A copy of the local position
   */
  get localPosition() {
    return this.__pose.position;
  }

  /**
   * Gets the internal mutable local position vector.
   * @returns The internal mutable position vector
   */
  get localPositionInner(): MutableVector3 {
    return this.__pose.positionInner;
  }

  /**
   * Sets the local position as rest pose.
   * @param vec - The position vector to set as rest
   */
  set localPositionRest(vec: IVector3) {
    if (Is.undefined(this.__rest)) {
      this.__rest = this.__pose.clone();
    }
    this.__rest.position = vec;
    TransformComponent.__incrementUpdateCount(this.__engine);
  }

  /**
   * Gets a copy of the local position rest vector.
   * @returns A copy of the rest position
   */
  get localPositionRest() {
    return this.restOrPose.position;
  }

  /**
   * Gets the internal mutable local position rest vector.
   * @returns The internal mutable rest position vector
   */
  get localPositionRestInner(): MutableVector3 {
    return this.restOrPose.positionInner;
  }

  /**
   * Sets the local rotation using Euler angles and updates physics if applicable.
   * @param vec - The Euler angles vector (XYZ order)
   */
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
      if (parent !== undefined && sceneGraph.entity.tryToGetPhysics() !== undefined) {
        sceneGraph.setRotationToPhysics(Quaternion.multiply(parent.rotation, rotation));
      } else {
        sceneGraph.setRotationToPhysics(rotation);
      }
    }
    TransformComponent.__incrementUpdateCount(this.__engine);
  }

  /**
   * Sets the local Euler angles without updating physics simulation.
   * @param vec - The Euler angles vector (XYZ order)
   */
  set localEulerAnglesWithoutPhysics(vec: IVector3) {
    this.__pose.eulerAngles = vec;
    TransformComponent.__incrementUpdateCount(this.__engine);
  }

  /**
   * Gets a copy of the local Euler angles vector.
   * @returns A copy of the local rotation as Euler angles (XYZ order)
   */
  get localEulerAngles() {
    return this.__pose.eulerAngles;
  }

  /**
   * Gets the internal mutable local Euler angles vector.
   * @returns The internal mutable Euler angles vector
   */
  get localEulerAnglesInner() {
    return this.__pose.eulerAnglesInner;
  }

  /**
   * Sets the local Euler angles as rest pose.
   * @param vec - The Euler angles vector to set as rest (XYZ order)
   */
  set localEulerAnglesRest(vec: IVector3) {
    if (Is.undefined(this.__rest)) {
      this.__rest = this.__pose.clone();
    }
    this.__rest.eulerAngles = vec;
    TransformComponent.__incrementUpdateCount(this.__engine);
  }

  /**
   * Gets a copy of the local Euler angles rest vector.
   * @returns A copy of the rest rotation as Euler angles (XYZ order)
   */
  get localEulerAnglesRest() {
    return this.restOrPose.eulerAngles;
  }

  /**
   * Gets the internal mutable local Euler angles rest vector.
   * @returns The internal mutable rest Euler angles vector
   */
  get localEulerAnglesRestInner() {
    return this.restOrPose.eulerAnglesInner;
  }

  /**
   * Sets the local scale and updates physics if applicable.
   * @param vec - The new scale vector
   */
  set localScale(vec: IVector3) {
    this.__pose.scale = vec;

    const sceneGraph = this.entity.tryToGetSceneGraph();
    if (sceneGraph !== undefined && sceneGraph.entity.tryToGetPhysics() !== undefined) {
      const parent = sceneGraph.parent;
      if (parent !== undefined) {
        sceneGraph.setScaleToPhysics(Vector3.multiplyVector(parent.matrixInner.getScale(), vec));
      } else {
        sceneGraph.setScaleToPhysics(vec);
      }
    }
    TransformComponent.__incrementUpdateCount(this.__engine);
  }

  /**
   * Sets the local scale without updating physics simulation.
   * @param vec - The new scale vector
   */
  set localScaleWithoutPhysics(vec: IVector3) {
    this.__pose.scale = vec;
    TransformComponent.__incrementUpdateCount(this.__engine);
  }

  /**
   * Sets the local scale using a 3-element array.
   * @param array - Array containing [x, y, z] scale values
   */
  setLocalScaleAsArray3(array: Array3<number>) {
    this.__pose.setScaleAsArray3(array);
    TransformComponent.__incrementUpdateCount(this.__engine);
  }

  /**
   * Gets a copy of the local scale vector.
   * @returns A copy of the local scale
   */
  get localScale() {
    return this.__pose.scale;
  }

  /**
   * Gets the internal mutable local scale vector.
   * @returns The internal mutable scale vector
   */
  get localScaleInner() {
    return this.__pose.scaleInner;
  }

  /**
   * Sets the local scale as rest pose.
   * @param vec - The scale vector to set as rest
   */
  set localScaleRest(vec: IVector3) {
    if (Is.undefined(this.__rest)) {
      this.__rest = this.__pose.clone();
    }
    this.__rest.scale = vec;
    TransformComponent.__incrementUpdateCount(this.__engine);
  }

  /**
   * Gets a copy of the local scale rest vector.
   * @returns A copy of the rest scale
   */
  get localScaleRest() {
    return this.restOrPose.scale;
  }

  /**
   * Gets the internal mutable local scale rest vector.
   * @returns The internal mutable rest scale vector
   */
  get localScaleRestInner() {
    return this.restOrPose.scaleInner;
  }

  /**
   * Sets the local rotation using a quaternion and updates physics if applicable.
   * @param quat - The new rotation quaternion
   */
  set localRotation(quat: IQuaternion) {
    this.__pose.rotation = quat;
    const sceneGraph = this.entity.tryToGetSceneGraph();
    if (sceneGraph !== undefined && sceneGraph.entity.tryToGetPhysics() !== undefined) {
      const parent = sceneGraph.parent;
      if (parent !== undefined) {
        sceneGraph.setRotationToPhysics(Quaternion.multiply(parent.rotationInner, quat));
      } else {
        sceneGraph.setRotationToPhysics(quat);
      }
    }
    TransformComponent.__incrementUpdateCount(this.__engine);
  }

  /**
   * Sets the local rotation without updating physics simulation.
   * @param quat - The new rotation quaternion
   */
  set localRotationWithoutPhysics(quat: IQuaternion) {
    this.__pose.rotation = quat;
    TransformComponent.__incrementUpdateCount(this.__engine);
  }

  /**
   * Sets the local rotation using a 4-element array.
   * @param array - Array containing [x, y, z, w] quaternion values
   */
  setLocalRotationAsArray4(array: Array4<number>) {
    this.__pose.setRotationAsArray4(array);
    TransformComponent.__incrementUpdateCount(this.__engine);
  }

  /**
   * Gets a copy of the local rotation quaternion.
   * @returns A copy of the local rotation quaternion
   */
  get localRotation() {
    return this.__pose.rotation;
  }

  /**
   * Gets the internal local rotation quaternion.
   * @returns The internal rotation quaternion
   */
  get localRotationInner(): Quaternion {
    return this.__pose.rotationInner;
  }

  /**
   * Sets the local rotation as rest pose.
   * @param quat - The rotation quaternion to set as rest
   */
  set localRotationRest(quat: IQuaternion) {
    if (Is.undefined(this.__rest)) {
      this.__rest = this.__pose.clone();
    }
    this.__rest.rotation = quat;
    TransformComponent.__incrementUpdateCount(this.__engine);
  }

  /**
   * Gets a copy of the local rotation rest quaternion.
   * @returns A copy of the rest rotation quaternion
   */
  get localRotationRest() {
    return this.restOrPose.rotation;
  }

  /**
   * Gets the internal local rotation rest quaternion.
   * @returns The internal rest rotation quaternion
   */
  get localRotationRestInner(): Quaternion {
    return this.restOrPose.rotationInner;
  }

  /**
   * Sets the local transformation matrix.
   * @param mat - The new transformation matrix
   */
  set localMatrix(mat: IMatrix44) {
    this.__pose.matrix = mat;
    const sceneGraph = this.entity.tryToGetSceneGraph();
    if (sceneGraph !== undefined && sceneGraph.entity.tryToGetPhysics() !== undefined) {
      const parent = sceneGraph.parent;
      if (parent !== undefined) {
        sceneGraph.setMatrixToPhysics(Matrix44.multiply(parent.matrix, mat));
      } else {
        sceneGraph.setMatrixToPhysics(mat);
      }
    }
    TransformComponent.__incrementUpdateCount(this.__engine);
  }

  set localMatrixWithoutPhysics(mat: IMatrix44) {
    this.__pose.matrix = mat;
    TransformComponent.__incrementUpdateCount(this.__engine);
  }

  /**
   * Gets a copy of the local transformation matrix.
   * @returns A copy of the local transform matrix
   */
  get localMatrix() {
    return this.__pose.matrix;
  }

  /**
   * Gets the internal local transformation matrix.
   * @returns The internal local transform matrix
   */
  get localMatrixInner() {
    return this.__pose.matrixInner;
  }

  /**
   * Copies the local transformation matrix to the provided matrix object.
   * @param mat - The target matrix to copy the local matrix into
   */
  getLocalMatrixInnerTo(mat: MutableMatrix44) {
    this.__pose.getMatrixInnerTo(mat);
  }

  /**
   * Sets the local transformation matrix as rest pose.
   * @param mat - The transformation matrix to set as rest
   */
  set localMatrixRest(mat: IMatrix44) {
    if (Is.undefined(this.__rest)) {
      this.__rest = this.__pose.clone();
    }
    this.__rest.matrix = mat;
    TransformComponent.__incrementUpdateCount(this.__engine);
  }

  /**
   * Gets a copy of the local transformation matrix rest pose.
   * @returns A copy of the rest transform matrix
   */
  get localMatrixRest() {
    return this.restOrPose.matrix;
  }

  /**
   * Gets the internal local transformation matrix rest pose.
   * @returns The internal rest transform matrix
   */
  get localMatrixRestInner() {
    return this.restOrPose.matrixInner;
  }

  /**
   * Loads the component and moves it to the Logic processing stage.
   * @internal
   */
  $load() {
    this.moveStageTo(ProcessStage.Logic);
  }

  /**
   * Executes logic processing for the component.
   * Checks if the transform has been updated and marks the world matrix as dirty if needed.
   * @internal
   */
  $logic() {
    if (this.__updateCountAtLastLogic !== this.__pose.updateCount) {
      this.entity.tryToGetSceneGraph()!.setWorldMatrixDirty();
      this.__updateCountAtLastLogic = this.__pose.updateCount;
    }
  }

  /**
   * Performs a shallow copy from another TransformComponent.
   * @param component_ - The source component to copy from
   * @internal
   */
  _shallowCopyFrom(component_: Component): void {
    const component = component_ as TransformComponent;
    this.__pose = component.__pose.clone();
    if (component.__rest != null) {
      this.__rest = component.__rest.clone();
    }
    this.__updateCountAtLastLogic = component.__updateCountAtLastLogic;
    TransformComponent.__incrementUpdateCount(this.__engine);
  }

  /**
   * Gets the entity that owns this component.
   * @returns The entity which has this component
   */
  get entity(): ITransformEntity {
    return this.__engine.entityRepository.getEntity(this.__entityUid) as unknown as ITransformEntity;
  }

  /**
   * Destroys the component and cleans up resources.
   * @internal
   */
  _destroy(): void {
    super._destroy();
  }

  /**
   * Adds this component to the specified entity by creating a mixin class.
   * This method extends the entity class with transform-related methods and properties.
   * @param base - The target entity to extend
   * @param _componentClass - The component class to add (not used but required for interface)
   * @returns The extended entity with transform capabilities
   * @template EntityBase - The base entity type
   * @template SomeComponentClass - The component class type
   */
  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class TransformEntity extends (base.constructor as any) {
      private __transformComponent?: TransformComponent;

      /**
       * Gets the transform component for this entity.
       * @returns The transform component instance
       */
      getTransform(): TransformComponent {
        if (this.__transformComponent === undefined) {
          this.__transformComponent = this.getComponentByComponentTID(
            WellKnownComponentTIDs.TransformComponentTID
          ) as TransformComponent;
        }
        return this.__transformComponent;
      }

      /**
       * Sets the local position of this entity.
       * @param vec - The new position vector
       */
      set localPosition(vec: IVector3) {
        const transform = this.getTransform();
        transform.localPosition = vec;
      }

      /**
       * Gets a copy of the local position.
       * @returns A copy of the local position
       */
      get localPosition() {
        return this.localPositionInner.clone();
      }

      /**
       * Gets the internal mutable local position vector.
       * @returns The internal mutable position vector
       */
      get localPositionInner() {
        const transform = this.getTransform();
        return transform.localPositionInner;
      }

      /**
       * Sets the local position as rest pose.
       * @param vec - The position vector to set as rest
       */
      set localPositionRest(vec: IVector3) {
        const transform = this.getTransform();
        transform.localPositionRest = vec;
      }

      /**
       * Gets the local position rest pose.
       * @returns The rest position
       */
      get localPositionRest() {
        const transform = this.getTransform();
        return transform.localPositionRest;
      }

      /**
       * Gets the internal mutable local position rest vector.
       * @returns The internal mutable rest position vector
       */
      get localPositionRestInner() {
        const transform = this.getTransform();
        return transform.localPositionRestInner;
      }

      /**
       * Sets the local scale of this entity.
       * @param vec - The new scale vector
       */
      set localScale(vec: IVector3) {
        const transform = this.getTransform();
        transform.localScale = vec;
      }

      /**
       * Gets a copy of the local scale.
       * @returns A copy of the local scale
       */
      get localScale() {
        return this.localScaleInner.clone();
      }

      /**
       * Gets the internal mutable local scale vector.
       * @returns The internal mutable scale vector
       */
      get localScaleInner() {
        const transform = this.getTransform();
        return transform.localScaleInner;
      }

      /**
       * Sets the local scale as rest pose.
       * @param vec - The scale vector to set as rest
       */
      set localScaleRest(vec: IVector3) {
        const transform = this.getTransform();
        transform.localScaleRest = vec;
      }

      /**
       * Gets the local scale rest pose.
       * @returns The rest scale
       */
      get localScaleRest() {
        const transform = this.getTransform();
        return transform.localScaleRest;
      }

      /**
       * Gets the internal mutable local scale rest vector.
       * @returns The internal mutable rest scale vector
       */
      get localScaleRestInner() {
        const transform = this.getTransform();
        return transform.localScaleRestInner;
      }

      /**
       * Sets the local Euler angles of this entity.
       * @param vec - The Euler angles vector (XYZ order)
       */
      set localEulerAngles(vec: IVector3) {
        const transform = this.getTransform();
        transform.localEulerAngles = vec;
      }

      /**
       * Gets a copy of the local Euler angles.
       * @returns A copy of the local Euler angles
       */
      get localEulerAngles() {
        return this.localEulerAnglesInner.clone();
      }

      /**
       * Gets the internal mutable local Euler angles vector.
       * @returns The internal mutable Euler angles vector
       */
      get localEulerAnglesInner() {
        const transform = this.getTransform();
        return transform.localEulerAnglesInner;
      }

      /**
       * Sets the local Euler angles as rest pose.
       * @param vec - The Euler angles vector to set as rest (XYZ order)
       */
      set localEulerAnglesRest(vec: IVector3) {
        const transform = this.getTransform();
        transform.localEulerAnglesRest = vec;
      }

      /**
       * Gets the local Euler angles rest pose.
       * @returns A copy of the rest Euler angles
       */
      get localEulerAnglesRest() {
        return this.localEulerAnglesRestInner.clone();
      }

      /**
       * Gets the internal mutable local Euler angles rest vector.
       * @returns The internal mutable rest Euler angles vector
       */
      get localEulerAnglesRestInner() {
        const transform = this.getTransform();
        return transform.localEulerAnglesRestInner;
      }

      /**
       * Sets the local rotation using a quaternion.
       * @param quat - The new rotation quaternion
       */
      set localRotation(quat: IQuaternion) {
        const transform = this.getTransform();
        transform.localRotation = quat;
      }

      /**
       * Gets a copy of the local rotation quaternion.
       * @returns A copy of the local rotation
       */
      get localRotation() {
        return this.localRotationInner.clone();
      }

      /**
       * Gets the internal local rotation quaternion.
       * @returns The internal rotation quaternion
       */
      get localRotationInner() {
        const transform = this.getTransform();
        return transform.localRotationInner;
      }

      /**
       * Sets the local rotation as rest pose.
       * @param quat - The rotation quaternion to set as rest
       */
      set localRotationRest(quat: IQuaternion) {
        const transform = this.getTransform();
        transform.localRotationRest = quat;
      }

      /**
       * Gets the local rotation rest pose.
       * @returns A copy of the rest rotation
       */
      get localRotationRest() {
        return this.localQuaternionRestInner.clone();
      }

      /**
       * Gets the internal local rotation rest quaternion.
       * @returns The internal rest rotation quaternion
       */
      get localRotationRestInner() {
        const transform = this.getTransform();
        return transform.localRotationRestInner;
      }

      /**
       * Sets the local transformation matrix.
       * @param mat - The new transformation matrix
       */
      set localMatrix(mat: IMatrix44) {
        const transform = this.getTransform();
        transform.localMatrix = mat;
      }

      /**
       * Gets a copy of the local transformation matrix.
       * @returns A copy of the local matrix
       */
      get localMatrix() {
        return this.localMatrixInner.clone();
      }

      /**
       * Gets the internal local transformation matrix.
       * @returns The internal local matrix
       */
      get localMatrixInner() {
        const transform = this.getTransform();
        return transform.localMatrixInner;
      }

      /**
       * Sets the local transformation matrix as rest pose.
       * @param mat - The transformation matrix to set as rest
       */
      set localMatrixRest(mat: IMatrix44) {
        const transform = this.getTransform();
        transform.localMatrixRest = mat;
      }

      /**
       * Gets the local transformation matrix rest pose.
       * @returns A copy of the rest matrix
       */
      get localMatrixRest() {
        return this.localMatrixRestInner.clone();
      }

      /**
       * Gets the internal local transformation matrix rest pose.
       * @returns The internal rest matrix
       */
      get localMatrixRestInner() {
        const transform = this.getTransform();
        return transform.localMatrixRestInner;
      }
    }
    applyMixins(base, TransformEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}
