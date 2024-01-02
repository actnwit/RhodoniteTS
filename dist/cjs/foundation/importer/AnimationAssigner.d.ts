import { RnM2 } from '../../types/RnM2';
import { Vrm0x } from '../../types/VRM0x';
import { ISceneGraphEntity } from '../helpers/EntityHelper';
import { Vrm1 } from '../../types/VRM1';
import { RnM2Vrma } from '../../types';
declare type RetargetMode = 'none' | 'global' | 'absolute';
export declare class AnimationAssigner {
    private static __instance;
    /**
     * Assign Animation Function
     *
     * @param rootEntity - The root entity of the model which you want to assign animation.
     * @param gltfModel - The glTF model that has animation data.
     * @param vrmModel - The corresponding VRM model to the glTF model.
     * @param isSameSkeleton
     * @param retargetMode - Retarget mode. 'none' | 'global' | 'global2' | 'absolute'
     * @param srcRootEntityForRetarget
     * @returns
     */
    assignAnimation(rootEntity: ISceneGraphEntity, gltfModel: RnM2, vrmModel: Vrm0x | Vrm1, isSameSkeleton: boolean, retargetMode: RetargetMode): ISceneGraphEntity;
    assignAnimationWithVrma(rootEntity: ISceneGraphEntity, vrmaModel: RnM2Vrma, addPrefixToAnimationTrackName?: string): string[];
    private constructor();
    /**
     * The static method to get singleton instance of this class.
     * @return The singleton instance of ModelConverter class
     */
    static getInstance(): AnimationAssigner;
    private __getCorrespondingEntity;
    private __getCorrespondingEntityWithVrma;
    private __isHips;
    private __setupAnimationForSameSkeleton;
}
export {};
