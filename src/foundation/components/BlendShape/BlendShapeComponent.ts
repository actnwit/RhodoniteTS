import { Component } from '../../core/Component';
import { ComponentRepository } from '../../core/ComponentRepository';
import { applyMixins, EntityRepository } from '../../core/EntityRepository';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import {ProcessStage} from '../../definitions/ProcessStage';
import {
  ComponentTID,
  ComponentSID,
  EntityUID,
} from '../../../types/CommonTypes';
import {IEntity} from '../../core/Entity';
import {ComponentToComponentMethods} from '../ComponentTypes';

export class BlendShapeComponent extends Component {
  private __weights: number[] = [];
  private __targetNames: string[] = [];

  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityComponent: EntityRepository
  ) {
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

  $logic() {}

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
    class BlendShapeEntity extends (base.constructor as any) {
      constructor(
        entityUID: EntityUID,
        isAlive: Boolean,
        components?: Map<ComponentTID, Component>
      ) {
        super(entityUID, isAlive, components);
      }

      getBlendShape() {
        return this.getComponentByComponentTID(
          WellKnownComponentTIDs.BlendShapeComponentTID
        ) as BlendShapeComponent;
      }
    }
    applyMixins(base, BlendShapeEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> &
      EntityBase;
  }
}

ComponentRepository.registerComponentClass(BlendShapeComponent);
