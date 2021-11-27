import Entity from './Entity';
import Component from './Component';
import ComponentRepository from './ComponentRepository';
import {RnTags, EntityUID, ComponentTID} from '../../types/CommonTypes';
import {Is} from '../misc/Is';
import {valueWithCompensation} from '../misc/MiscUtil';
/**
 * The class that generates and manages entities.
 */
export default class EntityRepository {
  private __entity_uid_count: number;
  private __entities: Array<Entity>;
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
   * Creates an entity which has the given types of the components
   * @param componentClasses The class objects of the components.
   */
  createEntity(componentClasses: Array<typeof Component>): Entity {
    const entity = new Entity(++this.__entity_uid_count, true);
    this.__entities[this.__entity_uid_count] = entity;

    return this.addComponentsToEntity(componentClasses, entity.entityUID);
  }

  /**
   * Add components to the entity.
   * @param componentClasses The class objects to set to the entity.
   * @param entityUid The entityUID of the entity.
   */
  addComponentsToEntity(
    componentClasses: Array<typeof Component>,
    entityUid: EntityUID
  ) {
    const entity: Entity = this.getEntity(entityUid);

    for (const componentClass of componentClasses) {
      const component = this.__componentRepository.createComponent(
        componentClass.componentTID,
        entityUid,
        this
      );

      if (Is.exist(component)) {
        const map = valueWithCompensation({
          value: this._components[entity.entityUID],
          compensation: () => {
            const map = new Map();
            this._components[entity.entityUID] = map;
            return map;
          },
        });
        map.set(componentClass.componentTID, component);
        entity._setComponent(component);
      }
    }

    return entity;
  }

  /**
   * Remove components from the entity.
   * @param componentClasses The class object of the components to remove.
   * @param entityUid The entityUID of the entity.
   */
  removeComponentsFromEntity(
    componentClasses: Array<typeof Component>,
    entityUid: EntityUID
  ) {
    const entity: Entity = this.getEntity(entityUid);

    for (const componentClass of componentClasses) {
      let map = this._components[entity.entityUID];
      if (map == null) {
        map = new Map();
        this._components[entity.entityUID] = map;
      }
      map.delete(componentClass.componentTID);
    }

    return entity;
  }

  /**
   * Gets the entity corresponding to the entityUID.
   * @param entityUid The entityUID of the entity.
   */
  getEntity(entityUid: EntityUID) {
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
  getEntityByUniqueName(uniqueName: string) {
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
  _getEntities() {
    return this.__entities.concat();
  }

  /**
   * Gets the number of all entities.
   */
  getEntitiesNumber() {
    return this.__entities.length;
  }
}
