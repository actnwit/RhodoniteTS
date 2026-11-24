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
    this.Ug = [];
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
    this.ch = BoneDataType.Vec4x2;
    /** Whether __boneDataType was chosen automatically (an automatic Vec4x1 may be switched to Vec4x2) */
    this.dh = false;
    this.ih = false;
    this.fh = 0;
    this.gh = new Float32Array(0);
    this.Xg = MutableMatrix44.identity();
    this.$g = true;
    this._isCulled = false;
    // Versions of animation bindings and scene graph hierarchy used for the current __skinCacheKey (-1: not computed)
    this.kh = -1;
    this.lh = -1;
    /**
     * Memoized input signature of the last skinning computation. When the skin cache key, the joint
     * world matrices, the skinned node world matrix and the bind shape matrix are unchanged, the
     * whole skinning loop can be skipped and the previous bone data reused.
     */
    this.mh = false;
    this.rh = -1;
    this.sh = -1;
    this.moveStageTo(ProcessStage.Logic);
    if (isReUse) {
      this.uh();
      this.Xg = MutableMatrix44.identity();
      this.$g = true;
      this.Ug = [];
      this.ah = void 0;
      this.topOfJointsHierarchy = void 0;
      this._bindShapeMatrix = void 0;
      this.isSkinning = true;
      this.ch = BoneDataType.Vec4x2;
      this.dh = false;
      this.ih = false;
      this.Vg = void 0;
      this.fh = 0;
      this.Zg = void 0;
      this.Wg = void 0;
      this._g = void 0;
      this.kh = -1;
      this.lh = -1;
      return;
    }
    _SkeletalComponent.Bh++;
  }
  /**
   * Resets GPU-bound vector fields so they can be re-bound on reuse.
   * Clears any existing data to prevent contamination from previous models.
   */
  uh() {
    if (!this._boneData.isDummy()) {
      this._boneData._v.fill(0);
    }
    this._boneData = VectorN.dummy();
    this.hh = void 0;
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
    this.Yg = inverseBindMatricesAccessor;
    this._g = _SkeletalComponent.vh(inverseBindMatricesAccessor);
    this.eh();
  }
  /**
   * Sets the joint hierarchy for this skeletal component.
   * Initializes the appropriate data arrays based on the configured bone data type.
   *
   * @param joints - Array of SceneGraphComponents representing the joints/bones
   */
  setJoints(joints) {
    this.bh();
    this.Ug = joints;
    this.Zg = _SkeletalComponent.wh(joints);
    this.uh();
    const boneDataType = this.boneDataType;
    this.fh = _SkeletalComponent.Eh(boneDataType, joints.length);
    const isComponentReused = this.Rh;
    this.submitToAllocation(this.c.config.skeletalComponentCountPerBufferView, isComponentReused);
    this.hh = new Uint32Array(
      this._boneData._v.buffer,
      this._boneData._v.byteOffset,
      this._boneData._v.length
    );
    this.Vg = boneDataType;
    this.nh(1, 1, 1, boneDataType);
    this.eh();
  }
  /**
   * Gets the effective bone data type of this component.
   * If Config.boneDataType is set, it overrides the bone data type of each component.
   *
   * @returns The effective bone data type
   */
  get boneDataType() {
    var _a;
    return (_a = this.c.config.boneDataType) != null ? _a : this.ch;
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
    this.ch = boneDataType;
    this.dh = isAutoSelected;
    this.xh();
  }
  /**
   * Re-allocates the bone data if the effective bone data type differs from the allocated layout.
   */
  xh() {
    const boneDataType = this.boneDataType;
    if (this.Vg === void 0 || this.Vg === boneDataType) {
      return;
    }
    this.setJoints(this.Ug);
  }
  /**
   * Calculates the array length (in vec4) of the bone data.
   * The bone data is a variable-length member, so this is exact regardless of skeletalComponentCountPerBufferView.
   *
   * @param boneDataType - The bone data type
   * @param jointCount - The number of joints
   * @returns The array length in vec4
   */
  static Eh(boneDataType, jointCount) {
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
    return void 0;
  }
  nh(x, y, z, boneDataType) {
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
    this.bh();
    this.Ug = joints;
    this.Zg = _SkeletalComponent.wh(joints);
    this.eh();
  }
  /**
   * Gets a copy of the joints array.
   *
   * @returns A copy of the SceneGraphComponents representing the joints
   */
  getJoints() {
    return this.Ug.concat();
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
    return this.ah;
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
    return this.Xg.clone();
  }
  /**
   * Gets the internal world matrix (direct reference).
   *
   * @returns The internal world matrix
   */
  get worldMatrixInner() {
    return MutableMatrix44.multiplyTo(this.entity.matrixInner, this.Xg, _SkeletalComponent.Bg);
  }
  /**
   * Checks if the world matrix has been updated from its initial state.
   *
   * @returns True if the world matrix has been modified, false otherwise
   */
  get isWorldMatrixUpdated() {
    return !this.$g;
  }
  /**
   * Sets the visibility of the joint gizmo that visualizes skeletal joints.
   * @param flg - True to show the joint gizmo, false to hide it
   */
  set isJointGizmosVisible(flg) {
    for (let i = 0; i < this.Ug.length; i++) {
      this.Ug[i].isJointGizmoVisible = flg;
    }
  }
  /**
   * Gets the visibility state of the joint gizmo.
   * @returns True if the joint gizmo is visible, false otherwise
   */
  get isJointGizmosVisible() {
    for (let i = 0; i < this.Ug.length; i++) {
      if (this.Ug[i].isJointGizmoVisible) {
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
      this.bh();
      this.yh();
      if (this.Wg !== void 0) {
        AnimationStateRepository.addCulledSkeletonJoints(this.c, this.Wg, this.Ug);
      }
      return;
    }
    this.xh();
    this.yh();
    const cacheKey = this.Wg;
    const cacheLeaders = AnimationStateRepository.getOrCreateCacheLeaders(this.c);
    const leaderJointIndexToEntityUID = AnimationStateRepository.getOrCreateLeaderJointIndexToEntityUID(this.c);
    const currentFrameCachedEntityUIDs = AnimationStateRepository.getOrCreateCurrentFrameCachedEntityUIDs(
      this.c
    );
    if (cacheKey) {
      const cache = _SkeletalComponent.jh.get(cacheKey);
      if ((cache == null ? void 0 : cache.processFrameToken) === currentProcessFrameToken) {
        const isLeader = cacheLeaders.get(cacheKey) === this.entityUID;
        if (!isLeader) {
          for (const joint of this.Ug) {
            const leaderEntityUID = leaderJointIndexToEntityUID.get(joint.jointIndex);
            if (leaderEntityUID !== void 0 && leaderEntityUID !== joint.entityUID) {
              currentFrameCachedEntityUIDs.add(joint.entityUID);
            }
          }
        }
        this.Fh(cache);
        this.bh();
        return;
      }
      cacheLeaders.set(cacheKey, this.entityUID);
      for (const joint of this.Ug) {
        leaderJointIndexToEntityUID.set(joint.jointIndex, joint.entityUID);
      }
    }
    if (this.Gh(cacheKey)) {
      if (cacheKey) {
        _SkeletalComponent.jh.set(cacheKey, this.zh(currentProcessFrameToken));
      }
      return;
    }
    const boneDataType = this.Vg;
    const boneData = this._boneData._v;
    const boneDataUint32 = this.hh;
    const translateScaleWork = this.Hh(boneDataType);
    const inverseGlobalTransform = MutableMatrix44.invertTo(this.entity.matrixInner, _SkeletalComponent.Dh);
    let hasNonUniformScale = false;
    for (let i = 0; i < this.Ug.length; i++) {
      const joint = this.Ug[i];
      const globalJointTransform = joint.matrixInner;
      const jointMatrix = MutableMatrix44.multiplyTo(
        inverseGlobalTransform,
        MutableMatrix44.multiplyTypedArrayTo(
          globalJointTransform,
          this.Yg.getTypedArray(),
          _SkeletalComponent.eg,
          i
        ),
        _SkeletalComponent.ag
      );
      if (this._bindShapeMatrix) {
        jointMatrix.multiply(this._bindShapeMatrix);
      }
      const m = jointMatrix;
      if (i === 0 && joint.entity.tryToGetAnimation() != null) {
        this.Xg.copyComponents(m);
      }
      if (i === 1 && this.Ug[0].entity.tryToGetAnimation() == null) {
        this.Xg.copyComponents(m);
      }
      this.$g = false;
      if (boneDataType === BoneDataType.Mat43x1) {
        this.Ih(m, i);
        continue;
      }
      const v = m._v;
      const sx = Math.hypot(v[0], v[1], v[2]);
      const sy = Math.hypot(v[4], v[5], v[6]);
      const sz = Math.hypot(v[8], v[9], v[10]);
      const isMirrored = _SkeletalComponent.Jh(v) < 0;
      if (boneDataType === BoneDataType.Vec4x2) {
        const signedSx = isMirrored ? -sx : sx;
        const q = _SkeletalComponent.Ah(m, signedSx, sy, sz);
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
        const q = _SkeletalComponent.Ah(m, sign * sx, sign * sy, sign * sz);
        const logQuat = MathUtil.encodeLogQuat(q.x, q.y, q.z, q.w);
        translateScaleWork[i * 4 + 0] = v[12];
        translateScaleWork[i * 4 + 1] = v[13];
        translateScaleWork[i * 4 + 2] = v[14];
        translateScaleWork[i * 4 + 3] = Math.max(sx, sy, sz);
        boneDataUint32[i * 4 + 0] = logQuat[0];
        boneDataUint32[i * 4 + 1] = isMirrored ? (logQuat[1] | VEC4X1_NEGATIVE_SCALE_BIT) >>> 0 : logQuat[1];
      }
    }
    if (hasNonUniformScale && this.Kh()) {
      this.$logic();
      return;
    }
    if (boneDataType === BoneDataType.Vec4x1) {
      let maxAbsX = 1;
      let maxAbsY = 1;
      let maxAbsZ = 1;
      for (let i = 0; i < this.Ug.length; i++) {
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
      for (let i = 0; i < this.Ug.length; i++) {
        const normalizedX = translateScaleWork[i * 4 + 0] / maxAbsX;
        const normalizedY = translateScaleWork[i * 4 + 1] / maxAbsY;
        const normalizedZ = translateScaleWork[i * 4 + 2] / maxAbsZ;
        const encodedScale = MathUtil.encodeVec4x1Scale(translateScaleWork[i * 4 + 3]);
        const vec2TPacked = MathUtil.packSnormVec4ToUVec2(normalizedX, normalizedY, normalizedZ, encodedScale);
        boneDataUint32[i * 4 + 2] = vec2TPacked[0];
        boneDataUint32[i * 4 + 3] = vec2TPacked[1];
      }
      this.nh(maxAbsX, maxAbsY, maxAbsZ, boneDataType);
    } else {
      this.nh(1, 1, 1, boneDataType);
    }
    if (cacheKey) {
      _SkeletalComponent.jh.set(cacheKey, this.zh(currentProcessFrameToken));
    }
    this.Lh(cacheKey);
  }
  /**
   * Calculates the determinant of the upper-left 3x3 part of a column-major 4x4 matrix.
   *
   * @param v - The matrix elements (column-major)
   * @returns The determinant
   */
  static Jh(v) {
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
  static Ah(m, sx, sy, sz) {
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
    const q = _SkeletalComponent.Ch;
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
  Kh() {
    const sharingComponents = this.Mh();
    if (this.c.config.boneDataType == null && sharingComponents.every((component) => component.dh)) {
      for (const component of sharingComponents) {
        component.setBoneDataType(BoneDataType.Vec4x2, true);
      }
      this.c.logger.info(
        `SkeletalComponent (entity ${this.entityUID}): switched the bone data type from Vec4x1 to Vec4x2 because a non-uniform scale was found (${sharingComponents.length} component(s) sharing the skinning cache).`
      );
      return this.Vg === BoneDataType.Vec4x2;
    }
    if (!this.ih) {
      this.ih = true;
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
  Mh() {
    var _a;
    const key = this.Wg;
    if (key == null) {
      return [this];
    }
    const components = (_a = this.c.componentRepository.getComponentsWithType(_SkeletalComponent)) != null ? _a : [];
    return components.filter((component) => component === this || component.Wg === key);
  }
  /**
   * Gets a CPU-side work buffer for translation and scale (used only in Vec4x1 bone data type).
   *
   * @param boneDataType - The bone data type
   * @returns The work buffer (empty unless Vec4x1)
   */
  Hh(boneDataType) {
    if (boneDataType !== BoneDataType.Vec4x1) {
      return this.gh;
    }
    const requiredLength = this.Ug.length * 4;
    if (this.gh.length < requiredLength) {
      this.gh = new Float32Array(requiredLength);
    }
    return this.gh;
  }
  /**
   * Copies matrix data to the matrix array in a specific format.
   * Extracts the first 3 rows of a 4x4 matrix (Mat43 format) for efficient GPU storage.
   *
   * @param m - The source matrix to copy from
   * @param i - The index of the joint/bone
   * @private
   */
  Ih(m, i) {
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
    return this.Yg;
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
    this.ch = component.ch;
    this.dh = component.dh;
    if (component.Ug.length > 0) {
      this.setJoints(component.Ug.concat());
      this.Nh(component);
    } else {
      this.Ug = [];
      this.bh();
    }
    this.Yg = component.Yg;
    if (Is.exist(component._bindShapeMatrix)) {
      this._bindShapeMatrix = component._bindShapeMatrix.clone();
    }
    this.topOfJointsHierarchy = component.topOfJointsHierarchy;
    this.isSkinning = component.isSkinning;
    this.Xg.copyComponents(component.Xg);
    this.$g = component.$g;
    this._g = component._g;
    this.Zg = component.Zg;
    this.eh();
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
    this.bh();
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
    const index = this.Ug.indexOf(sg);
    const float32Array = this.Yg.getTypedArray();
    const m = new Matrix44(float32Array.slice(index * 16, index * 16 + 16));
    return m;
  }
  Nh(component) {
    const copyVector = (target, source) => {
      if (target.isDummy() || source.isDummy()) {
        return;
      }
      target.copyComponents(source);
    };
    if (Is.exist(component.ah)) {
      this.ah = component.ah.concat();
    } else {
      this.ah = void 0;
    }
    if (this.Vg === component.Vg && this._boneData._v.length === component._boneData._v.length) {
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
  }
  static wh(joints) {
    return joints.map((joint) => joint.jointIndex >= 0 ? joint.jointIndex : -1).join(",");
  }
  static Oh(uint8Array) {
    let hash = 2166136261;
    for (let i = 0; i < uint8Array.length; i++) {
      hash ^= uint8Array[i];
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
      hash >>>= 0;
    }
    return hash >>> 0;
  }
  static vh(accessor) {
    const cached = this.oh.get(accessor);
    if (cached !== void 0) {
      return cached;
    }
    const typedArray = accessor.getTypedArray();
    const view = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
    const hash = this.Oh(view);
    const signature = hash.toString(16);
    this.oh.set(accessor, signature);
    return signature;
  }
  static Sh(bindShapeMatrix) {
    if (!bindShapeMatrix) {
      return "no_bind_shape";
    }
    const cached = this.ph.get(bindShapeMatrix);
    if (cached !== void 0) {
      return cached;
    }
    const signature = Array.from(bindShapeMatrix._v).join(",");
    this.ph.set(bindShapeMatrix, signature);
    return signature;
  }
  Ph() {
    if (this.entity.parent == null) {
      return void 0;
    }
    return this.Qh(this.entity.parent.entity);
  }
  Qh(target) {
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
  yh() {
    if (this.kh === AnimationStateRepository.getAnimationBindingVersion() && this.lh === SceneGraphComponent.hierarchyVersion) {
      return;
    }
    this.eh();
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
  eh() {
    var _a, _b;
    this.kh = AnimationStateRepository.getAnimationBindingVersion();
    this.lh = SceneGraphComponent.hierarchyVersion;
    if (!this.Yg) {
      this.Wg = void 0;
      return;
    }
    if (!this._g) {
      this._g = _SkeletalComponent.vh(
        this.Yg
      );
    }
    const animationTrackFeatureHash = this.Ph();
    const boneDataTypeIndex = ((_a = this.Vg) != null ? _a : this.boneDataType).index;
    if (animationTrackFeatureHash != null) {
      this.Wg = `anim|${animationTrackFeatureHash.toString()}|${this._g}|${(_b = this.Zg) != null ? _b : ""}|${boneDataTypeIndex}`;
    } else {
      if (!this.Zg) {
        this.Wg = void 0;
        return;
      }
      this.Wg = `${this.Zg}|${this._g}|no_animation|${boneDataTypeIndex}`;
    }
  }
  /**
   * Drops the memoized skinning input signature so the next $logic recomputes skinning.
   */
  bh() {
    this.mh = false;
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
  Gh(cacheKey) {
    if (!this.mh) {
      return false;
    }
    if (this.qh !== cacheKey) {
      return false;
    }
    if (this.th !== this._bindShapeMatrix) {
      return false;
    }
    const entitySceneGraph = this.entity.getSceneGraph();
    if (entitySceneGraph == null || entitySceneGraph.worldMatrixVersion !== this.sh) {
      return false;
    }
    let jointVersionSum = 0;
    for (let i = 0; i < this.Ug.length; i++) {
      jointVersionSum += this.Ug[i].worldMatrixVersion;
    }
    return jointVersionSum === this.rh;
  }
  /**
   * Records the inputs that produced the current bone data.
   * @param cacheKey - The skinning cache key used for this computation
   */
  Lh(cacheKey) {
    var _a, _b;
    let jointVersionSum = 0;
    for (let i = 0; i < this.Ug.length; i++) {
      jointVersionSum += this.Ug[i].worldMatrixVersion;
    }
    this.qh = cacheKey;
    this.rh = jointVersionSum;
    this.sh = (_b = (_a = this.entity.getSceneGraph()) == null ? void 0 : _a.worldMatrixVersion) != null ? _b : -1;
    this.th = this._bindShapeMatrix;
    this.mh = true;
  }
  zh(processFrameToken) {
    const info = this._boneDataInfo._v;
    return {
      processFrameToken,
      boneData: this._boneData.isDummy() ? void 0 : this._boneData._v,
      boneDataInfo: [info[0], info[1], info[2], info[3]],
      jointMatrix: this.Xg._v,
      isWorldMatrixVanilla: this.$g
    };
  }
  Fh(cache) {
    this.$g = cache.isWorldMatrixVanilla;
    this.Xg._v.set(cache.jointMatrix);
    if (cache.boneData == null) {
      return;
    }
    const dataCount = this.Ug.length * BoneDataType.getVec4CountPerJoint(this.Vg) * 4;
    this._boneData._v.set(cache.boneData.subarray(0, Math.min(dataCount, this._boneData._v.length)));
    if (!this._boneDataInfo.isDummy()) {
      this._boneDataInfo._v.set(cache.boneDataInfo);
    }
  }
};
_SkeletalComponent.jh = /* @__PURE__ */ new Map();
_SkeletalComponent.oh = /* @__PURE__ */ new WeakMap();
_SkeletalComponent.ph = /* @__PURE__ */ new WeakMap();
_SkeletalComponent.Bh = 0;
_SkeletalComponent.eg = MutableMatrix44.identity();
_SkeletalComponent.Ch = MutableQuaternion.fromCopy4(0, 0, 0, 1);
_SkeletalComponent.Dh = MutableMatrix44.identity();
_SkeletalComponent.ag = MutableMatrix44.identity();
_SkeletalComponent.Bg = MutableMatrix44.identity();
var SkeletalComponent = _SkeletalComponent;
SkeletalComponent._registerBoneDataMember();
SkeletalComponent._registerBoneDataInfoMember();
export {
  SkeletalComponent
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29tcG9uZW50cy9Ta2VsZXRhbC9Ta2VsZXRhbENvbXBvbmVudC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBDb21wb25lbnRTSUQsIENvbXBvbmVudFRJRCwgRW50aXR5VUlELCBJbmRleCwgVHlwZWRBcnJheSB9IGZyb20gJy4uLy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4uLy4uL2NvcmUvQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgSUVudGl0eSB9IGZyb20gJy4uLy4uL2NvcmUvRW50aXR5JztcbmltcG9ydCB7IGFwcGx5TWl4aW5zLCB0eXBlIEVudGl0eVJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9jb3JlL0VudGl0eVJlcG9zaXRvcnknO1xuaW1wb3J0IHsgQm9uZURhdGFUeXBlLCB0eXBlIEJvbmVEYXRhVHlwZUVudW0gfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Cb25lRGF0YVR5cGUnO1xuaW1wb3J0IHsgQnVmZmVyVXNlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvQnVmZmVyVXNlJztcbmltcG9ydCB7IENvbXBvbmVudFR5cGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Db21wb25lbnRUeXBlJztcbmltcG9ydCB7IENvbXBvc2l0aW9uVHlwZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL0NvbXBvc2l0aW9uVHlwZSc7XG5pbXBvcnQgeyBQcm9jZXNzU3RhZ2UgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Qcm9jZXNzU3RhZ2UnO1xuaW1wb3J0IHsgU2hhZGVyVHlwZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1NoYWRlclR5cGUnO1xuaW1wb3J0IHR5cGUgeyBJU2NlbmVHcmFwaEVudGl0eSwgSVNrZWxldGFsRW50aXR5IH0gZnJvbSAnLi4vLi4vaGVscGVycy9FbnRpdHlIZWxwZXInO1xuaW1wb3J0IHR5cGUgeyBJTWF0cml4NDQgfSBmcm9tICcuLi8uLi9tYXRoL0lNYXRyaXgnO1xuaW1wb3J0IHsgTWF0aFV0aWwgfSBmcm9tICcuLi8uLi9tYXRoL01hdGhVdGlsJztcbmltcG9ydCB7IE1hdHJpeDQ0IH0gZnJvbSAnLi4vLi4vbWF0aC9NYXRyaXg0NCc7XG5pbXBvcnQgeyBNdXRhYmxlTWF0cml4NDQgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVNYXRyaXg0NCc7XG5pbXBvcnQgeyBNdXRhYmxlUXVhdGVybmlvbiB9IGZyb20gJy4uLy4uL21hdGgvTXV0YWJsZVF1YXRlcm5pb24nO1xuaW1wb3J0IHsgTXV0YWJsZVZlY3RvcjQgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVWZWN0b3I0JztcbmltcG9ydCB7IFZlY3Rvck4gfSBmcm9tICcuLi8uLi9tYXRoL1ZlY3Rvck4nO1xuaW1wb3J0IHR5cGUgeyBBY2Nlc3NvciB9IGZyb20gJy4uLy4uL21lbW9yeS9BY2Nlc3Nvcic7XG5pbXBvcnQgeyBEYXRhVXRpbCwgSXMgfSBmcm9tICcuLi8uLi9taXNjJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vLi4vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgeyBBbmltYXRpb25TdGF0ZVJlcG9zaXRvcnkgfSBmcm9tICcuLi9BbmltYXRpb24vQW5pbWF0aW9uU3RhdGVSZXBvc2l0b3J5JztcbmltcG9ydCB0eXBlIHsgQ29tcG9uZW50VG9Db21wb25lbnRNZXRob2RzIH0gZnJvbSAnLi4vQ29tcG9uZW50VHlwZXMnO1xuaW1wb3J0IHsgU2NlbmVHcmFwaENvbXBvbmVudCB9IGZyb20gJy4uL1NjZW5lR3JhcGgvU2NlbmVHcmFwaENvbXBvbmVudCc7XG5pbXBvcnQgeyBXZWxsS25vd25Db21wb25lbnRUSURzIH0gZnJvbSAnLi4vV2VsbEtub3duQ29tcG9uZW50VElEcyc7XG5cbnR5cGUgU2tpbm5pbmdDYWNoZSA9IHtcbiAgcHJvY2Vzc0ZyYW1lVG9rZW46IG51bWJlcjtcbiAgYm9uZURhdGE/OiBUeXBlZEFycmF5O1xuICBib25lRGF0YUluZm86IFtudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXJdO1xuICBqb2ludE1hdHJpeDogVHlwZWRBcnJheTtcbiAgaXNXb3JsZE1hdHJpeFZhbmlsbGE6IGJvb2xlYW47XG59O1xuXG4vKipcbiAqIFZlYzR4MTogYml0IDMxIG9mIGxvZ1F1YXQuaGkgKHVudXNlZCBieSB0aGUgNjMtYml0IGxvZy1xdWF0ZXJuaW9uKSB0ZWxscyB0aGF0IHRoZSB1bmlmb3JtIHNjYWxlIGlzIG5lZ2F0aXZlLFxuICogd2hpY2ggcmVwcmVzZW50cyBhIG1pcnJvcmVkIGpvaW50IG1hdHJpeC4gTXVzdCBtYXRjaCBSTl9WRUM0WDFfTkVHQVRJVkVfU0NBTEVfQklUIGluIHRoZSBzaGFkZXJzLlxuICovXG5jb25zdCBWRUM0WDFfTkVHQVRJVkVfU0NBTEVfQklUID0gMHg4MDAwMDAwMDtcblxuLyoqXG4gKiBTa2VsZXRhbENvbXBvbmVudCBtYW5hZ2VzIHNrZWxldGFsIGFuaW1hdGlvbiBmb3IgZW50aXRpZXMuXG4gKiBUaGlzIGNvbXBvbmVudCBoYW5kbGVzIGJvbmUgdHJhbnNmb3JtYXRpb25zLCBqb2ludCBtYXRyaWNlcywgYW5kIHNraW5uaW5nIGNhbGN1bGF0aW9uc1xuICogZm9yIDNEIG1vZGVscyB3aXRoIHNrZWxldGFsIGFuaW1hdGlvbiBzeXN0ZW1zLlxuICovXG5leHBvcnQgY2xhc3MgU2tlbGV0YWxDb21wb25lbnQgZXh0ZW5kcyBDb21wb25lbnQge1xuICBwdWJsaWMgX2pvaW50SW5kaWNlczogSW5kZXhbXSA9IFtdO1xuICBwcml2YXRlIF9fam9pbnRzOiBTY2VuZUdyYXBoQ29tcG9uZW50W10gPSBbXTtcbiAgcHJpdmF0ZSBfX2ludmVyc2VCaW5kTWF0cmljZXNBY2Nlc3Nvcj86IEFjY2Vzc29yO1xuICBwdWJsaWMgX2JpbmRTaGFwZU1hdHJpeD86IE1hdHJpeDQ0O1xuICBwcml2YXRlIF9fam9pbnRNYXRyaWNlcz86IG51bWJlcltdO1xuICBwdWJsaWMgdG9wT2ZKb2ludHNIaWVyYXJjaHk/OiBTY2VuZUdyYXBoQ29tcG9uZW50O1xuICBwdWJsaWMgaXNTa2lubmluZyA9IHRydWU7XG4gIC8qKlxuICAgKiBHUFUgYm9uZSBkYXRhIG9mIGFsbCBqb2ludHMuIFRoZSBsYXlvdXQgcGVyIGpvaW50IGRlcGVuZHMgb24gdGhlIGJvbmUgZGF0YSB0eXBlOlxuICAgKiAtIE1hdDQzeDE6IDMgdmVjNCBwZXIgam9pbnQgKDR4MyBtYXRyaXgsIGNvbHVtbi1tYWpvcilcbiAgICogLSBWZWM0eDI6IDIgdmVjNCBwZXIgam9pbnQgKFt0cmFuc2xhdGlvbi54eXosIGxvZ1F1YXQubG9dLCBbc2NhbGUueHl6LCBsb2dRdWF0LmhpXSkuXG4gICAqICAgVGhlIHggc2NhbGUgaXMgbmVnYXRpdmUgZm9yIGEgbWlycm9yZWQgam9pbnQgbWF0cml4LlxuICAgKiAtIFZlYzR4MTogMSB2ZWM0IHBlciBqb2ludCAoW2xvZ1F1YXQubG8sIGxvZ1F1YXQuaGksIHBhY2tlZFRyYW5zbGF0ZVNjYWxlLmxvLCBwYWNrZWRUcmFuc2xhdGVTY2FsZS5oaV0pLlxuICAgKiAgIHBhY2tlZFRyYW5zbGF0ZVNjYWxlIGlzIHNub3JtMTYgeCA0OiB0aGUgdHJhbnNsYXRpb24gZGl2aWRlZCBieSBgX2JvbmVEYXRhSW5mby54eXpgLCBhbmRcbiAgICogICBsb2cyKHx1bmlmb3JtIHNjYWxlfCkgLyAxNiAoc2VlIE1hdGhVdGlsLmVuY29kZVZlYzR4MVNjYWxlKS4gQml0IDMxIG9mIGxvZ1F1YXQuaGkgaXMgdGhlIHNpZ24gb2YgdGhlIHNjYWxlLlxuICAgKlxuICAgKiBUaGlzIGlzIGEgdmFyaWFibGUtbGVuZ3RoIG1lbWJlcjogZWFjaCBjb21wb25lbnQgZ2V0cyBleGFjdGx5IChqb2ludCBjb3VudCkgeCAodmVjNCBwZXIgam9pbnQpIHZlYzRzLFxuICAgKiBldmVuIHRob3VnaCBza2VsZXRhbCBjb21wb25lbnRzIHNoYXJlIGJ1ZmZlciB2aWV3cywgYW5kIHNoYWRlcnMgZmluZCBpdCB0aHJvdWdoIGBfYm9uZURhdGFMb2NhdGlvbmAuXG4gICAqL1xuICBwcml2YXRlIF9ib25lRGF0YSA9IFZlY3Rvck4uZHVtbXkoKTtcbiAgLyoqXG4gICAqIFRoZSBsb2NhdGlvbiBvZiBgX2JvbmVEYXRhYCBpbiB0aGUgR1BVIGRhdGEgKHdyaXR0ZW4gYnkgdGhlIG1lbW9yeSBhbGxvY2F0aW9uIG9mIENvbXBvbmVudCkuXG4gICAqL1xuICBwcml2YXRlIF9ib25lRGF0YUxvY2F0aW9uID0gTXV0YWJsZVZlY3RvcjQuZHVtbXkoKTtcbiAgLyoqXG4gICAqIFBlci1jb21wb25lbnQgYm9uZSBkYXRhIGluZm86IHh5eiA9IGRlcXVhbnRpemF0aW9uIGZhY3RvcnMgb2YgdHJhbnNsYXRpb24gKFZlYzR4MSBvbmx5KSxcbiAgICogdyA9IGJvbmUgZGF0YSB0eXBlIGluZGV4ICh1c2VkIGJ5IHNoYWRlcnMgdG8gc2VsZWN0IHRoZSBkZWNvZGluZyBwYXRoKS5cbiAgICovXG4gIHByaXZhdGUgX2JvbmVEYXRhSW5mbyA9IE11dGFibGVWZWN0b3I0LmR1bW15KCk7XG4gIHByaXZhdGUgX19ib25lRGF0YVVpbnQzMj86IFVpbnQzMkFycmF5O1xuICBwcml2YXRlIF9fYm9uZURhdGFUeXBlOiBCb25lRGF0YVR5cGVFbnVtID0gQm9uZURhdGFUeXBlLlZlYzR4MjtcbiAgLyoqIFdoZXRoZXIgX19ib25lRGF0YVR5cGUgd2FzIGNob3NlbiBhdXRvbWF0aWNhbGx5IChhbiBhdXRvbWF0aWMgVmVjNHgxIG1heSBiZSBzd2l0Y2hlZCB0byBWZWM0eDIpICovXG4gIHByaXZhdGUgX19pc0JvbmVEYXRhVHlwZUF1dG9TZWxlY3RlZCA9IGZhbHNlO1xuICBwcml2YXRlIF9faGFzV2FybmVkTm9uVW5pZm9ybVNjYWxlID0gZmFsc2U7XG4gIHByaXZhdGUgX19hbGxvY2F0ZWRCb25lRGF0YVR5cGU/OiBCb25lRGF0YVR5cGVFbnVtO1xuICBwcml2YXRlIF9fYm9uZURhdGFBcnJheUxlbmd0aCA9IDA7XG4gIHByaXZhdGUgX19ib25lVHJhbnNsYXRlU2NhbGVXb3JrID0gbmV3IEZsb2F0MzJBcnJheSgwKTtcbiAgcHJpdmF0ZSBfX2pvaW50TWF0cml4ID0gTXV0YWJsZU1hdHJpeDQ0LmlkZW50aXR5KCk7XG4gIHByaXZhdGUgX19pc1dvcmxkTWF0cml4VmFuaWxsYSA9IHRydWU7XG4gIF9pc0N1bGxlZCA9IGZhbHNlO1xuICBwcml2YXRlIHN0YXRpYyBfX3NraW5DYWxjdWxhdGlvbkNhY2hlOiBNYXA8c3RyaW5nLCBTa2lubmluZ0NhY2hlPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX19hY2Nlc3NvclNpZ25hdHVyZUNhY2hlOiBXZWFrTWFwPEFjY2Vzc29yLCBzdHJpbmc+ID0gbmV3IFdlYWtNYXAoKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX19iaW5kU2hhcGVTaWduYXR1cmVNYXA6IFdlYWtNYXA8TWF0cml4NDQsIHN0cmluZz4gPSBuZXcgV2Vha01hcCgpO1xuXG4gIHByaXZhdGUgX19qb2ludExpc3RLZXk/OiBzdHJpbmc7XG4gIHByaXZhdGUgX19za2luQ2FjaGVLZXk/OiBzdHJpbmc7XG4gIC8vIFZlcnNpb25zIG9mIGFuaW1hdGlvbiBiaW5kaW5ncyBhbmQgc2NlbmUgZ3JhcGggaGllcmFyY2h5IHVzZWQgZm9yIHRoZSBjdXJyZW50IF9fc2tpbkNhY2hlS2V5ICgtMTogbm90IGNvbXB1dGVkKVxuICBwcml2YXRlIF9fc2tpbkNhY2hlS2V5QW5pbWF0aW9uQmluZGluZ1ZlcnNpb24gPSAtMTtcbiAgcHJpdmF0ZSBfX3NraW5DYWNoZUtleUhpZXJhcmNoeVZlcnNpb24gPSAtMTtcbiAgcHJpdmF0ZSBfX2ludmVyc2VCaW5kTWF0cmljZXNTaWduYXR1cmU/OiBzdHJpbmc7XG4gIC8qKlxuICAgKiBNZW1vaXplZCBpbnB1dCBzaWduYXR1cmUgb2YgdGhlIGxhc3Qgc2tpbm5pbmcgY29tcHV0YXRpb24uIFdoZW4gdGhlIHNraW4gY2FjaGUga2V5LCB0aGUgam9pbnRcbiAgICogd29ybGQgbWF0cmljZXMsIHRoZSBza2lubmVkIG5vZGUgd29ybGQgbWF0cml4IGFuZCB0aGUgYmluZCBzaGFwZSBtYXRyaXggYXJlIHVuY2hhbmdlZCwgdGhlXG4gICAqIHdob2xlIHNraW5uaW5nIGxvb3AgY2FuIGJlIHNraXBwZWQgYW5kIHRoZSBwcmV2aW91cyBib25lIGRhdGEgcmV1c2VkLlxuICAgKi9cbiAgcHJpdmF0ZSBfX2hhc1NraW5Db21wdXRlU2lnbmF0dXJlID0gZmFsc2U7XG4gIHByaXZhdGUgX19sYXN0U2tpbkNvbXB1dGVDYWNoZUtleT86IHN0cmluZztcbiAgcHJpdmF0ZSBfX2xhc3RTa2luQ29tcHV0ZUpvaW50VmVyc2lvblN1bSA9IC0xO1xuICBwcml2YXRlIF9fbGFzdFNraW5Db21wdXRlT3duVmVyc2lvbiA9IC0xO1xuICBwcml2YXRlIF9fbGFzdFNraW5Db21wdXRlQmluZFNoYXBlTWF0cml4PzogTWF0cml4NDQ7XG4gIHByaXZhdGUgc3RhdGljIF9fdG9va0dsb2JhbERhdGFOdW0gPSAwO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcF9tYXQ0ID0gTXV0YWJsZU1hdHJpeDQ0LmlkZW50aXR5KCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wX3E6IE11dGFibGVRdWF0ZXJuaW9uID0gTXV0YWJsZVF1YXRlcm5pb24uZnJvbUNvcHk0KDAsIDAsIDAsIDEpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcF9tYXQ0XzIgPSBNdXRhYmxlTWF0cml4NDQuaWRlbnRpdHkoKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBfbWF0NF8zID0gTXV0YWJsZU1hdHJpeDQ0LmlkZW50aXR5KCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wX21hdDRfNCA9IE11dGFibGVNYXRyaXg0NC5pZGVudGl0eSgpO1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IFNrZWxldGFsQ29tcG9uZW50IGluc3RhbmNlLlxuICAgKiBJbml0aWFsaXplcyB0aGUgY29tcG9uZW50IHdpdGggc2tlbGV0YWwgYW5pbWF0aW9uIGNhcGFiaWxpdGllcyBhbmQgcmVzZXJ2ZXMgZ2xvYmFsIGRhdGEgcmVzb3VyY2VzLlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gZW50aXR5VWlkIC0gVGhlIHVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSBlbnRpdHkgdGhpcyBjb21wb25lbnQgYmVsb25ncyB0b1xuICAgKiBAcGFyYW0gY29tcG9uZW50U2lkIC0gVGhlIGNvbXBvbmVudCdzIHN5c3RlbSBpZGVudGlmaWVyXG4gICAqIEBwYXJhbSBlbnRpdHlSZXBvc2l0b3J5IC0gVGhlIHJlcG9zaXRvcnkgbWFuYWdpbmcgZW50aXRpZXNcbiAgICogQHBhcmFtIGlzUmVVc2UgLSBXaGV0aGVyIHRoaXMgY29tcG9uZW50IGlzIGJlaW5nIHJldXNlZCBmcm9tIGEgcG9vbFxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgZW50aXR5VWlkOiBFbnRpdHlVSUQsXG4gICAgY29tcG9uZW50U2lkOiBDb21wb25lbnRTSUQsXG4gICAgZW50aXR5UmVwb3NpdG9yeTogRW50aXR5UmVwb3NpdG9yeSxcbiAgICBpc1JlVXNlOiBib29sZWFuXG4gICkge1xuICAgIHN1cGVyKGVuZ2luZSwgZW50aXR5VWlkLCBjb21wb25lbnRTaWQsIGVudGl0eVJlcG9zaXRvcnksIGlzUmVVc2UpO1xuICAgIHRoaXMubW92ZVN0YWdlVG8oUHJvY2Vzc1N0YWdlLkxvZ2ljKTtcblxuICAgIGlmIChpc1JlVXNlKSB7XG4gICAgICAvLyBSZXNldCBib25lIGRhdGEgYnVmZmVycyB3aGVuIHJldXNpbmcgY29tcG9uZW50IHRvIHByZXZlbnQgZGlzcGxheSBjb3JydXB0aW9uXG4gICAgICB0aGlzLl9fcmVzZXRCb25lRGF0YUJ1ZmZlcnMoKTtcbiAgICAgIC8vIFJlc2V0IHdvcmxkIG1hdHJpeCB0byBpbml0aWFsIHN0YXRlXG4gICAgICB0aGlzLl9fam9pbnRNYXRyaXggPSBNdXRhYmxlTWF0cml4NDQuaWRlbnRpdHkoKTtcbiAgICAgIHRoaXMuX19pc1dvcmxkTWF0cml4VmFuaWxsYSA9IHRydWU7XG4gICAgICAvLyBDbGVhciBqb2ludC1yZWxhdGVkIHN0YXRlXG4gICAgICB0aGlzLl9fam9pbnRzID0gW107XG4gICAgICB0aGlzLl9fam9pbnRNYXRyaWNlcyA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMudG9wT2ZKb2ludHNIaWVyYXJjaHkgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9iaW5kU2hhcGVNYXRyaXggPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLmlzU2tpbm5pbmcgPSB0cnVlO1xuICAgICAgdGhpcy5fX2JvbmVEYXRhVHlwZSA9IEJvbmVEYXRhVHlwZS5WZWM0eDI7XG4gICAgICB0aGlzLl9faXNCb25lRGF0YVR5cGVBdXRvU2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMuX19oYXNXYXJuZWROb25Vbmlmb3JtU2NhbGUgPSBmYWxzZTtcbiAgICAgIHRoaXMuX19hbGxvY2F0ZWRCb25lRGF0YVR5cGUgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9fYm9uZURhdGFBcnJheUxlbmd0aCA9IDA7XG4gICAgICB0aGlzLl9fam9pbnRMaXN0S2V5ID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fX3NraW5DYWNoZUtleSA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuX19pbnZlcnNlQmluZE1hdHJpY2VzU2lnbmF0dXJlID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fX3NraW5DYWNoZUtleUFuaW1hdGlvbkJpbmRpbmdWZXJzaW9uID0gLTE7XG4gICAgICB0aGlzLl9fc2tpbkNhY2hlS2V5SGllcmFyY2h5VmVyc2lvbiA9IC0xO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIFNrZWxldGFsQ29tcG9uZW50Ll9fdG9va0dsb2JhbERhdGFOdW0rKztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldHMgR1BVLWJvdW5kIHZlY3RvciBmaWVsZHMgc28gdGhleSBjYW4gYmUgcmUtYm91bmQgb24gcmV1c2UuXG4gICAqIENsZWFycyBhbnkgZXhpc3RpbmcgZGF0YSB0byBwcmV2ZW50IGNvbnRhbWluYXRpb24gZnJvbSBwcmV2aW91cyBtb2RlbHMuXG4gICAqL1xuICBwcml2YXRlIF9fcmVzZXRCb25lRGF0YUJ1ZmZlcnMoKSB7XG4gICAgLy8gQ2xlYXIgZXhpc3RpbmcgZGF0YSBpZiBwcmVzZW50IGJlZm9yZSByZXNldHRpbmcgdG8gZHVtbXlcbiAgICBpZiAoIXRoaXMuX2JvbmVEYXRhLmlzRHVtbXkoKSkge1xuICAgICAgdGhpcy5fYm9uZURhdGEuX3YuZmlsbCgwKTtcbiAgICB9XG5cbiAgICAvLyBSZXNldCB0byBkdW1teSBvYmplY3QgZm9yIHJlLWJpbmRpbmdcbiAgICB0aGlzLl9ib25lRGF0YSA9IFZlY3Rvck4uZHVtbXkoKTtcbiAgICB0aGlzLl9fYm9uZURhdGFVaW50MzIgPSB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc3RhdGljIGNvbXBvbmVudCB0eXBlIGlkZW50aWZpZXIgZm9yIFNrZWxldGFsQ29tcG9uZW50LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgY29tcG9uZW50IHR5cGUgaWRlbnRpZmllclxuICAgKi9cbiAgc3RhdGljIGdldCBjb21wb25lbnRUSUQoKSB7XG4gICAgcmV0dXJuIFdlbGxLbm93bkNvbXBvbmVudFRJRHMuU2tlbGV0YWxDb21wb25lbnRUSUQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY29tcG9uZW50IHR5cGUgaWRlbnRpZmllciBmb3IgdGhpcyBpbnN0YW5jZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGNvbXBvbmVudCB0eXBlIGlkZW50aWZpZXJcbiAgICovXG4gIGdldCBjb21wb25lbnRUSUQoKTogQ29tcG9uZW50VElEIHtcbiAgICByZXR1cm4gV2VsbEtub3duQ29tcG9uZW50VElEcy5Ta2VsZXRhbENvbXBvbmVudFRJRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBhY2Nlc3NvciBmb3IgaW52ZXJzZSBiaW5kIG1hdHJpY2VzIHVzZWQgaW4gc2tlbGV0YWwgYW5pbWF0aW9uLlxuICAgKiBUaGVzZSBtYXRyaWNlcyB0cmFuc2Zvcm0gdmVydGljZXMgZnJvbSBtb2RlbCBzcGFjZSB0byBib25lIHNwYWNlLlxuICAgKlxuICAgKiBAcGFyYW0gaW52ZXJzZUJpbmRNYXRyaWNlc0FjY2Vzc29yIC0gVGhlIGFjY2Vzc29yIGNvbnRhaW5pbmcgaW52ZXJzZSBiaW5kIG1hdHJpY2VzIGRhdGFcbiAgICovXG4gIHNldEludmVyc2VCaW5kTWF0cmljZXNBY2Nlc3NvcihpbnZlcnNlQmluZE1hdHJpY2VzQWNjZXNzb3I6IEFjY2Vzc29yKSB7XG4gICAgdGhpcy5fX2ludmVyc2VCaW5kTWF0cmljZXNBY2Nlc3NvciA9IGludmVyc2VCaW5kTWF0cmljZXNBY2Nlc3NvcjtcbiAgICB0aGlzLl9faW52ZXJzZUJpbmRNYXRyaWNlc1NpZ25hdHVyZSA9IFNrZWxldGFsQ29tcG9uZW50Ll9fZ2V0QWNjZXNzb3JTaWduYXR1cmUoaW52ZXJzZUJpbmRNYXRyaWNlc0FjY2Vzc29yKTtcbiAgICB0aGlzLl9fdXBkYXRlU2tpbkNhY2hlS2V5KCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgam9pbnQgaGllcmFyY2h5IGZvciB0aGlzIHNrZWxldGFsIGNvbXBvbmVudC5cbiAgICogSW5pdGlhbGl6ZXMgdGhlIGFwcHJvcHJpYXRlIGRhdGEgYXJyYXlzIGJhc2VkIG9uIHRoZSBjb25maWd1cmVkIGJvbmUgZGF0YSB0eXBlLlxuICAgKlxuICAgKiBAcGFyYW0gam9pbnRzIC0gQXJyYXkgb2YgU2NlbmVHcmFwaENvbXBvbmVudHMgcmVwcmVzZW50aW5nIHRoZSBqb2ludHMvYm9uZXNcbiAgICovXG4gIHNldEpvaW50cyhqb2ludHM6IFNjZW5lR3JhcGhDb21wb25lbnRbXSkge1xuICAgIHRoaXMuX19pbnZhbGlkYXRlU2tpbkNvbXB1dGVTaWduYXR1cmUoKTtcbiAgICB0aGlzLl9fam9pbnRzID0gam9pbnRzO1xuICAgIHRoaXMuX19qb2ludExpc3RLZXkgPSBTa2VsZXRhbENvbXBvbmVudC5fX2J1aWxkSm9pbnRMaXN0S2V5KGpvaW50cyk7XG4gICAgdGhpcy5fX3Jlc2V0Qm9uZURhdGFCdWZmZXJzKCk7XG5cbiAgICBjb25zdCBib25lRGF0YVR5cGUgPSB0aGlzLmJvbmVEYXRhVHlwZTtcbiAgICB0aGlzLl9fYm9uZURhdGFBcnJheUxlbmd0aCA9IFNrZWxldGFsQ29tcG9uZW50Ll9fY2FsY0JvbmVEYXRhQXJyYXlMZW5ndGgoYm9uZURhdGFUeXBlLCBqb2ludHMubGVuZ3RoKTtcblxuICAgIC8vIENoZWNrIGlmIHRoaXMgY29tcG9uZW50IGlzIGJlaW5nIHJldXNlZCB0byBkZXRlcm1pbmUgYWxsb2NhdGlvbiBzdHJhdGVneVxuICAgIGNvbnN0IGlzQ29tcG9uZW50UmV1c2VkID0gdGhpcy5fX2lzUmVVc2U7XG4gICAgdGhpcy5zdWJtaXRUb0FsbG9jYXRpb24odGhpcy5fX2VuZ2luZS5jb25maWcuc2tlbGV0YWxDb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcsIGlzQ29tcG9uZW50UmV1c2VkKTtcblxuICAgIHRoaXMuX19ib25lRGF0YVVpbnQzMiA9IG5ldyBVaW50MzJBcnJheShcbiAgICAgIHRoaXMuX2JvbmVEYXRhLl92LmJ1ZmZlcixcbiAgICAgIHRoaXMuX2JvbmVEYXRhLl92LmJ5dGVPZmZzZXQsXG4gICAgICB0aGlzLl9ib25lRGF0YS5fdi5sZW5ndGhcbiAgICApO1xuICAgIHRoaXMuX19hbGxvY2F0ZWRCb25lRGF0YVR5cGUgPSBib25lRGF0YVR5cGU7XG4gICAgdGhpcy5fX3NldEJvbmVEYXRhSW5mbygxLCAxLCAxLCBib25lRGF0YVR5cGUpO1xuICAgIHRoaXMuX191cGRhdGVTa2luQ2FjaGVLZXkoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBlZmZlY3RpdmUgYm9uZSBkYXRhIHR5cGUgb2YgdGhpcyBjb21wb25lbnQuXG4gICAqIElmIENvbmZpZy5ib25lRGF0YVR5cGUgaXMgc2V0LCBpdCBvdmVycmlkZXMgdGhlIGJvbmUgZGF0YSB0eXBlIG9mIGVhY2ggY29tcG9uZW50LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZWZmZWN0aXZlIGJvbmUgZGF0YSB0eXBlXG4gICAqL1xuICBnZXQgYm9uZURhdGFUeXBlKCk6IEJvbmVEYXRhVHlwZUVudW0ge1xuICAgIHJldHVybiB0aGlzLl9fZW5naW5lLmNvbmZpZy5ib25lRGF0YVR5cGUgPz8gdGhpcy5fX2JvbmVEYXRhVHlwZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBib25lIGRhdGEgdHlwZSBvZiB0aGlzIGNvbXBvbmVudC5cbiAgICogTWF0NDN4MSBpcyB0aGUgbW9zdCBwcmVjaXNlIChhbmQgdGhlIGxhcmdlc3QpLCBWZWM0eDIgc3VwcG9ydHMgbm9uLXVuaWZvcm0gc2NhbGUsXG4gICAqIGFuZCBWZWM0eDEgaXMgdGhlIG1vc3QgY29tcGFjdCBidXQgc3VwcG9ydHMgb25seSB1bmlmb3JtIHNjYWxlLlxuICAgKiBJZiBqb2ludHMgYXJlIGFscmVhZHkgc2V0IGFuZCB0aGUgR1BVIGRhdGEgbGF5b3V0IGNoYW5nZXMsIHRoZSBib25lIGRhdGEgaXMgcmUtYWxsb2NhdGVkLlxuICAgKiBOb3RlIHRoYXQgQ29uZmlnLmJvbmVEYXRhVHlwZSwgaWYgc2V0LCB0YWtlcyBwcmVjZWRlbmNlIG92ZXIgdGhpcyB2YWx1ZS5cbiAgICpcbiAgICogSWYgYSBub24tdW5pZm9ybSBzY2FsZSBpcyBmb3VuZCBhdCBydW50aW1lIHdpdGggVmVjNHgxLCBhbiBhdXRvbWF0aWNhbGx5IHNlbGVjdGVkIFZlYzR4MSBpcyBzd2l0Y2hlZCB0byBWZWM0eDIsXG4gICAqIHdoaWxlIGFuIGV4cGxpY2l0bHkgc3BlY2lmaWVkIFZlYzR4MSBpcyBrZXB0ICh0aGUgbGFyZ2VzdCBzY2FsZSBpcyB1c2VkLCBhbmQgYSB3YXJuaW5nIGlzIGxvZ2dlZCBvbmNlKS5cbiAgICpcbiAgICogQHBhcmFtIGJvbmVEYXRhVHlwZSAtIFRoZSBib25lIGRhdGEgdHlwZSB0byB1c2VcbiAgICogQHBhcmFtIGlzQXV0b1NlbGVjdGVkIC0gVHJ1ZSBpZiB0aGUgdHlwZSB3YXMgY2hvc2VuIGF1dG9tYXRpY2FsbHkgKGUuZy4gYnkgdGhlIGdsVEYgaW1wb3J0ZXIpIHJhdGhlciB0aGFuXG4gICAqICAgc3BlY2lmaWVkIGJ5IHRoZSB1c2VyXG4gICAqL1xuICBzZXRCb25lRGF0YVR5cGUoYm9uZURhdGFUeXBlOiBCb25lRGF0YVR5cGVFbnVtLCBpc0F1dG9TZWxlY3RlZCA9IGZhbHNlKSB7XG4gICAgdGhpcy5fX2JvbmVEYXRhVHlwZSA9IGJvbmVEYXRhVHlwZTtcbiAgICB0aGlzLl9faXNCb25lRGF0YVR5cGVBdXRvU2VsZWN0ZWQgPSBpc0F1dG9TZWxlY3RlZDtcbiAgICB0aGlzLl9fZW5zdXJlQm9uZURhdGFMYXlvdXQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZS1hbGxvY2F0ZXMgdGhlIGJvbmUgZGF0YSBpZiB0aGUgZWZmZWN0aXZlIGJvbmUgZGF0YSB0eXBlIGRpZmZlcnMgZnJvbSB0aGUgYWxsb2NhdGVkIGxheW91dC5cbiAgICovXG4gIHByaXZhdGUgX19lbnN1cmVCb25lRGF0YUxheW91dCgpIHtcbiAgICBjb25zdCBib25lRGF0YVR5cGUgPSB0aGlzLmJvbmVEYXRhVHlwZTtcbiAgICBpZiAodGhpcy5fX2FsbG9jYXRlZEJvbmVEYXRhVHlwZSA9PT0gdW5kZWZpbmVkIHx8IHRoaXMuX19hbGxvY2F0ZWRCb25lRGF0YVR5cGUgPT09IGJvbmVEYXRhVHlwZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnNldEpvaW50cyh0aGlzLl9fam9pbnRzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIHRoZSBhcnJheSBsZW5ndGggKGluIHZlYzQpIG9mIHRoZSBib25lIGRhdGEuXG4gICAqIFRoZSBib25lIGRhdGEgaXMgYSB2YXJpYWJsZS1sZW5ndGggbWVtYmVyLCBzbyB0aGlzIGlzIGV4YWN0IHJlZ2FyZGxlc3Mgb2Ygc2tlbGV0YWxDb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcuXG4gICAqXG4gICAqIEBwYXJhbSBib25lRGF0YVR5cGUgLSBUaGUgYm9uZSBkYXRhIHR5cGVcbiAgICogQHBhcmFtIGpvaW50Q291bnQgLSBUaGUgbnVtYmVyIG9mIGpvaW50c1xuICAgKiBAcmV0dXJucyBUaGUgYXJyYXkgbGVuZ3RoIGluIHZlYzRcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fY2FsY0JvbmVEYXRhQXJyYXlMZW5ndGgoYm9uZURhdGFUeXBlOiBCb25lRGF0YVR5cGVFbnVtLCBqb2ludENvdW50OiBudW1iZXIpIHtcbiAgICByZXR1cm4gTWF0aC5tYXgoam9pbnRDb3VudCwgMSkgKiBCb25lRGF0YVR5cGUuZ2V0VmVjNENvdW50UGVySm9pbnQoYm9uZURhdGFUeXBlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwZXItaW5zdGFuY2UgYXJyYXkgbGVuZ3RoIG9mIHRoZSBib25lIGRhdGEgZm9yIG1lbW9yeSBhbGxvY2F0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gbWVtYmVyTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBtZW1iZXIgZmllbGRcbiAgICogQHJldHVybnMgVGhlIGFycmF5IGxlbmd0aCwgb3IgdW5kZWZpbmVkIGZvciBvdGhlciBtZW1iZXJzXG4gICAqL1xuICBwcm90ZWN0ZWQgX2dldEFycmF5TGVuZ3RoRm9yQWxsb2NhdGlvbihtZW1iZXJOYW1lOiBzdHJpbmcpOiBudW1iZXIgfCB1bmRlZmluZWQge1xuICAgIGlmIChtZW1iZXJOYW1lID09PSAnYm9uZURhdGEnICYmIHRoaXMuX19ib25lRGF0YUFycmF5TGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIHRoaXMuX19ib25lRGF0YUFycmF5TGVuZ3RoO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgcHJpdmF0ZSBfX3NldEJvbmVEYXRhSW5mbyh4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyLCBib25lRGF0YVR5cGU6IEJvbmVEYXRhVHlwZUVudW0pIHtcbiAgICBpZiAodGhpcy5fYm9uZURhdGFJbmZvLmlzRHVtbXkoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB2ID0gdGhpcy5fYm9uZURhdGFJbmZvLl92O1xuICAgIHZbMF0gPSB4O1xuICAgIHZbMV0gPSB5O1xuICAgIHZbMl0gPSB6O1xuICAgIHZbM10gPSBib25lRGF0YVR5cGUuaW5kZXg7XG4gIH1cblxuICAvKipcbiAgICogTGlnaHR3ZWlnaHQgam9pbnQgdXBkYXRlIGZvciByZW1hcHBpbmcgZHVyaW5nIHNoYWxsb3cgY29weS5cbiAgICogT25seSB1cGRhdGVzIGpvaW50IHJlZmVyZW5jZXMgd2l0aG91dCByZWluaXRpYWxpemluZyBidWZmZXJzLlxuICAgKiBVc2VkIHdoZW4gam9pbnRzIGFyZSByZW1hcHBlZCB0byBuZXcgZW50aXRpZXMgZHVyaW5nIHNoYWxsb3cgY29weS5cbiAgICovXG4gIHVwZGF0ZUpvaW50c0xpZ2h0d2VpZ2h0KGpvaW50czogU2NlbmVHcmFwaENvbXBvbmVudFtdKSB7XG4gICAgdGhpcy5fX2ludmFsaWRhdGVTa2luQ29tcHV0ZVNpZ25hdHVyZSgpO1xuICAgIHRoaXMuX19qb2ludHMgPSBqb2ludHM7XG4gICAgdGhpcy5fX2pvaW50TGlzdEtleSA9IFNrZWxldGFsQ29tcG9uZW50Ll9fYnVpbGRKb2ludExpc3RLZXkoam9pbnRzKTtcbiAgICB0aGlzLl9fdXBkYXRlU2tpbkNhY2hlS2V5KCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIGNvcHkgb2YgdGhlIGpvaW50cyBhcnJheS5cbiAgICpcbiAgICogQHJldHVybnMgQSBjb3B5IG9mIHRoZSBTY2VuZUdyYXBoQ29tcG9uZW50cyByZXByZXNlbnRpbmcgdGhlIGpvaW50c1xuICAgKi9cbiAgZ2V0Sm9pbnRzKCk6IFNjZW5lR3JhcGhDb21wb25lbnRbXSB7XG4gICAgcmV0dXJuIHRoaXMuX19qb2ludHMuY29uY2F0KCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgd29ybGQgbWF0cml4IG9mIHRoZSByb290IGpvaW50IGluIHRoZSBoaWVyYXJjaHkuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB3b3JsZCBtYXRyaXggb2YgdGhlIHRvcCBqb2ludCwgb3IgdW5kZWZpbmVkIGlmIG5vIHRvcCBqb2ludCBleGlzdHNcbiAgICovXG4gIGdldCByb290Sm9pbnRXb3JsZE1hdHJpeElubmVyKCkge1xuICAgIHJldHVybiB0aGlzLnRvcE9mSm9pbnRzSGllcmFyY2h5Py5tYXRyaXhJbm5lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb21wdXRlZCBqb2ludCBtYXRyaWNlcyBhcnJheS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGpvaW50IG1hdHJpY2VzIGFycmF5XG4gICAqL1xuICBnZXQgam9pbnRNYXRyaWNlcygpIHtcbiAgICByZXR1cm4gdGhpcy5fX2pvaW50TWF0cmljZXM7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgR1BVIGJvbmUgZGF0YSBhcnJheSBvZiBhbGwgam9pbnRzLlxuICAgKiBUaGUgbGF5b3V0IGRlcGVuZHMgb24gdGhlIGJvbmUgZGF0YSB0eXBlIChzZWUgdGhlIGBib25lRGF0YVR5cGVgIGdldHRlcikuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBGbG9hdDMyQXJyYXkgY29udGFpbmluZyB0aGUgYm9uZSBkYXRhXG4gICAqL1xuICBnZXQgYm9uZURhdGFBcnJheSgpIHtcbiAgICByZXR1cm4gdGhpcy5fYm9uZURhdGEuX3Y7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgYm9uZSBkYXRhIGluZm8gKHh5ejogdHJhbnNsYXRpb24gZGVxdWFudGl6YXRpb24gZmFjdG9ycyBmb3IgVmVjNHgxLCB3OiBib25lIGRhdGEgdHlwZSBpbmRleCkuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBib25lIGRhdGEgaW5mbyB2ZWN0b3JcbiAgICovXG4gIGdldCBib25lRGF0YUluZm8oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2JvbmVEYXRhSW5mbztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgY29weSBvZiB0aGUgd29ybGQgbWF0cml4LlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGNsb25lZCBjb3B5IG9mIHRoZSB3b3JsZCBtYXRyaXhcbiAgICovXG4gIGdldCB3b3JsZE1hdHJpeCgpIHtcbiAgICByZXR1cm4gdGhpcy5fX2pvaW50TWF0cml4LmNsb25lKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW50ZXJuYWwgd29ybGQgbWF0cml4IChkaXJlY3QgcmVmZXJlbmNlKS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGludGVybmFsIHdvcmxkIG1hdHJpeFxuICAgKi9cbiAgZ2V0IHdvcmxkTWF0cml4SW5uZXIoKSB7XG4gICAgcmV0dXJuIE11dGFibGVNYXRyaXg0NC5tdWx0aXBseVRvKHRoaXMuZW50aXR5Lm1hdHJpeElubmVyLCB0aGlzLl9fam9pbnRNYXRyaXgsIFNrZWxldGFsQ29tcG9uZW50Ll9fdG1wX21hdDRfNCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSB3b3JsZCBtYXRyaXggaGFzIGJlZW4gdXBkYXRlZCBmcm9tIGl0cyBpbml0aWFsIHN0YXRlLlxuICAgKlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSB3b3JsZCBtYXRyaXggaGFzIGJlZW4gbW9kaWZpZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgZ2V0IGlzV29ybGRNYXRyaXhVcGRhdGVkKCkge1xuICAgIHJldHVybiAhdGhpcy5fX2lzV29ybGRNYXRyaXhWYW5pbGxhO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHZpc2liaWxpdHkgb2YgdGhlIGpvaW50IGdpem1vIHRoYXQgdmlzdWFsaXplcyBza2VsZXRhbCBqb2ludHMuXG4gICAqIEBwYXJhbSBmbGcgLSBUcnVlIHRvIHNob3cgdGhlIGpvaW50IGdpem1vLCBmYWxzZSB0byBoaWRlIGl0XG4gICAqL1xuICBzZXQgaXNKb2ludEdpem1vc1Zpc2libGUoZmxnOiBib29sZWFuKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9fam9pbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLl9fam9pbnRzW2ldLmlzSm9pbnRHaXptb1Zpc2libGUgPSBmbGc7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHZpc2liaWxpdHkgc3RhdGUgb2YgdGhlIGpvaW50IGdpem1vLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBqb2ludCBnaXptbyBpcyB2aXNpYmxlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGdldCBpc0pvaW50R2l6bW9zVmlzaWJsZSgpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX19qb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLl9fam9pbnRzW2ldLmlzSm9pbnRHaXptb1Zpc2libGUpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtcyB0aGUgbG9naWMgdXBkYXRlIGZvciBza2VsZXRhbCBhbmltYXRpb24uXG4gICAqIENhbGN1bGF0ZXMgam9pbnQgdHJhbnNmb3JtYXRpb25zIGFuZCB1cGRhdGVzIGJvbmUgZGF0YSBhcnJheXMgYmFzZWQgb24gdGhlIGNvbmZpZ3VyZWQgYm9uZSBkYXRhIHR5cGUuXG4gICAqIFRoaXMgbWV0aG9kIGlzIGNhbGxlZCBkdXJpbmcgdGhlIExvZ2ljIHByb2Nlc3Npbmcgc3RhZ2UuXG4gICAqXG4gICAqICMjIFNraW5uaW5nIENhY2hlIGFuZCBBbmltYXRpb25Db21wb25lbnQgRWFybHkgUmV0dXJuIE9wdGltaXphdGlvblxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBpbXBsZW1lbnRzIGEgdHdvLWxldmVsIG9wdGltaXphdGlvbiBmb3IgVlJNIG1vZGVscyB3aXRoIHNoYXJlZCBza2VsZXRvbjpcbiAgICpcbiAgICogIyMjIExldmVsIDE6IFNraW5uaW5nIENhY2hlIChleGlzdGluZyBmZWF0dXJlKVxuICAgKiBTa2VsZXRhbENvbXBvbmVudHMgd2l0aCB0aGUgc2FtZSBqb2ludCBzdHJ1Y3R1cmUgYW5kIGFuaW1hdGlvbiBzdGF0ZSBzaGFyZSBza2lubmluZyByZXN1bHRzLlxuICAgKiBUaGUgZmlyc3QgU2tlbGV0YWxDb21wb25lbnQgKFwibGVhZGVyXCIpIGNvbXB1dGVzIHNraW5uaW5nLCBvdGhlcnMgcmV1c2UgdGhlIGNhY2hlZCByZXN1bHQuXG4gICAqXG4gICAqICMjIyBMZXZlbCAyOiBBbmltYXRpb25Db21wb25lbnQgRWFybHkgUmV0dXJuIChuZXcgZmVhdHVyZSlcbiAgICogV2hlbiBza2lubmluZyBjYWNoZSBoaXRzLCB3ZSB0cmFjayB0aGUgam9pbnQgRW50aXR5VUlEcy4gSW4gdGhlIG5leHQgZnJhbWUsXG4gICAqIEFuaW1hdGlvbkNvbXBvbmVudCBjYW4gZWFybHkgcmV0dXJuIGZvciB0aGVzZSBqb2ludHMsIHNraXBwaW5nIGFuaW1hdGlvbiBjYWxjdWxhdGlvbnMuXG4gICAqXG4gICAqIEtleSBjb25jZXB0czpcbiAgICogLSAqKkxlYWRlcioqOiBUaGUgU2tlbGV0YWxDb21wb25lbnQgdGhhdCBjb21wdXRlcyBza2lubmluZyAoY2FjaGUgbWlzcylcbiAgICogLSAqKkZvbGxvd2VyKio6IFNrZWxldGFsQ29tcG9uZW50cyB0aGF0IHJldXNlIHNraW5uaW5nIGNhY2hlIChjYWNoZSBoaXQpXG4gICAqIC0gKipMZWFkZXIgSm9pbnRzKio6IEpvaW50cyBiZWxvbmdpbmcgdG8gbGVhZGVycyAtIHRoZXNlIE1VU1QgY29udGludWUgYW5pbWF0aW5nXG4gICAqIC0gKipDYWNoZWQgRW50aXR5IFVJRHMqKjogRm9sbG93ZXIgam9pbnRzIHRoYXQgY2FuIHNraXAgYW5pbWF0aW9uIGluIHRoZSBuZXh0IGZyYW1lXG4gICAqXG4gICAqIFRoZSBsZWFkZXIncyBqb2ludHMgYXJlIHByb3RlY3RlZCAoX19sZWFkZXJKb2ludEVudGl0eVVJRHMpIHRvIGVuc3VyZSBhbmltYXRpb24gY29udGludWVzLlxuICAgKiBPbmx5IGZvbGxvd2VyIGpvaW50cyBhcmUgcmVnaXN0ZXJlZCBmb3IgZWFybHkgcmV0dXJuIChfX2N1cnJlbnRGcmFtZUNhY2hlZEVudGl0eVVJRHMpLlxuICAgKi9cbiAgJGxvZ2ljKCkge1xuICAgIC8vIFNraXAgaWYgc2tpbm5pbmcgaXMgZGlzYWJsZWRcbiAgICBpZiAoIXRoaXMuaXNTa2lubmluZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIC0tLSBGcmFtZSBUcmFuc2l0aW9uOiBTd2FwIGNhY2hlZCBlbnRpdHkgVUlEcyAtLS1cbiAgICAvLyBXaGVuIGEgbmV3IGZyYW1lIHN0YXJ0cywgbW92ZSBjdXJyZW50IGZyYW1lJ3MgY2FjaGVkIFVJRHMgdG8gcHJldmlvdXMgZnJhbWUuXG4gICAgLy8gQW5pbWF0aW9uQ29tcG9uZW50IHVzZXMgcHJldmlvdXMgZnJhbWUncyBkYXRhIGJlY2F1c2UgaXQgcnVucyBiZWZvcmUgU2tlbGV0YWxDb21wb25lbnQuXG4gICAgY29uc3QgY3VycmVudFByb2Nlc3NGcmFtZVRva2VuID0gQW5pbWF0aW9uU3RhdGVSZXBvc2l0b3J5LmdldFByb2Nlc3NGcmFtZVRva2VuKHRoaXMuX19lbmdpbmUpO1xuICAgIEFuaW1hdGlvblN0YXRlUmVwb3NpdG9yeS5oYW5kbGVGcmFtZVRyYW5zaXRpb25JZk5lZWRlZCh0aGlzLl9fZW5naW5lLCBjdXJyZW50UHJvY2Vzc0ZyYW1lVG9rZW4pO1xuXG4gICAgLy8gSm9pbnRzIGhhdmUgbm90IGJlZW4gc2V0IHlldCAobm8gYm9uZSBkYXRhIGlzIGFsbG9jYXRlZClcbiAgICBpZiAodGhpcy5fYm9uZURhdGEuaXNEdW1teSgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2lzQ3VsbGVkKSB7XG4gICAgICAvLyBGb3JjZSBhIHJlY29tcHV0YXRpb24gd2hlbiB0aGlzIGNvbXBvbmVudCBiZWNvbWVzIHZpc2libGUgYWdhaW4uXG4gICAgICB0aGlzLl9faW52YWxpZGF0ZVNraW5Db21wdXRlU2lnbmF0dXJlKCk7XG4gICAgICAvLyBBIGN1bGxlZCBza2luIGlzIG5laXRoZXIgY29tcHV0ZWQgbm9yIGRyYXduLiBMZXQgaXRzIGpvaW50cyBza2lwIGFuaW1hdGlvbiB3aGlsZSBhIHZpc2libGVcbiAgICAgIC8vIFNrZWxldGFsQ29tcG9uZW50IHdpdGggdGhlIHNhbWUgY2FjaGUga2V5ICh0aGUgbGVhZGVyKSBjb21wdXRlcyB0aGUgc2hhcmVkIHNraW5uaW5nIHJlc3VsdC5cbiAgICAgIC8vIE90aGVyd2lzZSwgY3VsbGVkIG1vZGVscyB3b3VsZCBrZWVwIGFuaW1hdGluZyBhbGwgdGhlaXIgam9pbnRzIGV2ZXJ5IGZyYW1lLlxuICAgICAgdGhpcy5fX3VwZGF0ZVNraW5DYWNoZUtleUlmTmVlZGVkKCk7XG4gICAgICBpZiAodGhpcy5fX3NraW5DYWNoZUtleSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIEFuaW1hdGlvblN0YXRlUmVwb3NpdG9yeS5hZGRDdWxsZWRTa2VsZXRvbkpvaW50cyh0aGlzLl9fZW5naW5lLCB0aGlzLl9fc2tpbkNhY2hlS2V5LCB0aGlzLl9fam9pbnRzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gRm9sbG93IGNoYW5nZXMgb2YgQ29uZmlnLmJvbmVEYXRhVHlwZSBhdCBydW50aW1lXG4gICAgdGhpcy5fX2Vuc3VyZUJvbmVEYXRhTGF5b3V0KCk7XG5cbiAgICAvLyAtLS0gU2tpbm5pbmcgQ2FjaGUgTG9va3VwIC0tLVxuICAgIHRoaXMuX191cGRhdGVTa2luQ2FjaGVLZXlJZk5lZWRlZCgpO1xuICAgIGNvbnN0IGNhY2hlS2V5ID0gdGhpcy5fX3NraW5DYWNoZUtleTtcbiAgICAvLyBVc2UgdGhlIEVuZ2luZS5wcm9jZXNzKCkgdG9rZW4gaW5zdGVhZCBvZiBUcmFuc2Zvcm1Db21wb25lbnQudXBkYXRlQ291bnQgZm9yIGNhY2hlXG4gICAgLy8gdmFsaWRpdHkuIHVwZGF0ZUNvdW50IGNoYW5nZXMgd2hlbiBBbmltYXRpb25Db21wb25lbnRzIHVwZGF0ZSBqb2ludHMsIGluY2x1ZGluZyB3aGlsZVxuICAgIC8vIHRoaXMgZnJhbWUgaXMgc3RpbGwgYmVpbmcgcHJvY2Vzc2VkLiBUaGUgcHJvY2VzcyB0b2tlbiBzdGF5cyBzdGFibGUgZm9yIHRoZSB3aG9sZSBmcmFtZS5cblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBTa2lubmluZyBDYWNoZSBIaXQvTWlzcyBMb2dpYyB3aXRoIExlYWRlci9Gb2xsb3dlciBQYXR0ZXJuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIFRoaXMgaW1wbGVtZW50cyBhbiBvcHRpbWl6YXRpb24gZm9yIG11bHRpcGxlIFZSTSBtb2RlbHMgd2l0aCBpZGVudGljYWwgc2tlbGV0b25cbiAgICAvLyBzdHJ1Y3R1cmVzIChlLmcuLCBzYW1lIG1vZGVsIGxvYWRlZCBtdWx0aXBsZSB0aW1lcyBvciBzaGFsbG93Q29waWVkKS5cbiAgICAvL1xuICAgIC8vIEtleSBjb25jZXB0czpcbiAgICAvLyAtIFwiTGVhZGVyXCI6IFRoZSBmaXJzdCBTa2VsZXRhbENvbXBvbmVudCB0byBjb21wdXRlIHNraW5uaW5nIGZvciBhIGdpdmVuIGNhY2hlIGtleS5cbiAgICAvLyAgIEl0cyBqb2ludHMgTVVTVCBjb250aW51ZSBhbmltYXRpbmcgdG8gcHJvdmlkZSBhbmltYXRpb24gZGF0YSBmb3IgYWxsIG1vZGVscy5cbiAgICAvLyAtIFwiRm9sbG93ZXJcIjogU3Vic2VxdWVudCBTa2VsZXRhbENvbXBvbmVudHMgdGhhdCByZXVzZSB0aGUgbGVhZGVyJ3Mgc2tpbm5pbmcgcmVzdWx0LlxuICAgIC8vICAgVGhlaXIgam9pbnRzIGNhbiBza2lwIGFuaW1hdGlvbiBjYWxjdWxhdGlvbiAoZWFybHkgcmV0dXJuIGluIEFuaW1hdGlvbkNvbXBvbmVudCkuXG4gICAgLy9cbiAgICAvLyBUaGUgam9pbnRJbmRleC1iYXNlZCBjb21wYXJpc29uIGFsbG93czpcbiAgICAvLyAtIHNoYWxsb3dDb3B5OiBTYW1lIGVudGl0eVVJRCBmb3Igam9pbnRzIFx1MjE5MiBqb2ludHMgYXJlIHNoYXJlZCwgbm8gcmVnaXN0cmF0aW9uIG5lZWRlZFxuICAgIC8vIC0gU2VwYXJhdGUgbG9hZDogRGlmZmVyZW50IGVudGl0eVVJRCBidXQgc2FtZSBqb2ludEluZGV4IFx1MjE5MiByZWdpc3RlciBmb3IgZWFybHkgcmV0dXJuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgY29uc3QgY2FjaGVMZWFkZXJzID0gQW5pbWF0aW9uU3RhdGVSZXBvc2l0b3J5LmdldE9yQ3JlYXRlQ2FjaGVMZWFkZXJzKHRoaXMuX19lbmdpbmUpO1xuICAgIGNvbnN0IGxlYWRlckpvaW50SW5kZXhUb0VudGl0eVVJRCA9IEFuaW1hdGlvblN0YXRlUmVwb3NpdG9yeS5nZXRPckNyZWF0ZUxlYWRlckpvaW50SW5kZXhUb0VudGl0eVVJRCh0aGlzLl9fZW5naW5lKTtcbiAgICBjb25zdCBjdXJyZW50RnJhbWVDYWNoZWRFbnRpdHlVSURzID0gQW5pbWF0aW9uU3RhdGVSZXBvc2l0b3J5LmdldE9yQ3JlYXRlQ3VycmVudEZyYW1lQ2FjaGVkRW50aXR5VUlEcyhcbiAgICAgIHRoaXMuX19lbmdpbmVcbiAgICApO1xuXG4gICAgaWYgKGNhY2hlS2V5KSB7XG4gICAgICBjb25zdCBjYWNoZSA9IFNrZWxldGFsQ29tcG9uZW50Ll9fc2tpbkNhbGN1bGF0aW9uQ2FjaGUuZ2V0KGNhY2hlS2V5KTtcblxuICAgICAgLy8gLS0tIENhY2hlIEhpdDogUmV1c2UgZXhpc3Rpbmcgc2tpbm5pbmcgcmVzdWx0IC0tLVxuICAgICAgLy8gQ2hlY2sgaWYgYSB2YWxpZCBjYWNoZSBleGlzdHMgZm9yIHRoaXMgRW5naW5lLnByb2Nlc3MoKSBmcmFtZS5cbiAgICAgIGlmIChjYWNoZT8ucHJvY2Vzc0ZyYW1lVG9rZW4gPT09IGN1cnJlbnRQcm9jZXNzRnJhbWVUb2tlbikge1xuICAgICAgICAvLyBEZXRlcm1pbmUgaWYgdGhpcyBTa2VsZXRhbENvbXBvbmVudCBpcyB0aGUgXCJsZWFkZXJcIiBmb3IgdGhpcyBjYWNoZSBrZXkuXG4gICAgICAgIC8vIExlYWRlcnMgY29tcHV0ZWQgdGhlIHNraW5uaW5nIHJlc3VsdCwgc28gdGhlaXIgam9pbnRzIG11c3QgY29udGludWUgYW5pbWF0aW5nLlxuICAgICAgICBjb25zdCBpc0xlYWRlciA9IGNhY2hlTGVhZGVycy5nZXQoY2FjaGVLZXkpID09PSB0aGlzLmVudGl0eVVJRDtcblxuICAgICAgICBpZiAoIWlzTGVhZGVyKSB7XG4gICAgICAgICAgLy8gVGhpcyBpcyBhIFwiZm9sbG93ZXJcIiAtIHJlZ2lzdGVyIGl0cyBqb2ludHMgZm9yIEFuaW1hdGlvbkNvbXBvbmVudCBlYXJseSByZXR1cm4uXG4gICAgICAgICAgLy8gVXNlIGpvaW50SW5kZXggKHNrZWxldG9uIHN0cnVjdHVyZSkgdG8gY29tcGFyZSB3aXRoIGxlYWRlcidzIGpvaW50cy5cbiAgICAgICAgICBmb3IgKGNvbnN0IGpvaW50IG9mIHRoaXMuX19qb2ludHMpIHtcbiAgICAgICAgICAgIGNvbnN0IGxlYWRlckVudGl0eVVJRCA9IGxlYWRlckpvaW50SW5kZXhUb0VudGl0eVVJRC5nZXQoam9pbnQuam9pbnRJbmRleCk7XG4gICAgICAgICAgICAvLyBSZWdpc3RlciBvbmx5IGlmOlxuICAgICAgICAgICAgLy8gMS4gU2FtZSBqb2ludEluZGV4IGV4aXN0cyBpbiBsZWFkZXIgKHNhbWUgc2tlbGV0b24gc3RydWN0dXJlKVxuICAgICAgICAgICAgLy8gMi4gRW50aXR5VUlEIGlzIERJRkZFUkVOVCAoc2VwYXJhdGVseSBsb2FkZWQgbW9kZWwsIG5vdCBzaGFsbG93Q29weSlcbiAgICAgICAgICAgIGlmIChsZWFkZXJFbnRpdHlVSUQgIT09IHVuZGVmaW5lZCAmJiBsZWFkZXJFbnRpdHlVSUQgIT09IGpvaW50LmVudGl0eVVJRCkge1xuICAgICAgICAgICAgICBjdXJyZW50RnJhbWVDYWNoZWRFbnRpdHlVSURzLmFkZChqb2ludC5lbnRpdHlVSUQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gSWYgZW50aXR5VUlEIGlzIHRoZSBTQU1FLCB0aGlzIGlzIGEgc2hhbGxvd0NvcHkgY2FzZS5cbiAgICAgICAgICAgIC8vIFRoZSBqb2ludCBpcyBzaGFyZWQgd2l0aCBsZWFkZXIsIHNvIG5vIHJlZ2lzdHJhdGlvbiBuZWVkZWQuXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIExlYWRlciBjYXNlOiBEbyBub3QgcmVnaXN0ZXIgam9pbnRzIC0gbGVhZGVyIG11c3QgY29udGludWUgYW5pbWF0aW5nXG5cbiAgICAgICAgLy8gQXBwbHkgY2FjaGVkIHNraW5uaW5nIHJlc3VsdCBhbmQgcmV0dXJuIGVhcmx5XG4gICAgICAgIHRoaXMuX19hcHBseVNraW5uaW5nQ2FjaGUoY2FjaGUpO1xuICAgICAgICAvLyBBIGZvbGxvd2VyIG11c3QgY29weSB0aGUgbGVhZGVyJ3MgcmVzdWx0IGV2ZXJ5IGZyYW1lLCBzbyBpdCBuZXZlciB1c2VzIHRoZSBpbnB1dFxuICAgICAgICAvLyBzaWduYXR1cmUgc2tpcCB1bnRpbCBpdCBoYXMgY29tcHV0ZWQgc2tpbm5pbmcgaXRzZWxmLlxuICAgICAgICB0aGlzLl9faW52YWxpZGF0ZVNraW5Db21wdXRlU2lnbmF0dXJlKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gLS0tIENhY2hlIE1pc3M6IFRoaXMgU2tlbGV0YWxDb21wb25lbnQgYmVjb21lcyB0aGUgXCJsZWFkZXJcIiAtLS1cbiAgICAgIC8vIFJlZ2lzdGVyIHRoaXMgY29tcG9uZW50IGFzIHRoZSBsZWFkZXIgZm9yIHRoaXMgY2FjaGUga2V5XG4gICAgICBjYWNoZUxlYWRlcnMuc2V0KGNhY2hlS2V5LCB0aGlzLmVudGl0eVVJRCk7XG5cbiAgICAgIC8vIEJ1aWxkIGpvaW50SW5kZXggXHUyMTkyIGVudGl0eVVJRCBtYXBwaW5nIGZvciB0aGlzIGxlYWRlcidzIGpvaW50cy5cbiAgICAgIC8vIEZvbGxvd2VycyB3aWxsIHVzZSB0aGlzIHRvIGNvbXBhcmUgdGhlaXIgam9pbnRzIGJ5IHN0cnVjdHVyZSAoam9pbnRJbmRleClcbiAgICAgIC8vIHJhdGhlciB0aGFuIGJ5IGlkZW50aXR5IChlbnRpdHlVSUQpLlxuICAgICAgZm9yIChjb25zdCBqb2ludCBvZiB0aGlzLl9fam9pbnRzKSB7XG4gICAgICAgIGxlYWRlckpvaW50SW5kZXhUb0VudGl0eVVJRC5zZXQoam9pbnQuam9pbnRJbmRleCwgam9pbnQuZW50aXR5VUlEKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5fX2lzU2tpbkNvbXB1dGVJbnB1dFVuY2hhbmdlZChjYWNoZUtleSkpIHtcbiAgICAgIC8vIFB1Ymxpc2ggdGhpcyBmcmFtZSdzIGNhY2hlIGVudHJ5IHNvIGZvbGxvd2VycyBjYW4gc3RpbGwgcmV1c2UgdGhlIGV4aXN0aW5nIGJvbmUgZGF0YS5cbiAgICAgIGlmIChjYWNoZUtleSkge1xuICAgICAgICBTa2VsZXRhbENvbXBvbmVudC5fX3NraW5DYWxjdWxhdGlvbkNhY2hlLnNldChjYWNoZUtleSwgdGhpcy5fX2NyZWF0ZVNraW5uaW5nQ2FjaGUoY3VycmVudFByb2Nlc3NGcmFtZVRva2VuKSk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgYm9uZURhdGFUeXBlID0gdGhpcy5fX2FsbG9jYXRlZEJvbmVEYXRhVHlwZSE7XG4gICAgY29uc3QgYm9uZURhdGEgPSB0aGlzLl9ib25lRGF0YS5fdjtcbiAgICBjb25zdCBib25lRGF0YVVpbnQzMiA9IHRoaXMuX19ib25lRGF0YVVpbnQzMiE7XG4gICAgY29uc3QgdHJhbnNsYXRlU2NhbGVXb3JrID0gdGhpcy5fX2dldFRyYW5zbGF0ZVNjYWxlV29yayhib25lRGF0YVR5cGUpO1xuICAgIGNvbnN0IGludmVyc2VHbG9iYWxUcmFuc2Zvcm0gPSBNdXRhYmxlTWF0cml4NDQuaW52ZXJ0VG8odGhpcy5lbnRpdHkubWF0cml4SW5uZXIsIFNrZWxldGFsQ29tcG9uZW50Ll9fdG1wX21hdDRfMik7XG4gICAgbGV0IGhhc05vblVuaWZvcm1TY2FsZSA9IGZhbHNlO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fX2pvaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgam9pbnQgPSB0aGlzLl9fam9pbnRzW2ldO1xuICAgICAgY29uc3QgZ2xvYmFsSm9pbnRUcmFuc2Zvcm0gPSBqb2ludC5tYXRyaXhJbm5lcjtcblxuICAgICAgY29uc3Qgam9pbnRNYXRyaXggPSBNdXRhYmxlTWF0cml4NDQubXVsdGlwbHlUbyhcbiAgICAgICAgaW52ZXJzZUdsb2JhbFRyYW5zZm9ybSxcbiAgICAgICAgTXV0YWJsZU1hdHJpeDQ0Lm11bHRpcGx5VHlwZWRBcnJheVRvKFxuICAgICAgICAgIGdsb2JhbEpvaW50VHJhbnNmb3JtLFxuICAgICAgICAgIHRoaXMuX19pbnZlcnNlQmluZE1hdHJpY2VzQWNjZXNzb3IhLmdldFR5cGVkQXJyYXkoKSxcbiAgICAgICAgICBTa2VsZXRhbENvbXBvbmVudC5fX3RtcF9tYXQ0LFxuICAgICAgICAgIGlcbiAgICAgICAgKSxcbiAgICAgICAgU2tlbGV0YWxDb21wb25lbnQuX190bXBfbWF0NF8zXG4gICAgICApO1xuICAgICAgaWYgKHRoaXMuX2JpbmRTaGFwZU1hdHJpeCkge1xuICAgICAgICAvLyBnbFRGMSBza2luczogdGhlIGJpbmQgc2hhcGUgbWF0cml4IGlzIGFwcGxpZWQgdG8gdmVydGljZXMgYmVmb3JlIHRoZSBpbnZlcnNlIGJpbmQgbWF0cml4XG4gICAgICAgIGpvaW50TWF0cml4Lm11bHRpcGx5KHRoaXMuX2JpbmRTaGFwZU1hdHJpeCk7XG4gICAgICB9XG4gICAgICBjb25zdCBtID0gam9pbnRNYXRyaXg7XG5cbiAgICAgIGlmIChpID09PSAwICYmIGpvaW50LmVudGl0eS50cnlUb0dldEFuaW1hdGlvbigpICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5fX2pvaW50TWF0cml4LmNvcHlDb21wb25lbnRzKG0pO1xuICAgICAgfVxuICAgICAgaWYgKGkgPT09IDEgJiYgdGhpcy5fX2pvaW50c1swXS5lbnRpdHkudHJ5VG9HZXRBbmltYXRpb24oKSA9PSBudWxsKSB7XG4gICAgICAgIC8vIGlmIHRoZSBmaXJzdCBqb2ludCBoYXMgbm8gYW5pbWF0aW9uIChlLmcuIFJvb3Qgam9pbnQpLCBleHBlY3QgdGhlIHNlY29uZCBqb2ludCB0byBoYXZlIGEgc2lnbmlmaWNhbnQgbWF0cml4XG4gICAgICAgIHRoaXMuX19qb2ludE1hdHJpeC5jb3B5Q29tcG9uZW50cyhtKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fX2lzV29ybGRNYXRyaXhWYW5pbGxhID0gZmFsc2U7XG5cbiAgICAgIGlmIChib25lRGF0YVR5cGUgPT09IEJvbmVEYXRhVHlwZS5NYXQ0M3gxKSB7XG4gICAgICAgIHRoaXMuX19jb3B5VG9NYXRBcnJheShtLCBpKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIERlY29tcG9zZSBNID0gVCAqIFIgKiBTOiBlYWNoIGNvbHVtbiBvZiB0aGUgdXBwZXItbGVmdCAzeDMgaXMgYW4gYXhpcyBvZiBSIG11bHRpcGxpZWQgYnkgaXRzIHNjYWxlXG4gICAgICBjb25zdCB2ID0gbS5fdjtcbiAgICAgIGNvbnN0IHN4ID0gTWF0aC5oeXBvdCh2WzBdLCB2WzFdLCB2WzJdKTtcbiAgICAgIGNvbnN0IHN5ID0gTWF0aC5oeXBvdCh2WzRdLCB2WzVdLCB2WzZdKTtcbiAgICAgIGNvbnN0IHN6ID0gTWF0aC5oeXBvdCh2WzhdLCB2WzldLCB2WzEwXSk7XG4gICAgICAvLyBBIG1pcnJvcmVkIG1hdHJpeCAoZGV0IDwgMCkgaXMgbm90IGEgcm90YXRpb24gdGltZXMgcG9zaXRpdmUgc2NhbGVzLCBzbyBpdCBuZWVkcyBhIG5lZ2F0aXZlIHNjYWxlXG4gICAgICBjb25zdCBpc01pcnJvcmVkID0gU2tlbGV0YWxDb21wb25lbnQuX19kZXRlcm1pbmFudDN4Myh2KSA8IDA7XG5cbiAgICAgIGlmIChib25lRGF0YVR5cGUgPT09IEJvbmVEYXRhVHlwZS5WZWM0eDIpIHtcbiAgICAgICAgLy8gTmVnYXRlIHRoZSB4IHNjYWxlIG9mIGEgbWlycm9yZWQgbWF0cml4IHNvIHRoYXQgUiBpcyBhIHByb3BlciByb3RhdGlvblxuICAgICAgICBjb25zdCBzaWduZWRTeCA9IGlzTWlycm9yZWQgPyAtc3ggOiBzeDtcbiAgICAgICAgY29uc3QgcSA9IFNrZWxldGFsQ29tcG9uZW50Ll9fZXh0cmFjdFJvdGF0aW9uKG0sIHNpZ25lZFN4LCBzeSwgc3opO1xuICAgICAgICBjb25zdCBsb2dRdWF0ID0gTWF0aFV0aWwuZW5jb2RlTG9nUXVhdChxLngsIHEueSwgcS56LCBxLncpO1xuICAgICAgICAvLyBbdHJhbnNsYXRpb24ueHl6LCBsb2dRdWF0LmxvXSwgW3NjYWxlLnh5eiwgbG9nUXVhdC5oaV1cbiAgICAgICAgY29uc3QgYmFzZSA9IGkgKiA4O1xuICAgICAgICBib25lRGF0YVtiYXNlICsgMF0gPSB2WzEyXTtcbiAgICAgICAgYm9uZURhdGFbYmFzZSArIDFdID0gdlsxM107XG4gICAgICAgIGJvbmVEYXRhW2Jhc2UgKyAyXSA9IHZbMTRdO1xuICAgICAgICBib25lRGF0YVVpbnQzMltiYXNlICsgM10gPSBsb2dRdWF0WzBdO1xuICAgICAgICBib25lRGF0YVtiYXNlICsgNF0gPSBzaWduZWRTeDtcbiAgICAgICAgYm9uZURhdGFbYmFzZSArIDVdID0gc3k7XG4gICAgICAgIGJvbmVEYXRhW2Jhc2UgKyA2XSA9IHN6O1xuICAgICAgICBib25lRGF0YVVpbnQzMltiYXNlICsgN10gPSBsb2dRdWF0WzFdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVmVjNHgxIHN1cHBvcnRzIG9ubHkgdW5pZm9ybSBzY2FsZTogdGhlIGxhcmdlc3Qgb25lIGlzIHVzZWRcbiAgICAgICAgaWYgKCFoYXNOb25Vbmlmb3JtU2NhbGUgJiYgIU1hdGhVdGlsLmlzVW5pZm9ybVNjYWxlKHN4LCBzeSwgc3opKSB7XG4gICAgICAgICAgaGFzTm9uVW5pZm9ybVNjYWxlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBSZXByZXNlbnQgYSBtaXJyb3JlZCBtYXRyaXggYXMgUiAqICgtcyk6IG5lZ2F0ZSBhbGwgdGhlIGF4ZXMgc28gdGhhdCBSIGlzIGEgcHJvcGVyIHJvdGF0aW9uXG4gICAgICAgIGNvbnN0IHNpZ24gPSBpc01pcnJvcmVkID8gLTEgOiAxO1xuICAgICAgICBjb25zdCBxID0gU2tlbGV0YWxDb21wb25lbnQuX19leHRyYWN0Um90YXRpb24obSwgc2lnbiAqIHN4LCBzaWduICogc3ksIHNpZ24gKiBzeik7XG4gICAgICAgIGNvbnN0IGxvZ1F1YXQgPSBNYXRoVXRpbC5lbmNvZGVMb2dRdWF0KHEueCwgcS55LCBxLnosIHEudyk7XG4gICAgICAgIC8vIFtsb2dRdWF0LmxvLCBsb2dRdWF0LmhpIChiaXQgMzE6IG5lZ2F0aXZlIHNjYWxlKSwgcGFja2VkVHJhbnNsYXRlU2NhbGUubG8sIHBhY2tlZFRyYW5zbGF0ZVNjYWxlLmhpXVxuICAgICAgICAvLyBUaGUgdHJhbnNsYXRpb24gYW5kIHRoZSBzY2FsZSBhcmUgcGFja2VkIGFmdGVyIHRoaXMgbG9vcCwgYXMgdGhlIHRyYW5zbGF0aW9uIGlzIG5vcm1hbGl6ZWQgYnkgdGhlIG1heC5cbiAgICAgICAgdHJhbnNsYXRlU2NhbGVXb3JrW2kgKiA0ICsgMF0gPSB2WzEyXTtcbiAgICAgICAgdHJhbnNsYXRlU2NhbGVXb3JrW2kgKiA0ICsgMV0gPSB2WzEzXTtcbiAgICAgICAgdHJhbnNsYXRlU2NhbGVXb3JrW2kgKiA0ICsgMl0gPSB2WzE0XTtcbiAgICAgICAgdHJhbnNsYXRlU2NhbGVXb3JrW2kgKiA0ICsgM10gPSBNYXRoLm1heChzeCwgc3ksIHN6KTtcbiAgICAgICAgYm9uZURhdGFVaW50MzJbaSAqIDQgKyAwXSA9IGxvZ1F1YXRbMF07XG4gICAgICAgIGJvbmVEYXRhVWludDMyW2kgKiA0ICsgMV0gPSBpc01pcnJvcmVkID8gKGxvZ1F1YXRbMV0gfCBWRUM0WDFfTkVHQVRJVkVfU0NBTEVfQklUKSA+Pj4gMCA6IGxvZ1F1YXRbMV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGhhc05vblVuaWZvcm1TY2FsZSAmJiB0aGlzLl9faGFuZGxlTm9uVW5pZm9ybVNjYWxlT2ZWZWM0eDEoKSkge1xuICAgICAgLy8gU3dpdGNoZWQgdG8gVmVjNHgyOiBjb21wdXRlIGFnYWluIHdpdGggdGhlIG5ldyBsYXlvdXQgKHRoZSBza2lubmluZyBjYWNoZSBrZXkgY2hhbmdlcyBhcyB3ZWxsKVxuICAgICAgdGhpcy4kbG9naWMoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoYm9uZURhdGFUeXBlID09PSBCb25lRGF0YVR5cGUuVmVjNHgxKSB7XG4gICAgICBsZXQgbWF4QWJzWCA9IDE7XG4gICAgICBsZXQgbWF4QWJzWSA9IDE7XG4gICAgICBsZXQgbWF4QWJzWiA9IDE7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX19qb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgYWJzWCA9IE1hdGguYWJzKHRyYW5zbGF0ZVNjYWxlV29ya1tpICogNCArIDBdKTtcbiAgICAgICAgaWYgKGFic1ggPiBtYXhBYnNYKSB7XG4gICAgICAgICAgbWF4QWJzWCA9IGFic1g7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYWJzWSA9IE1hdGguYWJzKHRyYW5zbGF0ZVNjYWxlV29ya1tpICogNCArIDFdKTtcbiAgICAgICAgaWYgKGFic1kgPiBtYXhBYnNZKSB7XG4gICAgICAgICAgbWF4QWJzWSA9IGFic1k7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYWJzWiA9IE1hdGguYWJzKHRyYW5zbGF0ZVNjYWxlV29ya1tpICogNCArIDJdKTtcbiAgICAgICAgaWYgKGFic1ogPiBtYXhBYnNaKSB7XG4gICAgICAgICAgbWF4QWJzWiA9IGFic1o7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9fam9pbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIC8vIFBhY2sgdGhlIG5vcm1hbGl6ZWQgdHJhbnNsYXRpb24gYW5kIHRoZSB1bmlmb3JtIHNjYWxlIChpbiBsb2cyIHNwYWNlLCBzbyB0aGF0IHNjYWxlcyBvdmVyIDEgYXJlIGtlcHQpXG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRYID0gdHJhbnNsYXRlU2NhbGVXb3JrW2kgKiA0ICsgMF0gLyBtYXhBYnNYO1xuICAgICAgICBjb25zdCBub3JtYWxpemVkWSA9IHRyYW5zbGF0ZVNjYWxlV29ya1tpICogNCArIDFdIC8gbWF4QWJzWTtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZFogPSB0cmFuc2xhdGVTY2FsZVdvcmtbaSAqIDQgKyAyXSAvIG1heEFic1o7XG4gICAgICAgIGNvbnN0IGVuY29kZWRTY2FsZSA9IE1hdGhVdGlsLmVuY29kZVZlYzR4MVNjYWxlKHRyYW5zbGF0ZVNjYWxlV29ya1tpICogNCArIDNdKTtcblxuICAgICAgICBjb25zdCB2ZWMyVFBhY2tlZCA9IE1hdGhVdGlsLnBhY2tTbm9ybVZlYzRUb1VWZWMyKG5vcm1hbGl6ZWRYLCBub3JtYWxpemVkWSwgbm9ybWFsaXplZFosIGVuY29kZWRTY2FsZSk7XG4gICAgICAgIGJvbmVEYXRhVWludDMyW2kgKiA0ICsgMl0gPSB2ZWMyVFBhY2tlZFswXTtcbiAgICAgICAgYm9uZURhdGFVaW50MzJbaSAqIDQgKyAzXSA9IHZlYzJUUGFja2VkWzFdO1xuICAgICAgfVxuICAgICAgdGhpcy5fX3NldEJvbmVEYXRhSW5mbyhtYXhBYnNYLCBtYXhBYnNZLCBtYXhBYnNaLCBib25lRGF0YVR5cGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9fc2V0Qm9uZURhdGFJbmZvKDEsIDEsIDEsIGJvbmVEYXRhVHlwZSk7XG4gICAgfVxuXG4gICAgaWYgKGNhY2hlS2V5KSB7XG4gICAgICBTa2VsZXRhbENvbXBvbmVudC5fX3NraW5DYWxjdWxhdGlvbkNhY2hlLnNldChjYWNoZUtleSwgdGhpcy5fX2NyZWF0ZVNraW5uaW5nQ2FjaGUoY3VycmVudFByb2Nlc3NGcmFtZVRva2VuKSk7XG4gICAgfVxuICAgIHRoaXMuX19yZWNvcmRTa2luQ29tcHV0ZVNpZ25hdHVyZShjYWNoZUtleSk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyB0aGUgZGV0ZXJtaW5hbnQgb2YgdGhlIHVwcGVyLWxlZnQgM3gzIHBhcnQgb2YgYSBjb2x1bW4tbWFqb3IgNHg0IG1hdHJpeC5cbiAgICpcbiAgICogQHBhcmFtIHYgLSBUaGUgbWF0cml4IGVsZW1lbnRzIChjb2x1bW4tbWFqb3IpXG4gICAqIEByZXR1cm5zIFRoZSBkZXRlcm1pbmFudFxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19kZXRlcm1pbmFudDN4Myh2OiBBcnJheUxpa2U8bnVtYmVyPikge1xuICAgIC8vIGMwIC4gKGMxIHggYzIpXG4gICAgcmV0dXJuIChcbiAgICAgIHZbMF0gKiAodls1XSAqIHZbMTBdIC0gdls2XSAqIHZbOV0pICsgdlsxXSAqICh2WzZdICogdls4XSAtIHZbNF0gKiB2WzEwXSkgKyB2WzJdICogKHZbNF0gKiB2WzldIC0gdls1XSAqIHZbOF0pXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHRyYWN0cyB0aGUgcm90YXRpb24gUiBvZiBNID0gVCAqIFIgKiBTLCBnaXZlbiB0aGUgKHNpZ25lZCkgc2NhbGVzIG9mIFMuXG4gICAqIFRoZSBjb2x1bW5zIG9mIHRoZSB1cHBlci1sZWZ0IDN4MyBvZiBgbWAgYXJlIGRpdmlkZWQgYnkgdGhlIHNjYWxlcyBpbiBwbGFjZS5cbiAgICpcbiAgICogSWYgdGhlIHJvdGF0aW9uIGNhbm5vdCBiZSBleHRyYWN0ZWQgKGUuZy4gYSB6ZXJvIHNjYWxlIHVzZWQgdG8gaGlkZSBhIHBhcnQgb2YgYSBtZXNoKSwgdGhlIGlkZW50aXR5IGlzXG4gICAqIHJldHVybmVkIHdpdGhvdXQgbG9nZ2luZyBhbiBlcnJvciwgc2luY2UgdGhlIHJvdGF0aW9uIGRvZXMgbm90IGFmZmVjdCB0aGUgcmVzdWx0IGluIHRoYXQgY2FzZS5cbiAgICpcbiAgICogQHBhcmFtIG0gLSBUaGUgbWF0cml4IHRvIGRlY29tcG9zZSAob3ZlcndyaXR0ZW4pXG4gICAqIEBwYXJhbSBzeCAtIFRoZSB4IHNjYWxlIChuZWdhdGl2ZSBmb3IgYSBtaXJyb3JlZCBheGlzKVxuICAgKiBAcGFyYW0gc3kgLSBUaGUgeSBzY2FsZSAobmVnYXRpdmUgZm9yIGEgbWlycm9yZWQgYXhpcylcbiAgICogQHBhcmFtIHN6IC0gVGhlIHogc2NhbGUgKG5lZ2F0aXZlIGZvciBhIG1pcnJvcmVkIGF4aXMpXG4gICAqIEByZXR1cm5zIFRoZSByb3RhdGlvbiAoYSBzaGFyZWQgdGVtcG9yYXJ5IHF1YXRlcm5pb24pXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2V4dHJhY3RSb3RhdGlvbihtOiBNdXRhYmxlTWF0cml4NDQsIHN4OiBudW1iZXIsIHN5OiBudW1iZXIsIHN6OiBudW1iZXIpIHtcbiAgICBjb25zdCB2ID0gbS5fdjtcbiAgICBjb25zdCBpbnZTeCA9IDEgLyBzeDtcbiAgICBjb25zdCBpbnZTeSA9IDEgLyBzeTtcbiAgICBjb25zdCBpbnZTeiA9IDEgLyBzejtcbiAgICB2WzBdICo9IGludlN4O1xuICAgIHZbMV0gKj0gaW52U3g7XG4gICAgdlsyXSAqPSBpbnZTeDtcbiAgICB2WzRdICo9IGludlN5O1xuICAgIHZbNV0gKj0gaW52U3k7XG4gICAgdls2XSAqPSBpbnZTeTtcbiAgICB2WzhdICo9IGludlN6O1xuICAgIHZbOV0gKj0gaW52U3o7XG4gICAgdlsxMF0gKj0gaW52U3o7XG4gICAgY29uc3QgcSA9IFNrZWxldGFsQ29tcG9uZW50Ll9fdG1wX3E7XG4gICAgaWYgKCFxLnRyeUZyb21NYXRyaXgobSkpIHtcbiAgICAgIHEuc2V0Q29tcG9uZW50cygwLCAwLCAwLCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHE7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBhIG5vbi11bmlmb3JtIHNjYWxlIGZvdW5kIHdpdGggdGhlIFZlYzR4MSBib25lIGRhdGEgdHlwZSwgd2hpY2ggc3VwcG9ydHMgb25seSB1bmlmb3JtIHNjYWxlLlxuICAgKiBBbiBhdXRvbWF0aWNhbGx5IHNlbGVjdGVkIFZlYzR4MSBpcyBzd2l0Y2hlZCB0byBWZWM0eDIuIEFuIGV4cGxpY2l0bHkgc3BlY2lmaWVkIFZlYzR4MSAoc2V0Qm9uZURhdGFUeXBlIG9yXG4gICAqIENvbmZpZy5ib25lRGF0YVR5cGUpIGlzIGtlcHQsIGFuZCBhIHdhcm5pbmcgaXMgbG9nZ2VkIG9uY2UgKHRoZSBsYXJnZXN0IHNjYWxlIG9mIGVhY2ggam9pbnQgaXMgdXNlZCkuXG4gICAqXG4gICAqIFRoZSBjb21wb25lbnRzIHNoYXJpbmcgdGhlIHNraW5uaW5nIGNhY2hlIHdpdGggdGhpcyBvbmUgYXJlIHN3aXRjaGVkIHRvZ2V0aGVyLiBPdGhlcndpc2UgdGhleSB3b3VsZCBnZXRcbiAgICogYSBkaWZmZXJlbnQgY2FjaGUga2V5IGFuZCBsb3NlIHRoZSBzaGFyZWQgcmVzdWx0LCBhbmQgYSBmb2xsb3dlciB3b3VsZCBmYWxsIGJhY2sgdG8gaXRzIG93biBqb2ludHMsIHdoaWNoXG4gICAqIG1heSBub3QgYmUgYW5pbWF0ZWQgKHNlZSB0aGUgQW5pbWF0aW9uQ29tcG9uZW50IGVhcmx5IHJldHVybikuIElmIGFueSBvZiB0aGVtIHNwZWNpZmllcyBWZWM0eDEgZXhwbGljaXRseSxcbiAgICogbm9uZSBvZiB0aGVtIGlzIHN3aXRjaGVkLlxuICAgKlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBib25lIGRhdGEgdHlwZSBoYXMgYmVlbiBzd2l0Y2hlZCB0byBWZWM0eDJcbiAgICovXG4gIHByaXZhdGUgX19oYW5kbGVOb25Vbmlmb3JtU2NhbGVPZlZlYzR4MSgpOiBib29sZWFuIHtcbiAgICBjb25zdCBzaGFyaW5nQ29tcG9uZW50cyA9IHRoaXMuX19nZXRDb21wb25lbnRzU2hhcmluZ1NraW5DYWNoZSgpO1xuICAgIGlmIChcbiAgICAgIHRoaXMuX19lbmdpbmUuY29uZmlnLmJvbmVEYXRhVHlwZSA9PSBudWxsICYmXG4gICAgICBzaGFyaW5nQ29tcG9uZW50cy5ldmVyeShjb21wb25lbnQgPT4gY29tcG9uZW50Ll9faXNCb25lRGF0YVR5cGVBdXRvU2VsZWN0ZWQpXG4gICAgKSB7XG4gICAgICBmb3IgKGNvbnN0IGNvbXBvbmVudCBvZiBzaGFyaW5nQ29tcG9uZW50cykge1xuICAgICAgICBjb21wb25lbnQuc2V0Qm9uZURhdGFUeXBlKEJvbmVEYXRhVHlwZS5WZWM0eDIsIHRydWUpO1xuICAgICAgfVxuICAgICAgdGhpcy5fX2VuZ2luZS5sb2dnZXIuaW5mbyhcbiAgICAgICAgYFNrZWxldGFsQ29tcG9uZW50IChlbnRpdHkgJHt0aGlzLmVudGl0eVVJRH0pOiBzd2l0Y2hlZCB0aGUgYm9uZSBkYXRhIHR5cGUgZnJvbSBWZWM0eDEgdG8gVmVjNHgyIGJlY2F1c2UgYSBub24tdW5pZm9ybSBzY2FsZSB3YXMgZm91bmQgKCR7c2hhcmluZ0NvbXBvbmVudHMubGVuZ3RofSBjb21wb25lbnQocykgc2hhcmluZyB0aGUgc2tpbm5pbmcgY2FjaGUpLmBcbiAgICAgICk7XG4gICAgICByZXR1cm4gdGhpcy5fX2FsbG9jYXRlZEJvbmVEYXRhVHlwZSA9PT0gQm9uZURhdGFUeXBlLlZlYzR4MjtcbiAgICB9XG4gICAgaWYgKCF0aGlzLl9faGFzV2FybmVkTm9uVW5pZm9ybVNjYWxlKSB7XG4gICAgICB0aGlzLl9faGFzV2FybmVkTm9uVW5pZm9ybVNjYWxlID0gdHJ1ZTtcbiAgICAgIHRoaXMuX19lbmdpbmUubG9nZ2VyLndhcm4oXG4gICAgICAgIGBTa2VsZXRhbENvbXBvbmVudCAoZW50aXR5ICR7dGhpcy5lbnRpdHlVSUR9KTogdGhlIFZlYzR4MSBib25lIGRhdGEgdHlwZSBzdXBwb3J0cyBvbmx5IHVuaWZvcm0gc2NhbGUsIGJ1dCBhIG5vbi11bmlmb3JtIHNjYWxlIHdhcyBmb3VuZC4gVGhlIGxhcmdlc3Qgc2NhbGUgaXMgdXNlZC4gVXNlIFZlYzR4MiBvciBNYXQ0M3gxIGZvciB0aGlzIHNrZWxldG9uLmBcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBza2VsZXRhbCBjb21wb25lbnRzIHRoYXQgc2hhcmUgdGhlIHNraW5uaW5nIGNhY2hlIHdpdGggdGhpcyBjb21wb25lbnQgKGluY2x1ZGluZyB0aGlzIG9uZSkuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBjb21wb25lbnRzIHdpdGggdGhlIHNhbWUgc2tpbm5pbmcgY2FjaGUga2V5XG4gICAqL1xuICBwcml2YXRlIF9fZ2V0Q29tcG9uZW50c1NoYXJpbmdTa2luQ2FjaGUoKTogU2tlbGV0YWxDb21wb25lbnRbXSB7XG4gICAgY29uc3Qga2V5ID0gdGhpcy5fX3NraW5DYWNoZUtleTtcbiAgICBpZiAoa2V5ID09IG51bGwpIHtcbiAgICAgIHJldHVybiBbdGhpc107XG4gICAgfVxuICAgIGNvbnN0IGNvbXBvbmVudHMgPSAodGhpcy5fX2VuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudHNXaXRoVHlwZShTa2VsZXRhbENvbXBvbmVudCkgPz9cbiAgICAgIFtdKSBhcyBTa2VsZXRhbENvbXBvbmVudFtdO1xuICAgIHJldHVybiBjb21wb25lbnRzLmZpbHRlcihjb21wb25lbnQgPT4gY29tcG9uZW50ID09PSB0aGlzIHx8IGNvbXBvbmVudC5fX3NraW5DYWNoZUtleSA9PT0ga2V5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgQ1BVLXNpZGUgd29yayBidWZmZXIgZm9yIHRyYW5zbGF0aW9uIGFuZCBzY2FsZSAodXNlZCBvbmx5IGluIFZlYzR4MSBib25lIGRhdGEgdHlwZSkuXG4gICAqXG4gICAqIEBwYXJhbSBib25lRGF0YVR5cGUgLSBUaGUgYm9uZSBkYXRhIHR5cGVcbiAgICogQHJldHVybnMgVGhlIHdvcmsgYnVmZmVyIChlbXB0eSB1bmxlc3MgVmVjNHgxKVxuICAgKi9cbiAgcHJpdmF0ZSBfX2dldFRyYW5zbGF0ZVNjYWxlV29yayhib25lRGF0YVR5cGU6IEJvbmVEYXRhVHlwZUVudW0pIHtcbiAgICBpZiAoYm9uZURhdGFUeXBlICE9PSBCb25lRGF0YVR5cGUuVmVjNHgxKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX2JvbmVUcmFuc2xhdGVTY2FsZVdvcms7XG4gICAgfVxuICAgIGNvbnN0IHJlcXVpcmVkTGVuZ3RoID0gdGhpcy5fX2pvaW50cy5sZW5ndGggKiA0O1xuICAgIGlmICh0aGlzLl9fYm9uZVRyYW5zbGF0ZVNjYWxlV29yay5sZW5ndGggPCByZXF1aXJlZExlbmd0aCkge1xuICAgICAgdGhpcy5fX2JvbmVUcmFuc2xhdGVTY2FsZVdvcmsgPSBuZXcgRmxvYXQzMkFycmF5KHJlcXVpcmVkTGVuZ3RoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX19ib25lVHJhbnNsYXRlU2NhbGVXb3JrO1xuICB9XG5cbiAgLyoqXG4gICAqIENvcGllcyBtYXRyaXggZGF0YSB0byB0aGUgbWF0cml4IGFycmF5IGluIGEgc3BlY2lmaWMgZm9ybWF0LlxuICAgKiBFeHRyYWN0cyB0aGUgZmlyc3QgMyByb3dzIG9mIGEgNHg0IG1hdHJpeCAoTWF0NDMgZm9ybWF0KSBmb3IgZWZmaWNpZW50IEdQVSBzdG9yYWdlLlxuICAgKlxuICAgKiBAcGFyYW0gbSAtIFRoZSBzb3VyY2UgbWF0cml4IHRvIGNvcHkgZnJvbVxuICAgKiBAcGFyYW0gaSAtIFRoZSBpbmRleCBvZiB0aGUgam9pbnQvYm9uZVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2NvcHlUb01hdEFycmF5KG06IElNYXRyaXg0NCwgaTogSW5kZXgpIHtcbiAgICAvLyAwICAxICAyICAzXG4gICAgLy8gNCAgNSAgNiAgN1xuICAgIC8vIDggIDkgIDEwIDExXG4gICAgLy8gMTIgMTMgMTQgMTVcblxuICAgIHRoaXMuX2JvbmVEYXRhLl92W2kgKiAxMiArIDBdID0gbS5fdlswXTtcbiAgICB0aGlzLl9ib25lRGF0YS5fdltpICogMTIgKyAxXSA9IG0uX3ZbMV07XG4gICAgdGhpcy5fYm9uZURhdGEuX3ZbaSAqIDEyICsgMl0gPSBtLl92WzJdO1xuICAgIHRoaXMuX2JvbmVEYXRhLl92W2kgKiAxMiArIDNdID0gbS5fdls0XTtcbiAgICB0aGlzLl9ib25lRGF0YS5fdltpICogMTIgKyA0XSA9IG0uX3ZbNV07XG4gICAgdGhpcy5fYm9uZURhdGEuX3ZbaSAqIDEyICsgNV0gPSBtLl92WzZdO1xuICAgIHRoaXMuX2JvbmVEYXRhLl92W2kgKiAxMiArIDZdID0gbS5fdls4XTtcbiAgICB0aGlzLl9ib25lRGF0YS5fdltpICogMTIgKyA3XSA9IG0uX3ZbOV07XG4gICAgdGhpcy5fYm9uZURhdGEuX3ZbaSAqIDEyICsgOF0gPSBtLl92WzEwXTtcbiAgICB0aGlzLl9ib25lRGF0YS5fdltpICogMTIgKyA5XSA9IG0uX3ZbMTJdO1xuICAgIHRoaXMuX2JvbmVEYXRhLl92W2kgKiAxMiArIDEwXSA9IG0uX3ZbMTNdO1xuICAgIHRoaXMuX2JvbmVEYXRhLl92W2kgKiAxMiArIDExXSA9IG0uX3ZbMTRdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGludmVyc2UgYmluZCBtYXRyaWNlcyBhY2Nlc3Nvci5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGFjY2Vzc29yIGNvbnRhaW5pbmcgaW52ZXJzZSBiaW5kIG1hdHJpY2VzLCBvciB1bmRlZmluZWQgaWYgbm90IHNldFxuICAgKi9cbiAgcHVibGljIGdldEludmVyc2VCaW5kTWF0cmljZXNBY2Nlc3NvcigpOiBBY2Nlc3NvciB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX19pbnZlcnNlQmluZE1hdHJpY2VzQWNjZXNzb3I7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgYSBzaGFsbG93IGNvcHkgZnJvbSBhbm90aGVyIFNrZWxldGFsQ29tcG9uZW50LlxuICAgKiBDb3BpZXMgYWxsIHJlbGV2YW50IHNrZWxldGFsIGRhdGEgd2l0aG91dCBkZWVwIGNsb25pbmcgY29tcGxleCBvYmplY3RzLlxuICAgKlxuICAgKiBAcGFyYW0gY29tcG9uZW50XyAtIFRoZSBzb3VyY2UgY29tcG9uZW50IHRvIGNvcHkgZnJvbVxuICAgKiBAcHJvdGVjdGVkXG4gICAqL1xuICBfc2hhbGxvd0NvcHlGcm9tKGNvbXBvbmVudF86IENvbXBvbmVudCk6IHZvaWQge1xuICAgIGNvbnN0IGNvbXBvbmVudCA9IGNvbXBvbmVudF8gYXMgU2tlbGV0YWxDb21wb25lbnQ7XG5cbiAgICB0aGlzLl9qb2ludEluZGljZXMgPSBjb21wb25lbnQuX2pvaW50SW5kaWNlcy5jb25jYXQoKTtcbiAgICB0aGlzLl9fYm9uZURhdGFUeXBlID0gY29tcG9uZW50Ll9fYm9uZURhdGFUeXBlO1xuICAgIHRoaXMuX19pc0JvbmVEYXRhVHlwZUF1dG9TZWxlY3RlZCA9IGNvbXBvbmVudC5fX2lzQm9uZURhdGFUeXBlQXV0b1NlbGVjdGVkO1xuXG4gICAgaWYgKGNvbXBvbmVudC5fX2pvaW50cy5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLnNldEpvaW50cyhjb21wb25lbnQuX19qb2ludHMuY29uY2F0KCkpO1xuICAgICAgdGhpcy5fX2NvcHlCb25lQnVmZmVyc0Zyb20oY29tcG9uZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fX2pvaW50cyA9IFtdO1xuICAgICAgdGhpcy5fX2ludmFsaWRhdGVTa2luQ29tcHV0ZVNpZ25hdHVyZSgpO1xuICAgIH1cblxuICAgIHRoaXMuX19pbnZlcnNlQmluZE1hdHJpY2VzQWNjZXNzb3IgPSBjb21wb25lbnQuX19pbnZlcnNlQmluZE1hdHJpY2VzQWNjZXNzb3I7XG4gICAgaWYgKElzLmV4aXN0KGNvbXBvbmVudC5fYmluZFNoYXBlTWF0cml4KSkge1xuICAgICAgdGhpcy5fYmluZFNoYXBlTWF0cml4ID0gY29tcG9uZW50Ll9iaW5kU2hhcGVNYXRyaXguY2xvbmUoKTtcbiAgICB9XG4gICAgdGhpcy50b3BPZkpvaW50c0hpZXJhcmNoeSA9IGNvbXBvbmVudC50b3BPZkpvaW50c0hpZXJhcmNoeTtcbiAgICB0aGlzLmlzU2tpbm5pbmcgPSBjb21wb25lbnQuaXNTa2lubmluZztcbiAgICB0aGlzLl9fam9pbnRNYXRyaXguY29weUNvbXBvbmVudHMoY29tcG9uZW50Ll9fam9pbnRNYXRyaXgpO1xuICAgIHRoaXMuX19pc1dvcmxkTWF0cml4VmFuaWxsYSA9IGNvbXBvbmVudC5fX2lzV29ybGRNYXRyaXhWYW5pbGxhO1xuICAgIHRoaXMuX19pbnZlcnNlQmluZE1hdHJpY2VzU2lnbmF0dXJlID0gY29tcG9uZW50Ll9faW52ZXJzZUJpbmRNYXRyaWNlc1NpZ25hdHVyZTtcbiAgICB0aGlzLl9fam9pbnRMaXN0S2V5ID0gY29tcG9uZW50Ll9fam9pbnRMaXN0S2V5O1xuICAgIHRoaXMuX191cGRhdGVTa2luQ2FjaGVLZXkoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBlbnRpdHkgdGhhdCBvd25zIHRoaXMgY29tcG9uZW50LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZW50aXR5IHdpdGggc2tlbGV0YWwgY2FwYWJpbGl0aWVzIHRoYXQgaGFzIHRoaXMgY29tcG9uZW50XG4gICAqL1xuICBnZXQgZW50aXR5KCk6IElTa2VsZXRhbEVudGl0eSB7XG4gICAgcmV0dXJuIHRoaXMuX19lbmdpbmUuZW50aXR5UmVwb3NpdG9yeS5nZXRFbnRpdHkodGhpcy5fX2VudGl0eVVpZCkgYXMgdW5rbm93biBhcyBJU2tlbGV0YWxFbnRpdHk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhpcyBjb21wb25lbnQgYW5kIGNsZWFucyB1cCByZXNvdXJjZXMuXG4gICAqXG4gICAqIEBwcm90ZWN0ZWRcbiAgICovXG4gIF9kZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuX19pbnZhbGlkYXRlU2tpbkNvbXB1dGVTaWduYXR1cmUoKTtcbiAgICBzdXBlci5fZGVzdHJveSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhbiBlbnRpdHkncyBBbmltYXRpb25Db21wb25lbnQgY2FuIHBlcmZvcm0gZWFybHkgcmV0dXJuLlxuICAgKlxuICAgKiBUaGlzIGlzIGNhbGxlZCBieSBBbmltYXRpb25Db21wb25lbnQuJGxvZ2ljIHRvIGRldGVybWluZSBpZiBhbmltYXRpb24gY2FsY3VsYXRpb25zXG4gICAqIGNhbiBiZSBza2lwcGVkLiBBbiBlbnRpdHkgaXMgY29uc2lkZXJlZCBcImNhY2hlZFwiIGlmOlxuICAgKiAxLiBJdHMgU2tlbGV0YWxDb21wb25lbnQgaGFkIGEgc2tpbm5pbmcgY2FjaGUgaGl0IGluIHRoZSBwcmV2aW91cyBmcmFtZVxuICAgKiAyLiBJdCBpcyBOT1QgYSBcImxlYWRlclwiIGpvaW50IChsZWFkZXJzIG11c3QgY29udGludWUgYW5pbWF0aW5nKVxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBhbHNvIGhhbmRsZXMgdGhlIGZyYW1lIHRyYW5zaXRpb24gKHN3YXBwaW5nIGN1cnJlbnQvcHJldmlvdXMgY2FjaGVkIFVJRHMpXG4gICAqIHNpbmNlIEFuaW1hdGlvbkNvbXBvbmVudC4kbG9naWMgcnVucyBiZWZvcmUgU2tlbGV0YWxDb21wb25lbnQuJGxvZ2ljIGluIGVhY2ggZnJhbWUuXG4gICAqXG4gICAqIEBwYXJhbSBlbnRpdHlVSUQgLSBUaGUgZW50aXR5IFVJRCB0byBjaGVjayAodHlwaWNhbGx5IGEgam9pbnQvYm9uZSBlbnRpdHkpXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlIGZvciBtdWx0aS1lbmdpbmUgc3VwcG9ydFxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBlbnRpdHkgY2FuIHNraXAgYW5pbWF0aW9uIGNhbGN1bGF0aW9uLCBmYWxzZSBpZiBpdCBtdXN0IGFuaW1hdGVcbiAgICovXG4gIHN0YXRpYyBpc0VudGl0eUNhY2hlZChlbnRpdHlVSUQ6IEVudGl0eVVJRCwgZW5naW5lOiBFbmdpbmUpOiBib29sZWFuIHtcbiAgICByZXR1cm4gQW5pbWF0aW9uU3RhdGVSZXBvc2l0b3J5LmlzRW50aXR5Q2FjaGVkKGVudGl0eVVJRCwgZW5naW5lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoaXMgY29tcG9uZW50IHRvIGFuIGVudGl0eSwgZXh0ZW5kaW5nIGl0IHdpdGggc2tlbGV0YWwgZnVuY3Rpb25hbGl0eS5cbiAgICogVGhpcyBtZXRob2QgdXNlcyBtaXhpbnMgdG8gYWRkIHNrZWxldGFsLXNwZWNpZmljIG1ldGhvZHMgdG8gdGhlIHRhcmdldCBlbnRpdHkuXG4gICAqXG4gICAqIEBwYXJhbSBiYXNlIC0gVGhlIHRhcmdldCBlbnRpdHkgdG8gZXh0ZW5kXG4gICAqIEBwYXJhbSBfY29tcG9uZW50Q2xhc3MgLSBUaGUgY29tcG9uZW50IGNsYXNzIGJlaW5nIGFkZGVkXG4gICAqIEByZXR1cm5zIFRoZSBlbnRpdHkgZXh0ZW5kZWQgd2l0aCBza2VsZXRhbCBjb21wb25lbnQgbWV0aG9kc1xuICAgKiBAb3ZlcnJpZGVcbiAgICovXG4gIGFkZFRoaXNDb21wb25lbnRUb0VudGl0eTxFbnRpdHlCYXNlIGV4dGVuZHMgSUVudGl0eSwgU29tZUNvbXBvbmVudENsYXNzIGV4dGVuZHMgdHlwZW9mIENvbXBvbmVudD4oXG4gICAgYmFzZTogRW50aXR5QmFzZSxcbiAgICBfY29tcG9uZW50Q2xhc3M6IFNvbWVDb21wb25lbnRDbGFzc1xuICApIHtcbiAgICBjbGFzcyBTa2VsZXRhbEVudGl0eSBleHRlbmRzIChiYXNlLmNvbnN0cnVjdG9yIGFzIGFueSkge1xuICAgICAgZ2V0U2tlbGV0YWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldENvbXBvbmVudEJ5Q29tcG9uZW50VElEKFdlbGxLbm93bkNvbXBvbmVudFRJRHMuU2tlbGV0YWxDb21wb25lbnRUSUQpIGFzIFNrZWxldGFsQ29tcG9uZW50O1xuICAgICAgfVxuICAgIH1cbiAgICBhcHBseU1peGlucyhiYXNlLCBTa2VsZXRhbEVudGl0eSk7XG4gICAgcmV0dXJuIGJhc2UgYXMgdW5rbm93biBhcyBDb21wb25lbnRUb0NvbXBvbmVudE1ldGhvZHM8U29tZUNvbXBvbmVudENsYXNzPiAmIEVudGl0eUJhc2U7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW52ZXJzZSBiaW5kIG1hdHJpeCBmb3IgYSBzcGVjaWZpYyBqb2ludC5cbiAgICpcbiAgICogQHBhcmFtIHNnIC0gVGhlIFNjZW5lR3JhcGhDb21wb25lbnQgcmVwcmVzZW50aW5nIHRoZSBqb2ludFxuICAgKiBAcmV0dXJucyBUaGUgaW52ZXJzZSBiaW5kIG1hdHJpeCBmb3IgdGhlIHNwZWNpZmllZCBqb2ludFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2dldEludmVyc2VCaW5kTWF0cmljZXMoc2c6IFNjZW5lR3JhcGhDb21wb25lbnQpOiBJTWF0cml4NDQge1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5fX2pvaW50cy5pbmRleE9mKHNnKTtcbiAgICBjb25zdCBmbG9hdDMyQXJyYXkgPSB0aGlzLl9faW52ZXJzZUJpbmRNYXRyaWNlc0FjY2Vzc29yIS5nZXRUeXBlZEFycmF5KCkgYXMgRmxvYXQzMkFycmF5O1xuICAgIGNvbnN0IG0gPSBuZXcgTWF0cml4NDQoZmxvYXQzMkFycmF5LnNsaWNlKGluZGV4ICogMTYsIGluZGV4ICogMTYgKyAxNikpO1xuICAgIHJldHVybiBtO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2NvcHlCb25lQnVmZmVyc0Zyb20oY29tcG9uZW50OiBTa2VsZXRhbENvbXBvbmVudCkge1xuICAgIGNvbnN0IGNvcHlWZWN0b3IgPSAodGFyZ2V0OiBWZWN0b3JOLCBzb3VyY2U6IFZlY3Rvck4pID0+IHtcbiAgICAgIGlmICh0YXJnZXQuaXNEdW1teSgpIHx8IHNvdXJjZS5pc0R1bW15KCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGFyZ2V0LmNvcHlDb21wb25lbnRzKHNvdXJjZSk7XG4gICAgfTtcblxuICAgIGlmIChJcy5leGlzdChjb21wb25lbnQuX19qb2ludE1hdHJpY2VzKSkge1xuICAgICAgdGhpcy5fX2pvaW50TWF0cmljZXMgPSBjb21wb25lbnQuX19qb2ludE1hdHJpY2VzIS5jb25jYXQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fX2pvaW50TWF0cmljZXMgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgdGhpcy5fX2FsbG9jYXRlZEJvbmVEYXRhVHlwZSA9PT0gY29tcG9uZW50Ll9fYWxsb2NhdGVkQm9uZURhdGFUeXBlICYmXG4gICAgICB0aGlzLl9ib25lRGF0YS5fdi5sZW5ndGggPT09IGNvbXBvbmVudC5fYm9uZURhdGEuX3YubGVuZ3RoXG4gICAgKSB7XG4gICAgICBjb3B5VmVjdG9yKHRoaXMuX2JvbmVEYXRhLCBjb21wb25lbnQuX2JvbmVEYXRhKTtcbiAgICAgIGlmICghdGhpcy5fYm9uZURhdGFJbmZvLmlzRHVtbXkoKSAmJiAhY29tcG9uZW50Ll9ib25lRGF0YUluZm8uaXNEdW1teSgpKSB7XG4gICAgICAgIHRoaXMuX2JvbmVEYXRhSW5mby5jb3B5Q29tcG9uZW50cyhjb21wb25lbnQuX2JvbmVEYXRhSW5mbyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyB0aGUgYm9uZSBkYXRhIG1lbWJlciBhbmQgaXRzIGxvY2F0aW9uIG1lbWJlci5cbiAgICogVGhlIGJvbmUgZGF0YSBpcyBhIHZhcmlhYmxlLWxlbmd0aCBtZW1iZXIsIHNvIGl0cyBzaXplIGlzIGRlY2lkZWQgcGVyIGNvbXBvbmVudFxuICAgKiAoc2VlIGBfZ2V0QXJyYXlMZW5ndGhGb3JBbGxvY2F0aW9uYCkuXG4gICAqL1xuICBzdGF0aWMgX3JlZ2lzdGVyQm9uZURhdGFNZW1iZXIoKSB7XG4gICAgLy8gTXVzdCBiZSByZWdpc3RlcmVkIGJlZm9yZSB0aGUgdmFyaWFibGUtbGVuZ3RoIG1lbWJlclxuICAgIFNrZWxldGFsQ29tcG9uZW50LnJlZ2lzdGVyTWVtYmVyKHtcbiAgICAgIGJ1ZmZlclVzZTogQnVmZmVyVXNlLkdQVUluc3RhbmNlRGF0YSxcbiAgICAgIG1lbWJlck5hbWU6ICdib25lRGF0YUxvY2F0aW9uJyxcbiAgICAgIGRhdGFDbGFzc1R5cGU6IE11dGFibGVWZWN0b3I0LFxuICAgICAgc2hhZGVyVHlwZTogU2hhZGVyVHlwZS5WZXJ0ZXhTaGFkZXIsXG4gICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWM0LFxuICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgIGluaXRWYWx1ZXM6IFswLCAwLCAwLCAwXSxcbiAgICB9KTtcbiAgICBTa2VsZXRhbENvbXBvbmVudC5yZWdpc3Rlck1lbWJlcih7XG4gICAgICBidWZmZXJVc2U6IEJ1ZmZlclVzZS5HUFVJbnN0YW5jZURhdGEsXG4gICAgICBtZW1iZXJOYW1lOiAnYm9uZURhdGEnLFxuICAgICAgZGF0YUNsYXNzVHlwZTogVmVjdG9yTixcbiAgICAgIHNoYWRlclR5cGU6IFNoYWRlclR5cGUuVmVydGV4U2hhZGVyLFxuICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVmVjNEFycmF5LFxuICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgIGluaXRWYWx1ZXM6IG5ldyBWZWN0b3JOKG5ldyBGbG9hdDMyQXJyYXkoMCkpLFxuICAgICAgaXNWYXJpYWJsZUxlbmd0aDogdHJ1ZSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgdGhlIGJvbmUgZGF0YSBpbmZvIG1lbWJlciAob25lIHZlYzQgcGVyIGNvbXBvbmVudCkuXG4gICAqL1xuICBzdGF0aWMgX3JlZ2lzdGVyQm9uZURhdGFJbmZvTWVtYmVyKCkge1xuICAgIFNrZWxldGFsQ29tcG9uZW50LnJlZ2lzdGVyTWVtYmVyKHtcbiAgICAgIGJ1ZmZlclVzZTogQnVmZmVyVXNlLkdQVUluc3RhbmNlRGF0YSxcbiAgICAgIG1lbWJlck5hbWU6ICdib25lRGF0YUluZm8nLFxuICAgICAgZGF0YUNsYXNzVHlwZTogTXV0YWJsZVZlY3RvcjQsXG4gICAgICBzaGFkZXJUeXBlOiBTaGFkZXJUeXBlLlZlcnRleFNoYWRlcixcbiAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlZlYzQsXG4gICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICAgICAgaW5pdFZhbHVlczogWzEsIDEsIDEsIEJvbmVEYXRhVHlwZS5WZWM0eDIuaW5kZXhdLFxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19idWlsZEpvaW50TGlzdEtleShqb2ludHM6IFNjZW5lR3JhcGhDb21wb25lbnRbXSkge1xuICAgIC8vIFByZWZlciBnbFRGIG5vZGUgaW5kaWNlcyAoam9pbnRJbmRleCkgc28gc2tpbnMgc2hhcmluZyB0aGUgc2FtZSBub2RlIGxpc3QgbWFwIHRvIHRoZSBzYW1lIGtleS5cbiAgICByZXR1cm4gam9pbnRzLm1hcChqb2ludCA9PiAoam9pbnQuam9pbnRJbmRleCA+PSAwID8gam9pbnQuam9pbnRJbmRleCA6IC0xKSkuam9pbignLCcpO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19oYXNoQnl0ZXModWludDhBcnJheTogVWludDhBcnJheSkge1xuICAgIGxldCBoYXNoID0gMHg4MTFjOWRjNTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHVpbnQ4QXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGhhc2ggXj0gdWludDhBcnJheVtpXTtcbiAgICAgIGhhc2ggKz0gKGhhc2ggPDwgMSkgKyAoaGFzaCA8PCA0KSArIChoYXNoIDw8IDcpICsgKGhhc2ggPDwgOCkgKyAoaGFzaCA8PCAyNCk7XG4gICAgICBoYXNoID4+Pj0gMDtcbiAgICB9XG4gICAgcmV0dXJuIGhhc2ggPj4+IDA7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2dldEFjY2Vzc29yU2lnbmF0dXJlKGFjY2Vzc29yOiBBY2Nlc3Nvcikge1xuICAgIGNvbnN0IGNhY2hlZCA9IHRoaXMuX19hY2Nlc3NvclNpZ25hdHVyZUNhY2hlLmdldChhY2Nlc3Nvcik7XG4gICAgaWYgKGNhY2hlZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gY2FjaGVkO1xuICAgIH1cblxuICAgIGNvbnN0IHR5cGVkQXJyYXkgPSBhY2Nlc3Nvci5nZXRUeXBlZEFycmF5KCk7XG4gICAgY29uc3QgdmlldyA9IG5ldyBVaW50OEFycmF5KHR5cGVkQXJyYXkuYnVmZmVyLCB0eXBlZEFycmF5LmJ5dGVPZmZzZXQsIHR5cGVkQXJyYXkuYnl0ZUxlbmd0aCk7XG4gICAgY29uc3QgaGFzaCA9IHRoaXMuX19oYXNoQnl0ZXModmlldyk7XG4gICAgLy8gY29uc3Qgc2lnbmF0dXJlID0gW1xuICAgIC8vIHR5cGVkQXJyYXkuYnl0ZUxlbmd0aCxcbiAgICAvLyBoYXNoLnRvU3RyaW5nKDE2KSxcbiAgICAvLyBhY2Nlc3Nvci5jb21wb25lbnRUeXBlLnZhbHVlT2YoKSxcbiAgICAvLyBhY2Nlc3Nvci5jb21wb3NpdGlvblR5cGUudmFsdWVPZigpLFxuICAgIC8vIGFjY2Vzc29yLmJ5dGVTdHJpZGUsXG4gICAgLy8gXS5qb2luKCc6Jyk7XG4gICAgY29uc3Qgc2lnbmF0dXJlID0gaGFzaC50b1N0cmluZygxNik7XG4gICAgdGhpcy5fX2FjY2Vzc29yU2lnbmF0dXJlQ2FjaGUuc2V0KGFjY2Vzc29yLCBzaWduYXR1cmUpO1xuICAgIHJldHVybiBzaWduYXR1cmU7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2dldEJpbmRTaGFwZVNpZ25hdHVyZShiaW5kU2hhcGVNYXRyaXg/OiBNYXRyaXg0NCkge1xuICAgIGlmICghYmluZFNoYXBlTWF0cml4KSB7XG4gICAgICByZXR1cm4gJ25vX2JpbmRfc2hhcGUnO1xuICAgIH1cbiAgICBjb25zdCBjYWNoZWQgPSB0aGlzLl9fYmluZFNoYXBlU2lnbmF0dXJlTWFwLmdldChiaW5kU2hhcGVNYXRyaXgpO1xuICAgIGlmIChjYWNoZWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGNhY2hlZDtcbiAgICB9XG4gICAgY29uc3Qgc2lnbmF0dXJlID0gQXJyYXkuZnJvbShiaW5kU2hhcGVNYXRyaXguX3YpLmpvaW4oJywnKTtcbiAgICB0aGlzLl9fYmluZFNoYXBlU2lnbmF0dXJlTWFwLnNldChiaW5kU2hhcGVNYXRyaXgsIHNpZ25hdHVyZSk7XG4gICAgcmV0dXJuIHNpZ25hdHVyZTtcbiAgfVxuXG4gIHByaXZhdGUgX19nZXRBbmltYXRpb25UcmFja0ZlYXR1cmVIYXNoKCk6IG51bWJlciB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKHRoaXMuZW50aXR5LnBhcmVudCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX2ZpbmRBbmltYXRpb25UcmFja0ZlYXR1cmVIYXNoKHRoaXMuZW50aXR5LnBhcmVudC5lbnRpdHkpO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2ZpbmRBbmltYXRpb25UcmFja0ZlYXR1cmVIYXNoKHRhcmdldDogSVNjZW5lR3JhcGhFbnRpdHkpOiBudW1iZXIgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGhhc2hlczogbnVtYmVyW10gPSBbXTtcbiAgICBjb25zdCBjb2xsZWN0SGFzaGVzID0gKGVudGl0eTogSVNjZW5lR3JhcGhFbnRpdHkpID0+IHtcbiAgICAgIGNvbnN0IGFuaW1hdGlvbkNvbXBvbmVudCA9IGVudGl0eS50cnlUb0dldEFuaW1hdGlvbigpO1xuICAgICAgaWYgKGFuaW1hdGlvbkNvbXBvbmVudCAhPSBudWxsKSB7XG4gICAgICAgIGNvbnN0IGFuaW1hdGlvbkNoYW5uZWxzID0gYW5pbWF0aW9uQ29tcG9uZW50LmdldEFuaW1hdGlvbkNoYW5uZWxzT2ZUcmFjaygpO1xuICAgICAgICBpZiAoYW5pbWF0aW9uQ2hhbm5lbHMuc2l6ZSA+IDApIHtcbiAgICAgICAgICBjb25zdCBjb21wb25lbnRIYXNoZXMgPSBuZXcgU2V0PG51bWJlcj4oKTtcbiAgICAgICAgICBjb25zdCBhY3RpdmVUcmFja05hbWUgPSBhbmltYXRpb25Db21wb25lbnQuZ2V0QWN0aXZlQW5pbWF0aW9uVHJhY2soKTtcbiAgICAgICAgICBjb25zdCBoYXNFeHByZXNzaW9uQ2hhbm5lbCA9IEFycmF5LmZyb20oYW5pbWF0aW9uQ2hhbm5lbHMua2V5cygpKS5zb21lKHBhdGhOYW1lID0+XG4gICAgICAgICAgICBwYXRoTmFtZS5zdGFydHNXaXRoKCd2cm1FeHByZXNzaW9uLycpXG4gICAgICAgICAgKTtcbiAgICAgICAgICBsZXQgaGFzTm9uRXhwcmVzc2lvbkNoYW5uZWxGb3JBY3RpdmVUcmFjayA9IGZhbHNlO1xuICAgICAgICAgIGZvciAoY29uc3QgW3BhdGhOYW1lLCBjaGFubmVsXSBvZiBhbmltYXRpb25DaGFubmVscykge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAhcGF0aE5hbWUuc3RhcnRzV2l0aCgndnJtRXhwcmVzc2lvbi8nKSAmJlxuICAgICAgICAgICAgICBjaGFubmVsLmFuaW1hdGVkVmFsdWUuZ2V0QWxsVHJhY2tOYW1lcygpLmluY2x1ZGVzKGFjdGl2ZVRyYWNrTmFtZSlcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBoYXNOb25FeHByZXNzaW9uQ2hhbm5lbEZvckFjdGl2ZVRyYWNrID0gdHJ1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChoYXNOb25FeHByZXNzaW9uQ2hhbm5lbEZvckFjdGl2ZVRyYWNrKSB7XG4gICAgICAgICAgICBjb25zdCBoYXNoID0gYW5pbWF0aW9uQ29tcG9uZW50LmN1cnJlbnRUcmFja0ZlYXR1cmVIYXNoKCk7XG4gICAgICAgICAgICBpZiAoaGFzaCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIGNvbXBvbmVudEhhc2hlcy5hZGQoaGFzaCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChjb21wb25lbnRIYXNoZXMuc2l6ZSA9PT0gMCAmJiAhaGFzRXhwcmVzc2lvbkNoYW5uZWwpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgW3BhdGhOYW1lLCBjaGFubmVsXSBvZiBhbmltYXRpb25DaGFubmVscykge1xuICAgICAgICAgICAgICBpZiAocGF0aE5hbWUuc3RhcnRzV2l0aCgndnJtRXhwcmVzc2lvbi8nKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvbnN0IGV2YWx1YXRlZFRyYWNrTmFtZSA9IGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZS5nZXRGaXJzdEFjdGl2ZUFuaW1hdGlvblNhbXBsZXJUcmFja05hbWUoKTtcbiAgICAgICAgICAgICAgY29uc3QgaGFzaCA9IGFuaW1hdGlvbkNvbXBvbmVudC5nZXRBbmltYXRpb25UcmFja0ZlYXR1cmVIYXNoKGV2YWx1YXRlZFRyYWNrTmFtZSk7XG4gICAgICAgICAgICAgIGlmIChoYXNoICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjb21wb25lbnRIYXNoZXMuYWRkKGhhc2gpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAoY29uc3QgaGFzaCBvZiBjb21wb25lbnRIYXNoZXMpIHtcbiAgICAgICAgICAgIGhhc2hlcy5wdXNoKGhhc2gpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBlbnRpdHkuY2hpbGRyZW4pIHtcbiAgICAgICAgY29sbGVjdEhhc2hlcyhjaGlsZC5lbnRpdHkpO1xuICAgICAgfVxuICAgIH07XG4gICAgY29sbGVjdEhhc2hlcyh0YXJnZXQpO1xuXG4gICAgaWYgKGhhc2hlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChoYXNoZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICByZXR1cm4gaGFzaGVzWzBdO1xuICAgIH1cblxuICAgIHJldHVybiBEYXRhVXRpbC50b0NSQzMyKGhhc2hlcy5qb2luKCd8JykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIHNraW5uaW5nIGNhY2hlIGtleSBvbmx5IHdoZW4gYW5pbWF0aW9uIGJpbmRpbmdzIG9yIHRoZSBzY2VuZSBncmFwaCBoaWVyYXJjaHlcbiAgICogbWF5IGhhdmUgY2hhbmdlZCBzaW5jZSB0aGUga2V5IHdhcyBsYXN0IGNvbXB1dGVkLlxuICAgKiBTZWFyY2hpbmcgYW5pbWF0aW9uIHRyYWNrIGZlYXR1cmUgaGFzaGVzIHdhbGtzIHRoZSB3aG9sZSBtb2RlbCBoaWVyYXJjaHksIHNvIGRvaW5nIGl0XG4gICAqIGV2ZXJ5IGZyYW1lIGZvciBldmVyeSBTa2VsZXRhbENvbXBvbmVudCBpcyB0b28gZXhwZW5zaXZlIHdoZW4gbWFueSBtb2RlbHMgYXJlIGFuaW1hdGVkLlxuICAgKiBPdGhlciBpbnB1dHMgb2YgdGhlIGtleSAoam9pbnRzLCBpbnZlcnNlIGJpbmQgbWF0cmljZXMsIGJvbmUgZGF0YSB0eXBlKSB1cGRhdGUgdGhlIGtleVxuICAgKiBpbW1lZGlhdGVseSBpbiB0aGVpciBzZXR0ZXJzLlxuICAgKi9cbiAgcHJpdmF0ZSBfX3VwZGF0ZVNraW5DYWNoZUtleUlmTmVlZGVkKCkge1xuICAgIGlmIChcbiAgICAgIHRoaXMuX19za2luQ2FjaGVLZXlBbmltYXRpb25CaW5kaW5nVmVyc2lvbiA9PT0gQW5pbWF0aW9uU3RhdGVSZXBvc2l0b3J5LmdldEFuaW1hdGlvbkJpbmRpbmdWZXJzaW9uKCkgJiZcbiAgICAgIHRoaXMuX19za2luQ2FjaGVLZXlIaWVyYXJjaHlWZXJzaW9uID09PSBTY2VuZUdyYXBoQ29tcG9uZW50LmhpZXJhcmNoeVZlcnNpb25cbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fX3VwZGF0ZVNraW5DYWNoZUtleSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIHNraW5uaW5nIGNhY2hlIGtleSBiYXNlZCBvbiBjdXJyZW50IGFuaW1hdGlvbiBzdGF0ZS5cbiAgICpcbiAgICogVGhlIGNhY2hlIGtleSBkZXRlcm1pbmVzIHdoaWNoIFNrZWxldGFsQ29tcG9uZW50cyBjYW4gc2hhcmUgc2tpbm5pbmcgcmVzdWx0czpcbiAgICpcbiAgICogIyMgV2l0aCBBbmltYXRpb24gQXBwbGllZFxuICAgKiAtIFVzZXMgZm9ybWF0OiBgYW5pbXx7YW5pbWF0aW9uSGFzaH18e2ludmVyc2VCaW5kTWF0cmljZXNTaWduYXR1cmV9fHtqb2ludExpc3RLZXl9YFxuICAgKiAtIGFuaW1hdGlvbkhhc2ggaXMgY29tcHV0ZWQgZnJvbSBhbmltYXRpb24gdHJhY2sgZmVhdHVyZXMgKGtleWZyYW1lcywgdGltaW5ncywgZXRjLilcbiAgICogLSBpbnZlcnNlQmluZE1hdHJpY2VzU2lnbmF0dXJlIGVuc3VyZXMgbW9kZWxzIHdpdGggZGlmZmVyZW50IGJvbmUgc3RydWN0dXJlcyBkb24ndCBzaGFyZSBjYWNoZVxuICAgKiAtIGpvaW50TGlzdEtleSBlbnN1cmVzIHJlY3Vyc2l2ZWx5IG5lc3RlZCBjaGFpbnMgdGhhdCBzaGFyZSBsb2NhbCB0cmFja3MvYmluZCBtYXRyaWNlc1xuICAgKiAgIGJ1dCBoYXZlIGRpZmZlcmVudCBqb2ludCBub2RlcyAoZGlmZmVyZW50IHBhcmVudCB0cmFuc2Zvcm1zKSBkb24ndCBzaGFyZSByZXN1bHRzXG4gICAqIC0gT25seSBtb2RlbHMgd2l0aCB0aGUgc2FtZSBhbmltYXRpb24sIGJpbmQgbWF0cmljZXMgYW5kIGpvaW50IGhpZXJhcmNoeSBjYW4gc2hhcmVcbiAgICogICBza2lubmluZyByZXN1bHRzXG4gICAqXG4gICAqICMjIFdpdGhvdXQgQW5pbWF0aW9uXG4gICAqIC0gVXNlcyBmb3JtYXQ6IGB7am9pbnRMaXN0S2V5fXx7YWNjZXNzb3JTaWduYXR1cmV9fG5vX2FuaW1hdGlvbmBcbiAgICogLSBFbnRpdHlVSUQtYmFzZWQga2V5IHByZXZlbnRzIGluY29ycmVjdCBzaGFyaW5nIGJldHdlZW4gdW5yZWxhdGVkIG1vZGVsc1xuICAgKiAtIEVhY2ggbW9kZWwgbWFpbnRhaW5zIGl0cyBvd24gY2FjaGVcbiAgICovXG4gIHByaXZhdGUgX191cGRhdGVTa2luQ2FjaGVLZXkoKSB7XG4gICAgdGhpcy5fX3NraW5DYWNoZUtleUFuaW1hdGlvbkJpbmRpbmdWZXJzaW9uID0gQW5pbWF0aW9uU3RhdGVSZXBvc2l0b3J5LmdldEFuaW1hdGlvbkJpbmRpbmdWZXJzaW9uKCk7XG4gICAgdGhpcy5fX3NraW5DYWNoZUtleUhpZXJhcmNoeVZlcnNpb24gPSBTY2VuZUdyYXBoQ29tcG9uZW50LmhpZXJhcmNoeVZlcnNpb247XG5cbiAgICBpZiAoIXRoaXMuX19pbnZlcnNlQmluZE1hdHJpY2VzQWNjZXNzb3IpIHtcbiAgICAgIHRoaXMuX19za2luQ2FjaGVLZXkgPSB1bmRlZmluZWQ7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gRW5zdXJlIGludmVyc2VCaW5kTWF0cmljZXNTaWduYXR1cmUgaXMgY29tcHV0ZWRcbiAgICBpZiAoIXRoaXMuX19pbnZlcnNlQmluZE1hdHJpY2VzU2lnbmF0dXJlKSB7XG4gICAgICB0aGlzLl9faW52ZXJzZUJpbmRNYXRyaWNlc1NpZ25hdHVyZSA9IFNrZWxldGFsQ29tcG9uZW50Ll9fZ2V0QWNjZXNzb3JTaWduYXR1cmUoXG4gICAgICAgIHRoaXMuX19pbnZlcnNlQmluZE1hdHJpY2VzQWNjZXNzb3JcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgYW5pbWF0aW9uVHJhY2tGZWF0dXJlSGFzaCA9IHRoaXMuX19nZXRBbmltYXRpb25UcmFja0ZlYXR1cmVIYXNoKCk7XG4gICAgLy8gQ29tcG9uZW50cyB3aXRoIGRpZmZlcmVudCBib25lIGRhdGEgbGF5b3V0cyBtdXN0IG5vdCBzaGFyZSBza2lubmluZyByZXN1bHRzXG4gICAgY29uc3QgYm9uZURhdGFUeXBlSW5kZXggPSAodGhpcy5fX2FsbG9jYXRlZEJvbmVEYXRhVHlwZSA/PyB0aGlzLmJvbmVEYXRhVHlwZSkuaW5kZXg7XG5cbiAgICBpZiAoYW5pbWF0aW9uVHJhY2tGZWF0dXJlSGFzaCAhPSBudWxsKSB7XG4gICAgICAvLyBBbmltYXRpb24gaXMgYXBwbGllZC4gVGhlIGFuaW1hdGlvbiBoYXNoIGFuZCBpbnZlcnNlQmluZE1hdHJpY2VzIHNpZ25hdHVyZSBhbG9uZVxuICAgICAgLy8gYXJlIG5vdCBlbm91Z2ggdG8gaWRlbnRpZnkgaW50ZXJjaGFuZ2VhYmxlIHNrZWxldG9uczogcmVjdXJzaXZlbHkgbmVzdGVkIGNoYWluc1xuICAgICAgLy8gKGUuZy4gdGhlIFJlY3Vyc2l2ZVNrZWxldG9ucyBzYW1wbGUpIHNoYXJlIHRoZSBzYW1lIGxvY2FsIHRyYWNrIHN0cnVjdHVyZSBhbmRcbiAgICAgIC8vIGJpbmQgbWF0cmljZXMgd2hpbGUgbGl2aW5nIHVuZGVyIGRpZmZlcmVudCBwYXJlbnQgdHJhbnNmb3Jtcywgc28gdGhlaXIgc2tpbm5lZFxuICAgICAgLy8gcmVzdWx0cyBkaWZmZXIuIEluY2x1ZGUgdGhlIGpvaW50IGxpc3Qga2V5IHNvIG9ubHkgaWRlbnRpY2FsIGpvaW50IGhpZXJhcmNoaWVzXG4gICAgICAvLyAoc2FtZSBnbFRGIG5vZGUgaW5kaWNlcykgc2hhcmUgdGhlIGxlYWRlcidzIGJvbmUgZGF0YS5cbiAgICAgIHRoaXMuX19za2luQ2FjaGVLZXkgPSBgYW5pbXwke2FuaW1hdGlvblRyYWNrRmVhdHVyZUhhc2gudG9TdHJpbmcoKX18JHt0aGlzLl9faW52ZXJzZUJpbmRNYXRyaWNlc1NpZ25hdHVyZX18JHtcbiAgICAgICAgdGhpcy5fX2pvaW50TGlzdEtleSA/PyAnJ1xuICAgICAgfXwke2JvbmVEYXRhVHlwZUluZGV4fWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE5vIGFuaW1hdGlvbiAtIHVzZSBkZXRhaWxlZCBFbnRpdHlVSUQtYmFzZWQgY2FjaGUga2V5XG4gICAgICAvLyBUaGlzIHByZXZlbnRzIGluY29ycmVjdCBjYWNoZSBzaGFyaW5nIGJldHdlZW4gdW5yZWxhdGVkIHN0YXRpYyBtb2RlbHNcbiAgICAgIGlmICghdGhpcy5fX2pvaW50TGlzdEtleSkge1xuICAgICAgICB0aGlzLl9fc2tpbkNhY2hlS2V5ID0gdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLl9fc2tpbkNhY2hlS2V5ID0gYCR7dGhpcy5fX2pvaW50TGlzdEtleX18JHt0aGlzLl9faW52ZXJzZUJpbmRNYXRyaWNlc1NpZ25hdHVyZX18bm9fYW5pbWF0aW9ufCR7Ym9uZURhdGFUeXBlSW5kZXh9YDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRHJvcHMgdGhlIG1lbW9pemVkIHNraW5uaW5nIGlucHV0IHNpZ25hdHVyZSBzbyB0aGUgbmV4dCAkbG9naWMgcmVjb21wdXRlcyBza2lubmluZy5cbiAgICovXG4gIHByaXZhdGUgX19pbnZhbGlkYXRlU2tpbkNvbXB1dGVTaWduYXR1cmUoKSB7XG4gICAgdGhpcy5fX2hhc1NraW5Db21wdXRlU2lnbmF0dXJlID0gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0cnVlIHdoZW4gZXZlcnkgaW5wdXQgdGhhdCBhZmZlY3RzIHRoZSBib25lIGRhdGEgaXMgaWRlbnRpY2FsIHRvIHRoZSBsYXN0IGNvbXB1dGF0aW9uLlxuICAgKlxuICAgKiBUaGUgam9pbnQgdmVyc2lvbiBzdW0gd29ya3MgYXMgYSBjaGFuZ2UgZGV0ZWN0b3IgYmVjYXVzZSBgd29ybGRNYXRyaXhWZXJzaW9uYCBvbmx5IGluY3JlYXNlczpcbiAgICogaWYgYW55IGpvaW50IChvciB0aGUgc2tpbm5lZCBub2RlKSB3YXMgbWFya2VkIGRpcnR5LCB0aGUgc3VtIG5lY2Vzc2FyaWx5IGRpZmZlcnMuXG4gICAqXG4gICAqIENvbnN0cmFpbnQ6IGxpa2UgdGhlIHdvcmxkIG1hdHJpeCBjYWNoZSBpdHNlbGYsIHRoaXMgc2lnbmF0dXJlIG9ubHkgb2JzZXJ2ZXMgY2hhbmdlcyBtYWRlXG4gICAqIHRocm91Z2ggdGhlIHRyYW5zZm9ybS9yZW5kZXJlciBBUElzLiBXcml0aW5nIGBtYXRyaXhJbm5lcmAgZGlyZWN0bHkgb3IgbXV0YXRpbmdcbiAgICogYF9iaW5kU2hhcGVNYXRyaXhgIGluIHBsYWNlIGlzIG5vdCBkZXRlY3RlZDsgY2FsbGVycyBtdXN0IGludmFsaWRhdGUgdGhyb3VnaCB0aGUgc2V0dGVycy5cbiAgICpcbiAgICogQHBhcmFtIGNhY2hlS2V5IC0gVGhlIGN1cnJlbnQgc2tpbm5pbmcgY2FjaGUga2V5XG4gICAqIEByZXR1cm5zIFRydWUgd2hlbiB0aGUgc2tpbm5pbmcgbG9vcCBjYW4gYmUgc2tpcHBlZFxuICAgKi9cbiAgcHJpdmF0ZSBfX2lzU2tpbkNvbXB1dGVJbnB1dFVuY2hhbmdlZChjYWNoZUtleTogc3RyaW5nIHwgdW5kZWZpbmVkKTogYm9vbGVhbiB7XG4gICAgaWYgKCF0aGlzLl9faGFzU2tpbkNvbXB1dGVTaWduYXR1cmUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX19sYXN0U2tpbkNvbXB1dGVDYWNoZUtleSAhPT0gY2FjaGVLZXkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX19sYXN0U2tpbkNvbXB1dGVCaW5kU2hhcGVNYXRyaXggIT09IHRoaXMuX2JpbmRTaGFwZU1hdHJpeCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBlbnRpdHlTY2VuZUdyYXBoID0gdGhpcy5lbnRpdHkuZ2V0U2NlbmVHcmFwaCgpO1xuICAgIGlmIChlbnRpdHlTY2VuZUdyYXBoID09IG51bGwgfHwgZW50aXR5U2NlbmVHcmFwaC53b3JsZE1hdHJpeFZlcnNpb24gIT09IHRoaXMuX19sYXN0U2tpbkNvbXB1dGVPd25WZXJzaW9uKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGxldCBqb2ludFZlcnNpb25TdW0gPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fX2pvaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgam9pbnRWZXJzaW9uU3VtICs9IHRoaXMuX19qb2ludHNbaV0ud29ybGRNYXRyaXhWZXJzaW9uO1xuICAgIH1cbiAgICByZXR1cm4gam9pbnRWZXJzaW9uU3VtID09PSB0aGlzLl9fbGFzdFNraW5Db21wdXRlSm9pbnRWZXJzaW9uU3VtO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlY29yZHMgdGhlIGlucHV0cyB0aGF0IHByb2R1Y2VkIHRoZSBjdXJyZW50IGJvbmUgZGF0YS5cbiAgICogQHBhcmFtIGNhY2hlS2V5IC0gVGhlIHNraW5uaW5nIGNhY2hlIGtleSB1c2VkIGZvciB0aGlzIGNvbXB1dGF0aW9uXG4gICAqL1xuICBwcml2YXRlIF9fcmVjb3JkU2tpbkNvbXB1dGVTaWduYXR1cmUoY2FjaGVLZXk6IHN0cmluZyB8IHVuZGVmaW5lZCkge1xuICAgIGxldCBqb2ludFZlcnNpb25TdW0gPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fX2pvaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgam9pbnRWZXJzaW9uU3VtICs9IHRoaXMuX19qb2ludHNbaV0ud29ybGRNYXRyaXhWZXJzaW9uO1xuICAgIH1cbiAgICB0aGlzLl9fbGFzdFNraW5Db21wdXRlQ2FjaGVLZXkgPSBjYWNoZUtleTtcbiAgICB0aGlzLl9fbGFzdFNraW5Db21wdXRlSm9pbnRWZXJzaW9uU3VtID0gam9pbnRWZXJzaW9uU3VtO1xuICAgIHRoaXMuX19sYXN0U2tpbkNvbXB1dGVPd25WZXJzaW9uID0gdGhpcy5lbnRpdHkuZ2V0U2NlbmVHcmFwaCgpPy53b3JsZE1hdHJpeFZlcnNpb24gPz8gLTE7XG4gICAgdGhpcy5fX2xhc3RTa2luQ29tcHV0ZUJpbmRTaGFwZU1hdHJpeCA9IHRoaXMuX2JpbmRTaGFwZU1hdHJpeDtcbiAgICB0aGlzLl9faGFzU2tpbkNvbXB1dGVTaWduYXR1cmUgPSB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2NyZWF0ZVNraW5uaW5nQ2FjaGUocHJvY2Vzc0ZyYW1lVG9rZW46IG51bWJlcik6IFNraW5uaW5nQ2FjaGUge1xuICAgIGNvbnN0IGluZm8gPSB0aGlzLl9ib25lRGF0YUluZm8uX3Y7XG4gICAgcmV0dXJuIHtcbiAgICAgIHByb2Nlc3NGcmFtZVRva2VuLFxuICAgICAgYm9uZURhdGE6IHRoaXMuX2JvbmVEYXRhLmlzRHVtbXkoKSA/IHVuZGVmaW5lZCA6IHRoaXMuX2JvbmVEYXRhLl92LFxuICAgICAgYm9uZURhdGFJbmZvOiBbaW5mb1swXSwgaW5mb1sxXSwgaW5mb1syXSwgaW5mb1szXV0sXG4gICAgICBqb2ludE1hdHJpeDogdGhpcy5fX2pvaW50TWF0cml4Ll92LFxuICAgICAgaXNXb3JsZE1hdHJpeFZhbmlsbGE6IHRoaXMuX19pc1dvcmxkTWF0cml4VmFuaWxsYSxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBfX2FwcGx5U2tpbm5pbmdDYWNoZShjYWNoZTogU2tpbm5pbmdDYWNoZSkge1xuICAgIHRoaXMuX19pc1dvcmxkTWF0cml4VmFuaWxsYSA9IGNhY2hlLmlzV29ybGRNYXRyaXhWYW5pbGxhO1xuICAgIHRoaXMuX19qb2ludE1hdHJpeC5fdi5zZXQoY2FjaGUuam9pbnRNYXRyaXgpO1xuICAgIGlmIChjYWNoZS5ib25lRGF0YSA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIFRoZSBjYWNoZSBrZXkgY29udGFpbnMgdGhlIGJvbmUgZGF0YSB0eXBlLCBzbyB0aGUgbGF5b3V0IGlzIHRoZSBzYW1lIGFzIHRoaXMgY29tcG9uZW50J3MuXG4gICAgY29uc3QgZGF0YUNvdW50ID0gdGhpcy5fX2pvaW50cy5sZW5ndGggKiBCb25lRGF0YVR5cGUuZ2V0VmVjNENvdW50UGVySm9pbnQodGhpcy5fX2FsbG9jYXRlZEJvbmVEYXRhVHlwZSEpICogNDtcbiAgICB0aGlzLl9ib25lRGF0YS5fdi5zZXQoY2FjaGUuYm9uZURhdGEuc3ViYXJyYXkoMCwgTWF0aC5taW4oZGF0YUNvdW50LCB0aGlzLl9ib25lRGF0YS5fdi5sZW5ndGgpKSk7XG4gICAgaWYgKCF0aGlzLl9ib25lRGF0YUluZm8uaXNEdW1teSgpKSB7XG4gICAgICB0aGlzLl9ib25lRGF0YUluZm8uX3Yuc2V0KGNhY2hlLmJvbmVEYXRhSW5mbyk7XG4gICAgfVxuICB9XG59XG5cbi8vIFJlZ2lzdGVyIEdQVSBtZW1iZXJzLiBUaGUgc2l6ZSBvZiAnYm9uZURhdGEnIGlzIGRlY2lkZWQgcGVyIGNvbXBvbmVudCBpbiBzZXRKb2ludHMoKS5cblNrZWxldGFsQ29tcG9uZW50Ll9yZWdpc3RlckJvbmVEYXRhTWVtYmVyKCk7XG5Ta2VsZXRhbENvbXBvbmVudC5fcmVnaXN0ZXJCb25lRGF0YUluZm9NZW1iZXIoKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxTQUFTLGlCQUFpQjtBQUUxQixTQUFTLG1CQUEwQztBQUNuRCxTQUFTLG9CQUEyQztBQUNwRCxTQUFTLGlCQUFpQjtBQUMxQixTQUFTLHFCQUFxQjtBQUM5QixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLG9CQUFvQjtBQUM3QixTQUFTLGtCQUFrQjtBQUczQixTQUFTLGdCQUFnQjtBQUN6QixTQUFTLGdCQUFnQjtBQUN6QixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLHlCQUF5QjtBQUNsQyxTQUFTLHNCQUFzQjtBQUMvQixTQUFTLGVBQWU7QUFFeEIsU0FBUyxVQUFVLFVBQVU7QUFFN0IsU0FBUyxnQ0FBZ0M7QUFFekMsU0FBUywyQkFBMkI7QUFDcEMsU0FBUyw4QkFBOEI7QUFjdkMsSUFBTSw0QkFBNEI7QUFPM0IsSUFBTSxxQkFBTixNQUFNLDJCQUEwQixVQUFVO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQThFL0MsWUFDRSxRQUNBLFdBQ0EsY0FDQSxrQkFDQSxTQUNBO0FBQ0EsVUFBTSxRQUFRLFdBQVcsY0FBYyxrQkFBa0IsT0FBTztBQXBGbEUsU0FBTyxnQkFBeUIsQ0FBQztBQUNqQyxTQUFRQSxLQUFrQyxDQUFDO0FBSzNDLFNBQU8sYUFBYTtBQWFwQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQUFRLFlBQVksUUFBUSxNQUFNO0FBSWxDO0FBQUE7QUFBQTtBQUFBLFNBQVEsb0JBQW9CLGVBQWUsTUFBTTtBQUtqRDtBQUFBO0FBQUE7QUFBQTtBQUFBLFNBQVEsZ0JBQWdCLGVBQWUsTUFBTTtBQUU3QyxTQUFRQyxLQUFtQyxhQUFhO0FBRXhEO0FBQUEsU0FBUUMsS0FBK0I7QUFDdkMsU0FBUUMsS0FBNkI7QUFFckMsU0FBUUMsS0FBd0I7QUFDaEMsU0FBUUMsS0FBMkIsSUFBSSxhQUFhLENBQUM7QUFDckQsU0FBUUMsS0FBZ0IsZ0JBQWdCLFNBQVM7QUFDakQsU0FBUUMsS0FBeUI7QUFDakMscUJBQVk7QUFRWjtBQUFBLFNBQVFDLEtBQXdDO0FBQ2hELFNBQVFDLEtBQWlDO0FBT3pDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQUFRQyxLQUE0QjtBQUVwQyxTQUFRQyxLQUFtQztBQUMzQyxTQUFRQyxLQUE4QjtBQTJCcEMsU0FBSyxZQUFZLGFBQWEsS0FBSztBQUVuQyxRQUFJLFNBQVM7QUFFWCxXQUFLQyxHQUF1QjtBQUU1QixXQUFLUCxLQUFnQixnQkFBZ0IsU0FBUztBQUM5QyxXQUFLQyxLQUF5QjtBQUU5QixXQUFLUCxLQUFXLENBQUM7QUFDakIsV0FBS2MsS0FBa0I7QUFDdkIsV0FBSyx1QkFBdUI7QUFDNUIsV0FBSyxtQkFBbUI7QUFDeEIsV0FBSyxhQUFhO0FBQ2xCLFdBQUtiLEtBQWlCLGFBQWE7QUFDbkMsV0FBS0MsS0FBK0I7QUFDcEMsV0FBS0MsS0FBNkI7QUFDbEMsV0FBS1ksS0FBMEI7QUFDL0IsV0FBS1gsS0FBd0I7QUFDN0IsV0FBS1ksS0FBaUI7QUFDdEIsV0FBS0MsS0FBaUI7QUFDdEIsV0FBS0MsS0FBaUM7QUFDdEMsV0FBS1YsS0FBd0M7QUFDN0MsV0FBS0MsS0FBaUM7QUFDdEM7QUFBQSxJQUNGO0FBRUEsdUJBQWtCVTtBQUFBLEVBQ3BCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1RTixLQUF5QjtBQUUvQixRQUFJLENBQUMsS0FBSyxVQUFVLFFBQVEsR0FBRztBQUM3QixXQUFLLFVBQVUsR0FBRyxLQUFLLENBQUM7QUFBQSxJQUMxQjtBQUdBLFNBQUssWUFBWSxRQUFRLE1BQU07QUFDL0IsU0FBS08sS0FBbUI7QUFBQSxFQUMxQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLFdBQVcsZUFBZTtBQUN4QixXQUFPLHVCQUF1QjtBQUFBLEVBQ2hDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBSSxlQUE2QjtBQUMvQixXQUFPLHVCQUF1QjtBQUFBLEVBQ2hDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSwrQkFBK0IsNkJBQXVDO0FBQ3BFLFNBQUtDLEtBQWdDO0FBQ3JDLFNBQUtILEtBQWlDLG1CQUFrQkksR0FBdUIsMkJBQTJCO0FBQzFHLFNBQUtDLEdBQXFCO0FBQUEsRUFDNUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLFVBQVUsUUFBK0I7QUFDdkMsU0FBS0MsR0FBaUM7QUFDdEMsU0FBS3hCLEtBQVc7QUFDaEIsU0FBS2dCLEtBQWlCLG1CQUFrQlMsR0FBb0IsTUFBTTtBQUNsRSxTQUFLWixHQUF1QjtBQUU1QixVQUFNLGVBQWUsS0FBSztBQUMxQixTQUFLVCxLQUF3QixtQkFBa0JzQixHQUEwQixjQUFjLE9BQU8sTUFBTTtBQUdwRyxVQUFNLG9CQUFvQixLQUFLQztBQUMvQixTQUFLLG1CQUFtQixLQUFLQyxFQUFTLE9BQU8scUNBQXFDLGlCQUFpQjtBQUVuRyxTQUFLUixLQUFtQixJQUFJO0FBQUEsTUFDMUIsS0FBSyxVQUFVLEdBQUc7QUFBQSxNQUNsQixLQUFLLFVBQVUsR0FBRztBQUFBLE1BQ2xCLEtBQUssVUFBVSxHQUFHO0FBQUEsSUFDcEI7QUFDQSxTQUFLTCxLQUEwQjtBQUMvQixTQUFLYyxHQUFrQixHQUFHLEdBQUcsR0FBRyxZQUFZO0FBQzVDLFNBQUtOLEdBQXFCO0FBQUEsRUFDNUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLElBQUksZUFBaUM7QUFqUHZDO0FBa1BJLFlBQU8sVUFBS0ssRUFBUyxPQUFPLGlCQUFyQixZQUFxQyxLQUFLM0I7QUFBQSxFQUNuRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWdCQSxnQkFBZ0IsY0FBZ0MsaUJBQWlCLE9BQU87QUFDdEUsU0FBS0EsS0FBaUI7QUFDdEIsU0FBS0MsS0FBK0I7QUFDcEMsU0FBSzRCLEdBQXVCO0FBQUEsRUFDOUI7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtRQSxLQUF5QjtBQUMvQixVQUFNLGVBQWUsS0FBSztBQUMxQixRQUFJLEtBQUtmLE9BQTRCLFVBQWEsS0FBS0EsT0FBNEIsY0FBYztBQUMvRjtBQUFBLElBQ0Y7QUFDQSxTQUFLLFVBQVUsS0FBS2YsRUFBUTtBQUFBLEVBQzlCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVUEsT0FBZTBCLEdBQTBCLGNBQWdDLFlBQW9CO0FBQzNGLFdBQU8sS0FBSyxJQUFJLFlBQVksQ0FBQyxJQUFJLGFBQWEscUJBQXFCLFlBQVk7QUFBQSxFQUNqRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUVUsNkJBQTZCLFlBQXdDO0FBQzdFLFFBQUksZUFBZSxjQUFjLEtBQUt0QixLQUF3QixHQUFHO0FBQy9ELGFBQU8sS0FBS0E7QUFBQSxJQUNkO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVReUIsR0FBa0IsR0FBVyxHQUFXLEdBQVcsY0FBZ0M7QUFDekYsUUFBSSxLQUFLLGNBQWMsUUFBUSxHQUFHO0FBQ2hDO0FBQUEsSUFDRjtBQUNBLFVBQU0sSUFBSSxLQUFLLGNBQWM7QUFDN0IsTUFBRSxDQUFDLElBQUk7QUFDUCxNQUFFLENBQUMsSUFBSTtBQUNQLE1BQUUsQ0FBQyxJQUFJO0FBQ1AsTUFBRSxDQUFDLElBQUksYUFBYTtBQUFBLEVBQ3RCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0Esd0JBQXdCLFFBQStCO0FBQ3JELFNBQUtMLEdBQWlDO0FBQ3RDLFNBQUt4QixLQUFXO0FBQ2hCLFNBQUtnQixLQUFpQixtQkFBa0JTLEdBQW9CLE1BQU07QUFDbEUsU0FBS0YsR0FBcUI7QUFBQSxFQUM1QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLFlBQW1DO0FBQ2pDLFdBQU8sS0FBS3ZCLEdBQVMsT0FBTztBQUFBLEVBQzlCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBSSw0QkFBNEI7QUFsVmxDO0FBbVZJLFlBQU8sVUFBSyx5QkFBTCxtQkFBMkI7QUFBQSxFQUNwQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQUksZ0JBQWdCO0FBQ2xCLFdBQU8sS0FBS2M7QUFBQSxFQUNkO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxJQUFJLGdCQUFnQjtBQUNsQixXQUFPLEtBQUssVUFBVTtBQUFBLEVBQ3hCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBSSxlQUFlO0FBQ2pCLFdBQU8sS0FBSztBQUFBLEVBQ2Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLGNBQWM7QUFDaEIsV0FBTyxLQUFLUixHQUFjLE1BQU07QUFBQSxFQUNsQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQUksbUJBQW1CO0FBQ3JCLFdBQU8sZ0JBQWdCLFdBQVcsS0FBSyxPQUFPLGFBQWEsS0FBS0EsSUFBZSxtQkFBa0J5QixFQUFZO0FBQUEsRUFDL0c7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLHVCQUF1QjtBQUN6QixXQUFPLENBQUMsS0FBS3hCO0FBQUEsRUFDZjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLHFCQUFxQixLQUFjO0FBQ3JDLGFBQVMsSUFBSSxHQUFHLElBQUksS0FBS1AsR0FBUyxRQUFRLEtBQUs7QUFDN0MsV0FBS0EsR0FBUyxDQUFDLEVBQUUsc0JBQXNCO0FBQUEsSUFDekM7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUksdUJBQXVCO0FBQ3pCLGFBQVMsSUFBSSxHQUFHLElBQUksS0FBS0EsR0FBUyxRQUFRLEtBQUs7QUFDN0MsVUFBSSxLQUFLQSxHQUFTLENBQUMsRUFBRSxxQkFBcUI7QUFDeEMsZUFBTztBQUFBLE1BQ1Q7QUFBQSxJQUNGO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUE0QkEsU0FBUztBQUVQLFFBQUksQ0FBQyxLQUFLLFlBQVk7QUFDcEI7QUFBQSxJQUNGO0FBS0EsVUFBTSwyQkFBMkIseUJBQXlCLHFCQUFxQixLQUFLNEIsQ0FBUTtBQUM1Riw2QkFBeUIsOEJBQThCLEtBQUtBLEdBQVUsd0JBQXdCO0FBRzlGLFFBQUksS0FBSyxVQUFVLFFBQVEsR0FBRztBQUM1QjtBQUFBLElBQ0Y7QUFFQSxRQUFJLEtBQUssV0FBVztBQUVsQixXQUFLSixHQUFpQztBQUl0QyxXQUFLUSxHQUE2QjtBQUNsQyxVQUFJLEtBQUtmLE9BQW1CLFFBQVc7QUFDckMsaUNBQXlCLHdCQUF3QixLQUFLVyxHQUFVLEtBQUtYLElBQWdCLEtBQUtqQixFQUFRO0FBQUEsTUFDcEc7QUFDQTtBQUFBLElBQ0Y7QUFFQSxTQUFLOEIsR0FBdUI7QUFHNUIsU0FBS0UsR0FBNkI7QUFDbEMsVUFBTSxXQUFXLEtBQUtmO0FBc0J0QixVQUFNLGVBQWUseUJBQXlCLHdCQUF3QixLQUFLVyxDQUFRO0FBQ25GLFVBQU0sOEJBQThCLHlCQUF5Qix1Q0FBdUMsS0FBS0EsQ0FBUTtBQUNqSCxVQUFNLCtCQUErQix5QkFBeUI7QUFBQSxNQUM1RCxLQUFLQTtBQUFBLElBQ1A7QUFFQSxRQUFJLFVBQVU7QUFDWixZQUFNLFFBQVEsbUJBQWtCSyxHQUF1QixJQUFJLFFBQVE7QUFJbkUsV0FBSSwrQkFBTyx1QkFBc0IsMEJBQTBCO0FBR3pELGNBQU0sV0FBVyxhQUFhLElBQUksUUFBUSxNQUFNLEtBQUs7QUFFckQsWUFBSSxDQUFDLFVBQVU7QUFHYixxQkFBVyxTQUFTLEtBQUtqQyxJQUFVO0FBQ2pDLGtCQUFNLGtCQUFrQiw0QkFBNEIsSUFBSSxNQUFNLFVBQVU7QUFJeEUsZ0JBQUksb0JBQW9CLFVBQWEsb0JBQW9CLE1BQU0sV0FBVztBQUN4RSwyQ0FBNkIsSUFBSSxNQUFNLFNBQVM7QUFBQSxZQUNsRDtBQUFBLFVBR0Y7QUFBQSxRQUNGO0FBSUEsYUFBS2tDLEdBQXFCLEtBQUs7QUFHL0IsYUFBS1YsR0FBaUM7QUFDdEM7QUFBQSxNQUNGO0FBSUEsbUJBQWEsSUFBSSxVQUFVLEtBQUssU0FBUztBQUt6QyxpQkFBVyxTQUFTLEtBQUt4QixJQUFVO0FBQ2pDLG9DQUE0QixJQUFJLE1BQU0sWUFBWSxNQUFNLFNBQVM7QUFBQSxNQUNuRTtBQUFBLElBQ0Y7QUFFQSxRQUFJLEtBQUttQyxHQUE4QixRQUFRLEdBQUc7QUFFaEQsVUFBSSxVQUFVO0FBQ1osMkJBQWtCRixHQUF1QixJQUFJLFVBQVUsS0FBS0csR0FBc0Isd0JBQXdCLENBQUM7QUFBQSxNQUM3RztBQUNBO0FBQUEsSUFDRjtBQUVBLFVBQU0sZUFBZSxLQUFLckI7QUFDMUIsVUFBTSxXQUFXLEtBQUssVUFBVTtBQUNoQyxVQUFNLGlCQUFpQixLQUFLSztBQUM1QixVQUFNLHFCQUFxQixLQUFLaUIsR0FBd0IsWUFBWTtBQUNwRSxVQUFNLHlCQUF5QixnQkFBZ0IsU0FBUyxLQUFLLE9BQU8sYUFBYSxtQkFBa0JDLEVBQVk7QUFDL0csUUFBSSxxQkFBcUI7QUFDekIsYUFBUyxJQUFJLEdBQUcsSUFBSSxLQUFLdEMsR0FBUyxRQUFRLEtBQUs7QUFDN0MsWUFBTSxRQUFRLEtBQUtBLEdBQVMsQ0FBQztBQUM3QixZQUFNLHVCQUF1QixNQUFNO0FBRW5DLFlBQU0sY0FBYyxnQkFBZ0I7QUFBQSxRQUNsQztBQUFBLFFBQ0EsZ0JBQWdCO0FBQUEsVUFDZDtBQUFBLFVBQ0EsS0FBS3FCLEdBQStCLGNBQWM7QUFBQSxVQUNsRCxtQkFBa0JrQjtBQUFBLFVBQ2xCO0FBQUEsUUFDRjtBQUFBLFFBQ0EsbUJBQWtCQztBQUFBLE1BQ3BCO0FBQ0EsVUFBSSxLQUFLLGtCQUFrQjtBQUV6QixvQkFBWSxTQUFTLEtBQUssZ0JBQWdCO0FBQUEsTUFDNUM7QUFDQSxZQUFNLElBQUk7QUFFVixVQUFJLE1BQU0sS0FBSyxNQUFNLE9BQU8sa0JBQWtCLEtBQUssTUFBTTtBQUN2RCxhQUFLbEMsR0FBYyxlQUFlLENBQUM7QUFBQSxNQUNyQztBQUNBLFVBQUksTUFBTSxLQUFLLEtBQUtOLEdBQVMsQ0FBQyxFQUFFLE9BQU8sa0JBQWtCLEtBQUssTUFBTTtBQUVsRSxhQUFLTSxHQUFjLGVBQWUsQ0FBQztBQUFBLE1BQ3JDO0FBRUEsV0FBS0MsS0FBeUI7QUFFOUIsVUFBSSxpQkFBaUIsYUFBYSxTQUFTO0FBQ3pDLGFBQUtrQyxHQUFpQixHQUFHLENBQUM7QUFDMUI7QUFBQSxNQUNGO0FBR0EsWUFBTSxJQUFJLEVBQUU7QUFDWixZQUFNLEtBQUssS0FBSyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQ3RDLFlBQU0sS0FBSyxLQUFLLE1BQU0sRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFDdEMsWUFBTSxLQUFLLEtBQUssTUFBTSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQztBQUV2QyxZQUFNLGFBQWEsbUJBQWtCQyxHQUFpQixDQUFDLElBQUk7QUFFM0QsVUFBSSxpQkFBaUIsYUFBYSxRQUFRO0FBRXhDLGNBQU0sV0FBVyxhQUFhLENBQUMsS0FBSztBQUNwQyxjQUFNLElBQUksbUJBQWtCQyxHQUFrQixHQUFHLFVBQVUsSUFBSSxFQUFFO0FBQ2pFLGNBQU0sVUFBVSxTQUFTLGNBQWMsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO0FBRXpELGNBQU0sT0FBTyxJQUFJO0FBQ2pCLGlCQUFTLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRTtBQUN6QixpQkFBUyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUU7QUFDekIsaUJBQVMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFO0FBQ3pCLHVCQUFlLE9BQU8sQ0FBQyxJQUFJLFFBQVEsQ0FBQztBQUNwQyxpQkFBUyxPQUFPLENBQUMsSUFBSTtBQUNyQixpQkFBUyxPQUFPLENBQUMsSUFBSTtBQUNyQixpQkFBUyxPQUFPLENBQUMsSUFBSTtBQUNyQix1QkFBZSxPQUFPLENBQUMsSUFBSSxRQUFRLENBQUM7QUFBQSxNQUN0QyxPQUFPO0FBRUwsWUFBSSxDQUFDLHNCQUFzQixDQUFDLFNBQVMsZUFBZSxJQUFJLElBQUksRUFBRSxHQUFHO0FBQy9ELCtCQUFxQjtBQUFBLFFBQ3ZCO0FBRUEsY0FBTSxPQUFPLGFBQWEsS0FBSztBQUMvQixjQUFNLElBQUksbUJBQWtCQSxHQUFrQixHQUFHLE9BQU8sSUFBSSxPQUFPLElBQUksT0FBTyxFQUFFO0FBQ2hGLGNBQU0sVUFBVSxTQUFTLGNBQWMsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO0FBR3pELDJCQUFtQixJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRTtBQUNwQywyQkFBbUIsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUU7QUFDcEMsMkJBQW1CLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFO0FBQ3BDLDJCQUFtQixJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssSUFBSSxJQUFJLElBQUksRUFBRTtBQUNuRCx1QkFBZSxJQUFJLElBQUksQ0FBQyxJQUFJLFFBQVEsQ0FBQztBQUNyQyx1QkFBZSxJQUFJLElBQUksQ0FBQyxJQUFJLGNBQWMsUUFBUSxDQUFDLElBQUksK0JBQStCLElBQUksUUFBUSxDQUFDO0FBQUEsTUFDckc7QUFBQSxJQUNGO0FBRUEsUUFBSSxzQkFBc0IsS0FBS0MsR0FBZ0MsR0FBRztBQUVoRSxXQUFLLE9BQU87QUFDWjtBQUFBLElBQ0Y7QUFFQSxRQUFJLGlCQUFpQixhQUFhLFFBQVE7QUFDeEMsVUFBSSxVQUFVO0FBQ2QsVUFBSSxVQUFVO0FBQ2QsVUFBSSxVQUFVO0FBQ2QsZUFBUyxJQUFJLEdBQUcsSUFBSSxLQUFLNUMsR0FBUyxRQUFRLEtBQUs7QUFDN0MsY0FBTSxPQUFPLEtBQUssSUFBSSxtQkFBbUIsSUFBSSxJQUFJLENBQUMsQ0FBQztBQUNuRCxZQUFJLE9BQU8sU0FBUztBQUNsQixvQkFBVTtBQUFBLFFBQ1o7QUFDQSxjQUFNLE9BQU8sS0FBSyxJQUFJLG1CQUFtQixJQUFJLElBQUksQ0FBQyxDQUFDO0FBQ25ELFlBQUksT0FBTyxTQUFTO0FBQ2xCLG9CQUFVO0FBQUEsUUFDWjtBQUNBLGNBQU0sT0FBTyxLQUFLLElBQUksbUJBQW1CLElBQUksSUFBSSxDQUFDLENBQUM7QUFDbkQsWUFBSSxPQUFPLFNBQVM7QUFDbEIsb0JBQVU7QUFBQSxRQUNaO0FBQUEsTUFDRjtBQUVBLGVBQVMsSUFBSSxHQUFHLElBQUksS0FBS0EsR0FBUyxRQUFRLEtBQUs7QUFFN0MsY0FBTSxjQUFjLG1CQUFtQixJQUFJLElBQUksQ0FBQyxJQUFJO0FBQ3BELGNBQU0sY0FBYyxtQkFBbUIsSUFBSSxJQUFJLENBQUMsSUFBSTtBQUNwRCxjQUFNLGNBQWMsbUJBQW1CLElBQUksSUFBSSxDQUFDLElBQUk7QUFDcEQsY0FBTSxlQUFlLFNBQVMsa0JBQWtCLG1CQUFtQixJQUFJLElBQUksQ0FBQyxDQUFDO0FBRTdFLGNBQU0sY0FBYyxTQUFTLHFCQUFxQixhQUFhLGFBQWEsYUFBYSxZQUFZO0FBQ3JHLHVCQUFlLElBQUksSUFBSSxDQUFDLElBQUksWUFBWSxDQUFDO0FBQ3pDLHVCQUFlLElBQUksSUFBSSxDQUFDLElBQUksWUFBWSxDQUFDO0FBQUEsTUFDM0M7QUFDQSxXQUFLNkIsR0FBa0IsU0FBUyxTQUFTLFNBQVMsWUFBWTtBQUFBLElBQ2hFLE9BQU87QUFDTCxXQUFLQSxHQUFrQixHQUFHLEdBQUcsR0FBRyxZQUFZO0FBQUEsSUFDOUM7QUFFQSxRQUFJLFVBQVU7QUFDWix5QkFBa0JJLEdBQXVCLElBQUksVUFBVSxLQUFLRyxHQUFzQix3QkFBd0IsQ0FBQztBQUFBLElBQzdHO0FBQ0EsU0FBS1MsR0FBNkIsUUFBUTtBQUFBLEVBQzVDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxPQUFlSCxHQUFpQixHQUFzQjtBQUVwRCxXQUNFLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUFBLEVBRWhIO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWVBLE9BQWVDLEdBQWtCLEdBQW9CLElBQVksSUFBWSxJQUFZO0FBQ3ZGLFVBQU0sSUFBSSxFQUFFO0FBQ1osVUFBTSxRQUFRLElBQUk7QUFDbEIsVUFBTSxRQUFRLElBQUk7QUFDbEIsVUFBTSxRQUFRLElBQUk7QUFDbEIsTUFBRSxDQUFDLEtBQUs7QUFDUixNQUFFLENBQUMsS0FBSztBQUNSLE1BQUUsQ0FBQyxLQUFLO0FBQ1IsTUFBRSxDQUFDLEtBQUs7QUFDUixNQUFFLENBQUMsS0FBSztBQUNSLE1BQUUsQ0FBQyxLQUFLO0FBQ1IsTUFBRSxDQUFDLEtBQUs7QUFDUixNQUFFLENBQUMsS0FBSztBQUNSLE1BQUUsRUFBRSxLQUFLO0FBQ1QsVUFBTSxJQUFJLG1CQUFrQkc7QUFDNUIsUUFBSSxDQUFDLEVBQUUsY0FBYyxDQUFDLEdBQUc7QUFDdkIsUUFBRSxjQUFjLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFBQSxJQUM1QjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFjUUYsS0FBMkM7QUFDakQsVUFBTSxvQkFBb0IsS0FBS0csR0FBZ0M7QUFDL0QsUUFDRSxLQUFLbkIsRUFBUyxPQUFPLGdCQUFnQixRQUNyQyxrQkFBa0IsTUFBTSxlQUFhLFVBQVUxQixFQUE0QixHQUMzRTtBQUNBLGlCQUFXLGFBQWEsbUJBQW1CO0FBQ3pDLGtCQUFVLGdCQUFnQixhQUFhLFFBQVEsSUFBSTtBQUFBLE1BQ3JEO0FBQ0EsV0FBSzBCLEVBQVMsT0FBTztBQUFBLFFBQ25CLDZCQUE2QixLQUFLLFNBQVMsK0ZBQStGLGtCQUFrQixNQUFNO0FBQUEsTUFDcEs7QUFDQSxhQUFPLEtBQUtiLE9BQTRCLGFBQWE7QUFBQSxJQUN2RDtBQUNBLFFBQUksQ0FBQyxLQUFLWixJQUE0QjtBQUNwQyxXQUFLQSxLQUE2QjtBQUNsQyxXQUFLeUIsRUFBUyxPQUFPO0FBQUEsUUFDbkIsNkJBQTZCLEtBQUssU0FBUztBQUFBLE1BQzdDO0FBQUEsSUFDRjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT1FtQixLQUF1RDtBQTd3QmpFO0FBOHdCSSxVQUFNLE1BQU0sS0FBSzlCO0FBQ2pCLFFBQUksT0FBTyxNQUFNO0FBQ2YsYUFBTyxDQUFDLElBQUk7QUFBQSxJQUNkO0FBQ0EsVUFBTSxjQUFjLFVBQUtXLEVBQVMsb0JBQW9CLHNCQUFzQixrQkFBaUIsTUFBekUsWUFDbEIsQ0FBQztBQUNILFdBQU8sV0FBVyxPQUFPLGVBQWEsY0FBYyxRQUFRLFVBQVVYLE9BQW1CLEdBQUc7QUFBQSxFQUM5RjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUVFvQixHQUF3QixjQUFnQztBQUM5RCxRQUFJLGlCQUFpQixhQUFhLFFBQVE7QUFDeEMsYUFBTyxLQUFLaEM7QUFBQSxJQUNkO0FBQ0EsVUFBTSxpQkFBaUIsS0FBS0wsR0FBUyxTQUFTO0FBQzlDLFFBQUksS0FBS0ssR0FBeUIsU0FBUyxnQkFBZ0I7QUFDekQsV0FBS0EsS0FBMkIsSUFBSSxhQUFhLGNBQWM7QUFBQSxJQUNqRTtBQUNBLFdBQU8sS0FBS0E7QUFBQSxFQUNkO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVVFvQyxHQUFpQixHQUFjLEdBQVU7QUFNL0MsU0FBSyxVQUFVLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQztBQUN0QyxTQUFLLFVBQVUsR0FBRyxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDO0FBQ3RDLFNBQUssVUFBVSxHQUFHLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUM7QUFDdEMsU0FBSyxVQUFVLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQztBQUN0QyxTQUFLLFVBQVUsR0FBRyxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDO0FBQ3RDLFNBQUssVUFBVSxHQUFHLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUM7QUFDdEMsU0FBSyxVQUFVLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQztBQUN0QyxTQUFLLFVBQVUsR0FBRyxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDO0FBQ3RDLFNBQUssVUFBVSxHQUFHLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUU7QUFDdkMsU0FBSyxVQUFVLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtBQUN2QyxTQUFLLFVBQVUsR0FBRyxJQUFJLEtBQUssRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFO0FBQ3hDLFNBQUssVUFBVSxHQUFHLElBQUksS0FBSyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUU7QUFBQSxFQUMxQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9PLGlDQUF1RDtBQUM1RCxXQUFPLEtBQUtwQjtBQUFBLEVBQ2Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBU0EsaUJBQWlCLFlBQTZCO0FBQzVDLFVBQU0sWUFBWTtBQUVsQixTQUFLLGdCQUFnQixVQUFVLGNBQWMsT0FBTztBQUNwRCxTQUFLcEIsS0FBaUIsVUFBVUE7QUFDaEMsU0FBS0MsS0FBK0IsVUFBVUE7QUFFOUMsUUFBSSxVQUFVRixHQUFTLFNBQVMsR0FBRztBQUNqQyxXQUFLLFVBQVUsVUFBVUEsR0FBUyxPQUFPLENBQUM7QUFDMUMsV0FBS2dELEdBQXNCLFNBQVM7QUFBQSxJQUN0QyxPQUFPO0FBQ0wsV0FBS2hELEtBQVcsQ0FBQztBQUNqQixXQUFLd0IsR0FBaUM7QUFBQSxJQUN4QztBQUVBLFNBQUtILEtBQWdDLFVBQVVBO0FBQy9DLFFBQUksR0FBRyxNQUFNLFVBQVUsZ0JBQWdCLEdBQUc7QUFDeEMsV0FBSyxtQkFBbUIsVUFBVSxpQkFBaUIsTUFBTTtBQUFBLElBQzNEO0FBQ0EsU0FBSyx1QkFBdUIsVUFBVTtBQUN0QyxTQUFLLGFBQWEsVUFBVTtBQUM1QixTQUFLZixHQUFjLGVBQWUsVUFBVUEsRUFBYTtBQUN6RCxTQUFLQyxLQUF5QixVQUFVQTtBQUN4QyxTQUFLVyxLQUFpQyxVQUFVQTtBQUNoRCxTQUFLRixLQUFpQixVQUFVQTtBQUNoQyxTQUFLTyxHQUFxQjtBQUFBLEVBQzVCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBSSxTQUEwQjtBQUM1QixXQUFPLEtBQUtLLEVBQVMsaUJBQWlCLFVBQVUsS0FBS3FCLEVBQVc7QUFBQSxFQUNsRTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLFdBQWlCO0FBQ2YsU0FBS3pCLEdBQWlDO0FBQ3RDLFVBQU0sU0FBUztBQUFBLEVBQ2pCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFpQkEsT0FBTyxlQUFlLFdBQXNCLFFBQXlCO0FBQ25FLFdBQU8seUJBQXlCLGVBQWUsV0FBVyxNQUFNO0FBQUEsRUFDbEU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVdBLHlCQUNFLE1BQ0EsaUJBQ0E7QUFBQSxJQUNBLE1BQU0sdUJBQXdCLEtBQUssWUFBb0I7QUFBQSxNQUNyRCxjQUFjO0FBQ1osZUFBTyxLQUFLLDJCQUEyQix1QkFBdUIsb0JBQW9CO0FBQUEsTUFDcEY7QUFBQSxJQUNGO0FBQ0EsZ0JBQVksTUFBTSxjQUFjO0FBQ2hDLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBLHdCQUF3QixJQUFvQztBQUMxRCxVQUFNLFFBQVEsS0FBS3hCLEdBQVMsUUFBUSxFQUFFO0FBQ3RDLFVBQU0sZUFBZSxLQUFLcUIsR0FBK0IsY0FBYztBQUN2RSxVQUFNLElBQUksSUFBSSxTQUFTLGFBQWEsTUFBTSxRQUFRLElBQUksUUFBUSxLQUFLLEVBQUUsQ0FBQztBQUN0RSxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRVEyQixHQUFzQixXQUE4QjtBQUMxRCxVQUFNLGFBQWEsQ0FBQyxRQUFpQixXQUFvQjtBQUN2RCxVQUFJLE9BQU8sUUFBUSxLQUFLLE9BQU8sUUFBUSxHQUFHO0FBQ3hDO0FBQUEsTUFDRjtBQUNBLGFBQU8sZUFBZSxNQUFNO0FBQUEsSUFDOUI7QUFFQSxRQUFJLEdBQUcsTUFBTSxVQUFVbEMsRUFBZSxHQUFHO0FBQ3ZDLFdBQUtBLEtBQWtCLFVBQVVBLEdBQWlCLE9BQU87QUFBQSxJQUMzRCxPQUFPO0FBQ0wsV0FBS0EsS0FBa0I7QUFBQSxJQUN6QjtBQUVBLFFBQ0UsS0FBS0MsT0FBNEIsVUFBVUEsTUFDM0MsS0FBSyxVQUFVLEdBQUcsV0FBVyxVQUFVLFVBQVUsR0FBRyxRQUNwRDtBQUNBLGlCQUFXLEtBQUssV0FBVyxVQUFVLFNBQVM7QUFDOUMsVUFBSSxDQUFDLEtBQUssY0FBYyxRQUFRLEtBQUssQ0FBQyxVQUFVLGNBQWMsUUFBUSxHQUFHO0FBQ3ZFLGFBQUssY0FBYyxlQUFlLFVBQVUsYUFBYTtBQUFBLE1BQzNEO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxPQUFPLDBCQUEwQjtBQUUvQix1QkFBa0IsZUFBZTtBQUFBLE1BQy9CLFdBQVcsVUFBVTtBQUFBLE1BQ3JCLFlBQVk7QUFBQSxNQUNaLGVBQWU7QUFBQSxNQUNmLFlBQVksV0FBVztBQUFBLE1BQ3ZCLGlCQUFpQixnQkFBZ0I7QUFBQSxNQUNqQyxlQUFlLGNBQWM7QUFBQSxNQUM3QixZQUFZLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztBQUFBLElBQ3pCLENBQUM7QUFDRCx1QkFBa0IsZUFBZTtBQUFBLE1BQy9CLFdBQVcsVUFBVTtBQUFBLE1BQ3JCLFlBQVk7QUFBQSxNQUNaLGVBQWU7QUFBQSxNQUNmLFlBQVksV0FBVztBQUFBLE1BQ3ZCLGlCQUFpQixnQkFBZ0I7QUFBQSxNQUNqQyxlQUFlLGNBQWM7QUFBQSxNQUM3QixZQUFZLElBQUksUUFBUSxJQUFJLGFBQWEsQ0FBQyxDQUFDO0FBQUEsTUFDM0Msa0JBQWtCO0FBQUEsSUFDcEIsQ0FBQztBQUFBLEVBQ0g7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLE9BQU8sOEJBQThCO0FBQ25DLHVCQUFrQixlQUFlO0FBQUEsTUFDL0IsV0FBVyxVQUFVO0FBQUEsTUFDckIsWUFBWTtBQUFBLE1BQ1osZUFBZTtBQUFBLE1BQ2YsWUFBWSxXQUFXO0FBQUEsTUFDdkIsaUJBQWlCLGdCQUFnQjtBQUFBLE1BQ2pDLGVBQWUsY0FBYztBQUFBLE1BQzdCLFlBQVksQ0FBQyxHQUFHLEdBQUcsR0FBRyxhQUFhLE9BQU8sS0FBSztBQUFBLElBQ2pELENBQUM7QUFBQSxFQUNIO0FBQUEsRUFFQSxPQUFlVSxHQUFvQixRQUErQjtBQUVoRSxXQUFPLE9BQU8sSUFBSSxXQUFVLE1BQU0sY0FBYyxJQUFJLE1BQU0sYUFBYSxFQUFHLEVBQUUsS0FBSyxHQUFHO0FBQUEsRUFDdEY7QUFBQSxFQUVBLE9BQWV5QixHQUFZLFlBQXdCO0FBQ2pELFFBQUksT0FBTztBQUNYLGFBQVMsSUFBSSxHQUFHLElBQUksV0FBVyxRQUFRLEtBQUs7QUFDMUMsY0FBUSxXQUFXLENBQUM7QUFDcEIsZUFBUyxRQUFRLE1BQU0sUUFBUSxNQUFNLFFBQVEsTUFBTSxRQUFRLE1BQU0sUUFBUTtBQUN6RSxnQkFBVTtBQUFBLElBQ1o7QUFDQSxXQUFPLFNBQVM7QUFBQSxFQUNsQjtBQUFBLEVBRUEsT0FBZTVCLEdBQXVCLFVBQW9CO0FBQ3hELFVBQU0sU0FBUyxLQUFLNkIsR0FBeUIsSUFBSSxRQUFRO0FBQ3pELFFBQUksV0FBVyxRQUFXO0FBQ3hCLGFBQU87QUFBQSxJQUNUO0FBRUEsVUFBTSxhQUFhLFNBQVMsY0FBYztBQUMxQyxVQUFNLE9BQU8sSUFBSSxXQUFXLFdBQVcsUUFBUSxXQUFXLFlBQVksV0FBVyxVQUFVO0FBQzNGLFVBQU0sT0FBTyxLQUFLRCxHQUFZLElBQUk7QUFRbEMsVUFBTSxZQUFZLEtBQUssU0FBUyxFQUFFO0FBQ2xDLFNBQUtDLEdBQXlCLElBQUksVUFBVSxTQUFTO0FBQ3JELFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxPQUFlQyxHQUF3QixpQkFBNEI7QUFDakUsUUFBSSxDQUFDLGlCQUFpQjtBQUNwQixhQUFPO0FBQUEsSUFDVDtBQUNBLFVBQU0sU0FBUyxLQUFLQyxHQUF3QixJQUFJLGVBQWU7QUFDL0QsUUFBSSxXQUFXLFFBQVc7QUFDeEIsYUFBTztBQUFBLElBQ1Q7QUFDQSxVQUFNLFlBQVksTUFBTSxLQUFLLGdCQUFnQixFQUFFLEVBQUUsS0FBSyxHQUFHO0FBQ3pELFNBQUtBLEdBQXdCLElBQUksaUJBQWlCLFNBQVM7QUFDM0QsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVRQyxLQUFxRDtBQUMzRCxRQUFJLEtBQUssT0FBTyxVQUFVLE1BQU07QUFDOUIsYUFBTztBQUFBLElBQ1Q7QUFDQSxXQUFPLEtBQUtDLEdBQWdDLEtBQUssT0FBTyxPQUFPLE1BQU07QUFBQSxFQUN2RTtBQUFBLEVBRVFBLEdBQWdDLFFBQStDO0FBQ3JGLFVBQU0sU0FBbUIsQ0FBQztBQUMxQixVQUFNLGdCQUFnQixDQUFDLFdBQThCO0FBQ25ELFlBQU0scUJBQXFCLE9BQU8sa0JBQWtCO0FBQ3BELFVBQUksc0JBQXNCLE1BQU07QUFDOUIsY0FBTSxvQkFBb0IsbUJBQW1CLDRCQUE0QjtBQUN6RSxZQUFJLGtCQUFrQixPQUFPLEdBQUc7QUFDOUIsZ0JBQU0sa0JBQWtCLG9CQUFJLElBQVk7QUFDeEMsZ0JBQU0sa0JBQWtCLG1CQUFtQix3QkFBd0I7QUFDbkUsZ0JBQU0sdUJBQXVCLE1BQU0sS0FBSyxrQkFBa0IsS0FBSyxDQUFDLEVBQUU7QUFBQSxZQUFLLGNBQ3JFLFNBQVMsV0FBVyxnQkFBZ0I7QUFBQSxVQUN0QztBQUNBLGNBQUksd0NBQXdDO0FBQzVDLHFCQUFXLENBQUMsVUFBVSxPQUFPLEtBQUssbUJBQW1CO0FBQ25ELGdCQUNFLENBQUMsU0FBUyxXQUFXLGdCQUFnQixLQUNyQyxRQUFRLGNBQWMsaUJBQWlCLEVBQUUsU0FBUyxlQUFlLEdBQ2pFO0FBQ0Esc0RBQXdDO0FBQ3hDO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFDQSxjQUFJLHVDQUF1QztBQUN6QyxrQkFBTSxPQUFPLG1CQUFtQix3QkFBd0I7QUFDeEQsZ0JBQUksUUFBUSxNQUFNO0FBQ2hCLDhCQUFnQixJQUFJLElBQUk7QUFBQSxZQUMxQjtBQUFBLFVBQ0Y7QUFDQSxjQUFJLGdCQUFnQixTQUFTLEtBQUssQ0FBQyxzQkFBc0I7QUFDdkQsdUJBQVcsQ0FBQyxVQUFVLE9BQU8sS0FBSyxtQkFBbUI7QUFDbkQsa0JBQUksU0FBUyxXQUFXLGdCQUFnQixHQUFHO0FBQ3pDO0FBQUEsY0FDRjtBQUNBLG9CQUFNLHFCQUFxQixRQUFRLGNBQWMsd0NBQXdDO0FBQ3pGLG9CQUFNLE9BQU8sbUJBQW1CLDZCQUE2QixrQkFBa0I7QUFDL0Usa0JBQUksUUFBUSxNQUFNO0FBQ2hCLGdDQUFnQixJQUFJLElBQUk7QUFBQSxjQUMxQjtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQ0EscUJBQVcsUUFBUSxpQkFBaUI7QUFDbEMsbUJBQU8sS0FBSyxJQUFJO0FBQUEsVUFDbEI7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUNBLGlCQUFXLFNBQVMsT0FBTyxVQUFVO0FBQ25DLHNCQUFjLE1BQU0sTUFBTTtBQUFBLE1BQzVCO0FBQUEsSUFDRjtBQUNBLGtCQUFjLE1BQU07QUFFcEIsUUFBSSxPQUFPLFdBQVcsR0FBRztBQUN2QixhQUFPO0FBQUEsSUFDVDtBQUNBLFFBQUksT0FBTyxXQUFXLEdBQUc7QUFDdkIsYUFBTyxPQUFPLENBQUM7QUFBQSxJQUNqQjtBQUVBLFdBQU8sU0FBUyxRQUFRLE9BQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUMxQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVRdkIsS0FBK0I7QUFDckMsUUFDRSxLQUFLeEIsT0FBMEMseUJBQXlCLDJCQUEyQixLQUNuRyxLQUFLQyxPQUFtQyxvQkFBb0Isa0JBQzVEO0FBQ0E7QUFBQSxJQUNGO0FBQ0EsU0FBS2MsR0FBcUI7QUFBQSxFQUM1QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFxQlFBLEtBQXVCO0FBeHBDakM7QUF5cENJLFNBQUtmLEtBQXdDLHlCQUF5QiwyQkFBMkI7QUFDakcsU0FBS0MsS0FBaUMsb0JBQW9CO0FBRTFELFFBQUksQ0FBQyxLQUFLWSxJQUErQjtBQUN2QyxXQUFLSixLQUFpQjtBQUN0QjtBQUFBLElBQ0Y7QUFHQSxRQUFJLENBQUMsS0FBS0MsSUFBZ0M7QUFDeEMsV0FBS0EsS0FBaUMsbUJBQWtCSTtBQUFBLFFBQ3RELEtBQUtEO0FBQUEsTUFDUDtBQUFBLElBQ0Y7QUFFQSxVQUFNLDRCQUE0QixLQUFLaUMsR0FBK0I7QUFFdEUsVUFBTSxzQkFBcUIsVUFBS3ZDLE9BQUwsWUFBZ0MsS0FBSyxjQUFjO0FBRTlFLFFBQUksNkJBQTZCLE1BQU07QUFPckMsV0FBS0UsS0FBaUIsUUFBUSwwQkFBMEIsU0FBUyxDQUFDLElBQUksS0FBS0MsRUFBOEIsS0FDdkcsVUFBS0YsT0FBTCxZQUF1QixFQUN6QixJQUFJLGlCQUFpQjtBQUFBLElBQ3ZCLE9BQU87QUFHTCxVQUFJLENBQUMsS0FBS0EsSUFBZ0I7QUFDeEIsYUFBS0MsS0FBaUI7QUFDdEI7QUFBQSxNQUNGO0FBQ0EsV0FBS0EsS0FBaUIsR0FBRyxLQUFLRCxFQUFjLElBQUksS0FBS0UsRUFBOEIsaUJBQWlCLGlCQUFpQjtBQUFBLElBQ3ZIO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS1FNLEtBQW1DO0FBQ3pDLFNBQUtkLEtBQTRCO0FBQUEsRUFDbkM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBZVF5QixHQUE4QixVQUF1QztBQUMzRSxRQUFJLENBQUMsS0FBS3pCLElBQTJCO0FBQ25DLGFBQU87QUFBQSxJQUNUO0FBQ0EsUUFBSSxLQUFLOEMsT0FBOEIsVUFBVTtBQUMvQyxhQUFPO0FBQUEsSUFDVDtBQUNBLFFBQUksS0FBS0MsT0FBcUMsS0FBSyxrQkFBa0I7QUFDbkUsYUFBTztBQUFBLElBQ1Q7QUFDQSxVQUFNLG1CQUFtQixLQUFLLE9BQU8sY0FBYztBQUNuRCxRQUFJLG9CQUFvQixRQUFRLGlCQUFpQix1QkFBdUIsS0FBSzdDLElBQTZCO0FBQ3hHLGFBQU87QUFBQSxJQUNUO0FBQ0EsUUFBSSxrQkFBa0I7QUFDdEIsYUFBUyxJQUFJLEdBQUcsSUFBSSxLQUFLWixHQUFTLFFBQVEsS0FBSztBQUM3Qyx5QkFBbUIsS0FBS0EsR0FBUyxDQUFDLEVBQUU7QUFBQSxJQUN0QztBQUNBLFdBQU8sb0JBQW9CLEtBQUtXO0FBQUEsRUFDbEM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTVFrQyxHQUE2QixVQUE4QjtBQTl1Q3JFO0FBK3VDSSxRQUFJLGtCQUFrQjtBQUN0QixhQUFTLElBQUksR0FBRyxJQUFJLEtBQUs3QyxHQUFTLFFBQVEsS0FBSztBQUM3Qyx5QkFBbUIsS0FBS0EsR0FBUyxDQUFDLEVBQUU7QUFBQSxJQUN0QztBQUNBLFNBQUt3RCxLQUE0QjtBQUNqQyxTQUFLN0MsS0FBbUM7QUFDeEMsU0FBS0MsTUFBOEIsZ0JBQUssT0FBTyxjQUFjLE1BQTFCLG1CQUE2Qix1QkFBN0IsWUFBbUQ7QUFDdEYsU0FBSzZDLEtBQW1DLEtBQUs7QUFDN0MsU0FBSy9DLEtBQTRCO0FBQUEsRUFDbkM7QUFBQSxFQUVRMEIsR0FBc0IsbUJBQTBDO0FBQ3RFLFVBQU0sT0FBTyxLQUFLLGNBQWM7QUFDaEMsV0FBTztBQUFBLE1BQ0w7QUFBQSxNQUNBLFVBQVUsS0FBSyxVQUFVLFFBQVEsSUFBSSxTQUFZLEtBQUssVUFBVTtBQUFBLE1BQ2hFLGNBQWMsQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQztBQUFBLE1BQ2pELGFBQWEsS0FBSzlCLEdBQWM7QUFBQSxNQUNoQyxzQkFBc0IsS0FBS0M7QUFBQSxJQUM3QjtBQUFBLEVBQ0Y7QUFBQSxFQUVRMkIsR0FBcUIsT0FBc0I7QUFDakQsU0FBSzNCLEtBQXlCLE1BQU07QUFDcEMsU0FBS0QsR0FBYyxHQUFHLElBQUksTUFBTSxXQUFXO0FBQzNDLFFBQUksTUFBTSxZQUFZLE1BQU07QUFDMUI7QUFBQSxJQUNGO0FBRUEsVUFBTSxZQUFZLEtBQUtOLEdBQVMsU0FBUyxhQUFhLHFCQUFxQixLQUFLZSxFQUF3QixJQUFJO0FBQzVHLFNBQUssVUFBVSxHQUFHLElBQUksTUFBTSxTQUFTLFNBQVMsR0FBRyxLQUFLLElBQUksV0FBVyxLQUFLLFVBQVUsR0FBRyxNQUFNLENBQUMsQ0FBQztBQUMvRixRQUFJLENBQUMsS0FBSyxjQUFjLFFBQVEsR0FBRztBQUNqQyxXQUFLLGNBQWMsR0FBRyxJQUFJLE1BQU0sWUFBWTtBQUFBLElBQzlDO0FBQUEsRUFDRjtBQUNGO0FBcnVDYSxtQkF5Q0lrQixLQUFxRCxvQkFBSSxJQUFJO0FBekNqRSxtQkEwQ0lrQixLQUFzRCxvQkFBSSxRQUFRO0FBMUN0RSxtQkEyQ0lFLEtBQXFELG9CQUFJLFFBQVE7QUEzQ3JFLG1CQTZESWxDLEtBQXNCO0FBN0QxQixtQkE4RElvQixLQUFhLGdCQUFnQixTQUFTO0FBOUQxQyxtQkErRElPLEtBQTZCLGtCQUFrQixVQUFVLEdBQUcsR0FBRyxHQUFHLENBQUM7QUEvRHZFLG1CQWdFSVIsS0FBZSxnQkFBZ0IsU0FBUztBQWhFNUMsbUJBaUVJRSxLQUFlLGdCQUFnQixTQUFTO0FBakU1QyxtQkFrRUlULEtBQWUsZ0JBQWdCLFNBQVM7QUFsRWxELElBQU0sb0JBQU47QUF3dUNQLGtCQUFrQix3QkFBd0I7QUFDMUMsa0JBQWtCLDRCQUE0QjsiLAogICJuYW1lcyI6IFsiX19qb2ludHMiLCAiX19ib25lRGF0YVR5cGUiLCAiX19pc0JvbmVEYXRhVHlwZUF1dG9TZWxlY3RlZCIsICJfX2hhc1dhcm5lZE5vblVuaWZvcm1TY2FsZSIsICJfX2JvbmVEYXRhQXJyYXlMZW5ndGgiLCAiX19ib25lVHJhbnNsYXRlU2NhbGVXb3JrIiwgIl9fam9pbnRNYXRyaXgiLCAiX19pc1dvcmxkTWF0cml4VmFuaWxsYSIsICJfX3NraW5DYWNoZUtleUFuaW1hdGlvbkJpbmRpbmdWZXJzaW9uIiwgIl9fc2tpbkNhY2hlS2V5SGllcmFyY2h5VmVyc2lvbiIsICJfX2hhc1NraW5Db21wdXRlU2lnbmF0dXJlIiwgIl9fbGFzdFNraW5Db21wdXRlSm9pbnRWZXJzaW9uU3VtIiwgIl9fbGFzdFNraW5Db21wdXRlT3duVmVyc2lvbiIsICJfX3Jlc2V0Qm9uZURhdGFCdWZmZXJzIiwgIl9fam9pbnRNYXRyaWNlcyIsICJfX2FsbG9jYXRlZEJvbmVEYXRhVHlwZSIsICJfX2pvaW50TGlzdEtleSIsICJfX3NraW5DYWNoZUtleSIsICJfX2ludmVyc2VCaW5kTWF0cmljZXNTaWduYXR1cmUiLCAiX190b29rR2xvYmFsRGF0YU51bSIsICJfX2JvbmVEYXRhVWludDMyIiwgIl9faW52ZXJzZUJpbmRNYXRyaWNlc0FjY2Vzc29yIiwgIl9fZ2V0QWNjZXNzb3JTaWduYXR1cmUiLCAiX191cGRhdGVTa2luQ2FjaGVLZXkiLCAiX19pbnZhbGlkYXRlU2tpbkNvbXB1dGVTaWduYXR1cmUiLCAiX19idWlsZEpvaW50TGlzdEtleSIsICJfX2NhbGNCb25lRGF0YUFycmF5TGVuZ3RoIiwgIl9faXNSZVVzZSIsICJfX2VuZ2luZSIsICJfX3NldEJvbmVEYXRhSW5mbyIsICJfX2Vuc3VyZUJvbmVEYXRhTGF5b3V0IiwgIl9fdG1wX21hdDRfNCIsICJfX3VwZGF0ZVNraW5DYWNoZUtleUlmTmVlZGVkIiwgIl9fc2tpbkNhbGN1bGF0aW9uQ2FjaGUiLCAiX19hcHBseVNraW5uaW5nQ2FjaGUiLCAiX19pc1NraW5Db21wdXRlSW5wdXRVbmNoYW5nZWQiLCAiX19jcmVhdGVTa2lubmluZ0NhY2hlIiwgIl9fZ2V0VHJhbnNsYXRlU2NhbGVXb3JrIiwgIl9fdG1wX21hdDRfMiIsICJfX3RtcF9tYXQ0IiwgIl9fdG1wX21hdDRfMyIsICJfX2NvcHlUb01hdEFycmF5IiwgIl9fZGV0ZXJtaW5hbnQzeDMiLCAiX19leHRyYWN0Um90YXRpb24iLCAiX19oYW5kbGVOb25Vbmlmb3JtU2NhbGVPZlZlYzR4MSIsICJfX3JlY29yZFNraW5Db21wdXRlU2lnbmF0dXJlIiwgIl9fdG1wX3EiLCAiX19nZXRDb21wb25lbnRzU2hhcmluZ1NraW5DYWNoZSIsICJfX2NvcHlCb25lQnVmZmVyc0Zyb20iLCAiX19lbnRpdHlVaWQiLCAiX19oYXNoQnl0ZXMiLCAiX19hY2Nlc3NvclNpZ25hdHVyZUNhY2hlIiwgIl9fZ2V0QmluZFNoYXBlU2lnbmF0dXJlIiwgIl9fYmluZFNoYXBlU2lnbmF0dXJlTWFwIiwgIl9fZ2V0QW5pbWF0aW9uVHJhY2tGZWF0dXJlSGFzaCIsICJfX2ZpbmRBbmltYXRpb25UcmFja0ZlYXR1cmVIYXNoIiwgIl9fbGFzdFNraW5Db21wdXRlQ2FjaGVLZXkiLCAiX19sYXN0U2tpbkNvbXB1dGVCaW5kU2hhcGVNYXRyaXgiXQp9Cg==
