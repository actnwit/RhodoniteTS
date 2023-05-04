import { MeshComponent } from '../components/Mesh/MeshComponent';
import { Material } from '../materials/core/Material';
import { CGAPIResourceRepository } from './CGAPIResourceRepository';

export function isSkipDrawing(material: Material) {
  if (material.isEmptyMaterial() || material._shaderProgramUid === -1) {
    return true;
  } else {
    return false;
  }
}

export function isMaterialsSetup(meshComponent: MeshComponent) {
  if (meshComponent.mesh!._variationVBOUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
    const primitiveNum = meshComponent.mesh!.getPrimitiveNumber();
    let count = 0;
    for (let i = 0; i < primitiveNum; i++) {
      const primitive = meshComponent.mesh!.getPrimitiveAt(i);
      if (primitive.material._shaderProgramUid !== -1) {
        count++;
      }
    }

    if (primitiveNum === count) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}
