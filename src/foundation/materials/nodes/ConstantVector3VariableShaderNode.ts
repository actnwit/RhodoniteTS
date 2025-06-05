import { ConstantVariableShader } from '../../../webgl/shaders/nodes/ConstantVariableShader';
import { CompositionType } from '../../definitions';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { IVector3 } from '../../math/IVector';
import { ConstantVariableShaderNode } from './ConstantVariableShaderNode';

/**
 * A shader node that represents a constant 3D vector variable in shader programs.
 * This node extends the base ConstantVariableShaderNode to provide specific functionality
 * for Vec3 composition types, allowing developers to set and use constant 3D vector values
 * within shader materials.
 *
 * @template T - The component type enum that defines the data type of the vector components
 *              (e.g., Float, Int, UnsignedInt, etc.)
 *
 * @example
 * ```typescript
 * // Create a Vec3 constant node with float components
 * const vec3Node = new ConstantVector3VariableShaderNode(ComponentType.Float);
 * vec3Node.setDefaultInputValue(Vector3.fromCopy3(1.0, 0.5, 0.2));
 *
 * // Connect it to other shader nodes in a material graph
 * const multiplyNode = new MultiplyShaderNode(CompositionType.Vec3, ComponentType.Float);
 * multiplyNode.addInputConnection(vec3Node, vec3Node.getSocketOutput(), multiplyNode.getSocketInputLhs());
 * ```
 */
export class ConstantVector3VariableShaderNode<
  T extends ComponentTypeEnum
> extends ConstantVariableShaderNode<typeof CompositionType.Vec3, T> {

  /**
   * Creates a new ConstantVector3VariableShaderNode instance.
   *
   * @param componentType - The component type that defines the data type of the vector components.
   *                       This determines how the vector values are interpreted and processed
   *                       in the shader (e.g., float, int, uint).
   */
  constructor(componentType: T) {
    super('ConstantVector3', CompositionType.Vec3, componentType);
  }

  /**
   * Sets the default input value for this constant Vec3 shader node.
   * This method updates the underlying constant value used by the shader,
   * which will be injected into the generated shader code as a constant.
   *
   * @param value - The 3D vector value to set as the constant input value.
   *               This should be an object implementing IVector3 interface,
   *               typically a Vector3 instance with x, y, and z components.
   *
   * @example
   * ```typescript
   * const node = new ConstantVector3VariableShaderNode(ComponentType.Float);
   * node.setDefaultInputValue(Vector3.fromCopy3(1.0, 0.5, 0.0)); // RGB color or position
   * ```
   */
  setDefaultInputValue(value: IVector3) {
    (this.__commonPart as ConstantVariableShader).setConstantValue(value);
  }
}
