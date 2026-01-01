import SdBarXShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/SdBarX.glsl';
import SdBarXShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/SdBarX.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { Vector3 } from '../../../math/Vector3';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that computes the signed distance function of a bar along the X axis.
 * This node accepts a position and outputs the signed distance to the bar along the X axis.
 *
 * @example
 * ```typescript
 * // Create a bar node along the X axis
 * const barNode = new SdBarXShaderNode();
 * ```
 */
export class SdBarXShaderNode extends AbstractShaderNode {
  /**
   * Creates a new SdBarXShaderNode instance.
   */
  constructor() {
    super('sdBarX', {
      codeGLSL: SdBarXShaderityObjectGLSL.code,
      codeWGSL: SdBarXShaderityObjectWGSL.code,
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
