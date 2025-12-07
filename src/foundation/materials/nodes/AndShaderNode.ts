import AndShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/And.glsl';
import AndShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/And.wgsl';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that performs a logical AND operation on two boolean values.
 *
 * This node takes two boolean inputs and outputs the result of the logical AND operation.
 * The output is true only when both inputs are true.
 *
 * @example
 * ```typescript
 * // Create an AND node
 * const andNode = new AndShaderNode();
 * ```
 */
export class AndShaderNode extends AbstractShaderNode {
  /**
   * Creates a new AndShaderNode instance.
   *
   * @remarks
   * The node will have two boolean inputs:
   * - `lhs`: Left-hand side operand (boolean)
   * - `rhs`: Right-hand side operand (boolean)
   *
   * The output is a boolean scalar indicating the AND result.
   */
  constructor() {
    super('_and', {
      codeGLSL: AndShaderityObjectGLSL.code,
      codeWGSL: AndShaderityObjectWGSL.code,
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
   * Gets the output socket that provides the AND result.
   *
   * @returns The output socket containing the boolean AND result
   */
  getSocketOutput() {
    return this.__outputs[0];
  }
}

