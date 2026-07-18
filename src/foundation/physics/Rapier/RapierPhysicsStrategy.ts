import { TriggerComponent } from '../../components/Trigger/TriggerComponent';
import type { Config } from '../../core/Config';
import { PhysicsShape } from '../../definitions/PhysicsShapeType';
import type { ShapeInstance } from '../../geometry/Shape';
import type { ISceneGraphEntity } from '../../helpers';
import { type IQuaternion, type IVector3, Matrix44, Quaternion, Vector3 } from '../../math';
import { Logger } from '../../misc/Logger';
import type { Engine } from '../../system/Engine';
import type {
  PhysicsBodyProperty,
  PhysicsColliderProperty,
  PhysicsMotionProperty,
  PhysicsPropertyInner,
} from '../PhysicsProperty';
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
  setAdditionalMassProperties?(
    mass: number,
    centerOfMass: RapierVector3Like,
    principalAngularInertia: RapierVector3Like,
    angularInertiaLocalFrame: RapierQuaternionLike,
    wakeUp: boolean
  ): void;
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
  computeColliderMovement(
    collider: RapierColliderLike,
    desiredTranslationDelta: RapierVector3Like,
    filterFlags?: number,
    filterGroups?: number,
    filterPredicate?: (collider: RapierColliderLike) => boolean
  ): void;
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
  castRayAndGetNormal?(
    ray: unknown,
    maxToi: number,
    solid: boolean,
    filterFlags?: number,
    filterGroups?: number,
    filterExcludeCollider?: RapierColliderLike,
    filterExcludeRigidBody?: RapierRigidBodyLike,
    filterPredicate?: (collider: RapierColliderLike) => boolean
  ): RapierRayIntersectionLike | null;
  castShape?(
    shapePos: RapierVector3Like,
    shapeRot: RapierQuaternionLike,
    shapeVel: RapierVector3Like,
    shape: unknown,
    targetDistance: number,
    maxToi: number,
    stopAtPenetration: boolean,
    filterFlags?: number,
    filterGroups?: number,
    filterExcludeCollider?: RapierColliderLike,
    filterExcludeRigidBody?: RapierRigidBodyLike,
    filterPredicate?: (collider: RapierColliderLike) => boolean
  ): RapierShapeCastHitLike | null;
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
  ActiveEvents?: { COLLISION_EVENTS: number };
  ActiveCollisionTypes?: { ALL: number };
  QueryFilterFlags?: { EXCLUDE_SENSORS: number };
  Ray?: new (origin: RapierVector3Like, direction: RapierVector3Like) => unknown;
  Ball?: new (radius: number) => unknown;
};

type StoredPhysicsProperty = Omit<PhysicsPropertyInner, 'position' | 'rotation' | 'size'> & {
  position: IVector3;
  rotation: IVector3;
  size: IVector3;
};

/**
 * Physics strategy implementation using externally provided Rapier.js bindings.
 *
 * RhodoniteTS intentionally does not import Rapier directly. Call
 * RapierPhysicsStrategy.initialize(RAPIER) before creating this strategy.
 */
export class RapierPhysicsStrategy implements PhysicsStrategy {
  static __worldProperty: PhysicsWorldProperty = {
    gravity: Vector3.fromCopy3(0, -9.8, 0),
    random: true,
  };

  private static __rapier?: RapierPhysicsModuleLike;
  private static __world?: RapierWorldLike;
  private static __stepParticipants = new Set<RapierStepParticipant>();
  private static __lastFrameId?: number;
  private static __eventQueue?: RapierEventQueueLike;
  private static __colliderMetadata = new Map<number, RapierColliderMetadata>();

  private __rigidBody?: RapierRigidBodyLike;
  private __colliders: RapierColliderLike[] = [];
  private __entity?: ISceneGraphEntity;
  private __property?: StoredPhysicsProperty;
  private __localScale: IVector3 = Vector3.one();
  private __shapeLocalPosition: IVector3 = Vector3.zero();
  private __shapeLocalRotation: IQuaternion = Quaternion.identity();
  private __shapeBindings?: PhysicsShapeInstanceBinding[];
  private __motion?: PhysicsMotionProperty;
  private __shapeWorldScale: IVector3 = Vector3.one();
  private __warnedAsymmetricRadius = false;
  private __warnedNonUniformScale = false;

