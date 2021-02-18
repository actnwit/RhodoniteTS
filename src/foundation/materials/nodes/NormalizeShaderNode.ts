import NormalizeShaderityObject from '../../../webgl/shaderity_shaders/nodes/Normalize.glsl';
import {ComponentTypeEnum} from '../../../foundation/definitions/ComponentType';
import {CompositionTypeEnum} from '../../../foundation/definitions/CompositionType';
import AbstractShaderNode from '../core/AbstractShaderNode';

export default class NormalizeShaderNode extends AbstractShaderNode {
  constructor(
    compositionType: CompositionTypeEnum,
    componentType: ComponentTypeEnum
  ) {
    super('normalize', NormalizeShaderityObject.code);

    this.__inputs.push({
      compositionType: compositionType,
      componentType: componentType,
      name: 'value',
    });
    this.__outputs.push({
      compositionType: compositionType,
      componentType: componentType,
      name: 'outValue',
    });
  }
}
