import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import Primitive from '../geometry/Primitive';
import EntityRepository from '../core/EntityRepository';
import { WellKnownComponentTIDs } from './WellKnownComponentTIDs';
import Matrix44 from '../math/Matrix44';
import SceneGraphComponent from './SceneGraphComponent';
import { ProcessStage } from '../definitions/ProcessStage';

export default class SkeletalComponent extends Component {
  public _jointIndices: Index[] = [];
  private __joints: SceneGraphComponent[] = [];
  public _inverseBindMatrices: Matrix44[] = [];
  public _bindShapeMatrix?: Matrix44;
  private __jointMatrices?: number[];
  public jointsHierarchy?: SceneGraphComponent;
  private __sceneGraphComponent?: SceneGraphComponent;
  public isSkinning = true;

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

    let jointsParentHierarchies = null;
    for (let i=0; i<this.__joints.length; i++) {
      jointsParentHierarchies = calcParentJointsMatricesRecursively(this.__joints[i]);
      if (jointsParentHierarchies != null) {
        this.__joints[i]._jointsOfParentHierarchies = jointsParentHierarchies;
      }
    }

    this.moveStageTo(ProcessStage.Logic);
  }

  $logic() {
    let skeletalMeshWorldMatrix;
    let jointZeroWorldMatrix;
    let flatMatrices: number[] = [];
    const matrices = [];
    if (this.isSkinning) {
      for (let i=this.__joints.length-1; i>=0; i--) {
        let globalJointTransform = null;
        let inverseBindMatrix = this.__joints[i]._inverseBindMatrix!;
        globalJointTransform = new Matrix44(this.__joints[i].worldMatrixInner);
        skeletalMeshWorldMatrix = globalJointTransform;

        if (i === 0) {
          jointZeroWorldMatrix = globalJointTransform;
        }
        matrices[i] = Matrix44.identity();
        matrices[i] = Matrix44.multiply(matrices[i], globalJointTransform);
        matrices[i] = Matrix44.multiply(matrices[i], inverseBindMatrix);
        if (this._bindShapeMatrix) {
          matrices[i] = Matrix44.multiply(matrices[i], this._bindShapeMatrix); // only for glTF1
        }
      }

      flatMatrices = [];
      for (let i=0; i<matrices.length; i++) {
        Array.prototype.push.apply(flatMatrices, matrices[i].flattenAsArray());
      }
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

  get jointMatrices() {
    return this.__jointMatrices;
  }
}
ComponentRepository.registerComponentClass(SkeletalComponent);
