import Material from "../materials/Material";
import PbrShadingMaterialNode from "../materials/PbrShadingMaterialNode";
import ClassicShadingSingleMaterialNode from "../materials/ClassicShadingSingleMaterialNode";
import EnvConstantSingleMaterialNode from "../materials/EnvConstantSingleMaterial";

function createPbrUberMaterial() {
  const materialNode = new PbrShadingMaterialNode;
  materialNode.isSingleOperation = true;
  const material = new Material([materialNode]);

  return material;
}

function createClassicUberMaterial() {
  const materialNode = new ClassicShadingSingleMaterialNode;
  materialNode.isSingleOperation = true;
  const material = new Material([materialNode]);

  return material;
}

function createEnvConstantMaterial() {
  const materialNode = new EnvConstantSingleMaterialNode;
  materialNode.isSingleOperation = true;
  const material = new Material([materialNode]);

  return material;
}

export default Object.freeze({createPbrUberMaterial, createClassicUberMaterial, createEnvConstantMaterial});
