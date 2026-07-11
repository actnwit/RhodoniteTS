import type { PhysicsShapeTypeEnum } from '../definitions/PhysicsShapeType';
import type { IVector3 } from '../math';

export type PhysicsEngineType = 'oimo' | 'rapier';

export type PhysicsBodyProperty = {
  /** Whether the body is dynamic. False creates a fixed body. */
  move: boolean;
  /** Whether a moving body is position-based kinematic instead of dynamic. */
  isKinematic?: boolean;
  /** Density used to derive mass. */
  density: number;
};

/** Properties shared by all colliders belonging to one rigid body. */
export type PhysicsMotionProperty = {
  /** Whether the simulation may move the body. False creates a fixed body. */
  move: boolean;
  /** Whether a moving body is position-based kinematic instead of dynamic. */
  isKinematic?: boolean;
  /** Explicit total mass in kilograms. Omit to derive mass from collider density. */
  mass?: number;
  /** Initial linear velocity expressed in the entity's local axes. */
  linearVelocity?: IVector3;
  /** Initial angular velocity expressed in the entity's local axes, in radians per second. */
  angularVelocity?: IVector3;
  /** Multiplier applied to the world's gravity for this body. */
  gravityFactor?: number;
};

export type PhysicsColliderProperty = {
  /** Surface friction coefficient. */
  friction: number;
  /** Surface restitution coefficient. */
  restitution: number;
};

/**
 * Internal physics property configuration containing detailed shape physics parameters.
 * type defines complete set properties needed physics simulation.
 * @deprecated Use ShapeComponent with PhysicsBodyProperty and PhysicsColliderProperty.
 */
export type PhysicsPropertyInner = {
  /** The type of physics shape (box, sphere, capsule, etc.) */
  type: PhysicsShapeTypeEnum;
  /** size/dimensions of physics shape in 3D space */
  size: IVector3;
  /** position offset of physics shape relative to entity */
  position: IVector3;
  /** rotation of physics shape in Euler angles */
  rotation: IVector3;
  /** Whether the physics body can move (dynamic) or is static */
  move: boolean;
  /** density of the physics body, affecting its mass */
  density: number;
  /** friction coefficient for surface interactions (0.0 to 1.0) */
  friction: number;
  /** restitution (bounciness) coefficient for collisions (0.0 to 1.0) */
  restitution: number;
};

/**
 * Simplified physics property configuration for basic physics setup.
 * type provides minimal interface for enabling physics on entities.
 */
export type PhysicsProperty = {
  /** Whether physics simulation is enabled for the entity */
  use: boolean;
  /** Physics engine to use. Defaults to 'rapier'. */
  engine?: PhysicsEngineType;
  /** Whether the physics body can move (dynamic) or is static */
  move: boolean;
  /** density of the physics body, affecting its mass */
  density: number;
  /** friction coefficient for surface interactions (0.0 to 1.0) */
  friction: number;
  /** restitution (bounciness) coefficient for collisions (0.0 to 1.0) */
  restitution: number;
};
