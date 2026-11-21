import type { ISceneGraphEntity } from '../../../helpers';
import { type IVector3 } from '../../../math';
import type { IQuaternion } from '../../../math/IQuaternion';
export interface IAnimationRetarget {
    retargetQuaternion(dstEntity: ISceneGraphEntity): IQuaternion;
    retargetTranslate(dstEntity: ISceneGraphEntity): IVector3;
    retargetScale(dstEntity: ISceneGraphEntity): IVector3;
    getEntity(): ISceneGraphEntity;
}
/**
 * Returns the rest-pose distance from the skeleton root to the given entity.
 * For the hips this is the body's hip height.
 */
export declare function getRestHeight(entity: ISceneGraphEntity): number;
/**
 * Computes the scale factor applied to a source translation delta so that it
 * produces a proportionally sized motion on the destination skeleton.
 *
 * The scale is the ratio of the rest-pose distances from each skeleton root,
 * which is proportional to the body size. A VRM Animation may store the hip
 * height in a separate parent node (e.g. `hipsBase`), so a bone's own local rest
 * translation is not a reliable size reference.
 */
export declare function getTranslationScale(srcEntity: ISceneGraphEntity, dstEntity: ISceneGraphEntity, srcLocalRestTranslation: IVector3, dstLocalRestTranslation: IVector3): number;
