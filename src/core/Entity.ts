import EntityRepository from './EntityRepository';
import TransformComponent from '../components/TransformComponent';
import SceneGraphComponent from '../components/SceneGraphComponent';

export default class Entity {
  private __entity_uid: number;
  private __isAlive: Boolean;
  static _enforcer: Symbol;
  private __entityRepository: EntityRepository;

  private __transformComponent?: TransformComponent;
  private __sceneGraphComponent?: SceneGraphComponent;

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

  getTransform(): TransformComponent {
    if (this.__transformComponent != null) {
      return this.__transformComponent;
    }
    return this.getComponent(TransformComponent.componentTID) as TransformComponent;
  }

  getScenGraph(): SceneGraphComponent {
    if (this.__sceneGraphComponent != null) {
      return this.__sceneGraphComponent;
    }
    return this.getComponent(SceneGraphComponent.componentTID) as SceneGraphComponent;
  }
}
Entity._enforcer = Symbol();
