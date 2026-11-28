import type { Material } from '../../materials/core/Material';
import type { Engine } from '../../system/Engine';
/**
 * Creates the material that renders the motion vectors (and the depth) of temporal anti-aliasing.
 *
 * @remarks
 * The material is used as the override material of a render pass. For each pixel, it outputs
 * xy: the motion from the previous frame in the texture coordinates of the render target,
 * z: the depth of the surface, w: 1.
 * The previous position of a vertex is the vertex deformed by the blend shape weights and the bone data of the
 * previous frame (`get_previousMorphedPosition`, `previousBoneData`), transformed by the previous world matrix of
 * its entity (`previousWorldMatrix`) and projected by `previousViewProjectionMatrix`.
 * The current position is projected by the camera of the render pass, without `currentJitter`.
 *
 * @param engine - The engine instance
 * @param options - Configuration object for the material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns The motion vector material
 * @internal
 */
export declare function createMotionVectorMaterial(engine: Engine, { additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