  /**
   * Injects Rapier.js bindings and creates the shared physics world.
   * @param rapierModule - Rapier module or compat module default export
   * @param worldProperty - Optional world settings
   */
  static async initialize(
    rapierModule: RapierPhysicsModuleLike,
    worldProperty: PhysicsWorldProperty = RapierPhysicsStrategy.__worldProperty
  ): Promise<void> {
    const rapier = rapierModule.default ?? rapierModule;
    if (rapier.init != null) {
      await rapier.init();
    }

    RapierPhysicsStrategy.__eventQueue?.free?.();
    RapierPhysicsStrategy.__rapier = rapier;
    RapierPhysicsStrategy.__worldProperty = worldProperty;
    RapierPhysicsStrategy.__world = new rapier.World({
      x: worldProperty.gravity.x,
      y: worldProperty.gravity.y,
      z: worldProperty.gravity.z,
    });
    RapierPhysicsStrategy.__stepParticipants.clear();
    RapierPhysicsStrategy.__colliderMetadata.clear();
    RapierPhysicsStrategy.__eventQueue = rapier.EventQueue == null ? undefined : new rapier.EventQueue(true);
    RapierPhysicsStrategy.__lastFrameId = undefined;
  }

  /**
   * Returns true when Rapier bindings have already been injected.
   */
  static get isInitialized(): boolean {
    return RapierPhysicsStrategy.__rapier != null && RapierPhysicsStrategy.__world != null;
  }

  constructor() {
    RapierPhysicsStrategy.__assertInitialized();
  }

  /**
   * Sets up a Rapier rigid body and collider for the given entity.
   * @param prop - Physics properties defining shape and material values
   * @param entity - Scene graph entity associated with the physics body
   */
  setShape(prop: PhysicsPropertyInner, entity: ISceneGraphEntity, worldScale: IVector3 = Vector3.one()): void {
    this.__removeBody(true);
    this.__shapeBindings = undefined;
    this.__motion = undefined;
    this.__shapeLocalPosition = Vector3.zero();
    this.__shapeLocalRotation = Quaternion.identity();
    this.__setShape(prop, entity, worldScale);
  }

  setShapeInstance(
    shape: ShapeInstance,
    body: PhysicsBodyProperty,
    collider: PhysicsColliderProperty,
    entity: ISceneGraphEntity,
    worldScale: IVector3 = Vector3.one(),
    motion?: PhysicsMotionProperty
  ): void {
    this.setShapeInstances([{ shape, body, collider }], entity, worldScale, motion);
  }

  setShapeInstances(
    bindings: readonly PhysicsShapeInstanceBinding[],
    entity: ISceneGraphEntity,
    worldScale: IVector3 = Vector3.one(),
    motion?: PhysicsMotionProperty
  ): void {
    if (bindings.length === 0) {
      this.clearShapeInstances();
      return;
    }
    const resolvedMotion = motion ?? {
      move: bindings[0].body.move,
      isKinematic: bindings[0].body.isKinematic,
    };
    const move = resolvedMotion.move;
    const isKinematic = resolvedMotion.isKinematic ?? false;
    if (bindings.some(binding => binding.body.move !== move)) {
      throw new Error('All Rapier colliders on one rigid body must use the same body.move value.');
    }
    if (bindings.some(binding => (binding.body.isKinematic ?? false) !== isKinematic)) {
      throw new Error('All Rapier colliders on one rigid body must use the same body.isKinematic value.');
    }
    if (!move && isKinematic) {
      throw new Error('A kinematic Rapier body must have body.move enabled.');
    }
    const hasDynamicParameters =
      resolvedMotion.mass != null ||
      resolvedMotion.centerOfMass != null ||
      resolvedMotion.inertiaDiagonal != null ||
      resolvedMotion.inertiaOrientation != null ||
      resolvedMotion.linearVelocity != null ||
      resolvedMotion.angularVelocity != null ||
      resolvedMotion.gravityFactor != null;
    if ((!move || isKinematic) && hasDynamicParameters) {
      Logger.default.warn(
        `Rapier ignores mass properties, initial velocity, and gravityFactor on ${isKinematic ? 'kinematic' : 'fixed'} bodies.`
      );
    }
    if (isKinematic && RapierPhysicsStrategy.__getRapier().RigidBodyDesc.kinematicPositionBased == null) {
      throw new Error('The injected Rapier module does not support position-based kinematic bodies.');
    }
    const scale = Vector3.fromCopy3(Math.abs(worldScale.x), Math.abs(worldScale.y), Math.abs(worldScale.z));
    for (const binding of bindings) {
      RapierPhysicsStrategy.__validateShapeSupport(binding.shape, scale);
    }
    this.__shapeBindings = bindings.map(binding => ({
      bindingId: binding.bindingId,
      shape: binding.shape,
      body: { ...binding.body },
      collider: { ...binding.collider },
    }));
    this.__motion = RapierPhysicsStrategy.__copyMotion(resolvedMotion);
    this.__shapeWorldScale = Vector3.fromCopy3(Math.abs(worldScale.x), Math.abs(worldScale.y), Math.abs(worldScale.z));
    this.__warnedAsymmetricRadius = false;
    this.__warnedNonUniformScale = false;
    const first = bindings[0];
    const size = first.shape.shape.type === 'box' ? first.shape.shape.size : Vector3.one();
    const willRebuild = scale.x > 0 && scale.y > 0 && scale.z > 0;
    this.__removeBody(willRebuild);
    this.__setShape(
      {
        type: first.shape.shape.type === 'box' ? PhysicsShape.Box : PhysicsShape.Sphere,
        size,
        position: entity.getSceneGraph().position,
        rotation: entity.getSceneGraph().eulerAngles,
        move: resolvedMotion.move,
        density: first.body.density,
        friction: first.collider.friction,
        restitution: first.collider.restitution,
      },
      entity,
      worldScale
    );
  }

