import { ISceneGraphEntity } from '../helpers/EntityHelper';
import { Vector3 } from '../math/Vector3';
export declare class VrmAimConstraint {
    private __srcEntity;
    private __dstEntity;
    private __aimAxis;
    private __weight;
    constructor(srcEntity: ISceneGraphEntity, aimAxis: 'PositiveX' | 'NegativeX' | 'PositiveY' | 'NegativeY' | 'PositiveZ' | 'NegativeZ', weight: number, dstEntity: ISceneGraphEntity);
    getAxisVector(aimAxis: 'PositiveX' | 'NegativeX' | 'PositiveY' | 'NegativeY' | 'PositiveZ' | 'NegativeZ'): Vector3;
    update(): void;
}
