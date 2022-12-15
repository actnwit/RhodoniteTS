import {
  ComponentSID,
  ComponentTID,
  EntityUID,
} from '../../../types/CommonTypes';
import {Component} from '../../core/Component';
import { ComponentRepository } from '../../core/ComponentRepository';
import { IEntity } from '../../core/Entity';
import {applyMixins, EntityRepository} from '../../core/EntityRepository';
import {ProcessStage} from '../../definitions/ProcessStage';
import { ComponentToComponentMethods } from '../ComponentTypes';
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

  getVrm() {}

  /**
   * @override
   * Add this component to the entity
   * @param base the target entity
   * @param _componentClass the component class to add
   */
  addThisComponentToEntity<
    EntityBase extends IEntity,
    SomeComponentClass extends typeof Component
  >(base: EntityBase, _componentClass: SomeComponentClass) {
    class VrmEntity extends (base.constructor as any) {
      private __vrmComponent?: VrmComponent;
      constructor(
        entityUID: EntityUID,
        isAlive: Boolean,
        components?: Map<ComponentTID, Component>
      ) {
        super(entityUID, isAlive, components);
      }

      getVrm() {
        if (this.__vrmComponent === undefined) {
          this.__vrmComponent = this.getComponentByComponentTID(
            WellKnownComponentTIDs.VrmComponentTID
          ) as VrmComponent;
        }
        return this.__vrmComponent;
      }
    }
    applyMixins(base, VrmEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> &
      EntityBase;
  }
}
ComponentRepository.registerComponentClass(VrmComponent);
