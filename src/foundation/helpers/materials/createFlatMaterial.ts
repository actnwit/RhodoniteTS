import FlatSingleShaderFragment_ from '../../../webgl/shaderity_shaders/FlatSingleShader/FlatSingleShader.frag';
import FlatSingleShaderVertex_ from '../../../webgl/shaderity_shaders/FlatSingleShader/FlatSingleShader.vert';
import FlatSingleShaderFragmentWebGpu_ from '../../../webgpu/shaderity_shaders/FlatSingleShader/FlatSingleShader.frag';
import FlatSingleShaderVertexWebGpu_ from '../../../webgpu/shaderity_shaders/FlatSingleShader/FlatSingleShader.vert';
import { CustomMaterialContent } from '../../materials/contents/CustomMaterialContent';
import type { Engine } from '../../system/Engine';
import { createMaterial } from './createMaterial';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const FlatSingleShaderFragment =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? FlatSingleShaderFragment_ : undefined;
const FlatSingleShaderVertex =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? FlatSingleShaderVertex_ : undefined;
const FlatSingleShaderFragmentWebGpu =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? FlatSingleShaderFragmentWebGpu_ : undefined;
const FlatSingleShaderVertexWebGpu =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? FlatSingleShaderVertexWebGpu_ : undefined;

/**
 * Creates a flat shading material with uniform color rendering.
 * This material renders objects with flat, unlit colors without lighting calculations.
 *
 * @param options - Configuration object for the flat material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isMorphing - Enable morph target animation support
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Flat Material instance
 */
export function createFlatMaterial(
  engine: Engine,
  {
    additionalName = '',
    isSkinning = true,
    isMorphing = false,
    maxInstancesNumber = engine.config.materialCountPerBufferView,
  } = {}
) {
  const materialName = `Flat_${additionalName}_`;

  const materialContent = new CustomMaterialContent(engine, {
    name: materialName,
    isSkinning,
    isLighting: false,
    isMorphing,
    vertexShader: FlatSingleShaderVertex,
    pixelShader: FlatSingleShaderFragment,
    additionalShaderSemanticInfo: [],
    vertexShaderWebGpu: FlatSingleShaderVertexWebGpu,
    pixelShaderWebGpu: FlatSingleShaderFragmentWebGpu,
  });
  const material = createMaterial(engine, materialContent, maxInstancesNumber);
  material.addShaderDefine('RN_IS_SKINNING');

  return material;
}
