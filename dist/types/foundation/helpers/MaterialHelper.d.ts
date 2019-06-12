import Material from "../materials/Material";
import RenderPass from "../renderer/RenderPass";
declare function createPbrUberMaterial(): Material;
declare function createClassicUberMaterial(): Material;
declare function createEnvConstantMaterial(): Material;
declare function createFXAA3QualityMaterial(): Material;
declare function createDepthEncodingMaterial(): Material;
declare function createShadowMapping32bitMaterial(renderPass: RenderPass): Material;
declare const _default: Readonly<{
    createPbrUberMaterial: typeof createPbrUberMaterial;
    createClassicUberMaterial: typeof createClassicUberMaterial;
    createEnvConstantMaterial: typeof createEnvConstantMaterial;
    createFXAA3QualityMaterial: typeof createFXAA3QualityMaterial;
    createDepthEncodingMaterial: typeof createDepthEncodingMaterial;
    createShadowMapping32bitMaterial: typeof createShadowMapping32bitMaterial;
}>;
export default _default;
