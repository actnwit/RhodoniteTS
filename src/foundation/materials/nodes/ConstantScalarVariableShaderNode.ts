import { ConstantVariableShader } from '../../../webgl/shaders/nodes/ConstantVariableShader';
import { CompositionType } from '../../definitions';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { Scalar } from '../../math/Scalar';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

export class ConstantScalarVariableShaderNode<
  T extends ComponentTypeEnum
> extends AbstractShaderNode {
  private __componentType: T;

  constructor(componentType: T) {
    super('constantScalarVariable', undefined, undefined);
    this.__componentType = componentType;
    this.__shaderFunctionName += '_' + this.__shaderNodeUid;

    this.__shader = new ConstantVariableShader(
      this.__shaderFunctionName,
      CompositionType.Scalar,
      componentType
    );
  }

  setDefaultInputValue(value: Scalar) {
    (this.__shader as ConstantVariableShader).setConstantValue(value);
  }

  getSocketOutput() {
    return new Socket('outValue', CompositionType.Scalar, this.__componentType);
  }
}
