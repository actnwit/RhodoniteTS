import OpSubtractionShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/OpSubtraction.glsl';
import OpSubtractionShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/OpSubtraction.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that performs subtraction operations between two input values.
 * Outputs the difference of the two inputs for each component.
 * Supports scalar, Vec2, Vec3, and Vec4 compositions with appropriate component types.
 *
 * This node creates two input sockets (in1 and in2) and one output socket,
 * all of the same composition and component type. The node generates shader code
 * for both WebGL (GLSL) and WebGPU (WGSL) backends.
 *
 * @example
 * ```typescript
 * // Create a subtraction node for Vec3 float operations
 * const opSubtractionNode = new OpSubtractionShaderNode(CompositionType.Vec3, ComponentType.Float);
 *
 * // Connect inputs and get output
 * const lhsSocket = opSubtractionNode.getSocketInputLhs();
 * const rhsSocket = opSubtractionNode.getSocketInputRhs();
 * const outputSocket = opSubtractionNode.getSocketOutput();
 * ```
 */
export class OpSubtractionShaderNode extends AbstractShaderNode {
  /**
   * Creates a new OpSubtractionShaderNode with the specified composition and component types.
   *
   */
  constructor() {
    super('opSubtraction', {
      codeGLSL: OpSubtractionShaderityObjectGLSL.code,
      codeWGSL: OpSubtractionShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__inputs.push(new Socket('d1', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.0)));
    this.__inputs.push(new Socket('minus_d2', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.0)));
    this.__outputs.push(
      new Socket('outValue', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.0))
    );
  }

  /**
   * Gets the left-hand side input socket.
   * This socket represents the first operand in the subtraction operation.
   *
   * @returns The left-hand side input socket
   */
  getSocketInputLhs() {
    return this.__inputs[0];
  }

  /**
   * Gets the right-hand side input socket.
   * This socket represents the second operand in the subtraction operation.
   *
   * @returns The right-hand side input socket
   */
  getSocketInputRhs() {
    return this.__inputs[1];
  }

  /**
   * Gets the output socket that contains the result of the subtraction operation.
   *
   * @returns The output socket containing the subtraction result
   */
  getSocketOutput() {
    return this.__outputs[0];
  }
}
