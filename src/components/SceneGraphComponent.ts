import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import Matrix44 from '../math/Matrix44';
import Entity from '../core/Entity';
import EntityRepository from '../core/EntityRepository';
import MemoryManager from '../core/MemoryManager';
import BufferView from '../memory/BufferView';
import Accessor from '../memory/Accessor';
import { CompositionType } from '../definitions/CompositionType';
import { ComponentType } from '../definitions/ComponentType';
import { WellKnownComponentTIDs } from './WellKnownComponentTIDs';
import RowMajarMatrix44 from '../math/RowMajarMatrix44';
import WebGLResourceRepository from '../renderer/webgl/WebGLResourceRepository';
import { BufferUse } from '../definitions/BufferUse';
import { ProcessStage } from '../definitions/ProcessStage';

export default class SceneGraphComponent extends Component {
  private __parent?: SceneGraphComponent
  private __isAbleToBeParent: boolean;
  private __children?: Array<SceneGraphComponent>
  private _worldMatrix: RowMajarMatrix44 = RowMajarMatrix44.dummy();
  //private __updatedProperly: boolean;

  private static __bufferView: BufferView;

  constructor(entityUid: EntityUID, componentSid: ComponentSID) {
    super(entityUid, componentSid);

    const thisClass = SceneGraphComponent;

    this.__currentProcessStage = ProcessStage.Logic;
    let count = Component.__lengthOfArrayOfProcessStages.get(ProcessStage.Logic)!;
    const array: Int32Array = Component.__componentsOfProcessStages.get(ProcessStage.Logic)!;
    array[count++] = this.componentSID;
    array[count] = Component.invalidComponentSID;
     
    Component.__lengthOfArrayOfProcessStages.set(ProcessStage.Logic, count)!;

    this.__isAbleToBeParent = false;
    this.beAbleToBeParent(true);
    this.registerMember(BufferUse.GPUInstanceData, 'worldMatrix', RowMajarMatrix44, CompositionType.Mat4, ComponentType.Float);
    this.submitToAllocation();
    this._worldMatrix.identity();

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

  addChild(sg: SceneGraphComponent) {
    if (this.__children != null) {
      sg.__parent = this;
      this.__children.push(sg);
    } else {
      console.error('This is not allowed to have children.');
    }
  }

  get worldMatrixInner() {
    return this.calcWorldMatrixRecursively();
  }

  get worldMatrix() {
    return this.worldMatrixInner.clone();
  }

  $logic() {
    this.calcWorldMatrixRecursively();
  }

  calcWorldMatrixRecursively(): Matrix44 {
    const entity = this.__entityRepository.getEntity(this.__entityUid);
    const transform = entity.getTransform();
    if (this.__parent == null) {
      // if there is not parent
      if (transform._dirty) {
        transform._dirty = false;
        this._worldMatrix.copyComponents(transform.matrixInner);
//        console.log('No Skip!', this._worldMatrix.toString(), this.__entityUid);
      } else {
//        console.log('Skip!', this._worldMatrix.toString(), this.__entityUid);
      }
      return this._worldMatrix;
    }
    const matrixFromAncestorToParent = this.__parent.calcWorldMatrixRecursively();
    this._worldMatrix.multiplyByLeft(matrixFromAncestorToParent);
    return this._worldMatrix;
  }
}
ComponentRepository.registerComponentClass(SceneGraphComponent.componentTID, SceneGraphComponent);