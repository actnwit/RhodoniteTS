import ClassicSingleShaderFragment_ from '../../../webgl/shaderity_shaders/ClassicSingleShader/ClassicSingleShader.frag';
import ClassicSingleShaderVertex_ from '../../../webgl/shaderity_shaders/ClassicSingleShader/ClassicSingleShader.vert';
import ClassicSingleShaderFragmentWebgpu_ from '../../../webgpu/shaderity_shaders/ClassicSingleShader/ClassicSingleShader.frag';
import ClassicSingleShaderVertexWebGpu_ from '../../../webgpu/shaderity_shaders/ClassicSingleShader/ClassicSingleShader.vert';
import { TextureParameter } from '../../definitions';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { ShaderType } from '../../definitions/ShaderType';
import { CustomMaterialContent } from '../../materials/contents/CustomMaterialContent';
import { Scalar } from '../../math/Scalar';
import { VectorN } from '../../math/VectorN';
import type { Engine } from '../../system/Engine';
import { getSharedSampler } from '../../textures/Sampler';
import { createMaterial } from './createMaterial';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const ClassicSingleShaderFragment =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? ClassicSingleShaderFragment_ : undefined;
const ClassicSingleShaderVertex =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? ClassicSingleShaderVertex_ : undefined;
const ClassicSingleShaderFragmentWebgpu =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? ClassicSingleShaderFragmentWebgpu_ : undefined;
const ClassicSingleShaderVertexWebGpu =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? ClassicSingleShaderVertexWebGpu_ : undefined;

/**
 * Creates a Classic Uber material for traditional non-PBR rendering.
 * This material is suitable for classic shading models and legacy content.
 *
 * @param options - Configuration object for the Classic material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isLighting - Enable lighting calculations
 * @param options.isMorphing - Enable morph target animation support
 * @param options.isShadow - Enable shadow mapping support
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Classic Uber Material instance
 */
export function createClassicUberMaterial(
  engine: Engine,
  {
    additionalName = '',
    isSkinning = true,
    isLighting = false,
    isMorphing = false,
    isShadow = false,
    maxInstancesNumber = engine.config.materialCountPerBufferView,
  } = {}
) {
  const materialName = `ClassicUber_${additionalName}_`;
  const additionalShaderSemanticInfo: ShaderSemanticsInfo[] = [];

  const sampler = getSharedSampler(engine, {
    minFilter: TextureParameter.Linear,
    magFilter: TextureParameter.Linear,
    wrapS: TextureParameter.ClampToEdge,
    wrapT: TextureParameter.ClampToEdge,
  });

  if (isShadow && engine.config.maxLightNumber > 0) {
    additionalShaderSemanticInfo.push({
      semantic: 'depthTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2DArray,
      stage: ShaderType.PixelShader,
      initialValue: [-1, engine.dummyTextures.dummyDepthMomentTextureArray, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: 'paraboloidDepthTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2DArray,
      stage: ShaderType.PixelShader,
      initialValue: [-1, engine.dummyTextures.dummyDepthMomentTextureArray, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: 'depthTextureIndexList',
      componentType: ComponentType.Int,
      compositionType: CompositionType.ScalarArray,
      arrayLength: engine.config.maxLightNumber,
      stage: ShaderType.PixelShader,
      initialValue: new VectorN(new Int32Array(engine.config.maxLightNumber)),
      min: 0,
      max: Number.MAX_VALUE,
    });
    // BiasMatrix * LightProjectionMatrix * LightViewMatrix, See: http://www.opengl-tutorial.org/intermediate-tutorials/tutorial-16-shadow-mapping/#basic-shader
    additionalShaderSemanticInfo.push({
      semantic: 'depthBiasPV',
      componentType: ComponentType.Float,
      compositionType: CompositionType.Mat4Array,
      arrayLength: engine.config.maxLightNumber,
      stage: ShaderType.PixelShader,
      initialValue: new VectorN(new Float32Array(engine.config.maxLightNumber * 16)),
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: 'pointLightFarPlane',
      componentType: ComponentType.Float,
      compositionType: CompositionType.ScalarArray,
      arrayLength: engine.config.maxLightNumber,
      stage: ShaderType.PixelShader,
      initialValue: new VectorN(new Float32Array(engine.config.maxLightNumber).fill(1000.0)),
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: 'pointLightShadowMapUvScale',
      componentType: ComponentType.Float,
      compositionType: CompositionType.Scalar,
      stage: ShaderType.PixelShader,
      initialValue: Scalar.fromCopyNumber(0.93),
      min: 0,
      max: Number.MAX_VALUE,
    });
  }

  const materialContent = new CustomMaterialContent(engine, {
    name: materialName,
    isSkinning,
    isLighting,
    isMorphing,
    vertexShader: ClassicSingleShaderVertex,
    pixelShader: ClassicSingleShaderFragment,
    vertexShaderWebGpu: ClassicSingleShaderVertexWebGpu,
    pixelShaderWebGpu: ClassicSingleShaderFragmentWebgpu,
    additionalShaderSemanticInfo,
  });
  const material = createMaterial(engine, materialContent, maxInstancesNumber);

  if (isLighting) {
    material.addShaderDefine('RN_IS_LIGHTING');
  }
  if (isShadow && engine.config.maxLightNumber > 0) {
    material.addShaderDefine('RN_USE_SHADOW_MAPPING');
  }
  material.addShaderDefine('RN_USE_NORMAL_TEXTURE');
  material.addShaderDefine('RN_IS_SKINNING');

  return material;
}
