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
 * @example
 * ```typescript
 * const outColorNode = new OutColorShaderNode();
 * // Connect a color input to the node
 * someColorNode.connect(outColorNode.getSocketInput());
 * ```
 */
export class OutDistanceShaderNode extends AbstractShaderNode {
  /**
   * Creates a new OutColorShaderNode instance.
   * Initializes the node with an EndShader instance and sets up the input socket
   * for receiving Vec4 color values.
   */
  constructor() {
    super('outDistance', {
      commonPart: OutDistanceShader.getInstance(),
    });

    this.setShaderStage('Fragment');

    this.__inputs.push(new Socket('value', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.0)));
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
