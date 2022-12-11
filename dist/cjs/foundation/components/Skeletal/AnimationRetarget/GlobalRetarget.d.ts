import { ISceneGraphEntity } from '../../../helpers/EntityHelper';
import { IVector3, Quaternion } from '../../../math';
import { IQuaternion } from '../../../math/IQuaternion';
import { IAnimationRetarget } from './AnimationRetarget';
export declare class GlobalRetarget implements IAnimationRetarget {
    private __srcEntity;
    constructor(srcEntity: ISceneGraphEntity);
    getSrcRestQ(srcEntity: ISceneGraphEntity): Quaternion;
    getSrcPGRestQ(srcEntity: ISceneGraphEntity): IQuaternion;
    getDstPGRestQ(dstEntity: ISceneGraphEntity): IQuaternion;
    retargetQuaternion(dstEntity: ISceneGraphEntity): IQuaternion;
    retargetTranslate(dstEntity: ISceneGraphEntity): IVector3;
    retargetScale(dstEntity: ISceneGraphEntity): IVector3;
}
