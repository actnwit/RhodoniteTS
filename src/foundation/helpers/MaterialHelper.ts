import Config from "../core/Config";
import Material from "../materials/Material";
import RenderPass from "../renderer/RenderPass";
import AbstractMaterialNode from "../materials/AbstractMaterialNode";
import PbrShadingMaterialNode from "../materials/PbrShadingMaterialNode";
import ClassicShadingSingleMaterialNode from "../materials/ClassicShadingSingleMaterialNode";
import EnvConstantSingleMaterialNode from "../materials/EnvConstantSingleMaterialNode";
import FXAA3QualitySingleMaterialNode from "../materials/FXAA3QualitySingleMaterialNode";
import DepthEncodeSingleMaterialNode from "../materials/DepthEncodeSingleMaterialNode";
import ShadowMapDecodeClassicSingleMaterialNode from "../materials/ShadowMapDecodeClassicSingleMaterialNode";
import GammaCorrectionSingleMaterialNode from "../materials/GammaCorrectionSingleMaterialNode";
import EntityUIDOutputSingleMaterialNode from "../materials/EntityUIDOutputSingleMaterialNode";
import MToonSingleMaterialNode from "../materials/MToonSingleMaterialNode";

function createMaterial(materialName: string, materialNodes?: AbstractMaterialNode[], maxInstancesNumber?: number): Material {
  const isRegistMaterialType = Material.isRegistedMaterialType(materialName);

  if (!isRegistMaterialType) {
    Material.registerMaterial(materialName, materialNodes!, maxInstancesNumber!);
  }

  const material = Material.createMaterial(materialName, materialNodes);
  return material;
}

function createPbrUberMaterial({ isMorphing, isSkinning, isLighting, additionalName, maxInstancesNumber }: { isMorphing: boolean, isSkinning: boolean, isLighting: boolean, additionalName?: string, maxInstancesNumber?: number }) {
  const materialName = 'PbrUber' + `_${additionalName}_`
    + (isMorphing ? '+morphing' : '')
    + (isSkinning ? '+skinning' : '')
    + (isLighting ? '' : '-lighting');

  const materialNode = new PbrShadingMaterialNode({ isMorphing, isSkinning, isLighting });

  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, [materialNode], maxInstancesNumber);

  return material;
}

function createClassicUberMaterial({ isSkinning, isLighting, additionalName, maxInstancesNumber }: { isSkinning: boolean, isLighting: boolean, additionalName?: string, maxInstancesNumber?: number }) {
  const materialName = 'ClassicUber' + `_${additionalName}_`
    + (isSkinning ? '+skinning' : '')
    + (isLighting ? '' : '-lighting');

  const materialNode = new ClassicShadingSingleMaterialNode({ isSkinning: isSkinning, isLighting: isLighting });
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, [materialNode], maxInstancesNumber);

  return material;
}

function createEnvConstantMaterial(maxInstancesNumber?: number) {
  const materialNode = new EnvConstantSingleMaterialNode();
  materialNode.isSingleOperation = true;
  const material = createMaterial('EnvConstant', [materialNode], (maxInstancesNumber != null) ? maxInstancesNumber : 10);

  return material;
}

function createFXAA3QualityMaterial(maxInstancesNumber?: number) {
  const materialNode = new FXAA3QualitySingleMaterialNode();
  materialNode.isSingleOperation = true;
  const material = createMaterial('FXAA3Quality', [materialNode], (maxInstancesNumber != null) ? maxInstancesNumber : 10);

  return material;
}

function createDepthEncodeMaterial({ isSkinning = false, maxInstancesNumber = 20 } = {}) {
  const materialName = 'DepthEncode'
    + (isSkinning ? '+skinning' : '');

  const materialNode = new DepthEncodeSingleMaterialNode({ isSkinning: isSkinning });
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, [materialNode], maxInstancesNumber);

  return material;
}

function createShadowMapDecodeClassicSingleMaterial(depthEncodeRenderPass: RenderPass, { isMorphing = false, isSkinning = false, isLighting = true, colorAttachmentsNumber = 0, maxInstancesNumber = 20 } = {}) {
  const materialName = 'ShadowMapDecodeClassic'
    + (isSkinning ? '+skinning' : '')
    + (isLighting ? '' : '-lighting');

  const materialNode = new ShadowMapDecodeClassicSingleMaterialNode(depthEncodeRenderPass, { isMorphing: isMorphing, isSkinning: isSkinning, isLighting: isLighting, colorAttachmentsNumber: colorAttachmentsNumber });
  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, [materialNode], maxInstancesNumber);

  return material;
}

function createGammaCorrectionMaterial(maxInstancesNumber?: number) {
  const materialNode = new GammaCorrectionSingleMaterialNode();
  materialNode.isSingleOperation = true;
  const material = createMaterial('GammaCorrection', [materialNode], (maxInstancesNumber != null) ? maxInstancesNumber : 10);

  return material;
}

function createEntityUIDOutputMaterial(maxInstancesNumber?: number) {
  const materialNode = new EntityUIDOutputSingleMaterialNode();
  materialNode.isSingleOperation = true;
  const material = createMaterial('EntityUIDOutput', [materialNode], (maxInstancesNumber != null) ? maxInstancesNumber : 10);

  return material;
}

function createMToonMaterial({
  additionalName = '', isMorphing = false, isSkinning = false, isLighting = false,
  isOutline = false, materialPropertiesArray = undefined, textures = undefined,
  maxInstancesNumber = Config.maxMaterialInstanceForEachType
} = {}) {

  const materialName = 'MToon' + `_${additionalName}_`
    + (isMorphing ? '+morphing' : '')
    + (isSkinning ? '+skinning' : '')
    + (isLighting ? '' : '-lighting')
    + (isOutline ? '' : '-outline');

  const materialNode = new MToonSingleMaterialNode(isOutline, materialPropertiesArray, textures, isMorphing, isSkinning, isLighting);

  materialNode.isSingleOperation = true;
  const material = createMaterial(materialName, [materialNode], maxInstancesNumber);
  materialNode.setMaterialParameters(material, isOutline);

  return material;
}


export default Object.freeze({
  createPbrUberMaterial, createClassicUberMaterial, createEnvConstantMaterial, createFXAA3QualityMaterial, createDepthEncodeMaterial,
  createShadowMapDecodeClassicSingleMaterial, createGammaCorrectionMaterial, createEntityUIDOutputMaterial, createMToonMaterial,
});
