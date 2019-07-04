import Material from "../materials/Material";
import PbrShadingMaterialNode from "../materials/PbrShadingMaterialNode";
import ClassicShadingSingleMaterialNode from "../materials/ClassicShadingSingleMaterialNode";
import EnvConstantSingleMaterialNode from "../materials/EnvConstantSingleMaterial";
import FXAA3QualitySingleMaterialNode from "../materials/FXAA3QualitySingleMaterialNode";
import DepthEncodingSingleMaterialNode from "../materials/DepthEncodingSingleMaterial";
import ShadowMapping32bitSingleMaterial from "../materials/ShadowMapping32bitSingleMaterial";
import RenderPass from "../renderer/RenderPass";
import GammaCorrectionSingleMaterialNode from "../materials/GammaCorrectionSingleMaterialNode";
import AbstractMaterialNode from "../materials/AbstractMaterialNode";

function findOrCreateMaterial(materialName: string, materialNodes?: AbstractMaterialNode[], maxInstancesNumber?: number): Material {
  const material = Material.createMaterial(materialName, materialNodes);
  if (material) {
    return material;
  }

  Material.registerMaterial(materialName, materialNodes!, maxInstancesNumber!);

  return Material.createMaterial(materialName, materialNodes)!;
}

function createPbrUberMaterial(maxInstancesNumber?: number) {
  const materialNode = new PbrShadingMaterialNode();
  materialNode.isSingleOperation = true;
  const material = findOrCreateMaterial('PbrUber', [materialNode], maxInstancesNumber);

  return material;
}

function createClassicUberMaterial(maxInstancesNumber?: number) {
  const materialNode = new ClassicShadingSingleMaterialNode();
  materialNode.isSingleOperation = true;
  const material = findOrCreateMaterial('ClassicUber', [materialNode], maxInstancesNumber);

  return material;
}

function createEnvConstantMaterial(maxInstancesNumber?: number) {
  const materialNode = new EnvConstantSingleMaterialNode();
  materialNode.isSingleOperation = true;
  const material = findOrCreateMaterial('EnvConstant', [materialNode], (maxInstancesNumber != null) ? maxInstancesNumber : 10);

  return material;
}

function createFXAA3QualityMaterial(maxInstancesNumber?: number) {
  const materialNode = new FXAA3QualitySingleMaterialNode();
  materialNode.isSingleOperation = true;
  const material = findOrCreateMaterial('FXAA3Quality', [materialNode], (maxInstancesNumber != null) ? maxInstancesNumber : 10);

  return material;
}

function createDepthEncodingMaterial(maxInstancesNumber?: number) {
  const materialNode = new DepthEncodingSingleMaterialNode();
  materialNode.isSingleOperation = true;
  const material = findOrCreateMaterial('DepthEncodeing', [materialNode], (maxInstancesNumber != null) ? maxInstancesNumber : 20);

  return material;
}

function createShadowMapping32bitMaterial(renderPass: RenderPass, maxInstancesNumber?: number) {
  const materialNode = new ShadowMapping32bitSingleMaterial(renderPass);
  materialNode.isSingleOperation = true;
  const material = findOrCreateMaterial('ShadowMapping32bit', [materialNode], (maxInstancesNumber != null) ? maxInstancesNumber : 20);
  return material;
}

function createGammaCorrectionMaterial(maxInstancesNumber?: number) {
  const materialNode = new GammaCorrectionSingleMaterialNode();
  materialNode.isSingleOperation = true;
  const material = findOrCreateMaterial('GammaCorrection', [materialNode], (maxInstancesNumber != null) ? maxInstancesNumber : 10);

  return material;
}

export default Object.freeze({
  createPbrUberMaterial, createClassicUberMaterial, createEnvConstantMaterial,
  createFXAA3QualityMaterial, createDepthEncodingMaterial, createShadowMapping32bitMaterial,
  createGammaCorrectionMaterial
});
