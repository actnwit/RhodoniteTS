import { Material } from '../materials/core/Material';

export function isSkipDrawing(material: Material) {
  if (material.isEmptyMaterial() || material._shaderProgramUid === -1) {
    return true;
  } else {
    return false;
  }
}
