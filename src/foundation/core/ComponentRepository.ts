import { Component } from './Component';
import { Is } from '../misc/Is';
import { EntityRepository } from './EntityRepository';
import { Config } from './Config';
import { ComponentTID, ComponentSID, EntityUID } from '../../types/CommonTypes';
import { WellKnownComponentTIDs } from '../components/WellKnownComponentTIDs';

/**
 * The class that generates and manages all kinds of components.
 */
export class ComponentRepository {
  private static __component_sid_count_map: Map<ComponentTID, number> = new Map();
  private static __components: Map<ComponentTID, Array<Component>> = new Map(); // index of array Is ComponentSID
  static __componentClasses: Map<ComponentTID, typeof Component> = new Map();
  private static __componentTIDs: Array<ComponentTID> = [];
  private static __renderingComponentTIDs: Array<ComponentTID> = [];
  constructor() {}

  /**
   * Registers the class object of the component.
   * @param componentClass A class object of the component.
   */
  public static registerComponentClass(componentClass: typeof Component) {
    const thisClass = ComponentRepository;
    thisClass.__componentClasses.set(componentClass.componentTID, componentClass);
  }

  /**
   * deregister the component.
   * @param componentTID A componentTID
   */
  public static deregisterComponentClass(componentTID: ComponentTID) {
    const thisClass = ComponentRepository;
    thisClass.__componentClasses.delete(componentTID);
  }

  /**
   * Gets the class object of the component corresponding to specified ComponentTID.
   * @param componentTid The componentTID to get the class object.
   */
  public static getComponentClass(componentTid: ComponentTID): typeof Component | undefined {
    return this.__componentClasses.get(componentTid);
  }

  /**
   * Creates an instance of the component for the entity.
   * @param componentTid The componentTID to create the instance.
   * @param entityUid The entityUID of the entity.
   * @param entityRepository the reference of the entityRepository.
   */
  public static createComponent(
    componentTid: ComponentTID,
    entityUid: EntityUID,
    entityRepository: EntityRepository
  ) {
    const thisClass = ComponentRepository;
    const componentClass = thisClass.__componentClasses.get(componentTid);
    if (Is.exist(componentClass)) {
      // Update __component_sid_count_map
      let component_sid_count = this.__component_sid_count_map.get(componentTid);
      if (Is.not.exist(component_sid_count)) {
        this.__component_sid_count_map.set(componentTid, 0);
        component_sid_count = Component.invalidComponentSID;
      }

      // check __components array whether it has undefined element
      const componentArray = this.__components.get(componentTid);
      let undefinedSid = -1;
      if (Is.exist(componentArray)) {
        for (let i = 0; i < componentArray.length; i++) {
          if (Is.not.exist(componentArray[i])) {
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
      const component = new componentClass(
        entityUid,
        componentSid,
        entityRepository,
        isReUse
      ) as Component;

      // register the component
      if (!this.__components.has(componentTid)) {
        this.__components.set(componentTid, []);
        this.__updateComponentTIDs();
      }
      const array = this.__components.get(componentTid);
      array![component.componentSID] = component;
      return component;
    } else {
      throw new Error('The Component Class object is invalid.');
    }
  }

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
   * Get the instance of the component corresponding to the component class and componentSID.
   * @param componentClass The class object to get the component.
   * @param componentSid The componentSID to get the component.
   */
  public static getComponent(componentClass: typeof Component, componentSid: ComponentSID) {
    return this.getComponentFromComponentTID(componentClass.componentTID, componentSid);
  }

  /**
   * Get the instance of the component corresponding to the componentTID and componentSID.
   * @param componentTid The componentTID to get the component.
   * @param componentSid The componentSID to get the component.
   */
  public static getComponentFromComponentTID(
    componentTid: ComponentTID,
    componentSid: ComponentSID
  ) {
    const map = this.__components.get(componentTid);
    if (map != null) {
      const component = map[componentSid];
      if (component != null) {
        return map[componentSid];
      } else {
        return undefined;
      }
    }
    return undefined;
  }

  /**
   * @internal
   * Gets an array of components corresponding to the class object of the component.
   * @param componentClass The class object of the component.
   */
  public static _getComponents(componentClass: typeof Component): Array<Component> | undefined {
    const components = this.__components.get(componentClass.componentTID);
    return components;
  }

  /**
   * @internal
   * Gets an array of components corresponding to the class object of the component (dead components included).
   * @param componentClass The class object of the component.
   */
  public static _getComponentsIncludingDead(
    componentClass: typeof Component
  ): Array<Component> | undefined {
    const components = this.__components.get(componentClass.componentTID);
    return components;
  }

  public static getMemoryBeginIndex(componentTid: ComponentTID) {
    let memoryBeginIndex = 0;
    for (let i = 0; i < componentTid; i++) {
      const componentClass = ComponentRepository.__componentClasses.get(i);
      if (componentClass != null) {
        const sizeOfComponent = (componentClass as any).sizeOfThisComponent;
        const maxEntityNumber = Config.maxEntityNumber;
        memoryBeginIndex += sizeOfComponent * maxEntityNumber;
      }
    }
    return memoryBeginIndex;
  }

  /**
   * Gets an array of components corresponding to the class object of the component.
   * @param componentType The class object of the component.
   */
  public static getComponentsWithType(componentType: typeof Component): Array<Component> {
    const components = this.__components.get(componentType.componentTID);
    if (components == null) {
      return [];
    }
    return components.filter((component) => component != null);
  }

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
   * Gets all componentTIDs.
   */
  public static getComponentTIDs(): Array<ComponentTID> {
    return this.__componentTIDs;
  }

  /**
   * Gets all rendering componentTIDs.
   */
  public static getRenderingComponentTIDs(): Array<ComponentTID> {
    return this.__renderingComponentTIDs;
  }
}
