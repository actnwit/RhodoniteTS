import TransformComponent from '../components/Transform/TransformComponent';
import SceneGraphComponent from '../components/SceneGraph/SceneGraphComponent';
import Component from './Component';
import {WellKnownComponentTIDs} from '../components/WellKnownComponentTIDs';
import RnObject, {IRnObject} from './RnObject';
import {ComponentTID, EntityUID} from '../../types/CommonTypes';
import SkeletalComponent from '../components/SkeletalComponent';
import MeshComponent from '../components/MeshComponent';
import MeshRendererComponent from '../components/MeshRendererComponent';
import CameraComponent from '../components/CameraComponent';
import BlendShapeComponent from '../components/BlendShapeComponent';
import PhysicsComponent from '../components/PhysicsComponent';
import CameraControllerComponent from '../components/CameraControllerComponent';
import LightComponent from '../components/LightComponent';
import {Is} from '../misc/Is';
import AnimationComponent from '../components/AnimationComponent';

export type IEntity = IRnObject;

/**
 * The Rhodonite Entity Class which are an entities that exists in space.
 * Entities can acquire various functions by having components on themselves.
 */
export default class Entity extends RnObject {
  private readonly __entity_uid: number;
  static readonly invalidEntityUID = -1;
  private __isAlive: Boolean;

  private __components: Map<ComponentTID, Component> = new Map(); // index is ComponentTID

  protected __transformComponent?: TransformComponent;
  protected __sceneGraphComponent?: SceneGraphComponent;
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
    this.__components.set(
      (component.constructor as any).componentTID,
      component
    );
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

  /**
   * Get the TransformComponent of the entity.
   * It's a shortcut method of getComponent(TransformComponent).
   */
  getTransform(): TransformComponent | undefined {
    if (this.__transformComponent == null) {
      this.__transformComponent = this.getComponentByComponentTID(
        WellKnownComponentTIDs.TransformComponentTID
      ) as TransformComponent | undefined;
    }
    return this.__transformComponent;
  }

  /**
   * Get the SceneGraphComponent of the entity.
   * It's a shortcut method of getComponent(SceneGraphComponent).
   */
  getSceneGraph(): SceneGraphComponent | undefined {
    if (this.__sceneGraphComponent == null) {
      this.__sceneGraphComponent = this.getComponentByComponentTID(
        WellKnownComponentTIDs.SceneGraphComponentTID
      ) as SceneGraphComponent | undefined;
    }
    return this.__sceneGraphComponent;
  }

  getSkeletal(): SkeletalComponent | undefined {
    if (this.__skeletalComponent == null) {
      this.__skeletalComponent = this.getComponentByComponentTID(
        WellKnownComponentTIDs.SkeletalComponentTID
      ) as SkeletalComponent | undefined;
    }
    return this.__skeletalComponent;
  }

  getMesh(): MeshComponent | undefined {
    if (this.__meshComponent == null) {
      this.__meshComponent = this.getComponentByComponentTID(
        WellKnownComponentTIDs.MeshComponentTID
      ) as MeshComponent | undefined;
    }
    return this.__meshComponent;
  }

  getMeshRenderer(): MeshRendererComponent | undefined {
    if (this.__meshRendererComponent == null) {
      this.__meshRendererComponent = this.getComponentByComponentTID(
        WellKnownComponentTIDs.MeshRendererComponentTID
      ) as MeshRendererComponent | undefined;
    }
    return this.__meshRendererComponent;
  }

  getCamera(): CameraComponent | undefined {
    if (this.__cameraComponent == null) {
      this.__cameraComponent = this.getComponentByComponentTID(
        WellKnownComponentTIDs.CameraComponentTID
      ) as CameraComponent | undefined;
    }
    return this.__cameraComponent;
  }

  getCameraController(): CameraControllerComponent | undefined {
    if (this.__cameraControllerComponent == null) {
      this.__cameraControllerComponent = this.getComponentByComponentTID(
        WellKnownComponentTIDs.CameraControllerComponentTID
      ) as CameraControllerComponent | undefined;
    }
    return this.__cameraControllerComponent;
  }

  getBlendShape(): BlendShapeComponent | undefined {
    if (this.__blendShapeComponent == null) {
      this.__blendShapeComponent = this.getComponentByComponentTID(
        WellKnownComponentTIDs.BlendShapeComponentTID
      ) as BlendShapeComponent | undefined;
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

  getLight(): LightComponent | undefined {
    if (this.__lightComponent == null) {
      this.__lightComponent = this.getComponentByComponentTID(
        WellKnownComponentTIDs.LightComponentTID
      ) as LightComponent | undefined;
    }
    return this.__lightComponent;
  }

  getAnimation(): AnimationComponent | undefined {
    if (this.__animationComponent == null) {
      this.__animationComponent = this.getComponentByComponentTID(
        WellKnownComponentTIDs.AnimationComponentTID
      ) as AnimationComponent | undefined;
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
    const sceneComponent = this.getSceneGraph()!;
    const children = sceneComponent.children;
    for (const child of children) {
      if (child.entity.uniqueName === name) {
        return child.entity;
      }
    }
    return undefined;
  }
}
