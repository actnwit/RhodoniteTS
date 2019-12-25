import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import Primitive from '../geometry/Primitive';
import EntityRepository from '../core/EntityRepository';
import { WellKnownComponentTIDs } from './WellKnownComponentTIDs';
import Matrix44 from '../math/Matrix44';
import SceneGraphComponent from './SceneGraphComponent';
import { ProcessStage } from '../definitions/ProcessStage';
import Vector3 from '../math/Vector3';
import MutableVector3 from '../math/MutableVector3';
import Quaternion from '../math/Quaternion';
import MutableQuaternion from '../math/MutableQuaternion';
import { MathUtil } from '../math/MathUtil';
import Vector4 from '../math/Vector4';
import Scalar from '../math/Scalar';
import MutableVector4 from '../math/MutableVector4';
import MutableMatrix44 from '../math/MutableMatrix44';
import { ComponentTID, ComponentSID, EntityUID, Index } from '../../types/CommonTypes';
import MeshComponent from './MeshComponent';
import { VertexAttribute } from '../definitions/VertexAttribute';
import { ShaderSemantics } from '../definitions/ShaderSemantics';
import { ProcessApproachEnum, ProcessApproach } from '../definitions/ProcessApproach';
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
  private __boneCompressedInfo = MutableVector4.zero();
  private static __scaleVec3 = MutableVector3.zero();
  private static __tmp_mat4 = MutableMatrix44.identity();
  private static __tmp2_mat4 = MutableMatrix44.identity();
  private __qArray = new Float32Array(0);
  private __tArray = new Float32Array(0);
  private __matArray = new Float32Array(0);
  private static __globalDataRepository = GlobalDataRepository.getInstance();
  private static __tookGlobalDataNum = 0;
  private static __tmp_q: MutableQuaternion = new MutableQuaternion(0, 0, 0, 1);
  private static __identityMat = MutableMatrix44.identity();

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);
    if (SkeletalComponent.__tookGlobalDataNum < Config.maxSkeletonNumber) {
      if (Config.boneDataType === BoneDataType.Mat4x4) {
        SkeletalComponent.__globalDataRepository.takeOne(ShaderSemantics.BoneMatrix);
      } else if (Config.boneDataType === BoneDataType.Vec4x2) {
        SkeletalComponent.__globalDataRepository.takeOne(ShaderSemantics.BoneQuaternion);
        SkeletalComponent.__globalDataRepository.takeOne(ShaderSemantics.BoneTranslateScale);
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
    const meshComponent = this.entity.getMesh();
    const maxPrimitive = meshComponent.mesh!.getPrimitiveNumber();

    if (this.isSkinning) {
      for (let i = 0; i < this.__joints.length; i++) {
        const joint = this.__joints[i];
        let m;
        if (joint.isVisible) {
          let globalJointTransform = null;
          let inverseBindMatrix = this._inverseBindMatrices[i]!;
          globalJointTransform = joint.worldMatrixInner;
          SkeletalComponent.__tmp_mat4.identity();

          MutableMatrix44.multiplyTo(SkeletalComponent.__tmp_mat4, globalJointTransform as any as Matrix44, SkeletalComponent.__tmp2_mat4);
          MutableMatrix44.multiplyTo(SkeletalComponent.__tmp2_mat4, inverseBindMatrix, SkeletalComponent.__tmp_mat4);
          if (this._bindShapeMatrix) {
            MutableMatrix44.multiplyTo(SkeletalComponent.__tmp_mat4, this._bindShapeMatrix, SkeletalComponent.__tmp2_mat4); // only for glTF1
            SkeletalComponent.__tmp_mat4.copyComponents(SkeletalComponent.__tmp2_mat4);
          }
          m = SkeletalComponent.__tmp_mat4;
        } else {
          m = SkeletalComponent.__identityMat!;
        }

        if (Config.boneDataType === BoneDataType.Mat4x4) {
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
        } else if (Config.boneDataType === BoneDataType.Vec4x2) {
          SkeletalComponent.__scaleVec3.x = Math.sqrt(m.m00 * m.m00 + m.m01 * m.m01 + m.m02 * m.m02);
          SkeletalComponent.__scaleVec3.y = Math.sqrt(m.m10 * m.m10 + m.m11 * m.m11 + m.m12 * m.m12);
          SkeletalComponent.__scaleVec3.z = Math.sqrt(m.m20 * m.m20 + m.m21 * m.m21 + m.m22 * m.m22);
          m.m00 /= SkeletalComponent.__scaleVec3.x;
          m.m01 /= SkeletalComponent.__scaleVec3.x;
          m.m02 /= SkeletalComponent.__scaleVec3.x;
          m.m10 /= SkeletalComponent.__scaleVec3.y;
          m.m11 /= SkeletalComponent.__scaleVec3.y;
          m.m12 /= SkeletalComponent.__scaleVec3.y;
          m.m20 /= SkeletalComponent.__scaleVec3.z;
          m.m21 /= SkeletalComponent.__scaleVec3.z;
          m.m22 /= SkeletalComponent.__scaleVec3.z;

          let q = MutableQuaternion.fromMatrixTo(m, SkeletalComponent.__tmp_q);

          this.__qArray[i * 4 + 0] = q.x;
          this.__qArray[i * 4 + 1] = q.y;
          this.__qArray[i * 4 + 2] = q.z;
          this.__qArray[i * 4 + 3] = q.w;
          this.__tArray[i * 4 + 0] = m.m03; // m.getTranslate().x
          this.__tArray[i * 4 + 1] = m.m13; // m.getTranslate().y
          this.__tArray[i * 4 + 2] = m.m23; // m.getTranslate().z
          this.__tArray[i * 4 + 3] = Math.max(SkeletalComponent.__scaleVec3.x, SkeletalComponent.__scaleVec3.y, SkeletalComponent.__scaleVec3.z);
        }
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

  get jointCompressedInfo() {
    return this.__boneCompressedInfo;
  }
}
ComponentRepository.registerComponentClass(SkeletalComponent);
