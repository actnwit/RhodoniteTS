import Config from "../core/Config";
import Material from "../materials/core/Material";
import RenderPass from "../renderer/RenderPass";
import AbstractMaterialNode from "../materials/core/AbstractMaterialNode";
import PbrShadingSingleMaterialNode from "../materials/singles/PbrShadingSingleMaterialNode";
import ClassicShadingSingleMaterialNode from "../materials/singles/ClassicShadingSingleMaterialNode";
import EnvConstantSingleMaterialNode from "../materials/singles/EnvConstantSingleMaterialNode";
import FXAA3QualitySingleMaterialNode from "../materials/singles/FXAA3QualitySingleMaterialNode";
import DepthEncodeSingleMaterialNode from "../materials/singles/DepthEncodeSingleMaterialNode";
import ShadowMapDecodeClassicSingleMaterialNode from "../materials/singles/ShadowMapDecodeClassicSingleMaterialNode";
import GammaCorrectionSingleMaterialNode from "../materials/singles/GammaCorrectionSingleMaterialNode";
import EntityUIDOutputSingleMaterialNode from "../materials/singles/EntityUIDOutputSingleMaterialNode";
import MToonSingleMaterialNode from "../materials/singles/MToonSingleMaterialNode";
import classicSingleShaderVertex from "../../webgl/shaderity_shaders/classicSingleShader/classicSingleShader.vert";
import classicSingleShaderFragment from "../../webgl/shaderity_shaders/classicSingleShader/classicSingleShader.frag";
import CustomSingleMaterialNode from "../materials/singles/CustomSingleMaterialNode";
import Primitive from "../geometry/Primitive";
import Entity from "../core/Entity";
import { ProcessStage } from "../definitions/ProcessStage";
import { AlphaMode } from "../definitions/AlphaMode";

function createMaterial(materialName: string, materialNodes?: AbstractMaterialNode[], maxInstancesNumber?: number): Material {
  const isRegistMaterialType = Material.isRegisteredMaterialType(materialName);

  if (!isRegistMaterialType) {
    Material.registerMaterial(materialName, materialNodes!, maxInstancesNumber!);
  }

  const material = Material.createMaterial(materialName, materialNodes);
  return material;
}

function recreateMaterial(materialName: string, materialNodes?: AbstractMaterialNode[], maxInstancesNumber?: number): Material {

  Material.forceRegisterMaterial(materialName, materialNodes!, maxInstancesNumber!);

  const material = Material.createMaterial(materialName, materialNodes);
  return material;
}

function createEmptyMaterial() {
  const materialName = 'Empty';
  const material = createMaterial(materialName, [], Config.maxMaterialInstanceForEachType);
  material.tryToSetUniqueName('EmptyMaterial', true);
  return material;
}

function createPbrUberMaterial({
  additionalName = '', isMorphing = false, isSkinning = false, isLighting = false, alphaMode = AlphaMode.Opaque,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType
} = {}) {
  const materialName = 'PbrUber'
    + `_${additionalName}_`
    + (isMorphing ? '+morphing' : '')
    + (isSkinning ? '+skinning' : '')
    + (isLighting ? '' : '-lighting')
    + ' alpha_' + alphaMode.str.toLowerCase();

  const materialNode = new PbrShadingSingleMaterialNode({ isMorphing: isMorphing, isSkinning: isSkinning, isLighting: isLighting, alphaMode });

  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, [materialNode], maxInstancesNumber);

  return material;
}

function createClassicUberMaterialOld({
  additionalName = '', isSkinning = false, isLighting = false, alphaMode = AlphaMode.Opaque,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType
} = {}) {
  const materialName = 'ClassicUberOld'
    + `_${additionalName}_`
    + (isSkinning ? '+skinning' : '')
    + (isLighting ? '' : '-lighting');

  const materialNode = new ClassicShadingSingleMaterialNode({ isSkinning: isSkinning, isLighting: isLighting, alphaMode });
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, [materialNode], maxInstancesNumber);

  return material;
}

function createClassicUberMaterial({
  additionalName = '', isSkinning = true, isLighting = false, isMorphing = false, alphaMode = AlphaMode.Opaque,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType
} = {}) {
  const materialName = 'ClassicUber'
    + `_${additionalName}_`
    + (isSkinning ? '+skinning' : '')
    + (isLighting ? '' : '-lighting')
    + ' alpha_' + alphaMode.str.toLowerCase();

  const materialNode = new CustomSingleMaterialNode({
    name: 'ClassicUber', isSkinning: isSkinning, isLighting: isLighting, isMorphing: isMorphing, alphaMode,
    vertexShader: classicSingleShaderVertex,
    pixelShader: classicSingleShaderFragment
  });
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, [materialNode], maxInstancesNumber);

  return material;
}

