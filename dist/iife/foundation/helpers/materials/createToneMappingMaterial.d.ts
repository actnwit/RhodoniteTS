import type { Material } from '../../materials/core/Material';
import type { Engine } from '../../system/Engine';
/**
 * Creates a material for tone mapping HDR content to LDR display.
 * This material converts high dynamic range colors to displayable range using tone mapping algorithms.
 *
 * @param options - Configuration object for the tone mapping material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Tone Mapping Material instance
 */
export declare function createToneMappingMaterial(engine: Engine, { additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
