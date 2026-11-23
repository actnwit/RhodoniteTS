import { OutDistanceShader } from '../../../../webgl/shaders/nodes/OutDistance';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that represents the final output color in a shader graph.
 * This node serves as the terminal node for fragment shaders, accepting a Vec4 color value
 * and outputting it as the final rendered color.
 *
 * The generated function converts the distance of the component's local space into a
 * conservative world-space distance using the component's world matrix (see
 * {@link OutDistanceShader}). The matrix uniform names are supplied by the merged graph
 * (`MaterialHelper.collectRrnJson`), one per component that uses `SdApplyWorldMatrix`.
 *
 * @example
 * ```typescript
 * const outColorNode = new OutColorShaderNode();
 * // Connect a color input to the node
 * someColorNode.connect(outColorNode.getSocketInput());
 * ```
 */
export class OutDistanceShaderNode extends AbstractShaderNode {
  private __distanceCorrectionUniformNames: string[] = [];
  private __distanceScaleGlobalNames: string[] = [];

  /**
   * Creates a new OutColorShaderNode instance.
   * Initializes the node with an EndShader instance and sets up the input socket
   * for receiving Vec4 color values.
   */
  constructor() {
    super('outDistance', {});

    this.__shaderFunctionName += `_${this.__shaderNodeUid}`;

    this.__commonPart = new OutDistanceShader(this.__shaderFunctionName);

    this.setShaderStage('Fragment');

    this.__inputs.push(new Socket('value', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.0)));
    // The object id recorded when this distance wins. Injected per component.
    this.__inputs.push(new Socket('objectId', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.0)));
  }

  /**
   * Sets the per-component world matrix uniforms used to convert the local-space
   * distance to a conservative world-space distance.
   * @param uniformNames - Uniform names of the component's world matrices
   */
  setDistanceCorrectionUniformNames(uniformNames: readonly string[]) {
    this.__distanceCorrectionUniformNames = [...uniformNames];
    this.__rebuildCommonPart();
  }

  /**
   * Sets the per-`SdApplyTransform` scale globals of the transform nodes in this
   * terminal's subtree, so their local-space distances become world-space steps.
   * @param globalNames - Global names written by the reachable transform nodes
   */
  setDistanceScaleGlobalNames(globalNames: readonly string[]) {
    this.__distanceScaleGlobalNames = [...globalNames];
    this.__rebuildCommonPart();
  }

  private __rebuildCommonPart() {
    this.__commonPart = new OutDistanceShader(
      this.__shaderFunctionName,
      this.__distanceCorrectionUniformNames,
      this.__distanceScaleGlobalNames
    );
  }

  /**
   * Gets the input socket for connecting color values to this output node.
   * The socket accepts Vec4 values representing RGBA color components.
   *
   * @returns The input socket that accepts Vec4 color values
   */
  getSocketInput() {
    return this.__inputs[0];
  }
}
