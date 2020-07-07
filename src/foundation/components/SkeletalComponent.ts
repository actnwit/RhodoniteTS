import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import EntityRepository from '../core/EntityRepository';
import { WellKnownComponentTIDs } from './WellKnownComponentTIDs';
import Matrix44 from '../math/Matrix44';
import SceneGraphComponent from './SceneGraphComponent';
import { ProcessStage } from '../definitions/ProcessStage';
import MutableVector3 from '../math/MutableVector3';
import MutableQuaternion from '../math/MutableQuaternion';
import { MathUtil } from '../math/MathUtil';
import MutableVector4 from '../math/MutableVector4';
import MutableMatrix44 from '../math/MutableMatrix44';
import { ComponentTID, ComponentSID, EntityUID, Index } from '../../commontypes/CommonTypes';
import { ShaderSemantics } from '../definitions/ShaderSemantics';
import { ProcessApproachEnum } from '../definitions/ProcessApproach';
import GlobalDataRepository from '../core/GlobalDataRepository';
import Config from '../core/Config';
import { BoneDataType } from '../definitions/BoneDataType';

export default class SkeletalComponent extends Component {
  public _jointIndices: Index[] = [];
  private __joints: SceneGraphComponent[] = [];
  public _inverseBindMatrices: Matrix44[] = [];
  public _bindShapeMatrix?: Matrix44;
  private __jointMatrices?: number[];
  public jointsHierarchy?: SceneGraphComponent;
  public isSkinning = true;
  public isOptimizingMode = true;
  private static __tmpVec3_0 = MutableVector3.zero();
  private static __tmpVec3_1 = MutableVector3.zero();
  private static __tmp_mat4 = MutableMatrix44.identity();
  private static __tmp_q: MutableQuaternion = new MutableQuaternion(0, 0, 0, 1);
  private static __identityMat = MutableMatrix44.identity();
  private __qArray = new Float32Array(0);
  private __tArray = new Float32Array(0);
  private __qtArray = new Float32Array(0);
  private __qtInfo = MutableVector4.dummy();
  private __matArray = new Float32Array(0);
  private static __globalDataRepository = GlobalDataRepository.getInstance();
  private static __tookGlobalDataNum = 0;

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);
    if (SkeletalComponent.__tookGlobalDataNum < Config.maxSkeletonNumber) {
      if (Config.boneDataType === BoneDataType.Mat4x4) {
        SkeletalComponent.__globalDataRepository.takeOne(ShaderSemantics.BoneMatrix);
      } else if (Config.boneDataType === BoneDataType.Vec4x2) {
        SkeletalComponent.__globalDataRepository.takeOne(ShaderSemantics.BoneQuaternion);
        SkeletalComponent.__globalDataRepository.takeOne(ShaderSemantics.BoneTranslateScale);
      } else if (Config.boneDataType === BoneDataType.Vec4x1) {
        SkeletalComponent.__globalDataRepository.takeOne(ShaderSemantics.BoneMatrix);
        SkeletalComponent.__globalDataRepository.takeOne(ShaderSemantics.BoneCompressedChunk);
      }
      SkeletalComponent.__tookGlobalDataNum++;
    } else {
      console.warn('The actual number of Skeleton generated exceeds Config.maxSkeletonNumber.');
    }

  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.SkeletalComponentTID;
  }

  set joints(joints: SceneGraphComponent[]) {
    this.__joints = joints;
    let index = 0;
    if (this.componentSID < Config.maxSkeletonNumber) {
      index = this.componentSID;
    }
    if (Config.boneDataType === BoneDataType.Mat4x4) {
      this.__matArray = SkeletalComponent.__globalDataRepository.getValue(ShaderSemantics.BoneMatrix, index).v;
    } else if (Config.boneDataType === BoneDataType.Vec4x2) {
      this.__qArray = SkeletalComponent.__globalDataRepository.getValue(ShaderSemantics.BoneQuaternion, index).v;
      this.__tArray = SkeletalComponent.__globalDataRepository.getValue(ShaderSemantics.BoneTranslateScale, index).v;
    } else if (Config.boneDataType === BoneDataType.Vec4x1) {
      this.__matArray = SkeletalComponent.__globalDataRepository.getValue(ShaderSemantics.BoneMatrix, index).v;
      this.__qtArray = SkeletalComponent.__globalDataRepository.getValue(ShaderSemantics.BoneCompressedChunk, index).v;
      this.__qtInfo = SkeletalComponent.__globalDataRepository.getValue(ShaderSemantics.BoneCompressedInfo, 0);
    }
  }

  get rootJointWorldMatrixInner() {
    return this.jointsHierarchy?.worldMatrixInner;
  }

  $create() {
    this.moveStageTo(ProcessStage.Load);
  }

  $load() {
    this.moveStageTo(ProcessStage.Logic);
  }

  $logic({ processApproach }: { processApproach: ProcessApproachEnum }) {

    if (!this.isSkinning) {
      return;
    }

    const scales = [];
    const tXArray = [];
    const tYArray = [];
    const tZArray = [];

    for (let i = 0; i < this.__joints.length; i++) {
      const joint = this.__joints[i];
      let m;
      if (joint.isVisible) {
        const globalJointTransform = joint.worldMatrixInner;
        const inverseBindMatrix = this._inverseBindMatrices[i];

        MutableMatrix44.multiplyTo(globalJointTransform, inverseBindMatrix, SkeletalComponent.__tmp_mat4);
        if (this._bindShapeMatrix) {
          SkeletalComponent.__tmp_mat4.multiply(this._bindShapeMatrix); // only for glTF1
        }
        m = SkeletalComponent.__tmp_mat4;
      } else {
        m = SkeletalComponent.__identityMat;
      }

      if (Config.boneDataType === BoneDataType.Mat4x4 || Config.boneDataType === BoneDataType.Vec4x1) {
        this.__matArray[i * 16 + 0] = m.v[0];
        this.__matArray[i * 16 + 1] = m.v[1];
        this.__matArray[i * 16 + 2] = m.v[2];
        this.__matArray[i * 16 + 3] = m.v[3];
        this.__matArray[i * 16 + 4] = m.v[4];
        this.__matArray[i * 16 + 5] = m.v[5];
        this.__matArray[i * 16 + 6] = m.v[6];
        this.__matArray[i * 16 + 7] = m.v[7];
        this.__matArray[i * 16 + 8] = m.v[8];
        this.__matArray[i * 16 + 9] = m.v[9];
        this.__matArray[i * 16 + 10] = m.v[10];
        this.__matArray[i * 16 + 11] = m.v[11];
        this.__matArray[i * 16 + 12] = m.v[12];
        this.__matArray[i * 16 + 13] = m.v[13];
        this.__matArray[i * 16 + 14] = m.v[14];
        this.__matArray[i * 16 + 15] = m.v[15];
      }
      if (Config.boneDataType !== BoneDataType.Mat4x4) {
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

        if (Config.boneDataType === BoneDataType.Vec4x2) {
          const q = SkeletalComponent.__tmp_q.fromMatrix(m);
          this.__qArray[i * 4 + 0] = q.x;
          this.__qArray[i * 4 + 1] = q.y;
          this.__qArray[i * 4 + 2] = q.z;
          this.__qArray[i * 4 + 3] = q.w;
          this.__tArray[i * 4 + 0] = m.m03; // m.getTranslate().x
          this.__tArray[i * 4 + 1] = m.m13; // m.getTranslate().y
          this.__tArray[i * 4 + 2] = m.m23; // m.getTranslate().z
          this.__tArray[i * 4 + 3] = Math.max(scaleVec.x, scaleVec.y, scaleVec.z);
        } else if (Config.boneDataType === BoneDataType.Vec4x1) {
          scales.push(Math.max(scaleVec.x, scaleVec.y, scaleVec.z));

          const t = m.getTranslateTo(SkeletalComponent.__tmpVec3_1);
          tXArray.push(Math.abs(t.x));
          tYArray.push(Math.abs(t.y));
          tZArray.push(Math.abs(t.z));
          const maxScale = Math.max.apply(null, scales);
          let maxX = Math.max.apply(null, tXArray);
          let maxY = Math.max.apply(null, tYArray);
          let maxZ = Math.max.apply(null, tZArray);
          this.__qtInfo.x = maxX * 1.1;
          this.__qtInfo.y = maxY * 1.1;
          this.__qtInfo.z = maxZ * 1.1;
          this.__qtInfo.w = maxScale;
        }
      }
    }

    if (Config.boneDataType === BoneDataType.Vec4x1) {
      for (let i = 0; i < this.__joints.length; i++) {
        const m = SkeletalComponent.__tmp_mat4;
        m.v[0] = this.__matArray[i * 16 + 0];
        m.v[1] = this.__matArray[i * 16 + 1];
        m.v[2] = this.__matArray[i * 16 + 2];
        m.v[3] = this.__matArray[i * 16 + 3];
        m.v[4] = this.__matArray[i * 16 + 4];
        m.v[5] = this.__matArray[i * 16 + 5];
        m.v[6] = this.__matArray[i * 16 + 6];
        m.v[7] = this.__matArray[i * 16 + 7];
        m.v[8] = this.__matArray[i * 16 + 8];
        m.v[9] = this.__matArray[i * 16 + 9];
        m.v[10] = this.__matArray[i * 16 + 10];
        m.v[11] = this.__matArray[i * 16 + 11];
        m.v[12] = this.__matArray[i * 16 + 12];
        m.v[13] = this.__matArray[i * 16 + 13];
        m.v[14] = this.__matArray[i * 16 + 14];
        m.v[15] = this.__matArray[i * 16 + 15];

        const q = SkeletalComponent.__tmp_q.fromMatrix(m);
        q.normalize();
        const vec2QPacked = MathUtil.packNormalizedVec4ToVec2(q.x, q.y, q.z, q.w, 4096);
        this.__qtArray[i * 4 + 0] = vec2QPacked[0];
        this.__qtArray[i * 4 + 1] = vec2QPacked[1];

        const t = m.getTranslateTo(SkeletalComponent.__tmpVec3_0);
        const vec2TPacked = MathUtil.packNormalizedVec4ToVec2(
          t.x / this.__qtInfo.x, t.y / this.__qtInfo.y,
          t.z / this.__qtInfo.z, scales[i] / this.__qtInfo.w, 4096);
        this.__qtArray[i * 4 + 2] = vec2TPacked[0];
        this.__qtArray[i * 4 + 3] = vec2TPacked[1];
      }
    }
  }

  get jointMatrices() {
    return this.__jointMatrices;
  }

  get jointQuaternionArray() {
    return this.__qArray;
  }

  get jointTranslateScaleArray() {
    return this.__tArray;
  }

  get jointMatricesArray() {
    return this.__matArray;
  }

  get jointCompressedChunk() {
    return this.__qtArray;
  }

  get jointCompressedInfo() {
    return this.__qtInfo;
  }
}
ComponentRepository.registerComponentClass(SkeletalComponent);
