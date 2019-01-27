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
  private __uniqueName: string;
  private static __uniqueNames: string[] = [];
  private __entityRepository: EntityRepository;

  private __transformComponent?: TransformComponent;
  private __sceneGraphComponent?: SceneGraphComponent;

  constructor(entityUID: EntityUID, isAlive: Boolean, entityComponent: EntityRepository) {
    this.__entity_uid = entityUID;
    this.__isAlive = isAlive;
    this.__entityRepository = entityComponent;

    this.__uniqueName = 'entity_of_uid_' + entityUID;
    Entity.__uniqueNames[entityUID] =  this.__uniqueName;
  }

  get entityUID() {
    return this.__entity_uid;
  }

  getComponent(componentType: typeof Component): Component | null {
    const map = this.__entityRepository._components[this.entityUID];
    if (map != null) {
      const component = map.get(componentType.componentTID);
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
      this.__transformComponent = this.getComponent(TransformComponent) as TransformComponent;
    }
    return this.__transformComponent;
  }

  getSceneGraph(): SceneGraphComponent {
    if (this.__sceneGraphComponent == null) {
      this.__sceneGraphComponent = this.getComponent(SceneGraphComponent) as SceneGraphComponent;
    }
    return this.__sceneGraphComponent;
  }

  tryToSetUniqueName(name: string, toAddNameIfConflict: boolean): boolean {
    if (Entity.__uniqueNames.indexOf(name) !== -1) {
      // Conflict
      if (toAddNameIfConflict) {
        const newName = name + '_(' + this.__uniqueName + ')';
        if (Entity.__uniqueNames.indexOf(newName) === -1) {
          this.__uniqueName = newName;
          Entity.__uniqueNames[this.__entity_uid] = this.__uniqueName;
          return true;
        }
      }
      return false;
    } else {
      this.__uniqueName = name;
      Entity.__uniqueNames[this.__entity_uid] = this.__uniqueName;

      return true;
    }
  }

  get uniqueName() {
    return this.__uniqueName;
  }
}
