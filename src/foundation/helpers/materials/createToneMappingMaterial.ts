import ToneMappingShaderFragmentGLSL_ from '../../../webgl/shaderity_shaders/ToneMappingShader/ToneMappingShader.frag';
import ToneMappingShaderVertexGLSL_ from '../../../webgl/shaderity_shaders/ToneMappingShader/ToneMappingShader.vert';
import ToneMappingShaderFragmentWGSL_ from '../../../webgpu/shaderity_shaders/ToneMappingShader/ToneMappingShader.frag.wgsl';
import ToneMappingShaderVertexWGSL_ from '../../../webgpu/shaderity_shaders/ToneMappingShader/ToneMappingShader.vert.wgsl';
import { CustomMaterialContent } from '../../materials/contents/CustomMaterialContent';
import type { Material } from '../../materials/core/Material';
import type { Engine } from '../../system/Engine';
import { createMaterial } from './createMaterial';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const ToneMappingShaderFragmentGLSL =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? ToneMappingShaderFragmentGLSL_ : undefined;
const ToneMappingShaderVertexGLSL =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? ToneMappingShaderVertexGLSL_ : undefined;
const ToneMappingShaderFragmentWGSL =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? ToneMappingShaderFragmentWGSL_ : undefined;
const ToneMappingShaderVertexWGSL =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? ToneMappingShaderVertexWGSL_ : undefined;

/**
 * Creates a material for tone mapping HDR content to LDR display.
 * This material converts high dynamic range colors to displayable range using tone mapping algorithms.
 *
 * @param options - Configuration object for the tone mapping material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Tone Mapping Material instance
 */
export function createToneMappingMaterial(
  engine: Engine,
  { additionalName = '', maxInstancesNumber = 1 } = {}
): Material {
  const materialName = `ToneMapping_${additionalName}`;

  const materialContent = new CustomMaterialContent(engine, {
    name: materialName,
    isSkinning: false,
    isLighting: false,
    isMorphing: false,
    vertexShader: ToneMappingShaderVertexGLSL,
    pixelShader: ToneMappingShaderFragmentGLSL,
    vertexShaderWebGpu: ToneMappingShaderVertexWGSL,
    pixelShaderWebGpu: ToneMappingShaderFragmentWGSL,
    additionalShaderSemanticInfo: [],
  });
  const material = createMaterial(engine, materialContent, maxInstancesNumber);
  material.addShaderDefine('RN_USE_GT_TONEMAP');

  return material;
}
