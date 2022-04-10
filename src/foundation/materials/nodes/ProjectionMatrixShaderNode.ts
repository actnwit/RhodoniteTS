import {CompositionType} from '../../definitions/CompositionType';
import {ComponentType} from '../../definitions/ComponentType';
import ProjectionMatrixShaderityObject from '../../../webgl/shaderity_shaders/nodes/ProjectionMatrix.vert';
import AbstractShaderNode from '../core/AbstractShaderNode';

export class ProjectionMatrixShaderNode extends AbstractShaderNode {
  constructor() {
    super('projectionMatrix', ProjectionMatrixShaderityObject.code);

    this.__outputs.push({
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      name: 'outValue',
    });
  }
}