function createEnvConstantMaterial({ additionalName = '', maxInstancesNumber = 10 } = {}) {
  const materialName = 'EnvConstant' + `_${additionalName}`;

  const materialNode = new EnvConstantSingleMaterialNode();
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, [materialNode], maxInstancesNumber);

  return material;
}

function createFXAA3QualityMaterial({ additionalName = '', maxInstancesNumber = 1 } = {}) {
  const materialName = 'FXAA3Quality' + `_${additionalName}`;

  const materialNode = new FXAA3QualitySingleMaterialNode();
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, [materialNode], maxInstancesNumber);

  return material;
}

function createDepthEncodeMaterial({ additionalName = '', isSkinning = false, maxInstancesNumber = 10 } = {}) {
  const materialName = 'DepthEncode'
    + `_${additionalName}_`
    + (isSkinning ? '+skinning' : '');

  const materialNode = new DepthEncodeSingleMaterialNode({ isSkinning: isSkinning });
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, [materialNode], maxInstancesNumber);

  return material;
}

function createShadowMapDecodeClassicSingleMaterial({
  additionalName = '', isMorphing = false, isSkinning = false, isLighting = true, isDebugging = false,
  colorAttachmentsNumber = 0, maxInstancesNumber = 20 } = {},
  depthEncodeRenderPass: RenderPass
) {
  const materialName = 'ShadowMapDecodeClassic'
    + `_${additionalName}_`
    + (isSkinning ? '+skinning' : '')
    + (isLighting ? '' : '-lighting');

  const materialNode = new ShadowMapDecodeClassicSingleMaterialNode({
    isMorphing, isSkinning, isLighting, isDebugging, colorAttachmentsNumber
  }, depthEncodeRenderPass);
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, [materialNode], maxInstancesNumber);

  return material;
}

function createGammaCorrectionMaterial({ additionalName = '', maxInstancesNumber = 1 } = {}) {
  const materialName = 'GammaCorrection' + `_${additionalName}`;

  const materialNode = new GammaCorrectionSingleMaterialNode();
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, [materialNode], maxInstancesNumber);

  return material;
}

function createEntityUIDOutputMaterial({ additionalName = '', maxInstancesNumber = 10 } = {}) {
  const materialName = 'EntityUIDOutput' + `_${additionalName}`;

  const materialNode = new EntityUIDOutputSingleMaterialNode();
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, [materialNode], maxInstancesNumber);

  return material;
}

function createMToonMaterial({
  additionalName = '', isMorphing = false, isSkinning = false, isLighting = true,
  isOutline = false, materialProperties = undefined, textures = undefined, debugMode = undefined,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType
} = {}) {
  const materialName = 'MToon'
    + `_${additionalName}_`
    + (isMorphing ? '+morphing' : '')
    + (isSkinning ? '+skinning' : '')
    + (isLighting ? '-lighting' : '')
    + (isOutline ? '-outline' : '');

  const materialNode = new MToonSingleMaterialNode(isOutline, materialProperties, textures, isMorphing, isSkinning, isLighting, debugMode);

  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, [materialNode], maxInstancesNumber);
  materialNode.setMaterialParameters(material, isOutline);

  return material;
}

function recreateCustomMaterial(vertexShaderStr: string, pixelShaderStr: string, {
  additionalName = '', isSkinning = true, isLighting = false, isMorphing = false, alphaMode = AlphaMode.Opaque,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType
} = {}) {
  const materialName = 'Custom'
    + `_${additionalName}_`
    + (isMorphing ? '+morphing' : '')
    + (isSkinning ? '+skinning' : '')
    + (isLighting ? '' : '-lighting')
    + ' alpha_' + alphaMode.str.toLowerCase();

  const materialNode = new CustomSingleMaterialNode({
    name: materialName, isSkinning: isSkinning, isLighting: isLighting, isMorphing: isMorphing, alphaMode,
    vertexShader: { code: vertexShaderStr, shaderStage: 'vertex' },
    pixelShader: { code: pixelShaderStr, shaderStage: 'fragment' }
  }
  );
  materialNode.isSingleOperation = true;
  const material = recreateMaterial(materialName, [materialNode], maxInstancesNumber);

  return material;
}

function changeMaterial(entity: Entity, primitive: Primitive, material: Material) {
  const meshRendererComponent = entity.getMeshRenderer();
  primitive.material = material;
  meshRendererComponent.moveStageTo(ProcessStage.Load);
}

export default Object.freeze({
  createMaterial, recreateMaterial, recreateCustomMaterial,
  createEmptyMaterial, createClassicUberMaterial, createPbrUberMaterial, createEnvConstantMaterial, createFXAA3QualityMaterial, createDepthEncodeMaterial,
  createShadowMapDecodeClassicSingleMaterial, createGammaCorrectionMaterial, createEntityUIDOutputMaterial, createMToonMaterial, changeMaterial
});
