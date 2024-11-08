/* eslint-disable prettier/prettier */
import { ISceneGraphEntity } from '../../../helpers/EntityHelper';
import { IVector3, Matrix44, Quaternion, Vector3 } from '../../../math';
import { IQuaternion } from '../../../math/IQuaternion';
import { IAnimationRetarget } from './AnimationRetarget';

export class AbsoluteAnimation implements IAnimationRetarget {
  private __srcEntity: ISceneGraphEntity;

  constructor(srcEntity: ISceneGraphEntity) {
    this.__srcEntity = srcEntity;
  }

  getEntity(): ISceneGraphEntity {
    return this.__srcEntity;
  }

  retargetQuaternion(dstEntity: ISceneGraphEntity): IQuaternion {
    const srcEntity = this.__srcEntity;
    return srcEntity.getTransform().localRotationInner;
  }

  retargetTranslate(dstEntity: ISceneGraphEntity): IVector3 {
    const srcEntity = this.__srcEntity;

    return srcEntity.getTransform().localPositionInner;
  }

  retargetScale(dstEntity: ISceneGraphEntity): IVector3 {
    const srcEntity = this.__srcEntity;

    return srcEntity.getTransform().localScaleInner;
  }
}
