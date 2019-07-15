import Material from "../materials/Material";
import RenderPass from "../renderer/RenderPass";
declare function createPbrUberMaterial(maxInstancesNumber?: number): Material;
declare function createClassicUberMaterial(maxInstancesNumber?: number): Material;
declare function createEnvConstantMaterial(maxInstancesNumber?: number): Material;
declare function createFXAA3QualityMaterial(maxInstancesNumber?: number): Material;
declare function createDepthEncodingMaterial(maxInstancesNumber?: number): Material;
declare function createShadowMapping32bitMaterial(renderPass: RenderPass, maxInstancesNumber?: number): Material;
declare function createGammaCorrectionMaterial(maxInstancesNumber?: number): Material;
declare const _default: Readonly<{
    createPbrUberMaterial: typeof createPbrUberMaterial;
    createClassicUberMaterial: typeof createClassicUberMaterial;
    createEnvConstantMaterial: typeof createEnvConstantMaterial;
    createFXAA3QualityMaterial: typeof createFXAA3QualityMaterial;
    createDepthEncodingMaterial: typeof createDepthEncodingMaterial;
    createShadowMapping32bitMaterial: typeof createShadowMapping32bitMaterial;
    createGammaCorrectionMaterial: typeof createGammaCorrectionMaterial;
}>;
export default _default;
