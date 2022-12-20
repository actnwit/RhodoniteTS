import { Component } from './Component';
import { IRnObject, RnObject } from './RnObject';
import { ComponentTID, EntityUID } from '../../types/CommonTypes';
import { BlendShapeComponent } from '../components/BlendShape/BlendShapeComponent';
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
/**
 * The Interface for an Entity.
 */
export interface IEntity extends IRnObject {
    entityUID: EntityUID;
    _isAlive: boolean;
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
    tryToGetVrm(): VrmComponent | undefined;
    destroy(): void;
}
/**
 * The class that represents an entity.
 *
 * @remarks
 * The Rhodonite Entity Class which are an entities that exists in space.
 * Entities can acquire various functions by having components on themselves.
 */
export declare class Entity extends RnObject implements IEntity {
    /** The Unique ID of Entity */
    private readonly __entity_uid;
    /** The Map of components. All components must be managed in this map */
    protected __components: Map<ComponentTID, Component>;
    /** Invalid Entity UID constant value */
    static readonly invalidEntityUID = -1;
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
    constructor(entityUID: EntityUID, isAlive: boolean, components?: Map<ComponentTID, Component>);
    /**
     * Get Unique ID of the entity.
     */
    get entityUID(): number;
    /**
     * Sets a component to this entity.
     * @param component The component to set.
     *
     * @internal
     */
    _setComponent(componentType: typeof Component, component: Component): void;
    /**
     * return whether this entity has the component or not
     * @param componentType - The component to check
     * @returns
     */
    hasComponent(componentType: typeof Component): boolean;
    /**
     * Get the component of the specified type that the entity has
     * @param componentType
     */
    getComponent(componentType: typeof Component): Component | undefined;
    /**
     * Gets the component corresponding to the ComponentTID.
     * @param componentTID - The ComponentTID to get the component.
     */
    getComponentByComponentTID(componentTID: ComponentTID): Component | undefined;
    /**
     * @param componentTID
     *
     * @internal
     */
    _removeComponent(componentTID: ComponentTID): void;
    /**
     * try to get an Animation Component if the entity has it.
     * @returns AnimationComponent | undefined
     */
    tryToGetAnimation(): AnimationComponent | undefined;
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
    tryToGetVrm(): VrmComponent | undefined;
    /**
     * Mark the entity as destroyed
     */
    destroy(): void;
}
