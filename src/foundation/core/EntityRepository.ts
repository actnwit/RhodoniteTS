import { IEntity, Entity } from './Entity';
import { Component } from './Component';
import { ComponentRepository } from './ComponentRepository';
import { RnTags, EntityUID, ComponentTID } from '../../types/CommonTypes';
import { valueWithCompensation } from '../misc/MiscUtil';
import { ComponentToComponentMethods } from '../components/ComponentTypes';
import { Is } from '../misc/Is';
import { WellKnownComponentTIDs } from '../components/WellKnownComponentTIDs';
import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { SkeletalComponent } from '../components/Skeletal/SkeletalComponent';
import { ISceneGraphEntity } from '../helpers';
import { Logger } from '../misc';

/**
 * The repository class responsible for creating, managing, and deleting entities within the framework.
 * Provides entity lifecycle management, component attachment, and entity querying capabilities.
 *
 * @remarks
 * This class manages entity UIDs, tracks entity relationships, and handles component associations.
 * It also provides functionality for entity copying and cleanup operations.
 */
export class EntityRepository {
  private static __entity_uid_count: number = Entity.invalidEntityUID;
  private static __entities: Array<IEntity | undefined> = [];
  static _components: Array<Map<ComponentTID, Component>> = []; // index is EntityUID
  private static __updateCount = 0;

  private constructor() {}

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
  public static createEntity(): IEntity {
    // check dead entity
    let deadUid = -1;
    for (let i = 0; i < this.__entities.length; i++) {
      if (this.__entities[i] == null) {
        deadUid = i;
      }
    }

    let entityUid = -1;
    if (deadUid === -1) {
      // if all entity is alive, issue a new entityUid
      entityUid = ++this.__entity_uid_count;
    } else {
      // if there is a dead entity, reuse the entityUid
      entityUid = deadUid;
    }

    const entity = new Entity(entityUid, true);
    this.__entities[entityUid] = entity;

    this.__updateCount++;

    return entity;
  }

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
  public static deleteEntity(entityUid: EntityUID): void {
    if (Is.not.exist(this._components[entityUid])) {
      return;
    }
    for (const [componentTid, component] of this._components[entityUid]) {
      if (componentTid === WellKnownComponentTIDs.SceneGraphComponentTID) {
        const sceneGraph = component as unknown as ISceneGraphEntity;
        const children = sceneGraph.children.concat();
        for (const child of children) {
          EntityRepository.deleteEntity(child.entity.entityUID);
        }
      }
      ComponentRepository.deleteComponent(component);
    }
    this.__entities[entityUid]?._destroy();
    delete this.__entities[entityUid];
    delete this._components[entityUid];

    this.__updateCount++;
  }

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
  public static deleteEntityRecursively(entityUid: EntityUID): void {
    const entity = this.getEntity(entityUid);
    const entities: IEntity[] = [];
    const sg = entity.tryToGetSceneGraph();
    if (sg != null) {
      entities.push(sg.entity);
      addChild(sg);
    }

    function addChild(sg: SceneGraphComponent) {
      const children = sg.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        entities.push(child.entity);
        addChild(child);
      }
    }

