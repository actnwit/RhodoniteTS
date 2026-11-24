import EnvConstantSingleShaderFragment_ from '../../../webgl/shaderity_shaders/EnvConstantSingleShader/EnvConstantSingleShader.frag';
import EnvConstantSingleShaderVertex_ from '../../../webgl/shaderity_shaders/EnvConstantSingleShader/EnvConstantSingleShader.vert';
import EnvConstantSingleShaderFragmentWebGpu_ from '../../../webgpu/shaderity_shaders/EnvConstantSingleShader/EnvConstantSingleShader.frag';
import EnvConstantSingleShaderVertexWebGpu_ from '../../../webgpu/shaderity_shaders/EnvConstantSingleShader/EnvConstantSingleShader.vert';
import { CustomMaterialContent } from '../../materials/contents/CustomMaterialContent';
import type { Engine } from '../../system/Engine';
import { createMaterial } from './createMaterial';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const EnvConstantSingleShaderFragment =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? EnvConstantSingleShaderFragment_ : undefined;
const EnvConstantSingleShaderVertex =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? EnvConstantSingleShaderVertex_ : undefined;
const EnvConstantSingleShaderFragmentWebGpu =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? EnvConstantSingleShaderFragmentWebGpu_ : undefined;
const EnvConstantSingleShaderVertexWebGpu =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? EnvConstantSingleShaderVertexWebGpu_ : undefined;

/**
 * Creates a material for rendering environment constant colors.
 * This material is typically used for skyboxes or environment background rendering.
 *
 * @param options - Configuration object for the environment material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param options.makeOutputSrgb - Whether to convert output to sRGB color space
 * @returns A configured Environment Constant Material instance
 */
export function createEnvConstantMaterial(
  engine: Engine,
  { additionalName = '', maxInstancesNumber = 5, makeOutputSrgb = true } = {}
) {
  const materialName = `EnvConstant_${additionalName}`;

  const materialContent = new CustomMaterialContent(engine, {
    name: materialName,
    isSkinning: false,
    isLighting: false,
    isMorphing: false,
    vertexShader: EnvConstantSingleShaderVertex,
    pixelShader: EnvConstantSingleShaderFragment,
    vertexShaderWebGpu: EnvConstantSingleShaderVertexWebGpu,
    pixelShaderWebGpu: EnvConstantSingleShaderFragmentWebGpu,
    additionalShaderSemanticInfo: [],
  });
  const material = createMaterial(engine, materialContent, maxInstancesNumber);
  material.setParameter('makeOutputSrgb', makeOutputSrgb ? 1 : 0);
  return material;
}
