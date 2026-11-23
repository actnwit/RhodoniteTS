import { SdApplyTransformShader } from '../../../../webgl/shaders/nodes/SdApplyTransform';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Vector3 } from '../../../math/Vector3';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that applies a transform to a signed distance function.
 * This node accepts a position and a transform and outputs the signed distance to the transformed position.
 *
 * The generated function also records the transform's smallest axis scale in a
 * per-node global. A raymarching terminal node multiplies the distances of the
 * subtree that uses this transform by it, so scaling the node below 1 does not make
 * sphere tracing overshoot the surface.
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
  private __scaleGlobalName: string;

  /**
   * Creates a new SdSphereShaderNode instance.
   */
  constructor() {
    super('sdApplyTransform', {});

    this.__shaderFunctionName += `_${this.__shaderNodeUid}`;
    this.__scaleGlobalName = `g_sdApplyTransformScale_${this.__shaderNodeUid}`;

    this.__commonPart = new SdApplyTransformShader(this.__shaderFunctionName, this.__scaleGlobalName);

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

  /**
   * Gets the global that receives this node's smallest axis scale. Raymarching
   * terminal nodes multiply the distances of their subtree by it.
   */
  get distanceScaleGlobalName(): string {
    return this.__scaleGlobalName;
  }
}
