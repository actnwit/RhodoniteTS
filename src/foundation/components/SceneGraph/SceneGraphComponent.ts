import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { EntityRepository, applyMixins } from '../../core/EntityRepository';
import { BufferUse } from '../../definitions/BufferUse';
import { ComponentType } from '../../definitions/ComponentType';
import { ProcessStage } from '../../definitions/ProcessStage';
import type { RaycastResultEx2 } from '../../geometry/types/GeometryTypes';
import { AABBGizmo } from '../../gizmos/AABBGizmo';
import { LocatorGizmo } from '../../gizmos/LocatorGizmo';
import { ScaleGizmo } from '../../gizmos/ScaleGizmo';
import { TranslationGizmo } from '../../gizmos/TranslationGizmo';
import { type IMeshEntity, type ISceneGraphEntity, ITransformEntity } from '../../helpers/EntityHelper';
import { AABB } from '../../math/AABB';
import type { IMatrix44 } from '../../math/IMatrix';
import type { IQuaternion } from '../../math/IQuaternion';
import type { IVector3 } from '../../math/IVector';
import { Matrix44 } from '../../math/Matrix44';
import { MutableMatrix33 } from '../../math/MutableMatrix33';
import { MutableMatrix44 } from '../../math/MutableMatrix44';
import { MutableQuaternion } from '../../math/MutableQuaternion';
import { MutableScalar } from '../../math/MutableScalar';
import { MutableVector3 } from '../../math/MutableVector3';
import { Quaternion } from '../../math/Quaternion';
import { Vector3 } from '../../math/Vector3';
import type { Vector4 } from '../../math/Vector4';
import { Is } from '../../misc/Is';
import { OimoPhysicsStrategy } from '../../physics/Oimo/OimoPhysicsStrategy';
import type { CameraComponent } from '../Camera/CameraComponent';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import type { MeshComponent } from '../Mesh/MeshComponent';
import { TransformComponent } from '../Transform/TransformComponent';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';
import { flattenHierarchy } from './SceneGraphOps';

/**
 * SceneGraphComponent is a component that represents a node in the scene graph.
 * It manages hierarchical relationships between entities and handles world matrix calculations.
 */
export class SceneGraphComponent extends Component {
  private __parent?: SceneGraphComponent;
  private __children: SceneGraphComponent[] = [];
  private __gizmoChildren: SceneGraphComponent[] = [];
  private _worldMatrix: MutableMatrix44 = MutableMatrix44.dummy();
  private _worldMatrixRest: MutableMatrix44 = MutableMatrix44.identity();
  private _normalMatrix: MutableMatrix33 = MutableMatrix33.dummy();
  private __isWorldMatrixUpToDate = false;
  private __isWorldMatrixRestUpToDate = false;
  private __isNormalMatrixUpToDate = false;
  private __worldMergedAABBWithSkeletal = new AABB();
  private __worldMergedAABB = new AABB();
  private __isWorldAABBDirty = true;
  private _isVisible: MutableScalar = MutableScalar.dummy();
  private _isBillboard: MutableScalar = MutableScalar.dummy();
  private __aabbGizmo?: AABBGizmo;
  private __locatorGizmo?: LocatorGizmo;
  private __translationGizmo?: TranslationGizmo;
  private __scaleGizmo?: ScaleGizmo;
  private __transformGizmoSpace: 'local' | 'world' = 'world';
  private __latestPrimitivePositionAccessorVersion = 0;
  public toMakeWorldMatrixTheSameAsLocalMatrix = false;
  // Skeletal
  public isRootJoint = false;
  public jointIndex = -1;
  _isCulled = false;
  private static readonly __originVector3 = Vector3.zero();
  private static returnVector3 = MutableVector3.zero();
  private static __sceneGraphs: WeakRef<SceneGraphComponent>[] = [];
  private static isJointAABBShouldBeCalculated = false;
  private static invertedMatrix44 = MutableMatrix44.fromCopyArray16ColumnMajor([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]);

  private static __tmp_mat4 = MutableMatrix44.identity();
  private static __tmp_mat4_2 = MutableMatrix44.identity();
  private static __tmp_mat4_3 = MutableMatrix44.identity();
  private static __tmp_mat4_4 = MutableMatrix44.identity();
  private static __tmp_quat_0 = MutableQuaternion.identity();
  private static __tmp_quat_1 = MutableQuaternion.identity();

  private static __updateCount = -1;

  private static __tmpAABB = new AABB();

  private __lastTransformComponentsUpdateCount = -1;

