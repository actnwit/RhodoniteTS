import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import Primitive from '../geometry/Primitive';
import MemoryManager from '../core/MemoryManager';
import EntityRepository from '../core/EntityRepository';
import Accessor from '../memory/Accessor';
import BufferView from '../memory/BufferView';
import { CompositionType } from '../definitions/CompositionType';
import { ComponentType } from '../definitions/ComponentType';
import MeshComponent from './MeshComponent';

export default class MeshRendererComponent extends Component {

  constructor(entityUid: EntityUID) {
    super(entityUid);

  }
  static get maxCount() {
    return 1000000;
  }

  static get componentTID(): ComponentTID {
    return 4;
  }

  $create() {
    const meshComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, MeshComponent.componentTID);


  }

}
ComponentRepository.registerComponentClass(MeshRendererComponent.componentTID, MeshRendererComponent);
