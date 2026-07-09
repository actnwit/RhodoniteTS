import { AbstractShaderNode } from '../../core/AbstractShaderNode';
/**
 * A shader node that computes the signed distance function of a box.
 * This node accepts a position and outputs the signed distance to the box.
 *
 * @example
 * ```typescript
 * // Create a box node
 * const boxNode = new SdBoxShaderNode();
 * ```
 */
export declare class SdBoxShaderNode extends AbstractShaderNode {
    /**
     * Creates a new SdBoxShaderNode instance.
     */
    constructor();
}
