import Entity from './Entity';

const singleton:any = Symbol();

export default class EntityRepository {
  private static __singleton: EntityRepository;
  private __entity_uid_count: number;
  private __entities: Array<Entity>;
  private static __singletonEnforcer:Symbol;
  
  private constructor(enforcer: Symbol) {
    if (enforcer !== EntityRepository.__singletonEnforcer || !(this instanceof EntityRepository)) {
      throw new Error('This is a Singleton class. get the instance using \'getInstance\' static method.');
    }

    EntityRepository.__singletonEnforcer = Symbol();

    this.__entity_uid_count = 0;

    this.__entities = [];
//    this.__lifeStatusOfEntities = new Map();
  }

  static getInstance() {
    const thisClass = EntityRepository;
    if (!thisClass.__singleton) {
      thisClass.__singleton = new EntityRepository(thisClass.__singletonEnforcer);
    }
    return thisClass.__singleton;
  }

  createEntity() {
    const entity = new Entity(++this.__entity_uid_count, true)
    this.__entities.push(entity);

    return entity;
  }

}

