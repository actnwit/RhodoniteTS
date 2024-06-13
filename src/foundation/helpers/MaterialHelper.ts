import { Config } from '../core/Config';
import { Material } from '../materials/core/Material';
import { RenderPass } from '../renderer/RenderPass';
import type { AbstractMaterialContent } from '../materials/core/AbstractMaterialContent';
import { DepthEncodeMaterialContent } from '../materials/contents/DepthEncodeMaterialContent';
import { ShadowMapDecodeClassicMaterialContent } from '../materials/contents/ShadowMapDecodeClassicMaterialContent';
import { EntityUIDOutputMaterialContent } from '../materials/contents/EntityUIDOutputMaterialContent';
import { MToonMaterialContent } from '../materials/contents/MToonMaterialContent';
import { CustomMaterialContent } from '../materials/contents/CustomMaterialContent';
import { Primitive } from '../geometry/Primitive';
import { ProcessStage } from '../definitions/ProcessStage';
import { AbstractTexture } from '../textures/AbstractTexture';
import { FurnaceTestMaterialContent } from '../materials/contents/FurnaceTestMaterialContent';
import { DetectHighLuminanceMaterialContent } from '../materials/contents/DetectHighLuminanceMaterialContent';
import { SynthesizeHdrMaterialContent as SynthesizeHDRMaterialContent } from '../materials/contents/SynthesizeHdrMaterialContent';
import { ColorGradingUsingLUTsMaterialContent } from '../materials/contents/ColorGradingUsingLUTsMaterialContent';
import { MatCapMaterialContent } from '../materials/contents/MatCapMaterialContent';
import { VarianceShadowMapDecodeClassicMaterialContent } from '../materials/contents/VarianceShadowMapDecodeClassicMaterialContent';
import { Texture } from '../textures/Texture';
import { CameraComponent } from '../components/Camera/CameraComponent';
import { Count } from '../../types/CommonTypes';
import { ShaderityObject } from 'shaderity';
import { ShaderityMaterialContent } from '../materials/contents/ShaderityMaterialContent';
import { IMeshRendererEntityMethods } from '../components/MeshRenderer/IMeshRendererEntity';
import { ShaderSemantics } from '../definitions/ShaderSemantics';
import { ComponentType } from '../definitions/ComponentType';
import { CompositionType } from '../definitions/CompositionType';
import { ShaderType } from '../definitions/ShaderType';
import { VectorN } from '../math/VectorN';
import { ShaderSemanticsInfo } from '../definitions/ShaderSemanticsInfo';
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
import SummedAreaTableShaderVertex from '../../webgl/shaderity_shaders/SummedAreaTableShader/SummedAreaTableShader.vert';
import SummedAreaTableShaderFragment from '../../webgl/shaderity_shaders/SummedAreaTableShader/SummedAreaTableShader.frag';
import FlatSingleShaderVertex from '../../webgl/shaderity_shaders/FlatSingleShader/FlatSingleShader.vert';
import FlatSingleShaderFragment from '../../webgl/shaderity_shaders/FlatSingleShader/FlatSingleShader.frag';
import FlatSingleShaderVertexWebGpu from '../../webgpu/shaderity_shaders/FlatSingleShader/FlatSingleShader.vert';
import FlatSingleShaderFragmentWebGpu from '../../webgpu/shaderity_shaders/FlatSingleShader/FlatSingleShader.frag';
import DepthMomentEncodeShaderVertex from '../../webgl/shaderity_shaders/DepthMomentEncodeShader/DepthMomentEncodeShader.vert';
import DepthMomentEncodeShaderFragment from '../../webgl/shaderity_shaders/DepthMomentEncodeShader/DepthMomentEncodeShader.frag';
import { MaterialRepository } from '../materials/core/MaterialRepository';
import { Vrm0xMaterialProperty } from '../../types';
import { Sampler } from '../textures/Sampler';
import {
  dummyAnisotropyTexture,
  dummyBlackTexture,
  dummyBlueTexture,
  dummyWhiteTexture,
  sheenLutTexture,
} from '../materials/core/DummyTextures';
import GaussianBlurSingleShaderVertex from '../../webgl/shaderity_shaders/GaussianBlurShader/GaussianBlurShader.vert';
import GaussianBlurSingleShaderFragment from '../../webgl/shaderity_shaders/GaussianBlurShader/GaussianBlurShader.frag';
import GaussianBlurSingleShaderVertexWebGpu from '../../webgpu/shaderity_shaders/GaussianBlurShader/GaussianBlurShader.vert';
import GaussianBlurSingleShaderFragmentWebGpu from '../../webgpu/shaderity_shaders/GaussianBlurShader/GaussianBlurShader.frag';
import GaussianBlurForEncodedDepthSingleShaderVertex from '../../webgl/shaderity_shaders/GaussianBlurForEncodedDepthShader/GaussianBlurForEncodedDepthShader.vert';
import GaussianBlurForEncodedDepthSingleShaderFragment from '../../webgl/shaderity_shaders/GaussianBlurForEncodedDepthShader/GaussianBlurForEncodedDepthShader.frag';
import { Scalar } from '../math/Scalar';
import { TextureParameter } from '../definitions';
import { Vector2 } from '../math/Vector2';

