import { Vector3 } from '../../math/Vector3';
import { MutableVector3 } from '../../math/MutableVector3';
import { SceneGraphComponent } from '../../components/SceneGraph/SceneGraphComponent';
import { Quaternion } from '../../math/Quaternion';
import { Time } from '../../misc/Time';
import { VRMSpring } from './VRMSpring';
import { VRMColliderGroup } from './VRMColliderGroup';
import { PhysicsStrategy } from '../PhysicsStrategy';
import { MutableQuaternion } from '../../math/MutableQuaternion';
import { Is } from '../../misc/Is';
import { VRMSpringBone } from './VRMSpringBone';
import { Config } from '../../core/Config';
import { IVector3 } from '../../math/IVector';
import { Matrix44 } from '../../math/Matrix44';

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
export class VRMSpringBonePhysicsStrategy implements PhysicsStrategy {
  private static __tmp_process_vec3_0 = MutableVector3.zero();
  private static __tmp_process_vec3_1 = MutableVector3.zero();
  private static __tmp_process_vec3_2 = MutableVector3.zero();
  private static __tmp_process_vec3_3 = MutableVector3.zero();
  private static __tmp_process_vec3_4 = MutableVector3.zero();
  private static __tmp_process_vec3_5 = MutableVector3.zero();
  private static __tmp_process_vec3_6 = MutableVector3.zero();
  private static __tmp_process_vec3_7 = MutableVector3.zero();
  private static __tmp_process_vec3_8 = MutableVector3.zero();
  private static __tmp_process_vec3_9 = MutableVector3.zero();
  private static __tmp_process_quat_0 = MutableQuaternion.identity();
  private static __tmp_normalizeBoneLength_vec3_0 = MutableVector3.zero();
  private static __tmp_normalizeBoneLength_vec3_1 = MutableVector3.zero();
  private static __tmp_normalizeBoneLength_vec3_2 = MutableVector3.zero();
  private static __tmp_normalizeBoneLength_vec3_3 = MutableVector3.zero();
  private static __tmp_normalizeBoneLength_vec3_4 = MutableVector3.zero();
  private static __tmp_normalizeBoneLength_vec3_5 = MutableVector3.zero();
  private static __tmp_applyRotation_vec3_0 = MutableVector3.zero();
  private static __tmp_applyRotation_vec3_1 = MutableVector3.zero();
  private static __tmp_applyRotation_vec3_2 = MutableVector3.zero();
  private static __tmp_applyRotation_vec3_3 = MutableVector3.zero();
  private static __tmp_applyRotation_quat_0 = MutableQuaternion.identity();
  private static __tmp_applyRotation_quat_1 = MutableQuaternion.identity();
  private static __tmp_applyRotation_quat_2 = MutableQuaternion.identity();
  private static __tmp_applyRotation_quat_3 = MutableQuaternion.identity();
  private static __tmp_applyRotation_quat_4 = MutableQuaternion.identity();
  private static __tmp_getParentRotation_quat_0 = MutableQuaternion.identity();
  private static __tmp_getParentRotation_quat_1_identity = MutableQuaternion.identity();
  private static __tmp_collision_vec3_0 = MutableVector3.zero();
  private static __tmp_collision_vec3_1 = MutableVector3.zero();
  private static __tmp_collision_vec3_2 = MutableVector3.zero();
  private static __tmp_collision_vec3_3 = MutableVector3.zero();

  private __spring: VRMSpring | undefined;

  /**
   * Creates a new VRMSpringBonePhysicsStrategy instance.
   */
  constructor() {}

  /**
   * Gets the parent rotation of the specified scene graph component.
   *
   * @param head - The scene graph component to get the parent rotation for
   * @returns The parent's rotation quaternion, or identity quaternion if no parent exists
   */
  getParentRotation(head: SceneGraphComponent) {
    return head.parent != null
      ? head.parent.getRotationTo(VRMSpringBonePhysicsStrategy.__tmp_getParentRotation_quat_0)
      : VRMSpringBonePhysicsStrategy.__tmp_getParentRotation_quat_1_identity;
  }

  /**
   * Updates the spring bone physics simulation for the current frame.
   *
   * This method is called once per frame and triggers the physics update
   * for all spring bones in the associated VRM spring system.
   */
  update() {
    const spring = this.__spring;
    if (Is.exist(spring)) {
      this.updateInner(spring.bones, spring);
    }
  }

