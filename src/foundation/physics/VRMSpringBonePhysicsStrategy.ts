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

export class VRMSpringBonePhysicsStrategy implements PhysicsStrategy {
  private static __tmp_vec3 = MutableVector3.zero();
  private static __tmp_vec3_2 = MutableVector3.zero();
  private static __tmp_quat = MutableQuaternion.identity();
  private __spring: VRMSpring | undefined;
  private static __colliderGroups: Map<Index, VRMColliderGroup> = new Map();

  constructor() {}

  getParentRotation(head: SceneGraphComponent) {
    return head.parent != null
      ? Quaternion.fromMatrix(head.parent!.matrixInner)
      : Quaternion.fromCopy4(0, 0, 0, 1);
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
        const childPositionInLocal = Vector3.fromCopy3(
          transform.localPosition.x * transform.localScale.x,
          transform.localPosition.y * transform.localScale.y,
          transform.localPosition.z * transform.localScale.z
        );
        bone.setup(childPositionInLocal, void 0);
      } else {
        const delta = Vector3.subtract(sg.worldPosition, sg.parent!.worldPosition);
        let childPosition = Vector3.fromCopyArray([1, 1, 1]);
        if (delta.lengthSquared() > 0) {
          childPosition = Vector3.add(
            sg.worldPosition,
            Vector3.multiply(Vector3.normalize(delta), 0.07)
          );
        }
        const childPositionInLocal = sg.getLocalPositionOf(childPosition);
        bone.setup(childPositionInLocal, void 0);
      }

      // update VRMSpringBone
      this.process(
        collisionGroups,
        bone,
        center
      );
    }
  }

  process(
    collisionGroups: VRMColliderGroup[],
    bone: VRMSpringBone,
    center?: SceneGraphComponent
  ) {
    const dragForce = bone.dragForce;
    const stiffnessForce = bone.stiffnessForce * Time.lastTickTimeInterval * 1;

    const currentTail =
      center != null ? center.getWorldPositionOf(bone.currentTail) : bone.currentTail;
    const prevTail = center != null ? center.getWorldPositionOf(bone.prevTail) : bone.prevTail;

    // Continues the previous frame's movement (there is also attenuation)
    const delta = MutableVector3.multiply(Vector3.subtract(currentTail, prevTail), 1.0 - dragForce);

    // Movement target of child bones due to parent's rotation
    const head = bone.node.getSceneGraph();
    const rotation = Quaternion.multiply(this.getParentRotation(head), bone.localRotation);
    const childBoneTarget = Vector3.multiply(
      rotation.transformVector3(bone.boneAxis),
      stiffnessForce
    );

    // Calculate the nextTail
    const external = Vector3.multiply(
      bone.gravityDir,
      bone.gravityPower * Time.lastTickTimeInterval * 1
    );
    let nextTail = Vector3.add(
      Vector3.add(Vector3.add(currentTail, delta), childBoneTarget),
      external
    );

    // Normalize to bone length
    const sub = Vector3.normalize(Vector3.subtract(nextTail, head.worldPosition));
    nextTail = Vector3.add(head.worldPosition, Vector3.multiply(sub, bone.boneLength));

    // Movement by Collision
    nextTail = this.collision(collisionGroups, nextTail, bone.hitRadius);

    // prevTail = currentTail;
    // currentTail = nextTail;
    bone.prevTail = center != null ? center.getLocalPositionOf(currentTail) : currentTail;
    bone.currentTail = center != null ? center.getLocalPositionOf(nextTail) : nextTail;

    const resultRotation = this.applyRotation(nextTail, bone, head);

    if (head.children.length > 0) {
      head.children[0].entity.getTransform().localRotation = resultRotation;
    }
    // head.entity.getTransform().localRotation = resultRotation;
  }

  applyRotation(nextTail: Vector3, bone: VRMSpringBone, head: SceneGraphComponent) {
    const result = Quaternion.fromToRotation(
      Vector3.normalize(bone.boneAxis),
      Vector3.normalize(head.getLocalPositionOf(nextTail))
    );
    return result;
  }

  collision(collisionGroups: VRMColliderGroup[], nextTail: Vector3, boneHitRadius: number) {
    for (const collisionGroup of collisionGroups) {
      for (const collider of collisionGroup.colliders) {
        const worldColliderPos = collisionGroup.baseSceneGraph!.getWorldPositionOf(
          collider.position
        );
        const r = boneHitRadius + collider.radius;
        const delta = Vector3.subtract(nextTail, worldColliderPos);
        const deltaScalar = r - delta.length();
        if (deltaScalar > 0) {
          const normal = Vector3.normalize(delta);
          const resilienceVec = Vector3.multiply(
            normal,
            deltaScalar
          );
          nextTail = Vector3.add(nextTail, resilienceVec);
          return nextTail;
        }
      }
    }

    return nextTail;
  }

  setSpring(sgs: VRMSpring) {
    this.__spring = sgs;
  }

  static addColliderGroup(index: Index, group: VRMColliderGroup) {
    this.__colliderGroups.set(index, group);
  }

  static getColliderGroups(indices: Index[]) {
    const colliderGroups: VRMColliderGroup[] = [];
    for (const index of indices) {
      colliderGroups.push(this.__colliderGroups.get(index)!);
    }
    return colliderGroups;
  }
}
