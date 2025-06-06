import { Config } from '../core/Config';
import type { Material } from '../materials/core/Material';
import type { RenderPass } from '../renderer/RenderPass';
import type { AbstractMaterialContent } from '../materials/core/AbstractMaterialContent';
import { DepthEncodeMaterialContent } from '../materials/contents/DepthEncodeMaterialContent';
import { ShadowMapDecodeClassicMaterialContent } from '../materials/contents/ShadowMapDecodeClassicMaterialContent';
import { EntityUIDOutputMaterialContent } from '../materials/contents/EntityUIDOutputMaterialContent';
import { MToon0xMaterialContent } from '../materials/contents/MToon0xMaterialContent';
import { CustomMaterialContent } from '../materials/contents/CustomMaterialContent';
import type { Primitive } from '../geometry/Primitive';
import { ProcessStage } from '../definitions/ProcessStage';
import type { AbstractTexture } from '../textures/AbstractTexture';
import { FurnaceTestMaterialContent } from '../materials/contents/FurnaceTestMaterialContent';
import { DetectHighLuminanceMaterialContent } from '../materials/contents/DetectHighLuminanceMaterialContent';
import { SynthesizeHdrMaterialContent as SynthesizeHDRMaterialContent } from '../materials/contents/SynthesizeHdrMaterialContent';
import { ColorGradingUsingLUTsMaterialContent } from '../materials/contents/ColorGradingUsingLUTsMaterialContent';
import { MatCapMaterialContent } from '../materials/contents/MatCapMaterialContent';
import { VarianceShadowMapDecodeClassicMaterialContent } from '../materials/contents/VarianceShadowMapDecodeClassicMaterialContent';
import type { Texture } from '../textures/Texture';
import type { CameraComponent } from '../components/Camera/CameraComponent';
import type { Count } from '../../types/CommonTypes';
import type { IMeshRendererEntityMethods } from '../components/MeshRenderer/IMeshRendererEntity';
import { ComponentType } from '../definitions/ComponentType';
import { CompositionType } from '../definitions/CompositionType';
import { ShaderType } from '../definitions/ShaderType';
import { VectorN } from '../math/VectorN';
import type { ShaderSemanticsInfo } from '../definitions/ShaderSemanticsInfo';
import ClassicSingleShaderVertex from '../../webgl/shaderity_shaders/ClassicSingleShader/ClassicSingleShader.vert';
import ClassicSingleShaderFragment from '../../webgl/shaderity_shaders/ClassicSingleShader/ClassicSingleShader.frag';
import ClassicSingleShaderVertexWebGpu from '../../webgpu/shaderity_shaders/ClassicSingleShader/ClassicSingleShader.vert';
import ClassicSingleShaderFragmentWebgpu from '../../webgpu/shaderity_shaders/ClassicSingleShader/ClassicSingleShader.frag';
import pbrSingleShaderVertex from '../../webgl/shaderity_shaders/PbrSingleShader/PbrSingleShader.vert';
import pbrSingleShaderFragment from '../../webgl/shaderity_shaders/PbrSingleShader/PbrSingleShader.frag';
import pbrSingleShaderVertexWebGpu from '../../webgpu/shaderity_shaders/PbrSingleShader/PbrSingleShader.vert';
import pbrSingleShaderFragmentWebGpu from '../../webgpu/shaderity_shaders/PbrSingleShader/PbrSingleShader.frag';
import EnvConstantSingleShaderVertex from '../../webgl/shaderity_shaders/EnvConstantSingleShader/EnvConstantSingleShader.vert';
import EnvConstantSingleShaderFragment from '../../webgl/shaderity_shaders/EnvConstantSingleShader/EnvConstantSingleShader.frag';
import EnvConstantSingleShaderVertexWebGpu from '../../webgpu/shaderity_shaders/EnvConstantSingleShader/EnvConstantSingleShader.vert';
import EnvConstantSingleShaderFragmentWebGpu from '../../webgpu/shaderity_shaders/EnvConstantSingleShader/EnvConstantSingleShader.frag';
import FXAA3QualityShaderVertex from '../../webgl/shaderity_shaders/FXAA3QualityShader/FXAA3QualitySingleShader.vert';
import FXAA3QualityShaderFragment from '../../webgl/shaderity_shaders/FXAA3QualityShader/FXAA3QualitySingleShader.frag';
import GammaCorrectionShaderVertex from '../../webgl/shaderity_shaders/GammaCorrectionShader/GammaCorrectionShader.vert';
import GammaCorrectionShaderFragment from '../../webgl/shaderity_shaders/GammaCorrectionShader/GammaCorrectionShader.frag';
import GammaCorrectionShaderVertexWebGpu from '../../webgpu/shaderity_shaders/GammaCorrectionShader/GammaCorrectionShader.vert';
import GammaCorrectionShaderFragmentWebGpu from '../../webgpu/shaderity_shaders/GammaCorrectionShader/GammaCorrectionShader.frag';
import ToneMappingShaderVertexGLSL from '../../webgl/shaderity_shaders/ToneMappingShader/ToneMappingShader.vert';
import ToneMappingShaderFragmentGLSL from '../../webgl/shaderity_shaders/ToneMappingShader/ToneMappingShader.frag';
import ToneMappingShaderVertexWGSL from '../../webgpu/shaderity_shaders/ToneMappingShader/ToneMappingShader.vert.wgsl';
import ToneMappingShaderFragmentWGSL from '../../webgpu/shaderity_shaders/ToneMappingShader/ToneMappingShader.frag.wgsl';
import SummedAreaTableShaderVertex from '../../webgl/shaderity_shaders/SummedAreaTableShader/SummedAreaTableShader.vert';
import SummedAreaTableShaderFragment from '../../webgl/shaderity_shaders/SummedAreaTableShader/SummedAreaTableShader.frag';
import FlatSingleShaderVertex from '../../webgl/shaderity_shaders/FlatSingleShader/FlatSingleShader.vert';
import FlatSingleShaderFragment from '../../webgl/shaderity_shaders/FlatSingleShader/FlatSingleShader.frag';
import FlatSingleShaderVertexWebGpu from '../../webgpu/shaderity_shaders/FlatSingleShader/FlatSingleShader.vert';
import FlatSingleShaderFragmentWebGpu from '../../webgpu/shaderity_shaders/FlatSingleShader/FlatSingleShader.frag';
import DepthMomentEncodeShaderVertex from '../../webgl/shaderity_shaders/DepthMomentEncodeShader/DepthMomentEncodeShader.vert';
import DepthMomentEncodeShaderFragment from '../../webgl/shaderity_shaders/DepthMomentEncodeShader/DepthMomentEncodeShader.frag';
import DepthMomentEncodeShaderVertexWebGpu from '../../webgpu/shaderity_shaders/DepthMomentEncodeShader/DepthMomentEncodeShader.vert.wgsl';
import DepthMomentEncodeShaderFragmentWebGpu from '../../webgpu/shaderity_shaders/DepthMomentEncodeShader/DepthMomentEncodeShader.frag.wgsl';
import ParaboloidDepthMomentEncodeShaderVertex from '../../webgl/shaderity_shaders/ParaboloidDepthMomentEncodeShader/ParaboloidDepthMomentEncodeShader.vert.glsl';
import ParaboloidDepthMomentEncodeShaderFragment from '../../webgl/shaderity_shaders/ParaboloidDepthMomentEncodeShader/ParaboloidDepthMomentEncodeShader.frag.glsl';
import ParaboloidDepthMomentEncodeShaderVertexWebGpu from '../../webgpu/shaderity_shaders/ParaboloidDepthMomentEncodeShader/ParaboloidDepthMomentEncodeShader.vert.wgsl';
import ParaboloidDepthMomentEncodeShaderFragmentWebGpu from '../../webgpu/shaderity_shaders/ParaboloidDepthMomentEncodeShader/ParaboloidDepthMomentEncodeShader.frag.wgsl';
import { MaterialRepository } from '../materials/core/MaterialRepository';
import { RnM2Material, type Vrm0xMaterialProperty } from '../../types';
import { Sampler } from '../textures/Sampler';
import {
  dummyAnisotropyTexture,
  dummyBlackCubeTexture,
  dummyBlackTexture,
  dummyBlueTexture,
  dummyDepthMomentTextureArray,
  dummyWhiteTexture,
  sheenLutTexture,
} from '../materials/core/DummyTextures';
import GaussianBlurSingleShaderVertex from '../../webgl/shaderity_shaders/GaussianBlurShader/GaussianBlurShader.vert';
import GaussianBlurSingleShaderFragment from '../../webgl/shaderity_shaders/GaussianBlurShader/GaussianBlurShader.frag';
import GaussianBlurSingleShaderVertexWebGpu from '../../webgpu/shaderity_shaders/GaussianBlurShader/GaussianBlurShader.vert';
import GaussianBlurSingleShaderFragmentWebGpu from '../../webgpu/shaderity_shaders/GaussianBlurShader/GaussianBlurShader.frag';
import GaussianBlurForEncodedDepthSingleShaderVertex from '../../webgl/shaderity_shaders/GaussianBlurForEncodedDepthShader/GaussianBlurForEncodedDepthShader.vert';
import GaussianBlurForEncodedDepthSingleShaderFragment from '../../webgl/shaderity_shaders/GaussianBlurForEncodedDepthShader/GaussianBlurForEncodedDepthShader.frag';
import PanoramaToCubeShaderVertex from '../../webgl/shaderity_shaders/PanoramaToCubeShader/PanoramaToCubeShader.vert';
import PanoramaToCubeShaderFragment from '../../webgl/shaderity_shaders/PanoramaToCubeShader/PanoramaToCubeShader.frag';
import PanoramaToCubeShaderVertexWebGpu from '../../webgpu/shaderity_shaders/PanoramaToCubeShader/PanoramaToCubeShader.vert.wgsl';
import PanoramaToCubeShaderFragmentWebGpu from '../../webgpu/shaderity_shaders/PanoramaToCubeShader/PanoramaToCubeShader.frag.wgsl';
import PrefilterIBLShaderVertex from '../../webgl/shaderity_shaders/PrefilterIBLShader/PrefilterIBLShader.vert';
import PrefilterIBLShaderFragment from '../../webgl/shaderity_shaders/PrefilterIBLShader/PrefilterIBLShader.frag';
import PrefilterIBLShaderVertexWebGpu from '../../webgpu/shaderity_shaders/PrefilterIBLShader/PrefilterIBLShader.vert.wgsl';
import PrefilterIBLShaderFragmentWebGpu from '../../webgpu/shaderity_shaders/PrefilterIBLShader/PrefilterIBLShader.frag.wgsl';
import { Scalar } from '../math/Scalar';
import { ProcessApproach, TextureParameter } from '../definitions';
import { Vector2 } from '../math/Vector2';
import { SystemState } from '../system/SystemState';
import { MToon1MaterialContent } from '../materials/contents/MToon1MaterialContent';
import type { Vrm1_Material } from '../../types/VRMC_materials_mtoon';
import { DataUtil } from '../misc/DataUtil';

