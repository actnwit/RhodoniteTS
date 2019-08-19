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
import MutableQuaternion from '../math/MutableQuaterion';
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

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);

  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.SkeletalComponentTID;
  }

  set joints(joints: SceneGraphComponent[]) {
    this.__joints = joints;
    this.__qArray = SkeletalComponent.__globalDataRepository.getValue(ShaderSemantics.BoneQuaternion, this.componentSID).v;
    this.__tArray = SkeletalComponent.__globalDataRepository.getValue(ShaderSemantics.BoneTranslateScale, this.componentSID).v;
  }

  $create() {
    this.moveStageTo(ProcessStage.Load);
  }

  $load() {
    for (let i=0; i<this.__joints.length; i++) {
      let inverseBindMatrix = (this._inverseBindMatrices[i] !== void 0) ? this._inverseBindMatrices[i] : Matrix44.identity();
      this.__joints[i]._inverseBindMatrix = inverseBindMatrix;
      this.__joints[i]._bindMatrix = Matrix44.invert(inverseBindMatrix);
    }

    const calcParentJointsMatricesRecursively = (joint: SceneGraphComponent)=> {
      let parentJoint = joint.parent;

      let results: SceneGraphComponent[] = [];
      if (parentJoint) {
        let result = calcParentJointsMatricesRecursively(parentJoint);
        if (Array.isArray(result)) {
          Array.prototype.push.apply(results, result);
        }

        // for glTF2.0
        for (let gltfJointIndex of this._jointIndices) {
          if (parentJoint.jointIndex === gltfJointIndex) {
            results.push(parentJoint);
            return results;
          }
        }

        return results;
      }

      return null;
    };

    let jointsHierarchies = null;
    for (let i=0; i<this.__joints.length; i++) {
      jointsHierarchies = calcParentJointsMatricesRecursively(this.__joints[i]);
      if (jointsHierarchies != null) {
        jointsHierarchies.push(this.__joints[i]);
        this.__joints[i]._jointsOfHierarchies = jointsHierarchies;
      }
    }

    this.moveStageTo(ProcessStage.Logic);
  }

  $logic({processApproach} : {processApproach: ProcessApproachEnum}) {
    const meshComponent = this.entity.getMesh();
    const maxPrimitive = meshComponent.mesh!.getPrimitiveNumber();

    if (this.isSkinning) {
      for (let i=0; i<this.__joints.length; i++) {
        const joint = this.__joints[i];
        let globalJointTransform = null;
        let inverseBindMatrix = joint._inverseBindMatrix!;
        globalJointTransform = joint.worldMatrixInner;
        SkeletalComponent.__tmp_mat4.identity();

        MutableMatrix44.multiplyTo(SkeletalComponent.__tmp_mat4, globalJointTransform as any as Matrix44, SkeletalComponent.__tmp2_mat4);
        MutableMatrix44.multiplyTo(SkeletalComponent.__tmp2_mat4, inverseBindMatrix, SkeletalComponent.__tmp_mat4);
        if (this._bindShapeMatrix) {
          MutableMatrix44.multiplyTo(SkeletalComponent.__tmp_mat4, this._bindShapeMatrix, SkeletalComponent.__tmp2_mat4); // only for glTF1
          SkeletalComponent.__tmp_mat4.copyComponents(SkeletalComponent.__tmp2_mat4);
        }
        let m = SkeletalComponent.__tmp_mat4;

        SkeletalComponent.__scaleVec3.x = Math.sqrt(m.m00*m.m00 + m.m01*m.m01 + m.m02*m.m02);
        SkeletalComponent.__scaleVec3.y = Math.sqrt(m.m10*m.m10 + m.m11*m.m11 + m.m12*m.m12);
        SkeletalComponent.__scaleVec3.z = Math.sqrt(m.m20*m.m20 + m.m21*m.m21 + m.m22*m.m22);
        m.m00 /= SkeletalComponent.__scaleVec3.x;
        m.m01 /= SkeletalComponent.__scaleVec3.x;
        m.m02 /= SkeletalComponent.__scaleVec3.x;
        m.m10 /= SkeletalComponent.__scaleVec3.y;
        m.m11 /= SkeletalComponent.__scaleVec3.y;
        m.m12 /= SkeletalComponent.__scaleVec3.y;
        m.m20 /= SkeletalComponent.__scaleVec3.z;
        m.m21 /= SkeletalComponent.__scaleVec3.z;
        m.m22 /= SkeletalComponent.__scaleVec3.z;

        let q = (MutableQuaternion.fromMatrix(m));

        this.__qArray[i*4+0] = q.x;
        this.__qArray[i*4+1] = q.y;
        this.__qArray[i*4+2] = q.z;
        this.__qArray[i*4+3] = q.w;
        const t = m.getTranslate();
        this.__tArray[i*4+0] = t.x;
        this.__tArray[i*4+1] = t.y;
        this.__tArray[i*4+2] = t.z;
        this.__tArray[i*4+3] = Math.max(SkeletalComponent.__scaleVec3.x, SkeletalComponent.__scaleVec3.y, SkeletalComponent.__scaleVec3.z);

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
