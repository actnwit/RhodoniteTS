import type { ComponentTID, EntityUID, RnTags } from '../../types/CommonTypes';
import type { ComponentToComponentMethods } from '../components/ComponentTypes';
import type { Engine } from '../system/Engine';
import type { Component } from './Component';
import { type IEntity } from './Entity';
/**
 * The repository class responsible for creating, managing, and deleting entities within the framework.
 * Provides entity lifecycle management, component attachment, and entity querying capabilities.
 *
 * @remarks
 * This class manages entity UIDs, tracks entity relationships, and handles component associations.
 * It also provides functionality for entity copying and cleanup operations.
 */
export declare class EntityRepository {
    private __engine;
    private __entity_uid_count;
    private __entities;
    _components: Array<Map<ComponentTID, Component>>;
    private static __updateCount;
    constructor(engine: Engine);
    /**
     * Creates a new entity with a unique entity UID.
     *
     * @remarks
     * This method attempts to reuse UIDs from previously deleted entities to optimize memory usage.
     * If no dead entities exist, it generates a new UID by incrementing the counter.
     *
     * @returns A newly created entity with a unique UID
     *
     * @example
     * ```typescript
     * const entity = EntityRepository.createEntity();
     * console.log(entity.entityUID); // Output: unique entity ID
     * ```
     */
    createEntity(): IEntity;
    /**
     * Deletes an entity and all its associated components.
     *
     * @remarks
     * When deleting an entity with a SceneGraph component, this method automatically
     * deletes all child entities recursively to maintain scene graph integrity.
     *
     * @param entityUid - The unique identifier of the entity to delete
     *
     * @example
     * ```typescript
     * const entity = EntityRepository.createEntity();
     * EntityRepository.deleteEntity(entity.entityUID);
     * ```
     */
    deleteEntity(entityUid: EntityUID): void;
    /**
     * Recursively deletes an entity and all its descendant entities in the scene graph hierarchy.
     *
     * @remarks
     * This method traverses the entire scene graph tree starting from the specified entity
     * and deletes all entities in the hierarchy. Use this when you want to remove an entire
     * subtree from the scene graph.
     *
     * @param entityUid - The unique identifier of the root entity to delete recursively
     *
     * @example
     * ```typescript
     * // Delete a parent entity and all its children
     * EntityRepository.deleteEntityRecursively(parentEntity.entityUID);
     * ```
     */
    deleteEntityRecursively(entityUid: EntityUID): void;
    /**
     * Creates a shallow copy of an entity, including all its components and tag data.
     *
     * @remarks
     * This method performs a shallow copy of the entity, its components, and handles
     * special cases like skeletal joints and tag references. The original entity's
     * `_myLatestCopyEntityUID` will be updated to reference the new entity.
     *
     * @param entity - The entity to shallow copy
     * @returns A new entity that is a shallow copy of the input entity
     *
     * @example
     * ```typescript
     * const originalEntity = EntityRepository.createEntity();
     * const copiedEntity = EntityRepository.shallowCopyEntity(originalEntity);
     * ```
     */
    shallowCopyEntity(entity: IEntity): IEntity;
    /**
     * Sets up joint relationships for SkeletalComponent entities after copying.
     *
     * @remarks
     * This is an internal method used during entity copying to ensure that skeletal
     * joint references are properly updated to point to the copied entities rather
     * than the original entities.
     *
     * @internal
     * @param entity - The original entity whose joints need to be set up in the copy
     */
    private __setJoints;
    /**
     * Internal method that performs the core shallow copying logic for an entity.
     *
     * @remarks
     * This method creates a new entity, copies tags, and shallow copies all components
     * from the original entity. It processes all well-known component types.
     *
     * @internal
     * @param entity - The entity to shallow copy
     * @returns A new entity that is a shallow copy of the input entity
     */
    _shallowCopyEntityInner(entity: IEntity): IEntity;
    /**
     * Handles special tag data processing during entity copying operations.
     *
     * @remarks
     * This method processes special tags like 'rnEntities' and 'rnEntitiesByNames'
     * to ensure that entity references within tags are updated to point to copied
     * entities rather than original entities.
     *
     * @internal
     * @param newEntity - The newly copied entity whose tag data needs processing
     */
    private __handleTagData;
    /**
     * Attempts to add a component to an entity using the component's type ID.
     *
     * @remarks
     * This method looks up the component class by its TID and adds it to the entity
     * if the component class exists. If the component class is not found, the entity
     * is returned unchanged.
     *
     * @param componentTID - The component type identifier
     * @param entity - The entity to add the component to
     * @returns The entity (possibly with the new component added)
     *
     * @example
     * ```typescript
     * const entity = EntityRepository.createEntity();
     * EntityRepository.tryToAddComponentToEntityByTID(
     *   WellKnownComponentTIDs.TransformComponentTID,
     *   entity
     * );
     * ```
     */
    tryToAddComponentToEntityByTID(componentTID: ComponentTID, entity: IEntity): IEntity;
    /**
     * Adds a specific component class to an entity and returns the enhanced entity.
     *
     * @remarks
     * This method creates a new component instance, associates it with the entity,
     * and returns the entity with enhanced type information that includes the
     * component's methods. If the entity already has this component, a warning
     * is logged and the entity is returned unchanged.
     *
     * @template ComponentType - The component class type
     * @template EntityType - The entity type
     * @param componentClass - The component class to instantiate and add
     * @param entity - The entity to add the component to
     * @returns The entity enhanced with the component's methods
     *
     * @example
     * ```typescript
     * const entity = EntityRepository.createEntity();
     * const enhancedEntity = EntityRepository.addComponentToEntity(
     *   TransformComponent,
     *   entity
     * );
     * // enhancedEntity now has transform-related methods
     * ```
     */
    addComponentToEntity<ComponentType extends typeof Component, EntityType extends IEntity>(componentClass: ComponentType, entity: EntityType): EntityType & ComponentToComponentMethods<ComponentType>;
    /**
     * Removes a component from an entity and cleans up associated resources.
     *
     * @remarks
     * This method removes the specified component from the entity, calls the component's
     * destroy method, and returns the entity with basic IEntity typing. You may need
     * to cast the returned entity to the appropriate type after component removal.
     *
     * @param componentClass - The component class to remove
     * @param entity - The entity to remove the component from
     * @returns The entity with the component removed (typed as IEntity)
     *
     * @example
     * ```typescript
     * const entity = EntityRepository.createEntity();
     * // Add and later remove a component
     * EntityRepository.removeComponentFromEntity(TransformComponent, entity);
     * ```
     */
    removeComponentFromEntity(componentClass: typeof Component, entity: IEntity): IEntity;
    /**
     * Instance method to retrieve an entity by its unique identifier.
     *
     * @remarks
     * This is an instance method equivalent of the static getEntity method.
     * Useful when working with EntityRepository instances.
     *
     * @param entityUid - The unique identifier of the entity to retrieve
     * @returns The entity corresponding to the given UID
     *
     * @throws Will throw if the entity with the given UID does not exist
     */
    getEntity(entityUid: EntityUID): IEntity;
    /**
     * Retrieves a specific component from an entity.
     *
     * @remarks
     * This method looks up a component of the specified type from the given entity.
     * Returns null if the entity doesn't exist or doesn't have the requested component.
     *
     * @param entityUid - The unique identifier of the entity
     * @param componentType - The component class to retrieve
     * @returns The component instance if found, null otherwise
     *
     * @example
     * ```typescript
     * const transform = EntityRepository.getComponentOfEntity(
     *   entityUID,
     *   TransformComponent
     * );
     * if (transform) {
     *   // Use the transform component
     * }
     * ```
     */
    getComponentOfEntity(entityUid: EntityUID, componentType: typeof Component): Component | null;
    /**
     * Searches for entities that match all of the specified tags.
     *
     * @remarks
     * This method performs a tag-based search across all entities in the repository.
     * Only entities that match ALL provided tags will be included in the results.
     *
     * @param tags - The tags to search for (all must match)
     * @returns Array of entities that match all specified tags
     *
     * @example
     * ```typescript
     * const entities = EntityRepository.searchByTags({
     *   category: 'weapon',
     *   type: 'sword'
     * });
     * ```
     */
    searchByTags(tags: RnTags): IEntity[];
    /**
     * Retrieves an entity by its unique name identifier.
     *
     * @remarks
     * This method searches through all entities to find one with the specified
     * unique name. Returns undefined if no entity with that name is found.
     *
     * @param uniqueName - The unique name of the entity to find
     * @returns The entity with the specified unique name, or undefined if not found
     *
     * @example
     * ```typescript
     * const player = EntityRepository.getEntityByUniqueName('Player');
     * if (player) {
     *   // Found the player entity
     * }
     * ```
     */
    getEntityByUniqueName(uniqueName: string): IEntity | undefined;
    /**
     * Gets all currently alive entities in the repository.
     *
     * @remarks
     * This method returns a filtered array containing only entities that are
     * not null and are marked as alive. This is an internal method used for
     * repository management and debugging.
     *
     * @internal
     * @returns Array of all alive entities
     */
    _getEntities(): IEntity[];
    /**
     * Gets the total count of currently alive entities.
     *
     * @remarks
     * This method counts only entities that are not null and are marked as alive.
     * Useful for performance monitoring and debugging entity lifecycle issues.
     *
     * @returns The number of currently alive entities
     *
     * @example
     * ```typescript
     * console.log(`Active entities: ${EntityRepository.getEntitiesNumber()}`);
     * ```
     */
    getEntitiesNumber(): number;
    /**
     * Gets the current update count for the entity repository.
     *
     * @remarks
     * This counter increments whenever entities are created, deleted, or have
     * components added/removed. Useful for tracking repository state changes
     * and implementing cache invalidation strategies.
     *
     * @returns The current update count
     */
    static get updateCount(): number;
    get engine(): Engine;
}
/**
 * Applies mixin functionality to enhance an entity with additional capabilities.
 *
 * @remarks
 * This utility function copies all property descriptors from a base constructor's
 * prototype to the derived entity instance. Used internally for entity enhancement
 * when components are added.
 *
 * @param derivedCtor - The entity instance to enhance
 * @param baseCtor - The constructor whose prototype methods to copy
 *
 * @internal
 */
export declare function applyMixins(derivedCtor: IEntity, baseCtor: any): void;
