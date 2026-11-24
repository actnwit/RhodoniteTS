import DepthMomentEncodeShaderFragment_ from '../../../webgl/shaderity_shaders/DepthMomentEncodeShader/DepthMomentEncodeShader.frag';
import DepthMomentEncodeShaderVertex_ from '../../../webgl/shaderity_shaders/DepthMomentEncodeShader/DepthMomentEncodeShader.vert';
import DepthMomentEncodeShaderFragmentWebGpu_ from '../../../webgpu/shaderity_shaders/DepthMomentEncodeShader/DepthMomentEncodeShader.frag.wgsl';
import DepthMomentEncodeShaderVertexWebGpu_ from '../../../webgpu/shaderity_shaders/DepthMomentEncodeShader/DepthMomentEncodeShader.vert.wgsl';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { CustomMaterialContent } from '../../materials/contents/CustomMaterialContent';
import type { Engine } from '../../system/Engine';
import { createMaterial } from './createMaterial';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const DepthMomentEncodeShaderFragment =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? DepthMomentEncodeShaderFragment_ : undefined;
const DepthMomentEncodeShaderVertex =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? DepthMomentEncodeShaderVertex_ : undefined;
const DepthMomentEncodeShaderFragmentWebGpu =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? DepthMomentEncodeShaderFragmentWebGpu_ : undefined;
const DepthMomentEncodeShaderVertexWebGpu =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? DepthMomentEncodeShaderVertexWebGpu_ : undefined;

/**
 * Creates a material for encoding depth moments for variance shadow mapping.
 * This material generates depth and depth-squared values for soft shadow techniques.
 *
 * @param options - Configuration object for the depth moment material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isMorphing - Enable morph target animation support
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Depth Moment Encode Material instance
 */
export function createDepthMomentEncodeMaterial(
  engine: Engine,
  {
    additionalName = '',
    isSkinning = true,
    isMorphing = false,
    maxInstancesNumber = engine.config.materialCountPerBufferView,
  } = {}
) {
  const materialName = `DepthMomentEncode_${additionalName}_`;

  const additionalShaderSemanticInfo: ShaderSemanticsInfo[] = [];
  const materialContent = new CustomMaterialContent(engine, {
    name: materialName,
    isSkinning,
    isLighting: false,
    isMorphing,
    vertexShader: DepthMomentEncodeShaderVertex,
    pixelShader: DepthMomentEncodeShaderFragment,
    vertexShaderWebGpu: DepthMomentEncodeShaderVertexWebGpu,
    pixelShaderWebGpu: DepthMomentEncodeShaderFragmentWebGpu,
    additionalShaderSemanticInfo,
  });
  const material = createMaterial(engine, materialContent, maxInstancesNumber);
  material.addShaderDefine('RN_IS_SKINNING');

  return material;
}
