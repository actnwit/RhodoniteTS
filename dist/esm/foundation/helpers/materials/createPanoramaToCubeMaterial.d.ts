import type { Material } from '../../materials/core/Material';
import type { Engine } from '../../system/Engine';
/**
 * Creates a material for converting panoramic textures to cube map format.
 * This material transforms equirectangular panoramic images into cube map textures.
 *
 * @param options - Configuration object for the panorama to cube material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Panorama to Cube Material instance
 */
export declare function createPanoramaToCubeMaterial(engine: Engine, { additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
