import Component from './Component';
import {ComponentConstructor} from './Component';
import is from '../misc/IsUtil';

let singleton:any = Symbol();

export default class ComponentRepository {
  private static __singletonEnforcer: Symbol;
  private __component_sid_count_map: Map<ComponentTID, number>;
  private __components: Map<ComponentTID, Array<Component>>;
  private static __singleton: ComponentRepository;
  private static __componentClasses: Map<ComponentTID, ComponentConstructor>;


  constructor(enforcer: Symbol) {
    if (enforcer !== ComponentRepository.__singletonEnforcer || !(this instanceof ComponentRepository)) {
      throw new Error('This is a Singleton class. get the instance using \'getInstance\' static method.');
    }

    ComponentRepository.__singletonEnforcer = Symbol();

    this.__component_sid_count_map = new Map();
    this.__components = new Map;
    ComponentRepository.__componentClasses = new Map();
  }

  static registerComponentClass(componentTID: ComponentTID, componentClass: ComponentConstructor) {
    const thisClass = ComponentRepository;
    thisClass.__componentClasses.set(componentTID, componentClass);
  }

  static unregisterComponentClass(componentTID: ComponentTID) {
    const thisClass = ComponentRepository;
    thisClass.__componentClasses.delete(componentTID);
  }

  static getInstance() {
    const thisClass = ComponentRepository;
    if (!thisClass.__singleton) {
      thisClass.__singleton = new ComponentRepository(ComponentRepository.__singletonEnforcer);
    }
    return thisClass.__singleton;
  }

  createComponent(componentTID: ComponentTID) {
    const thisClass = ComponentRepository;
    const componentClass = thisClass.__componentClasses.get(componentTID);
    if (componentClass != null) {
      const component = new componentClass() as Component;
      const componentTid = (component as any).constuctor.componentTID;
      let component_sid_count = this.__component_sid_count_map.get(componentTid);

      if (!is.exist(component_sid_count)) {
        this.__component_sid_count_map.set(componentTid, 0);
        component_sid_count = 0;
      }
      this.__component_sid_count_map.set(
        componentTid,
        component_sid_count !== undefined ? ++component_sid_count : 1
      );

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
}
