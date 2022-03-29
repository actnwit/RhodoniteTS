import Entity, {IEntity} from './Entity';
import Component from './Component';
import ComponentRepository from './ComponentRepository';
import {RnTags, EntityUID, ComponentTID} from '../../types/CommonTypes';
import {valueWithCompensation} from '../misc/MiscUtil';
import {ComponentToComponentMethods} from '../components/ComponentTypes';
import RnObject from './RnObject';
import { Is } from '../misc/Is';

/**
 * The class that generates and manages entities.
 */
export default class EntityRepository {
  private __entity_uid_count: number;
  private __entities: Array<IEntity>;
  private static __instance: EntityRepository;
  private __componentRepository: ComponentRepository;
  _components: Array<Map<ComponentTID, Component>>; // index is EntityUID

  private constructor() {
    this.__entity_uid_count = Entity.invalidEntityUID;

    this.__entities = [];
    this._components = [];
    this.__componentRepository = ComponentRepository.getInstance();
  }

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new EntityRepository();
    }
    return this.__instance;
  }

  /**
   * Creates an entity
   */
  createEntity(): IEntity {
    const entity = new Entity(++this.__entity_uid_count, true);
    this.__entities[this.__entity_uid_count] = entity;

    return entity;
  }

  addComponentToEntity<
    ComponentType extends typeof Component,
    EntityType extends IEntity
  >(
    componentClass: ComponentType,
    entity: EntityType
  ): EntityType & ComponentToComponentMethods<ComponentType> {
    if (entity.hasComponent(componentClass)) {
      console.log('This entity already has the Component.');
      return entity as EntityType & ComponentToComponentMethods<ComponentType>;
    }

    // Create Component
    const component = this.__componentRepository.createComponent(
      componentClass.componentTID,
      entity.entityUID,
      this
    );

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
    const entityClass = component.addThisComponentToEntity(
      entity,
      componentClass
    );
    entity._setComponent(componentClass, component);

    return entity as unknown as typeof entityClass;
  }

  /**
   * Remove components from the entity.
   * Note: the returned entity's type will be IEntity (most basic type).
   *       You have to cast it to appropriate type later.
   * @param componentClass The class object of the component to remove.
   * @param entityUid The entityUID of the entity.
   */
  removeComponentFromEntity(
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
      component.destroy();
      map.delete(componentClass.componentTID);
    }

    return entity as IEntity;
  }

  /**
   * Gets the entity corresponding to the entityUID.
   * @param entityUid The entityUID of the entity.
   */
  getEntity(entityUid: EntityUID): IEntity {
    return this.__entities[entityUid];
  }

  /**
   * Gets the specified component from the entity.
   * @param entityUid The entity to get the component from.
   * @param componentType The class object of the component to get.
   */
  getComponentOfEntity(
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
  searchByTags(tags: RnTags) {
    const matchEntities = [];
    for (const entity of this.__entities) {
      if (entity.matchTags(tags)) {
        matchEntities.push(entity);
      }
    }
    return matchEntities;
  }

  /**
   * Gets entity by the unique name.
   * @param uniqueName The unique name of the entity.
   */
  getEntityByUniqueName(uniqueName: string): IEntity | undefined {
    for (const entity of this.__entities) {
      if (entity.uniqueName === uniqueName) {
        return entity;
      }
    }
    return void 0;
  }

  /**
   * @private
   * Gets all entities.
   */
  _getEntities(): IEntity[] {
    return this.__entities.filter(entity => entity._isAlive);
  }

  /**
   * Gets the number of all entities.
   */
  getEntitiesNumber(): number {
    const entities =  this.__entities.filter(entity => entity._isAlive);
    return entities.length;
  }
}

// This can live anywhere in your codebase:
export function applyMixins(derivedCtor: IEntity, baseCtor: any) {
  Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
    Object.defineProperty(
      derivedCtor,
      name,
      Object.getOwnPropertyDescriptor(baseCtor.prototype, name) ||
        Object.create(null)
    );
  });
}
