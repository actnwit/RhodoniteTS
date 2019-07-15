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
import RowMajarMatrix44 from '../math/RowMajarMatrix44';
import Vector3 from '../math/Vector3';
import AABB from '../math/AABB';
import MutableVector3 from '../math/MutableVector3';
import MeshComponent from './MeshComponent';
import AnimationComponent from './AnimationComponent';
import { ComponentTID, ComponentSID, EntityUID } from '../../types/CommonTypes';

export default class SceneGraphComponent extends Component {
  private __parent?: SceneGraphComponent
  private static __sceneGraphs: SceneGraphComponent[] = [];
  public isAbleToBeParent: boolean;
  private __children: Array<SceneGraphComponent> = [];
  private _worldMatrix: MutableRowMajarMatrix44 = MutableRowMajarMatrix44.dummy();
  private _normalMatrix: MutableMatrix33 = MutableMatrix33.dummy();
  private __isWorldMatrixUpToDate: boolean = false;
  private __tmpMatrix = MutableMatrix44.identity();
  private static _isAllUpdate = false;
  private __worldAABB = new AABB();
  private __isWorldAABBDirty = true;
  private static __originVector3 = Vector3.zero();
  private static returnVector3 = MutableVector3.zero();
  public isVisible = true;
  private __animationComponent?: AnimationComponent;

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

    SceneGraphComponent.__sceneGraphs.push(this);
//    this.__currentProcessStage = ProcessStage.Logic;

    this.isAbleToBeParent = false;
    this.beAbleToBeParent(true);
    this.registerMember(BufferUse.GPUInstanceData, 'worldMatrix', MutableRowMajarMatrix44, ComponentType.Float, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    this.registerMember(BufferUse.GPUInstanceData, 'normalMatrix', MutableMatrix33, ComponentType.Float, [1, 0, 0, 0, 1, 0, 0, 0, 1]);

    this.submitToAllocation(this.maxNumberOfComponent);

  }

  static getTopLevelComponents(): SceneGraphComponent[] {
    return SceneGraphComponent.__sceneGraphs.filter((sg: SceneGraphComponent)=>{
      return sg.isTopLevel;
    });
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

  applyFunctionRecursively(func: Function, args:any[]) {
    for (let child of this.__children) {
      func(child, args);
      child.applyFunctionRecursively(func, args);
    }
  }

  get isTopLevel() {
    return this.__parent == null;
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
    this.moveStageTo(ProcessStage.Load);
  }

  $load() {
    this.__animationComponent = this.entity.getComponent(AnimationComponent) as AnimationComponent;
    this.moveStageTo(ProcessStage.Logic);
  }

  $logic() {

    this._worldMatrix.copyComponents(this.calcWorldMatrixRecursively(false));//this.isJoint()));
    this.__isWorldMatrixUpToDate = true;
    const normal = this.normalMatrix;
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

  /**
   * Collects children and itself from specified sceneGraphComponent.
   * @param sceneGraphComponent collects children and itself from the sceneGraphComponent
   * @param isJointMode collects joints only
   */
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
    var aabb = (function mergeAABBRecursively(elem: SceneGraphComponent, flg: boolean): AABB {
      const meshComponent = elem.entity.getComponentByComponentTID(WellKnownComponentTIDs.MeshComponentTID) as MeshComponent;

      if (meshComponent != null && meshComponent.mesh != null) {
        AABB.multiplyMatrixTo(elem.worldMatrixInner as any as Matrix44, meshComponent.mesh.AABB, elem.__worldAABB);
      }

      var children = elem.children;
      for (let i = 0; i < children.length; i++) {
        var aabb = mergeAABBRecursively(children[i], true);
        if (flg && elem.__animationComponent == null) {
          elem.worldAABB.mergeAABB(aabb);
        } else {
          elem.__worldAABB.mergeAABB(aabb);
        }
      }

      return elem.__worldAABB;
    })(this, false);

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

  setVisibilityRecursively(flag: boolean) {
    this.isVisible = flag;
    for (let child of this.__children) {
      child.setVisibilityRecursively(flag);
    }
  }

}
ComponentRepository.registerComponentClass(SceneGraphComponent);