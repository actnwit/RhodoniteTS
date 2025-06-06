import type { ConstantVariableShader } from '../../../webgl/shaders/nodes/ConstantVariableShader';
import { CompositionType } from '../../definitions';
import type { ComponentTypeEnum } from '../../definitions/ComponentType';
import type { IVector2 } from '../../math/IVector';
import { ConstantVariableShaderNode } from './ConstantVariableShaderNode';

/**
 * A shader node that represents a constant 2D vector variable in shader programs.
 * This node extends the base ConstantVariableShaderNode to provide specific functionality
 * for Vec2 composition types, allowing developers to set and use constant 2D vector values
 * within shader materials.
 *
 * @template T - The component type enum that defines the data type of the vector components
 *
 * @example
 * ```typescript
 * // Create a constant vector2 node with float components
 * const vector2Node = new ConstantVector2VariableShaderNode(ComponentTypeEnum.Float);
 *
 * // Set a default 2D vector value
 * vector2Node.setDefaultInputValue({x: 1.0, y: 0.5});
 * ```
 */
export class ConstantVector2VariableShaderNode<T extends ComponentTypeEnum> extends ConstantVariableShaderNode<
  typeof CompositionType.Vec2,
  T
> {
  /**
   * Creates a new ConstantVector2VariableShaderNode instance.
   *
   * @param componentType - The component type that defines the data type of the vector components
   *                       (e.g., float, int, etc.)
   *
   * @example
   * ```typescript
   * const node = new ConstantVector2VariableShaderNode(ComponentTypeEnum.Float);
   * ```
   */
  constructor(componentType: T) {
    super('ConstantVector2', CompositionType.Vec2, componentType);
  }

  /**
   * Sets the default input value for this constant vector2 shader node.
   * This value will be used as the constant 2D vector in shader calculations.
   *
   * @param value - A 2D vector object containing x and y components that will be
   *               used as the constant value in the shader
   *
   * @example
   * ```typescript
   * // Set a normalized direction vector
   * node.setDefaultInputValue({x: 0.707, y: 0.707});
   *
   * // Set texture coordinates
   * node.setDefaultInputValue({x: 0.5, y: 0.5});
   * ```
   */
  setDefaultInputValue(value: IVector2) {
    (this.__commonPart as ConstantVariableShader).setConstantValue(value);
  }
}
