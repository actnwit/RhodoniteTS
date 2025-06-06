import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { CompositionType, type CompositionTypeEnum } from '../../definitions/CompositionType';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import StepShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/Step.glsl';
import StepShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/Step.wgsl';
import { Socket } from '../core/Socket';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { SystemState } from '../../system/SystemState';

/**
 * A shader node that implements the step function.
 *
 * The step function returns 0.0 if the value is less than the edge, and 1.0 otherwise.
 * This is commonly used for creating sharp transitions and thresholding operations in shaders.
 *
 * @example
 * ```typescript
 * const stepNode = new StepShaderNode(CompositionType.Scalar, ComponentType.Float);
 * ```
 */
export class StepShaderNode extends AbstractShaderNode {
  /**
   * Creates a new StepShaderNode instance.
   *
   * @param compositionType - The composition type (Scalar, Vec2, Vec3, or Vec4) for the inputs and output
   * @param componentType - The component type (Float, Int, etc.) for the inputs and output
   */
  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super('_step', {
      codeGLSL: StepShaderityObjectGLSL.code,
      codeWGSL: StepShaderityObjectWGSL.code,
    });

    this.__inputs.push(new Socket('value', compositionType, componentType));
    this.__inputs.push(new Socket('edge', compositionType, componentType));
    this.__outputs.push(new Socket('outValue', compositionType, componentType));
  }

  /**
   * Gets the input socket for the value parameter.
   *
   * The value socket represents the input value to be compared against the edge.
   *
   * @returns The value input socket
   */
  getSocketInputValue() {
    return this.__inputs[0];
  }

  /**
   * Gets the output socket that provides the result of the step function.
   *
   * The output will be 0.0 if value < edge, and 1.0 if value >= edge.
   *
   * @returns The output socket containing the step function result
   */
  getSocketOutput() {
    return this.__outputs[0];
  }

  /**
   * Gets the appropriate shader function name based on the current graphics API and composition type.
   *
   * For WebGPU, returns a type-specific function name (e.g., '_stepF32', '_stepVec2f').
   * For other APIs (WebGL), returns the base function name.
   *
   * @returns The shader function name to use in the generated shader code
   * @throws {Error} Throws an error if the composition type is not implemented for WebGPU
   */
  getShaderFunctionNameDerivative() {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (this.__inputs[0].compositionType === CompositionType.Scalar) {
        return this.__shaderFunctionName + 'F32';
      } else if (this.__inputs[0].compositionType === CompositionType.Vec2) {
        return this.__shaderFunctionName + 'Vec2f';
      } else if (this.__inputs[0].compositionType === CompositionType.Vec3) {
        return this.__shaderFunctionName + 'Vec3f';
      } else if (this.__inputs[0].compositionType === CompositionType.Vec4) {
        return this.__shaderFunctionName + 'Vec4f';
      } else {
        throw new Error('Not implemented');
      }
    } else {
      return this.__shaderFunctionName;
    }
  }
}
