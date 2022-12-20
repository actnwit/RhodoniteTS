import { ISceneGraphEntity } from '../../../helpers/EntityHelper';
import { IVector3 } from '../../../math';
import { IQuaternion } from '../../../math/IQuaternion';
import { IAnimationRetarget } from './AnimationRetarget';
export declare class GlobalRetarget implements IAnimationRetarget {
    private __srcEntity;
    constructor(srcEntity: ISceneGraphEntity);
    getSrcPGRestQ(srcEntity: ISceneGraphEntity): IQuaternion;
    getDstPGRestQ(dstEntity: ISceneGraphEntity): IQuaternion;
    retargetQuaternion(dstEntity: ISceneGraphEntity): IQuaternion;
    retargetTranslate(dstEntity: ISceneGraphEntity): IVector3;
    retargetScale(dstEntity: ISceneGraphEntity): IVector3;
}
