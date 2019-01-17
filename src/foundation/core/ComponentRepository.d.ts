import Component from './Component';
import { ComponentConstructor } from './Component';
import EntityRepository from './EntityRepository';
export default class ComponentRepository {
    private static __instance;
    private __component_sid_count_map;
    private __components;
    static __componentClasses: Map<ComponentTID, ComponentConstructor>;
    constructor();
    static registerComponentClass(componentTID: ComponentTID, componentClass: ComponentConstructor): void;
    static unregisterComponentClass(componentTID: ComponentTID): void;
    static getInstance(): ComponentRepository;
    static getComponentClass(componentTid: ComponentTID): ComponentConstructor | undefined;
    createComponent(componentTid: ComponentTID, entityUid: EntityUID, entityRepository: EntityRepository): Component | null;
    getComponent(componentTid: ComponentTID, componentSid: ComponentSID): Component | null;
    static getMemoryBeginIndex(componentTid: ComponentTID): number;
    getComponentsWithType(componentTid: ComponentTID): Array<Component> | undefined;
    getComponentTIDs(): Array<ComponentTID>;
}
