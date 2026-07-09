import type { Config } from '../../core/Config';
import type { ISceneGraphEntity } from '../../helpers';
import { type IQuaternion, type IVector3 } from '../../math';
import type { PhysicsPropertyInner } from '../PhysicsProperty';
import type { PhysicsStrategy } from '../PhysicsStrategy';
import type { PhysicsWorldProperty } from '../PhysicsWorldProperty';
type RapierVector3Like = {
    x: number;
    y: number;
    z: number;
};
type RapierQuaternionLike = {
    x: number;
    y: number;
    z: number;
    w: number;
};
type RapierRigidBodyDescLike = {
    setTranslation(x: number, y: number, z: number): RapierRigidBodyDescLike;
    setRotation(rotation: RapierQuaternionLike): RapierRigidBodyDescLike;
};
type RapierColliderDescLike = {
    setDensity?(density: number): RapierColliderDescLike;
    setFriction?(friction: number): RapierColliderDescLike;
    setRestitution?(restitution: number): RapierColliderDescLike;
};
type RapierRigidBodyLike = {
    translation(): RapierVector3Like;
    rotation(): RapierQuaternionLike;
    setTranslation(translation: RapierVector3Like, wakeUp: boolean): void;
    setRotation(rotation: RapierQuaternionLike, wakeUp: boolean): void;
};
type RapierColliderLike = unknown;
type RapierWorldLike = {
    step(): void;
    createRigidBody(desc: RapierRigidBodyDescLike): RapierRigidBodyLike;
    createCollider(desc: RapierColliderDescLike, rigidBody?: RapierRigidBodyLike): RapierColliderLike;
    removeRigidBody?(rigidBody: RapierRigidBodyLike): void;
};
export type RapierPhysicsModuleLike = {
    default?: RapierPhysicsModuleLike;
    init?: () => void | Promise<void>;
    World: new (gravity: RapierVector3Like) => RapierWorldLike;
    RigidBodyDesc: {
        dynamic(): RapierRigidBodyDescLike;
        fixed(): RapierRigidBodyDescLike;
    };
    ColliderDesc: {
        cuboid(x: number, y: number, z: number): RapierColliderDescLike;
        ball(radius: number): RapierColliderDescLike;
    };
};
/**
 * Physics strategy implementation using externally provided Rapier.js bindings.
 *
 * RhodoniteTS intentionally does not import Rapier directly. Call
 * RapierPhysicsStrategy.initialize(RAPIER) before creating this strategy.
 */
export declare class RapierPhysicsStrategy implements PhysicsStrategy {
    static __worldProperty: PhysicsWorldProperty;
    private static __rapier?;
    private static __world?;
    private __rigidBody?;
    private __collider?;
    private __entity?;
    private __property?;
    private __localScale;
    /**
     * Injects Rapier.js bindings and creates the shared physics world.
     * @param rapierModule - Rapier module or compat module default export
     * @param worldProperty - Optional world settings
     */
    static initialize(rapierModule: RapierPhysicsModuleLike, worldProperty?: PhysicsWorldProperty): Promise<void>;
    /**
     * Returns true when Rapier bindings have already been injected.
     */
    static get isInitialized(): boolean;
    constructor();
    /**
     * Sets up a Rapier rigid body and collider for the given entity.
     * @param prop - Physics properties defining shape and material values
     * @param entity - Scene graph entity associated with the physics body
     */
    setShape(prop: PhysicsPropertyInner, entity: ISceneGraphEntity): void;
    /**
     * Updates the associated entity transform from the Rapier body state.
     */
    update(_config: Config): void;
    /**
     * Sets the Rapier body world position.
     * @param worldPosition - New world position
     */
    setPosition(worldPosition: IVector3): void;
    /**
     * Sets the Rapier body world rotation.
     * @param worldRotation - New world rotation
     */
    setRotation(worldRotation: IQuaternion): void;
    /**
     * Sets the Rapier body world rotation from Euler angles.
     * @param eulerAngles - Euler angles in radians
     */
    setEulerAngle(eulerAngles: IVector3): void;
    /**
     * Recreates the Rapier body with a scaled collider shape.
     * @param worldScale - World scale
     */
    setScale(worldScale: IVector3): void;
    /**
     * Advances the shared Rapier physics world by one step.
     */
    static update(): void;
    private __createBody;
    private __createColliderDesc;
    private __removeBody;
    private static __assertInitialized;
    private static __getRapier;
    private static __getWorld;
    private static __eulerToQuaternion;
    private static __toRapierQuaternion;
}
export {};
