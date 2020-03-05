import TransformComponent from '../components/TransformComponent';
import SceneGraphComponent from '../components/SceneGraphComponent';
import Component from './Component';
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
    private readonly __entity_uid;
    static readonly invalidEntityUID = -1;
    private __isAlive;
    private static __instance;
    private __components;
    private __transformComponent?;
    private __sceneGraphComponent?;
    private __skeletalComponent?;
    private __meshComponent?;
    private __meshRendererComponent?;
    private __cameraComponent?;
    private __cameraControllerComponent?;
    private __blendShapeComponent?;
    private __physicsComponent?;
    /**
     * The constructor of the Entity class.
     * When creating an Entity, use the createEntity method of the EntityRepository class
     * instead of directly calling this constructor.
     * @param entityUID The unique ID of the entity
     * @param isAlive Whether this entity alive or not
     * @param entityComponent The instance of EntityComponent (Dependency Injection)
     */
    constructor(entityUID: EntityUID, isAlive: Boolean);
    /**
     * Get Unique ID of the entity.
     */
    get entityUID(): number;
    /**
     * @private
     * Sets a component to this entity.
     * @param component The component to set.
     */
    _setComponent(component: Component): void;
    /**
     * Get the component of the specified type that the entity has
     * @param componentType
     */
    getComponent(componentType: typeof Component): Component | null;
    /**
     * Gets the component corresponding to the ComponentTID.
     * @param componentTID The ComponentTID to get the component.
     */
    getComponentByComponentTID(componentTID: ComponentTID): Component | null;
    /**
     * Get the TransformComponent of the entity.
     * It's a shortcut method of getComponent(TransformComponent).
     */
    getTransform(): TransformComponent;
    /**
     * Get the SceneGraphComponent of the entity.
     * It's a shortcut method of getComponent(SceneGraphComponent).
     */
    getSceneGraph(): SceneGraphComponent;
    getSkeletal(): SkeletalComponent;
    getMesh(): MeshComponent;
    getMeshRenderer(): MeshRendererComponent;
    getCamera(): CameraComponent;
    getCameraController(): CameraControllerComponent;
    getBlendShape(): BlendShapeComponent;
    getPhysics(): PhysicsComponent;
}
