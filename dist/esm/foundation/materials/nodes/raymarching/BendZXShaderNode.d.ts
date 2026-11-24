import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';
/**
 * A domain node that bends the position in the ZX plane.
 * The rotation angle grows with the position's Z coordinate and the strength.
 */
export declare class BendZXShaderNode extends AbstractShaderNode {
    constructor();
    getSocketOutput(): Socket<string, import("../../..").CompositionTypeEnum, import("../../..").ComponentTypeEnum, import("../../core/Socket").SocketDefaultValue>;
}
