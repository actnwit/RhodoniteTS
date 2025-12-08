import GreaterThanShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/GreaterThan.glsl';
import GreaterThanShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/GreaterThan.wgsl';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that performs a greater-than comparison operation.
 *
 * This node compares two values and outputs a boolean result indicating whether
 * the left-hand side (lhs) is greater than the right-hand side (rhs).
 * Both operands must be of the same component type (float, int, or uint).
 *
 * @example
 * ```typescript
 * // Create a greater-than comparison node for float values
 * const greaterThanNode = new GreaterThanShaderNode(ComponentType.Float);
 * ```
 */
export class GreaterThanShaderNode extends AbstractShaderNode {
  /**
   * Creates a new GreaterThanShaderNode instance.
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
    super('_greaterThan', {
      codeGLSL: GreaterThanShaderityObjectGLSL.code,
      codeWGSL: GreaterThanShaderityObjectWGSL.code,
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
   * For WebGPU, returns a type-specific function name (e.g., '_greaterThanF32', '_greaterThanI32').
   * For WebGL, returns the base function name '_greaterThan'.
   *
   * @param engine - The engine instance
   * @returns The shader function name to use in the generated shader code
   * @throws {Error} Throws an error if the component type is not supported for WebGPU
   */
  getShaderFunctionNameDerivative(engine: Engine): string {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (this.__inputs[0].componentType === ComponentType.Float) {
        return '_greaterThanF32';
      }
      if (this.__inputs[0].componentType === ComponentType.Int) {
        return '_greaterThanI32';
      }
      if (this.__inputs[0].componentType === ComponentType.UnsignedInt) {
        return '_greaterThanU32';
      }
      throw new Error('Not supported component type.');
    }
    return this.__shaderFunctionName;
  }
}

