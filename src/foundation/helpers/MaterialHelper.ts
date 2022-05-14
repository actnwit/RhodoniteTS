import {Config} from '../core/Config';
import {Material} from '../materials/core/Material';
import {RenderPass} from '../renderer/RenderPass';
import {AbstractMaterialContent} from '../materials/core/AbstractMaterialContent';
import {PbrShadingMaterialContent} from '../materials/contents/PbrShadingMaterialContent';
import {EnvConstantMaterialContent} from '../materials/contents/EnvConstantMaterialContent';
import {FXAA3QualityMaterialContent} from '../materials/contents/FXAA3QualityMaterialContent';
import {DepthEncodeMaterialContent} from '../materials/contents/DepthEncodeMaterialContent';
import {ShadowMapDecodeClassicMaterialContent} from '../materials/contents/ShadowMapDecodeClassicMaterialContent';
import {GammaCorrectionMaterialContent} from '../materials/contents/GammaCorrectionMaterialContent';
import {EntityUIDOutputMaterialContent} from '../materials/contents/EntityUIDOutputMaterialContent';
import {MToonMaterialContent} from '../materials/contents/MToonMaterialContent';
import ClassicSingleShaderVertex from '../../webgl/shaderity_shaders/ClassicSingleShader/ClassicSingleShader.vert';
import ClassicSingleShaderFragment from '../../webgl/shaderity_shaders/ClassicSingleShader/ClassicSingleShader.frag';
import pbrSingleShaderVertex from '../../webgl/shaderity_shaders/PbrSingleShader/PbrSingleShader.vert';
import pbrSingleShaderFragment from '../../webgl/shaderity_shaders/PbrSingleShader/PbrSingleShader.frag';
import {CustomMaterialContent} from '../materials/contents/CustomMaterialContent';
import {Primitive} from '../geometry/Primitive';
import {ProcessStage} from '../definitions/ProcessStage';
import {AlphaMode} from '../definitions/AlphaMode';
import {AbstractTexture} from '../textures/AbstractTexture';
import {FurnaceTestMaterialContent} from '../materials/contents/FurnaceTestMaterialContent';
import {GaussianBlurForEncodedDepthMaterialContent as GaussianBlurForEncodedDepthMaterialContent} from '../materials/contents/GaussianBlurForEncodedDepthMaterialContent';
import {GaussianBlurMaterialContent as GaussianBlurMaterialContent} from '../materials/contents/GaussianBlurMaterialContent';
import {DetectHighLuminanceMaterialContent} from '../materials/contents/DetectHighLuminanceMaterialContent';
import {SynthesizeHdrMaterialContent as SynthesizeHDRMaterialContent} from '../materials/contents/SynthesizeHdrMaterialContent';
import {ColorGradingUsingLUTsMaterialContent} from '../materials/contents/ColorGradingUsingLUTsMaterialContent';
import {MatCapMaterialContent} from '../materials/contents/MatCapMaterialContent';
import {VarianceShadowMapDecodeClassicMaterialContent} from '../materials/contents/VarianceShadowMapDecodeClassicMaterialContent';
import {SkinPbrShadingMaterialContent} from '../materials/contents/SkinPbrShadingMaterialContent';
import {PbrExtendedShadingMaterialContent} from '../materials/contents/PbrExtendedShadingMaterialContent';
import {Texture} from '../textures/Texture';
import {CameraComponent} from '../components/Camera/CameraComponent';
import {Count} from '../../types/CommonTypes';
import {ShaderityObject} from 'shaderity';
import {ShaderityMaterialContent} from '../materials/contents/ShaderityMaterialContent';
import {IMeshRendererEntityMethods} from '../components/MeshRenderer/IMeshRendererEntity';
import { ShaderSemantics, ShaderSemanticsInfo } from '../definitions/ShaderSemantics';
import { ComponentType } from '../definitions/ComponentType';
import { CompositionType } from '../definitions/CompositionType';
import { ShaderType } from '../definitions/ShaderType';
import { VectorN } from '../math/VectorN';

function createMaterial(
  materialName: string,
  materialNode?: AbstractMaterialContent,
  maxInstancesNumber?: Count
): Material {
  const isRegisteredMaterialType =
    Material.isRegisteredMaterialType(materialName);

  if (!isRegisteredMaterialType) {
    Material.registerMaterial(materialName, materialNode, maxInstancesNumber!);
  }

  const material = Material.createMaterial(materialName, materialNode);
  return material;
}

function recreateMaterial(
  materialName: string,
  materialNode?: AbstractMaterialContent,
  maxInstancesNumber?: Count
): Material {
  Material.forceRegisterMaterial(
    materialName,
    materialNode!,
    maxInstancesNumber!
  );

  const material = Material.createMaterial(materialName, materialNode);
  return material;
}

