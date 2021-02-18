import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import AttributeNormalShaderityObject from '../../../webgl/shaderity_shaders/nodes/AttributeNormal.vert'
import AbstractShaderNode from '../core/AbstractShaderNode';

export default class AttributePositionShaderNode extends AbstractShaderNode {

  constructor() {
    super('attributeNormal', AttributeNormalShaderityObject.code);

    this.__outputs.push(
      {
        compositionType: CompositionType.Vec3,
        componentType: ComponentType.Float,
        name: 'outValue',
      });

  }

}

