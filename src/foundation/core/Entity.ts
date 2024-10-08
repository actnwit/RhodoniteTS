import { Component } from './Component';
import { IRnObject, RnObject } from './RnObject';
import { ComponentTID, EntityUID } from '../../types/CommonTypes';
import { Is } from '../misc/Is';
import { BlendShapeComponent } from '../components/BlendShape/BlendShapeComponent';
import { WellKnownComponentTIDs } from '../components/WellKnownComponentTIDs';
import { CameraControllerComponent } from '../components/CameraController/CameraControllerComponent';
import { LightComponent } from '../components/Light/LightComponent';
import { MeshComponent } from '../components/Mesh/MeshComponent';
import { MeshRendererComponent } from '../components/MeshRenderer/MeshRendererComponent';
import { PhysicsComponent } from '../components/Physics/PhysicsComponent';
import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { SkeletalComponent } from '../components/Skeletal/SkeletalComponent';
import { TransformComponent } from '../components/Transform/TransformComponent';
import { AnimationComponent } from '../components/Animation/AnimationComponent';
import { CameraComponent } from '../components/Camera/CameraComponent';
import { VrmComponent } from '../components/Vrm/VrmComponent';
import { ConstraintComponent } from '../components/Constraint/ConstraintComponent';
import { EffekseerComponent } from '../../effekseer';
import { AnimationStateComponent } from '../components/AnimationState/AnimationStateComponent';

/**
 * The Interface for an Entity.
 */
export interface IEntity extends IRnObject {
  entityUID: EntityUID;
  _isAlive: boolean;
  _myLatestCopyEntityUID: EntityUID;
  getComponent(componentType: typeof Component): Component | undefined;
  getComponentByComponentTID(componentTID: ComponentTID): Component | undefined;
  _setComponent(componentType: typeof Component, com: Component): void;
  hasComponent(componentType: typeof Component): boolean;
  _removeComponent(componentTID: ComponentTID): void;
  tryToGetBlendShape(): BlendShapeComponent | undefined;
  tryToGetCamera(): CameraComponent | undefined;
  tryToGetCameraController(): CameraControllerComponent | undefined;
  tryToGetLight(): LightComponent | undefined;
  tryToGetMesh(): MeshComponent | undefined;
  tryToGetMeshRenderer(): MeshRendererComponent | undefined;
  tryToGetPhysics(): PhysicsComponent | undefined;
  tryToGetSceneGraph(): SceneGraphComponent | undefined;
  tryToGetSkeletal(): SkeletalComponent | undefined;
  tryToGetTransform(): TransformComponent | undefined;
  tryToGetAnimation(): AnimationComponent | undefined;
  tryToGetAnimationState(): AnimationStateComponent | undefined;
  tryToGetVrm(): VrmComponent | undefined;
  tryToGetConstraint(): ConstraintComponent | undefined;
  tryToGetEffekseer(): EffekseerComponent | undefined;
  _destroy(): void;
}

/**
 * The class that represents an entity.
 *
 * @remarks
 * The Rhodonite Entity Class which are an entities that exists in space.
 * Entities can acquire various functions by having components on themselves.
 */
export class Entity extends RnObject implements IEntity {
  /** The Unique ID of Entity */
  private readonly ___entity_uid: number;

  /** The Map of components. All components must be managed in this map */
  protected __components: Map<ComponentTID, Component>; // index is ComponentTID

  /** Invalid Entity UID constant value */
  static readonly invalidEntityUID = -1;
  public _myLatestCopyEntityUID = Entity.invalidEntityUID;

  /** No use yet */
  _isAlive: boolean;

  /**
   * The constructor of the Entity class.
   *
   * @remarks
   * When creating an Entity, use the createEntity method of the EntityRepository class
   * instead of directly calling this constructor.
   *
   * @param entityUID - The unique ID of the entity
   * @param isAlive - Whether this entity alive or not
   * @param entityComponent - The instance of EntityComponent (Dependency Injection)
   */
  constructor(entityUID: EntityUID, isAlive: boolean, components?: Map<ComponentTID, Component>) {
    super();
    this.___entity_uid = entityUID;
    this._isAlive = isAlive;

    this.__components = Is.exist(components) ? components : new Map();
  }

  /**
   * Get Unique ID of the entity.
   */
  get entityUID() {
    return this.___entity_uid;
  }

  /**
   * Sets a component to this entity.
   * @param component The component to set.
   *
   * @internal
   */
  _setComponent(componentType: typeof Component, component: Component): void {
    this.__components.set(componentType.componentTID, component);
  }

  /**
   * return whether this entity has the component or not
   * @param componentType - The component to check
   * @returns
   */
  hasComponent(componentType: typeof Component): boolean {
    return this.__components.has(componentType.componentTID);
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
   * @param componentTID - The ComponentTID to get the component.
   */
  getComponentByComponentTID(componentTID: ComponentTID): Component | undefined {
    return this.__components.get(componentTID);
  }

  /**
   * @param componentTID
   *
   * @internal
   */
  _removeComponent(componentTID: ComponentTID) {
    this.__components.delete(componentTID);
  }

  ///
  /// tryToGet methods
  ///

  /**
   * try to get an Animation Component if the entity has it.
   * @returns AnimationComponent | undefined
   */
  tryToGetAnimation() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.AnimationComponentTID) as
      | AnimationComponent
      | undefined;
  }

  tryToGetAnimationState() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.AnimationStateComponentTID) as
      | AnimationStateComponent
      | undefined;
  }

  tryToGetBlendShape() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.BlendShapeComponentTID) as
      | BlendShapeComponent
      | undefined;
  }

  tryToGetCamera() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.CameraComponentTID) as
      | CameraComponent
      | undefined;
  }

  tryToGetCameraController() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.CameraControllerComponentTID) as
      | CameraControllerComponent
      | undefined;
  }

  tryToGetLight() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.LightComponentTID) as
      | LightComponent
      | undefined;
  }

  tryToGetMesh() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.MeshComponentTID) as
      | MeshComponent
      | undefined;
  }

  tryToGetMeshRenderer() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.MeshRendererComponentTID) as
      | MeshRendererComponent
      | undefined;
  }

  tryToGetPhysics() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.PhysicsComponentTID) as
      | PhysicsComponent
      | undefined;
  }

  tryToGetSceneGraph() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.SceneGraphComponentTID) as
      | SceneGraphComponent
      | undefined;
  }

  tryToGetSkeletal() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.SkeletalComponentTID) as
      | SkeletalComponent
      | undefined;
  }

  tryToGetTransform() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.TransformComponentTID) as
      | TransformComponent
      | undefined;
  }

  tryToGetVrm() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.VrmComponentTID) as
      | VrmComponent
      | undefined;
  }

  tryToGetConstraint() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.ConstraintComponentTID) as
      | ConstraintComponent
      | undefined;
  }

  tryToGetEffekseer() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.EffekseerComponentTID) as
      | EffekseerComponent
      | undefined;
  }

  /**
   * Mark the entity as destroyed
   */
  _destroy() {
    this.__components.forEach((component) => {
      component._destroy();
    });
    this._isAlive = false;
  }
}
