import Material from "../materials/Material";
import RenderPass from "../renderer/RenderPass";
declare function createPbrUberMaterial({ isMorphing, isSkinning, isLighting, additionalName, maxInstancesNumber }: {
    isMorphing: boolean;
    isSkinning: boolean;
    isLighting: boolean;
    additionalName?: string;
    maxInstancesNumber?: number;
}): Material;
declare function createClassicUberMaterial({ isSkinning, isLighting, additionalName, maxInstancesNumber }: {
    isSkinning: boolean;
    isLighting: boolean;
    additionalName?: string;
    maxInstancesNumber?: number;
}): Material;
declare function createEnvConstantMaterial(maxInstancesNumber?: number): Material;
declare function createFXAA3QualityMaterial(maxInstancesNumber?: number): Material;
declare function createDepthEncodeMaterial({ isSkinning }?: {
    isSkinning?: boolean | undefined;
}, maxInstancesNumber?: number): Material;
declare function createShadowMapDecodeClassicSingleMaterial(depthEncodeRenderPass: RenderPass, { isSkinning, isLighting, colorAttachmentsNumber }?: {
    isSkinning?: boolean | undefined;
    isLighting?: boolean | undefined;
    colorAttachmentsNumber?: number | undefined;
}, maxInstancesNumber?: number): Material;
declare function createGammaCorrectionMaterial(maxInstancesNumber?: number): Material;
declare function createEntityUIDOutputMaterial(maxInstancesNumber?: number): Material;
declare const _default: Readonly<{
    createPbrUberMaterial: typeof createPbrUberMaterial;
    createClassicUberMaterial: typeof createClassicUberMaterial;
    createEnvConstantMaterial: typeof createEnvConstantMaterial;
    createFXAA3QualityMaterial: typeof createFXAA3QualityMaterial;
    createDepthEncodeMaterial: typeof createDepthEncodeMaterial;
    createShadowMapDecodeClassicSingleMaterial: typeof createShadowMapDecodeClassicSingleMaterial;
    createGammaCorrectionMaterial: typeof createGammaCorrectionMaterial;
    createEntityUIDOutputMaterial: typeof createEntityUIDOutputMaterial;
}>;
export default _default;
