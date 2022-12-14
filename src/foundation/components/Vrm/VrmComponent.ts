import {
  ComponentSID,
  ComponentTID,
  EntityUID,
} from '../../../types/CommonTypes';
import {Component} from '../../core/Component';
import {EntityRepository} from '../../core/EntityRepository';
import {ProcessStage} from '../../definitions/ProcessStage';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';

export class VrmComponent extends Component {
  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityComponent: EntityRepository
  ) {
    super(entityUid, componentSid, entityComponent);
    this.moveStageTo(ProcessStage.Logic);
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.VrmComponentTID;
  }
}
