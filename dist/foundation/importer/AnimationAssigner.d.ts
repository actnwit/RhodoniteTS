import Entity from "../core/Entity";
import { glTF2 } from "../../commontypes/glTF";
import { VRM } from "../../commontypes/VRM";
export default class AnimationAssigner {
    private static __instance;
    assignAnimation(rootEntity: Entity, gltfModel: glTF2, vrmModel: VRM, isSameSkeleton?: boolean): Entity;
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
