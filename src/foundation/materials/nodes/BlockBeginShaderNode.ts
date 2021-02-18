import {
  CompositionType,
  CompositionTypeEnum,
} from '../../definitions/CompositionType';
import {
  ComponentType,
  ComponentTypeEnum,
} from '../../definitions/ComponentType';
import BlockBeginShader from '../../../webgl/shaders/nodes/BlockBeginShader';
import AbstractShaderNode from '../core/AbstractShaderNode';
import {ShaderSocket} from '../core/AbstractMaterialNode';

export default class BlockBeginShaderNode extends AbstractShaderNode {
  private __valueInputs: ShaderSocket[] = [];
  private __valueOutputs: ShaderSocket[] = [];
  constructor() {
    super('blockBegin');

    this.__shaderFunctionName += '_' + this.__shaderNodeUid;

    this.__shader = new BlockBeginShader(
      this.__shaderFunctionName,
      this.__valueInputs,
      this.__valueOutputs
    );

    this.__inputs.push({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Bool,
      name: 'blockStart',
    });
  }

  addInputAndOutput(
    compositionType: CompositionTypeEnum,
    componentType: ComponentTypeEnum
  ) {
    const input = {
      compositionType: compositionType,
      componentType: componentType,
      name: `value_${this.__valueInputs.length}`,
    };
    const output = {
      compositionType: compositionType,
      componentType: componentType,
      name: `outValue_${this.__valueOutputs.length}`,
    };
    this.__inputs.push(input);
    this.__outputs.push(output);
    this.__valueInputs.push(input);
    this.__valueOutputs.push(output);
  }
}
