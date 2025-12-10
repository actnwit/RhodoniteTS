import ClampShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/Clamp.glsl';
import ClampShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/Clamp.wgsl';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../definitions/CompositionType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that implements the clamp function to constrain a value between a minimum and maximum.
 *
 * The clamp function returns min if value < min, max if value > max, otherwise value.
 * This is useful for limiting values to a specific range in shaders.
 *
 * @example
 * ```typescript
 * const clampNode = new ClampShaderNode(
 *   CompositionType.Vec3,
 *   ComponentType.Float
 * );
 * ```
 */
export class ClampShaderNode extends AbstractShaderNode {
  /**
   * Creates a new ClampShaderNode instance.
   *
   * @param compositionType - The composition type (Scalar, Vec2, Vec3, Vec4) for the shader node
   * @param componentType - The component type (Float, Int, etc.) for the shader node
   */
  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super('_clamp', {
      codeGLSL: ClampShaderityObjectGLSL.code,
      codeWGSL: ClampShaderityObjectWGSL.code,
    });

    this.__inputs.push(new Socket('value', compositionType, componentType));
    this.__inputs.push(new Socket('minVal', compositionType, componentType));
    this.__inputs.push(new Socket('maxVal', compositionType, componentType));
    this.__outputs.push(new Socket('outValue', compositionType, componentType));
  }

  /**
   * Gets the input socket for the value parameter of the clamp function.
   *
   * This is the value to be clamped between minVal and maxVal.
   *
   * @returns The input socket for the value parameter
   */
  getSocketInputValue() {
    return this.__inputs[0];
  }

  /**
   * Gets the output socket that contains the result of the clamp operation.
   *
   * The output will be the input value clamped to the range [minVal, maxVal].
   *
   * @returns The output socket containing the clamp result
   */
  getSocketOutput() {
    return this.__outputs[0];
  }

  /**
   * Gets the appropriate shader function name based on the current process approach and composition type.
   *
   * For WebGPU, the function name includes a type suffix (F32, Vec2f, Vec3f, Vec4f) to match
   * WGSL naming conventions. For other approaches (WebGL), the base function name is used.
   *
   * @param engine - The engine instance
   * @returns The shader function name with appropriate type suffix for the current context
   * @throws {Error} If the composition type is not supported
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
