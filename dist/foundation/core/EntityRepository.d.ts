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
    createEntity(componentTidArray: Array<ComponentTID>): Entity;
    getEntity(entityUid: EntityUID): Entity;
    getComponentOfEntity(entityUid: EntityUID, componentTid: ComponentTID): Component | null;
    _getEntities(): Entity[];
}
