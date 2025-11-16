import type { ComponentSID, ComponentTID, EntityUID } from '../../types/CommonTypes';
import { WellKnownComponentTIDs } from '../components/WellKnownComponentTIDs';
import { Is } from '../misc/Is';
import type { Component } from './Component';
import { Config } from './Config';
import type { EntityRepository } from './EntityRepository';

/**
 * The repository class that manages all component classes and their instances.
 * This class provides functionality to register component classes, create component instances,
 * and manage the lifecycle of components within the ECS (Entity-Component-System) architecture.
 */
export class ComponentRepository {
  private static __component_sid_count_map: Map<ComponentTID, number> = new Map();
  private static __components: Map<ComponentTID, Array<Component>> = new Map(); // index of array Is ComponentSID
  static __componentClasses: Map<ComponentTID, typeof Component> = new Map();
  private static __componentTIDs: Array<ComponentTID> = [];
  private static __renderingComponentTIDs: Array<ComponentTID> = [];
  static readonly invalidComponentSID = -1;

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
  public static registerComponentClass(componentClass: typeof Component) {
    const thisClass = ComponentRepository;
    thisClass.__componentClasses.set(componentClass.componentTID, componentClass);
  }

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
  public static deregisterComponentClass(componentTID: ComponentTID) {
    const thisClass = ComponentRepository;
    thisClass.__componentClasses.delete(componentTID);
  }

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
  public static getComponentClass(componentTid: ComponentTID): typeof Component | undefined {
    return this.__componentClasses.get(componentTid);
  }

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
  public static createComponent(componentTid: ComponentTID, entityUid: EntityUID, entityRepository: EntityRepository) {
    const thisClass = ComponentRepository;
    const componentClass = thisClass.__componentClasses.get(componentTid);
    if (componentClass !== undefined) {
      // Update __component_sid_count_map
      let component_sid_count = this.__component_sid_count_map.get(componentTid);
      if (component_sid_count === undefined) {
        this.__component_sid_count_map.set(componentTid, 0);
        component_sid_count = ComponentRepository.invalidComponentSID;
      }

      // check __components array whether it has undefined element
      const componentArray = this.__components.get(componentTid);
      let undefinedSid = -1;
      if (componentArray !== undefined) {
        for (let i = 0; i < componentArray.length; i++) {
          if (componentArray[i] === undefined) {
            undefinedSid = i;
            break;
          }
        }
      }

      let componentSid: ComponentSID = -1;
      let isReUse = false;
      if (undefinedSid === -1) {
        // if there is no undefined element, issue a new component_sid
        this.__component_sid_count_map.set(componentTid, ++component_sid_count);
        componentSid = component_sid_count;
      } else {
        // if there is undefined element, reuse the component_sid
        componentSid = undefinedSid;
        isReUse = true;
      }
      // create the component
      const component = new componentClass(entityUid, componentSid, entityRepository, isReUse) as Component;

      // register the component
      if (!this.__components.has(componentTid)) {
        this.__components.set(componentTid, []);
        this.__updateComponentTIDs();
      }
      const array = this.__components.get(componentTid);
      array![component.componentSID] = component;
      return component;
    }
    throw new Error('The Component Class object is invalid.');
  }

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
  public static deleteComponent(component: Component) {
    const thisClass = ComponentRepository;
    const componentTid = component.componentTID;
    const componentSid = component.componentSID;
    const array = thisClass.__components.get(componentTid);
    if (array != null) {
      delete array[componentSid];
    }
  }

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
  public static getComponent(componentClass: typeof Component, componentSid: ComponentSID) {
    return this.getComponentFromComponentTID(componentClass.componentTID, componentSid);
  }

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
  public static getComponentFromComponentTID(componentTid: ComponentTID, componentSid: ComponentSID) {
    const map = this.__components.get(componentTid);
    if (map != null) {
      const component = map[componentSid];
      if (component != null) {
        return map[componentSid];
      }
      return undefined;
    }
    return undefined;
  }

  /**
   * Gets an array of all component instances of the specified type.
   * This is an internal method that includes undefined slots in the array.
   *
   * @internal
   * @param componentClass - The component class to retrieve instances for
   * @returns Array of component instances with potential undefined elements, or undefined if type not found
   */
  public static _getComponents(componentClass: typeof Component): Array<Component> | undefined {
    const components = this.__components.get(componentClass.componentTID);
    return components;
  }

  /**
   * Gets an array of all component instances including deleted/dead components.
   * This internal method provides access to the raw component array with undefined slots.
   *
   * @internal
   * @param componentClass - The component class to retrieve instances for
   * @returns Array of component instances including dead components, or undefined if type not found
   */
  public static _getComponentsIncludingDead(componentClass: typeof Component): Array<Component> | undefined {
    const components = this.__components.get(componentClass.componentTID);
    return components;
  }

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
  public static getComponentsWithType(componentType: typeof Component): Array<Component> {
    const components = this.__components.get(componentType.componentTID);
    if (components == null) {
      return [];
    }
    return components.filter(component => component != null);
  }

  /**
   * Updates the internal lists of component type IDs and rendering component type IDs.
   * This method maintains sorted arrays of ComponentTIDs for efficient iteration and processing.
   *
   * @private
   */
  private static __updateComponentTIDs() {
    const componentTids = Array.from(this.__components.keys());
    componentTids.sort((a, b) => a - b);
    this.__componentTIDs = componentTids;

    const renderingComponentTids: ComponentTID[] = [];
    renderingComponentTids.push(WellKnownComponentTIDs.MeshRendererComponentTID); // MeshRendererComponent is always active

    if (this.__components.has(WellKnownComponentTIDs.EffekseerComponentTID)) {
      renderingComponentTids.push(WellKnownComponentTIDs.EffekseerComponentTID);
    }
    this.__renderingComponentTIDs = renderingComponentTids;
  }

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
  public static getComponentTIDs(): Array<ComponentTID> {
    return this.__componentTIDs;
  }

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
  public static getRenderingComponentTIDs(): Array<ComponentTID> {
    return this.__renderingComponentTIDs;
  }
}
