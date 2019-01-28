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

export default class SceneGraphComponent extends Component {
  private __parent?: SceneGraphComponent
  public isAbleToBeParent: boolean;
  private __children: Array<SceneGraphComponent> = [];
  private _worldMatrix: MutableRowMajarMatrix44 = MutableRowMajarMatrix44.dummy();
  private _normalMatrix: MutableMatrix33 = MutableMatrix33.dummy();
  private __isWorldMatrixUpToDate: boolean = false;
  private __tmpMatrix = MutableMatrix44.identity();
  private static _isAllUpdate = false;

  // Skeletal
  public isRootJoint = false;
  public jointIndex = -1;
  public _inverseBindMatrix?: Matrix44;
  public _bindMatrix?: Matrix44;
  public _jointsOfParentHierarchies: SceneGraphComponent[] = [];

  private static __bufferView: BufferView;

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);

    const thisClass = SceneGraphComponent;

    this.__currentProcessStage = ProcessStage.Logic;
    let count = Component.__lengthOfArrayOfProcessStages.get(ProcessStage.Logic)!;
    const array: Int32Array = Component.__componentsOfProcessStages.get(ProcessStage.Logic)!;
    array[count++] = this.componentSID;
    array[count] = Component.invalidComponentSID;

    Component.__lengthOfArrayOfProcessStages.set(ProcessStage.Logic, count)!;

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
      this._worldMatrix.copyComponents(this.calcWorldMatrixRecursively());
      this.__isWorldMatrixUpToDate = true;
  //  }

    return this._worldMatrix;
  }

  get worldMatrix() {
    return this.worldMatrixInner.clone();
  }

  get normalMatrixInner() {
    this._normalMatrix.copyComponents(RowMajarMatrix44.transpose(RowMajarMatrix44.invert(this.worldMatrix)));
    //this._normalMatrix.copyComponents(this.worldMatrix);
    return this._normalMatrix;
  }

  get normalMatrix() {
    return this.normalMatrixInner.clone();
  }

  $logic() {
   // if (!this.__isWorldMatrixUpToDate) {
      //this._worldMatrix.identity();
      this._worldMatrix.copyComponents(this.calcWorldMatrixRecursively());
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

  calcWorldMatrixRecursively(): Matrix44 | MutableRowMajarMatrix44 {
    const entity = this.__entityRepository.getEntity(this.__entityUid);
    const transform = entity.getTransform();

    if (SceneGraphComponent._isAllUpdate) {
      return this._worldMatrix;
    } else {
      const matrix = transform.matrixInner;
      if (this.__parent == null) {
        return matrix;
      }
      this.__tmpMatrix.copyComponents(matrix);
      let matrixFromAncestorToParent;
      if (this.isWorldMatrixUpToDateRecursively()) {
        matrixFromAncestorToParent = this.__parent._worldMatrix;
      } else {
        matrixFromAncestorToParent = this.__parent.calcWorldMatrixRecursively();
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

  static flattenHierarchy(sceneGraphComponent: SceneGraphComponent): SceneGraphComponent[] {

    const results: SceneGraphComponent[] = [];
    results.push(sceneGraphComponent);
    if (sceneGraphComponent.isAbleToBeParent) {
      const children = sceneGraphComponent.children!;
      for (let i=0; i<children.length; i++) {
        const hitChildren = this.flattenHierarchy(children[i]);
        Array.prototype.push.apply(results, hitChildren);
      }
    }

    return results;
  }


}
ComponentRepository.registerComponentClass(SceneGraphComponent);