function createMaterial(
  materialName: string,
  materialNode: AbstractMaterialContent,
  maxInstancesNumber?: Count
): Material {
  let group = 0;
  let isFull = false;
  do {
    const actualMaterialName = materialName + `__${group}`;
    isFull = MaterialRepository.isFullOrOverOfThisMaterialType(actualMaterialName);
    if (!isFull) {
      MaterialRepository.registerMaterial(actualMaterialName, materialNode, maxInstancesNumber!);
      const material = MaterialRepository.createMaterial(actualMaterialName, materialNode);
      return material;
    }
    group++;
  } while (isFull);

  throw new Error('Failed to create material');
}

type MaterialTypeName = string;
type ChangeCount = number;
let lastChangeCountMap = new Map<MaterialTypeName, ChangeCount>();
function reuseOrRecreateMaterial(
  materialName: string,
  currentMaterial: Material,
  materialNode: AbstractMaterialContent,
  maxInstancesNumber: Count
): Material {
  let material = currentMaterial;
  if (MaterialRepository.isMaterialCompatible(material, materialNode)) {
    material._materialContent = materialNode;
    material.makeShadersInvalidate();
    return material;
  } else {
    let changeCount = 0;
    const lastChangeCount = lastChangeCountMap.get(materialName);
    if (lastChangeCount != null) {
      changeCount = lastChangeCount;
    }
    const actualMaterialName = materialName + `___${changeCount++}`;
    lastChangeCountMap.set(materialName, changeCount);
    MaterialRepository.registerMaterial(actualMaterialName, materialNode, maxInstancesNumber);
    material = MaterialRepository.createMaterial(actualMaterialName, materialNode);
    return material;
  }
}

function recreateMaterial(
  materialName: string,
  materialNode: AbstractMaterialContent,
  maxInstancesNumber?: Count
): Material {
  MaterialRepository.forceRegisterMaterial(materialName, materialNode, maxInstancesNumber!);

  const material = MaterialRepository.createMaterial(materialName, materialNode);
  return material;
}

