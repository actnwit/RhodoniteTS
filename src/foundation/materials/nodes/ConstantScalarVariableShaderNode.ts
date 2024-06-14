import { ConstantVariableShader } from '../../../webgl/shaders/nodes/ConstantVariableShader';
import { CompositionType } from '../../definitions';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { IScalar } from '../../math/IVector';
import { ConstantVariableShaderNode } from './ConstantVariableShaderNode';

export class ConstantScalarVariableShaderNode<
  T extends ComponentTypeEnum
> extends ConstantVariableShaderNode<typeof CompositionType.Scalar, T> {
  constructor(componentType: T) {
    super('ConstantScalar', CompositionType.Scalar, componentType);
  }

  setDefaultInputValue(value: IScalar) {
    (this.__shader as ConstantVariableShader).setConstantValue(value);
  }
}
