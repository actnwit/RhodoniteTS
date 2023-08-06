import { SceneGraphComponent } from "../components";
import { RnObject } from "../core/RnObject";
import { ISceneGraphEntity } from "../helpers/EntityHelper";
import { IVector3 } from "../math";
import { Vector3 } from "../math/Vector3";
export declare class VRMSpringBone extends RnObject {
    stiffnessForce: number;
    gravityPower: number;
    gravityDir: Vector3;
    dragForce: number;
    hitRadius: number;
    node: ISceneGraphEntity;
    currentTail: Vector3;
    prevTail: Vector3;
    boneAxis: Vector3;
    boneLength: number;
    initialized: boolean;
    constructor(node: ISceneGraphEntity);
    setup(localChildPosition: IVector3, center?: SceneGraphComponent): void;
}
