import type { ComponentSID, ComponentTID, EntityUID } from '../../types/CommonTypes';
import type { Engine } from '../system/Engine';
import type { Component } from './Component';
import type { EntityRepository } from './EntityRepository';
/**
 * The repository class that manages all component classes and their instances.
 * This class provides functionality to register component classes, create component instances,
 * and manage the lifecycle of components within the ECS (Entity-Component-System) architecture.
 */
export declare class ComponentRepository {
    private __component_sid_count_map;
    private __components;
    private static __componentClasses;
    private __componentTIDs;
    private __renderingComponentTIDs;
    static readonly invalidComponentSID = -1;
    private __engine;
    constructor(engine: Engine);
    /**
     * Registers a component class with the repository.
     * This method associates a component class with its unique ComponentTID for later instantiation.
     *
     * @param componentClass - The component class constructor to register
     * @throws {Error} If the component class is invalid or already registered
     *
     * @example
     * ```typescript
     * ComponentRepository.registerComponentClass(MyCustomComponent);
     * ```
     */
    static registerComponentClass(componentClass: typeof Component): void;
    /**
     * Unregisters a component class from the repository.
     * This removes the component class associated with the given ComponentTID.
     *
     * @param componentTID - The ComponentTID of the component class to unregister
     *
     * @example
     * ```typescript
     * ComponentRepository.deregisterComponentClass(MyComponent.componentTID);
     * ```
     */
    static deregisterComponentClass(componentTID: ComponentTID): void;
    /**
     * Retrieves the component class constructor associated with the specified ComponentTID.
     *
     * @param componentTid - The ComponentTID to look up
     * @returns The component class constructor, or undefined if not found
     *
     * @example
     * ```typescript
     * const ComponentClass = ComponentRepository.getComponentClass(componentTID);
     * if (ComponentClass) {
     *   // Use the component class
     * }
     * ```
     */
    static getComponentClass(componentTid: ComponentTID): typeof Component | undefined;
    /**
     * Creates a new component instance for the specified entity.
     * This method handles ComponentSID allocation, including reusing SIDs from deleted components.
     *
     * @param componentTid - The ComponentTID of the component type to create
     * @param entityUid - The EntityUID of the entity that will own this component
     * @param entityRepository - Reference to the entity repository for entity management
     * @returns The newly created component instance
     * @throws {Error} If the component class is not registered or invalid
     *
     * @example
     * ```typescript
     * const component = ComponentRepository.createComponent(
     *   MyComponent.componentTID,
     *   entityUID,
     *   entityRepository
     * );
     * ```
     */
    createComponent(componentTid: ComponentTID, entityUid: EntityUID, entityRepository: EntityRepository): Component;
    /**
     * Deletes a component instance from the repository.
     * This marks the component's slot as available for reuse and removes it from the active components.
     *
     * @param component - The component instance to delete
     *
     * @example
     * ```typescript
     * ComponentRepository.deleteComponent(myComponent);
     * ```
     */
    deleteComponent(component: Component): void;
    /**
     * Retrieves a specific component instance by its class and ComponentSID.
     *
     * @param componentClass - The component class to search for
     * @param componentSid - The ComponentSID of the specific component instance
     * @returns The component instance, or undefined if not found
     *
     * @example
     * ```typescript
     * const component = ComponentRepository.getComponent(MyComponent, componentSID);
     * ```
     */
    getComponent(componentClass: typeof Component, componentSid: ComponentSID): Component | undefined;
    /**
     * Retrieves a specific component instance by ComponentTID and ComponentSID.
     *
     * @param componentTid - The ComponentTID of the component type
     * @param componentSid - The ComponentSID of the specific component instance
     * @returns The component instance, or undefined if not found
     *
     * @example
     * ```typescript
     * const component = ComponentRepository.getComponentFromComponentTID(componentTID, componentSID);
     * ```
     */
    getComponentFromComponentTID(componentTid: ComponentTID, componentSid: ComponentSID): Component | undefined;
    /**
     * Gets an array of all component instances of the specified type.
     * This is an internal method that includes undefined slots in the array.
     *
     * @internal
     * @param componentClass - The component class to retrieve instances for
     * @returns Array of component instances with potential undefined elements, or undefined if type not found
     */
    _getComponents(componentClass: typeof Component): Array<Component> | undefined;
    /**
     * Gets an array of all component instances including deleted/dead components.
     * This internal method provides access to the raw component array with undefined slots.
     *
     * @internal
     * @param componentClass - The component class to retrieve instances for
     * @returns Array of component instances including dead components, or undefined if type not found
     */
    _getComponentsIncludingDead(componentClass: typeof Component): Array<Component> | undefined;
    /**
     * Retrieves all active (non-null) component instances of the specified type.
     * This method filters out deleted components and returns only valid instances.
     *
     * @param componentType - The component class to retrieve instances for
     * @returns Array of active component instances (never includes undefined elements)
     *
     * @example
     * ```typescript
     * const activeComponents = ComponentRepository.getComponentsWithType(MyComponent);
     * activeComponents.forEach(component => {
     *   // Process each active component
     * });
     * ```
     */
    getComponentsWithType(componentType: typeof Component): Array<Component>;
    /**
     * Gets an array of all component instances of the specified type.
     * This is an internal method that includes undefined slots in the array.
     *
     * @internal
     * @param componentClass - The component class to retrieve instances for
     * @returns Array of component instances with potential undefined elements, or undefined if type not found
     */
    getComponentsWithTypeWithoutFiltering(componentType: typeof Component): Array<Component | undefined>;
    /**
     * Updates the internal lists of component type IDs and rendering component type IDs.
     * This method maintains sorted arrays of ComponentTIDs for efficient iteration and processing.
     *
     * @private
     */
    private __updateComponentTIDs;
    /**
     * Retrieves all registered component type IDs in sorted order.
     * This provides access to all ComponentTIDs that have been registered with the repository.
     *
     * @returns Array of all ComponentTIDs currently registered, sorted in ascending order
     *
     * @example
     * ```typescript
     * const allComponentTIDs = ComponentRepository.getComponentTIDs();
     * console.log(`Total component types: ${allComponentTIDs.length}`);
     * ```
     */
    getComponentTIDs(): Array<ComponentTID>;
    /**
     * Retrieves all rendering-related component type IDs.
     * This returns ComponentTIDs for components that are involved in the rendering pipeline.
     *
     * @returns Array of ComponentTIDs for rendering components
     *
     * @example
     * ```typescript
     * const renderingTIDs = ComponentRepository.getRenderingComponentTIDs();
     * // Process rendering components during render loop
     * ```
     */
    getRenderingComponentTIDs(): Array<ComponentTID>;
}
