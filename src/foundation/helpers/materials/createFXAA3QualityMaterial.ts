import FXAA3QualityShaderFragment_ from '../../../webgl/shaderity_shaders/FXAA3QualityShader/FXAA3QualitySingleShader.frag';
import FXAA3QualityShaderVertex_ from '../../../webgl/shaderity_shaders/FXAA3QualityShader/FXAA3QualitySingleShader.vert';
import { CustomMaterialContent } from '../../materials/contents/CustomMaterialContent';
import type { Material } from '../../materials/core/Material';
import type { Engine } from '../../system/Engine';
import { createMaterial } from './createMaterial';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const FXAA3QualityShaderFragment =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? FXAA3QualityShaderFragment_ : undefined;
const FXAA3QualityShaderVertex =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? FXAA3QualityShaderVertex_ : undefined;

/**
 * Creates a FXAA (Fast Approximate Anti-Aliasing) post-processing material.
 * This material applies FXAA3 quality anti-aliasing to reduce edge aliasing.
 *
 * @param options - Configuration object for the FXAA material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured FXAA3 Quality Material instance
 */
export function createFXAA3QualityMaterial(
  engine: Engine,
  { additionalName = '', maxInstancesNumber = 1 } = {}
): Material {
  const materialName = `FXAA3Quality_${additionalName}`;

  const materialContent = new CustomMaterialContent(engine, {
    name: materialName,
    isSkinning: false,
    isLighting: false,
    isMorphing: false,
    vertexShader: FXAA3QualityShaderVertex,
    pixelShader: FXAA3QualityShaderFragment,
    additionalShaderSemanticInfo: [],
  });
  const material = createMaterial(engine, materialContent, maxInstancesNumber);

  return material;
}