  clearShapeInstances(): void {
    this.__removeBody();
    this.__shapeBindings = undefined;
    this.__motion = undefined;
    this.__property = undefined;
  }

  private __setShape(prop: PhysicsPropertyInner, entity: ISceneGraphEntity, worldScale: IVector3): void {
    this.__entity = entity;
    this.__localScale = Vector3.fromCopy3(prop.size.x, prop.size.y, prop.size.z);
    this.__property = {
      type: prop.type,
      size: Vector3.fromCopy3(prop.size.x, prop.size.y, prop.size.z),
      position: Vector3.fromCopy3(prop.position.x, prop.position.y, prop.position.z),
      rotation: Vector3.fromCopy3(prop.rotation.x, prop.rotation.y, prop.rotation.z),
      move: prop.move,
      density: prop.density,
      friction: prop.friction,
      restitution: prop.restitution,
    };

    if (
      this.__shapeBindings != null &&
      (this.__shapeWorldScale.x === 0 || this.__shapeWorldScale.y === 0 || this.__shapeWorldScale.z === 0)
    ) {
      return;
    }
    const scaledSize = this.__createScaledSize(worldScale);
    if (this.__isValidSize(this.__property, scaledSize)) {
      this.__createBody(
        this.__property,
        scaledSize,
        this.__property.position,
        RapierPhysicsStrategy.__eulerToQuaternion(this.__property.rotation)
      );
    }
  }

  /**
   * Updates the associated entity transform from the Rapier body state.
   */
  update(_config: Config): void {
    if (this.__entity == null || this.__rigidBody == null) {
      return;
    }

    const pos = this.__rigidBody.translation();
    const rot = this.__rigidBody.rotation();
    this.__entity.getSceneGraph().setPositionWithoutPhysics(Vector3.fromCopy3(pos.x, pos.y, pos.z));
    this.__entity.getSceneGraph().setRotationWithoutPhysics(Quaternion.fromCopy4(rot.x, rot.y, rot.z, rot.w));
  }

  /**
   * Sets the Rapier body world position.
   * @param worldPosition - New world position
   */
  setPosition(worldPosition: IVector3): void {
    if (this.__property != null) {
      this.__property.position = Vector3.fromCopy3(worldPosition.x, worldPosition.y, worldPosition.z);
    }
    if (this.__rigidBody == null) {
      return;
    }
    if (this.__isKinematicBody()) {
      if (this.__rigidBody.setNextKinematicTranslation == null) {
        throw new Error('The injected Rapier rigid body does not support next kinematic translation.');
      }
      this.__rigidBody.setNextKinematicTranslation({ x: worldPosition.x, y: worldPosition.y, z: worldPosition.z });
      return;
    }
    this.__rigidBody.setTranslation({ x: worldPosition.x, y: worldPosition.y, z: worldPosition.z }, true);
  }

  /**
   * Sets the Rapier body world rotation.
   * @param worldRotation - New world rotation
   */
  setRotation(worldRotation: IQuaternion): void {
    if (this.__property != null) {
      this.__property.rotation = Quaternion.fromCopy4(
        worldRotation.x,
        worldRotation.y,
        worldRotation.z,
        worldRotation.w
      ).toEulerAngles();
    }
    if (this.__rigidBody == null) {
      return;
    }
    const rotation = RapierPhysicsStrategy.__toRapierQuaternion(worldRotation);
    if (this.__isKinematicBody()) {
      if (this.__rigidBody.setNextKinematicRotation == null) {
        throw new Error('The injected Rapier rigid body does not support next kinematic rotation.');
      }
      this.__rigidBody.setNextKinematicRotation(rotation);
      return;
    }
    this.__rigidBody.setRotation(rotation, true);
  }

  /**
   * Sets the Rapier body world rotation from Euler angles.
   * @param eulerAngles - Euler angles in radians
   */
  setEulerAngle(eulerAngles: IVector3): void {
    this.setRotation(RapierPhysicsStrategy.__eulerToQuaternion(eulerAngles));
  }

