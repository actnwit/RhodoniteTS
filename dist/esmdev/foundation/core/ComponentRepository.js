// src/foundation/core/ComponentRepository.ts
import { WellKnownComponentTIDs } from "../components/WellKnownComponentTIDs.js";
var _ComponentRepository = class _ComponentRepository {
  constructor(engine) {
    this.__component_sid_count_map = /* @__PURE__ */ new Map();
    this.__components = /* @__PURE__ */ new Map();
    this.__componentTIDs = [];
    this.__renderingComponentTIDs = [];
    this.__componentCreationCount = 0;
    this.__engine = engine;
  }
  /**
   * Number of components created in this repository so far, of any type.
   * Consumers compare it with a remembered value to detect that components were attached to entities.
   * @internal
   */
  get _componentCreationCount() {
    return this.__componentCreationCount;
  }
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
  static registerComponentClass(componentClass) {
    this.__componentClasses.set(componentClass.componentTID, componentClass);
  }
  /**
   * Registers a component class only when no class is registered for its ComponentTID yet.
   *
   * @remarks
   * Component classes are registered lazily, when they are first used, instead of by a module that
   * registers every component on import. That keeps unused components out of tree-shaken bundles.
   * A class that was registered explicitly for the same ComponentTID is kept as is.
   *
   * @param componentClass - The component class constructor to register
   * @internal
   */
  static _ensureComponentClassRegistered(componentClass) {
    if (!this.__componentClasses.has(componentClass.componentTID)) {
      this.__componentClasses.set(componentClass.componentTID, componentClass);
    }
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
  static deregisterComponentClass(componentTID) {
    this.__componentClasses.delete(componentTID);
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
  static getComponentClass(componentTid) {
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
  createComponent(componentTid, entityUid, entityRepository) {
    const componentClass = _ComponentRepository.__componentClasses.get(componentTid);
    if (componentClass !== void 0) {
      let component_sid_count = this.__component_sid_count_map.get(componentTid);
      if (component_sid_count === void 0) {
        this.__component_sid_count_map.set(componentTid, 0);
        component_sid_count = _ComponentRepository.invalidComponentSID;
      }
      const componentArray = this.__components.get(componentTid);
      let undefinedSid = -1;
      if (componentArray !== void 0) {
        for (let i = 0; i < componentArray.length; i++) {
          if (componentArray[i] === void 0) {
            undefinedSid = i;
            break;
          }
        }
      }
      let componentSid = -1;
      let isReUse = false;
      if (undefinedSid === -1) {
        this.__component_sid_count_map.set(componentTid, ++component_sid_count);
        componentSid = component_sid_count;
      } else {
        componentSid = undefinedSid;
        isReUse = true;
      }
      this.__componentCreationCount++;
      const component = new componentClass(
        this.__engine,
        entityUid,
        componentSid,
        entityRepository,
        isReUse
      );
      if (!this.__components.has(componentTid)) {
        this.__components.set(componentTid, []);
        this.__updateComponentTIDs();
      }
      const array = this.__components.get(componentTid);
      array[component.componentSID] = component;
      return component;
    }
    throw new Error("The Component Class object is invalid.");
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
  deleteComponent(component) {
    const componentTid = component.componentTID;
    const componentSid = component.componentSID;
    const array = this.__components.get(componentTid);
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
  getComponent(componentClass, componentSid) {
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
  getComponentFromComponentTID(componentTid, componentSid) {
    const map = this.__components.get(componentTid);
    if (map != null) {
      const component = map[componentSid];
      if (component != null) {
        return map[componentSid];
      }
      return void 0;
    }
    return void 0;
  }
  /**
   * Checks whether at least one live component of the given type exists.
   * This is allocation-free and is intended for hot paths such as the render
   * loop, where building a filtered component list every frame is wasteful.
   *
   * @param componentTID - The ComponentTID to check
   * @returns True if at least one live component of the type exists
   */
  hasAnyComponent(componentTID) {
    const components = this.__components.get(componentTID);
    if (components == null) {
      return false;
    }
    for (let i = 0; i < components.length; i++) {
      if (components[i] != null) {
        return true;
      }
    }
    return false;
  }
  /**
   * Counts live components of the given type without allocating a filtered
   * array. Intended for per-frame checks in the render loop.
   *
   * @param componentTID - The ComponentTID to count
   * @returns The number of live components of the type
   */
  getComponentCount(componentTID) {
    const components = this.__components.get(componentTID);
    if (components == null) {
      return 0;
    }
    let count = 0;
    for (let i = 0; i < components.length; i++) {
      if (components[i] != null) {
        count++;
      }
    }
    return count;
  }
  /**
   * Gets an array of all component instances of the specified type.
   * This is an internal method that includes undefined slots in the array.
   *
   * @internal
   * @param componentClass - The component class to retrieve instances for
   * @returns Array of component instances with potential undefined elements, or undefined if type not found
   */
  _getComponents(componentClass) {
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
  _getComponentsIncludingDead(componentClass) {
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
  getComponentsWithType(componentType) {
    return this.getComponentsWithTID(componentType.componentTID);
  }
  /**
   * Retrieves all active (non-null) component instances of the specified ComponentTID.
   *
   * @remarks
   * Unlike {@link getComponentsWithType}, this does not need the component class itself, so a module can
   * query components without importing (and bundling) their class.
   *
   * @param componentTID - The ComponentTID of the components to retrieve
   * @returns Array of active component instances (never includes undefined elements)
   */
  getComponentsWithTID(componentTID) {
    const components = this.__components.get(componentTID);
    if (components == null) {
      return [];
    }
    return components.filter((component) => component != null);
  }
  /**
   * Gets an array of all component instances of the specified type.
   * This is an internal method that includes undefined slots in the array.
   *
   * @internal
   * @param componentClass - The component class to retrieve instances for
   * @returns Array of component instances with potential undefined elements, or undefined if type not found
   */
  getComponentsWithTypeWithoutFiltering(componentType) {
    const components = this.__components.get(componentType.componentTID);
    if (components == null) {
      return [];
    }
    const componentsWithoutFiltering = [];
    for (let i = 0; i < components.length; i++) {
      componentsWithoutFiltering.push(components[i]);
    }
    return componentsWithoutFiltering;
  }
  /**
   * Updates the internal lists of component type IDs and rendering component type IDs.
   * This method maintains sorted arrays of ComponentTIDs for efficient iteration and processing.
   *
   * @private
   */
  __updateComponentTIDs() {
    const componentTids = Array.from(this.__components.keys());
    componentTids.sort((a, b) => a - b);
    this.__componentTIDs = componentTids;
    const renderingComponentTids = [];
    renderingComponentTids.push(WellKnownComponentTIDs.MeshRendererComponentTID);
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
  getComponentTIDs() {
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
  getRenderingComponentTIDs() {
    return this.__renderingComponentTIDs;
  }
};
// index of array Is ComponentSID
_ComponentRepository.__componentClasses = /* @__PURE__ */ new Map();
_ComponentRepository.invalidComponentSID = -1;
var ComponentRepository = _ComponentRepository;
export {
  ComponentRepository
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29yZS9Db21wb25lbnRSZXBvc2l0b3J5LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IENvbXBvbmVudFNJRCwgQ29tcG9uZW50VElELCBFbnRpdHlVSUQgfSBmcm9tICcuLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgeyBXZWxsS25vd25Db21wb25lbnRUSURzIH0gZnJvbSAnLi4vY29tcG9uZW50cy9XZWxsS25vd25Db21wb25lbnRUSURzJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgdHlwZSB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgRW50aXR5UmVwb3NpdG9yeSB9IGZyb20gJy4vRW50aXR5UmVwb3NpdG9yeSc7XG5cbi8qKlxuICogVGhlIHJlcG9zaXRvcnkgY2xhc3MgdGhhdCBtYW5hZ2VzIGFsbCBjb21wb25lbnQgY2xhc3NlcyBhbmQgdGhlaXIgaW5zdGFuY2VzLlxuICogVGhpcyBjbGFzcyBwcm92aWRlcyBmdW5jdGlvbmFsaXR5IHRvIHJlZ2lzdGVyIGNvbXBvbmVudCBjbGFzc2VzLCBjcmVhdGUgY29tcG9uZW50IGluc3RhbmNlcyxcbiAqIGFuZCBtYW5hZ2UgdGhlIGxpZmVjeWNsZSBvZiBjb21wb25lbnRzIHdpdGhpbiB0aGUgRUNTIChFbnRpdHktQ29tcG9uZW50LVN5c3RlbSkgYXJjaGl0ZWN0dXJlLlxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50UmVwb3NpdG9yeSB7XG4gIHByaXZhdGUgX19jb21wb25lbnRfc2lkX2NvdW50X21hcDogTWFwPENvbXBvbmVudFRJRCwgbnVtYmVyPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBfX2NvbXBvbmVudHM6IE1hcDxDb21wb25lbnRUSUQsIEFycmF5PENvbXBvbmVudD4+ID0gbmV3IE1hcCgpOyAvLyBpbmRleCBvZiBhcnJheSBJcyBDb21wb25lbnRTSURcbiAgcHJpdmF0ZSBzdGF0aWMgX19jb21wb25lbnRDbGFzc2VzOiBNYXA8Q29tcG9uZW50VElELCB0eXBlb2YgQ29tcG9uZW50PiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBfX2NvbXBvbmVudFRJRHM6IEFycmF5PENvbXBvbmVudFRJRD4gPSBbXTtcbiAgcHJpdmF0ZSBfX3JlbmRlcmluZ0NvbXBvbmVudFRJRHM6IEFycmF5PENvbXBvbmVudFRJRD4gPSBbXTtcbiAgc3RhdGljIHJlYWRvbmx5IGludmFsaWRDb21wb25lbnRTSUQgPSAtMTtcbiAgcHJpdmF0ZSBfX2VuZ2luZTogRW5naW5lO1xuICBwcml2YXRlIF9fY29tcG9uZW50Q3JlYXRpb25Db3VudCA9IDA7XG5cbiAgY29uc3RydWN0b3IoZW5naW5lOiBFbmdpbmUpIHtcbiAgICB0aGlzLl9fZW5naW5lID0gZW5naW5lO1xuICB9XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiBjb21wb25lbnRzIGNyZWF0ZWQgaW4gdGhpcyByZXBvc2l0b3J5IHNvIGZhciwgb2YgYW55IHR5cGUuXG4gICAqIENvbnN1bWVycyBjb21wYXJlIGl0IHdpdGggYSByZW1lbWJlcmVkIHZhbHVlIHRvIGRldGVjdCB0aGF0IGNvbXBvbmVudHMgd2VyZSBhdHRhY2hlZCB0byBlbnRpdGllcy5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBnZXQgX2NvbXBvbmVudENyZWF0aW9uQ291bnQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fX2NvbXBvbmVudENyZWF0aW9uQ291bnQ7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGEgY29tcG9uZW50IGNsYXNzIHdpdGggdGhlIHJlcG9zaXRvcnkuXG4gICAqIFRoaXMgbWV0aG9kIGFzc29jaWF0ZXMgYSBjb21wb25lbnQgY2xhc3Mgd2l0aCBpdHMgdW5pcXVlIENvbXBvbmVudFRJRCBmb3IgbGF0ZXIgaW5zdGFudGlhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGNvbXBvbmVudENsYXNzIC0gVGhlIGNvbXBvbmVudCBjbGFzcyBjb25zdHJ1Y3RvciB0byByZWdpc3RlclxuICAgKiBAdGhyb3dzIHtFcnJvcn0gSWYgdGhlIGNvbXBvbmVudCBjbGFzcyBpcyBpbnZhbGlkIG9yIGFscmVhZHkgcmVnaXN0ZXJlZFxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIENvbXBvbmVudFJlcG9zaXRvcnkucmVnaXN0ZXJDb21wb25lbnRDbGFzcyhNeUN1c3RvbUNvbXBvbmVudCk7XG4gICAqIGBgYFxuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZWdpc3RlckNvbXBvbmVudENsYXNzKGNvbXBvbmVudENsYXNzOiB0eXBlb2YgQ29tcG9uZW50KSB7XG4gICAgdGhpcy5fX2NvbXBvbmVudENsYXNzZXMuc2V0KGNvbXBvbmVudENsYXNzLmNvbXBvbmVudFRJRCwgY29tcG9uZW50Q2xhc3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBhIGNvbXBvbmVudCBjbGFzcyBvbmx5IHdoZW4gbm8gY2xhc3MgaXMgcmVnaXN0ZXJlZCBmb3IgaXRzIENvbXBvbmVudFRJRCB5ZXQuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIENvbXBvbmVudCBjbGFzc2VzIGFyZSByZWdpc3RlcmVkIGxhemlseSwgd2hlbiB0aGV5IGFyZSBmaXJzdCB1c2VkLCBpbnN0ZWFkIG9mIGJ5IGEgbW9kdWxlIHRoYXRcbiAgICogcmVnaXN0ZXJzIGV2ZXJ5IGNvbXBvbmVudCBvbiBpbXBvcnQuIFRoYXQga2VlcHMgdW51c2VkIGNvbXBvbmVudHMgb3V0IG9mIHRyZWUtc2hha2VuIGJ1bmRsZXMuXG4gICAqIEEgY2xhc3MgdGhhdCB3YXMgcmVnaXN0ZXJlZCBleHBsaWNpdGx5IGZvciB0aGUgc2FtZSBDb21wb25lbnRUSUQgaXMga2VwdCBhcyBpcy5cbiAgICpcbiAgICogQHBhcmFtIGNvbXBvbmVudENsYXNzIC0gVGhlIGNvbXBvbmVudCBjbGFzcyBjb25zdHJ1Y3RvciB0byByZWdpc3RlclxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgX2Vuc3VyZUNvbXBvbmVudENsYXNzUmVnaXN0ZXJlZChjb21wb25lbnRDbGFzczogdHlwZW9mIENvbXBvbmVudCkge1xuICAgIGlmICghdGhpcy5fX2NvbXBvbmVudENsYXNzZXMuaGFzKGNvbXBvbmVudENsYXNzLmNvbXBvbmVudFRJRCkpIHtcbiAgICAgIHRoaXMuX19jb21wb25lbnRDbGFzc2VzLnNldChjb21wb25lbnRDbGFzcy5jb21wb25lbnRUSUQsIGNvbXBvbmVudENsYXNzKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVW5yZWdpc3RlcnMgYSBjb21wb25lbnQgY2xhc3MgZnJvbSB0aGUgcmVwb3NpdG9yeS5cbiAgICogVGhpcyByZW1vdmVzIHRoZSBjb21wb25lbnQgY2xhc3MgYXNzb2NpYXRlZCB3aXRoIHRoZSBnaXZlbiBDb21wb25lbnRUSUQuXG4gICAqXG4gICAqIEBwYXJhbSBjb21wb25lbnRUSUQgLSBUaGUgQ29tcG9uZW50VElEIG9mIHRoZSBjb21wb25lbnQgY2xhc3MgdG8gdW5yZWdpc3RlclxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIENvbXBvbmVudFJlcG9zaXRvcnkuZGVyZWdpc3RlckNvbXBvbmVudENsYXNzKE15Q29tcG9uZW50LmNvbXBvbmVudFRJRCk7XG4gICAqIGBgYFxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBkZXJlZ2lzdGVyQ29tcG9uZW50Q2xhc3MoY29tcG9uZW50VElEOiBDb21wb25lbnRUSUQpIHtcbiAgICB0aGlzLl9fY29tcG9uZW50Q2xhc3Nlcy5kZWxldGUoY29tcG9uZW50VElEKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIGNvbXBvbmVudCBjbGFzcyBjb25zdHJ1Y3RvciBhc3NvY2lhdGVkIHdpdGggdGhlIHNwZWNpZmllZCBDb21wb25lbnRUSUQuXG4gICAqXG4gICAqIEBwYXJhbSBjb21wb25lbnRUaWQgLSBUaGUgQ29tcG9uZW50VElEIHRvIGxvb2sgdXBcbiAgICogQHJldHVybnMgVGhlIGNvbXBvbmVudCBjbGFzcyBjb25zdHJ1Y3Rvciwgb3IgdW5kZWZpbmVkIGlmIG5vdCBmb3VuZFxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IENvbXBvbmVudENsYXNzID0gQ29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnRDbGFzcyhjb21wb25lbnRUSUQpO1xuICAgKiBpZiAoQ29tcG9uZW50Q2xhc3MpIHtcbiAgICogICAvLyBVc2UgdGhlIGNvbXBvbmVudCBjbGFzc1xuICAgKiB9XG4gICAqIGBgYFxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBnZXRDb21wb25lbnRDbGFzcyhjb21wb25lbnRUaWQ6IENvbXBvbmVudFRJRCk6IHR5cGVvZiBDb21wb25lbnQgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9fY29tcG9uZW50Q2xhc3Nlcy5nZXQoY29tcG9uZW50VGlkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGNvbXBvbmVudCBpbnN0YW5jZSBmb3IgdGhlIHNwZWNpZmllZCBlbnRpdHkuXG4gICAqIFRoaXMgbWV0aG9kIGhhbmRsZXMgQ29tcG9uZW50U0lEIGFsbG9jYXRpb24sIGluY2x1ZGluZyByZXVzaW5nIFNJRHMgZnJvbSBkZWxldGVkIGNvbXBvbmVudHMuXG4gICAqXG4gICAqIEBwYXJhbSBjb21wb25lbnRUaWQgLSBUaGUgQ29tcG9uZW50VElEIG9mIHRoZSBjb21wb25lbnQgdHlwZSB0byBjcmVhdGVcbiAgICogQHBhcmFtIGVudGl0eVVpZCAtIFRoZSBFbnRpdHlVSUQgb2YgdGhlIGVudGl0eSB0aGF0IHdpbGwgb3duIHRoaXMgY29tcG9uZW50XG4gICAqIEBwYXJhbSBlbnRpdHlSZXBvc2l0b3J5IC0gUmVmZXJlbmNlIHRvIHRoZSBlbnRpdHkgcmVwb3NpdG9yeSBmb3IgZW50aXR5IG1hbmFnZW1lbnRcbiAgICogQHJldHVybnMgVGhlIG5ld2x5IGNyZWF0ZWQgY29tcG9uZW50IGluc3RhbmNlXG4gICAqIEB0aHJvd3Mge0Vycm9yfSBJZiB0aGUgY29tcG9uZW50IGNsYXNzIGlzIG5vdCByZWdpc3RlcmVkIG9yIGludmFsaWRcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBjb21wb25lbnQgPSBDb21wb25lbnRSZXBvc2l0b3J5LmNyZWF0ZUNvbXBvbmVudChcbiAgICogICBNeUNvbXBvbmVudC5jb21wb25lbnRUSUQsXG4gICAqICAgZW50aXR5VUlELFxuICAgKiAgIGVudGl0eVJlcG9zaXRvcnlcbiAgICogKTtcbiAgICogYGBgXG4gICAqL1xuICBwdWJsaWMgY3JlYXRlQ29tcG9uZW50KGNvbXBvbmVudFRpZDogQ29tcG9uZW50VElELCBlbnRpdHlVaWQ6IEVudGl0eVVJRCwgZW50aXR5UmVwb3NpdG9yeTogRW50aXR5UmVwb3NpdG9yeSkge1xuICAgIGNvbnN0IGNvbXBvbmVudENsYXNzID0gQ29tcG9uZW50UmVwb3NpdG9yeS5fX2NvbXBvbmVudENsYXNzZXMuZ2V0KGNvbXBvbmVudFRpZCk7XG4gICAgaWYgKGNvbXBvbmVudENsYXNzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIFVwZGF0ZSBfX2NvbXBvbmVudF9zaWRfY291bnRfbWFwXG4gICAgICBsZXQgY29tcG9uZW50X3NpZF9jb3VudCA9IHRoaXMuX19jb21wb25lbnRfc2lkX2NvdW50X21hcC5nZXQoY29tcG9uZW50VGlkKTtcbiAgICAgIGlmIChjb21wb25lbnRfc2lkX2NvdW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5fX2NvbXBvbmVudF9zaWRfY291bnRfbWFwLnNldChjb21wb25lbnRUaWQsIDApO1xuICAgICAgICBjb21wb25lbnRfc2lkX2NvdW50ID0gQ29tcG9uZW50UmVwb3NpdG9yeS5pbnZhbGlkQ29tcG9uZW50U0lEO1xuICAgICAgfVxuXG4gICAgICAvLyBjaGVjayBfX2NvbXBvbmVudHMgYXJyYXkgd2hldGhlciBpdCBoYXMgdW5kZWZpbmVkIGVsZW1lbnRcbiAgICAgIGNvbnN0IGNvbXBvbmVudEFycmF5ID0gdGhpcy5fX2NvbXBvbmVudHMuZ2V0KGNvbXBvbmVudFRpZCk7XG4gICAgICBsZXQgdW5kZWZpbmVkU2lkID0gLTE7XG4gICAgICBpZiAoY29tcG9uZW50QXJyYXkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudEFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKGNvbXBvbmVudEFycmF5W2ldID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHVuZGVmaW5lZFNpZCA9IGk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbGV0IGNvbXBvbmVudFNpZDogQ29tcG9uZW50U0lEID0gLTE7XG4gICAgICBsZXQgaXNSZVVzZSA9IGZhbHNlO1xuICAgICAgaWYgKHVuZGVmaW5lZFNpZCA9PT0gLTEpIHtcbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgbm8gdW5kZWZpbmVkIGVsZW1lbnQsIGlzc3VlIGEgbmV3IGNvbXBvbmVudF9zaWRcbiAgICAgICAgdGhpcy5fX2NvbXBvbmVudF9zaWRfY291bnRfbWFwLnNldChjb21wb25lbnRUaWQsICsrY29tcG9uZW50X3NpZF9jb3VudCk7XG4gICAgICAgIGNvbXBvbmVudFNpZCA9IGNvbXBvbmVudF9zaWRfY291bnQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBpZiB0aGVyZSBpcyB1bmRlZmluZWQgZWxlbWVudCwgcmV1c2UgdGhlIGNvbXBvbmVudF9zaWRcbiAgICAgICAgY29tcG9uZW50U2lkID0gdW5kZWZpbmVkU2lkO1xuICAgICAgICBpc1JlVXNlID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX19jb21wb25lbnRDcmVhdGlvbkNvdW50Kys7XG4gICAgICAvLyBjcmVhdGUgdGhlIGNvbXBvbmVudFxuICAgICAgY29uc3QgY29tcG9uZW50ID0gbmV3IGNvbXBvbmVudENsYXNzKFxuICAgICAgICB0aGlzLl9fZW5naW5lLFxuICAgICAgICBlbnRpdHlVaWQsXG4gICAgICAgIGNvbXBvbmVudFNpZCxcbiAgICAgICAgZW50aXR5UmVwb3NpdG9yeSxcbiAgICAgICAgaXNSZVVzZVxuICAgICAgKSBhcyBDb21wb25lbnQ7XG5cbiAgICAgIC8vIHJlZ2lzdGVyIHRoZSBjb21wb25lbnRcbiAgICAgIGlmICghdGhpcy5fX2NvbXBvbmVudHMuaGFzKGNvbXBvbmVudFRpZCkpIHtcbiAgICAgICAgdGhpcy5fX2NvbXBvbmVudHMuc2V0KGNvbXBvbmVudFRpZCwgW10pO1xuICAgICAgICB0aGlzLl9fdXBkYXRlQ29tcG9uZW50VElEcygpO1xuICAgICAgfVxuICAgICAgY29uc3QgYXJyYXkgPSB0aGlzLl9fY29tcG9uZW50cy5nZXQoY29tcG9uZW50VGlkKTtcbiAgICAgIGFycmF5IVtjb21wb25lbnQuY29tcG9uZW50U0lEXSA9IGNvbXBvbmVudDtcbiAgICAgIHJldHVybiBjb21wb25lbnQ7XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcignVGhlIENvbXBvbmVudCBDbGFzcyBvYmplY3QgaXMgaW52YWxpZC4nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGVzIGEgY29tcG9uZW50IGluc3RhbmNlIGZyb20gdGhlIHJlcG9zaXRvcnkuXG4gICAqIFRoaXMgbWFya3MgdGhlIGNvbXBvbmVudCdzIHNsb3QgYXMgYXZhaWxhYmxlIGZvciByZXVzZSBhbmQgcmVtb3ZlcyBpdCBmcm9tIHRoZSBhY3RpdmUgY29tcG9uZW50cy5cbiAgICpcbiAgICogQHBhcmFtIGNvbXBvbmVudCAtIFRoZSBjb21wb25lbnQgaW5zdGFuY2UgdG8gZGVsZXRlXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogQ29tcG9uZW50UmVwb3NpdG9yeS5kZWxldGVDb21wb25lbnQobXlDb21wb25lbnQpO1xuICAgKiBgYGBcbiAgICovXG4gIHB1YmxpYyBkZWxldGVDb21wb25lbnQoY29tcG9uZW50OiBDb21wb25lbnQpIHtcbiAgICBjb25zdCBjb21wb25lbnRUaWQgPSBjb21wb25lbnQuY29tcG9uZW50VElEO1xuICAgIGNvbnN0IGNvbXBvbmVudFNpZCA9IGNvbXBvbmVudC5jb21wb25lbnRTSUQ7XG4gICAgY29uc3QgYXJyYXkgPSB0aGlzLl9fY29tcG9uZW50cy5nZXQoY29tcG9uZW50VGlkKTtcbiAgICBpZiAoYXJyYXkgIT0gbnVsbCkge1xuICAgICAgZGVsZXRlIGFycmF5W2NvbXBvbmVudFNpZF07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhIHNwZWNpZmljIGNvbXBvbmVudCBpbnN0YW5jZSBieSBpdHMgY2xhc3MgYW5kIENvbXBvbmVudFNJRC5cbiAgICpcbiAgICogQHBhcmFtIGNvbXBvbmVudENsYXNzIC0gVGhlIGNvbXBvbmVudCBjbGFzcyB0byBzZWFyY2ggZm9yXG4gICAqIEBwYXJhbSBjb21wb25lbnRTaWQgLSBUaGUgQ29tcG9uZW50U0lEIG9mIHRoZSBzcGVjaWZpYyBjb21wb25lbnQgaW5zdGFuY2VcbiAgICogQHJldHVybnMgVGhlIGNvbXBvbmVudCBpbnN0YW5jZSwgb3IgdW5kZWZpbmVkIGlmIG5vdCBmb3VuZFxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IGNvbXBvbmVudCA9IENvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50KE15Q29tcG9uZW50LCBjb21wb25lbnRTSUQpO1xuICAgKiBgYGBcbiAgICovXG4gIHB1YmxpYyBnZXRDb21wb25lbnQoY29tcG9uZW50Q2xhc3M6IHR5cGVvZiBDb21wb25lbnQsIGNvbXBvbmVudFNpZDogQ29tcG9uZW50U0lEKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0Q29tcG9uZW50RnJvbUNvbXBvbmVudFRJRChjb21wb25lbnRDbGFzcy5jb21wb25lbnRUSUQsIGNvbXBvbmVudFNpZCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGEgc3BlY2lmaWMgY29tcG9uZW50IGluc3RhbmNlIGJ5IENvbXBvbmVudFRJRCBhbmQgQ29tcG9uZW50U0lELlxuICAgKlxuICAgKiBAcGFyYW0gY29tcG9uZW50VGlkIC0gVGhlIENvbXBvbmVudFRJRCBvZiB0aGUgY29tcG9uZW50IHR5cGVcbiAgICogQHBhcmFtIGNvbXBvbmVudFNpZCAtIFRoZSBDb21wb25lbnRTSUQgb2YgdGhlIHNwZWNpZmljIGNvbXBvbmVudCBpbnN0YW5jZVxuICAgKiBAcmV0dXJucyBUaGUgY29tcG9uZW50IGluc3RhbmNlLCBvciB1bmRlZmluZWQgaWYgbm90IGZvdW5kXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgY29tcG9uZW50ID0gQ29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnRGcm9tQ29tcG9uZW50VElEKGNvbXBvbmVudFRJRCwgY29tcG9uZW50U0lEKTtcbiAgICogYGBgXG4gICAqL1xuICBwdWJsaWMgZ2V0Q29tcG9uZW50RnJvbUNvbXBvbmVudFRJRChjb21wb25lbnRUaWQ6IENvbXBvbmVudFRJRCwgY29tcG9uZW50U2lkOiBDb21wb25lbnRTSUQpIHtcbiAgICBjb25zdCBtYXAgPSB0aGlzLl9fY29tcG9uZW50cy5nZXQoY29tcG9uZW50VGlkKTtcbiAgICBpZiAobWFwICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudCA9IG1hcFtjb21wb25lbnRTaWRdO1xuICAgICAgaWYgKGNvbXBvbmVudCAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiBtYXBbY29tcG9uZW50U2lkXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgYXQgbGVhc3Qgb25lIGxpdmUgY29tcG9uZW50IG9mIHRoZSBnaXZlbiB0eXBlIGV4aXN0cy5cbiAgICogVGhpcyBpcyBhbGxvY2F0aW9uLWZyZWUgYW5kIGlzIGludGVuZGVkIGZvciBob3QgcGF0aHMgc3VjaCBhcyB0aGUgcmVuZGVyXG4gICAqIGxvb3AsIHdoZXJlIGJ1aWxkaW5nIGEgZmlsdGVyZWQgY29tcG9uZW50IGxpc3QgZXZlcnkgZnJhbWUgaXMgd2FzdGVmdWwuXG4gICAqXG4gICAqIEBwYXJhbSBjb21wb25lbnRUSUQgLSBUaGUgQ29tcG9uZW50VElEIHRvIGNoZWNrXG4gICAqIEByZXR1cm5zIFRydWUgaWYgYXQgbGVhc3Qgb25lIGxpdmUgY29tcG9uZW50IG9mIHRoZSB0eXBlIGV4aXN0c1xuICAgKi9cbiAgcHVibGljIGhhc0FueUNvbXBvbmVudChjb21wb25lbnRUSUQ6IENvbXBvbmVudFRJRCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGNvbXBvbmVudHMgPSB0aGlzLl9fY29tcG9uZW50cy5nZXQoY29tcG9uZW50VElEKTtcbiAgICBpZiAoY29tcG9uZW50cyA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGNvbXBvbmVudHNbaV0gIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIENvdW50cyBsaXZlIGNvbXBvbmVudHMgb2YgdGhlIGdpdmVuIHR5cGUgd2l0aG91dCBhbGxvY2F0aW5nIGEgZmlsdGVyZWRcbiAgICogYXJyYXkuIEludGVuZGVkIGZvciBwZXItZnJhbWUgY2hlY2tzIGluIHRoZSByZW5kZXIgbG9vcC5cbiAgICpcbiAgICogQHBhcmFtIGNvbXBvbmVudFRJRCAtIFRoZSBDb21wb25lbnRUSUQgdG8gY291bnRcbiAgICogQHJldHVybnMgVGhlIG51bWJlciBvZiBsaXZlIGNvbXBvbmVudHMgb2YgdGhlIHR5cGVcbiAgICovXG4gIHB1YmxpYyBnZXRDb21wb25lbnRDb3VudChjb21wb25lbnRUSUQ6IENvbXBvbmVudFRJRCk6IG51bWJlciB7XG4gICAgY29uc3QgY29tcG9uZW50cyA9IHRoaXMuX19jb21wb25lbnRzLmdldChjb21wb25lbnRUSUQpO1xuICAgIGlmIChjb21wb25lbnRzID09IG51bGwpIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBsZXQgY291bnQgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGNvbXBvbmVudHNbaV0gIT0gbnVsbCkge1xuICAgICAgICBjb3VudCsrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY291bnQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhbiBhcnJheSBvZiBhbGwgY29tcG9uZW50IGluc3RhbmNlcyBvZiB0aGUgc3BlY2lmaWVkIHR5cGUuXG4gICAqIFRoaXMgaXMgYW4gaW50ZXJuYWwgbWV0aG9kIHRoYXQgaW5jbHVkZXMgdW5kZWZpbmVkIHNsb3RzIGluIHRoZSBhcnJheS5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqIEBwYXJhbSBjb21wb25lbnRDbGFzcyAtIFRoZSBjb21wb25lbnQgY2xhc3MgdG8gcmV0cmlldmUgaW5zdGFuY2VzIGZvclxuICAgKiBAcmV0dXJucyBBcnJheSBvZiBjb21wb25lbnQgaW5zdGFuY2VzIHdpdGggcG90ZW50aWFsIHVuZGVmaW5lZCBlbGVtZW50cywgb3IgdW5kZWZpbmVkIGlmIHR5cGUgbm90IGZvdW5kXG4gICAqL1xuICBwdWJsaWMgX2dldENvbXBvbmVudHMoY29tcG9uZW50Q2xhc3M6IHR5cGVvZiBDb21wb25lbnQpOiBBcnJheTxDb21wb25lbnQ+IHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBjb21wb25lbnRzID0gdGhpcy5fX2NvbXBvbmVudHMuZ2V0KGNvbXBvbmVudENsYXNzLmNvbXBvbmVudFRJRCk7XG4gICAgcmV0dXJuIGNvbXBvbmVudHM7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhbiBhcnJheSBvZiBhbGwgY29tcG9uZW50IGluc3RhbmNlcyBpbmNsdWRpbmcgZGVsZXRlZC9kZWFkIGNvbXBvbmVudHMuXG4gICAqIFRoaXMgaW50ZXJuYWwgbWV0aG9kIHByb3ZpZGVzIGFjY2VzcyB0byB0aGUgcmF3IGNvbXBvbmVudCBhcnJheSB3aXRoIHVuZGVmaW5lZCBzbG90cy5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqIEBwYXJhbSBjb21wb25lbnRDbGFzcyAtIFRoZSBjb21wb25lbnQgY2xhc3MgdG8gcmV0cmlldmUgaW5zdGFuY2VzIGZvclxuICAgKiBAcmV0dXJucyBBcnJheSBvZiBjb21wb25lbnQgaW5zdGFuY2VzIGluY2x1ZGluZyBkZWFkIGNvbXBvbmVudHMsIG9yIHVuZGVmaW5lZCBpZiB0eXBlIG5vdCBmb3VuZFxuICAgKi9cbiAgcHVibGljIF9nZXRDb21wb25lbnRzSW5jbHVkaW5nRGVhZChjb21wb25lbnRDbGFzczogdHlwZW9mIENvbXBvbmVudCk6IEFycmF5PENvbXBvbmVudD4gfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGNvbXBvbmVudHMgPSB0aGlzLl9fY29tcG9uZW50cy5nZXQoY29tcG9uZW50Q2xhc3MuY29tcG9uZW50VElEKTtcbiAgICByZXR1cm4gY29tcG9uZW50cztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYWxsIGFjdGl2ZSAobm9uLW51bGwpIGNvbXBvbmVudCBpbnN0YW5jZXMgb2YgdGhlIHNwZWNpZmllZCB0eXBlLlxuICAgKiBUaGlzIG1ldGhvZCBmaWx0ZXJzIG91dCBkZWxldGVkIGNvbXBvbmVudHMgYW5kIHJldHVybnMgb25seSB2YWxpZCBpbnN0YW5jZXMuXG4gICAqXG4gICAqIEBwYXJhbSBjb21wb25lbnRUeXBlIC0gVGhlIGNvbXBvbmVudCBjbGFzcyB0byByZXRyaWV2ZSBpbnN0YW5jZXMgZm9yXG4gICAqIEByZXR1cm5zIEFycmF5IG9mIGFjdGl2ZSBjb21wb25lbnQgaW5zdGFuY2VzIChuZXZlciBpbmNsdWRlcyB1bmRlZmluZWQgZWxlbWVudHMpXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgYWN0aXZlQ29tcG9uZW50cyA9IENvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50c1dpdGhUeXBlKE15Q29tcG9uZW50KTtcbiAgICogYWN0aXZlQ29tcG9uZW50cy5mb3JFYWNoKGNvbXBvbmVudCA9PiB7XG4gICAqICAgLy8gUHJvY2VzcyBlYWNoIGFjdGl2ZSBjb21wb25lbnRcbiAgICogfSk7XG4gICAqIGBgYFxuICAgKi9cbiAgcHVibGljIGdldENvbXBvbmVudHNXaXRoVHlwZShjb21wb25lbnRUeXBlOiB0eXBlb2YgQ29tcG9uZW50KTogQXJyYXk8Q29tcG9uZW50PiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0Q29tcG9uZW50c1dpdGhUSUQoY29tcG9uZW50VHlwZS5jb21wb25lbnRUSUQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhbGwgYWN0aXZlIChub24tbnVsbCkgY29tcG9uZW50IGluc3RhbmNlcyBvZiB0aGUgc3BlY2lmaWVkIENvbXBvbmVudFRJRC5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVW5saWtlIHtAbGluayBnZXRDb21wb25lbnRzV2l0aFR5cGV9LCB0aGlzIGRvZXMgbm90IG5lZWQgdGhlIGNvbXBvbmVudCBjbGFzcyBpdHNlbGYsIHNvIGEgbW9kdWxlIGNhblxuICAgKiBxdWVyeSBjb21wb25lbnRzIHdpdGhvdXQgaW1wb3J0aW5nIChhbmQgYnVuZGxpbmcpIHRoZWlyIGNsYXNzLlxuICAgKlxuICAgKiBAcGFyYW0gY29tcG9uZW50VElEIC0gVGhlIENvbXBvbmVudFRJRCBvZiB0aGUgY29tcG9uZW50cyB0byByZXRyaWV2ZVxuICAgKiBAcmV0dXJucyBBcnJheSBvZiBhY3RpdmUgY29tcG9uZW50IGluc3RhbmNlcyAobmV2ZXIgaW5jbHVkZXMgdW5kZWZpbmVkIGVsZW1lbnRzKVxuICAgKi9cbiAgcHVibGljIGdldENvbXBvbmVudHNXaXRoVElEKGNvbXBvbmVudFRJRDogQ29tcG9uZW50VElEKTogQXJyYXk8Q29tcG9uZW50PiB7XG4gICAgY29uc3QgY29tcG9uZW50cyA9IHRoaXMuX19jb21wb25lbnRzLmdldChjb21wb25lbnRUSUQpO1xuICAgIGlmIChjb21wb25lbnRzID09IG51bGwpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBvbmVudHMuZmlsdGVyKGNvbXBvbmVudCA9PiBjb21wb25lbnQgIT0gbnVsbCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhbiBhcnJheSBvZiBhbGwgY29tcG9uZW50IGluc3RhbmNlcyBvZiB0aGUgc3BlY2lmaWVkIHR5cGUuXG4gICAqIFRoaXMgaXMgYW4gaW50ZXJuYWwgbWV0aG9kIHRoYXQgaW5jbHVkZXMgdW5kZWZpbmVkIHNsb3RzIGluIHRoZSBhcnJheS5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqIEBwYXJhbSBjb21wb25lbnRDbGFzcyAtIFRoZSBjb21wb25lbnQgY2xhc3MgdG8gcmV0cmlldmUgaW5zdGFuY2VzIGZvclxuICAgKiBAcmV0dXJucyBBcnJheSBvZiBjb21wb25lbnQgaW5zdGFuY2VzIHdpdGggcG90ZW50aWFsIHVuZGVmaW5lZCBlbGVtZW50cywgb3IgdW5kZWZpbmVkIGlmIHR5cGUgbm90IGZvdW5kXG4gICAqL1xuICBwdWJsaWMgZ2V0Q29tcG9uZW50c1dpdGhUeXBlV2l0aG91dEZpbHRlcmluZyhjb21wb25lbnRUeXBlOiB0eXBlb2YgQ29tcG9uZW50KTogQXJyYXk8Q29tcG9uZW50IHwgdW5kZWZpbmVkPiB7XG4gICAgY29uc3QgY29tcG9uZW50cyA9IHRoaXMuX19jb21wb25lbnRzLmdldChjb21wb25lbnRUeXBlLmNvbXBvbmVudFRJRCk7XG4gICAgaWYgKGNvbXBvbmVudHMgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBjb25zdCBjb21wb25lbnRzV2l0aG91dEZpbHRlcmluZzogQXJyYXk8Q29tcG9uZW50IHwgdW5kZWZpbmVkPiA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29tcG9uZW50c1dpdGhvdXRGaWx0ZXJpbmcucHVzaChjb21wb25lbnRzW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBvbmVudHNXaXRob3V0RmlsdGVyaW5nO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGludGVybmFsIGxpc3RzIG9mIGNvbXBvbmVudCB0eXBlIElEcyBhbmQgcmVuZGVyaW5nIGNvbXBvbmVudCB0eXBlIElEcy5cbiAgICogVGhpcyBtZXRob2QgbWFpbnRhaW5zIHNvcnRlZCBhcnJheXMgb2YgQ29tcG9uZW50VElEcyBmb3IgZWZmaWNpZW50IGl0ZXJhdGlvbiBhbmQgcHJvY2Vzc2luZy5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgX191cGRhdGVDb21wb25lbnRUSURzKCkge1xuICAgIGNvbnN0IGNvbXBvbmVudFRpZHMgPSBBcnJheS5mcm9tKHRoaXMuX19jb21wb25lbnRzLmtleXMoKSk7XG4gICAgY29tcG9uZW50VGlkcy5zb3J0KChhLCBiKSA9PiBhIC0gYik7XG4gICAgdGhpcy5fX2NvbXBvbmVudFRJRHMgPSBjb21wb25lbnRUaWRzO1xuXG4gICAgY29uc3QgcmVuZGVyaW5nQ29tcG9uZW50VGlkczogQ29tcG9uZW50VElEW10gPSBbXTtcbiAgICByZW5kZXJpbmdDb21wb25lbnRUaWRzLnB1c2goV2VsbEtub3duQ29tcG9uZW50VElEcy5NZXNoUmVuZGVyZXJDb21wb25lbnRUSUQpOyAvLyBNZXNoUmVuZGVyZXJDb21wb25lbnQgaXMgYWx3YXlzIGFjdGl2ZVxuXG4gICAgaWYgKHRoaXMuX19jb21wb25lbnRzLmhhcyhXZWxsS25vd25Db21wb25lbnRUSURzLkVmZmVrc2VlckNvbXBvbmVudFRJRCkpIHtcbiAgICAgIHJlbmRlcmluZ0NvbXBvbmVudFRpZHMucHVzaChXZWxsS25vd25Db21wb25lbnRUSURzLkVmZmVrc2VlckNvbXBvbmVudFRJRCk7XG4gICAgfVxuICAgIHRoaXMuX19yZW5kZXJpbmdDb21wb25lbnRUSURzID0gcmVuZGVyaW5nQ29tcG9uZW50VGlkcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYWxsIHJlZ2lzdGVyZWQgY29tcG9uZW50IHR5cGUgSURzIGluIHNvcnRlZCBvcmRlci5cbiAgICogVGhpcyBwcm92aWRlcyBhY2Nlc3MgdG8gYWxsIENvbXBvbmVudFRJRHMgdGhhdCBoYXZlIGJlZW4gcmVnaXN0ZXJlZCB3aXRoIHRoZSByZXBvc2l0b3J5LlxuICAgKlxuICAgKiBAcmV0dXJucyBBcnJheSBvZiBhbGwgQ29tcG9uZW50VElEcyBjdXJyZW50bHkgcmVnaXN0ZXJlZCwgc29ydGVkIGluIGFzY2VuZGluZyBvcmRlclxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IGFsbENvbXBvbmVudFRJRHMgPSBDb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudFRJRHMoKTtcbiAgICogY29uc29sZS5sb2coYFRvdGFsIGNvbXBvbmVudCB0eXBlczogJHthbGxDb21wb25lbnRUSURzLmxlbmd0aH1gKTtcbiAgICogYGBgXG4gICAqL1xuICBwdWJsaWMgZ2V0Q29tcG9uZW50VElEcygpOiBBcnJheTxDb21wb25lbnRUSUQ+IHtcbiAgICByZXR1cm4gdGhpcy5fX2NvbXBvbmVudFRJRHM7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGFsbCByZW5kZXJpbmctcmVsYXRlZCBjb21wb25lbnQgdHlwZSBJRHMuXG4gICAqIFRoaXMgcmV0dXJucyBDb21wb25lbnRUSURzIGZvciBjb21wb25lbnRzIHRoYXQgYXJlIGludm9sdmVkIGluIHRoZSByZW5kZXJpbmcgcGlwZWxpbmUuXG4gICAqXG4gICAqIEByZXR1cm5zIEFycmF5IG9mIENvbXBvbmVudFRJRHMgZm9yIHJlbmRlcmluZyBjb21wb25lbnRzXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgcmVuZGVyaW5nVElEcyA9IENvbXBvbmVudFJlcG9zaXRvcnkuZ2V0UmVuZGVyaW5nQ29tcG9uZW50VElEcygpO1xuICAgKiAvLyBQcm9jZXNzIHJlbmRlcmluZyBjb21wb25lbnRzIGR1cmluZyByZW5kZXIgbG9vcFxuICAgKiBgYGBcbiAgICovXG4gIHB1YmxpYyBnZXRSZW5kZXJpbmdDb21wb25lbnRUSURzKCk6IEFycmF5PENvbXBvbmVudFRJRD4ge1xuICAgIHJldHVybiB0aGlzLl9fcmVuZGVyaW5nQ29tcG9uZW50VElEcztcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsOEJBQThCO0FBVWhDLElBQU0sdUJBQU4sTUFBTSxxQkFBb0I7QUFBQSxFQVUvQixZQUFZLFFBQWdCO0FBVDVCLFNBQVEsNEJBQXVELG9CQUFJLElBQUk7QUFDdkUsU0FBUSxlQUFvRCxvQkFBSSxJQUFJO0FBRXBFLFNBQVEsa0JBQXVDLENBQUM7QUFDaEQsU0FBUSwyQkFBZ0QsQ0FBQztBQUd6RCxTQUFRLDJCQUEyQjtBQUdqQyxTQUFLLFdBQVc7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQUksMEJBQWtDO0FBQ3BDLFdBQU8sS0FBSztBQUFBLEVBQ2Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWNBLE9BQWMsdUJBQXVCLGdCQUFrQztBQUNyRSxTQUFLLG1CQUFtQixJQUFJLGVBQWUsY0FBYyxjQUFjO0FBQUEsRUFDekU7QUFB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
