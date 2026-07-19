import type { ShapeInstance } from '../../geometry/Shape';
import type { ISceneGraphEntity } from '../../helpers/EntityHelper';
import { type IVector3, MutableVector3, Quaternion, Vector3 } from '../../math';
import { Logger } from '../../misc/Logger';
import type {
  CharacterControllerOptions,
  CharacterControllerStrategy,
  CharacterGroundContact,
  CharacterMotionState,
  CharacterMovementState,
} from '../CharacterControllerStrategy';
import { PhysicsWorldQuery } from '../PhysicsWorldQuery';
import { resolveScaledCapsule } from '../ShapeTransformResolver';
import {
  type RapierCharacterControllerLike,
  type RapierColliderLike,
  RapierPhysicsStrategy,
  type RapierRigidBodyLike,
  type RapierStepParticipant,
  type RapierVector3Like,
} from './RapierPhysicsStrategy';
import { RapierPhysicsWorldQueryStrategy } from './RapierPhysicsWorldQueryStrategy';

type ResolvedOptions = Required<Omit<CharacterControllerOptions, 'shapeIndex' | 'radius' | 'height'>>;
type ResolvedCharacterCapsule = ReturnType<typeof resolveScaledCapsule> & {
  localPosition: IVector3;
  bottomOffset: IVector3;
};

const defaultOptions: ResolvedOptions = {
  contactOffset: 0.01,
  maxStepHeight: 0.25,
  minStepWidth: 0.2,
  maxSlopeClimbAngle: Math.PI / 4,
  minSlopeSlideAngle: (50 * Math.PI) / 180,
  snapToGroundDistance: 0.15,
  gravity: 9.8,
  jumpSpeed: 4.5,
  maxDeltaTime: 1 / 15,
  applyImpulsesToDynamicBodies: false,
  groundProbeDistance: 0.3,
  groundProbeStartOffset: 0.01,
  groundCollisionGroup: 0xffff,
  groundCollisionMask: 0xffff,
  groundProbeRadius: 0.24,
  normalNudgeFactor: 0.001,
  stuckRecoveryEnabled: true,
  stuckRecoveryFrameCount: 2,
  stuckRecoveryDistance: 0.01,
};

const initialMotionState: CharacterMotionState = {
  state: 'falling',
  velocity: Vector3.zero(),
  horizontalSpeed: 0,
  verticalSpeed: 0,
  groundedDuration: 0,
  airborneDuration: 0,
  stateElapsedTime: 0,
  landingImpactSpeed: 0,
};

/** Rapier-backed kinematic capsule character controller. */
export class RapierCharacterControllerStrategy implements CharacterControllerStrategy, RapierStepParticipant {
  private __entity?: ISceneGraphEntity;
  private __rigidBody?: RapierRigidBodyLike;
  private __collider?: RapierColliderLike;
  private __controller?: RapierCharacterControllerLike;
  private __options: ResolvedOptions = { ...defaultOptions };
  private __desiredHorizontalVelocity = MutableVector3.zero();
  private __computedMovement = MutableVector3.zero();
  private __verticalVelocity = 0;
  private __isGrounded = false;
  private __jumpRequested = false;
  private __enabled = true;
  private __groundContact?: CharacterGroundContact;
  private __capsuleBottomOffset = Vector3.zero();
  private __worldQuery?: PhysicsWorldQuery;
  private __stuckFrameCount = 0;
  private __isRecovering = false;
  private __motionState: CharacterMotionState = initialMotionState;
  private __lastStepDeltaTime = 0;
  private __wasGrounded = false;
  private __hasEstablishedGrounding = false;
  private __stateVerticalVelocity = 0;
  private __landingImpactSpeed = 0;
  private __shapeInstance?: ShapeInstance;
  private __worldScale = Vector3.one();
  private __isGroundProbeRadiusDerived = true;
  private __warnedNonUniformScale = false;

