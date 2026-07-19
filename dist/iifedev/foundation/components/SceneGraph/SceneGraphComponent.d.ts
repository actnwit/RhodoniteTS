import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository } from '../../core/EntityRepository';
import type { RaycastResultEx2 } from '../../geometry/types/GeometryTypes';
import type { ISceneGraphEntity } from '../../helpers/EntityHelper';
import { AABB } from '../../math/AABB';
import type { IMatrix44 } from '../../math/IMatrix';
import type { IQuaternion } from '../../math/IQuaternion';
import type { IVector3 } from '../../math/IVector';
import { MutableMatrix33 } from '../../math/MutableMatrix33';
import { MutableMatrix44 } from '../../math/MutableMatrix44';
import { MutableQuaternion } from '../../math/MutableQuaternion';
import { MutableVector3 } from '../../math/MutableVector3';
import { Quaternion } from '../../math/Quaternion';
import { Vector3 } from '../../math/Vector3';
import type { Vector4 } from '../../math/Vector4';
import type { Engine } from '../../system/Engine';
import type { CameraComponent } from '../Camera/CameraComponent';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import type { MeshComponent } from '../Mesh/MeshComponent';
/**
 * SceneGraphComponent is a component that represents a node in the scene graph.
 * It manages hierarchical relationships between entities and handles world matrix calculations.
 */
