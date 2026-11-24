import type { Count } from '../../../types/CommonTypes';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import type { Engine } from '../../system/Engine';
export type PbrUberMaterialOptions = {
    isPbr?: boolean;
    additionalShaderSemanticInfo?: ShaderSemanticsInfo[];
    additionalName?: string;
    isMorphing?: boolean;
    isSkinning?: boolean;
    isLighting?: boolean;
    isOcclusion?: boolean;
    isEmissive?: boolean;
    isClearcoat?: boolean;
    isTransmission?: boolean;
    isVolume?: boolean;
    isSheen?: boolean;
    isSpecular?: boolean;
    isIridescence?: boolean;
    isAnisotropy?: boolean;
    isDispersion?: boolean;
    isEmissiveStrength?: boolean;
    isDiffuseTransmission?: boolean;
    isShadow?: boolean;
    useNormalTexture?: boolean;
    maxInstancesNumber?: Count;
};
/**
 * Creates a PBR (Physically Based Rendering) Uber material with extensive feature support.
 * This is a comprehensive material that supports various PBR extensions and features.
 *
 * @param options - Configuration object for the PBR material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isMorphing - Enable morph target animation support
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isLighting - Enable lighting calculations
 * @param options.isOcclusion - Enable ambient occlusion texture support
 * @param options.isEmissive - Enable emissive texture support
 * @param options.isClearcoat - Enable clear coat extension (KHR_materials_clearcoat)
 * @param options.isTransmission - Enable transmission extension (KHR_materials_transmission)
 * @param options.isVolume - Enable volume extension (KHR_materials_volume)
 * @param options.isSheen - Enable sheen extension (KHR_materials_sheen)
 * @param options.isSpecular - Enable specular extension (KHR_materials_specular)
 * @param options.isIridescence - Enable iridescence extension (KHR_materials_iridescence)
 * @param options.isAnisotropy - Enable anisotropy extension (KHR_materials_anisotropy)
 * @param options.isDispersion - Enable dispersion extension (KHR_materials_dispersion)
 * @param options.isEmissiveStrength - Enable emissive strength extension
 * @param options.isDiffuseTransmission - Enable diffuse transmission extension
 * @param options.isShadow - Enable shadow mapping support
 * @param options.useTangentAttribute - Use tangent attributes for normal mapping
 * @param options.useNormalTexture - Enable normal texture support
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured PBR Uber Material instance
 */
export declare function createPbrUberMaterial(engine: Engine, { additionalName, isMorphing, isSkinning, isLighting, isOcclusion, isEmissive, isClearcoat, isTransmission, isVolume, isSheen, isSpecular, isIridescence, isAnisotropy, isDispersion, isEmissiveStrength, isDiffuseTransmission, isShadow, useNormalTexture, maxInstancesNumber, }?: PbrUberMaterialOptions): import("../..").Material;