  setup(entity: ISceneGraphEntity, shapeInstance: ShapeInstance, options: CharacterControllerOptions = {}): void {
    if (this.__rigidBody != null) {
      throw new Error('RapierCharacterControllerStrategy has already been set up.');
    }

    const { shapeIndex: _shapeIndex, radius: _radius, height: _height, ...movementOptions } = options;
    const resolvedOptions: ResolvedOptions = {
      ...defaultOptions,
      ...movementOptions,
      groundProbeDistance:
        options.groundProbeDistance ??
        Math.max(options.snapToGroundDistance ?? defaultOptions.snapToGroundDistance, 0.3),
      groundProbeStartOffset: options.groundProbeStartOffset ?? options.contactOffset ?? defaultOptions.contactOffset,
    };
    this.__validateOptions(resolvedOptions);

    const rapier = RapierPhysicsStrategy._getRapier();
    const world = RapierPhysicsStrategy._getWorld(entity.engine);
    if (rapier.RigidBodyDesc.kinematicPositionBased == null || rapier.ColliderDesc.capsule == null) {
      throw new Error('The injected Rapier module does not support kinematic capsule bodies.');
    }
    if (world.createCharacterController == null) {
      throw new Error('The injected Rapier world does not support character controllers.');
    }
    if (world.removeRigidBody == null || world.removeCharacterController == null) {
      throw new Error('The injected Rapier world does not support character-controller resource cleanup.');
    }
    if (shapeInstance.shape.type !== 'capsule') {
      throw new Error('RapierCharacterControllerStrategy requires a capsule ShapeInstance.');
    }

    const scale = entity.getSceneGraph()._getPhysicsWorldScale();
    const absoluteScale = [Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z)];
    if (!absoluteScale.every(Number.isFinite) || absoluteScale.some(component => component <= 0)) {
      throw new Error('Character controller scale components must be finite and non-zero at setup.');
    }
    const capsule = shapeInstance.shape;
    if (capsule.radiusBottom !== capsule.radiusTop) {
      Logger.default.warn(
        `Rapier approximates asymmetric character capsule radii (${capsule.radiusBottom}, ${capsule.radiusTop}) with the maximum radius.`
      );
    }
    const resolvedCapsule = this.__resolveCharacterCapsule(shapeInstance, scale);
    const radius = resolvedCapsule.radius;
    resolvedOptions.groundProbeRadius = options.groundProbeRadius ?? radius * 0.8;
    if (
      !Number.isFinite(resolvedOptions.groundProbeRadius) ||
      resolvedOptions.groundProbeRadius <= 0 ||
      resolvedOptions.groundProbeRadius > radius
    ) {
      throw new Error(
        'Character controller groundProbeRadius must be positive and no greater than the capsule radius.'
      );
    }
    const colliderDesc = this.__createCharacterColliderDesc(resolvedCapsule);

    const initialPosition = entity.getSceneGraph().position;
    const initialRotation = entity.getSceneGraph().getQuaternionRecursively();
    const rigidBodyDesc = rapier.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(initialPosition.x, initialPosition.y, initialPosition.z)
      .setRotation({
        x: initialRotation.x,
        y: initialRotation.y,
        z: initialRotation.z,
        w: initialRotation.w,
      });

