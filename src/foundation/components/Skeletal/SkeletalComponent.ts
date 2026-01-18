import type { ComponentSID, ComponentTID, EntityUID, Index, TypedArray } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { applyMixins, type EntityRepository } from '../../core/EntityRepository';
import { BoneDataType } from '../../definitions/BoneDataType';
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
import { MutableVector3 } from '../../math/MutableVector3';
import { MutableVector4 } from '../../math/MutableVector4';
import { VectorN } from '../../math/VectorN';
import type { Accessor } from '../../memory/Accessor';
import { Is } from '../../misc';
import type { Engine } from '../../system/Engine';
import { AnimationStateRepository } from '../Animation/AnimationStateRepository';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import type { SceneGraphComponent } from '../SceneGraph/SceneGraphComponent';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

type SkinningCache = {
  globalTime: number; // Use globalTime instead of updateCount for cache validity
  jointMatrices?: number[];
  boneMatrix?: TypedArray;
  boneTranslatePackedQuat?: TypedArray;
  boneScalePackedQuat?: TypedArray;
  boneQuaternion?: TypedArray;
  boneTranslateScale?: TypedArray;
  boneCompressedChunk?: TypedArray;
  jointMatrix: Float32Array;
  isWorldMatrixVanilla: boolean;
  qtsInfo?: [number, number, number, number];
};

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
  private __qtsInfo = MutableVector4.dummy();
  private _boneMatrix = VectorN.dummy();
  private _boneTranslatePackedQuat = VectorN.dummy();
  private _boneScalePackedQuat = VectorN.dummy();
  private _boneQuaternion = VectorN.dummy();
  private _boneTranslateScale = VectorN.dummy();
  private _boneCompressedChunk = VectorN.dummy();
  private __jointMatrix = MutableMatrix44.identity();
  private __isWorldMatrixVanilla = true;
  _isCulled = false;
  private static __skinCalculationCache: Map<string, SkinningCache> = new Map();
  private static __accessorSignatureCache: WeakMap<Accessor, string> = new WeakMap();

  private __jointListKey?: string;
  private __skinCacheKey?: string;
  private __inverseBindMatricesSignature?: string;
  private static __tmpVec3_0 = MutableVector3.zero();
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
    if (!this._boneMatrix.isDummy()) {
      this._boneMatrix._v.fill(0);
    }
    if (!this._boneTranslatePackedQuat.isDummy()) {
      this._boneTranslatePackedQuat._v.fill(0);
    }
    if (!this._boneScalePackedQuat.isDummy()) {
      this._boneScalePackedQuat._v.fill(0);
    }
    if (!this._boneQuaternion.isDummy()) {
      this._boneQuaternion._v.fill(0);
    }
    if (!this._boneTranslateScale.isDummy()) {
      this._boneTranslateScale._v.fill(0);
    }
    if (!this._boneCompressedChunk.isDummy()) {
      this._boneCompressedChunk._v.fill(0);
    }

    // Reset to dummy objects for re-binding
    this._boneMatrix = VectorN.dummy();
    this._boneTranslatePackedQuat = VectorN.dummy();
    this._boneScalePackedQuat = VectorN.dummy();
    this._boneQuaternion = VectorN.dummy();
    this._boneTranslateScale = VectorN.dummy();
    this._boneCompressedChunk = VectorN.dummy();
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
    this.__updateSkinCacheKey();
    this.__resetBoneDataBuffers();

    if (this.__engine.config.boneDataType === BoneDataType.Vec4x1) {
      this.__qtsInfo = this.__engine.globalDataRepository.getValue('boneCompressedInfo', 0);
    }

    const jointCount =
      this.__engine.config.skeletalComponentCountPerBufferView === 1
        ? joints.length
        : this.__engine.config.maxBoneNumberForMemoryBoostMode;
    this.__registerBoneDataMembers(jointCount);

    // Check if this component is being reused to determine allocation strategy
    const isComponentReused = this.__isReUse;
    this.submitToAllocation(this.__engine.config.skeletalComponentCountPerBufferView, isComponentReused);
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
   * Gets the quaternion array for joints (used in Vec4x2Old bone data type).
   *
   * @returns The Float32Array containing joint quaternions
   */
  get jointQuaternionArray() {
    return this._boneQuaternion._v;
  }

  /**
   * Gets the translate-scale array for joints.
   *
   * @returns The Float32Array containing joint translation and scale data
   */
  get jointTranslateScaleArray() {
    return this._boneTranslateScale._v;
  }

  /**
   * Gets the translate-packed quaternion array for joints (used in Vec4x2 bone data type).
   *
   * @returns The Float32Array containing translation and packed quaternion data
   */
  get jointTranslatePackedQuat() {
    return this._boneTranslatePackedQuat._v;
  }

  /**
   * Gets the scale-packed quaternion array for joints (used in Vec4x2 bone data type).
   *
   * @returns The Float32Array containing scale and packed quaternion data
   */
  get jointScalePackedQuat() {
    return this._boneScalePackedQuat._v;
  }

  /**
   * Gets the joint matrices array (used in Mat43x1 bone data type).
   *
   * @returns The Float32Array containing joint matrices
   */
  get jointMatricesArray() {
    return this._boneMatrix._v;
  }

  /**
   * Gets the compressed joint data chunk (used in Vec4x1 bone data type).
   *
   * @returns The Float32Array containing compressed joint data
   */
  get jointCompressedChunk() {
    return this._boneCompressedChunk._v;
  }

  /**
   * Gets the compression information for joint data (used in Vec4x1 bone data type).
   *
   * @returns The compression information vector
   */
  get jointCompressedInfo() {
    return this.__qtsInfo;
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
    const currentGlobalTime = AnimationStateRepository.getGlobalTime(this.__engine);
    AnimationStateRepository.handleFrameTransitionIfNeeded(this.__engine, currentGlobalTime);

    // --- Skinning Cache Lookup ---
    this.__updateSkinCacheKey();
    const cacheKey = this.__skinCacheKey;
    // Use globalTime instead of TransformComponent.updateCount for cache validity.
    // updateCount changes when ANY AnimationComponent updates joints, which invalidates
    // the cache even within the same frame. globalTime only changes once per frame.
    // Note: currentGlobalTime is already declared above for frame transition.

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
      // Check if a valid cache exists for this frame (same globalTime)
      if (cache?.globalTime === currentGlobalTime) {
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

    const inverseGlobalTransform = MutableMatrix44.invertTo(this.entity.matrixInner, SkeletalComponent.__tmp_mat4_2);
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
        SkeletalComponent.__tmp_mat4.multiply(this._bindShapeMatrix); // only for glTF1
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

      if (
        this.__engine.config.boneDataType === BoneDataType.Mat43x1 ||
        this.__engine.config.boneDataType === BoneDataType.Vec4x1
      ) {
        this.__copyToMatArray(m, i);
      }

      if (this.__engine.config.boneDataType !== BoneDataType.Mat43x1) {
        const scaleVec = SkeletalComponent.__tmpVec3_0.setComponents(
          Math.hypot(m._v[0], m._v[1], m._v[2]),
          Math.hypot(m._v[4], m._v[5], m._v[6]),
          Math.hypot(m._v[8], m._v[9], m._v[10])
        );

        m.m00 /= scaleVec.x;
        m.m01 /= scaleVec.x;
        m.m02 /= scaleVec.x;
        m.m10 /= scaleVec.y;
        m.m11 /= scaleVec.y;
        m.m12 /= scaleVec.y;
        m.m20 /= scaleVec.z;
        m.m21 /= scaleVec.z;
        m.m22 /= scaleVec.z;

        const q = SkeletalComponent.__tmp_q.fromMatrix(m);

        if (
          this.__engine.config.boneDataType === BoneDataType.Vec4x2Old ||
          this.__engine.config.boneDataType === BoneDataType.Vec4x1
        ) {
          let maxScale = 1;
          if (Math.abs(scaleVec.x) > Math.abs(scaleVec.y)) {
            if (Math.abs(scaleVec.x) > Math.abs(scaleVec.z)) {
              maxScale = scaleVec.x;
            } else {
              maxScale = scaleVec.z;
            }
          } else {
            if (Math.abs(scaleVec.y) > Math.abs(scaleVec.z)) {
              maxScale = scaleVec.y;
            } else {
              maxScale = scaleVec.z;
            }
          }
          this._boneTranslateScale.setAt(i * 4 + 3, maxScale);
        }

        if (this.__engine.config.boneDataType === BoneDataType.Vec4x2) {
          const vec2QPacked = MathUtil.packNormalizedVec4ToVec2(q.x, q.y, q.z, q.w, 2 ** 12);
          this._boneTranslatePackedQuat.setAt(i * 4 + 0, m.m03);
          this._boneTranslatePackedQuat.setAt(i * 4 + 1, m.m13);
          this._boneTranslatePackedQuat.setAt(i * 4 + 2, m.m23);
          this._boneScalePackedQuat.setAt(i * 4 + 0, scaleVec.x);
          this._boneScalePackedQuat.setAt(i * 4 + 1, scaleVec.y);
          this._boneScalePackedQuat.setAt(i * 4 + 2, scaleVec.z);
          this._boneTranslatePackedQuat.setAt(i * 4 + 3, vec2QPacked[0]);
          this._boneScalePackedQuat.setAt(i * 4 + 3, vec2QPacked[1]);
        } else if (this.__engine.config.boneDataType === BoneDataType.Vec4x2Old) {
          this._boneTranslateScale.setAt(i * 4 + 0, m.m03); // m.getTranslate().x
          this._boneTranslateScale.setAt(i * 4 + 1, m.m13); // m.getTranslate().y
          this._boneTranslateScale.setAt(i * 4 + 2, m.m23); // m.getTranslate().z
          this._boneQuaternion.setAt(i * 4 + 0, q.x);
          this._boneQuaternion.setAt(i * 4 + 1, q.y);
          this._boneQuaternion.setAt(i * 4 + 2, q.z);
          this._boneQuaternion.setAt(i * 4 + 3, q.w);
        }

        if (this.__engine.config.boneDataType === BoneDataType.Vec4x1) {
          // pack quaternion
          this._boneTranslateScale.setAt(i * 4 + 0, m.m03); // m.getTranslate().x
          this._boneTranslateScale.setAt(i * 4 + 1, m.m13); // m.getTranslate().y
          this._boneTranslateScale.setAt(i * 4 + 2, m.m23); // m.getTranslate().z
          const vec2QPacked = MathUtil.packNormalizedVec4ToVec2(q.x, q.y, q.z, q.w, 2 ** 12);
          this._boneCompressedChunk.setAt(i * 4 + 0, vec2QPacked[0]);
          this._boneCompressedChunk.setAt(i * 4 + 1, vec2QPacked[1]);
          // q.normalize();
        }
      }
    }

    if (this.__engine.config.boneDataType === BoneDataType.Vec4x1) {
      // const maxScale = Math.max(...scales);
      let maxAbsX = 1;
      let maxAbsY = 1;
      let maxAbsZ = 1;
      for (let i = 0; i < this.__joints.length; i++) {
        const absX = Math.abs(this._boneTranslateScale.getAt(i * 4 + 0));
        if (absX > maxAbsX) {
          maxAbsX = absX;
        }
        const absY = Math.abs(this._boneTranslateScale.getAt(i * 4 + 1));
        if (absY > maxAbsY) {
          maxAbsY = absY;
        }
        const absZ = Math.abs(this._boneTranslateScale.getAt(i * 4 + 2));
        if (absZ > maxAbsZ) {
          maxAbsZ = absZ;
        }
      }
      this.__qtsInfo.x = maxAbsX;
      this.__qtsInfo.y = maxAbsY;
      this.__qtsInfo.z = maxAbsZ;
      this.__qtsInfo.w = 1;

      for (let i = 0; i < this.__joints.length; i++) {
        // pack normalized XYZ and Uniform Scale
        const x = this._boneTranslateScale.getAt(i * 4 + 0);
        const y = this._boneTranslateScale.getAt(i * 4 + 1);
        const z = this._boneTranslateScale.getAt(i * 4 + 2);
        const scale = this._boneTranslateScale.getAt(i * 4 + 3);
        const normalizedX = x / maxAbsX;
        const normalizedY = y / maxAbsY;
        const normalizedZ = z / maxAbsZ;
        const normalizedW = scale;

        const vec2TPacked = MathUtil.packNormalizedVec4ToVec2(
          normalizedX,
          normalizedY,
          normalizedZ,
          normalizedW,
          2 ** 12
        );
        this._boneCompressedChunk.setAt(i * 4 + 2, vec2TPacked[0]);
        this._boneCompressedChunk.setAt(i * 4 + 3, vec2TPacked[1]);
      }
    }

    if (cacheKey) {
      SkeletalComponent.__skinCalculationCache.set(cacheKey, this.__createSkinningCache(currentGlobalTime));
    }
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

    this._boneMatrix._v[i * 12 + 0] = m._v[0];
    this._boneMatrix._v[i * 12 + 1] = m._v[1];
    this._boneMatrix._v[i * 12 + 2] = m._v[2];
    this._boneMatrix._v[i * 12 + 3] = m._v[4];
    this._boneMatrix._v[i * 12 + 4] = m._v[5];
    this._boneMatrix._v[i * 12 + 5] = m._v[6];
    this._boneMatrix._v[i * 12 + 6] = m._v[8];
    this._boneMatrix._v[i * 12 + 7] = m._v[9];
    this._boneMatrix._v[i * 12 + 8] = m._v[10];
    this._boneMatrix._v[i * 12 + 9] = m._v[12];
    this._boneMatrix._v[i * 12 + 10] = m._v[13];
    this._boneMatrix._v[i * 12 + 11] = m._v[14];
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
    this.__qtsInfo.copyComponents(component.__qtsInfo);
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

    copyVector(this._boneMatrix, component._boneMatrix);
    copyVector(this._boneTranslatePackedQuat, component._boneTranslatePackedQuat);
    copyVector(this._boneScalePackedQuat, component._boneScalePackedQuat);
    copyVector(this._boneQuaternion, component._boneQuaternion);
    copyVector(this._boneTranslateScale, component._boneTranslateScale);
    copyVector(this._boneCompressedChunk, component._boneCompressedChunk);
  }

  private __registerBoneDataMembers(arrayLength: number) {
    const boneDataType = this.__engine.config.boneDataType;

    if (boneDataType === BoneDataType.Mat43x1 || boneDataType === BoneDataType.Vec4x1) {
      SkeletalComponent.registerMember({
        bufferUse: BufferUse.GPUInstanceData,
        memberName: 'boneMatrix',
        dataClassType: VectorN,
        shaderType: ShaderType.VertexShader,
        compositionType: CompositionType.Mat4x3Array,
        componentType: ComponentType.Float,
        arrayLength,
        componentSID: this.componentSID,
        initValues: new VectorN(new Float32Array(0)),
      });
    }

    if (boneDataType === BoneDataType.Vec4x2) {
      SkeletalComponent.registerMember({
        bufferUse: BufferUse.GPUInstanceData,
        memberName: 'boneTranslatePackedQuat',
        dataClassType: VectorN,
        shaderType: ShaderType.VertexShader,
        compositionType: CompositionType.Vec4Array,
        componentType: ComponentType.Float,
        arrayLength,
        componentSID: this.componentSID,
        initValues: new VectorN(new Float32Array(0)),
      });
      SkeletalComponent.registerMember({
        bufferUse: BufferUse.GPUInstanceData,
        memberName: 'boneScalePackedQuat',
        dataClassType: VectorN,
        shaderType: ShaderType.VertexShader,
        compositionType: CompositionType.Vec4Array,
        componentType: ComponentType.Float,
        arrayLength,
        componentSID: this.componentSID,
        initValues: new VectorN(new Float32Array(0)),
      });
    } else if (boneDataType === BoneDataType.Vec4x2Old) {
      SkeletalComponent.registerMember({
        bufferUse: BufferUse.GPUInstanceData,
        memberName: 'boneQuaternion',
        dataClassType: VectorN,
        shaderType: ShaderType.VertexShader,
        compositionType: CompositionType.Vec4Array,
        componentType: ComponentType.Float,
        arrayLength,
        componentSID: this.componentSID,
        initValues: new VectorN(new Float32Array(0)),
      });
      SkeletalComponent.registerMember({
        bufferUse: BufferUse.GPUInstanceData,
        memberName: 'boneTranslateScale',
        dataClassType: VectorN,
        shaderType: ShaderType.VertexShader,
        compositionType: CompositionType.Vec4Array,
        componentType: ComponentType.Float,
        arrayLength,
        componentSID: this.componentSID,
        initValues: new VectorN(new Float32Array(0)),
      });
    }

    if (boneDataType === BoneDataType.Vec4x1) {
      SkeletalComponent.registerMember({
        bufferUse: BufferUse.GPUInstanceData,
        memberName: 'boneTranslateScale',
        dataClassType: VectorN,
        shaderType: ShaderType.VertexShader,
        compositionType: CompositionType.Vec4Array,
        componentType: ComponentType.Float,
        arrayLength,
        componentSID: this.componentSID,
        initValues: new VectorN(new Float32Array(0)),
      });
      SkeletalComponent.registerMember({
        bufferUse: BufferUse.GPUInstanceData,
        memberName: 'boneCompressedChunk',
        dataClassType: VectorN,
        shaderType: ShaderType.VertexShader,
        compositionType: CompositionType.Vec4Array,
        componentType: ComponentType.Float,
        arrayLength,
        componentSID: this.componentSID,
        initValues: new VectorN(new Float32Array(0)),
      });
    }
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

  private __getAnimationTrackFeatureHash(): number | undefined {
    if (this.entity.parent == null) {
      return undefined;
    }
    return this.__findAnimationTrackFeatureHash(this.entity.parent.entity);
  }

  private __findAnimationTrackFeatureHash(target: ISceneGraphEntity): number | undefined {
    const hash = target.tryToGetAnimation()?.currentTrackFeatureHash();
    if (hash != null) {
      return hash;
    }

    for (const child of target.children) {
      const childHash = this.__findAnimationTrackFeatureHash(child.entity);
      if (childHash != null) {
        return childHash;
      }
    }

    return undefined;
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

    if (animationTrackFeatureHash != null) {
      // Animation is applied - use animation hash AND inverseBindMatrices signature
      // Different VRM models may have the same animation but different bone structures
      // (different inverseBindMatrices), so we must include the signature to prevent
      // incorrect cache sharing that would cause rendering corruption.
      this.__skinCacheKey = `anim|${animationTrackFeatureHash.toString()}|${this.__inverseBindMatricesSignature}`;
    } else {
      // No animation - use detailed EntityUID-based cache key
      // This prevents incorrect cache sharing between unrelated static models
      if (!this.__jointListKey) {
        this.__skinCacheKey = undefined;
        return;
      }
      this.__skinCacheKey = `${this.__jointListKey}|${this.__inverseBindMatricesSignature}|no_animation`;
    }
  }

  private __createSkinningCache(globalTime: number): SkinningCache {
    const hasQtsInfo = this.__qtsInfo != null && this.__qtsInfo._v.length >= 4;
    return {
      globalTime,
      jointMatrices: this.__jointMatrices,
      boneMatrix: this._boneMatrix.isDummy() ? undefined : this._boneMatrix._v,
      boneTranslatePackedQuat: this._boneTranslatePackedQuat.isDummy() ? undefined : this._boneTranslatePackedQuat._v,
      boneScalePackedQuat: this._boneScalePackedQuat.isDummy() ? undefined : this._boneScalePackedQuat._v,
      boneQuaternion: this._boneQuaternion.isDummy() ? undefined : this._boneQuaternion._v,
      boneTranslateScale: this._boneTranslateScale.isDummy() ? undefined : this._boneTranslateScale._v,
      boneCompressedChunk: this._boneCompressedChunk.isDummy() ? undefined : this._boneCompressedChunk._v,
      jointMatrix: this.__jointMatrix._v,
      isWorldMatrixVanilla: this.__isWorldMatrixVanilla,
      qtsInfo: hasQtsInfo
        ? [this.__qtsInfo._v[0], this.__qtsInfo._v[1], this.__qtsInfo._v[2], this.__qtsInfo._v[3]]
        : undefined,
    };
  }

  private __applySkinningCache(cache: SkinningCache) {
    this.__isWorldMatrixVanilla = cache.isWorldMatrixVanilla;
    this.__jointMatrix._v.set(cache.jointMatrix);
    const jointCount = this.__joints.length;
    if (this.__engine.config.boneDataType === BoneDataType.Mat43x1) {
      const dataCount = jointCount * 12;
      this._boneMatrix._v.set(cache.boneMatrix!.subarray(0, dataCount));
      return;
    }
    if (this.__engine.config.boneDataType === BoneDataType.Vec4x2) {
      const dataCount = jointCount * 4;
      this._boneTranslatePackedQuat._v.set(cache.boneTranslatePackedQuat!.subarray(0, dataCount));
      this._boneScalePackedQuat._v.set(cache.boneScalePackedQuat!.subarray(0, dataCount));
      return;
    }
    if (this.__engine.config.boneDataType === BoneDataType.Vec4x2Old) {
      const dataCount = jointCount * 4;
      this._boneQuaternion._v.set(cache.boneQuaternion!.subarray(0, dataCount));
      this._boneTranslateScale._v.set(cache.boneTranslateScale!.subarray(0, dataCount));
      return;
    }
    if (this.__engine.config.boneDataType === BoneDataType.Vec4x1) {
      const dataCount = jointCount * 4;
      this._boneTranslateScale._v.set(cache.boneTranslateScale!.subarray(0, dataCount));
      this._boneCompressedChunk._v.set(cache.boneCompressedChunk!.subarray(0, dataCount));
    }

    if (cache.qtsInfo) {
      this.__qtsInfo.setComponents(cache.qtsInfo[0], cache.qtsInfo[1], cache.qtsInfo[2], cache.qtsInfo[3]);
    }
  }
}

