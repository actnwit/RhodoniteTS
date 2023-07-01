import { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import { ComponentRepository } from '../../core/ComponentRepository';
import { IEntity } from '../../core/Entity';
import { EntityRepository, applyMixins } from '../../core/EntityRepository';
import { IConstraintEntity } from '../../helpers/EntityHelper';
import { ComponentToComponentMethods } from '../ComponentTypes';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export class ConstraintComponent extends Component {
  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository) {
    super(entityUid, componentSid, entityComponent);
  }
  /**
   * get the entity which has this component.
   * @returns the entity which has this component
   */
  get entity(): IConstraintEntity {
    return EntityRepository.getEntity(this.__entityUid) as unknown as IConstraintEntity;
  }

  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class ConstraintEntity extends (base.constructor as any) {
      constructor(
        entityUID: EntityUID,
        isAlive: boolean,
        components?: Map<ComponentTID, Component>
      ) {
        super(entityUID, isAlive, components);
      }

      getLight() {
        return this.getComponentByComponentTID(
          WellKnownComponentTIDs.LightComponentTID
        ) as ConstraintComponent;
      }
    }
    applyMixins(base, ConstraintEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}
ComponentRepository.registerComponentClass(ConstraintComponent);
