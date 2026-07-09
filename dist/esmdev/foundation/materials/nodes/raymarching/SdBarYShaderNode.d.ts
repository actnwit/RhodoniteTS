import { AbstractShaderNode } from '../../core/AbstractShaderNode';
/**
 * A shader node that computes the signed distance function of a bar along the Y axis.
 * This node accepts a position and outputs the signed distance to the bar along the Y axis.
 *
 * @example
 * ```typescript
 * // Create a bar node along the Y axis
 * const barNode = new SdBarYShaderNode();
 * ```
 */
export declare class SdBarYShaderNode extends AbstractShaderNode {
    /**
     * Creates a new SdBarYShaderNode instance.
     */
    constructor();
}