SkeletalComponent.registerMember({
  bufferUse: BufferUse.GPUInstanceData,
  memberName: 'boneMatrix',
  dataClassType: VectorN,
  shaderType: ShaderType.VertexShader,
  compositionType: CompositionType.Mat4x3Array,
  componentType: ComponentType.Float,
  initValues: new VectorN(new Float32Array(0)),
});

SkeletalComponent.registerMember({
  bufferUse: BufferUse.GPUInstanceData,
  memberName: 'boneTranslatePackedQuat',
  dataClassType: VectorN,
  shaderType: ShaderType.VertexShader,
  compositionType: CompositionType.Vec4Array,
  componentType: ComponentType.Float,
  initValues: new VectorN(new Float32Array(0)),
});
SkeletalComponent.registerMember({
  bufferUse: BufferUse.GPUInstanceData,
  memberName: 'boneScalePackedQuat',
  dataClassType: VectorN,
  shaderType: ShaderType.VertexShader,
  compositionType: CompositionType.Vec4Array,
  componentType: ComponentType.Float,
  initValues: new VectorN(new Float32Array(0)),
});
SkeletalComponent.registerMember({
  bufferUse: BufferUse.GPUInstanceData,
  memberName: 'boneQuaternion',
  dataClassType: VectorN,
  shaderType: ShaderType.VertexShader,
  compositionType: CompositionType.Vec4Array,
  componentType: ComponentType.Float,
  initValues: new VectorN(new Float32Array(0)),
});
SkeletalComponent.registerMember({
  bufferUse: BufferUse.GPUInstanceData,
  memberName: 'boneTranslateScale',
  dataClassType: VectorN,
  shaderType: ShaderType.VertexShader,
  compositionType: CompositionType.Vec4Array,
  componentType: ComponentType.Float,
  initValues: new VectorN(new Float32Array(0)),
});

SkeletalComponent.registerMember({
  bufferUse: BufferUse.GPUInstanceData,
  memberName: 'boneTranslateScale',
  dataClassType: VectorN,
  shaderType: ShaderType.VertexShader,
  compositionType: CompositionType.Vec4Array,
  componentType: ComponentType.Float,
  initValues: new VectorN(new Float32Array(0)),
});
SkeletalComponent.registerMember({
  bufferUse: BufferUse.GPUInstanceData,
  memberName: 'boneCompressedChunk',
  dataClassType: VectorN,
  shaderType: ShaderType.VertexShader,
  compositionType: CompositionType.Vec4Array,
  componentType: ComponentType.Float,
  initValues: new VectorN(new Float32Array(0)),
});
