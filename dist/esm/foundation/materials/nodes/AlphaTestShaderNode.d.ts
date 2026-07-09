import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that performs alpha testing on a fragment.
 * This node is used in fragment shaders to conditionally discard fragments based on the color value and alpha cutoff value,
 * which is useful for implementing alpha testing, cutout effects, and other
 * techniques that require discarding pixels based on the color value and alpha cutoff value.
 *
 * @example
 * ```typescript
 * const alphaTestNode = new AlphaTestShaderNode();
 * // Connect the color value to the node
 * // When the alpha value is less than the alpha cutoff, the fragment will be discarded
 * colorNode.connect(alphaTestNode.getSocketInputColor());
 * alphaCutoffNode.connect(alphaTestNode.getSocketInputAlphaCutoff());
 * forceCutoffNode.connect(alphaTestNode.getSocketInputForceCutoff());
 * ```
 */
export declare class AlphaTestShaderNode extends AbstractShaderNode {
    /**
     * Creates a new AlphaTestShaderNode instance.
     * Initializes the node with a AlphaTestShaderityObject instance and sets up the input socket
     * for receiving a vec4 color value and a float alpha cutoff value.
     */
    constructor();
    /**
     * Gets the input socket for connecting the alpha value.
     * The socket accepts a float value - when the alpha value is less than the alpha cutoff, the fragment will be discarded.
     *
     * @returns The input socket that accepts a vec4 value
     */
    getSocketInput(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
}
