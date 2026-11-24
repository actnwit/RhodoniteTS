import type { Count } from '../../../types/CommonTypes';
import pbrSingleShaderFragment_ from '../../../webgl/shaderity_shaders/PbrSingleShader/PbrSingleShader.frag';
import pbrSingleShaderVertex_ from '../../../webgl/shaderity_shaders/PbrSingleShader/PbrSingleShader.vert';
import pbrSingleShaderFragmentWebGpu_ from '../../../webgpu/shaderity_shaders/PbrSingleShader/PbrSingleShader.frag';
import pbrSingleShaderVertexWebGpu_ from '../../../webgpu/shaderity_shaders/PbrSingleShader/PbrSingleShader.vert';
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
const pbrSingleShaderFragment =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? pbrSingleShaderFragment_ : undefined;
const pbrSingleShaderVertex = typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? pbrSingleShaderVertex_ : undefined;
const pbrSingleShaderFragmentWebGpu =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? pbrSingleShaderFragmentWebGpu_ : undefined;
const pbrSingleShaderVertexWebGpu =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? pbrSingleShaderVertexWebGpu_ : undefined;

export type PbrUberMaterialOptions = {
  isPbr?: boolean;
  additionalShaderSemanticInfo?: ShaderSemanticsInfo[];
  additionalName?: string;
  isMorphing?: boolean;
  isSkinning?: boolean;
  isLighting?: boolean;
  isOcclusion?: boolean;
  isEmissive?: boolean;
  isClearcoat?: boolean;
  isTransmission?: boolean;
  isVolume?: boolean;
  isSheen?: boolean;
  isSpecular?: boolean;
  isIridescence?: boolean;
  isAnisotropy?: boolean;
  isDispersion?: boolean;
  isEmissiveStrength?: boolean;
  isDiffuseTransmission?: boolean;
  isShadow?: boolean;
  useNormalTexture?: boolean;
  maxInstancesNumber?: Count;
};

/**
 * Creates a PBR (Physically Based Rendering) Uber material with extensive feature support.
 * This is a comprehensive material that supports various PBR extensions and features.
 *
 * @param options - Configuration object for the PBR material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isMorphing - Enable morph target animation support
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isLighting - Enable lighting calculations
 * @param options.isOcclusion - Enable ambient occlusion texture support
 * @param options.isEmissive - Enable emissive texture support
 * @param options.isClearcoat - Enable clear coat extension (KHR_materials_clearcoat)
 * @param options.isTransmission - Enable transmission extension (KHR_materials_transmission)
 * @param options.isVolume - Enable volume extension (KHR_materials_volume)
 * @param options.isSheen - Enable sheen extension (KHR_materials_sheen)
 * @param options.isSpecular - Enable specular extension (KHR_materials_specular)
 * @param options.isIridescence - Enable iridescence extension (KHR_materials_iridescence)
 * @param options.isAnisotropy - Enable anisotropy extension (KHR_materials_anisotropy)
 * @param options.isDispersion - Enable dispersion extension (KHR_materials_dispersion)
 * @param options.isEmissiveStrength - Enable emissive strength extension
 * @param options.isDiffuseTransmission - Enable diffuse transmission extension
 * @param options.isShadow - Enable shadow mapping support
 * @param options.useTangentAttribute - Use tangent attributes for normal mapping
 * @param options.useNormalTexture - Enable normal texture support
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured PBR Uber Material instance
 */
