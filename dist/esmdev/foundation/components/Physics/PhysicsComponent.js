// src/foundation/components/Physics/PhysicsComponent.ts
import { Component } from "../../core/Component.js";
import { applyMixins } from "../../core/EntityRepository.js";
import { ProcessStage } from "../../definitions/ProcessStage.js";
import { Quaternion } from "../../math/Quaternion.js";
import { Vector3 } from "../../math/Vector3.js";
import { Is } from "../../misc/Is.js";
import { Time } from "../../misc/Time.js";
import { _getPhysicsBackend } from "../../physics/PhysicsBackend.js";
import { VRMSpringBonePhysicsStrategy } from "../../physics/VRMSpring/VRMSpringBonePhysicsStrategy.js";
import { AnimationComponent } from "../Animation/AnimationComponent.js";
import { AnimationStateRepository } from "../Animation/AnimationStateRepository.js";
import { TriggerComponent } from "../Trigger/TriggerComponent.js";
import { WellKnownComponentTIDs } from "../WellKnownComponentTIDs.js";
var PhysicsComponent = class _PhysicsComponent extends Component {
  /**
   * Creates a new PhysicsComponent instance.
   * @param engine - The engine instance
   * @param entityUid - The unique identifier of the entity this component belongs to
   * @param componentSid - The component's serial identifier
   * @param entityComponent - The entity repository managing this component
   * @param isReUse - Whether this component is being reused from a pool
   */
  constructor(engine, entityUid, componentSid, entityComponent, isReUse) {
    super(engine, entityUid, componentSid, entityComponent, isReUse);
    this.__shapeBindings = /* @__PURE__ */ new Map();
    this.__nextShapeBindingId = 0;
    this.moveStageTo(ProcessStage.Logic);
  }
  /**
   * Gets the component type identifier for PhysicsComponent.
   * @returns The component type ID for physics components
   */
  static get componentTID() {
    return WellKnownComponentTIDs.PhysicsComponentTID;
  }
  /**
   * Gets the component type identifier for this instance.
   * @returns The component type ID for physics components
   */
  get componentTID() {
    return WellKnownComponentTIDs.PhysicsComponentTID;
  }
  /**
   * Sets the physics strategy for this component.
   * The strategy defines how physics calculations and updates are performed.
   * @param strategy - The physics strategy to use for this component
   */
  setStrategy(strategy) {
    this.__strategy = strategy;
  }
  /**
   * Gets the current physics strategy used by this component.
   * @returns The physics strategy instance, or undefined if none is set
   */
  get strategy() {
    return this.__strategy;
  }
  /** Sets properties shared by the complete rigid body and rebuilds its colliders. */
  setMotionProperty(motion) {
    if (!motion.move && motion.isKinematic) {
      throw new Error("A kinematic physics body must have motion.move enabled.");
    }
    const previous = this.__motion;
    this.__motion = _PhysicsComponent.__copyMotion(motion);
    try {
      if (this.__shapeBindings.size > 0) {
        this.__applyShapeBindings(this.__shapeBindings, () => {
          this.__motion = previous;
          this.__applyShapeBindings(this.__shapeBindings);
        });
      }
    } catch (error) {
      this.__motion = previous;
      throw error;
    }
  }
  get motionProperty() {
    return this.__motion == null ? void 0 : _PhysicsComponent.__copyMotion(this.__motion);
  }
  /**
   * Whether the rigid body is allowed to move. False means a fixed body.
   * When no motion property is set, the first shape binding's body is used.
   */
  get bodyMove() {
    if (this.__motion != null) {
      return this.__motion.move;
    }
    for (const binding of this.__shapeBindings.values()) {
      return binding.body.move;
    }
    return false;
  }
  /**
   * Sets whether the rigid body may move and rebuilds its colliders.
   *
   * The move flag is shared by the rigid body and every collider, so this
   * updates the motion property and all shape bindings together. A fixed body
   * clears the kinematic flag; enabling move keeps the current kinematic flag
   * when one is set, otherwise the body becomes dynamic.
   *
   * @param move - True for a movable body, false for a fixed body
   */
  setBodyMove(move) {
    var _a, _b, _c;
    const nextIsKinematic = move ? (_b = (_a = this.__motion) == null ? void 0 : _a.isKinematic) != null ? _b : false : false;
    const nextMotion = {
      ...(_c = this.__motion) != null ? _c : {},
      move,
      isKinematic: nextIsKinematic
    };
    const previousMotion = this.__motion;
    const previousBindings = this.__shapeBindings;
    const nextBindings = /* @__PURE__ */ new Map();
    for (const [bindingId, binding] of this.__shapeBindings) {
      nextBindings.set(bindingId, {
        ...binding,
        body: { ...binding.body, move, isKinematic: nextIsKinematic }
      });
    }
    this.__motion = _PhysicsComponent.__copyMotion(nextMotion);
    this.__shapeBindings = nextBindings;
    if (nextBindings.size === 0) {
      return;
    }
    try {
      this.__applyShapeBindings(nextBindings, () => {
        this.__motion = previousMotion;
        this.__shapeBindings = previousBindings;
        this.__applyShapeBindings(previousBindings);
      });
    } catch (error) {
      this.__motion = previousMotion;
      this.__shapeBindings = previousBindings;
      throw error;
    }
  }
  /** Adds one generic ShapeComponent instance to this physical body. */
  bindShape(binding) {
    const id = this.__nextShapeBindingId;
    const next = new Map(this.__shapeBindings);
    next.set(id, _PhysicsComponent.__copyBinding(binding));
    this.__applyShapeBindingsTransaction(next);
    this.__shapeBindings = next;
    this.__nextShapeBindingId++;
    return id;
  }
  updateShapeBinding(bindingId, binding) {
    const previous = this.__shapeBindings.get(bindingId);
    if (previous == null) {
      throw new Error(`Physics shape binding ${bindingId} does not exist.`);
    }
    const next = new Map(this.__shapeBindings);
    next.set(bindingId, _PhysicsComponent.__copyBinding(binding));
    this.__applyShapeBindingsTransaction(next);
    this.__shapeBindings = next;
    if (previous.collider.isSensor && !binding.collider.isSensor) {
      TriggerComponent._unregisterSensorBinding(this.__engine, this.entity.entityUID, bindingId);
    }
  }
  /**
   * Removes every shape binding that references one ShapeComponent shape.
   * @param shapeComponent - ShapeComponent owning the shape
   * @param shapeIndex - Shape index referenced by the bindings
   * @returns The number of removed bindings
   */
  removeShapeBindingsForShape(shapeComponent, shapeIndex) {
    var _a;
    const next = /* @__PURE__ */ new Map();
    const sensorBindingIds = [];
    let removed = 0;
    for (const [bindingId, binding] of this.__shapeBindings) {
      if (binding.shapeComponent === shapeComponent && ((_a = binding.shapeIndex) != null ? _a : 0) === shapeIndex) {
        removed++;
        if (binding.collider.isSensor) {
          sensorBindingIds.push(bindingId);
        }
        continue;
      }
      next.set(bindingId, binding);
    }
    if (removed === 0) {
      return 0;
    }
    this.__applyShapeBindingsTransaction(next);
    this.__shapeBindings = next;
    for (const bindingId of sensorBindingIds) {
      TriggerComponent._unregisterSensorBinding(this.__engine, this.entity.entityUID, bindingId);
    }
    return removed;
  }
  removeShapeBinding(bindingId) {
    const removed = this.__shapeBindings.get(bindingId);
    if (removed == null) {
      return false;
    }
    const next = new Map(this.__shapeBindings);
    next.delete(bindingId);
    this.__applyShapeBindingsTransaction(next);
    this.__shapeBindings = next;
    if (removed.collider.isSensor) {
      TriggerComponent._unregisterSensorBinding(this.__engine, this.entity.entityUID, bindingId);
    }
    return true;
  }
  clearShapeBindings() {
    if (this.__shapeBindings.size === 0) {
      return;
    }
    this.__applyShapeBindingsTransaction(/* @__PURE__ */ new Map());
    this.__unregisterSensorBindings(this.__shapeBindings);
    this.__shapeBindings.clear();
  }
  rebuildShapeBindings() {
    this.__applyShapeBindings(this.__shapeBindings);
  }
  get shapeBindingCount() {
    return this.__shapeBindings.size;
  }
  __applyShapeBindingsTransaction(bindings) {
    this.__applyShapeBindings(bindings, () => this.__applyShapeBindings(this.__shapeBindings));
  }
  __applyShapeBindings(bindings, rollback) {
    var _a, _b, _c, _d;
    const strategy = this.__strategy;
    if (strategy == null) {
      throw new Error("A physics strategy must be set before binding shapes.");
    }
    const resolved = [];
    let move;
    let isKinematic;
    for (const [bindingId, binding] of bindings) {
      const shapeIndex = (_a = binding.shapeIndex) != null ? _a : 0;
      const shape = binding.shapeComponent.getShape(shapeIndex);
      if (shape == null) {
        throw new Error(`ShapeComponent does not contain shape index ${shapeIndex}.`);
      }
      if (move != null && move !== binding.body.move) {
        throw new Error("All shape bindings on one PhysicsComponent must use the same body.move value.");
      }
      const bindingIsKinematic = (_b = binding.body.isKinematic) != null ? _b : false;
      if (isKinematic != null && isKinematic !== bindingIsKinematic) {
        throw new Error("All shape bindings on one PhysicsComponent must use the same body.isKinematic value.");
      }
      if (!binding.body.move && bindingIsKinematic) {
        throw new Error("A kinematic physics body must have body.move enabled.");
      }
      move = binding.body.move;
      isKinematic = bindingIsKinematic;
      resolved.push({ bindingId, shape, body: { ...binding.body }, collider: { ...binding.collider } });
    }
    if (this.__motion != null && move != null && this.__motion.move !== move) {
      throw new Error("Physics motion.move must match body.move on every shape binding.");
    }
    if (this.__motion != null && isKinematic != null && ((_c = this.__motion.isKinematic) != null ? _c : false) !== isKinematic) {
      throw new Error("Physics motion.isKinematic must match body.isKinematic on every shape binding.");
    }
    const entity = this.entity;
    const motion = (_d = this.__motion) != null ? _d : move == null ? void 0 : { move, isKinematic };
    if (resolved.length === 0) {
      if (strategy.clearShapeInstances == null) {
        throw new Error("The current physics strategy cannot clear ShapeComponent bindings.");
      }
      this.__applyBackendUpdate(() => strategy.clearShapeInstances(), rollback);
    } else if (strategy.setShapeInstances != null) {
      this.__applyBackendUpdate(
        () => strategy.setShapeInstances(resolved, entity, entity.getSceneGraph()._getPhysicsWorldScale(), motion),
        rollback
      );
    } else if (resolved.length === 1 && strategy.setShapeInstance != null) {
      const binding = resolved[0];
      this.__applyBackendUpdate(
        () => strategy.setShapeInstance(
          binding.shape,
          binding.body,
          binding.collider,
          entity,
          entity.getSceneGraph()._getPhysicsWorldScale(),
          motion
        ),
        rollback
      );
    } else {
      throw new Error("The current physics strategy does not support multiple ShapeComponent bindings.");
    }
  }
  __applyBackendUpdate(update, rollback) {
    try {
      update();
    } catch (error) {
      if (rollback == null) {
        throw error;
      }
      try {
        rollback();
      } catch (rollbackError) {
        const updateMessage = error instanceof Error ? error.message : String(error);
        const rollbackMessage = rollbackError instanceof Error ? rollbackError.message : String(rollbackError);
        throw new Error(
          `Physics backend update failed (${updateMessage}) and restoring the previous bindings failed (${rollbackMessage}).`
        );
      }
      throw error;
    }
  }
  static __copyBinding(binding) {
    return {
      shapeComponent: binding.shapeComponent,
      shapeIndex: binding.shapeIndex,
      body: { ...binding.body },
      collider: { ...binding.collider }
    };
  }
  __unregisterSensorBindings(bindings) {
    for (const [bindingId, binding] of bindings) {
      if (binding.collider.isSensor) {
        TriggerComponent._unregisterSensorBinding(this.__engine, this.entity.entityUID, bindingId);
      }
    }
  }
  static __copyMotion(motion) {
    return {
      ...motion,
      linearVelocity: motion.linearVelocity == null ? void 0 : Vector3.fromCopy3(motion.linearVelocity.x, motion.linearVelocity.y, motion.linearVelocity.z),
      angularVelocity: motion.angularVelocity == null ? void 0 : Vector3.fromCopy3(motion.angularVelocity.x, motion.angularVelocity.y, motion.angularVelocity.z),
      centerOfMass: motion.centerOfMass == null ? void 0 : Vector3.fromCopy3(motion.centerOfMass.x, motion.centerOfMass.y, motion.centerOfMass.z),
      inertiaDiagonal: motion.inertiaDiagonal == null ? void 0 : Vector3.fromCopy3(motion.inertiaDiagonal.x, motion.inertiaDiagonal.y, motion.inertiaDiagonal.z),
      inertiaOrientation: motion.inertiaOrientation == null ? void 0 : Quaternion.fromCopyQuaternion(motion.inertiaOrientation)
    };
  }
  getVrmSpring() {
    const strategy = this.__strategy;
    if (Is.not.exist(strategy) || !(strategy instanceof VRMSpringBonePhysicsStrategy)) {
      return void 0;
    }
    return strategy.getVrmSpring();
  }
  /**
   * Common logic method that updates the global physics simulation.
   * This is called once per frame for all physics components and handles
   * the overall physics world update through the Rapier physics backend.
   */
  static common_$logic({ engine }) {
    var _a;
    if (!AnimationComponent.getIsAnimating(engine)) {
      return;
    }
    (_a = _getPhysicsBackend()) == null ? void 0 : _a.update(
      AnimationStateRepository.getProcessFrameToken(engine),
      Time.getIntervalProcessBegin(engine),
      engine
    );
  }
  /**
   * Instance-specific logic method that updates this component's physics.
   * Called during the logic processing stage to update individual physics entities.
   */
  $logic() {
    var _a;
    if (!AnimationComponent.getIsAnimating(this.__engine)) {
      return;
    }
    (_a = this.__strategy) == null ? void 0 : _a.update(this.__engine.config);
  }
  /**
   * Sets the visibility of all colliders managed by this physics component.
   * This is useful for debugging and visualizing collision boundaries.
   * Note: This only works if the physics strategy supports collider visualization
   * (e.g., VRMSpringBonePhysicsStrategy).
   *
   * @param visible - Whether the colliders should be visible
   */
  setCollidersVisible(visible) {
    var _a, _b;
    (_b = (_a = this.__strategy) == null ? void 0 : _a.setCollidersVisible) == null ? void 0 : _b.call(_a, visible);
  }
  /**
   * Destroys this physics component and cleans up resources.
   * Calls the parent destroy method and clears the physics strategy reference.
   * @override
   */
  _destroy() {
    var _a, _b;
    (_b = (_a = this.__strategy) == null ? void 0 : _a.clearShapeInstances) == null ? void 0 : _b.call(_a);
    this.__unregisterSensorBindings(this.__shapeBindings);
    super._destroy();
    this.__strategy = void 0;
    this.__shapeBindings.clear();
  }
  /**
   * Adds physics functionality to an entity by mixing in physics-specific methods.
   * This method extends the base entity class with physics-related capabilities,
   * allowing the entity to access its physics component through a convenient getter.
   * @template EntityBase - The base entity type to extend
   * @template SomeComponentClass - The component class type
   * @param base - The target entity to add physics functionality to
   * @param _componentClass - The component class being added (used for type inference)
   * @returns The enhanced entity with physics methods and the original entity functionality
   * @override
   */
  addThisComponentToEntity(base, _componentClass) {
    class PhysicsEntity extends base.constructor {
      /**
       * Gets the physics component attached to this entity.
       * @returns The PhysicsComponent instance for this entity
       */
      getPhysics() {
        return this.getComponentByComponentTID(WellKnownComponentTIDs.PhysicsComponentTID);
      }
    }
    applyMixins(base, PhysicsEntity);
    return base;
  }
};
export {
  PhysicsComponent
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29tcG9uZW50cy9QaHlzaWNzL1BoeXNpY3NDb21wb25lbnQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgQ29tcG9uZW50U0lELCBDb21wb25lbnRUSUQsIEVudGl0eVVJRCB9IGZyb20gJy4uLy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4uLy4uL2NvcmUvQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgSUVudGl0eSB9IGZyb20gJy4uLy4uL2NvcmUvRW50aXR5JztcbmltcG9ydCB7IGFwcGx5TWl4aW5zLCB0eXBlIEVudGl0eVJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9jb3JlL0VudGl0eVJlcG9zaXRvcnknO1xuaW1wb3J0IHsgUHJvY2Vzc1N0YWdlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvUHJvY2Vzc1N0YWdlJztcbmltcG9ydCB7IFF1YXRlcm5pb24gfSBmcm9tICcuLi8uLi9tYXRoL1F1YXRlcm5pb24nO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJy4uLy4uL21hdGgvVmVjdG9yMyc7XG5pbXBvcnQgeyBJcyB9IGZyb20gJy4uLy4uL21pc2MvSXMnO1xuaW1wb3J0IHsgVGltZSB9IGZyb20gJy4uLy4uL21pc2MvVGltZSc7XG5pbXBvcnQgeyBfZ2V0UGh5c2ljc0JhY2tlbmQgfSBmcm9tICcuLi8uLi9waHlzaWNzL1BoeXNpY3NCYWNrZW5kJztcbmltcG9ydCB0eXBlIHtcbiAgUGh5c2ljc0JvZHlQcm9wZXJ0eSxcbiAgUGh5c2ljc0NvbGxpZGVyUHJvcGVydHksXG4gIFBoeXNpY3NNb3Rpb25Qcm9wZXJ0eSxcbn0gZnJvbSAnLi4vLi4vcGh5c2ljcy9QaHlzaWNzUHJvcGVydHknO1xuaW1wb3J0IHR5cGUgeyBQaHlzaWNzU2hhcGVJbnN0YW5jZUJpbmRpbmcsIFBoeXNpY3NTdHJhdGVneSB9IGZyb20gJy4uLy4uL3BoeXNpY3MvUGh5c2ljc1N0cmF0ZWd5JztcbmltcG9ydCB7IFZSTVNwcmluZ0JvbmVQaHlzaWNzU3RyYXRlZ3kgfSBmcm9tICcuLi8uLi9waHlzaWNzL1ZSTVNwcmluZy9WUk1TcHJpbmdCb25lUGh5c2ljc1N0cmF0ZWd5JztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vLi4vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgeyBBbmltYXRpb25Db21wb25lbnQgfSBmcm9tICcuLi9BbmltYXRpb24vQW5pbWF0aW9uQ29tcG9uZW50JztcbmltcG9ydCB7IEFuaW1hdGlvblN0YXRlUmVwb3NpdG9yeSB9IGZyb20gJy4uL0FuaW1hdGlvbi9BbmltYXRpb25TdGF0ZVJlcG9zaXRvcnknO1xuaW1wb3J0IHR5cGUgeyBDb21wb25lbnRUb0NvbXBvbmVudE1ldGhvZHMgfSBmcm9tICcuLi9Db21wb25lbnRUeXBlcyc7XG5pbXBvcnQgdHlwZSB7IFNoYXBlQ29tcG9uZW50IH0gZnJvbSAnLi4vU2hhcGUvU2hhcGVDb21wb25lbnQnO1xuaW1wb3J0IHsgVHJpZ2dlckNvbXBvbmVudCB9IGZyb20gJy4uL1RyaWdnZXIvVHJpZ2dlckNvbXBvbmVudCc7XG5pbXBvcnQgeyBXZWxsS25vd25Db21wb25lbnRUSURzIH0gZnJvbSAnLi4vV2VsbEtub3duQ29tcG9uZW50VElEcyc7XG5cbmV4cG9ydCB0eXBlIFBoeXNpY3NTaGFwZUJpbmRpbmcgPSB7XG4gIHNoYXBlQ29tcG9uZW50OiBTaGFwZUNvbXBvbmVudDtcbiAgc2hhcGVJbmRleD86IG51bWJlcjtcbiAgYm9keTogUGh5c2ljc0JvZHlQcm9wZXJ0eTtcbiAgY29sbGlkZXI6IFBoeXNpY3NDb2xsaWRlclByb3BlcnR5O1xufTtcblxuLyoqXG4gKiBQaHlzaWNzQ29tcG9uZW50IGlzIGEgY29tcG9uZW50IHRoYXQgbWFuYWdlcyB0aGUgcGh5c2ljcyBzaW11bGF0aW9uIGZvciBhbiBlbnRpdHkuXG4gKiBJdCBwcm92aWRlcyBpbnRlZ3JhdGlvbiB3aXRoIHBoeXNpY3MgZW5naW5lcyB0aHJvdWdoIHRoZSBzdHJhdGVneSBwYXR0ZXJuIGFuZCBoYW5kbGVzXG4gKiBwaHlzaWNzIHVwZGF0ZXMgZHVyaW5nIHRoZSBsb2dpYyBwcm9jZXNzaW5nIHN0YWdlLlxuICovXG5leHBvcnQgY2xhc3MgUGh5c2ljc0NvbXBvbmVudCBleHRlbmRzIENvbXBvbmVudCB7XG4gIHByaXZhdGUgX19zdHJhdGVneT86IFBoeXNpY3NTdHJhdGVneTtcbiAgcHJpdmF0ZSBfX3NoYXBlQmluZGluZ3MgPSBuZXcgTWFwPG51bWJlciwgUGh5c2ljc1NoYXBlQmluZGluZz4oKTtcbiAgcHJpdmF0ZSBfX25leHRTaGFwZUJpbmRpbmdJZCA9IDA7XG4gIHByaXZhdGUgX19tb3Rpb24/OiBQaHlzaWNzTW90aW9uUHJvcGVydHk7XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgUGh5c2ljc0NvbXBvbmVudCBpbnN0YW5jZS5cbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHBhcmFtIGVudGl0eVVpZCAtIFRoZSB1bmlxdWUgaWRlbnRpZmllciBvZiB0aGUgZW50aXR5IHRoaXMgY29tcG9uZW50IGJlbG9uZ3MgdG9cbiAgICogQHBhcmFtIGNvbXBvbmVudFNpZCAtIFRoZSBjb21wb25lbnQncyBzZXJpYWwgaWRlbnRpZmllclxuICAgKiBAcGFyYW0gZW50aXR5Q29tcG9uZW50IC0gVGhlIGVudGl0eSByZXBvc2l0b3J5IG1hbmFnaW5nIHRoaXMgY29tcG9uZW50XG4gICAqIEBwYXJhbSBpc1JlVXNlIC0gV2hldGhlciB0aGlzIGNvbXBvbmVudCBpcyBiZWluZyByZXVzZWQgZnJvbSBhIHBvb2xcbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIGVudGl0eVVpZDogRW50aXR5VUlELFxuICAgIGNvbXBvbmVudFNpZDogQ29tcG9uZW50U0lELFxuICAgIGVudGl0eUNvbXBvbmVudDogRW50aXR5UmVwb3NpdG9yeSxcbiAgICBpc1JlVXNlOiBib29sZWFuXG4gICkge1xuICAgIHN1cGVyKGVuZ2luZSwgZW50aXR5VWlkLCBjb21wb25lbnRTaWQsIGVudGl0eUNvbXBvbmVudCwgaXNSZVVzZSk7XG5cbiAgICB0aGlzLm1vdmVTdGFnZVRvKFByb2Nlc3NTdGFnZS5Mb2dpYyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY29tcG9uZW50IHR5cGUgaWRlbnRpZmllciBmb3IgUGh5c2ljc0NvbXBvbmVudC5cbiAgICogQHJldHVybnMgVGhlIGNvbXBvbmVudCB0eXBlIElEIGZvciBwaHlzaWNzIGNvbXBvbmVudHNcbiAgICovXG4gIHN0YXRpYyBnZXQgY29tcG9uZW50VElEKCkge1xuICAgIHJldHVybiBXZWxsS25vd25Db21wb25lbnRUSURzLlBoeXNpY3NDb21wb25lbnRUSUQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY29tcG9uZW50IHR5cGUgaWRlbnRpZmllciBmb3IgdGhpcyBpbnN0YW5jZS5cbiAgICogQHJldHVybnMgVGhlIGNvbXBvbmVudCB0eXBlIElEIGZvciBwaHlzaWNzIGNvbXBvbmVudHNcbiAgICovXG4gIGdldCBjb21wb25lbnRUSUQoKTogQ29tcG9uZW50VElEIHtcbiAgICByZXR1cm4gV2VsbEtub3duQ29tcG9uZW50VElEcy5QaHlzaWNzQ29tcG9uZW50VElEO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHBoeXNpY3Mgc3RyYXRlZ3kgZm9yIHRoaXMgY29tcG9uZW50LlxuICAgKiBUaGUgc3RyYXRlZ3kgZGVmaW5lcyBob3cgcGh5c2ljcyBjYWxjdWxhdGlvbnMgYW5kIHVwZGF0ZXMgYXJlIHBlcmZvcm1lZC5cbiAgICogQHBhcmFtIHN0cmF0ZWd5IC0gVGhlIHBoeXNpY3Mgc3RyYXRlZ3kgdG8gdXNlIGZvciB0aGlzIGNvbXBvbmVudFxuICAgKi9cbiAgc2V0U3RyYXRlZ3koc3RyYXRlZ3k6IFBoeXNpY3NTdHJhdGVneSkge1xuICAgIHRoaXMuX19zdHJhdGVneSA9IHN0cmF0ZWd5O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgcGh5c2ljcyBzdHJhdGVneSB1c2VkIGJ5IHRoaXMgY29tcG9uZW50LlxuICAgKiBAcmV0dXJucyBUaGUgcGh5c2ljcyBzdHJhdGVneSBpbnN0YW5jZSwgb3IgdW5kZWZpbmVkIGlmIG5vbmUgaXMgc2V0XG4gICAqL1xuICBnZXQgc3RyYXRlZ3koKSB7XG4gICAgcmV0dXJuIHRoaXMuX19zdHJhdGVneTtcbiAgfVxuXG4gIC8qKiBTZXRzIHByb3BlcnRpZXMgc2hhcmVkIGJ5IHRoZSBjb21wbGV0ZSByaWdpZCBib2R5IGFuZCByZWJ1aWxkcyBpdHMgY29sbGlkZXJzLiAqL1xuICBzZXRNb3Rpb25Qcm9wZXJ0eShtb3Rpb246IFBoeXNpY3NNb3Rpb25Qcm9wZXJ0eSk6IHZvaWQge1xuICAgIGlmICghbW90aW9uLm1vdmUgJiYgbW90aW9uLmlzS2luZW1hdGljKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Ega2luZW1hdGljIHBoeXNpY3MgYm9keSBtdXN0IGhhdmUgbW90aW9uLm1vdmUgZW5hYmxlZC4nKTtcbiAgICB9XG4gICAgY29uc3QgcHJldmlvdXMgPSB0aGlzLl9fbW90aW9uO1xuICAgIHRoaXMuX19tb3Rpb24gPSBQaHlzaWNzQ29tcG9uZW50Ll9fY29weU1vdGlvbihtb3Rpb24pO1xuICAgIHRyeSB7XG4gICAgICBpZiAodGhpcy5fX3NoYXBlQmluZGluZ3Muc2l6ZSA+IDApIHtcbiAgICAgICAgdGhpcy5fX2FwcGx5U2hhcGVCaW5kaW5ncyh0aGlzLl9fc2hhcGVCaW5kaW5ncywgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuX19tb3Rpb24gPSBwcmV2aW91cztcbiAgICAgICAgICB0aGlzLl9fYXBwbHlTaGFwZUJpbmRpbmdzKHRoaXMuX19zaGFwZUJpbmRpbmdzKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHRoaXMuX19tb3Rpb24gPSBwcmV2aW91cztcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIGdldCBtb3Rpb25Qcm9wZXJ0eSgpOiBQaHlzaWNzTW90aW9uUHJvcGVydHkgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9fbW90aW9uID09IG51bGwgPyB1bmRlZmluZWQgOiBQaHlzaWNzQ29tcG9uZW50Ll9fY29weU1vdGlvbih0aGlzLl9fbW90aW9uKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSByaWdpZCBib2R5IGlzIGFsbG93ZWQgdG8gbW92ZS4gRmFsc2UgbWVhbnMgYSBmaXhlZCBib2R5LlxuICAgKiBXaGVuIG5vIG1vdGlvbiBwcm9wZXJ0eSBpcyBzZXQsIHRoZSBmaXJzdCBzaGFwZSBiaW5kaW5nJ3MgYm9keSBpcyB1c2VkLlxuICAgKi9cbiAgZ2V0IGJvZHlNb3ZlKCk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLl9fbW90aW9uICE9IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLl9fbW90aW9uLm1vdmU7XG4gICAgfVxuICAgIGZvciAoY29uc3QgYmluZGluZyBvZiB0aGlzLl9fc2hhcGVCaW5kaW5ncy52YWx1ZXMoKSkge1xuICAgICAgcmV0dXJuIGJpbmRpbmcuYm9keS5tb3ZlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB3aGV0aGVyIHRoZSByaWdpZCBib2R5IG1heSBtb3ZlIGFuZCByZWJ1aWxkcyBpdHMgY29sbGlkZXJzLlxuICAgKlxuICAgKiBUaGUgbW92ZSBmbGFnIGlzIHNoYXJlZCBieSB0aGUgcmlnaWQgYm9keSBhbmQgZXZlcnkgY29sbGlkZXIsIHNvIHRoaXNcbiAgICogdXBkYXRlcyB0aGUgbW90aW9uIHByb3BlcnR5IGFuZCBhbGwgc2hhcGUgYmluZGluZ3MgdG9nZXRoZXIuIEEgZml4ZWQgYm9keVxuICAgKiBjbGVhcnMgdGhlIGtpbmVtYXRpYyBmbGFnOyBlbmFibGluZyBtb3ZlIGtlZXBzIHRoZSBjdXJyZW50IGtpbmVtYXRpYyBmbGFnXG4gICAqIHdoZW4gb25lIGlzIHNldCwgb3RoZXJ3aXNlIHRoZSBib2R5IGJlY29tZXMgZHluYW1pYy5cbiAgICpcbiAgICogQHBhcmFtIG1vdmUgLSBUcnVlIGZvciBhIG1vdmFibGUgYm9keSwgZmFsc2UgZm9yIGEgZml4ZWQgYm9keVxuICAgKi9cbiAgc2V0Qm9keU1vdmUobW92ZTogYm9vbGVhbik6IHZvaWQge1xuICAgIGNvbnN0IG5leHRJc0tpbmVtYXRpYyA9IG1vdmUgPyAodGhpcy5fX21vdGlvbj8uaXNLaW5lbWF0aWMgPz8gZmFsc2UpIDogZmFsc2U7XG4gICAgY29uc3QgbmV4dE1vdGlvbjogUGh5c2ljc01vdGlvblByb3BlcnR5ID0ge1xuICAgICAgLi4uKHRoaXMuX19tb3Rpb24gPz8ge30pLFxuICAgICAgbW92ZSxcbiAgICAgIGlzS2luZW1hdGljOiBuZXh0SXNLaW5lbWF0aWMsXG4gICAgfTtcbiAgICBjb25zdCBwcmV2aW91c01vdGlvbiA9IHRoaXMuX19tb3Rpb247XG4gICAgY29uc3QgcHJldmlvdXNCaW5kaW5ncyA9IHRoaXMuX19zaGFwZUJpbmRpbmdzO1xuXG4gICAgY29uc3QgbmV4dEJpbmRpbmdzID0gbmV3IE1hcDxudW1iZXIsIFBoeXNpY3NTaGFwZUJpbmRpbmc+KCk7XG4gICAgZm9yIChjb25zdCBbYmluZGluZ0lkLCBiaW5kaW5nXSBvZiB0aGlzLl9fc2hhcGVCaW5kaW5ncykge1xuICAgICAgbmV4dEJpbmRpbmdzLnNldChiaW5kaW5nSWQsIHtcbiAgICAgICAgLi4uYmluZGluZyxcbiAgICAgICAgYm9keTogeyAuLi5iaW5kaW5nLmJvZHksIG1vdmUsIGlzS2luZW1hdGljOiBuZXh0SXNLaW5lbWF0aWMgfSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMuX19tb3Rpb24gPSBQaHlzaWNzQ29tcG9uZW50Ll9fY29weU1vdGlvbihuZXh0TW90aW9uKTtcbiAgICB0aGlzLl9fc2hhcGVCaW5kaW5ncyA9IG5leHRCaW5kaW5ncztcblxuICAgIGlmIChuZXh0QmluZGluZ3Muc2l6ZSA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICB0aGlzLl9fYXBwbHlTaGFwZUJpbmRpbmdzKG5leHRCaW5kaW5ncywgKCkgPT4ge1xuICAgICAgICB0aGlzLl9fbW90aW9uID0gcHJldmlvdXNNb3Rpb247XG4gICAgICAgIHRoaXMuX19zaGFwZUJpbmRpbmdzID0gcHJldmlvdXNCaW5kaW5ncztcbiAgICAgICAgdGhpcy5fX2FwcGx5U2hhcGVCaW5kaW5ncyhwcmV2aW91c0JpbmRpbmdzKTtcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0aGlzLl9fbW90aW9uID0gcHJldmlvdXNNb3Rpb247XG4gICAgICB0aGlzLl9fc2hhcGVCaW5kaW5ncyA9IHByZXZpb3VzQmluZGluZ3M7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKiogQWRkcyBvbmUgZ2VuZXJpYyBTaGFwZUNvbXBvbmVudCBpbnN0YW5jZSB0byB0aGlzIHBoeXNpY2FsIGJvZHkuICovXG4gIGJpbmRTaGFwZShiaW5kaW5nOiBQaHlzaWNzU2hhcGVCaW5kaW5nKTogbnVtYmVyIHtcbiAgICBjb25zdCBpZCA9IHRoaXMuX19uZXh0U2hhcGVCaW5kaW5nSWQ7XG4gICAgY29uc3QgbmV4dCA9IG5ldyBNYXAodGhpcy5fX3NoYXBlQmluZGluZ3MpO1xuICAgIG5leHQuc2V0KGlkLCBQaHlzaWNzQ29tcG9uZW50Ll9fY29weUJpbmRpbmcoYmluZGluZykpO1xuICAgIHRoaXMuX19hcHBseVNoYXBlQmluZGluZ3NUcmFuc2FjdGlvbihuZXh0KTtcbiAgICB0aGlzLl9fc2hhcGVCaW5kaW5ncyA9IG5leHQ7XG4gICAgdGhpcy5fX25leHRTaGFwZUJpbmRpbmdJZCsrO1xuICAgIHJldHVybiBpZDtcbiAgfVxuXG4gIHVwZGF0ZVNoYXBlQmluZGluZyhiaW5kaW5nSWQ6IG51bWJlciwgYmluZGluZzogUGh5c2ljc1NoYXBlQmluZGluZyk6IHZvaWQge1xuICAgIGNvbnN0IHByZXZpb3VzID0gdGhpcy5fX3NoYXBlQmluZGluZ3MuZ2V0KGJpbmRpbmdJZCk7XG4gICAgaWYgKHByZXZpb3VzID09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgUGh5c2ljcyBzaGFwZSBiaW5kaW5nICR7YmluZGluZ0lkfSBkb2VzIG5vdCBleGlzdC5gKTtcbiAgICB9XG4gICAgY29uc3QgbmV4dCA9IG5ldyBNYXAodGhpcy5fX3NoYXBlQmluZGluZ3MpO1xuICAgIG5leHQuc2V0KGJpbmRpbmdJZCwgUGh5c2ljc0NvbXBvbmVudC5fX2NvcHlCaW5kaW5nKGJpbmRpbmcpKTtcbiAgICB0aGlzLl9fYXBwbHlTaGFwZUJpbmRpbmdzVHJhbnNhY3Rpb24obmV4dCk7XG4gICAgdGhpcy5fX3NoYXBlQmluZGluZ3MgPSBuZXh0O1xuICAgIGlmIChwcmV2aW91cy5jb2xsaWRlci5pc1NlbnNvciAmJiAhYmluZGluZy5jb2xsaWRlci5pc1NlbnNvcikge1xuICAgICAgVHJpZ2dlckNvbXBvbmVudC5fdW5yZWdpc3RlclNlbnNvckJpbmRpbmcodGhpcy5fX2VuZ2luZSwgdGhpcy5lbnRpdHkuZW50aXR5VUlELCBiaW5kaW5nSWQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGV2ZXJ5IHNoYXBlIGJpbmRpbmcgdGhhdCByZWZlcmVuY2VzIG9uZSBTaGFwZUNvbXBvbmVudCBzaGFwZS5cbiAgICogQHBhcmFtIHNoYXBlQ29tcG9uZW50IC0gU2hhcGVDb21wb25lbnQgb3duaW5nIHRoZSBzaGFwZVxuICAgKiBAcGFyYW0gc2hhcGVJbmRleCAtIFNoYXBlIGluZGV4IHJlZmVyZW5jZWQgYnkgdGhlIGJpbmRpbmdzXG4gICAqIEByZXR1cm5zIFRoZSBudW1iZXIgb2YgcmVtb3ZlZCBiaW5kaW5nc1xuICAgKi9cbiAgcmVtb3ZlU2hhcGVCaW5kaW5nc0ZvclNoYXBlKHNoYXBlQ29tcG9uZW50OiBTaGFwZUNvbXBvbmVudCwgc2hhcGVJbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBuZXh0ID0gbmV3IE1hcDxudW1iZXIsIFBoeXNpY3NTaGFwZUJpbmRpbmc+KCk7XG4gICAgY29uc3Qgc2Vuc29yQmluZGluZ0lkczogbnVtYmVyW10gPSBbXTtcbiAgICBsZXQgcmVtb3ZlZCA9IDA7XG4gICAgZm9yIChjb25zdCBbYmluZGluZ0lkLCBiaW5kaW5nXSBvZiB0aGlzLl9fc2hhcGVCaW5kaW5ncykge1xuICAgICAgaWYgKGJpbmRpbmcuc2hhcGVDb21wb25lbnQgPT09IHNoYXBlQ29tcG9uZW50ICYmIChiaW5kaW5nLnNoYXBlSW5kZXggPz8gMCkgPT09IHNoYXBlSW5kZXgpIHtcbiAgICAgICAgcmVtb3ZlZCsrO1xuICAgICAgICBpZiAoYmluZGluZy5jb2xsaWRlci5pc1NlbnNvcikge1xuICAgICAgICAgIHNlbnNvckJpbmRpbmdJZHMucHVzaChiaW5kaW5nSWQpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgbmV4dC5zZXQoYmluZGluZ0lkLCBiaW5kaW5nKTtcbiAgICB9XG5cbiAgICBpZiAocmVtb3ZlZCA9PT0gMCkge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgdGhpcy5fX2FwcGx5U2hhcGVCaW5kaW5nc1RyYW5zYWN0aW9uKG5leHQpO1xuICAgIHRoaXMuX19zaGFwZUJpbmRpbmdzID0gbmV4dDtcbiAgICBmb3IgKGNvbnN0IGJpbmRpbmdJZCBvZiBzZW5zb3JCaW5kaW5nSWRzKSB7XG4gICAgICBUcmlnZ2VyQ29tcG9uZW50Ll91bnJlZ2lzdGVyU2Vuc29yQmluZGluZyh0aGlzLl9fZW5naW5lLCB0aGlzLmVudGl0eS5lbnRpdHlVSUQsIGJpbmRpbmdJZCk7XG4gICAgfVxuICAgIHJldHVybiByZW1vdmVkO1xuICB9XG5cbiAgcmVtb3ZlU2hhcGVCaW5kaW5nKGJpbmRpbmdJZDogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgY29uc3QgcmVtb3ZlZCA9IHRoaXMuX19zaGFwZUJpbmRpbmdzLmdldChiaW5kaW5nSWQpO1xuICAgIGlmIChyZW1vdmVkID09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgbmV4dCA9IG5ldyBNYXAodGhpcy5fX3NoYXBlQmluZGluZ3MpO1xuICAgIG5leHQuZGVsZXRlKGJpbmRpbmdJZCk7XG4gICAgdGhpcy5fX2FwcGx5U2hhcGVCaW5kaW5nc1RyYW5zYWN0aW9uKG5leHQpO1xuICAgIHRoaXMuX19zaGFwZUJpbmRpbmdzID0gbmV4dDtcbiAgICBpZiAocmVtb3ZlZC5jb2xsaWRlci5pc1NlbnNvcikge1xuICAgICAgVHJpZ2dlckNvbXBvbmVudC5fdW5yZWdpc3RlclNlbnNvckJpbmRpbmcodGhpcy5fX2VuZ2luZSwgdGhpcy5lbnRpdHkuZW50aXR5VUlELCBiaW5kaW5nSWQpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGNsZWFyU2hhcGVCaW5kaW5ncygpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fX3NoYXBlQmluZGluZ3Muc2l6ZSA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9fYXBwbHlTaGFwZUJpbmRpbmdzVHJhbnNhY3Rpb24obmV3IE1hcCgpKTtcbiAgICB0aGlzLl9fdW5yZWdpc3RlclNlbnNvckJpbmRpbmdzKHRoaXMuX19zaGFwZUJpbmRpbmdzKTtcbiAgICB0aGlzLl9fc2hhcGVCaW5kaW5ncy5jbGVhcigpO1xuICB9XG5cbiAgcmVidWlsZFNoYXBlQmluZGluZ3MoKTogdm9pZCB7XG4gICAgdGhpcy5fX2FwcGx5U2hhcGVCaW5kaW5ncyh0aGlzLl9fc2hhcGVCaW5kaW5ncyk7XG4gIH1cblxuICBnZXQgc2hhcGVCaW5kaW5nQ291bnQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fX3NoYXBlQmluZGluZ3Muc2l6ZTtcbiAgfVxuXG4gIHByaXZhdGUgX19hcHBseVNoYXBlQmluZGluZ3NUcmFuc2FjdGlvbihiaW5kaW5nczogUmVhZG9ubHlNYXA8bnVtYmVyLCBQaHlzaWNzU2hhcGVCaW5kaW5nPik6IHZvaWQge1xuICAgIHRoaXMuX19hcHBseVNoYXBlQmluZGluZ3MoYmluZGluZ3MsICgpID0+IHRoaXMuX19hcHBseVNoYXBlQmluZGluZ3ModGhpcy5fX3NoYXBlQmluZGluZ3MpKTtcbiAgfVxuXG4gIHByaXZhdGUgX19hcHBseVNoYXBlQmluZGluZ3MoYmluZGluZ3M6IFJlYWRvbmx5TWFwPG51bWJlciwgUGh5c2ljc1NoYXBlQmluZGluZz4sIHJvbGxiYWNrPzogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIGNvbnN0IHN0cmF0ZWd5ID0gdGhpcy5fX3N0cmF0ZWd5O1xuICAgIGlmIChzdHJhdGVneSA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0EgcGh5c2ljcyBzdHJhdGVneSBtdXN0IGJlIHNldCBiZWZvcmUgYmluZGluZyBzaGFwZXMuJyk7XG4gICAgfVxuICAgIGNvbnN0IHJlc29sdmVkOiBQaHlzaWNzU2hhcGVJbnN0YW5jZUJpbmRpbmdbXSA9IFtdO1xuICAgIGxldCBtb3ZlOiBib29sZWFuIHwgdW5kZWZpbmVkO1xuICAgIGxldCBpc0tpbmVtYXRpYzogYm9vbGVhbiB8IHVuZGVmaW5lZDtcbiAgICBmb3IgKGNvbnN0IFtiaW5kaW5nSWQsIGJpbmRpbmddIG9mIGJpbmRpbmdzKSB7XG4gICAgICBjb25zdCBzaGFwZUluZGV4ID0gYmluZGluZy5zaGFwZUluZGV4ID8/IDA7XG4gICAgICBjb25zdCBzaGFwZSA9IGJpbmRpbmcuc2hhcGVDb21wb25lbnQuZ2V0U2hhcGUoc2hhcGVJbmRleCk7XG4gICAgICBpZiAoc2hhcGUgPT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFNoYXBlQ29tcG9uZW50IGRvZXMgbm90IGNvbnRhaW4gc2hhcGUgaW5kZXggJHtzaGFwZUluZGV4fS5gKTtcbiAgICAgIH1cbiAgICAgIGlmIChtb3ZlICE9IG51bGwgJiYgbW92ZSAhPT0gYmluZGluZy5ib2R5Lm1vdmUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBbGwgc2hhcGUgYmluZGluZ3Mgb24gb25lIFBoeXNpY3NDb21wb25lbnQgbXVzdCB1c2UgdGhlIHNhbWUgYm9keS5tb3ZlIHZhbHVlLicpO1xuICAgICAgfVxuICAgICAgY29uc3QgYmluZGluZ0lzS2luZW1hdGljID0gYmluZGluZy5ib2R5LmlzS2luZW1hdGljID8/IGZhbHNlO1xuICAgICAgaWYgKGlzS2luZW1hdGljICE9IG51bGwgJiYgaXNLaW5lbWF0aWMgIT09IGJpbmRpbmdJc0tpbmVtYXRpYykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FsbCBzaGFwZSBiaW5kaW5ncyBvbiBvbmUgUGh5c2ljc0NvbXBvbmVudCBtdXN0IHVzZSB0aGUgc2FtZSBib2R5LmlzS2luZW1hdGljIHZhbHVlLicpO1xuICAgICAgfVxuICAgICAgaWYgKCFiaW5kaW5nLmJvZHkubW92ZSAmJiBiaW5kaW5nSXNLaW5lbWF0aWMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBIGtpbmVtYXRpYyBwaHlzaWNzIGJvZHkgbXVzdCBoYXZlIGJvZHkubW92ZSBlbmFibGVkLicpO1xuICAgICAgfVxuICAgICAgbW92ZSA9IGJpbmRpbmcuYm9keS5tb3ZlO1xuICAgICAgaXNLaW5lbWF0aWMgPSBiaW5kaW5nSXNLaW5lbWF0aWM7XG4gICAgICByZXNvbHZlZC5wdXNoKHsgYmluZGluZ0lkLCBzaGFwZSwgYm9keTogeyAuLi5iaW5kaW5nLmJvZHkgfSwgY29sbGlkZXI6IHsgLi4uYmluZGluZy5jb2xsaWRlciB9IH0pO1xuICAgIH1cbiAgICBpZiAodGhpcy5fX21vdGlvbiAhPSBudWxsICYmIG1vdmUgIT0gbnVsbCAmJiB0aGlzLl9fbW90aW9uLm1vdmUgIT09IG1vdmUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUGh5c2ljcyBtb3Rpb24ubW92ZSBtdXN0IG1hdGNoIGJvZHkubW92ZSBvbiBldmVyeSBzaGFwZSBiaW5kaW5nLicpO1xuICAgIH1cbiAgICBpZiAodGhpcy5fX21vdGlvbiAhPSBudWxsICYmIGlzS2luZW1hdGljICE9IG51bGwgJiYgKHRoaXMuX19tb3Rpb24uaXNLaW5lbWF0aWMgPz8gZmFsc2UpICE9PSBpc0tpbmVtYXRpYykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdQaHlzaWNzIG1vdGlvbi5pc0tpbmVtYXRpYyBtdXN0IG1hdGNoIGJvZHkuaXNLaW5lbWF0aWMgb24gZXZlcnkgc2hhcGUgYmluZGluZy4nKTtcbiAgICB9XG4gICAgY29uc3QgZW50aXR5ID0gdGhpcy5lbnRpdHkgYXMgaW1wb3J0KCcuLi8uLi9oZWxwZXJzL0VudGl0eUhlbHBlcicpLklTY2VuZUdyYXBoRW50aXR5O1xuICAgIGNvbnN0IG1vdGlvbiA9IHRoaXMuX19tb3Rpb24gPz8gKG1vdmUgPT0gbnVsbCA/IHVuZGVmaW5lZCA6IHsgbW92ZSwgaXNLaW5lbWF0aWMgfSk7XG4gICAgaWYgKHJlc29sdmVkLmxlbmd0aCA9PT0gMCkge1xuICAgICAgaWYgKHN0cmF0ZWd5LmNsZWFyU2hhcGVJbnN0YW5jZXMgPT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBjdXJyZW50IHBoeXNpY3Mgc3RyYXRlZ3kgY2Fubm90IGNsZWFyIFNoYXBlQ29tcG9uZW50IGJpbmRpbmdzLicpO1xuICAgICAgfVxuICAgICAgdGhpcy5fX2FwcGx5QmFja2VuZFVwZGF0ZSgoKSA9PiBzdHJhdGVneS5jbGVhclNoYXBlSW5zdGFuY2VzISgpLCByb2xsYmFjayk7XG4gICAgfSBlbHNlIGlmIChzdHJhdGVneS5zZXRTaGFwZUluc3RhbmNlcyAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9fYXBwbHlCYWNrZW5kVXBkYXRlKFxuICAgICAgICAoKSA9PiBzdHJhdGVneS5zZXRTaGFwZUluc3RhbmNlcyEocmVzb2x2ZWQsIGVudGl0eSwgZW50aXR5LmdldFNjZW5lR3JhcGgoKS5fZ2V0UGh5c2ljc1dvcmxkU2NhbGUoKSwgbW90aW9uKSxcbiAgICAgICAgcm9sbGJhY2tcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmIChyZXNvbHZlZC5sZW5ndGggPT09IDEgJiYgc3RyYXRlZ3kuc2V0U2hhcGVJbnN0YW5jZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCBiaW5kaW5nID0gcmVzb2x2ZWRbMF07XG4gICAgICB0aGlzLl9fYXBwbHlCYWNrZW5kVXBkYXRlKFxuICAgICAgICAoKSA9PlxuICAgICAgICAgIHN0cmF0ZWd5LnNldFNoYXBlSW5zdGFuY2UhKFxuICAgICAgICAgICAgYmluZGluZy5zaGFwZSxcbiAgICAgICAgICAgIGJpbmRpbmcuYm9keSxcbiAgICAgICAgICAgIGJpbmRpbmcuY29sbGlkZXIsXG4gICAgICAgICAgICBlbnRpdHksXG4gICAgICAgICAgICBlbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLl9nZXRQaHlzaWNzV29ybGRTY2FsZSgpLFxuICAgICAgICAgICAgbW90aW9uXG4gICAgICAgICAgKSxcbiAgICAgICAgcm9sbGJhY2tcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGN1cnJlbnQgcGh5c2ljcyBzdHJhdGVneSBkb2VzIG5vdCBzdXBwb3J0IG11bHRpcGxlIFNoYXBlQ29tcG9uZW50IGJpbmRpbmdzLicpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX19hcHBseUJhY2tlbmRVcGRhdGUodXBkYXRlOiAoKSA9PiB2b2lkLCByb2xsYmFjaz86ICgpID0+IHZvaWQpOiB2b2lkIHtcbiAgICB0cnkge1xuICAgICAgdXBkYXRlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmIChyb2xsYmFjayA9PSBudWxsKSB7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgICAgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgcm9sbGJhY2soKTtcbiAgICAgIH0gY2F0Y2ggKHJvbGxiYWNrRXJyb3IpIHtcbiAgICAgICAgY29uc3QgdXBkYXRlTWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcbiAgICAgICAgY29uc3Qgcm9sbGJhY2tNZXNzYWdlID0gcm9sbGJhY2tFcnJvciBpbnN0YW5jZW9mIEVycm9yID8gcm9sbGJhY2tFcnJvci5tZXNzYWdlIDogU3RyaW5nKHJvbGxiYWNrRXJyb3IpO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYFBoeXNpY3MgYmFja2VuZCB1cGRhdGUgZmFpbGVkICgke3VwZGF0ZU1lc3NhZ2V9KSBhbmQgcmVzdG9yaW5nIHRoZSBwcmV2aW91cyBiaW5kaW5ncyBmYWlsZWQgKCR7cm9sbGJhY2tNZXNzYWdlfSkuYFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19jb3B5QmluZGluZyhiaW5kaW5nOiBQaHlzaWNzU2hhcGVCaW5kaW5nKTogUGh5c2ljc1NoYXBlQmluZGluZyB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNoYXBlQ29tcG9uZW50OiBiaW5kaW5nLnNoYXBlQ29tcG9uZW50LFxuICAgICAgc2hhcGVJbmRleDogYmluZGluZy5zaGFwZUluZGV4LFxuICAgICAgYm9keTogeyAuLi5iaW5kaW5nLmJvZHkgfSxcbiAgICAgIGNvbGxpZGVyOiB7IC4uLmJpbmRpbmcuY29sbGlkZXIgfSxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBfX3VucmVnaXN0ZXJTZW5zb3JCaW5kaW5ncyhiaW5kaW5nczogUmVhZG9ubHlNYXA8bnVtYmVyLCBQaHlzaWNzU2hhcGVCaW5kaW5nPik6IHZvaWQge1xuICAgIGZvciAoY29uc3QgW2JpbmRpbmdJZCwgYmluZGluZ10gb2YgYmluZGluZ3MpIHtcbiAgICAgIGlmIChiaW5kaW5nLmNvbGxpZGVyLmlzU2Vuc29yKSB7XG4gICAgICAgIFRyaWdnZXJDb21wb25lbnQuX3VucmVnaXN0ZXJTZW5zb3JCaW5kaW5nKHRoaXMuX19lbmdpbmUsIHRoaXMuZW50aXR5LmVudGl0eVVJRCwgYmluZGluZ0lkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2NvcHlNb3Rpb24obW90aW9uOiBQaHlzaWNzTW90aW9uUHJvcGVydHkpOiBQaHlzaWNzTW90aW9uUHJvcGVydHkge1xuICAgIHJldHVybiB7XG4gICAgICAuLi5tb3Rpb24sXG4gICAgICBsaW5lYXJWZWxvY2l0eTpcbiAgICAgICAgbW90aW9uLmxpbmVhclZlbG9jaXR5ID09IG51bGxcbiAgICAgICAgICA/IHVuZGVmaW5lZFxuICAgICAgICAgIDogVmVjdG9yMy5mcm9tQ29weTMobW90aW9uLmxpbmVhclZlbG9jaXR5LngsIG1vdGlvbi5saW5lYXJWZWxvY2l0eS55LCBtb3Rpb24ubGluZWFyVmVsb2NpdHkueiksXG4gICAgICBhbmd1bGFyVmVsb2NpdHk6XG4gICAgICAgIG1vdGlvbi5hbmd1bGFyVmVsb2NpdHkgPT0gbnVsbFxuICAgICAgICAgID8gdW5kZWZpbmVkXG4gICAgICAgICAgOiBWZWN0b3IzLmZyb21Db3B5Myhtb3Rpb24uYW5ndWxhclZlbG9jaXR5LngsIG1vdGlvbi5hbmd1bGFyVmVsb2NpdHkueSwgbW90aW9uLmFuZ3VsYXJWZWxvY2l0eS56KSxcbiAgICAgIGNlbnRlck9mTWFzczpcbiAgICAgICAgbW90aW9uLmNlbnRlck9mTWFzcyA9PSBudWxsXG4gICAgICAgICAgPyB1bmRlZmluZWRcbiAgICAgICAgICA6IFZlY3RvcjMuZnJvbUNvcHkzKG1vdGlvbi5jZW50ZXJPZk1hc3MueCwgbW90aW9uLmNlbnRlck9mTWFzcy55LCBtb3Rpb24uY2VudGVyT2ZNYXNzLnopLFxuICAgICAgaW5lcnRpYURpYWdvbmFsOlxuICAgICAgICBtb3Rpb24uaW5lcnRpYURpYWdvbmFsID09IG51bGxcbiAgICAgICAgICA/IHVuZGVmaW5lZFxuICAgICAgICAgIDogVmVjdG9yMy5mcm9tQ29weTMobW90aW9uLmluZXJ0aWFEaWFnb25hbC54LCBtb3Rpb24uaW5lcnRpYURpYWdvbmFsLnksIG1vdGlvbi5pbmVydGlhRGlhZ29uYWwueiksXG4gICAgICBpbmVydGlhT3JpZW50YXRpb246XG4gICAgICAgIG1vdGlvbi5pbmVydGlhT3JpZW50YXRpb24gPT0gbnVsbCA/IHVuZGVmaW5lZCA6IFF1YXRlcm5pb24uZnJvbUNvcHlRdWF0ZXJuaW9uKG1vdGlvbi5pbmVydGlhT3JpZW50YXRpb24pLFxuICAgIH07XG4gIH1cblxuICBnZXRWcm1TcHJpbmcoKSB7XG4gICAgY29uc3Qgc3RyYXRlZ3kgPSB0aGlzLl9fc3RyYXRlZ3k7XG4gICAgaWYgKElzLm5vdC5leGlzdChzdHJhdGVneSkgfHwgIShzdHJhdGVneSBpbnN0YW5jZW9mIFZSTVNwcmluZ0JvbmVQaHlzaWNzU3RyYXRlZ3kpKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHJldHVybiBzdHJhdGVneS5nZXRWcm1TcHJpbmcoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21tb24gbG9naWMgbWV0aG9kIHRoYXQgdXBkYXRlcyB0aGUgZ2xvYmFsIHBoeXNpY3Mgc2ltdWxhdGlvbi5cbiAgICogVGhpcyBpcyBjYWxsZWQgb25jZSBwZXIgZnJhbWUgZm9yIGFsbCBwaHlzaWNzIGNvbXBvbmVudHMgYW5kIGhhbmRsZXNcbiAgICogdGhlIG92ZXJhbGwgcGh5c2ljcyB3b3JsZCB1cGRhdGUgdGhyb3VnaCB0aGUgUmFwaWVyIHBoeXNpY3MgYmFja2VuZC5cbiAgICovXG4gIHN0YXRpYyBjb21tb25fJGxvZ2ljKHsgZW5naW5lIH06IHsgZW5naW5lOiBFbmdpbmUgfSkge1xuICAgIGlmICghQW5pbWF0aW9uQ29tcG9uZW50LmdldElzQW5pbWF0aW5nKGVuZ2luZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgX2dldFBoeXNpY3NCYWNrZW5kKCk/LnVwZGF0ZShcbiAgICAgIEFuaW1hdGlvblN0YXRlUmVwb3NpdG9yeS5nZXRQcm9jZXNzRnJhbWVUb2tlbihlbmdpbmUpLFxuICAgICAgVGltZS5nZXRJbnRlcnZhbFByb2Nlc3NCZWdpbihlbmdpbmUpLFxuICAgICAgZW5naW5lXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnN0YW5jZS1zcGVjaWZpYyBsb2dpYyBtZXRob2QgdGhhdCB1cGRhdGVzIHRoaXMgY29tcG9uZW50J3MgcGh5c2ljcy5cbiAgICogQ2FsbGVkIGR1cmluZyB0aGUgbG9naWMgcHJvY2Vzc2luZyBzdGFnZSB0byB1cGRhdGUgaW5kaXZpZHVhbCBwaHlzaWNzIGVudGl0aWVzLlxuICAgKi9cbiAgJGxvZ2ljKCkge1xuICAgIGlmICghQW5pbWF0aW9uQ29tcG9uZW50LmdldElzQW5pbWF0aW5nKHRoaXMuX19lbmdpbmUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX19zdHJhdGVneT8udXBkYXRlKHRoaXMuX19lbmdpbmUuY29uZmlnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2aXNpYmlsaXR5IG9mIGFsbCBjb2xsaWRlcnMgbWFuYWdlZCBieSB0aGlzIHBoeXNpY3MgY29tcG9uZW50LlxuICAgKiBUaGlzIGlzIHVzZWZ1bCBmb3IgZGVidWdnaW5nIGFuZCB2aXN1YWxpemluZyBjb2xsaXNpb24gYm91bmRhcmllcy5cbiAgICogTm90ZTogVGhpcyBvbmx5IHdvcmtzIGlmIHRoZSBwaHlzaWNzIHN0cmF0ZWd5IHN1cHBvcnRzIGNvbGxpZGVyIHZpc3VhbGl6YXRpb25cbiAgICogKGUuZy4sIFZSTVNwcmluZ0JvbmVQaHlzaWNzU3RyYXRlZ3kpLlxuICAgKlxuICAgKiBAcGFyYW0gdmlzaWJsZSAtIFdoZXRoZXIgdGhlIGNvbGxpZGVycyBzaG91bGQgYmUgdmlzaWJsZVxuICAgKi9cbiAgc2V0Q29sbGlkZXJzVmlzaWJsZSh2aXNpYmxlOiBib29sZWFuKTogdm9pZCB7XG4gICAgdGhpcy5fX3N0cmF0ZWd5Py5zZXRDb2xsaWRlcnNWaXNpYmxlPy4odmlzaWJsZSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhpcyBwaHlzaWNzIGNvbXBvbmVudCBhbmQgY2xlYW5zIHVwIHJlc291cmNlcy5cbiAgICogQ2FsbHMgdGhlIHBhcmVudCBkZXN0cm95IG1ldGhvZCBhbmQgY2xlYXJzIHRoZSBwaHlzaWNzIHN0cmF0ZWd5IHJlZmVyZW5jZS5cbiAgICogQG92ZXJyaWRlXG4gICAqL1xuICBfZGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLl9fc3RyYXRlZ3k/LmNsZWFyU2hhcGVJbnN0YW5jZXM/LigpO1xuICAgIHRoaXMuX191bnJlZ2lzdGVyU2Vuc29yQmluZGluZ3ModGhpcy5fX3NoYXBlQmluZGluZ3MpO1xuICAgIHN1cGVyLl9kZXN0cm95KCk7XG4gICAgdGhpcy5fX3N0cmF0ZWd5ID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX19zaGFwZUJpbmRpbmdzLmNsZWFyKCk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBwaHlzaWNzIGZ1bmN0aW9uYWxpdHkgdG8gYW4gZW50aXR5IGJ5IG1peGluZyBpbiBwaHlzaWNzLXNwZWNpZmljIG1ldGhvZHMuXG4gICAqIFRoaXMgbWV0aG9kIGV4dGVuZHMgdGhlIGJhc2UgZW50aXR5IGNsYXNzIHdpdGggcGh5c2ljcy1yZWxhdGVkIGNhcGFiaWxpdGllcyxcbiAgICogYWxsb3dpbmcgdGhlIGVudGl0eSB0byBhY2Nlc3MgaXRzIHBoeXNpY3MgY29tcG9uZW50IHRocm91Z2ggYSBjb252ZW5pZW50IGdldHRlci5cbiAgICogQHRlbXBsYXRlIEVudGl0eUJhc2UgLSBUaGUgYmFzZSBlbnRpdHkgdHlwZSB0byBleHRlbmRcbiAgICogQHRlbXBsYXRlIFNvbWVDb21wb25lbnRDbGFzcyAtIFRoZSBjb21wb25lbnQgY2xhc3MgdHlwZVxuICAgKiBAcGFyYW0gYmFzZSAtIFRoZSB0YXJnZXQgZW50aXR5IHRvIGFkZCBwaHlzaWNzIGZ1bmN0aW9uYWxpdHkgdG9cbiAgICogQHBhcmFtIF9jb21wb25lbnRDbGFzcyAtIFRoZSBjb21wb25lbnQgY2xhc3MgYmVpbmcgYWRkZWQgKHVzZWQgZm9yIHR5cGUgaW5mZXJlbmNlKVxuICAgKiBAcmV0dXJucyBUaGUgZW5oYW5jZWQgZW50aXR5IHdpdGggcGh5c2ljcyBtZXRob2RzIGFuZCB0aGUgb3JpZ2luYWwgZW50aXR5IGZ1bmN0aW9uYWxpdHlcbiAgICogQG92ZXJyaWRlXG4gICAqL1xuICBhZGRUaGlzQ29tcG9uZW50VG9FbnRpdHk8RW50aXR5QmFzZSBleHRlbmRzIElFbnRpdHksIFNvbWVDb21wb25lbnRDbGFzcyBleHRlbmRzIHR5cGVvZiBDb21wb25lbnQ+KFxuICAgIGJhc2U6IEVudGl0eUJhc2UsXG4gICAgX2NvbXBvbmVudENsYXNzOiBTb21lQ29tcG9uZW50Q2xhc3NcbiAgKSB7XG4gICAgY2xhc3MgUGh5c2ljc0VudGl0eSBleHRlbmRzIChiYXNlLmNvbnN0cnVjdG9yIGFzIGFueSkge1xuICAgICAgLyoqXG4gICAgICAgKiBHZXRzIHRoZSBwaHlzaWNzIGNvbXBvbmVudCBhdHRhY2hlZCB0byB0aGlzIGVudGl0eS5cbiAgICAgICAqIEByZXR1cm5zIFRoZSBQaHlzaWNzQ29tcG9uZW50IGluc3RhbmNlIGZvciB0aGlzIGVudGl0eVxuICAgICAgICovXG4gICAgICBnZXRQaHlzaWNzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRDb21wb25lbnRCeUNvbXBvbmVudFRJRChXZWxsS25vd25Db21wb25lbnRUSURzLlBoeXNpY3NDb21wb25lbnRUSUQpIGFzIFBoeXNpY3NDb21wb25lbnQ7XG4gICAgICB9XG4gICAgfVxuICAgIGFwcGx5TWl4aW5zKGJhc2UsIFBoeXNpY3NFbnRpdHkpO1xuICAgIHJldHVybiBiYXNlIGFzIHVua25vd24gYXMgQ29tcG9uZW50VG9Db21wb25lbnRNZXRob2RzPFNvbWVDb21wb25lbnRDbGFzcz4gJiBFbnRpdHlCYXNlO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxpQkFBaUI7QUFFMUIsU0FBUyxtQkFBMEM7QUFDbkQsU0FB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
