import Material from "../materials/Material";
import PbrShadingMaterialNode from "../materials/PbrShadingMaterialNode";

function createPbrUberMaterial() {
  const material = new Material([new PbrShadingMaterialNode]);

  return material;
}

export default Object.freeze({createPbrUberMaterial});
