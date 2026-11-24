import type { Material } from '../../materials/core/Material';
import type { Engine } from '../../system/Engine';
/**
 * Creates a material for gamma correction post-processing.
 * This material applies gamma correction to convert linear color space to sRGB.
 *
 * @param options - Configuration object for the gamma correction material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Gamma Correction Material instance
 */
export declare function createGammaCorrectionMaterial(engine: Engine, { additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
