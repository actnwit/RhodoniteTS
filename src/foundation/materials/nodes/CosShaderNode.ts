import CosShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/Cos.glsl';
import CosShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/Cos.wgsl';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../definitions/CompositionType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that computes the cosine function of its input value.
 * This node accepts a single input value and outputs the cosine of that value.
 * The computation is performed in shader code (GLSL/WGSL) and supports
 * scalar, vector2, vector3, and vector4 input types.
 *
 * @example
 * ```typescript
 * // Create a cosine node for a scalar float value
 * const cosNode = new CosShaderNode(CompositionType.Scalar, ComponentType.Float);
 *
 * // Create a cosine node for a vec3 float value
 * const cosVec3Node = new CosShaderNode(CompositionType.Vec3, ComponentType.Float);
 * ```
 */
export class CosShaderNode extends AbstractShaderNode {
  /**
   * Creates a new CosShaderNode instance with the specified composition and component types.
   * The node will have one input socket named 'value' and one output socket named 'outValue',
   * both configured with the provided types.
   *
   * @param compositionType - The composition type (Scalar, Vec2, Vec3, Vec4) that defines the structure of the input/output data
   * @param componentType - The component type (Float, Int, etc.) that defines the data type of each component
   */
  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super('_cos', {
      codeGLSL: CosShaderityObjectGLSL.code,
      codeWGSL: CosShaderityObjectWGSL.code,
    });

    this.__inputs.push(new Socket('value', compositionType, componentType));
    this.__outputs.push(new Socket('outValue', compositionType, componentType));
  }

  /**
   * Gets the input socket for the value to compute the cosine of.
   * This is the socket where the input value should be connected.
   *
   * @returns The input socket that accepts the value for cosine computation
   */
  getSocketInputValue() {
    return this.__inputs[0];
  }

  /**
   * Gets the output socket that provides the computed cosine value.
   * This socket outputs the result of the cosine function applied to the input value.
   *
   * @returns The output socket containing the cosine computation result
   */
  getSocketOutput() {
    return this.__outputs[0];
  }

  /**
   * Gets the appropriate shader function name based on the current rendering approach and input type.
   * For WebGPU, returns a type-specific function name (e.g., '_cosF32', '_cosVec2f').
   * For WebGL, returns the base function name '_cos'.
   *
   * This method ensures that the correct shader function is called based on the
   * composition type and the target graphics API.
   *
   * @param engine - The engine instance
   * @returns The shader function name to use in the generated shader code
   * @throws {Error} Throws an error if the composition type is not implemented for WebGPU
   */
  getShaderFunctionNameDerivative(engine: Engine) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (this.__inputs[0].compositionType === CompositionType.Scalar) {
        return `${this.__shaderFunctionName}F32`;
      }
      if (this.__inputs[0].compositionType === CompositionType.Vec2) {
        return `${this.__shaderFunctionName}Vec2f`;
      }
      if (this.__inputs[0].compositionType === CompositionType.Vec3) {
        return `${this.__shaderFunctionName}Vec3f`;
      }
      if (this.__inputs[0].compositionType === CompositionType.Vec4) {
        return `${this.__shaderFunctionName}Vec4f`;
      }
      throw new Error('Not implemented');
    }
    return this.__shaderFunctionName;
  }
}
