import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { applyMixins, type EntityRepository } from '../../core/EntityRepository';
import { ProcessStage } from '../../definitions/ProcessStage';
import { Quaternion } from '../../math/Quaternion';
import { Vector3 } from '../../math/Vector3';
import { Is } from '../../misc/Is';
import { Time } from '../../misc/Time';
import { OimoPhysicsStrategy } from '../../physics/Oimo/OimoPhysicsStrategy';
import type {
  PhysicsBodyProperty,
  PhysicsColliderProperty,
  PhysicsMotionProperty,
} from '../../physics/PhysicsProperty';
import type { PhysicsShapeInstanceBinding, PhysicsStrategy } from '../../physics/PhysicsStrategy';
import { RapierPhysicsStrategy } from '../../physics/Rapier/RapierPhysicsStrategy';
import { VRMSpringBonePhysicsStrategy } from '../../physics/VRMSpring/VRMSpringBonePhysicsStrategy';
import type { Engine } from '../../system/Engine';
import { AnimationComponent } from '../Animation/AnimationComponent';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import type { ShapeComponent } from '../Shape/ShapeComponent';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export type PhysicsShapeBinding = {
  shapeComponent: ShapeComponent;
  shapeIndex?: number;
  body: PhysicsBodyProperty;
  collider: PhysicsColliderProperty;
};

/**
 * PhysicsComponent is a component that manages the physics simulation for an entity.
 * It provides integration with physics engines through the strategy pattern and handles
 * physics updates during the logic processing stage.
 */
export class PhysicsComponent extends Component {
  private __strategy?: PhysicsStrategy;
  private __shapeBindings = new Map<number, PhysicsShapeBinding>();
  private __nextShapeBindingId = 0;
  private __motion?: PhysicsMotionProperty;

  /**
   * Creates a new PhysicsComponent instance.
   * @param engine - The engine instance
   * @param entityUid - The unique identifier of the entity this component belongs to
   * @param componentSid - The component's serial identifier
   * @param entityComponent - The entity repository managing this component
   * @param isReUse - Whether this component is being reused from a pool
   */
  constructor(
    engine: Engine,
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityComponent: EntityRepository,
    isReUse: boolean
  ) {
    super(engine, entityUid, componentSid, entityComponent, isReUse);

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
  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.PhysicsComponentTID;
  }

