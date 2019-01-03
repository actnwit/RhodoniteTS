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

export default class SceneGraphComponent extends Component {
  private __parent?: SceneGraphComponent
  private __isAbleToBeParent: boolean;
  private __children?: Array<SceneGraphComponent>
  private __worldMatrix: RowMajarMatrix44;
  //private __updatedProperly: boolean;

  private static __bufferView: BufferView;

  constructor(entityUid: EntityUID, componentSid: ComponentSID) {
    super(entityUid, componentSid);

    const thisClass = SceneGraphComponent;

    this.__isAbleToBeParent = false;
    this.beAbleToBeParent(true);
    this.__worldMatrix = this.takeOne('worldMatrix', RowMajarMatrix44);
    this.__worldMatrix.identity();

    //this.__updatedProperly = false;
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.SceneGraphComponentTID;
  }

  static setupBufferView() {
    this.registerMember(BufferUse.GPUInstanceData, 'worldMatrix', this, CompositionType.Mat4, ComponentType.Float);

    this.submitToAllocation(this);

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
        this.__worldMatrix.copyComponents(transform.matrixInner);
//        console.log('No Skip!', this.__worldMatrix.toString(), this.__entityUid);
      } else {
//        console.log('Skip!', this.__worldMatrix.toString(), this.__entityUid);
      }
      return this.__worldMatrix;
    }
    const matrixFromAncestorToParent = this.__parent.calcWorldMatrixRecursively();
    this.__worldMatrix.multiplyByLeft(matrixFromAncestorToParent);
    return this.__worldMatrix;
  }
}
ComponentRepository.registerComponentClass(SceneGraphComponent.componentTID, SceneGraphComponent);
SceneGraphComponent.setupBufferView();