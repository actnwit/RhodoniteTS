const singleton:any = Symbol();

export default class Entity {
  private __entity_uid: number;
  private __isAlive: Boolean;
  static _enforcer: Symbol;

  constructor(entityUID: EntityUID, isAlive: Boolean, enforcer:Symbol) {
    if (enforcer !== Entity._enforcer) {
      throw new Error('You cannot use this constructor. Use entiryRepository.createEntity() method insterad.');
    }

    this.__entity_uid = entityUID;
    this.__isAlive = isAlive;
  }
  
  get entityUID() {
    return this.__entity_uid;
  }
}
Entity._enforcer = Symbol();