  /**
   * Recreates the Rapier body with a scaled collider shape.
   * @param worldScale - World scale
   */
  setScale(worldScale: IVector3): void {
    if (this.__property == null) {
      return;
    }

    const isKinematic = this.__isKinematicBody();
    const position = this.__rigidBody?.translation() ?? this.__property.position;
    const rotation =
      this.__rigidBody?.rotation() ?? RapierPhysicsStrategy.__eulerToQuaternion(this.__property.rotation);
    const nextKinematicPosition = isKinematic
      ? Vector3.fromCopy3(this.__property.position.x, this.__property.position.y, this.__property.position.z)
      : undefined;
    const nextKinematicRotation = isKinematic
      ? RapierPhysicsStrategy.__eulerToQuaternion(this.__property.rotation)
      : undefined;
    this.__shapeWorldScale = Vector3.fromCopy3(Math.abs(worldScale.x), Math.abs(worldScale.y), Math.abs(worldScale.z));
    const scaledSize = this.__createScaledSize(worldScale);

    const willRebuild =
      this.__shapeBindings != null
        ? this.__shapeWorldScale.x > 0 && this.__shapeWorldScale.y > 0 && this.__shapeWorldScale.z > 0
        : this.__isValidSize(this.__property, scaledSize);
    this.__removeBody(willRebuild);
    if (!willRebuild) {
      return;
    }
    this.__createBody(
      this.__property,
      scaledSize,
      Vector3.fromCopy3(position.x, position.y, position.z),
      Quaternion.fromCopy4(rotation.x, rotation.y, rotation.z, rotation.w)
    );
    if (nextKinematicPosition != null && nextKinematicRotation != null) {
      this.setPosition(nextKinematicPosition);
      this.setRotation(nextKinematicRotation);
    }
  }

  private __createScaledSize(worldScale: IVector3): Vector3 {
    return Vector3.fromCopy3(
      this.__localScale.x * Math.abs(worldScale.x),
      this.__localScale.y * Math.abs(worldScale.y),
      this.__localScale.z * Math.abs(worldScale.z)
    );
  }

  private __isValidSize(prop: StoredPhysicsProperty, size: IVector3): boolean {
    if (prop.type === PhysicsShape.Sphere) {
      return Number.isFinite(size.x) && size.x > 0;
    }
    return (
      Number.isFinite(size.x) &&
      Number.isFinite(size.y) &&
      Number.isFinite(size.z) &&
      size.x > 0 &&
      size.y > 0 &&
      size.z > 0
    );
  }

  /**
   * Advances the shared Rapier physics world by one step.
   */
  static update(frameId?: number, deltaTime = 1 / 60, engine?: Engine): void {
    if (frameId != null && RapierPhysicsStrategy.__lastFrameId === frameId) {
      return;
    }
    RapierPhysicsStrategy.__lastFrameId = frameId;

    for (const participant of RapierPhysicsStrategy.__stepParticipants) {
      participant.preStep(deltaTime);
    }
    TriggerComponent._beginPhysicsStep();
    RapierPhysicsStrategy.__world?.step(RapierPhysicsStrategy.__eventQueue);
    RapierPhysicsStrategy.__drainCollisionEvents();
    TriggerComponent._finalizeRebuiltOverlaps();
    for (const participant of RapierPhysicsStrategy.__stepParticipants) {
      participant.postStep();
    }
    TriggerComponent._publishStayEvents(engine);
  }

  /** @internal Registers colliders created outside PhysicsComponent, such as a character controller. */
  static _registerExternalCollider(collider: RapierColliderLike, entity: ISceneGraphEntity): void {
    if (collider.handle != null) {
      this.__colliderMetadata.set(collider.handle, { entity, isSensor: false });
    }
  }

  /** @internal */
  static _unregisterExternalCollider(collider: RapierColliderLike | undefined): void {
    if (collider?.handle != null) {
      this.__unregisterColliderMetadata(collider.handle);
    }
  }

  private static __unregisterColliderMetadata(handle: number, isRebuilding = false): void {
    const metadata = this.__colliderMetadata.get(handle);
    if (metadata == null) {
      return;
    }
    if (isRebuilding) {
      if (metadata.isSensor && metadata.bindingId != null) {
        TriggerComponent._suspendSensorBinding(metadata.entity.engine, metadata.entity.entityUID, metadata.bindingId);
      }
      TriggerComponent._suspendOtherBinding(metadata.entity, metadata.bindingId, handle);
    } else {
      if (metadata.isSensor && metadata.bindingId != null) {
        TriggerComponent._deactivateSensorBinding(
          metadata.entity.engine,
          metadata.entity.entityUID,
          metadata.bindingId
        );
      }
      TriggerComponent._deactivateOtherBinding(metadata.entity, metadata.bindingId, handle);
    }
    this.__colliderMetadata.delete(handle);
  }

