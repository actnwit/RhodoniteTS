import {CompositionTypeEnum} from '../../definitions/CompositionType';
import {ComponentTypeEnum} from '../../definitions/ComponentType';
import ConstantVariableShader from '../../../webgl/shaders/nodes/ConstantVariableShader';
import AbstractShaderNode from '../core/AbstractShaderNode';

export default class ConstantVariableShaderNode extends AbstractShaderNode {
  constructor(
    compositionType: CompositionTypeEnum,
    componentType: ComponentTypeEnum
  ) {
    super('constantVariable', undefined, undefined);

    this.__shaderFunctionName += '_' + this.__shaderNodeUid;

    this.__shader = new ConstantVariableShader(
      this.__shaderFunctionName,
      compositionType,
      componentType
    );

    this.__outputs.push({
      compositionType: compositionType,
      componentType: componentType,
      name: 'outValue',
    });
  }

  setDefaultInputValue(inputName: string, value: any) {
    if (inputName === 'value') {
      (this.__shader as ConstantVariableShader).setConstantValue(value);
    }
  }
}
