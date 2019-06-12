import Component from './Component';
import EntityRepository from './EntityRepository';
export default class ComponentRepository {
    private static __instance;
    private __component_sid_count_map;
    private __components;
    static __componentClasses: Map<ComponentTID, typeof Component>;
    constructor();
    static registerComponentClass(componentClass: typeof Component): void;
    static unregisterComponentClass(componentTID: ComponentTID): void;
    static getInstance(): ComponentRepository;
    static getComponentClass(componentTid: ComponentTID): typeof Component | undefined;
    createComponent(componentTid: ComponentTID, entityUid: EntityUID, entityRepository: EntityRepository): Component | null;
    getComponent(componentClass: typeof Component, componentSid: ComponentSID): Component | null;
    getComponentFromComponentTID(componentTid: ComponentTID, componentSid: ComponentSID): Component | null;
    static getMemoryBeginIndex(componentTid: ComponentTID): number;
    getComponentsWithType(componentType: typeof Component): Array<Component>;
    getComponentTIDs(): Array<ComponentTID>;
}
