import type { Config } from '../../core/Config';
import { PhysicsShape } from '../../definitions/PhysicsShapeType';
import type { ShapeInstance } from '../../geometry/Shape';
import type { ISceneGraphEntity } from '../../helpers';
import { type IQuaternion, type IVector3, Matrix44, Quaternion, Vector3 } from '../../math';
import { Logger } from '../../misc/Logger';
import type { PhysicsBodyProperty, PhysicsColliderProperty, PhysicsPropertyInner } from '../PhysicsProperty';
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
};

export type RapierColliderDescLike = {
  setTranslation?(x: number, y: number, z: number): RapierColliderDescLike;
  setRotation?(rotation: RapierQuaternionLike): RapierColliderDescLike;
  setDensity?(density: number): RapierColliderDescLike;
  setFriction?(friction: number): RapierColliderDescLike;
  setRestitution?(restitution: number): RapierColliderDescLike;
};

export type RapierRigidBodyLike = {
  translation(): RapierVector3Like;
  rotation(): RapierQuaternionLike;
  setTranslation(translation: RapierVector3Like, wakeUp: boolean): void;
  setRotation(rotation: RapierQuaternionLike, wakeUp: boolean): void;
  setNextKinematicTranslation?(translation: RapierVector3Like): void;
};

export type RapierColliderLike = unknown;

export type RapierCharacterControllerLike = {
  enableAutostep(maxHeight: number, minWidth: number, includeDynamicBodies: boolean): void;
  enableSnapToGround(distance: number): void;
  setMaxSlopeClimbAngle(angle: number): void;
  setMinSlopeSlideAngle(angle: number): void;
  setApplyImpulsesToDynamicBodies(enabled: boolean): void;
  computeColliderMovement(collider: RapierColliderLike, desiredTranslationDelta: RapierVector3Like): void;
  computedMovement(): RapierVector3Like;
  computedGrounded(): boolean;
};

