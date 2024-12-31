import { SceneGraphComponent } from '../../components';
import { RnObject } from '../../core/RnObject';
import { ISceneGraphEntity } from '../../helpers/EntityHelper';
import { IMatrix44 } from '../../math';
import { Vector3 } from '../../math/Vector3';
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
    initialLocalChildPosition: Vector3;
    initialized: boolean;
    private static __tmp_vec3_0;
    constructor(node: ISceneGraphEntity);
    setup(center?: SceneGraphComponent): void;
    _getMatrixCenterToWorld(center?: SceneGraphComponent): IMatrix44;
    _getMatrixWorldToCenter(center?: SceneGraphComponent): IMatrix44;
    _calcWorldSpaceBoneLength(): void;
}
