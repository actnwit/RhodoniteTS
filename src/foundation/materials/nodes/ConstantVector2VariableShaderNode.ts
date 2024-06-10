import { ConstantVariableShader } from '../../../webgl/shaders/nodes/ConstantVariableShader';
import { CompositionType } from '../../definitions';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { IVector2 } from '../../math/IVector';
import { ConstantVariableShaderNode } from './ConstantVariableShaderNode';

export class ConstantVector2VariableShaderNode<
  T extends ComponentTypeEnum
> extends ConstantVariableShaderNode<typeof CompositionType.Vec2, T> {
  constructor(componentType: T) {
    super(CompositionType.Vec2, componentType);
  }

  setDefaultInputValue(value: IVector2) {
    (this.__shader as ConstantVariableShader).setConstantValue(value);
  }
}
