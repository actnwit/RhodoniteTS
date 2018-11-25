import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';

export default class MeshComponent extends Component {

  static get maxCount() {
    return 1000000;
  }

  static get componentTID(): ComponentTID {
    return 3;
  }
}
ComponentRepository.registerComponentClass(MeshComponent.componentTID, MeshComponent);