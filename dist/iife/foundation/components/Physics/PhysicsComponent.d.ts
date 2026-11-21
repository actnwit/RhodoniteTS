import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository } from '../../core/EntityRepository';
import type { PhysicsBodyProperty, PhysicsColliderProperty, PhysicsMotionProperty } from '../../physics/PhysicsProperty';
import type { PhysicsStrategy } from '../../physics/PhysicsStrategy';
import type { Engine } from '../../system/Engine';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import type { ShapeComponent } from '../Shape/ShapeComponent';
export type PhysicsShapeBinding = {
    shapeComponent: ShapeComponent;
    shapeIndex?: number;
    body: PhysicsBodyProperty;
    collider: PhysicsColliderProperty;
};
/**
 * PhysicsComponent is a component that manages the physics simulation for an entity.
 * It provides integration with physics engines through the strategy pattern and handles
 * physics updates during the logic processing stage.
 */
export declare class PhysicsComponent extends Component {
    private __strategy?;
    private __shapeBindings;
    private __nextShapeBindingId;
    private __motion?;
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
    /** Sets properties shared by the complete rigid body and rebuilds its colliders. */
    setMotionProperty(motion: PhysicsMotionProperty): void;
    get motionProperty(): PhysicsMotionProperty | undefined;
    /**
     * Whether the rigid body is allowed to move. False means a fixed body.
     * When no motion property is set, the first shape binding's body is used.
     */
    get bodyMove(): boolean;
    /**
     * Sets whether the rigid body may move and rebuilds its colliders.
     *
     * The move flag is shared by the rigid body and every collider, so this
     * updates the motion property and all shape bindings together. A fixed body
     * clears the kinematic flag; enabling move keeps the current kinematic flag
     * when one is set, otherwise the body becomes dynamic.
     *
     * @param move - True for a movable body, false for a fixed body
     */
    setBodyMove(move: boolean): void;
    /** Adds one generic ShapeComponent instance to this physical body. */
    bindShape(binding: PhysicsShapeBinding): number;
    updateShapeBinding(bindingId: number, binding: PhysicsShapeBinding): void;
    /**
     * Removes every shape binding that references one ShapeComponent shape.
     * @param shapeComponent - ShapeComponent owning the shape
     * @param shapeIndex - Shape index referenced by the bindings
     * @returns The number of removed bindings
     */
    removeShapeBindingsForShape(shapeComponent: ShapeComponent, shapeIndex: number): number;
    removeShapeBinding(bindingId: number): boolean;
    clearShapeBindings(): void;
    rebuildShapeBindings(): void;
    get shapeBindingCount(): number;
    private __applyShapeBindingsTransaction;
    private __applyShapeBindings;
    private __applyBackendUpdate;
    private static __copyBinding;
    private __unregisterSensorBindings;
    private static __copyMotion;
    getVrmSpring(): import("../..").VRMSpring | undefined;
    /**
     * Common logic method that updates the global physics simulation.
     * This is called once per frame for all physics components and handles
     * the overall physics world update through the Rapier physics backend.
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
