import Entity from './Entity';

let singleton:any = Symbol();

export default class EntityRepository {
  private static singleton: EntityRepository;
  private __entity_uid_count: number;
  private __entities: Array<Entity>;
  private static __singletonEnforcer:Symbol;

  constructor(enforcer: Symbol) {
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
    if (!thisClass.singleton) {
      thisClass.singleton = new EntityRepository(thisClass.__singletonEnforcer);
    }
    return thisClass.singleton;
  }

  createEntity() {
    const entity = new Entity(++this.__entity_uid_count, true)
    this.__entities.push(entity);

    return entity;
  }

}

