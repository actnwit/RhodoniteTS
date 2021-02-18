import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import AttributePositionShaderityObject from '../../../webgl/shaderity_shaders/nodes/AttributePosition.vert'
import AbstractShaderNode from '../core/AbstractShaderNode';

export default class AttributePositionShaderNode extends AbstractShaderNode {

  constructor() {
    super('attributePosition', AttributePositionShaderityObject.code);

    this.__outputs.push(
      {
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        name: 'outValue',
      });

  }

}