export type RapierWorldLike = {
  step(): void;
  createRigidBody(desc: RapierRigidBodyDescLike): RapierRigidBodyLike;
  createCollider(desc: RapierColliderDescLike, rigidBody?: RapierRigidBodyLike): RapierColliderLike;
  removeRigidBody?(rigidBody: RapierRigidBodyLike): void;
  createCharacterController?(offset: number): RapierCharacterControllerLike;
  removeCharacterController?(controller: RapierCharacterControllerLike): void;
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

  private __rigidBody?: RapierRigidBodyLike;
  private __colliders: RapierColliderLike[] = [];
  private __entity?: ISceneGraphEntity;
  private __property?: StoredPhysicsProperty;
  private __localScale: IVector3 = Vector3.one();
  private __shapeLocalPosition: IVector3 = Vector3.zero();
  private __shapeLocalRotation: IQuaternion = Quaternion.identity();
  private __shapeBindings?: PhysicsShapeInstanceBinding[];
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

    RapierPhysicsStrategy.__rapier = rapier;
    RapierPhysicsStrategy.__worldProperty = worldProperty;
    RapierPhysicsStrategy.__world = new rapier.World({
      x: worldProperty.gravity.x,
      y: worldProperty.gravity.y,
      z: worldProperty.gravity.z,
    });
    RapierPhysicsStrategy.__stepParticipants.clear();
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
    this.__removeBody();
    this.__shapeBindings = undefined;
    this.__shapeLocalPosition = Vector3.zero();
    this.__shapeLocalRotation = Quaternion.identity();
    this.__setShape(prop, entity, worldScale);
  }

  setShapeInstance(
    shape: ShapeInstance,
    body: PhysicsBodyProperty,
    collider: PhysicsColliderProperty,
    entity: ISceneGraphEntity,
    worldScale: IVector3 = Vector3.one()
  ): void {
    this.setShapeInstances([{ shape, body, collider }], entity, worldScale);
  }

  setShapeInstances(
    bindings: readonly PhysicsShapeInstanceBinding[],
    entity: ISceneGraphEntity,
    worldScale: IVector3 = Vector3.one()
  ): void {
    if (bindings.length === 0) {
      this.clearShapeInstances();
      return;
    }
    const move = bindings[0].body.move;
    const isKinematic = bindings[0].body.isKinematic ?? false;
    if (bindings.some(binding => binding.body.move !== move)) {
      throw new Error('All Rapier colliders on one rigid body must use the same body.move value.');
    }
    if (bindings.some(binding => (binding.body.isKinematic ?? false) !== isKinematic)) {
      throw new Error('All Rapier colliders on one rigid body must use the same body.isKinematic value.');
    }
    if (!move && isKinematic) {
      throw new Error('A kinematic Rapier body must have body.move enabled.');
    }
    if (isKinematic && RapierPhysicsStrategy.__getRapier().RigidBodyDesc.kinematicPositionBased == null) {
      throw new Error('The injected Rapier module does not support position-based kinematic bodies.');
    }
    const scale = Vector3.fromCopy3(Math.abs(worldScale.x), Math.abs(worldScale.y), Math.abs(worldScale.z));
    for (const binding of bindings) {
      RapierPhysicsStrategy.__validateShapeSupport(binding.shape, scale);
    }
    this.__shapeBindings = bindings.map(binding => ({
      shape: binding.shape,
      body: { ...binding.body },
      collider: { ...binding.collider },
    }));
    this.__shapeWorldScale = Vector3.fromCopy3(Math.abs(worldScale.x), Math.abs(worldScale.y), Math.abs(worldScale.z));
    this.__warnedAsymmetricRadius = false;
    this.__warnedNonUniformScale = false;
    const first = bindings[0];
    const size = first.shape.shape.type === 'box' ? first.shape.shape.size : Vector3.one();
    this.__removeBody();
    this.__setShape(
      {
        type: first.shape.shape.type === 'box' ? PhysicsShape.Box : PhysicsShape.Sphere,
        size,
        position: entity.getSceneGraph().position,
        rotation: entity.getSceneGraph().eulerAngles,
        move: first.body.move,
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
    this.__rigidBody.setRotation(RapierPhysicsStrategy.__toRapierQuaternion(worldRotation), true);
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

    const position = this.__rigidBody?.translation() ?? this.__property.position;
    const rotation =
      this.__rigidBody?.rotation() ?? RapierPhysicsStrategy.__eulerToQuaternion(this.__property.rotation);
    this.__shapeWorldScale = Vector3.fromCopy3(Math.abs(worldScale.x), Math.abs(worldScale.y), Math.abs(worldScale.z));
    const scaledSize = this.__createScaledSize(worldScale);

    this.__removeBody();
    if (
      this.__shapeBindings != null &&
      (this.__shapeWorldScale.x === 0 || this.__shapeWorldScale.y === 0 || this.__shapeWorldScale.z === 0)
    ) {
      return;
    }
    if (this.__shapeBindings == null && !this.__isValidSize(this.__property, scaledSize)) {
      return;
    }
    this.__createBody(
      this.__property,
      scaledSize,
      Vector3.fromCopy3(position.x, position.y, position.z),
      Quaternion.fromCopy4(rotation.x, rotation.y, rotation.z, rotation.w)
    );
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
  static update(frameId?: number, deltaTime = 1 / 60): void {
    if (frameId != null && RapierPhysicsStrategy.__lastFrameId === frameId) {
      return;
    }
    RapierPhysicsStrategy.__lastFrameId = frameId;

    for (const participant of RapierPhysicsStrategy.__stepParticipants) {
      participant.preStep(deltaTime);
    }
    RapierPhysicsStrategy.__world?.step();
    for (const participant of RapierPhysicsStrategy.__stepParticipants) {
      participant.postStep();
    }
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

  private __createBody(prop: StoredPhysicsProperty, size: IVector3, position: IVector3, rotation: IQuaternion): void {
    const rapier = RapierPhysicsStrategy.__getRapier();
    const world = RapierPhysicsStrategy.__getWorld();
    const isKinematic = this.__shapeBindings?.[0]?.body.isKinematic ?? false;
    const rigidBodyDesc = isKinematic
      ? rapier.RigidBodyDesc.kinematicPositionBased!()
      : prop.move
        ? rapier.RigidBodyDesc.dynamic()
        : rapier.RigidBodyDesc.fixed();
    rigidBodyDesc
      .setTranslation(position.x, position.y, position.z)
      .setRotation(RapierPhysicsStrategy.__toRapierQuaternion(rotation));

    this.__rigidBody = world.createRigidBody(rigidBodyDesc);
    if (this.__shapeBindings != null) {
      for (const binding of this.__shapeBindings) {
        const colliderDesc = this.__createShapeInstanceColliderDesc(binding);
        this.__colliders.push(world.createCollider(colliderDesc, this.__rigidBody));
      }
    } else {
      this.__colliders.push(world.createCollider(this.__createColliderDesc(prop, size), this.__rigidBody));
    }
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

    colliderDesc = colliderDesc.setDensity?.(binding.body.density) ?? colliderDesc;
    colliderDesc = colliderDesc.setFriction?.(binding.collider.friction) ?? colliderDesc;
    colliderDesc = colliderDesc.setRestitution?.(binding.collider.restitution) ?? colliderDesc;
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

  private __removeBody(): void {
    if (this.__rigidBody == null) {
      return;
    }

    const world = RapierPhysicsStrategy.__getWorld();
    if (world.removeRigidBody == null) {
      throw new Error('The injected Rapier world does not support removeRigidBody.');
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
