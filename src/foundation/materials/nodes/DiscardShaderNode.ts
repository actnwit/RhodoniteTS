import { DiscardShader } from '../../../webgl/shaders/nodes/DiscardShader';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that discards the current fragment based on a condition.
 * This node is used in fragment shaders to conditionally discard fragments,
 * which is useful for implementing alpha testing, cutout effects, and other
 * techniques that require discarding pixels.
 *
 * @example
 * ```typescript
 * const discardNode = new DiscardShaderNode();
 * // Connect a boolean condition to the node
 * // When the condition is true, the fragment will be discarded
 * someConditionNode.connect(discardNode.getSocketInput());
 * ```
 */
export class DiscardShaderNode extends AbstractShaderNode {
  /**
   * Creates a new DiscardShaderNode instance.
   * Initializes the node with a DiscardShader instance and sets up the input socket
   * for receiving a boolean condition that determines whether to discard the fragment.
   */
  constructor() {
    super('conditionalDiscard', {
      commonPart: DiscardShader.getInstance(),
    });

    this.setShaderStage('Fragment');

    this.__inputs.push(new Socket('condition', CompositionType.Scalar, ComponentType.Bool));
  }

  /**
   * Gets the input socket for connecting the discard condition.
   * The socket accepts a boolean value - when true, the fragment is discarded.
   *
   * @returns The input socket that accepts a boolean condition
   */
  getSocketInput() {
    return this.__inputs[0];
  }
}

