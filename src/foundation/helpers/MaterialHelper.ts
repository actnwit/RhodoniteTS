import {Config} from '../core/Config';
import { Material } from '../materials/core/Material';
import { RenderPass } from '../renderer/RenderPass';
import { AbstractMaterialNode } from '../materials/core/AbstractMaterialNode';
import { PbrShadingSingleMaterialNode } from '../materials/singles/PbrShadingSingleMaterialNode';
import { ClassicShadingSingleMaterialNode } from '../materials/singles/ClassicShadingSingleMaterialNode';
import { EnvConstantSingleMaterialNode } from '../materials/singles/EnvConstantSingleMaterialNode';
import { FXAA3QualitySingleMaterialNode } from '../materials/singles/FXAA3QualitySingleMaterialNode';
import { DepthEncodeSingleMaterialNode } from '../materials/singles/DepthEncodeSingleMaterialNode';
import { ShadowMapDecodeClassicSingleMaterialNode } from '../materials/singles/ShadowMapDecodeClassicSingleMaterialNode';
import { GammaCorrectionSingleMaterialNode } from '../materials/singles/GammaCorrectionSingleMaterialNode';
import { EntityUIDOutputSingleMaterialNode } from '../materials/singles/EntityUIDOutputSingleMaterialNode';
import { MToonSingleMaterialNode } from '../materials/singles/MToonSingleMaterialNode';
import ClassicSingleShaderVertex from '../../webgl/shaderity_shaders/ClassicSingleShader/ClassicSingleShader.vert';
import ClassicSingleShaderFragment from '../../webgl/shaderity_shaders/ClassicSingleShader/ClassicSingleShader.frag';
import { CustomSingleMaterialNode } from '../materials/singles/CustomSingleMaterialNode';
import {Primitive} from '../geometry/Primitive';
import { Entity } from '../core/Entity';
import {ProcessStage} from '../definitions/ProcessStage';
import {AlphaMode} from '../definitions/AlphaMode';
import { AbstractTexture } from '../textures/AbstractTexture';
import { FurnaceTestSingleMaterialNode } from '../materials/singles/FurnaceTestSingleMaterialNode';
import { GaussianBlurForEncodedDepthSingleMaterialNode as GaussianBlurForEncodedDepthSingleMaterialNode } from '../materials/singles/GaussianBlurForEncodedDepthSingleMaterialNode';
import { GaussianBlurSingleMaterialNode as GaussianBlurSingleMaterialNode } from '../materials/singles/GaussianBlurSingleMaterialNode';
import { DetectHighLuminanceSingleMaterialNode } from '../materials/singles/DetectHighLuminanceSingleMaterialNode';
import { SynthesizeHDRMaterialNode as SynthesizeHDRSingleMaterialNode } from '../materials/singles/SynthesizeHDRSingleMaterialNode';
import { ColorGradingUsingLUTsSingleMaterialNode } from '../materials/singles/ColorGradingUsingLUTsSingleMaterialNode';
import { MatCapSingleMaterialNode } from '../materials/singles/MatCapSingleMaterialNode';
import { VarianceShadowMapDecodeClassicSingleMaterialNode } from '../materials/singles/VarianceShadowMapDecodeClassicSingleMaterialNode';
import { SkinPbrShadingSingleMaterialNode } from '../materials/singles/SkinPbrShadingSingleMaterialNode';
import { PbrExtendedShadingSingleMaterialNode } from '../materials/singles/PbrExtendedShadingSingleMaterialNode';
import { Texture } from '../textures/Texture';
import { CameraComponent } from '../components/Camera/CameraComponent';
import {Count} from '../../types/CommonTypes';
import {ShaderityObject} from 'shaderity';
import { ShaderitySingleMaterialNode } from '../materials/singles/ShaderitySingleMaterialNode';
import {IMeshRendererEntityMethods} from '../components/MeshRenderer/IMeshRendererEntity';
import {Is} from '../misc/Is';

function createMaterial(
  materialName: string,
  materialNode?: AbstractMaterialNode,
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
  materialNode?: AbstractMaterialNode,
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

function createPbrUberMaterial({
  additionalName = '',
  isMorphing = true,
  isSkinning = true,
  isLighting = true,
  useTangentAttribute = false,
  useNormalTexture = true,
  alphaMode = AlphaMode.Opaque,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType,
  makeOutputSrgb = true,
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

  const materialNode = new PbrShadingSingleMaterialNode({
    isMorphing,
    isSkinning,
    isLighting,
    useTangentAttribute,
    useNormalTexture,
    alphaMode,
    makeOutputSrgb,
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

  const materialNode = new SkinPbrShadingSingleMaterialNode({
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

function createClassicUberMaterialOld({
  additionalName = '',
  isSkinning = true,
  isLighting = true,
  alphaMode = AlphaMode.Opaque,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType,
} = {}) {
  const materialName =
    'ClassicUberOld' +
    `_${additionalName}_` +
    (isSkinning ? '+skinning' : '') +
    (isLighting ? '' : '-lighting');

  const materialNode = new ClassicShadingSingleMaterialNode({
    isSkinning,
    isLighting,
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

  const materialNode = new CustomSingleMaterialNode({
    name: 'ClassicUber',
    isSkinning,
    isLighting,
    isMorphing,
    alphaMode,
    vertexShader: ClassicSingleShaderVertex,
    pixelShader: ClassicSingleShaderFragment,
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

  const materialNode = new EnvConstantSingleMaterialNode(makeOutputSrgb);
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

  const materialNode = new FXAA3QualitySingleMaterialNode();
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

  const materialNode = new FurnaceTestSingleMaterialNode();
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

  const materialNode = new DepthEncodeSingleMaterialNode(depthPow, {
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

  const materialNode = new ShadowMapDecodeClassicSingleMaterialNode(
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

  const materialNode = new GaussianBlurForEncodedDepthSingleMaterialNode();
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

  const materialNode = new VarianceShadowMapDecodeClassicSingleMaterialNode(
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
  const materialNode = new DetectHighLuminanceSingleMaterialNode(
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

  const materialNode = new GaussianBlurSingleMaterialNode();
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

  const materialNode = new SynthesizeHDRSingleMaterialNode(
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

  const materialNode = new ColorGradingUsingLUTsSingleMaterialNode(
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

  const materialNode = new GammaCorrectionSingleMaterialNode();
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

  const materialNode = new MatCapSingleMaterialNode(isSkinning, uri, texture);
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

  const materialNode = new EntityUIDOutputSingleMaterialNode();
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

  const materialNode = new MToonSingleMaterialNode(
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

  const materialNode = new PbrExtendedShadingSingleMaterialNode({
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

  const materialNode = new CustomSingleMaterialNode({
    name: materialName,
    isSkinning,
    isLighting,
    isMorphing,
    alphaMode,
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

  const materialNode = new ShaderitySingleMaterialNode({
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
