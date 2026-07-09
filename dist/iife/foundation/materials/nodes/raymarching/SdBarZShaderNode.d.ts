import { AbstractShaderNode } from '../../core/AbstractShaderNode';
/**
 * A shader node that computes the signed distance function of a bar along the Z axis.
 * This node accepts a position and outputs the signed distance to the bar along the Z axis.
 *
 * @example
 * ```typescript
 * // Create a bar node along the Z axis
 * const barNode = new SdBarZShaderNode();
 * ```
 */
export declare class SdBarZShaderNode extends AbstractShaderNode {
    /**
     * Creates a new SdBarZShaderNode instance.
     */
    constructor();
}
