import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository, applyMixins } from '../../core/EntityRepository';
import { ProcessStage } from '../../definitions/ProcessStage';
import { IPhysicsEntity } from '../../helpers/EntityHelper';
import { Is } from '../../misc/Is';
import { OimoPhysicsStrategy } from '../../physics/Oimo/OimoPhysicsStrategy';
import type { PhysicsStrategy } from '../../physics/PhysicsStrategy';
import type { VRMSpringBonePhysicsStrategy } from '../../physics/VRMSpring/VRMSpringBonePhysicsStrategy';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

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
  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository, isReUse: boolean) {
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

  getVrmSpring() {
    const strategy = this.__strategy as VRMSpringBonePhysicsStrategy;
    if (Is.not.exist(strategy)) {
      return undefined;
    }

    return strategy.getVrmSpring?.();
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
   * Sets the visibility of all colliders managed by this physics component.
   * This is useful for debugging and visualizing collision boundaries.
   * Note: This only works if the physics strategy supports collider visualization
   * (e.g., VRMSpringBonePhysicsStrategy).
   *
   * @param visible - Whether the colliders should be visible
   */
  setCollidersVisible(visible: boolean): void {
    this.__strategy?.setCollidersVisible?.(visible);
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
       * Gets the physics component attached to this entity.
       * @returns The PhysicsComponent instance for this entity
       */
      getPhysics() {
        return this.getComponentByComponentTID(WellKnownComponentTIDs.PhysicsComponentTID) as PhysicsComponent;
      }
    }
    applyMixins(base, PhysicsEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}
