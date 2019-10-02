import Vector3 from "../math/Vector3";
import SceneGraphComponent from "../components/SceneGraphComponent";
import RnObject from "../core/RnObject";
import { Index } from "../../types/CommonTypes";
export default class VRMSpringBoneGroup extends RnObject {
    stiffnessForce: number;
    gravityPower: number;
    gravityDir: Vector3;
    dragForce: number;
    hitRadius: number;
    rootBones: SceneGraphComponent[];
    colliderGroupIndices: Index[];
    constructor();
}
