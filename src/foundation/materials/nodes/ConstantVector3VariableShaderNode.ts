import { ConstantVariableShader } from '../../../webgl/shaders/nodes/ConstantVariableShader';
import { CompositionType } from '../../definitions';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { IVector3 } from '../../math/IVector';
import { ConstantVariableShaderNode } from './ConstantVariableShaderNode';

export class ConstantVector3VariableShaderNode<
  T extends ComponentTypeEnum
> extends ConstantVariableShaderNode<typeof CompositionType.Vec3, T> {
  constructor(componentType: T) {
    super('ConstantVector3', CompositionType.Vec3, componentType);
  }

  setDefaultInputValue(value: IVector3) {
    (this.__shader as ConstantVariableShader).setConstantValue(value);
  }
}
