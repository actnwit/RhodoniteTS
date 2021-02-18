import AbstractShaderNode from '../core/AbstractShaderNode';
import { CompositionType, CompositionTypeEnum } from '../../definitions/CompositionType';
import { ComponentType, ComponentTypeEnum } from '../../definitions/ComponentType';
import AddShaderityObject from '../../../webgl/shaderity_shaders/nodes/Add.glsl'

export default class AddShaderNode extends AbstractShaderNode {

  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super('add', AddShaderityObject.code);

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
        compositionType: compositionType,
        componentType: componentType,
        name: 'outValue',
      });

  }

}
