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
