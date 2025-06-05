import { ConstantVariableShader } from '../../../webgl/shaders/nodes/ConstantVariableShader';
import { CompositionType } from '../../definitions';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { IScalar } from '../../math/IVector';
import { ConstantVariableShaderNode } from './ConstantVariableShaderNode';

/**
 * A shader node that represents a constant scalar variable.
 * This node extends the base ConstantVariableShaderNode specifically for scalar values,
 * providing functionality to set and manage scalar constant values in shader programs.
 *
 * @template T - The component type enum that defines the data type of the scalar value
 */
export class ConstantScalarVariableShaderNode<
  T extends ComponentTypeEnum
> extends ConstantVariableShaderNode<typeof CompositionType.Scalar, T> {

  /**
   * Creates a new ConstantScalarVariableShaderNode instance.
   *
   * @param componentType - The component type that defines the data type of the scalar value
   */
  constructor(componentType: T) {
    super('ConstantScalar', CompositionType.Scalar, componentType);
  }

  /**
   * Sets the default input value for this constant scalar shader node.
   * This method updates the underlying constant value used by the shader.
   *
   * @param value - The scalar value to set as the constant input value
   */
  setDefaultInputValue(value: IScalar) {
    (this.__commonPart as ConstantVariableShader).setConstantValue(value);
  }
}
