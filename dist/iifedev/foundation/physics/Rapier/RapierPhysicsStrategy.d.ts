import type { Config } from '../../core/Config';
import type { ShapeInstance } from '../../geometry/Shape';
import type { ISceneGraphEntity } from '../../helpers';
import { type IQuaternion, type IVector3 } from '../../math';
import type { Engine } from '../../system/Engine';
import type { PhysicsBodyProperty, PhysicsColliderProperty, PhysicsMotionProperty, PhysicsPropertyInner } from '../PhysicsProperty';
import type { PhysicsShapeInstanceBinding, PhysicsStrategy } from '../PhysicsStrategy';
import type { PhysicsWorldProperty } from '../PhysicsWorldProperty';
export type RapierVector3Like = {
    x: number;
    y: number;
    z: number;
};
export type RapierQuaternionLike = {
    x: number;
    y: number;
    z: number;
    w: number;
};
export type RapierRigidBodyDescLike = {
    setTranslation(x: number, y: number, z: number): RapierRigidBodyDescLike;
    setRotation(rotation: RapierQuaternionLike): RapierRigidBodyDescLike;
    setLinvel?(x: number, y: number, z: number): RapierRigidBodyDescLike;
    setAngvel?(velocity: RapierVector3Like): RapierRigidBodyDescLike;
    setGravityScale?(factor: number): RapierRigidBodyDescLike;
};
export type RapierColliderDescLike = {
    setTranslation?(x: number, y: number, z: number): RapierColliderDescLike;
    setRotation?(rotation: RapierQuaternionLike): RapierColliderDescLike;
    setDensity?(density: number): RapierColliderDescLike;
    setFriction?(friction: number): RapierColliderDescLike;
    setRestitution?(restitution: number): RapierColliderDescLike;
    setCollisionGroups?(groups: number): RapierColliderDescLike;
    setSensor?(sensor: boolean): RapierColliderDescLike;
    setActiveEvents?(events: number): RapierColliderDescLike;
    setActiveCollisionTypes?(types: number): RapierColliderDescLike;
};
export type RapierRigidBodyLike = {
    translation(): RapierVector3Like;
    rotation(): RapierQuaternionLike;
    setTranslation(translation: RapierVector3Like, wakeUp: boolean): void;
    setRotation(rotation: RapierQuaternionLike, wakeUp: boolean): void;
    setNextKinematicTranslation?(translation: RapierVector3Like): void;
    setNextKinematicRotation?(rotation: RapierQuaternionLike): void;
    mass?(): number;
    localCom?(): RapierVector3Like;
    principalInertia?(): RapierVector3Like;
    principalInertiaLocalFrame?(): RapierQuaternionLike;
    recomputeMassPropertiesFromColliders?(): void;
    setAdditionalMassProperties?(mass: number, centerOfMass: RapierVector3Like, principalAngularInertia: RapierVector3Like, angularInertiaLocalFrame: RapierQuaternionLike, wakeUp: boolean): void;
};
export type RapierColliderLike = {
    handle?: number;
    isSensor?(): boolean;
    setDensity?(density: number): void;
};
export type RapierRayIntersectionLike = {
    collider: RapierColliderLike;
    timeOfImpact: number;
    normal: RapierVector3Like;
};
export type RapierShapeCastHitLike = {
    collider: RapierColliderLike;
    time_of_impact: number;
    normal1: RapierVector3Like;
    witness1: RapierVector3Like;
    normal2: RapierVector3Like;
    witness2: RapierVector3Like;
};
export type RapierColliderMetadata = {
    entity: ISceneGraphEntity;
    bindingId?: number;
    isSensor: boolean;
};
export type RapierCharacterControllerLike = {
    enableAutostep(maxHeight: number, minWidth: number, includeDynamicBodies: boolean): void;
    enableSnapToGround(distance: number): void;
    setMaxSlopeClimbAngle(angle: number): void;
    setMinSlopeSlideAngle(angle: number): void;
    setApplyImpulsesToDynamicBodies(enabled: boolean): void;
    setNormalNudgeFactor?(value: number): void;
    computeColliderMovement(collider: RapierColliderLike, desiredTranslationDelta: RapierVector3Like, filterFlags?: number, filterGroups?: number, filterPredicate?: (collider: RapierColliderLike) => boolean): void;
    computedMovement(): RapierVector3Like;
    computedGrounded(): boolean;
    numComputedCollisions?(): number;
    computedCollision?(index: number): RapierCharacterCollisionLike | null;
};
export type RapierCharacterCollisionLike = {
    normal1: RapierVector3Like;
};
export type RapierWorldLike = {
    step(eventQueue?: RapierEventQueueLike): void;
    createRigidBody(desc: RapierRigidBodyDescLike): RapierRigidBodyLike;
    createCollider(desc: RapierColliderDescLike, rigidBody?: RapierRigidBodyLike): RapierColliderLike;
    removeRigidBody?(rigidBody: RapierRigidBodyLike): void;
    createCharacterController?(offset: number): RapierCharacterControllerLike;
    removeCharacterController?(controller: RapierCharacterControllerLike): void;
    castRayAndGetNormal?(ray: unknown, maxToi: number, solid: boolean, filterFlags?: number, filterGroups?: number, filterExcludeCollider?: RapierColliderLike, filterExcludeRigidBody?: RapierRigidBodyLike, filterPredicate?: (collider: RapierColliderLike) => boolean): RapierRayIntersectionLike | null;
    castShape?(shapePos: RapierVector3Like, shapeRot: RapierQuaternionLike, shapeVel: RapierVector3Like, shape: unknown, targetDistance: number, maxToi: number, stopAtPenetration: boolean, filterFlags?: number, filterGroups?: number, filterExcludeCollider?: RapierColliderLike, filterExcludeRigidBody?: RapierRigidBodyLike, filterPredicate?: (collider: RapierColliderLike) => boolean): RapierShapeCastHitLike | null;
};
export type RapierEventQueueLike = {
    drainCollisionEvents(callback: (handle1: number, handle2: number, started: boolean) => void): void;
    free?(): void;
};
export interface RapierStepParticipant {
    preStep(deltaTime: number): void;
    postStep(): void;
}
export type RapierPhysicsModuleLike = {
    default?: RapierPhysicsModuleLike;
    init?: () => void | Promise<void>;
    World: new (gravity: RapierVector3Like) => RapierWorldLike;
    RigidBodyDesc: {
        dynamic(): RapierRigidBodyDescLike;
        fixed(): RapierRigidBodyDescLike;
        kinematicPositionBased?(): RapierRigidBodyDescLike;
    };
    ColliderDesc: {
        cuboid(x: number, y: number, z: number): RapierColliderDescLike;
        ball(radius: number): RapierColliderDescLike;
        capsule?(halfHeight: number, radius: number): RapierColliderDescLike;
        cylinder?(halfHeight: number, radius: number): RapierColliderDescLike;
    };
    EventQueue?: new (autoDrain: boolean) => RapierEventQueueLike;
    ActiveEvents?: {
        COLLISION_EVENTS: number;
    };
    ActiveCollisionTypes?: {
        ALL: number;
    };
    QueryFilterFlags?: {
        EXCLUDE_SENSORS: number;
    };
    Ray?: new (origin: RapierVector3Like, direction: RapierVector3Like) => unknown;
    Ball?: new (radius: number) => unknown;
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
    private static __stepParticipants;
    private static __lastFrameId?;
    private static __eventQueue?;
    private static __colliderMetadata;
    private __rigidBody?;
    private __colliders;
    private __entity?;
    private __property?;
    private __localScale;
    private __shapeLocalPosition;
    private __shapeLocalRotation;
    private __shapeBindings?;
    private __motion?;
    private __shapeWorldScale;
    private __warnedAsymmetricRadius;
    private __warnedNonUniformScale;
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
    setShape(prop: PhysicsPropertyInner, entity: ISceneGraphEntity, worldScale?: IVector3): void;
    setShapeInstance(shape: ShapeInstance, body: PhysicsBodyProperty, collider: PhysicsColliderProperty, entity: ISceneGraphEntity, worldScale?: IVector3, motion?: PhysicsMotionProperty): void;
    setShapeInstances(bindings: readonly PhysicsShapeInstanceBinding[], entity: ISceneGraphEntity, worldScale?: IVector3, motion?: PhysicsMotionProperty): void;
    clearShapeInstances(): void;
    private __setShape;
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
    private __createScaledSize;
    private __isValidSize;
    /**
     * Advances the shared Rapier physics world by one step.
     */
    static update(frameId?: number, deltaTime?: number, engine?: Engine): void;
    /** @internal Registers colliders created outside PhysicsComponent, such as a character controller. */
    static _registerExternalCollider(collider: RapierColliderLike, entity: ISceneGraphEntity): void;
    /** @internal */
    static _unregisterExternalCollider(collider: RapierColliderLike | undefined): void;
    private static __unregisterColliderMetadata;
    private static __drainCollisionEvents;
    /** @internal */
    static _registerStepParticipant(participant: RapierStepParticipant): void;
    /** @internal */
    static _unregisterStepParticipant(participant: RapierStepParticipant): void;
    /** @internal */
    static _getRapier(): RapierPhysicsModuleLike;
    /** @internal */
    static _getWorld(): RapierWorldLike;
    /** @internal */
    static _getColliderMetadata(collider: RapierColliderLike): RapierColliderMetadata | undefined;
    /** @internal */
    static _packCollisionGroups(group: number, mask: number): number;
    private __createBody;
    private __isKinematicBody;
    private __applyCompleteMassProperties;
    private __createColliderDesc;
    private __createShapeInstanceColliderDesc;
    private static __packCollisionGroups;
    private __getScaledVolume;
    private static __copyMotion;
    private __getApproximatedRadius;
    private __warnNonUniformScaleIfNeeded;
    private __removeBody;
    private static __validateShapeSupport;
    private static __assertInitialized;
    private static __getRapier;
    private static __getWorld;
    private static __eulerToQuaternion;
    private static __toRapierQuaternion;
}
