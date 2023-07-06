import { ISceneGraphEntity } from '../helpers';
import { Vector3 } from '../math/Vector3';
export declare class VrmRollConstraint {
    private __srcEntity;
    private __dstEntity;
    private __rollAxis;
    private __weight;
    constructor(srcEntity: ISceneGraphEntity, rollAxis: 'X' | 'Y' | 'Z', weight: number, dstEntity: ISceneGraphEntity);
    getAxisVector(rollAxis: 'X' | 'Y' | 'Z'): Vector3;
    update(): void;
}
