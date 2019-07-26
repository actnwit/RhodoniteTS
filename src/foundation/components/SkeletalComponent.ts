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
import WebGLResourceRepository from '../../webgl/WebGLResourceRepository';

export default class SkeletalComponent extends Component {
  public _jointIndices: Index[] = [];
  private __joints: SceneGraphComponent[] = [];
  public _inverseBindMatrices: Matrix44[] = [];
  public _bindShapeMatrix?: Matrix44;
  private __jointMatrices?: number[];
  public jointsHierarchy?: SceneGraphComponent;
  private __sceneGraphComponent?: SceneGraphComponent;
  private __qtArray?: Float32Array;
  public isSkinning = true;
  public isOptimizingMode = true;
  private __boneCompressedInfo = MutableVector4.zero();
  private static __scaleVec3 = MutableVector3.zero();
  private static __tmp_vector4 = MutableVector4.zero();
  private static __tmp_mat4 = MutableMatrix44.identity();
  private static __tmp2_mat4 = MutableMatrix44.identity();
  private static __tmp_matrices: MutableMatrix44[] = [];

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);

    if (SkeletalComponent.__tmp_matrices.length === 0) {
      for (let i=0; i<500; i++) {
        SkeletalComponent.__tmp_matrices[i] = MutableMatrix44.identity();
      }
    }
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.SkeletalComponentTID;
  }

  set joints(joints: SceneGraphComponent[]) {
    this.__joints = joints;
  }

  $create() {
    this.__sceneGraphComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, SceneGraphComponent) as SceneGraphComponent;
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
    let flatMatrices: number[] = [];
    const matrices: MutableMatrix44[] = [];
    if (this.isSkinning) {


      this.__qtArray = new Float32Array(this.__joints.length * 4);
      const scales = [];
      let tXArray = [];
      let tYArray = [];
      let tZArray = [];

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
        SkeletalComponent.__tmp_matrices[i].copyComponents(m);

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

        scales.push(Math.max(SkeletalComponent.__scaleVec3.x, SkeletalComponent.__scaleVec3.y, SkeletalComponent.__scaleVec3.z));
        let t = m.getTranslate();
        tXArray.push(Math.abs(t.x));
        tYArray.push(Math.abs(t.y));
        tZArray.push(Math.abs(t.z));
        const maxScale = Math.max.apply(null, scales);
        let maxX = Math.max.apply(null, tXArray);
        let maxY = Math.max.apply(null, tYArray);
        let maxZ = Math.max.apply(null, tZArray);
        this.__boneCompressedInfo.x = maxX*1.1;
        this.__boneCompressedInfo.y = maxY*1.1;
        this.__boneCompressedInfo.z = maxZ*1.1;
        this.__boneCompressedInfo.w = maxScale;

      }
      const meshComponent = this.entity.getComponent(MeshComponent) as MeshComponent;
      const maxPrimitive = meshComponent.mesh!.getPrimitiveNumber();

      if (processApproach === ProcessApproach.FastestWebGL1) {
        for (let j=0; j<maxPrimitive; j++) {
          const primitive = meshComponent.mesh!.getPrimitiveAt(j);
          primitive.material!.setParameter(ShaderSemantics.SkinningMode, 1);
        }
      }

      for (let i=0; i<this.__joints.length; i++) {
        const joint = this.__joints[i];
        let globalJointTransform = null;
        let inverseBindMatrix = joint._inverseBindMatrix!;
        globalJointTransform = joint.worldMatrixInner;

        const m = SkeletalComponent.__tmp_matrices[i];

        if (this.isOptimizingMode) {
          // console.log('getScale are ...');
          if (processApproach === ProcessApproach.FastestWebGL1) {
            for (let j=0; j<maxPrimitive; j++) {
              const primitive = meshComponent.mesh!.getPrimitiveAt(j);
              // let s = m.getScale();
              // console.log(s.toString());
              let q = (MutableQuaternion.fromMatrix(m));
              q.normalize();
              let vec2QPacked = MathUtil.packNormalizedVec4ToVec2(q.x, q.y, q.z, q.w, 4096);
              SkeletalComponent.__tmp_vector4.x = vec2QPacked[0];
              SkeletalComponent.__tmp_vector4.y = vec2QPacked[1];
  
              let t = m.getTranslate();
              // this.__qtArray[i*4+0] = vec2QPacsked[0];
              // this.__qtArray[i*4+1] = vec2QPacked[1];
              let vec2TPacked = MathUtil.packNormalizedVec4ToVec2(
                t.x/this.__boneCompressedInfo.x, t.y/this.__boneCompressedInfo.y,
                t.z/this.__boneCompressedInfo.z, scales[i]/this.__boneCompressedInfo.w, 4096);
              // this.__qtArray[i*4+2] = vec2TPacked[0];
              // this.__qtArray[i*4+3] = vec2TPacked[1];
              SkeletalComponent.__tmp_vector4.z = vec2TPacked[0];
              SkeletalComponent.__tmp_vector4.w = vec2TPacked[1];
  
              primitive.material!.setParameter(ShaderSemantics.BoneCompressedChank, SkeletalComponent.__tmp_vector4, i);
              primitive.material!.setParameter(ShaderSemantics.BoneCompressedInfo, this.__boneCompressedInfo);
            }
          } else {
            // for (let i=0; i<matrices.length; i++) {
              let s = m.getScale();
              // console.log(s.toString());
              let q = (MutableQuaternion.fromMatrix(m));
              q.normalize();
              let vec2QPacked = MathUtil.packNormalizedVec4ToVec2(q.x, q.y, q.z, q.w, 4096);
              let t = m.getTranslate();
              this.__qtArray[i*4+0] = vec2QPacked[0];
              this.__qtArray[i*4+1] = vec2QPacked[1];
              let vec2TPacked = MathUtil.packNormalizedVec4ToVec2(
                t.x/this.__boneCompressedInfo.x, t.y/this.__boneCompressedInfo.y,
                t.z/this.__boneCompressedInfo.z, scales[i]/this.__boneCompressedInfo.w, 4096);
              this.__qtArray[i*4+2] = vec2TPacked[0];
              this.__qtArray[i*4+3] = vec2TPacked[1];
            // }
          }
        } else {
          flatMatrices = [];
          for (let i=0; i<matrices.length; i++) {
            Array.prototype.push.apply(flatMatrices, m.flattenAsArray());
          }
          if (matrices.length < 4) {
            let identityMatrices: number[] = [];
            for (let i=0; i<(4 - matrices.length); i++) {
              Array.prototype.push.apply(identityMatrices,
                [1, 0, 0, 0,
                  0, 1, 0, 0,
                  0, 0, 1, 0,
                  0, 0, 0, 1]
              );
            }
            Array.prototype.push.apply(flatMatrices, identityMatrices);
          }
          this.__jointMatrices = flatMatrices;
        }
    
      }
    }


  }

  get jointMatrices() {
    return this.__jointMatrices;
  }

  get jointCompressedChanks() {
    return this.__qtArray;
  }

  get jointCompressedInfo() {
    return this.__boneCompressedInfo;
  }
}
ComponentRepository.registerComponentClass(SkeletalComponent);
