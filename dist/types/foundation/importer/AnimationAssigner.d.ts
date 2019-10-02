import Entity from "../core/Entity";
import { glTF2 } from "../../types/glTF";
export default class AnimationAssigner {
    private static __instance;
    assignAnimation(rootEntity: Entity, json: glTF2): Entity;
    private constructor();
    /**
     * The static method to get singleton instance of this class.
     * @return The singleton instance of ModelConverter class
     */
    static getInstance(): AnimationAssigner;
    _setupAnimation(gltfModel: glTF2, rnEntities: Map<string, Entity>): void;
}
