import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import { IfStatementShader } from '../../../webgl/shaders/nodes/IfStatementShader';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

/**
 * A shader node that represents an if statement condition in the shader graph.
 * This node allows for conditional branching in shader execution based on a boolean condition.
 *
 * The node takes a boolean condition as input and provides an output that can be used
 * to control the flow of subsequent shader operations.
 *
 * @example
 * ```typescript
 * const ifNode = new IfStatementShaderNode();
 * // Connect a boolean condition to the 'condition' input
 * // Use the 'ifStart' output to control conditional shader execution
 * ```
 */
export class IfStatementShaderNode extends AbstractShaderNode {
  /**
   * Creates a new IfStatementShaderNode instance.
   *
   * Initializes the node with:
   * - A boolean 'condition' input that determines whether the if statement should execute
   * - An 'ifStart' output with unknown composition and component types that can be connected to subsequent nodes
   *
   * The node uses IfStatementShader as its underlying shader implementation for generating
   * the appropriate GLSL code for conditional branching.
   */
  constructor() {
    super('ifStatement', {
      commonPart: new IfStatementShader(),
    });

    this.__inputs.push({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Bool,
      name: 'condition',
    });
    this.__outputs.push({
      compositionType: CompositionType.Unknown,
      componentType: ComponentType.Unknown,
      name: 'ifStart',
    });
  }
}
