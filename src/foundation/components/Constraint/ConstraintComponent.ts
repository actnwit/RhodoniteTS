import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import type { IVrmConstraint } from '../../constraints/IVrmConstraint';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository, applyMixins } from '../../core/EntityRepository';
import { ProcessStage } from '../../definitions/ProcessStage';
import type { IConstraintEntity } from '../../helpers/EntityHelper';
import type { Engine } from '../../system/Engine';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

/**
 * ConstraintComponent is a component that manages VRM constraints.
 * This component handles the lifecycle and execution of constraint objects,
 * providing functionality to apply VRM-based transformations to entities.
 */
export class ConstraintComponent extends Component {
  private __vrmConstraint?: IVrmConstraint;

  /**
   * Creates a new ConstraintComponent instance.
   *
   * @param engine - The engine instance
   * @param entityUid - The unique identifier of the entity this component belongs to
   * @param componentSid - The unique identifier of this component instance
   * @param entityComponent - The entity repository managing this component
   * @param isReUse - Whether this component is being reused from a pool
   */
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
   * Gets the entity that owns this constraint component.
   * The returned entity will have constraint-specific methods available.
   *
   * @returns The entity instance cast as IConstraintEntity
   */
  get entity(): IConstraintEntity {
    return this.__engine.entityRepository.getEntity(this.__entityUid) as unknown as IConstraintEntity;
  }

  /**
   * Gets the component type identifier for ConstraintComponent.
   * This is a static property used for component registration and lookup.
   *
   * @returns The component type ID for constraint components
   */
  static get componentTID() {
    return WellKnownComponentTIDs.ConstraintComponentTID;
  }

  /**
   * Gets the component type identifier for this component instance.
   *
   * @returns The component type ID for constraint components
   */
  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.ConstraintComponentTID;
  }

  /**
   * Executes the constraint logic during the Logic process stage.
   * This method is called automatically by the component system and
   * updates the associated VRM constraint if one is set.
   */
  $logic() {
    if (this.__vrmConstraint) {
      this.__vrmConstraint.update();
    }
  }

  /**
   * Associates a VRM constraint with this component.
   * The constraint will be executed during the logic update phase.
   *
   * @param constraint - The VRM constraint to be managed by this component
   */
  setConstraint(constraint: IVrmConstraint) {
    this.__vrmConstraint = constraint;
  }

  /**
   * Cleans up resources when the component is destroyed.
   * This method clears the constraint reference and calls the parent destroy method.
   *
   * @override
   */
  _destroy(): void {
    super._destroy();
    this.__vrmConstraint = undefined;
  }

  /**
   * Adds constraint-specific functionality to an entity class through mixin composition.
   * This method extends the base entity class with constraint-related methods,
   * allowing the entity to access its constraint component easily.
   *
   * @template EntityBase - The base entity type to extend
   * @template SomeComponentClass - The component class type being added
   * @param base - The base entity instance to extend
   * @param _componentClass - The component class being mixed in (unused but required for type safety)
   * @returns The enhanced entity with constraint component methods
   */
  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class ConstraintEntity extends (base.constructor as any) {
      /**
       * Gets the constraint component attached to this entity.
       *
       * @returns The ConstraintComponent instance for this entity
       */
      getConstraint() {
        return this.getComponentByComponentTID(WellKnownComponentTIDs.ConstraintComponentTID) as ConstraintComponent;
      }
    }
    applyMixins(base, ConstraintEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}
