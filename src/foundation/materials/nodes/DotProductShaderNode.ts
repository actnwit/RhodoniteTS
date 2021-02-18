import DotProductShaderityObject from '../../../webgl/shaderity_shaders/nodes/DotProduct.glsl'
import { ComponentTypeEnum } from '../../../foundation/definitions/ComponentType';
import { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import AbstractShaderNode from '../core/AbstractShaderNode';
import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';

export default class DotProductShaderNode extends AbstractShaderNode {

  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super('dotProduct', DotProductShaderityObject.code);

    this.__inputs.push(
      {
        compositionType: compositionType,
        componentType: componentType,
        name: 'lhs',
      });
    this.__inputs.push(
      {
        compositionType: compositionType,
        componentType: ComponentType.Float,
        name: 'rhs',
      });
    this.__outputs.push(
      {
        compositionType: CompositionType.Scalar,
        componentType: componentType,
        name: 'outValue',
      });

  }

}
