import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import ViewMatrixShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/ViewMatrix.vert';
import ViewMatrixShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/ViewMatrix.vert.wgsl';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

export class ViewMatrixShaderNode extends AbstractShaderNode {
  constructor() {
    super('viewMatrix', {
      codeGLSL: ViewMatrixShaderityObjectGLSL.code,
      codeWGSL: ViewMatrixShaderityObjectWGSL.code,
    });

    this.setShaderStage('Vertex');

    this.__outputs.push({
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      name: 'outValue',
    });
  }
}
