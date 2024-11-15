import { IEntity } from './Entity';
import { Component } from './Component';
import { RnTags, EntityUID, ComponentTID } from '../../types/CommonTypes';
import { ComponentToComponentMethods } from '../components/ComponentTypes';
/**
 * The class that generates and manages entities.
 */
export declare class EntityRepository {
    private static __entity_uid_count;
    private static __entities;
    static _components: Array<Map<ComponentTID, Component>>;
    private static __updateCount;
    private constructor();
    /**
     * Creates an entity
     */
    static createEntity(): IEntity;
    static deleteEntity(entityUid: EntityUID): void;
    static deleteEntityRecursively(entityUid: EntityUID): void;
    static shallowCopyEntity(entity: IEntity): IEntity;
    private static __setJoints;
    static _shallowCopyEntityInner(entity: IEntity): IEntity;
    private static __handleTagData;
    /**
     * Try to add a component to the entity by componentTID.
     * @param componentTID - the componentTID
     * @param entity - the entity
     * @returns the entity added a component
     */
    static tryToAddComponentToEntityByTID(componentTID: ComponentTID, entity: IEntity): IEntity;
    /**
     * Add a Component to the entity
     * @param componentClass - a ComponentClass to add
     * @param entity - the entity
     * @returns the entity added a component
     */
    static addComponentToEntity<ComponentType extends typeof Component, EntityType extends IEntity>(componentClass: ComponentType, entity: EntityType): EntityType & ComponentToComponentMethods<ComponentType>;
    /**
     * Remove components from the entity.
     * Note: the returned entity's type will be IEntity (most basic type).
     *       You have to cast it to appropriate type later.
     * @param componentClass The class object of the component to remove.
     * @param entityUid The entityUID of the entity.
     */
    static removeComponentFromEntity(componentClass: typeof Component, entity: IEntity): IEntity;
    /**
     * Gets the entity corresponding to the entityUID.
     * @param entityUid The entityUID of the entity.
     */
    static getEntity(entityUid: EntityUID): IEntity;
    /**
     * Gets the entity corresponding to the entityUID.
     * @param entityUid The entityUID of the entity.
     */
    getEntity(entityUid: EntityUID): IEntity;
    /**
     * Gets the specified component from the entity.
     * @param entityUid The entity to get the component from.
     * @param componentType The class object of the component to get.
     */
    static getComponentOfEntity(entityUid: EntityUID, componentType: typeof Component): Component | null;
    /**
     * Search entities by the given tags.
     * @param tags The tags to search
     */
    static searchByTags(tags: RnTags): IEntity[];
    /**
     * Gets entity by the unique name.
     * @param uniqueName The unique name of the entity.
     */
    static getEntityByUniqueName(uniqueName: string): IEntity | undefined;
    /**
     * @internal
     * Gets all entities.
     */
    static _getEntities(): IEntity[];
    /**
     * Gets the number of all entities.
     */
    static getEntitiesNumber(): number;
    static get updateCount(): number;
}
export declare function applyMixins(derivedCtor: IEntity, baseCtor: any): void;
export declare function createEntity(): IEntity;
