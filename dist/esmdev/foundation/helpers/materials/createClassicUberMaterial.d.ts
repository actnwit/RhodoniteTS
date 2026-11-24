import type { Engine } from '../../system/Engine';
/**
 * Creates a Classic Uber material for traditional non-PBR rendering.
 * This material is suitable for classic shading models and legacy content.
 *
 * @param options - Configuration object for the Classic material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isLighting - Enable lighting calculations
 * @param options.isMorphing - Enable morph target animation support
 * @param options.isShadow - Enable shadow mapping support
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Classic Uber Material instance
 */
export declare function createClassicUberMaterial(engine: Engine, { additionalName, isSkinning, isLighting, isMorphing, isShadow, maxInstancesNumber, }?: {
    additionalName?: string | undefined;
    isLighting?: boolean | undefined;
    isMorphing?: boolean | undefined;
    isShadow?: boolean | undefined;
    isSkinning?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}): import("../..").Material;
