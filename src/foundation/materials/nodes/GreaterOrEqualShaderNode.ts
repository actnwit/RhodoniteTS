import GreaterOrEqualShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/GreaterOrEqual.glsl';
import GreaterOrEqualShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/GreaterOrEqual.wgsl';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that performs a greater-than-or-equal comparison operation.
 *
 * This node compares two values and outputs a boolean result indicating whether
 * the left-hand side (lhs) is greater than or equal to the right-hand side (rhs).
 * Both operands must be of the same component type (float, int, or uint).
 *
 * @example
 * ```typescript
 * // Create a greater-than-or-equal comparison node for float values
 * const greaterOrEqualNode = new GreaterOrEqualShaderNode(ComponentType.Float);
 * ```
 */
export class GreaterOrEqualShaderNode extends AbstractShaderNode {
  /**
   * Creates a new GreaterOrEqualShaderNode instance.
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
    super('_greaterOrEqual', {
      codeGLSL: GreaterOrEqualShaderityObjectGLSL.code,
      codeWGSL: GreaterOrEqualShaderityObjectWGSL.code,
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
   * For WebGPU, returns a type-specific function name (e.g., '_greaterOrEqualF32', '_greaterOrEqualI32').
   * For WebGL, returns the base function name '_greaterOrEqual'.
   *
   * @param engine - The engine instance
   * @returns The shader function name to use in the generated shader code
   * @throws {Error} Throws an error if the component type is not supported for WebGPU
   */
  getShaderFunctionNameDerivative(engine: Engine): string {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (this.__inputs[0].componentType === ComponentType.Float) {
        return '_greaterOrEqualF32';
      }
      if (this.__inputs[0].componentType === ComponentType.Int) {
        return '_greaterOrEqualI32';
      }
      if (this.__inputs[0].componentType === ComponentType.UnsignedInt) {
        return '_greaterOrEqualU32';
      }
      throw new Error('Not supported component type.');
    }
    return this.__shaderFunctionName;
  }
}
