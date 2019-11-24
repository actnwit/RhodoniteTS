import Entity from './Entity';
import Component from './Component';
import { RnTags, EntityUID, ComponentTID } from '../../types/CommonTypes';
export default class EntityRepository {
    private __entity_uid_count;
    private __entities;
    private static __instance;
    private __componentRepository;
    _components: Array<Map<ComponentTID, Component>>;
    private constructor();
    static getInstance(): EntityRepository;
    /**
     * Creates an entity which has the given types of the components
     * @param componentClasses The class objects of the components.
     */
    createEntity(componentClasses: Array<typeof Component>): Entity;
    /**
     * Add components to the entity.
     * @param componentClasses The class objects to set to the entity.
     * @param entityUid The entityUID of the entity.
     */
    addComponentsToEntity(componentClasses: Array<typeof Component>, entityUid: EntityUID): Entity;
    /**
     * Remove components from the entity.
     * @param componentClasses The class object of the components to remove.
     * @param entityUid The entityUID of the entity.
     */
    removeComponentsFromEntity(componentClasses: Array<typeof Component>, entityUid: EntityUID): Entity;
    /**
     * Gets the entity corresponding to the entityUID.
     * @param entityUid The entityUID of the entity.
     */
    getEntity(entityUid: EntityUID): Entity;
    /**
     * Gets the specified component from the entity.
     * @param entityUid The entity to get the component from.
     * @param componentType The class object of the component to get.
     */
    getComponentOfEntity(entityUid: EntityUID, componentType: typeof Component): Component | null;
    /**
     * Search entities by the given tags.
     * @param tags The tags to search
     */
    searchByTags(tags: RnTags): Entity[];
    /**
     * Gets entity by the unique name.
     * @param uniqueName The unique name of the entity.
     */
    getEntityByUniqueName(uniqueName: string): Entity | undefined;
    /**
     * @private
     * Gets all entities.
     */
    _getEntities(): Entity[];
    /**
     * Gets the number of all entities.
     */
    getEntitiesNumber(): number;
}