function createEmptyMaterial() {
  const materialName = 'Empty';
  const material = createMaterial(
    materialName,
    undefined,
    Config.maxMaterialInstanceForEachType
  );
  material.tryToSetUniqueName('EmptyMaterial', true);
  return material;
}

function createPbrUberMaterialOld({
  additionalName = '',
  isMorphing = true,
  isSkinning = true,
  isLighting = true,
  useTangentAttribute = false,
  useNormalTexture = true,
  alphaMode = AlphaMode.Opaque,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType,
} = {}) {
  const materialName =
    'PbrUber' +
    `_${additionalName}_` +
    (isMorphing ? '+morphing' : '') +
    (isSkinning ? '+skinning' : '') +
    (isLighting ? '' : '-lighting') +
    (useTangentAttribute ? '+tangentAttribute' : '') +
    (useNormalTexture ? '' : '-normalTexture') +
    '_alpha_' +
    alphaMode.str.toLowerCase();

  const materialNode = new PbrShadingMaterialContent({
    isMorphing,
    isSkinning,
    isLighting,
    useTangentAttribute,
    useNormalTexture,
    alphaMode,
  });

  materialNode.isSingleOperation = true;
  const material = createMaterial(
    materialName,
    materialNode,
    maxInstancesNumber
  );

  return material;
}

function createPbrUberMaterial({
  additionalName = '',
  isMorphing = true,
  isSkinning = true,
  isLighting = true,
  useTangentAttribute = false,
  useNormalTexture = true,
  alphaMode = AlphaMode.Opaque,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType,
} = {}) {
  const materialName =
    'PbrUber' +
    `_${additionalName}_` +
    (isMorphing ? '+morphing' : '') +
    (isSkinning ? '+skinning' : '') +
    (isLighting ? '' : '-lighting') +
    (useTangentAttribute ? '+tangentAttribute' : '') +
    (useNormalTexture ? '' : '-normalTexture') +
    '_alpha_' +
    alphaMode.str.toLowerCase();

  let additionalShaderSemanticInfo: ShaderSemanticsInfo[] = [];
  if (isMorphing) {
    additionalShaderSemanticInfo = [
      {
        semantic: ShaderSemantics.DataTextureMorphOffsetPosition,
        componentType: ComponentType.Int,
        compositionType: CompositionType.ScalarArray,
        arrayLength: Config.maxVertexMorphNumberInShader,
        stage: ShaderType.VertexShader,
        isCustomSetting: true,
        soloDatum: true,
        initialValue: new VectorN(
          new Int32Array(Config.maxVertexMorphNumberInShader)
        ),
        min: -Number.MAX_VALUE,
        max: Number.MAX_VALUE,
        needUniformInFastest: true,
      },
      {
        semantic: ShaderSemantics.MorphWeights,
        componentType: ComponentType.Float,
        compositionType: CompositionType.ScalarArray,
        arrayLength: Config.maxVertexMorphNumberInShader,
        stage: ShaderType.VertexShader,
        isCustomSetting: true,
        soloDatum: true,
        initialValue: new VectorN(
          new Float32Array(Config.maxVertexMorphNumberInShader)
        ),
        min: -Number.MAX_VALUE,
        max: Number.MAX_VALUE,
        needUniformInFastest: true,
      },
    ];
  }

  const materialNode = new CustomMaterialContent({
    name: 'PbrUber',
    isSkinning,
    isLighting,
    isMorphing,
    alphaMode,
    useTangentAttribute,
    useNormalTexture,
    vertexShader: pbrSingleShaderVertex,
    pixelShader: pbrSingleShaderFragment,
    additionalShaderSemanticInfo,
  });

  materialNode.isSingleOperation = true;
  const material = createMaterial(
    materialName,
    materialNode,
    maxInstancesNumber
  );

  return material;
}

function createSkinPbrUberMaterial({
  additionalName = '',
  isMorphing = false,
  isSkinning = false,
  isLighting = false,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType,
} = {}) {
  const materialName =
    'PbrUber' +
    `_${additionalName}_` +
    (isMorphing ? '+morphing' : '') +
    (isSkinning ? '+skinning' : '') +
    (isLighting ? '' : '-lighting');

  const materialNode = new SkinPbrShadingMaterialContent({
    isMorphing: isMorphing,
    isSkinning: isSkinning,
    isLighting: isLighting,
  });

  materialNode.isSingleOperation = true;
  const material = createMaterial(
    materialName,
    materialNode,
    maxInstancesNumber
  );

  return material;
}

