import { ISceneGraphEntity } from '../../../helpers/EntityHelper';
import { IVector3, Quaternion } from '../../../math';
import { IQuaternion } from '../../../math/IQuaternion';
import { IAnimationRetarget } from './AnimationRetarget';
export declare class GlobalRetargetReverse implements IAnimationRetarget {
    private __srcEntity;
    static readonly __rev: Quaternion;
    constructor(srcEntity: ISceneGraphEntity);
    getSrcPGRestQ(srcEntity: ISceneGraphEntity): IQuaternion;
    getDstPGRestQ(dstEntity: ISceneGraphEntity): IQuaternion;
    retargetQuaternion(dstEntity: ISceneGraphEntity): IQuaternion;
    retargetTranslate(dstEntity: ISceneGraphEntity): IVector3;
    retargetScale(dstEntity: ISceneGraphEntity): IVector3;
}
