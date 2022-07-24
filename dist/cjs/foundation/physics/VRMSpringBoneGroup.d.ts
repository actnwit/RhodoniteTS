import { Vector3 } from '../math/Vector3';
import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { RnObject } from '../core/RnObject';
import { Index } from '../../types/CommonTypes';
export declare class VRMSpringBoneGroup extends RnObject {
    stiffnessForce: number;
    gravityPower: number;
    gravityDir: Vector3;
    dragForce: number;
    hitRadius: number;
    rootBones: SceneGraphComponent[];
    colliderGroupIndices: Index[];
    constructor();
}
