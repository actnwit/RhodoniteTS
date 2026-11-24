import type { Material } from '../../materials/core/Material';
import type { Engine } from '../../system/Engine';
/**
 * Creates a material for Gaussian blur post-processing effects.
 * This material applies Gaussian blur for various effects like depth of field or bloom.
 *
 * @param options - Configuration object for the Gaussian blur material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Gaussian Blur Material instance
 */
export declare function createGaussianBlurMaterial(engine: Engine, { additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
