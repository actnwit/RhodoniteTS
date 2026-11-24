import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';
/**
 * A shader node that outputs the object id of the raymarching component whose SDF
 * is closest at the hit point.
 *
 * The value is the component's stable (component SID based) object id and is only
 * meaningful in the raymarching shading section (the nodes reachable from an
 * OutShadingColor node). It is recorded by the OutUnion node of each component,
 * which the engine feeds with the per-component id.
 */
export declare class RaymarchObjectIdShaderNode extends AbstractShaderNode {
    constructor();
    /**
     * Gets the output socket that contains the hit object id.
     */
    getSocketOutput(): Socket<string, import("../../..").CompositionTypeEnum, import("../../..").ComponentTypeEnum, import("../../core/Socket").SocketDefaultValue>;
}
