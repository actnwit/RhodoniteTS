import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';

export default class SceneGraphComponent extends Component {

  static get maxCount() {
    return 1000000;
  }

  static get componentTID(): ComponentTID {
    return 2;
  }
}
ComponentRepository.registerComponentClass(SceneGraphComponent.componentTID, SceneGraphComponent);
