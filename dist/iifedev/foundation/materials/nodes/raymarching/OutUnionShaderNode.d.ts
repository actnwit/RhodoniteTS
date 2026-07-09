import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';
/**
 * A shader node that represents the union of two distances in a shader graph.
 * This node serves as the terminal node for fragment shaders, accepting two distance values
 * and outputting the minimum of the two.
 *
 * @example
 * ```typescript
 * const outUnionNode = new OutUnionShaderNode();
 * // Connect two distance inputs to the node
 * someColorNode.connect(outUnionNode.getSocketInput());
 * ```
 */
export declare class OutUnionShaderNode extends AbstractShaderNode {
    /**
     * Creates a new OutUnionShaderNode instance.
     * Initializes the node with an EndShader instance and sets up the input socket
     * for receiving Vec4 color values.
     */
    constructor();
    /**
     * Gets the input socket for connecting color values to this output node.
     * The socket accepts Vec4 values representing RGBA color components.
     *
     * @returns The input socket that accepts Vec4 color values
     */
    getSocketInput(): Socket<string, import("../../..").CompositionTypeEnum, import("../../..").ComponentTypeEnum, import("../../core/Socket").SocketDefaultValue>;
}
