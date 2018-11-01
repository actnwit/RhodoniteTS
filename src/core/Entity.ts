type ComponentSID = number;
type ComponentTID = number;

export default class Entity {
  __componentSIDs: Map<ComponentTID, ComponentSID>;
  __entity_uid: number;
  __isAlive: Boolean;

  constructor(entityUID: number, isAlive: Boolean) {
    this.__entity_uid = entityUID;
    this.__isAlive = isAlive;
    this.__componentSIDs = new Map();
  }

}
