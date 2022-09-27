import {ISceneGraphEntity} from '../../../helpers';
import {IVector3} from '../../../math';
import {IQuaternion} from '../../../math/IQuaternion';

export interface IAnimationRetarget {
  retargetQuaternion(
    srcEntity: ISceneGraphEntity,
    DstEntity: ISceneGraphEntity
  ): IQuaternion;
  retargetTranslate(
    srcEntity: ISceneGraphEntity,
    DstEntity: ISceneGraphEntity
  ): IVector3;
  retargetScale(
    srcEntity: ISceneGraphEntity,
    DstEntity: ISceneGraphEntity
  ): IVector3;
}
