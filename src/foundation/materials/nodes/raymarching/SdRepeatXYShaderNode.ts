import SdRepeatXYShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/SdRepeatXY.glsl';
import SdRepeatXYShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/SdRepeatXY.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that repeats a distance function along the XY plane.
 *
 * @example
 * ```typescript
 * // Create a repeat node along the XY plane
 * const repeatNode = new SdRepeatXYShaderNode();
 * ```
 */
export class SdRepeatXYShaderNode extends AbstractShaderNode {
  /**
   * Creates a new SdRepeatXYShaderNode.
   *
   */
  constructor() {
    super('sdRepeatXY', {
      codeGLSL: SdRepeatXYShaderityObjectGLSL.code,
      codeWGSL: SdRepeatXYShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__inputs.push(new Socket('position', CompositionType.Vec3, ComponentType.Float));
    this.__inputs.push(new Socket('interval', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(1.0)));
    this.__outputs.push(new Socket('outPosition', CompositionType.Vec3, ComponentType.Float));
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
