import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';
/**
 * A domain node that twists the position around the Y axis.
 * The rotation angle grows with the position's Y coordinate and the strength.
 */
export declare class TwistYShaderNode extends AbstractShaderNode {
    constructor();
    getSocketOutput(): Socket<string, import("../../..").CompositionTypeEnum, import("../../..").ComponentTypeEnum, import("../../core/Socket").SocketDefaultValue>;
}
