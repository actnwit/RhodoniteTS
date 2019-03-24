import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import Matrix44 from '../math/Matrix44';
import EntityRepository from '../core/EntityRepository';
import BufferView from '../memory/BufferView';
import { ComponentType } from '../definitions/ComponentType';
import { WellKnownComponentTIDs } from './WellKnownComponentTIDs';
import MutableRowMajarMatrix44 from '../math/MutableRowMajarMatrix44';
import { BufferUse } from '../definitions/BufferUse';
import { ProcessStage } from '../definitions/ProcessStage';
import MutableMatrix44 from '../math/MutableMatrix44';
import MutableMatrix33 from '../math/MutableMatrix33';
import Matrix33 from '../math/Matrix33';
import RowMajarMatrix44 from '../math/RowMajarMatrix44';
import Vector4 from '../math/Vector4';
import Vector3 from '../math/Vector3';
import AABB from '../math/AABB';
import MeshComponent from './MeshComponent';
import MutableVector3 from '../math/MutableVector3';

export default class SceneGraphComponent extends Component {
  private __parent?: SceneGraphComponent
  public isAbleToBeParent: boolean;
  private __children: Array<SceneGraphComponent> = [];
  private _worldMatrix: MutableRowMajarMatrix44 = MutableRowMajarMatrix44.dummy();
  private _normalMatrix: MutableMatrix33 = MutableMatrix33.dummy();
  private __isWorldMatrixUpToDate: boolean = false;
  private __tmpMatrix = MutableMatrix44.identity();
  private static _isAllUpdate = false;
  private __worldAABB = new AABB();
  private __meshComponent?: MeshComponent;
  private __isWorldAABBDirty = true;
  private static __originVector3 = Vector3.zero();
  private static returnVector3 = MutableVector3.zero();

  // Skeletal
  public isRootJoint = false;
  public jointIndex = -1;
  public _inverseBindMatrix?: Matrix44;
  public _bindMatrix?: Matrix44;
  public _jointsOfHierarchies: SceneGraphComponent[] = [];

  private static __bufferView: BufferView;
  private static invertedMatrix44 = new MutableRowMajarMatrix44([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]);

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);

    const thisClass = SceneGraphComponent;

