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

export default class SceneGraphComponent extends Component {
  private __parent?: SceneGraphComponent
  private __isAbleToBeParent: boolean;
  private __children?: Array<SceneGraphComponent>
  private __worldMatrix: Matrix44;
  //private __updatedProperly: boolean;

  private static __bufferView: BufferView;
  private static __accesseor_worldMatrix: Accessor;

  constructor(entityUid: EntityUID) {
    super(entityUid);
    
    const thisClass = SceneGraphComponent;

    this.__isAbleToBeParent = false;
    this.beAbleToBeParent(true);
    this.__worldMatrix = new Matrix44(thisClass.__accesseor_worldMatrix.takeOne() as Float64Array, false, true);
    //this.__worldMatrix = Matrix44.identity();
    this.__worldMatrix.identity();

    //this.__updatedProperly = false;
  }

  static get maxCount() {
    return 1000000;
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.SceneGraphComponentTID;
  }

  static get byteSizeOfThisComponent() {
    return 128;
  }

  static setupBufferView() {
    const thisClass = SceneGraphComponent;
    const buffer = MemoryManager.getInstance().getBufferForGPU();
    const count = EntityRepository.getMaxEntityNumber();
    thisClass.__bufferView = buffer.takeBufferView({byteLengthToNeed: thisClass.byteSizeOfThisComponent * count, byteStride: 0, isAoS: false});
    thisClass.__accesseor_worldMatrix = thisClass.__bufferView.takeAccessor({compositionType: CompositionType.Mat4, componentType: ComponentType.Double, count: count});
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
    return this.calcWorldMatrixRecursively().clone();
  }

  calcWorldMatrixRecursively(): Matrix44 {
    if (!(this.__parent != null)) {
      // if there is not parent
      const entity = this.__entityRepository.getEntity(this.__entityUid);
//      if (!this.__updatedProperly && entity.getTransform()._dirty) {
      if (entity.getTransform()._dirty) {
        //this.__updatedProperly = true;
        entity.getTransform()._dirty = false;
        this.__worldMatrix = entity.getTransform().matrix;
//        console.log('No Skip!', this.__worldMatrix.toString(), this.__entityUid);
      } else {
//        console.log('Skip!', this.__worldMatrix.toString(), this.__entityUid);
      }
      return this.__worldMatrix;
    }
    const matrixFromAncestorToParent = this.__parent.calcWorldMatrixRecursively();
    const entity = this.__entityRepository.getEntity(this.__entityUid);
//    if (!this.__updatedProperly && entity.getTransform()._dirty) {
    if (entity.getTransform()._dirty) {
      //this.__updatedProperly = true;
      entity.getTransform()._dirty = false;
      this.__worldMatrix = entity.getTransform().matrix;
//      console.log('No Skip!', this.__worldMatrix.toString(), this.__entityUid);
    } else {
//      console.log('Skip!', this.__worldMatrix.toString(), this.__entityUid);
    }
    //console.log('return Skip!', this.__worldMatrix.toString(), this.__entityUid);
    return Matrix44.multiply(matrixFromAncestorToParent, this.__worldMatrix);
  }
}
ComponentRepository.registerComponentClass(SceneGraphComponent.componentTID, SceneGraphComponent);
