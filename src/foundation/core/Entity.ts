import Component from './Component';
import RnObject, {IRnObject} from './RnObject';
import {ComponentTID, EntityUID} from '../../types/CommonTypes';
import { Is } from '../misc/Is';

export interface IEntity extends IRnObject {
  entityUID: EntityUID;
  getComponent(componentType: typeof Component): Component | undefined;
  getComponentByComponentTID(componentTID: ComponentTID): Component | undefined;
  _setComponent(componentType: typeof Component, com: Component): void;
  _getComponentsInner(): Map<ComponentTID, Component>;
}

/**
 * The Rhodonite Entity Class which are an entities that exists in space.
 * Entities can acquire various functions by having components on themselves.
 */
export default class Entity extends RnObject implements IEntity {
  private readonly __entity_uid: number;
  static readonly invalidEntityUID = -1;
  private __isAlive: Boolean;
  protected __components: Map<ComponentTID, Component>; // index is ComponentTID

  /**
   * The constructor of the Entity class.
   * When creating an Entity, use the createEntity method of the EntityRepository class
   * instead of directly calling this constructor.
   * @param entityUID The unique ID of the entity
   * @param isAlive Whether this entity alive or not
   * @param entityComponent The instance of EntityComponent (Dependency Injection)
   */
  constructor(
    entityUID: EntityUID,
    isAlive: Boolean,
    components?: Map<ComponentTID, Component>
  ) {
    super();
    this.__entity_uid = entityUID;
    this.__isAlive = isAlive;

    this.__components = Is.exist(components) ? components : new Map();
  }

  /**
   * Get Unique ID of the entity.
   */
  get entityUID() {
    return this.__entity_uid;
  }

  /**
   * @private
   * Sets a component to this entity.
   * @param component The component to set.
   */
  _setComponent(componentType: typeof Component, component: Component): void {
    this.__components.set(componentType.componentTID, component);
  }

  /**
   * Get the component of the specified type that the entity has
   * @param componentType
   */
  getComponent(componentType: typeof Component): Component | undefined {
    return this.__components.get(componentType.componentTID);
  }

  /**
   * Gets the component corresponding to the ComponentTID.
   * @param componentTID The ComponentTID to get the component.
   */
  getComponentByComponentTID(
    componentTID: ComponentTID
  ): Component | undefined {
    return this.__components.get(componentTID);
  }

  _getComponentsInner() {
    return this.__components;
  }
}