//    this.__currentProcessStage = ProcessStage.Logic;

    this.isAbleToBeParent = false;
    this.beAbleToBeParent(true);
    this.registerMember(BufferUse.GPUInstanceData, 'worldMatrix', MutableRowMajarMatrix44, ComponentType.Float, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    this.registerMember(BufferUse.CPUGeneric, 'normalMatrix', MutableMatrix33, ComponentType.Float, [1, 0, 0, 0, 1, 0, 0, 0, 1]);
    this.submitToAllocation();

    //this.__updatedProperly = false;

  }

  isJoint() {
    if (this.jointIndex >= 0) {
      return true;
    } else {
      return false;
    }
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.SceneGraphComponentTID;
  }

  beAbleToBeParent(flag: boolean) {
    this.isAbleToBeParent = flag;
  }

  setWorldMatrixDirty() {
    this.__isWorldMatrixUpToDate = false;
    SceneGraphComponent._isAllUpdate = false;
    this.__isWorldAABBDirty = true;
  }

  addChild(sg: SceneGraphComponent) {
    if (this.__children != null) {
      sg.__parent = this;
      this.__children.push(sg);
    } else {
      console.error('This is not allowed to have children.');
    }
  }

  get children() {
    return this.__children;
  }

  get parent() {
    return this.__parent;
  }

  get worldMatrixInner() {
//    if (!this.__isWorldMatrixUpToDate) {
      //this._worldMatrix.identity();
      this._worldMatrix.copyComponents(this.calcWorldMatrixRecursively(false));//this.isJoint()));
      this.__isWorldMatrixUpToDate = true;
  //  }

    return this._worldMatrix;
  }

  get worldMatrix() {
    return this.worldMatrixInner.clone();
  }

  get normalMatrixInner() {
    RowMajarMatrix44.invertTo(this.worldMatrixInner, SceneGraphComponent.invertedMatrix44);
    this._normalMatrix.copyComponents((SceneGraphComponent.invertedMatrix44.transpose() as any ) as Matrix44);
    return this._normalMatrix;
  }

  get normalMatrix() {
    return this.normalMatrixInner.clone();
  }

  $create() {
    this.__meshComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, MeshComponent) as MeshComponent;

    this.moveStageTo(ProcessStage.Logic);
  }

  $logic() {
   // if (!this.__isWorldMatrixUpToDate) {
      //this._worldMatrix.identity();
      this._worldMatrix.copyComponents(this.calcWorldMatrixRecursively(false));//this.isJoint()));
      this.__isWorldMatrixUpToDate = true;
    //}
  }

  static common_$prerender() {
    SceneGraphComponent._isAllUpdate = true;
  }

  isWorldMatrixUpToDateRecursively() : boolean {
    if (this.__isWorldMatrixUpToDate) {
      if (this.__parent) {
        let result = this.__parent.isWorldMatrixUpToDateRecursively();
        return result;
      } else {
        return true;
      }
    }
    return false;
  }

  calcWorldMatrixRecursively(isJointMode: boolean): Matrix44 | MutableRowMajarMatrix44 {
    const entity = this.__entityRepository.getEntity(this.__entityUid);
    const transform = entity.getTransform();

    if (SceneGraphComponent._isAllUpdate) {
      return this._worldMatrix;
    } else {
      const matrix = transform.matrixInner;
      if (this.__parent == null || (isJointMode && this.__parent != null && !this.__parent.isJoint())) {
        return matrix;
      }
      this.__tmpMatrix.copyComponents(matrix);
      let matrixFromAncestorToParent;
      if (this.isWorldMatrixUpToDateRecursively()) {
        matrixFromAncestorToParent = this.__parent._worldMatrix;
      } else {
        matrixFromAncestorToParent = this.__parent.calcWorldMatrixRecursively(isJointMode);
      }
      this.__tmpMatrix.multiplyByLeft(matrixFromAncestorToParent);
    }

    return this.__tmpMatrix;

    // let matrix;
    // let currentMatrix = transform.matrixInner;
    // if (this.__parent == null) {
    //   return currentMatrix;
    // }
    // matrix = Matrix44.multiply(this.__parent!.calcWorldMatrixRecursively(), currentMatrix);

    // return matrix;
  }

  static flattenHierarchy(sceneGraphComponent: SceneGraphComponent, isJointMode: Boolean): SceneGraphComponent[] {

    const results: SceneGraphComponent[] = [];
    if (!isJointMode || sceneGraphComponent.isJoint()) {
      results.push(sceneGraphComponent);
    }
    if (sceneGraphComponent.isAbleToBeParent) {
      const children = sceneGraphComponent.children!;
      for (let i=0; i<children.length; i++) {
        const hitChildren = this.flattenHierarchy(children[i], isJointMode);
        Array.prototype.push.apply(results, hitChildren);
      }
    }

    return results;
  }

  get worldPosition(): Vector3 {
    const zeroVector = SceneGraphComponent.__originVector3;
    this.worldMatrixInner.multiplyVector3To(zeroVector, SceneGraphComponent.returnVector3);
    return SceneGraphComponent.returnVector3 as Vector3;
  }

  calcWorldAABB() {
    const that = this;
    var aabb = (function mergeAABBRecursively(elem: SceneGraphComponent) {

      if (elem.__meshComponent != null) {
        elem.__worldAABB = AABB.multiplyMatrix(new Matrix44(elem.worldMatrixInner), elem.__meshComponent!.AABB);
      }

      var children = elem.children;
      for (let i = 0; i < children.length; i++) {
        var aabb = mergeAABBRecursively(children[i]);
        if (aabb instanceof AABB) {
          elem.__worldAABB.mergeAABB(aabb);
        } else {
          console.assert("calculation of AABB error!");
        }
      }

      return elem.__worldAABB;

      return new AABB();
    })(this);

    this.__worldAABB.mergeAABB(aabb);

    return this.__worldAABB;
  }

  get worldAABB() {
    if (this.__isWorldAABBDirty) {
      this.calcWorldAABB();
      this.__isWorldAABBDirty = false;
    }
    return this.__worldAABB;
  }

}
ComponentRepository.registerComponentClass(SceneGraphComponent);