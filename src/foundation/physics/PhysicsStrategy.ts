import type { Config } from '../core/Config';
import type { VRMSpring } from './VRMSpring/VRMSpring';

export interface PhysicsStrategy {
  update(config: Config): void;

  /**
   * Sets the visibility of all colliders in this physics strategy.
   * This is optional and only implemented by strategies that support collider visualization.
   * @param visible - Whether the colliders should be visible
   */
  setCollidersVisible?(visible: boolean): void;

  /**
   * Gets the VRM spring system managed by this physics strategy.
   * This is optional and only implemented by strategies that support VRM spring bones.
   * @returns The VRM spring system, or undefined if not supported
   */
  getVrmSpring?(): VRMSpring | undefined;
}
