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
 * The class that generates and manages entities.
 */
export class EntityRepository {
  private static __entity_uid_count: number = Entity.invalidEntityUID;
  private static __entities: Array<IEntity | undefined> = [];
  static _components: Array<Map<ComponentTID, Component>> = []; // index is EntityUID
  private static __updateCount = 0;

  private constructor() {}

  /**
   * Creates an entity
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

  public static shallowCopyEntity(entity: IEntity): IEntity {
    const newEntity = EntityRepository._shallowCopyEntityInner(entity);

    this.__setJoints(entity);
    this.__handleTagData(newEntity as unknown as Entity);

    return newEntity;
  }

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
      const jointsNew = jointsOriginal.map((joint) => {
        return EntityRepository.getEntity(
          joint.entity._myLatestCopyEntityUID
        ).tryToGetSceneGraph()!;
      });
      skeletalComponentOfNew.setJoints(jointsNew);
    }

    const sceneGraph = entity.tryToGetSceneGraph();
    if (Is.exist(sceneGraph)) {
      sceneGraph.children.forEach((child) => {
        EntityRepository.__setJoints(child.entity);
      });
    }
  }

  static _shallowCopyEntityInner(entity: IEntity) {
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

  private static __handleTagData(newEntity: Entity) {
    const tags = newEntity._tags;
    if (Is.exist(tags)) {
      const tagKeys = Object.keys(tags);
      for (const tagKey of tagKeys) {
        if (tagKey === 'rnEntities') {
          const entities = newEntity.getTagValue('rnEntities') as ISceneGraphEntity[];
          const newEntities = entities.map((entity) => {
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
            map.set(
              name,
              EntityRepository.getEntity(entity._myLatestCopyEntityUID) as ISceneGraphEntity
            );
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
      sceneGraph.children.forEach((child) => {
        EntityRepository.__handleTagData(child.entity as unknown as Entity);
      });
    }
  }

  /**
   * Try to add a component to the entity by componentTID.
   * @param componentTID - the componentTID
   * @param entity - the entity
   * @returns the entity added a component
   */
  public static tryToAddComponentToEntityByTID(
    componentTID: ComponentTID,
    entity: IEntity
  ): IEntity {
    const componentClass = ComponentRepository.getComponentClass(componentTID);
    if (Is.not.exist(componentClass)) {
      return entity;
    }
    return this.addComponentToEntity(componentClass, entity);
  }

  /**
   * Add a Component to the entity
   * @param componentClass - a ComponentClass to add
   * @param entity - the entity
   * @returns the entity added a component
   */
  public static addComponentToEntity<
    ComponentType extends typeof Component,
    EntityType extends IEntity
  >(
    componentClass: ComponentType,
    entity: EntityType
  ): EntityType & ComponentToComponentMethods<ComponentType> {
    if (entity.hasComponent(componentClass)) {
      Logger.info('This entity already has the Component.');
      return entity as EntityType & ComponentToComponentMethods<ComponentType>;
    }

    // Create Component
    const component = ComponentRepository.createComponent(
      componentClass.componentTID,
      entity.entityUID,
      this
    );

    // set this component to this._components' map
    const map = valueWithCompensation({
      value: this._components[entity.entityUID],
      compensation: () => {
        const map = new Map();
        this._components[entity.entityUID] = map;
        return map;
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
   * Remove components from the entity.
   * Note: the returned entity's type will be IEntity (most basic type).
   *       You have to cast it to appropriate type later.
   * @param componentClass The class object of the component to remove.
   * @param entityUid The entityUID of the entity.
   */
  public static removeComponentFromEntity(
    componentClass: typeof Component,
    entity: IEntity
  ): IEntity {
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
   * Gets the entity corresponding to the entityUID.
   * @param entityUid The entityUID of the entity.
   */
  public static getEntity(entityUid: EntityUID): IEntity {
    return this.__entities[entityUid]!;
  }

  /**
   * Gets the entity corresponding to the entityUID.
   * @param entityUid The entityUID of the entity.
   */
  public getEntity(entityUid: EntityUID): IEntity {
    return EntityRepository.__entities[entityUid]!;
  }
  /**
   * Gets the specified component from the entity.
   * @param entityUid The entity to get the component from.
   * @param componentType The class object of the component to get.
   */
  public static getComponentOfEntity(
    entityUid: EntityUID,
    componentType: typeof Component
  ): Component | null {
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
   * Search entities by the given tags.
   * @param tags The tags to search
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
   * Gets entity by the unique name.
   * @param uniqueName The unique name of the entity.
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
   * @internal
   * Gets all entities.
   */
  public static _getEntities(): IEntity[] {
    return this.__entities.filter((entity) => entity != null && entity!._isAlive) as IEntity[];
  }

  /**
   * Gets the number of all entities.
   */
  public static getEntitiesNumber(): number {
    const entities = this.__entities.filter((entity) => entity != null && entity!._isAlive);
    return entities.length;
  }

  public static get updateCount() {
    return this.__updateCount;
  }
}

// This can live anywhere in your codebase:
export function applyMixins(derivedCtor: IEntity, baseCtor: any) {
  Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
    Object.defineProperty(
      derivedCtor,
      name,
      Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || Object.create(null)
    );
  });
}

export function createEntity(): IEntity {
  return EntityRepository.createEntity();
}
