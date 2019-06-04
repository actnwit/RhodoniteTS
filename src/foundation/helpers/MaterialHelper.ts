import Material from "../materials/Material";
import PbrShadingMaterialNode from "../materials/PbrShadingMaterialNode";
import ClassicShadingSingleMaterialNode from "../materials/ClassicShadingSingleMaterialNode";
import EnvConstantSingleMaterialNode from "../materials/EnvConstantSingleMaterial";
import FXAA3QualitySingleMaterialNode from "../materials/FXAA3QualitySingleMaterialNode";
import DepthEncodingSingleMaterialNode from "../materials/DepthEncodingSingleMaterial";
import ShadowMapping32bitSingleMaterial from "../materials/ShadowMapping32bitSingleMaterial";
import RenderPass from "../renderer/RenderPass";

function createPbrUberMaterial() {
  const materialNode = new PbrShadingMaterialNode();
  materialNode.isSingleOperation = true;
  const material = new Material([materialNode]);

  return material;
}

function createClassicUberMaterial() {
  const materialNode = new ClassicShadingSingleMaterialNode();
  materialNode.isSingleOperation = true;
  const material = new Material([materialNode]);

  return material;
}

function createEnvConstantMaterial() {
  const materialNode = new EnvConstantSingleMaterialNode();
  materialNode.isSingleOperation = true;
  const material = new Material([materialNode]);

  return material;
}

function createFXAA3QualityMaterial() {
  const materialNode = new FXAA3QualitySingleMaterialNode();
  materialNode.isSingleOperation = true;
  const material = new Material([materialNode]);

  return material;
}

function createDepthEncodingMaterial() {
  const materialNode = new DepthEncodingSingleMaterialNode();
  materialNode.isSingleOperation = true;
  const material = new Material([materialNode]);

  return material;
}

function createShadowMapping32bitMaterial(renderPass: RenderPass) {
  const materialNode = new ShadowMapping32bitSingleMaterial(renderPass);
  materialNode.isSingleOperation = true;
  const material = new Material([materialNode]);
  return material;
}

export default Object.freeze({
  createPbrUberMaterial, createClassicUberMaterial, createEnvConstantMaterial,
  createFXAA3QualityMaterial, createDepthEncodingMaterial, createShadowMapping32bitMaterial
});
