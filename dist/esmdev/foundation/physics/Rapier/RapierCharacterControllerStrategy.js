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
    this.Oc = { ...defaultOptions };
    this.ov = MutableVector3.zero();
    this.bv = MutableVector3.zero();
    this.Yu = 0;
    this.Xu = false;
    this.hv = false;
    this.iv = true;
    this.jv = Vector3.zero();
    this.$u = 0;
    this.av = false;
    this.dv = initialMotionState;
    this.kv = 0;
    this.ev = false;
    this.fv = false;
    this.gv = 0;
    this.lv = 0;
    this.cv = Vector3.one();
    this.qv = true;
    this.nv = false;
    /** Reusable quaternion for world-rotation lookups (avoids per-frame allocations) */
    this.rv = MutableQuaternion.identity();
  }
  setup(entity, shapeInstance, options = {}) {
    var _a, _b, _c, _d, _e, _f;
    if (this.Uu != null) {
      throw new Error("RapierCharacterControllerStrategy has already been set up.");
    }
    const { shapeIndex: _shapeIndex, radius: _radius, height: _height, ...movementOptions } = options;
    const resolvedOptions = {
      ...defaultOptions,
      ...movementOptions,
      groundProbeDistance: (_b = options.groundProbeDistance) != null ? _b : Math.max((_a = options.snapToGroundDistance) != null ? _a : defaultOptions.snapToGroundDistance, 0.3),
      groundProbeStartOffset: (_d = (_c = options.groundProbeStartOffset) != null ? _c : options.contactOffset) != null ? _d : defaultOptions.contactOffset
    };
    this.ad(resolvedOptions);
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
    const resolvedCapsule = this.sv(shapeInstance, scale);
    const radius = resolvedCapsule.radius;
    resolvedOptions.groundProbeRadius = (_e = options.groundProbeRadius) != null ? _e : radius * 0.8;
    if (!Number.isFinite(resolvedOptions.groundProbeRadius) || resolvedOptions.groundProbeRadius <= 0 || resolvedOptions.groundProbeRadius > radius) {
      throw new Error(
        "Character controller groundProbeRadius must be positive and no greater than the capsule radius."
      );
    }
    const colliderDesc = this.tv(resolvedCapsule);
    const initialPosition = entity.getSceneGraph().position;
    const initialRotation = entity.getSceneGraph().getQuaternionRecursivelyTo(this.rv);
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
      this.nv = false;
      throw error;
    }
    this.Vu = entity;
    this.pv = new PhysicsWorldQuery(new RapierPhysicsWorldQueryStrategy(entity.engine));
    this.Oc = resolvedOptions;
    this.jv = resolvedCapsule.bottomOffset;
    this.Uu = rigidBody;
    this._u = collider;
    this.Wu = controller;
    this.mv = shapeInstance;
    this.cv = Vector3.fromCopy3(scale.x, scale.y, scale.z);
    this.qv = options.groundProbeRadius == null;
  }
  setDesiredHorizontalVelocity(velocity) {
    this.ov.setComponents(velocity.x, 0, velocity.z);
  }
  requestJump() {
    this.hv = true;
  }
  teleport(position) {
    var _a, _b, _c;
    if (this.Uu == null) {
      throw new Error("RapierCharacterControllerStrategy.setup() must be called before teleport().");
    }
    const translation = { x: position.x, y: position.y, z: position.z };
    this.Uu.setTranslation(translation, true);
    (_b = (_a = this.Uu).setNextKinematicTranslation) == null ? void 0 : _b.call(_a, translation);
    (_c = this.Vu) == null ? void 0 : _c.getSceneGraph().setPositionWithoutPhysics(Vector3.fromCopy3(position.x, position.y, position.z));
    this.Yu = 0;
    this.Xu = false;
    this.hv = false;
    this.bv.setComponents(0, 0, 0);
    this.Zu = void 0;
    this.$u = 0;
    this.av = false;
    this.dv = initialMotionState;
    this.kv = 0;
    this.ev = false;
    this.fv = false;
    this.gv = 0;
    this.lv = 0;
  }
  preStep(deltaTime) {
    var _a, _b;
    if (!this.iv || this.Vu == null || this.Uu == null || this._u == null || this.Wu == null) {
      return;
    }
    this.uv();
    const current = this.vv();
    if (this.Uu.setNextKinematicRotation == null) {
      throw new Error("The injected Rapier rigid body does not support kinematic rotation.");
    }
    const worldRotation = this.Vu.getSceneGraph().getQuaternionRecursivelyTo(this.rv);
    this.Uu.setNextKinematicRotation({
      x: worldRotation.x,
      y: worldRotation.y,
      z: worldRotation.z,
      w: worldRotation.w
    });
    this.av = false;
    const dt = Math.min(Math.max(deltaTime, 0), this.Oc.maxDeltaTime);
    this.kv = dt;
    if (this.hv && this.Xu) {
      this.Yu = this.Oc.jumpSpeed;
      this.Xu = false;
    } else {
      this.Yu -= this.Oc.gravity * dt;
    }
    this.hv = false;
    const desiredMovement = {
      x: this.ov.x * dt,
      y: this.Yu * dt,
      z: this.ov.z * dt
    };
    const filterFlags = (_b = (_a = RapierPhysicsStrategy._getRapier().QueryFilterFlags) == null ? void 0 : _a.EXCLUDE_SENSORS) != null ? _b : 8;
    this.Wu.computeColliderMovement(this._u, desiredMovement, filterFlags);
    let movement = this.Wu.computedMovement();
    const collisionNormals = this.wv();
    if (this.Yu > 0 && collisionNormals.some((normal) => normal.y < -0.5)) {
      this.Yu = 0;
    }
    this.Xu = this.Wu.computedGrounded();
    const isDownwardMovementBlocked = this.Oc.stuckRecoveryEnabled && !this.Xu && this.Yu < 0 && desiredMovement.y < -1e-6 && movement.y > -1e-6;
    this.$u = isDownwardMovementBlocked ? this.$u + 1 : 0;
    if (this.$u >= this.Oc.stuckRecoveryFrameCount) {
      this.Wu.computeColliderMovement(this._u, { x: 0, y: desiredMovement.y, z: 0 }, filterFlags);
      const verticalMovement = this.Wu.computedMovement();
      if (verticalMovement.y < -1e-6) {
        movement = verticalMovement;
      } else {
        movement = this.xv(movement, collisionNormals);
      }
      this.Xu = this.Wu.computedGrounded();
      this.av = true;
      this.$u = 0;
    }
    this.bv.setComponents(movement.x, movement.y, movement.z);
    this.gv = this.Yu;
    if (this.Xu && this.Yu < 0) {
      if (!this.ev && this.fv) {
        this.lv = -this.Yu;
      }
      this.Yu = 0;
    }
    const next = {
      x: current.x + movement.x,
      y: current.y + movement.y,
      z: current.z + movement.z
    };
    if (this.Uu.setNextKinematicTranslation == null) {
      throw new Error("The injected Rapier rigid body does not support kinematic translation.");
    }
    this.Uu.setNextKinematicTranslation(next);
  }
  postStep() {
    if (!this.iv || this.Vu == null || this.Uu == null) {
      return;
    }
    const position = this.Uu.translation();
    this.Vu.getSceneGraph().setPositionWithoutPhysics(Vector3.fromCopy3(position.x, position.y, position.z));
    this.yv(position);
    this.zv();
  }
  get isGrounded() {
    return this.Xu;
  }
  get computedMovement() {
    return this.bv;
  }
  get groundContact() {
    return this.Zu;
  }
  get isRecovering() {
    return this.av;
  }
  get motionState() {
    return this.dv;
  }
  set enabled(value) {
    this.iv = value;
    if (!value) {
      this.Zu = void 0;
      this.$u = 0;
      this.av = false;
    }
  }
  get enabled() {
    return this.iv;
  }
  destroy() {
    var _a, _b, _c;
    RapierPhysicsStrategy._unregisterStepParticipant(this);
    const engine = (_a = this.Vu) == null ? void 0 : _a.engine;
    RapierPhysicsStrategy._unregisterExternalCollider(this._u, engine);
    const world = RapierPhysicsStrategy._getWorld(engine);
    if (this.Wu != null) {
      (_b = world.removeCharacterController) == null ? void 0 : _b.call(world, this.Wu);
    }
    if (this.Uu != null) {
      (_c = world.removeRigidBody) == null ? void 0 : _c.call(world, this.Uu);
    }
    this.Wu = void 0;
    this._u = void 0;
    this.Uu = void 0;
    this.Vu = void 0;
    this.pv = void 0;
    this.Zu = void 0;
    this.$u = 0;
    this.av = false;
    this.dv = initialMotionState;
    this.kv = 0;
    this.ev = false;
    this.fv = false;
    this.gv = 0;
    this.lv = 0;
    this.mv = void 0;
    this.cv = Vector3.one();
    this.qv = true;
    this.nv = false;
  }
  sv(shapeInstance, worldScale) {
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
    if (resolved.approximated && !this.nv) {
      Logger.default.warn("Rapier conservatively approximates non-uniform scale for the character capsule.");
      this.nv = true;
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
  tv(resolved) {
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
  uv() {
    if (this.Vu == null || this.Uu == null || this._u == null || this.mv == null) {
      return;
    }
    const scale = this.Vu.getSceneGraph()._getPhysicsWorldScale();
    const absoluteScale = Vector3.fromCopy3(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z));
    const hasChanged = Math.abs(scale.x - this.cv.x) > 1e-6 || Math.abs(scale.y - this.cv.y) > 1e-6 || Math.abs(scale.z - this.cv.z) > 1e-6;
    if (!hasChanged) {
      return;
    }
    if (![absoluteScale.x, absoluteScale.y, absoluteScale.z].every(Number.isFinite) || absoluteScale.x <= 0 || absoluteScale.y <= 0 || absoluteScale.z <= 0) {
      throw new Error("Character controller scale components must remain finite and non-zero after setup.");
    }
    const world = RapierPhysicsStrategy._getWorld(this.Vu.engine);
    if (world.removeRigidBody == null) {
      throw new Error("The injected Rapier world does not support rebuilding a scaled character body.");
    }
    const resolved = this.sv(this.mv, scale);
    const groundProbeRadius = this.qv ? resolved.radius * 0.8 : this.Oc.groundProbeRadius;
    if (!Number.isFinite(groundProbeRadius) || groundProbeRadius <= 0 || groundProbeRadius > resolved.radius) {
      throw new Error(
        "Character controller groundProbeRadius must be positive and no greater than the scaled capsule radius."
      );
    }
    const colliderDesc = this.tv(resolved);
    const position = this.Uu.translation();
    const rotation = this.Uu.rotation();
    const rigidBodyDesc = RapierPhysicsStrategy._getRapier().RigidBodyDesc.kinematicPositionBased().setTranslation(position.x, position.y, position.z).setRotation({ x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w });
    const previousRigidBody = this.Uu;
    const previousCollider = this._u;
    const rigidBody = world.createRigidBody(rigidBodyDesc);
    let collider;
    try {
      collider = world.createCollider(colliderDesc, rigidBody);
    } catch (error) {
      world.removeRigidBody(rigidBody);
      throw error;
    }
    RapierPhysicsStrategy._registerExternalCollider(collider, this.Vu);
    RapierPhysicsStrategy._unregisterExternalCollider(previousCollider, this.Vu.engine, true);
    world.removeRigidBody(previousRigidBody);
    this.Uu = rigidBody;
    this._u = collider;
    this.jv = resolved.bottomOffset;
    this.Oc.groundProbeRadius = groundProbeRadius;
    this.cv = Vector3.fromCopy3(scale.x, scale.y, scale.z);
  }
  vv() {
    const rigidBody = this.Uu;
    const current = rigidBody.translation();
    const sceneGraphPosition = this.Vu.getSceneGraph().position;
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
  zv() {
    const dt = this.kv;
    const velocity = dt > 0 ? Vector3.fromCopy3(
      this.bv.x / dt,
      this.bv.y / dt,
      this.bv.z / dt
    ) : Vector3.zero();
    const state = this.Av();
    const previous = this.dv;
    const isGroundedNow = this.Xu;
    this.dv = {
      state,
      velocity,
      horizontalSpeed: Math.hypot(velocity.x, velocity.z),
      verticalSpeed: velocity.y,
      groundedDuration: isGroundedNow ? previous.groundedDuration + dt : 0,
      airborneDuration: isGroundedNow ? 0 : previous.airborneDuration + dt,
      stateElapsedTime: state === previous.state ? previous.stateElapsedTime + dt : dt,
      landingImpactSpeed: this.lv,
      groundContact: this.Zu
    };
    this.ev = isGroundedNow;
    if (isGroundedNow) {
      this.fv = true;
    }
  }
  Av() {
    if (this.av) {
      return "recovering";
    }
    if (!this.fv && this.Xu) {
      return "grounded";
    }
    if (!this.ev && this.Xu) {
      return "landing";
    }
    if (this.Xu) {
      return "grounded";
    }
    if (this.Zu != null && !this.Zu.isWalkable && this.gv <= 0) {
      return "sliding";
    }
    return this.gv > 1e-6 ? "rising" : "falling";
  }
  wv() {
    var _a, _b, _c, _d, _e;
    const count = (_c = (_b = (_a = this.Wu) == null ? void 0 : _a.numComputedCollisions) == null ? void 0 : _b.call(_a)) != null ? _c : 0;
    const normals = [];
    for (let i = 0; i < count; i++) {
      const collision = (_e = (_d = this.Wu) == null ? void 0 : _d.computedCollision) == null ? void 0 : _e.call(_d, i);
      if (collision != null) {
        normals.push(collision.normal1);
      }
    }
    return normals;
  }
  xv(movement, normals) {
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
    const scale = this.Oc.stuckRecoveryDistance / length;
    return { x: x * scale, y: Math.min(movement.y, 0), z: z * scale };
  }
  yv(position) {
    var _a, _b;
    if (this.Vu == null) {
      this.Zu = void 0;
      return;
    }
    const bodyRotation = (_a = this.Uu) == null ? void 0 : _a.rotation();
    const capsuleBottomOffset = bodyRotation == null ? this.jv : Quaternion.fromCopy4(bodyRotation.x, bodyRotation.y, bodyRotation.z, bodyRotation.w).transformVector3(
      this.jv
    );
    const capsuleBottom = Vector3.add(Vector3.fromCopy3(position.x, position.y, position.z), capsuleBottomOffset);
    const start = Vector3.add(
      capsuleBottom,
      Vector3.fromCopy3(0, this.Oc.groundProbeRadius + this.Oc.groundProbeStartOffset, 0)
    );
    const hit = (_b = this.pv) == null ? void 0 : _b.castSphere(
      start,
      this.Oc.groundProbeRadius,
      Vector3.fromCopy3(0, -1, 0),
      this.Oc.groundProbeDistance,
      {
        includeSensors: false,
        collisionGroup: this.Oc.groundCollisionGroup,
        collisionMask: this.Oc.groundCollisionMask,
        excludeEntities: [this.Vu]
      }
    );
    if (hit == null || hit.normal.y <= 0) {
      this.Zu = void 0;
      return;
    }
    const normal = Vector3.normalize(hit.normal);
    const slopeAngle = Math.acos(Math.min(1, Math.max(-1, normal.y)));
    this.Zu = {
      entity: hit.entity,
      bindingId: hit.bindingId,
      position: hit.position,
      normal,
      distance: hit.distance,
      slopeAngle,
      isWalkable: slopeAngle <= this.Oc.maxSlopeClimbAngle
    };
  }
  ad(options) {
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vcGh5c2ljcy9SYXBpZXIvUmFwaWVyQ2hhcmFjdGVyQ29udHJvbGxlclN0cmF0ZWd5LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IFNoYXBlSW5zdGFuY2UgfSBmcm9tICcuLi8uLi9nZW9tZXRyeS9TaGFwZSc7XG5pbXBvcnQgdHlwZSB7IElTY2VuZUdyYXBoRW50aXR5IH0gZnJvbSAnLi4vLi4vaGVscGVycy9FbnRpdHlIZWxwZXInO1xuaW1wb3J0IHsgdHlwZSBJVmVjdG9yMywgTXV0YWJsZVF1YXRlcm5pb24sIE11dGFibGVWZWN0b3IzLCBRdWF0ZXJuaW9uLCBWZWN0b3IzIH0gZnJvbSAnLi4vLi4vbWF0aCc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuLi8uLi9taXNjL0xvZ2dlcic7XG5pbXBvcnQgdHlwZSB7XG4gIENoYXJhY3RlckNvbnRyb2xsZXJPcHRpb25zLFxuICBDaGFyYWN0ZXJDb250cm9sbGVyU3RyYXRlZ3ksXG4gIENoYXJhY3Rlckdyb3VuZENvbnRhY3QsXG4gIENoYXJhY3Rlck1vdGlvblN0YXRlLFxuICBDaGFyYWN0ZXJNb3ZlbWVudFN0YXRlLFxufSBmcm9tICcuLi9DaGFyYWN0ZXJDb250cm9sbGVyU3RyYXRlZ3knO1xuaW1wb3J0IHsgUGh5c2ljc1dvcmxkUXVlcnkgfSBmcm9tICcuLi9QaHlzaWNzV29ybGRRdWVyeSc7XG5pbXBvcnQgeyByZXNvbHZlU2NhbGVkQ2Fwc3VsZSB9IGZyb20gJy4uL1NoYXBlVHJhbnNmb3JtUmVzb2x2ZXInO1xuaW1wb3J0IHtcbiAgdHlwZSBSYXBpZXJDaGFyYWN0ZXJDb250cm9sbGVyTGlrZSxcbiAgdHlwZSBSYXBpZXJDb2xsaWRlckxpa2UsXG4gIFJhcGllclBoeXNpY3NTdHJhdGVneSxcbiAgdHlwZSBSYXBpZXJSaWdpZEJvZHlMaWtlLFxuICB0eXBlIFJhcGllclN0ZXBQYXJ0aWNpcGFudCxcbiAgdHlwZSBSYXBpZXJWZWN0b3IzTGlrZSxcbn0gZnJvbSAnLi9SYXBpZXJQaHlzaWNzU3RyYXRlZ3knO1xuaW1wb3J0IHsgUmFwaWVyUGh5c2ljc1dvcmxkUXVlcnlTdHJhdGVneSB9IGZyb20gJy4vUmFwaWVyUGh5c2ljc1dvcmxkUXVlcnlTdHJhdGVneSc7XG5cbnR5cGUgUmVzb2x2ZWRPcHRpb25zID0gUmVxdWlyZWQ8T21pdDxDaGFyYWN0ZXJDb250cm9sbGVyT3B0aW9ucywgJ3NoYXBlSW5kZXgnIHwgJ3JhZGl1cycgfCAnaGVpZ2h0Jz4+O1xudHlwZSBSZXNvbHZlZENoYXJhY3RlckNhcHN1bGUgPSBSZXR1cm5UeXBlPHR5cGVvZiByZXNvbHZlU2NhbGVkQ2Fwc3VsZT4gJiB7XG4gIGxvY2FsUG9zaXRpb246IElWZWN0b3IzO1xuICBib3R0b21PZmZzZXQ6IElWZWN0b3IzO1xufTtcblxuY29uc3QgZGVmYXVsdE9wdGlvbnM6IFJlc29sdmVkT3B0aW9ucyA9IHtcbiAgY29udGFjdE9mZnNldDogMC4wMSxcbiAgbWF4U3RlcEhlaWdodDogMC4yNSxcbiAgbWluU3RlcFdpZHRoOiAwLjIsXG4gIG1heFNsb3BlQ2xpbWJBbmdsZTogTWF0aC5QSSAvIDQsXG4gIG1pblNsb3BlU2xpZGVBbmdsZTogKDUwICogTWF0aC5QSSkgLyAxODAsXG4gIHNuYXBUb0dyb3VuZERpc3RhbmNlOiAwLjE1LFxuICBncmF2aXR5OiA5LjgsXG4gIGp1bXBTcGVlZDogNC41LFxuICBtYXhEZWx0YVRpbWU6IDEgLyAxNSxcbiAgYXBwbHlJbXB1bHNlc1RvRHluYW1pY0JvZGllczogZmFsc2UsXG4gIGdyb3VuZFByb2JlRGlzdGFuY2U6IDAuMyxcbiAgZ3JvdW5kUHJvYmVTdGFydE9mZnNldDogMC4wMSxcbiAgZ3JvdW5kQ29sbGlzaW9uR3JvdXA6IDB4ZmZmZixcbiAgZ3JvdW5kQ29sbGlzaW9uTWFzazogMHhmZmZmLFxuICBncm91bmRQcm9iZVJhZGl1czogMC4yNCxcbiAgbm9ybWFsTnVkZ2VGYWN0b3I6IDAuMDAxLFxuICBzdHVja1JlY292ZXJ5RW5hYmxlZDogdHJ1ZSxcbiAgc3R1Y2tSZWNvdmVyeUZyYW1lQ291bnQ6IDIsXG4gIHN0dWNrUmVjb3ZlcnlEaXN0YW5jZTogMC4wMSxcbn07XG5cbmNvbnN0IGluaXRpYWxNb3Rpb25TdGF0ZTogQ2hhcmFjdGVyTW90aW9uU3RhdGUgPSB7XG4gIHN0YXRlOiAnZmFsbGluZycsXG4gIHZlbG9jaXR5OiBWZWN0b3IzLnplcm8oKSxcbiAgaG9yaXpvbnRhbFNwZWVkOiAwLFxuICB2ZXJ0aWNhbFNwZWVkOiAwLFxuICBncm91bmRlZER1cmF0aW9uOiAwLFxuICBhaXJib3JuZUR1cmF0aW9uOiAwLFxuICBzdGF0ZUVsYXBzZWRUaW1lOiAwLFxuICBsYW5kaW5nSW1wYWN0U3BlZWQ6IDAsXG59O1xuXG4vKiogUmFwaWVyLWJhY2tlZCBraW5lbWF0aWMgY2Fwc3VsZSBjaGFyYWN0ZXIgY29udHJvbGxlci4gKi9cbmV4cG9ydCBjbGFzcyBSYXBpZXJDaGFyYWN0ZXJDb250cm9sbGVyU3RyYXRlZ3kgaW1wbGVtZW50cyBDaGFyYWN0ZXJDb250cm9sbGVyU3RyYXRlZ3ksIFJhcGllclN0ZXBQYXJ0aWNpcGFudCB7XG4gIHByaXZhdGUgX19lbnRpdHk/OiBJU2NlbmVHcmFwaEVudGl0eTtcbiAgcHJpdmF0ZSBfX3JpZ2lkQm9keT86IFJhcGllclJpZ2lkQm9keUxpa2U7XG4gIHByaXZhdGUgX19jb2xsaWRlcj86IFJhcGllckNvbGxpZGVyTGlrZTtcbiAgcHJpdmF0ZSBfX2NvbnRyb2xsZXI/OiBSYXBpZXJDaGFyYWN0ZXJDb250cm9sbGVyTGlrZTtcbiAgcHJpdmF0ZSBfX29wdGlvbnM6IFJlc29sdmVkT3B0aW9ucyA9IHsgLi4uZGVmYXVsdE9wdGlvbnMgfTtcbiAgcHJpdmF0ZSBfX2Rlc2lyZWRIb3Jpem9udGFsVmVsb2NpdHkgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgX19jb21wdXRlZE1vdmVtZW50ID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIF9fdmVydGljYWxWZWxvY2l0eSA9IDA7XG4gIHByaXZhdGUgX19pc0dyb3VuZGVkID0gZmFsc2U7XG4gIHByaXZhdGUgX19qdW1wUmVxdWVzdGVkID0gZmFsc2U7XG4gIHByaXZhdGUgX19lbmFibGVkID0gdHJ1ZTtcbiAgcHJpdmF0ZSBfX2dyb3VuZENvbnRhY3Q/OiBDaGFyYWN0ZXJHcm91bmRDb250YWN0O1xuICBwcml2YXRlIF9fY2Fwc3VsZUJvdHRvbU9mZnNldCA9IFZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIF9fd29ybGRRdWVyeT86IFBoeXNpY3NXb3JsZFF1ZXJ5O1xuICBwcml2YXRlIF9fc3R1Y2tGcmFtZUNvdW50ID0gMDtcbiAgcHJpdmF0ZSBfX2lzUmVjb3ZlcmluZyA9IGZhbHNlO1xuICBwcml2YXRlIF9fbW90aW9uU3RhdGU6IENoYXJhY3Rlck1vdGlvblN0YXRlID0gaW5pdGlhbE1vdGlvblN0YXRlO1xuICBwcml2YXRlIF9fbGFzdFN0ZXBEZWx0YVRpbWUgPSAwO1xuICBwcml2YXRlIF9fd2FzR3JvdW5kZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX2hhc0VzdGFibGlzaGVkR3JvdW5kaW5nID0gZmFsc2U7XG4gIHByaXZhdGUgX19zdGF0ZVZlcnRpY2FsVmVsb2NpdHkgPSAwO1xuICBwcml2YXRlIF9fbGFuZGluZ0ltcGFjdFNwZWVkID0gMDtcbiAgcHJpdmF0ZSBfX3NoYXBlSW5zdGFuY2U/OiBTaGFwZUluc3RhbmNlO1xuICBwcml2YXRlIF9fd29ybGRTY2FsZSA9IFZlY3RvcjMub25lKCk7XG4gIHByaXZhdGUgX19pc0dyb3VuZFByb2JlUmFkaXVzRGVyaXZlZCA9IHRydWU7XG4gIHByaXZhdGUgX193YXJuZWROb25Vbmlmb3JtU2NhbGUgPSBmYWxzZTtcbiAgLyoqIFJldXNhYmxlIHF1YXRlcm5pb24gZm9yIHdvcmxkLXJvdGF0aW9uIGxvb2t1cHMgKGF2b2lkcyBwZXItZnJhbWUgYWxsb2NhdGlvbnMpICovXG4gIHByaXZhdGUgX190bXBXb3JsZFJvdGF0aW9uID0gTXV0YWJsZVF1YXRlcm5pb24uaWRlbnRpdHkoKTtcblxuICBzZXR1cChlbnRpdHk6IElTY2VuZUdyYXBoRW50aXR5LCBzaGFwZUluc3RhbmNlOiBTaGFwZUluc3RhbmNlLCBvcHRpb25zOiBDaGFyYWN0ZXJDb250cm9sbGVyT3B0aW9ucyA9IHt9KTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX19yaWdpZEJvZHkgIT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdSYXBpZXJDaGFyYWN0ZXJDb250cm9sbGVyU3RyYXRlZ3kgaGFzIGFscmVhZHkgYmVlbiBzZXQgdXAuJyk7XG4gICAgfVxuXG4gICAgY29uc3QgeyBzaGFwZUluZGV4OiBfc2hhcGVJbmRleCwgcmFkaXVzOiBfcmFkaXVzLCBoZWlnaHQ6IF9oZWlnaHQsIC4uLm1vdmVtZW50T3B0aW9ucyB9ID0gb3B0aW9ucztcbiAgICBjb25zdCByZXNvbHZlZE9wdGlvbnM6IFJlc29sdmVkT3B0aW9ucyA9IHtcbiAgICAgIC4uLmRlZmF1bHRPcHRpb25zLFxuICAgICAgLi4ubW92ZW1lbnRPcHRpb25zLFxuICAgICAgZ3JvdW5kUHJvYmVEaXN0YW5jZTpcbiAgICAgICAgb3B0aW9ucy5ncm91bmRQcm9iZURpc3RhbmNlID8/XG4gICAgICAgIE1hdGgubWF4KG9wdGlvbnMuc25hcFRvR3JvdW5kRGlzdGFuY2UgPz8gZGVmYXVsdE9wdGlvbnMuc25hcFRvR3JvdW5kRGlzdGFuY2UsIDAuMyksXG4gICAgICBncm91bmRQcm9iZVN0YXJ0T2Zmc2V0OiBvcHRpb25zLmdyb3VuZFByb2JlU3RhcnRPZmZzZXQgPz8gb3B0aW9ucy5jb250YWN0T2Zmc2V0ID8/IGRlZmF1bHRPcHRpb25zLmNvbnRhY3RPZmZzZXQsXG4gICAgfTtcbiAgICB0aGlzLl9fdmFsaWRhdGVPcHRpb25zKHJlc29sdmVkT3B0aW9ucyk7XG5cbiAgICBjb25zdCByYXBpZXIgPSBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX2dldFJhcGllcigpO1xuICAgIGNvbnN0IHdvcmxkID0gUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9nZXRXb3JsZChlbnRpdHkuZW5naW5lKTtcbiAgICBpZiAocmFwaWVyLlJpZ2lkQm9keURlc2Mua2luZW1hdGljUG9zaXRpb25CYXNlZCA9PSBudWxsIHx8IHJhcGllci5Db2xsaWRlckRlc2MuY2Fwc3VsZSA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBpbmplY3RlZCBSYXBpZXIgbW9kdWxlIGRvZXMgbm90IHN1cHBvcnQga2luZW1hdGljIGNhcHN1bGUgYm9kaWVzLicpO1xuICAgIH1cbiAgICBpZiAod29ybGQuY3JlYXRlQ2hhcmFjdGVyQ29udHJvbGxlciA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBpbmplY3RlZCBSYXBpZXIgd29ybGQgZG9lcyBub3Qgc3VwcG9ydCBjaGFyYWN0ZXIgY29udHJvbGxlcnMuJyk7XG4gICAgfVxuICAgIGlmICh3b3JsZC5yZW1vdmVSaWdpZEJvZHkgPT0gbnVsbCB8fCB3b3JsZC5yZW1vdmVDaGFyYWN0ZXJDb250cm9sbGVyID09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGluamVjdGVkIFJhcGllciB3b3JsZCBkb2VzIG5vdCBzdXBwb3J0IGNoYXJhY3Rlci1jb250cm9sbGVyIHJlc291cmNlIGNsZWFudXAuJyk7XG4gICAgfVxuICAgIGlmIChzaGFwZUluc3RhbmNlLnNoYXBlLnR5cGUgIT09ICdjYXBzdWxlJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdSYXBpZXJDaGFyYWN0ZXJDb250cm9sbGVyU3RyYXRlZ3kgcmVxdWlyZXMgYSBjYXBzdWxlIFNoYXBlSW5zdGFuY2UuJyk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NhbGUgPSBlbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLl9nZXRQaHlzaWNzV29ybGRTY2FsZSgpO1xuICAgIGNvbnN0IGFic29sdXRlU2NhbGUgPSBbTWF0aC5hYnMoc2NhbGUueCksIE1hdGguYWJzKHNjYWxlLnkpLCBNYXRoLmFicyhzY2FsZS56KV07XG4gICAgaWYgKCFhYnNvbHV0ZVNjYWxlLmV2ZXJ5KE51bWJlci5pc0Zpbml0ZSkgfHwgYWJzb2x1dGVTY2FsZS5zb21lKGNvbXBvbmVudCA9PiBjb21wb25lbnQgPD0gMCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2hhcmFjdGVyIGNvbnRyb2xsZXIgc2NhbGUgY29tcG9uZW50cyBtdXN0IGJlIGZpbml0ZSBhbmQgbm9uLXplcm8gYXQgc2V0dXAuJyk7XG4gICAgfVxuICAgIGNvbnN0IGNhcHN1bGUgPSBzaGFwZUluc3RhbmNlLnNoYXBlO1xuICAgIGlmIChjYXBzdWxlLnJhZGl1c0JvdHRvbSAhPT0gY2Fwc3VsZS5yYWRpdXNUb3ApIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0Lndhcm4oXG4gICAgICAgIGBSYXBpZXIgYXBwcm94aW1hdGVzIGFzeW1tZXRyaWMgY2hhcmFjdGVyIGNhcHN1bGUgcmFkaWkgKCR7Y2Fwc3VsZS5yYWRpdXNCb3R0b219LCAke2NhcHN1bGUucmFkaXVzVG9wfSkgd2l0aCB0aGUgbWF4aW11bSByYWRpdXMuYFxuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3QgcmVzb2x2ZWRDYXBzdWxlID0gdGhpcy5fX3Jlc29sdmVDaGFyYWN0ZXJDYXBzdWxlKHNoYXBlSW5zdGFuY2UsIHNjYWxlKTtcbiAgICBjb25zdCByYWRpdXMgPSByZXNvbHZlZENhcHN1bGUucmFkaXVzO1xuICAgIHJlc29sdmVkT3B0aW9ucy5ncm91bmRQcm9iZVJhZGl1cyA9IG9wdGlvbnMuZ3JvdW5kUHJvYmVSYWRpdXMgPz8gcmFkaXVzICogMC44O1xuICAgIGlmIChcbiAgICAgICFOdW1iZXIuaXNGaW5pdGUocmVzb2x2ZWRPcHRpb25zLmdyb3VuZFByb2JlUmFkaXVzKSB8fFxuICAgICAgcmVzb2x2ZWRPcHRpb25zLmdyb3VuZFByb2JlUmFkaXVzIDw9IDAgfHxcbiAgICAgIHJlc29sdmVkT3B0aW9ucy5ncm91bmRQcm9iZVJhZGl1cyA+IHJhZGl1c1xuICAgICkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnQ2hhcmFjdGVyIGNvbnRyb2xsZXIgZ3JvdW5kUHJvYmVSYWRpdXMgbXVzdCBiZSBwb3NpdGl2ZSBhbmQgbm8gZ3JlYXRlciB0aGFuIHRoZSBjYXBzdWxlIHJhZGl1cy4nXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCBjb2xsaWRlckRlc2MgPSB0aGlzLl9fY3JlYXRlQ2hhcmFjdGVyQ29sbGlkZXJEZXNjKHJlc29sdmVkQ2Fwc3VsZSk7XG5cbiAgICBjb25zdCBpbml0aWFsUG9zaXRpb24gPSBlbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLnBvc2l0aW9uO1xuICAgIGNvbnN0IGluaXRpYWxSb3RhdGlvbiA9IGVudGl0eS5nZXRTY2VuZUdyYXBoKCkuZ2V0UXVhdGVybmlvblJlY3Vyc2l2ZWx5VG8odGhpcy5fX3RtcFdvcmxkUm90YXRpb24pO1xuICAgIGNvbnN0IHJpZ2lkQm9keURlc2MgPSByYXBpZXIuUmlnaWRCb2R5RGVzYy5raW5lbWF0aWNQb3NpdGlvbkJhc2VkKClcbiAgICAgIC5zZXRUcmFuc2xhdGlvbihpbml0aWFsUG9zaXRpb24ueCwgaW5pdGlhbFBvc2l0aW9uLnksIGluaXRpYWxQb3NpdGlvbi56KVxuICAgICAgLnNldFJvdGF0aW9uKHtcbiAgICAgICAgeDogaW5pdGlhbFJvdGF0aW9uLngsXG4gICAgICAgIHk6IGluaXRpYWxSb3RhdGlvbi55LFxuICAgICAgICB6OiBpbml0aWFsUm90YXRpb24ueixcbiAgICAgICAgdzogaW5pdGlhbFJvdGF0aW9uLncsXG4gICAgICB9KTtcblxuICAgIGxldCByaWdpZEJvZHk6IFJhcGllclJpZ2lkQm9keUxpa2UgfCB1bmRlZmluZWQ7XG4gICAgbGV0IGNvbGxpZGVyOiBSYXBpZXJDb2xsaWRlckxpa2UgfCB1bmRlZmluZWQ7XG4gICAgbGV0IGNvbnRyb2xsZXI6IFJhcGllckNoYXJhY3RlckNvbnRyb2xsZXJMaWtlIHwgdW5kZWZpbmVkO1xuICAgIHRyeSB7XG4gICAgICByaWdpZEJvZHkgPSB3b3JsZC5jcmVhdGVSaWdpZEJvZHkocmlnaWRCb2R5RGVzYyk7XG4gICAgICBjb2xsaWRlciA9IHdvcmxkLmNyZWF0ZUNvbGxpZGVyKGNvbGxpZGVyRGVzYywgcmlnaWRCb2R5KTtcbiAgICAgIFJhcGllclBoeXNpY3NTdHJhdGVneS5fcmVnaXN0ZXJFeHRlcm5hbENvbGxpZGVyKGNvbGxpZGVyLCBlbnRpdHkpO1xuICAgICAgY29udHJvbGxlciA9IHdvcmxkLmNyZWF0ZUNoYXJhY3RlckNvbnRyb2xsZXIocmVzb2x2ZWRPcHRpb25zLmNvbnRhY3RPZmZzZXQpO1xuICAgICAgY29udHJvbGxlci5lbmFibGVBdXRvc3RlcChyZXNvbHZlZE9wdGlvbnMubWF4U3RlcEhlaWdodCwgcmVzb2x2ZWRPcHRpb25zLm1pblN0ZXBXaWR0aCwgZmFsc2UpO1xuICAgICAgY29udHJvbGxlci5lbmFibGVTbmFwVG9Hcm91bmQocmVzb2x2ZWRPcHRpb25zLnNuYXBUb0dyb3VuZERpc3RhbmNlKTtcbiAgICAgIGNvbnRyb2xsZXIuc2V0TWF4U2xvcGVDbGltYkFuZ2xlKHJlc29sdmVkT3B0aW9ucy5tYXhTbG9wZUNsaW1iQW5nbGUpO1xuICAgICAgY29udHJvbGxlci5zZXRNaW5TbG9wZVNsaWRlQW5nbGUocmVzb2x2ZWRPcHRpb25zLm1pblNsb3BlU2xpZGVBbmdsZSk7XG4gICAgICBjb250cm9sbGVyLnNldEFwcGx5SW1wdWxzZXNUb0R5bmFtaWNCb2RpZXMocmVzb2x2ZWRPcHRpb25zLmFwcGx5SW1wdWxzZXNUb0R5bmFtaWNCb2RpZXMpO1xuICAgICAgY29udHJvbGxlci5zZXROb3JtYWxOdWRnZUZhY3Rvcj8uKHJlc29sdmVkT3B0aW9ucy5ub3JtYWxOdWRnZUZhY3Rvcik7XG4gICAgICBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX3JlZ2lzdGVyU3RlcFBhcnRpY2lwYW50KHRoaXMsIGVudGl0eS5lbmdpbmUpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX3VucmVnaXN0ZXJTdGVwUGFydGljaXBhbnQodGhpcyk7XG4gICAgICB0cnkge1xuICAgICAgICBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX3VucmVnaXN0ZXJFeHRlcm5hbENvbGxpZGVyKGNvbGxpZGVyLCBlbnRpdHkuZW5naW5lKTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKGNvbnRyb2xsZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgd29ybGQucmVtb3ZlQ2hhcmFjdGVyQ29udHJvbGxlcihjb250cm9sbGVyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgaWYgKHJpZ2lkQm9keSAhPSBudWxsKSB7XG4gICAgICAgICAgICB3b3JsZC5yZW1vdmVSaWdpZEJvZHkocmlnaWRCb2R5KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuX193YXJuZWROb25Vbmlmb3JtU2NhbGUgPSBmYWxzZTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cblxuICAgIHRoaXMuX19lbnRpdHkgPSBlbnRpdHk7XG4gICAgdGhpcy5fX3dvcmxkUXVlcnkgPSBuZXcgUGh5c2ljc1dvcmxkUXVlcnkobmV3IFJhcGllclBoeXNpY3NXb3JsZFF1ZXJ5U3RyYXRlZ3koZW50aXR5LmVuZ2luZSkpO1xuICAgIHRoaXMuX19vcHRpb25zID0gcmVzb2x2ZWRPcHRpb25zO1xuICAgIHRoaXMuX19jYXBzdWxlQm90dG9tT2Zmc2V0ID0gcmVzb2x2ZWRDYXBzdWxlLmJvdHRvbU9mZnNldDtcbiAgICB0aGlzLl9fcmlnaWRCb2R5ID0gcmlnaWRCb2R5O1xuICAgIHRoaXMuX19jb2xsaWRlciA9IGNvbGxpZGVyO1xuICAgIHRoaXMuX19jb250cm9sbGVyID0gY29udHJvbGxlcjtcbiAgICB0aGlzLl9fc2hhcGVJbnN0YW5jZSA9IHNoYXBlSW5zdGFuY2U7XG4gICAgdGhpcy5fX3dvcmxkU2NhbGUgPSBWZWN0b3IzLmZyb21Db3B5MyhzY2FsZS54LCBzY2FsZS55LCBzY2FsZS56KTtcbiAgICB0aGlzLl9faXNHcm91bmRQcm9iZVJhZGl1c0Rlcml2ZWQgPSBvcHRpb25zLmdyb3VuZFByb2JlUmFkaXVzID09IG51bGw7XG4gIH1cblxuICBzZXREZXNpcmVkSG9yaXpvbnRhbFZlbG9jaXR5KHZlbG9jaXR5OiBJVmVjdG9yMyk6IHZvaWQge1xuICAgIHRoaXMuX19kZXNpcmVkSG9yaXpvbnRhbFZlbG9jaXR5LnNldENvbXBvbmVudHModmVsb2NpdHkueCwgMCwgdmVsb2NpdHkueik7XG4gIH1cblxuICByZXF1ZXN0SnVtcCgpOiB2b2lkIHtcbiAgICB0aGlzLl9fanVtcFJlcXVlc3RlZCA9IHRydWU7XG4gIH1cblxuICB0ZWxlcG9ydChwb3NpdGlvbjogSVZlY3RvcjMpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fX3JpZ2lkQm9keSA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JhcGllckNoYXJhY3RlckNvbnRyb2xsZXJTdHJhdGVneS5zZXR1cCgpIG11c3QgYmUgY2FsbGVkIGJlZm9yZSB0ZWxlcG9ydCgpLicpO1xuICAgIH1cbiAgICBjb25zdCB0cmFuc2xhdGlvbiA9IHsgeDogcG9zaXRpb24ueCwgeTogcG9zaXRpb24ueSwgejogcG9zaXRpb24ueiB9O1xuICAgIHRoaXMuX19yaWdpZEJvZHkuc2V0VHJhbnNsYXRpb24odHJhbnNsYXRpb24sIHRydWUpO1xuICAgIHRoaXMuX19yaWdpZEJvZHkuc2V0TmV4dEtpbmVtYXRpY1RyYW5zbGF0aW9uPy4odHJhbnNsYXRpb24pO1xuICAgIHRoaXMuX19lbnRpdHk/LmdldFNjZW5lR3JhcGgoKS5zZXRQb3NpdGlvbldpdGhvdXRQaHlzaWNzKFZlY3RvcjMuZnJvbUNvcHkzKHBvc2l0aW9uLngsIHBvc2l0aW9uLnksIHBvc2l0aW9uLnopKTtcbiAgICB0aGlzLl9fdmVydGljYWxWZWxvY2l0eSA9IDA7XG4gICAgdGhpcy5fX2lzR3JvdW5kZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9fanVtcFJlcXVlc3RlZCA9IGZhbHNlO1xuICAgIHRoaXMuX19jb21wdXRlZE1vdmVtZW50LnNldENvbXBvbmVudHMoMCwgMCwgMCk7XG4gICAgdGhpcy5fX2dyb3VuZENvbnRhY3QgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fX3N0dWNrRnJhbWVDb3VudCA9IDA7XG4gICAgdGhpcy5fX2lzUmVjb3ZlcmluZyA9IGZhbHNlO1xuICAgIHRoaXMuX19tb3Rpb25TdGF0ZSA9IGluaXRpYWxNb3Rpb25TdGF0ZTtcbiAgICB0aGlzLl9fbGFzdFN0ZXBEZWx0YVRpbWUgPSAwO1xuICAgIHRoaXMuX193YXNHcm91bmRlZCA9IGZhbHNlO1xuICAgIHRoaXMuX19oYXNFc3RhYmxpc2hlZEdyb3VuZGluZyA9IGZhbHNlO1xuICAgIHRoaXMuX19zdGF0ZVZlcnRpY2FsVmVsb2NpdHkgPSAwO1xuICAgIHRoaXMuX19sYW5kaW5nSW1wYWN0U3BlZWQgPSAwO1xuICB9XG5cbiAgcHJlU3RlcChkZWx0YVRpbWU6IG51bWJlcik6IHZvaWQge1xuICAgIGlmIChcbiAgICAgICF0aGlzLl9fZW5hYmxlZCB8fFxuICAgICAgdGhpcy5fX2VudGl0eSA9PSBudWxsIHx8XG4gICAgICB0aGlzLl9fcmlnaWRCb2R5ID09IG51bGwgfHxcbiAgICAgIHRoaXMuX19jb2xsaWRlciA9PSBudWxsIHx8XG4gICAgICB0aGlzLl9fY29udHJvbGxlciA9PSBudWxsXG4gICAgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX19zeW5jaHJvbml6ZVNjYWxlKCk7XG4gICAgY29uc3QgY3VycmVudCA9IHRoaXMuX19zeW5jaHJvbml6ZVBvc2l0aW9uKCk7XG4gICAgaWYgKHRoaXMuX19yaWdpZEJvZHkuc2V0TmV4dEtpbmVtYXRpY1JvdGF0aW9uID09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGluamVjdGVkIFJhcGllciByaWdpZCBib2R5IGRvZXMgbm90IHN1cHBvcnQga2luZW1hdGljIHJvdGF0aW9uLicpO1xuICAgIH1cbiAgICBjb25zdCB3b3JsZFJvdGF0aW9uID0gdGhpcy5fX2VudGl0eS5nZXRTY2VuZUdyYXBoKCkuZ2V0UXVhdGVybmlvblJlY3Vyc2l2ZWx5VG8odGhpcy5fX3RtcFdvcmxkUm90YXRpb24pO1xuICAgIHRoaXMuX19yaWdpZEJvZHkuc2V0TmV4dEtpbmVtYXRpY1JvdGF0aW9uKHtcbiAgICAgIHg6IHdvcmxkUm90YXRpb24ueCxcbiAgICAgIHk6IHdvcmxkUm90YXRpb24ueSxcbiAgICAgIHo6IHdvcmxkUm90YXRpb24ueixcbiAgICAgIHc6IHdvcmxkUm90YXRpb24udyxcbiAgICB9KTtcblxuICAgIHRoaXMuX19pc1JlY292ZXJpbmcgPSBmYWxzZTtcbiAgICBjb25zdCBkdCA9IE1hdGgubWluKE1hdGgubWF4KGRlbHRhVGltZSwgMCksIHRoaXMuX19vcHRpb25zLm1heERlbHRhVGltZSk7XG4gICAgdGhpcy5fX2xhc3RTdGVwRGVsdGFUaW1lID0gZHQ7XG4gICAgaWYgKHRoaXMuX19qdW1wUmVxdWVzdGVkICYmIHRoaXMuX19pc0dyb3VuZGVkKSB7XG4gICAgICB0aGlzLl9fdmVydGljYWxWZWxvY2l0eSA9IHRoaXMuX19vcHRpb25zLmp1bXBTcGVlZDtcbiAgICAgIHRoaXMuX19pc0dyb3VuZGVkID0gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX192ZXJ0aWNhbFZlbG9jaXR5IC09IHRoaXMuX19vcHRpb25zLmdyYXZpdHkgKiBkdDtcbiAgICB9XG4gICAgdGhpcy5fX2p1bXBSZXF1ZXN0ZWQgPSBmYWxzZTtcblxuICAgIGNvbnN0IGRlc2lyZWRNb3ZlbWVudCA9IHtcbiAgICAgIHg6IHRoaXMuX19kZXNpcmVkSG9yaXpvbnRhbFZlbG9jaXR5LnggKiBkdCxcbiAgICAgIHk6IHRoaXMuX192ZXJ0aWNhbFZlbG9jaXR5ICogZHQsXG4gICAgICB6OiB0aGlzLl9fZGVzaXJlZEhvcml6b250YWxWZWxvY2l0eS56ICogZHQsXG4gICAgfTtcbiAgICBjb25zdCBmaWx0ZXJGbGFncyA9IFJhcGllclBoeXNpY3NTdHJhdGVneS5fZ2V0UmFwaWVyKCkuUXVlcnlGaWx0ZXJGbGFncz8uRVhDTFVERV9TRU5TT1JTID8/IDg7XG4gICAgdGhpcy5fX2NvbnRyb2xsZXIuY29tcHV0ZUNvbGxpZGVyTW92ZW1lbnQodGhpcy5fX2NvbGxpZGVyLCBkZXNpcmVkTW92ZW1lbnQsIGZpbHRlckZsYWdzKTtcbiAgICBsZXQgbW92ZW1lbnQgPSB0aGlzLl9fY29udHJvbGxlci5jb21wdXRlZE1vdmVtZW50KCk7XG4gICAgY29uc3QgY29sbGlzaW9uTm9ybWFscyA9IHRoaXMuX19nZXRDb2xsaXNpb25Ob3JtYWxzKCk7XG4gICAgaWYgKHRoaXMuX192ZXJ0aWNhbFZlbG9jaXR5ID4gMCAmJiBjb2xsaXNpb25Ob3JtYWxzLnNvbWUobm9ybWFsID0+IG5vcm1hbC55IDwgLTAuNSkpIHtcbiAgICAgIHRoaXMuX192ZXJ0aWNhbFZlbG9jaXR5ID0gMDtcbiAgICB9XG4gICAgdGhpcy5fX2lzR3JvdW5kZWQgPSB0aGlzLl9fY29udHJvbGxlci5jb21wdXRlZEdyb3VuZGVkKCk7XG4gICAgY29uc3QgaXNEb3dud2FyZE1vdmVtZW50QmxvY2tlZCA9XG4gICAgICB0aGlzLl9fb3B0aW9ucy5zdHVja1JlY292ZXJ5RW5hYmxlZCAmJlxuICAgICAgIXRoaXMuX19pc0dyb3VuZGVkICYmXG4gICAgICB0aGlzLl9fdmVydGljYWxWZWxvY2l0eSA8IDAgJiZcbiAgICAgIGRlc2lyZWRNb3ZlbWVudC55IDwgLTAuMDAwMDAxICYmXG4gICAgICBtb3ZlbWVudC55ID4gLTAuMDAwMDAxO1xuICAgIHRoaXMuX19zdHVja0ZyYW1lQ291bnQgPSBpc0Rvd253YXJkTW92ZW1lbnRCbG9ja2VkID8gdGhpcy5fX3N0dWNrRnJhbWVDb3VudCArIDEgOiAwO1xuICAgIGlmICh0aGlzLl9fc3R1Y2tGcmFtZUNvdW50ID49IHRoaXMuX19vcHRpb25zLnN0dWNrUmVjb3ZlcnlGcmFtZUNvdW50KSB7XG4gICAgICB0aGlzLl9fY29udHJvbGxlci5jb21wdXRlQ29sbGlkZXJNb3ZlbWVudCh0aGlzLl9fY29sbGlkZXIsIHsgeDogMCwgeTogZGVzaXJlZE1vdmVtZW50LnksIHo6IDAgfSwgZmlsdGVyRmxhZ3MpO1xuICAgICAgY29uc3QgdmVydGljYWxNb3ZlbWVudCA9IHRoaXMuX19jb250cm9sbGVyLmNvbXB1dGVkTW92ZW1lbnQoKTtcbiAgICAgIGlmICh2ZXJ0aWNhbE1vdmVtZW50LnkgPCAtMC4wMDAwMDEpIHtcbiAgICAgICAgbW92ZW1lbnQgPSB2ZXJ0aWNhbE1vdmVtZW50O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbW92ZW1lbnQgPSB0aGlzLl9fY3JlYXRlTnVkZ2VNb3ZlbWVudChtb3ZlbWVudCwgY29sbGlzaW9uTm9ybWFscyk7XG4gICAgICB9XG4gICAgICB0aGlzLl9faXNHcm91bmRlZCA9IHRoaXMuX19jb250cm9sbGVyLmNvbXB1dGVkR3JvdW5kZWQoKTtcbiAgICAgIHRoaXMuX19pc1JlY292ZXJpbmcgPSB0cnVlO1xuICAgICAgdGhpcy5fX3N0dWNrRnJhbWVDb3VudCA9IDA7XG4gICAgfVxuICAgIHRoaXMuX19jb21wdXRlZE1vdmVtZW50LnNldENvbXBvbmVudHMobW92ZW1lbnQueCwgbW92ZW1lbnQueSwgbW92ZW1lbnQueik7XG4gICAgdGhpcy5fX3N0YXRlVmVydGljYWxWZWxvY2l0eSA9IHRoaXMuX192ZXJ0aWNhbFZlbG9jaXR5O1xuICAgIGlmICh0aGlzLl9faXNHcm91bmRlZCAmJiB0aGlzLl9fdmVydGljYWxWZWxvY2l0eSA8IDApIHtcbiAgICAgIGlmICghdGhpcy5fX3dhc0dyb3VuZGVkICYmIHRoaXMuX19oYXNFc3RhYmxpc2hlZEdyb3VuZGluZykge1xuICAgICAgICB0aGlzLl9fbGFuZGluZ0ltcGFjdFNwZWVkID0gLXRoaXMuX192ZXJ0aWNhbFZlbG9jaXR5O1xuICAgICAgfVxuICAgICAgdGhpcy5fX3ZlcnRpY2FsVmVsb2NpdHkgPSAwO1xuICAgIH1cblxuICAgIGNvbnN0IG5leHQgPSB7XG4gICAgICB4OiBjdXJyZW50LnggKyBtb3ZlbWVudC54LFxuICAgICAgeTogY3VycmVudC55ICsgbW92ZW1lbnQueSxcbiAgICAgIHo6IGN1cnJlbnQueiArIG1vdmVtZW50LnosXG4gICAgfTtcbiAgICBpZiAodGhpcy5fX3JpZ2lkQm9keS5zZXROZXh0S2luZW1hdGljVHJhbnNsYXRpb24gPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgaW5qZWN0ZWQgUmFwaWVyIHJpZ2lkIGJvZHkgZG9lcyBub3Qgc3VwcG9ydCBraW5lbWF0aWMgdHJhbnNsYXRpb24uJyk7XG4gICAgfVxuICAgIHRoaXMuX19yaWdpZEJvZHkuc2V0TmV4dEtpbmVtYXRpY1RyYW5zbGF0aW9uKG5leHQpO1xuICB9XG5cbiAgcG9zdFN0ZXAoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLl9fZW5hYmxlZCB8fCB0aGlzLl9fZW50aXR5ID09IG51bGwgfHwgdGhpcy5fX3JpZ2lkQm9keSA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5fX3JpZ2lkQm9keS50cmFuc2xhdGlvbigpO1xuICAgIHRoaXMuX19lbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLnNldFBvc2l0aW9uV2l0aG91dFBoeXNpY3MoVmVjdG9yMy5mcm9tQ29weTMocG9zaXRpb24ueCwgcG9zaXRpb24ueSwgcG9zaXRpb24ueikpO1xuICAgIHRoaXMuX191cGRhdGVHcm91bmRDb250YWN0KHBvc2l0aW9uKTtcbiAgICB0aGlzLl9fdXBkYXRlTW90aW9uU3RhdGUoKTtcbiAgfVxuXG4gIGdldCBpc0dyb3VuZGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9faXNHcm91bmRlZDtcbiAgfVxuXG4gIGdldCBjb21wdXRlZE1vdmVtZW50KCk6IElWZWN0b3IzIHtcbiAgICByZXR1cm4gdGhpcy5fX2NvbXB1dGVkTW92ZW1lbnQ7XG4gIH1cblxuICBnZXQgZ3JvdW5kQ29udGFjdCgpOiBDaGFyYWN0ZXJHcm91bmRDb250YWN0IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fX2dyb3VuZENvbnRhY3Q7XG4gIH1cblxuICBnZXQgaXNSZWNvdmVyaW5nKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9faXNSZWNvdmVyaW5nO1xuICB9XG5cbiAgZ2V0IG1vdGlvblN0YXRlKCk6IENoYXJhY3Rlck1vdGlvblN0YXRlIHtcbiAgICByZXR1cm4gdGhpcy5fX21vdGlvblN0YXRlO1xuICB9XG5cbiAgc2V0IGVuYWJsZWQodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9fZW5hYmxlZCA9IHZhbHVlO1xuICAgIGlmICghdmFsdWUpIHtcbiAgICAgIHRoaXMuX19ncm91bmRDb250YWN0ID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fX3N0dWNrRnJhbWVDb3VudCA9IDA7XG4gICAgICB0aGlzLl9faXNSZWNvdmVyaW5nID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGVuYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX19lbmFibGVkO1xuICB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX3VucmVnaXN0ZXJTdGVwUGFydGljaXBhbnQodGhpcyk7XG4gICAgY29uc3QgZW5naW5lID0gdGhpcy5fX2VudGl0eT8uZW5naW5lO1xuICAgIFJhcGllclBoeXNpY3NTdHJhdGVneS5fdW5yZWdpc3RlckV4dGVybmFsQ29sbGlkZXIodGhpcy5fX2NvbGxpZGVyLCBlbmdpbmUpO1xuICAgIGNvbnN0IHdvcmxkID0gUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9nZXRXb3JsZChlbmdpbmUpO1xuICAgIGlmICh0aGlzLl9fY29udHJvbGxlciAhPSBudWxsKSB7XG4gICAgICB3b3JsZC5yZW1vdmVDaGFyYWN0ZXJDb250cm9sbGVyPy4odGhpcy5fX2NvbnRyb2xsZXIpO1xuICAgIH1cbiAgICBpZiAodGhpcy5fX3JpZ2lkQm9keSAhPSBudWxsKSB7XG4gICAgICB3b3JsZC5yZW1vdmVSaWdpZEJvZHk/Lih0aGlzLl9fcmlnaWRCb2R5KTtcbiAgICB9XG4gICAgdGhpcy5fX2NvbnRyb2xsZXIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fX2NvbGxpZGVyID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX19yaWdpZEJvZHkgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fX2VudGl0eSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fd29ybGRRdWVyeSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fZ3JvdW5kQ29udGFjdCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fc3R1Y2tGcmFtZUNvdW50ID0gMDtcbiAgICB0aGlzLl9faXNSZWNvdmVyaW5nID0gZmFsc2U7XG4gICAgdGhpcy5fX21vdGlvblN0YXRlID0gaW5pdGlhbE1vdGlvblN0YXRlO1xuICAgIHRoaXMuX19sYXN0U3RlcERlbHRhVGltZSA9IDA7XG4gICAgdGhpcy5fX3dhc0dyb3VuZGVkID0gZmFsc2U7XG4gICAgdGhpcy5fX2hhc0VzdGFibGlzaGVkR3JvdW5kaW5nID0gZmFsc2U7XG4gICAgdGhpcy5fX3N0YXRlVmVydGljYWxWZWxvY2l0eSA9IDA7XG4gICAgdGhpcy5fX2xhbmRpbmdJbXBhY3RTcGVlZCA9IDA7XG4gICAgdGhpcy5fX3NoYXBlSW5zdGFuY2UgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fX3dvcmxkU2NhbGUgPSBWZWN0b3IzLm9uZSgpO1xuICAgIHRoaXMuX19pc0dyb3VuZFByb2JlUmFkaXVzRGVyaXZlZCA9IHRydWU7XG4gICAgdGhpcy5fX3dhcm5lZE5vblVuaWZvcm1TY2FsZSA9IGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBfX3Jlc29sdmVDaGFyYWN0ZXJDYXBzdWxlKHNoYXBlSW5zdGFuY2U6IFNoYXBlSW5zdGFuY2UsIHdvcmxkU2NhbGU6IElWZWN0b3IzKTogUmVzb2x2ZWRDaGFyYWN0ZXJDYXBzdWxlIHtcbiAgICBpZiAoc2hhcGVJbnN0YW5jZS5zaGFwZS50eXBlICE9PSAnY2Fwc3VsZScpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUmFwaWVyQ2hhcmFjdGVyQ29udHJvbGxlclN0cmF0ZWd5IHJlcXVpcmVzIGEgY2Fwc3VsZSBTaGFwZUluc3RhbmNlLicpO1xuICAgIH1cbiAgICBjb25zdCBjYXBzdWxlID0gc2hhcGVJbnN0YW5jZS5zaGFwZTtcbiAgICBjb25zdCByZXNvbHZlZCA9IHJlc29sdmVTY2FsZWRDYXBzdWxlKFxuICAgICAgY2Fwc3VsZS5oZWlnaHQsXG4gICAgICBNYXRoLm1heChjYXBzdWxlLnJhZGl1c0JvdHRvbSwgY2Fwc3VsZS5yYWRpdXNUb3ApLFxuICAgICAgc2hhcGVJbnN0YW5jZS5sb2NhbFJvdGF0aW9uLFxuICAgICAgd29ybGRTY2FsZVxuICAgICk7XG4gICAgaWYgKHJlc29sdmVkLmFwcHJveGltYXRlZCAmJiAhdGhpcy5fX3dhcm5lZE5vblVuaWZvcm1TY2FsZSkge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQud2FybignUmFwaWVyIGNvbnNlcnZhdGl2ZWx5IGFwcHJveGltYXRlcyBub24tdW5pZm9ybSBzY2FsZSBmb3IgdGhlIGNoYXJhY3RlciBjYXBzdWxlLicpO1xuICAgICAgdGhpcy5fX3dhcm5lZE5vblVuaWZvcm1TY2FsZSA9IHRydWU7XG4gICAgfVxuICAgIGNvbnN0IGxvY2FsUG9zaXRpb24gPSBWZWN0b3IzLmZyb21Db3B5MyhcbiAgICAgIHNoYXBlSW5zdGFuY2UubG9jYWxQb3NpdGlvbi54ICogd29ybGRTY2FsZS54LFxuICAgICAgc2hhcGVJbnN0YW5jZS5sb2NhbFBvc2l0aW9uLnkgKiB3b3JsZFNjYWxlLnksXG4gICAgICBzaGFwZUluc3RhbmNlLmxvY2FsUG9zaXRpb24ueiAqIHdvcmxkU2NhbGUuelxuICAgICk7XG4gICAgY29uc3QgZG93bndhcmRFeHRlbnQgPSByZXNvbHZlZC5yb3RhdGlvbi50cmFuc2Zvcm1WZWN0b3IzKFxuICAgICAgVmVjdG9yMy5mcm9tQ29weTMoMCwgLShyZXNvbHZlZC5oYWxmSGVpZ2h0ICsgcmVzb2x2ZWQucmFkaXVzKSwgMClcbiAgICApO1xuICAgIHJldHVybiB7XG4gICAgICAuLi5yZXNvbHZlZCxcbiAgICAgIGxvY2FsUG9zaXRpb24sXG4gICAgICBib3R0b21PZmZzZXQ6IFZlY3RvcjMuYWRkKGxvY2FsUG9zaXRpb24sIGRvd253YXJkRXh0ZW50KSxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBfX2NyZWF0ZUNoYXJhY3RlckNvbGxpZGVyRGVzYyhyZXNvbHZlZDogUmVzb2x2ZWRDaGFyYWN0ZXJDYXBzdWxlKSB7XG4gICAgY29uc3QgcmFwaWVyID0gUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9nZXRSYXBpZXIoKTtcbiAgICBsZXQgY29sbGlkZXJEZXNjID0gcmFwaWVyLkNvbGxpZGVyRGVzYy5jYXBzdWxlIShyZXNvbHZlZC5oYWxmSGVpZ2h0LCByZXNvbHZlZC5yYWRpdXMpO1xuICAgIGNvbGxpZGVyRGVzYyA9XG4gICAgICBjb2xsaWRlckRlc2Muc2V0VHJhbnNsYXRpb24/LihyZXNvbHZlZC5sb2NhbFBvc2l0aW9uLngsIHJlc29sdmVkLmxvY2FsUG9zaXRpb24ueSwgcmVzb2x2ZWQubG9jYWxQb3NpdGlvbi56KSA/P1xuICAgICAgY29sbGlkZXJEZXNjO1xuICAgIGNvbGxpZGVyRGVzYyA9XG4gICAgICBjb2xsaWRlckRlc2Muc2V0Um90YXRpb24/Lih7XG4gICAgICAgIHg6IHJlc29sdmVkLnJvdGF0aW9uLngsXG4gICAgICAgIHk6IHJlc29sdmVkLnJvdGF0aW9uLnksXG4gICAgICAgIHo6IHJlc29sdmVkLnJvdGF0aW9uLnosXG4gICAgICAgIHc6IHJlc29sdmVkLnJvdGF0aW9uLncsXG4gICAgICB9KSA/PyBjb2xsaWRlckRlc2M7XG4gICAgcmV0dXJuIGNvbGxpZGVyRGVzYztcbiAgfVxuXG4gIHByaXZhdGUgX19zeW5jaHJvbml6ZVNjYWxlKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9fZW50aXR5ID09IG51bGwgfHwgdGhpcy5fX3JpZ2lkQm9keSA9PSBudWxsIHx8IHRoaXMuX19jb2xsaWRlciA9PSBudWxsIHx8IHRoaXMuX19zaGFwZUluc3RhbmNlID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc2NhbGUgPSB0aGlzLl9fZW50aXR5LmdldFNjZW5lR3JhcGgoKS5fZ2V0UGh5c2ljc1dvcmxkU2NhbGUoKTtcbiAgICBjb25zdCBhYnNvbHV0ZVNjYWxlID0gVmVjdG9yMy5mcm9tQ29weTMoTWF0aC5hYnMoc2NhbGUueCksIE1hdGguYWJzKHNjYWxlLnkpLCBNYXRoLmFicyhzY2FsZS56KSk7XG4gICAgY29uc3QgaGFzQ2hhbmdlZCA9XG4gICAgICBNYXRoLmFicyhzY2FsZS54IC0gdGhpcy5fX3dvcmxkU2NhbGUueCkgPiAwLjAwMDAwMSB8fFxuICAgICAgTWF0aC5hYnMoc2NhbGUueSAtIHRoaXMuX193b3JsZFNjYWxlLnkpID4gMC4wMDAwMDEgfHxcbiAgICAgIE1hdGguYWJzKHNjYWxlLnogLSB0aGlzLl9fd29ybGRTY2FsZS56KSA+IDAuMDAwMDAxO1xuICAgIGlmICghaGFzQ2hhbmdlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoXG4gICAgICAhW2Fic29sdXRlU2NhbGUueCwgYWJzb2x1dGVTY2FsZS55LCBhYnNvbHV0ZVNjYWxlLnpdLmV2ZXJ5KE51bWJlci5pc0Zpbml0ZSkgfHxcbiAgICAgIGFic29sdXRlU2NhbGUueCA8PSAwIHx8XG4gICAgICBhYnNvbHV0ZVNjYWxlLnkgPD0gMCB8fFxuICAgICAgYWJzb2x1dGVTY2FsZS56IDw9IDBcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2hhcmFjdGVyIGNvbnRyb2xsZXIgc2NhbGUgY29tcG9uZW50cyBtdXN0IHJlbWFpbiBmaW5pdGUgYW5kIG5vbi16ZXJvIGFmdGVyIHNldHVwLicpO1xuICAgIH1cblxuICAgIGNvbnN0IHdvcmxkID0gUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9nZXRXb3JsZCh0aGlzLl9fZW50aXR5LmVuZ2luZSk7XG4gICAgaWYgKHdvcmxkLnJlbW92ZVJpZ2lkQm9keSA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBpbmplY3RlZCBSYXBpZXIgd29ybGQgZG9lcyBub3Qgc3VwcG9ydCByZWJ1aWxkaW5nIGEgc2NhbGVkIGNoYXJhY3RlciBib2R5LicpO1xuICAgIH1cbiAgICBjb25zdCByZXNvbHZlZCA9IHRoaXMuX19yZXNvbHZlQ2hhcmFjdGVyQ2Fwc3VsZSh0aGlzLl9fc2hhcGVJbnN0YW5jZSwgc2NhbGUpO1xuICAgIGNvbnN0IGdyb3VuZFByb2JlUmFkaXVzID0gdGhpcy5fX2lzR3JvdW5kUHJvYmVSYWRpdXNEZXJpdmVkXG4gICAgICA/IHJlc29sdmVkLnJhZGl1cyAqIDAuOFxuICAgICAgOiB0aGlzLl9fb3B0aW9ucy5ncm91bmRQcm9iZVJhZGl1cztcbiAgICBpZiAoIU51bWJlci5pc0Zpbml0ZShncm91bmRQcm9iZVJhZGl1cykgfHwgZ3JvdW5kUHJvYmVSYWRpdXMgPD0gMCB8fCBncm91bmRQcm9iZVJhZGl1cyA+IHJlc29sdmVkLnJhZGl1cykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnQ2hhcmFjdGVyIGNvbnRyb2xsZXIgZ3JvdW5kUHJvYmVSYWRpdXMgbXVzdCBiZSBwb3NpdGl2ZSBhbmQgbm8gZ3JlYXRlciB0aGFuIHRoZSBzY2FsZWQgY2Fwc3VsZSByYWRpdXMuJ1xuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3QgY29sbGlkZXJEZXNjID0gdGhpcy5fX2NyZWF0ZUNoYXJhY3RlckNvbGxpZGVyRGVzYyhyZXNvbHZlZCk7XG4gICAgY29uc3QgcG9zaXRpb24gPSB0aGlzLl9fcmlnaWRCb2R5LnRyYW5zbGF0aW9uKCk7XG4gICAgY29uc3Qgcm90YXRpb24gPSB0aGlzLl9fcmlnaWRCb2R5LnJvdGF0aW9uKCk7XG4gICAgY29uc3QgcmlnaWRCb2R5RGVzYyA9IFJhcGllclBoeXNpY3NTdHJhdGVneS5fZ2V0UmFwaWVyKCkuUmlnaWRCb2R5RGVzYy5raW5lbWF0aWNQb3NpdGlvbkJhc2VkISgpXG4gICAgICAuc2V0VHJhbnNsYXRpb24ocG9zaXRpb24ueCwgcG9zaXRpb24ueSwgcG9zaXRpb24ueilcbiAgICAgIC5zZXRSb3RhdGlvbih7IHg6IHJvdGF0aW9uLngsIHk6IHJvdGF0aW9uLnksIHo6IHJvdGF0aW9uLnosIHc6IHJvdGF0aW9uLncgfSk7XG4gICAgY29uc3QgcHJldmlvdXNSaWdpZEJvZHkgPSB0aGlzLl9fcmlnaWRCb2R5O1xuICAgIGNvbnN0IHByZXZpb3VzQ29sbGlkZXIgPSB0aGlzLl9fY29sbGlkZXI7XG4gICAgY29uc3QgcmlnaWRCb2R5ID0gd29ybGQuY3JlYXRlUmlnaWRCb2R5KHJpZ2lkQm9keURlc2MpO1xuICAgIGxldCBjb2xsaWRlcjogUmFwaWVyQ29sbGlkZXJMaWtlO1xuICAgIHRyeSB7XG4gICAgICBjb2xsaWRlciA9IHdvcmxkLmNyZWF0ZUNvbGxpZGVyKGNvbGxpZGVyRGVzYywgcmlnaWRCb2R5KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgd29ybGQucmVtb3ZlUmlnaWRCb2R5KHJpZ2lkQm9keSk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG5cbiAgICBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX3JlZ2lzdGVyRXh0ZXJuYWxDb2xsaWRlcihjb2xsaWRlciwgdGhpcy5fX2VudGl0eSk7XG4gICAgUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll91bnJlZ2lzdGVyRXh0ZXJuYWxDb2xsaWRlcihwcmV2aW91c0NvbGxpZGVyLCB0aGlzLl9fZW50aXR5LmVuZ2luZSwgdHJ1ZSk7XG4gICAgd29ybGQucmVtb3ZlUmlnaWRCb2R5KHByZXZpb3VzUmlnaWRCb2R5KTtcbiAgICB0aGlzLl9fcmlnaWRCb2R5ID0gcmlnaWRCb2R5O1xuICAgIHRoaXMuX19jb2xsaWRlciA9IGNvbGxpZGVyO1xuICAgIHRoaXMuX19jYXBzdWxlQm90dG9tT2Zmc2V0ID0gcmVzb2x2ZWQuYm90dG9tT2Zmc2V0O1xuICAgIHRoaXMuX19vcHRpb25zLmdyb3VuZFByb2JlUmFkaXVzID0gZ3JvdW5kUHJvYmVSYWRpdXM7XG4gICAgdGhpcy5fX3dvcmxkU2NhbGUgPSBWZWN0b3IzLmZyb21Db3B5MyhzY2FsZS54LCBzY2FsZS55LCBzY2FsZS56KTtcbiAgfVxuXG4gIHByaXZhdGUgX19zeW5jaHJvbml6ZVBvc2l0aW9uKCk6IFJhcGllclZlY3RvcjNMaWtlIHtcbiAgICBjb25zdCByaWdpZEJvZHkgPSB0aGlzLl9fcmlnaWRCb2R5ITtcbiAgICBjb25zdCBjdXJyZW50ID0gcmlnaWRCb2R5LnRyYW5zbGF0aW9uKCk7XG4gICAgY29uc3Qgc2NlbmVHcmFwaFBvc2l0aW9uID0gdGhpcy5fX2VudGl0eSEuZ2V0U2NlbmVHcmFwaCgpLnBvc2l0aW9uO1xuICAgIGNvbnN0IGhhc0NoYW5nZWQgPVxuICAgICAgTWF0aC5hYnMoc2NlbmVHcmFwaFBvc2l0aW9uLnggLSBjdXJyZW50LngpID4gMC4wMDAwMDEgfHxcbiAgICAgIE1hdGguYWJzKHNjZW5lR3JhcGhQb3NpdGlvbi55IC0gY3VycmVudC55KSA+IDAuMDAwMDAxIHx8XG4gICAgICBNYXRoLmFicyhzY2VuZUdyYXBoUG9zaXRpb24ueiAtIGN1cnJlbnQueikgPiAwLjAwMDAwMTtcbiAgICBpZiAoIWhhc0NoYW5nZWQpIHtcbiAgICAgIHJldHVybiBjdXJyZW50O1xuICAgIH1cblxuICAgIGNvbnN0IHN5bmNocm9uaXplZCA9IHtcbiAgICAgIHg6IHNjZW5lR3JhcGhQb3NpdGlvbi54LFxuICAgICAgeTogc2NlbmVHcmFwaFBvc2l0aW9uLnksXG4gICAgICB6OiBzY2VuZUdyYXBoUG9zaXRpb24ueixcbiAgICB9O1xuICAgIHJpZ2lkQm9keS5zZXRUcmFuc2xhdGlvbihzeW5jaHJvbml6ZWQsIHRydWUpO1xuICAgIHJldHVybiBzeW5jaHJvbml6ZWQ7XG4gIH1cblxuICBwcml2YXRlIF9fdXBkYXRlTW90aW9uU3RhdGUoKTogdm9pZCB7XG4gICAgY29uc3QgZHQgPSB0aGlzLl9fbGFzdFN0ZXBEZWx0YVRpbWU7XG4gICAgY29uc3QgdmVsb2NpdHkgPVxuICAgICAgZHQgPiAwXG4gICAgICAgID8gVmVjdG9yMy5mcm9tQ29weTMoXG4gICAgICAgICAgICB0aGlzLl9fY29tcHV0ZWRNb3ZlbWVudC54IC8gZHQsXG4gICAgICAgICAgICB0aGlzLl9fY29tcHV0ZWRNb3ZlbWVudC55IC8gZHQsXG4gICAgICAgICAgICB0aGlzLl9fY29tcHV0ZWRNb3ZlbWVudC56IC8gZHRcbiAgICAgICAgICApXG4gICAgICAgIDogVmVjdG9yMy56ZXJvKCk7XG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLl9fcmVzb2x2ZU1vdmVtZW50U3RhdGUoKTtcbiAgICBjb25zdCBwcmV2aW91cyA9IHRoaXMuX19tb3Rpb25TdGF0ZTtcbiAgICBjb25zdCBpc0dyb3VuZGVkTm93ID0gdGhpcy5fX2lzR3JvdW5kZWQ7XG4gICAgdGhpcy5fX21vdGlvblN0YXRlID0ge1xuICAgICAgc3RhdGUsXG4gICAgICB2ZWxvY2l0eSxcbiAgICAgIGhvcml6b250YWxTcGVlZDogTWF0aC5oeXBvdCh2ZWxvY2l0eS54LCB2ZWxvY2l0eS56KSxcbiAgICAgIHZlcnRpY2FsU3BlZWQ6IHZlbG9jaXR5LnksXG4gICAgICBncm91bmRlZER1cmF0aW9uOiBpc0dyb3VuZGVkTm93ID8gcHJldmlvdXMuZ3JvdW5kZWREdXJhdGlvbiArIGR0IDogMCxcbiAgICAgIGFpcmJvcm5lRHVyYXRpb246IGlzR3JvdW5kZWROb3cgPyAwIDogcHJldmlvdXMuYWlyYm9ybmVEdXJhdGlvbiArIGR0LFxuICAgICAgc3RhdGVFbGFwc2VkVGltZTogc3RhdGUgPT09IHByZXZpb3VzLnN0YXRlID8gcHJldmlvdXMuc3RhdGVFbGFwc2VkVGltZSArIGR0IDogZHQsXG4gICAgICBsYW5kaW5nSW1wYWN0U3BlZWQ6IHRoaXMuX19sYW5kaW5nSW1wYWN0U3BlZWQsXG4gICAgICBncm91bmRDb250YWN0OiB0aGlzLl9fZ3JvdW5kQ29udGFjdCxcbiAgICB9O1xuICAgIHRoaXMuX193YXNHcm91bmRlZCA9IGlzR3JvdW5kZWROb3c7XG4gICAgaWYgKGlzR3JvdW5kZWROb3cpIHtcbiAgICAgIHRoaXMuX19oYXNFc3RhYmxpc2hlZEdyb3VuZGluZyA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfX3Jlc29sdmVNb3ZlbWVudFN0YXRlKCk6IENoYXJhY3Rlck1vdmVtZW50U3RhdGUge1xuICAgIGlmICh0aGlzLl9faXNSZWNvdmVyaW5nKSB7XG4gICAgICByZXR1cm4gJ3JlY292ZXJpbmcnO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuX19oYXNFc3RhYmxpc2hlZEdyb3VuZGluZyAmJiB0aGlzLl9faXNHcm91bmRlZCkge1xuICAgICAgcmV0dXJuICdncm91bmRlZCc7XG4gICAgfVxuICAgIGlmICghdGhpcy5fX3dhc0dyb3VuZGVkICYmIHRoaXMuX19pc0dyb3VuZGVkKSB7XG4gICAgICByZXR1cm4gJ2xhbmRpbmcnO1xuICAgIH1cbiAgICBpZiAodGhpcy5fX2lzR3JvdW5kZWQpIHtcbiAgICAgIHJldHVybiAnZ3JvdW5kZWQnO1xuICAgIH1cbiAgICBpZiAodGhpcy5fX2dyb3VuZENvbnRhY3QgIT0gbnVsbCAmJiAhdGhpcy5fX2dyb3VuZENvbnRhY3QuaXNXYWxrYWJsZSAmJiB0aGlzLl9fc3RhdGVWZXJ0aWNhbFZlbG9jaXR5IDw9IDApIHtcbiAgICAgIHJldHVybiAnc2xpZGluZyc7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9fc3RhdGVWZXJ0aWNhbFZlbG9jaXR5ID4gMC4wMDAwMDEgPyAncmlzaW5nJyA6ICdmYWxsaW5nJztcbiAgfVxuXG4gIHByaXZhdGUgX19nZXRDb2xsaXNpb25Ob3JtYWxzKCk6IFJhcGllclZlY3RvcjNMaWtlW10ge1xuICAgIGNvbnN0IGNvdW50ID0gdGhpcy5fX2NvbnRyb2xsZXI/Lm51bUNvbXB1dGVkQ29sbGlzaW9ucz8uKCkgPz8gMDtcbiAgICBjb25zdCBub3JtYWxzOiBSYXBpZXJWZWN0b3IzTGlrZVtdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCBjb2xsaXNpb24gPSB0aGlzLl9fY29udHJvbGxlcj8uY29tcHV0ZWRDb2xsaXNpb24/LihpKTtcbiAgICAgIGlmIChjb2xsaXNpb24gIT0gbnVsbCkge1xuICAgICAgICBub3JtYWxzLnB1c2goY29sbGlzaW9uLm5vcm1hbDEpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbm9ybWFscztcbiAgfVxuXG4gIHByaXZhdGUgX19jcmVhdGVOdWRnZU1vdmVtZW50KG1vdmVtZW50OiBSYXBpZXJWZWN0b3IzTGlrZSwgbm9ybWFsczogcmVhZG9ubHkgUmFwaWVyVmVjdG9yM0xpa2VbXSk6IFJhcGllclZlY3RvcjNMaWtlIHtcbiAgICBsZXQgeCA9IDA7XG4gICAgbGV0IHogPSAwO1xuICAgIGZvciAoY29uc3Qgbm9ybWFsIG9mIG5vcm1hbHMpIHtcbiAgICAgIHggKz0gbm9ybWFsLng7XG4gICAgICB6ICs9IG5vcm1hbC56O1xuICAgIH1cbiAgICBjb25zdCBsZW5ndGggPSBNYXRoLmh5cG90KHgsIHopO1xuICAgIGlmIChsZW5ndGggPD0gMC4wMDAwMDEpIHtcbiAgICAgIHJldHVybiBtb3ZlbWVudDtcbiAgICB9XG4gICAgY29uc3Qgc2NhbGUgPSB0aGlzLl9fb3B0aW9ucy5zdHVja1JlY292ZXJ5RGlzdGFuY2UgLyBsZW5ndGg7XG4gICAgcmV0dXJuIHsgeDogeCAqIHNjYWxlLCB5OiBNYXRoLm1pbihtb3ZlbWVudC55LCAwKSwgejogeiAqIHNjYWxlIH07XG4gIH1cblxuICBwcml2YXRlIF9fdXBkYXRlR3JvdW5kQ29udGFjdChwb3NpdGlvbjogUmFwaWVyVmVjdG9yM0xpa2UpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fX2VudGl0eSA9PSBudWxsKSB7XG4gICAgICB0aGlzLl9fZ3JvdW5kQ29udGFjdCA9IHVuZGVmaW5lZDtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgYm9keVJvdGF0aW9uID0gdGhpcy5fX3JpZ2lkQm9keT8ucm90YXRpb24oKTtcbiAgICBjb25zdCBjYXBzdWxlQm90dG9tT2Zmc2V0ID1cbiAgICAgIGJvZHlSb3RhdGlvbiA9PSBudWxsXG4gICAgICAgID8gdGhpcy5fX2NhcHN1bGVCb3R0b21PZmZzZXRcbiAgICAgICAgOiBRdWF0ZXJuaW9uLmZyb21Db3B5NChib2R5Um90YXRpb24ueCwgYm9keVJvdGF0aW9uLnksIGJvZHlSb3RhdGlvbi56LCBib2R5Um90YXRpb24udykudHJhbnNmb3JtVmVjdG9yMyhcbiAgICAgICAgICAgIHRoaXMuX19jYXBzdWxlQm90dG9tT2Zmc2V0XG4gICAgICAgICAgKTtcbiAgICBjb25zdCBjYXBzdWxlQm90dG9tID0gVmVjdG9yMy5hZGQoVmVjdG9yMy5mcm9tQ29weTMocG9zaXRpb24ueCwgcG9zaXRpb24ueSwgcG9zaXRpb24ueiksIGNhcHN1bGVCb3R0b21PZmZzZXQpO1xuICAgIGNvbnN0IHN0YXJ0ID0gVmVjdG9yMy5hZGQoXG4gICAgICBjYXBzdWxlQm90dG9tLFxuICAgICAgVmVjdG9yMy5mcm9tQ29weTMoMCwgdGhpcy5fX29wdGlvbnMuZ3JvdW5kUHJvYmVSYWRpdXMgKyB0aGlzLl9fb3B0aW9ucy5ncm91bmRQcm9iZVN0YXJ0T2Zmc2V0LCAwKVxuICAgICk7XG4gICAgY29uc3QgaGl0ID0gdGhpcy5fX3dvcmxkUXVlcnk/LmNhc3RTcGhlcmUoXG4gICAgICBzdGFydCxcbiAgICAgIHRoaXMuX19vcHRpb25zLmdyb3VuZFByb2JlUmFkaXVzLFxuICAgICAgVmVjdG9yMy5mcm9tQ29weTMoMCwgLTEsIDApLFxuICAgICAgdGhpcy5fX29wdGlvbnMuZ3JvdW5kUHJvYmVEaXN0YW5jZSxcbiAgICAgIHtcbiAgICAgICAgaW5jbHVkZVNlbnNvcnM6IGZhbHNlLFxuICAgICAgICBjb2xsaXNpb25Hcm91cDogdGhpcy5fX29wdGlvbnMuZ3JvdW5kQ29sbGlzaW9uR3JvdXAsXG4gICAgICAgIGNvbGxpc2lvbk1hc2s6IHRoaXMuX19vcHRpb25zLmdyb3VuZENvbGxpc2lvbk1hc2ssXG4gICAgICAgIGV4Y2x1ZGVFbnRpdGllczogW3RoaXMuX19lbnRpdHldLFxuICAgICAgfVxuICAgICk7XG4gICAgaWYgKGhpdCA9PSBudWxsIHx8IGhpdC5ub3JtYWwueSA8PSAwKSB7XG4gICAgICB0aGlzLl9fZ3JvdW5kQ29udGFjdCA9IHVuZGVmaW5lZDtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgbm9ybWFsID0gVmVjdG9yMy5ub3JtYWxpemUoaGl0Lm5vcm1hbCk7XG4gICAgY29uc3Qgc2xvcGVBbmdsZSA9IE1hdGguYWNvcyhNYXRoLm1pbigxLCBNYXRoLm1heCgtMSwgbm9ybWFsLnkpKSk7XG4gICAgdGhpcy5fX2dyb3VuZENvbnRhY3QgPSB7XG4gICAgICBlbnRpdHk6IGhpdC5lbnRpdHksXG4gICAgICBiaW5kaW5nSWQ6IGhpdC5iaW5kaW5nSWQsXG4gICAgICBwb3NpdGlvbjogaGl0LnBvc2l0aW9uLFxuICAgICAgbm9ybWFsLFxuICAgICAgZGlzdGFuY2U6IGhpdC5kaXN0YW5jZSxcbiAgICAgIHNsb3BlQW5nbGUsXG4gICAgICBpc1dhbGthYmxlOiBzbG9wZUFuZ2xlIDw9IHRoaXMuX19vcHRpb25zLm1heFNsb3BlQ2xpbWJBbmdsZSxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBfX3ZhbGlkYXRlT3B0aW9ucyhvcHRpb25zOiBSZXNvbHZlZE9wdGlvbnMpOiB2b2lkIHtcbiAgICBjb25zdCBwb3NpdGl2ZVZhbHVlcyA9IFtcbiAgICAgIG9wdGlvbnMuY29udGFjdE9mZnNldCxcbiAgICAgIG9wdGlvbnMubWF4U3RlcEhlaWdodCxcbiAgICAgIG9wdGlvbnMubWluU3RlcFdpZHRoLFxuICAgICAgb3B0aW9ucy5zbmFwVG9Hcm91bmREaXN0YW5jZSxcbiAgICAgIG9wdGlvbnMuZ3Jhdml0eSxcbiAgICAgIG9wdGlvbnMuanVtcFNwZWVkLFxuICAgICAgb3B0aW9ucy5tYXhEZWx0YVRpbWUsXG4gICAgICBvcHRpb25zLmdyb3VuZFByb2JlRGlzdGFuY2UsXG4gICAgICBvcHRpb25zLm5vcm1hbE51ZGdlRmFjdG9yLFxuICAgICAgb3B0aW9ucy5zdHVja1JlY292ZXJ5RGlzdGFuY2UsXG4gICAgXTtcbiAgICBpZiAocG9zaXRpdmVWYWx1ZXMuc29tZSh2YWx1ZSA9PiAhTnVtYmVyLmlzRmluaXRlKHZhbHVlKSB8fCB2YWx1ZSA8PSAwKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDaGFyYWN0ZXIgY29udHJvbGxlciBkaW1lbnNpb25zIGFuZCBtb3ZlbWVudCBzZXR0aW5ncyBtdXN0IGJlIGZpbml0ZSBwb3NpdGl2ZSB2YWx1ZXMuJyk7XG4gICAgfVxuICAgIGlmICghTnVtYmVyLmlzRmluaXRlKG9wdGlvbnMubWF4U2xvcGVDbGltYkFuZ2xlKSB8fCAhTnVtYmVyLmlzRmluaXRlKG9wdGlvbnMubWluU2xvcGVTbGlkZUFuZ2xlKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDaGFyYWN0ZXIgY29udHJvbGxlciBzbG9wZSBhbmdsZXMgbXVzdCBiZSBmaW5pdGUgdmFsdWVzLicpO1xuICAgIH1cbiAgICBpZiAoIU51bWJlci5pc0Zpbml0ZShvcHRpb25zLmdyb3VuZFByb2JlU3RhcnRPZmZzZXQpIHx8IG9wdGlvbnMuZ3JvdW5kUHJvYmVTdGFydE9mZnNldCA8IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2hhcmFjdGVyIGNvbnRyb2xsZXIgZ3JvdW5kUHJvYmVTdGFydE9mZnNldCBtdXN0IGJlIGEgZmluaXRlIG5vbi1uZWdhdGl2ZSB2YWx1ZS4nKTtcbiAgICB9XG4gICAgUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9wYWNrQ29sbGlzaW9uR3JvdXBzKG9wdGlvbnMuZ3JvdW5kQ29sbGlzaW9uR3JvdXAsIG9wdGlvbnMuZ3JvdW5kQ29sbGlzaW9uTWFzayk7XG4gICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKG9wdGlvbnMuc3R1Y2tSZWNvdmVyeUZyYW1lQ291bnQpIHx8IG9wdGlvbnMuc3R1Y2tSZWNvdmVyeUZyYW1lQ291bnQgPD0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDaGFyYWN0ZXIgY29udHJvbGxlciBzdHVja1JlY292ZXJ5RnJhbWVDb3VudCBtdXN0IGJlIGEgcG9zaXRpdmUgaW50ZWdlci4nKTtcbiAgICB9XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFFQSxTQUF3QixtQkFBbUIsZ0JBQWdCLFlBQVksZUFBZTtBQUN0RixTQUFTLGNBQWM7QUFRdkIsU0FBUyx5QkFBeUI7QUFDbEMsU0FBUyw0QkFBNEI7QUFDckM7QUFBQSxFQUdFO0FBQUEsT0FJSztBQUNQLFNBQVMsdUNBQXVDO0FBUWhELElBQU0saUJBQWtDO0FBQUEsRUFDdEMsZUFBZTtBQUFBLEVBQ2YsZUFBZTtBQUFBLEVBQ2YsY0FBYztBQUFBLEVBQ2Qsb0JBQW9CLEtBQUssS0FBSztBQUFBLEVBQzlCLG9CQUFxQixLQUFLLEtBQUssS0FBTTtBQUFBLEVBQ3JDLHNCQUFzQjtBQUFBLEVBQ3RCLFNBQVM7QUFBQSxFQUNULFdBQVc7QUFBQSxFQUNYLGNBQWMsSUFBSTtBQUFBLEVBQ2xCLDhCQUE4QjtBQUFBLEVBQzlCLHFCQUFxQjtBQUFBLEVBQ3JCLHdCQUF3QjtBQUFBLEVBQ3hCLHNCQUFzQjtBQUFBLEVBQ3RCLHFCQUFxQjtBQUFBLEVBQ3JCLG1CQUFtQjtBQUFBLEVBQ25CLG1CQUFtQjtBQUFBLEVBQ25CLHNCQUFzQjtBQUFBLEVBQ3RCLHlCQUF5QjtBQUFBLEVBQ3pCLHVCQUF1QjtBQUN6QjtBQUVBLElBQU0scUJBQTJDO0FBQUEsRUFDL0MsT0FBTztBQUFBLEVBQ1AsVUFBVSxRQUFRLEtBQUs7QUFBQSxFQUN2QixpQkFBaUI7QUFBQSxFQUNqQixlQUFlO0FBQUEsRUFDZixrQkFBa0I7QUFBQSxFQUNsQixrQkFBa0I7QUFBQSxFQUNsQixrQkFBa0I7QUFBQSxFQUNsQixvQkFBb0I7QUFDdEI7QUFHTyxJQUFNLG9DQUFOLE1BQXNHO0FBQUEsRUFB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QkFBdUIsS0FBSyxRQUFRLDJCQUEyQixHQUFHO0FBQzlGLFlBQU0sSUFBSSxNQUFNLDBFQUEwRTtBQUFBLElBQzVGO0FBQUEsRUFDRjtBQUNGOyIsCiAgIm5hbWVzIjogWyJfX29wdGlvbnMiLCAiX19kZXNpcmVkSG9yaXpvbnRhbFZlbG9jaXR5IiwgIl9fY29tcHV0ZWRNb3ZlbWVudCIsICJfX3ZlcnRpY2FsVmVsb2NpdHkiLCAiX19pc0dyb3VuZGVkIiwgIl9fanVtcFJlcXVlc3RlZCIsICJfX2VuYWJsZWQiLCAiX19jYXBzdWxlQm90dG9tT2Zmc2V0IiwgIl9fc3R1Y2tGcmFtZUNvdW50IiwgIl9faXNSZWNvdmVyaW5nIiwgIl9fbW90aW9uU3RhdGUiLCAiX19sYXN0U3RlcERlbHRhVGltZSIsICJfX3dhc0dyb3VuZGVkIiwgIl9faGFzRXN0YWJsaXNoZWRHcm91bmRpbmciLCAiX19zdGF0ZVZlcnRpY2FsVmVsb2NpdHkiLCAiX19sYW5kaW5nSW1wYWN0U3BlZWQiLCAiX193b3JsZFNjYWxlIiwgIl9faXNHcm91bmRQcm9iZVJhZGl1c0Rlcml2ZWQiLCAiX193YXJuZWROb25Vbmlmb3JtU2NhbGUiLCAiX190bXBXb3JsZFJvdGF0aW9uIiwgIl9fcmlnaWRCb2R5IiwgIl9fdmFsaWRhdGVPcHRpb25zIiwgIl9fcmVzb2x2ZUNoYXJhY3RlckNhcHN1bGUiLCAiX19jcmVhdGVDaGFyYWN0ZXJDb2xsaWRlckRlc2MiLCAiX19lbnRpdHkiLCAiX193b3JsZFF1ZXJ5IiwgIl9fY29sbGlkZXIiLCAiX19jb250cm9sbGVyIiwgIl9fc2hhcGVJbnN0YW5jZSIsICJfX2dyb3VuZENvbnRhY3QiLCAiX19zeW5jaHJvbml6ZVNjYWxlIiwgIl9fc3luY2hyb25pemVQb3NpdGlvbiIsICJfX2dldENvbGxpc2lvbk5vcm1hbHMiLCAiX19jcmVhdGVOdWRnZU1vdmVtZW50IiwgIl9fdXBkYXRlR3JvdW5kQ29udGFjdCIsICJfX3VwZGF0ZU1vdGlvblN0YXRlIiwgIl9fcmVzb2x2ZU1vdmVtZW50U3RhdGUiXQp9Cg==
