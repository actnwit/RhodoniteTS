import type { PhysicsShapeTypeEnum } from '../definitions/PhysicsShapeType';
import type { IVector3 } from '../math';
export type PhysicsEngineType = 'oimo' | 'rapier';
/**
 * Internal physics property configuration containing detailed shape physics parameters.
 * type defines complete set properties needed physics simulation.
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