  private static __drainCollisionEvents(): void {
    this.__eventQueue?.drainCollisionEvents((handle1, handle2, started) => {
      const first = this.__colliderMetadata.get(handle1);
      const second = this.__colliderMetadata.get(handle2);
      if (first == null || second == null || first.entity.engine !== second.entity.engine) {
        return;
      }
      if (first.isSensor && first.bindingId != null) {
        TriggerComponent._processOverlap(
          first.entity.engine,
          first.entity.entityUID,
          first.bindingId,
          second.entity,
          second.bindingId,
          started,
          handle2
        );
      }
      if (second.isSensor && second.bindingId != null) {
        TriggerComponent._processOverlap(
          second.entity.engine,
          second.entity.entityUID,
          second.bindingId,
          first.entity,
          first.bindingId,
          started,
          handle1
        );
      }
    });
  }

  /** @internal */
  static _registerStepParticipant(participant: RapierStepParticipant): void {
    RapierPhysicsStrategy.__stepParticipants.add(participant);
  }

  /** @internal */
  static _unregisterStepParticipant(participant: RapierStepParticipant): void {
    RapierPhysicsStrategy.__stepParticipants.delete(participant);
  }

  /** @internal */
  static _getRapier(): RapierPhysicsModuleLike {
    return RapierPhysicsStrategy.__getRapier();
  }

  /** @internal */
  static _getWorld(): RapierWorldLike {
    return RapierPhysicsStrategy.__getWorld();
  }

  /** @internal */
  static _getColliderMetadata(collider: RapierColliderLike): RapierColliderMetadata | undefined {
    return collider.handle == null ? undefined : RapierPhysicsStrategy.__colliderMetadata.get(collider.handle);
  }

  /** @internal */
  static _packCollisionGroups(group: number, mask: number): number {
    return RapierPhysicsStrategy.__packCollisionGroups(group, mask);
  }

  private __createBody(prop: StoredPhysicsProperty, size: IVector3, position: IVector3, rotation: IQuaternion): void {
    const rapier = RapierPhysicsStrategy.__getRapier();
    const world = RapierPhysicsStrategy.__getWorld();
    const motion = this.__motion;
    const isKinematic = this.__isKinematicBody();
    const rigidBodyDesc = isKinematic
      ? rapier.RigidBodyDesc.kinematicPositionBased!()
      : prop.move
        ? rapier.RigidBodyDesc.dynamic()
        : rapier.RigidBodyDesc.fixed();
    rigidBodyDesc
      .setTranslation(position.x, position.y, position.z)
      .setRotation(RapierPhysicsStrategy.__toRapierQuaternion(rotation));

    if (prop.move && !isKinematic && motion != null) {
      const velocityRotation = this.__entity?.getSceneGraph().getQuaternionRecursively() ?? rotation;
      const linearVelocity =
        motion.linearVelocity == null ? undefined : velocityRotation.transformVector3(motion.linearVelocity);
      const angularVelocity =
        motion.angularVelocity == null ? undefined : velocityRotation.transformVector3(motion.angularVelocity);
      if (linearVelocity != null) {
        rigidBodyDesc.setLinvel?.(linearVelocity.x, linearVelocity.y, linearVelocity.z);
      }
      if (angularVelocity != null) {
        rigidBodyDesc.setAngvel?.({ x: angularVelocity.x, y: angularVelocity.y, z: angularVelocity.z });
      }
      if (motion.gravityFactor != null) {
        rigidBodyDesc.setGravityScale?.(motion.gravityFactor);
      }
    }

    this.__rigidBody = world.createRigidBody(rigidBodyDesc);
    if (this.__shapeBindings != null) {
      for (const binding of this.__shapeBindings) {
        const colliderDesc = this.__createShapeInstanceColliderDesc(binding);
        const collider = world.createCollider(colliderDesc, this.__rigidBody);
        this.__colliders.push(collider);
        if (collider.handle != null && this.__entity != null) {
          RapierPhysicsStrategy.__colliderMetadata.set(collider.handle, {
            entity: this.__entity,
            bindingId: binding.bindingId,
            isSensor: binding.collider.isSensor ?? false,
          });
        }
      }
      this.__applyCompleteMassProperties(prop.move, isKinematic);
    } else {
      const collider = world.createCollider(this.__createColliderDesc(prop, size), this.__rigidBody);
      this.__colliders.push(collider);
      if (collider.handle != null && this.__entity != null) {
        RapierPhysicsStrategy.__colliderMetadata.set(collider.handle, {
          entity: this.__entity,
          isSensor: false,
        });
      }
    }
  }

  private __isKinematicBody(): boolean {
    return this.__motion?.isKinematic ?? this.__shapeBindings?.[0]?.body.isKinematic ?? false;
  }

