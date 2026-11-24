import type { Engine } from '../../system/Engine';
/**
 * Creates a material for encoding depth moments for variance shadow mapping.
 * This material generates depth and depth-squared values for soft shadow techniques.
 *
 * @param options - Configuration object for the depth moment material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isMorphing - Enable morph target animation support
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Depth Moment Encode Material instance
 */
export declare function createDepthMomentEncodeMaterial(engine: Engine, { additionalName, isSkinning, isMorphing, maxInstancesNumber, }?: {
    additionalName?: string | undefined;
    isMorphing?: boolean | undefined;
    isSkinning?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}): import("../..").Material;
