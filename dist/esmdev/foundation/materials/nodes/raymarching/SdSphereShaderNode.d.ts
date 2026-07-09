import { AbstractShaderNode } from '../../core/AbstractShaderNode';
/**
 * A shader node that computes the signed distance function of a sphere.
 * This node accepts a position and outputs the signed distance to the sphere.
 *
 * @example
 * ```typescript
 * // Create a sphere node
 * const sphereNode = new SdSphereShaderNode();
 * ```
 */
export declare class SdSphereShaderNode extends AbstractShaderNode {
    /**
     * Creates a new SdSphereShaderNode instance.
     */
    constructor();
}
