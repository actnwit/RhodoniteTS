import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';
/**
 * A shader node that repeats a distance function along the ZX plane.
 *
 * @example
 * ```typescript
 * // Create a repeat node along the ZX plane
 * const repeatNode = new SdRepeatZXShaderNode();
 * ```
 */
export declare class SdRepeatZXShaderNode extends AbstractShaderNode {
    /**
     * Creates a new SdRepeatZXShaderNode.
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
