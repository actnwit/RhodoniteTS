import { CompositionType, CompositionTypeEnum } from '../../definitions/CompositionType';
import { ComponentType, ComponentTypeEnum } from '../../definitions/ComponentType';
import VaryingVariableShader from '../../../webgl/shaders/nodes/VaryingVariableShader';
import AbstractShaderNode from '../core/AbstractShaderNode';

export default class VaryingOutVariableShaderNode extends AbstractShaderNode {

  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super('varyingOutVariable');

    this.__shaderFunctionName += '_' + this.__shaderNodeUid;

    this.__shader = new VaryingVariableShader(this.__shaderFunctionName, compositionType, componentType);

      this.__inputs.push(
      {
        compositionType: compositionType,
        componentType: componentType,
        name: 'value',
      });
  }

  setVaryingVariableName(value: any) {
    (this.__shader as VaryingVariableShader).setVariableName(value);
  }
}

