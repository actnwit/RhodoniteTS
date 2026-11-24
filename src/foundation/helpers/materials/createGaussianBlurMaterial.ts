import GaussianBlurSingleShaderFragment_ from '../../../webgl/shaderity_shaders/GaussianBlurShader/GaussianBlurShader.frag';
import GaussianBlurSingleShaderVertex_ from '../../../webgl/shaderity_shaders/GaussianBlurShader/GaussianBlurShader.vert';
import GaussianBlurSingleShaderFragmentWebGpu_ from '../../../webgpu/shaderity_shaders/GaussianBlurShader/GaussianBlurShader.frag';
import GaussianBlurSingleShaderVertexWebGpu_ from '../../../webgpu/shaderity_shaders/GaussianBlurShader/GaussianBlurShader.vert';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { ShaderType } from '../../definitions/ShaderType';
import { CustomMaterialContent } from '../../materials/contents/CustomMaterialContent';
import type { Material } from '../../materials/core/Material';
import { Scalar } from '../../math/Scalar';
import { Vector2 } from '../../math/Vector2';
import { VectorN } from '../../math/VectorN';
import type { Engine } from '../../system/Engine';
import { createMaterial } from './createMaterial';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const GaussianBlurSingleShaderFragment =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? GaussianBlurSingleShaderFragment_ : undefined;
const GaussianBlurSingleShaderVertex =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? GaussianBlurSingleShaderVertex_ : undefined;
const GaussianBlurSingleShaderFragmentWebGpu =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? GaussianBlurSingleShaderFragmentWebGpu_ : undefined;
const GaussianBlurSingleShaderVertexWebGpu =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? GaussianBlurSingleShaderVertexWebGpu_ : undefined;

/**
 * Creates a material for Gaussian blur post-processing effects.
 * This material applies Gaussian blur for various effects like depth of field or bloom.
 *
 * @param options - Configuration object for the Gaussian blur material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Gaussian Blur Material instance
 */
export function createGaussianBlurMaterial(
  engine: Engine,
  { additionalName = '', maxInstancesNumber = 10 } = {}
): Material {
  const materialName = `GaussianBlur_${additionalName}`;

  const additionalShaderSemanticInfo: ShaderSemanticsInfo[] = [];
  const gaussianRatio = new Float32Array(30);
  additionalShaderSemanticInfo.push(
    {
      semantic: 'isHorizontal',
      componentType: ComponentType.Bool,
      compositionType: CompositionType.Scalar,
      stage: ShaderType.PixelShader,
      initialValue: Scalar.fromCopyNumber(1), //true
      min: 0,
      max: 1,
    },
    {
      semantic: 'gaussianRatio',
      componentType: ComponentType.Float,
      compositionType: CompositionType.ScalarArray,
      arrayLength: 30,
      stage: ShaderType.PixelShader,
      initialValue: new VectorN(gaussianRatio),
      min: 0,
      max: 1,
      // needUniformInDataTextureMode: true,
    },
    {
      semantic: 'gaussianKernelSize',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Scalar,
      stage: ShaderType.PixelShader,
      initialValue: Scalar.fromCopyNumber(1),
      min: 1,
      max: 30,
    },
    {
      semantic: 'framebufferSize',
      componentType: ComponentType.Float,
      compositionType: CompositionType.Vec2,
      stage: ShaderType.PixelShader,
      initialValue: Vector2.fromCopy2(1, 1),
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
    },
    {
      semantic: 'baseColorTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [-1, engine.dummyTextures.dummyBlackTexture],
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
    }
  );

  const materialContent = new CustomMaterialContent(engine, {
    name: materialName,
    isSkinning: false,
    isLighting: false,
    isMorphing: false,
    vertexShader: GaussianBlurSingleShaderVertex,
    pixelShader: GaussianBlurSingleShaderFragment,
    vertexShaderWebGpu: GaussianBlurSingleShaderVertexWebGpu,
    pixelShaderWebGpu: GaussianBlurSingleShaderFragmentWebGpu,
    additionalShaderSemanticInfo,
  });
  const material = createMaterial(engine, materialContent, maxInstancesNumber);

  return material;
}
