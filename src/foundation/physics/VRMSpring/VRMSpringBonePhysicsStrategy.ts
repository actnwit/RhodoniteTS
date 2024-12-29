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
    const center: SceneGraphComponent | undefined = void 0;

    const collisionGroups = spring.colliderGroups;

    for (const bone of bones) {
      // setup VRMSpringBone
      const sg = bone.node.getSceneGraph();
      const children = sg.children;
      if (children.length > 0) {
        const transform = children[0].entity.getTransform();
        // const childPositionInLocal = MutableVector3.fromCopy3(
        //   transform.localPosition.x * transform.localScale.x,
        //   transform.localPosition.y * transform.localScale.y,
        //   transform.localPosition.z * transform.localScale.z
        // );
        const childPositionInLocal = transform.localPosition;
        if (childPositionInLocal.lengthSquared() < Number.EPSILON) {
          childPositionInLocal._v[1] = -1;
        }
        bone.setup(childPositionInLocal, void 0);
      } else {
        const childPosition = Vector3.multiplyTo(
          Vector3.normalizeTo(sg.position, VRMSpringBonePhysicsStrategy.__tmp_updateInner_vec3_0),
          0.07,
          VRMSpringBonePhysicsStrategy.__tmp_updateInner_vec3_1
        );
        const childPositionInLocal = sg.getLocalPositionOfTo(
          childPosition,
          VRMSpringBonePhysicsStrategy.__tmp_updateInner_vec3_2
        );
        bone.setup(childPositionInLocal, void 0);
      }
    }

    for (const bone of bones) {
      // update VRMSpringBone
      this.process(collisionGroups, bone, center);
    }
  }

  process(collisionGroups: VRMColliderGroup[], bone: VRMSpringBone, center?: SceneGraphComponent) {
    const dragForce = bone.dragForce;
    const stiffnessForce =
      bone.stiffnessForce * Time.lastTickTimeInterval * Config.physicsTimeIntervalScale;

    const currentTail =
      center != null
        ? center.getWorldPositionOfTo(
            bone.currentTail,
            VRMSpringBonePhysicsStrategy.__tmp_process_vec3_0
          )
        : bone.currentTail;
    const prevTail =
      center != null
        ? center.getWorldPositionOfTo(
            bone.prevTail,
            VRMSpringBonePhysicsStrategy.__tmp_process_vec3_1
          )
        : bone.prevTail;

    // Continues the previous frame's movement (there is also attenuation)
    const inertia = MutableVector3.multiplyTo(
      Vector3.subtractTo(currentTail, prevTail, VRMSpringBonePhysicsStrategy.__tmp_process_vec3_2),
      1.0 - dragForce,
      VRMSpringBonePhysicsStrategy.__tmp_process_vec3_3
    );

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
      bone.gravityPower * Time.lastTickTimeInterval * Config.physicsTimeIntervalScale,
      VRMSpringBonePhysicsStrategy.__tmp_process_vec3_6
    );
    let nextTail = Vector3.addTo(
      Vector3.addTo(
        Vector3.addTo(currentTail, inertia, VRMSpringBonePhysicsStrategy.__tmp_process_vec3_7),
        stiffness,
        VRMSpringBonePhysicsStrategy.__tmp_process_vec3_8
      ),
      external,
      VRMSpringBonePhysicsStrategy.__tmp_process_vec3_9
    ) as Vector3;

    // Normalize to bone length
    nextTail = this.normalizeBoneLength(nextTail, bone);

    // Movement by Collision
    nextTail = this.collision(collisionGroups, nextTail, bone.hitRadius, bone);

    // prevTail = currentTail;
    // currentTail = nextTail;
    bone.prevTail =
      center != null
        ? center.getLocalPositionOfTo(
            currentTail,
            VRMSpringBonePhysicsStrategy.__tmp_process_vec3_10
          )
        : currentTail;
    bone.currentTail =
      center != null
        ? center.getLocalPositionOfTo(nextTail, VRMSpringBonePhysicsStrategy.__tmp_process_vec3_11)
        : nextTail;

    const resultRotation = this.applyRotation(nextTail, bone);

    bone.node.localRotation = resultRotation;
    // bone.node.rotation = resultRotation;
  }

  normalizeBoneLength(nextTail: Vector3, bone: VRMSpringBone) {
    const sub = Vector3.normalizeTo(
      Vector3.subtractTo(
        nextTail,
        bone.node.position,
        VRMSpringBonePhysicsStrategy.__tmp_normalizeBoneLength_vec3_0
      ),
      VRMSpringBonePhysicsStrategy.__tmp_normalizeBoneLength_vec3_1
    );
    return Vector3.add(
      bone.node.position,
      Vector3.multiplyTo(
        sub,
        bone.boneLength,
        VRMSpringBonePhysicsStrategy.__tmp_normalizeBoneLength_vec3_2
      )
      // VRMSpringBonePhysicsStrategy.__tmp_normalizeBoneLength_vec3_3
    );
  }

  applyRotation(nextTail: Vector3, bone: VRMSpringBone) {
    // calc in local space
    const sub = Vector3.normalizeTo(
      Vector3.subtractTo(
        nextTail,
        bone.node.position,
        VRMSpringBonePhysicsStrategy.__tmp_applyRotation_vec3_0
      ),
      VRMSpringBonePhysicsStrategy.__tmp_applyRotation_vec3_1
    );
    const to = Quaternion.invertTo(
      Quaternion.multiplyTo(
        bone.node.parent!.rotation,
        bone.node.localRotationRestInner,
        VRMSpringBonePhysicsStrategy.__tmp_applyRotation_quat_0
      ),
      VRMSpringBonePhysicsStrategy.__tmp_applyRotation_quat_1
    ).transformVector3(sub); //, VRMSpringBonePhysicsStrategy.__tmp_applyRotation_vec3_2);
    const result = Quaternion.multiplyTo(
      bone.node.localRotationRestInner,
      Quaternion.normalizeTo(
        Quaternion.fromToRotationTo(
          Vector3.normalizeTo(
            bone.boneAxis,
            VRMSpringBonePhysicsStrategy.__tmp_applyRotation_vec3_3
          ),
          Vector3.normalizeTo(to, VRMSpringBonePhysicsStrategy.__tmp_applyRotation_vec3_4),
          VRMSpringBonePhysicsStrategy.__tmp_applyRotation_quat_2
        ),
        VRMSpringBonePhysicsStrategy.__tmp_applyRotation_quat_3
      ),
      VRMSpringBonePhysicsStrategy.__tmp_applyRotation_quat_4
    );

    // calc in world space
    // const rotation = Quaternion.multiply(
    //   this.getParentRotation(bone.node.getSceneGraph()),
    //   bone.node.localRotationRestInner
    // );
    // const sub = Vector3.subtract(nextTail, bone.node.position);
    // let result = Quaternion.fromToRotation(rotation.transformVector3(bone.boneAxis), sub);
    // result = Quaternion.multiply(result, rotation);

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
          nextTail = Vector3.addTo(
            nextTail,
            Vector3.multiplyTo(
              direction,
              -distance,
              VRMSpringBonePhysicsStrategy.__tmp_collision_vec3_0
            ),
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
            Vector3.multiplyTo(
              direction,
              -distance,
              VRMSpringBonePhysicsStrategy.__tmp_collision_vec3_2
            ),
            VRMSpringBonePhysicsStrategy.__tmp_collision_vec3_3
          );

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
