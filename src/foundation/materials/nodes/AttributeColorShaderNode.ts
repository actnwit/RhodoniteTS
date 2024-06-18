import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import AttributeNormalShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/AttributeColor.vert';
import AttributeNormalShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/AttributeColor.vert.wgsl';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

export class AttributeColorShaderNode extends AbstractShaderNode {
  constructor() {
    super('attributeColor', {
      codeGLSL: AttributeNormalShaderityObjectGLSL.code,
      codeWGSL: AttributeNormalShaderityObjectWGSL.code,
    });

    this.setShaderStage('Vertex');

    this.__outputs.push({
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'outValue',
    });
  }
}
