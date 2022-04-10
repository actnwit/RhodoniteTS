import AbstractShaderNode from '../core/AbstractShaderNode';
import {
  CompositionType,
  CompositionTypeEnum,
} from '../../definitions/CompositionType';
import {
  ComponentType,
  ComponentTypeEnum,
} from '../../definitions/ComponentType';
import GreaterShaderityObject from '../../../webgl/shaderity_shaders/nodes/Greater.glsl';

export class GreaterShaderNode extends AbstractShaderNode {
  constructor(
    compositionType: CompositionTypeEnum,
    componentType: ComponentTypeEnum
  ) {
    super('greater', GreaterShaderityObject.code);

    this.__inputs.push({
      compositionType: compositionType,
      componentType: componentType,
      name: 'lhs',
    });
    this.__inputs.push({
      compositionType: compositionType,
      componentType: ComponentType.Float,
      name: 'rhs',
    });
    this.__outputs.push({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Bool,
      name: 'outValue',
    });
  }
}