export declare class SceneGraphComponent extends Component {
    private __parent?;
    private __children;
    private __gizmoChildren;
    private __physicsComponentCountInSubtree;
    private _worldMatrix;
    private _worldMatrixRest;
    private _normalMatrix;
    private _worldRotation;
    private __isWorldMatrixUpToDate;
    private __isWorldMatrixRestUpToDate;
    private __isNormalMatrixUpToDate;
    private __isWorldRotationUpToDate;
    private __worldMergedAABBWithSkeletal;
    private __worldMergedAABB;
    private __isWorldAABBDirty;
    private _isVisible;
    private _isBillboard;
    private __aabbGizmo?;
    private __locatorGizmo?;
    private __translationGizmo?;
    private __rotationGizmo?;
    private __scaleGizmo?;
    private __jointGizmo?;
    private __transformGizmoSpace;
    private __latestPrimitivePositionAccessorVersion;
    toMakeWorldMatrixTheSameAsLocalMatrix: boolean;
    isRootJoint: boolean;
    jointIndex: number;
    _isCulled: boolean;
    private static readonly __originVector3;
    private static readonly __axisX;
    private static readonly __axisY;
    private static readonly __axisZ;
    private static returnVector3;
    private static __sceneGraphs;
    private static invertedMatrix44;
    private static __tmp_mat4;
    private static __tmp_mat4_2;
    private static __tmp_mat4_3;
    private static __tmp_mat4_4;
    private static __tmp_quat_0;
    private static __tmp_quat_1;
    /** Map to store update count per Engine instance for multi-engine support */
    private static __updateCountMap;
    private static __tmpAABB;
    private __lastTransformComponentsUpdateCount;
    /**
     * Creates a new SceneGraphComponent instance.
     * @param engine - The engine instance
     * @param entityUid - The unique identifier of the entity this component belongs to
     * @param componentSid - The component instance identifier
     * @param entityRepository - The entity repository managing this component
     * @param isReUse - Whether this component is being reused
     */
    constructor(engine: Engine, entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    /**
     * Sets the visibility of this scene graph node.
     * @param flg - True to make visible, false to hide
     */
    set isVisible(flg: boolean);
    /**
     * Gets the visibility state of this scene graph node.
     * @returns True if visible, false if hidden
     */
    get isVisible(): boolean;
    /**
     * Gets the update counter for scene graph components of the specified engine.
     * @param engine - The engine instance to get the update count for
     * @returns The current update count for the specified engine
     */
    static getUpdateCount(engine: Engine): number;
    /**
     * Increments the update counter for the specified engine.
     * @param engine - The engine instance to increment the update count for
     * @internal
     */
    private static __incrementUpdateCount;
    /**
     * Sets the visibility of this node and all its children recursively.
     * @param flag - True to make visible, false to hide
     */
    setVisibilityRecursively(flag: boolean): void;
    /**
     * Sets the billboard state of this scene graph node.
     * @param flg - True to enable billboard behavior, false to disable
     */
    set isBillboard(flg: boolean);
    /**
     * Gets the billboard state of this scene graph node.
     * @returns True if billboard is enabled, false otherwise
     */
    get isBillboard(): boolean;
    /**
     * Sets the billboard state of this node and all its children recursively.
     * @param flg - True to enable billboard behavior, false to disable
     */
    setIsBillboardRecursively(flg: boolean): void;
    /**
     * Sets the visibility of the AABB (Axis-Aligned Bounding Box) gizmo.
     * @param flg - True to show the AABB gizmo, false to hide it
     */
    set isAABBGizmoVisible(flg: boolean);
    /**
     * Gets the visibility state of the AABB gizmo.
     * @returns True if the AABB gizmo is visible, false otherwise
     */
    get isAABBGizmoVisible(): boolean;
    /**
     * Sets the visibility of the locator gizmo.
     * @param flg - True to show the locator gizmo, false to hide it
     */
    set isLocatorGizmoVisible(flg: boolean);
    /**
     * Gets the visibility state of the locator gizmo.
     * @returns True if the locator gizmo is visible, false otherwise
     */
    get isLocatorGizmoVisible(): boolean;
    /**
     * Sets the visibility of the translation gizmo.
     * @param flg - True to show the translation gizmo, false to hide it
     */
    set isTranslationGizmoVisible(flg: boolean);
    /**
     * Gets the visibility state of the translation gizmo.
     * @returns True if the translation gizmo is visible, false otherwise
     */
    get isTranslationGizmoVisible(): boolean;
    /**
     * Sets the visibility of the rotation gizmo.
     * @param flg - True to show the rotation gizmo, false to hide it
     */
    set isRotationGizmoVisible(flg: boolean);
    /**
     * Gets the visibility state of the rotation gizmo.
     * @returns True if the rotation gizmo is visible, false otherwise
     */
    get isRotationGizmoVisible(): boolean;
    /**
     * Sets the visibility of the scale gizmo.
     * @param flg - True to show the scale gizmo, false to hide it
     */
    set isScaleGizmoVisible(flg: boolean);
    /**
     * Gets the visibility state of the scale gizmo.
     * @returns True if the scale gizmo is visible, false otherwise
     */
    get isScaleGizmoVisible(): boolean;
    /**
     * Sets the visibility of the joint gizmo that visualizes skeletal joints.
     * @param flg - True to show the joint gizmo, false to hide it
     */
    set isJointGizmoVisible(flg: boolean);
    /**
     * Gets the visibility state of the joint gizmo.
     * @returns True if the joint gizmo is visible, false otherwise
     */
    get isJointGizmoVisible(): boolean;
    /**
     * Gets all top-level scene graph components (nodes without parents).
     * @returns An array of scene graph components that are at the root level
     */
    static getTopLevelComponents(): SceneGraphComponent[];
    /**
     * Checks if this node represents a skeletal joint.
     * @returns True if this is a joint (has a valid joint index), false otherwise
     */
    isJoint(): boolean;
    /**
     * Gets the component type identifier for SceneGraphComponent.
     * @returns The component type ID
     */
    static get componentTID(): 4;
    /**
     * Gets the component type identifier for this instance.
     * @returns The component type ID
     */
    get componentTID(): ComponentTID;
    /**
     * Marks the world matrix rest state as dirty and propagates to children.
     */
    setWorldMatrixRestDirty(): void;
    /**
     * Recursively marks the world matrix rest state as dirty for this node and all children.
     */
    setWorldMatrixRestDirtyRecursively(): void;
    /**
     * Marks the world matrix as dirty and propagates changes up the hierarchy.
     */
    setWorldMatrixDirty(): void;
    /**
     * Marks the world matrix as dirty without checking if the AABB is dirty.
     */
    setWorldMatrixDirtyWithoutAABBDirty(): void;
    /**
     * Recursively marks the world matrix as dirty for this node and all children.
     */
    setWorldMatrixDirtyRecursively(): void;
    /**
     * Recursively marks the world AABB as dirty up the parent hierarchy.
     */
    setWorldAABBDirtyParentRecursively(): void;
    /**
     * Adds a SceneGraph component as a child of this node.
     * @param sg - The SceneGraph component to add as a child
     * @param keepPoseInWorldSpace - Whether to keep the child's world pose
     */
    addChild(sg: SceneGraphComponent, keepPoseInWorldSpace?: boolean): void;
    /**
     * Removes a child SceneGraph component from this node.
     * @param sg - The SceneGraph component to remove
     */
    removeChild(sg: SceneGraphComponent): void;
    /**
     * Adds a SceneGraph component as a gizmo child (internal use only).
     * @param sg - The SceneGraph component of a gizmo to add
     */
    _addGizmoChild(sg: SceneGraphComponent): void;
    /**
     * Checks if this node is at the top level (has no parent).
     * @returns True if this is a root node, false otherwise
     */
    get isTopLevel(): boolean;
    /**
     * Gets the child scene graph components of this node.
     * @returns An array of child scene graph components
     */
    get children(): SceneGraphComponent[];
    /**
     * Gets the parent scene graph component of this node.
     * @returns The parent component, or undefined if this is a root node
     */
    get parent(): SceneGraphComponent | undefined;
    /**
     * Gets the internal world matrix (mutable reference).
     * @returns The internal world matrix
     */
    get matrixInner(): MutableMatrix44;
    /**
     * Gets a clone of the world matrix.
     * @returns A cloned copy of the world matrix
     */
    get matrix(): MutableMatrix44;
    setMatrixWithoutPhysics(matrix: IMatrix44): void;
    setMatrixToPhysics(matrix: IMatrix44): void;
    private __setMatrixToOwnPhysics;
    private __syncDescendantPhysicsTransforms;
    private __syncPhysicsTransformRecursively;
    /**
     * Records that this entity acquired a PhysicsComponent.
     * @internal
     */
    _onPhysicsComponentAdded(): void;
    /**
     * Records that this entity lost its PhysicsComponent.
     * @internal
     */
    _onPhysicsComponentRemoved(): void;
    /**
     * Returns whether this node or one of its descendants has a PhysicsComponent.
     * @internal
     */
    get _hasPhysicsComponentInSubtree(): boolean;
    private __adjustPhysicsComponentCountInSubtree;
    set matrix(matrix: MutableMatrix44);
    /**
     * Gets the internal world matrix in rest pose (mutable reference).
     * @returns The internal world matrix in rest pose
     */
    get matrixRestInner(): MutableMatrix44;
    /**
     * Gets a clone of the world matrix in rest pose.
     * @returns A cloned copy of the world matrix in rest pose
     */
    get matrixRest(): MutableMatrix44;
    /**
     * Gets the internal normal matrix (mutable reference).
     * @returns The internal normal matrix
     */
    get normalMatrixInner(): MutableMatrix33;
    /**
     * Gets the entity world matrix with skeletal animation applied.
     * @returns A cloned copy of the entity world matrix with skeletal transformations
     */
    get entityWorldWithSkeletalMatrix(): MutableMatrix44;
    /**
     * Gets the internal entity world matrix with skeletal animation applied.
     * @returns The internal entity world matrix with skeletal transformations
     */
    get entityWorldMatrixWithSkeletalInner(): MutableMatrix44;
    /**
     * Gets a clone of the normal matrix.
     * @returns A cloned copy of the normal matrix
     */
    get normalMatrix(): MutableMatrix33;
    /**
     * Checks if the world matrix is up-to-date recursively up the hierarchy.
     * @returns True if the world matrix is up-to-date for this node and all its ancestors
     */
    isWorldMatrixUpToDateRecursively(): boolean;
    /**
     * Recursively calculates the world matrix from this node up to the root.
     * @returns The calculated world matrix
     */
    private __calcWorldMatrixRecursively;
    /**
     * Recursively calculates the world matrix in rest pose from this node up to the root.
     * @returns The calculated world matrix in rest pose
     */
    private __calcWorldMatrixRestRecursively;
    /**
     * Gets the world rotation quaternion by recursively combining local rotations.
     * @returns The world rotation quaternion
     */
    getQuaternionRecursively(): IQuaternion;
    /**
     * Gets the world position of this node.
     * @returns The world position as a Vector3
     */
    get worldPosition(): Vector3;
    /**
     * Transforms a local position to world space.
     * @param localPosition - The position in local space
     * @returns The position in world space
     */
    getWorldPositionOf(localPosition: Vector3): Vector3;
    /**
     * Transforms a local position to world space and stores the result in the output vector.
     * @param localPosition - The position in local space
     * @param out - The output vector to store the result
     * @returns The output vector containing the world position
     */
    getWorldPositionOfTo(localPosition: Vector3, out: MutableVector3): MutableVector3;
    /**
     * Transforms a world position to local space.
     * @param worldPosition - The position in world space
     * @returns The position in local space
     */
    getLocalPositionOf(worldPosition: Vector3): Vector3;
    /**
     * Transforms a world position to local space and stores the result in the output vector.
     * @param worldPosition - The position in world space
     * @param out - The output vector to store the result
     * @returns The output vector containing the local position
     */
    getLocalPositionOfTo(worldPosition: Vector3, out: MutableVector3): Vector3;
    /**
     * Gets the world-space AABB (Axis-Aligned Bounding Box) of this node.
     * @returns The world AABB of this node
     */
    getWorldAABB(): AABB;
    /**
     * Calculates the merged world AABB including all children.
     * @returns The merged world AABB of this node and all its descendants
     */
    calcWorldMergedAABB(): AABB;
    /**
     * Gets the cached merged world AABB, recalculating if dirty.
     * @returns The merged world AABB of this node and all its descendants
     */
    get worldMergedAABB(): AABB;
    /**
     * Gets the world-space AABB with skeletal animation applied.
     * @returns The world AABB with skeletal transformations
     */
    getWorldAABBWithSkeletal(): AABB;
    /**
     * Calculates the merged world AABB with skeletal animation including all children.
     * @returns The merged world AABB with skeletal transformations
     */
    calcWorldMergedAABBWithSkeletal(): AABB;
    /**
     * Gets the cached merged world AABB with skeletal animation, recalculating if dirty.
     * @returns The merged world AABB with skeletal transformations
     */
    get worldMergedAABBWithSkeletal(): AABB;
    /**
     * Performs ray casting against all mesh components in this hierarchy.
     *
     * @param srcPointInWorld - The ray origin point in world space
     * @param directionInWorld - The ray direction vector in world space (should be normalized)
     * @param dotThreshold - Threshold for triangle-ray intersection angle (default: 0)
     * @param ignoreMeshComponents - Array of mesh components to exclude from ray casting (default: [])
     * @returns Ray casting result containing intersection information
     */
    castRay(srcPointInWorld: Vector3, directionInWorld: Vector3, dotThreshold?: number, ignoreMeshComponents?: MeshComponent[]): RaycastResultEx2;
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
    castRayFromScreen(x: number, y: number, camera: CameraComponent, viewport: Vector4, dotThreshold?: number, ignoreMeshComponents?: MeshComponent[]): RaycastResultEx2;
    /**
     * Loads the component and moves to the Logic stage.
     */
    $load(): void;
    /**
     * Executes logic stage processing including matrix updates and gizmo updates.
     */
    $logic(): void;
    logicForce(): void;
    /**
     * Updates all active gizmos for this scene graph node.
     */
    private __updateGizmos;
    /**
     * Sets the world position without updating physics simulation.
     * @param vec - The world position to set
     */
    setPositionWithoutPhysics(vec: IVector3): void;
    /**
     * Sets the world position and updates physics simulation if present.
     * @param vec - The world position to set
     */
    set position(vec: IVector3);
    /**
     * Updates the physics simulation with the new position.
     * @param vec - The world position to set in physics
     */
    setPositionToPhysics(vec: IVector3): void;
    /**
     * Gets the world position of this node.
     * @returns The world position
     */
    get position(): MutableVector3;
    /**
     * Gets the world position and stores it in the output vector.
     * @param outVec - The output vector to store the position
     * @returns The output vector containing the world position
     */
    getPositionTo(outVec: MutableVector3): MutableVector3;
    /**
     * Gets the world position in rest pose.
     * @returns The world position in rest pose
     */
    get positionRest(): MutableVector3;
    /**
     * Gets the world position in rest pose and stores it in the output vector.
     * @param outVec - The output vector to store the position
     * @returns The output vector containing the world position in rest pose
     */
    getPositionRestTo(outVec: MutableVector3): MutableVector3;
    /**
     * Sets the world rotation using Euler angles and updates physics simulation if present.
     * @param vec - The Euler angles (in radians) to set
     */
    set eulerAngles(vec: IVector3);
    /**
     * Updates the physics simulation with the new Euler angles.
     * @param vec - The Euler angles (in radians) to set in physics
     */
    setEulerAnglesToPhysics(vec: IVector3): void;
    /**
     * Gets the world rotation as Euler angles.
     * @returns The world rotation as Euler angles (in radians)
     */
    get eulerAngles(): Vector3;
    /**
     * Sets the world rotation without updating physics simulation.
     * @param quat - The quaternion rotation to set
     */
    setRotationWithoutPhysics(quat: IQuaternion): void;
    /**
     * Sets the world rotation and updates physics simulation if present.
     * @param quat - The quaternion rotation to set
     */
    set rotation(quat: IQuaternion);
    /**
     * Updates the physics simulation with the new rotation.
     * @param quat - The quaternion rotation to set in physics
     */
    setRotationToPhysics(quat: IQuaternion): void;
    /**
     * Updates the cached world rotation if it is dirty.
     * This avoids repeated recursive traversal across the hierarchy.
     */
    private __getWorldRotationInner;
    /**
     * Gets the world rotation as a quaternion.
     * @returns The world rotation quaternion
     */
    get rotation(): Quaternion;
    get rotationInner(): Quaternion;
    /**
     * Gets the world rotation and stores it in the output quaternion.
     * @param outQuat - The output quaternion to store the rotation
     * @returns The output quaternion containing the world rotation
     */
    getRotationTo(outQuat: MutableQuaternion): MutableQuaternion;
    /**
     * Gets the world rotation in rest pose.
     * @returns The world rotation quaternion in rest pose
     */
    get rotationRest(): Quaternion;
    /**
     * Gets the world rotation in rest pose with conditional termination.
     * @param endFn - Function to determine if recursion should stop at this node
     * @returns The world rotation quaternion in rest pose
     */
    getRotationRest(endFn: (sg: SceneGraphComponent) => boolean): Quaternion;
    /**
     * Sets the world scale and updates physics simulation if present.
     * @param vec - The scale vector to set
     */
    set scale(vec: IVector3);
    /**
     * Updates the physics simulation with the new scale.
     * @param vec - The scale vector to set in physics
     */
    setScaleToPhysics(vec: IVector3): void;
    /**
     * Gets the world scale of this node.
     * @returns The world scale vector
     */
    get scale(): MutableVector3;
    /**
     * Resolves world-scale magnitudes with signs relative to the entity's proper world rotation.
     * Physics bodies use that rotation separately, so reflected local offsets need these signs.
     * @internal
     */
    _getPhysicsWorldScale(matrix?: IMatrix44): Vector3;
    /**
     * Creates a shallow copy of a child scene graph component.
     * @param child - The child component to copy
     * @returns A new scene graph entity with copied component
     */
    private __copyChild;
    /**
     * Performs a shallow copy from another SceneGraphComponent.
     * @param component_ - The source component to copy from
     */
    _shallowCopyFrom(component_: Component): void;
    /**
     * Gets the entity which has this component.
     * @returns The entity which has this component
     */
    get entity(): ISceneGraphEntity;
    /**
     * Sets the coordinate space for transformation gizmos.
     * @param space - The coordinate space ('local' or 'world')
     */
    setTransformGizmoSpace(space: 'local' | 'world'): void;
    /**
     * Destroys this component and cleans up resources.
     */
    _destroy(): void;
    /**
     * Adds this component to an entity and extends it with SceneGraph functionality.
     * @param base - The target entity to extend
     * @param _componentClass - The component class being added (unused)
     * @returns The extended entity with SceneGraph methods
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
    /**
     * Cleans up static resources associated with the specified engine.
     * @param engine - The engine instance to clean up resources for
     * @internal
     */
    static _cleanupForEngine(engine: Engine): void;
}
