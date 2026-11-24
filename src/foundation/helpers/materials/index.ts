export { createClassicUberMaterial } from './createClassicUberMaterial';
export { createColorGradingUsingLUTsMaterial } from './createColorGradingUsingLUTsMaterial';
export { createDepthEncodeMaterial } from './createDepthEncodeMaterial';
export { createDepthMomentEncodeMaterial } from './createDepthMomentEncodeMaterial';
export { createDetectHighLuminanceMaterial } from './createDetectHighLuminanceMaterial';
export { createEntityUIDOutputMaterial } from './createEntityUIDOutputMaterial';
export { createEnvConstantMaterial } from './createEnvConstantMaterial';
export { createFlatMaterial } from './createFlatMaterial';
export { createFurnaceTestMaterial } from './createFurnaceTestMaterial';
export { createFXAA3QualityMaterial } from './createFXAA3QualityMaterial';
export { createGammaCorrectionMaterial } from './createGammaCorrectionMaterial';
export { createGaussianBlurForEncodedDepthMaterial } from './createGaussianBlurForEncodedDepthMaterial';
export { createGaussianBlurMaterial } from './createGaussianBlurMaterial';
export { createMatCapMaterial } from './createMatCapMaterial';
export { changeMaterial, createMaterial, recreateMaterial } from './createMaterial';
// Node-based materials and MToon are exported from 'rhodonite/optional-materials' (see optionalMaterials.ts).
// Keeping them out of this barrel lets bundlers drop them from applications that only use other materials.
export { createPanoramaToCubeMaterial } from './createPanoramaToCubeMaterial';
export { createParaboloidDepthMomentEncodeMaterial } from './createParaboloidDepthMomentEncodeMaterial';
export { createPbrUberMaterial, type PbrUberMaterialOptions } from './createPbrUberMaterial';
export { createPrefilterIBLMaterial } from './createPrefilterIBLMaterial';
export { createShadowMapDecodeClassicSingleMaterial } from './createShadowMapDecodeClassicSingleMaterial';
export { createSummedAreaTableMaterial } from './createSummedAreaTableMaterial';
export { createSynthesizeHDRMaterial } from './createSynthesizeHDRMaterial';
export { createToneMappingMaterial } from './createToneMappingMaterial';
export { createVarianceShadowMapDecodeClassicSingleMaterial } from './createVarianceShadowMapDecodeClassicSingleMaterial';
export { reuseOrRecreateCustomMaterial } from './nodeBasedMaterialCommon';
