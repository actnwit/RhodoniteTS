import { ConstantVariableShader } from '../../../webgl/shaders/nodes/ConstantVariableShader';
import { CompositionType } from '../../definitions';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { IVector4 } from '../../math/IVector';
import { ConstantVariableShaderNode } from './ConstantVariableShaderNode';

export class ConstantVector4VariableShaderNode<
  T extends ComponentTypeEnum
> extends ConstantVariableShaderNode<typeof CompositionType.Vec4, T> {
  constructor(componentType: T) {
    super('ConstantVector4', CompositionType.Vec4, componentType);
  }

  setDefaultInputValue(value: IVector4) {
    (this.__commonPart as ConstantVariableShader).setConstantValue(value);
  }
}