  private __applyCompleteMassProperties(move: boolean, isKinematic: boolean): void {
    const motion = this.__motion;
    const rigidBody = this.__rigidBody;
    if (motion == null || rigidBody == null || !move || isKinematic) {
      return;
    }
    const hasOnlySensorColliders = this.__shapeBindings?.every(binding => binding.collider.isSensor === true) === true;
    const needsCompleteMassProperties =
      motion.mass === 0 ||
      (hasOnlySensorColliders && motion.mass != null && motion.mass > 0) ||
      motion.centerOfMass != null ||
      motion.inertiaDiagonal != null ||
      motion.inertiaOrientation != null;
    if (!needsCompleteMassProperties) {
      return;
    }
    if (
      rigidBody.mass == null ||
      rigidBody.localCom == null ||
      rigidBody.principalInertia == null ||
      rigidBody.principalInertiaLocalFrame == null ||
      rigidBody.recomputeMassPropertiesFromColliders == null ||
      rigidBody.setAdditionalMassProperties == null ||
      this.__colliders.some(collider => collider.setDensity == null)
    ) {
      throw new Error('The injected Rapier module does not support complete rigid-body mass properties.');
    }

    rigidBody.recomputeMassPropertiesFromColliders();
    const automaticMass = rigidBody.mass();
    const automaticCenterOfMass = rigidBody.localCom();
    const automaticInertia = rigidBody.principalInertia();
    const automaticInertiaOrientation = rigidBody.principalInertiaLocalFrame();
    for (const collider of this.__colliders) {
      collider.setDensity!(0);
    }
    rigidBody.recomputeMassPropertiesFromColliders();
    const centerOfMass = motion.centerOfMass ?? automaticCenterOfMass;
    const inertia = motion.inertiaDiagonal ?? automaticInertia;
    const inertiaOrientation = motion.inertiaOrientation ?? automaticInertiaOrientation;
    rigidBody.setAdditionalMassProperties(
      motion.mass ?? automaticMass,
      { x: centerOfMass.x, y: centerOfMass.y, z: centerOfMass.z },
      { x: inertia.x, y: inertia.y, z: inertia.z },
      {
        x: inertiaOrientation.x,
        y: inertiaOrientation.y,
        z: inertiaOrientation.z,
        w: inertiaOrientation.w,
      },
      false
    );
  }

  private __createColliderDesc(prop: StoredPhysicsProperty, size: IVector3): RapierColliderDescLike {
    const rapier = RapierPhysicsStrategy.__getRapier();
    let colliderDesc: RapierColliderDescLike;

    if (prop.type === PhysicsShape.Box) {
      colliderDesc = rapier.ColliderDesc.cuboid(size.x * 0.5, size.y * 0.5, size.z * 0.5);
    } else if (prop.type === PhysicsShape.Sphere) {
      colliderDesc = rapier.ColliderDesc.ball(size.x);
    } else {
      throw new Error(`Unsupported Rapier physics shape: ${prop.type.str}`);
    }

    colliderDesc = colliderDesc.setDensity?.(prop.density) ?? colliderDesc;
    colliderDesc = colliderDesc.setFriction?.(prop.friction) ?? colliderDesc;
    colliderDesc = colliderDesc.setRestitution?.(prop.restitution) ?? colliderDesc;
    colliderDesc =
      colliderDesc.setTranslation?.(
        this.__shapeLocalPosition.x * Math.abs(size.x / this.__localScale.x),
        this.__shapeLocalPosition.y * Math.abs(size.y / this.__localScale.y),
        this.__shapeLocalPosition.z * Math.abs(size.z / this.__localScale.z)
      ) ?? colliderDesc;
    colliderDesc =
      colliderDesc.setRotation?.(RapierPhysicsStrategy.__toRapierQuaternion(this.__shapeLocalRotation)) ?? colliderDesc;
    return colliderDesc;
  }

