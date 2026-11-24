import type { Count } from '../../../types/CommonTypes';
import type { Vrm1_Material } from '../../../types/VRMC_materials_mtoon';
import type { Engine } from '../../system/Engine';
import type { Sampler } from '../../textures/Sampler';
/**
 * Creates an MToon 1.0 material for VRM 1.0 character rendering with enhanced toon shading.
 * This material implements the MToon 1.0 specification with improved features over 0.x.
 *
 * @param options - Configuration object for the MToon 1.0 material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isMorphing - Enable morph target animation support
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isLighting - Enable lighting calculations
 * @param options.useTangentAttribute - Use tangent attributes for normal mapping
 * @param options.isOutline - Enable outline rendering
 * @param options.materialJson - MToon 1.0 material JSON definition
 * @param options.textures - Array of textures used by the material
 * @param options.samplers - Array of texture samplers
 * @param options.debugMode - Debug mode settings
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param options.makeOutputSrgb - Whether to convert output to sRGB color space
 * @returns A configured MToon 1.0 Material instance
 */
export declare function createMToon1Material(engine: Engine, { additionalName, isMorphing, isSkinning, isLighting, isOutline, materialJson, maxInstancesNumber, makeOutputSrgb, }: {
    additionalName?: string;
    isMorphing?: boolean;
    isSkinning?: boolean;
    isLighting?: boolean;
    useTangentAttribute?: boolean;
    isOutline?: boolean;
    materialJson: Vrm1_Material;
    textures?: any[];
    samplers?: Sampler[];
    debugMode?: any;
    maxInstancesNumber?: Count;
    makeOutputSrgb?: boolean;
}): import("../..").Material;
