import { Component } from '../../core/Component';
import { applyMixins, EntityRepository } from '../../core/EntityRepository';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';
import { ProcessStage } from '../../definitions/ProcessStage';
import { ComponentTID, ComponentSID, EntityUID } from '../../../types/CommonTypes';
import { PhysicsStrategy } from '../../physics/PhysicsStrategy';
import { IEntity } from '../../core/Entity';
import { ComponentToComponentMethods } from '../ComponentTypes';
import { OimoPhysicsStrategy } from '../../physics/Oimo/OimoPhysicsStrategy';
import { IPhysicsEntity } from '../../helpers/EntityHelper';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';

/**
 * PhysicsComponent is a component that manages the physics simulation for an entity.
 * It provides integration with physics engines through the strategy pattern and handles
 * physics updates during the logic processing stage.
 */
export class PhysicsComponent extends Component {
  private __strategy?: PhysicsStrategy;

  /**
   * Creates a new PhysicsComponent instance.
   * @param entityUid - The unique identifier of the entity this component belongs to
   * @param componentSid - The component's serial identifier
   * @param entityComponent - The entity repository managing this component
   * @param isReUse - Whether this component is being reused from a pool
   */
  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityComponent: EntityRepository,
    isReUse: boolean
  ) {
    super(entityUid, componentSid, entityComponent, isReUse);

    this.moveStageTo(ProcessStage.Logic);
  }

  /**
   * Gets the component type identifier for PhysicsComponent.
   * @returns The component type ID for physics components
   */
  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.PhysicsComponentTID;
  }

  /**
   * Gets the component type identifier for this instance.
   * @returns The component type ID for physics components
   */
  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.PhysicsComponentTID;
  }

  /**
   * Sets the physics strategy for this component.
   * The strategy defines how physics calculations and updates are performed.
   * @param strategy - The physics strategy to use for this component
   */
  setStrategy(strategy: PhysicsStrategy) {
    this.__strategy = strategy;
  }

  /**
   * Gets the current physics strategy used by this component.
   * @returns The physics strategy instance, or undefined if none is set
   */
  get strategy() {
    return this.__strategy;
  }

  /**
   * Common logic method that updates the global physics simulation.
   * This is called once per frame for all physics components and handles
   * the overall physics world update using the Oimo physics engine.
   */
  static common_$logic() {
    OimoPhysicsStrategy.update();
  }

  /**
   * Instance-specific logic method that updates this component's physics.
   * Called during the logic processing stage to update individual physics entities.
   */
  $logic() {
    this.__strategy?.update();
  }

  /**
   * Destroys this physics component and cleans up resources.
   * Calls the parent destroy method and clears the physics strategy reference.
   * @override
   */
  _destroy(): void {
    super._destroy();
    this.__strategy = undefined;
  }

  /**
   * Adds physics functionality to an entity by mixing in physics-specific methods.
   * This method extends the base entity class with physics-related capabilities,
   * allowing the entity to access its physics component through a convenient getter.
   * @template EntityBase - The base entity type to extend
   * @template SomeComponentClass - The component class type
   * @param base - The target entity to add physics functionality to
   * @param _componentClass - The component class being added (used for type inference)
   * @returns The enhanced entity with physics methods and the original entity functionality
   * @override
   */
  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class PhysicsEntity extends (base.constructor as any) {
      /**
       * Creates a new PhysicsEntity instance.
       * @param entityUID - The unique identifier for this entity
       * @param isAlive - Whether the entity is currently active
       * @param components - Optional map of existing components
       */
      constructor(
        entityUID: EntityUID,
        isAlive: boolean,
        components?: Map<ComponentTID, Component>
      ) {
        super(entityUID, isAlive, components);
      }

      /**
       * Gets the physics component attached to this entity.
       * @returns The PhysicsComponent instance for this entity
       */
      getPhysics() {
        return this.getComponentByComponentTID(
          WellKnownComponentTIDs.PhysicsComponentTID
        ) as PhysicsComponent;
      }
    }
    applyMixins(base, PhysicsEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}
