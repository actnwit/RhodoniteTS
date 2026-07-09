import { AbstractShaderNode } from '../../core/AbstractShaderNode';
/**
 * A shader node that computes the signed distance function of a tube along the X axis.
 * This node accepts a position and outputs the signed distance to the tube along the X axis.
 *
 * @example
 * ```typescript
 * // Create a tube node along the X axis
 * const barNode = new SdTubeXShaderNode();
 * ```
 */
export declare class SdTubeXShaderNode extends AbstractShaderNode {
    /**
     * Creates a new SdTubeXShaderNode instance.
     */
    constructor();
}