  /**
   * Sets the physics strategy for this component.
   * The strategy defines how physics calculations and updates are performed.
   * @param strategy - The physics strategy to use for this component
   */
  setStrategy(strategy: PhysicsStrategy) {
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
  setMotionProperty(motion: PhysicsMotionProperty): void {
    if (!motion.move && motion.isKinematic) {
      throw new Error('A kinematic physics body must have motion.move enabled.');
    }
    const previous = this.__motion;
    this.__motion = PhysicsComponent.__copyMotion(motion);
    try {
      if (this.__shapeBindings.size > 0) {
        this.__applyShapeBindings(this.__shapeBindings);
      }
    } catch (error) {
      this.__motion = previous;
      throw error;
    }
  }

  get motionProperty(): PhysicsMotionProperty | undefined {
    return this.__motion == null ? undefined : PhysicsComponent.__copyMotion(this.__motion);
  }

  /** Adds one generic ShapeComponent instance to this physical body. */
  bindShape(binding: PhysicsShapeBinding): number {
    const id = this.__nextShapeBindingId;
    const next = new Map(this.__shapeBindings);
    next.set(id, PhysicsComponent.__copyBinding(binding));
    this.__applyShapeBindings(next);
    this.__shapeBindings = next;
    this.__nextShapeBindingId++;
    return id;
  }

  updateShapeBinding(bindingId: number, binding: PhysicsShapeBinding): void {
    if (!this.__shapeBindings.has(bindingId)) {
      throw new Error(`Physics shape binding ${bindingId} does not exist.`);
    }
    const next = new Map(this.__shapeBindings);
    next.set(bindingId, PhysicsComponent.__copyBinding(binding));
    this.__applyShapeBindings(next);
    this.__shapeBindings = next;
  }

  removeShapeBinding(bindingId: number): boolean {
    if (!this.__shapeBindings.has(bindingId)) {
      return false;
    }
    const next = new Map(this.__shapeBindings);
    next.delete(bindingId);
    this.__applyShapeBindings(next);
    this.__shapeBindings = next;
    return true;
  }

  clearShapeBindings(): void {
    if (this.__shapeBindings.size === 0) {
      return;
    }
    this.__applyShapeBindings(new Map());
    this.__shapeBindings.clear();
  }

  rebuildShapeBindings(): void {
    this.__applyShapeBindings(this.__shapeBindings);
  }

  get shapeBindingCount(): number {
    return this.__shapeBindings.size;
  }

  private __applyShapeBindings(bindings: ReadonlyMap<number, PhysicsShapeBinding>): void {
    const strategy = this.__strategy;
    if (strategy == null) {
      throw new Error('A physics strategy must be set before binding shapes.');
    }
    const resolved: PhysicsShapeInstanceBinding[] = [];
    let move: boolean | undefined;
    let isKinematic: boolean | undefined;
    for (const binding of bindings.values()) {
      const shapeIndex = binding.shapeIndex ?? 0;
      const shape = binding.shapeComponent.getShape(shapeIndex);
      if (shape == null) {
        throw new Error(`ShapeComponent does not contain shape index ${shapeIndex}.`);
      }
      if (move != null && move !== binding.body.move) {
        throw new Error('All shape bindings on one PhysicsComponent must use the same body.move value.');
      }
      const bindingIsKinematic = binding.body.isKinematic ?? false;
      if (isKinematic != null && isKinematic !== bindingIsKinematic) {
        throw new Error('All shape bindings on one PhysicsComponent must use the same body.isKinematic value.');
      }
      if (!binding.body.move && bindingIsKinematic) {
        throw new Error('A kinematic physics body must have body.move enabled.');
      }
      move = binding.body.move;
      isKinematic = bindingIsKinematic;
      resolved.push({ shape, body: { ...binding.body }, collider: { ...binding.collider } });
    }
    const entity = this.entity as import('../../helpers/EntityHelper').ISceneGraphEntity;
    const motion = this.__motion ?? (move == null ? undefined : { move, isKinematic });
    if (resolved.length === 0) {
      if (strategy.clearShapeInstances == null) {
        throw new Error('The current physics strategy cannot clear ShapeComponent bindings.');
      }
      strategy.clearShapeInstances();
    } else if (strategy.setShapeInstances != null) {
      strategy.setShapeInstances(resolved, entity, entity.getSceneGraph().scale, motion);
    } else if (resolved.length === 1 && strategy.setShapeInstance != null) {
      const binding = resolved[0];
      strategy.setShapeInstance(
        binding.shape,
        binding.body,
        binding.collider,
        entity,
        entity.getSceneGraph().scale,
        motion
      );
    } else {
      throw new Error('The current physics strategy does not support multiple ShapeComponent bindings.');
    }
  }

  private static __copyBinding(binding: PhysicsShapeBinding): PhysicsShapeBinding {
    return {
      shapeComponent: binding.shapeComponent,
      shapeIndex: binding.shapeIndex,
      body: { ...binding.body },
      collider: { ...binding.collider },
    };
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

  getVrmSpring() {
    const strategy = this.__strategy;
    if (Is.not.exist(strategy) || !(strategy instanceof VRMSpringBonePhysicsStrategy)) {
      return undefined;
    }

    return strategy.getVrmSpring();
  }

  /**
   * Common logic method that updates the global physics simulation.
   * This is called once per frame for all physics components and handles
   * the overall physics world update using the Oimo physics engine.
   */
  static common_$logic({ engine }: { engine: Engine }) {
    if (!AnimationComponent.getIsAnimating(engine)) {
      return;
    }
    OimoPhysicsStrategy.update();
    RapierPhysicsStrategy.update(Time.timeAtProcessBeginMilliseconds, Time.intervalProcessBegin);
  }

  /**
   * Instance-specific logic method that updates this component's physics.
   * Called during the logic processing stage to update individual physics entities.
   */
  $logic() {
    if (!AnimationComponent.getIsAnimating(this.__engine)) {
      return;
    }
    this.__strategy?.update(this.__engine.config);
  }

  /**
   * Sets the visibility of all colliders managed by this physics component.
   * This is useful for debugging and visualizing collision boundaries.
   * Note: This only works if the physics strategy supports collider visualization
   * (e.g., VRMSpringBonePhysicsStrategy).
   *
   * @param visible - Whether the colliders should be visible
   */
  setCollidersVisible(visible: boolean): void {
    this.__strategy?.setCollidersVisible?.(visible);
  }

  /**
   * Destroys this physics component and cleans up resources.
   * Calls the parent destroy method and clears the physics strategy reference.
   * @override
   */
  _destroy(): void {
    this.__strategy?.clearShapeInstances?.();
    super._destroy();
    this.__strategy = undefined;
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
  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class PhysicsEntity extends (base.constructor as any) {
      /**
       * Gets the physics component attached to this entity.
       * @returns The PhysicsComponent instance for this entity
       */
      getPhysics() {
        return this.getComponentByComponentTID(WellKnownComponentTIDs.PhysicsComponentTID) as PhysicsComponent;
      }
    }
    applyMixins(base, PhysicsEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}
