import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';
/**
 * A domain node that twists the position around the Z axis.
 * The rotation angle grows with the position's Z coordinate and the strength.
 */
export declare class TwistZShaderNode extends AbstractShaderNode {
    constructor();
    getSocketOutput(): Socket<string, import("../../..").CompositionTypeEnum, import("../../..").ComponentTypeEnum, import("../../core/Socket").SocketDefaultValue>;
}
