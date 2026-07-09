import { AbstractShaderNode } from '../../core/AbstractShaderNode';
/**
 * A shader node that represents the initial position in a shader graph.
 * This node serves as the initial position node for fragment shaders, outputting a Vec3 position value.
 *
 * @example
 * ```typescript
 * const initialPositionNode = new InitialPositionShaderNode();
 * // Connect a position input to the node
 * somePositionNode.connect(initialPositionNode.getSocketInput());
 * ```
 */
export declare class InitialPositionShaderNode extends AbstractShaderNode {
    /**
     * Creates a new InitialPositionShaderNode instance.
     * Initializes the node with an InitialPositionShader instance and sets up the output socket
     * for receiving Vec3 position values.
     */
    constructor();
}
