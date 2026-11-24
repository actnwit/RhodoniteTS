import type { Engine } from '../../system/Engine';
/**
 * Creates a material for rendering environment constant colors.
 * This material is typically used for skyboxes or environment background rendering.
 *
 * @param options - Configuration object for the environment material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param options.makeOutputSrgb - Whether to convert output to sRGB color space
 * @returns A configured Environment Constant Material instance
 */
export declare function createEnvConstantMaterial(engine: Engine, { additionalName, maxInstancesNumber, makeOutputSrgb }?: {
    additionalName?: string | undefined;
    makeOutputSrgb?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}): import("../..").Material;