function createClassicUberMaterial({
  additionalName = '',
  isSkinning = true,
  isLighting = false,
  isMorphing = false,
  alphaMode = AlphaMode.Opaque,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType,
} = {}) {
  const materialName =
    'ClassicUber' +
    `_${additionalName}_` +
    (isSkinning ? '+skinning' : '') +
    (isLighting ? '' : '-lighting') +
    ' alpha_' +
    alphaMode.str.toLowerCase();

  const materialNode = new CustomMaterialContent({
    name: 'ClassicUber',
    isSkinning,
    isLighting,
    isMorphing,
    alphaMode,
    useTangentAttribute: false,
    useNormalTexture: true,
    vertexShader: ClassicSingleShaderVertex,
    pixelShader: ClassicSingleShaderFragment,
    additionalShaderSemanticInfo: [],
  });
  materialNode.isSingleOperation = true;
  const material = createMaterial(
    materialName,
    materialNode,
    maxInstancesNumber
  );

  return material;
}

function createEnvConstantMaterial({
  additionalName = '',
  maxInstancesNumber = 5,
  makeOutputSrgb = true,
} = {}) {
  const materialName = 'EnvConstant' + `_${additionalName}`;

  const materialNode = new EnvConstantMaterialContent(makeOutputSrgb);
  materialNode.isSingleOperation = true;
  const material = createMaterial(
    materialName,
    materialNode,
    maxInstancesNumber
  );

  return material;
}

function createFXAA3QualityMaterial({
  additionalName = '',
  maxInstancesNumber = 1,
} = {}) {
  const materialName = 'FXAA3Quality' + `_${additionalName}`;

  const materialNode = new FXAA3QualityMaterialContent();
  materialNode.isSingleOperation = true;
  const material = createMaterial(
    materialName,
    materialNode,
    maxInstancesNumber
  );

  return material;
}

function createFurnaceTestMaterial({
  additionalName = '',
  maxInstancesNumber = 1,
} = {}) {
  const materialName = 'FurnaceTest' + `_${additionalName}`;

  const materialNode = new FurnaceTestMaterialContent();
  materialNode.isSingleOperation = true;
  const material = createMaterial(
    materialName,
    materialNode,
    maxInstancesNumber
  );

  return material;
}

function createDepthEncodeMaterial({
  additionalName = '',
  isSkinning = false,
  depthPow = 1.0,
  maxInstancesNumber = 10,
} = {}) {
  const materialName =
    'DepthEncode' + `_${additionalName}_` + (isSkinning ? '+skinning' : '');

  const materialNode = new DepthEncodeMaterialContent(depthPow, {
    isSkinning,
  });
  materialNode.isSingleOperation = true;
  const material = createMaterial(
    materialName,
    materialNode,
    maxInstancesNumber
  );

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
  const material = createMaterial(
    materialName,
    materialNode,
    maxInstancesNumber
  );

  return material;
}

function createGaussianBlurForEncodedDepthMaterial({
  additionalName = '',
  maxInstancesNumber = 10,
} = {}) {
  const materialName = 'GaussianBlurForEncodedDepth' + `_${additionalName}`;

  const materialNode = new GaussianBlurForEncodedDepthMaterialContent();
  materialNode.isSingleOperation = true;

  const material = createMaterial(
    materialName,
    materialNode,
    maxInstancesNumber
  );

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
  const material = createMaterial(
    materialName,
    materialNode,
    maxInstancesNumber
  );
  return material;
}

function createDetectHighLuminanceMaterial(
  {
    additionalName = '',
    colorAttachmentsNumber = 0,
    maxInstancesNumber = 5,
  } = {},
  HDRRenderPass: RenderPass
) {
  const materialName = 'DetectHighLuminance' + `_${additionalName}_`;
  const materialNode = new DetectHighLuminanceMaterialContent(
    HDRRenderPass,
    colorAttachmentsNumber
  );
  materialNode.isSingleOperation = true;
  const material = createMaterial(
    materialName,
    materialNode,
    maxInstancesNumber
  );
  return material;
}

function createGaussianBlurMaterial({
  additionalName = '',
  maxInstancesNumber = 10,
} = {}) {
  const materialName = 'GaussianBlur' + `_${additionalName}`;

  const materialNode = new GaussianBlurMaterialContent();
  materialNode.isSingleOperation = true;
  const material = createMaterial(
    materialName,
    materialNode,
    maxInstancesNumber
  );

  return material;
}

function createSynthesizeHDRMaterial(
  {
    additionalName = '',
    targetRegionTexture,
    maxInstancesNumber = 1,
  }: {
    additionalName?: string;
    targetRegionTexture?: AbstractTexture;
    maxInstancesNumber?: Count;
  },
  synthesizeTextures: AbstractTexture[]
) {
  const materialName = 'SynthesizeHDR' + `_${additionalName}`;

  const materialNode = new SynthesizeHDRMaterialContent(
    synthesizeTextures,
    targetRegionTexture!
  );
  materialNode.isSingleOperation = true;
  const material = createMaterial(
    materialName,
    materialNode,
    maxInstancesNumber
  );

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
  const material = createMaterial(
    materialName,
    materialNode,
    maxInstancesNumber
  );

  return material;
}

