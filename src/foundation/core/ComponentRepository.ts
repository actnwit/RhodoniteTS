import Component from './Component';
import is from '../misc/IsUtil';
import InitialSetting from '../system/InitialSetting';
import EntityRepository from './EntityRepository';

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

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new ComponentRepository();
    }
    return this.__instance;
  }

  static getComponentClass(componentTid: ComponentTID) {
    return this.__componentClasses.get(componentTid);
  }

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

  getComponent(componentClass: typeof Component, componentSid: ComponentSID) {
    return this.getComponentFromComponentTID(componentClass.componentTID, componentSid);
  }

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

  getComponentsWithType(componentType: typeof Component): Array<Component> | undefined {
    const components = this.__components.get(componentType.componentTID);
    const copyArray = components!;//.concat();
    //copyArray.shift();
    return copyArray;
  }

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

