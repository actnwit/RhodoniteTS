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
    this.Mf = [];
    this.$f = [];
    /** True while this node is attached to its parent as a gizmo child (see _addGizmoChild). */
    this.ag = false;
    this.Qf = 0;
    this._worldMatrix = MutableMatrix44.dummy();
    this._worldMatrixRest = MutableMatrix44.identity();
    this._normalMatrix = MutableMatrix33.dummy();
    // The world matrix of the previous frame. Written by the temporal anti-aliasing (TemporalAASystem) only;
    // the motion vector pass reads it from the GPU instance data.
    this._previousWorldMatrix = MutableMatrix44.dummy();
    this._worldRotation = MutableQuaternion.identity();
    this.Rf = false;
    /**
     * Monotonically increasing counter that advances whenever this node's world matrix is invalidated.
     * Consumers such as SkeletalComponent sum these counters to detect whether any input changed.
     */
    this.bg = 0;
    this.cg = false;
    this.dg = false;
    this.Vf = false;
    this.fg = new AABB();
    this.pg = new AABB();
    this.Wf = true;
    /** Separate dirty flag: the skeletal and non-skeletal merged AABBs are cached independently. */
    this.Xf = true;
    /**
     * Epoch at which this node was last visited by {@link setWorldAABBDirtyParentRecursively}.
     * While it equals the static epoch, this node and all of its ancestors are known to be AABB-dirty,
     * so an upward propagation reaching this node can stop here.
     */
    this.Uf = 0;
    /** `__worldMatrixVersion` when logicForce last ran; while unchanged, $logic has nothing to update. */
    this.qg = -1;
    /** Component creation count when logicForce last ran (a mesh may have been attached since). */
    this.rg = -1;
    this._isVisible = MutableScalar.dummy();
    this._isBillboard = MutableScalar.dummy();
    /** True when any gizmo of this node has been set up: skips the per-frame gizmo checks of plain nodes. */
    this.Sf = false;
    this.gg = "world";
    this.Vd = 0;
    this.toMakeWorldMatrixTheSameAsLocalMatrix = false;
    // Skeletal
    this.isRootJoint = false;
    this.jointIndex = -1;
    this._isCulled = false;
    this.Lc = -1;
    _SceneGraphComponent.sg.push(new WeakRef(this));
    this.submitToAllocation(engine.config.scenegraphComponentCountPerBufferView, isReUse);
  }
  /**
   * Sets the visibility of this scene graph node.
   * @param flg - True to make visible, false to hide
   */
  set isVisible(flg) {
    this._isVisible.setValue(flg ? 1 : 0);
    _SceneGraphComponent.Hd(this.c);
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
    return (_a = this.zd.get(engine)) != null ? _a : 0;
  }
  /**
   * Increments the update counter for the specified engine.
   * @param engine - The engine instance to increment the update count for
   * @internal
   */
  static Hd(engine) {
    var _a;
    const currentCount = (_a = this.zd.get(engine)) != null ? _a : 0;
    this.zd.set(engine, currentCount + 1);
  }
  /**
   * Sets the visibility of this node and all its children recursively.
   * @param flag - True to make visible, false to hide
   */
  setVisibilityRecursively(flag) {
    this.isVisible = flag;
    for (const child of this.Mf) {
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
    for (const child of this.Mf) {
      child.isBillboard = flg;
    }
  }
  /**
   * Sets the visibility of the AABB (Axis-Aligned Bounding Box) gizmo.
   * @param flg - True to show the AABB gizmo, false to hide it
   */
  set isAABBGizmoVisible(flg) {
    if (flg) {
      this.Sf = true;
      if (Is.not.defined(this.Nf)) {
        this.Nf = new (_getGizmoClass("aabb"))(this.entity.engine, this.entity);
        this.Nf._setup();
      }
      this.Nf.isVisible = true;
    } else {
      if (Is.exist(this.Nf)) {
        this.Nf.isVisible = false;
      }
    }
  }
  /**
   * Gets the visibility state of the AABB gizmo.
   * @returns True if the AABB gizmo is visible, false otherwise
   */
  get isAABBGizmoVisible() {
    if (Is.exist(this.Nf)) {
      return this.Nf.isVisible;
    }
    return false;
  }
  /**
   * Sets the visibility of the locator gizmo.
   * @param flg - True to show the locator gizmo, false to hide it
   */
  set isLocatorGizmoVisible(flg) {
    if (flg) {
      this.Sf = true;
      if (Is.not.defined(this.Of)) {
        this.Of = new (_getGizmoClass("locator"))(this.entity.engine, this.entity);
        this.Of._setup();
      }
      this.Of.isVisible = true;
    } else {
      if (Is.exist(this.Of)) {
        this.Of.isVisible = false;
      }
    }
  }
  /**
   * Gets the visibility state of the locator gizmo.
   * @returns True if the locator gizmo is visible, false otherwise
   */
  get isLocatorGizmoVisible() {
    if (Is.exist(this.Of)) {
      return this.Of.isVisible;
    }
    return false;
  }
  /**
   * Sets the visibility of the translation gizmo.
   * @param flg - True to show the translation gizmo, false to hide it
   */
  set isTranslationGizmoVisible(flg) {
    if (flg) {
      this.Sf = true;
      if (Is.not.defined(this.Kf)) {
        this.Kf = new (_getGizmoClass("translation"))(this.entity.engine, this.entity);
        this.Kf._setup();
      }
      this.Kf.isVisible = true;
      this.kg();
      if (this.Kf.isSetup) {
        this.Kf._update();
      }
    } else {
      if (Is.exist(this.Kf)) {
        this.Kf.isVisible = false;
        this.lg();
      }
    }
  }
  /**
   * Gets the visibility state of the translation gizmo.
   * @returns True if the translation gizmo is visible, false otherwise
   */
  get isTranslationGizmoVisible() {
    if (Is.exist(this.Kf)) {
      return this.Kf.isVisible;
    }
    return false;
  }
  /**
   * Sets the visibility of the rotation gizmo.
   * @param flg - True to show the rotation gizmo, false to hide it
   */
  set isRotationGizmoVisible(flg) {
    if (flg) {
      this.Sf = true;
      if (Is.not.defined(this.Jf)) {
        this.Jf = new (_getGizmoClass("rotation"))(this.entity.engine, this.entity);
        this.Jf._setup();
        this.Jf.setSpace(this.gg);
      }
      this.Jf.isVisible = true;
      this.kg();
      if (this.Jf.isSetup) {
        this.Jf._update();
      }
    } else if (Is.exist(this.Jf)) {
      this.Jf.isVisible = false;
      this.lg();
    }
  }
  /**
   * Gets the visibility state of the rotation gizmo.
   * @returns True if the rotation gizmo is visible, false otherwise
   */
  get isRotationGizmoVisible() {
    if (Is.exist(this.Jf)) {
      return this.Jf.isVisible;
    }
    return false;
  }
  /**
   * Sets the visibility of the scale gizmo.
   * @param flg - True to show the scale gizmo, false to hide it
   */
  set isScaleGizmoVisible(flg) {
    if (flg) {
      this.Sf = true;
      if (Is.not.defined(this.Lf)) {
        this.Lf = new (_getGizmoClass("scale"))(this.entity.engine, this.entity);
        this.Lf._setup();
      }
      this.Lf.isVisible = true;
      this.kg();
      if (this.Lf.isSetup) {
        this.Lf._update();
      }
    } else {
      if (Is.exist(this.Lf)) {
        this.Lf.isVisible = false;
        this.lg();
      }
    }
  }
  /**
   * Gets the visibility state of the scale gizmo.
   * @returns True if the scale gizmo is visible, false otherwise
   */
  get isScaleGizmoVisible() {
    if (Is.exist(this.Lf)) {
      return this.Lf.isVisible;
    }
    return false;
  }
  /**
   * Sets the visibility of the joint gizmo that visualizes skeletal joints.
   * @param flg - True to show the joint gizmo, false to hide it
   */
  set isJointGizmoVisible(flg) {
    if (flg && this.isJoint()) {
      this.Sf = true;
      if (Is.not.defined(this.Pf)) {
        this.Pf = new (_getGizmoClass("joint"))(this.entity.engine, this.entity);
        this.Pf._setup();
      }
      this.Pf.isVisible = true;
    } else if (Is.exist(this.Pf)) {
      this.Pf.isVisible = false;
    }
  }
  /**
   * Gets the visibility state of the joint gizmo.
   * @returns True if the joint gizmo is visible, false otherwise
   */
  get isJointGizmoVisible() {
    if (Is.exist(this.Pf)) {
      return this.Pf.isVisible;
    }
    return false;
  }
  /**
   * Gets all top-level scene graph components (nodes without parents).
   * @returns An array of scene graph components that are at the root level
   */
  static getTopLevelComponents() {
    return _SceneGraphComponent.sg.map((sgRef) => sgRef.deref()).filter((sg) => {
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
    return _SceneGraphComponent.og;
  }
  /**
   * Advances the hierarchy version after a parent-child relationship changed.
   */
  static Zf() {
    _SceneGraphComponent.og++;
    _SceneGraphComponent.Uf++;
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
    this.cg = false;
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
    return this.bg;
  }
  /**
   * The world matrix of the previous frame, used by the motion vectors of temporal anti-aliasing.
   * It is part of the GPU instance data (`get_previousWorldMatrix` in the shaders) and is only kept up to date
   * while temporal anti-aliasing is enabled.
   *
   * @internal
   */
  get _previousWorldMatrixInner() {
    return this._previousWorldMatrix;
  }
  /**
   * The world matrix as it was last computed (the value in the GPU instance data), without recomputing a dirty
   * matrix.
   *
   * @internal
   */
  get _lastComputedWorldMatrixInner() {
    return this._worldMatrix;
  }
  /**
   * Marks the world matrix as dirty and propagates changes up the hierarchy.
   */
  setWorldMatrixDirty() {
    var _a;
    this.setWorldMatrixDirtyRecursively();
    if (!this.ag) {
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
    if (!this.Rf && !this.dg && !this.Vf && this.Wf && this.Xf) {
      return;
    }
    this.bg++;
    this.Rf = false;
    this.dg = false;
    this.Vf = false;
    this.Wf = true;
    this.Xf = true;
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
    const epoch = _SceneGraphComponent.Uf;
    let node = this;
    while (node != null) {
      node.Wf = true;
      node.Xf = true;
      if (node.Uf === epoch) {
        return;
      }
      node.Uf = epoch;
      node = node.If;
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
    if (Is.exist(sg.If)) {
      sg.If.removeChild(sg);
    }
    sg.If = this;
    this.Mf.push(sg);
    _SceneGraphComponent.Zf();
    this._f(sg.Qf);
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
    const index = this.Mf.indexOf(sg);
    if (index >= 0) {
      this._f(-sg.Qf);
      this.Mf.splice(index, 1);
    }
    const gizmoIndex = this.$f.indexOf(sg);
    if (gizmoIndex >= 0) {
      this.$f.splice(gizmoIndex, 1);
    }
    sg.If = void 0;
    sg.ag = false;
    _SceneGraphComponent.Zf();
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
    sg.If = this;
    sg.ag = true;
    this.$f.push(sg);
    _SceneGraphComponent.Zf();
  }
  /**
   * Checks if this node is at the top level (has no parent).
   * @returns True if this is a root node, false otherwise
   */
  get isTopLevel() {
    return this.If == null;
  }
  /**
   * Gets the child scene graph components of this node.
   * @returns An array of child scene graph components
   */
  get children() {
    return this.Mf;
  }
  /**
   * Gets the parent scene graph component of this node.
   * @returns The parent component, or undefined if this is a root node
   */
  get parent() {
    return this.If;
  }
  /**
   * Gets the internal world matrix (mutable reference).
   * @returns The internal world matrix
   */
  get matrixInner() {
    if (!this.Rf) {
      this.vg();
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
    if (Is.not.exist(this.If)) {
      this.entity.getTransform().localMatrixWithoutPhysics = matrix;
    } else {
      const parent = this.If;
      const invMatrix = Matrix44.invertTo(parent.matrixInner, _SceneGraphComponent.Fg);
      this.entity.getTransform().localMatrixWithoutPhysics = Matrix44.multiplyTo(
        invMatrix,
        matrix,
        _SceneGraphComponent.eg
      ).clone();
    }
  }
  setMatrixToPhysics(matrix) {
    this.wg(matrix, true, true, true);
    this.hg(true, true, true);
  }
  wg(matrix, updatePosition, updateRotation, updateScale) {
    const physicsComponent = this.entity.tryToGetPhysics();
    if (physicsComponent !== void 0) {
      if (physicsComponent.strategy !== void 0) {
        const strategy = physicsComponent.strategy;
        if (updateRotation) {
          const worldRotation = this.getQuaternionRecursivelyTo(_SceneGraphComponent.Ig);
          if (strategy.setRotation != null) {
            strategy.setRotation(worldRotation);
          } else if (strategy.setEulerAngle != null) {
            strategy.setEulerAngle(worldRotation.toEulerAnglesTo(_SceneGraphComponent.ug));
          }
        }
        if (updatePosition && strategy.setPosition != null) {
          strategy.setPosition(matrix.getTranslateTo(_SceneGraphComponent.Og));
        }
        if (updateScale && strategy.setScale != null) {
          strategy.setScale(this._getPhysicsWorldScale(matrix));
        }
      }
    }
  }
  hg(updatePosition, updateRotation, updateScale) {
    const ownPhysicsComponentCount = this.entity.tryToGetPhysics() === void 0 ? 0 : 1;
    if (this.Qf === ownPhysicsComponentCount) {
      return;
    }
    this.matrixInner;
    this.setWorldMatrixDirty();
    for (const child of this.Mf) {
      if (!child.toMakeWorldMatrixTheSameAsLocalMatrix && child.Qf > 0) {
        child.xg(updatePosition, updateRotation, updateScale);
      }
    }
  }
  xg(updatePosition, updateRotation, updateScale) {
    if (this.Qf === 0) {
      return;
    }
    this.wg(this.matrixInner, updatePosition, updateRotation, updateScale);
    for (const child of this.Mf) {
      if (!child.toMakeWorldMatrixTheSameAsLocalMatrix && child.Qf > 0) {
        child.xg(updatePosition, updateRotation, updateScale);
      }
    }
  }
  /**
   * Records that this entity acquired a PhysicsComponent.
   * @internal
   */
  _onPhysicsComponentAdded() {
    this._f(1);
  }
  /**
   * Records that this entity lost its PhysicsComponent.
   * @internal
   */
  _onPhysicsComponentRemoved() {
    this._f(-1);
  }
  /**
   * Returns whether this node or one of its descendants has a PhysicsComponent.
   * @internal
   */
  get _hasPhysicsComponentInSubtree() {
    return this.Qf > 0;
  }
  _f(delta) {
    this.Qf += delta;
    const parent = this.If;
    if (parent == null ? void 0 : parent.Mf.includes(this)) {
      parent._f(delta);
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
    if (!this.cg) {
      this.yg();
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
    if (!this.dg) {
      Matrix44.invertTo(this.matrixInner, _SceneGraphComponent.invertedMatrix44);
      this._normalMatrix.copyComponents(_SceneGraphComponent.invertedMatrix44.transpose());
      this.dg = true;
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
    if (this.Rf) {
      if (this.If) {
        const result = this.If.isWorldMatrixUpToDateRecursively();
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
  vg() {
    if (this.Rf) {
      return this._worldMatrix;
    }
    const transform = this.entity.getTransform();
    if (this.If == null || this.toMakeWorldMatrixTheSameAsLocalMatrix) {
      transform.getLocalMatrixInnerTo(this._worldMatrix);
    } else {
      const matrixFromAncestorToParent = this.If.vg();
      transform.getLocalMatrixInnerTo(_SceneGraphComponent.eg);
      MutableMatrix44.multiplyTo(matrixFromAncestorToParent, _SceneGraphComponent.eg, this._worldMatrix);
    }
    this.Rf = true;
    return this._worldMatrix;
  }
  /**
   * Recursively calculates the world matrix in rest pose from this node up to the root.
   * @returns The calculated world matrix in rest pose
   */
  yg() {
    if (this.cg) {
      return this._worldMatrixRest;
    }
    const transform = this.entity.getTransform();
    if (this.If == null || this.toMakeWorldMatrixTheSameAsLocalMatrix) {
      transform.getLocalMatrixInnerTo(this._worldMatrixRest);
    } else {
      const matrixFromAncestorToParent = this.If.yg();
      transform.getLocalMatrixInnerTo(_SceneGraphComponent.eg);
      MutableMatrix44.multiplyTo(matrixFromAncestorToParent, _SceneGraphComponent.eg, this._worldMatrixRest);
    }
    this.cg = true;
    return this._worldMatrixRest;
  }
  /**
   * Gets the world rotation quaternion by recursively combining local rotations.
   * This allocates a new quaternion. Use {@link getQuaternionRecursivelyTo}
   * when a pre-allocated output quaternion is available (e.g. in hot per-frame paths).
   * @returns The world rotation quaternion
   */
  getQuaternionRecursively() {
    return Quaternion.fromCopyQuaternion(this.getQuaternionRecursivelyTo(_SceneGraphComponent.Gg));
  }
  /**
   * Gets the world rotation quaternion by recursively combining local rotations
   * and stores the result in the given output quaternion without allocating.
   * @param out - The output quaternion to store the result
   * @returns The output quaternion containing the world rotation
   */
  getQuaternionRecursivelyTo(out) {
    const localRotation = this.entity.getTransform().localRotationInner;
    if (this.If == null) {
      return out.copyComponents(localRotation);
    }
    this.If.getQuaternionRecursivelyTo(_SceneGraphComponent.tg);
    return Quaternion.multiplyTo(_SceneGraphComponent.tg, localRotation, out);
  }
  /**
   * Gets the world position of this node.
   * @returns The world position as a Vector3
   */
  get worldPosition() {
    const zeroVector = _SceneGraphComponent.Bg;
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
    return Matrix44.invertTo(this.matrixInner, _SceneGraphComponent.ig).multiplyVector3To(worldPosition, out);
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
      AABB.multiplyMatrixTo(this.entity.getSceneGraph().matrixInner, aabb, _SceneGraphComponent.Tf);
    } else {
      _SceneGraphComponent.Tf.initialize();
    }
    const raymarchingComponent = this.entity.tryToGetRaymarching();
    if (Is.exist(raymarchingComponent)) {
      const raymarchingAABB = raymarchingComponent.calcWorldAABB();
      if (raymarchingAABB != null) {
        _SceneGraphComponent.Tf.mergeAABB(raymarchingAABB);
      }
    }
    return _SceneGraphComponent.Tf;
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
    this.pg = aabb;
    return aabb;
  }
  /**
   * Gets the cached merged world AABB, recalculating if dirty.
   * @returns The merged world AABB of this node and all its descendants
   */
  get worldMergedAABB() {
    if (this.Wf) {
      this.calcWorldMergedAABB();
      this.Wf = false;
      _SceneGraphComponent.Uf++;
    }
    return this.pg;
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
        _SceneGraphComponent.Tf
      );
    } else {
      _SceneGraphComponent.Tf.initialize();
    }
    const raymarchingComponent = this.entity.tryToGetRaymarching();
    if (Is.exist(raymarchingComponent)) {
      const raymarchingAABB = raymarchingComponent.calcWorldAABB();
      if (raymarchingAABB != null) {
        _SceneGraphComponent.Tf.mergeAABB(raymarchingAABB);
      }
    }
    return _SceneGraphComponent.Tf;
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
    this.fg = aabb;
    return aabb;
  }
  /**
   * Gets the cached merged world AABB with skeletal animation, recalculating if dirty.
   * @returns The merged world AABB with skeletal transformations
   */
  get worldMergedAABBWithSkeletal() {
    if (this.Xf) {
      this.calcWorldMergedAABBWithSkeletal();
      this.Xf = false;
      _SceneGraphComponent.Uf++;
    }
    return this.fg;
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
    if (this.qg === this.bg && this.Rf && !this.Sf && this.rg === this.c.componentRepository._componentCreationCount) {
      return;
    }
    if (this.Lc === TransformComponent.getUpdateCount(this.c)) {
      return;
    }
    this.logicForce();
    this.Lc = TransformComponent.getUpdateCount(this.c);
  }
  logicForce() {
    this.matrixInner;
    if (this.entity.tryToGetMesh() != null) {
      this.normalMatrixInner;
    }
    this.Pg();
    this.qg = this.bg;
    this.rg = this.c.componentRepository._componentCreationCount;
  }
  /**
   * Updates all active gizmos for this scene graph node.
   */
  Pg() {
    if (!this.Sf) {
      return;
    }
    if (Is.exist(this.Nf) && this.Nf.isSetup && this.Nf.isVisible) {
      this.Nf._update();
    }
    if (Is.exist(this.Of) && this.Of.isSetup && this.Of.isVisible) {
      this.Of._update();
    }
    this.zg();
    if (Is.exist(this.Pf) && this.Pf.isSetup && this.Pf.isVisible) {
      this.Pf._update();
    }
  }
  /**
   * Updates the translation, rotation and scale gizmos.
   * Their size depends on the camera, so this is also called when only the camera changed.
   */
  zg() {
    if (Is.exist(this.Kf) && this.Kf.isSetup && this.Kf.isVisible) {
      this.Kf._update();
    }
    if (Is.exist(this.Jf) && this.Jf.isSetup && this.Jf.isVisible) {
      this.Jf._update();
    }
    if (Is.exist(this.Lf) && this.Lf.isSetup && this.Lf.isVisible) {
      this.Lf._update();
    }
  }
  /**
   * Checks whether any transform gizmo is set up and visible on this node.
   * @returns True if at least one of the translation/rotation/scale gizmos is visible
   */
  Qg() {
    return Is.exist(this.Kf) && this.Kf.isSetup && this.Kf.isVisible || Is.exist(this.Jf) && this.Jf.isSetup && this.Jf.isVisible || Is.exist(this.Lf) && this.Lf.isSetup && this.Lf.isVisible;
  }
  /**
   * Registers this node as an owner of a visible transform gizmo so that the
   * gizmos can be rescaled when only the camera changed.
   */
  kg() {
    const engineUid = this.c.objectUID;
    let owners = _SceneGraphComponent.Yf.get(engineUid);
    if (owners == null) {
      owners = /* @__PURE__ */ new Set();
      _SceneGraphComponent.Yf.set(engineUid, owners);
    }
    owners.add(this);
  }
  /**
   * Removes this node from the transform gizmo registry when no transform gizmo is visible.
   */
  lg() {
    var _a;
    if (!this.Qg()) {
      (_a = _SceneGraphComponent.Yf.get(this.c.objectUID)) == null ? void 0 : _a.delete(this);
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
    const lastCameraState = _SceneGraphComponent.jg.get(engineUid);
    if (lastCameraState != null && lastCameraState.componentSID === componentSID && lastCameraState.updateCount === updateCount) {
      return;
    }
    _SceneGraphComponent.jg.set(engineUid, { componentSID, updateCount });
    const owners = _SceneGraphComponent.Yf.get(engineUid);
    if (owners == null) {
      return;
    }
    for (const sceneGraph of owners) {
      sceneGraph.zg();
    }
  }
  /**
   * Sets the world position without updating physics simulation.
   * @param vec - The world position to set
   */
  setPositionWithoutPhysics(vec) {
    if (Is.not.exist(this.If)) {
      this.entity.getTransform().localPositionWithoutPhysics = vec;
    } else {
      MutableMatrix44.invertTo(this.If.entity.getSceneGraph().matrixInner, _SceneGraphComponent.ig);
      this.entity.getTransform().localPositionWithoutPhysics = _SceneGraphComponent.ig.multiplyVector3(vec);
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
    this.hg(true, false, false);
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
    if (Is.not.exist(this.If)) {
      this.entity.getTransform().localEulerAnglesWithoutPhysics = vec;
    } else {
      const quat = Quaternion.fromMatrix(this.If.entity.getSceneGraph().matrixInner);
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
    this.Ag();
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
    if (Is.not.exist(this.If)) {
      this.entity.getTransform().localRotationWithoutPhysics = quat;
    } else {
      const quatInner = this.If.entity.getSceneGraph().rotation;
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
          strategy.setEulerAngle(quat.toEulerAnglesTo(_SceneGraphComponent.ug));
        }
      }
    }
    this.Ag();
  }
  Ag() {
    var _a;
    const strategy = (_a = this.entity.tryToGetPhysics()) == null ? void 0 : _a.strategy;
    if ((strategy == null ? void 0 : strategy.setScale) != null) {
      this.matrixInner;
      this.setWorldMatrixDirty();
      strategy.setScale(this._getPhysicsWorldScale(this.matrixInner));
    }
    this.hg(true, true, true);
  }
  /**
   * Updates the cached world rotation if it is dirty.
   * This avoids repeated recursive traversal across the hierarchy.
   */
  mg() {
    const localRotation = this.entity.getTransform().localRotationInner;
    if (this.If == null || this.toMakeWorldMatrixTheSameAsLocalMatrix) {
      if (!this.Vf) {
        this._worldRotation.copyComponents(localRotation);
        this.Vf = true;
      }
      return this._worldRotation;
    }
    if (!this.Vf) {
      Quaternion.multiplyTo(this.If.mg(), localRotation, this._worldRotation);
      this.Vf = true;
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
    if (this.If == null || this.toMakeWorldMatrixTheSameAsLocalMatrix) {
      return this.entity.getTransform().localRotationInner;
    }
    return this.mg();
  }
  /**
   * Gets the world rotation and stores it in the output quaternion.
   * @param outQuat - The output quaternion to store the rotation
   * @returns The output quaternion containing the world rotation
   */
  getRotationTo(outQuat) {
    const worldRotation = this.mg();
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
    if (Is.not.exist(this.If)) {
      this.entity.getTransform().localScaleWithoutPhysics = vec;
    } else {
      const mat = this.If.entity.getSceneGraph().matrix;
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
    this.hg(true, true, true);
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
    const rotation = this.getQuaternionRecursivelyTo(_SceneGraphComponent.Hg);
    const axisX = rotation.transformVector3To(_SceneGraphComponent.Cg, _SceneGraphComponent.Jg);
    const axisY = rotation.transformVector3To(_SceneGraphComponent.Dg, _SceneGraphComponent.Kg);
    const axisZ = rotation.transformVector3To(_SceneGraphComponent.Eg, _SceneGraphComponent.Lg);
    const scale = matrix.getScaleTo(_SceneGraphComponent.Mg);
    const projectionX = matrix.m00 * axisX.x + matrix.m10 * axisX.y + matrix.m20 * axisX.z;
    const projectionY = matrix.m01 * axisY.x + matrix.m11 * axisY.y + matrix.m21 * axisY.z;
    const projectionZ = matrix.m02 * axisZ.x + matrix.m12 * axisZ.y + matrix.m22 * axisZ.z;
    return _SceneGraphComponent.Ng.setComponents(
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
  Rg(child) {
    const newChild = child.entity.engine.entityRepository._shallowCopyEntityInner(child.entity);
    newChild.getSceneGraph().If = this;
    _SceneGraphComponent.Zf();
    return newChild;
  }
  /**
   * Performs a shallow copy from another SceneGraphComponent.
   * @param component_ - The source component to copy from
   */
  _shallowCopyFrom(component_) {
    const component = component_;
    this.If = component.If;
    this.Mf = [];
    _SceneGraphComponent.Zf();
    this.Qf = 0;
    for (let i = 0; i < component.Mf.length; i++) {
      const copyChild = this.Rg(component.Mf[i]).getSceneGraph();
      this.Mf.push(copyChild);
      this._f(copyChild.Qf);
    }
    this.$f = component.$f.concat();
    this.ag = component.ag;
    this._worldMatrix.copyComponents(component._worldMatrix);
    this._previousWorldMatrix.copyComponents(component._previousWorldMatrix);
    this._worldMatrixRest.copyComponents(component._worldMatrixRest);
    this._normalMatrix.copyComponents(component._normalMatrix);
    this.Rf = false;
    this.cg = false;
    this.dg = false;
    this.Vf = false;
    this.bg++;
    this.fg = component.fg.clone();
    this.Wf = true;
    this.Xf = true;
    this._isVisible.copyComponents(component._isVisible);
    this._isBillboard.copyComponents(component._isBillboard);
    this.gg = component.gg;
    this.Vd = component.Vd;
    this.toMakeWorldMatrixTheSameAsLocalMatrix = component.toMakeWorldMatrixTheSameAsLocalMatrix;
    this.isRootJoint = component.isRootJoint;
    this.jointIndex = component.jointIndex;
  }
  /**
   * Gets the entity which has this component.
   * @returns The entity which has this component
   */
  get entity() {
    return this.c.entityRepository.getEntity(this.Qb);
  }
  /**
   * Sets the coordinate space for transformation gizmos.
   * @param space - The coordinate space ('local' or 'world')
   */
  setTransformGizmoSpace(space) {
    var _a, _b, _c;
    this.gg = space;
    (_a = this.Kf) == null ? void 0 : _a.setSpace(space);
    (_b = this.Jf) == null ? void 0 : _b.setSpace(space);
    (_c = this.Lf) == null ? void 0 : _c.setSpace(space);
  }
  /**
   * Destroys this component and cleans up resources.
   */
  _destroy() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    super._destroy();
    _SceneGraphComponent.Zf();
    (_a = _SceneGraphComponent.Yf.get(this.c.objectUID)) == null ? void 0 : _a.delete(this);
    (_b = this.Nf) == null ? void 0 : _b._destroy();
    (_c = this.Of) == null ? void 0 : _c._destroy();
    (_d = this.Kf) == null ? void 0 : _d._destroy();
    (_e = this.Jf) == null ? void 0 : _e._destroy();
    (_f = this.Lf) == null ? void 0 : _f._destroy();
    (_g = this.Pf) == null ? void 0 : _g._destroy();
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
        if (this.ng === void 0) {
          this.ng = this.getComponentByComponentTID(
            WellKnownComponentTIDs.SceneGraphComponentTID
          );
        }
        return this.ng;
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
    _SceneGraphComponent.zd.delete(engine);
    _SceneGraphComponent.Yf.delete(engine.objectUID);
    _SceneGraphComponent.jg.delete(engine.objectUID);
  }
};
_SceneGraphComponent.og = 0;
/**
 * Validity epoch of the per-node `__aabbDirtyChainEpoch` marks. Advancing it invalidates all marks at
 * once; this is required whenever an AABB-dirty flag is cleared or a parent-child link changes, since
 * either can break the "this node and all ancestors are AABB-dirty" guarantee of a mark.
 */
_SceneGraphComponent.Uf = 1;
_SceneGraphComponent.Bg = Vector3.zero();
_SceneGraphComponent.Cg = Vector3.fromCopy3(1, 0, 0);
_SceneGraphComponent.Dg = Vector3.fromCopy3(0, 1, 0);
_SceneGraphComponent.Eg = Vector3.fromCopy3(0, 0, 1);
_SceneGraphComponent.returnVector3 = MutableVector3.zero();
_SceneGraphComponent.sg = [];
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
_SceneGraphComponent.ig = MutableMatrix44.identity();
_SceneGraphComponent.eg = MutableMatrix44.identity();
_SceneGraphComponent.Fg = MutableMatrix44.identity();
_SceneGraphComponent.tg = MutableQuaternion.identity();
_SceneGraphComponent.Gg = MutableQuaternion.identity();
_SceneGraphComponent.Hg = MutableQuaternion.identity();
_SceneGraphComponent.Ig = MutableQuaternion.identity();
_SceneGraphComponent.Jg = MutableVector3.zero();
_SceneGraphComponent.Kg = MutableVector3.zero();
_SceneGraphComponent.Lg = MutableVector3.zero();
_SceneGraphComponent.Mg = MutableVector3.one();
_SceneGraphComponent.Ng = MutableVector3.one();
_SceneGraphComponent.ug = MutableVector3.zero();
_SceneGraphComponent.Og = MutableVector3.zero();
/** Map to store update count per Engine instance for multi-engine support */
_SceneGraphComponent.zd = /* @__PURE__ */ new Map();
_SceneGraphComponent.Tf = new AABB();
/** Scene graphs that currently own a visible transform gizmo, keyed by engine.objectUID. */
_SceneGraphComponent.Yf = /* @__PURE__ */ new Map();
/** Last camera identity and update count applied to the transform gizmos, keyed by engine.objectUID. */
_SceneGraphComponent.jg = /* @__PURE__ */ new Map();
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
SceneGraphComponent.registerMember({
  bufferUse: BufferUse.GPUInstanceData,
  memberName: "previousWorldMatrix",
  dataClassType: MutableMatrix44,
  shaderType: ShaderType.VertexShader,
  compositionType: CompositionType.Mat4,
  componentType: ComponentType.Float,
  initValues: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
});
export {
  SceneGraphComponent
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29tcG9uZW50cy9TY2VuZUdyYXBoL1NjZW5lR3JhcGhDb21wb25lbnQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgQ29tcG9uZW50U0lELCBDb21wb25lbnRUSUQsIEVudGl0eVVJRCB9IGZyb20gJy4uLy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4uLy4uL2NvcmUvQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgSUVudGl0eSB9IGZyb20gJy4uLy4uL2NvcmUvRW50aXR5JztcbmltcG9ydCB7IGFwcGx5TWl4aW5zLCB0eXBlIEVudGl0eVJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9jb3JlL0VudGl0eVJlcG9zaXRvcnknO1xuaW1wb3J0IHsgQnVmZmVyVXNlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvQnVmZmVyVXNlJztcbmltcG9ydCB7IENvbXBvbmVudFR5cGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Db21wb25lbnRUeXBlJztcbmltcG9ydCB7IENvbXBvc2l0aW9uVHlwZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL0NvbXBvc2l0aW9uVHlwZSc7XG5pbXBvcnQgeyBQcm9jZXNzU3RhZ2UgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Qcm9jZXNzU3RhZ2UnO1xuaW1wb3J0IHsgU2hhZGVyVHlwZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1NoYWRlclR5cGUnO1xuaW1wb3J0IHR5cGUgeyBSYXljYXN0UmVzdWx0RXgyIH0gZnJvbSAnLi4vLi4vZ2VvbWV0cnkvdHlwZXMvR2VvbWV0cnlUeXBlcyc7XG5pbXBvcnQgdHlwZSB7IEFBQkJHaXptbyB9IGZyb20gJy4uLy4uL2dpem1vcy9BQUJCR2l6bW8nO1xuaW1wb3J0IHsgX2dldEdpem1vQ2xhc3MgfSBmcm9tICcuLi8uLi9naXptb3MvR2l6bW9SZWdpc3RyeSc7XG5pbXBvcnQgdHlwZSB7IEpvaW50R2l6bW8gfSBmcm9tICcuLi8uLi9naXptb3MvSm9pbnRHaXptbyc7XG5pbXBvcnQgdHlwZSB7IExvY2F0b3JHaXptbyB9IGZyb20gJy4uLy4uL2dpem1vcy9Mb2NhdG9yR2l6bW8nO1xuaW1wb3J0IHR5cGUgeyBSb3RhdGlvbkdpem1vIH0gZnJvbSAnLi4vLi4vZ2l6bW9zL1JvdGF0aW9uR2l6bW8nO1xuaW1wb3J0IHR5cGUgeyBTY2FsZUdpem1vIH0gZnJvbSAnLi4vLi4vZ2l6bW9zL1NjYWxlR2l6bW8nO1xuaW1wb3J0IHR5cGUgeyBUcmFuc2xhdGlvbkdpem1vIH0gZnJvbSAnLi4vLi4vZ2l6bW9zL1RyYW5zbGF0aW9uR2l6bW8nO1xuaW1wb3J0IHR5cGUgeyBJU2NlbmVHcmFwaEVudGl0eSB9IGZyb20gJy4uLy4uL2hlbHBlcnMvRW50aXR5SGVscGVyJztcbmltcG9ydCB7IEFBQkIgfSBmcm9tICcuLi8uLi9tYXRoL0FBQkInO1xuaW1wb3J0IHR5cGUgeyBJTWF0cml4NDQgfSBmcm9tICcuLi8uLi9tYXRoL0lNYXRyaXgnO1xuaW1wb3J0IHR5cGUgeyBJTXV0YWJsZVF1YXRlcm5pb24sIElRdWF0ZXJuaW9uIH0gZnJvbSAnLi4vLi4vbWF0aC9JUXVhdGVybmlvbic7XG5pbXBvcnQgdHlwZSB7IElWZWN0b3IzIH0gZnJvbSAnLi4vLi4vbWF0aC9JVmVjdG9yJztcbmltcG9ydCB7IE1hdHJpeDQ0IH0gZnJvbSAnLi4vLi4vbWF0aC9NYXRyaXg0NCc7XG5pbXBvcnQgeyBNdXRhYmxlTWF0cml4MzMgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVNYXRyaXgzMyc7XG5pbXBvcnQgeyBNdXRhYmxlTWF0cml4NDQgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVNYXRyaXg0NCc7XG5pbXBvcnQgeyBNdXRhYmxlUXVhdGVybmlvbiB9IGZyb20gJy4uLy4uL21hdGgvTXV0YWJsZVF1YXRlcm5pb24nO1xuaW1wb3J0IHsgTXV0YWJsZVNjYWxhciB9IGZyb20gJy4uLy4uL21hdGgvTXV0YWJsZVNjYWxhcic7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yMyB9IGZyb20gJy4uLy4uL21hdGgvTXV0YWJsZVZlY3RvcjMnO1xuaW1wb3J0IHsgUXVhdGVybmlvbiB9IGZyb20gJy4uLy4uL21hdGgvUXVhdGVybmlvbic7XG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAnLi4vLi4vbWF0aC9WZWN0b3IzJztcbmltcG9ydCB0eXBlIHsgVmVjdG9yNCB9IGZyb20gJy4uLy4uL21hdGgvVmVjdG9yNCc7XG5pbXBvcnQgeyBJcyB9IGZyb20gJy4uLy4uL21pc2MvSXMnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi8uLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB7IENhbWVyYUNvbXBvbmVudCB9IGZyb20gJy4uL0NhbWVyYS9DYW1lcmFDb21wb25lbnQnO1xuaW1wb3J0IHR5cGUgeyBDb21wb25lbnRUb0NvbXBvbmVudE1ldGhvZHMgfSBmcm9tICcuLi9Db21wb25lbnRUeXBlcyc7XG5pbXBvcnQgdHlwZSB7IE1lc2hDb21wb25lbnQgfSBmcm9tICcuLi9NZXNoL01lc2hDb21wb25lbnQnO1xuaW1wb3J0IHsgVHJhbnNmb3JtQ29tcG9uZW50IH0gZnJvbSAnLi4vVHJhbnNmb3JtL1RyYW5zZm9ybUNvbXBvbmVudCc7XG5pbXBvcnQgeyBXZWxsS25vd25Db21wb25lbnRUSURzIH0gZnJvbSAnLi4vV2VsbEtub3duQ29tcG9uZW50VElEcyc7XG5pbXBvcnQgeyBmbGF0dGVuSGllcmFyY2h5IH0gZnJvbSAnLi9TY2VuZUdyYXBoT3BzJztcblxuLyoqXG4gKiBTY2VuZUdyYXBoQ29tcG9uZW50IGlzIGEgY29tcG9uZW50IHRoYXQgcmVwcmVzZW50cyBhIG5vZGUgaW4gdGhlIHNjZW5lIGdyYXBoLlxuICogSXQgbWFuYWdlcyBoaWVyYXJjaGljYWwgcmVsYXRpb25zaGlwcyBiZXR3ZWVuIGVudGl0aWVzIGFuZCBoYW5kbGVzIHdvcmxkIG1hdHJpeCBjYWxjdWxhdGlvbnMuXG4gKi9cbmV4cG9ydCBjbGFzcyBTY2VuZUdyYXBoQ29tcG9uZW50IGV4dGVuZHMgQ29tcG9uZW50IHtcbiAgcHJpdmF0ZSBfX3BhcmVudD86IFNjZW5lR3JhcGhDb21wb25lbnQ7XG4gIHByaXZhdGUgX19jaGlsZHJlbjogU2NlbmVHcmFwaENvbXBvbmVudFtdID0gW107XG4gIHByaXZhdGUgX19naXptb0NoaWxkcmVuOiBTY2VuZUdyYXBoQ29tcG9uZW50W10gPSBbXTtcbiAgLyoqIFRydWUgd2hpbGUgdGhpcyBub2RlIGlzIGF0dGFjaGVkIHRvIGl0cyBwYXJlbnQgYXMgYSBnaXptbyBjaGlsZCAoc2VlIF9hZGRHaXptb0NoaWxkKS4gKi9cbiAgcHJpdmF0ZSBfX2lzR2l6bW9DaGlsZCA9IGZhbHNlO1xuICBwcml2YXRlIF9fcGh5c2ljc0NvbXBvbmVudENvdW50SW5TdWJ0cmVlID0gMDtcbiAgcHJpdmF0ZSBzdGF0aWMgX19oaWVyYXJjaHlWZXJzaW9uID0gMDtcbiAgLyoqXG4gICAqIFZhbGlkaXR5IGVwb2NoIG9mIHRoZSBwZXItbm9kZSBgX19hYWJiRGlydHlDaGFpbkVwb2NoYCBtYXJrcy4gQWR2YW5jaW5nIGl0IGludmFsaWRhdGVzIGFsbCBtYXJrcyBhdFxuICAgKiBvbmNlOyB0aGlzIGlzIHJlcXVpcmVkIHdoZW5ldmVyIGFuIEFBQkItZGlydHkgZmxhZyBpcyBjbGVhcmVkIG9yIGEgcGFyZW50LWNoaWxkIGxpbmsgY2hhbmdlcywgc2luY2VcbiAgICogZWl0aGVyIGNhbiBicmVhayB0aGUgXCJ0aGlzIG5vZGUgYW5kIGFsbCBhbmNlc3RvcnMgYXJlIEFBQkItZGlydHlcIiBndWFyYW50ZWUgb2YgYSBtYXJrLlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19hYWJiRGlydHlDaGFpbkVwb2NoID0gMTtcbiAgcHJpdmF0ZSBfd29ybGRNYXRyaXg6IE11dGFibGVNYXRyaXg0NCA9IE11dGFibGVNYXRyaXg0NC5kdW1teSgpO1xuICBwcml2YXRlIF93b3JsZE1hdHJpeFJlc3Q6IE11dGFibGVNYXRyaXg0NCA9IE11dGFibGVNYXRyaXg0NC5pZGVudGl0eSgpO1xuICBwcml2YXRlIF9ub3JtYWxNYXRyaXg6IE11dGFibGVNYXRyaXgzMyA9IE11dGFibGVNYXRyaXgzMy5kdW1teSgpO1xuICAvLyBUaGUgd29ybGQgbWF0cml4IG9mIHRoZSBwcmV2aW91cyBmcmFtZS4gV3JpdHRlbiBieSB0aGUgdGVtcG9yYWwgYW50aS1hbGlhc2luZyAoVGVtcG9yYWxBQVN5c3RlbSkgb25seTtcbiAgLy8gdGhlIG1vdGlvbiB2ZWN0b3IgcGFzcyByZWFkcyBpdCBmcm9tIHRoZSBHUFUgaW5zdGFuY2UgZGF0YS5cbiAgcHJpdmF0ZSBfcHJldmlvdXNXb3JsZE1hdHJpeDogTXV0YWJsZU1hdHJpeDQ0ID0gTXV0YWJsZU1hdHJpeDQ0LmR1bW15KCk7XG4gIHByaXZhdGUgX3dvcmxkUm90YXRpb246IE11dGFibGVRdWF0ZXJuaW9uID0gTXV0YWJsZVF1YXRlcm5pb24uaWRlbnRpdHkoKTtcbiAgcHJpdmF0ZSBfX2lzV29ybGRNYXRyaXhVcFRvRGF0ZSA9IGZhbHNlO1xuICAvKipcbiAgICogTW9ub3RvbmljYWxseSBpbmNyZWFzaW5nIGNvdW50ZXIgdGhhdCBhZHZhbmNlcyB3aGVuZXZlciB0aGlzIG5vZGUncyB3b3JsZCBtYXRyaXggaXMgaW52YWxpZGF0ZWQuXG4gICAqIENvbnN1bWVycyBzdWNoIGFzIFNrZWxldGFsQ29tcG9uZW50IHN1bSB0aGVzZSBjb3VudGVycyB0byBkZXRlY3Qgd2hldGhlciBhbnkgaW5wdXQgY2hhbmdlZC5cbiAgICovXG4gIHByaXZhdGUgX193b3JsZE1hdHJpeFZlcnNpb24gPSAwO1xuICBwcml2YXRlIF9faXNXb3JsZE1hdHJpeFJlc3RVcFRvRGF0ZSA9IGZhbHNlO1xuICBwcml2YXRlIF9faXNOb3JtYWxNYXRyaXhVcFRvRGF0ZSA9IGZhbHNlO1xuICBwcml2YXRlIF9faXNXb3JsZFJvdGF0aW9uVXBUb0RhdGUgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX3dvcmxkTWVyZ2VkQUFCQldpdGhTa2VsZXRhbCA9IG5ldyBBQUJCKCk7XG4gIHByaXZhdGUgX193b3JsZE1lcmdlZEFBQkIgPSBuZXcgQUFCQigpO1xuICBwcml2YXRlIF9faXNXb3JsZEFBQkJEaXJ0eSA9IHRydWU7XG4gIC8qKiBTZXBhcmF0ZSBkaXJ0eSBmbGFnOiB0aGUgc2tlbGV0YWwgYW5kIG5vbi1za2VsZXRhbCBtZXJnZWQgQUFCQnMgYXJlIGNhY2hlZCBpbmRlcGVuZGVudGx5LiAqL1xuICBwcml2YXRlIF9faXNXb3JsZEFBQkJEaXJ0eVdpdGhTa2VsZXRhbCA9IHRydWU7XG4gIC8qKlxuICAgKiBFcG9jaCBhdCB3aGljaCB0aGlzIG5vZGUgd2FzIGxhc3QgdmlzaXRlZCBieSB7QGxpbmsgc2V0V29ybGRBQUJCRGlydHlQYXJlbnRSZWN1cnNpdmVseX0uXG4gICAqIFdoaWxlIGl0IGVxdWFscyB0aGUgc3RhdGljIGVwb2NoLCB0aGlzIG5vZGUgYW5kIGFsbCBvZiBpdHMgYW5jZXN0b3JzIGFyZSBrbm93biB0byBiZSBBQUJCLWRpcnR5LFxuICAgKiBzbyBhbiB1cHdhcmQgcHJvcGFnYXRpb24gcmVhY2hpbmcgdGhpcyBub2RlIGNhbiBzdG9wIGhlcmUuXG4gICAqL1xuICBwcml2YXRlIF9fYWFiYkRpcnR5Q2hhaW5FcG9jaCA9IDA7XG4gIC8qKiBgX193b3JsZE1hdHJpeFZlcnNpb25gIHdoZW4gbG9naWNGb3JjZSBsYXN0IHJhbjsgd2hpbGUgdW5jaGFuZ2VkLCAkbG9naWMgaGFzIG5vdGhpbmcgdG8gdXBkYXRlLiAqL1xuICBwcml2YXRlIF9fc2V0dGxlZFdvcmxkTWF0cml4VmVyc2lvbiA9IC0xO1xuICAvKiogQ29tcG9uZW50IGNyZWF0aW9uIGNvdW50IHdoZW4gbG9naWNGb3JjZSBsYXN0IHJhbiAoYSBtZXNoIG1heSBoYXZlIGJlZW4gYXR0YWNoZWQgc2luY2UpLiAqL1xuICBwcml2YXRlIF9fc2V0dGxlZENvbXBvbmVudENyZWF0aW9uQ291bnQgPSAtMTtcbiAgcHJpdmF0ZSBfaXNWaXNpYmxlOiBNdXRhYmxlU2NhbGFyID0gTXV0YWJsZVNjYWxhci5kdW1teSgpO1xuICBwcml2YXRlIF9pc0JpbGxib2FyZDogTXV0YWJsZVNjYWxhciA9IE11dGFibGVTY2FsYXIuZHVtbXkoKTtcbiAgcHJpdmF0ZSBfX2FhYmJHaXptbz86IEFBQkJHaXptbztcbiAgcHJpdmF0ZSBfX2xvY2F0b3JHaXptbz86IExvY2F0b3JHaXptbztcbiAgcHJpdmF0ZSBfX3RyYW5zbGF0aW9uR2l6bW8/OiBUcmFuc2xhdGlvbkdpem1vO1xuICBwcml2YXRlIF9fcm90YXRpb25HaXptbz86IFJvdGF0aW9uR2l6bW87XG4gIHByaXZhdGUgX19zY2FsZUdpem1vPzogU2NhbGVHaXptbztcbiAgcHJpdmF0ZSBfX2pvaW50R2l6bW8/OiBKb2ludEdpem1vO1xuICAvKiogVHJ1ZSB3aGVuIGFueSBnaXptbyBvZiB0aGlzIG5vZGUgaGFzIGJlZW4gc2V0IHVwOiBza2lwcyB0aGUgcGVyLWZyYW1lIGdpem1vIGNoZWNrcyBvZiBwbGFpbiBub2Rlcy4gKi9cbiAgcHJpdmF0ZSBfX2hhc0dpem1vcyA9IGZhbHNlO1xuICBwcml2YXRlIF9fdHJhbnNmb3JtR2l6bW9TcGFjZTogJ2xvY2FsJyB8ICd3b3JsZCcgPSAnd29ybGQnO1xuICBwcml2YXRlIF9fbGF0ZXN0UHJpbWl0aXZlUG9zaXRpb25BY2Nlc3NvclZlcnNpb24gPSAwO1xuICBwdWJsaWMgdG9NYWtlV29ybGRNYXRyaXhUaGVTYW1lQXNMb2NhbE1hdHJpeCA9IGZhbHNlO1xuICAvLyBTa2VsZXRhbFxuICBwdWJsaWMgaXNSb290Sm9pbnQgPSBmYWxzZTtcbiAgcHVibGljIGpvaW50SW5kZXggPSAtMTtcbiAgX2lzQ3VsbGVkID0gZmFsc2U7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fb3JpZ2luVmVjdG9yMyA9IFZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX2F4aXNYID0gVmVjdG9yMy5mcm9tQ29weTMoMSwgMCwgMCk7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fYXhpc1kgPSBWZWN0b3IzLmZyb21Db3B5MygwLCAxLCAwKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX19heGlzWiA9IFZlY3RvcjMuZnJvbUNvcHkzKDAsIDAsIDEpO1xuICBwcml2YXRlIHN0YXRpYyByZXR1cm5WZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3NjZW5lR3JhcGhzOiBXZWFrUmVmPFNjZW5lR3JhcGhDb21wb25lbnQ+W10gPSBbXTtcbiAgcHJpdmF0ZSBzdGF0aWMgaW52ZXJ0ZWRNYXRyaXg0NCA9IE11dGFibGVNYXRyaXg0NC5mcm9tQ29weUFycmF5MTZDb2x1bW5NYWpvcihbXG4gICAgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCxcbiAgXSk7XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBfbWF0NCA9IE11dGFibGVNYXRyaXg0NC5pZGVudGl0eSgpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcF9tYXQ0XzMgPSBNdXRhYmxlTWF0cml4NDQuaWRlbnRpdHkoKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBfbWF0NF80ID0gTXV0YWJsZU1hdHJpeDQ0LmlkZW50aXR5KCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wX3F1YXRfMCA9IE11dGFibGVRdWF0ZXJuaW9uLmlkZW50aXR5KCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wX3F1YXRfMSA9IE11dGFibGVRdWF0ZXJuaW9uLmlkZW50aXR5KCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wX3F1YXRfMiA9IE11dGFibGVRdWF0ZXJuaW9uLmlkZW50aXR5KCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wX3F1YXRfMyA9IE11dGFibGVRdWF0ZXJuaW9uLmlkZW50aXR5KCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wX3ZlYzNfMCA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBfdmVjM18xID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcF92ZWMzXzIgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wX21hdHJpeFNjYWxlID0gTXV0YWJsZVZlY3RvcjMub25lKCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wX3BoeXNpY3NXb3JsZFNjYWxlID0gTXV0YWJsZVZlY3RvcjMub25lKCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wX2V1bGVyID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcF90cmFuc2xhdGUgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG5cbiAgLyoqIE1hcCB0byBzdG9yZSB1cGRhdGUgY291bnQgcGVyIEVuZ2luZSBpbnN0YW5jZSBmb3IgbXVsdGktZW5naW5lIHN1cHBvcnQgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX191cGRhdGVDb3VudE1hcDogTWFwPEVuZ2luZSwgbnVtYmVyPiA9IG5ldyBNYXAoKTtcblxuICBwcml2YXRlIHN0YXRpYyBfX3RtcEFBQkIgPSBuZXcgQUFCQigpO1xuXG4gIHByaXZhdGUgX19sYXN0VHJhbnNmb3JtQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gLTE7XG5cbiAgLyoqIFNjZW5lIGdyYXBocyB0aGF0IGN1cnJlbnRseSBvd24gYSB2aXNpYmxlIHRyYW5zZm9ybSBnaXptbywga2V5ZWQgYnkgZW5naW5lLm9iamVjdFVJRC4gKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX190cmFuc2Zvcm1HaXptb093bmVyczogTWFwPG51bWJlciwgU2V0PFNjZW5lR3JhcGhDb21wb25lbnQ+PiA9IG5ldyBNYXAoKTtcbiAgLyoqIExhc3QgY2FtZXJhIGlkZW50aXR5IGFuZCB1cGRhdGUgY291bnQgYXBwbGllZCB0byB0aGUgdHJhbnNmb3JtIGdpem1vcywga2V5ZWQgYnkgZW5naW5lLm9iamVjdFVJRC4gKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19sYXN0Q2FtZXJhU3RhdGVNYXA6IE1hcDxudW1iZXIsIHsgY29tcG9uZW50U0lEOiBDb21wb25lbnRTSUQ7IHVwZGF0ZUNvdW50OiBudW1iZXIgfT4gPSBuZXcgTWFwKCk7XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgU2NlbmVHcmFwaENvbXBvbmVudCBpbnN0YW5jZS5cbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHBhcmFtIGVudGl0eVVpZCAtIFRoZSB1bmlxdWUgaWRlbnRpZmllciBvZiB0aGUgZW50aXR5IHRoaXMgY29tcG9uZW50IGJlbG9uZ3MgdG9cbiAgICogQHBhcmFtIGNvbXBvbmVudFNpZCAtIFRoZSBjb21wb25lbnQgaW5zdGFuY2UgaWRlbnRpZmllclxuICAgKiBAcGFyYW0gZW50aXR5UmVwb3NpdG9yeSAtIFRoZSBlbnRpdHkgcmVwb3NpdG9yeSBtYW5hZ2luZyB0aGlzIGNvbXBvbmVudFxuICAgKiBAcGFyYW0gaXNSZVVzZSAtIFdoZXRoZXIgdGhpcyBjb21wb25lbnQgaXMgYmVpbmcgcmV1c2VkXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBlbnRpdHlVaWQ6IEVudGl0eVVJRCxcbiAgICBjb21wb25lbnRTaWQ6IENvbXBvbmVudFNJRCxcbiAgICBlbnRpdHlSZXBvc2l0b3J5OiBFbnRpdHlSZXBvc2l0b3J5LFxuICAgIGlzUmVVc2U6IGJvb2xlYW5cbiAgKSB7XG4gICAgc3VwZXIoZW5naW5lLCBlbnRpdHlVaWQsIGNvbXBvbmVudFNpZCwgZW50aXR5UmVwb3NpdG9yeSwgaXNSZVVzZSk7XG5cbiAgICBTY2VuZUdyYXBoQ29tcG9uZW50Ll9fc2NlbmVHcmFwaHMucHVzaChuZXcgV2Vha1JlZih0aGlzKSk7XG5cbiAgICB0aGlzLnN1Ym1pdFRvQWxsb2NhdGlvbihlbmdpbmUuY29uZmlnLnNjZW5lZ3JhcGhDb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcsIGlzUmVVc2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHZpc2liaWxpdHkgb2YgdGhpcyBzY2VuZSBncmFwaCBub2RlLlxuICAgKiBAcGFyYW0gZmxnIC0gVHJ1ZSB0byBtYWtlIHZpc2libGUsIGZhbHNlIHRvIGhpZGVcbiAgICovXG4gIHNldCBpc1Zpc2libGUoZmxnOiBib29sZWFuKSB7XG4gICAgdGhpcy5faXNWaXNpYmxlLnNldFZhbHVlKGZsZyA/IDEgOiAwKTtcbiAgICBTY2VuZUdyYXBoQ29tcG9uZW50Ll9faW5jcmVtZW50VXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmlzaWJpbGl0eSBzdGF0ZSBvZiB0aGlzIHNjZW5lIGdyYXBoIG5vZGUuXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdmlzaWJsZSwgZmFsc2UgaWYgaGlkZGVuXG4gICAqL1xuICBnZXQgaXNWaXNpYmxlKCkge1xuICAgIHJldHVybiB0aGlzLl9pc1Zpc2libGUuZ2V0VmFsdWUoKSA9PT0gMTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB1cGRhdGUgY291bnRlciBmb3Igc2NlbmUgZ3JhcGggY29tcG9uZW50cyBvZiB0aGUgc3BlY2lmaWVkIGVuZ2luZS5cbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2UgdG8gZ2V0IHRoZSB1cGRhdGUgY291bnQgZm9yXG4gICAqIEByZXR1cm5zIFRoZSBjdXJyZW50IHVwZGF0ZSBjb3VudCBmb3IgdGhlIHNwZWNpZmllZCBlbmdpbmVcbiAgICovXG4gIHN0YXRpYyBnZXRVcGRhdGVDb3VudChlbmdpbmU6IEVuZ2luZSk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX191cGRhdGVDb3VudE1hcC5nZXQoZW5naW5lKSA/PyAwO1xuICB9XG5cbiAgLyoqXG4gICAqIEluY3JlbWVudHMgdGhlIHVwZGF0ZSBjb3VudGVyIGZvciB0aGUgc3BlY2lmaWVkIGVuZ2luZS5cbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2UgdG8gaW5jcmVtZW50IHRoZSB1cGRhdGUgY291bnQgZm9yXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19pbmNyZW1lbnRVcGRhdGVDb3VudChlbmdpbmU6IEVuZ2luZSk6IHZvaWQge1xuICAgIGNvbnN0IGN1cnJlbnRDb3VudCA9IHRoaXMuX191cGRhdGVDb3VudE1hcC5nZXQoZW5naW5lKSA/PyAwO1xuICAgIHRoaXMuX191cGRhdGVDb3VudE1hcC5zZXQoZW5naW5lLCBjdXJyZW50Q291bnQgKyAxKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2aXNpYmlsaXR5IG9mIHRoaXMgbm9kZSBhbmQgYWxsIGl0cyBjaGlsZHJlbiByZWN1cnNpdmVseS5cbiAgICogQHBhcmFtIGZsYWcgLSBUcnVlIHRvIG1ha2UgdmlzaWJsZSwgZmFsc2UgdG8gaGlkZVxuICAgKi9cbiAgc2V0VmlzaWJpbGl0eVJlY3Vyc2l2ZWx5KGZsYWc6IGJvb2xlYW4pIHtcbiAgICB0aGlzLmlzVmlzaWJsZSA9IGZsYWc7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiB0aGlzLl9fY2hpbGRyZW4pIHtcbiAgICAgIGNoaWxkLnNldFZpc2liaWxpdHlSZWN1cnNpdmVseShmbGFnKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgYmlsbGJvYXJkIHN0YXRlIG9mIHRoaXMgc2NlbmUgZ3JhcGggbm9kZS5cbiAgICogQHBhcmFtIGZsZyAtIFRydWUgdG8gZW5hYmxlIGJpbGxib2FyZCBiZWhhdmlvciwgZmFsc2UgdG8gZGlzYWJsZVxuICAgKi9cbiAgc2V0IGlzQmlsbGJvYXJkKGZsZzogYm9vbGVhbikge1xuICAgIHRoaXMuX2lzQmlsbGJvYXJkLnNldFZhbHVlKGZsZyA/IDEgOiAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBiaWxsYm9hcmQgc3RhdGUgb2YgdGhpcyBzY2VuZSBncmFwaCBub2RlLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIGJpbGxib2FyZCBpcyBlbmFibGVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGdldCBpc0JpbGxib2FyZCgpIHtcbiAgICByZXR1cm4gdGhpcy5faXNCaWxsYm9hcmQuZ2V0VmFsdWUoKSA9PT0gMTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBiaWxsYm9hcmQgc3RhdGUgb2YgdGhpcyBub2RlIGFuZCBhbGwgaXRzIGNoaWxkcmVuIHJlY3Vyc2l2ZWx5LlxuICAgKiBAcGFyYW0gZmxnIC0gVHJ1ZSB0byBlbmFibGUgYmlsbGJvYXJkIGJlaGF2aW9yLCBmYWxzZSB0byBkaXNhYmxlXG4gICAqL1xuICBzZXRJc0JpbGxib2FyZFJlY3Vyc2l2ZWx5KGZsZzogYm9vbGVhbikge1xuICAgIHRoaXMuX2lzQmlsbGJvYXJkLnNldFZhbHVlKGZsZyA/IDEgOiAwKTtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHRoaXMuX19jaGlsZHJlbikge1xuICAgICAgY2hpbGQuaXNCaWxsYm9hcmQgPSBmbGc7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHZpc2liaWxpdHkgb2YgdGhlIEFBQkIgKEF4aXMtQWxpZ25lZCBCb3VuZGluZyBCb3gpIGdpem1vLlxuICAgKiBAcGFyYW0gZmxnIC0gVHJ1ZSB0byBzaG93IHRoZSBBQUJCIGdpem1vLCBmYWxzZSB0byBoaWRlIGl0XG4gICAqL1xuICBzZXQgaXNBQUJCR2l6bW9WaXNpYmxlKGZsZzogYm9vbGVhbikge1xuICAgIGlmIChmbGcpIHtcbiAgICAgIHRoaXMuX19oYXNHaXptb3MgPSB0cnVlO1xuICAgICAgaWYgKElzLm5vdC5kZWZpbmVkKHRoaXMuX19hYWJiR2l6bW8pKSB7XG4gICAgICAgIHRoaXMuX19hYWJiR2l6bW8gPSBuZXcgKF9nZXRHaXptb0NsYXNzKCdhYWJiJykpKHRoaXMuZW50aXR5LmVuZ2luZSwgdGhpcy5lbnRpdHkpO1xuICAgICAgICB0aGlzLl9fYWFiYkdpem1vLl9zZXR1cCgpO1xuICAgICAgfVxuICAgICAgdGhpcy5fX2FhYmJHaXptby5pc1Zpc2libGUgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoSXMuZXhpc3QodGhpcy5fX2FhYmJHaXptbykpIHtcbiAgICAgICAgdGhpcy5fX2FhYmJHaXptby5pc1Zpc2libGUgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmlzaWJpbGl0eSBzdGF0ZSBvZiB0aGUgQUFCQiBnaXptby5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgQUFCQiBnaXptbyBpcyB2aXNpYmxlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGdldCBpc0FBQkJHaXptb1Zpc2libGUoKSB7XG4gICAgaWYgKElzLmV4aXN0KHRoaXMuX19hYWJiR2l6bW8pKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX2FhYmJHaXptby5pc1Zpc2libGU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSBsb2NhdG9yIGdpem1vLlxuICAgKiBAcGFyYW0gZmxnIC0gVHJ1ZSB0byBzaG93IHRoZSBsb2NhdG9yIGdpem1vLCBmYWxzZSB0byBoaWRlIGl0XG4gICAqL1xuICBzZXQgaXNMb2NhdG9yR2l6bW9WaXNpYmxlKGZsZzogYm9vbGVhbikge1xuICAgIGlmIChmbGcpIHtcbiAgICAgIHRoaXMuX19oYXNHaXptb3MgPSB0cnVlO1xuICAgICAgaWYgKElzLm5vdC5kZWZpbmVkKHRoaXMuX19sb2NhdG9yR2l6bW8pKSB7XG4gICAgICAgIHRoaXMuX19sb2NhdG9yR2l6bW8gPSBuZXcgKF9nZXRHaXptb0NsYXNzKCdsb2NhdG9yJykpKHRoaXMuZW50aXR5LmVuZ2luZSwgdGhpcy5lbnRpdHkpO1xuICAgICAgICB0aGlzLl9fbG9jYXRvckdpem1vLl9zZXR1cCgpO1xuICAgICAgfVxuICAgICAgdGhpcy5fX2xvY2F0b3JHaXptby5pc1Zpc2libGUgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoSXMuZXhpc3QodGhpcy5fX2xvY2F0b3JHaXptbykpIHtcbiAgICAgICAgdGhpcy5fX2xvY2F0b3JHaXptby5pc1Zpc2libGUgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmlzaWJpbGl0eSBzdGF0ZSBvZiB0aGUgbG9jYXRvciBnaXptby5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgbG9jYXRvciBnaXptbyBpcyB2aXNpYmxlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGdldCBpc0xvY2F0b3JHaXptb1Zpc2libGUoKSB7XG4gICAgaWYgKElzLmV4aXN0KHRoaXMuX19sb2NhdG9yR2l6bW8pKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX2xvY2F0b3JHaXptby5pc1Zpc2libGU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSB0cmFuc2xhdGlvbiBnaXptby5cbiAgICogQHBhcmFtIGZsZyAtIFRydWUgdG8gc2hvdyB0aGUgdHJhbnNsYXRpb24gZ2l6bW8sIGZhbHNlIHRvIGhpZGUgaXRcbiAgICovXG4gIHNldCBpc1RyYW5zbGF0aW9uR2l6bW9WaXNpYmxlKGZsZzogYm9vbGVhbikge1xuICAgIGlmIChmbGcpIHtcbiAgICAgIHRoaXMuX19oYXNHaXptb3MgPSB0cnVlO1xuICAgICAgaWYgKElzLm5vdC5kZWZpbmVkKHRoaXMuX190cmFuc2xhdGlvbkdpem1vKSkge1xuICAgICAgICB0aGlzLl9fdHJhbnNsYXRpb25HaXptbyA9IG5ldyAoX2dldEdpem1vQ2xhc3MoJ3RyYW5zbGF0aW9uJykpKHRoaXMuZW50aXR5LmVuZ2luZSwgdGhpcy5lbnRpdHkpO1xuICAgICAgICB0aGlzLl9fdHJhbnNsYXRpb25HaXptby5fc2V0dXAoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX190cmFuc2xhdGlvbkdpem1vLmlzVmlzaWJsZSA9IHRydWU7XG4gICAgICB0aGlzLl9fcmVnaXN0ZXJUcmFuc2Zvcm1HaXptb093bmVyKCk7XG4gICAgICBpZiAodGhpcy5fX3RyYW5zbGF0aW9uR2l6bW8uaXNTZXR1cCkge1xuICAgICAgICB0aGlzLl9fdHJhbnNsYXRpb25HaXptby5fdXBkYXRlKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChJcy5leGlzdCh0aGlzLl9fdHJhbnNsYXRpb25HaXptbykpIHtcbiAgICAgICAgdGhpcy5fX3RyYW5zbGF0aW9uR2l6bW8uaXNWaXNpYmxlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX191bnJlZ2lzdGVyVHJhbnNmb3JtR2l6bW9Pd25lcklmTmVlZGVkKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHZpc2liaWxpdHkgc3RhdGUgb2YgdGhlIHRyYW5zbGF0aW9uIGdpem1vLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSB0cmFuc2xhdGlvbiBnaXptbyBpcyB2aXNpYmxlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGdldCBpc1RyYW5zbGF0aW9uR2l6bW9WaXNpYmxlKCkge1xuICAgIGlmIChJcy5leGlzdCh0aGlzLl9fdHJhbnNsYXRpb25HaXptbykpIHtcbiAgICAgIHJldHVybiB0aGlzLl9fdHJhbnNsYXRpb25HaXptby5pc1Zpc2libGU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSByb3RhdGlvbiBnaXptby5cbiAgICogQHBhcmFtIGZsZyAtIFRydWUgdG8gc2hvdyB0aGUgcm90YXRpb24gZ2l6bW8sIGZhbHNlIHRvIGhpZGUgaXRcbiAgICovXG4gIHNldCBpc1JvdGF0aW9uR2l6bW9WaXNpYmxlKGZsZzogYm9vbGVhbikge1xuICAgIGlmIChmbGcpIHtcbiAgICAgIHRoaXMuX19oYXNHaXptb3MgPSB0cnVlO1xuICAgICAgaWYgKElzLm5vdC5kZWZpbmVkKHRoaXMuX19yb3RhdGlvbkdpem1vKSkge1xuICAgICAgICB0aGlzLl9fcm90YXRpb25HaXptbyA9IG5ldyAoX2dldEdpem1vQ2xhc3MoJ3JvdGF0aW9uJykpKHRoaXMuZW50aXR5LmVuZ2luZSwgdGhpcy5lbnRpdHkpO1xuICAgICAgICB0aGlzLl9fcm90YXRpb25HaXptby5fc2V0dXAoKTtcbiAgICAgICAgdGhpcy5fX3JvdGF0aW9uR2l6bW8uc2V0U3BhY2UodGhpcy5fX3RyYW5zZm9ybUdpem1vU3BhY2UpO1xuICAgICAgfVxuICAgICAgdGhpcy5fX3JvdGF0aW9uR2l6bW8uaXNWaXNpYmxlID0gdHJ1ZTtcbiAgICAgIHRoaXMuX19yZWdpc3RlclRyYW5zZm9ybUdpem1vT3duZXIoKTtcbiAgICAgIGlmICh0aGlzLl9fcm90YXRpb25HaXptby5pc1NldHVwKSB7XG4gICAgICAgIHRoaXMuX19yb3RhdGlvbkdpem1vLl91cGRhdGUoKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKElzLmV4aXN0KHRoaXMuX19yb3RhdGlvbkdpem1vKSkge1xuICAgICAgdGhpcy5fX3JvdGF0aW9uR2l6bW8uaXNWaXNpYmxlID0gZmFsc2U7XG4gICAgICB0aGlzLl9fdW5yZWdpc3RlclRyYW5zZm9ybUdpem1vT3duZXJJZk5lZWRlZCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2aXNpYmlsaXR5IHN0YXRlIG9mIHRoZSByb3RhdGlvbiBnaXptby5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgcm90YXRpb24gZ2l6bW8gaXMgdmlzaWJsZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBnZXQgaXNSb3RhdGlvbkdpem1vVmlzaWJsZSgpIHtcbiAgICBpZiAoSXMuZXhpc3QodGhpcy5fX3JvdGF0aW9uR2l6bW8pKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX3JvdGF0aW9uR2l6bW8uaXNWaXNpYmxlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmlzaWJpbGl0eSBvZiB0aGUgc2NhbGUgZ2l6bW8uXG4gICAqIEBwYXJhbSBmbGcgLSBUcnVlIHRvIHNob3cgdGhlIHNjYWxlIGdpem1vLCBmYWxzZSB0byBoaWRlIGl0XG4gICAqL1xuICBzZXQgaXNTY2FsZUdpem1vVmlzaWJsZShmbGc6IGJvb2xlYW4pIHtcbiAgICBpZiAoZmxnKSB7XG4gICAgICB0aGlzLl9faGFzR2l6bW9zID0gdHJ1ZTtcbiAgICAgIGlmIChJcy5ub3QuZGVmaW5lZCh0aGlzLl9fc2NhbGVHaXptbykpIHtcbiAgICAgICAgdGhpcy5fX3NjYWxlR2l6bW8gPSBuZXcgKF9nZXRHaXptb0NsYXNzKCdzY2FsZScpKSh0aGlzLmVudGl0eS5lbmdpbmUsIHRoaXMuZW50aXR5KTtcbiAgICAgICAgdGhpcy5fX3NjYWxlR2l6bW8uX3NldHVwKCk7XG4gICAgICB9XG4gICAgICB0aGlzLl9fc2NhbGVHaXptby5pc1Zpc2libGUgPSB0cnVlO1xuICAgICAgdGhpcy5fX3JlZ2lzdGVyVHJhbnNmb3JtR2l6bW9Pd25lcigpO1xuICAgICAgaWYgKHRoaXMuX19zY2FsZUdpem1vLmlzU2V0dXApIHtcbiAgICAgICAgdGhpcy5fX3NjYWxlR2l6bW8uX3VwZGF0ZSgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoSXMuZXhpc3QodGhpcy5fX3NjYWxlR2l6bW8pKSB7XG4gICAgICAgIHRoaXMuX19zY2FsZUdpem1vLmlzVmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9fdW5yZWdpc3RlclRyYW5zZm9ybUdpem1vT3duZXJJZk5lZWRlZCgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2aXNpYmlsaXR5IHN0YXRlIG9mIHRoZSBzY2FsZSBnaXptby5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgc2NhbGUgZ2l6bW8gaXMgdmlzaWJsZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBnZXQgaXNTY2FsZUdpem1vVmlzaWJsZSgpIHtcbiAgICBpZiAoSXMuZXhpc3QodGhpcy5fX3NjYWxlR2l6bW8pKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX3NjYWxlR2l6bW8uaXNWaXNpYmxlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmlzaWJpbGl0eSBvZiB0aGUgam9pbnQgZ2l6bW8gdGhhdCB2aXN1YWxpemVzIHNrZWxldGFsIGpvaW50cy5cbiAgICogQHBhcmFtIGZsZyAtIFRydWUgdG8gc2hvdyB0aGUgam9pbnQgZ2l6bW8sIGZhbHNlIHRvIGhpZGUgaXRcbiAgICovXG4gIHNldCBpc0pvaW50R2l6bW9WaXNpYmxlKGZsZzogYm9vbGVhbikge1xuICAgIGlmIChmbGcgJiYgdGhpcy5pc0pvaW50KCkpIHtcbiAgICAgIHRoaXMuX19oYXNHaXptb3MgPSB0cnVlO1xuICAgICAgaWYgKElzLm5vdC5kZWZpbmVkKHRoaXMuX19qb2ludEdpem1vKSkge1xuICAgICAgICB0aGlzLl9fam9pbnRHaXptbyA9IG5ldyAoX2dldEdpem1vQ2xhc3MoJ2pvaW50JykpKHRoaXMuZW50aXR5LmVuZ2luZSwgdGhpcy5lbnRpdHkpO1xuICAgICAgICB0aGlzLl9fam9pbnRHaXptby5fc2V0dXAoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX19qb2ludEdpem1vLmlzVmlzaWJsZSA9IHRydWU7XG4gICAgfSBlbHNlIGlmIChJcy5leGlzdCh0aGlzLl9fam9pbnRHaXptbykpIHtcbiAgICAgIHRoaXMuX19qb2ludEdpem1vLmlzVmlzaWJsZSA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2aXNpYmlsaXR5IHN0YXRlIG9mIHRoZSBqb2ludCBnaXptby5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgam9pbnQgZ2l6bW8gaXMgdmlzaWJsZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBnZXQgaXNKb2ludEdpem1vVmlzaWJsZSgpIHtcbiAgICBpZiAoSXMuZXhpc3QodGhpcy5fX2pvaW50R2l6bW8pKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX2pvaW50R2l6bW8uaXNWaXNpYmxlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhbGwgdG9wLWxldmVsIHNjZW5lIGdyYXBoIGNvbXBvbmVudHMgKG5vZGVzIHdpdGhvdXQgcGFyZW50cykuXG4gICAqIEByZXR1cm5zIEFuIGFycmF5IG9mIHNjZW5lIGdyYXBoIGNvbXBvbmVudHMgdGhhdCBhcmUgYXQgdGhlIHJvb3QgbGV2ZWxcbiAgICovXG4gIHN0YXRpYyBnZXRUb3BMZXZlbENvbXBvbmVudHMoKTogU2NlbmVHcmFwaENvbXBvbmVudFtdIHtcbiAgICByZXR1cm4gU2NlbmVHcmFwaENvbXBvbmVudC5fX3NjZW5lR3JhcGhzXG4gICAgICAubWFwKHNnUmVmID0+IHNnUmVmLmRlcmVmKCkpXG4gICAgICAuZmlsdGVyKChzZzogU2NlbmVHcmFwaENvbXBvbmVudCB8IHVuZGVmaW5lZCk6IHNnIGlzIFNjZW5lR3JhcGhDb21wb25lbnQgPT4ge1xuICAgICAgICBpZiAoc2cgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHJldHVybiBzZy5pc1RvcExldmVsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGlzIG5vZGUgcmVwcmVzZW50cyBhIHNrZWxldGFsIGpvaW50LlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoaXMgaXMgYSBqb2ludCAoaGFzIGEgdmFsaWQgam9pbnQgaW5kZXgpLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGlzSm9pbnQoKSB7XG4gICAgaWYgKHRoaXMuam9pbnRJbmRleCA+PSAwKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNvbXBvbmVudCB0eXBlIGlkZW50aWZpZXIgZm9yIFNjZW5lR3JhcGhDb21wb25lbnQuXG4gICAqIEByZXR1cm5zIFRoZSBjb21wb25lbnQgdHlwZSBJRFxuICAgKi9cbiAgLyoqXG4gICAqIEdldHMgdGhlIHZlcnNpb24gY291bnRlciBvZiB0aGUgc2NlbmUgZ3JhcGggaGllcmFyY2h5LlxuICAgKiBJdCBjaGFuZ2VzIHdoZW5ldmVyIGEgcGFyZW50LWNoaWxkIHJlbGF0aW9uc2hpcCBvZiBhbnkgU2NlbmVHcmFwaENvbXBvbmVudCBtYXkgaGF2ZSBjaGFuZ2VkLlxuICAgKiBAcmV0dXJucyBUaGUgaGllcmFyY2h5IHZlcnNpb24gY291bnRlclxuICAgKi9cbiAgc3RhdGljIGdldCBoaWVyYXJjaHlWZXJzaW9uKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIFNjZW5lR3JhcGhDb21wb25lbnQuX19oaWVyYXJjaHlWZXJzaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkdmFuY2VzIHRoZSBoaWVyYXJjaHkgdmVyc2lvbiBhZnRlciBhIHBhcmVudC1jaGlsZCByZWxhdGlvbnNoaXAgY2hhbmdlZC5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fYnVtcEhpZXJhcmNoeVZlcnNpb24oKTogdm9pZCB7XG4gICAgU2NlbmVHcmFwaENvbXBvbmVudC5fX2hpZXJhcmNoeVZlcnNpb24rKztcbiAgICBTY2VuZUdyYXBoQ29tcG9uZW50Ll9fYWFiYkRpcnR5Q2hhaW5FcG9jaCsrO1xuICB9XG5cbiAgc3RhdGljIGdldCBjb21wb25lbnRUSUQoKSB7XG4gICAgcmV0dXJuIFdlbGxLbm93bkNvbXBvbmVudFRJRHMuU2NlbmVHcmFwaENvbXBvbmVudFRJRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb21wb25lbnQgdHlwZSBpZGVudGlmaWVyIGZvciB0aGlzIGluc3RhbmNlLlxuICAgKiBAcmV0dXJucyBUaGUgY29tcG9uZW50IHR5cGUgSURcbiAgICovXG4gIGdldCBjb21wb25lbnRUSUQoKTogQ29tcG9uZW50VElEIHtcbiAgICByZXR1cm4gV2VsbEtub3duQ29tcG9uZW50VElEcy5TY2VuZUdyYXBoQ29tcG9uZW50VElEO1xuICB9XG5cbiAgLyoqXG4gICAqIE1hcmtzIHRoZSB3b3JsZCBtYXRyaXggcmVzdCBzdGF0ZSBhcyBkaXJ0eSBhbmQgcHJvcGFnYXRlcyB0byBjaGlsZHJlbi5cbiAgICovXG4gIHNldFdvcmxkTWF0cml4UmVzdERpcnR5KCkge1xuICAgIHRoaXMubWF0cml4UmVzdElubmVyO1xuICAgIHRoaXMuc2V0V29ybGRNYXRyaXhSZXN0RGlydHlSZWN1cnNpdmVseSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlY3Vyc2l2ZWx5IG1hcmtzIHRoZSB3b3JsZCBtYXRyaXggcmVzdCBzdGF0ZSBhcyBkaXJ0eSBmb3IgdGhpcyBub2RlIGFuZCBhbGwgY2hpbGRyZW4uXG4gICAqL1xuICBzZXRXb3JsZE1hdHJpeFJlc3REaXJ0eVJlY3Vyc2l2ZWx5KCkge1xuICAgIHRoaXMuX19pc1dvcmxkTWF0cml4UmVzdFVwVG9EYXRlID0gZmFsc2U7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiB0aGlzLmNoaWxkcmVuKSB7XG4gICAgICBjaGlsZC5zZXRXb3JsZE1hdHJpeFJlc3REaXJ0eVJlY3Vyc2l2ZWx5KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1vbm90b25pY2FsbHkgaW5jcmVhc2luZyB3b3JsZCBtYXRyaXggdmVyc2lvbiBvZiB0aGlzIG5vZGUuXG4gICAqIFRoZSB2YWx1ZSBjaGFuZ2VzIHdoZW5ldmVyIHRoZSBub2RlIGlzIG1hcmtlZCBkaXJ0eSwgc28gc3VtbWluZyBpdCBvdmVyIGEgc2V0IG9mIG5vZGVzIGRldGVjdHNcbiAgICogd2hldGhlciBhbnkgb2YgdGhlbSBtYXkgbmVlZCB0byBiZSByZWNvbXB1dGVkLlxuICAgKiBAcmV0dXJucyBUaGUgd29ybGQgbWF0cml4IHZlcnNpb25cbiAgICovXG4gIGdldCB3b3JsZE1hdHJpeFZlcnNpb24oKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fX3dvcmxkTWF0cml4VmVyc2lvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgd29ybGQgbWF0cml4IG9mIHRoZSBwcmV2aW91cyBmcmFtZSwgdXNlZCBieSB0aGUgbW90aW9uIHZlY3RvcnMgb2YgdGVtcG9yYWwgYW50aS1hbGlhc2luZy5cbiAgICogSXQgaXMgcGFydCBvZiB0aGUgR1BVIGluc3RhbmNlIGRhdGEgKGBnZXRfcHJldmlvdXNXb3JsZE1hdHJpeGAgaW4gdGhlIHNoYWRlcnMpIGFuZCBpcyBvbmx5IGtlcHQgdXAgdG8gZGF0ZVxuICAgKiB3aGlsZSB0ZW1wb3JhbCBhbnRpLWFsaWFzaW5nIGlzIGVuYWJsZWQuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZ2V0IF9wcmV2aW91c1dvcmxkTWF0cml4SW5uZXIoKTogTXV0YWJsZU1hdHJpeDQ0IHtcbiAgICByZXR1cm4gdGhpcy5fcHJldmlvdXNXb3JsZE1hdHJpeDtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgd29ybGQgbWF0cml4IGFzIGl0IHdhcyBsYXN0IGNvbXB1dGVkICh0aGUgdmFsdWUgaW4gdGhlIEdQVSBpbnN0YW5jZSBkYXRhKSwgd2l0aG91dCByZWNvbXB1dGluZyBhIGRpcnR5XG4gICAqIG1hdHJpeC5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBnZXQgX2xhc3RDb21wdXRlZFdvcmxkTWF0cml4SW5uZXIoKTogTXV0YWJsZU1hdHJpeDQ0IHtcbiAgICByZXR1cm4gdGhpcy5fd29ybGRNYXRyaXg7XG4gIH1cblxuICAvKipcbiAgICogTWFya3MgdGhlIHdvcmxkIG1hdHJpeCBhcyBkaXJ0eSBhbmQgcHJvcGFnYXRlcyBjaGFuZ2VzIHVwIHRoZSBoaWVyYXJjaHkuXG4gICAqL1xuICBzZXRXb3JsZE1hdHJpeERpcnR5KCkge1xuICAgIHRoaXMuc2V0V29ybGRNYXRyaXhEaXJ0eVJlY3Vyc2l2ZWx5KCk7XG4gICAgLy8gR2l6bW8gY2hpbGRyZW4gYXJlIGV4Y2x1ZGVkIGZyb20gdGhlIHBhcmVudCdzIG1lcmdlZCBBQUJCLCBzbyBtb3ZpbmcgdGhlbSBtdXN0IG5vdCBpbnZhbGlkYXRlIGl0LlxuICAgIC8vIE90aGVyd2lzZSB0aGUgQUFCQiBnaXptbyBpbnZhbGlkYXRlcyBpdHMgdGFyZ2V0J3MgQUFCQiBpbiBpdHMgb3duIHVwZGF0ZSBhbmQgZm9yY2VzIGEgZnVsbFxuICAgIC8vIHJlY29tcHV0YXRpb24gb2YgdGhlIG1lcmdlZCBBQUJCIG9mIHRoZSB3aG9sZSBzdWJ0cmVlIG9uIGV2ZXJ5IGZyYW1lIHRoZSBzY2VuZSBpcyB1cGRhdGVkLlxuICAgIGlmICghdGhpcy5fX2lzR2l6bW9DaGlsZCkge1xuICAgICAgdGhpcy5wYXJlbnQ/LnNldFdvcmxkQUFCQkRpcnR5UGFyZW50UmVjdXJzaXZlbHkoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTWFya3MgdGhlIHdvcmxkIG1hdHJpeCBhcyBkaXJ0eSB3aXRob3V0IGNoZWNraW5nIGlmIHRoZSBBQUJCIGlzIGRpcnR5LlxuICAgKi9cbiAgc2V0V29ybGRNYXRyaXhEaXJ0eVdpdGhvdXRBQUJCRGlydHkoKSB7XG4gICAgdGhpcy5zZXRXb3JsZE1hdHJpeERpcnR5UmVjdXJzaXZlbHkoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWN1cnNpdmVseSBtYXJrcyB0aGUgd29ybGQgbWF0cml4IGFzIGRpcnR5IGZvciB0aGlzIG5vZGUgYW5kIGFsbCBjaGlsZHJlbi5cbiAgICovXG4gIHNldFdvcmxkTWF0cml4RGlydHlSZWN1cnNpdmVseSgpIHtcbiAgICBpZiAoXG4gICAgICAhdGhpcy5fX2lzV29ybGRNYXRyaXhVcFRvRGF0ZSAmJlxuICAgICAgIXRoaXMuX19pc05vcm1hbE1hdHJpeFVwVG9EYXRlICYmXG4gICAgICAhdGhpcy5fX2lzV29ybGRSb3RhdGlvblVwVG9EYXRlICYmXG4gICAgICB0aGlzLl9faXNXb3JsZEFBQkJEaXJ0eSAmJlxuICAgICAgdGhpcy5fX2lzV29ybGRBQUJCRGlydHlXaXRoU2tlbGV0YWxcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9fd29ybGRNYXRyaXhWZXJzaW9uKys7XG4gICAgdGhpcy5fX2lzV29ybGRNYXRyaXhVcFRvRGF0ZSA9IGZhbHNlO1xuICAgIHRoaXMuX19pc05vcm1hbE1hdHJpeFVwVG9EYXRlID0gZmFsc2U7XG4gICAgdGhpcy5fX2lzV29ybGRSb3RhdGlvblVwVG9EYXRlID0gZmFsc2U7XG4gICAgdGhpcy5fX2lzV29ybGRBQUJCRGlydHkgPSB0cnVlO1xuICAgIHRoaXMuX19pc1dvcmxkQUFCQkRpcnR5V2l0aFNrZWxldGFsID0gdHJ1ZTtcblxuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZHJlbikge1xuICAgICAgY2hpbGQuc2V0V29ybGRNYXRyaXhEaXJ0eVJlY3Vyc2l2ZWx5KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE1hcmtzIHRoZSB3b3JsZCBBQUJCIG9mIHRoaXMgbm9kZSBhbmQgYWxsIG9mIGl0cyBhbmNlc3RvcnMgYXMgZGlydHkuXG4gICAqXG4gICAqIFRoZSB3YWxrIHN0b3BzIGF0IHRoZSBmaXJzdCBub2RlIGFscmVhZHkgbWFya2VkIGluIHRoZSBjdXJyZW50IGVwb2NoOiB0aGF0IG5vZGUgYW5kIGFsbCBvZiBpdHNcbiAgICogYW5jZXN0b3JzIGFyZSBrbm93biB0byBiZSBkaXJ0eS4gTWFueSBub2RlcyBvZiB0aGUgc2FtZSBzdWJ0cmVlIGNoYW5naW5nIGluIG9uZSBmcmFtZSAoZS5nLiBldmVyeVxuICAgKiBqb2ludCBvZiBhbiBhbmltYXRlZCBza2VsZXRvbikgdGhlcmVmb3JlIGNvc3QgTyhudW1iZXIgb2YgZGlzdGluY3QgYW5jZXN0b3JzKSBpbiB0b3RhbCBpbnN0ZWFkIG9mXG4gICAqIE8oY2hhbmdlZCBub2RlcyAqIGRlcHRoKS5cbiAgICovXG4gIHNldFdvcmxkQUFCQkRpcnR5UGFyZW50UmVjdXJzaXZlbHkoKSB7XG4gICAgY29uc3QgZXBvY2ggPSBTY2VuZUdyYXBoQ29tcG9uZW50Ll9fYWFiYkRpcnR5Q2hhaW5FcG9jaDtcbiAgICBsZXQgbm9kZTogU2NlbmVHcmFwaENvbXBvbmVudCB8IHVuZGVmaW5lZCA9IHRoaXM7XG4gICAgd2hpbGUgKG5vZGUgIT0gbnVsbCkge1xuICAgICAgbm9kZS5fX2lzV29ybGRBQUJCRGlydHkgPSB0cnVlO1xuICAgICAgbm9kZS5fX2lzV29ybGRBQUJCRGlydHlXaXRoU2tlbGV0YWwgPSB0cnVlO1xuICAgICAgaWYgKG5vZGUuX19hYWJiRGlydHlDaGFpbkVwb2NoID09PSBlcG9jaCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBub2RlLl9fYWFiYkRpcnR5Q2hhaW5FcG9jaCA9IGVwb2NoO1xuICAgICAgbm9kZSA9IG5vZGUuX19wYXJlbnQ7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBTY2VuZUdyYXBoIGNvbXBvbmVudCBhcyBhIGNoaWxkIG9mIHRoaXMgbm9kZS5cbiAgICogQHBhcmFtIHNnIC0gVGhlIFNjZW5lR3JhcGggY29tcG9uZW50IHRvIGFkZCBhcyBhIGNoaWxkXG4gICAqIEBwYXJhbSBrZWVwUG9zZUluV29ybGRTcGFjZSAtIFdoZXRoZXIgdG8ga2VlcCB0aGUgY2hpbGQncyB3b3JsZCBwb3NlXG4gICAqL1xuICBwdWJsaWMgYWRkQ2hpbGQoc2c6IFNjZW5lR3JhcGhDb21wb25lbnQsIGtlZXBQb3NlSW5Xb3JsZFNwYWNlID0gZmFsc2UpOiB2b2lkIHtcbiAgICAvLyBXaGVuIHdlIG5lZWQgdG8ga2VlcCB0aGUgY2hpbGQncyB3b3JsZCBwb3NlLCBjYXB0dXJlIGl0cyB3b3JsZCB0cmFuc2Zvcm0gYmVmb3JlIHJlcGFyZW50aW5nLlxuICAgIGxldCB3b3JsZE1hdHJpeEJlZm9yZVJlcGFyZW50OiBNdXRhYmxlTWF0cml4NDQgfCB1bmRlZmluZWQ7XG5cbiAgICBpZiAoa2VlcFBvc2VJbldvcmxkU3BhY2UpIHtcbiAgICAgIHNnLmxvZ2ljRm9yY2UoKTtcbiAgICAgIHdvcmxkTWF0cml4QmVmb3JlUmVwYXJlbnQgPSBzZy5tYXRyaXg7XG4gICAgfVxuXG4gICAgaWYgKElzLmV4aXN0KHNnLl9fcGFyZW50KSkge1xuICAgICAgc2cuX19wYXJlbnQucmVtb3ZlQ2hpbGQoc2cpO1xuICAgIH1cbiAgICBzZy5fX3BhcmVudCA9IHRoaXM7XG4gICAgdGhpcy5fX2NoaWxkcmVuLnB1c2goc2cpO1xuICAgIFNjZW5lR3JhcGhDb21wb25lbnQuX19idW1wSGllcmFyY2h5VmVyc2lvbigpO1xuICAgIHRoaXMuX19hZGp1c3RQaHlzaWNzQ29tcG9uZW50Q291bnRJblN1YnRyZWUoc2cuX19waHlzaWNzQ29tcG9uZW50Q291bnRJblN1YnRyZWUpO1xuXG4gICAgaWYgKGtlZXBQb3NlSW5Xb3JsZFNwYWNlKSB7XG4gICAgICBpZiAoSXMuZXhpc3Qod29ybGRNYXRyaXhCZWZvcmVSZXBhcmVudCkpIHtcbiAgICAgICAgc2cubWF0cml4ID0gd29ybGRNYXRyaXhCZWZvcmVSZXBhcmVudDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzZy5zZXRXb3JsZE1hdHJpeERpcnR5UmVjdXJzaXZlbHkoKTtcbiAgICAvLyBUaGUgbmV3IGNoaWxkIGNvbnRyaWJ1dGVzIHRvIHRoZSBtZXJnZWQgQUFCQiBvZiB0aGlzIG5vZGUgYW5kIGl0cyBhbmNlc3RvcnMuXG4gICAgdGhpcy5zZXRXb3JsZEFBQkJEaXJ0eVBhcmVudFJlY3Vyc2l2ZWx5KCk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhIGNoaWxkIFNjZW5lR3JhcGggY29tcG9uZW50IGZyb20gdGhpcyBub2RlLlxuICAgKiBAcGFyYW0gc2cgLSBUaGUgU2NlbmVHcmFwaCBjb21wb25lbnQgdG8gcmVtb3ZlXG4gICAqL1xuICBwdWJsaWMgcmVtb3ZlQ2hpbGQoc2c6IFNjZW5lR3JhcGhDb21wb25lbnQpOiB2b2lkIHtcbiAgICBjb25zdCBpbmRleCA9IHRoaXMuX19jaGlsZHJlbi5pbmRleE9mKHNnKTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgdGhpcy5fX2FkanVzdFBoeXNpY3NDb21wb25lbnRDb3VudEluU3VidHJlZSgtc2cuX19waHlzaWNzQ29tcG9uZW50Q291bnRJblN1YnRyZWUpO1xuICAgICAgdGhpcy5fX2NoaWxkcmVuLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICAgIGNvbnN0IGdpem1vSW5kZXggPSB0aGlzLl9fZ2l6bW9DaGlsZHJlbi5pbmRleE9mKHNnKTtcbiAgICBpZiAoZ2l6bW9JbmRleCA+PSAwKSB7XG4gICAgICB0aGlzLl9fZ2l6bW9DaGlsZHJlbi5zcGxpY2UoZ2l6bW9JbmRleCwgMSk7XG4gICAgfVxuICAgIHNnLl9fcGFyZW50ID0gdW5kZWZpbmVkO1xuICAgIHNnLl9faXNHaXptb0NoaWxkID0gZmFsc2U7XG4gICAgU2NlbmVHcmFwaENvbXBvbmVudC5fX2J1bXBIaWVyYXJjaHlWZXJzaW9uKCk7XG4gICAgLy8gVGhlIGRldGFjaGVkIHN1YnRyZWUgbm8gbG9uZ2VyIGluaGVyaXRzIHRoaXMgbm9kZSdzIHdvcmxkIG1hdHJpeC5cbiAgICBzZy5zZXRXb3JsZE1hdHJpeERpcnR5UmVjdXJzaXZlbHkoKTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgLy8gVGhlIHJlbW92ZWQgY2hpbGQgbm8gbG9uZ2VyIGNvbnRyaWJ1dGVzIHRvIHRoZSBtZXJnZWQgQUFCQiBvZiB0aGlzIG5vZGUgYW5kIGl0cyBhbmNlc3RvcnMuXG4gICAgICB0aGlzLnNldFdvcmxkQUFCQkRpcnR5UGFyZW50UmVjdXJzaXZlbHkoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIFNjZW5lR3JhcGggY29tcG9uZW50IGFzIGEgZ2l6bW8gY2hpbGQgKGludGVybmFsIHVzZSBvbmx5KS5cbiAgICogQHBhcmFtIHNnIC0gVGhlIFNjZW5lR3JhcGggY29tcG9uZW50IG9mIGEgZ2l6bW8gdG8gYWRkXG4gICAqL1xuICBfYWRkR2l6bW9DaGlsZChzZzogU2NlbmVHcmFwaENvbXBvbmVudCk6IHZvaWQge1xuICAgIHNnLl9fcGFyZW50ID0gdGhpcztcbiAgICBzZy5fX2lzR2l6bW9DaGlsZCA9IHRydWU7XG4gICAgdGhpcy5fX2dpem1vQ2hpbGRyZW4ucHVzaChzZyk7XG4gICAgU2NlbmVHcmFwaENvbXBvbmVudC5fX2J1bXBIaWVyYXJjaHlWZXJzaW9uKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoaXMgbm9kZSBpcyBhdCB0aGUgdG9wIGxldmVsIChoYXMgbm8gcGFyZW50KS5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGlzIGlzIGEgcm9vdCBub2RlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGdldCBpc1RvcExldmVsKCkge1xuICAgIHJldHVybiB0aGlzLl9fcGFyZW50ID09IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY2hpbGQgc2NlbmUgZ3JhcGggY29tcG9uZW50cyBvZiB0aGlzIG5vZGUuXG4gICAqIEByZXR1cm5zIEFuIGFycmF5IG9mIGNoaWxkIHNjZW5lIGdyYXBoIGNvbXBvbmVudHNcbiAgICovXG4gIGdldCBjaGlsZHJlbigpIHtcbiAgICByZXR1cm4gdGhpcy5fX2NoaWxkcmVuO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHBhcmVudCBzY2VuZSBncmFwaCBjb21wb25lbnQgb2YgdGhpcyBub2RlLlxuICAgKiBAcmV0dXJucyBUaGUgcGFyZW50IGNvbXBvbmVudCwgb3IgdW5kZWZpbmVkIGlmIHRoaXMgaXMgYSByb290IG5vZGVcbiAgICovXG4gIGdldCBwYXJlbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19wYXJlbnQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW50ZXJuYWwgd29ybGQgbWF0cml4IChtdXRhYmxlIHJlZmVyZW5jZSkuXG4gICAqIEByZXR1cm5zIFRoZSBpbnRlcm5hbCB3b3JsZCBtYXRyaXhcbiAgICovXG4gIGdldCBtYXRyaXhJbm5lcigpIHtcbiAgICBpZiAoIXRoaXMuX19pc1dvcmxkTWF0cml4VXBUb0RhdGUpIHtcbiAgICAgIHRoaXMuX19jYWxjV29ybGRNYXRyaXhSZWN1cnNpdmVseSgpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl93b3JsZE1hdHJpeDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgY2xvbmUgb2YgdGhlIHdvcmxkIG1hdHJpeC5cbiAgICogQHJldHVybnMgQSBjbG9uZWQgY29weSBvZiB0aGUgd29ybGQgbWF0cml4XG4gICAqL1xuICBnZXQgbWF0cml4KCkge1xuICAgIHJldHVybiB0aGlzLm1hdHJpeElubmVyLmNsb25lKCk7XG4gIH1cblxuICBzZXRNYXRyaXhXaXRob3V0UGh5c2ljcyhtYXRyaXg6IElNYXRyaXg0NCkge1xuICAgIGlmIChJcy5ub3QuZXhpc3QodGhpcy5fX3BhcmVudCkpIHtcbiAgICAgIHRoaXMuZW50aXR5LmdldFRyYW5zZm9ybSgpLmxvY2FsTWF0cml4V2l0aG91dFBoeXNpY3MgPSBtYXRyaXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXMuX19wYXJlbnQ7XG4gICAgICBjb25zdCBpbnZNYXRyaXggPSBNYXRyaXg0NC5pbnZlcnRUbyhwYXJlbnQubWF0cml4SW5uZXIsIFNjZW5lR3JhcGhDb21wb25lbnQuX190bXBfbWF0NF80KTtcbiAgICAgIHRoaXMuZW50aXR5LmdldFRyYW5zZm9ybSgpLmxvY2FsTWF0cml4V2l0aG91dFBoeXNpY3MgPSBNYXRyaXg0NC5tdWx0aXBseVRvKFxuICAgICAgICBpbnZNYXRyaXgsXG4gICAgICAgIG1hdHJpeCxcbiAgICAgICAgU2NlbmVHcmFwaENvbXBvbmVudC5fX3RtcF9tYXQ0XzNcbiAgICAgICkuY2xvbmUoKTtcbiAgICB9XG4gIH1cblxuICBzZXRNYXRyaXhUb1BoeXNpY3MobWF0cml4OiBJTWF0cml4NDQpIHtcbiAgICB0aGlzLl9fc2V0TWF0cml4VG9Pd25QaHlzaWNzKG1hdHJpeCwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgdGhpcy5fX3N5bmNEZXNjZW5kYW50UGh5c2ljc1RyYW5zZm9ybXModHJ1ZSwgdHJ1ZSwgdHJ1ZSk7XG4gIH1cblxuICBwcml2YXRlIF9fc2V0TWF0cml4VG9Pd25QaHlzaWNzKFxuICAgIG1hdHJpeDogSU1hdHJpeDQ0LFxuICAgIHVwZGF0ZVBvc2l0aW9uOiBib29sZWFuLFxuICAgIHVwZGF0ZVJvdGF0aW9uOiBib29sZWFuLFxuICAgIHVwZGF0ZVNjYWxlOiBib29sZWFuXG4gICkge1xuICAgIGNvbnN0IHBoeXNpY3NDb21wb25lbnQgPSB0aGlzLmVudGl0eS50cnlUb0dldFBoeXNpY3MoKTtcbiAgICBpZiAocGh5c2ljc0NvbXBvbmVudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAocGh5c2ljc0NvbXBvbmVudC5zdHJhdGVneSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnN0IHN0cmF0ZWd5ID0gcGh5c2ljc0NvbXBvbmVudC5zdHJhdGVneTtcbiAgICAgICAgaWYgKHVwZGF0ZVJvdGF0aW9uKSB7XG4gICAgICAgICAgY29uc3Qgd29ybGRSb3RhdGlvbiA9IHRoaXMuZ2V0UXVhdGVybmlvblJlY3Vyc2l2ZWx5VG8oU2NlbmVHcmFwaENvbXBvbmVudC5fX3RtcF9xdWF0XzMpO1xuICAgICAgICAgIGlmIChzdHJhdGVneS5zZXRSb3RhdGlvbiAhPSBudWxsKSB7XG4gICAgICAgICAgICBzdHJhdGVneS5zZXRSb3RhdGlvbih3b3JsZFJvdGF0aW9uKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHN0cmF0ZWd5LnNldEV1bGVyQW5nbGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgc3RyYXRlZ3kuc2V0RXVsZXJBbmdsZSh3b3JsZFJvdGF0aW9uLnRvRXVsZXJBbmdsZXNUbyhTY2VuZUdyYXBoQ29tcG9uZW50Ll9fdG1wX2V1bGVyKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh1cGRhdGVQb3NpdGlvbiAmJiBzdHJhdGVneS5zZXRQb3NpdGlvbiAhPSBudWxsKSB7XG4gICAgICAgICAgc3RyYXRlZ3kuc2V0UG9zaXRpb24obWF0cml4LmdldFRyYW5zbGF0ZVRvKFNjZW5lR3JhcGhDb21wb25lbnQuX190bXBfdHJhbnNsYXRlKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHVwZGF0ZVNjYWxlICYmIHN0cmF0ZWd5LnNldFNjYWxlICE9IG51bGwpIHtcbiAgICAgICAgICBzdHJhdGVneS5zZXRTY2FsZSh0aGlzLl9nZXRQaHlzaWNzV29ybGRTY2FsZShtYXRyaXgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX19zeW5jRGVzY2VuZGFudFBoeXNpY3NUcmFuc2Zvcm1zKHVwZGF0ZVBvc2l0aW9uOiBib29sZWFuLCB1cGRhdGVSb3RhdGlvbjogYm9vbGVhbiwgdXBkYXRlU2NhbGU6IGJvb2xlYW4pIHtcbiAgICBjb25zdCBvd25QaHlzaWNzQ29tcG9uZW50Q291bnQgPSB0aGlzLmVudGl0eS50cnlUb0dldFBoeXNpY3MoKSA9PT0gdW5kZWZpbmVkID8gMCA6IDE7XG4gICAgaWYgKHRoaXMuX19waHlzaWNzQ29tcG9uZW50Q291bnRJblN1YnRyZWUgPT09IG93blBoeXNpY3NDb21wb25lbnRDb3VudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFRyYW5zZm9ybUNvbXBvbmVudCBkaXJ0aWVzIG1hdHJpY2VzIGR1cmluZyBpdHMgbG9naWMgc3RhZ2UuIE1hdGVyaWFsaXplIHRoZVxuICAgIC8vIGN1cnJlbnQgY2FjaGUgZmlyc3Qgc28gZGlydHkgcHJvcGFnYXRpb24gcmVhY2hlcyBldmVyeSBkZXNjZW5kYW50IG5vdy5cbiAgICB0aGlzLm1hdHJpeElubmVyO1xuICAgIHRoaXMuc2V0V29ybGRNYXRyaXhEaXJ0eSgpO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5fX2NoaWxkcmVuKSB7XG4gICAgICBpZiAoIWNoaWxkLnRvTWFrZVdvcmxkTWF0cml4VGhlU2FtZUFzTG9jYWxNYXRyaXggJiYgY2hpbGQuX19waHlzaWNzQ29tcG9uZW50Q291bnRJblN1YnRyZWUgPiAwKSB7XG4gICAgICAgIGNoaWxkLl9fc3luY1BoeXNpY3NUcmFuc2Zvcm1SZWN1cnNpdmVseSh1cGRhdGVQb3NpdGlvbiwgdXBkYXRlUm90YXRpb24sIHVwZGF0ZVNjYWxlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9fc3luY1BoeXNpY3NUcmFuc2Zvcm1SZWN1cnNpdmVseSh1cGRhdGVQb3NpdGlvbjogYm9vbGVhbiwgdXBkYXRlUm90YXRpb246IGJvb2xlYW4sIHVwZGF0ZVNjYWxlOiBib29sZWFuKSB7XG4gICAgaWYgKHRoaXMuX19waHlzaWNzQ29tcG9uZW50Q291bnRJblN1YnRyZWUgPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fX3NldE1hdHJpeFRvT3duUGh5c2ljcyh0aGlzLm1hdHJpeElubmVyLCB1cGRhdGVQb3NpdGlvbiwgdXBkYXRlUm90YXRpb24sIHVwZGF0ZVNjYWxlKTtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHRoaXMuX19jaGlsZHJlbikge1xuICAgICAgaWYgKCFjaGlsZC50b01ha2VXb3JsZE1hdHJpeFRoZVNhbWVBc0xvY2FsTWF0cml4ICYmIGNoaWxkLl9fcGh5c2ljc0NvbXBvbmVudENvdW50SW5TdWJ0cmVlID4gMCkge1xuICAgICAgICBjaGlsZC5fX3N5bmNQaHlzaWNzVHJhbnNmb3JtUmVjdXJzaXZlbHkodXBkYXRlUG9zaXRpb24sIHVwZGF0ZVJvdGF0aW9uLCB1cGRhdGVTY2FsZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlY29yZHMgdGhhdCB0aGlzIGVudGl0eSBhY3F1aXJlZCBhIFBoeXNpY3NDb21wb25lbnQuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX29uUGh5c2ljc0NvbXBvbmVudEFkZGVkKCk6IHZvaWQge1xuICAgIHRoaXMuX19hZGp1c3RQaHlzaWNzQ29tcG9uZW50Q291bnRJblN1YnRyZWUoMSk7XG4gIH1cblxuICAvKipcbiAgICogUmVjb3JkcyB0aGF0IHRoaXMgZW50aXR5IGxvc3QgaXRzIFBoeXNpY3NDb21wb25lbnQuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX29uUGh5c2ljc0NvbXBvbmVudFJlbW92ZWQoKTogdm9pZCB7XG4gICAgdGhpcy5fX2FkanVzdFBoeXNpY3NDb21wb25lbnRDb3VudEluU3VidHJlZSgtMSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoaXMgbm9kZSBvciBvbmUgb2YgaXRzIGRlc2NlbmRhbnRzIGhhcyBhIFBoeXNpY3NDb21wb25lbnQuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZ2V0IF9oYXNQaHlzaWNzQ29tcG9uZW50SW5TdWJ0cmVlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9fcGh5c2ljc0NvbXBvbmVudENvdW50SW5TdWJ0cmVlID4gMDtcbiAgfVxuXG4gIHByaXZhdGUgX19hZGp1c3RQaHlzaWNzQ29tcG9uZW50Q291bnRJblN1YnRyZWUoZGVsdGE6IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMuX19waHlzaWNzQ29tcG9uZW50Q291bnRJblN1YnRyZWUgKz0gZGVsdGE7XG5cbiAgICBjb25zdCBwYXJlbnQgPSB0aGlzLl9fcGFyZW50O1xuICAgIGlmIChwYXJlbnQ/Ll9fY2hpbGRyZW4uaW5jbHVkZXModGhpcykpIHtcbiAgICAgIHBhcmVudC5fX2FkanVzdFBoeXNpY3NDb21wb25lbnRDb3VudEluU3VidHJlZShkZWx0YSk7XG4gICAgfVxuICB9XG5cbiAgc2V0IG1hdHJpeChtYXRyaXg6IE11dGFibGVNYXRyaXg0NCkge1xuICAgIHRoaXMuc2V0TWF0cml4V2l0aG91dFBoeXNpY3MobWF0cml4KTtcbiAgICB0aGlzLnNldE1hdHJpeFRvUGh5c2ljcyhtYXRyaXgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGludGVybmFsIHdvcmxkIG1hdHJpeCBpbiByZXN0IHBvc2UgKG11dGFibGUgcmVmZXJlbmNlKS5cbiAgICogQHJldHVybnMgVGhlIGludGVybmFsIHdvcmxkIG1hdHJpeCBpbiByZXN0IHBvc2VcbiAgICovXG4gIGdldCBtYXRyaXhSZXN0SW5uZXIoKSB7XG4gICAgaWYgKCF0aGlzLl9faXNXb3JsZE1hdHJpeFJlc3RVcFRvRGF0ZSkge1xuICAgICAgdGhpcy5fX2NhbGNXb3JsZE1hdHJpeFJlc3RSZWN1cnNpdmVseSgpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl93b3JsZE1hdHJpeFJlc3Q7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIGNsb25lIG9mIHRoZSB3b3JsZCBtYXRyaXggaW4gcmVzdCBwb3NlLlxuICAgKiBAcmV0dXJucyBBIGNsb25lZCBjb3B5IG9mIHRoZSB3b3JsZCBtYXRyaXggaW4gcmVzdCBwb3NlXG4gICAqL1xuICBnZXQgbWF0cml4UmVzdCgpIHtcbiAgICByZXR1cm4gdGhpcy5tYXRyaXhSZXN0SW5uZXIuY2xvbmUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpbnRlcm5hbCBub3JtYWwgbWF0cml4IChtdXRhYmxlIHJlZmVyZW5jZSkuXG4gICAqIEByZXR1cm5zIFRoZSBpbnRlcm5hbCBub3JtYWwgbWF0cml4XG4gICAqL1xuICBnZXQgbm9ybWFsTWF0cml4SW5uZXIoKSB7XG4gICAgaWYgKCF0aGlzLl9faXNOb3JtYWxNYXRyaXhVcFRvRGF0ZSkge1xuICAgICAgTWF0cml4NDQuaW52ZXJ0VG8odGhpcy5tYXRyaXhJbm5lciwgU2NlbmVHcmFwaENvbXBvbmVudC5pbnZlcnRlZE1hdHJpeDQ0KTtcbiAgICAgIHRoaXMuX25vcm1hbE1hdHJpeC5jb3B5Q29tcG9uZW50cyhTY2VuZUdyYXBoQ29tcG9uZW50LmludmVydGVkTWF0cml4NDQudHJhbnNwb3NlKCkpO1xuICAgICAgdGhpcy5fX2lzTm9ybWFsTWF0cml4VXBUb0RhdGUgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fbm9ybWFsTWF0cml4O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGVudGl0eSB3b3JsZCBtYXRyaXggd2l0aCBza2VsZXRhbCBhbmltYXRpb24gYXBwbGllZC5cbiAgICogQHJldHVybnMgQSBjbG9uZWQgY29weSBvZiB0aGUgZW50aXR5IHdvcmxkIG1hdHJpeCB3aXRoIHNrZWxldGFsIHRyYW5zZm9ybWF0aW9uc1xuICAgKi9cbiAgZ2V0IGVudGl0eVdvcmxkV2l0aFNrZWxldGFsTWF0cml4KCk6IE11dGFibGVNYXRyaXg0NCB7XG4gICAgcmV0dXJuIHRoaXMuZW50aXR5V29ybGRNYXRyaXhXaXRoU2tlbGV0YWxJbm5lci5jbG9uZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGludGVybmFsIGVudGl0eSB3b3JsZCBtYXRyaXggd2l0aCBza2VsZXRhbCBhbmltYXRpb24gYXBwbGllZC5cbiAgICogQHJldHVybnMgVGhlIGludGVybmFsIGVudGl0eSB3b3JsZCBtYXRyaXggd2l0aCBza2VsZXRhbCB0cmFuc2Zvcm1hdGlvbnNcbiAgICovXG4gIGdldCBlbnRpdHlXb3JsZE1hdHJpeFdpdGhTa2VsZXRhbElubmVyKCk6IE11dGFibGVNYXRyaXg0NCB7XG4gICAgY29uc3Qgc2tlbGV0YWxDb21wb25lbnQgPSB0aGlzLmVudGl0eS50cnlUb0dldFNrZWxldGFsKCk7XG4gICAgaWYgKElzLmV4aXN0KHNrZWxldGFsQ29tcG9uZW50KSAmJiBza2VsZXRhbENvbXBvbmVudC5pc1dvcmxkTWF0cml4VXBkYXRlZCkge1xuICAgICAgcmV0dXJuIHNrZWxldGFsQ29tcG9uZW50LndvcmxkTWF0cml4SW5uZXI7XG4gICAgfVxuICAgIGNvbnN0IHNjZW5lR3JhcGhDb21wb25lbnQgPSB0aGlzLmVudGl0eS5nZXRTY2VuZUdyYXBoKCk7XG4gICAgcmV0dXJuIHNjZW5lR3JhcGhDb21wb25lbnQubWF0cml4SW5uZXI7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIGNsb25lIG9mIHRoZSBub3JtYWwgbWF0cml4LlxuICAgKiBAcmV0dXJucyBBIGNsb25lZCBjb3B5IG9mIHRoZSBub3JtYWwgbWF0cml4XG4gICAqL1xuICBnZXQgbm9ybWFsTWF0cml4KCkge1xuICAgIHJldHVybiB0aGlzLm5vcm1hbE1hdHJpeElubmVyLmNsb25lKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSB3b3JsZCBtYXRyaXggaXMgdXAtdG8tZGF0ZSByZWN1cnNpdmVseSB1cCB0aGUgaGllcmFyY2h5LlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSB3b3JsZCBtYXRyaXggaXMgdXAtdG8tZGF0ZSBmb3IgdGhpcyBub2RlIGFuZCBhbGwgaXRzIGFuY2VzdG9yc1xuICAgKi9cbiAgaXNXb3JsZE1hdHJpeFVwVG9EYXRlUmVjdXJzaXZlbHkoKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuX19pc1dvcmxkTWF0cml4VXBUb0RhdGUpIHtcbiAgICAgIGlmICh0aGlzLl9fcGFyZW50KSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX19wYXJlbnQuaXNXb3JsZE1hdHJpeFVwVG9EYXRlUmVjdXJzaXZlbHkoKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogUmVjdXJzaXZlbHkgY2FsY3VsYXRlcyB0aGUgd29ybGQgbWF0cml4IGZyb20gdGhpcyBub2RlIHVwIHRvIHRoZSByb290LlxuICAgKlxuICAgKiBUaGUgcmVzdWx0IGlzIG1lbW9pemVkIGludG8gYF93b3JsZE1hdHJpeGAgZm9yIGV2ZXJ5IG5vZGUgdmlzaXRlZCBieSB0aGUgcmVjdXJzaW9uLCBub3Qgb25seSB0aGVcbiAgICogbm9kZSB0aGF0IHdhcyByZXF1ZXN0ZWQuIFdpdGhvdXQgdGhlIHdyaXRlLWJhY2ssIHByb2Nlc3NpbmcgY2hpbGRyZW4gYmVmb3JlIHRoZWlyIHBhcmVudHMgd291bGRcbiAgICogcmVjb21wdXRlIHRoZSBzYW1lIGFuY2VzdG9yIG1hdHJpY2VzIG9uY2UgcGVyIGRlc2NlbmRhbnQuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBjYWNoZWQgd29ybGQgbWF0cml4IG9mIHRoaXMgbm9kZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2NhbGNXb3JsZE1hdHJpeFJlY3Vyc2l2ZWx5KCk6IE11dGFibGVNYXRyaXg0NCB7XG4gICAgaWYgKHRoaXMuX19pc1dvcmxkTWF0cml4VXBUb0RhdGUpIHtcbiAgICAgIHJldHVybiB0aGlzLl93b3JsZE1hdHJpeDtcbiAgICB9XG5cbiAgICBjb25zdCB0cmFuc2Zvcm0gPSB0aGlzLmVudGl0eS5nZXRUcmFuc2Zvcm0oKSE7XG5cbiAgICBpZiAodGhpcy5fX3BhcmVudCA9PSBudWxsIHx8IHRoaXMudG9NYWtlV29ybGRNYXRyaXhUaGVTYW1lQXNMb2NhbE1hdHJpeCkge1xuICAgICAgdHJhbnNmb3JtLmdldExvY2FsTWF0cml4SW5uZXJUbyh0aGlzLl93b3JsZE1hdHJpeCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IG1hdHJpeEZyb21BbmNlc3RvclRvUGFyZW50ID0gdGhpcy5fX3BhcmVudC5fX2NhbGNXb3JsZE1hdHJpeFJlY3Vyc2l2ZWx5KCk7XG4gICAgICB0cmFuc2Zvcm0uZ2V0TG9jYWxNYXRyaXhJbm5lclRvKFNjZW5lR3JhcGhDb21wb25lbnQuX190bXBfbWF0NF8zKTtcbiAgICAgIE11dGFibGVNYXRyaXg0NC5tdWx0aXBseVRvKG1hdHJpeEZyb21BbmNlc3RvclRvUGFyZW50LCBTY2VuZUdyYXBoQ29tcG9uZW50Ll9fdG1wX21hdDRfMywgdGhpcy5fd29ybGRNYXRyaXgpO1xuICAgIH1cbiAgICB0aGlzLl9faXNXb3JsZE1hdHJpeFVwVG9EYXRlID0gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcy5fd29ybGRNYXRyaXg7XG4gIH1cblxuICAvKipcbiAgICogUmVjdXJzaXZlbHkgY2FsY3VsYXRlcyB0aGUgd29ybGQgbWF0cml4IGluIHJlc3QgcG9zZSBmcm9tIHRoaXMgbm9kZSB1cCB0byB0aGUgcm9vdC5cbiAgICogQHJldHVybnMgVGhlIGNhbGN1bGF0ZWQgd29ybGQgbWF0cml4IGluIHJlc3QgcG9zZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2NhbGNXb3JsZE1hdHJpeFJlc3RSZWN1cnNpdmVseSgpOiBNdXRhYmxlTWF0cml4NDQge1xuICAgIGlmICh0aGlzLl9faXNXb3JsZE1hdHJpeFJlc3RVcFRvRGF0ZSkge1xuICAgICAgcmV0dXJuIHRoaXMuX3dvcmxkTWF0cml4UmVzdDtcbiAgICB9XG5cbiAgICBjb25zdCB0cmFuc2Zvcm0gPSB0aGlzLmVudGl0eS5nZXRUcmFuc2Zvcm0oKSE7XG5cbiAgICBpZiAodGhpcy5fX3BhcmVudCA9PSBudWxsIHx8IHRoaXMudG9NYWtlV29ybGRNYXRyaXhUaGVTYW1lQXNMb2NhbE1hdHJpeCkge1xuICAgICAgdHJhbnNmb3JtLmdldExvY2FsTWF0cml4SW5uZXJUbyh0aGlzLl93b3JsZE1hdHJpeFJlc3QpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBtYXRyaXhGcm9tQW5jZXN0b3JUb1BhcmVudCA9IHRoaXMuX19wYXJlbnQuX19jYWxjV29ybGRNYXRyaXhSZXN0UmVjdXJzaXZlbHkoKTtcbiAgICAgIHRyYW5zZm9ybS5nZXRMb2NhbE1hdHJpeElubmVyVG8oU2NlbmVHcmFwaENvbXBvbmVudC5fX3RtcF9tYXQ0XzMpO1xuICAgICAgTXV0YWJsZU1hdHJpeDQ0Lm11bHRpcGx5VG8obWF0cml4RnJvbUFuY2VzdG9yVG9QYXJlbnQsIFNjZW5lR3JhcGhDb21wb25lbnQuX190bXBfbWF0NF8zLCB0aGlzLl93b3JsZE1hdHJpeFJlc3QpO1xuICAgIH1cbiAgICB0aGlzLl9faXNXb3JsZE1hdHJpeFJlc3RVcFRvRGF0ZSA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXMuX3dvcmxkTWF0cml4UmVzdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB3b3JsZCByb3RhdGlvbiBxdWF0ZXJuaW9uIGJ5IHJlY3Vyc2l2ZWx5IGNvbWJpbmluZyBsb2NhbCByb3RhdGlvbnMuXG4gICAqIFRoaXMgYWxsb2NhdGVzIGEgbmV3IHF1YXRlcm5pb24uIFVzZSB7QGxpbmsgZ2V0UXVhdGVybmlvblJlY3Vyc2l2ZWx5VG99XG4gICAqIHdoZW4gYSBwcmUtYWxsb2NhdGVkIG91dHB1dCBxdWF0ZXJuaW9uIGlzIGF2YWlsYWJsZSAoZS5nLiBpbiBob3QgcGVyLWZyYW1lIHBhdGhzKS5cbiAgICogQHJldHVybnMgVGhlIHdvcmxkIHJvdGF0aW9uIHF1YXRlcm5pb25cbiAgICovXG4gIGdldFF1YXRlcm5pb25SZWN1cnNpdmVseSgpOiBJUXVhdGVybmlvbiB7XG4gICAgcmV0dXJuIFF1YXRlcm5pb24uZnJvbUNvcHlRdWF0ZXJuaW9uKHRoaXMuZ2V0UXVhdGVybmlvblJlY3Vyc2l2ZWx5VG8oU2NlbmVHcmFwaENvbXBvbmVudC5fX3RtcF9xdWF0XzEpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB3b3JsZCByb3RhdGlvbiBxdWF0ZXJuaW9uIGJ5IHJlY3Vyc2l2ZWx5IGNvbWJpbmluZyBsb2NhbCByb3RhdGlvbnNcbiAgICogYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIHRoZSBnaXZlbiBvdXRwdXQgcXVhdGVybmlvbiB3aXRob3V0IGFsbG9jYXRpbmcuXG4gICAqIEBwYXJhbSBvdXQgLSBUaGUgb3V0cHV0IHF1YXRlcm5pb24gdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHF1YXRlcm5pb24gY29udGFpbmluZyB0aGUgd29ybGQgcm90YXRpb25cbiAgICovXG4gIGdldFF1YXRlcm5pb25SZWN1cnNpdmVseVRvKG91dDogSU11dGFibGVRdWF0ZXJuaW9uKTogSU11dGFibGVRdWF0ZXJuaW9uIHtcbiAgICBjb25zdCBsb2NhbFJvdGF0aW9uID0gdGhpcy5lbnRpdHkuZ2V0VHJhbnNmb3JtKCkubG9jYWxSb3RhdGlvbklubmVyO1xuICAgIGlmICh0aGlzLl9fcGFyZW50ID09IG51bGwpIHtcbiAgICAgIHJldHVybiBvdXQuY29weUNvbXBvbmVudHMobG9jYWxSb3RhdGlvbik7XG4gICAgfVxuXG4gICAgLy8gVGhlIHJlY3Vyc2lvbiByZXVzZXMgYSBzaW5nbGUgdGVtcG9yYXJ5IHF1YXRlcm5pb246IFF1YXRlcm5pb24ubXVsdGlwbHlUb1xuICAgIC8vIGNvbXB1dGVzIGFsbCBjb21wb25lbnRzIGJlZm9yZSB3cml0aW5nIHRvIHRoZSBvdXRwdXQsIHNvIHVzaW5nIHRoZSBzYW1lXG4gICAgLy8gaW5zdGFuY2UgYXMgYm90aCBhbiBpbnB1dCBhbmQgdGhlIG91dHB1dCBpcyBzYWZlLlxuICAgIHRoaXMuX19wYXJlbnQuZ2V0UXVhdGVybmlvblJlY3Vyc2l2ZWx5VG8oU2NlbmVHcmFwaENvbXBvbmVudC5fX3RtcF9xdWF0XzApO1xuICAgIHJldHVybiBRdWF0ZXJuaW9uLm11bHRpcGx5VG8oU2NlbmVHcmFwaENvbXBvbmVudC5fX3RtcF9xdWF0XzAsIGxvY2FsUm90YXRpb24sIG91dCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgd29ybGQgcG9zaXRpb24gb2YgdGhpcyBub2RlLlxuICAgKiBAcmV0dXJucyBUaGUgd29ybGQgcG9zaXRpb24gYXMgYSBWZWN0b3IzXG4gICAqL1xuICBnZXQgd29ybGRQb3NpdGlvbigpOiBWZWN0b3IzIHtcbiAgICBjb25zdCB6ZXJvVmVjdG9yID0gU2NlbmVHcmFwaENvbXBvbmVudC5fX29yaWdpblZlY3RvcjM7XG4gICAgdGhpcy5tYXRyaXhJbm5lci5tdWx0aXBseVZlY3RvcjNUbyh6ZXJvVmVjdG9yLCBTY2VuZUdyYXBoQ29tcG9uZW50LnJldHVyblZlY3RvcjMpO1xuICAgIHJldHVybiBTY2VuZUdyYXBoQ29tcG9uZW50LnJldHVyblZlY3RvcjMgYXMgVmVjdG9yMztcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFuc2Zvcm1zIGEgbG9jYWwgcG9zaXRpb24gdG8gd29ybGQgc3BhY2UuXG4gICAqIEBwYXJhbSBsb2NhbFBvc2l0aW9uIC0gVGhlIHBvc2l0aW9uIGluIGxvY2FsIHNwYWNlXG4gICAqIEByZXR1cm5zIFRoZSBwb3NpdGlvbiBpbiB3b3JsZCBzcGFjZVxuICAgKi9cbiAgZ2V0V29ybGRQb3NpdGlvbk9mKGxvY2FsUG9zaXRpb246IFZlY3RvcjMpIHtcbiAgICByZXR1cm4gdGhpcy5tYXRyaXhJbm5lci5tdWx0aXBseVZlY3RvcjMobG9jYWxQb3NpdGlvbik7XG4gIH1cblxuICAvKipcbiAgICogVHJhbnNmb3JtcyBhIGxvY2FsIHBvc2l0aW9uIHRvIHdvcmxkIHNwYWNlIGFuZCBzdG9yZXMgdGhlIHJlc3VsdCBpbiB0aGUgb3V0cHV0IHZlY3Rvci5cbiAgICogQHBhcmFtIGxvY2FsUG9zaXRpb24gLSBUaGUgcG9zaXRpb24gaW4gbG9jYWwgc3BhY2VcbiAgICogQHBhcmFtIG91dCAtIFRoZSBvdXRwdXQgdmVjdG9yIHRvIHN0b3JlIHRoZSByZXN1bHRcbiAgICogQHJldHVybnMgVGhlIG91dHB1dCB2ZWN0b3IgY29udGFpbmluZyB0aGUgd29ybGQgcG9zaXRpb25cbiAgICovXG4gIGdldFdvcmxkUG9zaXRpb25PZlRvKGxvY2FsUG9zaXRpb246IFZlY3RvcjMsIG91dDogTXV0YWJsZVZlY3RvcjMpIHtcbiAgICByZXR1cm4gdGhpcy5tYXRyaXhJbm5lci5tdWx0aXBseVZlY3RvcjNUbyhsb2NhbFBvc2l0aW9uLCBvdXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybXMgYSB3b3JsZCBwb3NpdGlvbiB0byBsb2NhbCBzcGFjZS5cbiAgICogQHBhcmFtIHdvcmxkUG9zaXRpb24gLSBUaGUgcG9zaXRpb24gaW4gd29ybGQgc3BhY2VcbiAgICogQHJldHVybnMgVGhlIHBvc2l0aW9uIGluIGxvY2FsIHNwYWNlXG4gICAqL1xuICBnZXRMb2NhbFBvc2l0aW9uT2Yod29ybGRQb3NpdGlvbjogVmVjdG9yMyk6IFZlY3RvcjMge1xuICAgIHJldHVybiBNYXRyaXg0NC5pbnZlcnQodGhpcy5tYXRyaXhJbm5lcikubXVsdGlwbHlWZWN0b3IzKHdvcmxkUG9zaXRpb24pO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybXMgYSB3b3JsZCBwb3NpdGlvbiB0byBsb2NhbCBzcGFjZSBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gdGhlIG91dHB1dCB2ZWN0b3IuXG4gICAqIEBwYXJhbSB3b3JsZFBvc2l0aW9uIC0gVGhlIHBvc2l0aW9uIGluIHdvcmxkIHNwYWNlXG4gICAqIEBwYXJhbSBvdXQgLSBUaGUgb3V0cHV0IHZlY3RvciB0byBzdG9yZSB0aGUgcmVzdWx0XG4gICAqIEByZXR1cm5zIFRoZSBvdXRwdXQgdmVjdG9yIGNvbnRhaW5pbmcgdGhlIGxvY2FsIHBvc2l0aW9uXG4gICAqL1xuICBnZXRMb2NhbFBvc2l0aW9uT2ZUbyh3b3JsZFBvc2l0aW9uOiBWZWN0b3IzLCBvdXQ6IE11dGFibGVWZWN0b3IzKTogVmVjdG9yMyB7XG4gICAgcmV0dXJuIE1hdHJpeDQ0LmludmVydFRvKHRoaXMubWF0cml4SW5uZXIsIFNjZW5lR3JhcGhDb21wb25lbnQuX190bXBfbWF0NCkubXVsdGlwbHlWZWN0b3IzVG8od29ybGRQb3NpdGlvbiwgb3V0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB3b3JsZC1zcGFjZSBBQUJCIChBeGlzLUFsaWduZWQgQm91bmRpbmcgQm94KSBvZiB0aGlzIG5vZGUuXG4gICAqIEByZXR1cm5zIFRoZSB3b3JsZCBBQUJCIG9mIHRoaXMgbm9kZVxuICAgKi9cbiAgZ2V0V29ybGRBQUJCKCkge1xuICAgIGNvbnN0IGFhYmIgPSBuZXcgQUFCQigpO1xuICAgIGNvbnN0IG1lc2hDb21wb25lbnQgPSB0aGlzLmVudGl0eS50cnlUb0dldE1lc2goKTtcbiAgICBpZiAoSXMuZXhpc3QobWVzaENvbXBvbmVudCkgJiYgSXMuZXhpc3QobWVzaENvbXBvbmVudC5tZXNoKSkge1xuICAgICAgYWFiYi5tZXJnZUFBQkIobWVzaENvbXBvbmVudC5tZXNoLkFBQkIpO1xuXG4gICAgICBBQUJCLm11bHRpcGx5TWF0cml4VG8odGhpcy5lbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLm1hdHJpeElubmVyLCBhYWJiLCBTY2VuZUdyYXBoQ29tcG9uZW50Ll9fdG1wQUFCQik7XG4gICAgfSBlbHNlIHtcbiAgICAgIFNjZW5lR3JhcGhDb21wb25lbnQuX190bXBBQUJCLmluaXRpYWxpemUoKTtcbiAgICB9XG5cbiAgICBjb25zdCByYXltYXJjaGluZ0NvbXBvbmVudCA9IHRoaXMuZW50aXR5LnRyeVRvR2V0UmF5bWFyY2hpbmcoKTtcbiAgICBpZiAoSXMuZXhpc3QocmF5bWFyY2hpbmdDb21wb25lbnQpKSB7XG4gICAgICBjb25zdCByYXltYXJjaGluZ0FBQkIgPSByYXltYXJjaGluZ0NvbXBvbmVudC5jYWxjV29ybGRBQUJCKCk7XG4gICAgICBpZiAocmF5bWFyY2hpbmdBQUJCICE9IG51bGwpIHtcbiAgICAgICAgU2NlbmVHcmFwaENvbXBvbmVudC5fX3RtcEFBQkIubWVyZ2VBQUJCKHJheW1hcmNoaW5nQUFCQik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFNjZW5lR3JhcGhDb21wb25lbnQuX190bXBBQUJCO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIG1lcmdlZCB3b3JsZCBBQUJCIGluY2x1ZGluZyBhbGwgY2hpbGRyZW4uXG4gICAqIEByZXR1cm5zIFRoZSBtZXJnZWQgd29ybGQgQUFCQiBvZiB0aGlzIG5vZGUgYW5kIGFsbCBpdHMgZGVzY2VuZGFudHNcbiAgICovXG4gIGNhbGNXb3JsZE1lcmdlZEFBQkIoKSB7XG4gICAgY29uc3QgYWFiYiA9IHRoaXMuZ2V0V29ybGRBQUJCKCkuY2xvbmUoKTtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHRoaXMuY2hpbGRyZW4pIHtcbiAgICAgIGNvbnN0IGNoaWxkQUFCQiA9IGNoaWxkLmNhbGNXb3JsZE1lcmdlZEFBQkIoKTtcbiAgICAgIGFhYmIubWVyZ2VBQUJCKGNoaWxkQUFCQik7XG4gICAgfVxuICAgIHRoaXMuX193b3JsZE1lcmdlZEFBQkIgPSBhYWJiO1xuXG4gICAgcmV0dXJuIGFhYmI7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY2FjaGVkIG1lcmdlZCB3b3JsZCBBQUJCLCByZWNhbGN1bGF0aW5nIGlmIGRpcnR5LlxuICAgKiBAcmV0dXJucyBUaGUgbWVyZ2VkIHdvcmxkIEFBQkIgb2YgdGhpcyBub2RlIGFuZCBhbGwgaXRzIGRlc2NlbmRhbnRzXG4gICAqL1xuICBnZXQgd29ybGRNZXJnZWRBQUJCKCkge1xuICAgIGlmICh0aGlzLl9faXNXb3JsZEFBQkJEaXJ0eSkge1xuICAgICAgdGhpcy5jYWxjV29ybGRNZXJnZWRBQUJCKCk7XG4gICAgICB0aGlzLl9faXNXb3JsZEFBQkJEaXJ0eSA9IGZhbHNlO1xuICAgICAgU2NlbmVHcmFwaENvbXBvbmVudC5fX2FhYmJEaXJ0eUNoYWluRXBvY2grKztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX193b3JsZE1lcmdlZEFBQkI7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgd29ybGQtc3BhY2UgQUFCQiB3aXRoIHNrZWxldGFsIGFuaW1hdGlvbiBhcHBsaWVkLlxuICAgKiBAcmV0dXJucyBUaGUgd29ybGQgQUFCQiB3aXRoIHNrZWxldGFsIHRyYW5zZm9ybWF0aW9uc1xuICAgKi9cbiAgZ2V0V29ybGRBQUJCV2l0aFNrZWxldGFsKCkge1xuICAgIGNvbnN0IGFhYmIgPSBuZXcgQUFCQigpO1xuICAgIGNvbnN0IG1lc2hDb21wb25lbnQgPSB0aGlzLmVudGl0eS50cnlUb0dldE1lc2goKTtcbiAgICBpZiAoSXMuZXhpc3QobWVzaENvbXBvbmVudCkgJiYgSXMuZXhpc3QobWVzaENvbXBvbmVudC5tZXNoKSkge1xuICAgICAgYWFiYi5tZXJnZUFBQkIobWVzaENvbXBvbmVudC5tZXNoLkFBQkIpO1xuXG4gICAgICBBQUJCLm11bHRpcGx5TWF0cml4VG8oXG4gICAgICAgIHRoaXMuZW50aXR5LmdldFNjZW5lR3JhcGgoKS5lbnRpdHlXb3JsZE1hdHJpeFdpdGhTa2VsZXRhbElubmVyLFxuICAgICAgICBhYWJiLFxuICAgICAgICBTY2VuZUdyYXBoQ29tcG9uZW50Ll9fdG1wQUFCQlxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgU2NlbmVHcmFwaENvbXBvbmVudC5fX3RtcEFBQkIuaW5pdGlhbGl6ZSgpO1xuICAgIH1cblxuICAgIGNvbnN0IHJheW1hcmNoaW5nQ29tcG9uZW50ID0gdGhpcy5lbnRpdHkudHJ5VG9HZXRSYXltYXJjaGluZygpO1xuICAgIGlmIChJcy5leGlzdChyYXltYXJjaGluZ0NvbXBvbmVudCkpIHtcbiAgICAgIGNvbnN0IHJheW1hcmNoaW5nQUFCQiA9IHJheW1hcmNoaW5nQ29tcG9uZW50LmNhbGNXb3JsZEFBQkIoKTtcbiAgICAgIGlmIChyYXltYXJjaGluZ0FBQkIgIT0gbnVsbCkge1xuICAgICAgICBTY2VuZUdyYXBoQ29tcG9uZW50Ll9fdG1wQUFCQi5tZXJnZUFBQkIocmF5bWFyY2hpbmdBQUJCKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gU2NlbmVHcmFwaENvbXBvbmVudC5fX3RtcEFBQkI7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyB0aGUgbWVyZ2VkIHdvcmxkIEFBQkIgd2l0aCBza2VsZXRhbCBhbmltYXRpb24gaW5jbHVkaW5nIGFsbCBjaGlsZHJlbi5cbiAgICogQHJldHVybnMgVGhlIG1lcmdlZCB3b3JsZCBBQUJCIHdpdGggc2tlbGV0YWwgdHJhbnNmb3JtYXRpb25zXG4gICAqL1xuICBjYWxjV29ybGRNZXJnZWRBQUJCV2l0aFNrZWxldGFsKCkge1xuICAgIGNvbnN0IGFhYmIgPSB0aGlzLmdldFdvcmxkQUFCQldpdGhTa2VsZXRhbCgpLmNsb25lKCk7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiB0aGlzLmNoaWxkcmVuKSB7XG4gICAgICBjb25zdCBjaGlsZEFBQkIgPSBjaGlsZC5jYWxjV29ybGRNZXJnZWRBQUJCV2l0aFNrZWxldGFsKCk7XG4gICAgICBhYWJiLm1lcmdlQUFCQihjaGlsZEFBQkIpO1xuICAgIH1cbiAgICB0aGlzLl9fd29ybGRNZXJnZWRBQUJCV2l0aFNrZWxldGFsID0gYWFiYjtcblxuICAgIHJldHVybiBhYWJiO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNhY2hlZCBtZXJnZWQgd29ybGQgQUFCQiB3aXRoIHNrZWxldGFsIGFuaW1hdGlvbiwgcmVjYWxjdWxhdGluZyBpZiBkaXJ0eS5cbiAgICogQHJldHVybnMgVGhlIG1lcmdlZCB3b3JsZCBBQUJCIHdpdGggc2tlbGV0YWwgdHJhbnNmb3JtYXRpb25zXG4gICAqL1xuICBnZXQgd29ybGRNZXJnZWRBQUJCV2l0aFNrZWxldGFsKCkge1xuICAgIGlmICh0aGlzLl9faXNXb3JsZEFBQkJEaXJ0eVdpdGhTa2VsZXRhbCkge1xuICAgICAgdGhpcy5jYWxjV29ybGRNZXJnZWRBQUJCV2l0aFNrZWxldGFsKCk7XG4gICAgICB0aGlzLl9faXNXb3JsZEFBQkJEaXJ0eVdpdGhTa2VsZXRhbCA9IGZhbHNlO1xuICAgICAgU2NlbmVHcmFwaENvbXBvbmVudC5fX2FhYmJEaXJ0eUNoYWluRXBvY2grKztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX193b3JsZE1lcmdlZEFBQkJXaXRoU2tlbGV0YWw7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgcmF5IGNhc3RpbmcgYWdhaW5zdCBhbGwgbWVzaCBhbmQgcmF5bWFyY2hpbmcgY29tcG9uZW50cyBpbiB0aGlzIGhpZXJhcmNoeS5cbiAgICpcbiAgICogQHBhcmFtIHNyY1BvaW50SW5Xb3JsZCAtIFRoZSByYXkgb3JpZ2luIHBvaW50IGluIHdvcmxkIHNwYWNlXG4gICAqIEBwYXJhbSBkaXJlY3Rpb25JbldvcmxkIC0gVGhlIHJheSBkaXJlY3Rpb24gdmVjdG9yIGluIHdvcmxkIHNwYWNlIChzaG91bGQgYmUgbm9ybWFsaXplZClcbiAgICogQHBhcmFtIGRvdFRocmVzaG9sZCAtIFRocmVzaG9sZCBmb3IgdHJpYW5nbGUtcmF5IGludGVyc2VjdGlvbiBhbmdsZSAoZGVmYXVsdDogMClcbiAgICogQHBhcmFtIGlnbm9yZU1lc2hDb21wb25lbnRzIC0gQXJyYXkgb2YgbWVzaCBjb21wb25lbnRzIHRvIGV4Y2x1ZGUgZnJvbSByYXkgY2FzdGluZyAoZGVmYXVsdDogW10pXG4gICAqIEByZXR1cm5zIFJheSBjYXN0aW5nIHJlc3VsdCBjb250YWluaW5nIGludGVyc2VjdGlvbiBpbmZvcm1hdGlvblxuICAgKi9cbiAgcHVibGljIGNhc3RSYXkoXG4gICAgc3JjUG9pbnRJbldvcmxkOiBWZWN0b3IzLFxuICAgIGRpcmVjdGlvbkluV29ybGQ6IFZlY3RvcjMsXG4gICAgZG90VGhyZXNob2xkID0gMCxcbiAgICBpZ25vcmVNZXNoQ29tcG9uZW50czogTWVzaENvbXBvbmVudFtdID0gW11cbiAgKTogUmF5Y2FzdFJlc3VsdEV4MiB7XG4gICAgY29uc3QgY29sbGVjdGVkU2dDb21wb25lbnRzID0gZmxhdHRlbkhpZXJhcmNoeSh0aGlzLCBmYWxzZSk7XG4gICAgY29uc3QgbWVzaENvbXBvbmVudHM6IE1lc2hDb21wb25lbnRbXSA9IFtdO1xuICAgIGZvciAoY29uc3Qgc2cgb2YgY29sbGVjdGVkU2dDb21wb25lbnRzKSB7XG4gICAgICBjb25zdCBtZXNoID0gc2cuZW50aXR5LnRyeVRvR2V0TWVzaCgpO1xuICAgICAgaWYgKG1lc2gpIHtcbiAgICAgICAgbWVzaENvbXBvbmVudHMucHVzaChtZXNoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgcmF5RGlzdGFuY2UgPSBOdW1iZXIuTUFYX1ZBTFVFO1xuICAgIGxldCBpbnRlcnNlY3RlZFBvc2l0aW9uO1xuICAgIGxldCBzZWxlY3RlZE1lc2hDb21wb25lbnQ7XG4gICAgbGV0IHNlbGVjdGVkUmF5bWFyY2hpbmdDb21wb25lbnQ7XG4gICAgbGV0IHUgPSAwO1xuICAgIGxldCB2ID0gMDtcbiAgICBmb3IgKGNvbnN0IG1lc2hDb21wb25lbnQgb2YgbWVzaENvbXBvbmVudHMpIHtcbiAgICAgIGlmICghbWVzaENvbXBvbmVudC5lbnRpdHkuZ2V0U2NlbmVHcmFwaCgpIS5pc1Zpc2libGUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAoIW1lc2hDb21wb25lbnQuaXNQaWNrYWJsZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChpZ25vcmVNZXNoQ29tcG9uZW50cy5pbmRleE9mKG1lc2hDb21wb25lbnQpICE9PSAtMSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJlc3VsdCA9IG1lc2hDb21wb25lbnQuY2FzdFJheShzcmNQb2ludEluV29ybGQsIGRpcmVjdGlvbkluV29ybGQsIGRvdFRocmVzaG9sZCk7XG4gICAgICBpZiAoSXMuZGVmaW5lZChyZXN1bHQuZGF0YSkgJiYgcmVzdWx0LmRhdGEudCA8IHJheURpc3RhbmNlKSB7XG4gICAgICAgIHJheURpc3RhbmNlID0gcmVzdWx0LmRhdGEudDtcbiAgICAgICAgaW50ZXJzZWN0ZWRQb3NpdGlvbiA9IHJlc3VsdC5kYXRhLnBvc2l0aW9uO1xuICAgICAgICBzZWxlY3RlZE1lc2hDb21wb25lbnQgPSBtZXNoQ29tcG9uZW50O1xuICAgICAgICBzZWxlY3RlZFJheW1hcmNoaW5nQ29tcG9uZW50ID0gdW5kZWZpbmVkO1xuICAgICAgICB1ID0gcmVzdWx0LmRhdGEudTtcbiAgICAgICAgdiA9IHJlc3VsdC5kYXRhLnY7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBzZyBvZiBjb2xsZWN0ZWRTZ0NvbXBvbmVudHMpIHtcbiAgICAgIGNvbnN0IHJheW1hcmNoaW5nQ29tcG9uZW50ID0gc2cuZW50aXR5LnRyeVRvR2V0UmF5bWFyY2hpbmcoKTtcbiAgICAgIGlmIChyYXltYXJjaGluZ0NvbXBvbmVudCA9PSBudWxsIHx8ICFyYXltYXJjaGluZ0NvbXBvbmVudC5pc1BpY2thYmxlIHx8ICFzZy5pc1Zpc2libGUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCByZXN1bHQgPSByYXltYXJjaGluZ0NvbXBvbmVudC5jYXN0UmF5KHNyY1BvaW50SW5Xb3JsZCwgZGlyZWN0aW9uSW5Xb3JsZCk7XG4gICAgICBpZiAocmVzdWx0ICE9IG51bGwgJiYgcmVzdWx0LnQgPCByYXlEaXN0YW5jZSkge1xuICAgICAgICByYXlEaXN0YW5jZSA9IHJlc3VsdC50O1xuICAgICAgICBpbnRlcnNlY3RlZFBvc2l0aW9uID0gcmVzdWx0LnBvc2l0aW9uO1xuICAgICAgICBzZWxlY3RlZE1lc2hDb21wb25lbnQgPSB1bmRlZmluZWQ7XG4gICAgICAgIHNlbGVjdGVkUmF5bWFyY2hpbmdDb21wb25lbnQgPSByYXltYXJjaGluZ0NvbXBvbmVudDtcbiAgICAgICAgdSA9IDA7XG4gICAgICAgIHYgPSAwO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICgoSXMuZXhpc3Qoc2VsZWN0ZWRNZXNoQ29tcG9uZW50KSB8fCBJcy5leGlzdChzZWxlY3RlZFJheW1hcmNoaW5nQ29tcG9uZW50KSkgJiYgSXMuZXhpc3QoaW50ZXJzZWN0ZWRQb3NpdGlvbikpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlc3VsdDogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIHQ6IHJheURpc3RhbmNlLFxuICAgICAgICAgIHUsXG4gICAgICAgICAgdixcbiAgICAgICAgICBwb3NpdGlvbjogaW50ZXJzZWN0ZWRQb3NpdGlvbixcbiAgICAgICAgICBzZWxlY3RlZE1lc2hDb21wb25lbnQsXG4gICAgICAgICAgc2VsZWN0ZWRSYXltYXJjaGluZ0NvbXBvbmVudCxcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICByZXN1bHQ6IGZhbHNlLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgcmF5IGNhc3RpbmcgZnJvbSBzY3JlZW4gY29vcmRpbmF0ZXMgYWdhaW5zdCBhbGwgbWVzaCBhbmQgcmF5bWFyY2hpbmcgY29tcG9uZW50cyBpbiB0aGlzIGhpZXJhcmNoeS5cbiAgICpcbiAgICogQHBhcmFtIHggLSBTY3JlZW4geCBjb29yZGluYXRlXG4gICAqIEBwYXJhbSB5IC0gU2NyZWVuIHkgY29vcmRpbmF0ZVxuICAgKiBAcGFyYW0gY2FtZXJhIC0gVGhlIGNhbWVyYSBjb21wb25lbnQgdG8gdXNlIGZvciBzY3JlZW4tdG8td29ybGQgcHJvamVjdGlvblxuICAgKiBAcGFyYW0gdmlld3BvcnQgLSBWaWV3cG9ydCByZWN0YW5nbGUgYXMgVmVjdG9yNCAoeCwgeSwgd2lkdGgsIGhlaWdodClcbiAgICogQHBhcmFtIGRvdFRocmVzaG9sZCAtIFRocmVzaG9sZCBmb3IgdHJpYW5nbGUtcmF5IGludGVyc2VjdGlvbiBhbmdsZSAoZGVmYXVsdDogMClcbiAgICogQHBhcmFtIGlnbm9yZU1lc2hDb21wb25lbnRzIC0gQXJyYXkgb2YgbWVzaCBjb21wb25lbnRzIHRvIGV4Y2x1ZGUgZnJvbSByYXkgY2FzdGluZyAoZGVmYXVsdDogW10pXG4gICAqIEByZXR1cm5zIFJheSBjYXN0aW5nIHJlc3VsdCBjb250YWluaW5nIGludGVyc2VjdGlvbiBpbmZvcm1hdGlvbiBpbiB3b3JsZCBzcGFjZVxuICAgKi9cbiAgY2FzdFJheUZyb21TY3JlZW4oXG4gICAgeDogbnVtYmVyLFxuICAgIHk6IG51bWJlcixcbiAgICBjYW1lcmE6IENhbWVyYUNvbXBvbmVudCxcbiAgICB2aWV3cG9ydDogVmVjdG9yNCxcbiAgICBkb3RUaHJlc2hvbGQgPSAwLFxuICAgIGlnbm9yZU1lc2hDb21wb25lbnRzOiBNZXNoQ29tcG9uZW50W10gPSBbXVxuICApOiBSYXljYXN0UmVzdWx0RXgyIHtcbiAgICBjb25zdCBjb2xsZWN0ZWRTZ0NvbXBvbmVudHMgPSBmbGF0dGVuSGllcmFyY2h5KHRoaXMsIGZhbHNlKTtcbiAgICBjb25zdCBtZXNoQ29tcG9uZW50czogTWVzaENvbXBvbmVudFtdID0gW107XG4gICAgZm9yIChjb25zdCBzZyBvZiBjb2xsZWN0ZWRTZ0NvbXBvbmVudHMpIHtcbiAgICAgIGNvbnN0IG1lc2ggPSBzZy5lbnRpdHkudHJ5VG9HZXRNZXNoKCk7XG4gICAgICBpZiAobWVzaCkge1xuICAgICAgICBtZXNoQ29tcG9uZW50cy5wdXNoKG1lc2gpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxldCByYXlEaXN0YW5jZSA9IE51bWJlci5NQVhfVkFMVUU7XG4gICAgbGV0IGludGVyc2VjdGVkUG9zaXRpb247XG4gICAgbGV0IHNlbGVjdGVkTWVzaENvbXBvbmVudDtcbiAgICBsZXQgc2VsZWN0ZWRSYXltYXJjaGluZ0NvbXBvbmVudDtcbiAgICBsZXQgdSA9IDA7XG4gICAgbGV0IHYgPSAwO1xuICAgIGZvciAoY29uc3QgbWVzaENvbXBvbmVudCBvZiBtZXNoQ29tcG9uZW50cykge1xuICAgICAgaWYgKCFtZXNoQ29tcG9uZW50LmVudGl0eS5nZXRTY2VuZUdyYXBoKCkuaXNWaXNpYmxlKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKCFtZXNoQ29tcG9uZW50LmlzUGlja2FibGUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAoaWdub3JlTWVzaENvbXBvbmVudHMuaW5kZXhPZihtZXNoQ29tcG9uZW50KSAhPT0gLTEpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCByZXN1bHQgPSBtZXNoQ29tcG9uZW50LmNhc3RSYXlGcm9tU2NyZWVuSW5Xb3JsZCh4LCB5LCBjYW1lcmEsIHZpZXdwb3J0LCBkb3RUaHJlc2hvbGQpO1xuICAgICAgaWYgKElzLmRlZmluZWQocmVzdWx0LmRhdGEpICYmIHJlc3VsdC5kYXRhLnQgPCByYXlEaXN0YW5jZSkge1xuICAgICAgICByYXlEaXN0YW5jZSA9IHJlc3VsdC5kYXRhLnQ7XG4gICAgICAgIGludGVyc2VjdGVkUG9zaXRpb24gPSByZXN1bHQuZGF0YS5wb3NpdGlvbjtcbiAgICAgICAgc2VsZWN0ZWRNZXNoQ29tcG9uZW50ID0gbWVzaENvbXBvbmVudDtcbiAgICAgICAgc2VsZWN0ZWRSYXltYXJjaGluZ0NvbXBvbmVudCA9IHVuZGVmaW5lZDtcbiAgICAgICAgdSA9IHJlc3VsdC5kYXRhLnU7XG4gICAgICAgIHYgPSByZXN1bHQuZGF0YS52O1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3Qgc2cgb2YgY29sbGVjdGVkU2dDb21wb25lbnRzKSB7XG4gICAgICBjb25zdCByYXltYXJjaGluZ0NvbXBvbmVudCA9IHNnLmVudGl0eS50cnlUb0dldFJheW1hcmNoaW5nKCk7XG4gICAgICBpZiAocmF5bWFyY2hpbmdDb21wb25lbnQgPT0gbnVsbCB8fCAhcmF5bWFyY2hpbmdDb21wb25lbnQuaXNQaWNrYWJsZSB8fCAhc2cuaXNWaXNpYmxlKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgcmVzdWx0ID0gcmF5bWFyY2hpbmdDb21wb25lbnQuY2FzdFJheUZyb21TY3JlZW4oeCwgeSwgY2FtZXJhLCB2aWV3cG9ydCk7XG4gICAgICBpZiAocmVzdWx0LnJlc3VsdCAmJiByZXN1bHQuZGF0YSAhPSBudWxsICYmIHJlc3VsdC5kYXRhLnQgPCByYXlEaXN0YW5jZSkge1xuICAgICAgICByYXlEaXN0YW5jZSA9IHJlc3VsdC5kYXRhLnQ7XG4gICAgICAgIGludGVyc2VjdGVkUG9zaXRpb24gPSByZXN1bHQuZGF0YS5wb3NpdGlvbjtcbiAgICAgICAgc2VsZWN0ZWRNZXNoQ29tcG9uZW50ID0gdW5kZWZpbmVkO1xuICAgICAgICBzZWxlY3RlZFJheW1hcmNoaW5nQ29tcG9uZW50ID0gcmF5bWFyY2hpbmdDb21wb25lbnQ7XG4gICAgICAgIHUgPSAwO1xuICAgICAgICB2ID0gMDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoKElzLmV4aXN0KHNlbGVjdGVkTWVzaENvbXBvbmVudCkgfHwgSXMuZXhpc3Qoc2VsZWN0ZWRSYXltYXJjaGluZ0NvbXBvbmVudCkpICYmIElzLmV4aXN0KGludGVyc2VjdGVkUG9zaXRpb24pKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZXN1bHQ6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICB0OiByYXlEaXN0YW5jZSxcbiAgICAgICAgICB1LFxuICAgICAgICAgIHYsXG4gICAgICAgICAgcG9zaXRpb246IGludGVyc2VjdGVkUG9zaXRpb24sXG4gICAgICAgICAgc2VsZWN0ZWRNZXNoQ29tcG9uZW50LFxuICAgICAgICAgIHNlbGVjdGVkUmF5bWFyY2hpbmdDb21wb25lbnQsXG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgcmVzdWx0OiBmYWxzZSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIHRoZSBjb21wb25lbnQgYW5kIG1vdmVzIHRvIHRoZSBMb2dpYyBzdGFnZS5cbiAgICovXG4gICRsb2FkKCkge1xuICAgIHRoaXMubW92ZVN0YWdlVG8oUHJvY2Vzc1N0YWdlLkxvZ2ljKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlcyBsb2dpYyBzdGFnZSBwcm9jZXNzaW5nIGluY2x1ZGluZyBtYXRyaXggdXBkYXRlcyBhbmQgZ2l6bW8gdXBkYXRlcy5cbiAgICovXG4gICRsb2dpYygpIHtcbiAgICAvLyBOb3RoaW5nIHRoaXMgbm9kZSBkZXJpdmVzIGhhcyBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IGxvZ2ljRm9yY2UuIE1vc3Qgbm9kZXMgb2YgYSBsYXJnZSBzY2VuZSBhcmVcbiAgICAvLyBzdGF0aWMsIGFuZCB0aGlzIGNoZWNrIGF2b2lkcyB0aGUgZW50aXR5IGFuZCBtZXNoIGxvb2t1cHMgb2YgbG9naWNGb3JjZSBmb3IgdGhlbS5cbiAgICBpZiAoXG4gICAgICB0aGlzLl9fc2V0dGxlZFdvcmxkTWF0cml4VmVyc2lvbiA9PT0gdGhpcy5fX3dvcmxkTWF0cml4VmVyc2lvbiAmJlxuICAgICAgdGhpcy5fX2lzV29ybGRNYXRyaXhVcFRvRGF0ZSAmJlxuICAgICAgIXRoaXMuX19oYXNHaXptb3MgJiZcbiAgICAgIHRoaXMuX19zZXR0bGVkQ29tcG9uZW50Q3JlYXRpb25Db3VudCA9PT0gdGhpcy5fX2VuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5Ll9jb21wb25lbnRDcmVhdGlvbkNvdW50XG4gICAgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLl9fbGFzdFRyYW5zZm9ybUNvbXBvbmVudHNVcGRhdGVDb3VudCA9PT0gVHJhbnNmb3JtQ29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5sb2dpY0ZvcmNlKCk7XG5cbiAgICAvLyBjb25zdCBtZXNoQ29tcG9uZW50ID0gdGhpcy5lbnRpdHkudHJ5VG9HZXRNZXNoKCk7XG4gICAgLy8gaWYgKG1lc2hDb21wb25lbnQgIT0gbnVsbCkge1xuICAgIC8vICAgY29uc3QgbWVzaCA9IG1lc2hDb21wb25lbnQubWVzaDtcbiAgICAvLyAgIGlmIChtZXNoICE9IG51bGwpIHtcbiAgICAvLyAgICAgY29uc3QgcHJpbWl0aXZlTnVtID0gbWVzaC5nZXRQcmltaXRpdmVOdW1iZXIoKTtcbiAgICAvLyAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmltaXRpdmVOdW07IGkrKykge1xuICAgIC8vICAgICAgIGNvbnN0IHByaW1pdGl2ZSA9IG1lc2guZ2V0UHJpbWl0aXZlQXQoaSk7XG4gICAgLy8gICAgICAgaWYgKHByaW1pdGl2ZS5wb3NpdGlvbkFjY2Vzc29yVmVyc2lvbiAhPT0gdGhpcy5fX2xhdGVzdFByaW1pdGl2ZVBvc2l0aW9uQWNjZXNzb3JWZXJzaW9uKSB7XG4gICAgLy8gICAgICAgICB0aGlzLnNldFdvcmxkQUFCQkRpcnR5UGFyZW50UmVjdXJzaXZlbHkoKTtcbiAgICAvLyAgICAgICAgIHRoaXMuX19sYXRlc3RQcmltaXRpdmVQb3NpdGlvbkFjY2Vzc29yVmVyc2lvbiA9IHByaW1pdGl2ZS5wb3NpdGlvbkFjY2Vzc29yVmVyc2lvbiE7XG4gICAgLy8gICAgICAgICBicmVhaztcbiAgICAvLyAgICAgICB9XG4gICAgLy8gICAgIH1cbiAgICAvLyAgIH1cbiAgICAvLyB9XG5cbiAgICB0aGlzLl9fbGFzdFRyYW5zZm9ybUNvbXBvbmVudHNVcGRhdGVDb3VudCA9IFRyYW5zZm9ybUNvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKTtcbiAgfVxuXG4gIGxvZ2ljRm9yY2UoKSB7XG4gICAgdGhpcy5tYXRyaXhJbm5lcjtcbiAgICAvLyBgbm9ybWFsTWF0cml4YCBpcyBhIEdQVSBpbnN0YW5jZSBkYXRhIG1lbWJlciwgc28gaXQgbXVzdCBiZSB1cCB0byBkYXRlIGJlZm9yZSB0aGUgaW5zdGFuY2VcbiAgICAvLyBkYXRhIGJ1ZmZlciBpcyB1cGxvYWRlZC4gT25seSBkcmF3YWJsZSBlbnRpdGllcyBuZWVkIGl0OyBza2lwcGluZyBib25lcyBhbmQgZ3JvdXAgbm9kZXNcbiAgICAvLyBhdm9pZHMgYW4gaW52ZXJzZS10cmFuc3Bvc2UgcGVyIHNrZWxldG9uIG5vZGUuXG4gICAgaWYgKHRoaXMuZW50aXR5LnRyeVRvR2V0TWVzaCgpICE9IG51bGwpIHtcbiAgICAgIHRoaXMubm9ybWFsTWF0cml4SW5uZXI7XG4gICAgfVxuICAgIHRoaXMuX191cGRhdGVHaXptb3MoKTtcbiAgICB0aGlzLl9fc2V0dGxlZFdvcmxkTWF0cml4VmVyc2lvbiA9IHRoaXMuX193b3JsZE1hdHJpeFZlcnNpb247XG4gICAgdGhpcy5fX3NldHRsZWRDb21wb25lbnRDcmVhdGlvbkNvdW50ID0gdGhpcy5fX2VuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5Ll9jb21wb25lbnRDcmVhdGlvbkNvdW50O1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgYWxsIGFjdGl2ZSBnaXptb3MgZm9yIHRoaXMgc2NlbmUgZ3JhcGggbm9kZS5cbiAgICovXG4gIHByaXZhdGUgX191cGRhdGVHaXptb3MoKSB7XG4gICAgaWYgKCF0aGlzLl9faGFzR2l6bW9zKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChJcy5leGlzdCh0aGlzLl9fYWFiYkdpem1vKSAmJiB0aGlzLl9fYWFiYkdpem1vLmlzU2V0dXAgJiYgdGhpcy5fX2FhYmJHaXptby5pc1Zpc2libGUpIHtcbiAgICAgIHRoaXMuX19hYWJiR2l6bW8uX3VwZGF0ZSgpO1xuICAgIH1cbiAgICBpZiAoSXMuZXhpc3QodGhpcy5fX2xvY2F0b3JHaXptbykgJiYgdGhpcy5fX2xvY2F0b3JHaXptby5pc1NldHVwICYmIHRoaXMuX19sb2NhdG9yR2l6bW8uaXNWaXNpYmxlKSB7XG4gICAgICB0aGlzLl9fbG9jYXRvckdpem1vLl91cGRhdGUoKTtcbiAgICB9XG4gICAgdGhpcy5fX3VwZGF0ZVRyYW5zZm9ybUdpem1vcygpO1xuICAgIGlmIChJcy5leGlzdCh0aGlzLl9fam9pbnRHaXptbykgJiYgdGhpcy5fX2pvaW50R2l6bW8uaXNTZXR1cCAmJiB0aGlzLl9fam9pbnRHaXptby5pc1Zpc2libGUpIHtcbiAgICAgIHRoaXMuX19qb2ludEdpem1vLl91cGRhdGUoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgdHJhbnNsYXRpb24sIHJvdGF0aW9uIGFuZCBzY2FsZSBnaXptb3MuXG4gICAqIFRoZWlyIHNpemUgZGVwZW5kcyBvbiB0aGUgY2FtZXJhLCBzbyB0aGlzIGlzIGFsc28gY2FsbGVkIHdoZW4gb25seSB0aGUgY2FtZXJhIGNoYW5nZWQuXG4gICAqL1xuICBwcml2YXRlIF9fdXBkYXRlVHJhbnNmb3JtR2l6bW9zKCkge1xuICAgIGlmIChJcy5leGlzdCh0aGlzLl9fdHJhbnNsYXRpb25HaXptbykgJiYgdGhpcy5fX3RyYW5zbGF0aW9uR2l6bW8uaXNTZXR1cCAmJiB0aGlzLl9fdHJhbnNsYXRpb25HaXptby5pc1Zpc2libGUpIHtcbiAgICAgIHRoaXMuX190cmFuc2xhdGlvbkdpem1vLl91cGRhdGUoKTtcbiAgICB9XG4gICAgaWYgKElzLmV4aXN0KHRoaXMuX19yb3RhdGlvbkdpem1vKSAmJiB0aGlzLl9fcm90YXRpb25HaXptby5pc1NldHVwICYmIHRoaXMuX19yb3RhdGlvbkdpem1vLmlzVmlzaWJsZSkge1xuICAgICAgdGhpcy5fX3JvdGF0aW9uR2l6bW8uX3VwZGF0ZSgpO1xuICAgIH1cbiAgICBpZiAoSXMuZXhpc3QodGhpcy5fX3NjYWxlR2l6bW8pICYmIHRoaXMuX19zY2FsZUdpem1vLmlzU2V0dXAgJiYgdGhpcy5fX3NjYWxlR2l6bW8uaXNWaXNpYmxlKSB7XG4gICAgICB0aGlzLl9fc2NhbGVHaXptby5fdXBkYXRlKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIGFueSB0cmFuc2Zvcm0gZ2l6bW8gaXMgc2V0IHVwIGFuZCB2aXNpYmxlIG9uIHRoaXMgbm9kZS5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiBhdCBsZWFzdCBvbmUgb2YgdGhlIHRyYW5zbGF0aW9uL3JvdGF0aW9uL3NjYWxlIGdpem1vcyBpcyB2aXNpYmxlXG4gICAqL1xuICBwcml2YXRlIF9faGFzVmlzaWJsZVRyYW5zZm9ybUdpem1vKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoXG4gICAgICAoSXMuZXhpc3QodGhpcy5fX3RyYW5zbGF0aW9uR2l6bW8pICYmIHRoaXMuX190cmFuc2xhdGlvbkdpem1vLmlzU2V0dXAgJiYgdGhpcy5fX3RyYW5zbGF0aW9uR2l6bW8uaXNWaXNpYmxlKSB8fFxuICAgICAgKElzLmV4aXN0KHRoaXMuX19yb3RhdGlvbkdpem1vKSAmJiB0aGlzLl9fcm90YXRpb25HaXptby5pc1NldHVwICYmIHRoaXMuX19yb3RhdGlvbkdpem1vLmlzVmlzaWJsZSkgfHxcbiAgICAgIChJcy5leGlzdCh0aGlzLl9fc2NhbGVHaXptbykgJiYgdGhpcy5fX3NjYWxlR2l6bW8uaXNTZXR1cCAmJiB0aGlzLl9fc2NhbGVHaXptby5pc1Zpc2libGUpXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgdGhpcyBub2RlIGFzIGFuIG93bmVyIG9mIGEgdmlzaWJsZSB0cmFuc2Zvcm0gZ2l6bW8gc28gdGhhdCB0aGVcbiAgICogZ2l6bW9zIGNhbiBiZSByZXNjYWxlZCB3aGVuIG9ubHkgdGhlIGNhbWVyYSBjaGFuZ2VkLlxuICAgKi9cbiAgcHJpdmF0ZSBfX3JlZ2lzdGVyVHJhbnNmb3JtR2l6bW9Pd25lcigpOiB2b2lkIHtcbiAgICBjb25zdCBlbmdpbmVVaWQgPSB0aGlzLl9fZW5naW5lLm9iamVjdFVJRDtcbiAgICBsZXQgb3duZXJzID0gU2NlbmVHcmFwaENvbXBvbmVudC5fX3RyYW5zZm9ybUdpem1vT3duZXJzLmdldChlbmdpbmVVaWQpO1xuICAgIGlmIChvd25lcnMgPT0gbnVsbCkge1xuICAgICAgb3duZXJzID0gbmV3IFNldCgpO1xuICAgICAgU2NlbmVHcmFwaENvbXBvbmVudC5fX3RyYW5zZm9ybUdpem1vT3duZXJzLnNldChlbmdpbmVVaWQsIG93bmVycyk7XG4gICAgfVxuICAgIG93bmVycy5hZGQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyB0aGlzIG5vZGUgZnJvbSB0aGUgdHJhbnNmb3JtIGdpem1vIHJlZ2lzdHJ5IHdoZW4gbm8gdHJhbnNmb3JtIGdpem1vIGlzIHZpc2libGUuXG4gICAqL1xuICBwcml2YXRlIF9fdW5yZWdpc3RlclRyYW5zZm9ybUdpem1vT3duZXJJZk5lZWRlZCgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX19oYXNWaXNpYmxlVHJhbnNmb3JtR2l6bW8oKSkge1xuICAgICAgU2NlbmVHcmFwaENvbXBvbmVudC5fX3RyYW5zZm9ybUdpem1vT3duZXJzLmdldCh0aGlzLl9fZW5naW5lLm9iamVjdFVJRCk/LmRlbGV0ZSh0aGlzKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmUtYXBwbGllcyB0aGUgc2NyZWVuLXNwYWNlIGdpem1vIHNjYWxlIGFmdGVyIHRoZSBjYW1lcmEgaGFzIGJlZW4gdXBkYXRlZC5cbiAgICpcbiAgICogVGhlIHRyYW5zZm9ybSBnaXptb3Mga2VlcCBhIGNvbnN0YW50IG9uLXNjcmVlbiBzaXplLCBzbyB0aGV5IG11c3QgYmUgcmVzY2FsZWQgd2hlbmV2ZXIgdGhlXG4gICAqIGNhbWVyYSBjaGFuZ2VzLiBTY2VuZUdyYXBoQ29tcG9uZW50IChUSUQgNCkgaXMgcHJvY2Vzc2VkIGJlZm9yZSBDYW1lcmFDb21wb25lbnQgKFRJRCA5KSBpblxuICAgKiB0aGUgTG9naWMgc3RhZ2UsIHNvIHRoaXMgaXMgY2FsbGVkIGJ5IHRoZSBFbmdpbmUgcmlnaHQgYWZ0ZXIgdGhlIExvZ2ljIHN0YWdlIGhhcyBmaW5pc2hlZCxcbiAgICogd2hpY2ggYWxzbyBjb3ZlcnMgZnJhbWVzIGluIHdoaWNoIHRoZSBFbmdpbmUgc2tpcHMgdGhlIExvZ2ljIHN0YWdlIGVudGlyZWx5LlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSB3aG9zZSBjdXJyZW50IGNhbWVyYSBtYXkgaGF2ZSBjaGFuZ2VkXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIF91cGRhdGVUcmFuc2Zvcm1HaXptb3NCeUNhbWVyYUNoYW5nZShlbmdpbmU6IEVuZ2luZSk6IHZvaWQge1xuICAgIGNvbnN0IGNvbXBvbmVudFNJRCA9IENhbWVyYUNvbXBvbmVudC5nZXRDdXJyZW50KGVuZ2luZSk7XG4gICAgY29uc3QgdXBkYXRlQ291bnQgPSBDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudENhbWVyYVVwZGF0ZUNvdW50KGVuZ2luZSk7XG4gICAgY29uc3QgZW5naW5lVWlkID0gZW5naW5lLm9iamVjdFVJRDtcblxuICAgIGNvbnN0IGxhc3RDYW1lcmFTdGF0ZSA9IFNjZW5lR3JhcGhDb21wb25lbnQuX19sYXN0Q2FtZXJhU3RhdGVNYXAuZ2V0KGVuZ2luZVVpZCk7XG4gICAgaWYgKFxuICAgICAgbGFzdENhbWVyYVN0YXRlICE9IG51bGwgJiZcbiAgICAgIGxhc3RDYW1lcmFTdGF0ZS5jb21wb25lbnRTSUQgPT09IGNvbXBvbmVudFNJRCAmJlxuICAgICAgbGFzdENhbWVyYVN0YXRlLnVwZGF0ZUNvdW50ID09PSB1cGRhdGVDb3VudFxuICAgICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBTY2VuZUdyYXBoQ29tcG9uZW50Ll9fbGFzdENhbWVyYVN0YXRlTWFwLnNldChlbmdpbmVVaWQsIHsgY29tcG9uZW50U0lELCB1cGRhdGVDb3VudCB9KTtcblxuICAgIGNvbnN0IG93bmVycyA9IFNjZW5lR3JhcGhDb21wb25lbnQuX190cmFuc2Zvcm1HaXptb093bmVycy5nZXQoZW5naW5lVWlkKTtcbiAgICBpZiAob3duZXJzID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZm9yIChjb25zdCBzY2VuZUdyYXBoIG9mIG93bmVycykge1xuICAgICAgc2NlbmVHcmFwaC5fX3VwZGF0ZVRyYW5zZm9ybUdpem1vcygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB3b3JsZCBwb3NpdGlvbiB3aXRob3V0IHVwZGF0aW5nIHBoeXNpY3Mgc2ltdWxhdGlvbi5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSB3b3JsZCBwb3NpdGlvbiB0byBzZXRcbiAgICovXG4gIHNldFBvc2l0aW9uV2l0aG91dFBoeXNpY3ModmVjOiBJVmVjdG9yMykge1xuICAgIGlmIChJcy5ub3QuZXhpc3QodGhpcy5fX3BhcmVudCkpIHtcbiAgICAgIHRoaXMuZW50aXR5LmdldFRyYW5zZm9ybSgpLmxvY2FsUG9zaXRpb25XaXRob3V0UGh5c2ljcyA9IHZlYztcbiAgICB9IGVsc2Uge1xuICAgICAgTXV0YWJsZU1hdHJpeDQ0LmludmVydFRvKHRoaXMuX19wYXJlbnQuZW50aXR5LmdldFNjZW5lR3JhcGgoKS5tYXRyaXhJbm5lciwgU2NlbmVHcmFwaENvbXBvbmVudC5fX3RtcF9tYXQ0KTtcbiAgICAgIHRoaXMuZW50aXR5LmdldFRyYW5zZm9ybSgpLmxvY2FsUG9zaXRpb25XaXRob3V0UGh5c2ljcyA9IFNjZW5lR3JhcGhDb21wb25lbnQuX190bXBfbWF0NC5tdWx0aXBseVZlY3RvcjModmVjKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgd29ybGQgcG9zaXRpb24gYW5kIHVwZGF0ZXMgcGh5c2ljcyBzaW11bGF0aW9uIGlmIHByZXNlbnQuXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgd29ybGQgcG9zaXRpb24gdG8gc2V0XG4gICAqL1xuICBzZXQgcG9zaXRpb24odmVjOiBJVmVjdG9yMykge1xuICAgIHRoaXMuc2V0UG9zaXRpb25XaXRob3V0UGh5c2ljcyh2ZWMpO1xuICAgIHRoaXMuc2V0UG9zaXRpb25Ub1BoeXNpY3ModmVjKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBwaHlzaWNzIHNpbXVsYXRpb24gd2l0aCB0aGUgbmV3IHBvc2l0aW9uLlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHdvcmxkIHBvc2l0aW9uIHRvIHNldCBpbiBwaHlzaWNzXG4gICAqL1xuICBzZXRQb3NpdGlvblRvUGh5c2ljcyh2ZWM6IElWZWN0b3IzKSB7XG4gICAgY29uc3QgcGh5c2ljc0NvbXBvbmVudCA9IHRoaXMuZW50aXR5LnRyeVRvR2V0UGh5c2ljcygpO1xuICAgIGlmIChwaHlzaWNzQ29tcG9uZW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmIChwaHlzaWNzQ29tcG9uZW50LnN0cmF0ZWd5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcGh5c2ljc0NvbXBvbmVudC5zdHJhdGVneS5zZXRQb3NpdGlvbj8uKHZlYyk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX19zeW5jRGVzY2VuZGFudFBoeXNpY3NUcmFuc2Zvcm1zKHRydWUsIGZhbHNlLCBmYWxzZSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgd29ybGQgcG9zaXRpb24gb2YgdGhpcyBub2RlLlxuICAgKiBAcmV0dXJucyBUaGUgd29ybGQgcG9zaXRpb25cbiAgICovXG4gIGdldCBwb3NpdGlvbigpOiBNdXRhYmxlVmVjdG9yMyB7XG4gICAgcmV0dXJuIHRoaXMubWF0cml4SW5uZXIuZ2V0VHJhbnNsYXRlKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgd29ybGQgcG9zaXRpb24gYW5kIHN0b3JlcyBpdCBpbiB0aGUgb3V0cHV0IHZlY3Rvci5cbiAgICogQHBhcmFtIG91dFZlYyAtIFRoZSBvdXRwdXQgdmVjdG9yIHRvIHN0b3JlIHRoZSBwb3NpdGlvblxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHZlY3RvciBjb250YWluaW5nIHRoZSB3b3JsZCBwb3NpdGlvblxuICAgKi9cbiAgZ2V0UG9zaXRpb25UbyhvdXRWZWM6IE11dGFibGVWZWN0b3IzKTogTXV0YWJsZVZlY3RvcjMge1xuICAgIHJldHVybiB0aGlzLm1hdHJpeElubmVyLmdldFRyYW5zbGF0ZVRvKG91dFZlYyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgd29ybGQgcG9zaXRpb24gaW4gcmVzdCBwb3NlLlxuICAgKiBAcmV0dXJucyBUaGUgd29ybGQgcG9zaXRpb24gaW4gcmVzdCBwb3NlXG4gICAqL1xuICBnZXQgcG9zaXRpb25SZXN0KCk6IE11dGFibGVWZWN0b3IzIHtcbiAgICByZXR1cm4gdGhpcy5tYXRyaXhSZXN0SW5uZXIuZ2V0VHJhbnNsYXRlKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgd29ybGQgcG9zaXRpb24gaW4gcmVzdCBwb3NlIGFuZCBzdG9yZXMgaXQgaW4gdGhlIG91dHB1dCB2ZWN0b3IuXG4gICAqIEBwYXJhbSBvdXRWZWMgLSBUaGUgb3V0cHV0IHZlY3RvciB0byBzdG9yZSB0aGUgcG9zaXRpb25cbiAgICogQHJldHVybnMgVGhlIG91dHB1dCB2ZWN0b3IgY29udGFpbmluZyB0aGUgd29ybGQgcG9zaXRpb24gaW4gcmVzdCBwb3NlXG4gICAqL1xuICBnZXRQb3NpdGlvblJlc3RUbyhvdXRWZWM6IE11dGFibGVWZWN0b3IzKTogTXV0YWJsZVZlY3RvcjMge1xuICAgIHJldHVybiB0aGlzLm1hdHJpeFJlc3RJbm5lci5nZXRUcmFuc2xhdGVUbyhvdXRWZWMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHdvcmxkIHJvdGF0aW9uIHVzaW5nIEV1bGVyIGFuZ2xlcyBhbmQgdXBkYXRlcyBwaHlzaWNzIHNpbXVsYXRpb24gaWYgcHJlc2VudC5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSBFdWxlciBhbmdsZXMgKGluIHJhZGlhbnMpIHRvIHNldFxuICAgKi9cbiAgc2V0IGV1bGVyQW5nbGVzKHZlYzogSVZlY3RvcjMpIHtcbiAgICBpZiAoSXMubm90LmV4aXN0KHRoaXMuX19wYXJlbnQpKSB7XG4gICAgICB0aGlzLmVudGl0eS5nZXRUcmFuc2Zvcm0oKS5sb2NhbEV1bGVyQW5nbGVzV2l0aG91dFBoeXNpY3MgPSB2ZWM7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHF1YXQgPSBRdWF0ZXJuaW9uLmZyb21NYXRyaXgodGhpcy5fX3BhcmVudC5lbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLm1hdHJpeElubmVyKTtcbiAgICAgIGNvbnN0IGludlF1YXQgPSBRdWF0ZXJuaW9uLmludmVydChxdWF0KTtcbiAgICAgIGNvbnN0IHJvdGF0aW9uID0gUXVhdGVybmlvbi5mcm9tTWF0cml4KE1hdHJpeDQ0LnJvdGF0ZSh2ZWMpKTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFF1YXRlcm5pb24ubXVsdGlwbHkocm90YXRpb24sIGludlF1YXQpO1xuICAgICAgdGhpcy5lbnRpdHkuZ2V0VHJhbnNmb3JtKCkubG9jYWxFdWxlckFuZ2xlc1dpdGhvdXRQaHlzaWNzID0gcmVzdWx0LnRvRXVsZXJBbmdsZXMoKTtcbiAgICB9XG4gICAgdGhpcy5zZXRFdWxlckFuZ2xlc1RvUGh5c2ljcyh2ZWMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIHBoeXNpY3Mgc2ltdWxhdGlvbiB3aXRoIHRoZSBuZXcgRXVsZXIgYW5nbGVzLlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIEV1bGVyIGFuZ2xlcyAoaW4gcmFkaWFucykgdG8gc2V0IGluIHBoeXNpY3NcbiAgICovXG4gIHNldEV1bGVyQW5nbGVzVG9QaHlzaWNzKHZlYzogSVZlY3RvcjMpIHtcbiAgICBjb25zdCBwaHlzaWNzQ29tcG9uZW50ID0gdGhpcy5lbnRpdHkudHJ5VG9HZXRQaHlzaWNzKCk7XG4gICAgaWYgKHBoeXNpY3NDb21wb25lbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHBoeXNpY3NDb21wb25lbnQuc3RyYXRlZ3kgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb25zdCBzdHJhdGVneSA9IHBoeXNpY3NDb21wb25lbnQuc3RyYXRlZ3k7XG4gICAgICAgIGlmIChzdHJhdGVneS5zZXRFdWxlckFuZ2xlICE9IG51bGwpIHtcbiAgICAgICAgICBzdHJhdGVneS5zZXRFdWxlckFuZ2xlKHZlYyk7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RyYXRlZ3kuc2V0Um90YXRpb24gIT0gbnVsbCkge1xuICAgICAgICAgIHN0cmF0ZWd5LnNldFJvdGF0aW9uKFF1YXRlcm5pb24uZnJvbU1hdHJpeChNYXRyaXg0NC5yb3RhdGUodmVjKSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX19zeW5jUGh5c2ljc1RyYW5zZm9ybXNBZnRlclJvdGF0aW9uKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgd29ybGQgcm90YXRpb24gYXMgRXVsZXIgYW5nbGVzLlxuICAgKiBAcmV0dXJucyBUaGUgd29ybGQgcm90YXRpb24gYXMgRXVsZXIgYW5nbGVzIChpbiByYWRpYW5zKVxuICAgKi9cbiAgZ2V0IGV1bGVyQW5nbGVzKCk6IFZlY3RvcjMge1xuICAgIHJldHVybiB0aGlzLm1hdHJpeElubmVyLnRvRXVsZXJBbmdsZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB3b3JsZCByb3RhdGlvbiB3aXRob3V0IHVwZGF0aW5nIHBoeXNpY3Mgc2ltdWxhdGlvbi5cbiAgICogQHBhcmFtIHF1YXQgLSBUaGUgcXVhdGVybmlvbiByb3RhdGlvbiB0byBzZXRcbiAgICovXG4gIHNldFJvdGF0aW9uV2l0aG91dFBoeXNpY3MocXVhdDogSVF1YXRlcm5pb24pIHtcbiAgICBpZiAoSXMubm90LmV4aXN0KHRoaXMuX19wYXJlbnQpKSB7XG4gICAgICB0aGlzLmVudGl0eS5nZXRUcmFuc2Zvcm0oKS5sb2NhbFJvdGF0aW9uV2l0aG91dFBoeXNpY3MgPSBxdWF0O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBxdWF0SW5uZXIgPSB0aGlzLl9fcGFyZW50LmVudGl0eS5nZXRTY2VuZUdyYXBoKCkucm90YXRpb247XG4gICAgICBjb25zdCBpbnZRdWF0ID0gUXVhdGVybmlvbi5pbnZlcnQocXVhdElubmVyKTtcbiAgICAgIHRoaXMuZW50aXR5LmdldFRyYW5zZm9ybSgpLmxvY2FsUm90YXRpb25XaXRob3V0UGh5c2ljcyA9IFF1YXRlcm5pb24ubXVsdGlwbHkocXVhdCwgaW52UXVhdCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHdvcmxkIHJvdGF0aW9uIGFuZCB1cGRhdGVzIHBoeXNpY3Mgc2ltdWxhdGlvbiBpZiBwcmVzZW50LlxuICAgKiBAcGFyYW0gcXVhdCAtIFRoZSBxdWF0ZXJuaW9uIHJvdGF0aW9uIHRvIHNldFxuICAgKi9cbiAgc2V0IHJvdGF0aW9uKHF1YXQ6IElRdWF0ZXJuaW9uKSB7XG4gICAgdGhpcy5zZXRSb3RhdGlvbldpdGhvdXRQaHlzaWNzKHF1YXQpO1xuICAgIHRoaXMuc2V0Um90YXRpb25Ub1BoeXNpY3MocXVhdCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgcGh5c2ljcyBzaW11bGF0aW9uIHdpdGggdGhlIG5ldyByb3RhdGlvbi5cbiAgICogQHBhcmFtIHF1YXQgLSBUaGUgcXVhdGVybmlvbiByb3RhdGlvbiB0byBzZXQgaW4gcGh5c2ljc1xuICAgKi9cbiAgc2V0Um90YXRpb25Ub1BoeXNpY3MocXVhdDogSVF1YXRlcm5pb24pIHtcbiAgICBjb25zdCBwaHlzaWNzQ29tcG9uZW50ID0gdGhpcy5lbnRpdHkudHJ5VG9HZXRQaHlzaWNzKCk7XG4gICAgaWYgKHBoeXNpY3NDb21wb25lbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHBoeXNpY3NDb21wb25lbnQuc3RyYXRlZ3kgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb25zdCBzdHJhdGVneSA9IHBoeXNpY3NDb21wb25lbnQuc3RyYXRlZ3k7XG4gICAgICAgIGlmIChzdHJhdGVneS5zZXRSb3RhdGlvbiAhPSBudWxsKSB7XG4gICAgICAgICAgc3RyYXRlZ3kuc2V0Um90YXRpb24ocXVhdCk7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RyYXRlZ3kuc2V0RXVsZXJBbmdsZSAhPSBudWxsKSB7XG4gICAgICAgICAgc3RyYXRlZ3kuc2V0RXVsZXJBbmdsZShxdWF0LnRvRXVsZXJBbmdsZXNUbyhTY2VuZUdyYXBoQ29tcG9uZW50Ll9fdG1wX2V1bGVyKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fX3N5bmNQaHlzaWNzVHJhbnNmb3Jtc0FmdGVyUm90YXRpb24oKTtcbiAgfVxuXG4gIHByaXZhdGUgX19zeW5jUGh5c2ljc1RyYW5zZm9ybXNBZnRlclJvdGF0aW9uKCkge1xuICAgIGNvbnN0IHN0cmF0ZWd5ID0gdGhpcy5lbnRpdHkudHJ5VG9HZXRQaHlzaWNzKCk/LnN0cmF0ZWd5O1xuICAgIGlmIChzdHJhdGVneT8uc2V0U2NhbGUgIT0gbnVsbCkge1xuICAgICAgLy8gVHJhbnNmb3JtIHNldHRlcnMgdXBkYXRlIHRoZWlyIHBvc2UgYmVmb3JlIHRoaXMgY2FsbCwgd2hpbGUgdGhlIGNhY2hlZFxuICAgICAgLy8gd29ybGQgbWF0cml4IGlzIGRpcnRpZWQgbGF0ZXIgaW4gdGhlIGxvZ2ljIHN0YWdlLiBNYXRlcmlhbGl6ZSB0aGUgb2xkXG4gICAgICAvLyBjYWNoZSBmaXJzdCBzbyBkaXJ0eSBwcm9wYWdhdGlvbiBpcyBub3Qgc2tpcHBlZCwgdGhlbiByZXNvbHZlIHRoZSBuZXcgc2NhbGUuXG4gICAgICB0aGlzLm1hdHJpeElubmVyO1xuICAgICAgdGhpcy5zZXRXb3JsZE1hdHJpeERpcnR5KCk7XG4gICAgICBzdHJhdGVneS5zZXRTY2FsZSh0aGlzLl9nZXRQaHlzaWNzV29ybGRTY2FsZSh0aGlzLm1hdHJpeElubmVyKSk7XG4gICAgfVxuICAgIHRoaXMuX19zeW5jRGVzY2VuZGFudFBoeXNpY3NUcmFuc2Zvcm1zKHRydWUsIHRydWUsIHRydWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGNhY2hlZCB3b3JsZCByb3RhdGlvbiBpZiBpdCBpcyBkaXJ0eS5cbiAgICogVGhpcyBhdm9pZHMgcmVwZWF0ZWQgcmVjdXJzaXZlIHRyYXZlcnNhbCBhY3Jvc3MgdGhlIGhpZXJhcmNoeS5cbiAgICovXG4gIHByaXZhdGUgX19nZXRXb3JsZFJvdGF0aW9uSW5uZXIoKTogTXV0YWJsZVF1YXRlcm5pb24ge1xuICAgIGNvbnN0IGxvY2FsUm90YXRpb24gPSB0aGlzLmVudGl0eS5nZXRUcmFuc2Zvcm0oKS5sb2NhbFJvdGF0aW9uSW5uZXI7XG5cbiAgICBpZiAodGhpcy5fX3BhcmVudCA9PSBudWxsIHx8IHRoaXMudG9NYWtlV29ybGRNYXRyaXhUaGVTYW1lQXNMb2NhbE1hdHJpeCkge1xuICAgICAgaWYgKCF0aGlzLl9faXNXb3JsZFJvdGF0aW9uVXBUb0RhdGUpIHtcbiAgICAgICAgdGhpcy5fd29ybGRSb3RhdGlvbi5jb3B5Q29tcG9uZW50cyhsb2NhbFJvdGF0aW9uKTtcbiAgICAgICAgdGhpcy5fX2lzV29ybGRSb3RhdGlvblVwVG9EYXRlID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl93b3JsZFJvdGF0aW9uO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5fX2lzV29ybGRSb3RhdGlvblVwVG9EYXRlKSB7XG4gICAgICBRdWF0ZXJuaW9uLm11bHRpcGx5VG8odGhpcy5fX3BhcmVudC5fX2dldFdvcmxkUm90YXRpb25Jbm5lcigpLCBsb2NhbFJvdGF0aW9uLCB0aGlzLl93b3JsZFJvdGF0aW9uKTtcbiAgICAgIHRoaXMuX19pc1dvcmxkUm90YXRpb25VcFRvRGF0ZSA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX3dvcmxkUm90YXRpb247XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgd29ybGQgcm90YXRpb24gYXMgYSBxdWF0ZXJuaW9uLlxuICAgKiBAcmV0dXJucyBUaGUgd29ybGQgcm90YXRpb24gcXVhdGVybmlvblxuICAgKi9cbiAgZ2V0IHJvdGF0aW9uKCk6IFF1YXRlcm5pb24ge1xuICAgIHJldHVybiB0aGlzLnJvdGF0aW9uSW5uZXIuY2xvbmUoKTtcbiAgfVxuXG4gIGdldCByb3RhdGlvbklubmVyKCk6IFF1YXRlcm5pb24ge1xuICAgIGlmICh0aGlzLl9fcGFyZW50ID09IG51bGwgfHwgdGhpcy50b01ha2VXb3JsZE1hdHJpeFRoZVNhbWVBc0xvY2FsTWF0cml4KSB7XG4gICAgICByZXR1cm4gdGhpcy5lbnRpdHkuZ2V0VHJhbnNmb3JtKCkubG9jYWxSb3RhdGlvbklubmVyO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9fZ2V0V29ybGRSb3RhdGlvbklubmVyKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgd29ybGQgcm90YXRpb24gYW5kIHN0b3JlcyBpdCBpbiB0aGUgb3V0cHV0IHF1YXRlcm5pb24uXG4gICAqIEBwYXJhbSBvdXRRdWF0IC0gVGhlIG91dHB1dCBxdWF0ZXJuaW9uIHRvIHN0b3JlIHRoZSByb3RhdGlvblxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHF1YXRlcm5pb24gY29udGFpbmluZyB0aGUgd29ybGQgcm90YXRpb25cbiAgICovXG4gIGdldFJvdGF0aW9uVG8ob3V0UXVhdDogTXV0YWJsZVF1YXRlcm5pb24pOiBNdXRhYmxlUXVhdGVybmlvbiB7XG4gICAgY29uc3Qgd29ybGRSb3RhdGlvbiA9IHRoaXMuX19nZXRXb3JsZFJvdGF0aW9uSW5uZXIoKTtcbiAgICBvdXRRdWF0LnNldENvbXBvbmVudHMod29ybGRSb3RhdGlvbi5fdlswXSwgd29ybGRSb3RhdGlvbi5fdlsxXSwgd29ybGRSb3RhdGlvbi5fdlsyXSwgd29ybGRSb3RhdGlvbi5fdlszXSk7XG4gICAgcmV0dXJuIG91dFF1YXQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgd29ybGQgcm90YXRpb24gaW4gcmVzdCBwb3NlLlxuICAgKiBAcmV0dXJucyBUaGUgd29ybGQgcm90YXRpb24gcXVhdGVybmlvbiBpbiByZXN0IHBvc2VcbiAgICovXG4gIGdldCByb3RhdGlvblJlc3QoKTogUXVhdGVybmlvbiB7XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5wYXJlbnQ7XG4gICAgaWYgKHBhcmVudCAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gUXVhdGVybmlvbi5tdWx0aXBseShwYXJlbnQucm90YXRpb25SZXN0LCB0aGlzLmVudGl0eS5nZXRUcmFuc2Zvcm0oKS5sb2NhbFJvdGF0aW9uUmVzdElubmVyKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZW50aXR5LmdldFRyYW5zZm9ybSgpLmxvY2FsUm90YXRpb25SZXN0SW5uZXI7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgd29ybGQgcm90YXRpb24gaW4gcmVzdCBwb3NlIHdpdGggY29uZGl0aW9uYWwgdGVybWluYXRpb24uXG4gICAqIEBwYXJhbSBlbmRGbiAtIEZ1bmN0aW9uIHRvIGRldGVybWluZSBpZiByZWN1cnNpb24gc2hvdWxkIHN0b3AgYXQgdGhpcyBub2RlXG4gICAqIEByZXR1cm5zIFRoZSB3b3JsZCByb3RhdGlvbiBxdWF0ZXJuaW9uIGluIHJlc3QgcG9zZVxuICAgKi9cbiAgZ2V0Um90YXRpb25SZXN0KGVuZEZuOiAoc2c6IFNjZW5lR3JhcGhDb21wb25lbnQpID0+IGJvb2xlYW4pOiBRdWF0ZXJuaW9uIHtcbiAgICBjb25zdCBwYXJlbnQgPSB0aGlzLnBhcmVudDtcbiAgICBpZiAocGFyZW50ICE9IG51bGwgJiYgIWVuZEZuKHRoaXMpKSB7XG4gICAgICByZXR1cm4gUXVhdGVybmlvbi5tdWx0aXBseShwYXJlbnQuZ2V0Um90YXRpb25SZXN0KGVuZEZuKSwgdGhpcy5lbnRpdHkuZ2V0VHJhbnNmb3JtKCkubG9jYWxSb3RhdGlvblJlc3RJbm5lcik7XG4gICAgfVxuICAgIHJldHVybiBRdWF0ZXJuaW9uLmlkZW50aXR5KCk7XG5cbiAgICAvLyByZXR1cm4gdGhpcy5lbnRpdHkuZ2V0VHJhbnNmb3JtKCkubG9jYWxSb3RhdGlvblJlc3RJbm5lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB3b3JsZCBzY2FsZSBhbmQgdXBkYXRlcyBwaHlzaWNzIHNpbXVsYXRpb24gaWYgcHJlc2VudC5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSBzY2FsZSB2ZWN0b3IgdG8gc2V0XG4gICAqL1xuICBzZXQgc2NhbGUodmVjOiBJVmVjdG9yMykge1xuICAgIGlmIChJcy5ub3QuZXhpc3QodGhpcy5fX3BhcmVudCkpIHtcbiAgICAgIHRoaXMuZW50aXR5LmdldFRyYW5zZm9ybSgpLmxvY2FsU2NhbGVXaXRob3V0UGh5c2ljcyA9IHZlYztcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgbWF0ID0gdGhpcy5fX3BhcmVudC5lbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLm1hdHJpeDtcbiAgICAgIG1hdC5fdlsxMl0gPSAwO1xuICAgICAgbWF0Ll92WzEzXSA9IDA7XG4gICAgICBtYXQuX3ZbMTRdID0gMDtcbiAgICAgIGNvbnN0IGludk1hdCA9IE11dGFibGVNYXRyaXg0NC5pbnZlcnQobWF0KTtcbiAgICAgIHRoaXMuZW50aXR5LmdldFRyYW5zZm9ybSgpLmxvY2FsU2NhbGVXaXRob3V0UGh5c2ljcyA9IGludk1hdC5tdWx0aXBseVZlY3RvcjModmVjKTtcbiAgICB9XG4gICAgdGhpcy5zZXRTY2FsZVRvUGh5c2ljcyh2ZWMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIHBoeXNpY3Mgc2ltdWxhdGlvbiB3aXRoIHRoZSBuZXcgc2NhbGUuXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgc2NhbGUgdmVjdG9yIHRvIHNldCBpbiBwaHlzaWNzXG4gICAqL1xuICBzZXRTY2FsZVRvUGh5c2ljcyh2ZWM6IElWZWN0b3IzKSB7XG4gICAgY29uc3QgcGh5c2ljc0NvbXBvbmVudCA9IHRoaXMuZW50aXR5LnRyeVRvR2V0UGh5c2ljcygpO1xuICAgIGlmIChwaHlzaWNzQ29tcG9uZW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmIChwaHlzaWNzQ29tcG9uZW50LnN0cmF0ZWd5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcGh5c2ljc0NvbXBvbmVudC5zdHJhdGVneS5zZXRTY2FsZT8uKHZlYyk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX19zeW5jRGVzY2VuZGFudFBoeXNpY3NUcmFuc2Zvcm1zKHRydWUsIHRydWUsIHRydWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHdvcmxkIHNjYWxlIG9mIHRoaXMgbm9kZS5cbiAgICogQHJldHVybnMgVGhlIHdvcmxkIHNjYWxlIHZlY3RvclxuICAgKi9cbiAgZ2V0IHNjYWxlKCk6IE11dGFibGVWZWN0b3IzIHtcbiAgICByZXR1cm4gdGhpcy5tYXRyaXhJbm5lci5nZXRTY2FsZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc29sdmVzIHdvcmxkLXNjYWxlIG1hZ25pdHVkZXMgd2l0aCBzaWducyByZWxhdGl2ZSB0byB0aGUgZW50aXR5J3MgcHJvcGVyIHdvcmxkIHJvdGF0aW9uLlxuICAgKiBQaHlzaWNzIGJvZGllcyB1c2UgdGhhdCByb3RhdGlvbiBzZXBhcmF0ZWx5LCBzbyByZWZsZWN0ZWQgbG9jYWwgb2Zmc2V0cyBuZWVkIHRoZXNlIHNpZ25zLlxuICAgKlxuICAgKiBUaGUgcmV0dXJuZWQgdmVjdG9yIGlzIGEgc2hhcmVkIHJldXNhYmxlIGluc3RhbmNlLCBzbyBjYWxsZXJzIG11c3QgY29weSBpdFxuICAgKiB3aGVuIHRoZXkgbmVlZCB0byBrZWVwIHRoZSB2YWx1ZXMgYXJvdW5kLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9nZXRQaHlzaWNzV29ybGRTY2FsZShtYXRyaXg6IElNYXRyaXg0NCA9IHRoaXMubWF0cml4SW5uZXIpOiBJVmVjdG9yMyB7XG4gICAgY29uc3Qgcm90YXRpb24gPSB0aGlzLmdldFF1YXRlcm5pb25SZWN1cnNpdmVseVRvKFNjZW5lR3JhcGhDb21wb25lbnQuX190bXBfcXVhdF8yKTtcbiAgICBjb25zdCBheGlzWCA9IHJvdGF0aW9uLnRyYW5zZm9ybVZlY3RvcjNUbyhTY2VuZUdyYXBoQ29tcG9uZW50Ll9fYXhpc1gsIFNjZW5lR3JhcGhDb21wb25lbnQuX190bXBfdmVjM18wKTtcbiAgICBjb25zdCBheGlzWSA9IHJvdGF0aW9uLnRyYW5zZm9ybVZlY3RvcjNUbyhTY2VuZUdyYXBoQ29tcG9uZW50Ll9fYXhpc1ksIFNjZW5lR3JhcGhDb21wb25lbnQuX190bXBfdmVjM18xKTtcbiAgICBjb25zdCBheGlzWiA9IHJvdGF0aW9uLnRyYW5zZm9ybVZlY3RvcjNUbyhTY2VuZUdyYXBoQ29tcG9uZW50Ll9fYXhpc1osIFNjZW5lR3JhcGhDb21wb25lbnQuX190bXBfdmVjM18yKTtcbiAgICBjb25zdCBzY2FsZSA9IG1hdHJpeC5nZXRTY2FsZVRvKFNjZW5lR3JhcGhDb21wb25lbnQuX190bXBfbWF0cml4U2NhbGUpO1xuICAgIGNvbnN0IHByb2plY3Rpb25YID0gbWF0cml4Lm0wMCAqIGF4aXNYLnggKyBtYXRyaXgubTEwICogYXhpc1gueSArIG1hdHJpeC5tMjAgKiBheGlzWC56O1xuICAgIGNvbnN0IHByb2plY3Rpb25ZID0gbWF0cml4Lm0wMSAqIGF4aXNZLnggKyBtYXRyaXgubTExICogYXhpc1kueSArIG1hdHJpeC5tMjEgKiBheGlzWS56O1xuICAgIGNvbnN0IHByb2plY3Rpb25aID0gbWF0cml4Lm0wMiAqIGF4aXNaLnggKyBtYXRyaXgubTEyICogYXhpc1oueSArIG1hdHJpeC5tMjIgKiBheGlzWi56O1xuICAgIHJldHVybiBTY2VuZUdyYXBoQ29tcG9uZW50Ll9fdG1wX3BoeXNpY3NXb3JsZFNjYWxlLnNldENvbXBvbmVudHMoXG4gICAgICBwcm9qZWN0aW9uWCA8IDAgPyAtc2NhbGUueCA6IHNjYWxlLngsXG4gICAgICBwcm9qZWN0aW9uWSA8IDAgPyAtc2NhbGUueSA6IHNjYWxlLnksXG4gICAgICBwcm9qZWN0aW9uWiA8IDAgPyAtc2NhbGUueiA6IHNjYWxlLnpcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBzaGFsbG93IGNvcHkgb2YgYSBjaGlsZCBzY2VuZSBncmFwaCBjb21wb25lbnQuXG4gICAqIEBwYXJhbSBjaGlsZCAtIFRoZSBjaGlsZCBjb21wb25lbnQgdG8gY29weVxuICAgKiBAcmV0dXJucyBBIG5ldyBzY2VuZSBncmFwaCBlbnRpdHkgd2l0aCBjb3BpZWQgY29tcG9uZW50XG4gICAqL1xuICBwcml2YXRlIF9fY29weUNoaWxkKGNoaWxkOiBTY2VuZUdyYXBoQ29tcG9uZW50KTogSVNjZW5lR3JhcGhFbnRpdHkge1xuICAgIGNvbnN0IG5ld0NoaWxkID0gY2hpbGQuZW50aXR5LmVuZ2luZS5lbnRpdHlSZXBvc2l0b3J5Ll9zaGFsbG93Q29weUVudGl0eUlubmVyKGNoaWxkLmVudGl0eSkgYXMgSVNjZW5lR3JhcGhFbnRpdHk7XG4gICAgbmV3Q2hpbGQuZ2V0U2NlbmVHcmFwaCgpLl9fcGFyZW50ID0gdGhpcztcbiAgICBTY2VuZUdyYXBoQ29tcG9uZW50Ll9fYnVtcEhpZXJhcmNoeVZlcnNpb24oKTtcbiAgICByZXR1cm4gbmV3Q2hpbGQ7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgYSBzaGFsbG93IGNvcHkgZnJvbSBhbm90aGVyIFNjZW5lR3JhcGhDb21wb25lbnQuXG4gICAqIEBwYXJhbSBjb21wb25lbnRfIC0gVGhlIHNvdXJjZSBjb21wb25lbnQgdG8gY29weSBmcm9tXG4gICAqL1xuICBfc2hhbGxvd0NvcHlGcm9tKGNvbXBvbmVudF86IENvbXBvbmVudCk6IHZvaWQge1xuICAgIGNvbnN0IGNvbXBvbmVudCA9IGNvbXBvbmVudF8gYXMgU2NlbmVHcmFwaENvbXBvbmVudDtcblxuICAgIHRoaXMuX19wYXJlbnQgPSBjb21wb25lbnQuX19wYXJlbnQ7XG4gICAgdGhpcy5fX2NoaWxkcmVuID0gW107XG4gICAgU2NlbmVHcmFwaENvbXBvbmVudC5fX2J1bXBIaWVyYXJjaHlWZXJzaW9uKCk7XG4gICAgdGhpcy5fX3BoeXNpY3NDb21wb25lbnRDb3VudEluU3VidHJlZSA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21wb25lbnQuX19jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgY29weUNoaWxkID0gdGhpcy5fX2NvcHlDaGlsZChjb21wb25lbnQuX19jaGlsZHJlbltpXSkuZ2V0U2NlbmVHcmFwaCgpO1xuICAgICAgdGhpcy5fX2NoaWxkcmVuLnB1c2goY29weUNoaWxkKTtcbiAgICAgIHRoaXMuX19hZGp1c3RQaHlzaWNzQ29tcG9uZW50Q291bnRJblN1YnRyZWUoY29weUNoaWxkLl9fcGh5c2ljc0NvbXBvbmVudENvdW50SW5TdWJ0cmVlKTtcbiAgICB9XG5cbiAgICB0aGlzLl9fZ2l6bW9DaGlsZHJlbiA9IGNvbXBvbmVudC5fX2dpem1vQ2hpbGRyZW4uY29uY2F0KCk7XG4gICAgdGhpcy5fX2lzR2l6bW9DaGlsZCA9IGNvbXBvbmVudC5fX2lzR2l6bW9DaGlsZDtcbiAgICB0aGlzLl93b3JsZE1hdHJpeC5jb3B5Q29tcG9uZW50cyhjb21wb25lbnQuX3dvcmxkTWF0cml4KTtcbiAgICB0aGlzLl9wcmV2aW91c1dvcmxkTWF0cml4LmNvcHlDb21wb25lbnRzKGNvbXBvbmVudC5fcHJldmlvdXNXb3JsZE1hdHJpeCk7XG4gICAgdGhpcy5fd29ybGRNYXRyaXhSZXN0LmNvcHlDb21wb25lbnRzKGNvbXBvbmVudC5fd29ybGRNYXRyaXhSZXN0KTtcbiAgICB0aGlzLl9ub3JtYWxNYXRyaXguY29weUNvbXBvbmVudHMoY29tcG9uZW50Ll9ub3JtYWxNYXRyaXgpO1xuICAgIHRoaXMuX19pc1dvcmxkTWF0cml4VXBUb0RhdGUgPSBmYWxzZTtcbiAgICB0aGlzLl9faXNXb3JsZE1hdHJpeFJlc3RVcFRvRGF0ZSA9IGZhbHNlO1xuICAgIHRoaXMuX19pc05vcm1hbE1hdHJpeFVwVG9EYXRlID0gZmFsc2U7XG4gICAgdGhpcy5fX2lzV29ybGRSb3RhdGlvblVwVG9EYXRlID0gZmFsc2U7XG4gICAgdGhpcy5fX3dvcmxkTWF0cml4VmVyc2lvbisrO1xuICAgIHRoaXMuX193b3JsZE1lcmdlZEFBQkJXaXRoU2tlbGV0YWwgPSBjb21wb25lbnQuX193b3JsZE1lcmdlZEFBQkJXaXRoU2tlbGV0YWwuY2xvbmUoKTtcbiAgICB0aGlzLl9faXNXb3JsZEFBQkJEaXJ0eSA9IHRydWU7XG4gICAgdGhpcy5fX2lzV29ybGRBQUJCRGlydHlXaXRoU2tlbGV0YWwgPSB0cnVlO1xuICAgIHRoaXMuX2lzVmlzaWJsZS5jb3B5Q29tcG9uZW50cyhjb21wb25lbnQuX2lzVmlzaWJsZSk7XG4gICAgdGhpcy5faXNCaWxsYm9hcmQuY29weUNvbXBvbmVudHMoY29tcG9uZW50Ll9pc0JpbGxib2FyZCk7XG4gICAgLy8gdGhpcy5fX2FhYmJHaXptbyA9IGNvbXBvbmVudC5fX2FhYmJHaXptbztcbiAgICAvLyB0aGlzLl9fbG9jYXRvckdpem1vID0gY29tcG9uZW50Ll9fbG9jYXRvckdpem1vO1xuICAgIC8vIHRoaXMuX190cmFuc2xhdGlvbkdpem1vID0gY29tcG9uZW50Ll9fdHJhbnNsYXRpb25HaXptbztcbiAgICAvLyB0aGlzLl9fc2NhbGVHaXptbyA9IGNvbXBvbmVudC5fX3NjYWxlR2l6bW87XG4gICAgdGhpcy5fX3RyYW5zZm9ybUdpem1vU3BhY2UgPSBjb21wb25lbnQuX190cmFuc2Zvcm1HaXptb1NwYWNlO1xuICAgIHRoaXMuX19sYXRlc3RQcmltaXRpdmVQb3NpdGlvbkFjY2Vzc29yVmVyc2lvbiA9IGNvbXBvbmVudC5fX2xhdGVzdFByaW1pdGl2ZVBvc2l0aW9uQWNjZXNzb3JWZXJzaW9uO1xuICAgIHRoaXMudG9NYWtlV29ybGRNYXRyaXhUaGVTYW1lQXNMb2NhbE1hdHJpeCA9IGNvbXBvbmVudC50b01ha2VXb3JsZE1hdHJpeFRoZVNhbWVBc0xvY2FsTWF0cml4O1xuICAgIHRoaXMuaXNSb290Sm9pbnQgPSBjb21wb25lbnQuaXNSb290Sm9pbnQ7XG4gICAgdGhpcy5qb2ludEluZGV4ID0gY29tcG9uZW50LmpvaW50SW5kZXg7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZW50aXR5IHdoaWNoIGhhcyB0aGlzIGNvbXBvbmVudC5cbiAgICogQHJldHVybnMgVGhlIGVudGl0eSB3aGljaCBoYXMgdGhpcyBjb21wb25lbnRcbiAgICovXG4gIGdldCBlbnRpdHkoKTogSVNjZW5lR3JhcGhFbnRpdHkge1xuICAgIHJldHVybiB0aGlzLl9fZW5naW5lLmVudGl0eVJlcG9zaXRvcnkuZ2V0RW50aXR5KHRoaXMuX19lbnRpdHlVaWQpIGFzIHVua25vd24gYXMgSVNjZW5lR3JhcGhFbnRpdHk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY29vcmRpbmF0ZSBzcGFjZSBmb3IgdHJhbnNmb3JtYXRpb24gZ2l6bW9zLlxuICAgKiBAcGFyYW0gc3BhY2UgLSBUaGUgY29vcmRpbmF0ZSBzcGFjZSAoJ2xvY2FsJyBvciAnd29ybGQnKVxuICAgKi9cbiAgc2V0VHJhbnNmb3JtR2l6bW9TcGFjZShzcGFjZTogJ2xvY2FsJyB8ICd3b3JsZCcpIHtcbiAgICB0aGlzLl9fdHJhbnNmb3JtR2l6bW9TcGFjZSA9IHNwYWNlO1xuICAgIHRoaXMuX190cmFuc2xhdGlvbkdpem1vPy5zZXRTcGFjZShzcGFjZSk7XG4gICAgdGhpcy5fX3JvdGF0aW9uR2l6bW8/LnNldFNwYWNlKHNwYWNlKTtcbiAgICB0aGlzLl9fc2NhbGVHaXptbz8uc2V0U3BhY2Uoc3BhY2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoaXMgY29tcG9uZW50IGFuZCBjbGVhbnMgdXAgcmVzb3VyY2VzLlxuICAgKi9cbiAgX2Rlc3Ryb3koKSB7XG4gICAgc3VwZXIuX2Rlc3Ryb3koKTtcbiAgICBTY2VuZUdyYXBoQ29tcG9uZW50Ll9fYnVtcEhpZXJhcmNoeVZlcnNpb24oKTtcbiAgICBTY2VuZUdyYXBoQ29tcG9uZW50Ll9fdHJhbnNmb3JtR2l6bW9Pd25lcnMuZ2V0KHRoaXMuX19lbmdpbmUub2JqZWN0VUlEKT8uZGVsZXRlKHRoaXMpO1xuICAgIHRoaXMuX19hYWJiR2l6bW8/Ll9kZXN0cm95KCk7XG4gICAgdGhpcy5fX2xvY2F0b3JHaXptbz8uX2Rlc3Ryb3koKTtcbiAgICB0aGlzLl9fdHJhbnNsYXRpb25HaXptbz8uX2Rlc3Ryb3koKTtcbiAgICB0aGlzLl9fcm90YXRpb25HaXptbz8uX2Rlc3Ryb3koKTtcbiAgICB0aGlzLl9fc2NhbGVHaXptbz8uX2Rlc3Ryb3koKTtcbiAgICB0aGlzLl9fam9pbnRHaXptbz8uX2Rlc3Ryb3koKTtcbiAgICAvLyB0aGlzLl9fZW50aXR5UmVwb3NpdG9yeS5yZW1vdmVFbnRpdHkodGhpcy5fX2VudGl0eVVpZCk7XG4gICAgdGhpcy5wYXJlbnQ/LnJlbW92ZUNoaWxkKHRoaXMpO1xuICAgIHRoaXMuY2hpbGRyZW4uZm9yRWFjaChjaGlsZCA9PiBjaGlsZC5wYXJlbnQ/LnJlbW92ZUNoaWxkKGNoaWxkKSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGlzIGNvbXBvbmVudCB0byBhbiBlbnRpdHkgYW5kIGV4dGVuZHMgaXQgd2l0aCBTY2VuZUdyYXBoIGZ1bmN0aW9uYWxpdHkuXG4gICAqIEBwYXJhbSBiYXNlIC0gVGhlIHRhcmdldCBlbnRpdHkgdG8gZXh0ZW5kXG4gICAqIEBwYXJhbSBfY29tcG9uZW50Q2xhc3MgLSBUaGUgY29tcG9uZW50IGNsYXNzIGJlaW5nIGFkZGVkICh1bnVzZWQpXG4gICAqIEByZXR1cm5zIFRoZSBleHRlbmRlZCBlbnRpdHkgd2l0aCBTY2VuZUdyYXBoIG1ldGhvZHNcbiAgICovXG4gIGFkZFRoaXNDb21wb25lbnRUb0VudGl0eTxFbnRpdHlCYXNlIGV4dGVuZHMgSUVudGl0eSwgU29tZUNvbXBvbmVudENsYXNzIGV4dGVuZHMgdHlwZW9mIENvbXBvbmVudD4oXG4gICAgYmFzZTogRW50aXR5QmFzZSxcbiAgICBfY29tcG9uZW50Q2xhc3M6IFNvbWVDb21wb25lbnRDbGFzc1xuICApIHtcbiAgICBjbGFzcyBTY2VuZUdyYXBoRW50aXR5IGV4dGVuZHMgKGJhc2UuY29uc3RydWN0b3IgYXMgYW55KSB7XG4gICAgICBwcml2YXRlIF9fc2NlbmVHcmFwaENvbXBvbmVudD86IFNjZW5lR3JhcGhDb21wb25lbnQ7XG5cbiAgICAgIC8qKlxuICAgICAgICogR2V0cyB0aGUgc2NlbmUgZ3JhcGggY29tcG9uZW50IGZvciB0aGlzIGVudGl0eS5cbiAgICAgICAqIEByZXR1cm5zIFRoZSBzY2VuZSBncmFwaCBjb21wb25lbnQgaW5zdGFuY2VcbiAgICAgICAqL1xuICAgICAgZ2V0U2NlbmVHcmFwaCgpOiBTY2VuZUdyYXBoQ29tcG9uZW50IHtcbiAgICAgICAgaWYgKHRoaXMuX19zY2VuZUdyYXBoQ29tcG9uZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aGlzLl9fc2NlbmVHcmFwaENvbXBvbmVudCA9IHRoaXMuZ2V0Q29tcG9uZW50QnlDb21wb25lbnRUSUQoXG4gICAgICAgICAgICBXZWxsS25vd25Db21wb25lbnRUSURzLlNjZW5lR3JhcGhDb21wb25lbnRUSURcbiAgICAgICAgICApIGFzIFNjZW5lR3JhcGhDb21wb25lbnQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX19zY2VuZUdyYXBoQ29tcG9uZW50O1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIEdldHMgdGhlIHBhcmVudCBzY2VuZSBncmFwaCBjb21wb25lbnQgb2YgdGhpcyBlbnRpdHkuXG4gICAgICAgKiBAcmV0dXJucyBUaGUgcGFyZW50IHNjZW5lIGdyYXBoIGNvbXBvbmVudCwgb3IgdW5kZWZpbmVkIGlmIHRoaXMgaXMgYSByb290IGVudGl0eVxuICAgICAgICovXG4gICAgICBnZXQgcGFyZW50KCk6IFNjZW5lR3JhcGhDb21wb25lbnQgfCB1bmRlZmluZWQge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRTY2VuZUdyYXBoKCkucGFyZW50O1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIEdldHMgdGhlIHdvcmxkIHRyYW5zZm9ybWF0aW9uIG1hdHJpeCBvZiB0aGlzIGVudGl0eS5cbiAgICAgICAqIEByZXR1cm5zIFRoZSB3b3JsZCB0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcbiAgICAgICAqL1xuICAgICAgZ2V0IG1hdHJpeCgpOiBJTWF0cml4NDQge1xuICAgICAgICBjb25zdCBzY2VuZUdyYXBoID0gdGhpcy5nZXRTY2VuZUdyYXBoKCk7XG4gICAgICAgIHJldHVybiBzY2VuZUdyYXBoLm1hdHJpeDtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBHZXRzIHRoZSBpbnRlcm5hbCBtdXRhYmxlIHdvcmxkIHRyYW5zZm9ybWF0aW9uIG1hdHJpeCBvZiB0aGlzIGVudGl0eS5cbiAgICAgICAqIEByZXR1cm5zIFRoZSBpbnRlcm5hbCB3b3JsZCB0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcbiAgICAgICAqL1xuICAgICAgZ2V0IG1hdHJpeElubmVyKCk6IElNYXRyaXg0NCB7XG4gICAgICAgIGNvbnN0IHNjZW5lR3JhcGggPSB0aGlzLmdldFNjZW5lR3JhcGgoKTtcbiAgICAgICAgcmV0dXJuIHNjZW5lR3JhcGgubWF0cml4SW5uZXI7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogR2V0cyB0aGUgd29ybGQgcG9zaXRpb24gb2YgdGhpcyBlbnRpdHkuXG4gICAgICAgKiBAcmV0dXJucyBUaGUgd29ybGQgcG9zaXRpb24gdmVjdG9yXG4gICAgICAgKi9cbiAgICAgIGdldCBwb3NpdGlvbigpOiBNdXRhYmxlVmVjdG9yMyB7XG4gICAgICAgIGNvbnN0IHNjZW5lR3JhcGggPSB0aGlzLmdldFNjZW5lR3JhcGgoKTtcbiAgICAgICAgcmV0dXJuIHNjZW5lR3JhcGgucG9zaXRpb247XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogU2V0cyB0aGUgd29ybGQgcG9zaXRpb24gb2YgdGhpcyBlbnRpdHkuXG4gICAgICAgKiBAcGFyYW0gdmVjIC0gVGhlIG5ldyB3b3JsZCBwb3NpdGlvbiB2ZWN0b3JcbiAgICAgICAqL1xuICAgICAgc2V0IHBvc2l0aW9uKHZlYzogSVZlY3RvcjMpIHtcbiAgICAgICAgY29uc3Qgc2NlbmVHcmFwaCA9IHRoaXMuZ2V0U2NlbmVHcmFwaCgpO1xuICAgICAgICBzY2VuZUdyYXBoLnBvc2l0aW9uID0gdmVjO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIEdldHMgdGhlIHJlc3QgcG9zZSB3b3JsZCBwb3NpdGlvbiBvZiB0aGlzIGVudGl0eS5cbiAgICAgICAqIEByZXR1cm5zIFRoZSByZXN0IHBvc2Ugd29ybGQgcG9zaXRpb24gdmVjdG9yXG4gICAgICAgKi9cbiAgICAgIGdldCBwb3NpdGlvblJlc3QoKTogTXV0YWJsZVZlY3RvcjMge1xuICAgICAgICBjb25zdCBzY2VuZUdyYXBoID0gdGhpcy5nZXRTY2VuZUdyYXBoKCk7XG4gICAgICAgIHJldHVybiBzY2VuZUdyYXBoLnBvc2l0aW9uUmVzdDtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBHZXRzIHRoZSB3b3JsZCBzY2FsZSBvZiB0aGlzIGVudGl0eS5cbiAgICAgICAqIEByZXR1cm5zIFRoZSB3b3JsZCBzY2FsZSB2ZWN0b3JcbiAgICAgICAqL1xuICAgICAgZ2V0IHNjYWxlKCk6IE11dGFibGVWZWN0b3IzIHtcbiAgICAgICAgY29uc3Qgc2NlbmVHcmFwaCA9IHRoaXMuZ2V0U2NlbmVHcmFwaCgpO1xuICAgICAgICByZXR1cm4gc2NlbmVHcmFwaC5zY2FsZTtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBTZXRzIHRoZSB3b3JsZCBzY2FsZSBvZiB0aGlzIGVudGl0eS5cbiAgICAgICAqIEBwYXJhbSB2ZWMgLSBUaGUgbmV3IHdvcmxkIHNjYWxlIHZlY3RvclxuICAgICAgICovXG4gICAgICBzZXQgc2NhbGUodmVjOiBJVmVjdG9yMykge1xuICAgICAgICBjb25zdCBzY2VuZUdyYXBoID0gdGhpcy5nZXRTY2VuZUdyYXBoKCk7XG4gICAgICAgIHNjZW5lR3JhcGguc2NhbGUgPSB2ZWM7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogR2V0cyB0aGUgd29ybGQgZXVsZXIgYW5nbGVzIG9mIHRoaXMgZW50aXR5LlxuICAgICAgICogQHJldHVybnMgVGhlIHdvcmxkIGV1bGVyIGFuZ2xlcyB2ZWN0b3JcbiAgICAgICAqL1xuICAgICAgZ2V0IGV1bGVyQW5nbGVzKCk6IFZlY3RvcjMge1xuICAgICAgICBjb25zdCBzY2VuZUdyYXBoID0gdGhpcy5nZXRTY2VuZUdyYXBoKCk7XG4gICAgICAgIHJldHVybiBzY2VuZUdyYXBoLmV1bGVyQW5nbGVzO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIFNldHMgdGhlIHdvcmxkIGV1bGVyIGFuZ2xlcyBvZiB0aGlzIGVudGl0eS5cbiAgICAgICAqIEBwYXJhbSB2ZWMgLSBUaGUgbmV3IHdvcmxkIGV1bGVyIGFuZ2xlcyB2ZWN0b3JcbiAgICAgICAqL1xuICAgICAgc2V0IGV1bGVyQW5nbGVzKHZlYzogSVZlY3RvcjMpIHtcbiAgICAgICAgY29uc3Qgc2NlbmVHcmFwaCA9IHRoaXMuZ2V0U2NlbmVHcmFwaCgpO1xuICAgICAgICBzY2VuZUdyYXBoLmV1bGVyQW5nbGVzID0gdmVjO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIEdldHMgdGhlIHdvcmxkIHJvdGF0aW9uIHF1YXRlcm5pb24gb2YgdGhpcyBlbnRpdHkuXG4gICAgICAgKiBAcmV0dXJucyBUaGUgd29ybGQgcm90YXRpb24gcXVhdGVybmlvblxuICAgICAgICovXG4gICAgICBnZXQgcm90YXRpb24oKTogUXVhdGVybmlvbiB7XG4gICAgICAgIGNvbnN0IHNjZW5lR3JhcGggPSB0aGlzLmdldFNjZW5lR3JhcGgoKTtcbiAgICAgICAgcmV0dXJuIHNjZW5lR3JhcGgucm90YXRpb247XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogU2V0cyB0aGUgd29ybGQgcm90YXRpb24gcXVhdGVybmlvbiBvZiB0aGlzIGVudGl0eS5cbiAgICAgICAqIEBwYXJhbSBxdWF0IC0gVGhlIG5ldyB3b3JsZCByb3RhdGlvbiBxdWF0ZXJuaW9uXG4gICAgICAgKi9cbiAgICAgIHNldCByb3RhdGlvbihxdWF0OiBJUXVhdGVybmlvbikge1xuICAgICAgICBjb25zdCBzY2VuZUdyYXBoID0gdGhpcy5nZXRTY2VuZUdyYXBoKCk7XG4gICAgICAgIHNjZW5lR3JhcGgucm90YXRpb24gPSBxdWF0O1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIEdldHMgdGhlIHJlc3QgcG9zZSB3b3JsZCByb3RhdGlvbiBxdWF0ZXJuaW9uIG9mIHRoaXMgZW50aXR5LlxuICAgICAgICogQHJldHVybnMgVGhlIHJlc3QgcG9zZSB3b3JsZCByb3RhdGlvbiBxdWF0ZXJuaW9uXG4gICAgICAgKi9cbiAgICAgIGdldCByb3RhdGlvblJlc3QoKTogUXVhdGVybmlvbiB7XG4gICAgICAgIGNvbnN0IHNjZW5lR3JhcGggPSB0aGlzLmdldFNjZW5lR3JhcGgoKTtcbiAgICAgICAgcmV0dXJuIHNjZW5lR3JhcGgucm90YXRpb25SZXN0O1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIEFkZHMgYSBjaGlsZCBzY2VuZSBncmFwaCBjb21wb25lbnQgdG8gdGhpcyBlbnRpdHkuXG4gICAgICAgKiBAcGFyYW0gc2cgLSBUaGUgc2NlbmUgZ3JhcGggY29tcG9uZW50IHRvIGFkZCBhcyBhIGNoaWxkXG4gICAgICAgKiBAcGFyYW0ga2VlcFBvc2VJbldvcmxkU3BhY2UgLSBXaGV0aGVyIHRvIGtlZXAgdGhlIGNoaWxkJ3Mgd29ybGQgcG9zZVxuICAgICAgICovXG4gICAgICBhZGRDaGlsZChzZzogU2NlbmVHcmFwaENvbXBvbmVudCwga2VlcFBvc2VJbldvcmxkU3BhY2UgPSBmYWxzZSk6IHZvaWQge1xuICAgICAgICBjb25zdCBzY2VuZUdyYXBoID0gdGhpcy5nZXRTY2VuZUdyYXBoKCk7XG4gICAgICAgIHNjZW5lR3JhcGguYWRkQ2hpbGQoc2csIGtlZXBQb3NlSW5Xb3JsZFNwYWNlKTtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBHZXRzIGFsbCBjaGlsZCBzY2VuZSBncmFwaCBjb21wb25lbnRzIG9mIHRoaXMgZW50aXR5LlxuICAgICAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgY2hpbGQgc2NlbmUgZ3JhcGggY29tcG9uZW50c1xuICAgICAgICovXG4gICAgICBnZXQgY2hpbGRyZW4oKTogU2NlbmVHcmFwaENvbXBvbmVudFtdIHtcbiAgICAgICAgY29uc3Qgc2NlbmVHcmFwaCA9IHRoaXMuZ2V0U2NlbmVHcmFwaCgpO1xuICAgICAgICByZXR1cm4gc2NlbmVHcmFwaC5jaGlsZHJlbjtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBSZW1vdmVzIGEgY2hpbGQgc2NlbmUgZ3JhcGggY29tcG9uZW50IGZyb20gdGhpcyBlbnRpdHkuXG4gICAgICAgKiBAcGFyYW0gc2cgLSBUaGUgc2NlbmUgZ3JhcGggY29tcG9uZW50IHRvIHJlbW92ZSBmcm9tIGNoaWxkcmVuXG4gICAgICAgKi9cbiAgICAgIHJlbW92ZUNoaWxkKHNnOiBTY2VuZUdyYXBoQ29tcG9uZW50KTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHNjZW5lR3JhcGggPSB0aGlzLmdldFNjZW5lR3JhcGgoKTtcbiAgICAgICAgc2NlbmVHcmFwaC5yZW1vdmVDaGlsZChzZyk7XG4gICAgICB9XG4gICAgfVxuICAgIGFwcGx5TWl4aW5zKGJhc2UsIFNjZW5lR3JhcGhFbnRpdHkpO1xuICAgIHJldHVybiBiYXNlIGFzIHVua25vd24gYXMgQ29tcG9uZW50VG9Db21wb25lbnRNZXRob2RzPFNvbWVDb21wb25lbnRDbGFzcz4gJiBFbnRpdHlCYXNlO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFucyB1cCBzdGF0aWMgcmVzb3VyY2VzIGFzc29jaWF0ZWQgd2l0aCB0aGUgc3BlY2lmaWVkIGVuZ2luZS5cbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2UgdG8gY2xlYW4gdXAgcmVzb3VyY2VzIGZvclxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHN0YXRpYyBfY2xlYW51cEZvckVuZ2luZShlbmdpbmU6IEVuZ2luZSk6IHZvaWQge1xuICAgIFNjZW5lR3JhcGhDb21wb25lbnQuX191cGRhdGVDb3VudE1hcC5kZWxldGUoZW5naW5lKTtcbiAgICBTY2VuZUdyYXBoQ29tcG9uZW50Ll9fdHJhbnNmb3JtR2l6bW9Pd25lcnMuZGVsZXRlKGVuZ2luZS5vYmplY3RVSUQpO1xuICAgIFNjZW5lR3JhcGhDb21wb25lbnQuX19sYXN0Q2FtZXJhU3RhdGVNYXAuZGVsZXRlKGVuZ2luZS5vYmplY3RVSUQpO1xuICB9XG59XG5TY2VuZUdyYXBoQ29tcG9uZW50LnJlZ2lzdGVyTWVtYmVyKHtcbiAgYnVmZmVyVXNlOiBCdWZmZXJVc2UuR1BVSW5zdGFuY2VEYXRhLFxuICBtZW1iZXJOYW1lOiAnd29ybGRNYXRyaXgnLFxuICBkYXRhQ2xhc3NUeXBlOiBNdXRhYmxlTWF0cml4NDQsXG4gIHNoYWRlclR5cGU6IFNoYWRlclR5cGUuVmVydGV4QW5kUGl4ZWxTaGFkZXIsXG4gIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLk1hdDQsXG4gIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gIGluaXRWYWx1ZXM6IFsxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxXSxcbn0pO1xuU2NlbmVHcmFwaENvbXBvbmVudC5yZWdpc3Rlck1lbWJlcih7XG4gIGJ1ZmZlclVzZTogQnVmZmVyVXNlLkdQVUluc3RhbmNlRGF0YSxcbiAgbWVtYmVyTmFtZTogJ25vcm1hbE1hdHJpeCcsXG4gIGRhdGFDbGFzc1R5cGU6IE11dGFibGVNYXRyaXgzMyxcbiAgc2hhZGVyVHlwZTogU2hhZGVyVHlwZS5WZXJ0ZXhBbmRQaXhlbFNoYWRlcixcbiAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuTWF0MyxcbiAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgaW5pdFZhbHVlczogWzEsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDFdLFxufSk7XG5TY2VuZUdyYXBoQ29tcG9uZW50LnJlZ2lzdGVyTWVtYmVyKHtcbiAgYnVmZmVyVXNlOiBCdWZmZXJVc2UuR1BVSW5zdGFuY2VEYXRhLFxuICBtZW1iZXJOYW1lOiAnaXNWaXNpYmxlJyxcbiAgZGF0YUNsYXNzVHlwZTogTXV0YWJsZVNjYWxhcixcbiAgc2hhZGVyVHlwZTogU2hhZGVyVHlwZS5WZXJ0ZXhTaGFkZXIsXG4gIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlNjYWxhcixcbiAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgaW5pdFZhbHVlczogWzFdLFxuICBjb252ZXJ0VG9Cb29sOiB0cnVlLFxufSk7XG5TY2VuZUdyYXBoQ29tcG9uZW50LnJlZ2lzdGVyTWVtYmVyKHtcbiAgYnVmZmVyVXNlOiBCdWZmZXJVc2UuR1BVSW5zdGFuY2VEYXRhLFxuICBtZW1iZXJOYW1lOiAnaXNCaWxsYm9hcmQnLFxuICBkYXRhQ2xhc3NUeXBlOiBNdXRhYmxlU2NhbGFyLFxuICBzaGFkZXJUeXBlOiBTaGFkZXJUeXBlLlZlcnRleFNoYWRlcixcbiAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuU2NhbGFyLFxuICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICBpbml0VmFsdWVzOiBbMF0sXG4gIGNvbnZlcnRUb0Jvb2w6IHRydWUsXG59KTtcbi8vIFJlZ2lzdGVyZWQgbGFzdCBzbyB0aGF0IHRoZSBsYXlvdXQgb2YgdGhlIG90aGVyIG1lbWJlcnMgZG9lcyBub3QgY2hhbmdlLlxuU2NlbmVHcmFwaENvbXBvbmVudC5yZWdpc3Rlck1lbWJlcih7XG4gIGJ1ZmZlclVzZTogQnVmZmVyVXNlLkdQVUluc3RhbmNlRGF0YSxcbiAgbWVtYmVyTmFtZTogJ3ByZXZpb3VzV29ybGRNYXRyaXgnLFxuICBkYXRhQ2xhc3NUeXBlOiBNdXRhYmxlTWF0cml4NDQsXG4gIHNoYWRlclR5cGU6IFNoYWRlclR5cGUuVmVydGV4U2hhZGVyLFxuICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5NYXQ0LFxuICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICBpbml0VmFsdWVzOiBbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMV0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxTQUFTLGlCQUFpQjtBQUUxQixTQUFTLG1CQUEwQztBQUNuRCxTQUFTLGlCQUFpQjtBQUMxQixTQUFTLHFCQUFxQjtBQUM5QixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLG9CQUFvQjtBQUM3QixTQUFTLGtCQUFrQjtBQUczQixTQUFTLHNCQUFzQjtBQU8vQixTQUFTLFlBQVk7QUFJckIsU0FBUyxnQkFBZ0I7QUFDekIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyx5QkFBeUI7QUFDbEMsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyxrQkFBa0I7QUFDM0IsU0FBUyxlQUFlO0FBRXhCLFNBQVMsVUFBVTtBQUVuQixTQUFTLHVCQUF1QjtBQUdoQyxTQUFTLDBCQUEwQjtBQUNuQyxTQUFTLDhCQUE4QjtBQUN2QyxTQUFTLHdCQUF3QjtBQU0xQixJQUFNLHVCQUFOLE1BQU0sNkJBQTRCLFVBQVU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUEyR2pELFlBQ0UsUUFDQSxXQUNBLGNBQ0Esa0JBQ0EsU0FDQTtBQUNBLFVBQU0sUUFBUSxXQUFXLGNBQWMsa0JBQWtCLE9BQU87QUFoSGxF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RUFDN0IsWUFBWSxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFDN0QsQ0FBQzsiLAogICJuYW1lcyI6IFsiX19jaGlsZHJlbiIsICJfX2dpem1vQ2hpbGRyZW4iLCAiX19pc0dpem1vQ2hpbGQiLCAiX19waHlzaWNzQ29tcG9uZW50Q291bnRJblN1YnRyZWUiLCAiX19pc1dvcmxkTWF0cml4VXBUb0RhdGUiLCAiX193b3JsZE1hdHJpeFZlcnNpb24iLCAiX19pc1dvcmxkTWF0cml4UmVzdFVwVG9EYXRlIiwgIl9faXNOb3JtYWxNYXRyaXhVcFRvRGF0ZSIsICJfX2lzV29ybGRSb3RhdGlvblVwVG9EYXRlIiwgIl9fd29ybGRNZXJnZWRBQUJCV2l0aFNrZWxldGFsIiwgIl9fd29ybGRNZXJnZWRBQUJCIiwgIl9faXNXb3JsZEFBQkJEaXJ0eSIsICJfX2lzV29ybGRBQUJCRGlydHlXaXRoU2tlbGV0YWwiLCAiX19hYWJiRGlydHlDaGFpbkVwb2NoIiwgIl9fc2V0dGxlZFdvcmxkTWF0cml4VmVyc2lvbiIsICJfX3NldHRsZWRDb21wb25lbnRDcmVhdGlvbkNvdW50IiwgIl9faGFzR2l6bW9zIiwgIl9fdHJhbnNmb3JtR2l6bW9TcGFjZSIsICJfX2xhdGVzdFByaW1pdGl2ZVBvc2l0aW9uQWNjZXNzb3JWZXJzaW9uIiwgIl9fbGFzdFRyYW5zZm9ybUNvbXBvbmVudHNVcGRhdGVDb3VudCIsICJfX3NjZW5lR3JhcGhzIiwgIl9faW5jcmVtZW50VXBkYXRlQ291bnQiLCAiX19lbmdpbmUiLCAiX191cGRhdGVDb3VudE1hcCIsICJfX2FhYmJHaXptbyIsICJfX2xvY2F0b3JHaXptbyIsICJfX3RyYW5zbGF0aW9uR2l6bW8iLCAiX19yZWdpc3RlclRyYW5zZm9ybUdpem1vT3duZXIiLCAiX191bnJlZ2lzdGVyVHJhbnNmb3JtR2l6bW9Pd25lcklmTmVlZGVkIiwgIl9fcm90YXRpb25HaXptbyIsICJfX3NjYWxlR2l6bW8iLCAiX19qb2ludEdpem1vIiwgIl9faGllcmFyY2h5VmVyc2lvbiIsICJfX2J1bXBIaWVyYXJjaHlWZXJzaW9uIiwgIl9fcGFyZW50IiwgIl9fYWRqdXN0UGh5c2ljc0NvbXBvbmVudENvdW50SW5TdWJ0cmVlIiwgIl9fY2FsY1dvcmxkTWF0cml4UmVjdXJzaXZlbHkiLCAiX190bXBfbWF0NF80IiwgIl9fdG1wX21hdDRfMyIsICJfX3NldE1hdHJpeFRvT3duUGh5c2ljcyIsICJfX3N5bmNEZXNjZW5kYW50UGh5c2ljc1RyYW5zZm9ybXMiLCAiX190bXBfcXVhdF8zIiwgIl9fdG1wX2V1bGVyIiwgIl9fdG1wX3RyYW5zbGF0ZSIsICJfX3N5bmNQaHlzaWNzVHJhbnNmb3JtUmVjdXJzaXZlbHkiLCAiX19jYWxjV29ybGRNYXRyaXhSZXN0UmVjdXJzaXZlbHkiLCAiX190bXBfcXVhdF8xIiwgIl9fdG1wX3F1YXRfMCIsICJfX29yaWdpblZlY3RvcjMiLCAiX190bXBfbWF0NCIsICJfX3RtcEFBQkIiLCAiX191cGRhdGVHaXptb3MiLCAiX191cGRhdGVUcmFuc2Zvcm1HaXptb3MiLCAiX19oYXNWaXNpYmxlVHJhbnNmb3JtR2l6bW8iLCAiX190cmFuc2Zvcm1HaXptb093bmVycyIsICJfX2xhc3RDYW1lcmFTdGF0ZU1hcCIsICJfX3N5bmNQaHlzaWNzVHJhbnNmb3Jtc0FmdGVyUm90YXRpb24iLCAiX19nZXRXb3JsZFJvdGF0aW9uSW5uZXIiLCAiX190bXBfcXVhdF8yIiwgIl9fYXhpc1giLCAiX190bXBfdmVjM18wIiwgIl9fYXhpc1kiLCAiX190bXBfdmVjM18xIiwgIl9fYXhpc1oiLCAiX190bXBfdmVjM18yIiwgIl9fdG1wX21hdHJpeFNjYWxlIiwgIl9fdG1wX3BoeXNpY3NXb3JsZFNjYWxlIiwgIl9fY29weUNoaWxkIiwgIl9fZW50aXR5VWlkIiwgIl9hIiwgIl9fc2NlbmVHcmFwaENvbXBvbmVudCJdCn0K
