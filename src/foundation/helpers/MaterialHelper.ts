import Material from "../materials/Material";
import PbrShadingMaterialNode from "../materials/PbrShadingMaterialNode";
import ClassicShadingMaterialNode from "../materials/ClassicShadingMaterialNode";

function createPbrUberMaterial() {
  const materialNode = new PbrShadingMaterialNode;
  materialNode.isSingleOperation = true;
  const material = new Material([materialNode]);

  return material;
}

function createClassicUberMaterial() {
  const materialNode = new ClassicShadingMaterialNode;
  materialNode.isSingleOperation = true;
  const material = new Material([materialNode]);

  return material;
}

export default Object.freeze({createPbrUberMaterial, createClassicUberMaterial});