function createGammaCorrectionMaterial({
  additionalName = '',
  maxInstancesNumber = 1,
} = {}) {
  const materialName = 'GammaCorrection' + `_${additionalName}`;

  const materialNode = new GammaCorrectionMaterialContent();
  materialNode.isSingleOperation = true;
  const material = createMaterial(
    materialName,
    materialNode,
    maxInstancesNumber
  );

  return material;
}

function createMatCapMaterial({
  additionalName = '',
  isSkinning = false,
  uri,
  texture,
  maxInstancesNumber = 10,
}: {
  additionalName?: string;
  isSkinning?: boolean;
  uri?: string;
  texture?: Texture;
  maxInstancesNumber?: Count;
}) {
  const materialName =
    'MatCap' + `_${additionalName}` + (isSkinning ? '+skinning' : '');

  const materialNode = new MatCapMaterialContent(isSkinning, uri, texture);
  materialNode.isSingleOperation = true;
  const material = createMaterial(
    materialName,
    materialNode,
    maxInstancesNumber
  );

  return material;
}

function createEntityUIDOutputMaterial({
  additionalName = '',
  maxInstancesNumber = 10,
} = {}) {
  const materialName = 'EntityUIDOutput' + `_${additionalName}`;

  const materialNode = new EntityUIDOutputMaterialContent();
  materialNode.isSingleOperation = true;
  const material = createMaterial(
    materialName,
    materialNode,
    maxInstancesNumber
  );

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
  materialProperties?: any[];
  textures?: any[];
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
    isMorphing,
    isSkinning,
    isLighting,
    useTangentAttribute,
    debugMode,
    makeOutputSrgb
  );

  materialNode.isSingleOperation = true;
  const material = createMaterial(
    materialName,
    materialNode,
    maxInstancesNumber
  );
  materialNode.setMaterialParameters(material, isOutline);

  return material;
}

function createPbrExtendedUberMaterial(maxInstancesNumber?: Count) {
  const enables = {isMorphing: false, isSkinning: false, isLighting: true};
  const materialName =
    'PbrExtendedShadingUber' +
    (enables.isMorphing ? '+morphing' : '') +
    (enables.isSkinning ? '+skinning' : '') +
    (enables.isLighting ? '' : '-lighting');

  const materialNode = new PbrExtendedShadingMaterialContent({
    isMorphing: enables.isMorphing,
    isSkinning: enables.isSkinning,
    isLighting: enables.isLighting,
  });
  materialNode.isSingleOperation = true;
  const material = createMaterial(
    materialName,
    materialNode,
    maxInstancesNumber
  );

  return material;
}

function recreateCustomMaterial(
  vertexShaderStr: string,
  pixelShaderStr: string,
  {
    additionalName = '',
    isSkinning = true,
    isLighting = false,
    isMorphing = false,
    alphaMode = AlphaMode.Opaque,
    maxInstancesNumber = Config.maxMaterialInstanceForEachType,
  } = {}
) {
  const materialName =
    'Custom' +
    `_${additionalName}_` +
    (isMorphing ? '+morphing' : '') +
    (isSkinning ? '+skinning' : '') +
    (isLighting ? '' : '-lighting') +
    ' alpha_' +
    alphaMode.str.toLowerCase();

  const materialNode = new CustomMaterialContent({
    name: materialName,
    isSkinning,
    isLighting,
    isMorphing,
    alphaMode,
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
    additionalShaderSemanticInfo: [],
  });
  materialNode.isSingleOperation = true;
  const material = recreateMaterial(
    materialName,
    materialNode,
    maxInstancesNumber
  );

  return material;
}

// create or update shaderity material
function recreateShaderityMaterial(
  vertexShaderityObj: ShaderityObject,
  pixelShaderityObj: ShaderityObject,
  {
    additionalName = '',
    maxInstancesNumber = Config.maxMaterialInstanceForEachType,
  } = {}
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
  recreateCustomMaterial,
  recreateShaderityMaterial,
  createEmptyMaterial,
  createClassicUberMaterial,
  createPbrUberMaterial,
  createSkinPbrUberMaterial,
  createEnvConstantMaterial,
  createFXAA3QualityMaterial,
  createDepthEncodeMaterial,
  createShadowMapDecodeClassicSingleMaterial,
  createGammaCorrectionMaterial,
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
  createPbrExtendedUberMaterial,
  changeMaterial,
});
