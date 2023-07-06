import { Vector3 } from '../math/Vector3';
import { MutableVector3 } from '../math/MutableVector3';
import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { Quaternion } from '../math/Quaternion';
import { Time } from '../misc/Time';
import { VRMSpring } from './VRMSpring';
import { VRMColliderGroup } from './VRMColliderGroup';
import { Index } from '../../types/CommonTypes';
import { PhysicsStrategy } from './PhysicsStrategy';
import { MutableQuaternion } from '../math/MutableQuaternion';
import { Is } from '../misc/Is';
import { VRMSpringBone } from './VRMSpringBone';
import { Matrix44 } from '../math/Matrix44';

export class VRMSpringBonePhysicsStrategy implements PhysicsStrategy {
  private static __tmp_vec3 = MutableVector3.zero();
  private static __tmp_vec3_2 = MutableVector3.zero();
  private static __tmp_quat = MutableQuaternion.identity();
  private __spring: VRMSpring | undefined;

  constructor() {}

  getParentRotation(head: SceneGraphComponent) {
    return head.parent != null ? head.parent.rotation : Quaternion.fromCopy4(0, 0, 0, 1);
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
        const childPositionInLocal = MutableVector3.fromCopy3(
          transform.localPosition.x * transform.localScale.x,
          transform.localPosition.y * transform.localScale.y,
          transform.localPosition.z * transform.localScale.z
        );
        if (childPositionInLocal.lengthSquared() < Number.EPSILON) {
          childPositionInLocal.y = -1;
        }
        bone.setup(childPositionInLocal, void 0);
      } else {
        const childPosition = Vector3.multiply(Vector3.normalize(sg.position), 0.07);
        const childPositionInLocal = sg.getLocalPositionOf(childPosition);
        bone.setup(childPositionInLocal, void 0);
      }

      // update VRMSpringBone
      this.process(collisionGroups, bone, center);
    }
  }

  process(collisionGroups: VRMColliderGroup[], bone: VRMSpringBone, center?: SceneGraphComponent) {
    const dragForce = bone.dragForce;
    const stiffnessForce = bone.stiffnessForce * Time.lastTickTimeInterval * 1;

    const currentTail =
      center != null ? center.getWorldPositionOf(bone.currentTail) : bone.currentTail;
    const prevTail = center != null ? center.getWorldPositionOf(bone.prevTail) : bone.prevTail;

    // Continues the previous frame's movement (there is also attenuation)
    const inertia = MutableVector3.multiply(
      Vector3.subtract(currentTail, prevTail),
      1.0 - dragForce
    );

    // Movement target of child bones due to parent's rotation
    const rotation = Quaternion.multiply(
      this.getParentRotation(bone.node.getSceneGraph()),
      bone.node.localRotationRestInner
    );
    const stiffness = Vector3.multiply(rotation.transformVector3(bone.boneAxis), stiffnessForce);

    // Calculate the nextTail
    const external = Vector3.multiply(
      bone.gravityDir,
      bone.gravityPower * Time.lastTickTimeInterval * 1
    );
    let nextTail = Vector3.add(Vector3.add(Vector3.add(currentTail, inertia), stiffness), external);

    // Normalize to bone length
    nextTail = this.normalizeBoneLength(nextTail, bone);

    // Movement by Collision
    nextTail = this.collision(collisionGroups, nextTail, bone.hitRadius, bone);

    // prevTail = currentTail;
    // currentTail = nextTail;
    bone.prevTail = center != null ? center.getLocalPositionOf(currentTail) : currentTail;
    bone.currentTail = center != null ? center.getLocalPositionOf(nextTail) : nextTail;

    const resultRotation = this.applyRotation(nextTail, bone);

    // if (head.children.length > 0) {
    //   head.children[0].entity.getTransform().localRotation = resultRotation;
    // }
    bone.node.localRotation = resultRotation;
  }

  normalizeBoneLength(nextTail: Vector3, bone: VRMSpringBone) {
    const sub = Vector3.normalize(Vector3.subtract(nextTail, bone.node.position));
    return Vector3.add(bone.node.position, Vector3.multiply(sub, bone.boneLength));
  }

  applyRotation(nextTail: Vector3, bone: VRMSpringBone) {
    const to = Matrix44.invert(
      Matrix44.multiply(bone.node.parent!.matrixInner, bone.node.localMatrixRestInner)
    ).multiplyVector3(nextTail);
    const result = Quaternion.multiply(
      bone.node.localRotationRestInner,
      Quaternion.normalize(
        Quaternion.fromToRotation(Vector3.normalize(bone.boneAxis), Vector3.normalize(to))
      )
    );
    return Quaternion.normalize(result);
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
