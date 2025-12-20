import CalcBitangentShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/CalcBitangent.glsl';
import CalcBitangentShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/CalcBitangent.wgsl';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that calculates the bitangent vector from the tangent and normal vectors.
 * @example
 * ```typescript
 * // Create a calc bitangent node
 * const calcBitangentNode = new CalcBitangentShaderNode();
 *
 * // Connect inputs and get output
 * const lhsSocket = calcBitangentNode.getSocketInputLhs();
 * const rhsSocket = calcBitangentNode.getSocketInputRhs();
 * const outputSocket = calcBitangentNode.getSocketOutput();
 * ```
 */
export class CalcBitangentShaderNode extends AbstractShaderNode {
  /**
   * Creates a new CalcBitangentShaderNode with the specified composition and component types.
   *
   * @param compositionType - The composition type (Scalar, Vec2, Vec3, or Vec4)
   * @param componentType - The component type (Float, Int, etc.)
   *
   * @throws {Error} Throws an error if the composition type is not supported
   */
  constructor() {
    super('calcBitangent', {
      codeGLSL: CalcBitangentShaderityObjectGLSL.code,
      codeWGSL: CalcBitangentShaderityObjectWGSL.code,
    });

    this.__inputs.push(new Socket('tangent', CompositionType.Vec4, ComponentType.Float));
    this.__inputs.push(new Socket('normalInWorld', CompositionType.Vec3, ComponentType.Float));
    this.__inputs.push(new Socket('worldMatrix', CompositionType.Mat4, ComponentType.Float));
    this.__outputs.push(new Socket('outTangentInWorld', CompositionType.Vec3, ComponentType.Float));
    this.__outputs.push(new Socket('outBitangentInWorld', CompositionType.Vec3, ComponentType.Float));
  }

  /**
   * Gets the output socket that contains the tangent vector in world space.
   *
   * @returns The output socket containing the tangent vector in world space
   */
  getSocketOutputTangentInWorld() {
    return this.__outputs[0];
  }

  /**
   * Gets the output socket that contains the bitangent vector in world space.
   *
   * @returns The output socket containing the bitangent vector in world space
   */
  getSocketOutputBitangentInWorld() {
    return this.__outputs[1];
  }
}
