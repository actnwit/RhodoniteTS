import { AbstractShaderNode } from '../../core/AbstractShaderNode';
/**
 * A shader node that computes the signed distance function of a bar along the X axis.
 * This node accepts a position and outputs the signed distance to the bar along the X axis.
 *
 * @example
 * ```typescript
 * // Create a bar node along the X axis
 * const barNode = new SdBarXShaderNode();
 * ```
 */
export declare class SdBarXShaderNode extends AbstractShaderNode {
    /**
     * Creates a new SdBarXShaderNode instance.
     */
    constructor();
}
