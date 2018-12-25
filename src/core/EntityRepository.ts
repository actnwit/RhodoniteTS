import Entity from './Entity';
import Component from './Component';
import ComponentRepository from './ComponentRepository';
const singleton:any = Symbol();

export default class EntityRepository {
  private __entity_uid_count: number;
  private __entities: Array<Entity>;
  static __singletonEnforcer:Symbol;
  private __componentRepository: ComponentRepository;
  _components: Array<Map<ComponentTID, Component>>; // index is EntityUID

  private constructor(enforcer: Symbol) {
    if (enforcer !== EntityRepository.__singletonEnforcer || !(this instanceof EntityRepository)) {
      throw new Error('This is a Singleton class. get the instance using \'getInstance\' static method.');
    }

    this.__entity_uid_count = 0;

    this.__entities = [];
    this._components = [];
    this.__componentRepository = ComponentRepository.getInstance();
  }

  static getInstance() {
    const thisClass = EntityRepository;
    if (!(thisClass as any)[singleton]) {
      (thisClass as any)[singleton] = new EntityRepository(thisClass.__singletonEnforcer);
    }
    return (thisClass as any)[singleton];

  }

  createEntity(componentTidArray: Array<ComponentTID>): Entity {
    const entity = new Entity(++this.__entity_uid_count, true, Entity._enforcer, this);
    this.__entities[this.__entity_uid_count] = entity;
    for (let componentTid of componentTidArray) {
      const component = this.__componentRepository.createComponent(componentTid, entity.entityUID);
      let map = this._components[entity.entityUID];
      if (!(map != null)) {
        map = new Map();
      }
      if (component != null) {
        map.set(componentTid, component);
      }
      this._components[entity.entityUID] = map;
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
    return 5000;
  }

  _getEntities() {
    return this.__entities.concat();
  }
}

EntityRepository.__singletonEnforcer = Symbol();