function createPbrUberMaterial({
  additionalName = '',
  isMorphing = true,
  isSkinning = true,
  isLighting = true,
  isClearCoat = false,
  isTransmission = false,
  isVolume = false,
  isSheen = false,
  isSpecular = false,
  isIridescence = false,
  isAnisotropy = false,
  isShadow = false,
  useTangentAttribute = false,
  useNormalTexture = true,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType,
} = {}) {
  const materialName =
    'PbrUber' +
    `_${additionalName}_` +
    (isMorphing ? '+morphing' : '') +
    (isSkinning ? '+skinning' : '') +
    (isLighting ? '' : '-lighting') +
    (isClearCoat ? '+clearcoat' : '') +
    (isTransmission ? '+transmission' : '') +
    (isVolume ? '+volume' : '') +
    (isSheen ? '+sheen' : '') +
    (isSpecular ? '+specular' : '') +
    (isIridescence ? '+iridescence' : '') +
    (isAnisotropy ? '+anisotropy' : '') +
    (useTangentAttribute ? '+tangentAttribute' : '') +
    (useNormalTexture ? '' : '-normalTexture');

  let additionalShaderSemanticInfo: ShaderSemanticsInfo[] = [];
  if (true) {
    additionalShaderSemanticInfo = [
      {
        semantic: ShaderSemantics.DataTextureMorphOffsetPosition,
        componentType: ComponentType.Int,
        compositionType: CompositionType.ScalarArray,
        arrayLength: Config.maxVertexMorphNumberInShader,
        stage: ShaderType.VertexShader,
        isInternalSetting: true,
        soloDatum: true,
        initialValue: new VectorN(new Int32Array(Config.maxVertexMorphNumberInShader)),
        min: -Number.MAX_VALUE,
        max: Number.MAX_VALUE,
        needUniformInDataTextureMode: true,
      },
      {
        semantic: ShaderSemantics.MorphWeights,
        componentType: ComponentType.Float,
        compositionType: CompositionType.ScalarArray,
        arrayLength: Config.maxVertexMorphNumberInShader,
        stage: ShaderType.VertexShader,
        isInternalSetting: true,
        soloDatum: true,
        initialValue: new VectorN(new Float32Array(Config.maxVertexMorphNumberInShader)),
        min: -Number.MAX_VALUE,
        max: Number.MAX_VALUE,
        needUniformInDataTextureMode: true,
      },
    ];
  }

  const sampler = new Sampler({
    minFilter: TextureParameter.Linear,
    magFilter: TextureParameter.Linear,
    wrapS: TextureParameter.ClampToEdge,
    wrapT: TextureParameter.ClampToEdge,
  });

  let textureSlotIdx = 8;
  if (isClearCoat) {
    additionalShaderSemanticInfo.push({
      semantic: ShaderSemantics.ClearCoatTexture,
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [textureSlotIdx++, dummyWhiteTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: ShaderSemantics.ClearCoatRoughnessTexture,
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [textureSlotIdx++, dummyWhiteTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: ShaderSemantics.ClearCoatNormalTexture,
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [textureSlotIdx++, dummyBlueTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
  }

  if (isTransmission) {
    additionalShaderSemanticInfo.push({
      semantic: ShaderSemantics.TransmissionTexture,
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [textureSlotIdx++, dummyWhiteTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: ShaderSemantics.BackBufferTexture,
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [textureSlotIdx++, dummyBlackTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
  }

  if (isVolume) {
    additionalShaderSemanticInfo.push({
      semantic: ShaderSemantics.ThicknessTexture,
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [textureSlotIdx++, dummyWhiteTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
  }

  if (isSheen) {
    additionalShaderSemanticInfo.push({
      semantic: ShaderSemantics.SheenColorTexture,
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [textureSlotIdx++, dummyWhiteTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: ShaderSemantics.SheenRoughnessTexture,
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [textureSlotIdx++, dummyWhiteTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: ShaderSemantics.SheenLutTexture,
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [textureSlotIdx++, sheenLutTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
  }

  if (isSpecular) {
    additionalShaderSemanticInfo.push({
      semantic: ShaderSemantics.SpecularTexture,
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [textureSlotIdx++, dummyWhiteTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: ShaderSemantics.SpecularColorTexture,
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [textureSlotIdx++, dummyWhiteTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
  }

  if (isIridescence) {
    additionalShaderSemanticInfo.push({
      semantic: ShaderSemantics.IridescenceTexture,
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [textureSlotIdx++, dummyWhiteTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: ShaderSemantics.IridescenceThicknessTexture,
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [textureSlotIdx++, dummyWhiteTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
  }
  if (isAnisotropy) {
    additionalShaderSemanticInfo.push({
      semantic: ShaderSemantics.AnisotropyTexture,
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [textureSlotIdx++, dummyAnisotropyTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
  }

  if (isShadow) {
    additionalShaderSemanticInfo.push({
      semantic: ShaderSemantics.DepthTexture,
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [textureSlotIdx++, dummyWhiteTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
  }

  const materialNode = new CustomMaterialContent({
    name: materialName,
    isSkinning,
    isLighting,
    isMorphing,
    isClearCoat,
    isTransmission,
    isVolume,
    isSheen,
    isSpecular,
    isIridescence,
    isAnisotropy,
    isShadow,
    useTangentAttribute,
    useNormalTexture,
    vertexShader: pbrSingleShaderVertex,
    pixelShader: pbrSingleShaderFragment,
    vertexShaderWebGpu: pbrSingleShaderVertexWebGpu,
    pixelShaderWebGpu: pbrSingleShaderFragmentWebGpu,
    noUseCameraTransform: false,
    additionalShaderSemanticInfo,
  });

  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, materialNode, maxInstancesNumber);

  return material;
}

function createClassicUberMaterial({
  additionalName = '',
  isSkinning = true,
  isLighting = false,
  isMorphing = false,
  isShadow = false,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType,
} = {}) {
  const materialName =
    'ClassicUber' +
    `_${additionalName}_` +
    (isSkinning ? '+skinning' : '') +
    (isLighting ? '' : '-lighting');

  const additionalShaderSemanticInfo = [
    {
      semantic: ShaderSemantics.DataTextureMorphOffsetPosition,
      componentType: ComponentType.Int,
      compositionType: CompositionType.ScalarArray,
      arrayLength: Config.maxVertexMorphNumberInShader,
      stage: ShaderType.VertexShader,
      isInternalSetting: true,
      soloDatum: true,
      initialValue: new VectorN(new Int32Array(Config.maxVertexMorphNumberInShader)),
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      needUniformInDataTextureMode: true,
    },
    {
      semantic: ShaderSemantics.MorphWeights,
      componentType: ComponentType.Float,
      compositionType: CompositionType.ScalarArray,
      arrayLength: Config.maxVertexMorphNumberInShader,
      stage: ShaderType.VertexShader,
      isInternalSetting: true,
      soloDatum: true,
      initialValue: new VectorN(new Float32Array(Config.maxVertexMorphNumberInShader)),
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      needUniformInDataTextureMode: true,
    },
  ];

  const materialNode = new CustomMaterialContent({
    name: 'ClassicUber',
    isSkinning,
    isLighting,
    isMorphing,
    isShadow,
    useTangentAttribute: false,
    useNormalTexture: true,
    vertexShader: ClassicSingleShaderVertex,
    pixelShader: ClassicSingleShaderFragment,
    vertexShaderWebGpu: ClassicSingleShaderVertexWebGpu,
    pixelShaderWebGpu: ClassicSingleShaderFragmentWebgpu,
    noUseCameraTransform: false,
    additionalShaderSemanticInfo,
  });
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, materialNode, maxInstancesNumber);

  return material;
}

function createDepthMomentEncodeMaterial({
  additionalName = '',
  isSkinning = true,
  isMorphing = false,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType,
} = {}) {
  const materialName = 'DepthMomentEncode' + `_${additionalName}_`;

  const additionalShaderSemanticInfo = [
    {
      semantic: ShaderSemantics.DataTextureMorphOffsetPosition,
      componentType: ComponentType.Int,
      compositionType: CompositionType.ScalarArray,
      arrayLength: Config.maxVertexMorphNumberInShader,
      stage: ShaderType.VertexShader,
      isInternalSetting: true,
      soloDatum: true,
      initialValue: new VectorN(new Int32Array(Config.maxVertexMorphNumberInShader)),
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      needUniformInDataTextureMode: true,
    },
    {
      semantic: ShaderSemantics.MorphWeights,
      componentType: ComponentType.Float,
      compositionType: CompositionType.ScalarArray,
      arrayLength: Config.maxVertexMorphNumberInShader,
      stage: ShaderType.VertexShader,
      isInternalSetting: true,
      soloDatum: true,
      initialValue: new VectorN(new Float32Array(Config.maxVertexMorphNumberInShader)),
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      needUniformInDataTextureMode: true,
    },
  ];
  const materialNode = new CustomMaterialContent({
    name: 'DepthMomentEncode',
    isSkinning,
    isLighting: false,
    isMorphing,
    useTangentAttribute: false,
    useNormalTexture: true,
    vertexShader: DepthMomentEncodeShaderVertex,
    pixelShader: DepthMomentEncodeShaderFragment,
    noUseCameraTransform: false,
    additionalShaderSemanticInfo,
  });
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, materialNode, maxInstancesNumber);

  return material;
}

function createFlatMaterial({
  additionalName = '',
  isSkinning = true,
  isMorphing = false,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType,
} = {}) {
  const materialName = 'Flat' + `_${additionalName}_` + (isSkinning ? '+skinning' : '');

  const materialNode = new CustomMaterialContent({
    name: 'Flat',
    isSkinning,
    isLighting: false,
    isMorphing,
    useTangentAttribute: false,
    useNormalTexture: true,
    vertexShader: FlatSingleShaderVertex,
    pixelShader: FlatSingleShaderFragment,
    noUseCameraTransform: false,
    additionalShaderSemanticInfo: [],
    vertexShaderWebGpu: FlatSingleShaderVertexWebGpu,
    pixelShaderWebGpu: FlatSingleShaderFragmentWebGpu,
  });
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, materialNode, maxInstancesNumber);

  return material;
}

function createEnvConstantMaterial({
  additionalName = '',
  maxInstancesNumber = 5,
  makeOutputSrgb = true,
} = {}) {
  const materialName = 'EnvConstant' + `_${additionalName}`;

  const materialNode = new CustomMaterialContent({
    name: materialName,
    isSkinning: false,
    isLighting: false,
    isMorphing: false,
    useTangentAttribute: false,
    useNormalTexture: false,
    vertexShader: EnvConstantSingleShaderVertex,
    pixelShader: EnvConstantSingleShaderFragment,
    vertexShaderWebGpu: EnvConstantSingleShaderVertexWebGpu,
    pixelShaderWebGpu: EnvConstantSingleShaderFragmentWebGpu,
    noUseCameraTransform: false,
    additionalShaderSemanticInfo: [],
  });
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, materialNode, maxInstancesNumber);
  material.setParameter(ShaderSemantics.MakeOutputSrgb, makeOutputSrgb ? 1 : 0);
  return material;
}

function createFXAA3QualityMaterial({
  additionalName = '',
  maxInstancesNumber = 1,
  noUseCameraTransform = false,
} = {}) {
  const materialName = 'FXAA3Quality' + `_${additionalName}`;

  const materialNode = new CustomMaterialContent({
    name: materialName,
    isSkinning: false,
    isLighting: false,
    isMorphing: false,
    useTangentAttribute: false,
    useNormalTexture: true,
    vertexShader: FXAA3QualityShaderVertex,
    pixelShader: FXAA3QualityShaderFragment,
    noUseCameraTransform,
    additionalShaderSemanticInfo: [],
  });
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, materialNode, maxInstancesNumber);

  return material;
}

function createFurnaceTestMaterial({ additionalName = '', maxInstancesNumber = 1 } = {}) {
  const materialName = 'FurnaceTest' + `_${additionalName}`;

  const materialNode = new FurnaceTestMaterialContent();
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, materialNode, maxInstancesNumber);

  return material;
}

function createDepthEncodeMaterial({
  additionalName = '',
  isSkinning = false,
  depthPow = 1.0,
  maxInstancesNumber = 10,
} = {}) {
  const materialName = 'DepthEncode' + `_${additionalName}_` + (isSkinning ? '+skinning' : '');

  const materialNode = new DepthEncodeMaterialContent(depthPow, {
    isSkinning,
  });
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, materialNode, maxInstancesNumber);

  return material;
}

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
  const materialName =
    'ShadowMapDecodeClassic' +
    `_${additionalName}_` +
    (isSkinning ? '+skinning' : '') +
    (isLighting ? '' : '-lighting');

  const materialNode = new ShadowMapDecodeClassicMaterialContent(
    {
      isMorphing,
      isSkinning,
      isLighting,
      isDebugging,
      colorAttachmentsNumber,
    },
    depthEncodeRenderPass
  );
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, materialNode, maxInstancesNumber);

  return material;
}

function createGaussianBlurForEncodedDepthMaterial({
  additionalName = '',
  maxInstancesNumber = 10,
  noUseCameraTransform = false,
} = {}) {
  const materialName = 'GaussianBlurForEncodedDepth' + `_${additionalName}`;

  const additionalShaderSemanticInfo: ShaderSemanticsInfo[] = [];
  const gaussianRatio = new Float32Array(30);
  additionalShaderSemanticInfo.push(
    {
      semantic: ShaderSemantics.IsHorizontal,
      componentType: ComponentType.Bool,
      compositionType: CompositionType.Scalar,
      stage: ShaderType.PixelShader,
      initialValue: Scalar.fromCopyNumber(1), //true
      min: 0,
      max: 1,
    },
    {
      semantic: ShaderSemantics.GaussianRatio,
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
      semantic: ShaderSemantics.GaussianKernelSize,
      componentType: ComponentType.Int,
      compositionType: CompositionType.Scalar,
      stage: ShaderType.PixelShader,
      initialValue: Scalar.fromCopyNumber(1),
      min: 1,
      max: 30,
    },
    {
      semantic: ShaderSemantics.FramebufferSize,
      componentType: ComponentType.Float,
      compositionType: CompositionType.Vec2,
      stage: ShaderType.PixelShader,
      initialValue: Vector2.fromCopy2(1, 1),
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
    },
    {
      semantic: ShaderSemantics.BaseColorTexture,
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [0, dummyBlackTexture],
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
    }
  );

  const materialNode = new CustomMaterialContent({
    name: materialName,
    isSkinning: false,
    isLighting: false,
    isMorphing: false,
    isClearCoat: false,
    isTransmission: false,
    isVolume: false,
    isSheen: false,
    isSpecular: false,
    isIridescence: false,
    isShadow: false,
    useTangentAttribute: false,
    useNormalTexture: false,
    vertexShader: GaussianBlurForEncodedDepthSingleShaderVertex,
    pixelShader: GaussianBlurForEncodedDepthSingleShaderFragment,
    noUseCameraTransform,
    additionalShaderSemanticInfo,
  });

  materialNode.isSingleOperation = true;

  const material = createMaterial(materialName, materialNode, maxInstancesNumber);

  return material;
}

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
  const materialName =
    'VarianceShadowMapDecodeShading' +
    `_${additionalName}_` +
    (isMorphing ? '+morphing' : '') +
    (isSkinning ? '+skinning' : '') +
    (isLighting ? '' : '-lighting') +
    (isDebugging ? '' : '+debugging');

  const materialNode = new VarianceShadowMapDecodeClassicMaterialContent(
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
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, materialNode, maxInstancesNumber);
  return material;
}

function createDetectHighLuminanceMaterial(
  { additionalName = '', maxInstancesNumber = 5 } = {},
  textureToDetectHighLuminance: AbstractTexture
) {
  const materialName = 'DetectHighLuminance' + `_${additionalName}_`;
  const materialNode = new DetectHighLuminanceMaterialContent(textureToDetectHighLuminance);
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, materialNode, maxInstancesNumber);
  return material;
}

function createGaussianBlurMaterial({
  additionalName = '',
  maxInstancesNumber = 10,
  noUseCameraTransform = false,
} = {}) {
  const materialName = 'GaussianBlur' + `_${additionalName}`;

  const additionalShaderSemanticInfo: ShaderSemanticsInfo[] = [];
  const gaussianRatio = new Float32Array(30);
  additionalShaderSemanticInfo.push(
    {
      semantic: ShaderSemantics.IsHorizontal,
      componentType: ComponentType.Bool,
      compositionType: CompositionType.Scalar,
      stage: ShaderType.PixelShader,
      initialValue: Scalar.fromCopyNumber(1), //true
      min: 0,
      max: 1,
    },
    {
      semantic: ShaderSemantics.GaussianRatio,
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
      semantic: ShaderSemantics.GaussianKernelSize,
      componentType: ComponentType.Int,
      compositionType: CompositionType.Scalar,
      stage: ShaderType.PixelShader,
      initialValue: Scalar.fromCopyNumber(1),
      min: 1,
      max: 30,
    },
    {
      semantic: ShaderSemantics.FramebufferSize,
      componentType: ComponentType.Float,
      compositionType: CompositionType.Vec2,
      stage: ShaderType.PixelShader,
      initialValue: Vector2.fromCopy2(1, 1),
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
    },
    {
      semantic: ShaderSemantics.BaseColorTexture,
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [0, dummyBlackTexture],
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
    }
  );

  const materialNode = new CustomMaterialContent({
    name: materialName,
    isSkinning: false,
    isLighting: false,
    isMorphing: false,
    isClearCoat: false,
    isTransmission: false,
    isVolume: false,
    isSheen: false,
    isSpecular: false,
    isIridescence: false,
    isShadow: false,
    useTangentAttribute: false,
    useNormalTexture: false,
    vertexShader: GaussianBlurSingleShaderVertex,
    pixelShader: GaussianBlurSingleShaderFragment,
    vertexShaderWebGpu: GaussianBlurSingleShaderVertexWebGpu,
    pixelShaderWebGpu: GaussianBlurSingleShaderFragmentWebGpu,
    noUseCameraTransform,
    additionalShaderSemanticInfo,
  });
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, materialNode, maxInstancesNumber);

  return material;
}

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

  const materialNode = new SynthesizeHDRMaterialContent(synthesizeTextures);
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, materialNode, maxInstancesNumber);

  return material;
}

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

  const materialNode = new ColorGradingUsingLUTsMaterialContent(
    targetRenderPass,
    colorAttachmentsNumber,
    uri,
    texture
  );
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, materialNode, maxInstancesNumber);

  return material;
}

function createGammaCorrectionMaterial({
  additionalName = '',
  maxInstancesNumber = 1,
  noUseCameraTransform = false,
} = {}) {
  const materialName = 'GammaCorrection' + `_${additionalName}`;

  const materialNode = new CustomMaterialContent({
    name: materialName,
    isSkinning: false,
    isLighting: false,
    isMorphing: false,
    useTangentAttribute: false,
    useNormalTexture: true,
    vertexShader: GammaCorrectionShaderVertex,
    pixelShader: GammaCorrectionShaderFragment,
    vertexShaderWebGpu: GammaCorrectionShaderVertexWebGpu,
    pixelShaderWebGpu: GammaCorrectionShaderFragmentWebGpu,
    noUseCameraTransform: noUseCameraTransform,
    additionalShaderSemanticInfo: [],
  });
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, materialNode, maxInstancesNumber);

  return material;
}

function createSummedAreaTableMaterial({
  additionalName = '',
  maxInstancesNumber = 1,
  noUseCameraTransform = false,
} = {}) {
  const materialName = 'SummedAreaTable' + `_${additionalName}`;

  const materialNode = new CustomMaterialContent({
    name: materialName,
    isSkinning: false,
    isLighting: false,
    isMorphing: false,
    useTangentAttribute: false,
    useNormalTexture: true,
    vertexShader: SummedAreaTableShaderVertex,
    pixelShader: SummedAreaTableShaderFragment,
    noUseCameraTransform: noUseCameraTransform,
    additionalShaderSemanticInfo: [],
  });
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, materialNode, maxInstancesNumber);

  return material;
}

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
  const materialName = 'MatCap' + `_${additionalName}` + (isSkinning ? '+skinning' : '');

  const materialNode = new MatCapMaterialContent(isSkinning, uri, texture, sampler);
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, materialNode, maxInstancesNumber);

  return material;
}

function createEntityUIDOutputMaterial({ additionalName = '', maxInstancesNumber = 10 } = {}) {
  const materialName = 'EntityUIDOutput' + `_${additionalName}`;

  const materialNode = new EntityUIDOutputMaterialContent();
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, materialNode, maxInstancesNumber);

  return material;
}

function createMToonMaterial({
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
  const materialName =
    'MToon' +
    `_${additionalName}_` +
    (isMorphing ? '+morphing' : '') +
    (isSkinning ? '+skinning' : '') +
    (isLighting ? '' : '-lighting') +
    (useTangentAttribute ? '+tangentAttribute' : '') +
    (isOutline ? '-outline' : '');

  const materialNode = new MToonMaterialContent(
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
    materialName
  );

  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, materialNode, maxInstancesNumber);
  materialNode.setMaterialParameters(material, isOutline);

  return material;
}

function reuseOrRecreateCustomMaterial(
  currentMaterial: Material,
  vertexShaderStr: string,
  pixelShaderStr: string,
  {
    additionalName = '',
    isSkinning = true,
    isLighting = false,
    isMorphing = false,
    maxInstancesNumber = Config.maxMaterialInstanceForEachType,
  } = {}
) {
  const materialName =
    'Custom' +
    `_${additionalName}_` +
    (isMorphing ? '+morphing' : '') +
    (isSkinning ? '+skinning' : '') +
    (isLighting ? '' : '-lighting');

  const materialNode = new CustomMaterialContent({
    name: materialName,
    isSkinning,
    isLighting,
    isMorphing,
    useTangentAttribute: false,
    useNormalTexture: true,
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
    noUseCameraTransform: false,
    additionalShaderSemanticInfo: [],
  });
  materialNode.isSingleOperation = true;
  const material = reuseOrRecreateMaterial(
    materialName,
    currentMaterial,
    materialNode,
    maxInstancesNumber
  );

  return material;
}

// create or update shaderity material
function recreateShaderityMaterial(
  vertexShaderityObj: ShaderityObject,
  pixelShaderityObj: ShaderityObject,
  { additionalName = '', maxInstancesNumber = Config.maxMaterialInstanceForEachType } = {}
) {
  const name = `Shaderity_${additionalName}`;

  const materialNode = new ShaderityMaterialContent({
    name,
    vertexShaderityObj,
    pixelShaderityObj,
  });

  materialNode.isSingleOperation = true;
  const material = recreateMaterial(name, materialNode, maxInstancesNumber);

  return material;
}

function changeMaterial(
  entity: IMeshRendererEntityMethods,
  primitive: Primitive,
  material: Material
) {
  const meshRendererComponent = entity.getMeshRenderer()!;
  primitive.material = material;
  meshRendererComponent.moveStageTo(ProcessStage.Load);
}

export const MaterialHelper = Object.freeze({
  createMaterial,
  recreateMaterial,
  reuseOrRecreateCustomMaterial,
  recreateShaderityMaterial,
  createClassicUberMaterial,
  createDepthMomentEncodeMaterial,
  createFlatMaterial,
  createPbrUberMaterial,
  createEnvConstantMaterial,
  createFXAA3QualityMaterial,
  createDepthEncodeMaterial,
  createShadowMapDecodeClassicSingleMaterial,
  createGammaCorrectionMaterial,
  createSummedAreaTableMaterial,
  createVarianceShadowMapDecodeClassicSingleMaterial,
  createEntityUIDOutputMaterial,
  createMToonMaterial,
  createFurnaceTestMaterial,
  createGaussianBlurForEncodedDepthMaterial,
  createDetectHighLuminanceMaterial,
  createGaussianBlurMaterial,
  createSynthesizeHDRMaterial,
  createColorGradingUsingLUTsMaterial,
  createMatCapMaterial,
  changeMaterial,
});
