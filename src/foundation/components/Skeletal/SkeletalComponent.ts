import type { ComponentSID, ComponentTID, EntityUID, Index, TypedArray } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { applyMixins, type EntityRepository } from '../../core/EntityRepository';
import { BoneDataType, type BoneDataTypeEnum } from '../../definitions/BoneDataType';
import { BufferUse } from '../../definitions/BufferUse';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { ProcessStage } from '../../definitions/ProcessStage';
import { ShaderType } from '../../definitions/ShaderType';
import type { ISceneGraphEntity, ISkeletalEntity } from '../../helpers/EntityHelper';
import type { IMatrix44 } from '../../math/IMatrix';
import { MathUtil } from '../../math/MathUtil';
import { Matrix44 } from '../../math/Matrix44';
import { MutableMatrix44 } from '../../math/MutableMatrix44';
import { MutableQuaternion } from '../../math/MutableQuaternion';
import { MutableVector4 } from '../../math/MutableVector4';
import { VectorN } from '../../math/VectorN';
import type { Accessor } from '../../memory/Accessor';
import { DataUtil, Is } from '../../misc';
import type { Engine } from '../../system/Engine';
import { AnimationStateRepository } from '../Animation/AnimationStateRepository';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import type { SceneGraphComponent } from '../SceneGraph/SceneGraphComponent';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

type SkinningCache = {
  processFrameToken: number;
  boneData?: TypedArray;
  boneDataInfo: [number, number, number, number];
  jointMatrix: TypedArray;
  isWorldMatrixVanilla: boolean;
};

/**
 * Vec4x1: bit 31 of logQuat.hi (unused by the 63-bit log-quaternion) tells that the uniform scale is negative,
 * which represents a mirrored joint matrix. Must match RN_VEC4X1_NEGATIVE_SCALE_BIT in the shaders.
 */
const VEC4X1_NEGATIVE_SCALE_BIT = 0x80000000;

/**
 * SkeletalComponent manages skeletal animation for entities.
 * This component handles bone transformations, joint matrices, and skinning calculations
 * for 3D models with skeletal animation systems.
 */
export class SkeletalComponent extends Component {
  public _jointIndices: Index[] = [];
  private __joints: SceneGraphComponent[] = [];
  private __inverseBindMatricesAccessor?: Accessor;
  public _bindShapeMatrix?: Matrix44;
  private __jointMatrices?: number[];
  public topOfJointsHierarchy?: SceneGraphComponent;
  public isSkinning = true;
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
  private _boneData = VectorN.dummy();
  /**
   * The location of `_boneData` in the GPU data (written by the memory allocation of Component).
   */
  private _boneDataLocation = MutableVector4.dummy();
  /**
   * Per-component bone data info: xyz = dequantization factors of translation (Vec4x1 only),
   * w = bone data type index (used by shaders to select the decoding path).
   */
  private _boneDataInfo = MutableVector4.dummy();
  private __boneDataUint32?: Uint32Array;
  private __boneDataType: BoneDataTypeEnum = BoneDataType.Vec4x2;
  /** Whether __boneDataType was chosen automatically (an automatic Vec4x1 may be switched to Vec4x2) */
  private __isBoneDataTypeAutoSelected = false;
  private __hasWarnedNonUniformScale = false;
  private __allocatedBoneDataType?: BoneDataTypeEnum;
  private __boneDataArrayLength = 0;
  private __boneTranslateScaleWork = new Float32Array(0);
  private __jointMatrix = MutableMatrix44.identity();
  private __isWorldMatrixVanilla = true;
  _isCulled = false;
  private static __skinCalculationCache: Map<string, SkinningCache> = new Map();
  private static __accessorSignatureCache: WeakMap<Accessor, string> = new WeakMap();
  private static __bindShapeSignatureMap: WeakMap<Matrix44, string> = new WeakMap();

  private __jointListKey?: string;
  private __skinCacheKey?: string;
  private __inverseBindMatricesSignature?: string;
  private static __tookGlobalDataNum = 0;
  private static __tmp_mat4 = MutableMatrix44.identity();
  private static __tmp_q: MutableQuaternion = MutableQuaternion.fromCopy4(0, 0, 0, 1);
  private static __tmp_mat4_2 = MutableMatrix44.identity();
  private static __tmp_mat4_3 = MutableMatrix44.identity();
  private static __tmp_mat4_4 = MutableMatrix44.identity();

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
  constructor(
    engine: Engine,
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository,
    isReUse: boolean
  ) {
    super(engine, entityUid, componentSid, entityRepository, isReUse);
    this.moveStageTo(ProcessStage.Logic);

    if (isReUse) {
      // Reset bone data buffers when reusing component to prevent display corruption
      this.__resetBoneDataBuffers();
      // Reset world matrix to initial state
      this.__jointMatrix = MutableMatrix44.identity();
      this.__isWorldMatrixVanilla = true;
      // Clear joint-related state
      this.__joints = [];
      this.__jointMatrices = undefined;
      this.topOfJointsHierarchy = undefined;
      this._bindShapeMatrix = undefined;
      this.isSkinning = true;
      this.__boneDataType = BoneDataType.Vec4x2;
      this.__isBoneDataTypeAutoSelected = false;
      this.__hasWarnedNonUniformScale = false;
      this.__allocatedBoneDataType = undefined;
      this.__boneDataArrayLength = 0;
      this.__jointListKey = undefined;
      this.__skinCacheKey = undefined;
      this.__inverseBindMatricesSignature = undefined;
      return;
    }

    SkeletalComponent.__tookGlobalDataNum++;
  }