  private __createShapeInstanceColliderDesc(binding: PhysicsShapeInstanceBinding): RapierColliderDescLike {
    const rapier = RapierPhysicsStrategy.__getRapier();
    const shapeInstance = binding.shape;
    const shape = shapeInstance.shape;
    const scale = this.__shapeWorldScale;
    let colliderDesc: RapierColliderDescLike;

    if (shape.type === 'box') {
      colliderDesc = rapier.ColliderDesc.cuboid(
        shape.size.x * scale.x * 0.5,
        shape.size.y * scale.y * 0.5,
        shape.size.z * scale.z * 0.5
      );
    } else if (shape.type === 'sphere') {
      const radialScale = Math.max(scale.x, scale.y, scale.z);
      this.__warnNonUniformScaleIfNeeded(shape.type, scale);
      colliderDesc = rapier.ColliderDesc.ball(shape.radius * radialScale);
    } else if (shape.type === 'cylinder') {
      if (rapier.ColliderDesc.cylinder == null) {
        throw new Error('The injected Rapier module does not support cylinder colliders.');
      }
      const radius = this.__getApproximatedRadius(shape.radiusBottom, shape.radiusTop, shape.type);
      this.__warnNonUniformScaleIfNeeded(shape.type, Vector3.fromCopy3(scale.x, scale.x, scale.z));
      colliderDesc = rapier.ColliderDesc.cylinder(shape.height * scale.y * 0.5, radius * Math.max(scale.x, scale.z));
    } else {
      if (rapier.ColliderDesc.capsule == null) {
        throw new Error('The injected Rapier module does not support capsule colliders.');
      }
      const radius = this.__getApproximatedRadius(shape.radiusBottom, shape.radiusTop, shape.type);
      this.__warnNonUniformScaleIfNeeded(shape.type, scale);
      colliderDesc = rapier.ColliderDesc.capsule(
        shape.height * scale.y * 0.5,
        radius * Math.max(scale.x, scale.y, scale.z)
      );
    }

    const explicitMass = this.__motion?.move && !this.__motion.isKinematic ? this.__motion.mass : undefined;
    const density = binding.collider.isSensor
      ? 0
      : explicitMass != null && explicitMass > 0
        ? explicitMass /
          this.__shapeBindings!.reduce(
            (sum, item) => (item.collider.isSensor ? sum : sum + this.__getScaledVolume(item)),
            0
          )
        : binding.body.density;
    colliderDesc = colliderDesc.setDensity?.(density) ?? colliderDesc;
    colliderDesc = colliderDesc.setFriction?.(binding.collider.friction) ?? colliderDesc;
    colliderDesc = colliderDesc.setRestitution?.(binding.collider.restitution) ?? colliderDesc;
    colliderDesc =
      colliderDesc.setCollisionGroups?.(
        RapierPhysicsStrategy.__packCollisionGroups(
          binding.collider.collisionGroup ?? 0xffff,
          binding.collider.collisionMask ?? 0xffff
        )
      ) ?? colliderDesc;
    if (binding.collider.isSensor) {
      const activeEvents = RapierPhysicsStrategy.__getRapier().ActiveEvents?.COLLISION_EVENTS;
      const activeCollisionTypes = RapierPhysicsStrategy.__getRapier().ActiveCollisionTypes?.ALL;
      if (
        colliderDesc.setSensor == null ||
        colliderDesc.setActiveEvents == null ||
        activeEvents == null ||
        colliderDesc.setActiveCollisionTypes == null ||
        activeCollisionTypes == null ||
        RapierPhysicsStrategy.__eventQueue == null
      ) {
        throw new Error('The injected Rapier module does not support sensor collision events.');
      }
      colliderDesc = colliderDesc.setSensor(true);
      colliderDesc = colliderDesc.setActiveEvents!(activeEvents);
      colliderDesc = colliderDesc.setActiveCollisionTypes!(activeCollisionTypes);
    }
    colliderDesc =
      colliderDesc.setTranslation?.(
        shapeInstance.localPosition.x * scale.x,
        shapeInstance.localPosition.y * scale.y,
        shapeInstance.localPosition.z * scale.z
      ) ?? colliderDesc;
    colliderDesc =
      colliderDesc.setRotation?.(RapierPhysicsStrategy.__toRapierQuaternion(shapeInstance.localRotation)) ??
      colliderDesc;
    return colliderDesc;
  }

  private static __packCollisionGroups(group: number, mask: number): number {
    if (!Number.isInteger(group) || group < 0 || group > 0xffff) {
      throw new Error(`Rapier collisionGroup must be a 16-bit unsigned integer: ${group}`);
    }
    if (!Number.isInteger(mask) || mask < 0 || mask > 0xffff) {
      throw new Error(`Rapier collisionMask must be a 16-bit unsigned integer: ${mask}`);
    }
    return ((group << 16) | mask) >>> 0;
  }

  private __getScaledVolume(binding: PhysicsShapeInstanceBinding): number {
    const shape = binding.shape.shape;
    const scale = this.__shapeWorldScale;
    if (shape.type === 'box') {
      return shape.size.x * scale.x * shape.size.y * scale.y * shape.size.z * scale.z;
    }
    if (shape.type === 'sphere') {
      const radius = shape.radius * Math.max(scale.x, scale.y, scale.z);
      return (4 / 3) * Math.PI * radius ** 3;
    }
    const radius = Math.max(shape.radiusBottom, shape.radiusTop) * Math.max(scale.x, scale.z);
    const cylinderVolume = Math.PI * radius ** 2 * shape.height * scale.y;
    if (shape.type === 'cylinder') {
      return cylinderVolume;
    }
    const capsuleRadius = Math.max(shape.radiusBottom, shape.radiusTop) * Math.max(scale.x, scale.y, scale.z);
    return Math.PI * capsuleRadius ** 2 * shape.height * scale.y + (4 / 3) * Math.PI * capsuleRadius ** 3;
  }

