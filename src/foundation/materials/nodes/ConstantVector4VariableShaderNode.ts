import type { ConstantVariableShader } from '../../../webgl/shaders/nodes/ConstantVariableShader';
import { CompositionType } from '../../definitions';
import type { ComponentTypeEnum } from '../../definitions/ComponentType';
import type { IVector4 } from '../../math/IVector';
import { ConstantVariableShaderNode } from './ConstantVariableShaderNode';

/**
 * A shader node that represents a constant 4D vector variable in shader programs.
 * This node extends the base ConstantVariableShaderNode to provide specific functionality
 * for Vec4 composition types, allowing developers to set and use constant 4D vector values
 * within shader materials. Vec4 values are commonly used for RGBA colors, quaternions,
 * or homogeneous coordinates.
 *
 * @template T - The component type enum that defines the data type of the vector components
 *              (e.g., Float, Int, UnsignedInt, etc.)
 *
 * @example
 * ```typescript
 * // Create a Vec4 constant node with float components for RGBA color
 * const colorNode = new ConstantVector4VariableShaderNode(ComponentType.Float);
 * colorNode.setDefaultInputValue(Vector4.fromCopy4(1.0, 0.5, 0.2, 1.0)); // Orange with full alpha
 *
 * // Connect it to other shader nodes in a material graph
 * const multiplyNode = new MultiplyShaderNode(CompositionType.Vec4, ComponentType.Float);
 * multiplyNode.addInputConnection(colorNode, colorNode.getSocketOutput(), multiplyNode.getSocketInputLhs());
 * ```
 */
export class ConstantVector4VariableShaderNode<T extends ComponentTypeEnum> extends ConstantVariableShaderNode<
  typeof CompositionType.Vec4,
  T
> {
  /**
   * Creates a new ConstantVector4VariableShaderNode instance.
   *
   * @param componentType - The component type that defines the data type of the vector components.
   *                       This determines how the vector values are interpreted and processed
   *                       in the shader (e.g., float, int, uint).
   */
  constructor(componentType: T) {
    super('ConstantVector4', CompositionType.Vec4, componentType);
  }

  /**
   * Sets the default input value for this constant Vec4 shader node.
   * This method updates the underlying constant value used by the shader,
   * which will be injected into the generated shader code as a constant.
   *
   * @param value - The 4D vector value to set as the constant input value.
   *               This should be an object implementing IVector4 interface,
   *               typically a Vector4 instance with x, y, z, and w components.
   *
   * @example
   * ```typescript
   * const node = new ConstantVector4VariableShaderNode(ComponentType.Float);
   * // Set RGBA color value
   * node.setDefaultInputValue(Vector4.fromCopy4(1.0, 0.0, 0.0, 1.0)); // Red color
   *
   * // Set homogeneous coordinate
   * node.setDefaultInputValue(Vector4.fromCopy4(10.0, 5.0, 2.0, 1.0)); // Position in homogeneous coords
   * ```
   */
  setDefaultInputValue(value: IVector4) {
    (this.__commonPart as ConstantVariableShader).setConstantValue(value);
  }
}
