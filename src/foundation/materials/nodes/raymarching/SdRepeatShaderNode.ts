import SdRepeatShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/SdRepeat.glsl';
import SdRepeatShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/SdRepeat.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that repeats a distance function along the X, Y, and Z axes.
 *
 * @example
 * ```typescript
 * // Create a repeat node along the X, Y, and Z axes
 * const repeatNode = new SdRepeatShaderNode();
 * ```
 */
export class SdRepeatShaderNode extends AbstractShaderNode {
  /**
   * Creates a new SdRepeatShaderNode.
   *
   */
  constructor() {
    super('sdRepeat', {
      codeGLSL: SdRepeatShaderityObjectGLSL.code,
      codeWGSL: SdRepeatShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__inputs.push(new Socket('position', CompositionType.Vec3, ComponentType.Float));
    this.__inputs.push(new Socket('interval', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(1.0)));
    this.__outputs.push(new Socket('outPosition', CompositionType.Vec3, ComponentType.Float));
  }

  /**
   * Gets the output socket that contains the result of the repeat operation.
   *
   * @returns The output socket containing the repeat result
   */
  getSocketOutput() {
    return this.__outputs[0];
  }
}
