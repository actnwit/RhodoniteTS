import SdBarYShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/SdBarY.glsl';
import SdBarYShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/SdBarY.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { Vector3 } from '../../../math/Vector3';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that computes the signed distance function of a bar along the Y axis.
 * This node accepts a position and outputs the signed distance to the bar along the Y axis.
 *
 * @example
 * ```typescript
 * // Create a bar node along the Y axis
 * const barNode = new SdBarYShaderNode();
 * ```
 */
export class SdBarYShaderNode extends AbstractShaderNode {
  /**
   * Creates a new SdBarYShaderNode instance.
   */
  constructor() {
    super('sdBarY', {
      codeGLSL: SdBarYShaderityObjectGLSL.code,
      codeWGSL: SdBarYShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__inputs.push(
      new Socket('position', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0.0, 0.0, 0.0))
    );
    this.__inputs.push(new Socket('width', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(1.0)));
    this.__outputs.push(
      new Socket('outDistance', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.0))
    );
  }
}
