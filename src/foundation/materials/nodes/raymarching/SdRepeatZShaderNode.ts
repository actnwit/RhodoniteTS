import SdRepeatZShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/SdRepeatZ.glsl';
import SdRepeatZShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/SdRepeatZ.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that repeats a distance function along the Z plane.
 *
 * @example
 * ```typescript
 * // Create a repeat node along the Z plane
 * const repeatNode = new SdRepeatZShaderNode();
 * ```
 */
export class SdRepeatZShaderNode extends AbstractShaderNode {
  /**
   * Creates a new SdRepeatZShaderNode.
   *
   */
  constructor() {
    super('sdRepeatZ', {
      codeGLSL: SdRepeatZShaderityObjectGLSL.code,
      codeWGSL: SdRepeatZShaderityObjectWGSL.code,
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
