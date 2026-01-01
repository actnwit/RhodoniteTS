import SdBarZShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/SdBarZ.glsl';
import SdBarZShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/SdBarZ.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { Vector3 } from '../../../math/Vector3';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that computes the signed distance function of a bar along the Z axis.
 * This node accepts a position and outputs the signed distance to the bar along the Z axis.
 *
 * @example
 * ```typescript
 * // Create a bar node along the Z axis
 * const barNode = new SdBarZShaderNode();
 * ```
 */
export class SdBarZShaderNode extends AbstractShaderNode {
  /**
   * Creates a new SdBarZShaderNode instance.
   */
  constructor() {
    super('sdBarZ', {
      codeGLSL: SdBarZShaderityObjectGLSL.code,
      codeWGSL: SdBarZShaderityObjectWGSL.code,
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
