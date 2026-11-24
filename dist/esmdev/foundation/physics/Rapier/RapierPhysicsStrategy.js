// src/foundation/physics/Rapier/RapierPhysicsStrategy.ts
import { PhysicsComponent } from "../../components/Physics/PhysicsComponent.js";
import { TriggerComponent } from "../../components/Trigger/TriggerComponent.js";
import { PhysicsShape } from "../../definitions/PhysicsShapeType.js";
import {
  Matrix44,
  MutableQuaternion,
  MutableVector3,
  Quaternion,
  Vector3
} from "../../math/index.js";
import { Logger } from "../../misc/Logger.js";
import { _setPhysicsBackend } from "../PhysicsBackend.js";
import { resolveScaledBox, resolveScaledCapsule, resolveScaledCylinder } from "../ShapeTransformResolver.js";
var _RapierPhysicsStrategy = class _RapierPhysicsStrategy {
  constructor() {
    this.Ev = [];
    this.Iv = Vector3.one();
    this.Ov = Vector3.zero();
    this.Yv = Quaternion.identity();
    this.Dv = Vector3.one();
    this.Jv = Vector3.one();
    this.Sv = false;
    this.nv = false;
    this.Tv = false;
    /** Reusable quaternion for world-rotation lookups (avoids per-frame allocations) */
    this.rv = MutableQuaternion.identity();
    /** Reusable Euler angles for rotation conversions (avoids per-frame allocations) */
    this.iw = MutableVector3.zero();
    /** Reusable Euler angles stored in the cached physics property */
    this.jw = MutableVector3.zero();
    /** Reusable vectors for converting motion velocities */
    this.kw = MutableVector3.zero();
    this.lw = MutableVector3.zero();
    /** Reusable temporaries for the per-frame physics sync */
    this.mw = MutableVector3.zero();
    this.nw = MutableQuaternion.identity();
    _RapierPhysicsStrategy.Vv();
  }
  /**
   * Injects Rapier.js bindings. Physics worlds are created lazily per Engine.
   * @param rapierModule - Rapier module or compat module default export
   * @param worldProperty - Optional world settings
   */
  static async initialize(rapierModule, worldProperty = _RapierPhysicsStrategy.Kv) {
    var _a;
    const rapier = (_a = rapierModule.default) != null ? _a : rapierModule;
    if (rapier.init != null) {
      await rapier.init();
    }
    _RapierPhysicsStrategy.Uv(_RapierPhysicsStrategy.Lv);
    for (const state of _RapierPhysicsStrategy.Cv.values()) {
      _RapierPhysicsStrategy.Uv(state);
    }
    _RapierPhysicsStrategy.Nv = rapier;
    _RapierPhysicsStrategy.Kv = worldProperty;
    _RapierPhysicsStrategy.Lv = void 0;
    _RapierPhysicsStrategy.Cv.clear();
    _RapierPhysicsStrategy.Hv.clear();
    _setPhysicsBackend(_RapierPhysicsStrategy.ow);
  }
  /**
   * Returns true when Rapier bindings have already been injected.
   */
  static get isInitialized() {
    return _RapierPhysicsStrategy.Nv != null;
  }
  /**
   * Sets up a Rapier rigid body and collider for the given entity.
   * @param prop - Physics properties defining shape and material values
   * @param entity - Scene graph entity associated with the physics body
   */
  setShape(prop, entity, worldScale = Vector3.one()) {
    const preservedState = this.Wv();
    this.Pv(true);
    this.te = void 0;
    this.ue = void 0;
    this.Ov = Vector3.zero();
    this.Yv = Quaternion.identity();
    this.Jv = Vector3.one();
    this.Zv(prop, entity, worldScale, preservedState);
  }
  setShapeInstance(shape, body, collider, entity, worldScale = Vector3.one(), motion) {
    this.setShapeInstances([{ shape, body, collider }], entity, worldScale, motion);
  }
  setShapeInstances(bindings, entity, worldScale = Vector3.one(), motion) {
    var _a;
    if (bindings.length === 0) {
      this.clearShapeInstances();
      return;
    }
    const resolvedMotion = motion != null ? motion : {
      move: bindings[0].body.move,
      isKinematic: bindings[0].body.isKinematic
    };
    const move = resolvedMotion.move;
    const isKinematic = (_a = resolvedMotion.isKinematic) != null ? _a : false;
    if (bindings.some((binding) => binding.body.move !== move)) {
      throw new Error("All Rapier colliders on one rigid body must use the same body.move value.");
    }
    if (bindings.some((binding) => {
      var _a2;
      return ((_a2 = binding.body.isKinematic) != null ? _a2 : false) !== isKinematic;
    })) {
      throw new Error("All Rapier colliders on one rigid body must use the same body.isKinematic value.");
    }
    if (!move && isKinematic) {
      throw new Error("A kinematic Rapier body must have body.move enabled.");
    }
    const hasDynamicParameters = resolvedMotion.mass != null || resolvedMotion.centerOfMass != null || resolvedMotion.inertiaDiagonal != null || resolvedMotion.inertiaOrientation != null || resolvedMotion.linearVelocity != null || resolvedMotion.angularVelocity != null || resolvedMotion.gravityFactor != null;
    if ((!move || isKinematic) && hasDynamicParameters) {
      Logger.default.warn(
        `Rapier ignores mass properties, initial velocity, and gravityFactor on ${isKinematic ? "kinematic" : "fixed"} bodies.`
      );
    }
    if (isKinematic && _RapierPhysicsStrategy.Fv().RigidBodyDesc.kinematicPositionBased == null) {
      throw new Error("The injected Rapier module does not support position-based kinematic bodies.");
    }
    const scale = Vector3.fromCopy3(Math.abs(worldScale.x), Math.abs(worldScale.y), Math.abs(worldScale.z));
    for (const binding of bindings) {
      _RapierPhysicsStrategy.pw(binding.shape, scale);
    }
    const preservedState = this.Wv();
    this.te = bindings.map((binding) => ({
      bindingId: binding.bindingId,
      shape: binding.shape,
      body: { ...binding.body },
      collider: { ...binding.collider }
    }));
    this.ue = _RapierPhysicsStrategy.xe(resolvedMotion);
    this.Dv = Vector3.fromCopy3(Math.abs(worldScale.x), Math.abs(worldScale.y), Math.abs(worldScale.z));
    this.Jv = Vector3.fromCopy3(worldScale.x, worldScale.y, worldScale.z);
    this.Sv = false;
    this.nv = false;
    this.Tv = false;
    const first = bindings[0];
    const size = first.shape.shape.type === "box" ? first.shape.shape.size : Vector3.one();
    const willRebuild = scale.x > 0 && scale.y > 0 && scale.z > 0;
    this.Pv(willRebuild);
    this.Zv(
      {
        type: first.shape.shape.type === "box" ? PhysicsShape.Box : PhysicsShape.Sphere,
        size,
        position: entity.getSceneGraph().position,
        rotation: entity.getSceneGraph().getQuaternionRecursivelyTo(this.rv).toEulerAnglesTo(this.iw),
        move: resolvedMotion.move,
        density: first.body.density,
        friction: first.collider.friction,
        restitution: first.collider.restitution
      },
      entity,
      worldScale,
      preservedState
    );
  }
  clearShapeInstances() {
    this.Pv();
    this.te = void 0;
    this.ue = void 0;
    this.Bv = void 0;
  }
  Zv(prop, entity, worldScale, preservedState) {
    this.Vu = entity;
    this.Iv = Vector3.fromCopy3(prop.size.x, prop.size.y, prop.size.z);
    this.Bv = {
      type: prop.type,
      size: Vector3.fromCopy3(prop.size.x, prop.size.y, prop.size.z),
      position: Vector3.fromCopy3(prop.position.x, prop.position.y, prop.position.z),
      rotation: Vector3.fromCopy3(prop.rotation.x, prop.rotation.y, prop.rotation.z),
      move: prop.move,
      density: prop.density,
      friction: prop.friction,
      restitution: prop.restitution
    };
    if (this.te != null && (this.Dv.x === 0 || this.Dv.y === 0 || this.Dv.z === 0)) {
      return;
    }
    const scaledSize = this._v(worldScale);
    if (this.$v(this.Bv, scaledSize)) {
      this.aw(
        this.Bv,
        scaledSize,
        this.Bv.position,
        _RapierPhysicsStrategy.Qv(this.Bv.rotation),
        preservedState
      );
    }
  }
  /**
   * Updates the associated entity transform from the Rapier body state.
   */
  update(_config) {
    if (this.Vu == null || this.Uu == null) {
      return;
    }
    const pos = this.Uu.translation();
    const rot = this.Uu.rotation();
    this.Vu.getSceneGraph().setPositionWithoutPhysics(this.mw.setComponents(pos.x, pos.y, pos.z));
    this.Vu.getSceneGraph().setRotationWithoutPhysics(this.nw.setComponents(rot.x, rot.y, rot.z, rot.w));
  }
  /**
   * Sets the Rapier body world position.
   * @param worldPosition - New world position
   */
  setPosition(worldPosition) {
    if (this.Bv != null) {
      this.Bv.position = Vector3.fromCopy3(worldPosition.x, worldPosition.y, worldPosition.z);
    }
    if (this.Uu == null) {
      return;
    }
    if (this.Mv()) {
      if (this.Uu.setNextKinematicTranslation == null) {
        throw new Error("The injected Rapier rigid body does not support next kinematic translation.");
      }
      this.Uu.setNextKinematicTranslation({ x: worldPosition.x, y: worldPosition.y, z: worldPosition.z });
      return;
    }
    this.Uu.setTranslation({ x: worldPosition.x, y: worldPosition.y, z: worldPosition.z }, true);
  }
  /**
   * Sets the Rapier body world rotation.
   * @param worldRotation - New world rotation
   */
  setRotation(worldRotation) {
    if (this.Bv != null) {
      this.Bv.rotation = worldRotation.toEulerAnglesTo(this.jw);
    }
    if (this.Uu == null) {
      return;
    }
    const rotation = _RapierPhysicsStrategy.Rv(worldRotation);
    if (this.Mv()) {
      if (this.Uu.setNextKinematicRotation == null) {
        throw new Error("The injected Rapier rigid body does not support next kinematic rotation.");
      }
      this.Uu.setNextKinematicRotation(rotation);
      return;
    }
    this.Uu.setRotation(rotation, true);
  }
  /**
   * Sets the Rapier body world rotation from Euler angles.
   * @param eulerAngles - Euler angles in radians
   */
  setEulerAngle(eulerAngles) {
    this.setRotation(_RapierPhysicsStrategy.Qv(eulerAngles));
  }
  /**
   * Recreates the Rapier body with a scaled collider shape.
   * @param worldScale - World scale
   */
  setScale(worldScale) {
    var _a, _b, _c, _d;
    if (this.Bv == null) {
      return;
    }
    const isKinematic = this.Mv();
    const position = (_b = (_a = this.Uu) == null ? void 0 : _a.translation()) != null ? _b : this.Bv.position;
    const rotation = (_d = (_c = this.Uu) == null ? void 0 : _c.rotation()) != null ? _d : _RapierPhysicsStrategy.Qv(this.Bv.rotation);
    const nextKinematicPosition = isKinematic ? Vector3.fromCopy3(this.Bv.position.x, this.Bv.position.y, this.Bv.position.z) : void 0;
    const nextKinematicRotation = isKinematic ? _RapierPhysicsStrategy.Qv(this.Bv.rotation) : void 0;
    const preservedState = this.Wv();
    this.Dv = Vector3.fromCopy3(Math.abs(worldScale.x), Math.abs(worldScale.y), Math.abs(worldScale.z));
    this.Jv = Vector3.fromCopy3(worldScale.x, worldScale.y, worldScale.z);
    const scaledSize = this._v(worldScale);
    const willRebuild = this.te != null ? this.Dv.x > 0 && this.Dv.y > 0 && this.Dv.z > 0 : this.$v(this.Bv, scaledSize);
    this.Pv(willRebuild);
    if (!willRebuild) {
      return;
    }
    this.aw(
      this.Bv,
      scaledSize,
      Vector3.fromCopy3(position.x, position.y, position.z),
      Quaternion.fromCopy4(rotation.x, rotation.y, rotation.z, rotation.w),
      preservedState
    );
    if (nextKinematicPosition != null && nextKinematicRotation != null) {
      this.setPosition(nextKinematicPosition);
      this.setRotation(nextKinematicRotation);
    }
  }
  _v(worldScale) {
    return Vector3.fromCopy3(
      this.Iv.x * Math.abs(worldScale.x),
      this.Iv.y * Math.abs(worldScale.y),
      this.Iv.z * Math.abs(worldScale.z)
    );
  }
  $v(prop, size) {
    if (prop.type === PhysicsShape.Sphere) {
      return Number.isFinite(size.x) && size.x > 0;
    }
    return Number.isFinite(size.x) && Number.isFinite(size.y) && Number.isFinite(size.z) && size.x > 0 && size.y > 0 && size.z > 0;
  }
  /** Advances one Engine's Rapier world, or every initialized Engine world when omitted. */
  static update(frameId, deltaTime = 1 / 60, engine) {
    if (!_RapierPhysicsStrategy.isInitialized) {
      return;
    }
    const states = engine != null ? [_RapierPhysicsStrategy.Gv(engine)] : _RapierPhysicsStrategy.Cv.size > 0 ? [..._RapierPhysicsStrategy.Cv.values()] : [_RapierPhysicsStrategy.Gv()];
    const safeDeltaTime = Number.isFinite(deltaTime) ? Math.max(deltaTime, 0) : _RapierPhysicsStrategy.gw;
    const timestep = Math.min(safeDeltaTime, _RapierPhysicsStrategy.hw);
    for (const state of states) {
      if (frameId != null && state.lastFrameId === frameId) {
        continue;
      }
      state.lastFrameId = frameId;
      state.world.timestep = timestep;
      for (const [participant, participantEngine] of _RapierPhysicsStrategy.Hv) {
        if (participantEngine === state.engine) {
          participant.preStep(timestep);
        }
      }
      TriggerComponent._beginPhysicsStep(state.engine);
      state.world.step(state.eventQueue);
      _RapierPhysicsStrategy.qw(state);
      TriggerComponent._finalizeRebuiltOverlaps(state.engine);
      for (const [participant, participantEngine] of _RapierPhysicsStrategy.Hv) {
        if (participantEngine === state.engine) {
          participant.postStep();
        }
      }
      TriggerComponent._publishStayEvents(state.engine);
    }
  }
  /** @internal Registers colliders created outside PhysicsComponent, such as a character controller. */
  static _registerExternalCollider(collider, entity) {
    if (collider.handle != null) {
      this.Gv(entity.engine).colliderMetadata.set(collider.handle, { entity, isSensor: false });
    }
  }
  /** @internal */
  static _unregisterExternalCollider(collider, engine, isRebuilding = false) {
    if ((collider == null ? void 0 : collider.handle) != null) {
      this.bw(this.Gv(engine), collider.handle, isRebuilding);
    }
  }
  static bw(state, handle, isRebuilding = false) {
    const metadata = state.colliderMetadata.get(handle);
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
    state.colliderMetadata.delete(handle);
  }
  static qw(state) {
    var _a;
    (_a = state.eventQueue) == null ? void 0 : _a.drainCollisionEvents((handle1, handle2, started) => {
      const first = state.colliderMetadata.get(handle1);
      const second = state.colliderMetadata.get(handle2);
      if (first == null || second == null) {
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
  static _registerStepParticipant(participant, engine) {
    _RapierPhysicsStrategy.Hv.set(participant, engine);
  }
  /** @internal */
  static _unregisterStepParticipant(participant) {
    _RapierPhysicsStrategy.Hv.delete(participant);
  }
  /** @internal Releases the Rapier world owned by a destroyed Engine. */
  static _cleanupForEngine(engine) {
    _RapierPhysicsStrategy.Uv(_RapierPhysicsStrategy.Cv.get(engine));
    _RapierPhysicsStrategy.Cv.delete(engine);
    for (const [participant, participantEngine] of _RapierPhysicsStrategy.Hv) {
      if (participantEngine === engine) {
        _RapierPhysicsStrategy.Hv.delete(participant);
      }
    }
  }
  /** @internal */
  static _getRapier() {
    return _RapierPhysicsStrategy.Fv();
  }
  /** @internal */
  static _getWorld(engine) {
    return _RapierPhysicsStrategy.rw(engine);
  }
  /** @internal */
  static _getColliderMetadata(collider, engine) {
    return collider.handle == null ? void 0 : _RapierPhysicsStrategy.Gv(engine).colliderMetadata.get(collider.handle);
  }
  /** @internal */
  static _packCollisionGroups(group, mask) {
    return _RapierPhysicsStrategy.cw(group, mask);
  }
  aw(prop, size, position, rotation, preservedState) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    const rapier = _RapierPhysicsStrategy.Fv();
    const state = _RapierPhysicsStrategy.Gv((_a = this.Vu) == null ? void 0 : _a.engine);
    const world = state.world;
    const motion = this.ue;
    const isKinematic = this.Mv();
    const rigidBodyDesc = isKinematic ? rapier.RigidBodyDesc.kinematicPositionBased() : prop.move ? rapier.RigidBodyDesc.dynamic() : rapier.RigidBodyDesc.fixed();
    rigidBodyDesc.setTranslation(position.x, position.y, position.z).setRotation(_RapierPhysicsStrategy.Rv(rotation));
    if (prop.move && !isKinematic) {
      const velocityRotation = (_c = (_b = this.Vu) == null ? void 0 : _b.getSceneGraph().getQuaternionRecursivelyTo(this.rv)) != null ? _c : rotation;
      const linearVelocity = (_d = preservedState == null ? void 0 : preservedState.linearVelocity) != null ? _d : (motion == null ? void 0 : motion.linearVelocity) == null ? void 0 : velocityRotation.transformVector3To(motion.linearVelocity, this.kw);
      const angularVelocity = (_e = preservedState == null ? void 0 : preservedState.angularVelocity) != null ? _e : (motion == null ? void 0 : motion.angularVelocity) == null ? void 0 : velocityRotation.transformVector3To(motion.angularVelocity, this.lw);
      if (linearVelocity != null) {
        (_f = rigidBodyDesc.setLinvel) == null ? void 0 : _f.call(rigidBodyDesc, linearVelocity.x, linearVelocity.y, linearVelocity.z);
      }
      if (angularVelocity != null) {
        (_g = rigidBodyDesc.setAngvel) == null ? void 0 : _g.call(rigidBodyDesc, { x: angularVelocity.x, y: angularVelocity.y, z: angularVelocity.z });
      }
      if ((motion == null ? void 0 : motion.gravityFactor) != null) {
        (_h = rigidBodyDesc.setGravityScale) == null ? void 0 : _h.call(rigidBodyDesc, motion.gravityFactor);
      }
    }
    this.Uu = world.createRigidBody(rigidBodyDesc);
    if (this.te != null) {
      for (const binding of this.te) {
        const colliderDesc = this.sw(binding, state.eventQueue != null);
        const collider = world.createCollider(colliderDesc, this.Uu);
        this.Ev.push(collider);
        if (collider.handle != null && this.Vu != null) {
          state.colliderMetadata.set(collider.handle, {
            entity: this.Vu,
            bindingId: binding.bindingId,
            isSensor: (_i = binding.collider.isSensor) != null ? _i : false
          });
        }
      }
      this.tw(prop.move, isKinematic);
    } else {
      const collider = world.createCollider(this.uw(prop, size), this.Uu);
      this.Ev.push(collider);
      if (collider.handle != null && this.Vu != null) {
        state.colliderMetadata.set(collider.handle, {
          entity: this.Vu,
          isSensor: false
        });
      }
    }
  }
  Mv() {
    var _a, _b, _c, _d, _e;
    return (_e = (_d = (_a = this.ue) == null ? void 0 : _a.isKinematic) != null ? _d : (_c = (_b = this.te) == null ? void 0 : _b[0]) == null ? void 0 : _c.body.isKinematic) != null ? _e : false;
  }
  Wv() {
    var _a, _b, _c, _d, _e;
    if (this.Uu == null || !((_a = this.Bv) == null ? void 0 : _a.move) || this.Mv()) {
      return void 0;
    }
    const linearVelocity = (_c = (_b = this.Uu).linvel) == null ? void 0 : _c.call(_b);
    const angularVelocity = (_e = (_d = this.Uu).angvel) == null ? void 0 : _e.call(_d);
    if (linearVelocity == null || angularVelocity == null) {
      return void 0;
    }
    return {
      linearVelocity: { x: linearVelocity.x, y: linearVelocity.y, z: linearVelocity.z },
      angularVelocity: { x: angularVelocity.x, y: angularVelocity.y, z: angularVelocity.z }
    };
  }
  tw(move, isKinematic) {
    var _a, _b, _c, _d, _e;
    const motion = this.ue;
    const rigidBody = this.Uu;
    if (motion == null || rigidBody == null || !move || isKinematic) {
      return;
    }
    const hasOnlySensorColliders = ((_a = this.te) == null ? void 0 : _a.every((binding) => binding.collider.isSensor === true)) === true;
    const derivesSensorOnlyMass = hasOnlySensorColliders && motion.mass == null;
    const needsCompleteMassProperties = derivesSensorOnlyMass || motion.mass === 0 || hasOnlySensorColliders && motion.mass != null && motion.mass > 0 || motion.centerOfMass != null || motion.inertiaDiagonal != null || motion.inertiaOrientation != null;
    if (!needsCompleteMassProperties) {
      return;
    }
    if (rigidBody.mass == null || rigidBody.localCom == null || rigidBody.principalInertia == null || rigidBody.principalInertiaLocalFrame == null || rigidBody.recomputeMassPropertiesFromColliders == null || rigidBody.setAdditionalMassProperties == null || this.Ev.some((collider) => collider.setDensity == null)) {
      throw new Error("The injected Rapier module does not support complete rigid-body mass properties.");
    }
    if (derivesSensorOnlyMass) {
      for (let i = 0; i < this.Ev.length; i++) {
        this.Ev[i].setDensity(this.te[i].body.density);
      }
    }
    rigidBody.recomputeMassPropertiesFromColliders();
    const automaticMass = rigidBody.mass();
    const automaticCenterOfMass = rigidBody.localCom();
    const automaticInertia = rigidBody.principalInertia();
    const automaticInertiaOrientation = rigidBody.principalInertiaLocalFrame();
    for (const collider of this.Ev) {
      collider.setDensity(0);
    }
    rigidBody.recomputeMassPropertiesFromColliders();
    const centerOfMass = (_b = motion.centerOfMass) != null ? _b : automaticCenterOfMass;
    const inertia = (_c = motion.inertiaDiagonal) != null ? _c : automaticInertia;
    const inertiaOrientation = (_d = motion.inertiaOrientation) != null ? _d : automaticInertiaOrientation;
    rigidBody.setAdditionalMassProperties(
      (_e = motion.mass) != null ? _e : automaticMass,
      { x: centerOfMass.x, y: centerOfMass.y, z: centerOfMass.z },
      { x: inertia.x, y: inertia.y, z: inertia.z },
      {
        x: inertiaOrientation.x,
        y: inertiaOrientation.y,
        z: inertiaOrientation.z,
        w: inertiaOrientation.w
      },
      false
    );
  }
  uw(prop, size) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    const rapier = _RapierPhysicsStrategy.Fv();
    let colliderDesc;
    if (prop.type === PhysicsShape.Box) {
      colliderDesc = rapier.ColliderDesc.cuboid(size.x * 0.5, size.y * 0.5, size.z * 0.5);
    } else if (prop.type === PhysicsShape.Sphere) {
      colliderDesc = rapier.ColliderDesc.ball(size.x);
    } else {
      throw new Error(`Unsupported Rapier physics shape: ${prop.type.str}`);
    }
    colliderDesc = (_b = (_a = colliderDesc.setDensity) == null ? void 0 : _a.call(colliderDesc, prop.density)) != null ? _b : colliderDesc;
    colliderDesc = (_d = (_c = colliderDesc.setFriction) == null ? void 0 : _c.call(colliderDesc, prop.friction)) != null ? _d : colliderDesc;
    colliderDesc = (_f = (_e = colliderDesc.setRestitution) == null ? void 0 : _e.call(colliderDesc, prop.restitution)) != null ? _f : colliderDesc;
    colliderDesc = (_h = (_g = colliderDesc.setTranslation) == null ? void 0 : _g.call(
      colliderDesc,
      this.Ov.x * Math.abs(size.x / this.Iv.x),
      this.Ov.y * Math.abs(size.y / this.Iv.y),
      this.Ov.z * Math.abs(size.z / this.Iv.z)
    )) != null ? _h : colliderDesc;
    colliderDesc = (_j = (_i = colliderDesc.setRotation) == null ? void 0 : _i.call(colliderDesc, _RapierPhysicsStrategy.Rv(this.Yv))) != null ? _j : colliderDesc;
    return colliderDesc;
  }
  sw(binding, hasEventQueue) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
    const rapier = _RapierPhysicsStrategy.Fv();
    const shapeInstance = binding.shape;
    const shape = shapeInstance.shape;
    const scale = this.Jv;
    const absoluteScale = this.Dv;
    let colliderDesc;
    let colliderRotation = shapeInstance.localRotation;
    if (shape.type === "box") {
      const resolvedBox = this.dw(shapeInstance);
      colliderDesc = rapier.ColliderDesc.cuboid(
        resolvedBox.halfExtents.x,
        resolvedBox.halfExtents.y,
        resolvedBox.halfExtents.z
      );
      colliderRotation = resolvedBox.rotation;
    } else if (shape.type === "sphere") {
      const radialScale = Math.max(absoluteScale.x, absoluteScale.y, absoluteScale.z);
      this.Xv(shape.type, absoluteScale);
      colliderDesc = rapier.ColliderDesc.ball(shape.radius * radialScale);
    } else if (shape.type === "cylinder") {
      if (rapier.ColliderDesc.cylinder == null) {
        throw new Error("The injected Rapier module does not support cylinder colliders.");
      }
      const radius = this.ew(shape.radiusBottom, shape.radiusTop, shape.type);
      const resolvedCylinder = resolveScaledCylinder(shape.height, radius, shapeInstance.localRotation, scale);
      if (resolvedCylinder.approximated) {
        this.Xv(shape.type, absoluteScale);
      }
      colliderDesc = rapier.ColliderDesc.cylinder(resolvedCylinder.halfHeight, resolvedCylinder.radius);
      colliderRotation = resolvedCylinder.rotation;
    } else {
      if (rapier.ColliderDesc.capsule == null) {
        throw new Error("The injected Rapier module does not support capsule colliders.");
      }
      const radius = this.ew(shape.radiusBottom, shape.radiusTop, shape.type);
      const resolvedCapsule = resolveScaledCapsule(shape.height, radius, shapeInstance.localRotation, scale);
      if (resolvedCapsule.approximated) {
        this.Xv(shape.type, absoluteScale);
      }
      colliderDesc = rapier.ColliderDesc.capsule(resolvedCapsule.halfHeight, resolvedCapsule.radius);
      colliderRotation = resolvedCapsule.rotation;
    }
    const explicitMass = ((_a = this.ue) == null ? void 0 : _a.move) && !this.ue.isKinematic ? this.ue.mass : void 0;
    const density = binding.collider.isSensor ? 0 : explicitMass != null && explicitMass > 0 ? explicitMass / this.te.reduce(
      (sum, item) => item.collider.isSensor ? sum : sum + this.vw(item),
      0
    ) : binding.body.density;
    colliderDesc = (_c = (_b = colliderDesc.setDensity) == null ? void 0 : _b.call(colliderDesc, density)) != null ? _c : colliderDesc;
    colliderDesc = (_e = (_d = colliderDesc.setFriction) == null ? void 0 : _d.call(colliderDesc, binding.collider.friction)) != null ? _e : colliderDesc;
    colliderDesc = (_g = (_f = colliderDesc.setRestitution) == null ? void 0 : _f.call(colliderDesc, binding.collider.restitution)) != null ? _g : colliderDesc;
    colliderDesc = (_k = (_j = colliderDesc.setCollisionGroups) == null ? void 0 : _j.call(
      colliderDesc,
      _RapierPhysicsStrategy.cw(
        (_h = binding.collider.collisionGroup) != null ? _h : 65535,
        (_i = binding.collider.collisionMask) != null ? _i : 65535
      )
    )) != null ? _k : colliderDesc;
    if (binding.collider.isSensor) {
      const activeEvents = (_l = _RapierPhysicsStrategy.Fv().ActiveEvents) == null ? void 0 : _l.COLLISION_EVENTS;
      const activeCollisionTypes = (_m = _RapierPhysicsStrategy.Fv().ActiveCollisionTypes) == null ? void 0 : _m.ALL;
      if (colliderDesc.setSensor == null || colliderDesc.setActiveEvents == null || activeEvents == null || colliderDesc.setActiveCollisionTypes == null || activeCollisionTypes == null || !hasEventQueue) {
        throw new Error("The injected Rapier module does not support sensor collision events.");
      }
      colliderDesc = colliderDesc.setSensor(true);
      colliderDesc = colliderDesc.setActiveEvents(activeEvents);
      colliderDesc = colliderDesc.setActiveCollisionTypes(activeCollisionTypes);
    }
    colliderDesc = (_o = (_n = colliderDesc.setTranslation) == null ? void 0 : _n.call(
      colliderDesc,
      shapeInstance.localPosition.x * scale.x,
      shapeInstance.localPosition.y * scale.y,
      shapeInstance.localPosition.z * scale.z
    )) != null ? _o : colliderDesc;
    colliderDesc = (_q = (_p = colliderDesc.setRotation) == null ? void 0 : _p.call(colliderDesc, _RapierPhysicsStrategy.Rv(colliderRotation))) != null ? _q : colliderDesc;
    return colliderDesc;
  }
  static cw(group, mask) {
    if (!Number.isInteger(group) || group < 0 || group > 65535) {
      throw new Error(`Rapier collisionGroup must be a 16-bit unsigned integer: ${group}`);
    }
    if (!Number.isInteger(mask) || mask < 0 || mask > 65535) {
      throw new Error(`Rapier collisionMask must be a 16-bit unsigned integer: ${mask}`);
    }
    return (group << 16 | mask) >>> 0;
  }
  vw(binding) {
    const shape = binding.shape.shape;
    const scale = this.Jv;
    const absoluteScale = this.Dv;
    if (shape.type === "box") {
      const halfExtents = this.dw(binding.shape).halfExtents;
      return 8 * halfExtents.x * halfExtents.y * halfExtents.z;
    }
    if (shape.type === "sphere") {
      const radius = shape.radius * Math.max(absoluteScale.x, absoluteScale.y, absoluteScale.z);
      return 4 / 3 * Math.PI * radius ** 3;
    }
    if (shape.type === "cylinder") {
      const resolved2 = resolveScaledCylinder(
        shape.height,
        Math.max(shape.radiusBottom, shape.radiusTop),
        binding.shape.localRotation,
        scale
      );
      return Math.PI * resolved2.radius ** 2 * resolved2.halfHeight * 2;
    }
    const resolved = resolveScaledCapsule(
      shape.height,
      Math.max(shape.radiusBottom, shape.radiusTop),
      binding.shape.localRotation,
      scale
    );
    return Math.PI * resolved.radius ** 2 * resolved.halfHeight * 2 + 4 / 3 * Math.PI * resolved.radius ** 3;
  }
  dw(shapeInstance) {
    if (shapeInstance.shape.type !== "box") {
      throw new Error("A box ShapeInstance is required.");
    }
    const resolved = resolveScaledBox(
      shapeInstance.shape.size,
      shapeInstance.localRotation,
      this.Jv
    );
    if (resolved.approximated && !this.Tv) {
      Logger.default.warn(
        "Rapier conservatively approximates a locally rotated box under non-uniform scale with an axis-aligned box."
      );
      this.Tv = true;
    }
    return resolved;
  }
  static xe(motion) {
    return {
      ...motion,
      linearVelocity: motion.linearVelocity == null ? void 0 : Vector3.fromCopy3(motion.linearVelocity.x, motion.linearVelocity.y, motion.linearVelocity.z),
      angularVelocity: motion.angularVelocity == null ? void 0 : Vector3.fromCopy3(motion.angularVelocity.x, motion.angularVelocity.y, motion.angularVelocity.z),
      centerOfMass: motion.centerOfMass == null ? void 0 : Vector3.fromCopy3(motion.centerOfMass.x, motion.centerOfMass.y, motion.centerOfMass.z),
      inertiaDiagonal: motion.inertiaDiagonal == null ? void 0 : Vector3.fromCopy3(motion.inertiaDiagonal.x, motion.inertiaDiagonal.y, motion.inertiaDiagonal.z),
      inertiaOrientation: motion.inertiaOrientation == null ? void 0 : Quaternion.fromCopyQuaternion(motion.inertiaOrientation)
    };
  }
  ew(radiusBottom, radiusTop, shapeType) {
    if (radiusBottom !== radiusTop && !this.Sv) {
      Logger.default.warn(
        `Rapier approximates asymmetric ${shapeType} radii (${radiusBottom}, ${radiusTop}) with the maximum radius.`
      );
      this.Sv = true;
    }
    return Math.max(radiusBottom, radiusTop);
  }
  Xv(shapeType, scale) {
    if (!this.nv && (Math.abs(scale.x - scale.y) > 1e-6 || Math.abs(scale.y - scale.z) > 1e-6)) {
      Logger.default.warn(`Rapier conservatively approximates non-uniform scale for ${shapeType} shapes.`);
      this.nv = true;
    }
  }
  Pv(isRebuilding = false) {
    var _a;
    if (this.Uu == null) {
      return;
    }
    const state = _RapierPhysicsStrategy.Gv((_a = this.Vu) == null ? void 0 : _a.engine);
    const world = state.world;
    if (world.removeRigidBody == null) {
      throw new Error("The injected Rapier world does not support removeRigidBody.");
    }
    for (const collider of this.Ev) {
      if (collider.handle != null) {
        _RapierPhysicsStrategy.bw(state, collider.handle, isRebuilding);
      }
    }
    world.removeRigidBody(this.Uu);
    this.Uu = void 0;
    this.Ev.length = 0;
  }
  static pw(shapeInstance, scale) {
    if (scale.x === 0 || scale.y === 0 || scale.z === 0) {
      return;
    }
    const shape = shapeInstance.shape;
    const rapier = _RapierPhysicsStrategy.Fv();
    if (shape.type === "cylinder" && rapier.ColliderDesc.cylinder == null) {
      throw new Error("The injected Rapier module does not support cylinder colliders.");
    }
    if (shape.type === "capsule" && rapier.ColliderDesc.capsule == null) {
      throw new Error("The injected Rapier module does not support capsule colliders.");
    }
  }
  static Vv() {
    if (!_RapierPhysicsStrategy.isInitialized) {
      throw new Error("RapierPhysicsStrategy.initialize(RAPIER) must be called before use.");
    }
  }
  static Fv() {
    _RapierPhysicsStrategy.Vv();
    return _RapierPhysicsStrategy.Nv;
  }
  static rw(engine) {
    return _RapierPhysicsStrategy.Gv(engine).world;
  }
  static Gv(engine) {
    _RapierPhysicsStrategy.Vv();
    if (engine != null) {
      let state = _RapierPhysicsStrategy.Cv.get(engine);
      if (state == null) {
        state = _RapierPhysicsStrategy.fw(engine);
        _RapierPhysicsStrategy.Cv.set(engine, state);
      }
      return state;
    }
    if (_RapierPhysicsStrategy.Cv.size === 1) {
      return _RapierPhysicsStrategy.Cv.values().next().value;
    }
    if (_RapierPhysicsStrategy.Cv.size > 1) {
      throw new Error("An Engine must be specified when more than one Rapier physics world exists.");
    }
    if (_RapierPhysicsStrategy.Lv == null) {
      _RapierPhysicsStrategy.Lv = _RapierPhysicsStrategy.fw();
    }
    return _RapierPhysicsStrategy.Lv;
  }
  static fw(engine) {
    const rapier = _RapierPhysicsStrategy.Nv;
    return {
      engine,
      world: new rapier.World({
        x: _RapierPhysicsStrategy.Kv.gravity.x,
        y: _RapierPhysicsStrategy.Kv.gravity.y,
        z: _RapierPhysicsStrategy.Kv.gravity.z
      }),
      eventQueue: rapier.EventQueue == null ? void 0 : new rapier.EventQueue(true),
      colliderMetadata: /* @__PURE__ */ new Map()
    };
  }
  static Uv(state) {
    var _a, _b, _c, _d;
    (_b = (_a = state == null ? void 0 : state.eventQueue) == null ? void 0 : _a.free) == null ? void 0 : _b.call(_a);
    (_d = state == null ? void 0 : (_c = state.world).free) == null ? void 0 : _d.call(_c);
  }
  static Qv(eulerAngles) {
    return Quaternion.fromMatrix(Matrix44.rotateXYZ(eulerAngles.x, eulerAngles.y, eulerAngles.z));
  }
  static Rv(quaternion) {
    return {
      x: quaternion.x,
      y: quaternion.y,
      z: quaternion.z,
      w: quaternion.w
    };
  }
};
_RapierPhysicsStrategy.gw = 1 / 60;
_RapierPhysicsStrategy.hw = 1 / 15;
_RapierPhysicsStrategy.Kv = {
  gravity: Vector3.fromCopy3(0, -9.8, 0),
  random: true
};
_RapierPhysicsStrategy.Cv = /* @__PURE__ */ new Map();
_RapierPhysicsStrategy.Hv = /* @__PURE__ */ new Map();
/**
 * The backend through which engine-side code reaches Rapier once it is initialized
 * (see {@link PhysicsBackend}).
 */
_RapierPhysicsStrategy.ow = {
  update: (frameId, deltaTime, engine) => _RapierPhysicsStrategy.update(frameId, deltaTime, engine),
  cleanupForEngine: (engine) => _RapierPhysicsStrategy._cleanupForEngine(engine),
  bindShapePhysics: (entity, shapeComponent, options) => {
    const physicsEntity = entity.engine.entityRepository.addComponentToEntity(PhysicsComponent, entity);
    const physicsComponent = physicsEntity.getPhysics();
    physicsComponent.setStrategy(new _RapierPhysicsStrategy());
    physicsComponent.bindShape({
      shapeComponent,
      body: { move: options.move, density: options.density },
      collider: { friction: options.friction, restitution: options.restitution }
    });
    return physicsEntity;
  }
};
var RapierPhysicsStrategy = _RapierPhysicsStrategy;
export {
  RapierPhysicsStrategy
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vcGh5c2ljcy9SYXBpZXIvUmFwaWVyUGh5c2ljc1N0cmF0ZWd5LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBQaHlzaWNzQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9QaHlzaWNzL1BoeXNpY3NDb21wb25lbnQnO1xuaW1wb3J0IHR5cGUgeyBTaGFwZUNvbXBvbmVudCB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvU2hhcGUvU2hhcGVDb21wb25lbnQnO1xuaW1wb3J0IHsgVHJpZ2dlckNvbXBvbmVudCB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvVHJpZ2dlci9UcmlnZ2VyQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgQ29uZmlnIH0gZnJvbSAnLi4vLi4vY29yZS9Db25maWcnO1xuaW1wb3J0IHsgUGh5c2ljc1NoYXBlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvUGh5c2ljc1NoYXBlVHlwZSc7XG5pbXBvcnQgdHlwZSB7IFNoYXBlSW5zdGFuY2UgfSBmcm9tICcuLi8uLi9nZW9tZXRyeS9TaGFwZSc7XG5pbXBvcnQgdHlwZSB7IElTY2VuZUdyYXBoRW50aXR5IH0gZnJvbSAnLi4vLi4vaGVscGVycyc7XG5pbXBvcnQge1xuICB0eXBlIElRdWF0ZXJuaW9uLFxuICB0eXBlIElWZWN0b3IzLFxuICBNYXRyaXg0NCxcbiAgTXV0YWJsZVF1YXRlcm5pb24sXG4gIE11dGFibGVWZWN0b3IzLFxuICBRdWF0ZXJuaW9uLFxuICBWZWN0b3IzLFxufSBmcm9tICcuLi8uLi9tYXRoJztcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4uLy4uL21pc2MvTG9nZ2VyJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vLi4vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgeyBfc2V0UGh5c2ljc0JhY2tlbmQsIHR5cGUgUGh5c2ljc0JhY2tlbmQsIHR5cGUgU2hhcGVQaHlzaWNzT3B0aW9ucyB9IGZyb20gJy4uL1BoeXNpY3NCYWNrZW5kJztcbmltcG9ydCB0eXBlIHtcbiAgUGh5c2ljc0JvZHlQcm9wZXJ0eSxcbiAgUGh5c2ljc0NvbGxpZGVyUHJvcGVydHksXG4gIFBoeXNpY3NNb3Rpb25Qcm9wZXJ0eSxcbiAgUGh5c2ljc1Byb3BlcnR5SW5uZXIsXG59IGZyb20gJy4uL1BoeXNpY3NQcm9wZXJ0eSc7XG5pbXBvcnQgdHlwZSB7IFBoeXNpY3NTaGFwZUluc3RhbmNlQmluZGluZywgUGh5c2ljc1N0cmF0ZWd5IH0gZnJvbSAnLi4vUGh5c2ljc1N0cmF0ZWd5JztcbmltcG9ydCB0eXBlIHsgUGh5c2ljc1dvcmxkUHJvcGVydHkgfSBmcm9tICcuLi9QaHlzaWNzV29ybGRQcm9wZXJ0eSc7XG5pbXBvcnQgeyByZXNvbHZlU2NhbGVkQm94LCByZXNvbHZlU2NhbGVkQ2Fwc3VsZSwgcmVzb2x2ZVNjYWxlZEN5bGluZGVyIH0gZnJvbSAnLi4vU2hhcGVUcmFuc2Zvcm1SZXNvbHZlcic7XG5cbmV4cG9ydCB0eXBlIFJhcGllclZlY3RvcjNMaWtlID0ge1xuICB4OiBudW1iZXI7XG4gIHk6IG51bWJlcjtcbiAgejogbnVtYmVyO1xufTtcblxuZXhwb3J0IHR5cGUgUmFwaWVyUXVhdGVybmlvbkxpa2UgPSB7XG4gIHg6IG51bWJlcjtcbiAgeTogbnVtYmVyO1xuICB6OiBudW1iZXI7XG4gIHc6IG51bWJlcjtcbn07XG5cbmV4cG9ydCB0eXBlIFJhcGllclJpZ2lkQm9keURlc2NMaWtlID0ge1xuICBzZXRUcmFuc2xhdGlvbih4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyKTogUmFwaWVyUmlnaWRCb2R5RGVzY0xpa2U7XG4gIHNldFJvdGF0aW9uKHJvdGF0aW9uOiBSYXBpZXJRdWF0ZXJuaW9uTGlrZSk6IFJhcGllclJpZ2lkQm9keURlc2NMaWtlO1xuICBzZXRMaW52ZWw/KHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIpOiBSYXBpZXJSaWdpZEJvZHlEZXNjTGlrZTtcbiAgc2V0QW5ndmVsPyh2ZWxvY2l0eTogUmFwaWVyVmVjdG9yM0xpa2UpOiBSYXBpZXJSaWdpZEJvZHlEZXNjTGlrZTtcbiAgc2V0R3Jhdml0eVNjYWxlPyhmYWN0b3I6IG51bWJlcik6IFJhcGllclJpZ2lkQm9keURlc2NMaWtlO1xufTtcblxuZXhwb3J0IHR5cGUgUmFwaWVyQ29sbGlkZXJEZXNjTGlrZSA9IHtcbiAgc2V0VHJhbnNsYXRpb24/KHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIpOiBSYXBpZXJDb2xsaWRlckRlc2NMaWtlO1xuICBzZXRSb3RhdGlvbj8ocm90YXRpb246IFJhcGllclF1YXRlcm5pb25MaWtlKTogUmFwaWVyQ29sbGlkZXJEZXNjTGlrZTtcbiAgc2V0RGVuc2l0eT8oZGVuc2l0eTogbnVtYmVyKTogUmFwaWVyQ29sbGlkZXJEZXNjTGlrZTtcbiAgc2V0RnJpY3Rpb24/KGZyaWN0aW9uOiBudW1iZXIpOiBSYXBpZXJDb2xsaWRlckRlc2NMaWtlO1xuICBzZXRSZXN0aXR1dGlvbj8ocmVzdGl0dXRpb246IG51bWJlcik6IFJhcGllckNvbGxpZGVyRGVzY0xpa2U7XG4gIHNldENvbGxpc2lvbkdyb3Vwcz8oZ3JvdXBzOiBudW1iZXIpOiBSYXBpZXJDb2xsaWRlckRlc2NMaWtlO1xuICBzZXRTZW5zb3I/KHNlbnNvcjogYm9vbGVhbik6IFJhcGllckNvbGxpZGVyRGVzY0xpa2U7XG4gIHNldEFjdGl2ZUV2ZW50cz8oZXZlbnRzOiBudW1iZXIpOiBSYXBpZXJDb2xsaWRlckRlc2NMaWtlO1xuICBzZXRBY3RpdmVDb2xsaXNpb25UeXBlcz8odHlwZXM6IG51bWJlcik6IFJhcGllckNvbGxpZGVyRGVzY0xpa2U7XG59O1xuXG5leHBvcnQgdHlwZSBSYXBpZXJSaWdpZEJvZHlMaWtlID0ge1xuICB0cmFuc2xhdGlvbigpOiBSYXBpZXJWZWN0b3IzTGlrZTtcbiAgcm90YXRpb24oKTogUmFwaWVyUXVhdGVybmlvbkxpa2U7XG4gIGxpbnZlbD8oKTogUmFwaWVyVmVjdG9yM0xpa2U7XG4gIGFuZ3ZlbD8oKTogUmFwaWVyVmVjdG9yM0xpa2U7XG4gIHNldFRyYW5zbGF0aW9uKHRyYW5zbGF0aW9uOiBSYXBpZXJWZWN0b3IzTGlrZSwgd2FrZVVwOiBib29sZWFuKTogdm9pZDtcbiAgc2V0Um90YXRpb24ocm90YXRpb246IFJhcGllclF1YXRlcm5pb25MaWtlLCB3YWtlVXA6IGJvb2xlYW4pOiB2b2lkO1xuICBzZXROZXh0S2luZW1hdGljVHJhbnNsYXRpb24/KHRyYW5zbGF0aW9uOiBSYXBpZXJWZWN0b3IzTGlrZSk6IHZvaWQ7XG4gIHNldE5leHRLaW5lbWF0aWNSb3RhdGlvbj8ocm90YXRpb246IFJhcGllclF1YXRlcm5pb25MaWtlKTogdm9pZDtcbiAgbWFzcz8oKTogbnVtYmVyO1xuICBsb2NhbENvbT8oKTogUmFwaWVyVmVjdG9yM0xpa2U7XG4gIHByaW5jaXBhbEluZXJ0aWE/KCk6IFJhcGllclZlY3RvcjNMaWtlO1xuICBwcmluY2lwYWxJbmVydGlhTG9jYWxGcmFtZT8oKTogUmFwaWVyUXVhdGVybmlvbkxpa2U7XG4gIHJlY29tcHV0ZU1hc3NQcm9wZXJ0aWVzRnJvbUNvbGxpZGVycz8oKTogdm9pZDtcbiAgc2V0QWRkaXRpb25hbE1hc3NQcm9wZXJ0aWVzPyhcbiAgICBtYXNzOiBudW1iZXIsXG4gICAgY2VudGVyT2ZNYXNzOiBSYXBpZXJWZWN0b3IzTGlrZSxcbiAgICBwcmluY2lwYWxBbmd1bGFySW5lcnRpYTogUmFwaWVyVmVjdG9yM0xpa2UsXG4gICAgYW5ndWxhckluZXJ0aWFMb2NhbEZyYW1lOiBSYXBpZXJRdWF0ZXJuaW9uTGlrZSxcbiAgICB3YWtlVXA6IGJvb2xlYW5cbiAgKTogdm9pZDtcbn07XG5cbmV4cG9ydCB0eXBlIFJhcGllckNvbGxpZGVyTGlrZSA9IHtcbiAgaGFuZGxlPzogbnVtYmVyO1xuICBpc1NlbnNvcj8oKTogYm9vbGVhbjtcbiAgc2V0RGVuc2l0eT8oZGVuc2l0eTogbnVtYmVyKTogdm9pZDtcbn07XG5cbmV4cG9ydCB0eXBlIFJhcGllclJheUludGVyc2VjdGlvbkxpa2UgPSB7XG4gIGNvbGxpZGVyOiBSYXBpZXJDb2xsaWRlckxpa2U7XG4gIHRpbWVPZkltcGFjdDogbnVtYmVyO1xuICBub3JtYWw6IFJhcGllclZlY3RvcjNMaWtlO1xufTtcblxuZXhwb3J0IHR5cGUgUmFwaWVyU2hhcGVDYXN0SGl0TGlrZSA9IHtcbiAgY29sbGlkZXI6IFJhcGllckNvbGxpZGVyTGlrZTtcbiAgdGltZV9vZl9pbXBhY3Q6IG51bWJlcjtcbiAgbm9ybWFsMTogUmFwaWVyVmVjdG9yM0xpa2U7XG4gIHdpdG5lc3MxOiBSYXBpZXJWZWN0b3IzTGlrZTtcbiAgbm9ybWFsMjogUmFwaWVyVmVjdG9yM0xpa2U7XG4gIHdpdG5lc3MyOiBSYXBpZXJWZWN0b3IzTGlrZTtcbn07XG5cbmV4cG9ydCB0eXBlIFJhcGllckNvbGxpZGVyTWV0YWRhdGEgPSB7XG4gIGVudGl0eTogSVNjZW5lR3JhcGhFbnRpdHk7XG4gIGJpbmRpbmdJZD86IG51bWJlcjtcbiAgaXNTZW5zb3I6IGJvb2xlYW47XG59O1xuXG50eXBlIFByZXNlcnZlZER5bmFtaWNCb2R5U3RhdGUgPSB7XG4gIGxpbmVhclZlbG9jaXR5OiBSYXBpZXJWZWN0b3IzTGlrZTtcbiAgYW5ndWxhclZlbG9jaXR5OiBSYXBpZXJWZWN0b3IzTGlrZTtcbn07XG5cbmV4cG9ydCB0eXBlIFJhcGllckNoYXJhY3RlckNvbnRyb2xsZXJMaWtlID0ge1xuICBlbmFibGVBdXRvc3RlcChtYXhIZWlnaHQ6IG51bWJlciwgbWluV2lkdGg6IG51bWJlciwgaW5jbHVkZUR5bmFtaWNCb2RpZXM6IGJvb2xlYW4pOiB2b2lkO1xuICBlbmFibGVTbmFwVG9Hcm91bmQoZGlzdGFuY2U6IG51bWJlcik6IHZvaWQ7XG4gIHNldE1heFNsb3BlQ2xpbWJBbmdsZShhbmdsZTogbnVtYmVyKTogdm9pZDtcbiAgc2V0TWluU2xvcGVTbGlkZUFuZ2xlKGFuZ2xlOiBudW1iZXIpOiB2b2lkO1xuICBzZXRBcHBseUltcHVsc2VzVG9EeW5hbWljQm9kaWVzKGVuYWJsZWQ6IGJvb2xlYW4pOiB2b2lkO1xuICBzZXROb3JtYWxOdWRnZUZhY3Rvcj8odmFsdWU6IG51bWJlcik6IHZvaWQ7XG4gIGNvbXB1dGVDb2xsaWRlck1vdmVtZW50KFxuICAgIGNvbGxpZGVyOiBSYXBpZXJDb2xsaWRlckxpa2UsXG4gICAgZGVzaXJlZFRyYW5zbGF0aW9uRGVsdGE6IFJhcGllclZlY3RvcjNMaWtlLFxuICAgIGZpbHRlckZsYWdzPzogbnVtYmVyLFxuICAgIGZpbHRlckdyb3Vwcz86IG51bWJlcixcbiAgICBmaWx0ZXJQcmVkaWNhdGU/OiAoY29sbGlkZXI6IFJhcGllckNvbGxpZGVyTGlrZSkgPT4gYm9vbGVhblxuICApOiB2b2lkO1xuICBjb21wdXRlZE1vdmVtZW50KCk6IFJhcGllclZlY3RvcjNMaWtlO1xuICBjb21wdXRlZEdyb3VuZGVkKCk6IGJvb2xlYW47XG4gIG51bUNvbXB1dGVkQ29sbGlzaW9ucz8oKTogbnVtYmVyO1xuICBjb21wdXRlZENvbGxpc2lvbj8oaW5kZXg6IG51bWJlcik6IFJhcGllckNoYXJhY3RlckNvbGxpc2lvbkxpa2UgfCBudWxsO1xufTtcblxuZXhwb3J0IHR5cGUgUmFwaWVyQ2hhcmFjdGVyQ29sbGlzaW9uTGlrZSA9IHtcbiAgbm9ybWFsMTogUmFwaWVyVmVjdG9yM0xpa2U7XG59O1xuXG5leHBvcnQgdHlwZSBSYXBpZXJXb3JsZExpa2UgPSB7XG4gIHRpbWVzdGVwOiBudW1iZXI7XG4gIGZyZWU/KCk6IHZvaWQ7XG4gIHN0ZXAoZXZlbnRRdWV1ZT86IFJhcGllckV2ZW50UXVldWVMaWtlKTogdm9pZDtcbiAgY3JlYXRlUmlnaWRCb2R5KGRlc2M6IFJhcGllclJpZ2lkQm9keURlc2NMaWtlKTogUmFwaWVyUmlnaWRCb2R5TGlrZTtcbiAgY3JlYXRlQ29sbGlkZXIoZGVzYzogUmFwaWVyQ29sbGlkZXJEZXNjTGlrZSwgcmlnaWRCb2R5PzogUmFwaWVyUmlnaWRCb2R5TGlrZSk6IFJhcGllckNvbGxpZGVyTGlrZTtcbiAgcmVtb3ZlUmlnaWRCb2R5PyhyaWdpZEJvZHk6IFJhcGllclJpZ2lkQm9keUxpa2UpOiB2b2lkO1xuICBjcmVhdGVDaGFyYWN0ZXJDb250cm9sbGVyPyhvZmZzZXQ6IG51bWJlcik6IFJhcGllckNoYXJhY3RlckNvbnRyb2xsZXJMaWtlO1xuICByZW1vdmVDaGFyYWN0ZXJDb250cm9sbGVyPyhjb250cm9sbGVyOiBSYXBpZXJDaGFyYWN0ZXJDb250cm9sbGVyTGlrZSk6IHZvaWQ7XG4gIGNhc3RSYXlBbmRHZXROb3JtYWw/KFxuICAgIHJheTogdW5rbm93bixcbiAgICBtYXhUb2k6IG51bWJlcixcbiAgICBzb2xpZDogYm9vbGVhbixcbiAgICBmaWx0ZXJGbGFncz86IG51bWJlcixcbiAgICBmaWx0ZXJHcm91cHM/OiBudW1iZXIsXG4gICAgZmlsdGVyRXhjbHVkZUNvbGxpZGVyPzogUmFwaWVyQ29sbGlkZXJMaWtlLFxuICAgIGZpbHRlckV4Y2x1ZGVSaWdpZEJvZHk/OiBSYXBpZXJSaWdpZEJvZHlMaWtlLFxuICAgIGZpbHRlclByZWRpY2F0ZT86IChjb2xsaWRlcjogUmFwaWVyQ29sbGlkZXJMaWtlKSA9PiBib29sZWFuXG4gICk6IFJhcGllclJheUludGVyc2VjdGlvbkxpa2UgfCBudWxsO1xuICBjYXN0U2hhcGU/KFxuICAgIHNoYXBlUG9zOiBSYXBpZXJWZWN0b3IzTGlrZSxcbiAgICBzaGFwZVJvdDogUmFwaWVyUXVhdGVybmlvbkxpa2UsXG4gICAgc2hhcGVWZWw6IFJhcGllclZlY3RvcjNMaWtlLFxuICAgIHNoYXBlOiB1bmtub3duLFxuICAgIHRhcmdldERpc3RhbmNlOiBudW1iZXIsXG4gICAgbWF4VG9pOiBudW1iZXIsXG4gICAgc3RvcEF0UGVuZXRyYXRpb246IGJvb2xlYW4sXG4gICAgZmlsdGVyRmxhZ3M/OiBudW1iZXIsXG4gICAgZmlsdGVyR3JvdXBzPzogbnVtYmVyLFxuICAgIGZpbHRlckV4Y2x1ZGVDb2xsaWRlcj86IFJhcGllckNvbGxpZGVyTGlrZSxcbiAgICBmaWx0ZXJFeGNsdWRlUmlnaWRCb2R5PzogUmFwaWVyUmlnaWRCb2R5TGlrZSxcbiAgICBmaWx0ZXJQcmVkaWNhdGU/OiAoY29sbGlkZXI6IFJhcGllckNvbGxpZGVyTGlrZSkgPT4gYm9vbGVhblxuICApOiBSYXBpZXJTaGFwZUNhc3RIaXRMaWtlIHwgbnVsbDtcbn07XG5cbmV4cG9ydCB0eXBlIFJhcGllckV2ZW50UXVldWVMaWtlID0ge1xuICBkcmFpbkNvbGxpc2lvbkV2ZW50cyhjYWxsYmFjazogKGhhbmRsZTE6IG51bWJlciwgaGFuZGxlMjogbnVtYmVyLCBzdGFydGVkOiBib29sZWFuKSA9PiB2b2lkKTogdm9pZDtcbiAgZnJlZT8oKTogdm9pZDtcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmFwaWVyU3RlcFBhcnRpY2lwYW50IHtcbiAgcHJlU3RlcChkZWx0YVRpbWU6IG51bWJlcik6IHZvaWQ7XG4gIHBvc3RTdGVwKCk6IHZvaWQ7XG59XG5cbmV4cG9ydCB0eXBlIFJhcGllclBoeXNpY3NNb2R1bGVMaWtlID0ge1xuICBkZWZhdWx0PzogUmFwaWVyUGh5c2ljc01vZHVsZUxpa2U7XG4gIGluaXQ/OiAoKSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPjtcbiAgV29ybGQ6IG5ldyAoZ3Jhdml0eTogUmFwaWVyVmVjdG9yM0xpa2UpID0+IFJhcGllcldvcmxkTGlrZTtcbiAgUmlnaWRCb2R5RGVzYzoge1xuICAgIGR5bmFtaWMoKTogUmFwaWVyUmlnaWRCb2R5RGVzY0xpa2U7XG4gICAgZml4ZWQoKTogUmFwaWVyUmlnaWRCb2R5RGVzY0xpa2U7XG4gICAga2luZW1hdGljUG9zaXRpb25CYXNlZD8oKTogUmFwaWVyUmlnaWRCb2R5RGVzY0xpa2U7XG4gIH07XG4gIENvbGxpZGVyRGVzYzoge1xuICAgIGN1Ym9pZCh4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyKTogUmFwaWVyQ29sbGlkZXJEZXNjTGlrZTtcbiAgICBiYWxsKHJhZGl1czogbnVtYmVyKTogUmFwaWVyQ29sbGlkZXJEZXNjTGlrZTtcbiAgICBjYXBzdWxlPyhoYWxmSGVpZ2h0OiBudW1iZXIsIHJhZGl1czogbnVtYmVyKTogUmFwaWVyQ29sbGlkZXJEZXNjTGlrZTtcbiAgICBjeWxpbmRlcj8oaGFsZkhlaWdodDogbnVtYmVyLCByYWRpdXM6IG51bWJlcik6IFJhcGllckNvbGxpZGVyRGVzY0xpa2U7XG4gIH07XG4gIEV2ZW50UXVldWU/OiBuZXcgKGF1dG9EcmFpbjogYm9vbGVhbikgPT4gUmFwaWVyRXZlbnRRdWV1ZUxpa2U7XG4gIEFjdGl2ZUV2ZW50cz86IHsgQ09MTElTSU9OX0VWRU5UUzogbnVtYmVyIH07XG4gIEFjdGl2ZUNvbGxpc2lvblR5cGVzPzogeyBBTEw6IG51bWJlciB9O1xuICBRdWVyeUZpbHRlckZsYWdzPzogeyBFWENMVURFX1NFTlNPUlM6IG51bWJlciB9O1xuICBSYXk/OiBuZXcgKG9yaWdpbjogUmFwaWVyVmVjdG9yM0xpa2UsIGRpcmVjdGlvbjogUmFwaWVyVmVjdG9yM0xpa2UpID0+IHVua25vd247XG4gIEJhbGw/OiBuZXcgKHJhZGl1czogbnVtYmVyKSA9PiB1bmtub3duO1xufTtcblxudHlwZSBTdG9yZWRQaHlzaWNzUHJvcGVydHkgPSBPbWl0PFBoeXNpY3NQcm9wZXJ0eUlubmVyLCAncG9zaXRpb24nIHwgJ3JvdGF0aW9uJyB8ICdzaXplJz4gJiB7XG4gIHBvc2l0aW9uOiBJVmVjdG9yMztcbiAgcm90YXRpb246IElWZWN0b3IzO1xuICBzaXplOiBJVmVjdG9yMztcbn07XG5cbnR5cGUgUmFwaWVyV29ybGRTdGF0ZSA9IHtcbiAgZW5naW5lPzogRW5naW5lO1xuICB3b3JsZDogUmFwaWVyV29ybGRMaWtlO1xuICBldmVudFF1ZXVlPzogUmFwaWVyRXZlbnRRdWV1ZUxpa2U7XG4gIGNvbGxpZGVyTWV0YWRhdGE6IE1hcDxudW1iZXIsIFJhcGllckNvbGxpZGVyTWV0YWRhdGE+O1xuICBsYXN0RnJhbWVJZD86IG51bWJlcjtcbn07XG5cbi8qKlxuICogUGh5c2ljcyBzdHJhdGVneSBpbXBsZW1lbnRhdGlvbiB1c2luZyBleHRlcm5hbGx5IHByb3ZpZGVkIFJhcGllci5qcyBiaW5kaW5ncy5cbiAqXG4gKiBSaG9kb25pdGVUUyBpbnRlbnRpb25hbGx5IGRvZXMgbm90IGltcG9ydCBSYXBpZXIgZGlyZWN0bHkuIENhbGxcbiAqIFJhcGllclBoeXNpY3NTdHJhdGVneS5pbml0aWFsaXplKFJBUElFUikgYmVmb3JlIGNyZWF0aW5nIHRoaXMgc3RyYXRlZ3kuXG4gKi9cbmV4cG9ydCBjbGFzcyBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kgaW1wbGVtZW50cyBQaHlzaWNzU3RyYXRlZ3kge1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX2RlZmF1bHRUaW1lc3RlcCA9IDEgLyA2MDtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX19tYXhUaW1lc3RlcCA9IDEgLyAxNTtcblxuICBzdGF0aWMgX193b3JsZFByb3BlcnR5OiBQaHlzaWNzV29ybGRQcm9wZXJ0eSA9IHtcbiAgICBncmF2aXR5OiBWZWN0b3IzLmZyb21Db3B5MygwLCAtOS44LCAwKSxcbiAgICByYW5kb206IHRydWUsXG4gIH07XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19yYXBpZXI/OiBSYXBpZXJQaHlzaWNzTW9kdWxlTGlrZTtcbiAgcHJpdmF0ZSBzdGF0aWMgX19kZWZhdWx0V29ybGRTdGF0ZT86IFJhcGllcldvcmxkU3RhdGU7XG4gIHByaXZhdGUgc3RhdGljIF9fd29ybGRTdGF0ZXMgPSBuZXcgTWFwPEVuZ2luZSwgUmFwaWVyV29ybGRTdGF0ZT4oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX19zdGVwUGFydGljaXBhbnRzID0gbmV3IE1hcDxSYXBpZXJTdGVwUGFydGljaXBhbnQsIEVuZ2luZT4oKTtcblxuICBwcml2YXRlIF9fcmlnaWRCb2R5PzogUmFwaWVyUmlnaWRCb2R5TGlrZTtcbiAgcHJpdmF0ZSBfX2NvbGxpZGVyczogUmFwaWVyQ29sbGlkZXJMaWtlW10gPSBbXTtcbiAgcHJpdmF0ZSBfX2VudGl0eT86IElTY2VuZUdyYXBoRW50aXR5O1xuICBwcml2YXRlIF9fcHJvcGVydHk/OiBTdG9yZWRQaHlzaWNzUHJvcGVydHk7XG4gIHByaXZhdGUgX19sb2NhbFNjYWxlOiBJVmVjdG9yMyA9IFZlY3RvcjMub25lKCk7XG4gIHByaXZhdGUgX19zaGFwZUxvY2FsUG9zaXRpb246IElWZWN0b3IzID0gVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgX19zaGFwZUxvY2FsUm90YXRpb246IElRdWF0ZXJuaW9uID0gUXVhdGVybmlvbi5pZGVudGl0eSgpO1xuICBwcml2YXRlIF9fc2hhcGVCaW5kaW5ncz86IFBoeXNpY3NTaGFwZUluc3RhbmNlQmluZGluZ1tdO1xuICBwcml2YXRlIF9fbW90aW9uPzogUGh5c2ljc01vdGlvblByb3BlcnR5O1xuICBwcml2YXRlIF9fc2hhcGVXb3JsZFNjYWxlOiBJVmVjdG9yMyA9IFZlY3RvcjMub25lKCk7XG4gIHByaXZhdGUgX19zaGFwZVdvcmxkU2lnbmVkU2NhbGU6IElWZWN0b3IzID0gVmVjdG9yMy5vbmUoKTtcbiAgcHJpdmF0ZSBfX3dhcm5lZEFzeW1tZXRyaWNSYWRpdXMgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX3dhcm5lZE5vblVuaWZvcm1TY2FsZSA9IGZhbHNlO1xuICBwcml2YXRlIF9fd2FybmVkU2hlYXJlZEJveEFwcHJveGltYXRpb24gPSBmYWxzZTtcbiAgLyoqIFJldXNhYmxlIHF1YXRlcm5pb24gZm9yIHdvcmxkLXJvdGF0aW9uIGxvb2t1cHMgKGF2b2lkcyBwZXItZnJhbWUgYWxsb2NhdGlvbnMpICovXG4gIHByaXZhdGUgX190bXBXb3JsZFJvdGF0aW9uID0gTXV0YWJsZVF1YXRlcm5pb24uaWRlbnRpdHkoKTtcbiAgLyoqIFJldXNhYmxlIEV1bGVyIGFuZ2xlcyBmb3Igcm90YXRpb24gY29udmVyc2lvbnMgKGF2b2lkcyBwZXItZnJhbWUgYWxsb2NhdGlvbnMpICovXG4gIHByaXZhdGUgX190bXBFdWxlciA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgLyoqIFJldXNhYmxlIEV1bGVyIGFuZ2xlcyBzdG9yZWQgaW4gdGhlIGNhY2hlZCBwaHlzaWNzIHByb3BlcnR5ICovXG4gIHByaXZhdGUgX190bXBQcm9wZXJ0eVJvdGF0aW9uID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICAvKiogUmV1c2FibGUgdmVjdG9ycyBmb3IgY29udmVydGluZyBtb3Rpb24gdmVsb2NpdGllcyAqL1xuICBwcml2YXRlIF9fdG1wTGluZWFyVmVsb2NpdHkgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgX190bXBBbmd1bGFyVmVsb2NpdHkgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIC8qKiBSZXVzYWJsZSB0ZW1wb3JhcmllcyBmb3IgdGhlIHBlci1mcmFtZSBwaHlzaWNzIHN5bmMgKi9cbiAgcHJpdmF0ZSBfX3RtcFVwZGF0ZVBvc2l0aW9uID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIF9fdG1wVXBkYXRlUm90YXRpb24gPSBNdXRhYmxlUXVhdGVybmlvbi5pZGVudGl0eSgpO1xuXG4gIC8qKlxuICAgKiBJbmplY3RzIFJhcGllci5qcyBiaW5kaW5ncy4gUGh5c2ljcyB3b3JsZHMgYXJlIGNyZWF0ZWQgbGF6aWx5IHBlciBFbmdpbmUuXG4gICAqIEBwYXJhbSByYXBpZXJNb2R1bGUgLSBSYXBpZXIgbW9kdWxlIG9yIGNvbXBhdCBtb2R1bGUgZGVmYXVsdCBleHBvcnRcbiAgICogQHBhcmFtIHdvcmxkUHJvcGVydHkgLSBPcHRpb25hbCB3b3JsZCBzZXR0aW5nc1xuICAgKi9cbiAgc3RhdGljIGFzeW5jIGluaXRpYWxpemUoXG4gICAgcmFwaWVyTW9kdWxlOiBSYXBpZXJQaHlzaWNzTW9kdWxlTGlrZSxcbiAgICB3b3JsZFByb3BlcnR5OiBQaHlzaWNzV29ybGRQcm9wZXJ0eSA9IFJhcGllclBoeXNpY3NTdHJhdGVneS5fX3dvcmxkUHJvcGVydHlcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgcmFwaWVyID0gcmFwaWVyTW9kdWxlLmRlZmF1bHQgPz8gcmFwaWVyTW9kdWxlO1xuICAgIGlmIChyYXBpZXIuaW5pdCAhPSBudWxsKSB7XG4gICAgICBhd2FpdCByYXBpZXIuaW5pdCgpO1xuICAgIH1cblxuICAgIFJhcGllclBoeXNpY3NTdHJhdGVneS5fX2Rpc3Bvc2VXb3JsZFN0YXRlKFJhcGllclBoeXNpY3NTdHJhdGVneS5fX2RlZmF1bHRXb3JsZFN0YXRlKTtcbiAgICBmb3IgKGNvbnN0IHN0YXRlIG9mIFJhcGllclBoeXNpY3NTdHJhdGVneS5fX3dvcmxkU3RhdGVzLnZhbHVlcygpKSB7XG4gICAgICBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX19kaXNwb3NlV29ybGRTdGF0ZShzdGF0ZSk7XG4gICAgfVxuICAgIFJhcGllclBoeXNpY3NTdHJhdGVneS5fX3JhcGllciA9IHJhcGllcjtcbiAgICBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX193b3JsZFByb3BlcnR5ID0gd29ybGRQcm9wZXJ0eTtcbiAgICBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX19kZWZhdWx0V29ybGRTdGF0ZSA9IHVuZGVmaW5lZDtcbiAgICBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX193b3JsZFN0YXRlcy5jbGVhcigpO1xuICAgIFJhcGllclBoeXNpY3NTdHJhdGVneS5fX3N0ZXBQYXJ0aWNpcGFudHMuY2xlYXIoKTtcbiAgICBfc2V0UGh5c2ljc0JhY2tlbmQoUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9fcGh5c2ljc0JhY2tlbmQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBiYWNrZW5kIHRocm91Z2ggd2hpY2ggZW5naW5lLXNpZGUgY29kZSByZWFjaGVzIFJhcGllciBvbmNlIGl0IGlzIGluaXRpYWxpemVkXG4gICAqIChzZWUge0BsaW5rIFBoeXNpY3NCYWNrZW5kfSkuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3BoeXNpY3NCYWNrZW5kOiBQaHlzaWNzQmFja2VuZCA9IHtcbiAgICB1cGRhdGU6IChmcmFtZUlkOiBudW1iZXIgfCB1bmRlZmluZWQsIGRlbHRhVGltZTogbnVtYmVyLCBlbmdpbmU6IEVuZ2luZSkgPT5cbiAgICAgIFJhcGllclBoeXNpY3NTdHJhdGVneS51cGRhdGUoZnJhbWVJZCwgZGVsdGFUaW1lLCBlbmdpbmUpLFxuICAgIGNsZWFudXBGb3JFbmdpbmU6IChlbmdpbmU6IEVuZ2luZSkgPT4gUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9jbGVhbnVwRm9yRW5naW5lKGVuZ2luZSksXG4gICAgYmluZFNoYXBlUGh5c2ljczogKGVudGl0eTogSVNjZW5lR3JhcGhFbnRpdHksIHNoYXBlQ29tcG9uZW50OiBTaGFwZUNvbXBvbmVudCwgb3B0aW9uczogU2hhcGVQaHlzaWNzT3B0aW9ucykgPT4ge1xuICAgICAgY29uc3QgcGh5c2ljc0VudGl0eSA9IGVudGl0eS5lbmdpbmUuZW50aXR5UmVwb3NpdG9yeS5hZGRDb21wb25lbnRUb0VudGl0eShQaHlzaWNzQ29tcG9uZW50LCBlbnRpdHkpO1xuICAgICAgY29uc3QgcGh5c2ljc0NvbXBvbmVudCA9IHBoeXNpY3NFbnRpdHkuZ2V0UGh5c2ljcygpO1xuICAgICAgcGh5c2ljc0NvbXBvbmVudC5zZXRTdHJhdGVneShuZXcgUmFwaWVyUGh5c2ljc1N0cmF0ZWd5KCkpO1xuICAgICAgcGh5c2ljc0NvbXBvbmVudC5iaW5kU2hhcGUoe1xuICAgICAgICBzaGFwZUNvbXBvbmVudCxcbiAgICAgICAgYm9keTogeyBtb3ZlOiBvcHRpb25zLm1vdmUsIGRlbnNpdHk6IG9wdGlvbnMuZGVuc2l0eSB9LFxuICAgICAgICBjb2xsaWRlcjogeyBmcmljdGlvbjogb3B0aW9ucy5mcmljdGlvbiwgcmVzdGl0dXRpb246IG9wdGlvbnMucmVzdGl0dXRpb24gfSxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHBoeXNpY3NFbnRpdHk7XG4gICAgfSxcbiAgfTtcblxuICAvKipcbiAgICogUmV0dXJucyB0cnVlIHdoZW4gUmFwaWVyIGJpbmRpbmdzIGhhdmUgYWxyZWFkeSBiZWVuIGluamVjdGVkLlxuICAgKi9cbiAgc3RhdGljIGdldCBpc0luaXRpYWxpemVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX19yYXBpZXIgIT0gbnVsbDtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIFJhcGllclBoeXNpY3NTdHJhdGVneS5fX2Fzc2VydEluaXRpYWxpemVkKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCBhIFJhcGllciByaWdpZCBib2R5IGFuZCBjb2xsaWRlciBmb3IgdGhlIGdpdmVuIGVudGl0eS5cbiAgICogQHBhcmFtIHByb3AgLSBQaHlzaWNzIHByb3BlcnRpZXMgZGVmaW5pbmcgc2hhcGUgYW5kIG1hdGVyaWFsIHZhbHVlc1xuICAgKiBAcGFyYW0gZW50aXR5IC0gU2NlbmUgZ3JhcGggZW50aXR5IGFzc29jaWF0ZWQgd2l0aCB0aGUgcGh5c2ljcyBib2R5XG4gICAqL1xuICBzZXRTaGFwZShwcm9wOiBQaHlzaWNzUHJvcGVydHlJbm5lciwgZW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eSwgd29ybGRTY2FsZTogSVZlY3RvcjMgPSBWZWN0b3IzLm9uZSgpKTogdm9pZCB7XG4gICAgY29uc3QgcHJlc2VydmVkU3RhdGUgPSB0aGlzLl9fY2FwdHVyZUR5bmFtaWNCb2R5U3RhdGUoKTtcbiAgICB0aGlzLl9fcmVtb3ZlQm9keSh0cnVlKTtcbiAgICB0aGlzLl9fc2hhcGVCaW5kaW5ncyA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fbW90aW9uID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX19zaGFwZUxvY2FsUG9zaXRpb24gPSBWZWN0b3IzLnplcm8oKTtcbiAgICB0aGlzLl9fc2hhcGVMb2NhbFJvdGF0aW9uID0gUXVhdGVybmlvbi5pZGVudGl0eSgpO1xuICAgIHRoaXMuX19zaGFwZVdvcmxkU2lnbmVkU2NhbGUgPSBWZWN0b3IzLm9uZSgpO1xuICAgIHRoaXMuX19zZXRTaGFwZShwcm9wLCBlbnRpdHksIHdvcmxkU2NhbGUsIHByZXNlcnZlZFN0YXRlKTtcbiAgfVxuXG4gIHNldFNoYXBlSW5zdGFuY2UoXG4gICAgc2hhcGU6IFNoYXBlSW5zdGFuY2UsXG4gICAgYm9keTogUGh5c2ljc0JvZHlQcm9wZXJ0eSxcbiAgICBjb2xsaWRlcjogUGh5c2ljc0NvbGxpZGVyUHJvcGVydHksXG4gICAgZW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eSxcbiAgICB3b3JsZFNjYWxlOiBJVmVjdG9yMyA9IFZlY3RvcjMub25lKCksXG4gICAgbW90aW9uPzogUGh5c2ljc01vdGlvblByb3BlcnR5XG4gICk6IHZvaWQge1xuICAgIHRoaXMuc2V0U2hhcGVJbnN0YW5jZXMoW3sgc2hhcGUsIGJvZHksIGNvbGxpZGVyIH1dLCBlbnRpdHksIHdvcmxkU2NhbGUsIG1vdGlvbik7XG4gIH1cblxuICBzZXRTaGFwZUluc3RhbmNlcyhcbiAgICBiaW5kaW5nczogcmVhZG9ubHkgUGh5c2ljc1NoYXBlSW5zdGFuY2VCaW5kaW5nW10sXG4gICAgZW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eSxcbiAgICB3b3JsZFNjYWxlOiBJVmVjdG9yMyA9IFZlY3RvcjMub25lKCksXG4gICAgbW90aW9uPzogUGh5c2ljc01vdGlvblByb3BlcnR5XG4gICk6IHZvaWQge1xuICAgIGlmIChiaW5kaW5ncy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMuY2xlYXJTaGFwZUluc3RhbmNlcygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCByZXNvbHZlZE1vdGlvbiA9IG1vdGlvbiA/PyB7XG4gICAgICBtb3ZlOiBiaW5kaW5nc1swXS5ib2R5Lm1vdmUsXG4gICAgICBpc0tpbmVtYXRpYzogYmluZGluZ3NbMF0uYm9keS5pc0tpbmVtYXRpYyxcbiAgICB9O1xuICAgIGNvbnN0IG1vdmUgPSByZXNvbHZlZE1vdGlvbi5tb3ZlO1xuICAgIGNvbnN0IGlzS2luZW1hdGljID0gcmVzb2x2ZWRNb3Rpb24uaXNLaW5lbWF0aWMgPz8gZmFsc2U7XG4gICAgaWYgKGJpbmRpbmdzLnNvbWUoYmluZGluZyA9PiBiaW5kaW5nLmJvZHkubW92ZSAhPT0gbW92ZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQWxsIFJhcGllciBjb2xsaWRlcnMgb24gb25lIHJpZ2lkIGJvZHkgbXVzdCB1c2UgdGhlIHNhbWUgYm9keS5tb3ZlIHZhbHVlLicpO1xuICAgIH1cbiAgICBpZiAoYmluZGluZ3Muc29tZShiaW5kaW5nID0+IChiaW5kaW5nLmJvZHkuaXNLaW5lbWF0aWMgPz8gZmFsc2UpICE9PSBpc0tpbmVtYXRpYykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQWxsIFJhcGllciBjb2xsaWRlcnMgb24gb25lIHJpZ2lkIGJvZHkgbXVzdCB1c2UgdGhlIHNhbWUgYm9keS5pc0tpbmVtYXRpYyB2YWx1ZS4nKTtcbiAgICB9XG4gICAgaWYgKCFtb3ZlICYmIGlzS2luZW1hdGljKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Ega2luZW1hdGljIFJhcGllciBib2R5IG11c3QgaGF2ZSBib2R5Lm1vdmUgZW5hYmxlZC4nKTtcbiAgICB9XG4gICAgY29uc3QgaGFzRHluYW1pY1BhcmFtZXRlcnMgPVxuICAgICAgcmVzb2x2ZWRNb3Rpb24ubWFzcyAhPSBudWxsIHx8XG4gICAgICByZXNvbHZlZE1vdGlvbi5jZW50ZXJPZk1hc3MgIT0gbnVsbCB8fFxuICAgICAgcmVzb2x2ZWRNb3Rpb24uaW5lcnRpYURpYWdvbmFsICE9IG51bGwgfHxcbiAgICAgIHJlc29sdmVkTW90aW9uLmluZXJ0aWFPcmllbnRhdGlvbiAhPSBudWxsIHx8XG4gICAgICByZXNvbHZlZE1vdGlvbi5saW5lYXJWZWxvY2l0eSAhPSBudWxsIHx8XG4gICAgICByZXNvbHZlZE1vdGlvbi5hbmd1bGFyVmVsb2NpdHkgIT0gbnVsbCB8fFxuICAgICAgcmVzb2x2ZWRNb3Rpb24uZ3Jhdml0eUZhY3RvciAhPSBudWxsO1xuICAgIGlmICgoIW1vdmUgfHwgaXNLaW5lbWF0aWMpICYmIGhhc0R5bmFtaWNQYXJhbWV0ZXJzKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC53YXJuKFxuICAgICAgICBgUmFwaWVyIGlnbm9yZXMgbWFzcyBwcm9wZXJ0aWVzLCBpbml0aWFsIHZlbG9jaXR5LCBhbmQgZ3Jhdml0eUZhY3RvciBvbiAke2lzS2luZW1hdGljID8gJ2tpbmVtYXRpYycgOiAnZml4ZWQnfSBib2RpZXMuYFxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKGlzS2luZW1hdGljICYmIFJhcGllclBoeXNpY3NTdHJhdGVneS5fX2dldFJhcGllcigpLlJpZ2lkQm9keURlc2Mua2luZW1hdGljUG9zaXRpb25CYXNlZCA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBpbmplY3RlZCBSYXBpZXIgbW9kdWxlIGRvZXMgbm90IHN1cHBvcnQgcG9zaXRpb24tYmFzZWQga2luZW1hdGljIGJvZGllcy4nKTtcbiAgICB9XG4gICAgY29uc3Qgc2NhbGUgPSBWZWN0b3IzLmZyb21Db3B5MyhNYXRoLmFicyh3b3JsZFNjYWxlLngpLCBNYXRoLmFicyh3b3JsZFNjYWxlLnkpLCBNYXRoLmFicyh3b3JsZFNjYWxlLnopKTtcbiAgICBmb3IgKGNvbnN0IGJpbmRpbmcgb2YgYmluZGluZ3MpIHtcbiAgICAgIFJhcGllclBoeXNpY3NTdHJhdGVneS5fX3ZhbGlkYXRlU2hhcGVTdXBwb3J0KGJpbmRpbmcuc2hhcGUsIHNjYWxlKTtcbiAgICB9XG4gICAgY29uc3QgcHJlc2VydmVkU3RhdGUgPSB0aGlzLl9fY2FwdHVyZUR5bmFtaWNCb2R5U3RhdGUoKTtcbiAgICB0aGlzLl9fc2hhcGVCaW5kaW5ncyA9IGJpbmRpbmdzLm1hcChiaW5kaW5nID0+ICh7XG4gICAgICBiaW5kaW5nSWQ6IGJpbmRpbmcuYmluZGluZ0lkLFxuICAgICAgc2hhcGU6IGJpbmRpbmcuc2hhcGUsXG4gICAgICBib2R5OiB7IC4uLmJpbmRpbmcuYm9keSB9LFxuICAgICAgY29sbGlkZXI6IHsgLi4uYmluZGluZy5jb2xsaWRlciB9LFxuICAgIH0pKTtcbiAgICB0aGlzLl9fbW90aW9uID0gUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9fY29weU1vdGlvbihyZXNvbHZlZE1vdGlvbik7XG4gICAgdGhpcy5fX3NoYXBlV29ybGRTY2FsZSA9IFZlY3RvcjMuZnJvbUNvcHkzKE1hdGguYWJzKHdvcmxkU2NhbGUueCksIE1hdGguYWJzKHdvcmxkU2NhbGUueSksIE1hdGguYWJzKHdvcmxkU2NhbGUueikpO1xuICAgIHRoaXMuX19zaGFwZVdvcmxkU2lnbmVkU2NhbGUgPSBWZWN0b3IzLmZyb21Db3B5Myh3b3JsZFNjYWxlLngsIHdvcmxkU2NhbGUueSwgd29ybGRTY2FsZS56KTtcbiAgICB0aGlzLl9fd2FybmVkQXN5bW1ldHJpY1JhZGl1cyA9IGZhbHNlO1xuICAgIHRoaXMuX193YXJuZWROb25Vbmlmb3JtU2NhbGUgPSBmYWxzZTtcbiAgICB0aGlzLl9fd2FybmVkU2hlYXJlZEJveEFwcHJveGltYXRpb24gPSBmYWxzZTtcbiAgICBjb25zdCBmaXJzdCA9IGJpbmRpbmdzWzBdO1xuICAgIGNvbnN0IHNpemUgPSBmaXJzdC5zaGFwZS5zaGFwZS50eXBlID09PSAnYm94JyA/IGZpcnN0LnNoYXBlLnNoYXBlLnNpemUgOiBWZWN0b3IzLm9uZSgpO1xuICAgIGNvbnN0IHdpbGxSZWJ1aWxkID0gc2NhbGUueCA+IDAgJiYgc2NhbGUueSA+IDAgJiYgc2NhbGUueiA+IDA7XG4gICAgdGhpcy5fX3JlbW92ZUJvZHkod2lsbFJlYnVpbGQpO1xuICAgIHRoaXMuX19zZXRTaGFwZShcbiAgICAgIHtcbiAgICAgICAgdHlwZTogZmlyc3Quc2hhcGUuc2hhcGUudHlwZSA9PT0gJ2JveCcgPyBQaHlzaWNzU2hhcGUuQm94IDogUGh5c2ljc1NoYXBlLlNwaGVyZSxcbiAgICAgICAgc2l6ZSxcbiAgICAgICAgcG9zaXRpb246IGVudGl0eS5nZXRTY2VuZUdyYXBoKCkucG9zaXRpb24sXG4gICAgICAgIHJvdGF0aW9uOiBlbnRpdHlcbiAgICAgICAgICAuZ2V0U2NlbmVHcmFwaCgpXG4gICAgICAgICAgLmdldFF1YXRlcm5pb25SZWN1cnNpdmVseVRvKHRoaXMuX190bXBXb3JsZFJvdGF0aW9uKVxuICAgICAgICAgIC50b0V1bGVyQW5nbGVzVG8odGhpcy5fX3RtcEV1bGVyKSxcbiAgICAgICAgbW92ZTogcmVzb2x2ZWRNb3Rpb24ubW92ZSxcbiAgICAgICAgZGVuc2l0eTogZmlyc3QuYm9keS5kZW5zaXR5LFxuICAgICAgICBmcmljdGlvbjogZmlyc3QuY29sbGlkZXIuZnJpY3Rpb24sXG4gICAgICAgIHJlc3RpdHV0aW9uOiBmaXJzdC5jb2xsaWRlci5yZXN0aXR1dGlvbixcbiAgICAgIH0sXG4gICAgICBlbnRpdHksXG4gICAgICB3b3JsZFNjYWxlLFxuICAgICAgcHJlc2VydmVkU3RhdGVcbiAgICApO1xuICB9XG5cbiAgY2xlYXJTaGFwZUluc3RhbmNlcygpOiB2b2lkIHtcbiAgICB0aGlzLl9fcmVtb3ZlQm9keSgpO1xuICAgIHRoaXMuX19zaGFwZUJpbmRpbmdzID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX19tb3Rpb24gPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fX3Byb3BlcnR5ID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgcHJpdmF0ZSBfX3NldFNoYXBlKFxuICAgIHByb3A6IFBoeXNpY3NQcm9wZXJ0eUlubmVyLFxuICAgIGVudGl0eTogSVNjZW5lR3JhcGhFbnRpdHksXG4gICAgd29ybGRTY2FsZTogSVZlY3RvcjMsXG4gICAgcHJlc2VydmVkU3RhdGU/OiBQcmVzZXJ2ZWREeW5hbWljQm9keVN0YXRlXG4gICk6IHZvaWQge1xuICAgIHRoaXMuX19lbnRpdHkgPSBlbnRpdHk7XG4gICAgdGhpcy5fX2xvY2FsU2NhbGUgPSBWZWN0b3IzLmZyb21Db3B5Myhwcm9wLnNpemUueCwgcHJvcC5zaXplLnksIHByb3Auc2l6ZS56KTtcbiAgICB0aGlzLl9fcHJvcGVydHkgPSB7XG4gICAgICB0eXBlOiBwcm9wLnR5cGUsXG4gICAgICBzaXplOiBWZWN0b3IzLmZyb21Db3B5Myhwcm9wLnNpemUueCwgcHJvcC5zaXplLnksIHByb3Auc2l6ZS56KSxcbiAgICAgIHBvc2l0aW9uOiBWZWN0b3IzLmZyb21Db3B5Myhwcm9wLnBvc2l0aW9uLngsIHByb3AucG9zaXRpb24ueSwgcHJvcC5wb3NpdGlvbi56KSxcbiAgICAgIHJvdGF0aW9uOiBWZWN0b3IzLmZyb21Db3B5Myhwcm9wLnJvdGF0aW9uLngsIHByb3Aucm90YXRpb24ueSwgcHJvcC5yb3RhdGlvbi56KSxcbiAgICAgIG1vdmU6IHByb3AubW92ZSxcbiAgICAgIGRlbnNpdHk6IHByb3AuZGVuc2l0eSxcbiAgICAgIGZyaWN0aW9uOiBwcm9wLmZyaWN0aW9uLFxuICAgICAgcmVzdGl0dXRpb246IHByb3AucmVzdGl0dXRpb24sXG4gICAgfTtcblxuICAgIGlmIChcbiAgICAgIHRoaXMuX19zaGFwZUJpbmRpbmdzICE9IG51bGwgJiZcbiAgICAgICh0aGlzLl9fc2hhcGVXb3JsZFNjYWxlLnggPT09IDAgfHwgdGhpcy5fX3NoYXBlV29ybGRTY2FsZS55ID09PSAwIHx8IHRoaXMuX19zaGFwZVdvcmxkU2NhbGUueiA9PT0gMClcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc2NhbGVkU2l6ZSA9IHRoaXMuX19jcmVhdGVTY2FsZWRTaXplKHdvcmxkU2NhbGUpO1xuICAgIGlmICh0aGlzLl9faXNWYWxpZFNpemUodGhpcy5fX3Byb3BlcnR5LCBzY2FsZWRTaXplKSkge1xuICAgICAgdGhpcy5fX2NyZWF0ZUJvZHkoXG4gICAgICAgIHRoaXMuX19wcm9wZXJ0eSxcbiAgICAgICAgc2NhbGVkU2l6ZSxcbiAgICAgICAgdGhpcy5fX3Byb3BlcnR5LnBvc2l0aW9uLFxuICAgICAgICBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX19ldWxlclRvUXVhdGVybmlvbih0aGlzLl9fcHJvcGVydHkucm90YXRpb24pLFxuICAgICAgICBwcmVzZXJ2ZWRTdGF0ZVxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgYXNzb2NpYXRlZCBlbnRpdHkgdHJhbnNmb3JtIGZyb20gdGhlIFJhcGllciBib2R5IHN0YXRlLlxuICAgKi9cbiAgdXBkYXRlKF9jb25maWc6IENvbmZpZyk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9fZW50aXR5ID09IG51bGwgfHwgdGhpcy5fX3JpZ2lkQm9keSA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcG9zID0gdGhpcy5fX3JpZ2lkQm9keS50cmFuc2xhdGlvbigpO1xuICAgIGNvbnN0IHJvdCA9IHRoaXMuX19yaWdpZEJvZHkucm90YXRpb24oKTtcbiAgICB0aGlzLl9fZW50aXR5XG4gICAgICAuZ2V0U2NlbmVHcmFwaCgpXG4gICAgICAuc2V0UG9zaXRpb25XaXRob3V0UGh5c2ljcyh0aGlzLl9fdG1wVXBkYXRlUG9zaXRpb24uc2V0Q29tcG9uZW50cyhwb3MueCwgcG9zLnksIHBvcy56KSk7XG4gICAgdGhpcy5fX2VudGl0eVxuICAgICAgLmdldFNjZW5lR3JhcGgoKVxuICAgICAgLnNldFJvdGF0aW9uV2l0aG91dFBoeXNpY3ModGhpcy5fX3RtcFVwZGF0ZVJvdGF0aW9uLnNldENvbXBvbmVudHMocm90LngsIHJvdC55LCByb3Queiwgcm90LncpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBSYXBpZXIgYm9keSB3b3JsZCBwb3NpdGlvbi5cbiAgICogQHBhcmFtIHdvcmxkUG9zaXRpb24gLSBOZXcgd29ybGQgcG9zaXRpb25cbiAgICovXG4gIHNldFBvc2l0aW9uKHdvcmxkUG9zaXRpb246IElWZWN0b3IzKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX19wcm9wZXJ0eSAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9fcHJvcGVydHkucG9zaXRpb24gPSBWZWN0b3IzLmZyb21Db3B5Myh3b3JsZFBvc2l0aW9uLngsIHdvcmxkUG9zaXRpb24ueSwgd29ybGRQb3NpdGlvbi56KTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX19yaWdpZEJvZHkgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5fX2lzS2luZW1hdGljQm9keSgpKSB7XG4gICAgICBpZiAodGhpcy5fX3JpZ2lkQm9keS5zZXROZXh0S2luZW1hdGljVHJhbnNsYXRpb24gPT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBpbmplY3RlZCBSYXBpZXIgcmlnaWQgYm9keSBkb2VzIG5vdCBzdXBwb3J0IG5leHQga2luZW1hdGljIHRyYW5zbGF0aW9uLicpO1xuICAgICAgfVxuICAgICAgdGhpcy5fX3JpZ2lkQm9keS5zZXROZXh0S2luZW1hdGljVHJhbnNsYXRpb24oeyB4OiB3b3JsZFBvc2l0aW9uLngsIHk6IHdvcmxkUG9zaXRpb24ueSwgejogd29ybGRQb3NpdGlvbi56IH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9fcmlnaWRCb2R5LnNldFRyYW5zbGF0aW9uKHsgeDogd29ybGRQb3NpdGlvbi54LCB5OiB3b3JsZFBvc2l0aW9uLnksIHo6IHdvcmxkUG9zaXRpb24ueiB9LCB0cnVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBSYXBpZXIgYm9keSB3b3JsZCByb3RhdGlvbi5cbiAgICogQHBhcmFtIHdvcmxkUm90YXRpb24gLSBOZXcgd29ybGQgcm90YXRpb25cbiAgICovXG4gIHNldFJvdGF0aW9uKHdvcmxkUm90YXRpb246IElRdWF0ZXJuaW9uKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX19wcm9wZXJ0eSAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9fcHJvcGVydHkucm90YXRpb24gPSB3b3JsZFJvdGF0aW9uLnRvRXVsZXJBbmdsZXNUbyh0aGlzLl9fdG1wUHJvcGVydHlSb3RhdGlvbik7XG4gICAgfVxuICAgIGlmICh0aGlzLl9fcmlnaWRCb2R5ID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgcm90YXRpb24gPSBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX190b1JhcGllclF1YXRlcm5pb24od29ybGRSb3RhdGlvbik7XG4gICAgaWYgKHRoaXMuX19pc0tpbmVtYXRpY0JvZHkoKSkge1xuICAgICAgaWYgKHRoaXMuX19yaWdpZEJvZHkuc2V0TmV4dEtpbmVtYXRpY1JvdGF0aW9uID09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgaW5qZWN0ZWQgUmFwaWVyIHJpZ2lkIGJvZHkgZG9lcyBub3Qgc3VwcG9ydCBuZXh0IGtpbmVtYXRpYyByb3RhdGlvbi4nKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX19yaWdpZEJvZHkuc2V0TmV4dEtpbmVtYXRpY1JvdGF0aW9uKHJvdGF0aW9uKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fX3JpZ2lkQm9keS5zZXRSb3RhdGlvbihyb3RhdGlvbiwgdHJ1ZSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgUmFwaWVyIGJvZHkgd29ybGQgcm90YXRpb24gZnJvbSBFdWxlciBhbmdsZXMuXG4gICAqIEBwYXJhbSBldWxlckFuZ2xlcyAtIEV1bGVyIGFuZ2xlcyBpbiByYWRpYW5zXG4gICAqL1xuICBzZXRFdWxlckFuZ2xlKGV1bGVyQW5nbGVzOiBJVmVjdG9yMyk6IHZvaWQge1xuICAgIHRoaXMuc2V0Um90YXRpb24oUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9fZXVsZXJUb1F1YXRlcm5pb24oZXVsZXJBbmdsZXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWNyZWF0ZXMgdGhlIFJhcGllciBib2R5IHdpdGggYSBzY2FsZWQgY29sbGlkZXIgc2hhcGUuXG4gICAqIEBwYXJhbSB3b3JsZFNjYWxlIC0gV29ybGQgc2NhbGVcbiAgICovXG4gIHNldFNjYWxlKHdvcmxkU2NhbGU6IElWZWN0b3IzKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX19wcm9wZXJ0eSA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaXNLaW5lbWF0aWMgPSB0aGlzLl9faXNLaW5lbWF0aWNCb2R5KCk7XG4gICAgY29uc3QgcG9zaXRpb24gPSB0aGlzLl9fcmlnaWRCb2R5Py50cmFuc2xhdGlvbigpID8/IHRoaXMuX19wcm9wZXJ0eS5wb3NpdGlvbjtcbiAgICBjb25zdCByb3RhdGlvbiA9XG4gICAgICB0aGlzLl9fcmlnaWRCb2R5Py5yb3RhdGlvbigpID8/IFJhcGllclBoeXNpY3NTdHJhdGVneS5fX2V1bGVyVG9RdWF0ZXJuaW9uKHRoaXMuX19wcm9wZXJ0eS5yb3RhdGlvbik7XG4gICAgY29uc3QgbmV4dEtpbmVtYXRpY1Bvc2l0aW9uID0gaXNLaW5lbWF0aWNcbiAgICAgID8gVmVjdG9yMy5mcm9tQ29weTModGhpcy5fX3Byb3BlcnR5LnBvc2l0aW9uLngsIHRoaXMuX19wcm9wZXJ0eS5wb3NpdGlvbi55LCB0aGlzLl9fcHJvcGVydHkucG9zaXRpb24ueilcbiAgICAgIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IG5leHRLaW5lbWF0aWNSb3RhdGlvbiA9IGlzS2luZW1hdGljXG4gICAgICA/IFJhcGllclBoeXNpY3NTdHJhdGVneS5fX2V1bGVyVG9RdWF0ZXJuaW9uKHRoaXMuX19wcm9wZXJ0eS5yb3RhdGlvbilcbiAgICAgIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IHByZXNlcnZlZFN0YXRlID0gdGhpcy5fX2NhcHR1cmVEeW5hbWljQm9keVN0YXRlKCk7XG4gICAgdGhpcy5fX3NoYXBlV29ybGRTY2FsZSA9IFZlY3RvcjMuZnJvbUNvcHkzKE1hdGguYWJzKHdvcmxkU2NhbGUueCksIE1hdGguYWJzKHdvcmxkU2NhbGUueSksIE1hdGguYWJzKHdvcmxkU2NhbGUueikpO1xuICAgIHRoaXMuX19zaGFwZVdvcmxkU2lnbmVkU2NhbGUgPSBWZWN0b3IzLmZyb21Db3B5Myh3b3JsZFNjYWxlLngsIHdvcmxkU2NhbGUueSwgd29ybGRTY2FsZS56KTtcbiAgICBjb25zdCBzY2FsZWRTaXplID0gdGhpcy5fX2NyZWF0ZVNjYWxlZFNpemUod29ybGRTY2FsZSk7XG5cbiAgICBjb25zdCB3aWxsUmVidWlsZCA9XG4gICAgICB0aGlzLl9fc2hhcGVCaW5kaW5ncyAhPSBudWxsXG4gICAgICAgID8gdGhpcy5fX3NoYXBlV29ybGRTY2FsZS54ID4gMCAmJiB0aGlzLl9fc2hhcGVXb3JsZFNjYWxlLnkgPiAwICYmIHRoaXMuX19zaGFwZVdvcmxkU2NhbGUueiA+IDBcbiAgICAgICAgOiB0aGlzLl9faXNWYWxpZFNpemUodGhpcy5fX3Byb3BlcnR5LCBzY2FsZWRTaXplKTtcbiAgICB0aGlzLl9fcmVtb3ZlQm9keSh3aWxsUmVidWlsZCk7XG4gICAgaWYgKCF3aWxsUmVidWlsZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9fY3JlYXRlQm9keShcbiAgICAgIHRoaXMuX19wcm9wZXJ0eSxcbiAgICAgIHNjYWxlZFNpemUsXG4gICAgICBWZWN0b3IzLmZyb21Db3B5Myhwb3NpdGlvbi54LCBwb3NpdGlvbi55LCBwb3NpdGlvbi56KSxcbiAgICAgIFF1YXRlcm5pb24uZnJvbUNvcHk0KHJvdGF0aW9uLngsIHJvdGF0aW9uLnksIHJvdGF0aW9uLnosIHJvdGF0aW9uLncpLFxuICAgICAgcHJlc2VydmVkU3RhdGVcbiAgICApO1xuICAgIGlmIChuZXh0S2luZW1hdGljUG9zaXRpb24gIT0gbnVsbCAmJiBuZXh0S2luZW1hdGljUm90YXRpb24gIT0gbnVsbCkge1xuICAgICAgdGhpcy5zZXRQb3NpdGlvbihuZXh0S2luZW1hdGljUG9zaXRpb24pO1xuICAgICAgdGhpcy5zZXRSb3RhdGlvbihuZXh0S2luZW1hdGljUm90YXRpb24pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX19jcmVhdGVTY2FsZWRTaXplKHdvcmxkU2NhbGU6IElWZWN0b3IzKTogVmVjdG9yMyB7XG4gICAgcmV0dXJuIFZlY3RvcjMuZnJvbUNvcHkzKFxuICAgICAgdGhpcy5fX2xvY2FsU2NhbGUueCAqIE1hdGguYWJzKHdvcmxkU2NhbGUueCksXG4gICAgICB0aGlzLl9fbG9jYWxTY2FsZS55ICogTWF0aC5hYnMod29ybGRTY2FsZS55KSxcbiAgICAgIHRoaXMuX19sb2NhbFNjYWxlLnogKiBNYXRoLmFicyh3b3JsZFNjYWxlLnopXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgX19pc1ZhbGlkU2l6ZShwcm9wOiBTdG9yZWRQaHlzaWNzUHJvcGVydHksIHNpemU6IElWZWN0b3IzKTogYm9vbGVhbiB7XG4gICAgaWYgKHByb3AudHlwZSA9PT0gUGh5c2ljc1NoYXBlLlNwaGVyZSkge1xuICAgICAgcmV0dXJuIE51bWJlci5pc0Zpbml0ZShzaXplLngpICYmIHNpemUueCA+IDA7XG4gICAgfVxuICAgIHJldHVybiAoXG4gICAgICBOdW1iZXIuaXNGaW5pdGUoc2l6ZS54KSAmJlxuICAgICAgTnVtYmVyLmlzRmluaXRlKHNpemUueSkgJiZcbiAgICAgIE51bWJlci5pc0Zpbml0ZShzaXplLnopICYmXG4gICAgICBzaXplLnggPiAwICYmXG4gICAgICBzaXplLnkgPiAwICYmXG4gICAgICBzaXplLnogPiAwXG4gICAgKTtcbiAgfVxuXG4gIC8qKiBBZHZhbmNlcyBvbmUgRW5naW5lJ3MgUmFwaWVyIHdvcmxkLCBvciBldmVyeSBpbml0aWFsaXplZCBFbmdpbmUgd29ybGQgd2hlbiBvbWl0dGVkLiAqL1xuICBzdGF0aWMgdXBkYXRlKGZyYW1lSWQ/OiBudW1iZXIsIGRlbHRhVGltZSA9IDEgLyA2MCwgZW5naW5lPzogRW5naW5lKTogdm9pZCB7XG4gICAgaWYgKCFSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuaXNJbml0aWFsaXplZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBzdGF0ZXMgPVxuICAgICAgZW5naW5lICE9IG51bGxcbiAgICAgICAgPyBbUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9fZ2V0V29ybGRTdGF0ZShlbmdpbmUpXVxuICAgICAgICA6IFJhcGllclBoeXNpY3NTdHJhdGVneS5fX3dvcmxkU3RhdGVzLnNpemUgPiAwXG4gICAgICAgICAgPyBbLi4uUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9fd29ybGRTdGF0ZXMudmFsdWVzKCldXG4gICAgICAgICAgOiBbUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9fZ2V0V29ybGRTdGF0ZSgpXTtcbiAgICBjb25zdCBzYWZlRGVsdGFUaW1lID0gTnVtYmVyLmlzRmluaXRlKGRlbHRhVGltZSkgPyBNYXRoLm1heChkZWx0YVRpbWUsIDApIDogUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9fZGVmYXVsdFRpbWVzdGVwO1xuICAgIGNvbnN0IHRpbWVzdGVwID0gTWF0aC5taW4oc2FmZURlbHRhVGltZSwgUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9fbWF4VGltZXN0ZXApO1xuICAgIGZvciAoY29uc3Qgc3RhdGUgb2Ygc3RhdGVzKSB7XG4gICAgICBpZiAoZnJhbWVJZCAhPSBudWxsICYmIHN0YXRlLmxhc3RGcmFtZUlkID09PSBmcmFtZUlkKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgc3RhdGUubGFzdEZyYW1lSWQgPSBmcmFtZUlkO1xuICAgICAgc3RhdGUud29ybGQudGltZXN0ZXAgPSB0aW1lc3RlcDtcblxuICAgICAgZm9yIChjb25zdCBbcGFydGljaXBhbnQsIHBhcnRpY2lwYW50RW5naW5lXSBvZiBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX19zdGVwUGFydGljaXBhbnRzKSB7XG4gICAgICAgIGlmIChwYXJ0aWNpcGFudEVuZ2luZSA9PT0gc3RhdGUuZW5naW5lKSB7XG4gICAgICAgICAgcGFydGljaXBhbnQucHJlU3RlcCh0aW1lc3RlcCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIFRyaWdnZXJDb21wb25lbnQuX2JlZ2luUGh5c2ljc1N0ZXAoc3RhdGUuZW5naW5lKTtcbiAgICAgIHN0YXRlLndvcmxkLnN0ZXAoc3RhdGUuZXZlbnRRdWV1ZSk7XG4gICAgICBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX19kcmFpbkNvbGxpc2lvbkV2ZW50cyhzdGF0ZSk7XG4gICAgICBUcmlnZ2VyQ29tcG9uZW50Ll9maW5hbGl6ZVJlYnVpbHRPdmVybGFwcyhzdGF0ZS5lbmdpbmUpO1xuICAgICAgZm9yIChjb25zdCBbcGFydGljaXBhbnQsIHBhcnRpY2lwYW50RW5naW5lXSBvZiBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX19zdGVwUGFydGljaXBhbnRzKSB7XG4gICAgICAgIGlmIChwYXJ0aWNpcGFudEVuZ2luZSA9PT0gc3RhdGUuZW5naW5lKSB7XG4gICAgICAgICAgcGFydGljaXBhbnQucG9zdFN0ZXAoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgVHJpZ2dlckNvbXBvbmVudC5fcHVibGlzaFN0YXlFdmVudHMoc3RhdGUuZW5naW5lKTtcbiAgICB9XG4gIH1cblxuICAvKiogQGludGVybmFsIFJlZ2lzdGVycyBjb2xsaWRlcnMgY3JlYXRlZCBvdXRzaWRlIFBoeXNpY3NDb21wb25lbnQsIHN1Y2ggYXMgYSBjaGFyYWN0ZXIgY29udHJvbGxlci4gKi9cbiAgc3RhdGljIF9yZWdpc3RlckV4dGVybmFsQ29sbGlkZXIoY29sbGlkZXI6IFJhcGllckNvbGxpZGVyTGlrZSwgZW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eSk6IHZvaWQge1xuICAgIGlmIChjb2xsaWRlci5oYW5kbGUgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fX2dldFdvcmxkU3RhdGUoZW50aXR5LmVuZ2luZSkuY29sbGlkZXJNZXRhZGF0YS5zZXQoY29sbGlkZXIuaGFuZGxlLCB7IGVudGl0eSwgaXNTZW5zb3I6IGZhbHNlIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgc3RhdGljIF91bnJlZ2lzdGVyRXh0ZXJuYWxDb2xsaWRlcihcbiAgICBjb2xsaWRlcjogUmFwaWVyQ29sbGlkZXJMaWtlIHwgdW5kZWZpbmVkLFxuICAgIGVuZ2luZT86IEVuZ2luZSxcbiAgICBpc1JlYnVpbGRpbmcgPSBmYWxzZVxuICApOiB2b2lkIHtcbiAgICBpZiAoY29sbGlkZXI/LmhhbmRsZSAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9fdW5yZWdpc3RlckNvbGxpZGVyTWV0YWRhdGEodGhpcy5fX2dldFdvcmxkU3RhdGUoZW5naW5lKSwgY29sbGlkZXIuaGFuZGxlLCBpc1JlYnVpbGRpbmcpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fdW5yZWdpc3RlckNvbGxpZGVyTWV0YWRhdGEoc3RhdGU6IFJhcGllcldvcmxkU3RhdGUsIGhhbmRsZTogbnVtYmVyLCBpc1JlYnVpbGRpbmcgPSBmYWxzZSk6IHZvaWQge1xuICAgIGNvbnN0IG1ldGFkYXRhID0gc3RhdGUuY29sbGlkZXJNZXRhZGF0YS5nZXQoaGFuZGxlKTtcbiAgICBpZiAobWV0YWRhdGEgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoaXNSZWJ1aWxkaW5nKSB7XG4gICAgICBpZiAobWV0YWRhdGEuaXNTZW5zb3IgJiYgbWV0YWRhdGEuYmluZGluZ0lkICE9IG51bGwpIHtcbiAgICAgICAgVHJpZ2dlckNvbXBvbmVudC5fc3VzcGVuZFNlbnNvckJpbmRpbmcobWV0YWRhdGEuZW50aXR5LmVuZ2luZSwgbWV0YWRhdGEuZW50aXR5LmVudGl0eVVJRCwgbWV0YWRhdGEuYmluZGluZ0lkKTtcbiAgICAgIH1cbiAgICAgIFRyaWdnZXJDb21wb25lbnQuX3N1c3BlbmRPdGhlckJpbmRpbmcobWV0YWRhdGEuZW50aXR5LCBtZXRhZGF0YS5iaW5kaW5nSWQsIGhhbmRsZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChtZXRhZGF0YS5pc1NlbnNvciAmJiBtZXRhZGF0YS5iaW5kaW5nSWQgIT0gbnVsbCkge1xuICAgICAgICBUcmlnZ2VyQ29tcG9uZW50Ll9kZWFjdGl2YXRlU2Vuc29yQmluZGluZyhcbiAgICAgICAgICBtZXRhZGF0YS5lbnRpdHkuZW5naW5lLFxuICAgICAgICAgIG1ldGFkYXRhLmVudGl0eS5lbnRpdHlVSUQsXG4gICAgICAgICAgbWV0YWRhdGEuYmluZGluZ0lkXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBUcmlnZ2VyQ29tcG9uZW50Ll9kZWFjdGl2YXRlT3RoZXJCaW5kaW5nKG1ldGFkYXRhLmVudGl0eSwgbWV0YWRhdGEuYmluZGluZ0lkLCBoYW5kbGUpO1xuICAgIH1cbiAgICBzdGF0ZS5jb2xsaWRlck1ldGFkYXRhLmRlbGV0ZShoYW5kbGUpO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19kcmFpbkNvbGxpc2lvbkV2ZW50cyhzdGF0ZTogUmFwaWVyV29ybGRTdGF0ZSk6IHZvaWQge1xuICAgIHN0YXRlLmV2ZW50UXVldWU/LmRyYWluQ29sbGlzaW9uRXZlbnRzKChoYW5kbGUxLCBoYW5kbGUyLCBzdGFydGVkKSA9PiB7XG4gICAgICBjb25zdCBmaXJzdCA9IHN0YXRlLmNvbGxpZGVyTWV0YWRhdGEuZ2V0KGhhbmRsZTEpO1xuICAgICAgY29uc3Qgc2Vjb25kID0gc3RhdGUuY29sbGlkZXJNZXRhZGF0YS5nZXQoaGFuZGxlMik7XG4gICAgICBpZiAoZmlyc3QgPT0gbnVsbCB8fCBzZWNvbmQgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoZmlyc3QuaXNTZW5zb3IgJiYgZmlyc3QuYmluZGluZ0lkICE9IG51bGwpIHtcbiAgICAgICAgVHJpZ2dlckNvbXBvbmVudC5fcHJvY2Vzc092ZXJsYXAoXG4gICAgICAgICAgZmlyc3QuZW50aXR5LmVuZ2luZSxcbiAgICAgICAgICBmaXJzdC5lbnRpdHkuZW50aXR5VUlELFxuICAgICAgICAgIGZpcnN0LmJpbmRpbmdJZCxcbiAgICAgICAgICBzZWNvbmQuZW50aXR5LFxuICAgICAgICAgIHNlY29uZC5iaW5kaW5nSWQsXG4gICAgICAgICAgc3RhcnRlZCxcbiAgICAgICAgICBoYW5kbGUyXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBpZiAoc2Vjb25kLmlzU2Vuc29yICYmIHNlY29uZC5iaW5kaW5nSWQgIT0gbnVsbCkge1xuICAgICAgICBUcmlnZ2VyQ29tcG9uZW50Ll9wcm9jZXNzT3ZlcmxhcChcbiAgICAgICAgICBzZWNvbmQuZW50aXR5LmVuZ2luZSxcbiAgICAgICAgICBzZWNvbmQuZW50aXR5LmVudGl0eVVJRCxcbiAgICAgICAgICBzZWNvbmQuYmluZGluZ0lkLFxuICAgICAgICAgIGZpcnN0LmVudGl0eSxcbiAgICAgICAgICBmaXJzdC5iaW5kaW5nSWQsXG4gICAgICAgICAgc3RhcnRlZCxcbiAgICAgICAgICBoYW5kbGUxXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIHN0YXRpYyBfcmVnaXN0ZXJTdGVwUGFydGljaXBhbnQocGFydGljaXBhbnQ6IFJhcGllclN0ZXBQYXJ0aWNpcGFudCwgZW5naW5lOiBFbmdpbmUpOiB2b2lkIHtcbiAgICBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX19zdGVwUGFydGljaXBhbnRzLnNldChwYXJ0aWNpcGFudCwgZW5naW5lKTtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgc3RhdGljIF91bnJlZ2lzdGVyU3RlcFBhcnRpY2lwYW50KHBhcnRpY2lwYW50OiBSYXBpZXJTdGVwUGFydGljaXBhbnQpOiB2b2lkIHtcbiAgICBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX19zdGVwUGFydGljaXBhbnRzLmRlbGV0ZShwYXJ0aWNpcGFudCk7XG4gIH1cblxuICAvKiogQGludGVybmFsIFJlbGVhc2VzIHRoZSBSYXBpZXIgd29ybGQgb3duZWQgYnkgYSBkZXN0cm95ZWQgRW5naW5lLiAqL1xuICBzdGF0aWMgX2NsZWFudXBGb3JFbmdpbmUoZW5naW5lOiBFbmdpbmUpOiB2b2lkIHtcbiAgICBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX19kaXNwb3NlV29ybGRTdGF0ZShSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX193b3JsZFN0YXRlcy5nZXQoZW5naW5lKSk7XG4gICAgUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9fd29ybGRTdGF0ZXMuZGVsZXRlKGVuZ2luZSk7XG4gICAgZm9yIChjb25zdCBbcGFydGljaXBhbnQsIHBhcnRpY2lwYW50RW5naW5lXSBvZiBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX19zdGVwUGFydGljaXBhbnRzKSB7XG4gICAgICBpZiAocGFydGljaXBhbnRFbmdpbmUgPT09IGVuZ2luZSkge1xuICAgICAgICBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX19zdGVwUGFydGljaXBhbnRzLmRlbGV0ZShwYXJ0aWNpcGFudCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBzdGF0aWMgX2dldFJhcGllcigpOiBSYXBpZXJQaHlzaWNzTW9kdWxlTGlrZSB7XG4gICAgcmV0dXJuIFJhcGllclBoeXNpY3NTdHJhdGVneS5fX2dldFJhcGllcigpO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBzdGF0aWMgX2dldFdvcmxkKGVuZ2luZT86IEVuZ2luZSk6IFJhcGllcldvcmxkTGlrZSB7XG4gICAgcmV0dXJuIFJhcGllclBoeXNpY3NTdHJhdGVneS5fX2dldFdvcmxkKGVuZ2luZSk7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIHN0YXRpYyBfZ2V0Q29sbGlkZXJNZXRhZGF0YShjb2xsaWRlcjogUmFwaWVyQ29sbGlkZXJMaWtlLCBlbmdpbmU/OiBFbmdpbmUpOiBSYXBpZXJDb2xsaWRlck1ldGFkYXRhIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gY29sbGlkZXIuaGFuZGxlID09IG51bGxcbiAgICAgID8gdW5kZWZpbmVkXG4gICAgICA6IFJhcGllclBoeXNpY3NTdHJhdGVneS5fX2dldFdvcmxkU3RhdGUoZW5naW5lKS5jb2xsaWRlck1ldGFkYXRhLmdldChjb2xsaWRlci5oYW5kbGUpO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBzdGF0aWMgX3BhY2tDb2xsaXNpb25Hcm91cHMoZ3JvdXA6IG51bWJlciwgbWFzazogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9fcGFja0NvbGxpc2lvbkdyb3Vwcyhncm91cCwgbWFzayk7XG4gIH1cblxuICBwcml2YXRlIF9fY3JlYXRlQm9keShcbiAgICBwcm9wOiBTdG9yZWRQaHlzaWNzUHJvcGVydHksXG4gICAgc2l6ZTogSVZlY3RvcjMsXG4gICAgcG9zaXRpb246IElWZWN0b3IzLFxuICAgIHJvdGF0aW9uOiBJUXVhdGVybmlvbixcbiAgICBwcmVzZXJ2ZWRTdGF0ZT86IFByZXNlcnZlZER5bmFtaWNCb2R5U3RhdGVcbiAgKTogdm9pZCB7XG4gICAgY29uc3QgcmFwaWVyID0gUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9fZ2V0UmFwaWVyKCk7XG4gICAgY29uc3Qgc3RhdGUgPSBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX19nZXRXb3JsZFN0YXRlKHRoaXMuX19lbnRpdHk/LmVuZ2luZSk7XG4gICAgY29uc3Qgd29ybGQgPSBzdGF0ZS53b3JsZDtcbiAgICBjb25zdCBtb3Rpb24gPSB0aGlzLl9fbW90aW9uO1xuICAgIGNvbnN0IGlzS2luZW1hdGljID0gdGhpcy5fX2lzS2luZW1hdGljQm9keSgpO1xuICAgIGNvbnN0IHJpZ2lkQm9keURlc2MgPSBpc0tpbmVtYXRpY1xuICAgICAgPyByYXBpZXIuUmlnaWRCb2R5RGVzYy5raW5lbWF0aWNQb3NpdGlvbkJhc2VkISgpXG4gICAgICA6IHByb3AubW92ZVxuICAgICAgICA/IHJhcGllci5SaWdpZEJvZHlEZXNjLmR5bmFtaWMoKVxuICAgICAgICA6IHJhcGllci5SaWdpZEJvZHlEZXNjLmZpeGVkKCk7XG4gICAgcmlnaWRCb2R5RGVzY1xuICAgICAgLnNldFRyYW5zbGF0aW9uKHBvc2l0aW9uLngsIHBvc2l0aW9uLnksIHBvc2l0aW9uLnopXG4gICAgICAuc2V0Um90YXRpb24oUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9fdG9SYXBpZXJRdWF0ZXJuaW9uKHJvdGF0aW9uKSk7XG5cbiAgICBpZiAocHJvcC5tb3ZlICYmICFpc0tpbmVtYXRpYykge1xuICAgICAgY29uc3QgdmVsb2NpdHlSb3RhdGlvbiA9XG4gICAgICAgIHRoaXMuX19lbnRpdHk/LmdldFNjZW5lR3JhcGgoKS5nZXRRdWF0ZXJuaW9uUmVjdXJzaXZlbHlUbyh0aGlzLl9fdG1wV29ybGRSb3RhdGlvbikgPz8gcm90YXRpb247XG4gICAgICBjb25zdCBsaW5lYXJWZWxvY2l0eSA9XG4gICAgICAgIHByZXNlcnZlZFN0YXRlPy5saW5lYXJWZWxvY2l0eSA/P1xuICAgICAgICAobW90aW9uPy5saW5lYXJWZWxvY2l0eSA9PSBudWxsXG4gICAgICAgICAgPyB1bmRlZmluZWRcbiAgICAgICAgICA6IHZlbG9jaXR5Um90YXRpb24udHJhbnNmb3JtVmVjdG9yM1RvKG1vdGlvbi5saW5lYXJWZWxvY2l0eSwgdGhpcy5fX3RtcExpbmVhclZlbG9jaXR5KSk7XG4gICAgICBjb25zdCBhbmd1bGFyVmVsb2NpdHkgPVxuICAgICAgICBwcmVzZXJ2ZWRTdGF0ZT8uYW5ndWxhclZlbG9jaXR5ID8/XG4gICAgICAgIChtb3Rpb24/LmFuZ3VsYXJWZWxvY2l0eSA9PSBudWxsXG4gICAgICAgICAgPyB1bmRlZmluZWRcbiAgICAgICAgICA6IHZlbG9jaXR5Um90YXRpb24udHJhbnNmb3JtVmVjdG9yM1RvKG1vdGlvbi5hbmd1bGFyVmVsb2NpdHksIHRoaXMuX190bXBBbmd1bGFyVmVsb2NpdHkpKTtcbiAgICAgIGlmIChsaW5lYXJWZWxvY2l0eSAhPSBudWxsKSB7XG4gICAgICAgIHJpZ2lkQm9keURlc2Muc2V0TGludmVsPy4obGluZWFyVmVsb2NpdHkueCwgbGluZWFyVmVsb2NpdHkueSwgbGluZWFyVmVsb2NpdHkueik7XG4gICAgICB9XG4gICAgICBpZiAoYW5ndWxhclZlbG9jaXR5ICE9IG51bGwpIHtcbiAgICAgICAgcmlnaWRCb2R5RGVzYy5zZXRBbmd2ZWw/Lih7IHg6IGFuZ3VsYXJWZWxvY2l0eS54LCB5OiBhbmd1bGFyVmVsb2NpdHkueSwgejogYW5ndWxhclZlbG9jaXR5LnogfSk7XG4gICAgICB9XG4gICAgICBpZiAobW90aW9uPy5ncmF2aXR5RmFjdG9yICE9IG51bGwpIHtcbiAgICAgICAgcmlnaWRCb2R5RGVzYy5zZXRHcmF2aXR5U2NhbGU/Lihtb3Rpb24uZ3Jhdml0eUZhY3Rvcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fX3JpZ2lkQm9keSA9IHdvcmxkLmNyZWF0ZVJpZ2lkQm9keShyaWdpZEJvZHlEZXNjKTtcbiAgICBpZiAodGhpcy5fX3NoYXBlQmluZGluZ3MgIT0gbnVsbCkge1xuICAgICAgZm9yIChjb25zdCBiaW5kaW5nIG9mIHRoaXMuX19zaGFwZUJpbmRpbmdzKSB7XG4gICAgICAgIGNvbnN0IGNvbGxpZGVyRGVzYyA9IHRoaXMuX19jcmVhdGVTaGFwZUluc3RhbmNlQ29sbGlkZXJEZXNjKGJpbmRpbmcsIHN0YXRlLmV2ZW50UXVldWUgIT0gbnVsbCk7XG4gICAgICAgIGNvbnN0IGNvbGxpZGVyID0gd29ybGQuY3JlYXRlQ29sbGlkZXIoY29sbGlkZXJEZXNjLCB0aGlzLl9fcmlnaWRCb2R5KTtcbiAgICAgICAgdGhpcy5fX2NvbGxpZGVycy5wdXNoKGNvbGxpZGVyKTtcbiAgICAgICAgaWYgKGNvbGxpZGVyLmhhbmRsZSAhPSBudWxsICYmIHRoaXMuX19lbnRpdHkgIT0gbnVsbCkge1xuICAgICAgICAgIHN0YXRlLmNvbGxpZGVyTWV0YWRhdGEuc2V0KGNvbGxpZGVyLmhhbmRsZSwge1xuICAgICAgICAgICAgZW50aXR5OiB0aGlzLl9fZW50aXR5LFxuICAgICAgICAgICAgYmluZGluZ0lkOiBiaW5kaW5nLmJpbmRpbmdJZCxcbiAgICAgICAgICAgIGlzU2Vuc29yOiBiaW5kaW5nLmNvbGxpZGVyLmlzU2Vuc29yID8/IGZhbHNlLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLl9fYXBwbHlDb21wbGV0ZU1hc3NQcm9wZXJ0aWVzKHByb3AubW92ZSwgaXNLaW5lbWF0aWMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBjb2xsaWRlciA9IHdvcmxkLmNyZWF0ZUNvbGxpZGVyKHRoaXMuX19jcmVhdGVDb2xsaWRlckRlc2MocHJvcCwgc2l6ZSksIHRoaXMuX19yaWdpZEJvZHkpO1xuICAgICAgdGhpcy5fX2NvbGxpZGVycy5wdXNoKGNvbGxpZGVyKTtcbiAgICAgIGlmIChjb2xsaWRlci5oYW5kbGUgIT0gbnVsbCAmJiB0aGlzLl9fZW50aXR5ICE9IG51bGwpIHtcbiAgICAgICAgc3RhdGUuY29sbGlkZXJNZXRhZGF0YS5zZXQoY29sbGlkZXIuaGFuZGxlLCB7XG4gICAgICAgICAgZW50aXR5OiB0aGlzLl9fZW50aXR5LFxuICAgICAgICAgIGlzU2Vuc29yOiBmYWxzZSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfX2lzS2luZW1hdGljQm9keSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fX21vdGlvbj8uaXNLaW5lbWF0aWMgPz8gdGhpcy5fX3NoYXBlQmluZGluZ3M/LlswXT8uYm9keS5pc0tpbmVtYXRpYyA/PyBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgX19jYXB0dXJlRHluYW1pY0JvZHlTdGF0ZSgpOiBQcmVzZXJ2ZWREeW5hbWljQm9keVN0YXRlIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAodGhpcy5fX3JpZ2lkQm9keSA9PSBudWxsIHx8ICF0aGlzLl9fcHJvcGVydHk/Lm1vdmUgfHwgdGhpcy5fX2lzS2luZW1hdGljQm9keSgpKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBjb25zdCBsaW5lYXJWZWxvY2l0eSA9IHRoaXMuX19yaWdpZEJvZHkubGludmVsPy4oKTtcbiAgICBjb25zdCBhbmd1bGFyVmVsb2NpdHkgPSB0aGlzLl9fcmlnaWRCb2R5LmFuZ3ZlbD8uKCk7XG4gICAgaWYgKGxpbmVhclZlbG9jaXR5ID09IG51bGwgfHwgYW5ndWxhclZlbG9jaXR5ID09IG51bGwpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBsaW5lYXJWZWxvY2l0eTogeyB4OiBsaW5lYXJWZWxvY2l0eS54LCB5OiBsaW5lYXJWZWxvY2l0eS55LCB6OiBsaW5lYXJWZWxvY2l0eS56IH0sXG4gICAgICBhbmd1bGFyVmVsb2NpdHk6IHsgeDogYW5ndWxhclZlbG9jaXR5LngsIHk6IGFuZ3VsYXJWZWxvY2l0eS55LCB6OiBhbmd1bGFyVmVsb2NpdHkueiB9LFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIF9fYXBwbHlDb21wbGV0ZU1hc3NQcm9wZXJ0aWVzKG1vdmU6IGJvb2xlYW4sIGlzS2luZW1hdGljOiBib29sZWFuKTogdm9pZCB7XG4gICAgY29uc3QgbW90aW9uID0gdGhpcy5fX21vdGlvbjtcbiAgICBjb25zdCByaWdpZEJvZHkgPSB0aGlzLl9fcmlnaWRCb2R5O1xuICAgIGlmIChtb3Rpb24gPT0gbnVsbCB8fCByaWdpZEJvZHkgPT0gbnVsbCB8fCAhbW92ZSB8fCBpc0tpbmVtYXRpYykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBoYXNPbmx5U2Vuc29yQ29sbGlkZXJzID0gdGhpcy5fX3NoYXBlQmluZGluZ3M/LmV2ZXJ5KGJpbmRpbmcgPT4gYmluZGluZy5jb2xsaWRlci5pc1NlbnNvciA9PT0gdHJ1ZSkgPT09IHRydWU7XG4gICAgY29uc3QgZGVyaXZlc1NlbnNvck9ubHlNYXNzID0gaGFzT25seVNlbnNvckNvbGxpZGVycyAmJiBtb3Rpb24ubWFzcyA9PSBudWxsO1xuICAgIGNvbnN0IG5lZWRzQ29tcGxldGVNYXNzUHJvcGVydGllcyA9XG4gICAgICBkZXJpdmVzU2Vuc29yT25seU1hc3MgfHxcbiAgICAgIG1vdGlvbi5tYXNzID09PSAwIHx8XG4gICAgICAoaGFzT25seVNlbnNvckNvbGxpZGVycyAmJiBtb3Rpb24ubWFzcyAhPSBudWxsICYmIG1vdGlvbi5tYXNzID4gMCkgfHxcbiAgICAgIG1vdGlvbi5jZW50ZXJPZk1hc3MgIT0gbnVsbCB8fFxuICAgICAgbW90aW9uLmluZXJ0aWFEaWFnb25hbCAhPSBudWxsIHx8XG4gICAgICBtb3Rpb24uaW5lcnRpYU9yaWVudGF0aW9uICE9IG51bGw7XG4gICAgaWYgKCFuZWVkc0NvbXBsZXRlTWFzc1Byb3BlcnRpZXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgcmlnaWRCb2R5Lm1hc3MgPT0gbnVsbCB8fFxuICAgICAgcmlnaWRCb2R5LmxvY2FsQ29tID09IG51bGwgfHxcbiAgICAgIHJpZ2lkQm9keS5wcmluY2lwYWxJbmVydGlhID09IG51bGwgfHxcbiAgICAgIHJpZ2lkQm9keS5wcmluY2lwYWxJbmVydGlhTG9jYWxGcmFtZSA9PSBudWxsIHx8XG4gICAgICByaWdpZEJvZHkucmVjb21wdXRlTWFzc1Byb3BlcnRpZXNGcm9tQ29sbGlkZXJzID09IG51bGwgfHxcbiAgICAgIHJpZ2lkQm9keS5zZXRBZGRpdGlvbmFsTWFzc1Byb3BlcnRpZXMgPT0gbnVsbCB8fFxuICAgICAgdGhpcy5fX2NvbGxpZGVycy5zb21lKGNvbGxpZGVyID0+IGNvbGxpZGVyLnNldERlbnNpdHkgPT0gbnVsbClcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGluamVjdGVkIFJhcGllciBtb2R1bGUgZG9lcyBub3Qgc3VwcG9ydCBjb21wbGV0ZSByaWdpZC1ib2R5IG1hc3MgcHJvcGVydGllcy4nKTtcbiAgICB9XG5cbiAgICBpZiAoZGVyaXZlc1NlbnNvck9ubHlNYXNzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX19jb2xsaWRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5fX2NvbGxpZGVyc1tpXS5zZXREZW5zaXR5ISh0aGlzLl9fc2hhcGVCaW5kaW5ncyFbaV0uYm9keS5kZW5zaXR5KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmlnaWRCb2R5LnJlY29tcHV0ZU1hc3NQcm9wZXJ0aWVzRnJvbUNvbGxpZGVycygpO1xuICAgIGNvbnN0IGF1dG9tYXRpY01hc3MgPSByaWdpZEJvZHkubWFzcygpO1xuICAgIGNvbnN0IGF1dG9tYXRpY0NlbnRlck9mTWFzcyA9IHJpZ2lkQm9keS5sb2NhbENvbSgpO1xuICAgIGNvbnN0IGF1dG9tYXRpY0luZXJ0aWEgPSByaWdpZEJvZHkucHJpbmNpcGFsSW5lcnRpYSgpO1xuICAgIGNvbnN0IGF1dG9tYXRpY0luZXJ0aWFPcmllbnRhdGlvbiA9IHJpZ2lkQm9keS5wcmluY2lwYWxJbmVydGlhTG9jYWxGcmFtZSgpO1xuICAgIGZvciAoY29uc3QgY29sbGlkZXIgb2YgdGhpcy5fX2NvbGxpZGVycykge1xuICAgICAgY29sbGlkZXIuc2V0RGVuc2l0eSEoMCk7XG4gICAgfVxuICAgIHJpZ2lkQm9keS5yZWNvbXB1dGVNYXNzUHJvcGVydGllc0Zyb21Db2xsaWRlcnMoKTtcbiAgICBjb25zdCBjZW50ZXJPZk1hc3MgPSBtb3Rpb24uY2VudGVyT2ZNYXNzID8/IGF1dG9tYXRpY0NlbnRlck9mTWFzcztcbiAgICBjb25zdCBpbmVydGlhID0gbW90aW9uLmluZXJ0aWFEaWFnb25hbCA/PyBhdXRvbWF0aWNJbmVydGlhO1xuICAgIGNvbnN0IGluZXJ0aWFPcmllbnRhdGlvbiA9IG1vdGlvbi5pbmVydGlhT3JpZW50YXRpb24gPz8gYXV0b21hdGljSW5lcnRpYU9yaWVudGF0aW9uO1xuICAgIHJpZ2lkQm9keS5zZXRBZGRpdGlvbmFsTWFzc1Byb3BlcnRpZXMoXG4gICAgICBtb3Rpb24ubWFzcyA/PyBhdXRvbWF0aWNNYXNzLFxuICAgICAgeyB4OiBjZW50ZXJPZk1hc3MueCwgeTogY2VudGVyT2ZNYXNzLnksIHo6IGNlbnRlck9mTWFzcy56IH0sXG4gICAgICB7IHg6IGluZXJ0aWEueCwgeTogaW5lcnRpYS55LCB6OiBpbmVydGlhLnogfSxcbiAgICAgIHtcbiAgICAgICAgeDogaW5lcnRpYU9yaWVudGF0aW9uLngsXG4gICAgICAgIHk6IGluZXJ0aWFPcmllbnRhdGlvbi55LFxuICAgICAgICB6OiBpbmVydGlhT3JpZW50YXRpb24ueixcbiAgICAgICAgdzogaW5lcnRpYU9yaWVudGF0aW9uLncsXG4gICAgICB9LFxuICAgICAgZmFsc2VcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2NyZWF0ZUNvbGxpZGVyRGVzYyhwcm9wOiBTdG9yZWRQaHlzaWNzUHJvcGVydHksIHNpemU6IElWZWN0b3IzKTogUmFwaWVyQ29sbGlkZXJEZXNjTGlrZSB7XG4gICAgY29uc3QgcmFwaWVyID0gUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9fZ2V0UmFwaWVyKCk7XG4gICAgbGV0IGNvbGxpZGVyRGVzYzogUmFwaWVyQ29sbGlkZXJEZXNjTGlrZTtcblxuICAgIGlmIChwcm9wLnR5cGUgPT09IFBoeXNpY3NTaGFwZS5Cb3gpIHtcbiAgICAgIGNvbGxpZGVyRGVzYyA9IHJhcGllci5Db2xsaWRlckRlc2MuY3Vib2lkKHNpemUueCAqIDAuNSwgc2l6ZS55ICogMC41LCBzaXplLnogKiAwLjUpO1xuICAgIH0gZWxzZSBpZiAocHJvcC50eXBlID09PSBQaHlzaWNzU2hhcGUuU3BoZXJlKSB7XG4gICAgICBjb2xsaWRlckRlc2MgPSByYXBpZXIuQ29sbGlkZXJEZXNjLmJhbGwoc2l6ZS54KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBSYXBpZXIgcGh5c2ljcyBzaGFwZTogJHtwcm9wLnR5cGUuc3RyfWApO1xuICAgIH1cblxuICAgIGNvbGxpZGVyRGVzYyA9IGNvbGxpZGVyRGVzYy5zZXREZW5zaXR5Py4ocHJvcC5kZW5zaXR5KSA/PyBjb2xsaWRlckRlc2M7XG4gICAgY29sbGlkZXJEZXNjID0gY29sbGlkZXJEZXNjLnNldEZyaWN0aW9uPy4ocHJvcC5mcmljdGlvbikgPz8gY29sbGlkZXJEZXNjO1xuICAgIGNvbGxpZGVyRGVzYyA9IGNvbGxpZGVyRGVzYy5zZXRSZXN0aXR1dGlvbj8uKHByb3AucmVzdGl0dXRpb24pID8/IGNvbGxpZGVyRGVzYztcbiAgICBjb2xsaWRlckRlc2MgPVxuICAgICAgY29sbGlkZXJEZXNjLnNldFRyYW5zbGF0aW9uPy4oXG4gICAgICAgIHRoaXMuX19zaGFwZUxvY2FsUG9zaXRpb24ueCAqIE1hdGguYWJzKHNpemUueCAvIHRoaXMuX19sb2NhbFNjYWxlLngpLFxuICAgICAgICB0aGlzLl9fc2hhcGVMb2NhbFBvc2l0aW9uLnkgKiBNYXRoLmFicyhzaXplLnkgLyB0aGlzLl9fbG9jYWxTY2FsZS55KSxcbiAgICAgICAgdGhpcy5fX3NoYXBlTG9jYWxQb3NpdGlvbi56ICogTWF0aC5hYnMoc2l6ZS56IC8gdGhpcy5fX2xvY2FsU2NhbGUueilcbiAgICAgICkgPz8gY29sbGlkZXJEZXNjO1xuICAgIGNvbGxpZGVyRGVzYyA9XG4gICAgICBjb2xsaWRlckRlc2Muc2V0Um90YXRpb24/LihSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX190b1JhcGllclF1YXRlcm5pb24odGhpcy5fX3NoYXBlTG9jYWxSb3RhdGlvbikpID8/IGNvbGxpZGVyRGVzYztcbiAgICByZXR1cm4gY29sbGlkZXJEZXNjO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2NyZWF0ZVNoYXBlSW5zdGFuY2VDb2xsaWRlckRlc2MoXG4gICAgYmluZGluZzogUGh5c2ljc1NoYXBlSW5zdGFuY2VCaW5kaW5nLFxuICAgIGhhc0V2ZW50UXVldWU6IGJvb2xlYW5cbiAgKTogUmFwaWVyQ29sbGlkZXJEZXNjTGlrZSB7XG4gICAgY29uc3QgcmFwaWVyID0gUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9fZ2V0UmFwaWVyKCk7XG4gICAgY29uc3Qgc2hhcGVJbnN0YW5jZSA9IGJpbmRpbmcuc2hhcGU7XG4gICAgY29uc3Qgc2hhcGUgPSBzaGFwZUluc3RhbmNlLnNoYXBlO1xuICAgIGNvbnN0IHNjYWxlID0gdGhpcy5fX3NoYXBlV29ybGRTaWduZWRTY2FsZTtcbiAgICBjb25zdCBhYnNvbHV0ZVNjYWxlID0gdGhpcy5fX3NoYXBlV29ybGRTY2FsZTtcbiAgICBsZXQgY29sbGlkZXJEZXNjOiBSYXBpZXJDb2xsaWRlckRlc2NMaWtlO1xuICAgIGxldCBjb2xsaWRlclJvdGF0aW9uID0gc2hhcGVJbnN0YW5jZS5sb2NhbFJvdGF0aW9uO1xuXG4gICAgaWYgKHNoYXBlLnR5cGUgPT09ICdib3gnKSB7XG4gICAgICBjb25zdCByZXNvbHZlZEJveCA9IHRoaXMuX19yZXNvbHZlQm94Q29sbGlkZXIoc2hhcGVJbnN0YW5jZSk7XG4gICAgICBjb2xsaWRlckRlc2MgPSByYXBpZXIuQ29sbGlkZXJEZXNjLmN1Ym9pZChcbiAgICAgICAgcmVzb2x2ZWRCb3guaGFsZkV4dGVudHMueCxcbiAgICAgICAgcmVzb2x2ZWRCb3guaGFsZkV4dGVudHMueSxcbiAgICAgICAgcmVzb2x2ZWRCb3guaGFsZkV4dGVudHMuelxuICAgICAgKTtcbiAgICAgIGNvbGxpZGVyUm90YXRpb24gPSByZXNvbHZlZEJveC5yb3RhdGlvbjtcbiAgICB9IGVsc2UgaWYgKHNoYXBlLnR5cGUgPT09ICdzcGhlcmUnKSB7XG4gICAgICBjb25zdCByYWRpYWxTY2FsZSA9IE1hdGgubWF4KGFic29sdXRlU2NhbGUueCwgYWJzb2x1dGVTY2FsZS55LCBhYnNvbHV0ZVNjYWxlLnopO1xuICAgICAgdGhpcy5fX3dhcm5Ob25Vbmlmb3JtU2NhbGVJZk5lZWRlZChzaGFwZS50eXBlLCBhYnNvbHV0ZVNjYWxlKTtcbiAgICAgIGNvbGxpZGVyRGVzYyA9IHJhcGllci5Db2xsaWRlckRlc2MuYmFsbChzaGFwZS5yYWRpdXMgKiByYWRpYWxTY2FsZSk7XG4gICAgfSBlbHNlIGlmIChzaGFwZS50eXBlID09PSAnY3lsaW5kZXInKSB7XG4gICAgICBpZiAocmFwaWVyLkNvbGxpZGVyRGVzYy5jeWxpbmRlciA9PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGluamVjdGVkIFJhcGllciBtb2R1bGUgZG9lcyBub3Qgc3VwcG9ydCBjeWxpbmRlciBjb2xsaWRlcnMuJyk7XG4gICAgICB9XG4gICAgICBjb25zdCByYWRpdXMgPSB0aGlzLl9fZ2V0QXBwcm94aW1hdGVkUmFkaXVzKHNoYXBlLnJhZGl1c0JvdHRvbSwgc2hhcGUucmFkaXVzVG9wLCBzaGFwZS50eXBlKTtcbiAgICAgIGNvbnN0IHJlc29sdmVkQ3lsaW5kZXIgPSByZXNvbHZlU2NhbGVkQ3lsaW5kZXIoc2hhcGUuaGVpZ2h0LCByYWRpdXMsIHNoYXBlSW5zdGFuY2UubG9jYWxSb3RhdGlvbiwgc2NhbGUpO1xuICAgICAgaWYgKHJlc29sdmVkQ3lsaW5kZXIuYXBwcm94aW1hdGVkKSB7XG4gICAgICAgIHRoaXMuX193YXJuTm9uVW5pZm9ybVNjYWxlSWZOZWVkZWQoc2hhcGUudHlwZSwgYWJzb2x1dGVTY2FsZSk7XG4gICAgICB9XG4gICAgICBjb2xsaWRlckRlc2MgPSByYXBpZXIuQ29sbGlkZXJEZXNjLmN5bGluZGVyKHJlc29sdmVkQ3lsaW5kZXIuaGFsZkhlaWdodCwgcmVzb2x2ZWRDeWxpbmRlci5yYWRpdXMpO1xuICAgICAgY29sbGlkZXJSb3RhdGlvbiA9IHJlc29sdmVkQ3lsaW5kZXIucm90YXRpb247XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChyYXBpZXIuQ29sbGlkZXJEZXNjLmNhcHN1bGUgPT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBpbmplY3RlZCBSYXBpZXIgbW9kdWxlIGRvZXMgbm90IHN1cHBvcnQgY2Fwc3VsZSBjb2xsaWRlcnMuJyk7XG4gICAgICB9XG4gICAgICBjb25zdCByYWRpdXMgPSB0aGlzLl9fZ2V0QXBwcm94aW1hdGVkUmFkaXVzKHNoYXBlLnJhZGl1c0JvdHRvbSwgc2hhcGUucmFkaXVzVG9wLCBzaGFwZS50eXBlKTtcbiAgICAgIGNvbnN0IHJlc29sdmVkQ2Fwc3VsZSA9IHJlc29sdmVTY2FsZWRDYXBzdWxlKHNoYXBlLmhlaWdodCwgcmFkaXVzLCBzaGFwZUluc3RhbmNlLmxvY2FsUm90YXRpb24sIHNjYWxlKTtcbiAgICAgIGlmIChyZXNvbHZlZENhcHN1bGUuYXBwcm94aW1hdGVkKSB7XG4gICAgICAgIHRoaXMuX193YXJuTm9uVW5pZm9ybVNjYWxlSWZOZWVkZWQoc2hhcGUudHlwZSwgYWJzb2x1dGVTY2FsZSk7XG4gICAgICB9XG4gICAgICBjb2xsaWRlckRlc2MgPSByYXBpZXIuQ29sbGlkZXJEZXNjLmNhcHN1bGUocmVzb2x2ZWRDYXBzdWxlLmhhbGZIZWlnaHQsIHJlc29sdmVkQ2Fwc3VsZS5yYWRpdXMpO1xuICAgICAgY29sbGlkZXJSb3RhdGlvbiA9IHJlc29sdmVkQ2Fwc3VsZS5yb3RhdGlvbjtcbiAgICB9XG5cbiAgICBjb25zdCBleHBsaWNpdE1hc3MgPSB0aGlzLl9fbW90aW9uPy5tb3ZlICYmICF0aGlzLl9fbW90aW9uLmlzS2luZW1hdGljID8gdGhpcy5fX21vdGlvbi5tYXNzIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IGRlbnNpdHkgPSBiaW5kaW5nLmNvbGxpZGVyLmlzU2Vuc29yXG4gICAgICA/IDBcbiAgICAgIDogZXhwbGljaXRNYXNzICE9IG51bGwgJiYgZXhwbGljaXRNYXNzID4gMFxuICAgICAgICA/IGV4cGxpY2l0TWFzcyAvXG4gICAgICAgICAgdGhpcy5fX3NoYXBlQmluZGluZ3MhLnJlZHVjZShcbiAgICAgICAgICAgIChzdW0sIGl0ZW0pID0+IChpdGVtLmNvbGxpZGVyLmlzU2Vuc29yID8gc3VtIDogc3VtICsgdGhpcy5fX2dldFNjYWxlZFZvbHVtZShpdGVtKSksXG4gICAgICAgICAgICAwXG4gICAgICAgICAgKVxuICAgICAgICA6IGJpbmRpbmcuYm9keS5kZW5zaXR5O1xuICAgIGNvbGxpZGVyRGVzYyA9IGNvbGxpZGVyRGVzYy5zZXREZW5zaXR5Py4oZGVuc2l0eSkgPz8gY29sbGlkZXJEZXNjO1xuICAgIGNvbGxpZGVyRGVzYyA9IGNvbGxpZGVyRGVzYy5zZXRGcmljdGlvbj8uKGJpbmRpbmcuY29sbGlkZXIuZnJpY3Rpb24pID8/IGNvbGxpZGVyRGVzYztcbiAgICBjb2xsaWRlckRlc2MgPSBjb2xsaWRlckRlc2Muc2V0UmVzdGl0dXRpb24/LihiaW5kaW5nLmNvbGxpZGVyLnJlc3RpdHV0aW9uKSA/PyBjb2xsaWRlckRlc2M7XG4gICAgY29sbGlkZXJEZXNjID1cbiAgICAgIGNvbGxpZGVyRGVzYy5zZXRDb2xsaXNpb25Hcm91cHM/LihcbiAgICAgICAgUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9fcGFja0NvbGxpc2lvbkdyb3VwcyhcbiAgICAgICAgICBiaW5kaW5nLmNvbGxpZGVyLmNvbGxpc2lvbkdyb3VwID8/IDB4ZmZmZixcbiAgICAgICAgICBiaW5kaW5nLmNvbGxpZGVyLmNvbGxpc2lvbk1hc2sgPz8gMHhmZmZmXG4gICAgICAgIClcbiAgICAgICkgPz8gY29sbGlkZXJEZXNjO1xuICAgIGlmIChiaW5kaW5nLmNvbGxpZGVyLmlzU2Vuc29yKSB7XG4gICAgICBjb25zdCBhY3RpdmVFdmVudHMgPSBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX19nZXRSYXBpZXIoKS5BY3RpdmVFdmVudHM/LkNPTExJU0lPTl9FVkVOVFM7XG4gICAgICBjb25zdCBhY3RpdmVDb2xsaXNpb25UeXBlcyA9IFJhcGllclBoeXNpY3NTdHJhdGVneS5fX2dldFJhcGllcigpLkFjdGl2ZUNvbGxpc2lvblR5cGVzPy5BTEw7XG4gICAgICBpZiAoXG4gICAgICAgIGNvbGxpZGVyRGVzYy5zZXRTZW5zb3IgPT0gbnVsbCB8fFxuICAgICAgICBjb2xsaWRlckRlc2Muc2V0QWN0aXZlRXZlbnRzID09IG51bGwgfHxcbiAgICAgICAgYWN0aXZlRXZlbnRzID09IG51bGwgfHxcbiAgICAgICAgY29sbGlkZXJEZXNjLnNldEFjdGl2ZUNvbGxpc2lvblR5cGVzID09IG51bGwgfHxcbiAgICAgICAgYWN0aXZlQ29sbGlzaW9uVHlwZXMgPT0gbnVsbCB8fFxuICAgICAgICAhaGFzRXZlbnRRdWV1ZVxuICAgICAgKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGluamVjdGVkIFJhcGllciBtb2R1bGUgZG9lcyBub3Qgc3VwcG9ydCBzZW5zb3IgY29sbGlzaW9uIGV2ZW50cy4nKTtcbiAgICAgIH1cbiAgICAgIGNvbGxpZGVyRGVzYyA9IGNvbGxpZGVyRGVzYy5zZXRTZW5zb3IodHJ1ZSk7XG4gICAgICBjb2xsaWRlckRlc2MgPSBjb2xsaWRlckRlc2Muc2V0QWN0aXZlRXZlbnRzIShhY3RpdmVFdmVudHMpO1xuICAgICAgY29sbGlkZXJEZXNjID0gY29sbGlkZXJEZXNjLnNldEFjdGl2ZUNvbGxpc2lvblR5cGVzIShhY3RpdmVDb2xsaXNpb25UeXBlcyk7XG4gICAgfVxuICAgIGNvbGxpZGVyRGVzYyA9XG4gICAgICBjb2xsaWRlckRlc2Muc2V0VHJhbnNsYXRpb24/LihcbiAgICAgICAgc2hhcGVJbnN0YW5jZS5sb2NhbFBvc2l0aW9uLnggKiBzY2FsZS54LFxuICAgICAgICBzaGFwZUluc3RhbmNlLmxvY2FsUG9zaXRpb24ueSAqIHNjYWxlLnksXG4gICAgICAgIHNoYXBlSW5zdGFuY2UubG9jYWxQb3NpdGlvbi56ICogc2NhbGUuelxuICAgICAgKSA/PyBjb2xsaWRlckRlc2M7XG4gICAgY29sbGlkZXJEZXNjID1cbiAgICAgIGNvbGxpZGVyRGVzYy5zZXRSb3RhdGlvbj8uKFJhcGllclBoeXNpY3NTdHJhdGVneS5fX3RvUmFwaWVyUXVhdGVybmlvbihjb2xsaWRlclJvdGF0aW9uKSkgPz8gY29sbGlkZXJEZXNjO1xuICAgIHJldHVybiBjb2xsaWRlckRlc2M7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX3BhY2tDb2xsaXNpb25Hcm91cHMoZ3JvdXA6IG51bWJlciwgbWFzazogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBpZiAoIU51bWJlci5pc0ludGVnZXIoZ3JvdXApIHx8IGdyb3VwIDwgMCB8fCBncm91cCA+IDB4ZmZmZikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBSYXBpZXIgY29sbGlzaW9uR3JvdXAgbXVzdCBiZSBhIDE2LWJpdCB1bnNpZ25lZCBpbnRlZ2VyOiAke2dyb3VwfWApO1xuICAgIH1cbiAgICBpZiAoIU51bWJlci5pc0ludGVnZXIobWFzaykgfHwgbWFzayA8IDAgfHwgbWFzayA+IDB4ZmZmZikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBSYXBpZXIgY29sbGlzaW9uTWFzayBtdXN0IGJlIGEgMTYtYml0IHVuc2lnbmVkIGludGVnZXI6ICR7bWFza31gKTtcbiAgICB9XG4gICAgcmV0dXJuICgoZ3JvdXAgPDwgMTYpIHwgbWFzaykgPj4+IDA7XG4gIH1cblxuICBwcml2YXRlIF9fZ2V0U2NhbGVkVm9sdW1lKGJpbmRpbmc6IFBoeXNpY3NTaGFwZUluc3RhbmNlQmluZGluZyk6IG51bWJlciB7XG4gICAgY29uc3Qgc2hhcGUgPSBiaW5kaW5nLnNoYXBlLnNoYXBlO1xuICAgIGNvbnN0IHNjYWxlID0gdGhpcy5fX3NoYXBlV29ybGRTaWduZWRTY2FsZTtcbiAgICBjb25zdCBhYnNvbHV0ZVNjYWxlID0gdGhpcy5fX3NoYXBlV29ybGRTY2FsZTtcbiAgICBpZiAoc2hhcGUudHlwZSA9PT0gJ2JveCcpIHtcbiAgICAgIGNvbnN0IGhhbGZFeHRlbnRzID0gdGhpcy5fX3Jlc29sdmVCb3hDb2xsaWRlcihiaW5kaW5nLnNoYXBlKS5oYWxmRXh0ZW50cztcbiAgICAgIHJldHVybiA4ICogaGFsZkV4dGVudHMueCAqIGhhbGZFeHRlbnRzLnkgKiBoYWxmRXh0ZW50cy56O1xuICAgIH1cbiAgICBpZiAoc2hhcGUudHlwZSA9PT0gJ3NwaGVyZScpIHtcbiAgICAgIGNvbnN0IHJhZGl1cyA9IHNoYXBlLnJhZGl1cyAqIE1hdGgubWF4KGFic29sdXRlU2NhbGUueCwgYWJzb2x1dGVTY2FsZS55LCBhYnNvbHV0ZVNjYWxlLnopO1xuICAgICAgcmV0dXJuICg0IC8gMykgKiBNYXRoLlBJICogcmFkaXVzICoqIDM7XG4gICAgfVxuICAgIGlmIChzaGFwZS50eXBlID09PSAnY3lsaW5kZXInKSB7XG4gICAgICBjb25zdCByZXNvbHZlZCA9IHJlc29sdmVTY2FsZWRDeWxpbmRlcihcbiAgICAgICAgc2hhcGUuaGVpZ2h0LFxuICAgICAgICBNYXRoLm1heChzaGFwZS5yYWRpdXNCb3R0b20sIHNoYXBlLnJhZGl1c1RvcCksXG4gICAgICAgIGJpbmRpbmcuc2hhcGUubG9jYWxSb3RhdGlvbixcbiAgICAgICAgc2NhbGVcbiAgICAgICk7XG4gICAgICByZXR1cm4gTWF0aC5QSSAqIHJlc29sdmVkLnJhZGl1cyAqKiAyICogcmVzb2x2ZWQuaGFsZkhlaWdodCAqIDI7XG4gICAgfVxuICAgIGNvbnN0IHJlc29sdmVkID0gcmVzb2x2ZVNjYWxlZENhcHN1bGUoXG4gICAgICBzaGFwZS5oZWlnaHQsXG4gICAgICBNYXRoLm1heChzaGFwZS5yYWRpdXNCb3R0b20sIHNoYXBlLnJhZGl1c1RvcCksXG4gICAgICBiaW5kaW5nLnNoYXBlLmxvY2FsUm90YXRpb24sXG4gICAgICBzY2FsZVxuICAgICk7XG4gICAgcmV0dXJuIE1hdGguUEkgKiByZXNvbHZlZC5yYWRpdXMgKiogMiAqIHJlc29sdmVkLmhhbGZIZWlnaHQgKiAyICsgKDQgLyAzKSAqIE1hdGguUEkgKiByZXNvbHZlZC5yYWRpdXMgKiogMztcbiAgfVxuXG4gIHByaXZhdGUgX19yZXNvbHZlQm94Q29sbGlkZXIoc2hhcGVJbnN0YW5jZTogU2hhcGVJbnN0YW5jZSkge1xuICAgIGlmIChzaGFwZUluc3RhbmNlLnNoYXBlLnR5cGUgIT09ICdib3gnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0EgYm94IFNoYXBlSW5zdGFuY2UgaXMgcmVxdWlyZWQuJyk7XG4gICAgfVxuICAgIGNvbnN0IHJlc29sdmVkID0gcmVzb2x2ZVNjYWxlZEJveChcbiAgICAgIHNoYXBlSW5zdGFuY2Uuc2hhcGUuc2l6ZSxcbiAgICAgIHNoYXBlSW5zdGFuY2UubG9jYWxSb3RhdGlvbixcbiAgICAgIHRoaXMuX19zaGFwZVdvcmxkU2lnbmVkU2NhbGVcbiAgICApO1xuICAgIGlmIChyZXNvbHZlZC5hcHByb3hpbWF0ZWQgJiYgIXRoaXMuX193YXJuZWRTaGVhcmVkQm94QXBwcm94aW1hdGlvbikge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQud2FybihcbiAgICAgICAgJ1JhcGllciBjb25zZXJ2YXRpdmVseSBhcHByb3hpbWF0ZXMgYSBsb2NhbGx5IHJvdGF0ZWQgYm94IHVuZGVyIG5vbi11bmlmb3JtIHNjYWxlIHdpdGggYW4gYXhpcy1hbGlnbmVkIGJveC4nXG4gICAgICApO1xuICAgICAgdGhpcy5fX3dhcm5lZFNoZWFyZWRCb3hBcHByb3hpbWF0aW9uID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc29sdmVkO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19jb3B5TW90aW9uKG1vdGlvbjogUGh5c2ljc01vdGlvblByb3BlcnR5KTogUGh5c2ljc01vdGlvblByb3BlcnR5IHtcbiAgICByZXR1cm4ge1xuICAgICAgLi4ubW90aW9uLFxuICAgICAgbGluZWFyVmVsb2NpdHk6XG4gICAgICAgIG1vdGlvbi5saW5lYXJWZWxvY2l0eSA9PSBudWxsXG4gICAgICAgICAgPyB1bmRlZmluZWRcbiAgICAgICAgICA6IFZlY3RvcjMuZnJvbUNvcHkzKG1vdGlvbi5saW5lYXJWZWxvY2l0eS54LCBtb3Rpb24ubGluZWFyVmVsb2NpdHkueSwgbW90aW9uLmxpbmVhclZlbG9jaXR5LnopLFxuICAgICAgYW5ndWxhclZlbG9jaXR5OlxuICAgICAgICBtb3Rpb24uYW5ndWxhclZlbG9jaXR5ID09IG51bGxcbiAgICAgICAgICA/IHVuZGVmaW5lZFxuICAgICAgICAgIDogVmVjdG9yMy5mcm9tQ29weTMobW90aW9uLmFuZ3VsYXJWZWxvY2l0eS54LCBtb3Rpb24uYW5ndWxhclZlbG9jaXR5LnksIG1vdGlvbi5hbmd1bGFyVmVsb2NpdHkueiksXG4gICAgICBjZW50ZXJPZk1hc3M6XG4gICAgICAgIG1vdGlvbi5jZW50ZXJPZk1hc3MgPT0gbnVsbFxuICAgICAgICAgID8gdW5kZWZpbmVkXG4gICAgICAgICAgOiBWZWN0b3IzLmZyb21Db3B5Myhtb3Rpb24uY2VudGVyT2ZNYXNzLngsIG1vdGlvbi5jZW50ZXJPZk1hc3MueSwgbW90aW9uLmNlbnRlck9mTWFzcy56KSxcbiAgICAgIGluZXJ0aWFEaWFnb25hbDpcbiAgICAgICAgbW90aW9uLmluZXJ0aWFEaWFnb25hbCA9PSBudWxsXG4gICAgICAgICAgPyB1bmRlZmluZWRcbiAgICAgICAgICA6IFZlY3RvcjMuZnJvbUNvcHkzKG1vdGlvbi5pbmVydGlhRGlhZ29uYWwueCwgbW90aW9uLmluZXJ0aWFEaWFnb25hbC55LCBtb3Rpb24uaW5lcnRpYURpYWdvbmFsLnopLFxuICAgICAgaW5lcnRpYU9yaWVudGF0aW9uOlxuICAgICAgICBtb3Rpb24uaW5lcnRpYU9yaWVudGF0aW9uID09IG51bGwgPyB1bmRlZmluZWQgOiBRdWF0ZXJuaW9uLmZyb21Db3B5UXVhdGVybmlvbihtb3Rpb24uaW5lcnRpYU9yaWVudGF0aW9uKSxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBfX2dldEFwcHJveGltYXRlZFJhZGl1cyhyYWRpdXNCb3R0b206IG51bWJlciwgcmFkaXVzVG9wOiBudW1iZXIsIHNoYXBlVHlwZTogc3RyaW5nKTogbnVtYmVyIHtcbiAgICBpZiAocmFkaXVzQm90dG9tICE9PSByYWRpdXNUb3AgJiYgIXRoaXMuX193YXJuZWRBc3ltbWV0cmljUmFkaXVzKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC53YXJuKFxuICAgICAgICBgUmFwaWVyIGFwcHJveGltYXRlcyBhc3ltbWV0cmljICR7c2hhcGVUeXBlfSByYWRpaSAoJHtyYWRpdXNCb3R0b219LCAke3JhZGl1c1RvcH0pIHdpdGggdGhlIG1heGltdW0gcmFkaXVzLmBcbiAgICAgICk7XG4gICAgICB0aGlzLl9fd2FybmVkQXN5bW1ldHJpY1JhZGl1cyA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBNYXRoLm1heChyYWRpdXNCb3R0b20sIHJhZGl1c1RvcCk7XG4gIH1cblxuICBwcml2YXRlIF9fd2Fybk5vblVuaWZvcm1TY2FsZUlmTmVlZGVkKHNoYXBlVHlwZTogc3RyaW5nLCBzY2FsZTogSVZlY3RvcjMpOiB2b2lkIHtcbiAgICBpZiAoXG4gICAgICAhdGhpcy5fX3dhcm5lZE5vblVuaWZvcm1TY2FsZSAmJlxuICAgICAgKE1hdGguYWJzKHNjYWxlLnggLSBzY2FsZS55KSA+IDAuMDAwMDAxIHx8IE1hdGguYWJzKHNjYWxlLnkgLSBzY2FsZS56KSA+IDAuMDAwMDAxKVxuICAgICkge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQud2FybihgUmFwaWVyIGNvbnNlcnZhdGl2ZWx5IGFwcHJveGltYXRlcyBub24tdW5pZm9ybSBzY2FsZSBmb3IgJHtzaGFwZVR5cGV9IHNoYXBlcy5gKTtcbiAgICAgIHRoaXMuX193YXJuZWROb25Vbmlmb3JtU2NhbGUgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX19yZW1vdmVCb2R5KGlzUmVidWlsZGluZyA9IGZhbHNlKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX19yaWdpZEJvZHkgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHN0YXRlID0gUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9fZ2V0V29ybGRTdGF0ZSh0aGlzLl9fZW50aXR5Py5lbmdpbmUpO1xuICAgIGNvbnN0IHdvcmxkID0gc3RhdGUud29ybGQ7XG4gICAgaWYgKHdvcmxkLnJlbW92ZVJpZ2lkQm9keSA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBpbmplY3RlZCBSYXBpZXIgd29ybGQgZG9lcyBub3Qgc3VwcG9ydCByZW1vdmVSaWdpZEJvZHkuJyk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBjb2xsaWRlciBvZiB0aGlzLl9fY29sbGlkZXJzKSB7XG4gICAgICBpZiAoY29sbGlkZXIuaGFuZGxlICE9IG51bGwpIHtcbiAgICAgICAgUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9fdW5yZWdpc3RlckNvbGxpZGVyTWV0YWRhdGEoc3RhdGUsIGNvbGxpZGVyLmhhbmRsZSwgaXNSZWJ1aWxkaW5nKTtcbiAgICAgIH1cbiAgICB9XG4gICAgd29ybGQucmVtb3ZlUmlnaWRCb2R5KHRoaXMuX19yaWdpZEJvZHkpO1xuICAgIHRoaXMuX19yaWdpZEJvZHkgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fX2NvbGxpZGVycy5sZW5ndGggPSAwO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX192YWxpZGF0ZVNoYXBlU3VwcG9ydChzaGFwZUluc3RhbmNlOiBTaGFwZUluc3RhbmNlLCBzY2FsZTogSVZlY3RvcjMpOiB2b2lkIHtcbiAgICBpZiAoc2NhbGUueCA9PT0gMCB8fCBzY2FsZS55ID09PSAwIHx8IHNjYWxlLnogPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc2hhcGUgPSBzaGFwZUluc3RhbmNlLnNoYXBlO1xuICAgIGNvbnN0IHJhcGllciA9IFJhcGllclBoeXNpY3NTdHJhdGVneS5fX2dldFJhcGllcigpO1xuICAgIGlmIChzaGFwZS50eXBlID09PSAnY3lsaW5kZXInICYmIHJhcGllci5Db2xsaWRlckRlc2MuY3lsaW5kZXIgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgaW5qZWN0ZWQgUmFwaWVyIG1vZHVsZSBkb2VzIG5vdCBzdXBwb3J0IGN5bGluZGVyIGNvbGxpZGVycy4nKTtcbiAgICB9XG4gICAgaWYgKHNoYXBlLnR5cGUgPT09ICdjYXBzdWxlJyAmJiByYXBpZXIuQ29sbGlkZXJEZXNjLmNhcHN1bGUgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgaW5qZWN0ZWQgUmFwaWVyIG1vZHVsZSBkb2VzIG5vdCBzdXBwb3J0IGNhcHN1bGUgY29sbGlkZXJzLicpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fYXNzZXJ0SW5pdGlhbGl6ZWQoKTogdm9pZCB7XG4gICAgaWYgKCFSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuaXNJbml0aWFsaXplZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuaW5pdGlhbGl6ZShSQVBJRVIpIG11c3QgYmUgY2FsbGVkIGJlZm9yZSB1c2UuJyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRSYXBpZXIoKTogUmFwaWVyUGh5c2ljc01vZHVsZUxpa2Uge1xuICAgIFJhcGllclBoeXNpY3NTdHJhdGVneS5fX2Fzc2VydEluaXRpYWxpemVkKCk7XG4gICAgcmV0dXJuIFJhcGllclBoeXNpY3NTdHJhdGVneS5fX3JhcGllciE7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2dldFdvcmxkKGVuZ2luZT86IEVuZ2luZSk6IFJhcGllcldvcmxkTGlrZSB7XG4gICAgcmV0dXJuIFJhcGllclBoeXNpY3NTdHJhdGVneS5fX2dldFdvcmxkU3RhdGUoZW5naW5lKS53b3JsZDtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0V29ybGRTdGF0ZShlbmdpbmU/OiBFbmdpbmUpOiBSYXBpZXJXb3JsZFN0YXRlIHtcbiAgICBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX19hc3NlcnRJbml0aWFsaXplZCgpO1xuICAgIGlmIChlbmdpbmUgIT0gbnVsbCkge1xuICAgICAgbGV0IHN0YXRlID0gUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9fd29ybGRTdGF0ZXMuZ2V0KGVuZ2luZSk7XG4gICAgICBpZiAoc3RhdGUgPT0gbnVsbCkge1xuICAgICAgICBzdGF0ZSA9IFJhcGllclBoeXNpY3NTdHJhdGVneS5fX2NyZWF0ZVdvcmxkU3RhdGUoZW5naW5lKTtcbiAgICAgICAgUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9fd29ybGRTdGF0ZXMuc2V0KGVuZ2luZSwgc3RhdGUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHN0YXRlO1xuICAgIH1cbiAgICBpZiAoUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9fd29ybGRTdGF0ZXMuc2l6ZSA9PT0gMSkge1xuICAgICAgcmV0dXJuIFJhcGllclBoeXNpY3NTdHJhdGVneS5fX3dvcmxkU3RhdGVzLnZhbHVlcygpLm5leHQoKS52YWx1ZSE7XG4gICAgfVxuICAgIGlmIChSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX193b3JsZFN0YXRlcy5zaXplID4gMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdBbiBFbmdpbmUgbXVzdCBiZSBzcGVjaWZpZWQgd2hlbiBtb3JlIHRoYW4gb25lIFJhcGllciBwaHlzaWNzIHdvcmxkIGV4aXN0cy4nKTtcbiAgICB9XG4gICAgaWYgKFJhcGllclBoeXNpY3NTdHJhdGVneS5fX2RlZmF1bHRXb3JsZFN0YXRlID09IG51bGwpIHtcbiAgICAgIFJhcGllclBoeXNpY3NTdHJhdGVneS5fX2RlZmF1bHRXb3JsZFN0YXRlID0gUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9fY3JlYXRlV29ybGRTdGF0ZSgpO1xuICAgIH1cbiAgICByZXR1cm4gUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9fZGVmYXVsdFdvcmxkU3RhdGU7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2NyZWF0ZVdvcmxkU3RhdGUoZW5naW5lPzogRW5naW5lKTogUmFwaWVyV29ybGRTdGF0ZSB7XG4gICAgY29uc3QgcmFwaWVyID0gUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9fcmFwaWVyITtcbiAgICByZXR1cm4ge1xuICAgICAgZW5naW5lLFxuICAgICAgd29ybGQ6IG5ldyByYXBpZXIuV29ybGQoe1xuICAgICAgICB4OiBSYXBpZXJQaHlzaWNzU3RyYXRlZ3kuX193b3JsZFByb3BlcnR5LmdyYXZpdHkueCxcbiAgICAgICAgeTogUmFwaWVyUGh5c2ljc1N0cmF0ZWd5Ll9fd29ybGRQcm9wZXJ0eS5ncmF2aXR5LnksXG4gICAgICAgIHo6IFJhcGllclBoeXNpY3NTdHJhdGVneS5fX3dvcmxkUHJvcGVydHkuZ3Jhdml0eS56LFxuICAgICAgfSksXG4gICAgICBldmVudFF1ZXVlOiByYXBpZXIuRXZlbnRRdWV1ZSA9PSBudWxsID8gdW5kZWZpbmVkIDogbmV3IHJhcGllci5FdmVudFF1ZXVlKHRydWUpLFxuICAgICAgY29sbGlkZXJNZXRhZGF0YTogbmV3IE1hcCgpLFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2Rpc3Bvc2VXb3JsZFN0YXRlKHN0YXRlOiBSYXBpZXJXb3JsZFN0YXRlIHwgdW5kZWZpbmVkKTogdm9pZCB7XG4gICAgc3RhdGU/LmV2ZW50UXVldWU/LmZyZWU/LigpO1xuICAgIHN0YXRlPy53b3JsZC5mcmVlPy4oKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fZXVsZXJUb1F1YXRlcm5pb24oZXVsZXJBbmdsZXM6IElWZWN0b3IzKTogSVF1YXRlcm5pb24ge1xuICAgIHJldHVybiBRdWF0ZXJuaW9uLmZyb21NYXRyaXgoTWF0cml4NDQucm90YXRlWFlaKGV1bGVyQW5nbGVzLngsIGV1bGVyQW5nbGVzLnksIGV1bGVyQW5nbGVzLnopKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fdG9SYXBpZXJRdWF0ZXJuaW9uKHF1YXRlcm5pb246IElRdWF0ZXJuaW9uKTogUmFwaWVyUXVhdGVybmlvbkxpa2Uge1xuICAgIHJldHVybiB7XG4gICAgICB4OiBxdWF0ZXJuaW9uLngsXG4gICAgICB5OiBxdWF0ZXJuaW9uLnksXG4gICAgICB6OiBxdWF0ZXJuaW9uLnosXG4gICAgICB3OiBxdWF0ZXJuaW9uLncsXG4gICAgfTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFBLFNBQVMsd0JBQXdCO0FBRWpDLFNBQVMsd0JBQXdCO0FBRWpDLFNBQVMsb0JBQW9CO0FBRzdCO0FBQUEsRUFHRTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxPQUNLO0FBQ1AsU0FBUyxjQUFjO0FBRXZCLFNBQVMsMEJBQXlFO0FBU2xGLFNBQVMsa0JBQWtCLHNCQUFzQiw2QkFBNkI7QUEwTXZFLElBQU0seUJBQU4sTUFBTSx1QkFBaUQ7QUFBQSxFQStGNUQsY0FBYztBQWhGZCxTQUFRQSxLQUFvQyxDQUFDO0FBRzdDLFNBQVFDLEtBQXlCLFFBQVEsSUFBSTtBQUM3QyxTQUFRQyxLQUFpQyxRQUFRLEtBQUs7QUFDdEQsU0FBUUMsS0FBb0MsV0FBVyxTQUFTO0FBR2hFLFNBQVFDLEtBQThCLFFBQVEsSUFBSTtBQUNsRCxTQUFRQyxLQUFvQyxRQUFRLElB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LGdCQUFnQyxZQUFpQztBQUM3RyxVQUFNLGdCQUFnQixPQUFPLE9BQU8saUJBQWlCLHFCQUFxQixrQkFBa0IsTUFBTTtBQUNsRyxVQUFNLG1CQUFtQixjQUFjLFdBQVc7QUFDbEQscUJBQWlCLFlBQVksSUFBSSx1QkFBc0IsQ0FBQztBQUN4RCxxQkFBaUIsVUFBVTtBQUFBLE1BQ3pCO0FBQUEsTUFDQSxNQUFNLEVBQUUsTUFBTSxRQUFRLE1BQU0sU0FBUyxRQUFRLFFBQVE7QUFBQSxNQUNyRCxVQUFVLEVBQUUsVUFBVSxRQUFRLFVBQVUsYUFBYSxRQUFRLFlBQVk7QUFBQSxJQUMzRSxDQUFDO0FBQ0QsV0FBTztBQUFBLEVBQ1Q7QUFDRjtBQXRGSyxJQUFNLHdCQUFOOyIsCiAgIm5hbWVzIjogWyJfX2NvbGxpZGVycyIsICJfX2xvY2FsU2NhbGUiLCAiX19zaGFwZUxvY2FsUG9zaXRpb24iLCAiX19zaGFwZUxvY2FsUm90YXRpb24iLCAiX19zaGFwZVdvcmxkU2NhbGUiLCAiX19zaGFwZVdvcmxkU2lnbmVkU2NhbGUiLCAiX193YXJuZWRBc3ltbWV0cmljUmFkaXVzIiwgIl9fd2FybmVkTm9uVW5pZm9ybVNjYWxlIiwgIl9fd2FybmVkU2hlYXJlZEJveEFwcHJveGltYXRpb24iLCAiX190bXBXb3JsZFJvdGF0aW9uIiwgIl9fdG1wRXVsZXIiLCAiX190bXBQcm9wZXJ0eVJvdGF0aW9uIiwgIl9fdG1wTGluZWFyVmVsb2NpdHkiLCAiX190bXBBbmd1bGFyVmVsb2NpdHkiLCAiX190bXBVcGRhdGVQb3NpdGlvbiIsICJfX3RtcFVwZGF0ZVJvdGF0aW9uIiwgIl9fYXNzZXJ0SW5pdGlhbGl6ZWQiLCAiX193b3JsZFByb3BlcnR5IiwgIl9fZGlzcG9zZVdvcmxkU3RhdGUiLCAiX19kZWZhdWx0V29ybGRTdGF0ZSIsICJfX3dvcmxkU3RhdGVzIiwgIl9fcmFwaWVyIiwgIl9fc3RlcFBhcnRpY2lwYW50cyIsICJfX3BoeXNpY3NCYWNrZW5kIiwgIl9fY2FwdHVyZUR5bmFtaWNCb2R5U3RhdGUiLCAiX19yZW1vdmVCb2R5IiwgIl9fc2hhcGVCaW5kaW5ncyIsICJfX21vdGlvbiIsICJfX3NldFNoYXBlIiwgIl9hIiwgIl9fZ2V0UmFwaWVyIiwgIl9fdmFsaWRhdGVTaGFwZVN1cHBvcnQiLCAiX19jb3B5TW90aW9uIiwgIl9fcHJvcGVydHkiLCAiX19lbnRpdHkiLCAiX19jcmVhdGVTY2FsZWRTaXplIiwgIl9faXNWYWxpZFNpemUiLCAiX19jcmVhdGVCb2R5IiwgIl9fZXVsZXJUb1F1YXRlcm5pb24iLCAiX19yaWdpZEJvZHkiLCAiX19pc0tpbmVtYXRpY0JvZHkiLCAiX190b1JhcGllclF1YXRlcm5pb24iLCAiX19nZXRXb3JsZFN0YXRlIiwgIl9fZGVmYXVsdFRpbWVzdGVwIiwgIl9fbWF4VGltZXN0ZXAiLCAiX19kcmFpbkNvbGxpc2lvbkV2ZW50cyIsICJfX3VucmVnaXN0ZXJDb2xsaWRlck1ldGFkYXRhIiwgIl9fZ2V0V29ybGQiLCAiX19wYWNrQ29sbGlzaW9uR3JvdXBzIiwgIl9fY3JlYXRlU2hhcGVJbnN0YW5jZUNvbGxpZGVyRGVzYyIsICJfX2FwcGx5Q29tcGxldGVNYXNzUHJvcGVydGllcyIsICJfX2NyZWF0ZUNvbGxpZGVyRGVzYyIsICJfX3Jlc29sdmVCb3hDb2xsaWRlciIsICJfX3dhcm5Ob25Vbmlmb3JtU2NhbGVJZk5lZWRlZCIsICJfX2dldEFwcHJveGltYXRlZFJhZGl1cyIsICJfX2dldFNjYWxlZFZvbHVtZSIsICJyZXNvbHZlZCIsICJfX2NyZWF0ZVdvcmxkU3RhdGUiXQp9Cg==
