import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import AttributeNormalShaderityObject from '../../../webgl/shaderity_shaders/nodes/AttributeColor.vert';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

export class AttributeColorShaderNode extends AbstractShaderNode {
  constructor() {
    super('attributeColor', {
      codeGLSL: AttributeNormalShaderityObject.code,
    });

    this.setShaderStage('Vertex');

    this.__outputs.push({
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'outValue',
    });
  }
}
