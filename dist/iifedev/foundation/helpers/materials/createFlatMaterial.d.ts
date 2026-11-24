import type { Engine } from '../../system/Engine';
/**
 * Creates a flat shading material with uniform color rendering.
 * This material renders objects with flat, unlit colors without lighting calculations.
 *
 * @param options - Configuration object for the flat material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isMorphing - Enable morph target animation support
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Flat Material instance
 */
export declare function createFlatMaterial(engine: Engine, { additionalName, isSkinning, isMorphing, maxInstancesNumber, }?: {
    additionalName?: string | undefined;
    isMorphing?: boolean | undefined;
    isSkinning?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}): import("../..").Material;
