import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that represents the output position in a shader graph.
 * This node is typically used as a terminal node to define the final position
 * output of a vertex shader, accepting a Vec4 position value.
 */
export declare class OutPositionShaderNode extends AbstractShaderNode {
    /**
     * Creates a new OutPositionShaderNode instance.
     * Initializes the node with an 'outPosition' identifier and sets up
     * an input socket for Vec4 position values.
     */
    constructor();
    /**
     * Gets the input socket for this position output node.
     *
     * @returns The input socket that accepts Vec4 position values
     */
    getSocketInput(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
}
