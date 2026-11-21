import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';
/**
 * Terminal node of the raymarching shading section.
 *
 * Nodes reachable from this node are emitted in a separate shading function that
 * runs once per hit fragment (with the hit position and normal available through
 * the RaymarchHitPosition / RaymarchHitNormal nodes), instead of inside the
 * distance function `map()`, which is evaluated many times per pixel.
 */
export declare class OutShadingColorShaderNode extends AbstractShaderNode {
    constructor();
    /**
     * Gets the input socket that accepts the shading color (linear space).
     */
    getSocketInput(): Socket<string, import("../../..").CompositionTypeEnum, import("../../..").ComponentTypeEnum, import("../../core/Socket").SocketDefaultValue>;
}
