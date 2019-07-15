import Component from './Component';
import EntityRepository from './EntityRepository';
import { ComponentTID, ComponentSID, EntityUID } from '../../types/CommonTypes';
/**
 * The class that generates and manages all kinds of components.
 */
export default class ComponentRepository {
    private static __instance;
    private __component_sid_count_map;
    private __components;
    static __componentClasses: Map<ComponentTID, typeof Component>;
    constructor();
    static registerComponentClass(componentClass: typeof Component): void;
    static unregisterComponentClass(componentTID: ComponentTID): void;
    /**
     * Gets the singleton instance of the ComponentRepository.
     */
    static getInstance(): ComponentRepository;
    /**
     * Gets the class object of the component corresponding to specified ComponentTID.
     * @param componentTid The componentTID to get the class object.
     */
    static getComponentClass(componentTid: ComponentTID): typeof Component | undefined;
    /**
     * Creates an instance of the component for the entity.
     * @param componentTid The componentTID to create the instance.
     * @param entityUid The entityUID of the entity.
     * @param entityRepository the reference of the entityRepository.
     */
    createComponent(componentTid: ComponentTID, entityUid: EntityUID, entityRepository: EntityRepository): Component | null;
    /**
     * Get the instance of the component corresponding to the component class and componentSID.
     * @param componentClass The class object to get the component.
     * @param componentSid The componentSID to get the component.
     */
    getComponent(componentClass: typeof Component, componentSid: ComponentSID): Component | null;
    /**
     * Get the instance of the component corresponding to the componentTID and componentSID.
     * @param componentTid The componentTID to get the component.
     * @param componentSid The componentSID to get the component.
     */
    getComponentFromComponentTID(componentTid: ComponentTID, componentSid: ComponentSID): Component | null;
    /**
     * @private
     * Gets an array of components corresponding to the class object of the component.
     * @param componentClass The class object of the component.
     */
    _getComponents(componentClass: typeof Component): Array<Component> | undefined;
    static getMemoryBeginIndex(componentTid: ComponentTID): number;
    /**
     * Gets an array of components corresponding to the class object of the component.
     * @param componentType The class object of the component.
     */
    getComponentsWithType(componentType: typeof Component): Array<Component>;
    /**
     * Gets all componentTIDs.
     */
    getComponentTIDs(): Array<ComponentTID>;
}
