import type { ComponentSID, ComponentTID, EntityUID, Index, TypedArray } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository } from '../../core/EntityRepository';
import type { ISkeletalEntity } from '../../helpers/EntityHelper';
import type { IMatrix44 } from '../../math/IMatrix';
import { Matrix44 } from '../../math/Matrix44';
import { MutableMatrix44 } from '../../math/MutableMatrix44';
import { MutableVector4 } from '../../math/MutableVector4';
import type { Accessor } from '../../memory/Accessor';
import type { Engine } from '../../system/Engine';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import type { SceneGraphComponent } from '../SceneGraph/SceneGraphComponent';
/**
 * SkeletalComponent manages skeletal animation for entities.
 * This component handles bone transformations, joint matrices, and skinning calculations
 * for 3D models with skeletal animation systems.
 */
export declare class SkeletalComponent extends Component {
    _jointIndices: Index[];
    private __joints;
    private __inverseBindMatricesAccessor?;
    _bindShapeMatrix?: Matrix44;
    private __jointMatrices?;
    topOfJointsHierarchy?: SceneGraphComponent;
    isSkinning: boolean;
    private __qtsInfo;
    private _boneMatrix;
    private _boneTranslatePackedQuat;
    private _boneScalePackedQuat;
    private _boneQuaternion;
    private _boneTranslateScale;
    private _boneCompressedChunk;
    private __jointMatrix;
    private __isWorldMatrixVanilla;
    _isCulled: boolean;
    private static __skinCalculationCache;
    private static __accessorSignatureCache;
    private static __bindShapeSignatureMap;
    private __jointListKey?;
    private __skinCacheKey?;
    private __inverseBindMatricesSignature?;
    private static __tookGlobalDataNum;
    private static __tmpVec3_0;
    private static __tmp_mat4;
    private static __tmp_q;
    private static __tmp_mat4_2;
    private static __tmp_mat4_3;
    private static __tmp_mat4_4;
    /**
     * Creates a new SkeletalComponent instance.
     * Initializes the component with skeletal animation capabilities and reserves global data resources.
     *
     * @param engine - The engine instance
     * @param entityUid - The unique identifier of the entity this component belongs to
     * @param componentSid - The component's system identifier
     * @param entityRepository - The repository managing entities
     * @param isReUse - Whether this component is being reused from a pool
     */
    constructor(engine: Engine, entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    /**
     * Resets GPU-bound vector fields so they can be re-bound on reuse.
     * Clears any existing data to prevent contamination from previous models.
     */
    private __resetBoneDataBuffers;
    /**
     * Gets the static component type identifier for SkeletalComponent.
     *
     * @returns The component type identifier
     */
    static get componentTID(): 10;
    /**
     * Gets the component type identifier for this instance.
     *
     * @returns The component type identifier
     */
    get componentTID(): ComponentTID;
    /**
     * Sets the accessor for inverse bind matrices used in skeletal animation.
     * These matrices transform vertices from model space to bone space.
     *
     * @param inverseBindMatricesAccessor - The accessor containing inverse bind matrices data
     */
    setInverseBindMatricesAccessor(inverseBindMatricesAccessor: Accessor): void;
    /**
     * Sets the joint hierarchy for this skeletal component.
     * Initializes the appropriate data arrays based on the configured bone data type.
     *
     * @param joints - Array of SceneGraphComponents representing the joints/bones
     */
    setJoints(joints: SceneGraphComponent[]): void;
    /**
     * Lightweight joint update for remapping during shallow copy.
     * Only updates joint references without reinitializing buffers.
     * Used when joints are remapped to new entities during shallow copy.
     */
    updateJointsLightweight(joints: SceneGraphComponent[]): void;
    /**
     * Gets a copy of the joints array.
     *
     * @returns A copy of the SceneGraphComponents representing the joints
     */
    getJoints(): SceneGraphComponent[];
    /**
     * Gets the world matrix of the root joint in the hierarchy.
     *
     * @returns The world matrix of the top joint, or undefined if no top joint exists
     */
    get rootJointWorldMatrixInner(): MutableMatrix44 | undefined;
    /**
     * Gets the computed joint matrices array.
     *
     * @returns The joint matrices array
     */
    get jointMatrices(): number[] | undefined;
    /**
     * Gets the quaternion array for joints (used in Vec4x2Old bone data type).
     *
     * @returns The Float32Array containing joint quaternions
     */
    get jointQuaternionArray(): TypedArray;
    /**
     * Gets the translate-scale array for joints.
     *
     * @returns The Float32Array containing joint translation and scale data
     */
    get jointTranslateScaleArray(): TypedArray;
    /**
     * Gets the translate-packed quaternion array for joints (used in Vec4x2 bone data type).
     *
     * @returns The Float32Array containing translation and packed quaternion data
     */
    get jointTranslatePackedQuat(): TypedArray;
    /**
     * Gets the scale-packed quaternion array for joints (used in Vec4x2 bone data type).
     *
     * @returns The Float32Array containing scale and packed quaternion data
     */
    get jointScalePackedQuat(): TypedArray;
    /**
     * Gets the joint matrices array (used in Mat43x1 bone data type).
     *
     * @returns The Float32Array containing joint matrices
     */
    get jointMatricesArray(): TypedArray;
    /**
     * Gets the compressed joint data chunk (used in Vec4x1 bone data type).
     *
     * @returns The Float32Array containing compressed joint data
     */
    get jointCompressedChunk(): TypedArray;
    /**
     * Gets the compression information for joint data (used in Vec4x1 bone data type).
     *
     * @returns The compression information vector
     */
    get jointCompressedInfo(): MutableVector4;
    /**
     * Gets a copy of the world matrix.
     *
     * @returns A cloned copy of the world matrix
     */
    get worldMatrix(): MutableMatrix44;
    /**
     * Gets the internal world matrix (direct reference).
     *
     * @returns The internal world matrix
     */
    get worldMatrixInner(): MutableMatrix44;
    /**
     * Checks if the world matrix has been updated from its initial state.
     *
     * @returns True if the world matrix has been modified, false otherwise
     */
    get isWorldMatrixUpdated(): boolean;
    /**
     * Sets the visibility of the joint gizmo that visualizes skeletal joints.
     * @param flg - True to show the joint gizmo, false to hide it
     */
    set isJointGizmosVisible(flg: boolean);
    /**
     * Gets the visibility state of the joint gizmo.
     * @returns True if the joint gizmo is visible, false otherwise
     */
    get isJointGizmosVisible(): boolean;
    /**
     * Performs the logic update for skeletal animation.
     * Calculates joint transformations and updates bone data arrays based on the configured bone data type.
     * This method is called during the Logic processing stage.
     *
     * ## Skinning Cache and AnimationComponent Early Return Optimization
     *
     * This method implements a two-level optimization for VRM models with shared skeleton:
     *
     * ### Level 1: Skinning Cache (existing feature)
     * SkeletalComponents with the same joint structure and animation state share skinning results.
     * The first SkeletalComponent ("leader") computes skinning, others reuse the cached result.
     *
     * ### Level 2: AnimationComponent Early Return (new feature)
     * When skinning cache hits, we track the joint EntityUIDs. In the next frame,
     * AnimationComponent can early return for these joints, skipping animation calculations.
     *
     * Key concepts:
     * - **Leader**: The SkeletalComponent that computes skinning (cache miss)
     * - **Follower**: SkeletalComponents that reuse skinning cache (cache hit)
     * - **Leader Joints**: Joints belonging to leaders - these MUST continue animating
     * - **Cached Entity UIDs**: Follower joints that can skip animation in the next frame
     *
     * The leader's joints are protected (__leaderJointEntityUIDs) to ensure animation continues.
     * Only follower joints are registered for early return (__currentFrameCachedEntityUIDs).
     */
    $logic(): void;
    /**
     * Copies matrix data to the matrix array in a specific format.
     * Extracts the first 3 rows of a 4x4 matrix (Mat43 format) for efficient GPU storage.
     *
     * @param m - The source matrix to copy from
     * @param i - The index of the joint/bone
     * @private
     */
    private __copyToMatArray;
    /**
     * Gets the inverse bind matrices accessor.
     *
     * @returns The accessor containing inverse bind matrices, or undefined if not set
     */
    getInverseBindMatricesAccessor(): Accessor | undefined;
    /**
     * Performs a shallow copy from another SkeletalComponent.
     * Copies all relevant skeletal data without deep cloning complex objects.
     *
     * @param component_ - The source component to copy from
     * @protected
     */
    _shallowCopyFrom(component_: Component): void;
    /**
     * Gets the entity that owns this component.
     *
     * @returns The entity with skeletal capabilities that has this component
     */
    get entity(): ISkeletalEntity;
    /**
     * Destroys this component and cleans up resources.
     *
     * @protected
     */
    _destroy(): void;
    /**
     * Checks if an entity's AnimationComponent can perform early return.
     *
     * This is called by AnimationComponent.$logic to determine if animation calculations
     * can be skipped. An entity is considered "cached" if:
     * 1. Its SkeletalComponent had a skinning cache hit in the previous frame
     * 2. It is NOT a "leader" joint (leaders must continue animating)
     *
     * This method also handles the frame transition (swapping current/previous cached UIDs)
     * since AnimationComponent.$logic runs before SkeletalComponent.$logic in each frame.
     *
     * @param entityUID - The entity UID to check (typically a joint/bone entity)
     * @param engine - The engine instance for multi-engine support
     * @returns True if the entity can skip animation calculation, false if it must animate
     */
    static isEntityCached(entityUID: EntityUID, engine: Engine): boolean;
    /**
     * Adds this component to an entity, extending it with skeletal functionality.
     * This method uses mixins to add skeletal-specific methods to the target entity.
     *
     * @param base - The target entity to extend
     * @param _componentClass - The component class being added
     * @returns The entity extended with skeletal component methods
     * @override
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
    /**
     * Gets the inverse bind matrix for a specific joint.
     *
     * @param sg - The SceneGraphComponent representing the joint
     * @returns The inverse bind matrix for the specified joint
     * @private
     */
    _getInverseBindMatrices(sg: SceneGraphComponent): IMatrix44;
    private __copyBoneBuffersFrom;
    private __registerBoneDataMembers;
    private static __buildJointListKey;
    private static __hashBytes;
    private static __getAccessorSignature;
    private static __getBindShapeSignature;
    private __getAnimationTrackFeatureHash;
    private __findAnimationTrackFeatureHash;
    /**
     * Updates the skinning cache key based on current animation state.
     *
     * The cache key determines which SkeletalComponents can share skinning results:
     *
     * ## With Animation Applied
     * - Uses format: `anim|{animationHash}|{inverseBindMatricesSignature}`
     * - animationHash is computed from animation track features (keyframes, timings, etc.)
     * - inverseBindMatricesSignature ensures models with different bone structures don't share cache
     * - Only models with BOTH same animation AND same inverseBindMatrices can share skinning results
     *
     * ## Without Animation
     * - Uses format: `{jointListKey}|{accessorSignature}|no_animation`
     * - EntityUID-based key prevents incorrect sharing between unrelated models
     * - Each model maintains its own cache
     */
    private __updateSkinCacheKey;
    private __createSkinningCache;
    private __applySkinningCache;
}