    for (const entity of entities) {
      EntityRepository.deleteEntity(entity.entityUID);
    }
  }

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
  public static shallowCopyEntity(entity: IEntity): IEntity {
    const newEntity = EntityRepository._shallowCopyEntityInner(entity);

    this.__setJoints(entity);
    this.__handleTagData(newEntity as unknown as Entity);

    return newEntity;
  }

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
  private static __setJoints(entity: IEntity) {
    const newEntity = EntityRepository.getEntity(entity._myLatestCopyEntityUID);
    const skeletalComponentOfNew = newEntity.getComponentByComponentTID(
      WellKnownComponentTIDs.SkeletalComponentTID
    ) as SkeletalComponent;
    const skeletalComponentOfOriginal = entity.getComponentByComponentTID(
      WellKnownComponentTIDs.SkeletalComponentTID
    ) as SkeletalComponent;
    if (Is.exist(skeletalComponentOfNew) && Is.exist(skeletalComponentOfOriginal)) {
      const jointsOriginal = skeletalComponentOfOriginal.getJoints();
      const jointsNew = jointsOriginal.map(joint => {
        return EntityRepository.getEntity(joint.entity._myLatestCopyEntityUID).tryToGetSceneGraph()!;
      });
      skeletalComponentOfNew.setJoints(jointsNew);
    }

    const sceneGraph = entity.tryToGetSceneGraph();
    if (Is.exist(sceneGraph)) {
      sceneGraph.children.forEach(child => {
        EntityRepository.__setJoints(child.entity);
      });
    }
  }

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
  static _shallowCopyEntityInner(entity: IEntity): IEntity {
    const newEntity = this.createEntity();
    (newEntity as Entity)._tags = Object.assign({}, (entity as Entity)._tags);

    entity._myLatestCopyEntityUID = newEntity.entityUID;
    for (let i = 1; i <= WellKnownComponentTIDs.maxWellKnownTidNumber; i++) {
      const component = entity.getComponentByComponentTID(i);
      if (Is.exist(component)) {
        this.tryToAddComponentToEntityByTID(i, newEntity);
        const componentOfNewEntity = newEntity.getComponentByComponentTID(i);
        if (Is.exist(componentOfNewEntity)) {
          componentOfNewEntity._shallowCopyFrom(component);
        }
      }
    }
    return newEntity;
  }

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
  private static __handleTagData(newEntity: Entity) {
    const tags = newEntity._tags;
    if (Is.exist(tags)) {
      const tagKeys = Object.keys(tags);
      for (const tagKey of tagKeys) {
        if (tagKey === 'rnEntities') {
          const entities = newEntity.getTagValue('rnEntities') as ISceneGraphEntity[];
          const newEntities = entities.map(entity => {
            return EntityRepository.getEntity(entity._myLatestCopyEntityUID);
          });
          newEntity.tryToSetTag({
            tag: 'rnEntities',
            value: newEntities,
          });
        }
        if (tagKey === 'rnEntitiesByNames') {
          const map = newEntity.getTagValue('rnEntitiesByNames') as Map<string, ISceneGraphEntity>;
          for (const name of Object.keys(map)) {
            const entity = map.get(name) as ISceneGraphEntity;
            map.set(name, EntityRepository.getEntity(entity._myLatestCopyEntityUID) as ISceneGraphEntity);
          }
          newEntity.tryToSetTag({
            tag: 'rnEntitiesByNames',
            value: map,
          });
        }
      }
    }

    const sceneGraph = newEntity.tryToGetSceneGraph();
    if (Is.exist(sceneGraph)) {
      sceneGraph.children.forEach(child => {
        EntityRepository.__handleTagData(child.entity as unknown as Entity);
      });
    }
  }

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
  public static tryToAddComponentToEntityByTID(componentTID: ComponentTID, entity: IEntity): IEntity {
    const componentClass = ComponentRepository.getComponentClass(componentTID);
    if (Is.not.exist(componentClass)) {
      return entity;
    }
    return this.addComponentToEntity(componentClass, entity);
  }

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
  public static addComponentToEntity<ComponentType extends typeof Component, EntityType extends IEntity>(
    componentClass: ComponentType,
    entity: EntityType
  ): EntityType & ComponentToComponentMethods<ComponentType> {
    if (entity.hasComponent(componentClass)) {
      Logger.info('This entity already has the Component.');
      return entity as EntityType & ComponentToComponentMethods<ComponentType>;
    }

    // Create Component
    const component = ComponentRepository.createComponent(componentClass.componentTID, entity.entityUID, this);

    // set this component to this._components' map
    const map = valueWithCompensation({
      value: this._components[entity.entityUID],
      compensation: () => {
        return (this._components[entity.entityUID] = new Map());
      },
    });
    map.set(componentClass.componentTID, component);

    // add this component to the entity
    const entityClass = component.addThisComponentToEntity(entity, componentClass);
    entity._setComponent(componentClass, component);

    this.__updateCount++;

    return entity as unknown as typeof entityClass;
  }

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
  public static removeComponentFromEntity(componentClass: typeof Component, entity: IEntity): IEntity {
    let map = this._components[entity.entityUID];
    if (map == null) {
      map = new Map();
      this._components[entity.entityUID] = map;
    }
    const component = map.get(componentClass.componentTID);
    if (Is.exist(component)) {
      component._destroy();
      map.delete(componentClass.componentTID);
      entity._removeComponent(componentClass.componentTID);
    }

    this.__updateCount++;

    return entity as IEntity;
  }

  /**
   * Retrieves an entity by its unique identifier.
   *
   * @remarks
   * This is a static method that provides access to entities by their UID.
   * The method assumes the entity exists and will throw if the entity is not found.
   *
   * @param entityUid - The unique identifier of the entity to retrieve
   * @returns The entity corresponding to the given UID
   *
   * @throws Will throw if the entity with the given UID does not exist
   *
   * @example
   * ```typescript
   * const entity = EntityRepository.getEntity(entityUID);
   * ```
   */
  public static getEntity(entityUid: EntityUID): IEntity {
    return this.__entities[entityUid]!;
  }

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
  public getEntity(entityUid: EntityUID): IEntity {
    return EntityRepository.__entities[entityUid]!;
  }

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
  public static getComponentOfEntity(entityUid: EntityUID, componentType: typeof Component): Component | null {
    const entity = this._components[entityUid];
    let component = null;
    if (entity != null) {
      component = entity.get(componentType.componentTID);
      if (component != null) {
        return component;
      } else {
        return null;
      }
    }
    return component;
  }

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
  public static searchByTags(tags: RnTags) {
    const matchEntities = [];
    for (const entity of this.__entities) {
      if (entity?.matchTags(tags)) {
        matchEntities.push(entity);
      }
    }
    return matchEntities;
  }

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
  public static getEntityByUniqueName(uniqueName: string): IEntity | undefined {
    for (const entity of this.__entities) {
      if (entity != null && entity.uniqueName === uniqueName) {
        return entity;
      }
    }
    return void 0;
  }

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
  public static _getEntities(): IEntity[] {
    return this.__entities.filter(entity => entity != null && entity!._isAlive) as IEntity[];
  }

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
  public static getEntitiesNumber(): number {
    const entities = this.__entities.filter(entity => entity != null && entity!._isAlive);
    return entities.length;
  }

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
  public static get updateCount() {
    return this.__updateCount;
  }
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
export function applyMixins(derivedCtor: IEntity, baseCtor: any) {
  Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
    Object.defineProperty(
      derivedCtor,
      name,
      Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || Object.create(null)
    );
  });
}

/**
 * Convenience function to create a new entity.
 *
 * @remarks
 * This is a simple wrapper around EntityRepository.createEntity() that provides
 * a more convenient API for entity creation without needing to reference the
 * full EntityRepository class.
 *
 * @returns A newly created entity with a unique UID
 *
 * @example
 * ```typescript
 * import { createEntity } from './EntityRepository';
 *
 * const entity = createEntity();
 * ```
 */
export function createEntity(): IEntity {
  return EntityRepository.createEntity();
}
