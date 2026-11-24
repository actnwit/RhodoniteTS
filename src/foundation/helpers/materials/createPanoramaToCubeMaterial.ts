import PanoramaToCubeShaderFragment_ from '../../../webgl/shaderity_shaders/PanoramaToCubeShader/PanoramaToCubeShader.frag';
import PanoramaToCubeShaderVertex_ from '../../../webgl/shaderity_shaders/PanoramaToCubeShader/PanoramaToCubeShader.vert';
import PanoramaToCubeShaderFragmentWebGpu_ from '../../../webgpu/shaderity_shaders/PanoramaToCubeShader/PanoramaToCubeShader.frag.wgsl';
import PanoramaToCubeShaderVertexWebGpu_ from '../../../webgpu/shaderity_shaders/PanoramaToCubeShader/PanoramaToCubeShader.vert.wgsl';
import { CustomMaterialContent } from '../../materials/contents/CustomMaterialContent';
import type { Material } from '../../materials/core/Material';
import type { Engine } from '../../system/Engine';
import { createMaterial } from './createMaterial';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const PanoramaToCubeShaderFragment =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? PanoramaToCubeShaderFragment_ : undefined;
const PanoramaToCubeShaderVertex =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? PanoramaToCubeShaderVertex_ : undefined;
const PanoramaToCubeShaderFragmentWebGpu =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? PanoramaToCubeShaderFragmentWebGpu_ : undefined;
const PanoramaToCubeShaderVertexWebGpu =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? PanoramaToCubeShaderVertexWebGpu_ : undefined;

/**
 * Creates a material for converting panoramic textures to cube map format.
 * This material transforms equirectangular panoramic images into cube map textures.
 *
 * @param options - Configuration object for the panorama to cube material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Panorama to Cube Material instance
 */
export function createPanoramaToCubeMaterial(
  engine: Engine,
  { additionalName = '', maxInstancesNumber = 1 } = {}
): Material {
  const materialName = `PanoramaToCube_${additionalName}`;

  const materialContent = new CustomMaterialContent(engine, {
    name: materialName,
    isSkinning: false,
    isLighting: false,
    isMorphing: false,
    vertexShader: PanoramaToCubeShaderVertex,
    pixelShader: PanoramaToCubeShaderFragment,
    vertexShaderWebGpu: PanoramaToCubeShaderVertexWebGpu,
    pixelShaderWebGpu: PanoramaToCubeShaderFragmentWebGpu,
    additionalShaderSemanticInfo: [],
  });
  const material = createMaterial(engine, materialContent, maxInstancesNumber);

  return material;
}
