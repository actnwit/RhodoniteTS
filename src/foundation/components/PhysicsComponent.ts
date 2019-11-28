import Vector3 from '../math/Vector3';
import Component from '../core/Component';
import ComponentRepository from '../core/ComponentRepository';
import { ComponentType } from '../definitions/ComponentType';
import EntityRepository from '../core/EntityRepository';
import { WellKnownComponentTIDs } from './WellKnownComponentTIDs';
import { BufferUse, BufferUseEnum } from '../definitions/BufferUse';
import { ProcessStage } from '../definitions/ProcessStage';
import { ComponentTID, ComponentSID, EntityUID } from '../../types/CommonTypes';
import VRMSpringBonePhysicsStrategy from '../physics/VRMSpringBonePhysicsStrategy';
import PhysicsStrategy from '../physics/PhysicsStrategy';

export default class PhysicsComponent extends Component {
  private __weights: number[] = [];
  private _dummy: Vector3 = Vector3.dummy();
  private __strategy: PhysicsStrategy = new VRMSpringBonePhysicsStrategy();

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository) {
    super(entityUid, componentSid, entityComponent);

    this.registerMember(BufferUse.CPUGeneric, 'dummy', Vector3, ComponentType.Float, [0, 0, 0]);
    this.submitToAllocation(this.maxNumberOfComponent);

    this.moveStageTo(ProcessStage.Create);

  }


  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.PhysicsComponentTID;
  }

  $create() {
    this.moveStageTo(ProcessStage.Logic);
  }

  $logic() {
  }

  static common_$logic() {
    VRMSpringBonePhysicsStrategy.update();
  }

  get strategy() {
    return this.__strategy;
  }

}

ComponentRepository.registerComponentClass(PhysicsComponent);