const g_sampler = new Sampler({
  minFilter: TextureParameter.Linear,
  magFilter: TextureParameter.Linear,
  wrapS: TextureParameter.ClampToEdge,
  wrapT: TextureParameter.ClampToEdge,
});

/**
 * Creates a new material with the specified material content and maximum instances.
 * This function automatically manages material grouping when instance limits are reached.
 *
 * @param materialContent - The material content that defines the material's properties and shaders
 * @param maxInstancesNumber - The maximum number of instances that can use this material
 * @returns A newly created Material instance
 * @throws Error if material creation fails after exhausting all groups
 */
function createMaterial(materialContent: AbstractMaterialContent, maxInstancesNumber?: Count): Material {
  let group = 0;
  let isFull = false;
  const materialSemanticsVariantName = materialContent.getMaterialSemanticsVariantName();
  do {
    const actualMaterialTypeName = materialSemanticsVariantName + `__group${group}`;
    isFull = MaterialRepository.isFullOrOverOfThisMaterialType(actualMaterialTypeName);
    if (!isFull) {
      MaterialRepository.registerMaterial(actualMaterialTypeName, materialContent, maxInstancesNumber!);
      const material = MaterialRepository.createMaterial(actualMaterialTypeName, materialContent);
      return material;
    }
    group++;
  } while (isFull);

  throw new Error('Failed to create material');
}

/**
 * Reuses an existing material if compatible with the new content, or recreates it if incompatible.
 * This function optimizes performance by avoiding unnecessary material recreation.
 *
 * @param currentMaterial - The existing material to potentially reuse
 * @param materialContent - The new material content to apply
 * @param maxInstancesNumber - The maximum number of instances for the material
 * @returns The reused or newly created Material instance
 */
