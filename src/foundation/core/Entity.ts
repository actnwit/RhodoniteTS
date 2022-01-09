import TransformComponent from '../components/TransformComponent';
import SceneGraphComponent from '../components/SceneGraphComponent';
import Component from './Component';
import {WellKnownComponentTIDs} from '../components/WellKnownComponentTIDs';
import RnObject from './RnObject';
import {ComponentTID, EntityUID} from '../../types/CommonTypes';
import SkeletalComponent from '../components/SkeletalComponent';
import MeshComponent from '../components/MeshComponent';
import MeshRendererComponent from '../components/MeshRendererComponent';
import CameraComponent from '../components/CameraComponent';
import BlendShapeComponent from '../components/BlendShapeComponent';
import PhysicsComponent from '../components/PhysicsComponent';
import CameraControllerComponent from '../components/CameraControllerComponent';
import LightComponent from '../components/LightComponent';
import { Is } from '../misc/Is';
import AnimationComponent from '../components/AnimationComponent';

/**
 * The Rhodonite Entity Class which are an entities that exists in space.
 * Entities can acquire various functions by having components on themselves.
 */
export default class Entity extends RnObject {
  private readonly __entity_uid: number;
  static readonly invalidEntityUID = -1;
  private __isAlive: Boolean;

  private __components: Component[] = []; // index is ComponentTID

  private __transformComponent?: TransformComponent;
  private __sceneGraphComponent?: SceneGraphComponent;
  private __skeletalComponent?: SkeletalComponent;
  private __meshComponent?: MeshComponent;
  private __meshRendererComponent?: MeshRendererComponent;
  private __cameraComponent?: CameraComponent;
  private __cameraControllerComponent?: CameraControllerComponent;
  private __blendShapeComponent?: BlendShapeComponent;
  private __physicsComponent?: PhysicsComponent;
  private __lightComponent?: LightComponent;
  private __animationComponent?: AnimationComponent;

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
      this.__transformComponent = this.getComponentByComponentTID(
        WellKnownComponentTIDs.TransformComponentTID
      ) as TransformComponent;
    }
    return this.__transformComponent;
  }

  /**
   * Get the SceneGraphComponent of the entity.
   * It's a shortcut method of getComponent(SceneGraphComponent).
   */
  getSceneGraph(): SceneGraphComponent {
    if (this.__sceneGraphComponent == null) {
      this.__sceneGraphComponent = this.getComponentByComponentTID(
        WellKnownComponentTIDs.SceneGraphComponentTID
      ) as SceneGraphComponent;
    }
    return this.__sceneGraphComponent;
  }

  getSkeletal(): SkeletalComponent {
    if (this.__skeletalComponent == null) {
      this.__skeletalComponent = this.getComponentByComponentTID(
        WellKnownComponentTIDs.SkeletalComponentTID
      ) as SkeletalComponent;
    }
    return this.__skeletalComponent;
  }

  getMesh(): MeshComponent {
    if (this.__meshComponent == null) {
      this.__meshComponent = this.getComponentByComponentTID(
        WellKnownComponentTIDs.MeshComponentTID
      ) as MeshComponent;
    }
    return this.__meshComponent;
  }

  getMeshRenderer(): MeshRendererComponent {
    if (this.__meshRendererComponent == null) {
      this.__meshRendererComponent = this.getComponentByComponentTID(
        WellKnownComponentTIDs.MeshRendererComponentTID
      ) as MeshRendererComponent;
    }
    return this.__meshRendererComponent;
  }

  getCamera(): CameraComponent {
    if (this.__cameraComponent == null) {
      this.__cameraComponent = this.getComponentByComponentTID(
        WellKnownComponentTIDs.CameraComponentTID
      ) as CameraComponent;
    }
    return this.__cameraComponent;
  }

  getCameraController(): CameraControllerComponent {
    if (this.__cameraControllerComponent == null) {
      this.__cameraControllerComponent = this.getComponentByComponentTID(
        WellKnownComponentTIDs.CameraControllerComponentTID
      ) as CameraControllerComponent;
    }
    return this.__cameraControllerComponent;
  }

  getBlendShape(): BlendShapeComponent {
    if (this.__blendShapeComponent == null) {
      this.__blendShapeComponent = this.getComponentByComponentTID(
        WellKnownComponentTIDs.BlendShapeComponentTID
      ) as BlendShapeComponent;
    }
    return this.__blendShapeComponent;
  }

  getPhysics(): PhysicsComponent {
    if (this.__physicsComponent == null) {
      this.__physicsComponent = this.getComponentByComponentTID(
        WellKnownComponentTIDs.PhysicsComponentTID
      ) as PhysicsComponent;
    }
    return this.__physicsComponent;
  }

  getLight(): LightComponent {
    if (this.__lightComponent == null) {
      this.__lightComponent = this.getComponentByComponentTID(
        WellKnownComponentTIDs.LightComponentTID
      ) as LightComponent;
    }
    return this.__lightComponent;
  }

  getAnimation(): AnimationComponent {
    if (this.__animationComponent == null) {
      this.__animationComponent = this.getComponentByComponentTID(
        WellKnownComponentTIDs.AnimationComponentTID
      ) as AnimationComponent;
    }
    return this.__animationComponent;
  }

  get worldMatrixInner() {
    const skeletalComponent = this.getSkeletal() as
      | SkeletalComponent
      | undefined;
    if (Is.exist(skeletalComponent) && skeletalComponent.isWorldMatrixUpdated) {
      return skeletalComponent.worldMatrixInner;
    } else {
      const sceneGraphComponent = this.getSceneGraph();
      if (Is.exist(sceneGraphComponent)) {
        return sceneGraphComponent.worldMatrixInner;
      }
    }
    return undefined;
  }

  get worldMatrix() {
    return this.worldMatrixInner?.clone();
  }

  getChildByName(name: string) {
    const sceneComponent = this.getSceneGraph();
    const children = sceneComponent.children;
    for (const child of children) {
      if (child.entity.uniqueName === name) {
        return child.entity;
      }
    }
    return undefined;
  }
}