  /**
   * Resets GPU-bound vector fields so they can be re-bound on reuse.
   * Clears any existing data to prevent contamination from previous models.
   */
  private __resetBoneDataBuffers() {
    // Clear existing data if present before resetting to dummy
    if (!this._boneData.isDummy()) {
      this._boneData._v.fill(0);
    }

    // Reset to dummy object for re-binding
    this._boneData = VectorN.dummy();
    this.__boneDataUint32 = undefined;
  }

  /**
   * Gets the static component type identifier for SkeletalComponent.
   *
   * @returns The component type identifier
   */
  static get componentTID() {
    return WellKnownComponentTIDs.SkeletalComponentTID;
  }

  /**
   * Gets the component type identifier for this instance.
   *
   * @returns The component type identifier
   */
  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.SkeletalComponentTID;
  }

  /**
   * Sets the accessor for inverse bind matrices used in skeletal animation.
   * These matrices transform vertices from model space to bone space.
   *
   * @param inverseBindMatricesAccessor - The accessor containing inverse bind matrices data
   */
  setInverseBindMatricesAccessor(inverseBindMatricesAccessor: Accessor) {
    this.__inverseBindMatricesAccessor = inverseBindMatricesAccessor;
    this.__inverseBindMatricesSignature = SkeletalComponent.__getAccessorSignature(inverseBindMatricesAccessor);
    this.__updateSkinCacheKey();
  }

  /**
   * Sets the joint hierarchy for this skeletal component.
   * Initializes the appropriate data arrays based on the configured bone data type.
   *
   * @param joints - Array of SceneGraphComponents representing the joints/bones
   */
  setJoints(joints: SceneGraphComponent[]) {
    this.__joints = joints;
    this.__jointListKey = SkeletalComponent.__buildJointListKey(joints);
    this.__resetBoneDataBuffers();

    const boneDataType = this.boneDataType;
    this.__boneDataArrayLength = SkeletalComponent.__calcBoneDataArrayLength(boneDataType, joints.length);

    // Check if this component is being reused to determine allocation strategy
    const isComponentReused = this.__isReUse;
    this.submitToAllocation(this.__engine.config.skeletalComponentCountPerBufferView, isComponentReused);

    this.__boneDataUint32 = new Uint32Array(
      this._boneData._v.buffer,
      this._boneData._v.byteOffset,
      this._boneData._v.length
    );
    this.__allocatedBoneDataType = boneDataType;
    this.__setBoneDataInfo(1, 1, 1, boneDataType);
    this.__updateSkinCacheKey();
  }

  /**
   * Gets the effective bone data type of this component.
   * If Config.boneDataType is set, it overrides the bone data type of each component.
   *
   * @returns The effective bone data type
   */
  get boneDataType(): BoneDataTypeEnum {
    return this.__engine.config.boneDataType ?? this.__boneDataType;
  }

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
  setBoneDataType(boneDataType: BoneDataTypeEnum, isAutoSelected = false) {
    this.__boneDataType = boneDataType;
    this.__isBoneDataTypeAutoSelected = isAutoSelected;
    this.__ensureBoneDataLayout();
  }

  /**
   * Re-allocates the bone data if the effective bone data type differs from the allocated layout.
   */
  private __ensureBoneDataLayout() {
    const boneDataType = this.boneDataType;
    if (this.__allocatedBoneDataType === undefined || this.__allocatedBoneDataType === boneDataType) {
      return;
    }
    this.setJoints(this.__joints);
  }

  /**
   * Calculates the array length (in vec4) of the bone data.
   * The bone data is a variable-length member, so this is exact regardless of skeletalComponentCountPerBufferView.
   *
   * @param boneDataType - The bone data type
   * @param jointCount - The number of joints
   * @returns The array length in vec4
   */
  private static __calcBoneDataArrayLength(boneDataType: BoneDataTypeEnum, jointCount: number) {
    return Math.max(jointCount, 1) * BoneDataType.getVec4CountPerJoint(boneDataType);
  }

  /**
   * Returns the per-instance array length of the bone data for memory allocation.
   *
   * @param memberName - The name of the member field
   * @returns The array length, or undefined for other members
   */
  protected _getArrayLengthForAllocation(memberName: string): number | undefined {
    if (memberName === 'boneData' && this.__boneDataArrayLength > 0) {
      return this.__boneDataArrayLength;
    }
    return undefined;
  }

  private __setBoneDataInfo(x: number, y: number, z: number, boneDataType: BoneDataTypeEnum) {
    if (this._boneDataInfo.isDummy()) {
      return;
    }
    const v = this._boneDataInfo._v;
    v[0] = x;
    v[1] = y;
    v[2] = z;
    v[3] = boneDataType.index;
  }

  /**
   * Lightweight joint update for remapping during shallow copy.
   * Only updates joint references without reinitializing buffers.
   * Used when joints are remapped to new entities during shallow copy.
   */
  updateJointsLightweight(joints: SceneGraphComponent[]) {
    this.__joints = joints;
    this.__jointListKey = SkeletalComponent.__buildJointListKey(joints);
    this.__updateSkinCacheKey();
  }

  /**
   * Gets a copy of the joints array.
   *
   * @returns A copy of the SceneGraphComponents representing the joints
   */
  getJoints(): SceneGraphComponent[] {
    return this.__joints.concat();
  }

  /**
   * Gets the world matrix of the root joint in the hierarchy.
   *
   * @returns The world matrix of the top joint, or undefined if no top joint exists
   */
  get rootJointWorldMatrixInner() {
    return this.topOfJointsHierarchy?.matrixInner;
  }

  /**
   * Gets the computed joint matrices array.
   *
   * @returns The joint matrices array
   */
  get jointMatrices() {
    return this.__jointMatrices;
  }

  /**
   * Gets the GPU bone data array of all joints.
   * The layout depends on the bone data type (see the `boneDataType` getter).
   *
   * @returns The Float32Array containing the bone data
   */
  get boneDataArray() {
    return this._boneData._v;
  }

  /**
   * Gets the bone data info (xyz: translation dequantization factors for Vec4x1, w: bone data type index).
   *
   * @returns The bone data info vector
   */
  get boneDataInfo() {
    return this._boneDataInfo;
  }

  /**
   * Gets a copy of the world matrix.
   *
   * @returns A cloned copy of the world matrix
   */
  get worldMatrix() {
    return this.__jointMatrix.clone();
  }

  /**
   * Gets the internal world matrix (direct reference).
   *
   * @returns The internal world matrix
   */
  get worldMatrixInner() {
    return MutableMatrix44.multiplyTo(this.entity.matrixInner, this.__jointMatrix, SkeletalComponent.__tmp_mat4_4);
  }

  /**
   * Checks if the world matrix has been updated from its initial state.
   *
   * @returns True if the world matrix has been modified, false otherwise
   */
  get isWorldMatrixUpdated() {
    return !this.__isWorldMatrixVanilla;
  }

  /**
   * Sets the visibility of the joint gizmo that visualizes skeletal joints.
   * @param flg - True to show the joint gizmo, false to hide it
   */
  set isJointGizmosVisible(flg: boolean) {
    for (let i = 0; i < this.__joints.length; i++) {
      this.__joints[i].isJointGizmoVisible = flg;
    }
  }

  /**
   * Gets the visibility state of the joint gizmo.
   * @returns True if the joint gizmo is visible, false otherwise
   */
  get isJointGizmosVisible() {
    for (let i = 0; i < this.__joints.length; i++) {
      if (this.__joints[i].isJointGizmoVisible) {
        return true;
      }
    }
    return false;
  }

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
  $logic() {
    // Skip if skinning is disabled or entity is culled
    if (!this.isSkinning || this._isCulled) {
      return;
    }

    // --- Frame Transition: Swap cached entity UIDs ---
    // When a new frame starts, move current frame's cached UIDs to previous frame.
    // AnimationComponent uses previous frame's data because it runs before SkeletalComponent.
    const currentProcessFrameToken = AnimationStateRepository.getProcessFrameToken(this.__engine);
    AnimationStateRepository.handleFrameTransitionIfNeeded(this.__engine, currentProcessFrameToken);

    // Joints have not been set yet (no bone data is allocated)
    if (this._boneData.isDummy()) {
      return;
    }
    // Follow changes of Config.boneDataType at runtime
    this.__ensureBoneDataLayout();

    // --- Skinning Cache Lookup ---
    this.__updateSkinCacheKey();
    const cacheKey = this.__skinCacheKey;
    // Use the Engine.process() token instead of TransformComponent.updateCount for cache
    // validity. updateCount changes when AnimationComponents update joints, including while
    // this frame is still being processed. The process token stays stable for the whole frame.

    // ============================================================================
    // Skinning Cache Hit/Miss Logic with Leader/Follower Pattern
    // ============================================================================
    // This implements an optimization for multiple VRM models with identical skeleton
    // structures (e.g., same model loaded multiple times or shallowCopied).
    //
    // Key concepts:
    // - "Leader": The first SkeletalComponent to compute skinning for a given cache key.
    //   Its joints MUST continue animating to provide animation data for all models.
    // - "Follower": Subsequent SkeletalComponents that reuse the leader's skinning result.
    //   Their joints can skip animation calculation (early return in AnimationComponent).
    //
    // The jointIndex-based comparison allows:
    // - shallowCopy: Same entityUID for joints → joints are shared, no registration needed
    // - Separate load: Different entityUID but same jointIndex → register for early return
    // ============================================================================

    const cacheLeaders = AnimationStateRepository.getOrCreateCacheLeaders(this.__engine);
    const leaderJointIndexToEntityUID = AnimationStateRepository.getOrCreateLeaderJointIndexToEntityUID(this.__engine);
    const currentFrameCachedEntityUIDs = AnimationStateRepository.getOrCreateCurrentFrameCachedEntityUIDs(
      this.__engine
    );

    if (cacheKey) {
      const cache = SkeletalComponent.__skinCalculationCache.get(cacheKey);

      // --- Cache Hit: Reuse existing skinning result ---
      // Check if a valid cache exists for this Engine.process() frame.
      if (cache?.processFrameToken === currentProcessFrameToken) {
        // Determine if this SkeletalComponent is the "leader" for this cache key.
        // Leaders computed the skinning result, so their joints must continue animating.
        const isLeader = cacheLeaders.get(cacheKey) === this.entityUID;

        if (!isLeader) {
          // This is a "follower" - register its joints for AnimationComponent early return.
          // Use jointIndex (skeleton structure) to compare with leader's joints.
          for (const joint of this.__joints) {
            const leaderEntityUID = leaderJointIndexToEntityUID.get(joint.jointIndex);
            // Register only if:
            // 1. Same jointIndex exists in leader (same skeleton structure)
            // 2. EntityUID is DIFFERENT (separately loaded model, not shallowCopy)
            if (leaderEntityUID !== undefined && leaderEntityUID !== joint.entityUID) {
              currentFrameCachedEntityUIDs.add(joint.entityUID);
            }
            // If entityUID is the SAME, this is a shallowCopy case.
            // The joint is shared with leader, so no registration needed.
          }
        }
        // Leader case: Do not register joints - leader must continue animating

        // Apply cached skinning result and return early
        this.__applySkinningCache(cache);
        return;
      }

      // --- Cache Miss: This SkeletalComponent becomes the "leader" ---
      // Register this component as the leader for this cache key
      cacheLeaders.set(cacheKey, this.entityUID);

      // Build jointIndex → entityUID mapping for this leader's joints.
      // Followers will use this to compare their joints by structure (jointIndex)
      // rather than by identity (entityUID).
      for (const joint of this.__joints) {
        leaderJointIndexToEntityUID.set(joint.jointIndex, joint.entityUID);
      }
    }

    const boneDataType = this.__allocatedBoneDataType!;
    const boneData = this._boneData._v;
    const boneDataUint32 = this.__boneDataUint32!;
    const translateScaleWork = this.__getTranslateScaleWork(boneDataType);
    const inverseGlobalTransform = MutableMatrix44.invertTo(this.entity.matrixInner, SkeletalComponent.__tmp_mat4_2);
    let hasNonUniformScale = false;
    for (let i = 0; i < this.__joints.length; i++) {
      const joint = this.__joints[i];
      const globalJointTransform = joint.matrixInner;

      const jointMatrix = MutableMatrix44.multiplyTo(
        inverseGlobalTransform,
        MutableMatrix44.multiplyTypedArrayTo(
          globalJointTransform,
          this.__inverseBindMatricesAccessor!.getTypedArray(),
          SkeletalComponent.__tmp_mat4,
          i
        ),
        SkeletalComponent.__tmp_mat4_3
      );
      if (this._bindShapeMatrix) {
        // glTF1 skins: the bind shape matrix is applied to vertices before the inverse bind matrix
        jointMatrix.multiply(this._bindShapeMatrix);
      }
      const m = jointMatrix;

      if (i === 0 && joint.entity.tryToGetAnimation() != null) {
        this.__jointMatrix.copyComponents(m);
      }
      if (i === 1 && this.__joints[0].entity.tryToGetAnimation() == null) {
        // if the first joint has no animation (e.g. Root joint), expect the second joint to have a significant matrix
        this.__jointMatrix.copyComponents(m);
      }

      this.__isWorldMatrixVanilla = false;

      if (boneDataType === BoneDataType.Mat43x1) {
        this.__copyToMatArray(m, i);
        continue;
      }

      // Decompose M = T * R * S: each column of the upper-left 3x3 is an axis of R multiplied by its scale
      const v = m._v;
      const sx = Math.hypot(v[0], v[1], v[2]);
      const sy = Math.hypot(v[4], v[5], v[6]);
      const sz = Math.hypot(v[8], v[9], v[10]);
      // A mirrored matrix (det < 0) is not a rotation times positive scales, so it needs a negative scale
      const isMirrored = SkeletalComponent.__determinant3x3(v) < 0;

      if (boneDataType === BoneDataType.Vec4x2) {
        // Negate the x scale of a mirrored matrix so that R is a proper rotation
        const signedSx = isMirrored ? -sx : sx;
        const q = SkeletalComponent.__extractRotation(m, signedSx, sy, sz);
        const logQuat = MathUtil.encodeLogQuat(q.x, q.y, q.z, q.w);
        // [translation.xyz, logQuat.lo], [scale.xyz, logQuat.hi]
        const base = i * 8;
        boneData[base + 0] = v[12];
        boneData[base + 1] = v[13];
        boneData[base + 2] = v[14];
        boneDataUint32[base + 3] = logQuat[0];
        boneData[base + 4] = signedSx;
        boneData[base + 5] = sy;
        boneData[base + 6] = sz;
        boneDataUint32[base + 7] = logQuat[1];
      } else {
        // Vec4x1 supports only uniform scale: the largest one is used
        if (!hasNonUniformScale && !MathUtil.isUniformScale(sx, sy, sz)) {
          hasNonUniformScale = true;
        }
        // Represent a mirrored matrix as R * (-s): negate all the axes so that R is a proper rotation
        const sign = isMirrored ? -1 : 1;
        const q = SkeletalComponent.__extractRotation(m, sign * sx, sign * sy, sign * sz);
        const logQuat = MathUtil.encodeLogQuat(q.x, q.y, q.z, q.w);
        // [logQuat.lo, logQuat.hi (bit 31: negative scale), packedTranslateScale.lo, packedTranslateScale.hi]
        // The translation and the scale are packed after this loop, as the translation is normalized by the max.
        translateScaleWork[i * 4 + 0] = v[12];
        translateScaleWork[i * 4 + 1] = v[13];
        translateScaleWork[i * 4 + 2] = v[14];
        translateScaleWork[i * 4 + 3] = Math.max(sx, sy, sz);
        boneDataUint32[i * 4 + 0] = logQuat[0];
        boneDataUint32[i * 4 + 1] = isMirrored ? (logQuat[1] | VEC4X1_NEGATIVE_SCALE_BIT) >>> 0 : logQuat[1];
      }
    }

    if (hasNonUniformScale && this.__handleNonUniformScaleOfVec4x1()) {
      // Switched to Vec4x2: compute again with the new layout (the skinning cache key changes as well)
      this.$logic();
      return;
    }

    if (boneDataType === BoneDataType.Vec4x1) {
      let maxAbsX = 1;
      let maxAbsY = 1;
      let maxAbsZ = 1;
      for (let i = 0; i < this.__joints.length; i++) {
        const absX = Math.abs(translateScaleWork[i * 4 + 0]);
        if (absX > maxAbsX) {
          maxAbsX = absX;
        }
        const absY = Math.abs(translateScaleWork[i * 4 + 1]);
        if (absY > maxAbsY) {
          maxAbsY = absY;
        }
        const absZ = Math.abs(translateScaleWork[i * 4 + 2]);
        if (absZ > maxAbsZ) {
          maxAbsZ = absZ;
        }
      }

      for (let i = 0; i < this.__joints.length; i++) {
        // Pack the normalized translation and the uniform scale (in log2 space, so that scales over 1 are kept)
        const normalizedX = translateScaleWork[i * 4 + 0] / maxAbsX;
        const normalizedY = translateScaleWork[i * 4 + 1] / maxAbsY;
        const normalizedZ = translateScaleWork[i * 4 + 2] / maxAbsZ;
        const encodedScale = MathUtil.encodeVec4x1Scale(translateScaleWork[i * 4 + 3]);

        const vec2TPacked = MathUtil.packSnormVec4ToUVec2(normalizedX, normalizedY, normalizedZ, encodedScale);
        boneDataUint32[i * 4 + 2] = vec2TPacked[0];
        boneDataUint32[i * 4 + 3] = vec2TPacked[1];
      }
      this.__setBoneDataInfo(maxAbsX, maxAbsY, maxAbsZ, boneDataType);
    } else {
      this.__setBoneDataInfo(1, 1, 1, boneDataType);
    }

    if (cacheKey) {
      SkeletalComponent.__skinCalculationCache.set(cacheKey, this.__createSkinningCache(currentProcessFrameToken));
    }
  }

  /**
   * Calculates the determinant of the upper-left 3x3 part of a column-major 4x4 matrix.
   *
   * @param v - The matrix elements (column-major)
   * @returns The determinant
   */
  private static __determinant3x3(v: ArrayLike<number>) {
    // c0 . (c1 x c2)
    return (
      v[0] * (v[5] * v[10] - v[6] * v[9]) + v[1] * (v[6] * v[8] - v[4] * v[10]) + v[2] * (v[4] * v[9] - v[5] * v[8])
    );
  }

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
  private static __extractRotation(m: MutableMatrix44, sx: number, sy: number, sz: number) {
    const v = m._v;
    const invSx = 1 / sx;
    const invSy = 1 / sy;
    const invSz = 1 / sz;
    v[0] *= invSx;
    v[1] *= invSx;
    v[2] *= invSx;
    v[4] *= invSy;
    v[5] *= invSy;
    v[6] *= invSy;
    v[8] *= invSz;
    v[9] *= invSz;
    v[10] *= invSz;
    const q = SkeletalComponent.__tmp_q;
    if (!q.tryFromMatrix(m)) {
      q.setComponents(0, 0, 0, 1);
    }
    return q;
  }

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
  private __handleNonUniformScaleOfVec4x1(): boolean {
    const sharingComponents = this.__getComponentsSharingSkinCache();
    if (
      this.__engine.config.boneDataType == null &&
      sharingComponents.every(component => component.__isBoneDataTypeAutoSelected)
    ) {
      for (const component of sharingComponents) {
        component.setBoneDataType(BoneDataType.Vec4x2, true);
      }
      this.__engine.logger.info(
        `SkeletalComponent (entity ${this.entityUID}): switched the bone data type from Vec4x1 to Vec4x2 because a non-uniform scale was found (${sharingComponents.length} component(s) sharing the skinning cache).`
      );
      return this.__allocatedBoneDataType === BoneDataType.Vec4x2;
    }
    if (!this.__hasWarnedNonUniformScale) {
      this.__hasWarnedNonUniformScale = true;
      this.__engine.logger.warn(
        `SkeletalComponent (entity ${this.entityUID}): the Vec4x1 bone data type supports only uniform scale, but a non-uniform scale was found. The largest scale is used. Use Vec4x2 or Mat43x1 for this skeleton.`
      );
    }
    return false;
  }

  /**
   * Gets the skeletal components that share the skinning cache with this component (including this one).
   *
   * @returns The components with the same skinning cache key
   */
  private __getComponentsSharingSkinCache(): SkeletalComponent[] {
    const key = this.__skinCacheKey;
    if (key == null) {
      return [this];
    }
    const components = (this.__engine.componentRepository.getComponentsWithType(SkeletalComponent) ??
      []) as SkeletalComponent[];
    return components.filter(component => component === this || component.__skinCacheKey === key);
  }

  /**
   * Gets a CPU-side work buffer for translation and scale (used only in Vec4x1 bone data type).
   *
   * @param boneDataType - The bone data type
   * @returns The work buffer (empty unless Vec4x1)
   */
  private __getTranslateScaleWork(boneDataType: BoneDataTypeEnum) {
    if (boneDataType !== BoneDataType.Vec4x1) {
      return this.__boneTranslateScaleWork;
    }
    const requiredLength = this.__joints.length * 4;
    if (this.__boneTranslateScaleWork.length < requiredLength) {
      this.__boneTranslateScaleWork = new Float32Array(requiredLength);
    }
    return this.__boneTranslateScaleWork;
  }

  /**
   * Copies matrix data to the matrix array in a specific format.
   * Extracts the first 3 rows of a 4x4 matrix (Mat43 format) for efficient GPU storage.
   *
   * @param m - The source matrix to copy from
   * @param i - The index of the joint/bone
   * @private
   */
  private __copyToMatArray(m: IMatrix44, i: Index) {
    // 0  1  2  3
    // 4  5  6  7
    // 8  9  10 11
    // 12 13 14 15

    this._boneData._v[i * 12 + 0] = m._v[0];
    this._boneData._v[i * 12 + 1] = m._v[1];
    this._boneData._v[i * 12 + 2] = m._v[2];
    this._boneData._v[i * 12 + 3] = m._v[4];
    this._boneData._v[i * 12 + 4] = m._v[5];
    this._boneData._v[i * 12 + 5] = m._v[6];
    this._boneData._v[i * 12 + 6] = m._v[8];
    this._boneData._v[i * 12 + 7] = m._v[9];
    this._boneData._v[i * 12 + 8] = m._v[10];
    this._boneData._v[i * 12 + 9] = m._v[12];
    this._boneData._v[i * 12 + 10] = m._v[13];
    this._boneData._v[i * 12 + 11] = m._v[14];
  }

  /**
   * Gets the inverse bind matrices accessor.
   *
   * @returns The accessor containing inverse bind matrices, or undefined if not set
   */
  public getInverseBindMatricesAccessor(): Accessor | undefined {
    return this.__inverseBindMatricesAccessor;
  }

  /**
   * Performs a shallow copy from another SkeletalComponent.
   * Copies all relevant skeletal data without deep cloning complex objects.
   *
   * @param component_ - The source component to copy from
   * @protected
   */
  _shallowCopyFrom(component_: Component): void {
    const component = component_ as SkeletalComponent;

    this._jointIndices = component._jointIndices.concat();
    this.__boneDataType = component.__boneDataType;
    this.__isBoneDataTypeAutoSelected = component.__isBoneDataTypeAutoSelected;

    if (component.__joints.length > 0) {
      this.setJoints(component.__joints.concat());
      this.__copyBoneBuffersFrom(component);
    } else {
      this.__joints = [];
    }

    this.__inverseBindMatricesAccessor = component.__inverseBindMatricesAccessor;
    if (Is.exist(component._bindShapeMatrix)) {
      this._bindShapeMatrix = component._bindShapeMatrix.clone();
    }
    this.topOfJointsHierarchy = component.topOfJointsHierarchy;
    this.isSkinning = component.isSkinning;
    this.__jointMatrix.copyComponents(component.__jointMatrix);
    this.__isWorldMatrixVanilla = component.__isWorldMatrixVanilla;
    this.__inverseBindMatricesSignature = component.__inverseBindMatricesSignature;
    this.__jointListKey = component.__jointListKey;
    this.__updateSkinCacheKey();
  }

  /**
   * Gets the entity that owns this component.
   *
   * @returns The entity with skeletal capabilities that has this component
   */
  get entity(): ISkeletalEntity {
    return this.__engine.entityRepository.getEntity(this.__entityUid) as unknown as ISkeletalEntity;
  }

  /**
   * Destroys this component and cleans up resources.
   *
   * @protected
   */
  _destroy(): void {
    super._destroy();
  }

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
  static isEntityCached(entityUID: EntityUID, engine: Engine): boolean {
    return AnimationStateRepository.isEntityCached(entityUID, engine);
  }

  /**
   * Adds this component to an entity, extending it with skeletal functionality.
   * This method uses mixins to add skeletal-specific methods to the target entity.
   *
   * @param base - The target entity to extend
   * @param _componentClass - The component class being added
   * @returns The entity extended with skeletal component methods
   * @override
   */
  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class SkeletalEntity extends (base.constructor as any) {
      getSkeletal() {
        return this.getComponentByComponentTID(WellKnownComponentTIDs.SkeletalComponentTID) as SkeletalComponent;
      }
    }
    applyMixins(base, SkeletalEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }

  /**
   * Gets the inverse bind matrix for a specific joint.
   *
   * @param sg - The SceneGraphComponent representing the joint
   * @returns The inverse bind matrix for the specified joint
   * @private
   */
  _getInverseBindMatrices(sg: SceneGraphComponent): IMatrix44 {
    const index = this.__joints.indexOf(sg);
    const float32Array = this.__inverseBindMatricesAccessor!.getTypedArray() as Float32Array;
    const m = new Matrix44(float32Array.slice(index * 16, index * 16 + 16));
    return m;
  }

  private __copyBoneBuffersFrom(component: SkeletalComponent) {
    const copyVector = (target: VectorN, source: VectorN) => {
      if (target.isDummy() || source.isDummy()) {
        return;
      }
      target.copyComponents(source);
    };

    if (Is.exist(component.__jointMatrices)) {
      this.__jointMatrices = component.__jointMatrices!.concat();
    } else {
      this.__jointMatrices = undefined;
    }

    if (
      this.__allocatedBoneDataType === component.__allocatedBoneDataType &&
      this._boneData._v.length === component._boneData._v.length
    ) {
      copyVector(this._boneData, component._boneData);
      if (!this._boneDataInfo.isDummy() && !component._boneDataInfo.isDummy()) {
        this._boneDataInfo.copyComponents(component._boneDataInfo);
      }
    }
  }

  /**
   * Registers the bone data member and its location member.
   * The bone data is a variable-length member, so its size is decided per component
   * (see `_getArrayLengthForAllocation`).
   */
  static _registerBoneDataMember() {
    // Must be registered before the variable-length member
    SkeletalComponent.registerMember({
      bufferUse: BufferUse.GPUInstanceData,
      memberName: 'boneDataLocation',
      dataClassType: MutableVector4,
      shaderType: ShaderType.VertexShader,
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      initValues: [0, 0, 0, 0],
    });
    SkeletalComponent.registerMember({
      bufferUse: BufferUse.GPUInstanceData,
      memberName: 'boneData',
      dataClassType: VectorN,
      shaderType: ShaderType.VertexShader,
      compositionType: CompositionType.Vec4Array,
      componentType: ComponentType.Float,
      initValues: new VectorN(new Float32Array(0)),
      isVariableLength: true,
      // Uniform mode: reserve up to 3 vec4 per joint (Mat43x1)
      uniformArrayLengthMultiplier: BoneDataType.getVec4CountPerJoint(BoneDataType.Mat43x1),
    });
  }

  /**
   * Registers the bone data info member (one vec4 per component).
   */
  static _registerBoneDataInfoMember() {
    SkeletalComponent.registerMember({
      bufferUse: BufferUse.GPUInstanceData,
      memberName: 'boneDataInfo',
      dataClassType: MutableVector4,
      shaderType: ShaderType.VertexShader,
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      initValues: [1, 1, 1, BoneDataType.Vec4x2.index],
    });
  }

  private static __buildJointListKey(joints: SceneGraphComponent[]) {
    // Prefer glTF node indices (jointIndex) so skins sharing the same node list map to the same key.
    return joints.map(joint => (joint.jointIndex >= 0 ? joint.jointIndex : -1)).join(',');
  }

  private static __hashBytes(uint8Array: Uint8Array) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < uint8Array.length; i++) {
      hash ^= uint8Array[i];
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
      hash >>>= 0;
    }
    return hash >>> 0;
  }

  private static __getAccessorSignature(accessor: Accessor) {
    const cached = this.__accessorSignatureCache.get(accessor);
    if (cached !== undefined) {
      return cached;
    }

    const typedArray = accessor.getTypedArray();
    const view = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
    const hash = this.__hashBytes(view);
    // const signature = [
    // typedArray.byteLength,
    // hash.toString(16),
    // accessor.componentType.valueOf(),
    // accessor.compositionType.valueOf(),
    // accessor.byteStride,
    // ].join(':');
    const signature = hash.toString(16);
    this.__accessorSignatureCache.set(accessor, signature);
    return signature;
  }

  private static __getBindShapeSignature(bindShapeMatrix?: Matrix44) {
    if (!bindShapeMatrix) {
      return 'no_bind_shape';
    }
    const cached = this.__bindShapeSignatureMap.get(bindShapeMatrix);
    if (cached !== undefined) {
      return cached;
    }
    const signature = Array.from(bindShapeMatrix._v).join(',');
    this.__bindShapeSignatureMap.set(bindShapeMatrix, signature);
    return signature;
  }

  private __getAnimationTrackFeatureHash(): number | undefined {
    if (this.entity.parent == null) {
      return undefined;
    }
    return this.__findAnimationTrackFeatureHash(this.entity.parent.entity);
  }

  private __findAnimationTrackFeatureHash(target: ISceneGraphEntity): number | undefined {
    const hashes: number[] = [];
    const collectHashes = (entity: ISceneGraphEntity) => {
      const animationComponent = entity.tryToGetAnimation();
      if (animationComponent != null) {
        const animationChannels = animationComponent.getAnimationChannelsOfTrack();
        if (animationChannels.size > 0) {
          const componentHashes = new Set<number>();
          const activeTrackName = animationComponent.getActiveAnimationTrack();
          const hasExpressionChannel = Array.from(animationChannels.keys()).some(pathName =>
            pathName.startsWith('vrmExpression/')
          );
          let hasNonExpressionChannelForActiveTrack = false;
          for (const [pathName, channel] of animationChannels) {
            if (
              !pathName.startsWith('vrmExpression/') &&
              channel.animatedValue.getAllTrackNames().includes(activeTrackName)
            ) {
              hasNonExpressionChannelForActiveTrack = true;
              break;
            }
          }
          if (hasNonExpressionChannelForActiveTrack) {
            const hash = animationComponent.currentTrackFeatureHash();
            if (hash != null) {
              componentHashes.add(hash);
            }
          }
          if (componentHashes.size === 0 && !hasExpressionChannel) {
            for (const [pathName, channel] of animationChannels) {
              if (pathName.startsWith('vrmExpression/')) {
                continue;
              }
              const evaluatedTrackName = channel.animatedValue.getFirstActiveAnimationSamplerTrackName();
              const hash = animationComponent.getAnimationTrackFeatureHash(evaluatedTrackName);
              if (hash != null) {
                componentHashes.add(hash);
              }
            }
          }
          for (const hash of componentHashes) {
            hashes.push(hash);
          }
        }
      }
      for (const child of entity.children) {
        collectHashes(child.entity);
      }
    };
    collectHashes(target);

    if (hashes.length === 0) {
      return undefined;
    }
    if (hashes.length === 1) {
      return hashes[0];
    }

    return DataUtil.toCRC32(hashes.join('|'));
  }

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
  private __updateSkinCacheKey() {
    if (!this.__inverseBindMatricesAccessor) {
      this.__skinCacheKey = undefined;
      return;
    }

    // Ensure inverseBindMatricesSignature is computed
    if (!this.__inverseBindMatricesSignature) {
      this.__inverseBindMatricesSignature = SkeletalComponent.__getAccessorSignature(
        this.__inverseBindMatricesAccessor
      );
    }

    const animationTrackFeatureHash = this.__getAnimationTrackFeatureHash();
    // Components with different bone data layouts must not share skinning results
    const boneDataTypeIndex = (this.__allocatedBoneDataType ?? this.boneDataType).index;

    if (animationTrackFeatureHash != null) {
      // Animation is applied - use animation hash AND inverseBindMatrices signature
      // Different VRM models may have the same animation but different bone structures
      // (different inverseBindMatrices), so we must include the signature to prevent
      // incorrect cache sharing that would cause rendering corruption.
      this.__skinCacheKey = `anim|${animationTrackFeatureHash.toString()}|${this.__inverseBindMatricesSignature}|${boneDataTypeIndex}`;
    } else {
      // No animation - use detailed EntityUID-based cache key
      // This prevents incorrect cache sharing between unrelated static models
      if (!this.__jointListKey) {
        this.__skinCacheKey = undefined;
        return;
      }
      this.__skinCacheKey = `${this.__jointListKey}|${this.__inverseBindMatricesSignature}|no_animation|${boneDataTypeIndex}`;
    }
  }

  private __createSkinningCache(processFrameToken: number): SkinningCache {
    const info = this._boneDataInfo._v;
    return {
      processFrameToken,
      boneData: this._boneData.isDummy() ? undefined : this._boneData._v,
      boneDataInfo: [info[0], info[1], info[2], info[3]],
      jointMatrix: this.__jointMatrix._v,
      isWorldMatrixVanilla: this.__isWorldMatrixVanilla,
    };
  }

  private __applySkinningCache(cache: SkinningCache) {
    this.__isWorldMatrixVanilla = cache.isWorldMatrixVanilla;
    this.__jointMatrix._v.set(cache.jointMatrix);
    if (cache.boneData == null) {
      return;
    }
    // The cache key contains the bone data type, so the layout is the same as this component's.
    const dataCount = this.__joints.length * BoneDataType.getVec4CountPerJoint(this.__allocatedBoneDataType!) * 4;
    this._boneData._v.set(cache.boneData.subarray(0, Math.min(dataCount, this._boneData._v.length)));
    if (!this._boneDataInfo.isDummy()) {
      this._boneDataInfo._v.set(cache.boneDataInfo);
    }
  }
}

// Register GPU members. The size of 'boneData' is decided per component in setJoints().
SkeletalComponent._registerBoneDataMember();
SkeletalComponent._registerBoneDataInfoMember();
