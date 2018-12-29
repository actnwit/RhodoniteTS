import Entity from './Entity';
import Component from './Component';
import ComponentRepository from './ComponentRepository';
import is from '../misc/IsUtil';

export default class EntityRepository {
  private __entity_uid_count: number;
  private __entities: Array<Entity>;
  private static __instance: EntityRepository;
  private __componentRepository: ComponentRepository;
  _components: Array<Map<ComponentTID, Component>>; // index is EntityUID

  private constructor() {

    this.__entity_uid_count = 0;

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

  createEntity(componentTidArray: Array<ComponentTID>): Entity {
    const entity = new Entity(++this.__entity_uid_count, true, this);
    this.__entities[this.__entity_uid_count] = entity;
    for (let componentTid of componentTidArray) {
      const component = this.__componentRepository.createComponent(componentTid, entity.entityUID);
      let map = this._components[entity.entityUID];
      if (map == null) {
        map = new Map();
        this._components[entity.entityUID] = map;
      }
      if (component != null) {
        map.set(componentTid, component);
      }
    }

    return entity;
  }

  getEntity(entityUid: EntityUID) {
    return this.__entities[entityUid];
  }

  getComponentOfEntity(entityUid: EntityUID, componentTid: ComponentTID): Component | null {
    const entity = this._components[entityUid];
    let component = null;
    if (entity != null) {
      component = entity.get(componentTid);
      if (component != null) {
        return component;
      } else {
        return null;
      }
    }
    return component;
  }

  static getMaxEntityNumber() {
    return 100000;
  }

  _getEntities() {
    return this.__entities.concat();
  }
}