export function createPbrUberMaterial(
  engine: Engine,
  {
    additionalName = '',
    isMorphing = true,
    isSkinning = true,
    isLighting = true,
    isOcclusion = false,
    isEmissive = false,
    isClearcoat = false,
    isTransmission = false,
    isVolume = false,
    isSheen = false,
    isSpecular = false,
    isIridescence = false,
    isAnisotropy = false,
    isDispersion = false,
    isEmissiveStrength = false,
    isDiffuseTransmission = false,
    isShadow = false,
    useNormalTexture = true,
    maxInstancesNumber = engine.config.materialCountPerBufferView,
  }: PbrUberMaterialOptions = {}
) {
  const materialName = `PbrUber_${additionalName}_`;

  const additionalShaderSemanticInfo: ShaderSemanticsInfo[] = [];

  const sampler = getSharedSampler(engine, {
    minFilter: TextureParameter.Linear,
    magFilter: TextureParameter.Linear,
    wrapS: TextureParameter.ClampToEdge,
    wrapT: TextureParameter.ClampToEdge,
  });

  if (isClearcoat) {
    additionalShaderSemanticInfo.push({
      semantic: 'clearcoatTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [-1, engine.dummyTextures.dummyWhiteTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: 'clearcoatRoughnessTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [-1, engine.dummyTextures.dummyWhiteTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: 'clearcoatNormalTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [-1, engine.dummyTextures.dummyBlueTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
  }

  if (isTransmission) {
    additionalShaderSemanticInfo.push({
      semantic: 'transmissionTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [-1, engine.dummyTextures.dummyWhiteTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: 'backBufferTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [-1, engine.dummyTextures.dummyBlackTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
  }

  if (isVolume) {
    additionalShaderSemanticInfo.push({
      semantic: 'thicknessTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [-1, engine.dummyTextures.dummyWhiteTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
  }

  if (isSheen) {
    additionalShaderSemanticInfo.push({
      semantic: 'sheenColorTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [-1, engine.dummyTextures.dummyWhiteTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: 'sheenRoughnessTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [-1, engine.dummyTextures.dummyWhiteTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: 'sheenLutTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [-1, engine.dummyTextures.sheenLutTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: 'sheenEnvTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.TextureCube,
      stage: ShaderType.PixelShader,
      isInternalSetting: true,
      initialValue: [-1, engine.dummyTextures.dummyBlackCubeTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
  }

  if (isSpecular) {
    additionalShaderSemanticInfo.push({
      semantic: 'specularTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [-1, engine.dummyTextures.dummyWhiteTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: 'specularColorTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [-1, engine.dummyTextures.dummyWhiteTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
  }

  if (isIridescence) {
    additionalShaderSemanticInfo.push({
      semantic: 'iridescenceTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [-1, engine.dummyTextures.dummyWhiteTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: 'iridescenceThicknessTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [-1, engine.dummyTextures.dummyWhiteTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
  }
  if (isAnisotropy) {
    additionalShaderSemanticInfo.push({
      semantic: 'anisotropyTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [-1, engine.dummyTextures.dummyAnisotropyTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
  }
  if (isDiffuseTransmission) {
    additionalShaderSemanticInfo.push({
      semantic: 'diffuseTransmissionTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [-1, engine.dummyTextures.dummyWhiteTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: 'diffuseTransmissionColorTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [-1, engine.dummyTextures.dummyWhiteTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
  }

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
    // The paraboloid shadow map stores depth divided by a far plane. It is an array because
    // each point light with a shadow slot can use a different far plane (its effective range).
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

  const definitions = [];
  definitions.push('RN_USE_PBR');
  if (isLighting) {
    definitions.push('RN_IS_LIGHTING');
  }
  if (isShadow && engine.config.maxLightNumber > 0) {
    definitions.push('RN_USE_SHADOW_MAPPING');
  }
  if (isSkinning) {
    definitions.push('RN_IS_SKINNING');
  }
  if (isMorphing) {
    definitions.push('RN_IS_MORPHING');
  }
  if (useNormalTexture) {
    definitions.push('RN_USE_NORMAL_TEXTURE');
  }
  if (isOcclusion) {
    definitions.push('RN_USE_OCCLUSION_TEXTURE');
  }
  if (isEmissive) {
    definitions.push('RN_USE_EMISSIVE_TEXTURE');
  }
  if (isClearcoat) {
    definitions.push('RN_USE_CLEARCOAT');
  }
  if (isTransmission) {
    definitions.push('RN_USE_TRANSMISSION');
  }
  if (isVolume) {
    definitions.push('RN_USE_VOLUME');
  }
  if (isSheen) {
    definitions.push('RN_USE_SHEEN');
  }
  if (isSpecular) {
    definitions.push('RN_USE_SPECULAR');
  }
  if (isIridescence) {
    definitions.push('RN_USE_IRIDESCENCE');
  }
  if (isAnisotropy) {
    definitions.push('RN_USE_ANISOTROPY');
  }
  if (isDispersion) {
    definitions.push('RN_USE_DISPERSION');
  }
  if (isEmissiveStrength) {
    definitions.push('RN_USE_EMISSIVE_STRENGTH');
  }
  if (isDiffuseTransmission) {
    definitions.push('RN_USE_DIFFUSE_TRANSMISSION');
  }

  const materialContent = new CustomMaterialContent(engine, {
    name: materialName,
    isSkinning,
    isLighting,
    isMorphing,
    vertexShader: pbrSingleShaderVertex,
    pixelShader: pbrSingleShaderFragment,
    vertexShaderWebGpu: pbrSingleShaderVertexWebGpu,
    pixelShaderWebGpu: pbrSingleShaderFragmentWebGpu,
    additionalShaderSemanticInfo,
    definitions,
  });

  const material = createMaterial(engine, materialContent, maxInstancesNumber);

  for (const definition of definitions) {
    material.addShaderDefine(definition);
  }

  return material;
}
