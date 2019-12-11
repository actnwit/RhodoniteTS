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
  private static __globalDataRepository = GlobalDataRepository.getInstance();
  private static __tookGlobalDataNum = 0;
  private static __tmp_q: MutableQuaternion = new MutableQuaternion(0, 0, 0, 1);

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);
    if (SkeletalComponent.__tookGlobalDataNum < Config.maxSkeletonNumber) {
      SkeletalComponent.__globalDataRepository.takeOne(ShaderSemantics.BoneQuaternion);
      SkeletalComponent.__globalDataRepository.takeOne(ShaderSemantics.BoneTranslateScale);
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
    this.__qArray = SkeletalComponent.__globalDataRepository.getValue(ShaderSemantics.BoneQuaternion, index).v;
    this.__tArray = SkeletalComponent.__globalDataRepository.getValue(ShaderSemantics.BoneTranslateScale, index).v;
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
        let m = SkeletalComponent.__tmp_mat4;

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

      // if (processApproach === ProcessApproach.FastestWebGL1) {
      //   for (let j=0; j<maxPrimitive; j++) {
      //     const primitive = meshComponent.mesh!.getPrimitiveAt(j);
      //     primitive.material!.setParameter(ShaderSemantics.SkinningMode, this.componentSID);
      //   }
      // }

    } else {
      // if (processApproach === ProcessApproach.FastestWebGL1) {
      //   for (let j=0; j<maxPrimitive; j++) {
      //     const primitive = meshComponent.mesh!.getPrimitiveAt(j);
      //     primitive.material!.setParameter(ShaderSemantics.SkinningMode, -1);
      //   }
      // }
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

  get jointCompressedInfo() {
    return this.__boneCompressedInfo;
  }
}
ComponentRepository.registerComponentClass(SkeletalComponent);
