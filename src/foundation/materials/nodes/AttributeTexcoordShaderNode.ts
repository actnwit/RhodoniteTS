import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import AttributeNormalShaderityObject from '../../../webgl/shaderity_shaders/nodes/AttributeTexcoord.vert';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

export class AttributeTexcoordShaderNode extends AbstractShaderNode {
  constructor() {
    super('attributeTexcoord', AttributeNormalShaderityObject.code);

    this.setShaderStage('Vertex');

    this.__outputs.push({
      compositionType: CompositionType.Vec3,
      componentType: ComponentType.Float,
      name: 'outValue',
    });
  }
}
