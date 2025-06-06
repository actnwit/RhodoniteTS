import { Index } from '../../../types/CommonTypes';
import type { SceneGraphComponent } from '../../components/SceneGraph/SceneGraphComponent';
import { RnObject } from '../../core/RnObject';
import { Vector3 } from '../../math/Vector3';
import type { VRMColliderGroup } from './VRMColliderGroup';
import type { VRMSpringBone } from './VRMSpringBone';

/**
 * Represents a VRM spring bone system that manages physics simulation for character bones.
 * This class handles the configuration and management of spring bones, collider groups,
 * and their interactions within the VRM specification.
 *
 * @example
 * ```typescript
 * const rootBone = sceneGraphComponent;
 * const vrmSpring = new VRMSpring(rootBone);
 * vrmSpring.bones.push(new VRMSpringBone());
 * vrmSpring.colliderGroups.push(new VRMColliderGroup());
 * ```
 */
export class VRMSpring extends RnObject {
  /** The root bone component that serves as the base for the spring bone system */
  rootBone: SceneGraphComponent;

  /** Array of spring bones that will be affected by physics simulation */
  bones: VRMSpringBone[] = [];

  /** Array of collider groups that define collision boundaries for spring bones */
  colliderGroups: VRMColliderGroup[] = [];

  /** Optional center reference point for spring bone calculations */
  center: SceneGraphComponent | undefined;

  /**
   * Creates a new VRMSpring instance with the specified root bone.
   *
   * @param rootBone - The scene graph component that will serve as the root bone
   *                   for this spring bone system
   */
  constructor(rootBone: SceneGraphComponent) {
    super();
    this.rootBone = rootBone;
  }
}
