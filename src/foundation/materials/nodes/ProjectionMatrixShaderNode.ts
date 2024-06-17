import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import ProjectionMatrixShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/ProjectionMatrix.vert';
import ProjectionMatrixShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/ProjectionMatrix.vert.wgsl';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

export class ProjectionMatrixShaderNode extends AbstractShaderNode {
  constructor() {
    super('projectionMatrix', {
      codeGLSL: ProjectionMatrixShaderityObjectGLSL.code,
      codeWGSL: ProjectionMatrixShaderityObjectWGSL.code,
    });

    this.setShaderStage('Vertex');

    this.__outputs.push({
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      name: 'outValue',
    });
  }
}
