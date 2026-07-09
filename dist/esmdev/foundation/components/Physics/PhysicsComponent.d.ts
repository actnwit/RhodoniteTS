import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository } from '../../core/EntityRepository';
import type { PhysicsStrategy } from '../../physics/PhysicsStrategy';
import type { Engine } from '../../system/Engine';
import type { ComponentToComponentMethods } from '../ComponentTypes';
/**
 * PhysicsComponent is a component that manages the physics simulation for an entity.
 * It provides integration with physics engines through the strategy pattern and handles
 * physics updates during the logic processing stage.
 */
export declare class PhysicsComponent extends Component {
    private __strategy?;
    /**
     * Creates a new PhysicsComponent instance.
     * @param engine - The engine instance
     * @param entityUid - The unique identifier of the entity this component belongs to
     * @param componentSid - The component's serial identifier
     * @param entityComponent - The entity repository managing this component
     * @param isReUse - Whether this component is being reused from a pool
     */
    constructor(engine: Engine, entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository, isReUse: boolean);
    /**
     * Gets the component type identifier for PhysicsComponent.
     * @returns The component type ID for physics components
     */
    static get componentTID(): 12;
    /**
     * Gets the component type identifier for this instance.
     * @returns The component type ID for physics components
     */
    get componentTID(): ComponentTID;
    /**
     * Sets the physics strategy for this component.
     * The strategy defines how physics calculations and updates are performed.
     * @param strategy - The physics strategy to use for this component
     */
    setStrategy(strategy: PhysicsStrategy): void;
    /**
     * Gets the current physics strategy used by this component.
     * @returns The physics strategy instance, or undefined if none is set
     */
    get strategy(): PhysicsStrategy | undefined;
    getVrmSpring(): import("../..").VRMSpring | undefined;
    /**
     * Common logic method that updates the global physics simulation.
     * This is called once per frame for all physics components and handles
     * the overall physics world update using the Oimo physics engine.
     */
    static common_$logic({ engine }: {
        engine: Engine;
    }): void;
    /**
     * Instance-specific logic method that updates this component's physics.
     * Called during the logic processing stage to update individual physics entities.
     */
    $logic(): void;
    /**
     * Sets the visibility of all colliders managed by this physics component.
     * This is useful for debugging and visualizing collision boundaries.
     * Note: This only works if the physics strategy supports collider visualization
     * (e.g., VRMSpringBonePhysicsStrategy).
     *
     * @param visible - Whether the colliders should be visible
     */
    setCollidersVisible(visible: boolean): void;
    /**
     * Destroys this physics component and cleans up resources.
     * Calls the parent destroy method and clears the physics strategy reference.
     * @override
     */
    _destroy(): void;
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
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}
