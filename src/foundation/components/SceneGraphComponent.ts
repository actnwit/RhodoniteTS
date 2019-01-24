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

export default class SceneGraphComponent extends Component {
  private __parent?: SceneGraphComponent
  private __isAbleToBeParent: boolean;
  private __children?: Array<SceneGraphComponent>
  private _worldMatrix: MutableRowMajarMatrix44 = MutableRowMajarMatrix44.dummy();
  private _normalMatrix: MutableMatrix33 = MutableMatrix33.dummy();
  private __isWorldMatrixUpToDate: boolean = false;
  private __tmpMatrix = MutableMatrix44.identity();
  private static _isAllUpdate = false;

  private static __bufferView: BufferView;

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository) {
    super(entityUid, componentSid, entityComponent);

    const thisClass = SceneGraphComponent;

    this.__currentProcessStage = ProcessStage.Logic;
    let count = Component.__lengthOfArrayOfProcessStages.get(ProcessStage.Logic)!;
    const array: Int32Array = Component.__componentsOfProcessStages.get(ProcessStage.Logic)!;
    array[count++] = this.componentSID;
    array[count] = Component.invalidComponentSID;

    Component.__lengthOfArrayOfProcessStages.set(ProcessStage.Logic, count)!;

    this.__isAbleToBeParent = false;
    this.beAbleToBeParent(true);
    this.registerMember(BufferUse.GPUInstanceData, 'worldMatrix', MutableRowMajarMatrix44, ComponentType.Float, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    this.registerMember(BufferUse.CPUGeneric, 'normalMatrix', MutableMatrix33, ComponentType.Float, [1, 0, 0, 0, 1, 0, 0, 0, 1]);
    this.submitToAllocation();

    //this.__updatedProperly = false;
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.SceneGraphComponentTID;
  }

  beAbleToBeParent(flag: boolean) {
    this.__isAbleToBeParent = flag;
    if (this.__isAbleToBeParent) {
      this.__children = [];
    } else {
      this.__children = void 0;
    }
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
    this._normalMatrix.copyComponents(new Matrix33(Matrix44.invert(Matrix44.transpose(this.worldMatrix))));
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

  isWorldMatrixUpToDateRecursively() {
    if (this.__isWorldMatrixUpToDate) {
      if (this.__parent) {
        let result = this.__parent.isWorldMatrixUpToDateRecursively();
        if (result) {
          return true;
        }
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  calcWorldMatrixRecursively(): Matrix44 | MutableRowMajarMatrix44 {
    const entity = this.__entityRepository.getEntity(this.__entityUid);
    const transform = entity.getTransform();

    if (SceneGraphComponent._isAllUpdate || this.isWorldMatrixUpToDateRecursively()) {
      return this._worldMatrix;
    } else {
      const matrix = transform.matrixInner;
      if (this.__parent == null) {
        return matrix;
      }
      this.__tmpMatrix.copyComponents(matrix);
      const matrixFromAncestorToParent = this.__parent.calcWorldMatrixRecursively();
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
}
ComponentRepository.registerComponentClass(SceneGraphComponent.componentTID, SceneGraphComponent);