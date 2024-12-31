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

export class VRMSpringBonePhysicsStrategy implements PhysicsStrategy {
  private static __tmp_updateInner_vec3_0 = MutableVector3.zero();
  private static __tmp_updateInner_vec3_1 = MutableVector3.zero();
  private static __tmp_updateInner_vec3_2 = MutableVector3.zero();
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
  private static __tmp_process_vec3_10 = MutableVector3.zero();
  private static __tmp_process_vec3_11 = MutableVector3.zero();
  private static __tmp_process_quat_0 = MutableQuaternion.identity();
  private static __tmp_normalizeBoneLength_vec3_0 = MutableVector3.zero();
  private static __tmp_normalizeBoneLength_vec3_1 = MutableVector3.zero();
  private static __tmp_normalizeBoneLength_vec3_2 = MutableVector3.zero();
  private static __tmp_applyRotation_vec3_0 = MutableVector3.zero();
  private static __tmp_applyRotation_vec3_1 = MutableVector3.zero();
  private static __tmp_applyRotation_vec3_3 = MutableVector3.zero();
  private static __tmp_applyRotation_vec3_4 = MutableVector3.zero();
  private static __tmp_applyRotation_quat_0 = MutableQuaternion.identity();
  private static __tmp_applyRotation_quat_1 = MutableQuaternion.identity();
  private static __tmp_applyRotation_quat_2 = MutableQuaternion.identity();
  private static __tmp_applyRotation_quat_3 = MutableQuaternion.identity();
  private static __tmp_applyRotation_quat_4 = MutableQuaternion.identity();
  private static __tmp_collision_vec3_0 = MutableVector3.zero();
  private static __tmp_collision_vec3_1 = MutableVector3.zero();
  private static __tmp_collision_vec3_2 = MutableVector3.zero();
  private static __tmp_collision_vec3_3 = MutableVector3.zero();

  private __spring: VRMSpring | undefined;

  constructor() {}

  getParentRotation(head: SceneGraphComponent) {
    return head.parent != null ? head.parent.rotation : Quaternion.identity();
  }

  update() {
    const spring = this.__spring;
    if (Is.exist(spring)) {
      this.updateInner(spring.bones, spring);
    }
  }

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

  process(collisionGroups: VRMColliderGroup[], bone: VRMSpringBone, center?: SceneGraphComponent) {
    bone._calcWorldSpaceBoneLength();

    const dragForce = bone.dragForce;
    const stiffnessForce =
      bone.stiffnessForce * Time.lastTickTimeInterval * Config.physicsTimeIntervalScale;

    // Continues the previous frame's movement (there is also attenuation)
    let inertia = MutableVector3.multiply(
      Vector3.subtract(bone.currentTail, bone.prevTail),
      1.0 - dragForce
    ) as IVector3;
    inertia = center != null ? center.getWorldPositionOf(inertia) : inertia;

    const currentTail =
      center != null ? center.getWorldPositionOf(bone.currentTail) : bone.currentTail;
    const prevTail = center != null ? center.getWorldPositionOf(bone.prevTail) : bone.prevTail;

    // Movement target of child bones due to parent's rotation
    const rotation = Quaternion.multiply(
      this.getParentRotation(bone.node.getSceneGraph()),
      bone.node.localRotationRestInner
    );
    const stiffness = Vector3.multiply(rotation.transformVector3(bone.boneAxis), stiffnessForce);

    // Calculate the nextTail
    const external = Vector3.multiply(
      bone.gravityDir,
      bone.gravityPower * Time.lastTickTimeInterval * Config.physicsTimeIntervalScale
    );
    let nextTail = Vector3.add(
      Vector3.add(Vector3.add(currentTail, inertia), stiffness),
      external
    ) as Vector3;

    // let nextTail = currentTail;
    // Normalize to bone length
    nextTail = this.normalizeBoneLength(nextTail, bone);

    // Movement by Collision
    nextTail = this.collision(collisionGroups, nextTail, bone.hitRadius, bone);

    bone.prevTail = center != null ? center.getLocalPositionOf(currentTail) : currentTail.clone();
    bone.currentTail = center != null ? center.getLocalPositionOf(nextTail) : nextTail;

    const resultRotation = this.applyRotation(nextTail, bone);

    bone.node.localRotation = resultRotation;
  }

