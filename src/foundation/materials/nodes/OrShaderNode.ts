import OrShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/Or.glsl';
import OrShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/Or.wgsl';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that performs a logical OR operation on two boolean values.
 *
 * This node takes two boolean inputs and outputs the result of the logical OR operation.
 * The output is true when at least one of the inputs is true.
 *
 * @example
 * ```typescript
 * // Create an OR node
 * const orNode = new OrShaderNode();
 * ```
 */
export class OrShaderNode extends AbstractShaderNode {
  /**
   * Creates a new OrShaderNode instance.
   *
   * @remarks
   * The node will have two boolean inputs:
   * - `lhs`: Left-hand side operand (boolean)
   * - `rhs`: Right-hand side operand (boolean)
   *
   * The output is a boolean scalar indicating the OR result.
   */
  constructor() {
    super('_or', {
      codeGLSL: OrShaderityObjectGLSL.code,
      codeWGSL: OrShaderityObjectWGSL.code,
    });

    this.__inputs.push(new Socket('lhs', CompositionType.Scalar, ComponentType.Bool));
    this.__inputs.push(new Socket('rhs', CompositionType.Scalar, ComponentType.Bool));
    this.__outputs.push(new Socket('outValue', CompositionType.Scalar, ComponentType.Bool));
  }

  /**
   * Gets the input socket for the left-hand side boolean value.
   *
   * @returns The input socket for the left operand
   */
  getSocketInputLhs() {
    return this.__inputs[0];
  }

  /**
   * Gets the input socket for the right-hand side boolean value.
   *
   * @returns The input socket for the right operand
   */
  getSocketInputRhs() {
    return this.__inputs[1];
  }

  /**
   * Gets the output socket that provides the OR result.
   *
   * @returns The output socket containing the boolean OR result
   */
  getSocketOutput() {
    return this.__outputs[0];
  }
}
