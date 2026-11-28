// src/foundation/components/Skeletal/SkeletalComponent.ts
import { Component } from "../../core/Component.js";
import { applyMixins } from "../../core/EntityRepository.js";
import { BoneDataType } from "../../definitions/BoneDataType.js";
import { BufferUse } from "../../definitions/BufferUse.js";
import { ComponentType } from "../../definitions/ComponentType.js";
import { CompositionType } from "../../definitions/CompositionType.js";
import { ProcessStage } from "../../definitions/ProcessStage.js";
import { ShaderType } from "../../definitions/ShaderType.js";
import { MathUtil } from "../../math/MathUtil.js";
import { Matrix44 } from "../../math/Matrix44.js";
import { MutableMatrix44 } from "../../math/MutableMatrix44.js";
import { MutableQuaternion } from "../../math/MutableQuaternion.js";
import { MutableVector4 } from "../../math/MutableVector4.js";
import { VectorN } from "../../math/VectorN.js";
import { DataUtil, Is } from "../../misc/index.js";
import { AnimationStateRepository } from "../Animation/AnimationStateRepository.js";
import { SceneGraphComponent } from "../SceneGraph/SceneGraphComponent.js";
import { WellKnownComponentTIDs } from "../WellKnownComponentTIDs.js";
var VEC4X1_NEGATIVE_SCALE_BIT = 2147483648;
var _SkeletalComponent = class _SkeletalComponent extends Component {
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
  constructor(engine, entityUid, componentSid, entityRepository, isReUse) {
    super(engine, entityUid, componentSid, entityRepository, isReUse);
    this._jointIndices = [];
    this.Yg = [];
    this.isSkinning = true;
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
    this._boneData = VectorN.dummy();
    /**
     * The location of `_boneData` in the GPU data (written by the memory allocation of Component).
     */
    this._boneDataLocation = MutableVector4.dummy();
    /**
     * Per-component bone data info: xyz = dequantization factors of translation (Vec4x1 only),
     * w = bone data type index (used by shaders to select the decoding path).
     */
    this._boneDataInfo = MutableVector4.dummy();
    /**
     * The bone data of the previous frame, for the motion vectors of temporal anti-aliasing (same layout as
     * `_boneData`). It holds a single vec4 until `_enablePreviousBoneData` is called, so that applications without
     * temporal anti-aliasing do not pay for it.
     */
    this._previousBoneData = VectorN.dummy();
    /**
     * The location of `_previousBoneData` in the GPU data (written by the memory allocation of Component).
     */
    this._previousBoneDataLocation = MutableVector4.dummy();
    /**
     * The bone data info of the previous frame. w is -1 while `_previousBoneData` has not received the bone data
     * of a frame yet (the shaders then use the current bone data).
     */
    this._previousBoneDataInfo = MutableVector4.dummy();
    this.hh = false;
    this.ih = BoneDataType.Vec4x2;
    /** Whether __boneDataType was chosen automatically (an automatic Vec4x1 may be switched to Vec4x2) */
    this.jh = false;
    this.nh = false;
    this.fh = 0;
    this.lh = new Float32Array(0);
    this.$g = MutableMatrix44.identity();
    this.dh = true;
    this._isCulled = false;
    // Versions of animation bindings and scene graph hierarchy used for the current __skinCacheKey (-1: not computed)
    this.ph = -1;
    this.qh = -1;
    /**
     * Memoized input signature of the last skinning computation. When the skin cache key, the joint
     * world matrices, the skinned node world matrix and the bind shape matrix are unchanged, the
     * whole skinning loop can be skipped and the previous bone data reused.
     */
    this.rh = false;
    this.wh = -1;
    this.xh = -1;
    this.moveStageTo(ProcessStage.Logic);
    if (isReUse) {
      this.zh();
      this.$g = MutableMatrix44.identity();
      this.dh = true;
      this.Yg = [];
      this.eh = void 0;
      this.topOfJointsHierarchy = void 0;
      this._bindShapeMatrix = void 0;
      this.isSkinning = true;
      this.ih = BoneDataType.Vec4x2;
      this.jh = false;
      this.hh = false;
      this.nh = false;
      this.Zg = void 0;
      this.fh = 0;
      this.bh = void 0;
      this._g = void 0;
      this.ch = void 0;
      this.ph = -1;
      this.qh = -1;
      return;
    }
    _SkeletalComponent.Ih++;
  }
  /**
   * Resets GPU-bound vector fields so they can be re-bound on reuse.
   * Clears any existing data to prevent contamination from previous models.
   */
  zh() {
    if (!this._boneData.isDummy()) {
      this._boneData._v.fill(0);
    }
    this._boneData = VectorN.dummy();
    this.mh = void 0;
    this.Ah();
  }
  /**
   * Releases the view of the previous bone data so that it is re-allocated with the current length.
   */
  Ah() {
    if (!this._previousBoneData.isDummy()) {
      this._previousBoneData._v.fill(0);
    }
    this._previousBoneData = VectorN.dummy();
    this.Bh();
  }
  /**
   * Marks the previous bone data as not received yet (the shaders use the current bone data instead).
   */
  Bh() {
    if (!this._previousBoneDataInfo.isDummy()) {
      this._previousBoneDataInfo._v[3] = -1;
    }
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
  get componentTID() {
    return WellKnownComponentTIDs.SkeletalComponentTID;
  }
  /**
   * Sets the accessor for inverse bind matrices used in skeletal animation.
   * These matrices transform vertices from model space to bone space.
   *
   * @param inverseBindMatricesAccessor - The accessor containing inverse bind matrices data
   */
  setInverseBindMatricesAccessor(inverseBindMatricesAccessor) {
    this.ah = inverseBindMatricesAccessor;
    this.ch = _SkeletalComponent.Ch(inverseBindMatricesAccessor);
    this.kh();
  }
  /**
   * Sets the joint hierarchy for this skeletal component.
   * Initializes the appropriate data arrays based on the configured bone data type.
   *
   * @param joints - Array of SceneGraphComponents representing the joints/bones
   */
  setJoints(joints) {
    this.gh();
    this.Yg = joints;
    this.bh = _SkeletalComponent.Dh(joints);
    this.zh();
    const boneDataType = this.boneDataType;
    this.fh = _SkeletalComponent.Lh(boneDataType, joints.length);
    const isComponentReused = this.Mh;
    this.submitToAllocation(this.c.config.skeletalComponentCountPerBufferView, isComponentReused);
    this.mh = new Uint32Array(
      this._boneData._v.buffer,
      this._boneData._v.byteOffset,
      this._boneData._v.length
    );
    this.Zg = boneDataType;
    this.sh(1, 1, 1, boneDataType);
    this.kh();
  }
  /**
   * Gets the effective bone data type of this component.
   * If Config.boneDataType is set, it overrides the bone data type of each component.
   *
   * @returns The effective bone data type
   */
  get boneDataType() {
    var _a;
    return (_a = this.c.config.boneDataType) != null ? _a : this.ih;
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
  setBoneDataType(boneDataType, isAutoSelected = false) {
    this.ih = boneDataType;
    this.jh = isAutoSelected;
    this.Eh();
  }
  /**
   * Re-allocates the bone data if the effective bone data type differs from the allocated layout.
   */
  Eh() {
    const boneDataType = this.boneDataType;
    if (this.Zg === void 0 || this.Zg === boneDataType) {
      return;
    }
    this.setJoints(this.Yg);
  }
  /**
   * Calculates the array length (in vec4) of the bone data.
   * The bone data is a variable-length member, so this is exact regardless of skeletalComponentCountPerBufferView.
   *
   * @param boneDataType - The bone data type
   * @param jointCount - The number of joints
   * @returns The array length in vec4
   */
  static Lh(boneDataType, jointCount) {
    return Math.max(jointCount, 1) * BoneDataType.getVec4CountPerJoint(boneDataType);
  }
  /**
   * Returns the per-instance array length of the bone data for memory allocation.
   *
   * @param memberName - The name of the member field
   * @returns The array length, or undefined for other members
   */
  _getArrayLengthForAllocation(memberName) {
    if (memberName === "boneData" && this.fh > 0) {
      return this.fh;
    }
    if (memberName === "previousBoneData") {
      return this.hh && this.fh > 0 ? this.fh : 1;
    }
    return void 0;
  }
  sh(x, y, z, boneDataType) {
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
  updateJointsLightweight(joints) {
    this.gh();
    this.Yg = joints;
    this.bh = _SkeletalComponent.Dh(joints);
    this.kh();
  }
  /**
   * Gets a copy of the joints array.
   *
   * @returns A copy of the SceneGraphComponents representing the joints
   */
  getJoints() {
    return this.Yg.concat();
  }
  /**
   * Gets the world matrix of the root joint in the hierarchy.
   *
   * @returns The world matrix of the top joint, or undefined if no top joint exists
   */
  get rootJointWorldMatrixInner() {
    var _a;
    return (_a = this.topOfJointsHierarchy) == null ? void 0 : _a.matrixInner;
  }
  /**
   * Gets the computed joint matrices array.
   *
   * @returns The joint matrices array
   */
  get jointMatrices() {
    return this.eh;
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
   * Allocates the bone data of the previous frame (used by the motion vectors of temporal anti-aliasing).
   * Until the first `_updatePreviousBoneData`, the shaders use the current bone data.
   *
   * @internal
   */
  _enablePreviousBoneData() {
    if (this.hh) {
      return;
    }
    this.hh = true;
    if (this._boneData.isDummy()) {
      return;
    }
    this.Ah();
    this.submitToAllocation(this.c.config.skeletalComponentCountPerBufferView, this.Mh);
    this.Bh();
  }
  /**
   * Copies the bone data into the previous bone data if they differ.
   *
   * @remarks
   * Called once per frame before the logic stage, when the bone data still holds the previous frame. A skeleton
   * that stopped is copied once more in the frame after it stopped and then not any more.
   *
   * @returns Whether the previous bone data was written (the GPU instance data has to be uploaded)
   * @internal
   */
  _updatePreviousBoneData() {
    if (!this.hh || this._boneData.isDummy() || this._previousBoneData.isDummy()) {
      return false;
    }
    const current = this._boneData._v;
    const previous = this._previousBoneData._v;
    if (previous.length !== current.length) {
      return false;
    }
    const currentInfo = this._boneDataInfo._v;
    const previousInfo = this._previousBoneDataInfo._v;
    let isSame = previousInfo[0] === currentInfo[0] && previousInfo[1] === currentInfo[1] && previousInfo[2] === currentInfo[2] && previousInfo[3] === currentInfo[3];
    if (isSame) {
      const currentBits = new Uint32Array(current.buffer, current.byteOffset, current.length);
      const previousBits = new Uint32Array(previous.buffer, previous.byteOffset, previous.length);
      for (let i = 0; i < currentBits.length; i++) {
        if (currentBits[i] !== previousBits[i]) {
          isSame = false;
          break;
        }
      }
    }
    if (isSame) {
      return false;
    }
    previous.set(current);
    previousInfo.set(currentInfo);
    return true;
  }
  /**
   * The bone data of the previous frame (allocated by `_enablePreviousBoneData`).
   *
   * @internal
   */
  get _previousBoneDataArray() {
    return this._previousBoneData._v;
  }
  /**
   * Gets a copy of the world matrix.
   *
   * @returns A cloned copy of the world matrix
   */
  get worldMatrix() {
    return this.$g.clone();
  }
  /**
   * Gets the internal world matrix (direct reference).
   *
   * @returns The internal world matrix
   */
  get worldMatrixInner() {
    return MutableMatrix44.multiplyTo(this.entity.matrixInner, this.$g, _SkeletalComponent.Fg);
  }
  /**
   * Checks if the world matrix has been updated from its initial state.
   *
   * @returns True if the world matrix has been modified, false otherwise
   */
  get isWorldMatrixUpdated() {
    return !this.dh;
  }
  /**
   * Sets the visibility of the joint gizmo that visualizes skeletal joints.
   * @param flg - True to show the joint gizmo, false to hide it
   */
  set isJointGizmosVisible(flg) {
    for (let i = 0; i < this.Yg.length; i++) {
      this.Yg[i].isJointGizmoVisible = flg;
    }
  }
  /**
   * Gets the visibility state of the joint gizmo.
   * @returns True if the joint gizmo is visible, false otherwise
   */
  get isJointGizmosVisible() {
    for (let i = 0; i < this.Yg.length; i++) {
      if (this.Yg[i].isJointGizmoVisible) {
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
    if (!this.isSkinning) {
      return;
    }
    const currentProcessFrameToken = AnimationStateRepository.getProcessFrameToken(this.c);
    AnimationStateRepository.handleFrameTransitionIfNeeded(this.c, currentProcessFrameToken);
    if (this._boneData.isDummy()) {
      return;
    }
    if (this._isCulled) {
      this.gh();
      this.Fh();
      if (this._g !== void 0) {
        AnimationStateRepository.addCulledSkeletonJoints(this.c, this._g, this.Yg);
      }
      return;
    }
    this.Eh();
    this.Fh();
    const cacheKey = this._g;
    const cacheLeaders = AnimationStateRepository.getOrCreateCacheLeaders(this.c);
    const leaderJointIndexToEntityUID = AnimationStateRepository.getOrCreateLeaderJointIndexToEntityUID(this.c);
    const currentFrameCachedEntityUIDs = AnimationStateRepository.getOrCreateCurrentFrameCachedEntityUIDs(
      this.c
    );
    if (cacheKey) {
      const cache = _SkeletalComponent.oh.get(cacheKey);
      if ((cache == null ? void 0 : cache.processFrameToken) === currentProcessFrameToken) {
        const isLeader = cacheLeaders.get(cacheKey) === this.entityUID;
        if (!isLeader) {
          for (const joint of this.Yg) {
            const leaderEntityUID = leaderJointIndexToEntityUID.get(joint.jointIndex);
            if (leaderEntityUID !== void 0 && leaderEntityUID !== joint.entityUID) {
              currentFrameCachedEntityUIDs.add(joint.entityUID);
            }
          }
        }
        this.Nh(cache);
        this.gh();
        return;
      }
      cacheLeaders.set(cacheKey, this.entityUID);
      for (const joint of this.Yg) {
        leaderJointIndexToEntityUID.set(joint.jointIndex, joint.entityUID);
      }
    }
    if (this.Oh(cacheKey)) {
      if (cacheKey) {
        _SkeletalComponent.oh.set(cacheKey, this.Gh(currentProcessFrameToken));
      }
      return;
    }
    const boneDataType = this.Zg;
    const boneData = this._boneData._v;
    const boneDataUint32 = this.mh;
    const translateScaleWork = this.Ph(boneDataType);
    const inverseGlobalTransform = MutableMatrix44.invertTo(this.entity.matrixInner, _SkeletalComponent.Kh);
    let hasNonUniformScale = false;
    for (let i = 0; i < this.Yg.length; i++) {
      const joint = this.Yg[i];
      const globalJointTransform = joint.matrixInner;
      const jointMatrix = MutableMatrix44.multiplyTo(
        inverseGlobalTransform,
        MutableMatrix44.multiplyTypedArrayTo(
          globalJointTransform,
          this.ah.getTypedArray(),
          _SkeletalComponent.ig,
          i
        ),
        _SkeletalComponent.eg
      );
      if (this._bindShapeMatrix) {
        jointMatrix.multiply(this._bindShapeMatrix);
      }
      const m = jointMatrix;
      if (i === 0 && joint.entity.tryToGetAnimation() != null) {
        this.$g.copyComponents(m);
      }
      if (i === 1 && this.Yg[0].entity.tryToGetAnimation() == null) {
        this.$g.copyComponents(m);
      }
      this.dh = false;
      if (boneDataType === BoneDataType.Mat43x1) {
        this.Qh(m, i);
        continue;
      }
      const v = m._v;
      const sx = Math.hypot(v[0], v[1], v[2]);
      const sy = Math.hypot(v[4], v[5], v[6]);
      const sz = Math.hypot(v[8], v[9], v[10]);
      const isMirrored = _SkeletalComponent.Rh(v) < 0;
      if (boneDataType === BoneDataType.Vec4x2) {
        const signedSx = isMirrored ? -sx : sx;
        const q = _SkeletalComponent.Hh(m, signedSx, sy, sz);
        const logQuat = MathUtil.encodeLogQuat(q.x, q.y, q.z, q.w);
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
        if (!hasNonUniformScale && !MathUtil.isUniformScale(sx, sy, sz)) {
          hasNonUniformScale = true;
        }
        const sign = isMirrored ? -1 : 1;
        const q = _SkeletalComponent.Hh(m, sign * sx, sign * sy, sign * sz);
        const logQuat = MathUtil.encodeLogQuat(q.x, q.y, q.z, q.w);
        translateScaleWork[i * 4 + 0] = v[12];
        translateScaleWork[i * 4 + 1] = v[13];
        translateScaleWork[i * 4 + 2] = v[14];
        translateScaleWork[i * 4 + 3] = Math.max(sx, sy, sz);
        boneDataUint32[i * 4 + 0] = logQuat[0];
        boneDataUint32[i * 4 + 1] = isMirrored ? (logQuat[1] | VEC4X1_NEGATIVE_SCALE_BIT) >>> 0 : logQuat[1];
      }
    }
    if (hasNonUniformScale && this.Sh()) {
      this.$logic();
      return;
    }
    if (boneDataType === BoneDataType.Vec4x1) {
      let maxAbsX = 1;
      let maxAbsY = 1;
      let maxAbsZ = 1;
      for (let i = 0; i < this.Yg.length; i++) {
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
      for (let i = 0; i < this.Yg.length; i++) {
        const normalizedX = translateScaleWork[i * 4 + 0] / maxAbsX;
        const normalizedY = translateScaleWork[i * 4 + 1] / maxAbsY;
        const normalizedZ = translateScaleWork[i * 4 + 2] / maxAbsZ;
        const encodedScale = MathUtil.encodeVec4x1Scale(translateScaleWork[i * 4 + 3]);
        const vec2TPacked = MathUtil.packSnormVec4ToUVec2(normalizedX, normalizedY, normalizedZ, encodedScale);
        boneDataUint32[i * 4 + 2] = vec2TPacked[0];
        boneDataUint32[i * 4 + 3] = vec2TPacked[1];
      }
      this.sh(maxAbsX, maxAbsY, maxAbsZ, boneDataType);
    } else {
      this.sh(1, 1, 1, boneDataType);
    }
    if (cacheKey) {
      _SkeletalComponent.oh.set(cacheKey, this.Gh(currentProcessFrameToken));
    }
    this.Th(cacheKey);
  }
  /**
   * Calculates the determinant of the upper-left 3x3 part of a column-major 4x4 matrix.
   *
   * @param v - The matrix elements (column-major)
   * @returns The determinant
   */
  static Rh(v) {
    return v[0] * (v[5] * v[10] - v[6] * v[9]) + v[1] * (v[6] * v[8] - v[4] * v[10]) + v[2] * (v[4] * v[9] - v[5] * v[8]);
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
  static Hh(m, sx, sy, sz) {
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
    const q = _SkeletalComponent.Jh;
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
  Sh() {
    const sharingComponents = this.Uh();
    if (this.c.config.boneDataType == null && sharingComponents.every((component) => component.jh)) {
      for (const component of sharingComponents) {
        component.setBoneDataType(BoneDataType.Vec4x2, true);
      }
      this.c.logger.info(
        `SkeletalComponent (entity ${this.entityUID}): switched the bone data type from Vec4x1 to Vec4x2 because a non-uniform scale was found (${sharingComponents.length} component(s) sharing the skinning cache).`
      );
      return this.Zg === BoneDataType.Vec4x2;
    }
    if (!this.nh) {
      this.nh = true;
      this.c.logger.warn(
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
  Uh() {
    var _a;
    const key = this._g;
    if (key == null) {
      return [this];
    }
    const components = (_a = this.c.componentRepository.getComponentsWithType(_SkeletalComponent)) != null ? _a : [];
    return components.filter((component) => component === this || component._g === key);
  }
  /**
   * Gets a CPU-side work buffer for translation and scale (used only in Vec4x1 bone data type).
   *
   * @param boneDataType - The bone data type
   * @returns The work buffer (empty unless Vec4x1)
   */
  Ph(boneDataType) {
    if (boneDataType !== BoneDataType.Vec4x1) {
      return this.lh;
    }
    const requiredLength = this.Yg.length * 4;
    if (this.lh.length < requiredLength) {
      this.lh = new Float32Array(requiredLength);
    }
    return this.lh;
  }
  /**
   * Copies matrix data to the matrix array in a specific format.
   * Extracts the first 3 rows of a 4x4 matrix (Mat43 format) for efficient GPU storage.
   *
   * @param m - The source matrix to copy from
   * @param i - The index of the joint/bone
   * @private
   */
  Qh(m, i) {
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
  getInverseBindMatricesAccessor() {
    return this.ah;
  }
  /**
   * Performs a shallow copy from another SkeletalComponent.
   * Copies all relevant skeletal data without deep cloning complex objects.
   *
   * @param component_ - The source component to copy from
   * @protected
   */
  _shallowCopyFrom(component_) {
    const component = component_;
    this._jointIndices = component._jointIndices.concat();
    this.ih = component.ih;
    this.jh = component.jh;
    if (component.Yg.length > 0) {
      this.setJoints(component.Yg.concat());
      this.Vh(component);
    } else {
      this.Yg = [];
      this.gh();
    }
    this.ah = component.ah;
    if (Is.exist(component._bindShapeMatrix)) {
      this._bindShapeMatrix = component._bindShapeMatrix.clone();
    }
    this.topOfJointsHierarchy = component.topOfJointsHierarchy;
    this.isSkinning = component.isSkinning;
    this.$g.copyComponents(component.$g);
    this.dh = component.dh;
    this.ch = component.ch;
    this.bh = component.bh;
    this.kh();
  }
  /**
   * Gets the entity that owns this component.
   *
   * @returns The entity with skeletal capabilities that has this component
   */
  get entity() {
    return this.c.entityRepository.getEntity(this.Qb);
  }
  /**
   * Destroys this component and cleans up resources.
   *
   * @protected
   */
  _destroy() {
    this.gh();
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
  static isEntityCached(entityUID, engine) {
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
  addThisComponentToEntity(base, _componentClass) {
    class SkeletalEntity extends base.constructor {
      getSkeletal() {
        return this.getComponentByComponentTID(WellKnownComponentTIDs.SkeletalComponentTID);
      }
    }
    applyMixins(base, SkeletalEntity);
    return base;
  }
  /**
   * Gets the inverse bind matrix for a specific joint.
   *
   * @param sg - The SceneGraphComponent representing the joint
   * @returns The inverse bind matrix for the specified joint
   * @private
   */
  _getInverseBindMatrices(sg) {
    const index = this.Yg.indexOf(sg);
    const float32Array = this.ah.getTypedArray();
    const m = new Matrix44(float32Array.slice(index * 16, index * 16 + 16));
    return m;
  }
  Vh(component) {
    const copyVector = (target, source) => {
      if (target.isDummy() || source.isDummy()) {
        return;
      }
      target.copyComponents(source);
    };
    if (Is.exist(component.eh)) {
      this.eh = component.eh.concat();
    } else {
      this.eh = void 0;
    }
    if (this.Zg === component.Zg && this._boneData._v.length === component._boneData._v.length) {
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
    _SkeletalComponent.registerMember({
      bufferUse: BufferUse.GPUInstanceData,
      memberName: "boneDataLocation",
      dataClassType: MutableVector4,
      shaderType: ShaderType.VertexShader,
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      initValues: [0, 0, 0, 0]
    });
    _SkeletalComponent.registerMember({
      bufferUse: BufferUse.GPUInstanceData,
      memberName: "boneData",
      dataClassType: VectorN,
      shaderType: ShaderType.VertexShader,
      compositionType: CompositionType.Vec4Array,
      componentType: ComponentType.Float,
      initValues: new VectorN(new Float32Array(0)),
      isVariableLength: true
    });
    _SkeletalComponent.registerMember({
      bufferUse: BufferUse.GPUInstanceData,
      memberName: "previousBoneDataLocation",
      dataClassType: MutableVector4,
      shaderType: ShaderType.VertexShader,
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      initValues: [0, 0, 0, 0]
    });
    _SkeletalComponent.registerMember({
      bufferUse: BufferUse.GPUInstanceData,
      memberName: "previousBoneData",
      dataClassType: VectorN,
      shaderType: ShaderType.VertexShader,
      compositionType: CompositionType.Vec4Array,
      componentType: ComponentType.Float,
      initValues: new VectorN(new Float32Array(0)),
      isVariableLength: true
    });
  }
  /**
   * Registers the bone data info member (one vec4 per component).
   */
  static _registerBoneDataInfoMember() {
    _SkeletalComponent.registerMember({
      bufferUse: BufferUse.GPUInstanceData,
      memberName: "boneDataInfo",
      dataClassType: MutableVector4,
      shaderType: ShaderType.VertexShader,
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      initValues: [1, 1, 1, BoneDataType.Vec4x2.index]
    });
    _SkeletalComponent.registerMember({
      bufferUse: BufferUse.GPUInstanceData,
      memberName: "previousBoneDataInfo",
      dataClassType: MutableVector4,
      shaderType: ShaderType.VertexShader,
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      initValues: [1, 1, 1, -1]
    });
  }
  static Dh(joints) {
    return joints.map((joint) => joint.jointIndex >= 0 ? joint.jointIndex : -1).join(",");
  }
  static Wh(uint8Array) {
    let hash = 2166136261;
    for (let i = 0; i < uint8Array.length; i++) {
      hash ^= uint8Array[i];
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
      hash >>>= 0;
    }
    return hash >>> 0;
  }
  static Ch(accessor) {
    const cached = this.th.get(accessor);
    if (cached !== void 0) {
      return cached;
    }
    const typedArray = accessor.getTypedArray();
    const view = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
    const hash = this.Wh(view);
    const signature = hash.toString(16);
    this.th.set(accessor, signature);
    return signature;
  }
  static Zh(bindShapeMatrix) {
    if (!bindShapeMatrix) {
      return "no_bind_shape";
    }
    const cached = this.uh.get(bindShapeMatrix);
    if (cached !== void 0) {
      return cached;
    }
    const signature = Array.from(bindShapeMatrix._v).join(",");
    this.uh.set(bindShapeMatrix, signature);
    return signature;
  }
  Xh() {
    if (this.entity.parent == null) {
      return void 0;
    }
    return this.Yh(this.entity.parent.entity);
  }
  Yh(target) {
    const hashes = [];
    const collectHashes = (entity) => {
      const animationComponent = entity.tryToGetAnimation();
      if (animationComponent != null) {
        const animationChannels = animationComponent.getAnimationChannelsOfTrack();
        if (animationChannels.size > 0) {
          const componentHashes = /* @__PURE__ */ new Set();
          const activeTrackName = animationComponent.getActiveAnimationTrack();
          const hasExpressionChannel = Array.from(animationChannels.keys()).some(
            (pathName) => pathName.startsWith("vrmExpression/")
          );
          let hasNonExpressionChannelForActiveTrack = false;
          for (const [pathName, channel] of animationChannels) {
            if (!pathName.startsWith("vrmExpression/") && channel.animatedValue.getAllTrackNames().includes(activeTrackName)) {
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
              if (pathName.startsWith("vrmExpression/")) {
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
      return void 0;
    }
    if (hashes.length === 1) {
      return hashes[0];
    }
    return DataUtil.toCRC32(hashes.join("|"));
  }
  /**
   * Updates the skinning cache key only when animation bindings or the scene graph hierarchy
   * may have changed since the key was last computed.
   * Searching animation track feature hashes walks the whole model hierarchy, so doing it
   * every frame for every SkeletalComponent is too expensive when many models are animated.
   * Other inputs of the key (joints, inverse bind matrices, bone data type) update the key
   * immediately in their setters.
   */
  Fh() {
    if (this.ph === AnimationStateRepository.getAnimationBindingVersion() && this.qh === SceneGraphComponent.hierarchyVersion) {
      return;
    }
    this.kh();
  }
  /**
   * Updates the skinning cache key based on current animation state.
   *
   * The cache key determines which SkeletalComponents can share skinning results:
   *
   * ## With Animation Applied
   * - Uses format: `anim|{animationHash}|{inverseBindMatricesSignature}|{jointListKey}`
   * - animationHash is computed from animation track features (keyframes, timings, etc.)
   * - inverseBindMatricesSignature ensures models with different bone structures don't share cache
   * - jointListKey ensures recursively nested chains that share local tracks/bind matrices
   *   but have different joint nodes (different parent transforms) don't share results
   * - Only models with the same animation, bind matrices and joint hierarchy can share
   *   skinning results
   *
   * ## Without Animation
   * - Uses format: `{jointListKey}|{accessorSignature}|no_animation`
   * - EntityUID-based key prevents incorrect sharing between unrelated models
   * - Each model maintains its own cache
   */
  kh() {
    var _a, _b;
    this.ph = AnimationStateRepository.getAnimationBindingVersion();
    this.qh = SceneGraphComponent.hierarchyVersion;
    if (!this.ah) {
      this._g = void 0;
      return;
    }
    if (!this.ch) {
      this.ch = _SkeletalComponent.Ch(
        this.ah
      );
    }
    const animationTrackFeatureHash = this.Xh();
    const boneDataTypeIndex = ((_a = this.Zg) != null ? _a : this.boneDataType).index;
    if (animationTrackFeatureHash != null) {
      this._g = `anim|${animationTrackFeatureHash.toString()}|${this.ch}|${(_b = this.bh) != null ? _b : ""}|${boneDataTypeIndex}`;
    } else {
      if (!this.bh) {
        this._g = void 0;
        return;
      }
      this._g = `${this.bh}|${this.ch}|no_animation|${boneDataTypeIndex}`;
    }
  }
  /**
   * Drops the memoized skinning input signature so the next $logic recomputes skinning.
   */
  gh() {
    this.rh = false;
  }
  /**
   * Returns true when every input that affects the bone data is identical to the last computation.
   *
   * The joint version sum works as a change detector because `worldMatrixVersion` only increases:
   * if any joint (or the skinned node) was marked dirty, the sum necessarily differs.
   *
   * Constraint: like the world matrix cache itself, this signature only observes changes made
   * through the transform/renderer APIs. Writing `matrixInner` directly or mutating
   * `_bindShapeMatrix` in place is not detected; callers must invalidate through the setters.
   *
   * @param cacheKey - The current skinning cache key
   * @returns True when the skinning loop can be skipped
   */
  Oh(cacheKey) {
    if (!this.rh) {
      return false;
    }
    if (this.vh !== cacheKey) {
      return false;
    }
    if (this.yh !== this._bindShapeMatrix) {
      return false;
    }
    const entitySceneGraph = this.entity.getSceneGraph();
    if (entitySceneGraph == null || entitySceneGraph.worldMatrixVersion !== this.xh) {
      return false;
    }
    let jointVersionSum = 0;
    for (let i = 0; i < this.Yg.length; i++) {
      jointVersionSum += this.Yg[i].worldMatrixVersion;
    }
    return jointVersionSum === this.wh;
  }
  /**
   * Records the inputs that produced the current bone data.
   * @param cacheKey - The skinning cache key used for this computation
   */
  Th(cacheKey) {
    var _a, _b;
    let jointVersionSum = 0;
    for (let i = 0; i < this.Yg.length; i++) {
      jointVersionSum += this.Yg[i].worldMatrixVersion;
    }
    this.vh = cacheKey;
    this.wh = jointVersionSum;
    this.xh = (_b = (_a = this.entity.getSceneGraph()) == null ? void 0 : _a.worldMatrixVersion) != null ? _b : -1;
    this.yh = this._bindShapeMatrix;
    this.rh = true;
  }
  Gh(processFrameToken) {
    const info = this._boneDataInfo._v;
    return {
      processFrameToken,
      boneData: this._boneData.isDummy() ? void 0 : this._boneData._v,
      boneDataInfo: [info[0], info[1], info[2], info[3]],
      jointMatrix: this.$g._v,
      isWorldMatrixVanilla: this.dh
    };
  }
  Nh(cache) {
    this.dh = cache.isWorldMatrixVanilla;
    this.$g._v.set(cache.jointMatrix);
    if (cache.boneData == null) {
      return;
    }
    const dataCount = this.Yg.length * BoneDataType.getVec4CountPerJoint(this.Zg) * 4;
    this._boneData._v.set(cache.boneData.subarray(0, Math.min(dataCount, this._boneData._v.length)));
    if (!this._boneDataInfo.isDummy()) {
      this._boneDataInfo._v.set(cache.boneDataInfo);
    }
  }
};
_SkeletalComponent.oh = /* @__PURE__ */ new Map();
_SkeletalComponent.th = /* @__PURE__ */ new WeakMap();
_SkeletalComponent.uh = /* @__PURE__ */ new WeakMap();
_SkeletalComponent.Ih = 0;
_SkeletalComponent.ig = MutableMatrix44.identity();
_SkeletalComponent.Jh = MutableQuaternion.fromCopy4(0, 0, 0, 1);
_SkeletalComponent.Kh = MutableMatrix44.identity();
_SkeletalComponent.eg = MutableMatrix44.identity();
_SkeletalComponent.Fg = MutableMatrix44.identity();
var SkeletalComponent = _SkeletalComponent;
SkeletalComponent._registerBoneDataMember();
SkeletalComponent._registerBoneDataInfoMember();
export {
  SkeletalComponent
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29tcG9uZW50cy9Ta2VsZXRhbC9Ta2VsZXRhbENvbXBvbmVudC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBDb21wb25lbnRTSUQsIENvbXBvbmVudFRJRCwgRW50aXR5VUlELCBJbmRleCwgVHlwZWRBcnJheSB9IGZyb20gJy4uLy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4uLy4uL2NvcmUvQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgSUVudGl0eSB9IGZyb20gJy4uLy4uL2NvcmUvRW50aXR5JztcbmltcG9ydCB7IGFwcGx5TWl4aW5zLCB0eXBlIEVudGl0eVJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9jb3JlL0VudGl0eVJlcG9zaXRvcnknO1xuaW1wb3J0IHsgQm9uZURhdGFUeXBlLCB0eXBlIEJvbmVEYXRhVHlwZUVudW0gfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Cb25lRGF0YVR5cGUnO1xuaW1wb3J0IHsgQnVmZmVyVXNlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvQnVmZmVyVXNlJztcbmltcG9ydCB7IENvbXBvbmVudFR5cGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Db21wb25lbnRUeXBlJztcbmltcG9ydCB7IENvbXBvc2l0aW9uVHlwZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL0NvbXBvc2l0aW9uVHlwZSc7XG5pbXBvcnQgeyBQcm9jZXNzU3RhZ2UgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Qcm9jZXNzU3RhZ2UnO1xuaW1wb3J0IHsgU2hhZGVyVHlwZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1NoYWRlclR5cGUnO1xuaW1wb3J0IHR5cGUgeyBJU2NlbmVHcmFwaEVudGl0eSwgSVNrZWxldGFsRW50aXR5IH0gZnJvbSAnLi4vLi4vaGVscGVycy9FbnRpdHlIZWxwZXInO1xuaW1wb3J0IHR5cGUgeyBJTWF0cml4NDQgfSBmcm9tICcuLi8uLi9tYXRoL0lNYXRyaXgnO1xuaW1wb3J0IHsgTWF0aFV0aWwgfSBmcm9tICcuLi8uLi9tYXRoL01hdGhVdGlsJztcbmltcG9ydCB7IE1hdHJpeDQ0IH0gZnJvbSAnLi4vLi4vbWF0aC9NYXRyaXg0NCc7XG5pbXBvcnQgeyBNdXRhYmxlTWF0cml4NDQgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVNYXRyaXg0NCc7XG5pbXBvcnQgeyBNdXRhYmxlUXVhdGVybmlvbiB9IGZyb20gJy4uLy4uL21hdGgvTXV0YWJsZVF1YXRlcm5pb24nO1xuaW1wb3J0IHsgTXV0YWJsZVZlY3RvcjQgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVWZWN0b3I0JztcbmltcG9ydCB7IFZlY3Rvck4gfSBmcm9tICcuLi8uLi9tYXRoL1ZlY3Rvck4nO1xuaW1wb3J0IHR5cGUgeyBBY2Nlc3NvciB9IGZyb20gJy4uLy4uL21lbW9yeS9BY2Nlc3Nvcic7XG5pbXBvcnQgeyBEYXRhVXRpbCwgSXMgfSBmcm9tICcuLi8uLi9taXNjJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vLi4vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgeyBBbmltYXRpb25TdGF0ZVJlcG9zaXRvcnkgfSBmcm9tICcuLi9BbmltYXRpb24vQW5pbWF0aW9uU3RhdGVSZXBvc2l0b3J5JztcbmltcG9ydCB0eXBlIHsgQ29tcG9uZW50VG9Db21wb25lbnRNZXRob2RzIH0gZnJvbSAnLi4vQ29tcG9uZW50VHlwZXMnO1xuaW1wb3J0IHsgU2NlbmVHcmFwaENvbXBvbmVudCB9IGZyb20gJy4uL1NjZW5lR3JhcGgvU2NlbmVHcmFwaENvbXBvbmVudCc7XG5pbXBvcnQgeyBXZWxsS25vd25Db21wb25lbnRUSURzIH0gZnJvbSAnLi4vV2VsbEtub3duQ29tcG9uZW50VElEcyc7XG5cbnR5cGUgU2tpbm5pbmdDYWNoZSA9IHtcbiAgcHJvY2Vzc0ZyYW1lVG9rZW46IG51bWJlcjtcbiAgYm9uZURhdGE/OiBUeXBlZEFycmF5O1xuICBib25lRGF0YUluZm86IFtudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXJdO1xuICBqb2ludE1hdHJpeDogVHlwZWRBcnJheTtcbiAgaXNXb3JsZE1hdHJpeFZhbmlsbGE6IGJvb2xlYW47XG59O1xuXG4vKipcbiAqIFZlYzR4MTogYml0IDMxIG9mIGxvZ1F1YXQuaGkgKHVudXNlZCBieSB0aGUgNjMtYml0IGxvZy1xdWF0ZXJuaW9uKSB0ZWxscyB0aGF0IHRoZSB1bmlmb3JtIHNjYWxlIGlzIG5lZ2F0aXZlLFxuICogd2hpY2ggcmVwcmVzZW50cyBhIG1pcnJvcmVkIGpvaW50IG1hdHJpeC4gTXVzdCBtYXRjaCBSTl9WRUM0WDFfTkVHQVRJVkVfU0NBTEVfQklUIGluIHRoZSBzaGFkZXJzLlxuICovXG5jb25zdCBWRUM0WDFfTkVHQVRJVkVfU0NBTEVfQklUID0gMHg4MDAwMDAwMDtcblxuLyoqXG4gKiBTa2VsZXRhbENvbXBvbmVudCBtYW5hZ2VzIHNrZWxldGFsIGFuaW1hdGlvbiBmb3IgZW50aXRpZXMuXG4gKiBUaGlzIGNvbXBvbmVudCBoYW5kbGVzIGJvbmUgdHJhbnNmb3JtYXRpb25zLCBqb2ludCBtYXRyaWNlcywgYW5kIHNraW5uaW5nIGNhbGN1bGF0aW9uc1xuICogZm9yIDNEIG1vZGVscyB3aXRoIHNrZWxldGFsIGFuaW1hdGlvbiBzeXN0ZW1zLlxuICovXG5leHBvcnQgY2xhc3MgU2tlbGV0YWxDb21wb25lbnQgZXh0ZW5kcyBDb21wb25lbnQge1xuICBwdWJsaWMgX2pvaW50SW5kaWNlczogSW5kZXhbXSA9IFtdO1xuICBwcml2YXRlIF9fam9pbnRzOiBTY2VuZUdyYXBoQ29tcG9uZW50W10gPSBbXTtcbiAgcHJpdmF0ZSBfX2ludmVyc2VCaW5kTWF0cmljZXNBY2Nlc3Nvcj86IEFjY2Vzc29yO1xuICBwdWJsaWMgX2JpbmRTaGFwZU1hdHJpeD86IE1hdHJpeDQ0O1xuICBwcml2YXRlIF9fam9pbnRNYXRyaWNlcz86IG51bWJlcltdO1xuICBwdWJsaWMgdG9wT2ZKb2ludHNIaWVyYXJjaHk/OiBTY2VuZUdyYXBoQ29tcG9uZW50O1xuICBwdWJsaWMgaXNTa2lubmluZyA9IHRydWU7XG4gIC8qKlxuICAgKiBHUFUgYm9uZSBkYXRhIG9mIGFsbCBqb2ludHMuIFRoZSBsYXlvdXQgcGVyIGpvaW50IGRlcGVuZHMgb24gdGhlIGJvbmUgZGF0YSB0eXBlOlxuICAgKiAtIE1hdDQzeDE6IDMgdmVjNCBwZXIgam9pbnQgKDR4MyBtYXRyaXgsIGNvbHVtbi1tYWpvcilcbiAgICogLSBWZWM0eDI6IDIgdmVjNCBwZXIgam9pbnQgKFt0cmFuc2xhdGlvbi54eXosIGxvZ1F1YXQubG9dLCBbc2NhbGUueHl6LCBsb2dRdWF0LmhpXSkuXG4gICAqICAgVGhlIHggc2NhbGUgaXMgbmVnYXRpdmUgZm9yIGEgbWlycm9yZWQgam9pbnQgbWF0cml4LlxuICAgKiAtIFZlYzR4MTogMSB2ZWM0IHBlciBqb2ludCAoW2xvZ1F1YXQubG8sIGxvZ1F1YXQuaGksIHBhY2tlZFRyYW5zbGF0ZVNjYWxlLmxvLCBwYWNrZWRUcmFuc2xhdGVTY2FsZS5oaV0pLlxuICAgKiAgIHBhY2tlZFRyYW5zbGF0ZVNjYWxlIGlzIHNub3JtMTYgeCA0OiB0aGUgdHJhbnNsYXRpb24gZGl2aWRlZCBieSBgX2JvbmVEYXRhSW5mby54eXpgLCBhbmRcbiAgICogICBsb2cyKHx1bmlmb3JtIHNjYWxlfCkgLyAxNiAoc2VlIE1hdGhVdGlsLmVuY29kZVZlYzR4MVNjYWxlKS4gQml0IDMxIG9mIGxvZ1F1YXQuaGkgaXMgdGhlIHNpZ24gb2YgdGhlIHNjYWxlLlxuICAgKlxuICAgKiBUaGlzIGlzIGEgdmFyaWFibGUtbGVuZ3RoIG1lbWJlcjogZWFjaCBjb21wb25lbnQgZ2V0cyBleGFjdGx5IChqb2ludCBjb3VudCkgeCAodmVjNCBwZXIgam9pbnQpIHZlYzRzLFxuICAgKiBldmVuIHRob3VnaCBza2VsZXRhbCBjb21wb25lbnRzIHNoYXJlIGJ1ZmZlciB2aWV3cywgYW5kIHNoYWRlcnMgZmluZCBpdCB0aHJvdWdoIGBfYm9uZURhdGFMb2NhdGlvbmAuXG4gICAqL1xuICBwcml2YXRlIF9ib25lRGF0YSA9IFZlY3Rvck4uZHVtbXkoKTtcbiAgLyoqXG4gICAqIFRoZSBsb2NhdGlvbiBvZiBgX2JvbmVEYXRhYCBpbiB0aGUgR1BVIGRhdGEgKHdyaXR0ZW4gYnkgdGhlIG1lbW9yeSBhbGxvY2F0aW9uIG9mIENvbXBvbmVudCkuXG4gICAqL1xuICBwcml2YXRlIF9ib25lRGF0YUxvY2F0aW9uID0gTXV0YWJsZVZlY3RvcjQuZHVtbXkoKTtcbiAgLyoqXG4gICAqIFBlci1jb21wb25lbnQgYm9uZSBkYXRhIGluZm86IHh5eiA9IGRlcXVhbnRpemF0aW9uIGZhY3RvcnMgb2YgdHJhbnNsYXRpb24gKFZlYzR4MSBvbmx5KSxcbiAgICogdyA9IGJvbmUgZGF0YSB0eXBlIGluZGV4ICh1c2VkIGJ5IHNoYWRlcnMgdG8gc2VsZWN0IHRoZSBkZWNvZGluZyBwYXRoKS5cbiAgICovXG4gIHByaXZhdGUgX2JvbmVEYXRhSW5mbyA9IE11dGFibGVWZWN0b3I0LmR1bW15KCk7XG4gIC8qKlxuICAgKiBUaGUgYm9uZSBkYXRhIG9mIHRoZSBwcmV2aW91cyBmcmFtZSwgZm9yIHRoZSBtb3Rpb24gdmVjdG9ycyBvZiB0ZW1wb3JhbCBhbnRpLWFsaWFzaW5nIChzYW1lIGxheW91dCBhc1xuICAgKiBgX2JvbmVEYXRhYCkuIEl0IGhvbGRzIGEgc2luZ2xlIHZlYzQgdW50aWwgYF9lbmFibGVQcmV2aW91c0JvbmVEYXRhYCBpcyBjYWxsZWQsIHNvIHRoYXQgYXBwbGljYXRpb25zIHdpdGhvdXRcbiAgICogdGVtcG9yYWwgYW50aS1hbGlhc2luZyBkbyBub3QgcGF5IGZvciBpdC5cbiAgICovXG4gIHByaXZhdGUgX3ByZXZpb3VzQm9uZURhdGEgPSBWZWN0b3JOLmR1bW15KCk7XG4gIC8qKlxuICAgKiBUaGUgbG9jYXRpb24gb2YgYF9wcmV2aW91c0JvbmVEYXRhYCBpbiB0aGUgR1BVIGRhdGEgKHdyaXR0ZW4gYnkgdGhlIG1lbW9yeSBhbGxvY2F0aW9uIG9mIENvbXBvbmVudCkuXG4gICAqL1xuICBwcml2YXRlIF9wcmV2aW91c0JvbmVEYXRhTG9jYXRpb24gPSBNdXRhYmxlVmVjdG9yNC5kdW1teSgpO1xuICAvKipcbiAgICogVGhlIGJvbmUgZGF0YSBpbmZvIG9mIHRoZSBwcmV2aW91cyBmcmFtZS4gdyBpcyAtMSB3aGlsZSBgX3ByZXZpb3VzQm9uZURhdGFgIGhhcyBub3QgcmVjZWl2ZWQgdGhlIGJvbmUgZGF0YVxuICAgKiBvZiBhIGZyYW1lIHlldCAodGhlIHNoYWRlcnMgdGhlbiB1c2UgdGhlIGN1cnJlbnQgYm9uZSBkYXRhKS5cbiAgICovXG4gIHByaXZhdGUgX3ByZXZpb3VzQm9uZURhdGFJbmZvID0gTXV0YWJsZVZlY3RvcjQuZHVtbXkoKTtcbiAgcHJpdmF0ZSBfX2lzUHJldmlvdXNCb25lRGF0YUVuYWJsZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX2JvbmVEYXRhVWludDMyPzogVWludDMyQXJyYXk7XG4gIHByaXZhdGUgX19ib25lRGF0YVR5cGU6IEJvbmVEYXRhVHlwZUVudW0gPSBCb25lRGF0YVR5cGUuVmVjNHgyO1xuICAvKiogV2hldGhlciBfX2JvbmVEYXRhVHlwZSB3YXMgY2hvc2VuIGF1dG9tYXRpY2FsbHkgKGFuIGF1dG9tYXRpYyBWZWM0eDEgbWF5IGJlIHN3aXRjaGVkIHRvIFZlYzR4MikgKi9cbiAgcHJpdmF0ZSBfX2lzQm9uZURhdGFUeXBlQXV0b1NlbGVjdGVkID0gZmFsc2U7XG4gIHByaXZhdGUgX19oYXNXYXJuZWROb25Vbmlmb3JtU2NhbGUgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX2FsbG9jYXRlZEJvbmVEYXRhVHlwZT86IEJvbmVEYXRhVHlwZUVudW07XG4gIHByaXZhdGUgX19ib25lRGF0YUFycmF5TGVuZ3RoID0gMDtcbiAgcHJpdmF0ZSBfX2JvbmVUcmFuc2xhdGVTY2FsZVdvcmsgPSBuZXcgRmxvYXQzMkFycmF5KDApO1xuICBwcml2YXRlIF9fam9pbnRNYXRyaXggPSBNdXRhYmxlTWF0cml4NDQuaWRlbnRpdHkoKTtcbiAgcHJpdmF0ZSBfX2lzV29ybGRNYXRyaXhWYW5pbGxhID0gdHJ1ZTtcbiAgX2lzQ3VsbGVkID0gZmFsc2U7XG4gIHByaXZhdGUgc3RhdGljIF9fc2tpbkNhbGN1bGF0aW9uQ2FjaGU6IE1hcDxzdHJpbmcsIFNraW5uaW5nQ2FjaGU+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIHN0YXRpYyBfX2FjY2Vzc29yU2lnbmF0dXJlQ2FjaGU6IFdlYWtNYXA8QWNjZXNzb3IsIHN0cmluZz4gPSBuZXcgV2Vha01hcCgpO1xuICBwcml2YXRlIHN0YXRpYyBfX2JpbmRTaGFwZVNpZ25hdHVyZU1hcDogV2Vha01hcDxNYXRyaXg0NCwgc3RyaW5nPiA9IG5ldyBXZWFrTWFwKCk7XG5cbiAgcHJpdmF0ZSBfX2pvaW50TGlzdEtleT86IHN0cmluZztcbiAgcHJpdmF0ZSBfX3NraW5DYWNoZUtleT86IHN0cmluZztcbiAgLy8gVmVyc2lvbnMgb2YgYW5pbWF0aW9uIGJpbmRpbmdzIGFuZCBzY2VuZSBncmFwaCBoaWVyYXJjaHkgdXNlZCBmb3IgdGhlIGN1cnJlbnQgX19za2luQ2FjaGVLZXkgKC0xOiBub3QgY29tcHV0ZWQpXG4gIHByaXZhdGUgX19za2luQ2FjaGVLZXlBbmltYXRpb25CaW5kaW5nVmVyc2lvbiA9IC0xO1xuICBwcml2YXRlIF9fc2tpbkNhY2hlS2V5SGllcmFyY2h5VmVyc2lvbiA9IC0xO1xuICBwcml2YXRlIF9faW52ZXJzZUJpbmRNYXRyaWNlc1NpZ25hdHVyZT86IHN0cmluZztcbiAgLyoqXG4gICAqIE1lbW9pemVkIGlucHV0IHNpZ25hdHVyZSBvZiB0aGUgbGFzdCBza2lubmluZyBjb21wdXRhdGlvbi4gV2hlbiB0aGUgc2tpbiBjYWNoZSBrZXksIHRoZSBqb2ludFxuICAgKiB3b3JsZCBtYXRyaWNlcywgdGhlIHNraW5uZWQgbm9kZSB3b3JsZCBtYXRyaXggYW5kIHRoZSBiaW5kIHNoYXBlIG1hdHJpeCBhcmUgdW5jaGFuZ2VkLCB0aGVcbiAgICogd2hvbGUgc2tpbm5pbmcgbG9vcCBjYW4gYmUgc2tpcHBlZCBhbmQgdGhlIHByZXZpb3VzIGJvbmUgZGF0YSByZXVzZWQuXG4gICAqL1xuICBwcml2YXRlIF9faGFzU2tpbkNvbXB1dGVTaWduYXR1cmUgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX2xhc3RTa2luQ29tcHV0ZUNhY2hlS2V5Pzogc3RyaW5nO1xuICBwcml2YXRlIF9fbGFzdFNraW5Db21wdXRlSm9pbnRWZXJzaW9uU3VtID0gLTE7XG4gIHByaXZhdGUgX19sYXN0U2tpbkNvbXB1dGVPd25WZXJzaW9uID0gLTE7XG4gIHByaXZhdGUgX19sYXN0U2tpbkNvbXB1dGVCaW5kU2hhcGVNYXRyaXg/OiBNYXRyaXg0NDtcbiAgcHJpdmF0ZSBzdGF0aWMgX190b29rR2xvYmFsRGF0YU51bSA9IDA7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wX21hdDQgPSBNdXRhYmxlTWF0cml4NDQuaWRlbnRpdHkoKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBfcTogTXV0YWJsZVF1YXRlcm5pb24gPSBNdXRhYmxlUXVhdGVybmlvbi5mcm9tQ29weTQoMCwgMCwgMCwgMSk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wX21hdDRfMiA9IE11dGFibGVNYXRyaXg0NC5pZGVudGl0eSgpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcF9tYXQ0XzMgPSBNdXRhYmxlTWF0cml4NDQuaWRlbnRpdHkoKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBfbWF0NF80ID0gTXV0YWJsZU1hdHJpeDQ0LmlkZW50aXR5KCk7XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgU2tlbGV0YWxDb21wb25lbnQgaW5zdGFuY2UuXG4gICAqIEluaXRpYWxpemVzIHRoZSBjb21wb25lbnQgd2l0aCBza2VsZXRhbCBhbmltYXRpb24gY2FwYWJpbGl0aWVzIGFuZCByZXNlcnZlcyBnbG9iYWwgZGF0YSByZXNvdXJjZXMuXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBlbnRpdHlVaWQgLSBUaGUgdW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIGVudGl0eSB0aGlzIGNvbXBvbmVudCBiZWxvbmdzIHRvXG4gICAqIEBwYXJhbSBjb21wb25lbnRTaWQgLSBUaGUgY29tcG9uZW50J3Mgc3lzdGVtIGlkZW50aWZpZXJcbiAgICogQHBhcmFtIGVudGl0eVJlcG9zaXRvcnkgLSBUaGUgcmVwb3NpdG9yeSBtYW5hZ2luZyBlbnRpdGllc1xuICAgKiBAcGFyYW0gaXNSZVVzZSAtIFdoZXRoZXIgdGhpcyBjb21wb25lbnQgaXMgYmVpbmcgcmV1c2VkIGZyb20gYSBwb29sXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBlbnRpdHlVaWQ6IEVudGl0eVVJRCxcbiAgICBjb21wb25lbnRTaWQ6IENvbXBvbmVudFNJRCxcbiAgICBlbnRpdHlSZXBvc2l0b3J5OiBFbnRpdHlSZXBvc2l0b3J5LFxuICAgIGlzUmVVc2U6IGJvb2xlYW5cbiAgKSB7XG4gICAgc3VwZXIoZW5naW5lLCBlbnRpdHlVaWQsIGNvbXBvbmVudFNpZCwgZW50aXR5UmVwb3NpdG9yeSwgaXNSZVVzZSk7XG4gICAgdGhpcy5tb3ZlU3RhZ2VUbyhQcm9jZXNzU3RhZ2UuTG9naWMpO1xuXG4gICAgaWYgKGlzUmVVc2UpIHtcbiAgICAgIC8vIFJlc2V0IGJvbmUgZGF0YSBidWZmZXJzIHdoZW4gcmV1c2luZyBjb21wb25lbnQgdG8gcHJldmVudCBkaXNwbGF5IGNvcnJ1cHRpb25cbiAgICAgIHRoaXMuX19yZXNldEJvbmVEYXRhQnVmZmVycygpO1xuICAgICAgLy8gUmVzZXQgd29ybGQgbWF0cml4IHRvIGluaXRpYWwgc3RhdGVcbiAgICAgIHRoaXMuX19qb2ludE1hdHJpeCA9IE11dGFibGVNYXRyaXg0NC5pZGVudGl0eSgpO1xuICAgICAgdGhpcy5fX2lzV29ybGRNYXRyaXhWYW5pbGxhID0gdHJ1ZTtcbiAgICAgIC8vIENsZWFyIGpvaW50LXJlbGF0ZWQgc3RhdGVcbiAgICAgIHRoaXMuX19qb2ludHMgPSBbXTtcbiAgICAgIHRoaXMuX19qb2ludE1hdHJpY2VzID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy50b3BPZkpvaW50c0hpZXJhcmNoeSA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuX2JpbmRTaGFwZU1hdHJpeCA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuaXNTa2lubmluZyA9IHRydWU7XG4gICAgICB0aGlzLl9fYm9uZURhdGFUeXBlID0gQm9uZURhdGFUeXBlLlZlYzR4MjtcbiAgICAgIHRoaXMuX19pc0JvbmVEYXRhVHlwZUF1dG9TZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5fX2lzUHJldmlvdXNCb25lRGF0YUVuYWJsZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMuX19oYXNXYXJuZWROb25Vbmlmb3JtU2NhbGUgPSBmYWxzZTtcbiAgICAgIHRoaXMuX19hbGxvY2F0ZWRCb25lRGF0YVR5cGUgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9fYm9uZURhdGFBcnJheUxlbmd0aCA9IDA7XG4gICAgICB0aGlzLl9fam9pbnRMaXN0S2V5ID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fX3NraW5DYWNoZUtleSA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuX19pbnZlcnNlQmluZE1hdHJpY2VzU2lnbmF0dXJlID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fX3NraW5DYWNoZUtleUFuaW1hdGlvbkJpbmRpbmdWZXJzaW9uID0gLTE7XG4gICAgICB0aGlzLl9fc2tpbkNhY2hlS2V5SGllcmFyY2h5VmVyc2lvbiA9IC0xO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIFNrZWxldGFsQ29tcG9uZW50Ll9fdG9va0dsb2JhbERhdGFOdW0rKztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldHMgR1BVLWJvdW5kIHZlY3RvciBmaWVsZHMgc28gdGhleSBjYW4gYmUgcmUtYm91bmQgb24gcmV1c2UuXG4gICAqIENsZWFycyBhbnkgZXhpc3RpbmcgZGF0YSB0byBwcmV2ZW50IGNvbnRhbWluYXRpb24gZnJvbSBwcmV2aW91cyBtb2RlbHMuXG4gICAqL1xuICBwcml2YXRlIF9fcmVzZXRCb25lRGF0YUJ1ZmZlcnMoKSB7XG4gICAgLy8gQ2xlYXIgZXhpc3RpbmcgZGF0YSBpZiBwcmVzZW50IGJlZm9yZSByZXNldHRpbmcgdG8gZHVtbXlcbiAgICBpZiAoIXRoaXMuX2JvbmVEYXRhLmlzRHVtbXkoKSkge1xuICAgICAgdGhpcy5fYm9uZURhdGEuX3YuZmlsbCgwKTtcbiAgICB9XG5cbiAgICAvLyBSZXNldCB0byBkdW1teSBvYmplY3QgZm9yIHJlLWJpbmRpbmdcbiAgICB0aGlzLl9ib25lRGF0YSA9IFZlY3Rvck4uZHVtbXkoKTtcbiAgICB0aGlzLl9fYm9uZURhdGFVaW50MzIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fX3Jlc2V0UHJldmlvdXNCb25lRGF0YSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbGVhc2VzIHRoZSB2aWV3IG9mIHRoZSBwcmV2aW91cyBib25lIGRhdGEgc28gdGhhdCBpdCBpcyByZS1hbGxvY2F0ZWQgd2l0aCB0aGUgY3VycmVudCBsZW5ndGguXG4gICAqL1xuICBwcml2YXRlIF9fcmVzZXRQcmV2aW91c0JvbmVEYXRhKCkge1xuICAgIGlmICghdGhpcy5fcHJldmlvdXNCb25lRGF0YS5pc0R1bW15KCkpIHtcbiAgICAgIHRoaXMuX3ByZXZpb3VzQm9uZURhdGEuX3YuZmlsbCgwKTtcbiAgICB9XG4gICAgdGhpcy5fcHJldmlvdXNCb25lRGF0YSA9IFZlY3Rvck4uZHVtbXkoKTtcbiAgICB0aGlzLl9faW52YWxpZGF0ZVByZXZpb3VzQm9uZURhdGEoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYXJrcyB0aGUgcHJldmlvdXMgYm9uZSBkYXRhIGFzIG5vdCByZWNlaXZlZCB5ZXQgKHRoZSBzaGFkZXJzIHVzZSB0aGUgY3VycmVudCBib25lIGRhdGEgaW5zdGVhZCkuXG4gICAqL1xuICBwcml2YXRlIF9faW52YWxpZGF0ZVByZXZpb3VzQm9uZURhdGEoKSB7XG4gICAgaWYgKCF0aGlzLl9wcmV2aW91c0JvbmVEYXRhSW5mby5pc0R1bW15KCkpIHtcbiAgICAgIHRoaXMuX3ByZXZpb3VzQm9uZURhdGFJbmZvLl92WzNdID0gLTE7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHN0YXRpYyBjb21wb25lbnQgdHlwZSBpZGVudGlmaWVyIGZvciBTa2VsZXRhbENvbXBvbmVudC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGNvbXBvbmVudCB0eXBlIGlkZW50aWZpZXJcbiAgICovXG4gIHN0YXRpYyBnZXQgY29tcG9uZW50VElEKCkge1xuICAgIHJldHVybiBXZWxsS25vd25Db21wb25lbnRUSURzLlNrZWxldGFsQ29tcG9uZW50VElEO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNvbXBvbmVudCB0eXBlIGlkZW50aWZpZXIgZm9yIHRoaXMgaW5zdGFuY2UuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBjb21wb25lbnQgdHlwZSBpZGVudGlmaWVyXG4gICAqL1xuICBnZXQgY29tcG9uZW50VElEKCk6IENvbXBvbmVudFRJRCB7XG4gICAgcmV0dXJuIFdlbGxLbm93bkNvbXBvbmVudFRJRHMuU2tlbGV0YWxDb21wb25lbnRUSUQ7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgYWNjZXNzb3IgZm9yIGludmVyc2UgYmluZCBtYXRyaWNlcyB1c2VkIGluIHNrZWxldGFsIGFuaW1hdGlvbi5cbiAgICogVGhlc2UgbWF0cmljZXMgdHJhbnNmb3JtIHZlcnRpY2VzIGZyb20gbW9kZWwgc3BhY2UgdG8gYm9uZSBzcGFjZS5cbiAgICpcbiAgICogQHBhcmFtIGludmVyc2VCaW5kTWF0cmljZXNBY2Nlc3NvciAtIFRoZSBhY2Nlc3NvciBjb250YWluaW5nIGludmVyc2UgYmluZCBtYXRyaWNlcyBkYXRhXG4gICAqL1xuICBzZXRJbnZlcnNlQmluZE1hdHJpY2VzQWNjZXNzb3IoaW52ZXJzZUJpbmRNYXRyaWNlc0FjY2Vzc29yOiBBY2Nlc3Nvcikge1xuICAgIHRoaXMuX19pbnZlcnNlQmluZE1hdHJpY2VzQWNjZXNzb3IgPSBpbnZlcnNlQmluZE1hdHJpY2VzQWNjZXNzb3I7XG4gICAgdGhpcy5fX2ludmVyc2VCaW5kTWF0cmljZXNTaWduYXR1cmUgPSBTa2VsZXRhbENvbXBvbmVudC5fX2dldEFjY2Vzc29yU2lnbmF0dXJlKGludmVyc2VCaW5kTWF0cmljZXNBY2Nlc3Nvcik7XG4gICAgdGhpcy5fX3VwZGF0ZVNraW5DYWNoZUtleSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGpvaW50IGhpZXJhcmNoeSBmb3IgdGhpcyBza2VsZXRhbCBjb21wb25lbnQuXG4gICAqIEluaXRpYWxpemVzIHRoZSBhcHByb3ByaWF0ZSBkYXRhIGFycmF5cyBiYXNlZCBvbiB0aGUgY29uZmlndXJlZCBib25lIGRhdGEgdHlwZS5cbiAgICpcbiAgICogQHBhcmFtIGpvaW50cyAtIEFycmF5IG9mIFNjZW5lR3JhcGhDb21wb25lbnRzIHJlcHJlc2VudGluZyB0aGUgam9pbnRzL2JvbmVzXG4gICAqL1xuICBzZXRKb2ludHMoam9pbnRzOiBTY2VuZUdyYXBoQ29tcG9uZW50W10pIHtcbiAgICB0aGlzLl9faW52YWxpZGF0ZVNraW5Db21wdXRlU2lnbmF0dXJlKCk7XG4gICAgdGhpcy5fX2pvaW50cyA9IGpvaW50cztcbiAgICB0aGlzLl9fam9pbnRMaXN0S2V5ID0gU2tlbGV0YWxDb21wb25lbnQuX19idWlsZEpvaW50TGlzdEtleShqb2ludHMpO1xuICAgIHRoaXMuX19yZXNldEJvbmVEYXRhQnVmZmVycygpO1xuXG4gICAgY29uc3QgYm9uZURhdGFUeXBlID0gdGhpcy5ib25lRGF0YVR5cGU7XG4gICAgdGhpcy5fX2JvbmVEYXRhQXJyYXlMZW5ndGggPSBTa2VsZXRhbENvbXBvbmVudC5fX2NhbGNCb25lRGF0YUFycmF5TGVuZ3RoKGJvbmVEYXRhVHlwZSwgam9pbnRzLmxlbmd0aCk7XG5cbiAgICAvLyBDaGVjayBpZiB0aGlzIGNvbXBvbmVudCBpcyBiZWluZyByZXVzZWQgdG8gZGV0ZXJtaW5lIGFsbG9jYXRpb24gc3RyYXRlZ3lcbiAgICBjb25zdCBpc0NvbXBvbmVudFJldXNlZCA9IHRoaXMuX19pc1JlVXNlO1xuICAgIHRoaXMuc3VibWl0VG9BbGxvY2F0aW9uKHRoaXMuX19lbmdpbmUuY29uZmlnLnNrZWxldGFsQ29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3LCBpc0NvbXBvbmVudFJldXNlZCk7XG5cbiAgICB0aGlzLl9fYm9uZURhdGFVaW50MzIgPSBuZXcgVWludDMyQXJyYXkoXG4gICAgICB0aGlzLl9ib25lRGF0YS5fdi5idWZmZXIsXG4gICAgICB0aGlzLl9ib25lRGF0YS5fdi5ieXRlT2Zmc2V0LFxuICAgICAgdGhpcy5fYm9uZURhdGEuX3YubGVuZ3RoXG4gICAgKTtcbiAgICB0aGlzLl9fYWxsb2NhdGVkQm9uZURhdGFUeXBlID0gYm9uZURhdGFUeXBlO1xuICAgIHRoaXMuX19zZXRCb25lRGF0YUluZm8oMSwgMSwgMSwgYm9uZURhdGFUeXBlKTtcbiAgICB0aGlzLl9fdXBkYXRlU2tpbkNhY2hlS2V5KCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZWZmZWN0aXZlIGJvbmUgZGF0YSB0eXBlIG9mIHRoaXMgY29tcG9uZW50LlxuICAgKiBJZiBDb25maWcuYm9uZURhdGFUeXBlIGlzIHNldCwgaXQgb3ZlcnJpZGVzIHRoZSBib25lIGRhdGEgdHlwZSBvZiBlYWNoIGNvbXBvbmVudC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGVmZmVjdGl2ZSBib25lIGRhdGEgdHlwZVxuICAgKi9cbiAgZ2V0IGJvbmVEYXRhVHlwZSgpOiBCb25lRGF0YVR5cGVFbnVtIHtcbiAgICByZXR1cm4gdGhpcy5fX2VuZ2luZS5jb25maWcuYm9uZURhdGFUeXBlID8/IHRoaXMuX19ib25lRGF0YVR5cGU7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgYm9uZSBkYXRhIHR5cGUgb2YgdGhpcyBjb21wb25lbnQuXG4gICAqIE1hdDQzeDEgaXMgdGhlIG1vc3QgcHJlY2lzZSAoYW5kIHRoZSBsYXJnZXN0KSwgVmVjNHgyIHN1cHBvcnRzIG5vbi11bmlmb3JtIHNjYWxlLFxuICAgKiBhbmQgVmVjNHgxIGlzIHRoZSBtb3N0IGNvbXBhY3QgYnV0IHN1cHBvcnRzIG9ubHkgdW5pZm9ybSBzY2FsZS5cbiAgICogSWYgam9pbnRzIGFyZSBhbHJlYWR5IHNldCBhbmQgdGhlIEdQVSBkYXRhIGxheW91dCBjaGFuZ2VzLCB0aGUgYm9uZSBkYXRhIGlzIHJlLWFsbG9jYXRlZC5cbiAgICogTm90ZSB0aGF0IENvbmZpZy5ib25lRGF0YVR5cGUsIGlmIHNldCwgdGFrZXMgcHJlY2VkZW5jZSBvdmVyIHRoaXMgdmFsdWUuXG4gICAqXG4gICAqIElmIGEgbm9uLXVuaWZvcm0gc2NhbGUgaXMgZm91bmQgYXQgcnVudGltZSB3aXRoIFZlYzR4MSwgYW4gYXV0b21hdGljYWxseSBzZWxlY3RlZCBWZWM0eDEgaXMgc3dpdGNoZWQgdG8gVmVjNHgyLFxuICAgKiB3aGlsZSBhbiBleHBsaWNpdGx5IHNwZWNpZmllZCBWZWM0eDEgaXMga2VwdCAodGhlIGxhcmdlc3Qgc2NhbGUgaXMgdXNlZCwgYW5kIGEgd2FybmluZyBpcyBsb2dnZWQgb25jZSkuXG4gICAqXG4gICAqIEBwYXJhbSBib25lRGF0YVR5cGUgLSBUaGUgYm9uZSBkYXRhIHR5cGUgdG8gdXNlXG4gICAqIEBwYXJhbSBpc0F1dG9TZWxlY3RlZCAtIFRydWUgaWYgdGhlIHR5cGUgd2FzIGNob3NlbiBhdXRvbWF0aWNhbGx5IChlLmcuIGJ5IHRoZSBnbFRGIGltcG9ydGVyKSByYXRoZXIgdGhhblxuICAgKiAgIHNwZWNpZmllZCBieSB0aGUgdXNlclxuICAgKi9cbiAgc2V0Qm9uZURhdGFUeXBlKGJvbmVEYXRhVHlwZTogQm9uZURhdGFUeXBlRW51bSwgaXNBdXRvU2VsZWN0ZWQgPSBmYWxzZSkge1xuICAgIHRoaXMuX19ib25lRGF0YVR5cGUgPSBib25lRGF0YVR5cGU7XG4gICAgdGhpcy5fX2lzQm9uZURhdGFUeXBlQXV0b1NlbGVjdGVkID0gaXNBdXRvU2VsZWN0ZWQ7XG4gICAgdGhpcy5fX2Vuc3VyZUJvbmVEYXRhTGF5b3V0KCk7XG4gIH1cblxuICAvKipcbiAgICogUmUtYWxsb2NhdGVzIHRoZSBib25lIGRhdGEgaWYgdGhlIGVmZmVjdGl2ZSBib25lIGRhdGEgdHlwZSBkaWZmZXJzIGZyb20gdGhlIGFsbG9jYXRlZCBsYXlvdXQuXG4gICAqL1xuICBwcml2YXRlIF9fZW5zdXJlQm9uZURhdGFMYXlvdXQoKSB7XG4gICAgY29uc3QgYm9uZURhdGFUeXBlID0gdGhpcy5ib25lRGF0YVR5cGU7XG4gICAgaWYgKHRoaXMuX19hbGxvY2F0ZWRCb25lRGF0YVR5cGUgPT09IHVuZGVmaW5lZCB8fCB0aGlzLl9fYWxsb2NhdGVkQm9uZURhdGFUeXBlID09PSBib25lRGF0YVR5cGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zZXRKb2ludHModGhpcy5fX2pvaW50cyk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyB0aGUgYXJyYXkgbGVuZ3RoIChpbiB2ZWM0KSBvZiB0aGUgYm9uZSBkYXRhLlxuICAgKiBUaGUgYm9uZSBkYXRhIGlzIGEgdmFyaWFibGUtbGVuZ3RoIG1lbWJlciwgc28gdGhpcyBpcyBleGFjdCByZWdhcmRsZXNzIG9mIHNrZWxldGFsQ29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3LlxuICAgKlxuICAgKiBAcGFyYW0gYm9uZURhdGFUeXBlIC0gVGhlIGJvbmUgZGF0YSB0eXBlXG4gICAqIEBwYXJhbSBqb2ludENvdW50IC0gVGhlIG51bWJlciBvZiBqb2ludHNcbiAgICogQHJldHVybnMgVGhlIGFycmF5IGxlbmd0aCBpbiB2ZWM0XG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2NhbGNCb25lRGF0YUFycmF5TGVuZ3RoKGJvbmVEYXRhVHlwZTogQm9uZURhdGFUeXBlRW51bSwgam9pbnRDb3VudDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIE1hdGgubWF4KGpvaW50Q291bnQsIDEpICogQm9uZURhdGFUeXBlLmdldFZlYzRDb3VudFBlckpvaW50KGJvbmVEYXRhVHlwZSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcGVyLWluc3RhbmNlIGFycmF5IGxlbmd0aCBvZiB0aGUgYm9uZSBkYXRhIGZvciBtZW1vcnkgYWxsb2NhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIG1lbWJlck5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgbWVtYmVyIGZpZWxkXG4gICAqIEByZXR1cm5zIFRoZSBhcnJheSBsZW5ndGgsIG9yIHVuZGVmaW5lZCBmb3Igb3RoZXIgbWVtYmVyc1xuICAgKi9cbiAgcHJvdGVjdGVkIF9nZXRBcnJheUxlbmd0aEZvckFsbG9jYXRpb24obWVtYmVyTmFtZTogc3RyaW5nKTogbnVtYmVyIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAobWVtYmVyTmFtZSA9PT0gJ2JvbmVEYXRhJyAmJiB0aGlzLl9fYm9uZURhdGFBcnJheUxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiB0aGlzLl9fYm9uZURhdGFBcnJheUxlbmd0aDtcbiAgICB9XG4gICAgaWYgKG1lbWJlck5hbWUgPT09ICdwcmV2aW91c0JvbmVEYXRhJykge1xuICAgICAgcmV0dXJuIHRoaXMuX19pc1ByZXZpb3VzQm9uZURhdGFFbmFibGVkICYmIHRoaXMuX19ib25lRGF0YUFycmF5TGVuZ3RoID4gMCA/IHRoaXMuX19ib25lRGF0YUFycmF5TGVuZ3RoIDogMTtcbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHByaXZhdGUgX19zZXRCb25lRGF0YUluZm8oeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciwgYm9uZURhdGFUeXBlOiBCb25lRGF0YVR5cGVFbnVtKSB7XG4gICAgaWYgKHRoaXMuX2JvbmVEYXRhSW5mby5pc0R1bW15KCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgdiA9IHRoaXMuX2JvbmVEYXRhSW5mby5fdjtcbiAgICB2WzBdID0geDtcbiAgICB2WzFdID0geTtcbiAgICB2WzJdID0gejtcbiAgICB2WzNdID0gYm9uZURhdGFUeXBlLmluZGV4O1xuICB9XG5cbiAgLyoqXG4gICAqIExpZ2h0d2VpZ2h0IGpvaW50IHVwZGF0ZSBmb3IgcmVtYXBwaW5nIGR1cmluZyBzaGFsbG93IGNvcHkuXG4gICAqIE9ubHkgdXBkYXRlcyBqb2ludCByZWZlcmVuY2VzIHdpdGhvdXQgcmVpbml0aWFsaXppbmcgYnVmZmVycy5cbiAgICogVXNlZCB3aGVuIGpvaW50cyBhcmUgcmVtYXBwZWQgdG8gbmV3IGVudGl0aWVzIGR1cmluZyBzaGFsbG93IGNvcHkuXG4gICAqL1xuICB1cGRhdGVKb2ludHNMaWdodHdlaWdodChqb2ludHM6IFNjZW5lR3JhcGhDb21wb25lbnRbXSkge1xuICAgIHRoaXMuX19pbnZhbGlkYXRlU2tpbkNvbXB1dGVTaWduYXR1cmUoKTtcbiAgICB0aGlzLl9fam9pbnRzID0gam9pbnRzO1xuICAgIHRoaXMuX19qb2ludExpc3RLZXkgPSBTa2VsZXRhbENvbXBvbmVudC5fX2J1aWxkSm9pbnRMaXN0S2V5KGpvaW50cyk7XG4gICAgdGhpcy5fX3VwZGF0ZVNraW5DYWNoZUtleSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSBjb3B5IG9mIHRoZSBqb2ludHMgYXJyYXkuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgY29weSBvZiB0aGUgU2NlbmVHcmFwaENvbXBvbmVudHMgcmVwcmVzZW50aW5nIHRoZSBqb2ludHNcbiAgICovXG4gIGdldEpvaW50cygpOiBTY2VuZUdyYXBoQ29tcG9uZW50W10ge1xuICAgIHJldHVybiB0aGlzLl9fam9pbnRzLmNvbmNhdCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHdvcmxkIG1hdHJpeCBvZiB0aGUgcm9vdCBqb2ludCBpbiB0aGUgaGllcmFyY2h5LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgd29ybGQgbWF0cml4IG9mIHRoZSB0b3Agam9pbnQsIG9yIHVuZGVmaW5lZCBpZiBubyB0b3Agam9pbnQgZXhpc3RzXG4gICAqL1xuICBnZXQgcm9vdEpvaW50V29ybGRNYXRyaXhJbm5lcigpIHtcbiAgICByZXR1cm4gdGhpcy50b3BPZkpvaW50c0hpZXJhcmNoeT8ubWF0cml4SW5uZXI7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY29tcHV0ZWQgam9pbnQgbWF0cmljZXMgYXJyYXkuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBqb2ludCBtYXRyaWNlcyBhcnJheVxuICAgKi9cbiAgZ2V0IGpvaW50TWF0cmljZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19qb2ludE1hdHJpY2VzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIEdQVSBib25lIGRhdGEgYXJyYXkgb2YgYWxsIGpvaW50cy5cbiAgICogVGhlIGxheW91dCBkZXBlbmRzIG9uIHRoZSBib25lIGRhdGEgdHlwZSAoc2VlIHRoZSBgYm9uZURhdGFUeXBlYCBnZXR0ZXIpLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgRmxvYXQzMkFycmF5IGNvbnRhaW5pbmcgdGhlIGJvbmUgZGF0YVxuICAgKi9cbiAgZ2V0IGJvbmVEYXRhQXJyYXkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2JvbmVEYXRhLl92O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGJvbmUgZGF0YSBpbmZvICh4eXo6IHRyYW5zbGF0aW9uIGRlcXVhbnRpemF0aW9uIGZhY3RvcnMgZm9yIFZlYzR4MSwgdzogYm9uZSBkYXRhIHR5cGUgaW5kZXgpLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYm9uZSBkYXRhIGluZm8gdmVjdG9yXG4gICAqL1xuICBnZXQgYm9uZURhdGFJbmZvKCkge1xuICAgIHJldHVybiB0aGlzLl9ib25lRGF0YUluZm87XG4gIH1cblxuICAvKipcbiAgICogQWxsb2NhdGVzIHRoZSBib25lIGRhdGEgb2YgdGhlIHByZXZpb3VzIGZyYW1lICh1c2VkIGJ5IHRoZSBtb3Rpb24gdmVjdG9ycyBvZiB0ZW1wb3JhbCBhbnRpLWFsaWFzaW5nKS5cbiAgICogVW50aWwgdGhlIGZpcnN0IGBfdXBkYXRlUHJldmlvdXNCb25lRGF0YWAsIHRoZSBzaGFkZXJzIHVzZSB0aGUgY3VycmVudCBib25lIGRhdGEuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2VuYWJsZVByZXZpb3VzQm9uZURhdGEoKSB7XG4gICAgaWYgKHRoaXMuX19pc1ByZXZpb3VzQm9uZURhdGFFbmFibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX19pc1ByZXZpb3VzQm9uZURhdGFFbmFibGVkID0gdHJ1ZTtcbiAgICBpZiAodGhpcy5fYm9uZURhdGEuaXNEdW1teSgpKSB7XG4gICAgICAvLyBBbGxvY2F0ZWQgd2l0aCB0aGUgYm9uZSBkYXRhIGluIHNldEpvaW50cy5cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fX3Jlc2V0UHJldmlvdXNCb25lRGF0YSgpO1xuICAgIHRoaXMuc3VibWl0VG9BbGxvY2F0aW9uKHRoaXMuX19lbmdpbmUuY29uZmlnLnNrZWxldGFsQ29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3LCB0aGlzLl9faXNSZVVzZSk7XG4gICAgdGhpcy5fX2ludmFsaWRhdGVQcmV2aW91c0JvbmVEYXRhKCk7XG4gIH1cblxuICAvKipcbiAgICogQ29waWVzIHRoZSBib25lIGRhdGEgaW50byB0aGUgcHJldmlvdXMgYm9uZSBkYXRhIGlmIHRoZXkgZGlmZmVyLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBDYWxsZWQgb25jZSBwZXIgZnJhbWUgYmVmb3JlIHRoZSBsb2dpYyBzdGFnZSwgd2hlbiB0aGUgYm9uZSBkYXRhIHN0aWxsIGhvbGRzIHRoZSBwcmV2aW91cyBmcmFtZS4gQSBza2VsZXRvblxuICAgKiB0aGF0IHN0b3BwZWQgaXMgY29waWVkIG9uY2UgbW9yZSBpbiB0aGUgZnJhbWUgYWZ0ZXIgaXQgc3RvcHBlZCBhbmQgdGhlbiBub3QgYW55IG1vcmUuXG4gICAqXG4gICAqIEByZXR1cm5zIFdoZXRoZXIgdGhlIHByZXZpb3VzIGJvbmUgZGF0YSB3YXMgd3JpdHRlbiAodGhlIEdQVSBpbnN0YW5jZSBkYXRhIGhhcyB0byBiZSB1cGxvYWRlZClcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfdXBkYXRlUHJldmlvdXNCb25lRGF0YSgpOiBib29sZWFuIHtcbiAgICBpZiAoIXRoaXMuX19pc1ByZXZpb3VzQm9uZURhdGFFbmFibGVkIHx8IHRoaXMuX2JvbmVEYXRhLmlzRHVtbXkoKSB8fCB0aGlzLl9wcmV2aW91c0JvbmVEYXRhLmlzRHVtbXkoKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBjdXJyZW50ID0gdGhpcy5fYm9uZURhdGEuX3Y7XG4gICAgY29uc3QgcHJldmlvdXMgPSB0aGlzLl9wcmV2aW91c0JvbmVEYXRhLl92O1xuICAgIGlmIChwcmV2aW91cy5sZW5ndGggIT09IGN1cnJlbnQubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IGN1cnJlbnRJbmZvID0gdGhpcy5fYm9uZURhdGFJbmZvLl92O1xuICAgIGNvbnN0IHByZXZpb3VzSW5mbyA9IHRoaXMuX3ByZXZpb3VzQm9uZURhdGFJbmZvLl92O1xuICAgIGxldCBpc1NhbWUgPVxuICAgICAgcHJldmlvdXNJbmZvWzBdID09PSBjdXJyZW50SW5mb1swXSAmJlxuICAgICAgcHJldmlvdXNJbmZvWzFdID09PSBjdXJyZW50SW5mb1sxXSAmJlxuICAgICAgcHJldmlvdXNJbmZvWzJdID09PSBjdXJyZW50SW5mb1syXSAmJlxuICAgICAgcHJldmlvdXNJbmZvWzNdID09PSBjdXJyZW50SW5mb1szXTtcbiAgICBpZiAoaXNTYW1lKSB7XG4gICAgICAvLyBDb21wYXJlIHRoZSByYXcgYml0czogdGhlIGJvbmUgZGF0YSBhbHNvIHN0b3JlcyBwYWNrZWQgaW50ZWdlcnMgaW4gaXRzIGZsb2F0cy5cbiAgICAgIGNvbnN0IGN1cnJlbnRCaXRzID0gbmV3IFVpbnQzMkFycmF5KGN1cnJlbnQuYnVmZmVyLCBjdXJyZW50LmJ5dGVPZmZzZXQsIGN1cnJlbnQubGVuZ3RoKTtcbiAgICAgIGNvbnN0IHByZXZpb3VzQml0cyA9IG5ldyBVaW50MzJBcnJheShwcmV2aW91cy5idWZmZXIsIHByZXZpb3VzLmJ5dGVPZmZzZXQsIHByZXZpb3VzLmxlbmd0aCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGN1cnJlbnRCaXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChjdXJyZW50Qml0c1tpXSAhPT0gcHJldmlvdXNCaXRzW2ldKSB7XG4gICAgICAgICAgaXNTYW1lID0gZmFsc2U7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGlzU2FtZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBwcmV2aW91cy5zZXQoY3VycmVudCk7XG4gICAgcHJldmlvdXNJbmZvLnNldChjdXJyZW50SW5mbyk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogVGhlIGJvbmUgZGF0YSBvZiB0aGUgcHJldmlvdXMgZnJhbWUgKGFsbG9jYXRlZCBieSBgX2VuYWJsZVByZXZpb3VzQm9uZURhdGFgKS5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBnZXQgX3ByZXZpb3VzQm9uZURhdGFBcnJheSgpOiBGbG9hdDMyQXJyYXkge1xuICAgIHJldHVybiB0aGlzLl9wcmV2aW91c0JvbmVEYXRhLl92IGFzIEZsb2F0MzJBcnJheTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgY29weSBvZiB0aGUgd29ybGQgbWF0cml4LlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGNsb25lZCBjb3B5IG9mIHRoZSB3b3JsZCBtYXRyaXhcbiAgICovXG4gIGdldCB3b3JsZE1hdHJpeCgpIHtcbiAgICByZXR1cm4gdGhpcy5fX2pvaW50TWF0cml4LmNsb25lKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW50ZXJuYWwgd29ybGQgbWF0cml4IChkaXJlY3QgcmVmZXJlbmNlKS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGludGVybmFsIHdvcmxkIG1hdHJpeFxuICAgKi9cbiAgZ2V0IHdvcmxkTWF0cml4SW5uZXIoKSB7XG4gICAgcmV0dXJuIE11dGFibGVNYXRyaXg0NC5tdWx0aXBseVRvKHRoaXMuZW50aXR5Lm1hdHJpeElubmVyLCB0aGlzLl9fam9pbnRNYXRyaXgsIFNrZWxldGFsQ29tcG9uZW50Ll9fdG1wX21hdDRfNCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSB3b3JsZCBtYXRyaXggaGFzIGJlZW4gdXBkYXRlZCBmcm9tIGl0cyBpbml0aWFsIHN0YXRlLlxuICAgKlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSB3b3JsZCBtYXRyaXggaGFzIGJlZW4gbW9kaWZpZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgZ2V0IGlzV29ybGRNYXRyaXhVcGRhdGVkKCkge1xuICAgIHJldHVybiAhdGhpcy5fX2lzV29ybGRNYXRyaXhWYW5pbGxhO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHZpc2liaWxpdHkgb2YgdGhlIGpvaW50IGdpem1vIHRoYXQgdmlzdWFsaXplcyBza2VsZXRhbCBqb2ludHMuXG4gICAqIEBwYXJhbSBmbGcgLSBUcnVlIHRvIHNob3cgdGhlIGpvaW50IGdpem1vLCBmYWxzZSB0byBoaWRlIGl0XG4gICAqL1xuICBzZXQgaXNKb2ludEdpem1vc1Zpc2libGUoZmxnOiBib29sZWFuKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9fam9pbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLl9fam9pbnRzW2ldLmlzSm9pbnRHaXptb1Zpc2libGUgPSBmbGc7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHZpc2liaWxpdHkgc3RhdGUgb2YgdGhlIGpvaW50IGdpem1vLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBqb2ludCBnaXptbyBpcyB2aXNpYmxlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGdldCBpc0pvaW50R2l6bW9zVmlzaWJsZSgpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX19qb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLl9fam9pbnRzW2ldLmlzSm9pbnRHaXptb1Zpc2libGUpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtcyB0aGUgbG9naWMgdXBkYXRlIGZvciBza2VsZXRhbCBhbmltYXRpb24uXG4gICAqIENhbGN1bGF0ZXMgam9pbnQgdHJhbnNmb3JtYXRpb25zIGFuZCB1cGRhdGVzIGJvbmUgZGF0YSBhcnJheXMgYmFzZWQgb24gdGhlIGNvbmZpZ3VyZWQgYm9uZSBkYXRhIHR5cGUuXG4gICAqIFRoaXMgbWV0aG9kIGlzIGNhbGxlZCBkdXJpbmcgdGhlIExvZ2ljIHByb2Nlc3Npbmcgc3RhZ2UuXG4gICAqXG4gICAqICMjIFNraW5uaW5nIENhY2hlIGFuZCBBbmltYXRpb25Db21wb25lbnQgRWFybHkgUmV0dXJuIE9wdGltaXphdGlvblxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBpbXBsZW1lbnRzIGEgdHdvLWxldmVsIG9wdGltaXphdGlvbiBmb3IgVlJNIG1vZGVscyB3aXRoIHNoYXJlZCBza2VsZXRvbjpcbiAgICpcbiAgICogIyMjIExldmVsIDE6IFNraW5uaW5nIENhY2hlIChleGlzdGluZyBmZWF0dXJlKVxuICAgKiBTa2VsZXRhbENvbXBvbmVudHMgd2l0aCB0aGUgc2FtZSBqb2ludCBzdHJ1Y3R1cmUgYW5kIGFuaW1hdGlvbiBzdGF0ZSBzaGFyZSBza2lubmluZyByZXN1bHRzLlxuICAgKiBUaGUgZmlyc3QgU2tlbGV0YWxDb21wb25lbnQgKFwibGVhZGVyXCIpIGNvbXB1dGVzIHNraW5uaW5nLCBvdGhlcnMgcmV1c2UgdGhlIGNhY2hlZCByZXN1bHQuXG4gICAqXG4gICAqICMjIyBMZXZlbCAyOiBBbmltYXRpb25Db21wb25lbnQgRWFybHkgUmV0dXJuIChuZXcgZmVhdHVyZSlcbiAgICogV2hlbiBza2lubmluZyBjYWNoZSBoaXRzLCB3ZSB0cmFjayB0aGUgam9pbnQgRW50aXR5VUlEcy4gSW4gdGhlIG5leHQgZnJhbWUsXG4gICAqIEFuaW1hdGlvbkNvbXBvbmVudCBjYW4gZWFybHkgcmV0dXJuIGZvciB0aGVzZSBqb2ludHMsIHNraXBwaW5nIGFuaW1hdGlvbiBjYWxjdWxhdGlvbnMuXG4gICAqXG4gICAqIEtleSBjb25jZXB0czpcbiAgICogLSAqKkxlYWRlcioqOiBUaGUgU2tlbGV0YWxDb21wb25lbnQgdGhhdCBjb21wdXRlcyBza2lubmluZyAoY2FjaGUgbWlzcylcbiAgICogLSAqKkZvbGxvd2VyKio6IFNrZWxldGFsQ29tcG9uZW50cyB0aGF0IHJldXNlIHNraW5uaW5nIGNhY2hlIChjYWNoZSBoaXQpXG4gICAqIC0gKipMZWFkZXIgSm9pbnRzKio6IEpvaW50cyBiZWxvbmdpbmcgdG8gbGVhZGVycyAtIHRoZXNlIE1VU1QgY29udGludWUgYW5pbWF0aW5nXG4gICAqIC0gKipDYWNoZWQgRW50aXR5IFVJRHMqKjogRm9sbG93ZXIgam9pbnRzIHRoYXQgY2FuIHNraXAgYW5pbWF0aW9uIGluIHRoZSBuZXh0IGZyYW1lXG4gICAqXG4gICAqIFRoZSBsZWFkZXIncyBqb2ludHMgYXJlIHByb3RlY3RlZCAoX19sZWFkZXJKb2ludEVudGl0eVVJRHMpIHRvIGVuc3VyZSBhbmltYXRpb24gY29udGludWVzLlxuICAgKiBPbmx5IGZvbGxvd2VyIGpvaW50cyBhcmUgcmVnaXN0ZXJlZCBmb3IgZWFybHkgcmV0dXJuIChfX2N1cnJlbnRGcmFtZUNhY2hlZEVudGl0eVVJRHMpLlxuICAgKi9cbiAgJGxvZ2ljKCkge1xuICAgIC8vIFNraXAgaWYgc2tpbm5pbmcgaXMgZGlzYWJsZWRcbiAgICBpZiAoIXRoaXMuaXNTa2lubmluZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIC0tLSBGcmFtZSBUcmFuc2l0aW9uOiBTd2FwIGNhY2hlZCBlbnRpdHkgVUlEcyAtLS1cbiAgICAvLyBXaGVuIGEgbmV3IGZyYW1lIHN0YXJ0cywgbW92ZSBjdXJyZW50IGZyYW1lJ3MgY2FjaGVkIFVJRHMgdG8gcHJldmlvdXMgZnJhbWUuXG4gICAgLy8gQW5pbWF0aW9uQ29tcG9uZW50IHVzZXMgcHJldmlvdXMgZnJhbWUncyBkYXRhIGJlY2F1c2UgaXQgcnVucyBiZWZvcmUgU2tlbGV0YWxDb21wb25lbnQuXG4gICAgY29uc3QgY3VycmVudFByb2Nlc3NGcmFtZVRva2VuID0gQW5pbWF0aW9uU3RhdGVSZXBvc2l0b3J5LmdldFByb2Nlc3NGcmFtZVRva2VuKHRoaXMuX19lbmdpbmUpO1xuICAgIEFuaW1hdGlvblN0YXRlUmVwb3NpdG9yeS5oYW5kbGVGcmFtZVRyYW5zaXRpb25JZk5lZWRlZCh0aGlzLl9fZW5naW5lLCBjdXJyZW50UHJvY2Vzc0ZyYW1lVG9rZW4pO1xuXG4gICAgLy8gSm9pbnRzIGhhdmUgbm90IGJlZW4gc2V0IHlldCAobm8gYm9uZSBkYXRhIGlzIGFsbG9jYXRlZClcbiAgICBpZiAodGhpcy5fYm9uZURhdGEuaXNEdW1teSgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2lzQ3VsbGVkKSB7XG4gICAgICAvLyBGb3JjZSBhIHJlY29tcHV0YXRpb24gd2hlbiB0aGlzIGNvbXBvbmVudCBiZWNvbWVzIHZpc2libGUgYWdhaW4uXG4gICAgICB0aGlzLl9faW52YWxpZGF0ZVNraW5Db21wdXRlU2lnbmF0dXJlKCk7XG4gICAgICAvLyBBIGN1bGxlZCBza2luIGlzIG5laXRoZXIgY29tcHV0ZWQgbm9yIGRyYXduLiBMZXQgaXRzIGpvaW50cyBza2lwIGFuaW1hdGlvbiB3aGlsZSBhIHZpc2libGVcbiAgICAgIC8vIFNrZWxldGFsQ29tcG9uZW50IHdpdGggdGhlIHNhbWUgY2FjaGUga2V5ICh0aGUgbGVhZGVyKSBjb21wdXRlcyB0aGUgc2hhcmVkIHNraW5uaW5nIHJlc3VsdC5cbiAgICAgIC8vIE90aGVyd2lzZSwgY3VsbGVkIG1vZGVscyB3b3VsZCBrZWVwIGFuaW1hdGluZyBhbGwgdGhlaXIgam9pbnRzIGV2ZXJ5IGZyYW1lLlxuICAgICAgdGhpcy5fX3VwZGF0ZVNraW5DYWNoZUtleUlmTmVlZGVkKCk7XG4gICAgICBpZiAodGhpcy5fX3NraW5DYWNoZUtleSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIEFuaW1hdGlvblN0YXRlUmVwb3NpdG9yeS5hZGRDdWxsZWRTa2VsZXRvbkpvaW50cyh0aGlzLl9fZW5naW5lLCB0aGlzLl9fc2tpbkNhY2hlS2V5LCB0aGlzLl9fam9pbnRzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gRm9sbG93IGNoYW5nZXMgb2YgQ29uZmlnLmJvbmVEYXRhVHlwZSBhdCBydW50aW1lXG4gICAgdGhpcy5fX2Vuc3VyZUJvbmVEYXRhTGF5b3V0KCk7XG5cbiAgICAvLyAtLS0gU2tpbm5pbmcgQ2FjaGUgTG9va3VwIC0tLVxuICAgIHRoaXMuX191cGRhdGVTa2luQ2FjaGVLZXlJZk5lZWRlZCgpO1xuICAgIGNvbnN0IGNhY2hlS2V5ID0gdGhpcy5fX3NraW5DYWNoZUtleTtcbiAgICAvLyBVc2UgdGhlIEVuZ2luZS5wcm9jZXNzKCkgdG9rZW4gaW5zdGVhZCBvZiBUcmFuc2Zvcm1Db21wb25lbnQudXBkYXRlQ291bnQgZm9yIGNhY2hlXG4gICAgLy8gdmFsaWRpdHkuIHVwZGF0ZUNvdW50IGNoYW5nZXMgd2hlbiBBbmltYXRpb25Db21wb25lbnRzIHVwZGF0ZSBqb2ludHMsIGluY2x1ZGluZyB3aGlsZVxuICAgIC8vIHRoaXMgZnJhbWUgaXMgc3RpbGwgYmVpbmcgcHJvY2Vzc2VkLiBUaGUgcHJvY2VzcyB0b2tlbiBzdGF5cyBzdGFibGUgZm9yIHRoZSB3aG9sZSBmcmFtZS5cblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBTa2lubmluZyBDYWNoZSBIaXQvTWlzcyBMb2dpYyB3aXRoIExlYWRlci9Gb2xsb3dlciBQYXR0ZXJuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIFRoaXMgaW1wbGVtZW50cyBhbiBvcHRpbWl6YXRpb24gZm9yIG11bHRpcGxlIFZSTSBtb2RlbHMgd2l0aCBpZGVudGljYWwgc2tlbGV0b25cbiAgICAvLyBzdHJ1Y3R1cmVzIChlLmcuLCBzYW1lIG1vZGVsIGxvYWRlZCBtdWx0aXBsZSB0aW1lcyBvciBzaGFsbG93Q29waWVkKS5cbiAgICAvL1xuICAgIC8vIEtleSBjb25jZXB0czpcbiAgICAvLyAtIFwiTGVhZGVyXCI6IFRoZSBmaXJzdCBTa2VsZXRhbENvbXBvbmVudCB0byBjb21wdXRlIHNraW5uaW5nIGZvciBhIGdpdmVuIGNhY2hlIGtleS5cbiAgICAvLyAgIEl0cyBqb2ludHMgTVVTVCBjb250aW51ZSBhbmltYXRpbmcgdG8gcHJvdmlkZSBhbmltYXRpb24gZGF0YSBmb3IgYWxsIG1vZGVscy5cbiAgICAvLyAtIFwiRm9sbG93ZXJcIjogU3Vic2VxdWVudCBTa2VsZXRhbENvbXBvbmVudHMgdGhhdCByZXVzZSB0aGUgbGVhZGVyJ3Mgc2tpbm5pbmcgcmVzdWx0LlxuICAgIC8vICAgVGhlaXIgam9pbnRzIGNhbiBza2lwIGFuaW1hdGlvbiBjYWxjdWxhdGlvbiAoZWFybHkgcmV0dXJuIGluIEFuaW1hdGlvbkNvbXBvbmVudCkuXG4gICAgLy9cbiAgICAvLyBUaGUgam9pbnRJbmRleC1iYXNlZCBjb21wYXJpc29uIGFsbG93czpcbiAgICAvLyAtIHNoYWxsb3dDb3B5OiBTYW1lIGVudGl0eVVJRCBmb3Igam9pbnRzIFx1MjE5MiBqb2ludHMgYXJlIHNoYXJlZCwgbm8gcmVnaXN0cmF0aW9uIG5lZWRlZFxuICAgIC8vIC0gU2VwYXJhdGUgbG9hZDogRGlmZmVyZW50IGVudGl0eVVJRCBidXQgc2FtZSBqb2ludEluZGV4IFx1MjE5MiByZWdpc3RlciBmb3IgZWFybHkgcmV0dXJuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgY29uc3QgY2FjaGVMZWFkZXJzID0gQW5pbWF0aW9uU3RhdGVSZXBvc2l0b3J5LmdldE9yQ3JlYXRlQ2FjaGVMZWFkZXJzKHRoaXMuX19lbmdpbmUpO1xuICAgIGNvbnN0IGxlYWRlckpvaW50SW5kZXhUb0VudGl0eVVJRCA9IEFuaW1hdGlvblN0YXRlUmVwb3NpdG9yeS5nZXRPckNyZWF0ZUxlYWRlckpvaW50SW5kZXhUb0VudGl0eVVJRCh0aGlzLl9fZW5naW5lKTtcbiAgICBjb25zdCBjdXJyZW50RnJhbWVDYWNoZWRFbnRpdHlVSURzID0gQW5pbWF0aW9uU3RhdGVSZXBvc2l0b3J5LmdldE9yQ3JlYXRlQ3VycmVudEZyYW1lQ2FjaGVkRW50aXR5VUlEcyhcbiAgICAgIHRoaXMuX19lbmdpbmVcbiAgICApO1xuXG4gICAgaWYgKGNhY2hlS2V5KSB7XG4gICAgICBjb25zdCBjYWNoZSA9IFNrZWxldGFsQ29tcG9uZW50Ll9fc2tpbkNhbGN1bGF0aW9uQ2FjaGUuZ2V0KGNhY2hlS2V5KTtcblxuICAgICAgLy8gLS0tIENhY2hlIEhpdDogUmV1c2UgZXhpc3Rpbmcgc2tpbm5pbmcgcmVzdWx0IC0tLVxuICAgICAgLy8gQ2hlY2sgaWYgYSB2YWxpZCBjYWNoZSBleGlzdHMgZm9yIHRoaXMgRW5naW5lLnByb2Nlc3MoKSBmcmFtZS5cbiAgICAgIGlmIChjYWNoZT8ucHJvY2Vzc0ZyYW1lVG9rZW4gPT09IGN1cnJlbnRQcm9jZXNzRnJhbWVUb2tlbikge1xuICAgICAgICAvLyBEZXRlcm1pbmUgaWYgdGhpcyBTa2VsZXRhbENvbXBvbmVudCBpcyB0aGUgXCJsZWFkZXJcIiBmb3IgdGhpcyBjYWNoZSBrZXkuXG4gICAgICAgIC8vIExlYWRlcnMgY29tcHV0ZWQgdGhlIHNraW5uaW5nIHJlc3VsdCwgc28gdGhlaXIgam9pbnRzIG11c3QgY29udGludWUgYW5pbWF0aW5nLlxuICAgICAgICBjb25zdCBpc0xlYWRlciA9IGNhY2hlTGVhZGVycy5nZXQoY2FjaGVLZXkpID09PSB0aGlzLmVudGl0eVVJRDtcblxuICAgICAgICBpZiAoIWlzTGVhZGVyKSB7XG4gICAgICAgICAgLy8gVGhpcyBpcyBhIFwiZm9sbG93ZXJcIiAtIHJlZ2lzdGVyIGl0cyBqb2ludHMgZm9yIEFuaW1hdGlvbkNvbXBvbmVudCBlYXJseSByZXR1cm4uXG4gICAgICAgICAgLy8gVXNlIGpvaW50SW5kZXggKHNrZWxldG9uIHN0cnVjdHVyZSkgdG8gY29tcGFyZSB3aXRoIGxlYWRlcidzIGpvaW50cy5cbiAgICAgICAgICBmb3IgKGNvbnN0IGpvaW50IG9mIHRoaXMuX19qb2ludHMpIHtcbiAgICAgICAgICAgIGNvbnN0IGxlYWRlckVudGl0eVVJRCA9IGxlYWRlckpvaW50SW5kZXhUb0VudGl0eVVJRC5nZXQoam9pbnQuam9pbnRJbmRleCk7XG4gICAgICAgICAgICAvLyBSZWdpc3RlciBvbmx5IGlmOlxuICAgICAgICAgICAgLy8gMS4gU2FtZSBqb2ludEluZGV4IGV4aXN0cyBpbiBsZWFkZXIgKHNhbWUgc2tlbGV0b24gc3RydWN0dXJlKVxuICAgICAgICAgICAgLy8gMi4gRW50aXR5VUlEIGlzIERJRkZFUkVOVCAoc2VwYXJhdGVseSBsb2FkZWQgbW9kZWwsIG5vdCBzaGFsbG93Q29weSlcbiAgICAgICAgICAgIGlmIChsZWFkZXJFbnRpdHlVSUQgIT09IHVuZGVmaW5lZCAmJiBsZWFkZXJFbnRpdHlVSUQgIT09IGpvaW50LmVudGl0eVVJRCkge1xuICAgICAgICAgICAgICBjdXJyZW50RnJhbWVDYWNoZWRFbnRpdHlVSURzLmFkZChqb2ludC5lbnRpdHlVSUQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gSWYgZW50aXR5VUlEIGlzIHRoZSBTQU1FLCB0aGlzIGlzIGEgc2hhbGxvd0NvcHkgY2FzZS5cbiAgICAgICAgICAgIC8vIFRoZSBqb2ludCBpcyBzaGFyZWQgd2l0aCBsZWFkZXIsIHNvIG5vIHJlZ2lzdHJhdGlvbiBuZWVkZWQuXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIExlYWRlciBjYXNlOiBEbyBub3QgcmVnaXN0ZXIgam9pbnRzIC0gbGVhZGVyIG11c3QgY29udGludWUgYW5pbWF0aW5nXG5cbiAgICAgICAgLy8gQXBwbHkgY2FjaGVkIHNraW5uaW5nIHJlc3VsdCBhbmQgcmV0dXJuIGVhcmx5XG4gICAgICAgIHRoaXMuX19hcHBseVNraW5uaW5nQ2FjaGUoY2FjaGUpO1xuICAgICAgICAvLyBBIGZvbGxvd2VyIG11c3QgY29weSB0aGUgbGVhZGVyJ3MgcmVzdWx0IGV2ZXJ5IGZyYW1lLCBzbyBpdCBuZXZlciB1c2VzIHRoZSBpbnB1dFxuICAgICAgICAvLyBzaWduYXR1cmUgc2tpcCB1bnRpbCBpdCBoYXMgY29tcHV0ZWQgc2tpbm5pbmcgaXRzZWxmLlxuICAgICAgICB0aGlzLl9faW52YWxpZGF0ZVNraW5Db21wdXRlU2lnbmF0dXJlKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gLS0tIENhY2hlIE1pc3M6IFRoaXMgU2tlbGV0YWxDb21wb25lbnQgYmVjb21lcyB0aGUgXCJsZWFkZXJcIiAtLS1cbiAgICAgIC8vIFJlZ2lzdGVyIHRoaXMgY29tcG9uZW50IGFzIHRoZSBsZWFkZXIgZm9yIHRoaXMgY2FjaGUga2V5XG4gICAgICBjYWNoZUxlYWRlcnMuc2V0KGNhY2hlS2V5LCB0aGlzLmVudGl0eVVJRCk7XG5cbiAgICAgIC8vIEJ1aWxkIGpvaW50SW5kZXggXHUyMTkyIGVudGl0eVVJRCBtYXBwaW5nIGZvciB0aGlzIGxlYWRlcidzIGpvaW50cy5cbiAgICAgIC8vIEZvbGxvd2VycyB3aWxsIHVzZSB0aGlzIHRvIGNvbXBhcmUgdGhlaXIgam9pbnRzIGJ5IHN0cnVjdHVyZSAoam9pbnRJbmRleClcbiAgICAgIC8vIHJhdGhlciB0aGFuIGJ5IGlkZW50aXR5IChlbnRpdHlVSUQpLlxuICAgICAgZm9yIChjb25zdCBqb2ludCBvZiB0aGlzLl9fam9pbnRzKSB7XG4gICAgICAgIGxlYWRlckpvaW50SW5kZXhUb0VudGl0eVVJRC5zZXQoam9pbnQuam9pbnRJbmRleCwgam9pbnQuZW50aXR5VUlEKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5fX2lzU2tpbkNvbXB1dGVJbnB1dFVuY2hhbmdlZChjYWNoZUtleSkpIHtcbiAgICAgIC8vIFB1Ymxpc2ggdGhpcyBmcmFtZSdzIGNhY2hlIGVudHJ5IHNvIGZvbGxvd2VycyBjYW4gc3RpbGwgcmV1c2UgdGhlIGV4aXN0aW5nIGJvbmUgZGF0YS5cbiAgICAgIGlmIChjYWNoZUtleSkge1xuICAgICAgICBTa2VsZXRhbENvbXBvbmVudC5fX3NraW5DYWxjdWxhdGlvbkNhY2hlLnNldChjYWNoZUtleSwgdGhpcy5fX2NyZWF0ZVNraW5uaW5nQ2FjaGUoY3VycmVudFByb2Nlc3NGcmFtZVRva2VuKSk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgYm9uZURhdGFUeXBlID0gdGhpcy5fX2FsbG9jYXRlZEJvbmVEYXRhVHlwZSE7XG4gICAgY29uc3QgYm9uZURhdGEgPSB0aGlzLl9ib25lRGF0YS5fdjtcbiAgICBjb25zdCBib25lRGF0YVVpbnQzMiA9IHRoaXMuX19ib25lRGF0YVVpbnQzMiE7XG4gICAgY29uc3QgdHJhbnNsYXRlU2NhbGVXb3JrID0gdGhpcy5fX2dldFRyYW5zbGF0ZVNjYWxlV29yayhib25lRGF0YVR5cGUpO1xuICAgIGNvbnN0IGludmVyc2VHbG9iYWxUcmFuc2Zvcm0gPSBNdXRhYmxlTWF0cml4NDQuaW52ZXJ0VG8odGhpcy5lbnRpdHkubWF0cml4SW5uZXIsIFNrZWxldGFsQ29tcG9uZW50Ll9fdG1wX21hdDRfMik7XG4gICAgbGV0IGhhc05vblVuaWZvcm1TY2FsZSA9IGZhbHNlO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fX2pvaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgam9pbnQgPSB0aGlzLl9fam9pbnRzW2ldO1xuICAgICAgY29uc3QgZ2xvYmFsSm9pbnRUcmFuc2Zvcm0gPSBqb2ludC5tYXRyaXhJbm5lcjtcblxuICAgICAgY29uc3Qgam9pbnRNYXRyaXggPSBNdXRhYmxlTWF0cml4NDQubXVsdGlwbHlUbyhcbiAgICAgICAgaW52ZXJzZUdsb2JhbFRyYW5zZm9ybSxcbiAgICAgICAgTXV0YWJsZU1hdHJpeDQ0Lm11bHRpcGx5VHlwZWRBcnJheVRvKFxuICAgICAgICAgIGdsb2JhbEpvaW50VHJhbnNmb3JtLFxuICAgICAgICAgIHRoaXMuX19pbnZlcnNlQmluZE1hdHJpY2VzQWNjZXNzb3IhLmdldFR5cGVkQXJyYXkoKSxcbiAgICAgICAgICBTa2VsZXRhbENvbXBvbmVudC5fX3RtcF9tYXQ0LFxuICAgICAgICAgIGlcbiAgICAgICAgKSxcbiAgICAgICAgU2tlbGV0YWxDb21wb25lbnQuX190bXBfbWF0NF8zXG4gICAgICApO1xuICAgICAgaWYgKHRoaXMuX2JpbmRTaGFwZU1hdHJpeCkge1xuICAgICAgICAvLyBnbFRGMSBza2luczogdGhlIGJpbmQgc2hhcGUgbWF0cml4IGlzIGFwcGxpZWQgdG8gdmVydGljZXMgYmVmb3JlIHRoZSBpbnZlcnNlIGJpbmQgbWF0cml4XG4gICAgICAgIGpvaW50TWF0cml4Lm11bHRpcGx5KHRoaXMuX2JpbmRTaGFwZU1hdHJpeCk7XG4gICAgICB9XG4gICAgICBjb25zdCBtID0gam9pbnRNYXRyaXg7XG5cbiAgICAgIGlmIChpID09PSAwICYmIGpvaW50LmVudGl0eS50cnlUb0dldEFuaW1hdGlvbigpICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5fX2pvaW50TWF0cml4LmNvcHlDb21wb25lbnRzKG0pO1xuICAgICAgfVxuICAgICAgaWYgKGkgPT09IDEgJiYgdGhpcy5fX2pvaW50c1swXS5lbnRpdHkudHJ5VG9HZXRBbmltYXRpb24oKSA9PSBudWxsKSB7XG4gICAgICAgIC8vIGlmIHRoZSBmaXJzdCBqb2ludCBoYXMgbm8gYW5pbWF0aW9uIChlLmcuIFJvb3Qgam9pbnQpLCBleHBlY3QgdGhlIHNlY29uZCBqb2ludCB0byBoYXZlIGEgc2lnbmlmaWNhbnQgbWF0cml4XG4gICAgICAgIHRoaXMuX19qb2ludE1hdHJpeC5jb3B5Q29tcG9uZW50cyhtKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fX2lzV29ybGRNYXRyaXhWYW5pbGxhID0gZmFsc2U7XG5cbiAgICAgIGlmIChib25lRGF0YVR5cGUgPT09IEJvbmVEYXRhVHlwZS5NYXQ0M3gxKSB7XG4gICAgICAgIHRoaXMuX19jb3B5VG9NYXRBcnJheShtLCBpKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIERlY29tcG9zZSBNID0gVCAqIFIgKiBTOiBlYWNoIGNvbHVtbiBvZiB0aGUgdXBwZXItbGVmdCAzeDMgaXMgYW4gYXhpcyBvZiBSIG11bHRpcGxpZWQgYnkgaXRzIHNjYWxlXG4gICAgICBjb25zdCB2ID0gbS5fdjtcbiAgICAgIGNvbnN0IHN4ID0gTWF0aC5oeXBvdCh2WzBdLCB2WzFdLCB2WzJdKTtcbiAgICAgIGNvbnN0IHN5ID0gTWF0aC5oeXBvdCh2WzRdLCB2WzVdLCB2WzZdKTtcbiAgICAgIGNvbnN0IHN6ID0gTWF0aC5oeXBvdCh2WzhdLCB2WzldLCB2WzEwXSk7XG4gICAgICAvLyBBIG1pcnJvcmVkIG1hdHJpeCAoZGV0IDwgMCkgaXMgbm90IGEgcm90YXRpb24gdGltZXMgcG9zaXRpdmUgc2NhbGVzLCBzbyBpdCBuZWVkcyBhIG5lZ2F0aXZlIHNjYWxlXG4gICAgICBjb25zdCBpc01pcnJvcmVkID0gU2tlbGV0YWxDb21wb25lbnQuX19kZXRlcm1pbmFudDN4Myh2KSA8IDA7XG5cbiAgICAgIGlmIChib25lRGF0YVR5cGUgPT09IEJvbmVEYXRhVHlwZS5WZWM0eDIpIHtcbiAgICAgICAgLy8gTmVnYXRlIHRoZSB4IHNjYWxlIG9mIGEgbWlycm9yZWQgbWF0cml4IHNvIHRoYXQgUiBpcyBhIHByb3BlciByb3RhdGlvblxuICAgICAgICBjb25zdCBzaWduZWRTeCA9IGlzTWlycm9yZWQgPyAtc3ggOiBzeDtcbiAgICAgICAgY29uc3QgcSA9IFNrZWxldGFsQ29tcG9uZW50Ll9fZXh0cmFjdFJvdGF0aW9uKG0sIHNpZ25lZFN4LCBzeSwgc3opO1xuICAgICAgICBjb25zdCBsb2dRdWF0ID0gTWF0aFV0aWwuZW5jb2RlTG9nUXVhdChxLngsIHEueSwgcS56LCBxLncpO1xuICAgICAgICAvLyBbdHJhbnNsYXRpb24ueHl6LCBsb2dRdWF0LmxvXSwgW3NjYWxlLnh5eiwgbG9nUXVhdC5oaV1cbiAgICAgICAgY29uc3QgYmFzZSA9IGkgKiA4O1xuICAgICAgICBib25lRGF0YVtiYXNlICsgMF0gPSB2WzEyXTtcbiAgICAgICAgYm9uZURhdGFbYmFzZSArIDFdID0gdlsxM107XG4gICAgICAgIGJvbmVEYXRhW2Jhc2UgKyAyXSA9IHZbMTRdO1xuICAgICAgICBib25lRGF0YVVpbnQzMltiYXNlICsgM10gPSBsb2dRdWF0WzBdO1xuICAgICAgICBib25lRGF0YVtiYXNlICsgNF0gPSBzaWduZWRTeDtcbiAgICAgICAgYm9uZURhdGFbYmFzZSArIDVdID0gc3k7XG4gICAgICAgIGJvbmVEYXRhW2Jhc2UgKyA2XSA9IHN6O1xuICAgICAgICBib25lRGF0YVVpbnQzMltiYXNlICsgN10gPSBsb2dRdWF0WzFdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVmVjNHgxIHN1cHBvcnRzIG9ubHkgdW5pZm9ybSBzY2FsZTogdGhlIGxhcmdlc3Qgb25lIGlzIHVzZWRcbiAgICAgICAgaWYgKCFoYXNOb25Vbmlmb3JtU2NhbGUgJiYgIU1hdGhVdGlsLmlzVW5pZm9ybVNjYWxlKHN4LCBzeSwgc3opKSB7XG4gICAgICAgICAgaGFzTm9uVW5pZm9ybVNjYWxlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBSZXByZXNlbnQgYSBtaXJyb3JlZCBtYXRyaXggYXMgUiAqICgtcyk6IG5lZ2F0ZSBhbGwgdGhlIGF4ZXMgc28gdGhhdCBSIGlzIGEgcHJvcGVyIHJvdGF0aW9uXG4gICAgICAgIGNvbnN0IHNpZ24gPSBpc01pcnJvcmVkID8gLTEgOiAxO1xuICAgICAgICBjb25zdCBxID0gU2tlbGV0YWxDb21wb25lbnQuX19leHRyYWN0Um90YXRpb24obSwgc2lnbiAqIHN4LCBzaWduICogc3ksIHNpZ24gKiBzeik7XG4gICAgICAgIGNvbnN0IGxvZ1F1YXQgPSBNYXRoVXRpbC5lbmNvZGVMb2dRdWF0KHEueCwgcS55LCBxLnosIHEudyk7XG4gICAgICAgIC8vIFtsb2dRdWF0LmxvLCBsb2dRdWF0LmhpIChiaXQgMzE6IG5lZ2F0aXZlIHNjYWxlKSwgcGFja2VkVHJhbnNsYXRlU2NhbGUubG8sIHBhY2tlZFRyYW5zbGF0ZVNjYWxlLmhpXVxuICAgICAgICAvLyBUaGUgdHJhbnNsYXRpb24gYW5kIHRoZSBzY2FsZSBhcmUgcGFja2VkIGFmdGVyIHRoaXMgbG9vcCwgYXMgdGhlIHRyYW5zbGF0aW9uIGlzIG5vcm1hbGl6ZWQgYnkgdGhlIG1heC5cbiAgICAgICAgdHJhbnNsYXRlU2NhbGVXb3JrW2kgKiA0ICsgMF0gPSB2WzEyXTtcbiAgICAgICAgdHJhbnNsYXRlU2NhbGVXb3JrW2kgKiA0ICsgMV0gPSB2WzEzXTtcbiAgICAgICAgdHJhbnNsYXRlU2NhbGVXb3JrW2kgKiA0ICsgMl0gPSB2WzE0XTtcbiAgICAgICAgdHJhbnNsYXRlU2NhbGVXb3JrW2kgKiA0ICsgM10gPSBNYXRoLm1heChzeCwgc3ksIHN6KTtcbiAgICAgICAgYm9uZURhdGFVaW50MzJbaSAqIDQgKyAwXSA9IGxvZ1F1YXRbMF07XG4gICAgICAgIGJvbmVEYXRhVWludDMyW2kgKiA0ICsgMV0gPSBpc01pcnJvcmVkID8gKGxvZ1F1YXRbMV0gfCBWRUM0WDFfTkVHQVRJVkVfU0NBTEVfQklUKSA+Pj4gMCA6IGxvZ1F1YXRbMV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGhhc05vblVuaWZvcm1TY2FsZSAmJiB0aGlzLl9faGFuZGxlTm9uVW5pZm9ybVNjYWxlT2ZWZWM0eDEoKSkge1xuICAgICAgLy8gU3dpdGNoZWQgdG8gVmVjNHgyOiBjb21wdXRlIGFnYWluIHdpdGggdGhlIG5ldyBsYXlvdXQgKHRoZSBza2lubmluZyBjYWNoZSBrZXkgY2hhbmdlcyBhcyB3ZWxsKVxuICAgICAgdGhpcy4kbG9naWMoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoYm9uZURhdGFUeXBlID09PSBCb25lRGF0YVR5cGUuVmVjNHgxKSB7XG4gICAgICBsZXQgbWF4QWJzWCA9IDE7XG4gICAgICBsZXQgbWF4QWJzWSA9IDE7XG4gICAgICBsZXQgbWF4QWJzWiA9IDE7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX19qb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgYWJzWCA9IE1hdGguYWJzKHRyYW5zbGF0ZVNjYWxlV29ya1tpICogNCArIDBdKTtcbiAgICAgICAgaWYgKGFic1ggPiBtYXhBYnNYKSB7XG4gICAgICAgICAgbWF4QWJzWCA9IGFic1g7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYWJzWSA9IE1hdGguYWJzKHRyYW5zbGF0ZVNjYWxlV29ya1tpICogNCArIDFdKTtcbiAgICAgICAgaWYgKGFic1kgPiBtYXhBYnNZKSB7XG4gICAgICAgICAgbWF4QWJzWSA9IGFic1k7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYWJzWiA9IE1hdGguYWJzKHRyYW5zbGF0ZVNjYWxlV29ya1tpICogNCArIDJdKTtcbiAgICAgICAgaWYgKGFic1ogPiBtYXhBYnNaKSB7XG4gICAgICAgICAgbWF4QWJzWiA9IGFic1o7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9fam9pbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIC8vIFBhY2sgdGhlIG5vcm1hbGl6ZWQgdHJhbnNsYXRpb24gYW5kIHRoZSB1bmlmb3JtIHNjYWxlIChpbiBsb2cyIHNwYWNlLCBzbyB0aGF0IHNjYWxlcyBvdmVyIDEgYXJlIGtlcHQpXG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRYID0gdHJhbnNsYXRlU2NhbGVXb3JrW2kgKiA0ICsgMF0gLyBtYXhBYnNYO1xuICAgICAgICBjb25zdCBub3JtYWxpemVkWSA9IHRyYW5zbGF0ZVNjYWxlV29ya1tpICogNCArIDFdIC8gbWF4QWJzWTtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZFogPSB0cmFuc2xhdGVTY2FsZVdvcmtbaSAqIDQgKyAyXSAvIG1heEFic1o7XG4gICAgICAgIGNvbnN0IGVuY29kZWRTY2FsZSA9IE1hdGhVdGlsLmVuY29kZVZlYzR4MVNjYWxlKHRyYW5zbGF0ZVNjYWxlV29ya1tpICogNCArIDNdKTtcblxuICAgICAgICBjb25zdCB2ZWMyVFBhY2tlZCA9IE1hdGhVdGlsLnBhY2tTbm9ybVZlYzRUb1VWZWMyKG5vcm1hbGl6ZWRYLCBub3JtYWxpemVkWSwgbm9ybWFsaXplZFosIGVuY29kZWRTY2FsZSk7XG4gICAgICAgIGJvbmVEYXRhVWludDMyW2kgKiA0ICsgMl0gPSB2ZWMyVFBhY2tlZFswXTtcbiAgICAgICAgYm9uZURhdGFVaW50MzJbaSAqIDQgKyAzXSA9IHZlYzJUUGFja2VkWzFdO1xuICAgICAgfVxuICAgICAgdGhpcy5fX3NldEJvbmVEYXRhSW5mbyhtYXhBYnNYLCBtYXhBYnNZLCBtYXhBYnNaLCBib25lRGF0YVR5cGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9fc2V0Qm9uZURhdGFJbmZvKDEsIDEsIDEsIGJvbmVEYXRhVHlwZSk7XG4gICAgfVxuXG4gICAgaWYgKGNhY2hlS2V5KSB7XG4gICAgICBTa2VsZXRhbENvbXBvbmVudC5fX3NraW5DYWxjdWxhdGlvbkNhY2hlLnNldChjYWNoZUtleSwgdGhpcy5fX2NyZWF0ZVNraW5uaW5nQ2FjaGUoY3VycmVudFByb2Nlc3NGcmFtZVRva2VuKSk7XG4gICAgfVxuICAgIHRoaXMuX19yZWNvcmRTa2luQ29tcHV0ZVNpZ25hdHVyZShjYWNoZUtleSk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyB0aGUgZGV0ZXJtaW5hbnQgb2YgdGhlIHVwcGVyLWxlZnQgM3gzIHBhcnQgb2YgYSBjb2x1bW4tbWFqb3IgNHg0IG1hdHJpeC5cbiAgICpcbiAgICogQHBhcmFtIHYgLSBUaGUgbWF0cml4IGVsZW1lbnRzIChjb2x1bW4tbWFqb3IpXG4gICAqIEByZXR1cm5zIFRoZSBkZXRlcm1pbmFudFxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19kZXRlcm1pbmFudDN4Myh2OiBBcnJheUxpa2U8bnVtYmVyPikge1xuICAgIC8vIGMwIC4gKGMxIHggYzIpXG4gICAgcmV0dXJuIChcbiAgICAgIHZbMF0gKiAodls1XSAqIHZbMTBdIC0gdls2XSAqIHZbOV0pICsgdlsxXSAqICh2WzZdICogdls4XSAtIHZbNF0gKiB2WzEwXSkgKyB2WzJdICogKHZbNF0gKiB2WzldIC0gdls1XSAqIHZbOF0pXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHRyYWN0cyB0aGUgcm90YXRpb24gUiBvZiBNID0gVCAqIFIgKiBTLCBnaXZlbiB0aGUgKHNpZ25lZCkgc2NhbGVzIG9mIFMuXG4gICAqIFRoZSBjb2x1bW5zIG9mIHRoZSB1cHBlci1sZWZ0IDN4MyBvZiBgbWAgYXJlIGRpdmlkZWQgYnkgdGhlIHNjYWxlcyBpbiBwbGFjZS5cbiAgICpcbiAgICogSWYgdGhlIHJvdGF0aW9uIGNhbm5vdCBiZSBleHRyYWN0ZWQgKGUuZy4gYSB6ZXJvIHNjYWxlIHVzZWQgdG8gaGlkZSBhIHBhcnQgb2YgYSBtZXNoKSwgdGhlIGlkZW50aXR5IGlzXG4gICAqIHJldHVybmVkIHdpdGhvdXQgbG9nZ2luZyBhbiBlcnJvciwgc2luY2UgdGhlIHJvdGF0aW9uIGRvZXMgbm90IGFmZmVjdCB0aGUgcmVzdWx0IGluIHRoYXQgY2FzZS5cbiAgICpcbiAgICogQHBhcmFtIG0gLSBUaGUgbWF0cml4IHRvIGRlY29tcG9zZSAob3ZlcndyaXR0ZW4pXG4gICAqIEBwYXJhbSBzeCAtIFRoZSB4IHNjYWxlIChuZWdhdGl2ZSBmb3IgYSBtaXJyb3JlZCBheGlzKVxuICAgKiBAcGFyYW0gc3kgLSBUaGUgeSBzY2FsZSAobmVnYXRpdmUgZm9yIGEgbWlycm9yZWQgYXhpcylcbiAgICogQHBhcmFtIHN6IC0gVGhlIHogc2NhbGUgKG5lZ2F0aXZlIGZvciBhIG1pcnJvcmVkIGF4aXMpXG4gICAqIEByZXR1cm5zIFRoZSByb3RhdGlvbiAoYSBzaGFyZWQgdGVtcG9yYXJ5IHF1YXRlcm5pb24pXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2V4dHJhY3RSb3RhdGlvbihtOiBNdXRhYmxlTWF0cml4NDQsIHN4OiBudW1iZXIsIHN5OiBudW1iZXIsIHN6OiBudW1iZXIpIHtcbiAgICBjb25zdCB2ID0gbS5fdjtcbiAgICBjb25zdCBpbnZTeCA9IDEgLyBzeDtcbiAgICBjb25zdCBpbnZTeSA9IDEgLyBzeTtcbiAgICBjb25zdCBpbnZTeiA9IDEgLyBzejtcbiAgICB2WzBdICo9IGludlN4O1xuICAgIHZbMV0gKj0gaW52U3g7XG4gICAgdlsyXSAqPSBpbnZTeDtcbiAgICB2WzRdICo9IGludlN5O1xuICAgIHZbNV0gKj0gaW52U3k7XG4gICAgdls2XSAqPSBpbnZTeTtcbiAgICB2WzhdICo9IGludlN6O1xuICAgIHZbOV0gKj0gaW52U3o7XG4gICAgdlsxMF0gKj0gaW52U3o7XG4gICAgY29uc3QgcSA9IFNrZWxldGFsQ29tcG9uZW50Ll9fdG1wX3E7XG4gICAgaWYgKCFxLnRyeUZyb21NYXRyaXgobSkpIHtcbiAgICAgIHEuc2V0Q29tcG9uZW50cygwLCAwLCAwLCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHE7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBhIG5vbi11bmlmb3JtIHNjYWxlIGZvdW5kIHdpdGggdGhlIFZlYzR4MSBib25lIGRhdGEgdHlwZSwgd2hpY2ggc3VwcG9ydHMgb25seSB1bmlmb3JtIHNjYWxlLlxuICAgKiBBbiBhdXRvbWF0aWNhbGx5IHNlbGVjdGVkIFZlYzR4MSBpcyBzd2l0Y2hlZCB0byBWZWM0eDIuIEFuIGV4cGxpY2l0bHkgc3BlY2lmaWVkIFZlYzR4MSAoc2V0Qm9uZURhdGFUeXBlIG9yXG4gICAqIENvbmZpZy5ib25lRGF0YVR5cGUpIGlzIGtlcHQsIGFuZCBhIHdhcm5pbmcgaXMgbG9nZ2VkIG9uY2UgKHRoZSBsYXJnZXN0IHNjYWxlIG9mIGVhY2ggam9pbnQgaXMgdXNlZCkuXG4gICAqXG4gICAqIFRoZSBjb21wb25lbnRzIHNoYXJpbmcgdGhlIHNraW5uaW5nIGNhY2hlIHdpdGggdGhpcyBvbmUgYXJlIHN3aXRjaGVkIHRvZ2V0aGVyLiBPdGhlcndpc2UgdGhleSB3b3VsZCBnZXRcbiAgICogYSBkaWZmZXJlbnQgY2FjaGUga2V5IGFuZCBsb3NlIHRoZSBzaGFyZWQgcmVzdWx0LCBhbmQgYSBmb2xsb3dlciB3b3VsZCBmYWxsIGJhY2sgdG8gaXRzIG93biBqb2ludHMsIHdoaWNoXG4gICAqIG1heSBub3QgYmUgYW5pbWF0ZWQgKHNlZSB0aGUgQW5pbWF0aW9uQ29tcG9uZW50IGVhcmx5IHJldHVybikuIElmIGFueSBvZiB0aGVtIHNwZWNpZmllcyBWZWM0eDEgZXhwbGljaXRseSxcbiAgICogbm9uZSBvZiB0aGVtIGlzIHN3aXRjaGVkLlxuICAgKlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBib25lIGRhdGEgdHlwZSBoYXMgYmVlbiBzd2l0Y2hlZCB0byBWZWM0eDJcbiAgICovXG4gIHByaXZhdGUgX19oYW5kbGVOb25Vbmlmb3JtU2NhbGVPZlZlYzR4MSgpOiBib29sZWFuIHtcbiAgICBjb25zdCBzaGFyaW5nQ29tcG9uZW50cyA9IHRoaXMuX19nZXRDb21wb25lbnRzU2hhcmluZ1NraW5DYWNoZSgpO1xuICAgIGlmIChcbiAgICAgIHRoaXMuX19lbmdpbmUuY29uZmlnLmJvbmVEYXRhVHlwZSA9PSBudWxsICYmXG4gICAgICBzaGFyaW5nQ29tcG9uZW50cy5ldmVyeShjb21wb25lbnQgPT4gY29tcG9uZW50Ll9faXNCb25lRGF0YVR5cGVBdXRvU2VsZWN0ZWQpXG4gICAgKSB7XG4gICAgICBmb3IgKGNvbnN0IGNvbXBvbmVudCBvZiBzaGFyaW5nQ29tcG9uZW50cykge1xuICAgICAgICBjb21wb25lbnQuc2V0Qm9uZURhdGFUeXBlKEJvbmVEYXRhVHlwZS5WZWM0eDIsIHRydWUpO1xuICAgICAgfVxuICAgICAgdGhpcy5fX2VuZ2luZS5sb2dnZXIuaW5mbyhcbiAgICAgICAgYFNrZWxldGFsQ29tcG9uZW50IChlbnRpdHkgJHt0aGlzLmVudGl0eVVJRH0pOiBzd2l0Y2hlZCB0aGUgYm9uZSBkYXRhIHR5cGUgZnJvbSBWZWM0eDEgdG8gVmVjNHgyIGJlY2F1c2UgYSBub24tdW5pZm9ybSBzY2FsZSB3YXMgZm91bmQgKCR7c2hhcmluZ0NvbXBvbmVudHMubGVuZ3RofSBjb21wb25lbnQocykgc2hhcmluZyB0aGUgc2tpbm5pbmcgY2FjaGUpLmBcbiAgICAgICk7XG4gICAgICByZXR1cm4gdGhpcy5fX2FsbG9jYXRlZEJvbmVEYXRhVHlwZSA9PT0gQm9uZURhdGFUeXBlLlZlYzR4MjtcbiAgICB9XG4gICAgaWYgKCF0aGlzLl9faGFzV2FybmVkTm9uVW5pZm9ybVNjYWxlKSB7XG4gICAgICB0aGlzLl9faGFzV2FybmVkTm9uVW5pZm9ybVNjYWxlID0gdHJ1ZTtcbiAgICAgIHRoaXMuX19lbmdpbmUubG9nZ2VyLndhcm4oXG4gICAgICAgIGBTa2VsZXRhbENvbXBvbmVudCAoZW50aXR5ICR7dGhpcy5lbnRpdHlVSUR9KTogdGhlIFZlYzR4MSBib25lIGRhdGEgdHlwZSBzdXBwb3J0cyBvbmx5IHVuaWZvcm0gc2NhbGUsIGJ1dCBhIG5vbi11bmlmb3JtIHNjYWxlIHdhcyBmb3VuZC4gVGhlIGxhcmdlc3Qgc2NhbGUgaXMgdXNlZC4gVXNlIFZlYzR4MiBvciBNYXQ0M3gxIGZvciB0aGlzIHNrZWxldG9uLmBcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBza2VsZXRhbCBjb21wb25lbnRzIHRoYXQgc2hhcmUgdGhlIHNraW5uaW5nIGNhY2hlIHdpdGggdGhpcyBjb21wb25lbnQgKGluY2x1ZGluZyB0aGlzIG9uZSkuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBjb21wb25lbnRzIHdpdGggdGhlIHNhbWUgc2tpbm5pbmcgY2FjaGUga2V5XG4gICAqL1xuICBwcml2YXRlIF9fZ2V0Q29tcG9uZW50c1NoYXJpbmdTa2luQ2FjaGUoKTogU2tlbGV0YWxDb21wb25lbnRbXSB7XG4gICAgY29uc3Qga2V5ID0gdGhpcy5fX3NraW5DYWNoZUtleTtcbiAgICBpZiAoa2V5ID09IG51bGwpIHtcbiAgICAgIHJldHVybiBbdGhpc107XG4gICAgfVxuICAgIGNvbnN0IGNvbXBvbmVudHMgPSAodGhpcy5fX2VuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudHNXaXRoVHlwZShTa2VsZXRhbENvbXBvbmVudCkgPz9cbiAgICAgIFtdKSBhcyBTa2VsZXRhbENvbXBvbmVudFtdO1xuICAgIHJldHVybiBjb21wb25lbnRzLmZpbHRlcihjb21wb25lbnQgPT4gY29tcG9uZW50ID09PSB0aGlzIHx8IGNvbXBvbmVudC5fX3NraW5DYWNoZUtleSA9PT0ga2V5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgQ1BVLXNpZGUgd29yayBidWZmZXIgZm9yIHRyYW5zbGF0aW9uIGFuZCBzY2FsZSAodXNlZCBvbmx5IGluIFZlYzR4MSBib25lIGRhdGEgdHlwZSkuXG4gICAqXG4gICAqIEBwYXJhbSBib25lRGF0YVR5cGUgLSBUaGUgYm9uZSBkYXRhIHR5cGVcbiAgICogQHJldHVybnMgVGhlIHdvcmsgYnVmZmVyIChlbXB0eSB1bmxlc3MgVmVjNHgxKVxuICAgKi9cbiAgcHJpdmF0ZSBfX2dldFRyYW5zbGF0ZVNjYWxlV29yayhib25lRGF0YVR5cGU6IEJvbmVEYXRhVHlwZUVudW0pIHtcbiAgICBpZiAoYm9uZURhdGFUeXBlICE9PSBCb25lRGF0YVR5cGUuVmVjNHgxKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX2JvbmVUcmFuc2xhdGVTY2FsZVdvcms7XG4gICAgfVxuICAgIGNvbnN0IHJlcXVpcmVkTGVuZ3RoID0gdGhpcy5fX2pvaW50cy5sZW5ndGggKiA0O1xuICAgIGlmICh0aGlzLl9fYm9uZVRyYW5zbGF0ZVNjYWxlV29yay5sZW5ndGggPCByZXF1aXJlZExlbmd0aCkge1xuICAgICAgdGhpcy5fX2JvbmVUcmFuc2xhdGVTY2FsZVdvcmsgPSBuZXcgRmxvYXQzMkFycmF5KHJlcXVpcmVkTGVuZ3RoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX19ib25lVHJhbnNsYXRlU2NhbGVXb3JrO1xuICB9XG5cbiAgLyoqXG4gICAqIENvcGllcyBtYXRyaXggZGF0YSB0byB0aGUgbWF0cml4IGFycmF5IGluIGEgc3BlY2lmaWMgZm9ybWF0LlxuICAgKiBFeHRyYWN0cyB0aGUgZmlyc3QgMyByb3dzIG9mIGEgNHg0IG1hdHJpeCAoTWF0NDMgZm9ybWF0KSBmb3IgZWZmaWNpZW50IEdQVSBzdG9yYWdlLlxuICAgKlxuICAgKiBAcGFyYW0gbSAtIFRoZSBzb3VyY2UgbWF0cml4IHRvIGNvcHkgZnJvbVxuICAgKiBAcGFyYW0gaSAtIFRoZSBpbmRleCBvZiB0aGUgam9pbnQvYm9uZVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2NvcHlUb01hdEFycmF5KG06IElNYXRyaXg0NCwgaTogSW5kZXgpIHtcbiAgICAvLyAwICAxICAyICAzXG4gICAgLy8gNCAgNSAgNiAgN1xuICAgIC8vIDggIDkgIDEwIDExXG4gICAgLy8gMTIgMTMgMTQgMTVcblxuICAgIHRoaXMuX2JvbmVEYXRhLl92W2kgKiAxMiArIDBdID0gbS5fdlswXTtcbiAgICB0aGlzLl9ib25lRGF0YS5fdltpICogMTIgKyAxXSA9IG0uX3ZbMV07XG4gICAgdGhpcy5fYm9uZURhdGEuX3ZbaSAqIDEyICsgMl0gPSBtLl92WzJdO1xuICAgIHRoaXMuX2JvbmVEYXRhLl92W2kgKiAxMiArIDNdID0gbS5fdls0XTtcbiAgICB0aGlzLl9ib25lRGF0YS5fdltpICogMTIgKyA0XSA9IG0uX3ZbNV07XG4gICAgdGhpcy5fYm9uZURhdGEuX3ZbaSAqIDEyICsgNV0gPSBtLl92WzZdO1xuICAgIHRoaXMuX2JvbmVEYXRhLl92W2kgKiAxMiArIDZdID0gbS5fdls4XTtcbiAgICB0aGlzLl9ib25lRGF0YS5fdltpICogMTIgKyA3XSA9IG0uX3ZbOV07XG4gICAgdGhpcy5fYm9uZURhdGEuX3ZbaSAqIDEyICsgOF0gPSBtLl92WzEwXTtcbiAgICB0aGlzLl9ib25lRGF0YS5fdltpICogMTIgKyA5XSA9IG0uX3ZbMTJdO1xuICAgIHRoaXMuX2JvbmVEYXRhLl92W2kgKiAxMiArIDEwXSA9IG0uX3ZbMTNdO1xuICAgIHRoaXMuX2JvbmVEYXRhLl92W2kgKiAxMiArIDExXSA9IG0uX3ZbMTRdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGludmVyc2UgYmluZCBtYXRyaWNlcyBhY2Nlc3Nvci5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGFjY2Vzc29yIGNvbnRhaW5pbmcgaW52ZXJzZSBiaW5kIG1hdHJpY2VzLCBvciB1bmRlZmluZWQgaWYgbm90IHNldFxuICAgKi9cbiAgcHVibGljIGdldEludmVyc2VCaW5kTWF0cmljZXNBY2Nlc3NvcigpOiBBY2Nlc3NvciB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX19pbnZlcnNlQmluZE1hdHJpY2VzQWNjZXNzb3I7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgYSBzaGFsbG93IGNvcHkgZnJvbSBhbm90aGVyIFNrZWxldGFsQ29tcG9uZW50LlxuICAgKiBDb3BpZXMgYWxsIHJlbGV2YW50IHNrZWxldGFsIGRhdGEgd2l0aG91dCBkZWVwIGNsb25pbmcgY29tcGxleCBvYmplY3RzLlxuICAgKlxuICAgKiBAcGFyYW0gY29tcG9uZW50XyAtIFRoZSBzb3VyY2UgY29tcG9uZW50IHRvIGNvcHkgZnJvbVxuICAgKiBAcHJvdGVjdGVkXG4gICAqL1xuICBfc2hhbGxvd0NvcHlGcm9tKGNvbXBvbmVudF86IENvbXBvbmVudCk6IHZvaWQge1xuICAgIGNvbnN0IGNvbXBvbmVudCA9IGNvbXBvbmVudF8gYXMgU2tlbGV0YWxDb21wb25lbnQ7XG5cbiAgICB0aGlzLl9qb2ludEluZGljZXMgPSBjb21wb25lbnQuX2pvaW50SW5kaWNlcy5jb25jYXQoKTtcbiAgICB0aGlzLl9fYm9uZURhdGFUeXBlID0gY29tcG9uZW50Ll9fYm9uZURhdGFUeXBlO1xuICAgIHRoaXMuX19pc0JvbmVEYXRhVHlwZUF1dG9TZWxlY3RlZCA9IGNvbXBvbmVudC5fX2lzQm9uZURhdGFUeXBlQXV0b1NlbGVjdGVkO1xuXG4gICAgaWYgKGNvbXBvbmVudC5fX2pvaW50cy5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLnNldEpvaW50cyhjb21wb25lbnQuX19qb2ludHMuY29uY2F0KCkpO1xuICAgICAgdGhpcy5fX2NvcHlCb25lQnVmZmVyc0Zyb20oY29tcG9uZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fX2pvaW50cyA9IFtdO1xuICAgICAgdGhpcy5fX2ludmFsaWRhdGVTa2luQ29tcHV0ZVNpZ25hdHVyZSgpO1xuICAgIH1cblxuICAgIHRoaXMuX19pbnZlcnNlQmluZE1hdHJpY2VzQWNjZXNzb3IgPSBjb21wb25lbnQuX19pbnZlcnNlQmluZE1hdHJpY2VzQWNjZXNzb3I7XG4gICAgaWYgKElzLmV4aXN0KGNvbXBvbmVudC5fYmluZFNoYXBlTWF0cml4KSkge1xuICAgICAgdGhpcy5fYmluZFNoYXBlTWF0cml4ID0gY29tcG9uZW50Ll9iaW5kU2hhcGVNYXRyaXguY2xvbmUoKTtcbiAgICB9XG4gICAgdGhpcy50b3BPZkpvaW50c0hpZXJhcmNoeSA9IGNvbXBvbmVudC50b3BPZkpvaW50c0hpZXJhcmNoeTtcbiAgICB0aGlzLmlzU2tpbm5pbmcgPSBjb21wb25lbnQuaXNTa2lubmluZztcbiAgICB0aGlzLl9fam9pbnRNYXRyaXguY29weUNvbXBvbmVudHMoY29tcG9uZW50Ll9fam9pbnRNYXRyaXgpO1xuICAgIHRoaXMuX19pc1dvcmxkTWF0cml4VmFuaWxsYSA9IGNvbXBvbmVudC5fX2lzV29ybGRNYXRyaXhWYW5pbGxhO1xuICAgIHRoaXMuX19pbnZlcnNlQmluZE1hdHJpY2VzU2lnbmF0dXJlID0gY29tcG9uZW50Ll9faW52ZXJzZUJpbmRNYXRyaWNlc1NpZ25hdHVyZTtcbiAgICB0aGlzLl9fam9pbnRMaXN0S2V5ID0gY29tcG9uZW50Ll9fam9pbnRMaXN0S2V5O1xuICAgIHRoaXMuX191cGRhdGVTa2luQ2FjaGVLZXkoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBlbnRpdHkgdGhhdCBvd25zIHRoaXMgY29tcG9uZW50LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZW50aXR5IHdpdGggc2tlbGV0YWwgY2FwYWJpbGl0aWVzIHRoYXQgaGFzIHRoaXMgY29tcG9uZW50XG4gICAqL1xuICBnZXQgZW50aXR5KCk6IElTa2VsZXRhbEVudGl0eSB7XG4gICAgcmV0dXJuIHRoaXMuX19lbmdpbmUuZW50aXR5UmVwb3NpdG9yeS5nZXRFbnRpdHkodGhpcy5fX2VudGl0eVVpZCkgYXMgdW5rbm93biBhcyBJU2tlbGV0YWxFbnRpdHk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhpcyBjb21wb25lbnQgYW5kIGNsZWFucyB1cCByZXNvdXJjZXMuXG4gICAqXG4gICAqIEBwcm90ZWN0ZWRcbiAgICovXG4gIF9kZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuX19pbnZhbGlkYXRlU2tpbkNvbXB1dGVTaWduYXR1cmUoKTtcbiAgICBzdXBlci5fZGVzdHJveSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhbiBlbnRpdHkncyBBbmltYXRpb25Db21wb25lbnQgY2FuIHBlcmZvcm0gZWFybHkgcmV0dXJuLlxuICAgKlxuICAgKiBUaGlzIGlzIGNhbGxlZCBieSBBbmltYXRpb25Db21wb25lbnQuJGxvZ2ljIHRvIGRldGVybWluZSBpZiBhbmltYXRpb24gY2FsY3VsYXRpb25zXG4gICAqIGNhbiBiZSBza2lwcGVkLiBBbiBlbnRpdHkgaXMgY29uc2lkZXJlZCBcImNhY2hlZFwiIGlmOlxuICAgKiAxLiBJdHMgU2tlbGV0YWxDb21wb25lbnQgaGFkIGEgc2tpbm5pbmcgY2FjaGUgaGl0IGluIHRoZSBwcmV2aW91cyBmcmFtZVxuICAgKiAyLiBJdCBpcyBOT1QgYSBcImxlYWRlclwiIGpvaW50IChsZWFkZXJzIG11c3QgY29udGludWUgYW5pbWF0aW5nKVxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBhbHNvIGhhbmRsZXMgdGhlIGZyYW1lIHRyYW5zaXRpb24gKHN3YXBwaW5nIGN1cnJlbnQvcHJldmlvdXMgY2FjaGVkIFVJRHMpXG4gICAqIHNpbmNlIEFuaW1hdGlvbkNvbXBvbmVudC4kbG9naWMgcnVucyBiZWZvcmUgU2tlbGV0YWxDb21wb25lbnQuJGxvZ2ljIGluIGVhY2ggZnJhbWUuXG4gICAqXG4gICAqIEBwYXJhbSBlbnRpdHlVSUQgLSBUaGUgZW50aXR5IFVJRCB0byBjaGVjayAodHlwaWNhbGx5IGEgam9pbnQvYm9uZSBlbnRpdHkpXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlIGZvciBtdWx0aS1lbmdpbmUgc3VwcG9ydFxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBlbnRpdHkgY2FuIHNraXAgYW5pbWF0aW9uIGNhbGN1bGF0aW9uLCBmYWxzZSBpZiBpdCBtdXN0IGFuaW1hdGVcbiAgICovXG4gIHN0YXRpYyBpc0VudGl0eUNhY2hlZChlbnRpdHlVSUQ6IEVudGl0eVVJRCwgZW5naW5lOiBFbmdpbmUpOiBib29sZWFuIHtcbiAgICByZXR1cm4gQW5pbWF0aW9uU3RhdGVSZXBvc2l0b3J5LmlzRW50aXR5Q2FjaGVkKGVudGl0eVVJRCwgZW5naW5lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoaXMgY29tcG9uZW50IHRvIGFuIGVudGl0eSwgZXh0ZW5kaW5nIGl0IHdpdGggc2tlbGV0YWwgZnVuY3Rpb25hbGl0eS5cbiAgICogVGhpcyBtZXRob2QgdXNlcyBtaXhpbnMgdG8gYWRkIHNrZWxldGFsLXNwZWNpZmljIG1ldGhvZHMgdG8gdGhlIHRhcmdldCBlbnRpdHkuXG4gICAqXG4gICAqIEBwYXJhbSBiYXNlIC0gVGhlIHRhcmdldCBlbnRpdHkgdG8gZXh0ZW5kXG4gICAqIEBwYXJhbSBfY29tcG9uZW50Q2xhc3MgLSBUaGUgY29tcG9uZW50IGNsYXNzIGJlaW5nIGFkZGVkXG4gICAqIEByZXR1cm5zIFRoZSBlbnRpdHkgZXh0ZW5kZWQgd2l0aCBza2VsZXRhbCBjb21wb25lbnQgbWV0aG9kc1xuICAgKiBAb3ZlcnJpZGVcbiAgICovXG4gIGFkZFRoaXNDb21wb25lbnRUb0VudGl0eTxFbnRpdHlCYXNlIGV4dGVuZHMgSUVudGl0eSwgU29tZUNvbXBvbmVudENsYXNzIGV4dGVuZHMgdHlwZW9mIENvbXBvbmVudD4oXG4gICAgYmFzZTogRW50aXR5QmFzZSxcbiAgICBfY29tcG9uZW50Q2xhc3M6IFNvbWVDb21wb25lbnRDbGFzc1xuICApIHtcbiAgICBjbGFzcyBTa2VsZXRhbEVudGl0eSBleHRlbmRzIChiYXNlLmNvbnN0cnVjdG9yIGFzIGFueSkge1xuICAgICAgZ2V0U2tlbGV0YWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldENvbXBvbmVudEJ5Q29tcG9uZW50VElEKFdlbGxLbm93bkNvbXBvbmVudFRJRHMuU2tlbGV0YWxDb21wb25lbnRUSUQpIGFzIFNrZWxldGFsQ29tcG9uZW50O1xuICAgICAgfVxuICAgIH1cbiAgICBhcHBseU1peGlucyhiYXNlLCBTa2VsZXRhbEVudGl0eSk7XG4gICAgcmV0dXJuIGJhc2UgYXMgdW5rbm93biBhcyBDb21wb25lbnRUb0NvbXBvbmVudE1ldGhvZHM8U29tZUNvbXBvbmVudENsYXNzPiAmIEVudGl0eUJhc2U7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW52ZXJzZSBiaW5kIG1hdHJpeCBmb3IgYSBzcGVjaWZpYyBqb2ludC5cbiAgICpcbiAgICogQHBhcmFtIHNnIC0gVGhlIFNjZW5lR3JhcGhDb21wb25lbnQgcmVwcmVzZW50aW5nIHRoZSBqb2ludFxuICAgKiBAcmV0dXJucyBUaGUgaW52ZXJzZSBiaW5kIG1hdHJpeCBmb3IgdGhlIHNwZWNpZmllZCBqb2ludFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2dldEludmVyc2VCaW5kTWF0cmljZXMoc2c6IFNjZW5lR3JhcGhDb21wb25lbnQpOiBJTWF0cml4NDQge1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5fX2pvaW50cy5pbmRleE9mKHNnKTtcbiAgICBjb25zdCBmbG9hdDMyQXJyYXkgPSB0aGlzLl9faW52ZXJzZUJpbmRNYXRyaWNlc0FjY2Vzc29yIS5nZXRUeXBlZEFycmF5KCkgYXMgRmxvYXQzMkFycmF5O1xuICAgIGNvbnN0IG0gPSBuZXcgTWF0cml4NDQoZmxvYXQzMkFycmF5LnNsaWNlKGluZGV4ICogMTYsIGluZGV4ICogMTYgKyAxNikpO1xuICAgIHJldHVybiBtO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2NvcHlCb25lQnVmZmVyc0Zyb20oY29tcG9uZW50OiBTa2VsZXRhbENvbXBvbmVudCkge1xuICAgIGNvbnN0IGNvcHlWZWN0b3IgPSAodGFyZ2V0OiBWZWN0b3JOLCBzb3VyY2U6IFZlY3Rvck4pID0+IHtcbiAgICAgIGlmICh0YXJnZXQuaXNEdW1teSgpIHx8IHNvdXJjZS5pc0R1bW15KCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGFyZ2V0LmNvcHlDb21wb25lbnRzKHNvdXJjZSk7XG4gICAgfTtcblxuICAgIGlmIChJcy5leGlzdChjb21wb25lbnQuX19qb2ludE1hdHJpY2VzKSkge1xuICAgICAgdGhpcy5fX2pvaW50TWF0cmljZXMgPSBjb21wb25lbnQuX19qb2ludE1hdHJpY2VzIS5jb25jYXQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fX2pvaW50TWF0cmljZXMgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgdGhpcy5fX2FsbG9jYXRlZEJvbmVEYXRhVHlwZSA9PT0gY29tcG9uZW50Ll9fYWxsb2NhdGVkQm9uZURhdGFUeXBlICYmXG4gICAgICB0aGlzLl9ib25lRGF0YS5fdi5sZW5ndGggPT09IGNvbXBvbmVudC5fYm9uZURhdGEuX3YubGVuZ3RoXG4gICAgKSB7XG4gICAgICBjb3B5VmVjdG9yKHRoaXMuX2JvbmVEYXRhLCBjb21wb25lbnQuX2JvbmVEYXRhKTtcbiAgICAgIGlmICghdGhpcy5fYm9uZURhdGFJbmZvLmlzRHVtbXkoKSAmJiAhY29tcG9uZW50Ll9ib25lRGF0YUluZm8uaXNEdW1teSgpKSB7XG4gICAgICAgIHRoaXMuX2JvbmVEYXRhSW5mby5jb3B5Q29tcG9uZW50cyhjb21wb25lbnQuX2JvbmVEYXRhSW5mbyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyB0aGUgYm9uZSBkYXRhIG1lbWJlciBhbmQgaXRzIGxvY2F0aW9uIG1lbWJlci5cbiAgICogVGhlIGJvbmUgZGF0YSBpcyBhIHZhcmlhYmxlLWxlbmd0aCBtZW1iZXIsIHNvIGl0cyBzaXplIGlzIGRlY2lkZWQgcGVyIGNvbXBvbmVudFxuICAgKiAoc2VlIGBfZ2V0QXJyYXlMZW5ndGhGb3JBbGxvY2F0aW9uYCkuXG4gICAqL1xuICBzdGF0aWMgX3JlZ2lzdGVyQm9uZURhdGFNZW1iZXIoKSB7XG4gICAgLy8gTXVzdCBiZSByZWdpc3RlcmVkIGJlZm9yZSB0aGUgdmFyaWFibGUtbGVuZ3RoIG1lbWJlclxuICAgIFNrZWxldGFsQ29tcG9uZW50LnJlZ2lzdGVyTWVtYmVyKHtcbiAgICAgIGJ1ZmZlclVzZTogQnVmZmVyVXNlLkdQVUluc3RhbmNlRGF0YSxcbiAgICAgIG1lbWJlck5hbWU6ICdib25lRGF0YUxvY2F0aW9uJyxcbiAgICAgIGRhdGFDbGFzc1R5cGU6IE11dGFibGVWZWN0b3I0LFxuICAgICAgc2hhZGVyVHlwZTogU2hhZGVyVHlwZS5WZXJ0ZXhTaGFkZXIsXG4gICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWM0LFxuICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgIGluaXRWYWx1ZXM6IFswLCAwLCAwLCAwXSxcbiAgICB9KTtcbiAgICBTa2VsZXRhbENvbXBvbmVudC5yZWdpc3Rlck1lbWJlcih7XG4gICAgICBidWZmZXJVc2U6IEJ1ZmZlclVzZS5HUFVJbnN0YW5jZURhdGEsXG4gICAgICBtZW1iZXJOYW1lOiAnYm9uZURhdGEnLFxuICAgICAgZGF0YUNsYXNzVHlwZTogVmVjdG9yTixcbiAgICAgIHNoYWRlclR5cGU6IFNoYWRlclR5cGUuVmVydGV4U2hhZGVyLFxuICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVmVjNEFycmF5LFxuICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgIGluaXRWYWx1ZXM6IG5ldyBWZWN0b3JOKG5ldyBGbG9hdDMyQXJyYXkoMCkpLFxuICAgICAgaXNWYXJpYWJsZUxlbmd0aDogdHJ1ZSxcbiAgICB9KTtcbiAgICBTa2VsZXRhbENvbXBvbmVudC5yZWdpc3Rlck1lbWJlcih7XG4gICAgICBidWZmZXJVc2U6IEJ1ZmZlclVzZS5HUFVJbnN0YW5jZURhdGEsXG4gICAgICBtZW1iZXJOYW1lOiAncHJldmlvdXNCb25lRGF0YUxvY2F0aW9uJyxcbiAgICAgIGRhdGFDbGFzc1R5cGU6IE11dGFibGVWZWN0b3I0LFxuICAgICAgc2hhZGVyVHlwZTogU2hhZGVyVHlwZS5WZXJ0ZXhTaGFkZXIsXG4gICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWM0LFxuICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgIGluaXRWYWx1ZXM6IFswLCAwLCAwLCAwXSxcbiAgICB9KTtcbiAgICBTa2VsZXRhbENvbXBvbmVudC5yZWdpc3Rlck1lbWJlcih7XG4gICAgICBidWZmZXJVc2U6IEJ1ZmZlclVzZS5HUFVJbnN0YW5jZURhdGEsXG4gICAgICBtZW1iZXJOYW1lOiAncHJldmlvdXNCb25lRGF0YScsXG4gICAgICBkYXRhQ2xhc3NUeXBlOiBWZWN0b3JOLFxuICAgICAgc2hhZGVyVHlwZTogU2hhZGVyVHlwZS5WZXJ0ZXhTaGFkZXIsXG4gICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWM0QXJyYXksXG4gICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICAgICAgaW5pdFZhbHVlczogbmV3IFZlY3Rvck4obmV3IEZsb2F0MzJBcnJheSgwKSksXG4gICAgICBpc1ZhcmlhYmxlTGVuZ3RoOiB0cnVlLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyB0aGUgYm9uZSBkYXRhIGluZm8gbWVtYmVyIChvbmUgdmVjNCBwZXIgY29tcG9uZW50KS5cbiAgICovXG4gIHN0YXRpYyBfcmVnaXN0ZXJCb25lRGF0YUluZm9NZW1iZXIoKSB7XG4gICAgU2tlbGV0YWxDb21wb25lbnQucmVnaXN0ZXJNZW1iZXIoe1xuICAgICAgYnVmZmVyVXNlOiBCdWZmZXJVc2UuR1BVSW5zdGFuY2VEYXRhLFxuICAgICAgbWVtYmVyTmFtZTogJ2JvbmVEYXRhSW5mbycsXG4gICAgICBkYXRhQ2xhc3NUeXBlOiBNdXRhYmxlVmVjdG9yNCxcbiAgICAgIHNoYWRlclR5cGU6IFNoYWRlclR5cGUuVmVydGV4U2hhZGVyLFxuICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVmVjNCxcbiAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICBpbml0VmFsdWVzOiBbMSwgMSwgMSwgQm9uZURhdGFUeXBlLlZlYzR4Mi5pbmRleF0sXG4gICAgfSk7XG4gICAgU2tlbGV0YWxDb21wb25lbnQucmVnaXN0ZXJNZW1iZXIoe1xuICAgICAgYnVmZmVyVXNlOiBCdWZmZXJVc2UuR1BVSW5zdGFuY2VEYXRhLFxuICAgICAgbWVtYmVyTmFtZTogJ3ByZXZpb3VzQm9uZURhdGFJbmZvJyxcbiAgICAgIGRhdGFDbGFzc1R5cGU6IE11dGFibGVWZWN0b3I0LFxuICAgICAgc2hhZGVyVHlwZTogU2hhZGVyVHlwZS5WZXJ0ZXhTaGFkZXIsXG4gICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWM0LFxuICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgIGluaXRWYWx1ZXM6IFsxLCAxLCAxLCAtMV0sXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2J1aWxkSm9pbnRMaXN0S2V5KGpvaW50czogU2NlbmVHcmFwaENvbXBvbmVudFtdKSB7XG4gICAgLy8gUHJlZmVyIGdsVEYgbm9kZSBpbmRpY2VzIChqb2ludEluZGV4KSBzbyBza2lucyBzaGFyaW5nIHRoZSBzYW1lIG5vZGUgbGlzdCBtYXAgdG8gdGhlIHNhbWUga2V5LlxuICAgIHJldHVybiBqb2ludHMubWFwKGpvaW50ID0+IChqb2ludC5qb2ludEluZGV4ID49IDAgPyBqb2ludC5qb2ludEluZGV4IDogLTEpKS5qb2luKCcsJyk7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2hhc2hCeXRlcyh1aW50OEFycmF5OiBVaW50OEFycmF5KSB7XG4gICAgbGV0IGhhc2ggPSAweDgxMWM5ZGM1O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdWludDhBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgaGFzaCBePSB1aW50OEFycmF5W2ldO1xuICAgICAgaGFzaCArPSAoaGFzaCA8PCAxKSArIChoYXNoIDw8IDQpICsgKGhhc2ggPDwgNykgKyAoaGFzaCA8PCA4KSArIChoYXNoIDw8IDI0KTtcbiAgICAgIGhhc2ggPj4+PSAwO1xuICAgIH1cbiAgICByZXR1cm4gaGFzaCA+Pj4gMDtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0QWNjZXNzb3JTaWduYXR1cmUoYWNjZXNzb3I6IEFjY2Vzc29yKSB7XG4gICAgY29uc3QgY2FjaGVkID0gdGhpcy5fX2FjY2Vzc29yU2lnbmF0dXJlQ2FjaGUuZ2V0KGFjY2Vzc29yKTtcbiAgICBpZiAoY2FjaGVkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBjYWNoZWQ7XG4gICAgfVxuXG4gICAgY29uc3QgdHlwZWRBcnJheSA9IGFjY2Vzc29yLmdldFR5cGVkQXJyYXkoKTtcbiAgICBjb25zdCB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkodHlwZWRBcnJheS5idWZmZXIsIHR5cGVkQXJyYXkuYnl0ZU9mZnNldCwgdHlwZWRBcnJheS5ieXRlTGVuZ3RoKTtcbiAgICBjb25zdCBoYXNoID0gdGhpcy5fX2hhc2hCeXRlcyh2aWV3KTtcbiAgICAvLyBjb25zdCBzaWduYXR1cmUgPSBbXG4gICAgLy8gdHlwZWRBcnJheS5ieXRlTGVuZ3RoLFxuICAgIC8vIGhhc2gudG9TdHJpbmcoMTYpLFxuICAgIC8vIGFjY2Vzc29yLmNvbXBvbmVudFR5cGUudmFsdWVPZigpLFxuICAgIC8vIGFjY2Vzc29yLmNvbXBvc2l0aW9uVHlwZS52YWx1ZU9mKCksXG4gICAgLy8gYWNjZXNzb3IuYnl0ZVN0cmlkZSxcbiAgICAvLyBdLmpvaW4oJzonKTtcbiAgICBjb25zdCBzaWduYXR1cmUgPSBoYXNoLnRvU3RyaW5nKDE2KTtcbiAgICB0aGlzLl9fYWNjZXNzb3JTaWduYXR1cmVDYWNoZS5zZXQoYWNjZXNzb3IsIHNpZ25hdHVyZSk7XG4gICAgcmV0dXJuIHNpZ25hdHVyZTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0QmluZFNoYXBlU2lnbmF0dXJlKGJpbmRTaGFwZU1hdHJpeD86IE1hdHJpeDQ0KSB7XG4gICAgaWYgKCFiaW5kU2hhcGVNYXRyaXgpIHtcbiAgICAgIHJldHVybiAnbm9fYmluZF9zaGFwZSc7XG4gICAgfVxuICAgIGNvbnN0IGNhY2hlZCA9IHRoaXMuX19iaW5kU2hhcGVTaWduYXR1cmVNYXAuZ2V0KGJpbmRTaGFwZU1hdHJpeCk7XG4gICAgaWYgKGNhY2hlZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gY2FjaGVkO1xuICAgIH1cbiAgICBjb25zdCBzaWduYXR1cmUgPSBBcnJheS5mcm9tKGJpbmRTaGFwZU1hdHJpeC5fdikuam9pbignLCcpO1xuICAgIHRoaXMuX19iaW5kU2hhcGVTaWduYXR1cmVNYXAuc2V0KGJpbmRTaGFwZU1hdHJpeCwgc2lnbmF0dXJlKTtcbiAgICByZXR1cm4gc2lnbmF0dXJlO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2dldEFuaW1hdGlvblRyYWNrRmVhdHVyZUhhc2goKTogbnVtYmVyIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAodGhpcy5lbnRpdHkucGFyZW50ID09IG51bGwpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9fZmluZEFuaW1hdGlvblRyYWNrRmVhdHVyZUhhc2godGhpcy5lbnRpdHkucGFyZW50LmVudGl0eSk7XG4gIH1cblxuICBwcml2YXRlIF9fZmluZEFuaW1hdGlvblRyYWNrRmVhdHVyZUhhc2godGFyZ2V0OiBJU2NlbmVHcmFwaEVudGl0eSk6IG51bWJlciB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgaGFzaGVzOiBudW1iZXJbXSA9IFtdO1xuICAgIGNvbnN0IGNvbGxlY3RIYXNoZXMgPSAoZW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eSkgPT4ge1xuICAgICAgY29uc3QgYW5pbWF0aW9uQ29tcG9uZW50ID0gZW50aXR5LnRyeVRvR2V0QW5pbWF0aW9uKCk7XG4gICAgICBpZiAoYW5pbWF0aW9uQ29tcG9uZW50ICE9IG51bGwpIHtcbiAgICAgICAgY29uc3QgYW5pbWF0aW9uQ2hhbm5lbHMgPSBhbmltYXRpb25Db21wb25lbnQuZ2V0QW5pbWF0aW9uQ2hhbm5lbHNPZlRyYWNrKCk7XG4gICAgICAgIGlmIChhbmltYXRpb25DaGFubmVscy5zaXplID4gMCkge1xuICAgICAgICAgIGNvbnN0IGNvbXBvbmVudEhhc2hlcyA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuICAgICAgICAgIGNvbnN0IGFjdGl2ZVRyYWNrTmFtZSA9IGFuaW1hdGlvbkNvbXBvbmVudC5nZXRBY3RpdmVBbmltYXRpb25UcmFjaygpO1xuICAgICAgICAgIGNvbnN0IGhhc0V4cHJlc3Npb25DaGFubmVsID0gQXJyYXkuZnJvbShhbmltYXRpb25DaGFubmVscy5rZXlzKCkpLnNvbWUocGF0aE5hbWUgPT5cbiAgICAgICAgICAgIHBhdGhOYW1lLnN0YXJ0c1dpdGgoJ3ZybUV4cHJlc3Npb24vJylcbiAgICAgICAgICApO1xuICAgICAgICAgIGxldCBoYXNOb25FeHByZXNzaW9uQ2hhbm5lbEZvckFjdGl2ZVRyYWNrID0gZmFsc2U7XG4gICAgICAgICAgZm9yIChjb25zdCBbcGF0aE5hbWUsIGNoYW5uZWxdIG9mIGFuaW1hdGlvbkNoYW5uZWxzKSB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICFwYXRoTmFtZS5zdGFydHNXaXRoKCd2cm1FeHByZXNzaW9uLycpICYmXG4gICAgICAgICAgICAgIGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZS5nZXRBbGxUcmFja05hbWVzKCkuaW5jbHVkZXMoYWN0aXZlVHJhY2tOYW1lKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGhhc05vbkV4cHJlc3Npb25DaGFubmVsRm9yQWN0aXZlVHJhY2sgPSB0cnVlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGhhc05vbkV4cHJlc3Npb25DaGFubmVsRm9yQWN0aXZlVHJhY2spIHtcbiAgICAgICAgICAgIGNvbnN0IGhhc2ggPSBhbmltYXRpb25Db21wb25lbnQuY3VycmVudFRyYWNrRmVhdHVyZUhhc2goKTtcbiAgICAgICAgICAgIGlmIChoYXNoICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgY29tcG9uZW50SGFzaGVzLmFkZChoYXNoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGNvbXBvbmVudEhhc2hlcy5zaXplID09PSAwICYmICFoYXNFeHByZXNzaW9uQ2hhbm5lbCkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBbcGF0aE5hbWUsIGNoYW5uZWxdIG9mIGFuaW1hdGlvbkNoYW5uZWxzKSB7XG4gICAgICAgICAgICAgIGlmIChwYXRoTmFtZS5zdGFydHNXaXRoKCd2cm1FeHByZXNzaW9uLycpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29uc3QgZXZhbHVhdGVkVHJhY2tOYW1lID0gY2hhbm5lbC5hbmltYXRlZFZhbHVlLmdldEZpcnN0QWN0aXZlQW5pbWF0aW9uU2FtcGxlclRyYWNrTmFtZSgpO1xuICAgICAgICAgICAgICBjb25zdCBoYXNoID0gYW5pbWF0aW9uQ29tcG9uZW50LmdldEFuaW1hdGlvblRyYWNrRmVhdHVyZUhhc2goZXZhbHVhdGVkVHJhY2tOYW1lKTtcbiAgICAgICAgICAgICAgaWYgKGhhc2ggIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudEhhc2hlcy5hZGQoaGFzaCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yIChjb25zdCBoYXNoIG9mIGNvbXBvbmVudEhhc2hlcykge1xuICAgICAgICAgICAgaGFzaGVzLnB1c2goaGFzaCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGVudGl0eS5jaGlsZHJlbikge1xuICAgICAgICBjb2xsZWN0SGFzaGVzKGNoaWxkLmVudGl0eSk7XG4gICAgICB9XG4gICAgfTtcbiAgICBjb2xsZWN0SGFzaGVzKHRhcmdldCk7XG5cbiAgICBpZiAoaGFzaGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKGhhc2hlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgIHJldHVybiBoYXNoZXNbMF07XG4gICAgfVxuXG4gICAgcmV0dXJuIERhdGFVdGlsLnRvQ1JDMzIoaGFzaGVzLmpvaW4oJ3wnKSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgc2tpbm5pbmcgY2FjaGUga2V5IG9ubHkgd2hlbiBhbmltYXRpb24gYmluZGluZ3Mgb3IgdGhlIHNjZW5lIGdyYXBoIGhpZXJhcmNoeVxuICAgKiBtYXkgaGF2ZSBjaGFuZ2VkIHNpbmNlIHRoZSBrZXkgd2FzIGxhc3QgY29tcHV0ZWQuXG4gICAqIFNlYXJjaGluZyBhbmltYXRpb24gdHJhY2sgZmVhdHVyZSBoYXNoZXMgd2Fsa3MgdGhlIHdob2xlIG1vZGVsIGhpZXJhcmNoeSwgc28gZG9pbmcgaXRcbiAgICogZXZlcnkgZnJhbWUgZm9yIGV2ZXJ5IFNrZWxldGFsQ29tcG9uZW50IGlzIHRvbyBleHBlbnNpdmUgd2hlbiBtYW55IG1vZGVscyBhcmUgYW5pbWF0ZWQuXG4gICAqIE90aGVyIGlucHV0cyBvZiB0aGUga2V5IChqb2ludHMsIGludmVyc2UgYmluZCBtYXRyaWNlcywgYm9uZSBkYXRhIHR5cGUpIHVwZGF0ZSB0aGUga2V5XG4gICAqIGltbWVkaWF0ZWx5IGluIHRoZWlyIHNldHRlcnMuXG4gICAqL1xuICBwcml2YXRlIF9fdXBkYXRlU2tpbkNhY2hlS2V5SWZOZWVkZWQoKSB7XG4gICAgaWYgKFxuICAgICAgdGhpcy5fX3NraW5DYWNoZUtleUFuaW1hdGlvbkJpbmRpbmdWZXJzaW9uID09PSBBbmltYXRpb25TdGF0ZVJlcG9zaXRvcnkuZ2V0QW5pbWF0aW9uQmluZGluZ1ZlcnNpb24oKSAmJlxuICAgICAgdGhpcy5fX3NraW5DYWNoZUtleUhpZXJhcmNoeVZlcnNpb24gPT09IFNjZW5lR3JhcGhDb21wb25lbnQuaGllcmFyY2h5VmVyc2lvblxuICAgICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9fdXBkYXRlU2tpbkNhY2hlS2V5KCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgc2tpbm5pbmcgY2FjaGUga2V5IGJhc2VkIG9uIGN1cnJlbnQgYW5pbWF0aW9uIHN0YXRlLlxuICAgKlxuICAgKiBUaGUgY2FjaGUga2V5IGRldGVybWluZXMgd2hpY2ggU2tlbGV0YWxDb21wb25lbnRzIGNhbiBzaGFyZSBza2lubmluZyByZXN1bHRzOlxuICAgKlxuICAgKiAjIyBXaXRoIEFuaW1hdGlvbiBBcHBsaWVkXG4gICAqIC0gVXNlcyBmb3JtYXQ6IGBhbmltfHthbmltYXRpb25IYXNofXx7aW52ZXJzZUJpbmRNYXRyaWNlc1NpZ25hdHVyZX18e2pvaW50TGlzdEtleX1gXG4gICAqIC0gYW5pbWF0aW9uSGFzaCBpcyBjb21wdXRlZCBmcm9tIGFuaW1hdGlvbiB0cmFjayBmZWF0dXJlcyAoa2V5ZnJhbWVzLCB0aW1pbmdzLCBldGMuKVxuICAgKiAtIGludmVyc2VCaW5kTWF0cmljZXNTaWduYXR1cmUgZW5zdXJlcyBtb2RlbHMgd2l0aCBkaWZmZXJlbnQgYm9uZSBzdHJ1Y3R1cmVzIGRvbid0IHNoYXJlIGNhY2hlXG4gICAqIC0gam9pbnRMaXN0S2V5IGVuc3VyZXMgcmVjdXJzaXZlbHkgbmVzdGVkIGNoYWlucyB0aGF0IHNoYXJlIGxvY2FsIHRyYWNrcy9iaW5kIG1hdHJpY2VzXG4gICAqICAgYnV0IGhhdmUgZGlmZmVyZW50IGpvaW50IG5vZGVzIChkaWZmZXJlbnQgcGFyZW50IHRyYW5zZm9ybXMpIGRvbid0IHNoYXJlIHJlc3VsdHNcbiAgICogLSBPbmx5IG1vZGVscyB3aXRoIHRoZSBzYW1lIGFuaW1hdGlvbiwgYmluZCBtYXRyaWNlcyBhbmQgam9pbnQgaGllcmFyY2h5IGNhbiBzaGFyZVxuICAgKiAgIHNraW5uaW5nIHJlc3VsdHNcbiAgICpcbiAgICogIyMgV2l0aG91dCBBbmltYXRpb25cbiAgICogLSBVc2VzIGZvcm1hdDogYHtqb2ludExpc3RLZXl9fHthY2Nlc3NvclNpZ25hdHVyZX18bm9fYW5pbWF0aW9uYFxuICAgKiAtIEVudGl0eVVJRC1iYXNlZCBrZXkgcHJldmVudHMgaW5jb3JyZWN0IHNoYXJpbmcgYmV0d2VlbiB1bnJlbGF0ZWQgbW9kZWxzXG4gICAqIC0gRWFjaCBtb2RlbCBtYWludGFpbnMgaXRzIG93biBjYWNoZVxuICAgKi9cbiAgcHJpdmF0ZSBfX3VwZGF0ZVNraW5DYWNoZUtleSgpIHtcbiAgICB0aGlzLl9fc2tpbkNhY2hlS2V5QW5pbWF0aW9uQmluZGluZ1ZlcnNpb24gPSBBbmltYXRpb25TdGF0ZVJlcG9zaXRvcnkuZ2V0QW5pbWF0aW9uQmluZGluZ1ZlcnNpb24oKTtcbiAgICB0aGlzLl9fc2tpbkNhY2hlS2V5SGllcmFyY2h5VmVyc2lvbiA9IFNjZW5lR3JhcGhDb21wb25lbnQuaGllcmFyY2h5VmVyc2lvbjtcblxuICAgIGlmICghdGhpcy5fX2ludmVyc2VCaW5kTWF0cmljZXNBY2Nlc3Nvcikge1xuICAgICAgdGhpcy5fX3NraW5DYWNoZUtleSA9IHVuZGVmaW5lZDtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBFbnN1cmUgaW52ZXJzZUJpbmRNYXRyaWNlc1NpZ25hdHVyZSBpcyBjb21wdXRlZFxuICAgIGlmICghdGhpcy5fX2ludmVyc2VCaW5kTWF0cmljZXNTaWduYXR1cmUpIHtcbiAgICAgIHRoaXMuX19pbnZlcnNlQmluZE1hdHJpY2VzU2lnbmF0dXJlID0gU2tlbGV0YWxDb21wb25lbnQuX19nZXRBY2Nlc3NvclNpZ25hdHVyZShcbiAgICAgICAgdGhpcy5fX2ludmVyc2VCaW5kTWF0cmljZXNBY2Nlc3NvclxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBhbmltYXRpb25UcmFja0ZlYXR1cmVIYXNoID0gdGhpcy5fX2dldEFuaW1hdGlvblRyYWNrRmVhdHVyZUhhc2goKTtcbiAgICAvLyBDb21wb25lbnRzIHdpdGggZGlmZmVyZW50IGJvbmUgZGF0YSBsYXlvdXRzIG11c3Qgbm90IHNoYXJlIHNraW5uaW5nIHJlc3VsdHNcbiAgICBjb25zdCBib25lRGF0YVR5cGVJbmRleCA9ICh0aGlzLl9fYWxsb2NhdGVkQm9uZURhdGFUeXBlID8/IHRoaXMuYm9uZURhdGFUeXBlKS5pbmRleDtcblxuICAgIGlmIChhbmltYXRpb25UcmFja0ZlYXR1cmVIYXNoICE9IG51bGwpIHtcbiAgICAgIC8vIEFuaW1hdGlvbiBpcyBhcHBsaWVkLiBUaGUgYW5pbWF0aW9uIGhhc2ggYW5kIGludmVyc2VCaW5kTWF0cmljZXMgc2lnbmF0dXJlIGFsb25lXG4gICAgICAvLyBhcmUgbm90IGVub3VnaCB0byBpZGVudGlmeSBpbnRlcmNoYW5nZWFibGUgc2tlbGV0b25zOiByZWN1cnNpdmVseSBuZXN0ZWQgY2hhaW5zXG4gICAgICAvLyAoZS5nLiB0aGUgUmVjdXJzaXZlU2tlbGV0b25zIHNhbXBsZSkgc2hhcmUgdGhlIHNhbWUgbG9jYWwgdHJhY2sgc3RydWN0dXJlIGFuZFxuICAgICAgLy8gYmluZCBtYXRyaWNlcyB3aGlsZSBsaXZpbmcgdW5kZXIgZGlmZmVyZW50IHBhcmVudCB0cmFuc2Zvcm1zLCBzbyB0aGVpciBza2lubmVkXG4gICAgICAvLyByZXN1bHRzIGRpZmZlci4gSW5jbHVkZSB0aGUgam9pbnQgbGlzdCBrZXkgc28gb25seSBpZGVudGljYWwgam9pbnQgaGllcmFyY2hpZXNcbiAgICAgIC8vIChzYW1lIGdsVEYgbm9kZSBpbmRpY2VzKSBzaGFyZSB0aGUgbGVhZGVyJ3MgYm9uZSBkYXRhLlxuICAgICAgdGhpcy5fX3NraW5DYWNoZUtleSA9IGBhbmltfCR7YW5pbWF0aW9uVHJhY2tGZWF0dXJlSGFzaC50b1N0cmluZygpfXwke3RoaXMuX19pbnZlcnNlQmluZE1hdHJpY2VzU2lnbmF0dXJlfXwke1xuICAgICAgICB0aGlzLl9fam9pbnRMaXN0S2V5ID8/ICcnXG4gICAgICB9fCR7Ym9uZURhdGFUeXBlSW5kZXh9YDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTm8gYW5pbWF0aW9uIC0gdXNlIGRldGFpbGVkIEVudGl0eVVJRC1iYXNlZCBjYWNoZSBrZXlcbiAgICAgIC8vIFRoaXMgcHJldmVudHMgaW5jb3JyZWN0IGNhY2hlIHNoYXJpbmcgYmV0d2VlbiB1bnJlbGF0ZWQgc3RhdGljIG1vZGVsc1xuICAgICAgaWYgKCF0aGlzLl9fam9pbnRMaXN0S2V5KSB7XG4gICAgICAgIHRoaXMuX19za2luQ2FjaGVLZXkgPSB1bmRlZmluZWQ7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMuX19za2luQ2FjaGVLZXkgPSBgJHt0aGlzLl9fam9pbnRMaXN0S2V5fXwke3RoaXMuX19pbnZlcnNlQmluZE1hdHJpY2VzU2lnbmF0dXJlfXxub19hbmltYXRpb258JHtib25lRGF0YVR5cGVJbmRleH1gO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEcm9wcyB0aGUgbWVtb2l6ZWQgc2tpbm5pbmcgaW5wdXQgc2lnbmF0dXJlIHNvIHRoZSBuZXh0ICRsb2dpYyByZWNvbXB1dGVzIHNraW5uaW5nLlxuICAgKi9cbiAgcHJpdmF0ZSBfX2ludmFsaWRhdGVTa2luQ29tcHV0ZVNpZ25hdHVyZSgpIHtcbiAgICB0aGlzLl9faGFzU2tpbkNvbXB1dGVTaWduYXR1cmUgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRydWUgd2hlbiBldmVyeSBpbnB1dCB0aGF0IGFmZmVjdHMgdGhlIGJvbmUgZGF0YSBpcyBpZGVudGljYWwgdG8gdGhlIGxhc3QgY29tcHV0YXRpb24uXG4gICAqXG4gICAqIFRoZSBqb2ludCB2ZXJzaW9uIHN1bSB3b3JrcyBhcyBhIGNoYW5nZSBkZXRlY3RvciBiZWNhdXNlIGB3b3JsZE1hdHJpeFZlcnNpb25gIG9ubHkgaW5jcmVhc2VzOlxuICAgKiBpZiBhbnkgam9pbnQgKG9yIHRoZSBza2lubmVkIG5vZGUpIHdhcyBtYXJrZWQgZGlydHksIHRoZSBzdW0gbmVjZXNzYXJpbHkgZGlmZmVycy5cbiAgICpcbiAgICogQ29uc3RyYWludDogbGlrZSB0aGUgd29ybGQgbWF0cml4IGNhY2hlIGl0c2VsZiwgdGhpcyBzaWduYXR1cmUgb25seSBvYnNlcnZlcyBjaGFuZ2VzIG1hZGVcbiAgICogdGhyb3VnaCB0aGUgdHJhbnNmb3JtL3JlbmRlcmVyIEFQSXMuIFdyaXRpbmcgYG1hdHJpeElubmVyYCBkaXJlY3RseSBvciBtdXRhdGluZ1xuICAgKiBgX2JpbmRTaGFwZU1hdHJpeGAgaW4gcGxhY2UgaXMgbm90IGRldGVjdGVkOyBjYWxsZXJzIG11c3QgaW52YWxpZGF0ZSB0aHJvdWdoIHRoZSBzZXR0ZXJzLlxuICAgKlxuICAgKiBAcGFyYW0gY2FjaGVLZXkgLSBUaGUgY3VycmVudCBza2lubmluZyBjYWNoZSBrZXlcbiAgICogQHJldHVybnMgVHJ1ZSB3aGVuIHRoZSBza2lubmluZyBsb29wIGNhbiBiZSBza2lwcGVkXG4gICAqL1xuICBwcml2YXRlIF9faXNTa2luQ29tcHV0ZUlucHV0VW5jaGFuZ2VkKGNhY2hlS2V5OiBzdHJpbmcgfCB1bmRlZmluZWQpOiBib29sZWFuIHtcbiAgICBpZiAoIXRoaXMuX19oYXNTa2luQ29tcHV0ZVNpZ25hdHVyZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5fX2xhc3RTa2luQ29tcHV0ZUNhY2hlS2V5ICE9PSBjYWNoZUtleSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5fX2xhc3RTa2luQ29tcHV0ZUJpbmRTaGFwZU1hdHJpeCAhPT0gdGhpcy5fYmluZFNoYXBlTWF0cml4KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IGVudGl0eVNjZW5lR3JhcGggPSB0aGlzLmVudGl0eS5nZXRTY2VuZUdyYXBoKCk7XG4gICAgaWYgKGVudGl0eVNjZW5lR3JhcGggPT0gbnVsbCB8fCBlbnRpdHlTY2VuZUdyYXBoLndvcmxkTWF0cml4VmVyc2lvbiAhPT0gdGhpcy5fX2xhc3RTa2luQ29tcHV0ZU93blZlcnNpb24pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgbGV0IGpvaW50VmVyc2lvblN1bSA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9fam9pbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBqb2ludFZlcnNpb25TdW0gKz0gdGhpcy5fX2pvaW50c1tpXS53b3JsZE1hdHJpeFZlcnNpb247XG4gICAgfVxuICAgIHJldHVybiBqb2ludFZlcnNpb25TdW0gPT09IHRoaXMuX19sYXN0U2tpbkNvbXB1dGVKb2ludFZlcnNpb25TdW07XG4gIH1cblxuICAvKipcbiAgICogUmVjb3JkcyB0aGUgaW5wdXRzIHRoYXQgcHJvZHVjZWQgdGhlIGN1cnJlbnQgYm9uZSBkYXRhLlxuICAgKiBAcGFyYW0gY2FjaGVLZXkgLSBUaGUgc2tpbm5pbmcgY2FjaGUga2V5IHVzZWQgZm9yIHRoaXMgY29tcHV0YXRpb25cbiAgICovXG4gIHByaXZhdGUgX19yZWNvcmRTa2luQ29tcHV0ZVNpZ25hdHVyZShjYWNoZUtleTogc3RyaW5nIHwgdW5kZWZpbmVkKSB7XG4gICAgbGV0IGpvaW50VmVyc2lvblN1bSA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9fam9pbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBqb2ludFZlcnNpb25TdW0gKz0gdGhpcy5fX2pvaW50c1tpXS53b3JsZE1hdHJpeFZlcnNpb247XG4gICAgfVxuICAgIHRoaXMuX19sYXN0U2tpbkNvbXB1dGVDYWNoZUtleSA9IGNhY2hlS2V5O1xuICAgIHRoaXMuX19sYXN0U2tpbkNvbXB1dGVKb2ludFZlcnNpb25TdW0gPSBqb2ludFZlcnNpb25TdW07XG4gICAgdGhpcy5fX2xhc3RTa2luQ29tcHV0ZU93blZlcnNpb24gPSB0aGlzLmVudGl0eS5nZXRTY2VuZUdyYXBoKCk/LndvcmxkTWF0cml4VmVyc2lvbiA/PyAtMTtcbiAgICB0aGlzLl9fbGFzdFNraW5Db21wdXRlQmluZFNoYXBlTWF0cml4ID0gdGhpcy5fYmluZFNoYXBlTWF0cml4O1xuICAgIHRoaXMuX19oYXNTa2luQ29tcHV0ZVNpZ25hdHVyZSA9IHRydWU7XG4gIH1cblxuICBwcml2YXRlIF9fY3JlYXRlU2tpbm5pbmdDYWNoZShwcm9jZXNzRnJhbWVUb2tlbjogbnVtYmVyKTogU2tpbm5pbmdDYWNoZSB7XG4gICAgY29uc3QgaW5mbyA9IHRoaXMuX2JvbmVEYXRhSW5mby5fdjtcbiAgICByZXR1cm4ge1xuICAgICAgcHJvY2Vzc0ZyYW1lVG9rZW4sXG4gICAgICBib25lRGF0YTogdGhpcy5fYm9uZURhdGEuaXNEdW1teSgpID8gdW5kZWZpbmVkIDogdGhpcy5fYm9uZURhdGEuX3YsXG4gICAgICBib25lRGF0YUluZm86IFtpbmZvWzBdLCBpbmZvWzFdLCBpbmZvWzJdLCBpbmZvWzNdXSxcbiAgICAgIGpvaW50TWF0cml4OiB0aGlzLl9fam9pbnRNYXRyaXguX3YsXG4gICAgICBpc1dvcmxkTWF0cml4VmFuaWxsYTogdGhpcy5fX2lzV29ybGRNYXRyaXhWYW5pbGxhLFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIF9fYXBwbHlTa2lubmluZ0NhY2hlKGNhY2hlOiBTa2lubmluZ0NhY2hlKSB7XG4gICAgdGhpcy5fX2lzV29ybGRNYXRyaXhWYW5pbGxhID0gY2FjaGUuaXNXb3JsZE1hdHJpeFZhbmlsbGE7XG4gICAgdGhpcy5fX2pvaW50TWF0cml4Ll92LnNldChjYWNoZS5qb2ludE1hdHJpeCk7XG4gICAgaWYgKGNhY2hlLmJvbmVEYXRhID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gVGhlIGNhY2hlIGtleSBjb250YWlucyB0aGUgYm9uZSBkYXRhIHR5cGUsIHNvIHRoZSBsYXlvdXQgaXMgdGhlIHNhbWUgYXMgdGhpcyBjb21wb25lbnQncy5cbiAgICBjb25zdCBkYXRhQ291bnQgPSB0aGlzLl9fam9pbnRzLmxlbmd0aCAqIEJvbmVEYXRhVHlwZS5nZXRWZWM0Q291bnRQZXJKb2ludCh0aGlzLl9fYWxsb2NhdGVkQm9uZURhdGFUeXBlISkgKiA0O1xuICAgIHRoaXMuX2JvbmVEYXRhLl92LnNldChjYWNoZS5ib25lRGF0YS5zdWJhcnJheSgwLCBNYXRoLm1pbihkYXRhQ291bnQsIHRoaXMuX2JvbmVEYXRhLl92Lmxlbmd0aCkpKTtcbiAgICBpZiAoIXRoaXMuX2JvbmVEYXRhSW5mby5pc0R1bW15KCkpIHtcbiAgICAgIHRoaXMuX2JvbmVEYXRhSW5mby5fdi5zZXQoY2FjaGUuYm9uZURhdGFJbmZvKTtcbiAgICB9XG4gIH1cbn1cblxuLy8gUmVnaXN0ZXIgR1BVIG1lbWJlcnMuIFRoZSBzaXplIG9mICdib25lRGF0YScgaXMgZGVjaWRlZCBwZXIgY29tcG9uZW50IGluIHNldEpvaW50cygpLlxuU2tlbGV0YWxDb21wb25lbnQuX3JlZ2lzdGVyQm9uZURhdGFNZW1iZXIoKTtcblNrZWxldGFsQ29tcG9uZW50Ll9yZWdpc3RlckJvbmVEYXRhSW5mb01lbWJlcigpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsaUJBQWlCO0FBRTFCLFNBQVMsbUJBQTBDO0FBQ25ELFNBQVMsb0JBQTJDO0FBQ3BELFNBQVMsaUJBQWlCO0FBQzFCLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsb0JBQW9CO0FBQzdCLFNBQVMsa0JBQWtCO0FBRzNCLFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMseUJBQXlCO0FBQ2xDLFNBQVMsc0JBQXNCO0FBQy9CLFNBQVMsZUFBZTtBQUV4QixTQUFTLFVBQVUsVUFBVTtBQUU3QixTQUFTLGdDQUFnQztBQUV6QyxTQUFTLDJCQUEyQjtBQUNwQyxTQUFTLDhCQUE4QjtBQWN2QyxJQUFNLDRCQUE0QjtBQU8zQixJQUFNLHFCQUFOLE1B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QUFjLEdBQUcsSUFBSSxNQUFNLFlBQVk7QUFBQSxJQUM5QztBQUFBLEVBQ0Y7QUFDRjtBQXAzQ2EsbUJBeURJb0IsS0FBcUQsb0JBQUksSUFBSTtBQXpEakUsbUJBMERJa0IsS0FBc0Qsb0JBQUksUUFBUTtBQTFEdEUsbUJBMkRJRSxLQUFxRCxvQkFBSSxRQUFRO0FBM0RyRSxtQkE2RUlwQyxLQUFzQjtBQTdFMUIsbUJBOEVJc0IsS0FBYSxnQkFBZ0IsU0FBUztBQTlFMUMsbUJBK0VJTyxLQUE2QixrQkFBa0IsVUFBVSxHQUFHLEdBQUcsR0FBRyxDQUFDO0FBL0V2RSxtQkFnRklSLEtBQWUsZ0JBQWdCLFNBQVM7QUFoRjVDLG1CQWlGSUUsS0FBZSxnQkFBZ0IsU0FBUztBQWpGNUMsbUJBa0ZJVCxLQUFlLGdCQUFnQixTQUFTO0FBbEZsRCxJQUFNLG9CQUFOO0FBdTNDUCxrQkFBa0Isd0JBQXdCO0FBQzFDLGtCQUFrQiw0QkFBNEI7IiwKICAibmFtZXMiOiBbIl9fam9pbnRzIiwgIl9faXNQcmV2aW91c0JvbmVEYXRhRW5hYmxlZCIsICJfX2JvbmVEYXRhVHlwZSIsICJfX2lzQm9uZURhdGFUeXBlQXV0b1NlbGVjdGVkIiwgIl9faGFzV2FybmVkTm9uVW5pZm9ybVNjYWxlIiwgIl9fYm9uZURhdGFBcnJheUxlbmd0aCIsICJfX2JvbmVUcmFuc2xhdGVTY2FsZVdvcmsiLCAiX19qb2ludE1hdHJpeCIsICJfX2lzV29ybGRNYXRyaXhWYW5pbGxhIiwgIl9fc2tpbkNhY2hlS2V5QW5pbWF0aW9uQmluZGluZ1ZlcnNpb24iLCAiX19za2luQ2FjaGVLZXlIaWVyYXJjaHlWZXJzaW9uIiwgIl9faGFzU2tpbkNvbXB1dGVTaWduYXR1cmUiLCAiX19sYXN0U2tpbkNvbXB1dGVKb2ludFZlcnNpb25TdW0iLCAiX19sYXN0U2tpbkNvbXB1dGVPd25WZXJzaW9uIiwgIl9fcmVzZXRCb25lRGF0YUJ1ZmZlcnMiLCAiX19qb2ludE1hdHJpY2VzIiwgIl9fYWxsb2NhdGVkQm9uZURhdGFUeXBlIiwgIl9fam9pbnRMaXN0S2V5IiwgIl9fc2tpbkNhY2hlS2V5IiwgIl9faW52ZXJzZUJpbmRNYXRyaWNlc1NpZ25hdHVyZSIsICJfX3Rvb2tHbG9iYWxEYXRhTnVtIiwgIl9fYm9uZURhdGFVaW50MzIiLCAiX19yZXNldFByZXZpb3VzQm9uZURhdGEiLCAiX19pbnZhbGlkYXRlUHJldmlvdXNCb25lRGF0YSIsICJfX2ludmVyc2VCaW5kTWF0cmljZXNBY2Nlc3NvciIsICJfX2dldEFjY2Vzc29yU2lnbmF0dXJlIiwgIl9fdXBkYXRlU2tpbkNhY2hlS2V5IiwgIl9faW52YWxpZGF0ZVNraW5Db21wdXRlU2lnbmF0dXJlIiwgIl9fYnVpbGRKb2ludExpc3RLZXkiLCAiX19jYWxjQm9uZURhdGFBcnJheUxlbmd0aCIsICJfX2lzUmVVc2UiLCAiX19lbmdpbmUiLCAiX19zZXRCb25lRGF0YUluZm8iLCAiX19lbnN1cmVCb25lRGF0YUxheW91dCIsICJfX3RtcF9tYXQ0XzQiLCAiX191cGRhdGVTa2luQ2FjaGVLZXlJZk5lZWRlZCIsICJfX3NraW5DYWxjdWxhdGlvbkNhY2hlIiwgIl9fYXBwbHlTa2lubmluZ0NhY2hlIiwgIl9faXNTa2luQ29tcHV0ZUlucHV0VW5jaGFuZ2VkIiwgIl9fY3JlYXRlU2tpbm5pbmdDYWNoZSIsICJfX2dldFRyYW5zbGF0ZVNjYWxlV29yayIsICJfX3RtcF9tYXQ0XzIiLCAiX190bXBfbWF0NCIsICJfX3RtcF9tYXQ0XzMiLCAiX19jb3B5VG9NYXRBcnJheSIsICJfX2RldGVybWluYW50M3gzIiwgIl9fZXh0cmFjdFJvdGF0aW9uIiwgIl9faGFuZGxlTm9uVW5pZm9ybVNjYWxlT2ZWZWM0eDEiLCAiX19yZWNvcmRTa2luQ29tcHV0ZVNpZ25hdHVyZSIsICJfX3RtcF9xIiwgIl9fZ2V0Q29tcG9uZW50c1NoYXJpbmdTa2luQ2FjaGUiLCAiX19jb3B5Qm9uZUJ1ZmZlcnNGcm9tIiwgIl9fZW50aXR5VWlkIiwgIl9faGFzaEJ5dGVzIiwgIl9fYWNjZXNzb3JTaWduYXR1cmVDYWNoZSIsICJfX2dldEJpbmRTaGFwZVNpZ25hdHVyZSIsICJfX2JpbmRTaGFwZVNpZ25hdHVyZU1hcCIsICJfX2dldEFuaW1hdGlvblRyYWNrRmVhdHVyZUhhc2giLCAiX19maW5kQW5pbWF0aW9uVHJhY2tGZWF0dXJlSGFzaCIsICJfX2xhc3RTa2luQ29tcHV0ZUNhY2hlS2V5IiwgIl9fbGFzdFNraW5Db21wdXRlQmluZFNoYXBlTWF0cml4Il0KfQo=
