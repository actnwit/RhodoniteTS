import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import Primitive from '../geometry/Primitive';
import MemoryManager from '../core/MemoryManager';
import EntityRepository from '../core/EntityRepository';
import Accessor from '../memory/Accessor';
import BufferView from '../memory/BufferView';
import { CompositionType } from '../definitions/CompositionType';
import { ComponentType } from '../definitions/ComponentType';

export default class MeshComponent extends Component {
  private __primitives: Array<Primitive> = [];

  constructor(entityUid: EntityUID) {
    super(entityUid);

  }
  static get maxCount() {
    return 1000000;
  }

  static get componentTID(): ComponentTID {
    return 3;
  }

  addPrimitive(primitive: Primitive) {
    this.__primitives.push(primitive);
  }
}
ComponentRepository.registerComponentClass(MeshComponent.componentTID, MeshComponent);
