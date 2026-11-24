import ParaboloidDepthMomentEncodeShaderFragment_ from '../../../webgl/shaderity_shaders/ParaboloidDepthMomentEncodeShader/ParaboloidDepthMomentEncodeShader.frag.glsl';
import ParaboloidDepthMomentEncodeShaderVertex_ from '../../../webgl/shaderity_shaders/ParaboloidDepthMomentEncodeShader/ParaboloidDepthMomentEncodeShader.vert.glsl';
import ParaboloidDepthMomentEncodeShaderFragmentWebGpu_ from '../../../webgpu/shaderity_shaders/ParaboloidDepthMomentEncodeShader/ParaboloidDepthMomentEncodeShader.frag.wgsl';
import ParaboloidDepthMomentEncodeShaderVertexWebGpu_ from '../../../webgpu/shaderity_shaders/ParaboloidDepthMomentEncodeShader/ParaboloidDepthMomentEncodeShader.vert.wgsl';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { CustomMaterialContent } from '../../materials/contents/CustomMaterialContent';
import type { Engine } from '../../system/Engine';
import { createMaterial } from './createMaterial';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const ParaboloidDepthMomentEncodeShaderFragment =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? ParaboloidDepthMomentEncodeShaderFragment_ : undefined;
const ParaboloidDepthMomentEncodeShaderVertex =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? ParaboloidDepthMomentEncodeShaderVertex_ : undefined;
const ParaboloidDepthMomentEncodeShaderFragmentWebGpu =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? ParaboloidDepthMomentEncodeShaderFragmentWebGpu_ : undefined;
const ParaboloidDepthMomentEncodeShaderVertexWebGpu =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? ParaboloidDepthMomentEncodeShaderVertexWebGpu_ : undefined;

/**
 * Creates a material for encoding depth moments in paraboloid projection.
 * This material is used for omnidirectional shadow mapping with paraboloid projections.
 *
 * @param options - Configuration object for the paraboloid depth material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isMorphing - Enable morph target animation support
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Paraboloid Depth Moment Encode Material instance
 */
export function createParaboloidDepthMomentEncodeMaterial(
  engine: Engine,
  {
    additionalName = '',
    isSkinning = true,
    isMorphing = false,
    maxInstancesNumber = engine.config.materialCountPerBufferView,
  } = {}
) {
  const materialName = `ParaboloidDepthMomentEncode_${additionalName}_`;

  const additionalShaderSemanticInfo: ShaderSemanticsInfo[] = [];
  const materialContent = new CustomMaterialContent(engine, {
    name: materialName,
    isSkinning,
    isLighting: true,
    isMorphing,
    vertexShader: ParaboloidDepthMomentEncodeShaderVertex,
    pixelShader: ParaboloidDepthMomentEncodeShaderFragment,
    vertexShaderWebGpu: ParaboloidDepthMomentEncodeShaderVertexWebGpu,
    pixelShaderWebGpu: ParaboloidDepthMomentEncodeShaderFragmentWebGpu,
    additionalShaderSemanticInfo,
  });
  const material = createMaterial(engine, materialContent, maxInstancesNumber);
  material.addShaderDefine('RN_IS_SKINNING');

  return material;
}
