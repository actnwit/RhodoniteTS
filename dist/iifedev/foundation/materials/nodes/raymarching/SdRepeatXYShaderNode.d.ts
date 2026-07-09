import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';
/**
 * A shader node that repeats a distance function along the XY plane.
 *
 * @example
 * ```typescript
 * // Create a repeat node along the XY plane
 * const repeatNode = new SdRepeatXYShaderNode();
 * ```
 */
export declare class SdRepeatXYShaderNode extends AbstractShaderNode {
    /**
     * Creates a new SdRepeatXYShaderNode.
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
