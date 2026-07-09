import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
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
export declare class OutColorShaderNode extends AbstractShaderNode {
    /**
     * Creates a new OutColorShaderNode instance.
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
    getSocketInput(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
}
