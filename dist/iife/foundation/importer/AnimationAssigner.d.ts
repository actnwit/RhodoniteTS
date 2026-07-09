import type { RnM2Vrma } from '../../types';
import type { RnM2 } from '../../types/RnM2';
import type { VRM } from '../../types/VRM';
import type { Vrm0x } from '../../types/VRM0x';
import type { Vrm1 } from '../../types/VRM1';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import type { Engine } from '../system/Engine';
type RetargetMode = 'none' | 'global' | 'absolute';
export declare class AnimationAssigner {
    private readonly __engine;
    constructor(__engine: Engine);
    /**
     * Assigns animation data from a glTF model to a root entity with optional retargeting.
     * This method handles both same-skeleton and cross-skeleton animation assignment.
     *
     * @param rootEntity - The root entity of the model to which animation will be assigned
     * @param gltfModel - The glTF model containing animation data
     * @param vrmModel - The corresponding VRM model that provides humanoid bone mapping
     * @param isSameSkeleton - Whether the source and target skeletons are identical
     * @param retargetMode - The retargeting mode: 'none' for direct assignment, 'global' for global retargeting, 'absolute' for absolute animation
     * @returns The root entity with assigned animations
     */
    assignAnimation(rootEntity: ISceneGraphEntity, gltfModel: RnM2, vrmModel: VRM | Vrm1 | Vrm0x, isSameSkeleton: boolean, retargetMode: RetargetMode): ISceneGraphEntity;
    /**
     * Assigns animation data from a VRMA (VRM Animation) model to a root entity.
     * This method specifically handles VRM animation format with humanoid bone mapping.
     *
     * @param rootEntity - The root entity of the model to which animation will be assigned
     * @param vrmaModel - The VRMA model containing animation data and humanoid bone mappings
     * @param postfixToTrackName - Optional postfix to append to animation track names for identification
     * @returns An array of animation track names that were created
     */
    assignAnimationWithVrma(rootEntity: ISceneGraphEntity, vrmaModel: RnM2Vrma, postfixToTrackName?: string): string[];
    /**
     * Resets animation tracks and restores entities to their rest pose.
     * This method recursively processes all child entities.
     *
     * @param rootEntity - The root entity to reset
     * @param postfixToTrackName - Optional postfix to identify specific animation tracks to reset
     */
    private __resetAnimationAndPose;
    /**
     * Finds the corresponding entity in the target skeleton for a given node in the source model.
     * Handles both same-skeleton matching (by name) and cross-skeleton matching (by humanoid bone mapping).
     *
     * @param rootEntity - The root entity of the target skeleton
     * @param gltfModel - The source glTF model
     * @param vrmModel - The VRM model containing humanoid bone mappings
     * @param nodeIndex - The index of the node in the source model
     * @param nodeName - The name of the node in the source model
     * @param isSameSkeleton - Whether the source and target skeletons are identical
     * @returns The corresponding entity in the target skeleton, or undefined if not found
     */
    private __getCorrespondingEntity;
    /**
     * Finds the corresponding entity in the target skeleton for a VRMA animation node.
     * Uses humanoid bone name mapping from the VRMA model to match bones.
     *
     * @param rootEntity - The root entity of the target skeleton
     * @param gltfModel - The VRMA model containing animation data
     * @param nodeIndex - The index of the node in the VRMA model
     * @returns The corresponding entity in the target skeleton, or undefined if not found
     */
    private __getCorrespondingEntityWithVrma;
    /**
     * Determines whether a given node represents the hips bone in the humanoid skeleton.
     * This is used for special handling of hip translation animations.
     *
     * @param rootEntity - The root entity containing humanoid bone mappings
     * @param vrmModel - The VRM model with humanoid bone definitions
     * @param nodeIndex - The index of the node to check
     * @returns True if the node represents the hips bone, false otherwise
     */
    private __isHips;
    /**
     * Sets up animation components and data for entities with the same skeleton structure.
     * Processes all animation channels and applies them to corresponding entities with optional retargeting.
     *
     * @param rootEntity - The root entity of the target skeleton
     * @param gltfModel - The source glTF model containing animation data
     * @param vrmModel - The VRM model with humanoid bone mappings
     * @param isSameSkeleton - Whether the source and target skeletons are identical
     * @param retargetMode - The retargeting mode to apply
     */
    private __setupAnimationForSameSkeleton;
}
export {};
