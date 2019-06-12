import Entity from './Entity';
import Component from './Component';
export default class EntityRepository {
    private __entity_uid_count;
    private __entities;
    private static __instance;
    private __componentRepository;
    _components: Array<Map<ComponentTID, Component>>;
    private constructor();
    static getInstance(): EntityRepository;
    createEntity(componentClasses: Array<typeof Component>): Entity;
    addComponentsToEntity(componentClasses: Array<typeof Component>, entityUid: EntityUID): Entity;
    removeComponentsFromEntity(componentClasses: Array<typeof Component>, entityUid: EntityUID): Entity;
    getEntity(entityUid: EntityUID): Entity;
    getComponentOfEntity(entityUid: EntityUID, componentType: typeof Component): Component | null;
    searchByTags(tags: RnTags): Entity[];
    getEntityByUniqueName(uniqueName: string): Entity | undefined;
    _getEntities(): Entity[];
    getEntitiesNumber(): number;
}
