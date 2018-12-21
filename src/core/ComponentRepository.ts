import Component from './Component';
import {ComponentConstructor} from './Component';
import is from '../misc/IsUtil';
import InitialSetting from '../system/InitialSetting';

let singleton:any = Symbol();

export default class ComponentRepository {
  static __singletonEnforcer: Symbol;
  private __component_sid_count_map: Map<ComponentTID, number>;
  private __components: Map<ComponentTID, Array<Component>>; // index of array is ComponentSID
  static __componentClasses: Map<ComponentTID, ComponentConstructor>;


  constructor(enforcer: Symbol) {
    if (enforcer !== ComponentRepository.__singletonEnforcer || !(this instanceof ComponentRepository)) {
      throw new Error('This is a Singleton class. get the instance using \'getInstance\' static method.');
    }

    this.__component_sid_count_map = new Map();
    this.__components = new Map();
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
    if (!(thisClass as any)[singleton]) {
      (thisClass as any)[singleton] = new ComponentRepository(ComponentRepository.__singletonEnforcer);
    }
    return (thisClass as any)[singleton];
  }

  createComponent(componentTID: ComponentTID, entityUid: EntityUID) {
    const thisClass = ComponentRepository;
    const componentClass = thisClass.__componentClasses.get(componentTID);
    if (componentClass != null) {
      componentClass.setupBufferView();
      const component = new componentClass(entityUid) as Component;
      const componentTid = (component as any).constructor.componentTID;
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

  getComponent(componentTid: ComponentTID, componentSid: ComponentSID) {
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

  static getMemoryBeginIndex(componentTid: ComponentTID) {
    let memoryBeginIndex = 0;
    for (let i=0; i<componentTid; i++) {
      const componentClass = ComponentRepository.__componentClasses.get(i);
      if (componentClass != null) {
        const sizeOfComponent = (componentClass as any).sizeOfThisComponent;
        const maxEntityNumber = InitialSetting.maxEntityNumber;
        memoryBeginIndex += sizeOfComponent * maxEntityNumber;
      }
    }
    return memoryBeginIndex;
  }

  getComponentsWithType(componentTid: ComponentTID): Array<Component> | undefined {
    return this.__components.get(componentTid);
  }

  getComponentTIDs(): Array<ComponentTID> {
    const indices = [];
    for (let type of this.__components.keys()) {
      indices.push(type);
    }
    return indices;
  }
}
ComponentRepository.__componentClasses = new Map();
ComponentRepository.__singletonEnforcer = Symbol();

