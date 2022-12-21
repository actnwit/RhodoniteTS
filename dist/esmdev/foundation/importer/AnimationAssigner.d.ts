import { RnM2 } from '../../types/RnM2';
import { Vrm0x } from '../../types/VRM0x';
import { ISceneGraphEntity } from '../helpers/EntityHelper';
import { Vrm1 } from '../../types/VRM1';
declare type RetargetMode = 'none' | 'global' | 'global2' | 'absolute';
export declare class AnimationAssigner {
    private static __instance;
    assignAnimation(rootEntity: ISceneGraphEntity, gltfModel: RnM2, vrmModel: Vrm0x | Vrm1, isSameSkeleton: boolean, retargetMode?: RetargetMode, srcRootEntityForRetarget?: ISceneGraphEntity): ISceneGraphEntity;
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
export {};
