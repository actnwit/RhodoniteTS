import PrefilterIBLShaderFragment_ from '../../../webgl/shaderity_shaders/PrefilterIBLShader/PrefilterIBLShader.frag';
import PrefilterIBLShaderVertex_ from '../../../webgl/shaderity_shaders/PrefilterIBLShader/PrefilterIBLShader.vert';
import PrefilterIBLShaderFragmentWebGpu_ from '../../../webgpu/shaderity_shaders/PrefilterIBLShader/PrefilterIBLShader.frag.wgsl';
import PrefilterIBLShaderVertexWebGpu_ from '../../../webgpu/shaderity_shaders/PrefilterIBLShader/PrefilterIBLShader.vert.wgsl';
import { CustomMaterialContent } from '../../materials/contents/CustomMaterialContent';
import type { Material } from '../../materials/core/Material';
import type { Engine } from '../../system/Engine';
import { createMaterial } from './createMaterial';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const PrefilterIBLShaderFragment =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? PrefilterIBLShaderFragment_ : undefined;
const PrefilterIBLShaderVertex =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? PrefilterIBLShaderVertex_ : undefined;
const PrefilterIBLShaderFragmentWebGpu =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? PrefilterIBLShaderFragmentWebGpu_ : undefined;
const PrefilterIBLShaderVertexWebGpu =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? PrefilterIBLShaderVertexWebGpu_ : undefined;

/**
 * Creates a material for prefiltering IBL (Image-Based Lighting) environment maps.
 * This material generates prefiltered mipmap levels for environment map reflections.
 *
 * @param options - Configuration object for the IBL prefilter material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Prefilter IBL Material instance
 */
export function createPrefilterIBLMaterial(
  engine: Engine,
  { additionalName = '', maxInstancesNumber = 1 } = {}
): Material {
  const materialName = `PrefilterIBL_${additionalName}`;

  const materialContent = new CustomMaterialContent(engine, {
    name: materialName,
    isSkinning: false,
    isLighting: false,
    isMorphing: false,
    vertexShader: PrefilterIBLShaderVertex,
    pixelShader: PrefilterIBLShaderFragment,
    vertexShaderWebGpu: PrefilterIBLShaderVertexWebGpu,
    pixelShaderWebGpu: PrefilterIBLShaderFragmentWebGpu,
    additionalShaderSemanticInfo: [],
  });
  const material = createMaterial(engine, materialContent, maxInstancesNumber);

  return material;
}
