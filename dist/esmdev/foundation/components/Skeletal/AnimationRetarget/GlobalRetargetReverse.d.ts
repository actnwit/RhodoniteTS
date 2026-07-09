import type { ISceneGraphEntity } from '../../../helpers/EntityHelper';
import { type IVector3, Quaternion } from '../../../math';
import type { IQuaternion } from '../../../math/IQuaternion';
import type { IAnimationRetarget } from './AnimationRetarget';
/**
 * Global retarget reverse implementation for animation retargeting.
 * This class handles the reverse retargeting of animations from source to destination entities
 * with global coordinate system considerations and 180-degree rotation reversal.
 */
export declare class GlobalRetargetReverse implements IAnimationRetarget {
    private __srcEntity;
    static readonly __rev: Quaternion;
    /**
     * Creates a new GlobalRetargetReverse instance.
     * @param srcEntity - The source entity from which animation data will be retargeted
     */
    constructor(srcEntity: ISceneGraphEntity);
    /**
     * Gets the source entity used for retargeting.
     * @returns The source scene graph entity
     */
    getEntity(): ISceneGraphEntity;
    /**
     * Gets the parent global rest quaternion for the source entity.
     * This method traverses up the hierarchy to find the parent's rest rotation
     * for entities that have VRM components.
     * @param srcEntity - The source entity to get parent global rest quaternion for
     * @returns The parent global rest quaternion, or identity quaternion if no parent exists
     */
    getSrcPGRestQ(srcEntity: ISceneGraphEntity): IQuaternion;
    /**
     * Gets the parent global rest quaternion for the destination entity.
     * This method traverses up the hierarchy to find the parent's rest rotation
     * for entities that have VRM components.
     * @param dstEntity - The destination entity to get parent global rest quaternion for
     * @returns The parent global rest quaternion, or identity quaternion if no parent exists
     */
    getDstPGRestQ(dstEntity: ISceneGraphEntity): IQuaternion;
    /**
     * Retargets the quaternion rotation from source entity to destination entity.
     * This method extracts the global animation quaternion from the source entity,
     * then applies it to the destination entity's local coordinate system with
     * a 180-degree Y-axis rotation reversal.
     * @param dstEntity - The destination entity to apply the retargeted rotation to
     * @returns The retargeted quaternion with reverse rotation applied
     */
    retargetQuaternion(dstEntity: ISceneGraphEntity): IQuaternion;
    /**
     * Retargets the translation from source entity to destination entity.
     * This method extracts the global animation translation from the source entity,
     * scales it according to the destination entity's proportions, then applies
     * a 180-degree Y-axis rotation reversal.
     * @param dstEntity - The destination entity to apply the retargeted translation to
     * @returns The retargeted translation vector with reverse rotation applied
     */
    retargetTranslate(dstEntity: ISceneGraphEntity): IVector3;
    /**
     * Retargets the scale from source entity to destination entity.
     * Currently, this method simply returns the source entity's local scale
     * without any modifications or transformations.
     * @param dstEntity - The destination entity (currently unused)
     * @returns The source entity's local scale vector
     */
    retargetScale(_dstEntity: ISceneGraphEntity): IVector3;
}
