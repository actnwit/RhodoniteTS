import type { Component } from './Component';
import { type IRnObject, RnObject } from './RnObject';
import type { ComponentTID, EntityUID } from '../../types/CommonTypes';
import { Is } from '../misc/Is';
import type { BlendShapeComponent } from '../components/BlendShape/BlendShapeComponent';
import { WellKnownComponentTIDs } from '../components/WellKnownComponentTIDs';
import type { CameraControllerComponent } from '../components/CameraController/CameraControllerComponent';
import type { LightComponent } from '../components/Light/LightComponent';
import type { MeshComponent } from '../components/Mesh/MeshComponent';
import type { MeshRendererComponent } from '../components/MeshRenderer/MeshRendererComponent';
import type { PhysicsComponent } from '../components/Physics/PhysicsComponent';
import type { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import type { SkeletalComponent } from '../components/Skeletal/SkeletalComponent';
import type { TransformComponent } from '../components/Transform/TransformComponent';
import type { AnimationComponent } from '../components/Animation/AnimationComponent';
import type { CameraComponent } from '../components/Camera/CameraComponent';
import type { VrmComponent } from '../components/Vrm/VrmComponent';
import type { ConstraintComponent } from '../components/Constraint/ConstraintComponent';
import type { EffekseerComponent } from '../../effekseer';
import type { AnimationStateComponent } from '../components/AnimationState/AnimationStateComponent';

/**
 * The Interface for an Entity.
 */
export interface IEntity extends IRnObject {
  entityUID: EntityUID;
  _isAlive: boolean;
  _myLatestCopyEntityUID: EntityUID;

  /**
   * Retrieves a component of the specified type from this entity.
   * @param componentType - The constructor/class of the component to retrieve
   * @returns The component instance if found, undefined otherwise
   */
  getComponent(componentType: typeof Component): Component | undefined;

  /**
   * Retrieves a component by its unique component type identifier.
   * @param componentTID - The component type identifier
   * @returns The component instance if found, undefined otherwise
   */
  getComponentByComponentTID(componentTID: ComponentTID): Component | undefined;

  /**
   * Sets a component on this entity.
   * @param componentType - The constructor/class of the component
   * @param com - The component instance to set
   * @internal
   */
  _setComponent(componentType: typeof Component, com: Component): void;

  /**
   * Checks whether this entity has a component of the specified type.
   * @param componentType - The constructor/class of the component to check
   * @returns True if the entity has the component, false otherwise
   */
  hasComponent(componentType: typeof Component): boolean;

  /**
   * Removes a component from this entity.
   * @param componentTID - The component type identifier to remove
   * @internal
   */
  _removeComponent(componentTID: ComponentTID): void;

  /**
   * Attempts to retrieve the BlendShapeComponent from this entity.
   * @returns The BlendShapeComponent if present, undefined otherwise
   */
  tryToGetBlendShape(): BlendShapeComponent | undefined;

  /**
   * Attempts to retrieve the CameraComponent from this entity.
   * @returns The CameraComponent if present, undefined otherwise
   */
  tryToGetCamera(): CameraComponent | undefined;

  /**
   * Attempts to retrieve the CameraControllerComponent from this entity.
   * @returns The CameraControllerComponent if present, undefined otherwise
   */
  tryToGetCameraController(): CameraControllerComponent | undefined;

  /**
   * Attempts to retrieve the LightComponent from this entity.
   * @returns The LightComponent if present, undefined otherwise
   */
  tryToGetLight(): LightComponent | undefined;

  /**
   * Attempts to retrieve the MeshComponent from this entity.
   * @returns The MeshComponent if present, undefined otherwise
   */
  tryToGetMesh(): MeshComponent | undefined;

  /**
   * Attempts to retrieve the MeshRendererComponent from this entity.
   * @returns The MeshRendererComponent if present, undefined otherwise
   */
  tryToGetMeshRenderer(): MeshRendererComponent | undefined;

  /**
   * Attempts to retrieve the PhysicsComponent from this entity.
   * @returns The PhysicsComponent if present, undefined otherwise
   */
  tryToGetPhysics(): PhysicsComponent | undefined;

  /**
   * Attempts to retrieve the SceneGraphComponent from this entity.
   * @returns The SceneGraphComponent if present, undefined otherwise
   */
  tryToGetSceneGraph(): SceneGraphComponent | undefined;

  /**
   * Attempts to retrieve the SkeletalComponent from this entity.
   * @returns The SkeletalComponent if present, undefined otherwise
   */
  tryToGetSkeletal(): SkeletalComponent | undefined;

  /**
   * Attempts to retrieve the TransformComponent from this entity.
   * @returns The TransformComponent if present, undefined otherwise
   */
  tryToGetTransform(): TransformComponent | undefined;

  /**
   * Attempts to retrieve the AnimationComponent from this entity.
   * @returns The AnimationComponent if present, undefined otherwise
   */
  tryToGetAnimation(): AnimationComponent | undefined;

  /**
   * Attempts to retrieve the AnimationStateComponent from this entity.
   * @returns The AnimationStateComponent if present, undefined otherwise
   */
  tryToGetAnimationState(): AnimationStateComponent | undefined;

  /**
   * Attempts to retrieve the VrmComponent from this entity.
   * @returns The VrmComponent if present, undefined otherwise
   */
  tryToGetVrm(): VrmComponent | undefined;

  /**
   * Attempts to retrieve the ConstraintComponent from this entity.
   * @returns The ConstraintComponent if present, undefined otherwise
   */
  tryToGetConstraint(): ConstraintComponent | undefined;

  /**
   * Attempts to retrieve the EffekseerComponent from this entity.
   * @returns The EffekseerComponent if present, undefined otherwise
   */
  tryToGetEffekseer(): EffekseerComponent | undefined;

  /**
   * Destroys this entity and releases all associated resources.
   * @internal
   */
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
   * Creates a new Entity instance.
   *
   * @remarks
   * When creating an Entity, use the createEntity method of the EntityRepository class
   * instead of directly calling this constructor.
   *
   * @param entityUID - The unique identifier for this entity
   * @param isAlive - Whether this entity is alive or not
   * @param components - Optional map of existing components to initialize with
   */
  constructor(entityUID: EntityUID, isAlive: boolean, components?: Map<ComponentTID, Component>) {
    super();
    this.___entity_uid = entityUID;
    this._isAlive = isAlive;

    this.__components = Is.exist(components) ? components : new Map();
  }

  /**
   * Gets the unique identifier of this entity.
   * @returns The entity's unique ID
   */
  get entityUID() {
    return this.___entity_uid;
  }

  /**
   * Sets a component on this entity.
   *
   * @remarks
   * This method associates a component instance with this entity using the component's type ID.
   * If a component of the same type already exists, it will be replaced.
   *
   * @param componentType - The constructor/class of the component to set
   * @param component - The component instance to attach to this entity
   *
   * @internal
   */
  _setComponent(componentType: typeof Component, component: Component): void {
    this.__components.set(componentType.componentTID, component);
  }

  /**
   * Checks whether this entity has a component of the specified type.
   *
   * @param componentType - The constructor/class of the component to check for
   * @returns True if the entity has a component of the specified type, false otherwise
   */
  hasComponent(componentType: typeof Component): boolean {
    return this.__components.has(componentType.componentTID);
  }

  /**
   * Retrieves a component of the specified type from this entity.
   *
   * @param componentType - The constructor/class of the component to retrieve
   * @returns The component instance if found, undefined if the entity doesn't have this component type
   */
  getComponent(componentType: typeof Component): Component | undefined {
    return this.__components.get(componentType.componentTID);
  }

  /**
   * Retrieves a component by its unique component type identifier.
   *
   * @param componentTID - The component type identifier to look up
   * @returns The component instance if found, undefined otherwise
   */
  getComponentByComponentTID(componentTID: ComponentTID): Component | undefined {
    return this.__components.get(componentTID);
  }

  /**
   * Removes a component from this entity by its component type identifier.
   *
   * @param componentTID - The component type identifier of the component to remove
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
   * Attempts to retrieve the AnimationComponent from this entity.
   *
   * @remarks
   * This is a convenience method that provides type-safe access to the AnimationComponent
   * without requiring explicit type casting.
   *
   * @returns The AnimationComponent if this entity has one, undefined otherwise
   */
  tryToGetAnimation() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.AnimationComponentTID) as
      | AnimationComponent
      | undefined;
  }

  /**
   * Attempts to retrieve the AnimationStateComponent from this entity.
   *
   * @remarks
   * This is a convenience method that provides type-safe access to the AnimationStateComponent
   * without requiring explicit type casting.
   *
   * @returns The AnimationStateComponent if this entity has one, undefined otherwise
   */
  tryToGetAnimationState() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.AnimationStateComponentTID) as
      | AnimationStateComponent
      | undefined;
  }

  /**
   * Attempts to retrieve the BlendShapeComponent from this entity.
   *
   * @remarks
   * This is a convenience method that provides type-safe access to the BlendShapeComponent
   * without requiring explicit type casting.
   *
   * @returns The BlendShapeComponent if this entity has one, undefined otherwise
   */
  tryToGetBlendShape() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.BlendShapeComponentTID) as
      | BlendShapeComponent
      | undefined;
  }

  /**
   * Attempts to retrieve the CameraComponent from this entity.
   *
   * @remarks
   * This is a convenience method that provides type-safe access to the CameraComponent
   * without requiring explicit type casting.
   *
   * @returns The CameraComponent if this entity has one, undefined otherwise
   */
  tryToGetCamera() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.CameraComponentTID) as CameraComponent | undefined;
  }

  /**
   * Attempts to retrieve the CameraControllerComponent from this entity.
   *
   * @remarks
   * This is a convenience method that provides type-safe access to the CameraControllerComponent
   * without requiring explicit type casting.
   *
   * @returns The CameraControllerComponent if this entity has one, undefined otherwise
   */
  tryToGetCameraController() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.CameraControllerComponentTID) as
      | CameraControllerComponent
      | undefined;
  }

  /**
   * Attempts to retrieve the LightComponent from this entity.
   *
   * @remarks
   * This is a convenience method that provides type-safe access to the LightComponent
   * without requiring explicit type casting.
   *
   * @returns The LightComponent if this entity has one, undefined otherwise
   */
  tryToGetLight() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.LightComponentTID) as LightComponent | undefined;
  }

  /**
   * Attempts to retrieve the MeshComponent from this entity.
   *
   * @remarks
   * This is a convenience method that provides type-safe access to the MeshComponent
   * without requiring explicit type casting.
   *
   * @returns The MeshComponent if this entity has one, undefined otherwise
   */
  tryToGetMesh() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.MeshComponentTID) as MeshComponent | undefined;
  }

  /**
   * Attempts to retrieve the MeshRendererComponent from this entity.
   *
   * @remarks
   * This is a convenience method that provides type-safe access to the MeshRendererComponent
   * without requiring explicit type casting.
   *
   * @returns The MeshRendererComponent if this entity has one, undefined otherwise
   */
  tryToGetMeshRenderer() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.MeshRendererComponentTID) as
      | MeshRendererComponent
      | undefined;
  }

  /**
   * Attempts to retrieve the PhysicsComponent from this entity.
   *
   * @remarks
   * This is a convenience method that provides type-safe access to the PhysicsComponent
   * without requiring explicit type casting.
   *
   * @returns The PhysicsComponent if this entity has one, undefined otherwise
   */
  tryToGetPhysics() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.PhysicsComponentTID) as PhysicsComponent | undefined;
  }

  /**
   * Attempts to retrieve the SceneGraphComponent from this entity.
   *
   * @remarks
   * This is a convenience method that provides type-safe access to the SceneGraphComponent
   * without requiring explicit type casting.
   *
   * @returns The SceneGraphComponent if this entity has one, undefined otherwise
   */
  tryToGetSceneGraph() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.SceneGraphComponentTID) as
      | SceneGraphComponent
      | undefined;
  }

  /**
   * Attempts to retrieve the SkeletalComponent from this entity.
   *
   * @remarks
   * This is a convenience method that provides type-safe access to the SkeletalComponent
   * without requiring explicit type casting.
   *
   * @returns The SkeletalComponent if this entity has one, undefined otherwise
   */
  tryToGetSkeletal() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.SkeletalComponentTID) as
      | SkeletalComponent
      | undefined;
  }

  /**
   * Attempts to retrieve the TransformComponent from this entity.
   *
   * @remarks
   * This is a convenience method that provides type-safe access to the TransformComponent
   * without requiring explicit type casting.
   *
   * @returns The TransformComponent if this entity has one, undefined otherwise
   */
  tryToGetTransform() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.TransformComponentTID) as
      | TransformComponent
      | undefined;
  }

  /**
   * Attempts to retrieve the VrmComponent from this entity.
   *
   * @remarks
   * This is a convenience method that provides type-safe access to the VrmComponent
   * without requiring explicit type casting.
   *
   * @returns The VrmComponent if this entity has one, undefined otherwise
   */
  tryToGetVrm() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.VrmComponentTID) as VrmComponent | undefined;
  }

  /**
   * Attempts to retrieve the ConstraintComponent from this entity.
   *
   * @remarks
   * This is a convenience method that provides type-safe access to the ConstraintComponent
   * without requiring explicit type casting.
   *
   * @returns The ConstraintComponent if this entity has one, undefined otherwise
   */
  tryToGetConstraint() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.ConstraintComponentTID) as
      | ConstraintComponent
      | undefined;
  }

  /**
   * Attempts to retrieve the EffekseerComponent from this entity.
   *
   * @remarks
   * This is a convenience method that provides type-safe access to the EffekseerComponent
   * without requiring explicit type casting.
   *
   * @returns The EffekseerComponent if this entity has one, undefined otherwise
   */
  tryToGetEffekseer() {
    return this.getComponentByComponentTID(WellKnownComponentTIDs.EffekseerComponentTID) as
      | EffekseerComponent
      | undefined;
  }

  /**
   * Destroys this entity and releases all associated resources.
   *
   * @remarks
   * This method calls the destroy method on all components attached to this entity
   * and marks the entity as no longer alive. After calling this method, the entity
   * should not be used.
   */
  _destroy() {
    this.__components.forEach(component => {
      component._destroy();
    });
    this._isAlive = false;
  }
}
