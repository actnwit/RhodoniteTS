// src/foundation/components/SceneGraph/SceneGraphComponent.ts
import { Component } from "../../core/Component.js";
import { applyMixins } from "../../core/EntityRepository.js";
import { BufferUse } from "../../definitions/BufferUse.js";
import { ComponentType } from "../../definitions/ComponentType.js";
import { CompositionType } from "../../definitions/CompositionType.js";
import { ProcessStage } from "../../definitions/ProcessStage.js";
import { ShaderType } from "../../definitions/ShaderType.js";
import { _getGizmoClass } from "../../gizmos/GizmoRegistry.js";
import { AABB } from "../../math/AABB.js";
import { Matrix44 } from "../../math/Matrix44.js";
import { MutableMatrix33 } from "../../math/MutableMatrix33.js";
import { MutableMatrix44 } from "../../math/MutableMatrix44.js";
import { MutableQuaternion } from "../../math/MutableQuaternion.js";
import { MutableScalar } from "../../math/MutableScalar.js";
import { MutableVector3 } from "../../math/MutableVector3.js";
import { Quaternion } from "../../math/Quaternion.js";
import { Vector3 } from "../../math/Vector3.js";
import { Is } from "../../misc/Is.js";
import { CameraComponent } from "../Camera/CameraComponent.js";
import { TransformComponent } from "../Transform/TransformComponent.js";
import { WellKnownComponentTIDs } from "../WellKnownComponentTIDs.js";
import { flattenHierarchy } from "./SceneGraphOps.js";
var _SceneGraphComponent = class _SceneGraphComponent extends Component {
  /**
   * Creates a new SceneGraphComponent instance.
   * @param engine - The engine instance
   * @param entityUid - The unique identifier of the entity this component belongs to
   * @param componentSid - The component instance identifier
   * @param entityRepository - The entity repository managing this component
   * @param isReUse - Whether this component is being reused
   */
  constructor(engine, entityUid, componentSid, entityRepository, isReUse) {
    super(engine, entityUid, componentSid, entityRepository, isReUse);
    this.__children = [];
    this.__gizmoChildren = [];
    /** True while this node is attached to its parent as a gizmo child (see _addGizmoChild). */
    this.__isGizmoChild = false;
    this.__physicsComponentCountInSubtree = 0;
    this._worldMatrix = MutableMatrix44.dummy();
    this._worldMatrixRest = MutableMatrix44.identity();
    this._normalMatrix = MutableMatrix33.dummy();
    this._worldRotation = MutableQuaternion.identity();
    this.__isWorldMatrixUpToDate = false;
    /**
     * Monotonically increasing counter that advances whenever this node's world matrix is invalidated.
     * Consumers such as SkeletalComponent sum these counters to detect whether any input changed.
     */
    this.__worldMatrixVersion = 0;
    this.__isWorldMatrixRestUpToDate = false;
    this.__isNormalMatrixUpToDate = false;
    this.__isWorldRotationUpToDate = false;
    this.__worldMergedAABBWithSkeletal = new AABB();
    this.__worldMergedAABB = new AABB();
    this.__isWorldAABBDirty = true;
    /** Separate dirty flag: the skeletal and non-skeletal merged AABBs are cached independently. */
    this.__isWorldAABBDirtyWithSkeletal = true;
    /**
     * Epoch at which this node was last visited by {@link setWorldAABBDirtyParentRecursively}.
     * While it equals the static epoch, this node and all of its ancestors are known to be AABB-dirty,
     * so an upward propagation reaching this node can stop here.
     */
    this.__aabbDirtyChainEpoch = 0;
    /** `__worldMatrixVersion` when logicForce last ran; while unchanged, $logic has nothing to update. */
    this.__settledWorldMatrixVersion = -1;
    /** Component creation count when logicForce last ran (a mesh may have been attached since). */
    this.__settledComponentCreationCount = -1;
    this._isVisible = MutableScalar.dummy();
    this._isBillboard = MutableScalar.dummy();
    /** True when any gizmo of this node has been set up: skips the per-frame gizmo checks of plain nodes. */
    this.__hasGizmos = false;
    this.__transformGizmoSpace = "world";
    this.__latestPrimitivePositionAccessorVersion = 0;
    this.toMakeWorldMatrixTheSameAsLocalMatrix = false;
    // Skeletal
    this.isRootJoint = false;
    this.jointIndex = -1;
    this._isCulled = false;
    this.__lastTransformComponentsUpdateCount = -1;
    _SceneGraphComponent.__sceneGraphs.push(new WeakRef(this));
    this.submitToAllocation(engine.config.scenegraphComponentCountPerBufferView, isReUse);
  }
  /**
   * Sets the visibility of this scene graph node.
   * @param flg - True to make visible, false to hide
   */
  set isVisible(flg) {
    this._isVisible.setValue(flg ? 1 : 0);
    _SceneGraphComponent.__incrementUpdateCount(this.__engine);
  }
  /**
   * Gets the visibility state of this scene graph node.
   * @returns True if visible, false if hidden
   */
  get isVisible() {
    return this._isVisible.getValue() === 1;
  }
  /**
   * Gets the update counter for scene graph components of the specified engine.
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
   * Sets the visibility of this node and all its children recursively.
   * @param flag - True to make visible, false to hide
   */
  setVisibilityRecursively(flag) {
    this.isVisible = flag;
    for (const child of this.__children) {
      child.setVisibilityRecursively(flag);
    }
  }
  /**
   * Sets the billboard state of this scene graph node.
   * @param flg - True to enable billboard behavior, false to disable
   */
  set isBillboard(flg) {
    this._isBillboard.setValue(flg ? 1 : 0);
  }
  /**
   * Gets the billboard state of this scene graph node.
   * @returns True if billboard is enabled, false otherwise
   */
  get isBillboard() {
    return this._isBillboard.getValue() === 1;
  }
  /**
   * Sets the billboard state of this node and all its children recursively.
   * @param flg - True to enable billboard behavior, false to disable
   */
  setIsBillboardRecursively(flg) {
    this._isBillboard.setValue(flg ? 1 : 0);
    for (const child of this.__children) {
      child.isBillboard = flg;
    }
  }
  /**
   * Sets the visibility of the AABB (Axis-Aligned Bounding Box) gizmo.
   * @param flg - True to show the AABB gizmo, false to hide it
   */
  set isAABBGizmoVisible(flg) {
    if (flg) {
      this.__hasGizmos = true;
      if (Is.not.defined(this.__aabbGizmo)) {
        this.__aabbGizmo = new (_getGizmoClass("aabb"))(this.entity.engine, this.entity);
        this.__aabbGizmo._setup();
      }
      this.__aabbGizmo.isVisible = true;
    } else {
      if (Is.exist(this.__aabbGizmo)) {
        this.__aabbGizmo.isVisible = false;
      }
    }
  }
  /**
   * Gets the visibility state of the AABB gizmo.
   * @returns True if the AABB gizmo is visible, false otherwise
   */
  get isAABBGizmoVisible() {
    if (Is.exist(this.__aabbGizmo)) {
      return this.__aabbGizmo.isVisible;
    }
    return false;
  }
  /**
   * Sets the visibility of the locator gizmo.
   * @param flg - True to show the locator gizmo, false to hide it
   */
  set isLocatorGizmoVisible(flg) {
    if (flg) {
      this.__hasGizmos = true;
      if (Is.not.defined(this.__locatorGizmo)) {
        this.__locatorGizmo = new (_getGizmoClass("locator"))(this.entity.engine, this.entity);
        this.__locatorGizmo._setup();
      }
      this.__locatorGizmo.isVisible = true;
    } else {
      if (Is.exist(this.__locatorGizmo)) {
        this.__locatorGizmo.isVisible = false;
      }
    }
  }
  /**
   * Gets the visibility state of the locator gizmo.
   * @returns True if the locator gizmo is visible, false otherwise
   */
  get isLocatorGizmoVisible() {
    if (Is.exist(this.__locatorGizmo)) {
      return this.__locatorGizmo.isVisible;
    }
    return false;
  }
  /**
   * Sets the visibility of the translation gizmo.
   * @param flg - True to show the translation gizmo, false to hide it
   */
  set isTranslationGizmoVisible(flg) {
    if (flg) {
      this.__hasGizmos = true;
      if (Is.not.defined(this.__translationGizmo)) {
        this.__translationGizmo = new (_getGizmoClass("translation"))(this.entity.engine, this.entity);
        this.__translationGizmo._setup();
      }
      this.__translationGizmo.isVisible = true;
      this.__registerTransformGizmoOwner();
      if (this.__translationGizmo.isSetup) {
        this.__translationGizmo._update();
      }
    } else {
      if (Is.exist(this.__translationGizmo)) {
        this.__translationGizmo.isVisible = false;
        this.__unregisterTransformGizmoOwnerIfNeeded();
      }
    }
  }
  /**
   * Gets the visibility state of the translation gizmo.
   * @returns True if the translation gizmo is visible, false otherwise
   */
  get isTranslationGizmoVisible() {
    if (Is.exist(this.__translationGizmo)) {
      return this.__translationGizmo.isVisible;
    }
    return false;
  }
  /**
   * Sets the visibility of the rotation gizmo.
   * @param flg - True to show the rotation gizmo, false to hide it
   */
  set isRotationGizmoVisible(flg) {
    if (flg) {
      this.__hasGizmos = true;
      if (Is.not.defined(this.__rotationGizmo)) {
        this.__rotationGizmo = new (_getGizmoClass("rotation"))(this.entity.engine, this.entity);
        this.__rotationGizmo._setup();
        this.__rotationGizmo.setSpace(this.__transformGizmoSpace);
      }
      this.__rotationGizmo.isVisible = true;
      this.__registerTransformGizmoOwner();
      if (this.__rotationGizmo.isSetup) {
        this.__rotationGizmo._update();
      }
    } else if (Is.exist(this.__rotationGizmo)) {
      this.__rotationGizmo.isVisible = false;
      this.__unregisterTransformGizmoOwnerIfNeeded();
    }
  }
  /**
   * Gets the visibility state of the rotation gizmo.
   * @returns True if the rotation gizmo is visible, false otherwise
   */
  get isRotationGizmoVisible() {
    if (Is.exist(this.__rotationGizmo)) {
      return this.__rotationGizmo.isVisible;
    }
    return false;
  }
  /**
   * Sets the visibility of the scale gizmo.
   * @param flg - True to show the scale gizmo, false to hide it
   */
  set isScaleGizmoVisible(flg) {
    if (flg) {
      this.__hasGizmos = true;
      if (Is.not.defined(this.__scaleGizmo)) {
        this.__scaleGizmo = new (_getGizmoClass("scale"))(this.entity.engine, this.entity);
        this.__scaleGizmo._setup();
      }
      this.__scaleGizmo.isVisible = true;
      this.__registerTransformGizmoOwner();
      if (this.__scaleGizmo.isSetup) {
        this.__scaleGizmo._update();
      }
    } else {
      if (Is.exist(this.__scaleGizmo)) {
        this.__scaleGizmo.isVisible = false;
        this.__unregisterTransformGizmoOwnerIfNeeded();
      }
    }
  }
  /**
   * Gets the visibility state of the scale gizmo.
   * @returns True if the scale gizmo is visible, false otherwise
   */
  get isScaleGizmoVisible() {
    if (Is.exist(this.__scaleGizmo)) {
      return this.__scaleGizmo.isVisible;
    }
    return false;
  }
  /**
   * Sets the visibility of the joint gizmo that visualizes skeletal joints.
   * @param flg - True to show the joint gizmo, false to hide it
   */
  set isJointGizmoVisible(flg) {
    if (flg && this.isJoint()) {
      this.__hasGizmos = true;
      if (Is.not.defined(this.__jointGizmo)) {
        this.__jointGizmo = new (_getGizmoClass("joint"))(this.entity.engine, this.entity);
        this.__jointGizmo._setup();
      }
      this.__jointGizmo.isVisible = true;
    } else if (Is.exist(this.__jointGizmo)) {
      this.__jointGizmo.isVisible = false;
    }
  }
  /**
   * Gets the visibility state of the joint gizmo.
   * @returns True if the joint gizmo is visible, false otherwise
   */
  get isJointGizmoVisible() {
    if (Is.exist(this.__jointGizmo)) {
      return this.__jointGizmo.isVisible;
    }
    return false;
  }
  /**
   * Gets all top-level scene graph components (nodes without parents).
   * @returns An array of scene graph components that are at the root level
   */
  static getTopLevelComponents() {
    return _SceneGraphComponent.__sceneGraphs.map((sgRef) => sgRef.deref()).filter((sg) => {
      if (sg !== void 0) {
        return sg.isTopLevel;
      }
      return false;
    });
  }
  /**
   * Checks if this node represents a skeletal joint.
   * @returns True if this is a joint (has a valid joint index), false otherwise
   */
  isJoint() {
    if (this.jointIndex >= 0) {
      return true;
    }
    return false;
  }
  /**
   * Gets the component type identifier for SceneGraphComponent.
   * @returns The component type ID
   */
  /**
   * Gets the version counter of the scene graph hierarchy.
   * It changes whenever a parent-child relationship of any SceneGraphComponent may have changed.
   * @returns The hierarchy version counter
   */
  static get hierarchyVersion() {
    return _SceneGraphComponent.__hierarchyVersion;
  }
  /**
   * Advances the hierarchy version after a parent-child relationship changed.
   */
  static __bumpHierarchyVersion() {
    _SceneGraphComponent.__hierarchyVersion++;
    _SceneGraphComponent.__aabbDirtyChainEpoch++;
  }
  static get componentTID() {
    return WellKnownComponentTIDs.SceneGraphComponentTID;
  }
  /**
   * Gets the component type identifier for this instance.
   * @returns The component type ID
   */
  get componentTID() {
    return WellKnownComponentTIDs.SceneGraphComponentTID;
  }
  /**
   * Marks the world matrix rest state as dirty and propagates to children.
   */
  setWorldMatrixRestDirty() {
    this.matrixRestInner;
    this.setWorldMatrixRestDirtyRecursively();
  }
  /**
   * Recursively marks the world matrix rest state as dirty for this node and all children.
   */
  setWorldMatrixRestDirtyRecursively() {
    this.__isWorldMatrixRestUpToDate = false;
    for (const child of this.children) {
      child.setWorldMatrixRestDirtyRecursively();
    }
  }
  /**
   * Gets the monotonically increasing world matrix version of this node.
   * The value changes whenever the node is marked dirty, so summing it over a set of nodes detects
   * whether any of them may need to be recomputed.
   * @returns The world matrix version
   */
  get worldMatrixVersion() {
    return this.__worldMatrixVersion;
  }
  /**
   * Marks the world matrix as dirty and propagates changes up the hierarchy.
   */
  setWorldMatrixDirty() {
    var _a;
    this.setWorldMatrixDirtyRecursively();
    if (!this.__isGizmoChild) {
      (_a = this.parent) == null ? void 0 : _a.setWorldAABBDirtyParentRecursively();
    }
  }
  /**
   * Marks the world matrix as dirty without checking if the AABB is dirty.
   */
  setWorldMatrixDirtyWithoutAABBDirty() {
    this.setWorldMatrixDirtyRecursively();
  }
  /**
   * Recursively marks the world matrix as dirty for this node and all children.
   */
  setWorldMatrixDirtyRecursively() {
    if (!this.__isWorldMatrixUpToDate && !this.__isNormalMatrixUpToDate && !this.__isWorldRotationUpToDate && this.__isWorldAABBDirty && this.__isWorldAABBDirtyWithSkeletal) {
      return;
    }
    this.__worldMatrixVersion++;
    this.__isWorldMatrixUpToDate = false;
    this.__isNormalMatrixUpToDate = false;
    this.__isWorldRotationUpToDate = false;
    this.__isWorldAABBDirty = true;
    this.__isWorldAABBDirtyWithSkeletal = true;
    for (const child of this.children) {
      child.setWorldMatrixDirtyRecursively();
    }
  }
  /**
   * Marks the world AABB of this node and all of its ancestors as dirty.
   *
   * The walk stops at the first node already marked in the current epoch: that node and all of its
   * ancestors are known to be dirty. Many nodes of the same subtree changing in one frame (e.g. every
   * joint of an animated skeleton) therefore cost O(number of distinct ancestors) in total instead of
   * O(changed nodes * depth).
   */
  setWorldAABBDirtyParentRecursively() {
    const epoch = _SceneGraphComponent.__aabbDirtyChainEpoch;
    let node = this;
    while (node != null) {
      node.__isWorldAABBDirty = true;
      node.__isWorldAABBDirtyWithSkeletal = true;
      if (node.__aabbDirtyChainEpoch === epoch) {
        return;
      }
      node.__aabbDirtyChainEpoch = epoch;
      node = node.__parent;
    }
  }
  /**
   * Adds a SceneGraph component as a child of this node.
   * @param sg - The SceneGraph component to add as a child
   * @param keepPoseInWorldSpace - Whether to keep the child's world pose
   */
  addChild(sg, keepPoseInWorldSpace = false) {
    let worldMatrixBeforeReparent;
    if (keepPoseInWorldSpace) {
      sg.logicForce();
      worldMatrixBeforeReparent = sg.matrix;
    }
    if (Is.exist(sg.__parent)) {
      sg.__parent.removeChild(sg);
    }
    sg.__parent = this;
    this.__children.push(sg);
    _SceneGraphComponent.__bumpHierarchyVersion();
    this.__adjustPhysicsComponentCountInSubtree(sg.__physicsComponentCountInSubtree);
    if (keepPoseInWorldSpace) {
      if (Is.exist(worldMatrixBeforeReparent)) {
        sg.matrix = worldMatrixBeforeReparent;
      }
    }
    sg.setWorldMatrixDirtyRecursively();
    this.setWorldAABBDirtyParentRecursively();
  }
  /**
   * Removes a child SceneGraph component from this node.
   * @param sg - The SceneGraph component to remove
   */
  removeChild(sg) {
    const index = this.__children.indexOf(sg);
    if (index >= 0) {
      this.__adjustPhysicsComponentCountInSubtree(-sg.__physicsComponentCountInSubtree);
      this.__children.splice(index, 1);
    }
    const gizmoIndex = this.__gizmoChildren.indexOf(sg);
    if (gizmoIndex >= 0) {
      this.__gizmoChildren.splice(gizmoIndex, 1);
    }
    sg.__parent = void 0;
    sg.__isGizmoChild = false;
    _SceneGraphComponent.__bumpHierarchyVersion();
    sg.setWorldMatrixDirtyRecursively();
    if (index >= 0) {
      this.setWorldAABBDirtyParentRecursively();
    }
  }
  /**
   * Adds a SceneGraph component as a gizmo child (internal use only).
   * @param sg - The SceneGraph component of a gizmo to add
   */
  _addGizmoChild(sg) {
    sg.__parent = this;
    sg.__isGizmoChild = true;
    this.__gizmoChildren.push(sg);
    _SceneGraphComponent.__bumpHierarchyVersion();
  }
  /**
   * Checks if this node is at the top level (has no parent).
   * @returns True if this is a root node, false otherwise
   */
  get isTopLevel() {
    return this.__parent == null;
  }
  /**
   * Gets the child scene graph components of this node.
   * @returns An array of child scene graph components
   */
  get children() {
    return this.__children;
  }
  /**
   * Gets the parent scene graph component of this node.
   * @returns The parent component, or undefined if this is a root node
   */
  get parent() {
    return this.__parent;
  }
  /**
   * Gets the internal world matrix (mutable reference).
   * @returns The internal world matrix
   */
  get matrixInner() {
    if (!this.__isWorldMatrixUpToDate) {
      this.__calcWorldMatrixRecursively();
    }
    return this._worldMatrix;
  }
  /**
   * Gets a clone of the world matrix.
   * @returns A cloned copy of the world matrix
   */
  get matrix() {
    return this.matrixInner.clone();
  }
  setMatrixWithoutPhysics(matrix) {
    if (Is.not.exist(this.__parent)) {
      this.entity.getTransform().localMatrixWithoutPhysics = matrix;
    } else {
      const parent = this.__parent;
      const invMatrix = Matrix44.invertTo(parent.matrixInner, _SceneGraphComponent.__tmp_mat4_4);
      this.entity.getTransform().localMatrixWithoutPhysics = Matrix44.multiplyTo(
        invMatrix,
        matrix,
        _SceneGraphComponent.__tmp_mat4_3
      ).clone();
    }
  }
  setMatrixToPhysics(matrix) {
    this.__setMatrixToOwnPhysics(matrix, true, true, true);
    this.__syncDescendantPhysicsTransforms(true, true, true);
  }
  __setMatrixToOwnPhysics(matrix, updatePosition, updateRotation, updateScale) {
    const physicsComponent = this.entity.tryToGetPhysics();
    if (physicsComponent !== void 0) {
      if (physicsComponent.strategy !== void 0) {
        const strategy = physicsComponent.strategy;
        if (updateRotation) {
          const worldRotation = this.getQuaternionRecursivelyTo(_SceneGraphComponent.__tmp_quat_3);
          if (strategy.setRotation != null) {
            strategy.setRotation(worldRotation);
          } else if (strategy.setEulerAngle != null) {
            strategy.setEulerAngle(worldRotation.toEulerAnglesTo(_SceneGraphComponent.__tmp_euler));
          }
        }
        if (updatePosition && strategy.setPosition != null) {
          strategy.setPosition(matrix.getTranslateTo(_SceneGraphComponent.__tmp_translate));
        }
        if (updateScale && strategy.setScale != null) {
          strategy.setScale(this._getPhysicsWorldScale(matrix));
        }
      }
    }
  }
  __syncDescendantPhysicsTransforms(updatePosition, updateRotation, updateScale) {
    const ownPhysicsComponentCount = this.entity.tryToGetPhysics() === void 0 ? 0 : 1;
    if (this.__physicsComponentCountInSubtree === ownPhysicsComponentCount) {
      return;
    }
    this.matrixInner;
    this.setWorldMatrixDirty();
    for (const child of this.__children) {
      if (!child.toMakeWorldMatrixTheSameAsLocalMatrix && child.__physicsComponentCountInSubtree > 0) {
        child.__syncPhysicsTransformRecursively(updatePosition, updateRotation, updateScale);
      }
    }
  }
  __syncPhysicsTransformRecursively(updatePosition, updateRotation, updateScale) {
    if (this.__physicsComponentCountInSubtree === 0) {
      return;
    }
    this.__setMatrixToOwnPhysics(this.matrixInner, updatePosition, updateRotation, updateScale);
    for (const child of this.__children) {
      if (!child.toMakeWorldMatrixTheSameAsLocalMatrix && child.__physicsComponentCountInSubtree > 0) {
        child.__syncPhysicsTransformRecursively(updatePosition, updateRotation, updateScale);
      }
    }
  }
  /**
   * Records that this entity acquired a PhysicsComponent.
   * @internal
   */
  _onPhysicsComponentAdded() {
    this.__adjustPhysicsComponentCountInSubtree(1);
  }
  /**
   * Records that this entity lost its PhysicsComponent.
   * @internal
   */
  _onPhysicsComponentRemoved() {
    this.__adjustPhysicsComponentCountInSubtree(-1);
  }
  /**
   * Returns whether this node or one of its descendants has a PhysicsComponent.
   * @internal
   */
  get _hasPhysicsComponentInSubtree() {
    return this.__physicsComponentCountInSubtree > 0;
  }
  __adjustPhysicsComponentCountInSubtree(delta) {
    this.__physicsComponentCountInSubtree += delta;
    const parent = this.__parent;
    if (parent == null ? void 0 : parent.__children.includes(this)) {
      parent.__adjustPhysicsComponentCountInSubtree(delta);
    }
  }
  set matrix(matrix) {
    this.setMatrixWithoutPhysics(matrix);
    this.setMatrixToPhysics(matrix);
  }
  /**
   * Gets the internal world matrix in rest pose (mutable reference).
   * @returns The internal world matrix in rest pose
   */
  get matrixRestInner() {
    if (!this.__isWorldMatrixRestUpToDate) {
      this.__calcWorldMatrixRestRecursively();
    }
    return this._worldMatrixRest;
  }
  /**
   * Gets a clone of the world matrix in rest pose.
   * @returns A cloned copy of the world matrix in rest pose
   */
  get matrixRest() {
    return this.matrixRestInner.clone();
  }
  /**
   * Gets the internal normal matrix (mutable reference).
   * @returns The internal normal matrix
   */
  get normalMatrixInner() {
    if (!this.__isNormalMatrixUpToDate) {
      Matrix44.invertTo(this.matrixInner, _SceneGraphComponent.invertedMatrix44);
      this._normalMatrix.copyComponents(_SceneGraphComponent.invertedMatrix44.transpose());
      this.__isNormalMatrixUpToDate = true;
    }
    return this._normalMatrix;
  }
  /**
   * Gets the entity world matrix with skeletal animation applied.
   * @returns A cloned copy of the entity world matrix with skeletal transformations
   */
  get entityWorldWithSkeletalMatrix() {
    return this.entityWorldMatrixWithSkeletalInner.clone();
  }
  /**
   * Gets the internal entity world matrix with skeletal animation applied.
   * @returns The internal entity world matrix with skeletal transformations
   */
  get entityWorldMatrixWithSkeletalInner() {
    const skeletalComponent = this.entity.tryToGetSkeletal();
    if (Is.exist(skeletalComponent) && skeletalComponent.isWorldMatrixUpdated) {
      return skeletalComponent.worldMatrixInner;
    }
    const sceneGraphComponent = this.entity.getSceneGraph();
    return sceneGraphComponent.matrixInner;
  }
  /**
   * Gets a clone of the normal matrix.
   * @returns A cloned copy of the normal matrix
   */
  get normalMatrix() {
    return this.normalMatrixInner.clone();
  }
  /**
   * Checks if the world matrix is up-to-date recursively up the hierarchy.
   * @returns True if the world matrix is up-to-date for this node and all its ancestors
   */
  isWorldMatrixUpToDateRecursively() {
    if (this.__isWorldMatrixUpToDate) {
      if (this.__parent) {
        const result = this.__parent.isWorldMatrixUpToDateRecursively();
        return result;
      }
      return true;
    }
    return false;
  }
  /**
   * Recursively calculates the world matrix from this node up to the root.
   *
   * The result is memoized into `_worldMatrix` for every node visited by the recursion, not only the
   * node that was requested. Without the write-back, processing children before their parents would
   * recompute the same ancestor matrices once per descendant.
   *
   * @returns The cached world matrix of this node
   */
  __calcWorldMatrixRecursively() {
    if (this.__isWorldMatrixUpToDate) {
      return this._worldMatrix;
    }
    const transform = this.entity.getTransform();
    if (this.__parent == null || this.toMakeWorldMatrixTheSameAsLocalMatrix) {
      transform.getLocalMatrixInnerTo(this._worldMatrix);
    } else {
      const matrixFromAncestorToParent = this.__parent.__calcWorldMatrixRecursively();
      transform.getLocalMatrixInnerTo(_SceneGraphComponent.__tmp_mat4_3);
      MutableMatrix44.multiplyTo(matrixFromAncestorToParent, _SceneGraphComponent.__tmp_mat4_3, this._worldMatrix);
    }
    this.__isWorldMatrixUpToDate = true;
    return this._worldMatrix;
  }
  /**
   * Recursively calculates the world matrix in rest pose from this node up to the root.
   * @returns The calculated world matrix in rest pose
   */
  __calcWorldMatrixRestRecursively() {
    if (this.__isWorldMatrixRestUpToDate) {
      return this._worldMatrixRest;
    }
    const transform = this.entity.getTransform();
    if (this.__parent == null || this.toMakeWorldMatrixTheSameAsLocalMatrix) {
      transform.getLocalMatrixInnerTo(this._worldMatrixRest);
    } else {
      const matrixFromAncestorToParent = this.__parent.__calcWorldMatrixRestRecursively();
      transform.getLocalMatrixInnerTo(_SceneGraphComponent.__tmp_mat4_3);
      MutableMatrix44.multiplyTo(matrixFromAncestorToParent, _SceneGraphComponent.__tmp_mat4_3, this._worldMatrixRest);
    }
    this.__isWorldMatrixRestUpToDate = true;
    return this._worldMatrixRest;
  }
  /**
   * Gets the world rotation quaternion by recursively combining local rotations.
   * This allocates a new quaternion. Use {@link getQuaternionRecursivelyTo}
   * when a pre-allocated output quaternion is available (e.g. in hot per-frame paths).
   * @returns The world rotation quaternion
   */
  getQuaternionRecursively() {
    return Quaternion.fromCopyQuaternion(this.getQuaternionRecursivelyTo(_SceneGraphComponent.__tmp_quat_1));
  }
  /**
   * Gets the world rotation quaternion by recursively combining local rotations
   * and stores the result in the given output quaternion without allocating.
   * @param out - The output quaternion to store the result
   * @returns The output quaternion containing the world rotation
   */
  getQuaternionRecursivelyTo(out) {
    const localRotation = this.entity.getTransform().localRotationInner;
    if (this.__parent == null) {
      return out.copyComponents(localRotation);
    }
    this.__parent.getQuaternionRecursivelyTo(_SceneGraphComponent.__tmp_quat_0);
    return Quaternion.multiplyTo(_SceneGraphComponent.__tmp_quat_0, localRotation, out);
  }
  /**
   * Gets the world position of this node.
   * @returns The world position as a Vector3
   */
  get worldPosition() {
    const zeroVector = _SceneGraphComponent.__originVector3;
    this.matrixInner.multiplyVector3To(zeroVector, _SceneGraphComponent.returnVector3);
    return _SceneGraphComponent.returnVector3;
  }
  /**
   * Transforms a local position to world space.
   * @param localPosition - The position in local space
   * @returns The position in world space
   */
  getWorldPositionOf(localPosition) {
    return this.matrixInner.multiplyVector3(localPosition);
  }
  /**
   * Transforms a local position to world space and stores the result in the output vector.
   * @param localPosition - The position in local space
   * @param out - The output vector to store the result
   * @returns The output vector containing the world position
   */
  getWorldPositionOfTo(localPosition, out) {
    return this.matrixInner.multiplyVector3To(localPosition, out);
  }
  /**
   * Transforms a world position to local space.
   * @param worldPosition - The position in world space
   * @returns The position in local space
   */
  getLocalPositionOf(worldPosition) {
    return Matrix44.invert(this.matrixInner).multiplyVector3(worldPosition);
  }
  /**
   * Transforms a world position to local space and stores the result in the output vector.
   * @param worldPosition - The position in world space
   * @param out - The output vector to store the result
   * @returns The output vector containing the local position
   */
  getLocalPositionOfTo(worldPosition, out) {
    return Matrix44.invertTo(this.matrixInner, _SceneGraphComponent.__tmp_mat4).multiplyVector3To(worldPosition, out);
  }
  /**
   * Gets the world-space AABB (Axis-Aligned Bounding Box) of this node.
   * @returns The world AABB of this node
   */
  getWorldAABB() {
    const aabb = new AABB();
    const meshComponent = this.entity.tryToGetMesh();
    if (Is.exist(meshComponent) && Is.exist(meshComponent.mesh)) {
      aabb.mergeAABB(meshComponent.mesh.AABB);
      AABB.multiplyMatrixTo(this.entity.getSceneGraph().matrixInner, aabb, _SceneGraphComponent.__tmpAABB);
    } else {
      _SceneGraphComponent.__tmpAABB.initialize();
    }
    const raymarchingComponent = this.entity.tryToGetRaymarching();
    if (Is.exist(raymarchingComponent)) {
      const raymarchingAABB = raymarchingComponent.calcWorldAABB();
      if (raymarchingAABB != null) {
        _SceneGraphComponent.__tmpAABB.mergeAABB(raymarchingAABB);
      }
    }
    return _SceneGraphComponent.__tmpAABB;
  }
  /**
   * Calculates the merged world AABB including all children.
   * @returns The merged world AABB of this node and all its descendants
   */
  calcWorldMergedAABB() {
    const aabb = this.getWorldAABB().clone();
    for (const child of this.children) {
      const childAABB = child.calcWorldMergedAABB();
      aabb.mergeAABB(childAABB);
    }
    this.__worldMergedAABB = aabb;
    return aabb;
  }
  /**
   * Gets the cached merged world AABB, recalculating if dirty.
   * @returns The merged world AABB of this node and all its descendants
   */
  get worldMergedAABB() {
    if (this.__isWorldAABBDirty) {
      this.calcWorldMergedAABB();
      this.__isWorldAABBDirty = false;
      _SceneGraphComponent.__aabbDirtyChainEpoch++;
    }
    return this.__worldMergedAABB;
  }
  /**
   * Gets the world-space AABB with skeletal animation applied.
   * @returns The world AABB with skeletal transformations
   */
  getWorldAABBWithSkeletal() {
    const aabb = new AABB();
    const meshComponent = this.entity.tryToGetMesh();
    if (Is.exist(meshComponent) && Is.exist(meshComponent.mesh)) {
      aabb.mergeAABB(meshComponent.mesh.AABB);
      AABB.multiplyMatrixTo(
        this.entity.getSceneGraph().entityWorldMatrixWithSkeletalInner,
        aabb,
        _SceneGraphComponent.__tmpAABB
      );
    } else {
      _SceneGraphComponent.__tmpAABB.initialize();
    }
    const raymarchingComponent = this.entity.tryToGetRaymarching();
    if (Is.exist(raymarchingComponent)) {
      const raymarchingAABB = raymarchingComponent.calcWorldAABB();
      if (raymarchingAABB != null) {
        _SceneGraphComponent.__tmpAABB.mergeAABB(raymarchingAABB);
      }
    }
    return _SceneGraphComponent.__tmpAABB;
  }
  /**
   * Calculates the merged world AABB with skeletal animation including all children.
   * @returns The merged world AABB with skeletal transformations
   */
  calcWorldMergedAABBWithSkeletal() {
    const aabb = this.getWorldAABBWithSkeletal().clone();
    for (const child of this.children) {
      const childAABB = child.calcWorldMergedAABBWithSkeletal();
      aabb.mergeAABB(childAABB);
    }
    this.__worldMergedAABBWithSkeletal = aabb;
    return aabb;
  }
  /**
   * Gets the cached merged world AABB with skeletal animation, recalculating if dirty.
   * @returns The merged world AABB with skeletal transformations
   */
  get worldMergedAABBWithSkeletal() {
    if (this.__isWorldAABBDirtyWithSkeletal) {
      this.calcWorldMergedAABBWithSkeletal();
      this.__isWorldAABBDirtyWithSkeletal = false;
      _SceneGraphComponent.__aabbDirtyChainEpoch++;
    }
    return this.__worldMergedAABBWithSkeletal;
  }
  /**
   * Performs ray casting against all mesh and raymarching components in this hierarchy.
   *
   * @param srcPointInWorld - The ray origin point in world space
   * @param directionInWorld - The ray direction vector in world space (should be normalized)
   * @param dotThreshold - Threshold for triangle-ray intersection angle (default: 0)
   * @param ignoreMeshComponents - Array of mesh components to exclude from ray casting (default: [])
   * @returns Ray casting result containing intersection information
   */
  castRay(srcPointInWorld, directionInWorld, dotThreshold = 0, ignoreMeshComponents = []) {
    const collectedSgComponents = flattenHierarchy(this, false);
    const meshComponents = [];
    for (const sg of collectedSgComponents) {
      const mesh = sg.entity.tryToGetMesh();
      if (mesh) {
        meshComponents.push(mesh);
      }
    }
    let rayDistance = Number.MAX_VALUE;
    let intersectedPosition;
    let selectedMeshComponent;
    let selectedRaymarchingComponent;
    let u = 0;
    let v = 0;
    for (const meshComponent of meshComponents) {
      if (!meshComponent.entity.getSceneGraph().isVisible) {
        continue;
      }
      if (!meshComponent.isPickable) {
        continue;
      }
      if (ignoreMeshComponents.indexOf(meshComponent) !== -1) {
        continue;
      }
      const result = meshComponent.castRay(srcPointInWorld, directionInWorld, dotThreshold);
      if (Is.defined(result.data) && result.data.t < rayDistance) {
        rayDistance = result.data.t;
        intersectedPosition = result.data.position;
        selectedMeshComponent = meshComponent;
        selectedRaymarchingComponent = void 0;
        u = result.data.u;
        v = result.data.v;
      }
    }
    for (const sg of collectedSgComponents) {
      const raymarchingComponent = sg.entity.tryToGetRaymarching();
      if (raymarchingComponent == null || !raymarchingComponent.isPickable || !sg.isVisible) {
        continue;
      }
      const result = raymarchingComponent.castRay(srcPointInWorld, directionInWorld);
      if (result != null && result.t < rayDistance) {
        rayDistance = result.t;
        intersectedPosition = result.position;
        selectedMeshComponent = void 0;
        selectedRaymarchingComponent = raymarchingComponent;
        u = 0;
        v = 0;
      }
    }
    if ((Is.exist(selectedMeshComponent) || Is.exist(selectedRaymarchingComponent)) && Is.exist(intersectedPosition)) {
      return {
        result: true,
        data: {
          t: rayDistance,
          u,
          v,
          position: intersectedPosition,
          selectedMeshComponent,
          selectedRaymarchingComponent
        }
      };
    }
    return {
      result: false
    };
  }
  /**
   * Performs ray casting from screen coordinates against all mesh and raymarching components in this hierarchy.
   *
   * @param x - Screen x coordinate
   * @param y - Screen y coordinate
   * @param camera - The camera component to use for screen-to-world projection
   * @param viewport - Viewport rectangle as Vector4 (x, y, width, height)
   * @param dotThreshold - Threshold for triangle-ray intersection angle (default: 0)
   * @param ignoreMeshComponents - Array of mesh components to exclude from ray casting (default: [])
   * @returns Ray casting result containing intersection information in world space
   */
  castRayFromScreen(x, y, camera, viewport, dotThreshold = 0, ignoreMeshComponents = []) {
    const collectedSgComponents = flattenHierarchy(this, false);
    const meshComponents = [];
    for (const sg of collectedSgComponents) {
      const mesh = sg.entity.tryToGetMesh();
      if (mesh) {
        meshComponents.push(mesh);
      }
    }
    let rayDistance = Number.MAX_VALUE;
    let intersectedPosition;
    let selectedMeshComponent;
    let selectedRaymarchingComponent;
    let u = 0;
    let v = 0;
    for (const meshComponent of meshComponents) {
      if (!meshComponent.entity.getSceneGraph().isVisible) {
        continue;
      }
      if (!meshComponent.isPickable) {
        continue;
      }
      if (ignoreMeshComponents.indexOf(meshComponent) !== -1) {
        continue;
      }
      const result = meshComponent.castRayFromScreenInWorld(x, y, camera, viewport, dotThreshold);
      if (Is.defined(result.data) && result.data.t < rayDistance) {
        rayDistance = result.data.t;
        intersectedPosition = result.data.position;
        selectedMeshComponent = meshComponent;
        selectedRaymarchingComponent = void 0;
        u = result.data.u;
        v = result.data.v;
      }
    }
    for (const sg of collectedSgComponents) {
      const raymarchingComponent = sg.entity.tryToGetRaymarching();
      if (raymarchingComponent == null || !raymarchingComponent.isPickable || !sg.isVisible) {
        continue;
      }
      const result = raymarchingComponent.castRayFromScreen(x, y, camera, viewport);
      if (result.result && result.data != null && result.data.t < rayDistance) {
        rayDistance = result.data.t;
        intersectedPosition = result.data.position;
        selectedMeshComponent = void 0;
        selectedRaymarchingComponent = raymarchingComponent;
        u = 0;
        v = 0;
      }
    }
    if ((Is.exist(selectedMeshComponent) || Is.exist(selectedRaymarchingComponent)) && Is.exist(intersectedPosition)) {
      return {
        result: true,
        data: {
          t: rayDistance,
          u,
          v,
          position: intersectedPosition,
          selectedMeshComponent,
          selectedRaymarchingComponent
        }
      };
    }
    return {
      result: false
    };
  }
  /**
   * Loads the component and moves to the Logic stage.
   */
  $load() {
    this.moveStageTo(ProcessStage.Logic);
  }
  /**
   * Executes logic stage processing including matrix updates and gizmo updates.
   */
  $logic() {
    if (this.__settledWorldMatrixVersion === this.__worldMatrixVersion && this.__isWorldMatrixUpToDate && !this.__hasGizmos && this.__settledComponentCreationCount === this.__engine.componentRepository._componentCreationCount) {
      return;
    }
    if (this.__lastTransformComponentsUpdateCount === TransformComponent.getUpdateCount(this.__engine)) {
      return;
    }
    this.logicForce();
    this.__lastTransformComponentsUpdateCount = TransformComponent.getUpdateCount(this.__engine);
  }
  logicForce() {
    this.matrixInner;
    if (this.entity.tryToGetMesh() != null) {
      this.normalMatrixInner;
    }
    this.__updateGizmos();
    this.__settledWorldMatrixVersion = this.__worldMatrixVersion;
    this.__settledComponentCreationCount = this.__engine.componentRepository._componentCreationCount;
  }
  /**
   * Updates all active gizmos for this scene graph node.
   */
  __updateGizmos() {
    if (!this.__hasGizmos) {
      return;
    }
    if (Is.exist(this.__aabbGizmo) && this.__aabbGizmo.isSetup && this.__aabbGizmo.isVisible) {
      this.__aabbGizmo._update();
    }
    if (Is.exist(this.__locatorGizmo) && this.__locatorGizmo.isSetup && this.__locatorGizmo.isVisible) {
      this.__locatorGizmo._update();
    }
    this.__updateTransformGizmos();
    if (Is.exist(this.__jointGizmo) && this.__jointGizmo.isSetup && this.__jointGizmo.isVisible) {
      this.__jointGizmo._update();
    }
  }
  /**
   * Updates the translation, rotation and scale gizmos.
   * Their size depends on the camera, so this is also called when only the camera changed.
   */
  __updateTransformGizmos() {
    if (Is.exist(this.__translationGizmo) && this.__translationGizmo.isSetup && this.__translationGizmo.isVisible) {
      this.__translationGizmo._update();
    }
    if (Is.exist(this.__rotationGizmo) && this.__rotationGizmo.isSetup && this.__rotationGizmo.isVisible) {
      this.__rotationGizmo._update();
    }
    if (Is.exist(this.__scaleGizmo) && this.__scaleGizmo.isSetup && this.__scaleGizmo.isVisible) {
      this.__scaleGizmo._update();
    }
  }
  /**
   * Checks whether any transform gizmo is set up and visible on this node.
   * @returns True if at least one of the translation/rotation/scale gizmos is visible
   */
  __hasVisibleTransformGizmo() {
    return Is.exist(this.__translationGizmo) && this.__translationGizmo.isSetup && this.__translationGizmo.isVisible || Is.exist(this.__rotationGizmo) && this.__rotationGizmo.isSetup && this.__rotationGizmo.isVisible || Is.exist(this.__scaleGizmo) && this.__scaleGizmo.isSetup && this.__scaleGizmo.isVisible;
  }
  /**
   * Registers this node as an owner of a visible transform gizmo so that the
   * gizmos can be rescaled when only the camera changed.
   */
  __registerTransformGizmoOwner() {
    const engineUid = this.__engine.objectUID;
    let owners = _SceneGraphComponent.__transformGizmoOwners.get(engineUid);
    if (owners == null) {
      owners = /* @__PURE__ */ new Set();
      _SceneGraphComponent.__transformGizmoOwners.set(engineUid, owners);
    }
    owners.add(this);
  }
  /**
   * Removes this node from the transform gizmo registry when no transform gizmo is visible.
   */
  __unregisterTransformGizmoOwnerIfNeeded() {
    var _a;
    if (!this.__hasVisibleTransformGizmo()) {
      (_a = _SceneGraphComponent.__transformGizmoOwners.get(this.__engine.objectUID)) == null ? void 0 : _a.delete(this);
    }
  }
  /**
   * Re-applies the screen-space gizmo scale after the camera has been updated.
   *
   * The transform gizmos keep a constant on-screen size, so they must be rescaled whenever the
   * camera changes. SceneGraphComponent (TID 4) is processed before CameraComponent (TID 9) in
   * the Logic stage, so this is called by the Engine right after the Logic stage has finished,
   * which also covers frames in which the Engine skips the Logic stage entirely.
   *
   * @param engine - The engine whose current camera may have changed
   * @internal
   */
  static _updateTransformGizmosByCameraChange(engine) {
    const componentSID = CameraComponent.getCurrent(engine);
    const updateCount = CameraComponent.getCurrentCameraUpdateCount(engine);
    const engineUid = engine.objectUID;
    const lastCameraState = _SceneGraphComponent.__lastCameraStateMap.get(engineUid);
    if (lastCameraState != null && lastCameraState.componentSID === componentSID && lastCameraState.updateCount === updateCount) {
      return;
    }
    _SceneGraphComponent.__lastCameraStateMap.set(engineUid, { componentSID, updateCount });
    const owners = _SceneGraphComponent.__transformGizmoOwners.get(engineUid);
    if (owners == null) {
      return;
    }
    for (const sceneGraph of owners) {
      sceneGraph.__updateTransformGizmos();
    }
  }
  /**
   * Sets the world position without updating physics simulation.
   * @param vec - The world position to set
   */
  setPositionWithoutPhysics(vec) {
    if (Is.not.exist(this.__parent)) {
      this.entity.getTransform().localPositionWithoutPhysics = vec;
    } else {
      MutableMatrix44.invertTo(this.__parent.entity.getSceneGraph().matrixInner, _SceneGraphComponent.__tmp_mat4);
      this.entity.getTransform().localPositionWithoutPhysics = _SceneGraphComponent.__tmp_mat4.multiplyVector3(vec);
    }
  }
  /**
   * Sets the world position and updates physics simulation if present.
   * @param vec - The world position to set
   */
  set position(vec) {
    this.setPositionWithoutPhysics(vec);
    this.setPositionToPhysics(vec);
  }
  /**
   * Updates the physics simulation with the new position.
   * @param vec - The world position to set in physics
   */
  setPositionToPhysics(vec) {
    var _a, _b;
    const physicsComponent = this.entity.tryToGetPhysics();
    if (physicsComponent !== void 0) {
      if (physicsComponent.strategy !== void 0) {
        (_b = (_a = physicsComponent.strategy).setPosition) == null ? void 0 : _b.call(_a, vec);
      }
    }
    this.__syncDescendantPhysicsTransforms(true, false, false);
  }
  /**
   * Gets the world position of this node.
   * @returns The world position
   */
  get position() {
    return this.matrixInner.getTranslate();
  }
  /**
   * Gets the world position and stores it in the output vector.
   * @param outVec - The output vector to store the position
   * @returns The output vector containing the world position
   */
  getPositionTo(outVec) {
    return this.matrixInner.getTranslateTo(outVec);
  }
  /**
   * Gets the world position in rest pose.
   * @returns The world position in rest pose
   */
  get positionRest() {
    return this.matrixRestInner.getTranslate();
  }
  /**
   * Gets the world position in rest pose and stores it in the output vector.
   * @param outVec - The output vector to store the position
   * @returns The output vector containing the world position in rest pose
   */
  getPositionRestTo(outVec) {
    return this.matrixRestInner.getTranslateTo(outVec);
  }
  /**
   * Sets the world rotation using Euler angles and updates physics simulation if present.
   * @param vec - The Euler angles (in radians) to set
   */
  set eulerAngles(vec) {
    if (Is.not.exist(this.__parent)) {
      this.entity.getTransform().localEulerAnglesWithoutPhysics = vec;
    } else {
      const quat = Quaternion.fromMatrix(this.__parent.entity.getSceneGraph().matrixInner);
      const invQuat = Quaternion.invert(quat);
      const rotation = Quaternion.fromMatrix(Matrix44.rotate(vec));
      const result = Quaternion.multiply(rotation, invQuat);
      this.entity.getTransform().localEulerAnglesWithoutPhysics = result.toEulerAngles();
    }
    this.setEulerAnglesToPhysics(vec);
  }
  /**
   * Updates the physics simulation with the new Euler angles.
   * @param vec - The Euler angles (in radians) to set in physics
   */
  setEulerAnglesToPhysics(vec) {
    const physicsComponent = this.entity.tryToGetPhysics();
    if (physicsComponent !== void 0) {
      if (physicsComponent.strategy !== void 0) {
        const strategy = physicsComponent.strategy;
        if (strategy.setEulerAngle != null) {
          strategy.setEulerAngle(vec);
        } else if (strategy.setRotation != null) {
          strategy.setRotation(Quaternion.fromMatrix(Matrix44.rotate(vec)));
        }
      }
    }
    this.__syncPhysicsTransformsAfterRotation();
  }
  /**
   * Gets the world rotation as Euler angles.
   * @returns The world rotation as Euler angles (in radians)
   */
  get eulerAngles() {
    return this.matrixInner.toEulerAngles();
  }
  /**
   * Sets the world rotation without updating physics simulation.
   * @param quat - The quaternion rotation to set
   */
  setRotationWithoutPhysics(quat) {
    if (Is.not.exist(this.__parent)) {
      this.entity.getTransform().localRotationWithoutPhysics = quat;
    } else {
      const quatInner = this.__parent.entity.getSceneGraph().rotation;
      const invQuat = Quaternion.invert(quatInner);
      this.entity.getTransform().localRotationWithoutPhysics = Quaternion.multiply(quat, invQuat);
    }
  }
  /**
   * Sets the world rotation and updates physics simulation if present.
   * @param quat - The quaternion rotation to set
   */
  set rotation(quat) {
    this.setRotationWithoutPhysics(quat);
    this.setRotationToPhysics(quat);
  }
  /**
   * Updates the physics simulation with the new rotation.
   * @param quat - The quaternion rotation to set in physics
   */
  setRotationToPhysics(quat) {
    const physicsComponent = this.entity.tryToGetPhysics();
    if (physicsComponent !== void 0) {
      if (physicsComponent.strategy !== void 0) {
        const strategy = physicsComponent.strategy;
        if (strategy.setRotation != null) {
          strategy.setRotation(quat);
        } else if (strategy.setEulerAngle != null) {
          strategy.setEulerAngle(quat.toEulerAnglesTo(_SceneGraphComponent.__tmp_euler));
        }
      }
    }
    this.__syncPhysicsTransformsAfterRotation();
  }
  __syncPhysicsTransformsAfterRotation() {
    var _a;
    const strategy = (_a = this.entity.tryToGetPhysics()) == null ? void 0 : _a.strategy;
    if ((strategy == null ? void 0 : strategy.setScale) != null) {
      this.matrixInner;
      this.setWorldMatrixDirty();
      strategy.setScale(this._getPhysicsWorldScale(this.matrixInner));
    }
    this.__syncDescendantPhysicsTransforms(true, true, true);
  }
  /**
   * Updates the cached world rotation if it is dirty.
   * This avoids repeated recursive traversal across the hierarchy.
   */
  __getWorldRotationInner() {
    const localRotation = this.entity.getTransform().localRotationInner;
    if (this.__parent == null || this.toMakeWorldMatrixTheSameAsLocalMatrix) {
      if (!this.__isWorldRotationUpToDate) {
        this._worldRotation.copyComponents(localRotation);
        this.__isWorldRotationUpToDate = true;
      }
      return this._worldRotation;
    }
    if (!this.__isWorldRotationUpToDate) {
      Quaternion.multiplyTo(this.__parent.__getWorldRotationInner(), localRotation, this._worldRotation);
      this.__isWorldRotationUpToDate = true;
    }
    return this._worldRotation;
  }
  /**
   * Gets the world rotation as a quaternion.
   * @returns The world rotation quaternion
   */
  get rotation() {
    return this.rotationInner.clone();
  }
  get rotationInner() {
    if (this.__parent == null || this.toMakeWorldMatrixTheSameAsLocalMatrix) {
      return this.entity.getTransform().localRotationInner;
    }
    return this.__getWorldRotationInner();
  }
  /**
   * Gets the world rotation and stores it in the output quaternion.
   * @param outQuat - The output quaternion to store the rotation
   * @returns The output quaternion containing the world rotation
   */
  getRotationTo(outQuat) {
    const worldRotation = this.__getWorldRotationInner();
    outQuat.setComponents(worldRotation._v[0], worldRotation._v[1], worldRotation._v[2], worldRotation._v[3]);
    return outQuat;
  }
  /**
   * Gets the world rotation in rest pose.
   * @returns The world rotation quaternion in rest pose
   */
  get rotationRest() {
    const parent = this.parent;
    if (parent != null) {
      return Quaternion.multiply(parent.rotationRest, this.entity.getTransform().localRotationRestInner);
    }
    return this.entity.getTransform().localRotationRestInner;
  }
  /**
   * Gets the world rotation in rest pose with conditional termination.
   * @param endFn - Function to determine if recursion should stop at this node
   * @returns The world rotation quaternion in rest pose
   */
  getRotationRest(endFn) {
    const parent = this.parent;
    if (parent != null && !endFn(this)) {
      return Quaternion.multiply(parent.getRotationRest(endFn), this.entity.getTransform().localRotationRestInner);
    }
    return Quaternion.identity();
  }
  /**
   * Sets the world scale and updates physics simulation if present.
   * @param vec - The scale vector to set
   */
  set scale(vec) {
    if (Is.not.exist(this.__parent)) {
      this.entity.getTransform().localScaleWithoutPhysics = vec;
    } else {
      const mat = this.__parent.entity.getSceneGraph().matrix;
      mat._v[12] = 0;
      mat._v[13] = 0;
      mat._v[14] = 0;
      const invMat = MutableMatrix44.invert(mat);
      this.entity.getTransform().localScaleWithoutPhysics = invMat.multiplyVector3(vec);
    }
    this.setScaleToPhysics(vec);
  }
  /**
   * Updates the physics simulation with the new scale.
   * @param vec - The scale vector to set in physics
   */
  setScaleToPhysics(vec) {
    var _a, _b;
    const physicsComponent = this.entity.tryToGetPhysics();
    if (physicsComponent !== void 0) {
      if (physicsComponent.strategy !== void 0) {
        (_b = (_a = physicsComponent.strategy).setScale) == null ? void 0 : _b.call(_a, vec);
      }
    }
    this.__syncDescendantPhysicsTransforms(true, true, true);
  }
  /**
   * Gets the world scale of this node.
   * @returns The world scale vector
   */
  get scale() {
    return this.matrixInner.getScale();
  }
  /**
   * Resolves world-scale magnitudes with signs relative to the entity's proper world rotation.
   * Physics bodies use that rotation separately, so reflected local offsets need these signs.
   *
   * The returned vector is a shared reusable instance, so callers must copy it
   * when they need to keep the values around.
   * @internal
   */
  _getPhysicsWorldScale(matrix = this.matrixInner) {
    const rotation = this.getQuaternionRecursivelyTo(_SceneGraphComponent.__tmp_quat_2);
    const axisX = rotation.transformVector3To(_SceneGraphComponent.__axisX, _SceneGraphComponent.__tmp_vec3_0);
    const axisY = rotation.transformVector3To(_SceneGraphComponent.__axisY, _SceneGraphComponent.__tmp_vec3_1);
    const axisZ = rotation.transformVector3To(_SceneGraphComponent.__axisZ, _SceneGraphComponent.__tmp_vec3_2);
    const scale = matrix.getScaleTo(_SceneGraphComponent.__tmp_matrixScale);
    const projectionX = matrix.m00 * axisX.x + matrix.m10 * axisX.y + matrix.m20 * axisX.z;
    const projectionY = matrix.m01 * axisY.x + matrix.m11 * axisY.y + matrix.m21 * axisY.z;
    const projectionZ = matrix.m02 * axisZ.x + matrix.m12 * axisZ.y + matrix.m22 * axisZ.z;
    return _SceneGraphComponent.__tmp_physicsWorldScale.setComponents(
      projectionX < 0 ? -scale.x : scale.x,
      projectionY < 0 ? -scale.y : scale.y,
      projectionZ < 0 ? -scale.z : scale.z
    );
  }
  /**
   * Creates a shallow copy of a child scene graph component.
   * @param child - The child component to copy
   * @returns A new scene graph entity with copied component
   */
  __copyChild(child) {
    const newChild = child.entity.engine.entityRepository._shallowCopyEntityInner(child.entity);
    newChild.getSceneGraph().__parent = this;
    _SceneGraphComponent.__bumpHierarchyVersion();
    return newChild;
  }
  /**
   * Performs a shallow copy from another SceneGraphComponent.
   * @param component_ - The source component to copy from
   */
  _shallowCopyFrom(component_) {
    const component = component_;
    this.__parent = component.__parent;
    this.__children = [];
    _SceneGraphComponent.__bumpHierarchyVersion();
    this.__physicsComponentCountInSubtree = 0;
    for (let i = 0; i < component.__children.length; i++) {
      const copyChild = this.__copyChild(component.__children[i]).getSceneGraph();
      this.__children.push(copyChild);
      this.__adjustPhysicsComponentCountInSubtree(copyChild.__physicsComponentCountInSubtree);
    }
    this.__gizmoChildren = component.__gizmoChildren.concat();
    this.__isGizmoChild = component.__isGizmoChild;
    this._worldMatrix.copyComponents(component._worldMatrix);
    this._worldMatrixRest.copyComponents(component._worldMatrixRest);
    this._normalMatrix.copyComponents(component._normalMatrix);
    this.__isWorldMatrixUpToDate = false;
    this.__isWorldMatrixRestUpToDate = false;
    this.__isNormalMatrixUpToDate = false;
    this.__isWorldRotationUpToDate = false;
    this.__worldMatrixVersion++;
    this.__worldMergedAABBWithSkeletal = component.__worldMergedAABBWithSkeletal.clone();
    this.__isWorldAABBDirty = true;
    this.__isWorldAABBDirtyWithSkeletal = true;
    this._isVisible.copyComponents(component._isVisible);
    this._isBillboard.copyComponents(component._isBillboard);
    this.__transformGizmoSpace = component.__transformGizmoSpace;
    this.__latestPrimitivePositionAccessorVersion = component.__latestPrimitivePositionAccessorVersion;
    this.toMakeWorldMatrixTheSameAsLocalMatrix = component.toMakeWorldMatrixTheSameAsLocalMatrix;
    this.isRootJoint = component.isRootJoint;
    this.jointIndex = component.jointIndex;
  }
  /**
   * Gets the entity which has this component.
   * @returns The entity which has this component
   */
  get entity() {
    return this.__engine.entityRepository.getEntity(this.__entityUid);
  }
  /**
   * Sets the coordinate space for transformation gizmos.
   * @param space - The coordinate space ('local' or 'world')
   */
  setTransformGizmoSpace(space) {
    var _a, _b, _c;
    this.__transformGizmoSpace = space;
    (_a = this.__translationGizmo) == null ? void 0 : _a.setSpace(space);
    (_b = this.__rotationGizmo) == null ? void 0 : _b.setSpace(space);
    (_c = this.__scaleGizmo) == null ? void 0 : _c.setSpace(space);
  }
  /**
   * Destroys this component and cleans up resources.
   */
  _destroy() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    super._destroy();
    _SceneGraphComponent.__bumpHierarchyVersion();
    (_a = _SceneGraphComponent.__transformGizmoOwners.get(this.__engine.objectUID)) == null ? void 0 : _a.delete(this);
    (_b = this.__aabbGizmo) == null ? void 0 : _b._destroy();
    (_c = this.__locatorGizmo) == null ? void 0 : _c._destroy();
    (_d = this.__translationGizmo) == null ? void 0 : _d._destroy();
    (_e = this.__rotationGizmo) == null ? void 0 : _e._destroy();
    (_f = this.__scaleGizmo) == null ? void 0 : _f._destroy();
    (_g = this.__jointGizmo) == null ? void 0 : _g._destroy();
    (_h = this.parent) == null ? void 0 : _h.removeChild(this);
    this.children.forEach((child) => {
      var _a2;
      return (_a2 = child.parent) == null ? void 0 : _a2.removeChild(child);
    });
  }
  /**
   * Adds this component to an entity and extends it with SceneGraph functionality.
   * @param base - The target entity to extend
   * @param _componentClass - The component class being added (unused)
   * @returns The extended entity with SceneGraph methods
   */
  addThisComponentToEntity(base, _componentClass) {
    class SceneGraphEntity extends base.constructor {
      /**
       * Gets the scene graph component for this entity.
       * @returns The scene graph component instance
       */
      getSceneGraph() {
        if (this.__sceneGraphComponent === void 0) {
          this.__sceneGraphComponent = this.getComponentByComponentTID(
            WellKnownComponentTIDs.SceneGraphComponentTID
          );
        }
        return this.__sceneGraphComponent;
      }
      /**
       * Gets the parent scene graph component of this entity.
       * @returns The parent scene graph component, or undefined if this is a root entity
       */
      get parent() {
        return this.getSceneGraph().parent;
      }
      /**
       * Gets the world transformation matrix of this entity.
       * @returns The world transformation matrix
       */
      get matrix() {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.matrix;
      }
      /**
       * Gets the internal mutable world transformation matrix of this entity.
       * @returns The internal world transformation matrix
       */
      get matrixInner() {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.matrixInner;
      }
      /**
       * Gets the world position of this entity.
       * @returns The world position vector
       */
      get position() {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.position;
      }
      /**
       * Sets the world position of this entity.
       * @param vec - The new world position vector
       */
      set position(vec) {
        const sceneGraph = this.getSceneGraph();
        sceneGraph.position = vec;
      }
      /**
       * Gets the rest pose world position of this entity.
       * @returns The rest pose world position vector
       */
      get positionRest() {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.positionRest;
      }
      /**
       * Gets the world scale of this entity.
       * @returns The world scale vector
       */
      get scale() {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.scale;
      }
      /**
       * Sets the world scale of this entity.
       * @param vec - The new world scale vector
       */
      set scale(vec) {
        const sceneGraph = this.getSceneGraph();
        sceneGraph.scale = vec;
      }
      /**
       * Gets the world euler angles of this entity.
       * @returns The world euler angles vector
       */
      get eulerAngles() {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.eulerAngles;
      }
      /**
       * Sets the world euler angles of this entity.
       * @param vec - The new world euler angles vector
       */
      set eulerAngles(vec) {
        const sceneGraph = this.getSceneGraph();
        sceneGraph.eulerAngles = vec;
      }
      /**
       * Gets the world rotation quaternion of this entity.
       * @returns The world rotation quaternion
       */
      get rotation() {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.rotation;
      }
      /**
       * Sets the world rotation quaternion of this entity.
       * @param quat - The new world rotation quaternion
       */
      set rotation(quat) {
        const sceneGraph = this.getSceneGraph();
        sceneGraph.rotation = quat;
      }
      /**
       * Gets the rest pose world rotation quaternion of this entity.
       * @returns The rest pose world rotation quaternion
       */
      get rotationRest() {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.rotationRest;
      }
      /**
       * Adds a child scene graph component to this entity.
       * @param sg - The scene graph component to add as a child
       * @param keepPoseInWorldSpace - Whether to keep the child's world pose
       */
      addChild(sg, keepPoseInWorldSpace = false) {
        const sceneGraph = this.getSceneGraph();
        sceneGraph.addChild(sg, keepPoseInWorldSpace);
      }
      /**
       * Gets all child scene graph components of this entity.
       * @returns An array of child scene graph components
       */
      get children() {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.children;
      }
      /**
       * Removes a child scene graph component from this entity.
       * @param sg - The scene graph component to remove from children
       */
      removeChild(sg) {
        const sceneGraph = this.getSceneGraph();
        sceneGraph.removeChild(sg);
      }
    }
    applyMixins(base, SceneGraphEntity);
    return base;
  }
  /**
   * Cleans up static resources associated with the specified engine.
   * @param engine - The engine instance to clean up resources for
   * @internal
   */
  static _cleanupForEngine(engine) {
    _SceneGraphComponent.__updateCountMap.delete(engine);
    _SceneGraphComponent.__transformGizmoOwners.delete(engine.objectUID);
    _SceneGraphComponent.__lastCameraStateMap.delete(engine.objectUID);
  }
};
_SceneGraphComponent.__hierarchyVersion = 0;
/**
 * Validity epoch of the per-node `__aabbDirtyChainEpoch` marks. Advancing it invalidates all marks at
 * once; this is required whenever an AABB-dirty flag is cleared or a parent-child link changes, since
 * either can break the "this node and all ancestors are AABB-dirty" guarantee of a mark.
 */
