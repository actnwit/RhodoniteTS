import { Vector3 } from '../math/Vector3';
import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { Quaternion } from '../math/Quaternion';
import { VRMSpring } from './VRMSpring';
import { VRMColliderGroup } from './VRMColliderGroup';
import { PhysicsStrategy } from './PhysicsStrategy';
import { VRMSpringBone } from './VRMSpringBone';
export declare class VRMSpringBonePhysicsStrategy implements PhysicsStrategy {
    private static __tmp_vec3;
    private static __tmp_vec3_2;
    private static __tmp_quat;
    private __spring;
    constructor();
    getParentRotation(head: SceneGraphComponent): Quaternion;
    update(): void;
    updateInner(bones: VRMSpringBone[], spring: VRMSpring): void;
    process(collisionGroups: VRMColliderGroup[], bone: VRMSpringBone, center?: SceneGraphComponent): void;
    normalizeBoneLength(nextTail: Vector3, bone: VRMSpringBone): Vector3;
    applyRotation(nextTail: Vector3, bone: VRMSpringBone): Quaternion;
    collision(collisionGroups: VRMColliderGroup[], nextTail: Vector3, boneHitRadius: number, bone: VRMSpringBone): Vector3;
    setSpring(sgs: VRMSpring): void;
}
