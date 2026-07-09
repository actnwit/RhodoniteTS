import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';
/**
 * A shader node that repeats a distance function along the Z plane.
 *
 * @example
 * ```typescript
 * // Create a repeat node along the Z plane
 * const repeatNode = new SdRepeatZShaderNode();
 * ```
 */
export declare class SdRepeatZShaderNode extends AbstractShaderNode {
    /**
     * Creates a new SdRepeatZShaderNode.
     *
     */
    constructor();
    /**
     * Gets the output socket that contains the result of the subtraction operation.
     *
     * @returns The output socket containing the subtraction result
     */
    getSocketOutput(): Socket<string, import("../../..").CompositionTypeEnum, import("../../..").ComponentTypeEnum, import("../../core/Socket").SocketDefaultValue>;
}
