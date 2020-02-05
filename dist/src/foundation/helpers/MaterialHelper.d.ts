import Material from "../materials/Material";
import RenderPass from "../renderer/RenderPass";
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
declare const _default: Readonly<{
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
}>;
export default _default;
