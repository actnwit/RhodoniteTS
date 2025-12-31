import SdRepeatShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/SdRepeat.glsl';
import SdRepeatShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/SdRepeat.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../../definitions/CompositionType';
import { ProcessApproach } from '../../../definitions/ProcessApproach';
import { Scalar } from '../../../math/Scalar';
import type { Engine } from '../../../system/Engine';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that repeats a distance function.
 *
 * @example
 * ```typescript
 * // Create a repeat node
 * const repeatNode = new SdRepeatShaderNode();
 * ```
 */
export class SdRepeatShaderNode extends AbstractShaderNode {
  /**
   * Creates a new SdRepeatShaderNode with the specified composition and component types.
   *
   */
  constructor(compositionType: CompositionTypeEnum) {
    super('sdRepeat', {
      codeGLSL: SdRepeatShaderityObjectGLSL.code,
      codeWGSL: SdRepeatShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__inputs.push(new Socket('position', compositionType, ComponentType.Float));
    this.__inputs.push(new Socket('interval', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.0)));
    this.__outputs.push(new Socket('outPosition', compositionType, ComponentType.Float));
  }

  /**
   * Gets the output socket that contains the result of the subtraction operation.
   *
   * @returns The output socket containing the subtraction result
   */
  getSocketOutput() {
    return this.__outputs[0];
  }

  /**
   * Generates the appropriate shader function name derivative based on the current
   * rendering backend and input socket types.
   *
   * For WebGPU, this method generates type-specific function names to handle
   * different combinations of composition and component types. For WebGL,
   * it returns the base shader function name.
   *
   * @returns The shader function name derivative for the current configuration
   *
   * @throws {Error} Throws an error if the input socket type combination is not implemented
   */
  getShaderFunctionNameDerivative(engine: Engine) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (
        this.__inputs[0].compositionType === CompositionType.Vec2 &&
        this.__inputs[1].compositionType === CompositionType.Vec2
      ) {
        return `${this.__shaderFunctionName}Vec2f`;
      }
      if (
        this.__inputs[0].compositionType === CompositionType.Vec3 &&
        this.__inputs[1].compositionType === CompositionType.Vec3
      ) {
        return `${this.__shaderFunctionName}Vec3f`;
      }
      throw new Error('Not implemented');
    }
    return this.__shaderFunctionName;
  }
}
