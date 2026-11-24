import { AbstractShaderNode } from '../../core/AbstractShaderNode';
/**
 * A shader node that computes the signed distance function of a capsule.
 * The capsule is the set of points within `radius` of the line segment
 * from `pointA` to `pointB`.
 */
export declare class SdCapsuleShaderNode extends AbstractShaderNode {
    constructor();
}
