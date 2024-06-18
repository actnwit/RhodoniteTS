import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import NormalMatrixShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/NormalMatrix.vert';
import NormalMatrixShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/NormalMatrix.vert.wgsl';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

export class NormalMatrixShaderNode extends AbstractShaderNode {
  constructor() {
    super('normalMatrix', {
      codeGLSL: NormalMatrixShaderityObjectGLSL.code,
      codeWGSL: NormalMatrixShaderityObjectWGSL.code,
    });

    this.setShaderStage('Vertex');

    this.__outputs.push({
      compositionType: CompositionType.Mat3,
      componentType: ComponentType.Float,
      name: 'outValue',
    });
  }
}
