import type { Engine } from '../../system/Engine';
/**
 * Creates a material for Gaussian blur applied to encoded depth textures.
 * This material is used for creating soft shadows by blurring depth maps.
 *
 * @param options - Configuration object for the Gaussian blur material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Gaussian Blur for Encoded Depth Material instance
 */
export declare function createGaussianBlurForEncodedDepthMaterial(engine: Engine, { additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): import("../..").Material;
