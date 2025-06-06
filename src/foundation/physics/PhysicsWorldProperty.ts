import type { IVector3 } from '../math';

/**
 * Configuration properties for a physics world simulation.
 * This type defines the essential parameters needed to initialize and configure
 * a physics world environment.
 */
export type PhysicsWorldProperty = {
  /**
   * The gravitational force vector applied to all physics bodies in the world.
   * Typically set to (0, -9.81, 0) for Earth-like gravity pointing downward.
   * @example
   * ```typescript
   * const gravity: IVector3 = { x: 0, y: -9.81, z: 0 };
   * ```
   */
  gravity: IVector3;

  /**
   * Whether to enable randomization in physics calculations.
   * When true, introduces small random variations to improve simulation stability
   * and prevent deterministic artifacts in edge cases.
   * @default false
   */
  random: boolean;
};
