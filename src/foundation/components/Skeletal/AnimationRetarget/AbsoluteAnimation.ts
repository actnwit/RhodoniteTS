/* eslint-disable prettier/prettier */
import type { ISceneGraphEntity } from '../../../helpers/EntityHelper';
import { type IVector3, Matrix44, Quaternion, Vector3 } from '../../../math';
import type { IQuaternion } from '../../../math/IQuaternion';
import type { IAnimationRetarget } from './AnimationRetarget';

/**
 * Animation retargeting implementation that uses absolute transform values.
 * This class directly returns the source entity's transform values without any modifications.
 */
export class AbsoluteAnimation implements IAnimationRetarget {
  private __srcEntity: ISceneGraphEntity;

  /**
   * Creates a new AbsoluteAnimation instance.
   * @param srcEntity - The source entity whose transform values will be used for retargeting
   */
  constructor(srcEntity: ISceneGraphEntity) {
    this.__srcEntity = srcEntity;
  }

  /**
   * Gets the source entity associated with this animation retarget.
   * @returns The source scene graph entity
   */
  getEntity(): ISceneGraphEntity {
    return this.__srcEntity;
  }

  /**
   * Retargets rotation by returning the source entity's local rotation quaternion.
   * @param dstEntity - The destination entity (unused in absolute animation)
   * @returns The source entity's local rotation quaternion
   */
  retargetQuaternion(_dstEntity: ISceneGraphEntity): IQuaternion {
    const srcEntity = this.__srcEntity;
    return srcEntity.getTransform().localRotationInner;
  }

  /**
   * Retargets translation by returning the source entity's local position.
   * @param dstEntity - The destination entity (unused in absolute animation)
   * @returns The source entity's local position vector
   */
  retargetTranslate(_dstEntity: ISceneGraphEntity): IVector3 {
    const srcEntity = this.__srcEntity;

    return srcEntity.getTransform().localPositionInner;
  }

  /**
   * Retargets scale by returning the source entity's local scale.
   * @param dstEntity - The destination entity (unused in absolute animation)
   * @returns The source entity's local scale vector
   */
  retargetScale(_dstEntity: ISceneGraphEntity): IVector3 {
    const srcEntity = this.__srcEntity;

    return srcEntity.getTransform().localScaleInner;
  }
}
