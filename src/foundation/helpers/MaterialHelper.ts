import { createClassicUberMaterial } from './materials/createClassicUberMaterial';
import { createColorGradingUsingLUTsMaterial } from './materials/createColorGradingUsingLUTsMaterial';
import { createDepthEncodeMaterial } from './materials/createDepthEncodeMaterial';
import { createDepthMomentEncodeMaterial } from './materials/createDepthMomentEncodeMaterial';
import { createDetectHighLuminanceMaterial } from './materials/createDetectHighLuminanceMaterial';
import { createEntityUIDOutputMaterial } from './materials/createEntityUIDOutputMaterial';
import { createEnvConstantMaterial } from './materials/createEnvConstantMaterial';
import { createFlatMaterial } from './materials/createFlatMaterial';
import { createFurnaceTestMaterial } from './materials/createFurnaceTestMaterial';
import { createFXAA3QualityMaterial } from './materials/createFXAA3QualityMaterial';
import { createGammaCorrectionMaterial } from './materials/createGammaCorrectionMaterial';
import { createGaussianBlurForEncodedDepthMaterial } from './materials/createGaussianBlurForEncodedDepthMaterial';
import { createGaussianBlurMaterial } from './materials/createGaussianBlurMaterial';
import { createMatCapMaterial } from './materials/createMatCapMaterial';
import { changeMaterial, createMaterial, recreateMaterial } from './materials/createMaterial';
import { createMToon0xMaterial } from './materials/createMToon0xMaterial';
import { createMToon1Material } from './materials/createMToon1Material';
import { createNodeBasedCustomMaterial } from './materials/createNodeBasedCustomMaterial';
import {
  collectRrnJson,
  createNodeBasedRaymarchingComponentMaterial,
  createNodeBasedRaymarchingComponentShadowMaterial,
  createNodeBasedRaymarchingCustomMaterial,
  createNodeBasedRaymarchingShadowMaterial,
  createNodeBasedRaymarchingShadowMaterials,
  RAYMARCHING_COMPONENT_WORLD_MATRIX_SEMANTIC,
} from './materials/createNodeBasedRaymarchingMaterials';
import { createPanoramaToCubeMaterial } from './materials/createPanoramaToCubeMaterial';
import { createParaboloidDepthMomentEncodeMaterial } from './materials/createParaboloidDepthMomentEncodeMaterial';
import { createPbrUberMaterial } from './materials/createPbrUberMaterial';
import { createPrefilterIBLMaterial } from './materials/createPrefilterIBLMaterial';
import { createShadowMapDecodeClassicSingleMaterial } from './materials/createShadowMapDecodeClassicSingleMaterial';
import { createSummedAreaTableMaterial } from './materials/createSummedAreaTableMaterial';
import { createSynthesizeHDRMaterial } from './materials/createSynthesizeHDRMaterial';
import { createToneMappingMaterial } from './materials/createToneMappingMaterial';
import { createVarianceShadowMapDecodeClassicSingleMaterial } from './materials/createVarianceShadowMapDecodeClassicSingleMaterial';
import { reuseOrRecreateCustomMaterial } from './materials/nodeBasedMaterialCommon';

export {
  createNodeBasedRaymarchingShadowMaterial,
  RAYMARCHING_COMPONENT_WORLD_MATRIX_SEMANTIC,
  type RaymarchingShadowMaterials,
} from './materials/createNodeBasedRaymarchingMaterials';
export type { PbrUberMaterialOptions } from './materials/createPbrUberMaterial';

export const MaterialHelper = Object.freeze({
  createMaterial,
  recreateMaterial,
  reuseOrRecreateCustomMaterial,
  createNodeBasedCustomMaterial,
  createNodeBasedRaymarchingCustomMaterial,
  createNodeBasedRaymarchingComponentMaterial,
  createNodeBasedRaymarchingComponentShadowMaterial,
  RAYMARCHING_COMPONENT_WORLD_MATRIX_SEMANTIC,
  createNodeBasedRaymarchingShadowMaterial,
  createNodeBasedRaymarchingShadowMaterials,
  createClassicUberMaterial,
  createDepthMomentEncodeMaterial,
  createParaboloidDepthMomentEncodeMaterial,
  createFlatMaterial,
  createPbrUberMaterial,
  createEnvConstantMaterial,
  createFXAA3QualityMaterial,
  createDepthEncodeMaterial,
  createShadowMapDecodeClassicSingleMaterial,
  createGammaCorrectionMaterial,
  createToneMappingMaterial,
  createPanoramaToCubeMaterial,
  createPrefilterIBLMaterial,
  createSummedAreaTableMaterial,
  createVarianceShadowMapDecodeClassicSingleMaterial,
  createEntityUIDOutputMaterial,
  createMToon0xMaterial,
  createMToon1Material,
  createFurnaceTestMaterial,
  createGaussianBlurForEncodedDepthMaterial,
  createDetectHighLuminanceMaterial,
  createGaussianBlurMaterial,
  createSynthesizeHDRMaterial,
  createColorGradingUsingLUTsMaterial,
  createMatCapMaterial,
  changeMaterial,
  collectRrnJson,
});
