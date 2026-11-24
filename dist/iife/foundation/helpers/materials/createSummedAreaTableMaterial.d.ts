import type { Material } from '../../materials/core/Material';
import type { Engine } from '../../system/Engine';
/**
 * Creates a material for generating summed area tables from textures.
 * This material is used for efficient area sampling and filtering operations.
 *
 * @param options - Configuration object for the summed area table material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Summed Area Table Material instance
 */
export declare function createSummedAreaTableMaterial(engine: Engine, { additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
