import Entity from './Entity';
import Component from './Component';
import ComponentRepository from './ComponentRepository';
const singleton:any = Symbol();

export default class EntityRepository {
  private static __singleton: EntityRepository;
  private __entity_uid_count: number;
  private __entities: Array<Entity>;
  private static __singletonEnforcer:Symbol;
  private __componentRepository: ComponentRepository;
  private __components: Map<EntityUID, Map<ComponentTID, Component>>;
 
  private constructor(enforcer: Symbol) {
    if (enforcer !== EntityRepository.__singletonEnforcer || !(this instanceof EntityRepository)) {
      throw new Error('This is a Singleton class. get the instance using \'getInstance\' static method.');
    }

    EntityRepository.__singletonEnforcer = Symbol();

    this.__entity_uid_count = 0;

    this.__entities = [];
    this.__components = new Map();
    this.__componentRepository = ComponentRepository.getInstance();
  }

  static getInstance() {
    const thisClass = EntityRepository;
    if (!thisClass.__singleton) {
      thisClass.__singleton = new EntityRepository(thisClass.__singletonEnforcer);
    }
    return thisClass.__singleton;
  }

  createEntity(componentTidArray: Array<ComponentTID>) {
    const entity = new Entity(++this.__entity_uid_count, true);
    this.__entities.push(entity);
    for (let componentTid of componentTidArray) {
      const component = this.__componentRepository.createComponent(componentTid);
      const map = new Map();
      map.set(componentTid, component);
      this.__components.set(entity.entityUID, map);
    }

    return entity;
  }

}

