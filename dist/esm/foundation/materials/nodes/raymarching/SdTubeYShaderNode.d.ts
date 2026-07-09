import { AbstractShaderNode } from '../../core/AbstractShaderNode';
/**
 * A shader node that computes the signed distance function of a tube along the Y axis.
 * This node accepts a position and outputs the signed distance to the tube along the Y axis.
 *
 * @example
 * ```typescript
 * // Create a tube node along the Y axis
 * const barNode = new SdTubeYShaderNode();
 * ```
 */
export declare class SdTubeYShaderNode extends AbstractShaderNode {
    /**
     * Creates a new SdTubeYShaderNode instance.
     */
    constructor();
}
