import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import AttributeTexcoordShaderityObject from '../../../webgl/shaderity_shaders/nodes/AttributeTexcoord.vert';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

export class AttributeTexcoordShaderNode extends AbstractShaderNode {
  constructor() {
    super('attributeTexcoord', {
      codeGLSL: AttributeTexcoordShaderityObject.code,
    });

    this.setShaderStage('Vertex');

    this.__outputs.push({
      compositionType: CompositionType.Vec3,
      componentType: ComponentType.Float,
      name: 'outValue',
    });
  }
}
