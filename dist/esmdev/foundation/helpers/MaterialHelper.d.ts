import { Material } from '../materials/core/Material';
import { RenderPass } from '../renderer/RenderPass';
import type { AbstractMaterialContent } from '../materials/core/AbstractMaterialContent';
import { Primitive } from '../geometry/Primitive';
import { AbstractTexture } from '../textures/AbstractTexture';
import { Texture } from '../textures/Texture';
import { CameraComponent } from '../components/Camera/CameraComponent';
import { Count } from '../../types/CommonTypes';
import { IMeshRendererEntityMethods } from '../components/MeshRenderer/IMeshRendererEntity';
import { Vrm0xMaterialProperty } from '../../types';
import { Sampler } from '../textures/Sampler';
declare function createMaterial(materialName: string, materialNode: AbstractMaterialContent, maxInstancesNumber?: Count): Material;
declare function recreateMaterial(materialName: string, materialNode: AbstractMaterialContent, maxInstancesNumber?: Count): Material;
declare function createPbrUberMaterial({ additionalName, isMorphing, isSkinning, isLighting, isClearCoat, isTransmission, isVolume, isSheen, isSpecular, isIridescence, isAnisotropy, isShadow, useTangentAttribute, useNormalTexture, maxInstancesNumber, }?: {
    additionalName?: string | undefined;
    isMorphing?: boolean | undefined;
    isSkinning?: boolean | undefined;
    isLighting?: boolean | undefined;
    isClearCoat?: boolean | undefined;
    isTransmission?: boolean | undefined;
    isVolume?: boolean | undefined;
    isSheen?: boolean | undefined;
    isSpecular?: boolean | undefined;
    isIridescence?: boolean | undefined;
    isAnisotropy?: boolean | undefined;
    isShadow?: boolean | undefined;
    useTangentAttribute?: boolean | undefined;
    useNormalTexture?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createClassicUberMaterial({ additionalName, isSkinning, isLighting, isMorphing, isShadow, maxInstancesNumber, }?: {
    additionalName?: string | undefined;
    isSkinning?: boolean | undefined;
    isLighting?: boolean | undefined;
    isMorphing?: boolean | undefined;
    isShadow?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createDepthMomentEncodeMaterial({ additionalName, isSkinning, isMorphing, maxInstancesNumber, }?: {
    additionalName?: string | undefined;
    isSkinning?: boolean | undefined;
    isMorphing?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createFlatMaterial({ additionalName, isSkinning, isMorphing, maxInstancesNumber, }?: {
    additionalName?: string | undefined;
    isSkinning?: boolean | undefined;
    isMorphing?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createEnvConstantMaterial({ additionalName, maxInstancesNumber, makeOutputSrgb, }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
    makeOutputSrgb?: boolean | undefined;
}): Material;
declare function createFXAA3QualityMaterial({ additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createFurnaceTestMaterial({ additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createDepthEncodeMaterial({ additionalName, isSkinning, depthPow, maxInstancesNumber, }?: {
    additionalName?: string | undefined;
    isSkinning?: boolean | undefined;
    depthPow?: number | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createShadowMapDecodeClassicSingleMaterial({ additionalName, isMorphing, isSkinning, isLighting, isDebugging, colorAttachmentsNumber, maxInstancesNumber, }: {
    additionalName?: string | undefined;
    isMorphing?: boolean | undefined;
    isSkinning?: boolean | undefined;
    isLighting?: boolean | undefined;
    isDebugging?: boolean | undefined;
    colorAttachmentsNumber?: number | undefined;
    maxInstancesNumber?: number | undefined;
} | undefined, depthEncodeRenderPass: RenderPass): Material;
declare function createGaussianBlurForEncodedDepthMaterial({ additionalName, maxInstancesNumber, }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createVarianceShadowMapDecodeClassicSingleMaterial({ additionalName, isMorphing, isSkinning, isDebugging, isLighting, colorAttachmentsNumberDepth, colorAttachmentsNumberSquareDepth, depthCameraComponent, maxInstancesNumber, }: {
    additionalName?: string;
    isMorphing?: boolean;
    isSkinning?: boolean;
    isDebugging?: boolean;
    isLighting?: boolean;
    colorAttachmentsNumberDepth?: Count;
    colorAttachmentsNumberSquareDepth?: Count;
    depthCameraComponent?: CameraComponent;
    maxInstancesNumber?: Count;
}, encodedDepthRenderPasses: RenderPass[]): Material;
declare function createDetectHighLuminanceMaterial({ additionalName, maxInstancesNumber }: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
} | undefined, textureToDetectHighLuminance: AbstractTexture): Material;
declare function createGaussianBlurMaterial({ additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createSynthesizeHDRMaterial({ additionalName, maxInstancesNumber, }: {
    additionalName?: string;
    maxInstancesNumber?: Count;
}, synthesizeTextures: AbstractTexture[]): Material;
declare function createColorGradingUsingLUTsMaterial({ additionalName, colorAttachmentsNumber, uri, texture, maxInstancesNumber, }: {
    additionalName?: string;
    colorAttachmentsNumber?: Count;
    uri?: string;
    texture?: Texture;
    maxInstancesNumber?: Count;
}, targetRenderPass: RenderPass): Material;
declare function createGammaCorrectionMaterial({ additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createToneMappingMaterial({ additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createSummedAreaTableMaterial({ additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createPanoramaToCubeMaterial({ additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createPrefilterIBLMaterial({ additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createMatCapMaterial({ additionalName, isSkinning, uri, texture, sampler, maxInstancesNumber, }: {
    additionalName?: string;
    isSkinning?: boolean;
    uri?: string;
    texture?: Texture;
    sampler?: Sampler;
    maxInstancesNumber?: Count;
}): Material;
declare function createEntityUIDOutputMaterial({ additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createMToonMaterial({ additionalName, isMorphing, isSkinning, isLighting, useTangentAttribute, isOutline, materialProperties, textures, samplers, debugMode, maxInstancesNumber, makeOutputSrgb, }: {
    additionalName?: string;
    isMorphing?: boolean;
    isSkinning?: boolean;
    isLighting?: boolean;
    useTangentAttribute?: boolean;
    isOutline?: boolean;
    materialProperties?: Vrm0xMaterialProperty;
    textures?: any[];
    samplers?: Sampler[];
    debugMode?: any;
    maxInstancesNumber?: Count;
    makeOutputSrgb?: boolean;
}): Material;
declare function reuseOrRecreateCustomMaterial(currentMaterial: Material, vertexShaderStr: string, pixelShaderStr: string, { additionalName, isSkinning, isLighting, isMorphing, maxInstancesNumber, }?: {
    additionalName?: string | undefined;
    isSkinning?: boolean | undefined;
    isLighting?: boolean | undefined;
    isMorphing?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function changeMaterial(entity: IMeshRendererEntityMethods, primitive: Primitive, material: Material): void;
export declare const MaterialHelper: Readonly<{
    createMaterial: typeof createMaterial;
    recreateMaterial: typeof recreateMaterial;
    reuseOrRecreateCustomMaterial: typeof reuseOrRecreateCustomMaterial;
    createClassicUberMaterial: typeof createClassicUberMaterial;
    createDepthMomentEncodeMaterial: typeof createDepthMomentEncodeMaterial;
    createFlatMaterial: typeof createFlatMaterial;
    createPbrUberMaterial: typeof createPbrUberMaterial;
    createEnvConstantMaterial: typeof createEnvConstantMaterial;
    createFXAA3QualityMaterial: typeof createFXAA3QualityMaterial;
    createDepthEncodeMaterial: typeof createDepthEncodeMaterial;
    createShadowMapDecodeClassicSingleMaterial: typeof createShadowMapDecodeClassicSingleMaterial;
    createGammaCorrectionMaterial: typeof createGammaCorrectionMaterial;
    createToneMappingMaterial: typeof createToneMappingMaterial;
    createPanoramaToCubeMaterial: typeof createPanoramaToCubeMaterial;
    createPrefilterIBLMaterial: typeof createPrefilterIBLMaterial;
    createSummedAreaTableMaterial: typeof createSummedAreaTableMaterial;
    createVarianceShadowMapDecodeClassicSingleMaterial: typeof createVarianceShadowMapDecodeClassicSingleMaterial;
    createEntityUIDOutputMaterial: typeof createEntityUIDOutputMaterial;
    createMToonMaterial: typeof createMToonMaterial;
    createFurnaceTestMaterial: typeof createFurnaceTestMaterial;
    createGaussianBlurForEncodedDepthMaterial: typeof createGaussianBlurForEncodedDepthMaterial;
    createDetectHighLuminanceMaterial: typeof createDetectHighLuminanceMaterial;
    createGaussianBlurMaterial: typeof createGaussianBlurMaterial;
    createSynthesizeHDRMaterial: typeof createSynthesizeHDRMaterial;
    createColorGradingUsingLUTsMaterial: typeof createColorGradingUsingLUTsMaterial;
    createMatCapMaterial: typeof createMatCapMaterial;
    changeMaterial: typeof changeMaterial;
}>;
export {};