  normalizeBoneLength(nextTail: Vector3, bone: VRMSpringBone) {
    const sub = Vector3.normalize(Vector3.subtract(nextTail, bone.node.position));
    return Vector3.add(bone.node.position, Vector3.multiply(sub, bone.boneLength));
  }

  applyRotation(nextTail: Vector3, bone: VRMSpringBone) {
    // calc in local space
    const sub = Vector3.normalize(Vector3.subtract(nextTail, bone.node.position));
    // const sub = Vector3.subtract(nextTail, bone.node.position);
    const to = Quaternion.invert(
      Quaternion.multiply(bone.node.parent!.rotation, bone.node.localRotationRestInner)
    ).transformVector3(sub); //, VRMSpringBonePhysicsStrategy.__tmp_applyRotation_vec3_2);
    const rot = Quaternion.normalize(
      Quaternion.fromToRotation(
        Vector3.multiply(Vector3.normalize(bone.boneAxis), Config.vrmSpringBoneBonAxisCoeff),
        Vector3.multiply(Vector3.normalize(to), Config.vrmSpringBoneToCoeff)
      )
    );
    // // console.log(bone.boneLength);
    const result = Quaternion.multiply(bone.node.localRotationRestInner, rot);

    // calc in world space
    // const rotation = Quaternion.multiply(
    //   this.getParentRotation(bone.node.getSceneGraph()),
    //   bone.node.localRotationRestInner
    // );
    // const sub = Vector3.subtract(nextTail, bone.node.position);
    // let result = Quaternion.fromToRotation(rotation.transformVector3(bone.boneAxis), sub);
    // result = Quaternion.multiply(result, rotation);

    // const mat = Matrix44.invert(
    //   Matrix44.multiply(bone.node.parent!.matrixInner, bone.node.localMatrixRestInner)
    // );
    // // const to = Vector3.normalize(mat.multiplyVector3(nextTail));
    // const to = Vector3.multiplyMatrix4(nextTail, mat);
    // const result = Quaternion.multiply(
    //   bone.node.localRotationRestInner,
    //   Quaternion.normalize(Quaternion.fromToRotation(Vector3.normalize(bone.boneAxis), to))
    // );

    // const rotation = Quaternion.multiply(
    //   this.getParentRotation(bone.node.getSceneGraph()),
    //   bone.node.localRotationRestInner
    // );
    // const result = Quaternion.multiply(
    //   // bone.node.localRotationRestInner,
    //   Quaternion.fromToRotation(
    //     rotation.transformVector3(bone.boneAxis),
    //     Vector3.subtract(nextTail, bone.node.position)
    //     // Vector3.normalize(Vector3.subtract(nextTail, bone.node.position))
    //   ),
    //   // bone.node.localRotationRestInner
    //   rotation
    // );
    return result;
  }

  collision(
    collisionGroups: VRMColliderGroup[],
    nextTail: Vector3,
    boneHitRadius: number,
    bone: VRMSpringBone
  ) {
    for (const collisionGroup of collisionGroups) {
      for (const collider of collisionGroup.sphereColliders) {
        const { direction, distance } = collider.collision(nextTail, boneHitRadius);
        if (distance < 0) {
          // Hit
          nextTail = Vector3.add(nextTail, Vector3.multiply(direction, -distance));

          // normalize bone length
          nextTail = this.normalizeBoneLength(nextTail, bone);
        }
      }
      for (const collider of collisionGroup.capsuleColliders) {
        const { direction, distance } = collider.collision(nextTail, boneHitRadius);
        if (distance < 0) {
          // Hit
          nextTail = Vector3.add(nextTail, Vector3.multiply(direction, -distance));

          // normalize bone length
          nextTail = this.normalizeBoneLength(nextTail, bone);
        }
      }
    }

    return nextTail;
  }

  setSpring(sgs: VRMSpring) {
    this.__spring = sgs;
  }
}
