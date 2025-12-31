import SdTubeYShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/SdTubeY.glsl';
import SdTubeYShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/SdTubeY.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { Vector3 } from '../../../math/Vector3';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that computes the signed distance function of a tube along the Y axis.
 * This node accepts a position and outputs the signed distance to the tube along the Y axis.
 *
 * @example
 * ```typescript
 * // Create a tube node along the Y axis
 * const barNode = new SdTubeYShaderNode();
 * ```
 */
export class SdTubeYShaderNode extends AbstractShaderNode {
  /**
   * Creates a new SdTubeYShaderNode instance.
   */
  constructor() {
    super('sdTubeY', {
      codeGLSL: SdTubeYShaderityObjectGLSL.code,
      codeWGSL: SdTubeYShaderityObjectWGSL.code,
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
