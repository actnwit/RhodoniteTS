import type { Engine } from '../../system/Engine';
/**
 * Creates a material for encoding depth values into color channels.
 * This material is used for depth-based effects and shadow mapping.
 *
 * @param options - Configuration object for the depth encode material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.depthPow - Power value for depth encoding (affects depth precision)
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Depth Encode Material instance
 */
export declare function createDepthEncodeMaterial(engine: Engine, { additionalName, isSkinning, depthPow, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    depthPow?: number | undefined;
    isSkinning?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}): import("../..").Material;
