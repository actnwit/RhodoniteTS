import { ProcessApproach } from '../definitions/ProcessApproach';
import { Primitive } from '../geometry';
import { Mesh } from '../geometry/Mesh';
import { Material } from '../materials/core/Material';
import { Is } from '../misc/Is';
import { SystemState } from '../system/SystemState';

export function isSkipDrawing(material: Material, primitive: Primitive) {
  if (material.getShaderProgramUid(primitive) === -1) {
    return true;
  } else {
    return false;
  }
}

export function updateVBOAndVAO(mesh: Mesh) {
  const primitiveNum = mesh.getPrimitiveNumber();
  for (let i = 0; i < primitiveNum; i++) {
    const primitive = mesh.getPrimitiveAt(i);
    if (Is.exist(primitive.vertexHandles)) {
      primitive.update3DAPIVertexData();
    } else {
      primitive.create3DAPIVertexData();
    }
  }
  mesh.updateVariationVBO();

  if (SystemState.currentProcessApproach !== ProcessApproach.WebGPU) {
    mesh.updateVAO();
  }
}
