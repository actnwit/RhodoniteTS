import OpSubtractionShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/OpSubtraction.glsl';
import OpSubtractionShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/OpSubtraction.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that performs CSG (Constructive Solid Geometry) subtraction operations.
 * This node computes the boolean difference between two signed distance fields (SDFs),
 * effectively "cutting away" one shape from another.
 *
 * The operation is: max(base, -subtractor)
 * - `base`: The shape to subtract FROM (the preserved shape)
 * - `subtractor`: The shape that does the subtracting (removes from base)
 *
 * Users should provide raw SDF values for both inputs. The shader internally
 * negates the `subtractor` input to perform the CSG subtraction.
 *
 * @example
 * ```typescript
 * // Create a CSG subtraction node
 * const opSubtractionNode = new OpSubtractionShaderNode();
 *
 * // Connect inputs: base shape and subtracting shape
 * const baseSocket = opSubtractionNode.getSocketInputBase();
 * const subtractorSocket = opSubtractionNode.getSocketInputSubtractor();
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

    this.__inputs.push(new Socket('base', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.0)));
    this.__inputs.push(
      new Socket('subtractor', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.0))
    );
    this.__outputs.push(
      new Socket('outValue', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.0))
    );
  }

  /**
   * Gets the base shape input socket.
   * This socket represents the shape to subtract FROM (the preserved shape).
   * Provide the raw SDF value of the base shape.
   *
   * @returns The base shape input socket
   */
  getSocketInputBase() {
    return this.__inputs[0];
  }

  /**
   * Gets the subtractor shape input socket.
   * This socket represents the shape that does the subtracting (removes from base).
   * Provide the raw SDF value - the shader will handle the negation internally.
   *
   * @returns The subtractor shape input socket
   */
  getSocketInputSubtractor() {
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
