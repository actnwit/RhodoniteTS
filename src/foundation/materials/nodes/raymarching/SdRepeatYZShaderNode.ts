import SdRepeatYZShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/SdRepeatYZ.glsl';
import SdRepeatYZShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/SdRepeatYZ.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that repeats a distance function along the YZ plane.
 *
 * @example
 * ```typescript
 * // Create a repeat node along the YZ plane
 * const repeatNode = new SdRepeatYZShaderNode();
 * ```
 */
export class SdRepeatYZShaderNode extends AbstractShaderNode {
  /**
   * Creates a new SdRepeatYZShaderNode.
   *
   */
  constructor() {
    super('sdRepeatYZ', {
      codeGLSL: SdRepeatYZShaderityObjectGLSL.code,
      codeWGSL: SdRepeatYZShaderityObjectWGSL.code,
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
