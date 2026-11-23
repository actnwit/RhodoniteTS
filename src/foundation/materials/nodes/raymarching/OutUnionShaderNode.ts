import { OutUnionShader } from '../../../../webgl/shaders/nodes/OutUnion';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that represents the union of two distances in a shader graph.
 * This node serves as the terminal node for fragment shaders, accepting two distance values
 * and outputting the minimum of the two.
 *
 * The generated function converts the distance of the component's local space into a
 * conservative world-space distance using the component's world matrix (see
 * {@link OutUnionShader}). The matrix uniform names are supplied by the merged graph
 * (`MaterialHelper.collectRrnJson`), one per component that uses `SdApplyWorldMatrix`.
 *
 * @example
 * ```typescript
 * const outUnionNode = new OutUnionShaderNode();
 * // Connect two distance inputs to the node
 * someColorNode.connect(outUnionNode.getSocketInput());
 * ```
 */
export class OutUnionShaderNode extends AbstractShaderNode {
  private __distanceCorrectionUniformNames: string[] = [];
  private __distanceScaleGlobalNames: string[] = [];

  /**
   * Creates a new OutUnionShaderNode instance.
   * Initializes the node with an EndShader instance and sets up the input socket
   * for receiving Vec4 color values.
   */
  constructor() {
    super('outUnion', {});

    this.__shaderFunctionName += `_${this.__shaderNodeUid}`;

    this.__commonPart = new OutUnionShader(this.__shaderFunctionName);

    this.setShaderStage('Fragment');

    this.__inputs.push(new Socket('value', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.0)));
    // The object id recorded when this component's SDF wins the union. The engine
    // connects a per-component id automatically; graphs without it record 0.
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
    this.__commonPart = new OutUnionShader(
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
