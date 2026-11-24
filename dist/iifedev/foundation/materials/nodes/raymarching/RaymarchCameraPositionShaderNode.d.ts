import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';
/**
 * A shader node that outputs the world-space camera position.
 * Only meaningful in the raymarching shading section.
 */
export declare class RaymarchCameraPositionShaderNode extends AbstractShaderNode {
    constructor();
    getSocketOutput(): Socket<string, import("../../..").CompositionTypeEnum, import("../../..").ComponentTypeEnum, import("../../core/Socket").SocketDefaultValue>;
}
