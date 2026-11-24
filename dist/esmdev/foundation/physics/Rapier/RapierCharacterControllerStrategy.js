// src/foundation/physics/Rapier/RapierCharacterControllerStrategy.ts
import { MutableQuaternion, MutableVector3, Quaternion, Vector3 } from "../../math/index.js";
import { Logger } from "../../misc/Logger.js";
import { PhysicsWorldQuery } from "../PhysicsWorldQuery.js";
import { resolveScaledCapsule } from "../ShapeTransformResolver.js";
import {
  RapierPhysicsStrategy
} from "./RapierPhysicsStrategy.js";
import { RapierPhysicsWorldQueryStrategy } from "./RapierPhysicsWorldQueryStrategy.js";
var defaultOptions = {
  contactOffset: 0.01,
  maxStepHeight: 0.25,
  minStepWidth: 0.2,
  maxSlopeClimbAngle: Math.PI / 4,
  minSlopeSlideAngle: 50 * Math.PI / 180,
  snapToGroundDistance: 0.15,
  gravity: 9.8,
  jumpSpeed: 4.5,
  maxDeltaTime: 1 / 15,
  applyImpulsesToDynamicBodies: false,
  groundProbeDistance: 0.3,
  groundProbeStartOffset: 0.01,
  groundCollisionGroup: 65535,
  groundCollisionMask: 65535,
  groundProbeRadius: 0.24,
  normalNudgeFactor: 1e-3,
  stuckRecoveryEnabled: true,
  stuckRecoveryFrameCount: 2,
  stuckRecoveryDistance: 0.01
};
var initialMotionState = {
  state: "falling",
  velocity: Vector3.zero(),
  horizontalSpeed: 0,
  verticalSpeed: 0,
  groundedDuration: 0,
  airborneDuration: 0,
  stateElapsedTime: 0,
  landingImpactSpeed: 0
};
var RapierCharacterControllerStrategy = class {
  constructor() {
    this.__options = { ...defaultOptions };
    this.__desiredHorizontalVelocity = MutableVector3.zero();
    this.__computedMovement = MutableVector3.zero();
    this.__verticalVelocity = 0;
    this.__isGrounded = false;
    this.__jumpRequested = false;
    this.__enabled = true;
    this.__capsuleBottomOffset = Vector3.zero();
    this.__stuckFrameCount = 0;
    this.__isRecovering = false;
    this.__motionState = initialMotionState;
    this.__lastStepDeltaTime = 0;
    this.__wasGrounded = false;
    this.__hasEstablishedGrounding = false;
    this.__stateVerticalVelocity = 0;
    this.__landingImpactSpeed = 0;
    this.__worldScale = Vector3.one();
    this.__isGroundProbeRadiusDerived = true;
    this.__warnedNonUniformScale = false;
    /** Reusable quaternion for world-rotation lookups (avoids per-frame allocations) */
    this.__tmpWorldRotation = MutableQuaternion.identity();
  }
  setup(entity, shapeInstance, options = {}) {
    var _a, _b, _c, _d, _e, _f;
    if (this.__rigidBody != null) {
      throw new Error("RapierCharacterControllerStrategy has already been set up.");
    }
    const { shapeIndex: _shapeIndex, radius: _radius, height: _height, ...movementOptions } = options;
    const resolvedOptions = {
      ...defaultOptions,
      ...movementOptions,
      groundProbeDistance: (_b = options.groundProbeDistance) != null ? _b : Math.max((_a = options.snapToGroundDistance) != null ? _a : defaultOptions.snapToGroundDistance, 0.3),
      groundProbeStartOffset: (_d = (_c = options.groundProbeStartOffset) != null ? _c : options.contactOffset) != null ? _d : defaultOptions.contactOffset
    };
    this.__validateOptions(resolvedOptions);
    const rapier = RapierPhysicsStrategy._getRapier();
    const world = RapierPhysicsStrategy._getWorld(entity.engine);
    if (rapier.RigidBodyDesc.kinematicPositionBased == null || rapier.ColliderDesc.capsule == null) {
      throw new Error("The injected Rapier module does not support kinematic capsule bodies.");
    }
    if (world.createCharacterController == null) {
      throw new Error("The injected Rapier world does not support character controllers.");
    }
    if (world.removeRigidBody == null || world.removeCharacterController == null) {
      throw new Error("The injected Rapier world does not support character-controller resource cleanup.");
    }
    if (shapeInstance.shape.type !== "capsule") {
      throw new Error("RapierCharacterControllerStrategy requires a capsule ShapeInstance.");
    }
    const scale = entity.getSceneGraph()._getPhysicsWorldScale();
    const absoluteScale = [Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z)];
    if (!absoluteScale.every(Number.isFinite) || absoluteScale.some((component) => component <= 0)) {
      throw new Error("Character controller scale components must be finite and non-zero at setup.");
    }
    const capsule = shapeInstance.shape;
    if (capsule.radiusBottom !== capsule.radiusTop) {
      Logger.default.warn(
        `Rapier approximates asymmetric character capsule radii (${capsule.radiusBottom}, ${capsule.radiusTop}) with the maximum radius.`
      );
    }
    const resolvedCapsule = this.__resolveCharacterCapsule(shapeInstance, scale);
    const radius = resolvedCapsule.radius;
    resolvedOptions.groundProbeRadius = (_e = options.groundProbeRadius) != null ? _e : radius * 0.8;
    if (!Number.isFinite(resolvedOptions.groundProbeRadius) || resolvedOptions.groundProbeRadius <= 0 || resolvedOptions.groundProbeRadius > radius) {
      throw new Error(
        "Character controller groundProbeRadius must be positive and no greater than the capsule radius."
      );
    }
    const colliderDesc = this.__createCharacterColliderDesc(resolvedCapsule);
    const initialPosition = entity.getSceneGraph().position;
    const initialRotation = entity.getSceneGraph().getQuaternionRecursivelyTo(this.__tmpWorldRotation);
    const rigidBodyDesc = rapier.RigidBodyDesc.kinematicPositionBased().setTranslation(initialPosition.x, initialPosition.y, initialPosition.z).setRotation({
      x: initialRotation.x,
      y: initialRotation.y,
      z: initialRotation.z,
      w: initialRotation.w
    });
    let rigidBody;
    let collider;
    let controller;
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
      (_f = controller.setNormalNudgeFactor) == null ? void 0 : _f.call(controller, resolvedOptions.normalNudgeFactor);
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
  setDesiredHorizontalVelocity(velocity) {
    this.__desiredHorizontalVelocity.setComponents(velocity.x, 0, velocity.z);
  }
  requestJump() {
    this.__jumpRequested = true;
  }
  teleport(position) {
    var _a, _b, _c;
    if (this.__rigidBody == null) {
      throw new Error("RapierCharacterControllerStrategy.setup() must be called before teleport().");
    }
    const translation = { x: position.x, y: position.y, z: position.z };
    this.__rigidBody.setTranslation(translation, true);
    (_b = (_a = this.__rigidBody).setNextKinematicTranslation) == null ? void 0 : _b.call(_a, translation);
    (_c = this.__entity) == null ? void 0 : _c.getSceneGraph().setPositionWithoutPhysics(Vector3.fromCopy3(position.x, position.y, position.z));
    this.__verticalVelocity = 0;
    this.__isGrounded = false;
    this.__jumpRequested = false;
    this.__computedMovement.setComponents(0, 0, 0);
    this.__groundContact = void 0;
    this.__stuckFrameCount = 0;
    this.__isRecovering = false;
    this.__motionState = initialMotionState;
    this.__lastStepDeltaTime = 0;
    this.__wasGrounded = false;
    this.__hasEstablishedGrounding = false;
    this.__stateVerticalVelocity = 0;
    this.__landingImpactSpeed = 0;
  }
  preStep(deltaTime) {
    var _a, _b;
    if (!this.__enabled || this.__entity == null || this.__rigidBody == null || this.__collider == null || this.__controller == null) {
      return;
    }
    this.__synchronizeScale();
    const current = this.__synchronizePosition();
    if (this.__rigidBody.setNextKinematicRotation == null) {
      throw new Error("The injected Rapier rigid body does not support kinematic rotation.");
    }
    const worldRotation = this.__entity.getSceneGraph().getQuaternionRecursivelyTo(this.__tmpWorldRotation);
    this.__rigidBody.setNextKinematicRotation({
      x: worldRotation.x,
      y: worldRotation.y,
      z: worldRotation.z,
      w: worldRotation.w
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
      z: this.__desiredHorizontalVelocity.z * dt
    };
    const filterFlags = (_b = (_a = RapierPhysicsStrategy._getRapier().QueryFilterFlags) == null ? void 0 : _a.EXCLUDE_SENSORS) != null ? _b : 8;
    this.__controller.computeColliderMovement(this.__collider, desiredMovement, filterFlags);
    let movement = this.__controller.computedMovement();
    const collisionNormals = this.__getCollisionNormals();
    if (this.__verticalVelocity > 0 && collisionNormals.some((normal) => normal.y < -0.5)) {
      this.__verticalVelocity = 0;
    }
    this.__isGrounded = this.__controller.computedGrounded();
    const isDownwardMovementBlocked = this.__options.stuckRecoveryEnabled && !this.__isGrounded && this.__verticalVelocity < 0 && desiredMovement.y < -1e-6 && movement.y > -1e-6;
    this.__stuckFrameCount = isDownwardMovementBlocked ? this.__stuckFrameCount + 1 : 0;
    if (this.__stuckFrameCount >= this.__options.stuckRecoveryFrameCount) {
      this.__controller.computeColliderMovement(this.__collider, { x: 0, y: desiredMovement.y, z: 0 }, filterFlags);
      const verticalMovement = this.__controller.computedMovement();
      if (verticalMovement.y < -1e-6) {
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
    const next = {
      x: current.x + movement.x,
      y: current.y + movement.y,
      z: current.z + movement.z
    };
    if (this.__rigidBody.setNextKinematicTranslation == null) {
      throw new Error("The injected Rapier rigid body does not support kinematic translation.");
    }
    this.__rigidBody.setNextKinematicTranslation(next);
  }
  postStep() {
    if (!this.__enabled || this.__entity == null || this.__rigidBody == null) {
      return;
    }
    const position = this.__rigidBody.translation();
    this.__entity.getSceneGraph().setPositionWithoutPhysics(Vector3.fromCopy3(position.x, position.y, position.z));
    this.__updateGroundContact(position);
    this.__updateMotionState();
  }
  get isGrounded() {
    return this.__isGrounded;
  }
  get computedMovement() {
    return this.__computedMovement;
  }
  get groundContact() {
    return this.__groundContact;
  }
  get isRecovering() {
    return this.__isRecovering;
  }
  get motionState() {
    return this.__motionState;
  }
  set enabled(value) {
    this.__enabled = value;
    if (!value) {
      this.__groundContact = void 0;
      this.__stuckFrameCount = 0;
      this.__isRecovering = false;
    }
  }
  get enabled() {
    return this.__enabled;
  }
  destroy() {
    var _a, _b, _c;
    RapierPhysicsStrategy._unregisterStepParticipant(this);
    const engine = (_a = this.__entity) == null ? void 0 : _a.engine;
    RapierPhysicsStrategy._unregisterExternalCollider(this.__collider, engine);
    const world = RapierPhysicsStrategy._getWorld(engine);
    if (this.__controller != null) {
      (_b = world.removeCharacterController) == null ? void 0 : _b.call(world, this.__controller);
    }
    if (this.__rigidBody != null) {
      (_c = world.removeRigidBody) == null ? void 0 : _c.call(world, this.__rigidBody);
    }
    this.__controller = void 0;
    this.__collider = void 0;
    this.__rigidBody = void 0;
    this.__entity = void 0;
    this.__worldQuery = void 0;
    this.__groundContact = void 0;
    this.__stuckFrameCount = 0;
    this.__isRecovering = false;
    this.__motionState = initialMotionState;
    this.__lastStepDeltaTime = 0;
    this.__wasGrounded = false;
    this.__hasEstablishedGrounding = false;
    this.__stateVerticalVelocity = 0;
    this.__landingImpactSpeed = 0;
    this.__shapeInstance = void 0;
    this.__worldScale = Vector3.one();
    this.__isGroundProbeRadiusDerived = true;
    this.__warnedNonUniformScale = false;
  }
  __resolveCharacterCapsule(shapeInstance, worldScale) {
    if (shapeInstance.shape.type !== "capsule") {
      throw new Error("RapierCharacterControllerStrategy requires a capsule ShapeInstance.");
    }
    const capsule = shapeInstance.shape;
    const resolved = resolveScaledCapsule(
      capsule.height,
      Math.max(capsule.radiusBottom, capsule.radiusTop),
      shapeInstance.localRotation,
      worldScale
    );
    if (resolved.approximated && !this.__warnedNonUniformScale) {
      Logger.default.warn("Rapier conservatively approximates non-uniform scale for the character capsule.");
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
      bottomOffset: Vector3.add(localPosition, downwardExtent)
    };
  }
  __createCharacterColliderDesc(resolved) {
    var _a, _b, _c, _d;
    const rapier = RapierPhysicsStrategy._getRapier();
    let colliderDesc = rapier.ColliderDesc.capsule(resolved.halfHeight, resolved.radius);
    colliderDesc = (_b = (_a = colliderDesc.setTranslation) == null ? void 0 : _a.call(colliderDesc, resolved.localPosition.x, resolved.localPosition.y, resolved.localPosition.z)) != null ? _b : colliderDesc;
    colliderDesc = (_d = (_c = colliderDesc.setRotation) == null ? void 0 : _c.call(colliderDesc, {
      x: resolved.rotation.x,
      y: resolved.rotation.y,
      z: resolved.rotation.z,
      w: resolved.rotation.w
    })) != null ? _d : colliderDesc;
    return colliderDesc;
  }
  __synchronizeScale() {
    if (this.__entity == null || this.__rigidBody == null || this.__collider == null || this.__shapeInstance == null) {
      return;
    }
    const scale = this.__entity.getSceneGraph()._getPhysicsWorldScale();
    const absoluteScale = Vector3.fromCopy3(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z));
    const hasChanged = Math.abs(scale.x - this.__worldScale.x) > 1e-6 || Math.abs(scale.y - this.__worldScale.y) > 1e-6 || Math.abs(scale.z - this.__worldScale.z) > 1e-6;
    if (!hasChanged) {
      return;
    }
    if (![absoluteScale.x, absoluteScale.y, absoluteScale.z].every(Number.isFinite) || absoluteScale.x <= 0 || absoluteScale.y <= 0 || absoluteScale.z <= 0) {
      throw new Error("Character controller scale components must remain finite and non-zero after setup.");
    }
    const world = RapierPhysicsStrategy._getWorld(this.__entity.engine);
    if (world.removeRigidBody == null) {
      throw new Error("The injected Rapier world does not support rebuilding a scaled character body.");
    }
    const resolved = this.__resolveCharacterCapsule(this.__shapeInstance, scale);
    const groundProbeRadius = this.__isGroundProbeRadiusDerived ? resolved.radius * 0.8 : this.__options.groundProbeRadius;
    if (!Number.isFinite(groundProbeRadius) || groundProbeRadius <= 0 || groundProbeRadius > resolved.radius) {
      throw new Error(
        "Character controller groundProbeRadius must be positive and no greater than the scaled capsule radius."
      );
    }
    const colliderDesc = this.__createCharacterColliderDesc(resolved);
    const position = this.__rigidBody.translation();
    const rotation = this.__rigidBody.rotation();
    const rigidBodyDesc = RapierPhysicsStrategy._getRapier().RigidBodyDesc.kinematicPositionBased().setTranslation(position.x, position.y, position.z).setRotation({ x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w });
    const previousRigidBody = this.__rigidBody;
    const previousCollider = this.__collider;
    const rigidBody = world.createRigidBody(rigidBodyDesc);
    let collider;
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
  __synchronizePosition() {
    const rigidBody = this.__rigidBody;
    const current = rigidBody.translation();
    const sceneGraphPosition = this.__entity.getSceneGraph().position;
    const hasChanged = Math.abs(sceneGraphPosition.x - current.x) > 1e-6 || Math.abs(sceneGraphPosition.y - current.y) > 1e-6 || Math.abs(sceneGraphPosition.z - current.z) > 1e-6;
    if (!hasChanged) {
      return current;
    }
    const synchronized = {
      x: sceneGraphPosition.x,
      y: sceneGraphPosition.y,
      z: sceneGraphPosition.z
    };
    rigidBody.setTranslation(synchronized, true);
    return synchronized;
  }
  __updateMotionState() {
    const dt = this.__lastStepDeltaTime;
    const velocity = dt > 0 ? Vector3.fromCopy3(
      this.__computedMovement.x / dt,
      this.__computedMovement.y / dt,
      this.__computedMovement.z / dt
    ) : Vector3.zero();
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
      groundContact: this.__groundContact
    };
    this.__wasGrounded = isGroundedNow;
    if (isGroundedNow) {
      this.__hasEstablishedGrounding = true;
    }
  }
  __resolveMovementState() {
    if (this.__isRecovering) {
      return "recovering";
    }
    if (!this.__hasEstablishedGrounding && this.__isGrounded) {
      return "grounded";
    }
    if (!this.__wasGrounded && this.__isGrounded) {
      return "landing";
    }
    if (this.__isGrounded) {
      return "grounded";
    }
    if (this.__groundContact != null && !this.__groundContact.isWalkable && this.__stateVerticalVelocity <= 0) {
      return "sliding";
    }
    return this.__stateVerticalVelocity > 1e-6 ? "rising" : "falling";
  }
  __getCollisionNormals() {
    var _a, _b, _c, _d, _e;
    const count = (_c = (_b = (_a = this.__controller) == null ? void 0 : _a.numComputedCollisions) == null ? void 0 : _b.call(_a)) != null ? _c : 0;
    const normals = [];
    for (let i = 0; i < count; i++) {
      const collision = (_e = (_d = this.__controller) == null ? void 0 : _d.computedCollision) == null ? void 0 : _e.call(_d, i);
      if (collision != null) {
        normals.push(collision.normal1);
      }
    }
    return normals;
  }
  __createNudgeMovement(movement, normals) {
    let x = 0;
    let z = 0;
    for (const normal of normals) {
      x += normal.x;
      z += normal.z;
    }
    const length = Math.hypot(x, z);
    if (length <= 1e-6) {
      return movement;
    }
    const scale = this.__options.stuckRecoveryDistance / length;
    return { x: x * scale, y: Math.min(movement.y, 0), z: z * scale };
  }
  __updateGroundContact(position) {
    var _a, _b;
    if (this.__entity == null) {
      this.__groundContact = void 0;
      return;
    }
    const bodyRotation = (_a = this.__rigidBody) == null ? void 0 : _a.rotation();
    const capsuleBottomOffset = bodyRotation == null ? this.__capsuleBottomOffset : Quaternion.fromCopy4(bodyRotation.x, bodyRotation.y, bodyRotation.z, bodyRotation.w).transformVector3(
      this.__capsuleBottomOffset
    );
    const capsuleBottom = Vector3.add(Vector3.fromCopy3(position.x, position.y, position.z), capsuleBottomOffset);
    const start = Vector3.add(
      capsuleBottom,
      Vector3.fromCopy3(0, this.__options.groundProbeRadius + this.__options.groundProbeStartOffset, 0)
    );
    const hit = (_b = this.__worldQuery) == null ? void 0 : _b.castSphere(
      start,
      this.__options.groundProbeRadius,
      Vector3.fromCopy3(0, -1, 0),
      this.__options.groundProbeDistance,
      {
        includeSensors: false,
        collisionGroup: this.__options.groundCollisionGroup,
        collisionMask: this.__options.groundCollisionMask,
        excludeEntities: [this.__entity]
      }
    );
    if (hit == null || hit.normal.y <= 0) {
      this.__groundContact = void 0;
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
      isWalkable: slopeAngle <= this.__options.maxSlopeClimbAngle
    };
  }
  __validateOptions(options) {
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
      options.stuckRecoveryDistance
    ];
    if (positiveValues.some((value) => !Number.isFinite(value) || value <= 0)) {
      throw new Error("Character controller dimensions and movement settings must be finite positive values.");
    }
    if (!Number.isFinite(options.maxSlopeClimbAngle) || !Number.isFinite(options.minSlopeSlideAngle)) {
      throw new Error("Character controller slope angles must be finite values.");
    }
    if (!Number.isFinite(options.groundProbeStartOffset) || options.groundProbeStartOffset < 0) {
      throw new Error("Character controller groundProbeStartOffset must be a finite non-negative value.");
    }
    RapierPhysicsStrategy._packCollisionGroups(options.groundCollisionGroup, options.groundCollisionMask);
    if (!Number.isInteger(options.stuckRecoveryFrameCount) || options.stuckRecoveryFrameCount <= 0) {
      throw new Error("Character controller stuckRecoveryFrameCount must be a positive integer.");
    }
  }
};
export {
  RapierCharacterControllerStrategy
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vcGh5c2ljcy9SYXBpZXIvUmFwaWVyQ2hhcmFjdGVyQ29udHJvbGxlclN0cmF0ZWd5LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IFNoYXBlSW5zdGFuY2UgfSBmcm9tICcuLi8uLi9nZW9tZXRyeS9TaGFwZSc7XG5pbXBvcnQgdHlwZSB7IElTY2VuZUdyYXBoRW50aXR5IH0gZnJvbSAnLi4vLi4vaGVscGVycy9FbnRpdHlIZWxwZXInO1xuaW1wb3J0IHsgdHlwZSBJVmVjdG9yMywgTXV0YWJsZVF1YXRlcm5pb24sIE11dGFibGVWZWN0b3IzLCBRdWF0ZXJuaW9uLCBWZWN0b3IzIH0gZnJvbSAnLi4vLi4vbWF0aCc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuLi8uLi9taXNjL0xvZ2dlcic7XG5pbXBvcnQgdHlwZSB7XG4gIENoYXJhY3RlckNvbnRyb2xsZXJPcHRpb25zLFxuICBDaGFyYWN0ZXJDb250cm9sbGVyU3RyYXRlZ3ksXG4gIENoYXJhY3Rlckdyb3VuZENvbnRhY3QsXG4gIENoYXJhY3Rlck1vdGlvblN0YXRlLFxuICBDaGFyYWN0ZXJNb3ZlbWVudFN0YXRlLFxufSBmcm9tICcuLi9DaGFyYWN0ZXJDb250cm9sbGVyU3RyYXRlZ3knO1xuaW1wb3J0IHsgUGh5c2ljc1dvcmxkUXVlcnkgfSBmcm9tICcuLi9QaHlzaWNzV29ybGRRdWVyeSc7XG5pbXBvcnQgeyByZXNvbHZlU2NhbGVkQ2Fwc3VsZSB9IGZyb20gJy4uL1NoYXBlVHJhbnNmb3JtUmVzb2x2ZXInO1xuaW1wb3J0IHtcbiAgdHlwZSBSYXBpZXJDaGFyYWN0ZXJDb250cm9sbGVyTGlrZSxcbiAgdHlwZSBSYXBpZXJDb2xsaWRlckxpa2UsXG4gIFJhcGllclBoeXNpY3NTdHJhdGVneSxcbiAgdHlwZSBSYXBpZXJSaWdpZEJvZHlMaWtlLFxuICB0eXBlIFJhcGllclN0ZXBQYXJ0aWNpcGFudCxcbiAgdHlwZSBSYXBpZXJWZWN0b3IzTGlrZSxcbn0gZnJvbSAnLi9SYXBpZXJQaHlzaWNzU3RyYXRlZ3knO1xuaW1wb3J0IHsgUmFwaWVyUGh5c2ljc1dvcmxkUXVlcnlTdHJhdGVneSB9IGZyb20gJy4vUmFwaWVyUGh5c2ljc1dvcmxkUXVlcnlTdHJhdGVneSc7XG5cbnR5cGUgUmVzb2x2ZWRPcHRpb25zID0gUmVxdWlyZWQ8T21pdDxDaGFyYWN0ZXJDb250cm9sbGVyT3B0aW9ucywgJ3NoYXBlSW5kZXgnIHwgJ3JhZGl1cycgfCAnaGVpZ2h0Jz4+O1xudHlwZSBSZXNvbHZlZENoYXJhY3RlckNhcHN1bGUgPSBSZXR1cm5UeXBlPHR5cGVvZiByZXNvbHZlU2NhbGVkQ2Fwc3VsZT4gJiB7XG4gIGxvY2FsUG9zaXRpb246IElWZWN0b3IzO1xuICBib3R0b21PZmZzZXQ6IElWZWN0b3IzO1xufTtcblxuY29uc3QgZGVmYXVsdE9wdGlvbnM6IFJlc29sdmVkT3B0aW9ucyA9IHtcbiAgY29udGFjdE9mZnNldDogMC4wMSxcbiAgbWF4U3RlcEhlaWdodDogMC4yNSxcbiAgbWluU3RlcFdpZHRoOiAwLjIsXG4gIG1heFNsb3BlQ2xpbWJBbmdsZTogTWF0aC5QSSAvIDQsXG4gIG1pblNsb3BlU2xpZGVBbmdsZTogKDUwICogTWF0aC5QSSkgLyAxODAsXG4gIHNuYXBUb0dyb3VuZERpc3RhbmNlOiAwLjE1LFxuICBncmF2aXR5OiA5LjgsXG4gIGp1bXBTcGVlZDogNC41LFxuICBtYXhEZWx0YVRpbWU6IDEgLyAxNSxcbiAgYXBwbHlJbXB1bHNlc1RvRHluYW1pY0JvZGllczogZmFsc2UsXG4gIGdyb3VuZFByb2JlRGlzdGFuY2U6IDAuMyxcbiAgZ3JvdW5kUHJvYmVTdGFydE9mZnNldDogMC4wMSxcbiAgZ3JvdW5kQ29sbGlzaW9uR3JvdXA6IDB4ZmZmZixcbiAgZ3JvdW5kQ29sbGlzaW9uTWFzazogMHhmZmZmLFxuICBncm91bmRQcm9iZVJhZGl1czogMC4yNCxcbiAgbm9ybWFsTnVkZ2VGYWN0b3I6IDAuMDAxLFxuICBzdHVja1JlY292ZXJ5RW5hYmxlZDogdHJ1ZSxcbiAgc3R1Y2tSZWNvdmVyeUZyYW1lQ291bnQ6IDIsXG4gIHN0dWNrUmVjb3ZlcnlEaXN0YW5jZTogMC4wMSxcbn07XG5cbmNvbnN0IGluaXRpYWxNb3Rpb25TdGF0ZTogQ2hhcmFjdGVyTW90aW9uU3RhdGUgPSB7XG4gIHN0YXRlOiAnZmFsbGluZycsXG4gIHZlbG9jaXR5OiBWZWN0b3IzLnplcm8oKSxcbiAgaG9yaXpvbnRhbFNwZWVkOiAwLFxuICB2ZXJ0aWNhbFNwZWVkOiAwLFxuICBncm91bmRlZER1cmF0aW9uOiAwLFxuICBhaXJib3JuZUR1cmF0aW9uOiAwLFxuICBzdGF0ZUVsYXBzZWRUaW1lOiAwLFxuICBsYW5kaW5nSW1wYWN0U3BlZWQ6IDAsXG59O1xuXG4vKiogUmFwaWVyLWJhY2tlZCBraW5lbWF0aWMgY2Fwc3VsZSBjaGFyYWN0ZXIgY29udHJvbGxlci4gKi9cbmV4cG9ydCBjbGFzcyBSYXBpZXJDaGFyYWN0ZXJDb250cm9sbGVyU3RyYXRlZ3kgaW1wbGVtZW50cyBDaGFyYWN0ZXJDb250cm9sbGVyU3RyYXRlZ3ksIFJhcGllclN0ZXBQYXJ0aWNpcGFudCB7XG4gIHByaXZhdGUgX19lbnRpdHk/OiBJU2NlbmVHcmFwaEVudGl0eTtcbiAgcHJpdmF0ZSBfX3JpZ2lkQm9keT86IFJhcGllclJpZ2lkQm9keUxpa2U7XG4gIHByaXZhdGUgX19jb2xsaWRlcj86IFJhcGllckNvbGxpZGVyTGlrZTtcbiAgcHJpdmF0ZSBfX2NvbnRyb2xsZXI/OiBSYXBpZXJDaGFyYWN0ZXJDb250cm9sbGVyTGlrZTtcbiAgcHJpdmF0ZSBfX29wdGlvbnM6IFJlc29sdmVkT3B0aW9ucyA9IHsgLi4uZGVmYXVsdE9wdGlvbnMgfTtcbiAgcHJpdmF0ZSBfX2Rlc2lyZWRIb3Jpem9udGFsVmVsb2NpdHkgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgX19jb21wdXRlZE1vdmVtZW50ID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIF9fdmVydGljYWxWZWxvY2l0eSA9IDA7XG4gIHByaXZhdGUgX19pc0dyb3VuZGVkID0gZmFsc2U7XG4gIHByaXZhdGUgX19qdW1wUmVxdWVzdGVkID0gZmFsc2U7XG4gIHByaXZhdGUgX19lbmFibGVkID0gdHJ1ZTtcbiAgcHJpdmF0ZSBfX2dyb3VuZENvbnRhY3Q/OiBDaGFyYWN0ZXJHcm91bmRDb250YWN0O1xuICBwcml2YXRlIF9fY2Fwc3VsZUJvdHRvbU9mZnNldCA9IFZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIF9fd29ybGRRdWVyeT86IFBoeXNpY3NXb3JsZFF1ZXJ5O1xuICBwcml2YXRlIF9fc3R1Y2tGcmFtZUNvdW50ID0gMDtcbiAgcHJpdmF0ZSBfX2lzUmVjb3ZlcmluZyA9IGZhbHNlO1xuICBwcml2YXRlIF9fbW90aW9uU3RhdGU6IENoYXJhY3Rlck1vdGlvblN0YXRlID0gaW5pdGlhbE1vdGlvblN0YXRlO1xuICBwcml2YXRlIF9fbGFzdFN0ZXBEZWx0YVRpbWUgPSAwO1xuICBwcml2YXRlIF9fd2FzR3JvdW5kZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX2hhc0VzdGFibGlzaGVkR3JvdW5kaW5nID0gZmFsc2U7XG4gIHByaXZhdGUgX19zdGF0ZVZlcnRpY2FsVmVsb2NpdHkgPSAwO1xuICBwcml2YXRlIF9fbGFuZGluZ0ltcGFjdFNwZWVkID0gMDtcbiAgcHJpdmF0ZSBfX3NoYXBlSW5zdGFuY2U/OiBTaGFwZUluc3RhbmNlO1xuICBwcml2YXRlIF9fd29ybGRTY2FsZSA9IFZlY3RvcjMub25lKCk7XG4gIHByaXZhdGUgX19pc0dyb3VuZFByb2JlUmFkaXVzRGVyaXZlZCA9IHRydWU7XG4gIHByaXZhdGUgX193YXJuZWROb25Vbmlmb3JtU2NhbGUgPSBmYWxzZTtcbiAgLyoqIFJldXNhYmxlIHF1YXRlcm5pb24gZm9yIHdvcmxkLXJvdGF0aW9uIGxvb2t1cHMgKGF2b2lkcyBwZXItZnJhbWUgYWxsb2NhdGlvbnMpICovXG4gIHByaXZhdGUgX190bXBXb3JsZFJvdGF0aW9uID0gTXV0YWJsZVF1YXRlcm5pb24uaWRlbnRpdHkoKTtcblxuICBzZXR1cChlbnRpdHk6IElTY2VuZUdyYXBoRW50aXR5LCBzaGFwZUluc3RhbmNlOiBTaGFwZUluc3RhbmNlLCBvcHRpb25zOiBDaGFyYWN0ZXJDb250cm9sbGVyT3B0aW9ucyA9IHt9KTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX19yaWdpZEJvZHkgIT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdSYXBpZXJDaGFyYWN0ZXJDb250cm9sbGVyU3RyYXRlZ3kgaGFzIGFscmVhZHkgYmVlbiBzZXQgdXAuJyk7XG4gICAgfVxuXG4gICAgY29uc3QgeyBzaGFwZUluZGV4OiBfc2hhcGVJbmRleCwgcmFkaXVzOiBfcmFkaXVzLCBoZWlnaHQ6IF9oZWlnaHQsIC4uLm1vdmVtZW50T3B0aW9ucyB9ID0gb3B0aW9ucztcbiAgICBjb25zdCByZXNvbHZlZE9wdGlvbnM6IFJlc29sdmVkT3B0aW9ucyA9IHtcbiAgICAgIC4uLmRlZmF1bHRPcHRpb25zLFxuICAgICAgLi4ubW92ZW1lbnRPcHRpb25zLFxuICAgICAgZ3JvdW5kUHJvYmVEaXN0YW5jZTpcbiAgICAgICAgb3B0aW9ucy5ncm91bmRQcm9iZURpc3RhbmNlID8/XG4gICAgICAgIE1hdGgubWF4KG9wdGlvbnMuc25hcFRvR3JvdW5kRGlzdGFuY2UgPz8gZGVmYXVsdE9wdGlvbnMuc25hcFRvR3JvdW5kRGlzdGFuY2UsIDAuMyksXG4gICAgICBncm91bmRQcm9iZVN0YXJ0T2Zmc2V0OiBvcHRpb25zLmdyb3VuZFByb2JlU3RhcnRPZmZzZXQgPz8gb3B0aW9ucy5jb250YWN0T2Zmc2V0ID8/IGRlZmF1bHRPcHRpb25zLmNvbnRhY3RPZmZzZXQsXG4gICAgfTtcbiAgICB0aGlzLl9fdmFsaWRhdGVPcHRpb25zKHJlc29sdmVkT3B0aW9ucyk7XG5cbiAgICBjb25zdCByYXBpZXIgPSBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX2dldFJhcGllcigpO1xuICAgIGNvbnN0IHdvcmxkID0gUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9nZXRXb3JsZChlbnRpdHkuZW5naW5lKTtcbiAgICBpZiAocmFwaWVyLlJpZ2lkQm9keURlc2Mua2luZW1hdGljUG9zaXRpb25CYXNlZCA9PSBudWxsIHx8IHJhcGllci5Db2xsaWRlckRlc2MuY2Fwc3VsZSA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBpbmplY3RlZCBSYXBpZXIgbW9kdWxlIGRvZXMgbm90IHN1cHBvcnQga2luZW1hdGljIGNhcHN1bGUgYm9kaWVzLicpO1xuICAgIH1cbiAgICBpZiAod29ybGQuY3JlYXRlQ2hhcmFjdGVyQ29udHJvbGxlciA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBpbmplY3RlZCBSYXBpZXIgd29ybGQgZG9lcyBub3Qgc3VwcG9ydCBjaGFyYWN0ZXIgY29udHJvbGxlcnMuJyk7XG4gICAgfVxuICAgIGlmICh3b3JsZC5yZW1vdmVSaWdpZEJvZHkgPT0gbnVsbCB8fCB3b3JsZC5yZW1vdmVDaGFyYWN0ZXJDb250cm9sbGVyID09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGluamVjdGVkIFJhcGllciB3b3JsZCBkb2VzIG5vdCBzdXBwb3J0IGNoYXJhY3Rlci1jb250cm9sbGVyIHJlc291cmNlIGNsZWFudXAuJyk7XG4gICAgfVxuICAgIGlmIChzaGFwZUluc3RhbmNlLnNoYXBlLnR5cGUgIT09ICdjYXBzdWxlJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdSYXBpZXJDaGFyYWN0ZXJDb250cm9sbGVyU3RyYXRlZ3kgcmVxdWlyZXMgYSBjYXBzdWxlIFNoYXBlSW5zdGFuY2UuJyk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NhbGUgPSBlbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLl9nZXRQaHlzaWNzV29ybGRTY2FsZSgpO1xuICAgIGNvbnN0IGFic29sdXRlU2NhbGUgPSBbTWF0aC5hYnMoc2NhbGUueCksIE1hdGguYWJzKHNjYWxlLnkpLCBNYXRoLmFicyhzY2FsZS56KV07XG4gICAgaWYgKCFhYnNvbHV0ZVNjYWxlLmV2ZXJ5KE51bWJlci5pc0Zpbml0ZSkgfHwgYWJzb2x1dGVTY2FsZS5zb21lKGNvbXBvbmVudCA9PiBjb21wb25lbnQgPD0gMCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2hhcmFjdGVyIGNvbnRyb2xsZXIgc2NhbGUgY29tcG9uZW50cyBtdXN0IGJlIGZpbml0ZSBhbmQgbm9uLXplcm8gYXQgc2V0dXAuJyk7XG4gICAgfVxuICAgIGNvbnN0IGNhcHN1bGUgPSBzaGFwZUluc3RhbmNlLnNoYXBlO1xuICAgIGlmIChjYXBzdWxlLnJhZGl1c0JvdHRvbSAhPT0gY2Fwc3VsZS5yYWRpdXNUb3ApIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0Lndhcm4oXG4gICAgICAgIGBSYXBpZXIgYXBwcm94aW1hdGVzIGFzeW1tZXRyaWMgY2hhcmFjdGVyIGNhcHN1bGUgcmFkaWkgKCR7Y2Fwc3VsZS5yYWRpdXNCb3R0b219LCAke2NhcHN1bGUucmFkaXVzVG9wfSkgd2l0aCB0aGUgbWF4aW11bSByYWRpdXMuYFxuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3QgcmVzb2x2ZWRDYXBzdWxlID0gdGhpcy5fX3Jlc29sdmVDaGFyYWN0ZXJDYXBzdWxlKHNoYXBlSW5zdGFuY2UsIHNjYWxlKTtcbiAgICBjb25zdCByYWRpdXMgPSByZXNvbHZlZENhcHN1bGUucmFkaXVzO1xuICAgIHJlc29sdmVkT3B0aW9ucy5ncm91bmRQcm9iZVJhZGl1cyA9IG9wdGlvbnMuZ3JvdW5kUHJvYmVSYWRpdXMgPz8gcmFkaXVzICogMC44O1xuICAgIGlmIChcbiAgICAgICFOdW1iZXIuaXNGaW5pdGUocmVzb2x2ZWRPcHRpb25zLmdyb3VuZFByb2JlUmFkaXVzKSB8fFxuICAgICAgcmVzb2x2ZWRPcHRpb25zLmdyb3VuZFByb2JlUmFkaXVzIDw9IDAgfHxcbiAgICAgIHJlc29sdmVkT3B0aW9ucy5ncm91bmRQcm9iZVJhZGl1cyA+IHJhZGl1c1xuICAgICkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnQ2hhcmFjdGVyIGNvbnRyb2xsZXIgZ3JvdW5kUHJvYmVSYWRpdXMgbXVzdCBiZSBwb3NpdGl2ZSBhbmQgbm8gZ3JlYXRlciB0aGFuIHRoZSBjYXBzdWxlIHJhZGl1cy4nXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCBjb2xsaWRlckRlc2MgPSB0aGlzLl9fY3JlYXRlQ2hhcmFjdGVyQ29sbGlkZXJEZXNjKHJlc29sdmVkQ2Fwc3VsZSk7XG5cbiAgICBjb25zdCBpbml0aWFsUG9zaXRpb24gPSBlbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLnBvc2l0aW9uO1xuICAgIGNvbnN0IGluaXRpYWxSb3RhdGlvbiA9IGVudGl0eS5nZXRTY2VuZUdyYXBoKCkuZ2V0UXVhdGVybmlvblJlY3Vyc2l2ZWx5VG8odGhpcy5fX3RtcFdvcmxkUm90YXRpb24pO1xuICAgIGNvbnN0IHJpZ2lkQm9keURlc2MgPSByYXBpZXIuUmlnaWRCb2R5RGVzYy5raW5lbWF0aWNQb3NpdGlvbkJhc2VkKClcbiAgICAgIC5zZXRUcmFuc2xhdGlvbihpbml0aWFsUG9zaXRpb24ueCwgaW5pdGlhbFBvc2l0aW9uLnksIGluaXRpYWxQb3NpdGlvbi56KVxuICAgICAgLnNldFJvdGF0aW9uKHtcbiAgICAgICAgeDogaW5pdGlhbFJvdGF0aW9uLngsXG4gICAgICAgIHk6IGluaXRpYWxSb3RhdGlvbi55LFxuICAgICAgICB6OiBpbml0aWFsUm90YXRpb24ueixcbiAgICAgICAgdzogaW5pdGlhbFJvdGF0aW9uLncsXG4gICAgICB9KTtcblxuICAgIGxldCByaWdpZEJvZHk6IFJhcGllclJpZ2lkQm9keUxpa2UgfCB1bmRlZmluZWQ7XG4gICAgbGV0IGNvbGxpZGVyOiBSYXBpZXJDb2xsaWRlckxpa2UgfCB1bmRlZmluZWQ7XG4gICAgbGV0IGNvbnRyb2xsZXI6IFJhcGllckNoYXJhY3RlckNvbnRyb2xsZXJMaWtlIHwgdW5kZWZpbmVkO1xuICAgIHRyeSB7XG4gICAgICByaWdpZEJvZHkgPSB3b3JsZC5jcmVhdGVSaWdpZEJvZHkocmlnaWRCb2R5RGVzYyk7XG4gICAgICBjb2xsaWRlciA9IHdvcmxkLmNyZWF0ZUNvbGxpZGVyKGNvbGxpZGVyRGVzYywgcmlnaWRCb2R5KTtcbiAgICAgIFJhcGllclBoeXNpY3NTdHJhdGVneS5fcmVnaXN0ZXJFeHRlcm5hbENvbGxpZGVyKGNvbGxpZGVyLCBlbnRpdHkpO1xuICAgICAgY29udHJvbGxlciA9IHdvcmxkLmNyZWF0ZUNoYXJhY3RlckNvbnRyb2xsZXIocmVzb2x2ZWRPcHRpb25zLmNvbnRhY3RPZmZzZXQpO1xuICAgICAgY29udHJvbGxlci5lbmFibGVBdXRvc3RlcChyZXNvbHZlZE9wdGlvbnMubWF4U3RlcEhlaWdodCwgcmVzb2x2ZWRPcHRpb25zLm1pblN0ZXBXaWR0aCwgZmFsc2UpO1xuICAgICAgY29udHJvbGxlci5lbmFibGVTbmFwVG9Hcm91bmQocmVzb2x2ZWRPcHRpb25zLnNuYXBUb0dyb3VuZERpc3RhbmNlKTtcbiAgICAgIGNvbnRyb2xsZXIuc2V0TWF4U2xvcGVDbGltYkFuZ2xlKHJlc29sdmVkT3B0aW9ucy5tYXhTbG9wZUNsaW1iQW5nbGUpO1xuICAgICAgY29udHJvbGxlci5zZXRNaW5TbG9wZVNsaWRlQW5nbGUocmVzb2x2ZWRPcHRpb25zLm1pblNsb3BlU2xpZGVBbmdsZSk7XG4gICAgICBjb250cm9sbGVyLnNldEFwcGx5SW1wdWxzZXNUb0R5bmFtaWNCb2RpZXMocmVzb2x2ZWRPcHRpb25zLmFwcGx5SW1wdWxzZXNUb0R5bmFtaWNCb2RpZXMpO1xuICAgICAgY29udHJvbGxlci5zZXROb3JtYWxOdWRnZUZhY3Rvcj8uKHJlc29sdmVkT3B0aW9ucy5ub3JtYWxOdWRnZUZhY3Rvcik7XG4gICAgICBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX3JlZ2lzdGVyU3RlcFBhcnRpY2lwYW50KHRoaXMsIGVudGl0eS5lbmdpbmUpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX3VucmVnaXN0ZXJTdGVwUGFydGljaXBhbnQodGhpcyk7XG4gICAgICB0cnkge1xuICAgICAgICBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX3VucmVnaXN0ZXJFeHRlcm5hbENvbGxpZGVyKGNvbGxpZGVyLCBlbnRpdHkuZW5naW5lKTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKGNvbnRyb2xsZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgd29ybGQucmVtb3ZlQ2hhcmFjdGVyQ29udHJvbGxlcihjb250cm9sbGVyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgaWYgKHJpZ2lkQm9keSAhPSBudWxsKSB7XG4gICAgICAgICAgICB3b3JsZC5yZW1vdmVSaWdpZEJvZHkocmlnaWRCb2R5KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuX193YXJuZWROb25Vbmlmb3JtU2NhbGUgPSBmYWxzZTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cblxuICAgIHRoaXMuX19lbnRpdHkgPSBlbnRpdHk7XG4gICAgdGhpcy5fX3dvcmxkUXVlcnkgPSBuZXcgUGh5c2ljc1dvcmxkUXVlcnkobmV3IFJhcGllclBoeXNpY3NXb3JsZFF1ZXJ5U3RyYXRlZ3koZW50aXR5LmVuZ2luZSkpO1xuICAgIHRoaXMuX19vcHRpb25zID0gcmVzb2x2ZWRPcHRpb25zO1xuICAgIHRoaXMuX19jYXBzdWxlQm90dG9tT2Zmc2V0ID0gcmVzb2x2ZWRDYXBzdWxlLmJvdHRvbU9mZnNldDtcbiAgICB0aGlzLl9fcmlnaWRCb2R5ID0gcmlnaWRCb2R5O1xuICAgIHRoaXMuX19jb2xsaWRlciA9IGNvbGxpZGVyO1xuICAgIHRoaXMuX19jb250cm9sbGVyID0gY29udHJvbGxlcjtcbiAgICB0aGlzLl9fc2hhcGVJbnN0YW5jZSA9IHNoYXBlSW5zdGFuY2U7XG4gICAgdGhpcy5fX3dvcmxkU2NhbGUgPSBWZWN0b3IzLmZyb21Db3B5MyhzY2FsZS54LCBzY2FsZS55LCBzY2FsZS56KTtcbiAgICB0aGlzLl9faXNHcm91bmRQcm9iZVJhZGl1c0Rlcml2ZWQgPSBvcHRpb25zLmdyb3VuZFByb2JlUmFkaXVzID09IG51bGw7XG4gIH1cblxuICBzZXREZXNpcmVkSG9yaXpvbnRhbFZlbG9jaXR5KHZlbG9jaXR5OiBJVmVjdG9yMyk6IHZvaWQge1xuICAgIHRoaXMuX19kZXNpcmVkSG9yaXpvbnRhbFZlbG9jaXR5LnNldENvbXBvbmVudHModmVsb2NpdHkueCwgMCwgdmVsb2NpdHkueik7XG4gIH1cblxuICByZXF1ZXN0SnVtcCgpOiB2b2lkIHtcbiAgICB0aGlzLl9fanVtcFJlcXVlc3RlZCA9IHRydWU7XG4gIH1cblxuICB0ZWxlcG9ydChwb3NpdGlvbjogSVZlY3RvcjMpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fX3JpZ2lkQm9keSA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JhcGllckNoYXJhY3RlckNvbnRyb2xsZXJTdHJhdGVneS5zZXR1cCgpIG11c3QgYmUgY2FsbGVkIGJlZm9yZSB0ZWxlcG9ydCgpLicpO1xuICAgIH1cbiAgICBjb25zdCB0cmFuc2xhdGlvbiA9IHsgeDogcG9zaXRpb24ueCwgeTogcG9zaXRpb24ueSwgejogcG9zaXRpb24ueiB9O1xuICAgIHRoaXMuX19yaWdpZEJvZHkuc2V0VHJhbnNsYXRpb24odHJhbnNsYXRpb24sIHRydWUpO1xuICAgIHRoaXMuX19yaWdpZEJvZHkuc2V0TmV4dEtpbmVtYXRpY1RyYW5zbGF0aW9uPy4odHJhbnNsYXRpb24pO1xuICAgIHRoaXMuX19lbnRpdHk/LmdldFNjZW5lR3JhcGgoKS5zZXRQb3NpdGlvbldpdGhvdXRQaHlzaWNzKFZlY3RvcjMuZnJvbUNvcHkzKHBvc2l0aW9uLngsIHBvc2l0aW9uLnksIHBvc2l0aW9uLnopKTtcbiAgICB0aGlzLl9fdmVydGljYWxWZWxvY2l0eSA9IDA7XG4gICAgdGhpcy5fX2lzR3JvdW5kZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9fanVtcFJlcXVlc3RlZCA9IGZhbHNlO1xuICAgIHRoaXMuX19jb21wdXRlZE1vdmVtZW50LnNldENvbXBvbmVudHMoMCwgMCwgMCk7XG4gICAgdGhpcy5fX2dyb3VuZENvbnRhY3QgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fX3N0dWNrRnJhbWVDb3VudCA9IDA7XG4gICAgdGhpcy5fX2lzUmVjb3ZlcmluZyA9IGZhbHNlO1xuICAgIHRoaXMuX19tb3Rpb25TdGF0ZSA9IGluaXRpYWxNb3Rpb25TdGF0ZTtcbiAgICB0aGlzLl9fbGFzdFN0ZXBEZWx0YVRpbWUgPSAwO1xuICAgIHRoaXMuX193YXNHcm91bmRlZCA9IGZhbHNlO1xuICAgIHRoaXMuX19oYXNFc3RhYmxpc2hlZEdyb3VuZGluZyA9IGZhbHNlO1xuICAgIHRoaXMuX19zdGF0ZVZlcnRpY2FsVmVsb2NpdHkgPSAwO1xuICAgIHRoaXMuX19sYW5kaW5nSW1wYWN0U3BlZWQgPSAwO1xuICB9XG5cbiAgcHJlU3RlcChkZWx0YVRpbWU6IG51bWJlcik6IHZvaWQge1xuICAgIGlmIChcbiAgICAgICF0aGlzLl9fZW5hYmxlZCB8fFxuICAgICAgdGhpcy5fX2VudGl0eSA9PSBudWxsIHx8XG4gICAgICB0aGlzLl9fcmlnaWRCb2R5ID09IG51bGwgfHxcbiAgICAgIHRoaXMuX19jb2xsaWRlciA9PSBudWxsIHx8XG4gICAgICB0aGlzLl9fY29udHJvbGxlciA9PSBudWxsXG4gICAgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX19zeW5jaHJvbml6ZVNjYWxlKCk7XG4gICAgY29uc3QgY3VycmVudCA9IHRoaXMuX19zeW5jaHJvbml6ZVBvc2l0aW9uKCk7XG4gICAgaWYgKHRoaXMuX19yaWdpZEJvZHkuc2V0TmV4dEtpbmVtYXRpY1JvdGF0aW9uID09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGluamVjdGVkIFJhcGllciByaWdpZCBib2R5IGRvZXMgbm90IHN1cHBvcnQga2luZW1hdGljIHJvdGF0aW9uLicpO1xuICAgIH1cbiAgICBjb25zdCB3b3JsZFJvdGF0aW9uID0gdGhpcy5fX2VudGl0eS5nZXRTY2VuZUdyYXBoKCkuZ2V0UXVhdGVybmlvblJlY3Vyc2l2ZWx5VG8odGhpcy5fX3RtcFdvcmxkUm90YXRpb24pO1xuICAgIHRoaXMuX19yaWdpZEJvZHkuc2V0TmV4dEtpbmVtYXRpY1JvdGF0aW9uKHtcbiAgICAgIHg6IHdvcmxkUm90YXRpb24ueCxcbiAgICAgIHk6IHdvcmxkUm90YXRpb24ueSxcbiAgICAgIHo6IHdvcmxkUm90YXRpb24ueixcbiAgICAgIHc6IHdvcmxkUm90YXRpb24udyxcbiAgICB9KTtcblxuICAgIHRoaXMuX19pc1JlY292ZXJpbmcgPSBmYWxzZTtcbiAgICBjb25zdCBkdCA9IE1hdGgubWluKE1hdGgubWF4KGRlbHRhVGltZSwgMCksIHRoaXMuX19vcHRpb25zLm1heERlbHRhVGltZSk7XG4gICAgdGhpcy5fX2xhc3RTdGVwRGVsdGFUaW1lID0gZHQ7XG4gICAgaWYgKHRoaXMuX19qdW1wUmVxdWVzdGVkICYmIHRoaXMuX19pc0dyb3VuZGVkKSB7XG4gICAgICB0aGlzLl9fdmVydGljYWxWZWxvY2l0eSA9IHRoaXMuX19vcHRpb25zLmp1bXBTcGVlZDtcbiAgICAgIHRoaXMuX19pc0dyb3VuZGVkID0gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX192ZXJ0aWNhbFZlbG9jaXR5IC09IHRoaXMuX19vcHRpb25zLmdyYXZpdHkgKiBkdDtcbiAgICB9XG4gICAgdGhpcy5fX2p1bXBSZXF1ZXN0ZWQgPSBmYWxzZTtcblxuICAgIGNvbnN0IGRlc2lyZWRNb3ZlbWVudCA9IHtcbiAgICAgIHg6IHRoaXMuX19kZXNpcmVkSG9yaXpvbnRhbFZlbG9jaXR5LnggKiBkdCxcbiAgICAgIHk6IHRoaXMuX192ZXJ0aWNhbFZlbG9jaXR5ICogZHQsXG4gICAgICB6OiB0aGlzLl9fZGVzaXJlZEhvcml6b250YWxWZWxvY2l0eS56ICogZHQsXG4gICAgfTtcbiAgICBjb25zdCBmaWx0ZXJGbGFncyA9IFJhcGllclBoeXNpY3NTdHJhdGVneS5fZ2V0UmFwaWVyKCkuUXVlcnlGaWx0ZXJGbGFncz8uRVhDTFVERV9TRU5TT1JTID8/IDg7XG4gICAgdGhpcy5fX2NvbnRyb2xsZXIuY29tcHV0ZUNvbGxpZGVyTW92ZW1lbnQodGhpcy5fX2NvbGxpZGVyLCBkZXNpcmVkTW92ZW1lbnQsIGZpbHRlckZsYWdzKTtcbiAgICBsZXQgbW92ZW1lbnQgPSB0aGlzLl9fY29udHJvbGxlci5jb21wdXRlZE1vdmVtZW50KCk7XG4gICAgY29uc3QgY29sbGlzaW9uTm9ybWFscyA9IHRoaXMuX19nZXRDb2xsaXNpb25Ob3JtYWxzKCk7XG4gICAgaWYgKHRoaXMuX192ZXJ0aWNhbFZlbG9jaXR5ID4gMCAmJiBjb2xsaXNpb25Ob3JtYWxzLnNvbWUobm9ybWFsID0+IG5vcm1hbC55IDwgLTAuNSkpIHtcbiAgICAgIHRoaXMuX192ZXJ0aWNhbFZlbG9jaXR5ID0gMDtcbiAgICB9XG4gICAgdGhpcy5fX2lzR3JvdW5kZWQgPSB0aGlzLl9fY29udHJvbGxlci5jb21wdXRlZEdyb3VuZGVkKCk7XG4gICAgY29uc3QgaXNEb3dud2FyZE1vdmVtZW50QmxvY2tlZCA9XG4gICAgICB0aGlzLl9fb3B0aW9ucy5zdHVja1JlY292ZXJ5RW5hYmxlZCAmJlxuICAgICAgIXRoaXMuX19pc0dyb3VuZGVkICYmXG4gICAgICB0aGlzLl9fdmVydGljYWxWZWxvY2l0eSA8IDAgJiZcbiAgICAgIGRlc2lyZWRNb3ZlbWVudC55IDwgLTAuMDAwMDAxICYmXG4gICAgICBtb3ZlbWVudC55ID4gLTAuMDAwMDAxO1xuICAgIHRoaXMuX19zdHVja0ZyYW1lQ291bnQgPSBpc0Rvd253YXJkTW92ZW1lbnRCbG9ja2VkID8gdGhpcy5fX3N0dWNrRnJhbWVDb3VudCArIDEgOiAwO1xuICAgIGlmICh0aGlzLl9fc3R1Y2tGcmFtZUNvdW50ID49IHRoaXMuX19vcHRpb25zLnN0dWNrUmVjb3ZlcnlGcmFtZUNvdW50KSB7XG4gICAgICB0aGlzLl9fY29udHJvbGxlci5jb21wdXRlQ29sbGlkZXJNb3ZlbWVudCh0aGlzLl9fY29sbGlkZXIsIHsgeDogMCwgeTogZGVzaXJlZE1vdmVtZW50LnksIHo6IDAgfSwgZmlsdGVyRmxhZ3MpO1xuICAgICAgY29uc3QgdmVydGljYWxNb3ZlbWVudCA9IHRoaXMuX19jb250cm9sbGVyLmNvbXB1dGVkTW92ZW1lbnQoKTtcbiAgICAgIGlmICh2ZXJ0aWNhbE1vdmVtZW50LnkgPCAtMC4wMDAwMDEpIHtcbiAgICAgICAgbW92ZW1lbnQgPSB2ZXJ0aWNhbE1vdmVtZW50O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbW92ZW1lbnQgPSB0aGlzLl9fY3JlYXRlTnVkZ2VNb3ZlbWVudChtb3ZlbWVudCwgY29sbGlzaW9uTm9ybWFscyk7XG4gICAgICB9XG4gICAgICB0aGlzLl9faXNHcm91bmRlZCA9IHRoaXMuX19jb250cm9sbGVyLmNvbXB1dGVkR3JvdW5kZWQoKTtcbiAgICAgIHRoaXMuX19pc1JlY292ZXJpbmcgPSB0cnVlO1xuICAgICAgdGhpcy5fX3N0dWNrRnJhbWVDb3VudCA9IDA7XG4gICAgfVxuICAgIHRoaXMuX19jb21wdXRlZE1vdmVtZW50LnNldENvbXBvbmVudHMobW92ZW1lbnQueCwgbW92ZW1lbnQueSwgbW92ZW1lbnQueik7XG4gICAgdGhpcy5fX3N0YXRlVmVydGljYWxWZWxvY2l0eSA9IHRoaXMuX192ZXJ0aWNhbFZlbG9jaXR5O1xuICAgIGlmICh0aGlzLl9faXNHcm91bmRlZCAmJiB0aGlzLl9fdmVydGljYWxWZWxvY2l0eSA8IDApIHtcbiAgICAgIGlmICghdGhpcy5fX3dhc0dyb3VuZGVkICYmIHRoaXMuX19oYXNFc3RhYmxpc2hlZEdyb3VuZGluZykge1xuICAgICAgICB0aGlzLl9fbGFuZGluZ0ltcGFjdFNwZWVkID0gLXRoaXMuX192ZXJ0aWNhbFZlbG9jaXR5O1xuICAgICAgfVxuICAgICAgdGhpcy5fX3ZlcnRpY2FsVmVsb2NpdHkgPSAwO1xuICAgIH1cblxuICAgIGNvbnN0IG5leHQgPSB7XG4gICAgICB4OiBjdXJyZW50LnggKyBtb3ZlbWVudC54LFxuICAgICAgeTogY3VycmVudC55ICsgbW92ZW1lbnQueSxcbiAgICAgIHo6IGN1cnJlbnQueiArIG1vdmVtZW50LnosXG4gICAgfTtcbiAgICBpZiAodGhpcy5fX3JpZ2lkQm9keS5zZXROZXh0S2luZW1hdGljVHJhbnNsYXRpb24gPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgaW5qZWN0ZWQgUmFwaWVyIHJpZ2lkIGJvZHkgZG9lcyBub3Qgc3VwcG9ydCBraW5lbWF0aWMgdHJhbnNsYXRpb24uJyk7XG4gICAgfVxuICAgIHRoaXMuX19yaWdpZEJvZHkuc2V0TmV4dEtpbmVtYXRpY1RyYW5zbGF0aW9uKG5leHQpO1xuICB9XG5cbiAgcG9zdFN0ZXAoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLl9fZW5hYmxlZCB8fCB0aGlzLl9fZW50aXR5ID09IG51bGwgfHwgdGhpcy5fX3JpZ2lkQm9keSA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5fX3JpZ2lkQm9keS50cmFuc2xhdGlvbigpO1xuICAgIHRoaXMuX19lbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLnNldFBvc2l0aW9uV2l0aG91dFBoeXNpY3MoVmVjdG9yMy5mcm9tQ29weTMocG9zaXRpb24ueCwgcG9zaXRpb24ueSwgcG9zaXRpb24ueikpO1xuICAgIHRoaXMuX191cGRhdGVHcm91bmRDb250YWN0KHBvc2l0aW9uKTtcbiAgICB0aGlzLl9fdXBkYXRlTW90aW9uU3RhdGUoKTtcbiAgfVxuXG4gIGdldCBpc0dyb3VuZGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9faXNHcm91bmRlZDtcbiAgfVxuXG4gIGdldCBjb21wdXRlZE1vdmVtZW50KCk6IElWZWN0b3IzIHtcbiAgICByZXR1cm4gdGhpcy5fX2NvbXB1dGVkTW92ZW1lbnQ7XG4gIH1cblxuICBnZXQgZ3JvdW5kQ29udGFjdCgpOiBDaGFyYWN0ZXJHcm91bmRDb250YWN0IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fX2dyb3VuZENvbnRhY3Q7XG4gIH1cblxuICBnZXQgaXNSZWNvdmVyaW5nKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9faXNSZWNvdmVyaW5nO1xuICB9XG5cbiAgZ2V0IG1vdGlvblN0YXRlKCk6IENoYXJhY3Rlck1vdGlvblN0YXRlIHtcbiAgICByZXR1cm4gdGhpcy5fX21vdGlvblN0YXRlO1xuICB9XG5cbiAgc2V0IGVuYWJsZWQodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9fZW5hYmxlZCA9IHZhbHVlO1xuICAgIGlmICghdmFsdWUpIHtcbiAgICAgIHRoaXMuX19ncm91bmRDb250YWN0ID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fX3N0dWNrRnJhbWVDb3VudCA9IDA7XG4gICAgICB0aGlzLl9faXNSZWNvdmVyaW5nID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGVuYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX19lbmFibGVkO1xuICB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX3VucmVnaXN0ZXJTdGVwUGFydGljaXBhbnQodGhpcyk7XG4gICAgY29uc3QgZW5naW5lID0gdGhpcy5fX2VudGl0eT8uZW5naW5lO1xuICAgIFJhcGllclBoeXNpY3NTdHJhdGVneS5fdW5yZWdpc3RlckV4dGVybmFsQ29sbGlkZXIodGhpcy5fX2NvbGxpZGVyLCBlbmdpbmUpO1xuICAgIGNvbnN0IHdvcmxkID0gUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9nZXRXb3JsZChlbmdpbmUpO1xuICAgIGlmICh0aGlzLl9fY29udHJvbGxlciAhPSBudWxsKSB7XG4gICAgICB3b3JsZC5yZW1vdmVDaGFyYWN0ZXJDb250cm9sbGVyPy4odGhpcy5fX2NvbnRyb2xsZXIpO1xuICAgIH1cbiAgICBpZiAodGhpcy5fX3JpZ2lkQm9keSAhPSBudWxsKSB7XG4gICAgICB3b3JsZC5yZW1vdmVSaWdpZEJvZHk/Lih0aGlzLl9fcmlnaWRCb2R5KTtcbiAgICB9XG4gICAgdGhpcy5fX2NvbnRyb2xsZXIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fX2NvbGxpZGVyID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX19yaWdpZEJvZHkgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fX2VudGl0eSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fd29ybGRRdWVyeSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fZ3JvdW5kQ29udGFjdCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fc3R1Y2tGcmFtZUNvdW50ID0gMDtcbiAgICB0aGlzLl9faXNSZWNvdmVyaW5nID0gZmFsc2U7XG4gICAgdGhpcy5fX21vdGlvblN0YXRlID0gaW5pdGlhbE1vdGlvblN0YXRlO1xuICAgIHRoaXMuX19sYXN0U3RlcERlbHRhVGltZSA9IDA7XG4gICAgdGhpcy5fX3dhc0dyb3VuZGVkID0gZmFsc2U7XG4gICAgdGhpcy5fX2hhc0VzdGFibGlzaGVkR3JvdW5kaW5nID0gZmFsc2U7XG4gICAgdGhpcy5fX3N0YXRlVmVydGljYWxWZWxvY2l0eSA9IDA7XG4gICAgdGhpcy5fX2xhbmRpbmdJbXBhY3RTcGVlZCA9IDA7XG4gICAgdGhpcy5fX3NoYXBlSW5zdGFuY2UgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fX3dvcmxkU2NhbGUgPSBWZWN0b3IzLm9uZSgpO1xuICAgIHRoaXMuX19pc0dyb3VuZFByb2JlUmFkaXVzRGVyaXZlZCA9IHRydWU7XG4gICAgdGhpcy5fX3dhcm5lZE5vblVuaWZvcm1TY2FsZSA9IGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBfX3Jlc29sdmVDaGFyYWN0ZXJDYXBzdWxlKHNoYXBlSW5zdGFuY2U6IFNoYXBlSW5zdGFuY2UsIHdvcmxkU2NhbGU6IElWZWN0b3IzKTogUmVzb2x2ZWRDaGFyYWN0ZXJDYXBzdWxlIHtcbiAgICBpZiAoc2hhcGVJbnN0YW5jZS5zaGFwZS50eXBlICE9PSAnY2Fwc3VsZScpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUmFwaWVyQ2hhcmFjdGVyQ29udHJvbGxlclN0cmF0ZWd5IHJlcXVpcmVzIGEgY2Fwc3VsZSBTaGFwZUluc3RhbmNlLicpO1xuICAgIH1cbiAgICBjb25zdCBjYXBzdWxlID0gc2hhcGVJbnN0YW5jZS5zaGFwZTtcbiAgICBjb25zdCByZXNvbHZlZCA9IHJlc29sdmVTY2FsZWRDYXBzdWxlKFxuICAgICAgY2Fwc3VsZS5oZWlnaHQsXG4gICAgICBNYXRoLm1heChjYXBzdWxlLnJhZGl1c0JvdHRvbSwgY2Fwc3VsZS5yYWRpdXNUb3ApLFxuICAgICAgc2hhcGVJbnN0YW5jZS5sb2NhbFJvdGF0aW9uLFxuICAgICAgd29ybGRTY2FsZVxuICAgICk7XG4gICAgaWYgKHJlc29sdmVkLmFwcHJveGltYXRlZCAmJiAhdGhpcy5fX3dhcm5lZE5vblVuaWZvcm1TY2FsZSkge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQud2FybignUmFwaWVyIGNvbnNlcnZhdGl2ZWx5IGFwcHJveGltYXRlcyBub24tdW5pZm9ybSBzY2FsZSBmb3IgdGhlIGNoYXJhY3RlciBjYXBzdWxlLicpO1xuICAgICAgdGhpcy5fX3dhcm5lZE5vblVuaWZvcm1TY2FsZSA9IHRydWU7XG4gICAgfVxuICAgIGNvbnN0IGxvY2FsUG9zaXRpb24gPSBWZWN0b3IzLmZyb21Db3B5MyhcbiAgICAgIHNoYXBlSW5zdGFuY2UubG9jYWxQb3NpdGlvbi54ICogd29ybGRTY2FsZS54LFxuICAgICAgc2hhcGVJbnN0YW5jZS5sb2NhbFBvc2l0aW9uLnkgKiB3b3JsZFNjYWxlLnksXG4gICAgICBzaGFwZUluc3RhbmNlLmxvY2FsUG9zaXRpb24ueiAqIHdvcmxkU2NhbGUuelxuICAgICk7XG4gICAgY29uc3QgZG93bndhcmRFeHRlbnQgPSByZXNvbHZlZC5yb3RhdGlvbi50cmFuc2Zvcm1WZWN0b3IzKFxuICAgICAgVmVjdG9yMy5mcm9tQ29weTMoMCwgLShyZXNvbHZlZC5oYWxmSGVpZ2h0ICsgcmVzb2x2ZWQucmFkaXVzKSwgMClcbiAgICApO1xuICAgIHJldHVybiB7XG4gICAgICAuLi5yZXNvbHZlZCxcbiAgICAgIGxvY2FsUG9zaXRpb24sXG4gICAgICBib3R0b21PZmZzZXQ6IFZlY3RvcjMuYWRkKGxvY2FsUG9zaXRpb24sIGRvd253YXJkRXh0ZW50KSxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBfX2NyZWF0ZUNoYXJhY3RlckNvbGxpZGVyRGVzYyhyZXNvbHZlZDogUmVzb2x2ZWRDaGFyYWN0ZXJDYXBzdWxlKSB7XG4gICAgY29uc3QgcmFwaWVyID0gUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9nZXRSYXBpZXIoKTtcbiAgICBsZXQgY29sbGlkZXJEZXNjID0gcmFwaWVyLkNvbGxpZGVyRGVzYy5jYXBzdWxlIShyZXNvbHZlZC5oYWxmSGVpZ2h0LCByZXNvbHZlZC5yYWRpdXMpO1xuICAgIGNvbGxpZGVyRGVzYyA9XG4gICAgICBjb2xsaWRlckRlc2Muc2V0VHJhbnNsYXRpb24/LihyZXNvbHZlZC5sb2NhbFBvc2l0aW9uLngsIHJlc29sdmVkLmxvY2FsUG9zaXRpb24ueSwgcmVzb2x2ZWQubG9jYWxQb3NpdGlvbi56KSA/P1xuICAgICAgY29sbGlkZXJEZXNjO1xuICAgIGNvbGxpZGVyRGVzYyA9XG4gICAgICBjb2xsaWRlckRlc2Muc2V0Um90YXRpb24/Lih7XG4gICAgICAgIHg6IHJlc29sdmVkLnJvdGF0aW9uLngsXG4gICAgICAgIHk6IHJlc29sdmVkLnJvdGF0aW9uLnksXG4gICAgICAgIHo6IHJlc29sdmVkLnJvdGF0aW9uLnosXG4gICAgICAgIHc6IHJlc29sdmVkLnJvdGF0aW9uLncsXG4gICAgICB9KSA/PyBjb2xsaWRlckRlc2M7XG4gICAgcmV0dXJuIGNvbGxpZGVyRGVzYztcbiAgfVxuXG4gIHByaXZhdGUgX19zeW5jaHJvbml6ZVNjYWxlKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9fZW50aXR5ID09IG51bGwgfHwgdGhpcy5fX3JpZ2lkQm9keSA9PSBudWxsIHx8IHRoaXMuX19jb2xsaWRlciA9PSBudWxsIHx8IHRoaXMuX19zaGFwZUluc3RhbmNlID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc2NhbGUgPSB0aGlzLl9fZW50aXR5LmdldFNjZW5lR3JhcGgoKS5fZ2V0UGh5c2ljc1dvcmxkU2NhbGUoKTtcbiAgICBjb25zdCBhYnNvbHV0ZVNjYWxlID0gVmVjdG9yMy5mcm9tQ29weTMoTWF0aC5hYnMoc2NhbGUueCksIE1hdGguYWJzKHNjYWxlLnkpLCBNYXRoLmFicyhzY2FsZS56KSk7XG4gICAgY29uc3QgaGFzQ2hhbmdlZCA9XG4gICAgICBNYXRoLmFicyhzY2FsZS54IC0gdGhpcy5fX3dvcmxkU2NhbGUueCkgPiAwLjAwMDAwMSB8fFxuICAgICAgTWF0aC5hYnMoc2NhbGUueSAtIHRoaXMuX193b3JsZFNjYWxlLnkpID4gMC4wMDAwMDEgfHxcbiAgICAgIE1hdGguYWJzKHNjYWxlLnogLSB0aGlzLl9fd29ybGRTY2FsZS56KSA+IDAuMDAwMDAxO1xuICAgIGlmICghaGFzQ2hhbmdlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoXG4gICAgICAhW2Fic29sdXRlU2NhbGUueCwgYWJzb2x1dGVTY2FsZS55LCBhYnNvbHV0ZVNjYWxlLnpdLmV2ZXJ5KE51bWJlci5pc0Zpbml0ZSkgfHxcbiAgICAgIGFic29sdXRlU2NhbGUueCA8PSAwIHx8XG4gICAgICBhYnNvbHV0ZVNjYWxlLnkgPD0gMCB8fFxuICAgICAgYWJzb2x1dGVTY2FsZS56IDw9IDBcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2hhcmFjdGVyIGNvbnRyb2xsZXIgc2NhbGUgY29tcG9uZW50cyBtdXN0IHJlbWFpbiBmaW5pdGUgYW5kIG5vbi16ZXJvIGFmdGVyIHNldHVwLicpO1xuICAgIH1cblxuICAgIGNvbnN0IHdvcmxkID0gUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9nZXRXb3JsZCh0aGlzLl9fZW50aXR5LmVuZ2luZSk7XG4gICAgaWYgKHdvcmxkLnJlbW92ZVJpZ2lkQm9keSA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBpbmplY3RlZCBSYXBpZXIgd29ybGQgZG9lcyBub3Qgc3VwcG9ydCByZWJ1aWxkaW5nIGEgc2NhbGVkIGNoYXJhY3RlciBib2R5LicpO1xuICAgIH1cbiAgICBjb25zdCByZXNvbHZlZCA9IHRoaXMuX19yZXNvbHZlQ2hhcmFjdGVyQ2Fwc3VsZSh0aGlzLl9fc2hhcGVJbnN0YW5jZSwgc2NhbGUpO1xuICAgIGNvbnN0IGdyb3VuZFByb2JlUmFkaXVzID0gdGhpcy5fX2lzR3JvdW5kUHJvYmVSYWRpdXNEZXJpdmVkXG4gICAgICA/IHJlc29sdmVkLnJhZGl1cyAqIDAuOFxuICAgICAgOiB0aGlzLl9fb3B0aW9ucy5ncm91bmRQcm9iZVJhZGl1cztcbiAgICBpZiAoIU51bWJlci5pc0Zpbml0ZShncm91bmRQcm9iZVJhZGl1cykgfHwgZ3JvdW5kUHJvYmVSYWRpdXMgPD0gMCB8fCBncm91bmRQcm9iZVJhZGl1cyA+IHJlc29sdmVkLnJhZGl1cykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnQ2hhcmFjdGVyIGNvbnRyb2xsZXIgZ3JvdW5kUHJvYmVSYWRpdXMgbXVzdCBiZSBwb3NpdGl2ZSBhbmQgbm8gZ3JlYXRlciB0aGFuIHRoZSBzY2FsZWQgY2Fwc3VsZSByYWRpdXMuJ1xuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3QgY29sbGlkZXJEZXNjID0gdGhpcy5fX2NyZWF0ZUNoYXJhY3RlckNvbGxpZGVyRGVzYyhyZXNvbHZlZCk7XG4gICAgY29uc3QgcG9zaXRpb24gPSB0aGlzLl9fcmlnaWRCb2R5LnRyYW5zbGF0aW9uKCk7XG4gICAgY29uc3Qgcm90YXRpb24gPSB0aGlzLl9fcmlnaWRCb2R5LnJvdGF0aW9uKCk7XG4gICAgY29uc3QgcmlnaWRCb2R5RGVzYyA9IFJhcGllclBoeXNpY3NTdHJhdGVneS5fZ2V0UmFwaWVyKCkuUmlnaWRCb2R5RGVzYy5raW5lbWF0aWNQb3NpdGlvbkJhc2VkISgpXG4gICAgICAuc2V0VHJhbnNsYXRpb24ocG9zaXRpb24ueCwgcG9zaXRpb24ueSwgcG9zaXRpb24ueilcbiAgICAgIC5zZXRSb3RhdGlvbih7IHg6IHJvdGF0aW9uLngsIHk6IHJvdGF0aW9uLnksIHo6IHJvdGF0aW9uLnosIHc6IHJvdGF0aW9uLncgfSk7XG4gICAgY29uc3QgcHJldmlvdXNSaWdpZEJvZHkgPSB0aGlzLl9fcmlnaWRCb2R5O1xuICAgIGNvbnN0IHByZXZpb3VzQ29sbGlkZXIgPSB0aGlzLl9fY29sbGlkZXI7XG4gICAgY29uc3QgcmlnaWRCb2R5ID0gd29ybGQuY3JlYXRlUmlnaWRCb2R5KHJpZ2lkQm9keURlc2MpO1xuICAgIGxldCBjb2xsaWRlcjogUmFwaWVyQ29sbGlkZXJMaWtlO1xuICAgIHRyeSB7XG4gICAgICBjb2xsaWRlciA9IHdvcmxkLmNyZWF0ZUNvbGxpZGVyKGNvbGxpZGVyRGVzYywgcmlnaWRCb2R5KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgd29ybGQucmVtb3ZlUmlnaWRCb2R5KHJpZ2lkQm9keSk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG5cbiAgICBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX3JlZ2lzdGVyRXh0ZXJuYWxDb2xsaWRlcihjb2xsaWRlciwgdGhpcy5fX2VudGl0eSk7XG4gICAgUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll91bnJlZ2lzdGVyRXh0ZXJuYWxDb2xsaWRlcihwcmV2aW91c0NvbGxpZGVyLCB0aGlzLl9fZW50aXR5LmVuZ2luZSwgdHJ1ZSk7XG4gICAgd29ybGQucmVtb3ZlUmlnaWRCb2R5KHByZXZpb3VzUmlnaWRCb2R5KTtcbiAgICB0aGlzLl9fcmlnaWRCb2R5ID0gcmlnaWRCb2R5O1xuICAgIHRoaXMuX19jb2xsaWRlciA9IGNvbGxpZGVyO1xuICAgIHRoaXMuX19jYXBzdWxlQm90dG9tT2Zmc2V0ID0gcmVzb2x2ZWQuYm90dG9tT2Zmc2V0O1xuICAgIHRoaXMuX19vcHRpb25zLmdyb3VuZFByb2JlUmFkaXVzID0gZ3JvdW5kUHJvYmVSYWRpdXM7XG4gICAgdGhpcy5fX3dvcmxkU2NhbGUgPSBWZWN0b3IzLmZyb21Db3B5MyhzY2FsZS54LCBzY2FsZS55LCBzY2FsZS56KTtcbiAgfVxuXG4gIHByaXZhdGUgX19zeW5jaHJvbml6ZVBvc2l0aW9uKCk6IFJhcGllclZlY3RvcjNMaWtlIHtcbiAgICBjb25zdCByaWdpZEJvZHkgPSB0aGlzLl9fcmlnaWRCb2R5ITtcbiAgICBjb25zdCBjdXJyZW50ID0gcmlnaWRCb2R5LnRyYW5zbGF0aW9uKCk7XG4gICAgY29uc3Qgc2NlbmVHcmFwaFBvc2l0aW9uID0gdGhpcy5fX2VudGl0eSEuZ2V0U2NlbmVHcmFwaCgpLnBvc2l0aW9uO1xuICAgIGNvbnN0IGhhc0NoYW5nZWQgPVxuICAgICAgTWF0aC5hYnMoc2NlbmVHcmFwaFBvc2l0aW9uLnggLSBjdXJyZW50LngpID4gMC4wMDAwMDEgfHxcbiAgICAgIE1hdGguYWJzKHNjZW5lR3JhcGhQb3NpdGlvbi55IC0gY3VycmVudC55KSA+IDAuMDAwMDAxIHx8XG4gICAgICBNYXRoLmFicyhzY2VuZUdyYXBoUG9zaXRpb24ueiAtIGN1cnJlbnQueikgPiAwLjAwMDAwMTtcbiAgICBpZiAoIWhhc0NoYW5nZWQpIHtcbiAgICAgIHJldHVybiBjdXJyZW50O1xuICAgIH1cblxuICAgIGNvbnN0IHN5bmNocm9uaXplZCA9IHtcbiAgICAgIHg6IHNjZW5lR3JhcGhQb3NpdGlvbi54LFxuICAgICAgeTogc2NlbmVHcmFwaFBvc2l0aW9uLnksXG4gICAgICB6OiBzY2VuZUdyYXBoUG9zaXRpb24ueixcbiAgICB9O1xuICAgIHJpZ2lkQm9keS5zZXRUcmFuc2xhdGlvbihzeW5jaHJvbml6ZWQsIHRydWUpO1xuICAgIHJldHVybiBzeW5jaHJvbml6ZWQ7XG4gIH1cblxuICBwcml2YXRlIF9fdXBkYXRlTW90aW9uU3RhdGUoKTogdm9pZCB7XG4gICAgY29uc3QgZHQgPSB0aGlzLl9fbGFzdFN0ZXBEZWx0YVRpbWU7XG4gICAgY29uc3QgdmVsb2NpdHkgPVxuICAgICAgZHQgPiAwXG4gICAgICAgID8gVmVjdG9yMy5mcm9tQ29weTMoXG4gICAgICAgICAgICB0aGlzLl9fY29tcHV0ZWRNb3ZlbWVudC54IC8gZHQsXG4gICAgICAgICAgICB0aGlzLl9fY29tcHV0ZWRNb3ZlbWVudC55IC8gZHQsXG4gICAgICAgICAgICB0aGlzLl9fY29tcHV0ZWRNb3ZlbWVudC56IC8gZHRcbiAgICAgICAgICApXG4gICAgICAgIDogVmVjdG9yMy56ZXJvKCk7XG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLl9fcmVzb2x2ZU1vdmVtZW50U3RhdGUoKTtcbiAgICBjb25zdCBwcmV2aW91cyA9IHRoaXMuX19tb3Rpb25TdGF0ZTtcbiAgICBjb25zdCBpc0dyb3VuZGVkTm93ID0gdGhpcy5fX2lzR3JvdW5kZWQ7XG4gICAgdGhpcy5fX21vdGlvblN0YXRlID0ge1xuICAgICAgc3RhdGUsXG4gICAgICB2ZWxvY2l0eSxcbiAgICAgIGhvcml6b250YWxTcGVlZDogTWF0aC5oeXBvdCh2ZWxvY2l0eS54LCB2ZWxvY2l0eS56KSxcbiAgICAgIHZlcnRpY2FsU3BlZWQ6IHZlbG9jaXR5LnksXG4gICAgICBncm91bmRlZER1cmF0aW9uOiBpc0dyb3VuZGVkTm93ID8gcHJldmlvdXMuZ3JvdW5kZWREdXJhdGlvbiArIGR0IDogMCxcbiAgICAgIGFpcmJvcm5lRHVyYXRpb246IGlzR3JvdW5kZWROb3cgPyAwIDogcHJldmlvdXMuYWlyYm9ybmVEdXJhdGlvbiArIGR0LFxuICAgICAgc3RhdGVFbGFwc2VkVGltZTogc3RhdGUgPT09IHByZXZpb3VzLnN0YXRlID8gcHJldmlvdXMuc3RhdGVFbGFwc2VkVGltZSArIGR0IDogZHQsXG4gICAgICBsYW5kaW5nSW1wYWN0U3BlZWQ6IHRoaXMuX19sYW5kaW5nSW1wYWN0U3BlZWQsXG4gICAgICBncm91bmRDb250YWN0OiB0aGlzLl9fZ3JvdW5kQ29udGFjdCxcbiAgICB9O1xuICAgIHRoaXMuX193YXNHcm91bmRlZCA9IGlzR3JvdW5kZWROb3c7XG4gICAgaWYgKGlzR3JvdW5kZWROb3cpIHtcbiAgICAgIHRoaXMuX19oYXNFc3RhYmxpc2hlZEdyb3VuZGluZyA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfX3Jlc29sdmVNb3ZlbWVudFN0YXRlKCk6IENoYXJhY3Rlck1vdmVtZW50U3RhdGUge1xuICAgIGlmICh0aGlzLl9faXNSZWNvdmVyaW5nKSB7XG4gICAgICByZXR1cm4gJ3JlY292ZXJpbmcnO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuX19oYXNFc3RhYmxpc2hlZEdyb3VuZGluZyAmJiB0aGlzLl9faXNHcm91bmRlZCkge1xuICAgICAgcmV0dXJuICdncm91bmRlZCc7XG4gICAgfVxuICAgIGlmICghdGhpcy5fX3dhc0dyb3VuZGVkICYmIHRoaXMuX19pc0dyb3VuZGVkKSB7XG4gICAgICByZXR1cm4gJ2xhbmRpbmcnO1xuICAgIH1cbiAgICBpZiAodGhpcy5fX2lzR3JvdW5kZWQpIHtcbiAgICAgIHJldHVybiAnZ3JvdW5kZWQnO1xuICAgIH1cbiAgICBpZiAodGhpcy5fX2dyb3VuZENvbnRhY3QgIT0gbnVsbCAmJiAhdGhpcy5fX2dyb3VuZENvbnRhY3QuaXNXYWxrYWJsZSAmJiB0aGlzLl9fc3RhdGVWZXJ0aWNhbFZlbG9jaXR5IDw9IDApIHtcbiAgICAgIHJldHVybiAnc2xpZGluZyc7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9fc3RhdGVWZXJ0aWNhbFZlbG9jaXR5ID4gMC4wMDAwMDEgPyAncmlzaW5nJyA6ICdmYWxsaW5nJztcbiAgfVxuXG4gIHByaXZhdGUgX19nZXRDb2xsaXNpb25Ob3JtYWxzKCk6IFJhcGllclZlY3RvcjNMaWtlW10ge1xuICAgIGNvbnN0IGNvdW50ID0gdGhpcy5fX2NvbnRyb2xsZXI/Lm51bUNvbXB1dGVkQ29sbGlzaW9ucz8uKCkgPz8gMDtcbiAgICBjb25zdCBub3JtYWxzOiBSYXBpZXJWZWN0b3IzTGlrZVtdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCBjb2xsaXNpb24gPSB0aGlzLl9fY29udHJvbGxlcj8uY29tcHV0ZWRDb2xsaXNpb24/LihpKTtcbiAgICAgIGlmIChjb2xsaXNpb24gIT0gbnVsbCkge1xuICAgICAgICBub3JtYWxzLnB1c2goY29sbGlzaW9uLm5vcm1hbDEpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbm9ybWFscztcbiAgfVxuXG4gIHByaXZhdGUgX19jcmVhdGVOdWRnZU1vdmVtZW50KG1vdmVtZW50OiBSYXBpZXJWZWN0b3IzTGlrZSwgbm9ybWFsczogcmVhZG9ubHkgUmFwaWVyVmVjdG9yM0xpa2VbXSk6IFJhcGllclZlY3RvcjNMaWtlIHtcbiAgICBsZXQgeCA9IDA7XG4gICAgbGV0IHogPSAwO1xuICAgIGZvciAoY29uc3Qgbm9ybWFsIG9mIG5vcm1hbHMpIHtcbiAgICAgIHggKz0gbm9ybWFsLng7XG4gICAgICB6ICs9IG5vcm1hbC56O1xuICAgIH1cbiAgICBjb25zdCBsZW5ndGggPSBNYXRoLmh5cG90KHgsIHopO1xuICAgIGlmIChsZW5ndGggPD0gMC4wMDAwMDEpIHtcbiAgICAgIHJldHVybiBtb3ZlbWVudDtcbiAgICB9XG4gICAgY29uc3Qgc2NhbGUgPSB0aGlzLl9fb3B0aW9ucy5zdHVja1JlY292ZXJ5RGlzdGFuY2UgLyBsZW5ndGg7XG4gICAgcmV0dXJuIHsgeDogeCAqIHNjYWxlLCB5OiBNYXRoLm1pbihtb3ZlbWVudC55LCAwKSwgejogeiAqIHNjYWxlIH07XG4gIH1cblxuICBwcml2YXRlIF9fdXBkYXRlR3JvdW5kQ29udGFjdChwb3NpdGlvbjogUmFwaWVyVmVjdG9yM0xpa2UpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fX2VudGl0eSA9PSBudWxsKSB7XG4gICAgICB0aGlzLl9fZ3JvdW5kQ29udGFjdCA9IHVuZGVmaW5lZDtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgYm9keVJvdGF0aW9uID0gdGhpcy5fX3JpZ2lkQm9keT8ucm90YXRpb24oKTtcbiAgICBjb25zdCBjYXBzdWxlQm90dG9tT2Zmc2V0ID1cbiAgICAgIGJvZHlSb3RhdGlvbiA9PSBudWxsXG4gICAgICAgID8gdGhpcy5fX2NhcHN1bGVCb3R0b21PZmZzZXRcbiAgICAgICAgOiBRdWF0ZXJuaW9uLmZyb21Db3B5NChib2R5Um90YXRpb24ueCwgYm9keVJvdGF0aW9uLnksIGJvZHlSb3RhdGlvbi56LCBib2R5Um90YXRpb24udykudHJhbnNmb3JtVmVjdG9yMyhcbiAgICAgICAgICAgIHRoaXMuX19jYXBzdWxlQm90dG9tT2Zmc2V0XG4gICAgICAgICAgKTtcbiAgICBjb25zdCBjYXBzdWxlQm90dG9tID0gVmVjdG9yMy5hZGQoVmVjdG9yMy5mcm9tQ29weTMocG9zaXRpb24ueCwgcG9zaXRpb24ueSwgcG9zaXRpb24ueiksIGNhcHN1bGVCb3R0b21PZmZzZXQpO1xuICAgIGNvbnN0IHN0YXJ0ID0gVmVjdG9yMy5hZGQoXG4gICAgICBjYXBzdWxlQm90dG9tLFxuICAgICAgVmVjdG9yMy5mcm9tQ29weTMoMCwgdGhpcy5fX29wdGlvbnMuZ3JvdW5kUHJvYmVSYWRpdXMgKyB0aGlzLl9fb3B0aW9ucy5ncm91bmRQcm9iZVN0YXJ0T2Zmc2V0LCAwKVxuICAgICk7XG4gICAgY29uc3QgaGl0ID0gdGhpcy5fX3dvcmxkUXVlcnk/LmNhc3RTcGhlcmUoXG4gICAgICBzdGFydCxcbiAgICAgIHRoaXMuX19vcHRpb25zLmdyb3VuZFByb2JlUmFkaXVzLFxuICAgICAgVmVjdG9yMy5mcm9tQ29weTMoMCwgLTEsIDApLFxuICAgICAgdGhpcy5fX29wdGlvbnMuZ3JvdW5kUHJvYmVEaXN0YW5jZSxcbiAgICAgIHtcbiAgICAgICAgaW5jbHVkZVNlbnNvcnM6IGZhbHNlLFxuICAgICAgICBjb2xsaXNpb25Hcm91cDogdGhpcy5fX29wdGlvbnMuZ3JvdW5kQ29sbGlzaW9uR3JvdXAsXG4gICAgICAgIGNvbGxpc2lvbk1hc2s6IHRoaXMuX19vcHRpb25zLmdyb3VuZENvbGxpc2lvbk1hc2ssXG4gICAgICAgIGV4Y2x1ZGVFbnRpdGllczogW3RoaXMuX19lbnRpdHldLFxuICAgICAgfVxuICAgICk7XG4gICAgaWYgKGhpdCA9PSBudWxsIHx8IGhpdC5ub3JtYWwueSA8PSAwKSB7XG4gICAgICB0aGlzLl9fZ3JvdW5kQ29udGFjdCA9IHVuZGVmaW5lZDtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgbm9ybWFsID0gVmVjdG9yMy5ub3JtYWxpemUoaGl0Lm5vcm1hbCk7XG4gICAgY29uc3Qgc2xvcGVBbmdsZSA9IE1hdGguYWNvcyhNYXRoLm1pbigxLCBNYXRoLm1heCgtMSwgbm9ybWFsLnkpKSk7XG4gICAgdGhpcy5fX2dyb3VuZENvbnRhY3QgPSB7XG4gICAgICBlbnRpdHk6IGhpdC5lbnRpdHksXG4gICAgICBiaW5kaW5nSWQ6IGhpdC5iaW5kaW5nSWQsXG4gICAgICBwb3NpdGlvbjogaGl0LnBvc2l0aW9uLFxuICAgICAgbm9ybWFsLFxuICAgICAgZGlzdGFuY2U6IGhpdC5kaXN0YW5jZSxcbiAgICAgIHNsb3BlQW5nbGUsXG4gICAgICBpc1dhbGthYmxlOiBzbG9wZUFuZ2xlIDw9IHRoaXMuX19vcHRpb25zLm1heFNsb3BlQ2xpbWJBbmdsZSxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBfX3ZhbGlkYXRlT3B0aW9ucyhvcHRpb25zOiBSZXNvbHZlZE9wdGlvbnMpOiB2b2lkIHtcbiAgICBjb25zdCBwb3NpdGl2ZVZhbHVlcyA9IFtcbiAgICAgIG9wdGlvbnMuY29udGFjdE9mZnNldCxcbiAgICAgIG9wdGlvbnMubWF4U3RlcEhlaWdodCxcbiAgICAgIG9wdGlvbnMubWluU3RlcFdpZHRoLFxuICAgICAgb3B0aW9ucy5zbmFwVG9Hcm91bmREaXN0YW5jZSxcbiAgICAgIG9wdGlvbnMuZ3Jhdml0eSxcbiAgICAgIG9wdGlvbnMuanVtcFNwZWVkLFxuICAgICAgb3B0aW9ucy5tYXhEZWx0YVRpbWUsXG4gICAgICBvcHRpb25zLmdyb3VuZFByb2JlRGlzdGFuY2UsXG4gICAgICBvcHRpb25zLm5vcm1hbE51ZGdlRmFjdG9yLFxuICAgICAgb3B0aW9ucy5zdHVja1JlY292ZXJ5RGlzdGFuY2UsXG4gICAgXTtcbiAgICBpZiAocG9zaXRpdmVWYWx1ZXMuc29tZSh2YWx1ZSA9PiAhTnVtYmVyLmlzRmluaXRlKHZhbHVlKSB8fCB2YWx1ZSA8PSAwKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDaGFyYWN0ZXIgY29udHJvbGxlciBkaW1lbnNpb25zIGFuZCBtb3ZlbWVudCBzZXR0aW5ncyBtdXN0IGJlIGZpbml0ZSBwb3NpdGl2ZSB2YWx1ZXMuJyk7XG4gICAgfVxuICAgIGlmICghTnVtYmVyLmlzRmluaXRlKG9wdGlvbnMubWF4U2xvcGVDbGltYkFuZ2xlKSB8fCAhTnVtYmVyLmlzRmluaXRlKG9wdGlvbnMubWluU2xvcGVTbGlkZUFuZ2xlKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDaGFyYWN0ZXIgY29udHJvbGxlciBzbG9wZSBhbmdsZXMgbXVzdCBiZSBmaW5pdGUgdmFsdWVzLicpO1xuICAgIH1cbiAgICBpZiAoIU51bWJlci5pc0Zpbml0ZShvcHRpb25zLmdyb3VuZFByb2JlU3RhcnRPZmZzZXQpIHx8IG9wdGlvbnMuZ3JvdW5kUHJvYmVTdGFydE9mZnNldCA8IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2hhcmFjdGVyIGNvbnRyb2xsZXIgZ3JvdW5kUHJvYmVTdGFydE9mZnNldCBtdXN0IGJlIGEgZmluaXRlIG5vbi1uZWdhdGl2ZSB2YWx1ZS4nKTtcbiAgICB9XG4gICAgUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9wYWNrQ29sbGlzaW9uR3JvdXBzKG9wdGlvbnMuZ3JvdW5kQ29sbGlzaW9uR3JvdXAsIG9wdGlvbnMuZ3JvdW5kQ29sbGlzaW9uTWFzayk7XG4gICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKG9wdGlvbnMuc3R1Y2tSZWNvdmVyeUZyYW1lQ291bnQpIHx8IG9wdGlvbnMuc3R1Y2tSZWNvdmVyeUZyYW1lQ291bnQgPD0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDaGFyYWN0ZXIgY29udHJvbGxlciBzdHVja1JlY292ZXJ5RnJhbWVDb3VudCBtdXN0IGJlIGEgcG9zaXRpdmUgaW50ZWdlci4nKTtcbiAgICB9XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFFQSxTQUF3QixtQkFBbUIsZ0JBQWdCLFlBQVksZUFBZTtBQUN0RixTQUFTLGNBQWM7QUFRdkIsU0FBUyx5QkFBeUI7QUFDbEMsU0FBUyw0QkFBNEI7QUFDckM7QUFBQSxFQUdFO0FBQUEsT0FJSztBQUNQLFNBQVMsdUNBQXVDO0FBUWhELElBQU0saUJBQWtDO0FBQUEsRUFDdEMsZUFBZTtBQUFBLEVBQ2YsZUFBZTtBQUFBLEVBQ2YsY0FBYztBQUFBLEVBQ2Qsb0JBQW9CLEtBQUssS0FBSztBQUFBLEVBQzlCLG9CQUFxQixLQUFLLEtBQUssS0FBTTtBQUFBLEVBQ3JDLHNCQUFzQjtBQUFBLEVBQ3RCLFNBQVM7QUFBQSxFQUNULFdBQVc7QUFBQSxFQUNYLGNBQWMsSUFBSTtBQUFBLEVBQ2xCLDhCQUE4QjtBQUFBLEVBQzlCLHFCQUFxQjtBQUFBLEVBQ3JCLHdCQUF3QjtBQUFBLEVBQ3hCLHNCQUFzQjtBQUFBLEVBQ3RCLHFCQUFxQjtBQUFBLEVBQ3JCLG1CQUFtQjtBQUFBLEVBQ25CLG1CQUFtQjtBQUFBLEVBQ25CLHNCQUFzQjtBQUFBLEVBQ3RCLHlCQUF5QjtBQUFBLEVBQ3pCLHVCQUF1QjtBQUN6QjtBQUVBLElBQU0scUJBQTJDO0FBQUEsRUFDL0MsT0FBTztBQUFBLEVBQ1AsVUFBVSxRQUFRLEtBQUs7QUFBQSxFQUN2QixpQkFBaUI7QUFBQSxFQUNqQixlQUFlO0FBQUEsRUFDZixrQkFBa0I7QUFBQSxFQUNsQixrQkFBa0I7QUFBQSxFQUNsQixrQkFBa0I7QUFBQSxFQUNsQixvQkFBb0I7QUFDdEI7QUFHTyxJQUFNLG9DQUFOLE1BQXNHO0FBQUEsRUFB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