  /**
   * Creates a new SceneGraphComponent instance.
   * @param entityUid - The unique identifier of the entity this component belongs to
   * @param componentSid - The component instance identifier
   * @param entityRepository - The entity repository managing this component
   * @param isReUse - Whether this component is being reused
   */
  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean) {
    super(entityUid, componentSid, entityRepository, isReUse);

    SceneGraphComponent.__sceneGraphs.push(new WeakRef(this));

    this.registerMember(
      BufferUse.GPUInstanceData,
      'worldMatrix',
      MutableMatrix44,
      ComponentType.Float,
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    );
    this.registerMember(
      BufferUse.GPUInstanceData,
      'normalMatrix',
      MutableMatrix33,
      ComponentType.Float,
      [1, 0, 0, 0, 1, 0, 0, 0, 1]
    );
    this.registerMember(BufferUse.GPUInstanceData, 'isVisible', MutableScalar, ComponentType.Float, [1]);
    this.registerMember(BufferUse.GPUInstanceData, 'isBillboard', MutableScalar, ComponentType.Float, [0]);

    this.submitToAllocation(this.maxNumberOfComponent, isReUse);
  }

  /**
   * Sets the visibility of this scene graph node.
   * @param flg - True to make visible, false to hide
   */
  set isVisible(flg: boolean) {
    this._isVisible.setValue(flg ? 1 : 0);
    SceneGraphComponent.__updateCount++;
  }

  /**
   * Gets the visibility state of this scene graph node.
   * @returns True if visible, false if hidden
   */
  get isVisible() {
    return this._isVisible.getValue() === 1;
  }

  /**
   * Gets the current update count for scene graph changes.
   * @returns The current update count
   */
  static get updateCount() {
    return SceneGraphComponent.__updateCount;
  }

  /**
   * Sets the visibility of this node and all its children recursively.
   * @param flag - True to make visible, false to hide
   */
  setVisibilityRecursively(flag: boolean) {
    this.isVisible = flag;
    for (const child of this.__children) {
      child.setVisibilityRecursively(flag);
    }
  }

  /**
   * Sets the billboard state of this scene graph node.
   * @param flg - True to enable billboard behavior, false to disable
   */
  set isBillboard(flg: boolean) {
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
  setIsBillboardRecursively(flg: boolean) {
    this._isBillboard.setValue(flg ? 1 : 0);
    for (const child of this.__children) {
      child.isBillboard = flg;
    }
  }

  /**
   * Sets the visibility of the AABB (Axis-Aligned Bounding Box) gizmo.
   * @param flg - True to show the AABB gizmo, false to hide it
   */
  set isAABBGizmoVisible(flg: boolean) {
    if (flg) {
      if (Is.not.defined(this.__aabbGizmo)) {
        this.__aabbGizmo = new AABBGizmo(this.entity);
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
  set isLocatorGizmoVisible(flg: boolean) {
    if (flg) {
      if (Is.not.defined(this.__locatorGizmo)) {
        this.__locatorGizmo = new LocatorGizmo(this.entity as IMeshEntity);
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
  set isTranslationGizmoVisible(flg: boolean) {
    if (flg) {
      if (Is.not.defined(this.__translationGizmo)) {
        this.__translationGizmo = new TranslationGizmo(this.entity as IMeshEntity);
        this.__translationGizmo._setup();
      }
      this.__translationGizmo.isVisible = true;
    } else {
      if (Is.exist(this.__translationGizmo)) {
        this.__translationGizmo.isVisible = false;
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
   * Sets the visibility of the scale gizmo.
   * @param flg - True to show the scale gizmo, false to hide it
   */
  set isScaleGizmoVisible(flg: boolean) {
    if (flg) {
      if (Is.not.defined(this.__scaleGizmo)) {
        this.__scaleGizmo = new ScaleGizmo(this.entity as IMeshEntity);
        this.__scaleGizmo._setup();
      }
      this.__scaleGizmo.isVisible = true;
    } else {
      if (Is.exist(this.__scaleGizmo)) {
        this.__scaleGizmo.isVisible = false;
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
   * Gets all top-level scene graph components (nodes without parents).
   * @returns An array of scene graph components that are at the root level
   */
  static getTopLevelComponents(): SceneGraphComponent[] {
    return SceneGraphComponent.__sceneGraphs
      .map(sgRef => sgRef.deref())
      .filter((sg: SceneGraphComponent | undefined): sg is SceneGraphComponent => {
        if (sg !== undefined) {
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
  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.SceneGraphComponentTID;
  }

  /**
   * Gets the component type identifier for this instance.
   * @returns The component type ID
   */
  get componentTID(): ComponentTID {
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
    this.children.forEach(child => {
      child.setWorldMatrixRestDirtyRecursively();
    });
  }

  /**
   * Marks the world matrix as dirty and propagates changes up the hierarchy.
   */
  setWorldMatrixDirty() {
    this.setWorldMatrixDirtyRecursively();
    this.parent?.setWorldAABBDirtyParentRecursively();
  }

  /**
   * Recursively marks the world matrix as dirty for this node and all children.
   */
  setWorldMatrixDirtyRecursively() {
    this.__isWorldMatrixUpToDate = false;
    this.__isNormalMatrixUpToDate = false;
    this.__isWorldAABBDirty = true;

    this.children.forEach(child => {
      child.setWorldMatrixDirtyRecursively();
    });
  }

  /**
   * Recursively marks the world AABB as dirty up the parent hierarchy.
   */
  setWorldAABBDirtyParentRecursively() {
    this.__isWorldAABBDirty = true;
    this.parent?.setWorldAABBDirtyParentRecursively();
  }

  /**
   * Adds a SceneGraph component as a child of this node.
   * @param sg - The SceneGraph component to add as a child
   * @param keepPoseInWorldSpace - Whether to keep the child's world pose
   */
  public addChild(sg: SceneGraphComponent, keepPoseInWorldSpace = false): void {
    // When we need to keep the child's world pose, capture its world transform before reparenting.
    let worldMatrixBeforeReparent: MutableMatrix44 | undefined;

    if (keepPoseInWorldSpace) {
      sg.logicForce();
      worldMatrixBeforeReparent = sg.matrix;
    }

    if (Is.exist(sg.__parent)) {
      sg.__parent.removeChild(sg);
    }
    sg.__parent = this;
    this.__children.push(sg);

    if (keepPoseInWorldSpace) {
      if (Is.exist(worldMatrixBeforeReparent)) {
        sg.matrix = worldMatrixBeforeReparent;
      }
    }

    sg.setWorldMatrixDirtyRecursively();
  }

  /**
   * Removes a child SceneGraph component from this node.
   * @param sg - The SceneGraph component to remove
   */
  public removeChild(sg: SceneGraphComponent): void {
    const index = this.__children.indexOf(sg);
    if (index >= 0) {
      this.__children.splice(index, 1);
    }
    sg.__parent = undefined;
  }

  /**
   * Adds a SceneGraph component as a gizmo child (internal use only).
   * @param sg - The SceneGraph component of a gizmo to add
   */
  _addGizmoChild(sg: SceneGraphComponent): void {
    sg.__parent = this;
    this.__gizmoChildren.push(sg);
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
      this._worldMatrix.copyComponents(this.__calcWorldMatrixRecursively());
      this.__isWorldMatrixUpToDate = true;
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

  setMatrixWithoutPhysics(matrix: IMatrix44) {
    if (Is.not.exist(this.__parent)) {
      this.entity.getTransform().localMatrixWithoutPhysics = matrix;
    } else {
      const parent = this.__parent;
      const invMatrix = Matrix44.invertTo(parent.matrixInner, SceneGraphComponent.__tmp_mat4_4);
      this.entity.getTransform().localMatrixWithoutPhysics = Matrix44.multiplyTo(
        invMatrix,
        matrix,
        SceneGraphComponent.__tmp_mat4_3
      ).clone();
    }
  }

  setMatrixToPhysics(matrix: IMatrix44) {
    const physicsComponent = this.entity.tryToGetPhysics();
    if (physicsComponent !== undefined) {
      if (physicsComponent.strategy !== undefined) {
        if (physicsComponent.strategy instanceof OimoPhysicsStrategy) {
          const sceneGraphComponent = this.entity.tryToGetSceneGraph();
          if (sceneGraphComponent !== undefined) {
            const eulerAngles = Quaternion.fromMatrix(matrix).toEulerAngles();
            physicsComponent.strategy.setEulerAngle(eulerAngles);
            physicsComponent.strategy.setPosition(matrix.getTranslate());
            physicsComponent.strategy.setScale(matrix.getScale());
          }
        }
      }
    }
  }

  set matrix(matrix: MutableMatrix44) {
    this.setMatrixWithoutPhysics(matrix);
    this.setMatrixToPhysics(matrix);
  }

  /**
   * Gets the internal world matrix in rest pose (mutable reference).
   * @returns The internal world matrix in rest pose
   */
  get matrixRestInner() {
    if (!this.__isWorldMatrixRestUpToDate) {
      this._worldMatrixRest.copyComponents(this.__calcWorldMatrixRestRecursively());
      this.__isWorldMatrixRestUpToDate = true;
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
      Matrix44.invertTo(this.matrixInner, SceneGraphComponent.invertedMatrix44);
      this._normalMatrix.copyComponents(SceneGraphComponent.invertedMatrix44.transpose());
      this.__isNormalMatrixUpToDate = true;
    }
    return this._normalMatrix;
  }

  /**
   * Gets the entity world matrix with skeletal animation applied.
   * @returns A cloned copy of the entity world matrix with skeletal transformations
   */
  get entityWorldWithSkeletalMatrix(): MutableMatrix44 {
    return this.entityWorldMatrixWithSkeletalInner.clone();
  }

  /**
   * Gets the internal entity world matrix with skeletal animation applied.
   * @returns The internal entity world matrix with skeletal transformations
   */
  get entityWorldMatrixWithSkeletalInner(): MutableMatrix44 {
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
  isWorldMatrixUpToDateRecursively(): boolean {
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
   * @returns The calculated world matrix
   */
  private __calcWorldMatrixRecursively(): MutableMatrix44 {
    if (this.__isWorldMatrixUpToDate) {
      return this._worldMatrix;
    }

    const transform = this.entity.getTransform()!;

    if (this.__parent == null || this.toMakeWorldMatrixTheSameAsLocalMatrix) {
      transform.getLocalMatrixInnerTo(SceneGraphComponent.__tmp_mat4_2);
      return SceneGraphComponent.__tmp_mat4_2;
    }

    const matrixFromAncestorToParent = this.__parent.__calcWorldMatrixRecursively();
    transform.getLocalMatrixInnerTo(SceneGraphComponent.__tmp_mat4_3);
    return MutableMatrix44.multiplyTo(
      matrixFromAncestorToParent,
      SceneGraphComponent.__tmp_mat4_3,
      SceneGraphComponent.__tmp_mat4
    );
  }

  /**
   * Recursively calculates the world matrix in rest pose from this node up to the root.
   * @returns The calculated world matrix in rest pose
   */
  private __calcWorldMatrixRestRecursively(): MutableMatrix44 {
    if (this.__isWorldMatrixRestUpToDate) {
      return this._worldMatrixRest;
    }

    const transform = this.entity.getTransform()!;

    if (this.__parent == null || this.toMakeWorldMatrixTheSameAsLocalMatrix) {
      transform.getLocalMatrixInnerTo(SceneGraphComponent.__tmp_mat4_2);
      return SceneGraphComponent.__tmp_mat4_2;
    }

    const matrixFromAncestorToParent = this.__parent.__calcWorldMatrixRestRecursively();
    transform.getLocalMatrixInnerTo(SceneGraphComponent.__tmp_mat4_3);
    return MutableMatrix44.multiplyTo(
      matrixFromAncestorToParent,
      SceneGraphComponent.__tmp_mat4_3,
      SceneGraphComponent.__tmp_mat4
    );
  }

  /**
   * Gets the world rotation quaternion by recursively combining local rotations.
   * @returns The world rotation quaternion
   */
  getQuaternionRecursively(): IQuaternion {
    if (Is.not.exist(this.parent)) {
      return this.entity.getTransform().localRotation;
    }

    const matrixFromAncestorToParent = this.parent.getQuaternionRecursively();
    return Quaternion.multiply(matrixFromAncestorToParent, this.entity.getTransform().localRotation);
  }

  /**
   * Gets the world position of this node.
   * @returns The world position as a Vector3
   */
  get worldPosition(): Vector3 {
    const zeroVector = SceneGraphComponent.__originVector3;
    this.matrixInner.multiplyVector3To(zeroVector, SceneGraphComponent.returnVector3);
    return SceneGraphComponent.returnVector3 as Vector3;
  }

  /**
   * Transforms a local position to world space.
   * @param localPosition - The position in local space
   * @returns The position in world space
   */
  getWorldPositionOf(localPosition: Vector3) {
    return this.matrixInner.multiplyVector3(localPosition);
  }

  /**
   * Transforms a local position to world space and stores the result in the output vector.
   * @param localPosition - The position in local space
   * @param out - The output vector to store the result
   * @returns The output vector containing the world position
   */
  getWorldPositionOfTo(localPosition: Vector3, out: MutableVector3) {
    return this.matrixInner.multiplyVector3To(localPosition, out);
  }

  /**
   * Transforms a world position to local space.
   * @param worldPosition - The position in world space
   * @returns The position in local space
   */
  getLocalPositionOf(worldPosition: Vector3): Vector3 {
    return Matrix44.invert(this.matrixInner).multiplyVector3(worldPosition);
  }

  /**
   * Transforms a world position to local space and stores the result in the output vector.
   * @param worldPosition - The position in world space
   * @param out - The output vector to store the result
   * @returns The output vector containing the local position
   */
  getLocalPositionOfTo(worldPosition: Vector3, out: MutableVector3): Vector3 {
    return Matrix44.invertTo(this.matrixInner, SceneGraphComponent.__tmp_mat4).multiplyVector3To(worldPosition, out);
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

      AABB.multiplyMatrixTo(this.entity.getSceneGraph().matrixInner, aabb, SceneGraphComponent.__tmpAABB);
    } else {
      SceneGraphComponent.__tmpAABB.initialize();
    }

    return SceneGraphComponent.__tmpAABB;
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
        SceneGraphComponent.__tmpAABB
      );
    } else {
      SceneGraphComponent.__tmpAABB.initialize();
    }

    return SceneGraphComponent.__tmpAABB;
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
    if (this.__isWorldAABBDirty) {
      this.calcWorldMergedAABBWithSkeletal();
      this.__isWorldAABBDirty = false;
    }
    return this.__worldMergedAABBWithSkeletal;
  }

  /**
   * Performs ray casting against all mesh components in this hierarchy.
   *
   * @param srcPointInWorld - The ray origin point in world space
   * @param directionInWorld - The ray direction vector in world space (should be normalized)
   * @param dotThreshold - Threshold for triangle-ray intersection angle (default: 0)
   * @param ignoreMeshComponents - Array of mesh components to exclude from ray casting (default: [])
   * @returns Ray casting result containing intersection information
   */
  public castRay(
    srcPointInWorld: Vector3,
    directionInWorld: Vector3,
    dotThreshold = 0,
    ignoreMeshComponents: MeshComponent[] = []
  ): RaycastResultEx2 {
    const collectedSgComponents = flattenHierarchy(this, false);
    const meshComponents: MeshComponent[] = [];
    for (const sg of collectedSgComponents) {
      const mesh = sg.entity.tryToGetMesh();
      if (mesh) {
        meshComponents.push(mesh);
      }
    }

    let rayDistance = Number.MAX_VALUE;
    let intersectedPosition = undefined;
    let selectedMeshComponent = undefined;
    let u = 0;
    let v = 0;
    for (const meshComponent of meshComponents) {
      if (!meshComponent.entity.getSceneGraph()!.isVisible) {
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
        u = result.data.u;
        v = result.data.v;
      }
    }

    if (Is.exist(selectedMeshComponent) && Is.exist(intersectedPosition)) {
      return {
        result: true,
        data: {
          t: rayDistance,
          u,
          v,
          position: intersectedPosition,
          selectedMeshComponent,
        },
      };
    }
    return {
      result: false,
    };
  }

  /**
   * Performs ray casting from screen coordinates against all mesh components in this hierarchy.
   *
   * @param x - Screen x coordinate
   * @param y - Screen y coordinate
   * @param camera - The camera component to use for screen-to-world projection
   * @param viewport - Viewport rectangle as Vector4 (x, y, width, height)
   * @param dotThreshold - Threshold for triangle-ray intersection angle (default: 0)
   * @param ignoreMeshComponents - Array of mesh components to exclude from ray casting (default: [])
   * @returns Ray casting result containing intersection information in world space
   */
  castRayFromScreen(
    x: number,
    y: number,
    camera: CameraComponent,
    viewport: Vector4,
    dotThreshold = 0,
    ignoreMeshComponents: MeshComponent[] = []
  ): RaycastResultEx2 {
    const collectedSgComponents = flattenHierarchy(this, false);
    const meshComponents: MeshComponent[] = [];
    for (const sg of collectedSgComponents) {
      const mesh = sg.entity.tryToGetMesh();
      if (mesh) {
        meshComponents.push(mesh);
      }
    }

    let rayDistance = Number.MAX_VALUE;
    let intersectedPosition = undefined;
    let selectedMeshComponent = undefined;
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
        u = result.data.u;
        v = result.data.v;
      }
    }

    if (Is.exist(selectedMeshComponent) && Is.exist(intersectedPosition)) {
      return {
        result: true,
        data: {
          t: rayDistance,
          u,
          v,
          position: intersectedPosition,
          selectedMeshComponent,
        },
      };
    }
    return {
      result: false,
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
    if (this.__lastTransformComponentsUpdateCount === TransformComponent.updateCount) {
      return;
    }

    this.logicForce();

    // const meshComponent = this.entity.tryToGetMesh();
    // if (meshComponent != null) {
    //   const mesh = meshComponent.mesh;
    //   if (mesh != null) {
    //     const primitiveNum = mesh.getPrimitiveNumber();
    //     for (let i = 0; i < primitiveNum; i++) {
    //       const primitive = mesh.getPrimitiveAt(i);
    //       if (primitive.positionAccessorVersion !== this.__latestPrimitivePositionAccessorVersion) {
    //         this.setWorldAABBDirtyParentRecursively();
    //         this.__latestPrimitivePositionAccessorVersion = primitive.positionAccessorVersion!;
    //         break;
    //       }
    //     }
    //   }
    // }

    this.__lastTransformComponentsUpdateCount = TransformComponent.updateCount;
  }

  logicForce() {
    this.matrixInner;
    this.normalMatrixInner;
    this.__updateGizmos();
  }

  /**
   * Updates all active gizmos for this scene graph node.
   */
  private __updateGizmos() {
    if (Is.exist(this.__aabbGizmo) && this.__aabbGizmo.isSetup && this.__aabbGizmo.isVisible) {
      this.__aabbGizmo._update();
    }
    if (Is.exist(this.__locatorGizmo) && this.__locatorGizmo.isSetup && this.__locatorGizmo.isVisible) {
      this.__locatorGizmo._update();
    }
    if (Is.exist(this.__translationGizmo) && this.__translationGizmo.isSetup && this.__translationGizmo.isVisible) {
      this.__translationGizmo._update();
    }
    if (Is.exist(this.__scaleGizmo) && this.__scaleGizmo.isSetup && this.__scaleGizmo.isVisible) {
      this.__scaleGizmo._update();
    }
  }

  /**
   * Sets the world position without updating physics simulation.
   * @param vec - The world position to set
   */
  setPositionWithoutPhysics(vec: IVector3) {
    if (Is.not.exist(this.__parent)) {
      this.entity.getTransform().localPositionWithoutPhysics = vec;
    } else {
      MutableMatrix44.invertTo(this.__parent.entity.getSceneGraph().matrixInner, SceneGraphComponent.__tmp_mat4);
      this.entity.getTransform().localPositionWithoutPhysics = SceneGraphComponent.__tmp_mat4.multiplyVector3(vec);
    }
  }

  /**
   * Sets the world position and updates physics simulation if present.
   * @param vec - The world position to set
   */
  set position(vec: IVector3) {
    this.setPositionWithoutPhysics(vec);
    this.setPositionToPhysics(vec);
  }

  /**
   * Updates the physics simulation with the new position.
   * @param vec - The world position to set in physics
   */
  setPositionToPhysics(vec: IVector3) {
    const physicsComponent = this.entity.tryToGetPhysics();
    if (physicsComponent !== undefined) {
      if (physicsComponent.strategy !== undefined) {
        if (physicsComponent.strategy instanceof OimoPhysicsStrategy) {
          const sceneGraphComponent = this.entity.tryToGetSceneGraph();
          if (sceneGraphComponent !== undefined) {
            physicsComponent.strategy.setPosition(vec);
          }
        }
      }
    }
  }

  /**
   * Gets the world position of this node.
   * @returns The world position
   */
  get position(): MutableVector3 {
    return this.matrixInner.getTranslate();
  }

  /**
   * Gets the world position and stores it in the output vector.
   * @param outVec - The output vector to store the position
   * @returns The output vector containing the world position
   */
  getPositionTo(outVec: MutableVector3): MutableVector3 {
    return this.matrixInner.getTranslateTo(outVec);
  }

  /**
   * Gets the world position in rest pose.
   * @returns The world position in rest pose
   */
  get positionRest(): MutableVector3 {
    return this.matrixRestInner.getTranslate();
  }

  /**
   * Gets the world position in rest pose and stores it in the output vector.
   * @param outVec - The output vector to store the position
   * @returns The output vector containing the world position in rest pose
   */
  getPositionRestTo(outVec: MutableVector3): MutableVector3 {
    return this.matrixRestInner.getTranslateTo(outVec);
  }

  /**
   * Sets the world rotation using Euler angles and updates physics simulation if present.
   * @param vec - The Euler angles (in radians) to set
   */
  set eulerAngles(vec: IVector3) {
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
  setEulerAnglesToPhysics(vec: IVector3) {
    const physicsComponent = this.entity.tryToGetPhysics();
    if (physicsComponent !== undefined) {
      if (physicsComponent.strategy !== undefined) {
        if (physicsComponent.strategy instanceof OimoPhysicsStrategy) {
          const sceneGraphComponent = this.entity.tryToGetSceneGraph();
          if (sceneGraphComponent !== undefined) {
            physicsComponent.strategy.setEulerAngle(vec);
          }
        }
      }
    }
  }

  /**
   * Gets the world rotation as Euler angles.
   * @returns The world rotation as Euler angles (in radians)
   */
  get eulerAngles(): Vector3 {
    return this.matrixInner.toEulerAngles();
  }

  /**
   * Sets the world rotation without updating physics simulation.
   * @param quat - The quaternion rotation to set
   */
  setRotationWithoutPhysics(quat: IQuaternion) {
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
  set rotation(quat: IQuaternion) {
    this.setRotationWithoutPhysics(quat);
    this.setRotationToPhysics(quat);
  }

  /**
   * Updates the physics simulation with the new rotation.
   * @param quat - The quaternion rotation to set in physics
   */
  setRotationToPhysics(quat: IQuaternion) {
    const physicsComponent = this.entity.tryToGetPhysics();
    if (physicsComponent !== undefined) {
      if (physicsComponent.strategy !== undefined) {
        if (physicsComponent.strategy instanceof OimoPhysicsStrategy) {
          const sceneGraphComponent = this.entity.tryToGetSceneGraph();
          if (sceneGraphComponent !== undefined) {
            physicsComponent.strategy.setEulerAngle(quat.toEulerAngles());
          }
        }
      }
    }
  }

  /**
   * Gets the world rotation as a quaternion.
   * @returns The world rotation quaternion
   */
  get rotation(): Quaternion {
    const parent = this.parent;
    if (parent != null) {
      return Quaternion.multiply(parent.rotation, this.entity.getTransform().localRotationInner);
    }
    return this.entity.getTransform().localRotationInner;
  }

  /**
   * Gets the world rotation and stores it in the output quaternion.
   * @param outQuat - The output quaternion to store the rotation
   * @returns The output quaternion containing the world rotation
   */
  getRotationTo(outQuat: MutableQuaternion): MutableQuaternion {
    const parent = this.parent;
    if (parent != null) {
      return Quaternion.multiplyTo(
        parent.getRotationTo(SceneGraphComponent.__tmp_quat_0),
        this.entity.getTransform().localRotationInner,
        outQuat
      ) as MutableQuaternion;
    }
    const quat = this.entity.getTransform().localRotationInner;
    outQuat.setComponents(quat._v[0], quat._v[1], quat._v[2], quat._v[3]);
    return outQuat;
  }

  /**
   * Gets the world rotation in rest pose.
   * @returns The world rotation quaternion in rest pose
   */
  get rotationRest(): Quaternion {
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
  getRotationRest(endFn: (sg: SceneGraphComponent) => boolean): Quaternion {
    const parent = this.parent;
    if (parent != null && !endFn(this)) {
      return Quaternion.multiply(parent.getRotationRest(endFn), this.entity.getTransform().localRotationRestInner);
    }
    return Quaternion.identity();

    // return this.entity.getTransform().localRotationRestInner;
  }

  /**
   * Sets the world scale and updates physics simulation if present.
   * @param vec - The scale vector to set
   */
  set scale(vec: IVector3) {
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
  setScaleToPhysics(vec: IVector3) {
    const physicsComponent = this.entity.tryToGetPhysics();
    if (physicsComponent !== undefined) {
      if (physicsComponent.strategy !== undefined) {
        if (physicsComponent.strategy instanceof OimoPhysicsStrategy) {
          const sceneGraphComponent = this.entity.tryToGetSceneGraph();
          if (sceneGraphComponent !== undefined) {
            physicsComponent.strategy.setScale(vec);
          }
        }
      }
    }
  }

  /**
   * Gets the world scale of this node.
   * @returns The world scale vector
   */
  get scale(): MutableVector3 {
    return this.matrixInner.getScale();
  }

  /**
   * Creates a shallow copy of a child scene graph component.
   * @param child - The child component to copy
   * @returns A new scene graph entity with copied component
   */
  private __copyChild(child: SceneGraphComponent): ISceneGraphEntity {
    const newChild = EntityRepository._shallowCopyEntityInner(child.entity) as ISceneGraphEntity;
    newChild.getSceneGraph().__parent = this;
    return newChild;
  }

  /**
   * Performs a shallow copy from another SceneGraphComponent.
   * @param component_ - The source component to copy from
   */
  _shallowCopyFrom(component_: Component): void {
    const component = component_ as SceneGraphComponent;

    this.__parent = component.__parent;
    this.__children = [];
    for (let i = 0; i < component.__children.length; i++) {
      const copyChild = this.__copyChild(component.__children[i]).getSceneGraph();
      this.__children.push(copyChild);
    }

    this.__gizmoChildren = component.__gizmoChildren.concat();
    this._worldMatrix.copyComponents(component._worldMatrix);
    this._worldMatrixRest.copyComponents(component._worldMatrixRest);
    this._normalMatrix.copyComponents(component._normalMatrix);
    this.__isWorldMatrixUpToDate = false;
    this.__isWorldMatrixRestUpToDate = false;
    this.__isNormalMatrixUpToDate = false;
    this.__worldMergedAABBWithSkeletal = component.__worldMergedAABBWithSkeletal.clone();
    this.__isWorldAABBDirty = true;
    this._isVisible.copyComponents(component._isVisible);
    this._isBillboard.copyComponents(component._isBillboard);
    // this.__aabbGizmo = component.__aabbGizmo;
    // this.__locatorGizmo = component.__locatorGizmo;
    // this.__translationGizmo = component.__translationGizmo;
    // this.__scaleGizmo = component.__scaleGizmo;
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
  get entity(): ISceneGraphEntity {
    return EntityRepository.getEntity(this.__entityUid) as unknown as ISceneGraphEntity;
  }

  /**
   * Sets the coordinate space for transformation gizmos.
   * @param space - The coordinate space ('local' or 'world')
   */
  setTransformGizmoSpace(space: 'local' | 'world') {
    this.__transformGizmoSpace = space;
    this.__translationGizmo?.setSpace(space);
    this.__scaleGizmo?.setSpace(space);
  }

  /**
   * Destroys this component and cleans up resources.
   */
  _destroy() {
    super._destroy();
    this.__aabbGizmo?._destroy();
    this.__locatorGizmo?._destroy();
    this.__translationGizmo?._destroy();
    this.__scaleGizmo?._destroy();
    // this.__entityRepository.removeEntity(this.__entityUid);
    this.parent?.removeChild(this);
    this.children.forEach(child => child.parent?.removeChild(child));
  }

  /**
   * Adds this component to an entity and extends it with SceneGraph functionality.
   * @param base - The target entity to extend
   * @param _componentClass - The component class being added (unused)
   * @returns The extended entity with SceneGraph methods
   */
  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class SceneGraphEntity extends (base.constructor as any) {
      private __sceneGraphComponent?: SceneGraphComponent;

      /**
       * Gets the scene graph component for this entity.
       * @returns The scene graph component instance
       */
      getSceneGraph(): SceneGraphComponent {
        if (this.__sceneGraphComponent === undefined) {
          this.__sceneGraphComponent = this.getComponentByComponentTID(
            WellKnownComponentTIDs.SceneGraphComponentTID
          ) as SceneGraphComponent;
        }
        return this.__sceneGraphComponent;
      }

      /**
       * Gets the parent scene graph component of this entity.
       * @returns The parent scene graph component, or undefined if this is a root entity
       */
      get parent(): SceneGraphComponent | undefined {
        return this.getSceneGraph().parent;
      }

      /**
       * Gets the world transformation matrix of this entity.
       * @returns The world transformation matrix
       */
      get matrix(): IMatrix44 {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.matrix;
      }

      /**
       * Gets the internal mutable world transformation matrix of this entity.
       * @returns The internal world transformation matrix
       */
      get matrixInner(): IMatrix44 {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.matrixInner;
      }

      /**
       * Gets the world position of this entity.
       * @returns The world position vector
       */
      get position(): MutableVector3 {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.position;
      }

      /**
       * Sets the world position of this entity.
       * @param vec - The new world position vector
       */
      set position(vec: IVector3) {
        const sceneGraph = this.getSceneGraph();
        sceneGraph.position = vec;
      }

      /**
       * Gets the rest pose world position of this entity.
       * @returns The rest pose world position vector
       */
      get positionRest(): MutableVector3 {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.positionRest;
      }

      /**
       * Gets the world scale of this entity.
       * @returns The world scale vector
       */
      get scale(): MutableVector3 {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.scale;
      }

      /**
       * Sets the world scale of this entity.
       * @param vec - The new world scale vector
       */
      set scale(vec: IVector3) {
        const sceneGraph = this.getSceneGraph();
        sceneGraph.scale = vec;
      }

      /**
       * Gets the world euler angles of this entity.
       * @returns The world euler angles vector
       */
      get eulerAngles(): Vector3 {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.eulerAngles;
      }

      /**
       * Sets the world euler angles of this entity.
       * @param vec - The new world euler angles vector
       */
      set eulerAngles(vec: IVector3) {
        const sceneGraph = this.getSceneGraph();
        sceneGraph.eulerAngles = vec;
      }

      /**
       * Gets the world rotation quaternion of this entity.
       * @returns The world rotation quaternion
       */
      get rotation(): Quaternion {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.rotation;
      }

      /**
       * Sets the world rotation quaternion of this entity.
       * @param quat - The new world rotation quaternion
       */
      set rotation(quat: IQuaternion) {
        const sceneGraph = this.getSceneGraph();
        sceneGraph.rotation = quat;
      }

      /**
       * Gets the rest pose world rotation quaternion of this entity.
       * @returns The rest pose world rotation quaternion
       */
      get rotationRest(): Quaternion {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.rotationRest;
      }

      /**
       * Adds a child scene graph component to this entity.
       * @param sg - The scene graph component to add as a child
       * @param keepPoseInWorldSpace - Whether to keep the child's world pose
       */
      addChild(sg: SceneGraphComponent, keepPoseInWorldSpace = false): void {
        const sceneGraph = this.getSceneGraph();
        sceneGraph.addChild(sg, keepPoseInWorldSpace);
      }

      /**
       * Gets all child scene graph components of this entity.
       * @returns An array of child scene graph components
       */
      get children(): SceneGraphComponent[] {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.children;
      }

      /**
       * Removes a child scene graph component from this entity.
       * @param sg - The scene graph component to remove from children
       */
      removeChild(sg: SceneGraphComponent): void {
        const sceneGraph = this.getSceneGraph();
        sceneGraph.removeChild(sg);
      }
    }
    applyMixins(base, SceneGraphEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}
