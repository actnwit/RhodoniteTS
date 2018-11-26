import Entity from './Entity';
import Component from './Component';
import ComponentRepository from './ComponentRepository';
const singleton:any = Symbol();

export default class EntityRepository {
  private static __singleton: EntityRepository;
  private __entity_uid_count: number;
  private __entities: Array<Entity>;
  static __singletonEnforcer:Symbol;
  private __componentRepository: ComponentRepository;
  _components: Map<EntityUID, Map<ComponentTID, Component>>;
 
  private constructor(enforcer: Symbol) {
    if (enforcer !== EntityRepository.__singletonEnforcer || !(this instanceof EntityRepository)) {
      throw new Error('This is a Singleton class. get the instance using \'getInstance\' static method.');
    }

    this.__entity_uid_count = 0;

    this.__entities = [];
    this._components = new Map();
    this.__componentRepository = ComponentRepository.getInstance();
  }

  static getInstance() {
    const thisClass = EntityRepository;
    if (!thisClass.__singleton) {
      thisClass.__singleton = new EntityRepository(thisClass.__singletonEnforcer);
    }
    return thisClass.__singleton;
  }

  createEntity(componentTidArray: Array<ComponentTID>): Entity {
    const entity = new Entity(++this.__entity_uid_count, true, Entity._enforcer);
    this.__entities[this.__entity_uid_count] = entity;
    for (let componentTid of componentTidArray) {
      const component = this.__componentRepository.createComponent(componentTid, entity.entityUID);
      let map = this._components.get(entity.entityUID);
      if (!(map != null)) {
        map = new Map();
      }
      if (component != null) {
        map.set(componentTid, component);
      }
      this._components.set(entity.entityUID, map);
    }

    return entity;
  }

  getEntity(entityUid: EntityUID) {
    return this.__entities[entityUid];
  }

  static getMaxEntityNumber() {
    return 10000;
  }
}

EntityRepository.__singletonEnforcer = Symbol();
