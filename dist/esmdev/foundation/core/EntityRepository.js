// src/foundation/core/EntityRepository.ts
import { WellKnownComponentTIDs } from "../components/WellKnownComponentTIDs.js";
import { Logger } from "../misc/index.js";
import { Is } from "../misc/Is.js";
import { valueWithCompensation } from "../misc/MiscUtil.js";
import { ComponentRepository } from "./ComponentRepository.js";
import { Entity } from "./Entity.js";
var _EntityRepository = class _EntityRepository {
  constructor(engine) {
    this.aj = Entity.invalidEntityUID;
    this.Zi = [];
    this._components = [];
    this.c = engine;
  }
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
  createEntity() {
    let deadUid = -1;
    for (let i = 0; i < this.Zi.length; i++) {
      if (this.Zi[i] == null) {
        deadUid = i;
      }
    }
    let entityUid = -1;
    if (deadUid === -1) {
      entityUid = ++this.aj;
    } else {
      entityUid = deadUid;
    }
    const entity = new Entity(this.c, entityUid, true);
    this.Zi[entityUid] = entity;
    _EntityRepository.ia++;
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
  deleteEntity(entityUid) {
    var _a;
    if (Is.not.exist(this._components[entityUid])) {
      return;
    }
    for (const [componentTid, component] of this._components[entityUid]) {
      if (componentTid === WellKnownComponentTIDs.SceneGraphComponentTID) {
        const sceneGraph = component;
        const children = sceneGraph.children.concat();
        for (const child of children) {
          this.deleteEntity(child.entity.entityUID);
        }
      }
      this.c.componentRepository.deleteComponent(component);
    }
    (_a = this.Zi[entityUid]) == null ? void 0 : _a._destroy();
    delete this.Zi[entityUid];
    delete this._components[entityUid];
    _EntityRepository.ia++;
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
  deleteEntityRecursively(entityUid) {
    const entity = this.getEntity(entityUid);
    const entities = [];
    const sg = entity.tryToGetSceneGraph();
    if (sg != null) {
      entities.push(sg.entity);
      addChild(sg);
    }
    function addChild(sg2) {
      const children = sg2.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        entities.push(child.entity);
        addChild(child);
      }
    }
    for (const entity2 of entities) {
      this.deleteEntity(entity2.entityUID);
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
  shallowCopyEntity(entity) {
    const newEntity = this._shallowCopyEntityInner(entity);
    this._i(entity);
    this.$i(newEntity);
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
  _i(entity) {
    const newEntity = this.getEntity(entity._myLatestCopyEntityUID);
    if (Is.not.exist(newEntity)) {
      return;
    }
    const skeletalComponentOfNew = newEntity.getComponentByComponentTID(
      WellKnownComponentTIDs.SkeletalComponentTID
    );
    const skeletalComponentOfOriginal = entity.getComponentByComponentTID(
      WellKnownComponentTIDs.SkeletalComponentTID
    );
    if (Is.exist(skeletalComponentOfNew) && Is.exist(skeletalComponentOfOriginal)) {
      const jointsOriginal = skeletalComponentOfOriginal.getJoints();
      if (jointsOriginal.length > 0) {
        const remappedJoints = [];
        for (const joint of jointsOriginal) {
          const copiedJointEntity = this.getEntity(joint.entity._myLatestCopyEntityUID);
          const copiedJointSceneGraph = copiedJointEntity == null ? void 0 : copiedJointEntity.tryToGetSceneGraph();
          if (Is.exist(copiedJointSceneGraph)) {
            remappedJoints.push(copiedJointSceneGraph);
          }
        }
        if (remappedJoints.length === jointsOriginal.length) {
          skeletalComponentOfNew.updateJointsLightweight(remappedJoints);
        }
        const originalTop = skeletalComponentOfOriginal.topOfJointsHierarchy;
        if (Is.exist(originalTop)) {
          const copiedTopEntity = this.getEntity(originalTop.entity._myLatestCopyEntityUID);
          const copiedTopSceneGraph = copiedTopEntity == null ? void 0 : copiedTopEntity.tryToGetSceneGraph();
          if (Is.exist(copiedTopSceneGraph)) {
            skeletalComponentOfNew.topOfJointsHierarchy = copiedTopSceneGraph;
          }
        }
      }
    }
    const sceneGraph = entity.tryToGetSceneGraph();
    if (Is.exist(sceneGraph)) {
      sceneGraph.children.forEach((child) => {
        this._i(child.entity);
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
  _shallowCopyEntityInner(entity) {
    const newEntity = this.createEntity();
    newEntity._tags = Object.assign({}, entity._tags);
    entity._myLatestCopyEntityUID = newEntity.entityUID;
    for (let i = 1; i <= WellKnownComponentTIDs.maxWellKnownTidNumber; i++) {
      const component = entity.getComponentByComponentTID(i);
      if (Is.exist(component)) {
        this.addComponentToEntity(component.constructor, newEntity);
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
  $i(newEntity) {
    const tags = newEntity._tags;
    if (Is.exist(tags)) {
      const tagKeys = Object.keys(tags);
      for (const tagKey of tagKeys) {
        if (tagKey === "rnEntities") {
          const entities = newEntity.getTagValue("rnEntities");
          const newEntities = entities.map((entity) => {
            return this.getEntity(entity._myLatestCopyEntityUID);
          });
          newEntity.tryToSetTag({
            tag: "rnEntities",
            value: newEntities
          });
        }
        if (tagKey === "rnEntitiesByNames") {
          const map = newEntity.getTagValue("rnEntitiesByNames");
          for (const name of Object.keys(map)) {
            const entity = map.get(name);
            map.set(name, this.getEntity(entity._myLatestCopyEntityUID));
          }
          newEntity.tryToSetTag({
            tag: "rnEntitiesByNames",
            value: map
          });
        }
      }
    }
    const sceneGraph = newEntity.tryToGetSceneGraph();
    if (Is.exist(sceneGraph)) {
      sceneGraph.children.forEach((child) => {
        this.$i(child.entity);
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
   * Component classes are registered when they are first added with {@link addComponentToEntity}
   * (or explicitly with `ComponentRepository.registerComponentClass`), not when the library is
   * imported. Prefer {@link addComponentToEntity} with the component class, which always works.
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
  tryToAddComponentToEntityByTID(componentTID, entity) {
    const componentClass = ComponentRepository.getComponentClass(componentTID);
    if (Is.not.exist(componentClass)) {
      Logger.default.warn(
        `The component class of ComponentTID ${componentTID} is not registered yet. Use addComponentToEntity() with the component class, or register it with ComponentRepository.registerComponentClass().`
      );
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
  addComponentToEntity(componentClass, entity) {
    if (entity.hasComponent(componentClass)) {
      Logger.default.info("This entity already has the Component.");
      return entity;
    }
    ComponentRepository._ensureComponentClassRegistered(componentClass);
    const component = this.c.componentRepository.createComponent(
      componentClass.componentTID,
      entity.entityUID,
      this
    );
    const map = valueWithCompensation({
      value: this._components[entity.entityUID],
      compensation: () => {
        this._components[entity.entityUID] = /* @__PURE__ */ new Map();
        return this._components[entity.entityUID];
      }
    });
    map.set(componentClass.componentTID, component);
    const entityClass = component.addThisComponentToEntity(entity, componentClass);
    entity._setComponent(componentClass, component);
    if (componentClass.componentTID === WellKnownComponentTIDs.PhysicsComponentTID || componentClass.componentTID === WellKnownComponentTIDs.SceneGraphComponentTID) {
      const sceneGraph = entity.tryToGetSceneGraph();
      if (sceneGraph !== void 0 && entity.tryToGetPhysics() !== void 0) {
        sceneGraph._onPhysicsComponentAdded();
      }
    }
    _EntityRepository.ia++;
    return entity;
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
  removeComponentFromEntity(componentClass, entity) {
    var _a;
    let map = this._components[entity.entityUID];
    if (map == null) {
      map = /* @__PURE__ */ new Map();
      this._components[entity.entityUID] = map;
    }
    const component = map.get(componentClass.componentTID);
    if (Is.exist(component)) {
      component._destroy();
      if (componentClass.componentTID === WellKnownComponentTIDs.PhysicsComponentTID) {
        (_a = entity.tryToGetSceneGraph()) == null ? void 0 : _a._onPhysicsComponentRemoved();
      }
      map.delete(componentClass.componentTID);
      entity._removeComponent(componentClass.componentTID);
    }
    _EntityRepository.ia++;
    return entity;
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
  getEntity(entityUid) {
    return this.Zi[entityUid];
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
  getComponentOfEntity(entityUid, componentType) {
    const entity = this._components[entityUid];
    let component = null;
    if (entity != null) {
      component = entity.get(componentType.componentTID);
      if (component != null) {
        return component;
      }
      return null;
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
  searchByTags(tags) {
    const matchEntities = [];
    for (const entity of this.Zi) {
      if (entity == null ? void 0 : entity.matchTags(tags)) {
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
  getEntityByUniqueName(uniqueName) {
    for (const entity of this.Zi) {
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
  _getEntities() {
    return this.Zi.filter((entity) => entity != null && entity._isAlive);
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
  getEntitiesNumber() {
    const entities = this.Zi.filter((entity) => entity != null && entity._isAlive);
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
  static get updateCount() {
    return this.ia;
  }
  get engine() {
    return this.c;
  }
};
// index is EntityUID
_EntityRepository.ia = 0;
var EntityRepository = _EntityRepository;
function applyMixins(derivedCtor, baseCtor) {
  Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
    Object.defineProperty(
      derivedCtor,
      name,
      Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || /* @__PURE__ */ Object.create(null)
    );
  });
}
export {
  EntityRepository,
  applyMixins
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29yZS9FbnRpdHlSZXBvc2l0b3J5LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IENvbXBvbmVudFRJRCwgRW50aXR5VUlELCBSblRhZ3MgfSBmcm9tICcuLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgdHlwZSB7IENvbXBvbmVudFRvQ29tcG9uZW50TWV0aG9kcyB9IGZyb20gJy4uL2NvbXBvbmVudHMvQ29tcG9uZW50VHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBTY2VuZUdyYXBoQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9TY2VuZUdyYXBoL1NjZW5lR3JhcGhDb21wb25lbnQnO1xuaW1wb3J0IHR5cGUgeyBTa2VsZXRhbENvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvU2tlbGV0YWwvU2tlbGV0YWxDb21wb25lbnQnO1xuaW1wb3J0IHsgV2VsbEtub3duQ29tcG9uZW50VElEcyB9IGZyb20gJy4uL2NvbXBvbmVudHMvV2VsbEtub3duQ29tcG9uZW50VElEcyc7XG5pbXBvcnQgdHlwZSB7IElTY2VuZUdyYXBoRW50aXR5IH0gZnJvbSAnLi4vaGVscGVycyc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuLi9taXNjJztcbmltcG9ydCB7IElzIH0gZnJvbSAnLi4vbWlzYy9Jcyc7XG5pbXBvcnQgeyB2YWx1ZVdpdGhDb21wZW5zYXRpb24gfSBmcm9tICcuLi9taXNjL01pc2NVdGlsJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgdHlwZSB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcbmltcG9ydCB7IENvbXBvbmVudFJlcG9zaXRvcnkgfSBmcm9tICcuL0NvbXBvbmVudFJlcG9zaXRvcnknO1xuaW1wb3J0IHsgRW50aXR5LCB0eXBlIElFbnRpdHkgfSBmcm9tICcuL0VudGl0eSc7XG5cbi8qKlxuICogVGhlIHJlcG9zaXRvcnkgY2xhc3MgcmVzcG9uc2libGUgZm9yIGNyZWF0aW5nLCBtYW5hZ2luZywgYW5kIGRlbGV0aW5nIGVudGl0aWVzIHdpdGhpbiB0aGUgZnJhbWV3b3JrLlxuICogUHJvdmlkZXMgZW50aXR5IGxpZmVjeWNsZSBtYW5hZ2VtZW50LCBjb21wb25lbnQgYXR0YWNobWVudCwgYW5kIGVudGl0eSBxdWVyeWluZyBjYXBhYmlsaXRpZXMuXG4gKlxuICogQHJlbWFya3NcbiAqIFRoaXMgY2xhc3MgbWFuYWdlcyBlbnRpdHkgVUlEcywgdHJhY2tzIGVudGl0eSByZWxhdGlvbnNoaXBzLCBhbmQgaGFuZGxlcyBjb21wb25lbnQgYXNzb2NpYXRpb25zLlxuICogSXQgYWxzbyBwcm92aWRlcyBmdW5jdGlvbmFsaXR5IGZvciBlbnRpdHkgY29weWluZyBhbmQgY2xlYW51cCBvcGVyYXRpb25zLlxuICovXG5leHBvcnQgY2xhc3MgRW50aXR5UmVwb3NpdG9yeSB7XG4gIHByaXZhdGUgX19lbmdpbmU6IEVuZ2luZTtcbiAgcHJpdmF0ZSBfX2VudGl0eV91aWRfY291bnQ6IG51bWJlciA9IEVudGl0eS5pbnZhbGlkRW50aXR5VUlEO1xuICBwcml2YXRlIF9fZW50aXRpZXM6IEFycmF5PElFbnRpdHkgfCB1bmRlZmluZWQ+ID0gW107XG4gIF9jb21wb25lbnRzOiBBcnJheTxNYXA8Q29tcG9uZW50VElELCBDb21wb25lbnQ+PiA9IFtdOyAvLyBpbmRleCBpcyBFbnRpdHlVSURcbiAgcHJpdmF0ZSBzdGF0aWMgX191cGRhdGVDb3VudCA9IDA7XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yKGVuZ2luZTogRW5naW5lKSB7XG4gICAgdGhpcy5fX2VuZ2luZSA9IGVuZ2luZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGVudGl0eSB3aXRoIGEgdW5pcXVlIGVudGl0eSBVSUQuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIGF0dGVtcHRzIHRvIHJldXNlIFVJRHMgZnJvbSBwcmV2aW91c2x5IGRlbGV0ZWQgZW50aXRpZXMgdG8gb3B0aW1pemUgbWVtb3J5IHVzYWdlLlxuICAgKiBJZiBubyBkZWFkIGVudGl0aWVzIGV4aXN0LCBpdCBnZW5lcmF0ZXMgYSBuZXcgVUlEIGJ5IGluY3JlbWVudGluZyB0aGUgY291bnRlci5cbiAgICpcbiAgICogQHJldHVybnMgQSBuZXdseSBjcmVhdGVkIGVudGl0eSB3aXRoIGEgdW5pcXVlIFVJRFxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IGVudGl0eSA9IEVudGl0eVJlcG9zaXRvcnkuY3JlYXRlRW50aXR5KCk7XG4gICAqIGNvbnNvbGUubG9nKGVudGl0eS5lbnRpdHlVSUQpOyAvLyBPdXRwdXQ6IHVuaXF1ZSBlbnRpdHkgSURcbiAgICogYGBgXG4gICAqL1xuICBwdWJsaWMgY3JlYXRlRW50aXR5KCk6IElFbnRpdHkge1xuICAgIC8vIGNoZWNrIGRlYWQgZW50aXR5XG4gICAgbGV0IGRlYWRVaWQgPSAtMTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX19lbnRpdGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMuX19lbnRpdGllc1tpXSA9PSBudWxsKSB7XG4gICAgICAgIGRlYWRVaWQgPSBpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBlbnRpdHlVaWQgPSAtMTtcbiAgICBpZiAoZGVhZFVpZCA9PT0gLTEpIHtcbiAgICAgIC8vIGlmIGFsbCBlbnRpdHkgaXMgYWxpdmUsIGlzc3VlIGEgbmV3IGVudGl0eVVpZFxuICAgICAgZW50aXR5VWlkID0gKyt0aGlzLl9fZW50aXR5X3VpZF9jb3VudDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaWYgdGhlcmUgaXMgYSBkZWFkIGVudGl0eSwgcmV1c2UgdGhlIGVudGl0eVVpZFxuICAgICAgZW50aXR5VWlkID0gZGVhZFVpZDtcbiAgICB9XG5cbiAgICBjb25zdCBlbnRpdHkgPSBuZXcgRW50aXR5KHRoaXMuX19lbmdpbmUsIGVudGl0eVVpZCwgdHJ1ZSk7XG4gICAgdGhpcy5fX2VudGl0aWVzW2VudGl0eVVpZF0gPSBlbnRpdHk7XG5cbiAgICBFbnRpdHlSZXBvc2l0b3J5Ll9fdXBkYXRlQ291bnQrKztcblxuICAgIHJldHVybiBlbnRpdHk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlcyBhbiBlbnRpdHkgYW5kIGFsbCBpdHMgYXNzb2NpYXRlZCBjb21wb25lbnRzLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBXaGVuIGRlbGV0aW5nIGFuIGVudGl0eSB3aXRoIGEgU2NlbmVHcmFwaCBjb21wb25lbnQsIHRoaXMgbWV0aG9kIGF1dG9tYXRpY2FsbHlcbiAgICogZGVsZXRlcyBhbGwgY2hpbGQgZW50aXRpZXMgcmVjdXJzaXZlbHkgdG8gbWFpbnRhaW4gc2NlbmUgZ3JhcGggaW50ZWdyaXR5LlxuICAgKlxuICAgKiBAcGFyYW0gZW50aXR5VWlkIC0gVGhlIHVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSBlbnRpdHkgdG8gZGVsZXRlXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgZW50aXR5ID0gRW50aXR5UmVwb3NpdG9yeS5jcmVhdGVFbnRpdHkoKTtcbiAgICogRW50aXR5UmVwb3NpdG9yeS5kZWxldGVFbnRpdHkoZW50aXR5LmVudGl0eVVJRCk7XG4gICAqIGBgYFxuICAgKi9cbiAgcHVibGljIGRlbGV0ZUVudGl0eShlbnRpdHlVaWQ6IEVudGl0eVVJRCk6IHZvaWQge1xuICAgIGlmIChJcy5ub3QuZXhpc3QodGhpcy5fY29tcG9uZW50c1tlbnRpdHlVaWRdKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IFtjb21wb25lbnRUaWQsIGNvbXBvbmVudF0gb2YgdGhpcy5fY29tcG9uZW50c1tlbnRpdHlVaWRdKSB7XG4gICAgICBpZiAoY29tcG9uZW50VGlkID09PSBXZWxsS25vd25Db21wb25lbnRUSURzLlNjZW5lR3JhcGhDb21wb25lbnRUSUQpIHtcbiAgICAgICAgY29uc3Qgc2NlbmVHcmFwaCA9IGNvbXBvbmVudCBhcyB1bmtub3duIGFzIElTY2VuZUdyYXBoRW50aXR5O1xuICAgICAgICBjb25zdCBjaGlsZHJlbiA9IHNjZW5lR3JhcGguY2hpbGRyZW4uY29uY2F0KCk7XG4gICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgY2hpbGRyZW4pIHtcbiAgICAgICAgICB0aGlzLmRlbGV0ZUVudGl0eShjaGlsZC5lbnRpdHkuZW50aXR5VUlEKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5fX2VuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmRlbGV0ZUNvbXBvbmVudChjb21wb25lbnQpO1xuICAgIH1cbiAgICB0aGlzLl9fZW50aXRpZXNbZW50aXR5VWlkXT8uX2Rlc3Ryb3koKTtcbiAgICBkZWxldGUgdGhpcy5fX2VudGl0aWVzW2VudGl0eVVpZF07XG4gICAgZGVsZXRlIHRoaXMuX2NvbXBvbmVudHNbZW50aXR5VWlkXTtcblxuICAgIEVudGl0eVJlcG9zaXRvcnkuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlY3Vyc2l2ZWx5IGRlbGV0ZXMgYW4gZW50aXR5IGFuZCBhbGwgaXRzIGRlc2NlbmRhbnQgZW50aXRpZXMgaW4gdGhlIHNjZW5lIGdyYXBoIGhpZXJhcmNoeS5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBtZXRob2QgdHJhdmVyc2VzIHRoZSBlbnRpcmUgc2NlbmUgZ3JhcGggdHJlZSBzdGFydGluZyBmcm9tIHRoZSBzcGVjaWZpZWQgZW50aXR5XG4gICAqIGFuZCBkZWxldGVzIGFsbCBlbnRpdGllcyBpbiB0aGUgaGllcmFyY2h5LiBVc2UgdGhpcyB3aGVuIHlvdSB3YW50IHRvIHJlbW92ZSBhbiBlbnRpcmVcbiAgICogc3VidHJlZSBmcm9tIHRoZSBzY2VuZSBncmFwaC5cbiAgICpcbiAgICogQHBhcmFtIGVudGl0eVVpZCAtIFRoZSB1bmlxdWUgaWRlbnRpZmllciBvZiB0aGUgcm9vdCBlbnRpdHkgdG8gZGVsZXRlIHJlY3Vyc2l2ZWx5XG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogLy8gRGVsZXRlIGEgcGFyZW50IGVudGl0eSBhbmQgYWxsIGl0cyBjaGlsZHJlblxuICAgKiBFbnRpdHlSZXBvc2l0b3J5LmRlbGV0ZUVudGl0eVJlY3Vyc2l2ZWx5KHBhcmVudEVudGl0eS5lbnRpdHlVSUQpO1xuICAgKiBgYGBcbiAgICovXG4gIHB1YmxpYyBkZWxldGVFbnRpdHlSZWN1cnNpdmVseShlbnRpdHlVaWQ6IEVudGl0eVVJRCk6IHZvaWQge1xuICAgIGNvbnN0IGVudGl0eSA9IHRoaXMuZ2V0RW50aXR5KGVudGl0eVVpZCk7XG4gICAgY29uc3QgZW50aXRpZXM6IElFbnRpdHlbXSA9IFtdO1xuICAgIGNvbnN0IHNnID0gZW50aXR5LnRyeVRvR2V0U2NlbmVHcmFwaCgpO1xuICAgIGlmIChzZyAhPSBudWxsKSB7XG4gICAgICBlbnRpdGllcy5wdXNoKHNnLmVudGl0eSk7XG4gICAgICBhZGRDaGlsZChzZyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkQ2hpbGQoc2c6IFNjZW5lR3JhcGhDb21wb25lbnQpIHtcbiAgICAgIGNvbnN0IGNoaWxkcmVuID0gc2cuY2hpbGRyZW47XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgICAgIGVudGl0aWVzLnB1c2goY2hpbGQuZW50aXR5KTtcbiAgICAgICAgYWRkQ2hpbGQoY2hpbGQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3QgZW50aXR5IG9mIGVudGl0aWVzKSB7XG4gICAgICB0aGlzLmRlbGV0ZUVudGl0eShlbnRpdHkuZW50aXR5VUlEKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHNoYWxsb3cgY29weSBvZiBhbiBlbnRpdHksIGluY2x1ZGluZyBhbGwgaXRzIGNvbXBvbmVudHMgYW5kIHRhZyBkYXRhLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIG1ldGhvZCBwZXJmb3JtcyBhIHNoYWxsb3cgY29weSBvZiB0aGUgZW50aXR5LCBpdHMgY29tcG9uZW50cywgYW5kIGhhbmRsZXNcbiAgICogc3BlY2lhbCBjYXNlcyBsaWtlIHNrZWxldGFsIGpvaW50cyBhbmQgdGFnIHJlZmVyZW5jZXMuIFRoZSBvcmlnaW5hbCBlbnRpdHknc1xuICAgKiBgX215TGF0ZXN0Q29weUVudGl0eVVJRGAgd2lsbCBiZSB1cGRhdGVkIHRvIHJlZmVyZW5jZSB0aGUgbmV3IGVudGl0eS5cbiAgICpcbiAgICogQHBhcmFtIGVudGl0eSAtIFRoZSBlbnRpdHkgdG8gc2hhbGxvdyBjb3B5XG4gICAqIEByZXR1cm5zIEEgbmV3IGVudGl0eSB0aGF0IGlzIGEgc2hhbGxvdyBjb3B5IG9mIHRoZSBpbnB1dCBlbnRpdHlcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBvcmlnaW5hbEVudGl0eSA9IEVudGl0eVJlcG9zaXRvcnkuY3JlYXRlRW50aXR5KCk7XG4gICAqIGNvbnN0IGNvcGllZEVudGl0eSA9IEVudGl0eVJlcG9zaXRvcnkuc2hhbGxvd0NvcHlFbnRpdHkob3JpZ2luYWxFbnRpdHkpO1xuICAgKiBgYGBcbiAgICovXG4gIHB1YmxpYyBzaGFsbG93Q29weUVudGl0eShlbnRpdHk6IElFbnRpdHkpOiBJRW50aXR5IHtcbiAgICBjb25zdCBuZXdFbnRpdHkgPSB0aGlzLl9zaGFsbG93Q29weUVudGl0eUlubmVyKGVudGl0eSk7XG5cbiAgICB0aGlzLl9fc2V0Sm9pbnRzKGVudGl0eSk7XG4gICAgdGhpcy5fX2hhbmRsZVRhZ0RhdGEobmV3RW50aXR5IGFzIHVua25vd24gYXMgRW50aXR5KTtcblxuICAgIHJldHVybiBuZXdFbnRpdHk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCBqb2ludCByZWxhdGlvbnNoaXBzIGZvciBTa2VsZXRhbENvbXBvbmVudCBlbnRpdGllcyBhZnRlciBjb3B5aW5nLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIGlzIGFuIGludGVybmFsIG1ldGhvZCB1c2VkIGR1cmluZyBlbnRpdHkgY29weWluZyB0byBlbnN1cmUgdGhhdCBza2VsZXRhbFxuICAgKiBqb2ludCByZWZlcmVuY2VzIGFyZSBwcm9wZXJseSB1cGRhdGVkIHRvIHBvaW50IHRvIHRoZSBjb3BpZWQgZW50aXRpZXMgcmF0aGVyXG4gICAqIHRoYW4gdGhlIG9yaWdpbmFsIGVudGl0aWVzLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICogQHBhcmFtIGVudGl0eSAtIFRoZSBvcmlnaW5hbCBlbnRpdHkgd2hvc2Ugam9pbnRzIG5lZWQgdG8gYmUgc2V0IHVwIGluIHRoZSBjb3B5XG4gICAqL1xuICBwcml2YXRlIF9fc2V0Sm9pbnRzKGVudGl0eTogSUVudGl0eSkge1xuICAgIGNvbnN0IG5ld0VudGl0eSA9IHRoaXMuZ2V0RW50aXR5KGVudGl0eS5fbXlMYXRlc3RDb3B5RW50aXR5VUlEKTtcbiAgICBpZiAoSXMubm90LmV4aXN0KG5ld0VudGl0eSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBza2VsZXRhbENvbXBvbmVudE9mTmV3ID0gbmV3RW50aXR5LmdldENvbXBvbmVudEJ5Q29tcG9uZW50VElEKFxuICAgICAgV2VsbEtub3duQ29tcG9uZW50VElEcy5Ta2VsZXRhbENvbXBvbmVudFRJRFxuICAgICkgYXMgU2tlbGV0YWxDb21wb25lbnQ7XG4gICAgY29uc3Qgc2tlbGV0YWxDb21wb25lbnRPZk9yaWdpbmFsID0gZW50aXR5LmdldENvbXBvbmVudEJ5Q29tcG9uZW50VElEKFxuICAgICAgV2VsbEtub3duQ29tcG9uZW50VElEcy5Ta2VsZXRhbENvbXBvbmVudFRJRFxuICAgICkgYXMgU2tlbGV0YWxDb21wb25lbnQ7XG5cbiAgICBpZiAoSXMuZXhpc3Qoc2tlbGV0YWxDb21wb25lbnRPZk5ldykgJiYgSXMuZXhpc3Qoc2tlbGV0YWxDb21wb25lbnRPZk9yaWdpbmFsKSkge1xuICAgICAgY29uc3Qgam9pbnRzT3JpZ2luYWwgPSBza2VsZXRhbENvbXBvbmVudE9mT3JpZ2luYWwuZ2V0Sm9pbnRzKCk7XG4gICAgICBpZiAoam9pbnRzT3JpZ2luYWwubGVuZ3RoID4gMCkge1xuICAgICAgICAvLyBSZW1hcCBldmVyeSBvcmlnaW5hbCBqb2ludCB0byB0aGUgY29ycmVzcG9uZGluZyBzaGFsbG93LWNvcGllZCBqb2ludCBlbnRpdHlcbiAgICAgICAgY29uc3QgcmVtYXBwZWRKb2ludHM6IFNjZW5lR3JhcGhDb21wb25lbnRbXSA9IFtdO1xuXG4gICAgICAgIGZvciAoY29uc3Qgam9pbnQgb2Ygam9pbnRzT3JpZ2luYWwpIHtcbiAgICAgICAgICBjb25zdCBjb3BpZWRKb2ludEVudGl0eSA9IHRoaXMuZ2V0RW50aXR5KGpvaW50LmVudGl0eS5fbXlMYXRlc3RDb3B5RW50aXR5VUlEKTtcbiAgICAgICAgICBjb25zdCBjb3BpZWRKb2ludFNjZW5lR3JhcGggPSBjb3BpZWRKb2ludEVudGl0eT8udHJ5VG9HZXRTY2VuZUdyYXBoKCk7XG4gICAgICAgICAgaWYgKElzLmV4aXN0KGNvcGllZEpvaW50U2NlbmVHcmFwaCkpIHtcbiAgICAgICAgICAgIHJlbWFwcGVkSm9pbnRzLnB1c2goY29waWVkSm9pbnRTY2VuZUdyYXBoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVtYXBwZWRKb2ludHMubGVuZ3RoID09PSBqb2ludHNPcmlnaW5hbC5sZW5ndGgpIHtcbiAgICAgICAgICBza2VsZXRhbENvbXBvbmVudE9mTmV3LnVwZGF0ZUpvaW50c0xpZ2h0d2VpZ2h0KHJlbWFwcGVkSm9pbnRzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFsc28gcmVtYXAgdGhlIHJvb3Qgb2YgdGhlIGpvaW50IGhpZXJhcmNoeSB0byB0aGUgY29waWVkIGVudGl0eVxuICAgICAgICBjb25zdCBvcmlnaW5hbFRvcCA9IHNrZWxldGFsQ29tcG9uZW50T2ZPcmlnaW5hbC50b3BPZkpvaW50c0hpZXJhcmNoeTtcbiAgICAgICAgaWYgKElzLmV4aXN0KG9yaWdpbmFsVG9wKSkge1xuICAgICAgICAgIGNvbnN0IGNvcGllZFRvcEVudGl0eSA9IHRoaXMuZ2V0RW50aXR5KG9yaWdpbmFsVG9wLmVudGl0eS5fbXlMYXRlc3RDb3B5RW50aXR5VUlEKTtcbiAgICAgICAgICBjb25zdCBjb3BpZWRUb3BTY2VuZUdyYXBoID0gY29waWVkVG9wRW50aXR5Py50cnlUb0dldFNjZW5lR3JhcGgoKTtcbiAgICAgICAgICBpZiAoSXMuZXhpc3QoY29waWVkVG9wU2NlbmVHcmFwaCkpIHtcbiAgICAgICAgICAgIHNrZWxldGFsQ29tcG9uZW50T2ZOZXcudG9wT2ZKb2ludHNIaWVyYXJjaHkgPSBjb3BpZWRUb3BTY2VuZUdyYXBoO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHNjZW5lR3JhcGggPSBlbnRpdHkudHJ5VG9HZXRTY2VuZUdyYXBoKCk7XG4gICAgaWYgKElzLmV4aXN0KHNjZW5lR3JhcGgpKSB7XG4gICAgICBzY2VuZUdyYXBoLmNoaWxkcmVuLmZvckVhY2goY2hpbGQgPT4ge1xuICAgICAgICB0aGlzLl9fc2V0Sm9pbnRzKGNoaWxkLmVudGl0eSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW50ZXJuYWwgbWV0aG9kIHRoYXQgcGVyZm9ybXMgdGhlIGNvcmUgc2hhbGxvdyBjb3B5aW5nIGxvZ2ljIGZvciBhbiBlbnRpdHkuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIGNyZWF0ZXMgYSBuZXcgZW50aXR5LCBjb3BpZXMgdGFncywgYW5kIHNoYWxsb3cgY29waWVzIGFsbCBjb21wb25lbnRzXG4gICAqIGZyb20gdGhlIG9yaWdpbmFsIGVudGl0eS4gSXQgcHJvY2Vzc2VzIGFsbCB3ZWxsLWtub3duIGNvbXBvbmVudCB0eXBlcy5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqIEBwYXJhbSBlbnRpdHkgLSBUaGUgZW50aXR5IHRvIHNoYWxsb3cgY29weVxuICAgKiBAcmV0dXJucyBBIG5ldyBlbnRpdHkgdGhhdCBpcyBhIHNoYWxsb3cgY29weSBvZiB0aGUgaW5wdXQgZW50aXR5XG4gICAqL1xuICBwdWJsaWMgX3NoYWxsb3dDb3B5RW50aXR5SW5uZXIoZW50aXR5OiBJRW50aXR5KTogSUVudGl0eSB7XG4gICAgY29uc3QgbmV3RW50aXR5ID0gdGhpcy5jcmVhdGVFbnRpdHkoKTtcbiAgICAobmV3RW50aXR5IGFzIEVudGl0eSkuX3RhZ3MgPSBPYmplY3QuYXNzaWduKHt9LCAoZW50aXR5IGFzIEVudGl0eSkuX3RhZ3MpO1xuXG4gICAgZW50aXR5Ll9teUxhdGVzdENvcHlFbnRpdHlVSUQgPSBuZXdFbnRpdHkuZW50aXR5VUlEO1xuICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IFdlbGxLbm93bkNvbXBvbmVudFRJRHMubWF4V2VsbEtub3duVGlkTnVtYmVyOyBpKyspIHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudCA9IGVudGl0eS5nZXRDb21wb25lbnRCeUNvbXBvbmVudFRJRChpKTtcbiAgICAgIGlmIChJcy5leGlzdChjb21wb25lbnQpKSB7XG4gICAgICAgIHRoaXMuYWRkQ29tcG9uZW50VG9FbnRpdHkoY29tcG9uZW50LmNvbnN0cnVjdG9yIGFzIHR5cGVvZiBDb21wb25lbnQsIG5ld0VudGl0eSk7XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudE9mTmV3RW50aXR5ID0gbmV3RW50aXR5LmdldENvbXBvbmVudEJ5Q29tcG9uZW50VElEKGkpO1xuICAgICAgICBpZiAoSXMuZXhpc3QoY29tcG9uZW50T2ZOZXdFbnRpdHkpKSB7XG4gICAgICAgICAgY29tcG9uZW50T2ZOZXdFbnRpdHkuX3NoYWxsb3dDb3B5RnJvbShjb21wb25lbnQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBuZXdFbnRpdHk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBzcGVjaWFsIHRhZyBkYXRhIHByb2Nlc3NpbmcgZHVyaW5nIGVudGl0eSBjb3B5aW5nIG9wZXJhdGlvbnMuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIHByb2Nlc3NlcyBzcGVjaWFsIHRhZ3MgbGlrZSAncm5FbnRpdGllcycgYW5kICdybkVudGl0aWVzQnlOYW1lcydcbiAgICogdG8gZW5zdXJlIHRoYXQgZW50aXR5IHJlZmVyZW5jZXMgd2l0aGluIHRhZ3MgYXJlIHVwZGF0ZWQgdG8gcG9pbnQgdG8gY29waWVkXG4gICAqIGVudGl0aWVzIHJhdGhlciB0aGFuIG9yaWdpbmFsIGVudGl0aWVzLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICogQHBhcmFtIG5ld0VudGl0eSAtIFRoZSBuZXdseSBjb3BpZWQgZW50aXR5IHdob3NlIHRhZyBkYXRhIG5lZWRzIHByb2Nlc3NpbmdcbiAgICovXG4gIHByaXZhdGUgX19oYW5kbGVUYWdEYXRhKG5ld0VudGl0eTogRW50aXR5KSB7XG4gICAgY29uc3QgdGFncyA9IG5ld0VudGl0eS5fdGFncztcbiAgICBpZiAoSXMuZXhpc3QodGFncykpIHtcbiAgICAgIGNvbnN0IHRhZ0tleXMgPSBPYmplY3Qua2V5cyh0YWdzKTtcbiAgICAgIGZvciAoY29uc3QgdGFnS2V5IG9mIHRhZ0tleXMpIHtcbiAgICAgICAgaWYgKHRhZ0tleSA9PT0gJ3JuRW50aXRpZXMnKSB7XG4gICAgICAgICAgY29uc3QgZW50aXRpZXMgPSBuZXdFbnRpdHkuZ2V0VGFnVmFsdWUoJ3JuRW50aXRpZXMnKSBhcyBJU2NlbmVHcmFwaEVudGl0eVtdO1xuICAgICAgICAgIGNvbnN0IG5ld0VudGl0aWVzID0gZW50aXRpZXMubWFwKGVudGl0eSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRFbnRpdHkoZW50aXR5Ll9teUxhdGVzdENvcHlFbnRpdHlVSUQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIG5ld0VudGl0eS50cnlUb1NldFRhZyh7XG4gICAgICAgICAgICB0YWc6ICdybkVudGl0aWVzJyxcbiAgICAgICAgICAgIHZhbHVlOiBuZXdFbnRpdGllcyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGFnS2V5ID09PSAncm5FbnRpdGllc0J5TmFtZXMnKSB7XG4gICAgICAgICAgY29uc3QgbWFwID0gbmV3RW50aXR5LmdldFRhZ1ZhbHVlKCdybkVudGl0aWVzQnlOYW1lcycpIGFzIE1hcDxzdHJpbmcsIElTY2VuZUdyYXBoRW50aXR5PjtcbiAgICAgICAgICBmb3IgKGNvbnN0IG5hbWUgb2YgT2JqZWN0LmtleXMobWFwKSkge1xuICAgICAgICAgICAgY29uc3QgZW50aXR5ID0gbWFwLmdldChuYW1lKSBhcyBJU2NlbmVHcmFwaEVudGl0eTtcbiAgICAgICAgICAgIG1hcC5zZXQobmFtZSwgdGhpcy5nZXRFbnRpdHkoZW50aXR5Ll9teUxhdGVzdENvcHlFbnRpdHlVSUQpIGFzIElTY2VuZUdyYXBoRW50aXR5KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbmV3RW50aXR5LnRyeVRvU2V0VGFnKHtcbiAgICAgICAgICAgIHRhZzogJ3JuRW50aXRpZXNCeU5hbWVzJyxcbiAgICAgICAgICAgIHZhbHVlOiBtYXAsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBzY2VuZUdyYXBoID0gbmV3RW50aXR5LnRyeVRvR2V0U2NlbmVHcmFwaCgpO1xuICAgIGlmIChJcy5leGlzdChzY2VuZUdyYXBoKSkge1xuICAgICAgc2NlbmVHcmFwaC5jaGlsZHJlbi5mb3JFYWNoKGNoaWxkID0+IHtcbiAgICAgICAgdGhpcy5fX2hhbmRsZVRhZ0RhdGEoY2hpbGQuZW50aXR5IGFzIHVua25vd24gYXMgRW50aXR5KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRlbXB0cyB0byBhZGQgYSBjb21wb25lbnQgdG8gYW4gZW50aXR5IHVzaW5nIHRoZSBjb21wb25lbnQncyB0eXBlIElELlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIG1ldGhvZCBsb29rcyB1cCB0aGUgY29tcG9uZW50IGNsYXNzIGJ5IGl0cyBUSUQgYW5kIGFkZHMgaXQgdG8gdGhlIGVudGl0eVxuICAgKiBpZiB0aGUgY29tcG9uZW50IGNsYXNzIGV4aXN0cy4gSWYgdGhlIGNvbXBvbmVudCBjbGFzcyBpcyBub3QgZm91bmQsIHRoZSBlbnRpdHlcbiAgICogaXMgcmV0dXJuZWQgdW5jaGFuZ2VkLlxuICAgKlxuICAgKiBDb21wb25lbnQgY2xhc3NlcyBhcmUgcmVnaXN0ZXJlZCB3aGVuIHRoZXkgYXJlIGZpcnN0IGFkZGVkIHdpdGgge0BsaW5rIGFkZENvbXBvbmVudFRvRW50aXR5fVxuICAgKiAob3IgZXhwbGljaXRseSB3aXRoIGBDb21wb25lbnRSZXBvc2l0b3J5LnJlZ2lzdGVyQ29tcG9uZW50Q2xhc3NgKSwgbm90IHdoZW4gdGhlIGxpYnJhcnkgaXNcbiAgICogaW1wb3J0ZWQuIFByZWZlciB7QGxpbmsgYWRkQ29tcG9uZW50VG9FbnRpdHl9IHdpdGggdGhlIGNvbXBvbmVudCBjbGFzcywgd2hpY2ggYWx3YXlzIHdvcmtzLlxuICAgKlxuICAgKiBAcGFyYW0gY29tcG9uZW50VElEIC0gVGhlIGNvbXBvbmVudCB0eXBlIGlkZW50aWZpZXJcbiAgICogQHBhcmFtIGVudGl0eSAtIFRoZSBlbnRpdHkgdG8gYWRkIHRoZSBjb21wb25lbnQgdG9cbiAgICogQHJldHVybnMgVGhlIGVudGl0eSAocG9zc2libHkgd2l0aCB0aGUgbmV3IGNvbXBvbmVudCBhZGRlZClcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBlbnRpdHkgPSBFbnRpdHlSZXBvc2l0b3J5LmNyZWF0ZUVudGl0eSgpO1xuICAgKiBFbnRpdHlSZXBvc2l0b3J5LnRyeVRvQWRkQ29tcG9uZW50VG9FbnRpdHlCeVRJRChcbiAgICogICBXZWxsS25vd25Db21wb25lbnRUSURzLlRyYW5zZm9ybUNvbXBvbmVudFRJRCxcbiAgICogICBlbnRpdHlcbiAgICogKTtcbiAgICogYGBgXG4gICAqL1xuICBwdWJsaWMgdHJ5VG9BZGRDb21wb25lbnRUb0VudGl0eUJ5VElEKGNvbXBvbmVudFRJRDogQ29tcG9uZW50VElELCBlbnRpdHk6IElFbnRpdHkpOiBJRW50aXR5IHtcbiAgICBjb25zdCBjb21wb25lbnRDbGFzcyA9IENvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50Q2xhc3MoY29tcG9uZW50VElEKTtcbiAgICBpZiAoSXMubm90LmV4aXN0KGNvbXBvbmVudENsYXNzKSkge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQud2FybihcbiAgICAgICAgYFRoZSBjb21wb25lbnQgY2xhc3Mgb2YgQ29tcG9uZW50VElEICR7Y29tcG9uZW50VElEfSBpcyBub3QgcmVnaXN0ZXJlZCB5ZXQuIGAgK1xuICAgICAgICAgICdVc2UgYWRkQ29tcG9uZW50VG9FbnRpdHkoKSB3aXRoIHRoZSBjb21wb25lbnQgY2xhc3MsIG9yIHJlZ2lzdGVyIGl0IHdpdGggQ29tcG9uZW50UmVwb3NpdG9yeS5yZWdpc3RlckNvbXBvbmVudENsYXNzKCkuJ1xuICAgICAgKTtcbiAgICAgIHJldHVybiBlbnRpdHk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmFkZENvbXBvbmVudFRvRW50aXR5KGNvbXBvbmVudENsYXNzLCBlbnRpdHkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBzcGVjaWZpYyBjb21wb25lbnQgY2xhc3MgdG8gYW4gZW50aXR5IGFuZCByZXR1cm5zIHRoZSBlbmhhbmNlZCBlbnRpdHkuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIGNyZWF0ZXMgYSBuZXcgY29tcG9uZW50IGluc3RhbmNlLCBhc3NvY2lhdGVzIGl0IHdpdGggdGhlIGVudGl0eSxcbiAgICogYW5kIHJldHVybnMgdGhlIGVudGl0eSB3aXRoIGVuaGFuY2VkIHR5cGUgaW5mb3JtYXRpb24gdGhhdCBpbmNsdWRlcyB0aGVcbiAgICogY29tcG9uZW50J3MgbWV0aG9kcy4gSWYgdGhlIGVudGl0eSBhbHJlYWR5IGhhcyB0aGlzIGNvbXBvbmVudCwgYSB3YXJuaW5nXG4gICAqIGlzIGxvZ2dlZCBhbmQgdGhlIGVudGl0eSBpcyByZXR1cm5lZCB1bmNoYW5nZWQuXG4gICAqXG4gICAqIEB0ZW1wbGF0ZSBDb21wb25lbnRUeXBlIC0gVGhlIGNvbXBvbmVudCBjbGFzcyB0eXBlXG4gICAqIEB0ZW1wbGF0ZSBFbnRpdHlUeXBlIC0gVGhlIGVudGl0eSB0eXBlXG4gICAqIEBwYXJhbSBjb21wb25lbnRDbGFzcyAtIFRoZSBjb21wb25lbnQgY2xhc3MgdG8gaW5zdGFudGlhdGUgYW5kIGFkZFxuICAgKiBAcGFyYW0gZW50aXR5IC0gVGhlIGVudGl0eSB0byBhZGQgdGhlIGNvbXBvbmVudCB0b1xuICAgKiBAcmV0dXJucyBUaGUgZW50aXR5IGVuaGFuY2VkIHdpdGggdGhlIGNvbXBvbmVudCdzIG1ldGhvZHNcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBlbnRpdHkgPSBFbnRpdHlSZXBvc2l0b3J5LmNyZWF0ZUVudGl0eSgpO1xuICAgKiBjb25zdCBlbmhhbmNlZEVudGl0eSA9IEVudGl0eVJlcG9zaXRvcnkuYWRkQ29tcG9uZW50VG9FbnRpdHkoXG4gICAqICAgVHJhbnNmb3JtQ29tcG9uZW50LFxuICAgKiAgIGVudGl0eVxuICAgKiApO1xuICAgKiAvLyBlbmhhbmNlZEVudGl0eSBub3cgaGFzIHRyYW5zZm9ybS1yZWxhdGVkIG1ldGhvZHNcbiAgICogYGBgXG4gICAqL1xuICBwdWJsaWMgYWRkQ29tcG9uZW50VG9FbnRpdHk8Q29tcG9uZW50VHlwZSBleHRlbmRzIHR5cGVvZiBDb21wb25lbnQsIEVudGl0eVR5cGUgZXh0ZW5kcyBJRW50aXR5PihcbiAgICBjb21wb25lbnRDbGFzczogQ29tcG9uZW50VHlwZSxcbiAgICBlbnRpdHk6IEVudGl0eVR5cGVcbiAgKTogRW50aXR5VHlwZSAmIENvbXBvbmVudFRvQ29tcG9uZW50TWV0aG9kczxDb21wb25lbnRUeXBlPiB7XG4gICAgaWYgKGVudGl0eS5oYXNDb21wb25lbnQoY29tcG9uZW50Q2xhc3MpKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5pbmZvKCdUaGlzIGVudGl0eSBhbHJlYWR5IGhhcyB0aGUgQ29tcG9uZW50LicpO1xuICAgICAgcmV0dXJuIGVudGl0eSBhcyBFbnRpdHlUeXBlICYgQ29tcG9uZW50VG9Db21wb25lbnRNZXRob2RzPENvbXBvbmVudFR5cGU+O1xuICAgIH1cblxuICAgIC8vIFJlZ2lzdGVyIHRoZSBjbGFzcyBvbiBmaXJzdCB1c2UgKHRoZXJlIGlzIG5vIGltcG9ydC10aW1lIHJlZ2lzdHJhdGlvbiwgc28gdGhhdCB1bnVzZWRcbiAgICAvLyBjb21wb25lbnQgY2xhc3NlcyBjYW4gYmUgdHJlZS1zaGFrZW4gYXdheSkuXG4gICAgQ29tcG9uZW50UmVwb3NpdG9yeS5fZW5zdXJlQ29tcG9uZW50Q2xhc3NSZWdpc3RlcmVkKGNvbXBvbmVudENsYXNzKTtcblxuICAgIC8vIENyZWF0ZSBDb21wb25lbnRcbiAgICBjb25zdCBjb21wb25lbnQgPSB0aGlzLl9fZW5naW5lLmNvbXBvbmVudFJlcG9zaXRvcnkuY3JlYXRlQ29tcG9uZW50KFxuICAgICAgY29tcG9uZW50Q2xhc3MuY29tcG9uZW50VElELFxuICAgICAgZW50aXR5LmVudGl0eVVJRCxcbiAgICAgIHRoaXNcbiAgICApO1xuXG4gICAgLy8gc2V0IHRoaXMgY29tcG9uZW50IHRvIHRoaXMuX2NvbXBvbmVudHMnIG1hcFxuICAgIGNvbnN0IG1hcCA9IHZhbHVlV2l0aENvbXBlbnNhdGlvbih7XG4gICAgICB2YWx1ZTogdGhpcy5fY29tcG9uZW50c1tlbnRpdHkuZW50aXR5VUlEXSxcbiAgICAgIGNvbXBlbnNhdGlvbjogKCkgPT4ge1xuICAgICAgICB0aGlzLl9jb21wb25lbnRzW2VudGl0eS5lbnRpdHlVSURdID0gbmV3IE1hcCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5fY29tcG9uZW50c1tlbnRpdHkuZW50aXR5VUlEXTtcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgbWFwLnNldChjb21wb25lbnRDbGFzcy5jb21wb25lbnRUSUQsIGNvbXBvbmVudCk7XG5cbiAgICAvLyBhZGQgdGhpcyBjb21wb25lbnQgdG8gdGhlIGVudGl0eVxuICAgIGNvbnN0IGVudGl0eUNsYXNzID0gY29tcG9uZW50LmFkZFRoaXNDb21wb25lbnRUb0VudGl0eShlbnRpdHksIGNvbXBvbmVudENsYXNzKTtcbiAgICBlbnRpdHkuX3NldENvbXBvbmVudChjb21wb25lbnRDbGFzcywgY29tcG9uZW50KTtcblxuICAgIGlmIChcbiAgICAgIGNvbXBvbmVudENsYXNzLmNvbXBvbmVudFRJRCA9PT0gV2VsbEtub3duQ29tcG9uZW50VElEcy5QaHlzaWNzQ29tcG9uZW50VElEIHx8XG4gICAgICBjb21wb25lbnRDbGFzcy5jb21wb25lbnRUSUQgPT09IFdlbGxLbm93bkNvbXBvbmVudFRJRHMuU2NlbmVHcmFwaENvbXBvbmVudFRJRFxuICAgICkge1xuICAgICAgY29uc3Qgc2NlbmVHcmFwaCA9IGVudGl0eS50cnlUb0dldFNjZW5lR3JhcGgoKTtcbiAgICAgIGlmIChzY2VuZUdyYXBoICE9PSB1bmRlZmluZWQgJiYgZW50aXR5LnRyeVRvR2V0UGh5c2ljcygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgc2NlbmVHcmFwaC5fb25QaHlzaWNzQ29tcG9uZW50QWRkZWQoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBFbnRpdHlSZXBvc2l0b3J5Ll9fdXBkYXRlQ291bnQrKztcblxuICAgIHJldHVybiBlbnRpdHkgYXMgdW5rbm93biBhcyB0eXBlb2YgZW50aXR5Q2xhc3M7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhIGNvbXBvbmVudCBmcm9tIGFuIGVudGl0eSBhbmQgY2xlYW5zIHVwIGFzc29jaWF0ZWQgcmVzb3VyY2VzLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIG1ldGhvZCByZW1vdmVzIHRoZSBzcGVjaWZpZWQgY29tcG9uZW50IGZyb20gdGhlIGVudGl0eSwgY2FsbHMgdGhlIGNvbXBvbmVudCdzXG4gICAqIGRlc3Ryb3kgbWV0aG9kLCBhbmQgcmV0dXJucyB0aGUgZW50aXR5IHdpdGggYmFzaWMgSUVudGl0eSB0eXBpbmcuIFlvdSBtYXkgbmVlZFxuICAgKiB0byBjYXN0IHRoZSByZXR1cm5lZCBlbnRpdHkgdG8gdGhlIGFwcHJvcHJpYXRlIHR5cGUgYWZ0ZXIgY29tcG9uZW50IHJlbW92YWwuXG4gICAqXG4gICAqIEBwYXJhbSBjb21wb25lbnRDbGFzcyAtIFRoZSBjb21wb25lbnQgY2xhc3MgdG8gcmVtb3ZlXG4gICAqIEBwYXJhbSBlbnRpdHkgLSBUaGUgZW50aXR5IHRvIHJlbW92ZSB0aGUgY29tcG9uZW50IGZyb21cbiAgICogQHJldHVybnMgVGhlIGVudGl0eSB3aXRoIHRoZSBjb21wb25lbnQgcmVtb3ZlZCAodHlwZWQgYXMgSUVudGl0eSlcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBlbnRpdHkgPSBFbnRpdHlSZXBvc2l0b3J5LmNyZWF0ZUVudGl0eSgpO1xuICAgKiAvLyBBZGQgYW5kIGxhdGVyIHJlbW92ZSBhIGNvbXBvbmVudFxuICAgKiBFbnRpdHlSZXBvc2l0b3J5LnJlbW92ZUNvbXBvbmVudEZyb21FbnRpdHkoVHJhbnNmb3JtQ29tcG9uZW50LCBlbnRpdHkpO1xuICAgKiBgYGBcbiAgICovXG4gIHB1YmxpYyByZW1vdmVDb21wb25lbnRGcm9tRW50aXR5KGNvbXBvbmVudENsYXNzOiB0eXBlb2YgQ29tcG9uZW50LCBlbnRpdHk6IElFbnRpdHkpOiBJRW50aXR5IHtcbiAgICBsZXQgbWFwID0gdGhpcy5fY29tcG9uZW50c1tlbnRpdHkuZW50aXR5VUlEXTtcbiAgICBpZiAobWFwID09IG51bGwpIHtcbiAgICAgIG1hcCA9IG5ldyBNYXAoKTtcbiAgICAgIHRoaXMuX2NvbXBvbmVudHNbZW50aXR5LmVudGl0eVVJRF0gPSBtYXA7XG4gICAgfVxuICAgIGNvbnN0IGNvbXBvbmVudCA9IG1hcC5nZXQoY29tcG9uZW50Q2xhc3MuY29tcG9uZW50VElEKTtcbiAgICBpZiAoSXMuZXhpc3QoY29tcG9uZW50KSkge1xuICAgICAgY29tcG9uZW50Ll9kZXN0cm95KCk7XG4gICAgICBpZiAoY29tcG9uZW50Q2xhc3MuY29tcG9uZW50VElEID09PSBXZWxsS25vd25Db21wb25lbnRUSURzLlBoeXNpY3NDb21wb25lbnRUSUQpIHtcbiAgICAgICAgZW50aXR5LnRyeVRvR2V0U2NlbmVHcmFwaCgpPy5fb25QaHlzaWNzQ29tcG9uZW50UmVtb3ZlZCgpO1xuICAgICAgfVxuICAgICAgbWFwLmRlbGV0ZShjb21wb25lbnRDbGFzcy5jb21wb25lbnRUSUQpO1xuICAgICAgZW50aXR5Ll9yZW1vdmVDb21wb25lbnQoY29tcG9uZW50Q2xhc3MuY29tcG9uZW50VElEKTtcbiAgICB9XG5cbiAgICBFbnRpdHlSZXBvc2l0b3J5Ll9fdXBkYXRlQ291bnQrKztcblxuICAgIHJldHVybiBlbnRpdHkgYXMgSUVudGl0eTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnN0YW5jZSBtZXRob2QgdG8gcmV0cmlldmUgYW4gZW50aXR5IGJ5IGl0cyB1bmlxdWUgaWRlbnRpZmllci5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBpcyBhbiBpbnN0YW5jZSBtZXRob2QgZXF1aXZhbGVudCBvZiB0aGUgc3RhdGljIGdldEVudGl0eSBtZXRob2QuXG4gICAqIFVzZWZ1bCB3aGVuIHdvcmtpbmcgd2l0aCBFbnRpdHlSZXBvc2l0b3J5IGluc3RhbmNlcy5cbiAgICpcbiAgICogQHBhcmFtIGVudGl0eVVpZCAtIFRoZSB1bmlxdWUgaWRlbnRpZmllciBvZiB0aGUgZW50aXR5IHRvIHJldHJpZXZlXG4gICAqIEByZXR1cm5zIFRoZSBlbnRpdHkgY29ycmVzcG9uZGluZyB0byB0aGUgZ2l2ZW4gVUlEXG4gICAqXG4gICAqIEB0aHJvd3MgV2lsbCB0aHJvdyBpZiB0aGUgZW50aXR5IHdpdGggdGhlIGdpdmVuIFVJRCBkb2VzIG5vdCBleGlzdFxuICAgKi9cbiAgcHVibGljIGdldEVudGl0eShlbnRpdHlVaWQ6IEVudGl0eVVJRCk6IElFbnRpdHkge1xuICAgIHJldHVybiB0aGlzLl9fZW50aXRpZXNbZW50aXR5VWlkXSE7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGEgc3BlY2lmaWMgY29tcG9uZW50IGZyb20gYW4gZW50aXR5LlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIG1ldGhvZCBsb29rcyB1cCBhIGNvbXBvbmVudCBvZiB0aGUgc3BlY2lmaWVkIHR5cGUgZnJvbSB0aGUgZ2l2ZW4gZW50aXR5LlxuICAgKiBSZXR1cm5zIG51bGwgaWYgdGhlIGVudGl0eSBkb2Vzbid0IGV4aXN0IG9yIGRvZXNuJ3QgaGF2ZSB0aGUgcmVxdWVzdGVkIGNvbXBvbmVudC5cbiAgICpcbiAgICogQHBhcmFtIGVudGl0eVVpZCAtIFRoZSB1bmlxdWUgaWRlbnRpZmllciBvZiB0aGUgZW50aXR5XG4gICAqIEBwYXJhbSBjb21wb25lbnRUeXBlIC0gVGhlIGNvbXBvbmVudCBjbGFzcyB0byByZXRyaWV2ZVxuICAgKiBAcmV0dXJucyBUaGUgY29tcG9uZW50IGluc3RhbmNlIGlmIGZvdW5kLCBudWxsIG90aGVyd2lzZVxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IHRyYW5zZm9ybSA9IEVudGl0eVJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50T2ZFbnRpdHkoXG4gICAqICAgZW50aXR5VUlELFxuICAgKiAgIFRyYW5zZm9ybUNvbXBvbmVudFxuICAgKiApO1xuICAgKiBpZiAodHJhbnNmb3JtKSB7XG4gICAqICAgLy8gVXNlIHRoZSB0cmFuc2Zvcm0gY29tcG9uZW50XG4gICAqIH1cbiAgICogYGBgXG4gICAqL1xuICBwdWJsaWMgZ2V0Q29tcG9uZW50T2ZFbnRpdHkoZW50aXR5VWlkOiBFbnRpdHlVSUQsIGNvbXBvbmVudFR5cGU6IHR5cGVvZiBDb21wb25lbnQpOiBDb21wb25lbnQgfCBudWxsIHtcbiAgICBjb25zdCBlbnRpdHkgPSB0aGlzLl9jb21wb25lbnRzW2VudGl0eVVpZF07XG4gICAgbGV0IGNvbXBvbmVudCA9IG51bGw7XG4gICAgaWYgKGVudGl0eSAhPSBudWxsKSB7XG4gICAgICBjb21wb25lbnQgPSBlbnRpdHkuZ2V0KGNvbXBvbmVudFR5cGUuY29tcG9uZW50VElEKTtcbiAgICAgIGlmIChjb21wb25lbnQgIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gY29tcG9uZW50O1xuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBjb21wb25lbnQ7XG4gIH1cblxuICAvKipcbiAgICogU2VhcmNoZXMgZm9yIGVudGl0aWVzIHRoYXQgbWF0Y2ggYWxsIG9mIHRoZSBzcGVjaWZpZWQgdGFncy5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBtZXRob2QgcGVyZm9ybXMgYSB0YWctYmFzZWQgc2VhcmNoIGFjcm9zcyBhbGwgZW50aXRpZXMgaW4gdGhlIHJlcG9zaXRvcnkuXG4gICAqIE9ubHkgZW50aXRpZXMgdGhhdCBtYXRjaCBBTEwgcHJvdmlkZWQgdGFncyB3aWxsIGJlIGluY2x1ZGVkIGluIHRoZSByZXN1bHRzLlxuICAgKlxuICAgKiBAcGFyYW0gdGFncyAtIFRoZSB0YWdzIHRvIHNlYXJjaCBmb3IgKGFsbCBtdXN0IG1hdGNoKVxuICAgKiBAcmV0dXJucyBBcnJheSBvZiBlbnRpdGllcyB0aGF0IG1hdGNoIGFsbCBzcGVjaWZpZWQgdGFnc1xuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IGVudGl0aWVzID0gRW50aXR5UmVwb3NpdG9yeS5zZWFyY2hCeVRhZ3Moe1xuICAgKiAgIGNhdGVnb3J5OiAnd2VhcG9uJyxcbiAgICogICB0eXBlOiAnc3dvcmQnXG4gICAqIH0pO1xuICAgKiBgYGBcbiAgICovXG4gIHB1YmxpYyBzZWFyY2hCeVRhZ3ModGFnczogUm5UYWdzKSB7XG4gICAgY29uc3QgbWF0Y2hFbnRpdGllcyA9IFtdO1xuICAgIGZvciAoY29uc3QgZW50aXR5IG9mIHRoaXMuX19lbnRpdGllcykge1xuICAgICAgaWYgKGVudGl0eT8ubWF0Y2hUYWdzKHRhZ3MpKSB7XG4gICAgICAgIG1hdGNoRW50aXRpZXMucHVzaChlbnRpdHkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWF0Y2hFbnRpdGllcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYW4gZW50aXR5IGJ5IGl0cyB1bmlxdWUgbmFtZSBpZGVudGlmaWVyLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIG1ldGhvZCBzZWFyY2hlcyB0aHJvdWdoIGFsbCBlbnRpdGllcyB0byBmaW5kIG9uZSB3aXRoIHRoZSBzcGVjaWZpZWRcbiAgICogdW5pcXVlIG5hbWUuIFJldHVybnMgdW5kZWZpbmVkIGlmIG5vIGVudGl0eSB3aXRoIHRoYXQgbmFtZSBpcyBmb3VuZC5cbiAgICpcbiAgICogQHBhcmFtIHVuaXF1ZU5hbWUgLSBUaGUgdW5pcXVlIG5hbWUgb2YgdGhlIGVudGl0eSB0byBmaW5kXG4gICAqIEByZXR1cm5zIFRoZSBlbnRpdHkgd2l0aCB0aGUgc3BlY2lmaWVkIHVuaXF1ZSBuYW1lLCBvciB1bmRlZmluZWQgaWYgbm90IGZvdW5kXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgcGxheWVyID0gRW50aXR5UmVwb3NpdG9yeS5nZXRFbnRpdHlCeVVuaXF1ZU5hbWUoJ1BsYXllcicpO1xuICAgKiBpZiAocGxheWVyKSB7XG4gICAqICAgLy8gRm91bmQgdGhlIHBsYXllciBlbnRpdHlcbiAgICogfVxuICAgKiBgYGBcbiAgICovXG4gIHB1YmxpYyBnZXRFbnRpdHlCeVVuaXF1ZU5hbWUodW5pcXVlTmFtZTogc3RyaW5nKTogSUVudGl0eSB8IHVuZGVmaW5lZCB7XG4gICAgZm9yIChjb25zdCBlbnRpdHkgb2YgdGhpcy5fX2VudGl0aWVzKSB7XG4gICAgICBpZiAoZW50aXR5ICE9IG51bGwgJiYgZW50aXR5LnVuaXF1ZU5hbWUgPT09IHVuaXF1ZU5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGVudGl0eTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZvaWQgMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGFsbCBjdXJyZW50bHkgYWxpdmUgZW50aXRpZXMgaW4gdGhlIHJlcG9zaXRvcnkuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIHJldHVybnMgYSBmaWx0ZXJlZCBhcnJheSBjb250YWluaW5nIG9ubHkgZW50aXRpZXMgdGhhdCBhcmVcbiAgICogbm90IG51bGwgYW5kIGFyZSBtYXJrZWQgYXMgYWxpdmUuIFRoaXMgaXMgYW4gaW50ZXJuYWwgbWV0aG9kIHVzZWQgZm9yXG4gICAqIHJlcG9zaXRvcnkgbWFuYWdlbWVudCBhbmQgZGVidWdnaW5nLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICogQHJldHVybnMgQXJyYXkgb2YgYWxsIGFsaXZlIGVudGl0aWVzXG4gICAqL1xuICBwdWJsaWMgX2dldEVudGl0aWVzKCk6IElFbnRpdHlbXSB7XG4gICAgcmV0dXJuIHRoaXMuX19lbnRpdGllcy5maWx0ZXIoZW50aXR5ID0+IGVudGl0eSAhPSBudWxsICYmIGVudGl0eSEuX2lzQWxpdmUpIGFzIElFbnRpdHlbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB0b3RhbCBjb3VudCBvZiBjdXJyZW50bHkgYWxpdmUgZW50aXRpZXMuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIGNvdW50cyBvbmx5IGVudGl0aWVzIHRoYXQgYXJlIG5vdCBudWxsIGFuZCBhcmUgbWFya2VkIGFzIGFsaXZlLlxuICAgKiBVc2VmdWwgZm9yIHBlcmZvcm1hbmNlIG1vbml0b3JpbmcgYW5kIGRlYnVnZ2luZyBlbnRpdHkgbGlmZWN5Y2xlIGlzc3Vlcy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG51bWJlciBvZiBjdXJyZW50bHkgYWxpdmUgZW50aXRpZXNcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zb2xlLmxvZyhgQWN0aXZlIGVudGl0aWVzOiAke0VudGl0eVJlcG9zaXRvcnkuZ2V0RW50aXRpZXNOdW1iZXIoKX1gKTtcbiAgICogYGBgXG4gICAqL1xuICBwdWJsaWMgZ2V0RW50aXRpZXNOdW1iZXIoKTogbnVtYmVyIHtcbiAgICBjb25zdCBlbnRpdGllcyA9IHRoaXMuX19lbnRpdGllcy5maWx0ZXIoZW50aXR5ID0+IGVudGl0eSAhPSBudWxsICYmIGVudGl0eSEuX2lzQWxpdmUpO1xuICAgIHJldHVybiBlbnRpdGllcy5sZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCB1cGRhdGUgY291bnQgZm9yIHRoZSBlbnRpdHkgcmVwb3NpdG9yeS5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBjb3VudGVyIGluY3JlbWVudHMgd2hlbmV2ZXIgZW50aXRpZXMgYXJlIGNyZWF0ZWQsIGRlbGV0ZWQsIG9yIGhhdmVcbiAgICogY29tcG9uZW50cyBhZGRlZC9yZW1vdmVkLiBVc2VmdWwgZm9yIHRyYWNraW5nIHJlcG9zaXRvcnkgc3RhdGUgY2hhbmdlc1xuICAgKiBhbmQgaW1wbGVtZW50aW5nIGNhY2hlIGludmFsaWRhdGlvbiBzdHJhdGVnaWVzLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCB1cGRhdGUgY291bnRcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgZ2V0IHVwZGF0ZUNvdW50KCkge1xuICAgIHJldHVybiB0aGlzLl9fdXBkYXRlQ291bnQ7XG4gIH1cblxuICBnZXQgZW5naW5lKCkge1xuICAgIHJldHVybiB0aGlzLl9fZW5naW5lO1xuICB9XG59XG5cbi8qKlxuICogQXBwbGllcyBtaXhpbiBmdW5jdGlvbmFsaXR5IHRvIGVuaGFuY2UgYW4gZW50aXR5IHdpdGggYWRkaXRpb25hbCBjYXBhYmlsaXRpZXMuXG4gKlxuICogQHJlbWFya3NcbiAqIFRoaXMgdXRpbGl0eSBmdW5jdGlvbiBjb3BpZXMgYWxsIHByb3BlcnR5IGRlc2NyaXB0b3JzIGZyb20gYSBiYXNlIGNvbnN0cnVjdG9yJ3NcbiAqIHByb3RvdHlwZSB0byB0aGUgZGVyaXZlZCBlbnRpdHkgaW5zdGFuY2UuIFVzZWQgaW50ZXJuYWxseSBmb3IgZW50aXR5IGVuaGFuY2VtZW50XG4gKiB3aGVuIGNvbXBvbmVudHMgYXJlIGFkZGVkLlxuICpcbiAqIEBwYXJhbSBkZXJpdmVkQ3RvciAtIFRoZSBlbnRpdHkgaW5zdGFuY2UgdG8gZW5oYW5jZVxuICogQHBhcmFtIGJhc2VDdG9yIC0gVGhlIGNvbnN0cnVjdG9yIHdob3NlIHByb3RvdHlwZSBtZXRob2RzIHRvIGNvcHlcbiAqXG4gKiBAaW50ZXJuYWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5TWl4aW5zKGRlcml2ZWRDdG9yOiBJRW50aXR5LCBiYXNlQ3RvcjogYW55KSB7XG4gIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGJhc2VDdG9yLnByb3RvdHlwZSkuZm9yRWFjaChuYW1lID0+IHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoXG4gICAgICBkZXJpdmVkQ3RvcixcbiAgICAgIG5hbWUsXG4gICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGJhc2VDdG9yLnByb3RvdHlwZSwgbmFtZSkgfHwgT2JqZWN0LmNyZWF0ZShudWxsKVxuICAgICk7XG4gIH0pO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUlBLFNB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VDtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFvQk8sYUFBYSxNQUFjO0FBQ2hDLFVBQU0sZ0JBQWdCLENBQUM7QUFDdkIsZUFBVyxVQUFVLEtBQUtBLElBQVk7QUFDcEMsVUFBSSxpQ0FBUSxVQUFVLE9BQU87QUFDM0Isc0JBQWMsS0FBSyxNQUFNO0FBQUEsTUFDM0I7QUFBQSxJQUNGO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQW9CTyxzQkFBc0IsWUFBeUM7QUFDcEUsZUFBVyxVQUFVLEtBQUtBLElBQVk7QUFDcEMsVUFBSSxVQUFVLFFBQVEsT0FBTyxlQUFlLFlBQVk7QUFDdEQsZUFBTztBQUFBLE1BQ1Q7QUFBQSxJQUNGO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFhTyxlQUEwQjtBQUMvQixXQUFPLEtBQUtBLEdBQVcsT0FBTyxZQUFVLFVBQVUsUUFBUSxPQUFRLFFBQVE7QUFBQSxFQUM1RTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWdCTyxvQkFBNEI7QUFDakMsVUFBTSxXQUFXLEtBQUtBLEdBQVcsT0FBTyxZQUFVLFVBQVUsUUFBUSxPQUFRLFFBQVE7QUFDcEYsV0FBTyxTQUFTO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBWUEsV0FBa0IsY0FBYztBQUM5QixXQUFPLEtBQUtFO0FBQUEsRUFDZDtBQUFBLEVBRUEsSUFBSSxTQUFTO0FBQ1gsV0FBTyxLQUFLRDtBQUFBLEVBQ2Q7QUFDRjtBQUFBO0FBeGxCYSxrQkFLSUMsS0FBZ0I7QUFMMUIsSUFBTSxtQkFBTjtBQXVtQkEsU0FBUyxZQUFZLGFBQXNCLFVBQWU7QUFDL0QsU0FBTyxvQkFBb0IsU0FBUyxTQUFTLEVBQUUsUUFBUSxVQUFRO0FBQzdELFdBQU87QUFBQSxNQUNMO0FBQUEsTUFDQTtBQUFBLE1BQ0EsT0FBTyx5QkFBeUIsU0FBUyxXQUFXLElBQUksS0FBSyx1QkFBTyxPQUFPLElBQUk7QUFBQSxJQUNqRjtBQUFBLEVBQ0YsQ0FBQztBQUNIOyIsCiAgIm5hbWVzIjogWyJfX2VudGl0eV91aWRfY291bnQiLCAiX19lbnRpdGllcyIsICJfX2VuZ2luZSIsICJfX3VwZGF0ZUNvdW50IiwgInNnIiwgImVudGl0eSIsICJfX3NldEpvaW50cyIsICJfX2hhbmRsZVRhZ0RhdGEiXQp9Cg==
