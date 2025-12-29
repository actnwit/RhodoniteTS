import SdApplyTransformShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/SdApplyTransform.glsl';
import SdApplyTransformShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/SdApplyTransform.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Vector3 } from '../../../math/Vector3';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that applies a transform to a signed distance function.
 * This node accepts a position and a transform and outputs the signed distance to the transformed position.
 *
 * @example
 * ```typescript
 * // Create a transform node
 * const transformNode = new TransformShaderNode(CompositionType.Mat4, ComponentType.Float, CompositionType.Vec3, ComponentType.Float);
 * const sdApplyTransformNode = new SdApplyTransformShaderNode();
 * sdApplyTransformNode.setInput('position', transformNode.getOutput('outValue'));
 * sdApplyTransformNode.setInput('transform', transformNode.getOutput('outValue'));
 * sdApplyTransformNode.setOutput('outDistance', transformNode.getOutput('outValue'));
 * ```
 */
export class SdApplyTransformShaderNode extends AbstractShaderNode {
  /**
   * Creates a new SdSphereShaderNode instance.
   */
  constructor() {
    super('sdApplyTransform', {
      codeGLSL: SdApplyTransformShaderityObjectGLSL.code,
      codeWGSL: SdApplyTransformShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__inputs.push(
      new Socket('position', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0.0, 0.0, 0.0))
    );
    this.__inputs.push(
      new Socket('translation', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0.0, 0.0, 0.0))
    );
    this.__inputs.push(
      new Socket('xyzEulerAngles', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0.0, 0.0, 0.0))
    );
    this.__inputs.push(
      new Socket('scale', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(1.0, 1.0, 1.0))
    );
    this.__outputs.push(
      new Socket('outTransformedPosition', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0.0, 0.0, 0.0))
    );
  }
}
