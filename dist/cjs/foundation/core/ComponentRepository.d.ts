import type { Component } from './Component';
import { EntityRepository } from './EntityRepository';
import { ComponentTID, ComponentSID, EntityUID } from '../../types/CommonTypes';
/**
 * The class that generates and manages all kinds of components.
 */
export declare class ComponentRepository {
    private static __component_sid_count_map;
    private static __components;
    static __componentClasses: Map<ComponentTID, typeof Component>;
    private static __componentTIDs;
    private static __renderingComponentTIDs;
    static readonly invalidComponentSID = -1;
    constructor();
    /**
     * Registers the class object of the component.
     * @param componentClass A class object of the component.
     */
    static registerComponentClass(componentClass: typeof Component): void;
    /**
     * deregister the component.
     * @param componentTID A componentTID
     */
    static deregisterComponentClass(componentTID: ComponentTID): void;
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
    static createComponent(componentTid: ComponentTID, entityUid: EntityUID, entityRepository: EntityRepository): Component;
    static deleteComponent(component: Component): void;
    /**
     * Get the instance of the component corresponding to the component class and componentSID.
     * @param componentClass The class object to get the component.
     * @param componentSid The componentSID to get the component.
     */
    static getComponent(componentClass: typeof Component, componentSid: ComponentSID): Component | undefined;
    /**
     * Get the instance of the component corresponding to the componentTID and componentSID.
     * @param componentTid The componentTID to get the component.
     * @param componentSid The componentSID to get the component.
     */
    static getComponentFromComponentTID(componentTid: ComponentTID, componentSid: ComponentSID): Component | undefined;
    /**
     * @internal
     * Gets an array of components corresponding to the class object of the component.
     * @param componentClass The class object of the component.
     */
    static _getComponents(componentClass: typeof Component): Array<Component> | undefined;
    /**
     * @internal
     * Gets an array of components corresponding to the class object of the component (dead components included).
     * @param componentClass The class object of the component.
     */
    static _getComponentsIncludingDead(componentClass: typeof Component): Array<Component> | undefined;
    static getMemoryBeginIndex(componentTid: ComponentTID): number;
    /**
     * Gets an array of components corresponding to the class object of the component.
     * @param componentType The class object of the component.
     */
    static getComponentsWithType(componentType: typeof Component): Array<Component>;
    private static __updateComponentTIDs;
    /**
     * Gets all componentTIDs.
     */
    static getComponentTIDs(): Array<ComponentTID>;
    /**
     * Gets all rendering componentTIDs.
     */
    static getRenderingComponentTIDs(): Array<ComponentTID>;
}
