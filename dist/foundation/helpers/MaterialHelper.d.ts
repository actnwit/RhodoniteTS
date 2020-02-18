import Material from "../materials/core/Material";
import RenderPass from "../renderer/RenderPass";
import AbstractMaterialNode from "../materials/core/AbstractMaterialNode";
import Primitive from "../geometry/Primitive";
import Entity from "../core/Entity";
declare function createMaterial(materialName: string, materialNodes?: AbstractMaterialNode[], maxInstancesNumber?: number): Material;
declare function recreateMaterial(materialName: string, materialNodes?: AbstractMaterialNode[], maxInstancesNumber?: number): Material;
declare function createEmptyMaterial(): Material;
declare function createPbrUberMaterial({ additionalName, isMorphing, isSkinning, isLighting, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    isMorphing?: boolean | undefined;
    isSkinning?: boolean | undefined;
    isLighting?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createClassicUberMaterial({ additionalName, isSkinning, isLighting, isMorphing, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    isSkinning?: boolean | undefined;
    isLighting?: boolean | undefined;
    isMorphing?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createEnvConstantMaterial({ additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createFXAA3QualityMaterial({ additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createDepthEncodeMaterial({ additionalName, isSkinning, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    isSkinning?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createShadowMapDecodeClassicSingleMaterial(depthEncodeRenderPass: RenderPass, { additionalName, isMorphing, isSkinning, isLighting, colorAttachmentsNumber, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    isMorphing?: boolean | undefined;
    isSkinning?: boolean | undefined;
    isLighting?: boolean | undefined;
    colorAttachmentsNumber?: number | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createGammaCorrectionMaterial({ additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createEntityUIDOutputMaterial({ additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createMToonMaterial({ additionalName, isMorphing, isSkinning, isLighting, isOutline, materialProperties, textures, debugMode, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    isMorphing?: boolean | undefined;
    isSkinning?: boolean | undefined;
    isLighting?: boolean | undefined;
    isOutline?: boolean | undefined;
    materialProperties?: undefined;
    textures?: undefined;
    debugMode?: undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function recreateCustomMaterial(vertexShaderStr: string, pixelShaderStr: string, { additionalName, isSkinning, isLighting, isMorphing, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    isSkinning?: boolean | undefined;
    isLighting?: boolean | undefined;
    isMorphing?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function changeMaterial(entity: Entity, primitive: Primitive, material: Material): void;
declare const _default: Readonly<{
    createMaterial: typeof createMaterial;
    recreateMaterial: typeof recreateMaterial;
    recreateCustomMaterial: typeof recreateCustomMaterial;
    createEmptyMaterial: typeof createEmptyMaterial;
    createClassicUberMaterial: typeof createClassicUberMaterial;
    createPbrUberMaterial: typeof createPbrUberMaterial;
    createEnvConstantMaterial: typeof createEnvConstantMaterial;
    createFXAA3QualityMaterial: typeof createFXAA3QualityMaterial;
    createDepthEncodeMaterial: typeof createDepthEncodeMaterial;
    createShadowMapDecodeClassicSingleMaterial: typeof createShadowMapDecodeClassicSingleMaterial;
    createGammaCorrectionMaterial: typeof createGammaCorrectionMaterial;
    createEntityUIDOutputMaterial: typeof createEntityUIDOutputMaterial;
    createMToonMaterial: typeof createMToonMaterial;
    changeMaterial: typeof changeMaterial;
}>;
export default _default;
