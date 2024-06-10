import { ConstantVariableShader } from '../../../webgl/shaders/nodes/ConstantVariableShader';
import { CompositionType } from '../../definitions';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { IVector4 } from '../../math/IVector';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

export class ConstantVector4VariableShaderNode<
  T extends ComponentTypeEnum
> extends AbstractShaderNode {
  constructor(componentType: T) {
    super('constantVector4Variable', undefined, undefined);

    this.__shaderFunctionName += '_' + this.__shaderNodeUid;

    this.__shader = new ConstantVariableShader(
      this.__shaderFunctionName,
      CompositionType.Vec4,
      componentType
    );
  }

  setDefaultInputValue(inputName: string, value: IVector4) {
    if (inputName === 'value') {
      (this.__shader as ConstantVariableShader).setConstantValue(value);
    }
  }
}
