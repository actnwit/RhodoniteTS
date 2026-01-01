import SdTubeXShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/SdTubeX.glsl';
import SdTubeXShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/SdTubeX.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { Vector3 } from '../../../math/Vector3';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that computes the signed distance function of a tube along the X axis.
 * This node accepts a position and outputs the signed distance to the tube along the X axis.
 *
 * @example
 * ```typescript
 * // Create a tube node along the X axis
 * const barNode = new SdTubeXShaderNode();
 * ```
 */
export class SdTubeXShaderNode extends AbstractShaderNode {
  /**
   * Creates a new SdTubeXShaderNode instance.
   */
  constructor() {
    super('sdTubeX', {
      codeGLSL: SdTubeXShaderityObjectGLSL.code,
      codeWGSL: SdTubeXShaderityObjectWGSL.code,
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
