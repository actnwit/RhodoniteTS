import { RnM2 } from '../../types/RnM2';
import { VRM } from '../../types/VRM';
import { ISceneGraphEntity } from '../helpers/EntityHelper';
export declare class AnimationAssigner {
    private static __instance;
    assignAnimation(rootEntity: ISceneGraphEntity, gltfModel: RnM2, vrmModel: VRM, isSameSkeleton?: boolean): ISceneGraphEntity;
    private constructor();
    /**
     * The static method to get singleton instance of this class.
     * @return The singleton instance of ModelConverter class
     */
    static getInstance(): AnimationAssigner;
    private __getCorrespondingEntity;
    private __isHips;
    private __setupAnimationForSameSkeleton;
}
