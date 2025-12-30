import SdBoxShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/SdBox.glsl';
import SdBoxShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/SdBox.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { Vector3 } from '../../../math/Vector3';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that computes the signed distance function of a box.
 * This node accepts a position and outputs the signed distance to the box.
 *
 * @example
 * ```typescript
 * // Create a box node
 * const boxNode = new SdBoxShaderNode();
 * ```
 */
export class SdBoxShaderNode extends AbstractShaderNode {
  /**
   * Creates a new SdBoxShaderNode instance.
   */
  constructor() {
    super('sdBox', {
      codeGLSL: SdBoxShaderityObjectGLSL.code,
      codeWGSL: SdBoxShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__inputs.push(
      new Socket('position', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0.0, 0.0, 0.0))
    );
    this.__inputs.push(new Socket('size', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(1.0, 1.0, 1.0)));
    this.__outputs.push(
      new Socket('outDistance', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.0))
    );
  }
}
