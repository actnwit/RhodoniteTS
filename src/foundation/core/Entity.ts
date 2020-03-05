import EntityRepository from './EntityRepository';
import TransformComponent from '../components/TransformComponent';
import SceneGraphComponent from '../components/SceneGraphComponent';
import Component from './Component';
import { WellKnownComponentTIDs } from "../components/WellKnownComponentTIDs";
import RnObject from './RnObject';
import { ComponentTID, EntityUID } from '../../commontypes/CommonTypes';
import SkeletalComponent from '../components/SkeletalComponent';
import MeshComponent from '../components/MeshComponent';
import MeshRendererComponent from '../components/MeshRendererComponent';
import CameraComponent from '../components/CameraComponent';
import BlendShapeComponent from '../components/BlendShapeComponent';
import PhysicsComponent from '../components/PhysicsComponent';
import CameraControllerComponent from '../components/CameraControllerComponent';

/**
 * The Rhodonite Entity Class which are an entities that exists in space.
 * Entities can acquire various functions by having components on themselves.
 */
export default class Entity extends RnObject {
  private readonly __entity_uid: number;
  static readonly invalidEntityUID = -1;
  private __isAlive: Boolean;
  private static __instance: Entity;

  private __components: Component[] = [] // index is ComponentTID

  private __transformComponent?: TransformComponent;
  private __sceneGraphComponent?: SceneGraphComponent;
  private __skeletalComponent?: SkeletalComponent;
  private __meshComponent?: MeshComponent;
  private __meshRendererComponent?: MeshRendererComponent;
  private __cameraComponent?: CameraComponent;
  private __cameraControllerComponent?: CameraControllerComponent;
  private __blendShapeComponent?: BlendShapeComponent;
  private __physicsComponent?: PhysicsComponent;

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

  /**
   * @private
   * Sets a component to this entity.
   * @param component The component to set.
   */
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
   * Gets the component corresponding to the ComponentTID.
   * @param componentTID The ComponentTID to get the component.
   */
  getComponentByComponentTID(componentTID: ComponentTID): Component | null {
    return this.__components[componentTID];
  }

  /**
   * Get the TransformComponent of the entity.
   * It's a shortcut method of getComponent(TransformComponent).
   */
  getTransform(): TransformComponent {
    if (this.__transformComponent == null) {
      this.__transformComponent = this.getComponentByComponentTID(WellKnownComponentTIDs.TransformComponentTID) as TransformComponent;
    }
    return this.__transformComponent;
  }

  /**
   * Get the SceneGraphComponent of the entity.
   * It's a shortcut method of getComponent(SceneGraphComponent).
   */
  getSceneGraph(): SceneGraphComponent {
    if (this.__sceneGraphComponent == null) {
      this.__sceneGraphComponent = this.getComponentByComponentTID(WellKnownComponentTIDs.SceneGraphComponentTID) as SceneGraphComponent;
    }
    return this.__sceneGraphComponent;
  }

  getSkeletal(): SkeletalComponent {
    if (this.__skeletalComponent == null) {
      this.__skeletalComponent = this.getComponentByComponentTID(WellKnownComponentTIDs.SkeletalComponentTID) as SkeletalComponent;
    }
    return this.__skeletalComponent;
  }

  getMesh(): MeshComponent {
    if (this.__meshComponent == null) {
      this.__meshComponent = this.getComponentByComponentTID(WellKnownComponentTIDs.MeshComponentTID) as MeshComponent;
    }
    return this.__meshComponent;
  }

  getMeshRenderer(): MeshRendererComponent {
    if (this.__meshRendererComponent == null) {
      this.__meshRendererComponent = this.getComponentByComponentTID(WellKnownComponentTIDs.MeshRendererComponentTID) as MeshRendererComponent;
    }
    return this.__meshRendererComponent;
  }

  getCamera(): CameraComponent {
    if (this.__cameraComponent == null) {
      this.__cameraComponent = this.getComponentByComponentTID(WellKnownComponentTIDs.CameraComponentTID) as CameraComponent;
    }
    return this.__cameraComponent;
  }

  getCameraController(): CameraControllerComponent {
    if (this.__cameraControllerComponent == null) {
      this.__cameraControllerComponent = this.getComponentByComponentTID(WellKnownComponentTIDs.CameraControllerComponentTID) as CameraControllerComponent;
    }
    return this.__cameraControllerComponent;
  }

  getBlendShape(): BlendShapeComponent {
    if (this.__blendShapeComponent == null) {
      this.__blendShapeComponent = this.getComponentByComponentTID(WellKnownComponentTIDs.BlendShapeComponentTID) as BlendShapeComponent;
    }
    return this.__blendShapeComponent;
  }

  getPhysics(): PhysicsComponent {
    if (this.__physicsComponent == null) {
      this.__physicsComponent = this.getComponentByComponentTID(WellKnownComponentTIDs.PhysicsComponentTID) as PhysicsComponent;
    }
    return this.__physicsComponent;
  }
}
