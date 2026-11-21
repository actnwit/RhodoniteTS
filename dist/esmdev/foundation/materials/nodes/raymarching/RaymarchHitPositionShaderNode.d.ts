import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';
/**
 * A shader node that outputs the world position of the raymarching hit point.
 *
 * The value is only meaningful in the raymarching shading section (the nodes
 * reachable from an OutShadingColor node), which runs once for each hit fragment.
 */
export declare class RaymarchHitPositionShaderNode extends AbstractShaderNode {
    constructor();
    /**
     * Gets the output socket that contains the hit position in world space.
     */
    getSocketOutput(): Socket<string, import("../../..").CompositionTypeEnum, import("../../..").ComponentTypeEnum, import("../../core/Socket").SocketDefaultValue>;
}