  /**
   * Internal update method that processes all spring bones in the system.
   *
   * @param bones - Array of VRM spring bones to update
   * @param spring - The VRM spring system containing configuration and colliders
   */
  updateInner(bones: VRMSpringBone[], spring: VRMSpring) {
    const center = spring.center;

    const collisionGroups = spring.colliderGroups;

    for (const bone of bones) {
      // setup VRMSpringBone
      bone.setup(center);
    }

    for (const bone of bones) {
      // update VRMSpringBone
      this.process(collisionGroups, bone, center);
    }
  }

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
   * @param collisionGroups - Array of collision groups for collision detection
   * @param bone - The spring bone to process
   * @param center - Optional center transform for coordinate space conversion
   */
  process(collisionGroups: VRMColliderGroup[], bone: VRMSpringBone, center?: SceneGraphComponent) {
    bone._calcWorldSpaceBoneLength();

    const dragForce = bone.dragForce;
    const stiffnessForce = bone.stiffnessForce * Time.intervalProcessBegin * Config.physicsTimeIntervalScale;

    // Continues the previous frame's movement (there is also attenuation)
    let inertia = MutableVector3.multiplyTo(
      Vector3.subtractTo(bone.currentTail, bone.prevTail, VRMSpringBonePhysicsStrategy.__tmp_process_vec3_0),
      1.0 - dragForce,
      VRMSpringBonePhysicsStrategy.__tmp_process_vec3_1
    ) as IVector3;

    const currentTailWithInertiaInCenter = Vector3.addTo(
      bone.currentTail,
      inertia,
      VRMSpringBonePhysicsStrategy.__tmp_process_vec3_2
    );
    const currentTailWithInertiaInWorld =
      center != null
        ? center.getWorldPositionOfTo(currentTailWithInertiaInCenter, VRMSpringBonePhysicsStrategy.__tmp_process_vec3_3)
        : currentTailWithInertiaInCenter;

    // Movement target of child bones due to parent's rotation
    const rotation = Quaternion.multiplyTo(
      this.getParentRotation(bone.node.getSceneGraph()),
      bone.node.localRotationRestInner,
      VRMSpringBonePhysicsStrategy.__tmp_process_quat_0
    );
    const stiffness = Vector3.multiplyTo(
      rotation.transformVector3To(bone.boneAxis, VRMSpringBonePhysicsStrategy.__tmp_process_vec3_4),
      stiffnessForce,
      VRMSpringBonePhysicsStrategy.__tmp_process_vec3_5
    );

    // Calculate the nextTail
    const external = Vector3.multiplyTo(
      bone.gravityDir,
      bone.gravityPower * Time.intervalProcessBegin * Config.physicsTimeIntervalScale,
      VRMSpringBonePhysicsStrategy.__tmp_process_vec3_6
    );

    let nextTail = Vector3.addTo(
      Vector3.addTo(currentTailWithInertiaInWorld, stiffness, VRMSpringBonePhysicsStrategy.__tmp_process_vec3_7),
      external,
      VRMSpringBonePhysicsStrategy.__tmp_process_vec3_8
    ) as IVector3;

    // Normalize to bone length
    nextTail = this.normalizeBoneLength(nextTail, bone);

    // Movement by Collision
    nextTail = this.collision(collisionGroups, nextTail, bone.hitRadius, bone);

    bone.prevTail = bone.currentTail.clone();
    bone.currentTail =
      center != null
        ? center.getLocalPositionOfTo(nextTail, VRMSpringBonePhysicsStrategy.__tmp_process_vec3_9).clone()
        : nextTail.clone();

    const resultRotation = this.applyRotation(nextTail, bone);

    bone.node.localRotation = resultRotation;
    bone.node.getSceneGraph().setWorldMatrixDirty();
  }

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
  normalizeBoneLength(nextTail: Vector3, bone: VRMSpringBone) {
    const sub = Vector3.normalizeTo(
      Vector3.subtractTo(
        nextTail,
        bone.node.getSceneGraph().getPositionTo(VRMSpringBonePhysicsStrategy.__tmp_normalizeBoneLength_vec3_4),
        VRMSpringBonePhysicsStrategy.__tmp_normalizeBoneLength_vec3_0
      ),
      VRMSpringBonePhysicsStrategy.__tmp_normalizeBoneLength_vec3_1
    );
    return Vector3.addTo(
      bone.node.getSceneGraph().getPositionTo(VRMSpringBonePhysicsStrategy.__tmp_normalizeBoneLength_vec3_5),
      Vector3.multiplyTo(sub, bone.boneLength, VRMSpringBonePhysicsStrategy.__tmp_normalizeBoneLength_vec3_2),
      VRMSpringBonePhysicsStrategy.__tmp_normalizeBoneLength_vec3_3
    );
  }

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
  applyRotation(nextTail: Vector3, bone: VRMSpringBone) {
    const sub = Vector3.subtractTo(
      nextTail,
      bone.node.getSceneGraph().getPositionTo(VRMSpringBonePhysicsStrategy.__tmp_applyRotation_vec3_3),
      VRMSpringBonePhysicsStrategy.__tmp_applyRotation_vec3_0
    );
    let to = Quaternion.invertTo(
      Quaternion.multiplyTo(
        bone.node.parent!.getRotationTo(VRMSpringBonePhysicsStrategy.__tmp_applyRotation_quat_4),
        bone.node.localRotationRestInner,
        VRMSpringBonePhysicsStrategy.__tmp_applyRotation_quat_0
      ),
      VRMSpringBonePhysicsStrategy.__tmp_applyRotation_quat_1
    ).transformVector3To(sub, VRMSpringBonePhysicsStrategy.__tmp_applyRotation_vec3_1);
    if (to.length() === 0) {
      to = bone.boneAxis;
    }
    const rot = Quaternion.fromToRotationTo(
      bone.boneAxis,
      Vector3.normalizeTo(to, VRMSpringBonePhysicsStrategy.__tmp_applyRotation_vec3_2),
      VRMSpringBonePhysicsStrategy.__tmp_applyRotation_quat_2
    );
    const result = Quaternion.multiplyTo(
      bone.node.localRotationRestInner,
      rot,
      VRMSpringBonePhysicsStrategy.__tmp_applyRotation_quat_3
    );

    // const mat = Matrix44.invert(
    //   Matrix44.multiply(bone.node.parent!.matrixInner, bone.node.localMatrixRestInner)
    // );
    // const to = Vector3.normalize(mat.multiplyVector3(nextTail));
    // const result = Quaternion.multiply(
    //   bone.node.localRotationRestInner,
    //   Quaternion.normalize(Quaternion.fromToRotation(bone.boneAxis, to))
    // );

    return result;
  }

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
  collision(collisionGroups: VRMColliderGroup[], nextTail: Vector3, boneHitRadius: number, bone: VRMSpringBone) {
    for (const collisionGroup of collisionGroups) {
      for (const collider of collisionGroup.sphereColliders) {
        const { direction, distance } = collider.collision(nextTail, boneHitRadius);
        if (distance < 0) {
          // Hit
          nextTail = Vector3.addTo(
            nextTail,
            Vector3.multiplyTo(direction, -distance, VRMSpringBonePhysicsStrategy.__tmp_collision_vec3_0),
            VRMSpringBonePhysicsStrategy.__tmp_collision_vec3_1
          );

          // normalize bone length
          nextTail = this.normalizeBoneLength(nextTail, bone);
        }
      }
      for (const collider of collisionGroup.capsuleColliders) {
        const { direction, distance } = collider.collision(nextTail, boneHitRadius);
        if (distance < 0) {
          // Hit
          nextTail = Vector3.addTo(
            nextTail,
            Vector3.multiplyTo(direction, -distance, VRMSpringBonePhysicsStrategy.__tmp_collision_vec3_2),
            VRMSpringBonePhysicsStrategy.__tmp_collision_vec3_3
          );

          // normalize bone length
          nextTail = this.normalizeBoneLength(nextTail, bone);
        }
      }
    }

    return nextTail;
  }

  /**
   * Sets the VRM spring system to be managed by this physics strategy.
   *
   * @param sgs - The VRM spring system containing bones and configuration
   */
  setSpring(sgs: VRMSpring) {
    this.__spring = sgs;
  }
}
