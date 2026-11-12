import type { ComponentSID, ComponentTID, EntityUID, Index, TypedArray } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository } from '../../core/EntityRepository';
import { type BoneDataTypeEnum } from '../../definitions/BoneDataType';
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
    /**
     * GPU bone data of all joints. The layout per joint depends on the bone data type:
     * - Mat43x1: 3 vec4 per joint (4x3 matrix, column-major)
     * - Vec4x2: 2 vec4 per joint ([translation.xyz, logQuat.lo], [scale.xyz, logQuat.hi]).
     *   The x scale is negative for a mirrored joint matrix.
     * - Vec4x1: 1 vec4 per joint ([logQuat.lo, logQuat.hi, packedTranslateScale.lo, packedTranslateScale.hi]).
     *   packedTranslateScale is snorm16 x 4: the translation divided by `_boneDataInfo.xyz`, and
     *   log2(|uniform scale|) / 16 (see MathUtil.encodeVec4x1Scale). Bit 31 of logQuat.hi is the sign of the scale.
     *
     * This is a variable-length member: each component gets exactly (joint count) x (vec4 per joint) vec4s,
     * even though skeletal components share buffer views, and shaders find it through `_boneDataLocation`.
     */
    private _boneData;
    /**
     * The location of `_boneData` in the GPU data (written by the memory allocation of Component).
     */
    private _boneDataLocation;
    /**
     * Per-component bone data info: xyz = dequantization factors of translation (Vec4x1 only),
     * w = bone data type index (used by shaders to select the decoding path).
     */
    private _boneDataInfo;
    private __boneDataUint32?;
    private __boneDataType;
    /** Whether __boneDataType was chosen automatically (an automatic Vec4x1 may be switched to Vec4x2) */
    private __isBoneDataTypeAutoSelected;
    private __hasWarnedNonUniformScale;
    private __allocatedBoneDataType?;
    private __boneDataArrayLength;
    private __boneTranslateScaleWork;
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
     * Gets the effective bone data type of this component.
     * If Config.boneDataType is set, it overrides the bone data type of each component.
     *
     * @returns The effective bone data type
     */
    get boneDataType(): BoneDataTypeEnum;
    /**
     * Sets the bone data type of this component.
     * Mat43x1 is the most precise (and the largest), Vec4x2 supports non-uniform scale,
     * and Vec4x1 is the most compact but supports only uniform scale.
     * If joints are already set and the GPU data layout changes, the bone data is re-allocated.
     * Note that Config.boneDataType, if set, takes precedence over this value.
     *
     * If a non-uniform scale is found at runtime with Vec4x1, an automatically selected Vec4x1 is switched to Vec4x2,
     * while an explicitly specified Vec4x1 is kept (the largest scale is used, and a warning is logged once).
     *
     * @param boneDataType - The bone data type to use
     * @param isAutoSelected - True if the type was chosen automatically (e.g. by the glTF importer) rather than
     *   specified by the user
     */
    setBoneDataType(boneDataType: BoneDataTypeEnum, isAutoSelected?: boolean): void;
    /**
     * Re-allocates the bone data if the effective bone data type differs from the allocated layout.
     */
    private __ensureBoneDataLayout;
    /**
     * Calculates the array length (in vec4) of the bone data.
     * The bone data is a variable-length member, so this is exact regardless of skeletalComponentCountPerBufferView.
     *
     * @param boneDataType - The bone data type
     * @param jointCount - The number of joints
     * @returns The array length in vec4
     */
    private static __calcBoneDataArrayLength;
    /**
     * Returns the per-instance array length of the bone data for memory allocation.
     *
     * @param memberName - The name of the member field
     * @returns The array length, or undefined for other members
     */
    protected _getArrayLengthForAllocation(memberName: string): number | undefined;
    private __setBoneDataInfo;
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
     * Gets the GPU bone data array of all joints.
     * The layout depends on the bone data type (see the `boneDataType` getter).
     *
     * @returns The Float32Array containing the bone data
     */
    get boneDataArray(): TypedArray;
    /**
     * Gets the bone data info (xyz: translation dequantization factors for Vec4x1, w: bone data type index).
     *
     * @returns The bone data info vector
     */
    get boneDataInfo(): MutableVector4;
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
     * Calculates the determinant of the upper-left 3x3 part of a column-major 4x4 matrix.
     *
     * @param v - The matrix elements (column-major)
     * @returns The determinant
     */
    private static __determinant3x3;
    /**
     * Extracts the rotation R of M = T * R * S, given the (signed) scales of S.
     * The columns of the upper-left 3x3 of `m` are divided by the scales in place.
     *
     * If the rotation cannot be extracted (e.g. a zero scale used to hide a part of a mesh), the identity is
     * returned without logging an error, since the rotation does not affect the result in that case.
     *
     * @param m - The matrix to decompose (overwritten)
     * @param sx - The x scale (negative for a mirrored axis)
     * @param sy - The y scale (negative for a mirrored axis)
     * @param sz - The z scale (negative for a mirrored axis)
     * @returns The rotation (a shared temporary quaternion)
     */
    private static __extractRotation;
    /**
     * Handles a non-uniform scale found with the Vec4x1 bone data type, which supports only uniform scale.
     * An automatically selected Vec4x1 is switched to Vec4x2. An explicitly specified Vec4x1 (setBoneDataType or
     * Config.boneDataType) is kept, and a warning is logged once (the largest scale of each joint is used).
     *
     * The components sharing the skinning cache with this one are switched together. Otherwise they would get
     * a different cache key and lose the shared result, and a follower would fall back to its own joints, which
     * may not be animated (see the AnimationComponent early return). If any of them specifies Vec4x1 explicitly,
     * none of them is switched.
     *
     * @returns True if the bone data type has been switched to Vec4x2
     */
    private __handleNonUniformScaleOfVec4x1;
    /**
     * Gets the skeletal components that share the skinning cache with this component (including this one).
     *
     * @returns The components with the same skinning cache key
     */
    private __getComponentsSharingSkinCache;
    /**
     * Gets a CPU-side work buffer for translation and scale (used only in Vec4x1 bone data type).
     *
     * @param boneDataType - The bone data type
     * @returns The work buffer (empty unless Vec4x1)
     */
    private __getTranslateScaleWork;
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
    /**
     * Registers the bone data member and its location member.
     * The bone data is a variable-length member, so its size is decided per component
     * (see `_getArrayLengthForAllocation`).
     */
    static _registerBoneDataMember(): void;
    /**
     * Registers the bone data info member (one vec4 per component).
     */
    static _registerBoneDataInfoMember(): void;
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
