import type { Material } from '../../materials/core/Material';
import type { Engine } from '../../system/Engine';
/**
 * Creates a FXAA (Fast Approximate Anti-Aliasing) post-processing material.
 * This material applies FXAA3 quality anti-aliasing to reduce edge aliasing.
 *
 * @param options - Configuration object for the FXAA material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured FXAA3 Quality Material instance
 */
export declare function createFXAA3QualityMaterial(engine: Engine, { additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
