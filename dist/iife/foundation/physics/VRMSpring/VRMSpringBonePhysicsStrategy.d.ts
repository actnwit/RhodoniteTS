import type { SceneGraphComponent } from '../../components/SceneGraph/SceneGraphComponent';
import type { Config } from '../../core/Config';
import { MutableQuaternion } from '../../math/MutableQuaternion';
import { Vector3 } from '../../math/Vector3';
import type { PhysicsStrategy } from '../PhysicsStrategy';
import type { VRMColliderGroup } from './VRMColliderGroup';
import type { VRMSpring } from './VRMSpring';
import type { VRMSpringBone } from './VRMSpringBone';
/**
 * Physics strategy implementation for VRM spring bone simulation.
 *
 * This class handles the physics simulation of VRM spring bones, which are used
 * to create realistic secondary animation for hair, clothing, accessories, and other
 * flexible parts of VRM models. The simulation includes:
 * - Inertia and drag forces
 * - Gravity effects
 * - Stiffness constraints
 * - Collision detection and response
 * - Bone length normalization
 *
 * The physics simulation runs per frame and updates the rotation of spring bone nodes
 * based on physical forces and constraints.
 */
export declare class VRMSpringBonePhysicsStrategy implements PhysicsStrategy {
    private static __tmp_process_vec3_0;
    private static __tmp_process_vec3_1;
    private static __tmp_process_vec3_2;
    private static __tmp_process_vec3_3;
    private static __tmp_process_vec3_4;
    private static __tmp_process_vec3_5;
    private static __tmp_process_vec3_6;
    private static __tmp_process_vec3_7;
    private static __tmp_process_vec3_8;
    private static __tmp_process_vec3_9;
    private static __tmp_process_vec3_10;
    private static __tmp_process_quat_0;
    private static __tmp_normalizeBoneLength_vec3_0;
    private static __tmp_normalizeBoneLength_vec3_1;
    private static __tmp_normalizeBoneLength_vec3_2;
    private static __tmp_normalizeBoneLength_vec3_3;
    private static __tmp_normalizeBoneLength_vec3_4;
    private static __tmp_normalizeBoneLength_vec3_5;
    private static __tmp_applyRotation_vec3_0;
    private static __tmp_applyRotation_vec3_1;
    private static __tmp_applyRotation_vec3_2;
    private static __tmp_applyRotation_vec3_3;
    private static __tmp_applyRotation_quat_0;
    private static __tmp_applyRotation_quat_1;
    private static __tmp_applyRotation_quat_2;
    private static __tmp_applyRotation_quat_3;
    private static __tmp_applyRotation_quat_4;
    private static __tmp_getParentRotation_quat_0;
    private static __tmp_getParentRotation_quat_1_identity;
    private static __tmp_collision_vec3_0;
    private static __tmp_collision_vec3_1;
    private static __tmp_collision_vec3_2;
    private static __tmp_collision_vec3_3;
    private __spring;
    /**
     * Gets the parent rotation of the specified scene graph component.
     *
     * @param head - The scene graph component to get the parent rotation for
     * @returns The parent's rotation quaternion, or identity quaternion if no parent exists
     */
    getParentRotation(head: SceneGraphComponent): MutableQuaternion;
    /**
     * Updates the spring bone physics simulation for the current frame.
     *
     * This method is called once per frame and triggers the physics update
     * for all spring bones in the associated VRM spring system.
     */
    update(config: Config): void;
    /**
     * Internal update method that processes all spring bones in the system.
     *
     * @param bones - Array of VRM spring bones to update
     * @param spring - The VRM spring system containing configuration and colliders
     */
    updateInner(config: Config, bones: VRMSpringBone[], spring: VRMSpring): void;
    /**
     * Processes the physics simulation for a single spring bone.
     *
     * This method performs the complete physics simulation pipeline:
     * 1. Calculates inertia from previous frame movement
     * 2. Applies stiffness forces to maintain bone orientation
     * 3. Applies external forces (gravity)
     * 4. Normalizes bone length to maintain constraints
     * 5. Handles collision detection and response
     * 6. Updates bone position and rotation
     *
     * @param config - The configuration for the physics simulation
     * @param collisionGroups - Array of collision groups for collision detection
     * @param bone - The spring bone to process
     * @param center - Optional center transform for coordinate space conversion
     */
    process(config: Config, collisionGroups: VRMColliderGroup[], bone: VRMSpringBone, center?: SceneGraphComponent): void;
    /**
     * Normalizes the bone length to maintain the original bone length constraint.
     *
     * This method ensures that the spring bone maintains its original length
     * regardless of the forces applied during simulation. It calculates the
     * direction from the bone's head to the target tail position and scales
     * it to match the original bone length.
     *
     * @param nextTail - The target tail position before normalization
     * @param bone - The spring bone to normalize
     * @returns The normalized tail position maintaining the original bone length
     */
    normalizeBoneLength(nextTail: Vector3, worldSpacePosition: Vector3, bone: VRMSpringBone): import("../..").IMutableVector3;
    /**
     * Applies the calculated rotation to the spring bone based on the new tail position.
     *
     * This method calculates the rotation needed to orient the bone from its head
     * to the new tail position. It takes into account the parent's rotation and
     * the bone's rest rotation to compute the final local rotation.
     *
     * @param nextTail - The new tail position in world space
     * @param bone - The spring bone to apply rotation to
     * @returns The calculated local rotation quaternion for the bone
     */
    applyRotation(nextTail: Vector3, bone: VRMSpringBone, worldSpacePosition: Vector3): import("../..").IMutableQuaternion;
    /**
     * Handles collision detection and response for the spring bone.
     *
     * This method checks for collisions between the spring bone and all colliders
     * in the provided collision groups. It supports both sphere and capsule colliders.
     * When a collision is detected, the bone's tail position is adjusted to resolve
     * the collision, and the bone length is re-normalized.
     *
     * @param collisionGroups - Array of collision groups containing colliders
     * @param nextTail - The target tail position to check for collisions
     * @param boneHitRadius - The radius of the bone for collision detection
     * @param bone - The spring bone being tested for collisions
     * @returns The adjusted tail position after collision resolution
     */
    collision(collisionGroups: VRMColliderGroup[], nextTail: Vector3, boneHitRadius: number, bone: VRMSpringBone, worldSpacePosition: Vector3): Vector3;
    /**
     * Sets the VRM spring system to be managed by this physics strategy.
     *
     * @param sgs - The VRM spring system containing bones and configuration
     */
    setSpring(sgs: VRMSpring): void;
    /**
     * Sets the visibility of all sphere colliders in this physics strategy.
     * This creates visualization spheres for each collider if they don't exist yet.
     *
     * @param visible - Whether the colliders should be visible
     */
    setCollidersVisible(visible: boolean): void;
    getVrmSpring(): VRMSpring | undefined;
}
