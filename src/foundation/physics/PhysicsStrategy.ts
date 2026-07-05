import type { Config } from '../core/Config';
import type { IQuaternion } from '../math/IQuaternion';
import type { IVector3 } from '../math/IVector';
import type { VRMSpring } from './VRMSpring/VRMSpring';

export interface PhysicsStrategy {
  update(config: Config): void;

  /**
   * Sets the world position of the physics body.
   * This is optional and only implemented by rigid-body physics strategies.
   * @param worldPosition - The new world position
   */
  setPosition?(worldPosition: IVector3): void;

  /**
   * Sets the world rotation of the physics body.
   * This is optional and only implemented by rigid-body physics strategies.
   * @param worldRotation - The new world rotation
   */
  setRotation?(worldRotation: IQuaternion): void;

  /**
   * Sets the world rotation of the physics body with Euler angles.
   * This is optional and only implemented by rigid-body physics strategies.
   * @param eulerAngles - The new Euler angles in radians
   */
  setEulerAngle?(eulerAngles: IVector3): void;

  /**
   * Sets the world scale of the physics body.
   * This is optional and only implemented by rigid-body physics strategies.
   * @param worldScale - The new world scale
   */
  setScale?(worldScale: IVector3): void;

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
