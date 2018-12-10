import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import Primitive from '../geometry/Primitive';

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
}
ComponentRepository.registerComponentClass(MeshComponent.componentTID, MeshComponent);