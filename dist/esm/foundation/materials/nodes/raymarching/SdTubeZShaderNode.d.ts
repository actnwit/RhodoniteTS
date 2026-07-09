import { AbstractShaderNode } from '../../core/AbstractShaderNode';
/**
 * A shader node that computes the signed distance function of a tube along the Z axis.
 * This node accepts a position and outputs the signed distance to the tube along the Z axis.
 *
 * @example
 * ```typescript
 * // Create a tube node along the Z axis
 * const barNode = new SdTubeZShaderNode();
 * ```
 */
export declare class SdTubeZShaderNode extends AbstractShaderNode {
    /**
     * Creates a new SdTubeZShaderNode instance.
     */
    constructor();
}
