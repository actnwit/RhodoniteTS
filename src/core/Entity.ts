
export default class Entity {
  private __entity_uid: number;
  private __isAlive: Boolean;

  constructor(entityUID: EntityUID, isAlive: Boolean) {
    this.__entity_uid = entityUID;
    this.__isAlive = isAlive;
  }
  
  get entityUID() {
    return this.__entity_uid;
  }
}
