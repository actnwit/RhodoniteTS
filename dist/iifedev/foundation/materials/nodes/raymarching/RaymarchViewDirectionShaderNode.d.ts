import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';
/**
 * A shader node that outputs the world-space direction from the hit point to the
 * camera. Only meaningful in the raymarching shading section.
 */
export declare class RaymarchViewDirectionShaderNode extends AbstractShaderNode {
    constructor();
    getSocketOutput(): Socket<string, import("../../..").CompositionTypeEnum, import("../../..").ComponentTypeEnum, import("../../core/Socket").SocketDefaultValue>;
}
