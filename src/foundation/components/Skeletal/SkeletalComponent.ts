import type { ComponentSID, ComponentTID, EntityUID, Index, TypedArray } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import { Config } from '../../core/Config';
import type { IEntity } from '../../core/Entity';
import { EntityRepository, applyMixins } from '../../core/EntityRepository';
import { GlobalDataRepository } from '../../core/GlobalDataRepository';
import { BoneDataType, type BoneDataTypeEnum } from '../../definitions/BoneDataType';
import { BufferUse } from '../../definitions/BufferUse';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { ProcessStage } from '../../definitions/ProcessStage';
import { ShaderSemantics } from '../../definitions/ShaderSemantics';
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
import { Logger } from '../../misc/Logger';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import type { SceneGraphComponent } from '../SceneGraph/SceneGraphComponent';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';
import { TransformComponent } from '../Transform/TransformComponent';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

type SkinningCache = {
  updateCount: number;
  jointMatrices?: number[];
  boneMatrix?: TypedArray;
  boneTranslatePackedQuat?: TypedArray;
  boneScalePackedQuat?: TypedArray;
  boneQuaternion?: TypedArray;
  boneTranslateScale?: TypedArray;
  boneCompressedChunk?: TypedArray;
  worldMatrix: Float32Array;
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
  private __worldMatrix = MutableMatrix44.identity();
  private __isWorldMatrixVanilla = true;
  _isCulled = false;
  private static __globalDataRepository = GlobalDataRepository.getInstance();
  private static __skinCalculationCache: Map<string, SkinningCache> = new Map();
  private static __accessorSignatureCache: WeakMap<Accessor, string> = new WeakMap();
  private static __bindShapeSignatureMap: WeakMap<Matrix44, string> = new WeakMap();
  private __jointListKey?: string;
  private __skinCacheKey?: string;
  private __inverseBindMatricesSignature?: string;
  private static __tookGlobalDataNum = 0;
  private static __tmpVec3_0 = MutableVector3.zero();
  private static __tmp_mat4 = MutableMatrix44.identity();
  private static __tmp_q: MutableQuaternion = MutableQuaternion.fromCopy4(0, 0, 0, 1);
  private static __tmp_mat4_2 = MutableMatrix44.identity();
  private static __tmp_mat4_3 = MutableMatrix44.identity();

  /**
   * Creates a new SkeletalComponent instance.
   * Initializes the component with skeletal animation capabilities and reserves global data resources.
   *
   * @param entityUid - The unique identifier of the entity this component belongs to
   * @param componentSid - The component's system identifier
   * @param entityRepository - The repository managing entities
   * @param isReUse - Whether this component is being reused from a pool
   */
  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean) {
    super(entityUid, componentSid, entityRepository, isReUse);
    this.moveStageTo(ProcessStage.Logic);

    if (isReUse) {
      // Reset bone data buffers when reusing component to prevent display corruption
      this.__resetBoneDataBuffers();
      // Reset world matrix to initial state
      this.__worldMatrix = MutableMatrix44.identity();
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
  static get componentTID(): ComponentTID {
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

    if (Config.boneDataType === BoneDataType.Vec4x1) {
      this.__qtsInfo = SkeletalComponent.__globalDataRepository.getValue('boneCompressedInfo', 0);
    }

    const jointCount =
      Config.skeletalComponentCountPerBufferView === 1 ? joints.length : Config.maxBoneNumberForMemoryBoostMode;
    this.__registerBoneDataMembers(jointCount);

    // Check if this component is being reused to determine allocation strategy
    const isComponentReused = this.__isReUse;
    this.submitToAllocation(Config.skeletalComponentCountPerBufferView, isComponentReused);
    console.count('SkeletalComponent.setJoints - FINAL TEST');
  }

  /**
   * Lightweight joint update for remapping during shallow copy.
   * Only updates joint references without reinitializing buffers.
   */
  updateJointsLightweight(joints: SceneGraphComponent[]) {
    this.__joints = joints;
    this.__jointListKey = SkeletalComponent.__buildJointListKey(joints);
    this.__updateSkinCacheKey();
    console.count('SkeletalComponent.updateJointsLightweight - FINAL TEST');
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
    return this.__worldMatrix.clone();
  }

  /**
   * Gets the internal world matrix (direct reference).
   *
   * @returns The internal world matrix
   */
  get worldMatrixInner() {
    return this.__worldMatrix;
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
   */
  $logic() {
    if (!this.isSkinning || this._isCulled) {
      return;
    }

    this.__updateSkinCacheKey();
    const cacheKey = this.__skinCacheKey;
    const currentUpdateCount = TransformComponent.updateCount;
    if (cacheKey) {
      const cache = SkeletalComponent.__skinCalculationCache.get(cacheKey);
      if (cache?.updateCount === currentUpdateCount) {
        this.__applySkinningCache(cache);
        return;
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
        this.__worldMatrix.copyComponents(m);
      }
      if (i === 1 && this.__joints[0].entity.tryToGetAnimation() == null) {
        // if the first joint has no animation (e.g. Root joint), expect the second joint to have a significant matrix
        this.__worldMatrix.copyComponents(m);
      }

      this.__isWorldMatrixVanilla = false;

      if (Config.boneDataType === BoneDataType.Mat43x1 || Config.boneDataType === BoneDataType.Vec4x1) {
        this.__copyToMatArray(m, i);
      }

      if (Config.boneDataType !== BoneDataType.Mat43x1) {
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

        if (Config.boneDataType === BoneDataType.Vec4x2Old || Config.boneDataType === BoneDataType.Vec4x1) {
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

        if (Config.boneDataType === BoneDataType.Vec4x2) {
          const vec2QPacked = MathUtil.packNormalizedVec4ToVec2(q.x, q.y, q.z, q.w, 2 ** 12);
          this._boneTranslatePackedQuat.setAt(i * 4 + 0, m.m03);
          this._boneTranslatePackedQuat.setAt(i * 4 + 1, m.m13);
          this._boneTranslatePackedQuat.setAt(i * 4 + 2, m.m23);
          this._boneScalePackedQuat.setAt(i * 4 + 0, scaleVec.x);
          this._boneScalePackedQuat.setAt(i * 4 + 1, scaleVec.y);
          this._boneScalePackedQuat.setAt(i * 4 + 2, scaleVec.z);
          this._boneTranslatePackedQuat.setAt(i * 4 + 3, vec2QPacked[0]);
          this._boneScalePackedQuat.setAt(i * 4 + 3, vec2QPacked[1]);
        } else if (Config.boneDataType === BoneDataType.Vec4x2Old) {
          this._boneTranslateScale.setAt(i * 4 + 0, m.m03); // m.getTranslate().x
          this._boneTranslateScale.setAt(i * 4 + 1, m.m13); // m.getTranslate().y
          this._boneTranslateScale.setAt(i * 4 + 2, m.m23); // m.getTranslate().z
          this._boneQuaternion.setAt(i * 4 + 0, q.x);
          this._boneQuaternion.setAt(i * 4 + 1, q.y);
          this._boneQuaternion.setAt(i * 4 + 2, q.z);
          this._boneQuaternion.setAt(i * 4 + 3, q.w);
        }

        if (Config.boneDataType === BoneDataType.Vec4x1) {
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

    if (Config.boneDataType === BoneDataType.Vec4x1) {
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
      SkeletalComponent.__skinCalculationCache.set(cacheKey, this.__createSkinningCache(currentUpdateCount));
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
    this.__worldMatrix.copyComponents(component.__worldMatrix);
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
    return EntityRepository.getEntity(this.__entityUid) as unknown as ISkeletalEntity;
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
    const boneDataType = Config.boneDataType;

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

  private __getVrmComponentUid() {
    const vrm = this.entity.parent?.entity.tryToGetVrm();
    if (vrm != null) {
      return vrm.entityUID;
    }
    return -1;
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

  private __updateSkinCacheKey() {
    if (!this.__jointListKey || !this.__inverseBindMatricesAccessor) {
      this.__skinCacheKey = undefined;
      return;
    }

    if (!this.__inverseBindMatricesSignature) {
      this.__inverseBindMatricesSignature = SkeletalComponent.__getAccessorSignature(
        this.__inverseBindMatricesAccessor
      );
    }
    const accessorSignature = this.__inverseBindMatricesSignature;
    const animationTrackFeatureHash = this.__getAnimationTrackFeatureHash();
    this.__skinCacheKey = `${this.__jointListKey}|${accessorSignature}|${animationTrackFeatureHash?.toString() ?? 'no_animation_hash'}`;
  }

  private __createSkinningCache(updateCount: number): SkinningCache {
    const hasQtsInfo = this.__qtsInfo != null && this.__qtsInfo._v.length >= 4;
    return {
      updateCount,
      jointMatrices: this.__jointMatrices,
      boneMatrix: this._boneMatrix.isDummy() ? undefined : this._boneMatrix._v,
      boneTranslatePackedQuat: this._boneTranslatePackedQuat.isDummy() ? undefined : this._boneTranslatePackedQuat._v,
      boneScalePackedQuat: this._boneScalePackedQuat.isDummy() ? undefined : this._boneScalePackedQuat._v,
      boneQuaternion: this._boneQuaternion.isDummy() ? undefined : this._boneQuaternion._v,
      boneTranslateScale: this._boneTranslateScale.isDummy() ? undefined : this._boneTranslateScale._v,
      boneCompressedChunk: this._boneCompressedChunk.isDummy() ? undefined : this._boneCompressedChunk._v,
      worldMatrix: this.__worldMatrix._v,
      isWorldMatrixVanilla: this.__isWorldMatrixVanilla,
      qtsInfo: hasQtsInfo
        ? [this.__qtsInfo._v[0], this.__qtsInfo._v[1], this.__qtsInfo._v[2], this.__qtsInfo._v[3]]
        : undefined,
    };
  }

  private __applySkinningCache(cache: SkinningCache) {
    this.__isWorldMatrixVanilla = cache.isWorldMatrixVanilla;
    this.__worldMatrix._v.set(cache.worldMatrix);
    const jointCount = this.__joints.length;
    if (Config.boneDataType === BoneDataType.Mat43x1) {
      const dataCount = jointCount * 12;
      this._boneMatrix._v.set(cache.boneMatrix!.subarray(0, dataCount));
      return;
    }
    if (Config.boneDataType === BoneDataType.Vec4x2) {
      const dataCount = jointCount * 4;
      this._boneTranslatePackedQuat._v.set(cache.boneTranslatePackedQuat!.subarray(0, dataCount));
      this._boneScalePackedQuat._v.set(cache.boneScalePackedQuat!.subarray(0, dataCount));
      return;
    }
    if (Config.boneDataType === BoneDataType.Vec4x2Old) {
      const dataCount = jointCount * 4;
      this._boneQuaternion._v.set(cache.boneQuaternion!.subarray(0, dataCount));
      this._boneTranslateScale._v.set(cache.boneTranslateScale!.subarray(0, dataCount));
      return;
    }
    if (Config.boneDataType === BoneDataType.Vec4x1) {
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
  memberName: 'boneCompressedChunk',
  dataClassType: VectorN,
  shaderType: ShaderType.VertexShader,
  compositionType: CompositionType.Vec4Array,
  componentType: ComponentType.Float,
  initValues: new VectorN(new Float32Array(0)),
});
