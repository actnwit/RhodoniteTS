import LessThanShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/LessThan.glsl';
import LessThanShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/LessThan.wgsl';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that performs a less-than comparison operation.
 *
 * This node compares two values and outputs a boolean result indicating whether
 * the left-hand side (lhs) is less than the right-hand side (rhs).
 * Both operands must be of the same component type (float, int, or uint).
 *
 * @example
 * ```typescript
 * // Create a less-than comparison node for float values
 * const lessThanNode = new LessThanShaderNode(ComponentType.Float);
 * ```
 */
export class LessThanShaderNode extends AbstractShaderNode {
  /**
   * Creates a new LessThanShaderNode instance.
   *
   * @param componentType - The component type of the inputs (Float, Int, or UnsignedInt)
   *
   * @remarks
   * The node will have two inputs:
   * - `lhs`: Left-hand side operand with Scalar composition and the specified component type
   * - `rhs`: Right-hand side operand with Scalar composition and the specified component type
   *
   * The output is always a boolean scalar indicating the comparison result.
   */
  constructor(componentType: ComponentTypeEnum) {
    super('_lessThan', {
      codeGLSL: LessThanShaderityObjectGLSL.code,
      codeWGSL: LessThanShaderityObjectWGSL.code,
    });

    this.__inputs.push(new Socket('lhs', CompositionType.Scalar, componentType));
    this.__inputs.push(new Socket('rhs', CompositionType.Scalar, componentType));
    this.__outputs.push(new Socket('outValue', CompositionType.Scalar, ComponentType.Bool));
  }

  /**
   * Gets the input socket for the left-hand side value.
   *
   * @returns The input socket for the left operand
   */
  getSocketInputLhs() {
    return this.__inputs[0];
  }

  /**
   * Gets the input socket for the right-hand side value.
   *
   * @returns The input socket for the right operand
   */
  getSocketInputRhs() {
    return this.__inputs[1];
  }

  /**
   * Gets the output socket that provides the comparison result.
   *
   * @returns The output socket containing the boolean comparison result
   */
  getSocketOutput() {
    return this.__outputs[0];
  }

  /**
   * Gets the appropriate shader function name based on the current rendering approach and input type.
   * For WebGPU, returns a type-specific function name (e.g., '_lessThanF32', '_lessThanI32').
   * For WebGL, returns the base function name 'lessThan'.
   *
   * @param engine - The engine instance
   * @returns The shader function name to use in the generated shader code
   * @throws {Error} Throws an error if the component type is not supported for WebGPU
   */
  getShaderFunctionNameDerivative(engine: Engine): string {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (this.__inputs[0].componentType === ComponentType.Float) {
        return '_lessThanF32';
      }
      if (this.__inputs[0].componentType === ComponentType.Int) {
        return '_lessThanI32';
      }
      if (this.__inputs[0].componentType === ComponentType.UnsignedInt) {
        return '_lessThanU32';
      }
      throw new Error('Not supported component type.');
    }
    return this.__shaderFunctionName;
  }
}
