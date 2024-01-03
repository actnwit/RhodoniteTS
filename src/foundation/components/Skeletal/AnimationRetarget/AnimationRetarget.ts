import { ISceneGraphEntity } from '../../../helpers';
import { IVector3 } from '../../../math';
import { IQuaternion } from '../../../math/IQuaternion';

export interface IAnimationRetarget {
  retargetQuaternion(dstEntity: ISceneGraphEntity): IQuaternion;
  retargetTranslate(dstEntity: ISceneGraphEntity): IVector3;
  retargetScale(dstEntity: ISceneGraphEntity): IVector3;
  getEntity(): ISceneGraphEntity;
}
