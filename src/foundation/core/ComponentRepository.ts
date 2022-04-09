import Component from './Component';
import {Is} from '../misc/Is';
import EntityRepository from './EntityRepository';
import Config from './Config';
import {ComponentTID, ComponentSID, EntityUID} from '../../types/CommonTypes';

/**
 * The class that generates and manages all kinds of components.
 */
export default class ComponentRepository {
  private static __component_sid_count_map: Map<ComponentTID, number> =
    new Map();
  private static __components: Map<ComponentTID, Array<Component>> = new Map(); // index of array Is ComponentSID
  static __componentClasses: Map<ComponentTID, typeof Component> = new Map();

  constructor() {}

  public static registerComponentClass(componentClass: typeof Component) {
    const thisClass = ComponentRepository;
    thisClass.__componentClasses.set(
      componentClass.componentTID,
      componentClass
    );
  }

  public static unregisterComponentClass(componentTID: ComponentTID) {
    const thisClass = ComponentRepository;
    thisClass.__componentClasses.delete(componentTID);
  }

  /**
   * Gets the class object of the component corresponding to specified ComponentTID.
   * @param componentTid The componentTID to get the class object.
   */
  public static getComponentClass(componentTid: ComponentTID) {
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
      let component_sid_count =
        this.__component_sid_count_map.get(componentTid);
      if (Is.not.exist(component_sid_count)) {
        this.__component_sid_count_map.set(componentTid, 0);
        component_sid_count = Component.invalidComponentSID;
      }
      this.__component_sid_count_map.set(componentTid, ++component_sid_count!);

      // create the component
      const component = new componentClass(
        entityUid,
        component_sid_count!,
        entityRepository
      ) as Component;

      // register the component
      if (!this.__components.has(componentTid)) {
        this.__components.set(componentTid, []);
      }
      const array = this.__components.get(componentTid);
      array![component.componentSID] = component;
      return component;
    } else {
      throw new Error('The Component Class object is invalid.');
    }
  }

  /**
   * Get the instance of the component corresponding to the component class and componentSID.
   * @param componentClass The class object to get the component.
   * @param componentSid The componentSID to get the component.
   */
  public static getComponent(
    componentClass: typeof Component,
    componentSid: ComponentSID
  ) {
    return this.getComponentFromComponentTID(
      componentClass.componentTID,
      componentSid
    );
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
   * @private
   * Gets an array of components corresponding to the class object of the component.
   * @param componentClass The class object of the component.
   */
  public static _getComponents(
    componentClass: typeof Component
  ): Array<Component> | undefined {
    const components = this.__components.get(componentClass.componentTID);
    return components?.filter(component => component._isAlive);
  }

  /**
   * @private
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
  public static getComponentsWithType(
    componentType: typeof Component
  ): Array<Component> {
    const components = this.__components.get(componentType.componentTID);
    if (components == null) {
      return [];
    }
    return components.filter(component => component._isAlive);
  }

  /**
   * Gets all componentTIDs.
   */
  public static getComponentTIDs(): Array<ComponentTID> {
    const componentTids = Array.from(this.__components.keys());
    componentTids.sort();
    return componentTids;
  }
}