    let rigidBody: RapierRigidBodyLike | undefined;
    let collider: RapierColliderLike | undefined;
    let controller: RapierCharacterControllerLike | undefined;
    try {
      rigidBody = world.createRigidBody(rigidBodyDesc);
      collider = world.createCollider(colliderDesc, rigidBody);
      RapierPhysicsStrategy._registerExternalCollider(collider, entity);
      controller = world.createCharacterController(resolvedOptions.contactOffset);
      controller.enableAutostep(resolvedOptions.maxStepHeight, resolvedOptions.minStepWidth, false);
      controller.enableSnapToGround(resolvedOptions.snapToGroundDistance);
      controller.setMaxSlopeClimbAngle(resolvedOptions.maxSlopeClimbAngle);
      controller.setMinSlopeSlideAngle(resolvedOptions.minSlopeSlideAngle);
      controller.setApplyImpulsesToDynamicBodies(resolvedOptions.applyImpulsesToDynamicBodies);
      controller.setNormalNudgeFactor?.(resolvedOptions.normalNudgeFactor);
      RapierPhysicsStrategy._registerStepParticipant(this, entity.engine);
    } catch (error) {
      RapierPhysicsStrategy._unregisterStepParticipant(this);
      try {
        RapierPhysicsStrategy._unregisterExternalCollider(collider, entity.engine);
      } finally {
        try {
          if (controller != null) {
            world.removeCharacterController(controller);
          }
        } finally {
          if (rigidBody != null) {
            world.removeRigidBody(rigidBody);
          }
        }
      }
      this.__warnedNonUniformScale = false;
      throw error;
    }

