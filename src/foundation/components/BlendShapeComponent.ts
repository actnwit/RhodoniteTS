import Component from '../core/Component';
import ComponentRepository from '../core/ComponentRepository';
import EntityRepository from '../core/EntityRepository';
import { WellKnownComponentTIDs } from './WellKnownComponentTIDs';
import { ProcessStage } from '../definitions/ProcessStage';
import { ComponentTID, ComponentSID, EntityUID } from '../../commontypes/CommonTypes';

export default class BlendShapeComponent extends Component {
  private __weights: number[] = [];
  private __targetNames: string[] = [];

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository) {
    super(entityUid, componentSid, entityComponent);

    this.moveStageTo(ProcessStage.Logic);
  }


  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.BlendShapeComponentTID;
  }

  set weights(weights: number[]) {
    this.__weights = weights;
  }

  get weights() {
    return this.__weights;
  }

  set targetNames(names: string[]) {
    this.__targetNames = names;
  }

  get targetNames() {
    return this.__targetNames;
  }

  $logic() {
  }
}

ComponentRepository.registerComponentClass(BlendShapeComponent);