function reuseOrRecreateMaterial(
  currentMaterial: Material,
  materialContent: AbstractMaterialContent,
  maxInstancesNumber: Count
): Material {
  let material = currentMaterial;
  if (MaterialRepository.isMaterialCompatible(material, materialContent)) {
    material._materialContent = materialContent;
    material.makeShadersInvalidate();
    return material;
  } else {
    const materialSemanticsVariantName = materialContent.getMaterialSemanticsVariantName();
    MaterialRepository.registerMaterial(materialSemanticsVariantName, materialContent, maxInstancesNumber);
    material = MaterialRepository.createMaterial(materialSemanticsVariantName, materialContent);
    return material;
  }
}

/**
 * Forces recreation of a material with the specified content, bypassing compatibility checks.
 * Use this when you need to ensure a completely fresh material instance.
 *
 * @param materialContent - The material content for the new material
 * @param maxInstancesNumber - The maximum number of instances for the material
 * @returns A newly recreated Material instance
 */
function recreateMaterial(materialContent: AbstractMaterialContent, maxInstancesNumber?: Count): Material {
  const materialSemanticsVariantName = materialContent.getMaterialSemanticsVariantName();
  MaterialRepository.forceRegisterMaterial(materialSemanticsVariantName, materialContent, maxInstancesNumber!);

  const material = MaterialRepository.createMaterial(materialSemanticsVariantName, materialContent);
  return material;
}

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
 * @param options.isClearCoat - Enable clear coat extension (KHR_materials_clearcoat)
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
function createPbrUberMaterial({
  additionalName = '',
  isMorphing = true,
  isSkinning = true,
  isLighting = true,
  isOcclusion = false,
  isEmissive = false,
  isClearCoat = false,
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
  useTangentAttribute = false,
  useNormalTexture = true,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType,
} = {}) {
  const materialName = 'PbrUber' + `_${additionalName}_`;

  let additionalShaderSemanticInfo: ShaderSemanticsInfo[] = [];
  if (true) {
    additionalShaderSemanticInfo = [
      {
        semantic: 'dataTextureMorphOffsetPosition',
        componentType: ComponentType.Int,
        compositionType: CompositionType.ScalarArray,
        arrayLength: Config.maxMorphTargetNumber,
        stage: ShaderType.VertexShader,
        isInternalSetting: true,
        soloDatum: true,
        initialValue: new VectorN(new Int32Array(Config.maxMorphTargetNumber)),
        min: -Number.MAX_VALUE,
        max: Number.MAX_VALUE,
        needUniformInDataTextureMode: true,
      },
      {
        semantic: 'morphWeights',
        componentType: ComponentType.Float,
        compositionType: CompositionType.ScalarArray,
        arrayLength: Config.maxMorphTargetNumber,
        stage: ShaderType.VertexShader,
        isInternalSetting: true,
        soloDatum: true,
        initialValue: new VectorN(new Float32Array(Config.maxMorphTargetNumber)),
        min: -Number.MAX_VALUE,
        max: Number.MAX_VALUE,
        needUniformInDataTextureMode: true,
      },
    ];
  }

  if (!g_sampler.created) {
    g_sampler.create();
  }

  let textureSlotIdx = 8;
  if (isClearCoat) {
    additionalShaderSemanticInfo.push({
      semantic: 'clearcoatTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [textureSlotIdx++, dummyWhiteTexture, g_sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: 'clearcoatRoughnessTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [textureSlotIdx++, dummyWhiteTexture, g_sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: 'clearcoatNormalTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [textureSlotIdx++, dummyBlueTexture, g_sampler],
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
      initialValue: [textureSlotIdx++, dummyWhiteTexture, g_sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: 'backBufferTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [textureSlotIdx++, dummyBlackTexture, g_sampler],
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
      initialValue: [textureSlotIdx++, dummyWhiteTexture, g_sampler],
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
      initialValue: [textureSlotIdx++, dummyWhiteTexture, g_sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: 'sheenRoughnessTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [textureSlotIdx++, dummyWhiteTexture, g_sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: 'sheenLutTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [textureSlotIdx++, sheenLutTexture, g_sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: 'sheenEnvTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.TextureCube,
      stage: ShaderType.PixelShader,
      isInternalSetting: true,
      initialValue: [textureSlotIdx++, dummyBlackCubeTexture, g_sampler],
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
      initialValue: [textureSlotIdx++, dummyWhiteTexture, g_sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: 'specularColorTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [textureSlotIdx++, dummyWhiteTexture, g_sampler],
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
      initialValue: [textureSlotIdx++, dummyWhiteTexture, g_sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: 'iridescenceThicknessTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [textureSlotIdx++, dummyWhiteTexture, g_sampler],
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
      initialValue: [textureSlotIdx++, dummyAnisotropyTexture, g_sampler],
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
      initialValue: [textureSlotIdx++, dummyWhiteTexture, g_sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: 'diffuseTransmissionColorTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [textureSlotIdx++, dummyWhiteTexture, g_sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
  }

  if (isShadow) {
    additionalShaderSemanticInfo.push({
      semantic: 'depthTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2DArray,
      stage: ShaderType.PixelShader,
      initialValue: [textureSlotIdx++, dummyDepthMomentTextureArray, g_sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: 'paraboloidDepthTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2DArray,
      stage: ShaderType.PixelShader,
      initialValue: [textureSlotIdx++, dummyDepthMomentTextureArray, g_sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: 'depthTextureIndexList',
      componentType: ComponentType.Int,
      compositionType: CompositionType.ScalarArray,
      arrayLength: Config.maxLightNumber,
      stage: ShaderType.PixelShader,
      initialValue: new VectorN(new Int32Array(Config.maxLightNumber)),
      min: 0,
      max: Number.MAX_VALUE,
    });
    // BiasMatrix * LightProjectionMatrix * LightViewMatrix, See: http://www.opengl-tutorial.org/intermediate-tutorials/tutorial-16-shadow-mapping/#basic-shader
    additionalShaderSemanticInfo.push({
      semantic: 'depthBiasPV',
      componentType: ComponentType.Float,
      compositionType: CompositionType.Mat4Array,
      arrayLength: Config.maxLightNumber,
      stage: ShaderType.PixelShader,
      initialValue: new VectorN(new Float32Array(Config.maxLightNumber * 16)),
      min: 0,
      max: Number.MAX_VALUE,
    });
  }

  const definitions = [];
  if (isLighting) {
    definitions.push('RN_IS_LIGHTING');
  }
  if (isShadow) {
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
  if (isClearCoat) {
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

  const materialContent = new CustomMaterialContent({
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

  const material = createMaterial(materialContent, maxInstancesNumber);

  for (const definition of definitions) {
    material.addShaderDefine(definition);
  }

  return material;
}

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
function createClassicUberMaterial({
  additionalName = '',
  isSkinning = true,
  isLighting = false,
  isMorphing = false,
  isShadow = false,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType,
} = {}) {
  const materialName = 'ClassicUber' + `_${additionalName}_`;
  const additionalShaderSemanticInfo = [
    {
      semantic: 'dataTextureMorphOffsetPosition',
      componentType: ComponentType.Int,
      compositionType: CompositionType.ScalarArray,
      arrayLength: Config.maxMorphTargetNumber,
      stage: ShaderType.VertexShader,
      isInternalSetting: true,
      soloDatum: true,
      initialValue: new VectorN(new Int32Array(Config.maxMorphTargetNumber)),
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      needUniformInDataTextureMode: true,
    },
    {
      semantic: 'morphWeights',
      componentType: ComponentType.Float,
      compositionType: CompositionType.ScalarArray,
      arrayLength: Config.maxMorphTargetNumber,
      stage: ShaderType.VertexShader,
      isInternalSetting: true,
      soloDatum: true,
      initialValue: new VectorN(new Float32Array(Config.maxMorphTargetNumber)),
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      needUniformInDataTextureMode: true,
    },
  ];

  const materialContent = new CustomMaterialContent({
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
  const material = createMaterial(materialContent, maxInstancesNumber);
  if (isLighting) {
    material.addShaderDefine('RN_IS_LIGHTING');
  }
  if (isShadow) {
    material.addShaderDefine('RN_USE_SHADOW_MAPPING');
  }
  material.addShaderDefine('RN_USE_NORMAL_TEXTURE');
  material.addShaderDefine('RN_IS_SKINNING');

  return material;
}

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
function createParaboloidDepthMomentEncodeMaterial({
  additionalName = '',
  isSkinning = true,
  isMorphing = false,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType,
} = {}) {
  const materialName = 'ParaboloidDepthMomentEncode' + `_${additionalName}_`;

  const additionalShaderSemanticInfo = [
    {
      semantic: 'dataTextureMorphOffsetPosition',
      componentType: ComponentType.Int,
      compositionType: CompositionType.ScalarArray,
      arrayLength: Config.maxMorphTargetNumber,
      stage: ShaderType.VertexShader,
      isInternalSetting: true,
      soloDatum: true,
      initialValue: new VectorN(new Int32Array(Config.maxMorphTargetNumber)),
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      needUniformInDataTextureMode: true,
    },
    {
      semantic: 'morphWeights',
      componentType: ComponentType.Float,
      compositionType: CompositionType.ScalarArray,
      arrayLength: Config.maxMorphTargetNumber,
      stage: ShaderType.VertexShader,
      isInternalSetting: true,
      soloDatum: true,
      initialValue: new VectorN(new Float32Array(Config.maxMorphTargetNumber)),
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      needUniformInDataTextureMode: true,
    },
  ];
  const materialContent = new CustomMaterialContent({
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
  const material = createMaterial(materialContent, maxInstancesNumber);
  material.addShaderDefine('RN_IS_SKINNING');

  return material;
}

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
function createDepthMomentEncodeMaterial({
  additionalName = '',
  isSkinning = true,
  isMorphing = false,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType,
} = {}) {
  const materialName = 'DepthMomentEncode' + `_${additionalName}_`;

  const additionalShaderSemanticInfo = [
    {
      semantic: 'dataTextureMorphOffsetPosition',
      componentType: ComponentType.Int,
      compositionType: CompositionType.ScalarArray,
      arrayLength: Config.maxMorphTargetNumber,
      stage: ShaderType.VertexShader,
      isInternalSetting: true,
      soloDatum: true,
      initialValue: new VectorN(new Int32Array(Config.maxMorphTargetNumber)),
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      needUniformInDataTextureMode: true,
    },
    {
      semantic: 'morphWeights',
      componentType: ComponentType.Float,
      compositionType: CompositionType.ScalarArray,
      arrayLength: Config.maxMorphTargetNumber,
      stage: ShaderType.VertexShader,
      isInternalSetting: true,
      soloDatum: true,
      initialValue: new VectorN(new Float32Array(Config.maxMorphTargetNumber)),
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      needUniformInDataTextureMode: true,
    },
  ];
  const materialContent = new CustomMaterialContent({
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
  const material = createMaterial(materialContent, maxInstancesNumber);
  material.addShaderDefine('RN_IS_SKINNING');

  return material;
}

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
function createFlatMaterial({
  additionalName = '',
  isSkinning = true,
  isMorphing = false,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType,
} = {}) {
  const materialName = 'Flat' + `_${additionalName}_`;

  const materialContent = new CustomMaterialContent({
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
  const material = createMaterial(materialContent, maxInstancesNumber);
  material.addShaderDefine('RN_IS_SKINNING');

  return material;
}

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
function createEnvConstantMaterial({ additionalName = '', maxInstancesNumber = 5, makeOutputSrgb = true } = {}) {
  const materialName = 'EnvConstant' + `_${additionalName}`;

  const materialContent = new CustomMaterialContent({
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
  const material = createMaterial(materialContent, maxInstancesNumber);
  material.setParameter('makeOutputSrgb', makeOutputSrgb ? 1 : 0);
  return material;
}

/**
 * Creates a FXAA (Fast Approximate Anti-Aliasing) post-processing material.
 * This material applies FXAA3 quality anti-aliasing to reduce edge aliasing.
 *
 * @param options - Configuration object for the FXAA material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured FXAA3 Quality Material instance
 */
function createFXAA3QualityMaterial({ additionalName = '', maxInstancesNumber = 1 } = {}): Material {
  const materialName = 'FXAA3Quality' + `_${additionalName}`;

  const materialContent = new CustomMaterialContent({
    name: materialName,
    isSkinning: false,
    isLighting: false,
    isMorphing: false,
    vertexShader: FXAA3QualityShaderVertex,
    pixelShader: FXAA3QualityShaderFragment,
    additionalShaderSemanticInfo: [],
  });
  const material = createMaterial(materialContent, maxInstancesNumber);

  return material;
}

/**
 * Creates a furnace test material for validating material energy conservation.
 * This material is used for testing purposes to ensure materials conserve energy properly.
 *
 * @param options - Configuration object for the furnace test material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Furnace Test Material instance
 */
function createFurnaceTestMaterial({ additionalName = '', maxInstancesNumber = 1 } = {}): Material {
  const materialName = 'FurnaceTest' + `_${additionalName}`;
  const materialContent = new FurnaceTestMaterialContent(materialName);
  const material = createMaterial(materialContent, maxInstancesNumber);

  return material;
}

/**
 * Creates a material for encoding depth values into color channels.
 * This material is used for depth-based effects and shadow mapping.
 *
 * @param options - Configuration object for the depth encode material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.depthPow - Power value for depth encoding (affects depth precision)
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Depth Encode Material instance
 */
function createDepthEncodeMaterial({
  additionalName = '',
  isSkinning = false,
  depthPow = 1.0,
  maxInstancesNumber = 10,
} = {}) {
  const materialName = 'DepthEncode' + `_${additionalName}_`;

  const materialContent = new DepthEncodeMaterialContent(materialName, depthPow, {
    isSkinning,
  });
  const material = createMaterial(materialContent, maxInstancesNumber);
  if (isSkinning) {
    material.addShaderDefine('RN_IS_SKINNING');
  }

  return material;
}

/**
 * Creates a material for decoding classic shadow maps in the rendering pipeline.
 * This material applies shadow mapping techniques to create realistic shadows.
 *
 * @param options - Configuration object for the shadow map decode material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isMorphing - Enable morph target animation support
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isLighting - Enable lighting calculations
 * @param options.isDebugging - Enable debugging features
 * @param options.colorAttachmentsNumber - Number of color attachments
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param depthEncodeRenderPass - The render pass that encodes depth information
 * @returns A configured Shadow Map Decode Classic Material instance
 */
function createShadowMapDecodeClassicSingleMaterial(
  {
    additionalName = '',
    isMorphing = false,
    isSkinning = false,
    isLighting = true,
    isDebugging = false,
    colorAttachmentsNumber = 0,
    maxInstancesNumber = 20,
  } = {},
  depthEncodeRenderPass: RenderPass
) {
  const materialName = 'ShadowMapDecodeClassic' + `_${additionalName}_`;

  const materialContent = new ShadowMapDecodeClassicMaterialContent(
    materialName,
    {
      isMorphing,
      isSkinning,
      isLighting,
      isDebugging,
      colorAttachmentsNumber,
    },
    depthEncodeRenderPass
  );
  const material = createMaterial(materialContent, maxInstancesNumber);
  if (isSkinning) {
    material.addShaderDefine('RN_IS_SKINNING');
  }
  if (isMorphing) {
    material.addShaderDefine('RN_IS_MORPHING');
  }
  if (isLighting) {
    material.addShaderDefine('RN_IS_LIGHTING');
  }
  if (isDebugging) {
    material.addShaderDefine('RN_IS_DEBUGGING');
  }

  return material;
}

/**
 * Creates a material for Gaussian blur applied to encoded depth textures.
 * This material is used for creating soft shadows by blurring depth maps.
 *
 * @param options - Configuration object for the Gaussian blur material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Gaussian Blur for Encoded Depth Material instance
 */
function createGaussianBlurForEncodedDepthMaterial({ additionalName = '', maxInstancesNumber = 10 } = {}) {
  const materialName = 'GaussianBlurForEncodedDepth' + `_${additionalName}`;

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
      needUniformInDataTextureMode: true,
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
      initialValue: [0, dummyBlackTexture],
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
    }
  );

  const materialContent = new CustomMaterialContent({
    name: materialName,
    isSkinning: false,
    isLighting: false,
    isMorphing: false,
    vertexShader: GaussianBlurForEncodedDepthSingleShaderVertex,
    pixelShader: GaussianBlurForEncodedDepthSingleShaderFragment,
    additionalShaderSemanticInfo,
  });

  const material = createMaterial(materialContent, maxInstancesNumber);

  return material;
}

/**
 * Creates a material for decoding variance shadow maps with classic single-pass rendering.
 * This material implements variance shadow mapping for soft shadow effects.
 *
 * @param options - Configuration object for the variance shadow map material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isMorphing - Enable morph target animation support
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isDebugging - Enable debugging features
 * @param options.isLighting - Enable lighting calculations
 * @param options.colorAttachmentsNumberDepth - Number of depth color attachments
 * @param options.colorAttachmentsNumberSquareDepth - Number of squared depth color attachments
 * @param options.depthCameraComponent - Camera component for depth calculations
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param encodedDepthRenderPasses - Array of render passes that encode depth information
 * @returns A configured Variance Shadow Map Decode Classic Material instance
 */
function createVarianceShadowMapDecodeClassicSingleMaterial(
  {
    additionalName = '',
    isMorphing = false,
    isSkinning = false,
    isDebugging = false,
    isLighting = true,
    colorAttachmentsNumberDepth = 0,
    colorAttachmentsNumberSquareDepth = 0,
    depthCameraComponent = undefined,
    maxInstancesNumber = 10,
  }: {
    additionalName?: string;
    isMorphing?: boolean;
    isSkinning?: boolean;
    isDebugging?: boolean;
    isLighting?: boolean;
    colorAttachmentsNumberDepth?: Count;
    colorAttachmentsNumberSquareDepth?: Count;
    depthCameraComponent?: CameraComponent;
    maxInstancesNumber?: Count;
  },
  encodedDepthRenderPasses: RenderPass[]
) {
  const materialName = 'VarianceShadowMapDecodeClassic' + `_${additionalName}_`;
  const materialContent = new VarianceShadowMapDecodeClassicMaterialContent(
    materialName,
    {
      isMorphing,
      isSkinning,
      isLighting,
      isDebugging,
      colorAttachmentsNumberDepth,
      colorAttachmentsNumberSquareDepth,
      depthCameraComponent,
    },
    encodedDepthRenderPasses
  );
  const material = createMaterial(materialContent, maxInstancesNumber);
  if (isSkinning) {
    material.addShaderDefine('RN_IS_SKINNING');
  }
  if (isLighting) {
    material.addShaderDefine('RN_IS_LIGHTING');
  }
  if (isMorphing) {
    material.addShaderDefine('RN_IS_MORPHING');
  }
  if (isDebugging) {
    material.addShaderDefine('RN_IS_DEBUGGING');
  }
  return material;
}

/**
 * Creates a material for detecting high luminance areas in textures.
 * This material is typically used in HDR rendering pipelines for bloom effects.
 *
 * @param options - Configuration object for the high luminance detection material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param textureToDetectHighLuminance - The texture to analyze for high luminance areas
 * @returns A configured Detect High Luminance Material instance
 */
function createDetectHighLuminanceMaterial(
  { additionalName = '', maxInstancesNumber = 5 } = {},
  textureToDetectHighLuminance: AbstractTexture
) {
  const materialName = 'DetectHighLuminance' + `_${additionalName}_`;
  const materialContent = new DetectHighLuminanceMaterialContent(materialName, textureToDetectHighLuminance);
  const material = createMaterial(materialContent, maxInstancesNumber);
  return material;
}

/**
 * Creates a material for Gaussian blur post-processing effects.
 * This material applies Gaussian blur for various effects like depth of field or bloom.
 *
 * @param options - Configuration object for the Gaussian blur material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Gaussian Blur Material instance
 */
function createGaussianBlurMaterial({ additionalName = '', maxInstancesNumber = 10 } = {}): Material {
  const materialName = 'GaussianBlur' + `_${additionalName}`;

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
      initialValue: [0, dummyBlackTexture],
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
    }
  );

  const materialContent = new CustomMaterialContent({
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
  const material = createMaterial(materialContent, maxInstancesNumber);

  return material;
}

/**
 * Creates a material for synthesizing HDR (High Dynamic Range) textures.
 * This material combines multiple textures to create HDR content for advanced lighting.
 *
 * @param options - Configuration object for the HDR synthesis material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param synthesizeTextures - Array of textures to synthesize into HDR
 * @returns A configured Synthesize HDR Material instance
 */
function createSynthesizeHDRMaterial(
  {
    additionalName = '',
    maxInstancesNumber = 1,
  }: {
    additionalName?: string;
    maxInstancesNumber?: Count;
  },
  synthesizeTextures: AbstractTexture[]
) {
  const materialName = 'SynthesizeHDR' + `_${additionalName}`;

  const materialContent = new SynthesizeHDRMaterialContent(materialName, synthesizeTextures);
  const material = createMaterial(materialContent, maxInstancesNumber);

  return material;
}

/**
 * Creates a material for color grading using LUT (Look-Up Table) textures.
 * This material applies color correction and grading effects using 3D LUT textures.
 *
 * @param options - Configuration object for the color grading material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.colorAttachmentsNumber - Number of color attachments
 * @param options.uri - URI path to the LUT texture
 * @param options.texture - Pre-loaded LUT texture
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param targetRenderPass - The render pass to apply color grading to
 * @returns A configured Color Grading using LUTs Material instance
 */
function createColorGradingUsingLUTsMaterial(
  {
    additionalName = '',
    colorAttachmentsNumber = 0,
    uri,
    texture,
    maxInstancesNumber = 1,
  }: {
    additionalName?: string;
    colorAttachmentsNumber?: Count;
    uri?: string;
    texture?: Texture;
    maxInstancesNumber?: Count;
  },
  targetRenderPass: RenderPass
) {
  const materialName = 'ColorGradingUsingLUTs' + `_${additionalName}`;

  const materialContent = new ColorGradingUsingLUTsMaterialContent(
    materialName,
    targetRenderPass,
    colorAttachmentsNumber,
    uri,
    texture
  );
  const material = createMaterial(materialContent, maxInstancesNumber);

  return material;
}

/**
 * Creates a material for gamma correction post-processing.
 * This material applies gamma correction to convert linear color space to sRGB.
 *
 * @param options - Configuration object for the gamma correction material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Gamma Correction Material instance
 */
function createGammaCorrectionMaterial({ additionalName = '', maxInstancesNumber = 1 } = {}): Material {
  const materialName = 'GammaCorrection' + `_${additionalName}`;

  const materialContent = new CustomMaterialContent({
    name: materialName,
    isSkinning: false,
    isLighting: false,
    isMorphing: false,
    vertexShader: GammaCorrectionShaderVertex,
    pixelShader: GammaCorrectionShaderFragment,
    vertexShaderWebGpu: GammaCorrectionShaderVertexWebGpu,
    pixelShaderWebGpu: GammaCorrectionShaderFragmentWebGpu,
    additionalShaderSemanticInfo: [],
  });
  const material = createMaterial(materialContent, maxInstancesNumber);

  return material;
}

/**
 * Creates a material for tone mapping HDR content to LDR display.
 * This material converts high dynamic range colors to displayable range using tone mapping algorithms.
 *
 * @param options - Configuration object for the tone mapping material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Tone Mapping Material instance
 */
function createToneMappingMaterial({ additionalName = '', maxInstancesNumber = 1 } = {}): Material {
  const materialName = 'ToneMapping' + `_${additionalName}`;

  const materialContent = new CustomMaterialContent({
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
  const material = createMaterial(materialContent, maxInstancesNumber);
  material.addShaderDefine('RN_USE_GT_TONEMAP');

  return material;
}

/**
 * Creates a material for generating summed area tables from textures.
 * This material is used for efficient area sampling and filtering operations.
 *
 * @param options - Configuration object for the summed area table material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Summed Area Table Material instance
 */
function createSummedAreaTableMaterial({ additionalName = '', maxInstancesNumber = 1 } = {}): Material {
  const materialName = 'SummedAreaTable' + `_${additionalName}`;

  const materialContent = new CustomMaterialContent({
    name: materialName,
    isSkinning: false,
    isLighting: false,
    isMorphing: false,
    vertexShader: SummedAreaTableShaderVertex,
    pixelShader: SummedAreaTableShaderFragment,
    additionalShaderSemanticInfo: [],
  });
  const material = createMaterial(materialContent, maxInstancesNumber);

  return material;
}

/**
 * Creates a material for converting panoramic textures to cube map format.
 * This material transforms equirectangular panoramic images into cube map textures.
 *
 * @param options - Configuration object for the panorama to cube material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Panorama to Cube Material instance
 */
function createPanoramaToCubeMaterial({ additionalName = '', maxInstancesNumber = 1 } = {}): Material {
  const materialName = 'PanoramaToCube' + `_${additionalName}`;

  const materialContent = new CustomMaterialContent({
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
  const material = createMaterial(materialContent, maxInstancesNumber);

  return material;
}

/**
 * Creates a material for prefiltering IBL (Image-Based Lighting) environment maps.
 * This material generates prefiltered mipmap levels for environment map reflections.
 *
 * @param options - Configuration object for the IBL prefilter material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Prefilter IBL Material instance
 */
function createPrefilterIBLMaterial({ additionalName = '', maxInstancesNumber = 1 } = {}): Material {
  const materialName = 'PrefilterIBL' + `_${additionalName}`;

  const materialContent = new CustomMaterialContent({
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
  const material = createMaterial(materialContent, maxInstancesNumber);

  return material;
}

/**
 * Creates a Material Capture (MatCap) material for stylized lighting effects.
 * This material uses a material capture texture to simulate lighting without actual light sources.
 *
 * @param options - Configuration object for the MatCap material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.uri - URI path to the MatCap texture
 * @param options.texture - Pre-loaded MatCap texture
 * @param options.sampler - Texture sampler for the MatCap texture
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured MatCap Material instance
 */
function createMatCapMaterial({
  additionalName = '',
  isSkinning = false,
  uri,
  texture,
  sampler,
  maxInstancesNumber = 10,
}: {
  additionalName?: string;
  isSkinning?: boolean;
  uri?: string;
  texture?: Texture;
  sampler?: Sampler;
  maxInstancesNumber?: Count;
}) {
  const materialName = 'MatCap' + `_${additionalName}`;

  const materialContent = new MatCapMaterialContent(materialName, isSkinning, uri, texture, sampler);
  const material = createMaterial(materialContent, maxInstancesNumber);
  if (isSkinning) {
    material.addShaderDefine('RN_IS_SKINNING');
  }

  return material;
}

/**
 * Creates a material for outputting entity unique identifiers to render targets.
 * This material is used for object picking and selection by rendering entity IDs.
 *
 * @param options - Configuration object for the entity UID output material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Entity UID Output Material instance
 */
function createEntityUIDOutputMaterial({ additionalName = '', maxInstancesNumber = 10 } = {}): Material {
  const materialName = 'EntityUIDOutput' + `_${additionalName}`;

  const materialContent = new EntityUIDOutputMaterialContent(materialName);
  const material = createMaterial(materialContent, maxInstancesNumber);
  material.addShaderDefine('RN_IS_SKINNING');
  return material;
}

/**
 * Creates an MToon 0.x material for VRM character rendering with toon shading.
 * This material implements the MToon 0.x specification for anime/toon-style rendering.
 *
 * @param options - Configuration object for the MToon 0.x material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isMorphing - Enable morph target animation support
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isLighting - Enable lighting calculations
 * @param options.useTangentAttribute - Use tangent attributes for normal mapping
 * @param options.isOutline - Enable outline rendering
 * @param options.materialProperties - MToon material property definitions
 * @param options.textures - Array of textures used by the material
 * @param options.samplers - Array of texture samplers
 * @param options.debugMode - Debug mode settings
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param options.makeOutputSrgb - Whether to convert output to sRGB color space
 * @returns A configured MToon 0.x Material instance
 */
function createMToon0xMaterial({
  additionalName = '',
  isMorphing = false,
  isSkinning = false,
  isLighting = true,
  useTangentAttribute = false,
  isOutline = false,
  materialProperties,
  textures,
  samplers,
  debugMode,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType,
  makeOutputSrgb = true,
}: {
  additionalName?: string;
  isMorphing?: boolean;
  isSkinning?: boolean;
  isLighting?: boolean;
  useTangentAttribute?: boolean;
  isOutline?: boolean;
  materialProperties?: Vrm0xMaterialProperty;
  textures?: any[];
  samplers?: Sampler[];
  debugMode?: any;
  maxInstancesNumber?: Count;
  makeOutputSrgb?: boolean;
}) {
  const materialName = 'MToon0x' + `_${additionalName}_`;

  const definitions = [];
  if (isSkinning) {
    definitions.push('RN_IS_SKINNING');
  }
  if (isMorphing) {
    definitions.push('RN_IS_MORPHING');
  }
  if (isLighting) {
    definitions.push('RN_USE_LIGHTING');
  }
  if (isOutline) {
    definitions.push('RN_USE_OUTLINE');
  }

  const materialContent = new MToon0xMaterialContent(
    isOutline,
    materialProperties,
    textures,
    samplers!,
    isMorphing,
    isSkinning,
    isLighting,
    useTangentAttribute,
    debugMode,
    makeOutputSrgb,
    materialName,
    definitions
  );

  const material = createMaterial(materialContent, maxInstancesNumber);
  materialContent.setMaterialParameters(material, isOutline);

  return material;
}

/**
 * Creates an MToon 1.0 material for VRM 1.0 character rendering with enhanced toon shading.
 * This material implements the MToon 1.0 specification with improved features over 0.x.
 *
 * @param options - Configuration object for the MToon 1.0 material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isMorphing - Enable morph target animation support
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isLighting - Enable lighting calculations
 * @param options.useTangentAttribute - Use tangent attributes for normal mapping
 * @param options.isOutline - Enable outline rendering
 * @param options.materialJson - MToon 1.0 material JSON definition
 * @param options.textures - Array of textures used by the material
 * @param options.samplers - Array of texture samplers
 * @param options.debugMode - Debug mode settings
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param options.makeOutputSrgb - Whether to convert output to sRGB color space
 * @returns A configured MToon 1.0 Material instance
 */
function createMToon1Material({
  additionalName = '',
  isMorphing = false,
  isSkinning = false,
  isLighting = true,
  useTangentAttribute = false,
  isOutline = false,
  materialJson,
  textures,
  samplers,
  debugMode,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType,
  makeOutputSrgb = true,
}: {
  additionalName?: string;
  isMorphing?: boolean;
  isSkinning?: boolean;
  isLighting?: boolean;
  useTangentAttribute?: boolean;
  isOutline?: boolean;
  materialJson: Vrm1_Material;
  textures?: any[];
  samplers?: Sampler[];
  debugMode?: any;
  maxInstancesNumber?: Count;
  makeOutputSrgb?: boolean;
}) {
  const materialName = 'MToon1' + `_${additionalName}_`;

  const definitions = [];
  if (isSkinning) {
    definitions.push('RN_IS_SKINNING');
  }
  if (isMorphing) {
    definitions.push('RN_IS_MORPHING');
  }
  if (isLighting) {
    definitions.push('RN_USE_LIGHTING');
  }
  if (isOutline) {
    definitions.push('RN_USE_OUTLINE');
  }

  const materialContent = new MToon1MaterialContent(
    materialName,
    isMorphing,
    isSkinning,
    isLighting,
    isOutline,
    definitions
  );

  const material = createMaterial(materialContent, maxInstancesNumber);
  materialContent.setMaterialParameters(material, isOutline, materialJson);
  material.setParameter('makeOutputSrgb', Scalar.fromCopyNumber(makeOutputSrgb ? 1.0 : 0.0));
  material.zWriteWhenBlend = materialJson.extensions.VRMC_materials_mtoon.transparentWithZWrite;
  if (materialJson.normalTexture != null) {
    material.addShaderDefine('RN_USE_NORMAL_TEXTURE');
  }
  return material;
}

/**
 * Reuses an existing custom material or recreates it with new shader code.
 * This function optimizes performance by reusing materials when possible while allowing shader updates.
 *
 * @param currentMaterial - The existing material to potentially reuse
 * @param vertexShaderStr - Vertex shader source code string
 * @param pixelShaderStr - Pixel/fragment shader source code string
 * @param options - Configuration object for the custom material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isLighting - Enable lighting calculations
 * @param options.isMorphing - Enable morph target animation support
 * @returns A reused or newly created Custom Material instance
 */
function reuseOrRecreateCustomMaterial(
  currentMaterial: Material,
  vertexShaderStr: string,
  pixelShaderStr: string,
  {
    maxInstancesNumber = Config.maxMaterialInstanceForEachType,
    isSkinning = true,
    isLighting = true,
    isMorphing = true,
  } = {}
) {
  const hash = DataUtil.toCRC32(vertexShaderStr + pixelShaderStr);
  const materialName = 'Custom' + `_${hash}`;

  let additionalShaderSemanticInfo: ShaderSemanticsInfo[] = [];
  if (isMorphing) {
    additionalShaderSemanticInfo = [
      {
        semantic: 'dataTextureMorphOffsetPosition',
        componentType: ComponentType.Int,
        compositionType: CompositionType.ScalarArray,
        arrayLength: Config.maxMorphTargetNumber,
        stage: ShaderType.VertexShader,
        isInternalSetting: true,
        soloDatum: true,
        initialValue: new VectorN(new Int32Array(Config.maxMorphTargetNumber)),
        min: -Number.MAX_VALUE,
        max: Number.MAX_VALUE,
        needUniformInDataTextureMode: true,
      },
      {
        semantic: 'morphWeights',
        componentType: ComponentType.Float,
        compositionType: CompositionType.ScalarArray,
        arrayLength: Config.maxMorphTargetNumber,
        stage: ShaderType.VertexShader,
        isInternalSetting: true,
        soloDatum: true,
        initialValue: new VectorN(new Float32Array(Config.maxMorphTargetNumber)),
        min: -Number.MAX_VALUE,
        max: Number.MAX_VALUE,
        needUniformInDataTextureMode: true,
      },
    ];
  }

  const definitions = [];
  if (isLighting) {
    definitions.push('RN_IS_LIGHTING');
  }
  if (isSkinning) {
    definitions.push('RN_IS_SKINNING');
  }
  if (isMorphing) {
    definitions.push('RN_IS_MORPHING');
  }

  let materialContent: CustomMaterialContent;
  if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
    materialContent = new CustomMaterialContent({
      name: materialName,
      isSkinning,
      isLighting,
      isMorphing,
      vertexShaderWebGpu: {
        code: vertexShaderStr,
        shaderStage: 'vertex',
        isFragmentShader: false,
      },
      pixelShaderWebGpu: {
        code: pixelShaderStr,
        shaderStage: 'fragment',
        isFragmentShader: true,
      },
      additionalShaderSemanticInfo,
      definitions,
    });
  } else {
    materialContent = new CustomMaterialContent({
      name: materialName,
      isSkinning,
      isLighting,
      isMorphing,
      vertexShader: {
        code: vertexShaderStr,
        shaderStage: 'vertex',
        isFragmentShader: false,
      },
      pixelShader: {
        code: pixelShaderStr,
        shaderStage: 'fragment',
        isFragmentShader: true,
      },
      additionalShaderSemanticInfo,
      definitions,
    });
  }

  const material = reuseOrRecreateMaterial(currentMaterial, materialContent, maxInstancesNumber);

  for (const definition of definitions) {
    material.addShaderDefine(definition);
  }

  return material;
}

/**
 * Changes the material assigned to a specific primitive on an entity.
 * This function updates the primitive's material and triggers necessary render state updates.
 *
 * @param entity - The mesh renderer entity containing the primitive
 * @param primitive - The primitive to change the material for
 * @param material - The new material to assign to the primitive
 */
function changeMaterial(entity: IMeshRendererEntityMethods, primitive: Primitive, material: Material) {
  const meshRendererComponent = entity.getMeshRenderer()!;
  primitive.material = material;
  meshRendererComponent.moveStageTo(ProcessStage.Load);
}

export const MaterialHelper = Object.freeze({
  createMaterial,
  recreateMaterial,
  reuseOrRecreateCustomMaterial,
  createClassicUberMaterial,
  createDepthMomentEncodeMaterial,
  createParaboloidDepthMomentEncodeMaterial,
  createFlatMaterial,
  createPbrUberMaterial,
  createEnvConstantMaterial,
  createFXAA3QualityMaterial,
  createDepthEncodeMaterial,
  createShadowMapDecodeClassicSingleMaterial,
  createGammaCorrectionMaterial,
  createToneMappingMaterial,
  createPanoramaToCubeMaterial,
  createPrefilterIBLMaterial,
  createSummedAreaTableMaterial,
  createVarianceShadowMapDecodeClassicSingleMaterial,
  createEntityUIDOutputMaterial,
  createMToon0xMaterial,
  createMToon1Material,
  createFurnaceTestMaterial,
  createGaussianBlurForEncodedDepthMaterial,
  createDetectHighLuminanceMaterial,
  createGaussianBlurMaterial,
  createSynthesizeHDRMaterial,
  createColorGradingUsingLUTsMaterial,
  createMatCapMaterial,
  changeMaterial,
});