    this.__entity = entity;
    this.__worldQuery = new PhysicsWorldQuery(new RapierPhysicsWorldQueryStrategy(entity.engine));
    this.__options = resolvedOptions;
    this.__capsuleBottomOffset = resolvedCapsule.bottomOffset;
    this.__rigidBody = rigidBody;
    this.__collider = collider;
    this.__controller = controller;
    this.__shapeInstance = shapeInstance;
    this.__worldScale = Vector3.fromCopy3(scale.x, scale.y, scale.z);
    this.__isGroundProbeRadiusDerived = options.groundProbeRadius == null;
  }

  setDesiredHorizontalVelocity(velocity: IVector3): void {
    this.__desiredHorizontalVelocity.setComponents(velocity.x, 0, velocity.z);
  }

  requestJump(): void {
    this.__jumpRequested = true;
  }

  teleport(position: IVector3): void {
    if (this.__rigidBody == null) {
      throw new Error('RapierCharacterControllerStrategy.setup() must be called before teleport().');
    }
    const translation = { x: position.x, y: position.y, z: position.z };
    this.__rigidBody.setTranslation(translation, true);
    this.__rigidBody.setNextKinematicTranslation?.(translation);
    this.__entity?.getSceneGraph().setPositionWithoutPhysics(Vector3.fromCopy3(position.x, position.y, position.z));
    this.__verticalVelocity = 0;
    this.__isGrounded = false;
    this.__jumpRequested = false;
    this.__computedMovement.setComponents(0, 0, 0);
    this.__groundContact = undefined;
    this.__stuckFrameCount = 0;
    this.__isRecovering = false;
    this.__motionState = initialMotionState;
    this.__lastStepDeltaTime = 0;
    this.__wasGrounded = false;
    this.__hasEstablishedGrounding = false;
    this.__stateVerticalVelocity = 0;
    this.__landingImpactSpeed = 0;
  }

  preStep(deltaTime: number): void {
    if (
      !this.__enabled ||
      this.__entity == null ||
      this.__rigidBody == null ||
      this.__collider == null ||
      this.__controller == null
    ) {
      return;
    }
    this.__synchronizeScale();
    if (this.__rigidBody.setNextKinematicRotation == null) {
      throw new Error('The injected Rapier rigid body does not support kinematic rotation.');
    }
    const worldRotation = this.__entity.getSceneGraph().getQuaternionRecursively();
    this.__rigidBody.setNextKinematicRotation({
      x: worldRotation.x,
      y: worldRotation.y,
      z: worldRotation.z,
      w: worldRotation.w,
    });

    this.__isRecovering = false;
    const dt = Math.min(Math.max(deltaTime, 0), this.__options.maxDeltaTime);
    this.__lastStepDeltaTime = dt;
    if (this.__jumpRequested && this.__isGrounded) {
      this.__verticalVelocity = this.__options.jumpSpeed;
      this.__isGrounded = false;
    } else {
      this.__verticalVelocity -= this.__options.gravity * dt;
    }
    this.__jumpRequested = false;

    const desiredMovement = {
      x: this.__desiredHorizontalVelocity.x * dt,
      y: this.__verticalVelocity * dt,
      z: this.__desiredHorizontalVelocity.z * dt,
    };
    const filterFlags = RapierPhysicsStrategy._getRapier().QueryFilterFlags?.EXCLUDE_SENSORS ?? 8;
    this.__controller.computeColliderMovement(this.__collider, desiredMovement, filterFlags);
    let movement = this.__controller.computedMovement();
    const collisionNormals = this.__getCollisionNormals();
    if (this.__verticalVelocity > 0 && collisionNormals.some(normal => normal.y < -0.5)) {
      this.__verticalVelocity = 0;
    }
    this.__isGrounded = this.__controller.computedGrounded();
    const isDownwardMovementBlocked =
      this.__options.stuckRecoveryEnabled &&
      !this.__isGrounded &&
      this.__verticalVelocity < 0 &&
      desiredMovement.y < -0.000001 &&
      movement.y > -0.000001;
    this.__stuckFrameCount = isDownwardMovementBlocked ? this.__stuckFrameCount + 1 : 0;
    if (this.__stuckFrameCount >= this.__options.stuckRecoveryFrameCount) {
      this.__controller.computeColliderMovement(this.__collider, { x: 0, y: desiredMovement.y, z: 0 }, filterFlags);
      const verticalMovement = this.__controller.computedMovement();
      if (verticalMovement.y < -0.000001) {
        movement = verticalMovement;
      } else {
        movement = this.__createNudgeMovement(movement, collisionNormals);
      }
      this.__isGrounded = this.__controller.computedGrounded();
      this.__isRecovering = true;
      this.__stuckFrameCount = 0;
    }
    this.__computedMovement.setComponents(movement.x, movement.y, movement.z);
    this.__stateVerticalVelocity = this.__verticalVelocity;
    if (this.__isGrounded && this.__verticalVelocity < 0) {
      if (!this.__wasGrounded && this.__hasEstablishedGrounding) {
        this.__landingImpactSpeed = -this.__verticalVelocity;
      }
      this.__verticalVelocity = 0;
    }

    const current = this.__rigidBody.translation();
    const next = {
      x: current.x + movement.x,
      y: current.y + movement.y,
      z: current.z + movement.z,
    };
    if (this.__rigidBody.setNextKinematicTranslation == null) {
      throw new Error('The injected Rapier rigid body does not support kinematic translation.');
    }
    this.__rigidBody.setNextKinematicTranslation(next);
  }

  postStep(): void {
    if (!this.__enabled || this.__entity == null || this.__rigidBody == null) {
      return;
    }
    const position = this.__rigidBody.translation();
    this.__entity.getSceneGraph().setPositionWithoutPhysics(Vector3.fromCopy3(position.x, position.y, position.z));
    this.__updateGroundContact(position);
    this.__updateMotionState();
  }

  get isGrounded(): boolean {
    return this.__isGrounded;
  }

  get computedMovement(): IVector3 {
    return this.__computedMovement;
  }

  get groundContact(): CharacterGroundContact | undefined {
    return this.__groundContact;
  }

  get isRecovering(): boolean {
    return this.__isRecovering;
  }

  get motionState(): CharacterMotionState {
    return this.__motionState;
  }

  set enabled(value: boolean) {
    this.__enabled = value;
    if (!value) {
      this.__groundContact = undefined;
      this.__stuckFrameCount = 0;
      this.__isRecovering = false;
    }
  }

  get enabled(): boolean {
    return this.__enabled;
  }

  destroy(): void {
    RapierPhysicsStrategy._unregisterStepParticipant(this);
    const engine = this.__entity?.engine;
    RapierPhysicsStrategy._unregisterExternalCollider(this.__collider, engine);
    const world = RapierPhysicsStrategy._getWorld(engine);
    if (this.__controller != null) {
      world.removeCharacterController?.(this.__controller);
    }
    if (this.__rigidBody != null) {
      world.removeRigidBody?.(this.__rigidBody);
    }
    this.__controller = undefined;
    this.__collider = undefined;
    this.__rigidBody = undefined;
    this.__entity = undefined;
    this.__worldQuery = undefined;
    this.__groundContact = undefined;
    this.__stuckFrameCount = 0;
    this.__isRecovering = false;
    this.__motionState = initialMotionState;
    this.__lastStepDeltaTime = 0;
    this.__wasGrounded = false;
    this.__hasEstablishedGrounding = false;
    this.__stateVerticalVelocity = 0;
    this.__landingImpactSpeed = 0;
    this.__shapeInstance = undefined;
    this.__worldScale = Vector3.one();
    this.__isGroundProbeRadiusDerived = true;
    this.__warnedNonUniformScale = false;
  }

  private __resolveCharacterCapsule(shapeInstance: ShapeInstance, worldScale: IVector3): ResolvedCharacterCapsule {
    if (shapeInstance.shape.type !== 'capsule') {
      throw new Error('RapierCharacterControllerStrategy requires a capsule ShapeInstance.');
    }
    const capsule = shapeInstance.shape;
    const resolved = resolveScaledCapsule(
      capsule.height,
      Math.max(capsule.radiusBottom, capsule.radiusTop),
      shapeInstance.localRotation,
      worldScale
    );
    if (resolved.approximated && !this.__warnedNonUniformScale) {
      Logger.default.warn('Rapier conservatively approximates non-uniform scale for the character capsule.');
      this.__warnedNonUniformScale = true;
    }
    const localPosition = Vector3.fromCopy3(
      shapeInstance.localPosition.x * worldScale.x,
      shapeInstance.localPosition.y * worldScale.y,
      shapeInstance.localPosition.z * worldScale.z
    );
    const downwardExtent = resolved.rotation.transformVector3(
      Vector3.fromCopy3(0, -(resolved.halfHeight + resolved.radius), 0)
    );
    return {
      ...resolved,
      localPosition,
      bottomOffset: Vector3.add(localPosition, downwardExtent),
    };
  }

  private __createCharacterColliderDesc(resolved: ResolvedCharacterCapsule) {
    const rapier = RapierPhysicsStrategy._getRapier();
    let colliderDesc = rapier.ColliderDesc.capsule!(resolved.halfHeight, resolved.radius);
    colliderDesc =
      colliderDesc.setTranslation?.(resolved.localPosition.x, resolved.localPosition.y, resolved.localPosition.z) ??
      colliderDesc;
    colliderDesc =
      colliderDesc.setRotation?.({
        x: resolved.rotation.x,
        y: resolved.rotation.y,
        z: resolved.rotation.z,
        w: resolved.rotation.w,
      }) ?? colliderDesc;
    return colliderDesc;
  }

  private __synchronizeScale(): void {
    if (this.__entity == null || this.__rigidBody == null || this.__collider == null || this.__shapeInstance == null) {
      return;
    }
    const scale = this.__entity.getSceneGraph()._getPhysicsWorldScale();
    const absoluteScale = Vector3.fromCopy3(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z));
    const hasChanged =
      Math.abs(scale.x - this.__worldScale.x) > 0.000001 ||
      Math.abs(scale.y - this.__worldScale.y) > 0.000001 ||
      Math.abs(scale.z - this.__worldScale.z) > 0.000001;
    if (!hasChanged) {
      return;
    }
    if (
      ![absoluteScale.x, absoluteScale.y, absoluteScale.z].every(Number.isFinite) ||
      absoluteScale.x <= 0 ||
      absoluteScale.y <= 0 ||
      absoluteScale.z <= 0
    ) {
      throw new Error('Character controller scale components must remain finite and non-zero after setup.');
    }

    const world = RapierPhysicsStrategy._getWorld(this.__entity.engine);
    if (world.removeRigidBody == null) {
      throw new Error('The injected Rapier world does not support rebuilding a scaled character body.');
    }
    const resolved = this.__resolveCharacterCapsule(this.__shapeInstance, scale);
    const groundProbeRadius = this.__isGroundProbeRadiusDerived
      ? resolved.radius * 0.8
      : this.__options.groundProbeRadius;
    if (!Number.isFinite(groundProbeRadius) || groundProbeRadius <= 0 || groundProbeRadius > resolved.radius) {
      throw new Error(
        'Character controller groundProbeRadius must be positive and no greater than the scaled capsule radius.'
      );
    }
    const colliderDesc = this.__createCharacterColliderDesc(resolved);
    const position = this.__rigidBody.translation();
    const rotation = this.__rigidBody.rotation();
    const rigidBodyDesc = RapierPhysicsStrategy._getRapier().RigidBodyDesc.kinematicPositionBased!()
      .setTranslation(position.x, position.y, position.z)
      .setRotation({ x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w });
    const previousRigidBody = this.__rigidBody;
    const previousCollider = this.__collider;
    const rigidBody = world.createRigidBody(rigidBodyDesc);
    let collider: RapierColliderLike;
    try {
      collider = world.createCollider(colliderDesc, rigidBody);
    } catch (error) {
      world.removeRigidBody(rigidBody);
      throw error;
    }

    RapierPhysicsStrategy._registerExternalCollider(collider, this.__entity);
    RapierPhysicsStrategy._unregisterExternalCollider(previousCollider, this.__entity.engine, true);
    world.removeRigidBody(previousRigidBody);
    this.__rigidBody = rigidBody;
    this.__collider = collider;
    this.__capsuleBottomOffset = resolved.bottomOffset;
    this.__options.groundProbeRadius = groundProbeRadius;
    this.__worldScale = Vector3.fromCopy3(scale.x, scale.y, scale.z);
  }

  private __updateMotionState(): void {
    const dt = this.__lastStepDeltaTime;
    const velocity =
      dt > 0
        ? Vector3.fromCopy3(
            this.__computedMovement.x / dt,
            this.__computedMovement.y / dt,
            this.__computedMovement.z / dt
          )
        : Vector3.zero();
    const state = this.__resolveMovementState();
    const previous = this.__motionState;
    const isGroundedNow = this.__isGrounded;
    this.__motionState = {
      state,
      velocity,
      horizontalSpeed: Math.hypot(velocity.x, velocity.z),
      verticalSpeed: velocity.y,
      groundedDuration: isGroundedNow ? previous.groundedDuration + dt : 0,
      airborneDuration: isGroundedNow ? 0 : previous.airborneDuration + dt,
      stateElapsedTime: state === previous.state ? previous.stateElapsedTime + dt : dt,
      landingImpactSpeed: this.__landingImpactSpeed,
      groundContact: this.__groundContact,
    };
    this.__wasGrounded = isGroundedNow;
    if (isGroundedNow) {
      this.__hasEstablishedGrounding = true;
    }
  }

  private __resolveMovementState(): CharacterMovementState {
    if (this.__isRecovering) {
      return 'recovering';
    }
    if (!this.__hasEstablishedGrounding && this.__isGrounded) {
      return 'grounded';
    }
    if (!this.__wasGrounded && this.__isGrounded) {
      return 'landing';
    }
    if (this.__isGrounded) {
      return 'grounded';
    }
    if (this.__groundContact != null && !this.__groundContact.isWalkable && this.__stateVerticalVelocity <= 0) {
      return 'sliding';
    }
    return this.__stateVerticalVelocity > 0.000001 ? 'rising' : 'falling';
  }

  private __getCollisionNormals(): RapierVector3Like[] {
    const count = this.__controller?.numComputedCollisions?.() ?? 0;
    const normals: RapierVector3Like[] = [];
    for (let i = 0; i < count; i++) {
      const collision = this.__controller?.computedCollision?.(i);
      if (collision != null) {
        normals.push(collision.normal1);
      }
    }
    return normals;
  }

  private __createNudgeMovement(movement: RapierVector3Like, normals: readonly RapierVector3Like[]): RapierVector3Like {
    let x = 0;
    let z = 0;
    for (const normal of normals) {
      x += normal.x;
      z += normal.z;
    }
    const length = Math.hypot(x, z);
    if (length <= 0.000001) {
      return movement;
    }
    const scale = this.__options.stuckRecoveryDistance / length;
    return { x: x * scale, y: Math.min(movement.y, 0), z: z * scale };
  }

  private __updateGroundContact(position: RapierVector3Like): void {
    if (this.__entity == null) {
      this.__groundContact = undefined;
      return;
    }
    const bodyRotation = this.__rigidBody?.rotation();
    const capsuleBottomOffset =
      bodyRotation == null
        ? this.__capsuleBottomOffset
        : Quaternion.fromCopy4(bodyRotation.x, bodyRotation.y, bodyRotation.z, bodyRotation.w).transformVector3(
            this.__capsuleBottomOffset
          );
    const capsuleBottom = Vector3.add(Vector3.fromCopy3(position.x, position.y, position.z), capsuleBottomOffset);
    const start = Vector3.add(
      capsuleBottom,
      Vector3.fromCopy3(0, this.__options.groundProbeRadius + this.__options.groundProbeStartOffset, 0)
    );
    const hit = this.__worldQuery?.castSphere(
      start,
      this.__options.groundProbeRadius,
      Vector3.fromCopy3(0, -1, 0),
      this.__options.groundProbeDistance,
      {
        includeSensors: false,
        collisionGroup: this.__options.groundCollisionGroup,
        collisionMask: this.__options.groundCollisionMask,
        excludeEntities: [this.__entity],
      }
    );
    if (hit == null || hit.normal.y <= 0) {
      this.__groundContact = undefined;
      return;
    }
    const normal = Vector3.normalize(hit.normal);
    const slopeAngle = Math.acos(Math.min(1, Math.max(-1, normal.y)));
    this.__groundContact = {
      entity: hit.entity,
      bindingId: hit.bindingId,
      position: hit.position,
      normal,
      distance: hit.distance,
      slopeAngle,
      isWalkable: slopeAngle <= this.__options.maxSlopeClimbAngle,
    };
  }

  private __validateOptions(options: ResolvedOptions): void {
    const positiveValues = [
      options.contactOffset,
      options.maxStepHeight,
      options.minStepWidth,
      options.snapToGroundDistance,
      options.gravity,
      options.jumpSpeed,
      options.maxDeltaTime,
      options.groundProbeDistance,
      options.normalNudgeFactor,
      options.stuckRecoveryDistance,
    ];
    if (positiveValues.some(value => !Number.isFinite(value) || value <= 0)) {
      throw new Error('Character controller dimensions and movement settings must be finite positive values.');
    }
    if (!Number.isFinite(options.maxSlopeClimbAngle) || !Number.isFinite(options.minSlopeSlideAngle)) {
      throw new Error('Character controller slope angles must be finite values.');
    }
    if (!Number.isFinite(options.groundProbeStartOffset) || options.groundProbeStartOffset < 0) {
      throw new Error('Character controller groundProbeStartOffset must be a finite non-negative value.');
    }
    RapierPhysicsStrategy._packCollisionGroups(options.groundCollisionGroup, options.groundCollisionMask);
    if (!Number.isInteger(options.stuckRecoveryFrameCount) || options.stuckRecoveryFrameCount <= 0) {
      throw new Error('Character controller stuckRecoveryFrameCount must be a positive integer.');
    }
  }
}
