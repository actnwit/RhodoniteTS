import EntityRepository from './EntityRepository';
import TransformComponent from '../components/TransformComponent';

export default class Entity {
  private __entity_uid: number;
  private __isAlive: Boolean;
  static _enforcer: Symbol;
  private __entityRepository: EntityRepository
  private __transformComponent?: TransformComponent;

  constructor(entityUID: EntityUID, isAlive: Boolean, enforcer:Symbol) {
    if (enforcer !== Entity._enforcer) {
      throw new Error('You cannot use this constructor. Use entiryRepository.createEntity() method insterad.');
    }

    this.__entity_uid = entityUID;
    this.__isAlive = isAlive;
    this.__entityRepository = EntityRepository.getInstance();
    
  }

  get entityUID() {
    return this.__entity_uid;
  }

  getComponent(componentTid: ComponentTID) {
    const map = this.__entityRepository._components.get(this.entityUID);
    if (map != null) {
      const component = map.get(componentTid);
      return component;
    }
    return null;
  }

  getTransfrom(): TransformComponent {
    if (this.__transformComponent != null) {
      return this.__transformComponent;
    }
    return this.getComponent(TransformComponent.componentTID) as TransformComponent;
  }

}
Entity._enforcer = Symbol();
