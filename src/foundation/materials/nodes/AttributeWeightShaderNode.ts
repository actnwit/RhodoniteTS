import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import AttributeWeightShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/AttributeWeight.vert.glsl';
import AttributeWeightShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/AttributeWeight.vert.wgsl';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

export class AttributeWeightShaderNode extends AbstractShaderNode {
  constructor() {
    super('attributeWeight', {
      codeGLSL: AttributeWeightShaderityObjectGLSL.code,
      codeWGSL: AttributeWeightShaderityObjectWGSL.code,
    });

    this.setShaderStage('Vertex');

    this.__outputs.push({
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'outValue',
    });
  }
}


