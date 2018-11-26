import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import Matrix44 from '../math/Matrix44';
import Entity from '../core/Entity';
import EntityRepository from '../core/EntityRepository';
import MemoryManager from '../core/MemoryManager';

export default class SceneGraphComponent extends Component {
  private __parent?: SceneGraphComponent
  private __isAbleToBeParent: boolean;
  private __children?: Array<SceneGraphComponent>
  private __worldMatrix: Matrix44;
  private __initialAddressInThisMemoryPoolArea: number;
  private __currentAddressInThisMemoryPoolArea: number;
  private __updatedProperly: boolean;
  private __entityRepository: EntityRepository;

  constructor(entityUid: EntityUID) {
    super(entityUid);

    this.__initialAddressInThisMemoryPoolArea = 10000 + (SceneGraphComponent.componentTID - 1) * this.sizeOfThisComponent * this.componentSID;
    //this.__initialAddressInThisMemoryPoolArea = (SceneGraphComponent.componentTID - 1)*64 + entityUid;
    this.__currentAddressInThisMemoryPoolArea = this.__initialAddressInThisMemoryPoolArea;

    this.__isAbleToBeParent = false;
    this.beAbleToBeParent(true);
    this.__worldMatrix = new Matrix44(this.allocate(16), false, true);
    //this.__worldMatrix = Matrix44.identity();
    this.__worldMatrix.identity();

    this.__updatedProperly = false;

    this.__entityRepository = EntityRepository.getInstance();
  }

  static get maxCount() {
    return 1000000;
  }

  static get componentTID(): ComponentTID {
    return 2;
  }

  get sizeOfThisComponent() {
    return 64;
  }

  beAbleToBeParent(flag: boolean) {
    this.__isAbleToBeParent = flag;
    if (this.__isAbleToBeParent) {
      this.__children = [];
    } else {
      this.__children = void 0;
    }
  }

  allocate(size: number) {
    console.log('AAAA', this.__currentAddressInThisMemoryPoolArea, size);
    const memory = this.__memoryManager.allocate(this.__currentAddressInThisMemoryPoolArea, size);
    this.__currentAddressInThisMemoryPoolArea += size;
    console.log('AAAA', this.__currentAddressInThisMemoryPoolArea, size);
    if (this.__currentAddressInThisMemoryPoolArea - this.__initialAddressInThisMemoryPoolArea > this.sizeOfThisComponent) {
      console.error('Exceeded allocation aginst max memory size of compoment!');
    }

    return memory;
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
      if (!this.__updatedProperly && entity.getTransform()._dirty) {
        this.__updatedProperly = true;
        this.__worldMatrix = entity.getTransform().matrix;
        console.log('No Skip!', this.__worldMatrix.toString(), this.__entityUid);
      } else {
        console.log('Skip!', this.__worldMatrix.toString(), this.__entityUid);
      }
      return this.__worldMatrix; 
    }
    const matrixFromAncestorToParent = this.__parent.calcWorldMatrixRecursively();
    const entity = this.__entityRepository.getEntity(this.__entityUid);
    if (!this.__updatedProperly && entity.getTransform()._dirty) {
      this.__updatedProperly = true;
      this.__worldMatrix = entity.getTransform().matrix;
      console.log('No Skip!', this.__worldMatrix.toString(), this.__entityUid);
    } else {
      console.log('Skip!', this.__worldMatrix.toString(), this.__entityUid);
    }
    //console.log('return Skip!', this.__worldMatrix.toString(), this.__entityUid);
    return Matrix44.multiply(matrixFromAncestorToParent, this.__worldMatrix);
  }
}
ComponentRepository.registerComponentClass(SceneGraphComponent.componentTID, SceneGraphComponent);
