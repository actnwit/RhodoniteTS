import Entity from './Entity';
import Component from './Component';
import ComponentRepository from './ComponentRepository';
import is from '../misc/IsUtil';
import { WellKnownComponentTIDs } from '../components/WellKnownComponentTIDs';
import { match } from 'minimatch';

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

  createEntity(componentClasses: Array<typeof Component>): Entity {
    const entity = new Entity(++this.__entity_uid_count, true, this);
    this.__entities[this.__entity_uid_count] = entity;

    return this.addComponentsToEntity(componentClasses, entity.entityUID);
  }

  addComponentsToEntity(componentClasses: Array<typeof Component>, entityUid: EntityUID) {
    const entity: Entity = this.getEntity(entityUid);

    for (let componentClass of componentClasses) {
      const component = this.__componentRepository.createComponent(componentClass.componentTID, entityUid, this);
      let map = this._components[entity.entityUID];
      if (map == null) {
        map = new Map();
        this._components[entity.entityUID] = map;
      }
      if (component != null) {
        map.set(componentClass.componentTID, component);
      }
    }

    return entity;
  }

  removeComponentsFromEntity(componentClasses: Array<typeof Component>, entityUid: EntityUID) {
    const entity: Entity = this.getEntity(entityUid);

    for (let componentClass of componentClasses) {
      let map = this._components[entity.entityUID];
      if (map == null) {
        map = new Map();
        this._components[entity.entityUID] = map;
      }
      map.delete(componentClass.componentTID);
    }

    return entity;
  }

  getEntity(entityUid: EntityUID) {
    return this.__entities[entityUid];
  }

  getComponentOfEntity(entityUid: EntityUID, componentType: typeof Component): Component | null {
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

  searchByTags(tags: RnTag[]) {
    const matchEntites = [];
    for (let entity of this.__entities) {
      if (entity.matchTagConblied(tags)) {
        matchEntites.push(entity);
      }
    }
    return matchEntites;
  }

  _getEntities() {
    return this.__entities.concat();
  }
}

