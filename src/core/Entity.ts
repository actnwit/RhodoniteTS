import EntityRepository from './EntityRepository';
import TransformComponent from '../components/TransformComponent';
import SceneGraphComponent from '../components/SceneGraphComponent';
import Component from './Component';
import { WellKnownComponentTIDs } from "../components/WellKnownComponentTIDs";


export default class Entity {
  private __entity_uid: number;
  static readonly invalidEntityUID = -1;
  private __isAlive: Boolean;
  private static __instance: Entity;
  private __entityRepository: EntityRepository;

  private __transformComponent?: TransformComponent;
  private __sceneGraphComponent?: SceneGraphComponent;

  constructor(entityUID: EntityUID, isAlive: Boolean, entityComponent: EntityRepository) {
    this.__entity_uid = entityUID;
    this.__isAlive = isAlive;
    this.__entityRepository = entityComponent;
  }

  get entityUID() {
    return this.__entity_uid;
  }

  getComponent(componentTid: ComponentTID): Component | null {
    const map = this.__entityRepository._components[this.entityUID];
    if (map != null) {
      const component = map.get(componentTid);
      if (component != null) {
        return component;
      } else {
        return null;
      }
    }
    return null;
  }

  getTransform(): TransformComponent {
    if (this.__transformComponent == null) {
      this.__transformComponent = this.getComponent(WellKnownComponentTIDs.TransformComponentTID) as TransformComponent;
    }
    return this.__transformComponent;
  }

  getSceneGraph(): SceneGraphComponent {
    if (this.__sceneGraphComponent == null) {
      this.__sceneGraphComponent = this.getComponent(WellKnownComponentTIDs.SceneGraphComponentTID) as SceneGraphComponent;
    }
    return this.__sceneGraphComponent;
  }
}
