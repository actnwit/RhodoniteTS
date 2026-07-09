import type { ISceneGraphEntity } from '../../../helpers/EntityHelper';
import type { IVector3 } from '../../../math';
import type { IQuaternion } from '../../../math/IQuaternion';
import type { IAnimationRetarget } from './AnimationRetarget';
/**
 * Animation retargeting implementation that uses absolute transform values.
 * This class directly returns the source entity's transform values without any modifications.
 */
export declare class AbsoluteAnimation implements IAnimationRetarget {
    private __srcEntity;
    /**
     * Creates a new AbsoluteAnimation instance.
     * @param srcEntity - The source entity whose transform values will be used for retargeting
     */
    constructor(srcEntity: ISceneGraphEntity);
    /**
     * Gets the source entity associated with this animation retarget.
     * @returns The source scene graph entity
     */
    getEntity(): ISceneGraphEntity;
    /**
     * Retargets rotation by returning the source entity's local rotation quaternion.
     * @param dstEntity - The destination entity (unused in absolute animation)
     * @returns The source entity's local rotation quaternion
     */
    retargetQuaternion(_dstEntity: ISceneGraphEntity): IQuaternion;
    /**
     * Retargets translation by returning the source entity's local position.
     * @param dstEntity - The destination entity (unused in absolute animation)
     * @returns The source entity's local position vector
     */
    retargetTranslate(_dstEntity: ISceneGraphEntity): IVector3;
    /**
     * Retargets scale by returning the source entity's local scale.
     * @param dstEntity - The destination entity (unused in absolute animation)
     * @returns The source entity's local scale vector
     */
    retargetScale(_dstEntity: ISceneGraphEntity): IVector3;
}
