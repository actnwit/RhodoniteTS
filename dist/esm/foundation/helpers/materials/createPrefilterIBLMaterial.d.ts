import type { Material } from '../../materials/core/Material';
import type { Engine } from '../../system/Engine';
/**
 * Creates a material for prefiltering IBL (Image-Based Lighting) environment maps.
 * This material generates prefiltered mipmap levels for environment map reflections.
 *
 * @param options - Configuration object for the IBL prefilter material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Prefilter IBL Material instance
 */
export declare function createPrefilterIBLMaterial(engine: Engine, { additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