  private static __copyMotion(motion: PhysicsMotionProperty): PhysicsMotionProperty {
    return {
      ...motion,
      linearVelocity:
        motion.linearVelocity == null
          ? undefined
          : Vector3.fromCopy3(motion.linearVelocity.x, motion.linearVelocity.y, motion.linearVelocity.z),
      angularVelocity:
        motion.angularVelocity == null
          ? undefined
          : Vector3.fromCopy3(motion.angularVelocity.x, motion.angularVelocity.y, motion.angularVelocity.z),
      centerOfMass:
        motion.centerOfMass == null
          ? undefined
          : Vector3.fromCopy3(motion.centerOfMass.x, motion.centerOfMass.y, motion.centerOfMass.z),
      inertiaDiagonal:
        motion.inertiaDiagonal == null
          ? undefined
          : Vector3.fromCopy3(motion.inertiaDiagonal.x, motion.inertiaDiagonal.y, motion.inertiaDiagonal.z),
      inertiaOrientation:
        motion.inertiaOrientation == null ? undefined : Quaternion.fromCopyQuaternion(motion.inertiaOrientation),
    };
  }

  private __getApproximatedRadius(radiusBottom: number, radiusTop: number, shapeType: string): number {
    if (radiusBottom !== radiusTop && !this.__warnedAsymmetricRadius) {
      Logger.default.warn(
        `Rapier approximates asymmetric ${shapeType} radii (${radiusBottom}, ${radiusTop}) with the maximum radius.`
      );
      this.__warnedAsymmetricRadius = true;
    }
    return Math.max(radiusBottom, radiusTop);
  }

  private __warnNonUniformScaleIfNeeded(shapeType: string, scale: IVector3): void {
    if (
      !this.__warnedNonUniformScale &&
      (Math.abs(scale.x - scale.y) > 0.000001 || Math.abs(scale.y - scale.z) > 0.000001)
    ) {
      Logger.default.warn(`Rapier conservatively approximates non-uniform scale for ${shapeType} shapes.`);
      this.__warnedNonUniformScale = true;
    }
  }

  private __removeBody(isRebuilding = false): void {
    if (this.__rigidBody == null) {
      return;
    }

    const world = RapierPhysicsStrategy.__getWorld();
    if (world.removeRigidBody == null) {
      throw new Error('The injected Rapier world does not support removeRigidBody.');
    }

    for (const collider of this.__colliders) {
      if (collider.handle != null) {
        RapierPhysicsStrategy.__unregisterColliderMetadata(collider.handle, isRebuilding);
      }
    }
    world.removeRigidBody(this.__rigidBody);
    this.__rigidBody = undefined;
    this.__colliders.length = 0;
  }

  private static __validateShapeSupport(shapeInstance: ShapeInstance, scale: IVector3): void {
    if (scale.x === 0 || scale.y === 0 || scale.z === 0) {
      return;
    }
    const shape = shapeInstance.shape;
    const rapier = RapierPhysicsStrategy.__getRapier();
    if (shape.type === 'cylinder' && rapier.ColliderDesc.cylinder == null) {
      throw new Error('The injected Rapier module does not support cylinder colliders.');
    }
    if (shape.type === 'capsule' && rapier.ColliderDesc.capsule == null) {
      throw new Error('The injected Rapier module does not support capsule colliders.');
    }
  }

  private static __assertInitialized(): void {
    if (!RapierPhysicsStrategy.isInitialized) {
      throw new Error('RapierPhysicsStrategy.initialize(RAPIER) must be called before use.');
    }
  }

  private static __getRapier(): RapierPhysicsModuleLike {
    RapierPhysicsStrategy.__assertInitialized();
    return RapierPhysicsStrategy.__rapier!;
  }

  private static __getWorld(): RapierWorldLike {
    RapierPhysicsStrategy.__assertInitialized();
    return RapierPhysicsStrategy.__world!;
  }

  private static __eulerToQuaternion(eulerAngles: IVector3): IQuaternion {
    return Quaternion.fromMatrix(Matrix44.rotateXYZ(eulerAngles.x, eulerAngles.y, eulerAngles.z));
  }

  private static __toRapierQuaternion(quaternion: IQuaternion): RapierQuaternionLike {
    return {
      x: quaternion.x,
      y: quaternion.y,
      z: quaternion.z,
      w: quaternion.w,
    };
  }
}
