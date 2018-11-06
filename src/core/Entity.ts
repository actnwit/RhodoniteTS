type ComponentSID = number;
type ComponentTID = number;

export default class Entity {
  private __componentSIDs: Map<ComponentTID, ComponentSID>;
  private __entity_uid: number;
  private __isAlive: Boolean;

  constructor(entityUID: number, isAlive: Boolean) {
    this.__entity_uid = entityUID;
    this.__isAlive = isAlive;
    this.__componentSIDs = new Map();
  }
  
  get entityUid() {
    return this.__entity_uid;
  }
}