_SceneGraphComponent.__aabbDirtyChainEpoch = 1;
_SceneGraphComponent.__originVector3 = Vector3.zero();
_SceneGraphComponent.__axisX = Vector3.fromCopy3(1, 0, 0);
_SceneGraphComponent.__axisY = Vector3.fromCopy3(0, 1, 0);
_SceneGraphComponent.__axisZ = Vector3.fromCopy3(0, 0, 1);
_SceneGraphComponent.returnVector3 = MutableVector3.zero();
_SceneGraphComponent.__sceneGraphs = [];
_SceneGraphComponent.invertedMatrix44 = MutableMatrix44.fromCopyArray16ColumnMajor([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0
]);
_SceneGraphComponent.__tmp_mat4 = MutableMatrix44.identity();
_SceneGraphComponent.__tmp_mat4_3 = MutableMatrix44.identity();
_SceneGraphComponent.__tmp_mat4_4 = MutableMatrix44.identity();
_SceneGraphComponent.__tmp_quat_0 = MutableQuaternion.identity();
_SceneGraphComponent.__tmp_quat_1 = MutableQuaternion.identity();
_SceneGraphComponent.__tmp_quat_2 = MutableQuaternion.identity();
_SceneGraphComponent.__tmp_quat_3 = MutableQuaternion.identity();
_SceneGraphComponent.__tmp_vec3_0 = MutableVector3.zero();
_SceneGraphComponent.__tmp_vec3_1 = MutableVector3.zero();
_SceneGraphComponent.__tmp_vec3_2 = MutableVector3.zero();
_SceneGraphComponent.__tmp_matrixScale = MutableVector3.one();
_SceneGraphComponent.__tmp_physicsWorldScale = MutableVector3.one();
_SceneGraphComponent.__tmp_euler = MutableVector3.zero();
_SceneGraphComponent.__tmp_translate = MutableVector3.zero();
/** Map to store update count per Engine instance for multi-engine support */
_SceneGraphComponent.__updateCountMap = /* @__PURE__ */ new Map();
_SceneGraphComponent.__tmpAABB = new AABB();
/** Scene graphs that currently own a visible transform gizmo, keyed by engine.objectUID. */
_SceneGraphComponent.__transformGizmoOwners = /* @__PURE__ */ new Map();
/** Last camera identity and update count applied to the transform gizmos, keyed by engine.objectUID. */
_SceneGraphComponent.__lastCameraStateMap = /* @__PURE__ */ new Map();
var SceneGraphComponent = _SceneGraphComponent;
SceneGraphComponent.registerMember({
  bufferUse: BufferUse.GPUInstanceData,
  memberName: "worldMatrix",
  dataClassType: MutableMatrix44,
  shaderType: ShaderType.VertexAndPixelShader,
  compositionType: CompositionType.Mat4,
  componentType: ComponentType.Float,
  initValues: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
});
SceneGraphComponent.registerMember({
  bufferUse: BufferUse.GPUInstanceData,
  memberName: "normalMatrix",
  dataClassType: MutableMatrix33,
  shaderType: ShaderType.VertexAndPixelShader,
  compositionType: CompositionType.Mat3,
  componentType: ComponentType.Float,
  initValues: [1, 0, 0, 0, 1, 0, 0, 0, 1]
});
SceneGraphComponent.registerMember({
  bufferUse: BufferUse.GPUInstanceData,
  memberName: "isVisible",
  dataClassType: MutableScalar,
  shaderType: ShaderType.VertexShader,
  compositionType: CompositionType.Scalar,
  componentType: ComponentType.Float,
  initValues: [1],
  convertToBool: true
});
SceneGraphComponent.registerMember({
  bufferUse: BufferUse.GPUInstanceData,
  memberName: "isBillboard",
  dataClassType: MutableScalar,
  shaderType: ShaderType.VertexShader,
  compositionType: CompositionType.Scalar,
  componentType: ComponentType.Float,
  initValues: [0],
  convertToBool: true
});
export {
  SceneGraphComponent
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29tcG9uZW50cy9TY2VuZUdyYXBoL1NjZW5lR3JhcGhDb21wb25lbnQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgQ29tcG9uZW50U0lELCBDb21wb25lbnRUSUQsIEVudGl0eVVJRCB9IGZyb20gJy4uLy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4uLy4uL2NvcmUvQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgSUVudGl0eSB9IGZyb20gJy4uLy4uL2NvcmUvRW50aXR5JztcbmltcG9ydCB7IGFwcGx5TWl4aW5zLCB0eXBlIEVudGl0eVJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9jb3JlL0VudGl0eVJlcG9zaXRvcnknO1xuaW1wb3J0IHsgQnVmZmVyVXNlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvQnVmZmVyVXNlJztcbmltcG9ydCB7IENvbXBvbmVudFR5cGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Db21wb25lbnRUeXBlJztcbmltcG9ydCB7IENvbXBvc2l0aW9uVHlwZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL0NvbXBvc2l0aW9uVHlwZSc7XG5pbXBvcnQgeyBQcm9jZXNzU3RhZ2UgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Qcm9jZXNzU3RhZ2UnO1xuaW1wb3J0IHsgU2hhZGVyVHlwZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1NoYWRlclR5cGUnO1xuaW1wb3J0IHR5cGUgeyBSYXljYXN0UmVzdWx0RXgyIH0gZnJvbSAnLi4vLi4vZ2VvbWV0cnkvdHlwZXMvR2VvbWV0cnlUeXBlcyc7XG5pbXBvcnQgdHlwZSB7IEFBQkJHaXptbyB9IGZyb20gJy4uLy4uL2dpem1vcy9BQUJCR2l6bW8nO1xuaW1wb3J0IHsgX2dldEdpem1vQ2xhc3MgfSBmcm9tICcuLi8uLi9naXptb3MvR2l6bW9SZWdpc3RyeSc7XG5pbXBvcnQgdHlwZSB7IEpvaW50R2l6bW8gfSBmcm9tICcuLi8uLi9naXptb3MvSm9pbnRHaXptbyc7XG5pbXBvcnQgdHlwZSB7IExvY2F0b3JHaXptbyB9IGZyb20gJy4uLy4uL2dpem1vcy9Mb2NhdG9yR2l6bW8nO1xuaW1wb3J0IHR5cGUgeyBSb3RhdGlvbkdpem1vIH0gZnJvbSAnLi4vLi4vZ2l6bW9zL1JvdGF0aW9uR2l6bW8nO1xuaW1wb3J0IHR5cGUgeyBTY2FsZUdpem1vIH0gZnJvbSAnLi4vLi4vZ2l6bW9zL1NjYWxlR2l6bW8nO1xuaW1wb3J0IHR5cGUgeyBUcmFuc2xhdGlvbkdpem1vIH0gZnJvbSAnLi4vLi4vZ2l6bW9zL1RyYW5zbGF0aW9uR2l6bW8nO1xuaW1wb3J0IHR5cGUgeyBJU2NlbmVHcmFwaEVudGl0eSB9IGZyb20gJy4uLy4uL2hlbHBlcnMvRW50aXR5SGVscGVyJztcbmltcG9ydCB7IEFBQkIgfSBmcm9tICcuLi8uLi9tYXRoL0FBQkInO1xuaW1wb3J0IHR5cGUgeyBJTWF0cml4NDQgfSBmcm9tICcuLi8uLi9tYXRoL0lNYXRyaXgnO1xuaW1wb3J0IHR5cGUgeyBJTXV0YWJsZVF1YXRlcm5pb24sIElRdWF0ZXJuaW9uIH0gZnJvbSAnLi4vLi4vbWF0aC9JUXVhdGVybmlvbic7XG5pbXBvcnQgdHlwZSB7IElWZWN0b3IzIH0gZnJvbSAnLi4vLi4vbWF0aC9JVmVjdG9yJztcbmltcG9ydCB7IE1hdHJpeDQ0IH0gZnJvbSAnLi4vLi4vbWF0aC9NYXRyaXg0NCc7XG5pbXBvcnQgeyBNdXRhYmxlTWF0cml4MzMgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVNYXRyaXgzMyc7XG5pbXBvcnQgeyBNdXRhYmxlTWF0cml4NDQgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVNYXRyaXg0NCc7XG5pbXBvcnQgeyBNdXRhYmxlUXVhdGVybmlvbiB9IGZyb20gJy4uLy4uL21hdGgvTXV0YWJsZVF1YXRlcm5pb24nO1xuaW1wb3J0IHsgTXV0YWJsZVNjYWxhciB9IGZyb20gJy4uLy4uL21hdGgvTXV0YWJsZVNjYWxhcic7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yMyB9IGZyb20gJy4uLy4uL21hdGgvTXV0YWJsZVZlY3RvcjMnO1xuaW1wb3J0IHsgUXVhdGVybmlvbiB9IGZyb20gJy4uLy4uL21hdGgvUXVhdGVybmlvbic7XG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAnLi4vLi4vbWF0aC9WZWN0b3IzJztcbmltcG9ydCB0eXBlIHsgVmVjdG9yNCB9IGZyb20gJy4uLy4uL21hdGgvVmVjdG9yNCc7XG5pbXBvcnQgeyBJcyB9IGZyb20gJy4uLy4uL21pc2MvSXMnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi8uLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB7IENhbWVyYUNvbXBvbmVudCB9IGZyb20gJy4uL0NhbWVyYS9DYW1lcmFDb21wb25lbnQnO1xuaW1wb3J0IHR5cGUgeyBDb21wb25lbnRUb0NvbXBvbmVudE1ldGhvZHMgfSBmcm9tICcuLi9Db21wb25lbnRUeXBlcyc7XG5pbXBvcnQgdHlwZSB7IE1lc2hDb21wb25lbnQgfSBmcm9tICcuLi9NZXNoL01lc2hDb21wb25lbnQnO1xuaW1wb3J0IHsgVHJhbnNmb3JtQ29tcG9uZW50IH0gZnJvbSAnLi4vVHJhbnNmb3JtL1RyYW5zZm9ybUNvbXBvbmVudCc7XG5pbXBvcnQgeyBXZWxsS25vd25Db21wb25lbnRUSURzIH0gZnJvbSAnLi4vV2VsbEtub3duQ29tcG9uZW50VElEcyc7XG5pbXBvcnQgeyBmbGF0dGVuSGllcmFyY2h5IH0gZnJvbSAnLi9TY2VuZUdyYXBoT3BzJztcblxuLyoqXG4gKiBTY2VuZUdyYXBoQ29tcG9uZW50IGlzIGEgY29tcG9uZW50IHRoYXQgcmVwcmVzZW50cyBhIG5vZGUgaW4gdGhlIHNjZW5lIGdyYXBoLlxuICogSXQgbWFuYWdlcyBoaWVyYXJjaGljYWwgcmVsYXRpb25zaGlwcyBiZXR3ZWVuIGVudGl0aWVzIGFuZCBoYW5kbGVzIHdvcmxkIG1hdHJpeCBjYWxjdWxhdGlvbnMuXG4gKi9cbmV4cG9ydCBjbGFzcyBTY2VuZUdyYXBoQ29tcG9uZW50IGV4dGVuZHMgQ29tcG9uZW50IHtcbiAgcHJpdmF0ZSBfX3BhcmVudD86IFNjZW5lR3JhcGhDb21wb25lbnQ7XG4gIHByaXZhdGUgX19jaGlsZHJlbjogU2NlbmVHcmFwaENvbXBvbmVudFtdID0gW107XG4gIHByaXZhdGUgX19naXptb0NoaWxkcmVuOiBTY2VuZUdyYXBoQ29tcG9uZW50W10gPSBbXTtcbiAgLyoqIFRydWUgd2hpbGUgdGhpcyBub2RlIGlzIGF0dGFjaGVkIHRvIGl0cyBwYXJlbnQgYXMgYSBnaXptbyBjaGlsZCAoc2VlIF9hZGRHaXptb0NoaWxkKS4gKi9cbiAgcHJpdmF0ZSBfX2lzR2l6bW9DaGlsZCA9IGZhbHNlO1xuICBwcml2YXRlIF9fcGh5c2ljc0NvbXBvbmVudENvdW50SW5TdWJ0cmVlID0gMDtcbiAgcHJpdmF0ZSBzdGF0aWMgX19oaWVyYXJjaHlWZXJzaW9uID0gMDtcbiAgLyoqXG4gICAqIFZhbGlkaXR5IGVwb2NoIG9mIHRoZSBwZXItbm9kZSBgX19hYWJiRGlydHlDaGFpbkVwb2NoYCBtYXJrcy4gQWR2YW5jaW5nIGl0IGludmFsaWRhdGVzIGFsbCBtYXJrcyBhdFxuICAgKiBvbmNlOyB0aGlzIGlzIHJlcXVpcmVkIHdoZW5ldmVyIGFuIEFBQkItZGlydHkgZmxhZyBpcyBjbGVhcmVkIG9yIGEgcGFyZW50LWNoaWxkIGxpbmsgY2hhbmdlcywgc2luY2VcbiAgICogZWl0aGVyIGNhbiBicmVhayB0aGUgXCJ0aGlzIG5vZGUgYW5kIGFsbCBhbmNlc3RvcnMgYXJlIEFBQkItZGlydHlcIiBndWFyYW50ZWUgb2YgYSBtYXJrLlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19hYWJiRGlydHlDaGFpbkVwb2NoID0gMTtcbiAgcHJpdmF0ZSBfd29ybGRNYXRyaXg6IE11dGFibGVNYXRyaXg0NCA9IE11dGFibGVNYXRyaXg0NC5kdW1teSgpO1xuICBwcml2YXRlIF93b3JsZE1hdHJpeFJlc3Q6IE11dGFibGVNYXRyaXg0NCA9IE11dGFibGVNYXRyaXg0NC5pZGVudGl0eSgpO1xuICBwcml2YXRlIF9ub3JtYWxNYXRyaXg6IE11dGFibGVNYXRyaXgzMyA9IE11dGFibGVNYXRyaXgzMy5kdW1teSgpO1xuICBwcml2YXRlIF93b3JsZFJvdGF0aW9uOiBNdXRhYmxlUXVhdGVybmlvbiA9IE11dGFibGVRdWF0ZXJuaW9uLmlkZW50aXR5KCk7XG4gIHByaXZhdGUgX19pc1dvcmxkTWF0cml4VXBUb0RhdGUgPSBmYWxzZTtcbiAgLyoqXG4gICAqIE1vbm90b25pY2FsbHkgaW5jcmVhc2luZyBjb3VudGVyIHRoYXQgYWR2YW5jZXMgd2hlbmV2ZXIgdGhpcyBub2RlJ3Mgd29ybGQgbWF0cml4IGlzIGludmFsaWRhdGVkLlxuICAgKiBDb25zdW1lcnMgc3VjaCBhcyBTa2VsZXRhbENvbXBvbmVudCBzdW0gdGhlc2UgY291bnRlcnMgdG8gZGV0ZWN0IHdoZXRoZXIgYW55IGlucHV0IGNoYW5nZWQuXG4gICAqL1xuICBwcml2YXRlIF9fd29ybGRNYXRyaXhWZXJzaW9uID0gMDtcbiAgcHJpdmF0ZSBfX2lzV29ybGRNYXRyaXhSZXN0VXBUb0RhdGUgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX2lzTm9ybWFsTWF0cml4VXBUb0RhdGUgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX2lzV29ybGRSb3RhdGlvblVwVG9EYXRlID0gZmFsc2U7XG4gIHByaXZhdGUgX193b3JsZE1lcmdlZEFBQkJXaXRoU2tlbGV0YWwgPSBuZXcgQUFCQigpO1xuICBwcml2YXRlIF9fd29ybGRNZXJnZWRBQUJCID0gbmV3IEFBQkIoKTtcbiAgcHJpdmF0ZSBfX2lzV29ybGRBQUJCRGlydHkgPSB0cnVlO1xuICAvKiogU2VwYXJhdGUgZGlydHkgZmxhZzogdGhlIHNrZWxldGFsIGFuZCBub24tc2tlbGV0YWwgbWVyZ2VkIEFBQkJzIGFyZSBjYWNoZWQgaW5kZXBlbmRlbnRseS4gKi9cbiAgcHJpdmF0ZSBfX2lzV29ybGRBQUJCRGlydHlXaXRoU2tlbGV0YWwgPSB0cnVlO1xuICAvKipcbiAgICogRXBvY2ggYXQgd2hpY2ggdGhpcyBub2RlIHdhcyBsYXN0IHZpc2l0ZWQgYnkge0BsaW5rIHNldFdvcmxkQUFCQkRpcnR5UGFyZW50UmVjdXJzaXZlbHl9LlxuICAgKiBXaGlsZSBpdCBlcXVhbHMgdGhlIHN0YXRpYyBlcG9jaCwgdGhpcyBub2RlIGFuZCBhbGwgb2YgaXRzIGFuY2VzdG9ycyBhcmUga25vd24gdG8gYmUgQUFCQi1kaXJ0eSxcbiAgICogc28gYW4gdXB3YXJkIHByb3BhZ2F0aW9uIHJlYWNoaW5nIHRoaXMgbm9kZSBjYW4gc3RvcCBoZXJlLlxuICAgKi9cbiAgcHJpdmF0ZSBfX2FhYmJEaXJ0eUNoYWluRXBvY2ggPSAwO1xuICAvKiogYF9fd29ybGRNYXRyaXhWZXJzaW9uYCB3aGVuIGxvZ2ljRm9yY2UgbGFzdCByYW47IHdoaWxlIHVuY2hhbmdlZCwgJGxvZ2ljIGhhcyBub3RoaW5nIHRvIHVwZGF0ZS4gKi9cbiAgcHJpdmF0ZSBfX3NldHRsZWRXb3JsZE1hdHJpeFZlcnNpb24gPSAtMTtcbiAgLyoqIENvbXBvbmVudCBjcmVhdGlvbiBjb3VudCB3aGVuIGxvZ2ljRm9yY2UgbGFzdCByYW4gKGEgbWVzaCBtYXkgaGF2ZSBiZWVuIGF0dGFjaGVkIHNpbmNlKS4gKi9cbiAgcHJpdmF0ZSBfX3NldHRsZWRDb21wb25lbnRDcmVhdGlvbkNvdW50ID0gLTE7XG4gIHByaXZhdGUgX2lzVmlzaWJsZTogTXV0YWJsZVNjYWxhciA9IE11dGFibGVTY2FsYXIuZHVtbXkoKTtcbiAgcHJpdmF0ZSBfaXNCaWxsYm9hcmQ6IE11dGFibGVTY2FsYXIgPSBNdXRhYmxlU2NhbGFyLmR1bW15KCk7XG4gIHByaXZhdGUgX19hYWJiR2l6bW8/OiBBQUJCR2l6bW87XG4gIHByaXZhdGUgX19sb2NhdG9yR2l6bW8/OiBMb2NhdG9yR2l6bW87XG4gIHByaXZhdGUgX190cmFuc2xhdGlvbkdpem1vPzogVHJhbnNsYXRpb25HaXptbztcbiAgcHJpdmF0ZSBfX3JvdGF0aW9uR2l6bW8/OiBSb3RhdGlvbkdpem1vO1xuICBwcml2YXRlIF9fc2NhbGVHaXptbz86IFNjYWxlR2l6bW87XG4gIHByaXZhdGUgX19qb2ludEdpem1vPzogSm9pbnRHaXptbztcbiAgLyoqIFRydWUgd2hlbiBhbnkgZ2l6bW8gb2YgdGhpcyBub2RlIGhhcyBiZWVuIHNldCB1cDogc2tpcHMgdGhlIHBlci1mcmFtZSBnaXptbyBjaGVja3Mgb2YgcGxhaW4gbm9kZXMuICovXG4gIHByaXZhdGUgX19oYXNHaXptb3MgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX3RyYW5zZm9ybUdpem1vU3BhY2U6ICdsb2NhbCcgfCAnd29ybGQnID0gJ3dvcmxkJztcbiAgcHJpdmF0ZSBfX2xhdGVzdFByaW1pdGl2ZVBvc2l0aW9uQWNjZXNzb3JWZXJzaW9uID0gMDtcbiAgcHVibGljIHRvTWFrZVdvcmxkTWF0cml4VGhlU2FtZUFzTG9jYWxNYXRyaXggPSBmYWxzZTtcbiAgLy8gU2tlbGV0YWxcbiAgcHVibGljIGlzUm9vdEpvaW50ID0gZmFsc2U7XG4gIHB1YmxpYyBqb2ludEluZGV4ID0gLTE7XG4gIF9pc0N1bGxlZCA9IGZhbHNlO1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX29yaWdpblZlY3RvcjMgPSBWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX19heGlzWCA9IFZlY3RvcjMuZnJvbUNvcHkzKDEsIDAsIDApO1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX2F4aXNZID0gVmVjdG9yMy5mcm9tQ29weTMoMCwgMSwgMCk7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fYXhpc1ogPSBWZWN0b3IzLmZyb21Db3B5MygwLCAwLCAxKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmV0dXJuVmVjdG9yMyA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX19zY2VuZUdyYXBoczogV2Vha1JlZjxTY2VuZUdyYXBoQ29tcG9uZW50PltdID0gW107XG4gIHByaXZhdGUgc3RhdGljIGludmVydGVkTWF0cml4NDQgPSBNdXRhYmxlTWF0cml4NDQuZnJvbUNvcHlBcnJheTE2Q29sdW1uTWFqb3IoW1xuICAgIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsXG4gIF0pO1xuXG4gIHByaXZhdGUgc3RhdGljIF9fdG1wX21hdDQgPSBNdXRhYmxlTWF0cml4NDQuaWRlbnRpdHkoKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBfbWF0NF8zID0gTXV0YWJsZU1hdHJpeDQ0LmlkZW50aXR5KCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wX21hdDRfNCA9IE11dGFibGVNYXRyaXg0NC5pZGVudGl0eSgpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcF9xdWF0XzAgPSBNdXRhYmxlUXVhdGVybmlvbi5pZGVudGl0eSgpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcF9xdWF0XzEgPSBNdXRhYmxlUXVhdGVybmlvbi5pZGVudGl0eSgpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcF9xdWF0XzIgPSBNdXRhYmxlUXVhdGVybmlvbi5pZGVudGl0eSgpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcF9xdWF0XzMgPSBNdXRhYmxlUXVhdGVybmlvbi5pZGVudGl0eSgpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcF92ZWMzXzAgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wX3ZlYzNfMSA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBfdmVjM18yID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcF9tYXRyaXhTY2FsZSA9IE11dGFibGVWZWN0b3IzLm9uZSgpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcF9waHlzaWNzV29ybGRTY2FsZSA9IE11dGFibGVWZWN0b3IzLm9uZSgpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcF9ldWxlciA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBfdHJhbnNsYXRlID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuXG4gIC8qKiBNYXAgdG8gc3RvcmUgdXBkYXRlIGNvdW50IHBlciBFbmdpbmUgaW5zdGFuY2UgZm9yIG11bHRpLWVuZ2luZSBzdXBwb3J0ICovXG4gIHByaXZhdGUgc3RhdGljIF9fdXBkYXRlQ291bnRNYXA6IE1hcDxFbmdpbmUsIG51bWJlcj4gPSBuZXcgTWFwKCk7XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBBQUJCID0gbmV3IEFBQkIoKTtcblxuICBwcml2YXRlIF9fbGFzdFRyYW5zZm9ybUNvbXBvbmVudHNVcGRhdGVDb3VudCA9IC0xO1xuXG4gIC8qKiBTY2VuZSBncmFwaHMgdGhhdCBjdXJyZW50bHkgb3duIGEgdmlzaWJsZSB0cmFuc2Zvcm0gZ2l6bW8sIGtleWVkIGJ5IGVuZ2luZS5vYmplY3RVSUQuICovXG4gIHByaXZhdGUgc3RhdGljIF9fdHJhbnNmb3JtR2l6bW9Pd25lcnM6IE1hcDxudW1iZXIsIFNldDxTY2VuZUdyYXBoQ29tcG9uZW50Pj4gPSBuZXcgTWFwKCk7XG4gIC8qKiBMYXN0IGNhbWVyYSBpZGVudGl0eSBhbmQgdXBkYXRlIGNvdW50IGFwcGxpZWQgdG8gdGhlIHRyYW5zZm9ybSBnaXptb3MsIGtleWVkIGJ5IGVuZ2luZS5vYmplY3RVSUQuICovXG4gIHByaXZhdGUgc3RhdGljIF9fbGFzdENhbWVyYVN0YXRlTWFwOiBNYXA8bnVtYmVyLCB7IGNvbXBvbmVudFNJRDogQ29tcG9uZW50U0lEOyB1cGRhdGVDb3VudDogbnVtYmVyIH0+ID0gbmV3IE1hcCgpO1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IFNjZW5lR3JhcGhDb21wb25lbnQgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBlbnRpdHlVaWQgLSBUaGUgdW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIGVudGl0eSB0aGlzIGNvbXBvbmVudCBiZWxvbmdzIHRvXG4gICAqIEBwYXJhbSBjb21wb25lbnRTaWQgLSBUaGUgY29tcG9uZW50IGluc3RhbmNlIGlkZW50aWZpZXJcbiAgICogQHBhcmFtIGVudGl0eVJlcG9zaXRvcnkgLSBUaGUgZW50aXR5IHJlcG9zaXRvcnkgbWFuYWdpbmcgdGhpcyBjb21wb25lbnRcbiAgICogQHBhcmFtIGlzUmVVc2UgLSBXaGV0aGVyIHRoaXMgY29tcG9uZW50IGlzIGJlaW5nIHJldXNlZFxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgZW50aXR5VWlkOiBFbnRpdHlVSUQsXG4gICAgY29tcG9uZW50U2lkOiBDb21wb25lbnRTSUQsXG4gICAgZW50aXR5UmVwb3NpdG9yeTogRW50aXR5UmVwb3NpdG9yeSxcbiAgICBpc1JlVXNlOiBib29sZWFuXG4gICkge1xuICAgIHN1cGVyKGVuZ2luZSwgZW50aXR5VWlkLCBjb21wb25lbnRTaWQsIGVudGl0eVJlcG9zaXRvcnksIGlzUmVVc2UpO1xuXG4gICAgU2NlbmVHcmFwaENvbXBvbmVudC5fX3NjZW5lR3JhcGhzLnB1c2gobmV3IFdlYWtSZWYodGhpcykpO1xuXG4gICAgdGhpcy5zdWJtaXRUb0FsbG9jYXRpb24oZW5naW5lLmNvbmZpZy5zY2VuZWdyYXBoQ29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3LCBpc1JlVXNlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2aXNpYmlsaXR5IG9mIHRoaXMgc2NlbmUgZ3JhcGggbm9kZS5cbiAgICogQHBhcmFtIGZsZyAtIFRydWUgdG8gbWFrZSB2aXNpYmxlLCBmYWxzZSB0byBoaWRlXG4gICAqL1xuICBzZXQgaXNWaXNpYmxlKGZsZzogYm9vbGVhbikge1xuICAgIHRoaXMuX2lzVmlzaWJsZS5zZXRWYWx1ZShmbGcgPyAxIDogMCk7XG4gICAgU2NlbmVHcmFwaENvbXBvbmVudC5fX2luY3JlbWVudFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHZpc2liaWxpdHkgc3RhdGUgb2YgdGhpcyBzY2VuZSBncmFwaCBub2RlLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHZpc2libGUsIGZhbHNlIGlmIGhpZGRlblxuICAgKi9cbiAgZ2V0IGlzVmlzaWJsZSgpIHtcbiAgICByZXR1cm4gdGhpcy5faXNWaXNpYmxlLmdldFZhbHVlKCkgPT09IDE7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdXBkYXRlIGNvdW50ZXIgZm9yIHNjZW5lIGdyYXBoIGNvbXBvbmVudHMgb2YgdGhlIHNwZWNpZmllZCBlbmdpbmUuXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlIHRvIGdldCB0aGUgdXBkYXRlIGNvdW50IGZvclxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCB1cGRhdGUgY291bnQgZm9yIHRoZSBzcGVjaWZpZWQgZW5naW5lXG4gICAqL1xuICBzdGF0aWMgZ2V0VXBkYXRlQ291bnQoZW5naW5lOiBFbmdpbmUpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9fdXBkYXRlQ291bnRNYXAuZ2V0KGVuZ2luZSkgPz8gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmNyZW1lbnRzIHRoZSB1cGRhdGUgY291bnRlciBmb3IgdGhlIHNwZWNpZmllZCBlbmdpbmUuXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlIHRvIGluY3JlbWVudCB0aGUgdXBkYXRlIGNvdW50IGZvclxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9faW5jcmVtZW50VXBkYXRlQ291bnQoZW5naW5lOiBFbmdpbmUpOiB2b2lkIHtcbiAgICBjb25zdCBjdXJyZW50Q291bnQgPSB0aGlzLl9fdXBkYXRlQ291bnRNYXAuZ2V0KGVuZ2luZSkgPz8gMDtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnRNYXAuc2V0KGVuZ2luZSwgY3VycmVudENvdW50ICsgMSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmlzaWJpbGl0eSBvZiB0aGlzIG5vZGUgYW5kIGFsbCBpdHMgY2hpbGRyZW4gcmVjdXJzaXZlbHkuXG4gICAqIEBwYXJhbSBmbGFnIC0gVHJ1ZSB0byBtYWtlIHZpc2libGUsIGZhbHNlIHRvIGhpZGVcbiAgICovXG4gIHNldFZpc2liaWxpdHlSZWN1cnNpdmVseShmbGFnOiBib29sZWFuKSB7XG4gICAgdGhpcy5pc1Zpc2libGUgPSBmbGFnO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5fX2NoaWxkcmVuKSB7XG4gICAgICBjaGlsZC5zZXRWaXNpYmlsaXR5UmVjdXJzaXZlbHkoZmxhZyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGJpbGxib2FyZCBzdGF0ZSBvZiB0aGlzIHNjZW5lIGdyYXBoIG5vZGUuXG4gICAqIEBwYXJhbSBmbGcgLSBUcnVlIHRvIGVuYWJsZSBiaWxsYm9hcmQgYmVoYXZpb3IsIGZhbHNlIHRvIGRpc2FibGVcbiAgICovXG4gIHNldCBpc0JpbGxib2FyZChmbGc6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9pc0JpbGxib2FyZC5zZXRWYWx1ZShmbGcgPyAxIDogMCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgYmlsbGJvYXJkIHN0YXRlIG9mIHRoaXMgc2NlbmUgZ3JhcGggbm9kZS5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiBiaWxsYm9hcmQgaXMgZW5hYmxlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBnZXQgaXNCaWxsYm9hcmQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lzQmlsbGJvYXJkLmdldFZhbHVlKCkgPT09IDE7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgYmlsbGJvYXJkIHN0YXRlIG9mIHRoaXMgbm9kZSBhbmQgYWxsIGl0cyBjaGlsZHJlbiByZWN1cnNpdmVseS5cbiAgICogQHBhcmFtIGZsZyAtIFRydWUgdG8gZW5hYmxlIGJpbGxib2FyZCBiZWhhdmlvciwgZmFsc2UgdG8gZGlzYWJsZVxuICAgKi9cbiAgc2V0SXNCaWxsYm9hcmRSZWN1cnNpdmVseShmbGc6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9pc0JpbGxib2FyZC5zZXRWYWx1ZShmbGcgPyAxIDogMCk7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiB0aGlzLl9fY2hpbGRyZW4pIHtcbiAgICAgIGNoaWxkLmlzQmlsbGJvYXJkID0gZmxnO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSBBQUJCIChBeGlzLUFsaWduZWQgQm91bmRpbmcgQm94KSBnaXptby5cbiAgICogQHBhcmFtIGZsZyAtIFRydWUgdG8gc2hvdyB0aGUgQUFCQiBnaXptbywgZmFsc2UgdG8gaGlkZSBpdFxuICAgKi9cbiAgc2V0IGlzQUFCQkdpem1vVmlzaWJsZShmbGc6IGJvb2xlYW4pIHtcbiAgICBpZiAoZmxnKSB7XG4gICAgICB0aGlzLl9faGFzR2l6bW9zID0gdHJ1ZTtcbiAgICAgIGlmIChJcy5ub3QuZGVmaW5lZCh0aGlzLl9fYWFiYkdpem1vKSkge1xuICAgICAgICB0aGlzLl9fYWFiYkdpem1vID0gbmV3IChfZ2V0R2l6bW9DbGFzcygnYWFiYicpKSh0aGlzLmVudGl0eS5lbmdpbmUsIHRoaXMuZW50aXR5KTtcbiAgICAgICAgdGhpcy5fX2FhYmJHaXptby5fc2V0dXAoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX19hYWJiR2l6bW8uaXNWaXNpYmxlID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKElzLmV4aXN0KHRoaXMuX19hYWJiR2l6bW8pKSB7XG4gICAgICAgIHRoaXMuX19hYWJiR2l6bW8uaXNWaXNpYmxlID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHZpc2liaWxpdHkgc3RhdGUgb2YgdGhlIEFBQkIgZ2l6bW8uXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIEFBQkIgZ2l6bW8gaXMgdmlzaWJsZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBnZXQgaXNBQUJCR2l6bW9WaXNpYmxlKCkge1xuICAgIGlmIChJcy5leGlzdCh0aGlzLl9fYWFiYkdpem1vKSkge1xuICAgICAgcmV0dXJuIHRoaXMuX19hYWJiR2l6bW8uaXNWaXNpYmxlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmlzaWJpbGl0eSBvZiB0aGUgbG9jYXRvciBnaXptby5cbiAgICogQHBhcmFtIGZsZyAtIFRydWUgdG8gc2hvdyB0aGUgbG9jYXRvciBnaXptbywgZmFsc2UgdG8gaGlkZSBpdFxuICAgKi9cbiAgc2V0IGlzTG9jYXRvckdpem1vVmlzaWJsZShmbGc6IGJvb2xlYW4pIHtcbiAgICBpZiAoZmxnKSB7XG4gICAgICB0aGlzLl9faGFzR2l6bW9zID0gdHJ1ZTtcbiAgICAgIGlmIChJcy5ub3QuZGVmaW5lZCh0aGlzLl9fbG9jYXRvckdpem1vKSkge1xuICAgICAgICB0aGlzLl9fbG9jYXRvckdpem1vID0gbmV3IChfZ2V0R2l6bW9DbGFzcygnbG9jYXRvcicpKSh0aGlzLmVudGl0eS5lbmdpbmUsIHRoaXMuZW50aXR5KTtcbiAgICAgICAgdGhpcy5fX2xvY2F0b3JHaXptby5fc2V0dXAoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX19sb2NhdG9yR2l6bW8uaXNWaXNpYmxlID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKElzLmV4aXN0KHRoaXMuX19sb2NhdG9yR2l6bW8pKSB7XG4gICAgICAgIHRoaXMuX19sb2NhdG9yR2l6bW8uaXNWaXNpYmxlID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHZpc2liaWxpdHkgc3RhdGUgb2YgdGhlIGxvY2F0b3IgZ2l6bW8uXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIGxvY2F0b3IgZ2l6bW8gaXMgdmlzaWJsZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBnZXQgaXNMb2NhdG9yR2l6bW9WaXNpYmxlKCkge1xuICAgIGlmIChJcy5leGlzdCh0aGlzLl9fbG9jYXRvckdpem1vKSkge1xuICAgICAgcmV0dXJuIHRoaXMuX19sb2NhdG9yR2l6bW8uaXNWaXNpYmxlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmlzaWJpbGl0eSBvZiB0aGUgdHJhbnNsYXRpb24gZ2l6bW8uXG4gICAqIEBwYXJhbSBmbGcgLSBUcnVlIHRvIHNob3cgdGhlIHRyYW5zbGF0aW9uIGdpem1vLCBmYWxzZSB0byBoaWRlIGl0XG4gICAqL1xuICBzZXQgaXNUcmFuc2xhdGlvbkdpem1vVmlzaWJsZShmbGc6IGJvb2xlYW4pIHtcbiAgICBpZiAoZmxnKSB7XG4gICAgICB0aGlzLl9faGFzR2l6bW9zID0gdHJ1ZTtcbiAgICAgIGlmIChJcy5ub3QuZGVmaW5lZCh0aGlzLl9fdHJhbnNsYXRpb25HaXptbykpIHtcbiAgICAgICAgdGhpcy5fX3RyYW5zbGF0aW9uR2l6bW8gPSBuZXcgKF9nZXRHaXptb0NsYXNzKCd0cmFuc2xhdGlvbicpKSh0aGlzLmVudGl0eS5lbmdpbmUsIHRoaXMuZW50aXR5KTtcbiAgICAgICAgdGhpcy5fX3RyYW5zbGF0aW9uR2l6bW8uX3NldHVwKCk7XG4gICAgICB9XG4gICAgICB0aGlzLl9fdHJhbnNsYXRpb25HaXptby5pc1Zpc2libGUgPSB0cnVlO1xuICAgICAgdGhpcy5fX3JlZ2lzdGVyVHJhbnNmb3JtR2l6bW9Pd25lcigpO1xuICAgICAgaWYgKHRoaXMuX190cmFuc2xhdGlvbkdpem1vLmlzU2V0dXApIHtcbiAgICAgICAgdGhpcy5fX3RyYW5zbGF0aW9uR2l6bW8uX3VwZGF0ZSgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoSXMuZXhpc3QodGhpcy5fX3RyYW5zbGF0aW9uR2l6bW8pKSB7XG4gICAgICAgIHRoaXMuX190cmFuc2xhdGlvbkdpem1vLmlzVmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9fdW5yZWdpc3RlclRyYW5zZm9ybUdpem1vT3duZXJJZk5lZWRlZCgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2aXNpYmlsaXR5IHN0YXRlIG9mIHRoZSB0cmFuc2xhdGlvbiBnaXptby5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgdHJhbnNsYXRpb24gZ2l6bW8gaXMgdmlzaWJsZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBnZXQgaXNUcmFuc2xhdGlvbkdpem1vVmlzaWJsZSgpIHtcbiAgICBpZiAoSXMuZXhpc3QodGhpcy5fX3RyYW5zbGF0aW9uR2l6bW8pKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX3RyYW5zbGF0aW9uR2l6bW8uaXNWaXNpYmxlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmlzaWJpbGl0eSBvZiB0aGUgcm90YXRpb24gZ2l6bW8uXG4gICAqIEBwYXJhbSBmbGcgLSBUcnVlIHRvIHNob3cgdGhlIHJvdGF0aW9uIGdpem1vLCBmYWxzZSB0byBoaWRlIGl0XG4gICAqL1xuICBzZXQgaXNSb3RhdGlvbkdpem1vVmlzaWJsZShmbGc6IGJvb2xlYW4pIHtcbiAgICBpZiAoZmxnKSB7XG4gICAgICB0aGlzLl9faGFzR2l6bW9zID0gdHJ1ZTtcbiAgICAgIGlmIChJcy5ub3QuZGVmaW5lZCh0aGlzLl9fcm90YXRpb25HaXptbykpIHtcbiAgICAgICAgdGhpcy5fX3JvdGF0aW9uR2l6bW8gPSBuZXcgKF9nZXRHaXptb0NsYXNzKCdyb3RhdGlvbicpKSh0aGlzLmVudGl0eS5lbmdpbmUsIHRoaXMuZW50aXR5KTtcbiAgICAgICAgdGhpcy5fX3JvdGF0aW9uR2l6bW8uX3NldHVwKCk7XG4gICAgICAgIHRoaXMuX19yb3RhdGlvbkdpem1vLnNldFNwYWNlKHRoaXMuX190cmFuc2Zvcm1HaXptb1NwYWNlKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX19yb3RhdGlvbkdpem1vLmlzVmlzaWJsZSA9IHRydWU7XG4gICAgICB0aGlzLl9fcmVnaXN0ZXJUcmFuc2Zvcm1HaXptb093bmVyKCk7XG4gICAgICBpZiAodGhpcy5fX3JvdGF0aW9uR2l6bW8uaXNTZXR1cCkge1xuICAgICAgICB0aGlzLl9fcm90YXRpb25HaXptby5fdXBkYXRlKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChJcy5leGlzdCh0aGlzLl9fcm90YXRpb25HaXptbykpIHtcbiAgICAgIHRoaXMuX19yb3RhdGlvbkdpem1vLmlzVmlzaWJsZSA9IGZhbHNlO1xuICAgICAgdGhpcy5fX3VucmVnaXN0ZXJUcmFuc2Zvcm1HaXptb093bmVySWZOZWVkZWQoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmlzaWJpbGl0eSBzdGF0ZSBvZiB0aGUgcm90YXRpb24gZ2l6bW8uXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIHJvdGF0aW9uIGdpem1vIGlzIHZpc2libGUsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgZ2V0IGlzUm90YXRpb25HaXptb1Zpc2libGUoKSB7XG4gICAgaWYgKElzLmV4aXN0KHRoaXMuX19yb3RhdGlvbkdpem1vKSkge1xuICAgICAgcmV0dXJuIHRoaXMuX19yb3RhdGlvbkdpem1vLmlzVmlzaWJsZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHZpc2liaWxpdHkgb2YgdGhlIHNjYWxlIGdpem1vLlxuICAgKiBAcGFyYW0gZmxnIC0gVHJ1ZSB0byBzaG93IHRoZSBzY2FsZSBnaXptbywgZmFsc2UgdG8gaGlkZSBpdFxuICAgKi9cbiAgc2V0IGlzU2NhbGVHaXptb1Zpc2libGUoZmxnOiBib29sZWFuKSB7XG4gICAgaWYgKGZsZykge1xuICAgICAgdGhpcy5fX2hhc0dpem1vcyA9IHRydWU7XG4gICAgICBpZiAoSXMubm90LmRlZmluZWQodGhpcy5fX3NjYWxlR2l6bW8pKSB7XG4gICAgICAgIHRoaXMuX19zY2FsZUdpem1vID0gbmV3IChfZ2V0R2l6bW9DbGFzcygnc2NhbGUnKSkodGhpcy5lbnRpdHkuZW5naW5lLCB0aGlzLmVudGl0eSk7XG4gICAgICAgIHRoaXMuX19zY2FsZUdpem1vLl9zZXR1cCgpO1xuICAgICAgfVxuICAgICAgdGhpcy5fX3NjYWxlR2l6bW8uaXNWaXNpYmxlID0gdHJ1ZTtcbiAgICAgIHRoaXMuX19yZWdpc3RlclRyYW5zZm9ybUdpem1vT3duZXIoKTtcbiAgICAgIGlmICh0aGlzLl9fc2NhbGVHaXptby5pc1NldHVwKSB7XG4gICAgICAgIHRoaXMuX19zY2FsZUdpem1vLl91cGRhdGUoKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKElzLmV4aXN0KHRoaXMuX19zY2FsZUdpem1vKSkge1xuICAgICAgICB0aGlzLl9fc2NhbGVHaXptby5pc1Zpc2libGUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fX3VucmVnaXN0ZXJUcmFuc2Zvcm1HaXptb093bmVySWZOZWVkZWQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmlzaWJpbGl0eSBzdGF0ZSBvZiB0aGUgc2NhbGUgZ2l6bW8uXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIHNjYWxlIGdpem1vIGlzIHZpc2libGUsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgZ2V0IGlzU2NhbGVHaXptb1Zpc2libGUoKSB7XG4gICAgaWYgKElzLmV4aXN0KHRoaXMuX19zY2FsZUdpem1vKSkge1xuICAgICAgcmV0dXJuIHRoaXMuX19zY2FsZUdpem1vLmlzVmlzaWJsZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHZpc2liaWxpdHkgb2YgdGhlIGpvaW50IGdpem1vIHRoYXQgdmlzdWFsaXplcyBza2VsZXRhbCBqb2ludHMuXG4gICAqIEBwYXJhbSBmbGcgLSBUcnVlIHRvIHNob3cgdGhlIGpvaW50IGdpem1vLCBmYWxzZSB0byBoaWRlIGl0XG4gICAqL1xuICBzZXQgaXNKb2ludEdpem1vVmlzaWJsZShmbGc6IGJvb2xlYW4pIHtcbiAgICBpZiAoZmxnICYmIHRoaXMuaXNKb2ludCgpKSB7XG4gICAgICB0aGlzLl9faGFzR2l6bW9zID0gdHJ1ZTtcbiAgICAgIGlmIChJcy5ub3QuZGVmaW5lZCh0aGlzLl9fam9pbnRHaXptbykpIHtcbiAgICAgICAgdGhpcy5fX2pvaW50R2l6bW8gPSBuZXcgKF9nZXRHaXptb0NsYXNzKCdqb2ludCcpKSh0aGlzLmVudGl0eS5lbmdpbmUsIHRoaXMuZW50aXR5KTtcbiAgICAgICAgdGhpcy5fX2pvaW50R2l6bW8uX3NldHVwKCk7XG4gICAgICB9XG4gICAgICB0aGlzLl9fam9pbnRHaXptby5pc1Zpc2libGUgPSB0cnVlO1xuICAgIH0gZWxzZSBpZiAoSXMuZXhpc3QodGhpcy5fX2pvaW50R2l6bW8pKSB7XG4gICAgICB0aGlzLl9fam9pbnRHaXptby5pc1Zpc2libGUgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmlzaWJpbGl0eSBzdGF0ZSBvZiB0aGUgam9pbnQgZ2l6bW8uXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIGpvaW50IGdpem1vIGlzIHZpc2libGUsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgZ2V0IGlzSm9pbnRHaXptb1Zpc2libGUoKSB7XG4gICAgaWYgKElzLmV4aXN0KHRoaXMuX19qb2ludEdpem1vKSkge1xuICAgICAgcmV0dXJuIHRoaXMuX19qb2ludEdpem1vLmlzVmlzaWJsZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYWxsIHRvcC1sZXZlbCBzY2VuZSBncmFwaCBjb21wb25lbnRzIChub2RlcyB3aXRob3V0IHBhcmVudHMpLlxuICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiBzY2VuZSBncmFwaCBjb21wb25lbnRzIHRoYXQgYXJlIGF0IHRoZSByb290IGxldmVsXG4gICAqL1xuICBzdGF0aWMgZ2V0VG9wTGV2ZWxDb21wb25lbnRzKCk6IFNjZW5lR3JhcGhDb21wb25lbnRbXSB7XG4gICAgcmV0dXJuIFNjZW5lR3JhcGhDb21wb25lbnQuX19zY2VuZUdyYXBoc1xuICAgICAgLm1hcChzZ1JlZiA9PiBzZ1JlZi5kZXJlZigpKVxuICAgICAgLmZpbHRlcigoc2c6IFNjZW5lR3JhcGhDb21wb25lbnQgfCB1bmRlZmluZWQpOiBzZyBpcyBTY2VuZUdyYXBoQ29tcG9uZW50ID0+IHtcbiAgICAgICAgaWYgKHNnICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICByZXR1cm4gc2cuaXNUb3BMZXZlbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBub2RlIHJlcHJlc2VudHMgYSBza2VsZXRhbCBqb2ludC5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGlzIGlzIGEgam9pbnQgKGhhcyBhIHZhbGlkIGpvaW50IGluZGV4KSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBpc0pvaW50KCkge1xuICAgIGlmICh0aGlzLmpvaW50SW5kZXggPj0gMCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb21wb25lbnQgdHlwZSBpZGVudGlmaWVyIGZvciBTY2VuZUdyYXBoQ29tcG9uZW50LlxuICAgKiBAcmV0dXJucyBUaGUgY29tcG9uZW50IHR5cGUgSURcbiAgICovXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2ZXJzaW9uIGNvdW50ZXIgb2YgdGhlIHNjZW5lIGdyYXBoIGhpZXJhcmNoeS5cbiAgICogSXQgY2hhbmdlcyB3aGVuZXZlciBhIHBhcmVudC1jaGlsZCByZWxhdGlvbnNoaXAgb2YgYW55IFNjZW5lR3JhcGhDb21wb25lbnQgbWF5IGhhdmUgY2hhbmdlZC5cbiAgICogQHJldHVybnMgVGhlIGhpZXJhcmNoeSB2ZXJzaW9uIGNvdW50ZXJcbiAgICovXG4gIHN0YXRpYyBnZXQgaGllcmFyY2h5VmVyc2lvbigpOiBudW1iZXIge1xuICAgIHJldHVybiBTY2VuZUdyYXBoQ29tcG9uZW50Ll9faGllcmFyY2h5VmVyc2lvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZHZhbmNlcyB0aGUgaGllcmFyY2h5IHZlcnNpb24gYWZ0ZXIgYSBwYXJlbnQtY2hpbGQgcmVsYXRpb25zaGlwIGNoYW5nZWQuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2J1bXBIaWVyYXJjaHlWZXJzaW9uKCk6IHZvaWQge1xuICAgIFNjZW5lR3JhcGhDb21wb25lbnQuX19oaWVyYXJjaHlWZXJzaW9uKys7XG4gICAgU2NlbmVHcmFwaENvbXBvbmVudC5fX2FhYmJEaXJ0eUNoYWluRXBvY2grKztcbiAgfVxuXG4gIHN0YXRpYyBnZXQgY29tcG9uZW50VElEKCkge1xuICAgIHJldHVybiBXZWxsS25vd25Db21wb25lbnRUSURzLlNjZW5lR3JhcGhDb21wb25lbnRUSUQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY29tcG9uZW50IHR5cGUgaWRlbnRpZmllciBmb3IgdGhpcyBpbnN0YW5jZS5cbiAgICogQHJldHVybnMgVGhlIGNvbXBvbmVudCB0eXBlIElEXG4gICAqL1xuICBnZXQgY29tcG9uZW50VElEKCk6IENvbXBvbmVudFRJRCB7XG4gICAgcmV0dXJuIFdlbGxLbm93bkNvbXBvbmVudFRJRHMuU2NlbmVHcmFwaENvbXBvbmVudFRJRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYXJrcyB0aGUgd29ybGQgbWF0cml4IHJlc3Qgc3RhdGUgYXMgZGlydHkgYW5kIHByb3BhZ2F0ZXMgdG8gY2hpbGRyZW4uXG4gICAqL1xuICBzZXRXb3JsZE1hdHJpeFJlc3REaXJ0eSgpIHtcbiAgICB0aGlzLm1hdHJpeFJlc3RJbm5lcjtcbiAgICB0aGlzLnNldFdvcmxkTWF0cml4UmVzdERpcnR5UmVjdXJzaXZlbHkoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWN1cnNpdmVseSBtYXJrcyB0aGUgd29ybGQgbWF0cml4IHJlc3Qgc3RhdGUgYXMgZGlydHkgZm9yIHRoaXMgbm9kZSBhbmQgYWxsIGNoaWxkcmVuLlxuICAgKi9cbiAgc2V0V29ybGRNYXRyaXhSZXN0RGlydHlSZWN1cnNpdmVseSgpIHtcbiAgICB0aGlzLl9faXNXb3JsZE1hdHJpeFJlc3RVcFRvRGF0ZSA9IGZhbHNlO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZHJlbikge1xuICAgICAgY2hpbGQuc2V0V29ybGRNYXRyaXhSZXN0RGlydHlSZWN1cnNpdmVseSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtb25vdG9uaWNhbGx5IGluY3JlYXNpbmcgd29ybGQgbWF0cml4IHZlcnNpb24gb2YgdGhpcyBub2RlLlxuICAgKiBUaGUgdmFsdWUgY2hhbmdlcyB3aGVuZXZlciB0aGUgbm9kZSBpcyBtYXJrZWQgZGlydHksIHNvIHN1bW1pbmcgaXQgb3ZlciBhIHNldCBvZiBub2RlcyBkZXRlY3RzXG4gICAqIHdoZXRoZXIgYW55IG9mIHRoZW0gbWF5IG5lZWQgdG8gYmUgcmVjb21wdXRlZC5cbiAgICogQHJldHVybnMgVGhlIHdvcmxkIG1hdHJpeCB2ZXJzaW9uXG4gICAqL1xuICBnZXQgd29ybGRNYXRyaXhWZXJzaW9uKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX193b3JsZE1hdHJpeFZlcnNpb247XG4gIH1cblxuICAvKipcbiAgICogTWFya3MgdGhlIHdvcmxkIG1hdHJpeCBhcyBkaXJ0eSBhbmQgcHJvcGFnYXRlcyBjaGFuZ2VzIHVwIHRoZSBoaWVyYXJjaHkuXG4gICAqL1xuICBzZXRXb3JsZE1hdHJpeERpcnR5KCkge1xuICAgIHRoaXMuc2V0V29ybGRNYXRyaXhEaXJ0eVJlY3Vyc2l2ZWx5KCk7XG4gICAgLy8gR2l6bW8gY2hpbGRyZW4gYXJlIGV4Y2x1ZGVkIGZyb20gdGhlIHBhcmVudCdzIG1lcmdlZCBBQUJCLCBzbyBtb3ZpbmcgdGhlbSBtdXN0IG5vdCBpbnZhbGlkYXRlIGl0LlxuICAgIC8vIE90aGVyd2lzZSB0aGUgQUFCQiBnaXptbyBpbnZhbGlkYXRlcyBpdHMgdGFyZ2V0J3MgQUFCQiBpbiBpdHMgb3duIHVwZGF0ZSBhbmQgZm9yY2VzIGEgZnVsbFxuICAgIC8vIHJlY29tcHV0YXRpb24gb2YgdGhlIG1lcmdlZCBBQUJCIG9mIHRoZSB3aG9sZSBzdWJ0cmVlIG9uIGV2ZXJ5IGZyYW1lIHRoZSBzY2VuZSBpcyB1cGRhdGVkLlxuICAgIGlmICghdGhpcy5fX2lzR2l6bW9DaGlsZCkge1xuICAgICAgdGhpcy5wYXJlbnQ/LnNldFdvcmxkQUFCQkRpcnR5UGFyZW50UmVjdXJzaXZlbHkoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTWFya3MgdGhlIHdvcmxkIG1hdHJpeCBhcyBkaXJ0eSB3aXRob3V0IGNoZWNraW5nIGlmIHRoZSBBQUJCIGlzIGRpcnR5LlxuICAgKi9cbiAgc2V0V29ybGRNYXRyaXhEaXJ0eVdpdGhvdXRBQUJCRGlydHkoKSB7XG4gICAgdGhpcy5zZXRXb3JsZE1hdHJpeERpcnR5UmVjdXJzaXZlbHkoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWN1cnNpdmVseSBtYXJrcyB0aGUgd29ybGQgbWF0cml4IGFzIGRpcnR5IGZvciB0aGlzIG5vZGUgYW5kIGFsbCBjaGlsZHJlbi5cbiAgICovXG4gIHNldFdvcmxkTWF0cml4RGlydHlSZWN1cnNpdmVseSgpIHtcbiAgICBpZiAoXG4gICAgICAhdGhpcy5fX2lzV29ybGRNYXRyaXhVcFRvRGF0ZSAmJlxuICAgICAgIXRoaXMuX19pc05vcm1hbE1hdHJpeFVwVG9EYXRlICYmXG4gICAgICAhdGhpcy5fX2lzV29ybGRSb3RhdGlvblVwVG9EYXRlICYmXG4gICAgICB0aGlzLl9faXNXb3JsZEFBQkJEaXJ0eSAmJlxuICAgICAgdGhpcy5fX2lzV29ybGRBQUJCRGlydHlXaXRoU2tlbGV0YWxcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9fd29ybGRNYXRyaXhWZXJzaW9uKys7XG4gICAgdGhpcy5fX2lzV29ybGRNYXRyaXhVcFRvRGF0ZSA9IGZhbHNlO1xuICAgIHRoaXMuX19pc05vcm1hbE1hdHJpeFVwVG9EYXRlID0gZmFsc2U7XG4gICAgdGhpcy5fX2lzV29ybGRSb3RhdGlvblVwVG9EYXRlID0gZmFsc2U7XG4gICAgdGhpcy5fX2lzV29ybGRBQUJCRGlydHkgPSB0cnVlO1xuICAgIHRoaXMuX19pc1dvcmxkQUFCQkRpcnR5V2l0aFNrZWxldGFsID0gdHJ1ZTtcblxuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZHJlbikge1xuICAgICAgY2hpbGQuc2V0V29ybGRNYXRyaXhEaXJ0eVJlY3Vyc2l2ZWx5KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE1hcmtzIHRoZSB3b3JsZCBBQUJCIG9mIHRoaXMgbm9kZSBhbmQgYWxsIG9mIGl0cyBhbmNlc3RvcnMgYXMgZGlydHkuXG4gICAqXG4gICAqIFRoZSB3YWxrIHN0b3BzIGF0IHRoZSBmaXJzdCBub2RlIGFscmVhZHkgbWFya2VkIGluIHRoZSBjdXJyZW50IGVwb2NoOiB0aGF0IG5vZGUgYW5kIGFsbCBvZiBpdHNcbiAgICogYW5jZXN0b3JzIGFyZSBrbm93biB0byBiZSBkaXJ0eS4gTWFueSBub2RlcyBvZiB0aGUgc2FtZSBzdWJ0cmVlIGNoYW5naW5nIGluIG9uZSBmcmFtZSAoZS5nLiBldmVyeVxuICAgKiBqb2ludCBvZiBhbiBhbmltYXRlZCBza2VsZXRvbikgdGhlcmVmb3JlIGNvc3QgTyhudW1iZXIgb2YgZGlzdGluY3QgYW5jZXN0b3JzKSBpbiB0b3RhbCBpbnN0ZWFkIG9mXG4gICAqIE8oY2hhbmdlZCBub2RlcyAqIGRlcHRoKS5cbiAgICovXG4gIHNldFdvcmxkQUFCQkRpcnR5UGFyZW50UmVjdXJzaXZlbHkoKSB7XG4gICAgY29uc3QgZXBvY2ggPSBTY2VuZUdyYXBoQ29tcG9uZW50Ll9fYWFiYkRpcnR5Q2hhaW5FcG9jaDtcbiAgICBsZXQgbm9kZTogU2NlbmVHcmFwaENvbXBvbmVudCB8IHVuZGVmaW5lZCA9IHRoaXM7XG4gICAgd2hpbGUgKG5vZGUgIT0gbnVsbCkge1xuICAgICAgbm9kZS5fX2lzV29ybGRBQUJCRGlydHkgPSB0cnVlO1xuICAgICAgbm9kZS5fX2lzV29ybGRBQUJCRGlydHlXaXRoU2tlbGV0YWwgPSB0cnVlO1xuICAgICAgaWYgKG5vZGUuX19hYWJiRGlydHlDaGFpbkVwb2NoID09PSBlcG9jaCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBub2RlLl9fYWFiYkRpcnR5Q2hhaW5FcG9jaCA9IGVwb2NoO1xuICAgICAgbm9kZSA9IG5vZGUuX19wYXJlbnQ7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBTY2VuZUdyYXBoIGNvbXBvbmVudCBhcyBhIGNoaWxkIG9mIHRoaXMgbm9kZS5cbiAgICogQHBhcmFtIHNnIC0gVGhlIFNjZW5lR3JhcGggY29tcG9uZW50IHRvIGFkZCBhcyBhIGNoaWxkXG4gICAqIEBwYXJhbSBrZWVwUG9zZUluV29ybGRTcGFjZSAtIFdoZXRoZXIgdG8ga2VlcCB0aGUgY2hpbGQncyB3b3JsZCBwb3NlXG4gICAqL1xuICBwdWJsaWMgYWRkQ2hpbGQoc2c6IFNjZW5lR3JhcGhDb21wb25lbnQsIGtlZXBQb3NlSW5Xb3JsZFNwYWNlID0gZmFsc2UpOiB2b2lkIHtcbiAgICAvLyBXaGVuIHdlIG5lZWQgdG8ga2VlcCB0aGUgY2hpbGQncyB3b3JsZCBwb3NlLCBjYXB0dXJlIGl0cyB3b3JsZCB0cmFuc2Zvcm0gYmVmb3JlIHJlcGFyZW50aW5nLlxuICAgIGxldCB3b3JsZE1hdHJpeEJlZm9yZVJlcGFyZW50OiBNdXRhYmxlTWF0cml4NDQgfCB1bmRlZmluZWQ7XG5cbiAgICBpZiAoa2VlcFBvc2VJbldvcmxkU3BhY2UpIHtcbiAgICAgIHNnLmxvZ2ljRm9yY2UoKTtcbiAgICAgIHdvcmxkTWF0cml4QmVmb3JlUmVwYXJlbnQgPSBzZy5tYXRyaXg7XG4gICAgfVxuXG4gICAgaWYgKElzLmV4aXN0KHNnLl9fcGFyZW50KSkge1xuICAgICAgc2cuX19wYXJlbnQucmVtb3ZlQ2hpbGQoc2cpO1xuICAgIH1cbiAgICBzZy5fX3BhcmVudCA9IHRoaXM7XG4gICAgdGhpcy5fX2NoaWxkcmVuLnB1c2goc2cpO1xuICAgIFNjZW5lR3JhcGhDb21wb25lbnQuX19idW1wSGllcmFyY2h5VmVyc2lvbigpO1xuICAgIHRoaXMuX19hZGp1c3RQaHlzaWNzQ29tcG9uZW50Q291bnRJblN1YnRyZWUoc2cuX19waHlzaWNzQ29tcG9uZW50Q291bnRJblN1YnRyZWUpO1xuXG4gICAgaWYgKGtlZXBQb3NlSW5Xb3JsZFNwYWNlKSB7XG4gICAgICBpZiAoSXMuZXhpc3Qod29ybGRNYXRyaXhCZWZvcmVSZXBhcmVudCkpIHtcbiAgICAgICAgc2cubWF0cml4ID0gd29ybGRNYXRyaXhCZWZvcmVSZXBhcmVudDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzZy5zZXRXb3JsZE1hdHJpeERpcnR5UmVjdXJzaXZlbHkoKTtcbiAgICAvLyBUaGUgbmV3IGNoaWxkIGNvbnRyaWJ1dGVzIHRvIHRoZSBtZXJnZWQgQUFCQiBvZiB0aGlzIG5vZGUgYW5kIGl0cyBhbmNlc3RvcnMuXG4gICAgdGhpcy5zZXRXb3JsZEFBQkJEaXJ0eVBhcmVudFJlY3Vyc2l2ZWx5KCk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhIGNoaWxkIFNjZW5lR3JhcGggY29tcG9uZW50IGZyb20gdGhpcyBub2RlLlxuICAgKiBAcGFyYW0gc2cgLSBUaGUgU2NlbmVHcmFwaCBjb21wb25lbnQgdG8gcmVtb3ZlXG4gICAqL1xuICBwdWJsaWMgcmVtb3ZlQ2hpbGQoc2c6IFNjZW5lR3JhcGhDb21wb25lbnQpOiB2b2lkIHtcbiAgICBjb25zdCBpbmRleCA9IHRoaXMuX19jaGlsZHJlbi5pbmRleE9mKHNnKTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgdGhpcy5fX2FkanVzdFBoeXNpY3NDb21wb25lbnRDb3VudEluU3VidHJlZSgtc2cuX19waHlzaWNzQ29tcG9uZW50Q291bnRJblN1YnRyZWUpO1xuICAgICAgdGhpcy5fX2NoaWxkcmVuLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICAgIGNvbnN0IGdpem1vSW5kZXggPSB0aGlzLl9fZ2l6bW9DaGlsZHJlbi5pbmRleE9mKHNnKTtcbiAgICBpZiAoZ2l6bW9JbmRleCA+PSAwKSB7XG4gICAgICB0aGlzLl9fZ2l6bW9DaGlsZHJlbi5zcGxpY2UoZ2l6bW9JbmRleCwgMSk7XG4gICAgfVxuICAgIHNnLl9fcGFyZW50ID0gdW5kZWZpbmVkO1xuICAgIHNnLl9faXNHaXptb0NoaWxkID0gZmFsc2U7XG4gICAgU2NlbmVHcmFwaENvbXBvbmVudC5fX2J1bXBIaWVyYXJjaHlWZXJzaW9uKCk7XG4gICAgLy8gVGhlIGRldGFjaGVkIHN1YnRyZWUgbm8gbG9uZ2VyIGluaGVyaXRzIHRoaXMgbm9kZSdzIHdvcmxkIG1hdHJpeC5cbiAgICBzZy5zZXRXb3JsZE1hdHJpeERpcnR5UmVjdXJzaXZlbHkoKTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgLy8gVGhlIHJlbW92ZWQgY2hpbGQgbm8gbG9uZ2VyIGNvbnRyaWJ1dGVzIHRvIHRoZSBtZXJnZWQgQUFCQiBvZiB0aGlzIG5vZGUgYW5kIGl0cyBhbmNlc3RvcnMuXG4gICAgICB0aGlzLnNldFdvcmxkQUFCQkRpcnR5UGFyZW50UmVjdXJzaXZlbHkoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIFNjZW5lR3JhcGggY29tcG9uZW50IGFzIGEgZ2l6bW8gY2hpbGQgKGludGVybmFsIHVzZSBvbmx5KS5cbiAgICogQHBhcmFtIHNnIC0gVGhlIFNjZW5lR3JhcGggY29tcG9uZW50IG9mIGEgZ2l6bW8gdG8gYWRkXG4gICAqL1xuICBfYWRkR2l6bW9DaGlsZChzZzogU2NlbmVHcmFwaENvbXBvbmVudCk6IHZvaWQge1xuICAgIHNnLl9fcGFyZW50ID0gdGhpcztcbiAgICBzZy5fX2lzR2l6bW9DaGlsZCA9IHRydWU7XG4gICAgdGhpcy5fX2dpem1vQ2hpbGRyZW4ucHVzaChzZyk7XG4gICAgU2NlbmVHcmFwaENvbXBvbmVudC5fX2J1bXBIaWVyYXJjaHlWZXJzaW9uKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoaXMgbm9kZSBpcyBhdCB0aGUgdG9wIGxldmVsIChoYXMgbm8gcGFyZW50KS5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGlzIGlzIGEgcm9vdCBub2RlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGdldCBpc1RvcExldmVsKCkge1xuICAgIHJldHVybiB0aGlzLl9fcGFyZW50ID09IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY2hpbGQgc2NlbmUgZ3JhcGggY29tcG9uZW50cyBvZiB0aGlzIG5vZGUuXG4gICAqIEByZXR1cm5zIEFuIGFycmF5IG9mIGNoaWxkIHNjZW5lIGdyYXBoIGNvbXBvbmVudHNcbiAgICovXG4gIGdldCBjaGlsZHJlbigpIHtcbiAgICByZXR1cm4gdGhpcy5fX2NoaWxkcmVuO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHBhcmVudCBzY2VuZSBncmFwaCBjb21wb25lbnQgb2YgdGhpcyBub2RlLlxuICAgKiBAcmV0dXJucyBUaGUgcGFyZW50IGNvbXBvbmVudCwgb3IgdW5kZWZpbmVkIGlmIHRoaXMgaXMgYSByb290IG5vZGVcbiAgICovXG4gIGdldCBwYXJlbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19wYXJlbnQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW50ZXJuYWwgd29ybGQgbWF0cml4IChtdXRhYmxlIHJlZmVyZW5jZSkuXG4gICAqIEByZXR1cm5zIFRoZSBpbnRlcm5hbCB3b3JsZCBtYXRyaXhcbiAgICovXG4gIGdldCBtYXRyaXhJbm5lcigpIHtcbiAgICBpZiAoIXRoaXMuX19pc1dvcmxkTWF0cml4VXBUb0RhdGUpIHtcbiAgICAgIHRoaXMuX19jYWxjV29ybGRNYXRyaXhSZWN1cnNpdmVseSgpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl93b3JsZE1hdHJpeDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgY2xvbmUgb2YgdGhlIHdvcmxkIG1hdHJpeC5cbiAgICogQHJldHVybnMgQSBjbG9uZWQgY29weSBvZiB0aGUgd29ybGQgbWF0cml4XG4gICAqL1xuICBnZXQgbWF0cml4KCkge1xuICAgIHJldHVybiB0aGlzLm1hdHJpeElubmVyLmNsb25lKCk7XG4gIH1cblxuICBzZXRNYXRyaXhXaXRob3V0UGh5c2ljcyhtYXRyaXg6IElNYXRyaXg0NCkge1xuICAgIGlmIChJcy5ub3QuZXhpc3QodGhpcy5fX3BhcmVudCkpIHtcbiAgICAgIHRoaXMuZW50aXR5LmdldFRyYW5zZm9ybSgpLmxvY2FsTWF0cml4V2l0aG91dFBoeXNpY3MgPSBtYXRyaXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXMuX19wYXJlbnQ7XG4gICAgICBjb25zdCBpbnZNYXRyaXggPSBNYXRyaXg0NC5pbnZlcnRUbyhwYXJlbnQubWF0cml4SW5uZXIsIFNjZW5lR3JhcGhDb21wb25lbnQuX190bXBfbWF0NF80KTtcbiAgICAgIHRoaXMuZW50aXR5LmdldFRyYW5zZm9ybSgpLmxvY2FsTWF0cml4V2l0aG91dFBoeXNpY3MgPSBNYXRyaXg0NC5tdWx0aXBseVRvKFxuICAgICAgICBpbnZNYXRyaXgsXG4gICAgICAgIG1hdHJpeCxcbiAgICAgICAgU2NlbmVHcmFwaENvbXBvbmVudC5fX3RtcF9tYXQ0XzNcbiAgICAgICkuY2xvbmUoKTtcbiAgICB9XG4gIH1cblxuICBzZXRNYXRyaXhUb1BoeXNpY3MobWF0cml4OiBJTWF0cml4NDQpIHtcbiAgICB0aGlzLl9fc2V0TWF0cml4VG9Pd25QaHlzaWNzKG1hdHJpeCwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgdGhpcy5fX3N5bmNEZXNjZW5kYW50UGh5c2ljc1RyYW5zZm9ybXModHJ1ZSwgdHJ1ZSwgdHJ1ZSk7XG4gIH1cblxuICBwcml2YXRlIF9fc2V0TWF0cml4VG9Pd25QaHlzaWNzKFxuICAgIG1hdHJpeDogSU1hdHJpeDQ0LFxuICAgIHVwZGF0ZVBvc2l0aW9uOiBib29sZWFuLFxuICAgIHVwZGF0ZVJvdGF0aW9uOiBib29sZWFuLFxuICAgIHVwZGF0ZVNjYWxlOiBib29sZWFuXG4gICkge1xuICAgIGNvbnN0IHBoeXNpY3NDb21wb25lbnQgPSB0aGlzLmVudGl0eS50cnlUb0dldFBoeXNpY3MoKTtcbiAgICBpZiAocGh5c2ljc0NvbXBvbmVudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAocGh5c2ljc0NvbXBvbmVudC5zdHJhdGVneSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnN0IHN0cmF0ZWd5ID0gcGh5c2ljc0NvbXBvbmVudC5zdHJhdGVneTtcbiAgICAgICAgaWYgKHVwZGF0ZVJvdGF0aW9uKSB7XG4gICAgICAgICAgY29uc3Qgd29ybGRSb3RhdGlvbiA9IHRoaXMuZ2V0UXVhdGVybmlvblJlY3Vyc2l2ZWx5VG8oU2NlbmVHcmFwaENvbXBvbmVudC5fX3RtcF9xdWF0XzMpO1xuICAgICAgICAgIGlmIChzdHJhdGVneS5zZXRSb3RhdGlvbiAhPSBudWxsKSB7XG4gICAgICAgICAgICBzdHJhdGVneS5zZXRSb3RhdGlvbih3b3JsZFJvdGF0aW9uKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHN0cmF0ZWd5LnNldEV1bGVyQW5nbGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgc3RyYXRlZ3kuc2V0RXVsZXJBbmdsZSh3b3JsZFJvdGF0aW9uLnRvRXVsZXJBbmdsZXNUbyhTY2VuZUdyYXBoQ29tcG9uZW50Ll9fdG1wX2V1bGVyKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh1cGRhdGVQb3NpdGlvbiAmJiBzdHJhdGVneS5zZXRQb3NpdGlvbiAhPSBudWxsKSB7XG4gICAgICAgICAgc3RyYXRlZ3kuc2V0UG9zaXRpb24obWF0cml4LmdldFRyYW5zbGF0ZVRvKFNjZW5lR3JhcGhDb21wb25lbnQuX190bXBfdHJhbnNsYXRlKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHVwZGF0ZVNjYWxlICYmIHN0cmF0ZWd5LnNldFNjYWxlICE9IG51bGwpIHtcbiAgICAgICAgICBzdHJhdGVneS5zZXRTY2FsZSh0aGlzLl9nZXRQaHlzaWNzV29ybGRTY2FsZShtYXRyaXgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX19zeW5jRGVzY2VuZGFudFBoeXNpY3NUcmFuc2Zvcm1zKHVwZGF0ZVBvc2l0aW9uOiBib29sZWFuLCB1cGRhdGVSb3RhdGlvbjogYm9vbGVhbiwgdXBkYXRlU2NhbGU6IGJvb2xlYW4pIHtcbiAgICBjb25zdCBvd25QaHlzaWNzQ29tcG9uZW50Q291bnQgPSB0aGlzLmVudGl0eS50cnlUb0dldFBoeXNpY3MoKSA9PT0gdW5kZWZpbmVkID8gMCA6IDE7XG4gICAgaWYgKHRoaXMuX19waHlzaWNzQ29tcG9uZW50Q291bnRJblN1YnRyZWUgPT09IG93blBoeXNpY3NDb21wb25lbnRDb3VudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFRyYW5zZm9ybUNvbXBvbmVudCBkaXJ0aWVzIG1hdHJpY2VzIGR1cmluZyBpdHMgbG9naWMgc3RhZ2UuIE1hdGVyaWFsaXplIHRoZVxuICAgIC8vIGN1cnJlbnQgY2FjaGUgZmlyc3Qgc28gZGlydHkgcHJvcGFnYXRpb24gcmVhY2hlcyBldmVyeSBkZXNjZW5kYW50IG5vdy5cbiAgICB0aGlzLm1hdHJpeElubmVyO1xuICAgIHRoaXMuc2V0V29ybGRNYXRyaXhEaXJ0eSgpO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5fX2NoaWxkcmVuKSB7XG4gICAgICBpZiAoIWNoaWxkLnRvTWFrZVdvcmxkTWF0cml4VGhlU2FtZUFzTG9jYWxNYXRyaXggJiYgY2hpbGQuX19waHlzaWNzQ29tcG9uZW50Q291bnRJblN1YnRyZWUgPiAwKSB7XG4gICAgICAgIGNoaWxkLl9fc3luY1BoeXNpY3NUcmFuc2Zvcm1SZWN1cnNpdmVseSh1cGRhdGVQb3NpdGlvbiwgdXBkYXRlUm90YXRpb24sIHVwZGF0ZVNjYWxlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9fc3luY1BoeXNpY3NUcmFuc2Zvcm1SZWN1cnNpdmVseSh1cGRhdGVQb3NpdGlvbjogYm9vbGVhbiwgdXBkYXRlUm90YXRpb246IGJvb2xlYW4sIHVwZGF0ZVNjYWxlOiBib29sZWFuKSB7XG4gICAgaWYgKHRoaXMuX19waHlzaWNzQ29tcG9uZW50Q291bnRJblN1YnRyZWUgPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fX3NldE1hdHJpeFRvT3duUGh5c2ljcyh0aGlzLm1hdHJpeElubmVyLCB1cGRhdGVQb3NpdGlvbiwgdXBkYXRlUm90YXRpb24sIHVwZGF0ZVNjYWxlKTtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHRoaXMuX19jaGlsZHJlbikge1xuICAgICAgaWYgKCFjaGlsZC50b01ha2VXb3JsZE1hdHJpeFRoZVNhbWVBc0xvY2FsTWF0cml4ICYmIGNoaWxkLl9fcGh5c2ljc0NvbXBvbmVudENvdW50SW5TdWJ0cmVlID4gMCkge1xuICAgICAgICBjaGlsZC5fX3N5bmNQaHlzaWNzVHJhbnNmb3JtUmVjdXJzaXZlbHkodXBkYXRlUG9zaXRpb24sIHVwZGF0ZVJvdGF0aW9uLCB1cGRhdGVTY2FsZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlY29yZHMgdGhhdCB0aGlzIGVudGl0eSBhY3F1aXJlZCBhIFBoeXNpY3NDb21wb25lbnQuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX29uUGh5c2ljc0NvbXBvbmVudEFkZGVkKCk6IHZvaWQge1xuICAgIHRoaXMuX19hZGp1c3RQaHlzaWNzQ29tcG9uZW50Q291bnRJblN1YnRyZWUoMSk7XG4gIH1cblxuICAvKipcbiAgICogUmVjb3JkcyB0aGF0IHRoaXMgZW50aXR5IGxvc3QgaXRzIFBoeXNpY3NDb21wb25lbnQuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX29uUGh5c2ljc0NvbXBvbmVudFJlbW92ZWQoKTogdm9pZCB7XG4gICAgdGhpcy5fX2FkanVzdFBoeXNpY3NDb21wb25lbnRDb3VudEluU3VidHJlZSgtMSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoaXMgbm9kZSBvciBvbmUgb2YgaXRzIGRlc2NlbmRhbnRzIGhhcyBhIFBoeXNpY3NDb21wb25lbnQuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZ2V0IF9oYXNQaHlzaWNzQ29tcG9uZW50SW5TdWJ0cmVlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9fcGh5c2ljc0NvbXBvbmVudENvdW50SW5TdWJ0cmVlID4gMDtcbiAgfVxuXG4gIHByaXZhdGUgX19hZGp1c3RQaHlzaWNzQ29tcG9uZW50Q291bnRJblN1YnRyZWUoZGVsdGE6IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMuX19waHlzaWNzQ29tcG9uZW50Q291bnRJblN1YnRyZWUgKz0gZGVsdGE7XG5cbiAgICBjb25zdCBwYXJlbnQgPSB0aGlzLl9fcGFyZW50O1xuICAgIGlmIChwYXJlbnQ/Ll9fY2hpbGRyZW4uaW5jbHVkZXModGhpcykpIHtcbiAgICAgIHBhcmVudC5fX2FkanVzdFBoeXNpY3NDb21wb25lbnRDb3VudEluU3VidHJlZShkZWx0YSk7XG4gICAgfVxuICB9XG5cbiAgc2V0IG1hdHJpeChtYXRyaXg6IE11dGFibGVNYXRyaXg0NCkge1xuICAgIHRoaXMuc2V0TWF0cml4V2l0aG91dFBoeXNpY3MobWF0cml4KTtcbiAgICB0aGlzLnNldE1hdHJpeFRvUGh5c2ljcyhtYXRyaXgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGludGVybmFsIHdvcmxkIG1hdHJpeCBpbiByZXN0IHBvc2UgKG11dGFibGUgcmVmZXJlbmNlKS5cbiAgICogQHJldHVybnMgVGhlIGludGVybmFsIHdvcmxkIG1hdHJpeCBpbiByZXN0IHBvc2VcbiAgICovXG4gIGdldCBtYXRyaXhSZXN0SW5uZXIoKSB7XG4gICAgaWYgKCF0aGlzLl9faXNXb3JsZE1hdHJpeFJlc3RVcFRvRGF0ZSkge1xuICAgICAgdGhpcy5fX2NhbGNXb3JsZE1hdHJpeFJlc3RSZWN1cnNpdmVseSgpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl93b3JsZE1hdHJpeFJlc3Q7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIGNsb25lIG9mIHRoZSB3b3JsZCBtYXRyaXggaW4gcmVzdCBwb3NlLlxuICAgKiBAcmV0dXJucyBBIGNsb25lZCBjb3B5IG9mIHRoZSB3b3JsZCBtYXRyaXggaW4gcmVzdCBwb3NlXG4gICAqL1xuICBnZXQgbWF0cml4UmVzdCgpIHtcbiAgICByZXR1cm4gdGhpcy5tYXRyaXhSZXN0SW5uZXIuY2xvbmUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpbnRlcm5hbCBub3JtYWwgbWF0cml4IChtdXRhYmxlIHJlZmVyZW5jZSkuXG4gICAqIEByZXR1cm5zIFRoZSBpbnRlcm5hbCBub3JtYWwgbWF0cml4XG4gICAqL1xuICBnZXQgbm9ybWFsTWF0cml4SW5uZXIoKSB7XG4gICAgaWYgKCF0aGlzLl9faXNOb3JtYWxNYXRyaXhVcFRvRGF0ZSkge1xuICAgICAgTWF0cml4NDQuaW52ZXJ0VG8odGhpcy5tYXRyaXhJbm5lciwgU2NlbmVHcmFwaENvbXBvbmVudC5pbnZlcnRlZE1hdHJpeDQ0KTtcbiAgICAgIHRoaXMuX25vcm1hbE1hdHJpeC5jb3B5Q29tcG9uZW50cyhTY2VuZUdyYXBoQ29tcG9uZW50LmludmVydGVkTWF0cml4NDQudHJhbnNwb3NlKCkpO1xuICAgICAgdGhpcy5fX2lzTm9ybWFsTWF0cml4VXBUb0RhdGUgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fbm9ybWFsTWF0cml4O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGVudGl0eSB3b3JsZCBtYXRyaXggd2l0aCBza2VsZXRhbCBhbmltYXRpb24gYXBwbGllZC5cbiAgICogQHJldHVybnMgQSBjbG9uZWQgY29weSBvZiB0aGUgZW50aXR5IHdvcmxkIG1hdHJpeCB3aXRoIHNrZWxldGFsIHRyYW5zZm9ybWF0aW9uc1xuICAgKi9cbiAgZ2V0IGVudGl0eVdvcmxkV2l0aFNrZWxldGFsTWF0cml4KCk6IE11dGFibGVNYXRyaXg0NCB7XG4gICAgcmV0dXJuIHRoaXMuZW50aXR5V29ybGRNYXRyaXhXaXRoU2tlbGV0YWxJbm5lci5jbG9uZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGludGVybmFsIGVudGl0eSB3b3JsZCBtYXRyaXggd2l0aCBza2VsZXRhbCBhbmltYXRpb24gYXBwbGllZC5cbiAgICogQHJldHVybnMgVGhlIGludGVybmFsIGVudGl0eSB3b3JsZCBtYXRyaXggd2l0aCBza2VsZXRhbCB0cmFuc2Zvcm1hdGlvbnNcbiAgICovXG4gIGdldCBlbnRpdHlXb3JsZE1hdHJpeFdpdGhTa2VsZXRhbElubmVyKCk6IE11dGFibGVNYXRyaXg0NCB7XG4gICAgY29uc3Qgc2tlbGV0YWxDb21wb25lbnQgPSB0aGlzLmVudGl0eS50cnlUb0dldFNrZWxldGFsKCk7XG4gICAgaWYgKElzLmV4aXN0KHNrZWxldGFsQ29tcG9uZW50KSAmJiBza2VsZXRhbENvbXBvbmVudC5pc1dvcmxkTWF0cml4VXBkYXRlZCkge1xuICAgICAgcmV0dXJuIHNrZWxldGFsQ29tcG9uZW50LndvcmxkTWF0cml4SW5uZXI7XG4gICAgfVxuICAgIGNvbnN0IHNjZW5lR3JhcGhDb21wb25lbnQgPSB0aGlzLmVudGl0eS5nZXRTY2VuZUdyYXBoKCk7XG4gICAgcmV0dXJuIHNjZW5lR3JhcGhDb21wb25lbnQubWF0cml4SW5uZXI7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIGNsb25lIG9mIHRoZSBub3JtYWwgbWF0cml4LlxuICAgKiBAcmV0dXJucyBBIGNsb25lZCBjb3B5IG9mIHRoZSBub3JtYWwgbWF0cml4XG4gICAqL1xuICBnZXQgbm9ybWFsTWF0cml4KCkge1xuICAgIHJldHVybiB0aGlzLm5vcm1hbE1hdHJpeElubmVyLmNsb25lKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSB3b3JsZCBtYXRyaXggaXMgdXAtdG8tZGF0ZSByZWN1cnNpdmVseSB1cCB0aGUgaGllcmFyY2h5LlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSB3b3JsZCBtYXRyaXggaXMgdXAtdG8tZGF0ZSBmb3IgdGhpcyBub2RlIGFuZCBhbGwgaXRzIGFuY2VzdG9yc1xuICAgKi9cbiAgaXNXb3JsZE1hdHJpeFVwVG9EYXRlUmVjdXJzaXZlbHkoKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuX19pc1dvcmxkTWF0cml4VXBUb0RhdGUpIHtcbiAgICAgIGlmICh0aGlzLl9fcGFyZW50KSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX19wYXJlbnQuaXNXb3JsZE1hdHJpeFVwVG9EYXRlUmVjdXJzaXZlbHkoKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogUmVjdXJzaXZlbHkgY2FsY3VsYXRlcyB0aGUgd29ybGQgbWF0cml4IGZyb20gdGhpcyBub2RlIHVwIHRvIHRoZSByb290LlxuICAgKlxuICAgKiBUaGUgcmVzdWx0IGlzIG1lbW9pemVkIGludG8gYF93b3JsZE1hdHJpeGAgZm9yIGV2ZXJ5IG5vZGUgdmlzaXRlZCBieSB0aGUgcmVjdXJzaW9uLCBub3Qgb25seSB0aGVcbiAgICogbm9kZSB0aGF0IHdhcyByZXF1ZXN0ZWQuIFdpdGhvdXQgdGhlIHdyaXRlLWJhY2ssIHByb2Nlc3NpbmcgY2hpbGRyZW4gYmVmb3JlIHRoZWlyIHBhcmVudHMgd291bGRcbiAgICogcmVjb21wdXRlIHRoZSBzYW1lIGFuY2VzdG9yIG1hdHJpY2VzIG9uY2UgcGVyIGRlc2NlbmRhbnQuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBjYWNoZWQgd29ybGQgbWF0cml4IG9mIHRoaXMgbm9kZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2NhbGNXb3JsZE1hdHJpeFJlY3Vyc2l2ZWx5KCk6IE11dGFibGVNYXRyaXg0NCB7XG4gICAgaWYgKHRoaXMuX19pc1dvcmxkTWF0cml4VXBUb0RhdGUpIHtcbiAgICAgIHJldHVybiB0aGlzLl93b3JsZE1hdHJpeDtcbiAgICB9XG5cbiAgICBjb25zdCB0cmFuc2Zvcm0gPSB0aGlzLmVudGl0eS5nZXRUcmFuc2Zvcm0oKSE7XG5cbiAgICBpZiAodGhpcy5fX3BhcmVudCA9PSBudWxsIHx8IHRoaXMudG9NYWtlV29ybGRNYXRyaXhUaGVTYW1lQXNMb2NhbE1hdHJpeCkge1xuICAgICAgdHJhbnNmb3JtLmdldExvY2FsTWF0cml4SW5uZXJUbyh0aGlzLl93b3JsZE1hdHJpeCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IG1hdHJpeEZyb21BbmNlc3RvclRvUGFyZW50ID0gdGhpcy5fX3BhcmVudC5fX2NhbGNXb3JsZE1hdHJpeFJlY3Vyc2l2ZWx5KCk7XG4gICAgICB0cmFuc2Zvcm0uZ2V0TG9jYWxNYXRyaXhJbm5lclRvKFNjZW5lR3JhcGhDb21wb25lbnQuX190bXBfbWF0NF8zKTtcbiAgICAgIE11dGFibGVNYXRyaXg0NC5tdWx0aXBseVRvKG1hdHJpeEZyb21BbmNlc3RvclRvUGFyZW50LCBTY2VuZUdyYXBoQ29tcG9uZW50Ll9fdG1wX21hdDRfMywgdGhpcy5fd29ybGRNYXRyaXgpO1xuICAgIH1cbiAgICB0aGlzLl9faXNXb3JsZE1hdHJpeFVwVG9EYXRlID0gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcy5fd29ybGRNYXRyaXg7XG4gIH1cblxuICAvKipcbiAgICogUmVjdXJzaXZlbHkgY2FsY3VsYXRlcyB0aGUgd29ybGQgbWF0cml4IGluIHJlc3QgcG9zZSBmcm9tIHRoaXMgbm9kZSB1cCB0byB0aGUgcm9vdC5cbiAgICogQHJldHVybnMgVGhlIGNhbGN1bGF0ZWQgd29ybGQgbWF0cml4IGluIHJlc3QgcG9zZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2NhbGNXb3JsZE1hdHJpeFJlc3RSZWN1cnNpdmVseSgpOiBNdXRhYmxlTWF0cml4NDQge1xuICAgIGlmICh0aGlzLl9faXNXb3JsZE1hdHJpeFJlc3RVcFRvRGF0ZSkge1xuICAgICAgcmV0dXJuIHRoaXMuX3dvcmxkTWF0cml4UmVzdDtcbiAgICB9XG5cbiAgICBjb25zdCB0cmFuc2Zvcm0gPSB0aGlzLmVudGl0eS5nZXRUcmFuc2Zvcm0oKSE7XG5cbiAgICBpZiAodGhpcy5fX3BhcmVudCA9PSBudWxsIHx8IHRoaXMudG9NYWtlV29ybGRNYXRyaXhUaGVTYW1lQXNMb2NhbE1hdHJpeCkge1xuICAgICAgdHJhbnNmb3JtLmdldExvY2FsTWF0cml4SW5uZXJUbyh0aGlzLl93b3JsZE1hdHJpeFJlc3QpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBtYXRyaXhGcm9tQW5jZXN0b3JUb1BhcmVudCA9IHRoaXMuX19wYXJlbnQuX19jYWxjV29ybGRNYXRyaXhSZXN0UmVjdXJzaXZlbHkoKTtcbiAgICAgIHRyYW5zZm9ybS5nZXRMb2NhbE1hdHJpeElubmVyVG8oU2NlbmVHcmFwaENvbXBvbmVudC5fX3RtcF9tYXQ0XzMpO1xuICAgICAgTXV0YWJsZU1hdHJpeDQ0Lm11bHRpcGx5VG8obWF0cml4RnJvbUFuY2VzdG9yVG9QYXJlbnQsIFNjZW5lR3JhcGhDb21wb25lbnQuX190bXBfbWF0NF8zLCB0aGlzLl93b3JsZE1hdHJpeFJlc3QpO1xuICAgIH1cbiAgICB0aGlzLl9faXNXb3JsZE1hdHJpeFJlc3RVcFRvRGF0ZSA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXMuX3dvcmxkTWF0cml4UmVzdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB3b3JsZCByb3RhdGlvbiBxdWF0ZXJuaW9uIGJ5IHJlY3Vyc2l2ZWx5IGNvbWJpbmluZyBsb2NhbCByb3RhdGlvbnMuXG4gICAqIFRoaXMgYWxsb2NhdGVzIGEgbmV3IHF1YXRlcm5pb24uIFVzZSB7QGxpbmsgZ2V0UXVhdGVybmlvblJlY3Vyc2l2ZWx5VG99XG4gICAqIHdoZW4gYSBwcmUtYWxsb2NhdGVkIG91dHB1dCBxdWF0ZXJuaW9uIGlzIGF2YWlsYWJsZSAoZS5nLiBpbiBob3QgcGVyLWZyYW1lIHBhdGhzKS5cbiAgICogQHJldHVybnMgVGhlIHdvcmxkIHJvdGF0aW9uIHF1YXRlcm5pb25cbiAgICovXG4gIGdldFF1YXRlcm5pb25SZWN1cnNpdmVseSgpOiBJUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIFF1YXRlcm5pb24uZnJvbUNvcHlRdWF0ZXJuaW9uKHRoaXMuZ2V0UXVhdGVybmlvblJlY3Vyc2l2ZWx5VG8oU2NlbmVHcmFwaENvbXBvbmVudC5fX3RtcF9xdWF0XzEpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB3b3JsZCByb3RhdGlvbiBxdWF0ZXJuaW9uIGJ5IHJlY3Vyc2l2ZWx5IGNvbWJpbmluZyBsb2NhbCByb3RhdGlvbnNcbiAgICogYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIHRoZSBnaXZlbiBvdXRwdXQgcXVhdGVybmlvbiB3aXRob3V0IGFsbG9jYXRpbmcuXG4gICAqIEBwYXJhbSBvdXQgLSBUaGUgb3V0cHV0IHF1YXRlcm5pb24gdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHF1YXRlcm5pb24gY29udGFpbmluZyB0aGUgd29ybGQgcm90YXRpb25cbiAgICovXG4gIGdldFF1YXRlcm5pb25SZWN1cnNpdmVseVRvKG91dDogSU11dGFibGVRdWF0ZXJuaW9uKTogSU11dGFibGVRdWF0ZXJuaW9uIHtcbiAgICBjb25zdCBsb2NhbFJvdGF0aW9uID0gdGhpcy5lbnRpdHkuZ2V0VHJhbnNmb3JtKCkubG9jYWxSb3RhdGlvbklubmVyO1xuICAgIGlmICh0aGlzLl9fcGFyZW50ID09IG51bGwpIHtcbiAgICAgIHJldHVybiBvdXQuY29weUNvbXBvbmVudHMobG9jYWxSb3RhdGlvbik7XG4gICAgfVxuXG4gICAgLy8gVGhlIHJlY3Vyc2lvbiByZXVzZXMgYSBzaW5nbGUgdGVtcG9yYXJ5IHF1YXRlcm5pb246IFF1YXRlcm5pb24ubXVsdGlwbHlUb1xuICAgIC8vIGNvbXB1dGVzIGFsbCBjb21wb25lbnRzIGJlZm9yZSB3cml0aW5nIHRvIHRoZSBvdXRwdXQsIHNvIHVzaW5nIHRoZSBzYW1lXG4gICAgLy8gaW5zdGFuY2UgYXMgYm90aCBhbiBpbnB1dCBhbmQgdGhlIG91dHB1dCBpcyBzYWZlLlxuICAgIHRoaXMuX19wYXJlbnQuZ2V0UXVhdGVybmlvblJlY3Vyc2l2ZWx5VG8oU2NlbmVHcmFwaENvbXBvbmVudC5fX3RtcF9xdWF0XzApO1xuICAgIHJldHVybiBRdWF0ZXJuaW9uLm11bHRpcGx5VG8oU2NlbmVHcmFwaENvbXBvbmVudC5fX3RtcF9xdWF0XzAsIGxvY2FsUm90YXRpb24sIG91dCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgd29ybGQgcG9zaXRpb24gb2YgdGhpcyBub2RlLlxuICAgKiBAcmV0dXJucyBUaGUgd29ybGQgcG9zaXRpb24gYXMgYSBWZWN0b3IzXG4gICAqL1xuICBnZXQgd29ybGRQb3NpdGlvbigpOiBWZWN0b3IzIHtcbiAgICBjb25zdCB6ZXJvVmVjdG9yID0gU2NlbmVHcmFwaENvbXBvbmVudC5fX29yaWdpblZlY3RvcjM7XG4gICAgdGhpcy5tYXRyaXhJbm5lci5tdWx0aXBseVZlY3RvcjNUbyh6ZXJvVmVjdG9yLCBTY2VuZUdyYXBoQ29tcG9uZW50LnJldHVyblZlY3RvcjMpO1xuICAgIHJldHVybiBTY2VuZUdyYXBoQ29tcG9uZW50LnJldHVyblZlY3RvcjMgYXMgVmVjdG9yMztcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFuc2Zvcm1zIGEgbG9jYWwgcG9zaXRpb24gdG8gd29ybGQgc3BhY2UuXG4gICAqIEBwYXJhbSBsb2NhbFBvc2l0aW9uIC0gVGhlIHBvc2l0aW9uIGluIGxvY2FsIHNwYWNlXG4gICAqIEByZXR1cm5zIFRoZSBwb3NpdGlvbiBpbiB3b3JsZCBzcGFjZVxuICAgKi9cbiAgZ2V0V29ybGRQb3NpdGlvbk9mKGxvY2FsUG9zaXRpb246IFZlY3RvcjMpIHtcbiAgICByZXR1cm4gdGhpcy5tYXRyaXhJbm5lci5tdWx0aXBseVZlY3RvcjMobG9jYWxQb3NpdGlvbik7XG4gIH1cblxuICAvKipcbiAgICogVHJhbnNmb3JtcyBhIGxvY2FsIHBvc2l0aW9uIHRvIHdvcmxkIHNwYWNlIGFuZCBzdG9yZXMgdGhlIHJlc3VsdCBpbiB0aGUgb3V0cHV0IHZlY3Rvci5cbiAgICogQHBhcmFtIGxvY2FsUG9zaXRpb24gLSBUaGUgcG9zaXRpb24gaW4gbG9jYWwgc3BhY2VcbiAgICogQHBhcmFtIG91dCAtIFRoZSBvdXRwdXQgdmVjdG9yIHRvIHN0b3JlIHRoZSByZXN1bHRcbiAgICogQHJldHVybnMgVGhlIG91dHB1dCB2ZWN0b3IgY29udGFpbmluZyB0aGUgd29ybGQgcG9zaXRpb25cbiAgICovXG4gIGdldFdvcmxkUG9zaXRpb25PZlRvKGxvY2FsUG9zaXRpb246IFZlY3RvcjMsIG91dDogTXV0YWJsZVZlY3RvcjMpIHtcbiAgICByZXR1cm4gdGhpcy5tYXRyaXhJbm5lci5tdWx0aXBseVZlY3RvcjNUbyhsb2NhbFBvc2l0aW9uLCBvdXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybXMgYSB3b3JsZCBwb3NpdGlvbiB0byBsb2NhbCBzcGFjZS5cbiAgICogQHBhcmFtIHdvcmxkUG9zaXRpb24gLSBUaGUgcG9zaXRpb24gaW4gd29ybGQgc3BhY2VcbiAgICogQHJldHVybnMgVGhlIHBvc2l0aW9uIGluIGxvY2FsIHNwYWNlXG4gICAqL1xuICBnZXRMb2NhbFBvc2l0aW9uT2Yod29ybGRQb3NpdGlvbjogVmVjdG9yMyk6IFZlY3RvcjMge1xuICAgIHJldHVybiBNYXRyaXg0NC5pbnZlcnQodGhpcy5tYXRyaXhJbm5lcikubXVsdGlwbHlWZWN0b3IzKHdvcmxkUG9zaXRpb24pO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybXMgYSB3b3JsZCBwb3NpdGlvbiB0byBsb2NhbCBzcGFjZSBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gdGhlIG91dHB1dCB2ZWN0b3IuXG4gICAqIEBwYXJhbSB3b3JsZFBvc2l0aW9uIC0gVGhlIHBvc2l0aW9uIGluIHdvcmxkIHNwYWNlXG4gICAqIEBwYXJhbSBvdXQgLSBUaGUgb3V0cHV0IHZlY3RvciB0byBzdG9yZSB0aGUgcmVzdWx0XG4gICAqIEByZXR1cm5zIFRoZSBvdXRwdXQgdmVjdG9yIGNvbnRhaW5pbmcgdGhlIGxvY2FsIHBvc2l0aW9uXG4gICAqL1xuICBnZXRMb2NhbFBvc2l0aW9uT2ZUbyh3b3JsZFBvc2l0aW9uOiBWZWN0b3IzLCBvdXQ6IE11dGFibGVWZWN0b3IzKTogVmVjdG9yMyB7XG4gICAgcmV0dXJuIE1hdHJpeDQ0LmludmVydFRvKHRoaXMubWF0cml4SW5uZXIsIFNjZW5lR3JhcGhDb21wb25lbnQuX190bXBfbWF0NCkubXVsdGlwbHlWZWN0b3IzVG8od29ybGRQb3NpdGlvbiwgb3V0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB3b3JsZC1zcGFjZSBBQUJCIChBeGlzLUFsaWduZWQgQm91bmRpbmcgQm94KSBvZiB0aGlzIG5vZGUuXG4gICAqIEByZXR1cm5zIFRoZSB3b3JsZCBBQUJCIG9mIHRoaXMgbm9kZVxuICAgKi9cbiAgZ2V0V29ybGRBQUJCKCkge1xuICAgIGNvbnN0IGFhYmIgPSBuZXcgQUFCQigpO1xuICAgIGNvbnN0IG1lc2hDb21wb25lbnQgPSB0aGlzLmVudGl0eS50cnlUb0dldE1lc2goKTtcbiAgICBpZiAoSXMuZXhpc3QobWVzaENvbXBvbmVudCkgJiYgSXMuZXhpc3QobWVzaENvbXBvbmVudC5tZXNoKSkge1xuICAgICAgYWFiYi5tZXJnZUFBQkIobWVzaENvbXBvbmVudC5tZXNoLkFBQkIpO1xuXG4gICAgICBBQUJCLm11bHRpcGx5TWF0cml4VG8odGhpcy5lbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLm1hdHJpeElubmVyLCBhYWJiLCBTY2VuZUdyYXBoQ29tcG9uZW50Ll9fdG1wQUFCQik7XG4gICAgfSBlbHNlIHtcbiAgICAgIFNjZW5lR3JhcGhDb21wb25lbnQuX190bXBBQUJCLmluaXRpYWxpemUoKTtcbiAgICB9XG5cbiAgICBjb25zdCByYXltYXJjaGluZ0NvbXBvbmVudCA9IHRoaXMuZW50aXR5LnRyeVRvR2V0UmF5bWFyY2hpbmcoKTtcbiAgICBpZiAoSXMuZXhpc3QocmF5bWFyY2hpbmdDb21wb25lbnQpKSB7XG4gICAgICBjb25zdCByYXltYXJjaGluZ0FBQkIgPSByYXltYXJjaGluZ0NvbXBvbmVudC5jYWxjV29ybGRBQUJCKCk7XG4gICAgICBpZiAocmF5bWFyY2hpbmdBQUJCICE9IG51bGwpIHtcbiAgICAgICAgU2NlbmVHcmFwaENvbXBvbmVudC5fX3RtcEFBQkIubWVyZ2VBQUJCKHJheW1hcmNoaW5nQUFCQik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFNjZW5lR3JhcGhDb21wb25lbnQuX190bXBBQUJCO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIG1lcmdlZCB3b3JsZCBBQUJCIGluY2x1ZGluZyBhbGwgY2hpbGRyZW4uXG4gICAqIEByZXR1cm5zIFRoZSBtZXJnZWQgd29ybGQgQUFCQiBvZiB0aGlzIG5vZGUgYW5kIGFsbCBpdHMgZGVzY2VuZGFudHNcbiAgICovXG4gIGNhbGNXb3JsZE1lcmdlZEFBQkIoKSB7XG4gICAgY29uc3QgYWFiYiA9IHRoaXMuZ2V0V29ybGRBQUJCKCkuY2xvbmUoKTtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHRoaXMuY2hpbGRyZW4pIHtcbiAgICAgIGNvbnN0IGNoaWxkQUFCQiA9IGNoaWxkLmNhbGNXb3JsZE1lcmdlZEFBQkIoKTtcbiAgICAgIGFhYmIubWVyZ2VBQUJCKGNoaWxkQUFCQik7XG4gICAgfVxuICAgIHRoaXMuX193b3JsZE1lcmdlZEFBQkIgPSBhYWJiO1xuXG4gICAgcmV0dXJuIGFhYmI7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY2FjaGVkIG1lcmdlZCB3b3JsZCBBQUJCLCByZWNhbGN1bGF0aW5nIGlmIGRpcnR5LlxuICAgKiBAcmV0dXJucyBUaGUgbWVyZ2VkIHdvcmxkIEFBQkIgb2YgdGhpcyBub2RlIGFuZCBhbGwgaXRzIGRlc2NlbmRhbnRzXG4gICAqL1xuICBnZXQgd29ybGRNZXJnZWRBQUJCKCkge1xuICAgIGlmICh0aGlzLl9faXNXb3JsZEFBQkJEaXJ0eSkge1xuICAgICAgdGhpcy5jYWxjV29ybGRNZXJnZWRBQUJCKCk7XG4gICAgICB0aGlzLl9faXNXb3JsZEFBQkJEaXJ0eSA9IGZhbHNlO1xuICAgICAgU2NlbmVHcmFwaENvbXBvbmVudC5fX2FhYmJEaXJ0eUNoYWluRXBvY2grKztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX193b3JsZE1lcmdlZEFBQkI7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgd29ybGQtc3BhY2UgQUFCQiB3aXRoIHNrZWxldGFsIGFuaW1hdGlvbiBhcHBsaWVkLlxuICAgKiBAcmV0dXJucyBUaGUgd29ybGQgQUFCQiB3aXRoIHNrZWxldGFsIHRyYW5zZm9ybWF0aW9uc1xuICAgKi9cbiAgZ2V0V29ybGRBQUJCV2l0aFNrZWxldGFsKCkge1xuICAgIGNvbnN0IGFhYmIgPSBuZXcgQUFCQigpO1xuICAgIGNvbnN0IG1lc2hDb21wb25lbnQgPSB0aGlzLmVudGl0eS50cnlUb0dldE1lc2goKTtcbiAgICBpZiAoSXMuZXhpc3QobWVzaENvbXBvbmVudCkgJiYgSXMuZXhpc3QobWVzaENvbXBvbmVudC5tZXNoKSkge1xuICAgICAgYWFiYi5tZXJnZUFBQkIobWVzaENvbXBvbmVudC5tZXNoLkFBQkIpO1xuXG4gICAgICBBQUJCLm11bHRpcGx5TWF0cml4VG8oXG4gICAgICAgIHRoaXMuZW50aXR5LmdldFNjZW5lR3JhcGgoKS5lbnRpdHlXb3JsZE1hdHJpeFdpdGhTa2VsZXRhbElubmVyLFxuICAgICAgICBhYWJiLFxuICAgICAgICBTY2VuZUdyYXBoQ29tcG9uZW50Ll9fdG1wQUFCQlxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgU2NlbmVHcmFwaENvbXBvbmVudC5fX3RtcEFBQkIuaW5pdGlhbGl6ZSgpO1xuICAgIH1cblxuICAgIGNvbnN0IHJheW1hcmNoaW5nQ29tcG9uZW50ID0gdGhpcy5lbnRpdHkudHJ5VG9HZXRSYXltYXJjaGluZygpO1xuICAgIGlmIChJcy5leGlzdChyYXltYXJjaGluZ0NvbXBvbmVudCkpIHtcbiAgICAgIGNvbnN0IHJheW1hcmNoaW5nQUFCQiA9IHJheW1hcmNoaW5nQ29tcG9uZW50LmNhbGNXb3JsZEFBQkIoKTtcbiAgICAgIGlmIChyYXltYXJjaGluZ0FBQkIgIT0gbnVsbCkge1xuICAgICAgICBTY2VuZUdyYXBoQ29tcG9uZW50Ll9fdG1wQUFCQi5tZXJnZUFBQkIocmF5bWFyY2hpbmdBQUJCKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gU2NlbmVHcmFwaENvbXBvbmVudC5fX3RtcEFBQkI7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyB0aGUgbWVyZ2VkIHdvcmxkIEFBQkIgd2l0aCBza2VsZXRhbCBhbmltYXRpb24gaW5jbHVkaW5nIGFsbCBjaGlsZHJlbi5cbiAgICogQHJldHVybnMgVGhlIG1lcmdlZCB3b3JsZCBBQUJCIHdpdGggc2tlbGV0YWwgdHJhbnNmb3JtYXRpb25zXG4gICAqL1xuICBjYWxjV29ybGRNZXJnZWRBQUJCV2l0aFNrZWxldGFsKCkge1xuICAgIGNvbnN0IGFhYmIgPSB0aGlzLmdldFdvcmxkQUFCQldpdGhTa2VsZXRhbCgpLmNsb25lKCk7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiB0aGlzLmNoaWxkcmVuKSB7XG4gICAgICBjb25zdCBjaGlsZEFBQkIgPSBjaGlsZC5jYWxjV29ybGRNZXJnZWRBQUJCV2l0aFNrZWxldGFsKCk7XG4gICAgICBhYWJiLm1lcmdlQUFCQihjaGlsZEFBQkIpO1xuICAgIH1cbiAgICB0aGlzLl9fd29ybGRNZXJnZWRBQUJCV2l0aFNrZWxldGFsID0gYWFiYjtcblxuICAgIHJldHVybiBhYWJiO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNhY2hlZCBtZXJnZWQgd29ybGQgQUFCQiB3aXRoIHNrZWxldGFsIGFuaW1hdGlvbiwgcmVjYWxjdWxhdGluZyBpZiBkaXJ0eS5cbiAgICogQHJldHVybnMgVGhlIG1lcmdlZCB3b3JsZCBBQUJCIHdpdGggc2tlbGV0YWwgdHJhbnNmb3JtYXRpb25zXG4gICAqL1xuICBnZXQgd29ybGRNZXJnZWRBQUJCV2l0aFNrZWxldGFsKCkge1xuICAgIGlmICh0aGlzLl9faXNXb3JsZEFBQkJEaXJ0eVdpdGhTa2VsZXRhbCkge1xuICAgICAgdGhpcy5jYWxjV29ybGRNZXJnZWRBQUJCV2l0aFNrZWxldGFsKCk7XG4gICAgICB0aGlzLl9faXNXb3JsZEFBQkJEaXJ0eVdpdGhTa2VsZXRhbCA9IGZhbHNlO1xuICAgICAgU2NlbmVHcmFwaENvbXBvbmVudC5fX2FhYmJEaXJ0eUNoYWluRXBvY2grKztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX193b3JsZE1lcmdlZEFBQkJXaXRoU2tlbGV0YWw7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgcmF5IGNhc3RpbmcgYWdhaW5zdCBhbGwgbWVzaCBhbmQgcmF5bWFyY2hpbmcgY29tcG9uZW50cyBpbiB0aGlzIGhpZXJhcmNoeS5cbiAgICpcbiAgICogQHBhcmFtIHNyY1BvaW50SW5Xb3JsZCAtIFRoZSByYXkgb3JpZ2luIHBvaW50IGluIHdvcmxkIHNwYWNlXG4gICAqIEBwYXJhbSBkaXJlY3Rpb25JbldvcmxkIC0gVGhlIHJheSBkaXJlY3Rpb24gdmVjdG9yIGluIHdvcmxkIHNwYWNlIChzaG91bGQgYmUgbm9ybWFsaXplZClcbiAgICogQHBhcmFtIGRvdFRocmVzaG9sZCAtIFRocmVzaG9sZCBmb3IgdHJpYW5nbGUtcmF5IGludGVyc2VjdGlvbiBhbmdsZSAoZGVmYXVsdDogMClcbiAgICogQHBhcmFtIGlnbm9yZU1lc2hDb21wb25lbnRzIC0gQXJyYXkgb2YgbWVzaCBjb21wb25lbnRzIHRvIGV4Y2x1ZGUgZnJvbSByYXkgY2FzdGluZyAoZGVmYXVsdDogW10pXG4gICAqIEByZXR1cm5zIFJheSBjYXN0aW5nIHJlc3VsdCBjb250YWluaW5nIGludGVyc2VjdGlvbiBpbmZvcm1hdGlvblxuICAgKi9cbiAgcHVibGljIGNhc3RSYXkoXG4gICAgc3JjUG9pbnRJbldvcmxkOiBWZWN0b3IzLFxuICAgIGRpcmVjdGlvbkluV29ybGQ6IFZlY3RvcjMsXG4gICAgZG90VGhyZXNob2xkID0gMCxcbiAgICBpZ25vcmVNZXNoQ29tcG9uZW50czogTWVzaENvbXBvbmVudFtdID0gW11cbiAgKTogUmF5Y2FzdFJlc3VsdEV4MiB7XG4gICAgY29uc3QgY29sbGVjdGVkU2dDb21wb25lbnRzID0gZmxhdHRlbkhpZXJhcmNoeSh0aGlzLCBmYWxzZSk7XG4gICAgY29uc3QgbWVzaENvbXBvbmVudHM6IE1lc2hDb21wb25lbnRbXSA9IFtdO1xuICAgIGZvciAoY29uc3Qgc2cgb2YgY29sbGVjdGVkU2dDb21wb25lbnRzKSB7XG4gICAgICBjb25zdCBtZXNoID0gc2cuZW50aXR5LnRyeVRvR2V0TWVzaCgpO1xuICAgICAgaWYgKG1lc2gpIHtcbiAgICAgICAgbWVzaENvbXBvbmVudHMucHVzaChtZXNoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgcmF5RGlzdGFuY2UgPSBOdW1iZXIuTUFYX1ZBTFVFO1xuICAgIGxldCBpbnRlcnNlY3RlZFBvc2l0aW9uO1xuICAgIGxldCBzZWxlY3RlZE1lc2hDb21wb25lbnQ7XG4gICAgbGV0IHNlbGVjdGVkUmF5bWFyY2hpbmdDb21wb25lbnQ7XG4gICAgbGV0IHUgPSAwO1xuICAgIGxldCB2ID0gMDtcbiAgICBmb3IgKGNvbnN0IG1lc2hDb21wb25lbnQgb2YgbWVzaENvbXBvbmVudHMpIHtcbiAgICAgIGlmICghbWVzaENvbXBvbmVudC5lbnRpdHkuZ2V0U2NlbmVHcmFwaCgpIS5pc1Zpc2libGUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAoIW1lc2hDb21wb25lbnQuaXNQaWNrYWJsZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChpZ25vcmVNZXNoQ29tcG9uZW50cy5pbmRleE9mKG1lc2hDb21wb25lbnQpICE9PSAtMSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJlc3VsdCA9IG1lc2hDb21wb25lbnQuY2FzdFJheShzcmNQb2ludEluV29ybGQsIGRpcmVjdGlvbkluV29ybGQsIGRvdFRocmVzaG9sZCk7XG4gICAgICBpZiAoSXMuZGVmaW5lZChyZXN1bHQuZGF0YSkgJiYgcmVzdWx0LmRhdGEudCA8IHJheURpc3RhbmNlKSB7XG4gICAgICAgIHJheURpc3RhbmNlID0gcmVzdWx0LmRhdGEudDtcbiAgICAgICAgaW50ZXJzZWN0ZWRQb3NpdGlvbiA9IHJlc3VsdC5kYXRhLnBvc2l0aW9uO1xuICAgICAgICBzZWxlY3RlZE1lc2hDb21wb25lbnQgPSBtZXNoQ29tcG9uZW50O1xuICAgICAgICBzZWxlY3RlZFJheW1hcmNoaW5nQ29tcG9uZW50ID0gdW5kZWZpbmVkO1xuICAgICAgICB1ID0gcmVzdWx0LmRhdGEudTtcbiAgICAgICAgdiA9IHJlc3VsdC5kYXRhLnY7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBzZyBvZiBjb2xsZWN0ZWRTZ0NvbXBvbmVudHMpIHtcbiAgICAgIGNvbnN0IHJheW1hcmNoaW5nQ29tcG9uZW50ID0gc2cuZW50aXR5LnRyeVRvR2V0UmF5bWFyY2hpbmcoKTtcbiAgICAgIGlmIChyYXltYXJjaGluZ0NvbXBvbmVudCA9PSBudWxsIHx8ICFyYXltYXJjaGluZ0NvbXBvbmVudC5pc1BpY2thYmxlIHx8ICFzZy5pc1Zpc2libGUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCByZXN1bHQgPSByYXltYXJjaGluZ0NvbXBvbmVudC5jYXN0UmF5KHNyY1BvaW50SW5Xb3JsZCwgZGlyZWN0aW9uSW5Xb3JsZCk7XG4gICAgICBpZiAocmVzdWx0ICE9IG51bGwgJiYgcmVzdWx0LnQgPCByYXlEaXN0YW5jZSkge1xuICAgICAgICByYXlEaXN0YW5jZSA9IHJlc3VsdC50O1xuICAgICAgICBpbnRlcnNlY3RlZFBvc2l0aW9uID0gcmVzdWx0LnBvc2l0aW9uO1xuICAgICAgICBzZWxlY3RlZE1lc2hDb21wb25lbnQgPSB1bmRlZmluZWQ7XG4gICAgICAgIHNlbGVjdGVkUmF5bWFyY2hpbmdDb21wb25lbnQgPSByYXltYXJjaGluZ0NvbXBvbmVudDtcbiAgICAgICAgdSA9IDA7XG4gICAgICAgIHYgPSAwO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICgoSXMuZXhpc3Qoc2VsZWN0ZWRNZXNoQ29tcG9uZW50KSB8fCBJcy5leGlzdChzZWxlY3RlZFJheW1hcmNoaW5nQ29tcG9uZW50KSkgJiYgSXMuZXhpc3QoaW50ZXJzZWN0ZWRQb3NpdGlvbikpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlc3VsdDogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIHQ6IHJheURpc3RhbmNlLFxuICAgICAgICAgIHUsXG4gICAgICAgICAgdixcbiAgICAgICAgICBwb3NpdGlvbjogaW50ZXJzZWN0ZWRQb3NpdGlvbixcbiAgICAgICAgICBzZWxlY3RlZE1lc2hDb21wb25lbnQsXG4gICAgICAgICAgc2VsZWN0ZWRSYXltYXJjaGluZ0NvbXBvbmVudCxcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICByZXN1bHQ6IGZhbHNlLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgcmF5IGNhc3RpbmcgZnJvbSBzY3JlZW4gY29vcmRpbmF0ZXMgYWdhaW5zdCBhbGwgbWVzaCBhbmQgcmF5bWFyY2hpbmcgY29tcG9uZW50cyBpbiB0aGlzIGhpZXJhcmNoeS5cbiAgICpcbiAgICogQHBhcmFtIHggLSBTY3JlZW4geCBjb29yZGluYXRlXG4gICAqIEBwYXJhbSB5IC0gU2NyZWVuIHkgY29vcmRpbmF0ZVxuICAgKiBAcGFyYW0gY2FtZXJhIC0gVGhlIGNhbWVyYSBjb21wb25lbnQgdG8gdXNlIGZvciBzY3JlZW4tdG8td29ybGQgcHJvamVjdGlvblxuICAgKiBAcGFyYW0gdmlld3BvcnQgLSBWaWV3cG9ydCByZWN0YW5nbGUgYXMgVmVjdG9yNCAoeCwgeSwgd2lkdGgsIGhlaWdodClcbiAgICogQHBhcmFtIGRvdFRocmVzaG9sZCAtIFRocmVzaG9sZCBmb3IgdHJpYW5nbGUtcmF5IGludGVyc2VjdGlvbiBhbmdsZSAoZGVmYXVsdDogMClcbiAgICogQHBhcmFtIGlnbm9yZU1lc2hDb21wb25lbnRzIC0gQXJyYXkgb2YgbWVzaCBjb21wb25lbnRzIHRvIGV4Y2x1ZGUgZnJvbSByYXkgY2FzdGluZyAoZGVmYXVsdDogW10pXG4gICAqIEByZXR1cm5zIFJheSBjYXN0aW5nIHJlc3VsdCBjb250YWluaW5nIGludGVyc2VjdGlvbiBpbmZvcm1hdGlvbiBpbiB3b3JsZCBzcGFjZVxuICAgKi9cbiAgY2FzdFJheUZyb21TY3JlZW4oXG4gICAgeDogbnVtYmVyLFxuICAgIHk6IG51bWJlcixcbiAgICBjYW1lcmE6IENhbWVyYUNvbXBvbmVudCxcbiAgICB2aWV3cG9ydDogVmVjdG9yNCxcbiAgICBkb3RUaHJlc2hvbGQgPSAwLFxuICAgIGlnbm9yZU1lc2hDb21wb25lbnRzOiBNZXNoQ29tcG9uZW50W10gPSBbXVxuICApOiBSYXljYXN0UmVzdWx0RXgyIHtcbiAgICBjb25zdCBjb2xsZWN0ZWRTZ0NvbXBvbmVudHMgPSBmbGF0dGVuSGllcmFyY2h5KHRoaXMsIGZhbHNlKTtcbiAgICBjb25zdCBtZXNoQ29tcG9uZW50czogTWVzaENvbXBvbmVudFtdID0gW107XG4gICAgZm9yIChjb25zdCBzZyBvZiBjb2xsZWN0ZWRTZ0NvbXBvbmVudHMpIHtcbiAgICAgIGNvbnN0IG1lc2ggPSBzZy5lbnRpdHkudHJ5VG9HZXRNZXNoKCk7XG4gICAgICBpZiAobWVzaCkge1xuICAgICAgICBtZXNoQ29tcG9uZW50cy5wdXNoKG1lc2gpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxldCByYXlEaXN0YW5jZSA9IE51bWJlci5NQVhfVkFMVUU7XG4gICAgbGV0IGludGVyc2VjdGVkUG9zaXRpb247XG4gICAgbGV0IHNlbGVjdGVkTWVzaENvbXBvbmVudDtcbiAgICBsZXQgc2VsZWN0ZWRSYXltYXJjaGluZ0NvbXBvbmVudDtcbiAgICBsZXQgdSA9IDA7XG4gICAgbGV0IHYgPSAwO1xuICAgIGZvciAoY29uc3QgbWVzaENvbXBvbmVudCBvZiBtZXNoQ29tcG9uZW50cykge1xuICAgICAgaWYgKCFtZXNoQ29tcG9uZW50LmVudGl0eS5nZXRTY2VuZUdyYXBoKCkuaXNWaXNpYmxlKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKCFtZXNoQ29tcG9uZW50LmlzUGlja2FibGUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAoaWdub3JlTWVzaENvbXBvbmVudHMuaW5kZXhPZihtZXNoQ29tcG9uZW50KSAhPT0gLTEpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCByZXN1bHQgPSBtZXNoQ29tcG9uZW50LmNhc3RSYXlGcm9tU2NyZWVuSW5Xb3JsZCh4LCB5LCBjYW1lcmEsIHZpZXdwb3J0LCBkb3RUaHJlc2hvbGQpO1xuICAgICAgaWYgKElzLmRlZmluZWQocmVzdWx0LmRhdGEpICYmIHJlc3VsdC5kYXRhLnQgPCByYXlEaXN0YW5jZSkge1xuICAgICAgICByYXlEaXN0YW5jZSA9IHJlc3VsdC5kYXRhLnQ7XG4gICAgICAgIGludGVyc2VjdGVkUG9zaXRpb24gPSByZXN1bHQuZGF0YS5wb3NpdGlvbjtcbiAgICAgICAgc2VsZWN0ZWRNZXNoQ29tcG9uZW50ID0gbWVzaENvbXBvbmVudDtcbiAgICAgICAgc2VsZWN0ZWRSYXltYXJjaGluZ0NvbXBvbmVudCA9IHVuZGVmaW5lZDtcbiAgICAgICAgdSA9IHJlc3VsdC5kYXRhLnU7XG4gICAgICAgIHYgPSByZXN1bHQuZGF0YS52O1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3Qgc2cgb2YgY29sbGVjdGVkU2dDb21wb25lbnRzKSB7XG4gICAgICBjb25zdCByYXltYXJjaGluZ0NvbXBvbmVudCA9IHNnLmVudGl0eS50cnlUb0dldFJheW1hcmNoaW5nKCk7XG4gICAgICBpZiAocmF5bWFyY2hpbmdDb21wb25lbnQgPT0gbnVsbCB8fCAhcmF5bWFyY2hpbmdDb21wb25lbnQuaXNQaWNrYWJsZSB8fCAhc2cuaXNWaXNpYmxlKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgcmVzdWx0ID0gcmF5bWFyY2hpbmdDb21wb25lbnQuY2FzdFJheUZyb21TY3JlZW4oeCwgeSwgY2FtZXJhLCB2aWV3cG9ydCk7XG4gICAgICBpZiAocmVzdWx0LnJlc3VsdCAmJiByZXN1bHQuZGF0YSAhPSBudWxsICYmIHJlc3VsdC5kYXRhLnQgPCByYXlEaXN0YW5jZSkge1xuICAgICAgICByYXlEaXN0YW5jZSA9IHJlc3VsdC5kYXRhLnQ7XG4gICAgICAgIGludGVyc2VjdGVkUG9zaXRpb24gPSByZXN1bHQuZGF0YS5wb3NpdGlvbjtcbiAgICAgICAgc2VsZWN0ZWRNZXNoQ29tcG9uZW50ID0gdW5kZWZpbmVkO1xuICAgICAgICBzZWxlY3RlZFJheW1hcmNoaW5nQ29tcG9uZW50ID0gcmF5bWFyY2hpbmdDb21wb25lbnQ7XG4gICAgICAgIHUgPSAwO1xuICAgICAgICB2ID0gMDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoKElzLmV4aXN0KHNlbGVjdGVkTWVzaENvbXBvbmVudCkgfHwgSXMuZXhpc3Qoc2VsZWN0ZWRSYXltYXJjaGluZ0NvbXBvbmVudCkpICYmIElzLmV4aXN0KGludGVyc2VjdGVkUG9zaXRpb24pKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZXN1bHQ6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICB0OiByYXlEaXN0YW5jZSxcbiAgICAgICAgICB1LFxuICAgICAgICAgIHYsXG4gICAgICAgICAgcG9zaXRpb246IGludGVyc2VjdGVkUG9zaXRpb24sXG4gICAgICAgICAgc2VsZWN0ZWRNZXNoQ29tcG9uZW50LFxuICAgICAgICAgIHNlbGVjdGVkUmF5bWFyY2hpbmdDb21wb25lbnQsXG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgcmVzdWx0OiBmYWxzZSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIHRoZSBjb21wb25lbnQgYW5kIG1vdmVzIHRvIHRoZSBMb2dpYyBzdGFnZS5cbiAgICovXG4gICRsb2FkKCkge1xuICAgIHRoaXMubW92ZVN0YWdlVG8oUHJvY2Vzc1N0YWdlLkxvZ2ljKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlcyBsb2dpYyBzdGFnZSBwcm9jZXNzaW5nIGluY2x1ZGluZyBtYXRyaXggdXBkYXRlcyBhbmQgZ2l6bW8gdXBkYXRlcy5cbiAgICovXG4gICRsb2dpYygpIHtcbiAgICAvLyBOb3RoaW5nIHRoaXMgbm9kZSBkZXJpdmVzIGhhcyBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IGxvZ2ljRm9yY2UuIE1vc3Qgbm9kZXMgb2YgYSBsYXJnZSBzY2VuZSBhcmVcbiAgICAvLyBzdGF0aWMsIGFuZCB0aGlzIGNoZWNrIGF2b2lkcyB0aGUgZW50aXR5IGFuZCBtZXNoIGxvb2t1cHMgb2YgbG9naWNGb3JjZSBmb3IgdGhlbS5cbiAgICBpZiAoXG4gICAgICB0aGlzLl9fc2V0dGxlZFdvcmxkTWF0cml4VmVyc2lvbiA9PT0gdGhpcy5fX3dvcmxkTWF0cml4VmVyc2lvbiAmJlxuICAgICAgdGhpcy5fX2lzV29ybGRNYXRyaXhVcFRvRGF0ZSAmJlxuICAgICAgIXRoaXMuX19oYXNHaXptb3MgJiZcbiAgICAgIHRoaXMuX19zZXR0bGVkQ29tcG9uZW50Q3JlYXRpb25Db3VudCA9PT0gdGhpcy5fX2VuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5Ll9jb21wb25lbnRDcmVhdGlvbkNvdW50XG4gICAgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLl9fbGFzdFRyYW5zZm9ybUNvbXBvbmVudHNVcGRhdGVDb3VudCA9PT0gVHJhbnNmb3JtQ29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5sb2dpY0ZvcmNlKCk7XG5cbiAgICAvLyBjb25zdCBtZXNoQ29tcG9uZW50ID0gdGhpcy5lbnRpdHkudHJ5VG9HZXRNZXNoKCk7XG4gICAgLy8gaWYgKG1lc2hDb21wb25lbnQgIT0gbnVsbCkge1xuICAgIC8vICAgY29uc3QgbWVzaCA9IG1lc2hDb21wb25lbnQubWVzaDtcbiAgICAvLyAgIGlmIChtZXNoICE9IG51bGwpIHtcbiAgICAvLyAgICAgY29uc3QgcHJpbWl0aXZlTnVtID0gbWVzaC5nZXRQcmltaXRpdmVOdW1iZXIoKTtcbiAgICAvLyAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmltaXRpdmVOdW07IGkrKykge1xuICAgIC8vICAgICAgIGNvbnN0IHByaW1pdGl2ZSA9IG1lc2guZ2V0UHJpbWl0aXZlQXQoaSk7XG4gICAgLy8gICAgICAgaWYgKHByaW1pdGl2ZS5wb3NpdGlvbkFjY2Vzc29yVmVyc2lvbiAhPT0gdGhpcy5fX2xhdGVzdFByaW1pdGl2ZVBvc2l0aW9uQWNjZXNzb3JWZXJzaW9uKSB7XG4gICAgLy8gICAgICAgICB0aGlzLnNldFdvcmxkQUFCQkRpcnR5UGFyZW50UmVjdXJzaXZlbHkoKTtcbiAgICAvLyAgICAgICAgIHRoaXMuX19sYXRlc3RQcmltaXRpdmVQb3NpdGlvbkFjY2Vzc29yVmVyc2lvbiA9IHByaW1pdGl2ZS5wb3NpdGlvbkFjY2Vzc29yVmVyc2lvbiE7XG4gICAgLy8gICAgICAgICBicmVhaztcbiAgICAvLyAgICAgICB9XG4gICAgLy8gICAgIH1cbiAgICAvLyAgIH1cbiAgICAvLyB9XG5cbiAgICB0aGlzLl9fbGFzdFRyYW5zZm9ybUNvbXBvbmVudHNVcGRhdGVDb3VudCA9IFRyYW5zZm9ybUNvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKTtcbiAgfVxuXG4gIGxvZ2ljRm9yY2UoKSB7XG4gICAgdGhpcy5tYXRyaXhJbm5lcjtcbiAgICAvLyBgbm9ybWFsTWF0cml4YCBpcyBhIEdQVSBpbnN0YW5jZSBkYXRhIG1lbWJlciwgc28gaXQgbXVzdCBiZSB1cCB0byBkYXRlIGJlZm9yZSB0aGUgaW5zdGFuY2VcbiAgICAvLyBkYXRhIGJ1ZmZlciBpcyB1cGxvYWRlZC4gT25seSBkcmF3YWJsZSBlbnRpdGllcyBuZWVkIGl0OyBza2lwcGluZyBib25lcyBhbmQgZ3JvdXAgbm9kZXNcbiAgICAvLyBhdm9pZHMgYW4gaW52ZXJzZS10cmFuc3Bvc2UgcGVyIHNrZWxldG9uIG5vZGUuXG4gICAgaWYgKHRoaXMuZW50aXR5LnRyeVRvR2V0TWVzaCgpICE9IG51bGwpIHtcbiAgICAgIHRoaXMubm9ybWFsTWF0cml4SW5uZXI7XG4gICAgfVxuICAgIHRoaXMuX191cGRhdGVHaXptb3MoKTtcbiAgICB0aGlzLl9fc2V0dGxlZFdvcmxkTWF0cml4VmVyc2lvbiA9IHRoaXMuX193b3JsZE1hdHJpeFZlcnNpb247XG4gICAgdGhpcy5fX3NldHRsZWRDb21wb25lbnRDcmVhdGlvbkNvdW50ID0gdGhpcy5fX2VuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5Ll9jb21wb25lbnRDcmVhdGlvbkNvdW50O1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgYWxsIGFjdGl2ZSBnaXptb3MgZm9yIHRoaXMgc2NlbmUgZ3JhcGggbm9kZS5cbiAgICovXG4gIHByaXZhdGUgX191cGRhdGVHaXptb3MoKSB7XG4gICAgaWYgKCF0aGlzLl9faGFzR2l6bW9zKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChJcy5leGlzdCh0aGlzLl9fYWFiYkdpem1vKSAmJiB0aGlzLl9fYWFiYkdpem1vLmlzU2V0dXAgJiYgdGhpcy5fX2FhYmJHaXptby5pc1Zpc2libGUpIHtcbiAgICAgIHRoaXMuX19hYWJiR2l6bW8uX3VwZGF0ZSgpO1xuICAgIH1cbiAgICBpZiAoSXMuZXhpc3QodGhpcy5fX2xvY2F0b3JHaXptbykgJiYgdGhpcy5fX2xvY2F0b3JHaXptby5pc1NldHVwICYmIHRoaXMuX19sb2NhdG9yR2l6bW8uaXNWaXNpYmxlKSB7XG4gICAgICB0aGlzLl9fbG9jYXRvckdpem1vLl91cGRhdGUoKTtcbiAgICB9XG4gICAgdGhpcy5fX3VwZGF0ZVRyYW5zZm9ybUdpem1vcygpO1xuICAgIGlmIChJcy5leGlzdCh0aGlzLl9fam9pbnRHaXptbykgJiYgdGhpcy5fX2pvaW50R2l6bW8uaXNTZXR1cCAmJiB0aGlzLl9fam9pbnRHaXptby5pc1Zpc2libGUpIHtcbiAgICAgIHRoaXMuX19qb2ludEdpem1vLl91cGRhdGUoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgdHJhbnNsYXRpb24sIHJvdGF0aW9uIGFuZCBzY2FsZSBnaXptb3MuXG4gICAqIFRoZWlyIHNpemUgZGVwZW5kcyBvbiB0aGUgY2FtZXJhLCBzbyB0aGlzIGlzIGFsc28gY2FsbGVkIHdoZW4gb25seSB0aGUgY2FtZXJhIGNoYW5nZWQuXG4gICAqL1xuICBwcml2YXRlIF9fdXBkYXRlVHJhbnNmb3JtR2l6bW9zKCkge1xuICAgIGlmIChJcy5leGlzdCh0aGlzLl9fdHJhbnNsYXRpb25HaXptbykgJiYgdGhpcy5fX3RyYW5zbGF0aW9uR2l6bW8uaXNTZXR1cCAmJiB0aGlzLl9fdHJhbnNsYXRpb25HaXptby5pc1Zpc2libGUpIHtcbiAgICAgIHRoaXMuX190cmFuc2xhdGlvbkdpem1vLl91cGRhdGUoKTtcbiAgICB9XG4gICAgaWYgKElzLmV4aXN0KHRoaXMuX19yb3RhdGlvbkdpem1vKSAmJiB0aGlzLl9fcm90YXRpb25HaXptby5pc1NldHVwICYmIHRoaXMuX19yb3RhdGlvbkdpem1vLmlzVmlzaWJsZSkge1xuICAgICAgdGhpcy5fX3JvdGF0aW9uR2l6bW8uX3VwZGF0ZSgpO1xuICAgIH1cbiAgICBpZiAoSXMuZXhpc3QodGhpcy5fX3NjYWxlR2l6bW8pICYmIHRoaXMuX19zY2FsZUdpem1vLmlzU2V0dXAgJiYgdGhpcy5fX3NjYWxlR2l6bW8uaXNWaXNpYmxlKSB7XG4gICAgICB0aGlzLl9fc2NhbGVHaXptby5fdXBkYXRlKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIGFueSB0cmFuc2Zvcm0gZ2l6bW8gaXMgc2V0IHVwIGFuZCB2aXNpYmxlIG9uIHRoaXMgbm9kZS5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiBhdCBsZWFzdCBvbmUgb2YgdGhlIHRyYW5zbGF0aW9uL3JvdGF0aW9uL3NjYWxlIGdpem1vcyBpcyB2aXNpYmxlXG4gICAqL1xuICBwcml2YXRlIF9faGFzVmlzaWJsZVRyYW5zZm9ybUdpem1vKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoXG4gICAgICAoSXMuZXhpc3QodGhpcy5fX3RyYW5zbGF0aW9uR2l6bW8pICYmIHRoaXMuX190cmFuc2xhdGlvbkdpem1vLmlzU2V0dXAgJiYgdGhpcy5fX3RyYW5zbGF0aW9uR2l6bW8uaXNWaXNpYmxlKSB8fFxuICAgICAgKElzLmV4aXN0KHRoaXMuX19yb3RhdGlvbkdpem1vKSAmJiB0aGlzLl9fcm90YXRpb25HaXptby5pc1NldHVwICYmIHRoaXMuX19yb3RhdGlvbkdpem1vLmlzVmlzaWJsZSkgfHxcbiAgICAgIChJcy5leGlzdCh0aGlzLl9fc2NhbGVHaXptbykgJiYgdGhpcy5fX3NjYWxlR2l6bW8uaXNTZXR1cCAmJiB0aGlzLl9fc2NhbGVHaXptby5pc1Zpc2libGUpXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgdGhpcyBub2RlIGFzIGFuIG93bmVyIG9mIGEgdmlzaWJsZSB0cmFuc2Zvcm0gZ2l6bW8gc28gdGhhdCB0aGVcbiAgICogZ2l6bW9zIGNhbiBiZSByZXNjYWxlZCB3aGVuIG9ubHkgdGhlIGNhbWVyYSBjaGFuZ2VkLlxuICAgKi9cbiAgcHJpdmF0ZSBfX3JlZ2lzdGVyVHJhbnNmb3JtR2l6bW9Pd25lcigpOiB2b2lkIHtcbiAgICBjb25zdCBlbmdpbmVVaWQgPSB0aGlzLl9fZW5naW5lLm9iamVjdFVJRDtcbiAgICBsZXQgb3duZXJzID0gU2NlbmVHcmFwaENvbXBvbmVudC5fX3RyYW5zZm9ybUdpem1vT3duZXJzLmdldChlbmdpbmVVaWQpO1xuICAgIGlmIChvd25lcnMgPT0gbnVsbCkge1xuICAgICAgb3duZXJzID0gbmV3IFNldCgpO1xuICAgICAgU2NlbmVHcmFwaENvbXBvbmVudC5fX3RyYW5zZm9ybUdpem1vT3duZXJzLnNldChlbmdpbmVVaWQsIG93bmVycyk7XG4gICAgfVxuICAgIG93bmVycy5hZGQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyB0aGlzIG5vZGUgZnJvbSB0aGUgdHJhbnNmb3JtIGdpem1vIHJlZ2lzdHJ5IHdoZW4gbm8gdHJhbnNmb3JtIGdpem1vIGlzIHZpc2libGUuXG4gICAqL1xuICBwcml2YXRlIF9fdW5yZWdpc3RlclRyYW5zZm9ybUdpem1vT3duZXJJZk5lZWRlZCgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX19oYXNWaXNpYmxlVHJhbnNmb3JtR2l6bW8oKSkge1xuICAgICAgU2NlbmVHcmFwaENvbXBvbmVudC5fX3RyYW5zZm9ybUdpem1vT3duZXJzLmdldCh0aGlzLl9fZW5naW5lLm9iamVjdFVJRCk/LmRlbGV0ZSh0aGlzKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmUtYXBwbGllcyB0aGUgc2NyZWVuLXNwYWNlIGdpem1vIHNjYWxlIGFmdGVyIHRoZSBjYW1lcmEgaGFzIGJlZW4gdXBkYXRlZC5cbiAgICpcbiAgICogVGhlIHRyYW5zZm9ybSBnaXptb3Mga2VlcCBhIGNvbnN0YW50IG9uLXNjcmVlbiBzaXplLCBzbyB0aGV5IG11c3QgYmUgcmVzY2FsZWQgd2hlbmV2ZXIgdGhlXG4gICAqIGNhbWVyYSBjaGFuZ2VzLiBTY2VuZUdyYXBoQ29tcG9uZW50IChUSUQgNCkgaXMgcHJvY2Vzc2VkIGJlZm9yZSBDYW1lcmFDb21wb25lbnQgKFRJRCA5KSBpblxuICAgKiB0aGUgTG9naWMgc3RhZ2UsIHNvIHRoaXMgaXMgY2FsbGVkIGJ5IHRoZSBFbmdpbmUgcmlnaHQgYWZ0ZXIgdGhlIExvZ2ljIHN0YWdlIGhhcyBmaW5pc2hlZCxcbiAgICogd2hpY2ggYWxzbyBjb3ZlcnMgZnJhbWVzIGluIHdoaWNoIHRoZSBFbmdpbmUgc2tpcHMgdGhlIExvZ2ljIHN0YWdlIGVudGlyZWx5LlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSB3aG9zZSBjdXJyZW50IGNhbWVyYSBtYXkgaGF2ZSBjaGFuZ2VkXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIF91cGRhdGVUcmFuc2Zvcm1HaXptb3NCeUNhbWVyYUNoYW5nZShlbmdpbmU6IEVuZ2luZSk6IHZvaWQge1xuICAgIGNvbnN0IGNvbXBvbmVudFNJRCA9IENhbWVyYUNvbXBvbmVudC5nZXRDdXJyZW50KGVuZ2luZSk7XG4gICAgY29uc3QgdXBkYXRlQ291bnQgPSBDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudENhbWVyYVVwZGF0ZUNvdW50KGVuZ2luZSk7XG4gICAgY29uc3QgZW5naW5lVWlkID0gZW5naW5lLm9iamVjdFVJRDtcblxuICAgIGNvbnN0IGxhc3RDYW1lcmFTdGF0ZSA9IFNjZW5lR3JhcGhDb21wb25lbnQuX19sYXN0Q2FtZXJhU3RhdGVNYXAuZ2V0KGVuZ2luZVVpZCk7XG4gICAgaWYgKFxuICAgICAgbGFzdENhbWVyYVN0YXRlICE9IG51bGwgJiZcbiAgICAgIGxhc3RDYW1lcmFTdGF0ZS5jb21wb25lbnRTSUQgPT09IGNvbXBvbmVudFNJRCAmJlxuICAgICAgbGFzdENhbWVyYVN0YXRlLnVwZGF0ZUNvdW50ID09PSB1cGRhdGVDb3VudFxuICAgICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBTY2VuZUdyYXBoQ29tcG9uZW50Ll9fbGFzdENhbWVyYVN0YXRlTWFwLnNldChlbmdpbmVVaWQsIHsgY29tcG9uZW50U0lELCB1cGRhdGVDb3VudCB9KTtcblxuICAgIGNvbnN0IG93bmVycyA9IFNjZW5lR3JhcGhDb21wb25lbnQuX190cmFuc2Zvcm1HaXptb093bmVycy5nZXQoZW5naW5lVWlkKTtcbiAgICBpZiAob3duZXJzID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZm9yIChjb25zdCBzY2VuZUdyYXBoIG9mIG93bmVycykge1xuICAgICAgc2NlbmVHcmFwaC5fX3VwZGF0ZVRyYW5zZm9ybUdpem1vcygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB3b3JsZCBwb3NpdGlvbiB3aXRob3V0IHVwZGF0aW5nIHBoeXNpY3Mgc2ltdWxhdGlvbi5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSB3b3JsZCBwb3NpdGlvbiB0byBzZXRcbiAgICovXG4gIHNldFBvc2l0aW9uV2l0aG91dFBoeXNpY3ModmVjOiBJVmVjdG9yMykge1xuICAgIGlmIChJcy5ub3QuZXhpc3QodGhpcy5fX3BhcmVudCkpIHtcbiAgICAgIHRoaXMuZW50aXR5LmdldFRyYW5zZm9ybSgpLmxvY2FsUG9zaXRpb25XaXRob3V0UGh5c2ljcyA9IHZlYztcbiAgICB9IGVsc2Uge1xuICAgICAgTXV0YWJsZU1hdHJpeDQ0LmludmVydFRvKHRoaXMuX19wYXJlbnQuZW50aXR5LmdldFNjZW5lR3JhcGgoKS5tYXRyaXhJbm5lciwgU2NlbmVHcmFwaENvbXBvbmVudC5fX3RtcF9tYXQ0KTtcbiAgICAgIHRoaXMuZW50aXR5LmdldFRyYW5zZm9ybSgpLmxvY2FsUG9zaXRpb25XaXRob3V0UGh5c2ljcyA9IFNjZW5lR3JhcGhDb21wb25lbnQuX190bXBfbWF0NC5tdWx0aXBseVZlY3RvcjModmVjKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgd29ybGQgcG9zaXRpb24gYW5kIHVwZGF0ZXMgcGh5c2ljcyBzaW11bGF0aW9uIGlmIHByZXNlbnQuXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgd29ybGQgcG9zaXRpb24gdG8gc2V0XG4gICAqL1xuICBzZXQgcG9zaXRpb24odmVjOiBJVmVjdG9yMykge1xuICAgIHRoaXMuc2V0UG9zaXRpb25XaXRob3V0UGh5c2ljcyh2ZWMpO1xuICAgIHRoaXMuc2V0UG9zaXRpb25Ub1BoeXNpY3ModmVjKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBwaHlzaWNzIHNpbXVsYXRpb24gd2l0aCB0aGUgbmV3IHBvc2l0aW9uLlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHdvcmxkIHBvc2l0aW9uIHRvIHNldCBpbiBwaHlzaWNzXG4gICAqL1xuICBzZXRQb3NpdGlvblRvUGh5c2ljcyh2ZWM6IElWZWN0b3IzKSB7XG4gICAgY29uc3QgcGh5c2ljc0NvbXBvbmVudCA9IHRoaXMuZW50aXR5LnRyeVRvR2V0UGh5c2ljcygpO1xuICAgIGlmIChwaHlzaWNzQ29tcG9uZW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmIChwaHlzaWNzQ29tcG9uZW50LnN0cmF0ZWd5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcGh5c2ljc0NvbXBvbmVudC5zdHJhdGVneS5zZXRQb3NpdGlvbj8uKHZlYyk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX19zeW5jRGVzY2VuZGFudFBoeXNpY3NUcmFuc2Zvcm1zKHRydWUsIGZhbHNlLCBmYWxzZSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgd29ybGQgcG9zaXRpb24gb2YgdGhpcyBub2RlLlxuICAgKiBAcmV0dXJucyBUaGUgd29ybGQgcG9zaXRpb25cbiAgICovXG4gIGdldCBwb3NpdGlvbigpOiBNdXRhYmxlVmVjdG9yMyB7XG4gICAgcmV0dXJuIHRoaXMubWF0cml4SW5uZXIuZ2V0VHJhbnNsYXRlKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgd29ybGQgcG9zaXRpb24gYW5kIHN0b3JlcyBpdCBpbiB0aGUgb3V0cHV0IHZlY3Rvci5cbiAgICogQHBhcmFtIG91dFZlYyAtIFRoZSBvdXRwdXQgdmVjdG9yIHRvIHN0b3JlIHRoZSBwb3NpdGlvblxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHZlY3RvciBjb250YWluaW5nIHRoZSB3b3JsZCBwb3NpdGlvblxuICAgKi9cbiAgZ2V0UG9zaXRpb25UbyhvdXRWZWM6IE11dGFibGVWZWN0b3IzKTogTXV0YWJsZVZlY3RvcjMge1xuICAgIHJldHVybiB0aGlzLm1hdHJpeElubmVyLmdldFRyYW5zbGF0ZVRvKG91dFZlYyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgd29ybGQgcG9zaXRpb24gaW4gcmVzdCBwb3NlLlxuICAgKiBAcmV0dXJucyBUaGUgd29ybGQgcG9zaXRpb24gaW4gcmVzdCBwb3NlXG4gICAqL1xuICBnZXQgcG9zaXRpb25SZXN0KCk6IE11dGFibGVWZWN0b3IzIHtcbiAgICByZXR1cm4gdGhpcy5tYXRyaXhSZXN0SW5uZXIuZ2V0VHJhbnNsYXRlKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgd29ybGQgcG9zaXRpb24gaW4gcmVzdCBwb3NlIGFuZCBzdG9yZXMgaXQgaW4gdGhlIG91dHB1dCB2ZWN0b3IuXG4gICAqIEBwYXJhbSBvdXRWZWMgLSBUaGUgb3V0cHV0IHZlY3RvciB0byBzdG9yZSB0aGUgcG9zaXRpb25cbiAgICogQHJldHVybnMgVGhlIG91dHB1dCB2ZWN0b3IgY29udGFpbmluZyB0aGUgd29ybGQgcG9zaXRpb24gaW4gcmVzdCBwb3NlXG4gICAqL1xuICBnZXRQb3NpdGlvblJlc3RUbyhvdXRWZWM6IE11dGFibGVWZWN0b3IzKTogTXV0YWJsZVZlY3RvcjMge1xuICAgIHJldHVybiB0aGlzLm1hdHJpeFJlc3RJbm5lci5nZXRUcmFuc2xhdGVUbyhvdXRWZWMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHdvcmxkIHJvdGF0aW9uIHVzaW5nIEV1bGVyIGFuZ2xlcyBhbmQgdXBkYXRlcyBwaHlzaWNzIHNpbXVsYXRpb24gaWYgcHJlc2VudC5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSBFdWxlciBhbmdsZXMgKGluIHJhZGlhbnMpIHRvIHNldFxuICAgKi9cbiAgc2V0IGV1bGVyQW5nbGVzKHZlYzogSVZlY3RvcjMpIHtcbiAgICBpZiAoSXMubm90LmV4aXN0KHRoaXMuX19wYXJlbnQpKSB7XG4gICAgICB0aGlzLmVudGl0eS5nZXRUcmFuc2Zvcm0oKS5sb2NhbEV1bGVyQW5nbGVzV2l0aG91dFBoeXNpY3MgPSB2ZWM7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHF1YXQgPSBRdWF0ZXJuaW9uLmZyb21NYXRyaXgodGhpcy5fX3BhcmVudC5lbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLm1hdHJpeElubmVyKTtcbiAgICAgIGNvbnN0IGludlF1YXQgPSBRdWF0ZXJuaW9uLmludmVydChxdWF0KTtcbiAgICAgIGNvbnN0IHJvdGF0aW9uID0gUXVhdGVybmlvbi5mcm9tTWF0cml4KE1hdHJpeDQ0LnJvdGF0ZSh2ZWMpKTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFF1YXRlcm5pb24ubXVsdGlwbHkocm90YXRpb24sIGludlF1YXQpO1xuICAgICAgdGhpcy5lbnRpdHkuZ2V0VHJhbnNmb3JtKCkubG9jYWxFdWxlckFuZ2xlc1dpdGhvdXRQaHlzaWNzID0gcmVzdWx0LnRvRXVsZXJBbmdsZXMoKTtcbiAgICB9XG4gICAgdGhpcy5zZXRFdWxlckFuZ2xlc1RvUGh5c2ljcyh2ZWMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIHBoeXNpY3Mgc2ltdWxhdGlvbiB3aXRoIHRoZSBuZXcgRXVsZXIgYW5nbGVzLlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIEV1bGVyIGFuZ2xlcyAoaW4gcmFkaWFucykgdG8gc2V0IGluIHBoeXNpY3NcbiAgICovXG4gIHNldEV1bGVyQW5nbGVzVG9QaHlzaWNzKHZlYzogSVZlY3RvcjMpIHtcbiAgICBjb25zdCBwaHlzaWNzQ29tcG9uZW50ID0gdGhpcy5lbnRpdHkudHJ5VG9HZXRQaHlzaWNzKCk7XG4gICAgaWYgKHBoeXNpY3NDb21wb25lbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHBoeXNpY3NDb21wb25lbnQuc3RyYXRlZ3kgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb25zdCBzdHJhdGVneSA9IHBoeXNpY3NDb21wb25lbnQuc3RyYXRlZ3k7XG4gICAgICAgIGlmIChzdHJhdGVneS5zZXRFdWxlckFuZ2xlICE9IG51bGwpIHtcbiAgICAgICAgICBzdHJhdGVneS5zZXRFdWxlckFuZ2xlKHZlYyk7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RyYXRlZ3kuc2V0Um90YXRpb24gIT0gbnVsbCkge1xuICAgICAgICAgIHN0cmF0ZWd5LnNldFJvdGF0aW9uKFF1YXRlcm5pb24uZnJvbU1hdHJpeChNYXRyaXg0NC5yb3RhdGUodmVjKSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX19zeW5jUGh5c2ljc1RyYW5zZm9ybXNBZnRlclJvdGF0aW9uKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgd29ybGQgcm90YXRpb24gYXMgRXVsZXIgYW5nbGVzLlxuICAgKiBAcmV0dXJucyBUaGUgd29ybGQgcm90YXRpb24gYXMgRXVsZXIgYW5nbGVzIChpbiByYWRpYW5zKVxuICAgKi9cbiAgZ2V0IGV1bGVyQW5nbGVzKCk6IFZlY3RvcjMge1xuICAgIHJldHVybiB0aGlzLm1hdHJpeElubmVyLnRvRXVsZXJBbmdsZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB3b3JsZCByb3RhdGlvbiB3aXRob3V0IHVwZGF0aW5nIHBoeXNpY3Mgc2ltdWxhdGlvbi5cbiAgICogQHBhcmFtIHF1YXQgLSBUaGUgcXVhdGVybmlvbiByb3RhdGlvbiB0byBzZXRcbiAgICovXG4gIHNldFJvdGF0aW9uV2l0aG91dFBoeXNpY3MocXVhdDogSVF1YXRlcm5pb24pIHtcbiAgICBpZiAoSXMubm90LmV4aXN0KHRoaXMuX19wYXJlbnQpKSB7XG4gICAgICB0aGlzLmVudGl0eS5nZXRUcmFuc2Zvcm0oKS5sb2NhbFJvdGF0aW9uV2l0aG91dFBoeXNpY3MgPSBxdWF0O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBxdWF0SW5uZXIgPSB0aGlzLl9fcGFyZW50LmVudGl0eS5nZXRTY2VuZUdyYXBoKCkucm90YXRpb247XG4gICAgICBjb25zdCBpbnZRdWF0ID0gUXVhdGVybmlvbi5pbnZlcnQocXVhdElubmVyKTtcbiAgICAgIHRoaXMuZW50aXR5LmdldFRyYW5zZm9ybSgpLmxvY2FsUm90YXRpb25XaXRob3V0UGh5c2ljcyA9IFF1YXRlcm5pb24ubXVsdGlwbHkocXVhdCwgaW52UXVhdCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHdvcmxkIHJvdGF0aW9uIGFuZCB1cGRhdGVzIHBoeXNpY3Mgc2ltdWxhdGlvbiBpZiBwcmVzZW50LlxuICAgKiBAcGFyYW0gcXVhdCAtIFRoZSBxdWF0ZXJuaW9uIHJvdGF0aW9uIHRvIHNldFxuICAgKi9cbiAgc2V0IHJvdGF0aW9uKHF1YXQ6IElRdWF0ZXJuaW9uKSB7XG4gICAgdGhpcy5zZXRSb3RhdGlvbldpdGhvdXRQaHlzaWNzKHF1YXQpO1xuICAgIHRoaXMuc2V0Um90YXRpb25Ub1BoeXNpY3MocXVhdCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgcGh5c2ljcyBzaW11bGF0aW9uIHdpdGggdGhlIG5ldyByb3RhdGlvbi5cbiAgICogQHBhcmFtIHF1YXQgLSBUaGUgcXVhdGVybmlvbiByb3RhdGlvbiB0byBzZXQgaW4gcGh5c2ljc1xuICAgKi9cbiAgc2V0Um90YXRpb25Ub1BoeXNpY3MocXVhdDogSVF1YXRlcm5pb24pIHtcbiAgICBjb25zdCBwaHlzaWNzQ29tcG9uZW50ID0gdGhpcy5lbnRpdHkudHJ5VG9HZXRQaHlzaWNzKCk7XG4gICAgaWYgKHBoeXNpY3NDb21wb25lbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHBoeXNpY3NDb21wb25lbnQuc3RyYXRlZ3kgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb25zdCBzdHJhdGVneSA9IHBoeXNpY3NDb21wb25lbnQuc3RyYXRlZ3k7XG4gICAgICAgIGlmIChzdHJhdGVneS5zZXRSb3RhdGlvbiAhPSBudWxsKSB7XG4gICAgICAgICAgc3RyYXRlZ3kuc2V0Um90YXRpb24ocXVhdCk7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RyYXRlZ3kuc2V0RXVsZXJBbmdsZSAhPSBudWxsKSB7XG4gICAgICAgICAgc3RyYXRlZ3kuc2V0RXVsZXJBbmdsZShxdWF0LnRvRXVsZXJBbmdsZXNUbyhTY2VuZUdyYXBoQ29tcG9uZW50Ll9fdG1wX2V1bGVyKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fX3N5bmNQaHlzaWNzVHJhbnNmb3Jtc0FmdGVyUm90YXRpb24oKTtcbiAgfVxuXG4gIHByaXZhdGUgX19zeW5jUGh5c2ljc1RyYW5zZm9ybXNBZnRlclJvdGF0aW9uKCkge1xuICAgIGNvbnN0IHN0cmF0ZWd5ID0gdGhpcy5lbnRpdHkudHJ5VG9HZXRQaHlzaWNzKCk/LnN0cmF0ZWd5O1xuICAgIGlmIChzdHJhdGVneT8uc2V0U2NhbGUgIT0gbnVsbCkge1xuICAgICAgLy8gVHJhbnNmb3JtIHNldHRlcnMgdXBkYXRlIHRoZWlyIHBvc2UgYmVmb3JlIHRoaXMgY2FsbCwgd2hpbGUgdGhlIGNhY2hlZFxuICAgICAgLy8gd29ybGQgbWF0cml4IGlzIGRpcnRpZWQgbGF0ZXIgaW4gdGhlIGxvZ2ljIHN0YWdlLiBNYXRlcmlhbGl6ZSB0aGUgb2xkXG4gICAgICAvLyBjYWNoZSBmaXJzdCBzbyBkaXJ0eSBwcm9wYWdhdGlvbiBpcyBub3Qgc2tpcHBlZCwgdGhlbiByZXNvbHZlIHRoZSBuZXcgc2NhbGUuXG4gICAgICB0aGlzLm1hdHJpeElubmVyO1xuICAgICAgdGhpcy5zZXRXb3JsZE1hdHJpeERpcnR5KCk7XG4gICAgICBzdHJhdGVneS5zZXRTY2FsZSh0aGlzLl9nZXRQaHlzaWNzV29ybGRTY2FsZSh0aGlzLm1hdHJpeElubmVyKSk7XG4gICAgfVxuICAgIHRoaXMuX19zeW5jRGVzY2VuZGFudFBoeXNpY3NUcmFuc2Zvcm1zKHRydWUsIHRydWUsIHRydWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGNhY2hlZCB3b3JsZCByb3RhdGlvbiBpZiBpdCBpcyBkaXJ0eS5cbiAgICogVGhpcyBhdm9pZHMgcmVwZWF0ZWQgcmVjdXJzaXZlIHRyYXZlcnNhbCBhY3Jvc3MgdGhlIGhpZXJhcmNoeS5cbiAgICovXG4gIHByaXZhdGUgX19nZXRXb3JsZFJvdGF0aW9uSW5uZXIoKTogTXV0YWJsZVF1YXRlcm5pb24ge1xuICAgIGNvbnN0IGxvY2FsUm90YXRpb24gPSB0aGlzLmVudGl0eS5nZXRUcmFuc2Zvcm0oKS5sb2NhbFJvdGF0aW9uSW5uZXI7XG5cbiAgICBpZiAodGhpcy5fX3BhcmVudCA9PSBudWxsIHx8IHRoaXMudG9NYWtlV29ybGRNYXRyaXhUaGVTYW1lQXNMb2NhbE1hdHJpeCkge1xuICAgICAgaWYgKCF0aGlzLl9faXNXb3JsZFJvdGF0aW9uVXBUb0RhdGUpIHtcbiAgICAgICAgdGhpcy5fd29ybGRSb3RhdGlvbi5jb3B5Q29tcG9uZW50cyhsb2NhbFJvdGF0aW9uKTtcbiAgICAgICAgdGhpcy5fX2lzV29ybGRSb3RhdGlvblVwVG9EYXRlID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl93b3JsZFJvdGF0aW9uO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5fX2lzV29ybGRSb3RhdGlvblVwVG9EYXRlKSB7XG4gICAgICBRdWF0ZXJuaW9uLm11bHRpcGx5VG8odGhpcy5fX3BhcmVudC5fX2dldFdvcmxkUm90YXRpb25Jbm5lcigpLCBsb2NhbFJvdGF0aW9uLCB0aGlzLl93b3JsZFJvdGF0aW9uKTtcbiAgICAgIHRoaXMuX19pc1dvcmxkUm90YXRpb25VcFRvRGF0ZSA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX3dvcmxkUm90YXRpb247XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgd29ybGQgcm90YXRpb24gYXMgYSBxdWF0ZXJuaW9uLlxuICAgKiBAcmV0dXJucyBUaGUgd29ybGQgcm90YXRpb24gcXVhdGVybmlvblxuICAgKi9cbiAgZ2V0IHJvdGF0aW9uKCk6IFF1YXRlcm5pb24ge1xuICAgIHJldHVybiB0aGlzLnJvdGF0aW9uSW5uZXIuY2xvbmUoKTtcbiAgfVxuXG4gIGdldCByb3RhdGlvbklubmVyKCk6IFF1YXRlcm5pb24ge1xuICAgIGlmICh0aGlzLl9fcGFyZW50ID09IG51bGwgfHwgdGhpcy50b01ha2VXb3JsZE1hdHJpeFRoZVNhbWVBc0xvY2FsTWF0cml4KSB7XG4gICAgICByZXR1cm4gdGhpcy5lbnRpdHkuZ2V0VHJhbnNmb3JtKCkubG9jYWxSb3RhdGlvbklubmVyO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9fZ2V0V29ybGRSb3RhdGlvbklubmVyKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgd29ybGQgcm90YXRpb24gYW5kIHN0b3JlcyBpdCBpbiB0aGUgb3V0cHV0IHF1YXRlcm5pb24uXG4gICAqIEBwYXJhbSBvdXRRdWF0IC0gVGhlIG91dHB1dCBxdWF0ZXJuaW9uIHRvIHN0b3JlIHRoZSByb3RhdGlvblxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHF1YXRlcm5pb24gY29udGFpbmluZyB0aGUgd29ybGQgcm90YXRpb25cbiAgICovXG4gIGdldFJvdGF0aW9uVG8ob3V0UXVhdDogTXV0YWJsZVF1YXRlcm5pb24pOiBNdXRhYmxlUXVhdGVybmlvbiB7XG4gICAgY29uc3Qgd29ybGRSb3RhdGlvbiA9IHRoaXMuX19nZXRXb3JsZFJvdGF0aW9uSW5uZXIoKTtcbiAgICBvdXRRdWF0LnNldENvbXBvbmVudHMod29ybGRSb3RhdGlvbi5fdlswXSwgd29ybGRSb3RhdGlvbi5fdlsxXSwgd29ybGRSb3RhdGlvbi5fdlsyXSwgd29ybGRSb3RhdGlvbi5fdlszXSk7XG4gICAgcmV0dXJuIG91dFF1YXQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgd29ybGQgcm90YXRpb24gaW4gcmVzdCBwb3NlLlxuICAgKiBAcmV0dXJucyBUaGUgd29ybGQgcm90YXRpb24gcXVhdGVybmlvbiBpbiByZXN0IHBvc2VcbiAgICovXG4gIGdldCByb3RhdGlvblJlc3QoKTogUXVhdGVybmlvbiB7XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5wYXJlbnQ7XG4gICAgaWYgKHBhcmVudCAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gUXVhdGVybmlvbi5tdWx0aXBseShwYXJlbnQucm90YXRpb25SZXN0LCB0aGlzLmVudGl0eS5nZXRUcmFuc2Zvcm0oKS5sb2NhbFJvdGF0aW9uUmVzdElubmVyKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZW50aXR5LmdldFRyYW5zZm9ybSgpLmxvY2FsUm90YXRpb25SZXN0SW5uZXI7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgd29ybGQgcm90YXRpb24gaW4gcmVzdCBwb3NlIHdpdGggY29uZGl0aW9uYWwgdGVybWluYXRpb24uXG4gICAqIEBwYXJhbSBlbmRGbiAtIEZ1bmN0aW9uIHRvIGRldGVybWluZSBpZiByZWN1cnNpb24gc2hvdWxkIHN0b3AgYXQgdGhpcyBub2RlXG4gICAqIEByZXR1cm5zIFRoZSB3b3JsZCByb3RhdGlvbiBxdWF0ZXJuaW9uIGluIHJlc3QgcG9zZVxuICAgKi9cbiAgZ2V0Um90YXRpb25SZXN0KGVuZEZuOiAoc2c6IFNjZW5lR3JhcGhDb21wb25lbnQpID0+IGJvb2xlYW4pOiBRdWF0ZXJuaW9uIHtcbiAgICBjb25zdCBwYXJlbnQgPSB0aGlzLnBhcmVudDtcbiAgICBpZiAocGFyZW50ICE9IG51bGwgJiYgIWVuZEZuKHRoaXMpKSB7XG4gICAgICByZXR1cm4gUXVhdGVybmlvbi5tdWx0aXBseShwYXJlbnQuZ2V0Um90YXRpb25SZXN0KGVuZEZuKSwgdGhpcy5lbnRpdHkuZ2V0VHJhbnNmb3JtKCkubG9jYWxSb3RhdGlvblJlc3RJbm5lcik7XG4gICAgfVxuICAgIHJldHVybiBRdWF0ZXJuaW9uLmlkZW50aXR5KCk7XG5cbiAgICAvLyByZXR1cm4gdGhpcy5lbnRpdHkuZ2V0VHJhbnNmb3JtKCkubG9jYWxSb3RhdGlvblJlc3RJbm5lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB3b3JsZCBzY2FsZSBhbmQgdXBkYXRlcyBwaHlzaWNzIHNpbXVsYXRpb24gaWYgcHJlc2VudC5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSBzY2FsZSB2ZWN0b3IgdG8gc2V0XG4gICAqL1xuICBzZXQgc2NhbGUodmVjOiBJVmVjdG9yMykge1xuICAgIGlmIChJcy5ub3QuZXhpc3QodGhpcy5fX3BhcmVudCkpIHtcbiAgICAgIHRoaXMuZW50aXR5LmdldFRyYW5zZm9ybSgpLmxvY2FsU2NhbGVXaXRob3V0UGh5c2ljcyA9IHZlYztcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgbWF0ID0gdGhpcy5fX3BhcmVudC5lbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLm1hdHJpeDtcbiAgICAgIG1hdC5fdlsxMl0gPSAwO1xuICAgICAgbWF0Ll92WzEzXSA9IDA7XG4gICAgICBtYXQuX3ZbMTRdID0gMDtcbiAgICAgIGNvbnN0IGludk1hdCA9IE11dGFibGVNYXRyaXg0NC5pbnZlcnQobWF0KTtcbiAgICAgIHRoaXMuZW50aXR5LmdldFRyYW5zZm9ybSgpLmxvY2FsU2NhbGVXaXRob3V0UGh5c2ljcyA9IGludk1hdC5tdWx0aXBseVZlY3RvcjModmVjKTtcbiAgICB9XG4gICAgdGhpcy5zZXRTY2FsZVRvUGh5c2ljcyh2ZWMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIHBoeXNpY3Mgc2ltdWxhdGlvbiB3aXRoIHRoZSBuZXcgc2NhbGUuXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgc2NhbGUgdmVjdG9yIHRvIHNldCBpbiBwaHlzaWNzXG4gICAqL1xuICBzZXRTY2FsZVRvUGh5c2ljcyh2ZWM6IElWZWN0b3IzKSB7XG4gICAgY29uc3QgcGh5c2ljc0NvbXBvbmVudCA9IHRoaXMuZW50aXR5LnRyeVRvR2V0UGh5c2ljcygpO1xuICAgIGlmIChwaHlzaWNzQ29tcG9uZW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmIChwaHlzaWNzQ29tcG9uZW50LnN0cmF0ZWd5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcGh5c2ljc0NvbXBvbmVudC5zdHJhdGVneS5zZXRTY2FsZT8uKHZlYyk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX19zeW5jRGVzY2VuZGFudFBoeXNpY3NUcmFuc2Zvcm1zKHRydWUsIHRydWUsIHRydWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHdvcmxkIHNjYWxlIG9mIHRoaXMgbm9kZS5cbiAgICogQHJldHVybnMgVGhlIHdvcmxkIHNjYWxlIHZlY3RvclxuICAgKi9cbiAgZ2V0IHNjYWxlKCk6IE11dGFibGVWZWN0b3IzIHtcbiAgICByZXR1cm4gdGhpcy5tYXRyaXhJbm5lci5nZXRTY2FsZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc29sdmVzIHdvcmxkLXNjYWxlIG1hZ25pdHVkZXMgd2l0aCBzaWducyByZWxhdGl2ZSB0byB0aGUgZW50aXR5J3MgcHJvcGVyIHdvcmxkIHJvdGF0aW9uLlxuICAgKiBQaHlzaWNzIGJvZGllcyB1c2UgdGhhdCByb3RhdGlvbiBzZXBhcmF0ZWx5LCBzbyByZWZsZWN0ZWQgbG9jYWwgb2Zmc2V0cyBuZWVkIHRoZXNlIHNpZ25zLlxuICAgKlxuICAgKiBUaGUgcmV0dXJuZWQgdmVjdG9yIGlzIGEgc2hhcmVkIHJldXNhYmxlIGluc3RhbmNlLCBzbyBjYWxsZXJzIG11c3QgY29weSBpdFxuICAgKiB3aGVuIHRoZXkgbmVlZCB0byBrZWVwIHRoZSB2YWx1ZXMgYXJvdW5kLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9nZXRQaHlzaWNzV29ybGRTY2FsZShtYXRyaXg6IElNYXRyaXg0NCA9IHRoaXMubWF0cml4SW5uZXIpOiBJVmVjdG9yMyB7XG4gICAgY29uc3Qgcm90YXRpb24gPSB0aGlzLmdldFF1YXRlcm5pb25SZWN1cnNpdmVseVRvKFNjZW5lR3JhcGhDb21wb25lbnQuX190bXBfcXVhdF8yKTtcbiAgICBjb25zdCBheGlzWCA9IHJvdGF0aW9uLnRyYW5zZm9ybVZlY3RvcjNUbyhTY2VuZUdyYXBoQ29tcG9uZW50Ll9fYXhpc1gsIFNjZW5lR3JhcGhDb21wb25lbnQuX190bXBfdmVjM18wKTtcbiAgICBjb25zdCBheGlzWSA9IHJvdGF0aW9uLnRyYW5zZm9ybVZlY3RvcjNUbyhTY2VuZUdyYXBoQ29tcG9uZW50Ll9fYXhpc1ksIFNjZW5lR3JhcGhDb21wb25lbnQuX190bXBfdmVjM18xKTtcbiAgICBjb25zdCBheGlzWiA9IHJvdGF0aW9uLnRyYW5zZm9ybVZlY3RvcjNUbyhTY2VuZUdyYXBoQ29tcG9uZW50Ll9fYXhpc1osIFNjZW5lR3JhcGhDb21wb25lbnQuX190bXBfdmVjM18yKTtcbiAgICBjb25zdCBzY2FsZSA9IG1hdHJpeC5nZXRTY2FsZVRvKFNjZW5lR3JhcGhDb21wb25lbnQuX190bXBfbWF0cml4U2NhbGUpO1xuICAgIGNvbnN0IHByb2plY3Rpb25YID0gbWF0cml4Lm0wMCAqIGF4aXNYLnggKyBtYXRyaXgubTEwICogYXhpc1gueSArIG1hdHJpeC5tMjAgKiBheGlzWC56O1xuICAgIGNvbnN0IHByb2plY3Rpb25ZID0gbWF0cml4Lm0wMSAqIGF4aXNZLnggKyBtYXRyaXgubTExICogYXhpc1kueSArIG1hdHJpeC5tMjEgKiBheGlzWS56O1xuICAgIGNvbnN0IHByb2plY3Rpb25aID0gbWF0cml4Lm0wMiAqIGF4aXNaLnggKyBtYXRyaXgubTEyICogYXhpc1oueSArIG1hdHJpeC5tMjIgKiBheGlzWi56O1xuICAgIHJldHVybiBTY2VuZUdyYXBoQ29tcG9uZW50Ll9fdG1wX3BoeXNpY3NXb3JsZFNjYWxlLnNldENvbXBvbmVudHMoXG4gICAgICBwcm9qZWN0aW9uWCA8IDAgPyAtc2NhbGUueCA6IHNjYWxlLngsXG4gICAgICBwcm9qZWN0aW9uWSA8IDAgPyAtc2NhbGUueSA6IHNjYWxlLnksXG4gICAgICBwcm9qZWN0aW9uWiA8IDAgPyAtc2NhbGUueiA6IHNjYWxlLnpcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBzaGFsbG93IGNvcHkgb2YgYSBjaGlsZCBzY2VuZSBncmFwaCBjb21wb25lbnQuXG4gICAqIEBwYXJhbSBjaGlsZCAtIFRoZSBjaGlsZCBjb21wb25lbnQgdG8gY29weVxuICAgKiBAcmV0dXJucyBBIG5ldyBzY2VuZSBncmFwaCBlbnRpdHkgd2l0aCBjb3BpZWQgY29tcG9uZW50XG4gICAqL1xuICBwcml2YXRlIF9fY29weUNoaWxkKGNoaWxkOiBTY2VuZUdyYXBoQ29tcG9uZW50KTogSVNjZW5lR3JhcGhFbnRpdHkge1xuICAgIGNvbnN0IG5ld0NoaWxkID0gY2hpbGQuZW50aXR5LmVuZ2luZS5lbnRpdHlSZXBvc2l0b3J5Ll9zaGFsbG93Q29weUVudGl0eUlubmVyKGNoaWxkLmVudGl0eSkgYXMgSVNjZW5lR3JhcGhFbnRpdHk7XG4gICAgbmV3Q2hpbGQuZ2V0U2NlbmVHcmFwaCgpLl9fcGFyZW50ID0gdGhpcztcbiAgICBTY2VuZUdyYXBoQ29tcG9uZW50Ll9fYnVtcEhpZXJhcmNoeVZlcnNpb24oKTtcbiAgICByZXR1cm4gbmV3Q2hpbGQ7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgYSBzaGFsbG93IGNvcHkgZnJvbSBhbm90aGVyIFNjZW5lR3JhcGhDb21wb25lbnQuXG4gICAqIEBwYXJhbSBjb21wb25lbnRfIC0gVGhlIHNvdXJjZSBjb21wb25lbnQgdG8gY29weSBmcm9tXG4gICAqL1xuICBfc2hhbGxvd0NvcHlGcm9tKGNvbXBvbmVudF86IENvbXBvbmVudCk6IHZvaWQge1xuICAgIGNvbnN0IGNvbXBvbmVudCA9IGNvbXBvbmVudF8gYXMgU2NlbmVHcmFwaENvbXBvbmVudDtcblxuICAgIHRoaXMuX19wYXJlbnQgPSBjb21wb25lbnQuX19wYXJlbnQ7XG4gICAgdGhpcy5fX2NoaWxkcmVuID0gW107XG4gICAgU2NlbmVHcmFwaENvbXBvbmVudC5fX2J1bXBIaWVyYXJjaHlWZXJzaW9uKCk7XG4gICAgdGhpcy5fX3BoeXNpY3NDb21wb25lbnRDb3VudEluU3VidHJlZSA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21wb25lbnQuX19jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgY29weUNoaWxkID0gdGhpcy5fX2NvcHlDaGlsZChjb21wb25lbnQuX19jaGlsZHJlbltpXSkuZ2V0U2NlbmVHcmFwaCgpO1xuICAgICAgdGhpcy5fX2NoaWxkcmVuLnB1c2goY29weUNoaWxkKTtcbiAgICAgIHRoaXMuX19hZGp1c3RQaHlzaWNzQ29tcG9uZW50Q291bnRJblN1YnRyZWUoY29weUNoaWxkLl9fcGh5c2ljc0NvbXBvbmVudENvdW50SW5TdWJ0cmVlKTtcbiAgICB9XG5cbiAgICB0aGlzLl9fZ2l6bW9DaGlsZHJlbiA9IGNvbXBvbmVudC5fX2dpem1vQ2hpbGRyZW4uY29uY2F0KCk7XG4gICAgdGhpcy5fX2lzR2l6bW9DaGlsZCA9IGNvbXBvbmVudC5fX2lzR2l6bW9DaGlsZDtcbiAgICB0aGlzLl93b3JsZE1hdHJpeC5jb3B5Q29tcG9uZW50cyhjb21wb25lbnQuX3dvcmxkTWF0cml4KTtcbiAgICB0aGlzLl93b3JsZE1hdHJpeFJlc3QuY29weUNvbXBvbmVudHMoY29tcG9uZW50Ll93b3JsZE1hdHJpeFJlc3QpO1xuICAgIHRoaXMuX25vcm1hbE1hdHJpeC5jb3B5Q29tcG9uZW50cyhjb21wb25lbnQuX25vcm1hbE1hdHJpeCk7XG4gICAgdGhpcy5fX2lzV29ybGRNYXRyaXhVcFRvRGF0ZSA9IGZhbHNlO1xuICAgIHRoaXMuX19pc1dvcmxkTWF0cml4UmVzdFVwVG9EYXRlID0gZmFsc2U7XG4gICAgdGhpcy5fX2lzTm9ybWFsTWF0cml4VXBUb0RhdGUgPSBmYWxzZTtcbiAgICB0aGlzLl9faXNXb3JsZFJvdGF0aW9uVXBUb0RhdGUgPSBmYWxzZTtcbiAgICB0aGlzLl9fd29ybGRNYXRyaXhWZXJzaW9uKys7XG4gICAgdGhpcy5fX3dvcmxkTWVyZ2VkQUFCQldpdGhTa2VsZXRhbCA9IGNvbXBvbmVudC5fX3dvcmxkTWVyZ2VkQUFCQldpdGhTa2VsZXRhbC5jbG9uZSgpO1xuICAgIHRoaXMuX19pc1dvcmxkQUFCQkRpcnR5ID0gdHJ1ZTtcbiAgICB0aGlzLl9faXNXb3JsZEFBQkJEaXJ0eVdpdGhTa2VsZXRhbCA9IHRydWU7XG4gICAgdGhpcy5faXNWaXNpYmxlLmNvcHlDb21wb25lbnRzKGNvbXBvbmVudC5faXNWaXNpYmxlKTtcbiAgICB0aGlzLl9pc0JpbGxib2FyZC5jb3B5Q29tcG9uZW50cyhjb21wb25lbnQuX2lzQmlsbGJvYXJkKTtcbiAgICAvLyB0aGlzLl9fYWFiYkdpem1vID0gY29tcG9uZW50Ll9fYWFiYkdpem1vO1xuICAgIC8vIHRoaXMuX19sb2NhdG9yR2l6bW8gPSBjb21wb25lbnQuX19sb2NhdG9yR2l6bW87XG4gICAgLy8gdGhpcy5fX3RyYW5zbGF0aW9uR2l6bW8gPSBjb21wb25lbnQuX190cmFuc2xhdGlvbkdpem1vO1xuICAgIC8vIHRoaXMuX19zY2FsZUdpem1vID0gY29tcG9uZW50Ll9fc2NhbGVHaXptbztcbiAgICB0aGlzLl9fdHJhbnNmb3JtR2l6bW9TcGFjZSA9IGNvbXBvbmVudC5fX3RyYW5zZm9ybUdpem1vU3BhY2U7XG4gICAgdGhpcy5fX2xhdGVzdFByaW1pdGl2ZVBvc2l0aW9uQWNjZXNzb3JWZXJzaW9uID0gY29tcG9uZW50Ll9fbGF0ZXN0UHJpbWl0aXZlUG9zaXRpb25BY2Nlc3NvclZlcnNpb247XG4gICAgdGhpcy50b01ha2VXb3JsZE1hdHJpeFRoZVNhbWVBc0xvY2FsTWF0cml4ID0gY29tcG9uZW50LnRvTWFrZVdvcmxkTWF0cml4VGhlU2FtZUFzTG9jYWxNYXRyaXg7XG4gICAgdGhpcy5pc1Jvb3RKb2ludCA9IGNvbXBvbmVudC5pc1Jvb3RKb2ludDtcbiAgICB0aGlzLmpvaW50SW5kZXggPSBjb21wb25lbnQuam9pbnRJbmRleDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBlbnRpdHkgd2hpY2ggaGFzIHRoaXMgY29tcG9uZW50LlxuICAgKiBAcmV0dXJucyBUaGUgZW50aXR5IHdoaWNoIGhhcyB0aGlzIGNvbXBvbmVudFxuICAgKi9cbiAgZ2V0IGVudGl0eSgpOiBJU2NlbmVHcmFwaEVudGl0eSB7XG4gICAgcmV0dXJuIHRoaXMuX19lbmdpbmUuZW50aXR5UmVwb3NpdG9yeS5nZXRFbnRpdHkodGhpcy5fX2VudGl0eVVpZCkgYXMgdW5rbm93biBhcyBJU2NlbmVHcmFwaEVudGl0eTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjb29yZGluYXRlIHNwYWNlIGZvciB0cmFuc2Zvcm1hdGlvbiBnaXptb3MuXG4gICAqIEBwYXJhbSBzcGFjZSAtIFRoZSBjb29yZGluYXRlIHNwYWNlICgnbG9jYWwnIG9yICd3b3JsZCcpXG4gICAqL1xuICBzZXRUcmFuc2Zvcm1HaXptb1NwYWNlKHNwYWNlOiAnbG9jYWwnIHwgJ3dvcmxkJykge1xuICAgIHRoaXMuX190cmFuc2Zvcm1HaXptb1NwYWNlID0gc3BhY2U7XG4gICAgdGhpcy5fX3RyYW5zbGF0aW9uR2l6bW8/LnNldFNwYWNlKHNwYWNlKTtcbiAgICB0aGlzLl9fcm90YXRpb25HaXptbz8uc2V0U3BhY2Uoc3BhY2UpO1xuICAgIHRoaXMuX19zY2FsZUdpem1vPy5zZXRTcGFjZShzcGFjZSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhpcyBjb21wb25lbnQgYW5kIGNsZWFucyB1cCByZXNvdXJjZXMuXG4gICAqL1xuICBfZGVzdHJveSgpIHtcbiAgICBzdXBlci5fZGVzdHJveSgpO1xuICAgIFNjZW5lR3JhcGhDb21wb25lbnQuX19idW1wSGllcmFyY2h5VmVyc2lvbigpO1xuICAgIFNjZW5lR3JhcGhDb21wb25lbnQuX190cmFuc2Zvcm1HaXptb093bmVycy5nZXQodGhpcy5fX2VuZ2luZS5vYmplY3RVSUQpPy5kZWxldGUodGhpcyk7XG4gICAgdGhpcy5fX2FhYmJHaXptbz8uX2Rlc3Ryb3koKTtcbiAgICB0aGlzLl9fbG9jYXRvckdpem1vPy5fZGVzdHJveSgpO1xuICAgIHRoaXMuX190cmFuc2xhdGlvbkdpem1vPy5fZGVzdHJveSgpO1xuICAgIHRoaXMuX19yb3RhdGlvbkdpem1vPy5fZGVzdHJveSgpO1xuICAgIHRoaXMuX19zY2FsZUdpem1vPy5fZGVzdHJveSgpO1xuICAgIHRoaXMuX19qb2ludEdpem1vPy5fZGVzdHJveSgpO1xuICAgIC8vIHRoaXMuX19lbnRpdHlSZXBvc2l0b3J5LnJlbW92ZUVudGl0eSh0aGlzLl9fZW50aXR5VWlkKTtcbiAgICB0aGlzLnBhcmVudD8ucmVtb3ZlQ2hpbGQodGhpcyk7XG4gICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKGNoaWxkID0+IGNoaWxkLnBhcmVudD8ucmVtb3ZlQ2hpbGQoY2hpbGQpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoaXMgY29tcG9uZW50IHRvIGFuIGVudGl0eSBhbmQgZXh0ZW5kcyBpdCB3aXRoIFNjZW5lR3JhcGggZnVuY3Rpb25hbGl0eS5cbiAgICogQHBhcmFtIGJhc2UgLSBUaGUgdGFyZ2V0IGVudGl0eSB0byBleHRlbmRcbiAgICogQHBhcmFtIF9jb21wb25lbnRDbGFzcyAtIFRoZSBjb21wb25lbnQgY2xhc3MgYmVpbmcgYWRkZWQgKHVudXNlZClcbiAgICogQHJldHVybnMgVGhlIGV4dGVuZGVkIGVudGl0eSB3aXRoIFNjZW5lR3JhcGggbWV0aG9kc1xuICAgKi9cbiAgYWRkVGhpc0NvbXBvbmVudFRvRW50aXR5PEVudGl0eUJhc2UgZXh0ZW5kcyBJRW50aXR5LCBTb21lQ29tcG9uZW50Q2xhc3MgZXh0ZW5kcyB0eXBlb2YgQ29tcG9uZW50PihcbiAgICBiYXNlOiBFbnRpdHlCYXNlLFxuICAgIF9jb21wb25lbnRDbGFzczogU29tZUNvbXBvbmVudENsYXNzXG4gICkge1xuICAgIGNsYXNzIFNjZW5lR3JhcGhFbnRpdHkgZXh0ZW5kcyAoYmFzZS5jb25zdHJ1Y3RvciBhcyBhbnkpIHtcbiAgICAgIHByaXZhdGUgX19zY2VuZUdyYXBoQ29tcG9uZW50PzogU2NlbmVHcmFwaENvbXBvbmVudDtcblxuICAgICAgLyoqXG4gICAgICAgKiBHZXRzIHRoZSBzY2VuZSBncmFwaCBjb21wb25lbnQgZm9yIHRoaXMgZW50aXR5LlxuICAgICAgICogQHJldHVybnMgVGhlIHNjZW5lIGdyYXBoIGNvbXBvbmVudCBpbnN0YW5jZVxuICAgICAgICovXG4gICAgICBnZXRTY2VuZUdyYXBoKCk6IFNjZW5lR3JhcGhDb21wb25lbnQge1xuICAgICAgICBpZiAodGhpcy5fX3NjZW5lR3JhcGhDb21wb25lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRoaXMuX19zY2VuZUdyYXBoQ29tcG9uZW50ID0gdGhpcy5nZXRDb21wb25lbnRCeUNvbXBvbmVudFRJRChcbiAgICAgICAgICAgIFdlbGxLbm93bkNvbXBvbmVudFRJRHMuU2NlbmVHcmFwaENvbXBvbmVudFRJRFxuICAgICAgICAgICkgYXMgU2NlbmVHcmFwaENvbXBvbmVudDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fX3NjZW5lR3JhcGhDb21wb25lbnQ7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogR2V0cyB0aGUgcGFyZW50IHNjZW5lIGdyYXBoIGNvbXBvbmVudCBvZiB0aGlzIGVudGl0eS5cbiAgICAgICAqIEByZXR1cm5zIFRoZSBwYXJlbnQgc2NlbmUgZ3JhcGggY29tcG9uZW50LCBvciB1bmRlZmluZWQgaWYgdGhpcyBpcyBhIHJvb3QgZW50aXR5XG4gICAgICAgKi9cbiAgICAgIGdldCBwYXJlbnQoKTogU2NlbmVHcmFwaENvbXBvbmVudCB8IHVuZGVmaW5lZCB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFNjZW5lR3JhcGgoKS5wYXJlbnQ7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogR2V0cyB0aGUgd29ybGQgdHJhbnNmb3JtYXRpb24gbWF0cml4IG9mIHRoaXMgZW50aXR5LlxuICAgICAgICogQHJldHVybnMgVGhlIHdvcmxkIHRyYW5zZm9ybWF0aW9uIG1hdHJpeFxuICAgICAgICovXG4gICAgICBnZXQgbWF0cml4KCk6IElNYXRyaXg0NCB7XG4gICAgICAgIGNvbnN0IHNjZW5lR3JhcGggPSB0aGlzLmdldFNjZW5lR3JhcGgoKTtcbiAgICAgICAgcmV0dXJuIHNjZW5lR3JhcGgubWF0cml4O1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIEdldHMgdGhlIGludGVybmFsIG11dGFibGUgd29ybGQgdHJhbnNmb3JtYXRpb24gbWF0cml4IG9mIHRoaXMgZW50aXR5LlxuICAgICAgICogQHJldHVybnMgVGhlIGludGVybmFsIHdvcmxkIHRyYW5zZm9ybWF0aW9uIG1hdHJpeFxuICAgICAgICovXG4gICAgICBnZXQgbWF0cml4SW5uZXIoKTogSU1hdHJpeDQ0IHtcbiAgICAgICAgY29uc3Qgc2NlbmVHcmFwaCA9IHRoaXMuZ2V0U2NlbmVHcmFwaCgpO1xuICAgICAgICByZXR1cm4gc2NlbmVHcmFwaC5tYXRyaXhJbm5lcjtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBHZXRzIHRoZSB3b3JsZCBwb3NpdGlvbiBvZiB0aGlzIGVudGl0eS5cbiAgICAgICAqIEByZXR1cm5zIFRoZSB3b3JsZCBwb3NpdGlvbiB2ZWN0b3JcbiAgICAgICAqL1xuICAgICAgZ2V0IHBvc2l0aW9uKCk6IE11dGFibGVWZWN0b3IzIHtcbiAgICAgICAgY29uc3Qgc2NlbmVHcmFwaCA9IHRoaXMuZ2V0U2NlbmVHcmFwaCgpO1xuICAgICAgICByZXR1cm4gc2NlbmVHcmFwaC5wb3NpdGlvbjtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBTZXRzIHRoZSB3b3JsZCBwb3NpdGlvbiBvZiB0aGlzIGVudGl0eS5cbiAgICAgICAqIEBwYXJhbSB2ZWMgLSBUaGUgbmV3IHdvcmxkIHBvc2l0aW9uIHZlY3RvclxuICAgICAgICovXG4gICAgICBzZXQgcG9zaXRpb24odmVjOiBJVmVjdG9yMykge1xuICAgICAgICBjb25zdCBzY2VuZUdyYXBoID0gdGhpcy5nZXRTY2VuZUdyYXBoKCk7XG4gICAgICAgIHNjZW5lR3JhcGgucG9zaXRpb24gPSB2ZWM7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogR2V0cyB0aGUgcmVzdCBwb3NlIHdvcmxkIHBvc2l0aW9uIG9mIHRoaXMgZW50aXR5LlxuICAgICAgICogQHJldHVybnMgVGhlIHJlc3QgcG9zZSB3b3JsZCBwb3NpdGlvbiB2ZWN0b3JcbiAgICAgICAqL1xuICAgICAgZ2V0IHBvc2l0aW9uUmVzdCgpOiBNdXRhYmxlVmVjdG9yMyB7XG4gICAgICAgIGNvbnN0IHNjZW5lR3JhcGggPSB0aGlzLmdldFNjZW5lR3JhcGgoKTtcbiAgICAgICAgcmV0dXJuIHNjZW5lR3JhcGgucG9zaXRpb25SZXN0O1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIEdldHMgdGhlIHdvcmxkIHNjYWxlIG9mIHRoaXMgZW50aXR5LlxuICAgICAgICogQHJldHVybnMgVGhlIHdvcmxkIHNjYWxlIHZlY3RvclxuICAgICAgICovXG4gICAgICBnZXQgc2NhbGUoKTogTXV0YWJsZVZlY3RvcjMge1xuICAgICAgICBjb25zdCBzY2VuZUdyYXBoID0gdGhpcy5nZXRTY2VuZUdyYXBoKCk7XG4gICAgICAgIHJldHVybiBzY2VuZUdyYXBoLnNjYWxlO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIFNldHMgdGhlIHdvcmxkIHNjYWxlIG9mIHRoaXMgZW50aXR5LlxuICAgICAgICogQHBhcmFtIHZlYyAtIFRoZSBuZXcgd29ybGQgc2NhbGUgdmVjdG9yXG4gICAgICAgKi9cbiAgICAgIHNldCBzY2FsZSh2ZWM6IElWZWN0b3IzKSB7XG4gICAgICAgIGNvbnN0IHNjZW5lR3JhcGggPSB0aGlzLmdldFNjZW5lR3JhcGgoKTtcbiAgICAgICAgc2NlbmVHcmFwaC5zY2FsZSA9IHZlYztcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBHZXRzIHRoZSB3b3JsZCBldWxlciBhbmdsZXMgb2YgdGhpcyBlbnRpdHkuXG4gICAgICAgKiBAcmV0dXJucyBUaGUgd29ybGQgZXVsZXIgYW5nbGVzIHZlY3RvclxuICAgICAgICovXG4gICAgICBnZXQgZXVsZXJBbmdsZXMoKTogVmVjdG9yMyB7XG4gICAgICAgIGNvbnN0IHNjZW5lR3JhcGggPSB0aGlzLmdldFNjZW5lR3JhcGgoKTtcbiAgICAgICAgcmV0dXJuIHNjZW5lR3JhcGguZXVsZXJBbmdsZXM7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogU2V0cyB0aGUgd29ybGQgZXVsZXIgYW5nbGVzIG9mIHRoaXMgZW50aXR5LlxuICAgICAgICogQHBhcmFtIHZlYyAtIFRoZSBuZXcgd29ybGQgZXVsZXIgYW5nbGVzIHZlY3RvclxuICAgICAgICovXG4gICAgICBzZXQgZXVsZXJBbmdsZXModmVjOiBJVmVjdG9yMykge1xuICAgICAgICBjb25zdCBzY2VuZUdyYXBoID0gdGhpcy5nZXRTY2VuZUdyYXBoKCk7XG4gICAgICAgIHNjZW5lR3JhcGguZXVsZXJBbmdsZXMgPSB2ZWM7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogR2V0cyB0aGUgd29ybGQgcm90YXRpb24gcXVhdGVybmlvbiBvZiB0aGlzIGVudGl0eS5cbiAgICAgICAqIEByZXR1cm5zIFRoZSB3b3JsZCByb3RhdGlvbiBxdWF0ZXJuaW9uXG4gICAgICAgKi9cbiAgICAgIGdldCByb3RhdGlvbigpOiBRdWF0ZXJuaW9uIHtcbiAgICAgICAgY29uc3Qgc2NlbmVHcmFwaCA9IHRoaXMuZ2V0U2NlbmVHcmFwaCgpO1xuICAgICAgICByZXR1cm4gc2NlbmVHcmFwaC5yb3RhdGlvbjtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBTZXRzIHRoZSB3b3JsZCByb3RhdGlvbiBxdWF0ZXJuaW9uIG9mIHRoaXMgZW50aXR5LlxuICAgICAgICogQHBhcmFtIHF1YXQgLSBUaGUgbmV3IHdvcmxkIHJvdGF0aW9uIHF1YXRlcm5pb25cbiAgICAgICAqL1xuICAgICAgc2V0IHJvdGF0aW9uKHF1YXQ6IElRdWF0ZXJuaW9uKSB7XG4gICAgICAgIGNvbnN0IHNjZW5lR3JhcGggPSB0aGlzLmdldFNjZW5lR3JhcGgoKTtcbiAgICAgICAgc2NlbmVHcmFwaC5yb3RhdGlvbiA9IHF1YXQ7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogR2V0cyB0aGUgcmVzdCBwb3NlIHdvcmxkIHJvdGF0aW9uIHF1YXRlcm5pb24gb2YgdGhpcyBlbnRpdHkuXG4gICAgICAgKiBAcmV0dXJucyBUaGUgcmVzdCBwb3NlIHdvcmxkIHJvdGF0aW9uIHF1YXRlcm5pb25cbiAgICAgICAqL1xuICAgICAgZ2V0IHJvdGF0aW9uUmVzdCgpOiBRdWF0ZXJuaW9uIHtcbiAgICAgICAgY29uc3Qgc2NlbmVHcmFwaCA9IHRoaXMuZ2V0U2NlbmVHcmFwaCgpO1xuICAgICAgICByZXR1cm4gc2NlbmVHcmFwaC5yb3RhdGlvblJlc3Q7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogQWRkcyBhIGNoaWxkIHNjZW5lIGdyYXBoIGNvbXBvbmVudCB0byB0aGlzIGVudGl0eS5cbiAgICAgICAqIEBwYXJhbSBzZyAtIFRoZSBzY2VuZSBncmFwaCBjb21wb25lbnQgdG8gYWRkIGFzIGEgY2hpbGRcbiAgICAgICAqIEBwYXJhbSBrZWVwUG9zZUluV29ybGRTcGFjZSAtIFdoZXRoZXIgdG8ga2VlcCB0aGUgY2hpbGQncyB3b3JsZCBwb3NlXG4gICAgICAgKi9cbiAgICAgIGFkZENoaWxkKHNnOiBTY2VuZUdyYXBoQ29tcG9uZW50LCBrZWVwUG9zZUluV29ybGRTcGFjZSA9IGZhbHNlKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHNjZW5lR3JhcGggPSB0aGlzLmdldFNjZW5lR3JhcGgoKTtcbiAgICAgICAgc2NlbmVHcmFwaC5hZGRDaGlsZChzZywga2VlcFBvc2VJbldvcmxkU3BhY2UpO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIEdldHMgYWxsIGNoaWxkIHNjZW5lIGdyYXBoIGNvbXBvbmVudHMgb2YgdGhpcyBlbnRpdHkuXG4gICAgICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiBjaGlsZCBzY2VuZSBncmFwaCBjb21wb25lbnRzXG4gICAgICAgKi9cbiAgICAgIGdldCBjaGlsZHJlbigpOiBTY2VuZUdyYXBoQ29tcG9uZW50W10ge1xuICAgICAgICBjb25zdCBzY2VuZUdyYXBoID0gdGhpcy5nZXRTY2VuZUdyYXBoKCk7XG4gICAgICAgIHJldHVybiBzY2VuZUdyYXBoLmNoaWxkcmVuO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIFJlbW92ZXMgYSBjaGlsZCBzY2VuZSBncmFwaCBjb21wb25lbnQgZnJvbSB0aGlzIGVudGl0eS5cbiAgICAgICAqIEBwYXJhbSBzZyAtIFRoZSBzY2VuZSBncmFwaCBjb21wb25lbnQgdG8gcmVtb3ZlIGZyb20gY2hpbGRyZW5cbiAgICAgICAqL1xuICAgICAgcmVtb3ZlQ2hpbGQoc2c6IFNjZW5lR3JhcGhDb21wb25lbnQpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgc2NlbmVHcmFwaCA9IHRoaXMuZ2V0U2NlbmVHcmFwaCgpO1xuICAgICAgICBzY2VuZUdyYXBoLnJlbW92ZUNoaWxkKHNnKTtcbiAgICAgIH1cbiAgICB9XG4gICAgYXBwbHlNaXhpbnMoYmFzZSwgU2NlbmVHcmFwaEVudGl0eSk7XG4gICAgcmV0dXJuIGJhc2UgYXMgdW5rbm93biBhcyBDb21wb25lbnRUb0NvbXBvbmVudE1ldGhvZHM8U29tZUNvbXBvbmVudENsYXNzPiAmIEVudGl0eUJhc2U7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW5zIHVwIHN0YXRpYyByZXNvdXJjZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBzcGVjaWZpZWQgZW5naW5lLlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZSB0byBjbGVhbiB1cCByZXNvdXJjZXMgZm9yXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIF9jbGVhbnVwRm9yRW5naW5lKGVuZ2luZTogRW5naW5lKTogdm9pZCB7XG4gICAgU2NlbmVHcmFwaENvbXBvbmVudC5fX3VwZGF0ZUNvdW50TWFwLmRlbGV0ZShlbmdpbmUpO1xuICAgIFNjZW5lR3JhcGhDb21wb25lbnQuX190cmFuc2Zvcm1HaXptb093bmVycy5kZWxldGUoZW5naW5lLm9iamVjdFVJRCk7XG4gICAgU2NlbmVHcmFwaENvbXBvbmVudC5fX2xhc3RDYW1lcmFTdGF0ZU1hcC5kZWxldGUoZW5naW5lLm9iamVjdFVJRCk7XG4gIH1cbn1cblNjZW5lR3JhcGhDb21wb25lbnQucmVnaXN0ZXJNZW1iZXIoe1xuICBidWZmZXJVc2U6IEJ1ZmZlclVzZS5HUFVJbnN0YW5jZURhdGEsXG4gIG1lbWJlck5hbWU6ICd3b3JsZE1hdHJpeCcsXG4gIGRhdGFDbGFzc1R5cGU6IE11dGFibGVNYXRyaXg0NCxcbiAgc2hhZGVyVHlwZTogU2hhZGVyVHlwZS5WZXJ0ZXhBbmRQaXhlbFNoYWRlcixcbiAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuTWF0NCxcbiAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgaW5pdFZhbHVlczogWzEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDFdLFxufSk7XG5TY2VuZUdyYXBoQ29tcG9uZW50LnJlZ2lzdGVyTWVtYmVyKHtcbiAgYnVmZmVyVXNlOiBCdWZmZXJVc2UuR1BVSW5zdGFuY2VEYXRhLFxuICBtZW1iZXJOYW1lOiAnbm9ybWFsTWF0cml4JyxcbiAgZGF0YUNsYXNzVHlwZTogTXV0YWJsZU1hdHJpeDMzLFxuICBzaGFkZXJUeXBlOiBTaGFkZXJUeXBlLlZlcnRleEFuZFBpeGVsU2hhZGVyLFxuICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5NYXQzLFxuICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICBpbml0VmFsdWVzOiBbMSwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMV0sXG59KTtcblNjZW5lR3JhcGhDb21wb25lbnQucmVnaXN0ZXJNZW1iZXIoe1xuICBidWZmZXJVc2U6IEJ1ZmZlclVzZS5HUFVJbnN0YW5jZURhdGEsXG4gIG1lbWJlck5hbWU6ICdpc1Zpc2libGUnLFxuICBkYXRhQ2xhc3NUeXBlOiBNdXRhYmxlU2NhbGFyLFxuICBzaGFkZXJUeXBlOiBTaGFkZXJUeXBlLlZlcnRleFNoYWRlcixcbiAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuU2NhbGFyLFxuICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICBpbml0VmFsdWVzOiBbMV0sXG4gIGNvbnZlcnRUb0Jvb2w6IHRydWUsXG59KTtcblNjZW5lR3JhcGhDb21wb25lbnQucmVnaXN0ZXJNZW1iZXIoe1xuICBidWZmZXJVc2U6IEJ1ZmZlclVzZS5HUFVJbnN0YW5jZURhdGEsXG4gIG1lbWJlck5hbWU6ICdpc0JpbGxib2FyZCcsXG4gIGRhdGFDbGFzc1R5cGU6IE11dGFibGVTY2FsYXIsXG4gIHNoYWRlclR5cGU6IFNoYWRlclR5cGUuVmVydGV4U2hhZGVyLFxuICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5TY2FsYXIsXG4gIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gIGluaXRWYWx1ZXM6IFswXSxcbiAgY29udmVydFRvQm9vbDogdHJ1ZSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsaUJBQWlCO0FBRTFCLFNBQVMsbUJBQTBDO0FBQ25ELFNBQVMsaUJBQWlCO0FBQzFCLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsb0JBQW9CO0FBQzdCLFNBQVMsa0JBQWtCO0FBRzNCLFNBQVMsc0JBQXNCO0FBTy9CLFNBQVMs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
