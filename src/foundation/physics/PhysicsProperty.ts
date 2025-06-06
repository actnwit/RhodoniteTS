import type { PhysicsShapeTypeEnum } from '../definitions/PhysicsShapeType';
import type { IVector3 } from '../math';

/**
 * Internal physics property configuration containing detailed shape and physics parameters.
 * This type defines the complete set of properties needed for physics simulation.
 */
export type PhysicsPropertyInner = {
  /** The type of physics shape (box, sphere, capsule, etc.) */
  type: PhysicsShapeTypeEnum;
  /** The size/dimensions of the physics shape in 3D space */
  size: IVector3;
  /** The position offset of the physics shape relative to the entity */
  position: IVector3;
  /** The rotation of the physics shape in Euler angles */
  rotation: IVector3;
  /** Whether the physics body can move (dynamic) or is static */
  move: boolean;
  /** The density of the physics body, affecting its mass */
  density: number;
  /** The friction coefficient for surface interactions (0.0 to 1.0) */
  friction: number;
  /** The restitution (bounciness) coefficient for collisions (0.0 to 1.0) */
  restitution: number;
};

/**
 * Simplified physics property configuration for basic physics setup.
 * This type provides a minimal interface for enabling physics on entities.
 */
export type PhysicsProperty = {
  /** Whether physics simulation is enabled for this entity */
  use: boolean;
  /** Whether the physics body can move (dynamic) or is static */
  move: boolean;
  /** The density of the physics body, affecting its mass */
  density: number;
  /** The friction coefficient for surface interactions (0.0 to 1.0) */
  friction: number;
  /** The restitution (bounciness) coefficient for collisions (0.0 to 1.0) */
  restitution: number;
};
