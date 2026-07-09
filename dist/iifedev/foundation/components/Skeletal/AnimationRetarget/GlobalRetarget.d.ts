import type { ISceneGraphEntity } from '../../../helpers/EntityHelper';
import { type IVector3 } from '../../../math';
import type { IQuaternion } from '../../../math/IQuaternion';
import type { IAnimationRetarget } from './AnimationRetarget';
/**
 * Global retargeting implementation for animation retargeting.
 * This class handles retargeting of animations from one entity to another using global space transformations.
 */
export declare class GlobalRetarget implements IAnimationRetarget {
    private __srcEntity;
    /**
     * Creates a new GlobalRetarget instance.
     * @param srcEntity - The source entity to retarget animations from
     */
    constructor(srcEntity: ISceneGraphEntity);
    /**
     * Gets the source entity for retargeting.
     * @returns The source scene graph entity
     */
    getEntity(): ISceneGraphEntity;
    /**
     * Gets the parent's global rest quaternion for the source entity.
     * This is used to transform from local space to global space for the source.
     * @param srcEntity - The source entity to get parent global rest quaternion for
     * @returns The parent's global rest quaternion, or identity if no parent exists
     */
    getSrcPGRestQ(srcEntity: ISceneGraphEntity): IQuaternion;
    /**
     * Gets the parent's global rest quaternion for the destination entity.
     * This is used to transform from global space to local space for the destination.
     * @param dstEntity - The destination entity to get parent global rest quaternion for
     * @returns The parent's global rest quaternion, or identity if no parent exists
     */
    getDstPGRestQ(dstEntity: ISceneGraphEntity): IQuaternion;
    /**
     * Retargets rotation from the source entity to the destination entity.
     * The method extracts the global animation quaternion from the source and applies it to the destination.
     * @param dstEntity - The destination entity to apply the retargeted rotation to
     * @returns The retargeted local rotation quaternion for the destination entity
     */
    retargetQuaternion(dstEntity: ISceneGraphEntity): IQuaternion;
    /**
     * Retargets translation from the source entity to the destination entity.
     * The method extracts the global animation translation from the source, scales it appropriately,
     * and applies it to the destination entity.
     * @param dstEntity - The destination entity to apply the retargeted translation to
     * @returns The retargeted local position vector for the destination entity
     */
    retargetTranslate(dstEntity: ISceneGraphEntity): IVector3;
    /**
     * Retargets scale from the source entity to the destination entity.
     * Currently returns the source entity's local scale directly without modification.
     * @param dstEntity - The destination entity (not used in current implementation)
     * @returns The source entity's local scale vector
     */
    retargetScale(_dstEntity: ISceneGraphEntity): IVector3;
}
