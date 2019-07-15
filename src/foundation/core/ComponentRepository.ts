import Component from './Component';
import is from '../misc/IsUtil';
import EntityRepository from './EntityRepository';
import Config from './Config';
import { ComponentTID, ComponentSID, EntityUID } from '../../types/CommonTypes';

/**
 * The class that generates and manages all kinds of components.
 */
export default class ComponentRepository {
  private static __instance: ComponentRepository;
  private __component_sid_count_map: Map<ComponentTID, number>;
  private __components: Map<ComponentTID, Array<Component>>; // index of array is ComponentSID
  static __componentClasses: Map<ComponentTID, typeof Component> = new Map();


  constructor() {
    this.__component_sid_count_map = new Map();
    this.__components = new Map();
  }

  static registerComponentClass(componentClass: typeof Component) {
    const thisClass = ComponentRepository;
    thisClass.__componentClasses.set(componentClass.componentTID, componentClass);
  }

  static unregisterComponentClass(componentTID: ComponentTID) {
    const thisClass = ComponentRepository;
    thisClass.__componentClasses.delete(componentTID);
  }

  /**
   * Gets the singleton instance of the ComponentRepository.
   */
  static getInstance() {
    if (!this.__instance) {
      this.__instance = new ComponentRepository();
    }
    return this.__instance;
  }

  /**
   * Gets the class object of the component corresponding to specified ComponentTID.
   * @param componentTid The componentTID to get the class object.
   */
  static getComponentClass(componentTid: ComponentTID) {
    return this.__componentClasses.get(componentTid);
  }

  /**
   * Creates an instance of the component for the entity.
   * @param componentTid The componentTID to create the instance.
   * @param entityUid The entityUID of the entity.
   * @param entityRepository the reference of the entityRepository.
   */
  createComponent(componentTid: ComponentTID, entityUid: EntityUID, entityRepository: EntityRepository) {
    const thisClass = ComponentRepository;
    const componentClass = thisClass.__componentClasses.get(componentTid);
    if (componentClass != null) {

      let component_sid_count = this.__component_sid_count_map.get(componentTid);
      if (!is.exist(component_sid_count)) {
        this.__component_sid_count_map.set(componentTid, 0);
        component_sid_count = Component.invalidComponentSID;
      }
      this.__component_sid_count_map.set(
        componentTid,
        ++component_sid_count!
      );

      const component = new componentClass(entityUid, component_sid_count!, entityRepository) as Component;

      if (!this.__components.has(componentTid)) {
        this.__components.set(componentTid, []);
      }
      const array = this.__components.get(componentTid);
      if (array != null) {
        array[component.componentSID] = component;
        return component;
      }
    }
    return null;
  }

  /**
   * Get the instance of the component corresponding to the component class and componentSID.
   * @param componentClass The class object to get the component.
   * @param componentSid The componentSID to get the component.
   */
  getComponent(componentClass: typeof Component, componentSid: ComponentSID) {
    return this.getComponentFromComponentTID(componentClass.componentTID, componentSid);
  }

  /**
   * Get the instance of the component corresponding to the componentTID and componentSID.
   * @param componentTid The componentTID to get the component.
   * @param componentSid The componentSID to get the component.
   */
  getComponentFromComponentTID(componentTid: ComponentTID, componentSid: ComponentSID) {
    const map = this.__components.get(componentTid);
    if (map != null) {
      const component = map[componentSid];
      if (component != null) {
        return map[componentSid]
      } else {
        return null;
      }
    }
    return null;
  }

  /**
   * @private
   * Gets an array of components corresponding to the class object of the component.
   * @param componentClass The class object of the component.
   */
  _getComponents(componentClass: typeof Component): Array<Component>|undefined {
    return this.__components.get(componentClass.componentTID);
  }

  static getMemoryBeginIndex(componentTid: ComponentTID) {
    let memoryBeginIndex = 0;
    for (let i=0; i<componentTid; i++) {
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
  getComponentsWithType(componentType: typeof Component): Array<Component> {
    const components = this.__components.get(componentType.componentTID);
    if (components == null) {
      return [];
    }
    return components;
  }

  /**
   * Gets all componentTIDs.
   */
  getComponentTIDs(): Array<ComponentTID> {
    const indices = [];
    for (let type of this.__components.keys()) {
      indices.push(type);
    }
    indices.sort(function(a,b){
      if( a < b ) return -1;
      if( a > b ) return 1;
      return 0;
    });
    return indices;
  }
}

