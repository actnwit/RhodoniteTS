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
import MutableVector4 from '../math/MutableVector4';
import MutableMatrix44 from '../math/MutableMatrix44';

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

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);
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

  $logic() {
    let flatMatrices: number[] = [];
    const matrices: MutableMatrix44[] = [];
    if (this.isSkinning) {
      for (let i=0; i<this.__joints.length; i++) {
        const joint = this.__joints[i];
        let globalJointTransform = null;
        let inverseBindMatrix = joint._inverseBindMatrix!;
        globalJointTransform = new Matrix44(joint.worldMatrixInner);
        matrices[i] = MutableMatrix44.identity();
        //matrices[i] = Matrix44.multiply(matrices[i], Matrix44.invert(new Matrix44(this.__sceneGraphComponent!.worldMatrixInner)));
        matrices[i] = MutableMatrix44.multiply(matrices[i], globalJointTransform);
        matrices[i] = MutableMatrix44.multiply(matrices[i], inverseBindMatrix);
        if (this._bindShapeMatrix) {
          matrices[i] = MutableMatrix44.multiply(matrices[i], this._bindShapeMatrix); // only for glTF1
        }
      }
    }

    if (this.isOptimizingMode) {
      this.__qtArray = new Float32Array(matrices.length * 4);
      const scales = [];
      let tXArray = [];
      let tYArray = [];
      let tZArray = [];
      for (let i=0; i<matrices.length; i++) {
        let m = matrices[i];
        let scale = new Vector3(
          Math.sqrt(m.m00*m.m00 + m.m01*m.m01 + m.m02*m.m02),
          Math.sqrt(m.m10*m.m10 + m.m11*m.m11 + m.m12*m.m12),
          Math.sqrt(m.m20*m.m20 + m.m21*m.m21 + m.m22*m.m22)
        );

        matrices[i].m00 /= scale.x;
        matrices[i].m01 /= scale.x;
        matrices[i].m02 /= scale.x;
        matrices[i].m10 /= scale.y;
        matrices[i].m11 /= scale.y;
        matrices[i].m12 /= scale.y;
        matrices[i].m20 /= scale.z;
        matrices[i].m21 /= scale.z;
        matrices[i].m22 /= scale.z;

        scales.push(Math.max(scale.x, scale.y, scale.z));
        let t = matrices[i].getTranslate();
        tXArray.push(Math.abs(t.x));
        tYArray.push(Math.abs(t.y));
        tZArray.push(Math.abs(t.z));
      }
      const maxScale = Math.max.apply(null, scales);
      let maxX = Math.max.apply(null, tXArray);
      let maxY = Math.max.apply(null, tYArray);
      let maxZ = Math.max.apply(null, tZArray);
      this.__boneCompressedInfo.x = maxX*1.1;
      this.__boneCompressedInfo.y = maxY*1.1;
      this.__boneCompressedInfo.z = maxZ*1.1;
      this.__boneCompressedInfo.w = maxScale;

      // console.log('getScale are ...');
      for (let i=0; i<matrices.length; i++) {
        let s = matrices[i].getScale();
        // console.log(s.toString());
        let q = (MutableQuaternion.fromMatrix(matrices[i]));
        q.normalize();
        let vec2QPacked = MathUtil.packNormalizedVec4ToVec2(q.x, q.y, q.z, q.w, 4096);
        let t = matrices[i].getTranslate();
        this.__qtArray[i*4+0] = vec2QPacked[0];
        this.__qtArray[i*4+1] = vec2QPacked[1];
        let vec2TPacked = MathUtil.packNormalizedVec4ToVec2(
          t.x/this.__boneCompressedInfo.x, t.y/this.__boneCompressedInfo.y,
          t.z/this.__boneCompressedInfo.z, scales[i]/this.__boneCompressedInfo.w, 4096);
        this.__qtArray[i*4+2] = vec2TPacked[0];
        this.__qtArray[i*4+3] = vec2TPacked[1];
      }
    } else {
      flatMatrices = [];
      for (let i=0; i<matrices.length; i++) {
        Array.prototype.push.apply(flatMatrices, matrices[i].flattenAsArray());
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
