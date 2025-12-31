import SdRepeatXShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/SdRepeatX.glsl';
import SdRepeatXShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/SdRepeatX.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that repeats a distance function along the X plane.
 *
 * @example
 * ```typescript
 * // Create a repeat node along the X plane
 * const repeatNode = new SdRepeatXShaderNode();
 * ```
 */
export class SdRepeatXShaderNode extends AbstractShaderNode {
  /**
   * Creates a new SdRepeatXShaderNode.
   *
   */
  constructor() {
    super('sdRepeatX', {
      codeGLSL: SdRepeatXShaderityObjectGLSL.code,
      codeWGSL: SdRepeatXShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__inputs.push(new Socket('position', CompositionType.Vec3, ComponentType.Float));
    this.__inputs.push(new Socket('interval', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.0)));
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
