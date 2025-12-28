import type { ComponentSID, ComponentTID, Count, EntityUID, Index, PrimitiveUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository, applyMixins } from '../../core/EntityRepository';
import { ProcessStage } from '../../definitions/ProcessStage';
import type { RenderPass } from '../../renderer/RenderPass';
import type { Engine } from '../../system/Engine';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

/**
 * RaymarchingComponent is a component that manages raymarching for an entity.
 * This component handles the raymarching of the entity.
 */
export class RaymarchingComponent extends Component {
  constructor(
    engine: Engine,
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityComponent: EntityRepository,
    isReUse: boolean
  ) {
    super(engine, entityUid, componentSid, entityComponent, isReUse);
    this.moveStageTo(ProcessStage.Logic);
  }

  /**
   * Gets the component type identifier for RaymarchingComponent.
   * @returns The component type ID for RaymarchingComponent
   */
  static get componentTID() {
    return WellKnownComponentTIDs.RaymarchingComponentTID;
  }

  /**
   * Gets the component type identifier for this RaymarchingComponent instance.
   * @returns The component type ID for RaymarchingComponent
   */
  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.RaymarchingComponentTID;
  }

  static common_$render(): boolean {
    return true;
  }

  /**
   * Creates a shallow copy of this RaymarchingComponent from another RaymarchingComponent.
   * @param component - The source component to copy from
   * @protected
   */
  _shallowCopyFrom(component: Component): void {
    super._shallowCopyFrom(component);
  }

  /**
   * Destroys this RaymarchingComponent and cleans up resources.
   * @protected
   */
  _destroy(): void {
    super._destroy();
  }

  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    /**
     * RaymarchingEntity is a mixin that adds raymarching-specific methods to the base entity.
     * @extends EntityBase
     */
    class RaymarchingEntity extends (base.constructor as any) {
      /**
       * Gets the RaymarchingComponent associated with this entity.
       * @returns The RaymarchingComponent instance
       */
      getRaymarching() {
        return this.getComponentByComponentTID(WellKnownComponentTIDs.RaymarchingComponentTID) as RaymarchingComponent;
      }
    }
    applyMixins(base, RaymarchingEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}
