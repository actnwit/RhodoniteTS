import Component from '../core/Component';
import ComponentRepository from '../core/ComponentRepository';
import EntityRepository from '../core/EntityRepository';
import {WellKnownComponentTIDs} from './WellKnownComponentTIDs';
import {ProcessStage} from '../definitions/ProcessStage';
import {
  ComponentTID,
  ComponentSID,
  EntityUID,
} from '../../commontypes/CommonTypes';
import VRMSpringBonePhysicsStrategy from '../physics/VRMSpringBonePhysicsStrategy';
import PhysicsStrategy from '../physics/PhysicsStrategy';

export default class PhysicsComponent extends Component {
  private __strategy: PhysicsStrategy = new VRMSpringBonePhysicsStrategy();

  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityComponent: EntityRepository
  ) {
    super(entityUid, componentSid, entityComponent);

    this.moveStageTo(ProcessStage.Logic);
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.PhysicsComponentTID;
  }

  get strategy() {
    return this.__strategy;
  }

  static common_$logic() {
    VRMSpringBonePhysicsStrategy.update();
  }

  $logic() {}
}

ComponentRepository.registerComponentClass(PhysicsComponent);
