import { CompositionTypeEnum } from '../../definitions/CompositionType';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { ConstantVariableShader } from '../../../webgl/shaders/nodes/ConstantVariableShader';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { IVector } from '../../math/IVector';
import { Socket } from '../core/Socket';

/**
 * Abstract base class for shader nodes that represent constant variables in the shader graph.
 * This node type provides a way to inject constant values into shader programs with specific
 * composition and component types.
 *
 * @template N - The composition type (e.g., Scalar, Vec2, Vec3, Vec4, Mat2, Mat3, Mat4)
 * @template T - The component type (e.g., Float, Int, UnsignedInt, etc.)
 *
 * @example
 * ```typescript
 * // Create a concrete implementation for a Vec3 float constant
 * class Vec3FloatConstantNode extends ConstantVariableShaderNode<CompositionTypeEnum.Vec3, ComponentTypeEnum.Float> {
 *   constructor() {
 *     super('Vec3Constant', CompositionTypeEnum.Vec3, ComponentTypeEnum.Float);
 *   }
 * }
 * ```
 */
export abstract class ConstantVariableShaderNode<
  N extends CompositionTypeEnum,
  T extends ComponentTypeEnum
> extends AbstractShaderNode {
  /**
   * Creates a new ConstantVariableShaderNode instance.
   *
   * @param nodeName - The display name for this shader node
   * @param compositionType - The composition type defining the data structure (scalar, vector, matrix)
   * @param componentType - The component type defining the data type of individual elements
   *
   * @remarks
   * This constructor initializes the shader function name with a unique identifier,
   * creates the underlying ConstantVariableShader instance, and sets up the output socket.
   */
  constructor(nodeName: string, compositionType: N, componentType: T) {
    super(nodeName, {});

    this.__shaderFunctionName += '_' + this.__shaderNodeUid;

    this.__commonPart = new ConstantVariableShader(
      this.__shaderFunctionName,
      compositionType,
      componentType
    );

    this.__outputs.push(new Socket('outValue', compositionType, componentType));
  }

  /**
   * Sets the default input value for this constant variable node.
   *
   * @param value - The constant value to be used in the shader. Must be compatible with
   *                the node's composition and component types.
   *
   * @remarks
   * This method updates the underlying shader's constant value. The provided value
   * should match the expected dimensionality and type defined by the composition
   * and component types specified during construction.
   *
   * @example
   * ```typescript
   * // For a Vec3 node
   * node.setDefaultInputValue(Vector3.fromCopyArray([1.0, 0.5, 0.2]));
   *
   * // For a scalar node
   * node.setDefaultInputValue(Scalar.fromCopyNumber(3.14));
   * ```
   */
  setDefaultInputValue(value: IVector) {
    (this.__commonPart as ConstantVariableShader).setConstantValue(value);
  }

  /**
   * Retrieves the output socket of this constant variable node.
   *
   * @returns The output socket that can be connected to other shader nodes
   *
   * @remarks
   * This constant variable node has exactly one output socket that provides the
   * constant value to the shader graph. The socket's type matches the composition
   * and component types specified during construction.
   */
  getSocketOutput() {
    return this.__outputs[0];
  }
}
