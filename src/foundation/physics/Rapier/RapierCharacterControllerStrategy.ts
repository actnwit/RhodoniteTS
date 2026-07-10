import type { ISceneGraphEntity } from '../../helpers/EntityHelper';
import { type IVector3, MutableVector3, Vector3 } from '../../math';
import type { CharacterControllerOptions, CharacterControllerStrategy } from '../CharacterControllerStrategy';
import {
  type RapierCharacterControllerLike,
  type RapierColliderLike,
  RapierPhysicsStrategy,
  type RapierRigidBodyLike,
  type RapierStepParticipant,
} from './RapierPhysicsStrategy';

type ResolvedOptions = Required<CharacterControllerOptions>;

const defaultOptions: ResolvedOptions = {
  radius: 0.3,
  height: 1.6,
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

  setup(entity: ISceneGraphEntity, options: CharacterControllerOptions = {}): void {
    if (this.__rigidBody != null) {
      throw new Error('RapierCharacterControllerStrategy has already been set up.');
    }

    this.__options = { ...defaultOptions, ...options };
    this.__validateOptions(this.__options);

    const rapier = RapierPhysicsStrategy._getRapier();
    const world = RapierPhysicsStrategy._getWorld();
    if (rapier.RigidBodyDesc.kinematicPositionBased == null || rapier.ColliderDesc.capsule == null) {
      throw new Error('The injected Rapier module does not support kinematic capsule bodies.');
    }
    if (world.createCharacterController == null) {
      throw new Error('The injected Rapier world does not support character controllers.');
    }

    this.__entity = entity;
    const initialPosition = entity.getSceneGraph().position;
    const rigidBodyDesc = rapier.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(initialPosition.x, initialPosition.y, initialPosition.z)
      .setRotation({ x: 0, y: 0, z: 0, w: 1 });
    this.__rigidBody = world.createRigidBody(rigidBodyDesc);

    const halfHeight = (this.__options.height - this.__options.radius * 2) / 2;
    let colliderDesc = rapier.ColliderDesc.capsule(halfHeight, this.__options.radius);
    colliderDesc = colliderDesc.setTranslation?.(0, this.__options.height / 2, 0) ?? colliderDesc;
    this.__collider = world.createCollider(colliderDesc, this.__rigidBody);

    this.__controller = world.createCharacterController(this.__options.contactOffset);
    this.__controller.enableAutostep(this.__options.maxStepHeight, this.__options.minStepWidth, false);
    this.__controller.enableSnapToGround(this.__options.snapToGroundDistance);
    this.__controller.setMaxSlopeClimbAngle(this.__options.maxSlopeClimbAngle);
    this.__controller.setMinSlopeSlideAngle(this.__options.minSlopeSlideAngle);
    this.__controller.setApplyImpulsesToDynamicBodies(this.__options.applyImpulsesToDynamicBodies);
    RapierPhysicsStrategy._registerStepParticipant(this);
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
  }

  preStep(deltaTime: number): void {
    if (!this.__enabled || this.__rigidBody == null || this.__collider == null || this.__controller == null) {
      return;
    }

    const dt = Math.min(Math.max(deltaTime, 0), this.__options.maxDeltaTime);
    if (this.__jumpRequested && this.__isGrounded) {
      this.__verticalVelocity = this.__options.jumpSpeed;
      this.__isGrounded = false;
    } else {
      this.__verticalVelocity -= this.__options.gravity * dt;
    }
    this.__jumpRequested = false;

    this.__controller.computeColliderMovement(this.__collider, {
      x: this.__desiredHorizontalVelocity.x * dt,
      y: this.__verticalVelocity * dt,
      z: this.__desiredHorizontalVelocity.z * dt,
    });
    const movement = this.__controller.computedMovement();
    this.__computedMovement.setComponents(movement.x, movement.y, movement.z);
    this.__isGrounded = this.__controller.computedGrounded();
    if (this.__isGrounded && this.__verticalVelocity < 0) {
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
  }

  get isGrounded(): boolean {
    return this.__isGrounded;
  }

  get computedMovement(): IVector3 {
    return this.__computedMovement;
  }

  set enabled(value: boolean) {
    this.__enabled = value;
  }

  get enabled(): boolean {
    return this.__enabled;
  }

  destroy(): void {
    RapierPhysicsStrategy._unregisterStepParticipant(this);
    const world = RapierPhysicsStrategy._getWorld();
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
  }

  private __validateOptions(options: ResolvedOptions): void {
    const positiveValues = [
      options.radius,
      options.height,
      options.contactOffset,
      options.maxStepHeight,
      options.minStepWidth,
      options.snapToGroundDistance,
      options.gravity,
      options.jumpSpeed,
      options.maxDeltaTime,
    ];
    if (positiveValues.some(value => !Number.isFinite(value) || value <= 0) || options.height <= options.radius * 2) {
      throw new Error('Character controller dimensions and movement settings must be finite positive values.');
    }
    if (!Number.isFinite(options.maxSlopeClimbAngle) || !Number.isFinite(options.minSlopeSlideAngle)) {
      throw new Error('Character controller slope angles must be finite values.');
    }
  }
}
