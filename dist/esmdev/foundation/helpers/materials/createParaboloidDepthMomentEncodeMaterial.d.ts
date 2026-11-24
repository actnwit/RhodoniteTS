import type { Engine } from '../../system/Engine';
/**
 * Creates a material for encoding depth moments in paraboloid projection.
 * This material is used for omnidirectional shadow mapping with paraboloid projections.
 *
 * @param options - Configuration object for the paraboloid depth material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isMorphing - Enable morph target animation support
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Paraboloid Depth Moment Encode Material instance
 */
export declare function createParaboloidDepthMomentEncodeMaterial(engine: Engine, { additionalName, isSkinning, isMorphing, maxInstancesNumber, }?: {
    additionalName?: string | undefined;
    isMorphing?: boolean | undefined;
    isSkinning?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}): import("../..").Material;
