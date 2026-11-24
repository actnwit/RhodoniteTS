// src/foundation/components/Transform/TransformComponent.ts
import { Component } from "../../core/Component.js";
import { applyMixins } from "../../core/EntityRepository.js";
import { ProcessStage } from "../../definitions/ProcessStage.js";
import { Matrix44 } from "../../math/index.js";
import { MutableQuaternion } from "../../math/MutableQuaternion.js";
import { Quaternion } from "../../math/Quaternion.js";
import { Transform3D } from "../../math/Transform3D.js";
import { Is } from "../../misc/index.js";
import { WellKnownComponentTIDs } from "../WellKnownComponentTIDs.js";
var _TransformComponent = class _TransformComponent extends Component {
  constructor() {
    super(...arguments);
    this.__pose = new Transform3D();
    this.__updateCountAtLastLogic = 0;
  }
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
  static get componentTID() {
    return WellKnownComponentTIDs.TransformComponentTID;
  }
  /**
   * Gets the component type identifier for this instance.
   * @returns The transform component type ID
   */
  get componentTID() {
    return WellKnownComponentTIDs.TransformComponentTID;
  }
  /**
   * Gets the rest transform if available, otherwise returns the current pose.
   * @returns The rest transform or current pose
   */
  get restOrPose() {
    if (this.__rest !== void 0) {
      return this.__rest;
    }
    return this.__pose;
  }
  /**
   * Gets the update counter for transform components of the specified engine.
   * @param engine - The engine instance to get the update count for
   * @returns The current update count for the specified engine
   */
  static getUpdateCount(engine) {
    var _a;
    return (_a = this.__updateCountMap.get(engine)) != null ? _a : 0;
  }
  /**
   * Increments the update counter for the specified engine.
   * @param engine - The engine instance to increment the update count for
   * @internal
   */
  static __incrementUpdateCount(engine) {
    var _a;
    const currentCount = (_a = this.__updateCountMap.get(engine)) != null ? _a : 0;
    this.__updateCountMap.set(engine, currentCount + 1);
  }
  /**
   * Backs up the current transform as the rest pose.
   * Creates a rest pose snapshot and marks the scene graph world matrix as dirty.
   * @internal
   */
  _backupTransformAsRest() {
    if (this.__rest === void 0) {
      this.__rest = this.__pose.clone();
      const sceneGraphComponent = this.entity.tryToGetSceneGraph();
      sceneGraphComponent.setWorldMatrixRestDirty();
    }
  }
  /**
   * Restores the transform from the previously backed up rest pose.
   * @internal
   */
  _restoreTransformFromRest() {
    if (this.__rest === void 0) {
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
  set localTransform(transform) {
    this.__pose.setTransform(
      transform.positionInner,
      transform.scaleInner,
      MutableQuaternion.fromCopyQuaternion(transform.rotationInner)
    );
    _TransformComponent.__incrementUpdateCount(this.__engine);
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
  set localTransformRest(transform) {
    if (Is.undefined(this.__rest)) {
      this.__rest = new Transform3D();
    }
    this.__rest.setTransform(
      transform.positionInner,
      transform.scaleInner,
      MutableQuaternion.fromCopyQuaternion(transform.rotationInner)
    );
    _TransformComponent.__incrementUpdateCount(this.__engine);
  }
  /**
   * Sets the local position of this entity and updates physics if applicable.
   * @param vec - The new position vector
   */
  set localPosition(vec) {
    this.__pose.position = vec;
    const sceneGraph = this.entity.tryToGetSceneGraph();
    if (sceneGraph == null ? void 0 : sceneGraph._hasPhysicsComponentInSubtree) {
      const parent = sceneGraph.parent;
      if (parent !== void 0) {
        sceneGraph.setPositionToPhysics(parent.matrixInner.multiplyVector3(vec));
      } else {
        sceneGraph.setPositionToPhysics(vec);
      }
    }
    _TransformComponent.__incrementUpdateCount(this.__engine);
  }
  /**
   * Sets the local position without updating physics simulation.
   * @param vec - The new position vector
   */
  set localPositionWithoutPhysics(vec) {
    this.__pose.position = vec;
    _TransformComponent.__incrementUpdateCount(this.__engine);
  }
  /**
   * Sets the local position using a 3-element array.
   * @param array - Array containing [x, y, z] position values
   */
  setLocalPositionAsArray3(array) {
    this.__pose.setPositionAsArray3(array);
    _TransformComponent.__incrementUpdateCount(this.__engine);
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
  get localPositionInner() {
    return this.__pose.positionInner;
  }
  /**
   * Sets the local position as rest pose.
   * @param vec - The position vector to set as rest
   */
  set localPositionRest(vec) {
    if (Is.undefined(this.__rest)) {
      this.__rest = this.__pose.clone();
    }
    this.__rest.position = vec;
    _TransformComponent.__incrementUpdateCount(this.__engine);
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
  get localPositionRestInner() {
    return this.restOrPose.positionInner;
  }
  /**
   * Sets the local rotation using Euler angles and updates physics if applicable.
   * @param vec - The Euler angles vector (XYZ order)
   */
  set localEulerAngles(vec) {
    this.__pose.eulerAngles = vec;
    const sceneGraph = this.entity.tryToGetSceneGraph();
    if (sceneGraph == null ? void 0 : sceneGraph._hasPhysicsComponentInSubtree) {
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
      if (parent !== void 0) {
        sceneGraph.setRotationToPhysics(Quaternion.multiply(parent.rotation, rotation));
      } else {
        sceneGraph.setRotationToPhysics(rotation);
      }
    }
    _TransformComponent.__incrementUpdateCount(this.__engine);
  }
  /**
   * Sets the local Euler angles without updating physics simulation.
   * @param vec - The Euler angles vector (XYZ order)
   */
  set localEulerAnglesWithoutPhysics(vec) {
    this.__pose.eulerAngles = vec;
    _TransformComponent.__incrementUpdateCount(this.__engine);
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
  set localEulerAnglesRest(vec) {
    if (Is.undefined(this.__rest)) {
      this.__rest = this.__pose.clone();
    }
    this.__rest.eulerAngles = vec;
    _TransformComponent.__incrementUpdateCount(this.__engine);
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
  set localScale(vec) {
    this.__pose.scale = vec;
    const sceneGraph = this.entity.tryToGetSceneGraph();
    if (sceneGraph == null ? void 0 : sceneGraph._hasPhysicsComponentInSubtree) {
      const parent = sceneGraph.parent;
      const worldMatrix = parent === void 0 ? this.__pose.matrixInner : Matrix44.multiply(parent.matrixInner, this.__pose.matrixInner);
      sceneGraph.setScaleToPhysics(sceneGraph._getPhysicsWorldScale(worldMatrix));
    }
    _TransformComponent.__incrementUpdateCount(this.__engine);
  }
  /**
   * Sets the local scale without updating physics simulation.
   * @param vec - The new scale vector
   */
  set localScaleWithoutPhysics(vec) {
    this.__pose.scale = vec;
    _TransformComponent.__incrementUpdateCount(this.__engine);
  }
  /**
   * Sets the local scale using a 3-element array.
   * @param array - Array containing [x, y, z] scale values
   */
  setLocalScaleAsArray3(array) {
    this.__pose.setScaleAsArray3(array);
    _TransformComponent.__incrementUpdateCount(this.__engine);
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
  set localScaleRest(vec) {
    if (Is.undefined(this.__rest)) {
      this.__rest = this.__pose.clone();
    }
    this.__rest.scale = vec;
    _TransformComponent.__incrementUpdateCount(this.__engine);
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
  set localRotation(quat) {
    this.__pose.rotation = quat;
    const sceneGraph = this.entity.tryToGetSceneGraph();
    if (sceneGraph == null ? void 0 : sceneGraph._hasPhysicsComponentInSubtree) {
      const parent = sceneGraph.parent;
      if (parent !== void 0) {
        sceneGraph.setRotationToPhysics(Quaternion.multiply(parent.rotationInner, quat));
      } else {
        sceneGraph.setRotationToPhysics(quat);
      }
    }
    _TransformComponent.__incrementUpdateCount(this.__engine);
  }
  /**
   * Sets the local rotation without updating physics simulation.
   * @param quat - The new rotation quaternion
   */
  set localRotationWithoutPhysics(quat) {
    this.__pose.rotation = quat;
    _TransformComponent.__incrementUpdateCount(this.__engine);
  }
  /**
   * Sets the local rotation using a 4-element array.
   * @param array - Array containing [x, y, z, w] quaternion values
   */
  setLocalRotationAsArray4(array) {
    this.__pose.setRotationAsArray4(array);
    _TransformComponent.__incrementUpdateCount(this.__engine);
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
  get localRotationInner() {
    return this.__pose.rotationInner;
  }
  /**
   * Sets the local rotation as rest pose.
   * @param quat - The rotation quaternion to set as rest
   */
  set localRotationRest(quat) {
    if (Is.undefined(this.__rest)) {
      this.__rest = this.__pose.clone();
    }
    this.__rest.rotation = quat;
    _TransformComponent.__incrementUpdateCount(this.__engine);
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
  get localRotationRestInner() {
    return this.restOrPose.rotationInner;
  }
  /**
   * Sets the local transformation matrix.
   * @param mat - The new transformation matrix
   */
  set localMatrix(mat) {
    this.__pose.matrix = mat;
    const sceneGraph = this.entity.tryToGetSceneGraph();
    if (sceneGraph == null ? void 0 : sceneGraph._hasPhysicsComponentInSubtree) {
      const parent = sceneGraph.parent;
      if (parent !== void 0) {
        sceneGraph.setMatrixToPhysics(Matrix44.multiply(parent.matrix, mat));
      } else {
        sceneGraph.setMatrixToPhysics(mat);
      }
    }
    _TransformComponent.__incrementUpdateCount(this.__engine);
  }
  set localMatrixWithoutPhysics(mat) {
    this.__pose.matrix = mat;
    _TransformComponent.__incrementUpdateCount(this.__engine);
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
  getLocalMatrixInnerTo(mat) {
    this.__pose.getMatrixInnerTo(mat);
  }
  /**
   * Sets the local transformation matrix as rest pose.
   * @param mat - The transformation matrix to set as rest
   */
  set localMatrixRest(mat) {
    if (Is.undefined(this.__rest)) {
      this.__rest = this.__pose.clone();
    }
    this.__rest.matrix = mat;
    _TransformComponent.__incrementUpdateCount(this.__engine);
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
      this.entity.tryToGetSceneGraph().setWorldMatrixDirty();
      this.__updateCountAtLastLogic = this.__pose.updateCount;
    }
  }
  /**
   * Performs a shallow copy from another TransformComponent.
   * @param component_ - The source component to copy from
   * @internal
   */
  _shallowCopyFrom(component_) {
    const component = component_;
    this.__pose = component.__pose.clone();
    if (component.__rest != null) {
      this.__rest = component.__rest.clone();
    }
    this.__updateCountAtLastLogic = component.__updateCountAtLastLogic;
    _TransformComponent.__incrementUpdateCount(this.__engine);
  }
  /**
   * Gets the entity that owns this component.
   * @returns The entity which has this component
   */
  get entity() {
    return this.__engine.entityRepository.getEntity(this.__entityUid);
  }
  /**
   * Destroys the component and cleans up resources.
   * @internal
   */
  _destroy() {
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
  addThisComponentToEntity(base, _componentClass) {
    class TransformEntity extends base.constructor {
      /**
       * Gets the transform component for this entity.
       * @returns The transform component instance
       */
      getTransform() {
        if (this.__transformComponent === void 0) {
          this.__transformComponent = this.getComponentByComponentTID(
            WellKnownComponentTIDs.TransformComponentTID
          );
        }
        return this.__transformComponent;
      }
      /**
       * Sets the local position of this entity.
       * @param vec - The new position vector
       */
      set localPosition(vec) {
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
      set localPositionRest(vec) {
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
      set localScale(vec) {
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
      set localScaleRest(vec) {
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
      set localEulerAngles(vec) {
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
      set localEulerAnglesRest(vec) {
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
      set localRotation(quat) {
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
      set localRotationRest(quat) {
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
      set localMatrix(mat) {
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
      set localMatrixRest(mat) {
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
    return base;
  }
  /**
   * Cleans up static resources associated with the specified engine.
   * @param engine - The engine instance to clean up resources for
   * @internal
   */
  static _cleanupForEngine(engine) {
    _TransformComponent.__updateCountMap.delete(engine);
  }
};
/** Map to store update count per Engine instance for multi-engine support */
_TransformComponent.__updateCountMap = /* @__PURE__ */ new Map();
var TransformComponent = _TransformComponent;
export {
  TransformComponent
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29tcG9uZW50cy9UcmFuc2Zvcm0vVHJhbnNmb3JtQ29tcG9uZW50LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IEFycmF5MywgQXJyYXk0LCBDb21wb25lbnRUSUQgfSBmcm9tICcuLi8uLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuLi8uLi9jb3JlL0NvbXBvbmVudCc7XG5pbXBvcnQgdHlwZSB7IElFbnRpdHkgfSBmcm9tICcuLi8uLi9jb3JlL0VudGl0eSc7XG5pbXBvcnQgeyBhcHBseU1peGlucyB9IGZyb20gJy4uLy4uL2NvcmUvRW50aXR5UmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBQcm9jZXNzU3RhZ2UgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Qcm9jZXNzU3RhZ2UnO1xuaW1wb3J0IHR5cGUgeyBJVHJhbnNmb3JtRW50aXR5IH0gZnJvbSAnLi4vLi4vaGVscGVycyc7XG5pbXBvcnQgeyBNYXRyaXg0NCB9IGZyb20gJy4uLy4uL21hdGgnO1xuaW1wb3J0IHR5cGUgeyBJTWF0cml4NDQgfSBmcm9tICcuLi8uLi9tYXRoL0lNYXRyaXgnO1xuaW1wb3J0IHR5cGUgeyBJUXVhdGVybmlvbiB9IGZyb20gJy4uLy4uL21hdGgvSVF1YXRlcm5pb24nO1xuaW1wb3J0IHR5cGUgeyBJVmVjdG9yMyB9IGZyb20gJy4uLy4uL21hdGgvSVZlY3Rvcic7XG5pbXBvcnQgdHlwZSB7IE11dGFibGVNYXRyaXg0NCB9IGZyb20gJy4uLy4uL21hdGgvTXV0YWJsZU1hdHJpeDQ0JztcbmltcG9ydCB7IE11dGFibGVRdWF0ZXJuaW9uIH0gZnJvbSAnLi4vLi4vbWF0aC9NdXRhYmxlUXVhdGVybmlvbic7XG5pbXBvcnQgdHlwZSB7IE11dGFibGVWZWN0b3IzIH0gZnJvbSAnLi4vLi4vbWF0aC9NdXRhYmxlVmVjdG9yMyc7XG5pbXBvcnQgeyBRdWF0ZXJuaW9uIH0gZnJvbSAnLi4vLi4vbWF0aC9RdWF0ZXJuaW9uJztcbmltcG9ydCB7IFRyYW5zZm9ybTNEIH0gZnJvbSAnLi4vLi4vbWF0aC9UcmFuc2Zvcm0zRCc7XG5pbXBvcnQgeyBJcyB9IGZyb20gJy4uLy4uL21pc2MnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi8uLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB0eXBlIHsgQ29tcG9uZW50VG9Db21wb25lbnRNZXRob2RzIH0gZnJvbSAnLi4vQ29tcG9uZW50VHlwZXMnO1xuaW1wb3J0IHsgV2VsbEtub3duQ29tcG9uZW50VElEcyB9IGZyb20gJy4uL1dlbGxLbm93bkNvbXBvbmVudFRJRHMnO1xuXG4vKipcbiAqIFRyYW5zZm9ybUNvbXBvbmVudCBpcyBhIGNvbXBvbmVudCB0aGF0IG1hbmFnZXMgdGhlIHRyYW5zZm9ybSBvZiBhbiBlbnRpdHkuXG4gKiBJdCBoYW5kbGVzIHBvc2l0aW9uLCByb3RhdGlvbiwgc2NhbGUsIGFuZCB0cmFuc2Zvcm1hdGlvbiBtYXRyaWNlcyBmb3IgM0Qgb2JqZWN0cy5cbiAqIFRoaXMgY29tcG9uZW50IHByb3ZpZGVzIGJvdGggY3VycmVudCB0cmFuc2Zvcm0gc3RhdGUgYW5kIHJlc3QgcG9zZSBmdW5jdGlvbmFsaXR5LlxuICovXG5leHBvcnQgY2xhc3MgVHJhbnNmb3JtQ29tcG9uZW50IGV4dGVuZHMgQ29tcG9uZW50IHtcbiAgcHJpdmF0ZSBfX3Jlc3Q6IFRyYW5zZm9ybTNEIHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIF9fcG9zZSA9IG5ldyBUcmFuc2Zvcm0zRCgpO1xuICBwcml2YXRlIF9fdXBkYXRlQ291bnRBdExhc3RMb2dpYyA9IDA7XG5cbiAgLyoqIE1hcCB0byBzdG9yZSB1cGRhdGUgY291bnQgcGVyIEVuZ2luZSBpbnN0YW5jZSBmb3IgbXVsdGktZW5naW5lIHN1cHBvcnQgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX191cGRhdGVDb3VudE1hcDogTWFwPEVuZ2luZSwgbnVtYmVyPiA9IG5ldyBNYXAoKTtcblxuICAvKipcbiAgICogR2V0cyB0aGUgbnVtYmVyIG9mIHJlbmRlcmVkIHByb3BlcnRpZXMgZm9yIHRoaXMgY29tcG9uZW50IHR5cGUuXG4gICAqIEByZXR1cm5zIG51bGwgYXMgdGhpcyBjb21wb25lbnQgZG9lc24ndCBoYXZlIHJlbmRlcmVkIHByb3BlcnRpZXNcbiAgICovXG4gIHN0YXRpYyBnZXQgcmVuZGVyZWRQcm9wZXJ0eUNvdW50KCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNvbXBvbmVudCB0eXBlIGlkZW50aWZpZXIgZm9yIFRyYW5zZm9ybUNvbXBvbmVudC5cbiAgICogQHJldHVybnMgVGhlIHRyYW5zZm9ybSBjb21wb25lbnQgdHlwZSBJRFxuICAgKi9cbiAgc3RhdGljIGdldCBjb21wb25lbnRUSUQoKSB7XG4gICAgcmV0dXJuIFdlbGxLbm93bkNvbXBvbmVudFRJRHMuVHJhbnNmb3JtQ29tcG9uZW50VElEO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNvbXBvbmVudCB0eXBlIGlkZW50aWZpZXIgZm9yIHRoaXMgaW5zdGFuY2UuXG4gICAqIEByZXR1cm5zIFRoZSB0cmFuc2Zvcm0gY29tcG9uZW50IHR5cGUgSURcbiAgICovXG4gIGdldCBjb21wb25lbnRUSUQoKTogQ29tcG9uZW50VElEIHtcbiAgICByZXR1cm4gV2VsbEtub3duQ29tcG9uZW50VElEcy5UcmFuc2Zvcm1Db21wb25lbnRUSUQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcmVzdCB0cmFuc2Zvcm0gaWYgYXZhaWxhYmxlLCBvdGhlcndpc2UgcmV0dXJucyB0aGUgY3VycmVudCBwb3NlLlxuICAgKiBAcmV0dXJucyBUaGUgcmVzdCB0cmFuc2Zvcm0gb3IgY3VycmVudCBwb3NlXG4gICAqL1xuICBnZXQgcmVzdE9yUG9zZSgpIHtcbiAgICBpZiAodGhpcy5fX3Jlc3QgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMuX19yZXN0O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX3Bvc2U7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdXBkYXRlIGNvdW50ZXIgZm9yIHRyYW5zZm9ybSBjb21wb25lbnRzIG9mIHRoZSBzcGVjaWZpZWQgZW5naW5lLlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZSB0byBnZXQgdGhlIHVwZGF0ZSBjb3VudCBmb3JcbiAgICogQHJldHVybnMgVGhlIGN1cnJlbnQgdXBkYXRlIGNvdW50IGZvciB0aGUgc3BlY2lmaWVkIGVuZ2luZVxuICAgKi9cbiAgc3RhdGljIGdldFVwZGF0ZUNvdW50KGVuZ2luZTogRW5naW5lKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fX3VwZGF0ZUNvdW50TWFwLmdldChlbmdpbmUpID8/IDA7XG4gIH1cblxuICAvKipcbiAgICogSW5jcmVtZW50cyB0aGUgdXBkYXRlIGNvdW50ZXIgZm9yIHRoZSBzcGVjaWZpZWQgZW5naW5lLlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZSB0byBpbmNyZW1lbnQgdGhlIHVwZGF0ZSBjb3VudCBmb3JcbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2luY3JlbWVudFVwZGF0ZUNvdW50KGVuZ2luZTogRW5naW5lKTogdm9pZCB7XG4gICAgY29uc3QgY3VycmVudENvdW50ID0gdGhpcy5fX3VwZGF0ZUNvdW50TWFwLmdldChlbmdpbmUpID8/IDA7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50TWFwLnNldChlbmdpbmUsIGN1cnJlbnRDb3VudCArIDEpO1xuICB9XG5cbiAgLyoqXG4gICAqIEJhY2tzIHVwIHRoZSBjdXJyZW50IHRyYW5zZm9ybSBhcyB0aGUgcmVzdCBwb3NlLlxuICAgKiBDcmVhdGVzIGEgcmVzdCBwb3NlIHNuYXBzaG90IGFuZCBtYXJrcyB0aGUgc2NlbmUgZ3JhcGggd29ybGQgbWF0cml4IGFzIGRpcnR5LlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9iYWNrdXBUcmFuc2Zvcm1Bc1Jlc3QoKSB7XG4gICAgaWYgKHRoaXMuX19yZXN0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuX19yZXN0ID0gdGhpcy5fX3Bvc2UuY2xvbmUoKTtcbiAgICAgIGNvbnN0IHNjZW5lR3JhcGhDb21wb25lbnQgPSB0aGlzLmVudGl0eS50cnlUb0dldFNjZW5lR3JhcGgoKSE7XG4gICAgICBzY2VuZUdyYXBoQ29tcG9uZW50LnNldFdvcmxkTWF0cml4UmVzdERpcnR5KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlc3RvcmVzIHRoZSB0cmFuc2Zvcm0gZnJvbSB0aGUgcHJldmlvdXNseSBiYWNrZWQgdXAgcmVzdCBwb3NlLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9yZXN0b3JlVHJhbnNmb3JtRnJvbVJlc3QoKSB7XG4gICAgaWYgKHRoaXMuX19yZXN0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fX3Bvc2Uuc2V0VHJhbnNmb3JtKFxuICAgICAgdGhpcy5fX3Jlc3QucG9zaXRpb25Jbm5lcixcbiAgICAgIHRoaXMuX19yZXN0LnNjYWxlSW5uZXIsXG4gICAgICBNdXRhYmxlUXVhdGVybmlvbi5mcm9tQ29weVF1YXRlcm5pb24odGhpcy5fX3Jlc3Qucm90YXRpb25Jbm5lcilcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGxvY2FsIHRyYW5zZm9ybSBvZiB0aGlzIGVudGl0eS5cbiAgICogQHJldHVybnMgVGhlIGN1cnJlbnQgbG9jYWwgdHJhbnNmb3JtXG4gICAqL1xuICBnZXQgbG9jYWxUcmFuc2Zvcm0oKSB7XG4gICAgcmV0dXJuIHRoaXMuX19wb3NlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGxvY2FsIHRyYW5zZm9ybSBvZiB0aGlzIGVudGl0eS5cbiAgICogQHBhcmFtIHRyYW5zZm9ybSAtIFRoZSBuZXcgdHJhbnNmb3JtIHRvIGFwcGx5XG4gICAqL1xuICBzZXQgbG9jYWxUcmFuc2Zvcm0odHJhbnNmb3JtOiBUcmFuc2Zvcm0zRCkge1xuICAgIHRoaXMuX19wb3NlLnNldFRyYW5zZm9ybShcbiAgICAgIHRyYW5zZm9ybS5wb3NpdGlvbklubmVyLFxuICAgICAgdHJhbnNmb3JtLnNjYWxlSW5uZXIsXG4gICAgICBNdXRhYmxlUXVhdGVybmlvbi5mcm9tQ29weVF1YXRlcm5pb24odHJhbnNmb3JtLnJvdGF0aW9uSW5uZXIpXG4gICAgKTtcbiAgICBUcmFuc2Zvcm1Db21wb25lbnQuX19pbmNyZW1lbnRVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBsb2NhbCB0cmFuc2Zvcm0gcmVzdCBwb3NlLlxuICAgKiBAcmV0dXJucyBUaGUgcmVzdCBwb3NlIG9yIGN1cnJlbnQgcG9zZSBpZiBubyByZXN0IHBvc2UgaXMgc2V0XG4gICAqL1xuICBnZXQgbG9jYWxUcmFuc2Zvcm1SZXN0KCkge1xuICAgIHJldHVybiB0aGlzLnJlc3RPclBvc2U7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbG9jYWwgdHJhbnNmb3JtIHJlc3QgcG9zZS5cbiAgICogQHBhcmFtIHRyYW5zZm9ybSAtIFRoZSB0cmFuc2Zvcm0gdG8gc2V0IGFzIHJlc3QgcG9zZVxuICAgKi9cbiAgc2V0IGxvY2FsVHJhbnNmb3JtUmVzdCh0cmFuc2Zvcm06IFRyYW5zZm9ybTNEKSB7XG4gICAgaWYgKElzLnVuZGVmaW5lZCh0aGlzLl9fcmVzdCkpIHtcbiAgICAgIHRoaXMuX19yZXN0ID0gbmV3IFRyYW5zZm9ybTNEKCk7XG4gICAgfVxuICAgIHRoaXMuX19yZXN0LnNldFRyYW5zZm9ybShcbiAgICAgIHRyYW5zZm9ybS5wb3NpdGlvbklubmVyLFxuICAgICAgdHJhbnNmb3JtLnNjYWxlSW5uZXIsXG4gICAgICBNdXRhYmxlUXVhdGVybmlvbi5mcm9tQ29weVF1YXRlcm5pb24odHJhbnNmb3JtLnJvdGF0aW9uSW5uZXIpXG4gICAgKTtcbiAgICBUcmFuc2Zvcm1Db21wb25lbnQuX19pbmNyZW1lbnRVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBsb2NhbCBwb3NpdGlvbiBvZiB0aGlzIGVudGl0eSBhbmQgdXBkYXRlcyBwaHlzaWNzIGlmIGFwcGxpY2FibGUuXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgbmV3IHBvc2l0aW9uIHZlY3RvclxuICAgKi9cbiAgc2V0IGxvY2FsUG9zaXRpb24odmVjOiBJVmVjdG9yMykge1xuICAgIHRoaXMuX19wb3NlLnBvc2l0aW9uID0gdmVjO1xuICAgIGNvbnN0IHNjZW5lR3JhcGggPSB0aGlzLmVudGl0eS50cnlUb0dldFNjZW5lR3JhcGgoKTtcbiAgICBpZiAoc2NlbmVHcmFwaD8uX2hhc1BoeXNpY3NDb21wb25lbnRJblN1YnRyZWUpIHtcbiAgICAgIGNvbnN0IHBhcmVudCA9IHNjZW5lR3JhcGgucGFyZW50O1xuICAgICAgaWYgKHBhcmVudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHNjZW5lR3JhcGguc2V0UG9zaXRpb25Ub1BoeXNpY3MocGFyZW50Lm1hdHJpeElubmVyLm11bHRpcGx5VmVjdG9yMyh2ZWMpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNjZW5lR3JhcGguc2V0UG9zaXRpb25Ub1BoeXNpY3ModmVjKTtcbiAgICAgIH1cbiAgICB9XG4gICAgVHJhbnNmb3JtQ29tcG9uZW50Ll9faW5jcmVtZW50VXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbG9jYWwgcG9zaXRpb24gd2l0aG91dCB1cGRhdGluZyBwaHlzaWNzIHNpbXVsYXRpb24uXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgbmV3IHBvc2l0aW9uIHZlY3RvclxuICAgKi9cbiAgc2V0IGxvY2FsUG9zaXRpb25XaXRob3V0UGh5c2ljcyh2ZWM6IElWZWN0b3IzKSB7XG4gICAgdGhpcy5fX3Bvc2UucG9zaXRpb24gPSB2ZWM7XG4gICAgVHJhbnNmb3JtQ29tcG9uZW50Ll9faW5jcmVtZW50VXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbG9jYWwgcG9zaXRpb24gdXNpbmcgYSAzLWVsZW1lbnQgYXJyYXkuXG4gICAqIEBwYXJhbSBhcnJheSAtIEFycmF5IGNvbnRhaW5pbmcgW3gsIHksIHpdIHBvc2l0aW9uIHZhbHVlc1xuICAgKi9cbiAgc2V0TG9jYWxQb3NpdGlvbkFzQXJyYXkzKGFycmF5OiBBcnJheTM8bnVtYmVyPikge1xuICAgIHRoaXMuX19wb3NlLnNldFBvc2l0aW9uQXNBcnJheTMoYXJyYXkpO1xuICAgIFRyYW5zZm9ybUNvbXBvbmVudC5fX2luY3JlbWVudFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSBjb3B5IG9mIHRoZSBsb2NhbCBwb3NpdGlvbiB2ZWN0b3IuXG4gICAqIEByZXR1cm5zIEEgY29weSBvZiB0aGUgbG9jYWwgcG9zaXRpb25cbiAgICovXG4gIGdldCBsb2NhbFBvc2l0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9fcG9zZS5wb3NpdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpbnRlcm5hbCBtdXRhYmxlIGxvY2FsIHBvc2l0aW9uIHZlY3Rvci5cbiAgICogQHJldHVybnMgVGhlIGludGVybmFsIG11dGFibGUgcG9zaXRpb24gdmVjdG9yXG4gICAqL1xuICBnZXQgbG9jYWxQb3NpdGlvbklubmVyKCk6IE11dGFibGVWZWN0b3IzIHtcbiAgICByZXR1cm4gdGhpcy5fX3Bvc2UucG9zaXRpb25Jbm5lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBsb2NhbCBwb3NpdGlvbiBhcyByZXN0IHBvc2UuXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgcG9zaXRpb24gdmVjdG9yIHRvIHNldCBhcyByZXN0XG4gICAqL1xuICBzZXQgbG9jYWxQb3NpdGlvblJlc3QodmVjOiBJVmVjdG9yMykge1xuICAgIGlmIChJcy51bmRlZmluZWQodGhpcy5fX3Jlc3QpKSB7XG4gICAgICB0aGlzLl9fcmVzdCA9IHRoaXMuX19wb3NlLmNsb25lKCk7XG4gICAgfVxuICAgIHRoaXMuX19yZXN0LnBvc2l0aW9uID0gdmVjO1xuICAgIFRyYW5zZm9ybUNvbXBvbmVudC5fX2luY3JlbWVudFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSBjb3B5IG9mIHRoZSBsb2NhbCBwb3NpdGlvbiByZXN0IHZlY3Rvci5cbiAgICogQHJldHVybnMgQSBjb3B5IG9mIHRoZSByZXN0IHBvc2l0aW9uXG4gICAqL1xuICBnZXQgbG9jYWxQb3NpdGlvblJlc3QoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVzdE9yUG9zZS5wb3NpdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpbnRlcm5hbCBtdXRhYmxlIGxvY2FsIHBvc2l0aW9uIHJlc3QgdmVjdG9yLlxuICAgKiBAcmV0dXJucyBUaGUgaW50ZXJuYWwgbXV0YWJsZSByZXN0IHBvc2l0aW9uIHZlY3RvclxuICAgKi9cbiAgZ2V0IGxvY2FsUG9zaXRpb25SZXN0SW5uZXIoKTogTXV0YWJsZVZlY3RvcjMge1xuICAgIHJldHVybiB0aGlzLnJlc3RPclBvc2UucG9zaXRpb25Jbm5lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBsb2NhbCByb3RhdGlvbiB1c2luZyBFdWxlciBhbmdsZXMgYW5kIHVwZGF0ZXMgcGh5c2ljcyBpZiBhcHBsaWNhYmxlLlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIEV1bGVyIGFuZ2xlcyB2ZWN0b3IgKFhZWiBvcmRlcilcbiAgICovXG4gIHNldCBsb2NhbEV1bGVyQW5nbGVzKHZlYzogSVZlY3RvcjMpIHtcbiAgICB0aGlzLl9fcG9zZS5ldWxlckFuZ2xlcyA9IHZlYztcbiAgICBjb25zdCBzY2VuZUdyYXBoID0gdGhpcy5lbnRpdHkudHJ5VG9HZXRTY2VuZUdyYXBoKCk7XG4gICAgaWYgKHNjZW5lR3JhcGg/Ll9oYXNQaHlzaWNzQ29tcG9uZW50SW5TdWJ0cmVlKSB7XG4gICAgICBjb25zdCBzeCA9IE1hdGguc2luKHZlYy5fdlswXSAqIDAuNSk7XG4gICAgICBjb25zdCBjeCA9IE1hdGguY29zKHZlYy5fdlswXSAqIDAuNSk7XG4gICAgICBjb25zdCBzeSA9IE1hdGguc2luKHZlYy5fdlsxXSAqIDAuNSk7XG4gICAgICBjb25zdCBjeSA9IE1hdGguY29zKHZlYy5fdlsxXSAqIDAuNSk7XG4gICAgICBjb25zdCBzeiA9IE1hdGguc2luKHZlYy5fdlsyXSAqIDAuNSk7XG4gICAgICBjb25zdCBjeiA9IE1hdGguY29zKHZlYy5fdlsyXSAqIDAuNSk7XG5cbiAgICAgIGNvbnN0IHJvdGF0aW9uID0gTXV0YWJsZVF1YXRlcm5pb24uZnJvbUNvcHk0KFxuICAgICAgICBzeCAqIGN5ICogY3ogLSBjeCAqIHN5ICogc3osXG4gICAgICAgIGN4ICogc3kgKiBjeiArIHN4ICogY3kgKiBzeixcbiAgICAgICAgY3ggKiBjeSAqIHN6IC0gc3ggKiBzeSAqIGN6LFxuICAgICAgICBjeCAqIGN5ICogY3ogKyBzeCAqIHN5ICogc3pcbiAgICAgICk7XG4gICAgICBjb25zdCBwYXJlbnQgPSBzY2VuZUdyYXBoLnBhcmVudDtcbiAgICAgIGlmIChwYXJlbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBzY2VuZUdyYXBoLnNldFJvdGF0aW9uVG9QaHlzaWNzKFF1YXRlcm5pb24ubXVsdGlwbHkocGFyZW50LnJvdGF0aW9uLCByb3RhdGlvbikpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2NlbmVHcmFwaC5zZXRSb3RhdGlvblRvUGh5c2ljcyhyb3RhdGlvbik7XG4gICAgICB9XG4gICAgfVxuICAgIFRyYW5zZm9ybUNvbXBvbmVudC5fX2luY3JlbWVudFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGxvY2FsIEV1bGVyIGFuZ2xlcyB3aXRob3V0IHVwZGF0aW5nIHBoeXNpY3Mgc2ltdWxhdGlvbi5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSBFdWxlciBhbmdsZXMgdmVjdG9yIChYWVogb3JkZXIpXG4gICAqL1xuICBzZXQgbG9jYWxFdWxlckFuZ2xlc1dpdGhvdXRQaHlzaWNzKHZlYzogSVZlY3RvcjMpIHtcbiAgICB0aGlzLl9fcG9zZS5ldWxlckFuZ2xlcyA9IHZlYztcbiAgICBUcmFuc2Zvcm1Db21wb25lbnQuX19pbmNyZW1lbnRVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgY29weSBvZiB0aGUgbG9jYWwgRXVsZXIgYW5nbGVzIHZlY3Rvci5cbiAgICogQHJldHVybnMgQSBjb3B5IG9mIHRoZSBsb2NhbCByb3RhdGlvbiBhcyBFdWxlciBhbmdsZXMgKFhZWiBvcmRlcilcbiAgICovXG4gIGdldCBsb2NhbEV1bGVyQW5nbGVzKCkge1xuICAgIHJldHVybiB0aGlzLl9fcG9zZS5ldWxlckFuZ2xlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpbnRlcm5hbCBtdXRhYmxlIGxvY2FsIEV1bGVyIGFuZ2xlcyB2ZWN0b3IuXG4gICAqIEByZXR1cm5zIFRoZSBpbnRlcm5hbCBtdXRhYmxlIEV1bGVyIGFuZ2xlcyB2ZWN0b3JcbiAgICovXG4gIGdldCBsb2NhbEV1bGVyQW5nbGVzSW5uZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19wb3NlLmV1bGVyQW5nbGVzSW5uZXI7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbG9jYWwgRXVsZXIgYW5nbGVzIGFzIHJlc3QgcG9zZS5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSBFdWxlciBhbmdsZXMgdmVjdG9yIHRvIHNldCBhcyByZXN0IChYWVogb3JkZXIpXG4gICAqL1xuICBzZXQgbG9jYWxFdWxlckFuZ2xlc1Jlc3QodmVjOiBJVmVjdG9yMykge1xuICAgIGlmIChJcy51bmRlZmluZWQodGhpcy5fX3Jlc3QpKSB7XG4gICAgICB0aGlzLl9fcmVzdCA9IHRoaXMuX19wb3NlLmNsb25lKCk7XG4gICAgfVxuICAgIHRoaXMuX19yZXN0LmV1bGVyQW5nbGVzID0gdmVjO1xuICAgIFRyYW5zZm9ybUNvbXBvbmVudC5fX2luY3JlbWVudFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSBjb3B5IG9mIHRoZSBsb2NhbCBFdWxlciBhbmdsZXMgcmVzdCB2ZWN0b3IuXG4gICAqIEByZXR1cm5zIEEgY29weSBvZiB0aGUgcmVzdCByb3RhdGlvbiBhcyBFdWxlciBhbmdsZXMgKFhZWiBvcmRlcilcbiAgICovXG4gIGdldCBsb2NhbEV1bGVyQW5nbGVzUmVzdCgpIHtcbiAgICByZXR1cm4gdGhpcy5yZXN0T3JQb3NlLmV1bGVyQW5nbGVzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGludGVybmFsIG11dGFibGUgbG9jYWwgRXVsZXIgYW5nbGVzIHJlc3QgdmVjdG9yLlxuICAgKiBAcmV0dXJucyBUaGUgaW50ZXJuYWwgbXV0YWJsZSByZXN0IEV1bGVyIGFuZ2xlcyB2ZWN0b3JcbiAgICovXG4gIGdldCBsb2NhbEV1bGVyQW5nbGVzUmVzdElubmVyKCkge1xuICAgIHJldHVybiB0aGlzLnJlc3RPclBvc2UuZXVsZXJBbmdsZXNJbm5lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBsb2NhbCBzY2FsZSBhbmQgdXBkYXRlcyBwaHlzaWNzIGlmIGFwcGxpY2FibGUuXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgbmV3IHNjYWxlIHZlY3RvclxuICAgKi9cbiAgc2V0IGxvY2FsU2NhbGUodmVjOiBJVmVjdG9yMykge1xuICAgIHRoaXMuX19wb3NlLnNjYWxlID0gdmVjO1xuXG4gICAgY29uc3Qgc2NlbmVHcmFwaCA9IHRoaXMuZW50aXR5LnRyeVRvR2V0U2NlbmVHcmFwaCgpO1xuICAgIGlmIChzY2VuZUdyYXBoPy5faGFzUGh5c2ljc0NvbXBvbmVudEluU3VidHJlZSkge1xuICAgICAgY29uc3QgcGFyZW50ID0gc2NlbmVHcmFwaC5wYXJlbnQ7XG4gICAgICBjb25zdCB3b3JsZE1hdHJpeCA9XG4gICAgICAgIHBhcmVudCA9PT0gdW5kZWZpbmVkID8gdGhpcy5fX3Bvc2UubWF0cml4SW5uZXIgOiBNYXRyaXg0NC5tdWx0aXBseShwYXJlbnQubWF0cml4SW5uZXIsIHRoaXMuX19wb3NlLm1hdHJpeElubmVyKTtcbiAgICAgIHNjZW5lR3JhcGguc2V0U2NhbGVUb1BoeXNpY3Moc2NlbmVHcmFwaC5fZ2V0UGh5c2ljc1dvcmxkU2NhbGUod29ybGRNYXRyaXgpKTtcbiAgICB9XG4gICAgVHJhbnNmb3JtQ29tcG9uZW50Ll9faW5jcmVtZW50VXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbG9jYWwgc2NhbGUgd2l0aG91dCB1cGRhdGluZyBwaHlzaWNzIHNpbXVsYXRpb24uXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgbmV3IHNjYWxlIHZlY3RvclxuICAgKi9cbiAgc2V0IGxvY2FsU2NhbGVXaXRob3V0UGh5c2ljcyh2ZWM6IElWZWN0b3IzKSB7XG4gICAgdGhpcy5fX3Bvc2Uuc2NhbGUgPSB2ZWM7XG4gICAgVHJhbnNmb3JtQ29tcG9uZW50Ll9faW5jcmVtZW50VXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbG9jYWwgc2NhbGUgdXNpbmcgYSAzLWVsZW1lbnQgYXJyYXkuXG4gICAqIEBwYXJhbSBhcnJheSAtIEFycmF5IGNvbnRhaW5pbmcgW3gsIHksIHpdIHNjYWxlIHZhbHVlc1xuICAgKi9cbiAgc2V0TG9jYWxTY2FsZUFzQXJyYXkzKGFycmF5OiBBcnJheTM8bnVtYmVyPikge1xuICAgIHRoaXMuX19wb3NlLnNldFNjYWxlQXNBcnJheTMoYXJyYXkpO1xuICAgIFRyYW5zZm9ybUNvbXBvbmVudC5fX2luY3JlbWVudFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSBjb3B5IG9mIHRoZSBsb2NhbCBzY2FsZSB2ZWN0b3IuXG4gICAqIEByZXR1cm5zIEEgY29weSBvZiB0aGUgbG9jYWwgc2NhbGVcbiAgICovXG4gIGdldCBsb2NhbFNjYWxlKCkge1xuICAgIHJldHVybiB0aGlzLl9fcG9zZS5zY2FsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpbnRlcm5hbCBtdXRhYmxlIGxvY2FsIHNjYWxlIHZlY3Rvci5cbiAgICogQHJldHVybnMgVGhlIGludGVybmFsIG11dGFibGUgc2NhbGUgdmVjdG9yXG4gICAqL1xuICBnZXQgbG9jYWxTY2FsZUlubmVyKCkge1xuICAgIHJldHVybiB0aGlzLl9fcG9zZS5zY2FsZUlubmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGxvY2FsIHNjYWxlIGFzIHJlc3QgcG9zZS5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSBzY2FsZSB2ZWN0b3IgdG8gc2V0IGFzIHJlc3RcbiAgICovXG4gIHNldCBsb2NhbFNjYWxlUmVzdCh2ZWM6IElWZWN0b3IzKSB7XG4gICAgaWYgKElzLnVuZGVmaW5lZCh0aGlzLl9fcmVzdCkpIHtcbiAgICAgIHRoaXMuX19yZXN0ID0gdGhpcy5fX3Bvc2UuY2xvbmUoKTtcbiAgICB9XG4gICAgdGhpcy5fX3Jlc3Quc2NhbGUgPSB2ZWM7XG4gICAgVHJhbnNmb3JtQ29tcG9uZW50Ll9faW5jcmVtZW50VXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIGNvcHkgb2YgdGhlIGxvY2FsIHNjYWxlIHJlc3QgdmVjdG9yLlxuICAgKiBAcmV0dXJucyBBIGNvcHkgb2YgdGhlIHJlc3Qgc2NhbGVcbiAgICovXG4gIGdldCBsb2NhbFNjYWxlUmVzdCgpIHtcbiAgICByZXR1cm4gdGhpcy5yZXN0T3JQb3NlLnNjYWxlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGludGVybmFsIG11dGFibGUgbG9jYWwgc2NhbGUgcmVzdCB2ZWN0b3IuXG4gICAqIEByZXR1cm5zIFRoZSBpbnRlcm5hbCBtdXRhYmxlIHJlc3Qgc2NhbGUgdmVjdG9yXG4gICAqL1xuICBnZXQgbG9jYWxTY2FsZVJlc3RJbm5lcigpIHtcbiAgICByZXR1cm4gdGhpcy5yZXN0T3JQb3NlLnNjYWxlSW5uZXI7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbG9jYWwgcm90YXRpb24gdXNpbmcgYSBxdWF0ZXJuaW9uIGFuZCB1cGRhdGVzIHBoeXNpY3MgaWYgYXBwbGljYWJsZS5cbiAgICogQHBhcmFtIHF1YXQgLSBUaGUgbmV3IHJvdGF0aW9uIHF1YXRlcm5pb25cbiAgICovXG4gIHNldCBsb2NhbFJvdGF0aW9uKHF1YXQ6IElRdWF0ZXJuaW9uKSB7XG4gICAgdGhpcy5fX3Bvc2Uucm90YXRpb24gPSBxdWF0O1xuICAgIGNvbnN0IHNjZW5lR3JhcGggPSB0aGlzLmVudGl0eS50cnlUb0dldFNjZW5lR3JhcGgoKTtcbiAgICBpZiAoc2NlbmVHcmFwaD8uX2hhc1BoeXNpY3NDb21wb25lbnRJblN1YnRyZWUpIHtcbiAgICAgIGNvbnN0IHBhcmVudCA9IHNjZW5lR3JhcGgucGFyZW50O1xuICAgICAgaWYgKHBhcmVudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHNjZW5lR3JhcGguc2V0Um90YXRpb25Ub1BoeXNpY3MoUXVhdGVybmlvbi5tdWx0aXBseShwYXJlbnQucm90YXRpb25Jbm5lciwgcXVhdCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2NlbmVHcmFwaC5zZXRSb3RhdGlvblRvUGh5c2ljcyhxdWF0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgVHJhbnNmb3JtQ29tcG9uZW50Ll9faW5jcmVtZW50VXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbG9jYWwgcm90YXRpb24gd2l0aG91dCB1cGRhdGluZyBwaHlzaWNzIHNpbXVsYXRpb24uXG4gICAqIEBwYXJhbSBxdWF0IC0gVGhlIG5ldyByb3RhdGlvbiBxdWF0ZXJuaW9uXG4gICAqL1xuICBzZXQgbG9jYWxSb3RhdGlvbldpdGhvdXRQaHlzaWNzKHF1YXQ6IElRdWF0ZXJuaW9uKSB7XG4gICAgdGhpcy5fX3Bvc2Uucm90YXRpb24gPSBxdWF0O1xuICAgIFRyYW5zZm9ybUNvbXBvbmVudC5fX2luY3JlbWVudFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGxvY2FsIHJvdGF0aW9uIHVzaW5nIGEgNC1lbGVtZW50IGFycmF5LlxuICAgKiBAcGFyYW0gYXJyYXkgLSBBcnJheSBjb250YWluaW5nIFt4LCB5LCB6LCB3XSBxdWF0ZXJuaW9uIHZhbHVlc1xuICAgKi9cbiAgc2V0TG9jYWxSb3RhdGlvbkFzQXJyYXk0KGFycmF5OiBBcnJheTQ8bnVtYmVyPikge1xuICAgIHRoaXMuX19wb3NlLnNldFJvdGF0aW9uQXNBcnJheTQoYXJyYXkpO1xuICAgIFRyYW5zZm9ybUNvbXBvbmVudC5fX2luY3JlbWVudFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSBjb3B5IG9mIHRoZSBsb2NhbCByb3RhdGlvbiBxdWF0ZXJuaW9uLlxuICAgKiBAcmV0dXJucyBBIGNvcHkgb2YgdGhlIGxvY2FsIHJvdGF0aW9uIHF1YXRlcm5pb25cbiAgICovXG4gIGdldCBsb2NhbFJvdGF0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9fcG9zZS5yb3RhdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpbnRlcm5hbCBsb2NhbCByb3RhdGlvbiBxdWF0ZXJuaW9uLlxuICAgKiBAcmV0dXJucyBUaGUgaW50ZXJuYWwgcm90YXRpb24gcXVhdGVybmlvblxuICAgKi9cbiAgZ2V0IGxvY2FsUm90YXRpb25Jbm5lcigpOiBRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gdGhpcy5fX3Bvc2Uucm90YXRpb25Jbm5lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBsb2NhbCByb3RhdGlvbiBhcyByZXN0IHBvc2UuXG4gICAqIEBwYXJhbSBxdWF0IC0gVGhlIHJvdGF0aW9uIHF1YXRlcm5pb24gdG8gc2V0IGFzIHJlc3RcbiAgICovXG4gIHNldCBsb2NhbFJvdGF0aW9uUmVzdChxdWF0OiBJUXVhdGVybmlvbikge1xuICAgIGlmIChJcy51bmRlZmluZWQodGhpcy5fX3Jlc3QpKSB7XG4gICAgICB0aGlzLl9fcmVzdCA9IHRoaXMuX19wb3NlLmNsb25lKCk7XG4gICAgfVxuICAgIHRoaXMuX19yZXN0LnJvdGF0aW9uID0gcXVhdDtcbiAgICBUcmFuc2Zvcm1Db21wb25lbnQuX19pbmNyZW1lbnRVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgY29weSBvZiB0aGUgbG9jYWwgcm90YXRpb24gcmVzdCBxdWF0ZXJuaW9uLlxuICAgKiBAcmV0dXJucyBBIGNvcHkgb2YgdGhlIHJlc3Qgcm90YXRpb24gcXVhdGVybmlvblxuICAgKi9cbiAgZ2V0IGxvY2FsUm90YXRpb25SZXN0KCkge1xuICAgIHJldHVybiB0aGlzLnJlc3RPclBvc2Uucm90YXRpb247XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW50ZXJuYWwgbG9jYWwgcm90YXRpb24gcmVzdCBxdWF0ZXJuaW9uLlxuICAgKiBAcmV0dXJucyBUaGUgaW50ZXJuYWwgcmVzdCByb3RhdGlvbiBxdWF0ZXJuaW9uXG4gICAqL1xuICBnZXQgbG9jYWxSb3RhdGlvblJlc3RJbm5lcigpOiBRdWF0ZXJuaW9uIHtcbiAgICByZXR1cm4gdGhpcy5yZXN0T3JQb3NlLnJvdGF0aW9uSW5uZXI7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbG9jYWwgdHJhbnNmb3JtYXRpb24gbWF0cml4LlxuICAgKiBAcGFyYW0gbWF0IC0gVGhlIG5ldyB0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcbiAgICovXG4gIHNldCBsb2NhbE1hdHJpeChtYXQ6IElNYXRyaXg0NCkge1xuICAgIHRoaXMuX19wb3NlLm1hdHJpeCA9IG1hdDtcbiAgICBjb25zdCBzY2VuZUdyYXBoID0gdGhpcy5lbnRpdHkudHJ5VG9HZXRTY2VuZUdyYXBoKCk7XG4gICAgaWYgKHNjZW5lR3JhcGg/Ll9oYXNQaHlzaWNzQ29tcG9uZW50SW5TdWJ0cmVlKSB7XG4gICAgICBjb25zdCBwYXJlbnQgPSBzY2VuZUdyYXBoLnBhcmVudDtcbiAgICAgIGlmIChwYXJlbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBzY2VuZUdyYXBoLnNldE1hdHJpeFRvUGh5c2ljcyhNYXRyaXg0NC5tdWx0aXBseShwYXJlbnQubWF0cml4LCBtYXQpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNjZW5lR3JhcGguc2V0TWF0cml4VG9QaHlzaWNzKG1hdCk7XG4gICAgICB9XG4gICAgfVxuICAgIFRyYW5zZm9ybUNvbXBvbmVudC5fX2luY3JlbWVudFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpO1xuICB9XG5cbiAgc2V0IGxvY2FsTWF0cml4V2l0aG91dFBoeXNpY3MobWF0OiBJTWF0cml4NDQpIHtcbiAgICB0aGlzLl9fcG9zZS5tYXRyaXggPSBtYXQ7XG4gICAgVHJhbnNmb3JtQ29tcG9uZW50Ll9faW5jcmVtZW50VXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIGNvcHkgb2YgdGhlIGxvY2FsIHRyYW5zZm9ybWF0aW9uIG1hdHJpeC5cbiAgICogQHJldHVybnMgQSBjb3B5IG9mIHRoZSBsb2NhbCB0cmFuc2Zvcm0gbWF0cml4XG4gICAqL1xuICBnZXQgbG9jYWxNYXRyaXgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19wb3NlLm1hdHJpeDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpbnRlcm5hbCBsb2NhbCB0cmFuc2Zvcm1hdGlvbiBtYXRyaXguXG4gICAqIEByZXR1cm5zIFRoZSBpbnRlcm5hbCBsb2NhbCB0cmFuc2Zvcm0gbWF0cml4XG4gICAqL1xuICBnZXQgbG9jYWxNYXRyaXhJbm5lcigpIHtcbiAgICByZXR1cm4gdGhpcy5fX3Bvc2UubWF0cml4SW5uZXI7XG4gIH1cblxuICAvKipcbiAgICogQ29waWVzIHRoZSBsb2NhbCB0cmFuc2Zvcm1hdGlvbiBtYXRyaXggdG8gdGhlIHByb3ZpZGVkIG1hdHJpeCBvYmplY3QuXG4gICAqIEBwYXJhbSBtYXQgLSBUaGUgdGFyZ2V0IG1hdHJpeCB0byBjb3B5IHRoZSBsb2NhbCBtYXRyaXggaW50b1xuICAgKi9cbiAgZ2V0TG9jYWxNYXRyaXhJbm5lclRvKG1hdDogTXV0YWJsZU1hdHJpeDQ0KSB7XG4gICAgdGhpcy5fX3Bvc2UuZ2V0TWF0cml4SW5uZXJUbyhtYXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGxvY2FsIHRyYW5zZm9ybWF0aW9uIG1hdHJpeCBhcyByZXN0IHBvc2UuXG4gICAqIEBwYXJhbSBtYXQgLSBUaGUgdHJhbnNmb3JtYXRpb24gbWF0cml4IHRvIHNldCBhcyByZXN0XG4gICAqL1xuICBzZXQgbG9jYWxNYXRyaXhSZXN0KG1hdDogSU1hdHJpeDQ0KSB7XG4gICAgaWYgKElzLnVuZGVmaW5lZCh0aGlzLl9fcmVzdCkpIHtcbiAgICAgIHRoaXMuX19yZXN0ID0gdGhpcy5fX3Bvc2UuY2xvbmUoKTtcbiAgICB9XG4gICAgdGhpcy5fX3Jlc3QubWF0cml4ID0gbWF0O1xuICAgIFRyYW5zZm9ybUNvbXBvbmVudC5fX2luY3JlbWVudFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSBjb3B5IG9mIHRoZSBsb2NhbCB0cmFuc2Zvcm1hdGlvbiBtYXRyaXggcmVzdCBwb3NlLlxuICAgKiBAcmV0dXJucyBBIGNvcHkgb2YgdGhlIHJlc3QgdHJhbnNmb3JtIG1hdHJpeFxuICAgKi9cbiAgZ2V0IGxvY2FsTWF0cml4UmVzdCgpIHtcbiAgICByZXR1cm4gdGhpcy5yZXN0T3JQb3NlLm1hdHJpeDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpbnRlcm5hbCBsb2NhbCB0cmFuc2Zvcm1hdGlvbiBtYXRyaXggcmVzdCBwb3NlLlxuICAgKiBAcmV0dXJucyBUaGUgaW50ZXJuYWwgcmVzdCB0cmFuc2Zvcm0gbWF0cml4XG4gICAqL1xuICBnZXQgbG9jYWxNYXRyaXhSZXN0SW5uZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVzdE9yUG9zZS5tYXRyaXhJbm5lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyB0aGUgY29tcG9uZW50IGFuZCBtb3ZlcyBpdCB0byB0aGUgTG9naWMgcHJvY2Vzc2luZyBzdGFnZS5cbiAgICogQGludGVybmFsXG4gICAqL1xuICAkbG9hZCgpIHtcbiAgICB0aGlzLm1vdmVTdGFnZVRvKFByb2Nlc3NTdGFnZS5Mb2dpYyk7XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZXMgbG9naWMgcHJvY2Vzc2luZyBmb3IgdGhlIGNvbXBvbmVudC5cbiAgICogQ2hlY2tzIGlmIHRoZSB0cmFuc2Zvcm0gaGFzIGJlZW4gdXBkYXRlZCBhbmQgbWFya3MgdGhlIHdvcmxkIG1hdHJpeCBhcyBkaXJ0eSBpZiBuZWVkZWQuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgJGxvZ2ljKCkge1xuICAgIGlmICh0aGlzLl9fdXBkYXRlQ291bnRBdExhc3RMb2dpYyAhPT0gdGhpcy5fX3Bvc2UudXBkYXRlQ291bnQpIHtcbiAgICAgIHRoaXMuZW50aXR5LnRyeVRvR2V0U2NlbmVHcmFwaCgpIS5zZXRXb3JsZE1hdHJpeERpcnR5KCk7XG4gICAgICB0aGlzLl9fdXBkYXRlQ291bnRBdExhc3RMb2dpYyA9IHRoaXMuX19wb3NlLnVwZGF0ZUNvdW50O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtcyBhIHNoYWxsb3cgY29weSBmcm9tIGFub3RoZXIgVHJhbnNmb3JtQ29tcG9uZW50LlxuICAgKiBAcGFyYW0gY29tcG9uZW50XyAtIFRoZSBzb3VyY2UgY29tcG9uZW50IHRvIGNvcHkgZnJvbVxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9zaGFsbG93Q29weUZyb20oY29tcG9uZW50XzogQ29tcG9uZW50KTogdm9pZCB7XG4gICAgY29uc3QgY29tcG9uZW50ID0gY29tcG9uZW50XyBhcyBUcmFuc2Zvcm1Db21wb25lbnQ7XG4gICAgdGhpcy5fX3Bvc2UgPSBjb21wb25lbnQuX19wb3NlLmNsb25lKCk7XG4gICAgaWYgKGNvbXBvbmVudC5fX3Jlc3QgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fX3Jlc3QgPSBjb21wb25lbnQuX19yZXN0LmNsb25lKCk7XG4gICAgfVxuICAgIHRoaXMuX191cGRhdGVDb3VudEF0TGFzdExvZ2ljID0gY29tcG9uZW50Ll9fdXBkYXRlQ291bnRBdExhc3RMb2dpYztcbiAgICBUcmFuc2Zvcm1Db21wb25lbnQuX19pbmNyZW1lbnRVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBlbnRpdHkgdGhhdCBvd25zIHRoaXMgY29tcG9uZW50LlxuICAgKiBAcmV0dXJucyBUaGUgZW50aXR5IHdoaWNoIGhhcyB0aGlzIGNvbXBvbmVudFxuICAgKi9cbiAgZ2V0IGVudGl0eSgpOiBJVHJhbnNmb3JtRW50aXR5IHtcbiAgICByZXR1cm4gdGhpcy5fX2VuZ2luZS5lbnRpdHlSZXBvc2l0b3J5LmdldEVudGl0eSh0aGlzLl9fZW50aXR5VWlkKSBhcyB1bmtub3duIGFzIElUcmFuc2Zvcm1FbnRpdHk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIGNvbXBvbmVudCBhbmQgY2xlYW5zIHVwIHJlc291cmNlcy5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBfZGVzdHJveSgpOiB2b2lkIHtcbiAgICBzdXBlci5fZGVzdHJveSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGhpcyBjb21wb25lbnQgdG8gdGhlIHNwZWNpZmllZCBlbnRpdHkgYnkgY3JlYXRpbmcgYSBtaXhpbiBjbGFzcy5cbiAgICogVGhpcyBtZXRob2QgZXh0ZW5kcyB0aGUgZW50aXR5IGNsYXNzIHdpdGggdHJhbnNmb3JtLXJlbGF0ZWQgbWV0aG9kcyBhbmQgcHJvcGVydGllcy5cbiAgICogQHBhcmFtIGJhc2UgLSBUaGUgdGFyZ2V0IGVudGl0eSB0byBleHRlbmRcbiAgICogQHBhcmFtIF9jb21wb25lbnRDbGFzcyAtIFRoZSBjb21wb25lbnQgY2xhc3MgdG8gYWRkIChub3QgdXNlZCBidXQgcmVxdWlyZWQgZm9yIGludGVyZmFjZSlcbiAgICogQHJldHVybnMgVGhlIGV4dGVuZGVkIGVudGl0eSB3aXRoIHRyYW5zZm9ybSBjYXBhYmlsaXRpZXNcbiAgICogQHRlbXBsYXRlIEVudGl0eUJhc2UgLSBUaGUgYmFzZSBlbnRpdHkgdHlwZVxuICAgKiBAdGVtcGxhdGUgU29tZUNvbXBvbmVudENsYXNzIC0gVGhlIGNvbXBvbmVudCBjbGFzcyB0eXBlXG4gICAqL1xuICBhZGRUaGlzQ29tcG9uZW50VG9FbnRpdHk8RW50aXR5QmFzZSBleHRlbmRzIElFbnRpdHksIFNvbWVDb21wb25lbnRDbGFzcyBleHRlbmRzIHR5cGVvZiBDb21wb25lbnQ+KFxuICAgIGJhc2U6IEVudGl0eUJhc2UsXG4gICAgX2NvbXBvbmVudENsYXNzOiBTb21lQ29tcG9uZW50Q2xhc3NcbiAgKSB7XG4gICAgY2xhc3MgVHJhbnNmb3JtRW50aXR5IGV4dGVuZHMgKGJhc2UuY29uc3RydWN0b3IgYXMgYW55KSB7XG4gICAgICBwcml2YXRlIF9fdHJhbnNmb3JtQ29tcG9uZW50PzogVHJhbnNmb3JtQ29tcG9uZW50O1xuXG4gICAgICAvKipcbiAgICAgICAqIEdldHMgdGhlIHRyYW5zZm9ybSBjb21wb25lbnQgZm9yIHRoaXMgZW50aXR5LlxuICAgICAgICogQHJldHVybnMgVGhlIHRyYW5zZm9ybSBjb21wb25lbnQgaW5zdGFuY2VcbiAgICAgICAqL1xuICAgICAgZ2V0VHJhbnNmb3JtKCk6IFRyYW5zZm9ybUNvbXBvbmVudCB7XG4gICAgICAgIGlmICh0aGlzLl9fdHJhbnNmb3JtQ29tcG9uZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aGlzLl9fdHJhbnNmb3JtQ29tcG9uZW50ID0gdGhpcy5nZXRDb21wb25lbnRCeUNvbXBvbmVudFRJRChcbiAgICAgICAgICAgIFdlbGxLbm93bkNvbXBvbmVudFRJRHMuVHJhbnNmb3JtQ29tcG9uZW50VElEXG4gICAgICAgICAgKSBhcyBUcmFuc2Zvcm1Db21wb25lbnQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX190cmFuc2Zvcm1Db21wb25lbnQ7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogU2V0cyB0aGUgbG9jYWwgcG9zaXRpb24gb2YgdGhpcyBlbnRpdHkuXG4gICAgICAgKiBAcGFyYW0gdmVjIC0gVGhlIG5ldyBwb3NpdGlvbiB2ZWN0b3JcbiAgICAgICAqL1xuICAgICAgc2V0IGxvY2FsUG9zaXRpb24odmVjOiBJVmVjdG9yMykge1xuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSB0aGlzLmdldFRyYW5zZm9ybSgpO1xuICAgICAgICB0cmFuc2Zvcm0ubG9jYWxQb3NpdGlvbiA9IHZlYztcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBHZXRzIGEgY29weSBvZiB0aGUgbG9jYWwgcG9zaXRpb24uXG4gICAgICAgKiBAcmV0dXJucyBBIGNvcHkgb2YgdGhlIGxvY2FsIHBvc2l0aW9uXG4gICAgICAgKi9cbiAgICAgIGdldCBsb2NhbFBvc2l0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2NhbFBvc2l0aW9uSW5uZXIuY2xvbmUoKTtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBHZXRzIHRoZSBpbnRlcm5hbCBtdXRhYmxlIGxvY2FsIHBvc2l0aW9uIHZlY3Rvci5cbiAgICAgICAqIEByZXR1cm5zIFRoZSBpbnRlcm5hbCBtdXRhYmxlIHBvc2l0aW9uIHZlY3RvclxuICAgICAgICovXG4gICAgICBnZXQgbG9jYWxQb3NpdGlvbklubmVyKCkge1xuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSB0aGlzLmdldFRyYW5zZm9ybSgpO1xuICAgICAgICByZXR1cm4gdHJhbnNmb3JtLmxvY2FsUG9zaXRpb25Jbm5lcjtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBTZXRzIHRoZSBsb2NhbCBwb3NpdGlvbiBhcyByZXN0IHBvc2UuXG4gICAgICAgKiBAcGFyYW0gdmVjIC0gVGhlIHBvc2l0aW9uIHZlY3RvciB0byBzZXQgYXMgcmVzdFxuICAgICAgICovXG4gICAgICBzZXQgbG9jYWxQb3NpdGlvblJlc3QodmVjOiBJVmVjdG9yMykge1xuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSB0aGlzLmdldFRyYW5zZm9ybSgpO1xuICAgICAgICB0cmFuc2Zvcm0ubG9jYWxQb3NpdGlvblJlc3QgPSB2ZWM7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogR2V0cyB0aGUgbG9jYWwgcG9zaXRpb24gcmVzdCBwb3NlLlxuICAgICAgICogQHJldHVybnMgVGhlIHJlc3QgcG9zaXRpb25cbiAgICAgICAqL1xuICAgICAgZ2V0IGxvY2FsUG9zaXRpb25SZXN0KCkge1xuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSB0aGlzLmdldFRyYW5zZm9ybSgpO1xuICAgICAgICByZXR1cm4gdHJhbnNmb3JtLmxvY2FsUG9zaXRpb25SZXN0O1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIEdldHMgdGhlIGludGVybmFsIG11dGFibGUgbG9jYWwgcG9zaXRpb24gcmVzdCB2ZWN0b3IuXG4gICAgICAgKiBAcmV0dXJucyBUaGUgaW50ZXJuYWwgbXV0YWJsZSByZXN0IHBvc2l0aW9uIHZlY3RvclxuICAgICAgICovXG4gICAgICBnZXQgbG9jYWxQb3NpdGlvblJlc3RJbm5lcigpIHtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gdGhpcy5nZXRUcmFuc2Zvcm0oKTtcbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybS5sb2NhbFBvc2l0aW9uUmVzdElubmVyO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIFNldHMgdGhlIGxvY2FsIHNjYWxlIG9mIHRoaXMgZW50aXR5LlxuICAgICAgICogQHBhcmFtIHZlYyAtIFRoZSBuZXcgc2NhbGUgdmVjdG9yXG4gICAgICAgKi9cbiAgICAgIHNldCBsb2NhbFNjYWxlKHZlYzogSVZlY3RvcjMpIHtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gdGhpcy5nZXRUcmFuc2Zvcm0oKTtcbiAgICAgICAgdHJhbnNmb3JtLmxvY2FsU2NhbGUgPSB2ZWM7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogR2V0cyBhIGNvcHkgb2YgdGhlIGxvY2FsIHNjYWxlLlxuICAgICAgICogQHJldHVybnMgQSBjb3B5IG9mIHRoZSBsb2NhbCBzY2FsZVxuICAgICAgICovXG4gICAgICBnZXQgbG9jYWxTY2FsZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxTY2FsZUlubmVyLmNsb25lKCk7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogR2V0cyB0aGUgaW50ZXJuYWwgbXV0YWJsZSBsb2NhbCBzY2FsZSB2ZWN0b3IuXG4gICAgICAgKiBAcmV0dXJucyBUaGUgaW50ZXJuYWwgbXV0YWJsZSBzY2FsZSB2ZWN0b3JcbiAgICAgICAqL1xuICAgICAgZ2V0IGxvY2FsU2NhbGVJbm5lcigpIHtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gdGhpcy5nZXRUcmFuc2Zvcm0oKTtcbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybS5sb2NhbFNjYWxlSW5uZXI7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogU2V0cyB0aGUgbG9jYWwgc2NhbGUgYXMgcmVzdCBwb3NlLlxuICAgICAgICogQHBhcmFtIHZlYyAtIFRoZSBzY2FsZSB2ZWN0b3IgdG8gc2V0IGFzIHJlc3RcbiAgICAgICAqL1xuICAgICAgc2V0IGxvY2FsU2NhbGVSZXN0KHZlYzogSVZlY3RvcjMpIHtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gdGhpcy5nZXRUcmFuc2Zvcm0oKTtcbiAgICAgICAgdHJhbnNmb3JtLmxvY2FsU2NhbGVSZXN0ID0gdmVjO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIEdldHMgdGhlIGxvY2FsIHNjYWxlIHJlc3QgcG9zZS5cbiAgICAgICAqIEByZXR1cm5zIFRoZSByZXN0IHNjYWxlXG4gICAgICAgKi9cbiAgICAgIGdldCBsb2NhbFNjYWxlUmVzdCgpIHtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gdGhpcy5nZXRUcmFuc2Zvcm0oKTtcbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybS5sb2NhbFNjYWxlUmVzdDtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBHZXRzIHRoZSBpbnRlcm5hbCBtdXRhYmxlIGxvY2FsIHNjYWxlIHJlc3QgdmVjdG9yLlxuICAgICAgICogQHJldHVybnMgVGhlIGludGVybmFsIG11dGFibGUgcmVzdCBzY2FsZSB2ZWN0b3JcbiAgICAgICAqL1xuICAgICAgZ2V0IGxvY2FsU2NhbGVSZXN0SW5uZXIoKSB7XG4gICAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IHRoaXMuZ2V0VHJhbnNmb3JtKCk7XG4gICAgICAgIHJldHVybiB0cmFuc2Zvcm0ubG9jYWxTY2FsZVJlc3RJbm5lcjtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBTZXRzIHRoZSBsb2NhbCBFdWxlciBhbmdsZXMgb2YgdGhpcyBlbnRpdHkuXG4gICAgICAgKiBAcGFyYW0gdmVjIC0gVGhlIEV1bGVyIGFuZ2xlcyB2ZWN0b3IgKFhZWiBvcmRlcilcbiAgICAgICAqL1xuICAgICAgc2V0IGxvY2FsRXVsZXJBbmdsZXModmVjOiBJVmVjdG9yMykge1xuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSB0aGlzLmdldFRyYW5zZm9ybSgpO1xuICAgICAgICB0cmFuc2Zvcm0ubG9jYWxFdWxlckFuZ2xlcyA9IHZlYztcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBHZXRzIGEgY29weSBvZiB0aGUgbG9jYWwgRXVsZXIgYW5nbGVzLlxuICAgICAgICogQHJldHVybnMgQSBjb3B5IG9mIHRoZSBsb2NhbCBFdWxlciBhbmdsZXNcbiAgICAgICAqL1xuICAgICAgZ2V0IGxvY2FsRXVsZXJBbmdsZXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvY2FsRXVsZXJBbmdsZXNJbm5lci5jbG9uZSgpO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIEdldHMgdGhlIGludGVybmFsIG11dGFibGUgbG9jYWwgRXVsZXIgYW5nbGVzIHZlY3Rvci5cbiAgICAgICAqIEByZXR1cm5zIFRoZSBpbnRlcm5hbCBtdXRhYmxlIEV1bGVyIGFuZ2xlcyB2ZWN0b3JcbiAgICAgICAqL1xuICAgICAgZ2V0IGxvY2FsRXVsZXJBbmdsZXNJbm5lcigpIHtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gdGhpcy5nZXRUcmFuc2Zvcm0oKTtcbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybS5sb2NhbEV1bGVyQW5nbGVzSW5uZXI7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogU2V0cyB0aGUgbG9jYWwgRXVsZXIgYW5nbGVzIGFzIHJlc3QgcG9zZS5cbiAgICAgICAqIEBwYXJhbSB2ZWMgLSBUaGUgRXVsZXIgYW5nbGVzIHZlY3RvciB0byBzZXQgYXMgcmVzdCAoWFlaIG9yZGVyKVxuICAgICAgICovXG4gICAgICBzZXQgbG9jYWxFdWxlckFuZ2xlc1Jlc3QodmVjOiBJVmVjdG9yMykge1xuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSB0aGlzLmdldFRyYW5zZm9ybSgpO1xuICAgICAgICB0cmFuc2Zvcm0ubG9jYWxFdWxlckFuZ2xlc1Jlc3QgPSB2ZWM7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogR2V0cyB0aGUgbG9jYWwgRXVsZXIgYW5nbGVzIHJlc3QgcG9zZS5cbiAgICAgICAqIEByZXR1cm5zIEEgY29weSBvZiB0aGUgcmVzdCBFdWxlciBhbmdsZXNcbiAgICAgICAqL1xuICAgICAgZ2V0IGxvY2FsRXVsZXJBbmdsZXNSZXN0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2NhbEV1bGVyQW5nbGVzUmVzdElubmVyLmNsb25lKCk7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogR2V0cyB0aGUgaW50ZXJuYWwgbXV0YWJsZSBsb2NhbCBFdWxlciBhbmdsZXMgcmVzdCB2ZWN0b3IuXG4gICAgICAgKiBAcmV0dXJucyBUaGUgaW50ZXJuYWwgbXV0YWJsZSByZXN0IEV1bGVyIGFuZ2xlcyB2ZWN0b3JcbiAgICAgICAqL1xuICAgICAgZ2V0IGxvY2FsRXVsZXJBbmdsZXNSZXN0SW5uZXIoKSB7XG4gICAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IHRoaXMuZ2V0VHJhbnNmb3JtKCk7XG4gICAgICAgIHJldHVybiB0cmFuc2Zvcm0ubG9jYWxFdWxlckFuZ2xlc1Jlc3RJbm5lcjtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBTZXRzIHRoZSBsb2NhbCByb3RhdGlvbiB1c2luZyBhIHF1YXRlcm5pb24uXG4gICAgICAgKiBAcGFyYW0gcXVhdCAtIFRoZSBuZXcgcm90YXRpb24gcXVhdGVybmlvblxuICAgICAgICovXG4gICAgICBzZXQgbG9jYWxSb3RhdGlvbihxdWF0OiBJUXVhdGVybmlvbikge1xuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSB0aGlzLmdldFRyYW5zZm9ybSgpO1xuICAgICAgICB0cmFuc2Zvcm0ubG9jYWxSb3RhdGlvbiA9IHF1YXQ7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogR2V0cyBhIGNvcHkgb2YgdGhlIGxvY2FsIHJvdGF0aW9uIHF1YXRlcm5pb24uXG4gICAgICAgKiBAcmV0dXJucyBBIGNvcHkgb2YgdGhlIGxvY2FsIHJvdGF0aW9uXG4gICAgICAgKi9cbiAgICAgIGdldCBsb2NhbFJvdGF0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2NhbFJvdGF0aW9uSW5uZXIuY2xvbmUoKTtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBHZXRzIHRoZSBpbnRlcm5hbCBsb2NhbCByb3RhdGlvbiBxdWF0ZXJuaW9uLlxuICAgICAgICogQHJldHVybnMgVGhlIGludGVybmFsIHJvdGF0aW9uIHF1YXRlcm5pb25cbiAgICAgICAqL1xuICAgICAgZ2V0IGxvY2FsUm90YXRpb25Jbm5lcigpIHtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gdGhpcy5nZXRUcmFuc2Zvcm0oKTtcbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybS5sb2NhbFJvdGF0aW9uSW5uZXI7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogU2V0cyB0aGUgbG9jYWwgcm90YXRpb24gYXMgcmVzdCBwb3NlLlxuICAgICAgICogQHBhcmFtIHF1YXQgLSBUaGUgcm90YXRpb24gcXVhdGVybmlvbiB0byBzZXQgYXMgcmVzdFxuICAgICAgICovXG4gICAgICBzZXQgbG9jYWxSb3RhdGlvblJlc3QocXVhdDogSVF1YXRlcm5pb24pIHtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gdGhpcy5nZXRUcmFuc2Zvcm0oKTtcbiAgICAgICAgdHJhbnNmb3JtLmxvY2FsUm90YXRpb25SZXN0ID0gcXVhdDtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBHZXRzIHRoZSBsb2NhbCByb3RhdGlvbiByZXN0IHBvc2UuXG4gICAgICAgKiBAcmV0dXJucyBBIGNvcHkgb2YgdGhlIHJlc3Qgcm90YXRpb25cbiAgICAgICAqL1xuICAgICAgZ2V0IGxvY2FsUm90YXRpb25SZXN0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2NhbFF1YXRlcm5pb25SZXN0SW5uZXIuY2xvbmUoKTtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBHZXRzIHRoZSBpbnRlcm5hbCBsb2NhbCByb3RhdGlvbiByZXN0IHF1YXRlcm5pb24uXG4gICAgICAgKiBAcmV0dXJucyBUaGUgaW50ZXJuYWwgcmVzdCByb3RhdGlvbiBxdWF0ZXJuaW9uXG4gICAgICAgKi9cbiAgICAgIGdldCBsb2NhbFJvdGF0aW9uUmVzdElubmVyKCkge1xuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSB0aGlzLmdldFRyYW5zZm9ybSgpO1xuICAgICAgICByZXR1cm4gdHJhbnNmb3JtLmxvY2FsUm90YXRpb25SZXN0SW5uZXI7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogU2V0cyB0aGUgbG9jYWwgdHJhbnNmb3JtYXRpb24gbWF0cml4LlxuICAgICAgICogQHBhcmFtIG1hdCAtIFRoZSBuZXcgdHJhbnNmb3JtYXRpb24gbWF0cml4XG4gICAgICAgKi9cbiAgICAgIHNldCBsb2NhbE1hdHJpeChtYXQ6IElNYXRyaXg0NCkge1xuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSB0aGlzLmdldFRyYW5zZm9ybSgpO1xuICAgICAgICB0cmFuc2Zvcm0ubG9jYWxNYXRyaXggPSBtYXQ7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogR2V0cyBhIGNvcHkgb2YgdGhlIGxvY2FsIHRyYW5zZm9ybWF0aW9uIG1hdHJpeC5cbiAgICAgICAqIEByZXR1cm5zIEEgY29weSBvZiB0aGUgbG9jYWwgbWF0cml4XG4gICAgICAgKi9cbiAgICAgIGdldCBsb2NhbE1hdHJpeCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxNYXRyaXhJbm5lci5jbG9uZSgpO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIEdldHMgdGhlIGludGVybmFsIGxvY2FsIHRyYW5zZm9ybWF0aW9uIG1hdHJpeC5cbiAgICAgICAqIEByZXR1cm5zIFRoZSBpbnRlcm5hbCBsb2NhbCBtYXRyaXhcbiAgICAgICAqL1xuICAgICAgZ2V0IGxvY2FsTWF0cml4SW5uZXIoKSB7XG4gICAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IHRoaXMuZ2V0VHJhbnNmb3JtKCk7XG4gICAgICAgIHJldHVybiB0cmFuc2Zvcm0ubG9jYWxNYXRyaXhJbm5lcjtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBTZXRzIHRoZSBsb2NhbCB0cmFuc2Zvcm1hdGlvbiBtYXRyaXggYXMgcmVzdCBwb3NlLlxuICAgICAgICogQHBhcmFtIG1hdCAtIFRoZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXggdG8gc2V0IGFzIHJlc3RcbiAgICAgICAqL1xuICAgICAgc2V0IGxvY2FsTWF0cml4UmVzdChtYXQ6IElNYXRyaXg0NCkge1xuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSB0aGlzLmdldFRyYW5zZm9ybSgpO1xuICAgICAgICB0cmFuc2Zvcm0ubG9jYWxNYXRyaXhSZXN0ID0gbWF0O1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIEdldHMgdGhlIGxvY2FsIHRyYW5zZm9ybWF0aW9uIG1hdHJpeCByZXN0IHBvc2UuXG4gICAgICAgKiBAcmV0dXJucyBBIGNvcHkgb2YgdGhlIHJlc3QgbWF0cml4XG4gICAgICAgKi9cbiAgICAgIGdldCBsb2NhbE1hdHJpeFJlc3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvY2FsTWF0cml4UmVzdElubmVyLmNsb25lKCk7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogR2V0cyB0aGUgaW50ZXJuYWwgbG9jYWwgdHJhbnNmb3JtYXRpb24gbWF0cml4IHJlc3QgcG9zZS5cbiAgICAgICAqIEByZXR1cm5zIFRoZSBpbnRlcm5hbCByZXN0IG1hdHJpeFxuICAgICAgICovXG4gICAgICBnZXQgbG9jYWxNYXRyaXhSZXN0SW5uZXIoKSB7XG4gICAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IHRoaXMuZ2V0VHJhbnNmb3JtKCk7XG4gICAgICAgIHJldHVybiB0cmFuc2Zvcm0ubG9jYWxNYXRyaXhSZXN0SW5uZXI7XG4gICAgICB9XG4gICAgfVxuICAgIGFwcGx5TWl4aW5zKGJhc2UsIFRyYW5zZm9ybUVudGl0eSk7XG4gICAgcmV0dXJuIGJhc2UgYXMgdW5rbm93biBhcyBDb21wb25lbnRUb0NvbXBvbmVudE1ldGhvZHM8U29tZUNvbXBvbmVudENsYXNzPiAmIEVudGl0eUJhc2U7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW5zIHVwIHN0YXRpYyByZXNvdXJjZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBzcGVjaWZpZWQgZW5naW5lLlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZSB0byBjbGVhbiB1cCByZXNvdXJjZXMgZm9yXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIF9jbGVhbnVwRm9yRW5naW5lKGVuZ2luZTogRW5naW5lKTogdm9pZCB7XG4gICAgVHJhbnNmb3JtQ29tcG9uZW50Ll9fdXBkYXRlQ291bnRNYXAuZGVsZXRlKGVuZ2luZSk7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxTQUFTLGlCQUFpQjtBQUUxQixTQUFTLG1CQUFtQjtBQUM1QixTQUFTLG9CQUFvQjtBQUU3QixTQUFTLGdCQUFnQjtBQUt6QixTQUFTLHlCQUF5QjtBQUVsQyxTQUFTLGtCQUFrQjtBQUMzQixTQUFTLG1CQUFtQjtBQUM1QixTQUFTLFVBQVU7QUFHbkIsU0FBUyw4QkFBOEI7QUFPaEMsSUFBTSxzQkFBTixNQUFNLDRCQUEyQixVQUFVO0FBQUEsRUFBM0M7QUFBQTtBQUVMLFNBQVEsU0FBUyxJQUFJLFlBQVk7QUFDakMsU0FBUSwyQkFBMkI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFTbkMsV0FBVyx3QkFBd0I7QUFDakMsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsV0FBVyxlQUFlO0FBQ3hCLFdBQU8sdUJBQXVCO0FBQUEsRUFDaEM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxlQUE2QjtBQUMvQixXQUFPLHVCQUF1QjtBQUFBLEVBQ2hDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUksYUFBYTtBQUNmLFFBQUksS0FBSyxXQUFXLFFBQVc7QUFDN0IsYUFB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
