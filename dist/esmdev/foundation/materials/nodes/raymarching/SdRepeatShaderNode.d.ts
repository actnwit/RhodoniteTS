import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';
/**
 * A shader node that repeats a distance function along the X, Y, and Z axes.
 *
 * @example
 * ```typescript
 * // Create a repeat node along the X, Y, and Z axes
 * const repeatNode = new SdRepeatShaderNode();
 * ```
 */
export declare class SdRepeatShaderNode extends AbstractShaderNode {
    /**
     * Creates a new SdRepeatShaderNode.
     *
     */
    constructor();
    /**
     * Gets the output socket that contains the result of the repeat operation.
     *
     * @returns The output socket containing the repeat result
     */
    getSocketOutput(): Socket<string, import("../../..").CompositionTypeEnum, import("../../..").ComponentTypeEnum, import("../../core/Socket").SocketDefaultValue>;
}
