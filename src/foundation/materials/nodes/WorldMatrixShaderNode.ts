import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import WorldMatrixShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/WorldMatrix.vert';
import WorldMatrixShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/WorldMatrix.vert.wgsl';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

export class WorldMatrixShaderNode extends AbstractShaderNode {
  constructor() {
    super('worldMatrix', {
      codeGLSL: WorldMatrixShaderityObjectGLSL.code,
      codeWGSL: WorldMatrixShaderityObjectWGSL.code,
    });

    this.setShaderStage('Vertex');

    this.__outputs.push({
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      name: 'outValue',
    });
  }
}
