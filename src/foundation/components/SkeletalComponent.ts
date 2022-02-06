import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import EntityRepository from '../core/EntityRepository';
import {WellKnownComponentTIDs} from './WellKnownComponentTIDs';
import Matrix44 from '../math/Matrix44';
import SceneGraphComponent from './SceneGraph/SceneGraphComponent';
import {ProcessStage} from '../definitions/ProcessStage';
import MutableVector3 from '../math/MutableVector3';
import MutableQuaternion from '../math/MutableQuaternion';
import {MathUtil} from '../math/MathUtil';
import MutableVector4 from '../math/MutableVector4';
import MutableMatrix44 from '../math/MutableMatrix44';
import {
  ComponentTID,
  ComponentSID,
  EntityUID,
  Index,
} from '../../types/CommonTypes';
import {ShaderSemantics} from '../definitions/ShaderSemantics';
import GlobalDataRepository from '../core/GlobalDataRepository';
import Config from '../core/Config';
import {BoneDataType} from '../definitions/BoneDataType';
import {IMatrix44} from '../math/IMatrix';
import Accessor from '../memory/Accessor';

export default class SkeletalComponent extends Component {
  public _jointIndices: Index[] = [];
  private __joints: SceneGraphComponent[] = [];
  private __inverseBindMatricesAccessor?: Accessor;
  public _bindShapeMatrix?: Matrix44;
  private __jointMatrices?: number[];
  public topOfJointsHierarchy?: SceneGraphComponent;
  public isSkinning = true;
  public isOptimizingMode = true;
  private static __tmpVec3_0 = MutableVector3.zero();
  private static __tmpVec3_1 = MutableVector3.zero();
  private static __tmp_mat4 = MutableMatrix44.identity();
  private static __tmp_q: MutableQuaternion = new MutableQuaternion(0, 0, 0, 1);
  private static __identityMat = MutableMatrix44.identity();
  private __qArray = new Float32Array(0);
  private __tsArray = new Float32Array(0);
  private __tqArray = new Float32Array(0);
  private __sqArray = new Float32Array(0);
  private __qtsArray = new Float32Array(0);
  private __qtsInfo = MutableVector4.dummy();
  private __matArray = new Float32Array(0);
  private __worldMatrix = MutableMatrix44.identity();
  private __isWorldMatrixVanilla = true;
  private static __globalDataRepository = GlobalDataRepository.getInstance();
  private static __tookGlobalDataNum = 0;

  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository
  ) {
    super(entityUid, componentSid, entityRepository);
    if (SkeletalComponent.__tookGlobalDataNum < Config.maxSkeletonNumber) {
      if (Config.boneDataType === BoneDataType.Mat44x1) {
        SkeletalComponent.__globalDataRepository.takeOne(
          ShaderSemantics.BoneMatrix
        );
      } else if (Config.boneDataType === BoneDataType.Vec4x2) {
        SkeletalComponent.__globalDataRepository.takeOne(
          ShaderSemantics.BoneTranslatePackedQuat
        );
        SkeletalComponent.__globalDataRepository.takeOne(
          ShaderSemantics.BoneScalePackedQuat
        );
      } else if (Config.boneDataType === BoneDataType.Vec4x2Old) {
        SkeletalComponent.__globalDataRepository.takeOne(
          ShaderSemantics.BoneQuaternion
        );
        SkeletalComponent.__globalDataRepository.takeOne(
          ShaderSemantics.BoneTranslateScale
        );
      } else if (Config.boneDataType === BoneDataType.Vec4x1) {
        SkeletalComponent.__globalDataRepository.takeOne(
          ShaderSemantics.BoneTranslateScale
        );
        SkeletalComponent.__globalDataRepository.takeOne(
          ShaderSemantics.BoneCompressedChunk
        );
      }
      SkeletalComponent.__tookGlobalDataNum++;
    } else {
      console.warn(
        'The actual number of Skeleton generated exceeds Config.maxSkeletonNumber.'
      );
    }

    this.moveStageTo(ProcessStage.Logic);
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.SkeletalComponentTID;
  }

  setInverseBindMatricesAccessor(inverseBindMatricesAccessor: Accessor) {
    this.__inverseBindMatricesAccessor = inverseBindMatricesAccessor;
  }

  setJoints(joints: SceneGraphComponent[]) {
    this.__joints = joints;
    let index = 0;
    if (this.componentSID < Config.maxSkeletonNumber) {
      index = this.componentSID;
    }
    if (Config.boneDataType === BoneDataType.Mat44x1) {
      this.__matArray = SkeletalComponent.__globalDataRepository.getValue(
        ShaderSemantics.BoneMatrix,
        index
      )._v;
    } else if (Config.boneDataType === BoneDataType.Vec4x2) {
      this.__tqArray = SkeletalComponent.__globalDataRepository.getValue(
        ShaderSemantics.BoneTranslatePackedQuat,
        index
      )._v;
      this.__sqArray = SkeletalComponent.__globalDataRepository.getValue(
        ShaderSemantics.BoneScalePackedQuat,
        index
      )._v;
    } else if (Config.boneDataType === BoneDataType.Vec4x2Old) {
      this.__qArray = SkeletalComponent.__globalDataRepository.getValue(
        ShaderSemantics.BoneQuaternion,
        index
      )._v;
      this.__tsArray = SkeletalComponent.__globalDataRepository.getValue(
        ShaderSemantics.BoneTranslateScale,
        index
      )._v;
    } else if (Config.boneDataType === BoneDataType.Vec4x1) {
      this.__tsArray = SkeletalComponent.__globalDataRepository.getValue(
        ShaderSemantics.BoneTranslateScale,
        index
      )._v;
      this.__qtsArray = SkeletalComponent.__globalDataRepository.getValue(
        ShaderSemantics.BoneCompressedChunk,
        index
      )._v;
      this.__qtsInfo = SkeletalComponent.__globalDataRepository.getValue(
        ShaderSemantics.BoneCompressedInfo,
        0
      );
    }
  }

  getJoints(): SceneGraphComponent[] {
    return this.__joints.concat();
  }

  get rootJointWorldMatrixInner() {
    return this.topOfJointsHierarchy?.worldMatrixInner;
  }

  get jointMatrices() {
    return this.__jointMatrices;
  }

  get jointQuaternionArray() {
    return this.__qArray;
  }

  get jointTranslateScaleArray() {
    return this.__tsArray;
  }

  get jointTranslatePackedQuat() {
    return this.__tqArray;
  }

  get jointScalePackedQuat() {
    return this.__sqArray;
  }

  get jointMatricesArray() {
    return this.__matArray;
  }

  get jointCompressedChunk() {
    return this.__qtsArray;
  }

  get jointCompressedInfo() {
    return this.__qtsInfo;
  }

  get worldMatrix() {
    return this.__worldMatrix.clone();
  }

  get worldMatrixInner() {
    return this.__worldMatrix;
  }

  get isWorldMatrixUpdated() {
    return !this.__isWorldMatrixVanilla;
  }

  $logic() {
    if (!this.isSkinning) {
      return;
    }

    for (let i = 0; i < this.__joints.length; i++) {
      const joint = this.__joints[i];
      let m;
      if (joint.isVisible) {
        const globalJointTransform = joint.worldMatrixInner;

        MutableMatrix44.multiplyTypedArrayTo(
          globalJointTransform,
          this.__inverseBindMatricesAccessor!.getTypedArray(),
          SkeletalComponent.__tmp_mat4,
          i
        );
        if (this._bindShapeMatrix) {
          SkeletalComponent.__tmp_mat4.multiply(this._bindShapeMatrix); // only for glTF1
        }
        m = SkeletalComponent.__tmp_mat4;
      } else {
        m = SkeletalComponent.__identityMat;
      }

      if (i === 0) {
        this.__worldMatrix.copyComponents(m);
      }
      this.__isWorldMatrixVanilla = false;

      if (
        Config.boneDataType === BoneDataType.Mat44x1 ||
        Config.boneDataType === BoneDataType.Vec4x1
      ) {
        this.__copyToMatArray(m, i);
      }

      if (Config.boneDataType !== BoneDataType.Mat44x1) {
        const scaleVec = SkeletalComponent.__tmpVec3_0.setComponents(
          Math.hypot(m.m00, m.m01, m.m02),
          Math.hypot(m.m10, m.m11, m.m12),
          Math.hypot(m.m20, m.m21, m.m22)
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
          Config.boneDataType === BoneDataType.Vec4x2Old ||
          Config.boneDataType === BoneDataType.Vec4x1
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
          this.__tsArray[i * 4 + 3] = maxScale;
        }

        if (Config.boneDataType === BoneDataType.Vec4x2) {
          const vec2QPacked = MathUtil.packNormalizedVec4ToVec2(
            q.x,
            q.y,
            q.z,
            q.w,
            Math.pow(2, 12)
          );
          this.__tqArray[i * 4 + 0] = m.m03;
          this.__tqArray[i * 4 + 1] = m.m13;
          this.__tqArray[i * 4 + 2] = m.m23;
          this.__sqArray[i * 4 + 0] = scaleVec.x;
          this.__sqArray[i * 4 + 1] = scaleVec.y;
          this.__sqArray[i * 4 + 2] = scaleVec.z;

          this.__tqArray[i * 4 + 3] = vec2QPacked[0];
          this.__sqArray[i * 4 + 3] = vec2QPacked[1];
        } else if (Config.boneDataType === BoneDataType.Vec4x2Old) {
          this.__tsArray[i * 4 + 0] = m.m03; // m.getTranslate().x
          this.__tsArray[i * 4 + 1] = m.m13; // m.getTranslate().y
          this.__tsArray[i * 4 + 2] = m.m23; // m.getTranslate().z
          this.__qArray[i * 4 + 0] = q.x;
          this.__qArray[i * 4 + 1] = q.y;
          this.__qArray[i * 4 + 2] = q.z;
          this.__qArray[i * 4 + 3] = q.w;
        }

        if (Config.boneDataType === BoneDataType.Vec4x1) {
          // pack quaternion
          this.__tsArray[i * 4 + 0] = m.m03; // m.getTranslate().x
          this.__tsArray[i * 4 + 1] = m.m13; // m.getTranslate().y
          this.__tsArray[i * 4 + 2] = m.m23; // m.getTranslate().z
          const vec2QPacked = MathUtil.packNormalizedVec4ToVec2(
            q.x,
            q.y,
            q.z,
            q.w,
            Math.pow(2, 12)
          );
          this.__qtsArray[i * 4 + 0] = vec2QPacked[0];
          this.__qtsArray[i * 4 + 1] = vec2QPacked[1];
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
        const absX = Math.abs(this.__tsArray[i * 4 + 0]);
        if (absX > maxAbsX) {
          maxAbsX = absX;
        }
        const absY = Math.abs(this.__tsArray[i * 4 + 1]);
        if (absY > maxAbsY) {
          maxAbsY = absY;
        }
        const absZ = Math.abs(this.__tsArray[i * 4 + 2]);
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
        const x = this.__tsArray[i * 4 + 0];
        const y = this.__tsArray[i * 4 + 1];
        const z = this.__tsArray[i * 4 + 2];
        const scale = this.__tsArray[i * 4 + 3];
        const normalizedX = x / maxAbsX;
        const normalizedY = y / maxAbsY;
        const normalizedZ = z / maxAbsZ;
        const normalizedW = scale;

        const vec2TPacked = MathUtil.packNormalizedVec4ToVec2(
          normalizedX,
          normalizedY,
          normalizedZ,
          normalizedW,
          Math.pow(2, 12)
        );
        this.__qtsArray[i * 4 + 2] = vec2TPacked[0];
        this.__qtsArray[i * 4 + 3] = vec2TPacked[1];
      }
    }
  }

  private __copyToMatArray(m: IMatrix44, i: Index) {
    this.__matArray[i * 16 + 0] = m._v[0];
    this.__matArray[i * 16 + 1] = m._v[1];
    this.__matArray[i * 16 + 2] = m._v[2];
    this.__matArray[i * 16 + 3] = m._v[3];
    this.__matArray[i * 16 + 4] = m._v[4];
    this.__matArray[i * 16 + 5] = m._v[5];
    this.__matArray[i * 16 + 6] = m._v[6];
    this.__matArray[i * 16 + 7] = m._v[7];
    this.__matArray[i * 16 + 8] = m._v[8];
    this.__matArray[i * 16 + 9] = m._v[9];
    this.__matArray[i * 16 + 10] = m._v[10];
    this.__matArray[i * 16 + 11] = m._v[11];
    this.__matArray[i * 16 + 12] = m._v[12];
    this.__matArray[i * 16 + 13] = m._v[13];
    this.__matArray[i * 16 + 14] = m._v[14];
    this.__matArray[i * 16 + 15] = m._v[15];
  }

  public getInverseBindMatricesAccessor(): Accessor | undefined {
    return this.__inverseBindMatricesAccessor;
  }
}
ComponentRepository.registerComponentClass(SkeletalComponent);
