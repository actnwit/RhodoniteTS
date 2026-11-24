import type { Material } from '../../materials/core/Material';
import type { Engine } from '../../system/Engine';
/**
 * Creates a material for outputting entity unique identifiers to render targets.
 * This material is used for object picking and selection by rendering entity IDs.
 *
 * @param options - Configuration object for the entity UID output material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Entity UID Output Material instance
 */
export declare function createEntityUIDOutputMaterial(engine: Engine, { additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
