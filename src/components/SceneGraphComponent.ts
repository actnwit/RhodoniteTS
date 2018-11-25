import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import Matrix44 from '../math/Matrix44';
import MemoryManager from '../core/MemoryManager';

export default class SceneGraphComponent extends Component {
  private __parent?: SceneGraphComponent;
  private __worldMatrix: Matrix44;
  private __initialAddressInThisMemoryPoolArea: number;
  private __currentAddressInThisMemoryPoolArea: number;

  constructor(entityUid: EntityUID) {
    super(entityUid);

    this.__worldMatrix = new Matrix44(this.allocate(16), false, true);
    this.__initialAddressInThisMemoryPoolArea = (SceneGraphComponent.componentTID - 1) * entityUid;
    this.__currentAddressInThisMemoryPoolArea = this.__initialAddressInThisMemoryPoolArea;
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

  allocate(size: number) {
    const memory = this.__memoryManager.allocate(this.__currentAddressInThisMemoryPoolArea, size);
    this.__currentAddressInThisMemoryPoolArea += size;
    if (this.__currentAddressInThisMemoryPoolArea - this.__initialAddressInThisMemoryPoolArea > this.sizeOfThisComponent) {
      console.error('Exceeded allocation aginst max memory size of compoment!');
    }

    return memory;
  }

}
ComponentRepository.registerComponentClass(SceneGraphComponent.componentTID, SceneGraphComponent);
