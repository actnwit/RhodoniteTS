import EntityRepository from './EntityRepository';
import TransformComponent from '../components/TransformComponent';
import SceneGraphComponent from '../components/SceneGraphComponent';
import Component from './Component';
import { WellKnownComponentTIDs } from "../components/WellKnownComponentTIDs";
import RnObject from './RnObject';

/**
 * The Rhodonite Entity Class which are an entities that exists in space.
 * Entity can acquire those functions by having components on themselves.
 */
export default class Entity extends RnObject {
  private readonly __entity_uid: number;
  static readonly invalidEntityUID = -1;
  private __isAlive: Boolean;
  private static __instance: Entity;

  private __components: Component[] = [] // index is ComponentTID

  private __transformComponent?: TransformComponent;
  private __sceneGraphComponent?: SceneGraphComponent;

  /**
   * The constructor of the Entity class.
   * When creating an Entity, use the createEntity method of the EntityRepository class
   * instead of directly calling this constructor.
   * @param entityUID The unique ID of the entity
   * @param isAlive Whether this entity alive or not
   * @param entityComponent The instance of EntityComponent (Dependency Injection)
   */
  constructor(entityUID: EntityUID, isAlive: Boolean) {
    super();
    this.__entity_uid = entityUID;
    this.__isAlive = isAlive;
  }

  /**
   * Get Unique ID of the entity.
   */
  get entityUID() {
    return this.__entity_uid;
  }

  _setComponent(component: Component) {
    this.__components[(component.constructor as any).componentTID] = component;
  }


  /**
   * Get the component of the specified type that the entity has
   * @param componentType
   */
  getComponent(componentType: typeof Component): Component | null {
    return this.__components[componentType.componentTID];
  }

  /**
   * Get the TransformComponent of the entity.
   * It's a shortcut method of getComponent(TransformComponent).
   */
  getTransform(): TransformComponent {
    if (this.__transformComponent == null) {
      this.__transformComponent = this.getComponent(TransformComponent) as TransformComponent;
    }
    return this.__transformComponent;
  }

  /**
   * Get the SceneGraphComponent of the entity.
   * It's a shortcut method of getComponent(SceneGraphComponent).
   */
  getSceneGraph(): SceneGraphComponent {
    if (this.__sceneGraphComponent == null) {
      this.__sceneGraphComponent = this.getComponent(SceneGraphComponent) as SceneGraphComponent;
    }
    return this.__sceneGraphComponent;
  }

}
