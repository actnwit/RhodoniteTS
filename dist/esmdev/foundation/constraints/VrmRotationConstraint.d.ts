import { ISceneGraphEntity } from '../helpers/EntityHelper';
import { IVrmConstraint } from './IVrmConstraint';
export declare class VrmRotationConstraint implements IVrmConstraint {
    private __srcEntity;
    private __dstEntity;
    private __weight;
    constructor(srcEntity: ISceneGraphEntity, weight: number, dstEntity: ISceneGraphEntity);
    update(): void;
}
