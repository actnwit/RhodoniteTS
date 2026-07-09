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
export declare class DiscardShaderNode extends AbstractShaderNode {
    /**
     * Creates a new DiscardShaderNode instance.
     * Initializes the node with a DiscardShader instance and sets up the input socket
     * for receiving a boolean condition that determines whether to discard the fragment.
     */
    constructor();
    /**
     * Gets the input socket for connecting the discard condition.
     * The socket accepts a boolean value - when true, the fragment is discarded.
     *
     * @returns The input socket that accepts a boolean condition
     */
    getSocketInput(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
}
