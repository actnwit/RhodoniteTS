import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';
/**
 * A shader node that subtracts the subtractor distance from the base distance
 * with a smooth transition (smooth difference), matching OpSubtraction's
 * base / subtractor semantics.
 */
export declare class OpSmoothSubtractionShaderNode extends AbstractShaderNode {
    constructor();
    getSocketOutput(): Socket<string, import("../../..").CompositionTypeEnum, import("../../..").ComponentTypeEnum, import("../../core/Socket").SocketDefaultValue>;
}
