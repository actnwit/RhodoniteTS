import {CompositionTypeEnum} from '../../definitions/CompositionType';
import {ComponentTypeEnum} from '../../definitions/ComponentType';
import AbstractShaderNode from '../core/AbstractShaderNode';
import BlockEndShader from '../../../webgl/shaders/nodes/BlockEndShader';

export class BlockEndShaderNode extends AbstractShaderNode {
  constructor() {
    super('blockEnd');

    this.__shaderFunctionName += '_' + this.__shaderNodeUid;

    this.__shader = new BlockEndShader(
      this.__shaderFunctionName,
      this.__inputs,
      this.__outputs
    );
  }

  addInputAndOutput(
    compositionType: CompositionTypeEnum,
    componentType: ComponentTypeEnum
  ) {
    const input = {
      compositionType: compositionType,
      componentType: componentType,
      name: `value_${this.__inputs.length}`,
    };
    const output = {
      compositionType: compositionType,
      componentType: componentType,
      name: `outValue_${this.__outputs.length}`,
    };
    this.__inputs.push(input);
    this.__outputs.push(output);
  }
}
