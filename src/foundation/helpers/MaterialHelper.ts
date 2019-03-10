import Material from "../materials/Material";
import PbrShadingMaterialNode from "../materials/PbrShadingMaterialNode";
import ClassicShadingMaterialNode from "../materials/ClassicShadingMaterialNode";

function createPbrUberMaterial() {
  const material = new Material([new PbrShadingMaterialNode]);

  return material;
}

function createClassicUberMaterial() {
  const material = new Material([new ClassicShadingMaterialNode]);

  return material;
}

export default Object.freeze({createPbrUberMaterial, createClassicUberMaterial});
